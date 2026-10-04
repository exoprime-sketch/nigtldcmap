import { describe, expect, it } from "@jest/globals";
import { decimalsOfV164, formatAxisTicksV164, isCountUnitV164, niceStepV164, formatAxisValueV164, niceTicksV164, niceXTicksV164, roundTicksWithinV164, symmetricBoundV164, valueAxisV164 } from "./axisTicksV164";
import { publicCompareTitleV164 } from "../components/data/public/DetailCountryCompareV158";

describe("V164 axis ticks", () => {
  it("places ticks on round steps that cover the data", () => {
    expect(niceTicksV164(0, 495_200_301_543, 5)).toEqual([0, 100e9, 200e9, 300e9, 400e9, 500e9]);
    expect(niceTicksV164(23.7, 28.3, 4)).toEqual([22, 24, 26, 28, 30]);
    expect(niceTicksV164(0, 150_571.91, 4)).toEqual([0, 50_000, 100_000, 150_000, 200_000]);
  });

  it("writes large ticks with one Korean scale word", () => {
    expect(formatAxisTicksV164([0, 100e9, 200e9])).toEqual(["0", "1,000억", "2,000억"]);
    expect(formatAxisTicksV164([0, 50e6, 100e6, 150e6, 200e6])).toEqual(["0", "0.5억", "1억", "1.5억", "2억"]);
    expect(formatAxisTicksV164([0, 0.5, 1, 1.5])).toEqual(["0", "0.5", "1", "1.5"]);
    expect(formatAxisTicksV164([0, 2e12, 4e12])).toEqual(["0", "2조", "4조"]);
  });

  it("writes an end value the way its axis reads", () => {
    expect(formatAxisValueV164(514_697_215_100)).toBe("5,147억");
    expect(formatAxisValueV164(37.46)).toBe("37.5");
    expect(formatAxisValueV164(0.531)).toBe("0.53");
  });
});

describe("V164 tick precision follows the step", () => {
  it("counts the decimals a tick needs", () => {
    expect([0, 5, 2.5, 0.25, 0.5, 1e-3, 20].map(decimalsOfV164)).toEqual([0, 0, 1, 2, 1, 3, 0]);
  });

  it("never rounds a 2.5 step to whole numbers (32.5 / 37.5 stay 32.5 / 37.5)", () => {
    expect(formatAxisTicksV164([30, 32.5, 35, 37.5, 40])).toEqual(["30", "32.5", "35", "37.5", "40"]);
    expect(formatAxisTicksV164([0, 0.25, 0.5, 0.75])).toEqual(["0", "0.25", "0.5", "0.75"]);
    expect(formatAxisTicksV164([0.1 + 0.2, 0.6])).toEqual(["0.3", "0.6"]);
  });

  it("keeps a 2.5억 step as 15억 · 17.5억 · 20억, not 18억", () => {
    expect(formatAxisTicksV164([15e8, 17.5e8, 20e8, 22.5e8, 25e8, 27.5e8])).toEqual(["15억", "17.5억", "20억", "22.5억", "25억", "27.5억"]);
  });
});

describe("V164 round ticks inside a fixed domain", () => {
  it("uses the smallest round step that gives at most count + 2 ticks", () => {
    expect(roundTicksWithinV164(0, 100, 5)).toEqual([0, 20, 40, 60, 80, 100]);
    expect(roundTicksWithinV164(0, 125, 5)).toEqual([0, 25, 50, 75, 100, 125]);
    expect(roundTicksWithinV164(0.5, 3.5, 5)).toEqual([0.5, 1, 1.5, 2, 2.5, 3, 3.5]);
    expect(roundTicksWithinV164(1, 6, 5)).toEqual([1, 2, 3, 4, 5, 6]);
  });
  it("drops the ends that are not round instead of widening the domain", () => {
    expect(roundTicksWithinV164(0, 110, 5)).toEqual([0, 20, 40, 60, 80, 100]);
  });
});

