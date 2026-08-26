import { GCF_METRIC_DEFINITIONS } from "./gcf/gcfCountryPortfolio";
import { INDICATOR_CONFIGS } from "./indicators/registry";
import type { IndicatorId } from "./indicators/registry";
import type { GcfMetricId } from "../types/gcf";
import type { CompareNavigationTarget } from "../types/compare";
import type {
  MapLayerId,
  MapOverlayId,
  MapPolicyOverlayId,
} from "../types/map";

export type MapLayerGroupId =
  | "indicator"
  | "climate"
  | "technology"
  | "policy"
  | "finance";

export interface MapLayerDefinition {
  id: MapLayerId;
  group: MapLayerGroupId;
  title: string;
  shortTitle: string;
  description: string;
  unit: string;
  source: string;
  referencePeriod: string;
  license: string;
  datasetId?: string;
  planningTechnologyId?: string;
  indicatorId?: IndicatorId;
  gcfMetricId?: GcfMetricId;
  ndcTechnologyId?: string;
}

export interface MapLayerGroupDefinition {
  id: MapLayerGroupId;
  labelKo: string;
  descriptionKo: string;
  iconClass: string;
}

/**
 * 이용자가 실제로 클릭하는 단일 지도 데이터 목록의 항목.
 *
 * renderMode는 화면에 표시할 기술 용어가 아니라 MapLibre 표현방식을 정하는 내부 값이다.
 * - fill: 국가별 choropleth 레이어
 * - bubble: 국가 단위 규모를 원형 심볼로 중첩
 * - point: 정책 메타데이터를 점 심볼로 중첩
 *
 * v85부터 동일 renderMode도 복수 선택 가능하다. 이용자가 목록에서 클릭한 모든 데이터는
 * 독립 MapLibre layer로 누적되며, 같은 항목을 다시 클릭하면 해당 layer만 제거된다.
 * 여러 polygon layer는 개별 투명도와 추가 순서(z-order)로 함께 확인한다.
 */
export type MapCatalogRenderMode = "fill" | "bubble" | "point";

export interface MapCatalogItemDefinition {
  key: string;
  group: MapLayerGroupId;
  title: string;
  shortTitle: string;
  description: string;
  unit: string;
  source: string;
  referencePeriod: string;
  license: string;
  renderMode: MapCatalogRenderMode;
  /** 이용자에게 보여주는 지도 표현명 */
  visualLabelKo: string;
  /** 왜 이 표현을 사용하는지 설명하는 짧은 문구 */
  visualReasonKo: string;
  /** 비례원/점 심볼의 기본 색상 */
  symbolColor?: string;
  layerId?: MapLayerId;
  overlayId?: Exclude<MapOverlayId, "none">;
  policyOverlayId?: Exclude<MapPolicyOverlayId, "none">;
  datasetId?: string;
  planningTechnologyId?: string;
  compareTarget?: CompareNavigationTarget;
}

const PLANNING_TECHNOLOGY_BY_LAYER_ID: Partial<Record<MapLayerId, string>> = {
  solarPvout: "solar-pv",
  solarGhi: "solar-pv",
  gridLosses: "power-integration",
  ndcPowerGrid: "power-integration",
  ndcWater: "water",
};

const NDC_DATASET_ID = "LDC-DS-C-001";
const GCF_COUNTRY_PORTFOLIO_DATASET_ID = "LDC-DS-E-002";

export const MAP_LAYER_GROUPS: MapLayerGroupDefinition[] = [
  {
    id: "indicator",
    labelKo: "국가 기본여건",
    descriptionKo: "인구·경제·에너지 접근·전력망 등 국가 단위 기초 여건",
    iconClass: "context",
  },
  {
    id: "climate",
    labelKo: "기후위험",
    descriptionKo: "기후 노출·위험 관련 국가 단위 자료",
    iconClass: "climate",
  },
  {
    id: "technology",
    labelKo: "기술 잠재력",
    descriptionKo: "기후기술 적용여건을 검토하는 자원·잠재량 자료",
    iconClass: "technology",
  },
  {
    id: "policy",
    labelKo: "정책·NDC",
    descriptionKo: "공식 NDC에서 확인된 기술·수단 및 제출 메타데이터",
    iconClass: "policy",
  },
  {
    id: "finance",
    labelKo: "사업·재원",
    descriptionKo: "국가 단위 GCF 사업·재원 현황",
    iconClass: "finance",
  },
];

/**
 * 기존 지도 연산에서 사용하는 레이어 레지스트리.
 * GCF 지표도 기존 공유 URL 및 상세 계산 호환성을 위해 유지한다.
 */
