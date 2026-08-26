import type {
  VietnamDemoElement,
  VietnamPresentationProfile,
} from "../types/vietnamDemo";
import { getSemanticPublicTitleV65 } from "./dataSemanticPresentationV65";
import { getSpatialPublicTitleV66 } from "./spatialPresentationV66";
import { getCapabilityPublicTitleV67 } from "./capabilityPresentationV67";
import { getDimensionPublicTitleV68 } from "./dataDimensionV68";
import { getContextualPublicTitleV73 } from "./contextualPresentationV73";

export type FinalPreviewMode =
  | "index_benchmark"
  | "kpi_trend"
  | "composition"
  | "relationship_crosswalk"
  | "sdg_scorecard"
  | "map"
  | "seasonal_calendar"
  | "seasonal_comparison"
  | "scenario"
  | "hazard_dashboard"
  | "risk_dashboard"
  | "event_timeline"
  | "policy_evidence"
  | "policy_timeline"
  | "agreement_timeline"
  | "process"
  | "requirements_matrix"
  | "document_library"
  | "portfolio"
  | "finance_portfolio"
  | "opportunity_table"
  | "directory"
  | "capability_matrix"
  | "participation_status"
  | "comparative_matrix"
  | "research_dashboard"
  | "trade_dashboard"
  | "cost_comparison"
  | "mineral_dashboard"
  | "mineral_inventory"
  | "market_dashboard"
  | "budget_dashboard"
  | "competitor_dashboard"
  | "support_programs"
  | "table";

const SPECIAL_MODES: Record<string, FinalPreviewMode> = {
  "A-013": "relationship_crosswalk",
  "A-015": "sdg_scorecard",
  "B-023": "seasonal_comparison",
  "B-044": "mineral_inventory",
  "C-012": "requirements_matrix",
  "C-015": "document_library",
  "D-007": "capability_matrix",
  "D-017": "opportunity_table",
  "E-015": "participation_status",
  "E-017": "comparative_matrix",
};

const BILATERAL = new Set([
  "A-029",
  "A-030",
  "D-014",
  "D-015",
  "D-016",
  "D-017",
  "E-014",
  "E-018",
  "E-019",
]);

const KOREA_COMMON = new Set(["E-016", "E-017", "E-020"]);

export function getFinalPreviewMode(
  element: VietnamDemoElement
): FinalPreviewMode {
  if (SPECIAL_MODES[element.elementId]) return SPECIAL_MODES[element.elementId];

  switch (element.presentation.primaryView) {
    case "score_benchmark":
      return "index_benchmark";
    case "kpi_trend":
      return "kpi_trend";
    case "composition":
    case "stacked_emissions":
      return "composition";
    case "matrix":
    case "capability_matrix":
      return "capability_matrix";
    case "map":
    case "resource_map":
    case "forest_monitor":
    case "landcover_map":
      return "map";
    case "seasonal_calendar":
      return "seasonal_calendar";
    case "climate_scenario":
    case "scenario_lines":
      return "scenario";
    case "hazard_dashboard":
      return "hazard_dashboard";
    case "risk_dashboard":
      return "risk_dashboard";
    case "event_timeline":
      return "event_timeline";
    case "policy_evidence":
      return "policy_evidence";
    case "policy_timeline":
      return "policy_timeline";
    case "agreement_timeline":
      return "agreement_timeline";
    case "process":
      return "process";
    case "portfolio":
      return "portfolio";
    case "finance_portfolio":
      return "finance_portfolio";
    case "directory":
      return "directory";
    case "research_dashboard":
      return "research_dashboard";
    case "trade_dashboard":
      return "trade_dashboard";
    case "cost_comparison":
      return "cost_comparison";
    case "mineral_dashboard":
      return "mineral_dashboard";
    case "market_dashboard":
      return "market_dashboard";
    case "budget_dashboard":
      return "budget_dashboard";
    case "competitor_dashboard":
      return "competitor_dashboard";
    case "support_programs":
      return "support_programs";
    default:
      return "table";
  }
}

export function toCountryNeutralQuestion(question: string): string {
  return question
    .trim()
    .replace(/^한국과\s+베트남\s+간\s*/i, "한국과 대상국 간 ")
    .replace(/^한국-베트남\s*/i, "한국-대상국 ")
    .replace(/^베트남\s+내\s*/i, "대상국 내 ")
    .replace(/^베트남에서\s*/i, "")
    .replace(/^베트남에\s*/i, "")
    .replace(/^베트남은\s*/i, "")
    .replace(/^베트남의\s*/i, "")
    .replace(/^베트남\s*/i, "");
}

