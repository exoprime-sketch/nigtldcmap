export type ChartMarkerShapeV127 =
  | "circle"
  | "square"
  | "diamond"
  | "triangle"
  | "cross";

export type ChartLinePatternV127 = "solid" | "dash" | "dot" | "long-dash";

export type ChartTooltipModeV127 = "nearest-point" | "shared-x";

export type ChartDomainV127 = [number, number];

export type TimeSeriesPointV127 = {
  /** Stable, public-safe key. It is never rendered. */
  id?: string;
  /** Numeric time position, normally a four-digit year. */
  x: number;
  /** Public period label. Defaults to the formatted x value. */
  xLabel?: string;
  value: number;
};

export type TimeSeriesV127 = {
  /** Stable key used only by React and component state. */
  id: string;
  /** Public series label shown in the legend and tooltip. */
  label: string;
  /** A chart accepts only series that use the same unit. */
  unit: string;
  points: TimeSeriesPointV127[];
  color?: string;
  marker?: ChartMarkerShapeV127;
  linePattern?: ChartLinePatternV127;
  defaultVisible?: boolean;
};

export type ChartTooltipItemV127 = {
  seriesId: string;
  label: string;
  value: number;
  formattedValue: string;
  unit: string;
  color: string;
  seriesIndex: number;
  marker: ChartMarkerShapeV127;
  delta?: number;
  formattedDelta?: string;
};

export type ChartTooltipStateV127 = {
  anchorX: number;
  anchorY: number;
  xValue: number;
  xLabel: string;
  items: ChartTooltipItemV127[];
  pinned: boolean;
};

export type ChartRangeChangeV127 = {
  domain: ChartDomainV127;
  fullDomain: ChartDomainV127;
  reason: "zoom-in" | "zoom-out" | "reset" | "pan" | "brush";
};

export type ChartZoomOptionsV127 = {
  enabled?: boolean;
  /** Smallest permitted visible x span. Defaults to one fifth of the range. */
  minimumSpan?: number;
  /** Fraction removed by a zoom-in action. Defaults to 0.35. */
  step?: number;
  /** Adds two accessible native range handles below the chart. */
  showRangeBrush?: boolean;
};

export type ChartControlLabelsV127 = {
  zoomOut?: string;
  zoomIn?: string;
  reset?: string;
  rangeStart?: string;
  rangeEnd?: string;
};

export type InteractiveTimeSeriesChartV127Props = {
  series: TimeSeriesV127[];
  title?: string;
  description?: string;
  ariaLabel?: string;
  xAxisTitle: string;
  yAxisTitle: string;
  unit: string;
  scaleDescription?: string;
  fixedYDomain?: ChartDomainV127;
  xDomain?: ChartDomainV127;
  tooltipMode?: ChartTooltipModeV127;
  /** Convenience alias for a grouped tooltip at the nearest year. */
  sharedYearTooltip?: boolean;
  zoom?: ChartZoomOptionsV127;
  controlLabels?: ChartControlLabelsV127;
  height?: number;
  minimumVisibleSeries?: number;
  deltaInterval?: number;
  showDelta?: boolean;
  formatX?: (x: number) => string;
  formatValue?: (value: number) => string;
  formatDelta?: (delta: number) => string;
  emptyMessage?: string;
  className?: string;
  testId?: string;
  onRangeChange?: (event: ChartRangeChangeV127) => void;
};
