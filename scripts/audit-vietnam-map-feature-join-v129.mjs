#!/usr/bin/env node

import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { resolve } from "node:path";
import {
  AuditV125,
  PROJECT_ROOT,
  V2_ROOT,
  loadPackPayloads,
  payloadRecords,
  readJson,
} from "./v125/audit-utils.mjs";
import {
  finishAuditV129,
  normalizeTextV129,
  sourceTextV129,
} from "./v129/audit-helpers.mjs";

const audit = new AuditV125("map-feature-join:v129");

function waitForProductionBuild(timeoutMs = 60_000) {
  const buildEntry = resolve(PROJECT_ROOT, "build/index.html");
  const deadline = Date.now() + timeoutMs;
  while (!existsSync(buildEntry) && Date.now() < deadline) {
    Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 100);
  }
  return existsSync(buildEntry);
}

function runRequiredGate(scriptName, reportFileName) {
  const execute = () =>
    spawnSync(process.execPath, [resolve(PROJECT_ROOT, "scripts", scriptName)], {
      cwd: PROJECT_ROOT,
      encoding: "utf8",
      maxBuffer: 32 * 1024 * 1024,
      stdio: ["ignore", "inherit", "inherit"],
    });
  waitForProductionBuild();
  let result = execute();
  if (result.status !== 0) {
    const report = readJson(resolve(PROJECT_ROOT, "reports/v129", reportFileName));
    if (
      JSON.stringify(report.value || report.error).includes(
        "production build missing"
      ) &&
      waitForProductionBuild()
    ) {
      result = execute();
    }
  }
  return result;
}

function reportCheck(report, name) {
  return report?.checks?.find((check) => check?.name === name) || null;
}

function unique(values) {
  return [...new Set(values.filter((value) => normalizeTextV129(value)))];
}

function selectorKey(variable, period) {
  return `${normalizeTextV129(variable)}::${normalizeTextV129(period)}`;
}

function publicPointDetailAvailable(record) {
  const attributes = record?.normalizedAttributes || {};
  return Boolean(
    normalizeTextV129(record?.name) ||
      normalizeTextV129(attributes.name) ||
      normalizeTextV129(attributes.projectName) ||
      normalizeTextV129(attributes.mineName) ||
      normalizeTextV129(record?.entityType) ||
      normalizeTextV129(record?.note)
  );
}

const interactionRun = runRequiredGate(
  "audit-vietnam-map-interaction-v129.mjs",
  "map-interaction-audit-v129.json"
);
const interpretationRun = runRequiredGate(
  "audit-vietnam-interpretation-v129.mjs",
  "interpretation-audit-v129.json"
);
const interactionReportResult = readJson(
  resolve(PROJECT_ROOT, "reports/v129/map-interaction-audit-v129.json")
);
const interpretationReportResult = readJson(
  resolve(PROJECT_ROOT, "reports/v129/interpretation-audit-v129.json")
);
const interactionReport = interactionReportResult.value;
const interpretationReport = interpretationReportResult.value;

const mapResult = readJson(resolve(V2_ROOT, "map-index.json"));
const catalogResult = readJson(resolve(V2_ROOT, "catalog.json"));
const adm1Result = readJson(resolve(V2_ROOT, "geometry/vnm-adm1-63.geojson"));
const transmissionResult = readJson(
  resolve(V2_ROOT, "geometry/vnm-transmission-network.geojson")
);
const interpretationResult = readJson(
  resolve(V2_ROOT, "interpretation/indicator-interpretation-v129.json")
);
const packs = loadPackPayloads();

const layers = Array.isArray(mapResult.value?.layers)
  ? mapResult.value.layers.filter(
      (layer) => layer?.active !== false && layer?.enabled !== false
    )
  : [];
const catalogByElement = new Map(
  (Array.isArray(catalogResult.value?.elements)
    ? catalogResult.value.elements
    : []
  ).map((element) => [element.elementId, element])
);
const adm1Features = Array.isArray(adm1Result.value?.features)
  ? adm1Result.value.features
  : [];
