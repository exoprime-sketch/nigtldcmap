#!/usr/bin/env node

import { existsSync, statSync } from "node:fs";
import { resolve } from "node:path";
import {
  AuditV125,
  PROJECT_ROOT,
  REPORT_ROOT,
  SEMANTIC_ROOT,
  V2_ROOT,
  arrayDifference,
  catalogElements,
  isNonEmptyString,
  loadPackPayloads,
  parseCsv,
  payloadRecords,
  publicUrlToPath,
  readJson,
  readText,
  semanticElements,
  uniqueStrings,
  visualizationContracts,
} from "./v125/audit-utils.mjs";

const audit = new AuditV125("semantic:v125");
const catalogResult = readJson(resolve(V2_ROOT, "catalog.json"));
const semanticsResult = readJson(
  resolve(SEMANTIC_ROOT, "indicator-semantics-v125.json")
);
const contractsResult = readJson(
  resolve(SEMANTIC_ROOT, "element-visualization-contracts-v125.json")
);
const integrityResult = readJson(
  resolve(SEMANTIC_ROOT, "semantic-integrity-v125.json")
);

for (const [name, result] of [
  ["CATALOG_JSON", catalogResult],
  ["INDICATOR_SEMANTICS_JSON", semanticsResult],
  ["VISUALIZATION_CONTRACTS_JSON", contractsResult],
  ["SEMANTIC_INTEGRITY_JSON", integrityResult],
]) {
  audit.check(name, result.error === null, result.error, null);
}

const catalog = catalogElements(catalogResult.value);
const contracts = visualizationContracts(contractsResult.value);
const semanticIndexByElement = semanticElements(semanticsResult.value);
const semanticByElement = {};
const semanticAssetFailures = [];
for (const [elementId, indexEntry] of Object.entries(semanticIndexByElement)) {
  const assetPath = publicUrlToPath(indexEntry?.assetUrl);
  const detailResult = assetPath
    ? readJson(assetPath)
    : { value: null, error: "invalid assetUrl" };
  if (
    detailResult.error ||
    detailResult.value?.elementId !== elementId ||
    !Array.isArray(detailResult.value?.indicators)
  ) {
    semanticAssetFailures.push({
      elementId,
      assetUrl: indexEntry?.assetUrl ?? null,
      error: detailResult.error || "semantic detail schema mismatch",
    });
  } else {
    semanticByElement[elementId] = detailResult.value;
  }
}
const catalogIds = catalog.map((element) => element.elementId).sort();
const contractIds = contracts.map((contract) => contract.elementId).sort();
const semanticIds = Object.keys(semanticIndexByElement).sort();
const uniqueCatalogIds = [...new Set(catalogIds)];
const uniqueContractIds = [...new Set(contractIds)];

audit.check("FRAMEWORK_ELEMENT_COUNT", catalog.length === 152, catalog.length, 152);
audit.check(
  "CATALOG_ELEMENT_IDS_UNIQUE",
  uniqueCatalogIds.length === 152,
  uniqueCatalogIds.length,
  152
);
audit.check("ELEMENT_CONTRACT_COUNT", contracts.length === 152, contracts.length, 152);
audit.check(
  "ELEMENT_CONTRACT_IDS_UNIQUE",
  uniqueContractIds.length === 152,
  uniqueContractIds.length,
  152
);

const missingContractIds = arrayDifference(catalogIds, contractIds);
const unknownContractIds = arrayDifference(contractIds, catalogIds);
audit.check(
  "ELEMENT_CONTRACT_COVERAGE",
  missingContractIds.length === 0 && unknownContractIds.length === 0,
  { missing: missingContractIds.length, unknown: unknownContractIds.length },
  { missing: 0, unknown: 0 },
  { missingContractIds, unknownContractIds }
);

