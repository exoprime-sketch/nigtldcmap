import type { CategoryCode } from "../data/publicTaxonomy";
import type {
  DataRepresentationType,
  DataViewTemplate,
  DatasetCapabilities,
  DatasetCompareConfig,
  DatasetInsightConfig,
  DatasetMapConfig,
} from "./dataView";

export type {
  DataRepresentationType,
  DataViewTemplate,
  DatasetCapabilities,
  DatasetCompareConfig,
  DatasetInsightConfig,
  DatasetMapConfig,
} from "./dataView";

export type RightsStatus =
  | "allowed"
  | "metadata_only"
  | "restricted"
  | "rights_unknown";

export type DatasetType =
  | "표"
  | "문서"
  | "벡터"
  | "래스터"
  | "API"
  | "시계열"
  | "정책근거"
  | "포트폴리오";

export type DatasetSourceType =
  | "official_public"
  | "official_document"
  | "international_organization"
  | "local_research"
  | "private_source"
  | "synthetic_example";

export type DatasetDataStatus =
  | "available"
  | "partial"
  | "not_available"
  | "under_review"
  | "collection_planned"
  | "synthetic_example";

export type DatasetAccessLevel =
  | "public"
  | "restricted"
  | "internal"
  | "example";

export type PublicationStatus =
  | "published"
  | "catalog_only"
  | "restricted"
  | "preparing"
  | "withdrawn";

export type DownloadMode = "generated" | "static_file" | "source_link" | "none";

export type DatasetPreviewKind =
  | "indicator"
  | "table"
  | "map"
  | "document"
  | "policy-document"
  | "gcf-portfolio"
  | "project-portfolio"
  | "permitting-process"
  | "local-data"
  | "local-geospatial"
  | "local-projects"
  | "local-documents"
  | "none";

export type GeographicCoverage = "global" | "country-list";

export type DatasetDataAssetSection =
  | "bundle"
  | "meta"
  | "observations"
  | "entities";

export interface DatasetDataAssetRef {
  provider: "vietnam-v121";
  elementId: string;
  section?: DatasetDataAssetSection;
}

export interface DatasetResource {
  id: string;
  title: string;
  format: string;
  access: "download" | "source" | "restricted" | "preparing";
  url?: string;
}

export interface Dataset {
  id: string;
  elementId: string;
  titleKo: string;
  titleEn: string;
  summary: string;
  category: CategoryCode;
  group: string;
  geographicCoverage: GeographicCoverage;
  countries: string[];
  period: string;
  referenceYear: string;
  types: DatasetType[];
  formats: string[];
  gis: boolean;
  api: boolean;
  sourceOrganization: string;
  sourceUrl: string;
  updatedAt: string | null;
  updatedAtVerified: boolean;
  version: string | null;
  publicationStatus: PublicationStatus;
  downloadMode: DownloadMode;
  resourceUrl?: string;
  indicatorId?: string;
  previewKind: DatasetPreviewKind;
  rightsStatus: RightsStatus;
  license: string;
  citation: string;
  unit: string;
  quality: "검증완료" | "검토중" | "제한" | "원천API 연결";
  methodology: string;
  limitations: string[];
  variables: string[];
  resources: DatasetResource[];

  /*
   * 데이터 유형과 화면 구현 계약
   * 기존 데이터셋의 단계적 전환을 위해 선택 필드로 유지함
   * 신규 데이터셋은 아래 필드를 명시적으로 등록하는 것을 원칙으로 함
   */
  schemaVersion?: string;
  representationTypes?: DataRepresentationType[];
  primaryRepresentationType?: DataRepresentationType;
  viewTemplate?: DataViewTemplate;
  capabilities?: Partial<DatasetCapabilities>;
  compareConfig?: DatasetCompareConfig;
  mapConfig?: DatasetMapConfig;
  insightConfig?: DatasetInsightConfig;

  /* 실제 값·문서·기관·사업·공간자료 payload */
  dataPayloadUrl?: string;
  dataAssetRef?: DatasetDataAssetRef;

  /* 출처·수집상태·공개수준 */
  sourceType?: DatasetSourceType;
  dataStatus?: DatasetDataStatus;
  accessLevel?: DatasetAccessLevel;
  isSynthetic?: boolean;
  featured?: boolean;
}
