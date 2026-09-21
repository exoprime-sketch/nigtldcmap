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
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { gunzipSync } from "node:zlib";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(SCRIPT_DIR, "../..");
const argv = process.argv.slice(2);
const opt = (name, fallback) => {
  const index = argv.indexOf(name);
  return index < 0 ? fallback : argv[index + 1];
};
const DATA = resolve(ROOT, opt("--data", process.env.VIETNAM_DATA_ROOT || "public/data/vietnam/v2"));
const CONTRACT_PATH = resolve(ROOT, "src/data/visualization/publicMapTargetsV138.json");
const REPORT_PATH = resolve(ROOT, "reports/v138/map-targets-build-v138.json");
const GENERATED_AT = "2026-09-01T00:00:00Z";
const GEOMETRY_URL = "/data/vietnam/v2/geometry/vnm-adm1-63.geojson";
const LAYER_ID_PREFIX = "vnm-v138-";
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

/** Fold a place name the way tools/vietnam_etl/b034_facts_v137.normalize_place does. */
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
 * The 2025 reorganisation, as the delivery states it.
 *
 * Every climate row names the 34-unit successor its 63-unit province was folded
 * into. That column is the only crosswalk in the delivery between the two
 * systems, so a value filed under a 34-unit name is shown on the union of its
 * member 63-unit boundaries - the same explicit-membership rule B-021 already
 * uses for the six GDL regions - and never redistributed.
 */
function buildReorganisationCrosswalk(packs, boundaries) {
  const membersByParent = new Map();
  const parentByCode = new Map();
  const b003 = packs.get("B-003");
  for (const record of b003?.entities?.records || []) {
    const attributes = record.normalizedAttributes || {};
    if (text(attributes["행정단위"]) === "Country") continue;
    const parent = text(attributes["2025_개편_후_소속_34개_체계"]);
    const match =
      boundaries.lookup.get(normalizePlace(attributes["지역명_베트남어"])) ||
      boundaries.lookup.get(normalizePlace(attributes["지역명_로마자"]));
    if (!parent || !match) continue;
    const parentKey = normalizeAdministrativeName(parent);
    parentByCode.set(match.adm1Code, { key: parentKey, label: parent });
    const members = membersByParent.get(parentKey) || { label: parent, codes: new Set() };
    members.codes.add(match.adm1Code);
    membersByParent.set(parentKey, members);
  }
  return { membersByParent, parentByCode };
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
  const records = (element?.entities?.records || []).filter(
    (record) =>
      (!build.indicatorIds || build.indicatorIds.includes(record.indicatorId)) &&
      (!build.requireCoordinates || (typeof record.latitude === "number" && typeof record.longitude === "number"))
  );
  const regionKeys = build.regionKeys || ["지역명_베트남어", "지역명_로마자"];
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
        sourceIndicatorId: record.indicatorId,
        sourceRecordId: record.recordId,
        sourceSpatialUnit: "admin1",
        imputed: false,
      });
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
    stats: { sourceValueCount, duplicateValueCount, providedZeroCount, unmatched, sourceRowCount: records.length },
    aggregationLevel: "admin1",
    spatialScopeType: "admin1",
    mappingMethod: null,
  });
}

/**
 * Values filed under the 34-unit successor provinces, drawn on the member
 * 63-unit boundaries with the membership stated on every row.
 */
