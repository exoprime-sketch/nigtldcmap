#!/usr/bin/env node

import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import {
  PROJECT_ROOT,
  V2_ROOT,
  catalogElements,
  loadPackPayloads,
  payloadRecords,
  readJson,
  visualizationContracts,
} from "./v125/audit-utils.mjs";
import {
  BENCHMARKS_V132,
  V132_GENERATED_AT,
  V132_REPORT_ROOT,
  normalizeTextV132,
  writeCsvV132,
  writeJsonV132,
} from "./v132/audit-helpers.mjs";

const catalogResult = readJson(resolve(V2_ROOT, "catalog.json"));
const contractResult = readJson(
  resolve(V2_ROOT, "semantic/element-visualization-contracts-v125.json")
);
const fitResult = readJson(
  resolve(PROJECT_ROOT, "reports/v129/visualization-semantic-fit-v129.json")
);
const acceptanceResult = readJson(
  resolve(PROJECT_ROOT, "reports/v128/vietnam-data-release-acceptance-v128.json")
);

for (const [name, result] of Object.entries({
  catalog: catalogResult,
  contracts: contractResult,
  semanticFit: fitResult,
  acceptance: acceptanceResult,
})) {
  if (result.error) throw new Error(`${name}: ${result.error}`);
}

const catalog = catalogElements(catalogResult.value);
const contracts = visualizationContracts(contractResult.value);
const fitRows = Array.isArray(fitResult.value?.elements)
  ? fitResult.value.elements
  : [];
const acceptanceRows = Array.isArray(acceptanceResult.value?.elements)
  ? acceptanceResult.value.elements
  : [];
const contractById = new Map(contracts.map((item) => [item.elementId, item]));
const fitById = new Map(fitRows.map((item) => [item.elementId, item]));
const acceptanceById = new Map(
  acceptanceRows.map((item) => [item.elementId, item])
);
const pack = loadPackPayloads();

const registrySource = readFileSync(
  resolve(PROJECT_ROOT, "src/data/visualization/publicVisualizationRegistryV126.ts"),
  "utf8"
);
const routerSource = readFileSync(
  resolve(PROJECT_ROOT, "src/components/data/public/PublicDataAnalysisRouterV126.tsx"),
  "utf8"
);

const specializedComponents = Object.freeze({
  "A-002": "CpiaPolicyCapacityAnalysisV126",
  "A-016": "PrimaryEnergyCompositionAnalysisV132",
  "D-005": "ClimateBudgetAllocationAnalysisV129",
  "E-008": "ResearchPatentAnalysisV132",
  "E-012": "OccupationEmploymentWagePreviewV125",
});

const finalRendererOverridesV132 = Object.freeze({
  "B-003": "multi-metric-trend",
  "D-007": "policy-timeline",
});

const benchmarkFor = (elementId, renderer) => {
  if (elementId === "E-008") return BENCHMARKS_V132[5];
  if (renderer === "portfolio-dashboard") return BENCHMARKS_V132[6];
  if (renderer === "spatial-analysis") return BENCHMARKS_V132[4];
  if (renderer === "stacked-emissions") return BENCHMARKS_V132[2];
  if (renderer === "scenario-comparison" || renderer === "seasonality") {
    return BENCHMARKS_V132[3];
  }
  if (renderer === "composition-trend" || renderer === "technology-comparison") {
    return BENCHMARKS_V132[1];
  }
  return BENCHMARKS_V132[0];
};

function publicQuestion(title, renderer) {
  const cleanTitle = normalizeTextV132(title);
  const prompts = {
    "composition-trend": `${cleanTitle}의 절대량과 구성비가 시간에 따라 어떻게 달라졌는가`,
    "stacked-emissions": `${cleanTitle}의 총량과 세부 구성이 시간에 따라 어떻게 달라졌는가`,
    "portfolio-dashboard": `${cleanTitle}의 규모·금액·연도·분야 분포는 어떠한가`,
    "spatial-analysis": `${cleanTitle}이 어느 지역에 분포하고 시간에 따라 어떻게 달라졌는가`,
    "policy-timeline": `${cleanTitle}의 주요 제도 변화는 언제 발생했는가`,
    directory: `${cleanTitle}에서 어떤 기관과 연락망을 찾을 수 있는가`,
    "status-only": `${cleanTitle}의 현재 수집 상태는 무엇인가`,
  };
  return prompts[renderer] || `${cleanTitle}의 핵심 값과 시간 변화는 어떠한가`;
}

function primaryVisualization(elementId, renderer, statusOnly) {
  if (statusOnly) return "상태와 향후 수집방향";
  if (elementId === "A-016") return "에너지원별 절대량 누적영역과 총공급량";
  if (elementId === "E-008") return "논문·특허 연도별 추이";
  const labels = {
    "score-trend": "핵심 점수와 연도별 추이",
    "kpi-trend": "핵심현황과 연도별 추이",
    "multi-metric-trend": "측정항목별 연도 추이",
    "composition-trend": "연도별 구성 변화",
    "stacked-emissions": "총량 추이와 세부 구성",
    "technology-comparison": "기술별 비교",
    "scenario-comparison": "변수·시나리오별 범위와 추이",
    seasonality: "월·계절별 패턴",
    "policy-timeline": "정책 연표",
    "portfolio-dashboard": "사업·재원 요약 대시보드",
    directory: "기관·연락망 탐색",
    "evidence-matrix": "상태·근거 매트릭스",
    "capability-scorecard": "역량 항목별 점수판",
    "spatial-analysis": "지역 분포와 지역별 변화",
    "structured-table": "구조화 비교표",
  };
  return labels[renderer] || "구조화 비교표";
}

