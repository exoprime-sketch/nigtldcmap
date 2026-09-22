import { test, expect } from "@jest/globals";
import { readFileSync } from "fs";
import { join } from "path";
import type { VietnamSpatialValueV124 } from "../vietnam/vietnamTypesV124";
import type { Adm1Unit34V151 } from "./adminBoundaryV151";
import { ADM1_34_UNITS_V151 } from "./adminBoundaryV151";
import {
  aggregateTo34V151,
  formerProvinceLabelV151,
  isAggregatingKindV151,
  memberSummaryV151,
  parseMemberSummaryV151,
  policyKindForVariableV151,
} from "./boundaryPolicyV151";
import type { BoundaryPolicyV151 } from "./boundaryPolicyV151";

// Assets are read from disk at test time, the same way adminBoundaryV151.test.ts
// does, so the check runs against the bytes the site actually serves.
const DATA_ROOT = join(__dirname, "../../../public/data/vietnam/v2");
function readSpatialLayer(id: string): { selectors: { defaultVariable: string; defaultPeriod: string }; values: VietnamSpatialValueV124[] } {
  return JSON.parse(readFileSync(join(DATA_ROOT, "spatial/layers", `${id}.json`), "utf8"));
}
const adm1_34_geojson = JSON.parse(
  readFileSync(join(DATA_ROOT, "geometry/vnm-adm1-34.geojson"), "utf8")
) as { features: { properties: Record<string, unknown> }[] };

function mkRow(adm1Code: string, value: number): VietnamSpatialValueV124 {
  return {
    adm1Code,
    adm1Name: adm1Code,
    variable: "test-variable",
    variableLabel: "Test Variable",
    period: "2024",
    value,
    unit: "unit",
    sourceIndicatorId: "TEST-IND",
    sourceRecordId: null,
    sourceSpatialUnit: "admin1",
    imputed: false,
  };
}

// A 3-member fake unit keeps the arithmetic obvious; real-data numeric checks
// against the crosswalk table live in the B-031/B-032/C-019 tests below.
const FAKE_UNITS: readonly Adm1Unit34V151[] = [
  { unitCode: "FAKE-1", name: "Fake One", nameKo: "가짜1", successorAdm1Code: "VN-A", memberAdm1Codes: ["VN-A", "VN-B", "VN-C"] },
];

test("sum: partial when a member is missing, value null when none are present", () => {
  const partial = aggregateTo34V151([mkRow("VN-A", 10), mkRow("VN-B", 20)], "sum", { units: FAKE_UNITS })[0];
  expect(partial.value).toBe(30);
  expect(partial.valueCount).toBe(2);
  expect(partial.memberCount).toBe(3);
  expect(partial.partial).toBe(true);
  expect(partial.conflict).toBe(false);

  const empty = aggregateTo34V151([], "sum", { units: FAKE_UNITS })[0];
  expect(empty.value).toBeNull();
  expect(empty.valueCount).toBe(0);
  expect(empty.partial).toBe(false);
});

test("area-weighted-mean throws a descriptive error when a present member has no area", () => {
  expect(() =>
    aggregateTo34V151([mkRow("VN-A", 10), mkRow("VN-B", 20)], "area-weighted-mean", {
      units: FAKE_UNITS,
      areaKm2ByAdm1Code: { "VN-A": 100 }, // VN-B present but missing here
    })
  ).toThrow(/VN-B/);
});

test("area-weighted-mean combines present members by area once areas are complete", () => {
  const [row] = aggregateTo34V151([mkRow("VN-A", 10), mkRow("VN-B", 30)], "area-weighted-mean", {
    units: FAKE_UNITS,
    areaKm2ByAdm1Code: { "VN-A": 1, "VN-B": 3 },
  });
  expect(row.value).toBeCloseTo((10 * 1 + 30 * 3) / 4, 9);
  expect(row.min).toBe(10);
  expect(row.max).toBe(30);
  expect(row.partial).toBe(true); // VN-C still missing
});

test("member-max and member-min pick the extreme of present values", () => {
  const rows = [mkRow("VN-A", 5), mkRow("VN-B", 9)];
  expect(aggregateTo34V151(rows, "member-max", { units: FAKE_UNITS })[0].value).toBe(9);
  expect(aggregateTo34V151(rows, "member-min", { units: FAKE_UNITS })[0].value).toBe(5);
});

test("count-sum sums present documents and never flags partial (absence = no documents)", () => {
  const row = aggregateTo34V151([mkRow("VN-A", 5), mkRow("VN-B", 7)], "count-sum", { units: FAKE_UNITS })[0];
  expect(row.value).toBe(12);
  expect(row.valueCount).toBe(2);
  expect(row.partial).toBe(false);
});

