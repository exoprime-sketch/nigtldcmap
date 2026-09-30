import { test, expect } from "@jest/globals";
import type { VietnamElementMetaBundleV124, VietnamEntityV124 } from "../vietnam/vietnamTypesV124";
import { registerFieldDefinitionsV162 } from "./wideRecordsV162";
import { facilityRegionsV146 } from "./facilityRegionsV146";
import c022Fixture from "./__fixtures__/c022V162.json";

/**
 * C-022's 2026-09-30 delivery moved the province facility count from the old
 * 속성20…22 attribute rows to the wide template's [인벤토리] block (one entity
 * per province). These fixture entities are three real provinces (An Giang,
 * Bắc Ninh, Cao Bằng) plus one non-region record (a sanctions row) from the
 * staged pack, trimmed to only their non-empty attributes.
 */
registerFieldDefinitionsV162(
  "VNM",
  "C-022",
  c022Fixture.fieldDefinitions as VietnamElementMetaBundleV124["fieldDefinitions"]
);

const entities = c022Fixture.entities as unknown as VietnamEntityV124[];

test("wide delivery: each province becomes a region row with its stated count", () => {
  const model = facilityRegionsV146(entities);
  expect(model.regions).toHaveLength(3);
  const anGiang = model.regions.find((row) => row.region === "An Giang");
  expect(anGiang).toMatchObject({ count: 27 });
  const bacNinh = model.regions.find((row) => row.region === "Bac Ninh");
  expect(bacNinh).toMatchObject({ count: 199 });
  // The non-region record (a sanctions row) is not read as a province.
  expect(model.other).toHaveLength(1);
});

test("wide delivery: the four annex categories are read as sectors and their sum is checked, not assumed", () => {
  const model = facilityRegionsV146(entities);
  const anGiang = model.regions.find((row) => row.region === "An Giang")!;
  expect(anGiang.sectors).toHaveLength(4);
  expect(anGiang.sectors.reduce((sum, sector) => sum + sector.value, 0)).toBe(27);
  expect(anGiang.sectorTotalMatches).toBe(true);
});

test("wide delivery: every province shares the one date stated in its own 근거 text", () => {
  const model = facilityRegionsV146(entities);
  expect(model.dates).toEqual(["2026-09-25"]);
  expect(model.regions.every((row) => row.date === "2026-09-25")).toBe(true);
});

test("wide delivery: the region row's key is never the record's delivered id, only its internal recordId", () => {
  const model = facilityRegionsV146(entities);
  const codes = model.regions.map((row) => row.code);
  // Not the "VNM-C022-INV-xx" id the delivery states, and not the raw VN## administrative code either.
  expect(codes.every((code) => !/^VNM-C022-/.test(code))).toBe(true);
});
