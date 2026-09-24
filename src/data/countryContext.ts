/**
 * Where a country's published data lives, and which countries are offered.
 *
 * Every asset URL used to be written out by hand as "/data/vietnam/v2/…" in 294
 * places across the app, the builders and the audits. A second country cannot be
 * added by editing 294 strings, so the path is built from the registry instead:
 * `dataUrl("VNM", "catalog.json")`.
 *
 * `public/data/countries.json` is the runtime source of truth. It carries each
 * country's data root, level-1 administrative system, bbox and status. Only a
 * country with `status: "live"` may be selected with `?country=`; one that is
 * still `preparing` (Bangladesh, until its ingest lands) is refused and the
 * caller falls back to the default country, keeping the rest of the URL intact.
 *
 * The live set is also known synchronously, because the first render decides the
 * view from the URL before any fetch can finish. The bundled fallback below is
 * asserted against `countries.json` by a unit test, so the two cannot drift.
 */

export type CountryStatusV158 = "live" | "preparing";

export interface CountryAdminLevelV158 {
  count: number;
  label: string;
  asset: string;
  keyScheme: string;
}

export interface CountryRegistryEntryV158 {
  iso3: string;
  nameKo: string;
  nameEn: string;
  dataRoot: string;
  adm: { level1: CountryAdminLevelV158 };
  bbox: [number, number, number, number];
  defaultZoom: number;
  boundaryEpoch: string;
  categoriesAvailable: string[];
  status: CountryStatusV158;
}

export interface CountryRegistryV158 {
  schemaVersion: string;
  generatedAt: string;
  countries: CountryRegistryEntryV158[];
}

/** The country used when the URL names none, or names one that is not live. */
export const DEFAULT_COUNTRY_ISO3_V158 = "VNM";

/**
 * Data roots known at build time. The registry file is authoritative at runtime;
 * this exists so the first render can resolve a path and a `?country=` value
 * without waiting for a fetch. `countryContext.test.ts` asserts it matches.
 */
const BUNDLED_DATA_ROOTS_V158: Record<string, string> = {
  VNM: "/data/vietnam/v2",
  BGD: "/data/bgd/v2",
};

/** Countries offered right now. Bangladesh joins when its ingest is published. */
const BUNDLED_LIVE_ISO3_V158 = ["VNM"];

export const COUNTRY_REGISTRY_URL_V158 = "data/countries.json";

export function normalizeCountryIso3V158(value: string | null | undefined): string {
  return String(value ?? "").trim().toUpperCase();
}

export function isLiveCountryV158(value: string | null | undefined): boolean {
  const iso3 = normalizeCountryIso3V158(value);
  const entry = registryCache?.countries.find((row) => row.iso3 === iso3);
  return entry ? entry.status === "live" : BUNDLED_LIVE_ISO3_V158.includes(iso3);
}

/**
 * The `?country=` contract: a live country, or null. A caller that needs a
 * country falls back to {@link DEFAULT_COUNTRY_ISO3_V158} and leaves every other
 * parameter (`view=`, `element=`, deep links) untouched.
 */
export function dataCountryParamV158(value: string | null | undefined): string | null {
  const iso3 = normalizeCountryIso3V158(value);
  return iso3 && isLiveCountryV158(iso3) ? iso3 : null;
}

export function countryDataRootV158(country: string | null | undefined): string {
  const iso3 = normalizeCountryIso3V158(country) || DEFAULT_COUNTRY_ISO3_V158;
  const fromRegistry = registryCache?.countries.find((row) => row.iso3 === iso3)?.dataRoot;
  const root = fromRegistry || BUNDLED_DATA_ROOTS_V158[iso3];
  if (!root) throw new Error(`UNKNOWN_COUNTRY_DATA_ROOT: ${iso3}`);
  return root;
}

/**
 * A published asset's URL, relative to the country's data root.
 *
 * `relPath` is written without a leading slash ("catalog.json",
 * "geometry/vnm-adm1-34.geojson"), which is how the callers name their files.
 */
export function dataUrl(country: string | null | undefined, relPath: string): string {
  const root = countryDataRootV158(country);
  const tail = String(relPath ?? "").replace(/^\/+/u, "");
  return tail ? `${root}/${tail}` : root;
}

/** The default country's asset URL, for callers that have no country in hand. */
export function vietnamDataUrlV158(relPath: string): string {
  return dataUrl(DEFAULT_COUNTRY_ISO3_V158, relPath);
}

let registryCache: CountryRegistryV158 | null = null;
let registryRequest: Promise<CountryRegistryV158> | null = null;

/** The bundled view of the registry, used before `countries.json` is read. */
export function bundledCountryRegistryV158(): Pick<CountryRegistryV158, "countries"> {
  return {
    countries: Object.entries(BUNDLED_DATA_ROOTS_V158).map(([iso3, dataRoot]) => ({
      iso3,
      nameKo: iso3,
      nameEn: iso3,
      dataRoot,
      adm: { level1: { count: 0, label: "", asset: "", keyScheme: "" } },
      bbox: [0, 0, 0, 0] as [number, number, number, number],
      defaultZoom: 0,
      boundaryEpoch: "",
      categoriesAvailable: [],
      status: BUNDLED_LIVE_ISO3_V158.includes(iso3) ? "live" : "preparing",
    })),
  };
}

export function countryRegistryCacheV158(): CountryRegistryV158 | null {
  return registryCache;
}

/** For tests: forget what was loaded so the next call reads the file again. */
export function resetCountryRegistryCacheV158(): void {
  registryCache = null;
  registryRequest = null;
}

/**
 * Reads `public/data/countries.json` once and keeps it. A failure leaves the
 * bundled view in place rather than breaking a screen: the registry adds
 * labels, bboxes and statuses, and the default country works without it.
 */
export async function loadCountryRegistryV158(
  assetUrl: (relPath: string) => string
): Promise<CountryRegistryV158 | null> {
  if (registryCache) return registryCache;
  if (!registryRequest) {
    registryRequest = fetch(assetUrl(COUNTRY_REGISTRY_URL_V158))
      .then(async (response) => {
        if (!response.ok) {
          throw new Error(`COUNTRY_REGISTRY_HTTP_${response.status}`);
        }
        const document = (await response.json()) as CountryRegistryV158;
        if (!Array.isArray(document?.countries) || document.countries.length === 0) {
          throw new Error("COUNTRY_REGISTRY_EMPTY");
        }
        registryCache = document;
        return document;
      })
      .catch((error) => {
        registryRequest = null;
        throw error;
      });
  }
  try {
    return await registryRequest;
  } catch {
    return null;
  }
}

/**
 * The asset path as `publicAssetUrlV128` takes it: relative to `public/`, with no
 * leading slash ("data/vietnam/v2/catalog.json").
 */
export function countryAssetPathV158(
  country: string | null | undefined,
  relPath: string
): string {
  return dataUrl(country, relPath).replace(/^\/+/u, "");
}

/**
 * The published directory as it sits in the repository, for Node-side callers -
 * tests and build scripts read the same tree the browser fetches.
 */
export function countryPublicDirV158(country: string | null | undefined): string {
  return `public${countryDataRootV158(country)}`;
}
