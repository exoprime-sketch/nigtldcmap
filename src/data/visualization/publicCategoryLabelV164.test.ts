import { describe, expect, it } from "@jest/globals";
import {
  categoryVariantKeyV164,
  gradeRankV164,
  investmentRoundLabelV164,
  koreanCategoryV164,
  koreanLabeledValuesV164,
  koreanListV164,
  koreanTitleV164,
  nationalityLabelV164,
  restoredApostropheV164,
} from "./publicCategoryLabelV164";

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

describe("koreanListV164", () => {
  it("reads each known name of a list and leaves an unknown one as delivered", () => {
    expect(koreanListV164("Bangladesh, People's Republic of China, Mongolia")).toBe("방글라데시·중국·몽골");
    expect(koreanListV164("Japan, Taipei,China, Viet Nam")).toBe("일본·Taipei,China·베트남");
  });

  it("keeps a name that holds a comma as one name", () => {
    expect(koreanListV164("Australia, Hong Kong, China, Japan")).toBe("호주·홍콩(중국)·일본");
    expect(koreanCategoryV164("Japan, Hong Kong, China")).toBe("일본·홍콩(중국)");
  });

  it("returns a list with no known name, and a value that is not English, as it was", () => {
    expect(koreanListV164("Acme Ltd, Foo Corp")).toBe("Acme Ltd, Foo Corp");
    expect(koreanListV164("방글라데시, 부탄")).toBe("방글라데시, 부탄");
  });
});

describe("koreanLabeledValuesV164", () => {
  const row = "SDG1 · 세부목표 1.2 · 부문: Energy Efficiency · 기후대응: Adaptation · 상태: Future · NDC 원문: Viet Nam has determined that climate change adaptation must be carried out in a focussed manner.";

  it("reads the known values of a labelled description and keeps its figures and its source sentence", () => {
    const text = koreanLabeledValuesV164(row);
    expect(text).toBe("SDG1 · 세부목표 1.2 · 부문: 에너지 효율 · 기후대응: 적응 · 상태: 향후 계획 · NDC 원문: Viet Nam has determined that climate change adaptation must be carried out in a focussed manner.");
    for (const fact of ["SDG1", "세부목표 1.2", "NDC 원문: Viet Nam has determined that climate change adaptation must be carried out in a focussed manner."]) expect(text).toContain(fact);
  });

  it("reads a document type that is a known value and leaves a part that is not one", () => {
    expect(koreanLabeledValuesV164("부문: Forest and land use · 정보유형: Needs & Gaps · 비고: Pilot phase")).toBe("부문: 산림·토지이용 · 정보유형: 필요·격차 · 비고: Pilot phase");
  });

  it("does not translate a name, a sentence that only begins with a known word, or a value that is not whole", () => {
    expect(koreanLabeledValuesV164("원천: Green Climate Fund · 대상: Water supply upgrade programme")).toBe("원천: Green Climate Fund · 대상: Water supply upgrade programme");
    expect(koreanLabeledValuesV164("상태: Future plans of the ministry")).toBe("상태: Future plans of the ministry");
  });

  it("returns text with no label, and an empty value, as it was", () => {
    expect(koreanLabeledValuesV164("Adaptation")).toBe("Adaptation");
    expect(koreanLabeledValuesV164("")).toBe("");
    expect(koreanLabeledValuesV164("2030년까지 감축: 21.7%")).toBe("2030년까지 감축: 21.7%");
  });
});

describe("koreanCategoryV164 (finance portfolios)", () => {
  it("reads the sector and status names of the finance registers", () => {
    expect(koreanCategoryV164("Banking")).toBe("은행업");
    expect(koreanCategoryV164("Climate Change, Biodiversity, Land Degradation")).toBe("기후변화·생물다양성·토지 황폐화");
    expect(koreanCategoryV164("Environmental policy and administrative management")).toBe("환경정책 및 행정관리");
    expect(koreanCategoryV164("Concept Approved")).toBe("개념 승인");
    expect(koreanCategoryV164("Pipeline/Identification")).toBe("준비·발굴 단계");
  });

  it("leaves an institution and a programme as delivered", () => {
    for (const text of ["International Organisation for Migration", "IDA", "Energy/Unlisted sector/Roads"]) {
      expect(koreanCategoryV164(text)).toBe(text);
    }
  });
});

