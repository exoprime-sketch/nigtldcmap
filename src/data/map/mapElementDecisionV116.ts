import {
  MAP_ELEMENT_AUDIT_INDEX_V115,
  MAP_ELEMENT_AUDIT_V115,
} from "./mapElementAuditV115";
import type { SpatialResolutionV116 } from "../../types/spatialDataV116";

export type CooperationDecisionRoleV116 =
  | "R1"
  | "R2"
  | "R3"
  | "R4"
  | "R5"
  | "R6"
  | "R7"
  | "R8"
  | "R9";

export type VisualPriorityV116 = "core" | "supporting" | "on-demand";
export type EncodingRoleV116 =
  | "base"
  | "bubble"
  | "symbol"
  | "outline"
  | "point"
  | "flow"
  | "panel";
export type RegionalizationPriorityV116 = "high" | "medium" | "low";

export interface MapElementDecisionV116 {
  elementId: string;
  cooperationDecisionRoles: CooperationDecisionRoleV116[];
  actualResolution: SpatialResolutionV116;
  preferredResolution: SpatialResolutionV116;
  regionalizationPriority: RegionalizationPriorityV116;
  visualPriority: VisualPriorityV116;
  defaultIntegratedView: boolean;
  encodingRole: EncodingRoleV116;
  spatialRationale: string;
  curatedReason: string;
}

export const COOPERATION_DECISION_ROLE_LABELS_V116: Record<
  CooperationDecisionRoleV116,
  string
> = {
  R1: "협력수요",
  R2: "정책 정합성",
  R3: "문제·위험",
  R4: "자원·기술 적용여건",
  R5: "시장·사업환경",
  R6: "기존 국제지원",
  R7: "재원·공여환경",
  R8: "파트너·실행기반",
  R9: "한국 공급연계",
} as const;

