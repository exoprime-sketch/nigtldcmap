/**
 * V158: the spec layer seen from the country on screen.
 *
 * The V159 spec (card names and sources, typology, description, use cases) was
 * written for the default country. For that country everything here returns
 * the V159 values unchanged. For any other country:
 *
 * - Card names of the country-specific elements come from that country's own
 *   delivery (`countryElementLabels`, the 2_meta_info 요소_KR), and every card
 *   source comes from the country's own catalog sources, since the source of a
 *   dataset differs between deliveries well beyond that list.
 * - Any other spec text keeps only the paragraphs that name no other target
 *   country or its places (`countryTextScopeV158`); the source text itself is
 *   never edited. A card name that would lose its text falls back to the
 *   country's own label.
 * - The reference line of the spec (source org, link, APA, checked date)
 *   describes the default country's source and is not shown.
 * - The status notice ('데이터 준비 중', exclusion) follows the country's own
 *   catalog, not the default country's: an element the country did not
 *   deliver is '데이터 준비 중', one it excluded is excluded, any other is
 *   shown with its analysis.
 *
 * Nothing here names a country: the default is `DEFAULT_COUNTRY_ISO3_V158` and
 * other countries come from the registry.
 */
import countrySpecificJson from "./countrySpecificElementsV158.json";
import {
  getCardSpecV159,
  getTypologyV159,
  loadDatasetSpecV159,
  type DatasetSpecBundleV159,
} from "./datasetSpecV159";
import type {
  DatasetCardSpecV159,
  DatasetSpecRowV159,
  StatusNoticeV159,
  TypologyRowV159,
  UseCaseV159,
} from "./specTypesV159";
import { normalizeCountryIso3V158 } from "../countryContext";
import { applyCountryTextViewsV162, loadCountryTextViewsV162 } from "./countryTextViewsV162";
import { SPEC_AUTHORED_COUNTRIES_V158, specNeedsCountryScopeV158 } from "../countries/countryCopyV158";
import { otherCountryTermsV158 } from "../countries/countryTermsV158";
import { scopeCasesToCountryV158, scopeTextToCountryV158 } from "../countries/countryTextScopeV158";
import { publicSourceOrganizationV136_1 } from "../visualization/publicFieldPolicyV126";
import { publicTitleFromRawLabelV158 } from "../countries/publicLabelsV122";

export { SPEC_AUTHORED_COUNTRIES_V158, specNeedsCountryScopeV158 };

const COUNTRY_SPECIFIC_V158 = new Set<string>(countrySpecificJson.elementIds);

export function countrySpecificElementIdsV158(): string[] {
  return [...countrySpecificJson.elementIds];
}

export function isCountrySpecificElementV158(elementId: string): boolean {
  return COUNTRY_SPECIFIC_V158.has(String(elementId || "").toUpperCase());
}

/** The parts of a catalog item this layer reads. */
export interface CountrySpecItemV158 {
  elementId: string;
  publicTitle?: string;
  publicStatus?: string;
  sourceOrganizations?: readonly string[];
  countryNameKo?: string;
  raw?: unknown;
}

function countryElementLabelV158(item: CountrySpecItemV158 | null | undefined): string {
  const labels = (item?.raw as { countryElementLabels?: unknown } | undefined)?.countryElementLabels;
  if (!Array.isArray(labels)) return "";
  const first = labels.find((value) => typeof value === "string" && value.trim());
  return typeof first === "string" ? publicTitleFromRawLabelV158(first) : "";
}

/**
 * The country's own source line: the public organisation names from its
 * catalog (compiler notes removed), two at most and a count for the rest.
 */
export function countrySourceLabelV158(item: CountrySpecItemV158 | null | undefined): string {
  const names = Array.from(
    new Set(
      (item?.sourceOrganizations || [])
        .map((name) => publicSourceOrganizationV136_1(name))
        .filter((name): name is string => Boolean(name && name.trim()))
        .map((name) => name.trim())
    )
  );
  if (names.length === 0) return "";
  // V163: one organisation is named once - "JRC — EDGAR · JRC — IEA-EDGAR CO2"
  // reads "JRC — EDGAR · IEA-EDGAR CO2" (the card summaries' provider line does the same).
  const split = names.map((name) => name.split(" — "));
  const heads = new Set(split.map((parts) => parts[0].trim()));
  if (names.length > 1 && names.length <= 3 && heads.size === 1 && split.every((parts) => parts.length > 1)) {
    return `${[...heads][0]} — ${split.map((parts) => parts.slice(1).join(" — ").trim()).join(" · ")}`;
  }
  if (names.length <= 2) return names.join(" · ");
  return `${names.slice(0, 2).join(" · ")} 외 ${names.length - 2}`;
}

