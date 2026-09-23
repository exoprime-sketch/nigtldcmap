import { describe, expect, it, jest } from "@jest/globals";
import {
  claimMiniMapSlotV152,
  featureBboxV152,
  MINIMAP_BOUNDS_MARGIN_DEG_V152,
  MINIMAP_FIT_PADDING_V152,
  MINIMAP_INITIAL_V152,
  MINIMAP_LOCALE_V152,
  MINIMAP_ZOOM_V152,
  miniMapBoundsV152,
  miniMapHandoffV152,
  miniMapOptionsV152,
  miniMapReducerV152,
  miniMapSlotCountV152,
  type MiniMapEventV152,
  type MiniMapMachineV152,
} from "./miniMapStateV152";

const run = (events: MiniMapEventV152[], start: MiniMapMachineV152 = MINIMAP_INITIAL_V152) =>
  events.reduce(miniMapReducerV152, start);

describe("mini map state machine (V152)", () => {
  it("starts static and only an intent starts the engine", () => {
    expect(MINIMAP_INITIAL_V152.state).toBe("static");
    for (const event of [{ type: "ready" }, { type: "fail" }, { type: "offscreen" }, { type: "preempted" }] as MiniMapEventV152[]) {
      expect(run([event]).state).toBe("static");
    }
    for (const source of ["hover", "focus", "pointer", "touch", "click", "button", "wheel"] as const) {
      const next = run([{ type: "intent", source }]);
      expect(next.state).toBe("loading");
      expect(next.lastIntent).toBe(source);
    }
  });

  it("has no time-based event: nothing but an intent leaves static", () => {
    // The event union is closed; every non-intent event keeps a static map static.
    const nonIntent: MiniMapEventV152["type"][] = ["ready", "fail", "offscreen", "preempted"];
    for (const type of nonIntent) expect(run([{ type } as MiniMapEventV152]).state).toBe("static");
  });

  it("goes static -> loading -> active -> static (released off screen or by another mini map)", () => {
    const active = run([{ type: "intent", source: "hover" }, { type: "ready" }]);
    expect(active.state).toBe("active");
    expect(run([{ type: "offscreen" }], active).state).toBe("static");
    expect(run([{ type: "preempted" }], active).state).toBe("static");
    // A release during loading cancels the start.
    expect(run([{ type: "intent", source: "click" }, { type: "offscreen" }]).state).toBe("static");
    // Repeated intents while active change nothing.
    expect(run([{ type: "intent", source: "click" }], active)).toBe(active);
  });

  it("falls back to the static map on failure and retries once on the next intent", () => {
    const failed = run([{ type: "intent", source: "pointer" }, { type: "fail" }]);
    expect(failed.state).toBe("error");
    expect(failed.failures).toBe(1);
    const retried = run([{ type: "intent", source: "pointer" }], failed);
    expect(retried.state).toBe("loading");
    const failedTwice = run([{ type: "fail" }], retried);
    expect(failedTwice.state).toBe("error");
    expect(run([{ type: "intent", source: "pointer" }], failedTwice).state).toBe("error");
  });
});

describe("one engine per page", () => {
  it("claiming the slot releases the previous holder", () => {
    const first = jest.fn();
    const second = jest.fn();
    const giveBackFirst = claimMiniMapSlotV152(first);
    expect(miniMapSlotCountV152()).toBe(1);
    const giveBackSecond = claimMiniMapSlotV152(second);
    expect(first).toHaveBeenCalledTimes(1);
    expect(second).not.toHaveBeenCalled();
    expect(miniMapSlotCountV152()).toBe(1);
    giveBackFirst();
    expect(miniMapSlotCountV152()).toBe(1);
    giveBackSecond();
    expect(miniMapSlotCountV152()).toBe(0);
  });
});

