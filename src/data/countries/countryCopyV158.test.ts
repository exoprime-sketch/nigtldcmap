import { describe, expect, test } from "@jest/globals";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { copyForCountryV158, headingsForCountryV158 } from "./countryCopyV158";
import { DEFAULT_COUNTRY_ISO3_V158 } from "../countryContext";
import { getPublicAnalysisHeadingsV134 } from "../visualization/publicAnalysisHeadingsV134";
import { publicIndicatorDimensionV144 } from "../visualization/publicIndicatorCopyV144";
import reviewedCopy from "../visualization/publicIndicatorCopyV144.json";
import { publicElementCopyV126 } from "../visualization/publicCopyRegistryV126";

const registry = JSON.parse(readFileSync(resolve(__dirname, "../../../public/data/countries.json"), "utf8"));
const defaultEntry = registry.countries.find((row: { iso3: string }) => row.iso3 === DEFAULT_COUNTRY_ISO3_V158);
const other: string = registry.countries.find((row: { iso3: string }) => row.iso3 !== DEFAULT_COUNTRY_ISO3_V158).iso3;
const naming = `${defaultEntry.nameKo} 참여 현황`;

describe("country-scoped reviewed copy V158", () => {
  test("the default country keeps every line", () => {
    expect(copyForCountryV158(naming, DEFAULT_COUNTRY_ISO3_V158)).toBe(naming);
  });

  test("another country gets an empty line where the copy names a different country", () => {
    expect(copyForCountryV158(naming, other)).toBe("");
    expect(copyForCountryV158("유역별 면적 비교", other)).toBe("유역별 면적 비교");
  });

  test("headings naming the default country are emptied for another country, so callers fall back", () => {
    const rows = ["B-025", "C-008"]
      .map((id) => getPublicAnalysisHeadingsV134(id))
      .filter((row) => row && row.publicAnalysisTitle.includes(defaultEntry.nameKo));
    expect(rows.length).toBeGreaterThan(0);
    for (const row of rows) {
      expect(headingsForCountryV158(row, DEFAULT_COUNTRY_ISO3_V158)).toBe(row);
      expect(headingsForCountryV158(row, other)?.publicAnalysisTitle).toBe("");
    }
  });

  test("the analysis copy falls back past every reviewed line naming another country", () => {
    for (const elementId of ["B-025", "C-008"]) {
      const base = publicElementCopyV126(elementId, "structured-table");
      expect(publicElementCopyV126(elementId, "structured-table", DEFAULT_COUNTRY_ISO3_V158)).toEqual(base);
      const scoped = publicElementCopyV126(elementId, "structured-table", other);
      expect(scoped.title).not.toContain(defaultEntry.nameKo);
      expect(scoped.description).not.toContain(defaultEntry.nameKo);
      expect(scoped.title.length).toBeGreaterThan(0);
    }
  });

  test("a reviewed series phrase naming the default country gives way to the delivered value", () => {
    const table = reviewedCopy as Record<string, Record<string, string>>;
    const found = Object.entries(table)
      .flatMap(([elementId, phrases]) =>
        Object.entries(phrases).map(([raw, phrase]) => ({ elementId, raw, phrase }))
      )
      .find((row) => row.phrase.includes(defaultEntry.nameKo));
    expect(found).toBeDefined();
    const { elementId, raw, phrase } = found!;
    expect(publicIndicatorDimensionV144(elementId, raw)).toBe(phrase);
    expect(publicIndicatorDimensionV144(elementId, raw, DEFAULT_COUNTRY_ISO3_V158)).toBe(phrase);
    expect(publicIndicatorDimensionV144(elementId, raw, other)).toBe(raw);
  });
});
