import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

import { PROJECT_ROOT } from "../v125/audit-utils.mjs";

export const V132_REPORT_ROOT = resolve(PROJECT_ROOT, "reports/v132");
export const V132_SCREENSHOT_ROOT = resolve(V132_REPORT_ROOT, "screenshots");
export const V132_GENERATED_AT = "2026-09-01T00:00:00.000Z";

export function normalizeTextV132(value) {
  return String(value ?? "")
    .normalize("NFC")
    .replace(/\s+/gu, " ")
    .trim();
}

export function readJsonV132(path) {
  try {
    return { value: JSON.parse(readFileSync(path, "utf8")), error: null };
  } catch (error) {
    return {
      value: null,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

export function csvCellV132(value) {
  const normalized = Array.isArray(value)
    ? value.join(" | ")
    : value === null || value === undefined
      ? ""
      : String(value);
  return /[",\r\n]/u.test(normalized)
    ? `"${normalized.replaceAll('"', '""')}"`
    : normalized;
}

export function writeCsvV132(path, columns, rows) {
  const lines = [
    columns.join(","),
    ...rows.map((row) => columns.map((column) => csvCellV132(row[column])).join(",")),
  ];
  mkdirSync(resolve(path, ".."), { recursive: true });
  writeFileSync(path, `${lines.join("\n")}\n`, "utf8");
}

export function writeJsonV132(path, value) {
  mkdirSync(resolve(path, ".."), { recursive: true });
  writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

export function writeAuditV132(fileName, audit, summary, extra = {}) {
  writeJsonV132(resolve(V132_REPORT_ROOT, fileName), {
    schemaVersion: "v132-public-visualization-audit-1",
    generatedAt: V132_GENERATED_AT,
    audit: audit.name,
    status: summary.status,
    summary,
    checks: audit.checks,
    ...extra,
  });
}

export function finishAuditV132(audit, fileName, extra = {}) {
  const summary = audit.finish(extra);
  writeAuditV132(fileName, audit, summary, extra);
  return summary;
}

export const BENCHMARKS_V132 = Object.freeze([
  {
    benchmarkType: "country-indicator-time-series",
    platform: "World Bank DataBank / World Development Indicators",
    officialUrl: "https://databank.worldbank.org/source/world-development-indicators",
    publicQuestion: "국가 지표가 시간에 따라 어떻게 변했는가",
    analysisPattern: "KPI | 연도별 추이 | tooltip | 표 | 다운로드",
    applicableRenderers: "score-trend | kpi-trend | multi-metric-trend",
  },
  {
    benchmarkType: "energy-composition",
    platform: "Our World in Data",
    officialUrl: "https://ourworldindata.org/energy-mix",
    publicQuestion: "에너지원의 절대량과 비중이 어떻게 바뀌었는가",
    analysisPattern: "절대량 누적영역 | 100% 비중 추이 | 선택연도 상세",
    applicableRenderers: "composition-trend | technology-comparison",
  },
  {
    benchmarkType: "greenhouse-gas-composition",
    platform: "Climate Watch / World Resources Institute",
    officialUrl: "https://www.wri.org/data/climate-watch-historical-emissions-data-countries-us-states-unfccc",
    publicQuestion: "총배출과 가스·부문 구성이 어떻게 변했는가",
    analysisPattern: "총량 추이 | 가스·부문 분해 | 최신 구성 | 필터",
    applicableRenderers: "stacked-emissions",
  },
  {
    benchmarkType: "climate-projection",
    platform: "World Bank Climate Change Knowledge Portal",
    officialUrl: "https://climateknowledgeportal.worldbank.org/media/document/CCKP_user_manual.pdf",
    publicQuestion: "어떤 변수·시나리오·기간에서 전망이 어떻게 달라지는가",
    analysisPattern: "변수 | 시나리오 | 기간 | 공간수준 | 범위·추이",
    applicableRenderers: "scenario-comparison | seasonality",
  },
  {
    benchmarkType: "forest-spatial-time",
    platform: "Global Forest Watch",
    officialUrl: "https://www.globalforestwatch.org/",
    publicQuestion: "어디에서 산림 변화가 발생했고 시간에 따라 어떻게 달라졌는가",
    analysisPattern: "지도 | 지역 선택 | 연도별 추이 | 최신 요약",
    applicableRenderers: "spatial-analysis",
  },
  {
    benchmarkType: "research-and-intellectual-property",
    platform: "WIPO IP Statistics Data Center",
    officialUrl: "https://www.wipo.int/en/web/ip-statistics/index",
    publicQuestion: "연구·지식재산 활동의 규모와 분야·협력구조는 어떠한가",
    analysisPattern: "연간 추이 | 유형·기술 구성 | 기관·출원유형 | 목록",
    applicableRenderers: "multi-metric-trend | structured-table",
  },
  {
    benchmarkType: "project-and-finance-portfolio",
    platform: "World Bank Projects / d-portal",
    officialUrl: "https://projects.worldbank.org/en/projects-operations/projects-home?lang=en | https://docs.d-portal.org/",
    publicQuestion: "사업과 재원이 언제·어디에·어떤 분야로 배분됐는가",
    analysisPattern: "사업수 | 금액 합계 | 연도 추이 | 분야·기금 구성 | 필터 | 목록",
    applicableRenderers: "portfolio-dashboard",
  },
]);
