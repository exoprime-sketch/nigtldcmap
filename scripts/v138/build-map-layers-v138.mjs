#!/usr/bin/env node
/**
 * Connect the 43 user-selected map targets to the map index.
 *
 * The ETL publishes twelve layers. The other thirty-one targets already carry
 * their spatial meaning in the published packs - a GADM GID_1 key per province
 * row, a PSMSL station id per sea-level row, a geocoded office address - and
 * nothing read it. This step reads the packs the way the ETL's spatial builder
 * reads its own observations, joins each row to the verified 63-province
 * boundary through the repository's alias table, and writes:
 *
 *   public/data/vietnam/v2/spatial/layers/<id>.json   (admin1 / region layers)
 *   public/data/vietnam/v2/map-index.json              (layers + counts)
 *   public/data/vietnam/v2/catalog.json                (mapMode, mapFeatureCount)
 *   public/data/vietnam/v2/manifest.json               (mapLayerCount, mapFeatureCount)
 *   reports/v138/map-targets-build-v138.json           (per-target evidence)
 *
 * What it refuses to do: invent a location. A target whose rows carry only a
 * province representative point for a finer unit (B-017 assessment zones), or
 * whose basin polygon file was never delivered (B-025), is recorded with the
 * asset it needs rather than drawn as if the point were the thing.
 *
 * Run after the ETL and before asset-integrity:
 *   node scripts/v138/build-map-layers-v138.mjs [--data public/data/vietnam/v2]
 */
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { gunzipSync } from "node:zlib";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  boundaryPolicyForLayer,
  buildLocationSidecar,
  isAggregatingKind,
  loadProvinceLocator,
} from "../v151-2/boundary-policy-build-v151-2.mjs";

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(SCRIPT_DIR, "../..");
import { resolveDataRootV158 } from "../v158/country-context-v158.mjs";
import {
  buildGroupConstantInputsV157_2,
  buildMineJoinV157_2,
} from "../v157-2/map12-builders-v157-2.mjs";

const argv = process.argv.slice(2);
const opt = (name, fallback) => {
  const index = argv.indexOf(name);
  return index < 0 ? fallback : argv[index + 1];
};
// V158: --data / VIETNAM_DATA_ROOT keep priority; --country picks the tree.
const DATA = resolveDataRootV158({
  root: ROOT,
  argv,
  env: opt("--data", process.env.VIETNAM_DATA_ROOT || null),
});
const CONTRACT_PATH = resolve(ROOT, "src/data/visualization/publicMapTargetsV138.json");
const REPORT_PATH = resolve(ROOT, "reports/v138/map-targets-build-v138.json");
const GENERATED_AT = "2026-09-01T00:00:00Z";
const GEOMETRY_URL = "/data/vietnam/v2/geometry/vnm-adm1-63.geojson";
const LAYER_ID_PREFIX = "vnm-v138-";
const PENDING_LAYER_ID_PREFIX = "vnm-v155-";
/** The published prefix a declared asset URL already uses ("/data/vietnam/v2/"). */
const publishedPrefix = (url) => String(url).slice(0, String(url).indexOf("spatial/"));
// Rows above this go out as a value table; the runtime expands them.
const VALUE_TABLE_THRESHOLD = 4000;
// Approximate land extent of Viet Nam. Used only to keep a foreign head office
// off the Vietnamese map; a hydrological station in Cambodia is kept because
// its layer does not ask for this test.
const VIETNAM_BBOX = { west: 102.1, east: 109.6, south: 8.1, north: 23.5 };

const SCENARIO_LABELS = {
  historical: "과거 모형(historical)",
  ssp119: "SSP1-1.9",
  ssp126: "SSP1-2.6",
  ssp245: "SSP2-4.5",
  ssp370: "SSP3-7.0",
  ssp460: "SSP4-6.0",
  ssp585: "SSP5-8.5",
};
const SCENARIO_ORDER = ["historical", "ssp119", "ssp126", "ssp245", "ssp370", "ssp460", "ssp585"];

// ---------------------------------------------------------------- helpers

function readJson(path) {
  return JSON.parse(readFileSync(path, "utf8"));
}

function writeJson(path, value) {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`);
}

function canonicalJson(value) {
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(",")}]`;
  if (value && typeof value === "object") {
    return `{${Object.keys(value)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${canonicalJson(value[key])}`)
      .join(",")}}`;
  }
  return JSON.stringify(value);
}

function sha256(text) {
  return createHash("sha256").update(text).digest("hex");
}

/** Fold a place name the way tools/etl/b034_facts_v137.normalize_place does. */
export function normalizePlace(name) {
  const text = String(name ?? "").trim();
  const stripped = text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/Đ/g, "D")
    .replace(/đ/g, "d");
  const spaced = stripped.replace(/(?<=[a-z])(?=[A-Z])/g, " ").replace(/[^0-9A-Za-z]+/g, " ");
  return spaced.toLowerCase().split(/\s+/).filter(Boolean).join(" ");
}

/**
 * "Da Nang city" / "Tỉnh Nghệ An" / "Ho Chi Minh city" -> the bare name.
 *
 * V151: the administrative-type words are only stripped where they actually
 * occur. Vietnamese writes them as a prefix ("Tỉnh Nghệ An", "TP Hồ Chí Minh")
 * and English as a suffix ("Da Nang city"). Stripping "tinh" anywhere folded
 * "Hà Tĩnh" to "ha", because the province's own name ends in that syllable.
 */
function normalizeAdministrativeName(name) {
  return normalizePlace(name)
    .replace(/^(?:city|province|tinh|thanh pho|tp)\b/, " ")
    .replace(/\b(?:city|province)$/, " ")
    .split(/\s+/)
    .filter(Boolean)
    .join(" ");
}

function text(value) {
  if (value === null || value === undefined) return "";
  if (typeof value === "number") return Number.isFinite(value) ? String(value) : "";
  return String(value).trim();
}

function numeric(value) {
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (typeof value !== "string") return null;
  const cleaned = value.replace(/,/g, "").trim();
  if (!cleaned || !/^-?\d+(\.\d+)?$/.test(cleaned)) return null;
  const parsed = Number(cleaned);
  return Number.isFinite(parsed) ? parsed : null;
}

function periodKeyOf(value) {
  const asText = text(value);
  if (/^\d{4}(\.0)?$/.test(asText)) return asText.slice(0, 4);
  const match = asText.match(/^(\d{4})-\d{2}-\d{2}$/);
  if (match) return match[1];
  return asText;
}

function sortPeriods(values) {
  return [...values].sort((left, right) => {
    const l = left.match(/^\d{4}/);
    const r = right.match(/^\d{4}/);
    if (l && r && l[0] !== r[0]) return Number(l[0]) - Number(r[0]);
    return left.localeCompare(right, "en");
  });
}

// ---------------------------------------------------------------- inputs

function loadPacks() {
  const index = readJson(resolve(DATA, "packs/bundle-index-v124.json"));
  const cache = new Map();
  const elements = new Map();
  for (const [elementId, entry] of Object.entries(index.elements)) {
    const path = resolve(DATA, entry.packUrl.replace(/^\/data\/vietnam\/v2\//, ""));
    let shard = cache.get(path);
    if (!shard) {
      const envelope = readJson(path);
      const compressed = Buffer.from(envelope.payloadChunks.join(""), "base64");
      shard = JSON.parse(gunzipSync(compressed).toString("utf8"));
      cache.set(path, shard);
    }
    elements.set(elementId, shard.elements[elementId]);
  }
  return elements;
}

function loadBoundaries() {
  const geometry = readJson(resolve(DATA, "geometry/vnm-adm1-63.geojson"));
  const aliases = readJson(resolve(DATA, "geometry/vnm-adm1-aliases.json"));
  const nameByCode = new Map(
    geometry.features.map((feature) => [feature.properties.adm1Code, feature.properties.name])
  );
  if (nameByCode.size !== 63) throw new Error(`expected 63 boundary features, got ${nameByCode.size}`);
  const lookup = new Map();
  for (const row of aliases.aliases || []) {
    const names = new Set([row.canonicalName, row.normalizedKey, ...(row.variants || [])]);
    for (const name of names) {
      const key = normalizePlace(name);
      if (key) lookup.set(key, { adm1Code: row.adm1Code, adm1Name: nameByCode.get(row.adm1Code) });
    }
  }
  return { nameByCode, lookup };
}

/**
 * The 2025 reorganisation: the official 63 -> 34 table.
 *
 * V162: read from the published 34-unit boundary (memberAdm1Codes, Resolution
 * 202/2025/QH15), not from a data column. The 2026-09-30 delivery renamed the
 * column B-003 used to carry and also files 34-unit rows in the same sheet, so
 * deriving the table from the data left it empty. The delivery's own table
 * matched this one 34/34 (reports/v162/crosswalk34-compare-v162.json).
 * A value filed under a 34-unit name is shown on the union of its member
 * 63-unit boundaries and never redistributed.
 */
function buildReorganisationCrosswalk(boundaries34) {
  const membersByParent = new Map();
  const parentByCode = new Map();
  for (const unit of boundaries34.units) {
    const parentKey = normalizeAdministrativeName(unit.name);
    membersByParent.set(parentKey, { label: unit.name, codes: new Set(unit.memberAdm1Codes) });
    for (const code of unit.memberAdm1Codes) parentByCode.set(code, { key: parentKey, label: unit.name });
  }
  if (membersByParent.size !== 34 || parentByCode.size !== 63) {
    throw new Error(`63->34 table must cover 34 units and 63 members, got ${membersByParent.size}/${parentByCode.size}`);
  }
  return { membersByParent, parentByCode };
}

/** The 34 post-2025 units, looked up by their own name only. */
function loadBoundaries34() {
  // The 34-unit boundary is not an ETL output, so a staging tree lacks it; the
  // published one is the same legal table (Resolution 202/2025/QH15).
  const staged = resolve(DATA, "geometry/vnm-adm1-34.geojson");
  const geometry = readJson(
    existsSync(staged) ? staged : resolve(ROOT, "public/data/vietnam/v2/geometry/vnm-adm1-34.geojson")
  );
  const units = geometry.features.map((feature) => ({
    unitCode: feature.properties.unitCode,
    name: feature.properties.name,
    memberAdm1Codes: feature.properties.memberAdm1Codes || [],
  }));
  if (units.length !== 34) throw new Error(`expected 34 boundary features, got ${units.length}`);
  const lookup = new Map();
  for (const unit of units) {
    for (const key of [normalizePlace(unit.name), normalizeAdministrativeName(unit.name)]) {
      if (key) lookup.set(key, unit);
    }
  }
  return { units, lookup };
}

/**
 * V162: the administrative system of one source row - adm1 (post-2025 34),
 * adm1-prev (pre-2025 63), country, or null. The ETL stamps `regionSystem`;
 * older trees are read from the row's own 행정단위 and indicator.
 */
export function regionSystemOfRecord(record) {
  if (record?.regionSystem) return record.regionSystem;
  const unit = text(record?.normalizedAttributes?.["행정단위"]);
  if (/_adm34$/u.test(String(record?.indicatorId || "")) || /개편 후|체계/u.test(unit)) return "adm1";
  if (/^country$/iu.test(unit)) return "country";
  if (/^(province|city|province\/city)$/iu.test(unit)) return "adm1-prev";
  return null;
}

// V162: the region columns under the names every country shares, then the
// Viet Nam-specific names of the deliveries before 2026-09-30.
const REGION_NAME_KEYS_V162 = ["지역명_현지어", "지역명_베트남어", "지역명", "지역명_로마자"];
const UNIT34_NAME_KEYS_V162 = ["지역명_현지어", "지역명_베트남어", "개편_후_소속_단위", "2025_개편_후_소속_34개_체계", "지역명_로마자"];

/**
 * V162: the values a sheet states for the 34 post-2025 units itself.
 *
 * `specs` say which column holds which map variable; the rows are the sheet's
 * 34-unit rows only. A value is copied as printed - nothing is derived from the
 * 63-unit rows here (that is the runtime aggregation, used only where no row
 * below exists for the selected variable and period).
 */
function buildSource34Values(records, specs, boundaries34) {
  const byKey = new Map();
  const unmatched = new Map();
  let duplicateValueCount = 0;
  for (const record of records) {
    const attributes = record.normalizedAttributes || {};
    let unit = null;
    for (const key of UNIT34_NAME_KEYS_V162) {
      const raw = text(attributes[key]);
      if (!raw) continue;
      unit = boundaries34.lookup.get(normalizePlace(raw)) || boundaries34.lookup.get(normalizeAdministrativeName(raw));
      if (unit) break;
    }
    if (!unit) {
      const label = text(attributes["지역명_현지어"]) || text(attributes["지역명_로마자"]) || text(record.recordId);
      unmatched.set(label, (unmatched.get(label) || 0) + 1);
      continue;
    }
    for (const spec of specs) {
      if (spec.where && Object.entries(spec.where).some(([key, wanted]) => text(attributes[key]) !== text(wanted))) continue;
      const value = numeric(attributes[spec.sourceKey]);
      if (value === null) continue;
      const variable = spec.variableOf(attributes);
      const period = spec.periodOf(attributes);
      if (!variable || !period) continue;
      const key = `${variable} ${period} ${unit.unitCode}`;
      if (byKey.has(key)) {
        duplicateValueCount += 1;
        continue;
      }
      byKey.set(key, {
        unitCode: unit.unitCode,
        unitName: unit.name,
        variable,
        variableLabel: spec.labelOf(attributes),
        period,
        value,
        unit: spec.unit,
        sourceIndicatorId: record.indicatorId,
        sourceRecordId: record.recordId,
        sourceSpatialUnit: "admin1-34",
        ...(spec.categoryKey && text(attributes[spec.categoryKey]) ? { categoryLabel: text(attributes[spec.categoryKey]) } : {}),
        imputed: false,
      });
    }
  }
  return { rows: [...byKey.values()], unmatched, duplicateValueCount, sourceRowCount: records.length };
}

/** Keep the 34-unit values for the variable/period pairs the layer offers. */
function source34Section(source34, selectors) {
  if (!source34) return null;
  const offered = new Set(
    (selectors?.variables || []).flatMap((option) => option.periods.map((period) => `${option.key} ${period}`))
  );
  const rows = source34.rows
    .filter((row) => offered.has(`${row.variable} ${row.period}`))
    .sort((a, b) => a.variable.localeCompare(b.variable) || a.period.localeCompare(b.period) || a.unitCode.localeCompare(b.unitCode));
  const series = new Map();
  for (const row of rows) series.set(`${row.variable} ${row.period}`, (series.get(`${row.variable} ${row.period}`) || 0) + 1);
  return {
    rows,
    validation: {
      sourceRowCount: source34.sourceRowCount,
      publishedValueCount: rows.length,
      seriesCount: series.size,
      duplicateValueCount: source34.duplicateValueCount,
      unmatchedSourceNameCount: [...source34.unmatched.values()].reduce((sum, count) => sum + count, 0),
      unmatchedSourceNames: [...source34.unmatched.keys()].sort(),
    },
  };
}

/** Rows of one system; a sheet that files both never lends one to the other. */
function rowsOfSystem(records, system) {
  return records.filter((record) => regionSystemOfRecord(record) === system);
}

// ---------------------------------------------------------------- catalog facts

function catalogEntry(catalog, elementId) {
  return catalog.elements.find((item) => item.elementId === elementId);
}

function baseLayerFacts(entry, target) {
  return {
    category: target.category,
    detailElementId: target.elementId,
    detailUrl: `/?element=${target.elementId.toLowerCase()}&country=VNM#element-detail`,
    downloadStatus: entry?.downloadAllowed ? "available" : "unavailable",
    downloadableRecordCount: entry?.downloadableRecordCount ?? 0,
    elementId: target.elementId,
    label: target.publicName,
    licenses: entry?.rights?.licenses || [],
    publicShortTitle: target.publicName,
    rawLabel: entry?.elementLabel || target.publicName,
    source: (entry?.sourceOrganizations || []).join(" · "),
    sourceOrganizations: entry?.sourceOrganizations || [],
    sourceUrls: entry?.sourceUrls || [],
    scopeCountries: ["VNM"],
    defaultOverlay: false,
    defaultPrimary: false,
    fakeGeometryCount: 0,
    zeroImputationCount: 0,
    regionalProject: false,
    spatialStatus: "ready",
    mapTargetV138: {
      sourceSpatialUnit: target.sourceSpatialUnit,
      displaySpatialUnit: target.displaySpatialUnit,
      limitation: target.limitation,
      evidence: target.evidence,
      representativeItem: target.representativeItem,
    },
  };
}

