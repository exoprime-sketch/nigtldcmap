import { describe, expect, it } from "@jest/globals";
import { dataPeriodSpanV164, periodSpanLineTextV164, periodSpanTileTextV164, yearsInTextV164 } from "./dataPeriodV164";

type Obs = NonNullable<Parameters<typeof dataPeriodSpanV164>[0]["observations"]>[number];
type Ent = NonNullable<Parameters<typeof dataPeriodSpanV164>[0]["entities"]>[number];
type Ind = NonNullable<Parameters<typeof dataPeriodSpanV164>[0]["indicators"]>[number];

const obs = (value: unknown, year: number | null, period: string | null = null) => ({ value, year, period }) as unknown as Obs;
const ent = (attributes: Record<string, unknown>) => ({ normalizedAttributes: attributes }) as unknown as Ent;
const ind = (timeRange: string | null, referenceYear: string | number | null) => ({ timeRange, referenceYear }) as unknown as Ind;

describe("dataPeriodSpanV164: one period for the source line and the 자료기간 tile", () => {
  it("reads the years of the observations that carry a value", () => {
    const span = dataPeriodSpanV164({ observations: [obs(1, 2015), obs(2, 2026), obs(null, 1990), obs("", 1980)] });
    expect(span).toEqual({ first: 2015, last: 2026 });
    expect(periodSpanLineTextV164(span!)).toBe("2015~2026");
    expect(periodSpanTileTextV164(span!)).toBe("2015–2026년");
  });

  it("reads a period-only observation (an interval such as 2025-2030) when it has no year", () => {
    expect(dataPeriodSpanV164({ observations: [obs(10, null, "2025-2030"), obs(12, null, "2031-2035")] })).toEqual({ first: 2025, last: 2035 });
  });

  it("falls back to the entity rows' own year column (BGD B-006: observations are empty, the rows carry 1950-2100)", () => {
    const rows = [ent({ 연도: 1950 }), ent({ 연도: "2100" }), ent({ 연도: null })];
    // The indicators' reference years (2099, 2100) are the last slices, not the span of the rows.
    expect(dataPeriodSpanV164({ observations: [], entities: rows, indicators: [ind(null, "2100"), ind(null, "2099")] })).toEqual({ first: 1950, last: 2100 });
  });

  it("reads a numbered-slot year column and a fiscal-year column, never a project or target year", () => {
    expect(dataPeriodSpanV164({ entities: [ent({ 속성3_연도: 2020 }), ent({ 속성3_연도: 2030 })] })).toEqual({ first: 2020, last: 2030 });
    expect(dataPeriodSpanV164({ entities: [ent({ 회계연도: 1995 }), ent({ 회계연도: 2018 })] })).toEqual({ first: 1995, last: 2018 });
    expect(dataPeriodSpanV164({ entities: [ent({ 목표_목표연도_년: 2050 }), ent({ 사업기간: "1987-2032" })] })).toBeNull();
  });

  it("takes a period column only when it is a pure year range", () => {
    expect(dataPeriodSpanV164({ entities: [ent({ 기간_평년: "1995-2014" }), ent({ 기간_평년: "2080-2099" })] })).toEqual({ first: 1995, last: 2099 });
    expect(dataPeriodSpanV164({ entities: [ent({ 기간: "1 – 2 Months" }), ent({ 기간: "FY2019-20" })] })).toBeNull();
  });

  it("falls back to the indicators' time range, then to their reference year (a collection year is the last resort)", () => {
    // BGD B-048: the list is 1961-2016; 2026 is when it was collected.
    expect(dataPeriodSpanV164({ indicators: [ind("1961-2016", "2016")] })).toEqual({ first: 1961, last: 2016 });
    expect(dataPeriodSpanV164({ indicators: [ind(null, 2016), ind(null, "2026")] })).toEqual({ first: 2016, last: 2026 });
  });

  it("states nothing when no record states a year", () => {
    expect(dataPeriodSpanV164({ observations: [obs(1, null)], entities: [ent({ 이름: "A" })], indicators: [ind(null, null)] })).toBeNull();
    expect(dataPeriodSpanV164({})).toBeNull();
  });

  it("states one year as one year", () => {
    const span = dataPeriodSpanV164({ observations: [obs(1, 2016), obs(2, 2016)] })!;
    expect(periodSpanLineTextV164(span)).toBe("2016");
    expect(periodSpanTileTextV164(span)).toBe("2016년");
  });

  it("finds the years in a text", () => {
    expect(yearsInTextV164("2015~2026 (1999-2018)")).toEqual([2015, 2026, 1999, 2018]);
    expect(yearsInTextV164(null)).toEqual([]);
    expect(yearsInTextV164("MW 12345")).toEqual([]);
  });
});
