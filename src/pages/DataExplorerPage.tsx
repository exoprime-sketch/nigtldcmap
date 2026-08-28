import { useEffect, useMemo, useState } from "react";
import {
  countryCatalogKeyV122,
  loadCatalogForCountrySelectionV122,
  loadSearchIndexForCountrySelectionV122,
  publicCountryDataErrorMessageV122,
} from "../data/countries/countryDataFacadeV122";
import { listCountryDataProvidersV122 } from "../data/countries/countryDataProviderRegistryV122";
import type { CountryCatalogItemV122 } from "../data/countries/countryDataTypesV122";
import { getElementVisualizationSummaryV125 } from "../data/visualization/elementVisualizationRegistryV125";
import { CATEGORIES } from "../data/publicTaxonomy";
import type { CategoryCode } from "../data/publicTaxonomy";
import {
  normalizedSearchV121,
  technologyLabelV121,
} from "../utils/vietnamActualV121";
import "../styles/country-data-platform-v122.css";

interface DataExplorerPageProps {
  query: string;
  countryIso3: string;
  sourceOrganization: string;
  category: CategoryCode | "all";
  technologyId: string;
  selectedGroup: string | null;
  onQueryChange: (value: string) => void;
  onCountryChange: (value: string) => void;
  onSourceOrganizationChange: (value: string) => void;
  onCategoryChange: (value: CategoryCode | "all") => void;
  onTechnologyChange: (value: string) => void;
  onGroupChange: (value: string | null) => void;
  onOpenDownload: (elementId: string, countryIso3: string) => void;
  onOpenElement: (elementId: string, countryIso3: string) => void;
  onOpenMapElement?: (elementId: string, countryIso3: string) => void;
}

const INITIAL_VISIBLE_COUNT = 24;

function unique(values: Array<string | null | undefined>): string[] {
  return Array.from(
    new Set(values.filter((value): value is string => Boolean(value?.trim())))
  ).sort((a, b) => a.localeCompare(b, "ko"));
}

function latestYearLabel(value: number | string | null | undefined): string {
  if (value === null || value === undefined || String(value).trim() === "") {
    return "";
  }
  return String(value);
}

function referenceYearRangeV125(item: CountryCatalogItemV122): string {
  const years = item.raw.referenceYears
    .flatMap((value) => String(value).match(/\b(?:19|20)\d{2}\b/g) || [])
    .map(Number)
    .filter(Number.isFinite)
    .sort((left, right) => left - right);
  if (years.length === 0) return latestYearLabel(item.latestYear) || "미기재";
  return years[0] === years[years.length - 1]
    ? String(years[0])
    : `${years[0]}–${years[years.length - 1]}`;
}

function contractSummaryValuesV125(values: string[], emptyLabel: string): string {
  if (values.length === 0) return emptyLabel;
  const labels = values.slice(0, 3);
  return `${labels.join(" · ")}${
    values.length > labels.length ? ` 외 ${values.length - labels.length}종` : ""
  }`;
}

