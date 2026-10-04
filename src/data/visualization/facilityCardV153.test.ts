import { test, expect } from "@jest/globals";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  FACILITY_CARD_SPECS_V153,
  facilityCardRowsV153,
  featureRecordIdsV164,
  powerPlantStatedEntityV164,
  spatialFacilityEntityV164,
} from "./facilityCardV153";
import type { VietnamEntityV124 } from "../vietnam/vietnamTypesV124";
import { readDownloadJsonV158, readZipMembersV158 } from "../testing/downloadZipV158";

const source = (id: string) =>
  readDownloadJsonV158(id);

function inflate(bundle: { entities: Record<string, unknown>[]; recordDefaults?: { entities?: Record<string, unknown> } }) {
  const defaults = bundle.recordDefaults?.entities || {};
  return bundle.entities.map((row) => ({ ...defaults, ...row })) as never[];
}

const labels = (rows: { label: string }[]) => rows.map((row) => row.label);
const byKey = (rows: { key: string; value: string; missing: boolean; href?: string }[]) => Object.fromEntries(rows.map((row) => [row.key, row]));

test("A-023 WRI plant card follows the declared order and reads GPPD owner, year, source", () => {
  const entities = inflate(source("a-023"));
  const wri = entities.find((row: never) => (row as { name?: string }).name === "A Luoi")!;
  const rows = facilityCardRowsV153("A-023", wri);
  expect(labels(rows)).toEqual(["국가", "명칭", "발전원", "소유·운영", "설비용량", "가동 연도", "소재지", "자료 출처"]);
  const card = byKey(rows);
  expect(card.country.value).toBe("베트남");
  expect(card.name.value).toBe("A Luoi");
  expect(card.fuel.value).toBe("수력");
  expect(card.owner.value).toBe("Central Hydro Power JSC");
  expect(card.capacity.value).toMatch(/^170(\.0)? MW$/u);
  expect(card.year.value).toBe("2012");
  expect(card.location.value).toContain("개편 후 34개 기준");
  expect(card.location.value).toContain("Huế");
  expect(card.source.value).toContain("WRI GPPD (2021)");
  expect(card.source.href).toContain("opendevelopmentmekong.net");
});

test("A-023 OSM plant card prints 미기재 for what OSM does not state, never hides the row", () => {
  const entities = inflate(source("a-023"));
  const osm = entities.find((row: never) => (row as { name?: string }).name === "Thủy điện Huội Quảng")!;
  const card = byKey(facilityCardRowsV153("A-023", osm));
  expect(card.owner.value).toBe("Công ty Thủy điện Huội Quảng - Bản Chát");
  expect(card.capacity.value).toBe("520 MW");
  expect(card.year.value).toBe("미기재");
  expect(card.year.missing).toBe(true);
  expect(card.location.value).toContain("선라 (Sơn La)");
  expect(card.source.value).toContain("OSM 추출 (2026)");
  expect(card.source.href).toBe("https://www.openstreetmap.org/node/9316748175");
});

test("E-006 cards separate a Vietnam office from a head office abroad", () => {
  const entities = inflate(source("e-006"));
  const ifc = entities.find((row: never) => String((row as { name?: string }).name).startsWith("International Finance"))!;
  const patamar = entities.find((row: never) => (row as { name?: string }).name === "Patamar Capital")!;
  expect(byKey(facilityCardRowsV153("E-006", ifc)).location.value).toContain("Washington, D.C.");
  expect(byKey(facilityCardRowsV153("E-006", patamar)).location.value).toContain("호찌민 (Hồ Chí Minh)");
  expect(byKey(facilityCardRowsV153("E-006", patamar)).hq.value).toBe("USA");
});

test("C-025 card prints 미기재 for an unstated reduction, never 0", () => {
  const entities = inflate(source("c-025")) as Record<string, unknown>[];
  // 2026-09-30 delivery: the wide "[블록] 속성" template's key for this field
  // (wideRecordsV162.ts), replacing the old "속성14_연간예상감축_tCO2e".
  const key = "사업_연간_예상_감축량_tCO_e_년";
  const unstated = entities.find((row) => {
    const value = ((row.normalizedAttributes || {}) as Record<string, unknown>)[key];
    return value === undefined || value === null || String(value).trim() === "";
  })!;
  const stated = entities.find((row) => Number(((row.normalizedAttributes || {}) as Record<string, unknown>)[key]) > 0)!;
  expect(unstated).toBeDefined();
  const missingScale = byKey(facilityCardRowsV153("C-025", unstated as never)).scale;
  expect(missingScale.value).toBe("미기재");
  expect(missingScale.missing).toBe(true);
  expect(byKey(facilityCardRowsV153("C-025", stated as never)).scale.value).toMatch(/[1-9][\d,.]* tCO₂e\/년$/u);
});

test("every declared spec starts with 국가 and 명칭 and ends with 자료 출처", () => {
  for (const spec of Object.values(FACILITY_CARD_SPECS_V153)) {
    expect(spec.fields[0].label).toBe("국가");
    expect(spec.fields[1].label).toBe("명칭");
    expect(spec.fields[spec.fields.length - 1].label).toBe("자료 출처");
  }
  expect(Object.keys(FACILITY_CARD_SPECS_V153).sort()).toEqual(["A-023", "A-025", "B-048", "C-025", "E-004", "E-005", "E-006", "E-018", "E-019"]);
});