export const MAP_ELEMENT_DECISIONS_V116: MapElementDecisionV116[] = [
  {
    elementId: "A-001",
    cooperationDecisionRoles: ["R5"],
    actualResolution: "non-spatial",
    preferredResolution: "country",
    regionalizationPriority: "low",
    visualPriority: "on-demand",
    defaultIntegratedView: false,
    encodingRole: "base",
    spatialRationale:
      "정책·제도·국가집계 성격이 강해 국가 단위가 원자료 의미를 가장 잘 보존",
    curatedReason: "상세 검토 단계에서 필요할 때 선택하는 보조정보",
  },
  {
    elementId: "A-002",
    cooperationDecisionRoles: ["R2", "R5"],
    actualResolution: "non-spatial",
    preferredResolution: "country",
    regionalizationPriority: "low",
    visualPriority: "on-demand",
    defaultIntegratedView: false,
    encodingRole: "base",
    spatialRationale:
      "정책·제도·국가집계 성격이 강해 국가 단위가 원자료 의미를 가장 잘 보존",
    curatedReason: "상세 검토 단계에서 필요할 때 선택하는 보조정보",
  },
  {
    elementId: "A-003",
    cooperationDecisionRoles: ["R5"],
    actualResolution: "country",
    preferredResolution: "admin1",
    regionalizationPriority: "medium",
    visualPriority: "on-demand",
    defaultIntegratedView: false,
    encodingRole: "base",
    spatialRationale:
      "국가 평균보다 주·성·도 단위의 시장·인프라 격차가 협력대상 선정에 더 유용",
    curatedReason: "상세 검토 단계에서 필요할 때 선택하는 보조정보",
  },
  {
    elementId: "A-004",
    cooperationDecisionRoles: ["R5"],
    actualResolution: "country",
    preferredResolution: "admin1",
    regionalizationPriority: "medium",
    visualPriority: "on-demand",
    defaultIntegratedView: false,
    encodingRole: "base",
    spatialRationale:
      "국가 평균보다 주·성·도 단위의 시장·인프라 격차가 협력대상 선정에 더 유용",
    curatedReason: "상세 검토 단계에서 필요할 때 선택하는 보조정보",
  },
  {
    elementId: "A-005",
    cooperationDecisionRoles: ["R5"],
    actualResolution: "country",
    preferredResolution: "admin1",
    regionalizationPriority: "medium",
    visualPriority: "on-demand",
    defaultIntegratedView: false,
    encodingRole: "base",
    spatialRationale:
      "국가 평균보다 주·성·도 단위의 시장·인프라 격차가 협력대상 선정에 더 유용",
    curatedReason: "상세 검토 단계에서 필요할 때 선택하는 보조정보",
  },
  {
    elementId: "A-006",
    cooperationDecisionRoles: ["R5"],
    actualResolution: "country",
    preferredResolution: "admin1",
    regionalizationPriority: "medium",
    visualPriority: "on-demand",
    defaultIntegratedView: false,
    encodingRole: "base",
    spatialRationale:
      "국가 평균보다 주·성·도 단위의 시장·인프라 격차가 협력대상 선정에 더 유용",
    curatedReason: "상세 검토 단계에서 필요할 때 선택하는 보조정보",
  },
  {
    elementId: "A-007",
    cooperationDecisionRoles: ["R5"],
    actualResolution: "country",
    preferredResolution: "admin1",
    regionalizationPriority: "medium",
    visualPriority: "on-demand",
    defaultIntegratedView: false,
    encodingRole: "base",
    spatialRationale:
      "국가 평균보다 주·성·도 단위의 시장·인프라 격차가 협력대상 선정에 더 유용",
    curatedReason: "상세 검토 단계에서 필요할 때 선택하는 보조정보",
  },
  {
    elementId: "A-008",
    cooperationDecisionRoles: ["R5"],
    actualResolution: "country",
    preferredResolution: "country",
    regionalizationPriority: "low",
    visualPriority: "on-demand",
    defaultIntegratedView: false,
    encodingRole: "base",
    spatialRationale:
      "정책·제도·국가집계 성격이 강해 국가 단위가 원자료 의미를 가장 잘 보존",
    curatedReason: "상세 검토 단계에서 필요할 때 선택하는 보조정보",
  },
  {
    elementId: "A-009",
    cooperationDecisionRoles: ["R3"],
    actualResolution: "non-spatial",
    preferredResolution: "admin1",
    regionalizationPriority: "medium",
    visualPriority: "supporting",
    defaultIntegratedView: false,
    encodingRole: "base",
    spatialRationale:
      "국가 평균보다 주·성·도 단위의 시장·인프라 격차가 협력대상 선정에 더 유용",
    curatedReason:
      "국제협력 검토에 중요하나 기본 화면 과밀화를 막기 위해 카탈로그에서 필요 시 활성화",
  },
  {
    elementId: "A-010",
    cooperationDecisionRoles: ["R3"],
    actualResolution: "non-spatial",
    preferredResolution: "admin1",
    regionalizationPriority: "medium",
    visualPriority: "supporting",
    defaultIntegratedView: false,
    encodingRole: "base",
    spatialRationale:
      "국가 평균보다 주·성·도 단위의 시장·인프라 격차가 협력대상 선정에 더 유용",
    curatedReason:
      "국제협력 검토에 중요하나 기본 화면 과밀화를 막기 위해 카탈로그에서 필요 시 활성화",
  },
  {
    elementId: "A-011",
    cooperationDecisionRoles: ["R3"],
    actualResolution: "non-spatial",
    preferredResolution: "admin1",
    regionalizationPriority: "medium",
    visualPriority: "supporting",
    defaultIntegratedView: false,
    encodingRole: "base",
    spatialRationale:
      "국가 평균보다 주·성·도 단위의 시장·인프라 격차가 협력대상 선정에 더 유용",
    curatedReason:
      "국제협력 검토에 중요하나 기본 화면 과밀화를 막기 위해 카탈로그에서 필요 시 활성화",
  },
  {
    elementId: "A-012",
    cooperationDecisionRoles: ["R3"],
    actualResolution: "non-spatial",
    preferredResolution: "admin1",
    regionalizationPriority: "medium",
    visualPriority: "supporting",
    defaultIntegratedView: false,
    encodingRole: "base",
    spatialRationale:
      "국가 평균보다 주·성·도 단위의 시장·인프라 격차가 협력대상 선정에 더 유용",
    curatedReason:
      "국제협력 검토에 중요하나 기본 화면 과밀화를 막기 위해 카탈로그에서 필요 시 활성화",
  },
  {
    elementId: "A-013",
    cooperationDecisionRoles: ["R2"],
    actualResolution: "non-spatial",
    preferredResolution: "country",
    regionalizationPriority: "low",
    visualPriority: "on-demand",
    defaultIntegratedView: false,
    encodingRole: "panel",
    spatialRationale:
      "정책·제도·국가집계 성격이 강해 국가 단위가 원자료 의미를 가장 잘 보존",
    curatedReason: "상세 검토 단계에서 필요할 때 선택하는 보조정보",
  },
  {
    elementId: "A-014",
    cooperationDecisionRoles: ["R5"],
    actualResolution: "non-spatial",
    preferredResolution: "country",
    regionalizationPriority: "low",
    visualPriority: "on-demand",
    defaultIntegratedView: false,
    encodingRole: "base",
    spatialRationale:
      "정책·제도·국가집계 성격이 강해 국가 단위가 원자료 의미를 가장 잘 보존",
    curatedReason: "상세 검토 단계에서 필요할 때 선택하는 보조정보",
  },
  {
    elementId: "A-015",
    cooperationDecisionRoles: ["R2"],
    actualResolution: "non-spatial",
    preferredResolution: "country",
    regionalizationPriority: "low",
    visualPriority: "on-demand",
    defaultIntegratedView: false,
    encodingRole: "panel",
    spatialRationale:
      "정책·제도·국가집계 성격이 강해 국가 단위가 원자료 의미를 가장 잘 보존",
    curatedReason: "상세 검토 단계에서 필요할 때 선택하는 보조정보",
  },
  {
    elementId: "A-016",
    cooperationDecisionRoles: ["R4", "R5"],
    actualResolution: "non-spatial",
    preferredResolution: "country",
    regionalizationPriority: "low",
    visualPriority: "supporting",
    defaultIntegratedView: false,
    encodingRole: "panel",
    spatialRationale:
      "정책·제도·국가집계 성격이 강해 국가 단위가 원자료 의미를 가장 잘 보존",
    curatedReason:
      "국제협력 검토에 중요하나 기본 화면 과밀화를 막기 위해 카탈로그에서 필요 시 활성화",
  },
  {
    elementId: "A-017",
    cooperationDecisionRoles: ["R4", "R5"],
    actualResolution: "non-spatial",
    preferredResolution: "admin1",
    regionalizationPriority: "medium",
    visualPriority: "supporting",
    defaultIntegratedView: false,
    encodingRole: "base",
    spatialRationale:
      "국가 평균보다 주·성·도 단위의 시장·인프라 격차가 협력대상 선정에 더 유용",
    curatedReason:
      "국제협력 검토에 중요하나 기본 화면 과밀화를 막기 위해 카탈로그에서 필요 시 활성화",
  },
  {
    elementId: "A-018",
    cooperationDecisionRoles: ["R4", "R5"],
    actualResolution: "non-spatial",
    preferredResolution: "admin1",
    regionalizationPriority: "medium",
    visualPriority: "supporting",
    defaultIntegratedView: false,
    encodingRole: "base",
    spatialRationale:
      "국가 평균보다 주·성·도 단위의 시장·인프라 격차가 협력대상 선정에 더 유용",
    curatedReason:
      "국제협력 검토에 중요하나 기본 화면 과밀화를 막기 위해 카탈로그에서 필요 시 활성화",
  },
  {
    elementId: "A-019",
    cooperationDecisionRoles: ["R3", "R4", "R5"],
    actualResolution: "country",
    preferredResolution: "admin1",
    regionalizationPriority: "high",
    visualPriority: "core",
    defaultIntegratedView: false,
    encodingRole: "base",
    spatialRationale:
      "국가 평균보다 주·성·도 단위의 시장·인프라 격차가 협력대상 선정에 더 유용",
    curatedReason: "상세 검토 단계에서 필요할 때 선택하는 보조정보",
  },
  {
    elementId: "A-020",
    cooperationDecisionRoles: ["R4", "R5"],
    actualResolution: "country",
    preferredResolution: "admin1",
    regionalizationPriority: "medium",
    visualPriority: "supporting",
    defaultIntegratedView: false,
    encodingRole: "base",
    spatialRationale:
      "국가 평균보다 주·성·도 단위의 시장·인프라 격차가 협력대상 선정에 더 유용",
    curatedReason:
      "국제협력 검토에 중요하나 기본 화면 과밀화를 막기 위해 카탈로그에서 필요 시 활성화",
  },
  {
    elementId: "A-021",
    cooperationDecisionRoles: ["R3", "R4", "R5"],
    actualResolution: "country",
    preferredResolution: "admin1",
    regionalizationPriority: "high",
    visualPriority: "core",
    defaultIntegratedView: false,
    encodingRole: "base",
    spatialRationale:
      "국가 평균보다 주·성·도 단위의 시장·인프라 격차가 협력대상 선정에 더 유용",
    curatedReason: "상세 검토 단계에서 필요할 때 선택하는 보조정보",
  },
  {
    elementId: "A-022",
    cooperationDecisionRoles: ["R3", "R4", "R5"],
    actualResolution: "non-spatial",
    preferredResolution: "admin1",
    regionalizationPriority: "medium",
    visualPriority: "supporting",
    defaultIntegratedView: false,
    encodingRole: "base",
    spatialRationale:
      "국가 평균보다 주·성·도 단위의 시장·인프라 격차가 협력대상 선정에 더 유용",
    curatedReason:
      "국제협력 검토에 중요하나 기본 화면 과밀화를 막기 위해 카탈로그에서 필요 시 활성화",
  },
  {
    elementId: "A-023",
    cooperationDecisionRoles: ["R4", "R5"],
    actualResolution: "non-spatial",
    preferredResolution: "facility",
    regionalizationPriority: "high",
    visualPriority: "supporting",
    defaultIntegratedView: false,
    encodingRole: "point",
    spatialRationale:
      "사업·시설·기관의 실제 위치가 확보될 경우 국가 평균보다 현장 단위 판단 가치가 큼",
    curatedReason:
      "국제협력 검토에 중요하나 기본 화면 과밀화를 막기 위해 카탈로그에서 필요 시 활성화",
  },
  {
    elementId: "A-024",
    cooperationDecisionRoles: ["R4", "R5"],
    actualResolution: "non-spatial",
    preferredResolution: "corridor",
    regionalizationPriority: "high",
    visualPriority: "supporting",
    defaultIntegratedView: false,
    encodingRole: "base",
    spatialRationale:
      "교역·송전·교통·협력은 지점보다 연결관계와 회랑 자체가 핵심",
    curatedReason:
      "국제협력 검토에 중요하나 기본 화면 과밀화를 막기 위해 카탈로그에서 필요 시 활성화",
  },
  {
    elementId: "A-025",
    cooperationDecisionRoles: ["R4", "R5"],
    actualResolution: "non-spatial",
    preferredResolution: "facility",
    regionalizationPriority: "high",
    visualPriority: "supporting",
    defaultIntegratedView: false,
    encodingRole: "point",
    spatialRationale:
      "사업·시설·기관의 실제 위치가 확보될 경우 국가 평균보다 현장 단위 판단 가치가 큼",
    curatedReason:
      "국제협력 검토에 중요하나 기본 화면 과밀화를 막기 위해 카탈로그에서 필요 시 활성화",
  },
  {
    elementId: "A-026",
    cooperationDecisionRoles: ["R4", "R5"],
    actualResolution: "non-spatial",
    preferredResolution: "admin2",
    regionalizationPriority: "high",
    visualPriority: "supporting",
    defaultIntegratedView: false,
    encodingRole: "base",
    spatialRationale:
      "도시·지구 수준 차이가 사업입지 검토에 직접 중요해 2차 행정구역을 우선",
    curatedReason:
      "국제협력 검토에 중요하나 기본 화면 과밀화를 막기 위해 카탈로그에서 필요 시 활성화",
  },
  {
    elementId: "A-027",
    cooperationDecisionRoles: ["R4", "R5"],
    actualResolution: "non-spatial",
    preferredResolution: "corridor",
    regionalizationPriority: "high",
    visualPriority: "supporting",
    defaultIntegratedView: false,
    encodingRole: "base",
    spatialRationale:
      "교역·송전·교통·협력은 지점보다 연결관계와 회랑 자체가 핵심",
    curatedReason:
      "국제협력 검토에 중요하나 기본 화면 과밀화를 막기 위해 카탈로그에서 필요 시 활성화",
  },
  {
    elementId: "A-028",
    cooperationDecisionRoles: ["R4", "R5"],
    actualResolution: "non-spatial",
    preferredResolution: "corridor",
    regionalizationPriority: "high",
    visualPriority: "supporting",
    defaultIntegratedView: false,
    encodingRole: "base",
    spatialRationale:
      "교역·송전·교통·협력은 지점보다 연결관계와 회랑 자체가 핵심",
    curatedReason:
      "국제협력 검토에 중요하나 기본 화면 과밀화를 막기 위해 카탈로그에서 필요 시 활성화",
  },
  {
    elementId: "A-029",
    cooperationDecisionRoles: ["R5", "R9"],
    actualResolution: "non-spatial",
    preferredResolution: "corridor",
    regionalizationPriority: "medium",
    visualPriority: "on-demand",
    defaultIntegratedView: false,
    encodingRole: "flow",
    spatialRationale:
      "교역·송전·교통·협력은 지점보다 연결관계와 회랑 자체가 핵심",
    curatedReason: "상세 검토 단계에서 필요할 때 선택하는 보조정보",
  },
  {
    elementId: "A-030",
    cooperationDecisionRoles: ["R5", "R9"],
    actualResolution: "non-spatial",
    preferredResolution: "corridor",
    regionalizationPriority: "medium",
    visualPriority: "on-demand",
    defaultIntegratedView: false,
    encodingRole: "flow",
    spatialRationale:
      "교역·송전·교통·협력은 지점보다 연결관계와 회랑 자체가 핵심",
    curatedReason: "상세 검토 단계에서 필요할 때 선택하는 보조정보",
  },
  {
    elementId: "A-031",
    cooperationDecisionRoles: ["R5"],
    actualResolution: "non-spatial",
    preferredResolution: "country",
    regionalizationPriority: "low",
    visualPriority: "on-demand",
    defaultIntegratedView: false,
    encodingRole: "base",
    spatialRationale:
      "정책·제도·국가집계 성격이 강해 국가 단위가 원자료 의미를 가장 잘 보존",
    curatedReason: "상세 검토 단계에서 필요할 때 선택하는 보조정보",
  },
  {
    elementId: "A-032",
    cooperationDecisionRoles: ["R5", "R9"],
    actualResolution: "non-spatial",
    preferredResolution: "corridor",
    regionalizationPriority: "medium",
    visualPriority: "on-demand",
    defaultIntegratedView: false,
    encodingRole: "flow",
    spatialRationale:
      "교역·송전·교통·협력은 지점보다 연결관계와 회랑 자체가 핵심",
    curatedReason: "상세 검토 단계에서 필요할 때 선택하는 보조정보",
  },
  {
    elementId: "A-033",
    cooperationDecisionRoles: ["R5"],
    actualResolution: "non-spatial",
    preferredResolution: "country",
    regionalizationPriority: "low",
    visualPriority: "on-demand",
    defaultIntegratedView: false,
    encodingRole: "base",
    spatialRationale:
      "정책·제도·국가집계 성격이 강해 국가 단위가 원자료 의미를 가장 잘 보존",
    curatedReason: "상세 검토 단계에서 필요할 때 선택하는 보조정보",
  },
  {
    elementId: "B-001",
    cooperationDecisionRoles: ["R3", "R4"],
    actualResolution: "non-spatial",
    preferredResolution: "grid",
    regionalizationPriority: "high",
    visualPriority: "supporting",
    defaultIntegratedView: false,
    encodingRole: "base",
    spatialRationale:
      "기후·자원·환경 변수는 행정경계보다 격자·표면자료가 실제 공간분포를 더 잘 보존",
    curatedReason:
      "국제협력 검토에 중요하나 기본 화면 과밀화를 막기 위해 카탈로그에서 필요 시 활성화",
  },
  {
    elementId: "B-002",
    cooperationDecisionRoles: ["R3", "R4"],
    actualResolution: "non-spatial",
    preferredResolution: "grid",
    regionalizationPriority: "high",
    visualPriority: "supporting",
    defaultIntegratedView: false,
    encodingRole: "base",
    spatialRationale:
      "기후·자원·환경 변수는 행정경계보다 격자·표면자료가 실제 공간분포를 더 잘 보존",
    curatedReason:
      "국제협력 검토에 중요하나 기본 화면 과밀화를 막기 위해 카탈로그에서 필요 시 활성화",
  },
  {
    elementId: "B-003",
    cooperationDecisionRoles: ["R3", "R4"],
    actualResolution: "non-spatial",
    preferredResolution: "grid",
    regionalizationPriority: "high",
    visualPriority: "supporting",
    defaultIntegratedView: false,
    encodingRole: "base",
    spatialRationale:
      "기후·자원·환경 변수는 행정경계보다 격자·표면자료가 실제 공간분포를 더 잘 보존",
    curatedReason:
      "국제협력 검토에 중요하나 기본 화면 과밀화를 막기 위해 카탈로그에서 필요 시 활성화",
  },
  {
    elementId: "B-004",
    cooperationDecisionRoles: ["R3", "R4"],
    actualResolution: "non-spatial",
    preferredResolution: "grid",
    regionalizationPriority: "high",
    visualPriority: "supporting",
    defaultIntegratedView: false,
    encodingRole: "base",
    spatialRationale:
      "기후·자원·환경 변수는 행정경계보다 격자·표면자료가 실제 공간분포를 더 잘 보존",
    curatedReason:
      "국제협력 검토에 중요하나 기본 화면 과밀화를 막기 위해 카탈로그에서 필요 시 활성화",
  },
  {
    elementId: "B-005",
    cooperationDecisionRoles: ["R3"],
    actualResolution: "non-spatial",
    preferredResolution: "grid",
    regionalizationPriority: "high",
    visualPriority: "supporting",
    defaultIntegratedView: false,
    encodingRole: "base",
    spatialRationale:
      "기후·자원·환경 변수는 행정경계보다 격자·표면자료가 실제 공간분포를 더 잘 보존",
    curatedReason:
      "국제협력 검토에 중요하나 기본 화면 과밀화를 막기 위해 카탈로그에서 필요 시 활성화",
  },
  {
    elementId: "B-006",
    cooperationDecisionRoles: ["R3"],
    actualResolution: "country",
    preferredResolution: "grid",
    regionalizationPriority: "high",
    visualPriority: "core",
    defaultIntegratedView: true,
    encodingRole: "base",
    spatialRationale:
      "기후·자원·환경 변수는 행정경계보다 격자·표면자료가 실제 공간분포를 더 잘 보존",
    curatedReason:
      "핵심 통합뷰에서 사업기획 질문을 직접 설명하는 정보축으로 사용",
  },
  {
    elementId: "B-007",
    cooperationDecisionRoles: ["R3"],
    actualResolution: "non-spatial",
    preferredResolution: "grid",
    regionalizationPriority: "high",
    visualPriority: "supporting",
    defaultIntegratedView: false,
    encodingRole: "base",
    spatialRationale:
      "기후·자원·환경 변수는 행정경계보다 격자·표면자료가 실제 공간분포를 더 잘 보존",
    curatedReason:
      "국제협력 검토에 중요하나 기본 화면 과밀화를 막기 위해 카탈로그에서 필요 시 활성화",
  },
  {
    elementId: "B-008",
    cooperationDecisionRoles: ["R3"],
    actualResolution: "non-spatial",
    preferredResolution: "grid",
    regionalizationPriority: "high",
    visualPriority: "supporting",
    defaultIntegratedView: false,
    encodingRole: "base",
    spatialRationale:
      "기후·자원·환경 변수는 행정경계보다 격자·표면자료가 실제 공간분포를 더 잘 보존",
    curatedReason:
      "국제협력 검토에 중요하나 기본 화면 과밀화를 막기 위해 카탈로그에서 필요 시 활성화",
  },
  {
    elementId: "B-009",
    cooperationDecisionRoles: ["R3"],
    actualResolution: "non-spatial",
    preferredResolution: "grid",
    regionalizationPriority: "high",
    visualPriority: "supporting",
    defaultIntegratedView: false,
    encodingRole: "base",
    spatialRationale:
      "기후·자원·환경 변수는 행정경계보다 격자·표면자료가 실제 공간분포를 더 잘 보존",
    curatedReason:
      "국제협력 검토에 중요하나 기본 화면 과밀화를 막기 위해 카탈로그에서 필요 시 활성화",
  },
  {
    elementId: "B-010",
    cooperationDecisionRoles: ["R3"],
    actualResolution: "non-spatial",
    preferredResolution: "grid",
    regionalizationPriority: "high",
    visualPriority: "supporting",
    defaultIntegratedView: false,
    encodingRole: "base",
    spatialRationale:
      "기후·자원·환경 변수는 행정경계보다 격자·표면자료가 실제 공간분포를 더 잘 보존",
    curatedReason:
      "국제협력 검토에 중요하나 기본 화면 과밀화를 막기 위해 카탈로그에서 필요 시 활성화",
  },
  {
    elementId: "B-011",
    cooperationDecisionRoles: ["R3"],
    actualResolution: "non-spatial",
    preferredResolution: "grid",
    regionalizationPriority: "high",
    visualPriority: "core",
    defaultIntegratedView: false,
    encodingRole: "base",
    spatialRationale:
      "기후·자원·환경 변수는 행정경계보다 격자·표면자료가 실제 공간분포를 더 잘 보존",
    curatedReason: "상세 검토 단계에서 필요할 때 선택하는 보조정보",
  },
  {
    elementId: "B-012",
    cooperationDecisionRoles: ["R3"],
    actualResolution: "non-spatial",
    preferredResolution: "grid",
    regionalizationPriority: "high",
    visualPriority: "supporting",
    defaultIntegratedView: false,
    encodingRole: "base",
    spatialRationale:
      "기후·자원·환경 변수는 행정경계보다 격자·표면자료가 실제 공간분포를 더 잘 보존",
    curatedReason:
      "국제협력 검토에 중요하나 기본 화면 과밀화를 막기 위해 카탈로그에서 필요 시 활성화",
  },
  {
    elementId: "B-013",
    cooperationDecisionRoles: ["R3"],
    actualResolution: "non-spatial",
    preferredResolution: "grid",
    regionalizationPriority: "high",
    visualPriority: "supporting",
    defaultIntegratedView: false,
    encodingRole: "base",
    spatialRationale:
      "기후·자원·환경 변수는 행정경계보다 격자·표면자료가 실제 공간분포를 더 잘 보존",
    curatedReason:
      "국제협력 검토에 중요하나 기본 화면 과밀화를 막기 위해 카탈로그에서 필요 시 활성화",
  },
  {
    elementId: "B-014",
    cooperationDecisionRoles: ["R3"],
    actualResolution: "non-spatial",
    preferredResolution: "country",
    regionalizationPriority: "low",
    visualPriority: "supporting",
    defaultIntegratedView: false,
    encodingRole: "panel",
    spatialRationale:
      "정책·제도·국가집계 성격이 강해 국가 단위가 원자료 의미를 가장 잘 보존",
    curatedReason:
      "국제협력 검토에 중요하나 기본 화면 과밀화를 막기 위해 카탈로그에서 필요 시 활성화",
  },
  {
    elementId: "B-015",
    cooperationDecisionRoles: ["R3"],
    actualResolution: "non-spatial",
    preferredResolution: "grid",
    regionalizationPriority: "high",
    visualPriority: "supporting",
    defaultIntegratedView: false,
    encodingRole: "base",
    spatialRationale:
      "기후·자원·환경 변수는 행정경계보다 격자·표면자료가 실제 공간분포를 더 잘 보존",
    curatedReason:
      "국제협력 검토에 중요하나 기본 화면 과밀화를 막기 위해 카탈로그에서 필요 시 활성화",
  },
  {
    elementId: "B-016",
    cooperationDecisionRoles: ["R3"],
    actualResolution: "non-spatial",
    preferredResolution: "grid",
    regionalizationPriority: "high",
    visualPriority: "supporting",
    defaultIntegratedView: false,
    encodingRole: "base",
    spatialRationale:
      "기후·자원·환경 변수는 행정경계보다 격자·표면자료가 실제 공간분포를 더 잘 보존",
    curatedReason:
      "국제협력 검토에 중요하나 기본 화면 과밀화를 막기 위해 카탈로그에서 필요 시 활성화",
  },
  {
    elementId: "B-017",
    cooperationDecisionRoles: ["R3"],
    actualResolution: "non-spatial",
    preferredResolution: "grid",
    regionalizationPriority: "high",
    visualPriority: "core",
    defaultIntegratedView: false,
    encodingRole: "base",
    spatialRationale:
      "기후·자원·환경 변수는 행정경계보다 격자·표면자료가 실제 공간분포를 더 잘 보존",
    curatedReason: "상세 검토 단계에서 필요할 때 선택하는 보조정보",
  },
  {
    elementId: "B-018",
    cooperationDecisionRoles: ["R2", "R3", "R5"],
    actualResolution: "non-spatial",
    preferredResolution: "grid",
    regionalizationPriority: "high",
    visualPriority: "supporting",
    defaultIntegratedView: false,
    encodingRole: "base",
    spatialRationale:
      "기후·자원·환경 변수는 행정경계보다 격자·표면자료가 실제 공간분포를 더 잘 보존",
    curatedReason:
      "국제협력 검토에 중요하나 기본 화면 과밀화를 막기 위해 카탈로그에서 필요 시 활성화",
  },
  {
    elementId: "B-019",
    cooperationDecisionRoles: ["R3", "R5"],
    actualResolution: "non-spatial",
    preferredResolution: "grid",
    regionalizationPriority: "high",
    visualPriority: "supporting",
    defaultIntegratedView: false,
    encodingRole: "base",
    spatialRationale:
      "기후·자원·환경 변수는 행정경계보다 격자·표면자료가 실제 공간분포를 더 잘 보존",
    curatedReason:
      "국제협력 검토에 중요하나 기본 화면 과밀화를 막기 위해 카탈로그에서 필요 시 활성화",
  },
  {
    elementId: "B-020",
    cooperationDecisionRoles: ["R3", "R5"],
    actualResolution: "non-spatial",
    preferredResolution: "grid",
    regionalizationPriority: "high",
    visualPriority: "supporting",
    defaultIntegratedView: false,
    encodingRole: "base",
    spatialRationale:
      "기후·자원·환경 변수는 행정경계보다 격자·표면자료가 실제 공간분포를 더 잘 보존",
    curatedReason:
      "국제협력 검토에 중요하나 기본 화면 과밀화를 막기 위해 카탈로그에서 필요 시 활성화",
  },
  {
    elementId: "B-021",
    cooperationDecisionRoles: ["R3", "R5"],
    actualResolution: "non-spatial",
    preferredResolution: "grid",
    regionalizationPriority: "high",
    visualPriority: "supporting",
    defaultIntegratedView: false,
    encodingRole: "base",
    spatialRationale:
      "기후·자원·환경 변수는 행정경계보다 격자·표면자료가 실제 공간분포를 더 잘 보존",
    curatedReason:
      "국제협력 검토에 중요하나 기본 화면 과밀화를 막기 위해 카탈로그에서 필요 시 활성화",
  },
  {
    elementId: "B-022",
    cooperationDecisionRoles: ["R3", "R5"],
    actualResolution: "non-spatial",
    preferredResolution: "grid",
    regionalizationPriority: "high",
    visualPriority: "supporting",
    defaultIntegratedView: false,
    encodingRole: "base",
    spatialRationale:
      "기후·자원·환경 변수는 행정경계보다 격자·표면자료가 실제 공간분포를 더 잘 보존",
    curatedReason:
      "국제협력 검토에 중요하나 기본 화면 과밀화를 막기 위해 카탈로그에서 필요 시 활성화",
  },
  {
    elementId: "B-023",
    cooperationDecisionRoles: ["R4"],
    actualResolution: "non-spatial",
    preferredResolution: "grid",
    regionalizationPriority: "high",
    visualPriority: "supporting",
    defaultIntegratedView: false,
    encodingRole: "base",
    spatialRationale:
      "기후·자원·환경 변수는 행정경계보다 격자·표면자료가 실제 공간분포를 더 잘 보존",
    curatedReason:
      "국제협력 검토에 중요하나 기본 화면 과밀화를 막기 위해 카탈로그에서 필요 시 활성화",
  },
  {
    elementId: "B-024",
    cooperationDecisionRoles: ["R4"],
    actualResolution: "non-spatial",
    preferredResolution: "grid",
    regionalizationPriority: "high",
    visualPriority: "supporting",
    defaultIntegratedView: false,
    encodingRole: "base",
    spatialRationale:
      "기후·자원·환경 변수는 행정경계보다 격자·표면자료가 실제 공간분포를 더 잘 보존",
    curatedReason:
      "국제협력 검토에 중요하나 기본 화면 과밀화를 막기 위해 카탈로그에서 필요 시 활성화",
  },
  {
    elementId: "B-025",
    cooperationDecisionRoles: ["R4"],
    actualResolution: "non-spatial",
    preferredResolution: "grid",
    regionalizationPriority: "high",
    visualPriority: "supporting",
    defaultIntegratedView: false,
    encodingRole: "base",
    spatialRationale:
      "기후·자원·환경 변수는 행정경계보다 격자·표면자료가 실제 공간분포를 더 잘 보존",
    curatedReason:
      "국제협력 검토에 중요하나 기본 화면 과밀화를 막기 위해 카탈로그에서 필요 시 활성화",
  },
  {
    elementId: "B-026",
    cooperationDecisionRoles: ["R4"],
    actualResolution: "non-spatial",
    preferredResolution: "corridor",
    regionalizationPriority: "high",
    visualPriority: "supporting",
    defaultIntegratedView: false,
    encodingRole: "base",
    spatialRationale:
      "교역·송전·교통·협력은 지점보다 연결관계와 회랑 자체가 핵심",
    curatedReason:
      "국제협력 검토에 중요하나 기본 화면 과밀화를 막기 위해 카탈로그에서 필요 시 활성화",
  },
  {
    elementId: "B-027",
    cooperationDecisionRoles: ["R4"],
    actualResolution: "non-spatial",
    preferredResolution: "grid",
    regionalizationPriority: "high",
    visualPriority: "supporting",
    defaultIntegratedView: false,
    encodingRole: "base",
    spatialRationale:
      "기후·자원·환경 변수는 행정경계보다 격자·표면자료가 실제 공간분포를 더 잘 보존",
    curatedReason:
      "국제협력 검토에 중요하나 기본 화면 과밀화를 막기 위해 카탈로그에서 필요 시 활성화",
  },
  {
    elementId: "B-028",
    cooperationDecisionRoles: ["R4"],
    actualResolution: "non-spatial",
    preferredResolution: "corridor",
    regionalizationPriority: "high",
    visualPriority: "supporting",
    defaultIntegratedView: false,
    encodingRole: "base",
    spatialRationale:
      "교역·송전·교통·협력은 지점보다 연결관계와 회랑 자체가 핵심",
    curatedReason:
      "국제협력 검토에 중요하나 기본 화면 과밀화를 막기 위해 카탈로그에서 필요 시 활성화",
  },
  {
    elementId: "B-029",
    cooperationDecisionRoles: ["R4"],
    actualResolution: "non-spatial",
    preferredResolution: "grid",
    regionalizationPriority: "high",
    visualPriority: "supporting",
    defaultIntegratedView: false,
    encodingRole: "base",
    spatialRationale:
      "기후·자원·환경 변수는 행정경계보다 격자·표면자료가 실제 공간분포를 더 잘 보존",
    curatedReason:
      "국제협력 검토에 중요하나 기본 화면 과밀화를 막기 위해 카탈로그에서 필요 시 활성화",
  },
  {
    elementId: "B-030",
    cooperationDecisionRoles: ["R4"],
    actualResolution: "non-spatial",
    preferredResolution: "grid",
    regionalizationPriority: "high",
    visualPriority: "supporting",
    defaultIntegratedView: false,
    encodingRole: "base",
    spatialRationale:
      "기후·자원·환경 변수는 행정경계보다 격자·표면자료가 실제 공간분포를 더 잘 보존",
    curatedReason:
      "국제협력 검토에 중요하나 기본 화면 과밀화를 막기 위해 카탈로그에서 필요 시 활성화",
  },
  {
    elementId: "B-031",
    cooperationDecisionRoles: ["R4"],
    actualResolution: "non-spatial",
    preferredResolution: "grid",
    regionalizationPriority: "high",
    visualPriority: "supporting",
    defaultIntegratedView: false,
    encodingRole: "base",
    spatialRationale:
      "기후·자원·환경 변수는 행정경계보다 격자·표면자료가 실제 공간분포를 더 잘 보존",
    curatedReason:
      "국제협력 검토에 중요하나 기본 화면 과밀화를 막기 위해 카탈로그에서 필요 시 활성화",
  },
  {
    elementId: "B-032",
    cooperationDecisionRoles: ["R4"],
    actualResolution: "non-spatial",
    preferredResolution: "grid",
    regionalizationPriority: "high",
    visualPriority: "supporting",
    defaultIntegratedView: false,
    encodingRole: "base",
    spatialRationale:
      "기후·자원·환경 변수는 행정경계보다 격자·표면자료가 실제 공간분포를 더 잘 보존",
    curatedReason:
      "국제협력 검토에 중요하나 기본 화면 과밀화를 막기 위해 카탈로그에서 필요 시 활성화",
  },
  {
    elementId: "B-033",
    cooperationDecisionRoles: ["R3", "R4"],
    actualResolution: "non-spatial",
    preferredResolution: "grid",
    regionalizationPriority: "high",
    visualPriority: "supporting",
    defaultIntegratedView: false,
    encodingRole: "base",
    spatialRationale:
      "기후·자원·환경 변수는 행정경계보다 격자·표면자료가 실제 공간분포를 더 잘 보존",
    curatedReason:
      "국제협력 검토에 중요하나 기본 화면 과밀화를 막기 위해 카탈로그에서 필요 시 활성화",
  },
  {
    elementId: "B-034",
    cooperationDecisionRoles: ["R4"],
    actualResolution: "non-spatial",
    preferredResolution: "grid",
    regionalizationPriority: "high",
    visualPriority: "supporting",
    defaultIntegratedView: false,
    encodingRole: "base",
    spatialRationale:
      "기후·자원·환경 변수는 행정경계보다 격자·표면자료가 실제 공간분포를 더 잘 보존",
    curatedReason:
      "국제협력 검토에 중요하나 기본 화면 과밀화를 막기 위해 카탈로그에서 필요 시 활성화",
  },
  {
    elementId: "B-035",
    cooperationDecisionRoles: ["R4"],
    actualResolution: "non-spatial",
    preferredResolution: "grid",
    regionalizationPriority: "high",
    visualPriority: "supporting",
    defaultIntegratedView: false,
    encodingRole: "base",
    spatialRationale:
      "기후·자원·환경 변수는 행정경계보다 격자·표면자료가 실제 공간분포를 더 잘 보존",
    curatedReason:
      "국제협력 검토에 중요하나 기본 화면 과밀화를 막기 위해 카탈로그에서 필요 시 활성화",
  },
  {
    elementId: "B-036",
    cooperationDecisionRoles: ["R4"],
    actualResolution: "non-spatial",
    preferredResolution: "grid",
    regionalizationPriority: "high",
    visualPriority: "supporting",
    defaultIntegratedView: false,
    encodingRole: "base",
    spatialRationale:
      "기후·자원·환경 변수는 행정경계보다 격자·표면자료가 실제 공간분포를 더 잘 보존",
    curatedReason:
      "국제협력 검토에 중요하나 기본 화면 과밀화를 막기 위해 카탈로그에서 필요 시 활성화",
  },
  {
    elementId: "B-037",
    cooperationDecisionRoles: ["R4"],
    actualResolution: "non-spatial",
    preferredResolution: "grid",
    regionalizationPriority: "high",
    visualPriority: "supporting",
    defaultIntegratedView: false,
    encodingRole: "base",
    spatialRationale:
      "기후·자원·환경 변수는 행정경계보다 격자·표면자료가 실제 공간분포를 더 잘 보존",
    curatedReason:
      "국제협력 검토에 중요하나 기본 화면 과밀화를 막기 위해 카탈로그에서 필요 시 활성화",
  },
  {
    elementId: "B-038",
    cooperationDecisionRoles: ["R4"],
    actualResolution: "non-spatial",
    preferredResolution: "grid",
    regionalizationPriority: "high",
    visualPriority: "supporting",
    defaultIntegratedView: false,
    encodingRole: "base",
    spatialRationale:
      "기후·자원·환경 변수는 행정경계보다 격자·표면자료가 실제 공간분포를 더 잘 보존",
    curatedReason:
      "국제협력 검토에 중요하나 기본 화면 과밀화를 막기 위해 카탈로그에서 필요 시 활성화",
  },
  {
    elementId: "B-039",
    cooperationDecisionRoles: ["R4"],
    actualResolution: "non-spatial",
    preferredResolution: "grid",
    regionalizationPriority: "high",
    visualPriority: "supporting",
    defaultIntegratedView: false,
    encodingRole: "base",
    spatialRationale:
      "기후·자원·환경 변수는 행정경계보다 격자·표면자료가 실제 공간분포를 더 잘 보존",
    curatedReason:
      "국제협력 검토에 중요하나 기본 화면 과밀화를 막기 위해 카탈로그에서 필요 시 활성화",
  },
  {
    elementId: "B-040",
    cooperationDecisionRoles: ["R4"],
    actualResolution: "non-spatial",
    preferredResolution: "grid",
    regionalizationPriority: "high",
    visualPriority: "supporting",
    defaultIntegratedView: false,
    encodingRole: "base",
    spatialRationale:
      "기후·자원·환경 변수는 행정경계보다 격자·표면자료가 실제 공간분포를 더 잘 보존",
    curatedReason:
      "국제협력 검토에 중요하나 기본 화면 과밀화를 막기 위해 카탈로그에서 필요 시 활성화",
  },
  {
    elementId: "B-041",
    cooperationDecisionRoles: ["R4"],
    actualResolution: "country",
    preferredResolution: "grid",
    regionalizationPriority: "high",
    visualPriority: "core",
    defaultIntegratedView: false,
    encodingRole: "base",
    spatialRationale:
      "기후·자원·환경 변수는 행정경계보다 격자·표면자료가 실제 공간분포를 더 잘 보존",
    curatedReason: "상세 검토 단계에서 필요할 때 선택하는 보조정보",
  },
  {
    elementId: "B-042",
    cooperationDecisionRoles: ["R4"],
    actualResolution: "non-spatial",
    preferredResolution: "grid",
    regionalizationPriority: "high",
    visualPriority: "supporting",
    defaultIntegratedView: false,
    encodingRole: "base",
    spatialRationale:
      "기후·자원·환경 변수는 행정경계보다 격자·표면자료가 실제 공간분포를 더 잘 보존",
    curatedReason:
      "국제협력 검토에 중요하나 기본 화면 과밀화를 막기 위해 카탈로그에서 필요 시 활성화",
  },
  {
    elementId: "B-043",
    cooperationDecisionRoles: ["R4"],
    actualResolution: "non-spatial",
    preferredResolution: "grid",
    regionalizationPriority: "high",
    visualPriority: "supporting",
    defaultIntegratedView: false,
    encodingRole: "base",
    spatialRationale:
      "기후·자원·환경 변수는 행정경계보다 격자·표면자료가 실제 공간분포를 더 잘 보존",
    curatedReason:
      "국제협력 검토에 중요하나 기본 화면 과밀화를 막기 위해 카탈로그에서 필요 시 활성화",
  },
  {
    elementId: "B-044",
    cooperationDecisionRoles: ["R4"],
    actualResolution: "non-spatial",
    preferredResolution: "grid",
    regionalizationPriority: "high",
    visualPriority: "supporting",
    defaultIntegratedView: false,
    encodingRole: "base",
    spatialRationale:
      "기후·자원·환경 변수는 행정경계보다 격자·표면자료가 실제 공간분포를 더 잘 보존",
    curatedReason:
      "국제협력 검토에 중요하나 기본 화면 과밀화를 막기 위해 카탈로그에서 필요 시 활성화",
  },
  {
    elementId: "B-045",
    cooperationDecisionRoles: ["R4"],
    actualResolution: "non-spatial",
    preferredResolution: "grid",
    regionalizationPriority: "high",
    visualPriority: "supporting",
    defaultIntegratedView: false,
    encodingRole: "base",
    spatialRationale:
      "기후·자원·환경 변수는 행정경계보다 격자·표면자료가 실제 공간분포를 더 잘 보존",
    curatedReason:
      "국제협력 검토에 중요하나 기본 화면 과밀화를 막기 위해 카탈로그에서 필요 시 활성화",
  },
  {
    elementId: "B-046",
    cooperationDecisionRoles: ["R4"],
    actualResolution: "non-spatial",
    preferredResolution: "grid",
    regionalizationPriority: "high",
    visualPriority: "supporting",
    defaultIntegratedView: false,
    encodingRole: "base",
    spatialRationale:
      "기후·자원·환경 변수는 행정경계보다 격자·표면자료가 실제 공간분포를 더 잘 보존",
    curatedReason:
      "국제협력 검토에 중요하나 기본 화면 과밀화를 막기 위해 카탈로그에서 필요 시 활성화",
  },
  {
    elementId: "B-047",
    cooperationDecisionRoles: ["R4"],
    actualResolution: "non-spatial",
    preferredResolution: "grid",
    regionalizationPriority: "high",
    visualPriority: "supporting",
    defaultIntegratedView: false,
    encodingRole: "base",
    spatialRationale:
      "기후·자원·환경 변수는 행정경계보다 격자·표면자료가 실제 공간분포를 더 잘 보존",
    curatedReason:
      "국제협력 검토에 중요하나 기본 화면 과밀화를 막기 위해 카탈로그에서 필요 시 활성화",
  },
  {
    elementId: "B-048",
    cooperationDecisionRoles: ["R4"],
    actualResolution: "non-spatial",
    preferredResolution: "facility",
    regionalizationPriority: "high",
    visualPriority: "supporting",
    defaultIntegratedView: false,
    encodingRole: "point",
    spatialRationale:
      "사업·시설·기관의 실제 위치가 확보될 경우 국가 평균보다 현장 단위 판단 가치가 큼",
    curatedReason:
      "국제협력 검토에 중요하나 기본 화면 과밀화를 막기 위해 카탈로그에서 필요 시 활성화",
  },
  {
    elementId: "C-001",
    cooperationDecisionRoles: ["R2"],
    actualResolution: "country",
    preferredResolution: "country",
    regionalizationPriority: "low",
    visualPriority: "core",
    defaultIntegratedView: false,
    encodingRole: "panel",
    spatialRationale:
      "정책·제도·국가집계 성격이 강해 국가 단위가 원자료 의미를 가장 잘 보존",
    curatedReason: "상세 검토 단계에서 필요할 때 선택하는 보조정보",
  },
  {
    elementId: "C-002",
    cooperationDecisionRoles: ["R2"],
    actualResolution: "country",
    preferredResolution: "country",
    regionalizationPriority: "low",
    visualPriority: "on-demand",
    defaultIntegratedView: false,
    encodingRole: "panel",
    spatialRationale:
      "정책·제도·국가집계 성격이 강해 국가 단위가 원자료 의미를 가장 잘 보존",
    curatedReason: "상세 검토 단계에서 필요할 때 선택하는 보조정보",
  },
  {
    elementId: "C-003",
    cooperationDecisionRoles: ["R2"],
    actualResolution: "country",
    preferredResolution: "country",
    regionalizationPriority: "low",
    visualPriority: "core",
    defaultIntegratedView: false,
    encodingRole: "panel",
    spatialRationale:
      "정책·제도·국가집계 성격이 강해 국가 단위가 원자료 의미를 가장 잘 보존",
    curatedReason: "상세 검토 단계에서 필요할 때 선택하는 보조정보",
  },
  {
    elementId: "C-004",
    cooperationDecisionRoles: ["R2"],
    actualResolution: "country",
    preferredResolution: "country",
    regionalizationPriority: "low",
    visualPriority: "on-demand",
    defaultIntegratedView: false,
    encodingRole: "panel",
    spatialRationale:
      "정책·제도·국가집계 성격이 강해 국가 단위가 원자료 의미를 가장 잘 보존",
    curatedReason: "상세 검토 단계에서 필요할 때 선택하는 보조정보",
  },
  {
    elementId: "C-005",
    cooperationDecisionRoles: ["R1", "R2"],
    actualResolution: "country",
    preferredResolution: "country",
    regionalizationPriority: "low",
    visualPriority: "core",
    defaultIntegratedView: true,
    encodingRole: "bubble",
    spatialRationale:
      "정책·제도·국가집계 성격이 강해 국가 단위가 원자료 의미를 가장 잘 보존",
    curatedReason:
      "핵심 통합뷰에서 사업기획 질문을 직접 설명하는 정보축으로 사용",
  },
  {
    elementId: "C-006",
    cooperationDecisionRoles: ["R2"],
    actualResolution: "non-spatial",
    preferredResolution: "corridor",
    regionalizationPriority: "medium",
    visualPriority: "on-demand",
    defaultIntegratedView: false,
    encodingRole: "flow",
    spatialRationale:
      "교역·송전·교통·협력은 지점보다 연결관계와 회랑 자체가 핵심",
    curatedReason: "상세 검토 단계에서 필요할 때 선택하는 보조정보",
  },
  {
    elementId: "C-007",
    cooperationDecisionRoles: ["R2", "R6"],
    actualResolution: "non-spatial",
    preferredResolution: "country",
    regionalizationPriority: "low",
    visualPriority: "supporting",
    defaultIntegratedView: false,
    encodingRole: "symbol",
    spatialRationale:
      "정책·제도·국가집계 성격이 강해 국가 단위가 원자료 의미를 가장 잘 보존",
    curatedReason:
      "국제협력 검토에 중요하나 기본 화면 과밀화를 막기 위해 카탈로그에서 필요 시 활성화",
  },
  {
    elementId: "C-008",
    cooperationDecisionRoles: ["R2", "R6"],
    actualResolution: "non-spatial",
    preferredResolution: "country",
    regionalizationPriority: "low",
    visualPriority: "supporting",
    defaultIntegratedView: false,
    encodingRole: "symbol",
    spatialRationale:
      "정책·제도·국가집계 성격이 강해 국가 단위가 원자료 의미를 가장 잘 보존",
    curatedReason:
      "국제협력 검토에 중요하나 기본 화면 과밀화를 막기 위해 카탈로그에서 필요 시 활성화",
  },
  {
    elementId: "C-009",
    cooperationDecisionRoles: ["R2"],
    actualResolution: "non-spatial",
    preferredResolution: "country",
    regionalizationPriority: "low",
    visualPriority: "on-demand",
    defaultIntegratedView: false,
    encodingRole: "symbol",
    spatialRationale:
      "정책·제도·국가집계 성격이 강해 국가 단위가 원자료 의미를 가장 잘 보존",
    curatedReason: "상세 검토 단계에서 필요할 때 선택하는 보조정보",
  },
  {
    elementId: "C-010",
    cooperationDecisionRoles: ["R2"],
    actualResolution: "non-spatial",
    preferredResolution: "country",
    regionalizationPriority: "low",
    visualPriority: "on-demand",
    defaultIntegratedView: false,
    encodingRole: "symbol",
    spatialRationale:
      "정책·제도·국가집계 성격이 강해 국가 단위가 원자료 의미를 가장 잘 보존",
    curatedReason: "상세 검토 단계에서 필요할 때 선택하는 보조정보",
  },
  {
    elementId: "C-011",
    cooperationDecisionRoles: ["R2", "R3", "R5"],
    actualResolution: "non-spatial",
    preferredResolution: "country",
    regionalizationPriority: "low",
    visualPriority: "supporting",
    defaultIntegratedView: false,
    encodingRole: "base",
    spatialRationale:
      "정책·제도·국가집계 성격이 강해 국가 단위가 원자료 의미를 가장 잘 보존",
    curatedReason:
      "국제협력 검토에 중요하나 기본 화면 과밀화를 막기 위해 카탈로그에서 필요 시 활성화",
  },
  {
    elementId: "C-012",
    cooperationDecisionRoles: ["R2", "R5"],
    actualResolution: "non-spatial",
    preferredResolution: "country",
    regionalizationPriority: "low",
    visualPriority: "on-demand",
    defaultIntegratedView: false,
    encodingRole: "base",
    spatialRationale:
      "정책·제도·국가집계 성격이 강해 국가 단위가 원자료 의미를 가장 잘 보존",
    curatedReason: "상세 검토 단계에서 필요할 때 선택하는 보조정보",
  },
  {
    elementId: "C-013",
    cooperationDecisionRoles: ["R2", "R5"],
    actualResolution: "non-spatial",
    preferredResolution: "country",
    regionalizationPriority: "low",
    visualPriority: "on-demand",
    defaultIntegratedView: false,
    encodingRole: "base",
    spatialRationale:
      "정책·제도·국가집계 성격이 강해 국가 단위가 원자료 의미를 가장 잘 보존",
    curatedReason: "상세 검토 단계에서 필요할 때 선택하는 보조정보",
  },
  {
    elementId: "C-014",
    cooperationDecisionRoles: ["R2"],
    actualResolution: "non-spatial",
    preferredResolution: "country",
    regionalizationPriority: "low",
    visualPriority: "on-demand",
    defaultIntegratedView: false,
    encodingRole: "panel",
    spatialRationale:
      "정책·제도·국가집계 성격이 강해 국가 단위가 원자료 의미를 가장 잘 보존",
    curatedReason: "상세 검토 단계에서 필요할 때 선택하는 보조정보",
  },
  {
    elementId: "C-015",
    cooperationDecisionRoles: ["R2"],
    actualResolution: "non-spatial",
    preferredResolution: "country",
    regionalizationPriority: "low",
    visualPriority: "on-demand",
    defaultIntegratedView: false,
    encodingRole: "panel",
    spatialRationale:
      "정책·제도·국가집계 성격이 강해 국가 단위가 원자료 의미를 가장 잘 보존",
    curatedReason: "상세 검토 단계에서 필요할 때 선택하는 보조정보",
  },
  {
    elementId: "C-016",
    cooperationDecisionRoles: ["R1", "R2", "R8"],
    actualResolution: "non-spatial",
    preferredResolution: "country",
    regionalizationPriority: "low",
    visualPriority: "supporting",
    defaultIntegratedView: false,
    encodingRole: "symbol",
    spatialRationale:
      "정책·제도·국가집계 성격이 강해 국가 단위가 원자료 의미를 가장 잘 보존",
    curatedReason:
      "국제협력 검토에 중요하나 기본 화면 과밀화를 막기 위해 카탈로그에서 필요 시 활성화",
  },
  {
    elementId: "C-017",
    cooperationDecisionRoles: ["R2"],
    actualResolution: "non-spatial",
    preferredResolution: "country",
    regionalizationPriority: "low",
    visualPriority: "on-demand",
    defaultIntegratedView: false,
    encodingRole: "panel",
    spatialRationale:
      "정책·제도·국가집계 성격이 강해 국가 단위가 원자료 의미를 가장 잘 보존",
    curatedReason: "상세 검토 단계에서 필요할 때 선택하는 보조정보",
  },
  {
    elementId: "C-018",
    cooperationDecisionRoles: ["R1", "R2", "R4"],
    actualResolution: "non-spatial",
    preferredResolution: "admin1",
    regionalizationPriority: "medium",
    visualPriority: "supporting",
    defaultIntegratedView: false,
    encodingRole: "base",
    spatialRationale:
      "국가 평균보다 주·성·도 단위의 시장·인프라 격차가 협력대상 선정에 더 유용",
    curatedReason:
      "국제협력 검토에 중요하나 기본 화면 과밀화를 막기 위해 카탈로그에서 필요 시 활성화",
  },
  {
    elementId: "C-019",
    cooperationDecisionRoles: ["R2", "R5", "R7"],
    actualResolution: "non-spatial",
    preferredResolution: "admin1",
    regionalizationPriority: "medium",
    visualPriority: "supporting",
    defaultIntegratedView: false,
    encodingRole: "base",
    spatialRationale:
      "국가 평균보다 주·성·도 단위의 시장·인프라 격차가 협력대상 선정에 더 유용",
    curatedReason:
      "국제협력 검토에 중요하나 기본 화면 과밀화를 막기 위해 카탈로그에서 필요 시 활성화",
  },
  {
    elementId: "C-020",
    cooperationDecisionRoles: ["R1", "R2"],
    actualResolution: "non-spatial",
    preferredResolution: "country",
    regionalizationPriority: "low",
    visualPriority: "supporting",
    defaultIntegratedView: false,
    encodingRole: "panel",
    spatialRationale:
      "정책·제도·국가집계 성격이 강해 국가 단위가 원자료 의미를 가장 잘 보존",
    curatedReason:
      "국제협력 검토에 중요하나 기본 화면 과밀화를 막기 위해 카탈로그에서 필요 시 활성화",
  },
  {
    elementId: "C-021",
    cooperationDecisionRoles: ["R1", "R2", "R7"],
    actualResolution: "non-spatial",
    preferredResolution: "country",
    regionalizationPriority: "low",
    visualPriority: "supporting",
    defaultIntegratedView: false,
    encodingRole: "bubble",
    spatialRationale:
      "정책·제도·국가집계 성격이 강해 국가 단위가 원자료 의미를 가장 잘 보존",
    curatedReason:
      "국제협력 검토에 중요하나 기본 화면 과밀화를 막기 위해 카탈로그에서 필요 시 활성화",
  },
  {
    elementId: "C-022",
    cooperationDecisionRoles: ["R2", "R5"],
    actualResolution: "non-spatial",
    preferredResolution: "admin1",
    regionalizationPriority: "medium",
    visualPriority: "on-demand",
    defaultIntegratedView: false,
    encodingRole: "base",
    spatialRationale:
      "국가 평균보다 주·성·도 단위의 시장·인프라 격차가 협력대상 선정에 더 유용",
    curatedReason: "상세 검토 단계에서 필요할 때 선택하는 보조정보",
  },
  {
    elementId: "C-023",
    cooperationDecisionRoles: ["R2", "R5"],
    actualResolution: "non-spatial",
    preferredResolution: "admin1",
    regionalizationPriority: "medium",
    visualPriority: "on-demand",
    defaultIntegratedView: false,
    encodingRole: "base",
    spatialRationale:
      "국가 평균보다 주·성·도 단위의 시장·인프라 격차가 협력대상 선정에 더 유용",
    curatedReason: "상세 검토 단계에서 필요할 때 선택하는 보조정보",
  },
  {
    elementId: "C-024",
    cooperationDecisionRoles: ["R2", "R6", "R7"],
    actualResolution: "non-spatial",
    preferredResolution: "country",
    regionalizationPriority: "low",
    visualPriority: "supporting",
    defaultIntegratedView: false,
    encodingRole: "symbol",
    spatialRationale:
      "정책·제도·국가집계 성격이 강해 국가 단위가 원자료 의미를 가장 잘 보존",
    curatedReason:
      "국제협력 검토에 중요하나 기본 화면 과밀화를 막기 위해 카탈로그에서 필요 시 활성화",
  },
  {
    elementId: "C-025",
    cooperationDecisionRoles: ["R2", "R6", "R7"],
    actualResolution: "non-spatial",
    preferredResolution: "country",
    regionalizationPriority: "low",
    visualPriority: "supporting",
    defaultIntegratedView: false,
    encodingRole: "symbol",
    spatialRationale:
      "정책·제도·국가집계 성격이 강해 국가 단위가 원자료 의미를 가장 잘 보존",
    curatedReason:
      "국제협력 검토에 중요하나 기본 화면 과밀화를 막기 위해 카탈로그에서 필요 시 활성화",
  },
  {
    elementId: "D-001",
    cooperationDecisionRoles: ["R4", "R5"],
    actualResolution: "non-spatial",
    preferredResolution: "admin1",
    regionalizationPriority: "medium",
    visualPriority: "supporting",
    defaultIntegratedView: false,
    encodingRole: "base",
    spatialRationale:
      "국가 평균보다 주·성·도 단위의 시장·인프라 격차가 협력대상 선정에 더 유용",
    curatedReason:
      "국제협력 검토에 중요하나 기본 화면 과밀화를 막기 위해 카탈로그에서 필요 시 활성화",
  },
  {
    elementId: "D-002",
    cooperationDecisionRoles: ["R5"],
    actualResolution: "non-spatial",
    preferredResolution: "admin1",
    regionalizationPriority: "medium",
    visualPriority: "on-demand",
    defaultIntegratedView: false,
    encodingRole: "base",
    spatialRationale:
      "국가 평균보다 주·성·도 단위의 시장·인프라 격차가 협력대상 선정에 더 유용",
    curatedReason: "상세 검토 단계에서 필요할 때 선택하는 보조정보",
  },
  {
    elementId: "D-003",
    cooperationDecisionRoles: ["R4", "R5"],
    actualResolution: "non-spatial",
    preferredResolution: "admin1",
    regionalizationPriority: "medium",
    visualPriority: "supporting",
    defaultIntegratedView: false,
    encodingRole: "base",
    spatialRationale:
      "국가 평균보다 주·성·도 단위의 시장·인프라 격차가 협력대상 선정에 더 유용",
    curatedReason:
      "국제협력 검토에 중요하나 기본 화면 과밀화를 막기 위해 카탈로그에서 필요 시 활성화",
  },
  {
    elementId: "D-004",
    cooperationDecisionRoles: ["R5"],
    actualResolution: "non-spatial",
    preferredResolution: "country",
    regionalizationPriority: "low",
    visualPriority: "on-demand",
    defaultIntegratedView: false,
    encodingRole: "panel",
    spatialRationale:
      "정책·제도·국가집계 성격이 강해 국가 단위가 원자료 의미를 가장 잘 보존",
    curatedReason: "상세 검토 단계에서 필요할 때 선택하는 보조정보",
  },
  {
    elementId: "D-005",
    cooperationDecisionRoles: ["R5", "R7"],
    actualResolution: "non-spatial",
    preferredResolution: "admin1",
    regionalizationPriority: "medium",
    visualPriority: "supporting",
    defaultIntegratedView: false,
    encodingRole: "base",
    spatialRationale:
      "국가 평균보다 주·성·도 단위의 시장·인프라 격차가 협력대상 선정에 더 유용",
    curatedReason:
      "국제협력 검토에 중요하나 기본 화면 과밀화를 막기 위해 카탈로그에서 필요 시 활성화",
  },
  {
    elementId: "D-006",
    cooperationDecisionRoles: ["R5", "R7"],
    actualResolution: "non-spatial",
    preferredResolution: "admin1",
    regionalizationPriority: "medium",
    visualPriority: "supporting",
    defaultIntegratedView: false,
    encodingRole: "base",
    spatialRationale:
      "국가 평균보다 주·성·도 단위의 시장·인프라 격차가 협력대상 선정에 더 유용",
    curatedReason:
      "국제협력 검토에 중요하나 기본 화면 과밀화를 막기 위해 카탈로그에서 필요 시 활성화",
  },
  {
    elementId: "D-007",
    cooperationDecisionRoles: ["R2", "R5", "R7"],
    actualResolution: "non-spatial",
    preferredResolution: "admin1",
    regionalizationPriority: "medium",
    visualPriority: "supporting",
    defaultIntegratedView: false,
    encodingRole: "base",
    spatialRationale:
      "국가 평균보다 주·성·도 단위의 시장·인프라 격차가 협력대상 선정에 더 유용",
    curatedReason:
      "국제협력 검토에 중요하나 기본 화면 과밀화를 막기 위해 카탈로그에서 필요 시 활성화",
  },
  {
    elementId: "D-008",
    cooperationDecisionRoles: ["R5", "R7"],
    actualResolution: "non-spatial",
    preferredResolution: "admin1",
    regionalizationPriority: "medium",
    visualPriority: "supporting",
    defaultIntegratedView: false,
    encodingRole: "base",
    spatialRationale:
      "국가 평균보다 주·성·도 단위의 시장·인프라 격차가 협력대상 선정에 더 유용",
    curatedReason:
      "국제협력 검토에 중요하나 기본 화면 과밀화를 막기 위해 카탈로그에서 필요 시 활성화",
  },
  {
    elementId: "D-009",
    cooperationDecisionRoles: ["R5", "R7"],
    actualResolution: "non-spatial",
    preferredResolution: "admin1",
    regionalizationPriority: "medium",
    visualPriority: "supporting",
    defaultIntegratedView: false,
    encodingRole: "base",
    spatialRationale:
      "국가 평균보다 주·성·도 단위의 시장·인프라 격차가 협력대상 선정에 더 유용",
    curatedReason:
      "국제협력 검토에 중요하나 기본 화면 과밀화를 막기 위해 카탈로그에서 필요 시 활성화",
  },
  {
    elementId: "D-010",
    cooperationDecisionRoles: ["R3", "R5", "R7"],
    actualResolution: "non-spatial",
    preferredResolution: "admin1",
    regionalizationPriority: "medium",
    visualPriority: "supporting",
    defaultIntegratedView: false,
    encodingRole: "base",
    spatialRationale:
      "국가 평균보다 주·성·도 단위의 시장·인프라 격차가 협력대상 선정에 더 유용",
    curatedReason:
      "국제협력 검토에 중요하나 기본 화면 과밀화를 막기 위해 카탈로그에서 필요 시 활성화",
  },
  {
    elementId: "D-011",
    cooperationDecisionRoles: ["R5", "R7"],
    actualResolution: "country",
    preferredResolution: "country",
    regionalizationPriority: "low",
    visualPriority: "core",
    defaultIntegratedView: true,
    encodingRole: "bubble",
    spatialRationale:
      "ODA 실제지출·약정·공여구조는 수원국 국가단위가 원자료 의미를 보존하며 임의 지역배분을 하지 않음",
    curatedReason:
      "핵심 통합뷰에서 사업기획 질문을 직접 설명하는 정보축으로 사용",
  },
  {
    elementId: "D-012",
    cooperationDecisionRoles: ["R5", "R7"],
    actualResolution: "non-spatial",
    preferredResolution: "corridor",
    regionalizationPriority: "medium",
    visualPriority: "supporting",
    defaultIntegratedView: false,
    encodingRole: "flow",
    spatialRationale:
      "교역·송전·교통·협력은 지점보다 연결관계와 회랑 자체가 핵심",
    curatedReason:
      "국제협력 검토에 중요하나 기본 화면 과밀화를 막기 위해 카탈로그에서 필요 시 활성화",
  },
  {
    elementId: "D-013",
    cooperationDecisionRoles: ["R5", "R7"],
    actualResolution: "non-spatial",
    preferredResolution: "country",
    regionalizationPriority: "low",
    visualPriority: "supporting",
    defaultIntegratedView: false,
    encodingRole: "base",
    spatialRationale:
      "정책·제도·국가집계 성격이 강해 국가 단위가 원자료 의미를 가장 잘 보존",
    curatedReason:
      "국제협력 검토에 중요하나 기본 화면 과밀화를 막기 위해 카탈로그에서 필요 시 활성화",
  },
  {
    elementId: "D-014",
    cooperationDecisionRoles: ["R6", "R7", "R8", "R9"],
    actualResolution: "non-spatial",
    preferredResolution: "corridor",
    regionalizationPriority: "medium",
    visualPriority: "supporting",
    defaultIntegratedView: false,
    encodingRole: "flow",
    spatialRationale:
      "교역·송전·교통·협력은 지점보다 연결관계와 회랑 자체가 핵심",
    curatedReason:
      "국제협력 검토에 중요하나 기본 화면 과밀화를 막기 위해 카탈로그에서 필요 시 활성화",
  },
  {
    elementId: "D-015",
    cooperationDecisionRoles: ["R6", "R7", "R8", "R9"],
    actualResolution: "non-spatial",
    preferredResolution: "corridor",
    regionalizationPriority: "medium",
    visualPriority: "supporting",
    defaultIntegratedView: false,
    encodingRole: "flow",
    spatialRationale:
      "교역·송전·교통·협력은 지점보다 연결관계와 회랑 자체가 핵심",
    curatedReason:
      "국제협력 검토에 중요하나 기본 화면 과밀화를 막기 위해 카탈로그에서 필요 시 활성화",
  },
  {
    elementId: "D-016",
    cooperationDecisionRoles: ["R6", "R7", "R8", "R9"],
    actualResolution: "non-spatial",
    preferredResolution: "corridor",
    regionalizationPriority: "medium",
    visualPriority: "supporting",
    defaultIntegratedView: false,
    encodingRole: "flow",
    spatialRationale:
      "교역·송전·교통·협력은 지점보다 연결관계와 회랑 자체가 핵심",
    curatedReason:
      "국제협력 검토에 중요하나 기본 화면 과밀화를 막기 위해 카탈로그에서 필요 시 활성화",
  },
  {
    elementId: "D-017",
    cooperationDecisionRoles: ["R1", "R6", "R7", "R8", "R9"],
    actualResolution: "non-spatial",
    preferredResolution: "corridor",
    regionalizationPriority: "medium",
    visualPriority: "supporting",
    defaultIntegratedView: false,
    encodingRole: "flow",
    spatialRationale:
      "교역·송전·교통·협력은 지점보다 연결관계와 회랑 자체가 핵심",
    curatedReason:
      "국제협력 검토에 중요하나 기본 화면 과밀화를 막기 위해 카탈로그에서 필요 시 활성화",
  },
  {
    elementId: "D-018",
    cooperationDecisionRoles: ["R6", "R7", "R8"],
    actualResolution: "country",
    preferredResolution: "facility",
    regionalizationPriority: "high",
    visualPriority: "core",
    defaultIntegratedView: true,
    encodingRole: "symbol",
    spatialRationale:
      "사업·시설·기관의 실제 위치가 확보될 경우 국가 평균보다 현장 단위 판단 가치가 큼",
    curatedReason:
      "핵심 통합뷰에서 사업기획 질문을 직접 설명하는 정보축으로 사용",
  },
  {
    elementId: "D-019",
    cooperationDecisionRoles: ["R1", "R6", "R7", "R8"],
    actualResolution: "country",
    preferredResolution: "facility",
    regionalizationPriority: "high",
    visualPriority: "core",
    defaultIntegratedView: true,
    encodingRole: "symbol",
    spatialRationale:
      "사업·시설·기관의 실제 위치가 확보될 경우 국가 평균보다 현장 단위 판단 가치가 큼",
    curatedReason:
      "핵심 통합뷰에서 사업기획 질문을 직접 설명하는 정보축으로 사용",
  },
  {
    elementId: "D-020",
    cooperationDecisionRoles: ["R6", "R7", "R8"],
    actualResolution: "country",
    preferredResolution: "facility",
    regionalizationPriority: "high",
    visualPriority: "core",
    defaultIntegratedView: true,
    encodingRole: "symbol",
    spatialRationale:
      "사업·시설·기관의 실제 위치가 확보될 경우 국가 평균보다 현장 단위 판단 가치가 큼",
    curatedReason:
      "핵심 통합뷰에서 사업기획 질문을 직접 설명하는 정보축으로 사용",
  },
  {
    elementId: "D-021",
    cooperationDecisionRoles: ["R6", "R7", "R8"],
    actualResolution: "country",
    preferredResolution: "facility",
    regionalizationPriority: "high",
    visualPriority: "core",
    defaultIntegratedView: true,
    encodingRole: "symbol",
    spatialRationale:
      "사업·시설·기관의 실제 위치가 확보될 경우 국가 평균보다 현장 단위 판단 가치가 큼",
    curatedReason:
      "핵심 통합뷰에서 사업기획 질문을 직접 설명하는 정보축으로 사용",
  },
  {
    elementId: "D-022",
    cooperationDecisionRoles: ["R2", "R6", "R7", "R8"],
    actualResolution: "non-spatial",
    preferredResolution: "facility",
    regionalizationPriority: "medium",
    visualPriority: "supporting",
    defaultIntegratedView: false,
    encodingRole: "symbol",
    spatialRationale:
      "사업·시설·기관의 실제 위치가 확보될 경우 국가 평균보다 현장 단위 판단 가치가 큼",
    curatedReason:
      "국제협력 검토에 중요하나 기본 화면 과밀화를 막기 위해 카탈로그에서 필요 시 활성화",
  },
  {
    elementId: "D-023",
    cooperationDecisionRoles: ["R6", "R7"],
    actualResolution: "country",
    preferredResolution: "facility",
    regionalizationPriority: "high",
    visualPriority: "core",
    defaultIntegratedView: true,
    encodingRole: "symbol",
    spatialRationale:
      "사업·시설·기관의 실제 위치가 확보될 경우 국가 평균보다 현장 단위 판단 가치가 큼",
    curatedReason:
      "핵심 통합뷰에서 기존 GEF 국제지원의 분포를 별도 기관 심볼로 확인",
  },
  {
    elementId: "D-024",
    cooperationDecisionRoles: ["R6", "R7", "R8"],
    actualResolution: "non-spatial",
    preferredResolution: "corridor",
    regionalizationPriority: "medium",
    visualPriority: "supporting",
    defaultIntegratedView: false,
    encodingRole: "flow",
    spatialRationale:
      "교역·송전·교통·협력은 지점보다 연결관계와 회랑 자체가 핵심",
    curatedReason:
      "국제협력 검토에 중요하나 기본 화면 과밀화를 막기 위해 카탈로그에서 필요 시 활성화",
  },
  {
    elementId: "D-025",
    cooperationDecisionRoles: ["R6", "R7", "R8"],
    actualResolution: "non-spatial",
    preferredResolution: "facility",
    regionalizationPriority: "medium",
    visualPriority: "supporting",
    defaultIntegratedView: false,
    encodingRole: "symbol",
    spatialRationale:
      "사업·시설·기관의 실제 위치가 확보될 경우 국가 평균보다 현장 단위 판단 가치가 큼",
    curatedReason:
      "국제협력 검토에 중요하나 기본 화면 과밀화를 막기 위해 카탈로그에서 필요 시 활성화",
  },
  {
    elementId: "D-026",
    cooperationDecisionRoles: ["R6", "R7", "R8"],
    actualResolution: "non-spatial",
    preferredResolution: "facility",
    regionalizationPriority: "medium",
    visualPriority: "supporting",
    defaultIntegratedView: false,
    encodingRole: "symbol",
    spatialRationale:
      "사업·시설·기관의 실제 위치가 확보될 경우 국가 평균보다 현장 단위 판단 가치가 큼",
    curatedReason:
      "국제협력 검토에 중요하나 기본 화면 과밀화를 막기 위해 카탈로그에서 필요 시 활성화",
  },
  {
    elementId: "E-001",
    cooperationDecisionRoles: ["R8"],
    actualResolution: "non-spatial",
    preferredResolution: "country",
    regionalizationPriority: "low",
    visualPriority: "core",
    defaultIntegratedView: false,
    encodingRole: "panel",
    spatialRationale:
      "정책·제도·국가집계 성격이 강해 국가 단위가 원자료 의미를 가장 잘 보존",
    curatedReason: "상세 검토 단계에서 필요할 때 선택하는 보조정보",
  },
  {
    elementId: "E-002",
    cooperationDecisionRoles: ["R8"],
    actualResolution: "non-spatial",
    preferredResolution: "country",
    regionalizationPriority: "low",
    visualPriority: "supporting",
    defaultIntegratedView: false,
    encodingRole: "panel",
    spatialRationale:
      "정책·제도·국가집계 성격이 강해 국가 단위가 원자료 의미를 가장 잘 보존",
    curatedReason:
      "국제협력 검토에 중요하나 기본 화면 과밀화를 막기 위해 카탈로그에서 필요 시 활성화",
  },
  {
    elementId: "E-003",
    cooperationDecisionRoles: ["R8"],
    actualResolution: "country",
    preferredResolution: "country",
    regionalizationPriority: "low",
    visualPriority: "core",
    defaultIntegratedView: false,
    encodingRole: "panel",
    spatialRationale:
      "정책·제도·국가집계 성격이 강해 국가 단위가 원자료 의미를 가장 잘 보존",
    curatedReason: "상세 검토 단계에서 필요할 때 선택하는 보조정보",
  },
  {
    elementId: "E-004",
    cooperationDecisionRoles: ["R8"],
    actualResolution: "non-spatial",
    preferredResolution: "facility",
    regionalizationPriority: "high",
    visualPriority: "supporting",
    defaultIntegratedView: false,
    encodingRole: "point",
    spatialRationale:
      "사업·시설·기관의 실제 위치가 확보될 경우 국가 평균보다 현장 단위 판단 가치가 큼",
    curatedReason:
      "국제협력 검토에 중요하나 기본 화면 과밀화를 막기 위해 카탈로그에서 필요 시 활성화",
  },
  {
    elementId: "E-005",
    cooperationDecisionRoles: ["R8"],
    actualResolution: "non-spatial",
    preferredResolution: "facility",
    regionalizationPriority: "high",
    visualPriority: "supporting",
    defaultIntegratedView: false,
    encodingRole: "point",
    spatialRationale:
      "사업·시설·기관의 실제 위치가 확보될 경우 국가 평균보다 현장 단위 판단 가치가 큼",
    curatedReason:
      "국제협력 검토에 중요하나 기본 화면 과밀화를 막기 위해 카탈로그에서 필요 시 활성화",
  },
  {
    elementId: "E-006",
    cooperationDecisionRoles: ["R8"],
    actualResolution: "non-spatial",
    preferredResolution: "facility",
    regionalizationPriority: "high",
    visualPriority: "supporting",
    defaultIntegratedView: false,
    encodingRole: "point",
    spatialRationale:
      "사업·시설·기관의 실제 위치가 확보될 경우 국가 평균보다 현장 단위 판단 가치가 큼",
    curatedReason:
      "국제협력 검토에 중요하나 기본 화면 과밀화를 막기 위해 카탈로그에서 필요 시 활성화",
  },
  {
    elementId: "E-007",
    cooperationDecisionRoles: ["R2", "R8"],
    actualResolution: "non-spatial",
    preferredResolution: "admin1",
    regionalizationPriority: "medium",
    visualPriority: "supporting",
    defaultIntegratedView: false,
    encodingRole: "outline",
    spatialRationale:
      "국가 평균보다 주·성·도 단위의 시장·인프라 격차가 협력대상 선정에 더 유용",
    curatedReason:
      "국제협력 검토에 중요하나 기본 화면 과밀화를 막기 위해 카탈로그에서 필요 시 활성화",
  },
  {
    elementId: "E-008",
    cooperationDecisionRoles: ["R8"],
    actualResolution: "non-spatial",
    preferredResolution: "country",
    regionalizationPriority: "low",
    visualPriority: "supporting",
    defaultIntegratedView: false,
    encodingRole: "symbol",
    spatialRationale:
      "정책·제도·국가집계 성격이 강해 국가 단위가 원자료 의미를 가장 잘 보존",
    curatedReason:
      "국제협력 검토에 중요하나 기본 화면 과밀화를 막기 위해 카탈로그에서 필요 시 활성화",
  },
  {
    elementId: "E-009",
    cooperationDecisionRoles: ["R5", "R8"],
    actualResolution: "non-spatial",
    preferredResolution: "admin1",
    regionalizationPriority: "medium",
    visualPriority: "supporting",
    defaultIntegratedView: false,
    encodingRole: "base",
    spatialRationale:
      "국가 평균보다 주·성·도 단위의 시장·인프라 격차가 협력대상 선정에 더 유용",
    curatedReason:
      "국제협력 검토에 중요하나 기본 화면 과밀화를 막기 위해 카탈로그에서 필요 시 활성화",
  },
  {
    elementId: "E-010",
    cooperationDecisionRoles: ["R5", "R8"],
    actualResolution: "non-spatial",
    preferredResolution: "country",
    regionalizationPriority: "low",
    visualPriority: "supporting",
    defaultIntegratedView: false,
    encodingRole: "base",
    spatialRationale:
      "정책·제도·국가집계 성격이 강해 국가 단위가 원자료 의미를 가장 잘 보존",
    curatedReason:
      "국제협력 검토에 중요하나 기본 화면 과밀화를 막기 위해 카탈로그에서 필요 시 활성화",
  },
  {
    elementId: "E-011",
    cooperationDecisionRoles: ["R5", "R8"],
    actualResolution: "non-spatial",
    preferredResolution: "country",
    regionalizationPriority: "low",
    visualPriority: "supporting",
    defaultIntegratedView: false,
    encodingRole: "panel",
    spatialRationale:
      "정책·제도·국가집계 성격이 강해 국가 단위가 원자료 의미를 가장 잘 보존",
    curatedReason:
      "국제협력 검토에 중요하나 기본 화면 과밀화를 막기 위해 카탈로그에서 필요 시 활성화",
  },
  {
    elementId: "E-012",
    cooperationDecisionRoles: ["R5", "R8"],
    actualResolution: "non-spatial",
    preferredResolution: "admin1",
    regionalizationPriority: "medium",
    visualPriority: "supporting",
    defaultIntegratedView: false,
    encodingRole: "base",
    spatialRationale:
      "국가 평균보다 주·성·도 단위의 시장·인프라 격차가 협력대상 선정에 더 유용",
    curatedReason:
      "국제협력 검토에 중요하나 기본 화면 과밀화를 막기 위해 카탈로그에서 필요 시 활성화",
  },
  {
    elementId: "E-013",
    cooperationDecisionRoles: ["R4", "R5", "R8"],
    actualResolution: "non-spatial",
    preferredResolution: "admin1",
    regionalizationPriority: "medium",
    visualPriority: "supporting",
    defaultIntegratedView: false,
    encodingRole: "base",
    spatialRationale:
      "국가 평균보다 주·성·도 단위의 시장·인프라 격차가 협력대상 선정에 더 유용",
    curatedReason:
      "국제협력 검토에 중요하나 기본 화면 과밀화를 막기 위해 카탈로그에서 필요 시 활성화",
  },
  {
    elementId: "E-014",
    cooperationDecisionRoles: ["R2", "R8", "R9"],
    actualResolution: "non-spatial",
    preferredResolution: "corridor",
    regionalizationPriority: "medium",
    visualPriority: "supporting",
    defaultIntegratedView: false,
    encodingRole: "flow",
    spatialRationale:
      "교역·송전·교통·협력은 지점보다 연결관계와 회랑 자체가 핵심",
    curatedReason:
      "국제협력 검토에 중요하나 기본 화면 과밀화를 막기 위해 카탈로그에서 필요 시 활성화",
  },
  {
    elementId: "E-015",
    cooperationDecisionRoles: ["R2", "R6", "R8"],
    actualResolution: "non-spatial",
    preferredResolution: "country",
    regionalizationPriority: "low",
    visualPriority: "supporting",
    defaultIntegratedView: false,
    encodingRole: "symbol",
    spatialRationale:
      "정책·제도·국가집계 성격이 강해 국가 단위가 원자료 의미를 가장 잘 보존",
    curatedReason:
      "국제협력 검토에 중요하나 기본 화면 과밀화를 막기 위해 카탈로그에서 필요 시 활성화",
  },
  {
    elementId: "E-016",
    cooperationDecisionRoles: ["R9"],
    actualResolution: "non-spatial",
    preferredResolution: "non-spatial",
    regionalizationPriority: "low",
    visualPriority: "on-demand",
    defaultIntegratedView: false,
    encodingRole: "panel",
    spatialRationale:
      "수원국 공간분포로 표현할 경우 의미 왜곡 우려가 있어 지도 직접표현보다 상세정보가 적절",
    curatedReason: "상세 검토 단계에서 필요할 때 선택하는 보조정보",
  },
  {
    elementId: "E-017",
    cooperationDecisionRoles: ["R9"],
    actualResolution: "non-spatial",
    preferredResolution: "corridor",
    regionalizationPriority: "medium",
    visualPriority: "on-demand",
    defaultIntegratedView: false,
    encodingRole: "flow",
    spatialRationale:
      "교역·송전·교통·협력은 지점보다 연결관계와 회랑 자체가 핵심",
    curatedReason: "상세 검토 단계에서 필요할 때 선택하는 보조정보",
  },
  {
    elementId: "E-018",
    cooperationDecisionRoles: ["R2", "R9"],
    actualResolution: "non-spatial",
    preferredResolution: "corridor",
    regionalizationPriority: "medium",
    visualPriority: "on-demand",
    defaultIntegratedView: false,
    encodingRole: "flow",
    spatialRationale:
      "교역·송전·교통·협력은 지점보다 연결관계와 회랑 자체가 핵심",
    curatedReason: "상세 검토 단계에서 필요할 때 선택하는 보조정보",
  },
  {
    elementId: "E-019",
    cooperationDecisionRoles: ["R8", "R9"],
    actualResolution: "non-spatial",
    preferredResolution: "facility",
    regionalizationPriority: "high",
    visualPriority: "core",
    defaultIntegratedView: false,
    encodingRole: "point",
    spatialRationale:
      "사업·시설·기관의 실제 위치가 확보될 경우 국가 평균보다 현장 단위 판단 가치가 큼",
    curatedReason: "상세 검토 단계에서 필요할 때 선택하는 보조정보",
  },
  {
    elementId: "E-020",
    cooperationDecisionRoles: ["R9"],
    actualResolution: "non-spatial",
    preferredResolution: "non-spatial",
    regionalizationPriority: "low",
    visualPriority: "on-demand",
    defaultIntegratedView: false,
    encodingRole: "panel",
    spatialRationale:
      "수원국 공간분포로 표현할 경우 의미 왜곡 우려가 있어 지도 직접표현보다 상세정보가 적절",
    curatedReason: "상세 검토 단계에서 필요할 때 선택하는 보조정보",
  },
] as MapElementDecisionV116[];

