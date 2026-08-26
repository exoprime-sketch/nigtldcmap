import type { VietnamDemoElement } from "../types/vietnamDemo";
import type { FinalPreviewMode } from "./dataPreviewV53";
import { getFinalPreviewMode } from "./dataPreviewV53";
import { isGlobalStatisticElement } from "./globalStatisticV57";
import { isStructuredCountryPreviewV60 } from "../components/data/CountryStructuredPreviewV60";
import { getSemanticPrimaryLabelV65 } from "./dataSemanticPresentationV65";
import {
  getSpatialDetailTabLabelV66,
  isSpatialElementV66,
} from "./spatialPresentationV66";
import {
  getCapabilityDetailLabelV67,
  getCapabilityPrimaryLabelV67,
  isCapabilityElementV67,
} from "./capabilityPresentationV67";
import { getDimensionPrimaryLabelV68 } from "./dataDimensionV68";
import {
  getResearchPrimaryLabelV70,
  isResearchInnovationElementV70,
} from "./researchInnovationV70";
import {
  getContextualPrimaryLabelV73,
  isContextualElementV73,
} from "./contextualPresentationV73";

export type PreviewTabKey = "primary" | "detail" | "source";

export interface PreviewTabDefinition {
  key: PreviewTabKey;
  label: string;
}

export interface PreviewTabModel {
  family:
    | "single_data"
    | "map_list"
    | "relationship"
    | "scorecard"
    | "structured"
    | "requirements"
    | "opportunity"
    | "comparative";
  tabs: PreviewTabDefinition[];
  primaryLabel: string;
  detailLabel?: string;
  detailMeaningful: boolean;
}

const SPECIAL_MODELS: Record<string, PreviewTabModel> = {
  "D-020": {
    family: "structured",
    primaryLabel: "포트폴리오",
    detailLabel: "프로젝트 목록",
    detailMeaningful: true,
    tabs: [
      { key: "primary", label: "포트폴리오" },
      { key: "detail", label: "프로젝트 목록" },
      { key: "source", label: "출처·유의사항" },
    ],
  },
  "A-013": {
    family: "relationship",
    primaryLabel: "연계 개요",
    detailLabel: "매핑 상세",
    detailMeaningful: true,
    tabs: [
      { key: "primary", label: "연계 개요" },
      { key: "detail", label: "매핑 상세" },
      { key: "source", label: "출처·유의사항" },
    ],
  },
  "A-015": {
    family: "scorecard",
    primaryLabel: "현황",
    detailLabel: "목표별 상세",
    detailMeaningful: true,
    tabs: [
      { key: "primary", label: "현황" },
      { key: "detail", label: "목표별 상세" },
      { key: "source", label: "출처·유의사항" },
    ],
  },
  "C-002": {
    family: "structured",
    primaryLabel: "핵심 현황",
    detailLabel: "보고 상세",
    detailMeaningful: true,
    tabs: [
      { key: "primary", label: "핵심 현황" },
      { key: "detail", label: "보고 상세" },
      { key: "source", label: "출처·유의사항" },
    ],
  },
  "C-003": {
    family: "structured",
    primaryLabel: "적응 현황",
    detailLabel: "조치·투자",
    detailMeaningful: true,
    tabs: [
      { key: "primary", label: "적응 현황" },
      { key: "detail", label: "조치·투자" },
      { key: "source", label: "출처·유의사항" },
    ],
  },
  "C-024": {
    family: "structured",
    primaryLabel: "이행 현황",
    detailLabel: "항목별 상세",
    detailMeaningful: true,
    tabs: [
      { key: "primary", label: "이행 현황" },
      { key: "detail", label: "항목별 상세" },
      { key: "source", label: "출처·유의사항" },
    ],
  },
  "C-025": {
    family: "structured",
    primaryLabel: "시장 현황",
    detailLabel: "프로젝트 목록",
    detailMeaningful: true,
    tabs: [
      { key: "primary", label: "시장 현황" },
      { key: "detail", label: "프로젝트 목록" },
      { key: "source", label: "출처·유의사항" },
    ],
  },
  "C-012": {
    family: "requirements",
    primaryLabel: "제도 현황",
    detailLabel: "요건 상세",
    detailMeaningful: true,
    tabs: [
      { key: "primary", label: "제도 현황" },
      { key: "detail", label: "요건 상세" },
      { key: "source", label: "출처·유의사항" },
    ],
  },
  "D-017": {
    family: "opportunity",
    primaryLabel: "기회 현황",
    detailLabel: "공고 목록",
    detailMeaningful: true,
    tabs: [
      { key: "primary", label: "기회 현황" },
      { key: "detail", label: "공고 목록" },
      { key: "source", label: "출처·유의사항" },
    ],
  },
  "E-017": {
    family: "comparative",
    primaryLabel: "비교 개요",
    detailLabel: "비교 근거",
    detailMeaningful: true,
    tabs: [
      { key: "primary", label: "비교 개요" },
      { key: "detail", label: "비교 근거" },
      { key: "source", label: "출처·유의사항" },
    ],
  },
};

