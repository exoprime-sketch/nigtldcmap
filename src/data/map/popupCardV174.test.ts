import { describe, expect, it } from "@jest/globals";
import {
  areaContextRowV174,
  factsFromLinesV174,
  featureKoreanDescriptionV174,
  koreanNamedV174,
  popupCardRowsV174,
  popupPeriodV174,
} from "./popupCardV174";

describe("Korean description of a feature (V174)", () => {
  it("builds a power plant from its place and fuel", () => {
    const facts = [
      { key: "fuel", label: "발전원", value: "수력" },
      { key: "location", label: "소재지", value: "하띤 (Hà Tĩnh) · 개편 후 34개 기준" },
    ];
    expect(featureKoreanDescriptionV174("A-023", facts)).toBe("하띤 수력발전소");
    expect(koreanNamedV174("Huong Son", featureKoreanDescriptionV174("A-023", facts))).toBe("하띤 수력발전소 (Huong Son)");
  });

  it("uses the layer's fixed kind and the stated place", () => {
    expect(featureKoreanDescriptionV174("B-008", [{ label: "소재", value: "남부 — 바리아붕따우" }])).toBe("바리아붕따우 해수면 관측소");
    expect(featureKoreanDescriptionV174("B-023", [{ label: "소재지", value: "치타공 (Chittagong)" }])).toBe("치타공 유량 관측지점");
  });

  it("joins a mineral list and adds the mine word", () => {
    expect(featureKoreanDescriptionV174("B-048", [{ label: "광종", value: "금 / 구리" }])).toBe("금·구리 광산");
  });

  it("translates an English kind and skips a kind with no Korean", () => {
    expect(featureKoreanDescriptionV174("E-005", [{ label: "유형", value: "NGO" }])).toBe("비정부기구");
    expect(featureKoreanDescriptionV174("A-025", [{ label: "유형", value: "Power (coal)" }])).toBe("CCS 시설·후보지");
    expect(featureKoreanDescriptionV174("X-000", [{ label: "유형", value: "Power (coal)" }])).toBe("");
  });

  it("ignores empty facts and falls back to the layer noun", () => {
    expect(featureKoreanDescriptionV174("C-025", [{ label: "유형", value: "미기재", missing: true }], "탄소크레딧 사업")).toBe("탄소크레딧 사업");
  });
});

describe("한글설명 (원어) (V174)", () => {
  it("keeps a name that already has Korean", () => {
    expect(koreanNamedV174("유니드비티플러스", "한국 기업")).toBe("유니드비티플러스");
  });

  it("flattens a bracket inside the original and shortens a long one", () => {
    expect(koreanNamedV174("Ullapara (Summit)", "라지샤히 가스발전소")).toBe("라지샤히 가스발전소 (Ullapara, Summit)");
    const long = "GS23255 VPA001: Sustainable Energy Project for Drying Agricultural Products in Thai Nguyen";
    const named = koreanNamedV174(long, "고효율 조리기구 사업");
    expect(named.startsWith("고효율 조리기구 사업 (GS23255")).toBe(true);
    expect(named.endsWith("…)")).toBe(true);
  });

  it("shows the original alone when no description could be built", () => {
    expect(koreanNamedV174("World Bank", "")).toBe("World Bank");
  });
});

describe("popup card rows (V174)", () => {
  it("names the row by what the second line is", () => {
    expect(areaContextRowV174({ contextLine: "성·시 34개 중 1위", groupConstant: false, categorical: false })?.label).toBe("순위");
    expect(areaContextRowV174({ contextLine: "남부전력총공사(EVNSPC) 공통값", groupConstant: true, categorical: false })?.label).toBe("적용 범위");
    expect(areaContextRowV174({ contextLine: "Aw (열대사바나)", groupConstant: false, categorical: true })?.label).toBe("분류");
    expect(areaContextRowV174({ contextLine: "", groupConstant: false, categorical: false })).toBeNull();
  });

  it("drops empty rows and keeps at most six", () => {
    const rows = popupCardRowsV174([
      { label: "a", value: "1" },
      null,
      { label: "b", value: "" },
      { label: "c", value: "미기재" },
      ...Array.from({ length: 8 }, (_, i) => ({ label: `r${i}`, value: String(i) })),
    ]);
    expect(rows).toHaveLength(6);
    expect(rows[0].label).toBe("a");
    expect(rows.map((row) => row.label)).not.toContain("c");
  });

  it("reads periods and fact lines", () => {
    expect(popupPeriodV174("2016년 기준")).toBe("2016년");
    expect(popupPeriodV174("기준 2017")).toBe("2017");
    expect(factsFromLinesV174(["기관 유형 다자개발은행", "도시 하노이 (Hanoi)", "사무소·프로그램 Hanoi"])).toEqual([
      { label: "기관 유형", value: "다자개발은행" },
      { label: "도시", value: "하노이 (Hanoi)" },
    ]);
  });
});
