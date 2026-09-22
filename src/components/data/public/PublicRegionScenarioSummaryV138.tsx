import { Fragment, useMemo } from "react";
import { orderBlocksV153 } from "../../../data/visualization/publicVisualizationContractV153";
import { useAnalysisContractV153 } from "./analysisContractContextV153";
import { AnalysisBarsV147 } from "./AnalysisChartsV147";

import type { VietnamEntityV124 } from "../../../data/vietnam/vietnamTypesV124";
import { publicTextV126 } from "../../../data/visualization/publicFieldPolicyV126";
import { formatPublicNumberV126 } from "../../../data/visualization/publicNumberFormatV126";
import {
  publicRegionScenarioContractV138,
  type RegionScenarioMeasureV138,
} from "../../../data/visualization/publicRegionScenarioContractV138";
import type { DataFinderSelectorStateV125 } from "../../../types/dataFinderV125";
import type { TimeSeriesV127 } from "../../../types/chartInteractionV127";
import { InteractiveTimeSeriesChartV127 } from "../../charts/InteractiveTimeSeriesChartV127";
import { PublicTermHelpV134, PublicTermTextV134 } from "../../help/PublicTermV134";
import { displayUnitV150 } from "../../../data/visualization/unitDisplayV150";

/**
 * The province-by-scenario-by-year deliveries, read as what they are.
 *
 * V137 found the shape and printed the first and last year of each scenario.
 * That is a summary of a series, not the series: a screen titled "장기 변화"
 * showed two rows. This version keeps the shape detection and adds what a
 * reader of a climate or resource screen needs:
 *
 * *   the whole series as a chart - per scenario, for the 63-province spread
 *     (median, 10th and 90th percentile across provinces) or for one province
 *     (the source's own values, nothing derived);
 * *   a region comparison for single-period deliveries - every province,
 *     ranked, with the top and bottom named;
 * *   the measure list, default measure, unit and row unit from an explicit
 *     contract where one has been reviewed (publicRegionScenarioContractV138),
 *     with title-word matching kept only as the fallback;
 * *   the publisher's banding (등급) as a count of rows per band, where the
 *     delivery carries one - so B-017 states how many assessment zones fall in
 *     each water-stress class instead of a province count that was never one.
 */

interface Props {
  elementId: string;
  entities: VietnamEntityV124[];
  elementTitle: string;
  selectorState: DataFinderSelectorStateV125;
  onSelectorStateChange: (state: DataFinderSelectorStateV125) => void;
}

const REGION_KEYS = ["지역명_로마자", "지역명_베트남어", "2025_개편_후_소속_34개_체계"];
const REGION_DISPLAY_KEYS = ["지역명_베트남어", "지역명_로마자"];
const SCENARIO_KEY = "시나리오";
const YEAR_KEYS = ["연도", "기준연도"];

/** Columns that describe the row rather than measure anything. */
const NON_MEASURE = new Set([
  ...REGION_KEYS,
  SCENARIO_KEY,
  ...YEAR_KEYS,
  "레코드_키",
  "행정단위",
  "경계_폴리곤_파일",
  "경계_좌표_산출근거",
  "기후기술_연계_근거",
  "수집_기준_절차",
  "좌표_정밀도_출처",
  "구분",
  "구분_손실_원인_등",
]);

const NON_MEASURE_PATTERN =
  /경계[_\s]*면적|단위면적|격자[_\s]*수|격자점|유효[_\s]*격자|좌표|폴리곤|파일|격자[_\s]*원천|기준기간|^단위$|코드|pfaf|aqid|_id$/u;

const SCENARIO_LABELS: Record<string, string> = {
  historical: "과거 모형(historical)",
  ssp119: "SSP1-1.9",
  ssp126: "SSP1-2.6",
  ssp245: "SSP2-4.5",
  ssp370: "SSP3-7.0",
  ssp460: "SSP4-6.0",
  ssp585: "SSP5-8.5",
};
const SCENARIO_ORDER = ["historical", "ssp119", "ssp126", "ssp245", "ssp370", "ssp460", "ssp585"];

const ALL_REGIONS = "__all__";
const ALL_SCENARIOS = "__all__";
const NATIONAL_KEY = "__national__";
const UNSTATED_YEAR = -1;
const NATIONAL_REGION = /^(viet\s*nam|vietnam|vnm|전국)$/iu;
const ROW_UNIT_KEYS = ["레코드_키_string_id", "HydroBASINS_lvl6_코드_pfaf_id"];

const text = (value: unknown): string => {
  if (typeof value === "number") return Number.isFinite(value) ? String(value) : "";
  return publicTextV126(value) || "";
};

function numeric(value: unknown): number | null {
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (typeof value !== "string") return null;
  const cleaned = value.replace(/,/gu, "").trim();
  if (!cleaned || !/^-?\d+(\.\d+)?$/u.test(cleaned)) return null;
  const parsed = Number(cleaned);
  return Number.isFinite(parsed) ? parsed : null;
}

