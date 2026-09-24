import type { CountryDataProviderV122 } from "./countryDataTypesV122";
import { VietnamCountryDataProviderV122 } from "./vietnamCountryDataProviderV122";
import {
  isLiveCountryV158,
  loadCountryRegistryV158,
} from "../countryContext";
import { publicAssetUrlV128 } from "../../utils/publicAssetUrlV128";

const PROVIDERS: CountryDataProviderV122[] = [VietnamCountryDataProviderV122];

const PROVIDER_BY_COUNTRY = new Map(
  PROVIDERS.map((provider) => [provider.countryIso3, provider])
);
const PROVIDER_BY_ID = new Map(
  PROVIDERS.map((provider) => [provider.providerId, provider])
);

export function listCountryDataProvidersV122(): CountryDataProviderV122[] {
  return PROVIDERS.filter((provider) => isLiveCountryV158(provider.countryIso3));
}

/**
 * V158: a country is served only when it has a provider **and** the registry
 * (`public/data/countries.json`) says it is live. Bangladesh is declared there
 * with `status: "preparing"` before its data lands, so a `?country=BGD` link -
 * or a provider added early - cannot start serving a half-built tree. Vietnam is
 * live, so this changes nothing for what is published today.
 */
export function getCountryDataProviderV122(
  countryIso3: string | null | undefined
): CountryDataProviderV122 | null {
  const normalized = countryIso3?.trim().toUpperCase() || "";
  if (!isLiveCountryV158(normalized)) return null;
  return PROVIDER_BY_COUNTRY.get(normalized) || null;
}

/**
 * Reads the country registry once, so the statuses above come from the file
 * rather than from the bundled fallback. The data facade awaits this before it
 * resolves a catalog; a failure leaves the fallback in place.
 */
export function ensureCountryRegistryLoadedV158(): Promise<unknown> {
  return loadCountryRegistryV158((relPath) => publicAssetUrlV128(relPath));
}

export function getCountryDataProviderByIdV122(
  providerId: string | null | undefined
): CountryDataProviderV122 | null {
  return providerId ? PROVIDER_BY_ID.get(providerId) || null : null;
}

export function hasCountryDataProviderV122(
  countryIso3: string | null | undefined
): boolean {
  return getCountryDataProviderV122(countryIso3) !== null;
}

export function firstCountryDataProviderV122(): CountryDataProviderV122 | null {
  return PROVIDERS[0] || null;
}

export function availableDataCountryIso3V122(): string[] {
  return PROVIDERS.filter(
    (provider) =>
      provider.availability === "available" && isLiveCountryV158(provider.countryIso3)
  ).map((provider) => provider.countryIso3);
}