describe("V164 value axis of a line chart", () => {
  const step = (ticks: number[]) => ticks.slice(1).map((tick, index) => Number((tick - ticks[index]).toPrecision(10)));

  it("counts in one step from end to end (A-006: 0.5 ... 3.5 in 0.5s, not 0.5 / 1.1 / 1.7)", () => {
    const axis = valueAxisV164({ values: [0.99, 1.1, 2.9, 2.2], intervals: 5 });
    expect(axis.domain).toEqual([0.5, 3.5]);
    expect(new Set(step(axis.ticks)).size).toBe(1);
    expect(axis.ticks).toEqual([0.5, 1, 1.5, 2, 2.5, 3, 3.5]);
    expect(formatAxisTicksV164(axis.ticks)).toEqual(["0.5", "1", "1.5", "2", "2.5", "3", "3.5"]);
  });

  it("reads 1·2·2.5·5×10ⁿ steps on any data range (B-019 70/82/94, VNM B-027 3.67/4.07)", () => {
    const ranges: Array<[number, number]> = [[71.5, 93], [3.7, 5.6], [18.2, 29.4], [0.0031, 0.0094], [1_250, 98_000], [-4.4, 7.2]];
    for (const [lo, hi] of ranges) {
      const { domain, ticks } = valueAxisV164({ values: [lo, hi], intervals: 5 });
      expect(ticks[0]).toBeGreaterThanOrEqual(domain[0] - 1e-9);
      expect(ticks[ticks.length - 1]).toBeLessThanOrEqual(domain[1] + 1e-9);
      const gaps = step(ticks);
      expect(new Set(gaps).size).toBe(1);
      const mantissa = gaps[0] / 10 ** Math.floor(Math.log10(gaps[0]));
      expect([1, 2, 2.5, 5]).toContain(Number(mantissa.toPrecision(6)));
      expect(domain[0]).toBeLessThanOrEqual(lo);
      expect(domain[1]).toBeGreaterThanOrEqual(hi);
    }
  });

  it("gives a series that never changes a round axis around its value (BGD B-027 21.12)", () => {
    const { domain, ticks } = valueAxisV164({ values: [21.12, 21.12, 21.12] });
    expect(domain[0]).toBeLessThan(21.12);
    expect(domain[1]).toBeGreaterThan(21.12);
    expect(ticks.every((tick) => Number.isInteger(tick * 2))).toBe(true);
  });

  it("stops a percentage whose values fit in 0-100 at 100 (A-021 was drawn to 125)", () => {
    const axis = valueAxisV164({ values: [86.2, 93.1, 99.4], unit: "%", intervals: 5 });
    expect(axis.domain[1]).toBe(100);
    expect(axis.ticks[axis.ticks.length - 1]).toBe(100);
    const over = valueAxisV164({ values: [86.2, 112], unit: "%", intervals: 5 });
    expect(over.domain[1]).toBeGreaterThan(100);
    const notPercent = valueAxisV164({ values: [86.2, 99.4], unit: "USD", intervals: 5 });
    expect(notPercent.domain[1]).toBeGreaterThanOrEqual(99.4);
  });

  it("keeps a fixed domain as given", () => {
    const axis = valueAxisV164({ values: [3], fixedDomain: [1, 6], intervals: 5 });
    expect(axis.domain).toEqual([1, 6]);
    expect(axis.ticks).toEqual([1, 2, 3, 4, 5, 6]);
  });
});

describe("V164 year ticks of the horizontal axis", () => {
  const years = (from: number, to: number) => Array.from({ length: to - from + 1 }, (_, index) => from + index);

  it("labels every observation while they fit (BGD D-010 lost 2022 at 8 of 9)", () => {
    const d010 = [2015, 2019, 2020, 2021, 2022, 2023, 2024, 2025, 2030];
    expect(niceXTicksV164(d010, 9)).toEqual(d010);
  });

  it("uses evenly spaced round years once they do not fit (VNM A-001 had 2018 next to 2019)", () => {
    expect(niceXTicksV164(years(2012, 2025), 8)).toEqual([2012, 2014, 2016, 2018, 2020, 2022, 2024]);
    expect(niceXTicksV164(years(1991, 2025), 10)).toEqual([1995, 2000, 2005, 2010, 2015, 2020, 2025]);
    expect(niceXTicksV164(years(2017, 2026), 8)).toEqual([2018, 2020, 2022, 2024, 2026]);
  });

  it("is evenly spaced for any run of years, never skipping or doubling one", () => {
    for (const [from, to, room] of [[2008, 2023, 6], [1965, 2025, 8], [2000, 2050, 7], [2015, 2030, 5]]) {
      const ticks = niceXTicksV164(years(from, to), room);
      expect(ticks.length).toBeGreaterThanOrEqual(2);
      expect(ticks.length).toBeLessThanOrEqual(room);
      const gaps = ticks.slice(1).map((tick, index) => tick - ticks[index]);
      expect(new Set(gaps).size).toBe(1);
    }
  });

  it("works on observations with gaps and on fractional x values", () => {
    expect(niceXTicksV164([2015, 2019, 2020, 2021, 2022, 2023, 2024, 2025, 2030], 5)).toEqual([2015, 2020, 2025, 2030]);
    const fractional = niceXTicksV164([0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5], 4);
    expect(fractional.length).toBeGreaterThanOrEqual(2);
  });
});

