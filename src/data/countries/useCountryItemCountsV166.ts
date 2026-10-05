import { useEffect, useState } from "react";
import { loadCatalogForCountrySelectionV122 } from "./countryDataFacadeV122";

const itemCountCacheV166 = new Map<string, Promise<number>>();

/**
 * The public item count of each country, the number its home shows ("전체
 * 데이터 항목"): the length of the same filtered catalog. Read when first
 * needed and kept; nothing is written into the registry by hand.
 *
 * V166: only the guide's "제공 국가" table shows it ("제공 내용"); the country
 * pickers name the countries without a count (user decision 2026-10-05), so
 * no screen loads another country's catalog just to count it.
 */
export function useCountryItemCountsV166(iso3s: string[], enabled: boolean): Record<string, number> {
  const [counts, setCounts] = useState<Record<string, number>>({});
  const key = iso3s.join(",");
  useEffect(() => {
    if (!enabled) return;
    let alive = true;
    key.split(",").filter(Boolean).forEach((iso3) => {
      let request = itemCountCacheV166.get(iso3);
      if (!request) {
        request = loadCatalogForCountrySelectionV122(iso3).then((catalog) => catalog.length);
        itemCountCacheV166.set(iso3, request);
        request.catch(() => itemCountCacheV166.delete(iso3));
      }
      void request
        .then((count) => {
          if (alive) setCounts((current) => (current[iso3] === count ? current : { ...current, [iso3]: count }));
        })
        .catch(() => undefined);
    });
    return () => {
      alive = false;
    };
  }, [key, enabled]);
  return counts;
}
