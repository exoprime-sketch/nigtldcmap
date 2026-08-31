import { loadHeatIndexRisk } from "../climate/heatIndexRisk";
import { loadSolarIndicatorData } from "../potential/solarPotential";
import { fetchWorldBankIndicator } from "../../services/worldBankApi";
import type {
  IndicatorDataResult,
  IndicatorObservation,
  PublicIndicator,
} from "../../types/indicator";
import type { MapLayerId } from "../../types/map";
import { publicAssetUrlV128 } from "../../utils/publicAssetUrlV128";

export type IndicatorId =
  | "population-total"
  | "urbanization-share"
  | "population-growth"
  | "gdp-current"
  | "gdp-growth"
  | "gdp-per-capita"
  | "electricity-access"
  | "clean-cooking-access"
  | "renewable-electricity-share"
  | "grid-losses"
  | "heat-index-hi35"
  | "solar-pvout"
  | "solar-ghi"
  | "poverty-national"
  | "poverty-extreme"
  | "sector-agriculture-share"
  | "sector-industry-share"
  | "sector-manufacturing-share"
  | "sector-services-share"
  | "unemployment-total"
  | "unemployment-youth"
  | "gini-index";

export type IndicatorValueMode = "raw" | "gap-to-100";
export type IndicatorPriorityMode = "high" | "low";
export type IndicatorDownloadPolicy = "allowed" | "source-only";

export interface IndicatorLegendItem {
  color: string;
  label: string;
  min: number;
}

export interface IndicatorConfig {
  id: IndicatorId;
  provider: "world-bank" | "cckp" | "solar";
  worldBankCode: string;
  datasetId: string;
  mapLayerId: MapLayerId;
  mapGroup?: "indicator" | "climate" | "technology";
  definition: PublicIndicator;
  mapTitleKo: string;
  mapShortTitleKo: string;
  mapDescriptionKo: string;
  valueMode: IndicatorValueMode;
  decimals: number;
  priorityMode: IndicatorPriorityMode;
  downloadPolicy: IndicatorDownloadPolicy;
  downloadNote?: string;
  priorityTitleKo: string;
  oppositeTitleKo: string;
  decisionQuestionKo: string;
  decisionGuideKo: string;
  referencePeriodLabel?: string;
  timeLabelKo?: string;
  scenarioLabel?: string;
  sourceCode?: string;
  legend: IndicatorLegendItem[];
}

const EMPTY_FALLBACK: IndicatorObservation[] = [];

const ELECTRICITY_ACCESS_FALLBACK: IndicatorObservation[] = [
  { indicatorId: "electricity-access", iso3: "VNM", year: 2024, value: 100 },
  { indicatorId: "electricity-access", iso3: "IDN", year: 2024, value: 99.9 },
  { indicatorId: "electricity-access", iso3: "PHL", year: 2024, value: 94.8 },
  { indicatorId: "electricity-access", iso3: "KHM", year: 2024, value: 99.2 },
  { indicatorId: "electricity-access", iso3: "LAO", year: 2024, value: 96.5 },
  { indicatorId: "electricity-access", iso3: "BGD", year: 2024, value: 99.5 },
  { indicatorId: "electricity-access", iso3: "MNG", year: 2024, value: 99.1 },
];