function firstKey(attributes: Record<string, unknown>, keys: string[]): string {
  for (const key of keys) {
    const value = text(attributes[key]);
    if (value) return value;
  }
  return "";
}

/** "AnGiang" / "BàRịa-VũngTàu" / "NghệAn" -> "An Giang" / "Bà Rịa-Vũng Tàu" / "Nghệ An". */
export function publicRegionNameV138(raw: string): string {
  return raw
    .normalize("NFC")
    .replace(/(\p{Ll})(\p{Lu})/gu, "$1 $2")
    .replace(/\s+/gu, " ")
    .trim();
}

function quantile(sorted: number[], fraction: number): number | null {
  if (!sorted.length) return null;
  if (sorted.length === 1) return sorted[0];
  const position = (sorted.length - 1) * fraction;
  const lower = Math.floor(position);
  const upper = Math.ceil(position);
  if (lower === upper) return sorted[lower];
  return sorted[lower] + (sorted[upper] - sorted[lower]) * (position - lower);
}

export interface RegionScenarioShapeV138 {
  measures: string[];
  scenarios: string[];
  /** Region keys as delivered, mapped to the display name. */
  regions: Array<{ key: string; label: string }>;
  years: number[];
  rowCount: number;
  hasNationalRow: boolean;
  /** True when a province holds more than one delivered row per scenario-year AND rows carry their own unit id. */
  rowIsSubRegion: boolean;
  rowUnitCount: number;
}

/**
 * Does this delivery have the province-scenario-year shape, with something to
 * show? Same test as V137; a measure counts only when province rows carry it
 * in at least two different years, or differ between provinces in one.
 */
export function regionScenarioShapeV138(
  entities: VietnamEntityV124[]
): RegionScenarioShapeV138 | null {
  if (entities.length < 2) return null;
  const provinceYearsByMeasure = new Map<string, Set<number>>();
  const valuesByMeasureRegion = new Map<string, Map<string, Set<number>>>();
  const scenarios = new Set<string>();
  const regions = new Map<string, string>();
  const years = new Set<number>();
  const rowsPerRegionSlice = new Map<string, number>();
  const rowUnitIds = new Set<string>();
  let national = false;

  for (const entity of entities) {
    const attributes = (entity.normalizedAttributes || {}) as Record<string, unknown>;
    const region = firstKey(attributes, REGION_KEYS);
    const isNational = Boolean(region) && NATIONAL_REGION.test(region);
    if (isNational) national = true;
    else if (region) {
      regions.set(
        region,
        publicRegionNameV138(firstKey(attributes, REGION_DISPLAY_KEYS) || region)
      );
    }
    const scenario = text(attributes[SCENARIO_KEY]);
    if (scenario) scenarios.add(scenario);
    const statedYear = numeric(firstKey(attributes, YEAR_KEYS));
    const year = statedYear === null ? UNSTATED_YEAR : statedYear;
    if (statedYear !== null) years.add(statedYear);
    if (isNational || !region) continue;
    const sliceKey = `${region}|${scenario}|${year}`;
    rowsPerRegionSlice.set(sliceKey, (rowsPerRegionSlice.get(sliceKey) || 0) + 1);
    const rowUnitId = firstKey(attributes, ROW_UNIT_KEYS);
    if (rowUnitId) rowUnitIds.add(rowUnitId);

    for (const [key, value] of Object.entries(attributes)) {
      if (NON_MEASURE.has(key) || NON_MEASURE_PATTERN.test(key)) continue;
      const parsed = numeric(value);
      if (parsed === null) continue;
      const seenYears = provinceYearsByMeasure.get(key) || new Set<number>();
      seenYears.add(year);
      provinceYearsByMeasure.set(key, seenYears);
      const byRegion = valuesByMeasureRegion.get(key) || new Map<string, Set<number>>();
      const forRegion = byRegion.get(region) || new Set<number>();
      if (forRegion.size < 4) forRegion.add(parsed);
      byRegion.set(region, forRegion);
      valuesByMeasureRegion.set(key, byRegion);
    }
  }

  const measures = [...provinceYearsByMeasure]
    .filter(([key, seenYears]) => {
      const byRegion = valuesByMeasureRegion.get(key);
      if (!byRegion) return false;
      if (seenYears.size >= 2) {
        return [...byRegion.values()].some((set) => set.size > 1);
      }
      const seen = new Set<number>();
      for (const values of byRegion.values()) {
        for (const value of values) seen.add(value);
        if (seen.size > 1) return true;
      }
      return false;
    })
    .sort((a, b) => b[1].size - a[1].size)
    .map(([key]) => key);

  if (regions.size < 2 || !measures.length) return null;
  const multiRowSlices = [...rowsPerRegionSlice.values()].some((count) => count > 1);
  return {
    measures,
    scenarios: [...scenarios].sort(
      (a, b) =>
        (SCENARIO_ORDER.indexOf(a.toLowerCase()) + 1 || 99) -
          (SCENARIO_ORDER.indexOf(b.toLowerCase()) + 1 || 99) || a.localeCompare(b, "en")
    ),
    regions: [...regions]
      .map(([key, label]) => ({ key, label }))
      .sort((a, b) => a.label.localeCompare(b.label, "vi")),
    years: [...years].sort((a, b) => a - b),
    rowCount: entities.length,
    hasNationalRow: national,
    // Several rows under one province in one scenario-year are a finer unit
    // only when the rows identify that unit themselves (an Aqueduct zone id).
    // Duplicated or multi-scenario rows without an id are not promoted.
    rowIsSubRegion: multiRowSlices && rowUnitIds.size > 0,
    rowUnitCount: rowUnitIds.size,
  };
}

