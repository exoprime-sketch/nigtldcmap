import { getVerifiedGcfProjectTechnologyMatchesV99 } from "../data/gcf/gcfProjectTechnologyMappingV99";
import { useEffect, useMemo, useState } from "react";
import { CLIMATE_TECHNOLOGY_BY_ID } from "../data/climateTechnologyCatalog";
import { FALLBACK_COUNTRIES } from "../data/countries";
import {
  createGcfPortfolioIndex,
  loadGcfCountryPortfolio,
} from "../data/gcf/gcfCountryPortfolio";
import {
  getGcfProjectsForCountryV80,
  loadGcfPriorityProjectsV80,
} from "../data/gcf/gcfPriorityProjectsV80";
import type {
  GcfPriorityProjectDatasetV80,
} from "../data/gcf/gcfPriorityProjectsV80";
import {
  INDICATOR_CONFIGS,
  formatIndicatorReferencePeriod,
  formatRawValue,
  getLatestObservationForCountry,
  loadIndicatorData,
} from "../data/indicators/registry";
import type { IndicatorId } from "../data/indicators/registry";
import { DATASETS } from "../data/publicDatasets";
import {
  datasetHasLoadablePayloadV121,
  loadDatasetPayloadV121,
} from "../data/vietnam/vietnamDataLoaderV121";
import { DATASET_TECHNOLOGY_LINKS } from "../data/technologyDataLinks";
import type { Dataset } from "../types/dataset";
import type { GcfCountryPortfolioRecord } from "../types/gcf";
import type { IndicatorDataResult } from "../types/indicator";
import type { TechnologyDataRelation } from "../types/technologyDataLink";
import {
  datasetCoversCountry,
  isDatasetPubliclyVisible,
} from "../utils/datasetAccess";

export type CooperationEvidenceRole =
  | "demand"
  | "conditions"
  | "policy"
  | "projects"
  | "organization"
  | "location"
  | "permitting"
  | "other";

export interface CooperationLinkedDataset {
  dataset: Dataset;
  relation: Exclude<TechnologyDataRelation, "cross_cutting">;
  basisKo: string;
  role: CooperationEvidenceRole;
}

export interface CooperationMetric {
  datasetId: string;
  title: string;
  value: string;
  reference: string;
  source: string;
  available: boolean;
}

export interface CooperationProjectRecord {
  id: string;
  iso3?: string;
  title?: string;
  projectStatus?: string;
  technologyIds?: string[];
  regionName?: string;
  fundingOrganization?: string;
  implementingOrganization?: string;
  amount?: number;
  currency?: string;
  startDate?: string;
  endDate?: string;
  sourceUrl?: string;
}

export interface CooperationOrganizationRecord {
  id: string;
  iso3?: string;
  name?: string;
  organizationType?: string;
  regionName?: string;
  confirmedRole?: string;
  technologyIds?: string[];
  verificationStatus?: string;
  sourceUrl?: string;
}

export interface CooperationSpatialRecord {
  id: string;
  iso3?: string;
  name?: string;
  regionName?: string;
  latitude?: number;
  longitude?: number;
  sourceUrl?: string;
  properties?: Record<string, unknown>;
}

type IndicatorResultMap = Partial<Record<IndicatorId, IndicatorDataResult>>;

const COUNTRY_CONTEXT_INDICATOR_IDS: IndicatorId[] = [
  "population-total",
  "urbanization-share",
  "gdp-per-capita",
  "gdp-growth",
];

interface LoadedSupplement {
  projects: CooperationProjectRecord[];
  technologyOrganizations: CooperationOrganizationRecord[];
  commonOrganizations: CooperationOrganizationRecord[];
  spatial: CooperationSpatialRecord[];
  warning: string | null;
}

const EMPTY_SUPPLEMENT: LoadedSupplement = {
  projects: [],
  technologyOrganizations: [],
  commonOrganizations: [],
  spatial: [],
  warning: null,
};

function uniqueDatasets(
  items: CooperationLinkedDataset[]
): CooperationLinkedDataset[] {
  const next = new Map<string, CooperationLinkedDataset>();

  items.forEach((item) => {
    const existing = next.get(item.dataset.id);
    if (
      !existing ||
      (existing.relation === "supporting" && item.relation === "direct")
    ) {
      next.set(item.dataset.id, item);
    }
  });

  return Array.from(next.values());
}

