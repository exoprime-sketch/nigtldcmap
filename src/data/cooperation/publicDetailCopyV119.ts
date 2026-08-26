import {
  DATA_DISPLAY_CONTRACTS_V118,
} from "../map/dataDisplayContractV118";
import type {
  DataDisplayContractV118,
} from "../map/dataDisplayContractV118";
import {
  DATA_DETAIL_PRESENTATION_INDEX_V117,
} from "./dataDetailPresentationV117";
import type {
  DetailTemplateV117,
} from "./dataDetailPresentationV117";
import {
  DATA_ELEMENT_RELATION_INDEX_V117,
} from "./dataElementRelationsV117";
import type {
  CooperationRelevanceV117,
} from "./dataElementRelationsV117";

export type PublicDetailCopyDecisionV119 =
  | "KEEP"
  | "CONDENSE"
  | "MOVE_BELOW_DATA"
  | "MOVE_TO_ACCORDION"
  | "MOVE_TO_SOURCE_TAB"
  | "MOVE_TO_TOOLTIP"
  | "REMOVE"
  | "INTERNAL_ONLY";

export type PublicDetailCopyModeV119 =
  | "standard"
  | "compact-guidance"
  | "source-note-only"
  | "data-pending";

export interface PublicDetailCopyAuditV119 {
  roleBadges: PublicDetailCopyDecisionV119;
  largeUseBlock: PublicDetailCopyDecisionV119;
  cautionBlock: PublicDetailCopyDecisionV119;
  decisionFlow: PublicDetailCopyDecisionV119;
  spatialCard: PublicDetailCopyDecisionV119;
  mapAction: PublicDetailCopyDecisionV119;
  downloadAction: PublicDetailCopyDecisionV119;
}

export interface PublicDetailCopyV119 {
  elementId: string;
  publicQuestion: string;
  compactUseNote?: string;
  compactCaution?: string;
  supportFields: string[];
  showUseNote: boolean;
  showCaution: boolean;
  showMapAction: boolean;
  showDownloadAction: boolean;
  showSpatialMetadata: boolean;
  topicLabel: string;
  analysisTitle: string;
  expectedInformation: string;
  copyDecision: PublicDetailCopyModeV119;
  audit: PublicDetailCopyAuditV119;
}

export const PUBLIC_DETAIL_BANNED_VISIBLE_TERMS_V119 = [
  "협력사업에서 어떻게 활용하나요?",
  "협력기획에서의 활용",
  "협력 검토 흐름",
  "현재 데이터가 주로 쓰이는 단계를 강조합니다",
  "현재 공간단위",
  "비공간 정보",
  "협력기획 핵심",
  "자원·기술 적용여건",
  "시장·사업환경",
] as const;

const PUBLIC_TOPIC_LABELS: Record<DetailTemplateV117, string> = {
  indicator: "국가여건",
  "climate-risk": "기후위험",
  "technology-demand": "기술수요",
  policy: "정책",
  project: "국제사업",
  finance: "재원",
  "market-industry": "시장·산업",
  partner: "기관·파트너",
  "korea-supply": "한국 공급정보",
};

const ANALYSIS_TITLES: Record<DetailTemplateV117, string> = {
  indicator: "현황과 변화",
  "climate-risk": "위험 수준과 변화",
  "technology-demand": "우선기술과 실행근거",
  policy: "정책 현황과 원문",
  project: "사업 현황",
  finance: "재원 현황",
  "market-industry": "시장·산업 현황",
  partner: "기관과 역할",
  "korea-supply": "한국 공급정보",
};

const EXPECTED_INFORMATION: Record<DetailTemplateV117, string> = {
  indicator: "국가별 값 · 실제 자료연도 · 추세 · 비교 · 원자료",
  "climate-risk": "위험수준 · 자료연도 · 공간단위 · 원자료",
  "technology-demand": "우선기술 · 분야 · 장벽 · 실행계획 · 원문",
  policy: "문서명 · 제출·공개시점 · 주요 내용 · 원문",
  project: "사업명 · 기관 · 상태 · 기간 · 공식 링크",
  finance: "연도별 규모 · 공여기관 · 흐름유형 · 원자료",
  "market-industry": "국가별 값 · 구성 · 실제 자료연도 · 비교 · 원자료",
  partner: "기관명 · 역할 · 관련 사업 · 공식 링크",
  "korea-supply": "기술·지원정보 · 대상 · 제공기관 · 공식 링크",
};

