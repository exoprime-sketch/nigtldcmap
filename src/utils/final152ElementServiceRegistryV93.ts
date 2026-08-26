import { MAP_DATA_CATALOG } from "../data/mapLayerCatalog";
import { DATASETS } from "../data/publicDatasets";
import { DATASET_TECHNOLOGY_LINKS } from "../data/technologyDataLinks";
import type { Dataset } from "../types/dataset";
import {
  isDatasetDownloadable,
  isDatasetPubliclyVisible,
  isDatasetSourceLinkAvailable,
} from "./datasetAccess";
import { getElementCoverageStatus } from "./dataElementCoverageV64";
import { getAuthoritativeElementIdV88 } from "./elementDatasetRegistryV88";
import { AUTHORITATIVE_ELEMENT_SEARCH_V75 } from "./authoritativeElementSearchV75";

export type Final152ServiceModeV93 =
  | "actual_full"
  | "actual_partial"
  | "example_fallback";

export interface Final152ElementServiceRowV93 {
  elementId: string;
  title: string;
  category: string;
  categoryLabel: string;
  sourcePlanned: string;
  serviceMode: Final152ServiceModeV93;
  coverageStatus: "full" | "partial" | "pending";
  actualDatasetIds: string[];
  actualDatasetCount: number;
  sourceOrganizations: string[];
  mapReady: boolean;
  compareReady: boolean;
  insightReady: boolean;
  downloadReady: boolean;
  sourceLinkReady: boolean;
  technologyLinkCount: number;
  exampleFallbackAvailable: boolean;
  notes: string[];
}

function getPublicDatasetsForElement(elementId: string): Dataset[] {
  return DATASETS.filter(isDatasetPubliclyVisible).filter(
    (dataset) => getAuthoritativeElementIdV88(dataset) === elementId
  );
}

function datasetCanCompare(dataset: Dataset): boolean {
  if (dataset.capabilities?.countryCompare === true) return true;
  if (dataset.compareConfig) return true;
  if (dataset.indicatorId) return true;
  return (
    dataset.previewKind === "gcf-portfolio" ||
    dataset.previewKind === "policy-document" ||
    dataset.id === "LDC-DS-C-001" ||
    dataset.id === "LDC-PILOT-D-020-GCF-PROJECTS"
  );
}

function serviceModeFromCoverage(
  coverageStatus: "full" | "partial" | "pending"
): Final152ServiceModeV93 {
  if (coverageStatus === "full") return "actual_full";
  if (coverageStatus === "partial") return "actual_partial";
  return "example_fallback";
}

export function buildFinal152ElementServiceRegistryV93(): Final152ElementServiceRowV93[] {
  const mapDatasetIds = new Set(
    MAP_DATA_CATALOG.map((item) => item.datasetId).filter((id): id is string =>
      Boolean(id)
    )
  );

  const compareDatasetIds = new Set(
    MAP_DATA_CATALOG.filter((item) => Boolean(item.compareTarget))
      .map((item) => item.datasetId)
      .filter((id): id is string => Boolean(id))
  );

  const technologyLinksByDataset = new Map<string, number>();
  DATASET_TECHNOLOGY_LINKS.forEach((link) => {
    technologyLinksByDataset.set(
      link.datasetId,
      (technologyLinksByDataset.get(link.datasetId) ?? 0) + 1
    );
  });

  return AUTHORITATIVE_ELEMENT_SEARCH_V75.map((element) => {
    const datasets = getPublicDatasetsForElement(element.elementId);
    const coverageStatus = getElementCoverageStatus(
      element.elementId,
      datasets
    );
    const datasetIds = datasets.map((dataset) => dataset.id);
    const sourceOrganizations = Array.from(
      new Set(
        datasets.map((dataset) => dataset.sourceOrganization).filter(Boolean)
      )
    );
    const technologyLinkCount = datasets.reduce(
      (sum, dataset) => sum + (technologyLinksByDataset.get(dataset.id) ?? 0),
      0
    );

    const mapReady = datasets.some((dataset) => mapDatasetIds.has(dataset.id));
    const compareReady = datasets.some(
      (dataset) =>
        compareDatasetIds.has(dataset.id) || datasetCanCompare(dataset)
    );
    const insightReady =
      datasets.some(
        (dataset) => dataset.capabilities?.cooperationInsights === true
      ) || technologyLinkCount > 0;
    const downloadReady = datasets.some(isDatasetDownloadable);
    const sourceLinkReady = datasets.some(
      (dataset) =>
        isDatasetSourceLinkAvailable(dataset) || Boolean(dataset.sourceUrl)
    );

    const notes: string[] = [];
    if (coverageStatus === "pending") {
      notes.push(
        "실제 공개 Dataset 직접 연결 전 · 이용자 상세화면에서는 화면 예시를 제공"
      );
      notes.push(
        "예시 화면은 지도·국가 비교·협력 인사이트의 실제 판단 근거로 사용하지 않음"
      );
    }
    if (coverageStatus === "partial") {
      notes.push(
        "일부 실제 자료 제공 · 미연결 세부항목은 상세화면에서 제공상태를 구분"
      );
    }

    return {
      elementId: element.elementId,
      title: element.displayTitle,
      category: element.category,
      categoryLabel: element.categoryLabel,
      sourcePlanned: element.source,
      serviceMode: serviceModeFromCoverage(coverageStatus),
      coverageStatus,
      actualDatasetIds: datasetIds,
      actualDatasetCount: datasets.length,
      sourceOrganizations,
      mapReady,
      compareReady,
      insightReady,
      downloadReady,
      sourceLinkReady,
      technologyLinkCount,
      exampleFallbackAvailable: true,
      notes,
    };
  });
}

export function getFinal152ElementServiceRowV93(
  elementId: string
): Final152ElementServiceRowV93 | undefined {
  return buildFinal152ElementServiceRegistryV93().find(
    (row) => row.elementId === elementId
  );
}
