#!/usr/bin/env node

import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { gzipSync } from "node:zlib";
import {
  AuditV125,
  PROJECT_ROOT,
  SEMANTIC_ROOT,
  V2_ROOT,
  readJson,
  visualizationContracts,
} from "./v125/audit-utils.mjs";

const audit = new AuditV125("release:v125");
const AUDITS = [
  ["data:v124", "scripts/audit-vietnam-data-v124.mjs"],
  ["map:v124", "scripts/audit-vietnam-map-v124.mjs"],
  ["runtime:v124", "scripts/audit-vietnam-runtime-v124.mjs"],
  ["semantic:v125", "scripts/audit-vietnam-semantic-v125.mjs"],
  ["finder:v125", "scripts/audit-vietnam-finder-v125.mjs"],
  ["map-selector:v125", "scripts/audit-vietnam-map-selector-v125.mjs"],
  ["map-semantic:v125", "scripts/audit-vietnam-map-semantic-v125.mjs"],
  ["navigation:v125", "scripts/audit-vietnam-navigation-v125.mjs"],
  ["visual:v125", "scripts/audit-vietnam-visual-v125.mjs"],
];

function parseJsonLines(text) {
  return String(text || "")
    .split(/\r?\n/u)
    .filter(Boolean)
    .flatMap((line) => {
      try {
        return [JSON.parse(line)];
      } catch {
        return [];
      }
    });
}

function runAudit(label, relativePath) {
  const path = resolve(PROJECT_ROOT, relativePath);
  if (!existsSync(path)) {
    return {
      label,
      relativePath,
      exitCode: null,
      summary: null,
      error: "script missing",
      outputTail: [],
    };
  }
  const result = spawnSync(process.execPath, [path], {
    cwd: PROJECT_ROOT,
    env: process.env,
    encoding: "utf8",
    maxBuffer: 64 * 1024 * 1024,
    timeout: 12 * 60 * 1000,
    windowsHide: true,
  });
  const records = parseJsonLines(result.stdout);
  const summaries = records.filter((record) => record?.type === "summary");
  const summary = summaries[summaries.length - 1] || null;
  const nonJsonTail = String(result.stderr || "")
    .split(/\r?\n/u)
    .filter(Boolean)
    .slice(-20);
  return {
    label,
    relativePath,
    exitCode: result.status,
    signal: result.signal,
    summary,
    error: result.error instanceof Error ? result.error.message : null,
    outputTail: nonJsonTail,
  };
}

const componentResults = AUDITS.map(([label, path]) => runAudit(label, path));
const summaryByLabel = new Map(
  componentResults.map((result) => [result.label, result.summary || {}])
);
for (const result of componentResults) {
  const passed =
    result.exitCode === 0 &&
    result.error === null &&
    result.summary?.status === "PASS" &&
    Number(result.summary?.failed || 0) === 0;
  audit.check(
    `COMPONENT_${result.label.replace(/[^a-z0-9]+/giu, "_").toUpperCase()}`,
    passed,
    {
      exitCode: result.exitCode,
      status: result.summary?.status ?? null,
      passed: result.summary?.passed ?? null,
      failed: result.summary?.failed ?? null,
      total: result.summary?.total ?? null,
      error: result.error,
    },
    { exitCode: 0, status: "PASS", failed: 0 },
    passed
      ? undefined
      : {
          failedChecks: result.summary?.failedChecks || [],
          stderr: result.outputTail,
          signal: result.signal,
        }
  );
}

const mapResult = readJson(resolve(V2_ROOT, "map-index.json"));
const adm1Result = readJson(resolve(V2_ROOT, "geometry/vnm-adm1-63.geojson"));
const contractResult = readJson(
  resolve(SEMANTIC_ROOT, "element-visualization-contracts-v125.json")
);
const integrityResult = readJson(resolve(SEMANTIC_ROOT, "semantic-integrity-v125.json"));
const mapIndex = mapResult.value || {};
const layers = Array.isArray(mapIndex.layers) ? mapIndex.layers : [];
const activeLayers = layers.filter(
  (layer) => layer?.active !== false && layer?.enabled !== false
);
const mapFeatureCount = activeLayers.reduce(
  (sum, layer) => sum + Number(layer.featureCount || 0),
  0
);
const contracts = visualizationContracts(contractResult.value);
const integrity = integrityResult.value || {};
const mapSummary = summaryByLabel.get("map:v124") || {};
const mapSemanticSummary = summaryByLabel.get("map-semantic:v125") || {};
const navigationSummary = summaryByLabel.get("navigation:v125") || {};
const visualSummary = summaryByLabel.get("visual:v125") || {};
const isZero = (value) => typeof value === "number" && value === 0;

