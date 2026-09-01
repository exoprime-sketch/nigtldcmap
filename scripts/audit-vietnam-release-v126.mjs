#!/usr/bin/env node

import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  AuditV125,
  PROJECT_ROOT,
  SEMANTIC_ROOT,
  V2_ROOT,
  readJson,
  visualizationContracts,
} from "./v125/audit-utils.mjs";

const audit = new AuditV125("release:v126");
const COMPONENT_AUDITS = [
  ["data:v124", "scripts/audit-vietnam-data-v124.mjs"],
  ["map:v124", "scripts/audit-vietnam-map-v124.mjs"],
  ["runtime:v124", "scripts/audit-vietnam-runtime-v124.mjs"],
  ["semantic:v125", "scripts/audit-vietnam-semantic-v125.mjs"],
  ["finder:v125", "scripts/audit-vietnam-finder-v125.mjs"],
  ["map-selector:v125", "scripts/audit-vietnam-map-selector-v125.mjs"],
  ["map-semantic:v125", "scripts/audit-vietnam-map-semantic-v125.mjs"],
  ["navigation:v125", "scripts/audit-vietnam-navigation-v125.mjs"],
  ["visual:v125", "scripts/audit-vietnam-visual-v125.mjs"],
  ["public-content:v126", "scripts/audit-vietnam-public-content-v126.mjs"],
  ["finder-ux:v126", "scripts/audit-vietnam-finder-ux-v126.mjs"],
  ["public-downloads:v126", "scripts/audit-vietnam-public-downloads-v126.mjs"],
  ["map-ux:v126", "scripts/audit-vietnam-map-ux-v126.mjs"],
  ["map-public-content:v126", "scripts/audit-vietnam-map-public-content-v126.mjs"],
  ["cross-navigation:v126", "scripts/audit-vietnam-cross-navigation-v126.mjs"],
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
      stderr: [],
    };
  }
  const result = spawnSync(process.execPath, [path], {
    cwd: PROJECT_ROOT,
    env: process.env,
    encoding: "utf8",
    maxBuffer: 96 * 1024 * 1024,
    timeout: 15 * 60 * 1000,
    windowsHide: true,
  });
  const summaries = parseJsonLines(result.stdout).filter(
    (record) => record?.type === "summary"
  );
  return {
    label,
    relativePath,
    exitCode: result.status,
    signal: result.signal,
    summary: summaries[summaries.length - 1] || null,
    error: result.error instanceof Error ? result.error.message : null,
    stderr: String(result.stderr || "")
      .split(/\r?\n/u)
      .filter(Boolean)
      .slice(-20),
  };
}

const componentResults = COMPONENT_AUDITS.map(([label, path]) => runAudit(label, path));
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
          stderr: result.stderr,
          signal: result.signal,
        }
  );
}

const mapResult = readJson(resolve(V2_ROOT, "map-index.json"));
const adm1Result = readJson(resolve(V2_ROOT, "geometry/vnm-adm1-63.geojson"));
const contractsResult = readJson(
  resolve(SEMANTIC_ROOT, "element-visualization-contracts-v125.json")
);
const integrityResult = readJson(resolve(SEMANTIC_ROOT, "semantic-integrity-v125.json"));
const contracts = visualizationContracts(contractsResult.value);
const layers = Array.isArray(mapResult.value?.layers) ? mapResult.value.layers : [];
const activeLayers = layers.filter(
  (layer) => layer?.active !== false && layer?.enabled !== false
);
const mapFeatureCount = activeLayers.reduce(
  (sum, layer) => sum + Number(layer?.featureCount || 0),
  0
);
const adm1FeatureCount = Array.isArray(adm1Result.value?.features)
  ? adm1Result.value.features.length
  : 0;

