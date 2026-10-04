/**
 * V164: value-axis ticks a reader can read at a glance.
 *
 * An axis that says 495,200,301,543 / 396,160,241,234 makes the reader count
 * digits, and evenly split ticks of an arbitrary range never land on round
 * numbers. Ticks are placed on 1·2·2.5·5×10ⁿ steps and, past 억, written with
 * one shared Korean scale word (1,000억 · 2,000억), so every tick on an axis is
 * read the same way. Only the guides change: plotted values, tooltips, tables
 * and downloads keep the exact figures.
 */

const EOK = 100_000_000;
const JO = 1_000_000_000_000;

/**
 * A unit that counts things one by one (건·곳·명·개 …): 1.5건 is not a reading, so
 * the axis of such a series is guided at whole numbers only.
 */
export function isCountUnitV164(unit: string | null | undefined): boolean {
  return /^(건|건수|곳|명|개|개소|개사|개국|기|대|편|회|가구|호|종|사례)$/u.test(String(unit ?? "").trim());
}

/**
 * The 1·2·2.5·5×10ⁿ step at or above `raw`. With `integerOnly` the step is a
 * whole number (1, 2, 5, 10, 20, 25, 50 …): a count axis never counts in halves.
 */
export function niceStepV164(raw: number, integerOnly = false): number {
  if (!Number.isFinite(raw) || raw <= 0) return 1;
  if (integerOnly && raw <= 1) return 1;
  const magnitude = 10 ** Math.floor(Math.log10(raw));
  const fraction = raw / magnitude;
  const factors = [1, 2, 2.5, 5, 10];
  const wanted = factors.find((factor) => fraction <= factor && (!integerOnly || Number.isInteger(factor * magnitude))) ?? 10;
  return wanted * magnitude;
}

/**
 * The bound of an axis that is symmetric around zero and guided at -b, -b/2, 0,
 * b/2, b: b is twice a round step, so the guides read -2s, -s, 0, s, 2s with s
 * on the 1·2·2.5·5×10ⁿ steps (never -0.85 / 0.85). `floor` keeps a flat series
 * from collapsing the axis.
 */
export function symmetricBoundV164(maximumAbsolute: number, floor = 0.5): number {
  return 2 * niceStepV164(Math.max(floor, Number.isFinite(maximumAbsolute) ? maximumAbsolute : 0) / 2);
}

/**
 * Round ticks covering [lo, hi] with about `count` intervals. The first and last
 * ticks are the axis bounds, so a chart that uses them as its domain shows every
 * value inside a labelled range.
 */
export function niceTicksV164(lo: number, hi: number, count = 4, integerOnly = false): number[] {
  if (!Number.isFinite(lo) || !Number.isFinite(hi)) return [];
  let low = Math.min(lo, hi);
  let high = Math.max(lo, hi);
  if (low === high) {
    const pad = Math.abs(low) * 0.1 || 1;
    low -= pad;
    high += pad;
  }
  const step = niceStepV164((high - low) / Math.max(1, count), integerOnly);
  const first = Math.floor(low / step + 1e-9) * step;
  const last = Math.ceil(high / step - 1e-9) * step;
  const ticks: number[] = [];
  for (let index = 0; first + index * step <= last + step * 1e-6 && index < 50; index += 1) {
    ticks.push(Number((first + index * step).toPrecision(12)));
  }
  return ticks;
}

function scaleForV164(maxAbs: number): { divisor: number; suffix: string } {
  if (maxAbs >= JO) return { divisor: JO, suffix: "조" };
  if (maxAbs >= EOK) return { divisor: EOK, suffix: "억" };
  return { divisor: 1, suffix: "" };
}

/** Decimal places needed to write `value` exactly (at most 6). */
export function decimalsOfV164(value: number): number {
  if (!Number.isFinite(value)) return 0;
  for (let digits = 0; digits < 6; digits += 1) {
    const scaled = Math.abs(value) * 10 ** digits;
    if (Math.abs(scaled - Math.round(scaled)) <= 1e-9 * Math.max(1, scaled)) return digits;
  }
  return 6;
}

/**
 * Labels for a set of ticks, all in the same scale word and precision. The
 * precision is whatever the ticks need to be written exactly: a 2.5 step shows
 * 32.5 and 37.5, never 33 and 38, and a 0.25 step shows two decimals.
 */
