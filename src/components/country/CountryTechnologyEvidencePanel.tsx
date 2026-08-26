import { useEffect, useMemo, useState } from "react";
import { CLIMATE_TECHNOLOGY_BY_ID } from "../../data/climateTechnologyCatalog";
import { DATASET_TECHNOLOGY_LINKS } from "../../data/technologyDataLinks";
import { DATASETS } from "../../data/publicDatasets";
import {
  datasetHasLoadablePayloadV121,
  loadDatasetPayloadV121,
} from "../../data/vietnam/vietnamDataLoaderV121";
import type { Dataset } from "../../types/dataset";
import type { TechnologyDataRelation } from "../../types/technologyDataLink";
import {
  datasetCoversCountry,
  isDatasetPubliclyVisible,
} from "../../utils/datasetAccess";
import { TECHNOLOGY_RELATION_LABELS } from "../../utils/technologyData";

interface TechnologyMetric {
  datasetId: string;
  title: string;
  value: string;
  reference: string;
  source: string;
  available: boolean;
}

interface CountryTechnologyEvidencePanelProps {
  countryIso3: string;
  countryNameKo: string;
  countryNameEn: string;
  technologyId: string;
  indicatorMetrics: Record<string, TechnologyMetric>;
  onOpenDataset: (datasetId: string) => void;
  onExploreDatasets: (countryIso3: string, technologyId: string) => void;
}

type EvidenceRole =
  | "demand"
  | "conditions"
  | "policy"
  | "projects"
  | "organization"
  | "location"
  | "permitting"
  | "other";

interface LinkedDataset {
  dataset: Dataset;
  relation: Exclude<TechnologyDataRelation, "cross_cutting">;
  basisKo: string;
  role: EvidenceRole;
}

interface ProjectRecord {
  id: string;
  iso3?: string;
  title?: string;
  projectStatus?: string;
  technologyIds?: string[];
  regionName?: string;
  amount?: number;
  currency?: string;
  sourceUrl?: string;
}

interface OrganizationRecord {
  id: string;
  iso3?: string;
  name?: string;
  organizationType?: string;
  confirmedRole?: string;
  technologyIds?: string[];
  sourceUrl?: string;
}

interface LoadedSupplement {
  projects: ProjectRecord[];
  organizations: OrganizationRecord[];
  warning: string | null;
}

const EMPTY_SUPPLEMENT: LoadedSupplement = {
  projects: [],
  organizations: [],
  warning: null,
};

function uniqueByDataset(items: LinkedDataset[]): LinkedDataset[] {
  const byDataset = new Map<string, LinkedDataset>();

  items.forEach((item) => {
    const existing = byDataset.get(item.dataset.id);
    if (
      !existing ||
      (existing.relation === "supporting" && item.relation === "direct")
    ) {
      byDataset.set(item.dataset.id, item);
    }
  });

  return Array.from(byDataset.values());
}