describe("V164 compare title", () => {
  const names = ["방글라데시", "베트남"];
  it("names the measure, not one of the compared countries", () => {
    expect(publicCompareTitleV164("CPI 점수 · 방글라데시 — 국제투명성기구 부패인식지수 점수", names)).toBe("CPI 점수 — 국제투명성기구 부패인식지수 점수");
    expect(publicCompareTitleV164("WGI 부패 통제(Estimate) · 베트남", names)).toBe("WGI 부패 통제(Estimate)");
    expect(publicCompareTitleV164("개도국 내 각국별 ODA 규모 · Official donors — 대방글라데시 ODA 총지출액", names)).toBe("개도국 내 각국별 ODA 규모 · 공적 공여자 전체 — ODA 총지출액");
  });
  it("does not name one partner in a block that draws both (A-030 BGD page showed a Vietnam line)", () => {
    expect(publicCompareTitleV164("한-방글라데시 교역 · 총 교역액 — 수출액과 수입액의 합", names)).toBe("한국과의 교역 · 총 교역액 — 수출액과 수입액의 합");
    expect(publicCompareTitleV164("한-베트남 교역 · 총 교역액 — 수출액과 수입액의 합", names)).toBe("한국과의 교역 · 총 교역액 — 수출액과 수입액의 합");
  });
  it("reads the remaining English labels in Korean", () => {
    expect(publicCompareTitleV164("발전 설비용량 · Coal(계통연계) — 기술별 누적 설치 발전설비 용량", names)).toBe("발전 설비용량 · 석탄(계통연계) — 기술별 누적 설치 발전설비 용량");
    expect(publicCompareTitleV164("중간재 교역 · 수출 중 중간재 국내부가가치 비중 — Trade in Value Added: Domestic value added in gross exports of intermediate products", names)).toBe("중간재 교역 · 수출 중 중간재 국내부가가치 비중");
  });
});

describe("V164 axis symmetric around zero (SPEI scenarios)", () => {
  const guides = (bound: number) => [-bound, -bound / 2, 0, bound / 2, bound];

  it("guides read -2s, -s, 0, s, 2s on round steps, never -0.85 / 0.85", () => {
    expect(guides(symmetricBoundV164(0.85))).toEqual([-1, -0.5, 0, 0.5, 1]);
    expect(guides(symmetricBoundV164(1.7))).toEqual([-2, -1, 0, 1, 2]);
    expect(guides(symmetricBoundV164(2.2))).toEqual([-4, -2, 0, 2, 4]);
  });

  it("always covers the data", () => {
    for (const value of [0.3, 0.85, 1.2, 1.99, 2.4, 3.7, 12.5]) expect(symmetricBoundV164(value)).toBeGreaterThanOrEqual(value);
  });

  it("a flat series keeps the floor, and a missing maximum does not break the axis", () => {
    expect(symmetricBoundV164(0)).toBe(0.5);
    expect(symmetricBoundV164(Number.NaN)).toBe(0.5);
  });
});

