/**
 * V152: the 34/63 province reference outline drawn under every data layer
 * (moved from RealMapExplorerPage).
 */
import type { GeoJSONSource, Map as MapLibreMap } from "maplibre-gl";
import type { VietnamMapGeoJsonV124 } from "../../data/vietnam/vietnamDataLoaderV124";

export const VNM_ADM1_BASE_SOURCE_V126 = "cdp-vietnam-adm1-reference";

export const VNM_ADM1_BASE_OUTLINE_V126 = "cdp-vietnam-adm1-reference-outline";

/**
 * Draws (or re-points) the province reference outline for the boundary vintage
 * the loaded asset carries; removes it outside Viet Nam.
 */
export function applyBoundaryReferenceV152(
  map: MapLibreMap,
  countryIso3: string,
  adm1Boundary: VietnamMapGeoJsonV124 | null
): void {
  if (countryIso3 !== "VNM" || !adm1Boundary) {
    if (map.getLayer(VNM_ADM1_BASE_OUTLINE_V126)) {
      map.removeLayer(VNM_ADM1_BASE_OUTLINE_V126);
    }
    if (map.getSource(VNM_ADM1_BASE_SOURCE_V126)) {
      map.removeSource(VNM_ADM1_BASE_SOURCE_V126);
    }
    return;
  }
  // V151-2: the 34-unit outline is the primary reference and reads heavier
  // than the 63 pre-reform provinces, which are a toggle.
  const is34 = adm1Boundary.features[0]?.properties?.boundarySystem === "post-2025-34";
  const lineWidth = is34 ? 1.6 : 0.8;
  const lineOpacity = is34 ? 0.7 : 0.42;
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
      '<a href="https://www.geoboundaries.org/" target="_blank" rel="noreferrer">geoBoundaries VNM ADM1</a> · CC BY 4.0 · 2025-07-01 34개 통합 대응',
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
