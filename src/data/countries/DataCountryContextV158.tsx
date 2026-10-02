import { createContext, useContext, useMemo, type ReactNode } from "react";
import { DEFAULT_COUNTRY_ISO3_V158, dataCountryParamV158, normalizeCountryIso3V158 } from "../countryContext";
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
  /** V162: whether a provider set the country (false = the default value). */
  provided: boolean;
}

const DataCountryContextV158 = createContext<DataCountryValueV158>({
  country: DEFAULT_COUNTRY_ISO3_V158,
  item: null,
  provided: false,
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
  const value = useMemo(() => ({ country: iso3, item, provided: true }), [iso3, item]);
  return <DataCountryContextV158.Provider value={value}>{children}</DataCountryContextV158.Provider>;
}

export function useDataCountryV158(): string {
  return useContext(DataCountryContextV158).country;
}

/**
 * V162: the country a page shows, for shared screens without a provider (the
 * guide's glossary, a term tooltip on the home or finder): the provider's
 * country when there is one, else the live country in the address, else the
 * default country.
 */
export function usePageDataCountryV162(): string {
  const value = useContext(DataCountryContextV158);
  if (value.provided) return value.country;
  if (typeof window === "undefined") return DEFAULT_COUNTRY_ISO3_V158;
  return dataCountryParamV158(new URLSearchParams(window.location.search).get("country")) || DEFAULT_COUNTRY_ISO3_V158;
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
