import { useId, useState } from "react";
import type { KeyboardEvent, PointerEvent } from "react";
import "../data/public/primary-energy-composition-v132.css";

/**
 * V153-D1: the stacked-area chart the A-016 screen drew (V132), shared so a
 * composition dataset - gases, sectors, technologies - opens on its absolute
 * stack with the share view a toggle away. Values are drawn as delivered:
 * only years where every series is populated are stacked, a delivered total
 * is a dotted line rather than a component, and nothing is imputed.
 */
export type StackedAreaSeriesV153 = {
  key: string;
  label: string;
  color: string;
  pattern: "solid" | "diagonal" | "dots" | "cross" | "vertical" | "horizontal";
};

export type StackedAreaYearV153 = {
  year: number;
  values: Record<string, number>;
  total: number | null;
};

export type StackedAreaLabelsV153 = { subject: string; quantity: string; total: string };

const DEFAULT_LABELS_V153: StackedAreaLabelsV153 = { subject: "계열", quantity: "값", total: "합계" };

const numberFormatterV153 = new Intl.NumberFormat("ko-KR", { maximumFractionDigits: 3 });
const percentFormatterV153 = new Intl.NumberFormat("ko-KR", { maximumFractionDigits: 1 });

function formatStackedV153(value: number): string {
  return numberFormatterV153.format(value);
}

export const STACKED_AREA_PATTERNS_V153: ReadonlyArray<StackedAreaSeriesV153["pattern"]> = ["diagonal", "dots", "cross", "vertical", "horizontal", "solid"];

export function StackedAreaChartV153({
  mode,
  onSelectYear,
  series,
  unit,
  visibleSeries,
  years,
  labels,
  totalLineTestId = "stacked-area-total-line-v153",
  tooltipTestId = "stacked-area-tooltip-v153",
}: {
  mode: "absolute" | "share";
  onSelectYear: (year: number) => void;
  series: StackedAreaSeriesV153[];
  unit: string;
  visibleSeries: Set<string>;
  years: StackedAreaYearV153[];
  /** Words for the subject ("에너지원"), the quantity ("1차 에너지 소비량") and the total line ("공급 총계"). */
  labels?: StackedAreaLabelsV153;
  totalLineTestId?: string;
  tooltipTestId?: string;
}) {
  const words = { ...DEFAULT_LABELS_V153, ...labels };
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
  const denominator = (item: StackedAreaYearV153) =>
    series.reduce((sum, candidate) => sum + item.values[candidate.key], 0);
  const valueFor = (item: StackedAreaYearV153, key: string) =>
    mode === "share"
      ? denominator(item) > 0
        ? (item.values[key] / denominator(item)) * 100
        : 0
      : item.values[key];
  const paths: Array<{ series: StackedAreaSeriesV153; path: string }> = [];
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
  const tickYears = adaptiveTicksV153(completeYears.map((item) => item.year), 7);
  const yTicks = mode === "share"
    ? [0, 25, 50, 75, 100]
    : [0, 0.25, 0.5, 0.75, 1].map((ratio) => stackMaximum * ratio);
  const active = completeYears.find((item) => item.year === activeYear) || null;
  const activeX = active ? x(active.year) : null;
  const totalLinePath = mode === "absolute"
    ? completeYears
        .filter((item): item is StackedAreaYearV153 & { total: number } => item.total !== null)
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
        aria-label={`${yearMinimum}년부터 ${yearMaximum}년까지의 ${words.subject} ${mode === "share" ? "구성비" : "절대량"} 변화`}
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
        <title>{`${words.subject} ${mode === "share" ? "구성비" : "절대량"} 변화`}</title>
        <desc>마우스나 터치로 연도를 선택하고, 키보드 좌우 화살표로 연도별 값을 확인할 수 있습니다.</desc>
        <defs>
          {series.map((item, index) => (
            <pattern height="8" id={`${patternPrefix}-${item.key}`} key={item.key} patternUnits="userSpaceOnUse" width="8">
              <rect fill={item.color} height="8" width="8" />
              {patternMarksV153(item.pattern, index)}
            </pattern>
          ))}
        </defs>
        <rect className="pec132__chart-frame" height={plotHeight} width={plotWidth} x={padding.left} y={padding.top} />
        {yTicks.map((tick) => (
          <g key={`y-${tick}`}>
            <line className="pec132__grid" x1={padding.left} x2={width - padding.right} y1={y(tick)} y2={y(tick)} />
            <text className="pec132__tick" textAnchor="end" x={padding.left - 10} y={y(tick) + 4}>
              {mode === "share" ? `${Math.round(tick)}%` : formatStackedV153(tick)}
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
            data-testid={totalLineTestId}
            fill="none"
          />
        ) : null}
        {active && activeX !== null ? (
          <line className="pec132__crosshair" x1={activeX} x2={activeX} y1={padding.top} y2={height - padding.bottom} />
        ) : null}
        <text className="pec132__axis-title" textAnchor="middle" x={padding.left + plotWidth / 2} y={height - 10}>연도</text>
        <text className="pec132__axis-title" textAnchor="middle" transform={`translate(17 ${padding.top + plotHeight / 2}) rotate(-90)`}>{mode === "share" ? "구성비(%)" : `${words.quantity}(${unit})`}</text>
      </svg>
      {active ? (
        <div
          className={`pec132__tooltip${activeX !== null && activeX > width / 2 ? " is-left" : ""}`}
          data-testid={tooltipTestId}
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
                    ? `${percentFormatterV153.format(valueFor(active, item.key))}%`
                    : `${formatStackedV153(active.values[item.key])} ${unit}`}
                </dd>
              </div>
            ))}
            {mode === "absolute" && active.total !== null ? (
              <div className="pec132__tooltip-total">
                <dt>{words.total}</dt>
                <dd>{formatStackedV153(active.total)} {unit}</dd>
              </div>
            ) : null}
          </dl>
        </div>
      ) : null}
      <p className="pec132__sr-only" aria-live="polite">
        {active
          ? `${active.year}년, ${availableSeries
              .map((item) => `${item.label} ${mode === "share" ? `${percentFormatterV153.format(valueFor(active, item.key))}%` : `${formatStackedV153(active.values[item.key])} ${unit}`}`)
              .join(", ")}`
          : ""}
      </p>
    </div>
  );
}

function adaptiveTicksV153(values: number[], maximum: number): number[] {
  if (values.length <= maximum) return values;
  const ticks = Array.from({ length: maximum }, (_, index) =>
    values[Math.round((index * (values.length - 1)) / (maximum - 1))]
  );
  return ticks.filter((value, index) => index === 0 || value !== ticks[index - 1]);
}

function patternMarksV153(pattern: StackedAreaSeriesV153["pattern"], index: number) {
  const stroke = "rgba(255,255,255,0.55)";
  if (pattern === "diagonal") return <path d="M-2 8 L8 -2 M2 10 L10 2" stroke={stroke} strokeWidth="1" />;
  if (pattern === "dots") return <circle cx="4" cy="4" fill="rgba(255,255,255,0.65)" r="1.2" />;
  if (pattern === "cross") return <path d="M0 4 H8 M4 0 V8" stroke={stroke} strokeWidth="0.8" />;
  if (pattern === "vertical") return <path d="M2 0 V8 M6 0 V8" stroke={stroke} strokeWidth="0.8" />;
  if (pattern === "horizontal") return <path d="M0 2 H8 M0 6 H8" stroke={stroke} strokeWidth="0.8" />;
  return <rect fill={`rgba(255,255,255,${0.04 + index * 0.01})`} height="8" width="8" />;
}
