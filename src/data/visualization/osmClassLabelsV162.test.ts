import { describe, expect, test } from "@jest/globals";
import { osmClassLabelV162, publicOsmIndicatorLabelV162 } from "./osmClassLabelsV162";

describe("A-027 OpenStreetMap class labels (V162)", () => {
  test("a class reads in Korean; the source key is never shown (V163)", () => {
    expect(osmClassLabelV162("narrow_gauge")).toBe("협궤 철도");
    expect(osmClassLabelV162("light_rail")).toBe("경전철");
    expect(osmClassLabelV162("residential")).toBe("주거지역 도로");
    expect(osmClassLabelV162("unknown_value")).toBe("unknown_value");
  });

  test("the indicator wording names the class, not the field", () => {
    expect(publicOsmIndicatorLabelV162("분류별 피처 수(miniature_railway) — fclass 분류값별 지물 건수")).toBe("분류별 지물 수 · 소형 관광 철도");
    expect(publicOsmIndicatorLabelV162("철도 레이어")).toBe("철도 레이어");
    // the raw-data table joins the two dimension labels with " · "
    expect(publicOsmIndicatorLabelV162("분류별 피처 수(narrow_gauge) · fclass 분류값별 지물 건수")).toBe("분류별 지물 수 · 협궤 철도");
    expect(publicOsmIndicatorLabelV162("피처 수 · OSM 철도 레이어의 지물 건수")).toBe("지물 수 · OSM 철도 레이어의 지물 건수");
  });
});

test("V163-T3: road classes and the highway column wording", () => {
  expect(publicOsmIndicatorLabelV162("분류별 피처 수(living_street) · highway 분류값별 지물 건수")).toBe("분류별 지물 수 · 생활도로");
  expect(osmClassLabelV162("motorway_link")).toBe("고속도로 연결로");
});
