import { afterEach, beforeEach, describe, expect, jest, test } from "@jest/globals";
import { act } from "react-dom/test-utils";
import { createRoot } from "react-dom/client";
import type { Root } from "react-dom/client";

import DetailLocationMapV148 from "./DetailLocationMapV148";
import { EMPTY_DATA_FINDER_SELECTOR_STATE_V125 } from "../../../types/dataFinderV125";

// The live map needs WebGL and the icon kit needs the glyph sheet; this suite is about what the small map says.
jest.mock("../../map/MiniMapV152", () => ({
  __esModule: true,
  default: ({ children }: { children?: unknown }) => <div data-testid="mini-map-stub">{children as never}</div>,
}));
jest.mock("../../map/mapIconKitV152", () => ({
  mapIconCategoryV152: () => null,
  mapIconLegendEntriesV152: () => [],
  assetIconPropertiesV164: (_elementId: string, properties: unknown) => properties,
  assetIconCategoriesV164: () => null,
  MapIconSpriteV152: () => null,
  MapIconLegendV152: () => null,
  mapIconImageIdV152: (id: string) => id,
  MAP_ICON_INK_V152: "#000",
}));
// What the loaders hand back: set per test (mock-prefixed names may be read by the hoisted factories).
let mockLayers: unknown[] = [];
let mockRecords: unknown[] = [];
let mockEntityCalls: Array<[string, string]> = [];
jest.mock("../../../data/countries/countryDataFacadeV122", () => ({
  loadCountryMapIndexV122: async () => mockLayers,
  loadCountryElementEntitiesV122: async (iso3: string, elementId: string) => {
    mockEntityCalls.push([iso3, elementId]);
    return { records: mockRecords };
  },
}));
const mockGeo: Record<string, unknown> = {};
jest.mock("../../../data/countries/countryDataLoaderV158", () => ({
  countryDataLoaderV158: () => ({
    loadSpatialGeoJson: async (url: string) => mockGeo[url] ?? mockGeo.base,
    loadSpatialLayer: async (url: string) => mockGeo[url],
  }),
}));
jest.mock("../../../data/countries/countryLevel1V158", () => ({
  countryLevel1AssetUrlV162: () => "/geo/bgd-adm1-8.geojson",
  countryLevel1V158: () => ({ label: "주(Division)", count: 8 }),
}));

