import { describe, expect, it } from "@jest/globals";
import { publicItemNameV164 } from "./publicItemNameV164";
import { searchPublicDataV128 } from "../publicPlatformV128";
import type { PublicSearchItemV128 } from "../publicPlatformV128";
import type { CountryCatalogItemV122 } from "../countries/countryDataTypesV122";

/** A-002 is titled differently by the catalogue ("국가 …") and by the reviewed card spec ("세계 …"). */
function item(countryIso3: string, publicTitle = "국가 거버넌스 지표(WGI)", elementId = "A-002") {
  return { elementId, countryIso3, publicTitle, sourceOrganizations: ["World Bank"], publicStatus: "data-provided" };
}

describe("publicItemNameV164", () => {
  it("names a dataset as the finder card does - the card spec's name, not the catalogue title", () => {
    expect(publicItemNameV164(item("BGD"))).toBe("세계 거버넌스 지표(WGI)");
    expect(publicItemNameV164(item("VNM"))).toBe("세계 거버넌스 지표(WGI)");
  });

  it("falls back to the catalogue title when the spec has no name for the dataset", () => {
    expect(publicItemNameV164(item("BGD", "항목 이름", "Z-999"))).toBe("항목 이름");
    expect(publicItemNameV164(item("VNM", "항목 이름", "Z-999"))).toBe("항목 이름");
  });
});

describe("header search names and orders by the same name", () => {
  const searchItem = (catalogItem: ReturnType<typeof item>): PublicSearchItemV128 => ({
    catalogItem: catalogItem as unknown as CountryCatalogItemV122,
    measureLabels: [],
    dimensionLabels: [],
    searchText: "",
  });

  it("matches a query written with the name the card shows", () => {
    const results = searchPublicDataV128("세계 거버넌스", [searchItem(item("BGD"))]);
    expect(results).toHaveLength(1);
    expect(results[0].score).toBeGreaterThanOrEqual(280);
  });

  it("still matches the catalogue title", () => {
    expect(searchPublicDataV128("국가 거버넌스", [searchItem(item("BGD"))])).toHaveLength(1);
  });
});
