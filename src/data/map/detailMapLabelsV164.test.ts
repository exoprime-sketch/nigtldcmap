import { describe, expect, test } from "@jest/globals";

import {
  NO_REFERENCE_YEAR_LAYERS_V164,
  lineCategoryCountsV164,
  lineFeatureFallbackLabelV164,
  lineMapKindV164,
  lineMapTitleV164,
  lineMatchesVariableV164,
  pointPeriodLabelV164,
  recordYearSpanV164,
  recordYearV164,
  regionCoverageCaptionV164,
  usesRecordYearSpanV164,
} from "./detailMapLabelsV164";

const segment = (properties: Record<string, unknown>) => ({ properties });

describe("line layers: voltage network or route network", () => {
  test("a layer whose segments carry a voltage is a voltage network titled as a transmission route", () => {
    const kind = lineMapKindV164([segment({ voltageKv: 220 }), segment({ voltageKv: 110 })]);
    expect(kind).toBe("voltage");
    expect(lineMapTitleV164(kind)).toBe("송전선 경로");
  });

  test("roads and railway (A-027) have no voltage, so they are not titled as transmission lines", () => {
    const kind = lineMapKindV164([segment({ class: "철도" }), segment({ class: "고속도로", voltageKv: null })]);
    expect(kind).toBe("route");
    expect(lineMapTitleV164(kind)).toBe("노선 위치");
    expect(lineMapTitleV164(kind)).not.toContain("송전");
  });

  test("a voltage of 0 or a text that is not a number is no voltage", () => {
    expect(lineMapKindV164([segment({ voltage: 0 }), segment({ voltage: "n/a" })])).toBe("route");
    expect(lineMapKindV164([])).toBe("route");
  });

  test("the variable filter takes a voltage or a class", () => {
    expect(lineMatchesVariableV164(segment({ voltageKv: 220 }), "all", ["voltageKv"])).toBe(true);
    expect(lineMatchesVariableV164(segment({ voltageKv: 220 }), "220", ["voltageKv"])).toBe(true);
    expect(lineMatchesVariableV164(segment({ voltageKv: 110 }), "220", ["voltageKv"])).toBe(false);
    expect(lineMatchesVariableV164(segment({ class: "철도" }), "철도", ["class"])).toBe(true);
    expect(lineMatchesVariableV164(segment({ class: "고속도로" }), "철도", ["class"])).toBe(false);
  });

  test("route segments are counted by class in the layer's own order, then by size", () => {
    const features = [
      ...Array.from({ length: 3 }, () => segment({ class: "주요도로" })),
      segment({ class: "철도" }),
      segment({ class: "고속도로" }),
      segment({ class: "고속도로" }),
      segment({ class: "" }),
      segment({}),
    ];
    expect(lineCategoryCountsV164(features, ["class"], ["고속도로", "간선도로", "주요도로", "철도"])).toEqual([
      { label: "고속도로", count: 2 },
      { label: "주요도로", count: 3 },
      { label: "철도", count: 1 },
    ]);
    // Without a stated order the larger class comes first; a layer with no text field has no counts.
    expect(lineCategoryCountsV164(features, ["class"]).map((entry) => entry.label)).toEqual(["주요도로", "고속도로", "철도"]);
    expect(lineCategoryCountsV164([segment({ voltageKv: 110 })], ["voltageKv"])).toEqual([]);
  });

  test("a segment without a name is listed by its voltage or its class, never as a bare number", () => {
    expect(lineFeatureFallbackLabelV164({ voltageKv: 220 }, ["voltageKv"], 2)).toBe("220 kV 선로 3");
    expect(lineFeatureFallbackLabelV164({ class: "철도" }, ["class"], 0)).toBe("철도 구간 1");
    expect(lineFeatureFallbackLabelV164({}, ["class"], 4)).toBe("노선 구간 5");
    expect(lineFeatureFallbackLabelV164(null, [], 0)).toBe("노선 구간 1");
  });
});

