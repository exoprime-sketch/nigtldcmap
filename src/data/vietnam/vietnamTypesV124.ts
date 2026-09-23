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
    | "regional-scope"
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

export type VietnamMapRendererV124 =
  | "point"
  | "cluster"
  | "line"
  | "admin1-choropleth"
  | "partial-choropleth"
  | "regional-scope";

export interface VietnamMapSelectorOptionV124 {
  key: string;
  /** V138: the measure this option carries when a layer crosses measures with scenarios. */
  measureKey?: string;
  /** V138: the scenario this option carries, or null for a single-track layer. */
  scenario?: string | null;
  /**
   * A stable name for the measure, independent of the label and the key.
   *
   * `key` is a slug of the label and falls back to a hash for non-ASCII, so it
   * moves whenever the label does. This comes from the derivation contract and
   * is what a preset or a saved view should reference. Absent where the
   * indicator ids behind a variable do not agree on one measure.
   */
  measureId?: string | null;
  label: string;
  unit: string;
  periods: string[];
  maxFeatureCount?: number;
}

export interface VietnamMapSelectorsV124 {
  variables: VietnamMapSelectorOptionV124[];
  periods: string[];
  defaultVariable: string;
  defaultPeriod: string;
  /**
   * V138: a layer whose variables are measure x scenario states both axes, so
   * the controls can offer two short lists instead of one long one.
   */
  variableGroups?: {
    measures: Array<{ key: string; label: string; unit: string; measureId?: string }>;
    scenarios: Array<{ key: string; label: string }>;
    measureLabel: string;
    scenarioLabel: string;
  };
}

/** V138: how several source rows become one map feature. */
export interface VietnamMapFeatureIdentityV138 {
  sources: string[];
  label: string;
  memberLabel?: string;
}

/** V138: the 43-target contract facts carried on a layer for the panel. */
export interface VietnamMapTargetFactsV138 {
  sourceSpatialUnit: string;
  displaySpatialUnit: string;
  limitation: string;
  evidence: string;
  representativeItem: string;
}

export interface VietnamMapJoinV124 {
  requiredCount: number;
  matchedCount: number;
  missingCount?: number;
  failures: string[];
}

export type VietnamMapLayerV124 = Omit<VietnamMapLayerV121, "assetRef"> & {
  assetRef: VietnamDataAssetRefV124;
  active?: boolean;
  enabled?: boolean;
  disabledReason?: string;
  renderer: VietnamMapRendererV124;
  geometryUrl?: string;
  dataUrl?: string;
  selectors: VietnamMapSelectorsV124;
  unit: string;
  source: string;
  sourceUrls?: string[];
  sourceYear?: number | string | null;
  licenses?: string[];
  license?: string;
  spatialCoverage: string;
  missingRegions: string[];
  accuracyNotice: string;
  detailElementId: string;
  detailUrl: string;
  downloadStatus: "available" | "source-restricted" | "unavailable";
  join: VietnamMapJoinV124;
  fakeGeometryCount: number;
  zeroImputationCount: number;
  spatialScopeType:
    | "facility-site"
    | "project-site"
    | "multi-site"
    | "admin1"
    | "region"
    | "country"
    | "multi-country-regional"
    | "network"
    | "raster"
    | "unknown";
  coordinateMeaning:
    | "verified-physical-site"
    | "verified-activity-site"
    | "verified-network-geometry"
    | "source-region-value"
    | "project-country-scope"
    | "first-source-coordinate"
    | "representative-coordinate"
    | "centroid"
    | "unknown";
  scopeCountries: string[];
  sourceCoordinateCount: number;
  displayedCoordinateCount: number;
  regionalProject: boolean;
  aggregationLevel: string;
  publicSpatialNotice: string;
  mapBenefit?: string;
  spatialLimitation?: string;
  /** V138 point layers: the noun a count of features takes (곳, 건, 개 기관). */
  countNoun?: string;
  /** V138 point layers: what the 항목 row of the analysis panel names. */
  analysisItemLabel?: string;
  featureIdentity?: VietnamMapFeatureIdentityV138;
  displayScope?: {
    withinCountryOnly: boolean;
    bbox: { west: number; east: number; south: number; north: number };
  };
  excludeWhere?: Record<string, string>;
  approximateLocation?: { sourceKey?: string; pattern?: string; always?: boolean; label?: string };
  memberSeries?: {
    valueKey: string;
    unit: string;
    scenarioKey: string;
    quantileKey: string;
    periodKey: string;
    confidenceKey?: string;
  };
  memberFacts?: { labelKey: string; valueKey: string; unitKey: string };
  symbolByFact?: { key: string; approxPattern?: string };
  memberRowCount?: number;
  memberRecordsInAsset?: boolean;
  sharedObjectsWith?: string;
  sharedObjectKind?: "document" | "facility-register";
  mapTargetV138?: VietnamMapTargetFactsV138;
  /**
   * V151-2: how the layer's 63-keyed values may be shown per 2025 34-unit.
   * Generated by scripts/v138/build-map-layers-v138.mjs from the target
   * contract; the runtime never infers it.
   */
  boundaryPolicy?: VietnamBoundaryPolicyV151;
  /** V151-2 point layers: recordId -> province/unit the coordinate falls in. */
  locationsUrl?: string;
  locationCounts?: { located: number; outside: number; withoutCoordinate: number };
};

