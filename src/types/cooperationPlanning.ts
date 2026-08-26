export type PlanningEvidenceStatus = "confirmed" | "partial" | "needs_check";

export interface PlanningEvidenceItem {
  id:
    | "demand"
    | "conditions"
    | "policy"
    | "projects"
    | "organizations"
    | "locations"
    | "permitting";
  label: string;
  status: PlanningEvidenceStatus;
  statusLabel: string;
  confirmedText: string;
  nextAction: string;
  anchor: string;
}

export interface PlanningEvidenceSource {
  id: string;
  title: string;
  source: string;
  reference: string;
  sourceUrl: string;
  relationLabel: string;
}

export interface PlanningBriefInput {
  countryName: string;
  technologyName: string;
  demandDatasetCount: number;
  conditionDatasetCount: number;
  availableConditionCount: number;
  policyDatasetCount: number;
  technologyProjectCount: number;
  hasCountryPortfolio: boolean;
  technologyOrganizationCount: number;
  implementingOrganizationCount: number;
  commonOrganizationCount: number;
  spatialCount: number;
  projectRegionCount: number;
  permittingDatasetCount: number;
  sources: PlanningEvidenceSource[];
}

export interface PlanningBriefResult {
  items: PlanningEvidenceItem[];
  confirmedCount: number;
  partialCount: number;
  needsCheckCount: number;
  memoText: string;
}
