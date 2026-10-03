/**
 * V163: what one comparison pane loads, the way the big map loads it
 * (RealMapExplorerPage's layer loader), but per pane and per country.
 *
 * - area renderers (line, provinces, units, sites with polygons, regional
 *   scope) read the country's own spatial asset and value table;
 * - site renderers read the element's entity records (a mineral layer reads
 *   its host element's mines and joins its national figures), plus Viet Nam's
 *   optional province sidecar;
 * - the reference outline is the country's level-1 boundary: Viet Nam's 34
 *   (or 63) provinces with the six-region file for the region-valued layers,
 *   any other country the boundary file its registry entry names.
 *
 * Every loader here is the shared one, so its JSON cache is shared with the
 * big map: opening the comparison on the map's own layer fetches nothing new.
 */
import { countryDataLoaderV158 } from "../../../data/countries/countryDataLoaderV158";
import {
  loadCountryElementEntitiesV122,
  loadCountryMapIndexV122,
} from "../../../data/countries/countryDataFacadeV122";
import { ensureCountryRegistryLoadedV158 } from "../../../data/countries/countryDataProviderRegistryV122";
import type { CountryEntityV122, CountryMapLayerV122 } from "../../../data/countries/countryDataTypesV122";
import { countryLevel1AssetUrlV162 } from "../../../data/countries/countryLevel1V158";
import { DEFAULT_COUNTRY_ISO3_V158 } from "../../../data/countryContext";
import {
  ADM1_34_GEOMETRY_PATH_V151,
  boundaryGeometryPathV151,
  REGION_6_GEOMETRY_PATH_V151,
  type BoundarySystemV151,
} from "../../../data/map/adminBoundaryV151";
import { applyNationalMineJoinV157_2 } from "../../../data/map/entityAttributeJoinV157_2";
import {
  loadVietnamLocationsV151,
  loadVietnamSpatialGeoJsonV124,
  type VietnamMapGeoJsonV124,
} from "../../../data/vietnam/vietnamDataLoaderV124";
import type { VietnamLocationSidecarV151 } from "../../../data/vietnam/vietnamTypesV124";
import {
  isAreaRendererV152,
  rendererOf,
  type BoundaryRenderContextV151,
  type SpatialRuntimeAsset,
} from "../../../map/layers";
import { publicAssetUrlV128 } from "../../../utils/publicAssetUrlV128";

const INDEX_CACHE_V163 = new Map<string, Promise<CountryMapLayerV122[]>>();

/** A country's map layers, read once per session (a failure is not cached). */
export function loadCompareMapIndexV163(iso3: string): Promise<CountryMapLayerV122[]> {
  const key = iso3.toUpperCase();
  const cached = INDEX_CACHE_V163.get(key);
  if (cached) return cached;
  // A pane opened from a shared link may name a country the bundled registry
  // does not know yet; the registry file decides which countries exist.
  const request = ensureCountryRegistryLoadedV158()
    .then(() => loadCountryMapIndexV122(key))
    .catch((reason: unknown) => {
    INDEX_CACHE_V163.delete(key);
    throw reason;
  });
  INDEX_CACHE_V163.set(key, request);
  return request;
}

export interface ComparePaneDataV163 {
  spatial?: SpatialRuntimeAsset;
  records?: CountryEntityV122[];
  locations?: VietnamLocationSidecarV151;
  /** The level-1 outline drawn under the data and labelled. */
  reference: VietnamMapGeoJsonV124 | null;
  boundary: BoundaryRenderContextV151;
}

/**
 * The outline a Viet Nam layer is drawn on: the layer's own vintage when it
 * declares one (values defined on the 63 pre-2025 provinces), else the map's.
 */
export function paneBoundarySystemV163(
  iso3: string,
  layer: CountryMapLayerV122,
  mapSystem: BoundarySystemV151
): BoundarySystemV151 {
  if (iso3 !== DEFAULT_COUNTRY_ISO3_V158) return mapSystem;
  const declared = (layer as { defaultBoundarySystem?: string }).defaultBoundarySystem;
  return declared === "pre-2025-63" || declared === "post-2025-34" ? declared : mapSystem;
}