// ---------------------------------------------------------------- admin1 builders

function measureLabelWithScenario(measure, scenario) {
  return scenario ? `${measure.label} · ${SCENARIO_LABELS[scenario] || scenario}` : measure.label;
}

/**
 * Periods a map layer offers for a long series: every `step` years plus the
 * first and last year of each scenario, so a reader always reaches both ends.
 */
function thinPeriods(periods, step) {
  if (!step || step <= 1) return periods;
  const sorted = sortPeriods(periods);
  const years = sorted.filter((period) => /^\d{4}$/.test(period)).map(Number);
  if (years.length !== sorted.length) return sorted;
  const first = years[0];
  const last = years[years.length - 1];
  const kept = years.filter((year) => year === first || year === last || year % step === 0);
  return kept.map(String);
}

function buildAdmin1Layer(target, packs, boundaries, catalog, report) {
  const { build } = target;
  const element = packs.get(target.elementId);
  const entry = catalogEntry(catalog, target.elementId);
  const allRecords = element?.entities?.records || [];
  // V162: the 63-unit map reads the 63-unit (adm1-prev) rows only. A sheet
  // that also files 34-unit rows keeps them for the 34 outline below.
  const hasPrevRows = allRecords.some((record) => regionSystemOfRecord(record) === "adm1-prev");
  const records = allRecords.filter(
    (record) =>
      (hasPrevRows ? regionSystemOfRecord(record) === "adm1-prev" : regionSystemOfRecord(record) !== "adm1") &&
      (!build.indicatorIds || build.indicatorIds.includes(record.indicatorId)) &&
      (!build.requireCoordinates || (typeof record.latitude === "number" && typeof record.longitude === "number"))
  );
  const regionKeys = build.regionKeys || REGION_NAME_KEYS_V162;
  const unmatched = new Map();
  const members = new Map(); // adm1Code -> member records (documents etc.)
  // series key -> Map<adm1Code, row>
  const series = new Map();
  const seriesMeta = new Map();
  let sourceValueCount = 0;
  let duplicateValueCount = 0;
  let providedZeroCount = 0;

  const resolveRegion = (attributes) => {
    for (const key of regionKeys) {
      const raw = text(attributes[key]);
      if (!raw) continue;
      // A row that names its own province in the 34-unit successor's name
      // column would map several provinces onto one code; only the province's
      // own name columns are tried.
      const match =
        boundaries.lookup.get(normalizePlace(raw)) ||
        boundaries.lookup.get(normalizeAdministrativeName(raw));
      if (match) return match;
      unmatched.set(raw, (unmatched.get(raw) || 0) + 1);
    }
    return null;
  };

  for (const record of records) {
    const attributes = record.normalizedAttributes || {};
    const region = resolveRegion(attributes);
    if (!region) continue;
    const scenario = build.scenarioKey ? text(attributes[build.scenarioKey]).toLowerCase() : "";
    const period = build.periodFixed
      ? build.periodFixed
      : build.periodKey
        ? periodKeyOf(attributes[build.periodKey]) || "미기재"
        : "미기재";
    if (build.memberRecords) {
      const list = members.get(region.adm1Code) || [];
      list.push({
        recordId: record.recordId,
        label: text(attributes[build.memberRecords.labelKey]) || text(record.name),
        date: build.memberRecords.dateKey ? text(attributes[build.memberRecords.dateKey]) : "",
        status: build.memberRecords.statusKey ? text(attributes[build.memberRecords.statusKey]) : "",
        value: build.memberRecords.valueKey ? text(attributes[build.memberRecords.valueKey]) : "",
        url: build.memberRecords.urlKey ? text(attributes[build.memberRecords.urlKey]) : "",
        indicatorId: record.indicatorId,
      });
      members.set(region.adm1Code, list);
    }
    for (const measure of build.measures) {
      const variable = scenario ? `${measure.key}--${scenario}` : measure.key;
      const key = `${variable} ${period}`;
      let bucket = series.get(key);
      if (!bucket) {
        bucket = new Map();
        series.set(key, bucket);
        seriesMeta.set(key, {
          variable,
          period,
          measure,
          scenario,
          label: measureLabelWithScenario(measure, scenario),
        });
      }
      if (measure.aggregate === "count") {
        const existing = bucket.get(region.adm1Code);
        if (existing) {
          existing.value += 1;
        } else {
          bucket.set(region.adm1Code, {
            adm1Code: region.adm1Code,
            adm1Name: region.adm1Name,
            variable,
            variableLabel: measureLabelWithScenario(measure, scenario),
            period,
            value: 1,
            unit: measure.unit,
            sourceIndicatorId: record.indicatorId,
            sourceRecordId: record.recordId,
            sourceSpatialUnit: "admin1",
            imputed: false,
          });
        }
        sourceValueCount += 1;
        continue;
      }
      const value = numeric(attributes[measure.sourceKey]);
      if (value === null) continue;
      sourceValueCount += 1;
      if (value === 0) providedZeroCount += 1;
      if (bucket.has(region.adm1Code)) {
        duplicateValueCount += 1;
        continue;
      }
      bucket.set(region.adm1Code, {
        adm1Code: region.adm1Code,
        adm1Name: region.adm1Name,
        variable,
        variableLabel: measureLabelWithScenario(measure, scenario),
        period,
        value,
        unit: measure.unit,
        // V157: a province table may state a category alongside its number
        // (B-026's dominant flow direction). The map colours by the category and
        // keeps the number for the popup; the category is copied, not derived.
        ...(build.categoryKey && text(attributes[build.categoryKey])
          ? { categoryLabel: text(attributes[build.categoryKey]) }
          : {}),
        sourceIndicatorId: record.indicatorId,
        sourceRecordId: record.recordId,
        sourceSpatialUnit: "admin1",
        imputed: false,
      });
    }
  }

  // V162: the same measures read from the sheet's own 34-unit rows (indicator
  // `<id>_adm34`). Counts are not re-counted here; the runtime sums them.
  const rows34 = rowsOfSystem(allRecords, "adm1").filter(
    (record) => !build.indicatorIds || build.indicatorIds.includes(String(record.indicatorId).replace(/_adm34$/u, ""))
  );
  const scenarioOf = (attributes) => (build.scenarioKey ? text(attributes[build.scenarioKey]).toLowerCase() : "");
  const source34 = rows34.length
    ? buildSource34Values(
        rows34,
        build.measures
          .filter((measure) => measure.aggregate !== "count")
          .map((measure) => ({
            sourceKey: measure.sourceKey,
            unit: measure.unit,
            categoryKey: build.categoryKey,
            variableOf: (attributes) => (scenarioOf(attributes) ? `${measure.key}--${scenarioOf(attributes)}` : measure.key),
            labelOf: (attributes) => measureLabelWithScenario(measure, scenarioOf(attributes)),
            periodOf: (attributes) =>
              build.periodFixed ||
              (build.periodKey ? periodKeyOf(attributes[build.periodKey]) || "미기재" : "미기재"),
          })),
        boundaries.boundaries34
      )
    : null;

  return finishChoroplethLayer({
    target,
    entry,
    series,
    seriesMeta,
    members,
    boundaries,
    report,
    stats: { sourceValueCount, duplicateValueCount, providedZeroCount, unmatched, sourceRowCount: records.length },
    aggregationLevel: "admin1",
    spatialScopeType: "admin1",
    mappingMethod: null,
    source34,
  });
}

