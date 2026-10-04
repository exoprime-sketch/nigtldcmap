/**
 * V164-4: the descriptive line under a header-search result.
 *
 * It used to print the first two measure labels of the visualization contract
 * as they are - including labels that name the build's own structure
 * ("…(ADM1 단위 개체 목록)", "…(관구×시나리오×연도 개체 목록)", "…(ADM1, GADM 4.1)"),
 * a label cut off inside its bracket ("…미수록(리튬 · 확인 · 2026년") and the
 * same label twice. A label that is not fit to read is left out; when none is
 * left the group name is shown, never an invented text.
 */
const INTERNAL_LABEL_TERMS_V164 = /\bADM\s?\d\b|\bGADM\b|개체\s?목록|관구|_|\bundefined\b|\bnull\b/iu;

function bracketsBalancedV164(label: string): boolean {
  let depth = 0;
  for (const char of label) {
    if (char === "(" || char === "（") depth += 1;
    else if (char === ")" || char === "）") {
      depth -= 1;
      if (depth < 0) return false;
    }
  }
  return depth === 0;
}

/** True when a measure label can be shown to a reader as written. */
export function isReadableMeasureLabelV164(label: string | null | undefined): boolean {
  const text = String(label ?? "").trim();
  if (!text) return false;
  if (INTERNAL_LABEL_TERMS_V164.test(text)) return false;
  return bracketsBalancedV164(text);
}

/** The readable measure labels, once each, in their order. */
export function readableMeasureLabelsV164(labels: readonly string[] | null | undefined): string[] {
  const seen = new Set<string>();
  const kept: string[] = [];
  for (const label of labels || []) {
    if (!isReadableMeasureLabelV164(label)) continue;
    const text = String(label).trim();
    const key = text.replace(/\s+/gu, "").toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    kept.push(text);
  }
  return kept;
}

/** At most `limit` readable labels joined, else the group name. */
export function searchResultLineV164(
  labels: readonly string[] | null | undefined,
  groupLabel: string,
  limit = 2
): string {
  const readable = readableMeasureLabelsV164(labels).slice(0, limit);
  return readable.length > 0 ? readable.join(" · ") : groupLabel;
}
