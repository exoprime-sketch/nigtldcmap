import { test, expect } from "@jest/globals";
import { readFileSync } from "fs";
import { resolve } from "path";
import {
  matchesTechnologyV153,
  normalizeTechnologyIdV153,
  normalizeTechnologyIdsV153,
  technologyOptionsV153,
} from "./technologyIdV153";

type Catalog = { elements: { elementId: string; technologyIds: string[] }[] };
const catalog = JSON.parse(
  readFileSync(resolve(__dirname, "../../public/data/vietnam/v2/catalog.json"), "utf8")
) as Catalog;
// The V1 baseline still carries both spellings ("7" and "CTIS-07").
const rawCatalog = JSON.parse(
  readFileSync(resolve(__dirname, "../../public/data/vietnam/v1/catalog.json"), "utf8")
) as Catalog;

test("every spelling of one technology normalizes to its two-digit code", () => {
  expect(normalizeTechnologyIdV153("7")).toBe("07");
  expect(normalizeTechnologyIdV153("07")).toBe("07");
  expect(normalizeTechnologyIdV153("CTIS-07")).toBe("07");
  expect(normalizeTechnologyIdV153("ctis-7")).toBe("07");
  expect(normalizeTechnologyIdV153("38")).toBe("38");
  expect(normalizeTechnologyIdV153("geothermal")).toBe("07");
  expect(normalizeTechnologyIdV153("solar-pv")).toBe("01");
  expect(normalizeTechnologyIdV153("확인필요")).toBeNull();
  expect(normalizeTechnologyIdV153("39")).toBeNull();
  expect(normalizeTechnologyIdV153("0")).toBeNull();
  expect(normalizeTechnologyIdV153("")).toBeNull();
});

test("the published catalog yields exactly 38 filter options in code order", () => {
  const options = technologyOptionsV153(catalog.elements);
  expect(options).toHaveLength(38);
  expect(options[0]).toBe("01");
  expect(options[37]).toBe("38");
  expect(new Set(options).size).toBe(38);
});

test("normalized matching equals the union of both raw spellings", () => {
  const rawSpellings = new Set(rawCatalog.elements.flatMap((item) => item.technologyIds));
  expect(rawSpellings.has("7")).toBe(true);
  expect(rawSpellings.has("CTIS-07")).toBe(true);
  for (let number = 1; number <= 38; number += 1) {
    const plain = String(number);
    const code = String(number).padStart(2, "0");
    const ctis = `CTIS-${code}`;
    const rawUnion = rawCatalog.elements.filter(
      (item) => item.technologyIds.includes(plain) || item.technologyIds.includes(ctis)
    ).length;
    expect(rawUnion).toBeGreaterThan(0);
    for (const selected of [plain, code, ctis]) {
      expect(
        rawCatalog.elements.filter((item) => matchesTechnologyV153(item.technologyIds, selected)).length
      ).toBe(rawUnion);
      // The published catalog is normalized; the same selection finds the same elements.
      expect(
        catalog.elements.filter((item) => matchesTechnologyV153(item.technologyIds, selected)).length
      ).toBe(rawUnion);
    }
  }
});

test("a mixed-spelling fixture de-duplicates and sorts", () => {
  expect(normalizeTechnologyIdsV153(["CTIS-07", "7", "1", "CTIS-24", "24", "확인필요"])).toEqual([
    "01",
    "07",
    "24",
  ]);
  expect(matchesTechnologyV153(["CTIS-07"], "7")).toBe(true);
  expect(matchesTechnologyV153(["7"], "CTIS-07")).toBe(true);
  expect(matchesTechnologyV153(["7"], "08")).toBe(false);
  expect(matchesTechnologyV153([], "all")).toBe(true);
});