const allowedRenderers = new Set([
  "kpi-trend",
  "multi-metric-trend",
  "composition",
  "category-comparison",
  "paired-category-comparison",
  "score-benchmark",
  "scenario-range",
  "seasonality",
  "portfolio",
  "directory",
  "policy-timeline",
  "evidence-matrix",
  "capability-scorecard",
  "document-library",
  "spatial-summary",
  "status-only",
  "occupation-employment-wage",
  "structured-table",
]);
const allowedStatuses = new Set([
  "archetype",
  "specialized",
  "status-only",
]);
const requiredContractArrays = [
  "measures",
  "dimensions",
  "selectors",
  "unitFamilies",
  "primaryLabelFields",
  "tooltipFields",
  "tableColumns",
];
const malformedContracts = contracts.flatMap((contract) => {
  const missing = [];
  if (!isNonEmptyString(contract.elementId)) missing.push("elementId");
  if (!isNonEmptyString(contract.dataPresenceStatus)) missing.push("dataPresenceStatus");
  if (!allowedRenderers.has(contract.primaryRenderer)) missing.push("primaryRenderer");
  if (
    contract.secondaryRenderer !== null &&
    contract.secondaryRenderer !== undefined &&
    !allowedRenderers.has(contract.secondaryRenderer)
  ) {
    missing.push("secondaryRenderer");
  }
  if (!allowedStatuses.has(contract.contractStatus)) missing.push("contractStatus");
  for (const key of requiredContractArrays) {
    if (!Array.isArray(contract[key])) missing.push(key);
  }
  for (const key of [
    "comparisonPolicy",
    "missingDataPolicy",
    "currentVisualizationIssue",
  ]) {
    if (contract[key] === undefined || contract[key] === null) missing.push(key);
  }
  if (contract.mapLinkage === undefined || contract.mapLinkage === null) {
    missing.push("mapLinkage");
  }
  return missing.length ? [{ elementId: contract.elementId, missing }] : [];
});
audit.check(
  "CONTRACT_SCHEMA",
  malformedContracts.length === 0,
  malformedContracts.length,
  0,
  malformedContracts.slice(0, 50)
);

const catalogById = new Map(catalog.map((element) => [element.elementId, element]));
const unassignedContracts = contracts.filter(
  (contract) =>
    !allowedRenderers.has(contract.primaryRenderer) ||
    /unknown|generic|unassigned/iu.test(String(contract.primaryRenderer))
);
audit.check(
  "UNASSIGNED_CONTRACT_COUNT",
  unassignedContracts.length === 0,
  unassignedContracts.length,
  0,
  unassignedContracts.map((contract) => contract.elementId)
);

const populatedStatusOnly = contracts.flatMap((contract) => {
  const element = catalogById.get(contract.elementId);
  const populated =
    element &&
    ["actual-records", "partial-records"].includes(element.dataPresenceStatus) &&
    Number(element.observationCount || 0) + Number(element.entityCount || 0) > 0;
  return populated && contract.primaryRenderer === "status-only"
    ? [contract.elementId]
    : [];
});
audit.check(
  "POPULATED_ELEMENT_PRIMARY_RENDERER",
  populatedStatusOnly.length === 0,
  populatedStatusOnly.length,
  0,
  populatedStatusOnly
);

const noDataFakeCharts = contracts.flatMap((contract) => {
  const element = catalogById.get(contract.elementId);
  if (!element) return [];
  const noData =
    !["actual-records", "partial-records"].includes(element.dataPresenceStatus) ||
    Number(element.observationCount || 0) + Number(element.entityCount || 0) === 0;
  return noData && contract.primaryRenderer !== "status-only"
    ? [{ elementId: contract.elementId, renderer: contract.primaryRenderer }]
    : [];
});
audit.check(
  "NO_DATA_ELEMENT_FAKE_CHART_COUNT",
  noDataFakeCharts.length === 0,
  noDataFakeCharts.length,
  0,
  noDataFakeCharts
);

const packData = loadPackPayloads();
audit.check(
  "SOURCE_PACK_INTEGRITY",
  packData.errors.length === 0 && packData.elements.size === 152,
  { elements: packData.elements.size, errors: packData.errors.length },
  { elements: 152, errors: 0 },
  packData.errors
);
audit.check(
  "SEMANTIC_DETAIL_ASSETS",
  semanticAssetFailures.length === 0 && Object.keys(semanticByElement).length === 152,
  {
    loaded: Object.keys(semanticByElement).length,
    failed: semanticAssetFailures.length,
  },
  { loaded: 152, failed: 0 },
  semanticAssetFailures
);

const missingSemanticElementIds = arrayDifference(catalogIds, semanticIds);
const unknownSemanticElementIds = arrayDifference(semanticIds, catalogIds);
audit.check(
  "SEMANTIC_ELEMENT_COVERAGE",
  missingSemanticElementIds.length === 0 && unknownSemanticElementIds.length === 0,
  {
    missing: missingSemanticElementIds.length,
    unknown: unknownSemanticElementIds.length,
  },
  { missing: 0, unknown: 0 },
  { missingSemanticElementIds, unknownSemanticElementIds }
);

