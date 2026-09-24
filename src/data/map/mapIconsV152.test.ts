import { describe, expect, it, jest } from "@jest/globals";
import { MAP_ICON_PATHS_V152 } from "./mapIconPathsV152";
import type { MapIconIdV152 } from "./mapIconPathsV152";
import {
  MAP_ICON_BADGE_V152,
  MAP_ICON_INK_V152,
  MAP_ICON_LAYER_IDS_V152,
  MAP_ICON_SOURCES_V152,
  attachMapIconMissingHandlerV152,
  mapIconCategoryV152,
  mapIconIdFor,
  mapIconImageIdV152,
  mapIconLegendEntriesV152,
  mapIconSvg,
  mapLayerIconV152,
  registerMapIcons,
} from "./mapIconsV152";
import type { MaplibreMapLike } from "./mapIconsV152";

const LAYER_COLOR = "#3355ff";

// ------------------------------------------------------------------ A-023 power plants

describe("mapIconCategoryV152 — A-023 power plants", () => {
  const known: Array<[string, MapIconIdV152, string]> = [
    ["수력", "droplet", "#2f8fc1"],
    ["태양광", "solar-panel-2", "#e8a317"],
    ["풍력", "windmill", "#27a5a5"],
    ["석탄", "coal", "#3f3f46"],
    ["가스", "flame", "#377eb8"],
    ["가스·석유", "flame-barrel", "#4f6f8f"],
    ["석유", "barrel", "#6b7280"],
    ["바이오매스", "plant-2", "#5a9d55"],
    ["폐기물", "recycle", "#8c6bb1"],
    ["원자력", "radioactive", "#7a1f5c"],
    ["지열", "volcano", "#b5542b"],
  ];

  it.each(known)("%s (fuelType, Korean) -> %s / %s, fallback=false", (value, iconId, color) => {
    const category = mapIconCategoryV152("A-023", { fuelType: value }, LAYER_COLOR);
    expect(category).toEqual({ iconId, key: value, label: value, color, fallback: false });
  });

  it("reads primaryFuel (WRI rows) via the shared powerPlantFuelV141 reading", () => {
    expect(mapIconCategoryV152("A-023", { primaryFuel: "Hydro" }, LAYER_COLOR)).toEqual({
      iconId: "droplet",
      key: "수력",
      label: "수력",
      color: "#2f8fc1",
      fallback: false,
    });
  });

  it.each(["Hydro", "HYDRO", "hydro"])("English WRI key %s is case-insensitive", (value) => {
    expect(mapIconCategoryV152("A-023", { fuelType: value }, LAYER_COLOR)!.iconId).toBe("droplet");
  });

  it('"gas;oil" (WRI compound key) maps to 가스·석유 / flame-barrel', () => {
    expect(mapIconCategoryV152("A-023", { fuelType: "gas;oil" }, LAYER_COLOR)).toMatchObject({
      iconId: "flame-barrel",
      key: "가스·석유",
      fallback: false,
    });
  });

  it.each(["(미표기)", "미표기", "미기재", "unknown", "-", "", undefined])(
    "unstated variant %p -> bolt / 미기재 / #8a9a93, fallback=false (an intended category, not a fallback)",
    (value) => {
      const properties = value === undefined ? {} : { fuelType: value };
      expect(mapIconCategoryV152("A-023", properties, LAYER_COLOR)).toEqual({
        iconId: "bolt",
        key: "미기재",
        label: "미기재",
        color: "#8a9a93",
        fallback: false,
      });
    }
  );

  it("a raw value that is none of the 12 canonical labels renders as 미기재 but is flagged fallback=true", () => {
    expect(mapIconCategoryV152("A-023", { fuelType: "hydrogen" }, LAYER_COLOR)).toEqual({
      iconId: "bolt",
      key: "미기재",
      label: "미기재",
      color: "#8a9a93",
      fallback: true,
    });
  });
});

// ------------------------------------------------------------------ B-012 disasters

