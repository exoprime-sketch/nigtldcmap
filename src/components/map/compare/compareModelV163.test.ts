import { describe, expect, test } from "@jest/globals";
import {
  categoryCountsV163,
  featureBboxV163,
  filtersForSelectorV163,
  initialPanesV163,
  linkedRegionsV163,
  medianV163,
  paneFitBboxV163,
  panesEqualV163,
  parseCompareCountriesV163,
  parseCompareSelectorsV163,
  periodsForVariableV163,
  rankAmongV163,
  regionSummaryV163,
  regionValuesV163,
  resolveLayerForCountryV163,
  resolveSelectorV163,
  sameQuantityV163,
  serializeCompareCountriesV163,
  serializeCompareSelectorsV163,
  sharedDomainV163,
  sortByTitleV163,
  swapPanesV163,
  syncDefaultV163,
  type CompareLayerLikeV163,
} from "./compareModelV163";

const climate: CompareLayerLikeV163 = {
  elementId: "B-004",
  renderer: "admin1-choropleth",
  selectors: {
    defaultVariable: "tas--ssp245",
    defaultPeriod: "2041-2060",
    periods: ["2021-2040", "2041-2060"],
    variables: [
      { key: "tas--ssp245", label: "연평균 기온 · SSP2-4.5", periods: ["2021-2040", "2041-2060"] },
      { key: "tas--historical", label: "연평균 기온 · 과거 모형", periods: ["1995-2014"] },
    ],
  },
};

const plants: CompareLayerLikeV163 = {
  elementId: "A-023",
  renderer: "point-and-polygon",
  filters: [{ field: "kind", values: ["gas", "oil", "coal"] }],
  selectors: { defaultVariable: "all", variables: [{ key: "all" }, { key: "gas" }, { key: "oil" }] },
};

describe("compareModelV163 - layers and selectors", () => {
  test("data options are in Korean reading order", () => {
    const sorted = sortByTitleV163([{ title: "하천 수질" }, { title: "가뭄 위험" }, { title: "발전소" }, { title: "10대 도시" }]);
    expect(sorted.map((row) => row.title)).toEqual(["10대 도시", "가뭄 위험", "발전소", "하천 수질"]);
  });

  test("a country keeps the same data when it has it, otherwise the first layer and says so", () => {
    const layers: Array<CompareLayerLikeV163 & { title: string }> = [
      { elementId: "B-039", title: "태양광 잠재량" },
      { elementId: "A-023", title: "발전소" },
      { elementId: "B-099", title: "가상 숨김", enabled: false },
    ];
    const titleOf = (layer: CompareLayerLikeV163 & { title: string }) => layer.title;
    expect(resolveLayerForCountryV163(layers, "A-023", titleOf)).toEqual({ elementId: "A-023", kept: true });
    expect(resolveLayerForCountryV163(layers, "D-018", titleOf)).toEqual({ elementId: "A-023", kept: false });
    // A disabled layer is not offered, even when it is the requested one.
    expect(resolveLayerForCountryV163(layers, "B-099", titleOf)).toEqual({ elementId: "A-023", kept: false });
    expect(resolveLayerForCountryV163([], "A-023", titleOf)).toBeNull();
  });

  test("another country's variable or a missing period falls back to the layer's default", () => {
    expect(resolveSelectorV163(climate, null, null)).toEqual({ variable: "tas--ssp245", period: "2041-2060" });
    expect(resolveSelectorV163(climate, "m-83659b2990--ssp245", "2041-2060")).toEqual({
      variable: "tas--ssp245",
      period: "2041-2060",
    });
    expect(resolveSelectorV163(climate, "tas--ssp245", "2021-2040")).toEqual({ variable: "tas--ssp245", period: "2021-2040" });
    // The historical run has its own periods; the default period is not one of them.
    expect(resolveSelectorV163(climate, "tas--historical", "2041-2060")).toEqual({
      variable: "tas--historical",
      period: "1995-2014",
    });
    expect(periodsForVariableV163(climate, "tas--historical")).toEqual(["1995-2014"]);
  });

  test("a site layer's kind variable draws that kind through its filter", () => {
    expect(filtersForSelectorV163(plants, "gas")).toEqual({ "A-023:kind": "gas" });
    expect(filtersForSelectorV163(plants, "all")).toEqual({});
    expect(filtersForSelectorV163(plants, "solar")).toEqual({});
    expect(filtersForSelectorV163(climate, "tas--ssp245")).toEqual({});
  });
});

