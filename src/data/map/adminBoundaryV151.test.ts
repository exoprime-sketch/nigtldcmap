import { test, expect } from "@jest/globals";
import { readFileSync } from "fs";
import { join } from "path";
import { PROVINCE_KO_V150 } from "./mapBackdropV150";
import {
  ADM1_34_UNITS_V151,
  ADM1_34_UNIT_BY_MEMBER_V151,
  BOUNDARY_UNIT_COUNT_V151,
  DEFAULT_BOUNDARY_SYSTEM_V151,
  PROVINCE_KO_34_V151,
  VALUE_BOUNDARY_SYSTEM_V151,
  boundaryGeometryPathV151,
  boundarySystemLabelV151,
  boundarySystemShortLabelV151,
  boundarySystemV151,
  boundaryValueNoticeV151,
} from "./adminBoundaryV151";

// Read at test time rather than statically imported: the candidate build
// (.verify/candidate) copies src/ without reports/, and CRA type-checks tests.
const crosswalkBuild = JSON.parse(
  readFileSync(join(__dirname, "../../../reports/v138/map-targets-build-v138.json"), "utf8"),
) as { crosswalk34: { region: string; key: string; memberAdm1Codes: string[] }[] };
const crosswalk34 = crosswalkBuild.crosswalk34;
// The built asset is read from disk so the test compares the table against the
// bytes the site actually serves, not a second copy of the same literal.
const adm1_34 = JSON.parse(
  readFileSync(
    join(__dirname, "../../../public/data/vietnam/v2/geometry/vnm-adm1-34.geojson"),
    "utf8"
  )
) as { features: { properties: Record<string, unknown> }[] };
const units34 = adm1_34.features.map((feature) => feature.properties);

test("the 34-unit table is the crosswalk34 source of truth, with no province lost or duplicated", () => {
  expect(ADM1_34_UNITS_V151).toHaveLength(34);
  expect(crosswalk34).toHaveLength(34);

  const members = ADM1_34_UNITS_V151.flatMap((unit) => unit.memberAdm1Codes);
  expect(members).toHaveLength(63);
  expect(new Set(members).size).toBe(63);
  // Every pre-2025 province the label table knows is folded into exactly one unit.
  expect(new Set(members)).toEqual(new Set(Object.keys(PROVINCE_KO_V150)));

  const byRegion = new Map(crosswalk34.map((row) => [row.region, [...row.memberAdm1Codes].sort()]));
  for (const unit of ADM1_34_UNITS_V151) {
    expect(byRegion.get(unit.name)).toEqual([...unit.memberAdm1Codes].sort());
    expect(unit.memberAdm1Codes).toContain(unit.successorAdm1Code);
  }
});

test("the built 34-unit asset matches the table and keeps its codes apart from adm1Code", () => {
  expect(units34).toHaveLength(34);
  const tableByCode = new Map(ADM1_34_UNITS_V151.map((unit) => [unit.unitCode, unit]));
  for (const properties of units34) {
    const unit = tableByCode.get(String(properties.unitCode));
    expect(unit).toBeDefined();
    expect(properties.name).toBe(unit?.name);
    expect(properties.successorAdm1Code).toBe(unit?.successorAdm1Code);
    expect(properties.memberAdm1Codes).toEqual([...(unit?.memberAdm1Codes ?? [])].sort());
    expect(properties.boundarySystem).toBe("post-2025-34");
    // A 63-keyed value must not be able to join onto a 34-unit polygon.
    expect(properties.adm1Code).toBeUndefined();
  }
});

test("34 Korean labels exist, one per unit, and Huế carries its post-2025 name", () => {
  expect(Object.keys(PROVINCE_KO_34_V151)).toHaveLength(34);
  expect(new Set(Object.values(PROVINCE_KO_34_V151)).size).toBe(34);
  expect(PROVINCE_KO_34_V151["VN34-26"]).toBe("후에");
  expect(PROVINCE_KO_V150["VN-26"]).toBe("트어티엔후에");
});

test("membership answers which unit a pre-2025 province joined", () => {
  expect(Object.keys(ADM1_34_UNIT_BY_MEMBER_V151)).toHaveLength(63);
  expect(ADM1_34_UNIT_BY_MEMBER_V151["VN-47"]).toBe("VN34-44");
  expect(ADM1_34_UNIT_BY_MEMBER_V151["VN-43"]).toBe("VN34-SG");
  expect(ADM1_34_UNIT_BY_MEMBER_V151["VN-06"]).toBe("VN34-02");
});

test("34 is the default outline while values stay on the vintage their source published", () => {
  expect(DEFAULT_BOUNDARY_SYSTEM_V151).toBe("post-2025-34");
  expect(VALUE_BOUNDARY_SYSTEM_V151).toBe("pre-2025-63");
  expect(BOUNDARY_UNIT_COUNT_V151["post-2025-34"]).toBe(34);
  expect(BOUNDARY_UNIT_COUNT_V151["pre-2025-63"]).toBe(63);
  expect(boundarySystemV151("pre-2025-63")).toBe("pre-2025-63");
  expect(boundarySystemV151("nonsense")).toBe("post-2025-34");
  expect(boundarySystemV151(null)).toBe("post-2025-34");
  expect(boundaryGeometryPathV151("post-2025-34")).toContain("vnm-adm1-34.geojson");
  expect(boundaryGeometryPathV151("pre-2025-63")).toContain("vnm-adm1-63.geojson");
});

test("the copy separates the outline vintage from the value vintage", () => {
  expect(boundarySystemLabelV151("post-2025-34")).toBe("34개 성·시(2025-07-01 시행)");
  expect(boundarySystemLabelV151("pre-2025-63")).toBe("63개 성·시(개편 전)");
  expect(boundarySystemShortLabelV151("post-2025-34")).toBe("개편 후 34개");
  expect(boundaryValueNoticeV151("post-2025-34")).toContain("34개로 합산하지 않습니다");
  expect(boundaryValueNoticeV151("pre-2025-63")).toContain("63개 성·시 기준");
});
