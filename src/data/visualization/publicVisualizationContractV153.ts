/**
 * V153-D1: the per-dataset visualization contract for the 152 public detail
 * screens. Each row declares what a reader must see first (`primary`), what
 * follows, where the map sits and which published references the layout was
 * judged against. The router and the renderers order their blocks from it,
 * and `scripts/v153/detail-contract-qa-v153.mjs` reads the same JSON to judge
 * the production build against it - the contract is never rewritten to match
 * a screen; a screen that cannot follow its archetype's standard is filed as
 * an `exception` with the reason.
 */
import contractJson from "./publicVisualizationContractV153.json";
import type { DisplayTypeV159, StructureV159 } from "../spec/specTypesV159";

export type VisualizationArchetypeV153 =
  | "national-series"
  | "composition"
  | "province-distribution"
  | "registry"
  | "station"
  | "policy-document"
  | "matrix"
  | "status-note";

/** Block types, shared by the contract and the `data-analysis-block` tags. */
export type AnalysisBlockTypeV153 =
  | "line"
  | "stacked-area"
  | "region-bar"
  | "category-bar"
  | "dumbbell"
  | "timeline"
  | "comparison-table"
  | "heatmap"
  | "sorted-table"
  | "status-note"
  | "table"
  | "cards-list"
  | "note";

export const ANALYSIS_BLOCK_TYPES_V153: readonly AnalysisBlockTypeV153[] = [
  "line",
  "stacked-area",
  "region-bar",
  "category-bar",
  "dumbbell",
  "timeline",
  "comparison-table",
  "heatmap",
  "sorted-table",
  "status-note",
  "table",
  "cards-list",
  "note",
];

/** Types that draw numbers on an axis; the contract must state the axes. */
export const AXIS_BLOCK_TYPES_V153: readonly AnalysisBlockTypeV153[] = [
  "line",
  "stacked-area",
  "region-bar",
  "category-bar",
  "dumbbell",
  "heatmap",
];

export type ContractStatusV153 = "standard" | "preserved" | "exception";
export type MapRoleV153 = "beside-primary" | "none" | "pending";

export interface ContractBlockV153 {
  type: AnalysisBlockTypeV153;
  title: string;
}

export interface ContractPrimaryV153 extends ContractBlockV153 {
  xAxis: string | null;
  yAxis: string | null;
  unit: string | null;
}

export interface VisualizationContractRowV153 {
  elementId: string;
  /** V159 display type, copied from src/data/spec/datasetTypologyV159.json. */
  displayType: DisplayTypeV159;
  /** V159 delivery structure, copied from the same typology row. */
  structure: StructureV159;
  archetype: VisualizationArchetypeV153;
  primary: ContractPrimaryV153;
  secondary: ContractBlockV153[];
  mapRole: MapRoleV153;
  benchmarks: Array<{ name: string; url: string }>;
  status: ContractStatusV153;
  note: string;
}

export const VISUALIZATION_CONTRACT_V153: readonly VisualizationContractRowV153[] = (
  contractJson as { rows: VisualizationContractRowV153[] }
).rows;

const byElement = new Map<string, VisualizationContractRowV153>();
VISUALIZATION_CONTRACT_V153.forEach((row) => byElement.set(row.elementId, row));

export function visualizationContractV153(elementId: string): VisualizationContractRowV153 | null {
  return byElement.get(elementId) ?? null;
}

/**
 * The first block each archetype owes the reader (the standard the user set):
 * a country series opens on its line, a composition on the stacked area, a
 * province distribution on the region bars, a registry on the count/size bars,
 * stations on the dumbbell, documents on a timeline or a comparison table
 * (never a numeric chart), matrices on a sorted table (heatmap later), and a
 * status screen on the statement alone.
 */
export function standardPrimaryTypesV153(archetype: VisualizationArchetypeV153): readonly AnalysisBlockTypeV153[] {
  switch (archetype) {
    case "national-series":
      return ["line"];
    case "composition":
      return ["stacked-area"];
    case "province-distribution":
      return ["region-bar"];
    case "registry":
      return ["category-bar"];
    case "station":
      return ["dumbbell"];
    case "policy-document":
      return ["timeline", "comparison-table"];
    case "matrix":
      return ["heatmap", "sorted-table"];
    case "status-note":
      return ["status-note"];
    default:
      return [];
  }
}

/** Block types a policy/document screen or a status screen must never open on. */
export const NUMERIC_CHART_TYPES_V153: readonly AnalysisBlockTypeV153[] = [
  "line",
  "stacked-area",
  "region-bar",
  "category-bar",
  "dumbbell",
  "heatmap",
];

/**
 * Orders a component's blocks so the contract's primary type comes first
 * (stable otherwise). Components hand in `{ type, node }` pairs in their own
 * order; the one whose type matches the contract moves to the front.
 */
export function orderBlocksV153<T extends { type: AnalysisBlockTypeV153 }>(
  blocks: readonly T[],
  primaryType: AnalysisBlockTypeV153 | null | undefined
): T[] {
  if (!primaryType) return [...blocks];
  const index = blocks.findIndex((block) => block.type === primaryType);
  if (index <= 0) return [...blocks];
  return [blocks[index], ...blocks.slice(0, index), ...blocks.slice(index + 1)];
}
