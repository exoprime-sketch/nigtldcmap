/**
 * V158-B2 WP2: the "other country" terms a spec-text screen must not show.
 *
 * `datasetSpecV159.json` / `useCasesV159.json` / `datasetCardSpecV159.json` were
 * authored for Viet Nam (`useCasesV159.json.registryCountries === ["VNM"]`). When
 * the same text is shown on a screen for a different country (Bangladesh today,
 * more later), any paragraph or use case that names a *different* country must be
 * hidden - never rewritten, never fabricated, just left out. This module answers
 * one question: for a displayed country, which strings count as "another
 * country's terms"?
 *
 * Nothing here hardcodes a country or place name. `buildOtherCountryTermsV158`
 * and `findCountryTermsV158` are pure functions over whatever country/region
 * rows are handed to them, proven in the test file with a fake three-country
 * registry. `otherCountryTermsV158` is the runtime convenience that supplies
 * those rows from the platform's own sources: the country registry cache
 * (`countryContext.ts`, falling back to the bundled placeholder before the
 * registry has loaded), `PRIORITY_COUNTRIES` for the Korean names of countries
 * the registry does not carry yet, `FALLBACK_COUNTRIES`
 * (`src/data/countries.ts`) for their English names, and the confirmed rows of
 * the region-name dictionary (`regionNamesV161.json`) for place names. A
 * Node-side report script that reads a specific `countries.json` snapshot off
 * disk (rather than the browser's fetched cache) should call
 * {@link unionRegistryCountriesV158} and {@link confirmedRegionEntriesV158}
 * directly and pass the result to {@link buildOtherCountryTermsV158}, so it
 * never re-types a country name either.
 */

import {
  bundledCountryRegistryV158,
  countryRegistryCacheV158,
  normalizeCountryIso3V158,
  type CountryRegistryV158,
} from "../countryContext";
import { FALLBACK_COUNTRIES } from "../countries";
import { PRIORITY_COUNTRIES } from "../priorityCountries";
import regionNamesJson from "../geo/regionNamesV161.json";

export interface CountryTermV158 {
  readonly term: string;
  readonly script: "hangul" | "latin";
  readonly iso3: string;
  readonly kind: "country" | "region" | "admin-unit";
}

export interface CountryNameInputV158 {
  readonly iso3: string;
  readonly nameKo?: string | null;
  readonly nameEn?: string | null;
}

export interface RegionNameInputV158 {
  readonly iso3: string;
  readonly ko?: string | null;
  readonly local?: string | null;
}

/** A registry country's own word for its level-1 unit (`adm.level1.label`). */
export interface AdminUnitInputV158 {
  readonly iso3: string;
  readonly label?: string | null;
}

export interface BuildOtherCountryTermsInputV158 {
  readonly displayedIso3: string;
  readonly countries: readonly CountryNameInputV158[];
  readonly regionEntries: readonly RegionNameInputV158[];
  /**
   * V158-B2b: another country's Korean word for its level-1 unit is that
   * country's wording too - Viet Nam's "성·시" on a Bangladesh page is Viet
   * Nam's copy. Only a Korean label is a term; the displayed country's own
   * label never is.
   */
  readonly adminUnits?: readonly AdminUnitInputV158[];
}

/** Below this length a Korean name is too short to trust as a whole-word match. */
const MIN_HANGUL_LEN = 2;
/** Below this length a romanised name risks matching ordinary English words. */
const MIN_LATIN_LEN = 4;

function normalizeIso3V158(value: string | null | undefined): string {
  return String(value ?? "").trim().toUpperCase();
}

/** Vietnamese đ/Đ plus combining diacritics, stripped so "Việt" reads as "Viet". */
function stripDiacriticsV158(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/gu, "")
    .replace(/đ/gu, "d")
    .replace(/Đ/gu, "D");
}

/** A comparison key for exclusion/dedup: diacritics- and case-insensitive, no spaces. */
function latinKeyV158(value: string): string {
  return stripDiacriticsV158(value).toLowerCase().replace(/[^a-z0-9]+/gu, "");
}

function hangulKeyV158(value: string): string {
  return value.normalize("NFC").trim();
}

function escapeRegExpV158(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/gu, "\\$&");
}

const LATIN_PATTERN_CACHE = new Map<string, RegExp>();

/**
 * Word-boundary, case-insensitive, diacritics-insensitive, optional-internal-space
 * match for a Latin term. The optional space is what lets a single stored term
 * ("Viet Nam") catch both "Viet Nam" and "Vietnam" without a hardcoded alias list.
 */
function latinPatternV158(term: string): RegExp {
  let pattern = LATIN_PATTERN_CACHE.get(term);
  if (!pattern) {
    const parts = stripDiacriticsV158(term).trim().split(/\s+/u).map(escapeRegExpV158);
    const body = parts.join("\\s*");
    pattern = new RegExp(`(?<![\\p{L}\\p{N}])${body}(?![\\p{L}\\p{N}])`, "iu");
    LATIN_PATTERN_CACHE.set(term, pattern);
  }
  return pattern;
}