const adm1Codes = new Set(
  adm1Features.map((feature) => feature?.properties?.adm1Code).filter(Boolean)
);
const interpretations = Array.isArray(interpretationResult.value?.entries)
  ? interpretationResult.value.entries
  : [];
const b021Interpretations = new Map(
  interpretations
    .filter((item) => item?.elementId === "B-021" && item?.variableKey)
    .map((item) => [item.variableKey, item])
);
const mapSource = sourceTextV129([
  resolve(PROJECT_ROOT, "src/pages/RealMapExplorerPage.tsx"),
  resolve(PROJECT_ROOT, "src/data/visualization/publicMapWorkspaceV126.ts"),
]);
const PUBLIC_LAYER_TITLES = new Map([
  ["A-023", "발전소"],
  ["A-024", "베트남 송전망"],
  ["B-021", "지역 취약성"],
  ["B-031", "산림 총면적"],
  ["B-032", "수관 피복률"],
  ["B-033", "연간 산림손실"],
  ["B-034", "산림 탄소"],
  ["B-048", "주요 광산"],
  ["C-016", "재생에너지 지역계획"],
  ["C-025", "탄소크레딧 사업"],
  ["D-008", "지역 기후예산"],
  ["D-018", "적응기금 사업"],
]);
const selectionHighlightContract = {
  selectionLayerPerRenderer:
    (mapSource.match(/id:\s*ids\.selection/gu) || []).length >= 3,
  selectedFeatureFilter: /map\.setFilter\(ids\.selection/gu.test(mapSource),
  selectedFeatureKey: /selectionKey\s*\|\|\s*"__none__"/gu.test(mapSource),
  fallbackSelectedClassCount:
    (mapSource.match(/isSelected \? "is-selected" : ""/gu) || []).length >= 3,
  fallbackPointRenderer: /cdp-map-fallback__point/gu.test(mapSource),
  fallbackLineRenderer: /cdp-map-fallback__line/gu.test(mapSource),
  fallbackPolygonRenderer: /cdp-map-fallback__choropleth/gu.test(mapSource),
};

const interactionCheck = reportCheck(
  interactionReport,
  "ALL_LAYER_TOOLTIP_AND_CLICK"
);
const interactionRows = Array.isArray(
  interactionCheck?.actual?.interactionResults
)
  ? interactionCheck.actual.interactionResults
  : [];
const interactionByElement = new Map(
  interactionRows.map((row) => [row.elementId, row])
);
const browserActivationCheck = reportCheck(
  interactionReport,
  "ALL_LAYER_BROWSER_ACTIVATION_AND_LEGEND"
);
const contextSelectionCheck = reportCheck(
  interactionReport,
  "CONTEXT_LAYER_SELECTION_DETAIL"
);
const visibleTooltipCheck = reportCheck(
  interactionReport,
  "MAP_VISIBLE_FEATURE_WITHOUT_TOOLTIP"
);
const clickableDetailCheck = reportCheck(
  interactionReport,
  "MAP_CLICKABLE_FEATURE_WITHOUT_DETAIL"
);
const unknownSymbolCheck = reportCheck(
  interactionReport,
  "MAP_UNKNOWN_SYMBOL"
);
const b021VariableCheck = reportCheck(
  interpretationReport,
  "B021_DETAIL_RUNTIME_PUBLIC_PARITY"
);

const mapFeatureCount = layers.reduce(
  (sum, layer) => sum + Number(layer?.featureCount || 0),
  0
);
const pointLayerIds = new Set(["A-023", "B-048", "C-025"]);
const spatialLayerIds = new Set([
  "B-021",
  "B-031",
  "B-032",
  "B-033",
  "B-034",
  "C-016",
  "D-008",
]);

const pointFailures = [];
const pointJoinRows = [];
const spatialFailures = [];
const spatialJoinRows = [];
const selectorFailures = [];
const publicContractFailures = [];
const layerAcceptance = [];

for (const layer of layers) {
  const elementId = layer?.elementId;
  const catalog = catalogByElement.get(elementId);
  const variables = Array.isArray(layer?.selectors?.variables)
    ? layer.selectors.variables
    : [];
  const periods = Array.isArray(layer?.selectors?.periods)
    ? layer.selectors.periods.map(String)
    : [];
  const interaction = interactionByElement.get(elementId);
  const canonicalTitle = PUBLIC_LAYER_TITLES.get(elementId);
  const isPoint = pointLayerIds.has(elementId);
  const isSpatial = spatialLayerIds.has(elementId);
  const isTransmission = elementId === "A-024";
  const isRegional = layer?.renderer === "regional-scope";
  const publicSpatialType = isTransmission
    ? "선형 인프라"
    : isRegional
      ? "지역 협력범위"
      : isSpatial
      ? "지역별 색상지도"
      : elementId === "A-023" || elementId === "B-048"
        ? "시설 위치"
        : "사업 위치";

  const invalidVariables = variables.filter((variable) => {
    const variablePeriods = Array.isArray(variable?.periods)
      ? variable.periods.map(String)
      : [];
    return (
      !normalizeTextV129(variable?.key) ||
      !normalizeTextV129(variable?.label) ||
      !normalizeTextV129(variable?.unit) ||
      variablePeriods.length === 0 ||
      variablePeriods.some((period) => !periods.includes(period))
    );
  });
  if (
    variables.length === 0 ||
    periods.length === 0 ||
    invalidVariables.length > 0 ||
    !variables.some(
      (variable) => variable.key === layer?.selectors?.defaultVariable
    ) ||
    !periods.includes(String(layer?.selectors?.defaultPeriod || ""))
  ) {
    selectorFailures.push({
      elementId,
      invalidVariables: invalidVariables.map((variable) => variable?.key),
      defaultVariable: layer?.selectors?.defaultVariable || null,
      defaultPeriod: layer?.selectors?.defaultPeriod || null,
    });
  }

  const downloadContractPass =
    layer?.downloadStatus === "available"
      ? catalog?.downloadAllowed === true &&
        Array.isArray(catalog?.downloadAssets) &&
        catalog.downloadAssets.length > 0
      : layer?.downloadStatus === "source-restricted" &&
        catalog?.downloadAllowed === false &&
        Array.isArray(catalog?.rights?.licenses) &&
        catalog.rights.licenses.length > 0;
  const detailLinkPass =
    catalog?.displayAllowed === true &&
    layer?.detailElementId === elementId &&
    normalizeTextV129(layer?.detailUrl).toLowerCase().includes(
      `element=${elementId.toLowerCase()}`
    );
  const publicContractPass = Boolean(
    normalizeTextV129(canonicalTitle) &&
      normalizeTextV129(layer?.legend?.title || layer?.legendTitle) &&
      normalizeTextV129(layer?.spatialCoverage) &&
      normalizeTextV129(layer?.accuracyNotice) &&
      normalizeTextV129(layer?.source) &&
      normalizeTextV129(layer?.sourceYear || layer?.latestYear) &&
      publicSpatialType &&
      detailLinkPass &&
      downloadContractPass
  );
  if (!publicContractPass) {
    publicContractFailures.push({
      elementId,
      publicSpatialType,
      detailLinkPass,
      downloadContractPass,
      downloadStatus: layer?.downloadStatus || null,
    });
  }

  layerAcceptance.push({
    elementId,
    publicTitle: canonicalTitle,
    featureCount: Number(layer?.featureCount || 0),
    symbolIdentified: Boolean(publicSpatialType),
    publicSpatialType,
    primaryRoleVerified: interaction?.role === "primary",
    contextRoleVerified:
      contextSelectionCheck?.status === "PASS" &&
      reportCheck(interactionReport, "POLYGON_PRIMARY_CONTEXT_HIT_ORDER")?.status ===
        "PASS",
    selectorLabelUnitPeriod: invalidVariables.length === 0,
    hoverTooltip: interaction?.tooltip === true,
    clickDetail: interaction?.detail === true,
    selectionHighlight:
      Object.values(selectionHighlightContract).every(Boolean),
    publicCaveat: Boolean(normalizeTextV129(layer?.accuracyNotice)),
    detailLink: detailLinkPass,
    downloadStatus: downloadContractPass,
    result:
      publicContractPass &&
      invalidVariables.length === 0 &&
      interaction?.tooltip === true &&
      interaction?.detail === true
        ? "PASS"
        : "FAIL",
  });
}

for (const elementId of pointLayerIds) {
  const layer = layers.find((item) => item?.elementId === elementId);
  const records = payloadRecords(packs.elements.get(elementId)?.entities);
  const eligible = records.filter(
    (record) =>
      record?.mapEligible === true &&
      Number.isFinite(Number(record?.latitude)) &&
      Number.isFinite(Number(record?.longitude))
  );
  const recordIds = eligible.map((record) => normalizeTextV129(record?.recordId));
  const duplicateRecordIds = recordIds.filter(
    (recordId, index) => !recordId || recordIds.indexOf(recordId) !== index
  );
  const invalidDetails = eligible.filter(
    (record) =>
      record?.elementId !== elementId ||
      !normalizeTextV129(record?.recordId) ||
      !normalizeTextV129(record?.provenance?.sourceOrg) ||
      !normalizeTextV129(record?.provenance?.referenceYear) ||
      !normalizeTextV129(record?.coordinateQuality) ||
      !publicPointDetailAvailable(record)
  );
  const expected = Number(layer?.featureCount || 0);
  const pass =
    eligible.length === expected &&
    duplicateRecordIds.length === 0 &&
    invalidDetails.length === 0;
  pointJoinRows.push({
    elementId,
    visibleFeatureCount: expected,
    eligiblePublicRecordCount: eligible.length,
    duplicateRecordIdCount: duplicateRecordIds.length,
    publicDetailFailureCount: invalidDetails.length,
    result: pass ? "PASS" : "FAIL",
  });
  if (!pass) {
    pointFailures.push({
      elementId,
      expected,
      eligible: eligible.length,
      duplicateRecordIds: unique(duplicateRecordIds),
      invalidDetailRecordIds: invalidDetails.map((record) => record?.recordId),
    });
  }
}

for (const elementId of spatialLayerIds) {
  const layer = layers.find((item) => item?.elementId === elementId);
  const spatialResult = readJson(
    resolve(V2_ROOT, `spatial/layers/${elementId.toLowerCase()}.json`)
  );
  const values = Array.isArray(spatialResult.value?.values)
    ? spatialResult.value.values
    : [];
  const observationIds = new Set(
    payloadRecords(packs.elements.get(elementId)?.observations)
      .map((record) => normalizeTextV129(record?.recordId))
      .filter(Boolean)
  );
  const selectorVariables = new Map(
    (layer?.selectors?.variables || []).map((variable) => [variable.key, variable])
  );
  const selectorCoverage = new Map();
  const invalidRows = [];
  for (const row of values) {
    const variable = selectorVariables.get(row?.variable);
    const period = String(row?.period || "");
    const key = selectorKey(row?.variable, period);
    if (!selectorCoverage.has(key)) selectorCoverage.set(key, new Set());
    selectorCoverage.get(key).add(row?.adm1Code);
    if (
      !adm1Codes.has(row?.adm1Code) ||
      !observationIds.has(normalizeTextV129(row?.sourceRecordId)) ||
      !variable ||
      !Array.isArray(variable.periods) ||
      !variable.periods.map(String).includes(period) ||
      normalizeTextV129(variable.unit) !== normalizeTextV129(row?.unit) ||
      normalizeTextV129(variable.label) !== normalizeTextV129(row?.variableLabel) ||
      row?.imputed === true ||
      !normalizeTextV129(row?.sourceSpatialUnit)
    ) {
      invalidRows.push({
        adm1Code: row?.adm1Code || null,
        sourceRecordId: row?.sourceRecordId || null,
        variable: row?.variable || null,
        period: row?.period || null,
      });
    }
  }
  const maximumCoverage = Math.max(
    0,
    ...[...selectorCoverage.values()].map((codes) => codes.size)
  );
  const expected = Number(layer?.featureCount || 0);
  const pass =
    spatialResult.error === null &&
    values.length > 0 &&
    invalidRows.length === 0 &&
    maximumCoverage === expected;
  spatialJoinRows.push({
    elementId,
    spatialValueCount: values.length,
    observationRecordCount: observationIds.size,
    selectorPairCount: selectorCoverage.size,
    maximumFeatureCoverage: maximumCoverage,
    mapFeatureCount: expected,
    invalidRowCount: invalidRows.length,
    result: pass ? "PASS" : "FAIL",
  });
  if (!pass) {
    spatialFailures.push({
      elementId,
      error: spatialResult.error,
      valueCount: values.length,
      maximumCoverage,
      expected,
      invalidRows,
    });
  }
}

const transmissionFeatures = Array.isArray(transmissionResult.value?.features)
  ? transmissionResult.value.features
  : [];
const transmissionIds = transmissionFeatures.map((feature) =>
  normalizeTextV129(feature?.id)
);
const transmissionFailures = transmissionFeatures.filter((feature) => {
  const properties = feature?.properties || {};
  return (
    feature?.type !== "Feature" ||
    feature?.geometry?.type !== "MultiLineString" ||
    !normalizeTextV129(feature?.id) ||
    properties?.featureId !== feature?.id ||
    properties?.elementId !== "A-024" ||
    properties?.isSynthetic !== false ||
    !Number.isFinite(Number(properties?.voltageKv)) ||
    !normalizeTextV129(properties?.status) ||
    !Number.isFinite(Number(properties?.lengthKm)) ||
    !normalizeTextV129(properties?.source) ||
    !normalizeTextV129(properties?.sourceYear)
  );
});
const duplicateTransmissionIds = transmissionIds.filter(
  (featureId, index) => !featureId || transmissionIds.indexOf(featureId) !== index
);
const transmissionPass =
  transmissionFeatures.length === 606 &&
  transmissionFailures.length === 0 &&
  duplicateTransmissionIds.length === 0;

const b021Result = readJson(resolve(V2_ROOT, "spatial/layers/b-021.json"));
const b021Values = Array.isArray(b021Result.value?.values)
  ? b021Result.value.values
  : [];
const b021Layer = layers.find((layer) => layer?.elementId === "B-021");
const b021Variables = Array.isArray(b021Layer?.selectors?.variables)
  ? b021Layer.selectors.variables
  : [];
const b021VariableFailures = b021Variables.filter((variable) => {
  const interpretation = b021Interpretations.get(variable.key);
  return (
    !interpretation ||
    !normalizeTextV129(interpretation?.publicName) ||
    !normalizeTextV129(interpretation?.publicUnit).includes(
      normalizeTextV129(variable?.unit)
    ) ||
    !normalizeTextV129(interpretation?.direction) ||
    normalizeTextV129(interpretation?.aggregationLevel) !== "GDL 6개 권역" ||
    !normalizeTextV129(interpretation?.aggregationNotice).includes(
      "성 단위 독립 추정값이 아닙니다"
    )
  );
});
const b021InvalidRows = b021Values.filter(
  (row) =>
    row?.sourceSpatialUnit !== "region" ||
    !normalizeTextV129(row?.sourceRegion) ||
    row?.mappingMethod !== "explicit-gdl-six-region-membership"
);
const gviLatestRows = b021Values.filter(
  (row) => row?.variable === "gvi-6" && String(row?.period) === "2023"
);
const gviRegions = unique(gviLatestRows.map((row) => row?.sourceRegion));
const gviSourceRecordIds = unique(
  gviLatestRows.map((row) => row?.sourceRecordId)
);
const gviRegionValueInconsistencies = gviRegions.filter((region) => {
  const values = unique(
    gviLatestRows
      .filter((row) => row?.sourceRegion === region)
      .map((row) => String(row?.value))
  );
  return values.length !== 1;
});
const gviInterpretation = b021Interpretations.get("gvi-6");
const b021Pass =
  b021Result.error === null &&
  b021VariableFailures.length === 0 &&
  b021InvalidRows.length === 0 &&
  gviRegions.length === 6 &&
  gviSourceRecordIds.length === 6 &&
  gviRegionValueInconsistencies.length === 0 &&
  gviInterpretation?.scale?.minimum === 0 &&
  gviInterpretation?.scale?.maximum === 100 &&
  gviInterpretation?.direction === "higher-worse" &&
  gviInterpretation?.benchmarkType === "group-rank" &&
  b021VariableCheck?.status === "PASS" &&
  b021VariableCheck?.actual?.checkedVariables === 12 &&
  b021VariableCheck?.actual?.mismatchCount === 0;

const layerAcceptanceFailures = layerAcceptance.filter(
  (row) => row.result !== "PASS"
);
const interactionGatePass =
  interactionRun.status === 0 &&
  interactionReportResult.error === null &&
  interactionReport?.status === "PASS";
const interpretationGatePass =
  interpretationRun.status === 0 &&
  interpretationReportResult.error === null &&
  interpretationReport?.status === "PASS";

audit.check(
  "V129_A_MAP_INTERACTION_GATE",
  interactionGatePass,
  {
    exitCode: interactionRun.status,
    reportStatus: interactionReport?.status || interactionReportResult.error,
  },
  { exitCode: 0, reportStatus: "PASS" }
);
audit.check(
  "V129_A_INTERPRETATION_GATE",
  interpretationGatePass,
  {
    exitCode: interpretationRun.status,
    reportStatus:
      interpretationReport?.status || interpretationReportResult.error,
  },
  { exitCode: 0, reportStatus: "PASS" }
);
audit.check("MAP_LAYER_COUNT", layers.length === 12, layers.length, 12);
audit.check("MAP_FEATURE_COUNT", mapFeatureCount === 2900, mapFeatureCount, 2900);
audit.check("ADM1_FEATURE_COUNT", adm1Codes.size === 63, adm1Codes.size, 63);
audit.check("PACK_INTEGRITY", packs.errors.length === 0, packs.errors, []);
audit.check(
  "LAYER_PUBLIC_ACCEPTANCE_CONTRACT",
  layerAcceptanceFailures.length === 0,
  layerAcceptanceFailures,
  []
);
audit.check(
  "SELECTOR_LABEL_UNIT_PERIOD_CONTRACT",
  selectorFailures.length === 0,
  selectorFailures,
  []
);
audit.check(
  "POINT_VISIBLE_FEATURE_PUBLIC_RECORD_JOIN",
  pointFailures.length === 0,
  pointFailures,
  []
);
audit.check(
  "SPATIAL_VALUE_OBSERVATION_ADM1_JOIN",
  spatialFailures.length === 0,
  spatialFailures,
  []
);
audit.check(
  "TRANSMISSION_ACTUAL_FEATURE_JOIN",
  transmissionPass,
  {
    featureCount: transmissionFeatures.length,
    invalidFeatureCount: transmissionFailures.length,
    duplicateFeatureIdCount: duplicateTransmissionIds.length,
  },
  { featureCount: 606, invalidFeatureCount: 0, duplicateFeatureIdCount: 0 }
);
audit.check(
  "B021_REGION_VARIABLE_SEMANTIC_JOIN",
  b021Pass,
  {
    variableCount: b021Variables.length,
    variableFailureCount: b021VariableFailures.length,
    invalidSpatialRowCount: b021InvalidRows.length,
    latestGviProvinceRows: gviLatestRows.length,
    uniqueSourceRegions: gviRegions.length,
    uniqueSourceRecords: gviSourceRecordIds.length,
    inconsistentRegionValues: gviRegionValueInconsistencies,
    runtimeVariablesChecked: b021VariableCheck?.actual?.checkedVariables || 0,
    runtimeMismatchCount: b021VariableCheck?.actual?.mismatchCount ?? null,
    direction: gviInterpretation?.direction || null,
    scale: gviInterpretation?.scale || null,
  },
  {
    variableCount: 12,
    variableFailureCount: 0,
    invalidSpatialRowCount: 0,
    latestGviProvinceRows: 63,
    uniqueSourceRegions: 6,
    uniqueSourceRecords: 6,
    inconsistentRegionValues: [],
    runtimeVariablesChecked: 12,
    runtimeMismatchCount: 0,
    direction: "higher-worse",
    scale: { minimum: 0, maximum: 100 },
  }
);
audit.check(
  "ALL_LAYER_BROWSER_TOOLTIP_CLICK",
  interactionRows.length === 12 &&
    interactionRows.every(
      (row) => row?.tooltip === true && row?.detail === true
    ),
  interactionRows.map((row) => ({
    elementId: row?.elementId,
    tooltip: row?.tooltip,
    detail: row?.detail,
    surface: row?.surface,
  })),
  "12/12 tooltip and click detail"
);
audit.check(
  "PRIMARY_CONTEXT_ROLE_AND_SELECTION",
  browserActivationCheck?.status === "PASS" &&
    contextSelectionCheck?.status === "PASS" &&
    reportCheck(interactionReport, "POLYGON_PRIMARY_CONTEXT_HIT_ORDER")
      ?.status === "PASS",
  {
    activation: browserActivationCheck?.status || "MISSING",
    pointContext: contextSelectionCheck?.status || "MISSING",
    polygonContext:
      reportCheck(interactionReport, "POLYGON_PRIMARY_CONTEXT_HIT_ORDER")
        ?.status || "MISSING",
  },
  { activation: "PASS", pointContext: "PASS", polygonContext: "PASS" }
);
audit.check(
  "SELECTION_HIGHLIGHT_ALL_RENDERERS",
  Object.values(selectionHighlightContract).every(Boolean),
  selectionHighlightContract,
  Object.fromEntries(
    Object.keys(selectionHighlightContract).map((key) => [key, true])
  )
);
audit.check(
  "MAP_VISIBLE_FEATURE_WITHOUT_TOOLTIP",
  visibleTooltipCheck?.status === "PASS" &&
    Array.isArray(visibleTooltipCheck?.actual) &&
    visibleTooltipCheck.actual.length === 0,
  visibleTooltipCheck?.actual ?? "MISSING",
  []
);
audit.check(
  "MAP_UNCLICKABLE_VISIBLE_FEATURE",
  clickableDetailCheck?.status === "PASS" &&
    Array.isArray(clickableDetailCheck?.actual) &&
    clickableDetailCheck.actual.length === 0,
  clickableDetailCheck?.actual ?? "MISSING",
  []
);
audit.check(
  "MAP_UNKNOWN_SYMBOL",
  unknownSymbolCheck?.status === "PASS" &&
    Array.isArray(unknownSymbolCheck?.actual) &&
    unknownSymbolCheck.actual.length === 0,
  unknownSymbolCheck?.actual ?? "MISSING",
  []
);

const orphanFeatureCount =
  pointFailures.reduce(
    (sum, failure) =>
      sum +
      Math.abs(Number(failure.expected || 0) - Number(failure.eligible || 0)) +
      failure.duplicateRecordIds.length +
      failure.invalidDetailRecordIds.length,
    0
  ) +
  spatialFailures.reduce(
    (sum, failure) => sum + (failure.invalidRows?.length || 0),
    0
  ) +
  transmissionFailures.length +
  duplicateTransmissionIds.length;

finishAuditV129(audit, "map-feature-join-audit-v129.json", {
  mapLayerCount: layers.length,
  mapFeatureCount,
  adm1FeatureCount: adm1Codes.size,
  pointFeatureCount: pointJoinRows.reduce(
    (sum, row) => sum + row.visibleFeatureCount,
    0
  ),
  transmissionFeatureCount: transmissionFeatures.length,
  mapOrphanFeatureCount: orphanFeatureCount,
  mapUnknownSymbolCount:
    unknownSymbolCheck?.status === "PASS" ? 0 : layerAcceptanceFailures.length,
  mapUnclickableFeatureCount:
    clickableDetailCheck?.status === "PASS" ? 0 : layerAcceptanceFailures.length,
  mapVisibleFeatureWithoutTooltip:
    visibleTooltipCheck?.status === "PASS" ? 0 : layerAcceptanceFailures.length,
  b021UniqueSourceRegionCount: gviRegions.length,
  b021VariableRuntimeCoverage:
    b021VariableCheck?.status === "PASS" ? "12/12" : "FAIL",
  layerAcceptance,
  pointJoinRows,
  spatialJoinRows,
});
