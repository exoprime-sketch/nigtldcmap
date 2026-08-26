export type ComparisonTemplateV120 =
  | "indicator"
  | "technology-demand"
  | "policy"
  | "project"
  | "oda"
  | "climate-risk"
  | "partner";

export type ComparisonQuestionV120 = {
  id: string;
  label: string;
  template: ComparisonTemplateV120;
  description: string;
  conditions: string[];
  views: string[];
  prohibited: string[];
};

export const COMPARISON_QUESTIONS_V120: ComparisonQuestionV120[] = [
  {
    id: "grid-conditions",
    label: "전력망 개선여건 비교",
    template: "indicator",
    description:
      "전력접근·송배전 손실·재생에너지 등 동일 지표의 수준과 추세를 비교합니다.",
    conditions: ["동일 기준연도", "국가별 최신 가용값", "기간"],
    views: ["요약", "차트", "추세", "표", "근거"],
    prohibited: ["서로 다른 단위 합산", "결측값 0 처리", "종합순위"],
  },
  {
    id: "adaptation-demand",
    label: "적응 기술수요 비교",
    template: "technology-demand",
    description:
      "TNA/TAP의 우선기술, 장벽, 현재 정책 확인현황과 Project Idea를 비교합니다.",
    conditions: ["감축/적응", "기술분야", "부문", "현재성"],
    views: ["기술 matrix", "구성", "장벽", "Project Idea", "근거"],
    prohibited: ["사업명 기반 기술추론", "기술수요 종합점수"],
  },
  {
    id: "policy-alignment",
    label: "정책 정합성 비교",
    template: "policy",
    description:
      "NDC·NAP·BTR·LT-LEDS의 제출시점, 부문, 기술과 실행수단을 원문근거로 비교합니다.",
    conditions: ["문서종류", "부문", "기술분야", "감축/적응"],
    views: ["문서 matrix", "정책내용", "실행수단", "원문근거"],
    prohibited: [
      "정책품질 점수",
      "문서 수 기반 순위",
      "bar chart로 정책우열 표현",
    ],
  },
  {
    id: "international-projects",
    label: "기존 국제사업 비교",
    template: "project",
    description:
      "기관별 사업 수, 상태, 부문, 기관 및 원래 금융개념을 구분해 비교합니다.",
    conditions: ["기관", "사업상태", "부문", "기술분야", "기간"],
    views: ["사업현황", "상태구성", "금융항목", "기관", "사업목록"],
    prohibited: [
      "기관 간 금융액 합산",
      "승인액·이전액 합산",
      "좌표 없는 사업 위치표시",
    ],
  },
  {
    id: "oda-environment",
    label: "ODA 공여환경 비교",
    template: "oda",
    description:
      "실제지출과 약정, 주요 공여기관, 양자·다자 및 분야구성을 분리해 비교합니다.",
    conditions: [
      "실제지출/약정",
      "공여기관",
      "분야",
      "channel",
      "grant/loan",
      "기간",
    ],
    views: ["추세", "공여기관 구성", "분야 구성", "표", "근거"],
    prohibited: ["실제지출·약정 합산", "현재가·불변가격 혼합", "협력기회 점수"],
  },
  {
    id: "climate-risk",
    label: "기후위험 비교",
    template: "climate-risk",
    description:
      "변수, 관측·전망, 기간, 시나리오와 공간단위를 맞춰 비교합니다.",
    conditions: [
      "변수",
      "관측/전망",
      "기간",
      "시나리오",
      "모델",
      "계절",
      "공간단위",
    ],
    views: ["지도", "시계열", "분포", "표", "메타데이터"],
    prohibited: [
      "관측·전망 혼합",
      "공간단위가 다른 값 직접비교",
      "자료 없음 0 처리",
    ],
  },
  {
    id: "partners",
    label: "파트너·기관 비교",
    template: "partner",
    description:
      "공식 기관의 유형, 역할, 관련 사업·기술과 공개 연락정보를 비교합니다.",
    conditions: ["기관유형", "역할", "기술분야", "관련사업"],
    views: ["기관목록", "역할", "사업관계", "기술관계", "표"],
    prohibited: ["미검증 주소 좌표화", "기관 수를 협력적합성으로 해석"],
  },
];

export const resolveComparisonTemplateV120 = (
  elementId?: string,
  label?: string
): ComparisonTemplateV120 => {
  const text = `${elementId ?? ""} ${label ?? ""}`.toLowerCase();
  if (
    text.includes("tna") ||
    text.includes("기술수요") ||
    elementId === "C-005"
  )
    return "technology-demand";
  if (/(ndc|nap|btr|lt-leds|정책|제도)/.test(text)) return "policy";
  if (/(ctcn|gcf|adaptation|gef|world bank|adb|사업|프로젝트)/.test(text))
    return "project";
  if (/(oda|dac|crs|공여)/.test(text) || elementId === "D-011") return "oda";
  if (/(폭염|홍수|가뭄|기온|강수|위험|취약|기후)/.test(text))
    return "climate-risk";
  if (/(기관|파트너|nde|nda|시행기관)/.test(text)) return "partner";
  return "indicator";
};
