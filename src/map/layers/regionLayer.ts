/**
 * V152: region-shaped layers that are not a plain choropleth (moved from
 * RealMapExplorerPage):
 * - regional-scope (D-018): participation areas as dashed, faint polygons plus
 *   verified activity sites as symbols;
 * - D-008 as a context layer: one statistical representative point per
 *   province, sized by budget - never a project location.
 */
import type { Map as MapLibreMap } from "maplibre-gl";
import type { MapLayerRuntimeIdsV152 } from "./ids";
import { MAP_ICON_BADGE_V152, mapIconImageIdV152 } from "../../data/map/mapIconsV152";
import { ensurePublicPointSymbolImageV129 } from "./symbols";
import type { ChoroplethCollectionV151 } from "./types";

/** D-008 context circles; returns the layer that takes pointer events. */
export function mountBudgetContextLayersV152(
  map: MapLibreMap,
  {
    ids,
    color,
    choropleth,
  }: { ids: MapLayerRuntimeIdsV152; color: string; choropleth: ChoroplethCollectionV151 | null }
): string {
  const valueRadius =
    choropleth && choropleth.minimum !== choropleth.maximum
      ? ([
          "interpolate",
          ["linear"],
          ["to-number", ["get", "value"]],
          choropleth.minimum,
          7,
          choropleth.maximum,
          20,
        ] as any)
      : 12;
  map.addLayer({
    id: ids.point,
    type: "circle",
    source: ids.source,
    paint: {
      "circle-color": color,
      "circle-radius": valueRadius,
      "circle-opacity": 0.58,
      "circle-stroke-color": "#ffffff",
      "circle-stroke-width": 2,
    },
  });
  map.addLayer({
    id: ids.pointHit,
    type: "circle",
    source: ids.source,
    paint: {
      "circle-color": "#000000",
      "circle-radius": ["max", valueRadius, 14] as any,
      "circle-opacity": 0.001,
    },
  });
  map.addLayer({
    id: ids.selection,
    type: "circle",
    source: ids.source,
    filter: ["==", ["get", "selectionKey"], "__none__"],
    paint: {
      "circle-color": "rgba(0,0,0,0)",
      "circle-radius": ["+", valueRadius, 4] as any,
      "circle-stroke-color": "#f0a51a",
      "circle-stroke-width": 3.5,
    },
  });
  return ids.pointHit;
}

/** D-018 participation areas and activity sites; both take pointer events. */
export function mountRegionalScopeLayersV152(
  map: MapLibreMap,
  { ids, color, isPrimary, icons = false }: { ids: MapLayerRuntimeIdsV152; color: string; isPrimary: boolean; icons?: boolean }
): { interactiveLayerId: string; additionalInteractiveLayerId: string } {
  const scopeFilter = [
    "==",
    ["get", "geometryRole"],
    "regional-scope",
  ] as any;
  const activityFilter = [
    "==",
    ["get", "geometryRole"],
    "activity-site",
  ] as any;
  map.addLayer({
    id: ids.fill,
    type: "fill",
    source: ids.source,
    filter: scopeFilter,
    paint: {
      "fill-color": color,
      "fill-opacity": isPrimary ? 0.2 : 0.08,
    },
  });
  map.addLayer({
    id: ids.outline,
    type: "line",
    source: ids.source,
    filter: scopeFilter,
    paint: {
      "line-color": color,
      "line-width": isPrimary ? 2.6 : 1.8,
      "line-opacity": isPrimary ? 0.92 : 0.58,
      "line-dasharray": [3, 2],
    },
  });
  if (icons) {
    // V152: verified activity sites as the same white badge + glyph as every point layer.
    const stops = (isPrimary ? MAP_ICON_BADGE_V152.radius.primary : MAP_ICON_BADGE_V152.radius.context).flatMap(
      ([zoom, radius]) => [zoom, radius]
    );
    map.addLayer({
      id: ids.point,
      type: "circle",
      source: ids.source,
      filter: activityFilter,
      paint: {
        "circle-color": "#ffffff",
        "circle-radius": ["interpolate", ["linear"], ["zoom"], ...stops] as any,
        "circle-opacity": isPrimary ? 1 : 0.82,
        "circle-stroke-color": color,
        "circle-stroke-width": isPrimary ? MAP_ICON_BADGE_V152.ring.primary : MAP_ICON_BADGE_V152.ring.context,
      },
    });
    map.addLayer({
      id: ids.pointSymbol,
      type: "symbol",
      source: ids.source,
      filter: activityFilter,
      layout: {
        "icon-allow-overlap": true,
        "icon-ignore-placement": true,
        "icon-image": mapIconImageIdV152("world"),
        "icon-size": [
          "interpolate",
          ["linear"],
          ["zoom"],
          ...MAP_ICON_BADGE_V152.iconSize.flatMap(([zoom, size]) => [zoom, isPrimary ? size : Number((size * 0.82).toFixed(3))]),
        ] as any,
      },
      paint: { "icon-opacity": isPrimary ? 1 : 0.8 },
    });
  } else {
    map.addLayer({
      id: ids.point,
      type: "circle",
      source: ids.source,
      filter: activityFilter,
      paint: {
        "circle-color": color,
        "circle-radius": isPrimary ? 7 : 4.5,
        "circle-opacity": 0,
        "circle-stroke-color": "#ffffff",
        "circle-stroke-width": isPrimary ? 2 : 1,
      },
    });
    const regionalActivitySymbolId = "cdp-v133-d018-activity-diamond";
    ensurePublicPointSymbolImageV129(
      map,
      regionalActivitySymbolId,
      "diamond",
      color
    );
    map.addLayer({
      id: ids.pointSymbol,
      type: "symbol",
      source: ids.source,
      filter: activityFilter,
      layout: {
        "icon-allow-overlap": true,
        "icon-image": regionalActivitySymbolId,
        "icon-size": isPrimary ? 1 : 0.78,
      },
      paint: { "icon-opacity": isPrimary ? 0.96 : 0.64 },
    });
  }
  map.addLayer({
    id: ids.pointHit,
    type: "circle",
    source: ids.source,
    filter: activityFilter,
    paint: {
      "circle-color": "#000000",
      "circle-radius": 14,
      "circle-opacity": 0.001,
    },
  });
  map.addLayer({
    id: ids.pointSelection,
    type: "circle",
    source: ids.source,
    filter: ["==", ["get", "selectionKey"], "__none__"],
    paint: icons
      ? {
          // V152: a ring around the badge, so the glyph stays visible when selected.
          "circle-color": "rgba(0,0,0,0)",
          "circle-radius": ["interpolate", ["linear"], ["zoom"], 5, isPrimary ? 14.5 : 13.5, 9, isPrimary ? 17.5 : 15.5] as any,
          "circle-stroke-color": "#f0a51a",
          "circle-stroke-width": 3.5,
        }
      : {
          "circle-color": color,
          "circle-radius": isPrimary ? 10 : 8,
          "circle-opacity": 1,
          "circle-stroke-color": "#f0a51a",
          "circle-stroke-width": 4,
        },
  });
  map.addLayer({
    id: ids.selection,
    type: "line",
    source: ids.source,
    filter: ["==", ["get", "selectionKey"], "__none__"],
    paint: {
      "line-color": "#f0a51a",
      "line-width": isPrimary ? 4 : 3,
      "line-opacity": 1,
    },
  });
  return { interactiveLayerId: ids.fill, additionalInteractiveLayerId: ids.pointHit };
}
