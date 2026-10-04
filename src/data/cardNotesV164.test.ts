import { describe, expect, it } from "@jest/globals";
import type { CardSummaryV140 } from "./cardSummariesV140";
import {
  factsMoreNoteV164,
  headlineCountV164,
  headlineSpacingV164,
  levelScopeNoteV164,
  publicUnitSpellingV164,
} from "./cardNotesV164";

function levelCard(overrides: Partial<CardSummaryV140> = {}): CardSummaryV140 {
  return {
    elementId: "D-023",
    title: "국제 기후기금 승인 사업",
    kind: "level",
    headline: { value: "4,209만 USD", label: "ODA 및 기후기금 재원 · Adaptation Fund 승인액 합계 · 방글라데시 대상 집계값 · 2026년" },
    preview: { unit: "USD", seriesLabel: "Adaptation Fund 승인액 합계 · 방글라데시 대상 집계값", others: [], note: "단일 시점 값" },
    period: "2026년",
    provider: "Global Environment Facility",
    selection: null,
    basis: { unit: "관측값", rule: "" },
    measure: null,
    mapConnected: true,
    downloadable: true,
    provenance: {
      entityCount: 119,
      indicatorIds: ["a", "b", "c", "d", "e", "f", "g", "h"],
      headlineIndicatorIds: ["a"],
    },
    ...overrides,
  };
}

describe("factsMoreNoteV164", () => {
  it("counts the rows a card drops from its list among the rest (C-016: 1 listed + 2 dropped + 89 = 92건)", () => {
    expect(factsMoreNoteV164("92건", 1, 2, 89)).toBe("외 91건은 상세에서");
  });

  it("keeps the plain sentence when the listed names and the rest add up to the headline", () => {
    expect(factsMoreNoteV164("27건", 3, 0, 24)).toBe("외 24건은 상세에서");
  });

  it("says it counts names when the headline counts more rows than names (B-033: 379건 rows, 3 + 264 names)", () => {
    const note = factsMoreNoteV164("379건", 3, 0, 264);
    expect(note).toBe("이름 기준 외 264개 (전체 379건, 상세에서 확인)");
    // The sentence never claims 264 more rows.
    expect(note).not.toBe("외 264건은 상세에서");
  });

  it("keeps the plain sentence when the headline is not a count", () => {
    expect(factsMoreNoteV164("12.12억", 3, 0, 4)).toBe("외 4건은 상세에서");
  });

  it("prints nothing when there is no rest", () => {
    expect(factsMoreNoteV164("5건", 2, 0, 0)).toBeNull();
  });
});

describe("levelScopeNoteV164", () => {
  it("says a one-series figure is one series and gives the dataset's own total (BGD D-023: 4,209만 USD of 119건)", () => {
    expect(levelScopeNoteV164(levelCard())).toBe("위 계열 하나의 값입니다 · 같은 자료의 전체 119건은 상세에서");
  });

  it("adds nothing when the headline takes every indicator, or there are no entities", () => {
    expect(levelScopeNoteV164(levelCard({ provenance: { entityCount: 119, indicatorIds: ["a"], headlineIndicatorIds: ["a"] } }))).toBeNull();
    expect(levelScopeNoteV164(levelCard({ provenance: { entityCount: 0, indicatorIds: ["a", "b"], headlineIndicatorIds: ["a"] } }))).toBeNull();
    expect(levelScopeNoteV164(levelCard({ provenance: undefined }))).toBeNull();
  });

  it("adds nothing when the headline is itself the count, or the card is not a level card", () => {
    expect(levelScopeNoteV164(levelCard({ headline: { value: "984건", label: "송전 선로 구간 수" } }))).toBeNull();
    expect(levelScopeNoteV164(levelCard({ kind: "line" }))).toBeNull();
  });
});

describe("headline wording", () => {
  it("writes a count and its unit together", () => {
    expect(headlineSpacingV164("984 건")).toBe("984건");
    expect(headlineSpacingV164("571,496 건")).toBe("571,496건");
    expect(headlineSpacingV164("76건")).toBe("76건");
    expect(headlineSpacingV164("5 곳")).toBe("5곳");
    expect(headlineSpacingV164("13.9 %")).toBe("13.9 %");
  });

  it("reads a headline count only from a count", () => {
    expect(headlineCountV164("379건")).toBe(379);
    expect(headlineCountV164("1,234 건")).toBe(1234);
    expect(headlineCountV164("4,209만 USD")).toBeNull();
    expect(headlineCountV164("12.12억 건")).toBeNull();
  });

  it("prints area and gas units as superscripts and subscripts", () => {
    expect(publicUnitSpellingV164("44 m2")).toBe("44 m²");
    expect(publicUnitSpellingV164("W/m2")).toBe("W/m²");
    expect(publicUnitSpellingV164("10 km2")).toBe("10 km²");
    expect(publicUnitSpellingV164("CO2")).toBe("CO₂");
    expect(publicUnitSpellingV164("CH4")).toBe("CH₄");
    expect(publicUnitSpellingV164("N2O")).toBe("N₂O");
    expect(publicUnitSpellingV164("0.15 tCO2eq/1,000 국제달러")).toBe("0.15 tCO₂eq/1,000 국제달러");
  });

  it("leaves other text alone", () => {
    expect(publicUnitSpellingV164("2m2x")).toBe("2m2x");
    expect(publicUnitSpellingV164("CO₂ 430.8")).toBe("CO₂ 430.8");
    expect(publicUnitSpellingV164("km")).toBe("km");
  });
});
