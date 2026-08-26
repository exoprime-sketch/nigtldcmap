import type { DatasetTechnologyLink } from "../../types/technologyDataLink";

export type OperationalTargetTypeV97 =
  | "country"
  | "technology"
  | "element"
  | "dataset";

export interface SearchSynonymRuleV97 {
  targetType: OperationalTargetTypeV97;
  targetId: string;
  aliases: string[];
}

export interface SourceRefreshRuleV97 {
  datasetId: string;
  sourceOrganization: string;
  sourceUrl: string;
  refreshMode:
    | "api_metadata_before_release"
    | "registry_before_release"
    | "snapshot_before_release"
    | "source_release_check"
    | "manual_source_check";
  requiredBeforeRelease: boolean;
  noteKo: string;
}

export interface VerifiedLocationRecordV97 {
  recordId: string;
  datasetId: string;
  countryIso3: string;
  nameKo: string;
  latitude: number;
  longitude: number;
  accuracy:
    | "exact_facility"
    | "official_point"
    | "administrative_centroid"
    | "approximate";
  evidenceUrl: string;
  verifiedAt: string;
  publicVisible: boolean;
}

export interface TechnologyMappingReviewV97 {
  datasetId: string;
  scope: "dataset" | "record";
  status: "confirmed" | "review_required";
  noteKo: string;
}

export interface BugRegisterRecordV97 {
  id: string;
  severity: "P0" | "P1" | "P2";
  status: "open" | "fixed" | "accepted";
  area: string;
  summary: string;
  verification: string;
}

/*
 * v97 운영 원칙
 * 1. 신규 실제 Dataset은 기존 publicDatasets.ts에 등록한 뒤 이 파일의 refresh/mapping 규칙을 추가
 * 2. source/reference만 바꿀 때도 payload 값과 함께 검증. 날짜만 임의 갱신 금지
 * 3. 검증 좌표는 아래 배열에만 추가하고 evidenceUrl + verifiedAt 필수
 * 4. 38대 기술 매핑은 제목 키워드만으로 direct 판정 금지
 * 5. P0/P1은 open 상태로 Release Candidate에 남기지 않음
 */

