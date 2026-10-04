/**
 * V164-4: finder / download filter helpers shared by the two pages.
 *
 * Kept free of React so the rules (what a reset keeps, where the category names
 * come from) are unit-tested instead of read off the page.
 */

/** What "검색조건 초기화" puts back; the country is the reader's own choice and stays. */
export interface FinderResetValuesV164 {
  query: string;
  countryIso3: string;
  category: "all";
  group: null;
  sourceOrganization: "all";
  technologyId: "all";
  year: "all";
  delivery: "all";
  user: "all";
  type: "all";
}

/**
 * The reset clears every search condition except the country. A reader on the
 * 방글라데시 page who resets must stay on 방글라데시: the country is the page's
 * scope (it is in the address and the header), not one of the conditions typed
 * into the panel, and "전체" would mix in another country's datasets.
 */
export function finderResetValuesV164(currentCountryIso3: string): FinderResetValuesV164 {
  return {
    query: "",
    countryIso3: currentCountryIso3,
    category: "all",
    group: null,
    sourceOrganization: "all",
    technologyId: "all",
    year: "all",
    delivery: "all",
    user: "all",
    type: "all",
  };
}

export interface CategoryOptionV164 {
  code: string;
  label: string;
}

/**
 * One option per 대분류 present in the catalogue, named as the catalogue names it.
 *
 * The catalogue's category label is what the card path ("국가 기본 정보 › …"),
 * the detail header and the download filter print, so the finder's filter reads
 * the same label instead of the older taxonomy file's wording ("기후·환경",
 * "협력사업·이행"). Codes are ordered A, B, C, …; the first item of a code
 * names it.
 */
export function categoryOptionsV164(items: ReadonlyArray<{ categoryCode: string; categoryLabel: string }>): CategoryOptionV164[] {
  const labels = new Map<string, string>();
  for (const item of items) {
    const code = String(item.categoryCode ?? "").trim();
    if (!code || labels.has(code)) continue;
    labels.set(code, String(item.categoryLabel ?? "").trim() || code);
  }
  return [...labels.entries()]
    .sort(([left], [right]) => left.localeCompare(right, "en"))
    .map(([code, label]) => ({ code, label }));
}
