/**
 * Screen names for investment projects whose official title has been verified.
 *
 * D-022 arrives from d-portal with `name: null` - the source carries no project
 * name at all. The card title was therefore assembled here, out of the donor,
 * the IATI activity number and the DAC sector string, and read
 * "The World Bank 투자사업 · 44000-P125996 · 23110 — 에너지 기타". That is a
 * composite this repository invented; it was never the World Bank's name for
 * the project.
 *
 * Each entry below was looked up by its own project number against the World
 * Bank projects API and kept only when the country came back Viet Nam, so a
 * project is matched by identifier and never by resemblance of name. The
 * lookup happened once, here: nothing in this file is fetched while a card is
 * being drawn.
 *
 * `officialTitle` is the World Bank's English name, quoted as returned.
 * `displayTitleKo` is this platform's Korean screen name for it - a rendering
 * of that English, not an official translation, and not to be labelled as one.
 */

export interface PublicProjectTitleEntryV136_3 {
  /** The project number the entry was verified by, e.g. "P125996". */
  projectNumber: string;
  /** The official English name, as the World Bank returns it. */
  officialTitle: string;
  /** This platform's Korean screen name, rendered from officialTitle. */
  displayTitleKo: string;
  /** Where the official name was read. */
  sourceUrl: string;
  /** What made the match trustworthy. */
  verificationBasis: string;
}

const WORLD_BANK_PROJECT_API_V136_3 =
  "https://search.worldbank.org/api/v3/projects?format=json&id=";

const VERIFIED_BY_ID_AND_COUNTRY_V136_3 =
  "project number queried directly; countryname returned Socialist Republic of Viet Nam";

function entryV136_3(
  projectNumber: string,
  officialTitle: string,
  displayTitleKo: string
): PublicProjectTitleEntryV136_3 {
  return {
    projectNumber,
    officialTitle,
    displayTitleKo,
    sourceUrl: `${WORLD_BANK_PROJECT_API_V136_3}${projectNumber}`,
    verificationBasis: VERIFIED_BY_ID_AND_COUNTRY_V136_3,
  };
}

/** Verified projects, keyed by project number. */
const PUBLIC_PROJECT_TITLES_V136_3: Record<string, PublicProjectTitleEntryV136_3> =
  Object.fromEntries(
    [
      entryV136_3("P125996", "Distribution Efficiency Project", "베트남 배전 효율화 사업"),
      entryV136_3("P103238", "Vietnam Renewable Energy Development Project", "베트남 재생에너지 개발 사업"),
      entryV136_3("P151086", "Vietnam Energy Efficiency for Industrial Enterprises(VEEIE)", "베트남 산업체 에너지효율 개선 사업"),
      entryV136_3("P122667", "Vietnam Climate Change Development Policy", "베트남 기후변화 개발정책"),
      entryV136_3("P127201", "Vietnam Climate Change Development Policy 2", "베트남 기후변화 개발정책 2차"),
      entryV136_3("P131775", "Vietnam Climate Change Development Policy 3", "베트남 기후변화 개발정책 3차"),
      entryV136_3("P155824", "Climate Change and Green Growth in Vietnam", "베트남 기후변화·녹색성장 사업"),
      entryV136_3("P171006", "Climate Change and Green Growth DPF", "기후변화·녹색성장 개발정책 금융"),
      entryV136_3("P509666", "Integrated Resilient Development Project", "통합 기후회복력 개발 사업"),
      entryV136_3("P173716", "Binh Duong Province's Water Environment Improvement Project", "빈즈엉성 수질환경 개선 사업"),
      entryV136_3("P174157", "Nghe An Province's Vinh City Priority Infrastructure and Urban Resilience Development Project", "응에안성 빈시 도시기반시설·회복력 개발 사업"),
      entryV136_3("P171700", "Vinh Long City Urban Development and Enhanced Climate Resilience Project in Vinh Long Province", "빈롱성 빈롱시 도시개발·기후회복력 강화 사업"),
      entryV136_3("P169954", "Southern Waterway Corridors and Logistics Development Project", "남부 내륙수로·물류 개발 사업"),
      entryV136_3("P157127", "Forest Sector Modernization and Coastal Resilience Enhancement Project", "산림부문 현대화·연안 회복력 강화 사업"),
      entryV136_3("P162605", "North Central Region Emission Reductions Program", "중북부지역 배출저감 프로그램"),
    ].map((entry) => [entry.projectNumber, entry])
  );

/**
 * The project number carried inside an IATI activity identifier.
 *
 * The World Bank publishes as "44000-P125996" and its trust funds as
 * "XI-IATI-WBTF-P162605"; both end in the project number the institution
 * indexes by. Anything else returns null rather than a guess.
 */
export function publicProjectNumberV136_3(
  activityId: string | null | undefined
): string | null {
  const match = String(activityId ?? "").match(/\bP\d{6}\b/u);
  return match ? match[0] : null;
}

/** The verified entry for an IATI activity identifier, when there is one. */
export function publicProjectTitleEntryV136_3(
  activityId: string | null | undefined
): PublicProjectTitleEntryV136_3 | null {
  const projectNumber = publicProjectNumberV136_3(activityId);
  if (!projectNumber) return null;
  return PUBLIC_PROJECT_TITLES_V136_3[projectNumber] || null;
}

/** Every verified entry, for the release gates. */
export function publicProjectTitleEntriesV136_3(): PublicProjectTitleEntryV136_3[] {
  return Object.values(PUBLIC_PROJECT_TITLES_V136_3);
}
