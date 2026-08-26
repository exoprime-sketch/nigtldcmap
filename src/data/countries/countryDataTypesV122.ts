import type {
  VietnamCatalogElementV121,
  VietnamElementShardPayloadV121,
  VietnamEntityV121,
  VietnamMapLayerV121,
  VietnamManifestV121,
} from "../vietnam/vietnamTypesV121";

export const PLATFORM_RELEASE_V122 = "v122" as const;
export const COUNTRY_DATA_RUNTIME_VERSION_V122 =
  "country-data-runtime-v1" as const;

export type CountryDataAvailabilityV122 =
  | "available"
  | "partial"
  | "metadata-only"
  | "unavailable";

export interface CountryMapViewV122 {
  center: [number, number];
  zoom: number;
  bounds?: [[number, number], [number, number]];
}

export interface CountryCatalogItemV122 {
  providerId: string;
  countryIso3: string;
  countryNameKo: string;
  countryNameEn: string;
  elementId: string;
  publicSlug: string;
  rawLabel: string;
  publicTitle: string;
  publicShortTitle: string;
  publicDescription: string;
  categoryCode: string;
  categoryLabel: string;
  sectionCode: string;
  sectionLabel: string;
  groupCode: string;
  groupLabel: string;
  latestYear?: number | string | null;
  sourceOrganizations: string[];
  sourceUrls: string[];
  technologyIds: string[];
  hasPublicData: boolean;
  hasMapData: boolean;
  hasDownloadableData: boolean;
  observationCount: number;
  entityCount: number;
  mapFeatureCount: number;
  downloadableRecordCount: number;
  raw: VietnamCatalogElementV121;
}

export interface CountrySearchEntryV122 {
  providerId: string;
  countryIso3: string;
  elementId: string;
  publicSlug: string;
  publicTitle: string;
  searchText: string;
  keywords: string[];
}

export interface CountryMapLayerV122 extends VietnamMapLayerV121 {
  providerId: string;
  countryIso3: string;
  countryNameKo: string;
  publicTitle: string;
  publicShortTitle: string;
}

export type CountryElementBundleV122 = VietnamElementShardPayloadV121;
export type CountryEntityV122 = VietnamEntityV121;
export type CountryManifestV122 = VietnamManifestV121;

export interface CountryDataProviderV122 {
  providerId: string;
  countryIso3: string;
  countryNameKo: string;
  countryNameEn: string;
  countryPublicSlug: string;
  dataSchemaVersion: string;
  manifestUrl: string;
  availability: CountryDataAvailabilityV122;
  mapView: CountryMapViewV122;
  loadManifest(): Promise<CountryManifestV122>;
  loadCatalog(): Promise<CountryCatalogItemV122[]>;
  loadSearchIndex(): Promise<Map<string, CountrySearchEntryV122>>;
  loadMapIndex(): Promise<CountryMapLayerV122[]>;
  loadElementBundle(elementId: string): Promise<CountryElementBundleV122>;
  loadElementEntities(elementId: string): Promise<{
    schemaVersion: "v121";
    elementId: string;
    recordCount: number;
    records: CountryEntityV122[];
  }>;
  loadSourceRegistry<T = unknown>(): Promise<T>;
  resolveElementId(token: string | null | undefined): string | null;
  publicElementToken(elementId: string): string;
  clearCache(): void;
}
