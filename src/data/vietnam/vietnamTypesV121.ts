export type PackageCoverageStatus =
  | "provided"
  | "merged-into-another-element"
  | "not-collected"
  | "not-applicable"
  | "missing-from-package"
  | "framework-only";

export type VietnamElementPublicStatus =
  | "actual"
  | "partial"
  | "metadata-only"
  | "not-in-package";

export type VietnamDataSectionV121 =
  | "bundle"
  | "meta"
  | "observations"
  | "entities";

export type VietnamDataAssetRefV121 = {
  provider: "vietnam-v121";
  elementId: string;
  section?: VietnamDataSectionV121;
};

export type RecordLoadStatus =
  | "published"
  | "published-with-warning"
  | "metadata-only"
  | "quarantined";

export type VietnamRecordProvenanceV121 = {
  sourcePackage: "vietnam-data.zip";
  sourceFileOriginal: string;
  sourceFileDecoded: string;
  sourceSheet: string;
  sourceRow: number;
  elementId: string;
  indicatorId?: string | null;
  sourceOrg?: string | null;
  sourceUrl?: string | null;
  citationLocator?: string | null;
  referenceYear?: string | null;
  licenseCode?: string | null;
  redistributionAllowed?: string | null;
  downloadAllowed?: string | null;
};

export type VietnamObservationV121 = {
  recordId: string;
  elementId: string;
  indicatorId: string;
  countryIso3: string;
  year?: number | null;
  period?: string | null;
  value: number | string | boolean | null;
  rawValue?: string | null;
  unit?: string | null;
  missingReasonCode?: string | null;
  note?: string | null;
  loadStatus: RecordLoadStatus;
  warnings: string[];
  rightsStatus: string;
  rightsNote: string;
  downloadEligible: boolean;
  countryRole?: string;
  provenance: VietnamRecordProvenanceV121;
};

export type VietnamEntityV121 = {
  recordId: string;
  elementId: string;
  indicatorId?: string | null;
  countryIso3?: string | null;
  entityType: string;
  name?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  geometryType?: string | null;
  crs?: string | null;
  geometry?: GeoJSON.Geometry | null;
  normalizedAttributes: Record<string, unknown>;
  rawAttributes: Record<string, unknown>;
  missingReasonCode?: string | null;
  note?: string | null;
  loadStatus: RecordLoadStatus;
  warnings: string[];
  rightsStatus: string;
  rightsNote: string;
  downloadEligible: boolean;
  mapEligible: boolean;
  countryRole?: string;
  originalIndicatorId?: string | null;
  indicatorRelationIds?: string[];
  noteFields?: Record<string, unknown>;
  coordinateQuality?: string | null;
  mapEligibilityReason?: string;
  geometryCompleteness?: string;
  coordinateSelectionNote?: string;
  normalizationNote?: string;
  provenance: VietnamRecordProvenanceV121;
};

export type VietnamIndicatorMetaV121 = {
  elementId: string;
  indicatorId: string;
  labelKo: string;
  labelEn?: string | null;
  technologyIds: string[];
  unit?: string | null;
  dataType: string;
  unitDetail?: string | null;
  sourceOrg: string;
  sourceSeriesId?: string | null;
  sourceUrl?: string | null;
  apiEndpoint?: string | null;
  apiParams?: string | null;
  sourceGrade?: string | null;
  citationLocator?: string | null;
  timeRange?: string | null;
  timeInterval?: string | null;
  referenceYear?: string | null;
  spatialResolution?: string | null;
  spatialUnit?: string | null;
  crs?: string | null;
  licenseCode?: string | null;
  redistributionAllowed?: string | null;
  downloadAllowed?: string | null;
  attributionText?: string | null;
  licenseUrl?: string | null;
  comparabilityFlag?: string | null;
  missingReasonCode?: string | null;
  missingNote?: string | null;
  caveat?: string | null;
  loadStatus: RecordLoadStatus;
  warnings: string[];
  provenance: VietnamRecordProvenanceV121;
  extraMeta: Record<string, unknown>;
};

export type VietnamElementUseV121 = {
  elementId: string;
  packageStatus: PackageCoverageStatus;
  publicStatus: VietnamElementPublicStatus;
  dataFind: boolean;
  detail: boolean;
  mapLayer: boolean;
  mapPanel: boolean;
  comparison: boolean;
  download: boolean;
  sourceOnly: boolean;
  detailTemplate:
    | "indicator"
    | "composition"
    | "spatial"
    | "entity"
    | "policy"
    | "technology-demand"
    | "project"
    | "finance"
    | "partner";
  mapMode:
    | "choropleth"
    | "point"
    | "cluster"
    | "line"
    | "polygon"
    | "raster"
    | "country-aggregate"
    | "panel-only"
    | "not-applicable";
  reason: string;
};

