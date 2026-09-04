/**
 * Reading large numbers on a public screen.
 *
 * A KPI that says 1,876,471,402 makes the reader count digits to learn that it
 * is roughly 1.9 billion. Korean has the scale words for this, so the headline
 * says 18.76억 and the exact figure stays one hover away and unchanged in the
 * table and the download. Nothing is rounded away; the precise value is
 * returned alongside the short one and both are rendered.
 */

const MAN = 10_000;
const EOK = 100_000_000;
const JO = 1_000_000_000_000;

export interface PublicScaledNumberV136_2 {
  /** The short form for the headline, e.g. "18.76억". */
  display: string;
  /** The full figure, grouped, e.g. "1,876,471,402". */
  exact: string;
  /** True when display and exact differ, so a caller can offer the exact one. */
  scaled: boolean;
}

/**
 * Currency reads naturally in 만/억/조 from a million upwards. A physical
 * quantity usually already carries a scaled unit (MW, kt, ha), so shortening it
 * again competes with the unit; it is only worth doing past 억.
 */
function scaleFloorFor(unit: string | null | undefined): number {
  const text = String(unit || "");
  const isCurrency = /USD|VND|KRW|EUR|JPY|달러|원|동\b|백만\s*달러/iu.test(text);
  return isCurrency ? 1_000_000 : EOK;
}

function trimZeros(value: string): string {
  return value.replace(/\.0+$/u, "").replace(/(\.\d*?)0+$/u, "$1");
}

function groupedV136_2(value: number): string {
  return new Intl.NumberFormat("ko-KR", { maximumFractionDigits: 4 }).format(value);
}

/**
 * Formats one number for a public headline, keeping the exact value available.
 * Values below the scale floor, and anything not finite, come back unchanged.
 */
export function publicScaledNumberV136_2(
  value: number,
  unit?: string | null
): PublicScaledNumberV136_2 {
  const exact = groupedV136_2(value);
  if (!Number.isFinite(value)) return { display: exact, exact, scaled: false };

  const magnitude = Math.abs(value);
  if (magnitude < scaleFloorFor(unit)) {
    return { display: exact, exact, scaled: false };
  }

  const [divisor, suffix, decimals] =
    magnitude >= JO
      ? ([JO, "조", 2] as const)
      : magnitude >= EOK
      ? ([EOK, "억", 2] as const)
      : ([MAN, "만", 0] as const);

  const short = trimZeros((value / divisor).toFixed(decimals));
  const display = `${groupedV136_2(Number(short))}${suffix}`;
  return { display, exact, scaled: display !== exact };
}
