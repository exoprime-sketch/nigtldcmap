export type OperationalPriorityV98 = "P1" | "P2";
export type OperationalActionV98 =
  | "refresh_now"
  | "verify_now"
  | "api_metadata_check"
  | "source_version_check"
  | "manual_verify";

export interface SourceRefreshActionV98 {
  datasetId: string;
  elementId: string;
  priority: OperationalPriorityV98;
  action: OperationalActionV98;
  sourceOrganization: string;
  sourceUrl: string;
  currentReference: string;
  reasonKo: string;
}

export interface SearchAliasV98 {
  targetType: "element" | "technology" | "dataset" | "country";
  targetId: string;
  alias: string;
}

export interface VerifiedLocationCandidateV98 {
  recordId: string;
  datasetId: string;
  countryIso3: string;
  latitude: number;
  longitude: number;
  accuracy: "exact_facility" | "official_point";
  evidenceUrl: string;
  verifiedAt: string;
}

export interface OperationalBugV98 {
  id: string;
  severity: "P0" | "P1";
  status: "open" | "fixed";
  summary: string;
}

export const OPERATIONAL_BATCH_V98 = {
  batchId: "OP-2026-08-13-V98",
  createdAt: "2026-08-13",
  purposeKo:
    "첫 운영 갱신 배치: 실제 Dataset·출처·기준시점·좌표·기술매핑·검색동의어·P0/P1 관리",
  gcfProjectRelationCount: 109,
  expectedVerifiedLocationCountAtStart: 0,
} as const;

