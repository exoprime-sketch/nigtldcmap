import {
  clearVietnamDataCacheV124,
  loadVietnamCatalogV124,
  loadVietnamElementBundleV124,
  loadVietnamElementEntitiesV124,
  loadVietnamManifestV124,
  loadVietnamMapIndexV124,
  loadVietnamSearchIndexV124,
  loadVietnamSourceRegistryV124,
} from "../vietnam/vietnamDataLoaderV124";
import {
  elementIdFromPublicSlugV121,
  publicElementPathTokenV121,
} from "../vietnam/vietnamElementSlugsV121";
import type {
  VietnamCatalogElementV124,
  VietnamElementPublicStatusV124,
} from "../vietnam/vietnamTypesV124";
import type {
  CountryCatalogItemV122,
  CountryDataProviderV122,
  CountryMapLayerV122,
  CountrySearchEntryV122,
} from "./countryDataTypesV122";
import {
  publicCountrySlugV122,
  publicDatasetShortTitleV122,
  publicDatasetTitleV122,
  removeInternalSearchTokensV122,
} from "./publicLabelsV122";
import { publicSourceOrganizationV136_1 } from "../visualization/publicFieldPolicyV126";
import { publicAssetUrlV128 } from "../../utils/publicAssetUrlV128";
import { publicDatasetDescriptionV135 } from "../visualization/publicDatasetDescriptionV135";

function toCatalogItem(
  item: VietnamCatalogElementV124
): CountryCatalogItemV122 {
  const publicTitle = publicDatasetTitleV122(item.elementId, item.elementLabel);
  const hasPopulatedRows =
    item.dataPresenceStatus === "actual-records" ||
    item.dataPresenceStatus === "partial-records";
  const hasPublicData =
    hasPopulatedRows && (item.observationCount > 0 || item.entityCount > 0);
  return {
    providerId: "vietnam-v124",
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
    publicDescription: publicDatasetDescriptionV135({
      elementId: item.elementId,
      elementLabel: item.elementLabel,
      categoryLabel: item.categoryLabel,
      dataPresenceStatus: item.dataPresenceStatus,
      detailTemplate: item.detailTemplate,
      groupLabel: item.groupLabel,
      mapFeatureCount: item.mapFeatureCount,
      mapMode: item.mapMode,
      publicStatus: item.publicStatus,
      sectionLabel: item.sectionLabel,
    }),
    categoryCode: item.categoryCode,
    categoryLabel: item.categoryLabel,
    sectionCode: item.sectionCode,
    sectionLabel: item.sectionLabel,
    groupCode: item.groupCode,
    groupLabel: item.groupLabel,
    latestYear: item.latestYear,
    // Some organisation names arrive with the compiler's own note about which
    // sheet column varies per row. That note is not a source, and it reached
    // the finder's source filter as a selectable value.
    sourceOrganizations: item.sourceOrganizations
      .map((organization) => publicSourceOrganizationV136_1(organization))
      .filter((organization): organization is string => organization !== null),
    sourceUrls: item.sourceUrls,
    technologyIds: item.technologyIds,
    publicStatus: item.publicStatus,
    publicStatusLabel: publicStatusLabelV124(item.publicStatus),
    dataPresenceStatus: item.dataPresenceStatus,
    emptyReason: item.emptyReason,
    displayAllowed: item.displayAllowed !== false,
    downloadAllowed: item.downloadAllowed === true,
    isDiscoverable: true,
    hasPublicData,
    hasMapData: item.mapFeatureCount > 0,
    hasDownloadableData:
      hasPublicData &&
      item.downloadAllowed === true &&
      item.downloadableRecordCount > 0,
    observationCount: item.observationCount,
    entityCount: item.entityCount,
    mapFeatureCount: item.mapFeatureCount,
    downloadableRecordCount: item.downloadableRecordCount,
    downloadAssets: item.downloadAssets || [],
    raw: item,
  };
}

function publicStatusLabelV124(
  status: VietnamElementPublicStatusV124
): string {
  const labels: Record<VietnamElementPublicStatusV124, string> = {
    actual: "데이터 제공",
    partial: "일부 데이터 제공",
    "public-authorized": "데이터 제공",
    "schema-only": "입력 양식",
    "data-entry-planned": "입력 예정",
    "not-collected": "원자료 미수집",
    quarantined: "현재 제공하지 않음",
  };
  return labels[status];
}

export const VietnamCountryDataProviderV122: CountryDataProviderV122 = {
  providerId: "vietnam-v124",
  countryIso3: "VNM",
  countryNameKo: "베트남",
  countryNameEn: "Viet Nam",
  countryPublicSlug: publicCountrySlugV122("VNM"),
  dataSchemaVersion: "v124",
  manifestUrl: publicAssetUrlV128("data/vietnam/v2/manifest.json"),
  availability: "available",
  mapView: {
    center: [106.2, 16.1],
    zoom: 4.6,
    bounds: [
      [102.0, 8.0],
      [110.8, 23.8],
    ],
  },
  loadManifest: loadVietnamManifestV124,
  async loadCatalog() {
    return (await loadVietnamCatalogV124()).map(toCatalogItem);
  },
  async loadSearchIndex() {
    const [rawCatalog, index] = await Promise.all([
      loadVietnamCatalogV124(),
      loadVietnamSearchIndexV124(),
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
        providerId: "vietnam-v124",
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
    return (await loadVietnamMapIndexV124()).map(
      (layer): CountryMapLayerV122 => ({
        ...layer,
        providerId: "vietnam-v124",
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
  loadElementBundle: loadVietnamElementBundleV124,
  loadElementEntities: loadVietnamElementEntitiesV124,
  loadSourceRegistry: loadVietnamSourceRegistryV124,
  resolveElementId: elementIdFromPublicSlugV121,
  publicElementToken: publicElementPathTokenV121,
  clearCache: clearVietnamDataCacheV124,
};