/**
 * Values filed under the 34-unit successor provinces, drawn on the member
 * 63-unit boundaries with the membership stated on every row.
 */
function buildRegionMembershipLayer(target, packs, boundaries, crosswalk, catalog, report) {
  const { build } = target;
  // V162: a layer may count another element's records - C-012's PPP projects
  // moved into D-025's PPI project register with the 2026-09-30 delivery. The
  // layer stays C-012's (its detail, title); its source is the register's.
  const element = packs.get(build.sourceElementId || target.elementId);
  const ownEntry = catalogEntry(catalog, target.elementId);
  const sourceEntry = build.sourceElementId ? catalogEntry(catalog, build.sourceElementId) : null;
  const entry = sourceEntry
    ? {
        ...ownEntry,
        rights: sourceEntry.rights,
        sourceOrganizations: sourceEntry.sourceOrganizations,
        sourceUrls: sourceEntry.sourceUrls,
      }
    : ownEntry;
  const records = (element?.entities?.records || []).filter(
    (record) =>
      (!build.indicatorIds || build.indicatorIds.includes(record.indicatorId)) &&
      (!build.requireCoordinates || (typeof record.latitude === "number" && typeof record.longitude === "number"))
  );
  const unmatched = new Map();
  const members = new Map();
  const series = new Map();
  const seriesMeta = new Map();
  let sourceValueCount = 0;
  let duplicateValueCount = 0;
  let providedZeroCount = 0;
  let rowsWithoutRegion = 0;
  const regionsSeen = new Set();

  const parseValue = (measure, attributes) => {
    if (measure.aggregate === "count") return 1;
    const raw = attributes[measure.sourceKey];
    if (measure.parse === "sector-composition") {
      // "공상(Công Thương) 7 / 교통운송 6 / 건설 11 / 농업·환경 3"
      const parts = text(raw).split("/").map((part) => part.trim());
      for (const part of parts) {
        const match = part.match(/^(.+?)\s+(\d+)$/);
        if (!match) continue;
        const label = match[1].replace(/\(.*?\)/g, "").trim();
        if (label === measure.sector) return Number(match[2]);
      }
      return null;
    }
    return numeric(raw);
  };

  // V157: the region may come from the extraction sidecar instead of a column.
  const sidecar = build.regionSidecar ? readJson(resolve(ROOT, build.regionSidecar)) : null;

  /**
   * The 2025 units a record belongs to, as memberships this builder can use.
   * A sidecar row already names the unit and its member 63-codes, so it is used
   * as stated; a column row is looked up in the delivery's own crosswalk.
   */
  const membershipsFor = (record, attributes) => {
    if (sidecar) {
      const units = sidecar.byRecordId?.[record.recordId] ?? [];
      return units.map((unit) => ({
        key: normalizeAdministrativeName(unit.name),
        membership: { label: unit.name, codes: new Set(unit.adm1Codes63) },
      }));
    }
    const regionName = text(attributes[build.regionNameKey]);
    if (!regionName) return [];
    const key = normalizeAdministrativeName(regionName);
    const membership = crosswalk.membersByParent.get(key);
    if (!membership) {
      unmatched.set(regionName, (unmatched.get(regionName) || 0) + 1);
      return [];
    }
    return [{ key, membership }];
  };

  // V162: rows that are tranches of one project count once per unit
  // (build.distinctBy names the project key the source states).
  const countedDistinct = new Set();
  const distinctProjects = new Set();
  let distinctSkipped = 0;
  for (const record of records) {
    const attributes = record.normalizedAttributes || {};
    if (build.distinctBy) distinctProjects.add(text(attributes[build.distinctBy]) || record.recordId);
    const memberships = membershipsFor(record, attributes);
    if (memberships.length === 0) {
      // A national or unlocated row in the same indicator; not a join failure.
      rowsWithoutRegion += 1;
      continue;
    }
    for (const { key: parentKey, membership } of memberships) {
    if (build.distinctBy) {
      const distinctKey = `${parentKey}|${text(attributes[build.distinctBy]) || record.recordId}`;
      if (countedDistinct.has(distinctKey)) {
        distinctSkipped += 1;
        continue;
      }
      countedDistinct.add(distinctKey);
    }
    regionsSeen.add(parentKey);
    const period = build.periodFixed
      ? build.periodFixed
      : build.periodKey
        ? periodKeyOf(attributes[build.periodKey]) || "미기재"
        : "미기재";
    if (build.memberRecords) {
      for (const adm1Code of membership.codes) {
        const list = members.get(adm1Code) || [];
        list.push({
          recordId: record.recordId,
          label: text(attributes[build.memberRecords.labelKey]) || text(record.name),
          date: build.memberRecords.dateKey ? text(attributes[build.memberRecords.dateKey]) : "",
          status: build.memberRecords.statusKey ? text(attributes[build.memberRecords.statusKey]) : "",
          value: build.memberRecords.valueKey ? text(attributes[build.memberRecords.valueKey]) : "",
          url: build.memberRecords.urlKey ? text(attributes[build.memberRecords.urlKey]) : "",
          region: membership.label,
          indicatorId: record.indicatorId,
        });
        members.set(adm1Code, list);
      }
    }
    for (const measure of build.measures) {
      const value = parseValue(measure, attributes);
      if (value === null) continue;
      sourceValueCount += 1;
      if (value === 0) providedZeroCount += 1;
      const key = `${measure.key} ${period}`;
      let bucket = series.get(key);
      if (!bucket) {
        bucket = new Map();
        series.set(key, bucket);
        seriesMeta.set(key, { variable: measure.key, period, measure, scenario: "", label: measure.label });
      }
      for (const adm1Code of membership.codes) {
        const existing = bucket.get(adm1Code);
        if (existing) {
          if (measure.aggregate === "count") {
            existing.value += 1;
          } else {
            duplicateValueCount += 1;
          }
          continue;
        }
        bucket.set(adm1Code, {
          adm1Code,
          adm1Name: boundaries.nameByCode.get(adm1Code),
          variable: measure.key,
          variableLabel: measure.label,
          period,
          value,
          unit: measure.unit,
          sourceIndicatorId: record.indicatorId,
          sourceRecordId: record.recordId,
          sourceSpatialUnit: "region",
          sourceRegion: membership.label,
          mappingMethod: sidecar
            ? "value-stated-2025-unit-membership"
            : "explicit-2025-34-unit-membership",
          imputed: false,
        });
      }
    }
    }
  }

  return finishChoroplethLayer({
    target,
    entry,
    series,
    seriesMeta,
    members,
    boundaries,
    report,
    stats: {
      sourceValueCount,
      duplicateValueCount,
      providedZeroCount,
      unmatched,
      sourceRowCount: records.length,
      sourceRegionCount: regionsSeen.size,
      rowsWithoutRegion,
      ...(build.sourceElementId || build.distinctBy
        ? {
            linkage: {
              sourceElementId: build.sourceElementId || target.elementId,
              indicatorIds: build.indicatorIds || null,
              distinctBy: build.distinctBy || null,
              sourceRows: records.length,
              distinctProjects: build.distinctBy ? distinctProjects.size : null,
              rowsWithoutRegion,
              tranchesCountedOnce: distinctSkipped,
            },
          }
        : {}),
    },
    aggregationLevel: "post-2025-34-unit",
    spatialScopeType: "region",
    mappingMethod: "explicit-2025-34-unit-membership",
  });
}

