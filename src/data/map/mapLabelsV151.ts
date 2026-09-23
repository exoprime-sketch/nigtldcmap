import type { Map as MapLibreMap } from "maplibre-gl";
import type { VietnamMapGeoJsonV124 } from "../vietnam/vietnamDataLoaderV124";
import { MAP_PLACES_V150, labelNameV151 } from "./mapBackdropV150";
import { polygonLabelAnchorV151 } from "./labelAnchorV151";

/**
 * V151-2: label hierarchy and de-duplication.
 *
 * `mapBackdropV150.addKoreanMapLabelsV150` drew one label per boundary feature
 * plus a fixed handful of city points, so a centrally-run city (Đà Nẵng, Hà
 * Nội, …) whose *province* name equals its *city* name got drawn twice: once
 * from `MAP_PLACES_V150` and once from the province polygon. This module
 * separates "country / city / province" into their own layers and skips a
 * province label whenever its Korean string equals a city label string — the
 * only case duplicated text can appear (Thừa Thiên Huế's province label
 * differs from the city "후에", so both stay; see the VN34-26/VN-26 note
 * below).
 */

/**
 * The six centrally-run cities whose province/unit name equals the city name,
 * with every adm1/unit code that carries that name across both boundary
 * vintages. VN-26 ("트어티엔후에") is deliberately absent from the 63-vintage
 * codes here: before the 2025 reform the province was named 트어티엔후에, a
 * different string from the city "후에", so its province label is kept
 * (see `buildLabelFeaturesV151`).
 */
export const MAP_CITIES_V151: readonly {
  name: string;
  nameEn: string;
  lon: number;
  lat: number;
  adm1Codes: readonly string[];
}[] = [
  { name: "하노이", nameEn: "Hanoi", lon: 105.834, lat: 21.028, adm1Codes: ["VN-HN", "VN34-HN"] },
  { name: "호찌민", nameEn: "Ho Chi Minh City", lon: 106.63, lat: 10.823, adm1Codes: ["VN-SG", "VN34-SG"] },
  { name: "다낭", nameEn: "Da Nang", lon: 108.202, lat: 16.054, adm1Codes: ["VN-DN", "VN34-DN"] },
  { name: "하이퐁", nameEn: "Hai Phong", lon: 106.682, lat: 20.845, adm1Codes: ["VN-HP", "VN34-HP"] },
  { name: "껀터", nameEn: "Can Tho", lon: 105.784, lat: 10.045, adm1Codes: ["VN-CT", "VN34-CT"] },
  // Post-reform Huế (VN-26 / VN34-26): the city label "후에" duplicates the
  // post-2025 province label, so the province label is skipped for VN-26 in
  // both vintages. The pre-2025 province string is 트어티엔후에, which never
  // collides with the city, so it is drawn in 63-mode.
  { name: "후에", nameEn: "Hue", lon: 107.59, lat: 16.463, adm1Codes: ["VN-26", "VN34-26"] },
];

/** Country-level place labels, reused from the V150 backdrop table. */
export const MAP_COUNTRY_LABELS_V151 = MAP_PLACES_V150.filter((place) => place.kind === "country");

/**
 * English + Vietnamese spellings of the six cities, used to strip the
 * backdrop vector tiles' own place labels for these cities so they never
 * duplicate the Korean labels this module draws.
 */
export const CITY_TILE_NAMES_V151: readonly string[] = [
  "Hanoi",
  "Hà Nội",
  "Ho Chi Minh City",
  "Thành phố Hồ Chí Minh",
  "Da Nang",
  "Đà Nẵng",
  "Hai Phong",
  "Hải Phòng",
  "Can Tho",
  "Cần Thơ",
  "Hue",
  "Huế",
];

/**
 * MapLibre filter expression that excludes the six cities' tile place labels.
 * Consumed by the backdrop module (`mapBackdropV150`/its successor) so the
 * OpenFreeMap `place` layer never draws a second copy of a city name.
 */
export function tilePlaceLabelFilterV151(): any {
  return ["!", ["in", ["coalesce", ["get", "name:en"], ["get", "name"]], ["literal", CITY_TILE_NAMES_V151]]];
}

/** Korean-first text field for tile-provided place labels, if ever reused directly. */
export const TILE_LABEL_TEXT_FIELD_V151 = [
  "coalesce",
  ["get", "name:ko"],
  ["get", "name:en"],
  ["get", "name:latin"],
  ["get", "name"],
];

export interface LabelFeatureV151 {
  name: string;
  kind: "country" | "city" | "province";
  point: [number, number];
  code?: string;
}

/**
 * Builds the deduplicated label list: countries and cities always, then one
 * province label per boundary feature — skipped whenever its Korean label
 * string equals a city label string (rule: string equality only, so
 * 트어티엔후에 vs. 후에 is not a collision).
 */
