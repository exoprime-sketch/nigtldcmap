/**
 * V152: cluster circles and counts for clustered point sources (A-023, B-012)
 * (moved from RealMapExplorerPage).
 */
import type { Map as MapLibreMap } from "maplibre-gl";
import type { MapLayerRuntimeIdsV152 } from "./ids";

export function mountClusterLayersV152(
  map: MapLibreMap,
  { ids, color, isPrimary }: { ids: MapLayerRuntimeIdsV152; color: string; isPrimary: boolean }
): void {
  map.addLayer({
    id: ids.cluster,
    type: "circle",
    source: ids.source,
    filter: ["has", "point_count"],
    paint: {
      "circle-color": color,
      "circle-opacity": isPrimary ? 0.84 : 0.34,
      "circle-radius": [
        "step",
        ["get", "point_count"],
        isPrimary ? 17 : 11,
        100,
        isPrimary ? 22 : 14,
        750,
        isPrimary ? 29 : 18,
      ],
      "circle-stroke-color": "#ffffff",
      "circle-stroke-width": isPrimary ? 2 : 1,
    },
  });
  map.addLayer({
    id: ids.clusterCount,
    type: "symbol",
    source: ids.source,
    filter: ["has", "point_count"],
    layout: {
      "text-field": "{point_count_abbreviated}",
      // The glyph server (V150 backdrop) serves Noto Sans; MapLibre's
      // default Open Sans stack is not there and would 404 every cluster.
      "text-font": ["Noto Sans Regular"],
      "text-size": isPrimary ? 12 : 10,
    },
    paint: {
      "text-color": isPrimary ? "#ffffff" : "#284b3e",
      "text-opacity": isPrimary ? 1 : 0.72,
    },
  });
}
