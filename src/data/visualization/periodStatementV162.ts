import periodStatementsV162 from "./periodStatementsV162.json";

/**
 * V162 (d): what an element's period is, decided per element from Viet Nam's
 * source fields (periodStatementsV162.json): an observed/published span
 * ('자료기간'), the point a list was collected ('기준 시점' - no year is
 * attached to the element's name in a list or a headline) or a plan's span
 * ('계획기간'). Elements not listed keep their own 자료기간; another country's
 * element of the same number is not covered.
 */
export type PeriodKindV162 = "data" | "reference" | "plan";

export interface PeriodStatementV162 {
  kind: PeriodKindV162;
  label: string;
  text: string;
}

const ELEMENTS_V162 = periodStatementsV162.elements as Record<string, { kind: PeriodKindV162; text: string }>;
const LABELS_V162 = periodStatementsV162.labels as Record<PeriodKindV162, string>;

export function periodStatementV162(elementId: string | null | undefined, country: string | null | undefined = "VNM"): PeriodStatementV162 | null {
  if (!elementId || String(country || "").toUpperCase() !== periodStatementsV162.country) return null;
  const statement = ELEMENTS_V162[elementId];
  return statement ? { kind: statement.kind, label: LABELS_V162[statement.kind], text: statement.text } : null;
}

/**
 * The period as a list row carries it after the element's summary: nothing for
 * a collection point, "계획기간 …" for a plan, the span for data; null when
 * the element has no statement (the caller keeps its own period).
 */
export function listPeriodTagV162(elementId: string | null | undefined, country: string | null | undefined = "VNM"): string | null {
  const statement = periodStatementV162(elementId, country);
  if (!statement) return null;
  if (statement.kind === "reference") return "";
  return statement.kind === "plan" ? `${statement.label} ${statement.text}` : statement.text;
}