export function getCooperationEvidenceRole(
  dataset: Dataset
): CooperationEvidenceRole {
  if (dataset.previewKind === "permitting-process") return "permitting";
  if (dataset.primaryRepresentationType === "organization")
    return "organization";
  if (dataset.primaryRepresentationType === "geospatial") return "location";
  if (dataset.primaryRepresentationType === "project_finance")
    return "projects";

  if (
    dataset.category === "C" ||
    dataset.primaryRepresentationType === "verification" ||
    dataset.primaryRepresentationType === "document"
  ) {
    return "policy";
  }

  if (
    dataset.primaryRepresentationType === "text" ||
    dataset.group.includes("수요") ||
    dataset.titleKo.includes("수요")
  ) {
    return "demand";
  }

  if (
    Boolean(dataset.indicatorId) ||
    dataset.primaryRepresentationType === "numeric" ||
    dataset.primaryRepresentationType === "time_series" ||
    dataset.category === "B"
  ) {
    return "conditions";
  }

  return "other";
}

function readProjects(
  payload: Record<string, unknown> | null
): CooperationProjectRecord[] {
  if (!payload || !Array.isArray(payload.projects)) return [];
  return payload.projects.filter((item): item is CooperationProjectRecord =>
    Boolean(item && typeof item === "object" && "id" in item)
  );
}

function readOrganizations(
  payload: Record<string, unknown> | null
): CooperationOrganizationRecord[] {
  if (!payload || !Array.isArray(payload.organizations)) return [];
  return payload.organizations.filter(
    (item): item is CooperationOrganizationRecord =>
      Boolean(item && typeof item === "object" && "id" in item)
  );
}

function readSpatial(
  payload: Record<string, unknown> | null
): CooperationSpatialRecord[] {
  if (!payload || !Array.isArray(payload.features)) return [];
  return payload.features.filter((item): item is CooperationSpatialRecord =>
    Boolean(item && typeof item === "object" && "id" in item)
  );
}

function filterProjectForTechnology(
  project: CooperationProjectRecord,
  countryIso3: string,
  technologyId: string
): boolean {
  return (
    (!project.iso3 || project.iso3 === countryIso3) &&
    Array.isArray(project.technologyIds) &&
    (project.technologyIds.includes(technologyId) ||
      project.technologyIds.includes("all"))
  );
}

function filterOrganizationForCountry(
  organization: CooperationOrganizationRecord,
  countryIso3: string
): boolean {
  return !organization.iso3 || organization.iso3 === countryIso3;
}

function filterSpatialForTechnology(
  record: CooperationSpatialRecord,
  countryIso3: string,
  technologyId: string
): boolean {
  if (record.iso3 && record.iso3 !== countryIso3) return false;

  const recordTechnology =
    record.properties && typeof record.properties.technologyId === "string"
      ? record.properties.technologyId
      : null;

  return (
    !recordTechnology ||
    recordTechnology === technologyId ||
    recordTechnology === "all"
  );
}

