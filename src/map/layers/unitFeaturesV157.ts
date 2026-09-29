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
  label: string;
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
    categories: categoryOrder.map((label, index) => ({
      label,
      color: CATEGORY_COLORS_V157[index % CATEGORY_COLORS_V157.length],
      featureCount: categoryCounts.get(label) ?? 0,
    })),
  };
}

/**
 * The categories a choropleth's features carry, in first-seen order, or none.
 *
 * Used for the layer legend and for the fill expression, so both read the same
 * order and a category keeps its colour while the reader pans around.
 */
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
  return order.map((label, index) => ({
    label,
    color: CATEGORY_COLORS_V157[index % CATEGORY_COLORS_V157.length],
    featureCount: counts.get(label) ?? 0,
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
      return {
        type: "Feature" as const,
        id: key,
        geometry: feature.geometry as GeoJSON.Geometry,
        properties: {
          ...properties,
          elementId: layer.elementId,
          selectionKey: key,
          // The asset's own name and kind are what a reader clicked on.
          adm1Name: String(properties.name || properties.kindLabel || key),
          categoryLabel: String(properties.kindLabel || properties.class || ""),
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