export type VietnamBoundaryPolicyKindV151 =
  | "sum"
  | "area-weighted-mean"
  | "member-max"
  | "member-min"
  | "range-only"
  | "count-sum"
  | "membership-or"
  | "native-34"
  | "six-region-only"
  | "none";

export interface VietnamBoundaryPolicyV151 {
  schema: "boundary-policy-v151-2";
  kind: VietnamBoundaryPolicyKindV151;
  /** Per measure key (scenario suffix stripped) when one layer mixes rules. */
  byVariable?: Record<string, VietnamBoundaryPolicyKindV151>;
  note: string;
  valueSystem: "pre-2025-63" | "post-2025-34" | "gdl-six-region";
}

export interface VietnamLocationSidecarV151 {
  schemaVersion: "v151-2-locations-1";
  elementId: string;
  method: string;
  notice: string;
  counts: { located: number; outside: number; withoutCoordinate: number };
  byRecordId: Record<string, { adm1Code: string; adm1Name: string; unitCode: string | null } | null>;
}

export interface VietnamSpatialValueV124 {
  adm1Code: string;
  adm1Name: string;
  variable: string;
  variableLabel: string;
  period: string;
  value: number;
  unit?: string | null;
  sourceIndicatorId?: string | null;
  sourceRecordId?: string | null;
  sourceSpatialUnit: "admin1" | "region";
  sourceRegion?: string;
  mappingMethod?: string;
  imputed: false;
}

export interface VietnamSpatialLayerAssetV124 {
  schemaVersion: "v124";
  assetSchemaVersion: "v124-spatial-layer-1";
  countryIso3: "VNM";
  elementId: string;
  geometryUrl: string;
  joinKey: "adm1Code";
  boundarySystem: "pre-2025-63";
  coverageKind: "full" | "partial";
  selectors: VietnamMapSelectorsV124;
  values: VietnamSpatialValueV124[];
  /**
   * V138: the same values as a table, for layers whose row form would be
   * tens of thousands of objects. The loader expands it into `values`.
   */
  valueTable?: {
    adm1Codes: string[];
    adm1Names: string[];
    sourceSpatialUnit: "admin1" | "region";
    series: Array<{
      variable: string;
      variableLabel: string;
      unit: string | null;
      period: string;
      sourceIndicatorId: string | null;
      values: Array<number | null>;
    }>;
  };
  /** V138: the source rows behind a province value - local documents, PPP projects. */
  memberRecords?: Record<
    string,
    Array<{
      recordId: string;
      label: string;
      date?: string;
      status?: string;
      value?: string;
      url?: string;
      region?: string;
      indicatorId?: string;
    }>
  >;
  seriesCoverage: Array<{
    variable: string;
    period: string;
    expectedCount: 63;
    matchedCount: number;
    missingCount: number;
    failureCount: 0;
  }>;
  validation: {
    publishedValueCount: number;
    matchedAdm1Count: number;
    joinFailureCount: 0;
    duplicateValueCount: number;
    fakeGeometryCount: 0;
    zeroImputationCount: 0;
    maxSeriesFeatureCount: number;
    mappingMethod?: string;
    sourceRegionCount?: number;
  };
}

export interface VietnamQualityReportV124 {
  schemaVersion: "v124";
  summary: Record<string, number | boolean>;
  checks: Record<string, boolean>;
  warningsByCode: Record<string, number>;
  commonSchemaConflicts?: number;
  quarantineCount: number;
  quarantineReason?: string;
}
