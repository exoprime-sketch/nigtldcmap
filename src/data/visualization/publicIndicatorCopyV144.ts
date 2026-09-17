import reviewedCopy from "./publicIndicatorCopyV144.json";
import type { SemanticObservationV125 } from "./semanticTypesV125";
import { publicDimensionContextV136_2, publicMeasureLabelV126 } from "./publicCopyRegistryV126";

const copy: Record<string, Record<string, string>> = reviewedCopy;

/** Explicit source phrases only. Never shorten unknown dimensions by length. */
export function publicIndicatorDimensionV144(elementId: string, value: string): string {
  return copy[elementId]?.[value] ?? value;
}

export function publicIndicatorContextV144(elementId: string, labels: Record<string, string>): string[] {
  const values = Object.entries(labels).flatMap(([key, original]) => {
    if (["year", "period"].includes(key)) return [];
    const value = publicIndicatorDimensionV144(elementId, original);
    // SSP codes identify a scientific scenario, not an internal record ID.
    return /^SSP[1-5](?:[-–]\d(?:\.\d)?)?$/u.test(value)
      ? [value] : publicDimensionContextV136_2({ [key]: value });
  });
  return [...new Set(values)].slice(0, 2);
}

export function publicIndicatorSeriesV144(row: SemanticObservationV125): string {
  if (!copy[row.elementId]) return row.displayLabel || row.semanticMeasure.labelKo;
  const parts = Object.entries(row.dimensionLabels)
    .filter(([key]) => !["year", "period", "technology"].includes(key))
    .map(([, value]) => publicIndicatorDimensionV144(row.elementId, value))
    .filter(Boolean);
  return [publicMeasureLabelV126(row.semanticMeasure.labelKo), ...new Set(parts)].join(" · ");
}

/** Only adjacent years of exactly the same series, measure and unit may be compared. */
export function previousYearChangeV144(row: SemanticObservationV125, context: SemanticObservationV125[]) {
  if (!row.year || typeof row.value !== "number" || !Number.isFinite(row.value)) return null;
  const previous = context.filter((candidate) => candidate.year === row.year! - 1 &&
    candidate.seriesKey === row.seriesKey && candidate.semanticMeasure.key === row.semanticMeasure.key &&
    (candidate.unit || candidate.semanticMeasure.unit) === (row.unit || row.semanticMeasure.unit) && candidate.countryIso3 === row.countryIso3 &&
    typeof candidate.value === "number" && Number.isFinite(candidate.value));
  if (previous.length !== 1) return null;
  const unit = row.unit || row.semanticMeasure.unit;
  return { value: row.value - (previous[0].value as number), unit: unit === "%" ? "%p" : unit, year: previous[0].year };
}

export function publicPercentHeadlineV144(value: number): string {
  return new Intl.NumberFormat("ko-KR", value !== 0 && Math.abs(value) < 0.01
    ? { maximumSignificantDigits: 2 } : { maximumFractionDigits: 2 }).format(value);
}

/** Metadata is not a measured building stock. New actual counts automatically restore analysis. */
export function metadataOnlyBuildingsV144(rows: ReadonlyArray<{ indicatorId: string; value: unknown }>): boolean {
  const present = rows.filter((row) => row.value !== null && row.value !== undefined && row.value !== "");
  return present.length > 0 && present.every((row) =>
    /^A-026_building_footprint_(confidence_min|crs|field_count)$/u.test(row.indicatorId));
}
