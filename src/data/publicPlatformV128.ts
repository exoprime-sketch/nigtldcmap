import {
  loadCatalogForCountrySelectionV122,
  loadCountryMapIndexV122,
  loadSearchIndexForCountrySelectionV122,
} from "./countries/countryDataFacadeV122";
import { loadVietnamManifestV124 } from "./vietnam/vietnamDataLoaderV124";
import { getElementVisualizationSummaryV125 } from "./visualization/elementVisualizationRegistryV125";
import { technologyLabelV121 } from "../utils/vietnamActualV121";
import type { CountryCatalogItemV122 } from "./countries/countryDataTypesV122";
import type { VietnamElementPublicStatusV124 } from "./vietnam/vietnamTypesV124";

export type PublicDataStatusKeyV128 =
  | "data-provided"
  | "partially-provided"
  | "input-template"
  | "planned"
  | "source-not-collected"
  | "unavailable";

export type PublicDownloadStatusKeyV128 =
  | "downloadable"
  | "display-only"
  | "no-download-data";

export interface PublicDownloadStatusV128 {
  key: PublicDownloadStatusKeyV128;
  label: "다운로드 가능" | "화면에서만 제공" | "다운로드 자료 없음";
  reason: string | null;
}

export interface VietnamPublicOverviewV128 {
  catalog: CountryCatalogItemV122[];
  featured: CountryCatalogItemV122[];
  frameworkElementCount: number;
  dataProvidedElementCount: number;
  downloadableElementCount: number;
  mapLayerCount: number;
  releaseDate: string;
}

export interface PublicSearchItemV128 {
  catalogItem: CountryCatalogItemV122;
  measureLabels: string[];
  dimensionLabels: string[];
  searchText: string;
}

export interface PublicSearchMatchV128 extends PublicSearchItemV128 {
  score: number;
}

const FEATURED_ELEMENT_IDS_V128 = [
  "A-002",
  "A-003",
  "A-010",
  "A-023",
  "A-024",
  "B-033",
  "C-016",
  "D-023",
] as const;

let overviewCacheV128: Promise<VietnamPublicOverviewV128> | null = null;
let searchCacheV128: Promise<PublicSearchItemV128[]> | null = null;

function normalizeSearchTextV128(value: string): string {
  return value
    .normalize("NFC")
    .toLocaleLowerCase("ko-KR")
    .replace(/[^0-9a-z가-힣]+/g, " ")
    .trim();
}

function publicReleaseDateV128(value: string): string {
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})/);
  return match ? `${match[1]}.${match[2]}.${match[3]}` : value;
}

export function publicDataStatusKeyV128(
  status: VietnamElementPublicStatusV124
): PublicDataStatusKeyV128 {
  switch (status) {
    case "actual":
    case "public-authorized":
      return "data-provided";
    case "partial":
      return "partially-provided";
    case "schema-only":
      return "input-template";
    case "data-entry-planned":
      return "planned";
    case "not-collected":
      return "source-not-collected";
    default:
      return "unavailable";
  }
}

export function publicDataStatusLabelV128(
  status: VietnamElementPublicStatusV124
): string {
  switch (publicDataStatusKeyV128(status)) {
    case "data-provided":
      return "데이터 제공";
    case "partially-provided":
      return "일부 데이터 제공";
    case "input-template":
      return "입력 양식";
    case "planned":
      return "입력 예정";
    case "source-not-collected":
      return "원자료 미수집";
    default:
      return "현재 제공하지 않음";
  }
}

export function publicDownloadStatusV128(
  item: CountryCatalogItemV122
): PublicDownloadStatusV128 {
  if (!item.hasPublicData) {
    const reason =
      item.publicStatus === "schema-only"
        ? "입력 양식만 제공되어 다운로드할 실제 값이 없습니다"
        : item.publicStatus === "data-entry-planned"
        ? "입력 예정 항목으로 다운로드할 실제 값이 없습니다"
        : item.publicStatus === "not-collected"
        ? "자료가 아직 수집되지 않아 다운로드 파일을 제공하지 않습니다"
        : "실제 입력값이 없어 다운로드 파일을 제공하지 않습니다";
    return {
      key: "no-download-data",
      label: "다운로드 자료 없음",
      reason,
    };
  }

  if (item.hasDownloadableData && item.downloadableRecordCount > 0) {
    return { key: "downloadable", label: "다운로드 가능", reason: null };
  }

  const sourceRestricted =
    item.raw.rights.status === "limited" ||
    item.raw.rights.redistributionAllowedValues.some((value) =>
      value.includes("제한")
    );
  return {
    key: "display-only",
    label: "화면에서만 제공",
    reason: sourceRestricted
      ? "출처의 이용조건에 따라 화면 열람만 제공합니다"
      : "재배포가 허용된 데이터만 다운로드할 수 있습니다",
  };
}