function finishChoroplethLayer({
  target,
  entry,
  series,
  seriesMeta,
  members,
  boundaries,
  report,
  stats,
  aggregationLevel,
  spatialScopeType,
  mappingMethod,
  source34 = null,
}) {
  const { build } = target;
  const elementId = target.elementId;
  // variable -> periods offered; thinning applies per variable so a scenario
  // keeps its own first and last year.
  const periodsByVariable = new Map();
  for (const meta of seriesMeta.values()) {
    const set = periodsByVariable.get(meta.variable) || new Set();
    set.add(meta.period);
    periodsByVariable.set(meta.variable, set);
  }
  const keptPeriodsByVariable = new Map(
    [...periodsByVariable].map(([variable, set]) => [variable, new Set(thinPeriods([...set], build.periodStep))])
  );

  const values = [];
  const seriesCoverage = [];
  const variableMap = new Map();
  let maxSeriesFeatureCount = 0;
  for (const [key, bucket] of series) {
    const meta = seriesMeta.get(key);
    if (!keptPeriodsByVariable.get(meta.variable)?.has(meta.period)) continue;
    const rows = [...bucket.values()];
    maxSeriesFeatureCount = Math.max(maxSeriesFeatureCount, rows.length);
    values.push(...rows);
    seriesCoverage.push({
      variable: meta.variable,
      period: meta.period,
      expectedCount: 63,
      matchedCount: rows.length,
      missingCount: 63 - rows.length,
      failureCount: 0,
    });
    const option = variableMap.get(meta.variable) || {
      key: meta.variable,
      measureId: meta.scenario ? `${meta.measure.measureId}-${meta.scenario}` : meta.measure.measureId,
      measureKey: meta.measure.key,
      scenario: meta.scenario || null,
      label: meta.label,
      unit: meta.measure.unit,
      periods: new Set(),
      maxFeatureCount: 0,
    };
    option.periods.add(meta.period);
    option.maxFeatureCount = Math.max(option.maxFeatureCount, rows.length);
    variableMap.set(meta.variable, option);
  }

  const scenarioOrder = (scenario) => {
    const index = SCENARIO_ORDER.indexOf(scenario || "");
    return index < 0 ? SCENARIO_ORDER.length : index;
  };
  const measureOrder = new Map(build.measures.map((measure, index) => [measure.key, index]));
  const variables = [...variableMap.values()]
    .sort(
      (left, right) =>
        (measureOrder.get(left.measureKey) ?? 99) - (measureOrder.get(right.measureKey) ?? 99) ||
        scenarioOrder(left.scenario) - scenarioOrder(right.scenario)
    )
    .map((option) => ({
      key: option.key,
      measureId: option.measureId,
      measureKey: option.measureKey,
      scenario: option.scenario,
      label: option.label,
      unit: option.unit,
      periods: sortPeriods([...option.periods]),
      maxFeatureCount: option.maxFeatureCount,
    }));
  const periods = sortPeriods([...new Set(variables.flatMap((option) => option.periods))]);
  const defaultMeasureKey = build.defaultMeasure || build.measures[0].key;
  const defaultScenario = build.scenarioKey ? build.defaultScenario || "historical" : null;
  const defaultVariable =
    variables.find(
      (option) => option.measureKey === defaultMeasureKey && (option.scenario || null) === defaultScenario
    )?.key ||
    variables.find((option) => option.measureKey === defaultMeasureKey)?.key ||
    variables[0]?.key;
  const defaultOption = variables.find((option) => option.key === defaultVariable);
  const defaultPeriod = defaultOption
    ? defaultOption.periods.includes("2050")
      ? "2050"
      : defaultOption.periods[defaultOption.periods.length - 1]
    : periods[periods.length - 1];

  const scenarios = build.scenarioKey
    ? [...new Set(variables.map((option) => option.scenario).filter(Boolean))]
        .sort((left, right) => scenarioOrder(left) - scenarioOrder(right))
        .map((key) => ({ key, label: SCENARIO_LABELS[key] || key }))
    : [];
  const selectors = {
    defaultPeriod,
    defaultVariable,
    periods,
    variables,
    ...(scenarios.length
      ? {
          variableGroups: {
            measures: build.measures.map((measure) => ({
              key: measure.key,
              label: measure.label,
              unit: measure.unit,
              measureId: measure.measureId,
            })),
            scenarios,
            scenarioLabel: "시나리오",
            measureLabel: "기후 지표",
          },
        }
      : {}),
  };

  const matchedCodes = new Set(values.map((row) => row.adm1Code));
  const missingRegions = [...boundaries.nameByCode]
    .filter(([code]) => !matchedCodes.has(code))
    .map(([, name]) => name);
  const coverageKind = build.coverageKind || (maxSeriesFeatureCount >= 63 ? "full" : "partial");

  const useTable = values.length > VALUE_TABLE_THRESHOLD;
  const adm1Codes = [...boundaries.nameByCode.keys()];
  const values34 = source34Section(source34, selectors);
  const asset = {
    schemaVersion: "v124",
    assetSchemaVersion: "v124-spatial-layer-1",
    countryIso3: "VNM",
    elementId,
    generatedAt: GENERATED_AT,
    geometryUrl: GEOMETRY_URL,
    joinKey: "adm1Code",
    boundarySystem: "pre-2025-63",
    coverageKind,
    selectors,
    values: useTable ? [] : values,
    ...(useTable
      ? {
          valueTable: {
            adm1Codes,
            adm1Names: adm1Codes.map((code) => boundaries.nameByCode.get(code)),
            sourceSpatialUnit: spatialScopeType === "region" ? "region" : "admin1",
            series: [...new Set(values.map((row) => `${row.variable} ${row.period}`))].map((key) => {
              const [variable, period] = key.split(" ");
              const rows = values.filter((row) => row.variable === variable && row.period === period);
              const byCode = new Map(rows.map((row) => [row.adm1Code, row]));
              return {
                variable,
                variableLabel: rows[0].variableLabel,
                unit: rows[0].unit,
                period,
                sourceIndicatorId: rows[0].sourceIndicatorId,
                values: adm1Codes.map((code) => (byCode.has(code) ? byCode.get(code).value : null)),
              };
            }),
          },
        }
      : {}),
    ...(members.size
      ? {
          memberRecords: Object.fromEntries(
            [...members].map(([code, list]) => [
              code,
              // A document filed under a province once per source indicator is
              // still one document; C-009 and C-010 share four of them.
              [...new Map(list.map((item) => [`${item.label}|${item.date}`, item])).values()],
            ])
          ),
        }
      : {}),
    ...(values34?.rows.length ? { values34: values34.rows } : {}),
    seriesCoverage,
    source: {
      attribution: entry?.rights?.attributionTexts || [],
      licenses: entry?.rights?.licenses || [],
      organizations: entry?.sourceOrganizations || [],
      urls: entry?.sourceUrls || [],
    },
    validation: {
      duplicateValueCount: stats.duplicateValueCount,
      expectedAdm1Count: 63,
      fakeGeometryCount: 0,
      joinFailureCount: 0,
      matchedAdm1Count: matchedCodes.size,
      maxSeriesFeatureCount,
      missingAdm1Count: 63 - matchedCodes.size,
      providedZeroCount: stats.providedZeroCount,
      publishedValueCount: values.length,
      sourceValueCount: stats.sourceValueCount,
      suppressedValueCount: 0,
      unmatchedSourceNameCount: [...stats.unmatched.values()].reduce((sum, count) => sum + count, 0),
      zeroImputationCount: 0,
      ...(mappingMethod ? { mappingMethod, sourceRegionCount: stats.sourceRegionCount } : {}),
      ...(values34 ? { source34: values34.validation } : {}),
    },
  };
  const dataUrl = `/data/vietnam/v2/spatial/layers/${elementId.toLowerCase()}.json`;
  writeJson(resolve(DATA, `spatial/layers/${elementId.toLowerCase()}.json`), asset);

  const latestYear = periods.filter((period) => /^\d{4}$/.test(period)).slice(-1)[0] || periods[periods.length - 1] || null;
  const isRegion = spatialScopeType === "region";
  // V151-2: the policy is resolved before the copy so every sentence about
  // the 34-unit outline states the rule this layer actually follows.
  const boundaryPolicy = boundaryPolicyForLayer(
    target,
    { renderer: coverageKind === "full" ? "admin1-choropleth" : "partial-choropleth", geometryTypes: ["Polygon"], selectors },
    build.measures.map((measure) => measure.key)
  );
  const layer = {
    ...baseLayerFacts(entry, target),
    accuracyNotice: isRegion
      ? "원자료가 개편 후 34개 성·시 기준으로 발표한 값입니다. 기본 34개 경계에 직접 표시하고, 개편 전 63개 토글에서는 소속 성·시 경계에 동일하게 표시하며 성·시별 독립값이 아닙니다. 누락값은 투명 처리하고 0으로 대체하지 않습니다."
      : `누락값은 투명 처리하며 0으로 대체하지 않습니다. 값은 원자료의 개편 전 63개 성·시 기준이며, 34개 경계에서는 ${boundaryPolicy.note}`,
    boundaryPolicy,
    active: true,
    aggregationLevel,
    assetRef: { elementId, provider: "vietnam-v124", section: "spatial" },
    cluster: false,
    coordinateMeaning: "source-region-value",
    dataUrl,
    displayedCoordinateCount: 0,
    enabled: true,
    featureCount: maxSeriesFeatureCount,
    filters: [],
    geometryTypes: ["Polygon", "MultiPolygon"],
    geometryUrl: GEOMETRY_URL,
    join: {
      failures: [],
      matchedCount: matchedCodes.size,
      missingCount: 63 - matchedCodes.size,
      requiredCount: 63,
    },
    latestYear,
    layerId: `${LAYER_ID_PREFIX}${elementId.toLowerCase()}`,
    legend: {
      note: `단위 ${defaultOption?.unit || target.unit} · 결측 ${63 - (defaultOption?.maxFeatureCount || 0)}개 성·시(개편 전 63개 기준)`,
      title: defaultOption?.label || target.publicName,
    },
    mapBenefit: target.selectableVariables,
    mapMode: isRegion ? "region-choropleth" : "choropleth",
    missingRegions,
    publicSpatialNotice: isRegion
      ? "개편 후 34개 성·시 값을 34개 경계에 직접 표시합니다(개편 전 63개 토글 시 소속 경계에 동일 표시)."
      : `값은 개편 전 63개 성·시 통계 경계 기준이며, 34개 경계에서는 ${boundaryPolicy.note}`,
    renderer: coverageKind === "full" ? "admin1-choropleth" : "partial-choropleth",
    sourceCoordinateCount: 0,
    sourceYear: latestYear,
    spatialCoverage: isRegion
      ? `개편 후 34개 성·시 중 ${stats.sourceRegionCount || 0}개 값(34개 경계 직접 표시)`
      : `개편 전 63개 성·시 중 선택 계열 최대 ${maxSeriesFeatureCount}개(34개 경계에서는 ${
          isAggregatingKind(boundaryPolicy.kind) ? "구성 성·시 집계값" : "구성 범위만 표시"
        })`,
    spatialLimitation: target.limitation,
    spatialScopeType,
    selectors,
    tooltipFields: ["adm1Name", "value", "unit", "period"],
    totalEntityCount: stats.sourceRowCount,
    unit: defaultOption?.unit || target.unit,
    ...(members.size ? { memberRecordsInAsset: true } : {}),
    ...(build.sharedDocumentsWith ? { sharedObjectsWith: build.sharedDocumentsWith, sharedObjectKind: "document" } : {}),
    ...(build.sharedFacilityRegisterWith
      ? { sharedObjectsWith: build.sharedFacilityRegisterWith, sharedObjectKind: "facility-register" }
      : {}),
  };
  report.push({
    elementId,
    status: values.length ? (coverageKind === "full" ? "implemented" : "partial") : "not-connected",
    representation: target.representation,
    build: build.kind,
    sourceRowCount: stats.sourceRowCount,
    publishedValueCount: values.length,
    seriesCount: seriesCoverage.length,
    variableCount: variables.length,
    periodCount: periods.length,
    matchedAdm1Count: matchedCodes.size,
    unmatchedRegionNames: [...stats.unmatched.entries()],
    rowsWithoutRegion: stats.rowsWithoutRegion || 0,
    ...(stats.linkage ? { linkage: stats.linkage } : {}),
    sourceRegionCount: stats.sourceRegionCount,
    duplicateValueCount: stats.duplicateValueCount,
    valueTable: useTable,
    ...(values34 ? { source34: values34.validation } : {}),
    dataUrl,
  });
  return layer;
}