export const SOURCE_REFRESH_RULES_V97: SourceRefreshRuleV97[] = [
  {
    datasetId: "LDC-DS-A-001",
    sourceOrganization: "World Bank",
    sourceUrl: "https://data.worldbank.org/indicator/SP.POP.TOTL",
    refreshMode: "api_metadata_before_release",
    requiredBeforeRelease: true,
    noteKo: "Indicators API 최신 가용연도·source metadata 확인",
  },
  {
    datasetId: "LDC-DS-A-007-URBAN",
    sourceOrganization: "World Bank",
    sourceUrl: "https://data.worldbank.org/indicator/SP.URB.TOTL.IN.ZS",
    refreshMode: "api_metadata_before_release",
    requiredBeforeRelease: true,
    noteKo: "Indicators API 최신 가용연도·source metadata 확인",
  },
  {
    datasetId: "LDC-DS-A-007-GROWTH",
    sourceOrganization: "World Bank",
    sourceUrl: "https://data.worldbank.org/indicator/SP.POP.GROW",
    refreshMode: "api_metadata_before_release",
    requiredBeforeRelease: true,
    noteKo: "Indicators API 최신 가용연도·source metadata 확인",
  },
  {
    datasetId: "LDC-DS-A-003-GDP",
    sourceOrganization: "World Bank",
    sourceUrl: "https://data.worldbank.org/indicator/NY.GDP.MKTP.CD",
    refreshMode: "api_metadata_before_release",
    requiredBeforeRelease: true,
    noteKo: "Indicators API 최신 가용연도·source metadata 확인",
  },
  {
    datasetId: "LDC-DS-A-003-GROWTH",
    sourceOrganization: "World Bank",
    sourceUrl: "https://data.worldbank.org/indicator/NY.GDP.MKTP.KD.ZG",
    refreshMode: "api_metadata_before_release",
    requiredBeforeRelease: true,
    noteKo: "Indicators API 최신 가용연도·source metadata 확인",
  },
  {
    datasetId: "LDC-DS-A-003-PC",
    sourceOrganization: "World Bank",
    sourceUrl: "https://data.worldbank.org/indicator/NY.GDP.PCAP.CD",
    refreshMode: "api_metadata_before_release",
    requiredBeforeRelease: true,
    noteKo: "Indicators API 최신 가용연도·source metadata 확인",
  },
  {
    datasetId: "LDC-DS-A-002",
    sourceOrganization: "Natural Earth",
    sourceUrl:
      "https://www.naturalearthdata.com/downloads/110m-cultural-vectors/110m-admin-0-countries/",
    refreshMode: "source_release_check",
    requiredBeforeRelease: true,
    noteKo: "경계 원천판과 라이선스/attribution 확인",
  },
  {
    datasetId: "LDC-DS-B-001",
    sourceOrganization: "World Bank Climate Change Knowledge Portal",
    sourceUrl: "https://climateknowledgeportal.worldbank.org/download-data",
    refreshMode: "source_release_check",
    requiredBeforeRelease: true,
    noteKo: "시나리오·기간·변수 정의와 원천 갱신 여부 확인",
  },
  {
    datasetId: "LDC-DS-B-002",
    sourceOrganization: "World Bank · ESMAP · Solargis",
    sourceUrl: "https://globalsolaratlas.info/global-pv-potential-study/",
    refreshMode: "source_release_check",
    requiredBeforeRelease: true,
    noteKo: "Global Solar Atlas 원천 버전·장기평균 기준 확인",
  },
  {
    datasetId: "LDC-DS-B-004",
    sourceOrganization: "World Bank · ESMAP · Solargis",
    sourceUrl: "https://globalsolaratlas.info/global-pv-potential-study/",
    refreshMode: "source_release_check",
    requiredBeforeRelease: true,
    noteKo: "Global Solar Atlas 원천 버전·장기평균 기준 확인",
  },
  {
    datasetId: "LDC-DS-B-003",
    sourceOrganization: "원천 및 방법론 확정 중",
    sourceUrl: "",
    refreshMode: "manual_source_check",
    requiredBeforeRelease: true,
    noteKo: "출처기관 원문과 기준시점 재확인",
  },
  {
    datasetId: "LDC-DS-C-001",
    sourceOrganization: "UNFCCC NDC Registry",
    sourceUrl: "https://unfccc.int/NDCREG",
    refreshMode: "registry_before_release",
    requiredBeforeRelease: true,
    noteKo: "NDC Registry의 Active 문서·제출일·버전·원문 URL 재확인",
  },
  {
    datasetId: "LDC-DS-D-001",
    sourceOrganization: "World Bank",
    sourceUrl: "https://data.worldbank.org/indicator/EG.ELC.ACCS.ZS",
    refreshMode: "api_metadata_before_release",
    requiredBeforeRelease: true,
    noteKo: "Indicators API 최신 가용연도·source metadata 확인",
  },
  {
    datasetId: "LDC-DS-D-003",
    sourceOrganization: "World Bank",
    sourceUrl: "https://data.worldbank.org/indicator/EG.CFT.ACCS.ZS",
    refreshMode: "api_metadata_before_release",
    requiredBeforeRelease: true,
    noteKo: "Indicators API 최신 가용연도·source metadata 확인",
  },
  {
    datasetId: "LDC-DS-D-004",
    sourceOrganization: "World Bank",
    sourceUrl: "https://data.worldbank.org/indicator/EG.ELC.RNEW.ZS",
    refreshMode: "api_metadata_before_release",
    requiredBeforeRelease: true,
    noteKo: "Indicators API 최신 가용연도·source metadata 확인",
  },
  {
    datasetId: "LDC-DS-D-005",
    sourceOrganization: "World Bank",
    sourceUrl: "https://data.worldbank.org/indicator/EG.ELC.LOSS.ZS",
    refreshMode: "api_metadata_before_release",
    requiredBeforeRelease: true,
    noteKo: "Indicators API 최신 가용연도·source metadata 확인",
  },
  {
    datasetId: "LDC-DS-D-002",
    sourceOrganization: "기관 사업·투자관리 시스템",
    sourceUrl: "",
    refreshMode: "manual_source_check",
    requiredBeforeRelease: true,
    noteKo: "출처기관 원문과 기준시점 재확인",
  },
  {
    datasetId: "LDC-DS-E-002",
    sourceOrganization: "Green Climate Fund",
    sourceUrl: "https://data.greenclimate.fund/public/data/countries",
    refreshMode: "snapshot_before_release",
    requiredBeforeRelease: true,
    noteKo:
      "GCF ODL은 최소 하루 1회 갱신. payload 값과 reference period를 함께 갱신",
  },
  {
    datasetId: "LDC-PILOT-E-003-GCF-ORGS",
    sourceOrganization: "Green Climate Fund",
    sourceUrl: "https://www.greenclimate.fund/countries/viet-nam",
    refreshMode: "snapshot_before_release",
    requiredBeforeRelease: true,
    noteKo:
      "GCF ODL은 최소 하루 1회 갱신. payload 값과 reference period를 함께 갱신",
  },
  {
    datasetId: "LDC-PILOT-D-020-GCF-PROJECTS",
    sourceOrganization: "Green Climate Fund",
    sourceUrl: "https://www.greenclimate.fund/portfolio/all",
    refreshMode: "snapshot_before_release",
    requiredBeforeRelease: true,
    noteKo:
      "GCF ODL은 최소 하루 1회 갱신. payload 값과 reference period를 함께 갱신",
  },
];

