/**
 * V152: the mini map's state machine, its single-instance rule and its map
 * options - pure, so they are unit-tested without a browser or MapLibre.
 *
 * The mini map starts as the static SVG (fast first paint, print, no-JS and
 * no-WebGL fallback) and becomes a MapLibre map only on a reader's intent:
 * a mouse resting on it, keyboard focus, a touch, a click or a control
 * button. Nothing turns it on by time alone (user decision 2026-09-24), and it
 * gives the engine back when it leaves the viewport or another mini map starts.
 */
import { VIETNAM_CORE_BBOX_V151 } from "../../data/map/mapBackdropV151";
import type { MapCameraV151 } from "../../types/map";

export type MiniMapStateV152 = "static" | "loading" | "active" | "error";

export type MiniMapIntentV152 = "hover" | "focus" | "pointer" | "touch" | "click" | "button" | "wheel";

export type MiniMapEventV152 =
  | { type: "intent"; source: MiniMapIntentV152 }
  | { type: "ready" }
  | { type: "fail" }
  | { type: "offscreen" }
  | { type: "preempted" };

export interface MiniMapMachineV152 {
  state: MiniMapStateV152;
  /** Failed starts so far; one retry is allowed on the next intent. */
  failures: number;
  lastIntent: MiniMapIntentV152 | null;
}

export const MINIMAP_INITIAL_V152: MiniMapMachineV152 = { state: "static", failures: 0, lastIntent: null };

/** Only an intent starts the engine; offscreen or a newer mini map returns it to static. */
export function miniMapReducerV152(machine: MiniMapMachineV152, event: MiniMapEventV152): MiniMapMachineV152 {
  switch (event.type) {
    case "intent":
      if (machine.state === "static" || (machine.state === "error" && machine.failures < 2)) {
        return { ...machine, state: "loading", lastIntent: event.source };
      }
      return machine;
    case "ready":
      return machine.state === "loading" ? { ...machine, state: "active" } : machine;
    case "fail":
      return machine.state === "loading" ? { ...machine, state: "error", failures: machine.failures + 1 } : machine;
    case "offscreen":
    case "preempted":
      return machine.state === "loading" || machine.state === "active" ? { ...machine, state: "static" } : machine;
    default:
      return machine;
  }
}

/**
 * One engine per page. `claim` releases every other holder and returns the
 * function that gives the slot back.
 */
const holders = new Set<() => void>();

export function claimMiniMapSlotV152(release: () => void): () => void {
  for (const other of Array.from(holders)) {
    if (other !== release) {
      holders.delete(other);
      other();
    }
  }
  holders.add(release);
  return () => {
    holders.delete(release);
  };
}

export function miniMapSlotCountV152(): number {
  return holders.size;
}

export type BboxV152 = [west: number, south: number, east: number, north: number];

export const MINIMAP_ZOOM_V152 = { min: 4, max: 12 } as const;
export const MINIMAP_FIT_PADDING_V152 = 24;
/** Below the max zoom (12), so every clustered site can be reached in the mini map. */
export const MINIMAP_CLUSTER_MAX_ZOOM_V152 = 11;
export const MINIMAP_BOUNDS_MARGIN_DEG_V152 = 2;
export const MINIMAP_HOVER_INTENT_MS_V152 = 300;
export const MINIMAP_OFFSCREEN_RELEASE_MS_V152 = 500;

/** The extent of every coordinate in a GeoJSON collection, or null when it has none. */
export function featureBboxV152(collection: GeoJSON.FeatureCollection | null | undefined): BboxV152 | null {
  let west = Infinity;
  let south = Infinity;
  let east = -Infinity;
  let north = -Infinity;
  const visit = (value: unknown) => {
    if (!Array.isArray(value)) return;
    if (value.length >= 2 && typeof value[0] === "number" && typeof value[1] === "number") {
      const [x, y] = value as [number, number];
      if (!Number.isFinite(x) || !Number.isFinite(y)) return;
      west = Math.min(west, x);
      east = Math.max(east, x);
      south = Math.min(south, y);
      north = Math.max(north, y);
      return;
    }
    value.forEach(visit);
  };
  const visitGeometry = (geometry: GeoJSON.Geometry | null | undefined) => {
    if (!geometry) return;
    if (geometry.type === "GeometryCollection") geometry.geometries.forEach(visitGeometry);
    else visit(geometry.coordinates);
  };
  for (const feature of collection?.features || []) visitGeometry(feature.geometry);
  return Number.isFinite(west) ? [west, south, east, north] : null;
}

