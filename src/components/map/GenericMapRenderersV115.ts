import type { MapRendererV115 } from "../../data/map/mapLayerRegistryV115";

export interface GenericMapRendererDefinitionV115 {
  id: MapRendererV115;
  label: string;
  mapLibreType: "fill" | "circle" | "line" | "symbol" | "none";
  requiresVerifiedCoordinates: boolean;
  supportsClustering: boolean;
  supportsTimeline: boolean;
  publicMeaning: string;
}

export const ChoroplethLayer: GenericMapRendererDefinitionV115 = {
  id: "choropleth",
  label: "국가색",
  mapLibreType: "fill",
  requiresVerifiedCoordinates: false,
  supportsClustering: false,
  supportsTimeline: true,
  publicMeaning: "국가별 비율·지수·수준 차이를 색으로 비교",
};

export const ProportionalBubbleLayer: GenericMapRendererDefinitionV115 = {
  id: "proportional-bubble",
  label: "비례 원형",
  mapLibreType: "circle",
  requiresVerifiedCoordinates: false,
  supportsClustering: false,
  supportsTimeline: true,
  publicMeaning: "국가별 절대량의 크기를 원형 크기로 비교",
};

export const AggregateBubbleLayer: GenericMapRendererDefinitionV115 = {
  id: "aggregate-bubble",
  label: "국가 집계",
  mapLibreType: "circle",
  requiresVerifiedCoordinates: false,
  supportsClustering: false,
  supportsTimeline: true,
  publicMeaning: "개별 위치가 없는 사업·지원 정보를 국가 단위 건수로 표시",
};

export const VerifiedPointLayer: GenericMapRendererDefinitionV115 = {
  id: "verified-point",
  label: "실제 위치",
  mapLibreType: "circle",
  requiresVerifiedCoordinates: true,
  supportsClustering: false,
  supportsTimeline: true,
  publicMeaning: "위도·경도가 확인된 시설·사업·기관의 실제 위치",
};

export const ClusterPointLayer: GenericMapRendererDefinitionV115 = {
  id: "cluster-point",
  label: "위치 군집",
  mapLibreType: "circle",
  requiresVerifiedCoordinates: true,
  supportsClustering: true,
  supportsTimeline: true,
  publicMeaning: "실제 위치가 많은 경우 확대수준에 따라 묶어서 표시",
};

export const RasterLayer: GenericMapRendererDefinitionV115 = {
  id: "raster",
  label: "공간분포",
  mapLibreType: "fill",
  requiresVerifiedCoordinates: false,
  supportsClustering: false,
  supportsTimeline: true,
  publicMeaning: "기후·자원·환경의 격자 또는 연속 공간분포",
};

export const FlowLayer: GenericMapRendererDefinitionV115 = {
  id: "flow",
  label: "흐름",
  mapLibreType: "line",
  requiresVerifiedCoordinates: false,
  supportsClustering: false,
  supportsTimeline: true,
  publicMeaning: "공여·교역·협력 등 국가·기관 간 방향과 규모",
};

export const CategoricalOutlineLayer: GenericMapRendererDefinitionV115 = {
  id: "categorical-outline",
  label: "상태 구분",
  mapLibreType: "line",
  requiresVerifiedCoordinates: false,
  supportsClustering: false,
  supportsTimeline: true,
  publicMeaning: "법·정책·제도 등 범주형 상태를 국가 외곽선과 기호로 구분",
};

export const LineLayer: GenericMapRendererDefinitionV115 = {
  id: "line",
  label: "선형 위치",
  mapLibreType: "line",
  requiresVerifiedCoordinates: true,
  supportsClustering: false,
  supportsTimeline: true,
  publicMeaning: "전력망·도로·하천 등 실제 선형 공간정보",
};

export const FILTER_RENDERER_V115: GenericMapRendererDefinitionV115 = {
  id: "filter",
  label: "지도 필터",
  mapLibreType: "none",
  requiresVerifiedCoordinates: false,
  supportsClustering: false,
  supportsTimeline: false,
  publicMeaning: "다른 수요·사업 레이어를 조건별로 좁혀 보기",
};

export const PANEL_RENDERER_V115: GenericMapRendererDefinitionV115 = {
  id: "panel",
  label: "국가 상세정보",
  mapLibreType: "none",
  requiresVerifiedCoordinates: false,
  supportsClustering: false,
  supportsTimeline: false,
  publicMeaning: "국가 선택 후 문서·절차·기관·근거를 상세 패널에서 확인",
};

export const NONE_RENDERER_V115: GenericMapRendererDefinitionV115 = {
  id: "none",
  label: "지도 표시 없음",
  mapLibreType: "none",
  requiresVerifiedCoordinates: false,
  supportsClustering: false,
  supportsTimeline: false,
  publicMeaning: "공간적 의미를 부여하지 않고 데이터 상세화면에서 확인",
};

export const MAP_RENDERER_DEFINITIONS_V115: GenericMapRendererDefinitionV115[] =
  [
    ChoroplethLayer,
    ProportionalBubbleLayer,
    AggregateBubbleLayer,
    VerifiedPointLayer,
    ClusterPointLayer,
    RasterLayer,
    FlowLayer,
    CategoricalOutlineLayer,
    LineLayer,
    FILTER_RENDERER_V115,
    PANEL_RENDERER_V115,
    NONE_RENDERER_V115,
  ];

export function getRendererDefinitionV115(
  renderer: MapRendererV115
): GenericMapRendererDefinitionV115 {
  return (
    MAP_RENDERER_DEFINITIONS_V115.find((item) => item.id === renderer) ??
    NONE_RENDERER_V115
  );
}
