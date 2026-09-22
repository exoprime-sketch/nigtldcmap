import { describe, expect, it, jest } from "@jest/globals";
import type { Map as MapLibreMap } from "maplibre-gl";
import {
  BACKDROP_LAYER_PREFIX_V151,
  BACKDROP_SOURCE_PREFIX_V151,
  CITY_TILE_NAMES_V151,
  DEFAULT_MAP_BACKDROP_V151,
  LEGACY_MAP_BACKDROP_STORAGE_KEY_V150,
  MAP_BACKDROP_KINDS_V151,
  MAP_BACKDROP_STORAGE_KEY_V151,
  MapBackdropKindV151,
  TILE_LABEL_TEXT_FIELD_V151,
  applyMapBackdropV151,
  backdropAttributionV151,
  backdropKindLabelV151,
  backdropOwnsCityLabelsV151,
  backdropTileUrlsV151,
  isMapBackdropKindV151,
  prefetchBackdropTilesV151,
  readMapBackdropKindV151,
  removeMapBackdropV151,
  slippyTilesForBboxV151,
  writeMapBackdropKindV151,
  prefetchTilesV151,
} from "./mapBackdropV151";

// ------------------------------------------------------------------ kinds

describe("kinds and labels", () => {
  it("lists kinds in UI order and defaults to terrain", () => {
    expect(MAP_BACKDROP_KINDS_V151).toEqual(["terrain", "satellite", "streets", "none"]);
    expect(DEFAULT_MAP_BACKDROP_V151).toBe("terrain");
  });
  it("validates kinds", () => {
    for (const kind of MAP_BACKDROP_KINDS_V151) expect(isMapBackdropKindV151(kind)).toBe(true);
    expect(isMapBackdropKindV151("hybrid")).toBe(false);
    expect(isMapBackdropKindV151(undefined)).toBe(false);
  });
  it("labels each kind in Korean", () => {
    expect(backdropKindLabelV151("terrain")).toBe("지형");
    expect(backdropKindLabelV151("satellite")).toBe("위성");
    expect(backdropKindLabelV151("streets")).toBe("도로·지명");
    expect(backdropKindLabelV151("none")).toBe("없음");
  });
});

// ------------------------------------------------------------------ storage

function fakeStorage(initial: Record<string, string> = {}): Storage {
  const store = new Map(Object.entries(initial));
  return {
    getItem: (key: string) => (store.has(key) ? store.get(key)! : null),
    setItem: (key: string, value: string) => { store.set(key, value); },
    removeItem: (key: string) => { store.delete(key); },
  } as unknown as Storage;
}

describe("storage migration", () => {
  it("returns the default when there is no storage", () => {
    expect(readMapBackdropKindV151(null)).toBe("terrain");
  });
  it("the v151 key wins outright", () => {
    const storage = fakeStorage({ [MAP_BACKDROP_STORAGE_KEY_V151]: "streets", [LEGACY_MAP_BACKDROP_STORAGE_KEY_V150]: "off" });
    expect(readMapBackdropKindV151(storage)).toBe("streets");
  });
  it("migrates v150 off to none, once", () => {
    const storage = fakeStorage({ [LEGACY_MAP_BACKDROP_STORAGE_KEY_V150]: "off" });
    expect(readMapBackdropKindV151(storage)).toBe("none");
    expect(storage.getItem(MAP_BACKDROP_STORAGE_KEY_V151)).toBe("none");
    expect(storage.getItem(LEGACY_MAP_BACKDROP_STORAGE_KEY_V150)).toBeNull();
  });
  it("migrates v150 on to terrain", () => {
    const storage = fakeStorage({ [LEGACY_MAP_BACKDROP_STORAGE_KEY_V150]: "on" });
    expect(readMapBackdropKindV151(storage)).toBe("terrain");
  });
  it("migrates a garbage v150 value to terrain", () => {
    const storage = fakeStorage({ [LEGACY_MAP_BACKDROP_STORAGE_KEY_V150]: "garbage-value" });
    expect(readMapBackdropKindV151(storage)).toBe("terrain");
  });
  it("migrates a missing v150 value to terrain", () => {
    expect(readMapBackdropKindV151(fakeStorage())).toBe("terrain");
  });
  it("swallows a throwing storage", () => {
    const throwing: Storage = {
      getItem: () => { throw new Error("blocked"); },
      setItem: () => { throw new Error("blocked"); },
      removeItem: () => { throw new Error("blocked"); },
    } as unknown as Storage;
    expect(readMapBackdropKindV151(throwing)).toBe("terrain");
    expect(() => writeMapBackdropKindV151(throwing, "satellite")).not.toThrow();
  });
});

