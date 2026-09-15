import {
  PUBLIC_MAP_TARGETS_V138,
} from "../visualization/publicMapWorkspaceV126";
import type { PublicMapTargetV138 } from "../visualization/publicMapWorkspaceV126";

/**
 * One count of map datasets for every screen (V140).
 *
 * The home, the map list, the map guide and the release audits used to count
 * map datasets from different places - the target contract (43), the map
 * index (42), a manifest field - and a reader met "43개" on one screen and
 * "42개" on the next. This is the single rule: a dataset is a map dataset
 * when `map-index.json` carries an active, enabled layer for it. The target
 * contract only contributes the targets that are still waiting for spatial
 * data, so the map list can say what is pending and why.
 */
export interface MapLayerLikeV140 {
  elementId: string;
  active?: boolean;
  enabled?: boolean;
}

export interface MapPendingTargetV140 {
  elementId: string;
  publicName: string;
  category: string;
  reason: string;
  requiredAsset: string | null;
}

export interface MapAvailabilityV140 {
  /** Layers the map index publishes as active and enabled. */
  connectedCount: number;
  /** Contract targets without a connected layer. */
  pendingCount: number;
  /** Contract targets, connected or not. */
  targetCount: number;
  connectedIds: readonly string[];
  pending: readonly MapPendingTargetV140[];
}

export function isConnectedMapLayerV140(layer: MapLayerLikeV140): boolean {
  return layer.active !== false && layer.enabled !== false;
}

export function summarizeMapAvailabilityV140(
  layers: readonly MapLayerLikeV140[]
): MapAvailabilityV140 {
  const connectedIds = layers
    .filter(isConnectedMapLayerV140)
    .map((layer) => layer.elementId);
  const connected = new Set(connectedIds);
  const pending = PUBLIC_MAP_TARGETS_V138.filter(
    (target) => !connected.has(target.elementId)
  ).map(describePendingTargetV140);
  return {
    connectedCount: connectedIds.length,
    pendingCount: pending.length,
    targetCount: PUBLIC_MAP_TARGETS_V138.length,
    connectedIds,
    pending,
  };
}

function describePendingTargetV140(
  target: PublicMapTargetV138
): MapPendingTargetV140 {
  return {
    elementId: target.elementId,
    publicName: target.publicName,
    category: target.category,
    reason: target.build.reason || "위치·경계 자료가 확인되지 않았습니다.",
    requiredAsset: target.build.requiredAsset || null,
  };
}

/** The list's short status for a target that has no layer yet. */
export const MAP_PENDING_LABEL_V140 = "준비 중";
export const MAP_PENDING_SUMMARY_V140 = "위치자료 없음 · 지도에 표시하지 않음";
