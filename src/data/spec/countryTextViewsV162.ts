/**
 * V162: the spec text as each country's screens show it.
 *
 * The importer (scripts/v162/country-neutral-v162.mjs) turns the workbook's
 * text into each platform country's view by rule: country lists become a
 * neutral count, asides about another country are dropped, and a sentence
 * that is another country's own is shown only to that country. The stored
 * spec and use cases are the default country's view; this file carries what
 * differs for the other countries, and each case lists the countries that
 * show it when not all of them do.
 */
import type { DatasetSpecBundleV159 } from "./datasetSpecV159";
import type { DatasetSpecRowV159, UseCaseV159 } from "./specTypesV159";

type SpecFieldViewsV162 = Partial<Pick<DatasetSpecRowV159, "description" | "usage">>;
type CaseFieldViewsV162 = Partial<
  Pick<UseCaseV159, "purpose" | "purposeEn" | "logic" | "storyline" | "cautionDisplay" | "dataUsed">
>;

export interface CountryTextViewsV162 {
  schemaVersion: string;
  defaultCountry: string;
  countries: string[];
  spec: Record<string, Record<string, SpecFieldViewsV162>>;
  cases: Record<string, Record<string, CaseFieldViewsV162>>;
}

let viewsChunkV162: Promise<CountryTextViewsV162> | null = null;

export function loadCountryTextViewsV162(): Promise<CountryTextViewsV162> {
  if (!viewsChunkV162) {
    viewsChunkV162 = import("./countryTextViewsV162.json").then(
      (module) => (module.default ?? module) as unknown as CountryTextViewsV162
    );
  }
  return viewsChunkV162;
}

/** Whether a case is shown on the country's screens. */
export function caseShownForCountryV162(item: Pick<UseCaseV159, "countries">, country: string): boolean {
  return !item.countries || item.countries.includes(country);
}

/** The bundle as the country's screens show it (the default country's is the stored one). */
export function applyCountryTextViewsV162(
  bundle: DatasetSpecBundleV159,
  elementId: string,
  country: string,
  views: CountryTextViewsV162
): DatasetSpecBundleV159 {
  const key = elementId.toUpperCase();
  // No country on the page means the default country.
  const viewer = country || views.defaultCountry;
  const specViews = views.spec[key]?.[viewer];
  const spec = bundle.spec && specViews ? { ...bundle.spec, ...specViews } : bundle.spec;
  const caseViewsFor = (item: UseCaseV159) => views.cases[`${item.elementId}#${item.caseNo}`]?.[viewer];
  const casesChange = bundle.cases.some((item) => !caseShownForCountryV162(item, viewer) || caseViewsFor(item));
  // Nothing of this element differs for the country: the stored bundle itself.
  if (spec === bundle.spec && !casesChange) return bundle;
  const cases = casesChange
    ? bundle.cases
        .filter((item) => caseShownForCountryV162(item, viewer))
        .map((item) => {
          const caseViews = caseViewsFor(item);
          return caseViews ? { ...item, ...caseViews } : item;
        })
    : bundle.cases;
  return { spec, cases };
}