// ------------------------------------------------------------------ tiles

describe("slippyTilesForBboxV151", () => {
  const bbox = { west: 102.1, east: 109.6, south: 8.1, north: 23.5 };
  function expectedTilesAtZoom(z: number) {
    const n = 2 ** z;
    const lonToX = (lon: number) => Math.floor(((lon + 180) / 360) * n);
    const latToY = (lat: number) => {
      const rad = (lat * Math.PI) / 180;
      return Math.floor(((1 - Math.log(Math.tan(rad) + 1 / Math.cos(rad)) / Math.PI) / 2) * n);
    };
    const tiles: Array<{ z: number; x: number; y: number }> = [];
    for (let x = lonToX(bbox.west); x <= lonToX(bbox.east); x++) {
      for (let y = latToY(bbox.north); y <= latToY(bbox.south); y++) tiles.push({ z, x, y });
    }
    return tiles;
  }
  it("matches the standard XYZ formula at z5", () => {
    expect(slippyTilesForBboxV151(bbox, [5])).toEqual(expectedTilesAtZoom(5));
  });
  it("stays within a sane count across z5-7 (wide z5-6 + core z7)", () => {
    const tiles = prefetchTilesV151([5, 6, 7]);
    expect(tiles.length).toBeGreaterThanOrEqual(40);
    expect(tiles.length).toBeLessThanOrEqual(120);
  });
  it("dedupes across zooms", () => {
    const tiles = slippyTilesForBboxV151(bbox, [5, 5]);
    expect(tiles).toEqual(expectedTilesAtZoom(5));
  });
});

describe("backdropTileUrlsV151", () => {
  const tiles = [{ z: 5, x: 1, y: 2 }];
  it("terrain uses s3 terrarium and OFM", () => {
    const urls = backdropTileUrlsV151("terrain", tiles);
    expect(urls.some((u) => u.includes("s3.amazonaws.com"))).toBe(true);
    expect(urls.some((u) => u.includes("tiles.openfreemap.org"))).toBe(true);
    expect(urls.some((u) => u.includes("arcgisonline.com"))).toBe(false);
  });
  it("satellite uses esri and OFM", () => {
    const urls = backdropTileUrlsV151("satellite", tiles);
    expect(urls.some((u) => u.includes("server.arcgisonline.com"))).toBe(true);
    expect(urls.some((u) => u.includes("tiles.openfreemap.org"))).toBe(true);
  });
  it("streets uses only OFM", () => {
    const urls = backdropTileUrlsV151("streets", tiles);
    expect(urls.every((u) => u.includes("tiles.openfreemap.org"))).toBe(true);
    expect(urls.length).toBeGreaterThan(0);
  });
  it("none requests nothing", () => {
    expect(backdropTileUrlsV151("none", tiles)).toEqual([]);
  });
});

describe("prefetchBackdropTilesV151", () => {
  it("counts ok/failed and keeps at most `concurrency` requests in flight", async () => {
    let inFlight = 0;
    let maxInFlight = 0;
    let calls = 0;
    const fetchImpl = jest.fn(async () => {
      calls += 1;
      inFlight += 1;
      maxInFlight = Math.max(maxInFlight, inFlight);
      await new Promise((resolve) => setTimeout(resolve, 1));
      inFlight -= 1;
      if (calls % 4 === 0) throw new Error("network down");
      return { ok: calls % 3 !== 0 } as Response;
    });
    const result = await prefetchBackdropTilesV151("terrain", {
      fetchImpl: fetchImpl as unknown as typeof fetch,
      zooms: [5],
      concurrency: 6,
    });
    expect(result.requested).toBeGreaterThan(0);
    expect(result.ok + result.failed).toBe(result.requested);
    expect(maxInFlight).toBeLessThanOrEqual(6);
  });
});

// ------------------------------------------------------------------ attribution

describe("backdropAttributionV151", () => {
  it("credits OpenStreetMap for every visible backdrop", () => {
    for (const kind of ["terrain", "satellite", "streets"] as MapBackdropKindV151[]) {
      const attribution = backdropAttributionV151(kind);
      expect(attribution.lines.join(" ")).toContain("OpenStreetMap");
    }
  });
  it("has no attribution for none", () => {
    expect(backdropAttributionV151("none").lines).toEqual([]);
  });
});

// ------------------------------------------------------------------ city label ownership

