export type LocalExampleLevel = "높음" | "중간" | "낮음";
export type LocalVerificationStatus = "확인" | "부분 확인" | "미확인";

export interface LocalExampleTimePoint {
  year: number;
  candidateDemandOrganizations: number;
  partnerCandidates: number;
}

export interface LocalExampleSite {
  id: string;
  name: string;
  siteType: string;
  longitude: number;
  latitude: number;
  status: string;
}

export interface LocalExampleProject {
  id: string;
  title: string;
  sector: string;
  stage: string;
  budgetBand: string;
}

export interface LocalExampleDocument {
  id: string;
  title: string;
  documentType: string;
  accessLevel: string;
  reviewStatus: string;
  summary: string;
}

export interface LocalExampleRecord {
  iso3: string;
  countryNameKo: string;
  countryNameEn: string;
  permitMonths: number;
  partnerCandidateCount: number;
  candidateDemandOrganizationCount: number;
  cooperationWillingness: LocalExampleLevel;
  supplyChainReadiness: LocalExampleLevel;
  verificationStatus: LocalVerificationStatus;
  mainDemand: string;
  mainBarrier: string;
  followUp: string;
  interviewSummary: string;
  annualSignals: LocalExampleTimePoint[];
  exampleSites: LocalExampleSite[];
  exampleProjects: LocalExampleProject[];
  exampleDocuments: LocalExampleDocument[];
  isSynthetic: true;
  dataStatus: "synthetic_example";
  sourceType: "synthetic_example";
  accessLevel: "example";
}

export interface LocalExampleDataset {
  metadata: {
    datasetId: string;
    titleKo: string;
    version: string;
    createdAt: string;
    priorityCountries: string[];
    notice: string;
    sourceType: "synthetic_example";
    dataStatus: "synthetic_example";
    accessLevel: "example";
    isSynthetic: true;
  };
  data: LocalExampleRecord[];
}
