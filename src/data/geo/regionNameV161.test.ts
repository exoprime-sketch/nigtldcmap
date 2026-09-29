import { describe, expect, test } from "@jest/globals";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { countryPublicDirV158 } from "../countryContext";
import { ADM1_34_UNITS_V151 } from "../map/adminBoundaryV151";
import { PROVINCE_KO_V150 } from "../map/mapBackdropV150";
import { MAP_CITIES_V151 } from "../map/mapLabelsV151";
import regionNames from "./regionNamesV161.json";
import {
  composeRegionNameV161,
  formatRegionName,
  regionMergeNoteV161,
  regionNameEntryV161,
  regionNameKeyV161,
  regionNameKo,
  type RegionNameEntryV161,
} from "./regionNameV161";

const ROOT = resolve(__dirname, "../../..");
const entries = (country: "VNM" | "BGD") =>
  (regionNames as unknown as { countries: Record<string, { entries: RegionNameEntryV161[] }> }).countries[country].entries;
const aliases = JSON.parse(
  readFileSync(resolve(ROOT, countryPublicDirV158("VNM"), "geometry/vnm-adm1-aliases.json"), "utf8")
).aliases as Array<{ adm1Code: string; canonicalName: string; variants: string[] }>;
// Alias rows that name a different place (the city of Huế, Vũng Tàu, Côn Đảo)
// so data can be joined to the province; they are not the province's name.
const JOIN_ONLY = new Set(["VN-26:Huế", "VN-26:Hue", "VN-43:Côn Đảo", "VN-43:Vung Tau"]);

describe("Viet Nam: the dictionaries answer every province and city (no rule-based names)", () => {
  test("63 pre-2025 provinces, from every spelling in the alias table", () => {
    expect(aliases).toHaveLength(63);
    const misses: string[] = [];
    for (const row of aliases) {
      const ko = PROVINCE_KO_V150[row.adm1Code];
      for (const spelling of [row.canonicalName, ...row.variants]) {
        if (JOIN_ONLY.has(`${row.adm1Code}:${spelling}`)) continue;
        const entry = regionNameEntryV161({ country: "VNM", raw: spelling, level: "adm1-63" });
        if (entry?.ko !== ko || entry.source === "nikl-vi-rule") misses.push(`${row.adm1Code} ${spelling} → ${entry?.ko}`);
      }
    }
    expect(misses).toEqual([]);
  });

  test("a place joined to a province is not given the province's name", () => {
    expect(regionNameKo({ country: "VNM", raw: "Côn Đảo", level: "adm1-63" })).toBeNull();
    expect(regionNameKo({ country: "VNM", raw: "Vung Tau", level: "adm1-63" })).toBeNull();
    expect(regionNameKo({ country: "VNM", raw: "Huế", level: "adm1-63" })).toBeNull();
    expect(regionNameKo({ country: "VNM", raw: "Huế", level: "adm1-34" })).toBe("후에");
  });

  test("34 post-2025 units", () => {
    expect(ADM1_34_UNITS_V151).toHaveLength(34);
    for (const unit of ADM1_34_UNITS_V151) {
      expect(formatRegionName({ country: "VNM", raw: unit.name, level: "adm1-34" })).toBe(`${unit.nameKo} (${unit.name})`);
    }
  });

  test("six centrally-run cities, by their Vietnamese and English names", () => {
    expect(MAP_CITIES_V151).toHaveLength(6);
    for (const city of MAP_CITIES_V151) {
      expect(regionNameKo({ country: "VNM", raw: city.nameEn, level: "city" })).toBe(city.name);
    }
    expect(regionNameKo({ country: "VNM", raw: "Saigon", level: "city" })).toBe("호찌민");
  });

  test("dictionary levels hold only confirmed names from the platform's tables", () => {
    const counts: Record<string, number> = {};
    for (const entry of entries("VNM")) {
      counts[entry.level] = (counts[entry.level] || 0) + 1;
      if (entry.level !== "locality") {
        expect(entry.reviewStatus).toBe("confirmed");
        expect(entry.source).not.toBe("nikl-vi-rule");
      }
    }
    expect(counts["adm1-63"]).toBe(63);
    expect(counts["adm1-34"]).toBe(34);
    expect(counts.city).toBe(6);
  });
});