describe("backdropOwnsCityLabelsV151", () => {
  it("is true only for streets", () => {
    expect(backdropOwnsCityLabelsV151("streets")).toBe(true);
    expect(backdropOwnsCityLabelsV151("terrain")).toBe(false);
    expect(backdropOwnsCityLabelsV151("satellite")).toBe(false);
    expect(backdropOwnsCityLabelsV151("none")).toBe(false);
  });
});

// ------------------------------------------------------------------ fake map application

interface StubLayer { id: string; [key: string]: unknown }

function createStubMap() {
  const layers: StubLayer[] = [{ id: "cdp-country-fill" }];
  const sources: Record<string, unknown> = {};
  const listeners = new Map<string, Set<(event: unknown) => void>>();
  let sprite: string | null = null;
  const stub = {
    getLayer: (id: string) => layers.find((layer) => layer.id === id),
    getSource: (id: string) => sources[id],
    addLayer: (layer: StubLayer, beforeId?: string) => {
      const index = beforeId ? layers.findIndex((existing) => existing.id === beforeId) : -1;
      if (index >= 0) layers.splice(index, 0, layer); else layers.push(layer);
    },
    addSource: (id: string, spec: unknown) => { sources[id] = spec; },
    removeLayer: (id: string) => { const index = layers.findIndex((layer) => layer.id === id); if (index >= 0) layers.splice(index, 1); },
    removeSource: (id: string) => { delete sources[id]; },
    setPaintProperty: jest.fn(),
    setSprite: (value: string | null) => { sprite = value; },
    getStyle: () => ({ layers: [...layers], sources: { ...sources }, sprite: sprite || undefined }),
    on: (type: string, handler: (event: unknown) => void) => {
      if (!listeners.has(type)) listeners.set(type, new Set());
      listeners.get(type)!.add(handler);
    },
    off: (type: string, handler: (event: unknown) => void) => { listeners.get(type)?.delete(handler); },
  };
  return { stub, layers, sources, spriteRef: () => sprite };
}

describe("applyMapBackdropV151 / removeMapBackdropV151 against a stub map", () => {
  it("none only resets base paint, adds nothing", async () => {
    const { stub, layers, sources } = createStubMap();
    await applyMapBackdropV151(stub as unknown as MapLibreMap, "none");
    expect(layers.filter((layer) => layer.id.startsWith(BACKDROP_LAYER_PREFIX_V151))).toHaveLength(0);
    expect(Object.keys(sources).filter((id) => id.startsWith(BACKDROP_SOURCE_PREFIX_V151))).toHaveLength(0);
    removeMapBackdropV151(stub as unknown as MapLibreMap);
  });

  it("terrain inserts its layers before cdp-country-fill and excludes the six cities from the tile place labels", async () => {
    const fetchMock = jest.fn(async () => ({ json: async () => ({ vector_layers: [{ id: "water" }, { id: "waterway" }, { id: "transportation" }, { id: "place" }] }) }));
    (globalThis as { fetch?: typeof fetch }).fetch = fetchMock as unknown as typeof fetch;

    const { stub, layers, sources } = createStubMap();
    await applyMapBackdropV151(stub as unknown as MapLibreMap, "terrain");

    const countryFillIndex = layers.findIndex((layer) => layer.id === "cdp-country-fill");
    const backdropIndices = layers.map((layer, index) => (layer.id.startsWith(BACKDROP_LAYER_PREFIX_V151) ? index : -1)).filter((index) => index >= 0);
    expect(backdropIndices.length).toBeGreaterThan(0);
    expect(backdropIndices.every((index) => index < countryFillIndex)).toBe(true);
    expect(Object.keys(sources).some((id) => id.startsWith(BACKDROP_SOURCE_PREFIX_V151))).toBe(true);

    const placeLabels = layers.find((layer) => layer.id === `${BACKDROP_LAYER_PREFIX_V151}place-labels`);
    expect(placeLabels).toBeDefined();
    expect(placeLabels?.filter).toEqual([
      "all",
      ["in", ["get", "class"], ["literal", ["town", "village"]]],
      ["!", ["in", ["coalesce", ["get", "name:en"], ["get", "name"]], ["literal", CITY_TILE_NAMES_V151]]],
    ]);
    expect((placeLabels?.layout as Record<string, unknown>)?.["text-field"]).toEqual(TILE_LABEL_TEXT_FIELD_V151);

    removeMapBackdropV151(stub as unknown as MapLibreMap);
    expect(layers.filter((layer) => layer.id.startsWith(BACKDROP_LAYER_PREFIX_V151))).toHaveLength(0);
    expect(Object.keys(sources).filter((id) => id.startsWith(BACKDROP_SOURCE_PREFIX_V151))).toHaveLength(0);
  });
});
