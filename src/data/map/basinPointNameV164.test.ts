import { describe, expect, test } from "@jest/globals";
import { basinPointNameForElementV164, basinPointNameV164 } from "./basinPointNameV164";
import { categoryShareLinesV161 } from "./mapSelectionModelV161";

describe("an unnamed basin point reads as what it is, never as the product and column name", () => {
  test("Bangladesh B-028 outlet cell: no HydroBASINS, no MAIN_BAS", () => {
    const name = basinPointNameForElementV164("B-028", "HydroBASINS MAIN_BAS 4080025450");
    expect(name).toBe("유역 출구 대표점 (번호 4080025450)");
    expect(name).not.toMatch(/MAIN_BAS|HydroBASINS/u);
    // The delivered pop-up wording with the term expansion in it.
    expect(basinPointNameV164("HydroBASINS(하이드로베이슨 유역 단위) MAIN_BAS 4080025450", { outlet: true })).toBe("유역 출구 대표점 (번호 4080025450)");
  });

  test("Bangladesh B-025 basin centre", () => {
    expect(basinPointNameForElementV164("B-025", "유역(HydroBASINS 4080025470)")).toBe("유역 대표점 (번호 4080025470)");
  });

  test("Viet Nam B-025 keeps what follows the id", () => {
    expect(basinPointNameForElementV164("B-025", "HydroBASINS 유역 4080015550 · 국내 완결 · 자국 내 2,672.3 km²")).toBe(
      "유역 대표점 (번호 4080015550) · 국내 완결 · 자국 내 2,672.3 km²"
    );
  });

  test("a station or river the source names is left as it is; other layers are untouched", () => {
    expect(basinPointNameForElementV164("B-028", "Bahadurabad (Brahmaputra (Jamuna) River)")).toBe("Bahadurabad (Brahmaputra (Jamuna) River)");
    expect(basinPointNameForElementV164("B-028", "세산 (Sê San)")).toBe("세산 (Sê San)");
    expect(basinPointNameForElementV164("B-017", "HydroBASINS 유역 441053")).toBe("HydroBASINS 유역 441053");
  });
});

describe("the same-class share names the band in Korean", () => {
  test("B-017 'High (3-4)' reads 높음 (3-4) and the counts still follow the source label", () => {
    const [line] = categoryShareLinesV161("High (3-4)", { "High (3-4)": 155, "Extremely High (4-5)": 112, "Medium - High (2-3)": 120 }, "평가구역");
    expect(line.value).toBe("높음 (3-4) 155개 / 평가구역 387개 (40.1%)");
    expect(line.value).not.toContain("High");
  });

  test("a label the table does not know stays as written", () => {
    expect(categoryShareLinesV161("광역", { 광역: 2, 기타: 2 }, "대상")[0].value).toBe("광역 2개 / 대상 4개 (50%)");
  });
});
