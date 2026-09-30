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
import { countryAssetPathV158 } from "../countryContext";
import { getCardSpecV159 } from "../spec/datasetSpecV159";

/**
 * The public organisation names for a catalogue item's source filter/meta:
 * the raw list with compiler notes removed, or - when that leaves nothing,
 * because every recorded organisation was such a note - the one source name
 * the framework spec (v5.38) already gives the element's card.
 */
function sourceOrganizationsForCatalogV122(item: VietnamCatalogElementV124): string[] {
  const named = item.sourceOrganizations
    .map((organization) => publicSourceOrganizationV136_1(organization))
    .filter((organization): organization is string => organization !== null);
  if (named.length > 0) return named;
  const sourceLabel = getCardSpecV159(item.elementId)?.sourceLabel;
  return sourceLabel ? [sourceLabel] : [];
}

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
    // Some organisation names arrive with the compiler's own note - which
    // sheet column varies per row, a project-status placeholder ("확인필요",
    // "…(발주처 협의 예정)"), or which internal team assembled a public list
    // ("…(용역사 취합)"). None of those is a source, and they reached the
    // finder's source filter, the download list and the source panel as
    // selectable values (publicSourceOrganizationV136_1 drops them).
    //
    // When every organisation on record for an element turns out to be one of
    // those notes, the framework spec (db_status_framework_v5.38) still names
    // its public source in the card's own source line - the same name already
    // shown there - so that is what the filter and the fallback card meta use
    // instead of leaving the source unstated (2026-09-29).
    sourceOrganizations: sourceOrganizationsForCatalogV122(item),
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
    exclusion: item.exclusion ?? null,
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
    // V156: a decision, not a measurement - the label says so plainly.
    excluded: "제공 대상 제외",
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
  manifestUrl: publicAssetUrlV128(countryAssetPathV158("VNM", "manifest.json")),
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
