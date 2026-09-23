import type { Map as MapLibreMap, MapSourceDataEvent, ErrorEvent as MapLibreErrorEventV151 } from "maplibre-gl";
import type { BoundarySystemV151 } from "./adminBoundaryV151";

/** The runtime attaches `sourceId` to a source's error events; the shipped types don't declare it. */
type BackdropErrorEventV151 = MapLibreErrorEventV151 & { sourceId?: string };

/**
 * V151-2: a richer basemap than the V150 flat backdrop (terrain hillshade,
 * satellite imagery, or plain OpenFreeMap streets), plus "none" which keeps
 * the country fill opaque the way V150 always did. No React here, so a future
 * minimap can import this directly.
 */
export type MapBackdropKindV151 = "terrain" | "satellite" | "streets" | "none";
export const MAP_BACKDROP_KINDS_V151: readonly MapBackdropKindV151[] = ["terrain", "satellite", "streets", "none"];
export const DEFAULT_MAP_BACKDROP_V151: MapBackdropKindV151 = "terrain";
export const MAP_BACKDROP_STORAGE_KEY_V151 = "cdp-map-backdrop-v151";
export const LEGACY_MAP_BACKDROP_STORAGE_KEY_V150 = "cdp-map-backdrop-v150";

export function isMapBackdropKindV151(value: unknown): value is MapBackdropKindV151 {
  return typeof value === "string" && (MAP_BACKDROP_KINDS_V151 as readonly string[]).includes(value);
}
export function backdropKindLabelV151(kind: MapBackdropKindV151): string {
  return kind === "terrain" ? "지형" : kind === "satellite" ? "위성" : kind === "streets" ? "도로·지명" : "없음";
}

type StorageLike = Pick<Storage, "getItem" | "setItem" | "removeItem">;

/** V151 key wins. Else migrate V150 once: "off"->"none", "on"/missing->"terrain". */
export function readMapBackdropKindV151(storage: StorageLike | null): MapBackdropKindV151 {
  if (!storage) return DEFAULT_MAP_BACKDROP_V151;
  try {
    const current = storage.getItem(MAP_BACKDROP_STORAGE_KEY_V151);
    if (isMapBackdropKindV151(current)) return current;
  } catch {
    return DEFAULT_MAP_BACKDROP_V151;
  }
  let migrated: MapBackdropKindV151 = DEFAULT_MAP_BACKDROP_V151;
  try {
    migrated = storage.getItem(LEGACY_MAP_BACKDROP_STORAGE_KEY_V150) === "off" ? "none" : "terrain";
  } catch {
    migrated = DEFAULT_MAP_BACKDROP_V151;
  }
  try {
    storage.setItem(MAP_BACKDROP_STORAGE_KEY_V151, migrated);
    storage.removeItem(LEGACY_MAP_BACKDROP_STORAGE_KEY_V150);
  } catch { /* best-effort persistence */ }
  return migrated;
}

export function writeMapBackdropKindV151(storage: StorageLike | null, kind: MapBackdropKindV151): void {
  try { storage?.setItem(MAP_BACKDROP_STORAGE_KEY_V151, kind); } catch { /* optional preference */ }
}

/** For <link rel="preconnect"> in the document head. */
export const BACKDROP_HOSTS_V151 = ["https://tiles.openfreemap.org", "https://s3.amazonaws.com", "https://server.arcgisonline.com"] as const;

export interface BackdropAttributionV151 { kind: MapBackdropKindV151; lines: string[] }
export function backdropAttributionV151(kind: MapBackdropKindV151): BackdropAttributionV151 {
  if (kind === "terrain") return { kind, lines: [
    "지형: Terrain Tiles(Mapzen · Amazon Web Services 공개 데이터, terrarium 인코딩) · 음영기복 Natural Earth",
    "하천·도로·지명: © OpenStreetMap contributors(ODbL) · OpenFreeMap",
  ] };
  if (kind === "satellite") return { kind, lines: [
    "위성영상: Esri World Imagery — Esri, Maxar, Earthstar Geographics, and the GIS User Community",
    "지명·경계: © OpenStreetMap contributors(ODbL) · OpenFreeMap",
  ] };
  if (kind === "streets") return { kind, lines: ["도로·지명: © OpenStreetMap contributors(ODbL) · OpenFreeMap Liberty"] };
  return { kind, lines: [] };
}

