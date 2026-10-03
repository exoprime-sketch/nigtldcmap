import { describe, expect, it } from "@jest/globals";
import type { CountryMapLayerV122 } from "../countries/countryDataTypesV122";
import { EMPTY_DATA_FINDER_SELECTOR_STATE_V125 } from "../../types/dataFinderV125";
import { detailMapSelectionForCountryV163, overviewProjectionV148 } from "./detailMapModelV148";
import {
  boundaryCreditPhraseV163,
  countryCoreBoxV163,
  isDefaultCountryV163,
  isRawRegionKeyV163,
  level1BasisCaptionV163,
  level1DisplayNameV163,
  level1NamesByKeyV163,
  projectionCenterLatV163,
  regionLabelV163,
  staticUnitKeyV163,
} from "./miniMapCountryV163";

const BGD_LEVEL1 = {
  features: [
    { properties: { divisionKey: "BGD.1_1", nameEn: "Barisal", nameKo: "바리살" } },
    { properties: { divisionKey: "BGD.7_1", nameEn: "Sylhet", nameKo: "실렛" } },
    { properties: { divisionKey: "BGD.8_1", nameEn: "Mymensingh", nameKo: "마이멘싱" } },
    { properties: { divisionKey: "BGD.9_1", nameEn: "Zzzland", nameKo: "" } },
  ],
};

describe("miniMapCountryV163 - which country, which key", () => {
  it("knows the default country and nothing else", () => {
    expect(isDefaultCountryV163("VNM")).toBe(true);
    expect(isDefaultCountryV163("vnm")).toBe(true);
    expect(isDefaultCountryV163("BGD")).toBe(false);
    expect(isDefaultCountryV163(undefined)).toBe(false);
  });

  it("keeps Viet Nam joined on adm1Code and joins another country on its own key", () => {
    const vnm = { adm1Code: "VN-HN", stringId: "x", divisionKey: "y" };
    expect(staticUnitKeyV163(vnm, "stringId", "VNM")).toBe("VN-HN");
    expect(staticUnitKeyV163(vnm, undefined, "VNM")).toBe("VN-HN");
    const bgd = { divisionKey: "BGD.8_1", nameEn: "Mymensingh" };
    expect(staticUnitKeyV163(bgd, "divisionKey", "BGD")).toBe("BGD.8_1");
    expect(staticUnitKeyV163({ adm1Code: "A" }, "divisionKey", "BGD")).toBe("A");
    expect(staticUnitKeyV163(bgd, undefined, "BGD")).toBe("");
    expect(staticUnitKeyV163(null, "divisionKey", "BGD")).toBe("");
  });

  it("recognises boundary keys, not names", () => {
    for (const key of ["BGD.8_1", "BGD.1_1", "VNM.12.3_1", "BD-H", "VN34-HN", "VN-HN"]) expect(isRawRegionKeyV163(key)).toBe(true);
    for (const name of ["Dhaka", "Cox's Bazar", "다카 (Dhaka)", "Ho Chi Minh City", "Mymensingh", "", null]) expect(isRawRegionKeyV163(name)).toBe(false);
  });
});

