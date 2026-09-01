#!/usr/bin/env node

import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import {
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { basename, extname, relative, resolve } from "node:path";
import { performance } from "node:perf_hooks";
import { gzipSync } from "node:zlib";
import { AuditV125, PROJECT_ROOT, readJson } from "./v125/audit-utils.mjs";
import { startStaticBuildServer } from "./v125/browser-runtime.mjs";

const audit = new AuditV125("performance:v128");
const buildRoot = resolve(PROJECT_ROOT, "build");
const publicDataRoot = resolve(PROJECT_ROOT, "public/data");
const reportRoot = resolve(PROJECT_ROOT, "reports/v128");
const baselinePath = resolve(reportRoot, "production-bundle-baseline-v128.json");
const reportPath = resolve(reportRoot, "production-performance-v128.json");
const deploymentReportPath = resolve(reportRoot, "deployment-audit-v128.json");

function gitOutput(args) {
  const result = spawnSync("git", args, {
    cwd: PROJECT_ROOT,
    encoding: "utf8",
    windowsHide: true,
  });
  return result.status === 0 ? String(result.stdout || "").trim() : null;
}

function walk(root) {
  if (!existsSync(root)) return [];
  return readdirSync(root, { withFileTypes: true }).flatMap((entry) => {
    const path = resolve(root, entry.name);
    return entry.isDirectory() ? walk(path) : [path];
  });
}

function fileMetrics(path) {
  const bytes = readFileSync(path);
  return {
    path: relative(PROJECT_ROOT, path).replace(/\\/gu, "/"),
    rawBytes: bytes.length,
    gzipBytes: gzipSync(bytes).length,
    sha256: createHash("sha256").update(bytes).digest("hex"),
  };
}

function sourceText(path) {
  return existsSync(path) ? readFileSync(path, "utf8") : "";
}

const baselineResult = readJson(baselinePath);
const deploymentReportResult = readJson(deploymentReportPath);
const manifestResult = readJson(resolve(buildRoot, "asset-manifest.json"));
const vietnamManifestResult = readJson(
  resolve(publicDataRoot, "vietnam/v2/manifest.json")
);
const baseline = baselineResult.value || {};
const buildManifest = manifestResult.value || {};
const entrypointPaths = (Array.isArray(buildManifest.entrypoints)
  ? buildManifest.entrypoints
  : []
).map((entry) => resolve(buildRoot, String(entry).replace(/^\/+/, "")));
const entrypointMetrics = entrypointPaths.filter(existsSync).map(fileMetrics);
const entryJavascript = entrypointMetrics.filter((entry) => entry.path.endsWith(".js"));
const entryCss = entrypointMetrics.filter((entry) => entry.path.endsWith(".css"));
const entryJavascriptGzipBytes = entryJavascript.reduce(
  (sum, entry) => sum + entry.gzipBytes,
  0
);
const entryCssGzipBytes = entryCss.reduce((sum, entry) => sum + entry.gzipBytes, 0);
const entryTotalGzipBytes = entryJavascriptGzipBytes + entryCssGzipBytes;
const baselineTotalGzipBytes = Number(baseline.entrypoints?.totalGzipBytes || 0);
const regressionPercent = baselineTotalGzipBytes
  ? ((entryTotalGzipBytes - baselineTotalGzipBytes) / baselineTotalGzipBytes) * 100
  : Number.POSITIVE_INFINITY;

const allBuildFiles = walk(buildRoot);
const javascriptMetrics = allBuildFiles
  .filter((path) => extname(path) === ".js")
  .map(fileMetrics)
  .sort((left, right) => right.gzipBytes - left.gzipBytes);
const cssMetrics = allBuildFiles
  .filter((path) => extname(path) === ".css")
  .map(fileMetrics)
  .sort((left, right) => right.gzipBytes - left.gzipBytes);
const sourceMapCount = allBuildFiles.filter((path) => path.endsWith(".map")).length;
const entrypointSet = new Set(entrypointMetrics.map((entry) => entry.path));
const lazyJavascript = javascriptMetrics.filter((entry) => !entrypointSet.has(entry.path));

const appSource = sourceText(resolve(PROJECT_ROOT, "src/App.tsx"));
const mapSource = sourceText(resolve(PROJECT_ROOT, "src/pages/RealMapExplorerPage.tsx"));
const loaderSource = sourceText(
  resolve(PROJECT_ROOT, "src/data/vietnam/vietnamDataLoaderV124.ts")
);
const searchSource = sourceText(
  resolve(PROJECT_ROOT, "src/components/search/GlobalQuickSearchV41.tsx")
);
const publicPlatformSource = sourceText(
  resolve(PROJECT_ROOT, "src/data/publicPlatformV128.ts")
);
const downloadSource = sourceText(resolve(PROJECT_ROOT, "src/pages/DownloadPage.tsx"));
const pagesWorkflow = sourceText(resolve(PROJECT_ROOT, ".github/workflows/pages.yml"));
const mapLazyLoaded =
  /lazy\(\(\)\s*=>\s*import\(["']\.\/pages\/RealMapExplorerPage["']\)\)/u.test(
    appSource
  ) && /maplibre-gl/u.test(mapSource) && lazyJavascript.length > 0;
const selectedShardOnly =
  /const entry = index\.elements\[elementId\]/u.test(loaderSource) &&
  /loadVerifiedPack\(entry\)/u.test(loaderSource) &&
  /packCache\.get\(entry\.packUrl\)/u.test(loaderSource) &&
  !/Promise\.all\(\s*Object\.values\([^)]*elements/u.test(loaderSource);
const searchIndexLazy =
  /if \(!open \|\| items\.length > 0\) return;/u.test(searchSource) &&
  /void loadPublicSearchItemsV128\(\)/u.test(searchSource) &&
  /export async function loadPublicSearchItemsV128/u.test(publicPlatformSource) &&
  /loadSearchIndexForCountrySelectionV122\("VNM"\)/u.test(publicPlatformSource) &&
  !/import\s+[^;]*search-index/iu.test(
    `${searchSource}\n${publicPlatformSource}`
  );
const deploymentSourceMapPolicyConfigured =
  /GENERATE_SOURCEMAP:\s*["']?false/iu.test(pagesWorkflow);
const deploymentArtifactSourceMapCount = Number(
  deploymentReportResult.value?.subpath?.sourceMapCount
);
const deploymentSourceMapsDisabled =
  deploymentSourceMapPolicyConfigured && deploymentArtifactSourceMapCount === 0;
const downloadGenerationYields =
  /async function yieldDownloadWorkV128\(\): Promise<void>/u.test(downloadSource) &&
  /requestAnimationFrame/u.test(downloadSource) &&
  /await yieldDownloadWorkV128\(\)/u.test(downloadSource);

const duplicateGroups = [];
for (const group of [javascriptMetrics, cssMetrics]) {
  const byHash = new Map();
  for (const entry of group) {
    const values = byHash.get(entry.sha256) || [];
    values.push(entry.path);
    byHash.set(entry.sha256, values);
  }
  for (const [sha256, paths] of byHash) {
    if (paths.length > 1) duplicateGroups.push({ sha256, paths });
  }
}

const publicDataAssets = walk(publicDataRoot)
  .map((path) => ({
    path: relative(resolve(PROJECT_ROOT, "public"), path).replace(/\\/gu, "/"),
    bytes: statSync(path).size,
  }))
  .sort((left, right) => right.bytes - left.bytes);

const searchIndexAsset = Array.isArray(
  vietnamManifestResult.value?.assets?.searchIndex
)
  ? vietnamManifestResult.value.assets.searchIndex[0]
  : vietnamManifestResult.value?.assets?.searchIndex;
const timedAssets = [
  String(searchIndexAsset || "").replace(/^\/+/, ""),
  "data/vietnam/v2/geometry/vnm-adm1-63.geojson",
  "data/vietnam/v2/geometry/vnm-transmission-network.geojson",
].filter(Boolean);
const loadMeasurements = [];
let server = null;
let loadError = null;
try {
  server = await startStaticBuildServer(buildRoot);
  for (const path of timedAssets) {
    const startedAt = performance.now();
    const response = await fetch(`${server.url}/${path}`, { cache: "no-store" });
    const bytes = (await response.arrayBuffer()).byteLength;
    loadMeasurements.push({
      path,
      status: response.status,
      contentType: response.headers.get("content-type") || "",
      bytes,
      durationMs: Number((performance.now() - startedAt).toFixed(2)),
    });
  }
} catch (error) {
  loadError = error instanceof Error ? error.message : String(error);
} finally {
  if (server) await server.close();
}

const loadFailures = loadMeasurements.filter(
  (entry) =>
    entry.status !== 200 ||
    entry.bytes <= 0 ||
    /text\/html/iu.test(entry.contentType)
);
const report = {
  schemaVersion: "v128-production-performance-1",
  generatedAt: new Date().toISOString(),
  sourceRevision: gitOutput(["rev-parse", "HEAD"]),
  workingTreeDirtyAtAudit: Boolean(
    gitOutput(["status", "--porcelain", "--untracked-files=normal"])
  ),
  baselineCommit: baseline.baselineCommit || null,
  build: {
    entrypoints: entrypointMetrics,
    entryJavascriptGzipBytes,
    entryCssGzipBytes,
    entryTotalGzipBytes,
    baselineTotalGzipBytes,
    regressionPercent: Number(regressionPercent.toFixed(3)),
    regressionLimitPercent: 10,
    localBuildSourceMapCount: sourceMapCount,
    deploymentSourceMaps: {
      workflowPolicyConfigured: deploymentSourceMapPolicyConfigured,
      artifactCount: Number.isFinite(deploymentArtifactSourceMapCount)
        ? deploymentArtifactSourceMapCount
        : null,
      result: deploymentSourceMapsDisabled ? "disabled" : "not-verified",
    },
    largestLazyJavascript: lazyJavascript[0] || null,
    duplicateAssetGroups: duplicateGroups,
  },
  loading: {
    mapComponentLazy: mapLazyLoaded,
    selectedElementShardOnly: selectedShardOnly,
    searchIndexLazy: searchIndexLazy,
    downloadGenerationYields,
    all152ElementsEagerLoaded: selectedShardOnly ? false : null,
    measurements: loadMeasurements,
    loadError,
  },
  publicData: {
    assetCount: publicDataAssets.length,
    largestAsset: publicDataAssets[0] || null,
    largestAssets: publicDataAssets.slice(0, 10),
  },
};
mkdirSync(reportRoot, { recursive: true });
writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");

audit.check("BASELINE_AVAILABLE", baselineResult.error === null, baselineResult.error, null);
audit.check(
  "PRODUCTION_BUILD_AVAILABLE",
  manifestResult.error === null && entrypointMetrics.length >= 2,
  { error: manifestResult.error, entrypoints: entrypointMetrics.length },
  { error: null, entrypoints: ">=2" }
);
audit.check(
  "INITIAL_BUNDLE_REGRESSION",
  Number.isFinite(regressionPercent) && regressionPercent <= 10,
  Number(regressionPercent.toFixed(3)),
  "<=10%"
);
audit.check("MAP_COMPONENT_LAZY_LOAD", mapLazyLoaded, mapLazyLoaded, true);
audit.check("SELECTED_ELEMENT_SHARD_ONLY", selectedShardOnly, selectedShardOnly, true);
audit.check("SEARCH_INDEX_LAZY_LOAD", searchIndexLazy, searchIndexLazy, true);
audit.check(
  "DOWNLOAD_GENERATION_YIELD",
  downloadGenerationYields,
  downloadGenerationYields,
  true
);
audit.check("DUPLICATE_BUILD_ASSET", duplicateGroups.length === 0, duplicateGroups, []);
audit.check(
  "DEPLOYMENT_SOURCE_MAP_POLICY",
  deploymentSourceMapsDisabled,
  {
    workflowPolicyConfigured: deploymentSourceMapPolicyConfigured,
    artifactCount: Number.isFinite(deploymentArtifactSourceMapCount)
      ? deploymentArtifactSourceMapCount
      : null,
  },
  { workflowPolicyConfigured: true, artifactCount: 0 }
);
audit.check(
  "REFERENCE_ASSET_LOAD",
  loadError === null && loadMeasurements.length === timedAssets.length && loadFailures.length === 0,
  { loadError, measured: loadMeasurements.length, failures: loadFailures },
  { loadError: null, measured: timedAssets.length, failures: [] }
);

audit.finish({
  bundleBaseline: baselineTotalGzipBytes,
  currentBundle: entryTotalGzipBytes,
  bundleRegressionPercent: Number(regressionPercent.toFixed(3)),
  lazyLoadResult:
    mapLazyLoaded &&
    selectedShardOnly &&
    searchIndexLazy &&
    downloadGenerationYields
      ? "PASS"
      : "FAIL",
  largestDataAsset: publicDataAssets[0] || null,
  performanceReport: relative(PROJECT_ROOT, reportPath).replace(/\\/gu, "/"),
});