export interface VietnamCatalogElementV121 {
  elementId: string;
  elementLabel: string;
  categoryCode: string;
  categoryLabel: string;
  sectionCode: string;
  sectionLabel: string;
  groupCode: string;
  groupLabel: string;
  packageStatus: PackageCoverageStatus;
  publicStatus: VietnamElementPublicStatus;
  detailTemplate: VietnamElementUseV121["detailTemplate"];
  mapMode: VietnamElementUseV121["mapMode"];
  latestYear?: number | string | null;
  referenceYears: string[];
  dataTypes: string[];
  spatialUnits: string[];
  sourceOrganizations: string[];
  sourceUrls: string[];
  technologyIds: string[];
  indicatorCount: number;
  availableIndicatorCount: number;
  observationCount: number;
  entityCount: number;
  mapFeatureCount: number;
  downloadableRecordCount: number;
  rights: {
    status: string;
    redistributionAllowedValues: string[];
    downloadAllowedValues: string[];
    licenses: string[];
    attributionTexts: string[];
  };
  hasWarnings: boolean;
  qualityIssueCount: number;
  nonstandardRowCount?: number;
  packageReason: string;
  assetRef: VietnamDataAssetRefV121;
}

export interface VietnamElementMetaBundleV121 {
  schemaVersion: "v121";
  element: VietnamCatalogElementV121;
  indicators: VietnamIndicatorMetaV121[];
  sourceRegistryIds: string[];
  rights: VietnamCatalogElementV121["rights"];
  fieldDefinitions?: Array<{
    sourceField: string;
    label: string;
    normalizedKey: string;
  }>;
  rowAccounting?: {
    normalizedObservationRows: number;
    normalizedEntityRows: number;
    metadataRows: number;
    nonstandardRows: number;
  };
  package: {
    sourcePackage: "vietnam-data.zip";
    sourceFileOriginal: string;
    sourceFileDecoded: string;
  };
}

export interface VietnamElementDataBundleV121<T> {
  schemaVersion: "v121";
  elementId: string;
  recordCount: number;
  records: T[];
}

export interface VietnamElementShardPayloadV121 {
  meta: VietnamElementMetaBundleV121;
  observations: VietnamElementDataBundleV121<VietnamObservationV121>;
  entities: VietnamElementDataBundleV121<VietnamEntityV121>;
}

export const VIETNAM_DATA_RUNTIME_VERSION_V121 =
  "v121r2-json-envelope" as const;

export type VietnamAssetErrorCodeV121 =
  | "ASSET_NOT_FOUND"
  | "ASSET_HTTP_ERROR"
  | "ASSET_HTML_FALLBACK"
  | "ASSET_EMPTY"
  | "ASSET_ENVELOPE_INVALID"
  | "ASSET_BASE64_INVALID"
  | "ASSET_COMPRESSED_SIZE_MISMATCH"
  | "ASSET_COMPRESSED_HASH_MISMATCH"
  | "ASSET_DECOMPRESSION_UNSUPPORTED"
  | "ASSET_DECOMPRESSION_FAILED"
  | "ASSET_CONTENT_SIZE_MISMATCH"
  | "ASSET_CONTENT_HASH_MISMATCH"
  | "ASSET_JSON_INVALID"
  | "ASSET_SCHEMA_INVALID"
  | "ELEMENT_ID_INVALID"
  | "ELEMENT_NOT_INDEXED"
  | "ELEMENT_NOT_IN_PACK";

export interface VietnamShardV121 {
  schemaVersion: "v121";
  assetLayoutVersion: "sharded-element-bundles-v1";
  shardId: string;
  elementIds: string[];
  elements: Record<string, VietnamElementShardPayloadV121>;
}

export interface VietnamShardEnvelopeV121R2 {
  schemaVersion: "v121";
  runtimeVersion: typeof VIETNAM_DATA_RUNTIME_VERSION_V121;
  transportEncoding: "gzip-base64-chunks-v2";
  resourceType: "element-shard" | "search-index" | "source-registry";
  shardId: string;
  compressedByteSize: number;
  compressedSha256: string;
  contentByteSize: number;
  contentSha256: string;
  payloadChunkCount: number;
  payloadChunks: string[];
}

export interface VietnamBundleIndexElementV121 {
  elementId: string;
  shardId: string;
  packUrl: string;
  metaCount: number;
  observationCount: number;
  entityCount: number;
  envelopeByteSize: number;
  compressedByteSize: number;
  compressedSha256: string;
  contentByteSize: number;
  contentSha256: string;
  packageStatus: PackageCoverageStatus;
  publicStatus: VietnamElementPublicStatus;
}

