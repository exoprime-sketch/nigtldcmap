import type { Map as MapLibreMap } from "maplibre-gl";
import type { VietnamMapGeoJsonV124 } from "../vietnam/vietnamDataLoaderV124";
import { PROVINCE_KO_34_V151 } from "./adminBoundaryV151";

// Names follow the 63-unit boundary vintage; V151 adds the 34-unit names in
// adminBoundaryV151 and labelNameV151 below picks whichever the feature carries.
export const PROVINCE_KO_V150: Record<string, string> = {
  "VN-01":"라이쩌우", "VN-02":"라오까이", "VN-03":"하장", "VN-04":"까오방", "VN-05":"선라", "VN-06":"옌바이", "VN-07":"뚜옌꽝", "VN-09":"랑선", "VN-13":"꽝닌", "VN-14":"호아빈", "VN-18":"닌빈", "VN-20":"타이빈", "VN-21":"타인호아", "VN-22":"응에안", "VN-23":"하띤", "VN-24":"꽝빈", "VN-25":"꽝찌", "VN-26":"트어티엔후에", "VN-27":"꽝남", "VN-28":"꼰뚬", "VN-29":"꽝응아이", "VN-30":"잘라이", "VN-31":"빈딘", "VN-32":"푸옌", "VN-33":"닥락", "VN-34":"카인호아", "VN-35":"럼동", "VN-36":"닌투언", "VN-37":"떠이닌", "VN-39":"동나이", "VN-40":"빈투언", "VN-41":"롱안", "VN-43":"바리아붕따우", "VN-44":"안장", "VN-45":"동탑", "VN-46":"띠엔장", "VN-47":"끼엔장", "VN-49":"빈롱", "VN-50":"벤째", "VN-51":"짜빈", "VN-52":"속짱", "VN-53":"박깐", "VN-54":"박장", "VN-55":"박리에우", "VN-56":"박닌", "VN-57":"빈즈엉", "VN-58":"빈프억", "VN-59":"까마우", "VN-61":"하이즈엉", "VN-63":"하남", "VN-66":"흥옌", "VN-67":"남딘", "VN-68":"푸토", "VN-69":"타이응우옌", "VN-70":"빈푹", "VN-71":"디엔비엔", "VN-72":"닥농", "VN-73":"허우장", "VN-CT":"껀터", "VN-DN":"다낭", "VN-HN":"하노이", "VN-HP":"하이퐁", "VN-SG":"호찌민",
};
export const MAP_PLACES_V150 = [
  { name: "베트남", lon: 107.2, lat: 17.6, kind: "country" },
  { name: "라오스", lon: 102.6, lat: 18.8, kind: "country" },
  { name: "캄보디아", lon: 104.7, lat: 12.8, kind: "country" },
  { name: "태국", lon: 100.6, lat: 15.7, kind: "country" },
  { name: "중국", lon: 108.5, lat: 25.6, kind: "country" },
  { name: "하노이", lon: 105.834, lat: 21.028, kind: "city" },
  { name: "다낭", lon: 108.202, lat: 16.054, kind: "city" },
  { name: "호찌민", lon: 106.63, lat: 10.823, kind: "city" },
];
// A label anchor is only cartographic placement, never a facility location.
export function polygonLabelPointV150(geometry: { type: string; coordinates: unknown }): [number, number] | null {
  const polygons = (geometry.type === "MultiPolygon" ? geometry.coordinates : [geometry.coordinates]) as number[][][][];
  let best: { area: number; point: [number, number] } | null = null;
  for (const poly of polygons) {
    const ring = poly?.[0]; if (!ring || ring.length < 3) continue;
    let area = 0, x = 0, y = 0;
    for (let i = 0; i < ring.length - 1; i++) { const a = ring[i], b = ring[i + 1], cross = a[0] * b[1] - b[0] * a[1]; area += cross; x += (a[0] + b[0]) * cross; y += (a[1] + b[1]) * cross; }
    if (Math.abs(area) > (best?.area || 0)) best = { area: Math.abs(area), point: [x / (3 * area), y / (3 * area)] };
  }
  return best?.point || null;
}
/**
 * V151: a boundary feature carries `unitCode` on the 34-unit asset and
 * `adm1Code` on the 63-unit one, so the label follows whichever vintage is on
 * screen without the caller having to say which.
 */