audit.check("DATA_CONTRACTS", contracts.length === 152, contracts.length, 152);
audit.check(
  "ACTIVE_MAP_LAYERS",
  activeLayers.length === 12 && Number(mapIndex.activeMapLayerCount) === 12,
  { calculated: activeLayers.length, declared: mapIndex.activeMapLayerCount ?? null },
  { calculated: 12, declared: 12 }
);
audit.check(
  "MAP_FEATURE_COUNT",
  mapFeatureCount === 2900 && Number(mapIndex.mapFeatureCount) === 2900,
  { calculated: mapFeatureCount, declared: mapIndex.mapFeatureCount ?? null },
  { calculated: 2900, declared: 2900 }
);
const adm1FeatureCount = Array.isArray(adm1Result.value?.features)
  ? adm1Result.value.features.length
  : 0;
audit.check("ADM1_FEATURE_COUNT", adm1FeatureCount === 63, adm1FeatureCount, 63);
audit.check(
  "ADM1_JOIN_FAILURES",
  isZero(mapSummary.adm1JoinFailures) &&
    isZero(mapSemanticSummary.adm1JoinFailures),
  {
    spatialAudit: mapSummary.adm1JoinFailures ?? null,
    semanticAudit: mapSemanticSummary.adm1JoinFailures ?? null,
  },
  { spatialAudit: 0, semanticAudit: 0 }
);
audit.check(
  "FAKE_GEOMETRY",
  isZero(mapSummary.fakeGeometryCount) &&
    isZero(mapSemanticSummary.fakeGeometryCount),
  {
    spatialAudit: mapSummary.fakeGeometryCount ?? null,
    semanticAudit: mapSemanticSummary.fakeGeometryCount ?? null,
  },
  { spatialAudit: 0, semanticAudit: 0 }
);
audit.check(
  "ZERO_IMPUTATION",
  isZero(mapSummary.zeroImputationCount) &&
    isZero(mapSemanticSummary.zeroImputationCount) &&
    isZero(integrity.zeroImputationCount),
  {
    spatialAudit: mapSummary.zeroImputationCount ?? null,
    mapSemanticAudit: mapSemanticSummary.zeroImputationCount ?? null,
    semanticIntegrity: integrity.zeroImputationCount ?? null,
  },
  { spatialAudit: 0, mapSemanticAudit: 0, semanticIntegrity: 0 }
);
audit.check(
  "DUPLICATE_VISIBLE_LABELS",
  isZero(integrity.duplicateVisibleLabelCount) &&
    isZero(mapSemanticSummary.duplicateVisibleLabels),
  {
    semanticIntegrity: integrity.duplicateVisibleLabelCount ?? null,
    mapSemanticAudit: mapSemanticSummary.duplicateVisibleLabels ?? null,
  },
  { semanticIntegrity: 0, mapSemanticAudit: 0 }
);
audit.check(
  "MIXED_UNIT_AXES",
  isZero(integrity.mixedUnitAxisCount) &&
    isZero(mapSemanticSummary.mixedUnitAxes),
  {
    semanticIntegrity: integrity.mixedUnitAxisCount ?? null,
    mapSemanticAudit: mapSemanticSummary.mixedUnitAxes ?? null,
  },
  { semanticIntegrity: 0, mapSemanticAudit: 0 }
);
audit.check(
  "BLANK_MAP",
  navigationSummary.blankMap === false,
  navigationSummary.blankMap ?? null,
  false
);
audit.check(
  "UNCAUGHT_RUNTIME_ERROR",
  isZero(navigationSummary.uncaughtRuntimeError) &&
    isZero(visualSummary.uncaughtRuntimeErrorCount),
  {
    navigation: navigationSummary.uncaughtRuntimeError ?? null,
    visual: visualSummary.uncaughtRuntimeErrorCount ?? null,
  },
  { navigation: 0, visual: 0 }
);
audit.check(
  "BROKEN_DOWNLOAD_LINK",
  isZero(navigationSummary.brokenDownloadLink),
  navigationSummary.brokenDownloadLink ?? null,
  0
);
audit.check(
  "BROKEN_DETAIL_LINK",
  isZero(navigationSummary.brokenDetailLink),
  navigationSummary.brokenDetailLink ?? null,
  0
);
audit.check(
  "HTML_RETURNED_FOR_JSON",
  isZero(navigationSummary.htmlReturnedForJson) &&
    isZero(mapSemanticSummary.htmlReturnedForJson),
  {
    navigation: navigationSummary.htmlReturnedForJson ?? null,
    mapSemantic: mapSemanticSummary.htmlReturnedForJson ?? null,
  },
  { navigation: 0, mapSemantic: 0 }
);