function scoped(text: string | null | undefined, country: string): string {
  if (!text) return "";
  return scopeTextToCountryV158(text, otherCountryTermsV158(country)).text || "";
}

const cardSpecMemoV158 = new Map<string, { item: CountrySpecItemV158 | null; card: DatasetCardSpecV159 | null }>();

/** The card spec (name, source, one-line definition) for a country. */
export function getCardSpecForCountryV158(
  elementId: string,
  country: string | null | undefined,
  item?: CountrySpecItemV158 | null
): DatasetCardSpecV159 | null {
  const base = getCardSpecV159(elementId);
  if (!specNeedsCountryScopeV158(country)) {
    // V162: the default country's card keeps its reviewed name and source; its
    // notice follows the catalog like every other country's.
    if (!base || !item) return base;
    const statusNotice = statusNoticeFromCatalogV162(item.publicStatus);
    return statusNotice === base.statusNotice ? base : { ...base, statusNotice };
  }
  const iso3 = normalizeCountryIso3V158(country);
  // A finder card asks several times per render; the answer depends on the
  // catalog item only, so the same item gets the same card.
  const memoKey = `${iso3}:${String(elementId).toUpperCase()}`;
  const memo = cardSpecMemoV158.get(memoKey);
  if (memo && memo.item === (item ?? null)) return memo.card;
  const card = buildCardSpecForCountryV158(elementId, iso3, base, item);
  cardSpecMemoV158.set(memoKey, { item: item ?? null, card });
  return card;
}

function buildCardSpecForCountryV158(
  elementId: string,
  iso3: string,
  base: DatasetCardSpecV159 | null,
  item?: CountrySpecItemV158 | null
): DatasetCardSpecV159 | null {
  const countryLabel = countryElementLabelV158(item);
  const countrySource = countrySourceLabelV158(item);
  const baseName = isCountrySpecificElementV158(elementId)
    ? countryLabel || scoped(base?.baseName, iso3) || item?.publicTitle || ""
    : scoped(base?.baseName, iso3) || countryLabel || item?.publicTitle || "";
  const sourceLabel = countrySource || scoped(base?.sourceLabel, iso3);
  const shortDefinitionCard = scoped(base?.shortDefinitionCard, iso3);
  // The card's notice follows the country's own typology.
  const typology = getTypologyForCountryV158(elementId, iso3, item);
  const displayType = typology?.displayType || base?.displayType;
  const statusNotice = typology ? typology.statusNotice : base?.statusNotice ?? null;
  if (!base) {
    if (!item || !displayType) return null;
    return {
      elementId: String(elementId).toUpperCase(),
      sourceLabel,
      baseName,
      shortDefinitionCard,
      displayType,
      statusNotice,
      users: [],
    };
  }
  return { ...base, baseName, sourceLabel, shortDefinitionCard, displayType: displayType || base.displayType, statusNotice };
}

/** The public title for a country's catalog item, by the same rules. */
export function publicTitleForCountryV158(
  elementId: string,
  country: string | null | undefined,
  sharedTitle: string,
  item?: CountrySpecItemV158 | null
): string {
  if (!specNeedsCountryScopeV158(country)) return sharedTitle;
  const iso3 = normalizeCountryIso3V158(country);
  const countryLabel = countryElementLabelV158(item);
  if (isCountrySpecificElementV158(elementId) && countryLabel) return countryLabel;
  return scoped(sharedTitle, iso3) || countryLabel || sharedTitle;
}

/** The status words a country's own catalog state stands for. */
const COUNTRY_STATUS_V158: Record<"data-pending" | "excluded" | "public", string> = {
  "data-pending": "미입고(데이터 준비 중)",
  excluded: "제외",
  public: "공개",
};