const OVERRIDES: Record<
  string,
  Partial<
    Pick<
      PublicDetailCopyV119,
      | "publicQuestion"
      | "compactUseNote"
      | "compactCaution"
      | "showUseNote"
      | "showCaution"
      | "analysisTitle"
      | "topicLabel"
      | "expectedInformation"
    >
  >
> = {
  "A-001": {
    publicQuestion:
      "공공부문 청렴성에 대한 인식은 어느 수준이며 최근 어떻게 변했는가?",
    compactUseNote:
      "공공부문 사업·조달·인허가 환경을 이해할 때 다른 제도자료와 함께 참고할 수 있습니다.",
    compactCaution:
      "이 지표는 기후기술 수요나 협력사업의 적합성을 직접 측정하지 않으며 개별 기관·사업의 청렴성을 평가하는 데 사용하지 않습니다.",
    showUseNote: true,
    showCaution: true,
    topicLabel: "참고지표",
  },
  "A-010": {
    publicQuestion: "온실가스의 가스별 배출 구성은 어떠한가?",
  },
  "A-011": {
    publicQuestion: "부문별 온실가스 배출 구성과 변화는 어떠한가?",
  },
  "A-018": {
    publicQuestion: "발전설비 규모와 발전원별 구성은 어떠한가?",
    compactUseNote: "전원구성과 설비규모를 확인할 때 활용할 수 있습니다.",
    showUseNote: true,
  },
  "A-019": {
    publicQuestion: "송배전 손실률은 어느 수준이며 최근 어떻게 변했는가?",
    compactUseNote:
      "전력망 효율개선과 계통 현대화 필요성을 다른 전력지표와 함께 검토할 때 참고할 수 있습니다.",
    compactCaution:
      "높은 손실률만으로 특정 전력망 기술의 도입 가능성이나 사업성을 판단하지 않습니다.",
    showUseNote: true,
    showCaution: true,
    analysisTitle: "전력망 손실 현황과 변화",
  },
  "A-021": {
    publicQuestion: "전력 접근률은 어느 수준이며 최근 어떻게 변했는가?",
    compactCaution: "국가 평균은 지역별 미공급 상황을 대체하지 않습니다.",
    showCaution: true,
  },
  "A-023": {
    publicQuestion: "발전소별 설비용량과 발전원 구성은 어떠한가?",
  },
  "A-024": {
    publicQuestion: "전력망 현황과 전력 미공급 관련 정보는 무엇인가?",
  },
  "A-025": {
    publicQuestion: "CCS 관련 시설·저장·수송 인프라의 주요 현황은 어떠한가?",
  },
  "A-026": {
    publicQuestion:
      "건물 풋프린트 자료에서 확인할 수 있는 건물 규모와 밀도 정보는 무엇인가?",
  },
  "A-027": {
    publicQuestion: "교통 인프라의 규모와 구성은 어떠한가?",
  },
  "A-028": {
    publicQuestion: "해안·수자원 인프라의 규모와 구성은 어떠한가?",
  },
  "B-001": {
    publicQuestion: "건기와 우기의 시기와 계절적 특성은 어떠한가?",
  },
  "B-002": {
    publicQuestion: "주요 기후대의 특성은 무엇인가?",
  },
  "B-006": {
    publicQuestion:
      "폭염·열대야·고온체감 지표는 어느 수준이며 어떻게 변하고 있는가?",
    compactCaution: "국가 단위 값만으로 지역별 고온위험을 판단하지 않습니다.",
    showCaution: true,
  },
  "B-012": {
    publicQuestion: "최근 주요 재해의 발생시점과 피해 규모는 어떠한가?",
  },
  "B-017": {
    publicQuestion: "물 스트레스 수준은 어느 정도인가?",
  },
  "B-022": {
    publicQuestion:
      "기후피해의 경제적 비용으로 본 중장기 위험은 어느 수준인가?",
  },
  "B-025": {
    publicQuestion: "주요 유역의 규모와 구성은 어떠한가?",
  },
  "B-026": {
    publicQuestion: "하천 유향과 배수 네트워크 정보는 무엇인가?",
  },
  "B-027": {
    publicQuestion: "지하수 잠재량은 어느 수준인가?",
  },
  "B-028": {
    publicQuestion: "주요 하천 유량은 어느 수준인가?",
  },
  "B-029": {
    publicQuestion: "산림 유형별 면적 구성은 어떠한가?",
  },
  "B-030": {
    publicQuestion: "산림 이득 규모와 변화는 어떠한가?",
  },
  "B-032": {
    publicQuestion: "수관피복률과 고밀도 산림의 현황은 어떠한가?",
  },
  "B-033": {
    publicQuestion: "연간 산림 손실 규모와 변화는 어떠한가?",
  },
  "B-034": {
    publicQuestion: "산림 탄소저장량은 어느 수준인가?",
  },
  "B-036": {
    publicQuestion: "토지이용 변화율은 어느 수준인가?",
  },
  "B-038": {
    publicQuestion: "바이오매스 자원 가용량은 어느 수준인가?",
  },
  "B-039": {
    publicQuestion: "수력 잠재량은 어느 수준인가?",
  },
  "B-040": {
    publicQuestion: "지열 잠재량은 어느 수준인가?",
  },
  "B-041": {
    publicQuestion: "태양광 자원과 발전 잠재량은 어느 수준인가?",
    compactCaution:
      "국가 평균 잠재량은 실제 입지의 계통·토지·수요 여건을 대체하지 않습니다.",
    showCaution: true,
  },
  "B-042": {
    publicQuestion: "풍력 자원 수준은 어떠한가?",
  },
  "B-043": {
    publicQuestion: "화석연료 자원량은 어느 수준인가?",
  },
  "B-048": {
    publicQuestion: "주요 광산의 자원·생산 관련 정보는 무엇인가?",
  },
  "C-001": {
    publicQuestion: "NDC의 제출 이력과 현재 적용 문서는 무엇인가?",
  },
  "C-002": {
    publicQuestion: "BTR의 제출 이력과 공개 문서는 무엇인가?",
  },
  "C-003": {
    publicQuestion: "NAP의 제출 이력과 공개 문서는 무엇인가?",
  },
  "C-004": {
    publicQuestion: "장기 저탄소발전전략의 배출경로와 주요 방향은 무엇인가?",
  },
  "C-005": {
    publicQuestion:
      "국가가 공식적으로 제시한 우선 기후기술과 실행과제는 무엇인가?",
    compactUseNote:
      "우선기술, 기술이전 장벽, 실행계획과 최신 정책의 일치 여부를 함께 확인할 수 있습니다.",
    compactCaution:
      "TNA/TAP 작성시점과 최신 NDC·NAP·BTR의 방향이 다를 수 있으므로 현재성 정보를 함께 확인해야 합니다.",
    showUseNote: true,
    showCaution: true,
  },
  "C-011": {
    publicQuestion: "치안·안전 위험을 확인할 수 있는 공식 정보는 무엇인가?",
  },
  "C-015": {
    publicQuestion: "재생에너지 정책·전망 관련 공식 원문은 무엇인가?",
  },
  "D-008": {
    publicQuestion: "부처별 기후예산 규모와 구성은 어떠한가?",
  },
  "D-011": {
    publicQuestion:
      "ODA 실제지출과 약정은 어느 규모이며 주요 공여기관은 누구인가?",
    compactUseNote:
      "수원국의 공여환경과 재원 흐름을 파악할 때 참고할 수 있습니다.",
    compactCaution:
      "실제지출과 약정은 서로 다른 금융개념이므로 합산하지 않으며 ODA 규모가 신규 협력기회를 직접 의미하지 않습니다.",
    showUseNote: true,
    showCaution: true,
  },
  "D-018": {
    publicQuestion: "Adaptation Fund 사업의 현황과 추진상태는 어떠한가?",
  },
  "D-019": {
    publicQuestion: "CTCN 기술지원 요청의 분야와 추진상태는 어떠한가?",
  },
  "D-020": {
    publicQuestion: "GCF 사업의 현황과 추진상태는 어떠한가?",
  },
  "D-021": {
    publicQuestion: "World Bank·ADB 사업의 현황과 추진상태는 어떠한가?",
  },
  "D-023": {
    publicQuestion: "기후기금별 사업과 재원 현황은 어떠한가?",
  },
  "E-001": {
    publicQuestion: "CTCN 국가지정기구와 공식 연락창구는 누구인가?",
  },
  "E-002": {
    publicQuestion: "국가지정기관과 승인절차 관련 공식 창구는 누구인가?",
  },
  "E-003": {
    publicQuestion: "GCF 국가지정기관과 공식 연락창구는 누구인가?",
  },
  "E-015": {
    publicQuestion:
      "선택 국가는 NDC Partnership에 참여하고 있으며 어떤 지원을 받고 있는가?",
  },
  "E-016": {
    publicQuestion: "한국 기후기술의 기술성숙도 정보는 무엇인가?",
  },
  "E-019": {
    publicQuestion: "한국 공공기관의 현지 사무소와 지원업무는 무엇인가?",
  },
  "E-020": {
    publicQuestion: "한국의 지원기관과 지원 프로그램은 무엇인가?",
  },
};

