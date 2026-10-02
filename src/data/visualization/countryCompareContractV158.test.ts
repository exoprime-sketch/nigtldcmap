import { describe, expect, test } from "@jest/globals";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { sameUnitV158 } from "../../components/data/public/CountryCompareBlockV158";
import { countryPublicDirV158, DEFAULT_COUNTRY_ISO3_V158 } from "../countryContext";

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

// V158 fix-forward (user decision 2026-09-30): representative indicator, 54 compared.
const ROOT = resolve(__dirname, "../../..");
const readJson = (path: string) => JSON.parse(readFileSync(resolve(ROOT, path), "utf8"));

const contractV158 = readJson("src/data/visualization/publicVisualizationContractV153.json") as {
  rows: { elementId: string; countryCompare?: { comparable: boolean; reason?: string; compareKey?: { indicatorId: string } } }[];
};
const exclusions = readJson("config/data-publication/country-compare-exclusions-v158.json").excluded as { elementId: string }[];

describe("country compare contract V158 (fix-forward 2026-09-30)", () => {
  // V162 PR-D (user decision 2026-10-03): the standard's 54 plus E-011 (NRI),
  // delivered on 2026-09-30.
  test("55 elements are compared: the contractor's standard v1.1 plus E-011", () => {
    expect(contractV158.rows.filter((row) => row.countryCompare?.comparable).length).toBe(55);
  });

  test("the elements kept out of the comparison are not compared", () => {
    expect(exclusions.map((row) => row.elementId).sort()).toEqual(["D-004", "D-006", "D-008", "E-012"]);
    for (const { elementId } of exclusions) {
      expect(contractV158.rows.find((row) => row.elementId === elementId)?.countryCompare?.comparable).toBe(false);
    }
  });

  test("the compare key is the indicator the element's card states, where the card names one", () => {
    const cards = readJson(`${countryPublicDirV158(DEFAULT_COUNTRY_ISO3_V158)}/home/card-summaries-v140.json`).cards as {
      elementId: string;
      provenance?: { headlineIndicatorIds?: string[] };
    }[];
    const headline = new Map(cards.map((card) => [card.elementId, card.provenance?.headlineIndicatorIds?.[0]]));
    const differing = contractV158.rows
      .filter((row) => row.countryCompare?.comparable && headline.get(row.elementId))
      .filter((row) => row.countryCompare?.compareKey?.indicatorId !== headline.get(row.elementId))
      .map((row) => row.elementId);
    expect(differing).toEqual([]);
  });

  test("units that differ only in a superscript power are the same unit", () => {
    expect(sameUnitV158("km2", "km²")).toBe(true);
    expect(sameUnitV158(" m3 ", "m³")).toBe(true);
    expect(sameUnitV158("km", "km²")).toBe(false);
    expect(sameUnitV158("십억 US$", "십억 US$")).toBe(true);
  });
});
