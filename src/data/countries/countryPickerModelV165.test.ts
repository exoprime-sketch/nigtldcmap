import { describe, expect, it } from "@jest/globals";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import type { CountryRegistryEntryV158, CountryRegionV165 } from "../countryContext";
import {
  countryPickerModelV165,
  countrySelectGroupsV165,
  filterCountryGroupsV165,
  nextCountryByTypeAheadV165,
} from "./countryPickerModelV165";

const REGIONS: CountryRegionV165[] = [
  { key: "sea", nameKo: "동남아시아", order: 1 },
  { key: "sa", nameKo: "남아시아", order: 2 },
  { key: "mena", nameKo: "중동·북아프리카", order: 3 },
];

// A test registry shaped like the ten priority countries; the app itself names none.
const TEN: Array<[string, string, string, string]> = [
  ["VNM", "베트남", "Viet Nam", "sea"],
  ["BGD", "방글라데시", "Bangladesh", "sa"],
  ["PHL", "필리핀", "Philippines", "sea"],
  ["KHM", "캄보디아", "Cambodia", "sea"],
  ["IDN", "인도네시아", "Indonesia", "sea"],
  ["LAO", "라오스", "Lao PDR", "sea"],
  ["LKA", "스리랑카", "Sri Lanka", "sa"],
  ["IND", "인도", "India", "sa"],
  ["MYS", "말레이시아", "Malaysia", "sea"],
  ["EGY", "이집트", "Egypt", "mena"],
];

function registry(liveCount: number, total = TEN.length, extra: Array<[string, string, string, string]> = []) {
  const rows = [...TEN, ...extra].slice(0, total);
  const countries = rows.map(([iso3, nameKo, nameEn, region], index) => ({
    iso3,
    nameKo,
    nameEn,
    region,
    status: index < liveCount ? "live" : "preparing",
  })) as unknown as CountryRegistryEntryV158[];
  return { countries, regions: REGIONS };
}

describe("country picker shape follows the number of public countries", () => {
  it("one public country: the name only, on every screen", () => {
    expect(countryPickerModelV165(registry(1), "header").mode).toBe("single");
    expect(countryPickerModelV165(registry(1), "inline").mode).toBe("single");
  });

  it("two to four public countries: one button each on the home, a list in the header", () => {
    for (const live of [2, 4]) {
      const inline = countryPickerModelV165(registry(live, live), "inline");
      expect(inline.mode).toBe("segmented");
      expect(inline.live.map((row) => row.iso3)).toEqual(TEN.slice(0, live).map((row) => row[0]));
      const header = countryPickerModelV165(registry(live, live), "header");
      expect(header.mode).toBe("list");
      // Under five entries the list is not grouped.
      expect(header.groups).toHaveLength(1);
      expect(header.groups[0].nameKo).toBe("");
    }
  });

  it("five to ten listed countries: a list grouped by region, preparing ones disabled", () => {
    // The header lists every country, public or being prepared; the home shows
    // only the two public ones as buttons until five are public.
    expect(countryPickerModelV165(registry(2), "inline").mode).toBe("segmented");
    const model = countryPickerModelV165(registry(2), "header");
    expect(model.mode).toBe("list");
    expect(model.groups.map((group) => group.nameKo)).toEqual(["동남아시아", "남아시아", "중동·북아프리카"]);
    expect(model.groups[0].countries.map((row) => row.nameKo)).toEqual([
      "라오스",
      "말레이시아",
      "베트남",
      "인도네시아",
      "캄보디아",
      "필리핀",
    ]);
    const flat = model.groups.flatMap((group) => group.countries);
    expect(flat).toHaveLength(10);
    expect(flat.filter((row) => row.live).map((row) => row.iso3).sort()).toEqual(["BGD", "VNM"]);
    expect(model.searchable).toBe(false);
    // Five public countries on the home: no longer one button each.
    expect(countryPickerModelV165(registry(5), "inline").mode).toBe("list");
  });

  it("eleven or more listed countries: a search box", () => {
    const eleven = registry(3, 11, [["THA", "태국", "Thailand", "sea"]]);
    expect(countryPickerModelV165(eleven, "header").searchable).toBe(true);
  });

  it("a country without a known region is listed last, under 기타", () => {
    const reg = registry(5);
    (reg.countries[9] as { region?: string }).region = "unknown";
    const groups = countryPickerModelV165(reg, "header").groups;
    expect(groups.at(-1)?.nameKo).toBe("기타");
    expect(groups.at(-1)?.countries.map((row) => row.iso3)).toEqual(["EGY"]);
  });
});

describe("page selects group their options by region from five public countries", () => {
  it("leaves fewer than five as a flat list", () => {
    expect(countrySelectGroupsV165(registry(2), ["VNM", "BGD"])).toBeNull();
  });
  it("groups five or more, public countries only", () => {
    const groups = countrySelectGroupsV165(registry(5), ["VNM", "BGD", "PHL", "KHM", "IDN"]);
    expect(groups?.map((group) => [group.nameKo, group.countries.map((row) => row.iso3)])).toEqual([
      ["동남아시아", ["VNM", "IDN", "KHM", "PHL"]],
      ["남아시아", ["BGD"]],
    ]);
  });
});

describe("finding a country in the list", () => {
  const entries = countryPickerModelV165(registry(10), "header").groups.flatMap((group) => group.countries);
  it("type-ahead jumps to the next public country starting with the typed letters", () => {
    expect(nextCountryByTypeAheadV165(entries, "인", null)).toBe("IDN");
    expect(nextCountryByTypeAheadV165(entries, "인", "IDN")).toBe("IND");
    expect(nextCountryByTypeAheadV165(entries, "ban", null)).toBe("BGD");
  });
  it("search matches Korean and English names and the code", () => {
    const groups = countryPickerModelV165(registry(10), "header").groups;
    expect(filterCountryGroupsV165(groups, "lanka").flatMap((g) => g.countries.map((c) => c.iso3))).toEqual(["LKA"]);
    expect(filterCountryGroupsV165(groups, "베트").flatMap((g) => g.countries.map((c) => c.iso3))).toEqual(["VNM"]);
  });
});

describe("the published registry", () => {
  const published = JSON.parse(readFileSync(resolve(__dirname, "../../../public/data/countries.json"), "utf8")) as {
    regions: CountryRegionV165[];
    countries: CountryRegistryEntryV158[];
  };
  it("names a region for every country, and every region it names exists", () => {
    const keys = new Set(published.regions.map((region) => region.key));
    expect(published.countries.every((country) => country.region && keys.has(country.region))).toBe(true);
  });
  it("gives the home today's shape: one button per public country", () => {
    const model = countryPickerModelV165(published, "inline");
    expect(model.mode).toBe(model.live.length <= 1 ? "single" : model.live.length <= 4 ? "segmented" : "list");
  });
});
