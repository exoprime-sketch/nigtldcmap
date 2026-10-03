import { describe, expect, it } from "@jest/globals";
import { formatAxisTicksV164, formatAxisValueV164, niceTicksV164 } from "./axisTicksV164";
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

describe("V164 compare title", () => {
  const names = ["방글라데시", "베트남"];
  it("names the measure, not one of the compared countries", () => {
    expect(publicCompareTitleV164("CPI 점수 · 방글라데시 — 국제투명성기구 부패인식지수 점수", names)).toBe("CPI 점수 — 국제투명성기구 부패인식지수 점수");
    expect(publicCompareTitleV164("WGI 부패 통제(Estimate) · 베트남", names)).toBe("WGI 부패 통제(Estimate)");
    expect(publicCompareTitleV164("개도국 내 각국별 ODA 규모 · Official donors — 대방글라데시 ODA 총지출액", names)).toBe("개도국 내 각국별 ODA 규모 · 공적 공여자 전체 — ODA 총지출액");
  });
  it("reads the remaining English labels in Korean", () => {
    expect(publicCompareTitleV164("발전 설비용량 · Coal(계통연계) — 기술별 누적 설치 발전설비 용량", names)).toBe("발전 설비용량 · 석탄(계통연계) — 기술별 누적 설치 발전설비 용량");
    expect(publicCompareTitleV164("중간재 교역 · 수출 중 중간재 국내부가가치 비중 — Trade in Value Added: Domestic value added in gross exports of intermediate products", names)).toBe("중간재 교역 · 수출 중 중간재 국내부가가치 비중");
  });
});