export interface VietnamBundleIndexPackV121 {
  shardId: string;
  packUrl: string;
  envelopeByteSize: number;
  compressedByteSize: number;
  compressedSha256: string;
  contentByteSize: number;
  contentSha256: string;
  elementIds: string[];
  metaCount: number;
  observationCount: number;
  entityCount: number;
}

export interface VietnamBundleIndexV121 {
  schemaVersion: "v121";
  runtimeVersion: typeof VIETNAM_DATA_RUNTIME_VERSION_V121;
  assetLayoutVersion: "gzip-base64-json-envelope-v2";
  elementCount: 152;
  packCount: number;
  totals: {
    metadata: number;
    observations: number;
    entities: number;
    allRows: number;
    rawSourceRows?: Record<string, number>;
    nonPublicRecordRows?: Record<string, number>;
  };
  packs: VietnamBundleIndexPackV121[];
  elements: Record<string, VietnamBundleIndexElementV121>;
}

export interface VietnamManifestV121 {
  schemaVersion: "v121";
  platformRelease?: "v122";
  dataSchemaVersion?: "v121";
  countryRuntimeVersion?: "country-data-runtime-v1";
  runtimeVersion: typeof VIETNAM_DATA_RUNTIME_VERSION_V121;
  assetLayoutVersion: "gzip-base64-json-envelope-v2";
  bundleIndexElements: number;
  packCount: number;
  shardCount: number;
  generatedAt: string;
  country: { iso3: "VNM"; nameKo: string; nameEn: string };
  sourcePackage: "vietnam-data.zip";
  workbookFiles: number;
  frameworkElements: number;
  accountedElements: number;
  unexplainedElements: number;
  rawRows: {
    observations: number;
    entities: number;
    metadata: number;
    total: number;
    normalizedCoreRows: number;
    nonstandardRows: number;
  };
  rowKinds: Record<string, number>;
  loadStatusCounts: Record<RecordLoadStatus, number>;
  publicStatusCounts: Record<VietnamElementPublicStatus, number>;
  packageStatusCounts: Record<string, number>;
  mapLayerCount: number;
  mapFeatureCount: number;
  downloadableElementCount: number;
  rightsMetadataRows: number;
  rowBalance: { originalRows: number; processedRows: number; matches: boolean };
  assets: Record<string, string | string[]>;
  assetTransport?: Record<string, string | number>;
}

export interface VietnamMapFilterV121 {
  field: string;
  label: string;
  values: string[];
}

export type VietnamMapVisualizationKindV123 =
  | "entity-points"
  | "external-line"
  | "admin1-choropleth"
  | "region-choropleth";

export interface VietnamMapSeriesOptionV123 {
  key: string;
  label: string;
  indicatorPrefix?: string;
}

export interface VietnamMapExternalGeoJsonV123 {
  url: string;
  label: string;
  note?: string;
}

export interface VietnamMapVisualizationV123 {
  kind: VietnamMapVisualizationKindV123;
  geometrySource?: "admin1-pre2025" | "external-geojson";
  geojsonUrls?: VietnamMapExternalGeoJsonV123[];
  selectorStrategy?: "prefix-options" | "label-base";
  options?: VietnamMapSeriesOptionV123[];
  defaultSeriesKey?: string;
  joinMode?: "label-suffix" | "label-parenthetical" | "gdl-region";
  nameProperty?: string;
  coverageNote?: string;
}

export type VietnamSpatialReadinessV123 =
  | "ready"
  | "partial"
  | "external-geometry"
  | "requires-geometry"
  | "requires-raw-grid"
  | "country-aggregate"
  | "non-spatial"
  | "not-applicable";

export interface VietnamMapLayerV121 {
  layerId: string;
  elementId: string;
  label: string;
  rawLabel?: string;
  publicShortTitle?: string;
  category: string;
  mapMode: "point" | "cluster" | "line" | "choropleth" | "region-choropleth";
  geometryTypes: string[];
  featureCount: number;
  totalEntityCount: number;
  downloadableRecordCount?: number;
  assetRef: VietnamDataAssetRefV121;
  sourceOrganizations: string[];
  latestYear?: number | string | null;
  tooltipFields: string[];
  defaultPrimary: boolean;
  defaultOverlay: boolean;
  cluster: boolean;
  filters: VietnamMapFilterV121[];
  legend: { title: string; note: string };
  spatialStatus?: VietnamSpatialReadinessV123;
  visualization?: VietnamMapVisualizationV123;
}

export interface VietnamQualityReportV121 {
  schemaVersion: "v121";
  summary: Record<string, number | boolean>;
  checks: Record<string, boolean>;
  warningsByCode: Record<string, number>;
  commonSchemaConflicts: number;
  quarantineCount: number;
  quarantineReason: string;
}
