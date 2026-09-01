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

export type PublicFixedDomainRuleV127 = {
  measureKeys: readonly string[];
  domain: readonly [number, number];
  scaleDescription: string;
};

export type PublicFixedDomainV127 = {
  domain: [number, number];
  scaleDescription: string;
};

export type PublicVisualizationSummaryV126 = {
  elementId: string;
  presentationKind: PublicPresentationKindV126;
  primaryRenderer: PublicAnalyticalRendererV126;
  adapterRenderer: SemanticRendererV125;
  dataPresenceStatus: string;
  populatedRecordCount: number;
  defaultMeasureKey?: string;
  fixedDomainRules?: readonly PublicFixedDomainRuleV127[];
  /**
   * Dimensions whose values use different denominators and therefore must be
   * selected one at a time instead of sharing a public comparison axis.
   */
  singleDenominatorDimensionKeys?: readonly string[];
};

const SPECIALIZED_ELEMENTS_V126 = new Set(["A-002", "D-005", "E-012"]);

const PUBLIC_DEFAULT_MEASURE_KEYS_V127: Readonly<Record<string, string>> =
  Object.freeze({
    "A-001": "measure-ffa3eb23fb73",
  });

const PUBLIC_SINGLE_DENOMINATOR_DIMENSIONS_V129: Readonly<
  Record<string, readonly string[]>
> = Object.freeze({
  "B-013": Object.freeze(["detail"]),
  "D-010": Object.freeze(["category"]),
});

/**
 * Reviewed official score scales only. Percentage and currency series keep an
 * adaptive domain so ordinary variation remains legible. Rules are keyed by
 * public semantic measure rather than inferred from source notes at runtime.
 */
const PUBLIC_FIXED_DOMAIN_RULES_V127: Readonly<
  Record<string, readonly PublicFixedDomainRuleV127[]>
> = Object.freeze({
  "A-001": Object.freeze([
    {
      measureKeys: Object.freeze([
        "measure-ffa3eb23fb73",
        "measure-caff7e75bb43",
        "measure-e1d0f1a6c1e8",
      ]),
      domain: Object.freeze([0, 100]) as readonly [number, number],
      scaleDescription: "0(매우 부패)–100(매우 청렴)",
    },
    {
      measureKeys: Object.freeze(["measure-9db6f2970bf5"]),
      domain: Object.freeze([0, 10]) as readonly [number, number],
      scaleDescription: "0–10(2011년 이전 방법론)",
    },
  ]),
  "A-002": Object.freeze([
    {
      measureKeys: Object.freeze(["*"]),
      domain: Object.freeze([1, 6]) as readonly [number, number],
      scaleDescription: "1(낮음)–6(높음)",
    },
  ]),
  "A-008": Object.freeze([
    {
      measureKeys: Object.freeze(["measure-a6e5b6b4f25f"]),
      domain: Object.freeze([0, 100]) as readonly [number, number],
      scaleDescription: "0(완전 평등)–100(완전 불평등)",
    },
  ]),
});

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
  "A-016": "composition-trend",
  "A-017": "technology-comparison",
  "A-018": "composition-trend",
  "B-013": "technology-comparison",
  "B-003": "multi-metric-trend",
  "D-005": "composition-trend",
  "D-007": "policy-timeline",
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
    defaultMeasureKey: PUBLIC_DEFAULT_MEASURE_KEYS_V127[summary.elementId],
    fixedDomainRules: PUBLIC_FIXED_DOMAIN_RULES_V127[summary.elementId],
    singleDenominatorDimensionKeys:
      PUBLIC_SINGLE_DENOMINATOR_DIMENSIONS_V129[summary.elementId],
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

export function getPublicFixedDomainV127(
  elementId: string,
  measureKeys: readonly string[]
): PublicFixedDomainV127 | null {
  const rules = PUBLIC_FIXED_DOMAIN_RULES_V127[elementId] || [];
  const uniqueMeasureKeys = Array.from(new Set(measureKeys.filter(Boolean)));
  if (uniqueMeasureKeys.length === 0 || rules.length === 0) return null;

  const matchedRules = uniqueMeasureKeys.map((measureKey) =>
    rules.find(
      (rule) =>
        rule.measureKeys.includes("*") || rule.measureKeys.includes(measureKey)
    )
  );
  if (matchedRules.some((rule) => !rule)) return null;

  const firstRule = matchedRules[0];
  if (!firstRule) return null;
  const sameScale = matchedRules.every(
    (rule) =>
      rule?.domain[0] === firstRule.domain[0] &&
      rule?.domain[1] === firstRule.domain[1] &&
      rule?.scaleDescription === firstRule.scaleDescription
  );
  if (!sameScale) return null;

  return {
    domain: [firstRule.domain[0], firstRule.domain[1]],
    scaleDescription: firstRule.scaleDescription,
  };
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
