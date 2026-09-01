#!/usr/bin/env node

import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  AuditV125,
  PROJECT_ROOT,
  V2_ROOT,
  catalogElements,
  readJson,
  visualizationContracts,
} from "./v125/audit-utils.mjs";
import {
  V129_REPORT_ROOT,
  benchmarkItemsV129,
  detailUrlV129,
  finishAuditV129,
  interpretationItemsV129,
  normalizeTextV129,
  readFirstJsonV129,
} from "./v129/audit-helpers.mjs";
import {
  evaluateValue,
  launchHeadlessBrowser,
  navigate,
  setViewport,
  startStaticBuildServer,
  waitForValue,
} from "./v125/browser-runtime.mjs";

const audit = new AuditV125("semantic-fit:v129");
const FIXED_GENERATED_AT = "2026-09-01T00:00:00.000Z";
const CSV_COLUMNS = [
  "elementId",
  "publicTitle",
  "dataType",
  "primaryRenderer",
  "specializedRenderer",
  "measureCount",
  "dimensionCount",
  "unitFamilies",
  "explanationRequired",
  "interpretationStatus",
  "directionStatus",
  "scaleStatus",
  "benchmarkStatus",
  "continuousTimeSeriesEligible",
  "sameDenominatorAcrossSeries",
  "sameMethodologyAcrossTime",
  "sameGeographyAcrossTime",
  "missingValuePolicy",
  "mapLinked",
  "mapAggregationLevel",
  "tooltipStatus",
  "publicCopyStatus",
  "visualizationFitResult",
  "finalDisposition",
];

const REPRESENTATIVE_NON_OBVIOUS_ELEMENTS = new Set([
  "A-001",
  "A-002",
  "A-008",
  "A-013",
  "A-014",
  "B-021",
  "C-019",
  "D-005",
  "E-007",
  "E-014",
]);
const ALLOWED_DIRECTIONS = new Set([
  "higher-better",
  "higher-worse",
  "lower-rank-better",
  "neutral",
  "context-dependent",
]);
const ALLOWED_BENCHMARK_TYPES = new Set([
  "official-band",
  "global-percentile",
  "national-percentile",
  "group-rank",
  "none",
]);
const TIME_RENDERERS = new Set([
  "score-trend",
  "kpi-trend",
  "multi-metric-trend",
  "composition-trend",
  "stacked-emissions",
  "scenario-comparison",
  "seasonality",
]);
const TECHNICAL_PUBLIC_TOKEN =
  /(?:\bV12[4-9]\b|semantic|renderer|recordId|indicatorId|sourceSheet|sourceRow|MultiLineString|MapLibre|publicationDecision|downloadEligible)/iu;
const NON_OBVIOUS_NAME_PATTERN =
  /(?:지수|점수|등급|순위|취약성|준비도|거버넌스|신뢰도|집약도|복합\s*지표|시나리오|전망|\bindex\b|\bscore\b|\brank(?:ing)?\b|readiness|vulnerab)/iu;
const SEMANTIC_TO_PUBLIC_RENDERER = Object.freeze({
  "kpi-trend": "kpi-trend",
  "multi-metric-trend": "multi-metric-trend",
  composition: "composition-trend",
  "category-comparison": "technology-comparison",
  "paired-category-comparison": "technology-comparison",
  "score-benchmark": "score-trend",
  "scenario-range": "scenario-comparison",
  seasonality: "seasonality",
  portfolio: "portfolio-dashboard",
  directory: "directory",
  "policy-timeline": "policy-timeline",
  "evidence-matrix": "evidence-matrix",
  "capability-scorecard": "capability-scorecard",
  "document-library": "structured-table",
  "spatial-summary": "spatial-analysis",
  "structured-table": "structured-table",
  "status-only": "status-only",
});
const SPECIALIZED_COMPONENTS = Object.freeze({
  "A-002": "CpiaPolicyCapacityAnalysisV126",
  "D-005": "ClimateBudgetAllocationAnalysisV129",
  "E-012": "OccupationEmploymentWagePreviewV125",
});

const catalogResult = readJson(resolve(V2_ROOT, "catalog.json"));
const contractResult = readJson(
  resolve(V2_ROOT, "semantic/element-visualization-contracts-v125.json")
);
const integrityResult = readJson(
  resolve(V2_ROOT, "semantic/semantic-integrity-v125.json")
);
const manifestResult = readJson(resolve(V2_ROOT, "manifest.json"));
const coverageResult = readJson(resolve(V2_ROOT, "framework-coverage.json"));
const mapIndexResult = readJson(resolve(V2_ROOT, "map-index.json"));
const acceptanceResult = readJson(
  resolve(PROJECT_ROOT, "reports/v128/vietnam-data-release-acceptance-v128.json")
);
const interpretationResult = readFirstJsonV129([
  resolve(V2_ROOT, "interpretation/indicator-interpretation-v129.json"),
  resolve(V2_ROOT, "interpretation/indicator-interpretations-v129.json"),
]);
const benchmarkResult = readJson(
  resolve(V2_ROOT, "interpretation/indicator-benchmarks-v129.json")
);

const catalog = catalogElements(catalogResult.value);
const contracts = visualizationContracts(contractResult.value);
const mapLayers = Array.isArray(mapIndexResult.value?.layers)
  ? mapIndexResult.value.layers
  : [];
const interpretations = interpretationItemsV129(interpretationResult.value);
const benchmarks = benchmarkItemsV129(benchmarkResult.value);
const acceptedElements = Array.isArray(acceptanceResult.value?.elements)
  ? acceptanceResult.value.elements
  : [];
