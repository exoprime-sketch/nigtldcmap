import type { Dataset, RightsStatus } from "../types/dataset";
import type {
  VietnamDemoElement,
  VietnamFullLoadDemo,
} from "../types/vietnamDemo";
import { datasetCoversCountry } from "./datasetAccess";
import {
  datasetMatchesTechnology,
  getDatasetTechnologySearchText,
} from "./technologyData";
import {
  getAuthoritativeElementId,
  loadVietnamFullLoadDemo,
} from "./vietnamDemoV47";
import { normalizeSearch } from "./text";
import {
  getElementCoverageStatus,
} from "./dataElementCoverageV64";
import type {
  ElementCoverageStatus,
} from "./dataElementCoverageV64";

export interface VietnamExplorerItem {
  element: VietnamDemoElement;
  datasets: Dataset[];
  actual: boolean;
  coverageStatus: ElementCoverageStatus;
  sourceOrganizations: string[];
  countryIso3: string;
  countryNameKo: string;
}

export interface VietnamExplorerFilters {
  query: string;
  category: string;
  technologyId: string;
  rightsFilter: RightsStatus | "all";
  gisFilter: "all" | "yes" | "no";
  sourceOrganization: string;
}

export async function loadVietnamExplorerItems(
  publicDatasets: Dataset[],
  countryIso3: string,
  countryNameKo: string
): Promise<VietnamExplorerItem[]> {
  const demo = await loadVietnamFullLoadDemo();
  return buildCountryExplorerItems(
    demo,
    publicDatasets,
    countryIso3,
    countryNameKo
  );
}

export function buildCountryExplorerItems(
  demo: VietnamFullLoadDemo,
  publicDatasets: Dataset[],
  countryIso3: string,
  countryNameKo: string
): VietnamExplorerItem[] {
  const datasetsByElement = new Map<string, Dataset[]>();

  for (const dataset of publicDatasets) {
    const allCountryMode = countryIso3 === "all";

    if (!allCountryMode && !datasetCoversCountry(dataset, countryNameKo)) {
      continue;
    }

    const authoritativeId = getAuthoritativeElementId(dataset);
    if (authoritativeId.startsWith("SUPPORT-")) continue;

    const current = datasetsByElement.get(authoritativeId) ?? [];
    current.push(dataset);
    datasetsByElement.set(authoritativeId, current);
  }

  return demo.elements.map((element) => {
    const datasets = datasetsByElement.get(element.elementId) ?? [];
    const sourceOrganizations = Array.from(
      new Set(
        (datasets.length > 0
          ? datasets.map((dataset) => dataset.sourceOrganization)
          : [element.sourceDatabase || element.effectiveSource]
        ).filter(Boolean)
      )
    );

    const coverageStatus = getElementCoverageStatus(
      element.elementId,
      datasets
    );

    return {
      element,
      datasets,
      actual: coverageStatus !== "pending",
      coverageStatus,
      sourceOrganizations,
      countryIso3,
      countryNameKo,
    };
  });
}

export function filterVietnamExplorerItems(
  items: VietnamExplorerItem[],
  filters: VietnamExplorerFilters
): VietnamExplorerItem[] {
  const query = normalizeSearch(filters.query);

  return items.filter((item) => {
    const element = item.element;
    const actualDatasets = item.datasets;

    const searchText = normalizeSearch(
      [
        element.elementId,
        element.title,
        element.titleShort,
        element.dataGroup,
        element.section,
        element.categoryLabel,
        element.effectiveSource,
        element.sourceDatabase,
        element.presentation.userQuestion,
        element.presentation.primaryViewLabel,
        element.presentation.planningUse,
        ...element.presentation.headlineFields,
        ...actualDatasets.flatMap((dataset) => [
          dataset.titleKo,
          dataset.titleEn,
          dataset.summary,
          dataset.sourceOrganization,
          getDatasetTechnologySearchText(dataset.id),
        ]),
      ].join(" ")
    );

    const matchesQuery = !query || searchText.includes(query);
    const matchesCategory =
      filters.category === "all" || element.category === filters.category;

    // 기술 매핑은 실제로 확인된 technologyDataLinks만 사용.
    const matchesTechnology =
      filters.technologyId === "all" ||
      actualDatasets.some((dataset) =>
        datasetMatchesTechnology(
          dataset.id,
          filters.technologyId,
          item.countryIso3 === "all" ? undefined : item.countryIso3
        )
      );

    const matchesGis =
      filters.gisFilter === "all" ||
      (filters.gisFilter === "yes" ? element.gis : !element.gis);

    const matchesSource =
      filters.sourceOrganization === "all" ||
      item.sourceOrganizations.includes(filters.sourceOrganization);

    const matchesRights =
      filters.rightsFilter === "all" ||
      (filters.rightsFilter === "allowed" &&
        actualDatasets.some(
          (dataset) =>
            dataset.rightsStatus === "allowed" &&
            dataset.downloadMode !== "none" &&
            dataset.downloadMode !== "source_link"
        )) ||
      (filters.rightsFilter === "metadata_only" &&
        actualDatasets.some((dataset) => Boolean(dataset.sourceUrl)));

    return (
      matchesQuery &&
      matchesCategory &&
      matchesTechnology &&
      matchesGis &&
      matchesSource &&
      matchesRights
    );
  });
}

export function getVietnamSourceOrganizations(
  items: VietnamExplorerItem[]
): string[] {
  return Array.from(
    new Set(items.flatMap((item) => item.sourceOrganizations).filter(Boolean))
  ).sort((a, b) => a.localeCompare(b, "ko"));
}

export function getVietnamCategoryCount(
  items: VietnamExplorerItem[],
  category: string
): number {
  if (category === "all") return items.length;
  return items.filter((item) => item.element.category === category).length;
}

export function getVietnamTechnologyCount(
  items: VietnamExplorerItem[],
  technologyId: string
): number {
  if (technologyId === "all") return items.length;

  return items.filter((item) =>
    item.datasets.some((dataset) =>
      datasetMatchesTechnology(
        dataset.id,
        technologyId,
        item.countryIso3 === "all" ? undefined : item.countryIso3
      )
    )
  ).length;
}