describe("gradeRankV164", () => {
  it("orders the water-risk grades from low to extremely high", () => {
    const grades = ["Extremely High (>80%)", "Low (<10%)", "Medium - High (20-40%)", "Low - Medium (10-20%)", "High (40-80%)"];
    expect([...grades].sort((left, right) => (gradeRankV164(left) ?? 99) - (gradeRankV164(right) ?? 99))).toEqual([
      "Low (<10%)",
      "Low - Medium (10-20%)",
      "Medium - High (20-40%)",
      "High (40-80%)",
      "Extremely High (>80%)",
    ]);
  });

  it("has no rank for a value that is not a grade", () => {
    expect(gradeRankV164("No Data")).toBeNull();
    expect(gradeRankV164("낮음 (<10%)")).toBeNull();
    expect(gradeRankV164("")).toBeNull();
  });
});

describe("koreanCategoryV164 additions (V164-3 main)", () => {
  it("reads the B-009 and D-006 classifications in Korean", () => {
    expect(koreanCategoryV164("Scape Physical Risk")).toBe("경관 단위 물리적 위험");
    expect(koreanCategoryV164("scape reputational risk")).toBe("경관 단위 평판 위험");
    expect(koreanCategoryV164("Taxes on Pollution")).toBe("오염 관련 세");
    expect(koreanCategoryV164("Arid and Low Water Use")).toBe("건조·물 사용 적음");
  });
});

describe("koreanCategoryV164 R2 additions", () => {
  it("keeps two donor groups apart so a chart never numbers them as 계열 1 and 2", () => {
    expect(koreanCategoryV164("DAC Members")).toBe("DAC 회원국");
    expect(koreanCategoryV164("DAC countries")).toBe("DAC 국가");
    expect(koreanCategoryV164("DAC Members")).not.toBe(koreanCategoryV164("DAC countries"));
    expect(koreanCategoryV164("EU Institutions")).toBe("EU 기구");
  });

  it("reads the D-018 to D-026 statuses and sectors", () => {
    expect(koreanCategoryV164("Concept Proposed")).toBe("개념 제안");
    expect(koreanCategoryV164("Proposal Approved")).toBe("제안서 승인");
    expect(koreanCategoryV164("Water management")).toBe("물 관리");
    expect(koreanCategoryV164("Hydro, Small (<50MW)")).toBe("소수력(50MW 미만)");
    expect(koreanCategoryV164("Gold Standard Certified Design")).toBe("Gold Standard 설계 인증");
    expect(koreanCategoryV164("Under validation")).toBe("타당성 검토 중");
    expect(koreanCategoryV164("Operational Focal Point")).toBe("실무 연락관(Operational Focal Point)");
  });

  it("reads a sector path when every segment is known, once per repeated segment", () => {
    expect(koreanCategoryV164("Energy/Electricity/Electricity generation")).toBe("에너지 › 전력 › 발전");
    // an empty segment ("Disposal/") is dropped
    expect(koreanCategoryV164("Transport/Roads/Highway/")).toBe("교통 › 도로 › 고속도로");
    expect(koreanCategoryV164("Energy/Unlisted sector/Roads")).toBe("Energy/Unlisted sector/Roads");
    expect(koreanCategoryV164("https://example.org/energy/electricity")).toBe("https://example.org/energy/electricity");
  });

  it("reads a known head followed by words the delivery already wrote in Korean", () => {
    expect(koreanCategoryV164("Series B(신규 라운드)")).toBe("시리즈 B(신규 라운드)");
    expect(koreanCategoryV164("Pillar 1 Institutions 순위")).toBe("부문 1 제도 순위");
    expect(koreanCategoryV164("Completed (완료 2021-05)")).toBe("완료 (2021-05)");
    expect(koreanCategoryV164("Series B")).toBe("시리즈 B");
  });

  it("keeps a comma-holding name whole inside a list", () => {
    expect(koreanCategoryV164("Solar, PV; Wind")).toBe("태양광(PV)·풍력");
  });
});

