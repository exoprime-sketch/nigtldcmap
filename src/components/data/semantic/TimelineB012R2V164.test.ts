import { describe, expect, it } from "@jest/globals";
import type { VietnamEntityV124 } from "../../../data/vietnam/vietnamTypesV124";
import { publicRegionTextV162 } from "../../../data/geo/regionDisplayV162";
import { timelineEventPlaceV164, timelineOrderKeyV164, timelineTitleV164 } from "./SemanticContractRendererV125";

/** V164 R2: B-012's chronology - the events of one year in date order, the type in Korean, the place as the source's wording. */
const event = (attributes: Record<string, unknown>) =>
  ({ elementId: "B-012", entityType: "entity", countryIso3: "BGD", normalizedAttributes: attributes, rawAttributes: {} }) as unknown as VietnamEntityV124;

describe("timelineOrderKeyV164", () => {
  it("orders the events of one year by month and day, not by their place in the file", () => {
    const dates = ["1990-08", "1990-01", "1990-11", "1990-10-04", "1990-10-02", "1990"];
    const sorted = [...dates].sort((left, right) => timelineOrderKeyV164(left) - timelineOrderKeyV164(right));
    expect(sorted).toEqual(["1990", "1990-01", "1990-08", "1990-10-02", "1990-10-04", "1990-11"]);
  });

  it("reads the first date of a milestone text and puts a text with no year last", () => {
    expect(timelineOrderKeyV164("2022-12-14 서명 / 자원동원계획(RMP) 2023-11 승인")).toBe(20221214);
    expect(timelineOrderKeyV164("2019-2020")).toBe(20190000);
    expect(timelineOrderKeyV164("시점 미기재")).toBe(Number.MAX_SAFE_INTEGER);
  });

  it("a year of an earlier century does not sort after a later one", () => {
    expect(timelineOrderKeyV164("1904-11")).toBeLessThan(timelineOrderKeyV164("1909-10-15"));
    expect(timelineOrderKeyV164("1999-12")).toBeLessThan(timelineOrderKeyV164("2000-01"));
  });
});

describe("timelineTitleV164", () => {
  it("reads the Korean type first and keeps the source's English type after it", () => {
    expect(timelineTitleV164(event({ 재해유형: "폭풍·태풍" }), "Tropical cyclone")).toBe("폭풍·태풍 · Tropical cyclone");
    expect(timelineTitleV164(event({ 재해유형: "홍수" }), "Flood (General)")).toBe("홍수 · Flood (General)");
  });

  it("leaves a Korean title, a title equal to the type and a record with no type as they are", () => {
    expect(timelineTitleV164(event({ 재해유형: "홍수" }), "홍수")).toBe("홍수");
    expect(timelineTitleV164(event({ 재해유형: "홍수" }), "방글라데시 대홍수")).toBe("방글라데시 대홍수");
    expect(timelineTitleV164(event({}), "Tropical cyclone")).toBe("Tropical cyclone");
  });
});

describe("timelineEventPlaceV164", () => {
  const regionText = (text: string | null | undefined) => publicRegionTextV162(text, "B-012", "BGD");

  it("labels the place as the source's wording and reads a division the dictionary knows in Korean", () => {
    const record = event({ 발생지역_원문: "Chittagong" });
    expect(timelineEventPlaceV164(record, "Chittagong", regionText)).toMatch(/^발생 지역\(원문\): .*Chittagong/u);
    const listed = event({ 발생지역_원문: "Barisal, Chittagong, Khulna provinces" });
    expect(timelineEventPlaceV164(listed, "Barisal, Chittagong, Khulna provinces", regionText)).toContain("발생 지역(원문): ");
  });

  it("leaves a detail that is not the place column alone", () => {
    const record = event({ 발생지역_원문: "Chittagong" });
    expect(timelineEventPlaceV164(record, "사망 12명", regionText)).toBe("사망 12명");
    expect(timelineEventPlaceV164(event({}), "", regionText)).toBe("");
  });
});
