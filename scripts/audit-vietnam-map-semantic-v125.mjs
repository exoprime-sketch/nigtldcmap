#!/usr/bin/env node

import { existsSync, readFileSync, statSync } from "node:fs";
import { resolve } from "node:path";
import ts from "typescript";
import {
  AuditV125,
  PROJECT_ROOT,
  SEMANTIC_ROOT,
  V2_ROOT,
  catalogElements,
  isNonEmptyString,
  publicUrlToPath,
  readJson,
  readText,
  visualizationContracts,
} from "./v125/audit-utils.mjs";

const audit = new AuditV125("map-semantic:v125");
const REQUIRED_LAYER_IDS = [
  "A-023",
  "A-024",
  "B-021",
  "B-031",
  "B-032",
  "B-033",
  "B-034",
  "B-048",
  "C-016",
  "C-025",
  "D-008",
  "D-018",
  "D-023",
];
const SPATIAL_VALUE_IDS = [
  "B-021",
  "B-031",
  "B-032",
  "B-033",
  "B-034",
  "C-016",
  "D-008",
];

const mapResult = readJson(resolve(V2_ROOT, "map-index.json"));
const catalogResult = readJson(resolve(V2_ROOT, "catalog.json"));
const contractResult = readJson(
  resolve(SEMANTIC_ROOT, "element-visualization-contracts-v125.json")
);
const integrityResult = readJson(resolve(SEMANTIC_ROOT, "semantic-integrity-v125.json"));
const adm1Result = readJson(resolve(V2_ROOT, "geometry/vnm-adm1-63.geojson"));
const transmissionResult = readJson(
  resolve(V2_ROOT, "geometry/vnm-transmission-network.geojson")
);

for (const [name, result] of [
  ["MAP_INDEX_JSON", mapResult],
  ["CATALOG_JSON", catalogResult],
  ["VISUALIZATION_CONTRACTS_JSON", contractResult],
  ["SEMANTIC_INTEGRITY_JSON", integrityResult],
  ["ADM1_GEOJSON", adm1Result],
  ["TRANSMISSION_GEOJSON", transmissionResult],
]) {
  audit.check(name, result.error === null, result.error, null);
}

const mapIndex = mapResult.value || {};
const catalog = catalogElements(catalogResult.value);
const contracts = visualizationContracts(contractResult.value);
const integrity = integrityResult.value || {};
const layers = Array.isArray(mapIndex.layers) ? mapIndex.layers : [];
const activeLayers = layers.filter(
  (layer) => layer?.active !== false && layer?.enabled !== false
);
const activeById = new Map(activeLayers.map((layer) => [layer.elementId, layer]));
const catalogById = new Map(catalog.map((element) => [element.elementId, element]));
const contractById = new Map(contracts.map((contract) => [contract.elementId, contract]));
const mapFeatureCount = activeLayers.reduce(
  (sum, layer) => sum + Number(layer.featureCount || 0),
  0
);
const missingRequiredLayers = REQUIRED_LAYER_IDS.filter((id) => !activeById.has(id));

audit.check("DATA_CONTRACTS", contracts.length === 152, contracts.length, 152);
audit.check(
  "ACTIVE_MAP_LAYERS",
  activeLayers.length === 13 && missingRequiredLayers.length === 0,
  { count: activeLayers.length, missing: missingRequiredLayers },
  { count: 13, missing: [] }
);
audit.check(
  "MAP_FEATURE_COUNT",
  mapFeatureCount === 2904 && Number(mapIndex.mapFeatureCount) === 2904,
  { calculated: mapFeatureCount, declared: mapIndex.mapFeatureCount ?? null },
  { calculated: 2904, declared: 2904 }
);

const adm1Features = Array.isArray(adm1Result.value?.features)
  ? adm1Result.value.features
  : [];
const adm1Codes = new Set(
  adm1Features.map((feature) => String(feature?.properties?.adm1Code || ""))
);
audit.check(
  "ADM1_FEATURE_COUNT",
  adm1Features.length === 63 && adm1Codes.size === 63 && !adm1Codes.has(""),
  { features: adm1Features.length, uniqueCodes: adm1Codes.size },
  { features: 63, uniqueCodes: 63 }
);

