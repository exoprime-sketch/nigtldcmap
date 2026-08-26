export type PublicCopyDecisionV118 =
  | "KEEP"
  | "REWRITE"
  | "REMOVE"
  | "MOVE_TO_TOOLTIP"
  | "INTERNAL_ONLY";

export const PUBLIC_COPY_BANNED_VISIBLE_TERMS_V118 = [
  "색·크기·모양은 서로 다른 의미",
  "152개 전체 데이터는",
  "visual encoding",
  "renderer",
  "authoritative",
  "facet",
  "demo_only",
  "source-verified",
  "currentness code",
  "자동 매핑하지",
  "강제 매핑",
] as const;

export const PUBLIC_COPY_DECISIONS_V118 = [
  {
    area: "지도 상단",
    before: "협력기획 통합지도와 구현방식을 설명하는 장문",
    after:
      "국가·지역의 기후·에너지 여건과 기술수요, 관련 사업 정보를 지도에서 확인합니다",
    decision: "REWRITE" as PublicCopyDecisionV118,
  },
  {
    area: "지도 범례",
    before: "지도 읽는 법 / 색·크기·모양은 서로 다른 의미",
    after: "활성 데이터명과 값 범위·자료 없음만 표시",
    decision: "REWRITE" as PublicCopyDecisionV118,
  },
  {
    area: "지도 카탈로그",
    before: "전체 요소 수와 구현상태 중심 설명",
    after: "이용목적별 데이터명·공간단위·제공상태 중심",
    decision: "REWRITE" as PublicCopyDecisionV118,
  },
  {
    area: "데이터 상세",
    before: "직접 CSV/JSON 생성 버튼",
    after: "다운로드 설정으로 이동",
    decision: "MOVE_TO_TOOLTIP" as PublicCopyDecisionV118,
  },
  {
    area: "QA·내부 버전",
    before: "버전·구현·검증 문구",
    after: "일반 화면 비노출",
    decision: "INTERNAL_ONLY" as PublicCopyDecisionV118,
  },
] as const;