export function formatAxisTicksV164(ticks: number[]): string[] {
  const finite = ticks.filter((tick) => Number.isFinite(tick));
  if (finite.length === 0) return ticks.map(String);
  const maxAbs = Math.max(...finite.map((tick) => Math.abs(tick)));
  const { divisor, suffix } = scaleForV164(maxAbs);
  const digits = Math.max(0, ...finite.map((tick) => decimalsOfV164(tick / divisor)));
  const formatter = new Intl.NumberFormat("ko-KR", { minimumFractionDigits: 0, maximumFractionDigits: digits });
  return ticks.map((tick) => (Number.isFinite(tick) ? `${formatter.format(tick / divisor)}${tick === 0 ? "" : suffix}` : String(tick)));
}

/** One value written the way the axis beside it is (scale word past 억, ≤3 significant decimals). */
export function formatAxisValueV164(value: number): string {
  if (!Number.isFinite(value)) return String(value);
  const { divisor, suffix } = scaleForV164(Math.abs(value));
  const scaled = value / divisor;
  const abs = Math.abs(scaled);
  const digits = abs >= 100 ? 0 : abs >= 10 ? 1 : 2;
  return `${new Intl.NumberFormat("ko-KR", { maximumFractionDigits: digits }).format(scaled)}${suffix}`;
}

const STEP_FACTORS_V164 = [1, 2, 2.5, 5];

function cleanV164(value: number): number {
  return Number(value.toPrecision(12));
}

/**
 * Round ticks inside a domain that is already fixed (a 0-100 score, a capped
 * percentage). Unlike `niceTicksV164` the domain is not widened: the smallest
 * 1·2·2.5·5×10ⁿ step that gives at most `count + 2` ticks is used, and only
 * multiples of it that fall inside the domain are returned.
 */
export function roundTicksWithinV164(lo: number, hi: number, count = 5): number[] {
  if (!Number.isFinite(lo) || !Number.isFinite(hi)) return [];
  const low = Math.min(lo, hi);
  const high = Math.max(lo, hi);
  if (low === high) return [low];
  const raw = (high - low) / Math.max(1, count);
  const magnitude = 10 ** Math.floor(Math.log10(raw));
  const candidates: number[] = [];
  for (let exponent = -1; exponent <= 2; exponent += 1) {
    for (const factor of STEP_FACTORS_V164) candidates.push(factor * magnitude * 10 ** exponent);
  }
  candidates.sort((a, b) => a - b);
  const aligned = (value: number, step: number) => Math.abs(value / step - Math.round(value / step)) < 1e-9;
  // A step that lands on both ends of the domain wins; otherwise the smallest that fits. Five ticks or more
  // (the chart audit's floor) come first, one more tick is allowed to reach them, and only then fewer.
  const passes: Array<{ requireEnds: boolean; minTotal: number; maxTotal: number }> = [
    { requireEnds: true, minTotal: 5, maxTotal: count + 2 },
    { requireEnds: false, minTotal: 5, maxTotal: count + 2 },
    { requireEnds: true, minTotal: 5, maxTotal: count + 3 },
    { requireEnds: false, minTotal: 5, maxTotal: count + 3 },
    { requireEnds: true, minTotal: 2, maxTotal: count + 2 },
    { requireEnds: false, minTotal: 2, maxTotal: count + 2 },
  ];
  for (const { requireEnds, minTotal, maxTotal } of passes) {
    for (const step of candidates) {
      if (requireEnds && !(aligned(low, step) && aligned(high, step))) continue;
      const first = Math.ceil(low / step - 1e-9);
      const last = Math.floor(high / step + 1e-9);
      const total = last - first + 1;
      if (total >= minTotal && total <= maxTotal) {
        return Array.from({ length: total }, (_, index) => cleanV164((first + index) * step));
      }
    }
  }
  return [low, high];
}

export interface ValueAxisV164 {
  /** Lowest and highest value the axis draws. */
  domain: [number, number];
  /** Round tick values, lowest first, all inside the domain. */
  ticks: number[];
}

const MIN_VALUE_TICKS_V164 = 5;

/**
 * The value axis of a line chart: the data range with a little air, ending on
 * round ticks, and the ticks themselves taken from the same step the domain was
 * rounded with (so an axis never ends on 0.5 and then counts in 0.6). A series
 * that never changes still gets a readable axis around its single value, and a
 * percentage whose values all fit in 0-100 is not drawn past 100.
 */
