import { describe, expect, it } from "@jest/globals";
import { populatedIndicatorIdsV164, technologyOptionsForIndicatorsV159 } from "./TechFilterV159";

/**
 * V164-3 (WP-F): VNM D-002 chip "24 기타 온실가스 처리 및 대체 기술" and D-003 chip
 * "15 폐자원" were tagged on indicators whose every row is empty, so the chip led
 * to a screen with no value. The chips are computed from the indicators that hold
 * a value.
 */
const indicators = [
  { indicatorId: "D-002_a", technologyIds: ["24"] },
  { indicatorId: "D-002_b", technologyIds: ["CTIS-05"] },
  { indicatorId: "D-002_c", technologyIds: ["11"] },
];

const observations = [
  { indicatorId: "D-002_a", value: null },
  { indicatorId: "D-002_a", value: "" },
  { indicatorId: "D-002_b", value: 12 },
  { indicatorId: "D-002_c", value: 0 },
];

describe("populatedIndicatorIdsV164", () => {
  it("lists the indicators that hold at least one value, and keeps a zero", () => {
    expect([...populatedIndicatorIdsV164(observations)].sort()).toEqual(["D-002_b", "D-002_c"]);
  });

  it("counts an entity record as a reading of its indicator", () => {
    const ids = populatedIndicatorIdsV164(observations, [{ indicatorId: "D-002_a" }, { indicatorId: null }, {}]);
    expect([...ids].sort()).toEqual(["D-002_a", "D-002_b", "D-002_c"]);
  });

  it("is empty for no rows", () => {
    expect(populatedIndicatorIdsV164([]).size).toBe(0);
  });
});

describe("technology chips from populated indicators", () => {
  const codes = (presentIds?: ReadonlySet<string>) => technologyOptionsForIndicatorsV159(indicators, presentIds).map((option) => option.code);

  it("without a filter the empty-valued technology is a chip (the old behavior)", () => {
    expect(codes()).toEqual(["05", "11", "24"]);
  });

  it("with the populated set the chip whose indicators are all empty is not offered", () => {
    expect(codes(populatedIndicatorIdsV164(observations))).toEqual(["05", "11"]);
  });

  it("a chip that remains still points at the indicators that hold its value", () => {
    const options = technologyOptionsForIndicatorsV159(indicators, populatedIndicatorIdsV164(observations));
    expect(options.find((option) => option.code === "05")?.indicatorIds).toEqual(["D-002_b"]);
  });
});