export const SOURCE_REFRESH_ACTIONS_V98: SourceRefreshActionV98[] = [
  {
    datasetId: "LDC-DS-A-001",
    elementId: "A-007",
    priority: "P2",
    action: "api_metadata_check",
    sourceOrganization: "World Bank",
    sourceUrl: "https://data.worldbank.org/indicator/SP.POP.TOTL",
    currentReference: "국가별 최신 가용연도",
    reasonKo: "Indicators API 최신 가용연도와 source lastupdated 확인",
  },
  {
    datasetId: "LDC-DS-A-007-URBAN",
    elementId: "A-007",
    priority: "P2",
    action: "api_metadata_check",
    sourceOrganization: "World Bank",
    sourceUrl: "https://data.worldbank.org/indicator/SP.URB.TOTL.IN.ZS",
    currentReference: "국가별 최신 가용연도",
    reasonKo: "Indicators API 최신 가용연도와 source lastupdated 확인",
  },
  {
    datasetId: "LDC-DS-A-007-GROWTH",
    elementId: "A-007",
    priority: "P2",
    action: "api_metadata_check",
    sourceOrganization: "World Bank",
    sourceUrl: "https://data.worldbank.org/indicator/SP.POP.GROW",
    currentReference: "국가별 최신 가용연도",
    reasonKo: "Indicators API 최신 가용연도와 source lastupdated 확인",
  },
  {
    datasetId: "LDC-DS-A-003-GDP",
    elementId: "A-003",
    priority: "P2",
    action: "api_metadata_check",
    sourceOrganization: "World Bank",
    sourceUrl: "https://data.worldbank.org/indicator/NY.GDP.MKTP.CD",
    currentReference: "국가별 최신 가용연도",
    reasonKo: "Indicators API 최신 가용연도와 source lastupdated 확인",
  },
  {
    datasetId: "LDC-DS-A-003-GROWTH",
    elementId: "A-003",
    priority: "P2",
    action: "api_metadata_check",
    sourceOrganization: "World Bank",
    sourceUrl: "https://data.worldbank.org/indicator/NY.GDP.MKTP.KD.ZG",
    currentReference: "국가별 최신 가용연도",
    reasonKo: "Indicators API 최신 가용연도와 source lastupdated 확인",
  },
  {
    datasetId: "LDC-DS-A-003-PC",
    elementId: "A-003",
    priority: "P2",
    action: "api_metadata_check",
    sourceOrganization: "World Bank",
    sourceUrl: "https://data.worldbank.org/indicator/NY.GDP.PCAP.CD",
    currentReference: "국가별 최신 가용연도",
    reasonKo: "Indicators API 최신 가용연도와 source lastupdated 확인",
  },
  {
    datasetId: "LDC-DS-A-002",
    elementId: "SUPPORT-MAP-001",
    priority: "P2",
    action: "source_version_check",
    sourceOrganization: "Natural Earth",
    sourceUrl:
      "https://www.naturalearthdata.com/downloads/110m-cultural-vectors/110m-admin-0-countries/",
    currentReference: "원천 최신판",
    reasonKo: "경계 원천판 및 attribution 확인",
  },
  {
    datasetId: "LDC-DS-B-001",
    elementId: "B-006",
    priority: "P2",
    action: "source_version_check",
    sourceOrganization: "World Bank Climate Change Knowledge Portal",
    sourceUrl: "https://climateknowledgeportal.worldbank.org/download-data",
    currentReference: "2040–2059 전망",
    reasonKo: "시나리오·기간·변수 정의와 배포 버전 확인",
  },
  {
    datasetId: "LDC-DS-B-002",
    elementId: "B-041",
    priority: "P2",
    action: "source_version_check",
    sourceOrganization: "World Bank · ESMAP · Solargis",
    sourceUrl: "https://globalsolaratlas.info/global-pv-potential-study/",
    currentReference: "장기 평균",
    reasonKo: "Global Solar Atlas release/data-source 버전 확인",
  },
  {
    datasetId: "LDC-DS-B-004",
    elementId: "B-041",
    priority: "P2",
    action: "source_version_check",
    sourceOrganization: "World Bank · ESMAP · Solargis",
    sourceUrl: "https://globalsolaratlas.info/global-pv-potential-study/",
    currentReference: "장기 평균",
    reasonKo: "Global Solar Atlas release/data-source 버전 확인",
  },
  {
    datasetId: "LDC-DS-B-003",
    elementId: "B-007",
    priority: "P2",
    action: "manual_verify",
    sourceOrganization: "원천 및 방법론 확정 중",
    sourceUrl: "",
    currentReference: "확정 중",
    reasonKo: "공식 원문과 현재 기준시점 재확인",
  },
  {
    datasetId: "LDC-DS-C-001",
    elementId: "C-001",
    priority: "P1",
    action: "verify_now",
    sourceOrganization: "UNFCCC NDC Registry",
    sourceUrl: "https://unfccc.int/NDCREG",
    currentReference: "2026-08-11 Registry 확인",
    reasonKo: "공식 NDC Registry의 Active 문서·제출일·버전 재확인",
  },
  {
    datasetId: "LDC-DS-D-001",
    elementId: "A-021",
    priority: "P2",
    action: "api_metadata_check",
    sourceOrganization: "World Bank",
    sourceUrl: "https://data.worldbank.org/indicator/EG.ELC.ACCS.ZS",
    currentReference: "국가별 최신 가용연도",
    reasonKo: "Indicators API 최신 가용연도와 source lastupdated 확인",
  },
  {
    datasetId: "LDC-DS-D-003",
    elementId: "SUPPORT-SDG7-CLEAN-COOKING",
    priority: "P2",
    action: "api_metadata_check",
    sourceOrganization: "World Bank",
    sourceUrl: "https://data.worldbank.org/indicator/EG.CFT.ACCS.ZS",
    currentReference: "국가별 최신 가용연도",
    reasonKo: "Indicators API 최신 가용연도와 source lastupdated 확인",
  },
  {
    datasetId: "LDC-DS-D-004",
    elementId: "A-020",
    priority: "P2",
    action: "api_metadata_check",
    sourceOrganization: "World Bank",
    sourceUrl: "https://data.worldbank.org/indicator/EG.ELC.RNEW.ZS",
    currentReference: "국가별 최신 가용연도",
    reasonKo: "Indicators API 최신 가용연도와 source lastupdated 확인",
  },
  {
    datasetId: "LDC-DS-D-005",
    elementId: "A-019",
    priority: "P2",
    action: "api_metadata_check",
    sourceOrganization: "World Bank",
    sourceUrl: "https://data.worldbank.org/indicator/EG.ELC.LOSS.ZS",
    currentReference: "국가별 최신 가용연도",
    reasonKo: "Indicators API 최신 가용연도와 source lastupdated 확인",
  },
  {
    datasetId: "LDC-DS-E-002",
    elementId: "D-023",
    priority: "P1",
    action: "refresh_now",
    sourceOrganization: "Green Climate Fund",
    sourceUrl: "https://data.greenclimate.fund/public/data/countries",
    currentReference: "2026-07-31",
    reasonKo: "GCF ODL은 최소 일 1회 갱신되므로 RC 스냅샷 재확인 필요",
  },
  {
    datasetId: "LDC-PILOT-E-003-GCF-ORGS",
    elementId: "E-003",
    priority: "P1",
    action: "refresh_now",
    sourceOrganization: "Green Climate Fund",
    sourceUrl: "https://www.greenclimate.fund/countries/viet-nam",
    currentReference: "2026-08-06 확인",
    reasonKo: "GCF ODL은 최소 일 1회 갱신되므로 RC 스냅샷 재확인 필요",
  },
  {
    datasetId: "LDC-PILOT-D-020-GCF-PROJECTS",
    elementId: "D-020",
    priority: "P1",
    action: "refresh_now",
    sourceOrganization: "Green Climate Fund",
    sourceUrl: "https://www.greenclimate.fund/portfolio/all",
    currentReference: "2026-08-11 확인",
    reasonKo: "GCF ODL은 최소 일 1회 갱신되므로 RC 스냅샷 재확인 필요",
  },
];