export const BACKDROP_LAYER_PREFIX_V151 = "cdp-bd-v151-";
export const BACKDROP_SOURCE_PREFIX_V151 = "cdp-bd-src-v151-";
export const BASE_FILL_OPACITY_V151 = { withBackdrop: 0.08, withoutBackdrop: 1 } as const;
// Viet Nam's land extent widened by 5° on every side: the warm-up then covers
// the neighbours and the sea the reader sees around the country, so the low
// zoom raster tiles arrive together instead of as a rectangle around Viet Nam.
export const VIETNAM_PREFETCH_BBOX_V151 = { west: 97.1, east: 114.6, south: 3.1, north: 28.5 } as const;
/** The land extent alone, for the z7 tiles a reader zooming in reaches first. */
export const VIETNAM_CORE_BBOX_V151 = { west: 102.1, east: 109.6, south: 8.1, north: 23.5 } as const;
/** Wide area at z5-6 (the overview) plus the country at z7. */
export function prefetchTilesV151(zooms: number[] = [5, 6, 7]): SlippyTileV151[] {
  const wide = slippyTilesForBboxV151(VIETNAM_PREFETCH_BBOX_V151, zooms.filter((z) => z <= 6));
  const core = slippyTilesForBboxV151(VIETNAM_CORE_BBOX_V151, zooms.filter((z) => z > 6));
  return [...wide, ...core];
}

interface BboxV151 { west: number; east: number; south: number; north: number }
interface SlippyTileV151 { z: number; x: number; y: number }

const lonToTileX = (lon: number, z: number) => Math.floor(((lon + 180) / 360) * 2 ** z);
const latToTileY = (lat: number, z: number) => {
  const rad = (lat * Math.PI) / 180;
  return Math.floor(((1 - Math.log(Math.tan(rad) + 1 / Math.cos(rad)) / Math.PI) / 2) * 2 ** z);
};

/** Standard XYZ slippy-map tile math over a bbox, deduped across zooms. */
export function slippyTilesForBboxV151(bbox: BboxV151, zooms: number[]): SlippyTileV151[] {
  const seen = new Set<string>();
  const tiles: SlippyTileV151[] = [];
  for (const z of zooms) {
    const maxIndex = 2 ** z - 1;
    const xMin = Math.max(0, Math.min(maxIndex, lonToTileX(bbox.west, z)));
    const xMax = Math.max(0, Math.min(maxIndex, lonToTileX(bbox.east, z)));
    const yMin = Math.max(0, Math.min(maxIndex, latToTileY(bbox.north, z))); // north -> smaller Y
    const yMax = Math.max(0, Math.min(maxIndex, latToTileY(bbox.south, z)));
    for (let x = xMin; x <= xMax; x++) {
      for (let y = yMin; y <= yMax; y++) {
        const key = `${z}/${x}/${y}`;
        if (seen.has(key)) continue;
        seen.add(key);
        tiles.push({ z, x, y });
      }
    }
  }
  return tiles;
}

/** terrain -> terrarium PNG + OFM planet pbf; satellite -> Esri + OFM pbf; streets -> OFM pbf; none -> []. */
export function backdropTileUrlsV151(kind: MapBackdropKindV151, tiles: SlippyTileV151[]): string[] {
  if (kind === "none") return [];
  const urls: string[] = [];
  for (const { z, x, y } of tiles) {
    if (kind === "terrain") {
      urls.push(`https://s3.amazonaws.com/elevation-tiles-prod/terrarium/${z}/${x}/${y}.png`);
      if (z <= 6) urls.push(`https://tiles.openfreemap.org/natural_earth/ne2sr/${z}/${x}/${y}.png`);
    }
    else if (kind === "satellite") urls.push(`https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/${z}/${y}/${x}`);
    urls.push(`https://tiles.openfreemap.org/planet/${z}/${x}/${y}.pbf`);
  }
  return urls;
}

export interface PrefetchBackdropOptionsV151 { fetchImpl?: typeof fetch; zooms?: number[]; concurrency?: number; signal?: AbortSignal }
export interface PrefetchBackdropResultV151 { requested: number; ok: number; failed: number }

