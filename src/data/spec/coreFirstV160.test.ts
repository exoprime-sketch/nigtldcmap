import { describe, expect, test } from "@jest/globals";
import { allTypologyV159 } from "./datasetSpecV159";
import { allTiersV160, HOME_QUESTIONS_V160 } from "./coreFirstV160";

const tiers = allTiersV160();
const typology = new Map(allTypologyV159().map((row) => [row.elementId, row]));

describe("V160 information tiers", () => {
  test("every one of the 152 elements has exactly one tier", () => {
    expect(tiers).toHaveLength(152);
    expect(new Set(tiers.map((row) => row.elementId)).size).toBe(152);
    for (const row of tiers) expect(["core", "support", "reference", "hidden"]).toContain(row.tier);
  });

  test("the plan's counts: core 57 · support 50 · reference 34 · hidden 11", () => {
    const count = (tier: string) => tiers.filter((row) => row.tier === tier).length;
    expect([count("core"), count("support"), count("reference"), count("hidden")]).toEqual([57, 50, 34, 11]);
  });

  test("core elements are public (never a ⓪ status element)", () => {
    for (const row of tiers.filter((item) => item.tier === "core")) expect(typology.get(row.elementId)?.displayType).not.toBe("U0");
  });

  test("hidden = the ten exclusions plus the one not yet delivered (the ⓪ elements)", () => {
    const hidden = tiers.filter((row) => row.tier === "hidden").map((row) => row.elementId).sort();
    expect(hidden).toEqual(["A-017", "C-015", "C-020", "C-021", "C-023", "D-024", "E-008", "E-011", "E-013", "E-016", "E-017"]);
    const statusIds = [...typology.values()].filter((row) => row.displayType === "U0").map((row) => row.elementId).sort();
    expect(hidden).toEqual(statusIds);
  });
});

describe("V160 home questions", () => {
  test("six questions, one per display type, each with at least five core datasets", () => {
    expect(HOME_QUESTIONS_V160.map((question) => question.displayType)).toEqual(["U1", "U2", "U3", "U4", "U5", "U6"]);
    for (const question of HOME_QUESTIONS_V160) {
      expect(question.coreElementIds.length).toBeGreaterThanOrEqual(5);
      expect([...question.description].length).toBeLessThanOrEqual(40);
      for (const id of question.coreElementIds) expect(tiers.find((row) => row.elementId === id)?.tier).toBe("core");
    }
  });

  test("the six questions together hold all 57 core datasets", () => {
    expect(HOME_QUESTIONS_V160.flatMap((question) => question.coreElementIds).sort()).toEqual(
      tiers.filter((row) => row.tier === "core").map((row) => row.elementId).sort()
    );
  });

  test("a KPI is either a card-summary headline or absent - never estimated", () => {
    for (const question of HOME_QUESTIONS_V160) {
      if (question.heroIndicator) expect(question.heroIndicator.source).toBe("card-summaries-v140 headline");
    }
  });
});