(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const square = (x: number, y: number) => ({ type: "Polygon", coordinates: [[[x, y], [x + 1, y], [x + 1, y + 1], [x, y + 1], [x, y]]] });
const lineAt = (x: number, y: number) => ({ type: "MultiLineString", coordinates: [[[x, y], [x + 0.5, y + 0.5]]] });
const collection = (features: unknown[]) => ({ type: "FeatureCollection", features });

function layerOf(elementId: string, overrides: Record<string, unknown> = {}, period = "2024") {
  return {
    layerId: `${elementId}-layer`,
    elementId,
    label: elementId,
    publicShortTitle: `${elementId} 제목`,
    renderer: "point",
    enabled: true,
    unit: "",
    source: "테스트 기관",
    sourceOrganizations: ["테스트 기관"],
    filters: [],
    selectors: {
      defaultPeriod: period,
      defaultVariable: "locations",
      periods: [period],
      variables: [{ key: "locations", label: "위치", periods: [period], unit: "곳" }],
    },
    ...overrides,
  };
}

let recordNumber = 0;
function record(elementId: string, attributes: Record<string, unknown>, at: [number, number] | null = [106 + (recordNumber % 3) * 0.3, 16 + (recordNumber % 4) * 0.3]) {
  recordNumber += 1;
  return {
    recordId: `${elementId}-${recordNumber}`,
    elementId,
    indicatorId: `${elementId}_indicator`,
    latitude: at ? at[1] : null,
    longitude: at ? at[0] : null,
    mapEligible: at !== null,
    normalizedAttributes: attributes,
    provenance: { sourceOrg: "테스트 기관", referenceYear: "" },
  };
}

let container: HTMLDivElement;
let root: Root;

beforeEach(() => {
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
  Object.keys(mockGeo).forEach((key) => delete mockGeo[key]);
  mockGeo.base = collection([
    { type: "Feature", id: "a", properties: { adm1Code: "VN-01", name: "A" }, geometry: square(105, 15) },
    { type: "Feature", id: "b", properties: { adm1Code: "VN-02", name: "B" }, geometry: square(107, 17) },
  ]);
  mockLayers = [];
  mockRecords = [];
  mockEntityCalls = [];
});

afterEach(async () => {
  await act(async () => root.unmount());
  container.remove();
});

async function mount(elementId: string, layers: unknown[], countryIso3 = "VNM") {
  mockLayers = layers;
  await act(async () => {
    root.render(
      <DetailLocationMapV148
        elementId={elementId}
        countryIso3={countryIso3}
        selection={EMPTY_DATA_FINDER_SELECTOR_STATE_V125}
        onOpenMap={() => undefined}
      />
    );
  });
  // The loaders and the icon kit resolve over a few ticks.
  for (let tick = 0; tick < 6; tick += 1) {
    await act(async () => { await new Promise((resolve) => setTimeout(resolve, 0)); });
  }
  return container.querySelector("section") as HTMLElement;
}

const text = (node: Element | null) => (node?.textContent || "").replace(/\s+/gu, " ").trim();

describe("line layers", () => {
  test("A-027 roads and railway are not titled as transmission lines and carry no kV legend", async () => {
    mockGeo["/geo/roads.geojson"] = collection([
      { type: "Feature", id: 1, properties: { class: "고속도로", name: "고속 1" }, geometry: lineAt(105, 15) },
      { type: "Feature", id: 2, properties: { class: "고속도로" }, geometry: lineAt(105.2, 15.2) },
      { type: "Feature", id: 3, properties: { class: "철도", name: "남북선" }, geometry: lineAt(106, 16) },
    ]);
    const layer = layerOf("A-027", {
      renderer: "line",
      geometryUrl: "/geo/roads.geojson",
      filters: [{ field: "class", label: "구분", values: ["고속도로", "간선도로", "주요도로", "철도"] }],
      selectors: { defaultPeriod: "2026", defaultVariable: "all", periods: ["2026"], variables: [{ key: "all", label: "전체", periods: ["2026"], unit: "km" }] },
    }, "2026");
    const section = await mount("A-027", [layer]);

    expect(text(section.querySelector("h3"))).toBe("노선 위치");
    const legend = text(section.querySelector("figure figcaption"));
    expect(legend).toContain("고속도로 2");
    expect(legend).toContain("철도 1");
    expect(legend).toContain("3개 노선 구간");
    expect(legend).not.toContain("kV");
    expect(legend).not.toContain("선로");
    // The selection list names an unnamed segment by its class, never by an empty voltage.
    const options = [...section.querySelectorAll("select[aria-label='작은 지도 지역·대상 선택'] option")].map((option) => text(option));
    expect(options).toContain("고속도로 구간 2");
    expect(options.some((option) => option.includes("kV"))).toBe(false);
  });

  test("A-024 transmission lines keep the voltage title and the kV legend", async () => {
    mockGeo["/geo/grid.geojson"] = collection([
      { type: "Feature", id: 1, properties: { voltageKv: 110 }, geometry: lineAt(105, 15) },
      { type: "Feature", id: 2, properties: { voltageKv: 220 }, geometry: lineAt(106, 16) },
    ]);
    const layer = layerOf("A-024", {
      renderer: "line",
      geometryUrl: "/geo/grid.geojson",
      filters: [{ field: "voltageKv", label: "전압", values: ["110", "220", "500"] }],
      selectors: { defaultPeriod: "2016", defaultVariable: "all", periods: ["2016"], variables: [{ key: "all", label: "전체", periods: ["2016"], unit: "km" }] },
    }, "2016");
    const section = await mount("A-024", [layer]);

    expect(text(section.querySelector("h3"))).toBe("송전선 경로");
    const legend = text(section.querySelector("figure figcaption"));
    expect(legend).toContain("220 kV");
    expect(legend).toContain("2개 선로 구간");
  });
});

describe("the period in a point map's title", () => {
  test("a register of events says the years its events cover, not the layer's own year", async () => {
    const records = [
      record("B-012", { 재해유형: "홍수", 시작일: "1952-08-01" }),
      record("B-012", { 재해유형: "홍수", 시작일: "1999-11-02" }),
      record("B-012", { 재해유형: "가뭄", 시작일: "2024-09-05" }),
    ];
    mockRecords = records;
    const section = await mount("B-012", [layerOf("B-012", { renderer: "cluster" })]);

    const attributes = section.getAttribute("data-map-period-label");
    expect(attributes).toBe("1952–2024");
    expect(section.getAttribute("data-map-period")).toBe("2024");
    expect(text(section.querySelector("header p"))).toContain("1952–2024");
    expect(text(section.querySelector("header p"))).not.toMatch(/·\s*2024$/u);
  });

  test("a layer whose file states no year shows none (basins: the 2026 was the delivery's)", async () => {
    const records = [record("B-025", { 유역명: "A" }), record("B-025", { 유역명: "B" })];
    mockRecords = records;
    const section = await mount("B-025", [layerOf("B-025", {}, "2026")]);

    expect(section.getAttribute("data-map-period-label")).toBe("");
    // The subtitle names the shown variable and carries no year.
    expect(text(section.querySelector("header p"))).toBe("위치");
    expect(section.querySelector("svg")?.getAttribute("aria-label")).not.toContain("2026");
  });

  test("a projection layer keeps its own period", async () => {
    const records = [record("B-008", { 연도: "2020" }), record("B-008", { 연도: "2100" })];
    mockRecords = records;
    const section = await mount("B-008", [layerOf("B-008", {}, "2100")]);

    expect(section.getAttribute("data-map-period-label")).toBe("2100");
  });
});

describe("mineral layers on the host's mines", () => {
  const join = {
    hostElementId: "B-048",
    elementId: "B-044",
    attributes: [{ elementId: "B-044", mineral: "구리", label: "부존", valueText: "부존 확인", period: "", source: "USGS", oreTypes: ["구리"] }],
  };

  test("B-044 draws the host's mines that carry the mineral, labelled by what the year belongs to", async () => {
    const hostMines = [
      record("B-048", { 광종: "구리" }),
      record("B-048", { 광종: "금 / 구리" }),
      record("B-048", { 광종: "석탄" }),
    ];
    mockRecords = hostMines;
    const section = await mount("B-044", [layerOf("B-044", { entityJoinV157_2: join }, "2022")]);

    expect(mockEntityCalls).toEqual([["VNM", "B-048"]]);
    expect(section.getAttribute("data-testid")).toBe("detail-location-map-v148");
    expect(section.getAttribute("data-map-count")).toBe("2");
    expect(section.getAttribute("data-map-period-label")).toBe("광산 위치 기준 2022");
  });

  test("a layer with nothing to place says so instead of drawing an empty map", async () => {
    const hostMines = [record("B-048", { 광종: "석탄" }), record("B-048", { 광종: "구리" }, null)];
    mockRecords = hostMines;
    const section = await mount("B-046", [layerOf("B-046", { entityJoinV157_2: { ...join, elementId: "B-046" } }, "2022")]);

    expect(section.getAttribute("data-testid")).toBe("detail-map-no-sites-v164");
    expect(text(section)).toContain("지도에 표시할 위치가 없습니다");
    expect(section.querySelector("svg")).toBeNull();
  });
});

describe("another country's regional map", () => {
  function divisionLayer() {
    mockGeo.base = collection([
      { type: "Feature", id: "d1", properties: { divisionKey: "BGD.1_1", nameEn: "Barisal" }, geometry: square(89, 22) },
      { type: "Feature", id: "d2", properties: { divisionKey: "BGD.2_1", nameEn: "Dhaka" }, geometry: square(90, 23) },
      { type: "Feature", id: "d3", properties: { divisionKey: "BGD.3_1", nameEn: "Sylhet" }, geometry: square(91, 24) },
    ]);
    mockGeo["/geo/bgd-adm1-8.geojson"] = mockGeo.base;
    mockGeo["/layers/b-030.json"] = {
      joinKey: "divisionKey",
      values: [
        { adm1Code: "BGD.1_1", adm1Name: "Barisal", variable: "v", period: "2020", value: 3 },
        { adm1Code: "BGD.2_1", adm1Name: "Dhaka", variable: "v", period: "2020", value: 5 },
      ],
    };
    return layerOf("B-030", {
      renderer: "admin1-choropleth",
      geometryUrl: "/geo/bgd-adm1-8.geojson",
      dataUrl: "/layers/b-030.json",
      selectors: { defaultPeriod: "2020", defaultVariable: "v", periods: ["2020"], variables: [{ key: "v", label: "값", periods: ["2020"], unit: "ha" }] },
    }, "2020");
  }

  test("units without a value are counted and named under the map", async () => {
    const section = await mount("B-030", [divisionLayer()], "BGD");

    const caption = text(section.querySelector("[data-testid='detail-map-coverage-v164']"));
    expect(caption).toContain("3개 주(Division) 중 2개에 값 있음");
    expect(caption).toContain("값 없음:");
    expect(caption).toContain("Sylhet");
    expect(caption).not.toContain("BGD.");
  });

  test("a map in which every unit has a value says nothing about coverage", async () => {
    const layer = divisionLayer();
    (mockGeo["/layers/b-030.json"] as { values: unknown[] }).values.push({ adm1Code: "BGD.3_1", adm1Name: "Sylhet", variable: "v", period: "2020", value: 7 });
    const section = await mount("B-030", [layer], "BGD");

    expect(section.querySelector("[data-testid='detail-map-coverage-v164']")).toBeNull();
  });
});

describe("Viet Nam's 34-unit layer (D-022, V164-R3)", () => {
  // Boundary features carry `unitCode`, the value rows `adm1Code34`: no `adm1Code` on either side.
  function layer34() {
    mockGeo["/geo/vnm-adm1-34.geojson"] = collection([
      { type: "Feature", id: "u1", properties: { unitCode: "VN34-22", name: "Nghệ An" }, geometry: square(105, 15) },
      { type: "Feature", id: "u2", properties: { unitCode: "VN34-44", name: "An Giang" }, geometry: square(106, 16) },
      { type: "Feature", id: "u3", properties: { unitCode: "VN34-01", name: "Lai Châu" }, geometry: square(107, 17) },
    ]);
    mockGeo["/layers/d-022.json"] = {
      joinKey: "adm1Code34",
      values: [
        { adm1Code34: "VN34-22", adm1Name34: "Nghệ An", variable: "project-count", period: "1997–2025", value: 3, unit: "건" },
        { adm1Code34: "VN34-44", adm1Name34: "An Giang", variable: "project-count", period: "1997–2025", value: 1, unit: "건" },
      ],
    };
    return layerOf("D-022", {
      renderer: "admin1-choropleth",
      geometryUrl: "/geo/vnm-adm1-34.geojson",
      dataUrl: "/layers/d-022.json",
      unit: "건",
      selectors: { defaultPeriod: "1997–2025", defaultVariable: "project-count", periods: ["1997–2025"], variables: [{ key: "project-count", label: "사업 수(소재 성 기준)", periods: ["1997–2025"], unit: "건" }] },
    }, "1997–2025");
  }

  const unitPaths = (section: HTMLElement) => Array.from(section.querySelectorAll<SVGPathElement>("svg path[data-has-value]"));

  test("units with a value are filled, units without one are pale grey with a thin line, and none is 'picked'", async () => {
    const section = await mount("D-022", [layer34()]);

    const paths = unitPaths(section);
    expect(paths).toHaveLength(3);
    const withValue = paths.filter((path) => path.getAttribute("data-has-value") === "true");
    const without = paths.filter((path) => path.getAttribute("data-has-value") === "false");
    expect(withValue).toHaveLength(2);
    expect(without).toHaveLength(1);
    expect(without[0].getAttribute("fill")).toBe("#edf1ef");
    expect(without[0].getAttribute("stroke-width")).toBe("0.65");
    expect(without[0].getAttribute("stroke")).not.toBe("#142e27");
    expect(withValue.every((path) => path.getAttribute("fill") !== "#edf1ef")).toBe(true);
    // No unit is drawn as the selected one before anything is picked.
    expect(paths.some((path) => path.hasAttribute("data-picked"))).toBe(false);
    expect(paths.every((path) => path.getAttribute("stroke-width") === "0.65")).toBe(true);
  });

  test("the legend names 'no data' with a swatch", async () => {
    const section = await mount("D-022", [layer34()]);
    const legend = section.querySelector("[data-testid='detail-map-nodata-legend-v164']");
    expect(legend).not.toBeNull();
    expect(text(legend)).toContain("자료 없음");
    expect(legend?.querySelector(".detail-map148-nodata-key")).not.toBeNull();
  });

  test("the selection list names the units in Korean and picking one marks only that unit", async () => {
    const section = await mount("D-022", [layer34()]);
    const select = section.querySelector("select[aria-label='작은 지도 지역·대상 선택']") as HTMLSelectElement;
    const options = Array.from(select.querySelectorAll("option")).map((option) => text(option));
    expect(options).toContain("응에안");
    expect(options.some((option) => /VN34|adm1/u.test(option))).toBe(false);

    await act(async () => {
      select.value = "VN34-22";
      select.dispatchEvent(new Event("change", { bubbles: true }));
    });
    const picked = unitPaths(section).filter((path) => path.hasAttribute("data-picked"));
    expect(picked).toHaveLength(1);
    expect(picked[0].getAttribute("stroke-width")).toBe("2.5");
  });
});
