import { useId, useMemo } from "react";
import InteractiveTimeSeriesChartV127 from "../../charts/InteractiveTimeSeriesChartV127";
import type { TimeSeriesV127 } from "../../../types/chartInteractionV127";
import type { SemanticObservationV125 } from "../../../data/visualization/semanticTypesV125";
import type { DataFinderSelectorStateV125 } from "../../../types/dataFinderV125";
import { formatPublicNumberV126 } from "../../../data/visualization/publicNumberFormatV126";
import {
  PublicTermHelpV134,
  PublicTermTextV134,
} from "../../help/PublicTermV134";
import "./public-emissions-analysis-v132.css";

interface Props {
  elementId: string;
  rows: SemanticObservationV125[];
  selectorState: DataFinderSelectorStateV125;
  onSelectorStateChange: (state: DataFinderSelectorStateV125) => void;
}

type NumericEmissionRowV132 = SemanticObservationV125 & { value: number; year: number };

type EmissionMeasureV132 = {
  key: string;
  semanticKey: string;
  label: string;
  unit: string;
  rowCount: number;
};

type EmissionSeriesV132 = {
  key: string;
  label: string;
  rows: NumericEmissionRowV132[];
};

type CompleteYearV132 = {
  year: number;
  total: number;
  values: Array<{
    key: string;
    label: string;
    value: number;
  }>;
};

const EMISSION_COLORS_V132 = [
  "#176b57",
  "#d97706",
  "#2563a6",
  "#a23e63",
  "#6d5aa8",
  "#4f7d20",
  "#b45309",
  "#0f766e",
  "#68737d",
];

const MARKERS_V132 = ["circle", "square", "diamond", "triangle", "cross"] as const;
const PATTERNS_V132 = ["solid", "dash", "dot", "long-dash"] as const;

function isNumericEmissionRowV132(
  row: SemanticObservationV125
): row is NumericEmissionRowV132 {
  return (
    typeof row.value === "number" &&
    Number.isFinite(row.value) &&
    typeof row.year === "number" &&
    Number.isFinite(row.year)
  );
}

function emissionSeriesLabelV132(row: SemanticObservationV125): string {
  const category = (
    row.dimensionLabels.category ||
    row.dimensions.category ||
    row.displayLabel ||
    row.semanticMeasure.labelKo
  ).trim();
  const labels: Record<string, string> = {
    "CH4": "메탄(CH₄)",
    "CH4(CO2 환산)": "메탄(CH₄ 환산)",
    "CO2": "이산화탄소(CO₂)",
    "CO2(CO2 환산)": "이산화탄소(CO₂ 환산)",
    "F-gas": "불소계 온실가스",
    "F-gas(CO2 환산)": "불소계 온실가스(CO₂ 환산)",
    "N2O": "아산화질소(N₂O)",
    "N2O(CO2 환산)": "아산화질소(N₂O 환산)",
  };
  return labels[category] || category;
}

function emissionMeasureLabelV132(elementId: string, unit: string): string {
  if (elementId === "A-010") {
    return /co2eq/iu.test(unit) ? "가스별 CO₂ 환산 배출량" : "가스별 질량";
  }
  return "부문별 온실가스 배출량";
}

function buildEmissionSeriesV132(rows: NumericEmissionRowV132[]): EmissionSeriesV132[] {
  const groups = new Map<string, NumericEmissionRowV132[]>();
  rows.forEach((row) => {
    const current = groups.get(row.indicatorId) || [];
    current.push(row);
    groups.set(row.indicatorId, current);
  });
  return Array.from(groups.entries())
    .map(([key, candidates]) => ({
      key,
      label: emissionSeriesLabelV132(candidates[0]),
      rows: [...candidates].sort((left, right) => left.year - right.year),
    }))
    .sort((left, right) => left.label.localeCompare(right.label, "ko"));
}

function completeYearsV132(series: EmissionSeriesV132[]): CompleteYearV132[] {
  if (series.length === 0) return [];
  const years = Array.from(
    new Set(series.flatMap((item) => item.rows.map((row) => row.year)))
  ).sort((left, right) => left - right);

  return years.flatMap((year) => {
    const values = series.map((item) => {
      const row = item.rows.find((candidate) => candidate.year === year);
      return row
        ? { key: item.key, label: item.label, value: row.value }
        : null;
    });
    if (values.some((value) => value === null)) return [];
    const populated = values.filter(
      (value): value is { key: string; label: string; value: number } => value !== null
    );
    return [{
      year,
      total: populated.reduce((sum, value) => sum + value.value, 0),
      values: populated,
    }];
  });
}

