/**
 * Map icon rules and API (V152).
 *
 * Classifies a GeoJSON feature's properties into one of the icon glyphs in
 * `mapIconPathsV152.ts`, for the 15 map layers in `MAP_ICON_LAYER_IDS_V152`.
 * Also rasterises glyphs for MapLibre (`registerMapIcons`) and renders a
 * standalone SVG string (`mapIconSvg`) for non-map uses (legend, docs).
 *
 * Two kinds of "not the expected value" are kept apart on purpose:
 *  - an anticipated absence (A-023's unstated fuel, already a named category
 *    in the source data) is `fallback: false` — it is not a guess, it is
 *    what the record says;
 *  - a value none of these rules has seen before is `fallback: true` — the
 *    reader still gets a safe, visible icon, but the flag says "look at
 *    this row", it does not invent a category for it.
 *
 * No rule here reads a `maplibre-gl` value at module scope: only `import
 * type` is used, so this module (and its test) never needs a real map.
 */
import type { MapIconGlyphV152, MapIconIdV152 } from "./mapIconPathsV152";
import { MAP_ICON_PATHS_V152 } from "./mapIconPathsV152";
import { powerPlantFuelV141 } from "./powerPlantFactsV141";

export type { MapIconIdV152 } from "./mapIconPathsV152";

// ------------------------------------------------------------------ constants

/** Glyph ink colour for every rasterised map icon and every sprite symbol. */
export const MAP_ICON_INK_V152 = "#20343a";

/**
 * Badge geometry the integrator pastes into MapLibre `interpolate`
 * expressions (zoom stop, value). Not consumed inside this module.
 */
export const MAP_ICON_BADGE_V152 = {
  radius: {
    primary: [
      [5, 10],
      [9, 13],
    ],
    context: [
      [5, 9],
      [9, 11],
    ],
  },
  iconSize: [
    [5, 0.7],
    [9, 1.0],
  ],
  ring: { primary: 2.5, context: 2 },
} as const;

/** The 15 map layers an icon rule exists for (5 classified + 10 single-icon). */
export const MAP_ICON_LAYER_IDS_V152 = [
  "A-023",
  "B-012",
  "C-025",
  "B-048",
  "E-005",
  "A-025",
  "B-008",
  "B-023",
  "B-028",
  "B-025",
  "D-018",
  "E-004",
  "E-006",
  "E-018",
  "E-019",
] as const;

export type MapIconLayerIdV152 = (typeof MAP_ICON_LAYER_IDS_V152)[number];

// ------------------------------------------------------------------ helpers

/** The first argument that is a non-empty string once trimmed, else null. */
function firstNonEmpty(...values: unknown[]): string | null {
  for (const value of values) {
    if (value === null || value === undefined) continue;
    const text = String(value).trim();
    if (text) return text;
  }
  return null;
}

// ------------------------------------------------------------------ category result

export interface MapIconCategoryV152 {
  iconId: MapIconIdV152;
  /** Stable grouping key for `mapIconLegendEntriesV152`; not shown as text. */
  key: string;
  /** User-facing Korean label, or null when the caller should use the layer title. */
  label: string | null;
  color: string;
  fallback: boolean;
  tag?: "KR";
}

// ------------------------------------------------------------------ A-023 power plants

interface FuelRuleV152 {
  key: string;
  iconId: MapIconIdV152;
  color: string;
}

/**
 * The 12-label canonical model from `powerPlantFactsV141.ts` (11 stated
 * fuels + unstated). Icons/legend/popups map only via this label key, per
 * CLAUDE.md's domain memo.
 */
