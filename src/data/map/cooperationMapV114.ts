import type { IndicatorId } from "../indicators/registry";

export type CooperationMapPresetV114 =
  | "core-evidence"
  | "technology-demand"
  | "international-support"
  | "country-context";

export type CooperationAggregateLayerV114 =
  | "tna"
  | "ctcn"
  | "gcf"
  | "adaptation-fund"
  | "gef"
  | "mdb";

export interface MapDataSelectionV114 {
  data: string;
  selected: boolean;
  role: "base-fill" | "country-aggregate" | "verified-point" | "side-panel";
  geometry:
    | "country-polygon"
    | "country-representative-point"
    | "verified-coordinate"
    | "none";
  defaultVisible: boolean;
  reason: string;
}

export const CURATED_BASE_INDICATORS_V114: Array<{
  id: IndicatorId;
  label: string;
  planningUse: string;
}> = [
  {
    id: "grid-losses",
    label: "송배전 손실률",
    planningUse: "전력망 효율·현대화 협력의 기초 여건",
  },
  {
    id: "electricity-access",
    label: "전력 접근률",
    planningUse: "전력 접근성 및 전력 인프라 격차 확인",
  },
  {
    id: "clean-cooking-access",
    label: "청정취사 접근률",
    planningUse: "청정에너지·가정에너지 전환 수요의 기초 여건",
  },
  {
    id: "renewable-electricity-share",
    label: "재생에너지 발전 비중",
    planningUse: "전력부문 에너지전환 수준 비교",
  },
  {
    id: "urbanization-share",
    label: "도시인구 비율",
    planningUse: "도시 인프라·냉방·건물·수송 협력의 기초 맥락",
  },
  {
    id: "gdp-per-capita",
    label: "1인당 GDP",
    planningUse: "사업규모·재원조달 여건을 해석하기 위한 경제 맥락",
  },
  {
    id: "sector-industry-share",
    label: "산업 부가가치 비중",
    planningUse: "산업 탈탄소·효율 협력의 경제구조 맥락",
  },
  {
    id: "heat-index-hi35",
    label: "고온위험(HI35)",
    planningUse: "고온·보건·냉방·도시 적응수요의 공간 맥락",
  },
  {
    id: "solar-pvout",
    label: "태양광 발전잠재량",
    planningUse: "태양광 사업 초기 자원여건 비교",
  },
];

export const DEFAULT_BASE_INDICATOR_V114: IndicatorId = "grid-losses";

export const DEFAULT_AGGREGATE_LAYERS_V114: CooperationAggregateLayerV114[] = [
  "tna",
  "ctcn",
  "gcf",
  "adaptation-fund",
  "gef",
  "mdb",
];

export const PRESET_CONFIG_V114: Record<
  CooperationMapPresetV114,
  {
    label: string;
    baseIndicator: IndicatorId;
    layers: CooperationAggregateLayerV114[];
  }
> = {
  "core-evidence": {
    label: "핵심 통합 보기",
    baseIndicator: "grid-losses",
    layers: DEFAULT_AGGREGATE_LAYERS_V114,
  },
  "technology-demand": {
    label: "기술수요",
    baseIndicator: "electricity-access",
    layers: ["tna", "ctcn"],
  },
  "international-support": {
    label: "국제지원·사업",
    baseIndicator: "gdp-per-capita",
    layers: ["ctcn", "gcf", "adaptation-fund", "gef", "mdb"],
  },
  "country-context": {
    label: "기초여건",
    baseIndicator: "grid-losses",
    layers: [],
  },
};

export const MAP_LAYER_IDS_V114 = [
  "v114-country-fill",
  "v114-country-outline",
  "v114-country-selected",
  "v114-tna-bubbles",
  "v114-ctcn-bubbles",
  "v114-gcf-bubbles",
  "v114-af-bubbles",
  "v114-gef-bubbles",
  "v114-mdb-bubbles",
] as const;

export const EVIDENCE_DATASET_IDS_V114 = [
  "LDC-DS-C-005-TNA",
  "LDC-DS-D-019-CTCN",
  "LDC-PILOT-D-020-GCF-PROJECTS",
  "LDC-DS-D-018-AF",
  "LDC-DS-E-002",
  "LDC-DS-D-002",
  "LDC-DS-D-011-OECD-ODA",
] as const;

export const MAP_FILTERS_V114 = [
  "country",
  "technology",
  "mitigation-adaptation",
  "organization",
  "project-status",
] as const;