function buildRegionMembershipLayer(target, packs, boundaries, crosswalk, catalog, report) {
  const { build } = target;
  const element = packs.get(target.elementId);
  const entry = catalogEntry(catalog, target.elementId);
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

  for (const record of records) {
    const attributes = record.normalizedAttributes || {};
    const regionName = text(attributes[build.regionNameKey]);
    if (!regionName) {
      // A national or unlocated row in the same indicator; not a join failure.
      rowsWithoutRegion += 1;
      continue;
    }
    const parentKey = normalizeAdministrativeName(regionName);
    const membership = crosswalk.membersByParent.get(parentKey);
    if (!membership) {
      unmatched.set(regionName, (unmatched.get(regionName) || 0) + 1);
      continue;
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
          mappingMethod: "explicit-2025-34-unit-membership",
          imputed: false,
        });
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
    },
  };
  const dataUrl = `/data/vietnam/v2/spatial/layers/${elementId.toLowerCase()}.json`;
  writeJson(resolve(DATA, `spatial/layers/${elementId.toLowerCase()}.json`), asset);

  const latestYear = periods.filter((period) => /^\d{4}$/.test(period)).slice(-1)[0] || periods[periods.length - 1] || null;
  const isRegion = spatialScopeType === "region";
  const layer = {
    ...baseLayerFacts(entry, target),
    accuracyNotice: isRegion
      ? "개편 후 34개 성·시 값을 소속 63개 성·시 경계에 동일하게 표시하며 성·시별 독립값이 아닙니다. 누락값은 투명 처리하고 0으로 대체하지 않습니다."
      : "누락값은 투명 처리하며 0으로 대체하지 않습니다. 개편 전 63개 행정구역 기준입니다.",
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
      note: `단위 ${defaultOption?.unit || target.unit} · 결측 ${63 - (defaultOption?.maxFeatureCount || 0)}개 성·시`,
      title: defaultOption?.label || target.publicName,
    },
    mapBenefit: target.selectableVariables,
    mapMode: isRegion ? "region-choropleth" : "choropleth",
    missingRegions,
    publicSpatialNotice: isRegion
      ? "개편 후 34개 성·시 값을 소속 63개 성·시 경계에 표시합니다."
      : "개편 전 63개 성·시 통계 경계를 사용합니다.",
    renderer: coverageKind === "full" ? "admin1-choropleth" : "partial-choropleth",
    sourceCoordinateCount: 0,
    sourceYear: latestYear,
    spatialCoverage: isRegion
      ? `개편 후 34개 성·시 중 ${stats.sourceRegionCount || 0}개 값을 소속 63개 경계에 표시`
      : `개편 전 63개 성·시 중 선택 계열 최대 ${maxSeriesFeatureCount}개`,
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
    sourceRegionCount: stats.sourceRegionCount,
    duplicateValueCount: stats.duplicateValueCount,
    valueTable: useTable,
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

function approximateTest(build) {
  const rule = build.approximate;
  if (!rule) return () => false;
  if (rule.always) return () => true;
  const pattern = new RegExp(rule.pattern, "u");
  return (record) => pattern.test(text((record.normalizedAttributes || {})[rule.sourceKey]));
}

function buildEntityLayer(target, packs, catalog, report) {
  const { build } = target;
  const elementId = target.elementId;
  const element = packs.get(elementId);
  const entry = catalogEntry(catalog, elementId);
  const records = element?.entities?.records || [];
  const { features, excluded } = displayableEntityRecords(records, build);
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
  };
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

// ---------------------------------------------------------------- existing layers

function patchExistingLayer(layer, target, report) {
  const patch = target.build.patch || {};
  const next = { ...layer };
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
  const crosswalk = buildReorganisationCrosswalk(packs, boundaries);
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
      layers.push(patchExistingLayer(layer, target, report));
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
    if (etlByElement.has(target.elementId)) {
      // The ETL's own layer wins over a derived one.
      layers.push(patchExistingLayer(etlByElement.get(target.elementId), target, report));
      continue;
    }
    if (kind === "admin1-attributes") {
      layers.push(buildAdmin1Layer(target, packs, boundaries, catalog, report));
    } else if (kind === "region-membership") {
      layers.push(buildRegionMembershipLayer(target, packs, boundaries, crosswalk, catalog, report));
    } else if (kind === "entities") {
      layers.push(buildEntityLayer(target, packs, catalog, report));
    } else {
      throw new Error(`unknown build kind ${kind} for ${target.elementId}`);
    }
  }
  // ETL layers outside the 43 (none today) are kept so nothing published is lost.
  for (const layer of etlLayers) {
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
          : layer.renderer === "admin1-choropleth" || layer.renderer === "partial-choropleth"
            ? "choropleth"
            : layer.renderer === "cluster"
              ? "cluster"
              : "point";
  for (const item of catalog.elements) {
    const layer = layerByElement.get(item.elementId);
    if (!layer || layer.enabled === false) continue;
    if (String(layer.layerId).startsWith(LAYER_ID_PREFIX)) {
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
