/**
 * V159: highlight the chart series a '쓰는 데이터' chip points to.
 *
 * The chip only knows indicator ids; it does not know where the chart draws
 * its series. `root` is whatever container the caller's chart markup lives
 * in (each series element carries its own `data-indicator-id`), so this
 * stays decoupled from any one chart implementation.
 */
export function applyIndicatorHighlightV159(root: HTMLElement | null, ids: string[]): number {
  if (!root) return 0;
  if (ids.length > 0) {
    root.setAttribute("data-highlight-indicators", ids.join(","));
  } else {
    root.removeAttribute("data-highlight-indicators");
  }
  const idSet = new Set(ids);
  let matched = 0;
  root.querySelectorAll<HTMLElement>("[data-indicator-id]").forEach((el) => {
    // A series may stand for several indicators (space-separated ids).
    const seriesIds = (el.getAttribute("data-indicator-id") || "").split(/\s+/u).filter(Boolean);
    const isMatch = seriesIds.some((id) => idSet.has(id));
    el.classList.toggle("is-highlighted", isMatch);
    if (isMatch) matched += 1;
  });
  return matched;
}
