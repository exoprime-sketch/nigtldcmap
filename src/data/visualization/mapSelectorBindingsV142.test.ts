import { describe, expect, it } from "@jest/globals";
import { resolveMapSelectorBindingV125, dataFinderSelectorFromMapV125 } from "./mapSelectorBindingsV125";
import { EMPTY_DATA_FINDER_SELECTOR_STATE_V125 } from "../../types/dataFinderV125";

describe("A-023 source context", () => {
  it("uses the WRI default year and accepts its own measure/filters", () => {
    const result = resolveMapSelectorBindingV125("A-023", { ...EMPTY_DATA_FINDER_SELECTOR_STATE_V125, measure: "measure-e5647010075d", dimensions: { fuelType: "수력", capacityBand: "10MW 미만" } });
    expect(result.period).toBe("2021");
    expect(result.reason).toBeNull();
  });
  it("distinguishes OSM and the mixed-source period", () => {
    expect(resolveMapSelectorBindingV125("A-023", { ...EMPTY_DATA_FINDER_SELECTOR_STATE_V125, dimensions: { sourceKey: "osm" } }).period).toBe("2026");
    expect(resolveMapSelectorBindingV125("A-023", { ...EMPTY_DATA_FINDER_SELECTOR_STATE_V125, dimensions: { sourceKey: "all" } }).period).toBe("2021·2026");
  });
  it("retains the all-source choice during map to detail handoff", () => {
    const result = dataFinderSelectorFromMapV125("A-023", { variable: "locations", period: "2026" }, { sourceKey: "all" });
    expect(result.dimensions.sourceKey).toBe("all");
    expect(result.period).toBe("2021·2026");
    expect(result.year).toBeNull();
  });
  it("continues warning about genuinely unsupported selectors", () => {
    expect(resolveMapSelectorBindingV125("A-023", { ...EMPTY_DATA_FINDER_SELECTOR_STATE_V125, dimensions: { unknownDimension: "x" } }).reason).not.toBeNull();
  });
});
