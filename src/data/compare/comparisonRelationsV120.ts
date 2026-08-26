export type ComparisonContextV120 = {
  countries: string[];
  elementIds: string[];
  datasetIds: string[];
  yearMode: "same-year" | "latest-available";
  selectedYear?: number;
  period?: [number, number];
  technology?: string;
  institution?: string;
  projectStatus?: string;
  financeMetric?: string;
};

export const createEmptyComparisonContextV120 = (): ComparisonContextV120 => ({
  countries: [],
  elementIds: [],
  datasetIds: [],
  yearMode: "latest-available",
});

export const comparisonContextToDownloadHashV120 = (
  context: ComparisonContextV120
) => {
  const params = new URLSearchParams();
  if (context.countries.length)
    params.set("countries", context.countries.join(","));
  if (context.elementIds.length)
    params.set("elements", context.elementIds.join(","));
  if (context.datasetIds.length)
    params.set("datasets", context.datasetIds.join(","));
  params.set("comparisonMode", context.yearMode);
  if (context.selectedYear) params.set("year", String(context.selectedYear));
  if (context.period) params.set("period", context.period.join("-"));
  if (context.technology) params.set("technology", context.technology);
  if (context.institution) params.set("institution", context.institution);
  if (context.projectStatus) params.set("projectStatus", context.projectStatus);
  if (context.financeMetric) params.set("financeMetric", context.financeMetric);
  return `#download?${params.toString()}`;
};

export const comparisonContextToMapHashV120 = (
  context: ComparisonContextV120
) => {
  const params = new URLSearchParams();
  if (context.countries[0]) params.set("country", context.countries[0]);
  if (context.elementIds[0]) params.set("focusLayer", context.elementIds[0]);
  if (context.technology) params.set("technology", context.technology);
  if (context.institution) params.set("institution", context.institution);
  return `#map?${params.toString()}`;
};
