import { CLIMATE_TECHNOLOGIES, CLIMATE_TECHNOLOGY_BY_ID } from "../data/climateTechnologyCatalog";

/**
 * V153: one key per CTIS technology.
 *
 * The catalog carries the same technology in two spellings - "7" on most
 * elements and "CTIS-07" on the C-series - so the finder listed 77 options and
 * matched only the spelling an element happened to use. Every comparison goes
 * through the two-digit key ("07") instead; the source columns keep whatever
 * they say.
 */
export const TECHNOLOGY_COUNT_V153 = 38;
export const TECHNOLOGY_UNRESOLVED_V153 = "확인필요";

const CTIS_PATTERN = /^(?:ctis[-_ ]?)?0*(\d{1,2})$/iu;
const slugToCode = new Map(
  CLIMATE_TECHNOLOGIES.map((item, index) => [item.id, String(index + 1).padStart(2, "0")])
);

/** "7" | "07" | "CTIS-07" | "ctis-7" | "solar-pv" → "07"; anything else → null. */
export function normalizeTechnologyIdV153(value: unknown): string | null {
  const text = String(value ?? "").trim();
  if (!text) return null;
  const match = text.match(CTIS_PATTERN);
  if (match) {
    const number = Number(match[1]);
    if (number >= 1 && number <= TECHNOLOGY_COUNT_V153) return String(number).padStart(2, "0");
    return null;
  }
  return slugToCode.get(text) ?? null;
}

export function isTechnologyCodeV153(value: unknown): boolean {
  return normalizeTechnologyIdV153(value) !== null;
}

/** Normalized, de-duplicated and numerically sorted codes of one element. */
export function normalizeTechnologyIdsV153(ids: readonly unknown[] | null | undefined): string[] {
  const codes = new Set<string>();
  for (const id of ids || []) {
    const code = normalizeTechnologyIdV153(id);
    if (code) codes.add(code);
  }
  return [...codes].sort();
}

/** Filter options: the distinct technologies the items carry, at most 38, in code order. */
export function technologyOptionsV153(items: readonly { technologyIds: readonly string[] }[]): string[] {
  return normalizeTechnologyIdsV153(items.flatMap((item) => item.technologyIds));
}

/** True when `ids` names `selected` in any spelling; "all" (or an unknown selection) matches everything. */
export function matchesTechnologyV153(ids: readonly string[] | null | undefined, selected: string): boolean {
  if (selected === "all") return true;
  const wanted = normalizeTechnologyIdV153(selected);
  if (!wanted) return true;
  return (ids || []).some((id) => normalizeTechnologyIdV153(id) === wanted);
}

/**
 * The `technology` URL parameter as app state: slugs stay slugs (the insight
 * views key on them), any CTIS spelling becomes its two-digit code, and
 * anything else is "all". Restoring a finder selection on reload/back relies
 * on the code being accepted here.
 */
export function technologyParamV153(value: string | null | undefined): string {
  const text = String(value ?? "").trim();
  if (!text || text === "all") return "all";
  if (CLIMATE_TECHNOLOGY_BY_ID.has(text)) return text;
  return normalizeTechnologyIdV153(text) ?? "all";
}
