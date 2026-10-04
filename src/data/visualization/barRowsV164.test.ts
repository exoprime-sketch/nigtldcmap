import { describe, expect, test } from "@jest/globals";
import {
  auxSeriesLabelV164,
  barAxisLabelV164,
  categoryLabelKeysV164,
  categoryLabelSourceV164,
  dominantSourceV164,
  gradeOrderV164,
  isAuxIndicatorV164,
  koreanLegendLabelV164,
  numberDuplicateLabelsV164,
  observationTimeTextV164,
  observationYearTextV164,
  splitScaleGroupsV164,
  withoutRawKeysV164,
} from "./barRowsV164";

const row = (dimensions: Record<string, string>, extra: Record<string, unknown> = {}) => ({ dimensions, dimensionLabels: dimensions, ...extra });

describe("which dimension names a bar (BGD A-024 / VNM B-009 / BGD B-013)", () => {
  test("a technology that is the same on every row does not name the bars", () => {
    const rows = [
      row({ detail: "OSM 전력선 구간 연장 합계", technology: "24" }),
      row({ detail: "OSM 전력선 레이어의 구간 건수", technology: "24" }),
      row({ detail: "방글라데시 전력선 구간 목록", technology: "24" }),
    ];
    const keys = categoryLabelKeysV164(rows);
    expect(keys.indexOf("detail")).toBeLessThan(keys.indexOf("technology"));
    expect(categoryLabelSourceV164(rows[0], keys)).toBe("detail");
  });

  test("a technology that differs between rows keeps its place", () => {
    const rows = [row({ technology: "01", detail: "a" }), row({ technology: "03", detail: "b" })];
    expect(categoryLabelSourceV164(rows[0], categoryLabelKeysV164(rows))).toBe("technology");
  });

  test("one row keeps the preferred order", () => {
    const rows = [row({ category: "분류값", detail: "세부" })];
    expect(categoryLabelSourceV164(rows[0], categoryLabelKeysV164(rows))).toBe("category");
  });

  test("a row without any listed dimension has no source", () => {
    expect(categoryLabelSourceV164(row({ year: "2020" }))).toBeNull();
  });

  test("the dominant source is the one naming most bars", () => {
    expect(dominantSourceV164(["category", "category", null])).toBe("category");
    expect(dominantSourceV164([null, null])).toBe("measure");
  });
});

describe("the bar axis (D-009 / E-009 / D-003)", () => {
  test("a time axis over bars that are not dated reads what the bars are", () => {
    expect(barAxisLabelV164("연도", "category", ["GDP 대비 기후지출 비중", "총 지출 규모", "성 단위 기후예산"])).toBe("분류");
    expect(barAxisLabelV164("연도", null, ["STEM 졸업 비중(남성)", "STEM 졸업 비중(여성)"])).toBe("지표");
  });

  test("a time axis over dated bars stands", () => {
    expect(barAxisLabelV164("월", "detail", ["1월 (1991-2020 평년)", "2월 (1991-2020 평년)"])).toBe("월");
    expect(barAxisLabelV164("발행연도", "detail", ["2019", "2020", "2021"])).toBe("발행연도");
  });

  test("a technology axis over reduction categories reads the category", () => {
    expect(barAxisLabelV164("발전기술", "category", ["BAU 배출량", "CDM 등록사업 수", "NDC 3.0 무조건부 소요 재원", "태양광 기술"])).toBe("분류");
  });

  test("a technology axis over technologies stands", () => {
    expect(barAxisLabelV164("발전기술", "category", ["바이오에너지 기술 (Biomass)", "수력 기술", "풍력 기술 (Wind)"])).toBe("발전기술");
  });

  test("another contract axis, even a generic one, stands", () => {
    expect(barAxisLabelV164("비교 항목", "category", ["평균 건물바닥면적"])).toBe("비교 항목");
    expect(barAxisLabelV164("재해 유형", "detail", ["홍수", "사이클론"])).toBe("재해 유형");
  });

  test("without a contract the axis is what the bars are named after", () => {
    expect(barAxisLabelV164(null, "detail", ["a"])).toBe("세부 분류");
    expect(barAxisLabelV164("", "sex", ["a"])).toBe("성별");
    expect(barAxisLabelV164(undefined, null, ["a"])).toBe("지표");
    // A key with no public name leaves the generic axis rather than a made-up one.
    expect(barAxisLabelV164(undefined, "detail_2", ["a"])).toBe("비교 항목");
  });
});

