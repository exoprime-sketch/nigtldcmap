import { describe, expect, test } from "@jest/globals";
import { publicScenarioLabelV164 } from "./scenarioLabelV164";

describe("a scenario key reads as the platform labels it", () => {
  test("SSP keys become SSPx-y.z (Bangladesh B-004~B-007 legend)", () => {
    expect(publicScenarioLabelV164("ssp245")).toBe("SSP2-4.5");
    expect(publicScenarioLabelV164("ssp119")).toBe("SSP1-1.9");
    expect(publicScenarioLabelV164("ssp126")).toBe("SSP1-2.6");
    expect(publicScenarioLabelV164("ssp370")).toBe("SSP3-7.0");
    expect(publicScenarioLabelV164("ssp460")).toBe("SSP4-6.0");
    expect(publicScenarioLabelV164("SSP585")).toBe("SSP5-8.5");
  });

  test("the historical run keeps the label the grouped layers already show", () => {
    expect(publicScenarioLabelV164("historical")).toBe("과거 모형(historical)");
  });

  test("an unknown key is returned as it came, never invented; empty stays empty", () => {
    expect(publicScenarioLabelV164("rcp85")).toBe("rcp85");
    expect(publicScenarioLabelV164("")).toBe("");
    expect(publicScenarioLabelV164(null)).toBe("");
  });
});