/**
 * The other-country terms for a displayed country, from explicit country and
 * region rows. Pure: no registry, no fetch, no file read - callers (runtime or
 * Node scripts) supply the rows.
 *
 * - A country/region belonging to the displayed country itself is never a term.
 * - A term whose normalised text coincides with one of the displayed country's
 *   own names or place names is dropped even if it came from another country's
 *   row (a shared spelling must not hide the displayed country's own content).
 * - A name equal to its own ISO3 code (an unresolved registry placeholder) is
 *   never a usable term.
 */
export function buildOtherCountryTermsV158(
  input: BuildOtherCountryTermsInputV158
): CountryTermV158[] {
  const displayed = normalizeIso3V158(input.displayedIso3);

  const ownHangulKeys = new Set<string>();
  const ownLatinKeys = new Set<string>();
  for (const country of input.countries) {
    if (normalizeIso3V158(country.iso3) !== displayed) continue;
    if (country.nameKo) ownHangulKeys.add(hangulKeyV158(country.nameKo));
    if (country.nameEn) ownLatinKeys.add(latinKeyV158(country.nameEn));
  }
  for (const region of input.regionEntries) {
    if (normalizeIso3V158(region.iso3) !== displayed) continue;
    if (region.ko) ownHangulKeys.add(hangulKeyV158(region.ko));
    if (region.local) ownLatinKeys.add(latinKeyV158(region.local));
  }

  const terms: CountryTermV158[] = [];
  const seenHangul = new Set<string>();
  const seenLatin = new Set<string>();

  const pushHangul = (raw: string, iso3: string, kind: CountryTermV158["kind"]) => {
    const trimmed = raw.normalize("NFC").trim();
    if (trimmed.length < MIN_HANGUL_LEN) return;
    if (trimmed.toUpperCase() === iso3) return;
    const key = hangulKeyV158(trimmed);
    if (ownHangulKeys.has(key) || seenHangul.has(key)) return;
    seenHangul.add(key);
    terms.push({ term: trimmed, script: "hangul", iso3, kind });
  };

  const pushLatin = (raw: string, iso3: string, kind: "country" | "region") => {
    const trimmed = raw.trim();
    if (trimmed.length < MIN_LATIN_LEN) return;
    if (trimmed.toUpperCase() === iso3) return;
    const key = latinKeyV158(trimmed);
    if (!key || ownLatinKeys.has(key) || seenLatin.has(key)) return;
    seenLatin.add(key);
    terms.push({ term: trimmed, script: "latin", iso3, kind });
  };

  for (const country of input.countries) {
    const iso3 = normalizeIso3V158(country.iso3);
    if (!iso3 || iso3 === displayed) continue;
    if (country.nameKo) pushHangul(country.nameKo, iso3, "country");
    if (country.nameEn) pushLatin(country.nameEn, iso3, "country");
  }

  for (const region of input.regionEntries) {
    const iso3 = normalizeIso3V158(region.iso3);
    if (!iso3 || iso3 === displayed) continue;
    if (region.ko) pushHangul(region.ko, iso3, "region");
    if (region.local) pushLatin(region.local, iso3, "region");
  }

  const ownAdminUnits = new Set(
    (input.adminUnits ?? [])
      .filter((unit) => normalizeIso3V158(unit.iso3) === displayed && unit.label)
      .map((unit) => hangulKeyV158(String(unit.label)))
  );
  for (const unit of input.adminUnits ?? []) {
    const iso3 = normalizeIso3V158(unit.iso3);
    const label = String(unit.label ?? "");
    if (!iso3 || iso3 === displayed || !/[\uac00-\ud7a3]/u.test(label)) continue;
    if (ownAdminUnits.has(hangulKeyV158(label))) continue;
    pushHangul(label, iso3, "admin-unit");
  }

  return terms;
}

/** Which of `terms` occur in `text`. Korean = substring; Latin = the rules above. */
export function findCountryTermsV158(
  text: string | null | undefined,
  terms: readonly CountryTermV158[]
): CountryTermV158[] {
  const value = String(text ?? "");
  if (!value.trim() || terms.length === 0) return [];
  const strippedValue = stripDiacriticsV158(value);
  const found: CountryTermV158[] = [];
  for (const term of terms) {
    if (term.script === "hangul") {
      if (value.normalize("NFC").includes(term.term)) found.push(term);
    } else if (latinPatternV158(term.term).test(strippedValue)) {
      found.push(term);
    }
  }
  return found;
}

// ---------------------------------------------------------------------------
// Runtime convenience: the platform's own country/region sources.
// ---------------------------------------------------------------------------