// V164-3: Bangladesh's plants read with the same label-form card as Viet Nam's.
// The data root comes from the country registry (no hand-written data path).
const REPO_ROOT_V164 = resolve(__dirname, "../../..");
const BGD_DIR_V164 = resolve(
  REPO_ROOT_V164,
  `public${(JSON.parse(readFileSync(resolve(REPO_ROOT_V164, "public/data/countries.json"), "utf8")) as { countries: { iso3: string; dataRoot: string }[] }).countries.find((row) => row.iso3 === "BGD")!.dataRoot}`
);
const bgdPlants = () =>
  inflate(JSON.parse(readZipMembersV158(resolve(BGD_DIR_V164, "downloads/a-023.zip")).get("a-023.json")!.toString("utf8"))) as unknown as VietnamEntityV124[];
const bgdFeatures = () =>
  (JSON.parse(readFileSync(resolve(BGD_DIR_V164, "spatial/points/a-023.geojson"), "utf8")) as {
    features: { properties: Record<string, unknown> }[];
  }).features;

test("A-023 Bangladesh record reads its stated facts into the same card (name, fuel, capacity, year, unit, source)", () => {
  const amnura = bgdPlants().find((row) => row.recordId.endsWith("-00048"))!;
  expect(amnura.name).toBe("50");
  const rows = facilityCardRowsV153("A-023", amnura);
  expect(labels(rows)).toEqual(["국가", "명칭", "발전원", "소유·운영", "설비용량", "가동 연도", "소재지", "자료 출처"]);
  const card = byKey(rows);
  expect(card.country.value).toBe("방글라데시");
  expect(card.name.value).toBe("Amnura");
  expect(card.fuel.value).toBe("석유");
  expect(card.owner.value).toBe("미기재");
  expect(card.capacity.value).toMatch(/^50(\.0)? MW$/u);
  expect(card.year.value).toBe("2011");
  expect(card.location.value).toContain("Rajshahi Division");
  expect(card.location.value).not.toContain("원문 표기");
  expect(card.source.value).toBe("WRI GPPD (2021) · Bangladesh Power Development Board");
  expect(card.source.href).toContain("datasets.wri.org");
});

test("A-023 Bangladesh: a year the record does not state stays 미기재; no plant keeps a figure for a name", () => {
  const plants = bgdPlants();
  const faridpur = byKey(facilityCardRowsV153("A-023", plants.find((row) => row.recordId.endsWith("-00029"))!));
  expect(faridpur.name.value).toBe("Faridpur");
  expect(faridpur.year.value).toBe("미기재");
  expect(faridpur.year.missing).toBe(true);
  for (const plant of plants) {
    const card = byKey(facilityCardRowsV153("A-023", plant));
    expect(card.name.value).not.toMatch(/^[\d.,\s]+$/u);
    expect(card.fuel.missing).toBe(false);
    expect(card.capacity.missing).toBe(false);
  }
});

test("A-023 Viet Nam rows are unchanged by the stated-facts reader", () => {
  const entities = inflate(source("a-023")) as unknown as VietnamEntityV124[];
  const changed = entities.filter((row) => {
    const read = powerPlantStatedEntityV164(row);
    return read.name !== row.name || ["capacityMw", "primaryFuel", "commissioningYear", "owner", "sourceName"].some(
      (key) => (read.normalizedAttributes as Record<string, unknown>)[key] !== (row.normalizedAttributes as Record<string, unknown>)[key]
    );
  });
  expect(changed.map((row) => row.name)).toEqual([]);
});

test("a Bangladesh plant drawn from the spatial asset reads the same card as its record", () => {
  const plants = bgdPlants();
  const feature = bgdFeatures().find((row) => row.properties.name === "Amnura")!.properties;
  const record = plants.find((row) => featureRecordIdsV164(feature.recordIds).includes(row.recordId)) || null;
  expect(record).not.toBeNull();
  const drawn = spatialFacilityEntityV164({ elementId: "A-023", countryIso3: "BGD", properties: feature, entity: record })!;
  expect(byKey(facilityCardRowsV153("A-023", drawn))).toEqual(byKey(facilityCardRowsV153("A-023", record!)));
  // Without its record the feature still names the plant, its fuel and capacity.
  const alone = byKey(facilityCardRowsV153("A-023", spatialFacilityEntityV164({ elementId: "A-023", countryIso3: "BGD", properties: feature })!));
  expect(alone.country.value).toBe("방글라데시");
  expect(alone.name.value).toBe("Amnura");
  expect(alone.fuel.value).toBe("석유");
  expect(alone.capacity.value).toMatch(/^50(\.0)? MW$/u);
  expect(alone.year.value).toBe("미기재");
  expect(spatialFacilityEntityV164({ elementId: "B-001", countryIso3: "BGD", properties: feature })).toBeNull();
});

test("featureRecordIdsV164 reads an array, a JSON string or a single id", () => {
  expect(featureRecordIdsV164(["a", "b"])).toEqual(["a", "b"]);
  expect(featureRecordIdsV164('["a","b"]')).toEqual(["a", "b"]);
  expect(featureRecordIdsV164("a")).toEqual(["a"]);
  expect(featureRecordIdsV164("[broken")).toEqual([]);
  expect(featureRecordIdsV164(undefined)).toEqual([]);
});