const mapSummary = summaryByLabel.get("map:v124") || {};
const mapSemanticSummary = summaryByLabel.get("map-semantic:v125") || {};
const publicContentSummary = summaryByLabel.get("public-content:v126") || {};
const publicDownloadSummary = summaryByLabel.get("public-downloads:v126") || {};
const mapUxSummary = summaryByLabel.get("map-ux:v126") || {};
const mapPublicSummary = summaryByLabel.get("map-public-content:v126") || {};
const crossSummary = summaryByLabel.get("cross-navigation:v126") || {};
const integrity = integrityResult.value || {};
const isZero = (value) => typeof value === "number" && value === 0;
const sumNumeric = (values) =>
  values.every((value) => typeof value === "number")
    ? values.reduce((sum, value) => sum + value, 0)
    : null;
const adm1JoinFailureCount = sumNumeric([
  mapSummary.adm1JoinFailures,
  mapSemanticSummary.adm1JoinFailures,
]);
const fakeGeometryCount = sumNumeric([
  mapSummary.fakeGeometryCount,
  mapSemanticSummary.fakeGeometryCount,
]);
const zeroImputationCount = sumNumeric([
  mapSummary.zeroImputationCount,
  mapSemanticSummary.zeroImputationCount,
  integrity.zeroImputationCount,
]);

audit.check("DATA_CONTRACTS", contracts.length === 152, contracts.length, 152);
audit.check(
  "ACTIVE_MAP_LAYERS",
  activeLayers.length === 12 && Number(mapResult.value?.activeMapLayerCount) === 12,
  { calculated: activeLayers.length, declared: mapResult.value?.activeMapLayerCount ?? null },
  { calculated: 12, declared: 12 }
);
audit.check(
  "MAP_FEATURE_COUNT",
  mapFeatureCount === 2900 && Number(mapResult.value?.mapFeatureCount) === 2900,
  { calculated: mapFeatureCount, declared: mapResult.value?.mapFeatureCount ?? null },
  { calculated: 2900, declared: 2900 }
);
audit.check("ADM1_FEATURE_COUNT", adm1FeatureCount === 63, adm1FeatureCount, 63);
audit.check(
  "ADM1_JOIN_FAILURES",
  adm1JoinFailureCount === 0,
  { map: mapSummary.adm1JoinFailures ?? null, semantic: mapSemanticSummary.adm1JoinFailures ?? null },
  { map: 0, semantic: 0 }
);
audit.check(
  "FAKE_GEOMETRY",
  fakeGeometryCount === 0,
  { map: mapSummary.fakeGeometryCount ?? null, semantic: mapSemanticSummary.fakeGeometryCount ?? null },
  { map: 0, semantic: 0 }
);
audit.check(
  "ZERO_IMPUTATION",
  zeroImputationCount === 0,
  {
    map: mapSummary.zeroImputationCount ?? null,
    mapSemantic: mapSemanticSummary.zeroImputationCount ?? null,
    semanticIntegrity: integrity.zeroImputationCount ?? null,
  },
  { map: 0, mapSemantic: 0, semanticIntegrity: 0 }
);

const publicTokenCount = [
  publicContentSummary.publicDomForbiddenTokenCount,
  publicContentSummary.publicSourcePanelForbiddenTokenCount,
  publicContentSummary.internalProvenanceDomCount,
  publicContentSummary.genericDeveloperCopyCount,
  publicContentSummary.analysisBodyImplementationTermCount,
  mapPublicSummary.publicMapDomForbiddenTokenCount,
  mapPublicSummary.misleadingUnservedWordingCount,
  mapPublicSummary.englishAccuracyPrimaryUiCount,
].reduce((sum, value) => sum + (typeof value === "number" ? value : Number.NaN), 0);
const publicDownloadTechnicalFieldCount = sumNumeric([
  publicDownloadSummary.publicDownloadTechnicalFieldCount,
  crossSummary.publicDownloadTechnicalFieldCount,
]);
audit.check("PUBLIC_FORBIDDEN_TOKENS", publicTokenCount === 0, publicTokenCount, 0);
audit.check(
  "PUBLIC_DOWNLOAD_TECHNICAL_FIELDS",
  isZero(publicDownloadSummary.publicDownloadTechnicalFieldCount) &&
    isZero(crossSummary.publicDownloadTechnicalFieldCount) &&
    publicDownloadSummary.rowReconciliation === "PASS" &&
    crossSummary.publicDownloadRowReconciliation === "PASS" &&
    Number(publicDownloadSummary.safeProjectionElements || 0) > 0,
  {
    technicalFields: publicDownloadSummary.publicDownloadTechnicalFieldCount ?? null,
    runtimeTechnicalFields: crossSummary.publicDownloadTechnicalFieldCount ?? null,
    rowReconciliation: publicDownloadSummary.rowReconciliation ?? null,
    runtimeRowReconciliation: crossSummary.publicDownloadRowReconciliation ?? null,
    safeProjectionElements: publicDownloadSummary.safeProjectionElements ?? null,
  },
  {
    technicalFields: 0,
    runtimeTechnicalFields: 0,
    rowReconciliation: "PASS",
    runtimeRowReconciliation: "PASS",
    safeProjectionElements: "> 0",
  }
);
audit.check("BLANK_MAP", mapUxSummary.blankMap === false, mapUxSummary.blankMap ?? null, false);

