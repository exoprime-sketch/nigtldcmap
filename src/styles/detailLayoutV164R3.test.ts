import { describe, expect, test } from "@jest/globals";
import { readFileSync } from "fs";
import { join } from "path";

/**
 * V164-R3: two layout faults are CSS only, so the guard reads the stylesheets.
 * - A-015: a first block of bars was padded to 320px, leaving a blank band under two bars;
 * - A-013: a two-column evidence table kept the minimum width of the five-column one, so its right text was clipped
 *   in a narrow panel.
 */
const read = (relative: string) => readFileSync(join(__dirname, "..", relative), "utf8");

/** The selector list of the first rule whose body sets `declaration`. */
function selectorsWith(css: string, declaration: string): string[] {
  const rules = Array.from(css.replace(/\/\*[\s\S]*?\*\//gu, "").matchAll(/([^{}]+)\{([^{}]*)\}/gu));
  return rules.filter((rule) => rule[2].includes(declaration)).flatMap((rule) => rule[1].split(",").map((selector) => selector.trim()));
}

describe("first-block minimum heights (A-015)", () => {
  const selectors = selectorsWith(read("styles/detail-layout-v153.css"), "min-height: 320px");

  test("line, stacked-area, region-bar, dumbbell and heatmap keep their 320px", () => {
    for (const block of ["line", "stacked-area", "region-bar", "dumbbell", "heatmap"]) {
      expect(selectors).toContain(`[data-analysis-rank="1"][data-analysis-block="${block}"]`);
    }
  });

  test("a list of bars is as tall as its rows", () => {
    expect(selectors.some((selector) => selector.includes('data-analysis-block="category-bar"'))).toBe(false);
  });
});

describe("evidence table width (A-013)", () => {
  const css = read("components/data/semantic/semantic-contract-renderer-v125.css");

  test("a table of two or three columns is not held to the wide table's minimum width", () => {
    const narrow = Array.from(css.matchAll(/([^{}]*\.sv125-evidence-matrix\[data-columns="2"\][^{}]*)\{([^{}]*)\}/gu)).map((rule) => rule[2]);
    expect(narrow.some((body) => /min-width:\s*0/u.test(body))).toBe(true);
  });
});
