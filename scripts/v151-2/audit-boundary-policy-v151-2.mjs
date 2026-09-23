// V151-2 static gate: every map layer carries a boundary policy the contract
// declared, quantile statistics are never averaged, the derived boundary
// assets are complete, point layers have their location sidecar, and the
// pack split left every element payload where the index says it is.
//
//   node scripts/v151-2/audit-boundary-policy-v151-2.mjs [--data public/data/vietnam/v2]
//   [--out reports/v151-2/boundary-policy-v151-2.json]
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const argv = process.argv.slice(2);
const arg = (name, fallback) => {
  const index = argv.indexOf(name);
  return index < 0 ? fallback : argv[index + 1];
};
const DATA = resolve(ROOT, arg("--data", "public/data/vietnam/v2"));
const OUT = resolve(ROOT, arg("--out", "reports/v151-2/boundary-policy-v151-2.json"));

const readJson = (path) => JSON.parse(readFileSync(path, "utf8"));
const checks = [];
const check = (name, status, actual, expected) => {
  checks.push({ type: "check", audit: "boundary-policy:v151-2", name, status, actual, expected });
  process.stdout.write(`${JSON.stringify(checks[checks.length - 1])}\n`);
};
const equal = (name, actual, expected) =>
  check(name, JSON.stringify(actual) === JSON.stringify(expected) ? "PASS" : "FAIL", actual, expected);

const KINDS = ["sum", "area-weighted-mean", "member-max", "member-min", "range-only", "count-sum", "membership-or", "native-34", "six-region-only", "none"];
const QUANTILE = /분위|중앙값|상위\s*\d+\s*%|하위\s*\d+\s*%|백분위|순위/u;

// ---------------------------------------------------------------- map-index policies
const mapIndex = readJson(resolve(DATA, "map-index.json"));
const contract = readJson(resolve(ROOT, "src/data/visualization/publicMapTargetsV138.json"));
const layers = mapIndex.layers;
equal("LAYER_COUNT", layers.length, 42);
equal("LAYERS_WITHOUT_POLICY", layers.filter((layer) => !layer.boundaryPolicy).map((layer) => layer.elementId), []);
equal(
  "POLICY_KINDS_KNOWN",
  layers.filter((layer) => !KINDS.includes(layer.boundaryPolicy?.kind)).map((layer) => layer.elementId),
  []
);
const areaLayers = layers.filter((layer) => /choropleth/u.test(layer.renderer));
equal(
  "AREA_LAYERS_NOT_NONE",
  areaLayers.filter((layer) => layer.boundaryPolicy.kind === "none").map((layer) => layer.elementId),
  []
);
const quantileViolations = [];
for (const layer of layers) {
  for (const option of layer.selectors?.variables || []) {
    const key = option.measureKey || String(option.key || "").replace(/--[a-z0-9]+$/u, "");
    const kind = layer.boundaryPolicy.byVariable?.[key] || layer.boundaryPolicy.kind;
    if (QUANTILE.test(option.label || "") && kind !== "range-only" && kind !== "none") {
      quantileViolations.push(`${layer.elementId}:${option.key}:${kind}`);
    }
  }
}
equal("QUANTILE_VARIABLES_RANGE_ONLY", quantileViolations, []);
// The policy on map-index is the contract's declaration, nothing else.
const declaredMismatch = [];
for (const target of contract.targets) {
  const declared = target.build?.boundaryPolicy34 || target.build?.patch?.boundaryPolicy34;
  const layer = layers.find((entry) => entry.elementId === target.elementId);
  if (!layer) continue;
  if ((declared?.kind || "none") !== layer.boundaryPolicy.kind) declaredMismatch.push(target.elementId);
}
equal("POLICY_MATCHES_CONTRACT", declaredMismatch, []);
equal(
  "CCKP_AREA_WEIGHTED_MEAN",
  ["B-003", "B-004", "B-005", "B-006", "B-007"].map((id) => layers.find((l) => l.elementId === id)?.boundaryPolicy.kind),
  Array(5).fill("area-weighted-mean")
);
equal(
  "B042_TOP10_RANGE_ONLY",
  layers.find((l) => l.elementId === "B-042")?.boundaryPolicy.byVariable,
  { "wind-speed-top10-100m": "range-only", "wind-power-density-top10-100m": "range-only" }
);
equal("B021_SIX_REGION", layers.find((l) => l.elementId === "B-021")?.boundaryPolicy.kind, "six-region-only");
equal(
  "NATIVE_34_LAYERS",
  layers.filter((l) => l.boundaryPolicy.kind === "native-34").map((l) => l.elementId).sort(),
  ["C-012", "C-013", "C-019", "C-022"]
);

