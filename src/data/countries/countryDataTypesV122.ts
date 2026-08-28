import type {
  VietnamCatalogElementV124,
  VietnamDownloadAssetV124,
  VietnamElementPublicStatusV124,
  VietnamElementShardPayloadV124,
  VietnamEntityV124,
  VietnamMapLayerV124,
  VietnamManifestV124,
} from "../vietnam/vietnamTypesV124";

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
  publicStatus: VietnamElementPublicStatusV124;
  publicStatusLabel: string;
  dataPresenceStatus?: string | null;
  emptyReason?: string | null;
  displayAllowed: boolean;
  downloadAllowed: boolean;
  isDiscoverable: boolean;
  hasPublicData: boolean;
  hasMapData: boolean;
  hasDownloadableData: boolean;
  observationCount: number;
  entityCount: number;
  mapFeatureCount: number;
  downloadableRecordCount: number;
  downloadAssets: VietnamDownloadAssetV124[];
  raw: VietnamCatalogElementV124;
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

export interface CountryMapLayerV122 extends VietnamMapLayerV124 {
  providerId: string;
  countryIso3: string;
  countryNameKo: string;
  publicTitle: string;
  publicShortTitle: string;
}

export type CountryElementBundleV122 = VietnamElementShardPayloadV124;
export type CountryEntityV122 = VietnamEntityV124;
export type CountryManifestV122 = VietnamManifestV124;

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
    schemaVersion: "v124";
    elementId: string;
    recordCount: number;
    records: CountryEntityV122[];
  }>;
  loadSourceRegistry<T = unknown>(): Promise<T>;
  resolveElementId(token: string | null | undefined): string | null;
  publicElementToken(elementId: string): string;
  clearCache(): void;
}
