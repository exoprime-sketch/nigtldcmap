import { describe, expect, it } from "@jest/globals";
import { getCardSpecForCountryV158 } from "./countrySpecV158";

describe("country card definitions (V164-3)", () => {
  it("does not show the default country's source wording on a Bangladesh card", () => {
    const d002 = getCardSpecForCountryV158("D-002", "BGD");
    expect(d002?.shortDefinitionCard).toBe("국가 전력 계획의 2030년 설비용량 목표를 기준연도 실적과 견줘 환산한 기술별 연평균 성장률");
    const d024 = getCardSpecForCountryV158("D-024", "BGD");
    expect(d024?.shortDefinitionCard).not.toMatch(/뉴에너지넥서스|RMIT/);
  });
  it("keeps the default country's reviewed definition", () => {
    expect(getCardSpecForCountryV158("D-024", "VNM")?.shortDefinitionCard).toMatch(/뉴에너지넥서스/);
  });
});
