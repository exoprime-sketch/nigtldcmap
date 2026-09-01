import { useMemo } from "react";
import InteractiveTimeSeriesChartV127 from "../../charts/InteractiveTimeSeriesChartV127";
import type { TimeSeriesV127 } from "../../../types/chartInteractionV127";
import type { SemanticObservationV125 } from "../../../data/visualization/semanticTypesV125";
import type { DataFinderSelectorStateV125 } from "../../../types/dataFinderV125";
import { publicMeasureLabelV126 } from "../../../data/visualization/publicCopyRegistryV126";
import "./public-composition-trend-v132.css";

interface Props {
  elementId: string;
  rows: SemanticObservationV125[];
  selectorState: DataFinderSelectorStateV125;
  onSelectorStateChange: (state: DataFinderSelectorStateV125) => void;
}

type NumericCompositionRowV132 = SemanticObservationV125 & { value: number };

type CompositionMeasureV132 = {
  key: string;
  label: string;
  unit: string;
  numericCount: number;
};

type CompositionSeriesV132 = {
  indicatorKey: string;
  publicKey: string;
  label: string;
  rows: NumericCompositionRowV132[];
  latestValue: number;
  latestYear: number;
  totalLike: boolean;
};

const compositionNumberV132 = new Intl.NumberFormat("ko-KR", {
  maximumFractionDigits: 2,
});

const SERIES_LIMIT_V132 = 8;

function isNumericCompositionRowV132(
  row: SemanticObservationV125
): row is NumericCompositionRowV132 {
  return typeof row.value === "number" && Number.isFinite(row.value);
}

function publicSeriesLabelV132(row: SemanticObservationV125): string {
  const category = row.dimensionLabels.category || row.dimensions.category;
  const detail = row.dimensionLabels.detail || row.dimensions.detail;
  if (category) return localizedEnergyCategoryV132(category.replace(/\s+/g, " ").trim());
  if (detail) return detail.replace(/\s+/g, " ").trim();
  return publicMeasureLabelV126(row.displayLabel || row.semanticMeasure.labelKo);
}

function localizedEnergyCategoryV132(value: string): string {
  const translations: Array<[RegExp, string]> = [
    [/^Total non-renewable energy/iu, "비재생에너지 합계"],
    [/^Total renewable energy/iu, "재생에너지 합계"],
    [/^Other non-renewable energy/iu, "기타 비재생에너지"],
    [/^Renewable hydropower/iu, "재생 수력"],
    [/^Renewable waste/iu, "폐기물에너지"],
    [/^Solar photovoltaic/iu, "태양광"],
    [/^Solar energy/iu, "태양에너지"],
    [/^Offshore wind energy/iu, "해상풍력"],
    [/^Onshore wind energy/iu, "육상풍력"],
    [/^Wind energy/iu, "풍력"],
    [/^Natural gas/iu, "천연가스"],
    [/^Gas biofuels/iu, "바이오가스"],
    [/^Solid biofuels/iu, "고체 바이오연료"],
    [/^Bioenergy/iu, "바이오에너지"],
    [/^Fossil fuels/iu, "화석연료"],
    [/^Coal/iu, "석탄"],
    [/^Oil/iu, "석유"],
  ];
  const translated = translations.find(([pattern]) => pattern.test(value));
  return translated ? value.replace(translated[0], translated[1]) : value;
}

function isTotalLikeV132(row: SemanticObservationV125): boolean {
  const candidate = `${row.indicatorId} ${row.dimensionLabels.category || ""} ${row.dimensions.category || ""}`.toLocaleLowerCase("en-US");
  return /(?:^|[_\s(])(?:total|전체|총계|합계)(?:[_\s)]|$)/u.test(candidate);
}

function buildSeriesV132(rows: NumericCompositionRowV132[]): CompositionSeriesV132[] {
  const groups = new Map<string, NumericCompositionRowV132[]>();
  rows.forEach((row) => {
    const current = groups.get(row.indicatorId) || [];
    current.push(row);
    groups.set(row.indicatorId, current);
  });
  return Array.from(groups.entries())
    .map(([indicatorKey, candidates], index) => {
      const ordered = candidates
        .filter((row) => typeof row.year === "number")
        .sort((left, right) => (left.year || 0) - (right.year || 0));
      const latest = ordered[ordered.length - 1];
      if (!latest) return null;
      return {
        indicatorKey,
        publicKey: `composition-series-${index + 1}`,
        label: publicSeriesLabelV132(latest),
        rows: ordered,
        latestValue: latest.value,
        latestYear: latest.year as number,
        totalLike: isTotalLikeV132(latest),
      };
    })
    .filter((item): item is CompositionSeriesV132 => Boolean(item))
    .sort((left, right) => right.latestValue - left.latestValue || left.label.localeCompare(right.label, "ko"));
}

