/**
 * The vocabulary and structural baseline for the V136.1 launch polish.
 *
 * These lists describe the release process, not the data. A reader who came for
 * Vietnam's grid or forest loss has no use for the word that names the build
 * that shipped it, so none of them belongs on a public screen. Words a reader
 * genuinely needs - a unit, a source name, an explained missing value - are
 * deliberately absent.
 */

/** Names for the act of publishing, rather than for anything published. */
export const RELEASE_TERMS_V136_1 = Object.freeze([
  "릴리스",
  "release",
  "배포판",
  "빌드",
]);

/** Names for how the release was checked before it shipped. */
export const ACCEPTANCE_TEST_TERMS_V136_1 = Object.freeze([
  "수용검사",
  "검증값",
  "acceptance",
  "회귀 테스트",
]);

/**
 * Store-side words for a value. The public chrome says 데이터, 항목 or 행;
 * the element renderers keep their own column headings, which name the data.
 */
export const MEASUREMENT_TERMS_V136_1 = Object.freeze([
  "측정항목",
  "레코드",
  "공간 커버리지",
  "공간표현",
]);

/**
 * Structure frozen at the start of this phase. The polish is editorial, so any
 * movement here means a tab or a route was added, which this phase forbids.
 */
export const BASELINE_PUBLIC_NAV_V136_1 = 3;
export const BASELINE_PUBLIC_VIEWS_V136_1 = 11;

/** Widths a public screen is checked at, smallest phone to widest desktop. */
export const UAT_VIEWPORTS_V136_1 = Object.freeze([390, 768, 1024, 1440, 1920]);

/**
 * One element per analysis family, so the sweep meets every shared detail
 * chrome without re-rendering all 152.
 */
export const UAT_DETAIL_ELEMENTS_V136_1 = Object.freeze([
  "A-002",
  "A-016",
  "A-023",
  "B-005",
  "B-021",
  "B-033",
  "C-002",
  "C-016",
  "D-011",
  "D-018",
  "E-008",
  "E-012",
]);
