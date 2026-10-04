import type { CardSummaryV140 } from "./cardSummariesV140";

/**
 * V164-4: wording of the finder / home card summaries that the pre-built
 * summary files (public/data/**\/home/card-summaries-v140.json) cannot be asked
 * to carry - the files are generated and are not edited by hand, so what a
 * number counts is stated where the card is drawn.
 */

/** "984 건" reads "984건": a count and its unit are written together (as "76건" already is). */
export function headlineSpacingV164(value: string | null | undefined): string {
  return String(value ?? "").replace(/(\d)\s+(건|곳|개소|개)(?=$|[\s·])/gu, "$1$2");
}

/**
 * Unit spellings written the way a reader sees them in print: "m2" as "m²",
 * "CO2" as "CO₂". Both countries' cards read the same (Viet Nam's reviewed
 * summaries already carry the subscript forms; Bangladesh's carry the keyed
 * ones).
 */
export function publicUnitSpellingV164(text: string | null | undefined): string {
  return String(text ?? "")
    .replace(/(^|[^A-Za-z0-9])(k?m)2(?![A-Za-z0-9])/gu, "$1$2²")
    .replace(/(^|[^A-Za-z0-9])(k?m)3(?![A-Za-z0-9])/gu, "$1$2³")
    .replace(/CO2(?![0-9])/gu, "CO₂")
    .replace(/CH4(?![0-9])/gu, "CH₄")
    .replace(/N2O(?![A-Za-z0-9])/gu, "N₂O");
}

/**
 * The whole number a headline states as a count ("379건", "5곳", "1,234 건"),
 * or null when the headline is an amount, a share or anything else.
 */
export function headlineCountV164(value: string | null | undefined): number | null {
  const match = String(value ?? "").trim().match(/^(\d[\d,]*)\s*(?:건|곳|개소|개)$/u);
  if (!match) return null;
  const count = Number(match[1].replace(/,/gu, ""));
  return Number.isFinite(count) ? count : null;
}

/**
 * The line after a facts card's listed rows.
 *
 * The card lists a few names and says how many more there are. Two things made
 * the sum fail: the rows a card drops from the list (a source's own
 * "자료 공표 상태" note) were not counted among "the rest", and the file's
 * `more` counts names while the headline counts source rows (a name that
 * repeats - one region in several years of several series - is one name, many
 * rows). So the rest is counted with the dropped rows; when listed + rest still
 * does not reach the headline, the line says it counts names and gives the
 * headline's own total.
 */
export function factsMoreNoteV164(headlineValue: string, listed: number, dropped: number, more: number): string | null {
  const rest = Math.max(0, more) + Math.max(0, dropped);
  if (rest <= 0) return null;
  const total = headlineCountV164(headlineValue);
  if (total === null || listed + rest === total) return `외 ${rest}건은 상세에서`;
  return `이름 기준 외 ${rest}개 (전체 ${String(headlineValue).trim()}, 상세에서 확인)`;
}

/**
 * What an amount-or-share card's figure is, when the same dataset lists more
 * entities than that figure covers. The headline is one series of the dataset
 * ("Adaptation Fund 승인액 합계") while the detail page counts every entity of
 * the dataset (119건 across four funds): the card says so instead of leaving
 * the two numbers to be read as one.
 */
export function levelScopeNoteV164(summary: CardSummaryV140): string | null {
  if (summary.kind !== "level") return null;
  const provenance = summary.provenance;
  if (!provenance) return null;
  const entities = Number(provenance.entityCount ?? 0);
  const headlineIds = provenance.headlineIndicatorIds ?? [];
  const allIds = provenance.indicatorIds ?? [];
  if (!(entities > 0) || headlineIds.length === 0 || headlineIds.length >= allIds.length) return null;
  // A headline that is itself the count of entities needs no scope.
  if (headlineCountV164(summary.headline?.value) !== null) return null;
  return `위 계열 하나의 값입니다 · 같은 자료의 전체 ${entities.toLocaleString("ko-KR")}건은 상세에서`;
}