export function buildLabelFeaturesV151(boundary: VietnamMapGeoJsonV124 | null): LabelFeatureV151[] {
  const features: LabelFeatureV151[] = [];
  for (const country of MAP_COUNTRY_LABELS_V151) {
    features.push({ name: country.name, kind: "country", point: [country.lon, country.lat] });
  }
  for (const city of MAP_CITIES_V151) {
    features.push({ name: city.name, kind: "city", point: [city.lon, city.lat], code: city.adm1Codes[0] });
  }

  const cityNames = new Set(MAP_CITIES_V151.map((city) => city.name));
  for (const feature of boundary?.features || []) {
    const properties = feature.properties as Record<string, unknown>;
    const name = labelNameV151(properties);
    if (!name || cityNames.has(name)) continue;
    const point = polygonLabelAnchorV151(feature.geometry);
    if (!point) continue;
    const code =
      (typeof properties.unitCode === "string" && properties.unitCode) ||
      (typeof properties.adm1Code === "string" && properties.adm1Code) ||
      undefined;
    features.push({ name, kind: "province", point, code: code || undefined });
  }
  return features;
}

// Order = draw order. MapLibre places the topmost symbol layer first, so the
// city tier sits above the province tier and wins every label collision.
export const KOREAN_LABEL_LAYER_IDS_V151 = [
  "cdp-ko-country",
  "cdp-ko-province",
  "cdp-ko-city-marker",
  "cdp-ko-city",
] as const;

/**
 * Draws the label hierarchy. Layer ids reuse the V150 names
 * (`cdp-ko-country|city|province`) plus one new id (`cdp-ko-city-marker`) so
 * the existing "keep labels above data" idle handler keeps working unchanged;
 * a caller wiring in the marker id moves it the same way.
 */
export function addKoreanMapLabelsV151(
  map: MapLibreMap,
  boundary: VietnamMapGeoJsonV124 | null,
  options?: { showCities?: boolean }
): void {
  const features: GeoJSON.Feature<GeoJSON.Point>[] = buildLabelFeaturesV151(boundary).map((feature) => ({
    type: "Feature",
    properties: { name: feature.name, kind: feature.kind, code: feature.code ?? null },
    geometry: { type: "Point", coordinates: feature.point },
  }));
  const data: GeoJSON.FeatureCollection<GeoJSON.Point> = { type: "FeatureCollection", features };

  const source = map.getSource("cdp-ko-labels-v151") as import("maplibre-gl").GeoJSONSource | undefined;
  if (source) source.setData(data);
  else map.addSource("cdp-ko-labels-v151", { type: "geojson", data });

  if (!map.getLayer("cdp-ko-country")) {
    map.addLayer({
      id: "cdp-ko-country",
      type: "symbol",
      source: "cdp-ko-labels-v151",
      minzoom: 0,
      maxzoom: 7,
      filter: ["==", ["get", "kind"], "country"],
      layout: {
        "text-field": ["get", "name"],
        "text-font": ["Noto Sans Regular"],
        "text-size": 16,
        "text-padding": 8,
        "text-max-width": 10,
      },
      paint: { "text-color": "#273e46", "text-halo-color": "#ffffff", "text-halo-width": 2 },
    });
  }

  if (!map.getLayer("cdp-ko-province")) {
    map.addLayer({
      id: "cdp-ko-province",
      type: "symbol",
      source: "cdp-ko-labels-v151",
      minzoom: 6.3,
      filter: ["==", ["get", "kind"], "province"],
      layout: {
        "text-field": ["get", "name"],
        "text-font": ["Noto Sans Regular"],
        "text-size": 11,
        "text-letter-spacing": 0.12,
        "text-transform": "none",
        "text-padding": 10,
        "text-allow-overlap": false,
      },
      paint: { "text-color": "#6b7a76", "text-halo-color": "#ffffff", "text-halo-width": 1.6 },
    });
  }

  if (!map.getLayer("cdp-ko-city-marker")) {
    map.addLayer({
      id: "cdp-ko-city-marker",
      type: "circle",
      source: "cdp-ko-labels-v151",
      minzoom: 4,
      filter: ["==", ["get", "kind"], "city"],
      paint: {
        "circle-radius": ["interpolate", ["linear"], ["zoom"], 4, 2.5, 10, 4],
        "circle-color": "#1f3a44",
        "circle-stroke-color": "#ffffff",
        "circle-stroke-width": 1.2,
      },
    });
  }

  if (!map.getLayer("cdp-ko-city")) {
    map.addLayer({
      id: "cdp-ko-city",
      type: "symbol",
      source: "cdp-ko-labels-v151",
      minzoom: 4,
      filter: ["==", ["get", "kind"], "city"],
      layout: {
        "text-field": ["get", "name"],
        "text-font": ["Noto Sans Bold"],
        "text-size": 12.5,
        "text-offset": [0, 0.9],
        "text-anchor": "top",
        "text-variable-anchor": ["top", "bottom"],
        "text-padding": 8,
      },
      paint: { "text-color": "#16302f", "text-halo-color": "#ffffff", "text-halo-width": 2 },
    });
  }

  const cityVisibility = options?.showCities === false ? "none" : "visible";
  for (const id of ["cdp-ko-city-marker", "cdp-ko-city"]) {
    if (map.getLayer(id)) map.setLayoutProperty(id, "visibility", cityVisibility);
  }
}