const allowedUnitFamilies = new Set([
  "count",
  "percent",
  "currency",
  "currency-per-period",
  "energy",
  "capacity",
  "emissions",
  "area",
  "score",
  "text",
  "boolean",
  "other",
]);
const semanticProblems = [];
const missingRawIndicatorSemantics = [];
const unknownSemanticIndicators = [];
const duplicateVisibleLabels = [];
const mixedUnitSeries = [];
const duplicateSourceIndicatorFailures = [];
const semanticContractMismatches = [];
const recordOverrideFailures = [];
let rawIndicatorCount = 0;
let semanticIndicatorCount = 0;
let sourceObservationCount = 0;

for (const elementId of catalogIds) {
  const payload = packData.elements.get(elementId);
  const rawIndicators = Array.isArray(payload?.meta?.indicators)
    ? payload.meta.indicators
    : [];
  const rawGroups = new Map();
  for (const indicator of rawIndicators) {
    const group = rawGroups.get(indicator.indicatorId) || [];
    group.push(indicator);
    rawGroups.set(indicator.indicatorId, group);
  }
  const rawById = new Map(
    [...rawGroups.entries()].map(([indicatorId, group]) => [indicatorId, group[0]])
  );
  rawIndicatorCount += rawById.size;
  const semanticEntry = semanticByElement[elementId];
  const semanticIndicators = Array.isArray(semanticEntry?.indicators)
    ? semanticEntry.indicators
    : [];
  semanticIndicatorCount += semanticIndicators.length;
  const sourceObservations = payloadRecords(payload?.observations);
  sourceObservationCount += sourceObservations.length;
  const semanticById = new Map();
  const visibleLabelSeries = new Map();
  const unitFamilyBySeries = new Map();

  const contract = contracts.find((item) => item.elementId === elementId);
  const semanticMeasureKeys = uniqueStrings(semanticEntry?.measures);
  const contractMeasureKeys = uniqueStrings(contract?.measures);
  const semanticDimensionMap = new Map(
    (semanticEntry?.dimensions || []).map((dimension) => [
      dimension.key,
      uniqueStrings(dimension.values),
    ])
  );
  const contractDimensionMap = new Map(
    (contract?.dimensions || []).map((dimension) => [
      dimension.key,
      uniqueStrings(dimension.values),
    ])
  );
  const semanticUnitFamilies = uniqueStrings(
    (semanticEntry?.measures || []).map((measure) => measure.unitFamily)
  );
  const contractUnitFamilies = uniqueStrings(contract?.unitFamilies);
  const contractProblems = [];
  if (JSON.stringify(semanticMeasureKeys) !== JSON.stringify(contractMeasureKeys)) {
    contractProblems.push("measure keys");
  }
  if (
    JSON.stringify([...semanticDimensionMap.keys()].sort()) !==
    JSON.stringify([...contractDimensionMap.keys()].sort())
  ) {
    contractProblems.push("dimension keys");
  }
  for (const [key, values] of semanticDimensionMap.entries()) {
    if (JSON.stringify(values) !== JSON.stringify(contractDimensionMap.get(key) || [])) {
      contractProblems.push(`dimension values:${key}`);
    }
  }
  if (JSON.stringify(semanticUnitFamilies) !== JSON.stringify(contractUnitFamilies)) {
    contractProblems.push("unit families");
  }
  for (const selector of contract?.selectors || []) {
    const allowedValues =
      selector.key === "measure"
        ? semanticMeasureKeys
        : semanticDimensionMap.get(selector.key) || [];
    const selectorValues = uniqueStrings(selector.values);
    if (
      selectorValues.length === 0 ||
      selectorValues.some((value) => !allowedValues.includes(value)) ||
      !selectorValues.includes(String(selector.defaultValue))
    ) {
      contractProblems.push(`selector:${selector.key}`);
    }
  }
  if (
    !uniqueStrings(contract?.tooltipFields).includes("dimensionLabels") ||
    !uniqueStrings(contract?.tableColumns).includes("displayLabel")
  ) {
    contractProblems.push("dimension/measure visibility");
  }
  if (contractProblems.length) {
    semanticContractMismatches.push({ elementId, problems: contractProblems });
  }

  const sourceObservationById = new Map(
    sourceObservations.map((record) => [record.recordId, record])
  );
  const overrideIds = new Set();
  for (const override of semanticEntry?.records || []) {
    const sourceRecord = sourceObservationById.get(override.recordId);
    const problems = [];
    if (overrideIds.has(override.recordId)) problems.push("duplicate recordId");
    overrideIds.add(override.recordId);
    if (!sourceRecord) problems.push("source record missing");
    if (sourceRecord && sourceRecord.indicatorId !== override.indicatorId) {
      problems.push("indicatorId mismatch");
    }
    if (!override.dimensions || Object.keys(override.dimensions).length === 0) {
      problems.push("empty override dimensions");
    }
    if (!isNonEmptyString(override.displayLabel)) problems.push("displayLabel");
    if (!isNonEmptyString(override.seriesKey)) problems.push("seriesKey");
    if (problems.length) {
      recordOverrideFailures.push({ elementId, recordId: override.recordId, problems });
    }
  }

  for (const semantic of semanticIndicators) {
    if (semanticById.has(semantic.indicatorId)) {
      semanticProblems.push({ elementId, indicatorId: semantic.indicatorId, issue: "duplicate semantic indicator" });
      continue;
    }
    semanticById.set(semantic.indicatorId, semantic);
    const raw = rawById.get(semantic.indicatorId);
    if (!raw) {
      unknownSemanticIndicators.push({ elementId, indicatorId: semantic.indicatorId });
      continue;
    }
    const dimensions = semantic.dimensions;
    const dimensionLabels = semantic.dimensionLabels;
    const measureKey = semantic.measure?.key ?? semantic.semanticMeasure?.key ?? semantic.measure;
    const unitFamily =
      semantic.measure?.unitFamily ?? semantic.semanticMeasure?.unitFamily ?? semantic.unitFamily;
    const semanticUnit =
      semantic.measure?.unit ?? semantic.semanticMeasure?.unit ?? semantic.unit;
    const missing = [];
    if (!isNonEmptyString(measureKey)) missing.push("measure");
    if (!dimensions || Array.isArray(dimensions) || typeof dimensions !== "object") {
      missing.push("dimensions");
    }
    if (!dimensionLabels || Array.isArray(dimensionLabels) || typeof dimensionLabels !== "object") {
      missing.push("dimensionLabels");
    }
    if (!isNonEmptyString(semantic.displayLabel)) missing.push("displayLabel");
    if (!isNonEmptyString(semantic.seriesKey)) missing.push("seriesKey");
    if (!allowedUnitFamilies.has(unitFamily)) missing.push("unitFamily");
    const rawGroup = rawGroups.get(semantic.indicatorId) || [raw];
    if (!rawGroup.some((candidate) => semantic.sourceLabel === candidate.labelKo)) {
      missing.push("sourceLabelNotPreserved");
    }
    const expectedSourceNote = raw.missingNote || raw.caveat || null;
    if (rawGroup.length === 1 && (semantic.sourceNote ?? null) !== expectedSourceNote) {
      missing.push("sourceNoteNotPreserved");
    }
    if (semanticUnit !== raw.unit) missing.push("unitNotPreserved");
    const rawProvenance = raw.provenance || {};
    const semanticProvenance = semantic.sourceProvenance || semantic.provenance || {};
    for (const key of [
      "elementId",
      "indicatorId",
      "sourceFileDecoded",
      "sourceRow",
      "sourceSheet",
    ]) {
      if (
        rawGroup.length === 1 &&
        (semanticProvenance[key] ?? null) !== (rawProvenance[key] ?? null)
      ) {
        missing.push(`sourceProvenance:${key}`);
      }
    }
    if (dimensions && dimensionLabels) {
      for (const [key, value] of Object.entries(dimensions)) {
        if (!isNonEmptyString(key) || !isNonEmptyString(String(value))) {
          missing.push(`dimension:${key || "empty"}`);
        }
        if (!isNonEmptyString(dimensionLabels[key])) {
          missing.push(`dimensionLabel:${key}`);
        }
      }
    }
    if (missing.length) {
      semanticProblems.push({ elementId, indicatorId: semantic.indicatorId, missing });
    }
    const label = String(semantic.displayLabel || "");
    const seriesKey = String(semantic.seriesKey || "");
    if (!visibleLabelSeries.has(label)) visibleLabelSeries.set(label, new Set());
    visibleLabelSeries.get(label).add(seriesKey);
    if (!unitFamilyBySeries.has(seriesKey)) unitFamilyBySeries.set(seriesKey, new Set());
    unitFamilyBySeries.get(seriesKey).add(unitFamily);
  }

  for (const indicatorId of rawById.keys()) {
    if (!semanticById.has(indicatorId)) {
      missingRawIndicatorSemantics.push({ elementId, indicatorId });
    }
  }
  for (const [indicatorId, rawGroup] of rawGroups.entries()) {
    if (rawGroup.length <= 1) continue;
    const sourceRecords = payloadRecords(payload?.observations).filter(
      (record) => record.indicatorId === indicatorId
    );
    const overrides = (semanticEntry?.records || []).filter(
      (record) => record.indicatorId === indicatorId
    );
    const displayLabels = new Set(overrides.map((record) => record.displayLabel));
    const seriesKeys = new Set(overrides.map((record) => record.seriesKey));
    const dimensionVariants = new Map();
    for (const override of overrides) {
      for (const [key, value] of Object.entries(override.dimensions || {})) {
        const values = dimensionVariants.get(key) || new Set();
        values.add(value);
        dimensionVariants.set(key, values);
      }
    }
    const hasDistinguishingDimension = [...dimensionVariants.values()].some(
      (values) => values.size === rawGroup.length
    );
    const visibleEvidence = overrides
      .map((record) =>
        [record.displayLabel, ...Object.values(record.dimensionLabels || {})].join(" ")
      )
      .join(" ");
    const recordIds = new Set(sourceRecords.map((record) => record.recordId));
    const overrideIds = new Set(overrides.map((record) => record.recordId));
    const complete =
      sourceRecords.length === rawGroup.length &&
      overrides.length === sourceRecords.length &&
      [...recordIds].every((recordId) => overrideIds.has(recordId)) &&
      displayLabels.size === rawGroup.length &&
      seriesKeys.size === rawGroup.length &&
      hasDistinguishingDimension &&
      /(?:댐 건설 전|pre[- ]?dam)/iu.test(visibleEvidence) &&
      /(?:댐 건설 후|post[- ]?dam)/iu.test(visibleEvidence);
    if (!complete) {
      duplicateSourceIndicatorFailures.push({
        elementId,
        indicatorId,
        sourceMetadataRows: rawGroup.length,
        sourceRecords: sourceRecords.length,
        overrides: overrides.length,
        displayLabelCount: displayLabels.size,
        seriesKeyCount: seriesKeys.size,
        dimensions: Object.fromEntries(
          [...dimensionVariants.entries()].map(([key, values]) => [key, [...values]])
        ),
      });
    }
  }
  for (const [label, seriesKeys] of visibleLabelSeries.entries()) {
    if (label && seriesKeys.size > 1) {
      duplicateVisibleLabels.push({ elementId, displayLabel: label, seriesKeys: [...seriesKeys] });
    }
  }
  for (const [seriesKey, families] of unitFamilyBySeries.entries()) {
    if (seriesKey && families.size > 1) {
      mixedUnitSeries.push({ elementId, seriesKey, unitFamilies: [...families] });
    }
  }
}

