/**
 * V157: a geometry asset drawn straight onto the map (A-028).
 *
 * The asset mixes polygons (dams, reservoirs) with points (ports), so both are
 * mounted from one source with their own style layers, and both take pointer
 * events: a reader who clicks a reservoir must get that reservoir, not the
 * nearest port. A context layer keeps its outline and its points but is not
 * filled, the same rule the province choropleth follows.
 */
import type { Map as MapLibreMap } from "maplibre-gl";
import type { MapLayerRuntimeIdsV152 } from "./ids";

export function mountAssetFeatureLayersV157(
  map: MapLibreMap,
  {
    ids,
    color,
    isPrimary,
    roleOpacity,
    fillColor,
    hasPolygons,
    hasPoints,
  }: {
    ids: MapLayerRuntimeIdsV152;
    color: string;
    isPrimary: boolean;
    roleOpacity: number;
    /** Categorical colour when the asset states a kind, else the layer colour. */
    fillColor: any;
    hasPolygons: boolean;
    hasPoints: boolean;
  }
): { interactiveLayerId: string; additionalInteractiveLayerId?: string } {
  const interactiveIds: string[] = [];
  if (hasPolygons) {
    map.addLayer({
      id: ids.fill,
      type: "fill",
      source: ids.source,
      filter: ["match", ["geometry-type"], ["Polygon", "MultiPolygon"], true, false],
      paint: {
        "fill-color": fillColor ?? color,
        "fill-opacity": isPrimary ? 0.55 : 0.18,
      },
    });
    map.addLayer({
      id: ids.outline,
      type: "line",
      source: ids.source,
      filter: ["match", ["geometry-type"], ["Polygon", "MultiPolygon"], true, false],
      paint: {
        "line-color": isPrimary ? "#3c5a4e" : color,
        "line-width": isPrimary ? 1.1 : 1.6,
        "line-opacity": isPrimary ? 0.85 : 0.7,
      },
    });
    interactiveIds.push(ids.fill);
  }
  if (hasPoints) {
    map.addLayer({
      id: ids.point,
      type: "circle",
      source: ids.source,
      filter: ["match", ["geometry-type"], ["Point", "MultiPoint"], true, false],
      paint: {
        "circle-color": fillColor ?? color,
        "circle-radius": ["interpolate", ["linear"], ["zoom"], 5, 2.6, 9, 4.4, 13, 6.4],
        "circle-stroke-color": "#ffffff",
        "circle-stroke-width": isPrimary ? 1 : 0.6,
        "circle-opacity": roleOpacity,
      },
    });
    // A wider transparent circle so a small port is clickable at low zoom.
    map.addLayer({
      id: ids.pointHit,
      type: "circle",
      source: ids.source,
      filter: ["match", ["geometry-type"], ["Point", "MultiPoint"], true, false],
      paint: {
        "circle-color": "#000000",
        "circle-radius": 12,
        "circle-opacity": 0.001,
      },
    });
    interactiveIds.push(ids.pointHit);
  }
  map.addLayer({
    id: ids.selection,
    type: "line",
    source: ids.source,
    filter: ["==", ["get", "selectionKey"], "__none__"],
    paint: {
      "line-color": "#f0a51a",
      "line-width": 3.4,
      "line-opacity": 1,
    },
  });
  map.addLayer({
    id: ids.pointSelection,
    type: "circle",
    source: ids.source,
    filter: ["==", ["get", "selectionKey"], "__none__"],
    paint: {
      "circle-color": "rgba(0, 0, 0, 0)",
      "circle-radius": 9,
      "circle-stroke-color": "#f0a51a",
      "circle-stroke-width": 3,
    },
  });
  return {
    interactiveLayerId: interactiveIds[0] ?? ids.fill,
    additionalInteractiveLayerId: interactiveIds[1],
  };
}

/**
 * The unit choropleth's layers: filled areas, an outline, a hit layer for a
 * context layer and the selection outline. Separate from the province version
 * because these units are not provinces and never carry the 34-unit outline.
 */
export function mountUnitChoroplethLayersV157(
  map: MapLibreMap,
  {
    ids,
    color,
    isPrimary,
    contextIndex,
    fillColor,
  }: {
    ids: MapLayerRuntimeIdsV152;
    color: string;
    isPrimary: boolean;
    contextIndex: number;
    fillColor: any;
  }
): string {
  let interactiveLayerId = ids.fill;
  map.addLayer({
    id: ids.fill,
    type: "fill",
    source: ids.source,
    paint: {
      "fill-color": fillColor,
      "fill-opacity": isPrimary ? 0.72 : 0,
    },
  });
  map.addLayer({
    id: ids.outline,
    type: "line",
    source: ids.source,
    paint: {
      "line-color": isPrimary ? "#4a6158" : color,
      "line-width": isPrimary ? 0.5 : contextIndex === 0 ? 2.4 : 1.4,
      "line-opacity": isPrimary ? 0.6 : 0.8,
      ...(isPrimary ? {} : { "line-dasharray": contextIndex === 0 ? [1, 1.5] : [4, 2] }),
    },
  });
  if (!isPrimary) {
    map.addLayer({
      id: ids.lineHit,
      type: "line",
      source: ids.source,
      paint: { "line-color": "#000000", "line-width": 14, "line-opacity": 0.001 },
    });
    interactiveLayerId = ids.lineHit;
  }
  map.addLayer({
    id: ids.selection,
    type: "line",
    source: ids.source,
    filter: ["==", ["get", "selectionKey"], "__none__"],
    paint: { "line-color": "#f0a51a", "line-width": 3, "line-opacity": 1 },
  });
  return interactiveLayerId;
}