describe("V164 value axis keeps enough guides (chart audit floor of five)", () => {
  const ranges: Array<[number, number]> = [
    [0, 3], [0.2, 3.1], [0, 1], [0.1, 0.4], [21.1, 21.3], [70, 94], [0, 4.2], [3.5, 9.7], [-3, 7], [-0.8, 0.9],
    [0, 12], [12, 40], [100, 480], [0, 2_500_000], [1.2e9, 4.4e9], [0, 495_200_301_543], [5, 5.0001],
  ];

  it.each([4, 5])("a free axis has five or more ticks, inside its domain, rising (intervals %i)", (intervals) => {
    for (const [low, high] of ranges) {
      const axis = valueAxisV164({ values: [low, (low + high) / 2, high], intervals });
      expect(axis.ticks.length).toBeGreaterThanOrEqual(5);
      expect(axis.ticks.length).toBeLessThanOrEqual(intervals + 6);
      expect(axis.ticks[0]).toBeGreaterThanOrEqual(axis.domain[0] - 1e-9);
      expect(axis.ticks[axis.ticks.length - 1]).toBeLessThanOrEqual(axis.domain[1] + 1e-9);
      expect(axis.ticks.every((tick, index) => index === 0 || tick > axis.ticks[index - 1])).toBe(true);
    }
  });

  it.each([4, 5])("a fixed domain has five or more ticks too (intervals %i)", (intervals) => {
    const domains: Array<[number, number]> = [[0, 100], [0, 1], [0, 4], [-2, 2], [0, 10], [1, 5], [0, 3], [0, 125]];
    for (const domain of domains) {
      expect(valueAxisV164({ values: [], fixedDomain: domain, intervals }).ticks.length).toBeGreaterThanOrEqual(5);
    }
  });

  it("a flat series still has five guides around its value", () => {
    const axis = valueAxisV164({ values: [21.12, 21.12, 21.12], intervals: 5 });
    expect(axis.ticks.length).toBeGreaterThanOrEqual(5);
  });
});

describe("V164-R3 count axes", () => {
  it("knows which units count things one by one", () => {
    for (const unit of ["건", "곳", "명", "개", "개소", " 건 "]) expect(isCountUnitV164(unit)).toBe(true);
    for (const unit of ["%", "GWh", "USD", "", "천명", "건/년", null, undefined]) expect(isCountUnitV164(unit as string)).toBe(false);
  });

  it("a whole-number step never goes below 1 and never lands on 2.5 below 10", () => {
    expect(niceStepV164(0.4, true)).toBe(1);
    expect(niceStepV164(1.2, true)).toBe(2);
    expect(niceStepV164(2.2, true)).toBe(5);
    expect(niceStepV164(3, true)).toBe(5);
    expect(niceStepV164(12, true)).toBe(20);
    expect(niceStepV164(22, true)).toBe(25);
    // without the flag the 0.5 / 2.5 steps stay
    expect(niceStepV164(0.4)).toBe(0.5);
    expect(niceStepV164(2.2)).toBe(2.5);
  });

  it.each([
    [[0, 1, 2, 3]],
    [[1, 2, 2, 3]],
    [[0, 1]],
    [[2, 2, 2]],
    [[0, 3, 4, 7, 9]],
    [[5, 12, 31]],
  ])("a count series %j is guided at whole numbers only (D-018/019/020/024)", (values) => {
    const axis = valueAxisV164({ values, unit: "건", intervals: 5 });
    expect(axis.ticks.every((tick) => Number.isInteger(tick))).toBe(true);
    expect(axis.ticks.length).toBeGreaterThanOrEqual(2);
    expect(axis.domain[0]).toBeLessThanOrEqual(Math.min(...values));
    expect(axis.domain[1]).toBeGreaterThanOrEqual(Math.max(...values));
    expect(formatAxisTicksV164(axis.ticks).every((label) => !label.includes("."))).toBe(true);
  });

  it("a measured value (not a count) keeps fractional guides", () => {
    const axis = valueAxisV164({ values: [0, 1], unit: "GWh", intervals: 5 });
    expect(axis.ticks.some((tick) => !Number.isInteger(tick))).toBe(true);
  });

  it("a count series with a fractional value is not forced onto whole numbers", () => {
    const axis = valueAxisV164({ values: [0.5, 1.5, 2], unit: "건", intervals: 5 });
    expect(axis.ticks.some((tick) => !Number.isInteger(tick))).toBe(true);
  });

  it("niceTicksV164 with integerOnly gives whole ticks for a 0-3 range", () => {
    const ticks = niceTicksV164(0, 3, 4, true);
    expect(ticks[0]).toBe(0);
    expect(ticks[ticks.length - 1]).toBeGreaterThanOrEqual(3);
    expect(ticks.every((tick) => Number.isInteger(tick))).toBe(true);
  });
});

describe("V164-3 year labels are years the data has", () => {
  it("does not label a round year that falls in a gap of sparse records", () => {
    const sparse = [1997, 2001, 2003, 2004, 2007, 2009, 2011, 2012, 2014, 2016, 2018, 2019, 2020, 2021, 2022, 2023];
    const ticks = niceXTicksV164(sparse, 6, 600);
    expect(ticks.every((year) => sparse.includes(year))).toBe(true);
    expect(ticks[0]).toBe(1997);
    expect(ticks[ticks.length - 1]).toBe(2023);
  });
});
