import { describe, expect, test } from "@jest/globals";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

/**
 * V158: the visualization contract now states, per element, whether it can be
 * compared across countries and on what key. The compare block reads this, so a
 * row without a decision would silently mean "no comparison" - the test makes
 * the decision mandatory and checks the shape of the key.
 *
 * Regenerate with `npm run build:country-compare:v158`.
 */
const CONTRACT = JSON.parse(
  readFileSync(
    resolve(__dirname, "publicVisualizationContractV153.json"),
    "utf8"
  )
) as {
  rows: {
    elementId: string;
    archetype: string;
    primary?: { unit?: string };
    countryCompare?: {
      comparable: boolean;
      reason?: string;
      compareKey?: { indicatorId: string; unit: string; yearRule: string };
    };
  }[];
};

const COMPARABLE_ARCHETYPES = ["national-series", "composition"];

describe("country compare contract V158", () => {
  test("every element states a comparison decision", () => {
    const missing = CONTRACT.rows
      .filter((row) => !row.countryCompare)
      .map((row) => row.elementId);
    expect(missing).toEqual([]);
    expect(CONTRACT.rows).toHaveLength(152);
  });

  test("a comparable element carries an indicator, a unit and a year rule", () => {
    const comparable = CONTRACT.rows.filter((row) => row.countryCompare?.comparable);
    expect(comparable.length).toBeGreaterThan(0);
    comparable.forEach((row) => {
      const key = row.countryCompare?.compareKey;
      expect(key?.indicatorId).toMatch(/^[A-E]-\d{3}_/u);
      expect(String(key?.unit || "").trim().length).toBeGreaterThan(0);
      // One rule for now: the most recent year both countries carry a value for.
      expect(key?.yearRule).toBe("latest-common");
      // Only shapes that state one country-level measure per year are compared.
      expect(COMPARABLE_ARCHETYPES).toContain(row.archetype);
    });
  });

  test("an element that is not compared says why", () => {
    const refused = CONTRACT.rows.filter((row) => row.countryCompare?.comparable === false);
    refused.forEach((row) => {
      expect(String(row.countryCompare?.reason || "").trim().length).toBeGreaterThan(0);
      expect(row.countryCompare?.compareKey).toBeUndefined();
    });
    // Registries, policy documents, province distributions, stations, matrices
    // and status notes are all in here, so the refused set is the larger one.
    expect(refused.length).toBeGreaterThan(comparableCount());
  });
});

function comparableCount(): number {
  return CONTRACT.rows.filter((row) => row.countryCompare?.comparable).length;
}