const A023_FUEL_RULES_V152: FuelRuleV152[] = [
  { key: "수력", iconId: "droplet", color: "#2f8fc1" },
  { key: "태양광", iconId: "solar-panel-2", color: "#e8a317" },
  { key: "풍력", iconId: "windmill", color: "#27a5a5" },
  { key: "석탄", iconId: "coal", color: "#3f3f46" },
  { key: "가스", iconId: "flame", color: "#377eb8" },
  { key: "가스·석유", iconId: "flame-barrel", color: "#4f6f8f" },
  { key: "석유", iconId: "barrel", color: "#6b7280" },
  { key: "바이오매스", iconId: "plant-2", color: "#5a9d55" },
  { key: "폐기물", iconId: "recycle", color: "#8c6bb1" },
  { key: "원자력", iconId: "radioactive", color: "#7a1f5c" },
  { key: "지열", iconId: "volcano", color: "#b5542b" },
];
const A023_FUEL_BY_KEY_V152 = new Map(A023_FUEL_RULES_V152.map((rule) => [rule.key, rule]));
const A023_UNSTATED_V152 = { key: "미기재", iconId: "bolt" as const, color: "#8a9a93" };

function powerPlantIconCategoryV152(properties: Record<string, unknown>): MapIconCategoryV152 {
  // powerPlantFuelV141 already reads both `fuelType` (Korean or the English
  // WRI keys, case-insensitive) and `primaryFuel` (WRI rows), and already
  // treats "(미표기)"/"미기재"/"unknown"/"-"/etc. as no stated value.
  const fuel = powerPlantFuelV141(properties);
  if (fuel === null) {
    // An anticipated, named category in the source data — not a fallback.
    return { iconId: A023_UNSTATED_V152.iconId, key: A023_UNSTATED_V152.key, label: A023_UNSTATED_V152.key, color: A023_UNSTATED_V152.color, fallback: false };
  }
  const rule = A023_FUEL_BY_KEY_V152.get(fuel);
  if (rule) return { iconId: rule.iconId, key: rule.key, label: rule.key, color: rule.color, fallback: false };
  // A raw value that is none of the 12 canonical labels: render the same as
  // "unstated" (never invent a 13th category) but flag it for review.
  return { iconId: A023_UNSTATED_V152.iconId, key: A023_UNSTATED_V152.key, label: A023_UNSTATED_V152.key, color: A023_UNSTATED_V152.color, fallback: true };
}

// ------------------------------------------------------------------ B-012 disasters

const B012_DISASTER_RULES_V152: Array<{ key: string; iconId: MapIconIdV152 }> = [
  { key: "폭풍·태풍", iconId: "storm" },
  { key: "홍수", iconId: "flood" },
  { key: "가뭄", iconId: "sun-high" },
  { key: "사면이동(습윤)", iconId: "landslide" },
  { key: "전염병", iconId: "virus" },
  { key: "산불", iconId: "flame" },
  { key: "병해충", iconId: "bug" },
  { key: "이상기온", iconId: "temperature-sun" },
];
const B012_DISASTER_BY_KEY_V152 = new Map(B012_DISASTER_RULES_V152.map((rule) => [rule.key, rule.iconId]));

function disasterIconCategoryV152(properties: Record<string, unknown>, layerColor: string): MapIconCategoryV152 {
  const raw = firstNonEmpty(properties.disasterType, properties["재해유형"]);
  if (raw !== null) {
    const iconId = B012_DISASTER_BY_KEY_V152.get(raw);
    if (iconId) return { iconId, key: raw, label: raw, color: layerColor, fallback: false };
    return { iconId: "alert-triangle", key: raw, label: raw, color: layerColor, fallback: true };
  }
  return { iconId: "alert-triangle", key: "미기재", label: "미기재", color: layerColor, fallback: true };
}

// ------------------------------------------------------------------ C-025 carbon projects

const C025_OTHER_LABEL_V152 = "기타 등록제도";
const C025_OTHER_COLOR_V152 = "#757575";
const C025_STANDARD_COLORS_V152: Record<string, string> = {
  CDM: "#7053a3",
  "Gold Standard": "#b8860b",
  "Verra VCS": "#2e7d32",
  GCC: "#1565c0",
  JCM: "#c62828",
  "ART TREES": "#6d4c41",
};

