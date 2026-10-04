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
  // V164: the span is six years, so the label does not claim five.
  expect(direction?.label).toBe("최근 변화");
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

function region(name: string, value: number, overrides: Partial<S2RegionObservationV159> = {}): S2RegionObservationV159 {
  return { ...s1({ year: 2024, value }), regionSystem: "adm1-63", regionKey: `VN-${name}`, regionName: name, ...overrides };
}

test("U2: top/bottom regions and 전국 대비 only appear when a national row exists", () => {
  const rows: S2RegionObservationV159[] = [
    region("A", 5),
    region("B", 9),
    region("C", 1),
    region("D", 7),
    region("E", 3),
    region("F", 4),
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

// ---------------------------------------------------------------------------
// V164 (WP-A): defects found in the screen review of the 판단 포인트 card
// ---------------------------------------------------------------------------

const AS_OF = "2026-10-04";
const opts = (extra: Record<string, unknown> = {}) => ({ countryIso3: "VNM", asOfDate: AS_OF, ...extra });
const pointOf = (points: Array<{ key: string }>, key: string) => points.find((p) => p.key === key) as { key: string; label: string; value: string; detail?: string } | undefined;

test("V164 rank units: a smaller rank number is a rise, the value reads 19위 and no country rank is made of it", () => {
  const rise = [
    s1({ year: 2019, value: 24, unit: "순위", countryIso3: "VNM" }),
    s1({ year: 2024, value: 19, unit: "순위", countryIso3: "VNM" }),
    s1({ year: 2024, value: 40, unit: "순위", countryIso3: "BGD" }),
  ];
  const points = decisionPointsV159("U1", { structure: "S1", rows: rise }, opts());
  expect(pointOf(points, "latest-value")?.value).toBe("19위 (2024년)");
  expect(pointOf(points, "five-year-direction")).toMatchObject({ label: "최근 5년 방향", value: "순위 상승", detail: "2019년 24위 → 2024년 19위" });
  expect(pointOf(points, "country-rank")).toBeUndefined();

  const fall = [s1({ year: 2019, value: 19, unit: "순위" }), s1({ year: 2024, value: 24, unit: "순위" })];
  expect(pointOf(decisionPointsV159("U1", { structure: "S1", rows: fall }, opts()), "five-year-direction")?.value).toBe("순위 하락");
  // A plain value that grows stays an increase.
  const grows = [s1({ year: 2019, value: 24 }), s1({ year: 2024, value: 30 })];
  expect(pointOf(decisionPointsV159("U1", { structure: "S1", rows: grows }, opts()), "five-year-direction")?.value).toBe("증가");
});

test("V164 direction label: 최근 5년 방향 only when the span is five years, else 최근 변화", () => {
  const five = [s1({ year: 2019, value: 1 }), s1({ year: 2024, value: 2 })];
  expect(pointOf(decisionPointsV159("U1", { structure: "S1", rows: five }, opts()), "five-year-direction")?.label).toBe("최근 5년 방향");
  const three = [s1({ year: 2021, value: 1 }), s1({ year: 2024, value: 2 })];
  expect(pointOf(decisionPointsV159("U1", { structure: "S1", rows: three }, opts()), "five-year-direction")?.label).toBe("최근 변화");
  // Latest year with no earlier year inside the search window: no direction at all.
  const far = [s1({ year: 2000, value: 1 }), s1({ year: 2024, value: 2 })];
  expect(pointOf(decisionPointsV159("U1", { structure: "S1", rows: far }, opts()), "five-year-direction")).toBeUndefined();
});

test("V164 constant series: one value repeated for every year has no direction", () => {
  const rows = [2018, 2019, 2020, 2021, 2022, 2023, 2024].map((year) => s1({ year, value: 21.12 }));
  const points = decisionPointsV159("U1", { structure: "S1", rows }, opts());
  expect(pointOf(points, "latest-value")?.value).toBe("21.1 점 (2024년)");
  expect(pointOf(points, "five-year-direction")).toBeUndefined();
});

test("V164 projections: a projection series reads 전망값(연도) and 전망 방향, never 최신값", () => {
  const flagged = [2030, 2050, 2100].map((year, index) => s1({ year, value: 10 + index * 5, valueKind: "projection" }));
  const points = decisionPointsV159("U1", { structure: "S1", rows: flagged }, opts());
  expect(pointOf(points, "latest-value")).toMatchObject({ label: "전망값(2100년)", value: "20 점" });
  expect(pointOf(points, "five-year-direction")).toMatchObject({ label: "전망 방향", value: "증가", detail: "2030년 10 점 → 2100년 20 점" });
  expect(pointOf(points, "country-rank")).toBeUndefined();

  // Not flagged, but its readings lie after today: still a projection.
  const future = [2040, 2050, 2060].map((year, index) => s1({ year, value: 3 - index }));
  expect(pointOf(decisionPointsV159("U1", { structure: "S1", rows: future }, opts()), "latest-value")?.label).toBe("전망값(2060년)");
});

test("V164 an actual series ignores a reading dated after today", () => {
  const rows = [s1({ year: 2022, value: 4 }), s1({ year: 2024, value: 5 }), s1({ year: 2024, value: 5 }), s1({ year: 2031, value: 99 })];
  expect(pointOf(decisionPointsV159("U1", { structure: "S1", rows }, opts()), "latest-value")?.value).toBe("5 점 (2024년)");
});

test("V164 number formatting: 100 and above whole, 10 and above one decimal, billions in 억", () => {
  const latest = (value: number, unit = "점") => pointOf(decisionPointsV159("U1", { structure: "S1", rows: [s1({ year: 2024, value, unit })] }, opts()), "latest-value")!.value;
  expect(latest(1234.567)).toBe("1,235 점 (2024년)");
  expect(latest(123.456)).toBe("123 점 (2024년)");
  expect(latest(12.34)).toBe("12.3 점 (2024년)");
  expect(latest(1.234)).toBe("1.23 점 (2024년)");
  expect(latest(0.00271)).toBe("0.00271 점 (2024년)");
  // "10억 USD" is the delivery's own scale word: 0.98 of it is 9.8억 USD, not "0.98 10억 USD".
  expect(latest(0.98, "10억 USD")).toBe("9.8억 USD (2024년)");
});

test("V164 no doubled 기준: a series name that already ends in 기준 is not given a second one", () => {
  const rows = [
    ...[2020, 2021, 2022, 2023, 2024].map((year) => s1({ indicatorId: "X-000_a", year, value: year - 2000, label: "발전 · 설비용량 기준 — 설명" })),
    s1({ indicatorId: "X-000_b", year: 2024, value: 3, label: "발전 · 기타" }),
  ];
  const detail = pointOf(decisionPointsV159("U1", { structure: "S1", rows }, opts()), "latest-value")?.detail;
  expect(detail).toBe("설비용량 기준");
});

test("V164 headline: a total over its parts, the chart's own unit, never a confidence bound", () => {
  // B-011: the chart draws the ND-GAIN total; a sub-index with more readings is not the headline.
  const ndgain = [
    ...[2018, 2019, 2020, 2021, 2022, 2023, 2024].map((year) => s1({ elementId: "B-011", indicatorId: "B-011_sub_ecos_01", year, value: 40, label: "생태계 서비스 하위지표 — 자연자본 의존도" })),
    ...[2023, 2024].map((year) => s1({ elementId: "B-011", indicatorId: "B-011_ndgain_score", year, value: year === 2024 ? 46.2 : 45.9, label: "ND-GAIN 종합점수" })),
  ];
  const b011 = decisionPointsV159("U1", { structure: "S1", rows: ndgain }, opts());
  expect(pointOf(b011, "latest-value")).toMatchObject({ value: "46.2 점 (2024년)", detail: "ND-GAIN 종합점수 기준" });

  // A-002: the chart's unit is the percentile, not the estimate the comparison key names.
  const wgi = [
    ...[2023, 2024].map((year) => s1({ elementId: "A-002", indicatorId: "A-002_wgi_cc_est", year, value: -0.8, unit: "점", label: "WGI 부패 통제(Estimate) · 방글라데시" })),
    ...[2023, 2024].map((year) => s1({ elementId: "A-002", indicatorId: "A-002_wgi_cc_pctrank", year, value: 30.1, unit: "백분위", label: "WGI 부패 통제(Percentile Rank) · 방글라데시" })),
  ];
  const a002 = pointOf(decisionPointsV159("U1", { structure: "S1", rows: wgi }, opts()), "latest-value");
  expect(a002?.value).toBe("30.1 백분위 (2024년)");
  expect(a002?.detail).toBe("WGI 부패 통제(백분위) 기준");

  // A confidence bound with more readings than the value itself is not chosen.
  const bounded = [
    ...[2020, 2021, 2022, 2023, 2024].map((year) => s1({ indicatorId: "X-000_lo", year, value: 1, label: "지표 신뢰구간 하한" })),
    ...[2023, 2024].map((year) => s1({ indicatorId: "X-000_v", year, value: 7, label: "지표" })),
  ];
  expect(pointOf(decisionPointsV159("U1", { structure: "S1", rows: bounded }, opts()), "latest-value")?.value).toBe("7 점 (2024년)");
});

test("V164 headline: the series the page's first chart draws wins over the card's own choice", () => {
  const rows = [
    ...[2020, 2021, 2022, 2023, 2024].map((year) => s1({ indicatorId: "X-000_many", year, value: 1, label: "지표 · 많은 계열" })),
    s1({ indicatorId: "X-000_drawn", year: 2024, value: 8, label: "지표 · 그려진 계열" }),
  ];
  expect(pointOf(decisionPointsV159("U1", { structure: "S1", rows }, opts()), "latest-value")?.value).toBe("1 점 (2024년)");
  expect(pointOf(decisionPointsV159("U1", { structure: "S1", rows }, opts({ drawnIndicatorIds: ["X-000_drawn"] })), "latest-value")?.value).toBe("8 점 (2024년)");
});

test("V164 U2: fewer than six distinct regions hides the card; a region listed twice counts once", () => {
  const five = ["A", "B", "C", "D", "E"].map((name, index) => region(name, index + 1));
  expect(decisionPointsV159("U2", { structure: "S2", rows: five }, opts())).toEqual([]);
  const sixWithRepeat = [...five, region("A", 9), region("F", 6)];
  const points = decisionPointsV159("U2", { structure: "S2", rows: sixWithRepeat }, opts());
  // Six names, one of them listed twice: A keeps its first value.
  expect(pointOf(points, "top-regions")?.value.split(" · ")).toHaveLength(3);
  expect((pointOf(points, "top-regions")?.value.match(/A:/gu) || []).length).toBeLessThanOrEqual(1);
});

test("V164 U2: the top three and the bottom three share no region and never repeat one", () => {
  const rows = ["A", "B", "C", "D", "E", "F", "G"].map((name, index) => region(name, 10 - index));
  const points = decisionPointsV159("U2", { structure: "S2", rows }, opts());
  const names = (key: string) => pointOf(points, key)!.value.split(" · ").map((item) => item.split(":")[0]);
  expect(names("top-regions")).toEqual(["A", "B", "C"]);
  expect(names("bottom-regions")).toEqual(["G", "F", "E"]);
  expect(new Set([...names("top-regions"), ...names("bottom-regions")]).size).toBe(6);
});

test("V164 U2: equal values everywhere, or a coarse value copied down to many provinces, hide the card", () => {
  const allEqual = ["A", "B", "C", "D", "E", "F", "G"].map((name) => region(name, 5));
  expect(decisionPointsV159("U2", { structure: "S2", rows: allEqual }, opts())).toEqual([]);
  // Eight provinces share the top value: a coarser region system copied down.
  const copied = ["A", "B", "C", "D", "E", "F", "G", "H"].map((name, index) => region(name, index < 6 ? 9 : 2));
  expect(decisionPointsV159("U2", { structure: "S2", rows: copied }, opts())).toEqual([]);
});

test("V164 U2: a value shared at the edge of the three says how many regions share it", () => {
  const rows = [region("A", 9), region("B", 8), region("C", 8), region("D", 8), region("E", 4), region("F", 3), region("G", 2), region("H", 1), region("I", 0.5), region("J", 0.2)];
  const points = decisionPointsV159("U2", { structure: "S2", rows }, opts());
  expect(pointOf(points, "top-regions")?.detail).toContain("같은 값 3곳 중 2곳");
  expect(pointOf(points, "bottom-regions")?.detail).not.toContain("같은 값");
});

test("V164 U2: rows of another region system (the coarse regions) are not counted as provinces", () => {
  const provinces = ["A", "B", "C", "D", "E", "F"].map((name, index) => region(name, index + 1));
  const coarse = [region("Red River Delta", 99, { regionSystem: "region-6", regionKey: "R1" }), region("Mekong Delta", 98, { regionSystem: "region-6", regionKey: "R2" })];
  const points = decisionPointsV159("U2", { structure: "S2", rows: [...coarse, ...provinces] }, opts());
  expect(pointOf(points, "top-regions")?.value).not.toContain("99");
  expect(pointOf(points, "top-regions")?.value.startsWith("F: 6")).toBe(true);
});

test("V164 U2: the page's drawn series is the one ranked, not the one with the most rows", () => {
  const names = ["A", "B", "C", "D", "E", "F", "G"];
  const many = names.flatMap((name, index) => [region(name, index + 1, { indicatorId: "X-000_many" }), region(name, index + 1, { indicatorId: "X-000_many", year: 2023 })]);
  const drawn = names.map((name, index) => region(name, 100 + (names.length - index), { indicatorId: "X-000_drawn" }));
  const points = decisionPointsV159("U2", { structure: "S2", rows: [...many, ...drawn] }, opts({ drawnIndicatorIds: ["X-000_drawn"] }));
  expect(pointOf(points, "top-regions")?.value.startsWith("A: 107")).toBe(true);
});

test("V164 U3: three sources of one technology stay three entries; totals and source subtotals are not entries", () => {
  const a018 = (key: string, name: string, value: number) =>
    s1({
      elementId: "A-018",
      indicatorId: `A-018_capacity_${key}_ongrid`,
      countryIso3: "BGD",
      year: 2025,
      value,
      unit: "MW",
      techIds: ["16"],
      category: name,
      label: `발전 설비용량 · ${name}(계통연계) — 기술별 누적 설치 발전설비 용량`,
    });
  const rows = [
    a018("fossil_fuels", "Fossil fuels", 25000),
    a018("natural_gas", "Natural gas", 12472),
    a018("oil", "Oil", 6409),
    a018("coal", "Coal", 6273),
    a018("solar", "Solar energy", 800),
  ];
  const points = decisionPointsV159("U3", { structure: "S1", rows }, opts({ countryIso3: "BGD" }));
  const top = pointOf(points, "top-technologies")!.value;
  expect(top).toContain("12,472 MW");
  expect(top).toContain("6,409 MW");
  expect(top).toContain("6,273 MW");
  expect(top).not.toContain("25,000");
  expect(pointOf(points, "technology-count")?.value).toBe("4개 항목 · 2025년 기준");
});

test("V164 U3: sample bounds are not entries, one entry is no ranking, a future year says 전망", () => {
  const capex = (name: string, bound: S1CountryObservationV159["bound"], value: number, tech: string) =>
    s1({ elementId: "D-001", indicatorId: `D-001_${name}_${bound}`, year: 2024, value, unit: "USD/kW", bound, techIds: [tech], label: `투자비 · ${name}` });
  const rows = [
    capex("육상풍력", "central", 1500, "03"), capex("육상풍력", "max", 9000, "03"), capex("육상풍력", "min", 100, "03"),
    capex("태양광", "central", 900, "01"), capex("태양광", "max", 5000, "01"),
    capex("수력", "central", 2100, "05"),
  ];
  const points = decisionPointsV159("U3", { structure: "S1", rows }, opts());
  expect(pointOf(points, "top-technologies")?.value).toBe("수력: 2,100 USD/kW · 육상풍력: 1,500 USD/kW · 태양광: 900 USD/kW");
  expect(pointOf(points, "technology-count")?.value).toBe("3개 항목 · 2024년 기준");

  const single = [capex("태양광", "central", 900, "01")];
  expect(decisionPointsV159("U3", { structure: "S1", rows: single }, opts())).toEqual([]);

  const future = [2030, 2030].map((year, index) => s1({ indicatorId: `A-000_${index}`, year, value: 10 + index, techIds: [index ? "03" : "01"], label: `규모 · ${index ? "풍력" : "태양광"}` }));
  expect(pointOf(decisionPointsV159("U3", { structure: "S1", rows: future }, opts()), "technology-count")?.value).toBe("2개 항목 · 2030년 전망 기준");
});

test("V164 U4: class names merge into one Korean spelling and a placeholder row is not an entity", () => {
  const rows: S3LocatedEntityV159[] = [
    baseS3({ name: "A", classLabel: "solar" }),
    baseS3({ name: "B", classLabel: "Solar" }),
    baseS3({ name: "C", classLabel: "태양광" }),
    baseS3({ name: "D", classLabel: "Hydro" }),
    baseS3({ name: "E", classLabel: "hydro" }),
    baseS3({ name: "F", classLabel: "unmapped_raw_key" }),
    // The delivery's own "no record" row.
    baseS3({ name: "A-025 record 1" }),
    baseS3({ name: null }),
  ];
  const points = decisionPointsV159("U4", { structure: "S3", rows }, opts());
  expect(pointOf(points, "entity-count")?.value).toBe("6개");
  expect(pointOf(points, "class-composition")?.value).toBe("태양광 3건 · 수력 2건");
});

test("V164 U5: the count is the list's individual records, not aggregates or observation-derived rows", () => {
  const rows: S4EntityV159[] = [
    baseS4({ name: "a", origin: "entity", recordRole: "individual" }),
    baseS4({ name: "b", origin: "entity", recordRole: "individual" }),
    baseS4({ name: "total", origin: "entity", recordRole: "aggregate" }),
    baseS4({ name: "def", origin: "entity", recordRole: "definition" }),
    baseS4({ name: "obs", origin: "observation" }),
  ];
  expect(pointOf(decisionPointsV159("U5", { structure: "S4", rows }, opts()), "record-count")?.value).toBe("2건");
});

test("V164 U5: amounts in millions are scaled, and a partial sum says how many records it covers", () => {
  const scaled: S4EntityV159[] = [
    baseS4({ amount: { value: 100, currency: "USD", scale: 1_000_000 } }),
    baseS4({ amount: { value: 50, currency: "USD", scale: 1_000_000 } }),
  ];
  const total = pointOf(decisionPointsV159("U5", { structure: "S4", rows: scaled }, opts()), "amount-total");
  expect(total?.value).toBe("1.5억 USD");
  expect(total?.detail).toBeUndefined();

  const partial: S4EntityV159[] = [...scaled, baseS4({ amount: null })];
  expect(pointOf(decisionPointsV159("U5", { structure: "S4", rows: partial }, opts()), "amount-total")?.detail).toBe("금액 기재 2건 합계");
});

test("V164 U5: 최근 승인 is an individual project's approval date that has already happened", () => {
  const rows: S4EntityV159[] = [
    baseS4({ name: "Old   project", date: "2026-09-29", dateKey: "승인일", recordRole: "individual" }),
    baseS4({ name: "Earlier", date: "2025-01-10", dateKey: "승인일", recordRole: "individual" }),
    // A date after today is not an approval yet.
    baseS4({ name: "Future", date: "2027-03-01", dateKey: "승인일", recordRole: "individual" }),
    // An aggregate row is not a project.
    baseS4({ name: "Total", date: "2026-10-01", dateKey: "승인일", recordRole: "aggregate" }),
  ];
  const approval = pointOf(decisionPointsV159("U5", { structure: "S4", rows }, opts()), "latest-approval");
  expect(approval).toMatchObject({ value: "2026-09-29", detail: "Old project" });
});

test("V164 U5: a date column that is not an approval, or too few stated values, give no 최근 승인 / 기관", () => {
  const published: S4EntityV159[] = [baseS4({ date: "2024-02-02", dateKey: "발행일", org: "X" }), baseS4({ date: "2024-03-03", dateKey: "발행일", org: "X" })];
  const p1 = decisionPointsV159("U5", { structure: "S4", rows: published }, opts());
  expect(pointOf(p1, "latest-approval")).toBeUndefined();
  expect(pointOf(p1, "top-orgs")?.value).toBe("X 2건");

  const sparse: S4EntityV159[] = [baseS4({ date: "2024-02-02", dateKey: "승인일", org: "X" }), baseS4({}), baseS4({}), baseS4({})];
  const p2 = decisionPointsV159("U5", { structure: "S4", rows: sparse }, opts());
  expect(pointOf(p2, "latest-approval")).toBeUndefined();
  expect(pointOf(p2, "top-orgs")).toBeUndefined();
});

test("V164 U5: a long organisation name prints as its bracketed short form", () => {
  const org = "International Bank for Reconstruction and Development (World Bank)";
  const rows: S4EntityV159[] = [baseS4({ org }), baseS4({ org })];
  expect(pointOf(decisionPointsV159("U5", { structure: "S4", rows }, opts()), "top-orgs")?.value).toBe("World Bank 2건");
});

test("V164 U6: 최신 개정 is an exact date up to today, never a year the delivery only carries", () => {
  const yearOnly: S4EntityV159[] = [baseS4({ name: "Agreement", year: 2026, date: null })];
  expect(pointOf(decisionPointsV159("U6", { structure: "S4", rows: yearOnly }, opts()), "latest-revision")).toBeUndefined();

  const rows: S4EntityV159[] = [
    baseS4({ name: "Law A", date: "2024-05-01" }),
    baseS4({ name: "Law B", date: "2027-01-01" }),
    baseS4({ name: "2024-06-01", date: "2024-06-01" }),
  ];
  // The future date is skipped; a name that is only the date is not repeated beside it.
  expect(pointOf(decisionPointsV159("U6", { structure: "S4", rows }, opts()), "latest-revision")?.value).toBe("2024-06-01");
  expect(pointOf(decisionPointsV159("U6", { structure: "S4", rows: rows.slice(0, 2) }, opts()), "latest-revision")?.value).toBe("Law A (2024-05-01)");
});

test("V164 U6: statuses read as short Korean names; review notes and English raw words are dropped", () => {
  const status = (value: string) => baseS4({ status: value });
  const rows: S4EntityV159[] = [
    status("시행중 (2000·2002·2010년 개정 반영)"),
    status("시행중"),
    status("In force"),
    status("Signed (not in force)"),
    status("종료 — 2020 폐지"),
    status("확인 필요: 원문 미확보"),
    status("raw_status_code"),
  ];
  const value = pointOf(decisionPointsV159("U6", { structure: "S4", rows }, opts()), "status-breakdown")!.value;
  expect(value).toBe("시행중 3건 · 서명(미발효) 1건 · 종료 1건");
  expect(value).not.toMatch(/raw_status|확인 필요|In force/u);

  const many = ["가", "나", "다", "라", "마", "바"].map(status);
  expect(pointOf(decisionPointsV159("U6", { structure: "S4", rows: many }, opts()), "status-breakdown")?.value).toContain("그 밖 2종");
});