function getSingleDataLabel(mode: FinalPreviewMode): string {
  switch (mode) {
    case "document_library":
      return "문서 목록";
    case "policy_evidence":
    case "policy_timeline":
    case "agreement_timeline":
      return "정책·원문";
    case "process":
      return "절차";
    case "portfolio":
      return "사업 현황";
    case "finance_portfolio":
      return "재원·사업";
    case "competitor_dashboard":
      return "비교 현황";
    case "directory":
      return "기관 목록";
    case "capability_matrix":
    case "comparative_matrix":
    case "requirements_matrix":
      return "항목별 현황";
    case "participation_status":
      return "참여 현황";
    case "support_programs":
      return "지원프로그램";
    default:
      return "데이터";
  }
}

export function getPreviewTabModel(
  element: VietnamDemoElement
): PreviewTabModel {
  const special = SPECIAL_MODELS[element.elementId];
  if (special) return special;

  const mode = getFinalPreviewMode(element);

  if (isContextualElementV73(element)) {
    const primaryLabel =
      getContextualPrimaryLabelV73(element.elementId) ?? "데이터";

    return {
      family: "single_data",
      primaryLabel,
      detailMeaningful: false,
      tabs: [
        { key: "primary", label: primaryLabel },
        { key: "source", label: "출처·유의사항" },
      ],
    };
  }

  if (isResearchInnovationElementV70(element)) {
    const primaryLabel = getResearchPrimaryLabelV70();

    return {
      family: "single_data",
      primaryLabel,
      detailMeaningful: false,
      tabs: [
        { key: "primary", label: primaryLabel },
        { key: "source", label: "출처·유의사항" },
      ],
    };
  }

  if (isCapabilityElementV67(element)) {
    const primaryLabel =
      getCapabilityPrimaryLabelV67(element.elementId) ?? "현황";
    const detailLabel =
      getCapabilityDetailLabelV67(element.elementId) ?? "상세";

    return {
      family: "structured",
      primaryLabel,
      detailLabel,
      detailMeaningful: true,
      tabs: [
        { key: "primary", label: primaryLabel },
        { key: "detail", label: detailLabel },
        { key: "source", label: "출처·유의사항" },
      ],
    };
  }

  const dimensionPrimaryLabel = getDimensionPrimaryLabelV68(element.elementId);

  if (dimensionPrimaryLabel) {
    return {
      family: "single_data",
      primaryLabel: dimensionPrimaryLabel,
      detailMeaningful: false,
      tabs: [
        { key: "primary", label: dimensionPrimaryLabel },
        { key: "source", label: "출처·유의사항" },
      ],
    };
  }

  if (isGlobalStatisticElement(element)) {
    return {
      family: "single_data",
      primaryLabel: "데이터",
      detailMeaningful: false,
      tabs: [
        { key: "primary", label: "데이터" },
        { key: "source", label: "출처·유의사항" },
      ],
    };
  }

  if (isStructuredCountryPreviewV60(element.elementId)) {
    // v60 structured items with no explicit special override:
    // keep the final renderer in one data view unless its information layers
    // are explicitly separated above.
    return {
      family: "single_data",
      primaryLabel: "데이터",
      detailMeaningful: false,
      tabs: [
        { key: "primary", label: "데이터" },
        { key: "source", label: "출처·유의사항" },
      ],
    };
  }

  if (mode === "map" || isSpatialElementV66(element)) {
    const detailLabel = getSpatialDetailTabLabelV66(element.elementId);

    return {
      family: "map_list",
      primaryLabel: "지도",
      detailLabel,
      detailMeaningful: true,
      tabs: [
        { key: "primary", label: "지도" },
        { key: "detail", label: detailLabel },
        { key: "source", label: "출처·유의사항" },
      ],
    };
  }

  const semanticPrimaryLabel = getSemanticPrimaryLabelV65(element.elementId);

  if (semanticPrimaryLabel) {
    return {
      family: "single_data",
      primaryLabel: semanticPrimaryLabel,
      detailMeaningful: false,
      tabs: [
        { key: "primary", label: semanticPrimaryLabel },
        { key: "source", label: "출처·유의사항" },
      ],
    };
  }

  return {
    family: "single_data",
    primaryLabel: getSingleDataLabel(mode),
    detailMeaningful: false,
    tabs: [
      { key: "primary", label: getSingleDataLabel(mode) },
      { key: "source", label: "출처·유의사항" },
    ],
  };
}
