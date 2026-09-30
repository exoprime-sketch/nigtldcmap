import { describe, expect, it } from "@jest/globals";

import { buildOtherCountryTermsV158, type CountryTermV158 } from "./countryTermsV158";
import {
  scopeCasesToCountryV158,
  scopeTextToCountryV158,
  shouldScopeTextV158,
} from "./countryTextScopeV158";

const FAKE_COUNTRIES = [
  { iso3: "XTS", nameKo: "시험국", nameEn: "Testland" },
  { iso3: "YYA", nameKo: "가상국", nameEn: "Fictionia" },
];

function termsFor(displayedIso3: string): CountryTermV158[] {
  return buildOtherCountryTermsV158({
    displayedIso3,
    countries: FAKE_COUNTRIES,
    regionEntries: [],
  });
}

describe("shouldScopeTextV158", () => {
  it("is false when the displayed country authored the text", () => {
    expect(shouldScopeTextV158("VNM", ["VNM"])).toBe(false);
  });

  it("is true when the displayed country did not author the text", () => {
    expect(shouldScopeTextV158("BGD", ["VNM"])).toBe(true);
  });

  it("compares ISO3 case-insensitively", () => {
    expect(shouldScopeTextV158("vnm", ["VNM"])).toBe(false);
  });

  it("is false when no displayed country is known", () => {
    expect(shouldScopeTextV158("", ["VNM"])).toBe(false);
    expect(shouldScopeTextV158(null as unknown as string, ["VNM"])).toBe(false);
  });
});

describe("scopeTextToCountryV158", () => {
  const terms = termsFor("XTS"); // other-country term here is "가상국"/"Fictionia"

  it("passes null and empty text through unchanged, with nothing hidden", () => {
    expect(scopeTextToCountryV158(null, terms)).toEqual({ text: null, hiddenParagraphs: [] });
    expect(scopeTextToCountryV158(undefined, terms)).toEqual({ text: null, hiddenParagraphs: [] });
    expect(scopeTextToCountryV158("", terms)).toEqual({ text: "", hiddenParagraphs: [] });
  });

  it("keeps text with no other-country term untouched", () => {
    expect(scopeTextToCountryV158("시험국 현황 자료입니다.", terms)).toEqual({
      text: "시험국 현황 자료입니다.",
      hiddenParagraphs: [],
    });
  });

  it("drops only the paragraph that mentions the other country, keeping the rest in order", () => {
    const text = "첫 문단은 시험국 이야기.\n둘째 문단은 가상국 이야기.\n셋째 문단도 시험국 이야기.";
    const result = scopeTextToCountryV158(text, terms);
    expect(result.text).toBe("첫 문단은 시험국 이야기.\n셋째 문단도 시험국 이야기.");
    expect(result.hiddenParagraphs).toEqual([{ index: 1, terms: ["가상국"] }]);
  });

  it("returns null text when every paragraph is hidden", () => {
    const text = "가상국 이야기 하나.\nFictionia 이야기 둘.";
    const result = scopeTextToCountryV158(text, terms);
    expect(result.text).toBeNull();
    expect(result.hiddenParagraphs.map((p) => p.index)).toEqual([0, 1]);
  });

  it("treats runs of blank lines as one paragraph boundary", () => {
    const text = "시험국 문단.\n\n\n가상국 문단.";
    const result = scopeTextToCountryV158(text, terms);
    expect(result.text).toBe("시험국 문단.");
    expect(result.hiddenParagraphs).toEqual([{ index: 1, terms: ["가상국"] }]);
  });

  it("VNM displayed with VNM-authored text needs no terms at all: an empty term list hides nothing", () => {
    const text = "베트남 현황 자료.\n방글라데시 이야기 없음.";
    const result = scopeTextToCountryV158(text, []);
    expect(result.text).toBe(text);
    expect(result.hiddenParagraphs).toEqual([]);
  });
});

describe("scopeCasesToCountryV158", () => {
  const terms = termsFor("XTS");
  interface FakeCase {
    id: string;
    purpose: string;
    caution: string;
    caseNo: number;
  }
  const cases: FakeCase[] = [
    { id: "keep-1", purpose: "시험국 사례", caution: "주의사항 없음", caseNo: 1 },
    { id: "hide-purpose", purpose: "가상국 사례", caution: "주의사항 없음", caseNo: 2 },
    { id: "hide-caution", purpose: "시험국 사례", caution: "가상국 관련 주의", caseNo: 3 },
    { id: "keep-2", purpose: "시험국 사례 2", caution: "주의사항 없음 2", caseNo: 4 },
  ];

  it("hides a case entirely when any one of the checked fields matches, keeping the rest in order", () => {
    const { kept, hidden } = scopeCasesToCountryV158(cases, terms, ["purpose", "caution"]);
    expect(kept.map((c) => c.id)).toEqual(["keep-1", "keep-2"]);
    expect(hidden).toEqual([
      { index: 1, terms: ["가상국"] },
      { index: 2, terms: ["가상국"] },
    ]);
  });

  it("ignores a field that is not in the checked list", () => {
    const { kept, hidden } = scopeCasesToCountryV158(cases, terms, ["caution"]);
    // "hide-purpose" only mentions the other country in `purpose`, which is not checked here.
    expect(kept.map((c) => c.id)).toEqual(["keep-1", "hide-purpose", "keep-2"]);
    expect(hidden).toEqual([{ index: 2, terms: ["가상국"] }]);
  });

  it("keeps everything when there are no other-country terms", () => {
    const { kept, hidden } = scopeCasesToCountryV158(cases, [], ["purpose", "caution"]);
    expect(kept).toHaveLength(cases.length);
    expect(hidden).toEqual([]);
  });
});