// ---------------------------------------------------------------- entity builders

function withinVietnam(record) {
  return (
    typeof record.latitude === "number" &&
    typeof record.longitude === "number" &&
    record.longitude >= VIETNAM_BBOX.west &&
    record.longitude <= VIETNAM_BBOX.east &&
    record.latitude >= VIETNAM_BBOX.south &&
    record.latitude <= VIETNAM_BBOX.north
  );
}

/** The same display rules the runtime applies, so featureCount is the count a reader sees. */
export function displayableEntityRecords(records, build) {
  const excludeWhere = Object.entries(build.excludeWhere || {}).map(([key, pattern]) => [key, new RegExp(pattern, "u")]);
  const kept = [];
  const excluded = [];
  for (const record of records) {
    const attributes = record.normalizedAttributes || {};
    const hasCoordinates = typeof record.latitude === "number" && typeof record.longitude === "number";
    if (build.indicatorIds && !build.indicatorIds.includes(record.indicatorId)) {
      excluded.push({ recordId: record.recordId, reason: "indicator-out-of-scope" });
      continue;
    }
    if (!hasCoordinates || record.mapEligible === false) {
      excluded.push({ recordId: record.recordId, reason: record.mapEligibilityReason || "no-coordinate" });
      continue;
    }
    if (build.withinCountryOnly && !withinVietnam(record)) {
      excluded.push({ recordId: record.recordId, reason: "outside-country", name: record.name });
      continue;
    }
    const excludedBy = excludeWhere.find(([key, pattern]) => pattern.test(text(attributes[key])));
    if (excludedBy) {
      excluded.push({ recordId: record.recordId, reason: `excluded:${excludedBy[0]}=${text(attributes[excludedBy[0]])}`, name: record.name });
      continue;
    }
    kept.push(record);
  }
  // Identity: several rows describing one station or one organisation become
  // one feature; the first row stands for it, the rest are its members.
  const groups = new Map();
  const identitySources = build.identity?.sources || [];
  for (const record of kept) {
    const attributes = record.normalizedAttributes || {};
    const identity = identitySources.map((key) => text(attributes[key])).filter(Boolean).join("|");
    const groupKey = identity || record.recordId;
    const group = groups.get(groupKey) || [];
    group.push(record);
    groups.set(groupKey, group);
  }
  return { features: [...groups.values()], excluded };
}

/**
 * V151-2: which province (and 34-unit) each located record sits in, as a
 * small sidecar next to the layer assets. Returns null when no record carries
 * a coordinate.
 */
function writeLocationSidecar(elementId, records, locator) {
  if (!locator || !records.some((record) => typeof record.latitude === "number")) return null;
  const { asset, counts } = buildLocationSidecar(elementId, records, locator);
  const relative = `spatial/locations/${elementId.toLowerCase()}.json`;
  writeJson(resolve(DATA, relative), asset);
  return { dataUrl: `/data/vietnam/v2/${relative}`, counts };
}

function approximateTest(build) {
  const rule = build.approximate;
  if (!rule) return () => false;
  if (rule.always) return () => true;
  const pattern = new RegExp(rule.pattern, "u");
  return (record) => pattern.test(text((record.normalizedAttributes || {})[rule.sourceKey]));
}

function buildEntityLayer(target, packs, catalog, report, locator) {
  const { build } = target;
  const elementId = target.elementId;
  const element = packs.get(elementId);
  const entry = catalogEntry(catalog, elementId);
  const records = element?.entities?.records || [];
  const { features, excluded } = displayableEntityRecords(records, build);
  const locations = writeLocationSidecar(elementId, records, locator);
  const isApproximate = approximateTest(build);
  const representative = features.map((group) => group[0]);
  const approximateCount = representative.filter(isApproximate).length;
  const memberRowCount = features.reduce((sum, group) => sum + group.length, 0);

  const factFields = (build.factFields || []).map((fact) => {
    const filled = representative.filter((record) => {
      const attributes = record.normalizedAttributes || {};
      return fact.sources.some((key) => text(attributes[key]) !== "");
    }).length;
    return {
      key: fact.key,
      label: fact.label,
      sources: fact.sources,
      recordCount: representative.length,
      filledRecordCount: filled,
      ...(fact.unit ? { unit: fact.unit } : {}),
      ...(fact.filterable ? { filterable: true } : {}),
      ...(fact.valueMap ? { valueMap: fact.valueMap } : {}),
    };
  });
  const fieldLabels = Object.fromEntries(factFields.map((fact) => [fact.key, fact.label]));
  const filters = factFields
    .filter((fact) => fact.filterable)
    .map((fact) => {
      const source = fact.sources[0];
      const rawValues = [...new Set(representative.map((record) => text((record.normalizedAttributes || {})[source])).filter(Boolean))];
      const values = rawValues.sort((left, right) => left.localeCompare(right, "ko"));
      return {
        field: source,
        label: fact.label,
        values,
        ...(fact.valueMap ? { valueLabels: Object.fromEntries(values.map((value) => [value, fact.valueMap[value.toLowerCase()] || value])) } : {}),
      };
    })
    .filter((filter) => filter.values.length > 1);

  const periodKey = build.periodFromKey;
  const years = periodKey
    ? representative
        .map((record) => periodKeyOf((record.normalizedAttributes || {})[periodKey]))
        .filter((period) => /^\d{4}$/.test(period))
        .map(Number)
    : [];
  const latestYear = years.length
    ? String(Math.max(...years))
    : entry?.latestYear
      ? String(entry.latestYear)
      : (entry?.referenceYears || []).slice(-1)[0] || null;
  const earliestYear = years.length ? String(Math.min(...years)) : latestYear;
  const countNoun = build.countNoun || "건";
  const layer = {
    ...baseLayerFacts(entry, target),
    accuracyNotice:
      approximateCount > 0
        ? `좌표가 있는 레코드만 표시합니다. ${approximateCount}건은 도시·행정구역 대표점 등 근사 위치이며 속이 빈 기호로 구분합니다.`
        : "원천이 제공한 좌표만 표시하며 좌표가 없는 레코드는 지도에 투영하지 않습니다.",
    active: true,
    aggregationLevel: build.identity?.label ? build.identity.label : "facility",
    assetRef: { elementId, provider: "vietnam-v121", section: "entities" },
    cluster: representative.length > 120,
    coordinateMeaning: approximateCount === representative.length && representative.length > 0
      ? "representative-coordinate"
      : approximateCount > 0
        ? "first-source-coordinate"
        : "verified-physical-site",
    displayedCoordinateCount: representative.length,
    enabled: representative.length > 0,
    ...(representative.length === 0 ? { disabledReason: "위치가 확인된 레코드가 없습니다" } : {}),
    featureCount: representative.length,
    factFields,
    fieldLabels,
    filters,
    geometryTypes: ["point"],
    join: { failures: [], matchedCount: representative.length, requiredCount: representative.length },
    latestYear,
    layerId: `${LAYER_ID_PREFIX}${elementId.toLowerCase()}`,
    legend: { title: target.publicName, note: latestYear ? `자료연도 ${latestYear}` : "자료연도 미기재" },
    mapBenefit: target.selectableVariables,
    mapMode: representative.length > 120 ? "cluster" : "point",
    missingRegions: [],
    publicSpatialNotice: target.displaySpatialUnit,
    renderer: representative.length > 120 ? "cluster" : "point",
    selectors: {
      defaultPeriod: latestYear || "미기재",
      defaultVariable: "locations",
      periods: [latestYear || "미기재"],
      variables: [
        {
          key: "locations",
          label: build.analysisItemLabel || `${target.publicName} 위치`,
          periods: [latestYear || "미기재"],
          unit: countNoun,
        },
      ],
    },
    sourceCoordinateCount: records.filter((record) => typeof record.latitude === "number").length,
    sourceYear: earliestYear && earliestYear !== latestYear ? `${earliestYear}–${latestYear}` : latestYear,
    spatialCoverage: `${target.displaySpatialUnit} ${representative.length.toLocaleString("ko-KR")}${countNoun}`,
    spatialLimitation: target.limitation,
    spatialScopeType: build.identity?.label === "관측소" ? "multi-site" : "facility-site",
    tooltipFields: ["name", ...factFields.slice(0, 4).map((fact) => fact.key)],
    totalEntityCount: records.length,
    unit: "source-provided location",
    countNoun,
    analysisItemLabel: build.analysisItemLabel || `${target.publicName} 위치`,
    ...(build.identity ? { featureIdentity: build.identity } : {}),
    ...(build.withinCountryOnly ? { displayScope: { withinCountryOnly: true, bbox: VIETNAM_BBOX } } : {}),
    ...(build.excludeWhere ? { excludeWhere: build.excludeWhere } : {}),
    ...(build.approximate ? { approximateLocation: build.approximate } : {}),
    ...(build.memberSeries ? { memberSeries: build.memberSeries } : {}),
    ...(build.memberFacts ? { memberFacts: build.memberFacts } : {}),
    ...(build.symbolByFact ? { symbolByFact: build.symbolByFact } : {}),
    memberRowCount,
    ...(locations ? { locationsUrl: locations.dataUrl, locationCounts: locations.counts } : {}),
  };
  layer.boundaryPolicy = boundaryPolicyForLayer(target, layer, null);
  report.push({
    elementId,
    status: representative.length ? (excluded.some((item) => item.reason !== "indicator-out-of-scope" && !/^no-coordinate|coordinates/.test(item.reason)) || approximateCount > 0 ? "partial" : "implemented") : "not-connected",
    representation: target.representation,
    build: build.kind,
    sourceRowCount: records.length,
    sourceCoordinateCount: layer.sourceCoordinateCount,
    featureCount: representative.length,
    memberRowCount,
    approximateCount,
    excludedCount: excluded.length,
    excluded: excluded.filter((item) => item.reason !== "indicator-out-of-scope").slice(0, 40),
    filters: filters.map((filter) => `${filter.label}(${filter.values.length})`),
  });
  return layer;
}

