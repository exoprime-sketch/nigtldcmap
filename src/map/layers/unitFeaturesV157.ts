/**
 * V157: the two shapes the 2026-09-22 review added to the map.
 *
 * `unit-choropleth` colours areas that are **not** provinces: B-017's 442 Aqueduct
 * assessment zones join on the source's own `stringId`, not on `adm1Code`, and the
 * 63→34 province merge does not touch them. The join key is whatever the layer
 * declares, so the same path serves any future unit system.
 *
 * `point-and-polygon` draws a geometry asset that mixes both: A-028's 1,321 OSM
 * ports and 237 dam/reservoir polygons. There are no records behind it - the asset
 * is the data - so each feature is given the same property names the panel reads
 * from a record, and nothing is aggregated.
 *
 * Categorical colouring lives here too: when a layer's values carry a
 * `categoryLabel` (B-017's water-risk grade, B-026's dominant flow direction), the
 * fill is that category's colour instead of a position on a ramp. A grade is not a
 * quantity, so a ramp would invite reading "twice as dark" as "twice as much".
 */
import type { CountryMapLayerV122 } from "../../data/countries/countryDataTypesV122";
import type { ChoroplethCollectionV151, LayerSelectorState, SpatialRuntimeAsset } from "./types";
import { spatialValuesForSelectorV125 } from "./features";
import { assetNameV164 } from "../../data/map/assetNameV164";

/** Colours for categorical fills, in the order categories first appear. */
export const CATEGORY_COLORS_V157 = [
  "#1b6f4a",
  "#2f8f9d",
  "#3b6fb6",
  "#7a5aa8",
  "#b4478e",
  "#c25b3a",
  "#c99215",
  "#6d7a35",
  "#8a6a52",
  "#4f5d6b",
] as const;

export interface CategoryLegendEntryV157 {
  /** The band as the source writes it; the map's paint expression matches on this. */
  label: string;
  /** The same band as the reader reads it: Korean name, source range beside it. */
  text: string;
  color: string;
  featureCount: number;
}

/** The join key a layer's values and geometry share ("stringId", "adm1Code34"). */
export function unitJoinKeyV157(layer: CountryMapLayerV122): string {
  return (layer as { joinKey?: string }).joinKey || "adm1Code";
}

/**
 * The value each feature of the layer's own geometry carries.
 *
 * A feature with no value keeps `hasValue: false` and is left transparent; nothing
 * is filled in for it. The properties repeat the names the province path uses
 * (`adm1Code`, `adm1Name`, `selectionKey`) so the panel, the selection outline and
 * the keyboard list need no special case, and add the unit's own label.
 */
export function unitChoroplethCollectionV157(
  layer: CountryMapLayerV122,
  asset: SpatialRuntimeAsset,
  selector: LayerSelectorState
): ChoroplethCollectionV151 & { categories: CategoryLegendEntryV157[] } {
  const joinKey = unitJoinKeyV157(layer);
  const values = asset.data ? spatialValuesForSelectorV125(asset.data, selector) : [];
  const valueByKey = new Map(
    values.map((row) => [String((row as unknown as Record<string, unknown>)[joinKey] ?? ""), row])
  );
  const numeric = values
    .map((row) => row.value)
    .filter((value): value is number => typeof value === "number" && Number.isFinite(value));
  const variableLabel =
    layer.selectors.variables.find((row) => row.key === selector.variable)?.label ||
    layer.publicShortTitle;

  const categoryOrder: string[] = [];
  const categoryCounts = new Map<string, number>();
  const features = asset.geometry.features.map((feature) => {
    const properties = (feature.properties || {}) as Record<string, unknown>;
    const key = String(properties[joinKey] ?? "");
    const row = valueByKey.get(key) as (Record<string, unknown> & { value?: number }) | undefined;
    const categoryLabel = row ? String(row.categoryLabel ?? "") : "";
    if (categoryLabel) {
      if (!categoryCounts.has(categoryLabel)) categoryOrder.push(categoryLabel);
      categoryCounts.set(categoryLabel, (categoryCounts.get(categoryLabel) ?? 0) + 1);
    }
    return {
      type: "Feature" as const,
      id: key,
      geometry: feature.geometry as GeoJSON.Geometry,
      properties: {
        ...properties,
        elementId: layer.elementId,
        unitKey: key,
        unitLabel: String(properties.label || properties.name || key),
        // The panel and the selection outline key on these names everywhere.
        adm1Code: key,
        adm1Name: String(properties.label || properties.name || key),
        value: typeof row?.value === "number" ? row.value : null,
        hasValue: row !== undefined,
        categoryLabel,
        unit: String(row?.unit ?? ""),
        period: selector.period,
        variable: selector.variable,
        variableLabel: String(row?.variableLabel ?? variableLabel),
        sourceIndicatorId: String(row?.sourceIndicatorId ?? ""),
        sourceSpatialUnit: String(row?.sourceSpatialUnit ?? "assessment-unit"),
        selectionKey: key,
        // Which province the unit sits in, as the asset states it - shown as
        // context, never used to aggregate the unit's value.
        adm1Code34Primary: String(properties.adm1Code34Primary ?? ""),
        adm1Name34Primary: String(properties.adm1Name34Primary ?? ""),
        boundarySystem: "source-unit",
        policyKind: "none",
      },
    };
  });

  return {
    mode: "63",
    kind: "none",
    minimum: numeric.length ? Math.min(...numeric) : 0,
    maximum: numeric.length ? Math.max(...numeric) : 1,
    collection: { type: "FeatureCollection", features },
    // Worst band first, each one named for the reader (severityLabelV157).
    categories: [...categoryOrder]
      .map((label) => ({ label, ...severityLabelV157(label) }))
      .sort((left, right) => left.rank - right.rank)
      .map((entry, index) => ({
        label: entry.label,
        text: entry.text,
        color: CATEGORY_COLORS_V157[index % CATEGORY_COLORS_V157.length],
        featureCount: categoryCounts.get(entry.label) ?? 0,
      })),
  };
}