export function publicReferencePeriodV128(
  item: CountryCatalogItemV122
): string {
  if (item.elementId === "A-002") return "2005–2015년";
  const summary = getElementVisualizationSummaryV125(item.elementId);
  if (summary?.yearRange.start !== null && summary?.yearRange.start !== undefined) {
    return summary.yearRange.start === summary.yearRange.end
      ? `${summary.yearRange.start}년`
      : `${summary.yearRange.start}–${summary.yearRange.end}년`;
  }
  if (item.raw.referenceYears.length > 1) {
    const years = item.raw.referenceYears
      .map(Number)
      .filter(Number.isFinite)
      .sort((a, b) => a - b);
    if (years.length > 1) return `${years[0]}–${years[years.length - 1]}년`;
  }
  return item.latestYear ? `${item.latestYear}년` : "기준기간 없음";
}

export async function loadVietnamPublicOverviewV128(): Promise<VietnamPublicOverviewV128> {
  if (!overviewCacheV128) {
    overviewCacheV128 = Promise.all([
      loadVietnamManifestV124(),
      loadCatalogForCountrySelectionV122("VNM"),
      loadCountryMapIndexV122("VNM"),
    ])
      .then(([manifest, catalog, mapLayers]) => {
        const catalogById = new Map(
          catalog.map((item) => [item.elementId, item])
        );
        return {
          catalog,
          featured: FEATURED_ELEMENT_IDS_V128.map((elementId) =>
            catalogById.get(elementId)
          ).filter((item): item is CountryCatalogItemV122 => Boolean(item)),
          frameworkElementCount: manifest.frameworkElements,
          dataProvidedElementCount:
            manifest.publicStatusCounts.actual +
            manifest.publicStatusCounts["public-authorized"] +
            manifest.publicStatusCounts.partial,
          downloadableElementCount: manifest.downloadableElementCount,
          mapLayerCount: mapLayers.filter(
            (layer) => layer.active !== false && layer.enabled !== false
          ).length,
          releaseDate: publicReleaseDateV128(manifest.generatedAt),
        };
      })
      .catch((error) => {
        overviewCacheV128 = null;
        throw error;
      });
  }
  return overviewCacheV128;
}

export async function loadPublicSearchItemsV128(): Promise<PublicSearchItemV128[]> {
  if (!searchCacheV128) {
    searchCacheV128 = Promise.all([
      loadCatalogForCountrySelectionV122("VNM"),
      loadSearchIndexForCountrySelectionV122("VNM"),
    ])
      .then(([catalog, searchIndex]) =>
        catalog.map((item) => {
          const summary = getElementVisualizationSummaryV125(item.elementId);
          const indexed = searchIndex.get(`${item.providerId}::${item.elementId}`);
          const measureLabels = summary?.measureLabels ?? [];
          const dimensionLabels = summary?.dimensionLabels ?? [];
          return {
            catalogItem: item,
            measureLabels,
            dimensionLabels,
            searchText: normalizeSearchTextV128(
              [
                item.publicTitle,
                item.publicDescription,
                item.categoryLabel,
                item.groupLabel,
                ...measureLabels,
                ...dimensionLabels,
                ...item.sourceOrganizations,
                ...item.technologyIds.map(technologyLabelV121),
                indexed?.searchText ?? "",
                ...(indexed?.keywords ?? []),
              ].join(" ")
            ),
          };
        })
      )
      .catch((error) => {
        searchCacheV128 = null;
        throw error;
      });
  }
  return searchCacheV128;
}

export function searchPublicDataV128(
  query: string,
  items: PublicSearchItemV128[],
  limit = 12
): PublicSearchMatchV128[] {
  const normalized = normalizeSearchTextV128(query);
  if (!normalized) return [];
  const queryTokens = normalized.split(/\s+/).filter(Boolean);

  return items
    .map((item) => {
      const title = normalizeSearchTextV128(item.catalogItem.publicTitle);
      const measures = normalizeSearchTextV128(item.measureLabels.join(" "));
      const technologies = normalizeSearchTextV128(
        item.catalogItem.technologyIds.map(technologyLabelV121).join(" ")
      );
      let score = 0;
      if (title === normalized) score += 500;
      else if (title.startsWith(normalized)) score += 360;
      else if (title.includes(normalized)) score += 280;
      if (measures.includes(normalized) || technologies.includes(normalized)) {
        score += 210;
      }
      if (queryTokens.every((token) => item.searchText.includes(token))) {
        score += 100 + queryTokens.length * 10;
      }
      return { ...item, score };
    })
    .filter((item) => item.score > 0)
    .sort(
      (a, b) =>
        b.score - a.score ||
        a.catalogItem.publicTitle.localeCompare(
          b.catalogItem.publicTitle,
          "ko"
        )
    )
    .slice(0, limit);
}
