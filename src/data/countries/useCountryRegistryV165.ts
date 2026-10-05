import { useEffect, useState } from "react";
import { countryRegistryCacheV158 } from "../countryContext";
import type { CountryRegionV165, CountryRegistryRowV166 } from "../countryContext";
import { ensureCountryRegistryLoadedV158 } from "./countryDataProviderRegistryV122";

export type RegistryViewV165 = { countries: CountryRegistryRowV166[]; regions?: CountryRegionV165[] };

/**
 * The country registry once `countries.json` has been read; null before. The
 * bundled fallback names each country by its code only, so nothing is shown
 * from it.
 */
export function useCountryRegistryV165(): RegistryViewV165 | null {
  const [registry, setRegistry] = useState<RegistryViewV165 | null>(() => countryRegistryCacheV158());
  useEffect(() => {
    let alive = true;
    void ensureCountryRegistryLoadedV158()
      .catch(() => undefined)
      .then(() => {
        const loaded = countryRegistryCacheV158();
        if (alive && loaded) setRegistry(loaded);
      });
    return () => {
      alive = false;
    };
  }, []);
  return registry;
}