export const SEARCH_ALIASES_V98: SearchAliasV98[] = [
  { targetType: "element", targetId: "D-023", alias: "GCF country financing" },
  { targetType: "element", targetId: "D-023", alias: "GCF 국가재원" },
  {
    targetType: "element",
    targetId: "D-023",
    alias: "기후기금 국가포트폴리오",
  },
  { targetType: "element", targetId: "D-020", alias: "funded activities" },
  { targetType: "element", targetId: "D-020", alias: "GCF funded activity" },
  { targetType: "element", targetId: "D-020", alias: "GCF 승인사업" },
  { targetType: "element", targetId: "E-003", alias: "accredited entity" },
  { targetType: "element", targetId: "E-003", alias: "direct access entity" },
  {
    targetType: "element",
    targetId: "E-003",
    alias: "national designated authority",
  },
  { targetType: "element", targetId: "C-001", alias: "NDC Registry" },
  { targetType: "element", targetId: "C-001", alias: "NDC 제출일" },
  { targetType: "element", targetId: "C-001", alias: "NDC 원문" },
  { targetType: "element", targetId: "B-041", alias: "Global Solar Atlas" },
  { targetType: "element", targetId: "B-041", alias: "태양광 자원" },
  { targetType: "element", targetId: "B-041", alias: "PV potential" },
  { targetType: "element", targetId: "B-006", alias: "CCKP" },
  { targetType: "element", targetId: "B-006", alias: "Heat Index 35" },
  { targetType: "element", targetId: "B-006", alias: "HI35" },
  {
    targetType: "element",
    targetId: "A-021",
    alias: "SDG7 electricity access",
  },
  {
    targetType: "element",
    targetId: "A-020",
    alias: "renewable electricity output",
  },
  {
    targetType: "element",
    targetId: "A-019",
    alias: "electric power transmission and distribution losses",
  },
  {
    targetType: "technology",
    targetId: "power-integration",
    alias: "계통연계",
  },
  { targetType: "technology", targetId: "power-integration", alias: "송전망" },
  { targetType: "technology", targetId: "power-integration", alias: "배전망" },
  {
    targetType: "technology",
    targetId: "climate-monitoring-diagnosis",
    alias: "조기경보",
  },
  {
    targetType: "technology",
    targetId: "climate-monitoring-diagnosis",
    alias: "early warning",
  },
  {
    targetType: "technology",
    targetId: "climate-vulnerability-risk",
    alias: "취약성평가",
  },
  {
    targetType: "technology",
    targetId: "climate-vulnerability-risk",
    alias: "위험도",
  },
  {
    targetType: "technology",
    targetId: "industrial-efficiency",
    alias: "산업 에너지효율",
  },
  {
    targetType: "technology",
    targetId: "industrial-efficiency",
    alias: "energy efficiency industry",
  },
  { targetType: "technology", targetId: "carbon-sink", alias: "REDD plus" },
  { targetType: "technology", targetId: "carbon-sink", alias: "REDD-plus" },
  {
    targetType: "technology",
    targetId: "agriculture-livestock-fisheries",
    alias: "기후스마트농업",
  },
  {
    targetType: "technology",
    targetId: "agriculture-livestock-fisheries",
    alias: "climate smart agriculture",
  },
];

/*
 * 실제 위치 증거가 있는 경우에만 추가한다.
 * 국가 centroid / 수도 좌표 / 임의 geocoding 결과를 사업·시설 실제 좌표로 승격하지 않는다.
 */
export const VERIFIED_LOCATIONS_V98: VerifiedLocationCandidateV98[] = [];

/* P0/P1 발견 시 open으로 추가하고 fixed 전 verification을 수행 */
export const OPERATIONAL_BUGS_V98: OperationalBugV98[] = [];

export function getSearchAliasesV98(
  targetType: SearchAliasV98["targetType"],
  targetId: string
): string[] {
  return Array.from(
    new Set(
      SEARCH_ALIASES_V98.filter(
        (item) => item.targetType === targetType && item.targetId === targetId
      ).map((item) => item.alias)
    )
  );
}
