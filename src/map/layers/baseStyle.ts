/**
 * V152: the base MapLibre style (sea, neighbours, the Viet Nam outline) that the
 * big map and the mini map both start from (moved from RealMapExplorerPage).
 */
import { publicAssetUrlV128 } from "../../utils/publicAssetUrlV128";
import { COUNTRY_OUTLINE_PATH_V151 } from "../../data/map/adminBoundaryV151";

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
