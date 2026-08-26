import {
  CLIMATE_TECHNOLOGIES,
  CLIMATE_TECHNOLOGY_BY_ID,
} from "../data/climateTechnologyCatalog";
import { DATASET_TECHNOLOGY_LINKS } from "../data/technologyDataLinks";
import type { Dataset } from "../types/dataset";
import type {
  DatasetTechnologyLink,
  TechnologyDataRelation,
} from "../types/technologyDataLink";

export const TECHNOLOGY_RELATION_LABELS: Record<
  TechnologyDataRelation,
  string
> = {
  direct: "직접 관련",
  supporting: "사업 검토 관련",
  cross_cutting: "공통 기반",
};

export function isValidClimateTechnologyId(value: string | null): boolean {
  return Boolean(value && CLIMATE_TECHNOLOGY_BY_ID.has(value));
}

export function getDatasetTechnologyLinks(
  datasetId: string
): DatasetTechnologyLink[] {
  return DATASET_TECHNOLOGY_LINKS.filter(
    (link) => link.datasetId === datasetId
  );
}

export function getDatasetSpecificTechnologyLinks(
  datasetId: string,
  countryIso3?: string
): DatasetTechnologyLink[] {
  return getDatasetTechnologyLinks(datasetId).filter(
    (link) =>
      link.technologyId !== "all" &&
      link.relation !== "cross_cutting" &&
      link.discoverable &&
      (!countryIso3 || !link.countryIso3 || link.countryIso3 === countryIso3)
  );
}

export function datasetMatchesTechnology(
  datasetId: string,
  technologyId: string,
  countryIso3?: string
): boolean {
  return getDatasetTechnologyLinks(datasetId).some(
    (link) =>
      link.discoverable &&
      link.technologyId === technologyId &&
      link.relation !== "cross_cutting" &&
      (!countryIso3 || !link.countryIso3 || link.countryIso3 === countryIso3)
  );
}

export function getDatasetTechnologySearchText(datasetId: string): string {
  const names = getDatasetSpecificTechnologyLinks(datasetId)
    .map((link) =>
      link.technologyId === "all"
        ? null
        : CLIMATE_TECHNOLOGY_BY_ID.get(link.technologyId)?.nameKo ?? null
    )
    .filter((value): value is string => Boolean(value));

  return Array.from(new Set(names)).join(" ");
}

export function getTechnologyDatasetCount(
  datasets: Dataset[],
  technologyId: string,
  countryIso3?: string
): number {
  return datasets.filter((dataset) =>
    datasetMatchesTechnology(dataset.id, technologyId, countryIso3)
  ).length;
}

export function getTechnologyName(technologyId: string): string {
  return CLIMATE_TECHNOLOGY_BY_ID.get(technologyId)?.nameKo ?? technologyId;
}

export function getTechnologyFilterGroups() {
  const categories: Array<"감축" | "적응" | "융복합"> = [
    "감축",
    "적응",
    "융복합",
  ];

  return categories.map((category) => ({
    category,
    technologies: CLIMATE_TECHNOLOGIES.filter(
      (technology) => technology.category === category
    ),
  }));
}