const buildIndexPath = resolve(PROJECT_ROOT, "build/index.html");
const buildManifestPath = resolve(PROJECT_ROOT, "build/asset-manifest.json");
let buildHasMainAssets = false;
if (existsSync(buildIndexPath)) {
  const buildIndex = readFileSync(buildIndexPath, "utf8");
  buildHasMainAssets =
    /static\/js\/(?:main\.)?[^"']+\.js/u.test(buildIndex) &&
    /static\/css\/(?:main\.)?[^"']+\.css/u.test(buildIndex);
}
audit.check(
  "PRODUCTION_BUILD_RUNTIME_ASSET",
  buildHasMainAssets,
  { indexExists: existsSync(buildIndexPath), mainAssets: buildHasMainAssets },
  { indexExists: true, mainAssets: true }
);

const buildManifestResult = readJson(buildManifestPath);
const buildManifest = buildManifestResult.value || {};
const mainJsUrl = buildManifest.files?.["main.js"] || null;
const mainJsPath = mainJsUrl
  ? resolve(PROJECT_ROOT, "build", String(mainJsUrl).replace(/^\//u, ""))
  : null;
const mainMapPath = mainJsPath ? `${mainJsPath}.map` : null;
const mainJsBytes = mainJsPath && existsSync(mainJsPath)
  ? readFileSync(mainJsPath)
  : null;
const mainGzipBytes = mainJsBytes ? gzipSync(mainJsBytes).byteLength : null;
const mainSourceMap = mainMapPath ? readJson(mainMapPath).value : null;
const mainMapLibreSourceCount = Array.isArray(mainSourceMap?.sources)
  ? mainSourceMap.sources.filter((source) => /maplibre-gl/u.test(String(source))).length
  : null;
const asyncMapLibreChunks = Object.values(buildManifest.files || {}).filter(
  (url) => /static\/js\/.+\.chunk\.js\.map$/u.test(String(url))
).filter((url) => {
  const path = resolve(PROJECT_ROOT, "build", String(url).replace(/^\//u, ""));
  const sourceMap = readJson(path).value;
  return Array.isArray(sourceMap?.sources) &&
    sourceMap.sources.some((source) => /maplibre-gl/u.test(String(source)));
});
const bundleBudgetBytes = 512 * 1024;
audit.check(
  "INITIAL_BUNDLE_MAP_CODE_SPLIT",
  buildManifestResult.error === null &&
    typeof mainGzipBytes === "number" &&
    mainGzipBytes < bundleBudgetBytes &&
    mainMapLibreSourceCount === 0 &&
    asyncMapLibreChunks.length >= 1,
  {
    mainGzipBytes,
    budgetBytes: bundleBudgetBytes,
    mainMapLibreSourceCount,
    asyncMapLibreChunkCount: asyncMapLibreChunks.length,
  },
  {
    mainGzipBytes: `< ${bundleBudgetBytes}`,
    mainMapLibreSourceCount: 0,
    asyncMapLibreChunkCount: ">= 1",
  },
  buildManifestResult.error || undefined
);

const componentFailureCount = componentResults.filter(
  (result) => result.exitCode !== 0 || result.summary?.status !== "PASS"
).length;
audit.finish({
  releaseGate: componentFailureCount === 0 ? "PASS" : "FAIL",
  componentAuditCount: componentResults.length,
  componentFailureCount,
  dataContracts: contracts.length,
  activeMapLayers: activeLayers.length,
  mapFeatureCount,
  adm1FeatureCount,
  adm1JoinFailures: mapSummary.adm1JoinFailures ?? null,
  fakeGeometry: mapSummary.fakeGeometryCount ?? null,
  zeroImputation: integrity.zeroImputationCount ?? null,
  duplicateVisibleLabels: integrity.duplicateVisibleLabelCount ?? null,
  mixedUnitAxes: integrity.mixedUnitAxisCount ?? null,
  blankMap: navigationSummary.blankMap ?? null,
  uncaughtRuntimeError: navigationSummary.uncaughtRuntimeError ?? null,
  brokenDownloadLink: navigationSummary.brokenDownloadLink ?? null,
  brokenDetailLink: navigationSummary.brokenDetailLink ?? null,
  htmlReturnedForJson: navigationSummary.htmlReturnedForJson ?? null,
  bundleAnalysis: {
    baselineMainGzipBytes: 609715,
    mainGzipBytes,
    budgetBytes: bundleBudgetBytes,
    mainMapLibreSourceCount,
    asyncMapLibreChunkCount: asyncMapLibreChunks.length,
  },
});