describe("display form", () => {
  test("한글명 (현지명), the local name exactly as given", () => {
    expect(formatRegionName({ country: "VNM", raw: "Bà Rịa-Vũng Tàu", level: "adm1-63" })).toBe("바리아붕따우 (Bà Rịa-Vũng Tàu)");
    expect(formatRegionName({ country: "vnm", raw: "Thành phố Hồ Chí Minh" })).toBe("호찌민 (Thành phố Hồ Chí Minh)");
    expect(formatRegionName({ country: "VNM", raw: "  QuảngBình ", level: "adm1-63" })).toBe("꽝빈 (QuảngBình)");
    expect(formatRegionName({ country: "VNM", raw: "tỉnh Lâm Đồng" })).toBe("럼동 (tỉnh Lâm Đồng)");
  });

  test("map labels take the Korean name alone", () => {
    expect(formatRegionName({ country: "VNM", raw: "Hồ Chí Minh", mode: "label" })).toBe("호찌민");
    expect(formatRegionName({ country: "VNM", raw: "Singapore", mode: "label" })).toBe("Singapore");
  });

  test("brackets are dropped when the names are the same; unknown names stay as written", () => {
    expect(composeRegionNameV161("다카", "다카")).toBe("다카");
    expect(composeRegionNameV161(null, "Singapore")).toBe("Singapore");
    expect(formatRegionName({ country: "VNM", raw: "Singapore" })).toBe("Singapore");
    expect(formatRegionName({ country: "VNM", raw: "하노이" })).toBe("하노이");
    expect(formatRegionName({ country: "KHM", raw: "Phnom Penh" })).toBe("Phnom Penh");
    expect(formatRegionName({ country: "VNM", raw: "" })).toBe("");
  });

  test("a pre-2025 province carries the unit it merged into", () => {
    expect(regionMergeNoteV161({ country: "VNM", raw: "Yên Bái" })).toBe("2025.7.1 라오까이로 통합");
    expect(regionMergeNoteV161({ country: "VNM", raw: "Bình Dương" })).toBe("2025.7.1 호찌민으로 통합");
    expect(regionMergeNoteV161({ country: "VNM", raw: "Kon Tum" })).toBe("2025.7.1 꽝응아이로 통합");
    expect(regionMergeNoteV161({ country: "VNM", raw: "An Giang" })).toBe("2025.7.1 안장으로 통합");
    expect(regionMergeNoteV161({ country: "VNM", raw: "Lai Châu" })).toBeNull();
    expect(regionMergeNoteV161({ country: "BGD", raw: "Dhaka" })).toBeNull();
  });
});

describe("Bangladesh", () => {
  const DIVISIONS: Record<string, string> = {
    Barisal: "바리살", Chittagong: "치타공", Dhaka: "다카", Khulna: "쿨나",
    Mymensingh: "마이멘싱", Rajshahi: "라지샤히", Rangpur: "랑푸르", Sylhet: "실렛",
  };

  test("the 8 divisions, in the source spelling and the 2018 spellings", () => {
    for (const [local, ko] of Object.entries(DIVISIONS)) {
      expect(formatRegionName({ country: "BGD", raw: local, level: "division" })).toBe(`${ko} (${local})`);
    }
    expect(formatRegionName({ country: "BGD", raw: "Barishal", level: "division" })).toBe("바리살 (Barishal)");
    expect(formatRegionName({ country: "BGD", raw: "Chattogram", level: "division" })).toBe("치타공 (Chattogram)");
    expect(formatRegionName({ country: "BGD", raw: "Dhaka Division" })).toBe("다카 (Dhaka Division)");
  });

  test("64 districts, each under one of the 8 divisions", () => {
    const divisions = entries("BGD").filter((entry) => entry.level === "division");
    const districts = entries("BGD").filter((entry) => entry.level === "district");
    expect(divisions).toHaveLength(8);
    expect(divisions.every((entry) => entry.reviewStatus === "confirmed")).toBe(true);
    expect(districts).toHaveLength(64);
    expect(districts.every((entry) => Object.keys(DIVISIONS).includes(entry.parent || ""))).toBe(true);
    expect(formatRegionName({ country: "BGD", raw: "Cox's Bazar", level: "district" })).toBe("콕스바자르 (Cox's Bazar)");
    expect(formatRegionName({ country: "BGD", raw: "Jashore", level: "district" })).toBe("조쇼르 (Jashore)");
  });
});

describe("the generated dictionary", () => {
  test("matches the tables it was built from", () => {
    const byLevel = (level: string) => entries("VNM").filter((entry) => entry.level === level);
    expect(Object.fromEntries(byLevel("adm1-63").map((entry) => [entry.code, entry.ko]))).toEqual(PROVINCE_KO_V150);
    expect(byLevel("adm1-34").map((entry) => [entry.code, entry.local, entry.ko]).sort()).toEqual(
      ADM1_34_UNITS_V151.map((unit) => [unit.unitCode, unit.name, unit.nameKo]).sort()
    );
    expect(byLevel("city").map((entry) => entry.ko).sort()).toEqual(MAP_CITIES_V151.map((city) => city.name).sort());
  });

  test("rule-based names are pending and never shadow a province or city", () => {
    const dictionaryKeys = new Set(entries("VNM").filter((entry) => entry.level !== "locality").flatMap((entry) => entry.keys));
    for (const entry of entries("VNM").filter((row) => row.source === "nikl-vi-rule")) {
      expect(entry.level).toBe("locality");
      expect(entry.reviewStatus).toBe("pending");
      expect(entry.keys.some((key) => dictionaryKeys.has(key))).toBe(false);
    }
  });

  test("every entry is found by its own local name (generator and module normalise alike)", () => {
    for (const country of ["VNM", "BGD"] as const) {
      for (const entry of entries(country)) {
        expect(entry.keys).toContain(regionNameKeyV161(entry.local));
        expect(regionNameEntryV161({ country, raw: entry.local, level: entry.level })?.ko).toBe(entry.ko);
      }
    }
  });
});