/** Column key -> a readable label when no contract names it. */
function fallbackMeasureLabel(key: string): string {
  const parts = key.split("_").filter(Boolean);
  const korean: string[] = [];
  const english: string[] = [];
  const suffix: string[] = [];
  parts.forEach((part) => {
    if (/^[A-Za-z][A-Za-z0-9]*$/u.test(part) && !/^(mm|km|ha|yr|GWh|TWh|MW|kWh|m|s|W)$/u.test(part)) {
      english.push(part);
    } else if (/원값|점수|등급|평균|최대|최소|합계/u.test(part) || /^\d/u.test(part)) {
      suffix.push(part);
    } else {
      korean.push(part);
    }
  });
  const head = korean.join(" ").trim();
  const paren = english.length ? `(${english.join(" ")})` : "";
  const tail = suffix.length ? ` · ${suffix.join(" ").replace(/점수 0 5/u, "점수(0~5)")}` : "";
  return `${head}${paren}${tail}`.trim() || key.replace(/_/gu, " ");
}

function fallbackUnit(key: string): string {
  if (/_일$/u.test(key)) return "일";
  if (/_mm$/iu.test(key)) return "mm";
  if (/_km$/u.test(key)) return "km²";
  if (/_ha$/u.test(key)) return "ha";
  if (/GWh_yr/u.test(key)) return "GWh/년";
  if (/TWh_yr/u.test(key)) return "TWh/년";
  if (/_m_s/u.test(key)) return "m/s";
  if (/W_m/u.test(key)) return "W/m²";
  if (/점수_0_5/u.test(key)) return "점(0~5)";
  if (/비중|비율|율$/u.test(key)) return "%";
  if (/기온|지온/u.test(key)) return "°C";
  return "";
}

const compactKey = (value: string) =>
  value.normalize("NFC").replace(/[\s_·(),/-]/gu, "").toLowerCase();

function titleTokens(title: string): string[] {
  return title
    .normalize("NFC")
    .split(/[\s·,()/[\]-]+/u)
    .map((word) => word.replace(/(?:과|와|의|및|별|은|는|이|가|을|를)$/u, ""))
    .filter((word) => word.length >= 2);
}

function preferredMeasureByTitle(measures: string[], elementTitle: string): string {
  const tokens = titleTokens(elementTitle).map(compactKey).filter(Boolean);
  if (!tokens.length) return measures[0] || "";
  const scored = measures
    .map((key, index) => {
      const compact = compactKey(key);
      if (!tokens.some((token) => compact.includes(token))) return null;
      const rank = /원값/u.test(key) ? 0 : /점수|등급/u.test(key) ? 2 : 1;
      return { key, rank, index };
    })
    .filter((entry): entry is { key: string; rank: number; index: number } => Boolean(entry))
    .sort((a, b) => a.rank - b.rank || a.index - b.index);
  return scored.length ? scored[0].key : measures[0] || "";
}

const scenarioLabel = (key: string) => SCENARIO_LABELS[key.toLowerCase()] || key;

interface SeriesPoint {
  year: number;
  count: number;
  regionCount: number;
  low: number | null;
  median: number | null;
  high: number | null;
}

