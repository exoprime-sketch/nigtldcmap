/**
 * V152: shared types for the map layer renderers (moved from RealMapExplorerPage).
 */
import type { VietnamMapGeoJsonV124 } from "../../data/vietnam/vietnamDataLoaderV124";
import type { VietnamSpatialLayerAssetV124 } from "../../data/vietnam/vietnamTypesV124";
import type { BoundaryPolicyKindV151 } from "../../data/map/boundaryPolicyV151";
import type { BoundarySystemV151 } from "../../data/map/adminBoundaryV151";

export interface SpatialRuntimeAsset {
  geometry: VietnamMapGeoJsonV124;
  data?: VietnamSpatialLayerAssetV124;
}

export type PublicMapSymbolShapeV129 =
  | "area"
  | "circle"
  | "diamond"
  | "triangle"
  | "line"
  | "square";

export interface LayerSelectorState {
  variable: string;
  period: string;
}

/** V151-2: what the outline toggle and the layer's policy resolve to for one render. */
export type BoundaryRenderModeV151 = "63" | "34" | "region-6";

export interface BoundaryRenderContextV151 {
  system: BoundarySystemV151;
  geometry34: VietnamMapGeoJsonV124 | null;
  region6: VietnamMapGeoJsonV124 | null;
}

export interface ChoroplethCollectionV151 {
  collection: GeoJSON.FeatureCollection<GeoJSON.Geometry>;
  minimum: number;
  maximum: number;
  mode: BoundaryRenderModeV151;
  kind: BoundaryPolicyKindV151;
}
