import { describe, expect, it } from "@jest/globals";
import type { Map as MapLibreMap } from "maplibre-gl";
import type { CountryMapLayerV122 } from "../../data/countries/countryDataTypesV122";
import { layerRuntimeIds } from "./ids";
import { pointBadgeRadiusV152 } from "./pointIconLayer";
import { mountPointLayersV152 } from "./pointLayer";

type Spec = { id: string; type: string; paint?: Record<string, unknown>; layout?: Record<string, unknown>; filter?: unknown };

function fakeMap() {
  const layers: Spec[] = [];
  const sources: Record<string, Record<string, unknown>> = {};
  const map = {
    addSource: (id: string, source: Record<string, unknown>) => {
      sources[id] = source;
    },
    addLayer: (layer: Spec) => {
      layers.push(layer);
    },
    hasImage: () => true,
    addImage: () => undefined,
  } as unknown as MapLibreMap;
  return { map, layers, sources };
}

const layer = (elementId: string, cluster = false) =>
  ({ elementId, cluster, renderer: cluster ? "cluster" : "point" } as unknown as CountryMapLayerV122);
const data = { type: "FeatureCollection", features: [] } as GeoJSON.FeatureCollection<GeoJSON.Point>;

/** Smallest value an interpolate/step radius can take over zoom 0-22. */
function minRadius(expression: unknown): number {
  if (typeof expression === "number") return expression;
  const list = expression as unknown[];
  if (list[0] === "+") return minRadius(list[1]) + Number(list[2]);
  if (list[0] === "step") return Math.min(minRadius(list[2]), ...list.slice(4).filter((_, i) => i % 2 === 0).map(minRadius));
  if (list[0] === "interpolate") return Math.min(...list.slice(3).filter((_, i) => i % 2 === 1).map(minRadius));
  throw new Error(`unexpected ${JSON.stringify(expression)}`);
}

describe("point icon layers (V152)", () => {
  it("draws a white badge with a category ring and the glyph on top, never hidden by collisions", () => {
    const { map, layers } = fakeMap();
    const ids = layerRuntimeIds("VNM", "E-018");
    mountPointLayersV152(map, { layer: layer("E-018"), ids, color: "#9a3c62", isPrimary: true, data, icons: true });
    const badge = layers.find((entry) => entry.id === ids.point)!;
    const glyph = layers.find((entry) => entry.id === ids.pointSymbol)!;
    expect(badge.type).toBe("circle");
    expect(badge.paint?.["circle-color"]).toBe("#ffffff");
    expect(badge.paint?.["circle-stroke-color"]).toEqual(["coalesce", ["get", "__iconColor"], "#9a3c62"]);
    expect(glyph.type).toBe("symbol");
    expect(glyph.layout?.["icon-image"]).toEqual(["coalesce", ["get", "__icon"], ""]);
    expect(glyph.layout?.["icon-allow-overlap"]).toBe(true);
    expect(glyph.layout?.["icon-ignore-placement"]).toBe(true);
    expect(glyph.layout?.["icon-size"]).toEqual(["interpolate", ["linear"], ["zoom"], 5, 0.7, 9, 1]);
    // Korean organisations carry the small KR tag; hover and selection rings exist.
    expect(layers.find((entry) => entry.id === ids.pointTag)?.filter).toEqual(["==", ["get", "__iconTag"], "KR"]);
    expect(layers.some((entry) => entry.id === ids.pointHover)).toBe(true);
    expect(layers.some((entry) => entry.id === ids.selection)).toBe(true);
  });

  it("keeps every badge at least 18 px across (radius 9) for primary and context layers", () => {
    for (const elementId of ["A-023", "B-012", "C-025", "E-005"]) {
      expect(minRadius(pointBadgeRadiusV152(elementId, true))).toBeGreaterThanOrEqual(9);
      expect(minRadius(pointBadgeRadiusV152(elementId, false))).toBeGreaterThanOrEqual(9);
    }
  });

  it("sizes A-023 badges by the legend's four capacity bands", () => {
    const radius = pointBadgeRadiusV152("A-023", true) as unknown[];
    const atZoom5 = radius[4] as unknown[];
    expect(atZoom5.slice(0, 2)).toEqual(["step", ["to-number", ["get", "capacityMw"], -1]]);
    expect(atZoom5.slice(3).filter((_, index) => index % 2 === 0)).toEqual([10, 100, 500]);
  });

  it("puts the white representative glyph on primary clusters only", () => {
    const primary = fakeMap();
    const ids = layerRuntimeIds("VNM", "A-023");
    mountPointLayersV152(primary.map, { layer: layer("A-023", true), ids, color: "#176a4b", isPrimary: true, data, icons: true });
    expect(primary.layers.find((entry) => entry.id === ids.clusterIcon)?.layout?.["icon-image"]).toBe("mi152-bolt--w");
    const context = fakeMap();
    mountPointLayersV152(context.map, { layer: layer("A-023", true), ids, color: "#176a4b", isPrimary: false, data, icons: true });
    expect(context.layers.some((entry) => entry.id === ids.clusterIcon)).toBe(false);
  });

  it("honours a map's own cluster limit", () => {
    const { map, sources } = fakeMap();
    const ids = layerRuntimeIds("VNM", "B-012");
    mountPointLayersV152(map, { layer: layer("B-012", true), ids, color: "#8c2f39", isPrimary: true, data, icons: true, clusterMaxZoom: 11 });
    expect(sources[ids.source].clusterMaxZoom).toBe(11);
  });

  it("without icons draws the V129 circles and shapes (no badge, tag or hover layers)", () => {
    const { map, layers } = fakeMap();
    const ids = layerRuntimeIds("VNM", "E-018");
    mountPointLayersV152(map, { layer: layer("E-018"), ids, color: "#9a3c62", isPrimary: true, data });
    expect(layers.find((entry) => entry.id === ids.point)?.paint?.["circle-color"]).toBe("#9a3c62");
    expect(layers.find((entry) => entry.id === ids.pointSymbol)?.layout?.["icon-image"]).toBe("cdp-v129-e-018-square");
    expect(layers.some((entry) => [ids.pointTag, ids.pointHover, ids.clusterIcon].includes(entry.id))).toBe(false);
  });
});
