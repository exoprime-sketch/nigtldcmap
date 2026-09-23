import type { VietnamMapRendererV124 } from "../vietnam/vietnamTypesV124";
import {
  publicNoticeWordingV136_1,
  publicTextV126,
} from "./publicFieldPolicyV126";
import publicMapTargetsContractV138 from "./publicMapTargetsV138.json";

/**
 * V138: one dataset colours the map; every other ticked dataset is drawn as
 * outline, points or lines beside it. The old contract quietly dropped the
 * second companion a reader ticked; the limit now only bounds the map index.
 */
export const PUBLIC_MAP_WORKSPACE_LIMITS_V126 = {
  primaryLayers: 1,
  contextLayers: 64,
  activeLayers: 65,
  selectedFeatures: 1,
} as const;

export interface PublicMapTargetMeasureV138 {
  key: string;
  sourceKey?: string;
  label: string;
  unit: string;
  measureId?: string;
  aggregate?: "count";
  parse?: string;
  sector?: string;
}

export interface PublicMapTargetV138 {
  elementId: string;
  category: string;
  publicName: string;
  sourceFields: string[];
  sourceSpatialUnit: string;
  displaySpatialUnit: string;
  representation:
    | "point"
    | "line"
    | "admin1-choropleth"
    | "region-choropleth"
    | "regional-scope"
    | "none";
  build: {
    kind: "existing" | "admin1-attributes" | "region-membership" | "entities" | "none";
    reason?: string;
    requiredAsset?: string;
    forbidden?: string;
    measures?: PublicMapTargetMeasureV138[];
    [key: string]: unknown;
  };
  selectableVariables: string;
  unit: string;
  period: string;
  representativeItem: string;
  evidence: string;
  limitation: string;
}

/** The seven categories the map list is folded into, in panel order. */
export const PUBLIC_MAP_TARGET_CATEGORIES_V138: readonly string[] =
  publicMapTargetsContractV138.categories;

export const PUBLIC_MAP_TARGETS_V138: readonly PublicMapTargetV138[] =
  publicMapTargetsContractV138.targets as PublicMapTargetV138[];

const PUBLIC_MAP_TARGET_BY_ELEMENT_V138 = new Map(
  PUBLIC_MAP_TARGETS_V138.map((target) => [target.elementId, target])
);

export function publicMapTargetV138(
  elementId: string
): PublicMapTargetV138 | null {
  return PUBLIC_MAP_TARGET_BY_ELEMENT_V138.get(elementId) || null;
}

export function isPublicMapTargetV138(elementId: string): boolean {
  return PUBLIC_MAP_TARGET_BY_ELEMENT_V138.has(elementId);
}

/**
 * A preset can recommend two different companion datasets even though the
 * normal map deliberately displays at most one of them at a time. Dedicated
 * comparison mode is the only place where two thematic datasets are treated
 * as equal primary views.
 */
export const PUBLIC_MAP_PRESET_CONTEXT_CANDIDATE_LIMIT_V135 = 2 as const;

export const PUBLIC_MAP_WORKSPACE_PRESET_IDS_V126 = [
  "POWER_INFRASTRUCTURE",
  "RENEWABLE_PLANNING",
  "FOREST_CHANGE",
  "CLIMATE_VULNERABILITY",
  "CLIMATE_FINANCE_PROJECTS",
] as const;

export type PublicMapWorkspacePresetIdV126 =
  (typeof PUBLIC_MAP_WORKSPACE_PRESET_IDS_V126)[number];

export type PublicMapLayerRoleV126 = "primary" | "context";

export type PublicMapPresetElementIdV126 =
  | "A-023"
  | "A-024"
  | "B-021"
  | "B-031"
  | "B-033"
  | "B-034"
  | "C-016"
  | "C-025"
  | "D-008"
  | "D-018";

export interface PublicMapPresetLayerV126 {
  elementId: PublicMapPresetElementIdV126;
  variable: string;
  period: string;
  /**
   * The measure this preset means, by its stable id.
   *
   * `variable` is a slug of the Korean label, and the slugger falls back to a
   * SHA-256 prefix for anything non-ASCII - so a Korean-labelled variable is
   * keyed by a hash that changes whenever the label does. FOREST_CHANGE held
   * one of those hashes (8fca7c8dd189) that the delivery no longer produces,
   * with a period the layer does not have, and silently selected a layer with
   * no values. measureId comes from the derivation contract and survives both a
   * relabel and a rekey, so it is what a preset should name.
   */
  measureId?: string;
  /**
   * The label, as a fallback when no measureId is published for a layer. Only
   * accepted on a unique match: two variables sharing a label is not an
   * identification.
   */
  variableLabel?: string;
}