/**
 * Registry rows unioned with `PRIORITY_COUNTRIES` (Korean names) and
 * `FALLBACK_COUNTRIES` (English names), for a country the registry does not
 * carry yet. A registry row whose name equals its own ISO3 code is treated as
 * an unresolved placeholder, not a real name. Exported so a Node-side report
 * that reads a specific `countries.json` off disk can reuse the exact same
 * union logic instead of copying it.
 */
export function unionRegistryCountriesV158(
  registryCountries: readonly CountryNameInputV158[]
): CountryNameInputV158[] {
  const usable = (value: string | null | undefined, iso3: string) => {
    const trimmed = (value ?? "").trim();
    return trimmed && trimmed.toUpperCase() !== iso3 ? trimmed : undefined;
  };
  const fallbackEnByIso3 = new Map<string, string>(
    FALLBACK_COUNTRIES.map((c) => [c.iso3, c.nameEn])
  );
  const priorityKoByIso3 = new Map<string, string>(
    PRIORITY_COUNTRIES.map((c) => [c.iso3, c.nameKo])
  );
  const registryByIso3 = new Map<string, CountryNameInputV158>(
    registryCountries.map((row) => [normalizeIso3V158(row.iso3), row])
  );
  const allIso3 = new Set<string>([
    ...registryByIso3.keys(),
    ...(PRIORITY_COUNTRIES.map((c) => c.iso3) as readonly string[]),
  ]);
  return Array.from(allIso3).map((iso3) => {
    const fromRegistry = registryByIso3.get(iso3);
    return {
      iso3,
      nameKo: usable(fromRegistry?.nameKo, iso3) ?? priorityKoByIso3.get(iso3),
      nameEn: usable(fromRegistry?.nameEn, iso3) ?? fallbackEnByIso3.get(iso3),
    };
  });
}

interface RegionNamesDocumentV158 {
  readonly countries: Record<
    string,
    { readonly entries: ReadonlyArray<{ readonly ko?: string; readonly local?: string; readonly reviewStatus?: string }> }
  >;
}

let confirmedRegionEntriesCache: RegionNameInputV158[] | null = null;

/**
 * `regionNamesV161.json` flattened to `{ iso3, ko, local }`, keeping only rows
 * the dictionary marks `reviewStatus: "confirmed"` - a `pending` row is a
 * rule-based proposal, not a checked name, so it is left out of the scoping
 * decision entirely (never hidden as a term, never treated as safe either).
 */
export function confirmedRegionEntriesV158(): RegionNameInputV158[] {
  if (!confirmedRegionEntriesCache) {
    const document = regionNamesJson as unknown as RegionNamesDocumentV158;
    const rows: RegionNameInputV158[] = [];
    for (const [iso3, block] of Object.entries(document.countries)) {
      for (const entry of block.entries) {
        if (entry.reviewStatus !== "confirmed") continue;
        rows.push({ iso3, ko: entry.ko, local: entry.local });
      }
    }
    confirmedRegionEntriesCache = rows;
  }
  return confirmedRegionEntriesCache;
}

/**
 * Every registry country's level-1 label, for `adminUnits`, and (V162 PR-D)
 * each of its own administrative expressions (`adm.publicTerms` - Viet Nam's
 * "34개", "개편 전"): another country's screens hide them like the label.
 */
export function adminUnitsV158(registry: { countries: ReadonlyArray<{ iso3: string; adm?: { level1?: { label?: string }; publicTerms?: readonly string[] } }> }): AdminUnitInputV158[] {
  return registry.countries.flatMap((row) => [
    { iso3: row.iso3, label: row.adm?.level1?.label ?? null },
    ...(row.adm?.publicTerms ?? []).map((term) => ({ iso3: row.iso3, label: term })),
  ]);
}

const otherCountryTermsMemo = new Map<
  string,
  { registryRef: CountryRegistryV158 | null; terms: CountryTermV158[] }
>();

/**
 * The other-country terms for a displayed country, from the platform's own
 * registry cache ∪ `PRIORITY_COUNTRIES` and the confirmed region dictionary.
 * Memoised per displayed ISO3 and registry identity, so a call before and
 * after `loadCountryRegistryV158` resolves recomputes once, not on every call.
 */
export function otherCountryTermsV158(displayedIso3: string): CountryTermV158[] {
  const iso3 = normalizeCountryIso3V158(displayedIso3);
  const registryRef = countryRegistryCacheV158();
  const cached = otherCountryTermsMemo.get(iso3);
  if (cached && cached.registryRef === registryRef) return cached.terms;

  const registry = registryRef ?? bundledCountryRegistryV158();
  const terms = buildOtherCountryTermsV158({
    displayedIso3: iso3,
    countries: unionRegistryCountriesV158(registry.countries),
    regionEntries: confirmedRegionEntriesV158(),
    adminUnits: adminUnitsV158(registry),
  });
  otherCountryTermsMemo.set(iso3, { registryRef, terms });
  return terms;
}
