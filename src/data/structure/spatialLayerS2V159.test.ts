import { describe, expect, test } from "@jest/globals";
import type { VietnamSpatialLayerAssetV124 } from "../vietnam/vietnamTypesV124";
import { adaptSpatialLayerS2V159 } from "./S2RegionObservationV159";
import { decisionPointsV159 } from "./decisionPointsV159";

function layer(values: Array<Record<string, unknown>>): VietnamSpatialLayerAssetV124 {
  return {
    elementId: "B-041",
    countryIso3: "VNM",
    boundarySystem: "pre-2025-63",
    selectors: { defaultVariable: "ghi-mean", defaultPeriod: "1999–2018 장기평균(LTA)" },
    values,
  } as unknown as VietnamSpatialLayerAssetV124;
}

const row = (adm1Code: string, adm1Name: string, value: number, extra: Record<string, unknown> = {}) => ({
  adm1Code,
  adm1Name,
  variable: "ghi-mean",
  variableLabel: "성(省)별 평균 수평면 전천일사량",
  period: "1999–2018 장기평균(LTA)",
  value,
  unit: "kWh/m²/일",
  imputed: false,
  ...extra,
});

describe("V159 S2 rows from the map layer", () => {
  test("takes only the layer's default variable and period, skips imputed values", () => {
    const rows = adaptSpatialLayerS2V159(
      layer([
        row("VN-01", "Lai Châu", 4.1),
        row("VN-02", "Lào Cai", 3.9, { imputed: true }),
        row("VN-03", "Hà Giang", 3.7, { variable: "dni-mean" }),
        row("VN-04", "Cao Bằng", 3.8, { period: "2020" }),
      ])
    );
    expect(rows.map((item) => item.regionKey)).toEqual(["VN-01"]);
    expect(rows[0]).toMatchObject({ regionSystem: "adm1-63", indicatorId: "B-041:ghi-mean", year: null, period: "1999–2018 장기평균(LTA)" });
  });

  test("U2 decision points over a period view name the basis and never estimate", () => {
    const rows = adaptSpatialLayerS2V159(
      layer([
        row("VN-01", "A", 5),
        row("VN-02", "B", 4),
        row("VN-03", "C", 3),
        row("VN-04", "D", 2),
        row("VN-05", "E", 1),
      ])
    );
    const points = decisionPointsV159("U2", { structure: "S2", rows }, { countryIso3: "VNM" });
    const top = points.find((point) => point.key === "top-regions")!;
    const bottom = points.find((point) => point.key === "bottom-regions")!;
    expect(top.value.startsWith("A: 5")).toBe(true);
    expect(bottom.value.startsWith("E: 1")).toBe(true);
    expect(top.detail).toContain("1999–2018 장기평균(LTA)");
    // No national row in a layer view: no national comparison is made up.
    expect(points.find((point) => point.key === "national-comparison")).toBeUndefined();
  });

  test("an empty layer gives no points", () => {
    expect(decisionPointsV159("U2", { structure: "S2", rows: adaptSpatialLayerS2V159(layer([])) }, { countryIso3: "VNM" })).toEqual([]);
  });
});