function EmissionsCompositionBarV132({
  year,
  total,
  values,
  unit,
}: CompleteYearV132 & { unit: string }) {
  const width = 760;
  let cursor = 0;
  return (
    <div
      className="pea132-composition"
      data-testid="emissions-latest-composition-v132"
      data-zero-imputation="false"
    >
      <svg
        aria-label={`${year}년 배출량 구성. ${values
          .map((item) => `${item.label} ${formatPublicNumberV126(item.value, unit)} ${unit}`)
          .join(", ")}`}
        preserveAspectRatio="none"
        role="img"
        viewBox={`0 0 ${width} 72`}
      >
        <title>{year}년 배출량 구성</title>
        {values.map((item, index) => {
          const segmentWidth = total > 0 ? (item.value / total) * width : 0;
          const x = cursor;
          cursor += segmentWidth;
          return (
            <rect
              fill={EMISSION_COLORS_V132[index % EMISSION_COLORS_V132.length]}
              key={item.key}
              width={Math.max(0, segmentWidth)}
              x={x}
              y={8}
              height={48}
            >
              <title>{`${item.label}: ${formatPublicNumberV126(item.value, unit)} ${unit} (${formatPublicNumberV126((item.value / total) * 100, "%")}%)`}</title>
            </rect>
          );
        })}
      </svg>
      <ul aria-label={`${year}년 배출량 구성 상세`}>
        {values
          .map((item, colorIndex) => ({ ...item, colorIndex }))
          .sort((left, right) => right.value - left.value)
          .map((item) => (
            <li
              aria-label={`${item.label}, ${formatPublicNumberV126(item.value, unit)} ${unit}, ${formatPublicNumberV126((item.value / total) * 100, "%")}퍼센트`}
              key={item.key}
              tabIndex={0}
            >
              <i
                aria-hidden="true"
                data-pattern={PATTERNS_V132[item.colorIndex % PATTERNS_V132.length]}
                style={{ backgroundColor: EMISSION_COLORS_V132[item.colorIndex % EMISSION_COLORS_V132.length] }}
              />
              <span>{item.label}</span>
              <strong>{formatPublicNumberV126(item.value, unit)} {unit}</strong>
              <small>{formatPublicNumberV126((item.value / total) * 100, "%")}%</small>
            </li>
          ))}
      </ul>
    </div>
  );
}