export const SEARCH_SYNONYMS_V97: SearchSynonymRuleV97[] = [
  {
    targetType: "element",
    targetId: "A-001",
    aliases: ["CPI", "부패지수", "부패인식", "Corruption Perceptions Index"],
  },
  {
    targetType: "element",
    targetId: "A-003",
    aliases: ["GDP", "국내총생산", "경제성장", "1인당GDP", "GDP per capita"],
  },
  {
    targetType: "element",
    targetId: "A-007",
    aliases: [
      "인구",
      "총인구",
      "도시화율",
      "도시인구",
      "population",
      "urban population",
    ],
  },
  {
    targetType: "element",
    targetId: "A-019",
    aliases: [
      "송배전손실",
      "송전손실",
      "배전손실",
      "T&D loss",
      "transmission distribution loss",
      "grid loss",
    ],
  },
  {
    targetType: "element",
    targetId: "A-020",
    aliases: [
      "재생에너지비중",
      "재생전력비중",
      "renewable electricity",
      "renewable share",
    ],
  },
  {
    targetType: "element",
    targetId: "A-021",
    aliases: [
      "전력접근률",
      "전기접근률",
      "electricity access",
      "energy access",
    ],
  },
  {
    targetType: "element",
    targetId: "B-006",
    aliases: [
      "고온체감",
      "폭염",
      "열지수",
      "heat index",
      "HI35",
      "extreme heat",
    ],
  },
  {
    targetType: "element",
    targetId: "B-041",
    aliases: [
      "태양광잠재량",
      "PVOUT",
      "GHI",
      "일사량",
      "solar potential",
      "solar atlas",
    ],
  },
  {
    targetType: "element",
    targetId: "C-001",
    aliases: [
      "NDC",
      "국가결정기여",
      "국가온실가스감축목표",
      "Nationally Determined Contribution",
    ],
  },
  {
    targetType: "element",
    targetId: "D-020",
    aliases: ["GCF 사업", "GCF 프로젝트", "Funded Activities", "기후기금 사업"],
  },
  {
    targetType: "element",
    targetId: "D-023",
    aliases: [
      "GCF 국가포트폴리오",
      "Readiness",
      "GCF financing",
      "GCF country portfolio",
    ],
  },
  {
    targetType: "element",
    targetId: "E-003",
    aliases: [
      "GCF 기관",
      "NDA",
      "DAE",
      "Accredited Entity",
      "국가지정기관",
      "직접접근기관",
    ],
  },
  {
    targetType: "technology",
    targetId: "solar-pv",
    aliases: [
      "태양광",
      "태양광발전",
      "PV",
      "solar",
      "solar PV",
      "photovoltaic",
    ],
  },
  {
    targetType: "technology",
    targetId: "solar-thermal",
    aliases: ["태양열", "solar thermal"],
  },
  {
    targetType: "technology",
    targetId: "wind",
    aliases: [
      "풍력",
      "해상풍력",
      "육상풍력",
      "wind",
      "wind power",
      "offshore wind",
      "onshore wind",
    ],
  },
  {
    targetType: "technology",
    targetId: "ocean-energy",
    aliases: [
      "해양에너지",
      "조력",
      "파력",
      "tidal",
      "wave energy",
      "ocean energy",
    ],
  },
  {
    targetType: "technology",
    targetId: "hydropower",
    aliases: ["수력", "수력발전", "hydro", "hydropower"],
  },
  {
    targetType: "technology",
    targetId: "geothermal",
    aliases: ["지열", "geothermal"],
  },
  {
    targetType: "technology",
    targetId: "bioenergy",
    aliases: ["바이오에너지", "bioenergy", "biogas"],
  },
  {
    targetType: "technology",
    targetId: "hydrogen-ammonia-power",
    aliases: [
      "수소암모니아발전",
      "암모니아혼소",
      "수소혼소",
      "hydrogen ammonia",
      "ammonia co-firing",
    ],
  },
  {
    targetType: "technology",
    targetId: "hydrogen",
    aliases: [
      "수소",
      "그린수소",
      "청정수소",
      "H2",
      "green hydrogen",
      "clean hydrogen",
    ],
  },
  {
    targetType: "technology",
    targetId: "biomass",
    aliases: ["바이오매스", "biomass"],
  },
  {
    targetType: "technology",
    targetId: "waste-resource",
    aliases: [
      "폐자원",
      "자원순환",
      "폐기물에너지",
      "waste to energy",
      "WTE",
      "WtE",
    ],
  },
  {
    targetType: "technology",
    targetId: "power-generation-efficiency",
    aliases: ["발전효율", "발전소효율", "power generation efficiency"],
  },
  {
    targetType: "technology",
    targetId: "industrial-efficiency",
    aliases: [
      "산업효율",
      "산업에너지효율",
      "industrial efficiency",
      "industrial energy efficiency",
    ],
  },
  {
    targetType: "technology",
    targetId: "transport-efficiency",
    aliases: [
      "수송효율",
      "교통효율",
      "transport efficiency",
      "mobility efficiency",
    ],
  },
  {
    targetType: "technology",
    targetId: "building-efficiency",
    aliases: [
      "건물효율",
      "건물에너지효율",
      "building efficiency",
      "building energy efficiency",
    ],
  },
  {
    targetType: "technology",
    targetId: "power-integration",
    aliases: [
      "전력망",
      "계통",
      "그리드",
      "송배전",
      "스마트그리드",
      "grid",
      "power grid",
      "grid integration",
      "smart grid",
    ],
  },
  {
    targetType: "technology",
    targetId: "heat-integration",
    aliases: ["열통합", "산업열", "heat integration"],
  },
  {
    targetType: "technology",
    targetId: "sector-coupling",
    aliases: ["섹터커플링", "부문결합", "sector coupling", "power to x", "P2X"],
  },
  {
    targetType: "technology",
    targetId: "methane-treatment",
    aliases: ["메탄", "메탄감축", "methane", "methane abatement"],
  },
  {
    targetType: "technology",
    targetId: "carbon-sink",
    aliases: [
      "탄소흡수원",
      "흡수원",
      "산림탄소",
      "REDD+",
      "carbon sink",
      "nature based solution",
      "NBS",
    ],
  },
  {
    targetType: "technology",
    targetId: "agriculture-livestock-fisheries",
    aliases: [
      "농축수산",
      "농업적응",
      "축산",
      "수산",
      "agriculture",
      "livestock",
      "fisheries",
    ],
  },
  {
    targetType: "technology",
    targetId: "forest-ecosystem",
    aliases: [
      "산림생태계",
      "산림",
      "생태계",
      "forest ecosystem",
      "biodiversity",
    ],
  },
  {
    targetType: "technology",
    targetId: "water",
    aliases: ["물", "수자원", "상하수도", "water", "water resources", "WASH"],
  },
  {
    targetType: "technology",
    targetId: "health",
    aliases: ["건강", "보건", "폭염보건", "health", "public health"],
  },
  {
    targetType: "technology",
    targetId: "land-coastal",
    aliases: ["국토연안", "연안적응", "해안", "coastal", "coastal adaptation"],
  },
  {
    targetType: "technology",
    targetId: "climate-monitoring-diagnosis",
    aliases: [
      "기후감시",
      "기후진단",
      "관측",
      "climate monitoring",
      "climate observation",
    ],
  },
  {
    targetType: "technology",
    targetId: "climate-projection",
    aliases: ["기후예측", "기후전망", "climate projection", "climate scenario"],
  },
  {
    targetType: "technology",
    targetId: "climate-impact-assessment",
    aliases: ["기후영향평가", "impact assessment", "climate impact"],
  },
  {
    targetType: "technology",
    targetId: "climate-vulnerability-risk",
    aliases: [
      "기후취약성",
      "기후위험",
      "위험평가",
      "climate risk",
      "vulnerability",
      "risk assessment",
    ],
  },
  {
    targetType: "country",
    targetId: "VNM",
    aliases: ["베트남", "Viet Nam", "Vietnam", "VN"],
  },
  {
    targetType: "country",
    targetId: "IDN",
    aliases: ["인도네시아", "Indonesia", "ID"],
  },
  {
    targetType: "country",
    targetId: "PHL",
    aliases: ["필리핀", "Philippines", "PH"],
  },
  {
    targetType: "country",
    targetId: "BGD",
    aliases: ["방글라데시", "Bangladesh", "BD"],
  },
  {
    targetType: "country",
    targetId: "KHM",
    aliases: ["캄보디아", "Cambodia", "KH"],
  },
  {
    targetType: "country",
    targetId: "LAO",
    aliases: ["라오스", "Lao PDR", "Laos", "Lao People’s Democratic Republic"],
  },
  {
    targetType: "country",
    targetId: "LKA",
    aliases: ["스리랑카", "Sri Lanka", "LK"],
  },
  { targetType: "country", targetId: "IND", aliases: ["인도", "India", "IN"] },
  {
    targetType: "country",
    targetId: "MYS",
    aliases: ["말레이시아", "Malaysia", "MY"],
  },
  {
    targetType: "country",
    targetId: "EGY",
    aliases: ["이집트", "Egypt", "EG"],
  },
  {
    targetType: "dataset",
    targetId: "LDC-DS-B-002",
    aliases: ["PVOUT", "태양광 발전 잠재량", "solar potential"],
  },
  {
    targetType: "dataset",
    targetId: "LDC-DS-B-004",
    aliases: ["GHI", "수평면 전일사량", "global horizontal irradiation"],
  },
  {
    targetType: "dataset",
    targetId: "LDC-DS-C-001",
    aliases: ["NDC registry", "NDC 원문", "NDC 기술근거"],
  },
  {
    targetType: "dataset",
    targetId: "LDC-PILOT-D-020-GCF-PROJECTS",
    aliases: ["GCF funded activities", "GCF projects", "GCF 프로젝트"],
  },
  {
    targetType: "dataset",
    targetId: "LDC-PILOT-E-003-GCF-ORGS",
    aliases: ["GCF entities", "NDA", "DAE", "Accredited Entities"],
  },
];

