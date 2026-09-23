import ChartAxesV150 from "../../charts/ChartAxesV150";
import { useMemo, useState } from "react";
import { StackedAreaChartV153 } from "../../charts/StackedAreaChartV153";
import type { StackedAreaSeriesV153, StackedAreaYearV153 } from "../../charts/StackedAreaChartV153";
import type { SemanticObservationV125 } from "../../../data/visualization/semanticTypesV125";
import type { DataFinderSelectorStateV125 } from "../../../types/dataFinderV125";
import "./primary-energy-composition-v132.css";
import { PublicTermTextV134 } from "../../help/PublicTermV134";

interface Props {
  rows: SemanticObservationV125[];
  selectorState: DataFinderSelectorStateV125;
  onSelectorStateChange: (state: DataFinderSelectorStateV125) => void;
}

type NumericEnergyRowV132 = SemanticObservationV125 & { value: number };

type EnergySeriesV132 = StackedAreaSeriesV153 & { indicatorId: string };

type EnergyYearV132 = StackedAreaYearV153;

const ENERGY_SERIES_V132: EnergySeriesV132[] = [
  {
    indicatorId: "A-016_primary_energy_oil",
    key: "oil",
    label: "석유",
    color: "#9b5a35",
    pattern: "diagonal",
  },
  {
    indicatorId: "A-016_primary_energy_natural_gas",
    key: "natural-gas",
    label: "천연가스",
    color: "#3879a8",
    pattern: "dots",
  },
  {
    indicatorId: "A-016_primary_energy_coal",
    key: "coal",
    label: "석탄",
    color: "#48545c",
    pattern: "cross",
  },
  {
    indicatorId: "A-016_primary_energy_nuclear",
    key: "nuclear",
    label: "원자력",
    color: "#8066a8",
    pattern: "vertical",
  },
  {
    indicatorId: "A-016_primary_energy_hydro",
    key: "hydro",
    label: "수력",
    color: "#2086a7",
    pattern: "horizontal",
  },
  {
    indicatorId: "A-016_primary_energy_renewables",
    key: "renewables",
    label: "기타 재생에너지",
    color: "#218363",
    pattern: "solid",
  },
];

const TOTAL_INDICATOR_V132 = "A-016_primary_energy_total_primary_energy";

const ENERGY_LABELS_V153 = { subject: "에너지원", quantity: "1차 에너지 소비량", total: "공급 총계" };

const numberFormatterV132 = new Intl.NumberFormat("ko-KR", {
  maximumFractionDigits: 3,
});

const percentFormatterV132 = new Intl.NumberFormat("ko-KR", {
  maximumFractionDigits: 1,
});

function isNumericEnergyRowV132(
  row: SemanticObservationV125
): row is NumericEnergyRowV132 {
  return typeof row.value === "number" && Number.isFinite(row.value);
}

function formatEnergyV132(value: number): string {
  return numberFormatterV132.format(value);
}

function completeEnergyYearsV132(rows: NumericEnergyRowV132[]): EnergyYearV132[] {
  const byIndicatorAndYear = new Map<string, number>();
  rows.forEach((row) => {
    if (typeof row.year !== "number") return;
    byIndicatorAndYear.set(`${row.indicatorId}|${row.year}`, row.value);
  });
  const years = Array.from(
    new Set(
      rows
        .map((row) => row.year)
        .filter((year): year is number => typeof year === "number")
    )
  ).sort((left, right) => left - right);

  return years.flatMap((year) => {
    const values: Record<string, number> = {};
    for (const series of ENERGY_SERIES_V132) {
      const value = byIndicatorAndYear.get(`${series.indicatorId}|${year}`);
      if (value === undefined) return [];
      values[series.key] = value;
    }
    return [
      {
        year,
        values,
        total: byIndicatorAndYear.get(`${TOTAL_INDICATOR_V132}|${year}`) ?? null,
      },
    ];
  });
}