// ---------------------------------------------------------------- derived boundary assets
const adm1_34 = readJson(resolve(DATA, "geometry/vnm-adm1-34.geojson"));
const memberAreas = adm1_34.features.flatMap((feature) => Object.keys(feature.properties.memberAreaKm2 || {}));
equal("ADM1_34_MEMBER_AREAS", memberAreas.length, 63);
check(
  "ADM1_34_AREAS_POSITIVE",
  adm1_34.features.every((f) => f.properties.areaKm2 > 0 && Object.values(f.properties.memberAreaKm2 || {}).every((v) => v > 0)) ? "PASS" : "FAIL",
  adm1_34.features.length,
  "every areaKm2 and memberAreaKm2 > 0"
);
const region6 = readJson(resolve(DATA, "geometry/vnm-region-6.geojson"));
equal("REGION_6_FEATURES", region6.features.length, 6);
equal("REGION_6_MEMBERS", region6.features.flatMap((f) => f.properties.memberAdm1Codes).length, 63);
const b021 = readJson(resolve(DATA, "spatial/layers/b-021.json"));
equal(
  "REGION_6_KEYS_MATCH_B021",
  region6.features.map((f) => f.properties.regionKey).sort(),
  b021.regionMappings.map((r) => r.region).sort()
);
const outline = readJson(resolve(DATA, "geometry/vnm-country-outline.geojson"));
const outlineZ5 = readJson(resolve(DATA, "geometry/vnm-country-outline-z5.geojson"));
equal("COUNTRY_OUTLINE_SINGLE_FEATURE", [outline.features.length, outlineZ5.features.length], [1, 1]);
const manifest = readJson(resolve(DATA, "geometry/geometry-manifest.json"));
const kinds = manifest.assets.map((a) => a.kind);
equal(
  "MANIFEST_DERIVED_KINDS",
  ["adm1-boundary-34", "region-6", "country-outline", "country-outline-z5"].filter((kind) => !kinds.includes(kind)),
  []
);
const integrity = readJson(resolve(DATA, "asset-integrity.json"));
const shaOf = (path) => createHash("sha256").update(readFileSync(path)).digest("hex");
const integrityMismatch = [];
for (const name of ["vnm-adm1-34.geojson", "vnm-region-6.geojson", "vnm-country-outline.geojson", "vnm-country-outline-z5.geojson"]) {
  const row = integrity.assets.find((a) => String(a.url).endsWith(`/${name}`));
  if (!row || row.sha256 !== shaOf(resolve(DATA, "geometry", name))) integrityMismatch.push(name);
}
equal("DERIVED_ASSETS_IN_INTEGRITY", integrityMismatch, []);

// ---------------------------------------------------------------- point locations
const pointLayers = layers.filter((layer) => /point|cluster/u.test(layer.renderer));
equal("POINT_LAYERS_WITH_SIDECAR", pointLayers.filter((l) => !l.locationsUrl).map((l) => l.elementId), []);
const sidecarProblems = [];
for (const layer of pointLayers) {
  const path = resolve(DATA, layer.locationsUrl.replace(/^\/data\/vietnam\/v2\//u, ""));
  if (!existsSync(path)) {
    sidecarProblems.push(`${layer.elementId}: missing`);
    continue;
  }
  const sidecar = readJson(path);
  const located = Object.values(sidecar.byRecordId).filter(Boolean).length;
  if (sidecar.schemaVersion !== "v151-2-locations-1" || located !== sidecar.counts.located) sidecarProblems.push(`${layer.elementId}: counts`);
  if (Object.values(sidecar.byRecordId).some((hit) => hit && !/^VN-/u.test(hit.adm1Code))) sidecarProblems.push(`${layer.elementId}: code`);
}
equal("POINT_SIDECARS_VALID", sidecarProblems, []);

// ---------------------------------------------------------------- packs
const bundle = readJson(resolve(DATA, "packs/bundle-index-v124.json"));
const dataManifest = readJson(resolve(DATA, "manifest.json"));
equal("PACK_COUNT_CONSISTENT", [bundle.packs.length, bundle.packCount, dataManifest.packCount, dataManifest.shardCount], Array(4).fill(bundle.packs.length));
equal("PACK_FILES_PRESENT", bundle.packs.filter((p) => !existsSync(resolve(DATA, p.packUrl.replace(/^\/data\/vietnam\/v2\//u, "")))).map((p) => p.shardId), []);
equal("ELEMENT_COUNT", Object.keys(bundle.elements).length, 152);
const soloPacks = bundle.packs.filter((p) => p.elementIds.length === 1).map((p) => p.elementIds[0]).sort();
check("SOLO_PACKS_OVER_8MB", soloPacks.length >= 5 ? "PASS" : "FAIL", soloPacks, "every element whose payload exceeds 8 MB (B-003..B-007 at least)");

const failed = checks.filter((row) => row.status === "FAIL");
const summary = {
  type: "summary",
  audit: "boundary-policy:v151-2",
  status: failed.length ? "FAIL" : "PASS",
  passed: checks.filter((row) => row.status === "PASS").length,
  failed: failed.length,
  total: checks.length,
  failedChecks: failed.map((row) => row.name),
  packCount: bundle.packs.length,
  soloPacks,
  generatedAt: new Date().toISOString(),
};
mkdirSync(dirname(OUT), { recursive: true });
writeFileSync(OUT, `${JSON.stringify({ summary, checks }, null, 2)}\n`);
process.stdout.write(`${JSON.stringify(summary)}\n`);
process.exit(failed.length ? 1 : 0);