describe("mini map options", () => {
  const container = {} as HTMLElement;
  const bbox = featureBboxV152({
    type: "FeatureCollection",
    features: [
      { type: "Feature", properties: {}, geometry: { type: "Point", coordinates: [105.8, 21.0] } },
      { type: "Feature", properties: {}, geometry: { type: "LineString", coordinates: [[106.6, 10.8], [108.2, 16.1]] } },
      { type: "Feature", properties: {}, geometry: { type: "GeometryCollection", geometries: [{ type: "Point", coordinates: [104.0, 12.0] }] } },
    ],
  });

  it("measures the drawn features' extent", () => {
    expect(bbox).toEqual([104.0, 10.8, 108.2, 21.0]);
    expect(featureBboxV152({ type: "FeatureCollection", features: [] })).toBeNull();
  });

  it("fits the layer and bounds panning to the country plus a 2-degree margin", () => {
    const bounds = miniMapBoundsV152(bbox);
    expect(bounds.fit).toEqual(bbox);
    expect(MINIMAP_BOUNDS_MARGIN_DEG_V152).toBe(2);
    expect(bounds.max).toEqual([102.1 - 2, 8.1 - 2, 109.6 + 2, 23.5 + 2]);
    // Without a layer extent the country is the fit.
    expect(miniMapBoundsV152(null).fit).toEqual([102.1, 8.1, 109.6, 23.5]);
    // A layer reaching beyond the core box widens the pan limit with it.
    expect(miniMapBoundsV152([100, 5, 112, 24]).max).toEqual([98, 3, 114, 26]);
  });

  it("never captures page scroll, never rotates, zooms 4-12", () => {
    const options = miniMapOptionsV152(container, { version: 8 }, miniMapBoundsV152(bbox), null);
    expect(options.cooperativeGestures).toBe(true);
    expect(options.dragRotate).toBe(false);
    expect(options.pitchWithRotate).toBe(false);
    expect(options.touchPitch).toBe(false);
    expect(options.minZoom).toBe(4);
    expect(options.maxZoom).toBe(12);
    expect(MINIMAP_ZOOM_V152).toEqual({ min: 4, max: 12 });
    expect(options.bounds).toEqual([[104.0, 10.8], [108.2, 21.0]]);
    expect(options.fitBoundsOptions).toEqual({ padding: MINIMAP_FIT_PADDING_V152 });
    expect(MINIMAP_FIT_PADDING_V152).toBe(24);
    expect(options.maxBounds).toEqual([[100.1, 6.1], [111.6, 25.5]]);
    expect(options.attributionControl).toBe(false);
  });

  it("speaks Korean for the gesture hints", () => {
    const options = miniMapOptionsV152(container, {}, miniMapBoundsV152(null), null);
    expect(options.locale["CooperativeGesturesHandler.WindowsHelpText"]).toContain("Ctrl+스크롤");
    expect(options.locale["CooperativeGesturesHandler.MobileHelpText"]).toContain("두 손가락");
    expect(MINIMAP_LOCALE_V152["Map.Title"]).toBe("지도");
  });

  it("reopens a remembered camera, clamped to the zoom range", () => {
    const options = miniMapOptionsV152(container, {}, miniMapBoundsV152(null), { lng: 106, lat: 16, zoom: 14, bearing: 30 });
    expect(options.center).toEqual([106, 16]);
    expect(options.zoom).toBe(12);
    expect(options.bounds).toBeUndefined();
  });
});

describe("hand-off to the big map", () => {
  it("carries the live camera (no rotation) and the slice", () => {
    expect(miniMapHandoffV152({ lng: 105.5, lat: 20.1, zoom: 7.25, bearing: 12 }, { variable: "locations", period: "2021" })).toEqual({
      camera: { lng: 105.5, lat: 20.1, zoom: 7.25, bearing: 0 },
      selector: { variable: "locations", period: "2021" },
    });
  });

  it("carries no camera while the map is static and no selector without a period", () => {
    expect(miniMapHandoffV152(null, { variable: "gdp", period: "" })).toEqual({ camera: null, selector: null });
  });
});
