import { expect, test } from "@jest/globals";
import type { S1CountryObservationV159, S2RegionObservationV159 } from "./structureTypesV159";
import { decisionPointsV159 } from "./decisionPointsV159";
import { decisionPointsForPageV164 } from "./decisionPointsPageV164";

function s1(overrides: Partial<S1CountryObservationV159>): S1CountryObservationV159 {
  return {
    elementId: "X-000",
    indicatorId: "X-000_series",
    countryIso3: "VNM",
    year: 2024,
    period: null,
    value: 10,
    missingReasonCode: null,
    note: null,
    category: null,
    scenario: null,
    techIds: [],
    bound: null,
    valueKind: null,
    unit: "점",
    unitDetail: null,
    label: "지표",
    ...overrides,
  };
}

function region(name: string, value: number, overrides: Partial<S2RegionObservationV159> = {}): S2RegionObservationV159 {
  return { ...s1({ year: 2024, value }), regionSystem: "adm1-63", regionKey: `VN-${name}`, regionName: name, ...overrides };
}

const NAMES = ["A", "B", "C", "D", "E", "F", "G"];
const opts = (extra: Record<string, unknown> = {}) => ({ countryIso3: "VNM", ...extra });
const valueOf = (points: { key: string; value: string }[], key: string) => points.find((point) => point.key === key)?.value;

test("U2 reads the loaded map layer first, so the card ranks what the map draws", () => {
  const packRows = NAMES.map((name, index) => region(name, index + 1, { indicatorId: "X-000_pack" }));
  const layerRows = NAMES.map((name, index) => region(name, 50 + index, { indicatorId: "X-000_layer" }));
  const points = decisionPointsForPageV164("U2", { structure: "S2", rows: packRows }, opts(), layerRows);
  expect(valueOf(points, "top-regions")?.startsWith("G: 56")).toBe(true);
});

test("U2 falls back to the pack rows when there is no layer", () => {
  const packRows = NAMES.map((name, index) => region(name, index + 1));
  const points = decisionPointsForPageV164("U2", { structure: "S2", rows: packRows }, opts());
  expect(points).toEqual(decisionPointsV159("U2", { structure: "S2", rows: packRows }, opts()));
  expect(valueOf(points, "top-regions")?.startsWith("G: 7")).toBe(true);
});

test("U2 falls back to the pack rows when the layer yields no points", () => {
  const packRows = NAMES.map((name, index) => region(name, index + 1));
  // Three regions are not enough for a top and a bottom three.
  const thinLayer = ["A", "B", "C"].map((name, index) => region(name, 10 + index));
  const points = decisionPointsForPageV164("U2", { structure: "S2", rows: packRows }, opts(), thinLayer);
  expect(valueOf(points, "top-regions")?.startsWith("G: 7")).toBe(true);
});

test("the drawn series ids reach the layer call as well as the pack call (V164)", () => {
  const layerRows = NAMES.flatMap((name, index) => [
    region(name, index + 1, { indicatorId: "X-000_many" }),
    region(name, index + 1, { indicatorId: "X-000_many", year: 2023 }),
    region(name, 100 + (NAMES.length - index), { indicatorId: "X-000_drawn" }),
  ]);
  const withDrawn = decisionPointsForPageV164("U2", { structure: "S2", rows: [] }, opts({ drawnIndicatorIds: ["X-000_drawn"] }), layerRows);
  expect(valueOf(withDrawn, "top-regions")?.startsWith("A: 107")).toBe(true);

  const packRows = layerRows;
  const fromPack = decisionPointsForPageV164("U2", { structure: "S2", rows: packRows }, opts({ drawnIndicatorIds: ["X-000_drawn"] }));
  expect(valueOf(fromPack, "top-regions")?.startsWith("A: 107")).toBe(true);
});

test("a display type other than U2 ignores the layer rows", () => {
  const rows = [s1({ year: 2018, value: 40 }), s1({ year: 2024, value: 55 })];
  const layerRows = NAMES.map((name, index) => region(name, 50 + index));
  const points = decisionPointsForPageV164("U1", { structure: "S1", rows }, opts(), layerRows);
  expect(points).toEqual(decisionPointsV159("U1", { structure: "S1", rows }, opts()));
  expect(valueOf(points, "latest-value")).toBe("55 점 (2024년)");
});