/**
 * The typology row for a country. The type and structure are the spec's; the
 * status notice is the country's own - the default country's publication
 * decisions and missing deliveries are its own and do not carry over.
 */
/** The catalog's publicStatus as a screen notice. */
export function statusNoticeFromCatalogV162(publicStatus: string | null | undefined): StatusNoticeV159 {
  if (publicStatus === "not-provided" || publicStatus === "not-collected" || publicStatus === "schema-only" || publicStatus === "data-entry-planned") return "data-pending";
  if (publicStatus === "excluded") return "excluded";
  return null;
}

export function getTypologyForCountryV158(
  elementId: string,
  country: string | null | undefined,
  item?: CountrySpecItemV158 | null
): TypologyRowV159 | null {
  const row = getTypologyV159(elementId);
  // V162: the notice ('데이터 준비 중' · 제외) is decided by the catalog alone, for
  // every country including the default one - the typology file only supplies
  // the display type. A delivery that arrives (E-011) opens without editing it.
  if (!row || !item) return row;
  const statusNotice = statusNoticeFromCatalogV162(item.publicStatus);
  // Same notice: the reviewed row as it is (the default country's cards and
  // their tests compare by identity).
  if (statusNotice === row.statusNotice) return row;
  return { ...row, statusNotice, status: COUNTRY_STATUS_V158[statusNotice ?? "public"] };
}

export interface CountrySpecHiddenV158 {
  fields: Array<{ field: string; paragraphs: number[]; terms: string[] }>;
  cases: number[];
}

export interface CountryDatasetSpecBundleV158 extends DatasetSpecBundleV159 {
  hidden: CountrySpecHiddenV158;
}

const SCOPED_SPEC_FIELDS_V158 = [
  "platformName",
  "sourceLabel",
  "baseName",
  "shortDefinition",
  "shortDefinitionCard",
  "description",
  "usage",
  "definitionKo",
] as const;

/** Reference fields that describe the authoring country's own source. */
const REFERENCE_FIELDS_V158 = ["sourceOrg", "refLink", "refApa", "checkedAt"] as const;

const SCOPED_CASE_FIELDS_V158: ReadonlyArray<keyof UseCaseV159> = [
  "purpose",
  "logic",
  "storyline",
  "caution",
  "cautionDisplay",
];

/** The spec text and use cases for a country, with what was hidden. */
export async function loadDatasetSpecForCountryV158(
  elementId: string,
  country: string | null | undefined
): Promise<CountryDatasetSpecBundleV158> {
  // V162: the country's own view of the spec text (every country, the default
  // one included - a case about another country's own data is not shown).
  const bundle = applyCountryTextViewsV162(
    await loadDatasetSpecV159(elementId),
    elementId,
    normalizeCountryIso3V158(country),
    await loadCountryTextViewsV162()
  );
  const hidden: CountrySpecHiddenV158 = { fields: [], cases: [] };
  if (!specNeedsCountryScopeV158(country)) return { ...bundle, hidden };
  const terms = otherCountryTermsV158(normalizeCountryIso3V158(country));
  let spec: DatasetSpecRowV159 | null = null;
  if (bundle.spec) {
    const next: DatasetSpecRowV159 = { ...bundle.spec };
    for (const field of SCOPED_SPEC_FIELDS_V158) {
      const result = scopeTextToCountryV158(next[field], terms);
      if (result.hiddenParagraphs.length > 0) {
        hidden.fields.push({
          field,
          paragraphs: result.hiddenParagraphs.map((item) => item.index),
          terms: Array.from(new Set(result.hiddenParagraphs.flatMap((item) => item.terms))),
        });
      }
      next[field] = result.text || "";
    }
    for (const field of REFERENCE_FIELDS_V158) next[field] = "";
    // The decision note is the authoring country's own reason for ⓪.
    next.decisionNote = null;
    spec = next;
  }
  const { kept, hidden: hiddenCases } = scopeCasesToCountryV158(bundle.cases, terms, SCOPED_CASE_FIELDS_V158);
  hidden.cases = hiddenCases.map((item) => item.index);
  return { spec, cases: kept, hidden };
}
