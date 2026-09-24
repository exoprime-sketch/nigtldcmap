import { describe, expect, test } from "@jest/globals";
import { filterByTierV160 } from "./DataExplorerPage";
import { allTiersV160 } from "../data/spec/coreFirstV160";

/**
 * V160 slice C: the finder's tier gate, extracted as a pure function so it
 * can be tested against the real 152-element tier table without rendering
 * the page (which needs the catalog, the card-summary fetch, etc.).
 */
const ALL_152 = allTiersV160().map((row) => ({ elementId: row.elementId }));

describe("filterByTierV160", () => {
  test("core (default): exactly the 57 core elements", () => {
    const result = filterByTierV160(ALL_152, "core", "");
    expect(result).toHaveLength(57);
  });

  test("all ('전체 보기'): every non-hidden element (142)", () => {
    const result = filterByTierV160(ALL_152, "all", "");
    expect(result).toHaveLength(142);
  });

  test("hidden elements never appear, in core or all", () => {
    const hiddenIds = new Set(
      allTiersV160().filter((row) => row.tier === "hidden").map((row) => row.elementId)
    );
    expect(hiddenIds.size).toBe(11);
    for (const tier of ["core", "all"] as const) {
      const result = filterByTierV160(ALL_152, tier, "");
      for (const item of result) expect(hiddenIds.has(item.elementId)).toBe(false);
    }
  });

  test("a non-empty search widens tier=core to every non-hidden element (142)", () => {
    const result = filterByTierV160(ALL_152, "core", "베트남");
    expect(result).toHaveLength(142);
  });

  test("a non-empty search still excludes hidden elements", () => {
    const hiddenIds = new Set(
      allTiersV160().filter((row) => row.tier === "hidden").map((row) => row.elementId)
    );
    const result = filterByTierV160(ALL_152, "all", "search term");
    for (const item of result) expect(hiddenIds.has(item.elementId)).toBe(false);
    expect(result).toHaveLength(142);
  });

  test("whitespace-only query does not count as a search (core stays 57)", () => {
    const result = filterByTierV160(ALL_152, "core", "   ");
    expect(result).toHaveLength(57);
  });

  test("an element absent from the tier table (unknown elementId) is excluded", () => {
    const withUnknown = [...ALL_152, { elementId: "Z-999" }];
    const result = filterByTierV160(withUnknown, "all", "");
    expect(result.some((item) => item.elementId === "Z-999")).toBe(false);
    expect(result).toHaveLength(142);
  });
});
