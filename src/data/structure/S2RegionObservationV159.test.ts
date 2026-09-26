import { expect, test } from "@jest/globals";
import type { VietnamEntityV124, VietnamIndicatorMetaV124, VietnamObservationV124 } from "../vietnam/vietnamTypesV124";
import { adaptS2V159 } from "./S2RegionObservationV159";

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

test("D-008 style: a ministry-coded note bracket becomes region_system=ministry", () => {
  const indicators = [meta({ indicatorId: "D-008_climate_budget_mard", labelKo: "주관 부처별 기후 예산 규모 · MARD(농업농촌개발부) — 2010~2013 기후변화 지출 누계" })];
  const observations = [
    obs({
      indicatorId: "D-008_climate_budget_mard",
      year: 2013,
      value: 12811000000000,
      unit: "VND",
      note: "[MARD(농업농촌개발부)] 2010~2013년 기후변화 지출 누계(2010년 불변가). 최대 지출 부처.",
    }),
  ];
  const rows = adaptS2V159(observations, [], indicators);
  expect(rows[0].regionSystem).toBe("ministry");
  expect(rows[0].regionKey).toBe("MARD");
  expect(rows[0].regionName).toBe("농업농촌개발부");
});

test("B-021 style: a GDLCODE note token becomes region_system=region-6, name from the label's trailing segment", () => {
  const indicators = [
    meta({
      indicatorId: "B-021_comp_cellphone_central_highlands",
      labelKo: "구성지표 — 휴대폰 보유 가구 비율 — Central Highlands",
    }),
  ];
  const observations = [
    obs({
      indicatorId: "B-021_comp_cellphone_central_highlands",
      year: 2003,
      value: 0.01,
      unit: "%",
      note: "[실적치] · GDLCODE=VNMr104",
    }),
  ];
  const rows = adaptS2V159(observations, [], indicators);
  expect(rows[0].regionSystem).toBe("region-6");
  expect(rows[0].regionKey).toBe("VNMr104");
  expect(rows[0].regionName).toBe("Central Highlands");
  expect(rows[0].valueKind).toBe("actual");
});

test("C-016 style: an explicit regionId on the observation becomes region_system=adm1-63", () => {
  const observations = [
    {
      ...obs({ indicatorId: "C-016_re_capacity_thuy_dien_nho_prov_vn_43", period: "2025-2030", value: 0 }),
      regionId: "VN-43",
      regionLabel: "Bà Rịa–Vũng Tàu",
    } as VietnamObservationV124,
  ];
  const rows = adaptS2V159(observations, [], []);
  expect(rows[0].regionSystem).toBe("adm1-63");
  expect(rows[0].regionKey).toBe("VN-43");
  expect(rows[0].regionName).toBe("Bà Rịa–Vũng Tàu");
});

test("a row with no region marker is a national row (fields stay null, not fabricated)", () => {
  const observations = [obs({ year: 2024, value: 100, note: "전국 값" })];
  const rows = adaptS2V159(observations, [], []);
  expect(rows[0].regionSystem).toBeNull();
  expect(rows[0].regionKey).toBeNull();
  expect(rows[0].regionName).toBeNull();
});

test("a missing region name can be back-filled from an entity's own adm1 code/name pair", () => {
  const observations = [
    {
      ...obs({ year: 2024, value: 5 }),
      regionId: "VN-28",
      regionLabel: null,
    } as VietnamObservationV124,
  ];
  const entities: VietnamEntityV124[] = [
    {
      recordId: "e1",
      elementId: "X-000",
      entityType: "entity",
      normalizedAttributes: { adm1Code63: "VN-28", adm1Name63: "Kon Tum" },
      rawAttributes: {},
      loadStatus: "published",
      warnings: [],
      rightsStatus: "ok",
      rightsNote: "",
      downloadEligible: true,
      mapEligible: true,
      provenance: {} as VietnamEntityV124["provenance"],
    },
  ];
  const rows = adaptS2V159(observations, entities, []);
  expect(rows[0].regionName).toBe("Kon Tum");
});
