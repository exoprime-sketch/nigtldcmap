#!/usr/bin/env node
/**
 * V158-B1: verify a country tree written by build_country_v2.py.
 *
 *   node tools/etl/countries/bgd/verify_country_v2.cjs --country bgd
 *        [--public <dir>] [--compare <dir>] [--reference <ISO3>] [--out <report.json>]
 *
 * --public    the public/ directory holding the tree (default: the repository's);
 *             a staging build passes .staging/<dir>/public.
 * --compare   a second public/ directory built from the same input; the
 *             builder-owned files must be byte-identical (determinism).
 *
 * The reference is the live country in public/data/countries.json unless named;
 * nothing here names a country. Region names are checked against the platform's
 * own formatRegionName (src/data/geo/regionNameV161.ts, loaded through sucrase).
 */
require("sucrase/register/ts");

const fs = require("fs");
const path = require("path");
const zlib = require("zlib");
const crypto = require("crypto");
const { spawnSync } = require("child_process");

const REPO = path.resolve(__dirname, "../../../..");
const argv = process.argv.slice(2);
const arg = (name, fallback = null) => {
  const index = argv.indexOf(name);
  return index >= 0 && argv[index + 1] ? argv[index + 1] : fallback;
};
const readJson = (file) => JSON.parse(fs.readFileSync(path.isAbsolute(file) ? file : path.join(REPO, file), "utf8"));
const sha256 = (bytes) => crypto.createHash("sha256").update(bytes).digest("hex");
const decodeEnvelope = (file) => {
  const envelope = readJson(file);
  return JSON.parse(zlib.gunzipSync(Buffer.from(envelope.payloadChunks.join(""), "base64")).toString("utf8"));
};
// The decoded payload of a transport envelope, so text checks see inside the packs.
const envelopeText = (file, text) => {
  if (!file.endsWith(".json") || !text.includes('"payloadChunks"')) return "";
  return JSON.stringify(decodeEnvelope(file));
};
const walk = (dir) =>
  fs.existsSync(dir)
    ? fs.readdirSync(dir, { withFileTypes: true }).flatMap((item) => (item.isDirectory() ? walk(path.join(dir, item.name)) : [path.join(dir, item.name)]))
    : [];
const unionKeys = (objects) => [...new Set(objects.flatMap((item) => Object.keys(item || {})))].sort();
const missingFrom = (keys, allowed) => keys.filter((key) => !allowed.includes(key));
const HANGUL = /[\uac00-\ud7a3]/u;
// A letter of any script other than Latin (diacritics included) and Hangul.
const NON_LATIN_LETTER = /[^\P{L}\p{Script=Latin}\p{Script=Hangul}]/u;
// normalization.nfc_text: the text the builder hands to the region lookup.
const nfcText = (value) => String(value).replace(/\r\n/gu, "\n").replace(/\r/gu, "\n").normalize("NFC").replace(/\u00a0/gu, " ").replace(/\u200b/gu, "").trim();

const code = String(arg("--country", "")).toLowerCase();
if (!code) throw new Error("--country is required");
const config = readJson(`tools/etl/countries/${code}/country.json`);
const registry = readJson("public/data/countries.json");
const countries = registry.countries || registry;
const entry = countries.find((row) => row.iso3 === config.iso3);
const reference = countries.find((row) => row.iso3 === (arg("--reference") || (countries.find((row) => row.status === "live") || {}).iso3));
if (!entry || !reference) throw new Error("country or reference not in the registry");
const publicDir = path.resolve(REPO, arg("--public", "public"));
const root = path.join(publicDir, entry.dataRoot);
const refRoot = path.join(REPO, "public", reference.dataRoot);
// A URL under the country's root lives in --public; anything else (shared assets) in the repository.
const resolveUrl = (url) => path.join(String(url).startsWith(`${entry.dataRoot}/`) ? publicDir : path.join(REPO, "public"), url);
const prefix = config.packPrefix;
const { formatRegionName, regionNameKeyV161 } = require(path.join(REPO, "src/data/geo/regionNameV161.ts"));

const checks = [];
const check = (name, pass, actual, expected) => {
  checks.push({ name, pass: Boolean(pass), actual, expected });
  if (!pass) console.error(`FAIL ${name}: ${JSON.stringify(actual).slice(0, 400)}`);
};