export interface PublicMapWorkspacePresetV126 {
  id: PublicMapWorkspacePresetIdV126;
  labelKo: string;
  descriptionKo: string;
  primary: PublicMapPresetLayerV126;
  context: readonly PublicMapPresetLayerV126[];
}

/**
 * Public analysis presets only reference the verified Vietnam V124 spatial
 * layers. The tuple annotation intentionally fixes the release contract at
 * exactly five presets.
 */
export const PUBLIC_MAP_WORKSPACE_PRESETS_V126: readonly [
  PublicMapWorkspacePresetV126,
  PublicMapWorkspacePresetV126,
  PublicMapWorkspacePresetV126,
  PublicMapWorkspacePresetV126,
  PublicMapWorkspacePresetV126
] = [
  {
    id: "POWER_INFRASTRUCTURE",
    labelKo: "전력 인프라",
    descriptionKo: "송전망 + 발전소",
    primary: { elementId: "A-024", variable: "all", period: "2016" },
    context: [
      { elementId: "A-023", variable: "locations", period: "2026" },
    ],
  },
  {
    id: "RENEWABLE_PLANNING",
    labelKo: "재생에너지 계획",
    descriptionKo: "지역별 계획 + 송전망·발전소",
    primary: {
      elementId: "C-016",
      measureId: "re_capacity_dmt_mai_nha_prov",
      variable: "dmt-mai-nha",
      period: "2025-2030",
    },
    context: [
      { elementId: "A-024", variable: "all", period: "2016" },
      { elementId: "A-023", variable: "locations", period: "2026" },
    ],
  },
  {
    id: "FOREST_CHANGE",
    labelKo: "산림 변화",
    descriptionKo: "산림손실 + 산림면적·탄소",
    primary: {
      elementId: "B-033",
      measureId: "tree_cover_loss_prov",
      variable: "annual-tree-cover-loss",
      variableLabel: "연간 수관 손실 — 성(省) 단위",
      // The delivery carries a real annual series; 2025 is not one of its years.
      period: "2024",
    },
    context: [
      {
        elementId: "B-031",
        measureId: "prov_ext2010",
        variable: "tree-cover-area-2010",
        period: "2010",
      },
      {
        elementId: "B-034",
        measureId: "prov_forest_carbon_net_flux",
        variable: "6d25ef451c11",
        variableLabel: "산림탄소 순플럭스(연평균)",
        period: "2001–2024",
      },
    ],
  },
  {
    id: "CLIMATE_VULNERABILITY",
    labelKo: "기후 취약성",
    descriptionKo: "권역 위험도 + 기후예산·적응사업",
    primary: { elementId: "B-021", variable: "gvi-6", period: "2023" },
    context: [
      {
        elementId: "D-008",
        variable: "provincial-climate-budget",
        period: "2010-2013",
      },
      { elementId: "D-018", variable: "regional-scope", period: "2026" },
    ],
  },
  {
    id: "CLIMATE_FINANCE_PROJECTS",
    labelKo: "기후재원 사업",
    descriptionKo: "적응기금 지역 협력범위 + 검증된 탄소사업지",
    primary: {
      elementId: "D-018",
      variable: "regional-scope",
      period: "2026",
    },
    context: [
      { elementId: "C-025", variable: "locations", period: "2026" },
    ],
  },
];

export const PUBLIC_MAP_WORKSPACE_PRESET_COUNT_V126 =
  PUBLIC_MAP_WORKSPACE_PRESETS_V126.length;

export interface PublicMapWorkspaceLayerStateV126
  extends PublicMapPresetLayerV126 {
  role: PublicMapLayerRoleV126;
  opacity: number;
}

export interface PublicMapWorkspaceRoleStateV126 {
  primaryElementId: PublicMapPresetElementIdV126 | null;
  contextElementIds: PublicMapPresetElementIdV126[];
}

export interface PublicMapWorkspaceStateV126 {
  presetId: PublicMapWorkspacePresetIdV126;
  primary: PublicMapWorkspaceLayerStateV126;
  context: PublicMapWorkspaceLayerStateV126[];
  focusElementId: PublicMapPresetElementIdV126;
}

/**
 * Presets define useful comparison candidates, but V133 intentionally starts
 * with the primary analysis only. Comparison layers are mounted only after an
 * explicit user action so two thematic surfaces never appear to be one value.
 */
