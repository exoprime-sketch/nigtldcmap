/**
 * V152: the 34/63 province reference outline drawn under every data layer
 * (moved from RealMapExplorerPage).
 */
import type { GeoJSONSource, Map as MapLibreMap } from "maplibre-gl";
import type { VietnamMapGeoJsonV124 } from "../../data/vietnam/vietnamDataLoaderV124";

export const VNM_ADM1_BASE_SOURCE_V126 = "cdp-vietnam-adm1-reference";

export const VNM_ADM1_BASE_OUTLINE_V126 = "cdp-vietnam-adm1-reference-outline";

export interface BoundaryReferenceOptionsV163 {
  /**
   * V163: another country's level-1 outline is drawn (thin, under the data) only
   * when the caller gives its source credit; without it the outline is removed
   * outside Viet Nam, as the big map has always done.
   */
  countryCredit?: string;
}

/**
 * Draws (or re-points) the province reference outline for the boundary vintage
 * the loaded asset carries; removes it outside Viet Nam unless the caller names
 * the other country's credit.
 */
export function applyBoundaryReferenceV152(
  map: MapLibreMap,
  countryIso3: string,
  adm1Boundary: VietnamMapGeoJsonV124 | null,
  options: BoundaryReferenceOptionsV163 = {}
): void {
  if ((countryIso3 !== "VNM" && !options.countryCredit) || !adm1Boundary) {
    if (map.getLayer(VNM_ADM1_BASE_OUTLINE_V126)) {
      map.removeLayer(VNM_ADM1_BASE_OUTLINE_V126);
    }
    if (map.getSource(VNM_ADM1_BASE_SOURCE_V126)) {
      map.removeSource(VNM_ADM1_BASE_SOURCE_V126);
    }
    return;
  }
  // V168 (user report 2026-10-05): only one Viet Nam vintage is drawn at a
  // time, so the 63 pre-reform provinces - shown when the reader picks them -
  // read as clearly as the 34 (V151-2 drew them at 0.8px · 42%, too faint to
  // follow). Another country's outline stays thin under the data (V163).
  const thin = countryIso3 !== "VNM";
  const lineWidth = thin ? 0.8 : 1.6;
  const lineOpacity = thin ? 0.42 : 0.7;
  const existing = map.getSource(
    VNM_ADM1_BASE_SOURCE_V126
  ) as GeoJSONSource | undefined;
  if (existing) {
    existing.setData(adm1Boundary as GeoJSON.FeatureCollection);
    if (map.getLayer(VNM_ADM1_BASE_OUTLINE_V126)) {
      map.setPaintProperty(VNM_ADM1_BASE_OUTLINE_V126, "line-width", lineWidth);
      map.setPaintProperty(VNM_ADM1_BASE_OUTLINE_V126, "line-opacity", lineOpacity);
    }
    return;
  }
  map.addSource(VNM_ADM1_BASE_SOURCE_V126, {
    type: "geojson",
    data: adm1Boundary as GeoJSON.FeatureCollection,
    attribution:
      countryIso3 !== "VNM"
        ? `<a href="https://www.geoboundaries.org/" target="_blank" rel="noreferrer">geoBoundaries</a> · ${options.countryCredit}`
        : '<a href="https://www.geoboundaries.org/" target="_blank" rel="noreferrer">geoBoundaries VNM ADM1</a> · CC BY 4.0 · 2025-07-01 34개 통합 대응',
  });
  // Below any data layer already mounted (re-entering Viet Nam), above the backdrop.
  const firstDataLayer = map.getStyle().layers?.find((entry) => /^v1\d\d-/u.test(entry.id))?.id;
  map.addLayer(
    {
      id: VNM_ADM1_BASE_OUTLINE_V126,
      type: "line",
      source: VNM_ADM1_BASE_SOURCE_V126,
      paint: {
        "line-color": "#2f6f59",
        "line-width": lineWidth,
        "line-opacity": lineOpacity,
      },
    },
    firstDataLayer
  );
}
