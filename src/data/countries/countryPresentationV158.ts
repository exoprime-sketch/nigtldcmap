/**
 * V158: how a country's delivery is presented - which entity columns hold
 * region names (`<dataRoot>/presentation-v158.json`, written by the country's
 * ETL builder). A region cell on a screen for a country other than the default
 * is shown as "한글명 (로마자)": the bracket never holds a non-Latin local name
 * (user rule, 2026-09-29). The delivered value in the packs and downloads is
 * not changed. The default country has no such file and nothing changes there.
 */
import { useEffect, useState } from "react";
import { publicAssetUrlV128 } from "../../utils/publicAssetUrlV128";
import { DEFAULT_COUNTRY_ISO3_V158, countryAssetPathV158, normalizeCountryIso3V158 } from "../countryContext";
import { formatRegionForDisplayV158, hasNonLatinLetterV158 } from "../geo/regionDisplayV158";

export interface CountryPresentationV158 {
  country: string;
  regionColumns: ReadonlySet<string>;
  /** The ordered region columns; the first Latin value among them is the romanised name. */
  regionColumnOrder: readonly string[];
  listSeparator: string;
}

const requests = new Map<string, Promise<CountryPresentationV158 | null>>();

export function loadCountryPresentationV158(country: string | null | undefined): Promise<CountryPresentationV158 | null> {
  const iso3 = normalizeCountryIso3V158(country) || DEFAULT_COUNTRY_ISO3_V158;
  if (iso3 === DEFAULT_COUNTRY_ISO3_V158) return Promise.resolve(null);
  let request = requests.get(iso3);
  if (!request) {
    request = fetch(publicAssetUrlV128(countryAssetPathV158(iso3, "presentation-v158.json")))
      .then(async (response) => {
        if (!response.ok) return null;
        const text = await response.text();
        if (/^\s*</u.test(text)) return null;
        const document = JSON.parse(text) as { regionColumns?: unknown; listSeparator?: unknown };
        const order = Array.isArray(document.regionColumns)
          ? document.regionColumns.filter((value): value is string => typeof value === "string")
          : [];
        return {
          country: iso3,
          regionColumns: new Set(order),
          regionColumnOrder: order,
          listSeparator: typeof document.listSeparator === "string" ? document.listSeparator : "",
        };
      })
      .catch(() => null);
    requests.set(iso3, request);
  }
  return request;
}

/** The country's presentation, or null (default country, or not loaded yet). */
export function useCountryPresentationV158(country: string | null | undefined): CountryPresentationV158 | null {
  const [presentation, setPresentation] = useState<CountryPresentationV158 | null>(null);
  useEffect(() => {
    let alive = true;
    setPresentation(null);
    void loadCountryPresentationV158(country).then((value) => {
      if (alive) setPresentation(value);
    });
    return () => {
      alive = false;
    };
  }, [country]);
  return presentation;
}

/**
 * A cell as shown: unchanged unless the column holds region names, in which
 * case each name (a list is split on the declared separator) gets its Korean
 * name and a Latin-only bracket.
 */
export function displayRegionCellV158(
  column: string,
  value: unknown,
  attributes: Record<string, unknown>,
  presentation: CountryPresentationV158 | null
): unknown {
  if (!presentation || !presentation.regionColumns.has(column) || typeof value !== "string" || !value.trim()) {
    return value;
  }
  const romanised = presentation.regionColumnOrder
    .map((name) => attributes[name])
    .find((candidate): candidate is string => typeof candidate === "string" && candidate.trim() !== "" && !hasNonLatinLetterV158(candidate));
  const format = (raw: string, withRomanised: boolean) =>
    formatRegionForDisplayV158({
      country: presentation.country,
      raw: raw.trim(),
      romanised: withRomanised ? romanised ?? null : null,
      mode: "full",
    }).text;
  const separator = presentation.listSeparator;
  if (separator && value.includes(separator)) {
    return value
      .split(separator)
      .map((part) => part.trim())
      .filter(Boolean)
      .map((part) => format(part, false))
      .join(` ${separator} `);
  }
  return format(value, true);
}
