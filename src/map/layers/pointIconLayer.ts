/**
 * V152: point layers drawn as icons - a white badge whose ring carries the
 * category colour, the category glyph on top, a hover ring, the selection
 * ring and (Korean organisations) a small "KR" tag. Clusters keep their circle
 * and count and, on the primary layer, show the layer's representative glyph.
 *
 * The same code draws the big map and the mini map; the legend reads the same
 * `__icon`/`__iconColor`/`__iconKey` properties, so the legend and the map
 * cannot disagree.
 */
import type { Map as MapLibreMap } from "maplibre-gl";
import type { CountryMapLayerV122 } from "../../data/countries/countryDataTypesV122";
import {
  MAP_ICON_BADGE_V152,
  mapIconCategoryV152,
  mapIconImageIdV152,
  mapLayerIconV152,
} from "../../data/map/mapIconsV152";
import type { MapLayerRuntimeIdsV152 } from "./ids";

/** Feature property keys the icon layers and the legend read. */
export const MAP_ICON_PROPERTY_V152 = {
  image: "__icon",
  color: "__iconColor",
  key: "__iconKey",
  tag: "__iconTag",
} as const;

/**
 * Writes each point's icon, ring colour and legend key onto its properties
 * (in place). Features of layers without an icon rule are left untouched.
 */
export function assignPointIconsV152(
  elementId: string,
  features: Array<{ properties: Record<string, unknown> | null }>,
  layerColor: string
): void {
  for (const feature of features) {
    const properties = (feature.properties || {}) as Record<string, unknown>;
    const category = mapIconCategoryV152(elementId, properties, layerColor);
    if (!category) continue;
    properties[MAP_ICON_PROPERTY_V152.image] = mapIconImageIdV152(category.iconId);
    properties[MAP_ICON_PROPERTY_V152.color] = category.color;
    properties[MAP_ICON_PROPERTY_V152.key] = category.key;
    if (category.tag) properties[MAP_ICON_PROPERTY_V152.tag] = category.tag;
    feature.properties = properties;
  }
}

const zoomStops = (stops: readonly (readonly [number, number])[]) => stops.flatMap(([zoom, value]) => [zoom, value]);

/**
 * A-023 capacity bands (the legend's four bands: <10, 10-99, 100-499, >=500 MW;
 * unstated capacity is the smallest), badge radius in px at zoom 5 and 9.
 */
export const A023_CAPACITY_BADGE_RADIUS_V152 = {
  bands: [10, 100, 500] as const,
  z5: [9, 10, 11.5, 13] as const,
  z9: [11, 12.5, 14, 16] as const,
};

function capacityStep(radii: readonly number[]): unknown[] {
  const [b1, b2, b3] = A023_CAPACITY_BADGE_RADIUS_V152.bands;
  return ["step", ["to-number", ["get", "capacityMw"], -1], radii[0], b1, radii[1], b2, radii[2], b3, radii[3]];
}

/** Badge radius expression for a layer and role (px, interpolated over zoom). */
export function pointBadgeRadiusV152(elementId: string, isPrimary: boolean): unknown {
  if (elementId === "A-023" && isPrimary) {
    return [
      "interpolate",
      ["linear"],
      ["zoom"],
      5,
      capacityStep(A023_CAPACITY_BADGE_RADIUS_V152.z5),
      9,
      capacityStep(A023_CAPACITY_BADGE_RADIUS_V152.z9),
    ];
  }
  return ["interpolate", ["linear"], ["zoom"], ...zoomStops(isPrimary ? MAP_ICON_BADGE_V152.radius.primary : MAP_ICON_BADGE_V152.radius.context)];
}

function ringAround(radius: unknown, extra: number): unknown {
  // `+` cannot wrap a zoom interpolation, so the ring repeats the stops with the offset.
  const expression = radius as unknown[];
  if (Array.isArray(expression) && expression[0] === "interpolate") {
    const out = expression.slice(0, 3);
    for (let index = 3; index < expression.length; index += 2) {
      out.push(expression[index], ["+", expression[index + 1], extra]);
    }
    return out;
  }
  return ["+", radius, extra];
}

