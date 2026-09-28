import { describe, expect, it } from "@jest/globals";
import { publicIndicatorContextV144, publicIndicatorSeriesV144, previousYearChangeV144, metadataOnlyBuildingsV144, publicPercentHeadlineV144 } from "./publicIndicatorCopyV144";
import type { SemanticObservationV125 } from "./semanticTypesV125";
import { readFileSync } from "fs";
import { resolve } from "path";
import { portfolioCategoryKeyLabelV142, publicPortfolioRecordLabelV138 } from "../../components/data/public/PublicPortfolioSummaryV132";
import { countryPublicDirV158 } from "../countryContext";

const row = (year: number, value: number, seriesKey = "ilo") => ({
  elementId: "A-006", recordId: `r-${year}`, indicatorId: "unemployment", countryIso3: "VNM", year, value,
  seriesKey, unit: "%", semanticMeasure: { key: "total", labelKo: "전체 실업률", unit: "%", unitFamily: "percent" },
  dimensionLabels: { category: "ILO 모델추정", detail: "경제활동인구 대비 실업자 비율(ILO 모형 보정 추정치)", year: String(year) },
  dimensions: {}, displayLabel: "전체 실업률 · ILO 모델추정 — 경제활동인구 대비 실업자 비율(ILO 모형 보정 추정치)",
} as unknown as SemanticObservationV125);

describe("reviewed public indicator copy", () => {
  it("distinguishes company origin, assistance requests and investment transactions", () => {
    expect(portfolioCategoryKeyLabelV142("D-012", "entryCountry")).toBe("기업 국적");
    expect(publicPortfolioRecordLabelV138("D-012")).toBe("진출 사례");
    expect(publicPortfolioRecordLabelV138("D-019")).toBe("기술지원 요청");
    expect(publicPortfolioRecordLabelV138("D-024")).toBe("투자 거래");
  });
  it("keeps source distinction without repeating the statistical definition", () => {
    expect(publicIndicatorContextV144("A-006", row(2025, 1.523).dimensionLabels)).toEqual(["ILO 추정치"]);
    expect(publicIndicatorSeriesV144(row(2025, 1.523))).toBe("전체 실업률 · ILO 추정치");
  });
  it("retains poverty threshold and price basis", () => {
    expect(publicIndicatorContextV144("A-004", { category: "국제빈곤선", detail: "1일 3.00달러(2021 PPP) 미만 인구 비율" }).join(" ")).toContain("2021년 PPP");
  });
  it("does not discard unknown regions, scenarios or long labels", () => {
    expect(publicIndicatorContextV144("B-021", { detail: "Central Highlands", detail_2: "SSP2" })).toHaveLength(2);
  });
  it("uses percentage POINTS from the same series and preserves exact inputs", () => {
    const now = row(2025, 1.523); const before = row(2024, 1.602);
    expect(previousYearChangeV144(now, [before])?.value).toBeCloseTo(-0.079);
    expect(previousYearChangeV144(now, [before])?.unit).toBe("%p");
    expect(now.value).toBe(1.523);
  });
  it("rejects a missing adjacent year, other source, duplicate or mixed unit", () => {
    const now = row(2025, 1.523);
    for (const previous of [[row(2023, 1.645)], [row(2024, 1.529, "national")], [row(2024, 1), row(2024, 2)], [{ ...row(2024, 1), unit: "명" }]]) {
      expect(previousYearChangeV144(now, previous)).toBeNull();
    }
  });
  it("rounds the headline without turning tiny nonzero shares into zero", () => {
    expect(publicPercentHeadlineV144(1.523)).toBe("1.52");
    expect(publicPercentHeadlineV144(0.00045)).toBe("0.00045");
    expect(publicPercentHeadlineV144(0)).toBe("0");
  });
  it("identifies the real A-026 metadata-only delivery, but never hides real counts", () => {
    const source = JSON.parse(readFileSync(resolve(__dirname, `../../../${countryPublicDirV158("VNM")}/downloads/a-026.json`), "utf8"));
    expect(metadataOnlyBuildingsV144(source.observations)).toBe(true);
    expect(metadataOnlyBuildingsV144([...source.observations, { indicatorId: "A-026_building_footprint_count", value: 0 }])).toBe(false);
  });
});
