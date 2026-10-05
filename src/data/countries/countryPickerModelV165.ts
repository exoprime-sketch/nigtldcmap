import type {
  CountryRegionV165,
  CountryRegistryRowV166,
} from "../countryContext";

/**
 * V165: what the country picker shows, from the country registry alone.
 *
 * The platform is planned for ten countries and the vendor builds its screens
 * now, so nothing here names a country or counts them by hand: the registry
 * (`public/data/countries.json`) says which countries exist, which are public
 * (`status: "live"`), what they are called and which region lists them. The
 * picker's shape follows the number of countries (NN/g: show every option up
 * to about five; a list from five to fifteen; type to find beyond):
 *
 * | public countries | header        | guide                         |
 * |------------------|---------------|-------------------------------|
 * | 0-1              | the name only | the name only                 |
 * | 2-4              | button + list | one button per country        |
 * | 5 or more        | button + list | button + list (as the header) |
 *
 * V166: the home ("overview") shows every country the platform names, public
 * or not, laid out in full - one row per region ("rows"): the public ones are
 * buttons, the ones still being prepared their names, greyed, with
 * "공개 예정". Up to twelve listed countries; beyond, the header's button +
 * list. With no country being prepared and two to four public it is the
 * buttons alone, as before.
 *
 * The list groups countries by region once it holds five or more, lists a
 * country still being prepared (`status: "preparing"`) greyed out and not
 * selectable, and adds a search box once it holds eleven or more. Within a
 * region the public countries come first, then the rest, each by Korean name
 * (V166).
 */

export type CountryPickerVariantV165 = "header" | "inline" | "overview";
export type CountryPickerModeV165 = "single" | "segmented" | "rows" | "list";

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
  /**
   * The public countries: in registry order for the segmented buttons, in the
   * rows' reading order (region, then within it) for the rows.
   */
  live: CountryPickerEntryV165[];
  /** The list or the rows, by region when grouped; empty for "single" and "segmented". */
  groups: CountryPickerGroupV165[];
  /** The list carries a search box. */
  searchable: boolean;
}

/** The smallest list that is grouped by region. */
export const COUNTRY_PICKER_GROUP_FROM_V165 = 5;
/** The smallest list that carries a search box. */
export const COUNTRY_PICKER_SEARCH_FROM_V165 = 11;
/** The most countries shown as one button each on the guide. */
export const COUNTRY_PICKER_SEGMENTED_MAX_V165 = 4;
/** V166: the most countries the home lays out in rows; beyond, a button + list. */
export const COUNTRY_PICKER_ROWS_MAX_V166 = 12;

/** Where a country without a known region is listed: last. */
const OTHER_REGION_V165: CountryRegionV165 = { key: "other", nameKo: "기타", order: Number.MAX_SAFE_INTEGER };

function entryV165(country: CountryRegistryRowV166): CountryPickerEntryV165 {
  return {
    iso3: country.iso3,
    nameKo: country.nameKo,
    nameEn: country.nameEn,
    live: country.status === "live",
  };
}

/** V166: public first, then by Korean name. */
const byLiveThenNameKoV166 = (left: CountryPickerEntryV165, right: CountryPickerEntryV165) =>
  Number(right.live) - Number(left.live) || left.nameKo.localeCompare(right.nameKo, "ko");

/** The countries by region, regions in `order`, public first within each. */
function groupByRegionV166(
  rows: CountryRegistryRowV166[],
  regionList: CountryRegionV165[] | undefined
): CountryPickerGroupV165[] {
  const regions = new Map((regionList || []).map((region) => [region.key, region]));
  const grouped = new Map<string, { region: CountryRegionV165; countries: CountryPickerEntryV165[] }>();
  rows.forEach((country) => {
    const region = (country.region && regions.get(country.region)) || OTHER_REGION_V165;
    const bucket = grouped.get(region.key) || { region, countries: [] };
    bucket.countries.push(entryV165(country));
    grouped.set(region.key, bucket);
  });
  return [...grouped.values()]
    .sort((left, right) => left.region.order - right.region.order)
    .map(({ region, countries }) => ({ key: region.key, nameKo: region.nameKo, countries: countries.sort(byLiveThenNameKoV166) }));
}

/** The listed countries: grouped by region from five, otherwise one unnamed group. */
function listedGroupsV166(
  listed: CountryRegistryRowV166[],
  regionList: CountryRegionV165[] | undefined
): CountryPickerGroupV165[] {
  if (listed.length < COUNTRY_PICKER_GROUP_FROM_V165) {
    return [{ key: "", nameKo: "", countries: listed.map(entryV165).sort(byLiveThenNameKoV166) }];
  }
  return groupByRegionV166(listed, regionList);
}

export function countryPickerModelV165(
  registry: { countries: CountryRegistryRowV166[]; regions?: CountryRegionV165[] },
  variant: CountryPickerVariantV165
): CountryPickerModelV165 {
  const live = registry.countries.filter((country) => country.status === "live").map(entryV165);
  const listed = registry.countries.filter((country) => country.status === "live" || country.status === "preparing");
  const preparing = listed.length - live.length;
  const searchable = listed.length >= COUNTRY_PICKER_SEARCH_FROM_V165;
  if (variant === "overview" && live.length >= 1 && preparing > 0) {
    const groups = listedGroupsV166(listed, registry.regions);
    if (listed.length > COUNTRY_PICKER_ROWS_MAX_V166) return { mode: "list", live, groups, searchable };
    const ordered = groups.flatMap((group) => group.countries.filter((entry) => entry.live));
    return { mode: "rows", live: ordered, groups, searchable: false };
  }
  if (live.length <= 1) return { mode: "single", live, groups: [], searchable: false };
  if (variant !== "header" && live.length <= COUNTRY_PICKER_SEGMENTED_MAX_V165) {
    return { mode: "segmented", live, groups: [], searchable: false };
  }
  return { mode: "list", live, groups: listedGroupsV166(listed, registry.regions), searchable };
}

/**
 * The page selects (finder, download, detail, map) keep their native
 * `<select>`; from five public countries their options are grouped by region
 * (`<optgroup>`). Only public countries are options there, by Korean name
 * within a region.
 */
export function countrySelectGroupsV165(
  registry: { countries: CountryRegistryRowV166[]; regions?: CountryRegionV165[] },
  liveIso3: string[]
): CountryPickerGroupV165[] | null {
  if (liveIso3.length < COUNTRY_PICKER_GROUP_FROM_V165) return null;
  const rows = liveIso3
    .map((iso3) => registry.countries.find((row) => row.iso3 === iso3))
    .filter((row): row is CountryRegistryRowV166 => Boolean(row));
  return groupByRegionV166(rows, registry.regions);
}

/**
 * V166: every country the platform names, by region (public first within a
 * region) - the guide's "제공 국가" table. Empty before the registry is read.
 */
export function countryRegionTableV166(registry: {
  countries: CountryRegistryRowV166[];
  regions?: CountryRegionV165[];
}): CountryPickerGroupV165[] {
  const listed = registry.countries.filter((country) => country.status === "live" || country.status === "preparing");
  return listed.length ? groupByRegionV166(listed, registry.regions) : [];
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
