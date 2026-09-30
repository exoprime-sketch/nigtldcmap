import { describe, expect, test } from "@jest/globals";
import { osmClassLabelV162, publicOsmIndicatorLabelV162 } from "./osmClassLabelsV162";

describe("A-027 OpenStreetMap class labels (V162)", () => {
  test("a class reads in Korean with the source value in brackets", () => {
    expect(osmClassLabelV162("narrow_gauge")).toBe("협궤 철도 (narrow_gauge)");
    expect(osmClassLabelV162("light_rail")).toBe("경전철 (light_rail)");
    expect(osmClassLabelV162("residential")).toBe("주거지역 도로 (residential)");
    expect(osmClassLabelV162("unknown_value")).toBe("unknown_value");
  });

  test("the indicator wording names the class, not the field", () => {
    expect(publicOsmIndicatorLabelV162("분류별 피처 수(miniature_railway) — fclass 분류값별 지물 건수")).toBe("분류별 지물 수 · 소형 관광 철도 (miniature_railway)");
    expect(publicOsmIndicatorLabelV162("철도 레이어")).toBe("철도 레이어");
    // the raw-data table joins the two dimension labels with " · "
    expect(publicOsmIndicatorLabelV162("분류별 피처 수(narrow_gauge) · fclass 분류값별 지물 건수")).toBe("분류별 지물 수 · 협궤 철도 (narrow_gauge)");
    expect(publicOsmIndicatorLabelV162("피처 수 · OSM 철도 레이어의 지물 건수")).toBe("지물 수 · OSM 철도 레이어의 지물 건수");
  });
});
