import { useMemo } from "react";

import type { VietnamEntityV124 } from "../../../data/vietnam/vietnamTypesV124";
import { publicTextV126 } from "../../../data/visualization/publicFieldPolicyV126";
import { formatPublicNumberV126 } from "../../../data/visualization/publicNumberFormatV126";
import type { DataFinderSelectorStateV125 } from "../../../types/dataFinderV125";

/**
 * The scenario datasets, read as what they are.
 *
 * Nineteen detail screens carry a province-by-scenario-by-year delivery -
 * CMIP6 climate, heat, flood, drought, sea level, water stress, forest and
 * resource potential - and showed none of it. The page printed twelve record
 * keys ("VNM.1_1_ssp370_2096") under a heading promising a scenario outlook,
 * and B-005 said "SPEI-12 전망 관측값이 없습니다" over 31,688 delivered rows.
 * The values were never missing; they arrived in entity attribute columns
 * rather than as observations, and nothing read them.
 *
 * What this shows, and what it refuses to show:
 *
 * *   A **national average across provinces is not in the source**, so none is
 *     drawn. What the delivery states is 63 province values per scenario-year,
 *     and their spread is a description of those values rather than a new
 *     statistic: the median and the 10th-90th percentile across provinces, both
 *     labelled as such.
 * *   A reader who wants a real single series can pick one province, which is
 *     the source's own value with nothing derived at all.
 * *   Historical and projected rows are different things. The scenario column
 *     separates them and they are never joined into one line.
 */

interface Props {
  elementId: string;
  entities: VietnamEntityV124[];
  elementTitle: string;
  selectorState: DataFinderSelectorStateV125;
  onSelectorStateChange: (state: DataFinderSelectorStateV125) => void;
}

const REGION_KEYS = ["지역명_로마자", "지역명_베트남어", "2025_개편_후_소속_34개_체계"];
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

const SCENARIO_LABELS: Record<string, string> = {
  historical: "과거 관측",
  ssp119: "SSP1-1.9",
  ssp126: "SSP1-2.6",
  ssp245: "SSP2-4.5",
  ssp370: "SSP3-7.0",
  ssp460: "SSP4-6.0",
  ssp585: "SSP5-8.5",
};

const ALL_REGIONS = "__all__";

/**
 * The delivery includes a national row alongside the provinces.
 *
 * "Viet Nam" sits in the same region column as the 63 provinces, so counting it
 * gave "64개 성·시" and let a national figure into a distribution that is meant
 * to describe provinces. It is a different unit and is offered as its own
 * choice instead.
 */
const NATIONAL_REGION = /^(viet\s*nam|vietnam|vnm|전국)$/iu;
const NATIONAL_KEY = "__national__";

/**
 * A cell as text, whether the delivery stored it as a string or a number.
 *
 * publicTextV126 returns null for anything that is not a string, and the year
 * column arrives as a number - so reading it through that helper found no years
 * at all and this whole summary silently declined to render. The same trap had
 * already dropped every transmission voltage on the map.
 */
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

/** Percentile of a sorted list, by linear interpolation. */
function quantile(sorted: number[], fraction: number): number | null {
  if (!sorted.length) return null;
  if (sorted.length === 1) return sorted[0];
  const position = (sorted.length - 1) * fraction;
  const lower = Math.floor(position);
  const upper = Math.ceil(position);
  if (lower === upper) return sorted[lower];
  return sorted[lower] + (sorted[upper] - sorted[lower]) * (position - lower);
}

export interface RegionScenarioShapeV137 {
  measures: string[];
  scenarios: string[];
  regions: string[];
  years: number[];
  rowCount: number;
  hasNationalRow: boolean;
}

/**
 * Does this delivery have the province-scenario-year shape, with something to
 * show?
 *
 * A non-null result is a promise that the summary will render. It used to be a
 * weaker test - any numeric column, any two years - and B-029 and B-039 then
 * took the branch and rendered nothing at all, which was worse than the card
 * grid they replaced. A measure now counts only when province rows carry it in
 * at least two different years, which is exactly what the table needs.
 */
