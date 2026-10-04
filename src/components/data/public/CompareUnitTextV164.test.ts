import { describe, expect, it } from "@jest/globals";
import { publicUnitTextV164 } from "./CountryCompareBlockV158";

describe("publicUnitTextV164", () => {
  it("reads a keyed unit as words", () => {
    expect(publicUnitTextV164("십억 USD_2017/yr")).toBe("십억 USD(2017년 기준)/년");
    expect(publicUnitTextV164("MtCO₂e")).toBe("MtCO₂e");
    expect(publicUnitTextV164(null)).toBe("");
  });
});