export function useCooperationInsightEvidence(
  countryIso3: string,
  technologyId: string
) {
  const [indicatorResults, setIndicatorResults] = useState<IndicatorResultMap>(
    {}
  );
  const [gcfRecord, setGcfRecord] = useState<GcfCountryPortfolioRecord | null>(
    null
  );
  const [gcfProjectData, setGcfProjectData] =
    useState<GcfPriorityProjectDatasetV80 | null>(null);
  const [gcfProjectWarning, setGcfProjectWarning] = useState<string | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [warning, setWarning] = useState<string | null>(null);
  const [supplement, setSupplement] =
    useState<LoadedSupplement>(EMPTY_SUPPLEMENT);

  const country = useMemo(
    () => FALLBACK_COUNTRIES.find((item) => item.iso3 === countryIso3) ?? null,
    [countryIso3]
  );
  const technology = CLIMATE_TECHNOLOGY_BY_ID.get(technologyId) ?? null;

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setWarning(null);

    async function loadBaseData() {
      const [gcfResult, ...indicatorData] = await Promise.all([
        loadGcfCountryPortfolio().catch(() => null),
        ...INDICATOR_CONFIGS.map((config) => loadIndicatorData(config.id)),
      ]);

      if (cancelled) return;

      const nextResults: IndicatorResultMap = {};
      INDICATOR_CONFIGS.forEach((config, index) => {
        nextResults[config.id] = indicatorData[index];
      });

      setIndicatorResults(nextResults);
      setGcfRecord(
        gcfResult
          ? createGcfPortfolioIndex(gcfResult).get(countryIso3) ?? null
          : null
      );
      setWarning(
        [
          gcfResult
            ? null
            : "GCF 국가 포트폴리오 연결 실패 · 국가 전체 재원정보 제외",
          ...indicatorData.map((result) => result.warning),
        ]
          .filter(Boolean)
          .join(" · ") || null
      );
      setLoading(false);
    }

    void loadBaseData();
    return () => {
      cancelled = true;
    };
  }, [countryIso3]);

  useEffect(() => {
    let cancelled = false;
    setGcfProjectWarning(null);

    void loadGcfPriorityProjectsV80()
      .then((result) => {
        if (!cancelled) {
          setGcfProjectData(result);
        }
      })
      .catch((loadError: unknown) => {
        if (cancelled) return;
        setGcfProjectData(null);
        setGcfProjectWarning(
          loadError instanceof Error
            ? `GCF 프로젝트 정보를 불러오지 못했습니다 · ${loadError.message}`
            : "GCF 프로젝트 정보를 불러오지 못했습니다"
        );
      });

    return () => {
      cancelled = true;
    };
  }, [countryIso3]);

  const countryGcfProjects = useMemo(
    () => getGcfProjectsForCountryV80(gcfProjectData, countryIso3),
    [countryIso3, gcfProjectData]
  );

  const technologyMatchedGcfProjects = useMemo(
    () =>
      getVerifiedGcfProjectTechnologyMatchesV99(
        countryGcfProjects,
        countryIso3,
        technologyId
      ),
    [countryGcfProjects, countryIso3, technologyId]
  );

  const linkedDatasets = useMemo<CooperationLinkedDataset[]>(() => {
    if (!country || !technology) return [];

    const items = DATASET_TECHNOLOGY_LINKS.flatMap((link) => {
      if (
        !link.discoverable ||
        link.technologyId !== technologyId ||
        link.relation === "cross_cutting" ||
        (link.countryIso3 && link.countryIso3 !== countryIso3)
      ) {
        return [];
      }

      const dataset = DATASETS.find((item) => item.id === link.datasetId);
      if (!dataset || !isDatasetPubliclyVisible(dataset)) return [];
      if (!datasetCoversCountry(dataset, country.nameKo, country.nameEn))
        return [];

      return [
        {
          dataset,
          relation: link.relation,
          basisKo: link.basisKo,
          role: getCooperationEvidenceRole(dataset),
        } as CooperationLinkedDataset,
      ];
    });

    return uniqueDatasets(items);
  }, [country, countryIso3, technology, technologyId]);

  const commonDatasets = useMemo(() => {
    if (!country) return [];

    const ids = new Set(
      DATASET_TECHNOLOGY_LINKS.filter(
        (link) =>
          link.discoverable &&
          link.technologyId === "all" &&
          link.relation === "cross_cutting" &&
          (!link.countryIso3 || link.countryIso3 === countryIso3)
      ).map((link) => link.datasetId)
    );

    return DATASETS.filter(
      (dataset) =>
        ids.has(dataset.id) &&
        isDatasetPubliclyVisible(dataset) &&
        datasetCoversCountry(dataset, country.nameKo, country.nameEn)
    );
  }, [country, countryIso3]);

  const contextMetrics = useMemo<CooperationMetric[]>(() => {
    if (!country) return [];

    return COUNTRY_CONTEXT_INDICATOR_IDS.map((indicatorId) => {
      const config = INDICATOR_CONFIGS.find((item) => item.id === indicatorId);
      const result = indicatorResults[indicatorId];

      if (!config) {
        return {
          datasetId: indicatorId,
          title: indicatorId,
          value: "자료 없음",
          reference: "자료 없음",
          source: "World Bank",
          available: false,
        };
      }

      const latest = result
        ? getLatestObservationForCountry(result.observations, countryIso3)
        : null;

      return {
        datasetId: config.datasetId,
        title: config.definition.titleKo,
        value: formatRawValue(config, latest?.value ?? null),
        reference: latest
          ? formatIndicatorReferencePeriod(config, latest.year)
          : "자료 없음",
        source: config.definition.sourceOrganization,
        available: latest?.value !== null && latest?.value !== undefined,
      };
    });
  }, [country, countryIso3, indicatorResults]);

  const conditionMetrics = useMemo<CooperationMetric[]>(() => {
    if (!country) return [];

    const linkedIds = new Set(
      linkedDatasets
        .filter((item) => item.role === "conditions")
        .map((item) => item.dataset.id)
    );

    return INDICATOR_CONFIGS.filter((config) =>
      linkedIds.has(config.datasetId)
    ).map((config) => {
      const result = indicatorResults[config.id];
      const latest = result
        ? getLatestObservationForCountry(result.observations, countryIso3)
        : null;

      return {
        datasetId: config.datasetId,
        title: config.definition.titleKo,
        value: formatRawValue(config, latest?.value ?? null),
        reference: latest
          ? formatIndicatorReferencePeriod(config, latest.year)
          : "자료 없음",
        source: config.definition.sourceOrganization,
        available: latest?.value !== null && latest?.value !== undefined,
      };
    });
  }, [country, countryIso3, indicatorResults, linkedDatasets]);

  const projectDatasets = useMemo(
    () => linkedDatasets.filter((item) => item.role === "projects"),
    [linkedDatasets]
  );
  const organizationDatasets = useMemo(
    () => linkedDatasets.filter((item) => item.role === "organization"),
    [linkedDatasets]
  );
  const locationDatasets = useMemo(
    () => linkedDatasets.filter((item) => item.role === "location"),
    [linkedDatasets]
  );
  const commonOrganizationDatasets = useMemo(
    () =>
      commonDatasets.filter(
        (dataset) => dataset.primaryRepresentationType === "organization"
      ),
    [commonDatasets]
  );

  useEffect(() => {
    let cancelled = false;
    setSupplement(EMPTY_SUPPLEMENT);

    const projectSources = projectDatasets
      .map((item) => item.dataset)
      .filter((dataset) => datasetHasLoadablePayloadV121(dataset));
    const technologyOrganizationSources = organizationDatasets
      .map((item) => item.dataset)
      .filter((dataset) => datasetHasLoadablePayloadV121(dataset));
    const commonOrganizationSources = commonOrganizationDatasets.filter(
      (dataset) => datasetHasLoadablePayloadV121(dataset)
    );
    const locationSources = locationDatasets
      .map((item) => item.dataset)
      .filter((dataset) => datasetHasLoadablePayloadV121(dataset));

    if (
      projectSources.length === 0 &&
      technologyOrganizationSources.length === 0 &&
      commonOrganizationSources.length === 0 &&
      locationSources.length === 0
    ) {
      setSupplement(EMPTY_SUPPLEMENT);
      return () => {
        cancelled = true;
      };
    }

    async function loadSupplement() {
      try {
        const [
          projectPayloads,
          technologyOrganizationPayloads,
          commonOrganizationPayloads,
          spatialPayloads,
        ] = await Promise.all([
          Promise.all(
            projectSources.map((dataset) =>
              loadDatasetPayloadV121<Record<string, unknown>>(dataset)
            )
          ),
          Promise.all(
            technologyOrganizationSources.map((dataset) =>
              loadDatasetPayloadV121<Record<string, unknown>>(dataset)
            )
          ),
          Promise.all(
            commonOrganizationSources.map((dataset) =>
              loadDatasetPayloadV121<Record<string, unknown>>(dataset)
            )
          ),
          Promise.all(
            locationSources.map((dataset) =>
              loadDatasetPayloadV121<Record<string, unknown>>(dataset)
            )
          ),
        ]);

        if (cancelled) return;

        setSupplement({
          projects: projectPayloads
            .flatMap(readProjects)
            .filter((project) =>
              filterProjectForTechnology(project, countryIso3, technologyId)
            ),
          technologyOrganizations: technologyOrganizationPayloads
            .flatMap(readOrganizations)
            .filter((organization) =>
              filterOrganizationForCountry(organization, countryIso3)
            ),
          commonOrganizations: commonOrganizationPayloads
            .flatMap(readOrganizations)
            .filter((organization) =>
              filterOrganizationForCountry(organization, countryIso3)
            ),
          spatial: spatialPayloads
            .flatMap(readSpatial)
            .filter((record) =>
              filterSpatialForTechnology(record, countryIso3, technologyId)
            ),
          warning: null,
        });
      } catch (error: unknown) {
        if (cancelled) return;
        setSupplement({
          projects: [],
          technologyOrganizations: [],
          commonOrganizations: [],
          spatial: [],
          warning: "일부 상세자료를 불러오지 못했습니다",
        });
      }
    }

    void loadSupplement();
    return () => {
      cancelled = true;
    };
  }, [
    commonOrganizationDatasets,
    countryIso3,
    locationDatasets,
    organizationDatasets,
    projectDatasets,
    technologyId,
  ]);

  const demandDatasets = useMemo(
    () => linkedDatasets.filter((item) => item.role === "demand"),
    [linkedDatasets]
  );
  const conditionDatasets = useMemo(
    () => linkedDatasets.filter((item) => item.role === "conditions"),
    [linkedDatasets]
  );
  const policyDatasets = useMemo(
    () => linkedDatasets.filter((item) => item.role === "policy"),
    [linkedDatasets]
  );
  const permittingDatasets = useMemo(
    () => linkedDatasets.filter((item) => item.role === "permitting"),
    [linkedDatasets]
  );
  const technologyOrganizationDatasets = useMemo(
    () => linkedDatasets.filter((item) => item.role === "organization"),
    [linkedDatasets]
  );

  const projectRegions = Array.from(
    new Set(
      supplement.projects
        .map((project) => project.regionName?.trim())
        .filter((value): value is string => Boolean(value))
    )
  );

  const implementingOrganizations = Array.from(
    new Set(
      supplement.projects
        .map((project) => project.implementingOrganization?.trim())
        .filter((value): value is string => Boolean(value))
    )
  );

  const gaps = [
    demandDatasets.length === 0
      ? "직접 기술수요 근거 · 현재 플랫폼 연결자료 없음"
      : null,
    policyDatasets.length === 0
      ? "선택 기술의 정책·제도 근거 · 현재 플랫폼 연결자료 없음"
      : null,
    projectDatasets.length === 0 ||
    (supplement.projects.length === 0 &&
      technologyMatchedGcfProjects.length === 0)
      ? "기술 특정 기존 사업·재원 · 현재 플랫폼 연결자료 없음"
      : null,
    technologyOrganizationDatasets.length === 0
      ? "기술 특정 수요기관·협력기관 · 현재 플랫폼 연결자료 없음"
      : null,
    locationDatasets.length === 0 || supplement.spatial.length === 0
      ? "검증된 좌표·시설 단위 공간자료 · 현재 플랫폼 연결자료 없음"
      : null,
    permittingDatasets.length === 0
      ? "기술·사업조건별 실제 인허가 자료 · 현재 플랫폼 연결자료 없음"
      : null,
  ].filter((value): value is string => Boolean(value));

  return {
    country,
    technology,
    loading,
    warning:
      [warning, gcfProjectWarning, supplement.warning]
        .filter(Boolean)
        .join(" · ") || null,
    linkedDatasets,
    commonDatasets,
    contextMetrics,
    demandDatasets,
    conditionDatasets,
    policyDatasets,
    projectDatasets,
    permittingDatasets,
    technologyOrganizationDatasets,
    locationDatasets,
    conditionMetrics,
    projects: supplement.projects,
    technologyOrganizations: supplement.technologyOrganizations,
    commonOrganizations: supplement.commonOrganizations,
    spatial: supplement.spatial,
    projectRegions,
    implementingOrganizations,
    gcfRecord,
    countryGcfProjects,
    technologyMatchedGcfProjects,
    gaps,
  };
}