function templateFor(elementId: string): DetailTemplateV117 {
  return (
    DATA_DETAIL_PRESENTATION_INDEX_V117.get(elementId)?.template ?? "indicator"
  );
}

function hasActualSpatialFields(contract: DataDisplayContractV118): boolean {
  if (contract.actualDataStatus === "planned") return false;
  return (
    contract.actualSpatialResolution !== "non-spatial" &&
    Boolean(
      contract.geographicFields.countryIso3 ||
        contract.geographicFields.admin1Code ||
        contract.geographicFields.admin2Code ||
        contract.geographicFields.latitude ||
        contract.geographicFields.longitude ||
        contract.geographicFields.geometry ||
        contract.geographicFields.gridId ||
        contract.geographicFields.basinId ||
        contract.geographicFields.corridorId
    )
  );
}

function hasDetailedSpatialFields(contract: DataDisplayContractV118): boolean {
  if (contract.actualDataStatus === "planned") return false;
  return Boolean(
    contract.geographicFields.admin1Code ||
      contract.geographicFields.admin2Code ||
      contract.geographicFields.latitude ||
      contract.geographicFields.longitude ||
      contract.geographicFields.geometry ||
      contract.geographicFields.gridId ||
      contract.geographicFields.basinId ||
      contract.geographicFields.corridorId
  );
}

