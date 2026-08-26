import type { DataRepresentationType, DataViewTemplate } from "./dataView";

export type PayloadStatus =
  | "available"
  | "confirmed"
  | "partial"
  | "under_review"
  | "collection_planned"
  | "not_found"
  | "not_available"
  | "not_applicable"
  | "restricted"
  | "synthetic_example";

export type PayloadAccessLevel =
  | "public"
  | "restricted"
  | "internal"
  | "example";

export interface PayloadSource {
  organization: string;
  url: string;
  verifiedAt?: string;
  license?: string;
  originalFileName?: string;
}

export interface BaseDataPayload {
  schemaVersion?: string;
  type: DataRepresentationType | "permitting_process";
  viewTemplate?: DataViewTemplate;
  datasetId: string;
  elementId: string;
  title: string;
  countryIso3?: string;
  technologyIds?: string[];
  referencePeriod: string;
  unit?: string;
  status: PayloadStatus;
  accessLevel: PayloadAccessLevel;
  isSynthetic?: boolean;
  source?: PayloadSource;
  sourceUrl?: string;
  limitations?: string[];
}

export interface BaseDataRecord {
  id: string;
  iso3?: string;
  countryIso3?: string;
  technologyIds?: string[];
  regionId?: string;
  regionName?: string;
  referencePeriod?: string;
  verificationStatus?: string;
  sourceUrl?: string;
}

export interface NumericRecord extends BaseDataRecord {
  label?: string;
  value: number | null;
  unit?: string;
}

export interface TimeSeriesPoint {
  period: string;
  value: number | null;
}

export interface TimeSeriesRecord extends BaseDataRecord {
  label?: string;
  unit?: string;
  points: TimeSeriesPoint[];
}

export interface CategoryDefinition {
  code: string;
  label: string;
  definition: string;
}

export interface CategoricalRecord extends BaseDataRecord {
  label: string;
  category: string;
  reason?: string;
}

export interface VerificationRecord extends BaseDataRecord {
  label: string;
  status: string;
  originalText?: string;
  translationKo?: string;
  documentTitle?: string;
  pageReference?: string;
}

export interface TextEvidenceRecord extends BaseDataRecord {
  label: string;
  content: string;
  evidence?: string;
  followUpNeeded?: string;
}

export interface DocumentEvidenceRecord extends BaseDataRecord {
  documentTitle: string;
  documentType?: string;
  issuingOrganization?: string;
  publishedAt?: string;
  language?: string;
  originalText?: string;
  translationKo?: string;
  pageReference?: string;
}

export interface OrganizationRecord extends BaseDataRecord {
  name: string;
  nameLocal?: string;
  organizationType: string;
  confirmedRole: string;
  websiteUrl?: string;
}

export interface ProjectFinanceRecord extends BaseDataRecord {
  title: string;
  projectStatus?: string;
  fundingOrganization?: string;
  implementingOrganization?: string;
  amount?: number | null;
  currency?: string;
  startDate?: string;
  endDate?: string;
}

export interface GeospatialRecord extends BaseDataRecord {
  name: string;
  latitude?: number;
  longitude?: number;
  geometry?: unknown;
  locationAccuracy?: string;
  properties?: Record<string, unknown>;
}

export interface PermittingAuthority {
  name: string;
  level?: string;
}

export interface PermittingDuration {
  min?: number | null;
  max?: number | null;
  value?: number | null;
  unit?: string;
  startsFrom?: string;
  excludedTime?: string;
}

export interface PermittingFee {
  amount?: number | null;
  currency?: string;
  note?: string;
}

export interface PermittingProcedureRecord extends BaseDataRecord {
  sequence: number;
  category: string;
  nameLocal?: string;
  nameKo: string;
  applicability: "required" | "conditional" | "not_applicable" | "to_confirm";
  applicabilityCondition?: string;
  authority?: PermittingAuthority;
  submissionMethods?: string[];
  requiredDocuments?: string[];
  statutoryDuration?: PermittingDuration;
  observedDuration?: PermittingDuration | null;
  officialFee?: PermittingFee;
  prerequisiteIds?: string[];
  canRunInParallelWith?: string[];
  output?: string;
  legalBases?: string[];
  source?: PayloadSource;
}

export interface PermittingProcessPayload extends BaseDataPayload {
  type: "permitting_process";
  scenario: {
    iso3?: string;
    technologyId?: string;
    technologyNameKo?: string;
    projectType?: string;
    projectTypeLabel?: string;
    projectScale?: string;
    regionId?: string | null;
    regionName?: string | null;
  };
  procedures: PermittingProcedureRecord[];
}