export const INDICATOR_CONFIGS: IndicatorConfig[] = [
  {
    id: "population-total",
    provider: "world-bank",
    worldBankCode: "SP.POP.TOTL",
    datasetId: "LDC-DS-A-001",
    mapLayerId: "populationTotal",
    definition: {
      id: "population-total",
      titleKo: "총인구",
      titleEn: "Population, total",
      unit: "명",
      sourceOrganization: "World Bank",
      sourceUrl: "https://data.worldbank.org/indicator/SP.POP.TOTL",
      license: "CC BY 4.0",
      availableYears: [],
      description: "국가별 총인구",
      limitations:
        "국가 전체 인구규모이며 지역별 수요·기후기술 수요를 직접 의미하지 않음",
    },
    mapTitleKo: "총인구",
    mapShortTitleKo: "총인구",
    mapDescriptionKo:
      "국가별 인구규모를 비교해 서비스·인프라 수요의 기초 맥락을 확인",
    valueMode: "raw",
    decimals: 0,
    priorityMode: "high",
    downloadPolicy: "allowed",
    priorityTitleKo: "인구규모가 큰 국가",
    oppositeTitleKo: "인구규모가 작은 국가",
    decisionQuestionKo: "협력 대상국의 인구규모는 어느 정도인가?",
    decisionGuideKo:
      "인구는 시장·수요의 기초 맥락으로만 사용하고 도시화·소득·인프라·정책근거를 함께 확인",
    sourceCode: "SP.POP.TOTL",
    legend: [
      { color: "#edf8fb", label: "1천만 미만", min: 0 },
      { color: "#b2e2e2", label: "1천만–5천만", min: 10000000 },
      { color: "#66c2a4", label: "5천만–1억", min: 50000000 },
      { color: "#2ca25f", label: "1억–5억", min: 100000000 },
      { color: "#006d2c", label: "5억 이상", min: 500000000 },
    ],
  },
  {
    id: "urbanization-share",
    provider: "world-bank",
    worldBankCode: "SP.URB.TOTL.IN.ZS",
    datasetId: "LDC-DS-A-007-URBAN",
    mapLayerId: "urbanizationShare",
    definition: {
      id: "urbanization-share",
      titleKo: "도시인구 비율",
      titleEn: "Urban population (% of total population)",
      unit: "%",
      sourceOrganization: "World Bank",
      sourceUrl: "https://data.worldbank.org/indicator/SP.URB.TOTL.IN.ZS",
      license: "CC BY 4.0",
      availableYears: [],
      description: "전체 인구 중 도시지역 거주 인구의 비율",
      limitations:
        "도시 정의가 국가별로 다를 수 있으며 도시 내부 격차는 직접 반영하지 않음",
    },
    mapTitleKo: "도시인구 비율",
    mapShortTitleKo: "도시화율",
    mapDescriptionKo:
      "도시화 수준을 비교해 도시 인프라·건물·수송·냉방 협력의 기초 맥락을 확인",
    valueMode: "raw",
    decimals: 1,
    priorityMode: "high",
    downloadPolicy: "allowed",
    priorityTitleKo: "도시화율이 높은 국가",
    oppositeTitleKo: "도시화율이 낮은 국가",
    decisionQuestionKo:
      "도시 인프라 수요가 집중될 가능성이 높은 국가는 어디인가?",
    decisionGuideKo:
      "도시화율은 기초 맥락이며 실제 협력수요는 도시별 인구·기후위험·인프라·정책을 추가 확인",
    sourceCode: "SP.URB.TOTL.IN.ZS",
    legend: [
      { color: "#f7fcfd", label: "30% 미만", min: 0 },
      { color: "#ccece6", label: "30–50%", min: 30 },
      { color: "#66c2a4", label: "50–70%", min: 50 },
      { color: "#238b45", label: "70–85%", min: 70 },
      { color: "#005824", label: "85% 이상", min: 85 },
    ],
  },
  {
    id: "population-growth",
    provider: "world-bank",
    worldBankCode: "SP.POP.GROW",
    datasetId: "LDC-DS-A-007-GROWTH",
    mapLayerId: "populationGrowth",
    definition: {
      id: "population-growth",
      titleKo: "인구증가율",
      titleEn: "Population growth (annual %)",
      unit: "%",
      sourceOrganization: "World Bank",
      sourceUrl: "https://data.worldbank.org/indicator/SP.POP.GROW",
      license: "CC BY 4.0",
      availableYears: [],
      description: "국가별 연간 인구 증가율",
      limitations: "인구증가율만으로 시장성·기후기술 수요를 판단할 수 없음",
    },
    mapTitleKo: "인구증가율",
    mapShortTitleKo: "인구증가율",
    mapDescriptionKo:
      "인구 변화속도를 비교해 중장기 인프라·서비스 수요의 기초 맥락을 확인",
    valueMode: "raw",
    decimals: 2,
    priorityMode: "high",
    downloadPolicy: "allowed",
    priorityTitleKo: "인구증가율이 높은 국가",
    oppositeTitleKo: "인구증가율이 낮은 국가",
    decisionQuestionKo: "중장기 인구 증가가 빠른 국가는 어디인가?",
    decisionGuideKo:
      "인구증가율은 장기 수요 맥락으로 활용하고 실제 사업수요는 부문별 정책·투자계획과 함께 확인",
    sourceCode: "SP.POP.GROW",
    legend: [
      { color: "#d73027", label: "0% 미만", min: -10 },
      { color: "#fee08b", label: "0–1%", min: 0 },
      { color: "#d9ef8b", label: "1–2%", min: 1 },
      { color: "#66bd63", label: "2–3%", min: 2 },
      { color: "#1a9850", label: "3% 이상", min: 3 },
    ],
  },
  {
    id: "gdp-current",
    provider: "world-bank",
    worldBankCode: "NY.GDP.MKTP.CD",
    datasetId: "LDC-DS-A-003-GDP",
    mapLayerId: "gdpCurrent",
    definition: {
      id: "gdp-current",
      titleKo: "GDP(현재 US$)",
      titleEn: "GDP (current US$)",
      unit: "USD",
      sourceOrganization: "World Bank",
      sourceUrl: "https://data.worldbank.org/indicator/NY.GDP.MKTP.CD",
      license: "CC BY 4.0",
      availableYears: [],
      description: "현재가격 미 달러 기준 국내총생산",
      limitations:
        "환율·물가 영향을 받는 명목 GDP이며 기술시장 규모를 직접 의미하지 않음",
    },
    mapTitleKo: "GDP(현재 US$)",
    mapShortTitleKo: "GDP",
    mapDescriptionKo: "국가 경제규모를 비교해 협력·투자환경의 기초 맥락을 확인",
    valueMode: "raw",
    decimals: 0,
    priorityMode: "high",
    downloadPolicy: "allowed",
    priorityTitleKo: "GDP 규모가 큰 국가",
    oppositeTitleKo: "GDP 규모가 작은 국가",
    decisionQuestionKo: "대상국의 경제규모는 어느 정도인가?",
    decisionGuideKo:
      "GDP는 국가경제의 기초 맥락이며 특정 기후기술 시장규모·사업성을 직접 의미하지 않음",
    sourceCode: "NY.GDP.MKTP.CD",
    legend: [
      { color: "#f7fbff", label: "100억 USD 미만", min: 0 },
      { color: "#c6dbef", label: "100억–500억", min: 10000000000 },
      { color: "#6baed6", label: "500억–2,500억", min: 50000000000 },
      { color: "#2171b5", label: "2,500억–1조", min: 250000000000 },
      { color: "#084594", label: "1조 USD 이상", min: 1000000000000 },
    ],
  },
  {
    id: "gdp-growth",
    provider: "world-bank",
    worldBankCode: "NY.GDP.MKTP.KD.ZG",
    datasetId: "LDC-DS-A-003-GROWTH",
    mapLayerId: "gdpGrowth",
    definition: {
      id: "gdp-growth",
      titleKo: "GDP 성장률",
      titleEn: "GDP growth (annual %)",
      unit: "%",
      sourceOrganization: "World Bank",
      sourceUrl: "https://data.worldbank.org/indicator/NY.GDP.MKTP.KD.ZG",
      license: "CC BY 4.0",
      availableYears: [],
      description: "실질 GDP의 연간 성장률",
      limitations:
        "단기 경기변동 영향을 받으며 기후기술 시장 성장률과 동일하지 않음",
    },
    mapTitleKo: "GDP 성장률",
    mapShortTitleKo: "GDP 성장률",
    mapDescriptionKo: "경제성장 속도를 비교해 거시경제 여건의 변화 방향을 확인",
    valueMode: "raw",
    decimals: 1,
    priorityMode: "high",
    downloadPolicy: "allowed",
    priorityTitleKo: "GDP 성장률이 높은 국가",
    oppositeTitleKo: "GDP 성장률이 낮은 국가",
    decisionQuestionKo: "최근 경제성장 속도가 빠른 국가는 어디인가?",
    decisionGuideKo:
      "성장률은 거시경제 맥락으로 사용하고 기술시장 전망은 부문별 투자·정책자료와 별도 확인",
    sourceCode: "NY.GDP.MKTP.KD.ZG",
    legend: [
      { color: "#b2182b", label: "0% 미만", min: -30 },
      { color: "#fddbc7", label: "0–3%", min: 0 },
      { color: "#d1e5f0", label: "3–6%", min: 3 },
      { color: "#67a9cf", label: "6–10%", min: 6 },
      { color: "#2166ac", label: "10% 이상", min: 10 },
    ],
  },
  {
    id: "gdp-per-capita",
    provider: "world-bank",
    worldBankCode: "NY.GDP.PCAP.CD",
    datasetId: "LDC-DS-A-003-PC",
    mapLayerId: "gdpPerCapita",
    definition: {
      id: "gdp-per-capita",
      titleKo: "1인당 GDP(현재 US$)",
      titleEn: "GDP per capita (current US$)",
      unit: "USD/인",
      sourceOrganization: "World Bank",
      sourceUrl: "https://data.worldbank.org/indicator/NY.GDP.PCAP.CD",
      license: "CC BY 4.0",
      availableYears: [],
      description: "현재가격 미 달러 기준 1인당 국내총생산",
      limitations:
        "소득분배·구매력·지불능력의 지역·계층 차이를 직접 보여주지 않음",
    },
    mapTitleKo: "1인당 GDP(현재 US$)",
    mapShortTitleKo: "1인당 GDP",
    mapDescriptionKo: "국가별 평균 경제수준의 기초 맥락을 비교",
    valueMode: "raw",
    decimals: 0,
    priorityMode: "high",
    downloadPolicy: "allowed",
    priorityTitleKo: "1인당 GDP가 높은 국가",
    oppositeTitleKo: "1인당 GDP가 낮은 국가",
    decisionQuestionKo: "대상국의 평균 경제수준은 어느 정도인가?",
    decisionGuideKo:
      "1인당 GDP는 기초 경제맥락이며 사업의 지불의사·재원조달 가능성은 별도 검토",
    sourceCode: "NY.GDP.PCAP.CD",
    legend: [
      { color: "#f7fcf5", label: "2천 USD 미만", min: 0 },
      { color: "#c7e9c0", label: "2천–5천", min: 2000 },
      { color: "#74c476", label: "5천–1.5만", min: 5000 },
      { color: "#238b45", label: "1.5만–4만", min: 15000 },
      { color: "#00441b", label: "4만 USD 이상", min: 40000 },
    ],
  },
  {
    id: "electricity-access",
    provider: "world-bank",
    worldBankCode: "EG.ELC.ACCS.ZS",
    datasetId: "LDC-DS-D-001",
    mapLayerId: "electricityGap",
    definition: {
      id: "electricity-access",
      titleKo: "전력 접근률",
      titleEn: "Access to electricity",
      unit: "%",
      sourceOrganization: "World Bank",
      sourceUrl: "https://data.worldbank.org/indicator/EG.ELC.ACCS.ZS",
      license: "CC BY 4.0",
      availableYears: [],
      description: "전체 인구 중 전기를 이용할 수 있는 인구의 비율",
      limitations:
        "국가 평균값은 국가 내부 지역 격차와 전력 서비스 품질을 직접 반영하지 않음",
    },
    mapTitleKo: "전력 접근성 격차",
    mapShortTitleKo: "전력 접근성",
    mapDescriptionKo:
      "전력 미접근 인구 비율을 비교해 분산형 전원·미니그리드 협력 수요를 검토",
    valueMode: "gap-to-100",
    decimals: 1,
    priorityMode: "high",
    downloadPolicy: "allowed",
    priorityTitleKo: "전력 미접근 격차가 큰 국가",
    oppositeTitleKo: "전력 접근률이 높은 국가",
    decisionQuestionKo:
      "분산형 전원·미니그리드 협력 수요가 큰 국가는 어디인가?",
    decisionGuideKo:
      "미접근 격차 확대 시 전력 접근 협력 우선 검토, 농촌·도서지역·서비스 품질 추가 확인",
    legend: [
      { color: "#d9f0f0", label: "0–0.5%p", min: 0 },
      { color: "#9bd3cf", label: "0.5–2%p", min: 0.5 },
      { color: "#f6c56f", label: "2–5%p", min: 2 },
      { color: "#d95b43", label: "5%p 이상", min: 5 },
    ],
  },
  {
    id: "clean-cooking-access",
    provider: "world-bank",
    worldBankCode: "EG.CFT.ACCS.ZS",
    datasetId: "LDC-DS-D-003",
    mapLayerId: "cleanCookingGap",
    definition: {
      id: "clean-cooking-access",
      titleKo: "청정조리 접근률",
      titleEn: "Access to clean fuels and technologies for cooking",
      unit: "%",
      sourceOrganization: "World Bank",
      sourceUrl: "https://data.worldbank.org/indicator/EG.CFT.ACCS.ZS",
      license: "World Bank 표시: CC BY 4.0 · 기초 원천 추가조건 검토 필요",
      availableYears: [],
      description:
        "전체 인구 중 청정연료와 청정조리 기술을 이용할 수 있는 인구의 비율",
      limitations:
        "국가 평균값은 도시·농촌, 소득계층과 연료비 부담의 격차를 직접 반영하지 않음",
    },
    mapTitleKo: "청정조리 접근성 격차",
    mapShortTitleKo: "청정조리",
    mapDescriptionKo:
      "청정연료·조리기술 미접근 비율을 비교해 청정조리 보급 협력 수요를 검토",
    valueMode: "gap-to-100",
    decimals: 1,
    priorityMode: "high",
    downloadPolicy: "source-only",
    downloadNote:
      "World Bank 데이터 페이지의 표시 라이선스와 기초 원천의 추가 조건을 검토 중이므로 현재는 공식 원 데이터 링크를 우선 제공",
    priorityTitleKo: "청정조리 미접근 격차가 큰 국가",
    oppositeTitleKo: "청정조리 접근률이 높은 국가",
    decisionQuestionKo:
      "청정조리 기술·연료 전환 협력 수요가 큰 국가는 어디인가?",
    decisionGuideKo:
      "미접근 격차가 클수록 청정연료 공급, 조리기기, 보건·성평등 연계 협력을 우선 검토가능",
    legend: [
      { color: "#edf8e9", label: "0–10%p", min: 0 },
      { color: "#bae4b3", label: "10–30%p", min: 10 },
      { color: "#74c476", label: "30–60%p", min: 30 },
      { color: "#238b45", label: "60%p 이상", min: 60 },
    ],
  },
  {
    id: "renewable-electricity-share",
    provider: "world-bank",
    worldBankCode: "EG.ELC.RNEW.ZS",
    datasetId: "LDC-DS-D-004",
    mapLayerId: "renewableElectricityShare",
    definition: {
      id: "renewable-electricity-share",
      titleKo: "재생에너지 전력 비중",
      titleEn: "Renewable electricity output",
      unit: "%",
      sourceOrganization: "World Bank",
      sourceUrl: "https://data.worldbank.org/indicator/EG.ELC.RNEW.ZS",
      license: "CC BY 4.0",
      availableYears: [],
      description: "총 전력 생산량 중 재생에너지 전력 생산이 차지하는 비율",
      limitations:
        "수력발전 포함 여부·국가별 전원 구성에 따라 해석 상이, 신규 잠재력 직접 지표 아님",
    },
    mapTitleKo: "재생에너지 전력 비중",
    mapShortTitleKo: "재생전력 비중",
    mapDescriptionKo:
      "전력 생산에서 재생에너지가 차지하는 비중을 비교해 에너지전환 현황을 살펴봅니다",
    valueMode: "raw",
    decimals: 1,
    priorityMode: "low",
    downloadPolicy: "allowed",
    priorityTitleKo: "재생에너지 전력 비중이 낮은 국가",
    oppositeTitleKo: "재생에너지 전력 비중이 높은 국가",
    decisionQuestionKo:
      "재생에너지 전환·계통통합 협력 수요를 추가 검토할 국가는 어디인가?",
    decisionGuideKo:
      "낮은 비중은 전환 기회가 될 수 있으나 자원 잠재력, 전력수요, 계통 안정성, 정책 목표를 함께 검토필요",
    legend: [
      { color: "#fff7bc", label: "0–10%", min: 0 },
      { color: "#c7e9b4", label: "10–30%", min: 10 },
      { color: "#7fcdbb", label: "30–60%", min: 30 },
      { color: "#2c7fb8", label: "60% 이상", min: 60 },
    ],
  },
  {
    id: "grid-losses",
    provider: "world-bank",
    worldBankCode: "EG.ELC.LOSS.ZS",
    datasetId: "LDC-DS-D-005",
    mapLayerId: "gridLosses",
    definition: {
      id: "grid-losses",
      titleKo: "송배전 손실률",
      titleEn: "Electric power transmission and distribution losses",
      unit: "%",
      sourceOrganization: "World Bank",
      sourceUrl: "https://data.worldbank.org/indicator/EG.ELC.LOSS.ZS",
      license: "CC BY 4.0",
      availableYears: [],
      description: "전력 생산량 대비 송전·배전 과정에서 발생한 손실의 비율",
      limitations:
        "통계 산정방식, 비기술적 손실과 자가발전 반영 여부가 국가마다 다를 가능",
    },
    mapTitleKo: "송배전 손실률",
    mapShortTitleKo: "전력망 손실",
    mapDescriptionKo:
      "송전·배전 손실률을 비교해 전력망 효율화와 계통 현대화 협력 수요를 살펴봅니다",
    valueMode: "raw",
    decimals: 1,
    priorityMode: "high",
    downloadPolicy: "allowed",
    priorityTitleKo: "송배전 손실률이 높은 국가",
    oppositeTitleKo: "송배전 손실률이 낮은 국가",
    decisionQuestionKo:
      "전력망 효율화·계량·손실관리 협력 수요가 큰 국가는 어디인가?",
    decisionGuideKo:
      "손실률이 높을수록 전력망 보강, 스마트미터, 유지관리와 비기술적 손실 개선을 검토가능",
    legend: [
      { color: "#fff7ec", label: "0–5%", min: 0 },
      { color: "#fdd49e", label: "5–10%", min: 5 },
      { color: "#fc8d59", label: "10–20%", min: 10 },
      { color: "#b30000", label: "20% 이상", min: 20 },
    ],
  },

  {
    id: "heat-index-hi35",
    provider: "cckp",
    worldBankCode: "CCKP:hi35",
    datasetId: "LDC-DS-B-001",
    mapLayerId: "heatIndexHi35",
    mapGroup: "climate",
    definition: {
      id: "heat-index-hi35",
      titleKo: "고온체감 35°C 이상 일수",
      titleEn: "Number of Days with Heat Index >= 35°C",
      unit: "일",
      sourceOrganization: "World Bank Climate Change Knowledge Portal",
      sourceUrl: "https://climateknowledgeportal.worldbank.org/download-data",
      license: "World Bank Open Data 이용조건",
      availableYears: [2050],
      description:
        "2040–2059년 중 체감온도 35°C 이상인 연간 일수의 CMIP6 다중모형 앙상블 중앙값",
      limitations:
        "국가 영역 평균·SSP3-7.0 시나리오 기반 전망 · 국가 내부 도시·농촌·고도 차이 미반영 · 종합 기후위험 점수 아님",
    },
    mapTitleKo: "고온체감 35°C 이상 일수",
    mapShortTitleKo: "고온체감일수",
    mapDescriptionKo:
      "국가별 미래 고온 노출일수 비교 · 냉방·보건·도시열·노동환경 적응 협력 검토",
    valueMode: "raw",
    decimals: 1,
    priorityMode: "high",
    downloadPolicy: "allowed",
    priorityTitleKo: "고온체감일수가 많은 국가",
    oppositeTitleKo: "고온체감일수가 적은 국가",
    decisionQuestionKo:
      "미래 고온 노출에 대응한 냉방·보건·도시 적응 협력이 필요한 국가는 어디인가?",
    decisionGuideKo:
      "고온체감일수 증가 시 고효율 냉방·도시열 저감·보건 대응·노동환경 적응기술 검토",
    referencePeriodLabel: "2040–2059",
    timeLabelKo: "전망기간",
    scenarioLabel: "SSP3-7.0",
    sourceCode: "CCKP hi35",
    legend: [
      { color: "#fff7ec", label: "15일 미만", min: 0 },
      { color: "#fee8c8", label: "15–45일", min: 15 },
      { color: "#fdbb84", label: "45–90일", min: 45 },
      { color: "#e34a33", label: "90–135일", min: 90 },
      { color: "#7f0000", label: "135일 이상", min: 135 },
    ],
  },
  {
    id: "solar-pvout",
    provider: "solar",
    worldBankCode: "GSA:PVOUT-L1",
    datasetId: "LDC-DS-B-002",
    mapLayerId: "solarPvout",
    mapGroup: "technology",
    definition: {
      id: "solar-pvout",
      titleKo: "태양광 발전 잠재량(PVOUT)",
      titleEn: "Practical photovoltaic power potential",
      unit: "kWh/kWp/day",
      sourceOrganization: "World Bank · ESMAP · Solargis",
      sourceUrl: "https://globalsolaratlas.info/global-pv-potential-study/",
      license: "CC BY 4.0 + 필수 출처표시",
      availableYears: [2020],
      description:
        "물리·기술적 제약지역을 제외한 Level 1 실용적 PV 발전 잠재량의 국가별 장기 평균",
      limitations:
        "국가 평균값 · 규제·보전 등 Level 2 제약 미포함 · 부지·계통·인허가·비용 검토 별도 필요",
    },
    mapTitleKo: "태양광 발전 잠재량(PVOUT)",
    mapShortTitleKo: "태양광 PVOUT",
    mapDescriptionKo:
      "국가별 장기 평균 PV 발전 잠재량 비교 · 태양광 기술 협력 가능성 확인",
    valueMode: "raw",
    decimals: 2,
    priorityMode: "high",
    downloadPolicy: "allowed",
    priorityTitleKo: "PVOUT가 높은 국가",
    oppositeTitleKo: "PVOUT가 낮은 국가",
    decisionQuestionKo: "태양광 발전 잠재력이 높은 국가는 어디인가?",
    decisionGuideKo:
      "PVOUT는 자원·기온·시스템 조건을 반영한 국가 평균 잠재량 · 실제 사업 검토 시 부지·계통·인허가 확인",
    referencePeriodLabel: "장기 평균 · 연구 공개 2020",
    timeLabelKo: "자료 기준",
    sourceCode: "GSA:PVOUT-L1",
    legend: [
      { color: "#fff7bc", label: "3.5 미만", min: 0 },
      { color: "#c7e9b4", label: "3.5–4.0", min: 3.5 },
      { color: "#7fcdbb", label: "4.0–4.5", min: 4.0 },
      { color: "#2c7fb8", label: "4.5 이상", min: 4.5 },
    ],
  },
  {
    id: "solar-ghi",
    provider: "solar",
    worldBankCode: "GSA:GHI",
    datasetId: "LDC-DS-B-004",
    mapLayerId: "solarGhi",
    mapGroup: "technology",
    definition: {
      id: "solar-ghi",
      titleKo: "수평면 전일사량(GHI)",
      titleEn: "Global horizontal irradiation",
      unit: "kWh/m²/day",
      sourceOrganization: "World Bank · ESMAP · Solargis",
      sourceUrl: "https://globalsolaratlas.info/global-pv-potential-study/",
      license: "CC BY 4.0 + 필수 출처표시",
      availableYears: [2020],
      description:
        "수평면에 도달하는 직달·산란 일사의 합 · 국가별 장기 평균 태양광 자원",
      limitations:
        "GHI는 이론적 자원지표 · 기온·시스템 구성·음영·오염·부지 제약을 직접 반영하지 않음",
    },
    mapTitleKo: "수평면 전일사량(GHI)",
    mapShortTitleKo: "태양광 GHI",
    mapDescriptionKo:
      "국가별 장기 평균 태양광 자원 비교 · PVOUT와 함께 기술 잠재력 확인",
    valueMode: "raw",
    decimals: 2,
    priorityMode: "high",
    downloadPolicy: "allowed",
    priorityTitleKo: "GHI가 높은 국가",
    oppositeTitleKo: "GHI가 낮은 국가",
    decisionQuestionKo: "태양광 자원 조건이 우수한 국가는 어디인가?",
    decisionGuideKo:
      "GHI는 이론적 태양광 자원 · 실제 PV 발전성능 판단에는 PVOUT·계통·부지 조건 추가 확인",
    referencePeriodLabel: "장기 평균 · 연구 공개 2020",
    timeLabelKo: "자료 기준",
    sourceCode: "GSA:GHI",
    legend: [
      { color: "#fff7bc", label: "4.0 미만", min: 0 },
      { color: "#fec44f", label: "4.0–5.0", min: 4.0 },
      { color: "#fe9929", label: "5.0–5.6", min: 5.0 },
      { color: "#cc4c02", label: "5.6 이상", min: 5.6 },
    ],
  },
  {
    id: "poverty-national",
    provider: "world-bank",
    worldBankCode: "SI.POV.NAHC",
    datasetId: "LDC-DS-A-004-POVERTY-NATIONAL",
    mapLayerId: "povertyNational",
    definition: {
      id: "poverty-national",
      titleKo: "국가빈곤선 이하 인구비율",
      titleEn: "Poverty headcount ratio at national poverty lines",
      unit: "%",
      sourceOrganization: "World Bank · Poverty and Inequality Platform",
      sourceUrl: "https://data.worldbank.org/indicator/SI.POV.NAHC",
      license: "CC BY 4.0",
      availableYears: [],
      description: "국가별 공식 빈곤선 기준 빈곤인구 비율",
      limitations:
        "국가별 빈곤선 정의가 달라 국가 간 절대 수준 비교 시 주의 필요",
    },
    mapTitleKo: "국가빈곤선 이하 인구비율",
    mapShortTitleKo: "빈곤율(국가빈곤선)",
    mapDescriptionKo:
      "국가별 공식 빈곤선 기준 빈곤인구 비율의 최근 가용값 확인",
    valueMode: "raw",
    decimals: 1,
    priorityMode: "high",
    downloadPolicy: "allowed",
    priorityTitleKo: "빈곤율이 높은 국가",
    oppositeTitleKo: "빈곤율이 낮은 국가",
    decisionQuestionKo: "국가 공식 빈곤선 기준 취약인구 비중은 어느 정도인가?",
    decisionGuideKo:
      "국가별 빈곤선 정의가 다르므로 국가 내 추세와 다른 사회경제 지표를 함께 확인",
    sourceCode: "SI.POV.NAHC",
    legend: [
      { color: "#f7fcf5", label: "5% 미만", min: 0 },
      { color: "#c7e9c0", label: "5–15%", min: 5 },
      { color: "#74c476", label: "15–30%", min: 15 },
      { color: "#31a354", label: "30–50%", min: 30 },
      { color: "#006d2c", label: "50% 이상", min: 50 },
    ],
  },
  {
    id: "poverty-extreme",
    provider: "world-bank",
    worldBankCode: "SI.POV.DDAY",
    datasetId: "LDC-DS-A-004-POVERTY-EXTREME",
    mapLayerId: "povertyExtreme",
    definition: {
      id: "poverty-extreme",
      titleKo: "극빈곤 인구비율($3.00, 2021 PPP)",
      titleEn: "Poverty headcount ratio at $3.00 a day (2021 PPP)",
      unit: "%",
      sourceOrganization: "World Bank · Poverty and Inequality Platform",
      sourceUrl: "https://data.worldbank.org/indicator/SI.POV.DDAY",
      license: "CC BY 4.0",
      availableYears: [],
      description: "2021 PPP 기준 일 $3.00 미만으로 생활하는 인구 비율",
      limitations:
        "가계조사 가용연도가 국가별로 다르며 최근값의 기준연도가 서로 다를 수 있음",
    },
    mapTitleKo: "극빈곤 인구비율",
    mapShortTitleKo: "극빈곤율",
    mapDescriptionKo: "국가별 최근 가용 극빈곤 인구비율 확인",
    valueMode: "raw",
    decimals: 1,
    priorityMode: "high",
    downloadPolicy: "allowed",
    priorityTitleKo: "극빈곤율이 높은 국가",
    oppositeTitleKo: "극빈곤율이 낮은 국가",
    decisionQuestionKo: "극빈곤 취약인구 비중은 어느 정도인가?",
    decisionGuideKo:
      "최근 가용연도가 국가별로 다를 수 있어 기준연도를 함께 확인",
    sourceCode: "SI.POV.DDAY",
    legend: [
      { color: "#fff5f0", label: "5% 미만", min: 0 },
      { color: "#fcbba1", label: "5–15%", min: 5 },
      { color: "#fc9272", label: "15–30%", min: 15 },
      { color: "#de2d26", label: "30–50%", min: 30 },
      { color: "#a50f15", label: "50% 이상", min: 50 },
    ],
  },
  {
    id: "sector-agriculture-share",
    provider: "world-bank",
    worldBankCode: "NV.AGR.TOTL.ZS",
    datasetId: "LDC-DS-A-005-AGRI-SHARE",
    mapLayerId: "agricultureShare",
    definition: {
      id: "sector-agriculture-share",
      titleKo: "농림어업 부가가치 비중",
      titleEn: "Agriculture, forestry, and fishing, value added (% of GDP)",
      unit: "%",
      sourceOrganization: "World Bank",
      sourceUrl: "https://data.worldbank.org/indicator/NV.AGR.TOTL.ZS",
      license: "CC BY 4.0",
      availableYears: [],
      description: "GDP 대비 농림어업 부가가치 비중",
      limitations:
        "산업구조의 거시 비중이며 특정 기후기술 수요를 직접 의미하지 않음",
    },
    mapTitleKo: "농림어업 부가가치 비중",
    mapShortTitleKo: "농림어업 비중",
    mapDescriptionKo: "국가 산업구조에서 농림어업 비중을 비교",
    valueMode: "raw",
    decimals: 1,
    priorityMode: "high",
    downloadPolicy: "allowed",
    priorityTitleKo: "농림어업 비중이 높은 국가",
    oppositeTitleKo: "농림어업 비중이 낮은 국가",
    decisionQuestionKo: "국가 산업구조에서 농림어업 비중은 어느 정도인가?",
    decisionGuideKo:
      "산업구조 맥락으로 사용하고 기술수요는 부문 정책·사업 근거와 함께 확인",
    sourceCode: "NV.AGR.TOTL.ZS",
    legend: [
      { color: "#f7fcf5", label: "10% 미만", min: 0 },
      { color: "#c7e9c0", label: "10–20%", min: 10 },
      { color: "#74c476", label: "20–40%", min: 20 },
      { color: "#31a354", label: "40–60%", min: 40 },
      { color: "#006d2c", label: "60% 이상", min: 60 },
    ],
  },
  {
    id: "sector-industry-share",
    provider: "world-bank",
    worldBankCode: "NV.IND.TOTL.ZS",
    datasetId: "LDC-DS-A-005-INDUSTRY-SHARE",
    mapLayerId: "industryShare",
    definition: {
      id: "sector-industry-share",
      titleKo: "산업(건설 포함) 부가가치 비중",
      titleEn: "Industry (including construction), value added (% of GDP)",
      unit: "%",
      sourceOrganization: "World Bank",
      sourceUrl: "https://data.worldbank.org/indicator/NV.IND.TOTL.ZS",
      license: "CC BY 4.0",
      availableYears: [],
      description: "GDP 대비 산업(건설 포함) 부가가치 비중",
      limitations:
        "산업 전체 비중이며 제조업은 이 범주의 하위부문이므로 별도 참고지표로 구분해야 함",
    },
    mapTitleKo: "산업(건설 포함) 부가가치 비중",
    mapShortTitleKo: "산업 비중",
    mapDescriptionKo: "국가 경제구조에서 산업(건설 포함) 비중을 비교",
    valueMode: "raw",
    decimals: 1,
    priorityMode: "high",
    downloadPolicy: "allowed",
    priorityTitleKo: "산업 비중이 높은 국가",
    oppositeTitleKo: "산업 비중이 낮은 국가",
    decisionQuestionKo: "국가 경제구조에서 산업 부가가치 비중은 어느 정도인가?",
    decisionGuideKo:
      "농림어업·산업·서비스를 경제구조의 주 구성으로 보고 제조업은 산업 하위부문 참고지표로 확인",
    sourceCode: "NV.IND.TOTL.ZS",
    legend: [
      { color: "#f7fbff", label: "15% 미만", min: 0 },
      { color: "#c6dbef", label: "15–25%", min: 15 },
      { color: "#6baed6", label: "25–35%", min: 25 },
      { color: "#2171b5", label: "35–50%", min: 35 },
      { color: "#084594", label: "50% 이상", min: 50 },
    ],
  },
  {
    id: "sector-manufacturing-share",
    provider: "world-bank",
    worldBankCode: "NV.IND.MANF.ZS",
    datasetId: "LDC-DS-A-005-MANUF-SHARE",
    mapLayerId: "manufacturingShare",
    definition: {
      id: "sector-manufacturing-share",
      titleKo: "제조업 부가가치 비중",
      titleEn: "Manufacturing, value added (% of GDP)",
      unit: "%",
      sourceOrganization: "World Bank",
      sourceUrl: "https://data.worldbank.org/indicator/NV.IND.MANF.ZS",
      license: "CC BY 4.0",
      availableYears: [],
      description: "GDP 대비 제조업 부가가치 비중",
      limitations:
        "제조업 전체 비중이며 개별 업종의 탈탄소 기술수요를 직접 의미하지 않음",
    },
    mapTitleKo: "제조업 부가가치 비중",
    mapShortTitleKo: "제조업 비중",
    mapDescriptionKo: "국가 산업구조에서 제조업 비중을 비교",
    valueMode: "raw",
    decimals: 1,
    priorityMode: "high",
    downloadPolicy: "allowed",
    priorityTitleKo: "제조업 비중이 높은 국가",
    oppositeTitleKo: "제조업 비중이 낮은 국가",
    decisionQuestionKo: "국가 산업구조에서 제조업 비중은 어느 정도인가?",
    decisionGuideKo:
      "제조업 비중은 산업협력 맥락으로만 활용하고 업종별 실제 수요를 별도 확인",
    sourceCode: "NV.IND.MANF.ZS",
    legend: [
      { color: "#f7fbff", label: "10% 미만", min: 0 },
      { color: "#c6dbef", label: "10–20%", min: 10 },
      { color: "#6baed6", label: "20–40%", min: 20 },
      { color: "#2171b5", label: "40–60%", min: 40 },
      { color: "#084594", label: "60% 이상", min: 60 },
    ],
  },
  {
    id: "sector-services-share",
    provider: "world-bank",
    worldBankCode: "NV.SRV.TOTL.ZS",
    datasetId: "LDC-DS-A-005-SERVICES-SHARE",
    mapLayerId: "servicesShare",
    definition: {
      id: "sector-services-share",
      titleKo: "서비스업 부가가치 비중",
      titleEn: "Services, value added (% of GDP)",
      unit: "%",
      sourceOrganization: "World Bank",
      sourceUrl: "https://data.worldbank.org/indicator/NV.SRV.TOTL.ZS",
      license: "CC BY 4.0",
      availableYears: [],
      description: "GDP 대비 서비스업 부가가치 비중",
      limitations:
        "서비스업 전체 비중이며 개별 서비스 부문의 기술수요를 직접 의미하지 않음",
    },
    mapTitleKo: "서비스업 부가가치 비중",
    mapShortTitleKo: "서비스업 비중",
    mapDescriptionKo: "국가 산업구조에서 서비스업 비중을 비교",
    valueMode: "raw",
    decimals: 1,
    priorityMode: "high",
    downloadPolicy: "allowed",
    priorityTitleKo: "서비스업 비중이 높은 국가",
    oppositeTitleKo: "서비스업 비중이 낮은 국가",
    decisionQuestionKo: "국가 산업구조에서 서비스업 비중은 어느 정도인가?",
    decisionGuideKo: "거시 산업구조 맥락으로만 활용",
    sourceCode: "NV.SRV.TOTL.ZS",
    legend: [
      { color: "#fff7fb", label: "20% 미만", min: 0 },
      { color: "#ece7f2", label: "20–40%", min: 20 },
      { color: "#a6bddb", label: "40–60%", min: 40 },
      { color: "#2b8cbe", label: "60–80%", min: 60 },
      { color: "#045a8d", label: "80% 이상", min: 80 },
    ],
  },
  {
    id: "unemployment-total",
    provider: "world-bank",
    worldBankCode: "SL.UEM.TOTL.ZS",
    datasetId: "LDC-DS-A-006-UNEMPLOYMENT",
    mapLayerId: "unemploymentTotal",
    definition: {
      id: "unemployment-total",
      titleKo: "실업률",
      titleEn:
        "Unemployment, total (% of total labor force) (modeled ILO estimate)",
      unit: "%",
      sourceOrganization: "ILOEST · World Bank",
      sourceUrl: "https://data.worldbank.org/indicator/SL.UEM.TOTL.ZS",
      license: "CC BY 4.0",
      availableYears: [],
      description: "ILO 모델 추정 기준 전체 노동력 대비 실업률",
      limitations: "모델 추정치이며 국가 통계와 차이가 날 수 있음",
    },
    mapTitleKo: "실업률",
    mapShortTitleKo: "실업률",
    mapDescriptionKo: "국가별 노동시장 여건의 기초 맥락 확인",
    valueMode: "raw",
    decimals: 1,
    priorityMode: "high",
    downloadPolicy: "allowed",
    priorityTitleKo: "실업률이 높은 국가",
    oppositeTitleKo: "실업률이 낮은 국가",
    decisionQuestionKo: "노동시장 실업률은 어느 정도인가?",
    decisionGuideKo:
      "기술인력 수급을 직접 의미하지 않으므로 직종·숙련도 자료를 별도 확인",
    sourceCode: "SL.UEM.TOTL.ZS",
    legend: [
      { color: "#ffffcc", label: "5% 미만", min: 0 },
      { color: "#c2e699", label: "5–10%", min: 5 },
      { color: "#78c679", label: "10–15%", min: 10 },
      { color: "#31a354", label: "15–25%", min: 15 },
      { color: "#006837", label: "25% 이상", min: 25 },
    ],
  },
  {
    id: "unemployment-youth",
    provider: "world-bank",
    worldBankCode: "SL.UEM.1524.ZS",
    datasetId: "LDC-DS-A-006-YOUTH-UNEMPLOYMENT",
    mapLayerId: "unemploymentYouth",
    definition: {
      id: "unemployment-youth",
      titleKo: "청년 실업률",
      titleEn:
        "Unemployment, youth total (% of total labor force ages 15-24) (modeled ILO estimate)",
      unit: "%",
      sourceOrganization: "ILOEST · World Bank",
      sourceUrl: "https://data.worldbank.org/indicator/SL.UEM.1524.ZS",
      license: "CC BY 4.0",
      availableYears: [],
      description: "15–24세 노동력 대비 청년 실업률(ILO 모델 추정)",
      limitations: "모델 추정치이며 교육·비경제활동 청년 전체를 의미하지 않음",
    },
    mapTitleKo: "청년 실업률",
    mapShortTitleKo: "청년 실업",
    mapDescriptionKo: "국가별 청년 노동시장 여건 확인",
    valueMode: "raw",
    decimals: 1,
    priorityMode: "high",
    downloadPolicy: "allowed",
    priorityTitleKo: "청년 실업률이 높은 국가",
    oppositeTitleKo: "청년 실업률이 낮은 국가",
    decisionQuestionKo: "청년 노동시장 여건은 어느 정도인가?",
    decisionGuideKo:
      "기후기술 인력풀과 동일하지 않으므로 기술·직종별 역량자료와 함께 확인",
    sourceCode: "SL.UEM.1524.ZS",
    legend: [
      { color: "#ffffd4", label: "10% 미만", min: 0 },
      { color: "#fed98e", label: "10–20%", min: 10 },
      { color: "#fe9929", label: "20–30%", min: 20 },
      { color: "#d95f0e", label: "30–40%", min: 30 },
      { color: "#993404", label: "40% 이상", min: 40 },
    ],
  },
  {
    id: "gini-index",
    provider: "world-bank",
    worldBankCode: "SI.POV.GINI",
    datasetId: "LDC-DS-A-008-GINI",
    mapLayerId: "giniIndex",
    definition: {
      id: "gini-index",
      titleKo: "지니계수",
      titleEn: "Gini index",
      unit: "점",
      sourceOrganization: "World Bank · Poverty and Inequality Platform",
      sourceUrl: "https://data.worldbank.org/indicator/SI.POV.GINI",
      license: "CC BY 4.0",
      availableYears: [],
      description: "가계조사 기반 소득·소비 분포의 불평등 정도",
      limitations:
        "조사연도·소득/소비 개념이 국가별로 다를 수 있어 기준연도와 방법론 확인 필요",
    },
    mapTitleKo: "지니계수",
    mapShortTitleKo: "지니계수",
    mapDescriptionKo: "국가별 최근 가용 불평등 수준의 기초 맥락 확인",
    valueMode: "raw",
    decimals: 1,
    priorityMode: "high",
    downloadPolicy: "allowed",
    priorityTitleKo: "지니계수가 높은 국가",
    oppositeTitleKo: "지니계수가 낮은 국가",
    decisionQuestionKo: "소득·소비 분포 불평등 수준은 어느 정도인가?",
    decisionGuideKo:
      "조사연도와 방법론 차이를 함께 확인하고 협력수요를 직접 추정하지 않음",
    sourceCode: "SI.POV.GINI",
    legend: [
      { color: "#f7fcf0", label: "30 미만", min: 0 },
      { color: "#ccebc5", label: "30–35", min: 30 },
      { color: "#7bccc4", label: "35–40", min: 35 },
      { color: "#2b8cbe", label: "40–50", min: 40 },
      { color: "#084081", label: "50 이상", min: 50 },
    ],
  },
];

