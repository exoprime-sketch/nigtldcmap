import type { VietnamObservationV124 } from "../vietnam/vietnamTypesV124";

export type SemanticUnitFamilyV125 =
  | "count"
  | "percent"
  | "currency"
  | "currency-per-period"
  | "energy"
  | "capacity"
  | "emissions"
  | "area"
  | "score"
  | "text"
  | "boolean"
  | "other";

export type SemanticDimensionV125 = {
  key: string;
  value: string;
  labelKo: string;
  labelEn?: string;
  sortOrder?: number;
};

export type SemanticMeasureV125 = {
  key: string;
  labelKo: string;
  unit: string;
  unitFamily: SemanticUnitFamilyV125;
  aggregation?: string;
  denominator?: string;
};

export type SemanticObservationV125 = VietnamObservationV124 & {
  semanticMeasure: SemanticMeasureV125;
  dimensions: Record<string, string>;
  dimensionLabels: Record<string, string>;
  displayLabel: string;
  seriesKey: string;
};

export type SemanticRendererV125 =
  | "kpi-trend"
  | "multi-metric-trend"
  | "composition"
  | "category-comparison"
  | "paired-category-comparison"
  | "score-benchmark"
  | "scenario-range"
  | "seasonality"
  | "portfolio"
  | "directory"
  | "policy-timeline"
  | "evidence-matrix"
  | "capability-scorecard"
  | "document-library"
  | "spatial-summary"
  | "structured-table"
  | "status-only";

export type VisualizationContractStatusV125 =
  | "archetype"
  | "specialized"
  | "structured-table"
  | "status-only";

export type SemanticMeasureSummaryV125 = SemanticMeasureV125 & {
  indicatorCount: number;
  recordCount: number;
};

export type SemanticDimensionSummaryV125 = {
  key: string;
  labelKo: string;
  values: string[];
  valueCount: number;
};

export type SemanticSelectorV125 = {
  key: string;
  labelKo: string;
  values: string[];
  defaultValue?: string;
};

export type ElementVisualizationContractV125 = {
  elementId: string;
  dataPresenceStatus: string;
  observationCount: number;
  entityCount: number;
  populatedRecordCount: number;
  missingRecordCount: number;
  yearRange: {
    start: number | null;
    end: number | null;
  };
  noDataReason: string | null;
  primaryRenderer: SemanticRendererV125;
  secondaryRenderer: SemanticRendererV125;
  measures: SemanticMeasureSummaryV125[];
  dimensions: SemanticDimensionSummaryV125[];
  selectors: SemanticSelectorV125[];
  unitFamilies: SemanticUnitFamilyV125[];
  primaryLabelFields: string[];
  tooltipFields: string[];
  tableColumns: string[];
  mapLinkage: {
    enabled: boolean;
    mapMode: string;
    featureCount: number;
    stateParameters: string[];
  };
  comparisonPolicy: string;
  missingDataPolicy: string;
  currentVisualizationIssue: string;
  contractStatus: VisualizationContractStatusV125;
};

export type ElementVisualizationSummaryV125 = {
  elementId: string;
  primaryRenderer: SemanticRendererV125;
  contractStatus: VisualizationContractStatusV125;
  dataPresenceStatus: string;
  populatedRecordCount: number;
  yearRange: { start: number | null; end: number | null };
  measureLabels: string[];
  dimensionLabels: string[];
  spatiallyLinked: boolean;
  downloadAvailable: boolean;
  noDataReason: string | null;
};

export type IndicatorSemanticV125 = {
  indicatorId: string;
  measure: SemanticMeasureV125;
  dimensions: Record<string, string>;
  dimensionLabels: Record<string, string>;
  displayLabel: string;
  seriesKey: string;
  axisGroupKey: string;
  sourceLabel: string;
  sourceLabelEn?: string | null;
  sourceNote?: string | null;
  sourceCaveat?: string | null;
  sourceProvenance?: Record<string, unknown> | null;
  inferenceMethod: "explicit-override" | "deterministic-source-structure";
};

export type RecordSemanticV125 = {
  recordId: string;
  indicatorId: string;
  dimensions: Record<string, string>;
  dimensionLabels: Record<string, string>;
  displayLabel: string;
  seriesKey: string;
  sourceLabel?: string;
};

export type ElementIndicatorSemanticsV125 = {
  schemaVersion: "v125";
  generatedAt: string;
  elementId: string;
  indicatorCount: number;
  observationCount: number;
  entityCount: number;
  measures: SemanticMeasureSummaryV125[];
  dimensions: SemanticDimensionSummaryV125[];
  indicators: IndicatorSemanticV125[];
  recordSemanticsMode: "sparse-overrides";
  records: RecordSemanticV125[];
};

export type IndicatorSemanticsIndexEntryV125 = {
  elementId: string;
  assetUrl: string;
  indicatorCount: number;
  observationCount: number;
  entityCount: number;
  measureKeys: string[];
  dimensionKeys: string[];
};

export type IndicatorSemanticsIndexV125 = {
  schemaVersion: "v125";
  generatedAt: string;
  elementCount: number;
  indicatorCount: number;
  observationCount: number;
  elements: Record<string, IndicatorSemanticsIndexEntryV125>;
};

export type ElementVisualizationContractsAssetV125 = {
  schemaVersion: "v125";
  generatedAt: string;
  elementCount: number;
  contracts: ElementVisualizationContractV125[];
};

export type E012MeasureKeyV125 =
  | "employment_rate"
  | "employed_persons"
  | "average_monthly_wage"
  | "occupation_employment_count"
  | "occupation_employment_share"
  | "occupation_female_share"
  | "occupation_wage";

export type E012OccupationV125 =
  | "all"
  | "manager"
  | "professional"
  | "technician"
  | "clerk"
  | "service_sales"
  | "skilled_agriculture"
  | "craft"
  | "machine_operator"
  | "elementary"
  | "other";

export type E012RankedOccupationV125 = Exclude<E012OccupationV125, "all">;

export type E012SexV125 = "total" | "male" | "female";
