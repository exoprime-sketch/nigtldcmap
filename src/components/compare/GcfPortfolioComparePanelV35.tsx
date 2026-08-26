import { useEffect, useMemo, useState } from "react";
import {
  GCF_METRIC_DEFINITIONS,
  GCF_METRIC_DEFINITION_BY_ID,
  formatGcfMetricValue,
  getGcfMetricValue,
  loadGcfCountryPortfolio,
} from "../../data/gcf/gcfCountryPortfolio";
import type { Country } from "../../types/country";
import type {
  GcfCountryPortfolio,
  GcfCountryPortfolioRecord,
  GcfMetricId,
} from "../../types/gcf";
import { downloadBlob } from "../../utils/browser";
import {
  loadGcfPriorityProjectsV80,
} from "../../data/gcf/gcfPriorityProjectsV80";
import type {
  GcfPriorityProjectDatasetV80,
} from "../../data/gcf/gcfPriorityProjectsV80";
import "../../styles/gcf-compare-v80.css";

type CountryCharacteristic = "all" | "ldc" | "sids";
type SortMode = "value-desc" | "value-asc" | "name";
type GcfCompareViewV80 = "aggregate" | "projects";

interface Props {
  countries: Country[];
  initialMetricId?: GcfMetricId;
  onMetricChange?: (metricId: GcfMetricId) => void;
  onOpenCountry?: (iso3: string) => void;
}

const PAGE_SIZE = 30;

