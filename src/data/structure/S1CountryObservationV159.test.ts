import { expect, test } from "@jest/globals";
import type { VietnamIndicatorMetaV124, VietnamObservationV124 } from "../vietnam/vietnamTypesV124";
import { adaptS1V159, parseBoundV159, parseScenarioV159, parseValueKindV159 } from "./S1CountryObservationV159";

function meta(overrides: Partial<VietnamIndicatorMetaV124>): VietnamIndicatorMetaV124 {
  return {
    elementId: "X-000",
    indicatorId: "X-000_series",
    labelKo: "라벨",
    technologyIds: [],
    dataType: "numeric",
    sourceOrg: "Source",
    loadStatus: "published",
    warnings: [],
    provenance: {} as VietnamIndicatorMetaV124["provenance"],
    extraMeta: {},
    ...overrides,
  };
}

function obs(overrides: Partial<VietnamObservationV124>): VietnamObservationV124 {
  return {
    recordId: "rec-1",
    elementId: "X-000",
    indicatorId: "X-000_series",
    countryIso3: "VNM",
    value: 1,
    loadStatus: "published",
    warnings: [],
    rightsStatus: "ok",
    rightsNote: "",
    downloadEligible: true,
    provenance: {} as VietnamObservationV124["provenance"],
    ...overrides,
  };
}

test("valueKind/bound/scenario parse only explicit markers", () => {
  expect(parseValueKindV159("[실적치] · GDLCODE=VNMr104")).toBe("actual");
  expect(parseValueKindV159("[추정치] 뭔가")).toBe("estimate");
  expect(parseValueKindV159("[전망치] 뭔가")).toBe("projection");
  expect(parseValueKindV159("아무 설명")).toBeNull();

  expect(parseBoundV159("[하한(min)] 재생에너지 발주 계획", "C-016_re_capacity_target")).toBe("min");
  expect(parseBoundV159(null, "C-016_re_capacity_target_min")).toBe("min");
  expect(parseBoundV159(null, "C-016_re_capacity_target_max")).toBe("max");
  expect(parseBoundV159(null, "B-008_rsl_1003_ssp119_q17")).toBe("q17");
  expect(parseBoundV159(null, "A-001_cpi_score")).toBeNull();

  expect(parseScenarioV159("D-004_capex_recovery_solar_pv_high")).toBe("high");
  expect(parseScenarioV159("D-004_capex_recovery_solar_pv_low")).toBe("low");
  expect(parseScenarioV159("B-008_rsl_1003_ssp119_q17")).toBe("SSP1-1.9");
  expect(parseScenarioV159("B-008_rsl_1003_ssp126_q17")).toBe("SSP1-2.6");
  expect(parseScenarioV159("B-018_gdp_rcp45")).toBe("RCP4.5");
  expect(parseScenarioV159("A-001_cpi_score")).toBeNull();
});

test("A-001 style: a label segment repeated on every indicator (country name) is not a category", () => {
  const indicators = [
    meta({ indicatorId: "A-001_cpi_ci_lower", labelKo: "CPI 신뢰구간 하한 · 베트남 — 90% 신뢰구간 하한" }),
    meta({ indicatorId: "A-001_cpi_ci_upper", labelKo: "CPI 신뢰구간 상한 · 베트남 — 90% 신뢰구간 상한" }),
    meta({ indicatorId: "A-001_cpi_score", labelKo: "CPI 점수 · 베트남 — 부패인식지수 점수" }),
  ];
  const observations = [
    obs({ indicatorId: "A-001_cpi_score", year: 2024, value: 42, note: "[실적치]" }),
  ];
  const rows = adaptS1V159(observations, indicators);
  expect(rows[0].category).toBeNull();
});

test("A-010 style: a label segment that varies across the element's indicators is a category", () => {
  const indicators = [
    meta({ indicatorId: "A-010_emissions_ch4_co2eq", labelKo: "가스별 배출량 · CH4(CO2 환산) — GWP-100 AR5 적용 CO2 환산 배출량" }),
    meta({ indicatorId: "A-010_emissions_co2_co2eq", labelKo: "가스별 배출량 · CO2(CO2 환산) — GWP-100 AR5 적용 CO2 환산 배출량" }),
  ];
  const observations = [
    obs({ indicatorId: "A-010_emissions_ch4_co2eq", year: 1970, value: 40.44, unit: "Mt CO2eq" }),
  ];
  const rows = adaptS1V159(observations, indicators);
  expect(rows[0].category).toBe("CH4(CO2 환산)");
});

test("missing value stays null - never 0-filled", () => {
  const indicators = [meta({})];
  const observations = [obs({ value: null, missingReasonCode: "M01", note: "미게재" })];
  const rows = adaptS1V159(observations, indicators);
  expect(rows[0].value).toBeNull();
  expect(rows[0].missingReasonCode).toBe("M01");
});

test("techIds come from indicator meta, normalized to two-digit codes", () => {
  const indicators = [meta({ indicatorId: "A-018_capacity_onshore_wind_energy_ongrid", technologyIds: ["3"] })];
  const observations = [obs({ indicatorId: "A-018_capacity_onshore_wind_energy_ongrid", year: 2023, value: 5000 })];
  const rows = adaptS1V159(observations, indicators);
  expect(rows[0].techIds).toEqual(["03"]);
});

test("label falls back to the indicator id when no meta matches", () => {
  const rows = adaptS1V159([obs({ indicatorId: "Z-999_unknown" })], []);
  expect(rows[0].label).toBe("Z-999_unknown");
});
