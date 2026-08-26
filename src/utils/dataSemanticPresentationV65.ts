import type { VietnamDemoElement } from "../types/vietnamDemo";

export type SemanticCollectionKind =
  | "registry"
  | "policy_matrix"
  | "portfolio"
  | "directory"
  | "research";

const FIXED_SPECIAL = new Set([
  "A-013",
  "A-015",
  "C-002",
  "C-003",
  "C-012",
  "C-015",
  "C-024",
  "C-025",
  "D-007",
  "D-017",
  "E-015",
  "E-017",
]);

const POLICY_MATRIX_IDS = new Set([
  "C-004",
  "C-005",
  "C-013",
  "C-017",
  "C-019",
]);

const COLLECTION_MODES = new Set([
  "policy_timeline",
  "agreement_timeline",
  "portfolio",
  "finance_portfolio",
  "directory",
  "competitor_dashboard",
  "support_programs",
  "research_dashboard",
]);

const PUBLIC_TITLES: Record<string, string> = {
  "A-001": "부패인식지수(CPI)",
  "A-002": "CPIA 국가 정책·제도 역량",
  "A-003": "GDP·성장·1인당소득",
  "B-004": "기온·강수·풍속·일사·습도 전망",
  "B-005": "가뭄·토양수분 지표",
  "B-006": "폭염·열대야·고온체감 지표",
  "B-007": "극한강수·호우 지표",
  "B-014": "탄소세 도입 시 배출·GDP·세수 영향",
  "B-016": "화석연료 에너지 소비 비중",
  "B-022": "기후피해의 경제적 비용",
  "B-041": "태양광 자원·발전 잠재량",
  "C-001": "NDC 제출·목표·이행 근거",
  "C-002": "BTR 배출·이행·지원 정보",
  "C-003": "NAP 적응 우선순위·투자수요",
  "C-004": "LT-LEDS 장기 탈탄소 경로",
  "C-005": "TNA 기술수요·장벽·실행계획",
  "C-006": "파리협정 제6조 이행체계",
  "C-007": "파리협정 제6.8조 비시장 접근 참여",
  "C-008": "국제 기후이니셔티브 참여",
  "C-009": "기후변화 법·규제·인센티브 현황",
  "C-010": "환경 법·규제 현황",
  "C-011": "치안·여행안전 현황",
  "C-012": "PPP 법제도·조달 체계",
  "C-015": "재생에너지 정책 원문",
  "C-016": "재생에너지 목표·입찰·발주 계획",
  "C-017": "재생에너지 투자 인센티브",
  "C-018": "중장기 에너지·전력 전망",
  "C-024": "REDD+ 이행·성과·재원 현황",
  "C-025": "탄소크레딧 발행·소각 실적",
  "D-012": "경쟁국 기업의 대상국 진출 현황",
  "D-014": "EDCF 프로젝트 현황",
  "D-015": "한국 ODA 프로젝트 현황",
  "D-016": "정부·지자체 국제협력 프로젝트",
  "D-017": "한국 ODA PCP·입찰 정보",
  "D-018": "Adaptation Fund 프로젝트 현황",
  "D-019": "CTCN 기술지원 요청 현황",
  "D-020": "GCF 프로젝트 현황",
  "D-021": "국제기구·MDB 프로젝트 현황",
  "D-022": "MDB·DFI·PPP 투자 프로젝트",
  "D-023": "ODA·기후기금 재원 현황",
  "D-024": "VC·임팩트 투자 현황",
  "D-025": "민간 인프라 투자(PPI) 현황",
  "D-026": "MIGA 정치적 리스크 보증 현황",
  "E-001": "CTCN 국가 지정기구(NDE)",
  "E-002": "파리협정 국가 지정기관(DNA)",
  "E-003": "GCF 국가 지정기관(NDA)",
  "E-004": "국제기구 현지사무소·담당자",
  "E-005": "대학·연구기관·NGO",
  "E-006": "현지 투자자 네트워크",
  "E-008": "기후기술 논문·특허·국제협력",
  "E-014": "기후·녹색성장 양자협정",
  "E-015": "NDC Partnership 참여·지원 현황",
  "E-017": "한국-경쟁국 기후기술 비교우위",
  "E-018": "한국기업 대상국 진출 현황",
  "E-019": "대상국 내 한국기관 사무소",
  "E-020": "한국 해외진출 지원프로그램",
};