describe("mapIconCategoryV152 — B-012 disasters", () => {
  const known: Array<[string, MapIconIdV152]> = [
    ["폭풍·태풍", "storm"],
    ["홍수", "flood"],
    ["가뭄", "sun-high"],
    ["사면이동(습윤)", "landslide"],
    ["전염병", "virus"],
    ["산불", "flame"],
    ["병해충", "bug"],
    ["이상기온", "temperature-sun"],
  ];

  it.each(known)("%s (disasterType) -> %s, ring = layer colour, fallback=false", (value, iconId) => {
    expect(mapIconCategoryV152("B-012", { disasterType: value }, LAYER_COLOR)).toEqual({
      iconId,
      key: value,
      label: value,
      color: LAYER_COLOR,
      fallback: false,
    });
  });

  it("falls back to the Korean 재해유형 key when disasterType is absent", () => {
    expect(mapIconCategoryV152("B-012", { "재해유형": "홍수" }, LAYER_COLOR)).toMatchObject({ iconId: "flood", fallback: false });
  });

  it("an unrecognized non-empty value keeps the real text and is flagged fallback=true", () => {
    expect(mapIconCategoryV152("B-012", { disasterType: "쓰나미" }, LAYER_COLOR)).toEqual({
      iconId: "alert-triangle",
      key: "쓰나미",
      label: "쓰나미",
      color: LAYER_COLOR,
      fallback: true,
    });
  });

  it("a missing value is alert-triangle / 미기재, fallback=true", () => {
    expect(mapIconCategoryV152("B-012", {}, LAYER_COLOR)).toEqual({
      iconId: "alert-triangle",
      key: "미기재",
      label: "미기재",
      color: LAYER_COLOR,
      fallback: true,
    });
  });
});

// ------------------------------------------------------------------ C-025 carbon projects

describe("mapIconCategoryV152 — C-025 carbon projects", () => {
  const known: Array<[string, string]> = [
    ["CDM", "#7053a3"],
    ["Gold Standard", "#b8860b"],
    ["Verra VCS", "#2e7d32"],
    ["GCC", "#1565c0"],
    ["JCM", "#c62828"],
    ["ART TREES", "#6d4c41"],
  ];

  it.each(known)("%s -> certificate / %s, fallback=false", (value, color) => {
    expect(mapIconCategoryV152("C-025", { standard: value }, LAYER_COLOR)).toEqual({
      iconId: "certificate",
      key: value,
      label: value,
      color,
      fallback: false,
    });
  });

  it("an unrecognized registry groups under 기타 등록제도, fallback=true", () => {
    expect(mapIconCategoryV152("C-025", { standard: "Plan Vivo" }, LAYER_COLOR)).toEqual({
      iconId: "certificate",
      key: "기타 등록제도",
      label: "기타 등록제도",
      color: "#757575",
      fallback: true,
    });
  });

  it("a missing standard also groups under 기타 등록제도, fallback=true", () => {
    expect(mapIconCategoryV152("C-025", {}, LAYER_COLOR)!.key).toBe("기타 등록제도");
  });
});

// ------------------------------------------------------------------ B-048 mines

describe("mapIconCategoryV152 — B-048 mines", () => {
  const known: Array<[string, string]> = [
    ["니켈", "#5f7f3a"],
    ["구리", "#b5651d"],
    ["희토류", "#6a5acd"],
    ["보크사이트/알루미나", "#c0504d"],
    ["티타늄(ilmenite·leucoxene)", "#607d8b"],
    ["텅스텐(+형석·비스무트·구리)", "#37474f"],
  ];

  it.each(known)("%s -> pick / %s, fallback=false", (value, color) => {
    expect(mapIconCategoryV152("B-048", { mineral: value }, LAYER_COLOR)).toEqual({
      iconId: "pick",
      key: value,
      label: value,
      color,
      fallback: false,
    });
  });

  it("falls back to the Korean 광종 key when mineral is absent", () => {
    expect(mapIconCategoryV152("B-048", { "광종": "구리" }, LAYER_COLOR)).toMatchObject({ iconId: "pick", key: "구리", fallback: false });
  });

  it("an unrecognized mineral groups under 기타 광종 with the layer colour, fallback=true", () => {
    expect(mapIconCategoryV152("B-048", { mineral: "철광석" }, LAYER_COLOR)).toEqual({
      iconId: "pick",
      key: "기타 광종",
      label: "기타 광종",
      color: LAYER_COLOR,
      fallback: true,
    });
  });
});

