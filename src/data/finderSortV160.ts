/**
 * V160-R (R-10): the finder's order. Every public dataset is listed; a dataset
 * not yet delivered goes last, then 가나다순 by the name the card shows, or
 * 조회순 (detail views, most first; ties by name). "Not yet delivered" is every
 * catalogue status with no data behind it - not collected, entry planned, or
 * the input template only (V156-E: C-023, E-011, E-013, the typology's
 * data-pending set).
 */
export type FinderSortV160 = "name" | "views";

export interface FinderSortItemV160 {
  elementId: string;
  /** The name the card shows. */
  title: string;
  publicStatus?: string;
}

const COLLATOR_V160 = new Intl.Collator("ko");

const PREPARING_STATUSES_V160 = new Set(["not-collected", "data-entry-planned", "schema-only"]);

export function isPreparingStatusV160(status: string | undefined): boolean {
  return PREPARING_STATUSES_V160.has(status || "");
}

export function compareFinderItemsV160(
  left: FinderSortItemV160,
  right: FinderSortItemV160,
  mode: FinderSortV160,
  views: ReadonlyMap<string, number>
): number {
  const preparing = Number(isPreparingStatusV160(left.publicStatus)) - Number(isPreparingStatusV160(right.publicStatus));
  if (preparing !== 0) return preparing;
  if (mode === "views") {
    const difference = (views.get(right.elementId) || 0) - (views.get(left.elementId) || 0);
    if (difference !== 0) return difference;
  }
  return COLLATOR_V160.compare(left.title, right.title);
}

/**
 * V164-4: what 조회순 says while no detail view has been counted yet. The home
 * and the finder both print this sentence (the home adds what it lists in the
 * meantime, the finder how it is ordered), so a reader who picks 조회순 and
 * sees the 가나다순 order is told why instead of finding two identical lists.
 */
export const VIEWS_NOT_READY_NOTE_V164 = "조회 집계가 준비되면 조회순으로 표시합니다.";

/** True once at least one dataset has a counted view. */
export function hasCountedViewsV164(views: ReadonlyMap<string, number>): boolean {
  for (const count of views.values()) if (count > 0) return true;
  return false;
}

/**
 * The finder's line under the sort choice: only when 조회순 is the chosen order
 * and there is nothing counted to order by (no count is invented - the list is
 * then in 가나다순). Null when the order is 가나다순 or the counts exist.
 */
export function finderSortNoteV164(mode: FinderSortV160, views: ReadonlyMap<string, number>): string | null {
  if (mode !== "views" || hasCountedViewsV164(views)) return null;
  return `${VIEWS_NOT_READY_NOTE_V164} 현재는 가나다순으로 표시합니다.`;
}
