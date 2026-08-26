import { useEffect, useMemo, useState } from "react";
import {
  INDICATOR_CONFIGS,
  createObservationIndex,
  formatIndicatorReferencePeriod,
  formatRawValue,
  getIndicatorConfig,
  getIndicatorTimeLabel,
  getIndicatorYears,
  loadIndicatorData,
} from "../../data/indicators/registry";
import type { IndicatorId } from "../../data/indicators/registry";
import type { Country } from "../../types/country";
import type { IndicatorObservation } from "../../types/indicator";
import { downloadBlob } from "../../utils/browser";

type ScopeFilter = "all" | "low-middle-income";
type SortMode = "value-desc" | "value-asc" | "name";
type AvailabilityFilter = "available" | "missing" | "all";

interface Props {
  countries: Country[];
  initialIndicatorId?: IndicatorId;
  initialYear?: number | null;
  onIndicatorChange?: (indicatorId: IndicatorId) => void;
  onYearChange?: (year: number | null) => void;
  onOpenCountry?: (iso3: string) => void;
}

interface CompareRow {
  country: Country;
  value: number | null;
}

const LOW_MIDDLE_INCOME_CODES = new Set(["LIC", "LMC", "UMC"]);
const PAGE_SIZE = 30;

export default function IndicatorComparePanelV35({
  countries,
  initialIndicatorId = "electricity-access",
  initialYear = null,
  onIndicatorChange,
  onYearChange,
  onOpenCountry,
}: Props) {
  const [indicatorId, setIndicatorId] =
    useState<IndicatorId>(initialIndicatorId);

  useEffect(() => {
    setIndicatorId(initialIndicatorId);
  }, [initialIndicatorId]);

  const [observations, setObservations] = useState<IndicatorObservation[]>([]);
  const [selectedYear, setSelectedYear] = useState<number | null>(initialYear);

  useEffect(() => {
    setSelectedYear(initialYear);
  }, [initialYear, initialIndicatorId]);
  const [scope, setScope] = useState<ScopeFilter>("all");
  const [region, setRegion] = useState("all");
  const [query, setQuery] = useState("");
  const [sortMode, setSortMode] = useState<SortMode>("value-desc");
  const [availability, setAvailability] =
    useState<AvailabilityFilter>("available");
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [page, setPage] = useState(1);

  const config = getIndicatorConfig(indicatorId);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      const result = await loadIndicatorData(indicatorId, reloadKey > 0);
      if (cancelled) return;
      setObservations(result.observations);
      setLastUpdated(result.lastUpdated);
      setWarning(result.warning ?? null);
      setLoading(false);
    }

    void load().catch((loadError: unknown) => {
      if (cancelled) return;
      setLoading(false);
      setError(
        loadError instanceof Error ? loadError.message : "지표 데이터 로딩 불가"
      );
    });

    return () => {
      cancelled = true;
    };
  }, [indicatorId, reloadKey]);

  const years = useMemo(() => getIndicatorYears(observations), [observations]);

  useEffect(() => {
    if (years.length === 0) {
      if (selectedYear !== null) {
        setSelectedYear(null);
        onYearChange?.(null);
      }
      return;
    }

    const preferred =
      initialYear !== null && years.includes(initialYear)
        ? initialYear
        : selectedYear !== null && years.includes(selectedYear)
        ? selectedYear
        : years[0];

    if (selectedYear !== preferred) {
      setSelectedYear(preferred);
      onYearChange?.(preferred);
    }
  }, [initialYear, onYearChange, selectedYear, years]);

  const observationIndex = useMemo(
    () => createObservationIndex(observations),
    [observations]
  );

  const regionOptions = useMemo(
    () =>
      Array.from(new Set(countries.map((country) => country.region)))
        .filter(Boolean)
        .sort((a, b) => a.localeCompare(b, "ko")),
    [countries]
  );

  const normalizedQuery = query.trim().toLocaleLowerCase("ko-KR");

  const rows = useMemo<CompareRow[]>(() => {
    if (selectedYear === null) return [];
    return countries
      .filter((country) => {
        if (
          scope === "low-middle-income" &&
          !LOW_MIDDLE_INCOME_CODES.has(country.incomeLevelCode)
        ) {
          return false;
        }
        if (region !== "all" && country.region !== region) return false;
        if (!normalizedQuery) return true;
        return [country.nameKo, country.nameEn, country.iso2, country.iso3]
          .join(" ")
          .toLocaleLowerCase("ko-KR")
          .includes(normalizedQuery);
      })
      .map((country) => ({
        country,
        value: observationIndex.get(`${country.iso3}:${selectedYear}`) ?? null,
      }));
  }, [
    countries,
    normalizedQuery,
    observationIndex,
    region,
    scope,
    selectedYear,
  ]);

  const filteredRows = useMemo(() => {
    const availabilityRows = rows.filter((row) => {
      if (availability === "available") return row.value !== null;
      if (availability === "missing") return row.value === null;
      return true;
    });
    return sortRows(availabilityRows, sortMode);
  }, [availability, rows, sortMode]);

  const availableValues = rows
    .map((row) => row.value)
    .filter((value): value is number => value !== null)
    .sort((a, b) => a - b);

  const median = calculateMedian(availableValues);
  const min = availableValues[0] ?? null;
  const max = availableValues[availableValues.length - 1] ?? null;
  const missingCount = rows.filter((row) => row.value === null).length;

  useEffect(() => {
    setPage(1);
  }, [availability, indicatorId, query, region, scope, selectedYear, sortMode]);

  const pageCount = Math.max(1, Math.ceil(filteredRows.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount);
  const startIndex = (safePage - 1) * PAGE_SIZE;
  const visibleRows = filteredRows.slice(startIndex, startIndex + PAGE_SIZE);

  function downloadCurrentTable() {
    if (config.downloadPolicy !== "allowed" || selectedYear === null) return;
    const rowsForCsv: Array<Array<string | number>> = [
      [
        "country_iso3",
        "country_name_ko",
        "country_name_en",
        "region",
        "income_level",
        "reference_period",
        "value",
        "unit",
        "source_organization",
        "source_url",
      ],
      ...filteredRows.map((row) => [
        row.country.iso3,
        row.country.nameKo,
        row.country.nameEn,
        row.country.region,
        row.country.incomeLevel,
        formatIndicatorReferencePeriod(config, selectedYear),
        row.value ?? "",
        config.definition.unit,
        config.definition.sourceOrganization,
        config.definition.sourceUrl,
      ]),
    ];

    const csv =
      "\uFEFF" +
      rowsForCsv.map((row) => row.map(escapeCsvCell).join(",")).join("\n");
    downloadBlob(
      new Blob([csv], { type: "text/csv;charset=utf-8" }),
      `${config.id}-${selectedYear}-country-comparison.csv`
    );
  }

  if (loading) {
    return <div className="compare-v35-state">지표 데이터 로딩 중</div>;
  }

  if (error) {
    return (
      <div className="compare-v35-state compare-v35-state--error">
        <h2>지표 데이터를 불러올 수 없음</h2>
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

  return (
    <section className="compare-v35-panel">
      <div className="compare-v35-controls compare-v35-controls--indicator">
        <label>
          <span>비교 지표</span>
          <select
            value={indicatorId}
            onChange={(event) => {
              const nextIndicatorId = event.target.value as IndicatorId;
              setIndicatorId(nextIndicatorId);
              onIndicatorChange?.(nextIndicatorId);
            }}
          >
            {INDICATOR_CONFIGS.map((item) => (
              <option key={item.id} value={item.id}>
                {item.definition.titleKo}
              </option>
            ))}
          </select>
        </label>

        <label>
          <span>{getIndicatorTimeLabel(config)}</span>
          <select
            value={selectedYear ?? ""}
            onChange={(event) => {
              const nextYear = Number(event.target.value);
              setSelectedYear(nextYear);
              onYearChange?.(nextYear);
            }}
            disabled={Boolean(config.referencePeriodLabel)}
          >
            {years.map((year) => (
              <option key={year} value={year}>
                {formatIndicatorReferencePeriod(config, year)}
              </option>
            ))}
          </select>
        </label>

        <label>
          <span>국가 범위</span>
          <select
            value={scope}
            onChange={(event) => setScope(event.target.value as ScopeFilter)}
          >
            <option value="all">전체 국가</option>
            <option value="low-middle-income">저·중소득 국가</option>
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
          <span>자료</span>
          <select
            value={availability}
            onChange={(event) =>
              setAvailability(event.target.value as AvailabilityFilter)
            }
          >
            <option value="available">값 제공 국가</option>
            <option value="missing">자료 없음 국가</option>
            <option value="all">전체 국가</option>
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

      {warning && <div className="compare-v35-warning">{warning}</div>}

      <div className="compare-v35-source">
        <div>
          <strong>{config.definition.titleKo}</strong>
          <span>{config.definition.description}</span>
        </div>
        <div>
          <span>
            기준 · {formatIndicatorReferencePeriod(config, selectedYear)}
          </span>
          <span>출처 · {config.definition.sourceOrganization}</span>
          {lastUpdated && <span>원 데이터 갱신 · {lastUpdated}</span>}
          <a
            href={config.definition.sourceUrl}
            target="_blank"
            rel="noreferrer"
          >
            원 데이터 확인 ↗
          </a>
        </div>
      </div>

      <div className="compare-v35-summary compare-v35-summary--4">
        <article>
          <span>비교 대상</span>
          <strong>{rows.length.toLocaleString()}개국</strong>
        </article>
        <article>
          <span>값 제공</span>
          <strong>{availableValues.length.toLocaleString()}개국</strong>
        </article>
        <article>
          <span>중앙값</span>
          <strong>{formatRawValue(config, median)}</strong>
        </article>
        <article>
          <span>범위</span>
          <strong>
            {min === null || max === null
              ? "자료 없음"
              : `${formatRawValue(config, min)} – ${formatRawValue(
                  config,
                  max
                )}`}
          </strong>
        </article>
      </div>

      <div className="compare-v35-note">
        자료 없음 {missingCount.toLocaleString()}개국 · 정렬은 원지표 값 기준
      </div>

      <section className="compare-v35-table-card">
        <header>
          <div>
            <h2>전체 국가 비교표</h2>
            <p>
              동일 지표·기준시점 적용 · 현재 필터 결과{" "}
              {filteredRows.length.toLocaleString()}개국
            </p>
          </div>
          <button
            type="button"
            className="secondary-button"
            disabled={
              config.downloadPolicy !== "allowed" || filteredRows.length === 0
            }
            onClick={downloadCurrentTable}
          >
            {config.downloadPolicy === "allowed"
              ? "현재 결과 CSV 다운로드"
              : "원 데이터 이용조건 확인"}
          </button>
        </header>

        <IndicatorTable
          rows={visibleRows}
          config={config}
          onOpenCountry={onOpenCountry}
          startNumber={startIndex + 1}
        />

        <div className="compare-v35-pagination">
          <span>
            {filteredRows.length === 0
              ? "표시 결과 없음"
              : `${startIndex + 1}–${Math.min(
                  startIndex + PAGE_SIZE,
                  filteredRows.length
                )} / ${filteredRows.length}`}
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

function IndicatorTable({
  rows,
  config,
  onOpenCountry,
  startNumber,
}: {
  rows: CompareRow[];
  config: ReturnType<typeof getIndicatorConfig>;
  onOpenCountry?: (iso3: string) => void;
  startNumber: number;
}) {
  return (
    <div className="compare-v35-table-wrap">
      <table className="compare-v35-table">
        <thead>
          <tr>
            <th>번호</th>
            <th>국가</th>
            <th>지역</th>
            <th>소득수준</th>
            <th>{config.definition.titleKo}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={row.country.iso3}>
              <td>{startNumber + index}</td>
              <td>
                <button
                  type="button"
                  className="compare-v35-country-link"
                  onClick={() => onOpenCountry?.(row.country.iso3)}
                >
                  <strong>{row.country.nameKo}</strong>
                  <small>{row.country.iso3}</small>
                </button>
              </td>
              <td>{row.country.region}</td>
              <td>{row.country.incomeLevel}</td>
              <td>
                <strong>{formatRawValue(config, row.value)}</strong>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function sortRows(rows: CompareRow[], sortMode: SortMode): CompareRow[] {
  return [...rows].sort((a, b) => {
    if (sortMode === "name") {
      return a.country.nameKo.localeCompare(b.country.nameKo, "ko");
    }
    if (a.value === null && b.value === null) return 0;
    if (a.value === null) return 1;
    if (b.value === null) return -1;
    return sortMode === "value-desc" ? b.value - a.value : a.value - b.value;
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