// ------------------------------------------------------------------ E-005 universities/research/NGOs

describe("mapIconCategoryV152 — E-005 orgs", () => {
  const exact: Array<[string, MapIconIdV152, string]> = [
    ["대학", "school", "대학"],
    ["대학(학부)", "school", "대학"],
    ["대학(연구그룹)", "school", "대학"],
    ["연구소", "flask", "연구기관"],
    ["대학 부설 연구소", "flask", "연구기관"],
    ["싱크탱크", "flask", "연구기관"],
    ["연구기관(국가 아카데미)", "flask", "연구기관"],
    ["NGO", "heart-handshake", "NGO·네트워크"],
    ["NGO(국제)", "heart-handshake", "NGO·네트워크"],
    ["국제 NGO 대표사무소", "heart-handshake", "NGO·네트워크"],
    ["네트워크(NGO 연합)", "heart-handshake", "NGO·네트워크"],
  ];

  it.each(exact)("%s -> %s / %s, fallback=false", (value, iconId, key) => {
    expect(mapIconCategoryV152("E-005", { orgType: value }, LAYER_COLOR)).toEqual({
      iconId,
      key,
      label: key,
      color: LAYER_COLOR,
      fallback: false,
    });
  });

  it("regex fallback: NGO/네트워크 substrings win even when the exact string is new", () => {
    expect(mapIconCategoryV152("E-005", { orgType: "지역 네트워크 협의체" }, LAYER_COLOR)).toMatchObject({
      iconId: "heart-handshake",
      key: "NGO·네트워크",
      fallback: false,
    });
  });

  it("regex fallback: 연구/싱크탱크/아카데미 substrings", () => {
    expect(mapIconCategoryV152("E-005", { orgType: "지역 연구모임" }, LAYER_COLOR)).toMatchObject({
      iconId: "flask",
      key: "연구기관",
      fallback: false,
    });
  });

  it("regex fallback: 대학 substring", () => {
    expect(mapIconCategoryV152("E-005", { orgType: "대학교 총장 협의회" }, LAYER_COLOR)).toMatchObject({
      iconId: "school",
      key: "대학",
      fallback: false,
    });
  });

  it("regex priority: NGO/네트워크 is tried before 대학 when a value matches both", () => {
    expect(mapIconCategoryV152("E-005", { orgType: "대학 네트워크" }, LAYER_COLOR)).toMatchObject({
      iconId: "heart-handshake",
      key: "NGO·네트워크",
    });
  });

  it("a value matching no rule and no regex is building / 기타 기관, fallback=true", () => {
    expect(mapIconCategoryV152("E-005", { orgType: "정부부처" }, LAYER_COLOR)).toEqual({
      iconId: "building",
      key: "기타 기관",
      label: "기타 기관",
      color: LAYER_COLOR,
      fallback: true,
    });
  });

  it("a missing orgType is also building / 기타 기관, fallback=true", () => {
    expect(mapIconCategoryV152("E-005", {}, LAYER_COLOR)!.key).toBe("기타 기관");
  });
});

// ------------------------------------------------------------------ single-icon layers