export const INDICATOR_CONFIG_BY_ID = new Map(
  INDICATOR_CONFIGS.map((config) => [config.id, config])
);

export const INDICATOR_CONFIG_BY_MAP_LAYER = new Map(
  INDICATOR_CONFIGS.map((config) => [config.mapLayerId, config])
);

const FALLBACK_BY_ID: Record<IndicatorId, IndicatorObservation[]> = {
  "population-total": EMPTY_FALLBACK,
  "urbanization-share": EMPTY_FALLBACK,
  "population-growth": EMPTY_FALLBACK,
  "gdp-current": EMPTY_FALLBACK,
  "gdp-growth": EMPTY_FALLBACK,
  "gdp-per-capita": EMPTY_FALLBACK,
  "electricity-access": ELECTRICITY_ACCESS_FALLBACK,
  "clean-cooking-access": EMPTY_FALLBACK,
  "renewable-electricity-share": EMPTY_FALLBACK,
  "grid-losses": EMPTY_FALLBACK,
  "heat-index-hi35": EMPTY_FALLBACK,
  "solar-pvout": EMPTY_FALLBACK,
  "solar-ghi": EMPTY_FALLBACK,
  "poverty-national": EMPTY_FALLBACK,
  "poverty-extreme": EMPTY_FALLBACK,
  "sector-agriculture-share": EMPTY_FALLBACK,
  "sector-industry-share": EMPTY_FALLBACK,
  "sector-manufacturing-share": EMPTY_FALLBACK,
  "sector-services-share": EMPTY_FALLBACK,
  "unemployment-total": EMPTY_FALLBACK,
  "unemployment-youth": EMPTY_FALLBACK,
  "gini-index": EMPTY_FALLBACK,
};