export function valueAxisV164({
  values,
  fixedDomain,
  unit = "",
  intervals = 5,
}: {
  values: number[];
  fixedDomain?: [number, number] | null;
  unit?: string;
  intervals?: number;
}): ValueAxisV164 {
  if (fixedDomain) {
    const domain: [number, number] = fixedDomain[0] <= fixedDomain[1] ? [fixedDomain[0], fixedDomain[1]] : [fixedDomain[1], fixedDomain[0]];
    return { domain, ticks: roundTicksWithinV164(domain[0], domain[1], intervals) };
  }
  const finite = values.filter((value) => Number.isFinite(value));
  if (finite.length === 0) return { domain: [0, 1], ticks: niceTicksV164(0, 1, intervals) };
  // V164-R3: a count (건·곳·명) whose values are whole numbers is guided at whole numbers (0 1 2 3, never 0.5 1.5).
  const wholeCounts = isCountUnitV164(unit) && finite.every((value) => Number.isInteger(value));
  const minimum = Math.min(...finite);
  const maximum = Math.max(...finite);
  const amount = minimum === maximum ? Math.abs(minimum) * 0.1 || 1 : (maximum - minimum) * 0.08;
  const low = minimum >= 0 ? Math.max(0, minimum - amount) : minimum - amount;
  const high = maximum + amount;
  // At least five guides (the chart audit's floor): a coarse step that leaves four is traded for the next finer one.
  let nice = niceTicksV164(low, high, intervals, wholeCounts);
  for (let want = intervals + 1; nice.length < MIN_VALUE_TICKS_V164 && want <= intervals + 5; want += 1) nice = niceTicksV164(low, high, want, wholeCounts);
  if (nice.length < 2) return { domain: [low, high], ticks: [low, high] };
  const domainLow = minimum >= 0 ? Math.max(0, nice[0]) : nice[0];
  let domainHigh = nice[nice.length - 1];
  if (/%/u.test(unit) && minimum >= 0 && maximum <= 100 && domainHigh > 100 && domainLow < 100) domainHigh = 100;
  if (domainLow === nice[0] && domainHigh === nice[nice.length - 1]) return { domain: [domainLow, domainHigh], ticks: nice };
  const within = roundTicksWithinV164(domainLow, domainHigh, intervals);
  return { domain: [domainLow, domainHigh], ticks: wholeCounts ? within.filter((tick) => Number.isInteger(tick)) : within };
}

/**
 * Labels for the horizontal axis. Every observation gets one while they fit -
 * and, when `plotWidth` is given, while neighbouring labels keep `minGap`
 * pixels apart (a run of consecutive years squeezed beside a distant one would
 * not). Past that, the ticks are the round years (every 2nd, 5th, 10th …)
 * inside the range, so the labels are evenly spaced and never skip or double
 * up a year the way picking every n-th observation does.
 */
export function niceXTicksV164(values: number[], maxCount: number, plotWidth?: number, minGap = 40): number[] {
  const sorted = Array.from(new Set(values.filter((value) => Number.isFinite(value)))).sort((a, b) => a - b);
  const lo = sorted[0];
  const hi = sorted[sorted.length - 1];
  const crowded = () => {
    if (!plotWidth || hi === lo) return false;
    return sorted.slice(1).some((value, index) => ((value - sorted[index]) / (hi - lo)) * plotWidth < minGap);
  };
  if (sorted.length <= Math.max(2, maxCount) && !crowded()) return sorted;
  if (sorted.length < 2) return sorted;
  const limit = Math.max(2, maxCount);
  if (sorted.every((value) => Number.isInteger(value))) {
    for (let exponent = 0; exponent <= 6; exponent += 1) {
      for (const factor of STEP_FACTORS_V164) {
        const step = factor * 10 ** exponent;
        if (!Number.isInteger(step)) continue;
        const first = Math.ceil(lo / step);
        const last = Math.floor(hi / step);
        const total = last - first + 1;
        if (total >= 2 && total <= limit) return Array.from({ length: total }, (_, index) => (first + index) * step);
      }
    }
    return [lo, hi];
  }
  const ticks = roundTicksWithinV164(lo, hi, limit - 1);
  return ticks.length >= 2 ? ticks : [lo, hi];
}
