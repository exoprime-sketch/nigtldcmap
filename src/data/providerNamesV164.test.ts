import { describe, expect, it } from "@jest/globals";
import { readFileSync } from "fs";
import { resolve } from "path";
import {
  itemHasProviderV164,
  itemProviderNamesV164,
  providerFilterOptionsV164,
  providerLineV164,
  providerOrganisationsV164,
} from "./providerNamesV164";

const UNFCCC_LIST =
  "UNFCCC | 좌표(행정구역): UNEP Copenhagen Climate Centre — CDM Pipeline | 좌표(발전소): World Resources Institute — Global Power Plant Database v1.3.0 · United Nations Framework Convention on Climate Change (UNFCCC)";
const GADM_ONLY = "경계 GADM 4.1 ADM1";
const WORLDCOVER = "ESA WorldCover 10 m v200 (2021) · 경계 GADM 4.1 ADM1";
const FOREST_WATCH =
  "Global Forest Watch (UMD/WRI, Hansen et al. 2013) · Global Forest Watch / Hansen (UMD) · Global Forest Watch (UMD/WRI) — Hansen/UMD tree cover loss × 습윤열대 1차림 지도(Turubanova et al. 2018)";
const WASTE =
  "World Bank Group — What a Waste 3.0: Global Snapshot of Solid Waste Management Toward Circularity until 2050 (2026-03)";

describe("providerOrganisationsV164", () => {
  it("reads a '|' list with coordinate clauses as the one organisation it names", () => {
    expect(providerOrganisationsV164(UNFCCC_LIST)).toEqual(["UNFCCC"]);
  });

  it("drops boundary clauses (GADM) and keeps the organisation before them", () => {
    expect(providerOrganisationsV164(WORLDCOVER)).toEqual(["European Space Agency (ESA)"]);
  });

  it("names nothing for a string that is only a boundary clause", () => {
    expect(providerOrganisationsV164(GADM_ONLY)).toEqual([]);
    expect(providerOrganisationsV164("")).toEqual([]);
    expect(providerOrganisationsV164(null)).toEqual([]);
  });

  it("collapses one organisation written several ways into one name", () => {
    expect(providerOrganisationsV164(FOREST_WATCH)).toEqual(["Global Forest Watch"]);
    expect(providerOrganisationsV164(WASTE)).toEqual(["World Bank"]);
    expect(providerOrganisationsV164("World Bank CCKP (CMIP6 x0.25)")).toEqual(["World Bank"]);
    expect(providerOrganisationsV164("World Bank/ESMAP")).toEqual(["World Bank"]);
  });

  it("splits a list of organisations and keeps each once", () => {
    expect(
      providerOrganisationsV164("Global Environment Facility · Green Climate Fund · Adaptation Fund Board Secretariat · Climate Investment Funds")
    ).toEqual([
      "Global Environment Facility (GEF)",
      "Green Climate Fund (GCF)",
      "Adaptation Fund Board Secretariat",
      "Climate Investment Funds",
    ]);
  });

  it("drops the dataset and edition written after the organisation", () => {
    expect(providerOrganisationsV164("방글라데시 재무부 재정국(Finance Division, Ministry of Finance) — Climate Financing for Sustainable Development (기후예산보고서) — FY2019-20판")).toEqual([
      "방글라데시 재무부 재정국",
    ]);
    expect(providerOrganisationsV164("Green Climate Fund (GCF) Open Data Library · Projects Export")).toEqual(["Green Climate Fund (GCF)"]);
  });
});