function baseQuestion(
  contract: DataDisplayContractV118,
  template: DetailTemplateV117
): string {
  const label = contract.label;
  const actualSpatial = hasActualSpatialFields(contract);
  const detailedSpatial = [
    "admin1",
    "admin2",
    "facility",
    "grid",
    "basin",
    "corridor",
  ].includes(contract.actualSpatialResolution);

  if (template === "technology-demand") {
    return `${label}에서 확인되는 우선 기술수요는 무엇인가?`;
  }
  if (template === "policy") {
    return `${label}의 정책 현황과 주요 내용은 무엇인가?`;
  }
  if (template === "project") {
    if (
      actualSpatial &&
      Boolean(
        contract.geographicFields.latitude || contract.geographicFields.geometry
      )
    ) {
      return `${label} 사업은 어디에서 추진되고 있으며 상태는 어떠한가?`;
    }
    return `${label}의 사업 현황과 추진상태는 어떠한가?`;
  }
  if (template === "finance") {
    return `${label}의 규모와 최근 변화는 어떠한가?`;
  }
  if (template === "partner") {
    return `${label}에서 확인할 수 있는 주요 기관과 역할은 무엇인가?`;
  }
  if (template === "korea-supply") {
    return `${label}에서 확인할 수 있는 한국의 기술·지원정보는 무엇인가?`;
  }
  if (template === "climate-risk") {
    return detailedSpatial && actualSpatial
      ? `${label}의 지역별 수준과 변화는 어떠한가?`
      : `${label}의 수준과 변화는 어떠한가?`;
  }
  if (template === "market-industry") {
    return `${label}의 규모·구성과 최근 변화는 어떠한가?`;
  }
  return `${label}의 수준과 최근 변화는 어떠한가?`;
}