describe("category variants and company labels (R2)", () => {
  it("compares two spellings of one classification as the same", () => {
    expect(categoryVariantKeyV164("GOLD_STANDARD_CERTIFIED_DESIGN")).toBe(categoryVariantKeyV164("Gold Standard  Certified Design"));
    expect(categoryVariantKeyV164("LISTED")).toBe(categoryVariantKeyV164("Listed"));
    expect(categoryVariantKeyV164("Listed")).not.toBe(categoryVariantKeyV164("Registered"));
  });

  it("reads a nationality without its ownership share, one name per country", () => {
    expect(nationalityLabelV164("Vietnam(100%)")).toBe("베트남");
    expect(nationalityLabelV164("Thailand(90%); Vietnam(10%)")).toBe("태국·베트남");
    expect(nationalityLabelV164("태국")).toBe("태국");
    expect(nationalityLabelV164("Denmark; Vietnam")).toBe("덴마크·베트남");
    expect(nationalityLabelV164("Vietnam[추정]")).toBe("베트남 (추정)");
    expect(nationalityLabelV164("Atlantis(100%)")).toBe("Atlantis");
    expect(nationalityLabelV164("")).toBe("");
  });

  it("says a round once whether or not the delivery marks it as a new round", () => {
    expect(investmentRoundLabelV164("Series B(신규 라운드)")).toBe("Series B");
    expect(investmentRoundLabelV164("Series B")).toBe("Series B");
    expect(investmentRoundLabelV164("Seed (신규 라운드)")).toBe("Seed");
  });
});

describe("TNA barrier categories and policy instrument groups (R2, C-005/C-009)", () => {
  it("reads the several wordings of one barrier category as one Korean name", () => {
    for (const english of ["Technical barriers", "Technical barrier", "Technical", "Technology barriers", "Technological Barriers"]) {
      expect(koreanCategoryV164(english)).toBe("기술적 장벽");
    }
    for (const english of ["Social and economic barriers", "Social-economic barriers", "Socio-economic"]) {
      expect(koreanCategoryV164(english)).toBe("사회경제적 장벽");
    }
    for (const english of ["Market linkage", "Market chain", "Market chains"]) expect(koreanCategoryV164(english)).toBe("시장 연계");
    expect(koreanCategoryV164("The support services")).toBe(koreanCategoryV164("The supporting services"));
    expect(koreanCategoryV164("Support actions")).toBe("지원 조치");
  });

  it("reads the policy instrument groups", () => {
    expect(koreanCategoryV164("Regulation")).toBe("규제");
    expect(koreanCategoryV164("Governance")).toBe("거버넌스");
    expect(koreanCategoryV164("Direct Investment")).toBe("직접 투자");
  });

  it("leaves a barrier the dictionary does not know as delivered", () => {
    expect(koreanCategoryV164("Lack of a technology transfer network")).toBe("Lack of a technology transfer network");
  });
});

describe("restoredApostropheV164", () => {
  it("writes the possessive back into a slugged place name", () => {
    expect(restoredApostropheV164("Cox s Bazar")).toBe("Cox’s Bazar");
    expect(restoredApostropheV164("Bandarban, Cox s Bazar")).toBe("Bandarban, Cox’s Bazar");
    expect(restoredApostropheV164("GVI 지수 — 지역(23구역) — Bandarban, Cox s Bazar")).toBe("GVI 지수 — 지역(23구역) — Bandarban, Cox’s Bazar");
  });

  it("leaves a name that already has it and any other text", () => {
    expect(restoredApostropheV164("Cox’s Bazar")).toBe("Cox’s Bazar");
    expect(restoredApostropheV164("Cox's Bazar")).toBe("Cox's Bazar");
    expect(restoredApostropheV164("Dar es Salaam")).toBe("Dar es Salaam");
    expect(restoredApostropheV164("Chittagong")).toBe("Chittagong");
    expect(restoredApostropheV164("")).toBe("");
  });
});
