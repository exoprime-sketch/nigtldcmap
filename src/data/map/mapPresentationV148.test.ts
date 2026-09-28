import { test, expect } from "@jest/globals";
import { readFileSync } from "fs";
import { resolve } from "path";
import { EMPTY_DATA_FINDER_SELECTOR_STATE_V125 as EMPTY } from "../../types/dataFinderV125";
import type { CountryMapLayerV122 } from "../countries/countryDataTypesV122";
import { detailMapHandoffV148, detailMapSelectionV148, finiteMapValueV148, geometryPathV148, overviewProjectionV148 } from "./detailMapModelV148";
import { resolveMapSelectorBindingV125 } from "../visualization/mapSelectorBindingsV125";
import { mapFactsV148, mapFactValueV148, publicMapFieldsV148, powerCapacitySummaryV148 } from "./mapPresentationV148";
import { prepareLayerRecordsV138 } from "./prepareLayerRecordsV148";
import { createMapFeaturePopupV148 } from "../../components/map/mapFeaturePopupV148";
import { countryAssetPathV158 } from "../countryContext";

const asset = (p: string) => JSON.parse(readFileSync(resolve(__dirname, "../../../public", p.replace(/^\//, "")), "utf8"));
const layers: CountryMapLayerV122[] = asset(countryAssetPathV158("VNM", "map-index.json")).layers;

test.each(layers)("$elementId overview selects an existing declared slice and real geometry", (layer: CountryMapLayerV122) => {
  const selected = detailMapSelectionV148(layer, EMPTY);
  const variable = layer.selectors.variables.find((v) => v.key === selected.variable)!;
  expect(variable).toBeDefined();
  expect(variable.periods).toContain(selected.period);
  if (layer.dataUrl) {
    const data = asset(layer.dataUrl);
    const slices = data.values.length ? data.values : data.valueTable?.series || [];
    expect(slices.some((r: any) => r.variable === selected.variable && r.period === selected.period)).toBe(true);
  }
  if (layer.geometryUrl) {
    const geo = asset(layer.geometryUrl);
    expect(geo.features.length).toBeGreaterThan(0);
  }
  expect(publicMapFieldsV148(layer).some((f) => /위치 정밀도|공간 정확도|지도 표시 범위|값 제공 여부/.test(f.label))).toBe(false);
});

test("regional detail measure/scenario/year and unavailable-year disclosure", () => {
  const l = layers.find((l) => l.elementId === "B-004")!;
  const s = detailMapSelectionV148(l, { ...EMPTY, year: 2050, dimensions: { scenario: "ssp585" } });
  expect(s.variable).toContain("ssp585"); expect(s.period).toBe("2050");
  expect(detailMapSelectionV148(l, { ...EMPTY, year: 9999 }).note).toContain("선택 시점의 지도자료가 없어");
});

test.each(layers)("$elementId small-map slice survives the full-map handoff", (layer: CountryMapLayerV122) => {
  const selection = { ...EMPTY, year: 9999 };
  const small = detailMapSelectionV148(layer, selection);
  const large = resolveMapSelectorBindingV125(layer.elementId, detailMapHandoffV148(layer, small, selection), layer.selectors);
  expect(large.variable).toBe(small.variable);
  expect(large.period).toBe(small.period);
});

test("power registry scope and capacity share one source reading", () => {
  const l = layers.find((l) => l.elementId === "A-023")!;
  const rows = asset(countryAssetPathV158("VNM", "downloads/a-023.json")).entities;
  const p = prepareLayerRecordsV138(rows, l);
  const wri = p.records.filter((r) => r.normalizedAttributes.sourceKey === "wri");
  expect(wri).toHaveLength(236);
  expect(powerCapacitySummaryV148(wri).reduce((n, r) => n + r.capacity, 0)).toBeCloseTo(41350.49, 2);
  const ho = wri.find((r) => r.name === "Ho Ho")!;
  const facts = mapFactsV148(l, ho.normalizedAttributes);
  expect(facts.find((f) => f.key === "fuelType")?.value).toBe("수력");
  expect(facts.find((f) => f.key === "capacityMw")?.value).toBe("14 MW");
  const popup = createMapFeaturePopupV148({ elementId: "A-023", selectionKey: ho.recordId, title: "Ho Ho", dataset: "발전소", primary: true, facts, source: "WRI · 2021" });
  expect(popup.textContent?.match(/14 MW/g)).toHaveLength(1);
  expect(popup.querySelectorAll('[hidden], .cdp-sr-only')).toHaveLength(0);
  expect(popup.querySelector("strong")?.textContent).toBe("Ho Ho");
});

test("zero survives; missing is never zero; reviewed aliases win", () => {
  expect(finiteMapValueV148(null)).toBeNull(); expect(finiteMapValueV148(0)).toBe(0);
  const fact = { key: "sector", label: "업종", sources: ["reviewed"] };
  expect(mapFactValueV148(fact, { sector: "wrong", reviewed: "right" })).toBe("right");
  expect(mapFactValueV148(fact, { reviewed: 0 })).toBe(0);
});

test("polygon holes stay separate and projection stays finite", () => {
  const p = overviewProjectionV148([[102,8],[110,24]]);
  const path = geometryPathV148({ type: "Polygon", coordinates: [[[102,8],[110,8],[110,24],[102,8]],[[104,12],[105,12],[104,13],[104,12]]] }, p);
  expect(path.match(/M/g)).toHaveLength(2); expect(path.match(/Z/g)).toHaveLength(2);
  expect(path).not.toMatch(/NaN|Infinity/);
});
