#!/usr/bin/env node
/**
 * Map layers for a second country (V162, first used for BGD).
 *
 *   node scripts/v158/build-country-map-layers-v158.mjs --country bgd [--check]
 *
 * Reads the country's published packs, its 8-unit ADM1 geometry and dissolved
 * outline, the map evidence extracted from the delivered workbooks
 * (reports/v162/<iso3>-map-evidence-v162.json) and the reviewed decisions in
 * tools/etl/countries/<iso3>/map-targets.json, and writes
 *
 *   <dataRoot>/spatial/layers/<id>.json    division choropleth values (valueTable)
 *   <dataRoot>/spatial/points/<id>.geojson point and reference-point features
 *   <dataRoot>/map-index.json              layers + mapTargetContract
 *   <dataRoot>/catalog.json, manifest.json map mode / feature counts
 *   reports/v162/<iso3>-map-layers-v162.json      per-layer build facts
 *   reports/v162/<iso3>-map-judgement-v162.md     72-row decision table
 *
 * --check regenerates everything in memory and exits 1 when a file differs.
 *
 * Nothing here invents data: a division value is published only where the
 * source states it for that division (no 0-filling, no district -> division
 * aggregation, no apportioning); a point is published only where the source
 * gives a coordinate inside the country outline (+0.05 deg, the same buffer
 * as tools/etl/countries/bgd/extract_map_evidence.py) that is not an
 * administrative representative point. The outside-outline counts must equal
 * the evidence file's, or the build fails.
 */
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { loadPacks } from "../v140/card-model-v140.mjs";

const ROOT = resolve(fileURLToPath(new URL("../..", import.meta.url)));
const argv = process.argv.slice(2);
const arg = (name, fallback = null) => {
  const index = argv.indexOf(name);
  return index >= 0 && argv[index + 1] && !argv[index + 1].startsWith("--") ? argv[index + 1] : fallback;
};
const CHECK = argv.includes("--check");
const ISO3 = String(arg("--country", "") || "").toUpperCase();
if (!ISO3) {
  console.error("usage: build-country-map-layers-v158.mjs --country <iso3> [--check]");
  process.exit(2);
}

const readJson = (path) => JSON.parse(readFileSync(path, "utf8"));
const text = (value) => (value === null || value === undefined ? "" : String(value).normalize("NFC").trim());
const sha = (value, length = 10) => createHash("sha1").update(String(value)).digest("hex").slice(0, length);
// Same token rule as extract_map_evidence.py normalize_token.
const normalizeToken = (value) => String(value).toLowerCase().replace(/[^a-z0-9]+/gu, "");
const isNumber = (value) => typeof value === "number" && Number.isFinite(value);
const compareText = (a, b) => (a < b ? -1 : a > b ? 1 : 0);

// ------------------------------------------------------------------ inputs
const registry = readJson(resolve(ROOT, "public/data/countries.json")).countries.find((row) => row.iso3 === ISO3);
if (!registry) throw new Error(`COUNTRY_NOT_REGISTERED: ${ISO3}`);
const SLUG = ISO3.toLowerCase();
const DATA_ROOT_URL = registry.dataRoot; // "/data/bgd/v2"
const DATA = resolve(ROOT, `public${DATA_ROOT_URL}`);
const ETL = readJson(resolve(ROOT, `tools/etl/countries/${SLUG}/country.json`));
const CONFIG_PATH = `tools/etl/countries/${SLUG}/map-targets.json`;
const CONFIG = readJson(resolve(ROOT, CONFIG_PATH));
const EVIDENCE_PATH = arg("--evidence", `reports/v162/${SLUG}-map-evidence-v162.json`);
const EVIDENCE = readJson(resolve(ROOT, EVIDENCE_PATH));
const TARGETS = readJson(resolve(ROOT, "src/data/visualization/publicMapTargetsV138.json")).targets;
const REGION_DICTIONARY = readJson(resolve(ROOT, "src/data/geo/regionNamesV161.json")).countries[ISO3];
const PROVIDER = ETL.packPrefix; // "bgd-v162"
const REGION = CONFIG.regionWord; // "주(Division)"
const ADM1_COUNT = registry.adm.level1.count;
const REPORT_JSON = `reports/v162/${SLUG}-map-layers-v162.json`;
const REPORT_MD = `reports/v162/${SLUG}-map-judgement-v162.md`;
const OUTLINE_BUFFER_DEG = 0.05;

const mapIndexPath = resolve(DATA, "map-index.json");
const catalogPath = resolve(DATA, "catalog.json");
const manifestPath = resolve(DATA, "manifest.json");
const mapIndex = readJson(mapIndexPath);
const catalog = readJson(catalogPath);
const manifest = readJson(manifestPath);
const GENERATED_AT = mapIndex.generatedAt; // fixed - the build is byte-deterministic
const cards = existsSync(resolve(DATA, "home/card-summaries-v140.json"))
  ? new Map(readJson(resolve(DATA, "home/card-summaries-v140.json")).cards.map((card) => [card.elementId, card]))
  : new Map();
const catalogById = new Map(catalog.elements.map((item) => [item.elementId, item]));
const packs = loadPacks(DATA);

// ------------------------------------------------------------------ geometry
const geometryManifest = readJson(resolve(ROOT, `public${mapIndex.geometryManifest}`));
const adm1Asset = geometryManifest.assets.find((asset) => asset.kind === "adm1-boundary");
const outlineAsset = geometryManifest.assets.find((asset) => asset.kind === "country-outline");
const ADM1_URL = adm1Asset.url;
const adm1 = readJson(resolve(ROOT, `public${ADM1_URL}`));
const divisionOrder = (key) => Number(String(key).match(/\.(\d+)_1$/u)?.[1] || 0);
const DIVISIONS = adm1.features
  .map((feature) => ({ key: feature.properties.divisionKey, nameEn: feature.properties.nameEn, nameKo: feature.properties.nameKo }))
  .sort((a, b) => divisionOrder(a.key) - divisionOrder(b.key));
if (DIVISIONS.length !== ADM1_COUNT) throw new Error(`ADM1_COUNT_MISMATCH: geometry ${DIVISIONS.length} vs registry ${ADM1_COUNT}`);
const divisionByKey = new Map(DIVISIONS.map((division) => [division.key, division]));
const divisionByNameEn = new Map(DIVISIONS.map((division) => [division.nameEn, division]));
// Dictionary key token -> the division its entry names (keys like "chattogram").
const dictionaryDivision = new Map();
for (const entry of REGION_DICTIONARY.entries.filter((row) => row.level === "division")) {
  for (const key of entry.keys) dictionaryDivision.set(normalizeToken(key), entry.local);
}
for (const local of new Set(dictionaryDivision.values())) {
  if (!divisionByNameEn.has(local)) throw new Error(`DICTIONARY_GEOMETRY_MISMATCH: dictionary division ${local} not in ${ADM1_URL}`);
}
// Dictionary key token -> the division a division or district entry belongs
// to ("coxsbazar" -> Chittagong). A token two entries place in different
// divisions is ambiguous and names none.
const dictionaryParentDivision = new Map();
for (const entry of REGION_DICTIONARY.entries) {
  const local = entry.level === "division" ? entry.local : entry.level === "district" ? entry.parent : null;
  if (!local || !divisionByNameEn.has(local)) continue;
  for (const key of entry.keys) {
    const token = normalizeToken(key);
    const known = dictionaryParentDivision.get(token);
    dictionaryParentDivision.set(token, known === undefined || known === local ? local : null);
  }
}
const KEY_PATTERN = new RegExp(`^${ISO3}\\.(\\d+)_1(?:_(\\d{4}))?(?=_|$)`, "u");

const outline = readJson(resolve(ROOT, `public${outlineAsset.url}`));
const outlinePolygons = [];
for (const feature of outline.features) {
  const polys = feature.geometry.type === "Polygon" ? [feature.geometry.coordinates] : feature.geometry.coordinates;
  for (const rings of polys) {
    let [w, s, e, n] = [Infinity, Infinity, -Infinity, -Infinity];
    for (const [x, y] of rings[0]) {
      w = Math.min(w, x); e = Math.max(e, x); s = Math.min(s, y); n = Math.max(n, y);
    }
    outlinePolygons.push({ rings, bbox: [w - OUTLINE_BUFFER_DEG, s - OUTLINE_BUFFER_DEG, e + OUTLINE_BUFFER_DEG, n + OUTLINE_BUFFER_DEG] });
  }
}
function pointInRing(x, y, ring) {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i, i += 1) {
    const [xi, yi] = ring[i];
    const [xj, yj] = ring[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}
function ringDistance2(x, y, ring) {
  let best = Infinity;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i, i += 1) {
    const [ax, ay] = ring[j];
    const [bx, by] = ring[i];
    const dx = bx - ax;
    const dy = by - ay;
    const len = dx * dx + dy * dy;
    const t = len ? Math.max(0, Math.min(1, ((x - ax) * dx + (y - ay) * dy) / len)) : 0;
    const cx = ax + t * dx - x;
    const cy = ay + t * dy - y;
    best = Math.min(best, cx * cx + cy * cy);
  }
  return best;
}
const insideCache = new Map();
/** Inside the outline buffered by OUTLINE_BUFFER_DEG (shapely outline.buffer(0.05).contains). */
function insideOutline(lon, lat) {
  const cacheKey = `${lon},${lat}`;
  if (insideCache.has(cacheKey)) return insideCache.get(cacheKey);
  let inside = false;
  const limit = OUTLINE_BUFFER_DEG * OUTLINE_BUFFER_DEG;
  for (const polygon of outlinePolygons) {
    const [w, s, e, n] = polygon.bbox;
    if (lon < w || lon > e || lat < s || lat > n) continue;
    const inOuter = pointInRing(lon, lat, polygon.rings[0]);
    const inHole = inOuter && polygon.rings.slice(1).some((ring) => pointInRing(lon, lat, ring));
    if (inOuter && !inHole) { inside = true; break; }
    if (polygon.rings.some((ring) => ringDistance2(lon, lat, ring) <= limit)) { inside = true; break; }
  }
  insideCache.set(cacheKey, inside);
  return inside;
}
const hasCoordinate = (row) => isNumber(row.latitude) && isNumber(row.longitude);

// ------------------------------------------------------------------ evidence check
// The coordinate rows and the outside-outline counts the JS port finds must be
// the evidence extractor's (same rows, same outline, same buffer).
const targetIds = TARGETS.map((target) => target.elementId);
const evidenceMismatches = [];
const evidenceRowNotes = [];
const outsideById = new Map();
for (const elementId of targetIds) {
  const evidence = EVIDENCE.elements[elementId];
  const pack = packs.get(elementId);
  const coordinateRows = (pack?.entities?.records || []).filter(hasCoordinate);
  const outside = coordinateRows.filter((row) => !insideOutline(row.longitude, row.latitude)).length;
  outsideById.set(elementId, { coordinateRows: coordinateRows.length, outside });
  const expected = evidence ? evidence.coordinates : { rowsWithLatLon: 0, outsideOutlineCount: 0 };
  if (expected.rowsWithLatLon > coordinateRows.length && expected.outsideOutlineCount === outside) {
    // The pack publishes fewer rows than the workbook holds (rows the country
    // build removed); the outside count still has to agree.
    evidenceRowNotes.push({ elementId, workbookCoordinateRows: expected.rowsWithLatLon, publishedCoordinateRows: coordinateRows.length });
  } else if (expected.rowsWithLatLon !== coordinateRows.length || expected.outsideOutlineCount !== outside) {
    evidenceMismatches.push({ elementId, evidence: { rows: expected.rowsWithLatLon, outside: expected.outsideOutlineCount }, port: { rows: coordinateRows.length, outside } });
  }
}
if (evidenceMismatches.length) {
  console.error(JSON.stringify({ error: "EVIDENCE_OUTSIDE_OUTLINE_MISMATCH", evidenceMismatches }, null, 2));
  process.exit(1);
}

