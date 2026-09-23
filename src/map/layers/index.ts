/**
 * V152: one entry point for drawing a data layer on any MapLibre map.
 *
 * The big map (RealMapExplorerPage) and the home/detail mini map draw a layer
 * with the same code: `prepare*` turns the layer contract, the selected slice,
 * the filters and the boundary vintage into GeoJSON plus a render signature
 * (pure), and `mount*` adds the source and the style layers (side effects
 * only). The big map calls the two halves separately because it compares the
 * signature with the mounted one before re-adding; a map without that state
 * calls `renderMapLayerV152`. Pointer handlers stay with the caller: they close
 * over React state that a renderer must not own.
 */
import type { Map as MapLibreMap } from "maplibre-gl";
import type { CountryEntityV122, CountryMapLayerV122 } from "../../data/countries/countryDataTypesV122";
import type { VietnamLocationSidecarV151 } from "../../data/vietnam/vietnamTypesV124";
import type { BoundarySystemV151 } from "../../data/map/adminBoundaryV151";
import { prepareLayerRecordsV138 } from "../../data/map/prepareLayerRecordsV148";
import { getPublicIndicatorVariablePresentationV129 } from "../../data/interpretation/publicIndicatorInterpretationV129";
import { choroplethFillColorV152, mountChoroplethLayersV152 } from "./choroplethLayer";
import { LAYER_COLORS } from "./colors";
import { filterRecords, rendererOf, selectedFilterDimensionsV125, selectorForLayer } from "./contract";
import {
  choroplethFeatureCollectionV151,
  featureCollection,
  lineFeatureCollection,
  statisticalRepresentativePointsV133,
} from "./features";
import { layerRuntimeIds, type MapLayerRuntimeIdsV152 } from "./ids";
import { mountLineLayersV152 } from "./lineLayer";
import { mountPointLayersV152 } from "./pointLayer";
import { mountBudgetContextLayersV152, mountRegionalScopeLayersV152 } from "./regionLayer";
import type {
  BoundaryRenderContextV151,
  ChoroplethCollectionV151,
  LayerSelectorState,
  SpatialRuntimeAsset,
} from "./types";

export const AREA_RENDERERS_V152 = ["line", "admin1-choropleth", "partial-choropleth", "regional-scope"] as const;

/** Whether a renderer draws spatial assets (lines, provinces, regions) rather than entity points. */
export function isAreaRendererV152(renderer: string): boolean {
  return (AREA_RENDERERS_V152 as readonly string[]).includes(renderer);
}

export interface MapLayerRenderOptionsV152 {
  /** V152 point icons (white badge + symbol). Off keeps the V129 circles and shapes. */
  icons?: boolean;
  /** Reserved for the Korean place labels a caller adds around the data layers. */
  labels?: boolean;
  /** Hit and selection layers are always added; callers bind handlers to them. */
  interactive?: boolean;
}

export interface MapAreaLayerPreparedV152 {
  renderer: string;
  selector: LayerSelectorState;
  variablePresentationV129: ReturnType<typeof getPublicIndicatorVariablePresentationV129>;
  isRegionalScope: boolean;
  isBudgetContext: boolean;
  choropleth: ChoroplethCollectionV151 | null;
  data: GeoJSON.FeatureCollection<GeoJSON.Geometry>;
  renderSignature: string;
  fillColor: any;
}

export function prepareAreaLayerV152({
  layer,
  asset,
  selected,
  filters,
  boundary,
  isPrimary,
  color,
}: {
  layer: CountryMapLayerV122;
  asset: SpatialRuntimeAsset;
  selected: LayerSelectorState | undefined;
  filters: Record<string, string>;
  boundary: BoundaryRenderContextV151;
  isPrimary: boolean;
  color: string;
}): MapAreaLayerPreparedV152 {
  const elementId = layer.elementId;
  const renderer = rendererOf(layer);
  const selector = selectorForLayer(layer, selected);
  const variablePresentationV129 =
    getPublicIndicatorVariablePresentationV129(
      elementId,
      selector.variable
    );
  const isRegionalScope = renderer === "regional-scope";
  const isBudgetContext = elementId === "D-008" && !isPrimary;
  const choropleth =
    renderer === "line" || isRegionalScope
      ? null
      : choroplethFeatureCollectionV151(layer, asset, selector, boundary);
  const data =
    renderer === "line"
      ? lineFeatureCollection(layer, asset, selector, filters)
      : isRegionalScope
      ? (asset.geometry as unknown as GeoJSON.FeatureCollection<GeoJSON.Geometry>)
      : isBudgetContext
      ? statisticalRepresentativePointsV133(choropleth!.collection)
      : choropleth!.collection;
  const renderSignature = JSON.stringify({
    renderer,
    selector,
    filters: selectedFilterDimensionsV125(layer, filters),
    featureCount: data.features.length,
    role: isPrimary ? "primary" : "context",
    boundary: choropleth ? `${choropleth.mode}:${choropleth.kind}` : boundary.system,
  });
  const fillColor = choroplethFillColorV152(color, choropleth, isRegionalScope);
  return {
    renderer,
    selector,
    variablePresentationV129,
    isRegionalScope,
    isBudgetContext,
    choropleth,
    data,
    renderSignature,
    fillColor,
  };
}