function carbonIconCategoryV152(properties: Record<string, unknown>): MapIconCategoryV152 {
  const raw = firstNonEmpty(properties.standard);
  const color = raw ? C025_STANDARD_COLORS_V152[raw] : undefined;
  if (raw && color) return { iconId: "certificate", key: raw, label: raw, color, fallback: false };
  return { iconId: "certificate", key: C025_OTHER_LABEL_V152, label: C025_OTHER_LABEL_V152, color: C025_OTHER_COLOR_V152, fallback: true };
}

// ------------------------------------------------------------------ B-048 mines

const B048_OTHER_LABEL_V152 = "기타 광종";
const B048_MINERAL_COLORS_V152: Record<string, string> = {
  니켈: "#5f7f3a",
  구리: "#b5651d",
  희토류: "#6a5acd",
  "보크사이트/알루미나": "#c0504d",
  "티타늄(ilmenite·leucoxene)": "#607d8b",
  "텅스텐(+형석·비스무트·구리)": "#37474f",
};

function mineralIconCategoryV152(properties: Record<string, unknown>, layerColor: string): MapIconCategoryV152 {
  const raw = firstNonEmpty(properties.mineral, properties["광종"]);
  const color = raw ? B048_MINERAL_COLORS_V152[raw] : undefined;
  if (raw && color) return { iconId: "pick", key: raw, label: raw, color, fallback: false };
  return { iconId: "pick", key: B048_OTHER_LABEL_V152, label: B048_OTHER_LABEL_V152, color: layerColor, fallback: true };
}

// ------------------------------------------------------------------ E-005 orgs

interface OrgGroupV152 {
  key: string;
  iconId: MapIconIdV152;
  values: string[];
}

const E005_OTHER_LABEL_V152 = "기타 기관";
const E005_GROUPS_V152: OrgGroupV152[] = [
  { key: "대학", iconId: "school", values: ["대학", "대학(학부)", "대학(연구그룹)"] },
  { key: "연구기관", iconId: "flask", values: ["연구소", "대학 부설 연구소", "싱크탱크", "연구기관(국가 아카데미)"] },
  { key: "NGO·네트워크", iconId: "heart-handshake", values: ["NGO", "NGO(국제)", "국제 NGO 대표사무소", "네트워크(NGO 연합)"] },
];
const E005_GROUP_BY_VALUE_V152 = new Map<string, OrgGroupV152>();
for (const group of E005_GROUPS_V152) {
  for (const value of group.values) E005_GROUP_BY_VALUE_V152.set(value, group);
}
// Applied in this order to a value that is not one of the exact strings above.
const E005_REGEX_FALLBACKS_V152: Array<{ pattern: RegExp; group: OrgGroupV152 }> = [
  { pattern: /NGO|네트워크/u, group: E005_GROUPS_V152[2] },
  { pattern: /연구|싱크탱크|아카데미/u, group: E005_GROUPS_V152[1] },
  { pattern: /대학/u, group: E005_GROUPS_V152[0] },
];

function orgIconCategoryV152(properties: Record<string, unknown>, layerColor: string): MapIconCategoryV152 {
  const raw = firstNonEmpty(properties.orgType);
  if (raw) {
    const exact = E005_GROUP_BY_VALUE_V152.get(raw);
    if (exact) return { iconId: exact.iconId, key: exact.key, label: exact.key, color: layerColor, fallback: false };
    for (const { pattern, group } of E005_REGEX_FALLBACKS_V152) {
      if (pattern.test(raw)) return { iconId: group.iconId, key: group.key, label: group.key, color: layerColor, fallback: false };
    }
  }
  return { iconId: "building", key: E005_OTHER_LABEL_V152, label: E005_OTHER_LABEL_V152, color: layerColor, fallback: true };
}

// ------------------------------------------------------------------ single-icon layers

interface SingleIconLayerV152 {
  iconId: MapIconIdV152;
  tag?: "KR";
}

