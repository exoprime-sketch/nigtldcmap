import type { DisplayTypeV159 } from "../spec/specTypesV159";
import { decisionPointsV159 } from "./decisionPointsV159";
import type { DecisionPointsOptsV159, DecisionPointV159 } from "./decisionPointsV159";
import type { S2RegionObservationV159, StructureRowsV159 } from "./structureTypesV159";

/**
 * V164-3 (WP-F): the 판단 포인트 a detail page shows, read from the data the
 * page's own body draws.
 *
 * - `drawnIndicatorIds` (the series the body chart draws, read from the rendered
 *   `data-indicator-id` attributes) is passed through, so the card and the chart
 *   name the same series.
 * - A province-level screen (U2) whose map layer is loaded reads that layer first:
 *   the layer is what the body's map and region bars draw, and the pack's own
 *   rows are the fallback when the layer yields no points.
 */
export function decisionPointsForPageV164(
  displayType: DisplayTypeV159,
  rows: StructureRowsV159,
  opts: DecisionPointsOptsV159,
  layerRows: readonly S2RegionObservationV159[] = []
): DecisionPointV159[] {
  if (displayType === "U2" && layerRows.length > 0) {
    const fromLayer = decisionPointsV159(
      "U2",
      { structure: "S2", rows: [...layerRows] },
      { countryIso3: opts.countryIso3, drawnIndicatorIds: opts.drawnIndicatorIds, asOfDate: opts.asOfDate }
    );
    if (fromLayer.length > 0) return fromLayer;
  }
  return decisionPointsV159(displayType, rows, opts);
}
