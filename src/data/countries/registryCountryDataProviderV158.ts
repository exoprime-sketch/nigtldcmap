/**
 * V158: a data provider for a country named in `public/data/countries.json`.
 *
 * The default country keeps its hand-written provider
 * (`vietnamCountryDataProviderV122.ts`). Every other registry country gets one
 * from here: the same catalog mapping, the country's own loader instance, the
 * name, slug and map view from the registry entry, and the country-aware card
 * titles and sources of `countrySpecV158`. Adding a country to the registry is
 * therefore all it takes to have a provider; whether the country is offered is
 * still decided by its `status` (see `countryDataProviderRegistryV122`).
 */
import { countryDataLoaderV158 } from "./countryDataLoaderV158";
import { toCountryCatalogItemBaseV158 } from "./vietnamCountryDataProviderV122";
import type {
  CountryCatalogItemV122,
  CountryDataProviderV122,
  CountryMapLayerV122,
  CountryMapViewV122,
  CountrySearchEntryV122,
} from "./countryDataTypesV122";
import {
  safePublicFilenamePartV122,
  publicDatasetShortTitleV122,
  publicDatasetTitleV122,
  removeInternalSearchTokensV122,
} from "./publicLabelsV122";
import {
  elementIdFromPublicSlugV121,
  publicElementPathTokenV121,
} from "../vietnam/vietnamElementSlugsV121";
import type { VietnamCatalogElementV124 } from "../vietnam/vietnamTypesV124";
import {
  countryAssetPathV158,
  type CountryRegistryEntryV158,
} from "../countryContext";
import { publicAssetUrlV128 } from "../../utils/publicAssetUrlV128";
import {
  getCardSpecForCountryV158,
  publicTitleForCountryV158,
  type CountrySpecItemV158,
} from "../spec/countrySpecV158";
import { publicSourceOrganizationV136_1 } from "../visualization/publicFieldPolicyV126";

const SHORT_TITLE_MAX_V158 = 34;

function shortTitle(title: string): string {
  return title.length > SHORT_TITLE_MAX_V158 ? `${title.slice(0, SHORT_TITLE_MAX_V158 - 1).trim()}…` : title;
}

/** The registry bbox as a map view: its centre, the registry zoom, the bbox. */
export function mapViewFromRegistryV158(entry: CountryRegistryEntryV158): CountryMapViewV122 {
  const [west, south, east, north] = entry.bbox;
  return {
    center: [(west + east) / 2, (south + north) / 2],
    zoom: entry.defaultZoom,
    bounds: [
      [west, south],
      [east, north],
    ],
  };
}

export function createRegistryCountryDataProviderV158(
  entry: CountryRegistryEntryV158
): CountryDataProviderV122 {
  const iso3 = entry.iso3;
  const providerId = `${iso3.toLowerCase()}-v158`;
  const loader = countryDataLoaderV158(iso3);

  function toCatalogItem(item: VietnamCatalogElementV124): CountryCatalogItemV122 {
    const base = toCountryCatalogItemBaseV158(item);
    const specItem: CountrySpecItemV158 = {
      elementId: item.elementId,
      publicTitle: base.publicTitle,
      publicStatus: item.publicStatus,
      sourceOrganizations: item.sourceOrganizations,
      raw: item,
    };
    const publicTitle = publicTitleForCountryV158(item.elementId, iso3, base.publicTitle, specItem);
    const publicShortTitle =
      publicTitle === base.publicTitle
        ? publicTitleForCountryV158(item.elementId, iso3, base.publicShortTitle, specItem)
        : shortTitle(publicTitle);
    // The country's own public source names; when every recorded name is a
    // compiler's note, the country's card source line (see countrySpecV158).
    const named = Array.from(
      new Set(
        item.sourceOrganizations
          .map((organization) => publicSourceOrganizationV136_1(organization))
          .filter((organization): organization is string => organization !== null)
      )
    );
    const cardSource = getCardSpecForCountryV158(item.elementId, iso3, specItem)?.sourceLabel || "";
    return {
      ...base,
      providerId,
      countryIso3: iso3,
      countryNameKo: entry.nameKo,
      countryNameEn: entry.nameEn,
      publicTitle,
      publicShortTitle,
      sourceOrganizations: named.length > 0 ? named : cardSource ? [cardSource] : [],
    };
  }

  return {
    providerId,
    countryIso3: iso3,
    countryNameKo: entry.nameKo,
    countryNameEn: entry.nameEn,
    // The file-name slug comes from the registry's English name (V158-B2b), not a table in code.
    countryPublicSlug: safePublicFilenamePartV122(entry.nameEn || iso3),
    dataSchemaVersion: "v124",
    get manifestUrl() {
      return publicAssetUrlV128(countryAssetPathV158(iso3, "manifest.json"));
    },
    availability: "available",
    mapView: mapViewFromRegistryV158(entry),
    loadManifest: () => loader.loadManifest(),
    async loadCatalog() {
      return (await loader.loadCatalog()).map(toCatalogItem);
    },
    async loadSearchIndex() {
      const [rawCatalog, index] = await Promise.all([loader.loadCatalog(), loader.loadSearchIndex()]);
      const catalogById = new Map<string, CountryCatalogItemV122>(
        rawCatalog.map((item) => [item.elementId, toCatalogItem(item)])
      );
      const result = new Map<string, CountrySearchEntryV122>();
      index.forEach((entryValue, elementId) => {
        const item = catalogById.get(elementId);
        if (!item) return;
        result.set(elementId, {
          providerId,
          countryIso3: iso3,
          elementId,
          publicSlug: item.publicSlug,
          publicTitle: item.publicTitle,
          searchText: removeInternalSearchTokensV122(
            [item.publicTitle, item.publicDescription, entryValue.searchText].join(" ")
          ),
          keywords: entryValue.keywords.map(removeInternalSearchTokensV122).filter(Boolean),
        });
      });
      return result;
    },
    async loadMapIndex() {
      return (await loader.loadMapIndex()).map((layer): CountryMapLayerV122 => {
        const shared = publicDatasetTitleV122(layer.elementId, layer.label);
        const publicTitle = publicTitleForCountryV158(layer.elementId, iso3, shared);
        return {
          ...layer,
          providerId,
          countryIso3: iso3,
          countryNameKo: entry.nameKo,
          publicTitle,
          publicShortTitle:
            publicTitle === shared ? publicDatasetShortTitleV122(layer.elementId, layer.label) : shortTitle(publicTitle),
        };
      });
    },
    loadElementBundle: (elementId: string) => loader.loadElementBundle(elementId),
    loadElementEntities: (elementId: string) => loader.loadElementEntities(elementId),
    loadSourceRegistry: <T = unknown>() => loader.loadSourceRegistry<T>(),
    resolveElementId: elementIdFromPublicSlugV121,
    publicElementToken: publicElementPathTokenV121,
    clearCache: () => loader.clearCache(),
  };
}