export const MAP_LAYERS: MapLayerDefinition[] = [
  ...INDICATOR_CONFIGS.map((config) => ({
    id: config.mapLayerId,
    group:
      config.mapGroup ??
      (config.id === "heat-index-hi35"
        ? ("climate" as const)
        : ("indicator" as const)),
    title: config.mapTitleKo,
    shortTitle: config.mapShortTitleKo,
    description:
      config.id === "electricity-access"
        ? "전력 접근률을 기준으로 계산한 국가별 미접근 비율"
        : config.id === "clean-cooking-access"
        ? "청정조리 접근률을 기준으로 계산한 국가별 미접근 비율"
        : config.mapDescriptionKo || config.definition.description,
    unit: config.valueMode === "gap-to-100" ? "%p" : config.definition.unit,
    source: config.definition.sourceOrganization,
    referencePeriod: config.referencePeriodLabel ?? "선택 기준연도",
    license: config.definition.license,
    datasetId: config.datasetId,
    planningTechnologyId: PLANNING_TECHNOLOGY_BY_LAYER_ID[config.mapLayerId],
    indicatorId: config.id,
  })),
  {
    id: "ndcRenewableEnergy",
    group: "policy",
    title: "NDC 재생에너지 관련 근거",
    shortTitle: "NDC 재생에너지",
    description: "최신 공식 NDC의 재생에너지 기술·수단 명시 상태",
    unit: "분류",
    source: "UNFCCC NDC Registry",
    referencePeriod: "국가별 최신 검토 NDC",
    license: "공식 문서 이용조건 적용",
    datasetId: NDC_DATASET_ID,
    ndcTechnologyId: "renewable-energy",
  },
  {
    id: "ndcPowerGrid",
    group: "policy",
    title: "NDC 전력망 관련 근거",
    shortTitle: "NDC 전력망",
    description: "최신 공식 NDC의 전력망 기술·수단 명시 상태",
    unit: "분류",
    source: "UNFCCC NDC Registry",
    referencePeriod: "국가별 최신 검토 NDC",
    license: "공식 문서 이용조건 적용",
    datasetId: NDC_DATASET_ID,
    planningTechnologyId: "power-integration",
    ndcTechnologyId: "power-grid",
  },
  {
    id: "ndcEnergyEfficiency",
    group: "policy",
    title: "NDC 에너지효율 관련 근거",
    shortTitle: "NDC 에너지효율",
    description: "최신 공식 NDC의 에너지효율 기술·수단 명시 상태",
    unit: "분류",
    source: "UNFCCC NDC Registry",
    referencePeriod: "국가별 최신 검토 NDC",
    license: "공식 문서 이용조건 적용",
    datasetId: NDC_DATASET_ID,
    ndcTechnologyId: "energy-efficiency",
  },
  {
    id: "ndcWater",
    group: "policy",
    title: "NDC 수자원 관련 근거",
    shortTitle: "NDC 수자원",
    description: "최신 공식 NDC의 수자원 적응 기술·수단 명시 상태",
    unit: "분류",
    source: "UNFCCC NDC Registry",
    referencePeriod: "국가별 최신 검토 NDC",
    license: "공식 문서 이용조건 적용",
    datasetId: NDC_DATASET_ID,
    planningTechnologyId: "water",
    ndcTechnologyId: "water",
  },
  ...GCF_METRIC_DEFINITIONS.map((definition) => ({
    id: definition.id,
    group: "finance" as const,
    title: definition.titleKo,
    shortTitle: definition.shortTitleKo,
    description: definition.descriptionKo,
    unit: definition.unit,
    source: "Green Climate Fund",
    referencePeriod: "2026-07-31 exact · 2026-08-13 공식 페이지 검증",
    license: "GCF 웹사이트 이용조건 적용 · 재배포 조건 검토 필요",
    datasetId: GCF_COUNTRY_PORTFOLIO_DATASET_ID,
    gcfMetricId: definition.id,
  })),
];

export const MAP_LAYER_BY_ID = new Map(
  MAP_LAYERS.map((layer) => [layer.id, layer])
);

const BUBBLE_INDICATOR_IDS = new Set<IndicatorId>([
  "population-total",
  "gdp-current",
]);

const DIVERGING_INDICATOR_IDS = new Set<IndicatorId>([
  "population-growth",
  "gdp-growth",
]);

const INDICATOR_SYMBOL_COLORS: Partial<Record<IndicatorId, string>> = {
  "population-total": "#0f766e",
  "gdp-current": "#2563eb",
};

function getLayerVisualStrategy(
  layer: MapLayerDefinition
): Pick<
  MapCatalogItemDefinition,
  "renderMode" | "visualLabelKo" | "visualReasonKo" | "symbolColor"
