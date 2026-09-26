import { expect, test } from "@jest/globals";
import type { VietnamEntityV124, VietnamObservationV124 } from "../vietnam/vietnamTypesV124";
import { adaptS4V159 } from "./S4EntityV159";

function entity(overrides: Partial<VietnamEntityV124>): VietnamEntityV124 {
  return {
    recordId: "rec-1",
    elementId: "X-000",
    entityType: "entity",
    normalizedAttributes: {},
    rawAttributes: {},
    loadStatus: "published",
    warnings: [],
    rightsStatus: "ok",
    rightsNote: "",
    downloadEligible: true,
    mapEligible: true,
    provenance: {} as VietnamEntityV124["provenance"],
    ...overrides,
  };
}

test("D-020 style: Ref_No/대표금액+GCF_승인액 currency/이사회_승인일/38대_기후기술 map to recordKey/amount/date/techIds", () => {
  const row = adaptS4V159([
    entity({
      elementId: "D-020",
      indicatorId: "D-020_project_registry",
      name: "Scaling Up Energy Efficiency for Industrial Enterprises in Vietnam",
      normalizedAttributes: {
        Ref_No: "FP071",
        대표금액: 86300000,
        GCF_승인액: "86,300,000 (보증 75,000,000 + 무상 11,300,000) USD",
        상태: "Under implementation",
        이사회_승인일: "2018-03-01 (B.19)",
        비고: "산업 에너지효율 투자 보증 + 기술지원 + 전용 신용공여.",
        인가기관_AE: "International Bank for Reconstruction and Development",
        "38대_기후기술": "17 산업효율 기술",
        대상지역: "전국",
      },
    }),
  ])[0];
  expect(row.recordKey).toBe("FP071");
  expect(row.amount).toEqual({ value: 86300000, currency: "USD" });
  expect(row.date).toBe("2018-03-01");
  expect(row.status).toBe("Under implementation");
  expect(row.org).toBe("International Bank for Reconstruction and Development");
  expect(row.techIds).toEqual(["17"]);
  expect(row.description).toContain("에너지효율");
  // No structured "system:key" region tag exists in current deliveries (free
  // text like "전국" only) - stays empty rather than guessed.
  expect(row.regionTags).toEqual([]);
});

test("C-009 style: the numbered-slot 값/설명 pair becomes a date only when 설명 names one", () => {
  const rows = adaptS4V159([
    entity({
      elementId: "C-009",
      indicatorId: "C-009_effective_year_climatelaws",
      name: "Decree 06/2022/NĐ-CP",
      normalizedAttributes: {
        속성1_레코드명: "Decree 06/2022/NĐ-CP",
        속성3_값: "2022-01-07",
        속성4_시점: "2022",
        속성23_설명: "시행(발효)일",
        속성19_원문URL: "https://climate-laws.org/document/decree-no-06-2022-nd-cp",
      },
    }),
    entity({
      elementId: "C-009",
      indicatorId: "C-009_non_date_field",
      name: "Some other row",
      normalizedAttributes: {
        속성3_값: "not a date",
        속성23_설명: "분류",
      },
    }),
  ]);
  expect(rows[0].recordKey).toBe("Decree 06/2022/NĐ-CP");
  expect(rows[0].date).toBe("2022-01-07");
  expect(rows[0].links).toEqual(["https://climate-laws.org/document/decree-no-06-2022-nd-cp"]);
  expect(rows[1].date).toBeNull();
});

test("amount without a currency token anywhere on the record stays null (never assumed)", () => {
  const row = adaptS4V159([entity({ normalizedAttributes: { 대표금액: 1000 } })])[0];
  expect(row.amount).toBeNull();
});

test("legacy observation-row S4 delivery: one record per observation, recordKey = value", () => {
  const observations: VietnamObservationV124[] = [
    {
      recordId: "obs-1",
      elementId: "C-009",
      indicatorId: "C-009_law_number",
      countryIso3: "VNM",
      year: 2022,
      value: "Decree 06/2022/NĐ-CP",
      note: "베트남 기후법령",
      loadStatus: "published",
      warnings: [],
      rightsStatus: "ok",
      rightsNote: "",
      downloadEligible: true,
      provenance: {} as VietnamObservationV124["provenance"],
    },
  ];
  const rows = adaptS4V159([], observations);
  expect(rows).toHaveLength(1);
  expect(rows[0].recordKey).toBe("Decree 06/2022/NĐ-CP");
  expect(rows[0].year).toBe(2022);
  expect(rows[0].description).toBe("베트남 기후법령");
});