describe("miniMapCountryV163 - region labels never show a key", () => {
  const names = level1NamesByKeyV163(BGD_LEVEL1, "divisionKey");

  it("indexes the level-1 file by the key the rows use", () => {
    expect([...names.keys()]).toEqual(["BGD.1_1", "BGD.7_1", "BGD.8_1", "BGD.9_1"]);
    expect(names.get("BGD.8_1")).toEqual({ nameEn: "Mymensingh", nameKo: "마이멘싱" });
    expect(level1NamesByKeyV163(null, "divisionKey").size).toBe(0);
  });

  it("uses the row's own name through the dictionary first", () => {
    const label = regionLabelV163({ row: { adm1Code: "BGD.7_1", adm1Name: "Sylhet" }, iso3: "BGD", elementId: "B-039", level1Names: names });
    expect(label).toContain("Sylhet");
    expect(label).not.toContain("BGD.");
  });

  it("falls back to the level-1 file's name when the row has none or only the key", () => {
    for (const row of [{ adm1Code: "BGD.8_1" }, { adm1Code: "BGD.8_1", adm1Name: "" }, { adm1Code: "BGD.8_1", adm1Name: "BGD.8_1" }, { adm1Code: "BGD.8_1", label: "BGD.8_1" }]) {
      const label = regionLabelV163({ row, iso3: "BGD", elementId: "B-017", level1Names: names });
      expect(label).toContain("Mymensingh");
      expect(label).not.toMatch(/BGD\./u);
    }
  });

  it("gives the Korean name beside the English one for a place the dictionary does not know", () => {
    const unknown = new Map([["BGD.9_1", { nameEn: "Zzzland", nameKo: "즈즈랜드" }]]);
    expect(level1DisplayNameV163(unknown.get("BGD.9_1"), "B-017", "BGD")).toBe("즈즈랜드 (Zzzland)");
    expect(level1DisplayNameV163({ nameEn: "Zzzland", nameKo: "" }, "B-017", "BGD")).toBe("Zzzland");
    expect(level1DisplayNameV163({ nameEn: "", nameKo: "즈즈랜드" }, "B-017", "BGD")).toBe("즈즈랜드");
    expect(level1DisplayNameV163(undefined, "B-017", "BGD")).toBe("");
  });

  it("returns nothing, not the key, when nothing readable exists", () => {
    expect(regionLabelV163({ row: { adm1Code: "BGD.8_1", adm1Name: "BGD.8_1" }, iso3: "BGD", elementId: "B-017" })).toBe("");
    expect(regionLabelV163({ row: { adm1Code: "BGD.5_1" }, iso3: "BGD", elementId: "B-017", level1Names: names })).toBe("");
  });

  it("takes a stated unit label before the boundary file", () => {
    expect(regionLabelV163({ row: { adm1Code: "BGD.8_1", label: "수문 관측구역" }, iso3: "BGD", elementId: "B-017", level1Names: names })).toBe("수문 관측구역");
  });
});

describe("miniMapCountryV163 - wording from the registry's level-1 terms", () => {
  it("states the basis in the country's own word and count", () => {
    expect(level1BasisCaptionV163({ label: "주(Division)", count: 8 })).toBe("8개 주(Division) 기준");
    expect(level1BasisCaptionV163({ label: "Division", count: 0 })).toBe("Division 기준");
    expect(level1BasisCaptionV163(null)).toBe("");
    expect(level1BasisCaptionV163({ label: "", count: 8 })).toBe("");
  });

  it("words the boundary credit like the big map", () => {
    expect(boundaryCreditPhraseV163("방글라데시", { label: "주(Division)", count: 8 })).toBe("방글라데시 주(Division) 8개 · CC BY 4.0");
    expect(boundaryCreditPhraseV163("", null)).toBe("CC BY 4.0");
  });
});

describe("miniMapCountryV163 - where the map looks", () => {
  const VNM_BOX = { west: 102.1, east: 109.6, south: 8.1, north: 23.5 };
  const registry = {
    countries: [
      { iso3: "VNM", bbox: [102.14, 8.18, 109.46, 23.39] },
      { iso3: "BGD", bbox: [88.01, 20.74, 92.68, 26.63] },
      { iso3: "XXX", bbox: [1, 2, 1, 5] },
      { iso3: "YYY" },
    ],
  };

  it("keeps Viet Nam's box and reads another country's from the registry", () => {
    expect(countryCoreBoxV163("VNM", VNM_BOX, registry)).toBe(VNM_BOX);
    expect(countryCoreBoxV163("BGD", VNM_BOX, registry)).toEqual({ west: 88.01, south: 20.74, east: 92.68, north: 26.63 });
    expect(countryCoreBoxV163("bgd", VNM_BOX, registry)).toEqual({ west: 88.01, south: 20.74, east: 92.68, north: 26.63 });
  });

  it("never lends Viet Nam's box to a country without a usable bbox", () => {
    expect(countryCoreBoxV163("XXX", VNM_BOX, registry)).toBeNull();
    expect(countryCoreBoxV163("YYY", VNM_BOX, registry)).toBeNull();
    expect(countryCoreBoxV163("ZZZ", VNM_BOX, registry)).toBeNull();
    expect(countryCoreBoxV163("BGD", VNM_BOX, null)).toBeNull();
  });

  it("centres the longitude scale on the extent, and leaves Viet Nam's 17 degrees alone", () => {
    expect(projectionCenterLatV163([[90, 21], [92, 26]])).toBe(23.5);
    expect(projectionCenterLatV163([])).toBeUndefined();
    const coords: Array<[number, number]> = [[102, 8], [110, 24], [106, 16]];
    const unchanged = overviewProjectionV148(coords, 460, 400);
    const explicit = overviewProjectionV148(coords, 460, 400, 17);
    for (const point of coords) expect(unchanged(point)).toEqual(explicit(point));
    // a different centre changes the scale of longitude, so the picture is not Viet Nam's
    const bgd: Array<[number, number]> = [[88, 21], [92.7, 26.6]];
    expect(overviewProjectionV148(bgd, 460, 400, 23.7)(bgd[1])).not.toEqual(overviewProjectionV148(bgd, 460, 400)(bgd[1]));
  });
});

