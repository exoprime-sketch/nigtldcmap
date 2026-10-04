import { describe, expect, it } from "@jest/globals";
import { categoryOptionsV164, finderResetValuesV164 } from "./finderFiltersV164";
import { finderSortNoteV164, hasCountedViewsV164 } from "./finderSortV160";

describe("finderResetValuesV164", () => {
  it("keeps the current country and clears every other condition", () => {
    const values = finderResetValuesV164("BGD");
    expect(values.countryIso3).toBe("BGD");
    expect(values).toEqual({
      query: "",
      countryIso3: "BGD",
      category: "all",
      group: null,
      sourceOrganization: "all",
      technologyId: "all",
      year: "all",
      delivery: "all",
      user: "all",
      type: "all",
    });
  });

  it("does not move a reader on 베트남 or on 전체 to another scope", () => {
    expect(finderResetValuesV164("VNM").countryIso3).toBe("VNM");
    expect(finderResetValuesV164("all").countryIso3).toBe("all");
  });
});

describe("categoryOptionsV164", () => {
  const catalogue = [
    { categoryCode: "B", categoryLabel: "기후 환경" },
    { categoryCode: "A", categoryLabel: "국가 기본 정보" },
    { categoryCode: "B", categoryLabel: "기후 환경" },
    { categoryCode: "D", categoryLabel: "시장·산업 및 재원" },
    { categoryCode: "C", categoryLabel: "정책·제도" },
    { categoryCode: "E", categoryLabel: "협력·실행 기반" },
  ];

  it("names each 대분류 as the catalogue (card path, detail, download list) names it", () => {
    expect(categoryOptionsV164(catalogue)).toEqual([
      { code: "A", label: "국가 기본 정보" },
      { code: "B", label: "기후 환경" },
      { code: "C", label: "정책·제도" },
      { code: "D", label: "시장·산업 및 재원" },
      { code: "E", label: "협력·실행 기반" },
    ]);
  });

  it("lists only the categories the catalogue has, and falls back to the code for a missing label", () => {
    expect(categoryOptionsV164([{ categoryCode: "C", categoryLabel: "" }])).toEqual([{ code: "C", label: "C" }]);
    expect(categoryOptionsV164([])).toEqual([]);
  });
});

describe("finderSortNoteV164", () => {
  it("says 조회순 is not counted yet only when 조회순 is the chosen order and nothing is counted", () => {
    const note = finderSortNoteV164("views", new Map());
    expect(note).toContain("조회 집계가 준비되면 조회순으로 표시합니다.");
    expect(note).toContain("가나다순");
    expect(finderSortNoteV164("views", new Map([["A-001", 0]]))).toContain("가나다순");
  });

  it("prints nothing for 가나다순 or once a view is counted", () => {
    expect(finderSortNoteV164("name", new Map())).toBeNull();
    expect(finderSortNoteV164("views", new Map([["A-001", 3]]))).toBeNull();
  });

  it("counts a view only when it is above zero", () => {
    expect(hasCountedViewsV164(new Map())).toBe(false);
    expect(hasCountedViewsV164(new Map([["A-001", 0]]))).toBe(false);
    expect(hasCountedViewsV164(new Map([["A-001", 0], ["A-002", 1]]))).toBe(true);
  });
});