const contractByElement = new Map(
  contracts.map((contract) => [contract.elementId, contract])
);
const mapByElement = new Map(mapLayers.map((layer) => [layer.elementId, layer]));
const acceptanceByElement = new Map(
  acceptedElements.map((element) => [element.elementId, element])
);
const interpretationByElement = new Map();
for (const interpretation of interpretations) {
  const items = interpretationByElement.get(interpretation.elementId) || [];
  items.push(interpretation);
  interpretationByElement.set(interpretation.elementId, items);
}

const publicRegistryPath = resolve(
  PROJECT_ROOT,
  "src/data/visualization/publicVisualizationRegistryV126.ts"
);
const publicRouterPath = resolve(
  PROJECT_ROOT,
  "src/components/data/public/PublicDataAnalysisRouterV126.tsx"
);
const semanticRendererPath = resolve(
  PROJECT_ROOT,
  "src/components/data/semantic/SemanticContractRendererV125.tsx"
);
const semanticArchetypePath = resolve(
  PROJECT_ROOT,
  "src/components/data/semantic/SemanticArchetypePreviewV125.tsx"
);
const registrySource = readFileSync(publicRegistryPath, "utf8");
const routerSource = readFileSync(publicRouterPath, "utf8");
const semanticRendererSource = readFileSync(semanticRendererPath, "utf8");
const semanticArchetypeSource = readFileSync(semanticArchetypePath, "utf8");

function sourceBlock(source, pattern) {
  return source.match(pattern)?.[1] || "";
}

const specializedBlock = sourceBlock(
  registrySource,
  /const\s+SPECIALIZED_ELEMENTS_V126\s*=\s*new\s+Set\(\[([\s\S]*?)\]\);/u
);
const specializedIds = new Set(
  [...specializedBlock.matchAll(/"([A-E]-\d{3})"/gu)].map(
    (match) => match[1]
  )
);
const overrideBlock = sourceBlock(
  registrySource,
  /const\s+ELEMENT_RENDERER_OVERRIDES_V126[\s\S]*?=\s*\{([\s\S]*?)\n\};/u
);
const rendererOverrides = new Map(
  [...overrideBlock.matchAll(/"([A-E]-\d{3})"\s*:\s*"([a-z-]+)"/gu)].map(
    (match) => [match[1], match[2]]
  )
);
const denominatorIsolationBlock = sourceBlock(
  registrySource,
  /const\s+PUBLIC_SINGLE_DENOMINATOR_DIMENSIONS_V129[\s\S]*?=\s*Object\.freeze\(\{([\s\S]*?)\n\}\);/u
);
const denominatorIsolationByElement = new Map(
  [...denominatorIsolationBlock.matchAll(
    /"([A-E]-\d{3})"\s*:\s*Object\.freeze\(\[([^\]]*)\]\)/gu
  )].map((match) => [
    match[1],
    [...match[2].matchAll(/"([A-Za-z0-9_-]+)"/gu)].map(
      (keyMatch) => keyMatch[1]
    ),
  ])
);
const registryMappingParityFailures = Object.entries(
  SEMANTIC_TO_PUBLIC_RENDERER
).filter(([sourceRenderer, publicRenderer]) => {
  const sourceKey = /^[a-z]+$/u.test(sourceRenderer)
    ? `(?:"${sourceRenderer}"|${sourceRenderer})`
    : `"${sourceRenderer}"`;
  const sourcePattern = new RegExp(
    `${sourceKey}\\s*:\\s*"${publicRenderer}"`,
    "u"
  );
  return !sourcePattern.test(registrySource);
});

function effectiveRenderer(elementId, contract) {
  return (
    rendererOverrides.get(elementId) ||
    SEMANTIC_TO_PUBLIC_RENDERER[contract?.primaryRenderer] ||
    ""
  );
}

