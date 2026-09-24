/**
 * V152: line layers (A-024 transmission network) - lines coloured and sized by
 * voltage, an invisible wide hit line and the selection line (moved from
 * RealMapExplorerPage).
 */
import type { Map as MapLibreMap } from "maplibre-gl";
import type { MapLayerRuntimeIdsV152 } from "./ids";

/** Transmission voltage classes and colours: the big map, the mini map and every legend read these. */
export const TRANSMISSION_VOLTAGE_CLASSES_V152 = [
  { kv: 110, color: "#e59b32" },
  { kv: 220, color: "#d35a3d" },
  { kv: 500, color: "#8b2635" },
] as const;

/** Adds the line layers to an existing source; returns the layer that takes pointer events. */
export function mountLineLayersV152(
  map: MapLibreMap,
  {
    ids,
    color,
    isPrimary,
    roleOpacity,
  }: { ids: MapLayerRuntimeIdsV152; color: string; isPrimary: boolean; roleOpacity: number }
): string {
  const voltageWidth = isPrimary
    ? ([
        "interpolate",
        ["linear"],
        ["zoom"],
        4,
        [
          "match",
          ["get", "voltageKv"],
          110,
          1.5,
          220,
          2.2,
          500,
          3,
          1.3,
        ],
        9,
        [
          "match",
          ["get", "voltageKv"],
          110,
          3,
          220,
          4.2,
          500,
          5.6,
          2.8,
        ],
      ] as any)
    : 1.15;
  map.addLayer({
    id: ids.line,
    type: "line",
    source: ids.source,
    layout: { "line-cap": "round", "line-join": "round" },
    paint: {
      "line-color": [
        "match",
        ["get", "voltageKv"],
        ...TRANSMISSION_VOLTAGE_CLASSES_V152.flatMap(({ kv, color: classColor }) => [kv, classColor]),
        color,
      ] as any,
      "line-width": voltageWidth,
      "line-opacity": roleOpacity,
    },
  });
  map.addLayer({
    id: ids.lineHit,
    type: "line",
    source: ids.source,
    paint: {
      "line-color": "#000000",
      "line-width": isPrimary ? 16 : 14,
      "line-opacity": 0.001,
    },
  });
  map.addLayer({
    id: ids.selection,
    type: "line",
    source: ids.source,
    filter: ["==", ["get", "selectionKey"], "__none__"],
    paint: {
      "line-color": "#fff3a6",
      "line-width": isPrimary ? 6 : 5,
      "line-opacity": 0.96,
    },
  });
  return ids.lineHit;
}
