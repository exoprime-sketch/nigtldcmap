/**
 * V158: the offered country data providers, for a component.
 *
 * The bundled registry holds the default country only; the others are known
 * once `data/countries.json` has been read. A page that took the provider list
 * once at mount would keep the bundled list for its whole life, so a country
 * the registry offers would never appear in its selector. This hook returns the
 * list at mount and replaces it once after the registry has loaded - only when
 * the set of offered countries actually changed, so a page whose countries are
 * the same (the default country alone today) never renders again for it.
 */
import { useEffect, useState } from "react";

import type { CountryDataProviderV122 } from "./countryDataTypesV122";
import { ensureCountryRegistryLoadedV158, listCountryDataProvidersV122 } from "./countryDataProviderRegistryV122";

function providerKeyV158(providers: readonly CountryDataProviderV122[]): string {
  return providers.map((provider) => provider.providerId).join(",");
}

export function useCountryDataProvidersV158(): CountryDataProviderV122[] {
  const [providers, setProviders] = useState(() => listCountryDataProvidersV122());
  useEffect(() => {
    let alive = true;
    void ensureCountryRegistryLoadedV158().then(() => {
      if (!alive) return;
      const next = listCountryDataProvidersV122();
      setProviders((current) => (providerKeyV158(current) === providerKeyV158(next) ? current : next));
    });
    return () => {
      alive = false;
    };
  }, []);
  return providers;
}