export function mountPointIconLayersV152(
  map: MapLibreMap,
  {
    layer,
    ids,
    color,
    isPrimary,
    data,
    clusterMaxZoom = 13,
  }: {
    layer: CountryMapLayerV122;
    ids: MapLayerRuntimeIdsV152;
    color: string;
    isPrimary: boolean;
    data: GeoJSON.FeatureCollection<GeoJSON.Point>;
    clusterMaxZoom?: number;
  }
): void {
  const approximate = ["==", ["get", "approximate"], true];
  const notCluster = layer.cluster ? { filter: ["!", ["has", "point_count"]] as any } : {};
  const radius = pointBadgeRadiusV152(layer.elementId, isPrimary);
  const iconSize = [
    "interpolate",
    ["linear"],
    ["zoom"],
    ...MAP_ICON_BADGE_V152.iconSize.flatMap(([zoom, size]) => [zoom, isPrimary ? size : Number((size * 0.82).toFixed(3))]),
  ];

  map.addSource(ids.source, {
    type: "geojson",
    data,
    cluster: layer.cluster,
    clusterMaxZoom,
    clusterRadius: isPrimary ? 46 : 28,
  });

  if (layer.cluster) {
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
    const representative = isPrimary ? mapLayerIconV152(layer.elementId) : null;
    map.addLayer({
      id: ids.clusterCount,
      type: "symbol",
      source: ids.source,
      filter: ["has", "point_count"],
      layout: {
        "text-field": "{point_count_abbreviated}",
        "text-font": ["Noto Sans Regular"],
        "text-size": isPrimary ? 12 : 10,
        // With the representative glyph above the centre, the count sits just below it.
        ...(representative ? { "text-anchor": "top" as const, "text-offset": [0, 0.05] as [number, number] } : {}),
        "text-allow-overlap": true,
      },
      paint: {
        "text-color": isPrimary ? "#ffffff" : "#284b3e",
        "text-opacity": isPrimary ? 1 : 0.72,
      },
    });
    if (representative) {
      map.addLayer({
        id: ids.clusterIcon,
        type: "symbol",
        source: ids.source,
        filter: ["has", "point_count"],
        layout: {
          "icon-image": mapIconImageIdV152(representative, "white"),
          "icon-size": 0.6,
          "icon-anchor": "bottom",
          "icon-offset": [0, 1],
          "icon-allow-overlap": true,
          "icon-ignore-placement": true,
        },
      });
    }
  }

  // The badge: white disc, category-coloured ring; approximate sites are faint.
  map.addLayer({
    id: ids.point,
    type: "circle",
    source: ids.source,
    ...notCluster,
    paint: {
      "circle-color": "#ffffff",
      "circle-radius": radius as any,
      "circle-opacity": ["case", approximate, 0.55, isPrimary ? 1 : 0.82] as any,
      "circle-stroke-color": ["coalesce", ["get", "__iconColor"], color] as any,
      "circle-stroke-width": isPrimary ? MAP_ICON_BADGE_V152.ring.primary : MAP_ICON_BADGE_V152.ring.context,
      "circle-stroke-opacity": ["case", approximate, 0.7, isPrimary ? 1 : 0.82] as any,
    },
  });
  map.addLayer({
    id: ids.pointSymbol,
    type: "symbol",
    source: ids.source,
    ...notCluster,
    layout: {
      "icon-image": ["coalesce", ["get", "__icon"], ""] as any,
      "icon-size": iconSize as any,
      "icon-allow-overlap": true,
      "icon-ignore-placement": true,
    },
    paint: {
      "icon-opacity": ["case", approximate, 0.55, isPrimary ? 1 : 0.8] as any,
    },
  });
  map.addLayer({
    id: ids.pointTag,
    type: "symbol",
    source: ids.source,
    filter: layer.cluster
      ? (["all", ["!", ["has", "point_count"]], ["==", ["get", "__iconTag"], "KR"]] as any)
      : (["==", ["get", "__iconTag"], "KR"] as any),
    layout: {
      "text-field": "KR",
      "text-font": ["Noto Sans Bold"],
      "text-size": 8.5,
      "text-offset": [1.25, 1.05],
      "text-allow-overlap": true,
      "text-ignore-placement": true,
    },
    paint: {
      "text-color": "#6d1d3b",
      "text-halo-color": "#ffffff",
      "text-halo-width": 1.6,
    },
  });
  map.addLayer({
    id: ids.pointHit,
    type: "circle",
    source: ids.source,
    ...notCluster,
    paint: {
      "circle-color": "#000000",
      "circle-radius": ringAround(radius, 3) as any,
      "circle-opacity": 0.001,
    },
  });
  map.addLayer({
    id: ids.pointHover,
    type: "circle",
    source: ids.source,
    filter: ["==", ["get", "selectionKey"], "__none__"],
    paint: {
      "circle-color": "rgba(0,0,0,0)",
      "circle-radius": ringAround(radius, 2) as any,
      "circle-stroke-color": "#173a4d",
      "circle-stroke-width": 2.2,
    },
  });
  map.addLayer({
    id: ids.selection,
    type: "circle",
    source: ids.source,
    filter: ["==", ["get", "selectionKey"], "__none__"],
    paint: {
      "circle-color": "rgba(0,0,0,0)",
      "circle-radius": ringAround(radius, 4.5) as any,
      "circle-stroke-color": "#f0a51a",
      "circle-stroke-width": 3.5,
    },
  });
}
