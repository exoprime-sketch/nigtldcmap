/**
 * V158-B2 WP2: hide (never rewrite) spec text that names a country other than
 * the one on screen. Paired with `countryTermsV158.ts`, which decides *which*
 * strings count as another country's terms; this module only decides *what to
 * keep* once those terms are known.
 */

import { findCountryTermsV158, type CountryTermV158 } from "./countryTermsV158";

export interface ScopedTextV158 {
  text: string | null;
  hiddenParagraphs: Array<{ index: number; terms: string[] }>;
}

/**
 * Whether a screen for `displayedIso3` must scope out other-country text at
 * all. False when the displayed country is one of the field's own authoring
 * countries (e.g. Viet Nam screens reading `useCasesV159.json`, whose
 * `registryCountries` is `["VNM"]`) - the text is native there, nothing to hide.
 */
export function shouldScopeTextV158(
  displayedIso3: string,
  authoredIso3: readonly string[]
): boolean {
  const displayed = String(displayedIso3 ?? "").trim().toUpperCase();
  if (!displayed) return false;
  return !authoredIso3.some((iso3) => String(iso3 ?? "").trim().toUpperCase() === displayed);
}

/**
 * `text` split on blank-line-or-more boundaries (`/\n+/`); a paragraph
 * containing any of `terms` is dropped, never edited. The remaining paragraphs
 * are rejoined with `"\n"`. `null` in, or nothing left after scoping, gives
 * `null` out - there is no paragraph structure to preserve when there is no text.
 */
export function scopeTextToCountryV158(
  text: string | null | undefined,
  terms: readonly CountryTermV158[]
): ScopedTextV158 {
  if (text === null || text === undefined || text === "") {
    return { text: text ?? null, hiddenParagraphs: [] };
  }

  const paragraphs = text.split(/\n+/u);
  const kept: string[] = [];
  const hiddenParagraphs: Array<{ index: number; terms: string[] }> = [];

  paragraphs.forEach((paragraph, index) => {
    const matches = findCountryTermsV158(paragraph, terms);
    if (matches.length > 0) {
      hiddenParagraphs.push({
        index,
        terms: Array.from(new Set(matches.map((match) => match.term))),
      });
    } else {
      kept.push(paragraph);
    }
  });

  return {
    text: kept.length > 0 ? kept.join("\n") : null,
    hiddenParagraphs,
  };
}

/**
 * `cases` filtered to those whose named `fields` mention no other-country term.
 * A case is hidden as a whole (not trimmed field-by-field) the moment any one
 * of its displayed fields matches, since a use case reads as a single unit.
 */
export function scopeCasesToCountryV158<T>(
  cases: readonly T[],
  terms: readonly CountryTermV158[],
  fields: ReadonlyArray<keyof T>
): { kept: T[]; hidden: Array<{ index: number; terms: string[] }> } {
  const kept: T[] = [];
  const hidden: Array<{ index: number; terms: string[] }> = [];

  cases.forEach((item, index) => {
    const matchedTerms = new Set<string>();
    for (const field of fields) {
      const value = item[field];
      if (typeof value !== "string") continue;
      for (const match of findCountryTermsV158(value, terms)) matchedTerms.add(match.term);
    }
    if (matchedTerms.size > 0) {
      hidden.push({ index, terms: Array.from(matchedTerms) });
    } else {
      kept.push(item);
    }
  });

  return { kept, hidden };
}