export function publicMapPresetContextCandidatesV133(
  id: PublicMapWorkspacePresetIdV126
): readonly PublicMapPresetLayerV126[] {
  return getPublicMapWorkspacePresetV126(id).context.slice(
    0,
    PUBLIC_MAP_PRESET_CONTEXT_CANDIDATE_LIMIT_V135
  );
}

export function isPublicMapWorkspacePresetIdV126(
  value: string | null | undefined
): value is PublicMapWorkspacePresetIdV126 {
  return PUBLIC_MAP_WORKSPACE_PRESET_IDS_V126.includes(
    value as PublicMapWorkspacePresetIdV126
  );
}

export function getPublicMapWorkspacePresetV126(
  id: PublicMapWorkspacePresetIdV126
): PublicMapWorkspacePresetV126 {
  return (
    PUBLIC_MAP_WORKSPACE_PRESETS_V126.find((preset) => preset.id === id) ||
    PUBLIC_MAP_WORKSPACE_PRESETS_V126[0]
  );
}

export function createPublicMapWorkspaceStateV126(
  id: PublicMapWorkspacePresetIdV126
): PublicMapWorkspaceStateV126 {
  const preset = getPublicMapWorkspacePresetV126(id);
  return {
    presetId: preset.id,
    // Context candidates remain on the preset contract, but are OFF by
    // default. This is the public-map focus contract introduced in V133.
    context: [],
    primary: {
      ...preset.primary,
      role: "primary",
      opacity: 0.88,
    },
    focusElementId: preset.primary.elementId,
  };
}

export function normalizePublicMapWorkspaceStateV126(
  state: PublicMapWorkspaceStateV126
): PublicMapWorkspaceStateV126 {
  const seen = new Set<PublicMapPresetElementIdV126>([
    state.primary.elementId,
  ]);
  const context = state.context
    .filter((layer) => {
      if (seen.has(layer.elementId)) return false;
      seen.add(layer.elementId);
      return true;
    })
    .slice(0, PUBLIC_MAP_WORKSPACE_LIMITS_V126.contextLayers)
    .map((layer) => ({
      ...layer,
      role: "context" as PublicMapLayerRoleV126,
      opacity: clampPublicMapOpacityV126(layer.opacity),
    }));
  const activeIds = new Set<PublicMapPresetElementIdV126>([
    state.primary.elementId,
    ...context.map((layer) => layer.elementId),
  ]);
  return {
    ...state,
    primary: {
      ...state.primary,
      role: "primary",
      opacity: clampPublicMapOpacityV126(state.primary.opacity),
    },
    context,
    focusElementId: activeIds.has(state.focusElementId)
      ? state.focusElementId
      : state.primary.elementId,
  };
}

export function publicMapWorkspaceRoleStateV126(
  state: PublicMapWorkspaceStateV126
): PublicMapWorkspaceRoleStateV126 {
  const normalized = normalizePublicMapWorkspaceStateV126(state);
  return {
    primaryElementId: normalized.primary.elementId,
    contextElementIds: normalized.context.map((layer) => layer.elementId),
  };
}

export function publicMapLayerRoleV126(
  state: PublicMapWorkspaceStateV126,
  elementId: string
): PublicMapLayerRoleV126 | null {
  if (state.primary.elementId === elementId) return "primary";
  return state.context.some((layer) => layer.elementId === elementId)
    ? "context"
    : null;
}

export type PublicMapSpatialTypeV126 =
  | "location"
  | "network"
  | "admin1-complete"
  | "admin1-partial"
  | "regional-scope";

export interface PublicMapSpatialTypeCopyV126 {
  labelKo: string;
  descriptionKo: string;
}

export const PUBLIC_MAP_SPATIAL_TYPE_COPY_V126: Record<
  PublicMapSpatialTypeV126,
  PublicMapSpatialTypeCopyV126
> = {
  location: {
    labelKo: "시설·사업 위치",
    descriptionKo: "원천에서 공개한 위치가 있는 항목을 표시합니다.",
  },
  network: {
    labelKo: "선형 인프라",
    descriptionKo: "공개 지도에서 확인되는 선형 연결망의 대략적 위치를 표시합니다.",
  },
  "admin1-complete": {
    labelKo: "지역별 색상지도",
    descriptionKo: "성·시별 값을 비교합니다. 원자료는 개편 전 63개 성·시 기준이며, 34개 경계에서는 자료별 집계 규칙으로 표시합니다.",
  },
  "admin1-partial": {
    labelKo: "일부 지역 자료",
    descriptionKo: "실제 값이 공개된 성·시만 구분해 표시합니다.",
  },
  "regional-scope": {
    labelKo: "지역 협력범위",
    descriptionKo:
      "참여국 범위를 표시하며 검증된 세부 활동지역만 점으로 표시합니다.",
  },
};

