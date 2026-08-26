import type { CountryDataProviderV122 } from "./countryDataTypesV122";
import { VietnamCountryDataProviderV122 } from "./vietnamCountryDataProviderV122";

const PROVIDERS: CountryDataProviderV122[] = [VietnamCountryDataProviderV122];

const PROVIDER_BY_COUNTRY = new Map(
  PROVIDERS.map((provider) => [provider.countryIso3, provider])
);
const PROVIDER_BY_ID = new Map(
  PROVIDERS.map((provider) => [provider.providerId, provider])
);

export function listCountryDataProvidersV122(): CountryDataProviderV122[] {
  return [...PROVIDERS];
}

export function getCountryDataProviderV122(
  countryIso3: string | null | undefined
): CountryDataProviderV122 | null {
  const normalized = countryIso3?.trim().toUpperCase() || "";
  return PROVIDER_BY_COUNTRY.get(normalized) || null;
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
    (provider) => provider.availability === "available"
  ).map((provider) => provider.countryIso3);
}
