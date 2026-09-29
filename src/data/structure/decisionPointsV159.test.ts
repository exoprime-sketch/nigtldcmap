import { expect, test } from "@jest/globals";
import type {
  S1CountryObservationV159,
  S2RegionObservationV159,
  S3LocatedEntityV159,
  S4EntityV159,
} from "./structureTypesV159";
import { decisionPointsU3RecordsV159, decisionPointsV159 } from "./decisionPointsV159";

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

test("U1: latest value/year point appears; 5-year direction uses the nearest earlier year when the exact year is missing", () => {
  const rows: S1CountryObservationV159[] = [
    s1({ year: 2018, value: 40 }),
    // 2019 intentionally missing - a gap the "nearest earlier year" rule must bridge.
    s1({ year: 2024, value: 55 }),
  ];
  const points = decisionPointsV159("U1", { structure: "S1", rows }, { countryIso3: "VNM" });
  const latest = points.find((p) => p.key === "latest-value");
  expect(latest?.value).toBe("55 점 (2024년)");
  const direction = points.find((p) => p.key === "five-year-direction");
  expect(direction?.value).toBe("증가");
  expect(direction?.detail).toContain("2018년 40 점");
});

test("U1: country rank is hidden when only one country has the headline indicator", () => {
  const rows: S1CountryObservationV159[] = [s1({ year: 2024, value: 55, countryIso3: "VNM" })];
  const points = decisionPointsV159("U1", { structure: "S1", rows }, { countryIso3: "VNM" });
  expect(points.find((p) => p.key === "country-rank")).toBeUndefined();
});

test("U1: country rank appears once at least two countries share the year", () => {
  const rows: S1CountryObservationV159[] = [
    s1({ year: 2024, value: 55, countryIso3: "VNM" }),
    s1({ year: 2024, value: 70, countryIso3: "BGD" }),
  ];
  const points = decisionPointsV159("U1", { structure: "S1", rows }, { countryIso3: "VNM" });
  const rank = points.find((p) => p.key === "country-rank");
  expect(rank?.value).toBe("2위");
});

test("U2: top/bottom regions and 전국 대비 only appear when a national row exists", () => {
  const rows: S2RegionObservationV159[] = [
    { ...s1({ year: 2024, value: 5 }), regionSystem: "adm1-63", regionKey: "VN-01", regionName: "A" },
    { ...s1({ year: 2024, value: 9 }), regionSystem: "adm1-63", regionKey: "VN-02", regionName: "B" },
    { ...s1({ year: 2024, value: 1 }), regionSystem: "adm1-63", regionKey: "VN-03", regionName: "C" },
  ];
  const points = decisionPointsV159("U2", { structure: "S2", rows }, { countryIso3: "VNM" });
  expect(points.find((p) => p.key === "top-regions")?.value).toContain("B");
  expect(points.find((p) => p.key === "national-comparison")).toBeUndefined();

  const withNational: S2RegionObservationV159[] = [
    ...rows,
    { ...s1({ year: 2024, value: 6 }), regionSystem: null, regionKey: null, regionName: null },
  ];
  const points2 = decisionPointsV159("U2", { structure: "S2", rows: withNational }, { countryIso3: "VNM" });
  expect(points2.find((p) => p.key === "national-comparison")?.value).toContain("전국 6");
});

test("U3: top technologies ranks by value and never labels them 유망", () => {
  const rows: S1CountryObservationV159[] = [
    s1({ indicatorId: "A-018_a", year: 2023, value: 100, techIds: ["01"] }),
    s1({ indicatorId: "A-018_b", year: 2023, value: 300, techIds: ["03"] }),
    s1({ indicatorId: "A-018_c", year: 2023, value: 200, techIds: ["05"] }),
  ];
  const points = decisionPointsV159("U3", { structure: "S1", rows }, { countryIso3: "VNM" });
  const top = points.find((p) => p.key === "top-technologies");
  expect(top?.value).not.toContain("유망");
  expect(top?.value.indexOf("풍력")).toBeLessThan(top!.value.indexOf("수력"));
});

test("U4: mixed size units suppress the total; a single unit sums correctly", () => {
  const mixed: S3LocatedEntityV159[] = [
    baseS3({ size: { value: 10, unit: "MW" } }),
    baseS3({ size: { value: 5, unit: "kV" } }),
  ];
  const p1 = decisionPointsV159("U4", { structure: "S3", rows: mixed }, { countryIso3: "VNM" });
  expect(p1.find((p) => p.key === "size-total")).toBeUndefined();

  const uniform: S3LocatedEntityV159[] = [
    baseS3({ size: { value: 10, unit: "MW" } }),
    baseS3({ size: { value: 5, unit: "MW" } }),
  ];
  const p2 = decisionPointsV159("U4", { structure: "S3", rows: uniform }, { countryIso3: "VNM" });
  expect(p2.find((p) => p.key === "size-total")?.value).toBe("15 MW");
});

