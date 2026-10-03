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

/** The 1·2·2.5·5×10ⁿ step at or above `raw`. */
export function niceStepV164(raw: number): number {
  if (!Number.isFinite(raw) || raw <= 0) return 1;
  const magnitude = 10 ** Math.floor(Math.log10(raw));
  const fraction = raw / magnitude;
  const factor = fraction <= 1 ? 1 : fraction <= 2 ? 2 : fraction <= 2.5 ? 2.5 : fraction <= 5 ? 5 : 10;
  return factor * magnitude;
}

/**
 * Round ticks covering [lo, hi] with about `count` intervals. The first and last
 * ticks are the axis bounds, so a chart that uses them as its domain shows every
 * value inside a labelled range.
 */
export function niceTicksV164(lo: number, hi: number, count = 4): number[] {
  if (!Number.isFinite(lo) || !Number.isFinite(hi)) return [];
  let low = Math.min(lo, hi);
  let high = Math.max(lo, hi);
  if (low === high) {
    const pad = Math.abs(low) * 0.1 || 1;
    low -= pad;
    high += pad;
  }
  const step = niceStepV164((high - low) / Math.max(1, count));
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

/** Labels for a set of ticks, all in the same scale word and precision. */
export function formatAxisTicksV164(ticks: number[]): string[] {
  const finite = ticks.filter((tick) => Number.isFinite(tick));
  if (finite.length === 0) return ticks.map(String);
  const maxAbs = Math.max(...finite.map((tick) => Math.abs(tick)));
  const { divisor, suffix } = scaleForV164(maxAbs);
  const sorted = [...finite].sort((a, b) => a - b);
  const gaps = sorted.slice(1).map((value, index) => value - sorted[index]).filter((gap) => gap > 0);
  const step = gaps.length ? Math.min(...gaps) / divisor : maxAbs / divisor || 1;
  const digits = Math.max(0, Math.min(6, -Math.floor(Math.log10(step) + 1e-9)));
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
