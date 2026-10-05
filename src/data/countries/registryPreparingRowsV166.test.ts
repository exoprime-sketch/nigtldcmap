import { describe, expect, it, beforeAll } from "@jest/globals";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { isLiveCountryV158, liveRegistryCountriesV166, loadCountryRegistryV158 } from "../countryContext";
import type { CountryRegistryV158 } from "../countryContext";
import {
  ensureCountryRegistryLoadedV158,
  getCountryDataProviderV122,
  listCountryDataProvidersV122,
} from "./countryDataProviderRegistryV122";
import { resolveHomeCountryV161 } from "../homeCountryV161";

/**
 * V166 (2026-10-05): the published registry names the ten priority countries;
 * the ones still being prepared are name-only rows (no data root, no bbox).
 * Reading it must leave every screen as it is for the public countries: a
 * provider is built for a country with data fields only (before V166 one was
 * built for every row, from its bbox - a name-only row would have thrown and
 * taken the whole app down), and a "공개 예정" country is never served.
 */
const published = JSON.parse(
  readFileSync(resolve(__dirname, "../../../public/data/countries.json"), "utf8")
) as CountryRegistryV158;

beforeAll(async () => {
  (globalThis as { fetch?: unknown }).fetch = async () => ({ ok: true, status: 200, json: async () => published });
  await loadCountryRegistryV158((path) => path);
  await ensureCountryRegistryLoadedV158();
});

describe("V166: the registry with countries being prepared", () => {
  const live = liveRegistryCountriesV166(published).map((row) => row.iso3);
  const preparing = published.countries.filter((row) => row.status === "preparing").map((row) => row.iso3);

  it("names countries being prepared next to the public ones", () => {
    expect(live.length).toBeGreaterThan(0);
    expect(preparing.length).toBeGreaterThan(0);
  });

  it("serves the public countries only, without failing on a name-only row", () => {
    expect(() => listCountryDataProvidersV122()).not.toThrow();
    expect(listCountryDataProvidersV122().map((provider) => provider.countryIso3).sort()).toEqual([...live].sort());
    preparing.forEach((iso3) => {
      expect(isLiveCountryV158(iso3)).toBe(false);
      expect(getCountryDataProviderV122(iso3)).toBeNull();
    });
  });

  it("a ?country= naming a country being prepared opens the default public country", () => {
    preparing.forEach((iso3) => {
      const home = resolveHomeCountryV161(`?country=${iso3}`);
      expect(home && live.includes(home.iso3)).toBe(true);
      expect(home?.live.map((row) => row.iso3)).toEqual(live);
    });
  });
});