export function isIndicatorId(value: string | undefined): value is IndicatorId {
  return Boolean(value && INDICATOR_CONFIG_BY_ID.has(value as IndicatorId));
}

export function getIndicatorConfig(id: string): IndicatorConfig {
  const config = INDICATOR_CONFIG_BY_ID.get(id as IndicatorId);
  if (!config) {
    throw new Error(`지원하지 않는 지표: ${id}`);
  }
  return config;
}

interface IndicatorSnapshot {
  indicatorId: IndicatorId;
  worldBankCode: string;
  fetchedAt?: string;
  lastUpdated?: string | null;
  observations: IndicatorObservation[];
}

async function loadIndicatorSnapshot(
  id: IndicatorId
): Promise<IndicatorDataResult | null> {
  try {
    const response = await fetch(publicAssetUrlV128(`data/worldbank/${id}.json`), {
      headers: { Accept: "application/json" },
    });
    if (!response.ok) return null;
    const snapshot = (await response.json()) as IndicatorSnapshot;
    if (!Array.isArray(snapshot.observations)) return null;
    return {
      observations: snapshot.observations.map((item) => ({
        ...item,
        indicatorId: id,
      })),
      lastUpdated: snapshot.lastUpdated ?? snapshot.fetchedAt ?? null,
      isFallback: true,
      warning:
        "원천 서비스에 일시적으로 연결할 수 없어 최근 저장된 데이터 스냅샷을 표시",
    };
  } catch {
    return null;
  }
}