export function regionScenarioShapeV137(
  entities: VietnamEntityV124[]
): RegionScenarioShapeV137 | null {
  if (entities.length < 2) return null;
  const provinceYearsByMeasure = new Map<string, Set<number>>();
  const valuesByMeasureRegion = new Map<string, Map<string, Set<number>>>();
  const scenarios = new Set<string>();
  const regions = new Set<string>();
  const years = new Set<number>();
  let national = false;

  for (const entity of entities) {
    const attributes = (entity.normalizedAttributes || {}) as Record<string, unknown>;
    const region = firstKey(attributes, REGION_KEYS);
    const isNational = Boolean(region) && NATIONAL_REGION.test(region);
    if (isNational) national = true;
    else if (region) regions.add(region);
    const scenario = text(attributes[SCENARIO_KEY]);
    if (scenario) scenarios.add(scenario);
    const year = numeric(firstKey(attributes, YEAR_KEYS));
    if (year !== null) years.add(year);
    if (isNational || !region || year === null) continue;

    for (const [key, value] of Object.entries(attributes)) {
      if (NON_MEASURE.has(key)) continue;
      const parsed = numeric(value);
      if (parsed === null) continue;
      const seenYears = provinceYearsByMeasure.get(key) || new Set<number>();
      seenYears.add(year);
      provinceYearsByMeasure.set(key, seenYears);
      // What the column takes inside one region, so a value that never moves
      // there can be recognised as describing the region rather than a year.
      const byRegion = valuesByMeasureRegion.get(key) || new Map<string, Set<number>>();
      const forRegion = byRegion.get(region) || new Set<number>();
      if (forRegion.size < 4) forRegion.add(parsed);
      byRegion.set(region, forRegion);
      valuesByMeasureRegion.set(key, byRegion);
    }
  }

  // A column holding one value per region in every year describes the region.
  // B-003 offered 경계_면적_km_GADM - the province's own boundary area - as its
  // default measure simply because it was the most-filled numeric column.
  const measures = [...provinceYearsByMeasure]
    .filter(([key, seenYears]) => {
      if (seenYears.size < 2) return false;
      const byRegion = valuesByMeasureRegion.get(key);
      return Boolean(byRegion) && [...byRegion!.values()].some((set) => set.size > 1);
    })
    .sort((a, b) => b[1].size - a[1].size)
    .map(([key]) => key);

  if (regions.size < 2 || years.size < 2 || !measures.length) return null;
  return {
    measures,
    scenarios: [...scenarios].sort(),
    regions: [...regions].sort((a, b) => a.localeCompare(b, "en")),
    years: [...years].sort((a, b) => a - b),
    rowCount: entities.length,
    hasNationalRow: national,
  };
}

const measureLabel = (key: string) => key.replace(/_/gu, " ").trim();

const scenarioLabel = (key: string) => SCENARIO_LABELS[key.toLowerCase()] || key;