audit.check(
  "INDICATOR_SEMANTIC_RECONCILIATION",
  missingRawIndicatorSemantics.length === 0 &&
    unknownSemanticIndicators.length === 0 &&
    semanticIndicatorCount === rawIndicatorCount,
  {
    rawIndicatorCount,
    semanticIndicatorCount,
    missing: missingRawIndicatorSemantics.length,
    unknown: unknownSemanticIndicators.length,
  },
  {
    semanticIndicatorCount: "= rawIndicatorCount",
    missing: 0,
    unknown: 0,
  },
  {
    missing: missingRawIndicatorSemantics.slice(0, 50),
    unknown: unknownSemanticIndicators.slice(0, 50),
  }
);
audit.check(
  "SEMANTIC_ROW_SCHEMA_AND_PROVENANCE",
  semanticProblems.length === 0,
  semanticProblems.length,
  0,
  semanticProblems.slice(0, 100)
);
audit.check(
  "SEMANTIC_CONTRACT_SELECTOR_RECONCILIATION",
  semanticContractMismatches.length === 0,
  semanticContractMismatches.length,
  0,
  semanticContractMismatches.slice(0, 100)
);
audit.check(
  "SPARSE_RECORD_OVERRIDE_INTEGRITY",
  recordOverrideFailures.length === 0,
  recordOverrideFailures.length,
  0,
  recordOverrideFailures.slice(0, 100)
);
audit.check(
  "DUPLICATE_SOURCE_INDICATOR_OVERRIDES",
  duplicateSourceIndicatorFailures.length === 0,
  duplicateSourceIndicatorFailures.length,
  0,
  duplicateSourceIndicatorFailures
);
audit.check(
  "DUPLICATE_VISIBLE_SERIES_LABEL_COUNT",
  duplicateVisibleLabels.length === 0,
  duplicateVisibleLabels.length,
  0,
  duplicateVisibleLabels.slice(0, 100)
);
audit.check(
  "MIXED_UNIT_SERIES_COUNT",
  mixedUnitSeries.length === 0,
  mixedUnitSeries.length,
  0,
  mixedUnitSeries
);

