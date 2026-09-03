import type {
  VietnamIndicatorMetaV124,
  VietnamObservationV124,
} from "../vietnam/vietnamTypesV124";

/**
 * V135 temporal depth policy.
 *
 * The chart type a public screen may use is decided by how many years the
 * source data can actually compare within one measure, never by how wide the
 * element's overall year range looks. A dataset whose measures each hold a
 * single year is a single-year dataset even when different measures were
 * collected in different years.
 */
export type PublicTemporalDepthV135 =
  | "single-year"
  | "two-year"
  | "time-series"
  | "scenario"
  | "non-temporal";

const SCENARIO_PATTERN_V135 = /SSP\d?|RCP\d?|시나리오|scenario/iu;

function observationYearV135(row: VietnamObservationV124): number | null {
  if (typeof row.year === "number" && Number.isFinite(row.year)) {
    return row.year;
  }
  const period = String(row.period || "");
  const match = period.match(/\d{4}/u);
  if (!match) return null;
  const parsed = Number.parseInt(match[0], 10);
  return Number.isFinite(parsed) ? parsed : null;
}

function isNumericObservationV135(row: VietnamObservationV124): boolean {
  if (typeof row.value === "number") return Number.isFinite(row.value);
  if (typeof row.value === "string" && row.value.trim() !== "") {
    return Number.isFinite(Number(row.value));
  }
  return false;
}

/**
 * Returns the largest number of distinct populated years available inside a
 * single measure. This is the count a user could actually compare on one axis.
 */
export function maxComparableYearCountV135(
  observations: VietnamObservationV124[]
): number {
  const yearsByIndicator = new Map<string, Set<number>>();
  observations.forEach((row) => {
    if (!isNumericObservationV135(row)) return;
    const year = observationYearV135(row);
    if (year === null) return;
    const key = String(row.indicatorId || "");
    const bucket = yearsByIndicator.get(key) || new Set<number>();
    bucket.add(year);
    yearsByIndicator.set(key, bucket);
  });
  let maximum = 0;
  yearsByIndicator.forEach((years) => {
    maximum = Math.max(maximum, years.size);
  });
  return maximum;
}

export function resolvePublicTemporalDepthV135(
  observations: VietnamObservationV124[],
  indicators: VietnamIndicatorMetaV124[] = []
): PublicTemporalDepthV135 {
  const comparableYears = maxComparableYearCountV135(observations);
  if (comparableYears <= 0) return "non-temporal";
  if (comparableYears === 1) return "single-year";
  if (comparableYears === 2) return "two-year";
  const scenarioEvidence = indicators.some((meta) =>
    SCENARIO_PATTERN_V135.test(
      `${meta.labelKo || ""} ${meta.labelEn || ""} ${meta.indicatorId || ""}`
    )
  );
  return scenarioEvidence ? "scenario" : "time-series";
}