const SINGLE_ICON_LAYERS_V152: Record<string, SingleIconLayerV152> = {
  "A-025": { iconId: "cloud-down" },
  "B-008": { iconId: "ripple" },
  "B-023": { iconId: "gauge" },
  "B-028": { iconId: "gauge" },
  "B-025": { iconId: "droplets" },
  "D-018": { iconId: "world" },
  "E-004": { iconId: "building-bank" },
  "E-006": { iconId: "coin" },
  "E-018": { iconId: "building-skyscraper", tag: "KR" },
  "E-019": { iconId: "building-bank", tag: "KR" },
};

// ------------------------------------------------------------------ representative icons

const REPRESENTATIVE_ICON_OVERRIDES_V152: Record<string, MapIconIdV152> = {
  "A-023": "bolt",
  "B-012": "alert-triangle",
  "C-025": "certificate",
  "B-048": "pick",
  "E-005": "building",
};

/** The cluster / layer-level icon for a layer, or null when the layer has no icon rule. */
export function mapLayerIconV152(elementId: string): MapIconIdV152 | null {
  const override = REPRESENTATIVE_ICON_OVERRIDES_V152[elementId];
  if (override) return override;
  const single = SINGLE_ICON_LAYERS_V152[elementId];
  return single ? single.iconId : null;
}

// ------------------------------------------------------------------ dispatcher

/**
 * Classifies one feature's properties for `elementId`. Returns null when
 * `elementId` has no icon rule (not one of `MAP_ICON_LAYER_IDS_V152`).
 * `layerColor` is the ring colour for layers whose categories share the
 * layer's own colour; rules with a fixed per-category palette (A-023,
 * C-025's named registries, B-048's named minerals) ignore it.
 */
export function mapIconCategoryV152(
  elementId: string,
  properties: Record<string, unknown>,
  layerColor: string
): MapIconCategoryV152 | null {
  switch (elementId) {
    case "A-023":
      return powerPlantIconCategoryV152(properties);
    case "B-012":
      return disasterIconCategoryV152(properties, layerColor);
    case "C-025":
      return carbonIconCategoryV152(properties);
    case "B-048":
      return mineralIconCategoryV152(properties, layerColor);
    case "E-005":
      return orgIconCategoryV152(properties, layerColor);
    default: {
      const single = SINGLE_ICON_LAYERS_V152[elementId];
      if (!single) return null;
      const category: MapIconCategoryV152 = {
        iconId: single.iconId,
        key: elementId,
        label: null,
        color: layerColor,
        fallback: false,
      };
      if (single.tag) category.tag = single.tag;
      return category;
    }
  }
}

/** Convenience wrapper for callers that only need the icon id. */
export function mapIconIdFor(elementId: string, properties: Record<string, unknown>): MapIconIdV152 | null {
  const category = mapIconCategoryV152(elementId, properties, "#000000");
  return category ? category.iconId : null;
}

// ------------------------------------------------------------------ legend grouping

/** The rule's own declared category order, for layers with more than one category. */
const DECLARED_KEY_ORDER_V152: Record<string, string[]> = {
  "A-023": [...A023_FUEL_RULES_V152.map((rule) => rule.key), A023_UNSTATED_V152.key],
  "B-012": B012_DISASTER_RULES_V152.map((rule) => rule.key),
  "C-025": [...Object.keys(C025_STANDARD_COLORS_V152), C025_OTHER_LABEL_V152],
  "B-048": [...Object.keys(B048_MINERAL_COLORS_V152), B048_OTHER_LABEL_V152],
  "E-005": [...E005_GROUPS_V152.map((group) => group.key), E005_OTHER_LABEL_V152],
};

function declaredOrderIndexV152(elementId: string, key: string): number {
  const order = DECLARED_KEY_ORDER_V152[elementId];
  if (!order) return 0;
  const index = order.indexOf(key);
  return index === -1 ? order.length : index;
}

export interface MapIconLegendEntryV152 {
  iconId: MapIconIdV152;
  key: string;
  label: string;
  color: string;
  count: number;
  fallback: boolean;
  tag?: "KR";
}