const missingPolicyFailures = contracts.flatMap((contract) => {
  const policyText = JSON.stringify(contract.missingDataPolicy ?? "");
  const explicitlyPreservesMissing =
    /preserv|missing|null|not[- ]?collected|no[- ]?data|결측|미제공|미수집|공란/iu.test(
      policyText
    );
  const explicitlyImputesZero =
    /(?:impute|replace|convert|fill|대체|변환|채움)[^}]{0,30}(?:zero|0)/iu.test(
      policyText
    ) &&
    !/(?:never|do not|without|금지|않|없)[^}]{0,30}(?:zero|0)/iu.test(policyText);
  return !explicitlyPreservesMissing || explicitlyImputesZero
    ? [{ elementId: contract.elementId, missingDataPolicy: contract.missingDataPolicy }]
    : [];
});
audit.check(
  "ZERO_IMPUTATION_POLICY",
  missingPolicyFailures.length === 0,
  missingPolicyFailures.length,
  0,
  missingPolicyFailures.slice(0, 50)
);

function metric(document, names, fallback = undefined) {
  for (const name of names) {
    if (document && Object.prototype.hasOwnProperty.call(document, name)) {
      return document[name];
    }
  }
  for (const containerName of ["summary", "metrics", "counts", "result", "e012", "E-012"]) {
    const container = document?.[containerName];
    if (container && typeof container === "object") {
      for (const name of names) {
        if (Object.prototype.hasOwnProperty.call(container, name)) return container[name];
      }
    }
  }
  return fallback;
}