export function getFinalUserQuestion(element: VietnamDemoElement): string {
  const overrides: Record<string, string> = {
    "A-005":
      "경제에서 농림어업·산업·서비스업은 어떻게 구성되며 제조업 비중은 어느 정도인가?",
    "B-001": "건기·우기는 언제이며 지역별 계절성은 어떻게 다른가?",
    "B-003": "월별 기온·강수의 계절 분포는 어떻게 나타나는가?",
    "B-012": "어떤 재해가 언제·어디서 발생했고 피해 규모는 어느 정도였는가?",
    "C-001": "NDC의 감축·적응 목표와 부문별 이행수단·지원수요는 무엇인가?",
    "C-011": "사업·출장 시 어떤 지역·위험요인을 주의해야 하는가?",
    "C-014":
      "사업유형·기술에 따라 어떤 인허가가 필요하고 담당기관·기간·선후행 조건은 무엇인가?",
    "E-015": "NDC Partnership 참여·지원 활동과 주요 파트너는 무엇인가?",
  };

  return (
    overrides[element.elementId] ??
    toCountryNeutralQuestion(element.presentation.userQuestion)
  );
}

export function getContextLabel(
  elementId: string,
  countryName: string
): string {
  if (KOREA_COMMON.has(elementId)) return "한국 공급·지원 정보";
  if (BILATERAL.has(elementId)) return `한국-대상국 · ${countryName}`;
  return `대상국 · ${countryName}`;
}

export function getFinalDisplayTitle(element: VietnamDemoElement): string {
  const contextualTitle = getContextualPublicTitleV73(element.elementId);
  if (contextualTitle) return contextualTitle;

  const capabilityTitle = getCapabilityPublicTitleV67(element.elementId);
  if (capabilityTitle) return capabilityTitle;

  const dimensionTitle = getDimensionPublicTitleV68(element.elementId);
  if (dimensionTitle) return dimensionTitle;

  const spatialTitle = getSpatialPublicTitleV66(element.elementId);
  if (spatialTitle) return spatialTitle;

  const semanticTitle = getSemanticPublicTitleV65(element.elementId);
  if (semanticTitle) return semanticTitle;

  const overrides: Record<string, string> = {
    "A-005": "산업구조 (농업·산업·서비스 비중 · 제조업 참고)",
    "B-006": "폭염·열대야·고온체감 지표",
    "B-007": "극한강수·호우 지표",
    "B-041": "태양광 자원·발전 잠재량",
    "A-013": "NDC–SDG 연계",
    "A-015": "SDG 목표별 달성도",
    "C-001": "NDC 제출·목표·이행 근거",
    "C-002": "BTR 배출·이행·지원 정보",
    "C-003": "NAP 적응 우선순위·투자수요",
    "C-004": "LT-LEDS 장기 탈탄소 경로",
    "C-005": "TNA 기술수요·장벽·실행계획",
    "C-012": "PPP 법제도·조달 체계",
    "C-015": "재생에너지 정책 원문",
    "D-017": "한국 ODA PCP·입찰 정보",
    "E-015": "NDC Partnership 참여·지원 현황",
    "E-017": "한국-경쟁국 기후기술 비교우위",
  };
  return overrides[element.elementId] ?? element.titleShort;
}

function hash(input: string): number {
  let h = 2166136261;
  for (let i = 0; i < input.length; i += 1) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h >>> 0);
}

export function sampleNumber(seed: string, min: number, max: number): number {
  const ratio = (hash(seed) % 10000) / 10000;
  return min + ratio * (max - min);
}

export function sampleTrend(seed: string, count = 8): number[] {
  const base = sampleNumber(`${seed}:base`, 35, 72);
  const slope = sampleNumber(`${seed}:slope`, -1.2, 3.2);
  return Array.from({ length: count }, (_, index) => {
    const wave = Math.sin(index * 1.22 + (hash(seed) % 8)) * 3.1;
    return Math.max(3, base + slope * index + wave);
  });
}

