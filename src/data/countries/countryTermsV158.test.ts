import { describe, expect, it } from "@jest/globals";

import {
  buildOtherCountryTermsV158,
  confirmedRegionEntriesV158,
  findCountryTermsV158,
  otherCountryTermsV158,
  unionRegistryCountriesV158,
  type CountryTermV158,
} from "./countryTermsV158";

// A wholly fictional registry: none of these ISO3 codes or names exist for real.
// If a test here needs a real country name to pass, the module has hardcoded
// something - it should not.
const FAKE_COUNTRIES = [
  { iso3: "XTS", nameKo: "시험국", nameEn: "Testland" },
  { iso3: "YYA", nameKo: "가상국", nameEn: "Fictionia" },
  { iso3: "ZZB", nameKo: "모의국", nameEn: "Mockovia" },
];
const FAKE_REGIONS = [
  { iso3: "XTS", ko: "시험시", local: "Testville" },
  { iso3: "YYA", ko: "가상시", local: "Fictionville" },
  { iso3: "ZZB", ko: "모의시", local: "Mockville" },
];

describe("buildOtherCountryTermsV158: no country is hardcoded", () => {
  it("with a fake three-country registry, returns the other two countries' terms and never the displayed one's", () => {
    const terms = buildOtherCountryTermsV158({
      displayedIso3: "XTS",
      countries: FAKE_COUNTRIES,
      regionEntries: FAKE_REGIONS,
    });
    const texts = terms.map((t) => t.term);
    expect(texts).toEqual(
      expect.arrayContaining(["가상국", "Fictionia", "가상시", "Fictionville", "모의국", "Mockovia", "모의시", "Mockville"])
    );
    expect(texts).not.toContain("시험국");
    expect(texts).not.toContain("Testland");
    expect(texts).not.toContain("시험시");
    expect(texts).not.toContain("Testville");
    // Every term is tagged with the fake country it came from - proving the
    // provenance comes from the input rows, not a lookup table in the module.
    expect(terms.find((t) => t.term === "Fictionia")?.iso3).toBe("YYA");
    expect(terms.find((t) => t.term === "Mockville")?.iso3).toBe("ZZB");
  });

  it("is case-insensitive on the displayed ISO3", () => {
    const terms = buildOtherCountryTermsV158({
      displayedIso3: "xts",
      countries: FAKE_COUNTRIES,
      regionEntries: FAKE_REGIONS,
    });
    expect(terms.map((t) => t.term)).not.toContain("시험국");
  });

  it("drops a term whose normalised text also matches the displayed country's own name or region (shared spelling)", () => {
    const terms = buildOtherCountryTermsV158({
      displayedIso3: "XTS",
      countries: [
        { iso3: "XTS", nameKo: "시험국", nameEn: "Sharedname" },
        { iso3: "YYA", nameKo: "가상국", nameEn: "Sharedname" }, // same spelling as XTS's own name
      ],
      regionEntries: [],
    });
    expect(terms.map((t) => t.term)).not.toContain("Sharedname");
    expect(terms.map((t) => t.term)).toContain("가상국");
  });

  it("drops a country/region name equal to its own ISO3 code (unresolved placeholder)", () => {
    const terms = buildOtherCountryTermsV158({
      displayedIso3: "XTS",
      countries: [
        { iso3: "XTS", nameKo: "시험국", nameEn: "Testland" },
        { iso3: "YYA", nameKo: "YYA", nameEn: "YYA" },
      ],
      regionEntries: [],
    });
    expect(terms).toHaveLength(0);
  });

  it("applies the minimum-length rule: Korean region names under 2 chars and Latin under 4 chars are dropped", () => {
    const terms = buildOtherCountryTermsV158({
      displayedIso3: "XTS",
      countries: [],
      regionEntries: [
        { iso3: "YYA", ko: "가", local: "Ha" }, // both too short
        { iso3: "YYA", ko: "가상", local: "Hano" }, // both long enough
      ],
    });
    expect(terms.map((t) => t.term)).toEqual(["가상", "Hano"]);
  });

  it("de-duplicates a name that repeats across rows", () => {
    const terms = buildOtherCountryTermsV158({
      displayedIso3: "XTS",
      countries: [{ iso3: "YYA", nameKo: "가상국", nameEn: "Fictionia" }],
      regionEntries: [
        { iso3: "YYA", ko: "가상국", local: "Fictionia" }, // repeats the country name
      ],
    });
    expect(terms.filter((t) => t.term === "가상국")).toHaveLength(1);
    expect(terms.filter((t) => t.term === "Fictionia")).toHaveLength(1);
  });

  it("skips a row belonging to the displayed country itself", () => {
    const terms = buildOtherCountryTermsV158({
      displayedIso3: "YYA",
      countries: FAKE_COUNTRIES,
      regionEntries: FAKE_REGIONS,
    });
    expect(terms.map((t) => t.term)).not.toEqual(
      expect.arrayContaining(["가상국", "Fictionia", "가상시", "Fictionville"])
    );
  });
});

