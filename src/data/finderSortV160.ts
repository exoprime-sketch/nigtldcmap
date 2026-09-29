/**
 * V160-R (R-10): the finder's order. Every public dataset is listed; a dataset
 * not yet delivered ("not-collected") goes last, then 가나다순 by the name the
 * card shows, or 조회순 (detail views, most first; ties by name).
 */
export type FinderSortV160 = "name" | "views";

export interface FinderSortItemV160 {
  elementId: string;
  /** The name the card shows. */
  title: string;
  publicStatus?: string;
}

const COLLATOR_V160 = new Intl.Collator("ko");

export function isPreparingStatusV160(status: string | undefined): boolean {
  return status === "not-collected";
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
