import { test, expect } from "@jest/globals";
import { readFileSync } from "fs";
import { join } from "path";
import { aggregateTo34V151 } from "./boundaryPolicyV151";
import type { Adm1Unit34V151 } from "./adminBoundaryV151";
import { broadcastGroupValuesV157_2, groupsWithoutValueV157_2 } from "./groupConstantV157_2";
import type { GroupValueV157_2, ProvinceGroupMembershipV157_2 } from "./groupConstantV157_2";

// The real, verified EVN jurisdiction table (reports/v157-2/tables-verification-v157-2.json:
// 63/63 assigned, 0 duplicated, every row cites an official URL) - this is A-022's actual
// province→group membership, read the same way scripts/v157-2/verify-tables-v157-2.mjs does.
const ROOT = join(__dirname, "../../..");
const evn = JSON.parse(readFileSync(join(ROOT, "tools/etl/countries/vnm/evn-jurisdiction.json"), "utf8")) as {
  provinces63: Array<{ adm1Code: string; name: string; corporation: string }>;
};
const membership: ProvinceGroupMembershipV157_2[] = evn.provinces63.map((row) => ({
  adm1Code: row.adm1Code,
  adm1Name: row.name,
  group: row.corporation,
}));

test("the verified EVN table assigns all 63 provinces to exactly one of 5 corporations", () => {
  expect(membership).toHaveLength(63);
  expect(new Set(membership.map((row) => row.adm1Code)).size).toBe(63);
  expect(new Set(membership.map((row) => row.group))).toEqual(
    new Set(["evnnpc", "evncpc", "evnspc", "evnhanoi", "evnhcmc"])
  );
});

function mkGroupValue(group: string, value: number): GroupValueV157_2 {
  return { group, value, unit: "회/고객", sourceIndicatorId: "A-022_TEST" };
}

test("broadcastGroupValuesV157_2 gives every member of a valued group the same row value", () => {
  const values = new Map([["evnhanoi", mkGroupValue("evnhanoi", 0.95)]]);
  const rows = broadcastGroupValuesV157_2(membership, values, {
    variable: "maifi", variableLabel: "MAIFI", period: "2026",
  });
  expect(rows).toHaveLength(1); // evnhanoi covers exactly Hà Nội (VN-HN)
  expect(rows[0]).toMatchObject({ adm1Code: "VN-HN", value: 0.95, unit: "회/고객", imputed: false });
});

test("a province in a group with no stated value gets no row - never a filled-in zero", () => {
  const values = new Map([["evnhanoi", mkGroupValue("evnhanoi", 0.95)]]);
  const rows = broadcastGroupValuesV157_2(membership, values, {
    variable: "maifi", variableLabel: "MAIFI", period: "2026",
  });
  const hcmcRow = rows.find((r) => r.adm1Code === "VN-SG");
  expect(hcmcRow).toBeUndefined();
  expect(groupsWithoutValueV157_2(membership, values).sort()).toEqual(["evncpc", "evnhcmc", "evnnpc", "evnspc"]);
});

test("broadcast then aggregateTo34V151(\"group-constant\") reproduces the group value per 34-unit, no conflicts across the real EVN table", () => {
  // Every corporation gets a distinct made-up value; A-022's real numbers arrive with
  // V162. The point under test is the pipeline (broadcast → 34-unit combine), not the
  // figure - reports/v157-2/tables-verification-v157-2.json already confirmed 0 34-units
  // span two corporations, so none should conflict here either.
  const values = new Map([
    ["evnnpc", mkGroupValue("evnnpc", 1.1)],
    ["evncpc", mkGroupValue("evncpc", 0.8)],
    ["evnspc", mkGroupValue("evnspc", 1.4)],
    ["evnhanoi", mkGroupValue("evnhanoi", 0.95)],
    ["evnhcmc", mkGroupValue("evnhcmc", 1.2)],
  ]);
  const rows63 = broadcastGroupValuesV157_2(membership, values, {
    variable: "maifi", variableLabel: "MAIFI", period: "2026",
  });
  expect(rows63).toHaveLength(63);

  const crosswalk = JSON.parse(
    readFileSync(join(ROOT, "reports/v138/map-targets-build-v138.json"), "utf8")
  ) as { crosswalk34: Array<{ region: string; key: string; memberAdm1Codes: string[] }> };
  const units: Adm1Unit34V151[] = crosswalk.crosswalk34.map((row) => ({
    unitCode: row.key, name: row.region, nameKo: row.region, successorAdm1Code: row.memberAdm1Codes[0], memberAdm1Codes: row.memberAdm1Codes,
  }));

  const result = aggregateTo34V151(rows63, "group-constant", { units });
  expect(result).toHaveLength(34);
  expect(result.some((unit) => unit.conflict)).toBe(false);
  const groupByCode = new Map(membership.map((row) => [row.adm1Code, row.group]));
  for (const unit of result) {
    if (unit.valueCount === 0) continue;
    const expectedGroup = groupByCode.get(unit.members[0].adm1Code)!;
    expect(unit.value).toBe(values.get(expectedGroup)!.value);
  }
});

test("a synthetic unit whose members span two groups conflicts, and the value is never averaged", () => {
  const fakeMembership: ProvinceGroupMembershipV157_2[] = [
    { adm1Code: "VN-A", adm1Name: "Fake A", group: "north" },
    { adm1Code: "VN-B", adm1Name: "Fake B", group: "south" },
  ];
  const values = new Map([
    ["north", mkGroupValue("north", 1.0)],
    ["south", mkGroupValue("south", 2.0)],
  ]);
  const rows = broadcastGroupValuesV157_2(fakeMembership, values, {
    variable: "test", variableLabel: "Test", period: "2026",
  });
  const fakeUnit: Adm1Unit34V151 = {
    unitCode: "FAKE-MIXED", name: "Fake Mixed", nameKo: "가짜 혼합", successorAdm1Code: "VN-A",
    memberAdm1Codes: ["VN-A", "VN-B"],
  };
  const result = aggregateTo34V151(rows, "group-constant", { units: [fakeUnit] })[0];
  expect(result.conflict).toBe(true);
  expect(result.value).toBeNull(); // never 1.5 (the average) - the two groups disagree
});