export default function PublicRegionScenarioSummaryV138({
  elementId,
  entities,
  elementTitle,
  selectorState,
  onSelectorStateChange,
}: Props) {
  const shape = useMemo(() => regionScenarioShapeV138(entities), [entities]);
  const contract = useMemo(() => publicRegionScenarioContractV138(elementId), [elementId]);
  const v153 = useAnalysisContractV153();

  // The measure list: the contract's order, restricted to columns the delivery
  // actually carries; then any delivered measure the contract does not name.
  const measureOptions = useMemo<RegionScenarioMeasureV138[]>(() => {
    if (!shape) return [];
    const present = new Set(shape.measures);
    const fromContract = (contract?.measures || []).filter((measure) => present.has(measure.key));
    const named = new Set(fromContract.map((measure) => measure.key));
    const rest = shape.measures
      .filter((key) => !named.has(key))
      .map((key) => ({ key, label: fallbackMeasureLabel(key), unit: fallbackUnit(key) }));
    return [...fromContract, ...rest];
  }, [contract, shape]);

  const measure = (() => {
    const requested = selectorState.dimensions.regionMeasure || "";
    if (measureOptions.some((option) => option.key === requested)) return requested;
    if (contract?.defaultMeasure && measureOptions.some((option) => option.key === contract.defaultMeasure)) {
      return contract.defaultMeasure;
    }
    if (contract?.measures.length && measureOptions.length) return measureOptions[0].key;
    return shape ? preferredMeasureByTitle(shape.measures, elementTitle) : "";
  })();
  const measureMeta =
    measureOptions.find((option) => option.key === measure) ||
    ({ key: measure, label: fallbackMeasureLabel(measure), unit: fallbackUnit(measure) } as RegionScenarioMeasureV138);
  const requestedRegion = selectorState.dimensions.regionName || "";
  const region =
    shape &&
    (shape.regions.some((item) => item.key === requestedRegion) ||
      (requestedRegion === NATIONAL_KEY && shape.hasNationalRow))
      ? requestedRegion
      : ALL_REGIONS;
  // A card that summarised one scenario (SSP2-4.5 median trend) opens the
  // screen on that scenario; otherwise every scenario is shown.
  const scenarioChoice = selectorState.dimensions.scenario || ALL_SCENARIOS;
  const scenario =
    shape && shape.scenarios.includes(scenarioChoice) ? scenarioChoice : ALL_SCENARIOS;

  const series = useMemo(() => {
    if (!shape || !measure) return [];
    const buckets = new Map<string, Map<number, number[]>>();
    const regionsSeen = new Map<string, Map<number, Set<string>>>();
    for (const entity of entities) {
      const attributes = (entity.normalizedAttributes || {}) as Record<string, unknown>;
      const value = numeric(attributes[measure]);
      if (value === null) continue;
      const statedYear = numeric(firstKey(attributes, YEAR_KEYS));
      const year = statedYear === null ? UNSTATED_YEAR : statedYear;
      const rowRegion = firstKey(attributes, REGION_KEYS);
      const isNational = NATIONAL_REGION.test(rowRegion);
      if (region === ALL_REGIONS) {
        if (isNational) continue;
      } else if (region === NATIONAL_KEY) {
        if (!isNational) continue;
      } else if (rowRegion !== region) {
        continue;
      }
      const rowScenario = text(attributes[SCENARIO_KEY]) || "전체";
      if (scenario !== ALL_SCENARIOS && rowScenario !== scenario) continue;
      const byYear = buckets.get(rowScenario) || new Map<number, number[]>();
      byYear.set(year, (byYear.get(year) || []).concat(value));
      buckets.set(rowScenario, byYear);
      const regionsByYear = regionsSeen.get(rowScenario) || new Map<number, Set<string>>();
      const forYear = regionsByYear.get(year) || new Set<string>();
      if (rowRegion) forYear.add(rowRegion);
      regionsByYear.set(year, forYear);
      regionsSeen.set(rowScenario, regionsByYear);
    }
    return [...buckets]
      .sort(
        (a, b) =>
          (SCENARIO_ORDER.indexOf(a[0].toLowerCase()) + 1 || 99) -
            (SCENARIO_ORDER.indexOf(b[0].toLowerCase()) + 1 || 99) || a[0].localeCompare(b[0], "en")
      )
      .map(([name, byYear]) => ({
        scenario: name,
        points: [...byYear]
          .sort((a, b) => a[0] - b[0])
          .map(([year, values]): SeriesPoint => {
            const sorted = [...values].sort((a, b) => a - b);
            return {
              year,
              count: sorted.length,
              regionCount: regionsSeen.get(name)?.get(year)?.size || 0,
              low: quantile(sorted, 0.1),
              median: quantile(sorted, 0.5),
              high: quantile(sorted, 0.9),
            };
          }),
      }));
  }, [entities, measure, region, scenario, shape]);

  // A regional comparison must use one scenario and the same year for every
  // region. Never compare each region's independently latest observation.
  const comparisonScenario = scenario !== ALL_SCENARIOS ? scenario
    : shape?.scenarios.includes("ssp245") ? "ssp245" : shape?.scenarios[0] || "전체";
  const comparisonYears = series.find((s) => s.scenario === comparisonScenario)?.points.map((p) => p.year) || [];
  const comparisonYear = selectorState.year !== null && comparisonYears.includes(selectorState.year)
    ? selectorState.year : comparisonYears[comparisonYears.length - 1] ?? UNSTATED_YEAR;
  const rankedRegions = useMemo(() => {
    if (!shape || !measure) return [];
    const subRegion = Boolean(contract?.rowUnit) || shape.rowIsSubRegion;
    const idKeys = contract?.rowUnit?.idKeys || ROW_UNIT_KEYS;
    const latest = new Map<string, { label: string; value: number; year: number }>();
    for (const entity of entities) {
      const attributes = (entity.normalizedAttributes || {}) as Record<string, unknown>;
      const rowRegion = firstKey(attributes, REGION_KEYS);
      if (!rowRegion || NATIONAL_REGION.test(rowRegion)) continue;
      const value = numeric(attributes[measure]);
      if (value === null) continue;
      const rowScenario = text(attributes[SCENARIO_KEY]);
      if (rowScenario && rowScenario !== comparisonScenario) continue;
      const statedYear = numeric(firstKey(attributes, YEAR_KEYS));
      const year = statedYear === null ? UNSTATED_YEAR : statedYear;
      if (year !== comparisonYear) continue;
      const regionName = shape.regions.find((item) => item.key === rowRegion)?.label || rowRegion;
      // A finer unit ranks as itself, named by its province; a province row
      // ranks once, on its newest year.
      const rowId = subRegion ? firstKey(attributes, idKeys) : "";
      const rowName = subRegion ? contract?.rowUnit?.describe?.(attributes) || rowId : "";
      const key = subRegion ? `${rowRegion}|${rowId || entity.recordId}` : rowRegion;
      const current = latest.get(key);
      if (!current || year > current.year) {
        latest.set(key, {
          label: subRegion ? `${regionName} · ${rowName || "구역"}` : regionName,
          value,
          year,
        });
      }
    }
    return [...latest.values()].sort((a, b) => b.value - a.value);
  }, [contract, entities, measure, comparisonScenario, comparisonYear, shape]);

  // The publisher's banding, as a count of rows per band.
  const gradeDistribution = useMemo(() => {
    const gradeKey = measureMeta.gradeKey;
    if (!gradeKey) return [];
    const counts = new Map<string, number>();
    for (const entity of entities) {
      const attributes = (entity.normalizedAttributes || {}) as Record<string, unknown>;
      const rowRegion = firstKey(attributes, REGION_KEYS);
      if (!rowRegion || NATIONAL_REGION.test(rowRegion)) continue;
      if (region !== ALL_REGIONS && rowRegion !== region) continue;
      const grade = text(attributes[gradeKey]);
      if (!grade) continue;
      counts.set(grade, (counts.get(grade) || 0) + 1);
    }
    const order = ["Low", "Low - Medium", "Medium - High", "High", "Extremely High", "Arid and Low Water Use", "No Data"];
    return [...counts]
      .map(([grade, count]) => ({ grade, count }))
      .sort((a, b) => {
        const ia = order.findIndex((item) => a.grade.startsWith(item));
        const ib = order.findIndex((item) => b.grade.startsWith(item));
        return (ia < 0 ? 99 : ia) - (ib < 0 ? 99 : ib) || a.grade.localeCompare(b.grade, "en");
      });
  }, [entities, measureMeta.gradeKey, region]);

  if (!shape || !measure || !series.length) return null;

  const unit = displayUnitV150(measureMeta.unit || "");
  const distribution = region === ALL_REGIONS;
  const rowUnitLabel = contract?.rowUnit?.label || (shape.rowIsSubRegion ? "평가구역" : "성·시");
  const rowIsSubRegion = Boolean(contract?.rowUnit) || shape.rowIsSubRegion;
  const regionCount = shape.regions.length;
  const regionLabel =
    region === ALL_REGIONS
      ? rowIsSubRegion
        ? `${regionCount}개 성·시 · ${rowUnitLabel} ${shape.rowUnitCount.toLocaleString("ko-KR")}개 분포`
        : `${regionCount}개 성·시 분포`
      : region === NATIONAL_KEY
        ? "전국"
        : shape.regions.find((item) => item.key === region)?.label || region;
  const shownYears = series
    .flatMap((row) => row.points.map((point) => point.year))
    .filter((year) => year !== UNSTATED_YEAR)
    .sort((left, right) => left - right);
  const distinctYears = [...new Set(shownYears)];
  const latestYear = shownYears[shownYears.length - 1];
  const firstYear = shownYears[0];
  const periodText =
    shownYears.length === 0
      ? contract?.periodLabel || "기준연도 미기재"
      : firstYear === latestYear
        ? `${latestYear}년`
        : `${firstYear}~${latestYear}년`;
  const multiYear = distinctYears.length >= 3;
  const formatValue = (value: number) => formatPublicNumberV126(value, unit);

  const update = (key: string, value: string) =>
    onSelectorStateChange({
      ...selectorState,
      dimensions: { ...selectorState.dimensions, [key]: value },
    });

  // Chart series. For the distribution, the median per scenario is the line;
  // 10th and 90th percentiles come along as dotted lines when the chart is not
  // already busy with several scenarios.
  const chartSeries: TimeSeriesV127[] = multiYear
    ? series.flatMap((row, index) => {
        const markers = ["circle", "square", "diamond", "triangle", "cross"] as const;
        const marker = markers[index % markers.length];
        const isHistorical = row.scenario.toLowerCase() === "historical";
        const points = row.points.filter((point) => point.year !== UNSTATED_YEAR);
        const label = row.scenario === "전체" ? measureMeta.label : scenarioLabel(row.scenario);
        const main: TimeSeriesV127 = {
          id: `${row.scenario}:median`,
          label: distribution ? `${label} · 중앙값` : label,
          unit,
          marker,
          linePattern: isHistorical ? "dash" : "solid",
          points: points
            .filter((point) => point.median !== null)
            .map((point) => ({
              id: `${row.scenario}:${point.year}`,
              x: point.year,
              xLabel: `${point.year}년`,
              value: point.median as number,
            })),
        };
        if (!distribution || series.length > 2) return [main];
        const band = (fraction: "low" | "high", suffix: string): TimeSeriesV127 => ({
          id: `${row.scenario}:${fraction}`,
          label: `${label} · ${suffix}`,
          unit,
          marker,
          linePattern: "dot",
          defaultVisible: true,
          points: points
            .filter((point) => point[fraction] !== null)
            .map((point) => ({
              id: `${row.scenario}:${fraction}:${point.year}`,
              x: point.year,
              xLabel: `${point.year}년`,
              value: point[fraction] as number,
            })),
        });
        return [main, band("low", "10분위"), band("high", "90분위")];
      })
    : [];

  return (
    <div
      className="prs137 prs138"
      data-testid="region-scenario-summary-v137"
      data-region-scenario-v138="true"
      data-element-id={elementId}
      data-measure={measure}
      data-region={region}
      data-year-count={distinctYears.length}
      data-public-selector-scope-v134="true"
    >
      <div className="pav126-section-heading">
        <span>주 분석</span>
        <h3>{regionLabel}</h3>
      </div>
      <p className="prs137__lede">
        {distribution
          ? (rowIsSubRegion
              ? `${regionCount}개 성·시에 걸친 ${rowUnitLabel}별 값의 분포입니다. 값은 ${rowUnitLabel} 단위로 제공되며 성·시 값으로 합치지 않습니다. `
              : `${regionCount}개 성·시가 가진 값의 분포입니다. 성·시 값을 평균한 전국값은 만들지 않고, `) +
            (multiYear
              ? "연도별 중앙값과 10~90 분위(지역 간 분포)를 보여줍니다. 지역을 고르면 그 지역의 원천값을 잇습니다."
              : "중앙값과 10~90 분위를 보여주고, 아래에서 지역별 값을 순위로 비교합니다.")
          : `${regionLabel}의 원천값입니다. 계산하지 않은 값 그대로입니다.`}
      </p>

      <div className="prs137__controls" data-testid="public-selector">
        {measureOptions.length > 1 && (
          <label>
            <span>
              표시 항목
              {/* A native option cannot carry the help trigger; the chosen
                  measure's unit is explained beside the control. */}
              <PublicTermHelpV134 text={`${measureMeta.label} ${unit}`} />
            </span>
            <select
              aria-label="표시 항목 선택"
              value={measure}
              onChange={(event) => update("regionMeasure", event.target.value)}
            >
              {measureOptions.map((option) => (
                <option key={option.key} value={option.key}>
                  {option.label}
                  {option.unit ? ` — ${option.unit}` : ""}
                </option>
              ))}
            </select>
          </label>
        )}
        <label>
          <span>지역</span>
          <select
            aria-label="지역 선택"
            value={region}
            onChange={(event) => update("regionName", event.target.value)}
          >
            <option value={ALL_REGIONS}>
              {rowIsSubRegion
                ? `${regionCount}개 성·시 · ${rowUnitLabel} 전체 분포`
                : `${regionCount}개 성·시 전체 분포`}
            </option>
            {shape.hasNationalRow && <option value={NATIONAL_KEY}>전국 값</option>}
            {shape.regions.map((item) => (
              <option key={item.key} value={item.key}>
                {item.label}
              </option>
            ))}
          </select>
        </label>
        {shape.scenarios.length > 1 && (
          <label>
            <span>시나리오</span>
            <select
              aria-label="시나리오 선택"
              value={scenario}
              onChange={(event) => update("scenario", event.target.value)}
            >
              <option value={ALL_SCENARIOS}>모든 시나리오</option>
              {shape.scenarios.map((item) => (
                <option key={item} value={item}>
                  {scenarioLabel(item)}
                </option>
              ))}
            </select>
          </label>
        )}
      </div>

      <dl className="prs138__facts">
        <div>
          <dt>항목</dt>
          <dd><PublicTermTextV134 text={measureMeta.label} /></dd>
        </div>
        <div>
          <dt>단위</dt>
          <dd>{unit ? <PublicTermTextV134 text={unit} /> : "원천 미기재"}</dd>
        </div>
        {measureMeta.direction && (
          <div>
            <dt>읽는 법</dt>
            <dd>{measureMeta.direction}</dd>
          </div>
        )}
        <div>
          <dt>기간</dt>
          <dd>{periodText}</dd>
        </div>
        <div>
          <dt>값의 단위</dt>
          <dd>{rowIsSubRegion ? `${rowUnitLabel} ${shape.rowUnitCount.toLocaleString("ko-KR")}개 (개편 전 63개 성·시로 분류)` : "성·시(개편 전 63개)"}</dd>
        </div>
      </dl>

      {/* The contract's first block (region-bar for a province distribution)
          opens the screen; the rest keep their V138 order (V153). */}
      {orderBlocksV153(
        [
          { type: "line" as const, key: "trend", node: (<>
      {multiYear && chartSeries.length > 0 && (<section data-analysis-block="line" className="prs153__block">
        <InteractiveTimeSeriesChartV127
          ariaLabel={`${regionLabel} ${measureMeta.label} 연도별 변화`}
          className="prs138__chart"
          formatValue={formatValue}
          height={300}
          series={chartSeries}
          sharedYearTooltip
          showDelta={false}
          testId="region-scenario-chart-v138"
          title={`${measureMeta.label} · ${regionLabel} · ${periodText}`}
          unit={unit}
          xAxisTitle="연도"
          yAxisTitle={`${measureMeta.label}${unit ? ` (${unit})` : ""}`}
          zoom={{ enabled: distinctYears.length >= 10, minimumSpan: Math.min(10, Math.max(3, distinctYears.length - 1)) }}
        /></section>
      )}
          </>) },
          { type: "table" as const, key: "grades", node: (<>
      {gradeDistribution.length > 0 && (
        <div className="cdp-table-wrap" data-analysis-block="table">
          <table className="cdp-table prs137__table" data-testid="region-scenario-grades-v138">
            <caption>
              등급별 {rowUnitLabel} 수 · {measureMeta.label.replace(/ · (원값|점수\(0~5\))$/u, "")} (원천 등급)
            </caption>
            <thead>
              <tr>
                <th scope="col">등급</th>
                <th scope="col">{rowUnitLabel} 수</th>
                <th scope="col">비중</th>
              </tr>
            </thead>
            <tbody>
              {gradeDistribution.map((row) => {
                const total = gradeDistribution.reduce((sum, item) => sum + item.count, 0);
                return (
                  <tr key={row.grade}>
                    <th scope="row">{row.grade}</th>
                    <td>{row.count.toLocaleString("ko-KR")}</td>
                    <td>{total ? `${((row.count / total) * 100).toFixed(1)}%` : "-"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
          </>) },
          { type: "table" as const, key: "values", node: (<>
      <div className="cdp-table-wrap" data-analysis-block="table">
        <table className="cdp-table prs137__table" data-testid="region-scenario-table-v138">
          <caption>
            <PublicTermTextV134 text={measureMeta.label} />
            {unit ? ` (${unit})` : ""} · {periodText} ·{" "}
            {distribution ? `${rowUnitLabel} 값의 분위` : "원천값"}
            {multiYear ? " · 처음·마지막 연도와 변화" : ""}
          </caption>
          <thead>
            <tr>
              <th scope="col">{shape.scenarios.length > 1 ? "시나리오" : "구분"}</th>
              <th scope="col">기간</th>
              <th scope="col">{distribution ? "중앙값" : "값"}</th>
              {distribution && <th scope="col">10분위</th>}
              {distribution && <th scope="col">90분위</th>}
              <th scope="col">성·시 수</th>
              {rowIsSubRegion && <th scope="col">{rowUnitLabel} 수</th>}
            </tr>
          </thead>
          <tbody>
            {series.map((row) => {
              const first = row.points[0];
              const last = row.points[row.points.length - 1];
              const rows = [first, last].filter(
                (point, index, all) => point && all.indexOf(point) === index
              );
              const change =
                first && last && first !== last && first.median !== null && last.median !== null
                  ? last.median - first.median
                  : null;
              return [
                ...rows.map((point) => (
                  <tr key={`${row.scenario}-${point.year}`}>
                    <th scope="row">
                      <PublicTermTextV134 text={scenarioLabel(row.scenario)} />
                    </th>
                    <td>{point.year === UNSTATED_YEAR ? periodText : `${point.year}년`}</td>
                    <td>{point.median === null ? "자료 미제공" : formatValue(point.median)}</td>
                    {distribution && <td>{point.low === null ? "자료 미제공" : formatValue(point.low)}</td>}
                    {distribution && <td>{point.high === null ? "자료 미제공" : formatValue(point.high)}</td>}
                    <td>{point.regionCount.toLocaleString("ko-KR")}</td>
                    {rowIsSubRegion && <td>{point.count.toLocaleString("ko-KR")}</td>}
                  </tr>
                )),
                ...(change !== null
                  ? [
                      <tr key={`${row.scenario}-change`} className="prs138__change">
                        <th scope="row">
                          <PublicTermTextV134 text={scenarioLabel(row.scenario)} /> 변화
                        </th>
                        <td>
                          {first.year}→{last.year}
                        </td>
                        <td colSpan={distribution ? 3 : 1}>
                          {change > 0 ? "+" : ""}
                          {formatValue(change)}
                          {unit ? ` ${unit}` : ""}
                          {distribution ? " (중앙값 기준)" : ""}
                        </td>
                        <td>{last.regionCount.toLocaleString("ko-KR")}</td>
                        {rowIsSubRegion && <td>{last.count.toLocaleString("ko-KR")}</td>}
                      </tr>,
                    ]
                  : []),
              ];
            })}
          </tbody>
        </table>
      </div>
          </>) },
          { type: "region-bar" as const, key: "comparison", node: (<>
      {rankedRegions.length > 1 && <section className="detail146" data-testid="region-comparison-v148" data-analysis-block="region-bar">
        <h3>{rowIsSubRegion ? `${rowUnitLabel}별 비교` : "같은 시점의 지역별 비교"}</h3>
        {comparisonYears.filter((y) => y !== UNSTATED_YEAR).length > 1 && <label>비교연도 <select aria-label="지역 비교연도" value={comparisonYear} onChange={(event) => onSelectorStateChange({ ...selectorState, year: Number(event.target.value), period: null })}>{comparisonYears.filter((y) => y !== UNSTATED_YEAR).map((y) => <option key={y} value={y}>{y}년</option>)}</select></label>}
        <AnalysisBarsV147 title={`${measureMeta.label} · ${comparisonYear === UNSTATED_YEAR ? periodText : `${comparisonYear}년`} · ${scenarioLabel(comparisonScenario)}`} unit={unit} rows={rankedRegions.slice(0, 12).map((r) => ({ id: r.label, label: r.label, value: r.value }))} />
        <p className="detail146-note">같은 항목·시나리오·시점의 값만 비교합니다.{rankedRegions.length > 12 ? " 값이 큰 12개를 표시하며, 전체 지역은 아래 표에서 확인할 수 있습니다." : ""} 값의 크기는 우수성이나 사업 적합성 순위를 뜻하지 않습니다.</p>
      </section>}
          </>) },
          { type: "table" as const, key: "ranked", node: (<>
      {rankedRegions.length > 1 && (
        <details className="prs138__ranked" data-analysis-block="table" data-testid="region-scenario-ranked-v138" open={!multiYear}>
          <summary>
            표로 보기 · {rowIsSubRegion ? `${rankedRegions.length.toLocaleString("ko-KR")}개 ${rowUnitLabel}` : `${rankedRegions.length}개 성·시`} · {comparisonYear === UNSTATED_YEAR ? periodText : `${comparisonYear}년`} · {scenarioLabel(comparisonScenario)}
          </summary>
          <div className="cdp-table-wrap">
            <table className="cdp-table prs137__table">
              <caption>
                <PublicTermTextV134 text={`${measureMeta.label}${unit ? ` (${unit})` : ""}`} /> · 값이 큰 순서
              </caption>
              <thead>
                <tr>
                  <th scope="col">순위</th>
                  <th scope="col">{rowIsSubRegion ? `성·시 · ${rowUnitLabel}` : "성·시"}</th>
                  <th scope="col">값</th>
                </tr>
              </thead>
              <tbody>
                {rankedRegions.map((row, index) => (
                  <tr key={row.label}>
                    <td>{index + 1}</td>
                    <th scope="row">{row.label}</th>
                    <td>{formatValue(row.value)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </details>
      )}
          </>) },
        ],
        v153?.primary.type ?? null
      ).map((block) => <Fragment key={block.key}>{block.node}</Fragment>)}
      {(contract?.constraints.length || contract?.scenarioNote) && (
        <ul className="prs138__constraints" data-testid="region-scenario-constraints-v138">
          {contract?.scenarioNote && (
            <li><PublicTermTextV134 text={contract.scenarioNote} /></li>
          )}
          {contract?.constraints.map((item) => (
            <li key={item}><PublicTermTextV134 text={item} /></li>
          ))}
        </ul>
      )}
      <p className="prs137__note">
        {multiYear
          ? "연도별 전체 값과 원자료 정밀도는 아래 상세 데이터와 다운로드에서 확인할 수 있습니다."
          : shownYears.length === 0 && contract?.periodLabel
            ? `원천이 제공하는 기간은 ${contract.periodLabel}이며 연도별 값은 제공되지 않습니다. ${rowUnitLabel}별 값은 아래 상세 데이터와 다운로드에서 확인할 수 있습니다.`
            : `원천이 제공하는 기준연도는 한 해입니다. ${rowUnitLabel}별 값은 아래 상세 데이터와 다운로드에서 확인할 수 있습니다.`}
      </p>
    </div>
  );
}
