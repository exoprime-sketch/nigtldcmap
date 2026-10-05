import type {
  CountryRegionV165,
  CountryRegistryEntryV158,
} from "../countryContext";

/**
 * V165: what the country picker shows, from the country registry alone.
 *
 * The platform is planned for ten countries and the vendor builds its screens
 * now, so nothing here names a country or counts them by hand: the registry
 * (`public/data/countries.json`) says which countries exist, which are public
 * (`status: "live"`), what they are called and which region lists them. The
 * picker's shape follows the number of public countries (NN/g: show every
 * option up to about five; a list from five to fifteen; type to find beyond):
 *
 * | public countries | header        | home / guide                  |
 * |------------------|---------------|-------------------------------|
 * | 0-1              | the name only | the name only                 |
 * | 2-4              | button + list | one button per country        |
 * | 5 or more        | button + list | button + list (as the header) |
 *
 * The list groups countries by region once it holds five or more, lists a
 * country still being prepared (`status: "preparing"`) greyed out and not
 * selectable, and adds a search box once it holds eleven or more.
 */

export type CountryPickerVariantV165 = "header" | "inline";
export type CountryPickerModeV165 = "single" | "segmented" | "list";

export interface CountryPickerEntryV165 {
  iso3: string;
  nameKo: string;
  nameEn: string;
  /** Public and selectable; false = still being prepared (shown, not selectable). */
  live: boolean;
}

export interface CountryPickerGroupV165 {
  /** The region key, or "" for the one ungrouped list. */
  key: string;
  /** The region's name, or "" when the list is not grouped. */
  nameKo: string;
  countries: CountryPickerEntryV165[];
}

export interface CountryPickerModelV165 {
  mode: CountryPickerModeV165;
  /** The public countries, in registry order (the segmented buttons). */
  live: CountryPickerEntryV165[];
  /** The list, by region when grouped; empty unless `mode` is "list". */
  groups: CountryPickerGroupV165[];
  /** The list carries a search box. */
  searchable: boolean;
}

/** The smallest list that is grouped by region. */
export const COUNTRY_PICKER_GROUP_FROM_V165 = 5;
/** The smallest list that carries a search box. */
export const COUNTRY_PICKER_SEARCH_FROM_V165 = 11;
/** The most countries shown as one button each on the home and the guide. */
export const COUNTRY_PICKER_SEGMENTED_MAX_V165 = 4;

/** Where a country without a known region is listed: last. */
const OTHER_REGION_V165: CountryRegionV165 = { key: "other", nameKo: "기타", order: Number.MAX_SAFE_INTEGER };

function entryV165(country: CountryRegistryEntryV158): CountryPickerEntryV165 {
  return {
    iso3: country.iso3,
    nameKo: country.nameKo,
    nameEn: country.nameEn,
    live: country.status === "live",
  };
}

const byNameKoV165 = (left: CountryPickerEntryV165, right: CountryPickerEntryV165) =>
  left.nameKo.localeCompare(right.nameKo, "ko");

export function countryPickerModelV165(
  registry: { countries: CountryRegistryEntryV158[]; regions?: CountryRegionV165[] },
  variant: CountryPickerVariantV165
): CountryPickerModelV165 {
  const live = registry.countries.filter((country) => country.status === "live").map(entryV165);
  if (live.length <= 1) return { mode: "single", live, groups: [], searchable: false };
  if (variant === "inline" && live.length <= COUNTRY_PICKER_SEGMENTED_MAX_V165) {
    return { mode: "segmented", live, groups: [], searchable: false };
  }
  const listed = registry.countries.filter((country) => country.status === "live" || country.status === "preparing");
  const searchable = listed.length >= COUNTRY_PICKER_SEARCH_FROM_V165;
  if (listed.length < COUNTRY_PICKER_GROUP_FROM_V165) {
    return {
      mode: "list",
      live,
      groups: [{ key: "", nameKo: "", countries: listed.map(entryV165).sort(byNameKoV165) }],
      searchable,
    };
  }
  const regions = new Map((registry.regions || []).map((region) => [region.key, region]));
  const grouped = new Map<string, { region: CountryRegionV165; countries: CountryPickerEntryV165[] }>();
  listed.forEach((country) => {
    const region = (country.region && regions.get(country.region)) || OTHER_REGION_V165;
    const bucket = grouped.get(region.key) || { region, countries: [] };
    bucket.countries.push(entryV165(country));
    grouped.set(region.key, bucket);
  });
  const groups = [...grouped.values()]
    .sort((left, right) => left.region.order - right.region.order)
    .map(({ region, countries }) => ({ key: region.key, nameKo: region.nameKo, countries: countries.sort(byNameKoV165) }));
  return { mode: "list", live, groups, searchable };
}

/**
 * The page selects (finder, download, detail, map) keep their native
 * `<select>`; from five public countries their options are grouped by region
 * (`<optgroup>`). Only public countries are options there, in registry order
 * within a region.
 */
export function countrySelectGroupsV165(
  registry: { countries: CountryRegistryEntryV158[]; regions?: CountryRegionV165[] },
  liveIso3: string[]
): CountryPickerGroupV165[] | null {
  if (liveIso3.length < COUNTRY_PICKER_GROUP_FROM_V165) return null;
  const regions = new Map((registry.regions || []).map((region) => [region.key, region]));
  const grouped = new Map<string, { region: CountryRegionV165; countries: CountryPickerEntryV165[] }>();
  liveIso3.forEach((iso3) => {
    const country = registry.countries.find((row) => row.iso3 === iso3);
    if (!country) return;
    const region = (country.region && regions.get(country.region)) || OTHER_REGION_V165;
    const bucket = grouped.get(region.key) || { region, countries: [] };
    bucket.countries.push(entryV165(country));
    grouped.set(region.key, bucket);
  });
  return [...grouped.values()]
    .sort((left, right) => left.region.order - right.region.order)
    .map(({ region, countries }) => ({ key: region.key, nameKo: region.nameKo, countries: countries.sort(byNameKoV165) }));
}

/** Type-ahead: the next selectable country after `fromIso3` whose name starts with `typed`. */
export function nextCountryByTypeAheadV165(
  entries: CountryPickerEntryV165[],
  typed: string,
  fromIso3: string | null
): string | null {
  const needle = typed.trim().toLocaleLowerCase("ko");
  if (!needle) return null;
  const selectable = entries.filter((entry) => entry.live);
  const start = Math.max(0, selectable.findIndex((entry) => entry.iso3 === fromIso3) + 1);
  const ordered = [...selectable.slice(start), ...selectable.slice(0, start)];
  const hit = ordered.find(
    (entry) =>
      entry.nameKo.toLocaleLowerCase("ko").startsWith(needle) ||
      entry.nameEn.toLocaleLowerCase("en").startsWith(needle) ||
      entry.iso3.toLocaleLowerCase("en").startsWith(needle)
  );
  return hit ? hit.iso3 : null;
}

/** Search: countries whose Korean or English name, or code, contains `query`. */
export function filterCountryGroupsV165(groups: CountryPickerGroupV165[], query: string): CountryPickerGroupV165[] {
  const needle = query.trim().toLocaleLowerCase("ko");
  if (!needle) return groups;
  return groups
    .map((group) => ({
      ...group,
      countries: group.countries.filter(
        (entry) =>
          entry.nameKo.toLocaleLowerCase("ko").includes(needle) ||
          entry.nameEn.toLocaleLowerCase("en").includes(needle) ||
          entry.iso3.toLocaleLowerCase("en").includes(needle)
      ),
    }))
    .filter((group) => group.countries.length > 0);
}