export default function DataExplorerPage({
  query,
  countryIso3,
  sourceOrganization,
  category,
  technologyId,
  selectedGroup,
  onQueryChange,
  onCountryChange,
  onSourceOrganizationChange,
  onCategoryChange,
  onTechnologyChange,
  onGroupChange,
  onOpenDownload,
  onOpenElement,
  onOpenMapElement,
}: DataExplorerPageProps) {
  const [catalog, setCatalog] = useState<CountryCatalogItemV122[]>([]);
  const [searchIndex, setSearchIndex] = useState(
    new Map<string, { searchText: string; keywords: string[] }>()
  );
  const [loading, setLoading] = useState(true);
  const [searchIndexLoading, setSearchIndexLoading] = useState(false);
  const [searchIndexLoadedFor, setSearchIndexLoadedFor] = useState("");
  const [error, setError] = useState("");
  const [yearFilter, setYearFilter] = useState("all");
  const [visibleCount, setVisibleCount] = useState(INITIAL_VISIBLE_COUNT);

  const normalizedCountry = countryIso3 === "all" ? "all" : countryIso3;
  const normalizedQuery = normalizedSearchV121(query);
  const providers = useMemo(() => listCountryDataProvidersV122(), []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError("");
    setCatalog([]);
    setSearchIndex(new Map());
    setSearchIndexLoadedFor("");
    void loadCatalogForCountrySelectionV122(normalizedCountry)
      .then((items) => {
        if (!cancelled) setCatalog(items);
      })
      .catch((reason: unknown) => {
        if (!cancelled) {
          console.error("Country catalog load failed", reason);
          setError(publicCountryDataErrorMessageV122(reason));
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [normalizedCountry]);

  useEffect(() => {
    if (
      !normalizedQuery ||
      searchIndexLoading ||
      searchIndexLoadedFor === normalizedCountry
    ) {
      return;
    }
    let cancelled = false;
    setSearchIndexLoading(true);
    void loadSearchIndexForCountrySelectionV122(normalizedCountry)
      .then((index) => {
        if (cancelled) return;
        const next = new Map<
          string,
          { searchText: string; keywords: string[] }
        >();
        index.forEach((entry, key) =>
          next.set(key, {
            searchText: entry.searchText,
            keywords: entry.keywords,
          })
        );
        setSearchIndex(next);
        setSearchIndexLoadedFor(normalizedCountry);
      })
      .catch((reason: unknown) => {
        if (!cancelled) {
          console.error("Country search index load failed", reason);
          setError(
            publicCountryDataErrorMessageV122(
              reason,
              "검색 데이터를 불러오지 못했습니다"
            )
          );
        }
      })
      .finally(() => {
        if (!cancelled) setSearchIndexLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [
    normalizedCountry,
    normalizedQuery,
    searchIndexLoadedFor,
    searchIndexLoading,
  ]);

  const availableCatalog = useMemo(
    () => catalog.filter((item) => item.isDiscoverable),
    [catalog]
  );

  const groups = useMemo(
    () =>
      unique(
        availableCatalog
          .filter(
            (item) => category === "all" || item.categoryCode === category
          )
          .map((item) => item.groupCode)
      ).map((code) => ({
        code,
        label:
          availableCatalog.find((item) => item.groupCode === code)
            ?.groupLabel || code,
      })),
    [availableCatalog, category]
  );

  const years = useMemo(
    () =>
      unique(availableCatalog.map((item) => latestYearLabel(item.latestYear)))
        .filter(Boolean)
        .sort((a, b) => Number(b) - Number(a)),
    [availableCatalog]
  );
  const sources = useMemo(
    () => unique(availableCatalog.flatMap((item) => item.sourceOrganizations)),
    [availableCatalog]
  );
  const technologies = useMemo(
    () => unique(availableCatalog.flatMap((item) => item.technologyIds)),
    [availableCatalog]
  );

  const filtered = useMemo(() => {
    return availableCatalog.filter((item) => {
      if (category !== "all" && item.categoryCode !== category) return false;
      if (selectedGroup && item.groupCode !== selectedGroup) return false;
      if (
        yearFilter !== "all" &&
        latestYearLabel(item.latestYear) !== yearFilter
      ) {
        return false;
      }
      if (
        sourceOrganization !== "all" &&
        !item.sourceOrganizations.includes(sourceOrganization)
      ) {
        return false;
      }
      if (
        technologyId !== "all" &&
        !item.technologyIds.includes(technologyId)
      ) {
        return false;
      }
      if (normalizedQuery) {
        const indexed = searchIndex.get(
          countryCatalogKeyV122(item.providerId, item.elementId)
        );
        const haystack = normalizedSearchV121(
          [
            item.publicTitle,
            item.publicDescription,
            item.categoryLabel,
            item.sectionLabel,
            item.groupLabel,
            item.countryNameKo,
            ...item.sourceOrganizations,
            ...item.technologyIds.map(technologyLabelV121),
            indexed?.searchText || "",
            ...(indexed?.keywords || []),
          ].join(" ")
        );
        if (!haystack.includes(normalizedQuery)) return false;
      }
      return true;
    });
  }, [
    availableCatalog,
    category,
    normalizedQuery,
    searchIndex,
    selectedGroup,
    sourceOrganization,
    technologyId,
    yearFilter,
  ]);

  useEffect(
    () => setVisibleCount(INITIAL_VISIBLE_COUNT),
    [
      normalizedCountry,
      normalizedQuery,
      category,
      selectedGroup,
      sourceOrganization,
      technologyId,
      yearFilter,
    ]
  );

  const visibleItems = filtered.slice(0, visibleCount);
  const showCountryContext =
    providers.length > 1 || normalizedCountry === "all";

  function resetFilters(): void {
    onQueryChange("");
    onCountryChange("all");
    onCategoryChange("all");
    onGroupChange(null);
    onSourceOrganizationChange("all");
    onTechnologyChange("all");
    setYearFilter("all");
  }

  return (
    <div className="page-shell cdp-page">
      <section className="cdp-hero">
        <h1>데이터 찾기</h1>
        <p>기후·경제·정책·사업 데이터를 찾아볼 수 있습니다</p>
      </section>

      <section className="cdp-panel cdp-filter-panel" aria-label="데이터 검색">
        <label className="cdp-field cdp-field--wide">
          <span className="cdp-field__label">검색</span>
          <input
            className="cdp-input"
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
            placeholder="데이터명, 기관명, 사업명 또는 지역명 검색"
          />
        </label>

        <div className="cdp-filter-grid cdp-filter-grid--primary">
          <label className="cdp-field">
            <span className="cdp-field__label">국가</span>
            <select
              className="cdp-select"
              value={countryIso3}
              onChange={(event) => onCountryChange(event.target.value)}
            >
              <option value="all">전체</option>
              {providers.map((provider) => (
                <option key={provider.countryIso3} value={provider.countryIso3}>
                  {provider.countryNameKo}
                </option>
              ))}
            </select>
          </label>

          <label className="cdp-field">
            <span className="cdp-field__label">대분류</span>
            <select
              className="cdp-select"
              value={category}
              onChange={(event) => {
                onCategoryChange(event.target.value as CategoryCode | "all");
                onGroupChange(null);
              }}
            >
              <option value="all">전체</option>
              {CATEGORIES.map((item) => (
                <option key={item.code} value={item.code}>
                  {item.nameKo}
                </option>
              ))}
            </select>
          </label>

          <label className="cdp-field">
            <span className="cdp-field__label">데이터 그룹</span>
            <select
              className="cdp-select"
              value={selectedGroup || "all"}
              onChange={(event) =>
                onGroupChange(
                  event.target.value === "all" ? null : event.target.value
                )
              }
            >
              <option value="all">전체</option>
              {groups.map((group) => (
                <option key={group.code} value={group.code}>
                  {group.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        <details className="cdp-advanced-filters">
          <summary>상세 필터</summary>
          <div className="cdp-filter-grid cdp-filter-grid--secondary">
            <label className="cdp-field">
              <span className="cdp-field__label">자료연도</span>
              <select
                className="cdp-select"
                value={yearFilter}
                onChange={(event) => setYearFilter(event.target.value)}
              >
                <option value="all">전체</option>
                {years.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </label>
            <label className="cdp-field">
              <span className="cdp-field__label">자료 제공기관</span>
              <select
                className="cdp-select"
                value={sourceOrganization}
                onChange={(event) =>
                  onSourceOrganizationChange(event.target.value)
                }
              >
                <option value="all">전체</option>
                {sources.map((source) => (
                  <option key={source} value={source}>
                    {source}
                  </option>
                ))}
              </select>
            </label>
            <label className="cdp-field">
              <span className="cdp-field__label">기후기술</span>
              <select
                className="cdp-select"
                value={technologyId}
                onChange={(event) => onTechnologyChange(event.target.value)}
              >
                <option value="all">전체</option>
                {technologies.map((id) => (
                  <option key={id} value={id}>
                    {technologyLabelV121(id)}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </details>

        <div className="cdp-filter-actions">
          <button
            type="button"
            className="cdp-button cdp-button--secondary"
            onClick={resetFilters}
          >
            필터 초기화
          </button>
          <span className="cdp-result-count" aria-live="polite">
            {loading
              ? "불러오는 중"
              : `검색결과 ${filtered.length.toLocaleString("ko-KR")}건`}
          </span>
          {searchIndexLoading && (
            <span className="cdp-muted">검색 범위를 확장하는 중</span>
          )}
        </div>
      </section>

      {error && (
        <div className="cdp-alert cdp-alert--error" role="alert">
          <strong>{error}</strong>
          <span>잠시 후 다시 시도해 주세요</span>
        </div>
      )}

      {!loading && visibleItems.length === 0 && !error && (
        <section className="cdp-panel cdp-empty">
          <h2>조건에 맞는 데이터가 없습니다</h2>
          <p>검색어 또는 필터를 조정해 주세요</p>
        </section>
      )}

      <section className="cdp-card-grid" aria-label="데이터 검색결과">
        {visibleItems.map((item) => {
          const contract = getElementVisualizationSummaryV125(item.elementId);
          const publicRecordCount =
            contract?.populatedRecordCount ?? item.observationCount + item.entityCount;
          const semanticYearRange = contract
            ? contract.yearRange.start === null
              ? referenceYearRangeV125(item)
              : contract.yearRange.start === contract.yearRange.end
              ? String(contract.yearRange.start)
              : `${contract.yearRange.start}–${contract.yearRange.end}`
            : referenceYearRangeV125(item);
          return (
          <article
            className="cdp-dataset-card"
            key={countryCatalogKeyV122(item.providerId, item.elementId)}
          >
            <div className="cdp-card__path">
              <span>{item.categoryLabel}</span>
              <span aria-hidden="true">›</span>
              <span>{item.groupLabel}</span>
            </div>
            <div className="cdp-chip-row" aria-label="데이터 공개 상태">
              <span
                className="cdp-chip"
                data-public-status={item.publicStatus}
              >
                {item.publicStatusLabel}
              </span>
              {!item.hasMapData &&
                (item.raw.detailTemplate === "spatial" ||
                  item.raw.spatialAvailability === "not-available" ||
                  item.raw.spatialAvailability === "not-collected") && (
                  <span className="cdp-chip">공간자료 미확보</span>
                )}
            </div>
            {showCountryContext && (
              <span className="cdp-country-chip">{item.countryNameKo}</span>
            )}
            <h2>{item.publicTitle}</h2>
            <p className="cdp-card__description">{item.publicDescription}</p>
            <dl className="cdp-card__facts">
              <div>
                <dt>실제 레코드</dt>
                <dd>{publicRecordCount.toLocaleString("ko-KR")}건</dd>
              </div>
              <div>
                <dt>기준연도 범위</dt>
                <dd>{semanticYearRange}</dd>
              </div>
              <div>
                <dt>주요 측정항목</dt>
                <dd>
                  {contract
                    ? contractSummaryValuesV125(contract.measureLabels, "측정항목 없음")
                    : "의미 계약 확인 중"}
                </dd>
              </div>
              <div>
                <dt>주요 분류 차원</dt>
                <dd>
                  {contract
                    ? contractSummaryValuesV125(contract.dimensionLabels, "추가 분류 없음")
                    : "의미 계약 확인 중"}
                </dd>
              </div>
              <div>
                <dt>공간표현</dt>
                <dd>{contract?.spatiallyLinked || item.hasMapData ? "가능" : "미확보"}</dd>
              </div>
              <div>
                <dt>다운로드</dt>
                <dd>{contract?.downloadAvailable || item.hasDownloadableData ? "가능" : "제공되지 않음"}</dd>
              </div>
            </dl>
            {item.technologyIds.length > 0 && (
              <div className="cdp-chip-row" aria-label="관련 기후기술">
                {item.technologyIds.slice(0, 3).map((id) => (
                  <span className="cdp-chip" key={id}>
                    {technologyLabelV121(id)}
                  </span>
                ))}
              </div>
            )}
            <div className="cdp-card__actions">
              <button
                type="button"
                className="cdp-button cdp-button--primary"
                onClick={() => onOpenElement(item.elementId, item.countryIso3)}
              >
                데이터 보기
              </button>
              {item.hasMapData && onOpenMapElement && (
                <button
                  type="button"
                  className="cdp-button cdp-button--secondary"
                  onClick={() =>
                    onOpenMapElement(item.elementId, item.countryIso3)
                  }
                >
                  지도에서 보기
                </button>
              )}
              {item.hasDownloadableData && (
                <button
                  type="button"
                  className="cdp-button cdp-button--secondary"
                  onClick={() =>
                    onOpenDownload(item.elementId, item.countryIso3)
                  }
                >
                  다운로드
                </button>
              )}
            </div>
          </article>
          );
        })}
      </section>

      {visibleCount < filtered.length && (
        <div className="cdp-load-more">
          <button
            type="button"
            className="cdp-button cdp-button--secondary"
            onClick={() =>
              setVisibleCount((current) => current + INITIAL_VISIBLE_COUNT)
            }
          >
            더 보기
          </button>
        </div>
      )}
    </div>
  );
}