/**
 * Groups `featuresProperties` into legend rows for `elementId`, ordered by
 * the rule's own declared category order (undeclared raw values, possible
 * only for B-012, sort after the declared ones in first-seen order).
 * Categories with zero matching features are omitted.
 */
export function mapIconLegendEntriesV152(
  elementId: string,
  featuresProperties: Array<Record<string, unknown>>,
  layerColor: string,
  layerTitle: string
): MapIconLegendEntryV152[] {
  const byKey = new Map<string, MapIconLegendEntryV152>();
  const firstSeenOrder: string[] = [];
  for (const properties of featuresProperties) {
    const category = mapIconCategoryV152(elementId, properties, layerColor);
    if (!category) continue;
    const key = category.key;
    let entry = byKey.get(key);
    if (!entry) {
      entry = {
        iconId: category.iconId,
        key,
        label: category.label ?? layerTitle,
        color: category.color,
        count: 0,
        fallback: category.fallback,
      };
      if (category.tag) entry.tag = category.tag;
      byKey.set(key, entry);
      firstSeenOrder.push(key);
    } else if (category.fallback) {
      entry.fallback = true; // any contributing row flagged for review marks the whole group
    }
    entry.count += 1;
  }
  return firstSeenOrder
    .map((key) => byKey.get(key)!)
    .sort((a, b) => declaredOrderIndexV152(elementId, a.key) - declaredOrderIndexV152(elementId, b.key));
}

// ------------------------------------------------------------------ svg / sources

/** Image id of a glyph on the map; the "white" variant sits on coloured cluster circles. */
export function mapIconImageIdV152(id: MapIconIdV152, variant: MapIconVariantV152 = "ink"): string {
  return `mi152-${id}${variant === "white" ? MAP_ICON_WHITE_SUFFIX_V152 : ""}`;
}

export type MapIconVariantV152 = "ink" | "white";
const MAP_ICON_WHITE_SUFFIX_V152 = "--w";
const MAP_ICON_VARIANT_INK_V152: Record<MapIconVariantV152, string> = { ink: "#20343a", white: "#ffffff" };

export interface MapIconSvgOptionsV152 {
  color?: string;
  size?: number;
  strokeWidth?: number;
}