describe("bars of one unit on separate scales (A-026)", () => {
  const item = (label: string, value: number) => ({ label, value });
  const labelOf = (entry: { label: string }) => entry.label;
  const valueOf = (entry: { value: number }) => entry.value;

  test("a mean and a total that are 100x apart are split", () => {
    const items = [item("평균 건물바닥면적", 94.6), item("총 건물바닥면적", 6.1e9), item("평균 바닥면적", 88), item("총 바닥면적", 5.2e9)];
    const groups = splitScaleGroupsV164(items, labelOf, valueOf);
    expect(groups.map((group) => group.kind)).toEqual(["average", "total"]);
    expect(groups[0].items.map(labelOf)).toEqual(["평균 건물바닥면적", "평균 바닥면적"]);
    expect(groups[1].items.map(labelOf)).toEqual(["총 건물바닥면적", "총 바닥면적"]);
  });

  test("a mean and a total of the same size stay together", () => {
    const items = [item("평균 면적", 10), item("총 면적", 50)];
    expect(splitScaleGroupsV164(items, labelOf, valueOf)).toHaveLength(1);
  });

  test("labels with no average-and-total pair are never split", () => {
    const items = [item("성장률", 3), item("비중", 5000)];
    expect(splitScaleGroupsV164(items, labelOf, valueOf)).toEqual([{ kind: "all", items }]);
  });
});

describe("the period of a climatology (B-001)", () => {
  test("the label's span replaces the first year", () => {
    const monthly = row({ detail: "4월 (1991-2020 평년)" }, { year: 1991, period: null, displayLabel: "월 평년강수 — 4월 (1991-2020 평년)" });
    expect(observationTimeTextV164(monthly)).toBe("1991–2020 평년");
    expect(observationYearTextV164(monthly)).toBe("1991–2020 평년");
  });

  test("the measure's label can carry the span", () => {
    const annual = { year: 1991, semanticMeasure: { labelKo: "연 평년강수 (1991-2020 평년)" } };
    expect(observationTimeTextV164(annual)).toBe("1991–2020 평년");
  });

  test("a plain year stays a year", () => {
    expect(observationTimeTextV164({ year: 2023 })).toBe("2023");
    expect(observationYearTextV164({ year: 2023 })).toBe("2023년");
  });

  test("a plan period without the word 평년 is a period, not a climatology", () => {
    expect(observationTimeTextV164({ year: 2025, period: "2025-2030" })).toBe("2025–2030");
    expect(observationYearTextV164({ year: 2025, period: "2025-2030" })).toBe("2025–2030년");
  });

  test("a row without a year or period has no time", () => {
    expect(observationTimeTextV164({})).toBe("");
  });
});