/** Best-effort warm of low-zoom backdrop tiles; failures never surface. */
export async function prefetchBackdropTilesV151(kind: MapBackdropKindV151, options: PrefetchBackdropOptionsV151 = {}): Promise<PrefetchBackdropResultV151> {
  const saveData = (globalThis.navigator as { connection?: { saveData?: boolean } } | undefined)?.connection?.saveData;
  const fetchImpl = options.fetchImpl || globalThis.fetch;
  if (saveData || !fetchImpl) return { requested: 0, ok: 0, failed: 0 };
  const tiles = prefetchTilesV151(options.zooms || [5, 6, 7]);
  const urls = backdropTileUrlsV151(kind, tiles);
  const concurrency = Math.max(1, options.concurrency || 6);
  let ok = 0, failed = 0, cursor = 0;
  async function worker() {
    while (cursor < urls.length) {
      const url = urls[cursor++];
      try {
        // `priority` is a newer fetch option not yet in the shipped RequestInit type; cast past it.
        const response = await fetchImpl(url, { mode: "cors", cache: "default", credentials: "omit", priority: "low", signal: options.signal } as RequestInit);
        if (response.ok) ok++; else failed++;
      } catch { failed++; }
    }
  }
  await Promise.all(Array.from({ length: Math.min(concurrency, urls.length) }, worker));
  return { requested: urls.length, ok, failed };
}

// ---------------------------------------------------------------- application

// The style specs we build are hand-assembled MapLibre style JSON, not values
// TS can narrow to one union member; every layer/source literal is cast
// through `unknown` deliberately (see MapAddLayer/MapAddSource below).
type MapAddLayer = Parameters<MapLibreMap["addLayer"]>[0];
type MapAddSource = Parameters<MapLibreMap["addSource"]>[1];
const asLayerV151 = (layer: Record<string, unknown>) => layer as unknown as MapAddLayer;
const asSourceV151 = (source: Record<string, unknown>) => source as unknown as MapAddSource;

interface BackdropHandlersV151 {
  onSourceData?: (event: MapSourceDataEvent) => void;
  onError?: (event: BackdropErrorEventV151) => void;
  spriteSet?: boolean;
}
const HANDLERS_V151 = new WeakMap<MapLibreMap, BackdropHandlersV151>();

type OfmTileJsonV151 = { vector_layers?: Array<{ id: string }> };
type LibertyStyleV151 = { sources: Record<string, unknown>; sprite?: string; layers: Array<Record<string, unknown>> };
let cachedOfmTileJsonV151: Promise<OfmTileJsonV151> | null = null;
let cachedLibertyStyleV151: Promise<LibertyStyleV151> | null = null;

function fetchOfmTileJsonV151(): Promise<OfmTileJsonV151> {
  return cachedOfmTileJsonV151 ||= fetch("https://tiles.openfreemap.org/planet", { mode: "cors" })
    .then((r) => r.json() as Promise<OfmTileJsonV151>)
    .catch(() => ({ vector_layers: [] as Array<{ id: string }> }));
}
function fetchLibertyStyleV151(): Promise<LibertyStyleV151> {
  return cachedLibertyStyleV151 ||= fetch("https://tiles.openfreemap.org/styles/liberty", { mode: "cors" })
    .then((r) => r.json() as Promise<LibertyStyleV151>)
    .catch(() => ({ sources: {}, layers: [] as Array<Record<string, unknown>> }));
}
/**
 * Start the network work a backdrop kind needs before the map exists: the
 * Viet Nam z5-7 tiles and, for streets, the Liberty style document. The map's
 * own requests then hit the HTTP cache. Safe to call repeatedly per kind.
 */
const warmedKindsV151 = new Set<MapBackdropKindV151>();
export function warmBackdropV151(kind: MapBackdropKindV151, options: PrefetchBackdropOptionsV151 = {}): void {
  if (kind === "none" || warmedKindsV151.has(kind)) return;
  warmedKindsV151.add(kind);
  if (kind === "streets") void fetchLibertyStyleV151();
  void prefetchBackdropTilesV151(kind, options).catch(() => undefined);
}
const beforeIdV151 = (map: MapLibreMap) => (map.getLayer("cdp-country-fill") ? "cdp-country-fill" : undefined);
const addLayerSafeV151 = (map: MapLibreMap, layer: Record<string, unknown>, beforeId?: string) => { try { map.addLayer(asLayerV151(layer), beforeId); } catch { /* one bad layer never blocks the rest */ } };

