import { useId, useMemo, useState } from "react";
import type { KeyboardEvent, PointerEvent } from "react";
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

type EnergySeriesV132 = {
  indicatorId: string;
  key: string;
  label: string;
  color: string;
  pattern: "solid" | "diagonal" | "dots" | "cross" | "vertical" | "horizontal";
};

type EnergyYearV132 = {
  year: number;
  values: Record<string, number>;
  total: number | null;
};

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
      <section className="pec132__kpis" aria-label="최신 핵심현황" data-testid="a016-kpis">
        <article>
          <span>총 1차 에너지 공급량</span>
          <strong>
            {latest.total === null ? (
              "미공개"
            ) : (
              <PublicTermTextV134
                text={`${formatEnergyV132(latest.total)} ${unit}`}
              />
            )}
          </strong>
          <small>{latest.year}년</small>
        </article>
        <article>
          <span>가장 큰 에너지원</span>
          <strong>{largestSource.label}</strong>
          <small>
            <PublicTermTextV134
              text={`${formatEnergyV132(largestSource.value)} ${unit}`}
            />
          </small>
        </article>
        <article>
          <span>수력·기타 재생에너지</span>
          <strong>
            <PublicTermTextV134
              text={`${formatEnergyV132(renewableTotal)} ${unit}`}
            />
          </strong>
          <small>두 공개 계열의 합계 · {latest.year}년</small>
        </article>
        <article>
          <span>관측기간</span>
          <strong>{minimumYear}–{maximumYear}</strong>
          <small>{allYears.length}개 연도</small>
        </article>
      </section>

      <section className="pec132__panel" aria-labelledby="pec132-absolute-title" data-testid="a016-absolute-trend">
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

        <EnergyStackedAreaV132
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

      <section className="pec132__panel" aria-labelledby="pec132-share-title" data-testid="a016-share-trend">
        <header className="pec132__heading">
          <div>
            <span>구성 변화</span>
            <h3 id="pec132-share-title">연도별 에너지원 구성비</h3>
            <p>각 연도의 여섯 에너지원 합계를 100%로 계산한 구성비입니다.</p>
          </div>
        </header>
        <EnergyStackedAreaV132
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

      <section className="pec132__panel" aria-labelledby="pec132-selected-title" data-testid="a016-selected-year">
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

