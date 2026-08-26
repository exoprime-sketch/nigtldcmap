import type { ProjectType } from "../data/climateTechnologyCatalog";

export type EvidenceStatus = "confirmed" | "related" | "needs-check";

export type RecommendedStage =
  | "현지 수요확인 우선"
  | "파트너 발굴 우선"
  | "타당성조사 우선"
  | "실증사업 우선"
  | "본사업 기획 가능"
  | "기존사업 연계 검토"
  | "추가 자료 확보 후 재검토";

export interface OpportunityEvidenceItem {
  id: string;
  area: "수요" | "정책" | "기술조건" | "재원" | "기관";
  title: string;
  summary: string;
  status: EvidenceStatus;
  sourceLabel: string;
  sourceUrl?: string;
  datasetId?: string;
}

export interface OpportunityOrganizationItem {
  id: string;
  organizationType: string;
  name: string;
  role: string;
  basis: string;
  status: EvidenceStatus;
}

export interface OpportunityPermitItem {
  id: string;
  permitName: string;
  authority: string;
  applicability: string;
  expectedDuration: string;
  status: EvidenceStatus;
}

export interface OpportunityFinanceItem {
  id: string;
  sourceType: string;
  name: string;
  relevance: string;
  status: EvidenceStatus;
}

export interface TechnologyOpportunityRecord {
  iso3: string;
  technologyId: string;
  title: string;
  recommendedStage: RecommendedStage;
  recommendedProjectTypes: ProjectType[];
  summary: string;
  problemStatement: string;
  targetSectors: string[];
  targetRegions: string[];
  evidence: OpportunityEvidenceItem[];
  organizations: OpportunityOrganizationItem[];
  permits: OpportunityPermitItem[];
  finance: OpportunityFinanceItem[];
  missingInformation: string[];
  nextActions: string[];
}