// ---------------------------------------------------------------- P8-2 (V157-2) layers

/**
 * P8-2: a value the source states for a group of provinces - an EVN power
 * corporation, a price region, a socio-economic region, or a registry project
 * count - shown unchanged on each member province (scripts/v157-2/
 * map12-builders-v157-2.mjs). The layer's notices say plainly that the value
 * belongs to the group, not to the province.
 */
function buildGroupConstantLayer(target, packs, boundaries, catalog, report) {
  const entry = catalogEntry(catalog, target.elementId);
  const inputs = buildGroupConstantInputsV157_2(ROOT, target, packs, boundaries);
  const derived = { ...target, build: { ...target.build, measures: inputs.measures } };
  const source34 = inputs.report.source34Rows
    ? { rows: inputs.report.source34Rows, unmatched: new Map(), duplicateValueCount: 0, sourceRowCount: inputs.report.source34Rows.length }
    : null;
  const layer = finishChoroplethLayer({
    target: derived,
    entry,
    series: inputs.series,
    seriesMeta: inputs.seriesMeta,
    members: inputs.members,
    boundaries,
    report,
    stats: inputs.stats,
    aggregationLevel: "admin1",
    spatialScopeType: "admin1",
    mappingMethod: null,
    source34,
  });
  const wording = target.build.publicWording || {};
  if (wording.accuracyNotice) layer.accuracyNotice = wording.accuracyNotice;
  if (wording.publicSpatialNotice) layer.publicSpatialNotice = wording.publicSpatialNotice;
  const isCount = target.elementId === "C-006";
  layer.spatialCoverage =
    wording.spatialCoverage ||
    `개편 전 63개 성·시 중 최대 ${layer.featureCount}개에 ${isCount ? "사업 건수" : "그룹 전체 값"} 표시(34개 경계: ${
      isCount ? "단위 안 사업을 중복 없이 집계" : "구성 성·시가 같은 그룹이면 같은 값, 걸치면 복수 소속"
    })`;
  layer.groupConstantV157_2 = { groupTable: target.build.groupTable, basis: inputs.report.basis };
  const { source34Rows: _rows, ...evidence } = inputs.report;
  Object.assign(report[report.length - 1], { groupConstant: evidence });
  return layer;
}

/**
 * P8-2: B-044 · B-046 · B-047 on B-048's mine points. The layer reads the host's
 * records at runtime (assetRef) and joins the national figure by ore type
 * (src/data/map/entityAttributeJoinV157_2.ts); here it is declared and counted.
 */
function buildMineJoinLayer(target, packs, catalog, report, etlByElement) {
  const { build } = target;
  const entry = catalogEntry(catalog, target.elementId);
  const hostLayer = etlByElement.get(build.hostElementId);
  if (!hostLayer) throw new Error(`${target.elementId}: host layer ${build.hostElementId} missing from map-index`);
  const { attributes, joined, hostRecords } = buildMineJoinV157_2(ROOT, target, packs);
  const shown = joined.filter(
    (record) => typeof record.latitude === "number" && typeof record.longitude === "number" && record.mapEligible !== false
  );
  const factFields = [
    { key: "nationalValue", label: "국가 전체 값", sources: ["국가_전체_값"], recordCount: shown.length, filledRecordCount: shown.length },
    // Only the ore type from the host: its other notes (coordinate basis, MRDS
    // ids, technology-mapping memos) belong to the mine register, not here.
    ...(hostLayer.factFields || [])
      .filter((fact) => fact.key === "mineral")
      .map((fact) => ({ ...fact, recordCount: shown.length })),
  ];
  const mineralValues = [...new Set(shown.map((record) => text(record.normalizedAttributes?.["광종"])).filter(Boolean))].sort((a, b) =>
    a.localeCompare(b, "ko")
  );
  const latestYear = hostLayer.latestYear ?? null;
  const layer = {
    ...baseLayerFacts(entry, target),
    accuracyNotice:
      "광산 지점은 '주요 광산' 자료의 좌표이며, 표시된 값은 광종별 국가 전체 값입니다. 개별 광산의 값으로 나누지 않습니다.",
    active: true,
    aggregationLevel: "facility",
    assetRef: { elementId: build.hostElementId, provider: hostLayer.assetRef?.provider || "vietnam-v121", section: "entities" },
    boundaryPolicy: hostLayer.boundaryPolicy,
    cluster: false,
    coordinateMeaning: hostLayer.coordinateMeaning,
    displayedCoordinateCount: shown.length,
    enabled: shown.length > 0,
    ...(shown.length === 0 ? { disabledReason: "광종이 일치하는 광산이 없습니다" } : {}),
    entityJoinV157_2: { hostElementId: build.hostElementId, elementId: target.elementId, attributes },
    featureCount: shown.length,
    factFields,
    fieldLabels: Object.fromEntries(factFields.map((fact) => [fact.key, fact.label])),
    filters: mineralValues.length > 1 ? [{ field: "광종", label: "광종", values: mineralValues }] : [],
    geometryTypes: ["point"],
    join: { failures: [], matchedCount: shown.length, requiredCount: shown.length },
    latestYear,
    layerId: `${LAYER_ID_PREFIX}${target.elementId.toLowerCase()}`,
    legend: { title: target.publicName, note: "광산 지점 · 값은 국가 전체" },
    mapBenefit: target.selectableVariables,
    mapMode: "point",
    missingRegions: [],
    publicSpatialNotice: target.displaySpatialUnit,
    renderer: "point",
    selectors: {
      defaultPeriod: String(latestYear || "미기재"),
      defaultVariable: "locations",
      periods: [String(latestYear || "미기재")],
      variables: [{ key: "locations", label: build.analysisItemLabel || `${target.publicName} 광산`, periods: [String(latestYear || "미기재")], unit: "곳" }],
    },
    sourceCoordinateCount: shown.length,
    sourceYear: latestYear,
    spatialCoverage: `광종이 일치하는 광산 ${shown.length}곳`,
    spatialLimitation: target.limitation,
    spatialScopeType: "facility-site",
    tooltipFields: ["name", "nationalValue", "mineral"],
    totalEntityCount: joined.length,
    unit: "source-provided location",
    countNoun: "곳",
    analysisItemLabel: build.analysisItemLabel || `${target.publicName} 광산`,
    ...(hostLayer.locationsUrl ? { locationsUrl: hostLayer.locationsUrl, locationCounts: hostLayer.locationCounts } : {}),
  };
  report.push({
    elementId: target.elementId,
    status: shown.length ? "implemented" : "not-connected",
    representation: target.representation,
    build: build.kind,
    hostElementId: build.hostElementId,
    hostRecordCount: hostRecords.length,
    joinedRecordCount: joined.length,
    featureCount: shown.length,
    mineralsJoined: attributes.map((attribute) => attribute.mineral),
    ...(shown.length ? {} : { reason: "광종이 일치하는 광산이 없습니다" }),
  });
  return layer;
}

// ---------------------------------------------------------------- existing layers

/**
 * A province choropleth whose region is a dimension of the observation's
 * indicator, not a column: B-009's source workbook carries an Adm1 sheet, so the
 * delivery states 63 province values per measure with the province name in the
 * indicator's `detail_2` dimension. The measure label and unit come from the
 * element's semantic asset, never from this script.
 */
