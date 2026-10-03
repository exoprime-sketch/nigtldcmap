import { describe, expect, test } from "@jest/globals";

import type { VietnamObservationV124 } from "../vietnam/vietnamTypesV124";
import type { IndicatorSemanticV125 } from "./semanticTypesV125";
import { buildSemanticObservationsV125 } from "./semanticObservationBuilderV125";

function observation(overrides: Partial<VietnamObservationV124> & { recordId: string }): VietnamObservationV124 {
  return {
    elementId: "E-012",
    indicatorId: "E-012_avg_monthly_wage_lcu",
    countryIso3: "BGD",
    year: 2024,
    period: null,
    value: 12345,
    rawValue: null,
    unit: "BDT",
    missingReasonCode: null,
    note: null,
    loadStatus: "published",
    warnings: [],
    rightsStatus: "public-release-approved",
    rightsNote: "",
    downloadEligible: true,
    provenance: {
      sourcePackage: "vietnam-data.zip",
      sourceFileOriginal: "E-012_test.xlsx",
      sourceFileDecoded: "E-012_test.xlsx",
      sourceSheet: "2_meta_info",
      sourceRow: 1,
      elementId: "E-012",
    },
    ...overrides,
  };
}

function indicatorSemantic(overrides: Partial<IndicatorSemanticV125> & { indicatorId: string }): IndicatorSemanticV125 {
  return {
    measure: {
      key: "average_monthly_wage",
      labelKo: "평균 월임금",
      unit: "BDT",
      unitFamily: "currency-per-period",
    },
    dimensions: { currency: "VND", source: "ilo" },
    dimensionLabels: { currency: "VND", source: "ILOSTAT" },
    displayLabel: "평균 월임금 · VND · ILOSTAT",
    seriesKey: "average_monthly_wage|BDT|currency=VND|source=ilo",
    axisGroupKey: "average_monthly_wage|BDT",
    sourceLabel: "평균 월임금 · VND · ILOSTAT",
    inferenceMethod: "explicit-override",
    ...overrides,
  };
}

describe("V163 (3e): a currency dimension the indicator grammar got wrong is corrected to the record's own unit", () => {
  test("BDT observation with a 'VND' currency dimension is corrected, dimension/label/displayLabel alike", () => {
    const [row] = buildSemanticObservationsV125(
      [observation({ recordId: "BGD-E012-1" })],
      [indicatorSemantic({ indicatorId: "E-012_avg_monthly_wage_lcu" })]
    );
    expect(row.dimensions.currency).toBe("BDT");
    expect(row.dimensionLabels.currency).toBe("BDT");
    expect(row.displayLabel).toBe("평균 월임금 · BDT · ILOSTAT");
  });

  test("a VND observation with a 'VND' currency dimension is left untouched (Viet Nam, unchanged)", () => {
    const [row] = buildSemanticObservationsV125(
      [observation({ recordId: "VNM-E012-1", countryIso3: "VNM", unit: "VND" })],
      [indicatorSemantic({ indicatorId: "E-012_avg_monthly_wage_lcu" })]
    );
    expect(row.dimensions.currency).toBe("VND");
    expect(row.dimensionLabels.currency).toBe("VND");
    expect(row.displayLabel).toBe("평균 월임금 · VND · ILOSTAT");
  });

  test("a USD series (already matching) is left untouched", () => {
    const [row] = buildSemanticObservationsV125(
      [observation({ recordId: "BGD-E012-2", indicatorId: "E-012_avg_monthly_wage_usd", unit: "USD" })],
      [
        indicatorSemantic({
          indicatorId: "E-012_avg_monthly_wage_usd",
          dimensions: { currency: "USD", source: "ilo" },
          dimensionLabels: { currency: "USD", source: "ILOSTAT" },
          displayLabel: "평균 월임금 · USD · ILOSTAT",
        }),
      ]
    );
    expect(row.dimensions.currency).toBe("USD");
    expect(row.displayLabel).toBe("평균 월임금 · USD · ILOSTAT");
  });

  test("a non-currency measure with no currency dimension is unaffected", () => {
    const [row] = buildSemanticObservationsV125(
      [observation({ recordId: "BGD-E012-3", indicatorId: "E-012_employed_persons", unit: "천명" })],
      [
        indicatorSemantic({
          indicatorId: "E-012_employed_persons",
          measure: { key: "employed_persons", labelKo: "총 취업자 수", unit: "천명", unitFamily: "count" },
          dimensions: { source: "ilo" },
          dimensionLabels: { source: "ILOSTAT" },
          displayLabel: "총 취업자 수 · ILOSTAT",
        }),
      ]
    );
    expect(row.dimensions.currency).toBeUndefined();
    expect(row.displayLabel).toBe("총 취업자 수 · ILOSTAT");
  });
});
