import type { VietnamDemoElement } from "../types/vietnamDemo";

export interface CapabilityCard {
  label: string;
  value: string;
  note: string;
}

export interface CapabilityRow {
  item: string;
  value: string;
  evidence: string;
  gap?: string;
}

export interface CapabilityDetailRow {
  cells: string[];
}

export interface CapabilityDefinition {
  publicTitle: string;
  primaryLabel: string;
  detailLabel: string;
  selector?: {
    label: string;
    options: string[];
  };
  cards: CapabilityCard[];
  rows: CapabilityRow[];
  detailHeaders: string[];
  detailRows: CapabilityDetailRow[];
  caution: string;
}

const DEFINITIONS: Record<string, CapabilityDefinition> = {
  "C-006": {
    publicTitle: "파리협정 제6조·ITMO 이행체계",
    primaryLabel: "이행체계",
    detailLabel: "협정·거래",
    selector: {
      label: "기준",
      options: ["최신 현황", "이전 기준"],
    },
    cards: [
      { label: "양자협정", value: "2건", note: "예시값" },
      { label: "승인기관", value: "지정", note: "예시" },
      { label: "국가 레지스트리", value: "구축 중", note: "예시" },
      { label: "ITMO 이전실적", value: "미확인", note: "예시" },
    ],
    rows: [
      {
        item: "법·제도 기반",
        value: "승인절차 마련",
        evidence: "법령·정부지침·승인기관",
      },
      {
        item: "양자협정",
        value: "2개 협정",
        evidence: "상대국·체결일·대상부문·원문",
      },
      {
        item: "상응조정",
        value: "절차 규정",
        evidence: "회계방식·보고주기·책임기관",
      },
      {
        item: "레지스트리·추적",
        value: "구축 중",
        evidence: "등록·이전·취소·고유번호 관리",
      },
      {
        item: "보고·검증",
        value: "보고체계 확인",
        evidence: "Initial Report·BTR·검증절차",
      },
      {
        item: "이전 경험",
        value: "추가 확인",
        evidence: "승인·이전량·상대국·거래일",
      },
    ],
    detailHeaders: [
      "협정/거래",
      "상대국",
      "체결·승인일",
      "대상부문·기술",
      "상태",
      "원문",
    ],
    detailRows: [
      {
        cells: [
          "협정 A",
          "상대국 A",
          "2024-06-15",
          "에너지",
          "발효",
          "공식 원문 ↗",
        ],
      },
      {
        cells: [
          "협정 B",
          "상대국 B",
          "2025-02-10",
          "산업·폐기물",
          "이행 중",
          "공식 원문 ↗",
        ],
      },
    ],
    caution:
      "국가 차원의 제도 존재가 개별 프로젝트의 승인·ITMO 이전 가능성을 자동으로 보장하지 않음",
  },

  "C-020": {
    publicTitle: "GHG 감축사업 MRV·타당성 준비도",
    primaryLabel: "타당성 기준",
    detailLabel: "근거 상세",
    selector: {
      label: "사업·기술",
      options: ["전체", "재생에너지", "에너지효율", "산업공정", "폐기물"],
    },
    cards: [
      { label: "기준선", value: "방법론 후보 확인", note: "예시" },
      { label: "MRV", value: "보완 필요", note: "예시" },
      { label: "추가성", value: "검토 필요", note: "예시" },
      { label: "데이터", value: "부분 확보", note: "예시" },
    ],
    rows: [
      {
        item: "기준선",
        value: "후보 방법론 확인",
        evidence: "기준선 시나리오·활동자료·배출계수",
        gap: "현장자료 검증",
      },
      {
        item: "MRV",
        value: "부분 준비",
        evidence: "모니터링 변수·주기·계측기",
        gap: "QA/QC 계획",
      },
      {
        item: "추가성",
        value: "검토 필요",
        evidence: "규제·재무·관행 분석",
        gap: "투자분석",
      },
      {
        item: "방법론",
        value: "후보 존재",
        evidence: "VCS·GS·Article 6 방법론",
        gap: "적용가능성 확인",
      },
      {
        item: "데이터 가용성",
        value: "부분 확보",
        evidence: "활동자료·에너지사용·생산량",
        gap: "시설 단위 원자료",
      },
    ],
    detailHeaders: [
      "검토항목",
      "필요 근거",
      "현재 확인",
      "추가 확보",
      "판정 유의",
    ],
    detailRows: [
      {
        cells: [
          "기준선",
          "활동자료·배출계수",
          "후보자료",
          "시설 원값",
          "검증 전 확정 금지",
        ],
      },
      {
        cells: [
          "MRV",
          "변수·계측·주기",
          "부분 확인",
          "QA/QC",
          "등록기준 별도 확인",
        ],
      },
      {
        cells: [
          "추가성",
          "규제·재무·관행",
          "미완료",
          "투자분석",
          "방법론별 상이",
        ],
      },
    ],
    caution:
      "기초정보는 사업개발 사전검토용이며 최종 검증·등록 가능성을 자동 판정하지 않음",
  },

  "C-022": {
    publicTitle: "탄소시장 운영 준비도",
    primaryLabel: "준비도",
    detailLabel: "항목별 상세",
    selector: {
      label: "기준연도",
      options: ["2025", "2024", "2023"],
    },
    cards: [
      { label: "법제도", value: "부분 구축", note: "예시" },
      { label: "레지스트리", value: "구축 중", note: "예시" },
      { label: "MRV", value: "운영", note: "예시" },
      { label: "승인기관", value: "지정", note: "예시" },
    ],
    rows: [
      {
        item: "법제도",
        value: "부분 구축",
        evidence: "탄소시장법·시행령·세부지침",
      },
      {
        item: "레지스트리",
        value: "구축 중",
        evidence: "계정·발행·이전·취소 기능",
      },
      {
        item: "MRV",
        value: "운영",
        evidence: "방법론·검증기관·보고규칙",
      },
      {
        item: "승인기관",
        value: "지정",
        evidence: "담당부처·승인절차·처리기한",
      },
      {
        item: "거래·정산",
        value: "부분 구축",
        evidence: "거래플랫폼·결제·세무·회계",
      },
    ],
    detailHeaders: [
      "구성요소",
      "현황",
      "담당기관",
      "근거문서",
      "시행/기준연도",
    ],
    detailRows: [
      { cells: ["법제도", "부분 구축", "기관 A", "법령·지침", "2025"] },
      { cells: ["레지스트리", "구축 중", "기관 B", "시스템 운영계획", "2025"] },
      { cells: ["MRV", "운영", "기관 C", "MRV 지침", "2024"] },
      { cells: ["거래·정산", "부분 구축", "기관 D", "시장운영규정", "2025"] },
    ],
    caution:
      "준비도는 제도·시스템 존재와 실제 시장 유동성·프로젝트 승인 가능성을 구분하여 해석",
  },

  "D-007": {
    publicTitle: "기후예산태깅(CBT) 운영 현황",
    primaryLabel: "제도 현황",
    detailLabel: "적용·보고",
    selector: {
      label: "기준연도",
      options: ["2025", "2024", "2023"],
    },
    cards: [
      { label: "도입 단계", value: "부분 도입", note: "예시" },
      { label: "적용 범위", value: "15개 부처", note: "예시" },
      { label: "분류체계", value: "감축·적응·교차", note: "예시" },
      { label: "공개·보고", value: "연례 공개", note: "예시" },
    ],
    rows: [
      {
        item: "제도·법적 근거",
        value: "예산편성 지침 반영",
        evidence: "지침명·근거조항·도입연도",
      },
      {
        item: "태깅 적용 범위",
        value: "중앙정부 15개 부처",
        evidence: "적용부처·경상/자본예산·지방정부 범위",
      },
      {
        item: "분류체계",
        value: "감축·적응·교차",
        evidence: "분류기준·목적/주요/보조 태그·중복처리",
      },
      {
        item: "예산주기 통합",
        value: "편성·승인 단계",
        evidence: "기획·편성·승인·집행·결산 단계",
      },
      {
        item: "공개·보고",
        value: "연례 기후예산 보고",
        evidence: "공개문서·주기·세부예산 공개수준",
      },
      {
        item: "검증·QA",
        value: "재무부 내부 검토",
        evidence: "검토기관·검증절차·외부검증 여부",
      },
      {
        item: "태깅 예산 규모",
        value: "총예산의 8.4%",
        evidence: "금액·비율·기준연도",
        gap: "예시값",
      },
    ],
    detailHeaders: [
      "항목",
      "운영 현황",
      "적용범위/기관",
      "근거문서",
      "기준연도",
    ],
    detailRows: [
      {
        cells: [
          "도입 근거",
          "부분 도입",
          "재무부·15개 부처",
          "예산편성 지침",
          "2025",
        ],
      },
      {
        cells: [
          "분류체계",
          "감축·적응·교차",
          "중앙정부",
          "CBT 분류 매뉴얼",
          "2025",
        ],
      },
      {
        cells: [
          "예산주기",
          "편성·승인 연계",
          "예산 담당부서",
          "예산서·지침",
          "2025",
        ],
      },
      {
        cells: [
          "보고·검증",
          "연례 공개·내부검토",
          "재무부",
          "기후예산 보고서",
          "2025",
        ],
      },
    ],
    caution:
      "CBT의 도입·운영 수준과 실제 기후예산의 효과성·추가성은 별도로 평가해야 함",
  },

  "E-007": {
    publicTitle: "GHG 인벤토리·MRV 역량",
    primaryLabel: "MRV 역량",
    detailLabel: "부문별 Tier",
    selector: {
      label: "부문",
      options: ["전체", "에너지", "산업공정", "농업·LULUCF", "폐기물"],
    },
    cards: [
      { label: "국가 레지스트리", value: "운영", note: "예시" },
      { label: "QA/QC", value: "절차 있음", note: "예시" },
      { label: "BTR", value: "제출", note: "예시" },
      { label: "CBIT 지원", value: "수혜", note: "예시" },
    ],
    rows: [
      {
        item: "인벤토리 Tier",
        value: "부문별 Tier 1–2",
        evidence: "IPCC 방법론·활동자료·국가 배출계수",
      },
      {
        item: "국가 레지스트리",
        value: "운영",
        evidence: "데이터 저장·버전관리·기관별 제출",
      },
      {
        item: "QA/QC",
        value: "절차 있음",
        evidence: "내부검토·재계산·불확도 관리",
      },
      {
        item: "제3자 검증",
        value: "부분 적용",
        evidence: "전문가 검토·외부 QA",
      },
      {
        item: "BTR·CBIT",
        value: "이행 중",
        evidence: "BTR 제출·CBIT 사업·역량강화",
      },
    ],
    detailHeaders: [
      "부문",
      "Tier",
      "활동자료",
      "배출계수",
      "QA/QC",
      "근거연도",
    ],
    detailRows: [
      {
        cells: [
          "에너지",
          "Tier 2",
          "국가 에너지통계",
          "국가/기본값 혼용",
          "운영",
          "2024",
        ],
      },
      {
        cells: [
          "산업공정",
          "Tier 1–2",
          "생산통계",
          "기본·국가값",
          "부분",
          "2024",
        ],
      },
      {
        cells: [
          "농업·LULUCF",
          "Tier 1",
          "토지·농업통계",
          "IPCC 기본값",
          "보완 필요",
          "2024",
        ],
      },
      {
        cells: [
          "폐기물",
          "Tier 1–2",
          "폐기물통계",
          "국가/기본값",
          "부분",
          "2024",
        ],
      },
    ],
    caution:
      "국가 전체를 단일 Tier로 단정하지 않고 부문·가스·활동자료별 방법론 수준을 확인",
  },

  "E-011": {
    publicTitle: "현지 기후기술 준비수준(TRL)",
    primaryLabel: "기술별 TRL",
    detailLabel: "근거 상세",
    selector: {
      label: "기후기술",
      options: ["전체", "태양광", "풍력", "전력망", "에너지효율", "CCUS"],
    },
    cards: [
      { label: "TRL 8–9", value: "2개 기술", note: "예시" },
      { label: "TRL 6–7", value: "2개 기술", note: "예시" },
      { label: "실증 프로젝트", value: "3건", note: "예시" },
      { label: "근거기관", value: "5곳", note: "예시" },
    ],
    rows: [
      {
        item: "태양광",
        value: "TRL 9",
        evidence: "상용운영 프로젝트·기관",
      },
      {
        item: "풍력",
        value: "TRL 8",
        evidence: "현지 실증·운영 프로젝트",
      },
      {
        item: "전력망",
        value: "TRL 7",
        evidence: "스마트그리드 실증",
      },
      {
        item: "에너지효율",
        value: "TRL 9",
        evidence: "상용 보급사례",
      },
      {
        item: "CCUS",
        value: "TRL 6",
        evidence: "파일럿·FEED 단계",
      },
    ],
    detailHeaders: ["기술", "TRL", "근거기관/프로젝트", "검증단계", "기준연도"],
    detailRows: [
      { cells: ["태양광", "9", "상용 프로젝트 A", "상용운영", "2025"] },
      { cells: ["풍력", "8", "실증 프로젝트 B", "실증·운영", "2025"] },
      { cells: ["전력망", "7", "스마트그리드 C", "시범·실증", "2024"] },
      { cells: ["CCUS", "6", "파일럿 D", "파일럿", "2025"] },
    ],
    caution:
      "국가 전체 기술수준이 아니라 기술·기관·프로젝트 단위 근거를 우선하며 현지적합성과 상용성은 별도 검토",
  },

  "E-013": {
    publicTitle: "현지 운영·유지보수(O&M) 역량",
    primaryLabel: "O&M 역량",
    detailLabel: "근거·공백",
    selector: {
      label: "기후기술",
      options: ["전체", "태양광", "풍력", "전력망", "에너지효율"],
    },
    cards: [
      { label: "숙련인력", value: "부분 확보", note: "예시" },
      { label: "부품조달", value: "양호", note: "예시" },
      { label: "예방정비", value: "부분 운영", note: "예시" },
      { label: "A/S 인프라", value: "제한", note: "예시" },
    ],
    rows: [
      {
        item: "숙련인력",
        value: "부분 확보",
        evidence: "자격인력·교육기관·현장인력",
        gap: "고급 진단인력",
      },
      {
        item: "부품조달",
        value: "양호",
        evidence: "현지 재고·수입기간·공급사",
        gap: "핵심부품 현지화",
      },
      {
        item: "예방정비",
        value: "부분 운영",
        evidence: "정비주기·CMMS·계약",
        gap: "예지정비",
      },
      {
        item: "A/S 인프라",
        value: "제한",
        evidence: "서비스센터·응답시간",
        gap: "지방 서비스망",
      },
      {
        item: "유사시설 실적",
        value: "확인",
        evidence: "운영기간·가동률·고장실적",
        gap: "장기 실적",
      },
    ],
    detailHeaders: ["역량항목", "현황", "근거", "확인기관/시설", "주요 공백"],
    detailRows: [
      {
        cells: [
          "숙련인력",
          "부분 확보",
          "교육·자격·인력",
          "기관 A",
          "고급 진단",
        ],
      },
      { cells: ["부품조달", "양호", "재고·리드타임", "공급사 B", "핵심부품"] },
      {
        cells: ["예방정비", "부분 운영", "정비계획·CMMS", "시설 C", "예지정비"],
      },
      { cells: ["A/S", "제한", "서비스센터", "기업 D", "지역망"] },
    ],
    caution:
      "현지조사·기업·시설 단위 근거를 포함하며 국가 일반론만으로 O&M 역량을 단정하지 않음",
  },

  "E-016": {
    publicTitle: "한국 기후기술 준비수준(TRL)",
    primaryLabel: "한국 TRL",
    detailLabel: "기술별 상세",
    selector: {
      label: "기술군",
      options: ["전체", "감축", "적응", "융복합"],
    },
    cards: [
      { label: "TRL 8–9", value: "12개 기술", note: "예시" },
      { label: "TRL 6–7", value: "18개 기술", note: "예시" },
      { label: "TRL 5 이하", value: "8개 기술", note: "예시" },
      { label: "기준연도", value: "2025", note: "예시" },
    ],
    rows: [
      {
        item: "태양광",
        value: "TRL 9",
        evidence: "국내 상용·수출 프로젝트",
      },
      {
        item: "풍력",
        value: "TRL 8",
        evidence: "국내 실증·상용 프로젝트",
      },
      {
        item: "전력망",
        value: "TRL 9",
        evidence: "상용 운영·해외 실적",
      },
      {
        item: "CCUS",
        value: "TRL 7",
        evidence: "대규모 실증",
      },
    ],
    detailHeaders: [
      "기후기술",
      "한국 TRL",
      "근거기관/프로젝트",
      "검증단계",
      "기준연도",
    ],
    detailRows: [
      { cells: ["태양광", "9", "프로젝트 A", "상용", "2025"] },
      { cells: ["풍력", "8", "프로젝트 B", "실증·상용", "2025"] },
      { cells: ["전력망", "9", "프로젝트 C", "상용", "2025"] },
      { cells: ["CCUS", "7", "프로젝트 D", "실증", "2025"] },
    ],
    caution:
      "국내 TRL과 대상국 현지적합성·가격경쟁력·사업화 가능성을 구분하여 검토",
  },
};

export function getCapabilityDefinitionV67(
  elementId: string
): CapabilityDefinition | null {
  return DEFINITIONS[elementId] ?? null;
}

export function isCapabilityElementV67(element: VietnamDemoElement): boolean {
  return Boolean(DEFINITIONS[element.elementId]);
}

export function getCapabilityPublicTitleV67(elementId: string): string | null {
  return DEFINITIONS[elementId]?.publicTitle ?? null;
}

export function getCapabilityPrimaryLabelV67(elementId: string): string | null {
  return DEFINITIONS[elementId]?.primaryLabel ?? null;
}

export function getCapabilityDetailLabelV67(elementId: string): string | null {
  return DEFINITIONS[elementId]?.detailLabel ?? null;
}