/*
 * 실제 좌표가 확인된 경우에만 추가한다.
 * 수도/국가대표 좌표를 시설·프로젝트 실제 위치로 대체 사용하지 않는다.
 */
export const VERIFIED_LOCATIONS_V97: VerifiedLocationRecordV97[] = [];

/*
 * 이미 기술 링크가 있는 Dataset은 confirmed.
 * 프로젝트 레코드처럼 건별 기술 태깅이 필요한 경우 review_required로 유지한다.
 */
export const TECHNOLOGY_MAPPING_REVIEW_V97: TechnologyMappingReviewV97[] = [
  {
    datasetId: "LDC-DS-A-001",
    scope: "dataset",
    status: "confirmed",
    noteKo: "현재 기술 링크 1건 확인",
  },
  {
    datasetId: "LDC-DS-A-007-URBAN",
    scope: "dataset",
    status: "review_required",
    noteKo: "38대 기술 관련성 검토 필요",
  },
  {
    datasetId: "LDC-DS-A-007-GROWTH",
    scope: "dataset",
    status: "review_required",
    noteKo: "38대 기술 관련성 검토 필요",
  },
  {
    datasetId: "LDC-DS-A-003-GDP",
    scope: "dataset",
    status: "review_required",
    noteKo: "38대 기술 관련성 검토 필요",
  },
  {
    datasetId: "LDC-DS-A-003-GROWTH",
    scope: "dataset",
    status: "review_required",
    noteKo: "38대 기술 관련성 검토 필요",
  },
  {
    datasetId: "LDC-DS-A-003-PC",
    scope: "dataset",
    status: "review_required",
    noteKo: "38대 기술 관련성 검토 필요",
  },
  {
    datasetId: "LDC-DS-A-002",
    scope: "dataset",
    status: "confirmed",
    noteKo: "현재 기술 링크 1건 확인",
  },
  {
    datasetId: "LDC-DS-B-001",
    scope: "dataset",
    status: "confirmed",
    noteKo: "현재 기술 링크 5건 확인",
  },
  {
    datasetId: "LDC-DS-B-002",
    scope: "dataset",
    status: "confirmed",
    noteKo: "현재 기술 링크 1건 확인",
  },
  {
    datasetId: "LDC-DS-B-004",
    scope: "dataset",
    status: "confirmed",
    noteKo: "현재 기술 링크 1건 확인",
  },
  {
    datasetId: "LDC-DS-B-003",
    scope: "dataset",
    status: "confirmed",
    noteKo: "현재 기술 링크 3건 확인",
  },
  {
    datasetId: "LDC-DS-C-001",
    scope: "dataset",
    status: "confirmed",
    noteKo: "현재 기술 링크 28건 확인",
  },
  {
    datasetId: "LDC-DS-D-001",
    scope: "dataset",
    status: "confirmed",
    noteKo: "현재 기술 링크 1건 확인",
  },
  {
    datasetId: "LDC-DS-D-003",
    scope: "dataset",
    status: "confirmed",
    noteKo: "현재 기술 링크 3건 확인",
  },
  {
    datasetId: "LDC-DS-D-004",
    scope: "dataset",
    status: "confirmed",
    noteKo: "현재 기술 링크 8건 확인",
  },
  {
    datasetId: "LDC-DS-D-005",
    scope: "dataset",
    status: "confirmed",
    noteKo: "현재 기술 링크 1건 확인",
  },
  {
    datasetId: "LDC-DS-E-002",
    scope: "dataset",
    status: "confirmed",
    noteKo: "현재 기술 링크 1건 확인",
  },
  {
    datasetId: "LDC-PILOT-E-003-GCF-ORGS",
    scope: "dataset",
    status: "confirmed",
    noteKo: "현재 기술 링크 1건 확인",
  },
  {
    datasetId: "LDC-PILOT-D-020-GCF-PROJECTS",
    scope: "record",
    status: "review_required",
    noteKo:
      "Dataset 수준 링크는 존재하나 프로젝트별 원문 근거 기술 태깅은 별도 검토 필요",
  },
];

/* 신규 기술 링크를 검수용으로 먼저 적재할 때 사용. 실제 서비스 반영 전 technologyDataLinks.ts에 병합 */
export const TECHNOLOGY_LINK_CANDIDATES_V97: DatasetTechnologyLink[] = [];

/* P0/P1 수정사항을 배치별로 기록. fixed 후 verification을 반드시 작성 */
export const BUG_REGISTER_V97: BugRegisterRecordV97[] = [];

export function getOperationalSearchAliasesV97(
  targetType: OperationalTargetTypeV97,
  targetId: string
): string[] {
  return Array.from(
    new Set(
      SEARCH_SYNONYMS_V97.filter(
        (rule) => rule.targetType === targetType && rule.targetId === targetId
      ).flatMap((rule) => rule.aliases)
    )
  );
}
