/**
 * V158: one line of reviewed copy - a heading, a chart title, a series label -
 * as seen from the country on screen.
 *
 * The reviewed copy tables (analysis headings, indicator phrases) were written
 * for the country the spec was authored for and are keyed by element or
 * indicator, which every country shares. On another country's screen a line
 * that names a different target country or its places is not shown: the
 * caller falls back to its own default (the data's own label, the generic
 * title). The copy itself is never edited.
 */
import { DEFAULT_COUNTRY_ISO3_V158, normalizeCountryIso3V158 } from "../countryContext";
import type { PublicAnalysisHeadingsV134 } from "../visualization/publicAnalysisHeadingsV134";
import { findCountryTermsV158, otherCountryTermsV158 } from "./countryTermsV158";
import { shouldScopeTextV158 } from "./countryTextScopeV158";

/**
 * The countries the V159 spec and the reviewed copy were written for. The
 * import records this as `useCasesV159.json` `registryCountries` (the default
 * country); a unit test keeps the two equal.
 */
export const SPEC_AUTHORED_COUNTRIES_V158: readonly string[] = [DEFAULT_COUNTRY_ISO3_V158];

/** True when spec text and reviewed copy must be scoped for this country. */
export function specNeedsCountryScopeV158(country: string | null | undefined): boolean {
  const iso3 = normalizeCountryIso3V158(country) || DEFAULT_COUNTRY_ISO3_V158;
  return shouldScopeTextV158(iso3, SPEC_AUTHORED_COUNTRIES_V158);
}

/** The line unchanged, or "" when it names another target country for this one. */
export function copyForCountryV158(text: string | null | undefined, country: string | null | undefined): string {
  const value = text ?? "";
  if (!value || !specNeedsCountryScopeV158(country)) return value;
  return findCountryTermsV158(value, otherCountryTermsV158(normalizeCountryIso3V158(country))).length > 0 ? "" : value;
}

/**
 * V162 PR-D: platform notes written for the default country ("성·시 값은
 * GADM 4.1 ADM1(개편 전 63개) 경계로 집계한…") as seen from the country on
 * screen - each sentence that names another country, its places or its
 * administrative wording is left out; the rest of the note stays as written.
 */
export function sentencesForCountryV162(text: string | null | undefined, country: string | null | undefined): string {
  const value = text ?? "";
  if (!value || !specNeedsCountryScopeV158(country)) return value;
  const terms = otherCountryTermsV158(normalizeCountryIso3V158(country));
  return value
    .split(/(?<=[.!?])\s+/u)
    .filter((sentence) => findCountryTermsV158(sentence, terms).length === 0)
    .join(" ")
    .trim();
}

/** Analysis headings with every line that names another country emptied (callers fall back). */
export function headingsForCountryV158(
  headings: PublicAnalysisHeadingsV134 | null,
  country: string | null | undefined
): PublicAnalysisHeadingsV134 | null {
  if (!headings || !specNeedsCountryScopeV158(country)) return headings;
  return {
    ...headings,
    publicAnalysisTitle: copyForCountryV158(headings.publicAnalysisTitle, country),
    primaryChartTitle: copyForCountryV158(headings.primaryChartTitle, country),
    secondaryChartTitle: copyForCountryV158(headings.secondaryChartTitle, country),
    publicQuestion: copyForCountryV158(headings.publicQuestion, country),
  };
}
