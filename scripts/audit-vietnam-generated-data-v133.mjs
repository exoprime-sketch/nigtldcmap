#!/usr/bin/env node

import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import {
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { dirname, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = resolve(SCRIPT_DIR, "..");
const PUBLIC_ROOT = resolve(PROJECT_ROOT, "public");
const V2_ROOT = resolve(PUBLIC_ROOT, "data/vietnam/v2");
const REPORT_PATH = resolve(
  PROJECT_ROOT,
  "reports/v133/generated-data-audit-v133.json"
);
const REQUIRED_FILES = [
  "manifest.json",
  "catalog.json",
  "framework-coverage.json",
  "quality-report.json",
  "publication-decisions.json",
  "rights-matrix.json",
  "asset-integrity.json",
  "map-index.json",
  "geometry/geometry-manifest.json",
  "semantic/indicator-semantics-v125.json",
  "semantic/element-visualization-contracts-v125.json",
  "semantic/semantic-integrity-v125.json",
];

const checks = [];
function check(name, passed, actual, expected, details = undefined) {
  const row = {
    name,
    status: passed ? "PASS" : "FAIL",
    actual,
    expected,
  };
  if (details !== undefined) row.details = details;
  checks.push(row);
}

function walkFiles(root) {
  if (!existsSync(root)) return [];
  const files = [];
  const visit = (directory) => {
    for (const entry of readdirSync(directory, { withFileTypes: true })) {
      const path = resolve(directory, entry.name);
      if (entry.isDirectory()) visit(path);
      else if (entry.isFile()) files.push(path);
    }
  };
  visit(root);
  return files;
}

function readJson(path) {
  return JSON.parse(readFileSync(path, "utf8"));
}

function elements(document) {
  if (Array.isArray(document)) return document;
  if (Array.isArray(document?.elements)) return document.elements;
  if (document?.elements && typeof document.elements === "object") {
    return Object.values(document.elements);
  }
  return [];
}

function sha256(path) {
  return createHash("sha256").update(readFileSync(path)).digest("hex");
}

function publicUrl(path) {
  return `/${relative(PUBLIC_ROOT, path).split(sep).join("/")}`;
}

function resolvePublicUrl(value) {
  if (typeof value !== "string" || !value.startsWith("/data/")) return null;
  const clean = value.split(/[?#]/u, 1)[0];
  const path = resolve(PUBLIC_ROOT, `.${clean}`);
  if (!path.startsWith(PUBLIC_ROOT)) return null;
  return path;
}

function collectPublicAssetUrls(value, output) {
  if (typeof value === "string") {
    if (value.startsWith("/data/")) output.add(value.split(/[?#]/u, 1)[0]);
    return;
  }
  if (!value || typeof value !== "object") return;
  if (Array.isArray(value)) {
    for (const item of value) collectPublicAssetUrls(item, output);
    return;
  }
  for (const child of Object.values(value)) collectPublicAssetUrls(child, output);
}

function gitOutput(args) {
  try {
    return execFileSync("git", args, {
      cwd: PROJECT_ROOT,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim();
  } catch {
    return "";
  }
}

const missingRequired = REQUIRED_FILES.filter(
  (path) => !existsSync(resolve(V2_ROOT, path))
);
check(
  "COMMITTED_REQUIRED_ASSETS",
  missingRequired.length === 0,
  REQUIRED_FILES.length - missingRequired.length,
  REQUIRED_FILES.length,
  { missing: missingRequired }
);

const jsonFiles = walkFiles(V2_ROOT).filter((path) => path.endsWith(".json"));
const parsed = new Map();
const malformed = [];
for (const path of jsonFiles) {
  try {
    parsed.set(path, readJson(path));
  } catch (error) {
    malformed.push({
      path: relative(PROJECT_ROOT, path).split(sep).join("/"),
      error: error instanceof Error ? error.message : String(error),
    });
  }
}
check("MALFORMED_JSON_COUNT", malformed.length === 0, malformed.length, 0, malformed);

const manifest = parsed.get(resolve(V2_ROOT, "manifest.json"));
const catalog = parsed.get(resolve(V2_ROOT, "catalog.json"));
const coverage = parsed.get(resolve(V2_ROOT, "framework-coverage.json"));
const quality = parsed.get(resolve(V2_ROOT, "quality-report.json"));
const mapIndex = parsed.get(resolve(V2_ROOT, "map-index.json"));
const semanticIntegrity = parsed.get(
  resolve(V2_ROOT, "semantic/semantic-integrity-v125.json")
);
const contracts = parsed.get(
  resolve(V2_ROOT, "semantic/element-visualization-contracts-v125.json")
);

const catalogElements = elements(catalog);
const coverageElements = elements(coverage);
const frameworkCounts = {
  manifest: manifest?.frameworkElements ?? null,
  catalog: catalogElements.length,
  coverage: coverageElements.length,
};
check(
  "FRAMEWORK_ELEMENTS",
  Object.values(frameworkCounts).every((value) => value === 152),
  frameworkCounts,
  152
);

const accountedCounts = {
  manifest: manifest?.accountedElements ?? null,
  coverage: coverage?.accountedElementCount ?? null,
};
const unexplainedCounts = {
  manifest: manifest?.unexplainedElements ?? null,
  coverage: coverage?.unexplainedElementCount ?? null,
};
check(
  "ACCOUNTED_ELEMENTS",
  Object.values(accountedCounts).every((value) => value === 152),
  accountedCounts,
  152
);
check(
  "UNEXPLAINED_ELEMENTS",
  Object.values(unexplainedCounts).every((value) => value === 0),
  unexplainedCounts,
  0
);

const manifestBalance = manifest?.rowBalance;
const qualityBalance = quality?.summary?.rowBalance;
const publicPopulatedRows =
  Number(quality?.summary?.observationPopulatedRowCount || 0) +
  Number(quality?.summary?.entityPopulatedRowCount || 0);
const rowBalancePass =
  quality?.summary?.rowBalancePass === true &&
  manifestBalance?.matches === true &&
  qualityBalance?.matches === true &&
  manifestBalance?.sourceOriginalRows === manifestBalance?.processedRows &&
  qualityBalance?.sourceOriginalRows === qualityBalance?.processedRows &&
  JSON.stringify(manifestBalance) === JSON.stringify(qualityBalance) &&
  publicPopulatedRows === quality?.summary?.publicPopulatedRowCount;
const catalogRowBalance = catalogElements.reduce(
  (sum, element) => {
    const rows = element?.rowAccounting || {};
    sum.metadataRows += Number(rows.metadataRows || 0);
    sum.nonstandardRows += Number(rows.nonstandardRows || 0);
    sum.observationRows += Number(rows.normalizedObservationRows || 0);
    sum.entityRows += Number(rows.normalizedEntityRows || 0);
    sum.publicPopulatedRows += Number(rows.publicPopulatedRows || 0);
    return sum;
  },
  {
    metadataRows: 0,
    nonstandardRows: 0,
    observationRows: 0,
    entityRows: 0,
    publicPopulatedRows: 0,
  }
);
const catalogProcessedRows =
  catalogRowBalance.metadataRows +
  catalogRowBalance.nonstandardRows +
  catalogRowBalance.observationRows +
  catalogRowBalance.entityRows;
check(
  "ROW_BALANCE",
  rowBalancePass &&
    catalogProcessedRows === manifestBalance?.processedRows &&
    catalogRowBalance.publicPopulatedRows ===
      quality?.summary?.publicPopulatedRowCount,
  {
    sourceRows: manifestBalance?.sourceOriginalRows ?? null,
    processedRows: manifestBalance?.processedRows ?? null,
    publicPopulatedRows,
    catalogProcessedRows,
    catalogPublicPopulatedRows: catalogRowBalance.publicPopulatedRows,
    catalogRowBreakdown: catalogRowBalance,
  },
  {
    matches: true,
    catalogProcessedRows: manifestBalance?.processedRows ?? null,
    catalogPublicPopulatedRows:
      quality?.summary?.publicPopulatedRowCount ?? null,
  }
);

const integrity = parsed.get(resolve(V2_ROOT, "asset-integrity.json"));
const integrityAssets = Array.isArray(integrity?.assets) ? integrity.assets : [];
const expectedPaths = walkFiles(V2_ROOT)
  .filter((path) => path !== resolve(V2_ROOT, "asset-integrity.json"))
  .concat(resolve(PUBLIC_ROOT, "data/world-countries.geojson"));
const expectedUrls = new Set(expectedPaths.map(publicUrl));
const integrityByUrl = new Map();
const duplicateIntegrityUrls = [];
for (const asset of integrityAssets) {
  if (integrityByUrl.has(asset?.url)) duplicateIntegrityUrls.push(asset?.url);
  integrityByUrl.set(asset?.url, asset);
}
const missingIntegrityUrls = [...expectedUrls]
  .filter((url) => !integrityByUrl.has(url))
  .sort((a, b) => a.localeCompare(b, "en"));
const unexpectedIntegrityUrls = [...integrityByUrl.keys()]
  .filter((url) => !expectedUrls.has(url))
  .sort((a, b) => a.localeCompare(b, "en"));
check(
  "ASSET_INTEGRITY_COVERAGE",
  integrity?.assetCount === expectedUrls.size &&
    integrityAssets.length === expectedUrls.size &&
    missingIntegrityUrls.length === 0 &&
    unexpectedIntegrityUrls.length === 0 &&
    duplicateIntegrityUrls.length === 0,
  {
    declared: integrity?.assetCount ?? 0,
    recorded: integrityAssets.length,
    expected: expectedUrls.size,
    missing: missingIntegrityUrls.length,
    unexpected: unexpectedIntegrityUrls.length,
    duplicate: duplicateIntegrityUrls.length,
  },
  { missing: 0, unexpected: 0, duplicate: 0 }
);

const assetHashFailures = [];
for (const asset of integrityAssets) {
  const path = resolvePublicUrl(asset?.url);
  if (!path || !existsSync(path) || !statSync(path).isFile()) {
    assetHashFailures.push({ url: asset?.url, reason: "missing" });
    continue;
  }
  const actualBytes = statSync(path).size;
  const actualHash = sha256(path);
  if (asset.bytes !== actualBytes || asset.sha256 !== actualHash) {
    assetHashFailures.push({
      url: asset.url,
      reason: "mismatch",
      expectedBytes: asset.bytes,
      actualBytes,
      expectedSha256: asset.sha256,
      actualSha256: actualHash,
    });
  }
}
check(
  "ASSET_HASH_FAILURE_COUNT",
  assetHashFailures.length === 0,
  assetHashFailures.length,
  0,
  assetHashFailures
);

const referencedUrls = new Set();
for (const document of parsed.values()) collectPublicAssetUrls(document, referencedUrls);
const brokenAssetUrls = [...referencedUrls]
  .filter((url) => {
    const path = resolvePublicUrl(url);
    return !path || !existsSync(path) || !statSync(path).isFile();
  })
  .sort((a, b) => a.localeCompare(b, "en"));
check(
  "BROKEN_ASSET_COUNT",
  referencedUrls.size > 0 && brokenAssetUrls.length === 0,
  brokenAssetUrls.length,
  0,
  { checked: referencedUrls.size, broken: brokenAssetUrls }
);

const downloadAssets = catalogElements.flatMap((element) =>
  Array.isArray(element?.downloadAssets)
    ? element.downloadAssets.map((asset) => ({ elementId: element.elementId, ...asset }))
    : []
);
const invalidDownloads = downloadAssets.filter((asset) => {
  const path = resolvePublicUrl(asset.url);
  return (
    !path ||
    !existsSync(path) ||
    !statSync(path).isFile() ||
    statSync(path).size === 0 ||
    !Number.isFinite(Number(asset.recordCount)) ||
    Number(asset.recordCount) <= 0
  );
});
check(
  "DOWNLOAD_INTEGRITY",
  downloadAssets.length > 0 && invalidDownloads.length === 0,
  { checked: downloadAssets.length, invalid: invalidDownloads.length },
  { checked: "> 0", invalid: 0 },
  invalidDownloads
);

const jsonDownloadAssets = downloadAssets.filter(
  (asset) =>
    String(asset.format || "").toUpperCase() === "JSON" ||
    String(asset.url || "").toLowerCase().endsWith(".json")
);
const downloadRowFailures = [];
for (const asset of jsonDownloadAssets) {
  const path = resolvePublicUrl(asset.url);
  if (!path || !existsSync(path)) {
    downloadRowFailures.push({
      elementId: asset.elementId,
      url: asset.url,
      reason: "missing",
    });
    continue;
  }
  try {
    const payload = JSON.parse(readFileSync(path, "utf8"));
    const observationRows = Array.isArray(payload?.observations)
      ? payload.observations.length
      : 0;
    const entityRows = Array.isArray(payload?.entities)
      ? payload.entities.length
      : 0;
    const actualRows = observationRows + entityRows;
    const declaredRows = Number(asset.recordCount);
    if (actualRows !== declaredRows) {
      downloadRowFailures.push({
        elementId: asset.elementId,
        url: asset.url,
        reason: "record-count-mismatch",
        observationRows,
        entityRows,
        actualRows,
        declaredRows,
      });
    }
  } catch (error) {
    downloadRowFailures.push({
      elementId: asset.elementId,
      url: asset.url,
      reason: "malformed-json",
      message: error instanceof Error ? error.message : String(error),
    });
  }
}
check(
  "DOWNLOAD_ROW_RECONCILIATION",
  jsonDownloadAssets.length > 0 && downloadRowFailures.length === 0,
  { checked: jsonDownloadAssets.length, failed: downloadRowFailures.length },
  { checked: "> 0", failed: 0 },
  downloadRowFailures
);

const mapLayers = Array.isArray(mapIndex?.layers) ? mapIndex.layers : [];
const mapFeatureCount = mapLayers.reduce(
  (sum, layer) => sum + Number(layer?.featureCount || 0),
  0
);
check(
  "MAP_INTEGRITY",
  mapIndex?.activeMapLayerCount === 12 &&
    mapLayers.length === 12 &&
    mapIndex?.mapFeatureCount === 2900 &&
    mapFeatureCount === 2900 &&
    mapLayers.every(
      (layer) => layer?.active === true && Number(layer?.fakeGeometryCount || 0) === 0
    ),
  {
    declaredLayers: mapIndex?.activeMapLayerCount ?? null,
    layers: mapLayers.length,
    declaredFeatures: mapIndex?.mapFeatureCount ?? null,
    features: mapFeatureCount,
  },
  { layers: 12, features: 2900, fakeGeometry: 0 }
);

const semanticElementFiles = walkFiles(resolve(V2_ROOT, "semantic/elements")).filter(
  (path) => path.endsWith(".json")
);
check(
  "SEMANTIC_ASSET_INTEGRITY",
  semanticIntegrity?.contractCount === 152 &&
    contracts?.elementCount === 152 &&
    semanticElementFiles.length === 152,
  {
    integrityContracts: semanticIntegrity?.contractCount ?? null,
    contracts: contracts?.elementCount ?? null,
    elementAssets: semanticElementFiles.length,
  },
  152
);

const trackedSourceFiles = gitOutput(["ls-files", "--", "_source"])
  .split(/\r?\n/u)
  .filter(Boolean);
check(
  "SOURCE_ZIP_TRACKED",
  trackedSourceFiles.length === 0,
  trackedSourceFiles.length > 0,
  false,
  trackedSourceFiles
);
const generatedAuditSource = readFileSync(fileURLToPath(import.meta.url), "utf8");
const sourceFilesystemDependencyCount = [
  new RegExp(["VIETNAM", "V124", "SOURCE", "ZIP"].join("_"), "u"),
  new RegExp(["vietnam", "-data", "\\(4\\)", "\\.zip"].join(""), "u"),
].filter((pattern) => pattern.test(generatedAuditSource)).length;
check(
  "SOURCE_ZIP_REQUIRED_IN_CI",
  sourceFilesystemDependencyCount === 0,
  sourceFilesystemDependencyCount > 0,
  false,
  { sourceFilesystemDependencyCount }
);

const failed = checks.filter((row) => row.status === "FAIL");
const report = {
  schemaVersion: "v133",
  audit: "committed-generated-data",
  sourceZipRequired: false,
  checks,
  summary: {
    status: failed.length === 0 ? "PASS" : "FAIL",
    passed: checks.length - failed.length,
    failed: failed.length,
    total: checks.length,
    failedChecks: failed.map((row) => row.name),
  },
};
mkdirSync(dirname(REPORT_PATH), { recursive: true });
writeFileSync(REPORT_PATH, `${JSON.stringify(report, null, 2)}\n`, "utf8");
for (const row of checks) console.log(JSON.stringify({ type: "check", ...row }));
console.log(JSON.stringify({ type: "summary", ...report.summary }));
process.exitCode = failed.length === 0 ? 0 : 1;
