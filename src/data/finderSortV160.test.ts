import { expect, test } from "@jest/globals";
import { readFileSync } from "fs";
import { resolve } from "path";
import { compareFinderItemsV160, isPreparingStatusV160 } from "./finderSortV160";
import { allTypologyV159 } from "./spec/datasetSpecV159";
import { countryPublicDirV158 } from "./countryContext";
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

test("the catalogue's not-delivered set is the typology's data-pending set", () => {
  const catalog = JSON.parse(readFileSync(resolve(__dirname, "../..", countryPublicDirV158("VNM"), "catalog.json"), "utf8")) as {
    elements: { elementId: string; publicStatus?: string }[];
  };
  const preparing = catalog.elements.filter((element) => isPreparingStatusV160(element.publicStatus)).map((element) => element.elementId).sort();
  const pending = allTypologyV159().filter((row) => row.statusNotice === "data-pending").map((row) => row.elementId).sort();
  expect(preparing).toEqual(pending);
});