function resetBasePaintV151(map: MapLibreMap, kind: MapBackdropKindV151): void {
  const withBackdrop = kind !== "none";
  if (map.getLayer("cdp-base-background")) map.setPaintProperty("cdp-base-background", "background-color", withBackdrop ? "#cfe0ea" : "#e7efeb");
  const opacity = withBackdrop ? BASE_FILL_OPACITY_V151.withBackdrop : BASE_FILL_OPACITY_V151.withoutBackdrop;
  for (const id of ["cdp-country-fill", "cdp-vnm-country-fill"]) if (map.getLayer(id)) map.setPaintProperty(id, "fill-opacity", opacity);
}

const OFM_ATTRIBUTION_V151 = "© OpenStreetMap contributors";

/**
 * The six centrally-run cities are drawn from our own Korean-labelled point
 * source (addKoreanMapLabelsV150); a tile place-label layer must not repeat
 * them, or the map shows two labels stacked on the same city.
 */
export const CITY_TILE_NAMES_V151 = [
  "Hanoi", "Hà Nội", "Ho Chi Minh City", "Thành phố Hồ Chí Minh", "Da Nang", "Đà Nẵng",
  "Hai Phong", "Hải Phòng", "Can Tho", "Cần Thơ", "Hue", "Huế",
] as const;

/** Korean-first label text so a tile place label prefers our own transliteration. */
export const TILE_LABEL_TEXT_FIELD_V151 = ["coalesce", ["get", "name:ko"], ["get", "name:en"], ["get", "name:latin"], ["get", "name"]];

/** True only for the one backdrop whose own tiles carry every city label (so the page can hide the Korean city markers instead of doubling up). */
export function backdropOwnsCityLabelsV151(kind: MapBackdropKindV151): boolean {
  return kind === "streets";
}

function placeLabelLayerV151(source: string, colors: { text: string; halo: string }): Record<string, unknown> {
  return {
    id: `${BACKDROP_LAYER_PREFIX_V151}place-labels`, type: "symbol", source, "source-layer": "place", minzoom: 8,
    filter: ["all",
      ["in", ["get", "class"], ["literal", ["town", "village"]]],
      ["!", ["in", ["coalesce", ["get", "name:en"], ["get", "name"]], ["literal", CITY_TILE_NAMES_V151]]],
    ],
    layout: { "text-field": TILE_LABEL_TEXT_FIELD_V151, "text-font": ["Noto Sans Regular"], "text-size": 11 },
    paint: { "text-color": colors.text, "text-halo-color": colors.halo, "text-halo-width": 1.4 },
  };
}

