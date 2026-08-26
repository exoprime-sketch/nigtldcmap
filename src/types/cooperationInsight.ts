export type InsightSection =
  | "context"
  | "demand"
  | "technologyResource"
  | "policy"
  | "marketFinance"
  | "partnersExecution"
  | "region"
  | "evidenceOnly";

export type InsightDisplayType =
  | "numeric"
  | "timeSeries"
  | "category"
  | "verification"
  | "text"
  | "document"
  | "organization"
  | "projectFinance"
  | "geospatial";

export type InsightDataStatus =
  | "confirmed"
  | "partial"
  | "underReview"
  | "collectionPlanned"
  | "notFound"
  | "notApplicable"
  | "restricted";

export type InsightInterpretationLevel =
  | "directEvidence"
  | "context"
  | "referenceOnly";

export interface InsightObservation {
  recordId: string;
  elementId: string;
  datasetId?: string;

  iso3: string;
  technologyIds: string[];

  section: InsightSection;
  displayType: InsightDisplayType;
  interpretationLevel: InsightInterpretationLevel;

  title: string;
  summary?: string;

  value?: number | string | null;
  unit?: string;
  referencePeriod?: string;

  comparisonLabel?: string;
  comparisonValue?: number | string;
  comparisonNote?: string;

  regionId?: string;
  regionName?: string;
  latitude?: number;
  longitude?: number;

  organizationId?: string;
  organizationName?: string;
  organizationRole?: string;

  projectId?: string;
  projectName?: string;

  documentTitle?: string;
  documentPage?: string;
  documentSection?: string;
  originalText?: string;
  translationKo?: string;

  dataStatus: InsightDataStatus;
  accessLevel: "public" | "restricted" | "internal";

  sourceLabel: string;
  sourceUrl?: string;
  updatedAt?: string;

  limitations: string[];
}

export interface InsightStatusCounts {
  confirmed: number;
  partial: number;
  underReview: number;
  collectionPlanned: number;
  notFound: number;
  restricted: number;
}

export interface CooperationInsightResult {
  iso3: string;
  technologyId: string;

  totalCount: number;
  latestReferencePeriod: string | null;
  statusCounts: InsightStatusCounts;

  context: InsightObservation[];
  demand: InsightObservation[];
  technologyResource: InsightObservation[];
  policy: InsightObservation[];
  marketFinance: InsightObservation[];
  partnersExecution: InsightObservation[];
  region: InsightObservation[];
  evidence: InsightObservation[];
}