export const MAP_INSTANCE_POLICY_V114 = "single-instance" as const;
export const MAP_RESET_POLICY_V114 = {
  reset: "core-evidence",
  clear: "optional-aggregates-only",
} as const;
export const MAP_GEOMETRY_POLICY_V114 = {
  countryAggregateLabel: "국가 단위 집계",
  verifiedPointLabel: "실제 위치 확인",
  inventedProjectCoordinatesAllowed: false,
} as const;

export const MAP_DATA_SELECTION_V114: MapDataSelectionV114[] = [
  {
    data: "TNA/TAP 우선기술·최신 정책 현재성",
    selected: true,
    role: "country-aggregate",
    geometry: "country-representative-point",
    defaultVisible: true,
    reason:
      "국가가 제시한 기술수요와 현재 정책에서의 재확인 수준을 사업 초기검토에 직접 활용",
  },
  {
    data: "CTCN 기술지원",
    selected: true,
    role: "country-aggregate",
    geometry: "country-representative-point",
    defaultVisible: true,
    reason: "국가가 실제 요청·수행한 국제 기술지원의 존재와 분야를 확인",
  },
  {
    data: "GCF 사업",
    selected: true,
    role: "country-aggregate",
    geometry: "country-representative-point",
    defaultVisible: true,
    reason: "기후재원 기반 기존 사업의 존재와 상태를 확인",
  },
  {
    data: "Adaptation Fund 사업",
    selected: true,
    role: "country-aggregate",
    geometry: "country-representative-point",
    defaultVisible: true,
    reason: "적응사업 포트폴리오의 국가별 분포를 확인",
  },
  {
    data: "GEF 사업",
    selected: true,
    role: "country-aggregate",
    geometry: "country-representative-point",
    defaultVisible: true,
    reason: "공식 사업자료에서 확인된 관련 기술사업의 국가별 분포를 확인",
  },
  {
    data: "World Bank·ADB 프로젝트",
    selected: true,
    role: "country-aggregate",
    geometry: "country-representative-point",
    defaultVisible: true,
    reason: "MDB의 진행·준비 프로젝트를 국제협력·재원 환경과 함께 확인",
  },
  {
    data: "OECD ODA 실제 지출·주요 공여기관",
    selected: true,
    role: "side-panel",
    geometry: "none",
    defaultVisible: true,
    reason:
      "금융개념을 임의 합산하지 않고 선택 국가의 공여환경을 상세 패널에서 확인",
  },
  {
    data: "송배전 손실률 등 선별 국가 기초여건",
    selected: true,
    role: "base-fill",
    geometry: "country-polygon",
    defaultVisible: true,
    reason: "한 번에 하나의 연속형 지표만 국가색으로 표현해 해석가능성을 유지",
  },
  {
    data: "검증된 실제 프로젝트·시설 좌표",
    selected: false,
    role: "verified-point",
    geometry: "verified-coordinate",
    defaultVisible: false,
    reason:
      "현재 공개 기준선에는 검증된 실제 좌표가 없어 가짜 위치표시를 하지 않음",
  },
  {
    data: "총인구·GDP 총액·성장률·실업률·산업 외 부문비중 등",
    selected: false,
    role: "base-fill",
    geometry: "country-polygon",
    defaultVisible: false,
    reason:
      "데이터 상세에서는 유용하지만 통합 협력지도 기본선정에는 직접성이 낮거나 다른 핵심지표와 중복",
  },
];

export interface WorldBankIndicatorMapReviewV114 {
  id: IndicatorId;
  label: string;
  selectedForMap: boolean;
  mapRole: "base-fill" | "data-detail-only";
  reason: string;
}

/**
 * World Bank 연계 19개 국가지표를 국제협력 사업의 초기 공간검토 관점에서 전수 검토한 결과.
 * selectedForMap=false인 지표도 데이터 상세·다운로드에서는 계속 제공한다.
 */
