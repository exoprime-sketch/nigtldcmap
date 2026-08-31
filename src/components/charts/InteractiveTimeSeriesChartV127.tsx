import {
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import ChartTooltipV127 from "./ChartTooltipV127";
import type {
  ChartDomainV127,
  ChartLinePatternV127,
  ChartMarkerShapeV127,
  ChartRangeChangeV127,
  ChartTooltipItemV127,
  ChartTooltipStateV127,
  InteractiveTimeSeriesChartV127Props,
  TimeSeriesPointV127,
  TimeSeriesV127,
} from "../../types/chartInteractionV127";
import "./chart-interactions-v127.css";

const SERIES_COLORS_V127 = [
  "#0f6b4d",
  "#2868a9",
  "#b66126",
  "#7549a8",
  "#a13d55",
  "#2a7c86",
  "#7d6718",
  "#556b36",
];

const MARKERS_V127: ChartMarkerShapeV127[] = [
  "circle",
  "square",
  "diamond",
  "triangle",
  "cross",
];

const LINE_PATTERNS_V127: ChartLinePatternV127[] = [
  "solid",
  "dash",
  "dot",
  "long-dash",
];

type PlottedPointV127 = TimeSeriesPointV127 & {
  chartX: number;
  chartY: number;
};

type PlottedSeriesV127 = Omit<TimeSeriesV127, "points"> & {
  color: string;
  marker: ChartMarkerShapeV127;
  linePattern: ChartLinePatternV127;
  points: PlottedPointV127[];
  seriesIndex: number;
};

type DragStateV127 = {
  pointerId: number;
  startClientX: number;
  startDomain: ChartDomainV127;
  moved: boolean;
};

type TouchGestureStateV127 = {
  startClientX: number;
  startClientY: number;
  moved: boolean;
  pointerHandled: boolean;
  tapHandled: boolean;
};

const numberFormatterV127 = new Intl.NumberFormat("ko-KR", {
  maximumFractionDigits: 2,
});

const compactAxisFormatterV127 = new Intl.NumberFormat("ko-KR", {
  notation: "compact",
  maximumFractionDigits: 1,
});

function defaultFormatValueV127(value: number): string {
  return numberFormatterV127.format(value);
}

function defaultFormatDeltaV127(delta: number): string {
  const sign = delta > 0 ? "+" : "";
  return `${sign}${numberFormatterV127.format(delta)}`;
}

function defaultFormatXV127(value: number): string {
  return Number.isInteger(value) ? `${value}` : numberFormatterV127.format(value);
}

function estimatedTextWidthV127(value: string): number {
  return Array.from(value).reduce((width, character) => {
    if (/\d/.test(character)) return width + 7.1;
    if (/[.,+\-]/.test(character)) return width + 4.5;
    if (/\s/.test(character)) return width + 3.5;
    return width + 11;
  }, 0);
}

function formatAxisTickV127(
  value: number,
  formatValue: (candidate: number) => string,
  widthBudget: number
): string {
  const fullPrecisionLabel = formatValue(value);
  if (estimatedTextWidthV127(fullPrecisionLabel) <= widthBudget) {
    return fullPrecisionLabel;
  }
  return compactAxisFormatterV127.format(value);
}

function clampV127(value: number, minimum: number, maximum: number): number {
  return Math.min(maximum, Math.max(minimum, value));
}

function sameDomainV127(left: ChartDomainV127, right: ChartDomainV127): boolean {
  return Math.abs(left[0] - right[0]) < 1e-8 && Math.abs(left[1] - right[1]) < 1e-8;
}

function normalizeDomainV127(domain: ChartDomainV127): ChartDomainV127 {
  return domain[0] <= domain[1] ? domain : [domain[1], domain[0]];
}

function lineDashV127(pattern: ChartLinePatternV127): string | undefined {
  if (pattern === "dash") return "8 5";
  if (pattern === "dot") return "2 5";
  if (pattern === "long-dash") return "14 6";
  return undefined;
}

function buildLinearPathV127(points: PlottedPointV127[]): string {
  return points
    .map((point, index) => `${index === 0 ? "M" : "L"}${point.chartX},${point.chartY}`)
    .join(" ");
}

function adaptiveTicksV127(values: number[], maximum: number): number[] {
  if (values.length <= maximum) return values;
  const result = Array.from({ length: maximum }, (_, index) => {
    const valueIndex = Math.round((index * (values.length - 1)) / (maximum - 1));
    return values[valueIndex];
  });
  return result.filter((value, index) => index === 0 || value !== result[index - 1]);
}

function markerPathV127(
  marker: ChartMarkerShapeV127,
  x: number,
  y: number,
  size: number
) {
  if (marker === "square") {
    return <rect x={x - size} y={y - size} width={size * 2} height={size * 2} rx="1" />;
  }
  if (marker === "diamond") {
    return (
      <path d={`M${x},${y - size - 1} L${x + size + 1},${y} L${x},${y + size + 1} L${x - size - 1},${y} Z`} />
    );
  }
  if (marker === "triangle") {
    return (
      <path d={`M${x},${y - size - 1} L${x + size + 1},${y + size} L${x - size - 1},${y + size} Z`} />
    );
  }
  if (marker === "cross") {
    return (
      <path
        d={`M${x - size},${y - size} L${x + size},${y + size} M${x + size},${y - size} L${x - size},${y + size}`}
        fill="none"
      />
    );
  }
  return <circle cx={x} cy={y} r={size} />;
}

function usableSeriesV127(series: TimeSeriesV127[]): TimeSeriesV127[] {
  return series.map((item) => ({
    ...item,
    points: item.points
      .filter((point) => Number.isFinite(point.x) && Number.isFinite(point.value))
      .sort((left, right) => left.x - right.x),
  }));
}

export function InteractiveTimeSeriesChartV127({
  series,
  title,
  description,
  ariaLabel,
  xAxisTitle,
  yAxisTitle,
  unit,
  scaleDescription,
  fixedYDomain,
  xDomain,
  tooltipMode: requestedTooltipMode = "shared-x",
  sharedYearTooltip,
  zoom,
  controlLabels,
  height = 360,
  minimumVisibleSeries = 1,
  deltaInterval = 1,
  showDelta = true,
  formatX = defaultFormatXV127,
  formatValue = defaultFormatValueV127,
  formatDelta = defaultFormatDeltaV127,
  emptyMessage = "표시할 시계열 관측값이 없습니다.",
  className = "",
  testId = "interactive-time-series-chart",
  onRangeChange,
}: InteractiveTimeSeriesChartV127Props) {
  const rootRef = useRef<HTMLElement | null>(null);
  const stageRef = useRef<HTMLDivElement | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);
  const dragRef = useRef<DragStateV127 | null>(null);
  const touchGestureRef = useRef<TouchGestureStateV127 | null>(null);
  const clipId = `v127-chart-clip-${useId().replace(/:/g, "")}`;
  const [chartWidth, setChartWidth] = useState(760);
  const [measuredYTickWidth, setMeasuredYTickWidth] = useState(0);
  const tooltipMode =
    sharedYearTooltip === undefined
      ? requestedTooltipMode
      : sharedYearTooltip
      ? "shared-x"
      : "nearest-point";
  const [isPanning, setIsPanning] = useState(false);
  const normalizedSeries = useMemo(() => usableSeriesV127(series), [series]);
  const unitMismatch = normalizedSeries.some(
    (item) => item.points.length > 0 && item.unit.trim() !== unit.trim()
  );
  const seriesIds = useMemo(
    () => normalizedSeries.filter((item) => item.points.length > 0).map((item) => item.id),
    [normalizedSeries]
  );
  const [visibleSeriesIds, setVisibleSeriesIds] = useState<Set<string>>(() => {
    const defaults = normalizedSeries
      .filter((item) => item.points.length > 0 && item.defaultVisible !== false)
      .map((item) => item.id);
    const fallback = normalizedSeries.find((item) => item.points.length > 0)?.id;
    return new Set(defaults.length > 0 ? defaults : fallback ? [fallback] : []);
  });
  const knownSeriesIdsRef = useRef<Set<string>>(new Set(seriesIds));
  const [tooltip, setTooltip] = useState<ChartTooltipStateV127 | null>(null);

  useEffect(() => {
    const clearTransientTooltip = (event: FocusEvent) => {
      const target = event.target;
      const focusedOwnPoint =
        target instanceof Element &&
        rootRef.current?.contains(target) &&
        target.matches('[data-chart-point="true"]');
      if (!focusedOwnPoint) {
        setTooltip((current) => (current?.pinned ? current : null));
      }
    };
    const clearPinnedTooltipOutside = (event: PointerEvent) => {
      const target = event.target;
      if (
        target instanceof Node &&
        rootRef.current &&
        !rootRef.current.contains(target)
      ) {
        setTooltip(null);
      }
    };
    document.addEventListener("focusin", clearTransientTooltip, true);
    document.addEventListener("pointerdown", clearPinnedTooltipOutside, true);
    return () => {
      document.removeEventListener("focusin", clearTransientTooltip, true);
      document.removeEventListener("pointerdown", clearPinnedTooltipOutside, true);
    };
  }, []);

  useLayoutEffect(() => {
    const target = stageRef.current;
    if (!target) return;
    const updateWidth = () => {
      const nextWidth = Math.max(300, Math.floor(target.getBoundingClientRect().width));
      setChartWidth(nextWidth);
    };
    updateWidth();
    if (typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(updateWidth);
    observer.observe(target);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const previousKnown = knownSeriesIdsRef.current;
    knownSeriesIdsRef.current = new Set(seriesIds);
    setVisibleSeriesIds((current) => {
      const available = new Set(seriesIds);
      const next = new Set(Array.from(current).filter((id) => available.has(id)));
      normalizedSeries.forEach((item) => {
        if (
          item.points.length > 0 &&
          item.defaultVisible !== false &&
          !previousKnown.has(item.id)
        ) {
          next.add(item.id);
        }
      });
      if (next.size === 0 && seriesIds[0]) next.add(seriesIds[0]);
      return next;
    });
  }, [normalizedSeries, seriesIds]);

  const allXValues = useMemo(
    () =>
      Array.from(
        new Set(normalizedSeries.flatMap((item) => item.points.map((point) => point.x)))
      ).sort((left, right) => left - right),
    [normalizedSeries]
  );
  const calculatedFullDomain = useMemo<ChartDomainV127>(() => {
    if (xDomain) return normalizeDomainV127(xDomain);
    if (allXValues.length === 0) return [0, 1];
    return [allXValues[0], allXValues[allXValues.length - 1]];
  }, [allXValues, xDomain]);
  const [visibleXDomain, setVisibleXDomain] = useState<ChartDomainV127>(calculatedFullDomain);

  useEffect(() => {
    setVisibleXDomain(calculatedFullDomain);
    setTooltip(null);
  }, [calculatedFullDomain]);

  const zoomEnabled = zoom?.enabled !== false && calculatedFullDomain[1] > calculatedFullDomain[0];
  const fullSpan = Math.max(0, calculatedFullDomain[1] - calculatedFullDomain[0]);
  const minimumZoomSpan = Math.min(
    fullSpan,
    Math.max(1e-8, zoom?.minimumSpan ?? Math.max(1, fullSpan / 5))
  );
  const zoomStep = clampV127(zoom?.step ?? 0.35, 0.1, 0.8);
  const currentSpan = Math.max(1e-8, visibleXDomain[1] - visibleXDomain[0]);
  const isFullRange = sameDomainV127(visibleXDomain, calculatedFullDomain);

  const safeHeight = Math.max(300, height);
  const visibleSeries = normalizedSeries.filter((item) => visibleSeriesIds.has(item.id));
  const visibleValues = visibleSeries.flatMap((item) =>
    item.points
      .filter((point) => point.x >= visibleXDomain[0] && point.x <= visibleXDomain[1])
      .map((point) => point.value)
  );
  const fallbackValues = visibleSeries.flatMap((item) => item.points.map((point) => point.value));
  const ySource = visibleValues.length > 0 ? visibleValues : fallbackValues;
  const calculatedYDomain = useMemo<ChartDomainV127>(() => {
    if (fixedYDomain) return normalizeDomainV127(fixedYDomain);
    if (ySource.length === 0) return [0, 1];
    const minimum = Math.min(...ySource);
    const maximum = Math.max(...ySource);
    if (minimum === maximum) {
      const amount = Math.max(1, Math.abs(minimum) * 0.08);
      return [minimum >= 0 ? Math.max(0, minimum - amount) : minimum - amount, maximum + amount];
    }
    const amount = (maximum - minimum) * 0.08;
    return [minimum >= 0 ? Math.max(0, minimum - amount) : minimum - amount, maximum + amount];
  }, [fixedYDomain, ySource]);
  const ySpan = Math.max(1e-8, calculatedYDomain[1] - calculatedYDomain[0]);
  const yTickCount = chartWidth < 480 ? 5 : 6;
  const yTicks = Array.from({ length: yTickCount }, (_, index) =>
    calculatedYDomain[1] - (index / (yTickCount - 1)) * ySpan
  );
  const yTickWidthBudget = chartWidth < 480 ? 76 : 112;
  const yTickLabels = yTicks.map((value) =>
    formatAxisTickV127(value, formatValue, yTickWidthBudget)
  );
  const yTickLabelsKey = yTickLabels.join("|");
  const estimatedYTickWidth = Math.max(
    0,
    ...yTickLabels.map(estimatedTextWidthV127)
  );
  const desiredLeftPadding =
    42 + Math.max(estimatedYTickWidth, measuredYTickWidth);
  const maximumLeftPadding = Math.max(
    82,
    Math.min(chartWidth < 480 ? 142 : 198, chartWidth * 0.42)
  );
  const padding = {
    left: Math.round(
      clampV127(desiredLeftPadding, chartWidth < 480 ? 68 : 78, maximumLeftPadding)
    ),
    right: chartWidth < 480 ? 16 : 28,
    top: 22,
    bottom: 68,
  };
  const plotWidth = Math.max(1, chartWidth - padding.left - padding.right);
  const plotHeight = Math.max(1, safeHeight - padding.top - padding.bottom);
  const xScale = (value: number) =>
    padding.left + ((value - visibleXDomain[0]) / currentSpan) * plotWidth;
  const yScale = (value: number) =>
    padding.top + ((calculatedYDomain[1] - value) / ySpan) * plotHeight;

  useLayoutEffect(() => {
    const tickNodes = rootRef.current?.querySelectorAll<SVGTextElement>(
      '[data-chart-y-axis-tick="true"]'
    );
    if (!tickNodes || tickNodes.length === 0) return;
    const nextWidth = Math.max(
      ...Array.from(tickNodes).map((node) => {
        try {
          return node.getComputedTextLength();
        } catch {
          return estimatedTextWidthV127(node.textContent || "");
        }
      })
    );
    if (Number.isFinite(nextWidth)) {
      setMeasuredYTickWidth((current) =>
        Math.abs(current - nextWidth) > 0.5 ? nextWidth : current
      );
    }
  }, [chartWidth, yTickLabelsKey]);

  const plottedSeries: PlottedSeriesV127[] = normalizedSeries
    .map((item, seriesIndex) => ({
      ...item,
      seriesIndex,
      color: item.color || SERIES_COLORS_V127[seriesIndex % SERIES_COLORS_V127.length],
      marker: item.marker || MARKERS_V127[seriesIndex % MARKERS_V127.length],
      linePattern:
        item.linePattern || LINE_PATTERNS_V127[seriesIndex % LINE_PATTERNS_V127.length],
      points: item.points
        .filter((point) => point.x >= visibleXDomain[0] && point.x <= visibleXDomain[1])
        .map((point) => ({
          ...point,
          chartX: xScale(point.x),
          chartY: yScale(point.value),
        })),
    }))
    .filter((item) => visibleSeriesIds.has(item.id));

  const visibleXValues = allXValues.filter(
    (value) => value >= visibleXDomain[0] && value <= visibleXDomain[1]
  );
  const xTicks = adaptiveTicksV127(visibleXValues, chartWidth < 480 ? 4 : chartWidth < 760 ? 6 : 8);

  const updateDomainV127 = (
    candidate: ChartDomainV127,
    reason: ChartRangeChangeV127["reason"]
  ) => {
    const requestedSpan = Math.min(fullSpan, Math.max(minimumZoomSpan, candidate[1] - candidate[0]));
    let start = candidate[0];
    let end = start + requestedSpan;
    if (start < calculatedFullDomain[0]) {
      start = calculatedFullDomain[0];
      end = start + requestedSpan;
    }
    if (end > calculatedFullDomain[1]) {
      end = calculatedFullDomain[1];
      start = end - requestedSpan;
    }
    const next: ChartDomainV127 = [start, end];
    setVisibleXDomain(next);
    setTooltip(null);
    onRangeChange?.({ domain: next, fullDomain: calculatedFullDomain, reason });
  };

  const zoomAroundV127 = (direction: "in" | "out") => {
    if (!zoomEnabled) return;
    const anchor = tooltip?.xValue ?? (visibleXDomain[0] + visibleXDomain[1]) / 2;
    const targetSpan =
      direction === "in"
        ? Math.max(minimumZoomSpan, currentSpan * (1 - zoomStep))
        : Math.min(fullSpan, currentSpan / (1 - zoomStep));
    const anchorRatio = (anchor - visibleXDomain[0]) / currentSpan;
    const nextStart = anchor - targetSpan * anchorRatio;
    updateDomainV127(
      [nextStart, nextStart + targetSpan],
      direction === "in" ? "zoom-in" : "zoom-out"
    );
  };

  const resetRangeV127 = () => {
    setVisibleXDomain(calculatedFullDomain);
    setTooltip(null);
    onRangeChange?.({
      domain: calculatedFullDomain,
      fullDomain: calculatedFullDomain,
      reason: "reset",
    });
  };

  const buildTooltipStateV127 = (
    xValue: number,
    anchorY: number,
    pinned: boolean,
    preferredSeriesId?: string
  ): ChartTooltipStateV127 | null => {
    const candidates = plottedSeries
      .map((item) => {
        const point = item.points.find((candidate) => Math.abs(candidate.x - xValue) < 1e-8);
        if (!point) return null;
        const sourceSeries = normalizedSeries.find((candidate) => candidate.id === item.id);
        const previous = sourceSeries?.points.find(
          (candidate) => Math.abs(candidate.x - (point.x - deltaInterval)) < 1e-8
        );
        const delta = previous && showDelta ? point.value - previous.value : undefined;
        const tooltipItem: ChartTooltipItemV127 = {
          seriesId: item.id,
          label: item.label,
          value: point.value,
          formattedValue: formatValue(point.value),
          unit: item.unit,
          color: item.color,
          seriesIndex: item.seriesIndex,
          marker: item.marker,
          delta,
          formattedDelta: delta === undefined ? undefined : formatDelta(delta),
        };
        return { item: tooltipItem, point };
      })
      .filter(
        (candidate): candidate is { item: ChartTooltipItemV127; point: PlottedPointV127 } =>
          candidate !== null
      );
    if (candidates.length === 0) return null;
    let selected = candidates;
    if (tooltipMode === "nearest-point") {
      const preferred = candidates.find((candidate) => candidate.item.seriesId === preferredSeriesId);
      const nearest =
        preferred ||
        candidates.reduce((best, candidate) =>
          Math.abs(candidate.point.chartY - anchorY) < Math.abs(best.point.chartY - anchorY)
            ? candidate
            : best
        );
      selected = [nearest];
    }
    const sourcePoint = selected[0].point;
    return {
      anchorX: sourcePoint.chartX,
      anchorY:
        tooltipMode === "shared-x"
          ? selected.reduce((sum, candidate) => sum + candidate.point.chartY, 0) / selected.length
          : selected[0].point.chartY,
      xValue,
      xLabel: sourcePoint.xLabel || formatX(xValue),
      items: selected.map((candidate) => candidate.item),
      pinned,
    };
  };

  const showNearestV127 = (
    localX: number,
    localY: number,
    pinned: boolean,
    clearPinnedOnEmpty = false
  ) => {
    if (visibleXValues.length === 0) return;
    if (clearPinnedOnEmpty && tooltip?.pinned) {
      const nearestPointDistance = Math.min(
        ...plottedSeries.flatMap((item) =>
          item.points.map((point) =>
            Math.hypot(point.chartX - localX, point.chartY - localY)
          )
        )
      );
      if (!Number.isFinite(nearestPointDistance) || nearestPointDistance > 32) {
        setTooltip(null);
        return;
      }
    }
    const targetValue =
      visibleXDomain[0] + ((localX - padding.left) / plotWidth) * currentSpan;
    const nearestX = visibleXValues.reduce((best, value) =>
      Math.abs(value - targetValue) < Math.abs(best - targetValue) ? value : best
    );
    if (pinned && tooltip?.pinned && Math.abs(tooltip.xValue - nearestX) < 1e-8) {
      setTooltip(null);
      return;
    }
    setTooltip(buildTooltipStateV127(nearestX, localY, pinned));
  };

  const localPointerV127 = (clientX: number, clientY: number) => {
    const svg = svgRef.current;
    if (!svg) return { x: 0, y: 0 };
    const bounds = svg.getBoundingClientRect();
    return {
      x: ((clientX - bounds.left) / Math.max(1, bounds.width)) * chartWidth,
      y: ((clientY - bounds.top) / Math.max(1, bounds.height)) * safeHeight,
    };
  };

  const toggleSeriesV127 = (seriesId: string) => {
    setVisibleSeriesIds((current) => {
      const next = new Set(current);
      if (next.has(seriesId)) {
        if (next.size <= Math.max(1, minimumVisibleSeries)) return current;
        next.delete(seriesId);
      } else {
        next.add(seriesId);
      }
      return next;
    });
    setTooltip(null);
  };

  const clearTransientTooltipV127 = () => {
    setTooltip(null);
  };

  const focusPointV127 = (item: PlottedSeriesV127, point: PlottedPointV127) => {
    setTooltip(buildTooltipStateV127(point.x, point.chartY, false, item.id));
  };

  const moveTooltipByKeyboardV127 = (direction: number) => {
    if (visibleXValues.length === 0) return;
    const currentIndex = tooltip
      ? visibleXValues.findIndex((value) => Math.abs(value - tooltip.xValue) < 1e-8)
      : direction > 0
      ? -1
      : visibleXValues.length;
    const nextIndex = clampV127(currentIndex + direction, 0, visibleXValues.length - 1);
    const nextX = visibleXValues[nextIndex];
    setTooltip(buildTooltipStateV127(nextX, padding.top + plotHeight / 2, true));
  };

  const rootClassName = [
    "v127-interactive-chart",
    isPanning ? "is-panning" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");
  const chartSummary =
    ariaLabel ||
    `${title ? `${title}. ` : ""}${xAxisTitle}에 따른 ${yAxisTitle}, 단위 ${unit}. ${visibleSeries.length}개 계열.`;
  const activeTooltipSummary = tooltip
    ? `${tooltip.xLabel}. ${tooltip.items
        .map((item) => `${item.label} ${item.formattedValue}${item.unit ? ` ${item.unit}` : ""}`)
        .join(", ")}`
    : "";
  const yAxisHasExplicitUnit =
    yAxisTitle.trim() === unit.trim() ||
    yAxisTitle.includes(`(${unit})`) ||
    yAxisTitle.includes(`[${unit}]`);
  const yAxisDisplayLabel =
    unit && !yAxisHasExplicitUnit ? `${yAxisTitle}(${unit})` : yAxisTitle;

  if (unitMismatch) {
    return (
      <div className={`${rootClassName} v127-interactive-chart--invalid-unit`} role="alert">
        단위가 다른 계열은 같은 Y축에 표시할 수 없습니다.
      </div>
    );
  }

  if (seriesIds.length === 0 || allXValues.length === 0) {
    return (
      <div className={`${rootClassName} v127-interactive-chart--empty`} data-chart-blank-state="reason">
        {emptyMessage}
      </div>
    );
  }

  return (
    <section
      className={rootClassName}
      ref={rootRef}
      data-chart-interaction-v127="true"
      data-chart-custom-tooltip="true"
      data-chart-horizontal-pan={zoomEnabled ? "true" : "false"}
      data-chart-keyboard-tooltip="true"
      data-chart-mobile-tap="true"
      data-chart-shared-year-tooltip={tooltipMode === "shared-x" ? "true" : "false"}
      data-chart-touch-events="pointer-primary-touch-fallback"
      data-chart-touch-pan-pins-tooltip="false"
      data-chart-touch-state-preserved="true"
      data-chart-unit-axis="single"
      data-chart-x-zoom={zoomEnabled ? "true" : "false"}
      data-axis-unit={unit}
      data-visible-x-min={visibleXDomain[0]}
      data-visible-x-max={visibleXDomain[1]}
      data-chart-y-domain={`${calculatedYDomain[0]},${calculatedYDomain[1]}`}
      data-y-domain-min={calculatedYDomain[0]}
      data-y-domain-max={calculatedYDomain[1]}
      data-chart-y-zoom="false"
      data-y-zoom="false"
      data-y-axis-padding-left={padding.left}
      data-y-axis-layout="dynamic"
      data-y-tick-maximum-width={Math.round(
        Math.max(estimatedYTickWidth, measuredYTickWidth)
      )}
      data-testid={testId}
      onFocusCapture={(event) => {
        const target = event.target;
        if (
          !(target instanceof Element) ||
          !target.matches('[data-chart-point="true"]')
        ) {
          setTooltip((current) => (current?.pinned ? current : null));
        }
      }}
      onKeyDown={(event) => {
        if (event.key === "Escape") {
          setTooltip(null);
          return;
        }
        if (event.target === svgRef.current) {
          if (event.key === "ArrowLeft") {
            event.preventDefault();
            moveTooltipByKeyboardV127(-1);
          } else if (event.key === "ArrowRight") {
            event.preventDefault();
            moveTooltipByKeyboardV127(1);
          } else if (event.key === "Home") {
            event.preventDefault();
            const firstX = visibleXValues[0];
            setTooltip(buildTooltipStateV127(firstX, padding.top + plotHeight / 2, true));
          } else if (event.key === "End") {
            event.preventDefault();
            const lastX = visibleXValues[visibleXValues.length - 1];
            setTooltip(buildTooltipStateV127(lastX, padding.top + plotHeight / 2, true));
          }
        }
      }}
    >
      <header className="v127-interactive-chart__header">
        {title ? <h4>{title}</h4> : null}
        {description ? <p>{description}</p> : null}
        <div className="v127-interactive-chart__metadata">
          <span data-testid="chart-unit-label">단위: {unit}</span>
          {scaleDescription ? <span>척도: {scaleDescription}</span> : null}
        </div>
      </header>

      <div className="v127-interactive-chart__toolbar">
        <div className="v127-interactive-chart__legend" aria-label="계열 선택">
          {normalizedSeries
            .filter((item) => item.points.length > 0)
            .map((item, seriesIndex) => {
              const active = visibleSeriesIds.has(item.id);
              const marker = item.marker || MARKERS_V127[seriesIndex % MARKERS_V127.length];
              const linePattern =
                item.linePattern || LINE_PATTERNS_V127[seriesIndex % LINE_PATTERNS_V127.length];
              const color = item.color || SERIES_COLORS_V127[seriesIndex % SERIES_COLORS_V127.length];
              return (
                <button
                  aria-label={`${item.label} 계열 ${active ? "숨기기" : "표시"}`}
                  aria-pressed={active}
                  className="v127-chart-legend-button"
                  data-chart-legend-toggle="true"
                  data-line-pattern={linePattern}
                  disabled={active && visibleSeriesIds.size <= Math.max(1, minimumVisibleSeries)}
                  key={item.id}
                  onClick={() => toggleSeriesV127(item.id)}
                  onFocus={clearTransientTooltipV127}
                  type="button"
                >
                  <i
                    aria-hidden="true"
                    className={`v127-chart-legend-button__sample v127-chart-legend-button__sample--${marker}`}
                    style={{ color }}
                  />
                  <span>{item.label}</span>
                </button>
              );
            })}
        </div>

        {zoomEnabled ? (
          <div className="v127-interactive-chart__zoom" aria-label="기간 확대 축소">
            <button
              aria-label={controlLabels?.zoomOut || "기간 축소"}
              data-chart-zoom-out="true"
              data-testid="chart-zoom-out"
              disabled={isFullRange}
              onClick={() => zoomAroundV127("out")}
              onFocus={clearTransientTooltipV127}
              type="button"
            >
              {controlLabels?.zoomOut || "축소"}
            </button>
            <button
              aria-label={controlLabels?.zoomIn || "기간 확대"}
              data-chart-zoom-in="true"
              data-testid="chart-zoom-in"
              disabled={currentSpan <= minimumZoomSpan + 1e-8}
              onClick={() => zoomAroundV127("in")}
              onFocus={clearTransientTooltipV127}
              type="button"
            >
              {controlLabels?.zoomIn || "확대"}
            </button>
            <button
              aria-label={controlLabels?.reset || "전체 기간 복원"}
              data-chart-reset="true"
              data-chart-zoom-reset="true"
              data-testid="chart-reset"
              disabled={isFullRange}
              onClick={resetRangeV127}
              onFocus={clearTransientTooltipV127}
              type="button"
            >
              {controlLabels?.reset || "전체기간"}
            </button>
          </div>
        ) : null}
      </div>

      <div className="v127-interactive-chart__stage" ref={stageRef}>
        <svg
          aria-label={chartSummary}
          className="v127-interactive-chart__svg"
          data-chart-hover-overlay="cross-series"
          data-chart-responsive="true"
          onPointerCancel={(event) => {
            if (event.pointerType === "touch" && touchGestureRef.current) {
              touchGestureRef.current.pointerHandled = false;
            }
            dragRef.current = null;
            setIsPanning(false);
          }}
          ref={svgRef}
          role="group"
          tabIndex={0}
          viewBox={`0 0 ${chartWidth} ${safeHeight}`}
        >
          <title>{chartSummary}</title>
          <desc>
            범례에서 계열을 선택하고, 차트에 마우스를 올리거나 키보드 화살표로 연도별 값을 확인할 수 있습니다.
          </desc>
          <defs>
            <clipPath id={clipId}>
              <rect height={plotHeight} width={plotWidth} x={padding.left} y={padding.top} />
            </clipPath>
          </defs>

          <rect
            className="v127-interactive-chart__frame"
            height={plotHeight}
            width={plotWidth}
            x={padding.left}
            y={padding.top}
          />

          {yTicks.map((value, index) => {
            const chartY = yScale(value);
            return (
              <g key={`y-${index}`}>
                <line
                  className="v127-interactive-chart__grid"
                  x1={padding.left}
                  x2={chartWidth - padding.right}
                  y1={chartY}
                  y2={chartY}
                />
                <text
                  aria-label={formatValue(value)}
                  className="v127-interactive-chart__tick"
                  data-chart-y-axis-tick="true"
                  textAnchor="end"
                  x={padding.left - 10}
                  y={chartY + 4}
                >
                  {yTickLabels[index]}
                </text>
              </g>
            );
          })}

          {xTicks.map((value) => {
            const chartX = xScale(value);
            return (
              <g key={`x-${value}`}>
                <line
                  className="v127-interactive-chart__grid v127-interactive-chart__grid--vertical"
                  x1={chartX}
                  x2={chartX}
                  y1={padding.top}
                  y2={safeHeight - padding.bottom}
                />
                <text
                  className="v127-interactive-chart__tick"
                  textAnchor="middle"
                  x={chartX}
                  y={safeHeight - padding.bottom + 24}
                >
                  {formatX(value)}
                </text>
              </g>
            );
          })}

          <text
            className="v127-interactive-chart__axis-title"
            data-axis="x"
            data-testid="chart-x-axis-title"
            textAnchor="middle"
            x={padding.left + plotWidth / 2}
            y={safeHeight - 12}
          >
            {xAxisTitle}
          </text>
          <text
            className="v127-interactive-chart__axis-title"
            data-axis="y"
            data-testid="chart-y-axis-title"
            textAnchor="middle"
            transform={`translate(18 ${padding.top + plotHeight / 2}) rotate(-90)`}
          >
            {yAxisDisplayLabel}
          </text>

          <g clipPath={`url(#${clipId})`}>
            {plottedSeries.map((item) => (
              <g
                className="v127-interactive-chart__series"
                data-line-pattern={item.linePattern}
                key={item.id}
                style={{ color: item.color }}
              >
                {item.points.length > 1 ? (
                  <path
                    className="v127-interactive-chart__line"
                    d={buildLinearPathV127(item.points)}
                    fill="none"
                    stroke="currentColor"
                    strokeDasharray={lineDashV127(item.linePattern)}
                  />
                ) : null}
                {item.points.map((point, pointIndex) => (
                  <g
                    aria-label={`${item.label}, ${point.xLabel || formatX(point.x)}, ${formatValue(
                      point.value
                    )}${item.unit ? ` ${item.unit}` : ""}`}
                    className="v127-interactive-chart__point-target"
                    data-chart-point="true"
                    data-series-unit={item.unit}
                    key={point.id || `${item.id}-${point.x}-${pointIndex}`}
                    onBlur={() => {
                      setTooltip((current) =>
                        current?.pinned ? current : null
                      );
                    }}
                    onFocus={() => focusPointV127(item, point)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        setTooltip(
                          buildTooltipStateV127(
                            point.x,
                            point.chartY,
                            true,
                            item.id
                          )
                        );
                      }
                    }}
                    role="button"
                    tabIndex={0}
                  >
                    <circle cx={point.chartX} cy={point.chartY} fill="transparent" r="18" />
                    <g
                      className={`v127-interactive-chart__marker v127-interactive-chart__marker--${item.marker}`}
                      fill={item.marker === "cross" ? "none" : "var(--cdp-panel, #fff)"}
                      stroke="currentColor"
                    >
                      {markerPathV127(item.marker, point.chartX, point.chartY, 4.5)}
                    </g>
                  </g>
                ))}
              </g>
            ))}

            {tooltip ? (
              <g className="v127-interactive-chart__active-guide" pointerEvents="none">
                <line
                  data-chart-crosshair="true"
                  data-chart-hover-guide="true"
                  data-testid="chart-crosshair"
                  x1={xScale(tooltip.xValue)}
                  x2={xScale(tooltip.xValue)}
                  y1={padding.top}
                  y2={safeHeight - padding.bottom}
                />
                {plottedSeries.flatMap((item) =>
                  item.points
                    .filter((point) => Math.abs(point.x - tooltip.xValue) < 1e-8)
                    .map((point) => (
                      <circle
                        className="v127-interactive-chart__active-point"
                        cx={point.chartX}
                        cy={point.chartY}
                        data-chart-hover-marker="true"
                        fill="var(--cdp-panel, #fff)"
                        key={`${item.id}-${point.x}`}
                        r="7"
                        stroke={item.color}
                      />
                    ))
                )}
              </g>
            ) : null}

            <rect
              aria-label="연도별 값 탐색 영역. 좌우 화살표 키로 이동합니다."
              className={`v127-interactive-chart__overlay${!isFullRange ? " is-zoomed" : ""}`}
              data-chart-hit="true"
              height={plotHeight}
              onPointerDown={(event) => {
                event.currentTarget.focus();
                dragRef.current = {
                  pointerId: event.pointerId,
                  startClientX: event.clientX,
                  startDomain: visibleXDomain,
                  moved: false,
                };
                if (event.pointerType === "touch") {
                  touchGestureRef.current = {
                    startClientX: event.clientX,
                    startClientY: event.clientY,
                    moved: false,
                    pointerHandled: false,
                    tapHandled: false,
                  };
                }
                event.currentTarget.setPointerCapture(event.pointerId);
              }}
              onPointerLeave={() => {
                if (!tooltip?.pinned && !dragRef.current) setTooltip(null);
              }}
              onPointerMove={(event) => {
                const local = localPointerV127(event.clientX, event.clientY);
                const drag = dragRef.current;
                if (drag && drag.pointerId === event.pointerId) {
                  const distance = event.clientX - drag.startClientX;
                  if (Math.abs(distance) > 3) {
                    drag.moved = true;
                    if (event.pointerType === "touch" && touchGestureRef.current) {
                      touchGestureRef.current.moved = true;
                    }
                    if (!isFullRange) {
                      setIsPanning(true);
                      const dragSpan = drag.startDomain[1] - drag.startDomain[0];
                      const shift = -(distance / Math.max(1, plotWidth)) * dragSpan;
                      updateDomainV127(
                        [drag.startDomain[0] + shift, drag.startDomain[1] + shift],
                        "pan"
                      );
                    }
                  }
                  if (drag.moved || event.pointerType === "touch") return;
                }
                if (!tooltip?.pinned && event.pointerType !== "touch") {
                  showNearestV127(local.x, local.y, false);
                }
              }}
              onPointerUp={(event) => {
                const drag = dragRef.current;
                const touchGesture =
                  event.pointerType === "touch" ? touchGestureRef.current : null;
                const local = localPointerV127(event.clientX, event.clientY);
                if (event.currentTarget.hasPointerCapture(event.pointerId)) {
                  event.currentTarget.releasePointerCapture(event.pointerId);
                }
                dragRef.current = null;
                setIsPanning(false);
                if (
                  drag &&
                  drag.pointerId === event.pointerId &&
                  !drag.moved &&
                  !touchGesture?.moved
                ) {
                  showNearestV127(local.x, local.y, true, true);
                  if (event.pointerType === "touch" && touchGestureRef.current) {
                    touchGestureRef.current.pointerHandled = true;
                    touchGestureRef.current.tapHandled = true;
                  }
                } else if (event.pointerType === "touch" && touchGestureRef.current) {
                  touchGestureRef.current.pointerHandled = true;
                  touchGestureRef.current.moved = true;
                }
              }}
              onTouchStart={(event) => {
                const touch = event.touches[0];
                if (!touch) return;
                const pointerState = touchGestureRef.current;
                touchGestureRef.current = {
                  startClientX: touch.clientX,
                  startClientY: touch.clientY,
                  moved: pointerState?.moved || false,
                  pointerHandled: pointerState?.pointerHandled || false,
                  tapHandled: pointerState?.tapHandled || false,
                };
              }}
              onTouchMove={(event) => {
                const touch = event.touches[0];
                const gesture = touchGestureRef.current;
                if (!touch || !gesture) return;
                if (
                  Math.hypot(
                    touch.clientX - gesture.startClientX,
                    touch.clientY - gesture.startClientY
                  ) > 6
                ) {
                  gesture.moved = true;
                }
              }}
              onTouchEnd={(event) => {
                const touch = event.changedTouches[0];
                const gesture = touchGestureRef.current;
                touchGestureRef.current = null;
                if (
                  !touch ||
                  gesture?.moved ||
                  gesture?.tapHandled ||
                  gesture?.pointerHandled
                ) {
                  return;
                }
                const local = localPointerV127(touch.clientX, touch.clientY);
                showNearestV127(local.x, local.y, true, true);
              }}
              role="presentation"
              tabIndex={-1}
              width={plotWidth}
              x={padding.left}
              y={padding.top}
            />
          </g>
        </svg>
        <ChartTooltipV127 state={tooltip} stageHeight={safeHeight} stageWidth={chartWidth} />
      </div>

      {zoom?.showRangeBrush && allXValues.length > 1 ? (
        <div className="v127-interactive-chart__brush" data-chart-range-brush="true">
          <label>
            <span>{controlLabels?.rangeStart || "시작 기간"}</span>
            <input
              aria-label={controlLabels?.rangeStart || "시작 기간"}
              max={allXValues.length - 2}
              min={0}
              onChange={(event) => {
                const startIndex = Number(event.target.value);
                const endIndex = Math.max(
                  startIndex + 1,
                  allXValues.findIndex((value) => value >= visibleXDomain[1])
                );
                updateDomainV127([allXValues[startIndex], allXValues[endIndex]], "brush");
              }}
              step={1}
              type="range"
              value={Math.max(
                0,
                allXValues.findIndex((value) => value >= visibleXDomain[0])
              )}
            />
          </label>
          <label>
            <span>{controlLabels?.rangeEnd || "끝 기간"}</span>
            <input
              aria-label={controlLabels?.rangeEnd || "끝 기간"}
              max={allXValues.length - 1}
              min={1}
              onChange={(event) => {
                const endIndex = Number(event.target.value);
                const startIndex = Math.min(
                  endIndex - 1,
                  Math.max(
                    0,
                    allXValues.findIndex((value) => value >= visibleXDomain[0])
                  )
                );
                updateDomainV127([allXValues[startIndex], allXValues[endIndex]], "brush");
              }}
              step={1}
              type="range"
              value={Math.max(
                1,
                allXValues.findIndex((value) => value >= visibleXDomain[1])
              )}
            />
          </label>
        </div>
      ) : null}

      <p aria-live="polite" className="v127-chart-sr-only">
        {activeTooltipSummary}
      </p>
    </section>
  );
}

export default InteractiveTimeSeriesChartV127;