test("membership-or is 1 if any present member is truthy, 0 if all present are zero, null if none present", () => {
  expect(aggregateTo34V151([mkRow("VN-A", 0), mkRow("VN-B", 3)], "membership-or", { units: FAKE_UNITS })[0].value).toBe(1);
  expect(
    aggregateTo34V151([mkRow("VN-A", 0), mkRow("VN-B", 0), mkRow("VN-C", 0)], "membership-or", { units: FAKE_UNITS })[0].value
  ).toBe(0);
  expect(aggregateTo34V151([], "membership-or", { units: FAKE_UNITS })[0].value).toBeNull();
});

test("native-34 requires every present member to agree, else conflict with a null value", () => {
  const agree = aggregateTo34V151([mkRow("VN-A", 5), mkRow("VN-B", 5)], "native-34", { units: FAKE_UNITS })[0];
  expect(agree.value).toBe(5);
  expect(agree.conflict).toBe(false);
  expect(agree.partial).toBe(false); // native-34 never reports partial, VN-C missing or not

  const disagree = aggregateTo34V151([mkRow("VN-A", 5), mkRow("VN-B", 7)], "native-34", { units: FAKE_UNITS })[0];
  expect(disagree.value).toBeNull();
  expect(disagree.conflict).toBe(true);
});

test("range-only, six-region-only and none never build a 34-unit value", () => {
  const rows = [mkRow("VN-A", 5), mkRow("VN-B", 7)];
  expect(aggregateTo34V151(rows, "range-only", { units: FAKE_UNITS })).toEqual([]);
  expect(aggregateTo34V151(rows, "six-region-only", { units: FAKE_UNITS })).toEqual([]);
  expect(aggregateTo34V151(rows, "none", { units: FAKE_UNITS })).toEqual([]);
  expect(isAggregatingKindV151("range-only")).toBe(false);
  expect(isAggregatingKindV151("sum")).toBe(true);
});

test("B-031: aggregating to 34 by sum never changes the national total, and sum never conflicts", () => {
  const layer = readSpatialLayer("b-031");
  const seriesKeys = new Set(layer.values.map((v) => `${v.variable}__${v.period}`));
  let seriesChecked = 0;
  for (const key of seriesKeys) {
    const [variable, period] = key.split("__");
    const rows = layer.values.filter((v) => v.variable === variable && v.period === period);
    const aggregated = aggregateTo34V151(rows, "sum");
    const rawTotal = rows.reduce((s, r) => s + r.value, 0);
    const aggregatedTotal = aggregated.reduce((s, r) => s + (r.value ?? 0), 0);
    expect(Math.abs(aggregatedTotal - rawTotal) / Math.max(1, Math.abs(rawTotal))).toBeLessThan(1e-6);
    expect(aggregated.every((r) => r.conflict === false)).toBe(true);
    seriesChecked += 1;
  }
  expect(seriesChecked).toBeGreaterThan(0);
  // eslint-disable-next-line no-console
  console.log(`[B-031] national total preserved across ${seriesChecked} variable/period series`);
});

test("B-032: Lâm Đồng's area-weighted value stays within its members' range", () => {
  const layer = readSpatialLayer("b-032");
  const { defaultVariable, defaultPeriod } = layer.selectors;
  const rows = layer.values.filter((v) => v.variable === defaultVariable && v.period === defaultPeriod);

  const lamDong = ADM1_34_UNITS_V151.find((u) => u.unitCode === "VN34-35")!;
  expect(lamDong.memberAdm1Codes).toEqual(["VN-35", "VN-40", "VN-72"]);

  // Prefer real per-member areas if the geometry asset has been rebuilt with
  // them; otherwise fall back to equal weights and say so explicitly.
  const feature = adm1_34_geojson.features.find((f) => f.properties.unitCode === "VN34-35");
  const memberAreaKm2 = feature?.properties.memberAreaKm2 as Record<string, number> | undefined;
  const usingRealAreas = !!memberAreaKm2 && lamDong.memberAdm1Codes.every((c) => typeof memberAreaKm2[c] === "number");
  const areaKm2ByAdm1Code: Record<string, number> = usingRealAreas
    ? memberAreaKm2!
    : Object.fromEntries(lamDong.memberAdm1Codes.map((c) => [c, 1]));

  // Restrict to the one unit under test: areaKm2ByAdm1Code only covers its
  // members, and area-weighted-mean throws on any other unit's present
  // member with no area on record.
  const aggregated = aggregateTo34V151(rows, "area-weighted-mean", { units: [lamDong], areaKm2ByAdm1Code });
  const lamDongRow = aggregated.find((r) => r.unitCode === "VN34-35")!;

  expect(lamDongRow.valueCount).toBe(3);
  expect(lamDongRow.min).not.toBeNull();
  expect(lamDongRow.max).not.toBeNull();
  expect(lamDongRow.value).not.toBeNull();
  expect(lamDongRow.value as number).toBeGreaterThanOrEqual(lamDongRow.min as number);
  expect(lamDongRow.value as number).toBeLessThanOrEqual(lamDongRow.max as number);

  // eslint-disable-next-line no-console
  console.log(
    `[B-032] Lâm Đồng (${usingRealAreas ? "real memberAreaKm2" : "equal-weight fallback, memberAreaKm2 not yet built"}): ` +
      `value=${lamDongRow.value} min=${lamDongRow.min} max=${lamDongRow.max} valueCount=${lamDongRow.valueCount}`
  );
});