export async function loadIndicatorData(
  id: IndicatorId,
  force = false
): Promise<IndicatorDataResult> {
  const config = getIndicatorConfig(id);

  if (config.provider === "cckp") {
    return loadHeatIndexRisk(force);
  }

  if (config.provider === "solar") {
    return loadSolarIndicatorData(
      id === "solar-pvout" ? "solar-pvout" : "solar-ghi",
      force
    );
  }

  try {
    const result = await fetchWorldBankIndicator(
      config.worldBankCode,
      10,
      force
    );
    return {
      ...result,
      sourceStatus: result.isFallback ? "snapshot" : "live-api",
      observations: result.observations.map((item) => ({
        ...item,
        indicatorId: config.id,
      })),
    };
  } catch {
    const snapshot = await loadIndicatorSnapshot(id);
    if (snapshot) {
      return {
        ...snapshot,
        sourceStatus: "snapshot",
      };
    }
    return {
      observations: FALLBACK_BY_ID[id],
      lastUpdated: null,
      isFallback: true,
      sourceStatus: FALLBACK_BY_ID[id].length > 0 ? "snapshot" : "unavailable",
      warning:
        FALLBACK_BY_ID[id].length > 0
          ? "원천 서비스 연결 지연 · 코드 포함 최소 저장값 표시"
          : "원 데이터 서비스 연결 실패 · 지표값 표시 불가",
    };
  }
}