function abortErrorV163(): DOMException {
  return new DOMException("aborted", "AbortError");
}

export async function loadComparePaneDataV163({
  iso3,
  layer,
  boundarySystem,
  signal,
}: {
  iso3: string;
  layer: CountryMapLayerV122;
  boundarySystem: BoundarySystemV151;
  signal: AbortSignal;
}): Promise<ComparePaneDataV163> {
  const country = iso3.toUpperCase();
  const isDefault = country === DEFAULT_COUNTRY_ISO3_V158;
  const loader = countryDataLoaderV158(country);
  const area = isAreaRendererV152(rendererOf(layer));
  const level1Asset = isDefault ? null : countryLevel1AssetUrlV162(country);

  // The outline and Viet Nam's aggregation geometries never block the layer:
  // a missing one leaves the data drawn without it, as on the big map.
  const referenceRequest: Promise<VietnamMapGeoJsonV124 | null> = isDefault
    ? loadVietnamSpatialGeoJsonV124(publicAssetUrlV128(boundaryGeometryPathV151(boundarySystem))).catch(() => null)
    : level1Asset
      ? (loader.loadSpatialGeoJson(level1Asset) as Promise<VietnamMapGeoJsonV124>).catch(() => null)
      : Promise.resolve(null);
  const geometry34Request: Promise<VietnamMapGeoJsonV124 | null> =
    isDefault && area
      ? loadVietnamSpatialGeoJsonV124(publicAssetUrlV128(ADM1_34_GEOMETRY_PATH_V151)).catch(() => null)
      : Promise.resolve(null);
  const region6Request: Promise<VietnamMapGeoJsonV124 | null> =
    isDefault && area
      ? loadVietnamSpatialGeoJsonV124(publicAssetUrlV128(REGION_6_GEOMETRY_PATH_V151)).catch(() => null)
      : Promise.resolve(null);

  let spatial: SpatialRuntimeAsset | undefined;
  let records: CountryEntityV122[] | undefined;
  let locations: VietnamLocationSidecarV151 | undefined;

  if (area) {
    if (!layer.geometryUrl) {
      throw new Error(layer.disabledReason || "이 데이터는 지도에 표시할 위치자료가 없습니다");
    }
    // Shared boundary files stay cached across panes; a unique asset is abortable.
    const shared = layer.geometryUrl.endsWith("vnm-adm1-63.geojson") || layer.geometryUrl === level1Asset;
    const [geometry, data] = await Promise.all([
      loader.loadSpatialGeoJson(layer.geometryUrl, shared ? undefined : signal),
      layer.dataUrl ? loader.loadSpatialLayer(layer.dataUrl, signal) : Promise.resolve(undefined),
    ]);
    spatial = { geometry: geometry as unknown as SpatialRuntimeAsset["geometry"], data };
  } else {
    const [payload, sidecar] = await Promise.all([
      loadCountryElementEntitiesV122(country, layer.entityJoinV157_2?.hostElementId || layer.elementId),
      layer.locationsUrl
        ? (isDefault
            ? loadVietnamLocationsV151(layer.locationsUrl, signal)
            : loader.loadLocations(layer.locationsUrl, signal)
          ).catch(() => undefined)
        : Promise.resolve(undefined),
    ]);
    records = layer.entityJoinV157_2
      ? applyNationalMineJoinV157_2(payload.records, layer.entityJoinV157_2)
      : payload.records;
    locations = sidecar;
  }
  const [reference, geometry34, region6] = await Promise.all([referenceRequest, geometry34Request, region6Request]);
  if (signal.aborted) throw abortErrorV163();
  return {
    spatial,
    records,
    locations,
    reference,
    boundary: { system: boundarySystem, geometry34, region6 },
  };
}
