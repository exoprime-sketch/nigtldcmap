import { koreanCategoryV164, koreanTitleV164 } from "./publicCategoryLabelV164";

/** V164-3: the English classification values the delivery shipped, in Korean. */
describe("koreanCategoryV164", () => {
  it("translates a known classification value, whatever its case or spacing", () => {
    expect(koreanCategoryV164("Mitigation")).toBe("감축");
    expect(koreanCategoryV164("Adaptation")).toBe("적응");
    expect(koreanCategoryV164("General Untied")).toBe("일반 비구속");
    expect(koreanCategoryV164("General untied")).toBe("일반 비구속");
    expect(koreanCategoryV164("  Under   implementation ")).toBe("이행 중");
    expect(koreanCategoryV164("In force")).toBe("발효");
    expect(koreanCategoryV164("Signed (not in force)")).toBe("서명(미발효)");
    expect(koreanCategoryV164("Yes")).toBe("예");
    expect(koreanCategoryV164("No")).toBe("아니오");
    expect(koreanCategoryV164("Company")).toBe("기업");
    expect(koreanCategoryV164("Asia")).toBe("아시아");
    expect(koreanCategoryV164("Energy")).toBe("에너지");
    expect(koreanCategoryV164("Water and sewerage")).toBe("상하수도");
  });

  it("translates a list only when every part is known", () => {
    expect(koreanCategoryV164("Adaptation, Mitigation")).toBe("적응·감축");
    expect(koreanCategoryV164("PE;VC")).toBe("사모펀드(PE)·벤처캐피털(VC)");
    expect(koreanCategoryV164("Community based, Disaster risk reduction")).toBe("지역사회 기반·재난위험 경감");
    // one part is a name the dictionary does not know: the value stays whole
    expect(koreanCategoryV164("Adaptation, Wetlands of the Meghna")).toBe("Adaptation, Wetlands of the Meghna");
    // a full entry that itself contains a comma is matched before any split
    expect(koreanCategoryV164("Water Supply, Sewerage And Sanitation")).toBe("상수도·하수·위생");
  });

  it("translates a grade and keeps its range, in Korean words", () => {
    expect(koreanCategoryV164("Low (<10%)")).toBe("낮음 (<10%)");
    expect(koreanCategoryV164("Low - Medium (10-20%)")).toBe("낮음~중간 (10-20%)");
    expect(koreanCategoryV164("Medium - High (0.6-0.8)")).toBe("중간~높음 (0.6-0.8)");
    expect(koreanCategoryV164("Extremely High (>80%)")).toBe("매우 높음 (>80%)");
    expect(koreanCategoryV164("Extremely High (more than 2 in 1,000)")).toBe("매우 높음 (1,000분의 2 초과)");
    expect(koreanCategoryV164("High (3 in 10,000 to 2 in 1,000)")).toBe("높음 (10,000분의 3 ~ 1,000분의 2)");
    expect(koreanCategoryV164("No Data")).toBe("자료 없음");
    expect(koreanCategoryV164("No data")).toBe("자료 없음");
    expect(koreanCategoryV164("Medium - High (2-4 cm/y)")).toBe("중간~높음 (2-4 cm/y)");
  });

  it("leaves a proper name, a sentence and an unknown value as it was", () => {
    const untouched = [
      "Palli Karma-Sahayak Foundation (PKSF)",
      "Asian Development Bank (ADB)",
      "Mekong Earth Regeneration Fund (MERF)",
      "Adaptation Benefits Mechanism (ABM)",
      "Upscale, review, and evaluate.",
      "Energy Efficiency in Industrial Enterprises Project",
      "Decree 119/2025/ND-CP",
      "2025",
      "-12.5",
      "전국",
      "",
    ];
    for (const text of untouched) expect(koreanCategoryV164(text)).toBe(text);
  });

  it("is idempotent and keeps Korean text as it is", () => {
    for (const text of ["Mitigation", "Adaptation, Mitigation", "Low (<10%)", "In force"]) {
      const once = koreanCategoryV164(text);
      expect(koreanCategoryV164(once)).toBe(once);
    }
  });
});

describe("koreanTitleV164", () => {
  it("translates a known classification at the end of a card title", () => {
    expect(koreanTitleV164("PPI 부문별 사업 건수 — Energy")).toBe("PPI 부문별 사업 건수 — 에너지");
    expect(koreanTitleV164("민간참여 인프라 투자 실적 2019: Water and sewerage")).toBe("민간참여 인프라 투자 실적 2019: 상하수도");
    expect(koreanTitleV164("PPI 부문별 사업 건수 — Information and communication technology (ICT)")).toBe(
      "PPI 부문별 사업 건수 — 정보통신기술(ICT)"
    );
  });

  it("keeps a title whose ending is a name", () => {
    expect(koreanTitleV164("CDM→제6.4조 전환 활동 — Improved cookstove program in Bangladesh")).toBe(
      "CDM→제6.4조 전환 활동 — Improved cookstove program in Bangladesh"
    );
    expect(koreanTitleV164("NDC 3.0 감축수단 — AFOLU")).toBe("NDC 3.0 감축수단 — AFOLU");
    expect(koreanTitleV164("협의 기간")).toBe("협의 기간");
  });
});