// ------------------------------------------------------------------ decisions
const decisions = new Map();
for (const id of Object.keys(CONFIG.choropleth)) decisions.set(id, "choropleth");
for (const id of Object.keys(CONFIG.points)) decisions.set(id, "point");
for (const id of Object.keys(CONFIG.reference)) decisions.set(id, "reference");
for (const id of Object.keys(CONFIG.regionCounts || {}).filter((key) => /^[A-E]-\d{3}$/u.test(key))) {
  if (decisions.has(id)) throw new Error(`DECISION_DUPLICATE: ${id}`);
  decisions.set(id, "region-count");
}
for (const id of Object.keys(CONFIG.holds)) {
  if (decisions.has(id)) throw new Error(`DECISION_DUPLICATE: ${id}`);
  decisions.set(id, "hold");
}
const undecided = targetIds.filter((id) => !decisions.has(id));
const extra = [...decisions.keys()].filter((id) => !targetIds.includes(id));
if (undecided.length || extra.length || decisions.size !== targetIds.length) {
  throw new Error(`DECISION_TABLE_INCOMPLETE: undecided ${undecided.join(",")} extra ${extra.join(",")}`);
}

// ------------------------------------------------------------------ public text helpers
const SCENARIO_LABELS = { historical: "과거 모형(historical)" };
const scenarioKey = (value) => normalizeToken(value);
const scenarioLabel = (value) => {
  const key = scenarioKey(value);
  if (SCENARIO_LABELS[key]) return SCENARIO_LABELS[key];
  const ssp = key.match(/^ssp(\d)(\d)(\d)$/u);
  return ssp ? `SSP${ssp[1]}-${ssp[2]}.${ssp[3]}` : text(value);
};
const scenarioRank = (value) => {
  const key = scenarioKey(value || "");
  if (!key) return -1;
  if (key === "historical") return 0;
  return Number(key.replace(/\D/gu, "")) || 999;
};
const UNIT_LIKE = /^[-%℃°A-Za-z0-9²³⁻¹/·.\s천일점개건배년μ₂]+$/u;
/** "연평균 기온(℃)" -> { label: "연평균 기온", unit: "℃" }; "분석대상 면적(ha, GFW)" -> label "분석대상 면적(GFW)", unit "ha". */
function splitFieldLabel(label) {
  const match = String(label).match(/^(.*?)\(([^()]*)\)$/u);
  if (!match) return { label: String(label).trim(), unit: "" };
  const parts = match[2].split(",").map((part) => part.trim());
  if (!parts[0] || parts[0].length > 16 || !UNIT_LIKE.test(parts[0]) || /^[A-Z]{2,}$/u.test(parts[0])) return { label: String(label).trim(), unit: "" };
  const rest = parts.slice(1).filter(Boolean);
  const unit = parts[0] === "-" ? "" : parts[0];
  return { label: `${match[1].trim()}${rest.length ? `(${rest.join(", ")})` : ""}`, unit };
}
/** An indicator name without the delivery's structural notes ("(ADM1 단위 개체 목록)", "(기준연도 2017)"). */
function cleanIndicatorLabel(label) {
  return String(label || "")
    .replace(/\s*\([^()]*(?:개체 목록|순위표|ADM1|기준연도 \d{4})[^()]*\)/gu, "")
    .replace(/\s*-\s*월별 평년값.*$/u, "")
    .trim();
}
/** Source organisation text without workbook pointers ("(레코드별 상이 — attr_19 참조)", "(용역사 취합)"). */
function cleanSourceText(value) {
  return text(value)
    .replace(/\s*\([^()]*(?:attr_\d+|\d\.\d_entity|용역사|참조)[^()]*\)/gu, "")
    .replace(/\s*[—-]\s*attr_\d+\s*참조/gu, "")
    .trim();
}
/**
 * The licence names a source states, without the delivery's review notes:
 * "CC BY 4.0" -> CC-BY-4.0, "ADB 이용약관(개인·비상업 한정 …) [사실/표현 분리] …" -> "ADB 이용약관",
 * "… / 좌표: OpenStreetMap(Nominatim) ODbL 1.0" -> also ODbL-1.0 (the geocoded coordinates).
 */
