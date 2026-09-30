import { bundledCountryRegistryV158, countryRegistryCacheV158, DEFAULT_COUNTRY_ISO3_V158 } from "../countryContext";
import { useDataCountryV158 } from "./DataCountryContextV158";

/** A registry country's level-1 administrative unit: its word and count. */
export interface CountryLevel1V158 {
  readonly label: string;
  readonly count: number;
}

/**
 * V158-B2b: a country's level-1 unit as the registry states it
 * (`adm.level1.label`/`count`) - Viet Nam "성·시", Bangladesh "Division".
 */
export function countryLevel1V158(country: string): CountryLevel1V158 | null {
  const registry = countryRegistryCacheV158() ?? bundledCountryRegistryV158();
  const level1 = registry.countries.find((row) => row.iso3 === country)?.adm?.level1;
  return level1?.label ? { label: level1.label, count: Number(level1.count) || 0 } : null;
}

/** The default country's reviewed copy names its level-1 unit this way. */
const DEFAULT_REGION_WORD_V158 = "성·시";

/**
 * The word the page's country uses for its level-1 unit. The default
 * country's pages keep their reviewed wording (the bundled registry, read
 * before `countries.json` arrives, has no label); `level1` is null there, so a
 * caller can keep default-only copy (the 63-province note) for it alone.
 */
export function regionWordV158(country: string | null | undefined): { word: string; level1: CountryLevel1V158 | null } {
  const iso3 = String(country || DEFAULT_COUNTRY_ISO3_V158).trim().toUpperCase();
  const level1 = iso3 === DEFAULT_COUNTRY_ISO3_V158 ? null : countryLevel1V158(iso3);
  return { word: level1?.label || DEFAULT_REGION_WORD_V158, level1 };
}

/** `regionWordV158` for the page's country (`DataCountryProviderV158`). */
export function useRegionWordV158(): { word: string; level1: CountryLevel1V158 | null } {
  return regionWordV158(useDataCountryV158());
}

/**
 * The subject particle after a level-1 word: "성·시가", "Division이". A Korean
 * word is judged by its last syllable's final consonant; a Latin one by
 * whether it ends in a vowel letter ("Province가").
 */
export function subjectParticleV158(word: string): "이" | "가" {
  const last = word.trim().slice(-1);
  const code = last.charCodeAt(0);
  if (code >= 0xac00 && code <= 0xd7a3) return (code - 0xac00) % 28 === 0 ? "가" : "이";
  return /[aeiouy]$/iu.test(last) ? "가" : "이";
}