export const A024_PUBLIC_TITLE_V126 = "베트남 송전망";
export const A024_PUBLIC_SHORT_TITLE_V126 = "송전망";
export const A024_PUBLIC_ACCURACY_NOTICE_V126 =
  "원천 지도는 지오리퍼런싱된 자료를 기반으로 하며 일부 선로 위치가 약 2~10km 어긋날 수 있습니다. 정밀 설계보다 국가 단위 송전망 분포 확인에 적합합니다.";

const PUBLIC_MAP_LAYER_TITLES_V126: Record<string, string> = {
  "A-023": "발전소",
  "A-024": A024_PUBLIC_TITLE_V126,
  "B-021": "지역 취약성",
  // V140: the layer names what its province values measure. B-029's map
  // column is peatland, not every forest type; B-039 is the theoretical
  // hydro potential; B-040 is subsurface temperature by depth.
  "B-029": "이탄지 면적(산림 유형별 면적 중)",
  "B-039": "수력 이론 잠재량",
  "B-040": "지열 자원(심도별 지온)",
  "B-031": "산림 총면적",
  "B-032": "수관 피복률",
  "B-033": "연간 산림손실",
  "B-034": "산림 탄소",
  "B-048": "주요 광산",
  "C-016": "재생에너지 지역계획",
  "C-025": "탄소크레딧 사업",
  "D-008": "지역 기후예산",
  "D-018": "적응기금 사업",
};

export const PUBLIC_MAP_DATA_FUNCTION_V135: Readonly<Record<string, string>> = {
  "A-023": "발전소 입지·설비 분포 비교",
  "A-024": "송전선 경로·전압별 분포 확인",
  "C-016": "성·시별 재생에너지 계획용량 비교",
  "B-021": "권역별 취약성 수준 비교",
  "B-031": "성·시별 산림면적 비교",
  "B-032": "성·시별 수관피복률 비교",
  "B-033": "지역별 산림손실·연도 변화 확인",
  "B-034": "지역별 탄소저장·배출·흡수 비교",
  "B-048": "주요 광산 위치·광종 분포 확인",
  "C-025": "탄소사업 위치·사업유형 확인",
  "D-008": "성·시별 기후예산 규모 비교",
  "D-018": "적응사업 참여지역·활동지역 확인",
};

export function publicMapDataFunctionV135(
  elementId: string,
  fallback?: string | null
): string {
  return (
    PUBLIC_MAP_DATA_FUNCTION_V135[elementId] ||
    publicTextV126(fallback) ||
    "공간 분포 확인"
  );
}

const PUBLIC_MAP_LAYER_ACCURACY_V126: Record<string, string> = {
  "A-024": A024_PUBLIC_ACCURACY_NOTICE_V126,
  "B-021":
    "공개된 권역값을 명시된 소속 성·시에 표시합니다. 개별 성·시에서 별도로 추정한 값은 아닙니다.",
  "C-016":
    "개편 전 63개 성·시 중 실제 계획값이 공개된 지역만 표시하며, 미제공 지역은 0으로 바꾸지 않습니다.",
  "D-008":
    "개편 전 63개 성·시 중 실제 예산값이 공개된 3개 지역만 표시하며, 나머지 지역은 0으로 바꾸지 않습니다.",
  // Basin rows: the source's own representative point, not a facility and not
  // a boundary. The HydroSHEDS basin polygons the rows cite were not delivered.
  "B-025":
    "유역 대표점만 표시합니다. 원자료가 참조하는 HydroSHEDS 8대 유역 경계 폴리곤은 전달되지 않아 표시하지 않으며, 대표점 하나가 유역 전체 범위를 뜻하지 않습니다.",
  "B-023":
    "관측지점은 원천 좌표로, 유역 행은 유역 대표점(속 빈 기호)으로 표시합니다. 유역 경계 폴리곤은 원자료 파일이 전달되지 않아 표시하지 않습니다.",
  "B-028":
    "관측지점은 원천 좌표로, 유역 행은 유역 대표점(속 빈 기호)으로 표시합니다. 유역 경계 폴리곤은 원자료 파일이 전달되지 않아 표시하지 않습니다.",
};

