#!/usr/bin/env node
/**
 * V153: promote a pipeline run for named elements only.
 *
 * The V137 promotion copies the whole staging tree and removes what it does
 * not hold. The published tree, though, carries assets the pipeline never
 * produces (geometry/vnm-adm1-34.geojson from V151, home/card-summaries-v140,
 * dataset-directory.json), and a parallel session owns map-index.json and the
 * spatial layers. So this copies, for the elements named:
 *
 *   downloads/<id>.json, downloads/<id>.csv, semantic/elements/<id>.json,
 *   interpretation/elements/<id>.json (when the run wrote one),
 *   every pack shard (hash-named; stale shards are removed) and
 *   packs/bundle-index-v124.json, downloads/delivery-manifest.json,
 *
 * and, with --catalog, catalog.json - but only when the element-level diff is
 * limited to the keys listed in --catalog-keys (default: technologyIds plus the
 * count fields of the named elements). It never touches map-index.json,
 * spatial/, geometry/ or home/. asset-integrity.json and dataset-directory.json
 * are rebuilt afterwards by `npm run build:dataset-directory:v150`.
 *
 *   node scripts/v153/promote-elements-v153.mjs --from <staging v2 dir> --ids B-046,B-047
 *       [--catalog] [--catalog-keys technologyIds,observationCount] [--all-packs] [--dry-run]
 */