const integrity = integrityResult.value || {};
const integrityMetrics = {
  contractCount: Number(metric(integrity, ["contractCount", "elementContractCount"], -1)),
  unassigned: Number(metric(integrity, ["unassignedContractCount", "unassigned"], -1)),
  semanticLoss: Number(metric(integrity, ["semanticDimensionLossCount", "semanticDimensionLoss"], -1)),
  duplicateLabels: Number(metric(integrity, ["duplicateVisibleLabelCount", "duplicateVisibleLabels"], -1)),
  mixedUnits: Number(metric(integrity, ["mixedUnitAxisCount", "mixedUnitAxis"], -1)),
  zeroImputation: Number(metric(integrity, ["zeroImputationCount", "zeroImputation"], -1)),
  reconciliation: String(metric(integrity, ["recordReconciliation"], "")),
  sourceObservations: Number(metric(integrity, ["sourceObservationCount"], -1)),
  semanticObservations: Number(metric(integrity, ["semanticObservationCount"], -1)),
};
audit.check(
  "SEMANTIC_INTEGRITY_COUNTERS",
  integrityMetrics.contractCount === 152 &&
    integrityMetrics.unassigned === 0 &&
    integrityMetrics.semanticLoss === 0 &&
    integrityMetrics.duplicateLabels === 0 &&
    integrityMetrics.mixedUnits === 0 &&
    integrityMetrics.zeroImputation === 0 &&
    integrityMetrics.sourceObservations === sourceObservationCount &&
    integrityMetrics.semanticObservations === sourceObservationCount &&
    /^PASS$/iu.test(integrityMetrics.reconciliation),
  integrityMetrics,
  {
    contractCount: 152,
    unassigned: 0,
    semanticLoss: 0,
    duplicateLabels: 0,
    mixedUnits: 0,
    zeroImputation: 0,
    sourceObservations: sourceObservationCount,
    semanticObservations: sourceObservationCount,
    reconciliation: "PASS",
  }
);

const E012_MEASURES = [
  "average_monthly_wage",
  "employed_persons",
  "employment_rate",
  "occupation_employment_count",
  "occupation_employment_share",
  "occupation_female_share",
  "occupation_wage",
].sort();
const E012_OCCUPATIONS = [
  "manager",
  "professional",
  "technician",
  "clerk",
  "service_sales",
  "skilled_agriculture",
  "craft",
  "machine_operator",
  "elementary",
  "other",
].sort();
const E012_SEXES = ["total", "male", "female"].sort();
const occupationCodeMap = {
  mgr: "manager",
  prof: "professional",
  tech: "technician",
  clerk: "clerk",
  service: "service_sales",
  agri: "skilled_agriculture",
  craft: "craft",
  operator: "machine_operator",
  elem: "elementary",
  other: "other",
  all: "all",
};
const occupationNoteLabels = {
  mgr: "관리자",
  prof: "전문가",
  tech: "기술공·준전문가",
  clerk: "사무직",
  service: "서비스·판매직",
  agri: "농림어업 숙련직",
  craft: "기능원·관련직",
  operator: "장치·기계 조작·조립원",
  elem: "단순노무직",
  other: "기타·미정의",
  all: "합계",
};
const sexNoteLabels = { total: "전체", male: "남성", female: "여성" };
const e012Semantics = Array.isArray(semanticByElement["E-012"]?.indicators)
  ? semanticByElement["E-012"].indicators
  : [];