export function mountAreaLayerV152(
  map: MapLibreMap,
  prepared: MapAreaLayerPreparedV152,
  {
    ids,
    color,
    isPrimary,
    contextIndex,
    roleOpacity,
  }: { ids: MapLayerRuntimeIdsV152; color: string; isPrimary: boolean; contextIndex: number; roleOpacity: number }
): { interactiveLayerId: string; additionalInteractiveLayerId?: string } {
  map.addSource(ids.source, { type: "geojson", data: prepared.data });
  if (prepared.renderer === "line") {
    return { interactiveLayerId: mountLineLayersV152(map, { ids, color, isPrimary, roleOpacity }) };
  }
  if (prepared.isBudgetContext) {
    return { interactiveLayerId: mountBudgetContextLayersV152(map, { ids, color, choropleth: prepared.choropleth }) };
  }
  if (prepared.isRegionalScope) {
    return mountRegionalScopeLayersV152(map, { ids, color, isPrimary });
  }
  return {
    interactiveLayerId: mountChoroplethLayersV152(map, {
      ids,
      color,
      isPrimary,
      contextIndex,
      fillColor: prepared.fillColor,
    }),
  };
}

export interface MapPointLayerPreparedV152 {
  filteredRecords: CountryEntityV122[];
  data: GeoJSON.FeatureCollection<GeoJSON.Point>;
  renderSignature: string;
}

export function preparePointLayerV152({
  layer,
  records,
  filters,
  location,
  isPrimary,
}: {
  layer: CountryMapLayerV122;
  records: CountryEntityV122[];
  filters: Record<string, string>;
  location: { sidecar: VietnamLocationSidecarV151 | undefined; system: BoundarySystemV151 };
  isPrimary: boolean;
}): MapPointLayerPreparedV152 {
  const filteredRecords = filterRecords(records, layer, filters);
  const data = featureCollection(
    filteredRecords,
    layer,
    prepareLayerRecordsV138(records, layer),
    location
  );
  const renderSignature = JSON.stringify({
    filters: selectedFilterDimensionsV125(layer, filters),
    recordCount: filteredRecords.length,
    boundary: location.system,
    located: Boolean(location.sidecar),
    role: isPrimary ? "primary" : "context",
  });
  return { filteredRecords, data, renderSignature };
}

export function mountPointLayerV152(
  map: MapLibreMap,
  prepared: MapPointLayerPreparedV152,
  {
    layer,
    ids,
    color,
    isPrimary,
  }: { layer: CountryMapLayerV122; ids: MapLayerRuntimeIdsV152; color: string; isPrimary: boolean },
  options: MapLayerRenderOptionsV152 = {}
): void {
  mountPointLayersV152(map, { layer, ids, color, isPrimary, data: prepared.data });
}

export interface MapLayerRenderInputV152 {
  countryIso3: string;
  layer: CountryMapLayerV122;
  role: "primary" | "context";
  /** Position among the context layers; ignored for the primary layer. */
  contextIndex?: number;
  /** The chosen variable/period; the contract defaults apply when absent. */
  selected?: LayerSelectorState;
  /** Point filters keyed `${elementId}:${field}` (the big map's filter state). */
  filters: Record<string, string>;
  boundary: BoundaryRenderContextV151;
  /** Line, choropleth and regional-scope layers. */
  spatial?: SpatialRuntimeAsset;
  /** Point and cluster layers. */
  records?: CountryEntityV122[];
  locations?: VietnamLocationSidecarV151;
  color?: string;
}