export function getIndicatorTimeLabel(config: IndicatorConfig): string {
  return config.timeLabelKo ?? "기준연도";
}

export function formatIndicatorReferencePeriod(
  config: IndicatorConfig,
  year: number | null
): string {
  if (config.referencePeriodLabel) return config.referencePeriodLabel;
  return year === null ? "자료 없음" : `${year}년`;
}

export function getIndicatorSourceCode(config: IndicatorConfig): string {
  return config.sourceCode ?? config.worldBankCode;
}

export function getIndicatorSourceStatusLabel(
  result: IndicatorDataResult | null | undefined
): string {
  if (!result?.sourceStatus) {
    return result?.isFallback ? "저장본" : "원천 API";
  }

  if (result.sourceStatus === "live-api") return "원천 API";
  if (result.sourceStatus === "snapshot") return "저장본";
  return "연결 불가";
}

export function getIndicatorYears(
  observations: IndicatorObservation[]
): number[] {
  return Array.from(new Set(observations.map((item) => item.year))).sort(
    (a, b) => b - a
  );
}

export function createObservationIndex(
  observations: IndicatorObservation[]
): Map<string, number> {
  const index = new Map<string, number>();
  observations.forEach((item) => {
    if (typeof item.value === "number" && Number.isFinite(item.value)) {
      index.set(`${item.iso3}:${item.year}`, item.value);
    }
  });
  return index;
}