describe("legend text", () => {
  test("a delivery key is cut and the readable label stays (BGD D-006, E-012)", () => {
    expect(withoutRawKeysV164("기후 관련 조세 수입 · D006_carbon_tax_revenue_projection_usd10_share_gdp · carbon_tax_revenue_projection_usd10_share_gdp")).toBe("기후 관련 조세 수입");
    expect(withoutRawKeysV164("직군별 종사자 수 · 기타·미정의(군인) · 전체 · ILOSTAT · EMP_TEMP_SEX_OCU_NB_A · occupation_employment_armed_total")).toBe(
      "직군별 종사자 수 · 기타·미정의(군인) · 전체 · ILOSTAT"
    );
  });

  test("a label with no key is returned as it was", () => {
    expect(withoutRawKeysV164("평균 월임금 · USD · ILOSTAT")).toBe("평균 월임금 · USD · ILOSTAT");
    expect(withoutRawKeysV164("first_ndc")).toBe("first_ndc");
  });

  test("a label that is only keys leaves nothing", () => {
    expect(withoutRawKeysV164("D006_carbon_tax_revenue · carbon_tax_revenue_x")).toBe("");
  });

  test("known English classifications read in Korean, proper names stay", () => {
    expect(koreanLegendLabelV164("Mitigation · Under implementation")).toBe("감축 · 이행 중");
    expect(koreanLegendLabelV164("Green Climate Fund · Mitigation")).toBe("Green Climate Fund · 감축");
    expect(koreanLegendLabelV164("수출액 — Adaptation")).toBe("수출액 — 적응");
  });

  test("a known name before a bracket is translated and the bracket kept", () => {
    expect(koreanLegendLabelV164("Mitigation [건]")).toBe("감축 [건]");
    expect(koreanLegendLabelV164("Energy (2023)")).toBe("에너지 (2023)");
  });

  test("an unknown value is never touched", () => {
    // "Taxes on Resources" joined the dictionary (V164-3 main); an unlisted name stays.
    expect(koreanLegendLabelV164("Taxes on Transport Services")).toBe("Taxes on Transport Services");
    expect(koreanLegendLabelV164("Taxes on Resources")).toBe("자원 관련 세");
  });

  test("equal labels are numbered, distinct ones are not", () => {
    expect(numberDuplicateLabelsV164(["a", "b", "a"])).toEqual(["a · 계열 1", "b", "a · 계열 2"]);
    expect(numberDuplicateLabelsV164(["a", "b"])).toEqual(["a", "b"]);
  });
});

describe("auxiliary series (A-030)", () => {
  test("the indicator id marks the auxiliary source", () => {
    expect(isAuxIndicatorV164("A-030_aux_kita_trade_total")).toBe(true);
    expect(isAuxIndicatorV164("A-030_trade_total")).toBe(false);
    expect(isAuxIndicatorV164(null)).toBe(false);
  });

  test("the legend says it is auxiliary once", () => {
    expect(auxSeriesLabelV164("[보조] 한-베트남 교역 · 총 교역액")).toBe("한-베트남 교역 · 총 교역액 (보조 자료)");
    expect(auxSeriesLabelV164("총 교역액")).toBe("총 교역액 (보조 자료)");
    expect(auxSeriesLabelV164("보조 · 총 교역액")).toBe("보조 · 총 교역액");
  });
});

describe("the grade table order (B-017)", () => {
  test("grades run low to extremely high, the arid class and no data last", () => {
    const delivered = ["Low - Medium (10-20%)", "No Data", "Extremely High (>80%)", "Low (<10%)", "Arid and Low Water Use", "High (40-80%)", "Medium - High (20-40%)", "Medium (20-40%)"];
    expect([...delivered].sort((a, b) => gradeOrderV164(a) - gradeOrderV164(b))).toEqual([
      "Low (<10%)",
      "Low - Medium (10-20%)",
      "Medium (20-40%)",
      "Medium - High (20-40%)",
      "High (40-80%)",
      "Extremely High (>80%)",
      "Arid and Low Water Use",
      "No Data",
    ]);
  });

  test("an unknown grade sorts after the known ones", () => {
    expect(gradeOrderV164("Something else")).toBe(99);
  });
});

describe("V164-3 lone bar and voltage axis (BGD A-024)", () => {
  test("a single bar is not named after its indicator's technology tag", () => {
    const keys = categoryLabelKeysV164([{ dimensions: { technology: "24" }, dimensionLabels: { technology: "24 기타 온실가스 처리 및 대체 기술" } }]);
    expect(keys).not.toContain("technology");
  });
  test("a voltage axis over bars that name no voltage reads what the bars are", () => {
    expect(barAxisLabelV164("전압 등급", "measure", ["송전 선로 구간 수"])).toBe("지표");
    expect(barAxisLabelV164("전압 등급", "category", ["500 kV", "220 kV"])).toBe("전압 등급");
  });
});