async function addTerrainLayersV151(map: MapLibreMap, beforeId: string | undefined, signal?: AbortSignal): Promise<void> {
  // Natural Earth shaded relief (OpenFreeMap, z<=6) paints first: it is a small
  // raster on the same fast host as the vector tiles, so the reader sees
  // relief within a few hundred ms while the DEM hillshade is still arriving.
  map.addSource(`${BACKDROP_SOURCE_PREFIX_V151}ne2`, asSourceV151({ type: "raster", tiles: ["https://tiles.openfreemap.org/natural_earth/ne2sr/{z}/{x}/{y}.png"], tileSize: 256, maxzoom: 6, attribution: "Natural Earth" }));
  // A longer fade lets each arriving tile blend in instead of popping as a rectangle.
  addLayerSafeV151(map, { id: `${BACKDROP_LAYER_PREFIX_V151}ne2`, type: "raster", source: `${BACKDROP_SOURCE_PREFIX_V151}ne2`, paint: { "raster-opacity": 0.75, "raster-saturation": -0.35, "raster-fade-duration": 700 } }, beforeId);
  map.addSource(`${BACKDROP_SOURCE_PREFIX_V151}dem`, asSourceV151({ type: "raster-dem", tiles: ["https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png"], encoding: "terrarium", tileSize: 256, maxzoom: 12, attribution: "Terrain Tiles (Mapzen / AWS Open Data)" }));
  addLayerSafeV151(map, { id: `${BACKDROP_LAYER_PREFIX_V151}hillshade`, type: "hillshade", source: `${BACKDROP_SOURCE_PREFIX_V151}dem`, paint: { "hillshade-exaggeration": 0.35, "hillshade-shadow-color": "#5b6b62", "hillshade-highlight-color": "#ffffff", "hillshade-accent-color": "#7a8b80" } }, beforeId);
  const tileJson = await fetchOfmTileJsonV151();
  if (signal?.aborted) return;
  const has = new Set((tileJson.vector_layers || []).map((layer: { id: string }) => layer.id));
  const src = `${BACKDROP_SOURCE_PREFIX_V151}ofm`;
  map.addSource(src, asSourceV151({ type: "vector", url: "https://tiles.openfreemap.org/planet", attribution: OFM_ATTRIBUTION_V151 }));
  if (has.has("water")) addLayerSafeV151(map, { id: `${BACKDROP_LAYER_PREFIX_V151}water`, type: "fill", source: src, "source-layer": "water", paint: { "fill-color": "#b9d3e3" } }, beforeId);
  if (has.has("waterway")) addLayerSafeV151(map, { id: `${BACKDROP_LAYER_PREFIX_V151}waterway`, type: "line", source: src, "source-layer": "waterway", filter: ["in", ["get", "class"], ["literal", ["river", "canal"]]], paint: { "line-color": "#7fb0cc", "line-width": ["interpolate", ["linear"], ["zoom"], 6, 0.4, 12, 1.8] } }, beforeId);
  if (has.has("landcover")) addLayerSafeV151(map, { id: `${BACKDROP_LAYER_PREFIX_V151}landcover`, type: "fill", source: src, "source-layer": "landcover", minzoom: 6, paint: { "fill-color": "#bdd0ac", "fill-opacity": 0.25 } }, beforeId);
  if (has.has("transportation")) {
    addLayerSafeV151(map, { id: `${BACKDROP_LAYER_PREFIX_V151}transportation-major`, type: "line", source: src, "source-layer": "transportation", filter: ["in", ["get", "class"], ["literal", ["motorway", "trunk", "primary"]]], paint: { "line-color": "#b8a98f", "line-width": ["interpolate", ["linear"], ["zoom"], 6, 0.5, 14, 2.4] } }, beforeId);
    addLayerSafeV151(map, { id: `${BACKDROP_LAYER_PREFIX_V151}transportation-secondary`, type: "line", source: src, "source-layer": "transportation", minzoom: 9, filter: ["in", ["get", "class"], ["literal", ["secondary", "tertiary"]]], paint: { "line-color": "#cbc3b3", "line-width": 0.6 } }, beforeId);
    addLayerSafeV151(map, { id: `${BACKDROP_LAYER_PREFIX_V151}railway`, type: "line", source: src, "source-layer": "transportation", minzoom: 7, filter: ["==", ["get", "class"], "rail"], paint: { "line-color": "#8f8a80", "line-dasharray": [2, 2], "line-width": 0.8 } }, beforeId);
  }
  if (has.has("place")) addLayerSafeV151(map, placeLabelLayerV151(src, { text: "#4a5a54", halo: "#ffffff" }), beforeId);
}

function addSatelliteLayersV151(map: MapLibreMap, beforeId: string | undefined): void {
  map.addSource(`${BACKDROP_SOURCE_PREFIX_V151}esri`, asSourceV151({ type: "raster", tiles: ["https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"], tileSize: 256, maxzoom: 17, attribution: "Esri World Imagery" }));
  addLayerSafeV151(map, { id: `${BACKDROP_LAYER_PREFIX_V151}raster`, type: "raster", source: `${BACKDROP_SOURCE_PREFIX_V151}esri`, paint: { "raster-saturation": -0.1, "raster-brightness-max": 0.95, "raster-fade-duration": 700 } }, beforeId);
  const src = `${BACKDROP_SOURCE_PREFIX_V151}ofm`;
  map.addSource(src, asSourceV151({ type: "vector", url: "https://tiles.openfreemap.org/planet", attribution: OFM_ATTRIBUTION_V151 }));
  addLayerSafeV151(map, { id: `${BACKDROP_LAYER_PREFIX_V151}boundary`, type: "line", source: src, "source-layer": "boundary", filter: ["==", ["get", "admin_level"], 2], paint: { "line-color": "#ffffff", "line-opacity": 0.9, "line-width": 0.6 } }, beforeId);
  addLayerSafeV151(map, placeLabelLayerV151(src, { text: "#ffffff", halo: "#243e38" }), beforeId);
}

