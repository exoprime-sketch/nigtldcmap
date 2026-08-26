import type { ComparisonTemplateV120 } from "../../data/compare/comparisonRegistryV120";

const TEMPLATE_COPY: Record<
  ComparisonTemplateV120,
  { title: string; fields: string[]; warning: string }
> = {
  indicator: {
    title: "수치·시계열 비교",
    fields: ["실제 자료연도", "값과 단위", "기간 추세", "결측값", "출처"],
    warning: "자료연도가 다른 최신값은 각 국가의 실제 연도를 함께 표시합니다.",
  },
  "technology-demand": {
    title: "기술수요 비교",
    fields: ["우선기술", "감축·적응", "현재 정책 확인", "장벽", "Project Idea"],
    warning: "기술명과 관계가 원문에서 확인된 경우만 연결합니다.",
  },
  policy: {
    title: "정책 비교",
    fields: ["문서종류", "제출시점", "부문", "기술", "실행수단", "원문근거"],
    warning: "문서 수나 임의 점수로 정책의 우열을 판정하지 않습니다.",
  },
  project: {
    title: "사업 포트폴리오 비교",
    fields: [
      "기관",
      "사업상태",
      "부문",
      "승인일·기간",
      "원래 금융항목",
      "공식 링크",
    ],
    warning: "기관별 금융개념을 하나의 총액으로 합산하지 않습니다.",
  },
  oda: {
    title: "ODA 공여환경 비교",
    fields: ["실제지출", "약정", "공여기관", "양자·다자", "분야", "grant·loan"],
    warning: "실제지출과 약정, 현재가와 불변가격을 분리합니다.",
  },
  "climate-risk": {
    title: "기후위험 비교",
    fields: ["변수", "관측·전망", "기간", "시나리오", "모델", "공간단위"],
    warning:
      "시나리오·기간·공간단위가 다른 값은 같은 조건처럼 비교하지 않습니다.",
  },
  partner: {
    title: "파트너·기관 비교",
    fields: ["기관유형", "역할", "관련 사업", "관련 기술", "공식 연락정보"],
    warning:
      "미검증 주소를 지도좌표로 변환하거나 기관 수를 협력적합성으로 해석하지 않습니다.",
  },
};

export default function ComparisonTemplatePanelV120({
  template,
}: {
  template: ComparisonTemplateV120;
}) {
  const item = TEMPLATE_COPY[template];
  return (
    <section className="comparison-template-panel-v120">
      <div>
        <strong>{item.title}</strong>
        <ul>
          {item.fields.map((field) => (
            <li key={field}>{field}</li>
          ))}
        </ul>
      </div>
      <p>{item.warning}</p>
    </section>
  );
}
