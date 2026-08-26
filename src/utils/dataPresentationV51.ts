import type { VietnamPresentationProfile } from "../types/vietnamDemo";

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

export function getPlannedFieldGuide(
  field: string,
  profile: VietnamPresentationProfile
): string {
  const text = field.replace(/\s+/g, "");

  if (/최근변화|추세|증감/.test(text)) return "연도별 값 · 증감 · 기준기간";
  if (/순위/.test(text)) return "순위 · 비교대상 · 기준연도";
  if (/점수|지수|총점/.test(text)) return "값/점수 · 기준연도 · 산정기준";
  if (/비중|구성/.test(text)) return "구성비 · 절대값(가용 시) · 기준연도";
  if (/금액|재원|사업비|투자액|예산|비용/.test(text))
    return "금액 · 통화 · 기준연도/상태";
  if (/기관|부처|담당자|실행기관|시행기관|인가기관/.test(text))
    return "기관명 · 역할 · 공식 근거";
  if (/연락|이메일|전화/.test(text)) return "공식 연락경로 · 확인일";
  if (/기간|일정|연도|승인일|발행일|체결일/.test(text))
    return "일자/기간 · 상태 · 기준일";
  if (/지역|위치|좌표|유역|행정구역/.test(text))
    return "지역명 · 행정구역 · 좌표(가용 시)";
  if (/상태|여부|유무|단계/.test(text)) return "현재 상태 · 기준일 · 근거";
  if (/목표/.test(text)) return "목표값 · 목표연도 · 조건/범위";
  if (/원문|문서|법령|협정/.test(text))
    return "문서명 · 원문 · 위치 · 공식 URL";
  if (/기술|부문|분야|섹터/.test(text)) return "분류 · 명칭 · 관련 근거";
  if (/배출|감축량|발행량|소각량/.test(text))
    return "값 · 단위(tCO₂e 등) · 기준기간";
  if (
    /인구|GDP|실업|빈곤|지니|LCOE|풍속|일사|유량|면적|생산량|매장량/.test(text)
  )
    return "값 · 단위 · 기준연도";

  switch (profile.primaryView) {
    case "policy_evidence":
    case "policy_timeline":
    case "agreement_timeline":
      return "내용 · 상태 · 공식 원문 근거";
    case "process":
      return "절차 · 담당기관 · 기간/비용";
    case "portfolio":
    case "finance_portfolio":
      return "항목별 값 · 상태 · 기관/출처";
    case "directory":
      return "기관명 · 역할 · 연락경로 · 근거";
    case "map":
    case "resource_map":
    case "forest_monitor":
    case "landcover_map":
      return "위치 · 규모 · 속성";
    case "capability_matrix":
    case "matrix":
      return "판정값 · 기준 · 근거";
    case "composition":
    case "stacked_emissions":
      return "구성비 · 절대값 · 기준연도";
    default:
      return "값 · 단위/상태 · 기준시점";
  }
}

export function getPlannedVisualizationDescription(
  profile: VietnamPresentationProfile
): string {
  switch (profile.primaryView) {
    case "score_benchmark":
      return "선택 국가의 최신값·최근 추세와 대상국 간 비교";
    case "kpi_trend":
      return "최신 핵심지표와 연도별 추세";
    case "composition":
    case "stacked_emissions":
      return "구성비 차트와 연도별 변화";
    case "map":
    case "resource_map":
    case "forest_monitor":
    case "landcover_map":
      return "지역·시설 지도와 속성표";
    case "seasonal_calendar":
      return "월별 계절·기후 캘린더";
    case "climate_scenario":
    case "scenario_lines":
    case "hazard_dashboard":
      return "과거·미래 또는 시나리오별 추세";
    case "risk_dashboard":
      return "현재 위험수준·구성요인·추세";
    case "event_timeline":
      return "사건 타임라인과 피해규모";
    case "policy_evidence":
      return "정책 요약과 공식 원문·페이지 근거";
    case "policy_timeline":
    case "agreement_timeline":
      return "제도·협정의 시행/체결 타임라인과 상태";
    case "process":
      return "절차 순서와 담당기관·기간·비용";
    case "portfolio":
    case "finance_portfolio":
      return "사업·재원 요약과 필터 가능한 목록";
    case "directory":
      return "기관 목록과 공식 역할·연락경로";
    case "capability_matrix":
    case "matrix":
      return "항목별 상태·등급과 판정근거";
    case "research_dashboard":
      return "논문·특허 추세와 기관·기술 분포";
    case "trade_dashboard":
      return "교역 추세와 품목·파트너 구성";
    case "cost_comparison":
      return "기술별 비용 비교와 산정 가정";
    case "mineral_dashboard":
      return "광물별 매장량·생산량·순위";
    case "market_dashboard":
      return "시장규모·성장률·비용 지표";
    case "budget_dashboard":
      return "예산 추세와 부처·감축/적응 구성";
    case "competitor_dashboard":
      return "공여국·기업 비교와 프로젝트 목록";
    case "support_programs":
      return "지원프로그램·지원대상·신청일정";
    default:
      return profile.primaryViewLabel;
  }
}