function secondaryVisualization(elementId, renderer, statusOnly) {
  if (statusOnly) return "없음";
  if (elementId === "A-016") return "100% 구성비 추이와 선택연도 상세";
  if (elementId === "E-008") return "분야·협력구조 분해와 필터 목록";
  const labels = {
    "composition-trend": "선택연도 구성 상세",
    "stacked-emissions": "최신연도 구성 상세",
    "portfolio-dashboard": "필터 가능한 개별 사업 목록",
    "spatial-analysis": "지역 선택 상세와 원자료 표",
    directory: "필터 가능한 기관 목록",
    "structured-table": "접힌 원자료 표",
  };
  return labels[renderer] || "접힌 원자료 표";
}

function selectorLabels(contract) {
  const selectors = Array.isArray(contract?.selectors) ? contract.selectors : [];
  const labels = selectors
    .filter((item) => Array.isArray(item.values) && item.values.length > 1)
    .map((item) => normalizeTextV132(item.labelKo || item.key))
    .filter(Boolean);
  return [...new Set(labels)];
}

function yearBehavior(contract, renderer, continuousTimeSeriesExpected) {
  const start = Number(contract?.yearRange?.start);
  const end = Number(contract?.yearRange?.end);
  if (!Number.isFinite(start) || !Number.isFinite(end)) return "기간 미기재 또는 비시계열";
  if (start === end) return `${start}년 단면 비교`;
  if (!continuousTimeSeriesExpected) {
    return `${start}–${end}년 비연속 단면·분포 비교`;
  }
  if (["portfolio-dashboard", "directory", "structured-table"].includes(renderer)) {
    return `${start}–${end}년 필터·분포`;
  }
  return `${start}–${end}년 전체 추이와 기간 선택`;
}

function unitBehavior(contract) {
  const measures = Array.isArray(contract?.measures) ? contract.measures : [];
  const units = [...new Set(measures.map((item) => normalizeTextV132(item.unit)).filter(Boolean))];
  if (units.length === 0) return "텍스트 또는 단위 없음";
  if (units.length === 1) return `${units[0]} 단일 축`;
  return `단위별 분리: ${units.join(" · ")}`;
}

function mapBehavior(contract) {
  if (!contract?.mapLinkage?.enabled) return "데이터 상세 분석만 제공";
  const count = Number(contract.mapLinkage.featureCount || 0);
  return `${contract.mapLinkage.mapMode || "공간 분석"} · ${count}개 feature/scope · 지도 선택 연계`;
}

function listBehavior(renderer, entityCount) {
  if (Number(entityCount || 0) <= 0) return "접힌 원자료 표";
  if (renderer === "portfolio-dashboard") return "요약 뒤 필터 가능한 카드·표";
  if (renderer === "directory") return "검색 가능한 기관 카드·표";
  if (renderer === "structured-table") return "구조화 표";
  return "분석 뒤 접힌 개별 목록·원자료 표";
}