const linkageFailures = activeLayers.flatMap((layer) => {
  const element = catalogById.get(layer.elementId);
  const contract = contractById.get(layer.elementId);
  const failures = [];
  if (!element) failures.push("catalog");
  if (!contract) failures.push("semantic contract");
  if (contract?.mapLinkage?.enabled !== true) failures.push("mapLinkage.enabled");
  if (Number(contract?.mapLinkage?.featureCount) !== Number(layer.featureCount)) {
    failures.push("mapLinkage.featureCount");
  }
  if (layer.detailElementId !== layer.elementId) failures.push("detailElementId");
  if (!isNonEmptyString(layer.source)) failures.push("source");
  if (!isNonEmptyString(layer.accuracyNotice)) failures.push("accuracyNotice");
  if (!isNonEmptyString(layer.spatialCoverage)) failures.push("spatialCoverage");
  if (!Array.isArray(layer.selectors?.variables) || layer.selectors.variables.length === 0) {
    failures.push("selectors.variables");
  }
  return failures.length ? [{ elementId: layer.elementId, failures }] : [];
});
audit.check(
  "MAP_SEMANTIC_CONTRACT_LINKAGE",
  linkageFailures.length === 0,
  linkageFailures.length,
  0,
  linkageFailures
);

function normalizedUnit(value) {
  return String(value ?? "").normalize("NFKC").replace(/\s+/gu, " ").trim();
}

const spatialDocuments = new Map();
const semanticDocuments = new Map();
const semanticLinkFailures = [];
let spatialSemanticRowCount = 0;
let zeroImputationCount = 0;
let joinFailureCount = 0;

for (const elementId of SPATIAL_VALUE_IDS) {
  const layer = activeById.get(elementId);
  const spatialResult = readJson(publicUrlToPath(layer?.dataUrl || "") || "");
  const semanticResult = readJson(
    resolve(SEMANTIC_ROOT, `elements/${elementId.toLowerCase()}.json`)
  );
  spatialDocuments.set(elementId, spatialResult.value);
  semanticDocuments.set(elementId, semanticResult.value);
  if (spatialResult.error || semanticResult.error) {
    semanticLinkFailures.push({
      elementId,
      spatialError: spatialResult.error,
      semanticError: semanticResult.error,
    });
    continue;
  }
  const indicators = new Map(
    (semanticResult.value?.indicators || []).map((indicator) => [
      indicator.indicatorId,
      indicator,
    ])
  );
  for (const row of spatialResult.value?.values || []) {
    spatialSemanticRowCount += 1;
    const indicator = indicators.get(row.sourceIndicatorId);
    const failures = [];
    if (!indicator) failures.push("sourceIndicatorId");
    if (!isNonEmptyString(row.sourceRecordId)) failures.push("sourceRecordId");
    if (!isNonEmptyString(indicator?.displayLabel)) failures.push("displayLabel");
    if (!isNonEmptyString(indicator?.measure?.labelKo)) failures.push("measure label");
    if (!isNonEmptyString(indicator?.measure?.unit)) failures.push("measure unit");
    if (normalizedUnit(indicator?.measure?.unit) !== normalizedUnit(row.unit)) {
      failures.push("unit mismatch");
    }
    if (!indicator?.dimensions || !indicator?.dimensionLabels) {
      failures.push("dimensions");
    }
    if (row.imputed === true) zeroImputationCount += 1;
    if (failures.length) {
      semanticLinkFailures.push({
        elementId,
        sourceRecordId: row.sourceRecordId,
        sourceIndicatorId: row.sourceIndicatorId,
        failures,
      });
    }
  }
  joinFailureCount += (spatialResult.value?.seriesCoverage || []).reduce(
    (sum, coverage) => sum + Number(coverage.failureCount || 0),
    0
  );
}