describe("providerFilterOptionsV164", () => {
  const items = [
    { sourceOrganizations: [UNFCCC_LIST] },
    { sourceOrganizations: [WORLDCOVER, GADM_ONLY] },
    { sourceOrganizations: [WASTE, "World Bank CCKP (CMIP6 x0.25)"] },
    { sourceOrganizations: [FOREST_WATCH] },
  ];

  it("lists organisation names only, once each", () => {
    const options = providerFilterOptionsV164(items);
    expect(options).toHaveLength(4);
    expect(options).toEqual(
      expect.arrayContaining(["European Space Agency (ESA)", "Global Forest Watch", "UNFCCC", "World Bank"])
    );
  });

  it("offers no boundary clause, separator or source-string length", () => {
    for (const option of providerFilterOptionsV164(items)) {
      expect(option).not.toMatch(/GADM|ADM1|\||좌표\(|경계 /u);
      expect(option.length).toBeLessThanOrEqual(80);
    }
  });
});

describe("providerFilterOptionsV164 on the published catalogues", () => {
  const ROOT = resolve(__dirname, "../..");
  const catalogue = (dir: string) =>
    (JSON.parse(readFileSync(resolve(ROOT, "public/data", dir, "v2/catalog.json"), "utf8")).elements as Array<{
      elementId: string;
      sourceOrganizations: string[];
    }>);

  for (const dir of ["bgd", "vietnam"]) {
    it(`${dir}: offers organisation names only - no boundary clause, '|' list, or string over 80 characters`, () => {
      const items = catalogue(dir);
      const rawStrings = new Set(items.flatMap((item) => item.sourceOrganizations));
      const options = providerFilterOptionsV164(items);
      expect(options.length).toBeGreaterThan(20);
      // Far fewer options than source strings: one organisation is one option.
      expect(options.length).toBeLessThan(rawStrings.size);
      for (const option of options) {
        expect(option).not.toMatch(/GADM|geoBoundaries|\||^좌표|^경계 /u);
        expect(option.length).toBeLessThanOrEqual(80);
      }
    });

    it(`${dir}: every option leads to at least one dataset, and a dataset is found by any of its organisations`, () => {
      const items = catalogue(dir);
      for (const option of providerFilterOptionsV164(items)) {
        expect(items.some((item) => itemHasProviderV164(item, option))).toBe(true);
      }
      for (const item of items) {
        for (const name of itemProviderNamesV164(item.sourceOrganizations)) {
          expect(itemHasProviderV164(item, name)).toBe(true);
        }
      }
    });
  }
});

describe("itemHasProviderV164", () => {
  const item = { sourceOrganizations: [UNFCCC_LIST, WORLDCOVER] };

  it("matches when any of the item's organisations is the chosen one", () => {
    expect(itemHasProviderV164(item, "UNFCCC")).toBe(true);
    expect(itemHasProviderV164(item, "European Space Agency (ESA)")).toBe(true);
    expect(itemHasProviderV164(item, "World Bank")).toBe(false);
  });

  it("does not match on a boundary clause", () => {
    expect(itemHasProviderV164(item, "GADM 4.1")).toBe(false);
  });

  it("still matches an address saved with a source string as written", () => {
    expect(itemHasProviderV164(item, WORLDCOVER)).toBe(true);
  });

  it("treats 'all' and an empty choice as no filter", () => {
    expect(itemHasProviderV164(item, "all")).toBe(true);
    expect(itemHasProviderV164(item, "")).toBe(true);
  });
});

describe("itemProviderNamesV164 / providerLineV164", () => {
  it("merges the organisations of an item's source strings once each", () => {
    expect(itemProviderNamesV164([WASTE, "World Bank CCKP (CMIP6 x0.25)", UNFCCC_LIST])).toEqual(["World Bank", "UNFCCC"]);
  });

  it("writes a card's source line with the coordinate clauses removed", () => {
    expect(providerLineV164(UNFCCC_LIST)).toBe("UNFCCC");
    expect(providerLineV164(GADM_ONLY)).toBe("");
  });

  it("counts the organisations past the limit", () => {
    expect(
      providerLineV164("Global Environment Facility · Green Climate Fund · Adaptation Fund Board Secretariat · Climate Investment Funds", 2)
    ).toBe("Global Environment Facility · Green Climate Fund 외 2");
  });

  it("reads a list of source strings like one string", () => {
    expect(providerLineV164([FOREST_WATCH, "Global Forest Watch / Hansen (UMD)", WORLDCOVER], 3)).toBe(
      "Global Forest Watch (UMD/WRI, Hansen et al. 2013) · ESA WorldCover 10 m v200 (2021)"
    );
  });
});