export default function PublicRegionScenarioSummaryV137({
  elementId,
  entities,
  elementTitle,
  selectorState,
  onSelectorStateChange,
}: Props) {
  const shape = useMemo(() => regionScenarioShapeV137(entities), [entities]);

  const measure =
    shape && shape.measures.includes(selectorState.dimensions.regionMeasure || "")
      ? (selectorState.dimensions.regionMeasure as string)
      : shape?.measures[0] || "";
  const requestedRegion = selectorState.dimensions.regionName || "";
  const region =
    shape &&
    (shape.regions.includes(requestedRegion) ||
      (requestedRegion === NATIONAL_KEY && shape.hasNationalRow))
      ? requestedRegion
      : ALL_REGIONS;

  const series = useMemo(() => {
    if (!shape || !measure) return [];
    // scenario -> year -> the province values delivered for it
    const buckets = new Map<string, Map<number, number[]>>();
    for (const entity of entities) {
      const attributes = (entity.normalizedAttributes || {}) as Record<string, unknown>;
      const value = numeric(attributes[measure]);
      if (value === null) continue;
      const year = numeric(firstKey(attributes, YEAR_KEYS));
      if (year === null) continue;
      const rowRegion = firstKey(attributes, REGION_KEYS);
      const isNational = NATIONAL_REGION.test(rowRegion);
      if (region === ALL_REGIONS) {
        // The province distribution describes provinces. A national row is a
        // different unit and would sit inside its own spread.
        if (isNational) continue;
      } else if (region === NATIONAL_KEY) {
        if (!isNational) continue;
      } else if (rowRegion !== region) {
        continue;
      }
      const scenario = text(attributes[SCENARIO_KEY]) || "전체";
      const byYear = buckets.get(scenario) || new Map<number, number[]>();
      byYear.set(year, (byYear.get(year) || []).concat(value));
      buckets.set(scenario, byYear);
    }
    return [...buckets]
      .sort((a, b) => a[0].localeCompare(b[0], "en"))
      .map(([scenario, byYear]) => ({
        scenario,
        points: [...byYear]
          .sort((a, b) => a[0] - b[0])
          .map(([year, values]) => {
            const sorted = [...values].sort((a, b) => a - b);
            return {
              year,
              count: sorted.length,
              low: quantile(sorted, 0.1),
              median: quantile(sorted, 0.5),
              high: quantile(sorted, 0.9),
            };
          }),
      }));
  }, [entities, measure, region, shape]);

  if (!shape || !measure || !series.length) return null;

  const unitHint = /_일$/u.test(measure) ? "일" : /_mm$/iu.test(measure) ? "mm" : "";
  const distribution = region === ALL_REGIONS;
  const regionLabel =
    region === ALL_REGIONS
      ? `${shape.regions.length}개 성·시 분포`
      : region === NATIONAL_KEY
        ? "전국"
        : region;
  const latestYear = shape.years[shape.years.length - 1];
  const firstYear = shape.years[0];
  const regionCount = shape.regions.length;

  const update = (key: string, value: string) =>
    onSelectorStateChange({
      ...selectorState,
      dimensions: { ...selectorState.dimensions, [key]: value },
    });

  return (
    <div className="prs137" data-testid="region-scenario-summary-v137" data-element-id={elementId}>
      <div className="pav126-section-heading">
        <span>주 분석</span>
        {/* The section above already carries the element's analysis title;
            repeating it here printed the same sentence twice. */}
        <h3>{regionLabel}</h3>
      </div>
      <p className="prs137__lede">
        {distribution
          ? `${shape.scenarios.length > 1 ? "각 시나리오와 연도마다 " : "각 연도마다 "}` +
            `${regionCount}개 성·시가 가진 값의 분포입니다. 성·시 값을 평균한 전국값은 만들지 않고, ` +
            "중앙값과 10~90 분위로 보여줍니다."
          : `${regionLabel}의 원천값입니다. 계산하지 않은 값 그대로입니다.`}
      </p>

      <div className="prs137__controls" data-testid="public-selector">
        {shape.measures.length > 1 && (
          <label>
            <span>표시 항목</span>
            <select
              aria-label="표시 항목 선택"
              value={measure}
              onChange={(event) => update("regionMeasure", event.target.value)}
            >
              {shape.measures.map((key) => (
                <option key={key} value={key}>
                  {measureLabel(key)}
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
            <option value={ALL_REGIONS}>{regionCount}개 성·시 전체 분포</option>
            {shape.hasNationalRow && <option value={NATIONAL_KEY}>전국 값</option>}
            {shape.regions.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="cdp-table-wrap">
        <table className="cdp-table prs137__table">
          <caption>
            {measureLabel(measure)}
            {unitHint ? ` (${unitHint})` : ""} · {firstYear}~{latestYear}년 ·{" "}
            {distribution ? "성·시 값의 분위" : "원천값"}
          </caption>
          <thead>
            <tr>
              <th scope="col">{shape.scenarios.length > 1 ? "시나리오" : "구분"}</th>
              <th scope="col">기간</th>
              <th scope="col">{distribution ? "중앙값" : "값"}</th>
              {distribution && <th scope="col">10분위</th>}
              {distribution && <th scope="col">90분위</th>}
              <th scope="col">성·시 수</th>
            </tr>
          </thead>
          <tbody>
            {series.map((row) => {
              const first = row.points[0];
              const last = row.points[row.points.length - 1];
              return [first, last]
                .filter((point, index, all) => point && all.indexOf(point) === index)
                .map((point) => (
                  <tr key={`${row.scenario}-${point.year}`}>
                    <th scope="row">{scenarioLabel(row.scenario)}</th>
                    <td>{point.year}년</td>
                    <td>{point.median === null ? "자료 없음" : formatPublicNumberV126(point.median, unitHint)}</td>
                    {distribution && (
                      <td>{point.low === null ? "자료 없음" : formatPublicNumberV126(point.low, unitHint)}</td>
                    )}
                    {distribution && (
                      <td>{point.high === null ? "자료 없음" : formatPublicNumberV126(point.high, unitHint)}</td>
                    )}
                    <td>{point.count.toLocaleString("ko-KR")}</td>
                  </tr>
                ));
            })}
          </tbody>
        </table>
      </div>
      <p className="prs137__note">
        시나리오별로 관측기간의 처음과 마지막 연도를 나란히 둡니다. 연도별 전체 값은 아래 상세
        데이터와 다운로드에서 확인할 수 있습니다.
      </p>
    </div>
  );
}
