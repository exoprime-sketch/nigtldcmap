/**
 * V152: runtime ids of a data layer's MapLibre sources/layers, their draw order
 * and their removal (moved from RealMapExplorerPage).
 */
import type { Map as MapLibreMap, MapLayerMouseEvent } from "maplibre-gl";

export interface LayerHandlers {
  interactiveLayerId: string;
  additionalInteractiveLayerId?: string;
  clusterLayerId?: string;
  onClick: (event: MapLayerMouseEvent) => void;
  onEnter: (event: MapLayerMouseEvent) => void;
  onMove?: (event: MapLayerMouseEvent) => void;
  onPointLeave: () => void;
  onClusterClick?: (event: MapLayerMouseEvent) => void;
  onClusterEnter?: (event: MapLayerMouseEvent) => void;
  onClusterMove?: (event: MapLayerMouseEvent) => void;
  onClusterLeave?: () => void;
}

export function runtimeKey(countryIso3: string, elementId: string): string {
  return `${countryIso3}:${elementId}`;
}

export function layerRuntimeIds(countryIso3: string, elementId: string) {
  const suffix = `${countryIso3}-${elementId}`
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "-");
  return {
    source: `v122-source-${suffix}`,
    point: `v122-point-${suffix}`,
    pointHit: `v126-point-hit-${suffix}`,
    pointSelection: `v130-point-selection-${suffix}`,
    cluster: `v122-cluster-${suffix}`,
    clusterCount: `v126-cluster-count-${suffix}`,
    pointSymbol: `v129-point-symbol-${suffix}`,
    line: `v124-line-${suffix}`,
    lineHit: `v126-line-hit-${suffix}`,
    fill: `v124-fill-${suffix}`,
    outline: `v124-outline-${suffix}`,
    selection: `v126-selection-${suffix}`,
    // V152 icon mode (white badge + glyph); absent when a layer is drawn without icons.
    pointHover: `v152-point-hover-${suffix}`,
    pointTag: `v152-point-tag-${suffix}`,
    clusterIcon: `v152-cluster-icon-${suffix}`,
  };
}

export function moveMapDataLayersV126(
  map: MapLibreMap,
  countryIso3: string,
  orderedElementIds: string[]
): void {
  orderedElementIds.forEach((elementId) => {
    const ids = layerRuntimeIds(countryIso3, elementId);
    [
      ids.fill,
      ids.outline,
      ids.cluster,
      ids.clusterCount,
      ids.clusterIcon,
      ids.point,
      ids.pointSymbol,
      ids.pointTag,
      ids.pointHover,
      ids.pointSelection,
      ids.line,
      ids.pointHit,
      ids.lineHit,
      ids.selection,
    ].forEach((layerId) => {
      if (map.getLayer(layerId)) map.moveLayer(layerId);
    });
  });
}

export function removeLayerFromMap(
  map: MapLibreMap,
  countryIso3: string,
  elementId: string,
  handlers: Record<string, LayerHandlers>
) {
  const ids = layerRuntimeIds(countryIso3, elementId);
  const key = runtimeKey(countryIso3, elementId);
  const handler = handlers[key];
  if (handler) {
    if (map.getLayer(handler.interactiveLayerId)) {
      map.off("click", handler.interactiveLayerId, handler.onClick);
      map.off("mouseenter", handler.interactiveLayerId, handler.onEnter);
      if (handler.onMove) {
        map.off("mousemove", handler.interactiveLayerId, handler.onMove);
      }
      map.off("mouseleave", handler.interactiveLayerId, handler.onPointLeave);
    }
    if (
      handler.additionalInteractiveLayerId &&
      map.getLayer(handler.additionalInteractiveLayerId)
    ) {
      map.off("click", handler.additionalInteractiveLayerId, handler.onClick);
      map.off(
        "mouseenter",
        handler.additionalInteractiveLayerId,
        handler.onEnter
      );
      if (handler.onMove) {
        map.off(
          "mousemove",
          handler.additionalInteractiveLayerId,
          handler.onMove
        );
      }
      map.off(
        "mouseleave",
        handler.additionalInteractiveLayerId,
        handler.onPointLeave
      );
    }
    if (
      handler.clusterLayerId &&
      handler.onClusterClick &&
      map.getLayer(handler.clusterLayerId)
    ) {
      map.off("click", handler.clusterLayerId, handler.onClusterClick);
    }
    if (handler.clusterLayerId && map.getLayer(handler.clusterLayerId)) {
      if (handler.onClusterEnter) {
        map.off("mouseenter", handler.clusterLayerId, handler.onClusterEnter);
      }
      if (handler.onClusterMove) {
        map.off("mousemove", handler.clusterLayerId, handler.onClusterMove);
      }
      if (handler.onClusterLeave) {
        map.off("mouseleave", handler.clusterLayerId, handler.onClusterLeave);
      }
    }
    delete handlers[key];
  }
  [
    ids.selection,
    ids.pointSelection,
    ids.pointHover,
    ids.pointTag,
    ids.clusterIcon,
    ids.clusterCount,
    ids.pointHit,
    ids.pointSymbol,
    ids.point,
    ids.cluster,
    ids.lineHit,
    ids.line,
    ids.fill,
    ids.outline,
  ].forEach((id) => {
    if (map.getLayer(id)) map.removeLayer(id);
  });
  if (map.getSource(ids.source)) map.removeSource(ids.source);
}

/** The runtime ids of one data layer (source, drawn layers, hit and selection layers). */
export type MapLayerRuntimeIdsV152 = ReturnType<typeof layerRuntimeIds>;
