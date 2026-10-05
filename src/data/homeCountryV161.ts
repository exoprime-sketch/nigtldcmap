import {
  bundledCountryRegistryV158,
  countryRegistryCacheV158,
  DEFAULT_COUNTRY_ISO3_V158,
  liveRegistryCountriesV166,
} from "./countryContext";
import type { CountryRegistryRowV166 } from "./countryContext";

/**
 * The home's current country. Nothing here names a country: which countries
 * exist, which are public and what they are called come from the country
 * registry (public/data/countries.json); the home reads that country's own
 * data tree for every figure.
 */
export interface HomeCountryV161 {
  iso3: string;
  nameKo: string;
  /** Every public ("live") country, in registry order. */
  live: { iso3: string; nameKo: string }[];
}

/**
 * `?country=` when it names a public country, otherwise the registry's default
 * public country (a country still being prepared, or an unknown code, falls
 * back to it). Null only when no country is public at all.
 */
export function resolveHomeCountryV161(
  search: string,
  countries: CountryRegistryRowV166[] = (countryRegistryCacheV158() || bundledCountryRegistryV158()).countries
): HomeCountryV161 | null {
  const live = liveRegistryCountriesV166({ countries });
  if (live.length === 0) return null;
  const requested = (new URLSearchParams(search).get("country") || "").trim().toUpperCase();
  const chosen =
    live.find((country) => country.iso3 === requested) ||
    live.find((country) => country.iso3 === DEFAULT_COUNTRY_ISO3_V158) ||
    live[0];
  return {
    iso3: chosen.iso3,
    nameKo: chosen.nameKo,
    live: live.map((country) => ({ iso3: country.iso3, nameKo: country.nameKo })),
  };
}