function defaultUseNote(template: DetailTemplateV117): string | undefined {
  switch (template) {
    case "technology-demand":
      return "국가가 공식적으로 제시한 우선기술과 실행과제를 확인할 수 있습니다.";
    case "policy":
      return "기술수요와 사업계획이 현재 정책에 부합하는지 확인할 때 참고할 수 있습니다.";
    case "project":
      return "기존 국제지원과 사업 추진현황을 확인할 때 활용할 수 있습니다.";
    case "finance":
      return "사업 재원환경과 공여 흐름을 확인할 때 활용할 수 있습니다.";
    case "partner":
      return "협력 창구와 시행기관을 확인할 때 활용할 수 있습니다.";
    case "korea-supply":
      return "한국의 기술·지원정보를 수요자료와 구분해 확인할 수 있습니다.";
    default:
      return undefined;
  }
}

function defaultCaution(
  template: DetailTemplateV117,
  relevance: CooperationRelevanceV117 | undefined,
  contract: DataDisplayContractV118
): string | undefined {
  if (template === "finance") {
    return "실제지출·약정·승인금액 등 서로 다른 금융개념을 구분해서 확인해야 합니다.";
  }
  if (template === "project") {
    return "사업 수나 승인금액만으로 신규 기술수요나 추가 사업기회를 판단하지 않습니다.";
  }
  if (template === "policy") {
    return "정책문서의 존재와 실제 사업 이행은 구분해서 확인해야 합니다.";
  }
  if (template === "technology-demand") {
    return "작성시점과 최신 정책의 일치 여부를 함께 확인해야 합니다.";
  }
  if (
    template === "climate-risk" &&
    contract.actualSpatialResolution === "country"
  ) {
    return "국가 평균은 지역별 위험 차이를 대체하지 않습니다.";
  }
  if (relevance === "context") {
    return "이 데이터는 기후기술 수요나 협력사업의 적합성을 직접 측정하는 지표가 아닙니다.";
  }
  return undefined;
}

const SPATIAL_COPY_TERMS_V119 =
  /(어디에|어디서|어디이며|어디인가|입지|위치(?:\s*분포)?|분포|지역별|계통연계\s*지점|전환대상\s*위치)/;

function supportedPublicQuestion(
  contract: DataDisplayContractV118,
  template: DetailTemplateV117,
  candidate: string
): string {
  if (
    SPATIAL_COPY_TERMS_V119.test(candidate) &&
    !hasDetailedSpatialFields(contract)
  ) {
    return baseQuestion(contract, template);
  }
  return candidate;
}

function buildPublicDetailCopy(
  contract: DataDisplayContractV118
): PublicDetailCopyV119 {
  const presentation = DATA_DETAIL_PRESENTATION_INDEX_V117.get(
    contract.elementId
  );
  const relation = DATA_ELEMENT_RELATION_INDEX_V117.get(contract.elementId);
  const template = templateFor(contract.elementId);
  const override = OVERRIDES[contract.elementId] ?? {};
  const useNote = override.compactUseNote ?? defaultUseNote(template);
  const caution =
    override.compactCaution ??
    defaultCaution(template, relation?.cooperationRelevance, contract);
  const showUseNote = override.showUseNote ?? Boolean(useNote);
  const showCaution = override.showCaution ?? Boolean(caution);
  const showMapAction =
    contract.actualDataStatus !== "planned" &&
    hasActualSpatialFields(contract) &&
    (contract.displaySurface === "map-primary" ||
      contract.displaySurface === "map-overlay");
  const showDownloadAction =
    contract.actualDataStatus !== "planned" &&
    contract.actualDatasetIds.length > 0;
  const showSpatialMetadata = hasActualSpatialFields(contract);

  const copyDecision: PublicDetailCopyModeV119 =
    contract.actualDataStatus === "planned"
      ? "data-pending"
      : showUseNote || showCaution
      ? "compact-guidance"
      : template === "partner" || template === "policy"
      ? "source-note-only"
      : "standard";

  const publicQuestion = supportedPublicQuestion(
    contract,
    template,
    override.publicQuestion ??
      relation?.answersQuestion ??
      baseQuestion(contract, template)
  );

  return {
    elementId: contract.elementId,
    publicQuestion,
    compactUseNote: useNote,
    compactCaution: caution,
    supportFields: [...contract.expectedFields],
    showUseNote,
    showCaution,
    showMapAction,
    showDownloadAction,
    showSpatialMetadata,
    topicLabel: override.topicLabel ?? PUBLIC_TOPIC_LABELS[template],
    analysisTitle:
      override.analysisTitle ??
      presentation?.analysisTitle ??
      ANALYSIS_TITLES[template],
    expectedInformation:
      override.expectedInformation ?? EXPECTED_INFORMATION[template],
    copyDecision,
    audit: {
      roleBadges: "REMOVE",
      largeUseBlock: showUseNote ? "MOVE_TO_ACCORDION" : "REMOVE",
      cautionBlock: showCaution ? "MOVE_TO_ACCORDION" : "REMOVE",
      decisionFlow: "INTERNAL_ONLY",
      spatialCard: showSpatialMetadata ? "CONDENSE" : "REMOVE",
      mapAction: showMapAction ? "KEEP" : "REMOVE",
      downloadAction: showDownloadAction ? "KEEP" : "REMOVE",
    },
  };
}