/**
 * The categories a choropleth's features carry, in first-seen order, or none.
 *
 * Used for the layer legend and for the fill expression, so both read the same
 * order and a category keeps its colour while the reader pans around.
 */
/**
 * The severity bands, worst first, and what each is called in Korean.
 *
 * WRI writes the band and its range in one string ("High (3-4)"); the reader gets the
 * band in Korean with the source's range unchanged beside it.
 */
const SEVERITY_BANDS_V157: ReadonlyArray<{ readonly match: string; readonly ko: string }> = [
  { match: "extremely high", ko: "매우 높음" },
  { match: "high", ko: "높음" },
  { match: "medium - high", ko: "중간–높음" },
  { match: "medium-high", ko: "중간–높음" },
  { match: "medium", ko: "중간" },
  { match: "low - medium", ko: "낮음–중간" },
  { match: "low-medium", ko: "낮음–중간" },
  { match: "low", ko: "낮음" },
  { match: "arid and low water use", ko: "건조·용수 사용 적음" },
  { match: "no risk", ko: "위험 없음" },
  { match: "no data", ko: "자료 없음" },
];
/** Worst first; the order the table is written in. */
const SEVERITY_ORDER_V157 = [
  "매우 높음",
  "높음",
  "중간–높음",
  "중간",
  "낮음–중간",
  "낮음",
  "건조·용수 사용 적음",
  "위험 없음",
  "자료 없음",
];

/** The band's name and range as the reader reads them, or the label unchanged. */
export function severityLabelV157(label: string): { text: string; rank: number } {
  const stated = String(label || "").trim();
  const open = stated.indexOf("(");
  const band = (open >= 0 ? stated.slice(0, open) : stated).trim().toLowerCase();
  const range = open >= 0 ? stated.slice(open).trim() : "";
  // Longest match first, so "low - medium" is not read as "low".
  const hit = [...SEVERITY_BANDS_V157]
    .sort((left, right) => right.match.length - left.match.length)
    .find((entry) => band === entry.match);
  if (!hit) return { text: stated, rank: SEVERITY_ORDER_V157.length };
  return {
    text: range ? `${hit.ko} ${range}` : hit.ko,
    rank: SEVERITY_ORDER_V157.indexOf(hit.ko),
  };
}

/** V164: A-024 voltage bands in reading order, coloured like the 500/220/110 kV line classes. */
const VOLTAGE_BAND_COLORS_V164: Record<string, string> = {
  "400 kV 이상": "#8b2635",
  "200~399 kV": "#d35a3d",
  "100~199 kV": "#e59b32",
  "100 kV 미만": "#c7b23a",
  "전압 미기재": "#98a5a2",
};

export function categoryLegendV157(
  collection: GeoJSON.FeatureCollection<GeoJSON.Geometry>
): CategoryLegendEntryV157[] {
  const order: string[] = [];
  const counts = new Map<string, number>();
  for (const feature of collection.features) {
    const label = String((feature.properties as Record<string, unknown> | null)?.categoryLabel ?? "");
    if (!label) continue;
    if (!counts.has(label)) order.push(label);
    counts.set(label, (counts.get(label) ?? 0) + 1);
  }
  // V164: voltage bands are read high to low in the transmission palette Viet Nam's lines use.
  if (order.length > 0 && order.every((label) => VOLTAGE_BAND_COLORS_V164[label])) {
    return Object.keys(VOLTAGE_BAND_COLORS_V164)
      .filter((label) => counts.has(label))
      .map((label) => ({ label, text: label, color: VOLTAGE_BAND_COLORS_V164[label], featureCount: counts.get(label) ?? 0 }));
  }
  // A severity scale is read worst-first; anything the table does not know keeps the
  // order it arrived in, after the bands it does.
  const ranked = order.map((label) => ({ label, ...severityLabelV157(label) }));
  const sorted = ranked.some((entry) => entry.rank < SEVERITY_ORDER_V157.length)
    ? [...ranked].sort((left, right) => left.rank - right.rank)
    : ranked;
  return sorted.map((entry, index) => ({
    label: entry.label,
    text: entry.text,
    color: CATEGORY_COLORS_V157[index % CATEGORY_COLORS_V157.length],
    featureCount: counts.get(entry.label) ?? 0,
  }));
}

