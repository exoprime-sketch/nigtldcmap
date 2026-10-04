import { describe, expect, it } from "@jest/globals";

import type { VietnamEntityV124 } from "../vietnam/vietnamTypesV124";
import { resolvePublicEntityTitleV131 } from "./publicEntityTitleV131";

function entityOf(
  elementId: string,
  name: string,
  normalizedAttributes: Record<string, unknown>
): VietnamEntityV124 {
  return {
    elementId,
    indicatorId: `${elementId}_x`,
    recordId: `${elementId}-${name}`,
    entityType: "entity",
    countryIso3: "BGD",
    name,
    normalizedAttributes,
    rawAttributes: {},
    note: null,
    provenance: {},
  } as unknown as VietnamEntityV124;
}

describe("raw-key record titles (V164)", () => {
  it("titles a USGS commodity row with the commodity the source prints, not 'BGD_구리_2026'", () => {
    const row = entityOf("B-046", "BGD_구리_2026", {
      레코드_키: "BGD_구리_2026",
      광종_세부_원천_표기: "구리",
      광종_USGS_영문: "COPPER",
      연도: 2026,
    });
    expect(resolvePublicEntityTitleV131(row, { template: "generic" }).title).toBe("구리");
    const production = entityOf("B-047", "BGD_구리_2025", { 레코드_키: "BGD_구리_2025", 광종_세부_원천_표기: "구리" });
    expect(resolvePublicEntityTitleV131(production, { template: "generic" }).title).toBe("구리");
  });

  it("titles a Bangladesh sea-level row with its station, not the process key", () => {
    const row = entityOf("B-008", "1496_low_ssp126_q17_2020", {
      레코드_키: "1496_low_ssp126_q17_2020",
      관측소명_로마자: "CHARCHANGA",
      관측소명_PSMSL_격자점: "CHARCHANGA",
      시나리오: "SSP1-2.6",
      연도: 2020,
    });
    expect(resolvePublicEntityTitleV131(row, { template: "generic" }).title).toBe("CHARCHANGA");
  });

  it("still prefers the Vietnamese station column where the delivery has one", () => {
    const row = entityOf("B-008", "1003_medium_ssp126_q5_2060", {
      레코드_키: "1003_medium_ssp126_q5_2060",
      관측소명_베트남어: "Hon Dau",
      관측소명_PSMSL: "HON DAU",
    });
    expect(resolvePublicEntityTitleV131(row, { template: "generic" }).title).toBe("Hon Dau");
  });
});

describe("V164-3 B-028 basin field name in titles", () => {
  it("reads MAIN_BAS as 유역", () => {
    const entity = { elementId: "B-028", name: "HydroBASINS MAIN_BAS 4080025230", normalizedAttributes: { 지점_유역명: "HydroBASINS MAIN_BAS 4080025230" } } as unknown as VietnamEntityV124;
    expect(resolvePublicEntityTitleV131(entity).title).not.toMatch(/MAIN_BAS/u);
  });
});