const PRIMARY_LABELS: Record<string, string> = {
  "A-029": "협정 목록",
  "B-015": "탄소가격 제도",
  "C-004": "장기전략",
  "C-005": "기술수요",
  "C-007": "참여 활동",
  "C-008": "이니셔티브 목록",
  "C-009": "법·제도 목록",
  "C-010": "환경규제 목록",
  "C-013": "투자조건",
  "C-016": "목표·입찰 계획",
  "C-017": "인센티브",
  "C-019": "탄소가격·지원제도",
  "C-021": "프로젝트 목록",
  "D-011": "공여국 비교",
  "D-012": "기업·프로젝트",
  "D-014": "사업 목록",
  "D-015": "사업 목록",
  "D-016": "사업 목록",
  "D-018": "프로젝트 목록",
  "D-019": "기술지원 목록",
  "D-020": "프로젝트 목록",
  "D-021": "프로젝트 목록",
  "D-022": "투자 목록",
  "D-023": "재원·사업 목록",
  "D-024": "투자 목록",
  "D-025": "투자 목록",
  "D-026": "보증 목록",
  "E-001": "기관 목록",
  "E-002": "기관 목록",
  "E-003": "기관 목록",
  "E-004": "기관 목록",
  "E-005": "기관 목록",
  "E-006": "기관 목록",
  "E-008": "논문·특허 목록",
  "E-014": "협정 목록",
  "E-018": "기업 목록",
  "E-019": "기관 목록",
  "E-020": "지원프로그램",
};

const COLUMN_OVERRIDES: Record<string, string[]> = {
  "A-029": ["협정명", "발효일", "적용범위", "관세·원산지", "원문"],
  "B-015": ["제도유형", "가격/세율", "대상부문", "시행연도", "상태"],
  "C-009": [
    "법령명",
    "유형",
    "대상분야",
    "시행연도",
    "상태",
    "주관부처",
    "원문",
  ],
  "C-010": ["법령명", "규제영역", "시행연도", "상태", "주관부처", "원문"],
  "C-016": [
    "목표/입찰",
    "목표연도",
    "일정",
    "대상기술",
    "발주기관",
    "선정방식",
  ],
  "E-014": ["협정유형", "체결일", "대상분야", "이행상태", "원문"],
};

export function getSemanticPublicTitleV65(elementId: string): string | null {
  return PUBLIC_TITLES[elementId] ?? null;
}

export function getSemanticPrimaryLabelV65(elementId: string): string | null {
  return PRIMARY_LABELS[elementId] ?? null;
}

export function getSemanticCollectionKindV65(
  element: VietnamDemoElement
): SemanticCollectionKind | null {
  if (FIXED_SPECIAL.has(element.elementId)) return null;

  if (POLICY_MATRIX_IDS.has(element.elementId)) {
    return "policy_matrix";
  }

  const mode = element.presentation.primaryView;

  if (!COLLECTION_MODES.has(mode)) return null;

  if (mode === "directory") return "directory";
  if (mode === "research_dashboard") return "research";
  if (
    mode === "portfolio" ||
    mode === "finance_portfolio" ||
    mode === "competitor_dashboard" ||
    mode === "support_programs"
  ) {
    return "portfolio";
  }

  return "registry";
}

export function hasSemanticCollectionV65(element: VietnamDemoElement): boolean {
  return getSemanticCollectionKindV65(element) !== null;
}

export function getSemanticColumnsV65(element: VietnamDemoElement): string[] {
  const override = COLUMN_OVERRIDES[element.elementId];
  if (override) return override;

  return element.presentation.headlineFields.slice(0, 8);
}

export function getSemanticFiltersV65(
  elementId: string
): { label: string; options: string[] }[] {
  switch (elementId) {
    case "C-009":
      return [
        {
          label: "유형",
          options: ["전체", "법률", "시행령", "규제", "인센티브"],
        },
        {
          label: "대상분야",
          options: ["전체", "감축", "적응", "에너지", "산업"],
        },
        { label: "상태", options: ["전체", "시행 중", "계류", "폐지"] },
      ];
    case "C-010":
      return [
        {
          label: "규제영역",
          options: ["전체", "EIA", "대기질", "수질", "폐기물", "생물다양성"],
        },
        { label: "상태", options: ["전체", "시행 중", "계류", "폐지"] },
      ];
    case "C-016":
      return [
        {
          label: "대상기술",
          options: ["전체", "태양광", "풍력", "수력", "바이오"],
        },
        { label: "진행상태", options: ["전체", "예정", "진행", "완료"] },
      ];
    case "C-017":
      return [
        {
          label: "인센티브",
          options: ["전체", "FIT/FIP", "RPS", "세제", "보조금", "넷미터링"],
        },
        {
          label: "대상기술",
          options: ["전체", "태양광", "풍력", "수력", "바이오"],
        },
      ];
    case "B-015":
    case "C-019":
      return [
        { label: "제도", options: ["전체", "탄소세", "ETS", "RPS/FIT"] },
        { label: "상태", options: ["전체", "시행 중", "예정", "미도입"] },
      ];
    case "A-029":
    case "E-014":
      return [{ label: "상태", options: ["전체", "발효", "갱신", "만료"] }];
    default:
      return [];
  }
}