export const WORLD_BANK_INDICATOR_MAP_REVIEW_V114: WorldBankIndicatorMapReviewV114[] =
  [
    {
      id: "population-total",
      label: "총인구",
      selectedForMap: false,
      mapRole: "data-detail-only",
      reason:
        "시장규모 맥락에는 유용하지만 인구 규모가 다른 협력근거를 압도할 수 있어 기본 지도지표에서는 제외",
    },
    {
      id: "urbanization-share",
      label: "도시인구 비율",
      selectedForMap: true,
      mapRole: "base-fill",
      reason:
        "도시 인프라·냉방·건물·수송 협력의 공간적 수요맥락 파악에 직접 활용",
    },
    {
      id: "population-growth",
      label: "인구증가율",
      selectedForMap: false,
      mapRole: "data-detail-only",
      reason:
        "장기 수요맥락에는 유용하지만 초기 기후기술 사업선정의 직접성은 상대적으로 낮음",
    },
    {
      id: "gdp-current",
      label: "GDP",
      selectedForMap: false,
      mapRole: "data-detail-only",
      reason:
        "경제규모는 데이터 상세에서 확인하되 국가 규모 효과가 커 통합 지도 기본 비교에는 부적합",
    },
    {
      id: "gdp-growth",
      label: "GDP 성장률",
      selectedForMap: false,
      mapRole: "data-detail-only",
      reason:
        "거시경제 변동성이 커 기후기술 협력의 구조적 여건을 대표하는 기본 레이어로 사용하지 않음",
    },
    {
      id: "gdp-per-capita",
      label: "1인당 GDP",
      selectedForMap: true,
      mapRole: "base-fill",
      reason: "사업규모·재원조달·지불여건을 해석하는 경제적 맥락으로 활용",
    },
    {
      id: "electricity-access",
      label: "전력 접근률",
      selectedForMap: true,
      mapRole: "base-fill",
      reason:
        "전력 접근성·분산형 전원·전력인프라 협력 필요성을 공간적으로 비교하는 데 직접 활용",
    },
    {
      id: "clean-cooking-access",
      label: "청정취사 접근률",
      selectedForMap: true,
      mapRole: "base-fill",
      reason: "가정에너지 전환·청정취사 기술협력 수요의 기초여건을 직접 보여줌",
    },
    {
      id: "renewable-electricity-share",
      label: "재생에너지 발전 비중",
      selectedForMap: true,
      mapRole: "base-fill",
      reason: "전력부문 에너지전환 수준과 추가 협력여건을 비교하는 핵심 지표",
    },
    {
      id: "grid-losses",
      label: "송배전 손실률",
      selectedForMap: true,
      mapRole: "base-fill",
      reason: "전력망 효율·현대화·디지털화 협력의 초기 진단에 직접 활용",
    },
    {
      id: "poverty-national",
      label: "국가 빈곤선 기준 빈곤율",
      selectedForMap: false,
      mapRole: "data-detail-only",
      reason:
        "개발협력 맥락에는 중요하지만 국가별 빈곤선 정의가 달라 핵심 기후기술 공간비교의 기본 레이어로는 제한적",
    },
    {
      id: "poverty-extreme",
      label: "극빈율",
      selectedForMap: false,
      mapRole: "data-detail-only",
      reason:
        "취약성 맥락에는 유용하나 기술수요·사업·재원 근거와 함께 상세검토하는 것이 적절",
    },
    {
      id: "sector-agriculture-share",
      label: "농업 부가가치 비중",
      selectedForMap: false,
      mapRole: "data-detail-only",
      reason:
        "농업기술 협력에서는 중요하지만 전체 기후기술 협력지도의 기본 레이어로는 특정 부문에 편중",
    },
    {
      id: "sector-industry-share",
      label: "산업 부가가치 비중",
      selectedForMap: true,
      mapRole: "base-fill",
      reason: "산업 탈탄소·효율·공정전환 협력의 경제구조 맥락을 직접 제공",
    },
    {
      id: "sector-manufacturing-share",
      label: "제조업 부가가치 비중",
      selectedForMap: false,
      mapRole: "data-detail-only",
      reason:
        "산업 비중과 정보가 중첩되어 기본지도에서는 중복을 줄이고 상세에서 제공",
    },
    {
      id: "sector-services-share",
      label: "서비스업 부가가치 비중",
      selectedForMap: false,
      mapRole: "data-detail-only",
      reason:
        "기후기술 사업의 초기 기술수요 판단과 직접성이 낮아 상세비교에 유지",
    },
    {
      id: "unemployment-total",
      label: "실업률",
      selectedForMap: false,
      mapRole: "data-detail-only",
      reason:
        "사회경제 맥락에는 유용하지만 기후기술 수요·사업·재원 지도와 직접 연결성이 낮음",
    },
    {
      id: "unemployment-youth",
      label: "청년 실업률",
      selectedForMap: false,
      mapRole: "data-detail-only",
      reason:
        "정의된 사업의 고용·공동편익 검토 단계에서 활용하고 기본 통합지도에서는 제외",
    },
    {
      id: "gini-index",
      label: "지니계수",
      selectedForMap: false,
      mapRole: "data-detail-only",
      reason:
        "포용성 맥락에는 유용하지만 국가별 최신 가용연도 편차가 크고 기후기술 초기선정의 직접성은 낮음",
    },
  ];
