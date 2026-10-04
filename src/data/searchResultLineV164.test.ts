import { describe, expect, it } from "@jest/globals";
import { isReadableMeasureLabelV164, readableMeasureLabelsV164, searchResultLineV164 } from "./searchResultLineV164";

describe("searchResultLineV164", () => {
  it("leaves out labels that name the build's own structure", () => {
    expect(isReadableMeasureLabelV164("태양광 자원(ADM1 단위 개체 목록) (기준연도 2018)")).toBe(false);
    expect(isReadableMeasureLabelV164("가뭄(관구×시나리오×연도 개체 목록)")).toBe(false);
    expect(isReadableMeasureLabelV164("월별 평년값(ADM1, GADM 4.1)")).toBe(false);
    expect(isReadableMeasureLabelV164("narrow_gauge")).toBe(false);
  });

  it("leaves out a label cut off inside its bracket", () => {
    expect(isReadableMeasureLabelV164("핵심광물 매장량 미수록(리튬 · 확인 · 2026년")).toBe(false);
    expect(isReadableMeasureLabelV164("핵심광물 매장량 미수록(리튬 · 확인 · 2026년)")).toBe(true);
  });

  it("keeps plain labels once each", () => {
    expect(readableMeasureLabelsV164(["CPI 점수", "CPI 점수", "CPI 순위", ""])).toEqual(["CPI 점수", "CPI 순위"]);
  });

  it("shows two readable labels, else the group name", () => {
    expect(searchResultLineV164(["CPI 점수", "CPI 순위", "CPI 표준오차"], "부패인식지수")).toBe("CPI 점수 · CPI 순위");
    expect(searchResultLineV164(["가뭄(관구×시나리오×연도 개체 목록)"], "기후 위험 지표")).toBe("기후 위험 지표");
    expect(searchResultLineV164([], "기후 위험 지표")).toBe("기후 위험 지표");
  });
});