audit.check(
  "SPATIAL_ROWS_USE_V125_SEMANTICS",
  spatialSemanticRowCount > 0 && semanticLinkFailures.length === 0,
  { checked: spatialSemanticRowCount, failures: semanticLinkFailures.length },
  { checked: "> 0", failures: 0 },
  semanticLinkFailures.slice(0, 100)
);
audit.check("ADM1_JOIN_FAILURES", joinFailureCount === 0, joinFailureCount, 0);
audit.check(
  "ZERO_IMPUTATION",
  zeroImputationCount === 0 && integrity.zeroImputationCount === 0,
  { spatial: zeroImputationCount, semantic: integrity.zeroImputationCount ?? null },
  { spatial: 0, semantic: 0 }
);
audit.check(
  "DUPLICATE_VISIBLE_LABELS",
  integrity.duplicateVisibleLabelCount === 0,
  integrity.duplicateVisibleLabelCount ?? null,
  0
);
audit.check(
  "MIXED_UNIT_AXES",
  integrity.mixedUnitAxisCount === 0,
  integrity.mixedUnitAxisCount ?? null,
  0
);

function comboCoverage(document) {
  const groups = new Map();
  for (const row of document?.values || []) {
    const key = `${row.variable}|${row.period}`;
    const entry = groups.get(key) || { codes: new Set(), units: new Set(), rows: 0 };
    entry.codes.add(row.adm1Code);
    entry.units.add(normalizedUnit(row.unit));
    entry.rows += 1;
    groups.set(key, entry);
  }
  return groups;
}

const b033 = spatialDocuments.get("B-033");
const b033Coverage = comboCoverage(b033);
const b033Layer = activeById.get("B-033");
const b033Failures = [...b033Coverage.entries()].filter(
  ([, group]) => group.rows !== 63 || group.codes.size !== 63 || group.units.size !== 1
);
audit.check(
  "B033_YEAR_UNIT_63_PROVINCE_SELECTOR",
  b033Coverage.size === 25 &&
    b033Failures.length === 0 &&
    b033Layer?.selectors?.variables?.length === 1 &&
    normalizedUnit(b033Layer.selectors.variables[0].unit) === "ha/yr",
  { combinations: b033Coverage.size, failures: b033Failures.length },
  { combinations: 25, failures: 0, unit: "ha/yr" },
  b033Failures.slice(0, 20)
);

const b034 = spatialDocuments.get("B-034");
const b034Coverage = comboCoverage(b034);
const b034Layer = activeById.get("B-034");
const b034Failures = [...b034Coverage.entries()].filter(
  ([, group]) => group.rows !== 63 || group.codes.size !== 63 || group.units.size !== 1
);
const b034SelectorUnitFailures = (b034Layer?.selectors?.variables || []).filter(
  (variable) => {
    const units = new Set(
      (b034?.values || [])
        .filter((row) => row.variable === variable.key)
        .map((row) => normalizedUnit(row.unit))
    );
    return units.size !== 1 || !units.has(normalizedUnit(variable.unit));
  }
);
audit.check(
  "B034_METRIC_YEAR_UNIT_SELECTOR",
  b034Coverage.size === 7 &&
    b034Failures.length === 0 &&
    b034Layer?.selectors?.variables?.length === 7 &&
    b034SelectorUnitFailures.length === 0,
  {
    combinations: b034Coverage.size,
    variables: b034Layer?.selectors?.variables?.length ?? 0,
    coverageFailures: b034Failures.length,
    unitFailures: b034SelectorUnitFailures.length,
  },
  { combinations: 7, variables: 7, coverageFailures: 0, unitFailures: 0 },
  { coverage: b034Failures, unit: b034SelectorUnitFailures }
);