export function semanticExampleValueV65(
  field: string,
  rowIndex: number
): string {
  const text = field.replace(/\s+/g, "");
  const letter = String.fromCharCode(65 + (rowIndex % 3));

  if (/법령명/.test(text)) return `기후·환경 법령 ${letter}`;
  if (/협정명|협정유형/.test(text)) return `협정 ${letter}`;
  if (/프로젝트|사업명|활동명|이니셔티브/.test(text))
    return `프로젝트 ${letter}`;
  if (
    /기관명|발주기관|시행기관|실행기관|인가기관|공여기관|투자자|스폰서|NDE/.test(
      text
    )
  )
    return `기관 ${letter}`;
  if (/기업/.test(text)) return `기업 ${letter}`;
  if (/논문|특허/.test(text)) return `연구·특허 ${letter}`;

  if (/유형/.test(text)) {
    return ["법률", "규제", "인센티브"][rowIndex % 3];
  }
  if (/규제영역/.test(text)) return ["EIA", "대기질", "폐기물"][rowIndex % 3];
  if (/대상분야|분야|섹터|기후분야/.test(text))
    return ["에너지·전력", "산업", "적응·농업"][rowIndex % 3];
  if (/대상기술|기술/.test(text))
    return ["태양광", "풍력", "에너지효율"][rowIndex % 3];

  if (/시행연도|목표연도|연도|설립연도|FinancialClose/.test(text))
    return `${2022 + rowIndex}`;
  if (/발효일|체결일|등록일|승인일|공고|마감/.test(text))
    return `202${4 + rowIndex}-0${rowIndex + 3}-15`;
  if (/기간/.test(text)) return `${2025 + rowIndex}–${2028 + rowIndex}`;

  if (/상태|단계|이행상태|참여상태/.test(text))
    return ["시행 중", "진행", "완료"][rowIndex % 3];
  if (/선정방식|조달방식/.test(text))
    return ["경쟁입찰", "FIT", "협상"][rowIndex % 3];

  if (/가격|세율/.test(text))
    return [`USD 25/tCO₂`, `5.0%`, `USD 18/tCO₂`][rowIndex % 3];
  if (/금리/.test(text)) return `${2.0 + rowIndex * 0.5}%`;
  if (/금액|재원|사업비|투자액|예산|보증금액|AUM/.test(text))
    return `USD ${8 + rowIndex * 17}M`;
  if (/감축량|발행량|소각량/.test(text))
    return `${(0.3 + rowIndex * 0.22).toFixed(2)} MtCO₂e`;
  if (/용량/.test(text)) return `${120 + rowIndex * 80} MW`;
  if (/수혜자/.test(text)) return `${25 + rowIndex * 15}만 명`;

  if (/관세|원산지/.test(text)) return "관련 품목·원산지 규정 확인";
  if (/적용범위/.test(text)) return "기후·에너지 관련 품목";
  if (/원문|링크|URL|공식링크|CountryPage/.test(text)) return "공식 원문 ↗";

  if (/외국인지분/.test(text)) return "업종별 제한·예외 확인";
  if (/투자인센티브/.test(text)) return "세제·관세·경제특구 혜택";
  if (/BIT/.test(text)) return "투자보호협정 확인";
  if (/수익송금/.test(text)) return "외환·세법 조건 확인";
  if (/인센티브/.test(text)) return "세제·요금·보조금 지원";
  if (/조건/.test(text)) return "기술별 가격·기간·용량 조건";

  if (/넷제로/.test(text)) return "2050 넷제로 목표";
  if (/배출경로/.test(text)) return "BAU · 감축 · 넷제로 시나리오";
  if (/에너지믹스/.test(text)) return "재생에너지 확대 · 화석연료 축소";
  if (/부문별경로/.test(text)) return "전력 · 산업 · 수송 · 건물";
  if (/핵심기술/.test(text)) return "재생에너지 · 효율 · 저장";
  if (/수행연도/.test(text)) return "2024";
  if (/우선기술/.test(text)) return "태양광 · 전력망 · 효율";
  if (/우선섹터/.test(text)) return "에너지 · 산업 · 농업";
  if (/장벽/.test(text)) return "재원 · 제도 · 기술역량";
  if (/TAP/.test(text)) return "기술행동계획 확인";

  if (/담당자/.test(text)) return `담당자 ${letter}`;
  if (/직함/.test(text)) return "담당관";
  if (/이메일/.test(text)) return `contact${rowIndex + 1}@example.org`;
  if (/전화/.test(text)) return "+00 00 0000 0000";
  if (/도시/.test(text)) return ["수도", "산업도시", "지역도시"][rowIndex % 3];
  if (/주소/.test(text)) return "공식 사무소 주소";
  if (/전문분야|주요역량|업무범위/.test(text)) return "기후·에너지·환경";

  return `예시 정보 ${letter}`;
}