// ---------------------------------------------------------------- load both trees
const loadTree = (dir) => {
  const manifest = readJson(path.join(dir, "manifest.json"));
  const catalog = readJson(path.join(dir, "catalog.json")).elements;
  const bundle = readJson(path.join(dir, "packs/bundle-index-v124.json"));
  const packFiles = walk(path.join(dir, "packs")).filter((file) => /-pack-\d{3}/u.test(path.basename(file)));
  const payloads = {};
  const packContents = [];
  for (const file of packFiles) {
    const content = decodeEnvelope(file);
    packContents.push({ file, envelope: readJson(file), content });
    Object.assign(payloads, content.elements);
  }
  const search = decodeEnvelope(path.join(dir, manifest.assets.searchIndex[0].replace(/^\/data\/[^/]+\/v2\//u, "")));
  const sources = decodeEnvelope(path.join(dir, manifest.assets.sourceRegistry.replace(/^\/data\/[^/]+\/v2\//u, "")));
  return { manifest, catalog, bundle, payloads, packContents, search, sources };
};
const tree = loadTree(root);
const ref = loadTree(refRoot);
const records = (payloads, section) => Object.values(payloads).flatMap((payload) => payload[section].records);

// ---------------------------------------------------------------- A. schema parity
// V158: the downloads ship as one ZIP per element holding <id>.json and
// <id>.csv (tools/etl/download_zip_v158.py); both trees are read through it.
function zipMembers(file) {
  const buffer = fs.readFileSync(file);
  let end = -1;
  for (let at = buffer.length - 22; at >= Math.max(0, buffer.length - 22 - 0xffff); at -= 1) {
    if (buffer.readUInt32LE(at) === 0x06054b50) { end = at; break; }
  }
  if (end < 0) throw new Error(`ZIP_END_NOT_FOUND: ${file}`);
  const members = new Map();
  let offset = buffer.readUInt32LE(end + 16);
  for (let index = 0; index < buffer.readUInt16LE(end + 10); index += 1) {
    const method = buffer.readUInt16LE(offset + 10);
    const compressedSize = buffer.readUInt32LE(offset + 20);
    const nameLength = buffer.readUInt16LE(offset + 28);
    const local = buffer.readUInt32LE(offset + 42);
    const name = buffer.toString("utf8", offset + 46, offset + 46 + nameLength);
    const start = local + 30 + buffer.readUInt16LE(local + 26) + buffer.readUInt16LE(local + 28);
    const raw = buffer.subarray(start, start + compressedSize);
    members.set(name, method === 0 ? Buffer.from(raw) : zlib.inflateRawSync(raw));
    offset += 46 + nameLength + buffer.readUInt16LE(offset + 30) + buffer.readUInt16LE(offset + 32);
  }
  return members;
}
const downloadMembers = (treeRoot) =>
  walk(path.join(treeRoot, "downloads"))
    .filter((file) => file.endsWith(".zip"))
    .map((file) => {
      const token = path.basename(file, ".zip");
      const members = zipMembers(file);
      return { token, file, members, json: members.get(`${token}.json`), csv: members.get(`${token}.csv`) };
    });
const refDownloads = downloadMembers(refRoot);
const ourDownloads = downloadMembers(root);
const BOM = new RegExp("^" + String.fromCharCode(0xfeff), "u");
const csvHeaderText = (text) => text.replace(BOM, "").split(/\r?\n/u, 1)[0].split(",");
const csvHeader = (file) => fs.readFileSync(file, "utf8").replace(/^\ufeff/u, "").split(/\r?\n/u, 1)[0].split(",");
const sameKeys = (name, ours, theirs) => check(name, JSON.stringify(ours) === JSON.stringify(theirs), { ours, theirs }, "same key set");
sameKeys("SCHEMA_ENVELOPE_KEYS", unionKeys(tree.packContents.map((p) => p.envelope)), unionKeys(ref.packContents.map((p) => p.envelope)));
sameKeys("SCHEMA_PACK_CONTENT_KEYS", unionKeys(tree.packContents.map((p) => p.content)), unionKeys(ref.packContents.map((p) => p.content)));
sameKeys("SCHEMA_BUNDLE_INDEX_KEYS", Object.keys(tree.bundle).sort(), Object.keys(ref.bundle).sort());
sameKeys("SCHEMA_BUNDLE_PACK_KEYS", unionKeys(tree.bundle.packs), unionKeys(ref.bundle.packs));
sameKeys("SCHEMA_BUNDLE_ELEMENT_KEYS", unionKeys(Object.values(tree.bundle.elements)), unionKeys(Object.values(ref.bundle.elements)));
sameKeys("SCHEMA_PAYLOAD_KEYS", unionKeys(Object.values(tree.payloads)), unionKeys(Object.values(ref.payloads)));
sameKeys("SCHEMA_META_KEYS", unionKeys(Object.values(tree.payloads).map((p) => p.meta)), unionKeys(Object.values(ref.payloads).map((p) => p.meta)));
const COUNTRY_CATALOG_ADDITIONS = ["collectionPlanned", "countryElementLabels"];
check("SCHEMA_CATALOG_KEYS_SUBSET", missingFrom(unionKeys(tree.catalog), [...unionKeys(ref.catalog), ...COUNTRY_CATALOG_ADDITIONS]).length === 0,
  missingFrom(unionKeys(tree.catalog), [...unionKeys(ref.catalog), ...COUNTRY_CATALOG_ADDITIONS]), []);
const ourIndicators = Object.values(tree.payloads).flatMap((p) => p.meta.indicators);
const refIndicators = Object.values(ref.payloads).flatMap((p) => p.meta.indicators);
check("SCHEMA_INDICATOR_KEYS_SUBSET", missingFrom(unionKeys(ourIndicators), unionKeys(refIndicators)).length === 0, missingFrom(unionKeys(ourIndicators), unionKeys(refIndicators)), []);
const ourObs = records(tree.payloads, "observations");
const ourEnt = records(tree.payloads, "entities");
check("SCHEMA_OBSERVATION_KEYS_SUBSET", missingFrom(unionKeys(ourObs), [...unionKeys(records(ref.payloads, "observations")), "sourceAttributes"]).length === 0,
  missingFrom(unionKeys(ourObs), unionKeys(records(ref.payloads, "observations"))), ["sourceAttributes allowed"]);
check("SCHEMA_ENTITY_KEYS_SUBSET", missingFrom(unionKeys(ourEnt), unionKeys(records(ref.payloads, "entities"))).length === 0, missingFrom(unionKeys(ourEnt), unionKeys(records(ref.payloads, "entities"))), []);
check("SCHEMA_PROVENANCE_KEYS_SUBSET",
  missingFrom(unionKeys([...ourObs, ...ourEnt].map((r) => r.provenance)), unionKeys([...records(ref.payloads, "observations"), ...records(ref.payloads, "entities")].map((r) => r.provenance))).length === 0,
  missingFrom(unionKeys([...ourObs, ...ourEnt].map((r) => r.provenance)), unionKeys([...records(ref.payloads, "observations"), ...records(ref.payloads, "entities")].map((r) => r.provenance))), []);
sameKeys("SCHEMA_SEARCH_KEYS", [...Object.keys(tree.search).sort(), "|", ...unionKeys(tree.search.elements)], [...Object.keys(ref.search).sort(), "|", ...unionKeys(ref.search.elements)]);
sameKeys("SCHEMA_SOURCE_REGISTRY_KEYS", [...Object.keys(tree.sources).sort(), "|", ...unionKeys(tree.sources.sources)], [...Object.keys(ref.sources).sort(), "|", ...unionKeys(ref.sources.sources)]);
if (refDownloads.length && ourDownloads.length) {
  const parse = (member) => JSON.parse(member.toString("utf8"));
  sameKeys("SCHEMA_DOWNLOAD_JSON_KEYS", unionKeys(ourDownloads.map((row) => parse(row.json))).filter((k) => k !== "recordDefaults"), Object.keys(parse(refDownloads[0].json)).filter((k) => k !== "recordDefaults").sort());
}
sameKeys("SCHEMA_DELIVERY_MANIFEST_KEYS", Object.keys(readJson(path.join(root, "downloads/delivery-manifest.json"))).sort(), Object.keys(readJson(path.join(refRoot, "downloads/delivery-manifest.json"))).sort());
for (const file of ["quality-report.json", "framework-coverage.json", "rights-matrix.json", "publication-decisions.json", "map-index.json", "manifest.json"]) {
  sameKeys(`SCHEMA_TOP_KEYS_${file}`, Object.keys(readJson(path.join(root, file))).sort(), Object.keys(readJson(path.join(refRoot, file))).sort());
}
check("SCHEMA_MANIFEST_ASSET_KEYS_SUBSET", missingFrom(Object.keys(tree.manifest.assets), Object.keys(ref.manifest.assets)).length === 0, missingFrom(Object.keys(tree.manifest.assets), Object.keys(ref.manifest.assets)), []);
const expectedHeader = [...csvHeaderText(refDownloads[0].csv.toString("utf8")), "지역명_한글"];
const csvHeaderMismatch = ourDownloads.filter((row) => JSON.stringify(csvHeaderText(row.csv.toString("utf8"))) !== JSON.stringify(expectedHeader));
check("SCHEMA_CSV_HEADER", ourDownloads.length > 0 && csvHeaderMismatch.length === 0, csvHeaderMismatch.map((row) => `${row.token}.csv`), expectedHeader);

// ---------------------------------------------------------------- B. counts and statuses
const staged = readJson(config.source.manifest);
const delivered = new Set(staged.files.map((file) => file.elementId));
const framework = tree.catalog.map((row) => row.elementId);
const notProvided = framework.filter((id) => !delivered.has(id));
check("COUNT_FRAMEWORK", framework.length === tree.bundle.elementCount && framework.length === Object.keys(tree.payloads).length, { catalog: framework.length, bundle: tree.bundle.elementCount, payloads: Object.keys(tree.payloads).length }, "equal");
// V158: an excluded element keeps its measured status beside the decision.
const measuredStatus = (row) => row.exclusion?.measuredStatus ?? row.publicStatus;
check("COUNT_DELIVERED", tree.catalog.filter((row) => measuredStatus(row) !== "not-provided").every((row) => delivered.has(row.elementId)) && delivered.size === staged.workbookCount, { delivered: delivered.size }, staged.workbookCount);
const badNotProvided = notProvided.filter((id) => {
  const row = tree.catalog.find((item) => item.elementId === id);
  const payload = tree.payloads[id];
  return measuredStatus(row) !== "not-provided" || row.downloadAssets || payload.meta.indicators.length || payload.observations.recordCount || payload.entities.recordCount;
});
check("NOT_PROVIDED_HAS_NOTHING", badNotProvided.length === 0, { notProvided: notProvided.length, bad: badNotProvided }, "no indicator, record or download");
// V158 (user decision 2026-09-30): the exclusions common to every country
// apply here too - exactly those elements, each with the decision's public notice.
const commonExclusions = readJson(path.join(REPO, "config/data-publication/common-exclusions-v158.json")).exclusions || [];
const excludedRows = tree.catalog.filter((row) => row.publicStatus === "excluded");
const exclusionMismatch = [
  ...commonExclusions.filter((decision) => !excludedRows.some((row) => row.elementId === decision.elementId && row.exclusion?.publicNotice === decision.publicNotice && !row.downloadAllowed)).map((decision) => decision.elementId),
  ...excludedRows.filter((row) => !commonExclusions.some((decision) => decision.elementId === row.elementId)).map((row) => row.elementId),
];
check("EXCLUSIONS_MATCH_COMMON_DECISION", exclusionMismatch.length === 0, { excluded: excludedRows.map((row) => row.elementId), mismatch: exclusionMismatch }, commonExclusions.map((row) => row.elementId));
const statusCounts = {};
tree.catalog.forEach((row) => { statusCounts[row.publicStatus] = (statusCounts[row.publicStatus] || 0) + 1; });
check("STATUS_COUNTS_MATCH", JSON.stringify(Object.fromEntries(Object.entries(statusCounts).sort())) === JSON.stringify(tree.manifest.publicStatusCounts), statusCounts, tree.manifest.publicStatusCounts);

// ---------------------------------------------------------------- C. this country only
const idPattern = new RegExp(`^${prefix}-[a-e]-\\d{3}-(obs|entity)-\\d{5}$`, "u");
check("RECORDS_COUNTRY_ONLY", [...ourObs, ...ourEnt].every((row) => row.countryIso3 === config.iso3), [...ourObs, ...ourEnt].filter((row) => row.countryIso3 !== config.iso3).length, 0);
check("RECORD_ID_FORMAT", [...ourObs, ...ourEnt].every((row) => idPattern.test(row.recordId)), [...ourObs, ...ourEnt].filter((row) => !idPattern.test(row.recordId)).slice(0, 5).map((row) => row.recordId), idPattern.source);
const refIds = new Set([...records(ref.payloads, "observations"), ...records(ref.payloads, "entities")].map((row) => row.recordId));
check("NO_REFERENCE_RECORD_IDS", [...ourObs, ...ourEnt].every((row) => !refIds.has(row.recordId)), 0, 0);
const refPrefix = (String(ref.packContents[0].envelope.shardId).match(/^(.*)-pack-\d{3}/u) || [])[1];
const forbidden = [reference.dataRoot, refPrefix].filter(Boolean);
const leaks = [];
for (const file of walk(root)) {
  let text = fs.readFileSync(file, "utf8");
  text += envelopeText(file, text);
  for (const needle of forbidden) if (text.includes(needle)) leaks.push(`${path.relative(root, file)}:${needle}`);
}
check("NO_REFERENCE_STRINGS", leaks.length === 0, leaks.slice(0, 10), forbidden);
const stagedNames = new Set(staged.files.map((file) => file.fileName));
check("PROVENANCE_FROM_STAGED_FILES", [...ourObs, ...ourEnt].every((row) => stagedNames.has(row.provenance.sourceFileOriginal)), [...ourObs, ...ourEnt].filter((row) => !stagedNames.has(row.provenance.sourceFileOriginal)).length, 0);

// ---------------------------------------------------------------- D. nothing dropped
const quality = readJson(path.join(root, "quality-report.json"));
const rowMismatches = quality.workbooks
  .map((book) => ({ id: book.elementId, source: Number(book.observationRowCount) + Number(book.entityRowCount), published: tree.payloads[book.elementId].observations.recordCount + tree.payloads[book.elementId].entities.recordCount }))
  .filter((row) => row.source !== row.published);
const publishedTotal = ourObs.length + ourEnt.length;
check("ROWS_PUBLISHED_EQUAL_SOURCE", rowMismatches.length === 0 && quality.summary.rowBalance.matches, { mismatches: rowMismatches, publishedTotal }, "per element equal, row balance matches");
// Count the source cells straight from the staged workbooks, with the ETL's own
// placeholder rule, and hand the rule over so both sides judge a cell alike.
const py = spawnSync("python", ["-B", "-c", `
import json, pathlib, sys
sys.path.insert(0, ${JSON.stringify(REPO)})
from tools.etl.source_zip import analyze_source_dir
from tools.etl.normalization import is_placeholder, _PLACEHOLDER_EXACT
from tools.etl import build_public_v2 as v2
a = analyze_source_dir(pathlib.Path(${JSON.stringify(path.join(REPO, config.source.staging))}), include_records=True)
std_o = {"element_id","indicator_id","country_iso3","year","period","value","missing_reason_code","note","source_row","element_name"}
std_e = {"element_id","indicator_id","country_iso3","lat","lon","geometry_type","crs","note","missing_reason_code","source_row","attributes","element_name"}
filled = lambda v: v not in (None, "") and not is_placeholder(v)
out = {"placeholders": sorted(_PLACEHOLDER_EXACT), "packRule": {"elements": v2.PACK_ELEMENT_COUNT, "soloBytes": v2.SOLO_PACK_CONTENT_BYTES}, "observations": {}, "entities": {}, "meta": {}}
special = set(${JSON.stringify(config.countrySpecificElements.elementIds)})
for b in a["workbooks"]:
    counts = {}
    for row in b.get("observations") or []:
        for k, v in row.items():
            if k not in std_o and filled(v):
                key = str(row.get("indicator_id") or "") + "\\u0001" + k
                counts[key] = counts.get(key, 0) + 1
    if counts:
        out["observations"][b["elementId"]] = counts
    cells = 0
    for row in b.get("entities") or []:
        cells += sum(1 for v in (row.get("attributes") or {}).values() if filled(v))
        cells += sum(1 for k, v in row.items() if k not in std_e and filled(v))
    if cells:
        out["entities"][b["elementId"]] = cells
    if b["elementId"] in special:
        out["meta"][b["elementId"]] = [{"indicatorId": str(r.get("indicator_id") or ""), "elementKr": r.get("element_kr"), "sourceOrg": r.get("source_org")} for r in b.get("metadata") or []]
print(json.dumps(out, ensure_ascii=False))
`], { encoding: "utf8", maxBuffer: 256 * 1024 * 1024 });
if (py.status !== 0) throw new Error(`python helper failed: ${py.stderr}`);
const sourceCells = JSON.parse(py.stdout);
const PLACEHOLDERS = new Set(sourceCells.placeholders);
// normalization.is_placeholder
const isPlaceholder = (value) => value === null || value === undefined || PLACEHOLDERS.has(nfcText(value).toLowerCase());
const filled = (value) => value !== null && value !== undefined && value !== "" && !isPlaceholder(value);
const cellProblems = [];
for (const [elementId, payload] of Object.entries(tree.payloads)) {
  const source = sourceCells.entities[elementId] || 0;
  const kept = payload.entities.records.reduce((sum, row) => sum + Object.values(row.normalizedAttributes || {}).filter(filled).length, 0);
  if (kept !== source) cellProblems.push({ elementId, section: "entities", source, kept });
}
for (const [elementId, counts] of Object.entries(sourceCells.observations)) {
  const payload = tree.payloads[elementId];
  const indicators = Object.fromEntries(payload.meta.indicators.map((item) => [item.indicatorId, item]));
  for (const [compound, count] of Object.entries(counts)) {
    const [indicatorId, column] = compound.split("\u0001");
    const rows = payload.observations.records.filter((row) => row.indicatorId === indicatorId);
    const constant = indicators[indicatorId] && indicators[indicatorId].extraMeta && indicators[indicatorId].extraMeta[column] !== undefined;
    const kept = constant ? rows.length : rows.filter((row) => row.sourceAttributes && filled(row.sourceAttributes[column])).length;
    if (kept !== count) cellProblems.push({ elementId, indicatorId, column, source: count, kept });
  }
}
check("NO_SOURCE_CELL_DROPPED", cellProblems.length === 0, cellProblems.slice(0, 10), "every filled attribute and template-external cell kept");

// ---------------------------------------------------------------- E. rights and downloads
const DOWNLOADABLE = "가능";
const rightsProblems = [];
for (const [elementId, payload] of Object.entries(tree.payloads)) {
  const indicators = Object.fromEntries(payload.meta.indicators.map((item) => [item.indicatorId, item]));
  for (const row of [...payload.observations.records, ...payload.entities.records]) {
    const indicator = indicators[row.indicatorId] || {};
    const expected = String(indicator.downloadAllowed || "").trim() === DOWNLOADABLE;
    if (Boolean(row.downloadEligible) !== expected) rightsProblems.push({ elementId, recordId: row.recordId, downloadEligible: row.downloadEligible, meta: indicator.downloadAllowed });
    if (indicator.licenseCode && !(row.rightsNote || "").includes(String(indicator.licenseCode).trim())) rightsProblems.push({ elementId, recordId: row.recordId, missing: "license in rightsNote" });
  }
  const element = tree.catalog.find((item) => item.elementId === elementId);
  if (element.publicStatus !== "not-provided" && !element.displayAllowed) rightsProblems.push({ elementId, displayAllowed: false });
}
check("RIGHTS_DOWNLOAD_PER_SOURCE_META", rightsProblems.length === 0, rightsProblems.slice(0, 10), "download only where meta says 가능; license kept");
const downloadProblems = [];
for (const element of tree.catalog.filter((row) => row.downloadAssets)) {
  const payload = tree.payloads[element.elementId];
  const eligible = new Set([...payload.observations.records, ...payload.entities.records].filter((row) => row.downloadEligible).map((row) => row.recordId));
  const zipped = ourDownloads.find((row) => row.token === element.elementId.toLowerCase());
  const document = JSON.parse(zipped.json.toString("utf8"));
  const ids = new Set([...(document.observations || []), ...(document.entities || [])].map((row) => row.recordId));
  if (ids.size !== eligible.size || [...ids].some((id) => !eligible.has(id))) downloadProblems.push({ elementId: element.elementId, file: ids.size, eligible: eligible.size });
  const csvRows = zipped.csv.toString("utf8").replace(BOM, "");
  const parsed = parseCsv(csvRows);
  if (parsed.length - 1 !== eligible.size) downloadProblems.push({ elementId: element.elementId, csvRows: parsed.length - 1, eligible: eligible.size });
}
check("DOWNLOADS_EXACTLY_ELIGIBLE", downloadProblems.length === 0, downloadProblems.slice(0, 10), "download files hold exactly the eligible records");

// ---------------------------------------------------------------- F. integrity and loader contracts
const integrity = readJson(path.join(root, "asset-integrity.json"));
const listed = new Map(integrity.assets.map((row) => [row.url, row]));
const integrityProblems = [];
for (const row of integrity.assets) {
  const file = resolveUrl(row.url);
  if (!fs.existsSync(file)) { integrityProblems.push({ url: row.url, missing: true }); continue; }
  const bytes = fs.readFileSync(file);
  if (bytes.length !== row.bytes || sha256(bytes) !== row.sha256) integrityProblems.push({ url: row.url, bytes: bytes.length });
}
for (const file of walk(root)) {
  if (path.basename(file) === "asset-integrity.json") continue;
  const url = "/" + path.relative(publicDir, file).split(path.sep).join("/");
  if (!listed.has(url)) integrityProblems.push({ url, unlisted: true });
}
check("ASSET_INTEGRITY", integrityProblems.length === 0, integrityProblems.slice(0, 10), "every file listed with matching bytes and sha256");
const deliveryManifest = readJson(path.join(root, "downloads/delivery-manifest.json"));
const catalogAssetProblems = [];
for (const element of tree.catalog) {
  for (const asset of element.downloadAssets || []) {
    const bytes = fs.readFileSync(resolveUrl(asset.url));
    const delivery = deliveryManifest.assets.find((row) => row.elementId === element.elementId && row.format === asset.format);
    if (bytes.length !== asset.byteSize || sha256(bytes) !== asset.sha256 || !delivery || delivery.sha256 !== asset.sha256) catalogAssetProblems.push({ elementId: element.elementId, format: asset.format });
    // V158: each file inside the ZIP is the one the catalog lists.
    const members = asset.format === "ZIP" ? zipMembers(resolveUrl(asset.url)) : null;
    for (const entry of (members && asset.entries) || []) {
      const member = members.get(entry.fileName);
      if (!member || member.length !== entry.byteSize || sha256(member) !== entry.sha256) catalogAssetProblems.push({ elementId: element.elementId, entry: entry.fileName });
    }
  }
}
check("DOWNLOAD_ASSET_HASHES", catalogAssetProblems.length === 0, catalogAssetProblems, []);
const runtimeVersion = ref.manifest.runtimeVersion;
const envelopeProblems = walk(path.join(root, "packs")).filter((file) => path.basename(file) !== "bundle-index-v124.json").filter((file) => {
  const p = readJson(file);
  const chunks = p.payloadChunks;
  return !(p.schemaVersion === "v124" && p.runtimeVersion === runtimeVersion && p.transportEncoding === "gzip-base64-chunks-v2" && p.shardId &&
    ["element-shard", "search-index", "source-registry"].includes(p.resourceType || "") && Number.isInteger(p.compressedByteSize) && Number.isInteger(p.contentByteSize) &&
    /^[a-f0-9]{64}$/u.test(p.compressedSha256 || "") && /^[a-f0-9]{64}$/u.test(p.contentSha256 || "") && Array.isArray(chunks) && chunks.length > 0 &&
    p.payloadChunkCount === chunks.length && chunks.every((chunk) => typeof chunk === "string" && chunk.length > 0 && chunk.length % 4 === 0 && /^[A-Za-z0-9+/]*={0,2}$/u.test(chunk)) &&
    sha256(Buffer.from(chunks.join(""), "base64")) === p.compressedSha256);
}).map((file) => path.basename(file));
check("LOADER_ENVELOPE_CONTRACT", envelopeProblems.length === 0, envelopeProblems, "validateEnvelope rules (vietnamDataLoaderV124.ts)");
const b = tree.bundle;
check("LOADER_BUNDLE_INDEX_CONTRACT", b.schemaVersion === "v124" && b.runtimeVersion === runtimeVersion && b.assetLayoutVersion === "gzip-base64-json-envelope-v2" &&
  b.elementCount === framework.length && Object.keys(b.elements).length === framework.length && Array.isArray(b.packs) && b.packs.length === b.packCount,
  { elementCount: b.elementCount, packs: b.packs.length }, "validateBundleIndex rules with the framework size");
check("LOADER_MANIFEST_CONTRACT", tree.manifest.schemaVersion === "v124" && tree.manifest.runtimeVersion === runtimeVersion && tree.manifest.assetLayoutVersion === "gzip-base64-json-envelope-v2", tree.manifest.schemaVersion, "v124");
const urlProblems = [];
const collectUrls = (value) => (typeof value === "string" ? (value.startsWith(`${entry.dataRoot}/`) ? [value] : []) : Array.isArray(value) ? value.flatMap(collectUrls) : value && typeof value === "object" ? Object.values(value).flatMap(collectUrls) : []);
for (const url of new Set(collectUrls({ manifest: tree.manifest, catalog: tree.catalog, bundle: tree.bundle, map: readJson(path.join(root, "map-index.json")) }))) {
  if (!fs.existsSync(resolveUrl(url))) urlProblems.push(url);
}
check("URLS_RESOLVE", urlProblems.length === 0, urlProblems, []);
const tooLarge = walk(root).filter((file) => fs.statSync(file).size >= 100 * 1024 * 1024).map((file) => path.basename(file));
check("NO_FILE_OVER_100MIB", tooLarge.length === 0, tooLarge, []);
// The platform's pack rule (build_public_v2.PACK_ELEMENT_COUNT / SOLO_PACK_CONTENT_BYTES):
// sorted ids in slices; an element whose own content passes the limit gets a pack
// of its own. Element size here is the JS serialisation, so a 2% band absorbs
// float formatting differences from the Python writer.
const { elements: sliceSize, soloBytes } = sourceCells.packRule;
const sortedIds = [...framework].sort();
const packProblems = [];
const seen = new Map();
for (const pack of tree.bundle.packs) {
  const match = String(pack.shardId).match(new RegExp(`^${prefix}-pack-(\\d{3})(?:-([a-e]-\\d{3}))?$`, "u"));
  if (!match) { packProblems.push({ shardId: pack.shardId, problem: "name" }); continue; }
  const slice = sortedIds.slice((Number(match[1]) - 1) * sliceSize, Number(match[1]) * sliceSize);
  for (const id of pack.elementIds) {
    seen.set(id, (seen.get(id) || 0) + 1);
    const bytes = Buffer.byteLength(JSON.stringify(tree.payloads[id]), "utf8");
    if (!slice.includes(id)) packProblems.push({ shardId: pack.shardId, id, problem: "outside its slice" });
    if (match[2] && (pack.elementIds.length !== 1 || id !== match[2].toUpperCase() || bytes < soloBytes * 0.98)) packProblems.push({ shardId: pack.shardId, id, bytes, problem: "solo pack for a small element" });
    if (!match[2] && bytes > soloBytes * 1.02) packProblems.push({ shardId: pack.shardId, id, bytes, problem: "large element in a shared pack" });
  }
}
const unpacked = sortedIds.filter((id) => seen.get(id) !== 1);
check("PACK_PLAN_RULE", packProblems.length === 0 && unpacked.length === 0, { packProblems: packProblems.slice(0, 5), unpacked }, "slices of the platform size; solo only above the platform limit; each element once");

// ---------------------------------------------------------------- G. region names
const regionConfig = readJson(config.regionColumns);
const countryKeys = new Set([regionNameKeyV161(entry.nameEn), regionNameKeyV161(entry.iso3)]);
const expectedRegion = (attributes) => {
  const level = { division: "division", district: "district" }[nfcText(attributes["행정단위"] ?? "").toLowerCase()];
  for (const column of regionConfig.romanisedColumns) {
    const value = attributes[column];
    if (isPlaceholder(value) || !nfcText(value)) continue;
    const one = (raw) => (!regionNameKeyV161(raw) ? "" : countryKeys.has(regionNameKeyV161(raw)) ? entry.nameKo : formatRegionName({ country: entry.iso3, raw, level, mode: "label" }));
    const text = nfcText(value);
    const sep = regionConfig.listSeparator;
    return sep && text.includes(sep) ? text.split(sep).map((part) => part.trim()).filter(Boolean).map(one).join(` ${sep} `) : one(text);
  }
  return "";
};
const regionProblems = [];
let divisionRows = 0;
let divisionHits = 0;
let nonLatinInRegion = 0;
const nonLatinSourceCells = {};
for (const download of ourDownloads) {
  const file = `${download.token}.csv`;
  const rows = parseCsv(download.csv.toString("utf8").replace(BOM, ""));
  const header = rows[0];
  const at = (row, name) => row[header.indexOf(name)];
  for (const row of rows.slice(1)) {
    if (at(row, "record_type") !== "entity") continue;
    const attributes = JSON.parse(at(row, "attributes_json") || "{}");
    const expected = expectedRegion(attributes);
    const actual = at(row, "지역명_한글") || "";
    if (actual !== expected) regionProblems.push({ file: path.basename(file), recordId: at(row, "record_id"), actual, expected });
    if (NON_LATIN_LETTER.test(actual)) nonLatinInRegion += 1;
    // Source cells stay as delivered; counted so the screen work knows where a
    // bracketed local name must take the romanised part.
    for (const column of regionConfig.romanisedColumns) {
      if (NON_LATIN_LETTER.test(String(attributes[column] ?? ""))) {
        const key = `${path.basename(file, ".csv").toUpperCase()}:${column}`;
        nonLatinSourceCells[key] = (nonLatinSourceCells[key] || 0) + 1;
      }
    }
    if (String(attributes["행정단위"] || "").trim() === "Division") {
      divisionRows += 1;
      if (HANGUL.test(actual)) divisionHits += 1;
    }
  }
}
check("REGION_NAME_EQUALS_FORMATREGIONNAME", regionProblems.length === 0, regionProblems.slice(0, 5), "지역명_한글 = formatRegionName(label) of the romanised column");
check("REGION_DIVISION_HIT_100", divisionRows > 0 && divisionRows === divisionHits, { divisionRows, divisionHits }, "every Division row resolves in the dictionary");
check("REGION_LABEL_NO_NON_LATIN", nonLatinInRegion === 0, nonLatinInRegion, 0);

// ---------------------------------------------------------------- H. country-specific names and sources
const specialProblems = [];
for (const [elementId, rows] of Object.entries(sourceCells.meta)) {
  const indicators = Object.fromEntries(tree.payloads[elementId].meta.indicators.map((item) => [item.indicatorId, item]));
  for (const row of rows) {
    const indicator = indicators[row.indicatorId];
    const norm = (value) => (value === null || value === undefined ? null : String(value).normalize("NFC"));
    if (!indicator || norm(indicator.labelKo) !== norm(row.elementKr || indicator.labelKo) || norm(indicator.sourceOrg) !== norm(row.sourceOrg || indicator.sourceOrg)) {
      specialProblems.push({ elementId, indicatorId: row.indicatorId });
    }
  }
}
const specialDelivered = config.countrySpecificElements.elementIds.filter((id) => delivered.has(id));
check("COUNTRY_SPECIFIC_NAMES_AS_DELIVERED", specialProblems.length === 0 && Object.keys(sourceCells.meta).length === specialDelivered.length,
  { problems: specialProblems.slice(0, 5), checkedElements: Object.keys(sourceCells.meta) }, specialDelivered);

// ---------------------------------------------------------------- I. secrets
const SECRET = [/api[_-]?key\s*[=:]\s*[A-Za-z0-9_\-]{16,}/iu, /AKIA[0-9A-Z]{16}/u, /-----BEGIN [A-Z ]*PRIVATE KEY-----/u, /ghp_[A-Za-z0-9]{36}/u, /\bsk-[A-Za-z0-9]{20,}/u, /\b(?:password|passwd)\s*[=:]\s*[^\s"',;]{6,}/iu];
const secretHits = [];
for (const file of walk(root)) {
  let text = fs.readFileSync(file, "utf8");
  text += envelopeText(file, text);
  SECRET.forEach((pattern, index) => { if (pattern.test(text)) secretHits.push(`${path.relative(root, file)}#${index}`); });
}
const redactionReport = `reports/${config.version}/source-credential-redaction-${code}-${config.version}.json`;
const redaction = fs.existsSync(path.join(REPO, redactionReport)) ? readJson(redactionReport) : null;
check("NO_SECRETS", secretHits.length === 0 && redaction && redaction.applied === true, { secretHits, redactionApplied: redaction && redaction.applied }, "no secret pattern; redaction applied");

// ---------------------------------------------------------------- J. reference unchanged
// V158-B2: src is no longer part of this check. The country layer changes src
// on purpose; the reference country's screens are held by the screen
// signature and the release gate instead (reports/v158/EXPECTATION_CHANGES_V158-B2.md).
const diff = spawnSync("git", ["diff", "--quiet", "HEAD", "--", `public${reference.dataRoot}`, "public/data/countries.json"], { cwd: REPO });
const refIntegrity = readJson(path.join(refRoot, "asset-integrity.json"));
const refDrift = refIntegrity.assets.filter((row) => {
  const file = path.join(REPO, "public", row.url);
  return !fs.existsSync(file) || sha256(fs.readFileSync(file)) !== row.sha256;
}).map((row) => row.url);
check("REFERENCE_TREE_UNCHANGED", diff.status === 0 && refDrift.length === 0, { gitDiffClean: diff.status === 0, drift: refDrift.slice(0, 5) }, "no change to the reference tree or the registry");

// ---------------------------------------------------------------- K. determinism
const compare = arg("--compare");
if (compare) {
  const other = path.join(path.resolve(REPO, compare), entry.dataRoot);
  const owned = (dir) => walk(dir).filter((file) => /[\\/](packs|downloads)[\\/]|[\\/](catalog|framework-coverage|quality-report|rights-matrix|publication-decisions)\.json$/u.test(file));
  const differ = owned(root).filter((file) => {
    const twin = path.join(other, path.relative(root, file));
    return !fs.existsSync(twin) || sha256(fs.readFileSync(twin)) !== sha256(fs.readFileSync(file));
  }).map((file) => path.relative(root, file));
  check("DETERMINISTIC_BUILD", differ.length === 0 && owned(other).length === owned(root).length, differ.slice(0, 10), "second build byte-identical");
}

// ---------------------------------------------------------------- report
function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = "";
  let quoted = false;
  for (let i = 0; i < text.length; i += 1) {
    const ch = text[i];
    if (quoted) {
      if (ch === '"' && text[i + 1] === '"') { field += '"'; i += 1; }
      else if (ch === '"') quoted = false;
      else field += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === ",") { row.push(field); field = ""; }
    else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && text[i + 1] === "\n") i += 1;
      row.push(field); rows.push(row); row = []; field = "";
    } else field += ch;
  }
  if (field !== "" || row.length) { row.push(field); rows.push(row); }
  return rows;
}

const failed = checks.filter((item) => !item.pass).map((item) => item.name);
const summary = {
  type: "summary",
  audit: `country-verify:${code}:${config.version}`,
  status: failed.length ? "FAIL" : "PASS",
  passed: checks.length - failed.length,
  failed: failed.length,
  total: checks.length,
  failedChecks: failed,
  framework: framework.length,
  delivered: delivered.size,
  notProvided: notProvided.length,
  records: publishedTotal,
  packs: tree.bundle.packCount,
  downloadableElements: tree.catalog.filter((row) => row.downloadAssets).length,
  divisionRows,
  nonLatinSourceCells,
};
const out = arg("--out", `reports/${config.version}/${code}-verify-${config.version}.json`);
fs.mkdirSync(path.dirname(path.join(REPO, out)), { recursive: true });
fs.writeFileSync(path.join(REPO, out), `${JSON.stringify({ ...summary, reference: reference.iso3, checks }, null, 2)}\n`, "utf8");
console.log(JSON.stringify(summary));
process.exit(failed.length ? 1 : 0);