const c016 = spatialDocuments.get("C-016");
const c016Coverage = comboCoverage(c016);
const c016Layer = activeById.get("C-016");
const c016CoverageFailures = (c016?.seriesCoverage || []).filter((coverage) => {
  const group = c016Coverage.get(`${coverage.variable}|${coverage.period}`);
  return (
    !group ||
    group.codes.size !== Number(coverage.matchedCount) ||
    Number(coverage.missingCount) !== 63 - group.codes.size ||
    Number(coverage.failureCount) !== 0
  );
});
const c016MaxFailures = (c016Layer?.selectors?.variables || []).filter((variable) => {
  const maximum = Math.max(
    0,
    ...[...c016Coverage.entries()]
      .filter(([key]) => key.startsWith(`${variable.key}|`))
      .map(([, group]) => group.codes.size)
  );
  return maximum !== Number(variable.maxFeatureCount);
});
audit.check(
  "C016_TECHNOLOGY_PERIOD_ACTUAL_ONLY",
  c016Layer?.selectors?.variables?.length === 8 &&
    c016Coverage.size === 15 &&
    c016CoverageFailures.length === 0 &&
    c016MaxFailures.length === 0,
  {
    technologies: c016Layer?.selectors?.variables?.length ?? 0,
    combinations: c016Coverage.size,
    coverageFailures: c016CoverageFailures.length,
    maximumFailures: c016MaxFailures.length,
  },
  { technologies: 8, combinations: 15, coverageFailures: 0, maximumFailures: 0 },
  { coverage: c016CoverageFailures, maximums: c016MaxFailures }
);

const d008 = spatialDocuments.get("D-008");
const d008Coverage = comboCoverage(d008);
const d008Layer = activeById.get("D-008");
const d008Group = d008Coverage.get("provincial-climate-budget|2010-2013");
const d008CoverageRecord = d008?.seriesCoverage?.[0];
audit.check(
  "D008_EXPLICIT_3_OF_63_COVERAGE",
  d008Coverage.size === 1 &&
    d008Group?.codes.size === 3 &&
    Number(d008CoverageRecord?.matchedCount) === 3 &&
    Number(d008CoverageRecord?.missingCount) === 60 &&
    /3개/u.test(String(d008Layer?.spatialCoverage || "")) &&
    /60개/u.test(String(d008Layer?.missingRegions?.join(" ") || "")),
  {
    populated: d008Group?.codes.size ?? 0,
    missing: d008CoverageRecord?.missingCount ?? null,
    coverageText: d008Layer?.spatialCoverage ?? null,
    missingText: d008Layer?.missingRegions ?? null,
  },
  { populated: 3, missing: 60, coverageText: "contains 3개", missingText: "contains 60개" }
);

const transmission = transmissionResult.value;
const transmissionFeatures = Array.isArray(transmission?.features)
  ? transmission.features
  : [];
const a024Layer = activeById.get("A-024");
const voltageValues = new Set(
  transmissionFeatures.map((feature) => String(feature?.properties?.voltageKv || ""))
);
const statusValues = new Set(
  transmissionFeatures.map((feature) => String(feature?.properties?.status || ""))
);
const voltageFilter = a024Layer?.filters?.find((filter) => filter.field === "voltageKv");
const statusFilter = a024Layer?.filters?.find((filter) => filter.field === "status");
audit.check(
  "A024_VOLTAGE_STATUS_SELECTOR",
  transmissionFeatures.length === 606 &&
    transmissionFeatures.every((feature) => feature?.geometry?.type === "MultiLineString") &&
    [...voltageValues].every((value) => voltageFilter?.values?.includes(value)) &&
    [...statusValues].every((value) => statusFilter?.values?.includes(value)) &&
    /2\s*[–~-]\s*10\s*km/iu.test(String(a024Layer?.accuracyNotice || "")),
  {
    features: transmissionFeatures.length,
    geometryTypes: [...new Set(transmissionFeatures.map((feature) => feature?.geometry?.type))],
    voltageValues: [...voltageValues].sort(),
    statusValues: [...statusValues].sort(),
    accuracyNotice: a024Layer?.accuracyNotice ?? null,
  },
  {
    features: 606,
    geometryTypes: ["MultiLineString"],
    voltageStatusSelectors: true,
    accuracyNotice: "contains 2–10 km",
  }
);