describe("detailMapSelectionForCountryV163 - another country's own selectors", () => {
  const layer = {
    elementId: "B-039",
    dataUrl: "fixture/b-039.json",
    selectors: {
      defaultVariable: "m-a",
      defaultPeriod: "2017",
      periods: ["2017", "2018"],
      variables: [
        { key: "m-a", label: "총잠재량", measureId: "m-a", unit: "GWh/yr", periods: ["2017", "2018"] },
        { key: "m-b", label: "최대 격자", measureId: "mid-b", unit: "GWh/yr", periods: ["2017"] },
      ],
    },
  } as unknown as CountryMapLayerV122;
  const selection = (patch: Record<string, unknown>) => ({ ...EMPTY_DATA_FINDER_SELECTOR_STATE_V125, ...patch }) as typeof EMPTY_DATA_FINDER_SELECTOR_STATE_V125;

  it("opens on the layer's default with no note when nothing is selected", () => {
    expect(detailMapSelectionForCountryV163(layer, selection({}))).toEqual({ variable: "m-a", period: "2017", note: "" });
  });

  it("follows a measure and a period the layer states", () => {
    expect(detailMapSelectionForCountryV163(layer, selection({ measure: "mid-b" }))).toEqual({ variable: "m-b", period: "2017", note: "" });
    expect(detailMapSelectionForCountryV163(layer, selection({ measure: "m-a", period: "2018" }))).toEqual({ variable: "m-a", period: "2018", note: "" });
    expect(detailMapSelectionForCountryV163(layer, selection({ year: 2018 })).period).toBe("2018");
  });

  it("discloses a fallback instead of substituting silently", () => {
    const missingMeasure = detailMapSelectionForCountryV163(layer, selection({ measure: "gross-potential" }));
    expect(missingMeasure.variable).toBe("m-a");
    expect(missingMeasure.note).toBe("선택 항목의 지도자료가 없어 아래에 명시한 항목을 표시합니다.");
    const missingPeriod = detailMapSelectionForCountryV163(layer, selection({ measure: "m-b", period: "2018" }));
    expect(missingPeriod).toEqual({ variable: "m-b", period: "2017", note: "선택 시점의 지도자료가 없어 2017 자료를 표시합니다." });
  });

  it("takes a slice handed over from the big map when this layer has it", () => {
    const handed = selection({ dimensions: { __mapElementId: "B-039", __mapVariable: "m-b", __mapPeriod: "2017" } });
    expect(detailMapSelectionForCountryV163(layer, handed)).toEqual({ variable: "m-b", period: "2017", note: "" });
    const other = selection({ dimensions: { __mapElementId: "B-040", __mapVariable: "m-b", __mapPeriod: "2017" } });
    expect(detailMapSelectionForCountryV163(layer, other).variable).toBe("m-a");
  });

  it("says nothing about measures for a layer that has no values to follow (points)", () => {
    const points = { ...layer, dataUrl: undefined } as unknown as CountryMapLayerV122;
    expect(detailMapSelectionForCountryV163(points, selection({ measure: "gross-potential", period: "1999" })).note).toBe("");
  });
});