const runtimeErrorValues = [
  mapUxSummary.uncaughtRuntimeError,
  mapPublicSummary.uncaughtRuntimeError,
  crossSummary.uncaughtRuntimeError,
];
const uncaughtRuntimeErrorCount = sumNumeric(runtimeErrorValues);
audit.check(
  "UNCAUGHT_RUNTIME_ERROR",
  uncaughtRuntimeErrorCount === 0,
  runtimeErrorValues,
  [0, 0, 0]
);

const brokenDownloadLink =
  isZero(crossSummary.brokenDownloadLink) &&
  publicDownloadSummary.status === "PASS" &&
  isZero(publicDownloadSummary.exposedLegacyStaticDownloadCount)
    ? 0
    : crossSummary.brokenDownloadLink ?? null;
audit.check(
  "BROKEN_DOWNLOAD_LINK",
  brokenDownloadLink === 0,
  {
    runtime: crossSummary.brokenDownloadLink ?? null,
    exposedLegacy: publicDownloadSummary.exposedLegacyStaticDownloadCount ?? null,
  },
  { runtime: 0, exposedLegacy: 0 }
);
audit.check(
  "BROKEN_DETAIL_LINK",
  isZero(crossSummary.brokenDetailLink),
  crossSummary.brokenDetailLink ?? null,
  0
);
const htmlReturnedForJson = sumNumeric([
  crossSummary.htmlReturnedForJson,
  mapSemanticSummary.htmlReturnedForJson,
]);
audit.check(
  "HTML_RETURNED_FOR_JSON",
  htmlReturnedForJson === 0,
  {
    crossNavigation: crossSummary.htmlReturnedForJson ?? null,
    mapSemantic: mapSemanticSummary.htmlReturnedForJson ?? null,
  },
  { crossNavigation: 0, mapSemantic: 0 }
);
audit.check(
  "CROSS_NAVIGATION",
  crossSummary.crossNavigation === "PASS" && crossSummary.urlStateRestoration === "PASS",
  { crossNavigation: crossSummary.crossNavigation ?? null, urlStateRestoration: crossSummary.urlStateRestoration ?? null },
  { crossNavigation: "PASS", urlStateRestoration: "PASS" }
);
audit.check(
  "PUBLIC_MAP_INTERACTION_GATES",
  isZero(mapUxSummary.primaryLayerIdentityFailures) &&
    isZero(mapUxSummary.responsiveLayoutFailures) &&
    mapUxSummary.a023ClusterZoomObserved === true &&
    mapUxSummary.a023PointSelectionSurface === "maplibre-canvas" &&
    mapUxSummary.a023MissingCapacityFalseZero === true &&
    mapUxSummary.adm1SelectionOutline === true &&
    Array.isArray(mapPublicSummary.selectedFeatureKinds) &&
    ["adm1", "line", "point"].every((kind) =>
      mapPublicSummary.selectedFeatureKinds.includes(kind)
    ) &&
    mapPublicSummary.adm1PublicAttribution === true &&
    crossSummary.a024NonSpatialSelectorBlocked === true,
  {
    primaryIdentityFailures: mapUxSummary.primaryLayerIdentityFailures ?? null,
    responsiveLayoutFailures: mapUxSummary.responsiveLayoutFailures ?? null,
    a023ClusterZoomObserved: mapUxSummary.a023ClusterZoomObserved ?? null,
    a023PointSelectionSurface: mapUxSummary.a023PointSelectionSurface ?? null,
    a023MissingCapacityFalseZero:
      mapUxSummary.a023MissingCapacityFalseZero ?? null,
    adm1Outline63: mapUxSummary.adm1SelectionOutline ?? null,
    selectedFeatureKinds: mapPublicSummary.selectedFeatureKinds ?? null,
    adm1PublicAttribution: mapPublicSummary.adm1PublicAttribution ?? null,
    a024NonSpatialSelectorBlocked:
      crossSummary.a024NonSpatialSelectorBlocked ?? null,
  },
  {
    primaryIdentityFailures: 0,
    responsiveLayoutFailures: 0,
    a023ClusterZoomObserved: true,
    a023PointSelectionSurface: "maplibre-canvas",
    a023MissingCapacityFalseZero: true,
    adm1Outline63: true,
    selectedFeatureKinds: ["adm1", "line", "point"],
    adm1PublicAttribution: true,
    a024NonSpatialSelectorBlocked: true,
  }
);

