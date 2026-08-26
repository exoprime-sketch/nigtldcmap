import {
  clearVietnamDataCacheV121,
  loadVietnamCatalogV121,
  loadVietnamElementBundleV121,
  loadVietnamElementEntitiesV121,
  loadVietnamManifestV121,
  loadVietnamMapIndexV121,
  loadVietnamSearchIndexV121,
  loadVietnamSourceRegistryV121,
} from "../vietnam/vietnamDataLoaderV121";
import {
  elementIdFromPublicSlugV121,
  publicElementPathTokenV121,
} from "../vietnam/vietnamElementSlugsV121";
import type { VietnamCatalogElementV121 } from "../vietnam/vietnamTypesV121";
import type {
  CountryCatalogItemV122,
  CountryDataProviderV122,
  CountryMapLayerV122,
  CountrySearchEntryV122,
} from "./countryDataTypesV122";
import {
  publicCountrySlugV122,
  publicDatasetDescriptionV122,
  publicDatasetShortTitleV122,
  publicDatasetTitleV122,
  removeInternalSearchTokensV122,
} from "./publicLabelsV122";

function toCatalogItem(
  item: VietnamCatalogElementV121
): CountryCatalogItemV122 {
  const publicTitle = publicDatasetTitleV122(item.elementId, item.elementLabel);
  return {
    providerId: "vietnam-v121",
    countryIso3: "VNM",
    countryNameKo: "베트남",
    countryNameEn: "Viet Nam",
    elementId: item.elementId,
    publicSlug: publicElementPathTokenV121(item.elementId),
    rawLabel: item.elementLabel,
    publicTitle,
    publicShortTitle: publicDatasetShortTitleV122(
      item.elementId,
      item.elementLabel
    ),
    publicDescription: publicDatasetDescriptionV122(item),
    categoryCode: item.categoryCode,
    categoryLabel: item.categoryLabel,
    sectionCode: item.sectionCode,
    sectionLabel: item.sectionLabel,
    groupCode: item.groupCode,
    groupLabel: item.groupLabel,
    latestYear: item.latestYear,
    sourceOrganizations: item.sourceOrganizations,
    sourceUrls: item.sourceUrls,
    technologyIds: item.technologyIds,
    hasPublicData:
      item.publicStatus !== "not-in-package" &&
      (item.observationCount > 0 ||
        item.entityCount > 0 ||
        item.availableIndicatorCount > 0),
    hasMapData: item.mapFeatureCount > 0,
    hasDownloadableData: item.downloadableRecordCount > 0,
    observationCount: item.observationCount,
    entityCount: item.entityCount,
    mapFeatureCount: item.mapFeatureCount,
    downloadableRecordCount: item.downloadableRecordCount,
    raw: item,
  };
}

export const VietnamCountryDataProviderV122: CountryDataProviderV122 = {
  providerId: "vietnam-v121",
  countryIso3: "VNM",
  countryNameKo: "베트남",
  countryNameEn: "Viet Nam",
  countryPublicSlug: publicCountrySlugV122("VNM"),
  dataSchemaVersion: "v121",
  manifestUrl: "/data/vietnam/v1/manifest.json",
  availability: "available",
  mapView: {
    center: [106.2, 16.1],
    zoom: 4.6,
    bounds: [
      [102.0, 8.0],
      [110.8, 23.8],
    ],
  },
  loadManifest: loadVietnamManifestV121,
  async loadCatalog() {
    return (await loadVietnamCatalogV121()).map(toCatalogItem);
  },
  async loadSearchIndex() {
    const [rawCatalog, index] = await Promise.all([
      loadVietnamCatalogV121(),
      loadVietnamSearchIndexV121(),
    ]);
    const catalog: CountryCatalogItemV122[] = rawCatalog.map(toCatalogItem);
    const catalogById = new Map<string, CountryCatalogItemV122>(
      catalog.map((item) => [item.elementId, item])
    );
    const result = new Map<string, CountrySearchEntryV122>();
    index.forEach((entry, elementId) => {
      const item = catalogById.get(elementId);
      if (!item) return;
      result.set(elementId, {
        providerId: "vietnam-v121",
        countryIso3: "VNM",
        elementId,
        publicSlug: item.publicSlug,
        publicTitle: item.publicTitle,
        searchText: removeInternalSearchTokensV122(
          [item.publicTitle, item.publicDescription, entry.searchText].join(" ")
        ),
        keywords: entry.keywords
          .map(removeInternalSearchTokensV122)
          .filter(Boolean),
      });
    });
    return result;
  },
  async loadMapIndex() {
    return (await loadVietnamMapIndexV121()).map(
      (layer): CountryMapLayerV122 => ({
        ...layer,
        providerId: "vietnam-v121",
        countryIso3: "VNM",
        countryNameKo: "베트남",
        publicTitle: publicDatasetTitleV122(layer.elementId, layer.label),
        publicShortTitle: publicDatasetShortTitleV122(
          layer.elementId,
          layer.label
        ),
      })
    );
  },
  loadElementBundle: loadVietnamElementBundleV121,
  loadElementEntities: loadVietnamElementEntitiesV121,
  loadSourceRegistry: loadVietnamSourceRegistryV121,
  resolveElementId: elementIdFromPublicSlugV121,
  publicElementToken: publicElementPathTokenV121,
  clearCache: clearVietnamDataCacheV121,
};