export const PUBLIC_DETAIL_COPY_DEFINITIONS_V119: PublicDetailCopyV119[] =
  DATA_DISPLAY_CONTRACTS_V118.map(buildPublicDetailCopy);

export const PUBLIC_DETAIL_COPY_INDEX_V119 = new Map(
  PUBLIC_DETAIL_COPY_DEFINITIONS_V119.map(
    (item) => [item.elementId, item] as const
  )
);

export const PUBLIC_DETAIL_COPY_SUMMARY_V119 = {
  total: PUBLIC_DETAIL_COPY_DEFINITIONS_V119.length,
  standard: PUBLIC_DETAIL_COPY_DEFINITIONS_V119.filter(
    (item) => item.copyDecision === "standard"
  ).length,
  compactGuidance: PUBLIC_DETAIL_COPY_DEFINITIONS_V119.filter(
    (item) => item.copyDecision === "compact-guidance"
  ).length,
  sourceNoteOnly: PUBLIC_DETAIL_COPY_DEFINITIONS_V119.filter(
    (item) => item.copyDecision === "source-note-only"
  ).length,
  pending: PUBLIC_DETAIL_COPY_DEFINITIONS_V119.filter(
    (item) => item.copyDecision === "data-pending"
  ).length,
  mapActions: PUBLIC_DETAIL_COPY_DEFINITIONS_V119.filter(
    (item) => item.showMapAction
  ).length,
  downloadActions: PUBLIC_DETAIL_COPY_DEFINITIONS_V119.filter(
    (item) => item.showDownloadAction
  ).length,
  spatialMetadata: PUBLIC_DETAIL_COPY_DEFINITIONS_V119.filter(
    (item) => item.showSpatialMetadata
  ).length,
  useNotes: PUBLIC_DETAIL_COPY_DEFINITIONS_V119.filter(
    (item) => item.showUseNote
  ).length,
  cautions: PUBLIC_DETAIL_COPY_DEFINITIONS_V119.filter(
    (item) => item.showCaution
  ).length,
} as const;

export const PUBLIC_DETAIL_RUNTIME_POLICY_V119 = {
  roleBadgesPublic: false,
  genericDecisionFlowPublic: false,
  independentSpatialCardPublic: false,
  plannedSyntheticValuesPublic: false,
  plannedSyntheticRankingPublic: false,
  plannedDirectDownloadPublic: false,
  largeGenericGuidanceBeforeData: false,
  mapActionRequiresActualContract: true,
  spatialQuestionRequiresActualSpatialField: true,
  relatedDataUsesExistingElementRoute: true,
  downloadUsesDedicatedHub: true,
} as const;

export const PUBLIC_DETAIL_COMMON_UI_COPY_V119 = [
  "활용 참고",
  "함께 확인할 데이터",
  "관련 데이터 더 보기",
  "데이터 준비 중",
  "예정 출처",
  "제공 예정 정보",
  "다운로드 설정",
  "원자료 확인",
  "지도에서 보기",
] as const;
