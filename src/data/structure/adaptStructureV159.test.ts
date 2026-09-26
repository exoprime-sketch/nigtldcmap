import { expect, test } from "@jest/globals";
import type { VietnamEntityV124, VietnamObservationV124 } from "../vietnam/vietnamTypesV124";
import { adaptStructureV159 } from "./adaptStructureV159";

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

test("dispatches to S1 for structure S1 and drops entities", () => {
  const result = adaptStructureV159("S1", { observations: [obs({})], entities: [entity({})], indicators: [] });
  expect(result.structure).toBe("S1");
  expect(result.rows).toHaveLength(1);
});

test("dispatches to S3 for structure S3 and drops observations", () => {
  const result = adaptStructureV159("S3", { observations: [obs({})], entities: [entity({})], indicators: [] });
  expect(result.structure).toBe("S3");
  expect(result.rows).toHaveLength(1);
});

test("dispatches to S4 and merges entity + observation records", () => {
  const result = adaptStructureV159("S4", { observations: [obs({})], entities: [entity({})], indicators: [] });
  expect(result.structure).toBe("S4");
  expect(result.rows).toHaveLength(2);
});
