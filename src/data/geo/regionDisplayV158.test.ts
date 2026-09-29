import { afterEach, beforeEach, describe, expect, test } from "@jest/globals";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { loadCountryRegistryV158, resetCountryRegistryCacheV158 } from "../countryContext";
import { formatRegionName, type RegionLevelV161 } from "./regionNameV161";
import { formatRegionForDisplayV158, hasNonLatinLetterV158 } from "./regionDisplayV158";

const ROOT = resolve(__dirname, "../../..");
const countriesJson = JSON.parse(readFileSync(resolve(ROOT, "public/data/countries.json"), "utf8"));

describe("hasNonLatinLetterV158", () => {
  test("Latin (with diacritics), Hangul, digits, whitespace and common punctuation all pass", () => {
    expect(hasNonLatinLetterV158("Bà Rịa-Vũng Tàu")).toBe(false);
    expect(hasNonLatinLetterV158("다카 (Dhaka)")).toBe(false);
    expect(hasNonLatinLetterV158("Cox's Bazar, District No. 2 (64)")).toBe(false);
  });

  test("Bengali and other non-Latin scripts fail", () => {
    expect(hasNonLatinLetterV158("বাংলাদেশ")).toBe(true);
    expect(hasNonLatinLetterV158("ঢাকা বিভাগ (Dhaka Division)")).toBe(true);
  });
});

describe("formatRegionForDisplayV158: Bengali source text", () => {
  test("a Latin fragment already inside the source's own parentheses is used for the bracket", () => {
    expect(
      formatRegionForDisplayV158({ country: "BGD", raw: "ঢাকা বিভাগ (Dhaka Division)", level: "division" })
    ).toEqual({ text: "다카 (Dhaka Division)", romanisedMissing: false });
  });

  test("no parentheses: the ETL's romanised column supplies the bracket", () => {
    expect(
      formatRegionForDisplayV158({ country: "BGD", raw: "ঢাকা", level: "division", romanised: "Dhaka" })
    ).toEqual({ text: "다카 (Dhaka)", romanisedMissing: false });
  });

  test("no parentheses, no romanised column: the dictionary's own Latin spelling is used", () => {
    // The source mixes scripts without a separator; the Latin remnant is
    // enough for regionNameV161's own key normalisation to find the entry.
    expect(
      formatRegionForDisplayV158({ country: "BGD", raw: "কক্সবাজার Cox's Bazar", level: "district" })
    ).toEqual({ text: "콕스바자르 (Cox's Bazar)", romanisedMissing: false });
  });

  test("nothing usable anywhere: the raw local name is shown and romanisedMissing is set (never invented)", () => {
    const result = formatRegionForDisplayV158({ country: "BGD", raw: "নদী", level: "district" });
    expect(result).toEqual({ text: "নদী", romanisedMissing: true });
  });

  test("mode: label takes the Korean name alone, same as formatRegionName", () => {
    expect(
      formatRegionForDisplayV158({ country: "BGD", raw: "ঢাকা বিভাগ (Dhaka Division)", level: "division", mode: "label" })
    ).toEqual({ text: "다카", romanisedMissing: false });
  });
});

describe("formatRegionForDisplayV158: country-level names", () => {
  let originalFetch: typeof fetch | undefined;

  beforeEach(() => {
    resetCountryRegistryCacheV158();
    originalFetch = (global as unknown as { fetch?: typeof fetch }).fetch;
  });

  afterEach(() => {
    resetCountryRegistryCacheV158();
    (global as unknown as { fetch?: typeof fetch }).fetch = originalFetch;
  });

  test("a whole-country Bengali+bracket value (B-035/B-036 pattern) resolves to the registry's Korean name, not a bracketed form", async () => {
    (global as unknown as { fetch: typeof fetch }).fetch = (async () => ({
      ok: true,
      json: async () => countriesJson,
    })) as unknown as typeof fetch;
    await loadCountryRegistryV158((relPath: string) => relPath);
    expect(formatRegionForDisplayV158({ country: "BGD", raw: "বাংলাদেশ (Bangladesh)" })).toEqual({
      text: "방글라데시",
      romanisedMissing: false,
    });
  });
});

describe("formatRegionForDisplayV158: plain Latin/Vietnamese input is unchanged from formatRegionName", () => {
  const cases: Array<{ country: string; raw: string; level?: RegionLevelV161; mode?: "full" | "label" }> = [
    { country: "VNM", raw: "Bà Rịa-Vũng Tàu", level: "adm1-63" },
    { country: "VNM", raw: "Thành phố Hồ Chí Minh" },
    { country: "VNM", raw: "Hồ Chí Minh", mode: "label" },
    { country: "VNM", raw: "Singapore" },
    { country: "BGD", raw: "Dhaka Division" },
    { country: "BGD", raw: "Cox's Bazar", level: "district" },
  ];

  test.each(cases)("%j", (testCase) => {
    expect(formatRegionForDisplayV158(testCase)).toEqual({
      text: formatRegionName(testCase),
      romanisedMissing: false,
    });
  });
});
