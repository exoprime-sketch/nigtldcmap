/**
 * V164-R3: the geometry of a labelled scatter (E-012 employment x wage).
 *
 * The old drawing was a fixed 620 x 390 viewBox scaled to its box: on a phone every
 * label shrank to about 6px, the rotated y title overlapped the tick labels, the
 * x axis had a line and no ticks, and the name of a point at the right edge ran out
 * of the drawing while close points wrote their names on top of each other.
 *
 * Here the drawing is laid out for the width it really has: round ticks on both
 * axes (0, 5,000, 10,000 ...), a left margin as wide as the widest y tick label,
 * and each point's name placed by `placeScatterLabelsV164` so it stays inside the
 * plot and off the other names and points. Layout only - no plotted value changes.
 */

import { formatAxisTicksV164, niceTicksV164 } from "../../utils/axisTicksV164";
import { estimateLabelWidthV164, placeScatterLabelsV164 } from "./chartLabelLayoutV164";
import type { ScatterLabelPlacementV164 } from "./chartLabelLayoutV164";

export interface ScatterPointInputV164 {
  id: string;
  /** Value on the horizontal axis (>= 0). */
  x: number;
  /** Value on the vertical axis (>= 0). */
  y: number;
  label: string;
}

export interface ScatterPlacedPointV164 {
  id: string;
  cx: number;
  cy: number;
  label: ScatterLabelPlacementV164;
}

export interface ScatterLayoutV164 {
  width: number;
  height: number;
  margin: { top: number; right: number; bottom: number; left: number };
  plotWidth: number;
  plotHeight: number;
  xTicks: number[];
  yTicks: number[];
  xTickLabels: string[];
  yTickLabels: string[];
  xDomain: [number, number];
  yDomain: [number, number];
  /** In the order the points were given. */
  points: ScatterPlacedPointV164[];
}

export const SCATTER_TICK_FONT_V164 = 11;
export const SCATTER_LABEL_FONT_V164 = 11.5;
export const SCATTER_RADIUS_V164 = 6;
/** The narrowest drawing laid out (a 320px phone leaves a box about 224px wide inside the card). */
export const MIN_WIDTH_V164 = 200;

function ticksFor(maximum: number, count: number): number[] {
  return maximum > 0 ? niceTicksV164(0, maximum, count) : [0, 1];
}

export function scatterLayoutV164(points: ScatterPointInputV164[], measuredWidth: number): ScatterLayoutV164 {
  const width = Math.max(MIN_WIDTH_V164, Math.round(measuredWidth));
  const narrow = width < 440;
  const height = narrow ? 340 : 380;
  const maxX = Math.max(0, ...points.map((point) => point.x));
  const maxY = Math.max(0, ...points.map((point) => point.y));
  const yTicks = ticksFor(maxY, 4);
  const yTickLabels = formatAxisTicksV164(yTicks);
  const widestY = Math.max(0, ...yTickLabels.map((label) => estimateLabelWidthV164(label, SCATTER_TICK_FONT_V164)));
  const margin = {
    // Room for the widest y tick label, a gap and the axis; the y title sits above the plot, not beside it.
    left: Math.max(44, Math.ceil(widestY) + 18),
    right: narrow ? 12 : 20,
    top: 40,
    bottom: 58,
  };
  const plotWidth = width - margin.left - margin.right;
  const plotHeight = height - margin.top - margin.bottom;
  const xTicks = ticksFor(maxX, narrow ? 3 : 4);
  const xTickLabels = formatAxisTicksV164(xTicks);
  const xDomain: [number, number] = [xTicks[0], xTicks[xTicks.length - 1]];
  const yDomain: [number, number] = [yTicks[0], yTicks[yTicks.length - 1]];
  const xSpan = xDomain[1] - xDomain[0] || 1;
  const ySpan = yDomain[1] - yDomain[0] || 1;
  const positioned = points.map((point) => ({
    id: point.id,
    x: margin.left + ((point.x - xDomain[0]) / xSpan) * plotWidth,
    y: margin.top + (1 - (point.y - yDomain[0]) / ySpan) * plotHeight,
    text: point.label,
  }));
  const labels = placeScatterLabelsV164(positioned, {
    bounds: { left: margin.left + 2, right: width - 4, top: margin.top - 6, bottom: margin.top + plotHeight },
    fontSize: SCATTER_LABEL_FONT_V164,
    radius: SCATTER_RADIUS_V164 + 2,
  });
  return {
    width,
    height,
    margin,
    plotWidth,
    plotHeight,
    xTicks,
    yTicks,
    xTickLabels,
    yTickLabels,
    xDomain,
    yDomain,
    points: positioned.map((point, index) => ({ id: point.id, cx: point.x, cy: point.y, label: labels[index] })),
  };
}
