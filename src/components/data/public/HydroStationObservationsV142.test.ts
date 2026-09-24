import { describe, expect, it } from "@jest/globals";
import { readFileSync } from "fs";
import { resolve } from "path";
import type { VietnamEntityV124 } from "../../../data/vietnam/vietnamTypesV124";
import { parseHydroRowV142, mergeHydroRowsV142, hydroSeasonPairsV142 } from "./HydroStationObservationsV142";
import { countryPublicDirV158 } from "../../../data/countryContext";

const source = (id: string): VietnamEntityV124[] => JSON.parse(readFileSync(resolve(__dirname, `../../../../${countryPublicDirV158("VNM")}/downloads/${id}.json`), "utf8")).entities;

describe("Hydro observations: keep source meaning and values", () => {
  it("compares two reviewed seasonal extreme pairs, never different years or shares", () => {
    const parsed = source("b-023").map(parseHydroRowV142);
    expect(parsed.filter((row) => !row.placeholder)).toHaveLength(10);
    const pairs = hydroSeasonPairsV142(mergeHydroRowsV142(parsed.filter((row) => !row.placeholder)));
    expect(pairs.map((pair) => [pair.site, pair.year, pair.dry.central, pair.wet.central, pair.ratio?.central])).toEqual([
      ["Kratie (Krâchéh)", 2004, 2290, 36700, 16],
      ["Sơn Tây", 2010, 700, 23000, 30],
    ]);
    expect(pairs.every((pair) => pair.unit === "m³/s")).toBe(true);
  });

  it("preserves the central estimate and explicit bounds", () => {
    const parsed = source("b-028").map(parseHydroRowV142);
    const observed = parsed.filter((row) => !row.placeholder);
    expect(observed).toHaveLength(15);
    expect(observed.filter((row) => row.national)).toHaveLength(4);
    expect(new Set(observed.filter((row) => !row.national).map((row) => row.site)).size).toBe(4);
    const merged = mergeHydroRowsV142(observed);
    expect(merged.find((row) => row.central === 14750)).toMatchObject({ min: 14500, max: 15000, central: 14750, year: 2004, unit: "m³/s" });
  });

  it("does not turn missing time/value into zero or duplicate estimates into a range", () => {
    const base = source("b-028")[3];
    const empty = parseHydroRowV142({ ...base, normalizedAttributes: { ...base.normalizedAttributes, 값: null, 기준연도: null } });
    expect(empty.year).toBeNull();
    expect(empty.value).toBeNull();
    expect(empty.placeholder).toBe(true);
    const first = parseHydroRowV142(base);
    const duplicate = { ...first, recordId: "second-estimate", value: 16000 };
    const merged = mergeHydroRowsV142([first, duplicate]);
    expect(merged).toHaveLength(2);
    expect(merged.map((row) => row.central)).toEqual([14750, 16000]);
    expect(merged.every((row) => row.min === null && row.max === null)).toBe(true);
  });

  it("rejects other measures and ambiguous duplicate dry/wet observations", () => {
    const merged = mergeHydroRowsV142(source("b-023").map(parseHydroRowV142));
    const dry = merged.find((row) => row.central === 2290)!;
    const wet = merged.find((row) => row.central === 36700)!;
    expect(hydroSeasonPairsV142([dry, { ...wet, year: 2005 }])).toHaveLength(0);
    expect(hydroSeasonPairsV142([dry, { ...wet, base: "우기 평균유량" }])).toHaveLength(0);
    expect(hydroSeasonPairsV142([dry, { ...dry, central: 2000 }, wet])).toHaveLength(0);
  });
});
