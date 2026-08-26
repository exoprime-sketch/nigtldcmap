export type DataRepresentationType =
  | "numeric"
  | "time_series"
  | "categorical"
  | "verification"
  | "text"
  | "document"
  | "organization"
  | "project_finance"
  | "geospatial";

export type DataViewTemplate =
  | "indicator-summary"
  | "classification-assessment"
  | "evidence-document"
  | "organization-directory"
  | "project-portfolio"
  | "spatial-layer"
  | "permitting-process"
  | "market-evidence"
  | "technology-demand"
  | "generic-data";

export interface DatasetCapabilities {
  explorer: boolean;
  detail: boolean;
  map: boolean;
  countryProfile: boolean;
  countryCompare: boolean;
  cooperationInsights: boolean;
  download: boolean;
}

export type DatasetCompareMode =
  | "ranking"
  | "time-series"
  | "category-matrix"
  | "verification-matrix"
  | "side-by-side"
  | "portfolio"
  | "spatial-summary"
  | "none";

export interface DatasetCompareConfig {
  mode: DatasetCompareMode;
  comparableUnit?: string;
  requireSamePeriod: boolean;
  maximumChartCountries?: number;
  showAllCountriesInTable?: boolean;
}

export type DatasetMapMode =
  | "choropleth"
  | "point"
  | "line"
  | "polygon"
  | "raster"
  | "country-panel"
  | "none";

export interface DatasetMapConfig {
  mode: DatasetMapMode;
  valueField?: string;
  categoryField?: string;
  latitudeField?: string;
  longitudeField?: string;
  geometryField?: string;
  regionIdField?: string;
  clusterPoints?: boolean;
}

export type DatasetInsightSection =
  | "demand"
  | "technical"
  | "policy-permitting"
  | "market-finance"
  | "implementation";

export interface DatasetInsightConfig {
  section: DatasetInsightSection;
  factFields: string[];
  gapFields: string[];
  countryField?: string;
  technologyField?: string;
  recordIdField?: string;
}

export interface DataViewTemplateSpec {
  id: DataViewTemplate;
  label: string;
  summary: string;
  primaryTypes: DataRepresentationType[];
  detailPattern: string;
  mapPattern: string;
  comparePattern: string;
  insightPattern: string;
}
