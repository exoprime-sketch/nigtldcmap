/**
 * V152: point layers (entities with coordinates) - the source (clustered when
 * the contract says so), the circles or shape symbols, an invisible hit circle
 * and the selection ring (moved from RealMapExplorerPage).
 */
import type { Map as MapLibreMap } from "maplibre-gl";
import type { CountryMapLayerV122 } from "../../data/countries/countryDataTypesV122";
import { mountClusterLayersV152 } from "./clusterLayer";
import { A023_FUEL_COLORS_V126 } from "./colors";
import type { MapLayerRuntimeIdsV152 } from "./ids";
import { mountPointIconLayersV152 } from "./pointIconLayer";
import { ensurePublicPointSymbolImageV129, publicMapSymbolShapeV129 } from "./symbols";

export interface MountPointLayerInputV152 {
  layer: CountryMapLayerV122;
  ids: MapLayerRuntimeIdsV152;
  color: string;
  isPrimary: boolean;
  data: GeoJSON.FeatureCollection<GeoJSON.Point>;
  /** The big map clusters up to zoom 13; a map that stops zooming earlier passes its own limit. */
  clusterMaxZoom?: number;
  /** V152: white badge + category glyph instead of the V129 circles and shapes. */
  icons?: boolean;
}

export function mountPointLayersV152(
  map: MapLibreMap,
  { layer, ids, color, isPrimary, data, clusterMaxZoom = 13, icons = false }: MountPointLayerInputV152
): void {
  if (icons) {
    mountPointIconLayersV152(map, { layer, ids, color, isPrimary, data, clusterMaxZoom });
    return;
  }
  const elementId = layer.elementId;
  map.addSource(ids.source, {
    type: "geojson",
    data,
    cluster: layer.cluster,
    clusterMaxZoom,
    clusterRadius: isPrimary ? 46 : 28,
  });
  if (layer.cluster) {
    mountClusterLayersV152(map, { ids, color, isPrimary });
  }
  const pointColor =
    elementId === "A-023" && isPrimary
      ? ([
          "match",
          ["get", "fuelType"],
          ...Object.entries(A023_FUEL_COLORS_V126).flatMap(
            ([fuel, fuelColor]) => [fuel, fuelColor]
          ),
          color,
        ] as any)
      : color;
  const pointRadius =
    elementId === "A-023" && isPrimary
      ? ([
          "interpolate",
          ["linear"],
          ["to-number", ["get", "capacityMw"], 0],
          0,
          4,
          100,
          5.5,
          500,
          7.5,
          1000,
          10,
        ] as any)
      : isPrimary
      ? 7
      : 4.2;
  const pointSymbolShape = publicMapSymbolShapeV129(layer);
  const pointSymbolImageId = `cdp-v129-${elementId
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "-")}-${pointSymbolShape}`;
  ensurePublicPointSymbolImageV129(
    map,
    pointSymbolImageId,
    pointSymbolShape,
    color
  );
  map.addLayer({
    id: ids.point,
    type: "circle",
    source: ids.source,
    ...(layer.cluster
      ? { filter: ["!", ["has", "point_count"]] as any }
      : {}),
    paint: {
      "circle-color": pointColor,
      "circle-radius": pointRadius,
      // A row placed at a city or district centre is drawn hollow, so a
      // reader never takes a representative point for a building.
      "circle-opacity": [
        "case",
        ["==", ["get", "approximate"], true],
        pointSymbolShape === "circle" ? 0.12 : 0,
        pointSymbolShape === "circle" ? (isPrimary ? 0.88 : 0.4) : 0,
      ] as any,
      "circle-stroke-color": [
        "case",
        ["==", ["get", "approximate"], true],
        color,
        "#ffffff",
      ] as any,
      "circle-stroke-width": [
        "case",
        ["==", ["get", "approximate"], true],
        pointSymbolShape === "circle" ? 2 : 0,
        isPrimary ? 1.5 : 0.8,
      ] as any,
    },
  });
  map.addLayer({
    id: ids.pointHit,
    type: "circle",
    source: ids.source,
    ...(layer.cluster
      ? { filter: ["!", ["has", "point_count"]] as any }
      : {}),
    paint: {
      "circle-color": "#000000",
      "circle-radius": isPrimary ? 14 : 12,
      "circle-opacity": 0.001,
    },
  });
  if (pointSymbolShape !== "circle") {
    map.addLayer({
      id: ids.pointSymbol,
      type: "symbol",
      source: ids.source,
      ...(layer.cluster
        ? { filter: ["!", ["has", "point_count"]] as any }
        : {}),
      layout: {
        "icon-allow-overlap": true,
        "icon-image": pointSymbolImageId,
        "icon-size": isPrimary ? 1 : 0.78,
      },
      paint: {
        "icon-opacity": [
          "case",
          ["==", ["get", "approximate"], true],
          isPrimary ? 0.45 : 0.25,
          isPrimary ? 0.9 : 0.45,
        ] as any,
      },
    });
  }
  map.addLayer({
    id: ids.selection,
    type: "circle",
    source: ids.source,
    filter: ["==", ["get", "selectionKey"], "__none__"],
    paint: {
      "circle-color": "rgba(0,0,0,0)",
      "circle-radius": isPrimary ? 12 : 10,
      "circle-stroke-color": "#f0a51a",
      "circle-stroke-width": 3.5,
    },
  });
}
