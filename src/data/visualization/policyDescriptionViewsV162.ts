/**
 * V162: a policy or initiative description as a country's screens show it.
 * scripts/v162/build-policy-country-views-v162.mjs applies the country-view
 * rules (country lists to a neutral count, other countries' asides and own
 * lines dropped) and keeps only the entries whose lines differ per country.
 */
import viewsJson from "./policyDescriptionViewsV162.json";

const VIEWS_V162 = (viewsJson as { entries: Record<string, Record<string, string[]>> }).entries;

export function policyDescriptionLinesV162(entry: { key: string; description: string[] }, country: string): string[] {
  return VIEWS_V162[entry.key]?.[country] ?? entry.description;
}
