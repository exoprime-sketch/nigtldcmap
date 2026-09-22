import { test, expect } from "@jest/globals";
import { readFileSync } from "fs";
import { resolve } from "path";
import { FACILITY_CARD_SPECS_V153, facilityCardRowsV153 } from "./facilityCardV153";

const source = (id: string) =>
  JSON.parse(readFileSync(resolve(__dirname, `../../../public/data/vietnam/v2/downloads/${id}.json`), "utf8"));

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
  expect(card.location.value).toContain("선라(Sơn La)");
  expect(card.source.value).toContain("OSM 추출 (2026)");
  expect(card.source.href).toBe("https://www.openstreetmap.org/node/9316748175");
});

test("E-006 cards separate a Vietnam office from a head office abroad", () => {
  const entities = inflate(source("e-006"));
  const ifc = entities.find((row: never) => String((row as { name?: string }).name).startsWith("International Finance"))!;
  const patamar = entities.find((row: never) => (row as { name?: string }).name === "Patamar Capital")!;
  expect(byKey(facilityCardRowsV153("E-006", ifc)).location.value).toContain("Washington, D.C.");
  expect(byKey(facilityCardRowsV153("E-006", patamar)).location.value).toContain("호찌민(Hồ Chí Minh)");
  expect(byKey(facilityCardRowsV153("E-006", patamar)).hq.value).toBe("USA");
});

test("every declared spec starts with 국가 and 명칭 and ends with 자료 출처", () => {
  for (const spec of Object.values(FACILITY_CARD_SPECS_V153)) {
    expect(spec.fields[0].label).toBe("국가");
    expect(spec.fields[1].label).toBe("명칭");
    expect(spec.fields[spec.fields.length - 1].label).toBe("자료 출처");
  }
  expect(Object.keys(FACILITY_CARD_SPECS_V153).sort()).toEqual(["A-023", "A-025", "B-048", "C-025", "E-004", "E-005", "E-006", "E-018", "E-019"]);
});