const e012ById = new Map(e012Semantics.map((item) => [item.indicatorId, item]));
const e012Measures = uniqueStrings(
  e012Semantics.map((item) => item.measure?.key ?? item.semanticMeasure?.key ?? item.measure)
);
const e012Occupations = uniqueStrings(
  e012Semantics.map((item) => item.dimensions?.occupation)
).filter((value) => value !== "all");
const e012Sexes = uniqueStrings(e012Semantics.map((item) => item.dimensions?.sex));
const e012YearsFromSemantic = uniqueStrings(
  (semanticByElement["E-012"]?.dimensions || [])
    .find((dimension) => dimension.key === "year")
    ?.values || []
);

audit.check(
  "E012_MEASURE_KEYS",
  JSON.stringify(e012Measures) === JSON.stringify(E012_MEASURES),
  e012Measures,
  E012_MEASURES
);
audit.check(
  "E012_OCCUPATION_DIMENSION_COUNT",
  JSON.stringify(e012Occupations) === JSON.stringify(E012_OCCUPATIONS),
  e012Occupations,
  E012_OCCUPATIONS
);
audit.check(
  "E012_SEX_DIMENSION_COUNT",
  JSON.stringify(e012Sexes) === JSON.stringify(E012_SEXES),
  e012Sexes,
  E012_SEXES
);

const e012Payload = packData.elements.get("E-012");
const e012Observations = payloadRecords(e012Payload?.observations);
const e012PatternFailures = [];
const occupationPattern =
  /^E-012_occupation_(employment_share|employment|female_share|wage)_([a-z]+)(?:_(total|male|female))?$/u;
for (const observation of e012Observations) {
  const match = occupationPattern.exec(observation.indicatorId);
  if (!match) continue;
  const [, rawMeasure, occupationCode, sexCode] = match;
  const expectedOccupation = occupationCodeMap[occupationCode];
  const expectedMeasure = {
    employment: "occupation_employment_count",
    employment_share: "occupation_employment_share",
    female_share: "occupation_female_share",
    wage: "occupation_wage",
  }[rawMeasure];
  const semantic = e012ById.get(observation.indicatorId);
  const actualMeasure =
    semantic?.measure?.key ?? semantic?.semanticMeasure?.key ?? semantic?.measure;
  const problems = [];
  if (!expectedOccupation) problems.push("unknown occupation ID token");
  if (!semantic) problems.push("semantic mapping missing");
  if (semantic?.dimensions?.occupation !== expectedOccupation) {
    problems.push("occupation dimension mismatch");
  }
  if (actualMeasure !== expectedMeasure) problems.push("measure mismatch");
  if (sexCode && semantic?.dimensions?.sex !== sexCode) {
    problems.push("sex dimension mismatch");
  }
  if (!String(observation.note || "").includes(occupationNoteLabels[occupationCode] || "\u0000")) {
    problems.push("occupation note mismatch");
  }
  if (
    sexCode &&
    !String(observation.note || "").includes(`성별: ${sexNoteLabels[sexCode]}`)
  ) {
    problems.push("sex note mismatch");
  }
  if (problems.length) {
    e012PatternFailures.push({
      recordId: observation.recordId,
      indicatorId: observation.indicatorId,
      problems,
    });
  }
}
audit.check(
  "E012_INDICATOR_ID_NOTE_MATCH",
  e012PatternFailures.length === 0,
  e012PatternFailures.length,
  0,
  e012PatternFailures
);

const e012SemanticMissing = e012Observations.filter(
  (row) => !e012ById.has(row.indicatorId)
);
audit.check(
  "E012_RECORD_SEMANTIC_RECONCILIATION",
  e012Observations.length === 91 && e012SemanticMissing.length === 0,
  { sourceRecords: e012Observations.length, missingSemanticRows: e012SemanticMissing.length },
  { sourceRecords: 91, missingSemanticRows: 0 },
  e012SemanticMissing.map((row) => row.recordId)
);
const otherWageMissing = e012Observations.filter(
  (row) =>
    /^E-012_occupation_wage_other_(?:total|male|female)$/u.test(row.indicatorId) &&
    row.value === null
);
audit.check(
  "E012_OTHER_WAGE_MISSING_SOURCE_ROWS",
  otherWageMissing.length === 3 &&
    otherWageMissing.every(
      (row) => row.missingReasonCode === "M01" && /원천 미제공/u.test(row.note || "")
    ),
  otherWageMissing.map((row) => ({
    indicatorId: row.indicatorId,
    missingReasonCode: row.missingReasonCode,
  })),
  "3 M01 rows explicitly labelled 원천 미제공"
);