export const MAP_ELEMENT_DECISION_INDEX_V116 = new Map(
  MAP_ELEMENT_DECISIONS_V116.map((row) => [row.elementId, row] as const)
);

export const MAP_ELEMENT_DECISION_COVERAGE_V116 = {
  total: MAP_ELEMENT_DECISIONS_V116.length,
  audited: MAP_ELEMENT_DECISIONS_V116.filter((row) =>
    MAP_ELEMENT_AUDIT_INDEX_V115.has(row.elementId)
  ).length,
  missing: MAP_ELEMENT_AUDIT_V115.filter(
    (row) => !MAP_ELEMENT_DECISION_INDEX_V116.has(row.elementId)
  ).map((row) => row.elementId),
  roleCounts: Object.fromEntries(
    Object.keys(COOPERATION_DECISION_ROLE_LABELS_V116).map((role) => [
      role,
      MAP_ELEMENT_DECISIONS_V116.filter((row) =>
        row.cooperationDecisionRoles.includes(
          role as CooperationDecisionRoleV116
        )
      ).length,
    ])
  ) as Record<CooperationDecisionRoleV116, number>,
  actualResolutionCounts: Object.fromEntries(
    Array.from(
      new Set(MAP_ELEMENT_DECISIONS_V116.map((row) => row.actualResolution))
    ).map((resolution) => [
      resolution,
      MAP_ELEMENT_DECISIONS_V116.filter(
        (row) => row.actualResolution === resolution
      ).length,
    ])
  ) as Partial<Record<SpatialResolutionV116, number>>,
  preferredResolutionCounts: Object.fromEntries(
    Array.from(
      new Set(MAP_ELEMENT_DECISIONS_V116.map((row) => row.preferredResolution))
    ).map((resolution) => [
      resolution,
      MAP_ELEMENT_DECISIONS_V116.filter(
        (row) => row.preferredResolution === resolution
      ).length,
    ])
  ) as Partial<Record<SpatialResolutionV116, number>>,
  regionalPreferred: MAP_ELEMENT_DECISIONS_V116.filter((row) =>
    ["facility", "admin2", "admin1", "basin", "grid", "corridor"].includes(
      row.preferredResolution
    )
  ).length,
  regionalActual: MAP_ELEMENT_DECISIONS_V116.filter((row) =>
    ["facility", "admin2", "admin1", "basin", "grid", "corridor"].includes(
      row.actualResolution
    )
  ).length,
  regionalSyntheticPrototype: MAP_ELEMENT_DECISIONS_V116.filter((decision) => {
    const audit = MAP_ELEMENT_AUDIT_INDEX_V115.get(decision.elementId);
    return Boolean(
      audit?.mockAllowed &&
        decision.actualResolution !== decision.preferredResolution &&
        ["facility", "admin2", "admin1", "basin", "grid", "corridor"].includes(
          decision.preferredResolution
        )
    );
  }).length,
} as const;

export function getMapElementDecisionV116(
  elementId: string
): MapElementDecisionV116 | undefined {
  return MAP_ELEMENT_DECISION_INDEX_V116.get(elementId);
}
