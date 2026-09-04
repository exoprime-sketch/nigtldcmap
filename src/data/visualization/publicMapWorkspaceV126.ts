import type { VietnamMapRendererV124 } from "../vietnam/vietnamTypesV124";
import {
  publicNoticeWordingV136_1,
  publicTextV126,
} from "./publicFieldPolicyV126";

export const PUBLIC_MAP_WORKSPACE_LIMITS_V126 = {
  primaryLayers: 1,
  contextLayers: 1,
  activeLayers: 2,
  selectedFeatures: 1,
} as const;

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
      variable: "annual-tree-cover-loss",
      period: "2025",
    },
    context: [
      {
        elementId: "B-031",
        variable: "tree-cover-area-2010",
        period: "2010",
      },
      { elementId: "B-034", variable: "8fca7c8dd189", period: "2025" },
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
    descriptionKo: "개편 전 63개 성·시 기준으로 지역별 값을 비교합니다.",
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
  "A-024": "송전망 연결구조·전압별 분포 확인",
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
    return "개편 전 63개 성·시 기준이며, 원천에 없는 값은 0으로 바꾸지 않습니다.";
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
  "A-024": "연결구조·전압별 분포",
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
  return PUBLIC_MAP_DATA_ITEM_SUMMARY_V136[elementId] || "지도 표시 범위";
}
