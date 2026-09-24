/**
 * V152: province choropleth layers (63, 34 or six-region features) - fill,
 * outline, a hit line for context layers and the selection outline (moved from
 * RealMapExplorerPage).
 */
import type { Map as MapLibreMap } from "maplibre-gl";
import type { MapLayerRuntimeIdsV152 } from "./ids";
import type { ChoroplethCollectionV151 } from "./types";

/** Missing provinces stay transparent; values run from pale green to the layer colour. */
export function choroplethFillColorV152(
  color: string,
  choropleth: ChoroplethCollectionV151 | null,
  isRegionalScope: boolean
): any {
  return isRegionalScope
    ? color
    : choropleth
    ? ([
        "case",
        ["==", ["get", "hasValue"], false],
        "rgba(0, 0, 0, 0)",
        choropleth.minimum === choropleth.maximum
          ? color
          : [
              "interpolate",
              ["linear"],
              ["to-number", ["get", "value"]],
              choropleth.minimum,
              "#e6f2ea",
              choropleth.maximum,
              color,
            ],
      ] as any)
    : color;
}

/**
 * The primary choropleth is filled; a context choropleth is only an outline
 * (dotted for the first context layer, dashed for the next) with a hit line.
 * Returns the layer that takes pointer events.
 */
export function mountChoroplethLayersV152(
  map: MapLibreMap,
  {
    ids,
    color,
    isPrimary,
    contextIndex,
    fillColor,
  }: { ids: MapLayerRuntimeIdsV152; color: string; isPrimary: boolean; contextIndex: number; fillColor: any }
): string {
  let interactiveLayerId = ids.fill;
  map.addLayer({
    id: ids.fill,
    type: "fill",
    source: ids.source,
    paint: {
      "fill-color": fillColor,
      "fill-opacity": isPrimary ? 0.76 : 0,
    },
  });
  map.addLayer({
    id: ids.outline,
    type: "line",
    source: ids.source,
    paint: {
      "line-color": isPrimary ? "#48665a" : color,
      "line-width": isPrimary
        ? 0.95
        : contextIndex === 0
        ? 3.4
        : 1.8,
      "line-opacity": isPrimary
        ? 0.82
        : contextIndex === 0
        ? 0.55
        : 0.88,
      ...(isPrimary
        ? {}
        : {
            "line-dasharray":
              contextIndex === 0 ? [1, 1.5] : [4, 2],
          }),
    },
  });
  if (!isPrimary) {
    map.addLayer({
      id: ids.lineHit,
      type: "line",
      source: ids.source,
      paint: {
        "line-color": "#000000",
        "line-width": 14,
        "line-opacity": 0.001,
      },
    });
    interactiveLayerId = ids.lineHit;
  }
  map.addLayer({
    id: ids.selection,
    type: "line",
    source: ids.source,
    filter: ["==", ["get", "selectionKey"], "__none__"],
    paint: {
      "line-color": "#f0a51a",
      "line-width": isPrimary ? 3.4 : 4.2,
      "line-opacity": 1,
    },
  });
  return interactiveLayerId;
}