export default function PublicEmissionsAnalysisV132({
  elementId,
  rows,
  selectorState,
  onSelectorStateChange,
}: Props) {
  const headingId = useId();
  const measures = useMemo<EmissionMeasureV132[]>(() => {
    const groups = new Map<string, EmissionMeasureV132>();
    rows.forEach((row) => {
      if (!isNumericEmissionRowV132(row)) return;
      const key = `${row.semanticMeasure.key}|${row.semanticMeasure.unit}`;
      const current = groups.get(key);
      groups.set(key, {
        key,
        semanticKey: row.semanticMeasure.key,
        label: emissionMeasureLabelV132(elementId, row.semanticMeasure.unit),
        unit: row.semanticMeasure.unit,
        rowCount: (current?.rowCount || 0) + 1,
      });
    });
    return Array.from(groups.values()).sort((left, right) => {
      const leftPreferred = /co2eq/iu.test(left.unit) ? 1 : 0;
      const rightPreferred = /co2eq/iu.test(right.unit) ? 1 : 0;
      return rightPreferred - leftPreferred || right.rowCount - left.rowCount;
    });
  }, [elementId, rows]);

  const requestedMeasure = selectorState.measure
    ? measures.find((measure) => measure.semanticKey === selectorState.measure)
    : null;
  const selectedMeasure = requestedMeasure || measures[0] || null;
  const selectedRows = selectedMeasure
    ? rows.filter(
        (row): row is NumericEmissionRowV132 =>
          isNumericEmissionRowV132(row) &&
          `${row.semanticMeasure.key}|${row.semanticMeasure.unit}` === selectedMeasure.key
      )
    : [];
  const componentSeries = useMemo(
    () => buildEmissionSeriesV132(selectedRows),
    [selectedRows]
  );
  const completeYears = useMemo(
    () => completeYearsV132(componentSeries),
    [componentSeries]
  );
  const totalIsMeaningful = Boolean(
    selectedMeasure && (elementId === "A-011" || /co2eq/iu.test(selectedMeasure.unit))
  );
  const latestComplete = completeYears[completeYears.length - 1] || null;
  const selectedYear =
    selectorState.year && completeYears.some((item) => item.year === selectorState.year)
      ? selectorState.year
      : latestComplete?.year ?? null;
  const selectedComposition =
    completeYears.find((item) => item.year === selectedYear) || latestComplete;
  const largestComponent = selectedComposition
    ? [...selectedComposition.values].sort((left, right) => right.value - left.value)[0]
    : null;

  const componentChartSeries = componentSeries.map<TimeSeriesV127>((item, index) => ({
    id: `emissions-component-${index + 1}`,
    label: item.label,
    unit: selectedMeasure?.unit || "—",
    color: EMISSION_COLORS_V132[index % EMISSION_COLORS_V132.length],
    marker: MARKERS_V132[index % MARKERS_V132.length],
    linePattern: PATTERNS_V132[index % PATTERNS_V132.length],
    points: item.rows.map((row) => ({
      id: `emissions-component-${index + 1}-${row.year}`,
      x: row.year,
      xLabel: `${row.year}년`,
      value: row.value,
    })),
  }));
  const totalChartSeries: TimeSeriesV127[] = totalIsMeaningful
    ? [{
        id: "emissions-derived-total",
        label: "구성계열 합계(산출)",
        unit: selectedMeasure?.unit || "—",
        color: "#173b34",
        marker: "diamond",
        linePattern: "solid",
        points: completeYears.map((item) => ({
          id: `emissions-derived-total-${item.year}`,
          x: item.year,
          xLabel: `${item.year}년`,
          value: item.total,
        })),
      }]
    : [];

  if (!selectedMeasure || componentSeries.length === 0) {
    return <div className="pea132-empty" role="status">표시할 배출량 관측값이 없습니다.</div>;
  }

  return (
    <div
      className="pea132"
      data-derived-total-complete-years-only="true"
      data-mixed-unit-axis="false"
      data-testid="emissions-analysis-v132"
      data-total-included-as-component="false"
      data-zero-imputation="false"
    >
      <section className="pea132-panel pea132-panel--overview" aria-labelledby={`${headingId}-overview`}>
        <header className="pea132-heading">
          <div>
            <span>핵심현황</span>
            <h3 id={`${headingId}-overview`}>배출량 변화와 구성</h3>
            <p>같은 단위의 계열만 비교하며, 공개되지 않은 값은 합계에 포함하지 않습니다.</p>
          </div>
          {measures.length > 1 ? (
            <div data-public-selector-scope-v134="emissions-measure">
              <label>
                측정 기준
                <select
                data-testid="emissions-measure-selector-v132"
                onChange={(event) => {
                  const next = measures.find((measure) => measure.key === event.target.value);
                  if (!next) return;
                  onSelectorStateChange({
                    ...selectorState,
                    measure: next.semanticKey,
                    year: null,
                  });
                }}
                value={selectedMeasure.key}
              >
                {measures.map((measure) => (
                  <option key={measure.key} value={measure.key}>
                    {measure.label} · {measure.unit}
                  </option>
                ))}
                </select>
              </label>
              <PublicTermHelpV134
                text={`${selectedMeasure.label} · ${selectedMeasure.unit}`}
              />
            </div>
          ) : null}
        </header>

        <div className="pea132-kpis" data-testid="emissions-kpis-v132">
          <article>
            <span>{totalIsMeaningful ? "최신 완전연도 합계" : "선택 기준"}</span>
            <strong>
              {totalIsMeaningful && latestComplete
                ? `${formatPublicNumberV126(latestComplete.total, selectedMeasure.unit)} ${selectedMeasure.unit}`
                : <PublicTermTextV134 text={selectedMeasure.label} />}
            </strong>
            <small>{totalIsMeaningful ? "모든 구성계열이 있는 연도만 산출" : "서로 다른 가스 질량은 합산하지 않음"}</small>
          </article>
          <article>
            <span>최신 비교연도</span>
            <strong>{latestComplete ? `${latestComplete.year}년` : "—"}</strong>
            <small>{completeYears.length}개 완전연도</small>
          </article>
          <article>
            <span>가장 큰 {elementId === "A-010" ? "가스" : "부문"}</span>
            <strong><PublicTermTextV134 text={largestComponent?.label || "—"} /></strong>
            <small>
              {largestComponent
                ? `${formatPublicNumberV126(largestComponent.value, selectedMeasure.unit)} ${selectedMeasure.unit}`
                : "비교 가능한 값 없음"}
            </small>
          </article>
          <article>
            <span>비교 계열</span>
            <strong>{componentSeries.length}개</strong>
            <small>동일 단위 기준</small>
          </article>
        </div>
      </section>

      {totalIsMeaningful && totalChartSeries.length > 0 ? (
        <section
          className="pea132-panel"
          aria-labelledby={`${headingId}-total`}
          data-complete-year-count={completeYears.length}
          data-derived-total-formula="sum-only-when-every-component-is-populated"
          data-testid="emissions-total-trend-panel-v132"
        >
          <header className="pea132-heading">
            <div>
              <span>주 분석</span>
              <h3 id={`${headingId}-total`}>전체 배출량 변화</h3>
              <p>
                모든 {componentSeries.length}개 구성계열이 제공된 연도만 합산한 플랫폼 산출값입니다.
              </p>
            </div>
          </header>
          <InteractiveTimeSeriesChartV127
            ariaLabel={`구성계열 합계 연도별 변화, 단위 ${selectedMeasure.unit}`}
            formatValue={(value) => formatPublicNumberV126(value, selectedMeasure.unit)}
            series={totalChartSeries}
            showDelta
            testId="emissions-total-trend-v132"
            title={`${completeYears[0]?.year || ""}–${latestComplete?.year || ""}년 구성계열 합계`}
            unit={selectedMeasure.unit}
            xAxisTitle="연도"
            yAxisTitle="온실가스 배출량"
            zoom={{ enabled: completeYears.length >= 10, minimumSpan: 8 }}
          />
        </section>
      ) : (
        <section className="pea132-panel pea132-notice" aria-label="합계 산출 안내">
          <strong>가스별 질량은 합산하지 않습니다</strong>
          <p>Gg 단위의 CO₂·CH₄·N₂O·불소계 가스는 온난화 영향이 서로 달라 하나의 총량이나 구성비로 만들지 않습니다.</p>
        </section>
      )}

      <section className="pea132-panel" aria-labelledby={`${headingId}-breakdown`}>
        <header className="pea132-heading">
          <div>
            <span>구성 분석</span>
            <h3 id={`${headingId}-breakdown`}>
              {elementId === "A-010" ? "가스별 배출량 변화" : "부문별 배출량 변화"}
            </h3>
            <p>범례에서 계열을 켜고 끄며 같은 단위 안에서 장기 변화를 비교할 수 있습니다.</p>
          </div>
        </header>
        <InteractiveTimeSeriesChartV127
          ariaLabel={`${selectedMeasure.label} 계열별 연도 변화, 단위 ${selectedMeasure.unit}`}
          formatValue={(value) => formatPublicNumberV126(value, selectedMeasure.unit)}
          series={componentChartSeries}
          showDelta={false}
          testId="emissions-breakdown-trend-v132"
          title={selectedMeasure.label}
          tooltipMode="shared-x"
          unit={selectedMeasure.unit}
          xAxisTitle="연도"
          yAxisTitle={selectedMeasure.label}
          zoom={{ enabled: completeYears.length >= 10, minimumSpan: 8 }}
        />
      </section>

      {totalIsMeaningful && selectedComposition ? (
        <section className="pea132-panel" aria-labelledby={`${headingId}-composition`}>
          <header className="pea132-heading pea132-heading--composition">
            <div>
              <span>선택연도 구성</span>
              <h3 id={`${headingId}-composition`}>{selectedComposition.year}년 배출량 구성</h3>
              <p>각 비중은 같은 단위의 구성계열 합계를 분모로 산출했습니다.</p>
            </div>
            <label>
              기준연도
              <select
                data-testid="emissions-year-selector-v132"
                onChange={(event) =>
                  onSelectorStateChange({
                    ...selectorState,
                    year: Number(event.target.value),
                  })
                }
                value={selectedComposition.year}
              >
                {[...completeYears].reverse().map((item) => (
                  <option key={item.year} value={item.year}>{item.year}년</option>
                ))}
              </select>
            </label>
          </header>
          <EmissionsCompositionBarV132
            total={selectedComposition.total}
            unit={selectedMeasure.unit}
            values={selectedComposition.values}
            year={selectedComposition.year}
          />
        </section>
      ) : null}
    </div>
  );
}
