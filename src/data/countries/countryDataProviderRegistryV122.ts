import type { CountryDataProviderV122 } from "./countryDataTypesV122";
import { VietnamCountryDataProviderV122 } from "./vietnamCountryDataProviderV122";
import {
  countryRegistryCacheV158,
  hasCountryDataV166,
  isLiveCountryV158,
  loadCountryRegistryV158,
  type CountryRegistryV158,
} from "../countryContext";
import { publicAssetUrlV128 } from "../../utils/publicAssetUrlV128";
import { createRegistryCountryDataProviderV158 } from "./registryCountryDataProviderV158";

/**
 * The default country's provider is bundled. V158: every other country in the
 * registry gets a provider once `countries.json` has been read (see
 * `syncRegistryProvidersV158`), so a country is added by the registry alone.
 */
const PROVIDERS: CountryDataProviderV122[] = [VietnamCountryDataProviderV122];

const PROVIDER_BY_COUNTRY = new Map(
  PROVIDERS.map((provider) => [provider.countryIso3, provider])
);
const PROVIDER_BY_ID = new Map(
  PROVIDERS.map((provider) => [provider.providerId, provider])
);

let syncedRegistryV158: CountryRegistryV158 | null = null;

/** Adds a provider for each registry country that has none yet. */
function syncRegistryProvidersV158(): void {
  const registry = countryRegistryCacheV158();
  if (!registry || registry === syncedRegistryV158) return;
  syncedRegistryV158 = registry;
  // V166: a country only named so far (a "공개 예정" row) has no data root and
  // no bbox to build a provider from; it gets one when its data fields land.
  for (const entry of registry.countries.filter(hasCountryDataV166)) {
    if (PROVIDER_BY_COUNTRY.has(entry.iso3)) continue;
    const provider = createRegistryCountryDataProviderV158(entry);
    PROVIDERS.push(provider);
    PROVIDER_BY_COUNTRY.set(provider.countryIso3, provider);
    PROVIDER_BY_ID.set(provider.providerId, provider);
  }
}

export function listCountryDataProvidersV122(): CountryDataProviderV122[] {
  syncRegistryProvidersV158();
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
  syncRegistryProvidersV158();
  if (!isLiveCountryV158(normalized)) return null;
  return PROVIDER_BY_COUNTRY.get(normalized) || null;
}

/**
 * Reads the country registry once, so the statuses above come from the file
 * rather than from the bundled fallback. The data facade awaits this before it
 * resolves a catalog; a failure leaves the fallback in place.
 */
export function ensureCountryRegistryLoadedV158(): Promise<unknown> {
  return loadCountryRegistryV158((relPath) => publicAssetUrlV128(relPath)).then((registry) => {
    syncRegistryProvidersV158();
    return registry;
  });
}

export function getCountryDataProviderByIdV122(
  providerId: string | null | undefined
): CountryDataProviderV122 | null {
  syncRegistryProvidersV158();
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
  syncRegistryProvidersV158();
  return PROVIDERS.filter(
    (provider) =>
      provider.availability === "available" && isLiveCountryV158(provider.countryIso3)
  ).map((provider) => provider.countryIso3);
}
