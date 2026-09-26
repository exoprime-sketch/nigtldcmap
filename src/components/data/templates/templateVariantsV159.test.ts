import { describe, expect, test } from "@jest/globals";
import { allTypologyV159, getTypologyV159 } from "../../../data/spec/datasetSpecV159";
import {
  ELEMENT_VARIANTS_V159,
  TEMPLATE_VARIANTS_V159,
  variantTemplateV159,
} from "./templateVariantsV159";
import { statusDecisionV159 } from "./U0StatusV159";
import { technologyOptionsForIndicatorsV159 } from "./TechFilterV159";

describe("V159 template variants", () => {
  test("every element's variant belongs to its own display type's template", () => {
    for (const [elementId, entry] of Object.entries(ELEMENT_VARIANTS_V159)) {
      const typology = getTypologyV159(elementId);
      expect(typology).not.toBeNull();
      expect(variantTemplateV159(entry.variant)).toBe(typology!.displayType);
    }
  });

  test("a variant is owned by exactly one template", () => {
    const seen = new Map<string, string>();
    for (const [type, list] of Object.entries(TEMPLATE_VARIANTS_V159)) {
      for (const variant of list) {
        expect(seen.has(variant)).toBe(false);
        seen.set(variant, type);
      }
    }
  });

  test("dedicated elements are exactly the spec's six groups", () => {
    const dedicated = allTypologyV159().filter((row) => row.dedicated).map((row) => row.elementId).sort();
    expect(dedicated).toEqual(["A-013", "A-023", "B-008", "B-046", "B-047", "D-004", "E-006"]);
    for (const id of dedicated) expect(ELEMENT_VARIANTS_V159[id]).toBeDefined();
  });

  test("status elements have no body variant", () => {
    for (const row of allTypologyV159().filter((item) => item.displayType === "U0")) {
      expect(ELEMENT_VARIANTS_V159[row.elementId]).toBeUndefined();
    }
  });
});

describe("V159 status decision", () => {
  test("reads the decision and the 2026 date from the status column", () => {
    expect(statusDecisionV159("제외(사용자 0923)")).toEqual({ decision: "제외", decidedAt: "2026-09-23" });
    expect(statusDecisionV159("미입고(상태안내)")).toEqual({ decision: "미입고", decidedAt: null });
  });
});

describe("V159 technology filter options", () => {
  test("offers only technologies that pick out part of the indicators", () => {
    const options = technologyOptionsForIndicatorsV159([
      { indicatorId: "X_a", technologyIds: ["7", "CTIS-08"] },
      { indicatorId: "X_b", technologyIds: ["07"] },
      { indicatorId: "X_c", technologyIds: [] },
    ]);
    // 07 is on every tagged indicator, so it filters nothing; 08 picks X_a.
    expect(options.map((item) => item.code)).toEqual(["08"]);
    expect(options[0].indicatorIds).toEqual(["X_a"]);
  });

  test("an element tagging every indicator with the same list offers nothing", () => {
    const all = Array.from({ length: 3 }, (_, index) => ({ indicatorId: `Y_${index}`, technologyIds: ["1", "2"] }));
    expect(technologyOptionsForIndicatorsV159(all)).toEqual([]);
  });
});
