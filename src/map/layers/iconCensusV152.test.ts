import { describe, expect, it } from "@jest/globals";
import { readFileSync } from "fs";
import path from "path";
import { gunzipSync } from "zlib";
import type { CountryEntityV122, CountryMapLayerV122 } from "../../data/countries/countryDataTypesV122";
import { MAP_ICON_LAYER_IDS_V152, mapIconCategoryV152 } from "../../data/map/mapIconsV152";
import { LAYER_COLORS } from "./colors";
import { preparePointLayerV152, rendererOf } from "./index";
import { countryPublicDirV158 } from "../../data/countryContext";

/**
 * V152 icon census over the real delivery: every drawn site of every point
 * layer gets an icon from its own category, and no category falls back to
 * the "unseen value" icon. After a data refresh a new category fails here
 * until the icon rules name it (never silently becomes "기타").
 */
const ROOT = path.resolve(__dirname, "../../..");
const DATA = path.join(ROOT, `${countryPublicDirV158("VNM")}`);
const mapIndex = JSON.parse(readFileSync(path.join(DATA, "map-index.json"), "utf8")) as { layers: CountryMapLayerV122[] };
const bundle = JSON.parse(readFileSync(path.join(DATA, "packs/bundle-index-v124.json"), "utf8"));
const activeLayers = mapIndex.layers.filter((layer) => layer.active !== false && layer.enabled !== false);

function recordsFor(elementId: string): CountryEntityV122[] {
  const entry = (bundle.elements || bundle)[elementId];
  const packPath = path.join(DATA, String(entry.packUrl).replace(/^.*?(packs\/)/u, "$1"));
  const pack = JSON.parse(readFileSync(packPath, "utf8"));
  const buffer = Buffer.concat((pack.payloadChunks as string[]).map((chunk) => Buffer.from(chunk, "base64")));
  const payload = JSON.parse(gunzipSync(buffer).toString("utf8"));
  return payload.elements[elementId].entities.records as CountryEntityV122[];
}

/** Every filter at "all": the census covers every row the map can draw. */
function allFilters(layer: CountryMapLayerV122): Record<string, string> {
  return Object.fromEntries(layer.filters.map((filter) => [`${layer.elementId}:${filter.field}`, "all"]));
}

const pointLayers = activeLayers.filter((layer) => ["point", "cluster"].includes(rendererOf(layer)));

describe("map icon census on the delivered data (V152)", () => {
  it("has an icon rule for every point, cluster and regional-scope layer, and no rule without a layer", () => {
    const drawnAsSites = activeLayers
      .filter((layer) => ["point", "cluster", "regional-scope"].includes(rendererOf(layer)))
      .map((layer) => layer.elementId)
      .sort();
    expect(drawnAsSites).toEqual([...MAP_ICON_LAYER_IDS_V152].sort());
  });

  for (const layer of pointLayers) {
    it(`${layer.elementId}: every drawn site has its own category icon`, () => {
      const records = recordsFor(layer.elementId);
      const color = LAYER_COLORS[layer.elementId] || "#176a4b";
      const { data } = preparePointLayerV152({
        layer,
        records,
        filters: allFilters(layer),
        location: { sidecar: undefined, system: "post-2025-34" },
        isPrimary: true,
        icons: true,
        color,
      });
      expect(data.features.length).toBeGreaterThan(0);
      const withoutIcon = data.features.filter((feature) => !feature.properties?.__icon);
      expect(withoutIcon.length).toBe(0);
      const fallbacks = new Map<string, number>();
      for (const feature of data.features) {
        const category = mapIconCategoryV152(layer.elementId, (feature.properties || {}) as Record<string, unknown>, color);
        if (category?.fallback) fallbacks.set(category.key, (fallbacks.get(category.key) || 0) + 1);
      }
      // A value no rule names would be listed here with its count.
      expect(Object.fromEntries(fallbacks)).toEqual({});
    });
  }
});
