import { PRIORITY_COUNTRIES } from "../data/priorityCountries";
import type { VietnamDemoElement } from "../types/vietnamDemo";
import {
  getFinalPreviewMode,
  sampleFieldValue,
  sampleNumber,
  sampleTrend,
} from "./dataPreviewV53";

const GLOBAL_STAT_MODES = new Set([
  "index_benchmark",
  "kpi_trend",
  "composition",
  "risk_dashboard",
  "market_dashboard",
  "budget_dashboard",
  "research_dashboard",
  "trade_dashboard",
  "cost_comparison",
  "mineral_dashboard",
]);

const GLOBAL_STAT_EXCLUSIONS = new Set([
  "C-011", // 치안·안전은 단순 국가 통계형 비교로 처리하지 않음
  "D-007", // 기후예산태깅은 금액통계가 아니라 제도 운영·성숙도 데이터
]);

export function isGlobalStatisticElement(element: VietnamDemoElement): boolean {
  return (
    element.spatialLevel === "국가" &&
    GLOBAL_STAT_MODES.has(getFinalPreviewMode(element)) &&
    !GLOBAL_STAT_EXCLUSIONS.has(element.elementId)
  );
}

export function getGlobalStatisticYears(element: VietnamDemoElement): number[] {
  if (element.elementId === "A-031") {
    return [2023, 2018, 2016, 2014, 2012, 2010, 2007];
  }

  return [2025, 2024, 2023, 2022, 2021, 2020, 2019, 2018];
}

export function getPreviewCountryOptions() {
  return PRIORITY_COUNTRIES;
}

export function getPreviewCountryName(iso3: string): string {
  return (
    PRIORITY_COUNTRIES.find((country) => country.iso3 === iso3)?.nameKo ?? iso3
  );
}

export function getGlobalStatisticFieldValue({
  element,
  field,
  countryIso3,
  year,
  index,
}: {
  element: VietnamDemoElement;
  field: string;
  countryIso3: string;
  year: number;
  index: number;
}): string {
  return sampleFieldValue(
    field,
    `${element.elementId}:${countryIso3}:${year}`,
    index
  );
}

export function getGlobalTrend({
  elementId,
  countryIso3,
  year,
}: {
  elementId: string;
  countryIso3: string;
  year: number;
}): number[] {
  return sampleTrend(`${elementId}:${countryIso3}:${year}`, 8);
}

export function getGlobalComparisonRows({
  element,
  year,
  field,
}: {
  element: VietnamDemoElement;
  year: number;
  field: string;
}) {
  return PRIORITY_COUNTRIES.map((country, index) => {
    const score = sampleNumber(
      `${element.elementId}:${country.iso3}:${year}:compare`,
      15,
      100
    );

    return {
      ...country,
      score,
      displayValue: getGlobalStatisticFieldValue({
        element,
        field,
        countryIso3: country.iso3,
        year,
        index,
      }),
    };
  }).sort((a, b) => b.score - a.score);
}

export function getCompositionShares(
  elementId: string,
  countryIso3: string,
  year: number,
  count: number
): number[] {
  const raw = Array.from({ length: count }, (_, index) =>
    sampleNumber(`${elementId}:${countryIso3}:${year}:share:${index}`, 8, 42)
  );
  const total = raw.reduce((sum, value) => sum + value, 0);

  return raw.map((value) => (value / total) * 100);
}
