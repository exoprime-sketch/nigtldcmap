export type AcquisitionMethodV76 =
  | "live_api"
  | "structured_download"
  | "document_extract"
  | "manual_research";

export interface AcquisitionSourceV76 {
  id: string;
  organization: string;
  method: AcquisitionMethodV76;
  baseUrl: string;
  licenseOrTerms: string;
  authentication: "none" | "required" | "source_specific";
  snapshotPolicy: "runtime_plus_snapshot" | "snapshot_only";
  noteKo: string;
}

export const ACQUISITION_SOURCES_V76: AcquisitionSourceV76[] = [
  {
    id: "oecd-dac2a-dac3a",
    organization: "OECD Development Assistance Committee",
    method: "live_api",
    baseUrl: "https://sdmx.oecd.org/public/rest/data",
    licenseOrTerms: "OECD 이용조건 및 출처표시 적용",
    authentication: "none",
    snapshotPolicy: "runtime_plus_snapshot",
    noteKo:
      "DAC2A 실제 지출과 DAC3A 약정을 수원국별로 분리 조회하며 두 금융흐름을 합산하지 않음",
  },
  {
    id: "world-bank-projects",
    organization: "World Bank · Projects & Operations",
    method: "live_api",
    baseUrl: "https://search.worldbank.org/api/v3/projects",
    licenseOrTerms: "World Bank Projects & Operations 이용조건·출처표시 적용",
    authentication: "none",
    snapshotPolicy: "runtime_plus_snapshot",
    noteKo:
      "국가별 Active·Pipeline 프로젝트를 Projects API에서 조회하고 사업 ID·상태·금액·분야·시행기관을 원천 필드 그대로 보존",
  },
  {
    id: "adb-iati-projects",
    organization: "Asian Development Bank · IATI",
    method: "structured_download",
    baseUrl: "https://www.adb.org/iati/",
    licenseOrTerms: "ADB Data Library CC BY 3.0 IGO 및 출처표시 적용",
    authentication: "none",
    snapshotPolicy: "runtime_plus_snapshot",
    noteKo:
      "우선국별 IATI XML에서 진행·준비 사업을 조회하며 ADB 대상지역이 아닌 국가는 자료 부재와 구분",
  },
  {
    id: "world-bank-indicators",
    organization: "World Bank",
    method: "live_api",
    baseUrl: "https://api.worldbank.org/v2",
    licenseOrTerms: "지표별 공식 페이지 확인 · v76 1차 지표는 CC BY 4.0",
    authentication: "none",
    snapshotPolicy: "runtime_plus_snapshot",
    noteKo: "실시간 API 조회 후 검증 snapshot을 함께 유지",
  },
  {
    id: "gcf-open-data",
    organization: "Green Climate Fund",
    method: "structured_download",
    baseUrl: "https://data.greenclimate.fund/public/data",
    licenseOrTerms: "GCF 이용조건 확인",
    authentication: "none",
    snapshotPolicy: "snapshot_only",
    noteKo: "사업·국가·기관 관계형 데이터로 정규화",
  },
  {
    id: "unfccc-ndc-registry",
    organization: "UNFCCC",
    method: "document_extract",
    baseUrl: "https://unfccc.int/NDCREG",
    licenseOrTerms: "공식 문서 이용조건·출처표시 적용",
    authentication: "none",
    snapshotPolicy: "snapshot_only",
    noteKo: "Registry 메타데이터와 PDF 근거를 분리 수집",
  },
  {
    id: "unfccc-btr",
    organization: "UNFCCC · First Biennial Transparency Reports",
    method: "document_extract",
    baseUrl: "https://unfccc.int/first-biennial-transparency-reports",
    licenseOrTerms: "UNFCCC 공식 제출자료 이용조건·출처표시 적용",
    authentication: "none",
    snapshotPolicy: "snapshot_only",
    noteKo:
      "BTR 제출표 메타데이터를 먼저 검증하고 수치·지원정보는 원문 문장·페이지 근거로 후속 추출",
  },
  {
    id: "unfccc-nap",
    organization: "UNFCCC · National Adaptation Plans",
    method: "document_extract",
    baseUrl: "https://unfccc.int/national-adaptation-plans",
    licenseOrTerms: "UNFCCC 공식 문서 이용조건·출처표시 적용",
    authentication: "none",
    snapshotPolicy: "snapshot_only",
    noteKo:
      "NAP 제출문서 메타데이터와 원문을 분리 관리하고 취약부문·우선조치는 후속 원문검증",
  },
  {
    id: "unfccc-lt-leds",
    organization: "UNFCCC · Long-term strategies portal",
    method: "document_extract",
    baseUrl:
      "https://unfccc.int/process/the-paris-agreement/long-term-strategies",
    licenseOrTerms: "UNFCCC 공식 문서 이용조건·출처표시 적용",
    authentication: "none",
    snapshotPolicy: "snapshot_only",
    noteKo:
      "current submission 메타데이터를 우선 연결하고 장기경로·기술·투자수요는 원문검증 후 구조화",
  },
  {
    id: "unfccc-tna-ttclear",
    organization: "UNFCCC TT:CLEAR · Technology Needs Assessments",
    method: "document_extract",
    baseUrl: "https://unfccc.int/ttclear/tna/reports.html",
    licenseOrTerms: "UNFCCC TT:CLEAR 공식 문서 이용조건·출처표시 적용",
    authentication: "none",
    snapshotPolicy: "snapshot_only",
    noteKo:
      "TNA/TAP/Project Idea 문서목록을 우선 연결하고 38대 기술매핑은 원문 근거 검증 후 수행",
  },
  {
    id: "ctcn-technical-assistance",
    organization: "Climate Technology Centre and Network (CTCN)",
    method: "manual_research",
    baseUrl: "https://www.ctc-n.org/technical-assistance/projects",
    licenseOrTerms: "CTCN/UNEP 공식 웹사이트 이용조건·출처표시 적용",
    authentication: "none",
    snapshotPolicy: "snapshot_only",
    noteKo:
      "국가 facet의 공개 TA 건수와 선별 원문검증 상세사례를 분리하고 기술매핑은 공식 TA 설명에 근거",
  },
  {
    id: "adaptation-fund-projects",
    organization: "Adaptation Fund",
    method: "manual_research",
    baseUrl: "https://www.adaptation-fund.org/projects-programmes/",
    licenseOrTerms: "Adaptation Fund 공식 웹사이트 이용조건·출처표시 적용",
    authentication: "none",
    snapshotPolicy: "snapshot_only",
    noteKo:
      "현재 국가별 공식 프로젝트 페이지를 우선하며 과거 검색 캐시보다 현행 사업 수·금액·상태를 사용",
  },
  {
    id: "gef-project-database",
    organization: "Global Environment Facility (GEF)",
    method: "manual_research",
    baseUrl: "https://www.thegef.org/projects-operations/database",
    licenseOrTerms: "GEF 공식 프로젝트 데이터베이스 이용조건·출처표시 적용",
    authentication: "none",
    snapshotPolicy: "snapshot_only",
    noteKo:
      "v112에서는 38대 기후기술과 직접 매핑 가능한 선별 공식 사업만 원문검증하며 취소 상태도 그대로 보존",
  },
  {
    id: "global-forest-watch",
    organization: "Global Forest Watch",
    method: "structured_download",
    baseUrl: "https://data-api.globalforestwatch.org/",
    licenseOrTerms: "Dataset별 이용조건 확인",
    authentication: "required",
    snapshotPolicy: "snapshot_only",
    noteKo: "인증된 수집 후 GIS snapshot 우선",
  },
];