function csvCell(value) {
  const normalized = Array.isArray(value)
    ? value.join(" | ")
    : value === null || value === undefined
    ? ""
    : String(value);
  return /[",\r\n]/u.test(normalized)
    ? `"${normalized.replaceAll('"', '""')}"`
    : normalized;
}

function validScale(scale) {
  return (
    Number.isFinite(Number(scale?.minimum)) &&
    Number.isFinite(Number(scale?.maximum)) &&
    Number(scale.minimum) < Number(scale.maximum) &&
    normalizeTextV129(scale?.minimumLabel).length > 0 &&
    normalizeTextV129(scale?.maximumLabel).length > 0
  );
}

function scaleApplies(interpretation) {
  if (interpretation?.scaleApplicable === false) return false;
  if (interpretation?.scaleApplicable === true || validScale(interpretation?.scale)) {
    return true;
  }
  return (
    interpretation?.benchmarkType === "official-band" ||
    /(?:GVI|CPIA|지니계수|SDG\s*지수|0\s*[–~-]\s*100|1\s*[–~-]\s*6)/iu.test(
      `${interpretation?.publicName || ""} ${interpretation?.directionLabel || ""}`
    )
  );
}

function isValidInterpretation(item) {
  const bullets = Array.isArray(item?.meaningBullets) ? item.meaningBullets : [];
  const publicText = [
    item?.publicName,
    item?.publicUnit,
    item?.directionLabel,
    ...bullets,
  ].join(" ");
  return (
    item?.explanationRequired === true &&
    normalizeTextV129(item.publicName).length > 0 &&
    bullets.length >= 2 &&
    bullets.length <= 4 &&
    bullets.every((bullet) => normalizeTextV129(bullet).length > 0) &&
    ALLOWED_DIRECTIONS.has(item.direction) &&
    normalizeTextV129(item.directionLabel).length > 0 &&
    ALLOWED_BENCHMARK_TYPES.has(item.benchmarkType) &&
    !TECHNICAL_PUBLIC_TOKEN.test(publicText)
  );
}

function automaticExplanationRequired(element, contract) {
  const title = normalizeTextV129(element?.elementLabel).split("[")[0];
  const measures = Array.isArray(contract?.measures) ? contract.measures : [];
  const scoreLikeMeasure = measures.some((measure) => {
    const unit = normalizeTextV129(measure?.unit);
    const label = normalizeTextV129(measure?.labelKo);
    return (
      measure?.unitFamily === "score" ||
      /^(?:점|점수|지수|등급|위)$/u.test(unit) ||
      (/(?:지수|점수|등급|순위|집약도)/u.test(label) &&
        !["count", "currency", "text"].includes(measure?.unitFamily))
    );
  });
  const titleRequiresExplanation =
    NON_OBVIOUS_NAME_PATTERN.test(title) &&
    !(
      /(?:보증|기관|사업|시설|협정)$/u.test(title) &&
      measures.every((measure) =>
        ["count", "currency", "text"].includes(measure?.unitFamily)
      )
    );
  return (
    REPRESENTATIVE_NON_OBVIOUS_ELEMENTS.has(element?.elementId) ||
    scoreLikeMeasure ||
    titleRequiresExplanation
  );
}

function denominatorCandidates(contract) {
  const values = (Array.isArray(contract?.dimensions) ? contract.dimensions : [])
    .flatMap((dimension) =>
      Array.isArray(dimension?.values) ? dimension.values : []
    )
    .map(normalizeTextV129)
    .filter((value) => /대비\s*(?:비중|비율|점유율)/u.test(value))
    .map((value) => normalizeTextV129(value.replace(/\s*대비[\s\S]*$/u, "")))
    .filter(Boolean);
  return [...new Set(values)].sort((left, right) =>
    left.localeCompare(right, "ko")
  );
}

function denominatorDimensionKeys(contract) {
  return (Array.isArray(contract?.dimensions) ? contract.dimensions : [])
    .filter((dimension) => {
      const candidates = (Array.isArray(dimension?.values)
        ? dimension.values
        : []
      )
        .map(normalizeTextV129)
        .filter((value) => /대비\s*(?:비중|비율|점유율)/u.test(value))
        .map((value) =>
          normalizeTextV129(value.replace(/\s*대비[\s\S]*$/u, ""))
        );
      return new Set(candidates).size > 1;
    })
    .map((dimension) => dimension.key);
}

function sameDenominatorAcrossSeries(contract) {
  const proportionData = (contract?.unitFamilies || []).some((family) =>
    ["percent", "currency-per-period", "emissions"].includes(family)
  );
  if (!proportionData) return null;
  return denominatorCandidates(contract).length <= 1;
}

function sameMethodologyAcrossTime(contract, elementInterpretations) {
  const contractText = JSON.stringify({
    measures: contract?.measures || [],
    dimensions: contract?.dimensions || [],
  });
  const interpretationText = elementInterpretations
    .flatMap((item) => [
      item.publicName,
      item.directionLabel,
      ...(item.meaningBullets || []),
    ])
    .join(" ");
  return !(
    /(?:이전\s*방법론|구\s*척도)/u.test(contractText) ||
    /(?:보고서\s*판이\s*다른|서로\s*다른\s*기관|방법론이\s*다른)/u.test(
      interpretationText
    )
  );
}

function benchmarkStatus(elementInterpretations) {
  const required = elementInterpretations.filter(
    (item) => item?.explanationRequired === true
  );
  if (required.length === 0) return "not-required";
  const statuses = required.map((item) => {
    if (item.benchmarkType === "none") return "not-applicable";
    if (item.benchmarkType === "group-rank") {
      return normalizeTextV129(item.benchmarkScope)
        ? "group-scope-declared"
        : "group-scope-missing";
    }
    const evidence = benchmarks.find(
      (benchmark) =>
        benchmark.elementId === item.elementId &&
        (!item.variableKey || !benchmark.variableKey ||
          benchmark.variableKey === item.variableKey)
    );
    if (evidence?.available === false) return "unavailable-without-claim";
    if (evidence?.official === true && evidence?.sourceUrl) {
      return "official-source-declared";
    }
    return "evidence-missing";
  });
  return [...new Set(statuses)].sort().join(" | ");
}

function publicMapLabel(variable) {
  const label = normalizeTextV129(variable?.label);
  if (variable?.key === "gvi-6") return label.split(/\s*—\s*/u)[0];
  return label.replace(/^구성지표\s*—\s*/u, "");
}

function mapVariableMismatches(layer, elementInterpretations) {
  const variables = Array.isArray(layer?.selectors?.variables)
    ? layer.selectors.variables
    : [];
  const missingPublicFields = variables.filter(
    (variable) =>
      !normalizeTextV129(variable?.key) ||
      !normalizeTextV129(variable?.label) ||
      !normalizeTextV129(variable?.unit)
  );
  if (layer?.elementId !== "B-021") return missingPublicFields;
  return [
    ...missingPublicFields,
    ...variables.filter((variable) => {
      const interpretation = elementInterpretations.find(
        (item) => item.variableKey === variable.key
      );
      if (!interpretation) return true;
      const expectedUnit = normalizeTextV129(interpretation.publicUnit);
      const sourceUnit = normalizeTextV129(variable.unit);
      const unitMatches =
        variable.key === "gvi-6"
          ? expectedUnit === "0–100 지수" && sourceUnit === "지수"
          : expectedUnit === sourceUnit;
      return (
        publicMapLabel(variable) !== normalizeTextV129(interpretation.publicName) ||
        !unitMatches
      );
    }),
  ];
}

function mapAggregationLevel(layer, elementInterpretations) {
  if (!layer) return null;
  if (layer.elementId === "B-021") {
    const gvi = elementInterpretations.find((item) => item.variableKey === "gvi-6");
    return normalizeTextV129(gvi?.aggregationLevel) || "";
  }
  if (layer.renderer === "admin1-choropleth") return "베트남 ADM1 63개 성·시";
  if (layer.renderer === "partial-choropleth") return "값이 있는 ADM1 지역";
  if (layer.renderer === "cluster" || layer.renderer === "point") {
    return "시설·사업 위치";
  }
  if (layer.renderer === "line") return "송전망 구간";
  return "";
}

function specializedReady(elementId) {
  const component = SPECIALIZED_COMPONENTS[elementId];
  return (
    specializedIds.has(elementId) &&
    Boolean(component) &&
    routerSource.includes(component) &&
    routerSource.includes(`elementId === "${elementId}"`)
  );
}

const matrix = catalog.map((element) => {
  const contract = contractByElement.get(element.elementId);
  const accepted = acceptanceByElement.get(element.elementId);
  const layer = mapByElement.get(element.elementId);
  const elementInterpretations = interpretationByElement.get(element.elementId) || [];
  const requiredInterpretations = elementInterpretations.filter(
    (item) => item?.explanationRequired === true
  );
  const explanationRequired =
    requiredInterpretations.length > 0 ||
    automaticExplanationRequired(element, contract);
  const interpretationComplete =
    !explanationRequired ||
    (requiredInterpretations.length > 0 &&
      requiredInterpretations.every(isValidInterpretation));
  const directionComplete =
    !explanationRequired ||
    requiredInterpretations.every(
      (item) =>
        ALLOWED_DIRECTIONS.has(item.direction) &&
        normalizeTextV129(item.directionLabel).length > 0
    );
  const scaleEntries = requiredInterpretations.filter(scaleApplies);
  const scaleComplete = scaleEntries.every((item) => validScale(item.scale));
  const publicRenderer = effectiveRenderer(element.elementId, contract);
  const specializedRenderer = specializedIds.has(element.elementId)
    ? SPECIALIZED_COMPONENTS[element.elementId] || "unregistered-specialized-component"
    : null;
  const hasYearSeries = (contract?.dimensions || []).some(
    (dimension) =>
      dimension?.key === "year" && Number(dimension?.valueCount || 0) >= 2
  );
  const continuousTimeSeriesEligible =
    Number(contract?.populatedRecordCount || 0) > 0 &&
    hasYearSeries &&
    TIME_RENDERERS.has(publicRenderer) &&
    !["D-005", "E-012"].includes(element.elementId);
  const denominatorComparable = sameDenominatorAcrossSeries(contract);
  const denominatorRiskDimensionKeys = denominatorDimensionKeys(contract);
  const configuredIsolationKeys =
    denominatorIsolationByElement.get(element.elementId) || [];
  const denominatorAxisIsolated =
    denominatorComparable !== false ||
    (configuredIsolationKeys.length > 0 &&
      configuredIsolationKeys.every((key) =>
        (contract?.dimensions || []).some(
          (dimension) =>
            dimension.key === key && Number(dimension.valueCount || 0) > 1
        )
      ) &&
      denominatorRiskDimensionKeys.every((key) =>
        configuredIsolationKeys.includes(key)
      ) &&
      semanticArchetypeSource.includes("singleDenominatorDimensionKeys") &&
      semanticArchetypeSource.includes("populatedDefault") &&
      semanticArchetypeSource.includes("isPopulatedSemanticRowV125"));
  const methodologyComparable = sameMethodologyAcrossTime(
    contract,
    elementInterpretations
  );
  const regionAggregation = elementInterpretations.some(
    (item) =>
      normalizeTextV129(item?.aggregationNotice).length > 0 &&
      /성\s*단위\s*독립\s*추정값이\s*아닙니다/u.test(item.aggregationNotice)
  );
  const geographyComparable = !regionAggregation;
  const mapMismatches = layer
    ? mapVariableMismatches(layer, elementInterpretations)
    : [];
  const tooltipFields = Array.isArray(contract?.tooltipFields)
    ? contract.tooltipFields
    : [];
  const tooltipCovered =
    publicRenderer === "status-only" ||
    (layer
      ? mapMismatches.length === 0
      : tooltipFields.length > 0 &&
        (tooltipFields.includes("value") || Number(contract?.entityCount || 0) > 0));
  const publicTitle = normalizeTextV129(
    accepted?.publicTitle || element?.elementLabel
  );
  const publicInterpretationText = elementInterpretations
    .flatMap((item) => [
      item.publicName,
      item.publicUnit,
      item.directionLabel,
      ...(item.meaningBullets || []),
    ])
    .join(" ");
  const publicCopySafe =
    publicTitle.length > 0 &&
    !TECHNICAL_PUBLIC_TOKEN.test(publicTitle) &&
    !TECHNICAL_PUBLIC_TOKEN.test(publicInterpretationText);
  const compositionValues = (contract?.dimensions || [])
    .flatMap((dimension) =>
      dimension?.key === "category" && Array.isArray(dimension.values)
        ? dimension.values
        : []
    )
    .map(normalizeTextV129);
  const compositionOverlapRisk =
    /composition/u.test(String(contract?.primaryRenderer || "")) &&
    compositionValues.some((value) => /광공업|industry.*construction/iu.test(value)) &&
    compositionValues.some((value) => /제조업|manufactur/iu.test(value));
  const compositionOverlapProtected =
    !compositionOverlapRisk ||
    (/hasBroadIndustry/u.test(semanticRendererSource) &&
      /hasManufacturingSubset/u.test(semanticRendererSource) &&
      /중복하지\s*않습니다/u.test(semanticRendererSource));
  const noZeroImputation =
    contract?.missingDataPolicy ===
    "preserve-null-show-source-reason-never-impute-zero";
  const dataBearing = Number(contract?.populatedRecordCount || 0) > 0;
  const statusOnly = contract?.dataPresenceStatus === "not-collected" || !dataBearing;
  const statusOnlySafe = statusOnly
    ? publicRenderer === "status-only" && !specializedRenderer
    : publicRenderer !== "status-only";
  const mixedDenominatorAxis =
    denominatorComparable === false &&
    !denominatorAxisIsolated &&
    !specializedReady(element.elementId);
  const methodologySelectorProtected =
    methodologyComparable ||
    specializedReady(element.elementId) ||
    Number(contract?.measures?.length || 0) > 1 ||
    (contract?.selectors || []).some((selector) =>
      /scenario|시나리오|기관|출처|detail|세부/u.test(
        `${selector?.key || ""} ${selector?.labelKo || ""}`
      )
    );
  const geographyDisclosureProtected =
    geographyComparable ||
    elementInterpretations.some(
      (item) =>
        normalizeTextV129(item?.aggregationLevel).length > 0 &&
        normalizeTextV129(item?.aggregationNotice).length > 0
    );
  const meaninglessKpiOnly =
    dataBearing &&
    (!publicRenderer || publicRenderer === "status-only" ||
      (publicRenderer === "kpi-trend" &&
        Number(contract?.observationCount || 0) > 1 &&
        !hasYearSeries &&
        Number(contract?.dimensions?.length || 0) === 0));
  const violations = [];
  if (!contract) violations.push("visualization-contract-missing");
  if (!publicRenderer) violations.push("public-renderer-missing");
  if (specializedRenderer && !specializedReady(element.elementId)) {
    violations.push("specialized-renderer-not-wired");
  }
  if (!interpretationComplete) violations.push("interpretation-missing");
  if (!directionComplete) violations.push("direction-missing");
  if (!scaleComplete) violations.push("scale-missing");
  if (!noZeroImputation) violations.push("zero-imputation-policy");
  if (!statusOnlySafe) violations.push("status-only-renderer-mismatch");
  if (mixedDenominatorAxis) violations.push("mixed-denominator-axis");
  if (!methodologySelectorProtected) violations.push("inappropriate-trend");
  if (!geographyDisclosureProtected) violations.push("spatial-unit-comparison");
  if (!compositionOverlapProtected) violations.push("composition-overlap");
  if (meaninglessKpiOnly) violations.push("meaningless-kpi-only");
  if (mapMismatches.length > 0) violations.push("map-variable-unit-mismatch");
  if (!tooltipCovered) violations.push("tooltip-contract-missing");
  if (!publicCopySafe) violations.push("public-copy-unsafe");
  if (
    contract?.comparisonPolicy !==
    "compare-only-with-identical-measure-unit-dimensions-and-period"
  ) {
    violations.push("comparison-policy-missing");
  }

  let visualizationFitResult = "fit";
  if (violations.length > 0) visualizationFitResult = "fail";
  else if (statusOnly) visualizationFitResult = "status-only";
  else if (specializedRenderer) visualizationFitResult = "specialized-required";
  else if (
    denominatorComparable === false ||
    !methodologyComparable ||
    !geographyComparable ||
    Number(contract?.missingRecordCount || 0) > 0 ||
    requiredInterpretations.some(
      (item) => item.direction === "context-dependent"
    )
  ) {
    visualizationFitResult = "fit-with-caveat";
  }

  const finalDisposition =
    visualizationFitResult === "fail"
      ? `blocked:${violations.join("|")}`
      : visualizationFitResult === "status-only"
      ? "accepted-status-explanation-without-fake-chart"
      : visualizationFitResult === "specialized-required"
      ? "accepted-specialized-public-analysis"
      : visualizationFitResult === "fit-with-caveat"
      ? "accepted-with-explicit-comparability-caveat"
      : "accepted-public-analysis";

  return {
    elementId: element.elementId,
    publicTitle,
    dataType: [...new Set(element.dataTypes || [])].sort(),
    primaryRenderer: publicRenderer,
    specializedRenderer,
    measureCount: Number(contract?.measures?.length || 0),
    dimensionCount: Number(contract?.dimensions?.length || 0),
    unitFamilies: [...new Set(contract?.unitFamilies || [])].sort(),
    explanationRequired,
    interpretationStatus: explanationRequired
      ? interpretationComplete
        ? "covered"
        : "missing"
      : "not-required",
    directionStatus: explanationRequired
      ? directionComplete
        ? "covered"
        : "missing"
      : "not-required",
    scaleStatus:
      scaleEntries.length === 0
        ? "not-applicable"
        : scaleComplete
        ? "covered"
        : "missing",
    benchmarkStatus: benchmarkStatus(elementInterpretations),
    continuousTimeSeriesEligible,
    sameDenominatorAcrossSeries: denominatorComparable,
    sameMethodologyAcrossTime: methodologyComparable,
    sameGeographyAcrossTime: geographyComparable,
    missingValuePolicy: contract?.missingDataPolicy || "missing",
    mapLinked: Boolean(layer),
    mapAggregationLevel: mapAggregationLevel(layer, elementInterpretations),
    tooltipStatus: tooltipCovered ? "covered" : "missing",
    publicCopyStatus: publicCopySafe ? "approved" : "fail",
    visualizationFitResult,
    finalDisposition,
  };
});

const duplicateCatalogIds = catalog
  .map((element) => element.elementId)
  .filter((elementId, index, values) => values.indexOf(elementId) !== index);
const duplicateContractIds = contracts
  .map((contract) => contract.elementId)
  .filter((elementId, index, values) => values.indexOf(elementId) !== index);
const duplicateMatrixIds = matrix
  .map((element) => element.elementId)
  .filter((elementId, index, values) => values.indexOf(elementId) !== index);
const failedRows = matrix.filter(
  (row) => row.visualizationFitResult === "fail"
);
const acceptedRows = matrix.filter(
  (row) => row.visualizationFitResult !== "fail"
);
const missingAutomaticInterpretations = matrix.filter(
  (row) => row.explanationRequired && row.interpretationStatus !== "covered"
);
const missingDirections = matrix.filter(
  (row) => row.directionStatus === "missing"
);
const missingScales = matrix.filter((row) => row.scaleStatus === "missing");
const inappropriateTrends = matrix.filter((row) =>
  row.finalDisposition.includes("inappropriate-trend")
);
const mixedDenominatorAxes = matrix.filter((row) =>
  row.finalDisposition.includes("mixed-denominator-axis")
);
const compositionOverlapFailures = matrix.filter((row) =>
  row.finalDisposition.includes("composition-overlap")
);
const statusOnlyFailures = matrix.filter((row) =>
  row.finalDisposition.includes("status-only-renderer-mismatch")
);
const mapUnitFailures = matrix.filter((row) =>
  row.finalDisposition.includes("map-variable-unit-mismatch")
);
const meaninglessKpiFailures = matrix.filter((row) =>
  row.finalDisposition.includes("meaningless-kpi-only")
);
const representativeCoverage = [...REPRESENTATIVE_NON_OBVIOUS_ELEMENTS].map(
  (elementId) => {
    const row = matrix.find((item) => item.elementId === elementId);
    return {
      elementId,
      explanationRequired: row?.explanationRequired === true,
      interpretationStatus: row?.interpretationStatus || "missing",
    };
  }
);
const requiredEntryCount = interpretations.filter(
  (item) => item?.explanationRequired === true
).length;
const requiredCoveredEntryCount = interpretations.filter(isValidInterpretation).length;
const fitCounts = Object.fromEntries(
  ["fit", "fit-with-caveat", "specialized-required", "status-only", "fail"].map(
    (status) => [
      status,
      matrix.filter((row) => row.visualizationFitResult === status).length,
    ]
  )
);

let runtimeFailure = null;
let b013Runtime = null;
const d010Runtime = [];
let server = null;
let browser = null;
try {
  server = await startStaticBuildServer(resolve(PROJECT_ROOT, "build"));
  browser = await launchHeadlessBrowser();
  await setViewport(browser.cdp, 1440, 1000);
  await navigate(browser.cdp, detailUrlV129(server.url, "B-013"));
  await waitForValue(
    browser.cdp,
    `Boolean(document.querySelector('[data-testid="public-analytical-view"]'))`,
    { timeoutMs: 30_000 }
  );
  b013Runtime = await evaluateValue(
    browser.cdp,
    `(() => {
      const root = document.querySelector('[data-testid="public-analytical-view"]');
      const selector = root?.querySelector('select[data-public-dimension-key="detail"]');
      return {
        mounted: Boolean(root),
        selectorValue: selector instanceof HTMLSelectElement ? selector.value : '',
        emptyOptionCount: selector instanceof HTMLSelectElement
          ? [...selector.options].filter((option) => option.value === '').length
          : -1,
        trendChartCount: root?.querySelectorAll('[data-chart-interaction-v127="true"]').length || 0,
        comparisonItemCount: root?.querySelectorAll('[data-chart-interactive-item="true"]').length || 0,
      };
    })()`
  );

  await navigate(browser.cdp, detailUrlV129(server.url, "D-010"));
  await waitForValue(
    browser.cdp,
    `Boolean(document.querySelector('[data-testid="public-analytical-view"]'))`,
    { timeoutMs: 30_000 }
  );
  const measureKeys = await evaluateValue(
    browser.cdp,
    `(() => {
      const selector = document.querySelector('[data-testid="v125-measure-select"]');
      return selector instanceof HTMLSelectElement
        ? [...selector.options].map((option) => option.value)
        : [];
    })()`
  );
  for (const measureKey of measureKeys || []) {
    const changed = await evaluateValue(
      browser.cdp,
      `(() => {
        const selector = document.querySelector('[data-testid="v125-measure-select"]');
        if (!(selector instanceof HTMLSelectElement)) return false;
        selector.value = ${JSON.stringify(measureKey)};
        selector.dispatchEvent(new Event('change', { bubbles: true }));
        return true;
      })()`
    );
    if (!changed) throw new Error(`D-010 measure unavailable: ${measureKey}`);
    await waitForValue(
      browser.cdp,
      `(() => {
        const selector = document.querySelector('select[data-public-dimension-key="category"]');
        return selector instanceof HTMLSelectElement && selector.value.length > 0;
      })()`,
      { timeoutMs: 10_000 }
    );
    d010Runtime.push(
      await evaluateValue(
        browser.cdp,
        `(() => {
          const root = document.querySelector('[data-testid="public-analytical-view"]');
          const measure = root?.querySelector('[data-testid="v125-measure-select"]');
          const category = root?.querySelector('select[data-public-dimension-key="category"]');
          const charts = [...(root?.querySelectorAll('[data-chart-interaction-v127="true"]') || [])];
          return {
            measure: measure instanceof HTMLSelectElement ? measure.value : '',
            category: category instanceof HTMLSelectElement ? category.value : '',
            emptyOptionCount: category instanceof HTMLSelectElement
              ? [...category.options].filter((option) => option.value === '').length
              : -1,
            chartCount: charts.length,
            units: charts.map((chart) => chart.querySelector('[data-testid="chart-unit-label"]')?.textContent?.trim() || ''),
          };
        })()`
      )
    );
  }
} catch (error) {
  runtimeFailure = error instanceof Error ? error.message : String(error);
} finally {
  if (browser) await browser.close();
  if (server) await server.close();
}

const denominatorRuntimePass =
  runtimeFailure === null &&
  b013Runtime?.mounted === true &&
  b013Runtime?.selectorValue &&
  b013Runtime?.emptyOptionCount === 0 &&
  b013Runtime?.trendChartCount === 0 &&
  Number(b013Runtime?.comparisonItemCount || 0) > 0 &&
  d010Runtime.length === 3 &&
  d010Runtime.every(
    (snapshot) =>
      snapshot.measure &&
      snapshot.category &&
      snapshot.emptyOptionCount === 0 &&
      new Set(snapshot.units).size <= 1
  );
const summary = {
  frameworkElementCount: Number(manifestResult.value?.frameworkElements || 0),
  accountedElementCount: Number(coverageResult.value?.accountedElementCount || 0),
  unexplainedElementCount: Number(manifestResult.value?.unexplainedElements || 0),
  matrixElementCount: matrix.length,
  visualizationFitCount: acceptedRows.length,
  visualizationFitFailureCount: failedRows.length,
  fitCounts,
  specializedRendererCount: matrix.filter((row) => row.specializedRenderer).length,
  interpretationRequiredCount: requiredEntryCount,
  interpretationCoveredCount: requiredCoveredEntryCount,
  interpretationCoverage:
    requiredEntryCount === 0
      ? "100%"
      : `${Math.round((requiredCoveredEntryCount / requiredEntryCount) * 100)}%`,
  unexplainedIndexCount: missingAutomaticInterpretations.length,
  missingDirectionCount: missingDirections.length,
  missingScaleCount: missingScales.length,
  inappropriateTrendCount: inappropriateTrends.length,
  mixedDenominatorAxisCount: mixedDenominatorAxes.length,
  compositionOverlapFailureCount: compositionOverlapFailures.length,
  statusOnlyFakeChartCount: statusOnlyFailures.length,
  meaninglessKpiOnlyCount: meaninglessKpiFailures.length,
  variableUnitMismatchCount: mapUnitFailures.length,
  zeroImputationCount: Number(integrityResult.value?.zeroImputationCount ?? -1),
};

mkdirSync(V129_REPORT_ROOT, { recursive: true });
const jsonReportPath = resolve(
  V129_REPORT_ROOT,
  "visualization-semantic-fit-v129.json"
);
const csvReportPath = resolve(
  V129_REPORT_ROOT,
  "visualization-semantic-fit-v129.csv"
);
writeFileSync(
  jsonReportPath,
  `${JSON.stringify(
    {
      schemaVersion: "v129-visualization-semantic-fit-1",
      generatedAt: FIXED_GENERATED_AT,
      sourceOfTruth: [
        "/data/vietnam/v2/manifest.json",
        "/data/vietnam/v2/catalog.json",
        "/data/vietnam/v2/framework-coverage.json",
        "/data/vietnam/v2/semantic/element-visualization-contracts-v125.json",
        "/data/vietnam/v2/semantic/semantic-integrity-v125.json",
        "/data/vietnam/v2/interpretation/indicator-interpretation-v129.json",
        "/data/vietnam/v2/map-index.json",
      ],
      summary,
      elements: matrix,
    },
    null,
    2
  )}\n`,
  "utf8"
);
writeFileSync(
  csvReportPath,
  `${[
    CSV_COLUMNS.join(","),
    ...matrix.map((row) =>
      CSV_COLUMNS.map((column) => csvCell(row[column])).join(",")
    ),
  ].join("\n")}\n`,
  "utf8"
);

const sourceJsonErrors = [
  catalogResult,
  contractResult,
  integrityResult,
  manifestResult,
  coverageResult,
  mapIndexResult,
  acceptanceResult,
  interpretationResult,
  benchmarkResult,
]
  .filter((result) => result.error)
  .map((result) => ({ path: result.path, error: result.error }));
audit.check("SOURCE_JSON", sourceJsonErrors.length === 0, sourceJsonErrors, []);
audit.check("FRAMEWORK_ELEMENTS", summary.frameworkElementCount === 152, summary.frameworkElementCount, 152);
audit.check("ACCOUNTED_ELEMENTS", summary.accountedElementCount === 152, summary.accountedElementCount, 152);
audit.check("UNEXPLAINED_ELEMENTS", summary.unexplainedElementCount === 0, summary.unexplainedElementCount, 0);
audit.check(
  "CATALOG_CONTRACT_MATRIX_COVERAGE",
  catalog.length === 152 &&
    contracts.length === 152 &&
    matrix.length === 152 &&
    duplicateCatalogIds.length === 0 &&
    duplicateContractIds.length === 0 &&
    duplicateMatrixIds.length === 0,
  {
    catalog: catalog.length,
    contracts: contracts.length,
    matrix: matrix.length,
    duplicateCatalogIds,
    duplicateContractIds,
    duplicateMatrixIds,
  },
  { catalog: 152, contracts: 152, matrix: 152, duplicates: 0 }
);
audit.check(
  "PUBLIC_RENDERER_REGISTRY_PARITY",
  registryMappingParityFailures.length === 0,
  registryMappingParityFailures,
  []
);
audit.check(
  "REPRESENTATIVE_NON_OBVIOUS_COVERAGE",
  representativeCoverage.every(
    (item) =>
      item.explanationRequired && item.interpretationStatus === "covered"
  ),
  representativeCoverage,
  [...REPRESENTATIVE_NON_OBVIOUS_ELEMENTS].map((elementId) => ({
    elementId,
    explanationRequired: true,
    interpretationStatus: "covered",
  }))
);
audit.check(
  "NON_OBVIOUS_EXPLANATION_COVERAGE",
  requiredEntryCount > 0 &&
    requiredCoveredEntryCount === requiredEntryCount &&
    missingAutomaticInterpretations.length === 0,
  {
    requiredEntryCount,
    requiredCoveredEntryCount,
    missingElements: missingAutomaticInterpretations.map((row) => row.elementId),
  },
  { coverage: "100%", missingElements: [] }
);
audit.check("MISSING_DIRECTION", missingDirections.length === 0, missingDirections.map((row) => row.elementId), []);
audit.check("MISSING_SCALE", missingScales.length === 0, missingScales.map((row) => row.elementId), []);
audit.check(
  "VISUALIZATION_FIT",
  acceptedRows.length === 152 && failedRows.length === 0,
  { accepted: acceptedRows.length, failed: failedRows.length, failures: failedRows },
  { accepted: 152, failed: 0 }
);
audit.check("INAPPROPRIATE_TREND", inappropriateTrends.length === 0, inappropriateTrends.map((row) => row.elementId), []);
audit.check("MIXED_DENOMINATOR_AXIS", mixedDenominatorAxes.length === 0, mixedDenominatorAxes.map((row) => row.elementId), []);
audit.check(
  "DENOMINATOR_SELECTOR_RUNTIME",
  denominatorRuntimePass,
  { runtimeFailure, b013Runtime, d010Runtime },
  {
    runtimeFailure: null,
    b013: "single denominator selector, comparison only",
    d010: "3 measures, one denominator category at a time",
  }
);
audit.check("COMPOSITION_OVERLAP", compositionOverlapFailures.length === 0, compositionOverlapFailures.map((row) => row.elementId), []);
audit.check("ZERO_IMPUTATION", summary.zeroImputationCount === 0, summary.zeroImputationCount, 0);
audit.check("STATUS_ONLY_FAKE_CHART", statusOnlyFailures.length === 0, statusOnlyFailures.map((row) => row.elementId), []);
audit.check("MEANINGLESS_KPI_ONLY", meaninglessKpiFailures.length === 0, meaninglessKpiFailures.map((row) => row.elementId), []);
audit.check("MAP_VARIABLE_UNIT_MISMATCH", mapUnitFailures.length === 0, mapUnitFailures.map((row) => row.elementId), []);
audit.check(
  "SPECIALIZED_RENDERER_WIRING",
  Object.keys(SPECIALIZED_COMPONENTS).every(
    (elementId) => specializedReady(elementId)
  ) && summary.specializedRendererCount === 3,
  {
    specializedIds: [...specializedIds].sort(),
    ready: Object.fromEntries(
      Object.keys(SPECIALIZED_COMPONENTS).map((elementId) => [
        elementId,
        specializedReady(elementId),
      ])
    ),
    count: summary.specializedRendererCount,
  },
  { count: 3, allReady: true }
);
audit.check(
  "SEMANTIC_INTEGRITY",
  integrityResult.value?.recordReconciliation === "PASS" &&
    Number(integrityResult.value?.mixedUnitAxisCount) === 0 &&
    Number(integrityResult.value?.semanticDimensionLossCount) === 0,
  {
    recordReconciliation: integrityResult.value?.recordReconciliation,
    mixedUnitAxisCount: integrityResult.value?.mixedUnitAxisCount,
    semanticDimensionLossCount: integrityResult.value?.semanticDimensionLossCount,
  },
  {
    recordReconciliation: "PASS",
    mixedUnitAxisCount: 0,
    semanticDimensionLossCount: 0,
  }
);

finishAuditV129(audit, "semantic-fit-audit-v129.json", {
  ...summary,
  reportFiles: [
    "reports/v129/visualization-semantic-fit-v129.csv",
    "reports/v129/visualization-semantic-fit-v129.json",
  ],
});
