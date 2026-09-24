import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, resolve } from "node:path";

import {
  DEFAULT_COUNTRY_ISO3_V158,
  bundledCountryRegistryV158,
  countryDataRootV158,
  dataCountryParamV158,
  dataUrl,
  isLiveCountryV158,
} from "./countryContext";
import type { CountryRegistryV158 } from "./countryContext";

const ROOT = resolve(__dirname, "../..");
const registry = JSON.parse(
  readFileSync(resolve(ROOT, "public/data/countries.json"), "utf8")
) as CountryRegistryV158;

describe("country registry V158", () => {
  test("the bundled view matches public/data/countries.json", () => {
    const bundled = new Map(
      bundledCountryRegistryV158().countries.map((row) => [row.iso3, row])
    );
    expect([...bundled.keys()].sort()).toEqual(
      registry.countries.map((row) => row.iso3).sort()
    );
    registry.countries.forEach((row) => {
      expect(bundled.get(row.iso3)?.dataRoot).toBe(row.dataRoot);
      expect(bundled.get(row.iso3)?.status).toBe(row.status);
    });
  });

  test("Vietnam is live and Bangladesh is still preparing", () => {
    const byIso3 = new Map(registry.countries.map((row) => [row.iso3, row]));
    expect(byIso3.get("VNM")?.status).toBe("live");
    expect(byIso3.get("BGD")?.status).toBe("preparing");
    // The D category has no Bangladesh delivery yet, so it is not offered there.
    expect(byIso3.get("BGD")?.categoriesAvailable).not.toContain("D");
    expect(byIso3.get("VNM")?.categoriesAvailable).toEqual(["A", "B", "C", "D", "E"]);
  });

  test("?country= accepts a live country and refuses one that is preparing", () => {
    expect(dataCountryParamV158("VNM")).toBe("VNM");
    expect(dataCountryParamV158("vnm")).toBe("VNM");
    // Bangladesh is declared but not offered yet: the caller falls back.
    expect(dataCountryParamV158("BGD")).toBeNull();
    expect(dataCountryParamV158("KHM")).toBeNull();
    expect(dataCountryParamV158("")).toBeNull();
    expect(dataCountryParamV158(null)).toBeNull();
    expect(isLiveCountryV158(DEFAULT_COUNTRY_ISO3_V158)).toBe(true);
  });

  test("asset URLs are built from the registry, with or without a leading slash", () => {
    expect(countryDataRootV158("VNM")).toBe("/data/vietnam/v2");
    expect(dataUrl("VNM", "catalog.json")).toBe("/data/vietnam/v2/catalog.json");
    expect(dataUrl("VNM", "/catalog.json")).toBe("/data/vietnam/v2/catalog.json");
    expect(dataUrl("vnm", "geometry/vnm-adm1-34.geojson")).toBe(
      "/data/vietnam/v2/geometry/vnm-adm1-34.geojson"
    );
    // An unknown country is a programming error, not a fallback.
    expect(() => countryDataRootV158("ZZZ")).toThrow(/UNKNOWN_COUNTRY_DATA_ROOT/u);
  });
});

/**
 * The point of the helper is that no screen writes the path itself. A new
 * literal anywhere under src/ would quietly tie that file to one country, so the
 * count is asserted rather than trusted.
 */
describe("no hand-written data roots under src/", () => {
  const ALLOWED = new Set([
    // The helper that owns the paths, and this test.
    join("src", "data", "countryContext.ts"),
    join("src", "data", "countryContext.test.ts"),
  ]);

  function walk(dir: string): string[] {
    return readdirSync(dir).flatMap((name) => {
      const full = join(dir, name);
      return statSync(full).isDirectory() ? walk(full) : [full];
    });
  }

  test("every asset path comes from dataUrl()", () => {
    const offenders = walk(resolve(ROOT, "src"))
      .filter((path) => /\.(ts|tsx)$/u.test(path))
      .map((path) => ({ path, relative: path.slice(resolve(ROOT).length + 1) }))
      .filter(({ relative }) => !ALLOWED.has(relative))
      .map(({ path, relative }) => ({
        relative,
        hits: readFileSync(path, "utf8")
          .split("\n")
          .map((line, index) => ({ line, number: index + 1 }))
          // Import paths such as "../data/vietnam/vietnamTypesV124" are source
          // files, not asset URLs; only the published data root is checked.
          .filter(({ line }) => /data\/(?:vietnam|bgd)\/v2/u.test(line)),
      }))
      .filter(({ hits }) => hits.length > 0)
      .map(({ relative, hits }) => `${relative}:${hits.map((hit) => hit.number).join(",")}`);
    expect(offenders).toEqual([]);
  });
});
