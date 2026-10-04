import { formatAxisValueV164 } from "../../utils/axisTicksV164";

/**
 * V164: how a bar chart writes and measures its values.
 *
 * - A value is written with three significant digits (52.3, 3.21, 0.683), never
 *   with the six digits a source happens to carry (52.2795, 3.2147, 0.6826), and
 *   past 억 with the Korean scale word (-2.06억 instead of -205,894,297.17). The
 *   exact figure stays in the table below the chart and in the download.
 * - A bar's length is only meaningful against a scale. A percentage that stands
 *   alone is measured against 100 (0.1% is a sliver, not a full bar), and a rank
 *   has no length at all - 29th of 49 is not "29 long" - so it is written as a
 *   number without a track.
 */

/** A value with 3 significant digits; whole numbers keep every integer digit. */
export function formatBarValueV164(value: number): string {
  if (!Number.isFinite(value)) return String(value);
  const abs = Math.abs(value);
  if (abs === 0) return "0";
  if (abs >= 100_000_000) return formatAxisValueV164(value);
  const integerDigits = abs >= 1 ? Math.floor(Math.log10(abs)) + 1 : 0;
  const decimals = abs >= 1 ? Math.max(0, 3 - integerDigits) : Math.min(6, 2 + Math.ceil(-Math.log10(abs)));
  return new Intl.NumberFormat("ko-KR", { maximumFractionDigits: decimals }).format(value);
}

/** True for a unit that counts places in an ordering ("순위", "위"). */
export function isRankUnitV164(unit: string | null | undefined): boolean {
  return /^(순위|위|rank)$/iu.test(String(unit ?? "").trim());
}

/** A value and its unit as one bar label: "29위" for a rank, "52.3 %" otherwise. */
export function formatBarWithUnitV164(value: number, unit: string | null | undefined): string {
  const text = formatBarValueV164(value);
  const trimmed = String(unit ?? "").trim();
  if (isRankUnitV164(trimmed)) return `${text}위`;
  return trimmed ? `${text} ${trimmed}` : text;
}

export interface BarScaleV164 {
  /** True when some value is below zero, so the track has a zero line inside it. */
  signed: boolean;
  /** Where zero sits on the track, in percent of its width. */
  zeroPercent: number;
  /** A value's bar length, in percent of the track. */
  spanFor: (value: number) => number;
  /** False for a rank: the number is written without a bar. */
  drawTrack: boolean;
  /** What the track's full length stands for. */
  basis: "data" | "percent-100" | "maximum";
}

/**
 * The scale of a set of bars of one unit.
 *
 * `maximum` is a known upper bound the caller states (a 0-100 score). Without
 * one, the longest bar fills the track - except a lone percentage, which is
 * measured against 100.
 */
export function barScaleV164(values: number[], unit: string | null | undefined = "", maximum = 0): BarScaleV164 {
  const finite = values.filter((value) => Number.isFinite(value));
  const negMax = Math.max(0, ...finite.map((value) => (value < 0 ? -value : 0)));
  let posMax = Math.max(0, ...finite.map((value) => (value > 0 ? value : 0)));
  let basis: BarScaleV164["basis"] = "data";
  if (maximum > posMax) {
    posMax = maximum;
    basis = "maximum";
  }
  const percentLike = /%/u.test(String(unit ?? "")) && finite.length > 0 && finite.every((value) => value >= 0 && value <= 100);
  if (finite.length === 1 && percentLike && basis === "data") {
    posMax = 100;
    basis = "percent-100";
  }
  const span = Math.max(negMax + posMax, 1e-9);
  return {
    signed: negMax > 0,
    zeroPercent: (negMax / span) * 100,
    spanFor: (value: number) => (Math.abs(value) / span) * 100,
    drawTrack: !isRankUnitV164(unit),
    basis,
  };
}