function normalizeLicenses(code) {
  const value = text(code);
  if (!value) return [];
  return value.split(/\s+\/\s+(?=좌표)/u).map((part) => {
    const body = part.replace(/^좌표:\s*/u, "").trim();
    if (/ODbL/iu.test(body)) return "ODbL-1.0";
    const cc = body.match(/^CC[\s-]?BY(?:[\s-](?:NC|SA|ND))*[\s-]?\d\.\d/iu);
    if (cc) return cc[0].toUpperCase().replace(/\s+/gu, "-");
    if (/^CC0/iu.test(body)) return "CC0-1.0";
    if (/^Public Domain/iu.test(body)) return "Public Domain";
    return body.split(/\s+[—–]\s+|\(|\[/u)[0].trim();
  }).filter(Boolean);
}
function attributionFor(org, license) {
  if (license === "ODbL-1.0") return "© OpenStreetMap contributors, Open Database License (ODbL) 1.0";
  return `${org} — ${license}. 이용 시 출처 표기 필수`;
}
/** Licences, organisations and attribution lines for the indicators a layer shows. */
function sourceBlock(elementId, indicatorIds, extraPairs = []) {
  const evidence = EVIDENCE.elements[elementId];
  const pack = packs.get(elementId);
  const wanted = new Set(indicatorIds);
  const notes = (evidence?.licenseNotes || []).filter((note) => note.indicatorIds.some((id) => wanted.has(id)));
  const pairs = new Map();
  for (const note of notes) {
    const org = cleanSourceText(note.sourceOrg);
    if (!org) continue;
    for (const license of normalizeLicenses(note.licenseCode)) pairs.set(`${org}|${license}`, { org: license === "ODbL-1.0" && !/OpenStreetMap/u.test(org) ? "OpenStreetMap contributors" : org, license });
  }
  if (!pairs.size) {
    for (const indicator of pack.meta.indicators.filter((row) => wanted.has(row.indicatorId))) {
      const org = cleanSourceText(indicator.sourceOrg);
      if (!org) continue;
      for (const license of normalizeLicenses(indicator.licenseCode)) pairs.set(`${org}|${license}`, { org, license });
    }
  }
  for (const pair of extraPairs) pairs.set(`${pair.org}|${pair.license}`, pair);
  const sorted = [...pairs.values()].sort((a, b) => compareText(a.org, b.org) || compareText(a.license, b.license));
  const organizations = [...new Set(sorted.filter((row) => row.license !== "ODbL-1.0" || /OpenStreetMap/u.test(row.org)).map((row) => row.org))];
  const licenses = [...new Set(sorted.map((row) => row.license))].sort(compareText);
  const attribution = [...new Set(sorted.map((row) => attributionFor(row.org, row.license)))];
  const urls = [...new Set((pack.meta.element.sourceUrls || []).map(text).filter((url) => /^https?:\/\//u.test(url) && !/(?:api[_-]?key|token|secret|password)=/iu.test(url)))].sort(compareText);
  return { organizations, licenses, attribution, urls };
}
const catalogLabel = (elementId) => text(catalogById.get(elementId)?.elementLabel) || elementId;
const COUNTRY_SPECIFIC = new Set(ETL.countrySpecificElements?.elementIds || []);
/** The public name: the shared target name, unless the element's name differs by country. */
function publicNameOf(target) {
  // A country-specific label lists its fields in brackets ("…계획[국가 RE 용량 목표, …]"); the name is the part before them.
  return COUNTRY_SPECIFIC.has(target.elementId) ? catalogLabel(target.elementId).split(/\[|;/u)[0].trim() : target.publicName;
}
const formatCount = (value) => Number(value).toLocaleString("en-US");
/** "수관 면적 2010" + "2010" -> "수관 면적 2010"; "연평균 기온" + "2025" -> "연평균 기온(2025)". */
const withPeriod = (label, period) => (String(label).includes(String(period)) ? label : `${label}(${period})`);
const yearOf = (period) => String(period ?? "").match(/(?:19|20)\d{2}/gu)?.slice(-1)[0] || null;
function periodSortKey(period) {
  const years = String(period).match(/(?:1[89]|20|21)\d{2}/gu) || [];
  return [Number(years[0] || 0), Number(years[years.length - 1] || 0), String(period)];
}
const comparePeriods = (a, b) => {
  const [a1, a2, a3] = periodSortKey(a);
  const [b1, b2, b3] = periodSortKey(b);
  return a1 - b1 || a2 - b2 || compareText(a3, b3);
};
const downloadStatusOf = (item) => (Number(item?.downloadableRecordCount || 0) > 0 ? "available" : "not-available");
const detailUrlOf = (elementId) => `/?element=${elementId.toLowerCase()}&country=${ISO3}#element-detail`;

// ------------------------------------------------------------------ division choropleth
const STRUCTURAL_ATTR = /^(?:경계_면적_km|래스터_유효면적_km|연도|기준연도|수관밀도_임계|tech_id|연수|\d{1,2}월)$|격자_?수|격자점_수|모델_수|_ID|코드|^전국_|^레코드_키|^PSMSL/u;
const PERIOD_FIELDS = ["연도", "기준연도", "기간", "기간_시작_종료", "기준기간"];
const MONTH_FIELDS = Array.from({ length: 12 }, (_, index) => `${index + 1}월`);
const NAME_FIELDS = ["지역명_로마자", "지역명", "소속_상위_행정구역_GADM_NAME_1"];

function divisionOfName(name) {
  const local = dictionaryDivision.get(normalizeToken(name));
  return local ? divisionByNameEn.get(local) : null;
}

function buildChoropleth(target, spec) {
  const elementId = target.elementId;
  const pack = packs.get(elementId);
  const fieldDefinitions = pack.meta.fieldDefinitions || [];
  const fieldIndex = new Map(fieldDefinitions.map((field, index) => [field.normalizedKey, index]));
  const fieldLabel = (key) => fieldDefinitions.find((field) => field.normalizedKey === key)?.label || key.replace(/_/gu, " ");
  const indicators = new Map(pack.meta.indicators.map((indicator) => [indicator.indicatorId, indicator]));
  const indicatorOrder = new Map(pack.meta.indicators.map((indicator, index) => [indicator.indicatorId, index]));
  const dropped = {};
  const drop = (reason, count = 1) => { dropped[reason] = (dropped[reason] || 0) + count; };
  const series = new Map();
  let nameChecked = 0;
  let sourceRows = 0;
  const seriesOf = (descriptor) => {
    const id = [descriptor.source, descriptor.indicatorId, descriptor.attr, descriptor.scenario || "", descriptor.split || ""].join("|");
    if (!series.has(id)) series.set(id, { id, ...descriptor, cells: new Map(), unitValues: new Set() });
    return series.get(id);
  };
  const addValue = (entry, period, division, value, recordId) => {
    const cellKey = `${period}|${division.key}`;
    if (!entry.cells.has(cellKey)) entry.cells.set(cellKey, { period, division: division.key, values: new Set(), recordIds: [] });
    const cell = entry.cells.get(cellKey);
    cell.values.add(value);
    cell.recordIds.push(recordId);
  };

  // (a) entity rows the source keys to one division.
  for (const row of pack.entities.records) {
    const attributes = row.normalizedAttributes || {};
    const key = text(attributes["레코드_키"] ?? attributes["레코드_키_string_id"] ?? row.name);
    const unit = text(attributes["행정단위"]);
    const match = key.match(KEY_PATTERN);
    if (!match) { drop(unit === "Division" ? "division-unit-without-division-key" : "not-a-division-row"); continue; }
    if (unit && unit !== "Division") { drop("not-a-division-row"); continue; }
    if (/monthly/iu.test(row.indicatorId) || MONTH_FIELDS.some((field) => attributes[field] !== null && attributes[field] !== undefined) || text(attributes["기간_평년"])) {
      drop("monthly-or-climatology-row");
      continue;
    }
    if (spec.requireNature && !new RegExp(spec.requireNature.pattern, "u").test(text(attributes[spec.requireNature.field]))) { drop("not-a-source-statistic"); continue; }
    const division = divisionByKey.get(`${ISO3}.${match[1]}_1`);
    if (!division) throw new Error(`UNKNOWN_DIVISION_KEY: ${elementId} ${key}`);
    const nameField = NAME_FIELDS.find((field) => text(attributes[field]));
    if (nameField) {
      const named = divisionOfName(attributes[nameField]);
      if (!named || named.key !== division.key) throw new Error(`DIVISION_NAME_MISMATCH: ${elementId} ${key} names "${attributes[nameField]}" but the key is ${division.nameEn}`);
      nameChecked += 1;
    }
    sourceRows += 1;
    const rowPeriodField = PERIOD_FIELDS.find((field) => text(attributes[field]));
    const rowPeriod = rowPeriodField ? text(attributes[rowPeriodField]) : match[2] || key.match(/_((?:19|20)\d{2})$/u)?.[1] || null;
    const indicatorYear = indicators.get(row.indicatorId)?.referenceYear;
    const split = spec.splitBy ? text(attributes[spec.splitBy]) : "";
    for (const [attr, value] of Object.entries(attributes)) {
      if (!isNumber(value) || STRUCTURAL_ATTR.test(attr) || spec.exclude?.includes(attr)) continue;
      if (spec.measure && spec.splitBy && attr !== spec.measure) continue;
      const attrYears = attr.match(/(?:^|_)((?:19|20)\d{2})(?=_|$)/gu)?.map((token) => token.replace(/\D/gu, "")) || [];
      let period = spec.periodByColumn?.[attr] || (attrYears.length === 1 ? attrYears[0] : attrYears.length === 2 ? `${attrYears[0]}–${attrYears[1]}` : rowPeriod || (indicatorYear ? String(indicatorYear) : null));
      if (!period) { drop("no-period"); continue; }
      let scenario = text(attributes["시나리오"]);
      const periodScenario = String(period).match(/^(.*?)\s+(SSP\d-\d\.\d)$/iu);
      if (periodScenario) { period = periodScenario[1].trim(); scenario = scenario || periodScenario[2]; }
      const entry = seriesOf({ source: "entity", indicatorId: row.indicatorId, attr, scenario, split });
      if (spec.unitField) entry.unitValues.add(text(attributes[spec.unitField]));
      addValue(entry, String(period), division, value, row.recordId);
    }
  }
  // (b) observation rows whose indicator id ends with a division token.
  for (const row of pack.observations.records) {
    const tokens = String(row.indicatorId).slice(elementId.length + 1).split("_");
    const division = tokens.length > 1 ? divisionOfName(tokens[tokens.length - 1]) : null;
    if (!division) continue;
    if (!isNumber(row.value)) { drop("observation-without-value"); continue; }
    const period = text(row.year ?? row.period);
    if (!period) { drop("no-period"); continue; }
    sourceRows += 1;
    const base = tokens.slice(0, -1).join("_");
    const entry = seriesOf({ source: "observation", indicatorId: `${elementId}_${base}`, attr: base, scenario: "", split: "", observationIndicator: row.indicatorId });
    entry.unitValues.add(text(row.unit));
    addValue(entry, period, division, row.value, row.recordId);
  }

  // Valid series: one value per division and period, >= 2 divisions in the latest period.
  const valid = [];
  const rejected = [];
  for (const entry of [...series.values()].sort((a, b) => compareText(a.id, b.id))) {
    const ambiguous = [...entry.cells.values()].filter((cell) => cell.values.size > 1).length;
    if (ambiguous) { rejected.push({ series: entry.id, reason: "several-values-per-division-and-period", cells: ambiguous }); continue; }
    const periods = [...new Set([...entry.cells.values()].map((cell) => cell.period))].sort(comparePeriods);
    const latest = periods[periods.length - 1];
    const latestCells = [...entry.cells.values()].filter((cell) => cell.period === latest);
    if (latestCells.length < 2) { rejected.push({ series: entry.id, reason: "fewer-than-2-divisions-in-latest-period", divisions: latestCells.length }); continue; }
    const latestValues = new Set(latestCells.map((cell) => [...cell.values][0]));
    if (latestValues.size < 2) { rejected.push({ series: entry.id, reason: "same-value-in-every-division", value: [...latestValues][0] }); continue; }
    valid.push({ ...entry, periods, latest });
  }
  if (!valid.length) return { hold: true, reason: "주(Division)별 값이 2개 이상인 계열이 없습니다.", dropped, rejected };

  // Default measure: reviewed override -> card regionMeasure -> first column in source order.
  const card = cards.get(elementId);
  const cardMeasure = text(card?.selection?.dimensions?.regionMeasure);
  const cardScenario = text(card?.selection?.dimensions?.scenario);
  const attrRank = (entry) => (entry.source === "entity" ? (fieldIndex.has(entry.attr) ? fieldIndex.get(entry.attr) : 9000) : 10000 + (indicatorOrder.get(entry.observationIndicator) ?? 0));
  const orderEntries = (a, b) => attrRank(a) - attrRank(b) || (indicatorOrder.get(a.indicatorId) ?? 0) - (indicatorOrder.get(b.indicatorId) ?? 0) || scenarioRank(a.scenario) - scenarioRank(b.scenario) || compareText(a.split, b.split);
  valid.sort(orderEntries);
  let rule;
  let measure;
  if (spec.measure) { measure = spec.measure; rule = "reviewed-override"; }
  // The card reads this layer's measures back (mapTargetV138.build), so a card
  // measure equal to the first column is that column, not a separate choice.
  else if (cardMeasure && cardMeasure !== valid[0].attr && valid.some((entry) => entry.attr === cardMeasure)) { measure = cardMeasure; rule = "card-region-measure"; }
  else { measure = valid[0].attr; rule = "first-numeric-column"; }
  const ofMeasure = valid.filter((entry) => entry.attr === measure);
  if (!ofMeasure.length) throw new Error(`MEASURE_WITHOUT_VALUES: ${elementId} ${measure}`);
  const wantScenario = scenarioKey(spec.scenario || cardScenario || "");
  const defaultSplit = spec.variables?.[0] || spec.defaultSplit || "";
  const defaultEntry =
    ofMeasure.find((entry) => (!defaultSplit || entry.split === defaultSplit) && wantScenario && scenarioKey(entry.scenario) === wantScenario) ||
    ofMeasure.find((entry) => (!defaultSplit || entry.split === defaultSplit) && !entry.scenario) ||
    ofMeasure.find((entry) => !defaultSplit || entry.split === defaultSplit) ||
    ofMeasure[0];

  // Up to 8 variables: the default, the other columns in its scenario, the default column in other scenarios, the rest.
  let selected;
  if (spec.variables) {
    selected = spec.variables.map((split) => {
      const entry = valid.find((row) => row.attr === measure && row.split === split);
      if (!entry) throw new Error(`OVERRIDE_VARIABLE_WITHOUT_VALUES: ${elementId} ${split}`);
      return entry;
    });
  } else {
    const sameScenario = valid.filter((entry) => entry !== defaultEntry && scenarioKey(entry.scenario) === scenarioKey(defaultEntry.scenario) && entry.attr !== measure);
    const otherScenarios = ofMeasure.filter((entry) => entry !== defaultEntry);
    const rest = valid.filter((entry) => entry !== defaultEntry && !sameScenario.includes(entry) && !otherScenarios.includes(entry));
    selected = [defaultEntry, ...sameScenario, ...otherScenarios, ...rest].slice(0, 8);
  }
  const notPublished = valid.filter((entry) => !selected.includes(entry)).map((entry) => entry.id);

  // Labels and units.
  const attrIndicators = new Map();
  for (const entry of selected) attrIndicators.set(entry.attr, new Set([...(attrIndicators.get(entry.attr) || []), entry.indicatorId]));
  const variables = selected.map((entry) => {
    let base;
    let unit;
    if (entry.source === "observation") {
      const indicator = indicators.get(entry.observationIndicator);
      base = String(indicator?.labelKo || entry.attr).split(" — ").filter((part) => !/ADM1|단위$/u.test(part) && !divisionOfName(part)).join(" — ");
      unit = [...entry.unitValues].filter(Boolean)[0] || text(indicator?.unit);
    } else {
      const parsed = splitFieldLabel(fieldLabel(entry.attr));
      base = spec.labels?.[entry.attr] || (spec.labelFromSplit && entry.split ? entry.split : parsed.label);
      unit = spec.units?.[entry.attr] || parsed.unit || [...entry.unitValues].filter(Boolean)[0] || "";
      if ((attrIndicators.get(entry.attr)?.size || 0) > 1) base = `${base} · ${cleanIndicatorLabel(indicators.get(entry.indicatorId)?.labelKo)}`;
      if (entry.split && !spec.labelFromSplit) base = `${base} · ${entry.split}`;
    }
    const label = entry.scenario ? `${base} · ${scenarioLabel(entry.scenario)}` : base;
    const measureKey = `m-${sha([entry.source, entry.indicatorId, entry.attr, entry.split].join("|"))}`;
    const key = entry.scenario ? `${measureKey}--${scenarioKey(entry.scenario)}` : measureKey;
    const maxFeatureCount = Math.max(...entry.periods.map((period) => [...entry.cells.values()].filter((cell) => cell.period === period).length));
    return { entry, key, measureKey, label, unit, maxFeatureCount };
  });
  const defaultVariable = variables[0];
  const defaultPeriod = defaultVariable.entry.latest;

  const tableSeries = [];
  const seriesCoverage = [];
  let publishedValueCount = 0;
  let providedZeroCount = 0;
  for (const variable of variables) {
    for (const period of variable.entry.periods) {
      const values = DIVISIONS.map((division) => {
        const cell = variable.entry.cells.get(`${period}|${division.key}`);
        return cell ? [...cell.values][0] : null;
      });
      const matched = values.filter((value) => value !== null).length;
      publishedValueCount += matched;
      providedZeroCount += values.filter((value) => value === 0).length;
      tableSeries.push({
        variable: variable.key,
        variableLabel: variable.label,
        unit: variable.unit || null,
        period,
        sourceIndicatorId: variable.entry.source === "observation" ? null : variable.entry.indicatorId,
        values,
      });
      seriesCoverage.push({ variable: variable.key, period, expectedCount: ADM1_COUNT, matchedCount: matched, missingCount: ADM1_COUNT - matched, failureCount: 0 });
    }
  }
  const allPeriods = [...new Set(variables.flatMap((variable) => variable.entry.periods))].sort(comparePeriods);
  const selectors = {
    defaultPeriod,
    defaultVariable: defaultVariable.key,
    periods: allPeriods,
    variables: variables.map((variable) => ({
      key: variable.key,
      label: variable.label,
      measureId: variable.measureKey,
      measureKey: variable.measureKey,
      ...(variable.entry.scenario ? { scenario: scenarioKey(variable.entry.scenario) } : {}),
      unit: variable.unit,
      periods: variable.entry.periods,
      maxFeatureCount: variable.maxFeatureCount,
    })),
  };
  const defaultValues = DIVISIONS.map((division) => (defaultVariable.entry.cells.has(`${defaultPeriod}|${division.key}`) ? division : null));
  const missingRegions = DIVISIONS.filter((_, index) => !defaultValues[index]).map((division) => division.nameEn);
  const featureCount = Math.max(...variables.map((variable) => variable.maxFeatureCount));
  const usedIndicators = [...new Set(variables.map((variable) => variable.entry.observationIndicator ? null : variable.entry.indicatorId).filter(Boolean))];
  const obsIndicators = [...new Set(selected.flatMap((entry) => (entry.source === "observation" ? pack.observations.records.filter((row) => String(row.indicatorId).startsWith(`${entry.indicatorId}_`)).map((row) => row.indicatorId) : [])))];
  const source = sourceBlock(elementId, [...usedIndicators, ...obsIndicators]);
  const coverageKind = seriesCoverage.every((row) => row.matchedCount === ADM1_COUNT) ? "full" : "partial";
  const sourceValueCount = selected.reduce((sum, entry) => sum + [...entry.cells.values()].reduce((s, cell) => s + cell.recordIds.length, 0), 0);
  const duplicateValueCount = sourceValueCount - publishedValueCount;
  const dataUrl = `${DATA_ROOT_URL}/spatial/layers/${elementId.toLowerCase()}.json`;
  const asset = {
    schemaVersion: "v124",
    assetSchemaVersion: "v124-spatial-layer-1",
    countryIso3: ISO3,
    elementId,
    generatedAt: GENERATED_AT,
    geometryUrl: ADM1_URL,
    joinKey: "divisionKey",
    boundarySystem: `${SLUG}-adm1-${ADM1_COUNT}`,
    coverageKind,
    selectors,
    values: [],
    valueTable: {
      adm1Codes: DIVISIONS.map((division) => division.key),
      adm1Names: DIVISIONS.map((division) => division.nameEn),
      sourceSpatialUnit: "admin1",
      series: tableSeries,
    },
    seriesCoverage,
    source,
    validation: {
      duplicateValueCount,
      expectedAdm1Count: ADM1_COUNT,
      fakeGeometryCount: 0,
      joinFailureCount: 0,
      matchedAdm1Count: featureCount,
      maxSeriesFeatureCount: featureCount,
      missingAdm1Count: ADM1_COUNT - featureCount,
      providedZeroCount,
      publishedValueCount,
      sourceValueCount,
      suppressedValueCount: 0,
      unmatchedSourceNameCount: 0,
      zeroImputationCount: 0,
    },
  };
  const publicName = publicNameOf(target);
  const unitText = defaultVariable.unit ? `단위 ${defaultVariable.unit} · ` : "";
  const notice = `${ADM1_COUNT}개 ${REGION} 경계를 사용합니다.`;
  const item = catalogById.get(elementId);
  const latestYear = yearOf(defaultPeriod);
  const measures = [...new Map(variables.filter((variable) => variable.entry.source === "entity" && !variable.entry.split).map((variable) => [variable.entry.attr, { sourceKey: variable.entry.attr, label: splitFieldLabel(fieldLabel(variable.entry.attr)).label, unit: variable.unit }])).values()];
  const layer = {
    accuracyNotice: `누락값은 투명 처리하며 0으로 대체하지 않습니다. 원자료가 ${REGION} 단위로 제공한 값만 표시합니다.`,
    active: true,
    aggregationLevel: "admin1",
    assetRef: { elementId, provider: PROVIDER, section: "spatial" },
    category: target.category,
    cluster: false,
    coordinateMeaning: "source-region-value",
    dataUrl,
    defaultOverlay: false,
    defaultPrimary: false,
    detailElementId: elementId,
    detailUrl: detailUrlOf(elementId),
    displayedCoordinateCount: 0,
    downloadStatus: downloadStatusOf(item),
    downloadableRecordCount: Number(item?.downloadableRecordCount || 0),
    elementId,
    enabled: true,
    fakeGeometryCount: 0,
    featureCount,
    filters: [],
    geometryTypes: [...new Set(adm1.features.map((feature) => feature.geometry.type))].sort().reverse(),
    geometryUrl: ADM1_URL,
    join: { failures: [], matchedCount: ADM1_COUNT - missingRegions.length, missingCount: missingRegions.length, requiredCount: ADM1_COUNT },
    label: publicName,
    latestYear,
    layerId: `${PROVIDER}-${elementId.toLowerCase()}`,
    legend: { note: `${unitText}값 없는 ${REGION} ${missingRegions.length}개`, title: `${REGION}별 ${withPeriod(defaultVariable.label, defaultPeriod)}` },
    licenses: source.licenses,
    ...(source.attribution.length ? { attribution: source.attribution.join(" · ") } : {}),
    mapBenefit: `${REGION}별 ${publicName} 차이를 비교할 수 있습니다.`,
    mapMode: "choropleth",
    missingRegions,
    publicShortTitle: publicName,
    publicSpatialNotice: notice,
    rawLabel: catalogLabel(elementId),
    regionalProject: false,
    renderer: "admin1-choropleth",
    scopeCountries: [ISO3],
    selectors,
    source: source.organizations.join(" · "),
    sourceCoordinateCount: 0,
    sourceOrganizations: source.organizations,
    sourceUrls: source.urls,
    sourceYear: latestYear,
    spatialCoverage: `${ADM1_COUNT}개 ${REGION} 중 선택 계열 최대 ${featureCount}개`,
    spatialLimitation: `${notice} 원자료가 ${REGION}별로 밝힌 값만 쓰며 구(District) 값을 합치거나 전국 값을 나누지 않습니다.`,
    spatialScopeType: "admin1",
    spatialStatus: "ready",
    tooltipFields: ["adm1Name", "value", "unit", "period"],
    totalEntityCount: pack.entities.records.length + pack.observations.records.length,
    unit: defaultVariable.unit,
    zeroImputationCount: 0,
    mapTargetV138: {
      sourceSpatialUnit: `${REGION} ${ADM1_COUNT}개`,
      displaySpatialUnit: `${REGION} 경계`,
      period: /^\d{4}$/u.test(defaultPeriod) ? `${defaultPeriod}년 기준` : defaultPeriod,
      representativeItem: withPeriod(defaultVariable.label, defaultPeriod),
      evidence: `${REGION} ${featureCount}개 값`,
      build: { kind: "admin1-choropleth", measures },
    },
  };
  return {
    hold: false,
    layer,
    asset,
    dataUrl,
    report: {
      kind: "choropleth",
      measure: { column: measure, rule, defaultVariable: defaultVariable.label, defaultPeriod, scenario: defaultVariable.entry.scenario || null, split: defaultVariable.entry.split || null, sourceIndicatorId: defaultVariable.entry.observationIndicator ? defaultVariable.entry.indicatorId.replace(/_[^_]*$/u, "") : defaultVariable.entry.indicatorId },
      divisionsWithValues: DIVISIONS.filter((division) => defaultVariable.entry.cells.has(`${defaultPeriod}|${division.key}`)).map((division) => division.nameEn),
      divisionsInAnySeries: DIVISIONS.filter((division) => valid.some((entry) => [...entry.cells.values()].some((cell) => cell.division === division.key))).length,
      featureCount,
      publishedVariables: variables.map((variable) => ({ label: variable.label, unit: variable.unit, periods: variable.entry.periods.length, column: variable.entry.attr, indicatorId: variable.entry.indicatorId })),
      validSeriesNotPublished: notPublished.length,
      rejectedSeries: rejected,
      sourceRows,
      divisionNamesCrossChecked: nameChecked,
      publishedValueCount,
      droppedRowsByReason: dropped,
    },
  };
}

// ------------------------------------------------------------------ region counts
// V164-4 (user decision 2026-10-04): project and bid registers whose rows state
// the division they are in - by name ("Dhaka Division"), by a district or city
// the dictionary places in one division ("Cox's Bazar"), or by the statistics
// office's area code ("BD3093", its first two digits name the division) - are
// shown as the number of named projects per division, as Viet Nam's D-group
// layers are. Coordinates that are only an administrative representative point
// are never drawn. A row counts once in every division it states; rows of the
// same project (the same name) count once; amounts are never added up.
const DIVISION_CODES = new Map(Object.entries(CONFIG.divisionCodes?.codes || {}));
for (const local of DIVISION_CODES.values()) {
  if (!divisionByNameEn.has(local)) throw new Error(`DIVISION_CODE_UNKNOWN_DIVISION: ${local}`);
}
const projectKey = (value) => text(value).toLowerCase().replace(/[^\p{L}\p{N}]+/gu, "");

function divisionsOfRow(spec, attributes) {
  const found = new Map();
  const unmatched = [];
  for (const field of spec.nameFields || []) {
    const raw = text(attributes[field]);
    if (!raw) continue;
    // A stated place may carry a generic word ("Sylhet Division", "Bhola
    // district", "Rajshahi City Corporation", "Dhaka-1207"); only that word is
    // removed (spec.cleanPatterns), never a guess at a misspelt name.
    const cleaned = raw.replace(/\s*\((?:행정구역|Division)\)/gu, "");
    const parts = cleaned
      .split(spec.splitParts ? /\s*(?:·|;|\/|,|\(|\))\s*/u : /\s*(?:·|;|\/)\s*/u)
      .map((value) => (spec.cleanPatterns || []).reduce((acc, pattern) => acc.replace(new RegExp(pattern, "iu"), ""), value.replace(/[-\s]*\d{3,}$/u, "").replace(/\s+Division$/iu, "")).trim())
      .filter(Boolean);
    for (const part of parts) {
      const local = dictionaryParentDivision.get(normalizeToken(part));
      if (local) found.set(local, field);
      else unmatched.push(part);
    }
    if (found.size) return { divisions: [...found.keys()], via: field, unmatched: [] };
  }
  if (spec.codeField) {
    const code = text(attributes[spec.codeField]);
    const local = DIVISION_CODES.get(code.slice(0, 4));
    if (local) {
      // Cross-check: a stated name the dictionary places must agree with the code.
      const named = (spec.codeNameFields || [])
        .flatMap((field) => text(attributes[field]).split(/\s*,\s*/u))
        .map((part) => dictionaryParentDivision.get(normalizeToken(part)))
        .filter(Boolean);
      if (named.length && !named.includes(local)) throw new Error(`DIVISION_CODE_NAME_MISMATCH: ${code} -> ${local} but names place it in ${named.join(",")}`);
      return { divisions: [local], via: spec.codeField, unmatched: [] };
    }
    if (code) unmatched.push(code);
  }
  return { divisions: [], via: null, unmatched };
}

function buildRegionCounts(target, spec) {
  const elementId = target.elementId;
  const pack = packs.get(elementId);
  const indicators = new Map(pack.meta.indicators.map((indicator) => [indicator.indicatorId, indicator]));
  const rowFilter = spec.rowFilter ? new RegExp(spec.rowFilter.pattern, "u") : null;
  const rows = pack.entities.records
    .filter((row) => !rowFilter || rowFilter.test(text(row.normalizedAttributes?.[spec.rowFilter.field])))
    .sort((a, b) => compareText(a.recordId, b.recordId));
  const byDivision = new Map();
  const unmatched = new Map();
  const usedIndicators = new Set();
  const years = [];
  let counted = 0;
  let notCounted = 0;
  for (const row of rows) {
    const attributes = row.normalizedAttributes || {};
    const { divisions, unmatched: names } = divisionsOfRow(spec, attributes);
    for (const name of names) unmatched.set(name, (unmatched.get(name) || 0) + 1);
    if (!divisions.length) { notCounted += 1; continue; }
    counted += 1;
    usedIndicators.add(row.indicatorId);
    const year = indicators.get(row.indicatorId)?.referenceYear;
    if (year !== null && year !== undefined) years.push(String(year));
    const label = text(row.name);
    if (!label) throw new Error(`REGION_COUNT_ROW_WITHOUT_NAME: ${elementId} ${row.recordId}`);
    const valueText = spec.valueFact && isNumber(Number(attributes[spec.valueFact.field])) && text(attributes[spec.valueFact.field])
      ? `${spec.valueFact.label} ${formatCount(Number(attributes[spec.valueFact.field]))} ${spec.valueFact.unit}`
      : "";
    const regionText = spec.nameFields.map((field) => text(attributes[field])).find(Boolean) || text(attributes[spec.codeNameFields?.[0]]) || "";
    for (const local of divisions) {
      if (!byDivision.has(local)) byDivision.set(local, new Map());
      const projects = byDivision.get(local);
      const key = projectKey(label);
      if (!projects.has(key)) projects.set(key, { recordId: row.recordId, label, date: "", status: "", value: valueText, url: "", region: regionText.replace(/\s*\(행정구역\)$/u, ""), indicatorId: row.indicatorId });
    }
  }
  if (byDivision.size < 1) return { hold: true, reason: `${REGION}가 확인된 기록이 없습니다.`, dropped: { "no-division": notCounted } };
  const period = years.sort().slice(-1)[0] || yearOf(catalogById.get(elementId)?.latestYear) || "";
  const variableKey = `${elementId.toLowerCase()}-located-count`;
  const values = DIVISIONS.map((division) => (byDivision.has(division.nameEn) ? byDivision.get(division.nameEn).size : null));
  const featureCount = values.filter((value) => value !== null).length;
  const missingRegions = DIVISIONS.filter((_, index) => values[index] === null).map((division) => division.nameEn);
  const memberRecords = Object.fromEntries(
    DIVISIONS.filter((division) => byDivision.has(division.nameEn)).map((division) => [
      division.key,
      [...byDivision.get(division.nameEn).values()].sort((a, b) => compareText(a.label, b.label)),
    ])
  );
  const source = sourceBlock(elementId, [...usedIndicators].sort(compareText));
  const selectors = {
    defaultPeriod: period,
    defaultVariable: variableKey,
    periods: [period],
    variables: [{ key: variableKey, label: spec.label, measureId: variableKey, measureKey: variableKey, unit: "건", periods: [period], maxFeatureCount: featureCount }],
  };
  const dataUrl = `${DATA_ROOT_URL}/spatial/layers/${elementId.toLowerCase()}.json`;
  const sourceValueCount = [...byDivision.values()].reduce((sum, projects) => sum + projects.size, 0);
  const asset = {
    schemaVersion: "v124",
    assetSchemaVersion: "v124-spatial-layer-1",
    countryIso3: ISO3,
    elementId,
    generatedAt: GENERATED_AT,
    geometryUrl: ADM1_URL,
    joinKey: "divisionKey",
    boundarySystem: `${SLUG}-adm1-${ADM1_COUNT}`,
    coverageKind: featureCount === ADM1_COUNT ? "full" : "partial",
    selectors,
    values: [],
    valueTable: {
      adm1Codes: DIVISIONS.map((division) => division.key),
      adm1Names: DIVISIONS.map((division) => division.nameEn),
      // The counts are per division (the country's own level 1), not a
      // source region drawn on finer boundaries.
      sourceSpatialUnit: "admin1",
      series: [{ variable: variableKey, variableLabel: spec.label, unit: "건", period, sourceIndicatorId: null, values }],
    },
    memberRecords,
    seriesCoverage: [{ variable: variableKey, period, expectedCount: ADM1_COUNT, matchedCount: featureCount, missingCount: ADM1_COUNT - featureCount, failureCount: 0 }],
    source,
    validation: {
      duplicateValueCount: 0,
      expectedAdm1Count: ADM1_COUNT,
      fakeGeometryCount: 0,
      joinFailureCount: 0,
      matchedAdm1Count: featureCount,
      maxSeriesFeatureCount: featureCount,
      missingAdm1Count: ADM1_COUNT - featureCount,
      providedZeroCount: 0,
      publishedValueCount: featureCount,
      sourceValueCount,
      suppressedValueCount: 0,
      unmatchedSourceNameCount: unmatched.size,
      zeroImputationCount: 0,
      mappingMethod: "stated-division-count",
    },
  };
  const publicName = publicNameOf(target);
  const item = catalogById.get(elementId);
  const limitation = `건수는 ${REGION}가 확인된 ${spec.noun} 수이며 금액·규모의 합이 아닙니다. 여러 ${REGION}에 걸친 ${spec.noun}은 각 ${REGION}에 1건으로 세고, 같은 ${spec.noun}의 여러 기록은 1건으로 셉니다. ${REGION}가 확인되지 않은 기록은 지도에 올리지 않고 목록·다운로드에만 남습니다.`;
  const layer = {
    accuracyNotice: `${limitation} 행정구역 대표점 좌표는 정확한 사업 위치가 아니어서 점으로 그리지 않습니다.`,
    active: true,
    aggregationLevel: "admin1",
    assetRef: { elementId, provider: PROVIDER, section: "spatial" },
    category: target.category,
    cluster: false,
    coordinateMeaning: "source-region-value",
    dataUrl,
    defaultOverlay: false,
    defaultPrimary: false,
    detailElementId: elementId,
    detailUrl: detailUrlOf(elementId),
    displayedCoordinateCount: 0,
    downloadStatus: downloadStatusOf(item),
    downloadableRecordCount: Number(item?.downloadableRecordCount || 0),
    elementId,
    enabled: true,
    fakeGeometryCount: 0,
    featureCount,
    filters: [],
    geometryTypes: [...new Set(adm1.features.map((feature) => feature.geometry.type))].sort().reverse(),
    geometryUrl: ADM1_URL,
    join: { failures: [], matchedCount: featureCount, missingCount: missingRegions.length, requiredCount: ADM1_COUNT },
    label: publicName,
    latestYear: period,
    layerId: `${PROVIDER}-${elementId.toLowerCase()}`,
    legend: { note: `단위 건 · 기록 없는 ${REGION} ${missingRegions.length}개`, title: spec.label },
    licenses: source.licenses,
    ...(source.attribution.length ? { attribution: source.attribution.join(" · ") } : {}),
    mapBenefit: `${REGION} 클릭 → ${spec.noun} 목록`,
    mapMode: "region-choropleth",
    missingRegions,
    publicShortTitle: publicName,
    publicSpatialNotice: `${ADM1_COUNT}개 ${REGION} 경계에 ${REGION}별 ${spec.noun} 수를 표시합니다.`,
    rawLabel: catalogLabel(elementId),
    regionalProject: false,
    renderer: "partial-choropleth",
    scopeCountries: [ISO3],
    selectors,
    source: source.organizations.join(" · "),
    sourceCoordinateCount: pack.entities.records.filter(hasCoordinate).length,
    sourceOrganizations: source.organizations,
    sourceUrls: source.urls,
    sourceYear: period,
    spatialCoverage: `${ADM1_COUNT}개 ${REGION} 중 ${featureCount}개`,
    spatialLimitation: limitation,
    spatialScopeType: "region",
    spatialStatus: "ready",
    tooltipFields: ["adm1Name", "value", "unit", "period"],
    totalEntityCount: pack.entities.records.length,
    unit: "건",
    zeroImputationCount: 0,
    mapTargetV138: {
      sourceSpatialUnit: `원자료에 ${REGION}가 적힌 기록 ${formatCount(counted)}건`,
      displaySpatialUnit: `${REGION} 경계`,
      period,
      representativeItem: spec.label,
      evidence: `기록 ${formatCount(rows.length)}건 중 ${REGION} 확인 ${formatCount(counted)}건 · ${REGION} ${featureCount}개`,
      build: { kind: "stated-division-count" },
    },
  };
  return {
    hold: false,
    layer,
    asset,
    dataUrl,
    report: {
      kind: "region-count",
      featureCount,
      rows: rows.length,
      counted,
      notCounted,
      projectsPerDivision: Object.fromEntries(DIVISIONS.filter((division) => byDivision.has(division.nameEn)).map((division) => [division.nameEn, byDivision.get(division.nameEn).size])),
      unmatchedNames: Object.fromEntries([...unmatched.entries()].sort((a, b) => b[1] - a[1] || compareText(a[0], b[0]))),
    },
  };
}

// ------------------------------------------------------------------ points
const NATURE_FIELDS = ["좌표_성격", "coord_nature", "좌표_정밀도_출처", "좌표_소재_구분", "좌표_소재_구분_coord_location_type"];
const DROP_NATURE = [
  [/행정구역 대표점/u, "admin-representative-point"],
  [/\(시\) 중심점/u, "city-centroid"],
  [/도시 기준점/u, "city-centroid"],
  [/GADM[^\n]*(?:중심|대표)/u, "gadm-centroid"],
  [/해외 본부/u, "overseas-headquarters"],
];
function natureDropReason(attributes) {
  for (const field of NATURE_FIELDS) {
    const value = text(attributes[field]);
    if (!value) continue;
    const hit = DROP_NATURE.find(([pattern]) => pattern.test(value));
    if (hit) return hit[1];
  }
  return null;
}
const fillTemplate = (template, attributes) => template.replace(/\{([^}]+)\}/gu, (_, field) => text(attributes[field]));
function nameOf(spec, row) {
  const attributes = row.normalizedAttributes || {};
  if (spec.nameFromNote) {
    const match = String(row.note || "").match(new RegExp(`\\[${spec.nameFromNote}: ([^\\]]+)\\]`, "u"));
    if (match) return match[1].trim();
  }
  if (spec.nameTemplate) return fillTemplate(spec.nameTemplate, attributes).trim();
  for (const field of spec.nameField || []) if (text(attributes[field])) return text(attributes[field]);
  return text(row.name);
}
function kindOf(spec, row) {
  const kind = spec.kind;
  if (!kind) return null;
  const attributes = row.normalizedAttributes || {};
  if (kind.byIndicator) {
    const hit = kind.byIndicator[row.indicatorId];
    return hit ? { key: hit[0], label: hit[1] } : null;
  }
  let value = text(attributes[kind.field]);
  if (!value) return null;
  if (kind.prefixes) {
    const hit = kind.prefixes.find(([prefix]) => value.startsWith(prefix));
    return hit ? { key: hit[1], label: hit[2] } : { key: `k-${sha(value, 6)}`, label: value };
  }
  if (kind.lowercase) value = value.toLowerCase();
  if (kind.values) return { key: value, label: kind.values[value] || value };
  return { key: `k-${sha(value, 6)}`, label: value };
}
function factValue(fact, attributes) {
  const raw = attributes[fact.field];
  if (raw === null || raw === undefined || text(raw) === "") return null;
  if (isNumber(raw)) return raw;
  let value = text(raw);
  if (fact.firstSegment) value = value.split(/\s+—\s+/u)[0].trim();
  return value;
}

/**
 * Events located only by an administrative representative point are not drawn;
 * each is counted once in every division its GADM-matched names lie in (a
 * district counts for its division). Names the dictionary does not place are
 * reported, never guessed.
 */
function countEventsByDivision(rows, from) {
  const pattern = new RegExp(from.nature, "u");
  const counts = new Map();
  const unmatched = new Map();
  let candidates = 0;
  let counted = 0;
  for (const row of rows) {
    const attributes = row.normalizedAttributes || {};
    if (!NATURE_FIELDS.some((field) => pattern.test(text(attributes[field])))) continue;
    candidates += 1;
    const divisions = new Set();
    for (const name of text(attributes[from.field]).split(from.split || " · ").map((value) => value.trim()).filter(Boolean)) {
      const local = dictionaryParentDivision.get(normalizeToken(name));
      if (local) divisions.add(local);
      else unmatched.set(name, (unmatched.get(name) || 0) + 1);
    }
    if (!divisions.size) continue;
    counted += 1;
    for (const local of divisions) counts.set(local, (counts.get(local) || 0) + 1);
  }
  return {
    label: from.label,
    unit: "건",
    candidates,
    counted,
    notCounted: candidates - counted,
    rows: DIVISIONS.filter((division) => counts.get(division.nameEn)).map((division) => ({ key: division.key, name: division.nameKo || division.nameEn, count: counts.get(division.nameEn) })),
    unmatchedNames: Object.fromEntries([...unmatched.entries()].sort((a, b) => b[1] - a[1] || compareText(a[0], b[0]))),
  };
}

function buildPoints(target, spec, reference) {
  const elementId = target.elementId;
  const pack = packs.get(elementId);
  const indicators = new Map(pack.meta.indicators.map((indicator) => [indicator.indicatorId, indicator]));
  const dropped = {};
  const drop = (reason) => { dropped[reason] = (dropped[reason] || 0) + 1; };
  const rows = pack.entities.records;
  const withoutCoordinate = rows.filter((row) => !hasCoordinate(row)).length;
  if (withoutCoordinate) dropped["no-coordinate"] = withoutCoordinate;
  const groups = new Map();
  for (const row of rows.filter(hasCoordinate).sort((a, b) => compareText(a.recordId, b.recordId))) {
    if (!insideOutline(row.longitude, row.latitude)) { drop("outside-country-outline"); continue; }
    const natureReason = natureDropReason(row.normalizedAttributes || {});
    if (natureReason) { drop(natureReason); continue; }
    const name = nameOf(spec, row);
    if (!name) { drop("no-name"); continue; }
    const groupKey = `${row.latitude}|${row.longitude}|${name}`;
    if (!groups.has(groupKey)) groups.set(groupKey, { name, lat: row.latitude, lon: row.longitude, rows: [] });
    groups.get(groupKey).rows.push(row);
  }
  if (!groups.size) return { hold: true, reason: "지도에 표시할 수 있는 실제 위치 좌표가 없습니다.", dropped };
  const kindCounts = new Map();
  const factFilled = new Map();
  const features = [...groups.values()]
    .map((group) => {
      const first = group.rows[0];
      const attributes = first.normalizedAttributes || {};
      const kinds = new Map(group.rows.map((row) => kindOf(spec, row)).filter(Boolean).map((kind) => [kind.key, kind]));
      const kind = kinds.size === 1 ? [...kinds.values()][0] : kinds.size > 1 ? { key: "mixed", label: [...kinds.values()].map((row) => row.label).join(" · ") } : null;
      const years = group.rows.map((row) => indicators.get(row.indicatorId)?.referenceYear).filter((year) => year !== null && year !== undefined).map(String);
      const properties = {
        elementId,
        featureId: `${elementId.toLowerCase()}-${sha(`${group.lat}|${group.lon}|${group.name}`)}`,
        name: group.name,
        ...(kind ? { kind: kind.key, kindLabel: kind.label } : {}),
        sourceYear: years.sort().slice(-1)[0] || null,
        recordIds: group.rows.map((row) => row.recordId),
        rowCount: group.rows.length,
      };
      for (const fact of spec.facts) {
        // A fact is shown only when every row of the feature states the same value.
        const values = new Set(group.rows.map((row) => JSON.stringify(factValue(fact, row.normalizedAttributes || {}))));
        const value = values.size === 1 ? JSON.parse([...values][0]) : null;
        if (value === null) continue;
        properties[fact.key] = value;
        if (fact.unitField) {
          const unit = text(attributes[fact.unitField]);
          if (unit) properties[`${fact.key}Unit`] = unit;
        }
        factFilled.set(fact.key, (factFilled.get(fact.key) || 0) + 1);
      }
      for (const [key, field] of Object.entries(spec.copy || {})) {
        const value = attributes[field];
        if (value !== null && value !== undefined && text(value) !== "") properties[key] = value;
      }
      if (kind) kindCounts.set(kind.key, { label: kind.label, count: (kindCounts.get(kind.key)?.count || 0) + 1 });
      return { type: "Feature", id: properties.featureId, properties, geometry: { type: "Point", coordinates: [group.lon, group.lat] } };
    })
    .sort((a, b) => compareText(a.properties.name, b.properties.name) || a.geometry.coordinates[0] - b.geometry.coordinates[0] || a.geometry.coordinates[1] - b.geometry.coordinates[1]);
  const featureCount = features.length;
  const keptRowCount = features.reduce((sum, feature) => sum + feature.properties.rowCount, 0);
  const lons = features.map((feature) => feature.geometry.coordinates[0]);
  const lats = features.map((feature) => feature.geometry.coordinates[1]);
  const geometryUrl = `${DATA_ROOT_URL}/spatial/points/${elementId.toLowerCase()}.geojson`;
  // Coordinates geocoded by the delivery carry the geocoder's licence (stated in the precision column).
  const keptRows = features.flatMap((feature) => groups.get(`${feature.geometry.coordinates[1]}|${feature.geometry.coordinates[0]}|${feature.properties.name}`).rows);
  const precisionText = keptRows.map((row) => NATURE_FIELDS.map((field) => text(row.normalizedAttributes?.[field])).join(" ")).join(" ");
  const geocoding = [
    ...(/ODbL/u.test(precisionText) ? [{ org: "OpenStreetMap contributors", license: "ODbL-1.0" }] : []),
    ...(/GeoNames/u.test(precisionText) ? [{ org: "GeoNames", license: "CC-BY-4.0" }] : []),
  ];
  const keptIndicators = [...new Set(keptRows.map((row) => row.indicatorId))].sort(compareText);
  const source = sourceBlock(elementId, keptIndicators, geocoding);
  const years = features.map((feature) => feature.properties.sourceYear).filter(Boolean).sort();
  const sourceYear = years[years.length - 1] || yearOf(catalogById.get(elementId)?.latestYear) || null;
  const geojson = {
    type: "FeatureCollection",
    name: `${SLUG}-${elementId.toLowerCase()}`,
    bbox: [Math.min(...lons), Math.min(...lats), Math.max(...lons), Math.max(...lats)],
    metadata: {
      schemaVersion: "country-points-v162",
      countryIso3: ISO3,
      elementId,
      featureCount,
      sourceRowCount: keptRowCount,
      grouping: "rows with the same coordinate and name are one feature (recordIds, rowCount)",
      outlineBufferDeg: OUTLINE_BUFFER_DEG,
      ...(reference ? { referenceBasis: spec.basis } : {}),
    },
    features,
  };
  const publicName = publicNameOf(target);
  const item = catalogById.get(elementId);
  const kindEntries = [...kindCounts.entries()].sort((a, b) => b[1].count - a[1].count || compareText(a[0], b[0]));
  const categorical = spec.kind && kindEntries.length > 1;
  const factFields = [
    ...(categorical ? [{ key: "kind", label: spec.kind.label, sources: ["kindLabel"], filterable: true, valueMap: Object.fromEntries(kindEntries.map(([key, row]) => [key, row.label])) }] : []),
    { key: "name", label: "이름", sources: ["name"] },
    ...spec.facts.filter((fact) => factFilled.has(fact.key)).map((fact) => ({ key: fact.key, label: fact.label, sources: [fact.key], ...(fact.unit ? { unit: fact.unit } : {}), recordCount: featureCount, filledRecordCount: factFilled.get(fact.key) })),
  ];
  const cardFactFields = spec.facts.filter((fact) => factFilled.has(fact.key)).slice(0, 4).map((fact) => ({ key: fact.key, label: fact.label, unit: fact.unit || null }));
  const regionCounts = spec.regionCountsFrom ? countEventsByDivision(rows, spec.regionCountsFrom) : null;
  const droppedTotal = Object.entries(dropped).filter(([reason]) => reason !== "no-coordinate").reduce((sum, [, count]) => sum + count, 0);
  const droppedText = Object.entries(dropped)
    .filter(([reason]) => reason !== "no-coordinate")
    .map(([reason, count]) => `${DROP_REASON_KO[reason] || reason} ${formatCount(count)}건`)
    .join(" · ");
  const approximate = features.some((feature) => /중심점|도로 단위|격자|대표점/u.test(String(feature.properties.locationPrecision || "")));
  const notice = reference
    ? spec.notice
    : `원천이 제공한 좌표를 표시합니다.${spec.locationNote ? ` ${spec.locationNote}` : ""}${approximate && !spec.locationNote ? " 일부 위치는 구역·도로 단위 지오코딩이라 정확한 건물 위치가 아닙니다." : ""}`;
  const layer = {
    elementId,
    layerId: `${PROVIDER}-${elementId.toLowerCase()}`,
    label: publicName,
    publicShortTitle: publicName,
    rawLabel: catalogLabel(elementId),
    category: target.category,
    detailElementId: elementId,
    detailUrl: detailUrlOf(elementId),
    active: true,
    enabled: true,
    defaultOverlay: false,
    defaultPrimary: false,
    cluster: featureCount > 300,
    regionalProject: false,
    scopeCountries: [ISO3],
    mapMode: "point",
    renderer: "point-and-polygon",
    aggregationLevel: "facility",
    spatialScopeType: "facility-site",
    coordinateMeaning: reference ? "reference-representative-point" : "source-provided-location",
    assetRef: { elementId, provider: PROVIDER, section: "spatial" },
    geometryUrl,
    geometryTypes: ["Point"],
    featureCount,
    ...(kindEntries.length ? { featureCountByKind: Object.fromEntries(kindEntries.map(([key, row]) => [key, row.count])) } : {}),
    unit: "곳",
    selectors: {
      defaultPeriod: sourceYear,
      defaultVariable: "all",
      periods: [sourceYear],
      variables: [
        { key: "all", label: "전체", periods: [sourceYear], unit: "곳" },
        ...(categorical ? kindEntries.map(([key, row]) => ({ key, label: row.label, periods: [sourceYear], unit: "곳" })) : []),
      ],
    },
    filters: categorical ? [{ field: "kind", label: spec.kind.label, values: kindEntries.map(([key]) => key), valueLabels: Object.fromEntries(kindEntries.map(([key, row]) => [key, row.label])) }] : [],
    factFields,
    cardFactFields,
    fieldLabels: Object.fromEntries(factFields.map((field) => [field.key, field.label])),
    tooltipFields: factFields.map((field) => field.key),
    legend: {
      title: publicName,
      note: `${kindEntries.length > 1 ? kindEntries.map(([, row]) => `${row.label} ${formatCount(row.count)}`).join(" · ") : `${formatCount(featureCount)}곳`}${sourceYear ? ` · 자료연도 ${sourceYear}` : ""}`,
    },
    source: source.organizations.join(" · "),
    sourceOrganizations: source.organizations,
    sourceUrls: source.urls,
    sourceYear,
    latestYear: sourceYear,
    licenses: source.licenses,
    ...(source.attribution.length ? { attribution: source.attribution.join(" · ") } : {}),
    accuracyNotice: `${reference ? `${spec.notice} ` : ""}좌표가 있는 레코드만 표시합니다.${droppedTotal ? ` ${droppedText}은 지도에 표시하지 않습니다.` : ""}${regionCounts ? ` ${regionCounts.label}은 분석 패널에 ${REGION}별 건수로 표시하며, 여러 ${REGION}에 걸친 사건은 각 ${REGION}에 1건씩 셉니다.` : ""}`,
    publicSpatialNotice: notice,
    spatialLimitation: notice,
    spatialCoverage: `전국 · ${formatCount(featureCount)}곳`,
    spatialStatus: "ready",
    mapBenefit: reference ? `${publicName}의 대략적인 분포를 참고용으로 볼 수 있습니다.` : `${publicName}의 위치 분포를 볼 수 있습니다.`,
    missingRegions: [],
    join: { requiredCount: featureCount, matchedCount: featureCount, missingCount: 0, failures: [] },
    fakeGeometryCount: 0,
    zeroImputationCount: 0,
    totalEntityCount: rows.length,
    sourceCoordinateCount: rows.filter(hasCoordinate).length,
    displayedCoordinateCount: featureCount,
    downloadStatus: downloadStatusOf(item),
    downloadableRecordCount: Number(item?.downloadableRecordCount || 0),
    ...(reference ? { referenceMap: { label: "참고 지도", basis: spec.basis, notice: spec.notice } } : {}),
    ...(regionCounts
      ? { regionCounts: { label: regionCounts.label, unit: regionCounts.unit, total: regionCounts.counted, rows: regionCounts.rows.map(({ key, name, count }) => ({ key, name, count })) } }
      : {}),
  };
  return {
    hold: false,
    layer,
    geojson,
    geometryUrl,
    report: {
      kind: reference ? "reference" : "point",
      ...(reference ? { basis: spec.basis } : {}),
      ...(spec.locationNote ? { locationNote: spec.locationNote } : {}),
      coordinateRows: rows.filter(hasCoordinate).length,
      keptRows: keptRowCount,
      featureCount,
      featureCountByKind: Object.fromEntries(kindEntries.map(([key, row]) => [row.label, row.count])),
      droppedRowsByReason: dropped,
      ...(regionCounts ? { regionCounts } : {}),
    },
  };
}
const DROP_REASON_KO = {
  "outside-country-outline": "국경 밖 좌표",
  "admin-representative-point": "행정구역 대표점",
  "city-centroid": "도시 중심점",
  "gadm-centroid": "행정구역 경계 중심점",
  "overseas-headquarters": "해외 본부",
  "no-name": "이름 없는 행",
};

// ------------------------------------------------------------------ holds (verified against evidence, decision kept)
function verifyHold(elementId, group) {
  const evidence = EVIDENCE.elements[elementId];
  const pack = packs.get(elementId);
  const coordinateRows = (pack?.entities?.records || []).filter(hasCoordinate);
  const region = evidence?.regionEvidence || {};
  const facts = {
    nationwideOnly: evidence?.nationwideOnly ?? null,
    coordinateRows: coordinateRows.length,
    outsideOutline: outsideById.get(elementId)?.outside || 0,
    divisionKeys: region.divisionKeysFoundCount || 0,
    districtKeys: region.districtKeysFoundCount || 0,
    spatialUnits: evidence?.spatialUnits || [],
  };
  let conflict = null;
  if (group === "nationwide" && facts.nationwideOnly !== true) conflict = "evidence does not mark the element nationwide-only";
  if (group === "no-region" && (facts.coordinateRows || facts.divisionKeys || facts.districtKeys)) conflict = "evidence shows coordinates or region keys";
  if (group === "admin-centroid") {
    const actual = coordinateRows.filter((row) => !natureDropReason(row.normalizedAttributes || {}));
    const actualInside = actual.filter((row) => insideOutline(row.longitude, row.latitude));
    facts.coordinateRowsNotAdminRepresentative = actual.length;
    facts.coordinateRowsNotAdminRepresentativeInside = actualInside.length;
    if (actualInside.length) conflict = `${actualInside.length} coordinate rows inside the outline are not marked as administrative representative points (e.g. ${text(actualInside[0].normalizedAttributes?.["좌표_성격"] || actualInside[0].normalizedAttributes?.["좌표_산출근거"])})`;
  }
  if (group === "district-only" && (facts.divisionKeys || !facts.districtKeys)) conflict = "evidence region keys are not district-only";
  if (group === "not-division-units" && !facts.spatialUnits.some((unit) => /GDL/u.test(unit))) conflict = "evidence spatial units do not name GDL regions";
  if (group === "allocated-estimate") {
    const keys = new Set((pack?.entities?.records || []).flatMap((row) => Object.keys(row.normalizedAttributes || {})));
    facts.allocationColumns = ["배분_기준값_원값", "지역_비율"].filter((key) => keys.has(key));
    if (facts.allocationColumns.length < 2) conflict = "allocation columns not found";
  }
  if (group === "not-office-location") {
    facts.coordinateNature = [...new Set(coordinateRows.map((row) => text(row.normalizedAttributes?.["좌표_정밀도_출처"]).split(/\s+—\s+/u)[0]))].sort();
  }
  return { facts, conflict };
}

// ------------------------------------------------------------------ build
const outputs = new Map();
const writeOut = (relativePath, value) => outputs.set(relativePath, typeof value === "string" ? value : `${JSON.stringify(value, null, 2)}\n`);
const layers = [];
const rows = [];
const conflicts = [];
for (const target of TARGETS) {
  const elementId = target.elementId;
  const decision = decisions.get(elementId);
  const evidence = EVIDENCE.elements[elementId];
  const base = {
    elementId,
    publicName: publicNameOf(target),
    decision,
    divisionKeysInEvidence: evidence?.regionEvidence?.divisionKeysFoundCount || 0,
    coordinateRows: outsideById.get(elementId)?.coordinateRows || 0,
    outsideOutline: outsideById.get(elementId)?.outside || 0,
  };
  if (decision === "hold") {
    const group = CONFIG.holds[elementId];
    const { facts, conflict } = verifyHold(elementId, group);
    if (conflict) conflicts.push({ elementId, decision: `hold:${group}`, finding: conflict, resolution: "decision kept" });
    rows.push({ ...base, holdGroup: group, reason: CONFIG.holdReasons[group], facts, conflict });
    continue;
  }
  const built =
    decision === "choropleth"
      ? buildChoropleth(target, CONFIG.choropleth[elementId])
      : decision === "region-count"
      ? buildRegionCounts(target, CONFIG.regionCounts[elementId])
      : buildPoints(target, decision === "reference" ? CONFIG.reference[elementId] : CONFIG.points[elementId], decision === "reference");
  if (built.hold) {
    conflicts.push({ elementId, decision, finding: built.reason, resolution: "not registered - no publishable values" });
    rows.push({ ...base, decision: "hold", holdGroup: "build-found-nothing", reason: built.reason, facts: { droppedRowsByReason: built.dropped, rejectedSeries: built.rejected } });
    continue;
  }
  layers.push(built.layer);
  if (built.asset) writeOut(`public${built.dataUrl}`, built.asset);
  if (built.geojson) writeOut(`public${built.geometryUrl}`, `${JSON.stringify(built.geojson)}\n`);
  rows.push({ ...base, layerId: built.layer.layerId, ...built.report });
}

// Public strings must not carry internal codes, file names, raw keys or another country's wording.
const FORBIDDEN = /_entity\b|용역사|사실\/표현|개인정보|\battr_\d+|\b[A-E]-\d{3}\b|레코드_키|작업표준|처리규칙|별첨|베트남|Viet ?Nam|성·시|省|\.xlsx\b|\.shp\b|gis_osm_|[A-Z]{3}_\d{6,}|[A-Z]{3}\.\d+_1\b|\b[a-z]+_[a-z_]+_[a-z]+\b/u;
const PUBLIC_LAYER_FIELDS = ["label", "publicShortTitle", "category", "legend", "mapBenefit", "publicSpatialNotice", "spatialLimitation", "spatialCoverage", "accuracyNotice", "source", "sourceOrganizations", "attribution", "licenses", "referenceMap", "regionCounts", "factFields", "cardFactFields", "filters", "fieldLabels"];
const publicStrings = (value) => (typeof value === "string" ? [value] : Array.isArray(value) ? value.flatMap(publicStrings) : value && typeof value === "object" ? Object.entries(value).filter(([key]) => !["sources", "key", "field", "values"].includes(key)).flatMap(([, item]) => publicStrings(item)) : []);
const leaks = [];
for (const layer of layers) {
  for (const field of PUBLIC_LAYER_FIELDS) for (const value of publicStrings(layer[field])) if (FORBIDDEN.test(value)) leaks.push({ layerId: layer.layerId, field, value: value.slice(0, 160) });
  for (const variable of layer.selectors.variables) if (FORBIDDEN.test(variable.label)) leaks.push({ layerId: layer.layerId, field: "selectors.variables.label", value: variable.label });
}
for (const [path, content] of outputs) {
  if (!path.endsWith(".geojson")) continue;
  for (const feature of JSON.parse(content).features) {
    for (const [key, value] of Object.entries(feature.properties)) {
      if (["featureId", "recordIds", "elementId", "kind"].includes(key) || typeof value !== "string") continue;
      if (FORBIDDEN.test(value)) leaks.push({ path, featureId: feature.properties.featureId, field: key, value: value.slice(0, 160) });
    }
  }
}
if (leaks.length) {
  console.error(JSON.stringify({ error: "PUBLIC_TEXT_LEAK", leaks: leaks.slice(0, 40), total: leaks.length }, null, 2));
  process.exit(1);
}

// ------------------------------------------------------------------ map-index, catalog, manifest
layers.sort((a, b) => compareText(a.elementId, b.elementId));
const activeLayers = layers.filter((layer) => layer.active !== false && layer.enabled !== false);
const mapFeatureCount = activeLayers.reduce((sum, layer) => sum + (layer.featureCount || 0), 0);
const nextIndex = {};
for (const key of Object.keys(mapIndex)) nextIndex[key] = mapIndex[key];
nextIndex.activeMapLayerCount = activeLayers.length;
nextIndex.mapFeatureCount = mapFeatureCount;
nextIndex.layers = layers;
nextIndex.mapTargetContract = {
  schemaVersion: "country-map-targets-v162",
  targetCount: activeLayers.length,
  connectedCount: activeLayers.length,
  notConnected: [],
  judgement: REPORT_MD,
};
writeOut(`public${DATA_ROOT_URL}/map-index.json`, nextIndex);

const MAP_MODES = new Set(["choropleth", "point", "cluster", "line", "region-choropleth", "regional-scope"]);
const layerByElement = new Map(layers.map((layer) => [layer.elementId, layer]));
const catalogChanges = [];
const nextCatalog = JSON.parse(JSON.stringify(catalog));
for (const item of nextCatalog.elements) {
  const layer = layerByElement.get(item.elementId);
  const before = { mapMode: item.mapMode, mapFeatureCount: item.mapFeatureCount };
  if (layer) {
    item.mapMode = layer.renderer === "admin1-choropleth" ? "choropleth" : layer.mapMode === "region-choropleth" ? "region-choropleth" : "point";
    item.mapFeatureCount = layer.featureCount;
  } else if (decisions.get(item.elementId) === "hold" && MAP_MODES.has(item.mapMode)) {
    // A held target keeps no map claim - the finder's "지도 있음" filter reads this.
    item.mapMode = "panel-only";
    item.mapFeatureCount = 0;
  }
  if (before.mapMode !== item.mapMode || before.mapFeatureCount !== item.mapFeatureCount) catalogChanges.push({ elementId: item.elementId, before, after: { mapMode: item.mapMode, mapFeatureCount: item.mapFeatureCount } });
}
writeOut(`public${DATA_ROOT_URL}/catalog.json`, nextCatalog);
const nextManifest = JSON.parse(JSON.stringify(manifest));
nextManifest.mapLayerCount = activeLayers.length;
nextManifest.mapFeatureCount = mapFeatureCount;
nextManifest.assets.spatialLayers = layers.filter((layer) => layer.dataUrl).map((layer) => layer.dataUrl).sort(compareText);
writeOut(`public${DATA_ROOT_URL}/manifest.json`, nextManifest);

// ------------------------------------------------------------------ reports
const judgementOf = (row) => (row.decision === "hold" ? "hold" : row.kind);
const counts = { choropleth: 0, "region-count": 0, point: 0, reference: 0, hold: 0 };
for (const row of rows) counts[judgementOf(row)] += 1;
const report = {
  schema: "country-map-layers-v162",
  countryIso3: ISO3,
  dataRoot: DATA_ROOT_URL,
  inputs: { evidence: EVIDENCE_PATH, decisions: CONFIG_PATH, targets: "src/data/visualization/publicMapTargetsV138.json", adm1: ADM1_URL, outline: outlineAsset.url, outlineBufferDeg: OUTLINE_BUFFER_DEG },
  counts: { targets: rows.length, ...counts, registeredLayers: activeLayers.length, mapFeatureCount },
  evidenceCheck: { comparedElements: targetIds.length, coordinateRowsAndOutsideCountsMatch: true, publishedFewerRowsThanWorkbook: evidenceRowNotes, outsideOutline: Object.fromEntries([...outsideById].filter(([, value]) => value.outside).map(([id, value]) => [id, value.outside])) },
  decisionConflicts: conflicts,
  catalogChanges,
  expectationChanges: [],
  layers: rows.filter((row) => row.layerId),
  holds: rows.filter((row) => row.decision === "hold").map(({ elementId, publicName, holdGroup, reason, facts, conflict }) => ({ elementId, publicName, holdGroup, reason, facts, conflict })),
};
writeOut(REPORT_JSON, report);

const JUDGEMENT_KO = { choropleth: "등록-지역 비교", "region-count": "등록-지역별 건수", point: "등록-위치", reference: "등록-참고 지도", hold: "보류" };
const mdEscape = (value) => String(value ?? "").replace(/\|/gu, "\\|").replace(/\n/gu, " ");
const evidenceText = (row) => {
  const parts = [`주 ${row.kind === "choropleth" ? `${row.featureCount}개(값)` : row.kind === "region-count" ? `${row.featureCount}개(건수)` : `${row.divisionKeysInEvidence}개(표기)`}`, `좌표 행 ${formatCount(row.coordinateRows)}`, `경계 밖 ${formatCount(row.outsideOutline)}`];
  if (row.kind === "point" || row.kind === "reference") parts.push(`표시 ${formatCount(row.featureCount)}곳`);
  return parts.join(" · ");
};
const reasonText = (row) => {
  if (row.kind === "choropleth") return `원자료가 ${REGION}별로 밝힌 값 — 기본 ${row.measure.defaultVariable}(${row.measure.defaultPeriod})${row.publishedVariables.length > 1 ? ` 외 ${row.publishedVariables.length - 1}개 항목` : ""}`;
  if (row.kind === "region-count") {
    const unmatchedNames = Object.keys(row.unmatchedNames || {});
    return `원자료가 밝힌 ${REGION}별 기록 수(같은 이름 1건, 금액 합산 없음) — 기록 ${formatCount(row.rows)}건 중 ${REGION} 확인 ${formatCount(row.counted)}건${row.notCounted ? `, 미확인 ${formatCount(row.notCounted)}건 제외` : ""}${unmatchedNames.length ? ` (위치 미상 표기 ${unmatchedNames.length}종)` : ""} · 사용자 결정 2026-10-04`;
  }
  if (row.kind === "point" || row.kind === "reference") {
    const droppedText = Object.entries(row.droppedRowsByReason).filter(([reason]) => reason !== "no-coordinate").map(([reason, count]) => `${DROP_REASON_KO[reason] || reason} ${formatCount(count)}`).join(" · ");
    const lead = row.kind === "reference" ? `${row.basis}만 표시(실제 형상 아님)` : row.locationNote ? `원천 좌표 — ${row.locationNote}` : "원천 좌표의 실제 위치";
    const counted = row.regionCounts
      ? ` — ${row.regionCounts.label} ${formatCount(row.regionCounts.counted)}건은 ${REGION}별 건수로(${row.regionCounts.rows.length}개 ${REGION}, 주 미확인 ${formatCount(row.regionCounts.notCounted)}건 제외)`
      : "";
    return `${lead}${droppedText ? ` — 제외: ${droppedText}` : ""}${counted}`;
  }
  return `${row.reason}${row.conflict ? " (검증 메모: 판정 유지, 보고서 decisionConflicts 참조)" : ""}`;
};
const judgementCounts = Object.entries(JUDGEMENT_KO).map(([key, label]) => `${label} ${rows.filter((row) => judgementOf(row) === key).length}`).join(" · ");
const md = [
  `# ${registry.nameKo} 지도 표시 판정표 (V162)`,
  "",
  `- 대상: 공개 지도 대상 ${rows.length}개 항목(베트남 지도 대상과 같은 목록) · 판정 ${judgementCounts}`,
  "- 판정 기준(1쪽 요약): ① 지역별 비교 — 원자료가 주(Division)별로 밝힌 값이 2개 주 이상 ② 위치 — 원천이 준 실제 위치 좌표(국경+0.05° 안, 행정구역 대표점·도시 중심점·해외 본부 제외) ③ 지역별 계획·규정 — 전국 공통 값·규정은 제외",
  "- 지역별 건수(사용자 결정 2026-10-04): 사업·입찰 기록이 밝힌 주(Division) — 주 이름, 사전이 한 주에 두는 구·도시 이름, 통계청 지역코드 앞 두 자리 — 로 주별 사업 수를 표시(베트남 D군과 같은 방식). 행정구역 대표점 좌표는 점으로 그리지 않고, 같은 사업의 여러 기록은 1건, 금액은 합산하지 않음",
  "- 금지: 결측 0 대체, 구(District)→주(Division) 합산, 전국 값 배분, 임의 좌표·경계 생성. 보류 항목은 지도 대상에서 빠지고 이 표에만 남습니다.",
  `- 생성: \`node scripts/v158/build-country-map-layers-v158.mjs --country ${SLUG}\` · 근거 수치는 \`${REPORT_JSON}\``,
  "",
  "| 코드 | 대상 데이터 | 판정 | 근거 수치(주 수 · 좌표 행 · 경계 밖) | 사유 |",
  "| --- | --- | --- | --- | --- |",
  ...rows.map((row) => `| ${row.elementId} | ${mdEscape(row.publicName)} | ${JUDGEMENT_KO[judgementOf(row)]} | ${mdEscape(evidenceText(row))} | ${mdEscape(reasonText(row))} |`),
  "",
].join("\n");
writeOut(REPORT_MD, md);

// ------------------------------------------------------------------ write or check
const ownedDirs = [`public${DATA_ROOT_URL}/spatial/layers`, `public${DATA_ROOT_URL}/spatial/points`];
const stale = ownedDirs.flatMap((dir) => (existsSync(resolve(ROOT, dir)) ? readdirSync(resolve(ROOT, dir)).map((file) => `${dir}/${file}`) : [])).filter((path) => !outputs.has(path));
if (CHECK) {
  // A checkout with core.autocrlf turns the text reports into CRLF; compare by content.
  const onDisk = (path) => readFileSync(resolve(ROOT, path), "utf8").split("\r\n").join("\n");
  const differ = [...outputs].filter(([path, content]) => !existsSync(resolve(ROOT, path)) || onDisk(path) !== content).map(([path]) => path);
  const result = { audit: `country-map-layers:${SLUG}:v162`, status: differ.length || stale.length ? "FAIL" : "PASS", files: outputs.size, differ, stale };
  console.log(JSON.stringify(result));
  process.exit(differ.length || stale.length ? 1 : 0);
}
if (stale.length) throw new Error(`STALE_LAYER_FILES: ${stale.join(", ")} - remove them or register the layer`);
for (const [path, content] of outputs) {
  mkdirSync(dirname(resolve(ROOT, path)), { recursive: true });
  writeFileSync(resolve(ROOT, path), content);
}
console.log(JSON.stringify({ audit: `country-map-layers:${SLUG}:v162`, status: "WRITTEN", files: outputs.size, layers: activeLayers.length, mapFeatureCount, counts: report.counts, conflicts: conflicts.length }));