export interface PublicMapLayerCopyInputV126 {
  elementId: string;
  renderer: VietnamMapRendererV124;
  title?: string | null;
  accuracyNotice?: string | null;
}

export interface PublicMapLayerCopyV126 {
  titleKo: string;
  spatialType: PublicMapSpatialTypeV126;
  spatialTypeLabelKo: string;
  spatialTypeDescriptionKo: string;
  accuracyNoticeKo: string;
}

export function publicMapSpatialTypeV126(
  renderer: VietnamMapRendererV124
): PublicMapSpatialTypeV126 {
  if (renderer === "line") return "network";
  if (renderer === "regional-scope") return "regional-scope";
  if (renderer === "admin1-choropleth") return "admin1-complete";
  if (renderer === "partial-choropleth") return "admin1-partial";
  return "location";
}

export function publicMapLayerTitleV126(
  elementId: string,
  fallback?: string | null
): string {
  return (
    PUBLIC_MAP_LAYER_TITLES_V126[elementId] ||
    publicMapTargetV138(elementId)?.publicName ||
    publicTextV126(fallback) ||
    "공간자료"
  );
}

export function publicMapAccuracyNoticeV126(
  elementId: string,
  renderer: VietnamMapRendererV124,
  fallback?: string | null
): string {
  const explicit = PUBLIC_MAP_LAYER_ACCURACY_V126[elementId];
  if (explicit) return explicit;
  const safeFallback = publicNoticeWordingV136_1(fallback);
  if (safeFallback) return safeFallback;
  const spatialType = publicMapSpatialTypeV126(renderer);
  if (spatialType === "admin1-complete") {
    return "원자료는 개편 전 63개 성·시 기준이며(34개 경계에서는 자료별 집계 규칙 표시), 원천에 없는 값은 0으로 바꾸지 않습니다.";
  }
  if (spatialType === "admin1-partial") {
    return "실제 값이 공개된 성·시만 표시하며, 미제공 지역은 0으로 바꾸지 않습니다.";
  }
  return "원천에서 공개한 위치가 있는 항목만 표시합니다.";
}

export function publicMapLayerCopyV126(
  input: PublicMapLayerCopyInputV126
): PublicMapLayerCopyV126 {
  const spatialType = publicMapSpatialTypeV126(input.renderer);
  const spatialCopy = PUBLIC_MAP_SPATIAL_TYPE_COPY_V126[spatialType];
  const spatialTypeLabelKo =
    spatialType === "location"
      ? ["C-025", "D-018"].includes(input.elementId)
        ? "사업 위치"
        : "시설 위치"
      : spatialCopy.labelKo;
  return {
    titleKo: publicMapLayerTitleV126(input.elementId, input.title),
    spatialType,
    spatialTypeLabelKo,
    spatialTypeDescriptionKo: spatialCopy.descriptionKo,
    accuracyNoticeKo: publicMapAccuracyNoticeV126(
      input.elementId,
      input.renderer,
      input.accuracyNotice
    ),
  };
}

function clampPublicMapOpacityV126(value: number): number {
  if (!Number.isFinite(value)) return 0.52;
  return Math.min(1, Math.max(0.15, value));
}

/**
 * V136 compact summaries for the map dataset list.
 *
 * The left panel is narrow, so an item states its subject once in the title and
 * then only what the map lets the reader do with it. The fuller sentences in
 * PUBLIC_MAP_DATA_FUNCTION_V135 stay in the guide table, where there is room
 * for them and the reader is comparing datasets rather than picking one.
 */
export const PUBLIC_MAP_DATA_ITEM_SUMMARY_V136: Readonly<
  Record<string, string>
> = Object.freeze({
  "A-023": "입지·발전원·설비용량 분포",
  "A-024": "선로 경로·전압별 분포",
  "C-016": "성·시별 계획용량",
  "B-021": "권역별 취약성 수준",
  "B-031": "성·시별 산림면적",
  "B-032": "성·시별 수관피복률",
  "B-033": "지역별 손실·연도 변화",
  "B-034": "저장·배출·흡수량",
  "B-048": "위치·광종 분포",
  "C-025": "위치·유형별 분포",
  "D-008": "성·시별 기후예산 규모",
  "D-018": "참여지역·활동지역",
});

export function publicMapDataItemSummaryV136(elementId: string): string {
  const explicit = PUBLIC_MAP_DATA_ITEM_SUMMARY_V136[elementId];
  if (explicit) return explicit;
  const target = publicMapTargetV138(elementId);
  return target?.displaySpatialUnit || "지도 표시 범위";
}