export default function GcfPortfolioComparePanelV35({
  countries,
  initialMetricId = "gcfFundedActivityCount",
  onMetricChange,
  onOpenCountry,
}: Props) {
  const [portfolio, setPortfolio] = useState<GcfCountryPortfolio | null>(null);
  const [metricId, setMetricId] = useState<GcfMetricId>(initialMetricId);

  useEffect(() => {
    setMetricId(initialMetricId);
  }, [initialMetricId]);
  const [region, setRegion] = useState("all");
  const [characteristic, setCharacteristic] =
    useState<CountryCharacteristic>("all");
  const [query, setQuery] = useState("");
  const [sortMode, setSortMode] = useState<SortMode>("value-desc");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [page, setPage] = useState(1);
  const [viewMode, setViewMode] = useState<GcfCompareViewV80>("aggregate");
  const [projectData, setProjectData] =
    useState<GcfPriorityProjectDatasetV80 | null>(null);
  const [projectLoading, setProjectLoading] = useState(true);
  const [projectError, setProjectError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      const result = await loadGcfCountryPortfolio(reloadKey > 0);
      if (cancelled) return;
      setPortfolio(result);
      setLoading(false);
    }

    void load().catch((loadError: unknown) => {
      if (cancelled) return;
      setLoading(false);
      setError(
        loadError instanceof Error
          ? loadError.message
          : "GCF 포트폴리오 로딩 불가"
      );
    });

    return () => {
      cancelled = true;
    };
  }, [reloadKey]);

  useEffect(() => {
    let cancelled = false;
    setProjectLoading(true);
    setProjectError(null);

    loadGcfPriorityProjectsV80()
      .then((result) => {
        if (cancelled) return;
        setProjectData(result);
        setProjectLoading(false);
      })
      .catch((loadError: unknown) => {
        if (cancelled) return;
        setProjectLoading(false);
        setProjectError(
          loadError instanceof Error
            ? loadError.message
            : "GCF 프로젝트 상태비교 로딩 실패"
        );
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const countryIndex = useMemo(
    () => new Map(countries.map((country) => [country.iso3, country])),
    [countries]
  );

  const regionOptions = useMemo(
    () =>
      Array.from(new Set(portfolio?.data.map((record) => record.region) ?? []))
        .filter(Boolean)
        .sort((a, b) => a.localeCompare(b, "ko")),
    [portfolio]
  );

  const definition =
    GCF_METRIC_DEFINITION_BY_ID.get(metricId) ?? GCF_METRIC_DEFINITIONS[0];
  const normalizedQuery = query.trim().toLocaleLowerCase("ko-KR");

  const rows = useMemo(() => {
    if (!portfolio) return [];
    const filtered = portfolio.data.filter((record) => {
      if (region !== "all" && record.region !== region) return false;
      if (characteristic === "ldc" && !record.ldc) return false;
      if (characteristic === "sids" && !record.sids) return false;
      const country = countryIndex.get(record.iso3);
      if (!normalizedQuery) return true;
      return [
        country?.nameKo ?? "",
        country?.nameEn ?? "",
        record.countryName,
        record.iso3,
      ]
        .join(" ")
        .toLocaleLowerCase("ko-KR")
        .includes(normalizedQuery);
    });

    return sortRows(filtered, metricId, sortMode, countryIndex);
  }, [
    characteristic,
    countryIndex,
    metricId,
    normalizedQuery,
    portfolio,
    region,
    sortMode,
  ]);

  const values = rows
    .map((record) => getGcfMetricValue(record, metricId))
    .filter(
      (value): value is number => value !== null && Number.isFinite(value)
    );
  const nonZeroCount = values.filter((value) => value > 0).length;
  const median = calculateMedian([...values].sort((a, b) => a - b));
  const total = values.reduce((sum, value) => sum + value, 0);

  useEffect(() => {
    setPage(1);
  }, [characteristic, metricId, query, region, sortMode]);

  const pageCount = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount);
  const startIndex = (safePage - 1) * PAGE_SIZE;
  const visibleRows = rows.slice(startIndex, startIndex + PAGE_SIZE);

  function downloadCurrentTable() {
    if (!portfolio) return;
    const header = [
      "country_iso3",
      "country_name_ko",
      "region",
      "ldc",
      "sids",
      "metric",
      "value",
      "unit",
      "snapshot_date",
      "source_organization",
      "source_url",
    ];
    const dataRows = rows.map((record) => [
      record.iso3,
      countryIndex.get(record.iso3)?.nameKo ?? record.countryName,
      record.region,
      record.ldc ? "yes" : "no",
      record.sids ? "yes" : "no",
      definition.titleKo,
      getGcfMetricValue(record, metricId) ?? "",
      definition.unit,
      portfolio.metadata.snapshotDate,
      portfolio.metadata.sourceOrganization,
      portfolio.metadata.sourceUrl,
    ]);
    const csv =
      "\uFEFF" +
      [header, ...dataRows]
        .map((row) => row.map((cell) => escapeCsvCell(cell)).join(","))
        .join("\n");
    downloadBlob(
      new Blob([csv], { type: "text/csv;charset=utf-8" }),
      `${metricId}-gcf-country-comparison.csv`
    );
  }

  if (loading)
    return <div className="compare-v35-state">GCF 사업·재원 로딩 중</div>;

  if (error) {
    return (
      <div className="compare-v35-state compare-v35-state--error">
        <h2>GCF 사업·재원을 불러올 수 없음</h2>
        <p>{error}</p>
        <button
          type="button"
          className="primary-button"
          onClick={() => setReloadKey((value) => value + 1)}
        >
          다시 시도
        </button>
      </div>
    );
  }

  if (!portfolio) return null;

  if (viewMode === "projects") {
    return (
      <section className="compare-v35-panel">
        <GcfCompareModeTabsV80 value={viewMode} onChange={setViewMode} />
        <GcfProjectStatusCompareV80
          data={projectData}
          loading={projectLoading}
          error={projectError}
          countries={countries}
          onOpenCountry={onOpenCountry}
        />
      </section>
    );
  }

  return (
    <section className="compare-v35-panel">
      <GcfCompareModeTabsV80 value={viewMode} onChange={setViewMode} />
      <div className="compare-v35-controls compare-v35-controls--gcf">
        <label>
          <span>비교 항목</span>
          <select
            value={metricId}
            onChange={(event) => {
              const nextMetricId = event.target.value as GcfMetricId;
              setMetricId(nextMetricId);
              onMetricChange?.(nextMetricId);
            }}
          >
            {GCF_METRIC_DEFINITIONS.map((item) => (
              <option key={item.id} value={item.id}>
                {item.titleKo}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span>지역</span>
          <select
            value={region}
            onChange={(event) => setRegion(event.target.value)}
          >
            <option value="all">전체 지역</option>
            {regionOptions.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span>국가 특성</span>
          <select
            value={characteristic}
            onChange={(event) =>
              setCharacteristic(event.target.value as CountryCharacteristic)
            }
          >
            <option value="all">전체</option>
            <option value="ldc">최빈개도국(LDC)</option>
            <option value="sids">군소도서개도국(SIDS)</option>
          </select>
        </label>
        <label>
          <span>정렬</span>
          <select
            value={sortMode}
            onChange={(event) => setSortMode(event.target.value as SortMode)}
          >
            <option value="value-desc">값 높은 순</option>
            <option value="value-asc">값 낮은 순</option>
            <option value="name">국가명 순</option>
          </select>
        </label>
        <label className="compare-v35-control-wide">
          <span>국가 검색</span>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="국가명 또는 ISO 코드"
          />
        </label>
      </div>

      <div className="compare-v35-source">
        <div>
          <strong>{definition.titleKo}</strong>
          <span>{definition.descriptionKo}</span>
        </div>
        <div>
          <span>기준 · {portfolio.metadata.snapshotDate}</span>
          <span>출처 · {portfolio.metadata.sourceOrganization}</span>
          <a
            href={portfolio.metadata.sourceUrl}
            target="_blank"
            rel="noreferrer"
          >
            원 데이터 확인 ↗
          </a>
        </div>
      </div>

      <div className="compare-v35-summary compare-v35-summary--4">
        <article>
          <span>비교 국가</span>
          <strong>{rows.length.toLocaleString()}개국</strong>
        </article>
        <article>
          <span>0 초과 값</span>
          <strong>{nonZeroCount.toLocaleString()}개국</strong>
        </article>
        <article>
          <span>중앙값</span>
          <strong>{formatGcfMetricValue(metricId, median)}</strong>
        </article>
        <article>
          <span>현재 필터 합계</span>
          <strong>{formatGcfMetricValue(metricId, total)}</strong>
        </article>
      </div>

      <div className="compare-v35-note">
        GCF 국가 포트폴리오 집계는 국가 전체 사업·재원 현황이며 특정 기후기술의
        지원규모나 한국과의 협력 가능 재원을 의미하지 않음
      </div>

      <section className="compare-v35-table-card">
        <header>
          <div>
            <h2>국가별 GCF 비교표</h2>
            <p>현재 필터 결과 {rows.length.toLocaleString()}개국</p>
          </div>
          <button
            type="button"
            className="secondary-button"
            onClick={downloadCurrentTable}
          >
            현재 결과 CSV 다운로드
          </button>
        </header>

        <div className="compare-v35-table-wrap">
          <table className="compare-v35-table">
            <thead>
              <tr>
                <th>번호</th>
                <th>국가</th>
                <th>지역</th>
                <th>국가 특성</th>
                <th>{definition.titleKo}</th>
              </tr>
            </thead>
            <tbody>
              {visibleRows.map((record, index) => {
                const country = countryIndex.get(record.iso3);
                return (
                  <tr key={record.iso3}>
                    <td>{startIndex + index + 1}</td>
                    <td>
                      <button
                        type="button"
                        className="compare-v35-country-link"
                        onClick={() => onOpenCountry?.(record.iso3)}
                      >
                        <strong>{country?.nameKo ?? record.countryName}</strong>
                        <small>{record.iso3}</small>
                      </button>
                    </td>
                    <td>{record.region}</td>
                    <td>
                      <div className="compare-v35-tags">
                        {record.ldc && <span>LDC</span>}
                        {record.sids && <span>SIDS</span>}
                        {!record.ldc && !record.sids && <span>일반</span>}
                      </div>
                    </td>
                    <td>
                      <strong>
                        {formatGcfMetricValue(
                          metricId,
                          getGcfMetricValue(record, metricId)
                        )}
                      </strong>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="compare-v35-pagination">
          <span>
            {rows.length === 0
              ? "표시 결과 없음"
              : `${startIndex + 1}–${Math.min(
                  startIndex + PAGE_SIZE,
                  rows.length
                )} / ${rows.length}`}
          </span>
          <div>
            <button
              type="button"
              disabled={safePage <= 1}
              onClick={() => setPage((value) => Math.max(1, value - 1))}
            >
              이전
            </button>
            <strong>
              {safePage} / {pageCount}
            </strong>
            <button
              type="button"
              disabled={safePage >= pageCount}
              onClick={() => setPage((value) => Math.min(pageCount, value + 1))}
            >
              다음
            </button>
          </div>
        </div>
      </section>
    </section>
  );
}

function GcfCompareModeTabsV80({
  value,
  onChange,
}: {
  value: GcfCompareViewV80;
  onChange: (value: GcfCompareViewV80) => void;
}) {
  return (
    <div className="gcf-v80-compare-mode" role="tablist">
      <button
        type="button"
        className={value === "aggregate" ? "active" : ""}
        onClick={() => onChange("aggregate")}
      >
        국가 집계
      </button>
      <button
        type="button"
        className={value === "projects" ? "active" : ""}
        onClick={() => onChange("projects")}
      >
        프로젝트 상태
      </button>
    </div>
  );
}

function GcfProjectStatusCompareV80({
  data,
  loading,
  error,
  countries,
  onOpenCountry,
}: {
  data: GcfPriorityProjectDatasetV80 | null;
  loading: boolean;
  error: string | null;
  countries: Country[];
  onOpenCountry?: (iso3: string) => void;
}) {
  const countryIndex = new Map(
    countries.map((country) => [country.iso3, country])
  );

  if (loading) {
    return (
      <div className="compare-v35-state">GCF 프로젝트 비교자료 불러오는 중</div>
    );
  }

  if (error) {
    return (
      <div className="compare-v35-state compare-v35-state--error">{error}</div>
    );
  }

  if (!data) return null;

  const priorityRows = Object.entries(data.countrySummaries)
    .map(([iso3, summary]) => {
      const countryProjects = data.records.filter(
        (project) => project.countryIso3 === iso3
      );
      const entities = Array.from(
        countryProjects.reduce((map, project) => {
          map.set(project.entity, (map.get(project.entity) ?? 0) + 1);
          return map;
        }, new Map<string, number>())
      )
        .map(([entity, count]) => ({
          entity,
          count,
        }))
        .sort((a, b) => b.count - a.count);

      return {
        iso3,
        summary,
        countryName: countryIndex.get(iso3)?.nameKo ?? summary.countryNameKo,
        topEntity: entities[0]?.entity ?? "—",
      };
    })
    .sort(
      (a, b) =>
        b.summary.officialCurrentProjectCount -
        a.summary.officialCurrentProjectCount
    );

  return (
    <section className="gcf-v80-project-compare">
      <div className="compare-v35-source">
        <div>
          <strong>GCF 프로젝트 상태 비교</strong>
          <span>프로젝트 번호·사업명·인증기구(AE)·상태를 국가별로 비교</span>
        </div>
        <div>
          <span>기준 · {data.metadata.referenceDate}</span>
          <span>출처 · {data.metadata.sourceOrganization}</span>
        </div>
      </div>

      <div className="compare-v35-note">
        다국가 사업은 여러 국가에 반복될 수 있음 · 프로젝트 전체 GCF 재원을 특정
        국가에 임의 배분하지 않음 · Lapsed 이력은 현재 국가 프로젝트 수와 분리
      </div>

      <section className="compare-v35-table-card">
        <header>
          <div>
            <h2>우선 10개국 프로젝트 상태</h2>
            <p>
              현재 포트폴리오 관계 {data.metadata.currentPortfolioRelationCount}
              건 · Lapsed 포함 전체 관계 {data.metadata.relationRecordCount}건
            </p>
          </div>
        </header>

        <div className="compare-v35-table-wrap">
          <table className="compare-v35-table gcf-v80-project-table">
            <thead>
              <tr>
                <th>국가</th>
                <th>현재 사업</th>
                <th>이행 중</th>
                <th>승인</th>
                <th>완료</th>
                <th>Lapsed 이력</th>
                <th>주요 AE</th>
              </tr>
            </thead>
            <tbody>
              {priorityRows.map((row) => (
                <tr key={row.iso3}>
                  <td>
                    <button
                      type="button"
                      className="compare-v35-country-link"
                      onClick={() => onOpenCountry?.(row.iso3)}
                    >
                      <strong>{row.countryName}</strong>
                      <small>{row.iso3}</small>
                    </button>
                  </td>
                  <td>
                    <strong>{row.summary.officialCurrentProjectCount}건</strong>
                  </td>
                  <td>
                    {row.summary.statusCounts["Under implementation"] ?? 0}건
                  </td>
                  <td>{row.summary.statusCounts.Approved ?? 0}건</td>
                  <td>{row.summary.statusCounts.Completed ?? 0}건</td>
                  <td>{row.summary.statusCounts.Lapsed ?? 0}건</td>
                  <td>{row.topEntity}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </section>
  );
}

function sortRows(
  records: GcfCountryPortfolioRecord[],
  metricId: GcfMetricId,
  sortMode: SortMode,
  countryIndex: Map<string, Country>
): GcfCountryPortfolioRecord[] {
  return [...records].sort((a, b) => {
    if (sortMode === "name") {
      const aName = countryIndex.get(a.iso3)?.nameKo ?? a.countryName;
      const bName = countryIndex.get(b.iso3)?.nameKo ?? b.countryName;
      return aName.localeCompare(bName, "ko");
    }
    const aValue = getGcfMetricValue(a, metricId) ?? 0;
    const bValue = getGcfMetricValue(b, metricId) ?? 0;
    return sortMode === "value-desc" ? bValue - aValue : aValue - bValue;
  });
}

function calculateMedian(values: number[]): number | null {
  if (values.length === 0) return null;
  const middle = Math.floor(values.length / 2);
  return values.length % 2 === 1
    ? values[middle]
    : (values[middle - 1] + values[middle]) / 2;
}

function escapeCsvCell(value: string | number): string {
  let text = String(value);
  if (/^[=+\-@]/.test(text)) text = `'${text}`;
  return `"${text.replace(/"/g, '""')}"`;
}
