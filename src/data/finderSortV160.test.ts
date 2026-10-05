import { expect, test } from "@jest/globals";
import { readFileSync } from "fs";
import { resolve } from "path";
import { compareFinderItemsV160, isPreparingStatusV160 } from "./finderSortV160";
import { getTypologyForCountryV158 } from "./spec/countrySpecV158";
import type { FinderSortItemV160 } from "./finderSortV160";

const items: FinderSortItemV160[] = [
  { elementId: "C-021", title: "가나", publicStatus: "not-collected" },
  { elementId: "A-003", title: "국내총생산", publicStatus: "actual" },
  { elementId: "B-003", title: "기온", publicStatus: "actual" },
  { elementId: "A-001", title: "CPI", publicStatus: "actual" },
  { elementId: "A-010", title: "가스별 배출량", publicStatus: "actual" },
];
const order = (mode: "name" | "views", views = new Map<string, number>()) =>
  [...items].sort((a, b) => compareFinderItemsV160(a, b, mode, views)).map((item) => item.elementId);

test("가나다순: Korean collation by the shown name, not-delivered last", () => {
  const collator = new Intl.Collator("ko");
  const expected = items.filter((item) => item.publicStatus !== "not-collected").sort((a, b) => collator.compare(a.title, b.title)).map((item) => item.elementId);
  expect(order("name")).toEqual([...expected, "C-021"]);
});

test("조회순: most viewed first, ties by name, not-delivered still last", () => {
  const views = new Map([["B-003", 9], ["A-003", 9], ["A-010", 2], ["C-021", 100]]);
  const [first, second, third] = order("views", views);
  expect([first, second]).toEqual(new Intl.Collator("ko").compare("국내총생산", "기온") < 0 ? ["A-003", "B-003"] : ["B-003", "A-003"]);
  expect(third).toBe("A-010");
  expect(order("views", views).at(-1)).toBe("C-021");
});

test("entry-planned and template-only datasets are not-delivered too, and go last", () => {
  const withPlanned: FinderSortItemV160[] = [
    ...items,
    { elementId: "E-011", title: "가", publicStatus: "data-entry-planned" },
    { elementId: "E-013", title: "각", publicStatus: "schema-only" },
  ];
  const sorted = [...withPlanned].sort((a, b) => compareFinderItemsV160(a, b, "name", new Map())).map((item) => item.elementId);
  expect(sorted.slice(-3).sort()).toEqual(["C-021", "E-011", "E-013"]);
});

// Each country's catalog, from the published registry (the bundled registry
// knows the default country only).
const REGISTRY_V165 = JSON.parse(readFileSync(resolve(__dirname, "../../public/data/countries.json"), "utf8")) as {
  countries: { iso3: string; dataRoot: string }[];
};
const catalogPathV165 = (iso3: string) =>
  resolve(__dirname, "../../public", `.${REGISTRY_V165.countries.find((row) => row.iso3 === iso3)?.dataRoot}`, "catalog.json");

// V165-2: an element not offered ("excluded" by decision, or "not-provided"
// where a delivery holds nothing) is not listed at all, so the comparison is
// over the listed elements (the finder's own set), in every country; see
// reports/v165/REVIEW_V165_2.md.
test.each(["VNM", "BGD"])("%s: the listed not-delivered set is the typology's data-pending set", (iso3) => {
  const catalog = JSON.parse(readFileSync(catalogPathV165(iso3), "utf8")) as {
    elements: { elementId: string; publicStatus?: string }[];
  };
  const listed = catalog.elements.filter((element) => !["excluded", "not-provided"].includes(element.publicStatus || ""));
  const preparing = listed.filter((element) => isPreparingStatusV160(element.publicStatus)).map((element) => element.elementId).sort();
  // V162: the '데이터 준비 중' notice a card actually shows is decided from the
  // catalog alone (getTypologyForCountryV158 / statusNoticeFromCatalogV162),
  // per element, not from datasetTypologyV159.json's own statusNotice field -
  // that static file only supplies the display type now. A delivery that
  // arrives (E-011, 2026-09-30) is picked up through the catalog without
  // editing the typology file, so this compares against the notice the
  // typology resolves to for each catalog item, not the file's raw content.
  const pending = listed
    .map((element) => getTypologyForCountryV158(element.elementId, iso3, element))
    .filter((row) => row?.statusNotice === "data-pending")
    .map((row) => row!.elementId)
    .sort();
  expect(preparing).toEqual(pending);
});

// V165-2 (user decision 2026-10-05): the decision common to every country
// (config/data-publication/common-exclusions-v158.json - now with the five
// elements the framework does not collect in 2026) is applied in every
// country's catalog, so every country offers the same elements.
test("every common exclusion is excluded in every country's catalog", () => {
  const decision = JSON.parse(
    readFileSync(resolve(__dirname, "../..", "config/data-publication/common-exclusions-v158.json"), "utf8")
  ) as { exclusions: { elementId: string }[] };
  const ids = decision.exclusions.map((row) => row.elementId);
  for (const iso3 of ["VNM", "BGD"]) {
    const catalog = JSON.parse(readFileSync(catalogPathV165(iso3), "utf8")) as {
      elements: { elementId: string; publicStatus?: string }[];
    };
    const statuses = ids.map((id) => [id, catalog.elements.find((row) => row.elementId === id)?.publicStatus]);
    expect({ iso3, statuses }).toEqual({ iso3, statuses: ids.map((id) => [id, "excluded"]) });
  }
});