describe("mapIconCategoryV152 — single-icon layers", () => {
  const layers: Array<[string, MapIconIdV152, string | undefined]> = [
    ["A-025", "cloud-down", undefined],
    ["B-008", "ripple", undefined],
    ["B-023", "gauge", undefined],
    ["B-028", "gauge", undefined],
    ["B-025", "droplets", undefined],
    ["D-018", "world", undefined],
    ["E-004", "building-bank", undefined],
    ["E-006", "coin", undefined],
    ["E-018", "building-skyscraper", "KR"],
    ["E-019", "building-bank", "KR"],
  ];

  it.each(layers)("%s -> %s, label=null (caller uses the layer title), color=layer colour", (elementId, iconId, tag) => {
    const category = mapIconCategoryV152(elementId, { anything: "is ignored" }, LAYER_COLOR)!;
    expect(category.iconId).toBe(iconId);
    expect(category.label).toBeNull();
    expect(category.color).toBe(LAYER_COLOR);
    expect(category.fallback).toBe(false);
    expect(category.tag).toBe(tag);
  });

  it("returns null for an element id with no icon rule", () => {
    expect(mapIconCategoryV152("Z-999", {}, LAYER_COLOR)).toBeNull();
  });
});

// ------------------------------------------------------------------ mapIconIdFor / mapLayerIconV152

describe("mapIconIdFor", () => {
  it("matches mapIconCategoryV152's iconId without needing a layer colour", () => {
    expect(mapIconIdFor("A-023", { fuelType: "수력" })).toBe("droplet");
    expect(mapIconIdFor("Z-999", {})).toBeNull();
  });
});

describe("mapLayerIconV152", () => {
  it("returns the representative icon for classified layers", () => {
    expect(mapLayerIconV152("A-023")).toBe("bolt");
    expect(mapLayerIconV152("B-012")).toBe("alert-triangle");
    expect(mapLayerIconV152("C-025")).toBe("certificate");
    expect(mapLayerIconV152("B-048")).toBe("pick");
    expect(mapLayerIconV152("E-005")).toBe("building");
  });

  it("returns the single icon itself for single-icon layers", () => {
    expect(mapLayerIconV152("A-025")).toBe("cloud-down");
    expect(mapLayerIconV152("E-019")).toBe("building-bank");
  });

  it("returns null for a layer with no icon rule", () => {
    expect(mapLayerIconV152("Z-999")).toBeNull();
  });
});

// ------------------------------------------------------------------ MAP_ICON_LAYER_IDS_V152

describe("MAP_ICON_LAYER_IDS_V152", () => {
  it("lists exactly the 15 layers this module has a rule for", () => {
    expect([...MAP_ICON_LAYER_IDS_V152].sort()).toEqual(
      ["A-023", "A-025", "B-008", "B-012", "B-023", "B-025", "B-028", "B-048", "C-025", "D-018", "E-004", "E-005", "E-006", "E-018", "E-019"].sort()
    );
    expect(MAP_ICON_LAYER_IDS_V152.length).toBe(15);
  });
});

// ------------------------------------------------------------------ legend grouping

describe("mapIconLegendEntriesV152", () => {
  it("groups by key, orders by the rule's declared order (not scan order), omits zero-count categories", () => {
    const features = [{ fuelType: "풍력" }, { fuelType: "수력" }, { fuelType: "수력" }, {}];
    const entries = mapIconLegendEntriesV152("A-023", features, LAYER_COLOR, "발전소");
    expect(entries.map((entry) => entry.key)).toEqual(["수력", "풍력", "미기재"]); // declared order, 풍력 was first in scan order
    expect(entries.map((entry) => entry.count)).toEqual([2, 1, 1]);
    expect(entries.every((entry) => entry.label !== null)).toBe(true);
    // Fuels with zero matches (e.g. 태양광) do not appear at all.
    expect(entries.some((entry) => entry.key === "태양광")).toBe(false);
  });

  it("sorts an undeclared raw value after the rule's declared categories", () => {
    const features = [{ disasterType: "쓰나미" }, { disasterType: "홍수" }, { disasterType: "폭풍·태풍" }];
    const entries = mapIconLegendEntriesV152("B-012", features, LAYER_COLOR, "재해");
    expect(entries.map((entry) => entry.key)).toEqual(["폭풍·태풍", "홍수", "쓰나미"]);
    expect(entries.find((entry) => entry.key === "쓰나미")?.fallback).toBe(true);
    expect(entries.every((entry) => entry.color === LAYER_COLOR)).toBe(true);
  });

  it("a single-icon layer collapses to one entry using the layer title as the label", () => {
    const features = [{}, {}, {}];
    const entries = mapIconLegendEntriesV152("B-008", features, "#112233", "해수면 상승 관측점");
    expect(entries).toEqual([
      { iconId: "ripple", key: "B-008", label: "해수면 상승 관측점", color: "#112233", count: 3, fallback: false },
    ]);
  });

  it("returns an empty list for no features", () => {
    expect(mapIconLegendEntriesV152("A-023", [], LAYER_COLOR, "발전소")).toEqual([]);
  });
});