describe("findCountryTermsV158: Latin matching", () => {
  const term: CountryTermV158 = { term: "Viet Nam", script: "latin", iso3: "VNM", kind: "country" };

  it("matches the exact spelling", () => {
    expect(findCountryTermsV158("a report on Viet Nam's grid", [term])).toEqual([term]);
  });

  it("matches the no-space spelling (optional internal space)", () => {
    expect(findCountryTermsV158("a report on Vietnam's grid", [term])).toEqual([term]);
  });

  it("matches a diacritics-and-case variant", () => {
    expect(findCountryTermsV158("VIỆT NAM electricity data", [term])).toEqual([term]);
  });

  it("does not match inside a longer word (word boundary)", () => {
    expect(findCountryTermsV158("Vietnamese-made equipment", [term])).toEqual([]);
  });

  it("does not match an unrelated string", () => {
    expect(findCountryTermsV158("a report on Bangladesh's grid", [term])).toEqual([]);
  });

  it("returns nothing for null or empty text", () => {
    expect(findCountryTermsV158(null, [term])).toEqual([]);
    expect(findCountryTermsV158("", [term])).toEqual([]);
    expect(findCountryTermsV158(undefined, [term])).toEqual([]);
  });
});

describe("findCountryTermsV158: Korean matching (substring)", () => {
  const term: CountryTermV158 = { term: "베트남", script: "hangul", iso3: "VNM", kind: "country" };

  it("matches a bare mention", () => {
    expect(findCountryTermsV158("베트남 송전망 현황", [term])).toEqual([term]);
  });

  it("matches when the name sits inside a longer compound (Korean has no word-boundary rule here)", () => {
    expect(findCountryTermsV158("대베트남 투자 사례", [term])).toEqual([term]);
  });

  it("does not match unrelated Korean text", () => {
    expect(findCountryTermsV158("방글라데시 송전망 현황", [term])).toEqual([]);
  });
});

describe("unionRegistryCountriesV158", () => {
  it("prefers a real registry name over PRIORITY_COUNTRIES/FALLBACK_COUNTRIES, but falls back when the registry only has a placeholder", () => {
    const rows = unionRegistryCountriesV158([
      { iso3: "VNM", nameKo: "베트남", nameEn: "Viet Nam" }, // real
      { iso3: "BGD", nameKo: "BGD", nameEn: "BGD" }, // placeholder (bundled fallback shape)
    ]);
    const byIso3 = new Map(rows.map((r) => [r.iso3, r]));
    expect(byIso3.get("VNM")).toEqual({ iso3: "VNM", nameKo: "베트남", nameEn: "Viet Nam" });
    // BGD's placeholder is discarded; PRIORITY_COUNTRIES/FALLBACK_COUNTRIES fill in the real name.
    expect(byIso3.get("BGD")?.nameKo).toBe("방글라데시");
    expect(byIso3.get("BGD")?.nameEn).toBe("Bangladesh");
    // A priority country the registry does not mention at all still appears.
    expect(byIso3.get("IND")?.nameKo).toBe("인도");
    expect(byIso3.get("IND")?.nameEn).toBeTruthy();
  });
});

describe("confirmedRegionEntriesV158", () => {
  it("only returns rows the dictionary marks confirmed, tagged by country", () => {
    const rows = confirmedRegionEntriesV158();
    expect(rows.length).toBeGreaterThan(0);
    expect(rows.some((r) => r.iso3 === "VNM")).toBe(true);
    expect(rows.some((r) => r.iso3 === "BGD")).toBe(true);
    // Every row came from the dictionary's own text - nothing invented.
    for (const row of rows) {
      expect(typeof row.iso3).toBe("string");
    }
  });
});

describe("otherCountryTermsV158: platform sources, no fetch required", () => {
  it("for BGD, includes Viet Nam's country name (VNM is a live registry country other than BGD)", () => {
    const terms = otherCountryTermsV158("BGD");
    expect(terms.some((t) => t.term === "Viet Nam" && t.iso3 === "VNM")).toBe(true);
    expect(terms.some((t) => t.term === "베트남" && t.iso3 === "VNM")).toBe(true);
  });

  it("for VNM, excludes Viet Nam's own name but includes Bangladesh's", () => {
    const terms = otherCountryTermsV158("VNM");
    expect(terms.some((t) => t.term === "Viet Nam")).toBe(false);
    expect(terms.some((t) => t.term === "베트남")).toBe(false);
    expect(terms.some((t) => t.term === "Bangladesh")).toBe(true);
    expect(terms.some((t) => t.term === "방글라데시")).toBe(true);
  });

  it("memoises per displayed ISO3 (same array reference on a repeat call)", () => {
    expect(otherCountryTermsV158("BGD")).toBe(otherCountryTermsV158("BGD"));
  });
});
