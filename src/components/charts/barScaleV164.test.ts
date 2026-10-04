import { describe, expect, test } from "@jest/globals";

import { barScaleV164, formatBarValueV164, formatBarWithUnitV164, isRankUnitV164 } from "./barScaleV164";

/**
 * Review 164: bar labels carried the six digits a source happens to hold
 * (3.2147, 52.2795, -205,894,297.17), a lone 0.1% filled the whole track, and a
 * rank was drawn as a bar. These pin the three rules that replace that.
 */
describe("bar value digits", () => {
  test.each([
    [3.2147, "3.21"],
    [52.2795, "52.3"],
    [0.6826, "0.683"],
    [0.0027, "0.0027"],
    [75.386, "75.4"],
    [12909.26, "12,909"],
    [-205894297.17, "-2.06억"],
    [0, "0"],
    [1234567, "1,234,567"],
  ])("%p is written as %p", (value, expected) => {
    expect(formatBarValueV164(value)).toBe(expected);
  });

  test("a rank is written as a place, a measure with its unit", () => {
    expect(formatBarWithUnitV164(29, "순위")).toBe("29위");
    expect(formatBarWithUnitV164(52.2795, "%")).toBe("52.3 %");
    expect(formatBarWithUnitV164(3.2147, "")).toBe("3.21");
  });

  test("only rank units are ranks", () => {
    expect(isRankUnitV164("순위")).toBe(true);
    expect(isRankUnitV164("위")).toBe(true);
    expect(isRankUnitV164("%")).toBe(false);
    expect(isRankUnitV164(undefined)).toBe(false);
  });
});

describe("bar scale", () => {
  test("a lone percentage is measured against 100", () => {
    const scale = barScaleV164([0.1], "%");
    expect(scale.basis).toBe("percent-100");
    expect(scale.spanFor(0.1)).toBeCloseTo(0.1, 6);
  });

  test("several percentages keep the longest bar as the full track", () => {
    const scale = barScaleV164([20, 40], "%");
    expect(scale.basis).toBe("data");
    expect(scale.spanFor(40)).toBeCloseTo(100, 6);
    expect(scale.spanFor(20)).toBeCloseTo(50, 6);
  });

  test("a lone value that is not a percentage still fills the track", () => {
    const scale = barScaleV164([3.2], "배");
    expect(scale.basis).toBe("data");
    expect(scale.spanFor(3.2)).toBeCloseTo(100, 6);
  });

  test("a stated maximum wins over the data", () => {
    const scale = barScaleV164([40], "점", 100);
    expect(scale.basis).toBe("maximum");
    expect(scale.spanFor(40)).toBeCloseTo(40, 6);
  });

  test("a rank has no track", () => {
    expect(barScaleV164([29, 3], "순위").drawTrack).toBe(false);
    expect(barScaleV164([29, 3], "%").drawTrack).toBe(true);
  });

  test("negative values put the zero line inside the track", () => {
    const scale = barScaleV164([-50, 150], "억 원");
    expect(scale.signed).toBe(true);
    expect(scale.zeroPercent).toBeCloseTo(25, 6);
    expect(scale.spanFor(-50)).toBeCloseTo(25, 6);
    expect(scale.spanFor(150)).toBeCloseTo(75, 6);
  });
});