export function getLatestObservationForCountry(
  observations: IndicatorObservation[],
  iso3: string
): IndicatorObservation | null {
  return (
    observations
      .filter((item) => item.iso3 === iso3 && typeof item.value === "number")
      .sort((a, b) => b.year - a.year)[0] ?? null
  );
}

export function toMapValue(
  config: IndicatorConfig,
  rawValue: number | null
): number | null {
  if (rawValue === null) return null;
  return config.valueMode === "gap-to-100"
    ? Number((100 - rawValue).toFixed(config.decimals))
    : rawValue;
}

export function formatRawValue(
  config: IndicatorConfig,
  rawValue: number | null
): string {
  if (rawValue === null) return "자료 없음";
  return `${rawValue.toFixed(config.decimals)}${config.definition.unit}`;
}

export function formatMapValue(
  config: IndicatorConfig,
  rawValue: number | null
): string {
  const mapValue = toMapValue(config, rawValue);
  if (mapValue === null) return "자료 없음";
  return config.valueMode === "gap-to-100"
    ? `${mapValue.toFixed(config.decimals)}%p`
    : `${mapValue.toFixed(config.decimals)}${config.definition.unit}`;
}

export function getPriorityScore(
  config: IndicatorConfig,
  rawValue: number | null
): number | null {
  if (rawValue === null) return null;
  return config.priorityMode === "high"
    ? toMapValue(config, rawValue)
    : -rawValue;
}

export function getLegendColor(
  config: IndicatorConfig,
  value: number | null
): string {
  if (value === null) return "#cbd5df";
  let color = config.legend[0]?.color ?? "#cbd5df";
  config.legend.forEach((item) => {
    if (value >= item.min) color = item.color;
  });
  return color;
}
