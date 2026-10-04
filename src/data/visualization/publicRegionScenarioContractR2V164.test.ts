import { describe, expect, it } from "@jest/globals";
import { evaluationZoneNameV164, publicRegionScenarioContractV138 } from "./publicRegionScenarioContractV138";

/** V164 R2: the Aqueduct zone label (B-017) and the B-037 constraint wording. */
describe("evaluationZoneNameV164 (B-017)", () => {
  it("names a zone by the area the source measured, never by the basin and aquifer codes", () => {
    expect(evaluationZoneNameV164({ Aqueduct_단위면적_km: 1234.56 })).toBe("평가구역 면적 1,234.6 km²");
    expect(evaluationZoneNameV164({ Aqueduct_단위면적_km: 0.4567 })).toBe("평가구역 면적 0.457 km²");
  });

  it("a zone with no measured area is the zone, with no number made up", () => {
    for (const area of [null, undefined, "", -9999, 0, "n/a"]) {
      expect(evaluationZoneNameV164({ Aqueduct_단위면적_km: area })).toBe("평가구역");
    }
    expect(evaluationZoneNameV164({})).toBe("평가구역");
  });

  it("B-017's sub-region bars are labelled with that name", () => {
    const contract = publicRegionScenarioContractV138("B-017");
    expect(contract?.rowUnit?.describe?.({ Aqueduct_단위면적_km: 88.2 })).toBe("평가구역 면적 88.2 km²");
  });
});

describe("B-037 constraints", () => {
  it("states the share of the total area in words, not by a column name", () => {
    const text = (publicRegionScenarioContractV138("B-037")?.constraints || []).join(" ");
    expect(text).toContain("전체 면적 합계 대비 구성비");
    expect(text).not.toContain("합계_km");
  });
});