function buildObservationDimensionLayer(target, packs, boundaries, catalog, report) {
  const { build } = target;
  const element = packs.get(target.elementId);
  const entry = catalogEntry(catalog, target.elementId);
  const semantic = readJson(
    resolve(DATA, `semantic/elements/${target.elementId.toLowerCase()}.json`)
  );
  const indicatorById = new Map(
    (semantic.indicators || []).map((indicator) => [indicator.indicatorId, indicator])
  );
  const measureByKey = new Map(build.measures.map((measure) => [measure.key, measure]));
  const unmatched = new Map();
  const series = new Map();
  const seriesMeta = new Map();
  let sourceValueCount = 0;
  let duplicateValueCount = 0;
  let providedZeroCount = 0;
  let rowsWithoutRegion = 0;
  const regionsSeen = new Set();

  for (const record of element?.observations?.records || []) {
    if (!numeric(record.value)) continue;
    const indicator = indicatorById.get(record.indicatorId);
    const regionName = text(indicator?.dimensionLabels?.[build.regionDimension]);
    if (!indicator || !regionName) {
      rowsWithoutRegion += 1;
      continue;
    }
    const measure = measureByKey.get(indicator.measure?.key);
    if (!measure) {
      rowsWithoutRegion += 1;
      continue;
    }
    // A source spelling the contract declares as the same province ("Bac Can").
    const aliased = build.regionAliases?.[regionName] ?? regionName;
    const region = boundaries.lookup.get(normalizePlace(aliased));
    if (!region) {
      unmatched.set(regionName, (unmatched.get(regionName) || 0) + 1);
      continue;
    }
    regionsSeen.add(region.adm1Code);
    const period = periodKeyOf(record.year ?? record.period) || "미기재";
    const key = `${measure.key} ${period}`;
    let bucket = series.get(key);
    if (!bucket) {
      bucket = new Map();
      series.set(key, bucket);
      seriesMeta.set(key, {
        variable: measure.key,
        period,
        measure,
        scenario: "",
        label: measure.label,
      });
    }
    if (bucket.has(region.adm1Code)) {
      duplicateValueCount += 1;
      continue;
    }
    sourceValueCount += 1;
    if (record.value === 0) providedZeroCount += 1;
    bucket.set(region.adm1Code, {
      adm1Code: region.adm1Code,
      adm1Name: region.adm1Name,
      variable: measure.key,
      variableLabel: measure.label,
      period,
      value: record.value,
      unit: record.unit || measure.unit,
      sourceIndicatorId: record.indicatorId,
      sourceRecordId: record.recordId,
      sourceSpatialUnit: "province",
      sourceRegion: regionName,
      mappingMethod: "source-province-value",
      imputed: false,
    });
  }

  return finishChoroplethLayer({
    target,
    entry,
    series,
    seriesMeta,
    members: new Map(),
    boundaries,
    report,
    stats: {
      sourceValueCount,
      duplicateValueCount,
      providedZeroCount,
      unmatched,
      sourceRowCount: (element?.observations?.records || []).length,
      sourceRegionCount: regionsSeen.size,
      rowsWithoutRegion,
    },
    aggregationLevel: "pre-2025-63-province",
    spatialScopeType: "region",
    mappingMethod: "source-province-value",
  });
}

/**
 * A layer prepared in V155 whose asset now exists (P6b).
 *
 * The declaration is published as written - renderer, selectors, notices and
 * field labels were reviewed with the asset - and only the data URL moves, from
 * `spatial/pending-v155/` to `spatial/layers/`, so the layer reads from the same
 * place as every other registered layer.
 */
