import { ELEMENT_VISUALIZATION_SUMMARIES_V125 } from "./generatedVisualizationContractsV125";
import type {
  ElementVisualizationSummaryV125,
  SemanticRendererV125,
} from "./semanticTypesV125";

export type PublicAnalyticalRendererV126 =
  | "score-trend"
  | "kpi-trend"
  | "multi-metric-trend"
  | "composition-trend"
  | "stacked-emissions"
  | "technology-comparison"
  | "scenario-comparison"
  | "seasonality"
  | "policy-timeline"
  | "portfolio-dashboard"
  | "directory"
  | "evidence-matrix"
  | "capability-scorecard"
  | "spatial-analysis"
  | "structured-table"
  | "status-only";

export type PublicPresentationKindV126 =
  | "specialized"
  | "analytical-archetype"
  | "structured-table"
  | "status-only"
  | "generic-fallback";

export type PublicVisualizationSummaryV126 = {
  elementId: string;
  presentationKind: PublicPresentationKindV126;
  primaryRenderer: PublicAnalyticalRendererV126;
  adapterRenderer: SemanticRendererV125;
  dataPresenceStatus: string;
  populatedRecordCount: number;
};

const SPECIALIZED_ELEMENTS_V126 = new Set(["A-002", "E-012"]);

const ELEMENT_RENDERER_OVERRIDES_V126: Record<
  string,
  PublicAnalyticalRendererV126
> = {
  "A-001": "score-trend",
  "A-002": "score-trend",
  "A-003": "multi-metric-trend",
  "A-005": "composition-trend",
  "A-010": "stacked-emissions",
  "A-011": "stacked-emissions",
  "A-017": "technology-comparison",
  "A-018": "composition-trend",
  "B-033": "spatial-analysis",
  "B-034": "spatial-analysis",
  "C-016": "spatial-analysis",
  "C-019": "policy-timeline",
  "E-007": "evidence-matrix",
  "E-008": "multi-metric-trend",
  "E-012": "multi-metric-trend",
  "E-018": "portfolio-dashboard",
  "E-019": "directory",
  "E-020": "portfolio-dashboard",
};

const PUBLIC_RENDERER_BY_SEMANTIC_V126: Record<
  SemanticRendererV125,
  PublicAnalyticalRendererV126
> = {
  "kpi-trend": "kpi-trend",
  "multi-metric-trend": "multi-metric-trend",
  composition: "composition-trend",
  "category-comparison": "technology-comparison",
  "paired-category-comparison": "technology-comparison",
  "score-benchmark": "score-trend",
  "scenario-range": "scenario-comparison",
  seasonality: "seasonality",
  portfolio: "portfolio-dashboard",
  directory: "directory",
  "policy-timeline": "policy-timeline",
  "evidence-matrix": "evidence-matrix",
  "capability-scorecard": "capability-scorecard",
  "document-library": "structured-table",
  "spatial-summary": "spatial-analysis",
  "structured-table": "structured-table",
  "status-only": "status-only",
};

function presentationKindV126(
  summary: ElementVisualizationSummaryV125
): PublicPresentationKindV126 {
  if (SPECIALIZED_ELEMENTS_V126.has(summary.elementId)) return "specialized";
  if (summary.primaryRenderer === "status-only") return "status-only";
  if (summary.contractStatus === "structured-table") return "structured-table";
  return "analytical-archetype";
}

export const PUBLIC_VISUALIZATION_SUMMARIES_V126: PublicVisualizationSummaryV126[] =
  ELEMENT_VISUALIZATION_SUMMARIES_V125.map((summary) => ({
    elementId: summary.elementId,
    presentationKind: presentationKindV126(summary),
    primaryRenderer:
      ELEMENT_RENDERER_OVERRIDES_V126[summary.elementId] ||
      PUBLIC_RENDERER_BY_SEMANTIC_V126[summary.primaryRenderer],
    adapterRenderer: summary.primaryRenderer,
    dataPresenceStatus: summary.dataPresenceStatus,
    populatedRecordCount: summary.populatedRecordCount,
  }));

const PUBLIC_VISUALIZATION_BY_ELEMENT_V126 = new Map(
  PUBLIC_VISUALIZATION_SUMMARIES_V126.map((summary) => [
    summary.elementId,
    summary,
  ])
);

export function getPublicVisualizationSummaryV126(
  elementId: string
): PublicVisualizationSummaryV126 | null {
  return PUBLIC_VISUALIZATION_BY_ELEMENT_V126.get(elementId) || null;
}

export const PUBLIC_PRESENTATION_COVERAGE_V126 = {
  elementCount: PUBLIC_VISUALIZATION_SUMMARIES_V126.length,
  specializedCount: PUBLIC_VISUALIZATION_SUMMARIES_V126.filter(
    (item) => item.presentationKind === "specialized"
  ).length,
  analyticalArchetypeCount: PUBLIC_VISUALIZATION_SUMMARIES_V126.filter(
    (item) => item.presentationKind === "analytical-archetype"
  ).length,
  structuredTableCount: PUBLIC_VISUALIZATION_SUMMARIES_V126.filter(
    (item) => item.presentationKind === "structured-table"
  ).length,
  statusOnlyCount: PUBLIC_VISUALIZATION_SUMMARIES_V126.filter(
    (item) => item.presentationKind === "status-only"
  ).length,
  genericFallbackCount: PUBLIC_VISUALIZATION_SUMMARIES_V126.filter(
    (item) => item.presentationKind === "generic-fallback"
  ).length,
} as const;