const pageSource = readText(resolve(PROJECT_ROOT, "src/pages/RealMapExplorerPage.tsx"));
const bindingSource = readText(
  resolve(PROJECT_ROOT, "src/data/visualization/mapSelectorBindingsV125.ts")
);
const loaderSource = readText(
  resolve(PROJECT_ROOT, "src/data/vietnam/vietnamDataLoaderV124.ts")
);
const combinedSemanticSource = `${bindingSource.value || ""}\n${pageSource.value || ""}`;
const semanticUiContract = {
  commonSemanticProjection:
    /semantic(?:Map|Presentation)|mapSemantic|SemanticMap/iu.test(combinedSemanticSource),
  semanticPanel: /data-testid=["'](?:map-semantic-contract|map-primary-controls)["']/u.test(
    pageSource.value || ""
  ),
  featureDetail: /data-testid=["']map-feature-detail["']/u.test(pageSource.value || ""),
  datasetName: /데이터명/u.test(pageSource.value || ""),
  indicatorOrMeasure: /(?:지표명|측정항목)/u.test(pageSource.value || ""),
  unit: /단위/u.test(pageSource.value || ""),
  period: /기준연도|기준기간/u.test(pageSource.value || ""),
  dimensions: /기술|지역|시나리오/u.test(pageSource.value || ""),
  missing: /결측/u.test(pageSource.value || ""),
  source: /출처/u.test(pageSource.value || ""),
  accuracy: /정확도/u.test(pageSource.value || ""),
};
audit.check(
  "MAP_SEMANTIC_DETAIL_UI",
  Object.values(semanticUiContract).every(Boolean),
  semanticUiContract,
  Object.fromEntries(Object.keys(semanticUiContract).map((key) => [key, true]))
);

let sharedPresentationFailures = [];
try {
  if (bindingSource.error || !bindingSource.value) {
    throw new Error(bindingSource.error || "map selector binding source missing");
  }
  const compiled = ts.transpileModule(bindingSource.value, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
    },
    fileName: "mapSelectorBindingsV125.ts",
    reportDiagnostics: true,
  });
  const diagnostics = (compiled.diagnostics || []).filter(
    (diagnostic) => diagnostic.category === ts.DiagnosticCategory.Error
  );
  if (diagnostics.length) {
    throw new Error(
      diagnostics
        .map((diagnostic) => ts.flattenDiagnosticMessageText(diagnostic.messageText, " "))
        .join("; ")
    );
  }
  const moduleRecord = { exports: {} };
  new Function("exports", "module", "require", compiled.outputText)(
    moduleRecord.exports,
    moduleRecord,
    () => {
      throw new Error("unexpected runtime import");
    }
  );
  const api = moduleRecord.exports;
  const projectionCases = [
    ["A-024", "220", "2016", { status: "existing" }],
    ["B-033", "annual-tree-cover-loss", "2020", {}],
    ["B-034", "7f74ea9db7ec", "2025", {}],
    ["C-016", "dien-sinh-khoi", "2031-2035", {}],
    ["D-008", "provincial-climate-budget", "2010-2013", {}],
  ];
  sharedPresentationFailures = projectionCases.flatMap(
    ([elementId, variable, period, filterDimensions]) => {
      const layer = activeById.get(elementId);
      const semantic =
        semanticDocuments.get(elementId) ||
        readJson(
          resolve(SEMANTIC_ROOT, `elements/${elementId.toLowerCase()}.json`)
        ).value;
      const presentation = api.resolveMapSemanticPresentationV125(
        elementId,
        { variable, period },
        layer.selectors,
        filterDimensions,
        "fallback-must-not-be-used"
      );
      const measure = (semantic?.measures || []).find(
        (candidate) => candidate.key === presentation.measureKey
      );
      const selector = layer.selectors.variables.find(
        (candidate) => candidate.key === variable
      );
      const failures = [];
      if (!measure) failures.push("semantic measure key");
      if (presentation.measureLabel !== measure?.labelKo) failures.push("measure label");
      if (presentation.indicatorLabel !== selector?.label) failures.push("indicator label");
      if (normalizedUnit(presentation.unit) !== normalizedUnit(selector?.unit)) {
        failures.push("unit");
      }
      if (presentation.period !== period) failures.push("period");
      return failures.length
        ? [{ elementId, variable, period, failures, presentation, measure, selector }]
        : [];
    }
  );
} catch (error) {
  sharedPresentationFailures = [
    { error: error instanceof Error ? error.message : String(error) },
  ];
}
audit.check(
  "SHARED_SEMANTIC_PRESENTATION_PROJECTION",
  sharedPresentationFailures.length === 0,
  sharedPresentationFailures.length,
  0,
  sharedPresentationFailures
);

