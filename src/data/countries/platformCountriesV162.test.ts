import { expect, test } from "@jest/globals";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { PLATFORM_COUNTRY_ISO3_V162 } from "./platformCountriesV162";

test("the platform country list equals the country registry", () => {
  const registry = JSON.parse(readFileSync(resolve(__dirname, "../../../public/data/countries.json"), "utf8"));
  expect([...PLATFORM_COUNTRY_ISO3_V162].sort()).toEqual(registry.countries.map((row: { iso3: string }) => row.iso3).sort());
});
