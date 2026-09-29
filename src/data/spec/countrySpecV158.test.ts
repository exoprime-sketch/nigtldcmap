import { afterEach, describe, expect, jest, test } from "@jest/globals";
import { readdirSync, readFileSync, existsSync } from "node:fs";
import { join, resolve } from "node:path";

import {
  SPEC_AUTHORED_COUNTRIES_V158,
  countrySourceLabelV158,
  countrySpecificElementIdsV158,
  getCardSpecForCountryV158,
  getTypologyForCountryV158,
  loadDatasetSpecForCountryV158,
  publicTitleForCountryV158,
  specNeedsCountryScopeV158,
} from "./countrySpecV158";
import { getCardSpecV159, getTypologyV159, loadDatasetSpecV159 } from "./datasetSpecV159";
import {
  DEFAULT_COUNTRY_ISO3_V158,
  loadCountryRegistryV158,
  resetCountryRegistryCacheV158,
} from "../countryContext";
import {
  getCountryDataProviderV122,
  listCountryDataProvidersV122,
} from "../countries/countryDataProviderRegistryV122";
import { mapViewFromRegistryV158 } from "../countries/registryCountryDataProviderV158";

const ROOT = resolve(__dirname, "../../..");
const readJson = (path: string) => JSON.parse(readFileSync(resolve(ROOT, path), "utf8"));
const registry = readJson("public/data/countries.json");
// Any registry country other than the default one; the tests name none.
const other = registry.countries.find((row: { iso3: string }) => row.iso3 !== DEFAULT_COUNTRY_ISO3_V158);
const otherCatalog = readJson(`public${other.dataRoot}/catalog.json`).elements as Array<Record<string, unknown>>;
const itemFor = (elementId: string) => {
  const raw = otherCatalog.find((row) => row.elementId === elementId) as Record<string, unknown>;
  return {
    elementId,
    publicStatus: raw.publicStatus as string,
    sourceOrganizations: raw.sourceOrganizations as string[],
    raw,
  };
};

afterEach(() => {
  resetCountryRegistryCacheV158();
  jest.restoreAllMocks();
});

describe("country spec layer V158", () => {
  test("the authored countries equal the use-case import's registry countries", () => {
    expect([...SPEC_AUTHORED_COUNTRIES_V158]).toEqual(readJson("src/data/spec/useCasesV159.json").registryCountries);
  });

  test("the country-specific list equals every ETL country declaration", () => {
    const dir = resolve(ROOT, "tools/etl/countries");
    const declared = readdirSync(dir)
      .map((name) => join(dir, name, "country.json"))
      .filter((path) => existsSync(path))
      .map((path) => JSON.parse(readFileSync(path, "utf8")).countrySpecificElements?.elementIds)
      .filter(Boolean);
    expect(declared.length).toBeGreaterThan(0);
    declared.forEach((ids) => expect(ids).toEqual(countrySpecificElementIdsV158()));
  });

  test("the default country sees the V159 spec unchanged", async () => {
    expect(specNeedsCountryScopeV158(DEFAULT_COUNTRY_ISO3_V158)).toBe(false);
    expect(getCardSpecForCountryV158("A-030", DEFAULT_COUNTRY_ISO3_V158)).toBe(getCardSpecV159("A-030"));
    expect(getTypologyForCountryV158("A-017", DEFAULT_COUNTRY_ISO3_V158, itemFor("A-017"))).toBe(getTypologyV159("A-017"));
    const own = await loadDatasetSpecForCountryV158("B-003", DEFAULT_COUNTRY_ISO3_V158);
    const base = await loadDatasetSpecV159("B-003");
    expect(own.spec).toBe(base.spec);
    expect(own.cases).toBe(base.cases);
    expect(own.hidden).toEqual({ fields: [], cases: [] });
  });

  test("a country-specific element shows the country's own name and source", () => {
    const card = getCardSpecForCountryV158("A-030", other.iso3, itemFor("A-030"));
    const label = (itemFor("A-030").raw.countryElementLabels as string[])[0];
    expect(card?.baseName).toBe(label);
    expect(card?.sourceLabel).toBe(countrySourceLabelV158(itemFor("A-030")));
    expect(card?.baseName).not.toBe(getCardSpecV159("A-030")?.baseName);
  });

  test("every card source comes from the country's own catalog", () => {
    const card = getCardSpecForCountryV158("A-024", other.iso3, itemFor("A-024"));
    expect(card?.sourceLabel).toBe(countrySourceLabelV158(itemFor("A-024")));
    // The shared name carries no other country, so it stays.
    expect(card?.baseName).toBe(getCardSpecV159("A-024")?.baseName);
  });

  test("a shared title naming another country falls back to the country's own label", () => {
    const shared = "베트남 송전망";
    const title = publicTitleForCountryV158("A-024", other.iso3, shared, itemFor("A-024"));
    expect(title).not.toContain("베트남");
    expect(title.length).toBeGreaterThan(0);
  });

  test("a type set to status note by the default country's exclusion returns to the spec type", () => {
    const base = getTypologyV159("A-017");
    expect(base?.displayType).toBe("U0");
    const row = getTypologyForCountryV158("A-017", other.iso3, itemFor("A-017"));
    expect(row?.displayType).toBe(base?.specDisplayType);
    expect(row?.status).toBe("공개");
  });

  test("an element the country did not deliver is a status note", () => {
    const missing = otherCatalog.find((row) => row.publicStatus === "not-provided") as Record<string, unknown>;
    const row = getTypologyForCountryV158(missing.elementId as string, other.iso3, itemFor(missing.elementId as string));
    expect(row?.displayType).toBe("U0");
    expect(row?.status).toBe("미입고");
  });

  test("spec text for another country drops paragraphs naming other countries and the reference line", async () => {
    const scoped = await loadDatasetSpecForCountryV158("A-029", other.iso3);
    const base = await loadDatasetSpecV159("A-029");
    expect(scoped.spec?.refApa).toBe("");
    expect(scoped.spec?.refLink).toBe("");
    expect(scoped.spec?.decisionNote).toBeNull();
    const visible = [scoped.spec?.description, scoped.spec?.usage, scoped.spec?.shortDefinition].join("\n");
    expect(visible).not.toContain("베트남");
    expect(scoped.cases.length).toBeLessThanOrEqual(base.cases.length);
    scoped.cases.forEach((item) => expect(`${item.purpose}${item.logic}${item.storyline}${item.cautionDisplay}`).not.toContain("베트남"));
  });

  test("a registry country gets a provider once the registry is read, with its map view", async () => {
    const live = {
      ...registry,
      countries: registry.countries.map((row: Record<string, unknown>) => ({ ...row, status: "live" })),
    };
    jest.spyOn(globalThis, "fetch").mockImplementation(async () => new Response(JSON.stringify(live)) as never);
    await loadCountryRegistryV158((path) => path);
    const provider = getCountryDataProviderV122(other.iso3);
    expect(provider?.countryIso3).toBe(other.iso3);
    expect(provider?.countryNameKo).toBe(other.nameKo);
    expect(provider?.mapView).toEqual(mapViewFromRegistryV158(other));
    expect(listCountryDataProvidersV122().map((item) => item.countryIso3)).toContain(other.iso3);
  });
});