const buildIndexPath = resolve(PROJECT_ROOT, "build/index.html");
let buildAssetsPresent = false;
if (existsSync(buildIndexPath)) {
  const index = readFileSync(buildIndexPath, "utf8");
  buildAssetsPresent =
    /static\/js\/(?:main\.)?[^"']+\.js/u.test(index) &&
    /static\/css\/(?:main\.)?[^"']+\.css/u.test(index);
}
audit.check(
  "PRODUCTION_BUILD_RUNTIME_ASSET",
  buildAssetsPresent,
  { indexExists: existsSync(buildIndexPath), mainAssets: buildAssetsPresent },
  { indexExists: true, mainAssets: true }
);

const componentFailureCount = componentResults.filter(
  (result) =>
    result.exitCode !== 0 ||
    result.error !== null ||
    result.summary?.status !== "PASS" ||
    Number(result.summary?.failed || 0) !== 0
).length;
const releaseCheckFailureCount = audit.checks.filter(
  (check) => check.status === "FAIL"
).length;
audit.finish({
  releaseGate:
    componentFailureCount === 0 && releaseCheckFailureCount === 0
      ? "PASS"
      : "FAIL",
  componentAuditCount: componentResults.length,
  componentFailureCount,
  releaseCheckFailureCount,
  dataContracts: contracts.length,
  activeMapLayers: activeLayers.length,
  mapFeatureCount,
  adm1FeatureCount,
  adm1JoinFailures: adm1JoinFailureCount,
  fakeGeometry: fakeGeometryCount,
  zeroImputation: zeroImputationCount,
  publicForbiddenTokenCount: publicTokenCount,
  publicDownloadTechnicalFieldCount,
  blankMap: mapUxSummary.blankMap ?? null,
  uncaughtRuntimeError: uncaughtRuntimeErrorCount,
  brokenDownloadLink,
  brokenDetailLink: crossSummary.brokenDetailLink ?? null,
  htmlReturnedForJson,
  crossNavigation: crossSummary.crossNavigation ?? null,
  urlStateRestoration: crossSummary.urlStateRestoration ?? null,
  responsiveLayoutFailures: mapUxSummary.responsiveLayoutFailures ?? null,
  a023ClusterZoomObserved: mapUxSummary.a023ClusterZoomObserved ?? null,
  a023PointSelectionSurface: mapUxSummary.a023PointSelectionSurface ?? null,
  a023MissingCapacityFalseZero:
    mapUxSummary.a023MissingCapacityFalseZero ?? null,
  selectedFeatureKinds: mapPublicSummary.selectedFeatureKinds ?? null,
  adm1PublicAttribution: mapPublicSummary.adm1PublicAttribution ?? null,
  a024NonSpatialSelectorBlocked:
    crossSummary.a024NonSpatialSelectorBlocked ?? null,
});