export default function PrimaryEnergyCompositionAnalysisV132({
  rows,
  selectorState,
  onSelectorStateChange,
}: Props) {
  const numericRows = useMemo(() => rows.filter(isNumericEnergyRowV132), [rows]);
  const allYears = useMemo(() => completeEnergyYearsV132(numericRows), [numericRows]);
  const minimumYear = allYears[0]?.year ?? null;
  const maximumYear = allYears[allYears.length - 1]?.year ?? null;
  const [rangeStart, setRangeStart] = useState<number | null>(minimumYear);
  const [rangeEnd, setRangeEnd] = useState<number | null>(maximumYear);
  const [visibleSeries, setVisibleSeries] = useState<Set<string>>(
    () => new Set(ENERGY_SERIES_V132.map((series) => series.key))
  );
  const unit =
    numericRows.find((row) => ENERGY_SERIES_V132.some((series) => series.indicatorId === row.indicatorId))
      ?.semanticMeasure.unit || "EJ";

  if (minimumYear === null || maximumYear === null || allYears.length === 0) {
    return (
      <div className="pec132-empty" role="status">
        표시할 1차 에너지 관측값이 없습니다.
      </div>
    );
  }

  const safeStart = Math.max(minimumYear, Math.min(rangeStart ?? minimumYear, maximumYear));
  const safeEnd = Math.max(safeStart, Math.min(rangeEnd ?? maximumYear, maximumYear));
  const displayedYears = allYears.filter(
    (item) => item.year >= safeStart && item.year <= safeEnd
  );
  const latest = allYears[allYears.length - 1];
  const selectedYear =
    selectorState.year !== null &&
    selectorState.year !== undefined &&
    allYears.some((item) => item.year === selectorState.year)
      ? selectorState.year
      : maximumYear;
  const selected = allYears.find((item) => item.year === selectedYear) || latest;
  const latestSources = ENERGY_SERIES_V132.map((series) => ({
    ...series,
    value: latest.values[series.key],
  }));
  const largestSource = latestSources.reduce((largest, candidate) =>
    candidate.value > largest.value ? candidate : largest
  );
  const renewableTotal = latest.values.hydro + latest.values.renewables;

  const toggleSeries = (key: string) => {
    setVisibleSeries((current) => {
      const next = new Set(current);
      if (next.has(key)) {
        if (next.size <= 1) return current;
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  const applyRange = (years: number | null) => {
    setRangeEnd(maximumYear);
    setRangeStart(years === null ? minimumYear : Math.max(minimumYear, maximumYear - years + 1));
  };

  return (
    <div
      className="pec132"
      data-a016-specialized-renderer="true"
      data-composition-time-analysis="true"
      data-composition-time-analysis-v132="true"
      data-mixed-unit-axis="false"
      data-testid="a016-energy-analysis-v132"
      data-total-included-as-component="false"
      data-zero-imputation="false"
    >

      <section className="pec132__panel" aria-labelledby="pec132-absolute-title" data-testid="a016-absolute-trend" data-analysis-block="stacked-area">
        <header className="pec132__heading">
          <div>
            <span>주 분석</span>
            <h3 id="pec132-absolute-title">연도별 에너지원 절대량 변화</h3>
            <p>공급 총계는 구성항목과 중복되므로 면적 합계에 포함하지 않습니다.</p>
          </div>
          <div className="pec132__range" aria-label="표시기간 선택">
            <span>표시기간 {safeStart}–{safeEnd}</span>
            <div role="group" aria-label="빠른 기간 선택">
              <button aria-pressed={safeStart === minimumYear} onClick={() => applyRange(null)} type="button">전체</button>
              <button aria-pressed={safeStart === Math.max(minimumYear, maximumYear - 29)} onClick={() => applyRange(30)} type="button">최근 30년</button>
              <button aria-pressed={safeStart === Math.max(minimumYear, maximumYear - 14)} onClick={() => applyRange(15)} type="button">최근 15년</button>
            </div>
          </div>
        </header>

        <div className="pec132__legend" aria-label="에너지원 계열 선택">
          {ENERGY_SERIES_V132.map((series) => {
            const active = visibleSeries.has(series.key);
            return (
              <button
                aria-label={`${series.label} 계열 ${active ? "숨기기" : "표시"}`}
                aria-pressed={active}
                disabled={active && visibleSeries.size === 1}
                key={series.key}
                onClick={() => toggleSeries(series.key)}
                type="button"
              >
                <i
                  aria-hidden="true"
                  data-pattern={series.pattern}
                  style={{ backgroundColor: series.color }}
                />
                {series.label}
              </button>
            );
          })}
          <span className="pec132__total-legend" data-testid="a016-total-legend">
            <i aria-hidden="true" />
            공급 총계 · 점선
          </span>
        </div>

        <ChartAxesV150 x="연도" y="에너지원별 소비량(누적 면적)" unit={unit} />
        <StackedAreaChartV153
          labels={ENERGY_LABELS_V153}
          totalLineTestId="a016-total-line"
          tooltipTestId="a016-chart-tooltip"
          mode="absolute"
          onSelectYear={(year) =>
            onSelectorStateChange({ ...selectorState, year })
          }
          series={ENERGY_SERIES_V132}
          unit={unit}
          visibleSeries={visibleSeries}
          years={displayedYears}
        />
      </section>

      <section className="pec132__panel" aria-labelledby="pec132-share-title" data-testid="a016-share-trend" data-analysis-block="stacked-area">
        <header className="pec132__heading">
          <div>
            <span>구성 변화</span>
            <h3 id="pec132-share-title">연도별 에너지원 구성비</h3>
            <p>각 연도의 여섯 에너지원 합계를 100%로 계산한 구성비입니다.</p>
          </div>
        </header>
        <ChartAxesV150 x="연도" y="에너지원 구성비(누적 면적)" unit="%" composition />
        <StackedAreaChartV153
          labels={ENERGY_LABELS_V153}
          totalLineTestId="a016-total-line"
          tooltipTestId="a016-chart-tooltip"
          mode="share"
          onSelectYear={(year) =>
            onSelectorStateChange({ ...selectorState, year })
          }
          series={ENERGY_SERIES_V132}
          unit="%"
          visibleSeries={visibleSeries}
          years={displayedYears}
        />
      </section>

      <section className="pec132__panel" aria-labelledby="pec132-selected-title" data-testid="a016-selected-year" data-analysis-block="category-bar">
        <header className="pec132__heading pec132__heading--selected">
          <div>
            <span>보조 분석</span>
            <h3 id="pec132-selected-title">선택연도 상세</h3>
          </div>
          <label>
            기준연도
            <select
              aria-label="상세 구성 기준연도"
              onChange={(event) =>
                onSelectorStateChange({
                  ...selectorState,
                  year: Number(event.target.value),
                })
              }
              value={selected.year}
            >
              {[...allYears].reverse().map((item) => (
                <option key={item.year} value={item.year}>{item.year}년</option>
              ))}
            </select>
          </label>
        </header>
        <ChartAxesV150 x="에너지 소비량" y="에너지원" unit={unit} />
        <SelectedYearBarsV132 series={ENERGY_SERIES_V132} unit={unit} year={selected} />
      </section>

      <footer className="pec132__source">
        <span>자료 제공기관: Energy Institute</span>
        <span>
          단위: <PublicTermTextV134 text={unit} />
        </span>
        <span>최신 기준연도: {maximumYear}년</span>
      </footer>
    </div>
  );
}

function SelectedYearBarsV132({
  series,
  unit,
  year,
}: {
  series: EnergySeriesV132[];
  unit: string;
  year: EnergyYearV132;
}) {
  const maximum = Math.max(...series.map((item) => year.values[item.key]), 1e-9);
  const componentTotal = series.reduce((sum, item) => sum + year.values[item.key], 0);
  return (
    <div className="pec132__bars" role="list" aria-label={`${year.year}년 에너지원별 상세`}>
      {series
        .map((item) => ({ ...item, value: year.values[item.key] }))
        .sort((left, right) => right.value - left.value)
        .map((item) => (
          <div key={item.key} role="listitem" tabIndex={0}>
            <span>{item.label}</span>
            <div className="pec132__bar-track" aria-hidden="true">
              <i style={{ backgroundColor: item.color, width: `${(item.value / maximum) * 100}%` }} />
            </div>
            <strong>{formatEnergyV132(item.value)} {unit}</strong>
            <small>{componentTotal > 0 ? `${percentFormatterV132.format((item.value / componentTotal) * 100)}%` : "—"}</small>
          </div>
        ))}
    </div>
  );
}