const e012Integrity = integrity.e012 || integrity["E-012"] || {};
const integrityMeasureKeys = uniqueStrings(
  e012Integrity.measureKeys || e012Integrity.measures
);
const integrityOccupations = uniqueStrings(
  e012Integrity.occupations || e012Integrity.rankedOccupations
).filter((value) => value !== "all");
const integritySexes = uniqueStrings(e012Integrity.sexes || e012Integrity.sexDimensions);
const integrityYears = uniqueStrings(e012Integrity.years || e012Integrity.yearDimensions);
const e012IntegrityResult = {
  measureKeys: integrityMeasureKeys,
  occupations: integrityOccupations,
  sexes: integritySexes,
  years: integrityYears,
  idNoteMismatchCount: Number(
    e012Integrity.idNoteMismatchCount ?? e012Integrity.indicatorNoteMismatchCount ?? -1
  ),
  missingOtherWageLabelled:
    e012Integrity.missingOtherWageLabelled ?? e012Integrity.wageMissingForOtherLabelled,
  totalRowSeparated: e012Integrity.totalRowSeparated,
  tableRecordReconciliation:
    e012Integrity.tableRecordReconciliation ?? e012Integrity.tableReconciliation,
};
audit.check(
  "E012_INTEGRITY_CONTRACT",
  JSON.stringify(integrityMeasureKeys) === JSON.stringify(E012_MEASURES) &&
    JSON.stringify(integrityOccupations) === JSON.stringify(E012_OCCUPATIONS) &&
    JSON.stringify(integritySexes) === JSON.stringify(E012_SEXES) &&
    JSON.stringify(integrityYears) === JSON.stringify(["2023", "2024"]) &&
    e012IntegrityResult.idNoteMismatchCount === 0 &&
    e012IntegrityResult.missingOtherWageLabelled === true &&
    e012IntegrityResult.totalRowSeparated === true &&
    /^PASS$/iu.test(String(e012IntegrityResult.tableRecordReconciliation)),
  e012IntegrityResult,
  {
    measureKeys: E012_MEASURES,
    occupations: E012_OCCUPATIONS,
    sexes: E012_SEXES,
    years: ["2023", "2024"],
    idNoteMismatchCount: 0,
    missingOtherWageLabelled: true,
    totalRowSeparated: true,
    tableRecordReconciliation: "PASS",
  }
);

const requiredReports = [
  "element-visualization-audit-v125.csv",
  "semantic-dimension-audit-v125.json",
  "duplicate-visible-label-audit-v125.json",
  "mixed-unit-axis-audit-v125.json",
  "visualization-contract-coverage-v125.json",
];
const reportProblems = [];
for (const fileName of requiredReports) {
  const path = resolve(REPORT_ROOT, fileName);
  if (!existsSync(path) || !statSync(path).isFile() || statSync(path).size === 0) {
    reportProblems.push({ fileName, error: "missing or empty" });
    continue;
  }
  if (fileName.endsWith(".json")) {
    const result = readJson(path);
    if (result.error) reportProblems.push({ fileName, error: result.error });
  }
}
const csvResult = readText(resolve(REPORT_ROOT, requiredReports[0]));
let csvRows = [];
try {
  csvRows = csvResult.error ? [] : parseCsv(csvResult.value);
} catch (error) {
  reportProblems.push({
    fileName: requiredReports[0],
    error: error instanceof Error ? error.message : String(error),
  });
}
const csvIds = csvRows
  .map((row) => row.elementId || row.element_id || row["﻿element_id"])
  .filter(Boolean)
  .sort();
audit.check(
  "SEMANTIC_AUDIT_REPORTS",
  reportProblems.length === 0 &&
    csvRows.length === 152 &&
    JSON.stringify(csvIds) === JSON.stringify(catalogIds),
  { files: requiredReports.length - reportProblems.length, csvRows: csvRows.length },
  { files: 5, csvRows: 152 },
  reportProblems
);

audit.finish({
  elementContractCount: contracts.length,
  semanticIndicatorCount,
  sourceObservationCount,
  semanticDimensionLossCount: integrityMetrics.semanticLoss,
  duplicateVisibleLabelCount: duplicateVisibleLabels.length,
  mixedUnitAxisCount: integrityMetrics.mixedUnits,
  zeroImputationCount: integrityMetrics.zeroImputation,
  e012MeasureCount: e012Measures.length,
  e012OccupationCount: e012Occupations.length,
  e012SexDimensionCount: e012Sexes.length,
  e012SourceRecordCount: e012Observations.length,
});