// ------------------------------------------------------------------ generated glyph table

describe("MAP_ICON_PATHS_V152 (generated)", () => {
  const ids = Object.keys(MAP_ICON_PATHS_V152) as MapIconIdV152[];

  it("has all 35 icons this module references (31 Tabler + 2 Material + 2 custom)", () => {
    expect(ids.length).toBe(35);
  });

  it.each(ids)("%s has a usable glyph record", (id: MapIconIdV152) => {
    const glyph = MAP_ICON_PATHS_V152[id];
    expect(glyph.viewBox.split(/\s+/u)).toHaveLength(4);
    expect(["stroke", "fill"]).toContain(glyph.mode);
    expect(glyph.paths.length).toBeGreaterThan(0);
    for (const d of glyph.paths) expect(d.length).toBeGreaterThan(0);
    expect(["Tabler Icons", "Material Symbols", "자체 제작"]).toContain(glyph.source);
    expect(glyph.sourceName.length).toBeGreaterThan(0);
    expect(["MIT", "Apache-2.0", "CC0-1.0"]).toContain(glyph.license);
    expect(glyph.version.length).toBeGreaterThan(0);
  });

  it("every icon id used by a classification or single-icon rule exists in the table", () => {
    const usedIds = new Set<MapIconIdV152>();
    const sampleProps: Array<[string, Record<string, unknown>]> = [
      ["A-023", { fuelType: "수력" }],
      ["A-023", {}],
      ["B-012", { disasterType: "홍수" }],
      ["B-012", {}],
      ["C-025", { standard: "CDM" }],
      ["C-025", {}],
      ["B-048", { mineral: "니켈" }],
      ["B-048", {}],
      ["E-005", { orgType: "대학" }],
      ["E-005", {}],
      ...MAP_ICON_LAYER_IDS_V152.map((elementId): [string, Record<string, unknown>] => [elementId, {}]),
    ];
    for (const [elementId, properties] of sampleProps) {
      const category = mapIconCategoryV152(elementId, properties, LAYER_COLOR);
      if (category) usedIds.add(category.iconId);
    }
    for (const iconId of usedIds) expect(MAP_ICON_PATHS_V152[iconId]).toBeDefined();
  });
});

// ------------------------------------------------------------------ sources

describe("MAP_ICON_SOURCES_V152", () => {
  it("accounts for every generated icon exactly once", () => {
    const total = MAP_ICON_SOURCES_V152.reduce((sum, source) => sum + source.iconIds.length, 0);
    expect(total).toBe(Object.keys(MAP_ICON_PATHS_V152).length);
  });

  it("groups Tabler (MIT, including the flame-barrel composite), Material (Apache-2.0), custom (CC0-1.0)", () => {
    const byName = new Map(MAP_ICON_SOURCES_V152.map((source) => [source.name, source]));
    const tabler = byName.get("Tabler Icons")!;
    expect(tabler.license).toBe("MIT");
    expect(tabler.iconIds).toEqual(expect.arrayContaining(["droplet", "flame-barrel"]));

    const material = byName.get("Material Symbols")!;
    expect(material.license).toBe("Apache-2.0");
    expect([...material.iconIds].sort()).toEqual(["flood", "landslide"]);

    const custom = byName.get("자체 제작")!;
    expect(custom.license).toBe("CC0-1.0");
    expect(custom.iconIds).toEqual(["coal"]);
  });
});