function registerPendingLayer(target, pendingLayers, report, catalog) {
  const declared = pendingLayers.get(target.elementId);
  if (!declared) {
    report.push({
      elementId: target.elementId,
      status: "not-connected",
      build: "pending-v155",
      reason: "pending-layers-v155.json에 선언이 없습니다",
    });
    return null;
  }
  const layer = { ...declared };
  // The contract decides which map group a layer appears in; the V155 declaration
  // predates the V157 grouping and may name a catalog category the screen has no
  // group for.
  layer.category = target.category;
  delete layer.dataUrlRegistrationTarget;
  delete layer.mapTargetV138;
  if (declared.dataUrl) {
    const from = resolve(DATA, declared.dataUrl.replace(/^\/data\/[^/]+\/v2\//u, ""));
    const target_ = `spatial/layers/${target.elementId.toLowerCase()}.json`;
    const to = resolve(DATA, target_);
    if (existsSync(from)) {
      const payload = readJson(from);
      // Published, so it states the runtime's contract and stops calling itself
      // pending. The substantive caveat lives on the layer (accuracyNotice ·
      // publicSpatialNotice · spatialLimitation), which is what a reader sees.
      // The panel reads seriesCoverage to say how many units the source left out.
      // Computed from the asset's own values, per variable and period.
      const joinKey = payload.joinKey || declared.joinKey || "adm1Code";
      const expectedCount = /34/u.test(joinKey) ? 34 : 63;
      const coverage = new Map();
      for (const row of payload.values || []) {
        if (typeof row.value !== "number" || !Number.isFinite(row.value)) continue;
        const key = `${row.variable} ${row.period}`;
        const seen = coverage.get(key) || { variable: row.variable, period: row.period, keys: new Set() };
        seen.keys.add(String(row[joinKey] ?? row.adm1Code ?? row.stringId ?? ""));
        coverage.set(key, seen);
      }
      const seriesCoverage =
        payload.seriesCoverage ||
        [...coverage.values()].map((row) => ({
          variable: row.variable,
          period: row.period,
          expectedCount,
          matchedCount: row.keys.size,
          missingCount: Math.max(0, expectedCount - row.keys.size),
          failureCount: 0,
        }));
      const published = {
        ...payload,
        seriesCoverage,
        schemaVersion: "v124",
        pending: undefined,
        pendingNotice: undefined,
        publishedFrom: declared.dataUrl,
        sourceNotice: payload.pendingNotice ?? payload.sourceNotice,
      };
      writeJson(to, published);
      layer.dataUrl = `${publishedPrefix(declared.dataUrl)}${target_}`;
    } else if (!existsSync(to)) {
      report.push({
        elementId: target.elementId,
        status: "not-connected",
        build: "pending-v155",
        reason: `준비 데이터 파일이 없습니다: ${declared.dataUrl}`,
      });
      return null;
    } else {
      layer.dataUrl = `${publishedPrefix(declared.dataUrl)}${target_}`;
    }
  }
  // The declaration states its policy as a bare kind; the published layer carries
  // the same object every other layer does, so the boundary audit reads one shape.
  layer.boundaryPolicy = boundaryPolicyForLayer(
    target,
    layer,
    (layer.selectors?.variables || []).map((option) => option.measureId || option.key)
  );
  // The panel reads these on every layer. A declaration written before
  // registration has none of them, so they are filled from the asset: every
  // feature the asset carries is drawn, nothing is missing and nothing imputed.
  const featureCount = Number(layer.featureCount ?? 0);
  const drawsPoints = /point|line/iu.test(String(layer.renderer || "")) ||
    (layer.geometryTypes || []).some((type) => /point|line/iu.test(type));
  const entry = catalogEntry(catalog, target.elementId);
  layer.missingRegions = layer.missingRegions ?? [];
  layer.join = layer.join ?? {
    requiredCount: featureCount,
    matchedCount: featureCount,
    missingCount: 0,
    failures: [],
  };
  layer.fakeGeometryCount = layer.fakeGeometryCount ?? 0;
  layer.zeroImputationCount = layer.zeroImputationCount ?? 0;
  layer.totalEntityCount = layer.totalEntityCount ?? featureCount;
  layer.sourceCoordinateCount = layer.sourceCoordinateCount ?? (drawsPoints ? featureCount : 0);
  layer.displayedCoordinateCount =
    layer.displayedCoordinateCount ?? (drawsPoints ? featureCount : 0);
  layer.downloadStatus =
    layer.downloadStatus ?? (entry?.downloadAllowed ? "available" : "source-restricted");
  layer.downloadableRecordCount =
    layer.downloadableRecordCount ?? (entry?.downloadableRecordCount ?? 0);
  layer.mapTargetV138 = {
    publicName: target.publicName,
    sourceSpatialUnit: target.sourceSpatialUnit,
    displaySpatialUnit: target.displaySpatialUnit,
    selectableVariables: target.selectableVariables,
    unit: target.unit,
    period: target.period,
    representativeItem: target.representativeItem,
    evidence: target.evidence,
    limitation: target.limitation,
  };
  report.push({
    elementId: target.elementId,
    status: "implemented",
    build: "pending-v155",
    layerId: layer.layerId,
    featureCount: layer.featureCount ?? null,
    registeredFrom: "spatial/pending-layers-v155.json",
  });
  return layer;
}

/**
 * V162: an ETL-written choropleth (B-031..B-034) gets the sheet's 34-unit
 * values the same way. The target declares which column feeds which variable
 * (`build.source34`); the variable is named by key or by its public label.
 */
function attachSource34ToEtlAsset(layer, target, packs, boundaries34) {
  const spec = target.build.source34;
  if (!spec || !layer.dataUrl) return null;
  // The asset under the tree being built (a staging tree in a refresh).
  const assetPath = resolve(DATA, layer.dataUrl.replace(/^\/data\/vietnam\/v2\//u, ""));
  if (!existsSync(assetPath)) return null;
  const asset = readJson(assetPath);
  const variables = asset.selectors?.variables || [];
  const records = rowsOfSystem(packs?.get(target.elementId)?.entities?.records || [], "adm1").filter(
    (record) => !spec.indicatorIds || spec.indicatorIds.includes(record.indicatorId)
  );
  const specs = spec.measures.map((measure) => {
    const option = variables.find((row) => row.key === measure.variable || row.label === measure.variableLabel);
    if (!option) throw new Error(`${target.elementId}: source34 variable ${measure.variable || measure.variableLabel} is not on the layer`);
    return {
      sourceKey: measure.sourceKey,
      unit: option.unit,
      where: measure.where,
      variableOf: () => option.key,
      labelOf: () => option.label,
      periodOf: (attributes) => measure.period || periodKeyOf(attributes[measure.periodKey]) || "",
    };
  });
  const section = source34Section(buildSource34Values(records, specs, boundaries34), asset.selectors);
  const { values34: _previous, ...rest } = asset;
  const nextAsset = {
    ...rest,
    ...(section.rows.length ? { values34: section.rows } : {}),
    validation: { ...(asset.validation || {}), source34: section.validation },
  };
  writeJson(assetPath, nextAsset);
  return section.validation;
}

function patchExistingLayer(layer, target, report, packs, locator, boundaries34) {
  const patch = target.build.patch || {};
  const next = { ...layer };
  const source34 = boundaries34 ? attachSource34ToEtlAsset(layer, target, packs, boundaries34) : null;
  // V151-2: the 34-unit policy and, for point layers, the province each
  // source coordinate falls in.
  next.boundaryPolicy = boundaryPolicyForLayer(
    target,
    layer,
    (layer.selectors?.variables || []).map((option) => option.measureKey || option.key)
  );
  if ((layer.geometryTypes || []).some((type) => /point/iu.test(type)) && layer.renderer !== "regional-scope") {
    const records = packs?.get(target.elementId)?.entities?.records || [];
    const locations = writeLocationSidecar(target.elementId, records, locator);
    if (locations) {
      next.locationsUrl = locations.dataUrl;
      next.locationCounts = locations.counts;
    }
  }
  if (patch.analysisItemLabel) {
    next.analysisItemLabel = patch.analysisItemLabel;
    next.selectors = {
      ...layer.selectors,
      variables: layer.selectors.variables.map((option, index) =>
        index === 0 && option.key === "locations"
          ? { ...option, label: patch.analysisItemLabel, unit: patch.countNoun || option.unit }
          : option
      ),
    };
  }
  if (patch.countNoun) next.countNoun = patch.countNoun;
  // Filters and facts the ETL layer lacks (A-023's source filter): appended
  // once, never duplicated on a rebuild.
  if (patch.filtersAppend) {
    next.filters = [
      ...(layer.filters || []).filter((filter) => !patch.filtersAppend.some((added) => added.field === filter.field)),
      ...patch.filtersAppend,
    ];
  }
  if (patch.factFieldsAppend && layer.factFields) {
    next.factFields = [
      ...layer.factFields.filter((fact) => !patch.factFieldsAppend.some((added) => added.key === fact.key)),
      ...patch.factFieldsAppend,
    ];
  }
  if (patch.periodLabel) next.periodLabel = patch.periodLabel;
  // V162: one map object per stated identity (C-025: one project, its
  // issuance records as members) - the count is recounted from the records.
  if (patch.featureIdentity) {
    next.featureIdentity = patch.featureIdentity;
    const records = (packs?.get(target.elementId)?.entities?.records || []).filter((record) => record.mapEligible);
    const keys = new Set(
      records.map(
        (record) =>
          patch.featureIdentity.sources.map((key) => text(record.normalizedAttributes?.[key])).filter(Boolean).join("|") ||
          record.recordId
      )
    );
    next.featureCount = keys.size;
  }
  if (patch.defaultVariableMeasureId) {
    const wanted = layer.selectors.variables.find((option) => option.measureId === patch.defaultVariableMeasureId);
    const current = layer.selectors.variables.find((option) => option.key === layer.selectors.defaultVariable);
    if (wanted && !(patch.defaultVariableLabelPattern && new RegExp(patch.defaultVariableLabelPattern, "u").test(current?.label || ""))) {
      next.selectors = {
        ...next.selectors,
        defaultVariable: wanted.key,
        defaultPeriod: wanted.periods[wanted.periods.length - 1],
      };
    }
  }
  next.mapTargetV138 = {
    sourceSpatialUnit: target.sourceSpatialUnit,
    displaySpatialUnit: target.displaySpatialUnit,
    limitation: target.limitation,
    evidence: target.evidence,
    representativeItem: target.representativeItem,
  };
  report.push({
    elementId: target.elementId,
    status: "implemented",
    representation: target.representation,
    build: "existing",
    featureCount: layer.featureCount,
    patched: Object.keys(patch),
    ...(source34 ? { source34 } : {}),
  });
  return next;
}

// ---------------------------------------------------------------- main

function main() {
  const contract = readJson(CONTRACT_PATH);
  const mapIndex = readJson(resolve(DATA, "map-index.json"));
  const catalog = readJson(resolve(DATA, "catalog.json"));
  const manifest = readJson(resolve(DATA, "manifest.json"));
  const packs = loadPacks();
  const boundaries = loadBoundaries();
  boundaries.boundaries34 = loadBoundaries34();
  const crosswalk = buildReorganisationCrosswalk(boundaries.boundaries34);
  const locator = loadProvinceLocator(DATA);
  const pendingLayers = new Map(
    (existsSync(resolve(DATA, "spatial/pending-layers-v155.json"))
      ? readJson(resolve(DATA, "spatial/pending-layers-v155.json")).layers || []
      : []
    ).map((layer) => [layer.elementId, layer])
  );
  const report = [];
  const existingByElement = new Map(mapIndex.layers.map((layer) => [layer.elementId, layer]));
  // A layer this script wrote in an earlier run is rebuilt, never carried over.
  const etlLayers = mapIndex.layers.filter((layer) => !String(layer.layerId).startsWith(LAYER_ID_PREFIX));
  const etlByElement = new Map(etlLayers.map((layer) => [layer.elementId, layer]));

  const layers = [];
  for (const target of contract.targets) {
    const kind = target.build.kind;
    if (kind === "existing") {
      const layer = etlByElement.get(target.elementId);
      if (!layer) {
        report.push({ elementId: target.elementId, status: "not-connected", build: "existing", reason: "ETL layer missing from map-index" });
        continue;
      }
      layers.push(patchExistingLayer(layer, target, report, packs, locator, boundaries.boundaries34));
      continue;
    }
    if (kind === "none") {
      report.push({
        elementId: target.elementId,
        status: "not-connected",
        representation: target.representation,
        build: "none",
        reason: target.build.reason,
        requiredAsset: target.build.requiredAsset,
        forbidden: target.build.forbidden,
      });
      continue;
    }
    // A V155 layer is republished from its declaration, not patched as if the
    // ETL had produced it: a rerun must not depend on what an earlier run wrote.
    if (kind === "pending-v155") {
      const layer = registerPendingLayer(target, pendingLayers, report, catalog);
      if (layer) layers.push(layer);
      continue;
    }
    if (etlByElement.has(target.elementId)) {
      // The ETL's own layer wins over a derived one.
      layers.push(patchExistingLayer(etlByElement.get(target.elementId), target, report, packs, locator, boundaries.boundaries34));
      continue;
    }
    if (kind === "observation-dimension") {
      layers.push(buildObservationDimensionLayer(target, packs, boundaries, catalog, report));
    } else if (kind === "admin1-attributes") {
      layers.push(buildAdmin1Layer(target, packs, boundaries, catalog, report));
    } else if (kind === "region-membership") {
      layers.push(buildRegionMembershipLayer(target, packs, boundaries, crosswalk, catalog, report));
    } else if (kind === "entities") {
      layers.push(buildEntityLayer(target, packs, catalog, report, locator));
    } else if (kind === "group-constant") {
      layers.push(buildGroupConstantLayer(target, packs, boundaries, catalog, report));
    } else if (kind === "entity-join") {
      layers.push(buildMineJoinLayer(target, packs, catalog, report, etlByElement));
    } else {
      throw new Error(`unknown build kind ${kind} for ${target.elementId}`);
    }
  }
  // ETL layers outside the contract are kept so nothing published is lost - but
  // a target the contract drops (C-009·C-010·C-019 in V157) is dropped on purpose.
  const droppedByContract = new Set(
    (contract.droppedElementIds || []).map((elementId) => String(elementId))
  );
  for (const layer of etlLayers) {
    if (droppedByContract.has(layer.elementId)) continue;
    if (contract.targets.every((target) => target.elementId !== layer.elementId)) continue;
    if (!layers.some((item) => item.elementId === layer.elementId)) layers.push(layer);
  }

  const activeLayers = layers.filter((layer) => layer.active !== false && layer.enabled !== false);
  const mapFeatureCount = activeLayers.reduce((sum, layer) => sum + (layer.featureCount || 0), 0);
  const nextIndex = {
    ...mapIndex,
    activeMapLayerCount: activeLayers.length,
    mapFeatureCount,
    layers,
    mapTargetContract: {
      schemaVersion: contract.schemaVersion,
      targetCount: contract.targets.length,
      connectedCount: report.filter((row) => row.status !== "not-connected").length,
      notConnected: report
        .filter((row) => row.status === "not-connected")
        .map((row) => ({ elementId: row.elementId, reason: row.reason || row.disabledReason || "" })),
    },
  };
  writeJson(resolve(DATA, "map-index.json"), nextIndex);

  // The finder reads map availability off the catalog.
  const layerByElement = new Map(layers.map((layer) => [layer.elementId, layer]));
  const catalogModeFor = (layer) =>
    layer.renderer === "line"
      ? "line"
      : layer.renderer === "regional-scope"
        ? "regional-scope"
        : layer.mapMode === "region-choropleth"
          ? "region-choropleth"
          : layer.renderer === "admin1-choropleth" ||
              layer.renderer === "partial-choropleth" ||
              layer.renderer === "unit-choropleth"
            ? "choropleth"
            : layer.renderer === "cluster"
              ? "cluster"
              : "point";
  // V157: a target the contract dropped keeps no map claim in the catalog - the
  // finder's "지도 있음" filter reads this, and it counted the three dropped layers
  // until the value was cleared here.
  for (const elementId of droppedByContract) {
    const item = catalog.elements.find((row) => row.elementId === elementId);
    if (!item) continue;
    item.mapMode = "panel-only";
    item.mapFeatureCount = 0;
  }
  for (const item of catalog.elements) {
    const layer = layerByElement.get(item.elementId);
    if (!layer || layer.enabled === false) continue;
    // Layers this script owns: the ones it builds, and the V155 assets it
    // registers in P6b. An ETL layer keeps the catalog values the ETL wrote.
    if (
      String(layer.layerId).startsWith(LAYER_ID_PREFIX) ||
      String(layer.layerId).startsWith(PENDING_LAYER_ID_PREFIX)
    ) {
      item.mapMode = catalogModeFor(layer);
      item.mapFeatureCount = layer.featureCount;
    }
  }
  writeJson(resolve(DATA, "catalog.json"), catalog);
  manifest.mapLayerCount = activeLayers.length;
  manifest.mapFeatureCount = mapFeatureCount;
  writeJson(resolve(DATA, "manifest.json"), manifest);

  const summary = {
    schema: "map-targets-build-v138",
    generatedAt: new Date().toISOString(),
    dataRoot: DATA.replace(ROOT, "").replace(/\\/g, "/"),
    targetCount: contract.targets.length,
    counts: {
      implemented: report.filter((row) => row.status === "implemented").length,
      partial: report.filter((row) => row.status === "partial").length,
      notConnected: report.filter((row) => row.status === "not-connected").length,
    },
    activeMapLayerCount: activeLayers.length,
    mapFeatureCount,
    crosswalk34: [...crosswalk.membersByParent].map(([key, members]) => ({
      region: members.label,
      key,
      memberAdm1Codes: [...members.codes].sort(),
    })),
    targets: report,
    mapIndexSha256: sha256(canonicalJson(nextIndex)),
  };
  writeJson(REPORT_PATH, summary);
  process.stdout.write(
    `map targets: ${summary.counts.implemented} implemented, ${summary.counts.partial} partial, ${summary.counts.notConnected} not connected · layers ${activeLayers.length} · features ${mapFeatureCount}\n`
  );
  for (const row of report) {
    if (row.status === "not-connected" || (row.unmatchedRegionNames && row.unmatchedRegionNames.length)) {
      process.stdout.write(`  ${row.elementId}: ${row.status} ${row.reason || ""} ${row.unmatchedRegionNames ? JSON.stringify(row.unmatchedRegionNames) : ""}\n`);
    }
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main();
}