> {
  if (layer.ndcTechnologyId) {
    return {
      renderMode: "point",
      visualLabelKo: "정책 상태 점",
      visualReasonKo:
        "정책 포함 여부는 국가 면을 덮지 않도록 국가 중심 점으로 표시",
      symbolColor: "#1f9d55",
    };
  }

  if (layer.indicatorId && BUBBLE_INDICATOR_IDS.has(layer.indicatorId)) {
    return {
      renderMode: "bubble",
      visualLabelKo: "비례 원",
      visualReasonKo:
        "총량·규모 자료는 국가 면적의 영향을 줄이기 위해 원 크기로 비교",
      symbolColor: INDICATOR_SYMBOL_COLORS[layer.indicatorId] ?? "#2563eb",
    };
  }

  if (layer.indicatorId && DIVERGING_INDICATOR_IDS.has(layer.indicatorId)) {
    return {
      renderMode: "fill",
      visualLabelKo: "증감 색상",
      visualReasonKo: "증가·감소 방향과 크기를 국가별 색상으로 비교",
    };
  }

  return {
    renderMode: "fill",
    visualLabelKo: "단계 색상",
    visualReasonKo: "비율·지수·잠재량을 국가별 단계색으로 비교",
  };
}

/**
 * 공개 UI의 단일 레이어 카탈로그.
 *
 * 중요
 * - 모든 항목은 독립 레이어이며 클릭할 때마다 누적된다
 * - 동일 항목 재클릭 시 해당 레이어만 제거된다
 * - 데이터 의미에 따라 표현을 자동 결정한다: 비율·지수·잠재량=단계색, 총량·규모=비례원, 증감=발산색, 정책=점
 * - 여러 fill 레이어가 겹칠 수 있으므로 각 행에서 개별 투명도와 z-order를 조정한다
 * - 마지막으로 추가한 레이어가 위에 표시되고, 활성 행의 `맨 위로` 기능으로 순서를 조정할 수 있다
 * - 이용자는 데이터 목록과 활성 레이어 목록을 따로 오가지 않는다
 */
export const MAP_DATA_CATALOG: MapCatalogItemDefinition[] = [
  ...MAP_LAYERS.filter((layer) => !layer.gcfMetricId).map((layer) => {
    const visual = getLayerVisualStrategy(layer);
    return {
      // key는 v83~v86 공유 URL 호환을 위해 유지하며 실제 표현방식은 renderMode가 결정
      key: `fill:${layer.id}`,
      group: layer.group,
      title: layer.title,
      shortTitle: layer.shortTitle,
      description: layer.description,
      unit: layer.unit,
      source: layer.source,
      referencePeriod: layer.referencePeriod,
      license: layer.license,
      ...visual,
      layerId: layer.id,
      datasetId: layer.datasetId,
      planningTechnologyId: layer.planningTechnologyId,
      compareTarget: layer.indicatorId
        ? { tab: "indicator" as const, indicatorId: layer.indicatorId }
        : layer.ndcTechnologyId
        ? { tab: "ndc" as const, ndcTechnologyId: layer.ndcTechnologyId }
        : undefined,
    };
  }),
  ...GCF_METRIC_DEFINITIONS.map((definition) => ({
    key: `bubble:${definition.id}`,
    group: "finance" as const,
    title: definition.titleKo,
    shortTitle: definition.shortTitleKo,
    description: definition.descriptionKo,
    unit: definition.unit,
    source: "Green Climate Fund",
    referencePeriod: "2026-07-31 exact · 2026-08-13 공식 페이지 검증",
    license: "GCF 웹사이트 이용조건 적용 · 재배포 조건 검토 필요",
    renderMode: "bubble" as const,
    visualLabelKo: "비례 원",
    visualReasonKo:
      "사업 수·재원 규모는 원 크기로 비교해 국가 면 색상과 동시에 확인",
    symbolColor: undefined,
    overlayId: definition.id as Exclude<MapOverlayId, "none">,
    datasetId: GCF_COUNTRY_PORTFOLIO_DATASET_ID,
    compareTarget: {
      tab: "gcf" as const,
      gcfMetricId: definition.id,
    },
  })),
  {
    key: "point:ndcSubmissionRecency",
    group: "policy",
    title: "최신 NDC 제출시점",
    shortTitle: "최신 NDC 제출시점",
    description: "국가별 최신 활성 NDC의 제출연도를 점 색상으로 확인",
    unit: "제출연도",
    source: "UNFCCC NDC Registry",
    referencePeriod: "국가별 최신 활성 NDC",
    license: "공식 문서 이용조건 적용",
    renderMode: "point",
    visualLabelKo: "제출시점 점",
    visualReasonKo: "문서 제출시점은 국가 면을 덮지 않는 점 색상으로 표시",
    symbolColor: "#047857",
    policyOverlayId: "ndcSubmissionRecency",
    datasetId: NDC_DATASET_ID,
  },
];

export const MAP_DATA_CATALOG_BY_KEY = new Map(
  MAP_DATA_CATALOG.map((item) => [item.key, item])
);
