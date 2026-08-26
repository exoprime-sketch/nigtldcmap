export type GcfMetricId =
  | "gcfFundedActivityFinancing"
  | "gcfFundedActivityCount"
  | "gcfReadinessFinancing"
  | "gcfReadinessCount";

export interface GcfCountryPortfolioRecord {
  iso3: string;
  countryName: string;
  region: string;
  sids: boolean;
  ldc: boolean;
  readinessProjectCount: number;
  fundedActivityCount: number;
  readinessFinancingUsd: number;
  fundedActivityFinancingUsd: number;
}

export interface GcfPortfolioSummary {
  rowCount: number;
  eligibleCountryEconomyCount: number;
  nonEligibleCount: number;
  sidsCount: number;
  ldcCount: number;
  countriesWithReadiness: number;
  countriesWithFundedActivities: number;
  totalReadinessProjects: number;
  totalFundedActivities: number;
  totalReadinessFinancingUsd: number;
  totalFundedActivityFinancingUsd: number;
  countriesWithReadinessButNoFundedActivity: number;
  countriesWithNeitherReadinessNorFundedActivity: number;
}

export interface GcfRegionAggregate {
  region: string;
  countryCount: number;
  sidsCount: number;
  ldcCount: number;
  readinessProjectCount: number;
  fundedActivityCount: number;
  readinessFinancingUsd: number;
  fundedActivityFinancingUsd: number;
}

export interface GcfCountryPortfolio {
  metadata: {
    datasetId: string;
    titleKo: string;
    sourceOrganization: string;
    sourceDatabase: string;
    sourceUrl: string;
    snapshotFile: string;
    snapshotDate: string;
    unit?: Record<string, string>;
    rightsReviewStatus: string;
    recommendedPublicDownloadMode: string;
    limitations: string[];
  };
  summary: GcfPortfolioSummary;
  regions: GcfRegionAggregate[];
  data: GcfCountryPortfolioRecord[];
}

export interface GcfMetricDefinition {
  id: GcfMetricId;
  titleKo: string;
  shortTitleKo: string;
  descriptionKo: string;
  unit: "USD" | "건";
  decisionQuestionKo: string;
  legend: Array<{
    color: string;
    label: string;
    min: number;
  }>;
}
