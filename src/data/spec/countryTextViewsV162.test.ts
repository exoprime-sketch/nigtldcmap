import { expect, test } from "@jest/globals";
import {
  PUBLIC_GLOSSARY_BY_ID_V134,
  PUBLIC_GLOSSARY_V134,
  glossaryCountriesV162,
  glossaryShownForCountryV162,
} from "../glossary/publicGlossaryV134";
import useCasesJson from "./useCasesV159.json";
import datasetSpecJson from "./datasetSpecV159.json";
import viewsJson from "./countryTextViewsV162.json";
import { applyCountryTextViewsV162, caseShownForCountryV162, type CountryTextViewsV162 } from "./countryTextViewsV162";
import type { DatasetSpecRowV159, UseCaseV159 } from "./specTypesV159";
import policyJson from "../visualization/policyDescriptionsV153.json";
import { policyDescriptionLinesV162 } from "../visualization/policyDescriptionViewsV162";

const POLICY_ENTRIES = (policyJson as unknown as { entries: Array<{ key: string; description: string[] }> }).entries;

const views = viewsJson as unknown as CountryTextViewsV162;
const cases = (useCasesJson as unknown as { cases: UseCaseV159[] }).cases;
const specRows = (datasetSpecJson as unknown as { rows: DatasetSpecRowV159[] }).rows;
const OTHER_NAMES = /방글라데시|Bangladesh/u;

function bundleFor(elementId: string) {
  return {
    spec: specRows.find((row) => row.elementId === elementId) || null,
    cases: cases.filter((item) => item.elementId === elementId),
  };
}

function shownText(bundle: ReturnType<typeof bundleFor>): string {
  return [
    bundle.spec?.description,
    bundle.spec?.usage,
    ...bundle.cases.flatMap((item) => [item.purpose, item.purposeEn, item.logic, item.storyline, item.cautionDisplay, ...item.dataUsed.map((ref) => ref.label)]),
  ].join(" ");
}

test("the default country's view names no other platform country in any spec text", () => {
  const leaks = specRows
    .map((row) => row.elementId)
    .filter((elementId) => OTHER_NAMES.test(shownText(applyCountryTextViewsV162(bundleFor(elementId), elementId, "VNM", views))));
  expect(leaks).toEqual([]);
});

test("a count sentence becomes the neutral phrase on every country's screen", () => {
  const vnm = applyCountryTextViewsV162(bundleFor("B-001"), "B-001", "VNM", views);
  expect(vnm.cases[0].cautionDisplay).toContain("대상 국가 중 2개국에만 있다");
  expect(vnm.cases[0].cautionDisplay).not.toMatch(/베트남·방글라데시/u);
});

test("a country's own sentence goes to that country's view only", () => {
  const vnm = applyCountryTextViewsV162(bundleFor("C-016"), "C-016", "VNM", views);
  const bgd = applyCountryTextViewsV162(bundleFor("C-016"), "C-016", "BGD", views);
  expect(vnm.spec?.description).toContain("베트남은 개정 전력개발계획8");
  expect(vnm.spec?.description).not.toContain("전력개발청");
  expect(bgd.spec?.description).toContain("방글라데시는 전력개발청 입찰 공고");
  expect(bgd.spec?.description).not.toContain("베트남");
});

test("a case about one country's own budget is shown on that country's screens only", () => {
  const bgdCase = cases.find((item) => item.elementId === "D-005" && item.caseNo === 2)!;
  expect(bgdCase.countries).toEqual(["BGD"]);
  expect(caseShownForCountryV162(bgdCase, "VNM")).toBe(false);
  expect(caseShownForCountryV162(bgdCase, "BGD")).toBe(true);
  const vnm = applyCountryTextViewsV162(bundleFor("D-005"), "D-005", "VNM", views);
  expect(vnm.cases.map((item) => item.caseNo)).not.toContain(2);
  // No country on the page reads as the default country.
  expect(applyCountryTextViewsV162(bundleFor("D-005"), "D-005", "", views).cases).toEqual(vnm.cases);
});

test("a policy description line about another country is not on this country's screens", () => {
  const ccac = { key: "ccac", description: ["a", "2012년 UNEP과 방글라데시 등 6개 창립국이 출범", "베트남 2017년 파트너로 가입"] };
  const vnm = policyDescriptionLinesV162(ccac, "VNM");
  expect(vnm.join(" ")).toContain("2012년 UNEP과 6개 창립국이 출범");
  expect(vnm.join(" ")).not.toMatch(OTHER_NAMES);
  expect(policyDescriptionLinesV162(ccac, "BGD").join(" ")).not.toContain("베트남");
  const leaks = POLICY_ENTRIES.filter((entry) => OTHER_NAMES.test(policyDescriptionLinesV162(entry, "VNM").join(" "))).map((entry) => entry.key);
  expect(leaks).toEqual([]);
});

test("country-specific glossary terms are tagged and explained only on their countries' screens", () => {
  const iepmp = PUBLIC_GLOSSARY_BY_ID_V134.get("iepmp")!;
  const evn = PUBLIC_GLOSSARY_BY_ID_V134.get("evn")!;
  expect(iepmp.countries).toEqual(["BGD"]);
  expect(evn.countries).toEqual(["VNM"]);
  expect(glossaryShownForCountryV162(iepmp, "VNM")).toBe(false);
  expect(glossaryShownForCountryV162(iepmp, "BGD")).toBe(true);
  expect(glossaryShownForCountryV162(evn, "VNM")).toBe(true);
  expect(glossaryShownForCountryV162({ countries: undefined }, "BGD")).toBe(true);
  // Only platform countries tag a term; another target country leaves it common.
  expect(glossaryCountriesV162({ term: "X", englishName: "ASEAN-India FTA", koreanName: "", definition: "아세안과 인도의 자유무역협정" })).toEqual([]);
  // Every entry the default country lists names no other platform country.
  const leaks = PUBLIC_GLOSSARY_V134.filter((entry) => glossaryShownForCountryV162(entry, "VNM"))
    .filter((entry) => OTHER_NAMES.test(`${entry.term} ${entry.englishName} ${entry.koreanName} ${entry.definition}`))
    .map((entry) => entry.id);
  expect(leaks).toEqual([]);
});