const elementRows = catalog.map((element) => {
  const contract = contractById.get(element.elementId) || {};
  const fit = fitById.get(element.elementId) || {};
  const acceptance = acceptanceById.get(element.elementId) || {};
  const renderer =
    finalRendererOverridesV132[element.elementId] ||
    fit.primaryRenderer ||
    "structured-table";
  const statusOnly = renderer === "status-only";
  const specializedRenderer = specializedComponents[element.elementId] || null;
  const benchmark = benchmarkFor(element.elementId, renderer);
  const publicTitle = normalizeTextV132(
    acceptance.publicTitle || element.elementLabel
  );
  const dimensions = Array.isArray(contract.dimensions) ? contract.dimensions : [];
  const measures = Array.isArray(contract.measures) ? contract.measures : [];
  const selectors = selectorLabels(contract);
  const units = [...new Set(measures.map((item) => normalizeTextV132(item.unit)).filter(Boolean))];
  const years = contract.yearRange || { start: null, end: null };
  const payload = pack.elements.get(element.elementId);
  const numericYearsBySeries = new Map();
  payloadRecords(payload?.observations).forEach((row) => {
    if (
      typeof row.value !== "number" ||
      !Number.isFinite(row.value) ||
      !Number.isFinite(Number(row.year))
    ) return;
    const key = `${row.indicatorId || "measure"}|${row.unit || ""}`;
    const bucket = numericYearsBySeries.get(key) || new Set();
    bucket.add(Number(row.year));
    numericYearsBySeries.set(key, bucket);
  });
  const maxComparableYearCount = Math.max(
    0,
    ...Array.from(numericYearsBySeries.values()).map((bucket) => bucket.size)
  );
  const continuousTimeSeriesExpected = Boolean(
    fit.continuousTimeSeriesEligible === true &&
    fit.sameMethodologyAcrossTime !== false &&
    maxComparableYearCount >= 3
  );
  const expectedPrimary = primaryVisualization(element.elementId, renderer, statusOnly);
  const expectedSecondary = secondaryVisualization(element.elementId, renderer, statusOnly);
  const specializedWired = !specializedRenderer ||
    (registrySource.includes(element.elementId) && routerSource.includes(specializedRenderer));
  return {
    elementId: element.elementId,
    publicTitle,
    assignedPrimaryRenderer: renderer,
    firstVisibleAnalysis: expectedPrimary,
    secondaryVisualization: expectedSecondary,
    rawOrEntityListPosition: "분석·유의사항 뒤, 출처·다운로드와 함께 제공",
    measureCount: measures.length,
    measures: measures.map((item) => normalizeTextV132(item.labelKo)).filter(Boolean),
    dimensionCount: dimensions.length,
    dimensions: dimensions.map((item) => normalizeTextV132(item.labelKo)).filter(Boolean),
    units,
    yearRange: Number.isFinite(Number(years.start)) && Number.isFinite(Number(years.end))
      ? `${years.start}–${years.end}`
      : "",
    selectors,
    interpretation: fit.interpretationStatus || "not-required",
    mapLinkage: Boolean(contract.mapLinkage?.enabled),
    runtimeReviewResult: specializedWired ? "awaiting-runtime" : "wiring-fail",
    primaryPublicQuestion: publicQuestion(publicTitle, renderer),
    primaryVisualization: expectedPrimary,
    selectableDimensions: selectors,
    yearBehavior: yearBehavior(contract, renderer, continuousTimeSeriesExpected),
    continuousTimeSeriesExpected,
    maxComparableYearCount,
    unitBehavior: unitBehavior(contract),
    mapBehavior: mapBehavior(contract),
    listTableBehavior: listBehavior(renderer, element.entityCount),
    benchmarkReference: benchmark.platform,
    benchmarkOfficialUrl: benchmark.officialUrl,
    specializedRenderer,
    dataPresenceStatus: element.dataPresenceStatus,
    runtimeVerified: false,
    runtimeEvidence: null,
  };
});

const runtimeReviewColumns = [
  "elementId", "publicTitle", "assignedPrimaryRenderer", "firstVisibleAnalysis",
  "secondaryVisualization", "rawOrEntityListPosition", "measureCount", "measures",
  "dimensionCount", "dimensions", "units", "yearRange", "selectors",
  "interpretation", "mapLinkage", "runtimeReviewResult",
];
const finalContractColumns = [
  "elementId", "publicTitle", "primaryPublicQuestion", "primaryVisualization",
  "secondaryVisualization", "selectableDimensions", "yearBehavior", "unitBehavior",
  "mapBehavior", "listTableBehavior", "benchmarkReference", "runtimeVerified",
];
const benchmarkColumns = [
  "benchmarkType", "platform", "officialUrl", "publicQuestion",
  "analysisPattern", "applicableRenderers", "appliedElementCount", "appliedElements",
];

const benchmarkRows = BENCHMARKS_V132.map((benchmark) => {
  const applied = elementRows
    .filter((row) => row.benchmarkReference === benchmark.platform)
    .map((row) => row.elementId);
  return { ...benchmark, appliedElementCount: applied.length, appliedElements: applied };
});

writeCsvV132(
  resolve(V132_REPORT_ROOT, "external-visualization-benchmark-v132.csv"),
  benchmarkColumns,
  benchmarkRows
);
writeCsvV132(
  resolve(V132_REPORT_ROOT, "element-visualization-runtime-review-v132.csv"),
  runtimeReviewColumns,
  elementRows
);
writeCsvV132(
  resolve(V132_REPORT_ROOT, "final-public-visualization-contract-v132.csv"),
  finalContractColumns,
  elementRows
);

const commonSummary = {
  frameworkElementCount: catalog.length,
  accountedElementCount: elementRows.length,
  runtimeVerifiedCount: 0,
  runtimeFailureCount: elementRows.length,
  specializedRendererCount: elementRows.filter((item) => item.specializedRenderer).length,
  benchmarkTypeCount: BENCHMARKS_V132.length,
};
writeJsonV132(resolve(V132_REPORT_ROOT, "element-visualization-runtime-review-v132.json"), {
  schemaVersion: "v132-runtime-review-1",
  generatedAt: V132_GENERATED_AT,
  summary: commonSummary,
  elements: elementRows,
});
writeJsonV132(resolve(V132_REPORT_ROOT, "final-public-visualization-contract-v132.json"), {
  schemaVersion: "v132-final-public-visualization-contract-1",
  generatedAt: V132_GENERATED_AT,
  benchmarkBasis: BENCHMARKS_V132,
  summary: commonSummary,
  elements: elementRows,
});

console.log(JSON.stringify({
  status: "GENERATED_AWAITING_RUNTIME",
  ...commonSummary,
}, null, 2));