const performanceContract = {
  pointClusterPreserved:
    a024Layer !== undefined &&
    activeById.get("A-023")?.cluster === true &&
    activeById.get("A-023")?.renderer === "cluster",
  spatialLoadsFollowActiveIds:
    /activeIds\.forEach[\s\S]+loadVietnamSpatialGeoJsonV124/u.test(pageSource.value || ""),
  adm1PromiseCache:
    /cachePromise/u.test(loaderSource.value || "") && /jsonCache/u.test(loaderSource.value || ""),
  staleRequestAbort: /AbortController/u.test(pageSource.value || ""),
  layerCleanup:
    /removeLayerFromMap/u.test(pageSource.value || "") &&
    /mountedKeysRef/u.test(pageSource.value || ""),
  duplicateGuard:
    /getSource\(/u.test(pageSource.value || "") && /getLayer\(/u.test(pageSource.value || ""),
  initialLayerScope: /setActiveIds\(\[\]\)/u.test(pageSource.value || ""),
};
audit.check(
  "MAP_PERFORMANCE_LIFECYCLE_CONTRACT",
  Object.values(performanceContract).every(Boolean),
  performanceContract,
  Object.fromEntries(Object.keys(performanceContract).map((key) => [key, true]))
);

const localJsonUrls = new Set([
  "/data/vietnam/v2/map-index.json",
  "/data/vietnam/v2/geometry/vnm-adm1-63.geojson",
  "/data/vietnam/v2/geometry/vnm-transmission-network.geojson",
  ...activeLayers.flatMap((layer) => [layer.geometryUrl, layer.dataUrl]).filter(Boolean),
]);
const malformedAssets = [...localJsonUrls].flatMap((url) => {
  const path = publicUrlToPath(url);
  if (!path || !existsSync(path) || !statSync(path).isFile()) {
    return [{ url, error: "missing" }];
  }
  const text = readFileSync(path, "utf8");
  if (/^\s*(?:<!doctype\s+html|<html)/iu.test(text)) {
    return [{ url, error: "HTML returned for JSON" }];
  }
  try {
    JSON.parse(text);
    return [];
  } catch (error) {
    return [{ url, error: error instanceof Error ? error.message : String(error) }];
  }
});
audit.check(
  "MAP_JSON_GEOJSON_ASSETS",
  malformedAssets.length === 0,
  { checked: localJsonUrls.size, failed: malformedAssets.length },
  { checked: "> 0", failed: 0 },
  malformedAssets
);

audit.finish({
  dataContracts: contracts.length,
  activeMapLayers: activeLayers.length,
  mapFeatureCount,
  adm1FeatureCount: adm1Features.length,
  adm1JoinFailures: joinFailureCount,
  semanticSpatialRowsChecked: spatialSemanticRowCount,
  fakeGeometryCount:
    typeof transmission?.metadata?.fakeGeometryCount === "number"
      ? transmission.metadata.fakeGeometryCount
      : null,
  zeroImputationCount,
  duplicateVisibleLabels:
    typeof integrity.duplicateVisibleLabelCount === "number"
      ? integrity.duplicateVisibleLabelCount
      : null,
  mixedUnitAxes:
    typeof integrity.mixedUnitAxisCount === "number"
      ? integrity.mixedUnitAxisCount
      : null,
  htmlReturnedForJson: malformedAssets.filter((entry) =>
    String(entry.error).includes("HTML")
  ).length,
});
