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

export function sampleDisplayValue(field: string, seed: string): string {
  const text = field.replace(/\s+/g, "");
  const n = sampleNumber(`${seed}:${field}`, 0, 1);

  if (/순위/.test(text)) return `${Math.round(15 + n * 85)}위`;
  if (/점수|지수|총점|CPIA/.test(text)) return (2.8 + n * 2.1).toFixed(1);
  if (/비중|비율|실업|빈곤|성장률|손실률|도시화/.test(text))
    return `${(4 + n * 76).toFixed(1)}%`;
  if (/GDP/.test(text) && /1인당/.test(text))
    return `USD ${Math.round(2500 + n * 9500).toLocaleString("en-US")}`;
  if (/GDP/.test(text)) return `USD ${(120 + n * 480).toFixed(1)}B`;
  if (/금액|재원|사업비|투자액|예산|비용/.test(text))
    return `USD ${(5 + n * 180).toFixed(1)}M`;
  if (/인구/.test(text))
    return `${Math.round(25_000_000 + n * 90_000_000).toLocaleString(
      "ko-KR"
    )}명`;
  if (/감축량|발행량|소각량|배출/.test(text))
    return `${(0.5 + n * 28).toFixed(1)} MtCO₂e`;
  if (/면적/.test(text))
    return `${Math.round(5000 + n * 80000).toLocaleString("ko-KR")} km²`;
  if (/생산량|매장량/.test(text))
    return `${Math.round(50000 + n * 900000).toLocaleString("ko-KR")} t`;
  if (/LCOE/.test(text)) return `USD ${(0.05 + n * 0.13).toFixed(3)}/kWh`;
  if (/풍속/.test(text)) return `${(4.5 + n * 4.5).toFixed(1)} m/s`;
  if (/일사|GHI|DNI/.test(text))
    return `${(3.2 + n * 2.8).toFixed(2)} kWh/m²/day`;
  if (/유량/.test(text)) return `${Math.round(150 + n * 3500)} m³/s`;
  if (/건수|사업|프로젝트/.test(text)) return `${Math.round(3 + n * 24)}건`;
  if (/기간/.test(text)) return `${Math.round(2 + n * 9)}년`;
  if (/상태|여부|유무/.test(text)) return n > 0.5 ? "확인" : "일부 확인";

  return `${(20 + n * 75).toFixed(1)}`;
}

export function sampleTrend(seed: string, count = 8): number[] {
  const base = sampleNumber(`${seed}:base`, 35, 72);
  const slope = sampleNumber(`${seed}:slope`, -1.0, 3.5);
  return Array.from({ length: count }, (_, index) => {
    const wave = Math.sin(index * 1.3 + (hash(seed) % 10)) * 3.2;
    return Math.max(4, base + slope * index + wave);
  });
}

export function previewViewLabel(profile: VietnamPresentationProfile): string {
  switch (profile.primaryView) {
    case "score_benchmark":
      return "최신값 · 최근 추세 · 국가 비교";
    case "kpi_trend":
      return "핵심지표 · 연도별 추세";
    case "composition":
    case "stacked_emissions":
      return "구성비 · 변화 추세";
    case "map":
    case "resource_map":
    case "forest_monitor":
    case "landcover_map":
      return "지도 · 지역별 값 · 속성표";
    case "seasonal_calendar":
      return "월별 기후 캘린더";
    case "climate_scenario":
    case "scenario_lines":
    case "hazard_dashboard":
      return "과거·미래 · 시나리오 비교";
    case "risk_dashboard":
      return "위험수준 · 구성요인 · 추세";
    case "event_timeline":
      return "사건 타임라인 · 피해규모";
    case "policy_evidence":
      return "정책 요약 · 공식 원문 근거";
    case "policy_timeline":
    case "agreement_timeline":
      return "제도·협정 타임라인 · 상태";
    case "process":
      return "절차 · 기관 · 기간 · 비용";
    case "portfolio":
    case "finance_portfolio":
      return "사업·재원 요약 · 프로젝트 목록";
    case "directory":
      return "기관 디렉터리 · 역할 · 연락경로";
    case "capability_matrix":
    case "matrix":
      return "항목별 상태 · 판정근거";
    case "research_dashboard":
      return "연구·특허 추세 · 기관·기술";
    case "trade_dashboard":
      return "교역 추세 · 품목·파트너";
    case "cost_comparison":
      return "기술별 비용 비교";
    case "mineral_dashboard":
      return "광물별 매장량 · 생산량 · 순위";
    case "market_dashboard":
      return "시장규모 · 성장률 · 비용";
    case "budget_dashboard":
      return "예산 추세 · 부처·분야 구성";
    case "competitor_dashboard":
      return "공여국·기업 비교 · 프로젝트";
    case "support_programs":
      return "지원프로그램 · 일정 · 자격";
    default:
      return profile.primaryViewLabel;
  }
}