export function sampleFieldValue(
  field: string,
  elementId: string,
  index = 0
): string {
  const text = field.replace(/\s+/g, "");
  const n = sampleNumber(`${elementId}:${field}:${index}`, 0, 1);

  if (/NDC조치/.test(text))
    return ["재생에너지 확대", "산림 흡수원 강화", "기후회복력 농업"][
      index % 3
    ];
  if (/연결SDG/.test(text))
    return ["SDG 7 · 9 · 13", "SDG 13 · 15", "SDG 2 · 13"][index % 3];
  if (/연계근거/.test(text)) return "NDC 원문 조치와 SDG 목표 간 연결 근거";
  if (/우선기술/.test(text)) return "태양광 · 전력망 · 에너지효율";
  if (/우선섹터|우선분야/.test(text)) return "에너지 · 산업 · 농업";
  if (/장벽/.test(text)) return "재원 · 제도 · 기술역량";
  if (/기술|대상기술/.test(text) && !/기술별/.test(text))
    return "태양광 · 풍력 · 에너지효율";
  if (/기관|부처|인가기관|시행기관|실행기관|발주기관|투자자/.test(text))
    return "기관명 예시";
  if (/담당자/.test(text)) return "담당자 예시";
  if (/이메일/.test(text)) return "contact@example.org";
  if (/전화/.test(text)) return "+00 00 0000 0000";
  if (/법령명|문서명|프로젝트|사업명|활동명|이니셔티브/.test(text))
    return "공식 명칭 예시";
  if (/상태|참여여부|도입여부|유무|단계|이행상태/.test(text))
    return ["시행 중", "확인", "일부 확인"][index % 3];
  if (/원문|링크|URL/.test(text)) return "공식 원문 링크";
  if (/순위/.test(text)) return `${Math.round(18 + n * 72)}위`;
  if (/CPIA|점수|지수|총점/.test(text)) return (2.8 + n * 2.0).toFixed(1);
  if (/비중|비율|성장률|실업|빈곤|손실률|도시화/.test(text))
    return `${(4 + n * 78).toFixed(1)}%`;
  if (/GDP/.test(text) && /1인당/.test(text))
    return `USD ${Math.round(2500 + n * 9000).toLocaleString("en-US")}`;
  if (/GDP/.test(text)) return `USD ${(140 + n * 420).toFixed(1)}B`;
  if (/금액|재원|사업비|투자액|예산|비용/.test(text))
    return `USD ${(8 + n * 170).toFixed(1)}M`;
  if (/인구/.test(text))
    return `${Math.round(30_000_000 + n * 75_000_000).toLocaleString(
      "ko-KR"
    )}명`;
  if (/감축량|발행량|소각량|배출량|GHG/.test(text))
    return `${(0.8 + n * 27).toFixed(1)} MtCO₂e`;
  if (/면적/.test(text))
    return `${Math.round(5000 + n * 85000).toLocaleString("ko-KR")} km²`;
  if (/생산량|매장량/.test(text))
    return `${Math.round(50000 + n * 950000).toLocaleString("ko-KR")} t`;
  if (/LCOE/.test(text)) return `USD ${(0.05 + n * 0.12).toFixed(3)}/kWh`;
  if (/풍속/.test(text)) return `${(4.5 + n * 4.0).toFixed(1)} m/s`;
  if (/GHI|DNI|일사/.test(text))
    return `${(3.2 + n * 2.5).toFixed(2)} kWh/m²/day`;
  if (/유량/.test(text)) return `${Math.round(180 + n * 3200)} m³/s`;
  if (/기간/.test(text)) return `${Math.round(2 + n * 9)}년`;
  if (/연도|승인일|발행일|체결일/.test(text))
    return `${2020 + Math.round(n * 5)}`;
  if (/지역|위치|유역|행정구역/.test(text)) return "지역명 예시";
  if (/분야|섹터|부문/.test(text)) return "에너지 · 산업";
  if (/유형/.test(text)) return "프로젝트/정책 유형";
  if (/지원내용/.test(text)) return "정책·기술·재원 지원";
  if (/CountryPage/.test(text)) return "공식 Country Page";

  return `${(20 + n * 75).toFixed(1)}`;
}

export function modeLabel(mode: FinalPreviewMode): string {
  const labels: Record<FinalPreviewMode, string> = {
    index_benchmark: "최신값 · 추세 · 국가 비교",
    kpi_trend: "핵심지표 · 연도별 추세",
    composition: "구성비 · 변화 추세",
    relationship_crosswalk: "관계 매핑 · 원문 근거",
    sdg_scorecard: "SDG 목표별 상태 · 추세",
    map: "지도 · 지역별 값 · 속성표",
    seasonal_calendar: "월별 기후 캘린더",
    seasonal_comparison: "건기·우기 비교 · 관측지점",
    scenario: "과거·미래 · 시나리오 비교",
    hazard_dashboard: "극한지수 · 시나리오 · 추세",
    risk_dashboard: "위험수준 · 구성요인 · 추세",
    event_timeline: "사건 타임라인 · 피해규모",
    policy_evidence: "정책 요약 · 공식 원문 근거",
    policy_timeline: "제도 타임라인 · 상태",
    agreement_timeline: "협정 타임라인 · 이행상태",
    process: "절차 · 기관 · 기간 · 비용",
    requirements_matrix: "법제도 · 조달요건 · 역할",
    document_library: "공식 문서 · 발행기관 · 원문",
    portfolio: "사업 요약 · 프로젝트 목록",
    finance_portfolio: "재원 요약 · 투자 목록",
    opportunity_table: "공고 · 예산 · 마감 · 자격",
    directory: "기관 · 역할 · 연락경로",
    capability_matrix: "항목별 상태 · 판정근거",
    participation_status: "참여상태 · 지원내용 · 공식 페이지",
    comparative_matrix: "한국-경쟁국 비교 · 근거",
    research_dashboard: "연구·특허 추세 · 기관·기술",
    trade_dashboard: "교역 추세 · 품목·파트너",
    cost_comparison: "기술별 비용 비교",
    mineral_dashboard: "광물별 매장량 · 생산량 · 순위",
    mineral_inventory: "핵심광물 보유 여부 · 후속 상세",
    market_dashboard: "시장규모 · 성장률 · 비용",
    budget_dashboard: "예산 추세 · 부처·분야 구성",
    competitor_dashboard: "공여국·기업 비교 · 프로젝트",
    support_programs: "지원프로그램 · 일정 · 자격",
    table: "세부 데이터 표",
  };
  return labels[mode];
}

export function profileFor(
  element: VietnamDemoElement
): VietnamPresentationProfile {
  return element.presentation;
}