export default function PublicCompositionTrendAnalysisV132({
  elementId,
  rows,
  selectorState,
  onSelectorStateChange,
}: Props) {
  const measures = useMemo<CompositionMeasureV132[]>(() => {
    const groups = new Map<string, CompositionMeasureV132>();
    rows.forEach((row) => {
      const key = `${row.semanticMeasure.key}|${row.semanticMeasure.unit}`;
      const current = groups.get(key);
      groups.set(key, {
        key,
        label: publicMeasureLabelV126(row.semanticMeasure.labelKo),
        unit: row.semanticMeasure.unit || "—",
        numericCount:
          (current?.numericCount || 0) + (isNumericCompositionRowV132(row) ? 1 : 0),
      });
    });
    return Array.from(groups.values()).sort(
      (left, right) => right.numericCount - left.numericCount || left.label.localeCompare(right.label, "ko")
    );
  }, [rows]);
  const requestedMeasure = selectorState.measure
    ? measures.find((measure) => measure.key.startsWith(`${selectorState.measure}|`))
    : null;
  const selectedMeasure = requestedMeasure || measures[0] || null;
  const measureRows = selectedMeasure
    ? rows.filter(
        (row) => `${row.semanticMeasure.key}|${row.semanticMeasure.unit}` === selectedMeasure.key
      )
    : [];
  const numericRows = measureRows.filter(isNumericCompositionRowV132);
  const allSeries = useMemo(() => buildSeriesV132(numericRows), [numericRows]);
  const focusKey = selectorState.dimensions.compositionSeries || "";
  const focused = allSeries.find((series) => series.publicKey === focusKey) || null;
  const displayedSeries = focused
    ? [focused]
    : allSeries.slice(0, SERIES_LIMIT_V132);
  const timeSeries = displayedSeries.map<TimeSeriesV127>((series, index) => ({
    id: series.publicKey,
    label: series.label,
    unit: selectedMeasure?.unit || "—",
    marker: (["circle", "square", "diamond", "triangle", "cross"] as const)[index % 5],
    linePattern: (["solid", "dash", "dot", "long-dash"] as const)[index % 4],
    points: series.rows.map((row) => ({
      id: `${series.publicKey}-${row.year}`,
      x: row.year as number,
      xLabel: `${row.year}년`,
      value: row.value,
    })),
  }));
  const years = Array.from(
    new Set(
      measureRows
        .map((row) => row.year)
        .filter((year): year is number => typeof year === "number")
    )
  ).sort((left, right) => left - right);
  const selectedYear =
    selectorState.year !== null &&
    selectorState.year !== undefined &&
    years.includes(selectorState.year)
      ? selectorState.year
      : years[years.length - 1] ?? null;
  const selectedYearRows = allSeries.map((series) => {
    const value = series.rows.find((row) => row.year === selectedYear)?.value ?? null;
    return { ...series, value };
  });
  const populatedSelectedRows = selectedYearRows.filter(
    (item): item is typeof item & { value: number } => typeof item.value === "number"
  );
  const maximumSelectedValue = Math.max(
    ...populatedSelectedRows.map((item) => Math.abs(item.value)),
    1e-9
  );
  const hasTimeAnalysis = displayedSeries.some((series) => series.rows.length >= 3);
  const totalLikeCount = allSeries.filter((series) => series.totalLike).length;

  if (!selectedMeasure || numericRows.length === 0) {
    return <div className="pct132-empty" role="status">표시할 구성 관측값이 없습니다.</div>;
  }

  return (
    <div
      className="pct132"
      data-composition-time-analysis={hasTimeAnalysis ? "true" : "false"}
      data-composition-time-analysis-v132={hasTimeAnalysis ? "true" : "false"}
      data-mixed-unit-axis="false"
      data-testid="composition-time-analysis-v132"
      data-total-included-as-component="false"
      data-total-like-series-count={totalLikeCount}
      data-zero-imputation="false"
    >
      <section className="pct132__panel" aria-labelledby={`pct132-${elementId}-trend`}>
        <header className="pct132__heading">
          <div>
            <span>주 분석</span>
            <h3 id={`pct132-${elementId}-trend`}>연도별 구성 변화</h3>
            <p>
              {allSeries.length > SERIES_LIMIT_V132 && !focused
                ? `최신값 기준 주요 ${SERIES_LIMIT_V132}개 계열을 먼저 표시합니다. 아래 선택에서 다른 계열의 전체 추이를 볼 수 있습니다.`
                : "동일한 측정항목과 단위의 계열만 한 축에서 비교합니다."}
            </p>
          </div>
          <div className="pct132__selectors">
            {measures.length > 1 ? (
              <label>
                측정항목
                <select
                  onChange={(event) => {
                    const next = measures.find((measure) => measure.key === event.target.value);
                    if (!next) return;
                    onSelectorStateChange({
                      ...selectorState,
                      measure: next.key.split("|")[0],
                      year: null,
                      dimensions: {
                        ...selectorState.dimensions,
                        compositionSeries: "",
                      },
                    });
                  }}
                  value={selectedMeasure.key}
                >
                  {measures.map((measure) => (
                    <option key={measure.key} value={measure.key}>{measure.label} · {measure.unit}</option>
                  ))}
                </select>
              </label>
            ) : null}
            {allSeries.length > SERIES_LIMIT_V132 ? (
              <label>
                계열 보기
                <select
                  onChange={(event) =>
                    onSelectorStateChange({
                      ...selectorState,
                      dimensions: {
                        ...selectorState.dimensions,
                        compositionSeries: event.target.value,
                      },
                    })
                  }
                  value={focused?.publicKey || ""}
                >
                  <option value="">주요 {SERIES_LIMIT_V132}개 함께 보기</option>
                  {allSeries.map((series) => (
                    <option key={series.publicKey} value={series.publicKey}>{series.label}</option>
                  ))}
                </select>
              </label>
            ) : null}
          </div>
        </header>

        {hasTimeAnalysis ? (
          <InteractiveTimeSeriesChartV127
            ariaLabel={`${selectedMeasure.label} 연도별 변화`}
            description={
              totalLikeCount > 0
                ? "전체·합계 계열은 구성항목에 더하지 않고 독립된 비교 계열로 표시합니다."
                : undefined
            }
            formatValue={(value) => compositionNumberV132.format(value)}
            series={timeSeries}
            showDelta={false}
            testId="composition-trend-chart-v132"
            title={`${selectedMeasure.label} 추이`}
            unit={selectedMeasure.unit}
            xAxisTitle="연도"
            yAxisTitle={selectedMeasure.label}
            zoom={{ enabled: years.length >= 10, minimumSpan: Math.min(8, Math.max(2, years.length - 1)) }}
          />
        ) : (
          <div className="pct132-empty" role="status">
            비교 가능한 연도가 3개 미만이어서 선택연도 구성으로 표시합니다.
          </div>
        )}
      </section>

      <section className="pct132__panel" aria-labelledby={`pct132-${elementId}-detail`}>
        <header className="pct132__heading pct132__heading--detail">
          <div>
            <span>보조 분석</span>
            <h3 id={`pct132-${elementId}-detail`}>선택연도 상세</h3>
          </div>
          {years.length > 0 ? (
            <label>
              기준연도
              <select
                onChange={(event) =>
                  onSelectorStateChange({ ...selectorState, year: Number(event.target.value) })
                }
                value={selectedYear ?? ""}
              >
                {[...years].reverse().map((year) => (
                  <option key={year} value={year}>{year}년</option>
                ))}
              </select>
            </label>
          ) : null}
        </header>

        <div className="pct132__bars" role="list" aria-label={`${selectedYear || "선택"}년 계열별 값`}>
          {selectedYearRows.map((item) => (
            <div
              className={item.totalLike ? "is-total" : ""}
              key={item.publicKey}
              role="listitem"
              tabIndex={0}
            >
              <span>{item.label}</span>
              <i aria-hidden="true">
                <b style={{ width: item.value === null ? "0%" : `${(Math.abs(item.value) / maximumSelectedValue) * 100}%` }} />
              </i>
              <strong>{item.value === null ? "미공개" : `${compositionNumberV132.format(item.value)} ${selectedMeasure.unit}`}</strong>
              {item.totalLike ? <small>전체·합계 지표</small> : null}
            </div>
          ))}
        </div>
        {elementId === "A-005" ? (
          <p className="pct132__notice">
            제조업은 광공업·건설의 하위항목이므로 농림어업·광공업·건설·서비스업과 함께 100% 구성항목으로 더하지 않습니다.
          </p>
        ) : totalLikeCount > 0 ? (
          <p className="pct132__notice">
            전체·합계와 세부항목은 포함관계가 있으므로 막대 길이를 100% 구성비로 합산하지 않습니다.
          </p>
        ) : null}
      </section>
    </div>
  );
}
