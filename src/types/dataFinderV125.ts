export interface DataFinderSelectorStateV125 {
  measure: string | null;
  sex: "total" | "male" | "female" | null;
  year: number | null;
  period: string | null;
  dimensions: Record<string, string>;
}

export const EMPTY_DATA_FINDER_SELECTOR_STATE_V125: DataFinderSelectorStateV125 = {
  measure: null,
  sex: null,
  year: null,
  period: null,
  dimensions: {},
};

const SEX_VALUES_V125 = new Set(["total", "male", "female"]);
const DIMENSION_PARAM_PREFIX_V125 = "dim.";
const DIMENSION_KEY_V125 = /^[a-z][a-z0-9_-]*$/i;

export function parseDataFinderSelectorStateV125(
  params: URLSearchParams
): DataFinderSelectorStateV125 {
  const measure = params.get("measure")?.trim() || null;
  const rawSex = params.get("sex")?.trim().toLowerCase() || null;
  const rawYear = params.get("year")?.trim() || null;
  const parsedYear = rawYear === null ? null : Number(rawYear);
  const period = params.get("period")?.trim().normalize("NFC") || null;
  const dimensions: Record<string, string> = {};
  params.forEach((rawValue, parameter) => {
    if (!parameter.startsWith(DIMENSION_PARAM_PREFIX_V125)) return;
    const key = parameter.slice(DIMENSION_PARAM_PREFIX_V125.length);
    const value = rawValue.trim().normalize("NFC");
    if (DIMENSION_KEY_V125.test(key) && value) dimensions[key] = value;
  });

  return {
    measure,
    sex:
      rawSex && SEX_VALUES_V125.has(rawSex)
        ? (rawSex as DataFinderSelectorStateV125["sex"])
        : null,
    year:
      parsedYear !== null && Number.isInteger(parsedYear) ? parsedYear : null,
    period,
    dimensions,
  };
}

export function appendDataFinderSelectorParamsV125(
  params: URLSearchParams,
  state: DataFinderSelectorStateV125
): void {
  if (state.measure) params.set("measure", state.measure);
  if (state.sex) params.set("sex", state.sex);
  if (state.year !== null) params.set("year", String(state.year));
  if (state.period) params.set("period", state.period);
  Object.entries(state.dimensions)
    .filter(([key, value]) => DIMENSION_KEY_V125.test(key) && value.trim())
    .sort(([left], [right]) => left.localeCompare(right))
    .forEach(([key, value]) =>
      params.set(
        `${DIMENSION_PARAM_PREFIX_V125}${key}`,
        value.trim().normalize("NFC")
      )
    );
}

export function dataFinderSelectorStatesEqualV125(
  left: DataFinderSelectorStateV125,
  right: DataFinderSelectorStateV125
): boolean {
  return (
    left.measure === right.measure &&
    left.sex === right.sex &&
    left.year === right.year &&
    left.period === right.period &&
    dimensionStatesEqualV125(left.dimensions, right.dimensions)
  );
}

function dimensionStatesEqualV125(
  left: Record<string, string>,
  right: Record<string, string>
): boolean {
  const leftEntries = Object.entries(left).sort(([a], [b]) => a.localeCompare(b));
  const rightEntries = Object.entries(right).sort(([a], [b]) => a.localeCompare(b));
  return (
    leftEntries.length === rightEntries.length &&
    leftEntries.every(
      ([key, value], index) =>
        rightEntries[index]?.[0] === key && rightEntries[index]?.[1] === value
    )
  );
}