describe("the years a drawn record states", () => {
  test("a reference year wins over a date, and a date over the provenance year", () => {
    expect(recordYearV164({ normalizedAttributes: { 기준연도: "2019", 시작일: "1990-01-02" } })).toBe(2019);
    expect(recordYearV164({ normalizedAttributes: { 시작일: "1988-02-06" }, provenance: { referenceYear: "2024" } })).toBe(1988);
    expect(recordYearV164({ normalizedAttributes: {}, provenance: { referenceYear: 2024 } })).toBe(2024);
  });

  test("an asset feature's flat properties are read the same way, but its source-year bookkeeping is not a record year", () => {
    expect(recordYearV164({ properties: { startDate: "1952-07-01", sourceYear: "2024" } })).toBe(1952);
    expect(recordYearV164({ properties: { sourceYear: "2024" } })).toBeNull();
  });

  test("a value that is not a year is skipped", () => {
    expect(recordYearV164({ normalizedAttributes: { 기준연도: "n/a", 연도: "20" } })).toBeNull();
    expect(recordYearV164({ normalizedAttributes: { 기준연도: "99999" } })).toBeNull();
    expect(recordYearV164({})).toBeNull();
  });

  test("the span is the first and last year across the records, null when none states one", () => {
    expect(recordYearSpanV164([
      { normalizedAttributes: { 시작일: "2024-05-01" } },
      { normalizedAttributes: { 시작일: "1952-01-01" } },
      { normalizedAttributes: {} },
      { normalizedAttributes: { 연도: 1997 } },
    ])).toEqual({ first: 1952, last: 2024 });
    expect(recordYearSpanV164([{ normalizedAttributes: {} }, { normalizedAttributes: { 연도: "x" } }])).toBeNull();
    expect(recordYearSpanV164([])).toBeNull();
  });

  test("only event and observation registers take their title period from their records", () => {
    expect(["B-012", "B-023", "B-028"].every(usesRecordYearSpanV164)).toBe(true);
    // B-008 is a projection layer: its 2100 is the horizon the map shows, not the years of its rows.
    expect(usesRecordYearSpanV164("B-008")).toBe(false);
    expect(usesRecordYearSpanV164("A-023")).toBe(false);
  });
});

describe("the period a point layer's title shows", () => {
  test("the records' years say what the layer covers (B-012: 265 events, not '2024')", () => {
    expect(pointPeriodLabelV164({ span: { first: 1952, last: 2024 }, selectorPeriod: "2024" })).toBe("1952–2024");
    expect(pointPeriodLabelV164({ span: { first: 2024, last: 2024 }, selectorPeriod: "2026" })).toBe("2024");
  });

  test("without record years the layer's own period stands", () => {
    expect(pointPeriodLabelV164({ span: null, selectorPeriod: "2100" })).toBe("2100");
  });

  test("a delivery year is not shown as the year of the data (VNM B-025's basins)", () => {
    expect(NO_REFERENCE_YEAR_LAYERS_V164.has("VNM:B-025")).toBe(true);
    expect(pointPeriodLabelV164({ span: null, selectorPeriod: "2026", selectorPeriodIsDeliveryYear: true })).toBe("");
    expect(pointPeriodLabelV164({ span: null, selectorPeriod: "" })).toBe("");
  });

  test("a national figure drawn on another layer's mines says what the year belongs to", () => {
    expect(pointPeriodLabelV164({ span: null, selectorPeriod: "2022", joinedToHostSites: true })).toBe("광산 위치 기준 2022");
    expect(pointPeriodLabelV164({ span: null, selectorPeriod: "", joinedToHostSites: true })).toBe("");
  });
});

describe("how many regions have a value", () => {
  test("seven of eight divisions is said, with the one that has none", () => {
    expect(regionCoverageCaptionV164({ valued: 7, total: 8, unitWord: "주(Division)", missing: ["마이멘싱 (Mymensingh)"] }))
      .toBe("8개 주(Division) 중 7개에 값 있음 · 값 없음: 마이멘싱 (Mymensingh)");
  });

  test("names that cannot be read are left out, not replaced by a key", () => {
    expect(regionCoverageCaptionV164({ valued: 6, total: 8, unitWord: "주(Division)", missing: ["", "실렛 (Sylhet)"] }))
      .toBe("8개 주(Division) 중 6개에 값 있음 · 값 없음: 실렛 (Sylhet)");
    expect(regionCoverageCaptionV164({ valued: 6, total: 8, unitWord: "주(Division)", missing: [] }))
      .toBe("8개 주(Division) 중 6개에 값 있음");
  });

  test("nothing is said when every unit has a value or there are no units", () => {
    expect(regionCoverageCaptionV164({ valued: 8, total: 8, unitWord: "주(Division)", missing: [] })).toBe("");
    expect(regionCoverageCaptionV164({ valued: 0, total: 0, unitWord: "주(Division)", missing: [] })).toBe("");
  });
});
