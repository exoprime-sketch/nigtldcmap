/**
 * V164-R3: where a chart writes its own labels.
 *
 * Two places drew a label on top of something else:
 *
 * - The year marked in a time-series chart ("선택 2025년") was written to the
 *   right of its dotted line inside the clipped plot. For the newest year the
 *   line stands at the right edge, so the label was cut off and a stray dot of
 *   its first glyph stayed beside the line.
 * - A scatter writes one name beside each point. Points that sit close together
 *   (관리자 / 군인, 기계조작 / 기능원) put their names on top of each other, and
 *   the name of the point at the right edge ran out of the drawing.
 *
 * Both are layout only: nothing here changes a plotted value.
 */

/** Width of a text in px: a Hangul or other wide glyph is one em, a digit about 0.58 em, other Latin about 0.55 em. */
export function estimateLabelWidthV164(text: string, fontSize: number): number {
  return Array.from(String(text ?? "")).reduce((width, character) => {
    if (/\s/u.test(character)) return width + fontSize * 0.3;
    if (/[0-9]/u.test(character)) return width + fontSize * 0.58;
    if (/[.,:;'`|!]/u.test(character)) return width + fontSize * 0.3;
    if (/[\x20-\x7e]/u.test(character)) return width + fontSize * 0.58;
    return width + fontSize;
  }, 0);
}

export interface MarkedLabelPlacementV164 {
  x: number;
  anchor: "start" | "end";
}

/**
 * The label of a marked x position: to the right of its line while it fits
 * inside the plot, else to the left of it, else pinned to the plot's right edge.
 */
export function markedLabelPlacementV164({
  lineX,
  labelWidth,
  plotLeft,
  plotRight,
  gap = 6,
}: {
  lineX: number;
  labelWidth: number;
  plotLeft: number;
  plotRight: number;
  gap?: number;
}): MarkedLabelPlacementV164 {
  if (lineX + gap + labelWidth <= plotRight) return { x: lineX + gap, anchor: "start" };
  if (lineX - gap - labelWidth >= plotLeft) return { x: lineX - gap, anchor: "end" };
  return { x: Math.max(plotLeft, plotRight - labelWidth), anchor: "start" };
}

export interface ScatterLabelInputV164 {
  id: string;
  /** The point's centre. */
  x: number;
  y: number;
  text: string;
}

export interface ScatterLabelPlacementV164 {
  id: string;
  /** The text's anchor point: its start, middle or end by `anchor`, on the baseline. */
  x: number;
  y: number;
  anchor: "start" | "middle" | "end";
  /** The box the text covers, for a caller that wants to check or draw it. */
  box: BoxV164;
  /** True when no free spot was left and the least crowded one was taken. */
  crowded: boolean;
}

export interface BoxV164 {
  left: number;
  top: number;
  right: number;
  bottom: number;
}

function overlapAreaV164(a: BoxV164, b: BoxV164): number {
  const width = Math.min(a.right, b.right) - Math.max(a.left, b.left);
  const height = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top);
  return width > 0 && height > 0 ? width * height : 0;
}

/**
 * One label per point, each in the first of eight places around its point that
 * is inside `bounds` and covers neither another label nor another point: right,
 * left, then above and below the point (right-aligned, left-aligned, centred).
 * Points are served from the top down, so the label of a crowded cluster takes
 * the free side and the next one the side after it. When every place is taken
 * the one with the least overlap is used and the placement says `crowded`.
 */
export function placeScatterLabelsV164(
  points: ScatterLabelInputV164[],
  {
    bounds,
    fontSize = 11.5,
    radius = 6,
    gap = 4,
  }: { bounds: BoxV164; fontSize?: number; radius?: number; gap?: number }
): ScatterLabelPlacementV164[] {
  const height = fontSize * 1.15;
  const pointBoxes = points.map((point) => ({
    left: point.x - radius - 1,
    right: point.x + radius + 1,
    top: point.y - radius - 1,
    bottom: point.y + radius + 1,
  }));
  const placed: ScatterLabelPlacementV164[] = [];
  const byIndex: ScatterLabelPlacementV164[] = new Array(points.length);
  const order = points.map((_, index) => index).sort((a, b) => points[a].y - points[b].y || points[a].x - points[b].x);
  for (const index of order) {
    const point = points[index];
    const width = estimateLabelWidthV164(point.text, fontSize);
    const baselineMiddle = point.y + fontSize * 0.35;
    const candidates: Array<{ x: number; y: number; anchor: ScatterLabelPlacementV164["anchor"] }> = [
      { x: point.x + radius + gap, y: baselineMiddle, anchor: "start" },
      { x: point.x - radius - gap, y: baselineMiddle, anchor: "end" },
      { x: point.x + radius * 0.5, y: point.y - radius - gap, anchor: "start" },
      { x: point.x - radius * 0.5, y: point.y - radius - gap, anchor: "end" },
      { x: point.x + radius * 0.5, y: point.y + radius + gap + fontSize * 0.85, anchor: "start" },
      { x: point.x - radius * 0.5, y: point.y + radius + gap + fontSize * 0.85, anchor: "end" },
      { x: point.x, y: point.y - radius - gap, anchor: "middle" },
      { x: point.x, y: point.y + radius + gap + fontSize * 0.85, anchor: "middle" },
    ];
    let best: { placement: ScatterLabelPlacementV164; penalty: number } | null = null;
    for (const candidate of candidates) {
      const left = candidate.anchor === "start" ? candidate.x : candidate.anchor === "end" ? candidate.x - width : candidate.x - width / 2;
      const box: BoxV164 = { left, right: left + width, top: candidate.y - fontSize * 0.85, bottom: candidate.y - fontSize * 0.85 + height };
      const outside =
        Math.max(0, bounds.left - box.left) +
        Math.max(0, box.right - bounds.right) +
        Math.max(0, bounds.top - box.top) +
        Math.max(0, box.bottom - bounds.bottom);
      const onLabels = placed.reduce((sum, other) => sum + overlapAreaV164(box, other.box), 0);
      const onPoints = pointBoxes.reduce((sum, other, otherIndex) => sum + (otherIndex === index ? 0 : overlapAreaV164(box, other)), 0);
      const penalty = outside * 40 + onLabels * 4 + onPoints * 4;
      const placement: ScatterLabelPlacementV164 = { id: point.id, x: candidate.x, y: candidate.y, anchor: candidate.anchor, box, crowded: penalty > 0 };
      if (penalty === 0) {
        best = { placement, penalty };
        break;
      }
      if (!best || penalty < best.penalty) best = { placement, penalty };
    }
    placed.push(best!.placement);
    byIndex[index] = best!.placement;
  }
  // In the order the points were given.
  return byIndex;
}
