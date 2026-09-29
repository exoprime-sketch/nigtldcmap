import { createContext, useContext, useMemo, type ReactNode } from "react";
import { DEFAULT_COUNTRY_ISO3_V158, normalizeCountryIso3V158 } from "../countryContext";
import {
  getCardSpecForCountryV158,
  getTypologyForCountryV158,
  type CountrySpecItemV158,
} from "../spec/countrySpecV158";
import type { DatasetCardSpecV159, TypologyRowV159 } from "../spec/specTypesV159";

/**
 * V158: the country whose data a screen is showing - and, on a detail page,
 * the catalog item - for components deep in a page (KPI strip, source panel,
 * analysis router and templates, status note) that were written for the
 * default country and take no country prop. Without a provider the default
 * country is returned, so every screen that does not set one behaves as before.
 */
interface DataCountryValueV158 {
  country: string;
  item: CountrySpecItemV158 | null;
}

const DataCountryContextV158 = createContext<DataCountryValueV158>({
  country: DEFAULT_COUNTRY_ISO3_V158,
  item: null,
});

export function DataCountryProviderV158({
  country,
  item = null,
  children,
}: {
  country: string | null | undefined;
  item?: CountrySpecItemV158 | null;
  children: ReactNode;
}) {
  const iso3 = normalizeCountryIso3V158(country) || DEFAULT_COUNTRY_ISO3_V158;
  const value = useMemo(() => ({ country: iso3, item }), [iso3, item]);
  return <DataCountryContextV158.Provider value={value}>{children}</DataCountryContextV158.Provider>;
}

export function useDataCountryV158(): string {
  return useContext(DataCountryContextV158).country;
}

/** The typology row as seen from the page's country and catalog item. */
export function useCountryTypologyV158(elementId: string): TypologyRowV159 | null {
  const { country, item } = useContext(DataCountryContextV158);
  const itemForElement = item && item.elementId === elementId ? item : null;
  return useMemo(
    () => getTypologyForCountryV158(elementId, country, itemForElement),
    [country, elementId, itemForElement]
  );
}

/** The card spec (name, source, one-line definition) as seen from the page's country. */
export function useCountryCardSpecV158(elementId: string): DatasetCardSpecV159 | null {
  const { country, item } = useContext(DataCountryContextV158);
  const itemForElement = item && item.elementId === elementId ? item : null;
  return useMemo(
    () => getCardSpecForCountryV158(elementId, country, itemForElement),
    [country, elementId, itemForElement]
  );
}