function getEvidenceRole(dataset: Dataset): EvidenceRole {
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

function formatMoney(amount?: number, currency?: string): string {
  if (amount === undefined || Number.isNaN(amount)) return "재원 확인 필요";
  const unit = currency || "USD";
  return `${new Intl.NumberFormat("ko-KR", {
    notation: amount >= 1_000_000 ? "compact" : "standard",
    maximumFractionDigits: 1,
  }).format(amount)} ${unit}`;
}

function readProjectRecords(
  payload: Record<string, unknown> | null
): ProjectRecord[] {
  if (!payload || !Array.isArray(payload.projects)) return [];
  return payload.projects.filter((item): item is ProjectRecord => {
    return Boolean(item && typeof item === "object" && "id" in item);
  });
}

function readOrganizationRecords(
  payload: Record<string, unknown> | null
): OrganizationRecord[] {
  if (!payload || !Array.isArray(payload.organizations)) return [];
  return payload.organizations.filter((item): item is OrganizationRecord => {
    return Boolean(item && typeof item === "object" && "id" in item);
  });
}

export default function CountryTechnologyEvidencePanel({
  countryIso3,
  countryNameKo,
  countryNameEn,
  technologyId,
  indicatorMetrics,
  onOpenDataset,
  onExploreDatasets,
}: CountryTechnologyEvidencePanelProps) {
  const [supplement, setSupplement] =
    useState<LoadedSupplement>(EMPTY_SUPPLEMENT);

  const technology = CLIMATE_TECHNOLOGY_BY_ID.get(technologyId);

  const linkedDatasets = useMemo<LinkedDataset[]>(() => {
    if (!technology) return [];

    const next = DATASET_TECHNOLOGY_LINKS.flatMap((link) => {
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
      if (!datasetCoversCountry(dataset, countryNameKo, countryNameEn))
        return [];

      return [
        {
          dataset,
          relation: link.relation,
          basisKo: link.basisKo,
          role: getEvidenceRole(dataset),
        } as LinkedDataset,
      ];
    });

    return uniqueByDataset(next);
  }, [countryIso3, countryNameEn, countryNameKo, technology, technologyId]);

  const commonDatasets = useMemo(() => {
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
        datasetCoversCountry(dataset, countryNameKo, countryNameEn)
    );
  }, [countryIso3, countryNameEn, countryNameKo]);

  useEffect(() => {
    let cancelled = false;

    const projectDatasets = linkedDatasets.filter(
      (item) =>
        item.dataset.primaryRepresentationType === "project_finance" &&
        datasetHasLoadablePayloadV121(item.dataset)
    );
    const organizationDatasets = commonDatasets.filter(
      (dataset) =>
        dataset.primaryRepresentationType === "organization" &&
        datasetHasLoadablePayloadV121(dataset)
    );

    if (projectDatasets.length === 0 && organizationDatasets.length === 0) {
      setSupplement(EMPTY_SUPPLEMENT);
      return () => {
        cancelled = true;
      };
    }

    async function loadSupplement() {
      try {
        const [projectPayloads, organizationPayloads] = await Promise.all([
          Promise.all(
            projectDatasets.map((item) =>
              loadDatasetPayloadV121<Record<string, unknown>>(item.dataset)
            )
          ),
          Promise.all(
            organizationDatasets.map((dataset) =>
              loadDatasetPayloadV121<Record<string, unknown>>(dataset)
            )
          ),
        ]);

        if (cancelled) return;

        const projects = projectPayloads
          .flatMap(readProjectRecords)
          .filter(
            (project) =>
              (!project.iso3 || project.iso3 === countryIso3) &&
              Array.isArray(project.technologyIds) &&
              (project.technologyIds.includes(technologyId) ||
                project.technologyIds.includes("all"))
          );

        const organizations = organizationPayloads
          .flatMap(readOrganizationRecords)
          .filter(
            (organization) =>
              !organization.iso3 || organization.iso3 === countryIso3
          );

        setSupplement({ projects, organizations, warning: null });
      } catch (error: unknown) {
        if (cancelled) return;
        setSupplement({
          projects: [],
          organizations: [],
          warning: "일부 기관·사업 자료를 불러오지 못했습니다",
        });
      }
    }

    void loadSupplement();

    return () => {
      cancelled = true;
    };
  }, [commonDatasets, countryIso3, linkedDatasets, technologyId]);

  if (!technology) return null;

  const directDatasets = linkedDatasets.filter(
    (item) => item.relation === "direct"
  );
  const supportingDatasets = linkedDatasets.filter(
    (item) => item.relation === "supporting"
  );
  const conditionDatasets = linkedDatasets.filter(
    (item) => item.role === "conditions"
  );
  const policyDatasets = linkedDatasets.filter(
    (item) => item.role === "policy"
  );
  const projectDatasets = linkedDatasets.filter(
    (item) => item.role === "projects"
  );
  const demandDatasets = linkedDatasets.filter(
    (item) => item.role === "demand"
  );
  const locationDatasets = linkedDatasets.filter(
    (item) => item.role === "location"
  );
  const permittingDatasets = linkedDatasets.filter(
    (item) => item.role === "permitting"
  );
  const technologySpecificOrganizations = linkedDatasets.filter(
    (item) => item.role === "organization"
  );

  const conditionMetrics = conditionDatasets
    .map((item) => indicatorMetrics[item.dataset.id])
    .filter((metric): metric is TechnologyMetric => Boolean(metric));

  const projectRegions = Array.from(
    new Set(
      supplement.projects
        .map((project) => project.regionName?.trim())
        .filter((value): value is string => Boolean(value))
    )
  );

  const gaps = [
    demandDatasets.length === 0 ? "기술수요 자료" : null,
    projectDatasets.length === 0 ? "기존 사업·재원 자료" : null,
    technologySpecificOrganizations.length === 0
      ? "실행기관·수요기관 자료"
      : null,
    locationDatasets.length === 0 ? "시설·위치 자료" : null,
    permittingDatasets.length === 0 ? "사업조건별 인허가 자료" : null,
  ].filter((value): value is string => Boolean(value));

  return (
    <section
      className="country-v34-tech-evidence"
      aria-labelledby="country-tech-evidence-title"
    >
      <header className="country-v34-tech-heading">
        <div>
          <span>선택 기술 기준</span>
          <h2 id="country-tech-evidence-title">
            {countryNameKo} × {technology.nameKo}
          </h2>
          <p>
            현재 플랫폼에 수록된 공개자료를 바탕으로 기술수요, 정책, 기존 사업,
            기관과 입지 정보를 함께 확인할 수 있습니다
          </p>
        </div>
        <button
          type="button"
          className="secondary-button"
          onClick={() => onExploreDatasets(countryIso3, technologyId)}
        >
          관련 데이터 전체 보기
        </button>
      </header>

      <div
        className="country-v34-tech-summary"
        aria-label="선택 기술 연결자료 요약"
      >
        <article>
          <span>직접 관련 자료</span>
          <strong>{directDatasets.length}건</strong>
        </article>
        <article>
          <span>사업 검토 관련</span>
          <strong>{supportingDatasets.length}건</strong>
        </article>
        <article>
          <span>국가 공통 참고자료</span>
          <strong>{commonDatasets.length}건</strong>
        </article>
      </div>

      {linkedDatasets.length === 0 ? (
        <div className="country-v34-empty-block">
          <strong>현재 선택한 기술과 연결된 자료가 없습니다</strong>
          <span>
            관련 데이터가 추가되면 이 화면에서 함께 확인할 수 있습니다
          </span>
        </div>
      ) : (
        <div className="country-v34-evidence-grid">
          <article className="country-v34-evidence-card">
            <header>
              <span>기술·적용여건</span>
              <strong>{conditionDatasets.length}건</strong>
            </header>
            {conditionMetrics.length > 0 ? (
              <div className="country-v34-metric-list">
                {conditionMetrics.slice(0, 4).map((metric) => (
                  <div key={metric.datasetId}>
                    <span>{metric.title}</span>
                    <strong>{metric.value}</strong>
                    <small>
                      {metric.available
                        ? `${metric.reference} · ${metric.source}`
                        : "자료 없음"}
                    </small>
                  </div>
                ))}
              </div>
            ) : (
              <p>현재 제공 가능한 국가 단위 적용여건 자료가 없습니다</p>
            )}
          </article>

          <article className="country-v34-evidence-card">
            <header>
              <span>정책·제도</span>
              <strong>{policyDatasets.length}건</strong>
            </header>
            {policyDatasets.length > 0 ? (
              <div className="country-v34-link-list">
                {policyDatasets.slice(0, 3).map((item) => (
                  <button
                    type="button"
                    key={item.dataset.id}
                    onClick={() => onOpenDataset(item.dataset.id)}
                  >
                    <b>{item.dataset.titleKo}</b>
                    <span>{item.basisKo}</span>
                    <small>
                      {TECHNOLOGY_RELATION_LABELS[item.relation]} · 근거 보기 →
                    </small>
                  </button>
                ))}
              </div>
            ) : (
              <p>현재 선택 기술과 연결된 정책·제도 자료가 없습니다</p>
            )}
          </article>

          <article className="country-v34-evidence-card">
            <header>
              <span>기존 사업·재원</span>
              <strong>
                {supplement.projects.length > 0
                  ? `${supplement.projects.length}건`
                  : `${projectDatasets.length}개 자료`}
              </strong>
            </header>
            {supplement.projects.length > 0 ? (
              <div className="country-v34-project-list">
                {supplement.projects.slice(0, 3).map((project) => (
                  <div key={project.id}>
                    <div>
                      <b>{project.id}</b>
                      <span>{project.projectStatus || "상태 미제공"}</span>
                    </div>
                    <strong>{project.title || "사업명 미제공"}</strong>
                    <small>
                      {project.regionName || "지역정보 없음"} ·{" "}
                      {formatMoney(project.amount, project.currency)}
                    </small>
                  </div>
                ))}
              </div>
            ) : projectDatasets.length > 0 ? (
              <div className="country-v34-link-list">
                {projectDatasets.slice(0, 2).map((item) => (
                  <button
                    type="button"
                    key={item.dataset.id}
                    onClick={() => onOpenDataset(item.dataset.id)}
                  >
                    <b>{item.dataset.titleKo}</b>
                    <span>{item.basisKo}</span>
                    <small>사업 상세 확인 →</small>
                  </button>
                ))}
              </div>
            ) : (
              <p>현재 선택 기술과 연결된 기존 사업·재원 자료가 없습니다</p>
            )}
          </article>

          <article className="country-v34-evidence-card">
            <header>
              <span>실행기관·지역정보</span>
              <strong>{supplement.organizations.length}개 기관</strong>
            </header>
            {supplement.organizations.length > 0 ? (
              <div className="country-v34-organization-list">
                {supplement.organizations.slice(0, 3).map((organization) => (
                  <div key={organization.id}>
                    <strong>{organization.name || "기관명 미제공"}</strong>
                    <span>
                      {organization.organizationType || "기관유형 미제공"}
                    </span>
                    <small>
                      {organization.confirmedRole || "역할 정보 미제공"}
                    </small>
                  </div>
                ))}
              </div>
            ) : (
              <p>현재 제공 가능한 관련 기관자료가 없습니다</p>
            )}

            {projectRegions.length > 0 && (
              <div className="country-v34-region-summary">
                <span>관련 사업에서 확인된 지역명</span>
                <div>
                  {projectRegions.slice(0, 4).map((region) => (
                    <b key={region}>{region}</b>
                  ))}
                </div>
                <small>
                  사업 문서에 명시된 지역명이며, 좌표 기반 위치정보와 구분하여
                  제공합니다
                </small>
              </div>
            )}
          </article>
        </div>
      )}

      {supplement.warning && (
        <div className="country-v34-inline-warning">{supplement.warning}</div>
      )}

      <div className="country-v34-gap-panel">
        <div>
          <span>추가 확인 자료</span>
          <strong>현재 플랫폼에 추가로 필요한 자료</strong>
        </div>
        {gaps.length > 0 ? (
          <ul>
            {gaps.map((gap) => (
              <li key={gap}>{gap}</li>
            ))}
          </ul>
        ) : (
          <p>
            주요 검토영역의 자료가 모두 연결되어 있습니다 · 사업 착수 전에는
            최신 공식자료를 다시 확인해 주세요
          </p>
        )}
        <small>
          위 항목은 현재 플랫폼에 수록된 자료 기준이며, 해당 국가에 관련 정보나
          제도가 없다는 의미는 아닙니다
        </small>
      </div>

      <div className="country-v34-source-list">
        <div className="country-v34-source-heading">
          <div>
            <span>관련 데이터</span>
            <strong>
              {technology.nameKo} 연결자료 {linkedDatasets.length}건
            </strong>
          </div>
        </div>
        {linkedDatasets.length > 0 && (
          <div className="country-v34-source-grid">
            {linkedDatasets.map((item) => (
              <button
                type="button"
                key={item.dataset.id}
                onClick={() => onOpenDataset(item.dataset.id)}
              >
                <span className={`relation-${item.relation}`}>
                  {TECHNOLOGY_RELATION_LABELS[item.relation]}
                </span>
                <strong>{item.dataset.titleKo}</strong>
                <small>{item.basisKo}</small>
                <b>{item.dataset.sourceOrganization} · 상세 보기 →</b>
              </button>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
