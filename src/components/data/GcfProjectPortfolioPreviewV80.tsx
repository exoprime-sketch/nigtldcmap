import { useEffect, useMemo, useState } from "react";
import {
  getGcfProjectStatusLabelV80,
  getGcfProjectsForCountryV80,
  loadGcfPriorityProjectsV80,
} from "../../data/gcf/gcfPriorityProjectsV80";
import type {
  GcfPriorityProjectDatasetV80,
  GcfProjectStatusV80,
} from "../../data/gcf/gcfPriorityProjectsV80";
import { openExternalUrl } from "../../utils/browser";
import "../../styles/gcf-projects-v80.css";

interface Props {
  countryIso3: string;
  countryName: string;
}

const STATUS_ORDER: GcfProjectStatusV80[] = [
  "Approved",
  "Under implementation",
  "Completed",
  "Lapsed",
];

function useGcfCountryProjectsV80(countryIso3: string) {
  const [data, setData] = useState<GcfPriorityProjectDatasetV80 | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    loadGcfPriorityProjectsV80()
      .then((result) => {
        if (cancelled) return;
        setData(result);
        setLoading(false);
      })
      .catch((loadError: unknown) => {
        if (cancelled) return;
        setLoading(false);
        setError(
          loadError instanceof Error
            ? loadError.message
            : "GCF 프로젝트 자료를 불러오지 못했습니다"
        );
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const projects = useMemo(
    () => getGcfProjectsForCountryV80(data, countryIso3),
    [countryIso3, data]
  );

  return {
    data,
    projects,
    summary: data?.countrySummaries[countryIso3] ?? null,
    loading,
    error,
  };
}

export function GcfProjectPortfolioOverviewV80({
  countryIso3,
  countryName,
}: Props) {
  const { data, projects, summary, loading, error } =
    useGcfCountryProjectsV80(countryIso3);

  if (loading) {
    return <div className="v80-gcf-state">GCF 프로젝트 불러오는 중</div>;
  }

  if (error) {
    return <div className="v80-gcf-state error">{error}</div>;
  }

  if (!data || !summary) {
    return (
      <div className="v80-gcf-state">선택 국가의 GCF 프로젝트 자료 준비 중</div>
    );
  }

  const statusCounts = STATUS_ORDER.map((status) => ({
    status,
    count: projects.filter((project) => project.status === status).length,
  }));

  const entityCounts = Array.from(
    projects.reduce((map, project) => {
      map.set(project.entity, (map.get(project.entity) ?? 0) + 1);
      return map;
    }, new Map<string, number>())
  )
    .map(([entity, count]) => ({
      entity,
      count,
    }))
    .sort((a, b) => b.count - a.count || a.entity.localeCompare(b.entity))
    .slice(0, 6);

  const multiCountryCount = projects.filter(
    (project) => project.multiCountry
  ).length;

  return (
    <section className="v80-gcf-project-view">
      <div className="v80-gcf-kpis">
        <Kpi
          label="현재 GCF 사업"
          value={`${summary.officialCurrentProjectCount}건`}
          note="GCF 국가 페이지 기준"
          primary
        />
        <Kpi
          label="이행 중"
          value={`${summary.statusCounts["Under implementation"] ?? 0}건`}
          note="공개 사업 기준"
        />
        <Kpi
          label="신규 승인"
          value={`${summary.statusCounts.Approved ?? 0}건`}
          note="Approved 상태"
        />
        <Kpi
          label="다국가 사업"
          value={`${multiCountryCount}건`}
          note="다국가 사업 포함"
        />
      </div>

      <div className="v80-gcf-grid">
        <section className="v80-gcf-panel">
          <header>
            <h4>사업 상태 구성</h4>
            <p>
              {countryName} · 기준일 {data.metadata.referenceDate}
            </p>
          </header>

          <div className="v80-status-list">
            {statusCounts.map(({ status, count }) => (
              <article key={status}>
                <span>{getGcfProjectStatusLabelV80(status)}</span>
                <i>
                  <b
                    style={{
                      width: `${
                        projects.length > 0
                          ? (count / projects.length) * 100
                          : 0
                      }%`,
                    }}
                  />
                </i>
                <strong>{count}건</strong>
              </article>
            ))}
          </div>
        </section>

        <section className="v80-gcf-panel">
          <header>
            <h4>주요 인증기구(AE)</h4>
            <p>현재 표시된 사업 기준</p>
          </header>

          <div className="v80-entity-list">
            {entityCounts.map((item, index) => (
              <article key={item.entity}>
                <span>{index + 1}</span>
                <b>{item.entity}</b>
                <strong>{item.count}건</strong>
              </article>
            ))}
          </div>
        </section>
      </div>

      <div className="v80-gcf-note">
        <strong>이 자료를 사용할 때</strong>
        <span>
          다국가 사업의 전체 재원은 특정 국가의 배분액으로 해석하지 않습니다.
          공식 위치정보가 있는 사업만 지도에서 표시합니다.
        </span>
      </div>
    </section>
  );
}

export function GcfProjectPortfolioListV80({
  countryIso3,
  countryName,
}: Props) {
  const { data, projects, summary, loading, error } =
    useGcfCountryProjectsV80(countryIso3);

  const [status, setStatus] = useState<"all" | GcfProjectStatusV80>("all");
  const [entity, setEntity] = useState("all");
  const [query, setQuery] = useState("");

  const entities = useMemo(
    () =>
      Array.from(new Set(projects.map((project) => project.entity))).sort(
        (a, b) => a.localeCompare(b)
      ),
    [projects]
  );

  const filtered = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase("ko-KR");

    return projects.filter((project) => {
      if (status !== "all" && project.status !== status) {
        return false;
      }

      if (entity !== "all" && project.entity !== entity) {
        return false;
      }

      if (!normalized) return true;

      return [project.projectId, project.title, project.entity]
        .join(" ")
        .toLocaleLowerCase("ko-KR")
        .includes(normalized);
    });
  }, [entity, projects, query, status]);

  if (loading) {
    return <div className="v80-gcf-state">GCF 프로젝트 목록 불러오는 중</div>;
  }

  if (error) {
    return <div className="v80-gcf-state error">{error}</div>;
  }

  if (!data || !summary) {
    return (
      <div className="v80-gcf-state">선택 국가의 프로젝트 목록 준비 중</div>
    );
  }

  return (
    <section className="v80-gcf-project-list">
      <header className="v80-list-heading">
        <div>
          <span>GCF 공개 프로젝트</span>
          <h4>{countryName} GCF 프로젝트</h4>
          <p>
            현재 포트폴리오 {summary.officialCurrentProjectCount}건 · 표시 사업{" "}
            {summary.relationRecordCount}건
          </p>
        </div>
        <button
          type="button"
          onClick={() => openExternalUrl(summary.sourceUrl)}
        >
          GCF 공식 목록 ↗
        </button>
      </header>

      <div className="v80-project-filters">
        <label>
          <span>상태</span>
          <select
            value={status}
            onChange={(event) =>
              setStatus(event.target.value as "all" | GcfProjectStatusV80)
            }
          >
            <option value="all">전체 상태</option>
            {STATUS_ORDER.map((item) => (
              <option key={item} value={item}>
                {getGcfProjectStatusLabelV80(item)}
              </option>
            ))}
          </select>
        </label>

        <label>
          <span>인증기구(AE)</span>
          <select
            value={entity}
            onChange={(event) => setEntity(event.target.value)}
          >
            <option value="all">전체 기관</option>
            {entities.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </label>

        <label className="wide">
          <span>프로젝트 검색</span>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="FP/SAP 번호 · 사업명 · 기관"
          />
        </label>
      </div>

      <div className="v80-project-count">
        <strong>{filtered.length}건</strong>
        <span>현재 필터 기준</span>
      </div>

      <div className="v80-project-records">
        {filtered.map((project) => (
          <article key={`${project.countryIso3}:${project.projectId}`}>
            <div className="v80-project-top">
              <span>{project.projectId}</span>
              <b
                className={`status-${project.status
                  .toLowerCase()
                  .replace(/\s+/g, "-")}`}
              >
                {getGcfProjectStatusLabelV80(project.status)}
              </b>
            </div>

            <h5>{project.title}</h5>

            <dl>
              <div>
                <dt>Accredited Entity</dt>
                <dd>{project.entity}</dd>
              </div>
              <div>
                <dt>범위</dt>
                <dd>{project.multiCountry ? "다국가 사업" : countryName}</dd>
              </div>
            </dl>

            <button
              type="button"
              onClick={() => openExternalUrl(project.projectUrl)}
            >
              GCF 사업 보기 ↗
            </button>
          </article>
        ))}
      </div>
    </section>
  );
}

function Kpi({
  label,
  value,
  note,
  primary = false,
}: {
  label: string;
  value: string;
  note: string;
  primary?: boolean;
}) {
  return (
    <article className={primary ? "primary" : ""}>
      <span>{label}</span>
      <strong>{value}</strong>
      <small>{note}</small>
    </article>
  );
}
