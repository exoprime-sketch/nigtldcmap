import { describe, expect, test } from "@jest/globals";
import { publicCategoryRowsV136_3 } from "./publicCategoryGroupingV136_3";

describe("publicCategoryRowsV136_3", () => {
  test("drops the classification code from the bar's label", () => {
    const rows = publicCategoryRowsV136_3(
      new Map([["23110 — 에너지 기타", 4]])
    );
    expect(rows).toHaveLength(1);
    expect(rows[0].displayLabel).toBe("에너지 기타");
    expect(rows[0].categoryKey).toBe("23110 — 에너지 기타");
    expect(rows[0].value).toBe(4);
  });

  test("keeps one code's two names apart", () => {
    // D-022 files sector 15110 under both of these. Counting by the code would
    // report three projects where the source records two and one.
    const rows = publicCategoryRowsV136_3(
      new Map([
        ["15110 — 공공행정 기타", 2],
        ["15110 — 중앙정부 행정", 1],
      ])
    );
    expect(rows).toHaveLength(2);
    expect(rows.map((row) => row.value)).toEqual([2, 1]);
    expect(rows.map((row) => row.displayLabel)).toEqual([
      "공공행정 기타",
      "중앙정부 행정",
    ]);
  });

  test("never merges two codes that share a display name", () => {
    // Removing the code makes both of these read "에너지 기타". Adding them up
    // would be a classification claim, and no approved mapping says so.
    const rows = publicCategoryRowsV136_3(
      new Map([
        ["23110 — 에너지 기타", 3],
        ["23210 — 에너지 기타", 2],
      ])
    );
    expect(rows).toHaveLength(2);
    expect(rows.map((row) => row.value).sort()).toEqual([2, 3]);
    // Kept apart on screen too, by the value that distinguishes them.
    expect(new Set(rows.map((row) => row.displayLabel)).size).toBe(2);
    expect(rows.map((row) => row.displayLabel)).toEqual(
      expect.arrayContaining(["23110 — 에너지 기타", "23210 — 에너지 기타"])
    );
  });

  test("preserves the total across the grouping", () => {
    const counts = new Map([
      ["23110 — 에너지 기타", 4],
      ["15110 — 공공행정 기타", 2],
      ["15110 — 중앙정부 행정", 1],
      ["31220 — 산림 개발", 2],
    ]);
    const rows = publicCategoryRowsV136_3(counts);
    const before = [...counts.values()].reduce((sum, value) => sum + value, 0);
    const after = rows.reduce((sum, row) => sum + row.value, 0);
    expect(after).toBe(before);
    expect(rows).toHaveLength(counts.size);
  });

  test("shortens only the label, never the key", () => {
    const key = "23110 — 에너지 기타";
    const rows = publicCategoryRowsV136_3(new Map([[key, 1]]), (value) =>
      value.slice(0, 3)
    );
    expect(rows[0].displayLabel).toBe("에너지");
    expect(rows[0].categoryKey).toBe(key);
  });
});