export interface MapLayerRenderResultV152 {
  ids: MapLayerRuntimeIdsV152;
  renderer: string;
  /** Layers to bind click/hover to. */
  interactiveLayerIds: string[];
  clusterLayerId?: string;
  signature: string;
  data: GeoJSON.FeatureCollection<GeoJSON.Geometry>;
}

interface MapLayerPreparedBaseV152 {
  layer: CountryMapLayerV122;
  ids: MapLayerRuntimeIdsV152;
  renderer: string;
  color: string;
  isPrimary: boolean;
  contextIndex: number;
  roleOpacity: number;
}

/** A layer ready to mount: the GeoJSON it will draw (for extents) and how to draw it. */
export type MapLayerPreparedV152 =
  | (MapLayerPreparedBaseV152 & { kind: "area"; area: MapAreaLayerPreparedV152; data: GeoJSON.FeatureCollection<GeoJSON.Geometry> })
  | (MapLayerPreparedBaseV152 & { kind: "point"; point: MapPointLayerPreparedV152; data: GeoJSON.FeatureCollection<GeoJSON.Geometry> });

/** Pure: null when the data the renderer needs was not supplied. */
export function prepareMapLayerV152(input: MapLayerRenderInputV152): MapLayerPreparedV152 | null {
  const { layer } = input;
  const base: MapLayerPreparedBaseV152 = {
    layer,
    ids: layerRuntimeIds(input.countryIso3, layer.elementId),
    renderer: rendererOf(layer),
    color: input.color || LAYER_COLORS[layer.elementId] || "#176a4b",
    isPrimary: input.role === "primary",
    contextIndex: input.role === "primary" ? -1 : input.contextIndex ?? 0,
    roleOpacity: input.role === "primary" ? 0.88 : 0.36,
  };
  if (isAreaRendererV152(base.renderer)) {
    if (!input.spatial) return null;
    const area = prepareAreaLayerV152({
      layer,
      asset: input.spatial,
      selected: input.selected,
      filters: input.filters,
      boundary: input.boundary,
      isPrimary: base.isPrimary,
      color: base.color,
    });
    return { ...base, kind: "area", area, data: area.data };
  }
  if (!input.records) return null;
  const point = preparePointLayerV152({
    layer,
    records: input.records,
    filters: input.filters,
    location: { sidecar: input.locations, system: input.boundary.system },
    isPrimary: base.isPrimary,
  });
  return { ...base, kind: "point", point, data: point.data };
}

/** Side effects only: adds the prepared layer's source and style layers. */
export function mountPreparedMapLayerV152(
  map: MapLibreMap,
  prepared: MapLayerPreparedV152,
  options: MapLayerRenderOptionsV152 = {}
): MapLayerRenderResultV152 {
  const { ids, renderer, color, isPrimary, contextIndex, roleOpacity, layer } = prepared;
  if (prepared.kind === "area") {
    const mounted = mountAreaLayerV152(map, prepared.area, { ids, color, isPrimary, contextIndex, roleOpacity });
    return {
      ids,
      renderer,
      interactiveLayerIds: [mounted.interactiveLayerId, mounted.additionalInteractiveLayerId].filter(
        (id): id is string => Boolean(id)
      ),
      signature: prepared.area.renderSignature,
      data: prepared.data,
    };
  }
  mountPointLayerV152(map, prepared.point, { layer, ids, color, isPrimary }, options);
  return {
    ids,
    renderer,
    interactiveLayerIds: [ids.pointHit],
    clusterLayerId: layer.cluster ? ids.cluster : undefined,
    signature: prepared.point.renderSignature,
    data: prepared.data,
  };
}

/**
 * Draws one layer on a map that does not track render signatures (the mini
 * map). Returns null when the data the renderer needs was not supplied.
 */
export function renderMapLayerV152(
  map: MapLibreMap,
  input: MapLayerRenderInputV152,
  options: MapLayerRenderOptionsV152 = {}
): MapLayerRenderResultV152 | null {
  const prepared = prepareMapLayerV152(input);
  return prepared ? mountPreparedMapLayerV152(map, prepared, options) : null;
}

export * from "./types";
export * from "./colors";
export * from "./baseStyle";
export * from "./ids";
export * from "./contract";
export * from "./features";
export * from "./symbols";
export * from "./boundaryLayer";
