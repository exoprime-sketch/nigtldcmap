import type {
  PlanningBriefInput,
  PlanningBriefResult,
  PlanningEvidenceItem,
  PlanningEvidenceStatus,
} from "../types/cooperationPlanning";

const STATUS_LABELS: Record<PlanningEvidenceStatus, string> = {
  confirmed: "근거 확인",
  partial: "일부 확인",
  needs_check: "추가 확인 필요",
};

function createItem(
  item: Omit<PlanningEvidenceItem, "statusLabel">
): PlanningEvidenceItem {
  return {
    ...item,
    statusLabel: STATUS_LABELS[item.status],
  };
}

export function buildPlanningBrief(
  input: PlanningBriefInput
): PlanningBriefResult {
  const items: PlanningEvidenceItem[] = [
    createItem({
      id: "demand",
      label: "현지 수요",
      status: input.demandDatasetCount > 0 ? "confirmed" : "needs_check",
      confirmedText:
        input.demandDatasetCount > 0
          ? `직접 수요 근거 ${input.demandDatasetCount}건 확인`
          : "직접 수요 근거 미확인",
      nextAction:
        input.demandDatasetCount > 0
          ? "수요기관·사업조건·도입시점까지 세부 근거 확인"
          : "수요기관 자료·조달계획·TNA·기업 공시 등 직접 수요 근거 추가 확인",
      anchor: "#insight-demand",
    }),
    createItem({
      id: "conditions",
      label: "기술 적용여건",
      status:
        input.availableConditionCount > 0
          ? "confirmed"
          : input.conditionDatasetCount > 0
          ? "partial"
          : "needs_check",
      confirmedText:
        input.availableConditionCount > 0
          ? `실제 국가값 ${input.availableConditionCount}개 지표 확인`
          : input.conditionDatasetCount > 0
          ? `관련 자료 ${input.conditionDatasetCount}건 연결 · 국가값 추가 확인 필요`
          : "적용여건 자료 미확인",
      nextAction:
        input.availableConditionCount > 0
          ? "부지·계통·수요처·기술규격 등 사업 단위 조건 추가 확인"
          : "자원·인프라·기후·계통 등 기술 적용조건 자료 추가 확인",
      anchor: "#insight-conditions",
    }),
    createItem({
      id: "policy",
      label: "정책·NDC",
      status: input.policyDatasetCount > 0 ? "confirmed" : "needs_check",
      confirmedText:
        input.policyDatasetCount > 0
          ? `선택 기술 관련 정책 근거 ${input.policyDatasetCount}건 연결`
          : "선택 기술 관련 정책 근거 미확인",
      nextAction:
        input.policyDatasetCount > 0
          ? "최신 정책버전·시행수단·의무수준·담당기관 추가 확인"
          : "최신 NDC·국가계획·법령·로드맵의 직접 근거 추가 확인",
      anchor: "#insight-policy",
    }),
    createItem({
      id: "projects",
      label: "기존 사업·재원",
      status:
        input.technologyProjectCount > 0
          ? "confirmed"
          : input.hasCountryPortfolio
          ? "partial"
          : "needs_check",
      confirmedText:
        input.technologyProjectCount > 0
          ? `기술 특정 기존 사업 ${input.technologyProjectCount}건 확인`
          : input.hasCountryPortfolio
          ? "국가 전체 GCF 포트폴리오 확인 · 기술 특정 사업 미확인"
          : "기존 사업·재원 근거 미확인",
      nextAction:
        input.technologyProjectCount > 0
          ? "기존사업 중복성·후속사업 가능성·재원 사용조건 추가 확인"
          : "기술 특정 기존사업·재원·수행기관 여부 추가 확인",
      anchor: "#insight-projects",
    }),
    createItem({
      id: "organizations",
      label: "관련 기관",
      status:
        input.technologyOrganizationCount > 0
          ? "confirmed"
          : input.implementingOrganizationCount +
              input.commonOrganizationCount >
            0
          ? "partial"
          : "needs_check",
      confirmedText:
        input.technologyOrganizationCount > 0
          ? `기술 특정 역할 기관 ${input.technologyOrganizationCount}곳 확인`
          : input.implementingOrganizationCount +
              input.commonOrganizationCount >
            0
          ? `기존 수행기관·국가 공통기관 ${
              input.implementingOrganizationCount +
              input.commonOrganizationCount
            }곳 확인 · 기술 특정 역할 미확인`
          : "관련 기관 근거 미확인",
      nextAction:
        input.technologyOrganizationCount > 0
          ? "실제 수요·권한·협력의향·조달역할 추가 확인"
          : "수요기관·승인기관·공기업·현지 수행기관의 기술 특정 역할 추가 확인",
      anchor: "#insight-implementation",
    }),
    createItem({
      id: "locations",
      label: "지역·시설",
      status:
        input.spatialCount > 0
          ? "confirmed"
          : input.projectRegionCount > 0
          ? "partial"
          : "needs_check",
      confirmedText:
        input.spatialCount > 0
          ? `검증된 공간 레코드 ${input.spatialCount}건 확인`
          : input.projectRegionCount > 0
          ? `기존 사업의 지역명 ${input.projectRegionCount}곳 확인 · 정확한 좌표 미확인`
          : "지역·시설 단위 근거 미확인",
      nextAction:
        input.spatialCount > 0
          ? "사업 후보지·시설 소유주·접근성·계통연계 등 현장조건 추가 확인"
          : "대상지역·시설·좌표·행정구역·부지조건 추가 확인",
      anchor: "#insight-implementation",
    }),
    createItem({
      id: "permitting",
      label: "인허가",
      status: input.permittingDatasetCount > 0 ? "confirmed" : "needs_check",
      confirmedText:
        input.permittingDatasetCount > 0
          ? `기술·사업조건별 인허가 자료 ${input.permittingDatasetCount}건 연결`
          : "기술·사업조건별 실제 인허가 근거 미확인",
      nextAction:
        input.permittingDatasetCount > 0
          ? "사업규모·입지·사업형태 확정 후 실제 적용 절차 재확인"
          : "사업형태·규모·입지 확정 후 공식 인허가 절차·기관·기간·비용 확인",
      anchor: "#insight-policy",
    }),
  ];

  const confirmedCount = items.filter(
    (item) => item.status === "confirmed"
  ).length;
  const partialCount = items.filter((item) => item.status === "partial").length;
  const needsCheckCount = items.filter(
    (item) => item.status === "needs_check"
  ).length;

  const memoLines = [
    "[기후기술 협력 사업기획 검토 메모]",
    `대상 · ${input.countryName} × ${input.technologyName}`,
    "",
    "현재 확인수준",
    `근거 확인 ${confirmedCount}개 영역 · 일부 확인 ${partialCount}개 영역 · 추가 확인 필요 ${needsCheckCount}개 영역`,
    "협력 가능성 점수나 우선순위가 아니라 현재 플랫폼 연결근거의 확인수준",
    "",
    ...items.flatMap((item, index) => [
      `${index + 1}. ${item.label} · ${item.statusLabel}`,
      `확인 · ${item.confirmedText}`,
      `한국 측 다음 확인 · ${item.nextAction}`,
      "",
    ]),
    "사용 근거",
    ...(input.sources.length > 0
      ? input.sources.map(
          (source) =>
            `- ${source.title} · ${source.reference} · ${source.source} · ${
              source.relationLabel
            }${source.sourceUrl ? ` · ${source.sourceUrl}` : ""}`
        )
      : ["- 현재 표시할 근거 데이터 없음"]),
    "",
    "유의사항",
    "플랫폼 탑재 공개근거를 사업기획 초기 검토용으로 재구성한 내용",
    "최종 투자·법률·조달·사업성 판단을 대체하지 않음",
  ];

  return {
    items,
    confirmedCount,
    partialCount,
    needsCheckCount,
    memoText: memoLines.join("\n"),
  };
}
