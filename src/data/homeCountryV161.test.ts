import { describe, expect, test } from "@jest/globals";
import { readFileSync } from "fs";
import { resolve } from "path";
import type { CountryRegistryEntryV158 } from "./countryContext";
import { resolveHomeCountryV161 } from "./homeCountryV161";

// The published registry, as the home reads it (VNM live, BGD preparing).
const REGISTRY = JSON.parse(readFileSync(resolve(__dirname, "../../public/data/countries.json"), "utf8")).countries as CountryRegistryEntryV158[];
const defaultLive = REGISTRY.find((country) => country.status === "live")!;

describe("home current country (?country= + registry)", () => {
  test("no parameter → the registry's default public country", () => {
    expect(resolveHomeCountryV161("", REGISTRY)?.iso3).toBe(defaultLive.iso3);
  });

  test("a public country → that country, named from the registry", () => {
    const current = resolveHomeCountryV161(`?country=${defaultLive.iso3.toLowerCase()}`, REGISTRY);
    expect(current?.iso3).toBe(defaultLive.iso3);
    expect(current?.nameKo).toBe(defaultLive.nameKo);
  });

  // V162 PR-D (2026-10-03): Bangladesh is public. The fallback for a country
  // still being prepared is checked on a registry row marked so.
  test("a public second country (BGD) is kept", () => {
    expect(REGISTRY.find((country) => country.iso3 === "BGD")?.status).toBe("live");
    expect(resolveHomeCountryV161("?country=BGD", REGISTRY)?.iso3).toBe("BGD");
  });

  test("a country still being prepared → back to the default public country", () => {
    const preparing = REGISTRY.map((country) => (country.iso3 === "BGD" ? { ...country, status: "preparing" as const } : country));
    expect(resolveHomeCountryV161("?country=BGD", preparing)?.iso3).toBe(defaultLive.iso3);
  });

  test("an unknown code → the default public country", () => {
    expect(resolveHomeCountryV161("?country=XYZ", REGISTRY)?.iso3).toBe(defaultLive.iso3);
  });

  test("the scope line lists every public country, and none when nothing is public", () => {
    expect(resolveHomeCountryV161("", REGISTRY)?.live.map((country) => country.iso3)).toEqual(
      REGISTRY.filter((country) => country.status === "live").map((country) => country.iso3)
    );
    expect(resolveHomeCountryV161("", REGISTRY.map((country) => ({ ...country, status: "preparing" as const })))).toBeNull();
  });
});
