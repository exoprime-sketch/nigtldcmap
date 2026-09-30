import { describe, expect, it } from "@jest/globals";
import {
  assertSingleRegionSystemV162,
  firstAttributeV162,
  MixedRegionSystemErrorV162,
  REGION_NAME_KEYS_V162,
  regionSystemOfV162,
  rowsForPreReformViewV162,
  source34ValuesForSelectorV162,
} from "./regionSystemV162";

const row = (unit: string, indicatorId = "B-031_forest_extent_adm1", regionSystem?: string) => ({
  indicatorId,
  regionSystem,
  normalizedAttributes: { 행정단위: unit, 지역명_현지어: "Cao Bằng" },
});

describe("regionSystemV162", () => {
  it("reads the stamped system first, then the row's own unit and indicator", () => {
    expect(regionSystemOfV162(row("Province", "x", "adm1"))).toBe("adm1");
    expect(regionSystemOfV162(row("Province"))).toBe("adm1-prev");
    expect(regionSystemOfV162(row("City"))).toBe("adm1-prev");
    expect(regionSystemOfV162(row("Province/City (2025년 34개 체계)", "B-031_forest_extent_adm1_adm34"))).toBe("adm1");
    expect(regionSystemOfV162(row("Country", "B-031_forest_extent_national"))).toBe("country");
    expect(regionSystemOfV162(row("유역(HydroBASINS lvl6)", "B-026_basin"))).toBeNull();
  });

  it("keeps a 63-unit view to the pre-reform rows of a mixed sheet", () => {
    const sheet = [
      row("Province"),
      row("City"),
      row("Province/City (2025년 34개 체계)", "B-031_forest_extent_adm1_adm34"),
      row("Country"),
      row("유역(HydroBASINS lvl6)", "B-026_basin"),
    ];
    const view = rowsForPreReformViewV162(sheet);
    expect(view.map((item) => regionSystemOfV162(item))).toEqual(["adm1-prev", "adm1-prev", "country"]);
    expect(() => assertSingleRegionSystemV162(view, "B-031 region summary")).not.toThrow();
  });

  it("leaves a current-system sheet (no pre-reform rows) unchanged", () => {
    const divisions = [row("Division", "B-003_climate_adm1_year", "adm1"), row("Division", "B-003_climate_adm1_year", "adm1")];
    expect(rowsForPreReformViewV162(divisions)).toHaveLength(2);
  });

  it("refuses one aggregation over both systems", () => {
    const mixed = [row("Province"), row("Province/City (2025년 34개 체계)", "B-003_climate_adm1_year_adm34")];
    expect(() => assertSingleRegionSystemV162(mixed, "B-003 chart")).toThrow(MixedRegionSystemErrorV162);
  });

  it("reads the common column name before the pre-V162 name", () => {
    expect(firstAttributeV162({ 지역명_베트남어: "old", 지역명_현지어: "new" }, REGION_NAME_KEYS_V162)).toBe("new");
    expect(firstAttributeV162({ 지역명_베트남어: "old" }, REGION_NAME_KEYS_V162)).toBe("old");
  });

  it("returns the source 34-unit values for the selected variable and period only", () => {
    const value = (variable: string, period: string) => ({
      unitCode: "VN34-03", unitName: "Cao Bằng", variable, variableLabel: variable, period, value: 1,
      unit: "ha", sourceIndicatorId: null, sourceRecordId: null, sourceSpatialUnit: "admin1-34" as const, imputed: false as const,
    });
    const asset = { values34: [value("a", "2000"), value("a", "2010"), value("b", "2000")] };
    expect(source34ValuesForSelectorV162(asset, "a", "2000")).toHaveLength(1);
    expect(source34ValuesForSelectorV162(asset, "a", "2020")).toHaveLength(0);
    expect(source34ValuesForSelectorV162({}, "a", "2000")).toHaveLength(0);
  });
});
