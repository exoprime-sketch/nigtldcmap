import type { VietnamEntityV124 } from "../vietnam/vietnamTypesV124";
import { wideRecordsOfEntitiesV162 } from "./wideRecordsV162";

/**
 * V164-3 (WP-F): which choices a selector offers.
 *
 * A selector lists what the delivery has rows for, and a row is not a value:
 * 연도 2021 of the poverty series holds a row whose value the source leaves
 * empty, so the reader chose it and met "표시할 값이 없습니다". The choices that
 * lead to a value are offered; when none of them does, the list stays as the rows
 * give it (the screen then says so, as before). Nothing is filled in.
 */

/** A row states a value when it is neither empty nor a number that is not finite. */
export function hasPublicValueV164(value: unknown): boolean {
  if (value === null || value === undefined || value === "") return false;
  return typeof value !== "number" || Number.isFinite(value);
}

/**
 * The choices that lead to a value. When none does, every choice is kept: an
 * all-empty list is the delivery's state, not a reason to hide the selector.
 */
export function populatedChoicesV164<T>(choices: readonly T[], isPopulated: (choice: T) => boolean): T[] {
  const kept = choices.filter(isPopulated);
  return kept.length > 0 ? kept : [...choices];
}

/**
 * A measure named after the column it came from ("D-009_environmental_protection
 * _expenditure_lcu"): an ASCII token with underscores and no space. A reader has
 * no use for it as a name, and it is not shown as one.
 */
export function isRawKeyLabelV164(label: string | null | undefined): boolean {
  return /^[A-Za-z][A-Za-z0-9-]*(?:_[A-Za-z0-9-]+)+$/u.test((label || "").trim());
}

/**
 * Measures that can be offered by name. A raw-key measure is left out when a
 * named one exists; when every measure is a raw key, they are all kept.
 */
export function namedMeasuresV164<T extends { labelKo: string }>(measures: readonly T[]): T[] {
  const named = measures.filter((measure) => !isRawKeyLabelV164(measure.labelKo));
  return named.length > 0 ? named : [...measures];
}

/**
 * The elements whose entity rows are drawn by the portfolio workspace
 * (PublicPortfolioWorkspaceV143: 검색어 · 연도 · 분류 · 선택 초기화). Same list as
 * PUBLIC_PORTFOLIO_ELEMENTS_V132 in SemanticContractRendererV125 - a test keeps
 * the two equal.
 */
export const PORTFOLIO_WORKSPACE_ELEMENTS_V164: ReadonlySet<string> = new Set([
  "D-012",
  "D-013",
  "D-014",
  "D-015",
  "D-016",
  "D-017",
  "D-018",
  "D-019",
  "D-020",
  "D-021",
  "D-022",
  "D-023",
  "D-024",
  "D-025",
  "D-026",
]);

/**
 * True when the screen draws its records in the portfolio workspace. That
 * workspace has its own selection line - the one summary, charts and list obey -
 * so the analysis selectors above it would be a second line of the same choices
 * (D-023 showed 연도 twice, E-020 three 지원 유형 selectors, D-019 two 기술 분야).
 * Mirrors the renderer: record cards (wide template) take precedence, and a
 * timeline or matrix renderer draws no portfolio.
 */
export function drawsPortfolioWorkspaceV164(
  elementId: string,
  primaryRenderer: string,
  entities: readonly VietnamEntityV124[]
): boolean {
  if (entities.length === 0) return false;
  if (primaryRenderer === "policy-timeline" || primaryRenderer === "evidence-matrix") return false;
  if (wideRecordsOfEntitiesV162([...entities]).length > 0) return false;
  return PORTFOLIO_WORKSPACE_ELEMENTS_V164.has(elementId) || primaryRenderer === "portfolio";
}
