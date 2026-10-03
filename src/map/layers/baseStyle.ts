/**
 * V152: the base MapLibre style (sea, neighbours, the Viet Nam outline) that the
 * big map and the mini map both start from (moved from RealMapExplorerPage).
 */
import type { Map as MapLibreMap } from "maplibre-gl";
import { publicAssetUrlV128 } from "../../utils/publicAssetUrlV128";
import { COUNTRY_OUTLINE_PATH_V151 } from "../../data/map/adminBoundaryV151";
import { countryAssetPathV158, DEFAULT_COUNTRY_ISO3_V158 } from "../../data/countryContext";

// V151-2: Viet Nam is drawn from its own dissolved outline; the Natural Earth
// world file only supplies the neighbouring countries.
export const NOT_VIETNAM_FILTER_V151 = ["!=", ["get", "iso3"], "VNM"];

export const MAP_STYLE: any = {
  version: 8,
  glyphs: "https://tiles.openfreemap.org/fonts/{fontstack}/{range}.pbf",
  sources: {
    "country-boundaries": {
      type: "geojson",
      data: publicAssetUrlV128("data/world-countries.geojson"),
      attribution: "Natural Earth · 로컬 국가 경계",
    },
    "vnm-country-outline": {
      type: "geojson",
      data: publicAssetUrlV128(COUNTRY_OUTLINE_PATH_V151),
      attribution: "국가 외곽선: geoBoundaries VNM ADM1(개편 전 63개 성·시) 병합",
    },
  },
  layers: [
    {
      id: "cdp-base-background",
      type: "background",
      paint: { "background-color": "#e7efeb" },
    },
    {
      id: "cdp-country-fill",
      type: "fill",
      source: "country-boundaries",
      filter: NOT_VIETNAM_FILTER_V151,
      paint: {
        "fill-color": "#ffffff",
        "fill-opacity": 0.9,
      },
    },
    {
      id: "cdp-country-outline",
      type: "line",
      source: "country-boundaries",
      filter: NOT_VIETNAM_FILTER_V151,
      paint: {
        "line-color": "#587168",
        "line-width": 1.1,
        "line-opacity": 0.82,
      },
    },
    // Above the neighbours' coarse outlines so none of them shows inside Viet Nam.
    {
      id: "cdp-vnm-country-fill",
      type: "fill",
      source: "vnm-country-outline",
      paint: {
        "fill-color": "#ffffff",
        "fill-opacity": 0.9,
      },
    },
    {
      id: "cdp-vnm-country-outline",
      type: "line",
      source: "vnm-country-outline",
      paint: {
        "line-color": "#3f5a52",
        "line-width": 1.3,
        "line-opacity": 0.9,
      },
    },
  ],
};

/** V163: a live country's display outline (z5), named like Viet Nam's `vnm-country-outline-z5`. */
export function countryOutlineZ5UrlV163(iso3: string): string {
  return publicAssetUrlV128(
    countryAssetPathV158(iso3, `geometry/${iso3.toLowerCase()}-country-outline-z5.geojson`)
  );
}

const OTHER_OUTLINE_SOURCE_V163 = "cdp-country-outline-v163";
const OTHER_OUTLINE_FILL_V163 = "cdp-country-fill-v163";
const OTHER_OUTLINE_LINE_V163 = "cdp-country-line-v163";

/**
 * V163: a map showing a country other than Viet Nam draws that country from its
 * own outline (the union of its published level-1 units, display z5) instead of
 * the Natural Earth polygon - 36 vertices for Bangladesh, which cut across the
 * division boundaries and the delta drawn on top of it. Viet Nam keeps the base
 * style untouched. Idempotent: safe to call again on a country change.
 */
export function applyCountryOutlineV163(map: MapLibreMap, iso3: string): void {
  let url = "";
  if (iso3 && iso3 !== DEFAULT_COUNTRY_ISO3_V158) {
    try {
      url = countryOutlineZ5UrlV163(iso3);
    } catch {
      // Registry not read yet: keep the Natural Earth polygon rather than guess a path.
      url = "";
    }
  }
  const own = Boolean(url);
  const neighbours = own
    ? ["!", ["in", ["get", "iso3"], ["literal", [DEFAULT_COUNTRY_ISO3_V158, iso3]]]]
    : NOT_VIETNAM_FILTER_V151;
  ["cdp-country-fill", "cdp-country-outline"].forEach((id) => {
    if (map.getLayer(id)) map.setFilter(id, neighbours as any);
  });
  [OTHER_OUTLINE_LINE_V163, OTHER_OUTLINE_FILL_V163].forEach((id) => {
    if (map.getLayer(id)) map.removeLayer(id);
  });
  if (map.getSource(OTHER_OUTLINE_SOURCE_V163)) map.removeSource(OTHER_OUTLINE_SOURCE_V163);
  if (!own) return;
  map.addSource(OTHER_OUTLINE_SOURCE_V163, {
    type: "geojson",
    data: url,
    attribution: `국가 외곽선: geoBoundaries ${iso3} ADM1 병합`,
  });
  // Right above Viet Nam's own outline, i.e. still under every data layer.
  const layers = map.getStyle()?.layers || [];
  const index = layers.findIndex((layer) => layer.id === "cdp-vnm-country-outline");
  const beforeId = index >= 0 ? layers[index + 1]?.id : undefined;
  map.addLayer(
    {
      id: OTHER_OUTLINE_FILL_V163,
      type: "fill",
      source: OTHER_OUTLINE_SOURCE_V163,
      // Same opacity as Viet Nam's fill, which the backdrop switch keeps current.
      paint: {
        "fill-color": "#ffffff",
        "fill-opacity": Number(map.getPaintProperty("cdp-vnm-country-fill", "fill-opacity") ?? 0.9),
      },
    },
    beforeId
  );
  map.addLayer(
    {
      id: OTHER_OUTLINE_LINE_V163,
      type: "line",
      source: OTHER_OUTLINE_SOURCE_V163,
      paint: { "line-color": "#3f5a52", "line-width": 1.3, "line-opacity": 0.9 },
    },
    beforeId
  );
}
