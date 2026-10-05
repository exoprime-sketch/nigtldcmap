/**
 * V162: the platform's countries for code that must know them before the
 * registry is fetched - the glossary's country tags. V166: the public ("live")
 * countries of public/data/countries.json - the registry also names the
 * countries still being prepared, which have no screens, so a term about one
 * of them stays common (as a term about any other target country does).
 * platformCountriesV162.test.ts keeps it equal to the registry's live rows.
 */
export const PLATFORM_COUNTRY_ISO3_V162: readonly string[] = ["VNM", "BGD"];
