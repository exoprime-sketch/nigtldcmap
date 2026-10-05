import type { CountryRegistryEntryV158 } from "../countryContext";
import { bundledCountryRegistryV158, countryRegistryCacheV158, hasCountryDataV166, normalizeCountryIso3V158 } from "../countryContext";
import {
  composeRegionNameV161,
  formatRegionName,
  regionNameEntryV161,
  regionNameKeyV161,
  regionNameLocal,
  type RegionLevelV161,
} from "./regionNameV161";

/**
 * V158-B2 WP3: a region-name display wrapper for countries whose source data
 * mixes a non-Latin local script with the Korean name (Bangladesh's Bengali
 * columns, "বাংলাদেশ (Bangladesh)"). The house style keeps "한글명 (현지명)" with
 * the bracket in the source's own spelling; a Bengali bracket would leave a
 * script most readers cannot render or compare against the map, and MapLibre's
 * glyph set has no Bengali either. This module never invents a romanisation -
 * it only ever uses text the source, the ETL's romanised columns or the
 * regionNameV161 dictionary already supplied, and says so (`romanisedMissing`)
 * when none of them had one.
 *
 * For a plain Latin/Vietnamese name it delegates to {@link formatRegionName}
 * untouched, so Vietnam's screens are exactly as before.
 */

export interface RegionDisplayInputV158 {
  /** ISO3 of the data country ("VNM", "BGD"), any case. */
  readonly country: string;
  /** The place name exactly as the source wrote it. */
  readonly raw: string | null | undefined;
  /** Which regionNameV161 list to try (see {@link RegionLevelV161}). */
  readonly level?: string;
  /**
   * A Latin spelling of the same place from the ETL's own romanised column
   * (see tools/etl/countries/<iso3>/region-columns.json), when the caller has one.
   */
  readonly romanised?: string | null;
  readonly mode?: "full" | "label";
}

export interface RegionDisplayResultV158 {
  readonly text: string;
  /** True only when no Latin spelling was found anywhere and the raw local name had to be shown as is. */
  readonly romanisedMissing: boolean;
}

// Latin letters (with diacritics, composed or combining), Hangul, ASCII
// digits, whitespace and the punctuation ordinary place names carry. Bengali,
// Arabic, Devanagari and every other non-Latin script fail this test, which is
// the point: it is how a bracket that must stay Latin-only is told apart from
// one that already is.
const ALLOWED_REGION_CHARS_V158 =
  "\\p{Script=Latin}\\p{Script=Hangul}\\p{Mn}0-9\\s" + ".,'’‘“”\"()\\[\\]{}/&·:;!?°%–—-";
const NON_LATIN_PATTERN_V158 = new RegExp(`[^${ALLOWED_REGION_CHARS_V158}]`, "u");

/** Whether `text` has any character outside Latin/Hangul/digits/whitespace/common punctuation. */
export function hasNonLatinLetterV158(text: string): boolean {
  return NON_LATIN_PATTERN_V158.test(String(text ?? "").normalize("NFC"));
}

/** The first parenthesised group in `text` that is itself pure Latin, e.g. "বাংলাদেশ (Bangladesh)" → "Bangladesh". */
function parenLatinFragmentV158(text: string): string | null {
  const groups = text.match(/\(([^()]+)\)/gu);
  if (!groups) return null;
  for (const group of groups) {
    const fragment = group.slice(1, -1).trim();
    if (fragment && !hasNonLatinLetterV158(fragment)) return fragment;
  }
  return null;
}

function countryRegistryEntryV158(iso3: string): CountryRegistryEntryV158 | null {
  const registry = countryRegistryCacheV158() ?? bundledCountryRegistryV158();
  const row = registry.countries.find((entry) => entry.iso3 === iso3);
  return row && hasCountryDataV166(row) ? row : null;
}

/**
 * `candidate` denotes the country itself (a whole-country row such as
 * B-035/B-036's "지역명" holding "বাংলাদেশ (Bangladesh)"), by the same
 * key normalisation regionNameV161 already uses for province/city spellings.
 * The registry is read through the cache the app itself fills at runtime
 * (loadCountryRegistryV158); nothing here is hardcoded.
 */
function countryLevelKoV158(candidate: string, iso3: string): string | null {
  const key = regionNameKeyV161(candidate);
  if (!key) return null;
  const entry = countryRegistryEntryV158(iso3);
  if (!entry) return null;
  const matches = [entry.iso3, entry.nameEn, entry.nameKo].some(
    (name) => name && regionNameKeyV161(name) === key
  );
  return matches ? entry.nameKo : null;
}

/**
 * The display form for a region name that may arrive in a non-Latin script.
 * Plain Latin/Vietnamese input is handed to {@link formatRegionName} as is.
 */
export function formatRegionForDisplayV158(input: RegionDisplayInputV158): RegionDisplayResultV158 {
  const iso3 = normalizeCountryIso3V158(input.country);
  const local = regionNameLocal(input.raw);
  if (!local) return { text: local, romanisedMissing: false };

  const asCountryName = countryLevelKoV158(local, iso3);
  if (asCountryName) return { text: asCountryName, romanisedMissing: false };

  const level = input.level as RegionLevelV161 | undefined;
  if (!hasNonLatinLetterV158(local)) {
    return {
      text: formatRegionName({ country: input.country, raw: input.raw, level, mode: input.mode }),
      romanisedMissing: false,
    };
  }

  // In order: a Latin fragment already in the source's own parentheses, the
  // ETL's romanised column, then whatever Latin spelling the dictionary keeps
  // for this place (found through whatever Latin remnant `local` itself keys
  // to - useful when the source mixes scripts without parentheses).
  const romanisedClean =
    (input.romanised && !hasNonLatinLetterV158(input.romanised) && regionNameLocal(input.romanised)) || null;
  const dictionaryEntry = regionNameEntryV161({ country: input.country, raw: local, level });
  const dictionaryLocal =
    (dictionaryEntry?.local && !hasNonLatinLetterV158(dictionaryEntry.local) && dictionaryEntry.local) || null;
  const substitute = parenLatinFragmentV158(local) ?? romanisedClean ?? dictionaryLocal;

  // V162 (P12-B): a name still under review is never shown in Korean - only
  // a confirmed dictionary entry gives the Korean name.
  const confirmedKo = (raw: string | null): string | null => {
    if (!raw) return null;
    const entry = regionNameEntryV161({ country: input.country, raw, level });
    return entry && entry.reviewStatus === "confirmed" ? entry.ko : null;
  };
  const ko =
    confirmedKo(substitute) ??
    confirmedKo(local) ??
    (dictionaryEntry && dictionaryEntry.reviewStatus === "confirmed" ? dictionaryEntry.ko : null) ??
    null;

  if (!substitute) {
    // Never invent a romanisation: without one, the Korean name alone is
    // shown when known, and the caller is told none was found.
    return { text: ko ?? local, romanisedMissing: true };
  }
  return {
    text: input.mode === "label" ? ko || substitute : composeRegionNameV161(ko, substitute),
    romanisedMissing: false,
  };
}