/** A standalone `<svg>...</svg>` string for one glyph (docs, non-map UI). */
export function mapIconSvg(id: MapIconIdV152, opts: MapIconSvgOptionsV152 = {}): string {
  const glyph = MAP_ICON_PATHS_V152[id];
  const color = opts.color ?? MAP_ICON_INK_V152;
  const size = opts.size ?? 24;
  const strokeWidth = opts.strokeWidth ?? 2;
  const pathTags = glyph.paths.map((d) => `<path d="${d}" />`).join("");
  if (glyph.mode === "stroke") {
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${glyph.viewBox}" width="${size}" height="${size}" fill="none" stroke="${color}" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round">${pathTags}</svg>`;
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${glyph.viewBox}" width="${size}" height="${size}" fill="${color}">${pathTags}</svg>`;
}

export interface MapIconSourceInfoV152 {
  name: MapIconGlyphV152["source"];
  license: string;
  url: string;
  copyright: string;
  iconIds: MapIconIdV152[];
}

const SOURCE_META_V152: Record<MapIconGlyphV152["source"], { license: string; url: string; copyright: string }> = {
  "Tabler Icons": { license: "MIT", url: "https://tabler.io/icons", copyright: "© Paweł Kuna" },
  "Material Symbols": { license: "Apache-2.0", url: "https://fonts.google.com/icons", copyright: "© Google" },
  "자체 제작": { license: "CC0-1.0", url: "", copyright: "nigtldcmap" },
};

/** Per-source name/licence/URL/copyright and the icon ids drawn from it, derived from the generated glyph table so it cannot drift. */
export const MAP_ICON_SOURCES_V152: MapIconSourceInfoV152[] = (
  Object.keys(SOURCE_META_V152) as Array<MapIconGlyphV152["source"]>
).map((name) => ({
  name,
  ...SOURCE_META_V152[name],
  iconIds: (Object.keys(MAP_ICON_PATHS_V152) as MapIconIdV152[]).filter((id) => MAP_ICON_PATHS_V152[id].source === name),
}));

// ------------------------------------------------------------------ maplibre registration

/** Minimal structural view of a MapLibre `Map`, so this module never imports `maplibre-gl` at runtime. */
export interface MaplibreMapLike {
  hasImage: (id: string) => boolean;
  addImage: (
    id: string,
    image: { width: number; height: number; data: Uint8ClampedArray | Uint8Array } | ImageData,
    options?: { pixelRatio?: number }
  ) => void;
  on?: (type: string, listener: (event: { id?: string }) => void) => void;
}

const RASTER_SIZE_V152 = 40; // 20 CSS px * pixelRatio 2

function parseViewBox(viewBox: string): { minX: number; minY: number; width: number; height: number } {
  const [minX, minY, width, height] = viewBox.trim().split(/\s+/u).map(Number);
  return { minX, minY, width, height };
}

function rasteriseGlyphV152(glyph: MapIconGlyphV152, ink: string = MAP_ICON_INK_V152): ImageData {
  const canvas = document.createElement("canvas");
  canvas.width = RASTER_SIZE_V152;
  canvas.height = RASTER_SIZE_V152;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("mapIconsV152: 2D canvas context is unavailable");
  const { minX, minY, width, height } = parseViewBox(glyph.viewBox);
  const scale = RASTER_SIZE_V152 / Math.max(width, height);
  ctx.save();
  ctx.scale(scale, scale);
  ctx.translate(-minX, -minY);
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.lineWidth = 2; // in the glyph's own unit space, per viewBox
  ctx.strokeStyle = ink;
  ctx.fillStyle = ink;
  for (const d of glyph.paths) {
    const path = new Path2D(d);
    if (glyph.mode === "stroke") ctx.stroke(path);
    else ctx.fill(path);
  }
  ctx.restore();
  return ctx.getImageData(0, 0, RASTER_SIZE_V152, RASTER_SIZE_V152);
}

/**
 * Rasterises and registers glyphs (default: all of them) on `map` via
 * `addImage`, skipping ids the map already has an image for. Returns the
 * ids actually registered. Not unit-tested: jsdom has no canvas.
 */
export function registerMapIcons(
  map: MaplibreMapLike,
  ids?: MapIconIdV152[],
  variant: MapIconVariantV152 = "ink"
): string[] {
  const targets = ids ?? (Object.keys(MAP_ICON_PATHS_V152) as MapIconIdV152[]);
  const registered: string[] = [];
  for (const id of targets) {
    const imageId = mapIconImageIdV152(id, variant);
    if (map.hasImage(imageId)) continue;
    const glyph = MAP_ICON_PATHS_V152[id];
    const image = rasteriseGlyphV152(glyph, MAP_ICON_VARIANT_INK_V152[variant]);
    map.addImage(imageId, image, { pixelRatio: 2 });
    registered.push(imageId);
  }
  return registered;
}

const MAP_ICON_IMAGE_PREFIX_V152 = "mi152-";

/** Lazily registers a missing icon image the first time MapLibre asks for it. */
export function attachMapIconMissingHandlerV152(map: MaplibreMapLike): void {
  if (!map.on) return;
  map.on("styleimagemissing", (event) => {
    const imageId = event?.id;
    if (!imageId || !imageId.startsWith(MAP_ICON_IMAGE_PREFIX_V152)) return;
    const raw = imageId.slice(MAP_ICON_IMAGE_PREFIX_V152.length);
    const white = raw.endsWith(MAP_ICON_WHITE_SUFFIX_V152);
    const iconId = (white ? raw.slice(0, -MAP_ICON_WHITE_SUFFIX_V152.length) : raw) as MapIconIdV152;
    if (!(iconId in MAP_ICON_PATHS_V152)) return;
    registerMapIcons(map, [iconId], white ? "white" : "ink");
  });
}
