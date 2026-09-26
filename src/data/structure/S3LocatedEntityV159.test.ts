import { expect, test } from "@jest/globals";
import type { VietnamEntityV124 } from "../vietnam/vietnamTypesV124";
import { adaptS3V159 } from "./S3LocatedEntityV159";

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

test("A-023 style: gppdId/mw/primaryFuel and a matching note bracket become recordKey/size/class/techIds", () => {
  const row = adaptS3V159([
    entity({
      elementId: "A-023",
      indicatorId: "A-023_power_plant_registry",
      name: "Kon Dao",
      latitude: 14.6967,
      longitude: 107.8258,
      note: "[수력 기술 (Hydropower)] [발전소ID: WRI1030845] 명칭: Kon Dao · 주연료: Hydro",
      normalizedAttributes: {
        gppdId: "WRI1030845",
        mw: "1.0",
        primaryFuel: "Hydro",
        commissioningYear: 1984,
        owner: null,
        adm1Code63: "VN-28",
        adm1Name63: "Kon Tum",
        sourceUrl: "https://data.opendevelopmentmekong.net/vi/library_record/kon-dao-hydropower",
      },
    }),
  ])[0];
  expect(row.recordKey).toBe("WRI1030845");
  expect(row.classLabel).toBe("Hydro");
  expect(row.size).toEqual({ value: 1, unit: "MW" });
  expect(row.year).toBe(1984);
  expect(row.owner).toBeNull();
  expect(row.techIds).toEqual(["05"]);
  expect(row.sourceUrl).toContain("opendevelopmentmekong");
  // adm1Source stays null: adm1Code63/Name63 are the platform's own point-in-polygon
  // result (V151), not a province the WRI source itself stated.
  expect(row.adm1Source).toBeNull();
});

test("B-008 style: a Korean record-key field and an embedded unit segment give recordKey and size", () => {
  const row = adaptS3V159([
    entity({
      elementId: "B-008",
      indicatorId: "B-008_sea_level_station",
      name: "1475_low_ssp126_q17_2020",
      latitude: 16.1,
      longitude: 108.216667,
      normalizedAttributes: {
        PSMSL_관측소_ID: 1475,
        레코드_키: "1475_low_ssp126_q17_2020",
        분위수: 17,
        상대해수면_상승_m_2005년_기준: 0.023,
        연도: 2020,
        시나리오: "SSP1-2.6",
      },
    }),
  ])[0];
  expect(row.recordKey).toBe("1475_low_ssp126_q17_2020");
  expect(row.size).toEqual({ value: 0.023, unit: "m" });
  expect(row.year).toBe(2020);
});

test("no id-like field and no name falls back to the internal recordId", () => {
  const row = adaptS3V159([entity({ name: null, normalizedAttributes: {} })])[0];
  expect(row.recordKey).toBe("rec-1");
});

test("a note without an exact catalog technology name yields no techIds (never guessed)", () => {
  const row = adaptS3V159([entity({ note: "특정 기술을 지목하지 않음" })])[0];
  expect(row.techIds).toEqual([]);
});