describe("shared map code - what V163 changed for another country", () => {
  it("names a unit without a value row from the boundary file, never by its key", () => {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { choroplethFeatureCollection } = require("../../map/layers/features");
    const layer = { elementId: "B-017", publicShortTitle: "물 스트레스", selectors: { variables: [{ key: "m-a", label: "지표" }] } };
    const asset = {
      geometry: { features: [
        { properties: { divisionKey: "BGD.7_1", nameEn: "Sylhet" }, geometry: { type: "Polygon", coordinates: [] } },
        { properties: { divisionKey: "BGD.8_1", nameEn: "Mymensingh" }, geometry: { type: "Polygon", coordinates: [] } },
      ] },
      data: { joinKey: "divisionKey", values: [{ adm1Code: "BGD.7_1", adm1Name: "Sylhet", variable: "m-a", period: "2023", value: 2.7, unit: "점" }] },
    };
    const { collection } = choroplethFeatureCollection(layer, asset, { variable: "m-a", period: "2023" });
    const [withValue, without] = collection.features.map((f: { properties: Record<string, unknown> }) => f.properties);
    expect(withValue).toMatchObject({ adm1Code: "BGD.7_1", adm1Name: "Sylhet", hasValue: true });
    expect(without).toMatchObject({ adm1Code: "BGD.8_1", adm1Name: "Mymensingh", hasValue: false });
  });

  it("draws another country's level-1 outline only when its credit is given; Viet Nam's is unchanged", () => {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { applyBoundaryReferenceV152 } = require("../../map/layers/boundaryLayer");
    const make = () => {
      const sources: Record<string, { attribution?: string }> = {};
      const layers: string[] = [];
      const map = {
        getLayer: (id: string) => (layers.includes(id) ? {} : undefined),
        getSource: (id: string) => sources[id],
        removeLayer: (id: string) => layers.splice(layers.indexOf(id), 1),
        removeSource: (id: string) => { delete sources[id]; },
        addSource: (id: string, spec: { attribution?: string }) => { sources[id] = spec; },
        addLayer: (spec: { id: string }) => { layers.push(spec.id); },
        getStyle: () => ({ layers: [] }),
      };
      return { map, sources, layers };
    };
    const collection = { type: "FeatureCollection", features: [{ type: "Feature", properties: {}, geometry: { type: "Polygon", coordinates: [] } }] };

    const big = make();
    applyBoundaryReferenceV152(big.map, "BGD", collection);
    expect(Object.keys(big.sources)).toEqual([]);

    const mini = make();
    applyBoundaryReferenceV152(mini.map, "BGD", collection, { countryCredit: "방글라데시 주(Division) 8개 · CC BY 4.0" });
    expect(Object.values(mini.sources)[0].attribution).toContain("방글라데시 주(Division) 8개");
    expect(Object.values(mini.sources)[0].attribution).not.toContain("VNM");
    expect(mini.layers).toHaveLength(1);
    applyBoundaryReferenceV152(mini.map, "BGD", null, { countryCredit: "x" });
    expect(mini.layers).toHaveLength(0);

    const vnm = make();
    applyBoundaryReferenceV152(vnm.map, "VNM", collection);
    expect(Object.values(vnm.sources)[0].attribution).toContain("geoBoundaries VNM ADM1");
  });

  it("keeps a reviewed title that names Viet Nam off another country's popups", () => {
    const { publicMapLayerTitleV126 } = require("../visualization/publicMapWorkspaceV126") as typeof import("../visualization/publicMapWorkspaceV126");
    // Viet Nam, and a call without a country, read the title as reviewed.
    expect(publicMapLayerTitleV126("A-024", "송전망")).toBe("베트남 송전망");
    expect(publicMapLayerTitleV126("A-024", "송전망", "VNM")).toBe("베트남 송전망");
    // Another country takes the layer's own name; titles that name no country are untouched.
    expect(publicMapLayerTitleV126("A-024", "송전망", "BGD")).not.toContain("베트남");
    expect(publicMapLayerTitleV126("A-023", "발전소", "BGD")).toBe("발전소");
  });
});
