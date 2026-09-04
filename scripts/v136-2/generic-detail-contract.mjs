/**
 * What a generic detail screen may and may not say.
 *
 * The bespoke analyses for a handful of elements were written by hand. Every
 * other element falls through to one shared renderer, and that renderer had
 * been printing the shape of the store - a column key, a list of category
 * codes, the name of the aggregation it performed - because no gate had ever
 * looked at a screen it produced.
 */

/** Store-side words for a value, a row, or the table it came from. */
export const PUBLIC_MEASUREMENT_TERMS_V136_2 = Object.freeze(["측정항목"]);
export const PUBLIC_RECORD_TERMS_V136_2 = Object.freeze(["레코드"]);
export const PUBLIC_RAW_TABLE_TERMS_V136_2 = Object.freeze([
  "원자료 표",
  "전체 원자료",
  "원자료 보기",
]);

/**
 * Wording that describes how a number was computed rather than what it means.
 * A reader wants the commitment total; that it was reached by adding rows up
 * is a fact about our code.
 */
export const INTERNAL_AGGREGATION_COPY_V136_2 = Object.freeze([
  "단순합",
  "단순 합",
  "합계 산출",
  "집계 방식",
  "가중평균 미적용",
]);

/**
 * A KPI support line carries the unit, the year, and at most a couple of
 * dimensions a reader recognises. More than this is a dump of whatever the row
 * happened to be keyed by.
 */
export const KPI_SUPPORT_MAX_SEGMENTS_V136_2 = 5;

/**
 * How many dimensions a KPI card may name. The card has three lines; past two
 * dimensions it has stopped adding context and started listing keys.
 */
export const KPI_MAX_DIMENSIONS_V136_2 = 2;

/** Identifier-shaped text that is a stored key, not a name for a reader. */
export const IDENTIFIER_LABEL_PATTERN_V136_2 =
  "^[A-Za-z][A-Za-z0-9]*(?:[_-][A-Za-z0-9]+)*$";

/** The five launch screenshots this phase adds. */
export const GENERIC_DETAIL_SHOTS_V136_2 = Object.freeze([
  "detail-generic-portfolio.png",
  "detail-generic-multimeasure.png",
  "detail-generic-evidence.png",
  "detail-generic-entity-list.png",
  "detail-generic-mobile.png",
]);
