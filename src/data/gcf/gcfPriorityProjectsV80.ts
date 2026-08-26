export type GcfProjectStatusV80 =
  | "Approved"
  | "Under implementation"
  | "Completed"
  | "Lapsed";

export interface GcfPriorityProjectRecordV80 {
  countryIso3: string;
  countryNameKo: string;
  projectId: string;
  title: string;
  entity: string;
  status: GcfProjectStatusV80;
  multiCountry: boolean;
  countsTowardCurrentCountryPortfolio: boolean;
  projectUrl: string;
  countryPortfolioUrl: string;
  technologyMappingStatus: "not-reviewed";
}

export interface GcfPriorityCountryProjectSummaryV80 {
  countryNameKo: string;
  officialCurrentProjectCount: number;
  relationRecordCount: number;
  currentRelationCountExcludingLapsed: number;
  statusCounts: Partial<Record<GcfProjectStatusV80, number>>;
  sourceUrl: string;
}

export interface GcfPriorityProjectDatasetV80 {
  metadata: {
    datasetId: string;
    elementId: string;
    titleKo: string;
    sourceOrganization: string;
    sourceDatabase: string;
    referenceDate: string;
    recordUnit: string;
    priorityCountryCount: number;
    relationRecordCount: number;
    currentPortfolioRelationCount: number;
    rightsStatus: string;
    publicDownloadMode: string;
    limitations: string[];
  };
  countrySummaries: Record<string, GcfPriorityCountryProjectSummaryV80>;
  records: GcfPriorityProjectRecordV80[];
}

const GCF_PRIORITY_PROJECTS_URL =
  "/data/gcf/gcf-priority-country-projects-2026-08-13.json";

let cachedData: GcfPriorityProjectDatasetV80 | null = null;

export async function loadGcfPriorityProjectsV80(
  force = false
): Promise<GcfPriorityProjectDatasetV80> {
  if (cachedData && !force) return cachedData;

  const response = await fetch(GCF_PRIORITY_PROJECTS_URL, {
    cache: force ? "reload" : "default",
    headers: { Accept: "application/json" },
  });

  if (!response.ok) {
    throw new Error(`GCF 프로젝트 레코드 로딩 실패: ${response.status}`);
  }

  const data = (await response.json()) as GcfPriorityProjectDatasetV80;

  if (
    !data.metadata ||
    !Array.isArray(data.records) ||
    !data.countrySummaries
  ) {
    throw new Error("GCF 프로젝트 레코드 데이터 형식 오류");
  }

  cachedData = data;
  return data;
}

export function getGcfProjectsForCountryV80(
  data: GcfPriorityProjectDatasetV80 | null,
  iso3: string
): GcfPriorityProjectRecordV80[] {
  if (!data) return [];
  return data.records.filter((record) => record.countryIso3 === iso3);
}

export function getGcfProjectStatusLabelV80(
  status: GcfProjectStatusV80
): string {
  switch (status) {
    case "Approved":
      return "승인";
    case "Under implementation":
      return "이행 중";
    case "Completed":
      return "완료";
    case "Lapsed":
      return "실효";
    default:
      return status;
  }
}
