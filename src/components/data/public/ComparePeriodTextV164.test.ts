import { describe, expect, test } from "@jest/globals";
import { comparePeriodTextV164 } from "./DetailCountryCompareV158";

/**
 * V164-3 (WP-E): the country compare caption dated B-001's 30-year normal to one
 * year ("1991년"). The delivered label names the span; any other series keeps "YYYY년".
 */
describe("comparePeriodTextV164", () => {
  test("a climatology is dated by its span", () => {
    expect(comparePeriodTextV164("연 평년강수 (1991-2020 평년)", 1991)).toBe("1991–2020 평년");
  });

  test("a series that is not a climatology keeps its year", () => {
    expect(comparePeriodTextV164("GDP 총액", 2023)).toBe("2023년");
    expect(comparePeriodTextV164(null, 2023)).toBe("2023년");
  });
});