/** A MapLibre fill expression that paints each category its own colour. */
export function categoricalFillColorV157(categories: CategoryLegendEntryV157[]): any {
  if (categories.length === 0) return null;
  const match: any[] = ["match", ["get", "categoryLabel"]];
  for (const entry of categories) match.push(entry.label, entry.color);
  match.push("rgba(0, 0, 0, 0)");
  return ["case", ["==", ["get", "hasValue"], false], "rgba(0, 0, 0, 0)", match];
}

/**
 * V164: a grid asset that states each segment's voltage is read by voltage, as
 * Viet Nam's transmission lines are (the source's own line class stays in the
 * popup). The bands only group the stated value; an unstated voltage is named.
 */
export function assetCategoryLabelV164(elementId: string, properties: Record<string, unknown>): string {
  if (elementId === "A-024") {
    // A segment without a stated voltage is not placed in a band (its kind stays in the popup).
    const raw = properties.voltageKv;
    const kv = Number(raw);
    if (raw === null || raw === undefined || raw === "" || !Number.isFinite(kv) || kv <= 0) return "전압 미기재";
    if (kv >= 400) return "400 kV 이상";
    if (kv >= 200) return "200~399 kV";
    if (kv >= 100) return "100~199 kV";
    return "100 kV 미만";
  }
  return String(properties.kindLabel || properties.class || "");
}

/**
 * A geometry asset drawn as it is: every feature keeps its own shape and gains
 * the property names the panel reads. Nothing is joined, summed or moved.
 */
export function assetFeatureCollectionV157(
  layer: CountryMapLayerV122,
  asset: SpatialRuntimeAsset,
  filters: Record<string, string>
): GeoJSON.FeatureCollection<GeoJSON.Geometry> {
  const filterFields = (layer.filters || []).map((row) => row.field);
  const features = asset.geometry.features.filter((feature) => {
    const properties = (feature.properties || {}) as Record<string, unknown>;
    return filterFields.every((field) => {
      const selected = filters[`${layer.elementId}:${field}`];
      if (!selected || selected === "all") return true;
      return String(properties[field] ?? "") === selected;
    });
  });
  return {
    type: "FeatureCollection",
    features: features.map((feature, index) => {
      const properties = (feature.properties || {}) as Record<string, unknown>;
      const key = String(properties.featureId || properties.stringId || index);
      // V164: a basin point the delivery leaves unnamed ("HydroBASINS MAIN_BAS
      // 4080025450", "유역(HydroBASINS 4080025470)") is named for what it is,
      // "유역 출구 대표점 (번호 4080025450)"; a stated station or river is kept.
      // A-024 segments with no stated voltage read "전압 미기재 전력선 구간".
      const stated = typeof properties.name === "string" ? assetNameV164(layer.elementId, properties.name) : properties.name;
      return {
        type: "Feature" as const,
        id: key,
        geometry: feature.geometry as GeoJSON.Geometry,
        properties: {
          ...properties,
          ...(stated !== properties.name ? { name: stated } : {}),
          elementId: layer.elementId,
          selectionKey: key,
          // The asset's own name and kind are what a reader clicked on.
          adm1Name: String(stated || properties.kindLabel || key),
          categoryLabel: assetCategoryLabelV164(layer.elementId, properties),
          period: String(properties.sourceYear || layer.sourceYear || ""),
          variable: layer.selectors?.defaultVariable || "all",
          variableLabel: layer.publicShortTitle,
          sourceSpatialUnit: "source-feature",
        },
      };
    }),
  };
}

/** True when a feature collection carries any polygon (A-028 mixes both). */
export function hasPolygonFeaturesV157(
  collection: GeoJSON.FeatureCollection<GeoJSON.Geometry>
): boolean {
  return collection.features.some((feature) => /polygon/iu.test(feature.geometry.type));
}

/** True when a feature collection carries any point. */
export function hasPointFeaturesV157(
  collection: GeoJSON.FeatureCollection<GeoJSON.Geometry>
): boolean {
  return collection.features.some((feature) => /point/iu.test(feature.geometry.type));
}
