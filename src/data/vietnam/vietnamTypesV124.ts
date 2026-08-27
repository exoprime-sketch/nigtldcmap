import type {
  PackageCoverageStatus,
  RecordLoadStatus,
  VietnamAssetErrorCodeV121,
  VietnamDataSectionV121,
  VietnamEntityV121,
  VietnamIndicatorMetaV121,
  VietnamMapLayerV121,
  VietnamObservationV121,
} from "./vietnamTypesV121";

export type VietnamElementPublicStatusV124 =
  | "actual"
  | "partial"
  | "public-authorized"
  | "schema-only"
  | "data-entry-planned"
  | "not-collected"
  | "quarantined";

export interface VietnamPublicationDecisionRefV124 {
  decisionId: string;
  decision?: string;
  approvedAt?: string;
  approvedByRole?: string;
  displayAllowed: boolean;
  downloadAllowed: boolean;
  contactFieldsAllowed?: boolean;
  sourceLicensePreserved?: boolean;
  sourceAttributionRequired?: boolean;
}

export interface VietnamDownloadAssetV124 {
  format: string;
  url: string;
  mediaType?: string;
  byteSize?: number;
  sha256?: string;
  recordCount?: number;
}

export type VietnamDataAssetRefV124 = {
  provider: "vietnam-v124";
  elementId: string;
  section?: VietnamDataSectionV121;
};

/**
 * V124 keeps the normalized V121 record fields so existing renderers remain
 * compatible. Publication approval is additive and never replaces source
 * license or attribution metadata.
 */
export type VietnamObservationV124 = VietnamObservationV121 & {
  publicationDecision?: VietnamPublicationDecisionRefV124 | null;
};

export type VietnamEntityV124 = VietnamEntityV121 & {
  publicationDecision?: VietnamPublicationDecisionRefV124 | null;
};

export type VietnamIndicatorMetaV124 = VietnamIndicatorMetaV121 & {
  publicationDecision?: VietnamPublicationDecisionRefV124 | null;
};

export interface VietnamCatalogElementV124 {
  elementId: string;
  elementLabel: string;
  categoryCode: string;
  categoryLabel: string;
  sectionCode: string;
  sectionLabel: string;
  groupCode: string;
  groupLabel: string;
  packageStatus: PackageCoverageStatus;
  publicStatus: VietnamElementPublicStatusV124;
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
  displayAllowed: boolean;
  downloadAllowed: boolean;
  publicationDecision?: VietnamPublicationDecisionRefV124 | null;
  dataPresenceStatus?: string | null;
  emptyReason?: string | null;
  spatialAvailability?: string | null;
  downloadAssets?: VietnamDownloadAssetV124[];
  hasWarnings: boolean;
  qualityIssueCount: number;
  nonstandardRowCount?: number;
  packageReason: string;
  assetRef: VietnamDataAssetRefV124;
}

export interface VietnamElementMetaBundleV124 {
  schemaVersion: "v124";
  element: VietnamCatalogElementV124;
  indicators: VietnamIndicatorMetaV124[];
  sourceRegistryIds: string[];
  rights: VietnamCatalogElementV124["rights"];
  publicationDecision?: VietnamPublicationDecisionRefV124 | null;
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
    placeholderRows?: number;
    quarantinedRows?: number;
  };
  package: {
    sourcePackage: string;
    sourceFileOriginal: string;
    sourceFileDecoded: string;
  };
}

export interface VietnamElementDataBundleV124<T> {
  schemaVersion: "v124";
  elementId: string;
  recordCount: number;
  records: T[];
}

export interface VietnamElementShardPayloadV124 {
  meta: VietnamElementMetaBundleV124;
  observations: VietnamElementDataBundleV124<VietnamObservationV124>;
  entities: VietnamElementDataBundleV124<VietnamEntityV124>;
}

export const VIETNAM_DATA_RUNTIME_VERSION_V124 =
  "v124-gzip-json-envelope-v1" as const;

export type VietnamAssetErrorCodeV124 = VietnamAssetErrorCodeV121;

export interface VietnamShardV124 {
  schemaVersion: "v124";
  runtimeVersion: typeof VIETNAM_DATA_RUNTIME_VERSION_V124;
  assetLayoutVersion: "sharded-element-bundles-v2";
  shardId: string;
  elementIds: string[];
  elements: Record<string, VietnamElementShardPayloadV124>;
}

export interface VietnamShardEnvelopeV124 {
  schemaVersion: "v124";
  runtimeVersion: typeof VIETNAM_DATA_RUNTIME_VERSION_V124;
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

export interface VietnamBundleIndexElementV124 {
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
  publicStatus: VietnamElementPublicStatusV124;
}

export interface VietnamBundleIndexPackV124 {
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

export interface VietnamBundleIndexV124 {
  schemaVersion: "v124";
  runtimeVersion: typeof VIETNAM_DATA_RUNTIME_VERSION_V124;
  assetLayoutVersion: "gzip-base64-json-envelope-v2";
  elementCount: 152;
  packCount: number;
  totals: {
    meta: number;
    observations: number;
    entities: number;
    allRows?: number;
    metadata?: number;
    rawSourceRows?: Record<string, number>;
    nonPublicRecordRows?: Record<string, number>;
  };
  packs: VietnamBundleIndexPackV124[];
  elements: Record<string, VietnamBundleIndexElementV124>;
}

export interface VietnamManifestV124 {
  schemaVersion: "v124";
  runtimeVersion: typeof VIETNAM_DATA_RUNTIME_VERSION_V124;
  assetLayoutVersion: "gzip-base64-json-envelope-v2";
  generatedAt: string;
  country: { iso3: "VNM"; nameKo: string; nameEn: string };
  sourcePackage: string;
  workbookFiles: number;
  frameworkElements: number;
  accountedElements: number;
  unexplainedElements: number;
  bundleIndexElements: number;
  packCount: number;
  shardCount: number;
  rawRows: {
    observations: number;
    entities: number;
    metadata: number;
    total: number;
    normalizedCoreRows?: number;
    nonstandardRows?: number;
  };
  rowKinds?: Record<string, number>;
  loadStatusCounts?: Record<RecordLoadStatus, number>;
  publicStatusCounts: Record<VietnamElementPublicStatusV124, number>;
  packageStatusCounts: Record<string, number>;
  mapLayerCount: number;
  mapFeatureCount: number;
  downloadableElementCount: number;
  rightsMetadataRows?: number;
  rowBalance: {
    sourceOriginalRows: number;
    processedRows: number;
    matches: boolean;
    originalRows?: number;
  };
  assets: Record<string, string | string[]>;
  assetTransport?: Record<string, string | number>;
  platformRelease?: string;
  dataSchemaVersion?: string;
  countryRuntimeVersion?: string;
}

export type VietnamMapLayerV124 = Omit<
  VietnamMapLayerV121,
  "assetRef"
> & {
  assetRef: VietnamDataAssetRefV124;
};

export interface VietnamQualityReportV124 {
  schemaVersion: "v124";
  summary: Record<string, number | boolean>;
  checks: Record<string, boolean>;
  warningsByCode: Record<string, number>;
  commonSchemaConflicts?: number;
  quarantineCount: number;
  quarantineReason?: string;
}
