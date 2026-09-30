/**
 * The default country's data loader, under the names its callers have used
 * since V124.
 *
 * V158 moved the loader itself to `countries/countryDataLoaderV158.ts`, where
 * each country gets its own instance (paths from the registry, its own
 * manifest and index caches, element payloads keyed by country). This module
 * keeps every exported name and signature and delegates to the default
 * country's instance, so the map, mini map, detail and provider code that
 * imports from here behaves exactly as before.
 */
import {
  countryDataLoaderV158,
  type CountryMapGeoJsonV158,
} from "../countries/countryDataLoaderV158";
import { DEFAULT_COUNTRY_ISO3_V158 } from "../countryContext";
import type {
  VietnamBundleIndexV124,
  VietnamCatalogElementV124,
  VietnamElementDataBundleV124,
  VietnamElementMetaBundleV124,
  VietnamElementShardPayloadV124,
  VietnamEntityV124,
  VietnamLocationSidecarV151,
  VietnamManifestV124,
  VietnamMapLayerV124,
  VietnamObservationV124,
  VietnamQualityReportV124,
  VietnamSpatialLayerAssetV124,
} from "./vietnamTypesV124";

export {
  VietnamAssetErrorV124,
  isVietnamAssetErrorV124,
  publicVietnamDataErrorMessageV124,
} from "../countries/countryDataLoaderV158";

export type VietnamMapGeoJsonV124 = CountryMapGeoJsonV158;

const loader = () => countryDataLoaderV158(DEFAULT_COUNTRY_ISO3_V158);

export function loadVietnamManifestV124(): Promise<VietnamManifestV124> {
  return loader().loadManifest();
}

export function loadVietnamBundleIndexV124(): Promise<VietnamBundleIndexV124> {
  return loader().loadBundleIndex();
}

export function loadVietnamQualityReportV124(): Promise<VietnamQualityReportV124> {
  return loader().loadQualityReport();
}

export function loadVietnamMapIndexV124(): Promise<VietnamMapLayerV124[]> {
  return loader().loadMapIndex();
}

export function loadVietnamSpatialLayerV124(
  dataUrl: string,
  signal?: AbortSignal
): Promise<VietnamSpatialLayerAssetV124> {
  return loader().loadSpatialLayer(dataUrl, signal);
}

/**
 * V151-2: the province and 34-unit each point record sits in, built at
 * publish time by point-in-polygon. Cached like any other static asset.
 */
export function loadVietnamLocationsV151(
  locationsUrl: string,
  signal?: AbortSignal
): Promise<VietnamLocationSidecarV151> {
  return loader().loadLocations(locationsUrl, signal);
}

export function loadVietnamSpatialGeoJsonV124(
  geometryUrl: string,
  signal?: AbortSignal
): Promise<VietnamMapGeoJsonV124> {
  return loader().loadSpatialGeoJson(geometryUrl, signal);
}

export function loadVietnamCatalogV124(): Promise<VietnamCatalogElementV124[]> {
  return loader().loadCatalog();
}

export function loadVietnamSearchIndexV124(): Promise<
  Map<string, { searchText: string; keywords: string[] }>
> {
  return loader().loadSearchIndex();
}

export function loadVietnamSourceRegistryV124<T = unknown>(): Promise<T> {
  return loader().loadSourceRegistry<T>();
}

export function loadVietnamElementMetaV124(
  elementId: string
): Promise<VietnamElementMetaBundleV124> {
  return loader().loadElementMeta(elementId);
}

export function loadVietnamElementObservationsV124(
  elementId: string
): Promise<VietnamElementDataBundleV124<VietnamObservationV124>> {
  return loader().loadElementObservations(elementId);
}

export function loadVietnamElementEntitiesV124(
  elementId: string
): Promise<VietnamElementDataBundleV124<VietnamEntityV124>> {
  return loader().loadElementEntities(elementId);
}

export function loadVietnamElementBundleV124(
  elementId: string
): Promise<VietnamElementShardPayloadV124> {
  return loader().loadElementBundle(elementId);
}

export function clearVietnamDataCacheV124(): void {
  loader().clearCache();
}