describe("compareModelV163 - cross-pane rules", () => {
  test("the maps move together by default only inside one country", () => {
    expect(syncDefaultV163("VNM", "VNM")).toBe(true);
    expect(syncDefaultV163("VNM", "BGD")).toBe(false);
  });

  test("regions are linked only within one country and between region maps", () => {
    const vnmRegion = { country: "VNM", elementId: "B-039", renderer: "admin1-choropleth" };
    expect(linkedRegionsV163(vnmRegion, { country: "VNM", elementId: "D-008", renderer: "partial-choropleth" })).toBe(true);
    expect(linkedRegionsV163(vnmRegion, { country: "BGD", elementId: "B-039", renderer: "admin1-choropleth" })).toBe(false);
    expect(linkedRegionsV163(vnmRegion, { country: "VNM", elementId: "A-023", renderer: "cluster" })).toBe(false);
    expect(
      linkedRegionsV163(
        { country: "VNM", elementId: "B-017", renderer: "unit-choropleth" },
        { country: "VNM", elementId: "B-017", renderer: "unit-choropleth" }
      )
    ).toBe(true);
  });

  test("one colour range only for the same quantity, spanning both panes", () => {
    const a = { elementId: "B-033", variable: "loss", unit: "ha" };
    expect(sameQuantityV163(a, { ...a })).toBe(true);
    expect(sameQuantityV163(a, { ...a, variable: "gain" })).toBe(false);
    expect(sameQuantityV163(a, { ...a, unit: "%" })).toBe(false);
    expect(sharedDomainV163({ minimum: 2, maximum: 10 }, { minimum: -1, maximum: 7 })).toEqual({ minimum: -1, maximum: 10 });
    expect(sharedDomainV163({ minimum: 2, maximum: 10 }, null)).toBeNull();
  });

  test("swapping exchanges the panes and keeps each pane's choices", () => {
    const panes = initialPanesV163({
      layerIds: ["B-039", "B-039"],
      countries: ["VNM", "BGD"],
      selectors: [{ variable: "x", period: "2020" }, null],
      fallbackCountry: "VNM",
    });
    const swapped = swapPanesV163(panes);
    expect(swapped[0]).toEqual({ country: "BGD", elementId: "B-039", variable: null, period: null });
    expect(swapped[1]).toEqual({ country: "VNM", elementId: "B-039", variable: "x", period: "2020" });
    expect(panesEqualV163(swapPanesV163(swapped), panes)).toBe(true);
  });
});

describe("compareModelV163 - statistics", () => {
  const features = [
    { properties: { selectionKey: "A", adm1Name: "A", value: 10, hasValue: true } },
    { properties: { selectionKey: "B", adm1Name: "B", value: 30, hasValue: true } },
    { properties: { selectionKey: "C", adm1Name: "C", value: null, hasValue: false } },
    { properties: { selectionKey: "D", adm1Name: "D", value: 20, hasValue: true } },
    { properties: { selectionKey: "E", adm1Name: "E", value: 30, hasValue: true } },
    // The same region twice (a multi-part feature) counts once.
    { properties: { selectionKey: "A", adm1Name: "A", value: 10, hasValue: true } },
  ];

  test("a region without a value is left out, never counted as zero", () => {
    const values = regionValuesV163(features, (p) => String(p.adm1Name));
    expect(values.map((row) => row.key)).toEqual(["A", "B", "D", "E"]);
    const summary = regionSummaryV163(values, 5);
    expect(summary.count).toBe(4);
    expect(summary.total).toBe(5);
    expect(summary.minimum).toEqual({ key: "A", name: "A", value: 10 });
    expect(summary.maximum?.value).toBe(30);
    expect(summary.median).toBe(25);
    expect(regionSummaryV163([], 8)).toEqual({ count: 0, total: 8, minimum: null, maximum: null, median: null });
  });

  test("rank is largest-first and equal values share a rank", () => {
    const peers = [10, 30, 20, 30];
    expect(rankAmongV163(30, peers)).toEqual({ rank: 1, of: 4 });
    expect(rankAmongV163(20, peers)).toEqual({ rank: 3, of: 4 });
    expect(rankAmongV163(10, peers)).toEqual({ rank: 4, of: 4 });
    expect(rankAmongV163(null, peers)).toBeNull();
    expect(rankAmongV163(5, [5])).toBeNull();
  });

  test("median and categories", () => {
    expect(medianV163([3, 1, 2])).toBe(2);
    expect(medianV163([])).toBeNull();
    expect(categoryCountsV163(["가스", "석유", "가스", "", null, "석탄"])).toEqual([
      { label: "가스", count: 2 },
      { label: "석유", count: 1 },
      { label: "석탄", count: 1 },
    ]);
  });

  test("extent of a collection and where a pane opens", () => {
    const bbox = featureBboxV163([
      { geometry: { type: "Point", coordinates: [105, 20] } },
      { geometry: { type: "Polygon", coordinates: [[[100, 10], [101, 10], [101, 11], [100, 10]]] } },
      { geometry: null },
    ]);
    expect(bbox).toEqual([100, 10, 105, 20]);
    expect(featureBboxV163([])).toBeNull();
    const country: [number, number, number, number] = [102, 8, 110, 24];
    expect(paneFitBboxV163(country, [103, 9, 109, 23])).toEqual(country);
    // A regional project reaching far beyond the country opens on both.
    expect(paneFitBboxV163(country, [60, -10, 110, 24])).toEqual([60, -10, 110, 24]);
    expect(paneFitBboxV163(null, [1, 2, 3, 4])).toEqual([1, 2, 3, 4]);
  });
});

describe("compareModelV163 - URL", () => {
  test("countries round-trip and malformed codes are dropped", () => {
    expect(parseCompareCountriesV163("vnm,BGD,THA")).toEqual(["VNM", "BGD"]);
    expect(parseCompareCountriesV163("VN,<x>")).toEqual([]);
    expect(serializeCompareCountriesV163(["VNM", "BGD"])).toBe("VNM,BGD");
  });

  test("selectors round-trip; a pane without a choice is null", () => {
    const raw = serializeCompareSelectorsV163([{ variable: "tas--ssp245", period: "2041-2060" }, null]);
    expect(parseCompareSelectorsV163(raw)).toEqual([{ variable: "tas--ssp245", period: "2041-2060" }, null]);
    expect(parseCompareSelectorsV163("not json")).toEqual([]);
    expect(parseCompareSelectorsV163('[{"variable":1}]')).toEqual([null]);
  });

  test("panes from a URL: the page's country fills a missing one, the same element twice is allowed", () => {
    const panes = initialPanesV163({ layerIds: ["B-033", "B-033"], countries: ["BGD"], fallbackCountry: "VNM" });
    expect(panes.map((pane) => `${pane.country}:${pane.elementId}`)).toEqual(["BGD:B-033", "VNM:B-033"]);
  });
});
