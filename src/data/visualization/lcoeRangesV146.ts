import type { SemanticObservationV125 } from "./semanticTypesV125";

export interface LcoeRangeV146 {
  technology: string;
  year: number;
  min: number | null;
  benchmark: number | null;
  max: number | null;
  valid: boolean;
}

/** Pair only explicitly labelled bounds of the same technology, year and unit. */
export function lcoeRangesV146(rows: SemanticObservationV125[]): LcoeRangeV146[] {
  const groups = new Map<string, { technology: string; year: number; values: Record<string, number[]> }>();
  for (const row of rows) {
    if (row.unit !== "USD/MWh" || typeof row.value !== "number" || !Number.isFinite(row.value) || row.year == null) continue;
    const match = (row.dimensionLabels.category || row.dimensions.category || "").match(/^(.*?)\((기준값|하한|상한)\)$/u);
    if (!match) continue;
    const key = `${row.year}|${match[1]}`;
    const group = groups.get(key) || { technology: match[1], year: row.year, values: {} };
    (group.values[match[2]] ||= []).push(row.value);
    groups.set(key, group);
  }
  return [...groups.values()].map(({ technology, year, values }) => {
    const unique = (key: string) => values[key]?.length === 1 ? values[key][0] : null;
    const min = unique("하한"), benchmark = unique("기준값"), max = unique("상한");
    return { technology, year, min, benchmark, max, valid: min !== null && max !== null && benchmark !== null && min >= 0 && min <= benchmark && benchmark <= max };
  });
}
