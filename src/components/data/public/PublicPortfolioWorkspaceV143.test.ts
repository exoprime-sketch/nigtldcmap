import { describe, expect, it } from "@jest/globals";
import { readFileSync } from "fs";
import { resolve } from "path";
import type { VietnamEntityV124 } from "../../../data/vietnam/vietnamTypesV124";
import { EMPTY_PORTFOLIO_SELECTION_V143, portfolioSelectionModelV143 } from "./PublicPortfolioWorkspaceV143";
import { isPublicMapFactV143, publicMapFactSourcesV143, hasPublicMapFactValueV143 } from "../../../data/visualization/publicMapCopyV143";
import { countryPublicDirV158 } from "../../../data/countryContext";

const entities: VietnamEntityV124[] = JSON.parse(readFileSync(resolve(__dirname, `../../../../${countryPublicDirV158("VNM")}/downloads/d-026.json`), "utf8")).entities;
const props = { elementId: "D-026", entities, detailTemplate: "portfolio" };

describe("shared portfolio selection", () => {
  it("retains all 9 projects and separately keeps 5 product definitions", () => {
    const result = portfolioSelectionModelV143(props, EMPTY_PORTFOLIO_SELECTION_V143);
    expect(result.filtered).toHaveLength(9);
    expect(result.noteEntities).toHaveLength(5);
    expect(result.total).toBe(9);
    expect(result.years).toContain("1999");
    expect(result.years).toContain("2018");
  });
  it("uses the actual fiscal year, not the dataset stamp or approval date", () => {
    const result = portfolioSelectionModelV143(props, { ...EMPTY_PORTFOLIO_SELECTION_V143, year: "2013" });
    const source = entities.filter((entity) => entity.normalizedAttributes["회계연도_FY"] === "2013");
    expect(result.filtered.map((entity) => entity.recordId)).toEqual(source.map((entity) => entity.recordId));
    expect(result.filtered).toHaveLength(3);
  });
  it("combines year and category conditions without changing the source", () => {
    const result = portfolioSelectionModelV143(props, { ...EMPTY_PORTFOLIO_SELECTION_V143, year: "2016", category: "전력" });
    expect(result.filtered).toHaveLength(1);
    expect(result.filtered[0].normalizedAttributes.Project_ID).toBe("12869");
    expect(entities).toHaveLength(14);
  });
  it("applies a title query and returns a genuine empty selection", () => {
    expect(portfolioSelectionModelV143(props, { ...EMPTY_PORTFOLIO_SELECTION_V143, query: "Hoi Xuan" }).filtered).toHaveLength(1);
    expect(portfolioSelectionModelV143(props, { ...EMPTY_PORTFOLIO_SELECTION_V143, query: "존재하지 않는 검색어" }).filtered).toHaveLength(0);
  });
});

describe("public map copy", () => {
  it("aligns E-018 map facts with the reviewed detail columns", () => {
    const source = JSON.parse(readFileSync(resolve(__dirname, `../../../../${countryPublicDirV158("VNM")}/downloads/e-018.json`), "utf8")).entities[0].normalizedAttributes;
    const fact = (key: string) => publicMapFactSourcesV143("E-018", { key, sources: ["wrong"] });
    expect(source[fact("sector").sources[0]]).toBe("RE(C&I 옥상태양광)·LNG 터미널·그린수소");
    expect(source[fact("entryForm").sources[0]]).toContain("지분 M&A");
    expect(source[fact("establishedYear").sources[0]]).toBe("1999 설립 / 2020 진출");
  });
  it("omits missing boilerplate but preserves zero and a meaningful negative status", () => {
    [null, undefined, "", "-", "무(공개된 정보 없음)"].forEach((value) => expect(hasPublicMapFactValueV143(value)).toBe(false));
    [0, "0", "사무소 미설치", "미진출(확인)"].forEach((value) => expect(hasPublicMapFactValueV143(value)).toBe(true));
  });
  it("removes technical quality labels while retaining real values and sources", () => {
    ["위치 정밀도", "공간 정확도", "지도 표시 범위", "값 제공 여부", "정확도 한계"].forEach((label) => expect(isPublicMapFactV143(label)).toBe(false));
    ["발전원", "용량", "자료연도", "출처", "지역", "사업유형"].forEach((label) => expect(isPublicMapFactV143(label)).toBe(true));
  });
});