export function labelNameV151(properties: Record<string, unknown>): string | null {
  const unitCode = properties.unitCode;
  if (typeof unitCode === "string" && PROVINCE_KO_34_V151[unitCode]) {
    return PROVINCE_KO_34_V151[unitCode];
  }
  return PROVINCE_KO_V150[String(properties.adm1Code)] || null;
}
export function addKoreanMapLabelsV150(map: MapLibreMap, boundary: VietnamMapGeoJsonV124 | null) {
  const features: GeoJSON.Feature<GeoJSON.Point>[] = MAP_PLACES_V150.map(p => ({ type: "Feature", properties: { name: p.name, kind: p.kind }, geometry: { type: "Point", coordinates: [p.lon, p.lat] } }));
  for (const f of boundary?.features || []) {
    const name = labelNameV151(f.properties as Record<string, unknown>); const point = polygonLabelPointV150(f.geometry);
    if (name && point) features.push({ type: "Feature", properties: { name, kind: "province" }, geometry: { type: "Point", coordinates: point } });
  }
  const data: GeoJSON.FeatureCollection<GeoJSON.Point> = { type: "FeatureCollection", features };
  const source = map.getSource("cdp-ko-labels-v150") as import("maplibre-gl").GeoJSONSource | undefined;
  if (source) source.setData(data); else map.addSource("cdp-ko-labels-v150", { type: "geojson", data });
  for (const kind of ["country", "city", "province"]) {
    const id = "cdp-ko-" + kind;
    if (map.getLayer(id)) continue;
    map.addLayer({ id, type: "symbol", source: "cdp-ko-labels-v150", minzoom: kind === "province" ? 6.3 : kind === "city" ? 4 : 0, maxzoom: kind === "country" ? 7 : 24,
      filter: ["==", ["get", "kind"], kind], layout: { "text-field": ["get", "name"], "text-font": ["Noto Sans Regular"], "text-size": kind === "country" ? 16 : 12, "text-padding": 8, "text-max-width": 10 },
      paint: { "text-color": kind === "country" ? "#273e46" : "#243e38", "text-halo-color": "#ffffff", "text-halo-width": 2 } });
  }
}
const BASE_IDS = ["cdp-terrain-v150", "cdp-water-v150", "cdp-parks-v150", "cdp-roads-v150", "cdp-streets-v150"];
export function setMapBackdropV150(map: MapLibreMap, enabled: boolean) {
  if (enabled && !map.getSource("cdp-ofm-v150")) {
    map.addSource("cdp-ofm-v150", { type: "vector", url: "https://tiles.openfreemap.org/planet" });
    map.addSource("cdp-terrain-v150", { type: "raster", tiles: ["https://tiles.openfreemap.org/natural_earth/ne2sr/{z}/{x}/{y}.png"], tileSize: 256, maxzoom: 6 });
    map.addLayer({ id: BASE_IDS[0], type: "raster", source: "cdp-terrain-v150", paint: { "raster-opacity": 0.64, "raster-saturation": -0.5 } }, "cdp-country-fill");
    map.addLayer({ id: BASE_IDS[1], type: "fill", source: "cdp-ofm-v150", "source-layer": "water", paint: { "fill-color": "#c4dce9" } }, "cdp-country-fill");
    map.addLayer({ id: BASE_IDS[2], type: "fill", source: "cdp-ofm-v150", "source-layer": "landcover", minzoom: 6, paint: { "fill-color": "#bdd0ac", "fill-opacity": 0.35 } }, "cdp-country-fill");
    map.addLayer({ id: BASE_IDS[3], type: "line", source: "cdp-ofm-v150", "source-layer": "transportation", filter: ["in", "class", "motorway", "trunk", "primary", "secondary"], minzoom: 6, paint: { "line-color": "#baab95", "line-width": ["interpolate", ["linear"], ["zoom"], 6, 0.55, 14, 2.5] } }, "cdp-country-outline");
    map.addLayer({ id: BASE_IDS[4], type: "line", source: "cdp-ofm-v150", "source-layer": "transportation", minzoom: 11, paint: { "line-color": "#c2bcae", "line-width": 0.6 } }, "cdp-country-outline");
  }
  for (const id of BASE_IDS) if (map.getLayer(id)) map.setLayoutProperty(id, "visibility", enabled ? "visible" : "none");
  map.setPaintProperty("cdp-country-fill", "fill-color", enabled ? "#f5f3eb" : "#f6f7f3");
  map.setPaintProperty("cdp-country-fill", "fill-opacity", enabled ? 0.08 : 1);
  map.setPaintProperty("cdp-base-background", "background-color", "#d6e5ed");
}