async function addStreetsLayersV151(map: MapLibreMap, beforeId: string | undefined, signal?: AbortSignal): Promise<void> {
  const style = await fetchLibertyStyleV151();
  if (signal?.aborted) return;
  for (const [sourceId, spec] of Object.entries(style.sources || {})) map.addSource(`${BACKDROP_SOURCE_PREFIX_V151}lib-${sourceId}`, asSourceV151(spec as Record<string, unknown>));
  const handlers = HANDLERS_V151.get(map) || {};
  const currentSprite = (map.getStyle() as { sprite?: string } | undefined)?.sprite;
  if (style.sprite && !currentSprite) { map.setSprite(style.sprite); HANDLERS_V151.set(map, { ...handlers, spriteSet: true }); }
  for (const layer of style.layers || []) {
    if (layer.type === "background") continue;
    // Liberty's own place labels become the single source of city names for
    // this backdrop (see backdropOwnsCityLabelsV151); make them Korean-first.
    const isPlaceSymbol = layer.type === "symbol" && layer["source-layer"] === "place";
    const layout = isPlaceSymbol ? { ...(layer.layout as Record<string, unknown> | undefined), "text-field": TILE_LABEL_TEXT_FIELD_V151 } : layer.layout;
    // MapLibre validates `layout: undefined` as a type error; only spell the key when the style has one.
    const imported: Record<string, unknown> = { ...layer, id: `${BACKDROP_LAYER_PREFIX_V151}lib-${layer.id}`, source: `${BACKDROP_SOURCE_PREFIX_V151}lib-${layer.source}` };
    if (layout) imported.layout = layout; else delete imported.layout;
    addLayerSafeV151(map, imported as typeof layer, beforeId);
  }
}

export interface ApplyBackdropOptionsV151 {
  boundarySystem?: BoundarySystemV151;
  signal?: AbortSignal;
  onFirstTile?: (info: { kind: MapBackdropKindV151; sourceId: string; elapsedMs: number }) => void;
  onError?: (info: { kind: MapBackdropKindV151; sourceId: string; message: string }) => void;
  startedAt?: number;
}

export async function applyMapBackdropV151(map: MapLibreMap, kind: MapBackdropKindV151, options: ApplyBackdropOptionsV151 = {}): Promise<void> {
  removeMapBackdropV151(map);
  const startedAt = options.startedAt ?? performance.now();
  let firstTileSeen = false;
  const onSourceData = (event: MapSourceDataEvent) => {
    if (firstTileSeen || !event.tile || !event.sourceId?.startsWith(BACKDROP_SOURCE_PREFIX_V151)) return;
    firstTileSeen = true;
    options.onFirstTile?.({ kind, sourceId: event.sourceId, elapsedMs: performance.now() - startedAt });
  };
  const onError = (event: BackdropErrorEventV151) => {
    if (event.sourceId?.startsWith(BACKDROP_SOURCE_PREFIX_V151)) {
      options.onError?.({ kind, sourceId: event.sourceId, message: event.error?.message || "backdrop source error" });
    }
  };
  map.on("sourcedata", onSourceData);
  map.on("error", onError);
  HANDLERS_V151.set(map, { ...HANDLERS_V151.get(map), onSourceData, onError });

  resetBasePaintV151(map, kind);
  if (kind !== "none") {
    const beforeId = beforeIdV151(map);
    try {
      if (kind === "terrain") await addTerrainLayersV151(map, beforeId, options.signal);
      else if (kind === "satellite") addSatelliteLayersV151(map, beforeId);
      else await addStreetsLayersV151(map, beforeId, options.signal);
    } catch { /* a failed backdrop fetch/apply leaves the data layers intact */ }
  }
  if (options.signal?.aborted) removeMapBackdropV151(map);
}

export function removeMapBackdropV151(map: MapLibreMap): void {
  const handlers = HANDLERS_V151.get(map);
  const style = map.getStyle();
  for (const layer of style?.layers || []) if (layer.id.startsWith(BACKDROP_LAYER_PREFIX_V151) && map.getLayer(layer.id)) map.removeLayer(layer.id);
  for (const sourceId of Object.keys(style?.sources || {})) if (sourceId.startsWith(BACKDROP_SOURCE_PREFIX_V151) && map.getSource(sourceId)) map.removeSource(sourceId);
  if (handlers?.spriteSet) { try { map.setSprite(null); } catch { /* best-effort cleanup */ } }
  if (handlers?.onSourceData) map.off("sourcedata", handlers.onSourceData);
  if (handlers?.onError) map.off("error", handlers.onError);
  HANDLERS_V151.delete(map);
}

export function backdropLayerIdsV151(map: MapLibreMap): string[] {
  const style = map.getStyle();
  return (style?.layers || []).map((layer) => layer.id).filter((id) => id.startsWith(BACKDROP_LAYER_PREFIX_V151));
}