import { copyFileSync, existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";

const ROOT = resolve(import.meta.dirname, "../..");
const argv = process.argv.slice(2);
const opt = (name, fallback) => {
  const index = argv.indexOf(name);
  return index < 0 ? fallback : argv[index + 1];
};
const FROM = resolve(ROOT, opt("--from", ".staging/final/public/data/vietnam/v2"));
const TO = resolve(ROOT, "public/data/vietnam/v2");
const DIFF_REPORT = opt("--from-diff", "");
const idsFromDiff = () => {
  // Every element whose per-element asset the run changed, read off the diff
  // report, so packs, downloads and the catalog stay one consistent set.
  const report = JSON.parse(readFileSync(resolve(ROOT, DIFF_REPORT), "utf8"));
  const ids = new Set();
  for (const row of report.changed || []) {
    const match = row.path.match(/^(?:downloads|semantic\/elements|interpretation\/elements)\/([a-e]-\d{3})\.(?:json|csv)$/u);
    if (match) ids.add(match[1].toUpperCase());
  }
  return [...ids].sort();
};
const IDS = DIFF_REPORT
  ? idsFromDiff()
  : (opt("--ids", "") || "").split(",").map((item) => item.trim()).filter(Boolean);
const WITH_CATALOG = argv.includes("--catalog");
const DRY = argv.includes("--dry-run");
const COUNT_KEYS = ["observationCount", "entityCount", "downloadableRecordCount", "availableIndicatorCount", "downloadAssets", "rowAccounting"];
const CATALOG_KEYS = new Set((opt("--catalog-keys", "technologyIds,downloadAssets") || "").split(",").map((item) => item.trim()).filter(Boolean));
const OUT = resolve(ROOT, "reports/v153/promote-elements-v153.json");

if (IDS.length === 0 && !WITH_CATALOG) {
  console.error("usage: --ids A-023,B-046 [--catalog]");
  process.exit(2);
}
if (!existsSync(FROM)) {
  console.error(`staging tree missing: ${FROM}`);
  process.exit(2);
}

const actions = [];
const copy = (rel) => {
  const source = join(FROM, rel);
  if (!existsSync(source)) {
    actions.push({ action: "skip-missing", path: rel });
    return;
  }
  const target = join(TO, rel);
  const same = existsSync(target) && readFileSync(source).equals(readFileSync(target));
  actions.push({ action: same ? "unchanged" : "copy", path: rel });
  if (!same && !DRY) {
    mkdirSync(dirname(target), { recursive: true });
    copyFileSync(source, target);
  }
};

for (const id of IDS) {
  const token = id.toLowerCase();
  copy(`downloads/${token}.json`);
  copy(`downloads/${token}.csv`);
  copy(`semantic/elements/${token}.json`);
  copy(`interpretation/elements/${token}.json`);
}
if (IDS.length > 0 || argv.includes("--all-packs")) {
  // Pack shards are named by content hash: copy the staging set, drop the rest.
  const stagingPacks = readdirSync(join(FROM, "packs")).filter((name) => name.endsWith(".json"));
  const publishedPacks = readdirSync(join(TO, "packs")).filter((name) => name.endsWith(".json"));
  for (const name of stagingPacks) copy(`packs/${name}`);
  for (const name of publishedPacks) {
    if (!stagingPacks.includes(name)) {
      actions.push({ action: "remove-stale", path: `packs/${name}` });
      if (!DRY) rmSync(join(TO, "packs", name));
    }
  }
  copy("downloads/delivery-manifest.json");
  // manifest.json names the search index shard; it is copied only when that
  // is the sole difference (the map builder owns its other fields).
  const stagingManifest = JSON.parse(readFileSync(join(FROM, "manifest.json"), "utf8"));
  const publishedManifest = JSON.parse(readFileSync(join(TO, "manifest.json"), "utf8"));
  const manifestProbe = (manifest) => JSON.stringify({ ...manifest, assets: { ...manifest.assets, searchIndex: null } });
  if (manifestProbe(stagingManifest) === manifestProbe(publishedManifest)) {
    copy("manifest.json");
  } else {
    actions.push({ action: "manifest-kept", path: "manifest.json", reason: "fields other than assets.searchIndex differ" });
  }
  // Semantic aggregates derived from the same packs (labels, contracts).
  for (const name of ["element-visualization-contracts-v125.json", "indicator-semantics-v125.json", "semantic-integrity-v125.json"]) {
    copy(`semantic/${name}`);
  }
}

let catalogResult = null;
if (WITH_CATALOG) {
  const staging = JSON.parse(readFileSync(join(FROM, "catalog.json"), "utf8"));
  const published = JSON.parse(readFileSync(join(TO, "catalog.json"), "utf8"));
  const right = new Map(published.elements.map((row) => [row.elementId, row]));
  const allowed = (id, key) => CATALOG_KEYS.has(key) || (IDS.includes(id) && COUNT_KEYS.includes(key));
  const violations = [];
  const merged = published.elements.map((row) => {
    const next = staging.elements.find((item) => item.elementId === row.elementId);
    if (!next) return row;
    const out = { ...row };
    for (const key of new Set([...Object.keys(row), ...Object.keys(next)])) {
      if (JSON.stringify(row[key]) === JSON.stringify(next[key])) continue;
      if (allowed(row.elementId, key)) out[key] = next[key];
      else violations.push({ elementId: row.elementId, key });
    }
    return out;
  });
  const missing = staging.elements.filter((row) => !right.has(row.elementId)).map((row) => row.elementId);
  // Top-level fields (generatedAt, map counts) belong to the map builder; a
  // run that moved them is not promoted here.
  const topLevel = [...new Set([...Object.keys(staging), ...Object.keys(published)])].filter(
    (key) => key !== "elements" && JSON.stringify(staging[key]) !== JSON.stringify(published[key])
  );
  const orderMatches =
    staging.elements.length === published.elements.length &&
    staging.elements.every((row, i) => row.elementId === published.elements[i].elementId);
  catalogResult = { violations, missing, topLevel, orderMatches, changedElements: merged.filter((row, i) => JSON.stringify(row) !== JSON.stringify(published.elements[i])).length };
  if (violations.length || missing.length || topLevel.length || !orderMatches) {
    actions.push({ action: "catalog-blocked", reason: "keys outside the allowed set differ", violations: violations.slice(0, 20), missing, topLevel, orderMatches });
  } else {
    // The staging file is copied verbatim so the ETL's own serialization is kept.
    actions.push({ action: catalogResult.changedElements ? "catalog-copy" : "unchanged", path: "catalog.json", changedElements: catalogResult.changedElements });
    if (!DRY && catalogResult.changedElements) copyFileSync(join(FROM, "catalog.json"), join(TO, "catalog.json"));
  }
}

const report = { schema: "v153-promote-elements-1", from: FROM, ids: IDS, dryRun: DRY, catalog: catalogResult, actions };
mkdirSync(dirname(OUT), { recursive: true });
writeFileSync(OUT, `${JSON.stringify(report, null, 2)}\n`);
for (const action of actions) console.log(`${action.action.padEnd(14)} ${action.path || JSON.stringify(action)}`);
if (actions.some((action) => action.action === "catalog-blocked")) process.exit(1);