function EnergyStackedAreaV132({
  mode,
  onSelectYear,
  series,
  unit,
  visibleSeries,
  years,
}: {
  mode: "absolute" | "share";
  onSelectYear: (year: number) => void;
  series: EnergySeriesV132[];
  unit: string;
  visibleSeries: Set<string>;
  years: EnergyYearV132[];
}) {
  const patternPrefix = useId().replace(/:/g, "");
  const [activeYear, setActiveYear] = useState<number | null>(null);
  const [pinned, setPinned] = useState(false);
  const width = 960;
  const height = 370;
  const padding = { left: 68, right: 22, top: 18, bottom: 58 };
  const plotWidth = width - padding.left - padding.right;
  const plotHeight = height - padding.top - padding.bottom;
  const availableSeries = series.filter((item) => visibleSeries.has(item.key));
  const yearMinimum = years.length > 0 ? years[0].year : 0;
  const yearMaximum = years.length > 0 ? years[years.length - 1].year : 1;
  const yearSpan = Math.max(1, yearMaximum - yearMinimum);
  const completeYears = years.filter((item) =>
    series.every((candidate) => Number.isFinite(item.values[candidate.key]))
  );
  const stackMaximum = mode === "share"
    ? 100
    : Math.max(
        1e-9,
        ...completeYears.map((item) =>
          Math.max(
            availableSeries.reduce((sum, candidate) => sum + item.values[candidate.key], 0),
            item.total === null ? 0 : item.total
          )
        )
      );
  const x = (year: number) =>
    padding.left + ((year - yearMinimum) / yearSpan) * plotWidth;
  const y = (value: number) =>
    padding.top + ((stackMaximum - value) / stackMaximum) * plotHeight;
  const denominator = (item: EnergyYearV132) =>
    series.reduce((sum, candidate) => sum + item.values[candidate.key], 0);
  const valueFor = (item: EnergyYearV132, key: string) =>
    mode === "share"
      ? denominator(item) > 0
        ? (item.values[key] / denominator(item)) * 100
        : 0
      : item.values[key];
  const paths: Array<{ series: EnergySeriesV132; path: string }> = [];
  let lowerByYear = completeYears.map(() => 0);
  availableSeries.forEach((item) => {
    const upperByYear = completeYears.map(
      (year, index) => lowerByYear[index] + valueFor(year, item.key)
    );
    const upperPath = completeYears
      .map((year, index) => `${index === 0 ? "M" : "L"}${x(year.year)},${y(upperByYear[index])}`)
      .join(" ");
    const lowerPath = [...completeYears]
      .reverse()
      .map((year, reverseIndex) => {
        const index = completeYears.length - 1 - reverseIndex;
        return `L${x(year.year)},${y(lowerByYear[index])}`;
      })
      .join(" ");
    paths.push({ series: item, path: `${upperPath} ${lowerPath} Z` });
    lowerByYear = upperByYear;
  });
  const tickYears = adaptiveTicksV132(completeYears.map((item) => item.year), 7);
  const yTicks = mode === "share"
    ? [0, 25, 50, 75, 100]
    : [0, 0.25, 0.5, 0.75, 1].map((ratio) => stackMaximum * ratio);
  const active = completeYears.find((item) => item.year === activeYear) || null;
  const activeX = active ? x(active.year) : null;
  const totalLinePath = mode === "absolute"
    ? completeYears
        .filter((item): item is EnergyYearV132 & { total: number } => item.total !== null)
        .map((item, index) => `${index === 0 ? "M" : "L"}${x(item.year)},${y(item.total)}`)
        .join(" ")
    : "";

  const nearestYear = (clientX: number, element: SVGSVGElement) => {
    const bounds = element.getBoundingClientRect();
    const localX = ((clientX - bounds.left) / Math.max(1, bounds.width)) * width;
    const targetYear = yearMinimum + ((localX - padding.left) / plotWidth) * yearSpan;
    return completeYears.reduce((nearest, item) =>
      Math.abs(item.year - targetYear) < Math.abs(nearest.year - targetYear) ? item : nearest
    );
  };

  const moveByKeyboard = (event: KeyboardEvent<SVGSVGElement>) => {
    if (event.key === "Escape") {
      setPinned(false);
      setActiveYear(null);
      return;
    }
    if (!["ArrowLeft", "ArrowRight", "Home", "End", "Enter", " "].includes(event.key)) return;
    event.preventDefault();
    if (event.key === "Enter" || event.key === " ") {
      const nextYear = activeYear ?? completeYears[completeYears.length - 1]?.year;
      if (nextYear !== undefined) {
        setPinned(true);
        setActiveYear(nextYear);
        onSelectYear(nextYear);
      }
      return;
    }
    let nextIndex = activeYear === null
      ? completeYears.length - 1
      : completeYears.findIndex((item) => item.year === activeYear);
    if (event.key === "ArrowLeft") nextIndex -= 1;
    if (event.key === "ArrowRight") nextIndex += 1;
    if (event.key === "Home") nextIndex = 0;
    if (event.key === "End") nextIndex = completeYears.length - 1;
    nextIndex = Math.max(0, Math.min(completeYears.length - 1, nextIndex));
    setActiveYear(completeYears[nextIndex]?.year ?? null);
  };

  if (completeYears.length < 2) {
    return <div className="pec132-empty" role="status">비교 가능한 연도별 구성값이 없습니다.</div>;
  }

  return (
    <div
      className="pec132__chart"
      data-chart-kind={mode === "share" ? "100-percent-stacked-area" : "absolute-stacked-area"}
      data-year-count={completeYears.length}
    >
      <svg
        aria-label={`${yearMinimum}년부터 ${yearMaximum}년까지의 ${mode === "share" ? "에너지원 구성비" : "에너지원 절대량"} 변화`}
        onBlur={() => {
          if (!pinned) setActiveYear(null);
        }}
        onFocus={() => {
          if (activeYear === null) setActiveYear(yearMaximum);
        }}
        onKeyDown={moveByKeyboard}
        onPointerDown={(event: PointerEvent<SVGSVGElement>) => {
          const nearest = nearestYear(event.clientX, event.currentTarget);
          setActiveYear(nearest.year);
          setPinned(true);
          onSelectYear(nearest.year);
        }}
        onPointerLeave={() => {
          if (!pinned) setActiveYear(null);
        }}
        onPointerMove={(event: PointerEvent<SVGSVGElement>) => {
          if (pinned) return;
          setActiveYear(nearestYear(event.clientX, event.currentTarget).year);
        }}
        role="img"
        tabIndex={0}
        viewBox={`0 0 ${width} ${height}`}
      >
        <title>{mode === "share" ? "에너지원 구성비 변화" : "에너지원 절대량 변화"}</title>
        <desc>마우스나 터치로 연도를 선택하고, 키보드 좌우 화살표로 연도별 값을 확인할 수 있습니다.</desc>
        <defs>
          {series.map((item, index) => (
            <pattern height="8" id={`${patternPrefix}-${item.key}`} key={item.key} patternUnits="userSpaceOnUse" width="8">
              <rect fill={item.color} height="8" width="8" />
              {patternMarksV132(item.pattern, index)}
            </pattern>
          ))}
        </defs>
        <rect className="pec132__chart-frame" height={plotHeight} width={plotWidth} x={padding.left} y={padding.top} />
        {yTicks.map((tick) => (
          <g key={`y-${tick}`}>
            <line className="pec132__grid" x1={padding.left} x2={width - padding.right} y1={y(tick)} y2={y(tick)} />
            <text className="pec132__tick" textAnchor="end" x={padding.left - 10} y={y(tick) + 4}>
              {mode === "share" ? `${Math.round(tick)}%` : formatEnergyV132(tick)}
            </text>
          </g>
        ))}
        {tickYears.map((year) => (
          <text className="pec132__tick" key={year} textAnchor="middle" x={x(year)} y={height - padding.bottom + 25}>{year}</text>
        ))}
        <g>
          {paths.map((item) => (
            <path
              className="pec132__area"
              d={item.path}
              fill={`url(#${patternPrefix}-${item.series.key})`}
              key={item.series.key}
            />
          ))}
        </g>
        {totalLinePath ? (
          <path
            className="pec132__total-line"
            d={totalLinePath}
            data-testid="a016-total-line"
            fill="none"
          />
        ) : null}
        {active && activeX !== null ? (
          <line className="pec132__crosshair" x1={activeX} x2={activeX} y1={padding.top} y2={height - padding.bottom} />
        ) : null}
        <text className="pec132__axis-title" textAnchor="middle" x={padding.left + plotWidth / 2} y={height - 10}>연도</text>
        <text className="pec132__axis-title" textAnchor="middle" transform={`translate(17 ${padding.top + plotHeight / 2}) rotate(-90)`}>{mode === "share" ? "구성비(%)" : `1차 에너지 공급량(${unit})`}</text>
      </svg>
      {active ? (
        <div
          className={`pec132__tooltip${activeX !== null && activeX > width / 2 ? " is-left" : ""}`}
          data-testid="a016-chart-tooltip"
          role="tooltip"
          style={{ left: `${((activeX ?? padding.left) / width) * 100}%` }}
        >
          <strong>{active.year}년</strong>
          <dl>
            {availableSeries.map((item) => (
              <div key={item.key}>
                <dt><i aria-hidden="true" style={{ backgroundColor: item.color }} />{item.label}</dt>
                <dd>
                  {mode === "share"
                    ? `${percentFormatterV132.format(valueFor(active, item.key))}%`
                    : `${formatEnergyV132(active.values[item.key])} ${unit}`}
                </dd>
              </div>
            ))}
            {mode === "absolute" && active.total !== null ? (
              <div className="pec132__tooltip-total">
                <dt>공급 총계</dt>
                <dd>{formatEnergyV132(active.total)} {unit}</dd>
              </div>
            ) : null}
          </dl>
        </div>
      ) : null}
      <p className="pec132__sr-only" aria-live="polite">
        {active
          ? `${active.year}년, ${availableSeries
              .map((item) => `${item.label} ${mode === "share" ? `${percentFormatterV132.format(valueFor(active, item.key))}%` : `${formatEnergyV132(active.values[item.key])} ${unit}`}`)
              .join(", ")}`
          : ""}
      </p>
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

function adaptiveTicksV132(values: number[], maximum: number): number[] {
  if (values.length <= maximum) return values;
  const ticks = Array.from({ length: maximum }, (_, index) =>
    values[Math.round((index * (values.length - 1)) / (maximum - 1))]
  );
  return ticks.filter((value, index) => index === 0 || value !== ticks[index - 1]);
}

function patternMarksV132(pattern: EnergySeriesV132["pattern"], index: number) {
  const stroke = "rgba(255,255,255,0.55)";
  if (pattern === "diagonal") return <path d="M-2 8 L8 -2 M2 10 L10 2" stroke={stroke} strokeWidth="1" />;
  if (pattern === "dots") return <circle cx="4" cy="4" fill="rgba(255,255,255,0.65)" r="1.2" />;
  if (pattern === "cross") return <path d="M0 4 H8 M4 0 V8" stroke={stroke} strokeWidth="0.8" />;
  if (pattern === "vertical") return <path d="M2 0 V8 M6 0 V8" stroke={stroke} strokeWidth="0.8" />;
  if (pattern === "horizontal") return <path d="M0 2 H8 M0 6 H8" stroke={stroke} strokeWidth="0.8" />;
  return <rect fill={`rgba(255,255,255,${0.04 + index * 0.01})`} height="8" width="8" />;
}