// ------------------------------------------------------------------ mapIconImageIdV152 / mapIconSvg

describe("mapIconImageIdV152", () => {
  it("prefixes with mi152-", () => {
    expect(mapIconImageIdV152("droplet")).toBe("mi152-droplet");
  });
});

describe("mapIconSvg", () => {
  it("renders a stroke icon with the default ink colour and every path", () => {
    const svg = mapIconSvg("droplet");
    expect(svg.startsWith("<svg")).toBe(true);
    expect(svg).toContain('viewBox="0 0 24 24"');
    expect(svg).toContain(`stroke="${MAP_ICON_INK_V152}"`);
    expect(svg).toContain('fill="none"');
    for (const d of MAP_ICON_PATHS_V152.droplet.paths) expect(svg).toContain(d);
  });

  it("renders a fill icon with a custom colour and size", () => {
    const svg = mapIconSvg("flood", { color: "#ff0000", size: 32 });
    expect(svg.startsWith("<svg")).toBe(true);
    expect(svg).toContain('viewBox="0 -960 960 960"');
    expect(svg).toContain('fill="#ff0000"');
    expect(svg).toContain('width="32"');
    expect(svg).toContain('height="32"');
    for (const d of MAP_ICON_PATHS_V152.flood.paths) expect(svg).toContain(d);
  });
});

// ------------------------------------------------------------------ registerMapIcons / attachMapIconMissingHandlerV152
// No canvas in jsdom: only the pre-canvas skip path and the styleimagemissing
// wiring are exercised here; rasterisation itself is not unit-tested.

describe("registerMapIcons", () => {
  it("skips ids whose image already exists, without touching canvas", () => {
    const addImage = jest.fn();
    const fakeMap: MaplibreMapLike = { hasImage: () => true, addImage };
    const registered = registerMapIcons(fakeMap, ["droplet", "bolt", "flood"]);
    expect(registered).toEqual([]);
    expect(addImage).not.toHaveBeenCalled();
  });
});

describe("attachMapIconMissingHandlerV152", () => {
  it("only looks up ids with the mi152- prefix that are in the glyph table", () => {
    const hasImage = jest.fn(() => true);
    const addImage = jest.fn();
    let handler: ((event: { id?: string }) => void) | undefined;
    const fakeMap: MaplibreMapLike = {
      hasImage,
      addImage,
      on: (type, listener) => {
        if (type === "styleimagemissing") handler = listener;
      },
    };

    attachMapIconMissingHandlerV152(fakeMap);
    expect(handler).toBeDefined();

    handler!({ id: "unrelated-image" });
    expect(hasImage).not.toHaveBeenCalled();

    handler!({ id: "mi152-not-a-real-icon" });
    expect(hasImage).not.toHaveBeenCalled();

    handler!({ id: "mi152-droplet" });
    expect(hasImage).toHaveBeenCalledWith("mi152-droplet");
    expect(addImage).not.toHaveBeenCalled(); // hasImage already true -> skip before any canvas work
  });

  it("does nothing when the map cannot emit styleimagemissing", () => {
    const fakeMap: MaplibreMapLike = { hasImage: () => true, addImage: jest.fn() };
    expect(() => attachMapIconMissingHandlerV152(fakeMap)).not.toThrow();
  });
});

// ------------------------------------------------------------------ badge geometry constants

describe("MAP_ICON_BADGE_V152", () => {
  it("matches the agreed geometry", () => {
    expect(MAP_ICON_BADGE_V152).toEqual({
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
    });
  });
});