test("U5: mixed currencies suppress the total", () => {
  const rows: S4EntityV159[] = [
    baseS4({ amount: { value: 100, currency: "USD" } }),
    baseS4({ amount: { value: 50, currency: "KRW" } }),
  ];
  const points = decisionPointsV159("U5", { structure: "S4", rows }, { countryIso3: "VNM" });
  expect(points.find((p) => p.key === "amount-total")).toBeUndefined();
});

test("U6: incentive presence only appears when a record's own text names one", () => {
  const noIncentive: S4EntityV159[] = [baseS4({ recordType: "법령", description: "온실가스 감축" })];
  const p1 = decisionPointsV159("U6", { structure: "S4", rows: noIncentive }, { countryIso3: "VNM" });
  expect(p1.find((p) => p.key === "incentive-presence")).toBeUndefined();

  const withIncentive: S4EntityV159[] = [baseS4({ description: "재생에너지 투자 인센티브 조건" })];
  const p2 = decisionPointsV159("U6", { structure: "S4", rows: withIncentive }, { countryIso3: "VNM" });
  expect(p2.find((p) => p.key === "incentive-presence")?.value).toBe("있음 (1건)");
});

function baseS3(overrides: Partial<S3LocatedEntityV159>): S3LocatedEntityV159 {
  return {
    elementId: "X-000",
    indicatorId: null,
    recordKey: "k",
    name: null,
    latitude: null,
    longitude: null,
    geometryType: null,
    crs: null,
    geometryRef: null,
    classKey: null,
    classLabel: null,
    size: null,
    year: null,
    owner: null,
    adm1Source: null,
    techIds: [],
    sourceUrl: null,
    coordinateQuality: null,
    ...overrides,
  };
}

function baseS4(overrides: Partial<S4EntityV159>): S4EntityV159 {
  return {
    elementId: "X-000",
    indicatorId: null,
    recordKey: "k",
    name: null,
    recordType: null,
    year: null,
    date: null,
    status: null,
    description: null,
    amount: null,
    org: null,
    regionTags: [],
    techIds: [],
    links: [],
    score: null,
    ...overrides,
  };
}

test("U3 reference country (spec v8, E-017): level, rank among subjects, gap in %p", () => {
  const level = (countryIso3: string, value: number) => s1({ indicatorId: "E-017_tech_level", countryIso3, year: 2020, value, unit: "%" });
  const rows = [level("CHN", 75.9), level("EUU", 95.6), level("JPN", 88.4), level("KOR", 80.8), level("USA", 98.4)];
  const labels: Record<string, string> = { KOR: "한국", USA: "미국" };
  const points = decisionPointsV159("U3", { structure: "S1", rows }, {
    countryIso3: "VNM",
    referenceCountryIso3: "KOR",
    countryLabel: (iso3) => labels[iso3] || iso3,
  });
  expect(points.map((p) => p.key)).toEqual(["reference-level", "reference-rank", "reference-gap"]);
  expect(points[0]).toMatchObject({ label: "한국 수준" });
  expect(points[0].value).toContain("80.8");
  expect(points[1]).toMatchObject({ label: "5개국 중 순위", value: "4위" });
  expect(points[2].value.startsWith("17.6%p (미국 98.4")).toBe(true);
  // Without a reference country the same rows give no ③ points (no technology rows).
  expect(decisionPointsV159("U3", { structure: "S1", rows }, { countryIso3: "VNM" })).toEqual([]);
});

test("U3 records (spec v8, E-008): total by kind and the top three technology fields", () => {
  const records = [
    { kind: "논문", technologies: ["물", "건강"] },
    { kind: "논문", technologies: ["물"] },
    { kind: "특허", technologies: ["태양광"] },
    { kind: "논문", technologies: [] },
    { kind: "논문", technologies: ["물", "태양광"] },
  ];
  const points = decisionPointsU3RecordsV159(records);
  expect(points).toEqual([
    { key: "record-total", label: "총 건수", value: "5건 (논문 4 · 특허 1)" },
    { key: "top-technology-fields", label: "건수 상위 기술 분야", value: "물 3건 · 태양광 2건 · 건강 1건" },
  ]);
  expect(decisionPointsU3RecordsV159([{ kind: "논문", technologies: [] }])).toEqual([]);
});
