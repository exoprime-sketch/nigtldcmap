/**
 * V164: a series that would flatten every other series.
 *
 * BGD D-006 draws seven tax series that stay between 0 and 0.3 (% of GDP) and
 * one more series with a single point, 3, in 2021. Scaling the axis to 0-4 for
 * that one point pressed the seven lines onto the zero line. Such a series
 * starts switched off - it stays in the legend, one click from the chart, and
 * in the table below - so the lines that carry the history can be read.
 */
export interface ScaleSeriesV164 {
  id: string;
  points: Array<{ value: number }>;
}

const OUTLIER_FACTOR_V164 = 5;
const MIN_OTHER_POINTS_V164 = 6;

/** Ids of single-point series whose value is at least 5x the largest value of the series that have a history. */
export function scaleOutlierSeriesIdsV164(series: ScaleSeriesV164[]): Set<string> {
  const lone = series.filter((item) => item.points.length === 1);
  const others = series.filter((item) => item.points.length >= 2);
  const otherPoints = others.flatMap((item) => item.points.map((point) => Math.abs(point.value))).filter((value) => Number.isFinite(value));
  if (lone.length === 0 || otherPoints.length < MIN_OTHER_POINTS_V164) return new Set();
  const largest = Math.max(...otherPoints);
  if (!(largest > 0)) return new Set();
  return new Set(lone.filter((item) => Math.abs(item.points[0].value) >= OUTLIER_FACTOR_V164 * largest).map((item) => item.id));
}

/**
 * V164-R3: ids of the series whose every value is 0, while another series of the
 * chart has a value above 0. BGD D-006 draws eight tax series of which seven are
 * 0 in every year (the source states those zeros), and VNM B-040 draws a
 * geothermal output of 0 TWh in 1980-2024: laid over the other lines they hide
 * each other on the zero line. They start switched off, marked "모든 연도 0" in the
 * legend; the zeros themselves stay in the table and the download. When every
 * series of the chart is 0, none is hidden.
 */
export function allZeroSeriesIdsV164(series: ScaleSeriesV164[]): Set<string> {
  const withPoints = series.filter((item) => item.points.length > 0);
  const isZero = (item: ScaleSeriesV164) => item.points.every((point) => Number.isFinite(point.value) && point.value === 0);
  const zero = withPoints.filter(isZero);
  if (zero.length === 0 || zero.length === withPoints.length) return new Set();
  return new Set(zero.map((item) => item.id));
}
