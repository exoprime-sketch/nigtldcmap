import { expect, test } from "@jest/globals";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { PLATFORM_COUNTRY_ISO3_V162 } from "./platformCountriesV162";

// V166 (2026-10-05): the registry now also names the countries still being
// prepared; the glossary's country tags are for the countries that have
// screens, so the list equals the registry's public ("live") countries.
test("the platform country list equals the registry's public countries", () => {
  const registry = JSON.parse(readFileSync(resolve(__dirname, "../../../public/data/countries.json"), "utf8"));
  const live = registry.countries.filter((row: { status: string }) => row.status === "live").map((row: { iso3: string }) => row.iso3);
  expect([...PLATFORM_COUNTRY_ISO3_V162].sort()).toEqual(live.sort());
});
