/**
 * V158: which analysis variants were written for the country the spec was
 * authored for.
 *
 * A dedicated variant component often carries that country's own wording - its
 * name, places, administrative system ("성·시", "34개"), currency or plan names -
 * or reads columns only its delivery has. On a screen for another country such
 * a variant is skipped and the element falls through to the generic template
 * of its display type, which draws from the data and the semantics alone. The
 * list is conservative: a variant whose component shows any such wording is on
 * it, which `variantCountryScopeV158.test.ts` checks against the component
 * sources, so a new variant cannot slip through unlisted.
 */
import { specNeedsCountryScopeV158 } from "../../../data/spec/countrySpecV158";
import {
  elementVariantV159,
  type ElementVariantV159,
  type TemplateVariantKeyV159,
} from "./templateVariantsV159";

export const AUTHORED_COUNTRY_VARIANTS_V158: ReadonlySet<TemplateVariantKeyV159> = new Set<TemplateVariantKeyV159>([
  "monthly-climate",
  "ccs-status",
  "basin-area",
  "flow-direction",
  "reported-inventory",
  "oda-provider",
  "climate-budget-allocation",
  "research-patent",
  "occupation-wage",
  "transmission-network",
  "lcoe-range",
  "ndc-targets",
  "carbon-market-regions",
  "cooperation-checklist",
  "hydro-stations",
  "security-safety",
  "energy-outlook-plan",
  "power-plant-registry",
  "mineral-resources",
  "investor-network",
  "ppp-procurement",
  "climate-zone",
]);

/** The element's variant for a country, or null where the generic template applies. */
export function variantForCountryV158(
  elementId: string,
  country: string | null | undefined
): ElementVariantV159 | null {
  const entry = elementVariantV159(elementId);
  if (!entry || !specNeedsCountryScopeV158(country)) return entry;
  return AUTHORED_COUNTRY_VARIANTS_V158.has(entry.variant) ? null : entry;
}