/**
 * Where the map first looks (the layer's own extent, else the country) and how
 * far it may pan (the country and the layer, plus a 2-degree margin) so a
 * reader cannot drag Viet Nam off screen for good.
 */
export function miniMapBoundsV152(layerBbox: BboxV152 | null): { fit: BboxV152; max: BboxV152 } {
  const core = VIETNAM_CORE_BBOX_V151;
  const fit: BboxV152 = layerBbox && layerBbox[0] < layerBbox[2] && layerBbox[1] < layerBbox[3]
    ? layerBbox
    : [core.west, core.south, core.east, core.north];
  const union: BboxV152 = [
    Math.min(core.west, fit[0]),
    Math.min(core.south, fit[1]),
    Math.max(core.east, fit[2]),
    Math.max(core.north, fit[3]),
  ];
  const m = MINIMAP_BOUNDS_MARGIN_DEG_V152;
  return {
    fit,
    max: [
      Math.max(-180, union[0] - m),
      Math.max(-85, union[1] - m),
      Math.min(180, union[2] + m),
      Math.min(85, union[3] + m),
    ],
  };
}

/** MapLibre's own words, in Korean (gesture hints and the canvas name). */
export const MINIMAP_LOCALE_V152: Record<string, string> = {
  "CooperativeGesturesHandler.WindowsHelpText": "Ctrl+스크롤로 지도를 확대·축소합니다",
  "CooperativeGesturesHandler.MacHelpText": "⌘+스크롤로 지도를 확대·축소합니다",
  "CooperativeGesturesHandler.MobileHelpText": "두 손가락으로 지도를 움직입니다",
  "Map.Title": "지도",
  "Popup.Close": "팝업 닫기",
};

export interface MiniMapOptionsV152 {
  container: HTMLElement;
  style: unknown;
  bounds?: [[number, number], [number, number]];
  fitBoundsOptions?: { padding: number };
  center?: [number, number];
  zoom?: number;
  maxBounds: [[number, number], [number, number]];
  minZoom: number;
  maxZoom: number;
  cooperativeGestures: true;
  dragRotate: false;
  pitchWithRotate: false;
  touchPitch: false;
  attributionControl: false;
  locale: Record<string, string>;
}

/**
 * Map options: page scroll is never captured (cooperative gestures - Ctrl or
 * two fingers to move the map), no rotation or tilt, zoom 4-12, bounded pan.
 * A remembered camera (the reader's last view) wins over the initial fit.
 */
export function miniMapOptionsV152(
  container: HTMLElement,
  style: unknown,
  bounds: { fit: BboxV152; max: BboxV152 },
  camera: MapCameraV151 | null
): MiniMapOptionsV152 {
  const pair = (b: BboxV152): [[number, number], [number, number]] => [[b[0], b[1]], [b[2], b[3]]];
  const base = {
    container,
    style,
    maxBounds: pair(bounds.max),
    minZoom: MINIMAP_ZOOM_V152.min,
    maxZoom: MINIMAP_ZOOM_V152.max,
    cooperativeGestures: true as const,
    dragRotate: false as const,
    pitchWithRotate: false as const,
    touchPitch: false as const,
    attributionControl: false as const,
    locale: MINIMAP_LOCALE_V152,
  };
  if (camera) {
    const zoom = Math.min(MINIMAP_ZOOM_V152.max, Math.max(MINIMAP_ZOOM_V152.min, camera.zoom));
    return { ...base, center: [camera.lng, camera.lat], zoom };
  }
  return { ...base, bounds: pair(bounds.fit), fitBoundsOptions: { padding: MINIMAP_FIT_PADDING_V152 } };
}

export interface MiniMapHandoffV152 {
  camera: MapCameraV151 | null;
  selector: { variable: string; period: string } | null;
}

/** What '큰 지도에서 비교' carries: the mini map's current view (when it is live) and the slice it shows. */
export function miniMapHandoffV152(
  camera: MapCameraV151 | null,
  slice: { variable: string; period: string } | null
): MiniMapHandoffV152 {
  return {
    camera: camera
      ? { lng: camera.lng, lat: camera.lat, zoom: camera.zoom, bearing: 0 }
      : null,
    selector: slice && slice.variable && slice.period ? { variable: slice.variable, period: slice.period } : null,
  };
}