test("C-019: native-34 reproduces the identical replicated value per unit, with no conflicts", () => {
  const layer = readSpatialLayer("c-019");
  const { defaultVariable, defaultPeriod } = layer.selectors;
  const rows = layer.values.filter((v) => v.variable === defaultVariable && v.period === defaultPeriod);
  const distinctRegions = new Set(rows.map((r) => r.sourceRegion));

  const result = aggregateTo34V151(rows, "native-34");
  expect(result.every((r) => r.conflict === false)).toBe(true);
  const withValue = result.filter((r) => r.value !== null);
  expect(withValue).toHaveLength(distinctRegions.size);

  for (const r of withValue) {
    const unit = ADM1_34_UNITS_V151.find((u) => u.unitCode === r.unitCode)!;
    const memberRows = rows.filter((row) => unit.memberAdm1Codes.includes(row.adm1Code));
    expect(memberRows.length).toBeGreaterThan(0);
    for (const memberRow of memberRows) {
      expect(memberRow.value).toBeCloseTo(r.value as number, 9);
    }
  }
  // eslint-disable-next-line no-console
  console.log(`[C-019] ${withValue.length} of 34 units carry the replicated value (${distinctRegions.size} source regions)`);
});

test("policyKindForVariableV151 resolves byVariable and strips scenario suffixes", () => {
  const policy: BoundaryPolicyV151 = {
    schema: "boundary-policy-v151-2",
    kind: "sum",
    byVariable: {
      "wind-speed-top10-100m": "range-only",
      "annual-mean-temperature": "area-weighted-mean",
    },
    note: "test policy",
    valueSystem: "pre-2025-63",
  };
  expect(policyKindForVariableV151(policy, "wind-speed-top10-100m")).toBe("range-only");
  expect(policyKindForVariableV151(policy, "annual-mean-temperature--ssp245")).toBe("area-weighted-mean");
  expect(policyKindForVariableV151(policy, "some-other-variable")).toBe("sum");
  expect(policyKindForVariableV151(null, "x")).toBe("none");
});

test("memberSummaryV151 round-trips through parseMemberSummaryV151", () => {
  const [row] = aggregateTo34V151([mkRow("VN-A", 10), mkRow("VN-B", 20)], "sum", { units: FAKE_UNITS });
  const parsed = parseMemberSummaryV151(memberSummaryV151(row));
  expect(parsed).not.toBeNull();
  expect(parsed?.unitCode).toBe(row.unitCode);
  expect(parsed?.kind).toBe(row.kind);
  expect(parsed?.value).toBe(row.value);
  expect(parsed?.valueCount).toBe(row.valueCount);
  expect(parsed?.memberCount).toBe(row.memberCount);
  expect(parsed?.min).toBe(row.min);
  expect(parsed?.max).toBe(row.max);
  expect(parsed?.partial).toBe(row.partial);
  expect(parsed?.conflict).toBe(row.conflict);
  expect(parsed?.members).toEqual(row.members);

  expect(parseMemberSummaryV151("not json")).toBeNull();
  expect(parseMemberSummaryV151(123)).toBeNull();
  expect(parseMemberSummaryV151({})).toBeNull();
});

test("formerProvinceLabelV151 labels folded-away members only", () => {
  expect(formerProvinceLabelV151("VN-72")).toBe("(구 닥농성)"); // merged into Lâm Đồng
  expect(formerProvinceLabelV151("VN-35")).toBe(""); // successor kept the name
  expect(formerProvinceLabelV151("VN-23")).toBe(""); // single-member unit, nothing merged
});
