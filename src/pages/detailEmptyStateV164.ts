/**
 * V164-3 (WP-F): when a detail page with no rows adds its own "표시할 자료가
 * 없습니다" block.
 *
 * A dataset not yet delivered already says so once: the analysis area carries the
 * template's "데이터 준비 중 — 자료가 입고되면 분석 화면을 제공합니다." notice
 * (typology.statusNotice), and a catalogue status of not-collected,
 * entry-planned or schema-only is the same state (V162). BGD C-023, D-001, D-002,
 * D-004 and E-013 showed that notice and, under it, the generic empty-state box
 * - two statements of one fact. The box is only for a page that has no notice.
 */
export function showsEmptyStateBlockV164(state: {
  observationCount: number;
  entityCount: number;
  /** The catalogue status says the dataset is not delivered yet (isPreparingStatusV160). */
  preparing: boolean;
  /** The analysis area already states the data-pending (or other) notice. */
  hasStatusNotice: boolean;
}): boolean {
  return state.observationCount === 0 && state.entityCount === 0 && !state.preparing && !state.hasStatusNotice;
}
