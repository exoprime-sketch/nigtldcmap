import { useEffect, useMemo, useRef, useState } from "react";
import {
  INDICATOR_CONFIGS,
  formatIndicatorReferencePeriod,
  formatRawValue,
  getIndicatorConfig,
  getIndicatorYears,
  loadIndicatorData,
} from "../../data/indicators/registry";
import type { IndicatorId } from "../../data/indicators/registry";
import type { Country } from "../../types/country";
import type { IndicatorObservation } from "../../types/indicator";
import { downloadBlob } from "../../utils/browser";

interface Props {
  countries: Country[];
  initialCountryIso3?: string | null;
  initialIndicatorId?: IndicatorId;
  onIndicatorChange?: (indicatorId: IndicatorId) => void;
  onOpenCountry?: (iso3: string) => void;
}

const CHART_COUNTRY_LIMIT = 8;

export default function TrendComparePanelV35({
  countries,
  initialCountryIso3 = null,
  initialIndicatorId = "electricity-access",
  onIndicatorChange,
  onOpenCountry,
}: Props) {
  const selectionInitialized = useRef(false);
  const [indicatorId, setIndicatorId] =
    useState<IndicatorId>(initialIndicatorId);

  useEffect(() => {
    setIndicatorId(initialIndicatorId);
  }, [initialIndicatorId]);
  const [observations, setObservations] = useState<IndicatorObservation[]>([]);
  const [selectedIso3, setSelectedIso3] = useState<Set<string>>(new Set());
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [warning, setWarning] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  const config = getIndicatorConfig(indicatorId);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      const result = await loadIndicatorData(indicatorId, reloadKey > 0);
      if (cancelled) return;
      setObservations(result.observations);
      setWarning(result.warning ?? null);
      setLoading(false);
    }

    void load().catch((loadError: unknown) => {
      if (cancelled) return;
      setLoading(false);
      setError(
        loadError instanceof Error
          ? loadError.message
          : "시계열 데이터 로딩 불가"
      );
    });

    return () => {
      cancelled = true;
    };
  }, [indicatorId, reloadKey]);

  useEffect(() => {
    if (selectionInitialized.current || countries.length === 0) return;
    if (
      initialCountryIso3 &&
      countries.some((country) => country.iso3 === initialCountryIso3)
    ) {
      setSelectedIso3(new Set([initialCountryIso3]));
    }
    selectionInitialized.current = true;
  }, [countries, initialCountryIso3]);

  const years = useMemo(
    () => getIndicatorYears(observations).sort((a, b) => a - b),
    [observations]
  );

  const countrySeries = useMemo(() => {
    const index = new Map<string, Map<number, number | null>>();
    observations.forEach((item) => {
      if (!index.has(item.iso3)) index.set(item.iso3, new Map());
      index
        .get(item.iso3)
        ?.set(
          item.year,
          typeof item.value === "number" && Number.isFinite(item.value)
            ? item.value
            : null
        );
    });
    return index;
  }, [observations]);

  const normalizedQuery = query.trim().toLocaleLowerCase("ko-KR");
  const selectableCountries = useMemo(
    () =>
      countries.filter((country) => {
        const hasAny = years.some(
          (year) => countrySeries.get(country.iso3)?.get(year) != null
        );
        if (!hasAny) return false;
        if (!normalizedQuery) return true;
        return [country.nameKo, country.nameEn, country.iso3, country.iso2]
          .join(" ")
          .toLocaleLowerCase("ko-KR")
          .includes(normalizedQuery);
      }),
    [countries, countrySeries, normalizedQuery, years]
  );

  const selectedCountries = useMemo(
    () =>
      countries
        .filter((country) => selectedIso3.has(country.iso3))
        .sort((a, b) => a.nameKo.localeCompare(b.nameKo, "ko")),
    [countries, selectedIso3]
  );

  function toggleCountry(iso3: string) {
    setSelectedIso3((current) => {
      const next = new Set(current);
      if (next.has(iso3)) next.delete(iso3);
      else next.add(iso3);
      return next;
    });
  }

  function selectSearchResults() {
    setSelectedIso3((current) => {
      const next = new Set(current);
      selectableCountries.forEach((country) => next.add(country.iso3));
      return next;
    });
  }

  function downloadTrendCsv() {
    if (config.downloadPolicy !== "allowed" || selectedCountries.length === 0)
      return;
    const header = ["country_iso3", "country_name_ko", ...years.map(String)];
    const rows = selectedCountries.map((country) => [
      country.iso3,
      country.nameKo,
      ...years.map((year) => countrySeries.get(country.iso3)?.get(year) ?? ""),
    ]);
    const csv =
      "\uFEFF" +
      [header, ...rows]
        .map((row) => row.map((cell) => escapeCsvCell(cell)).join(","))
        .join("\n");
    downloadBlob(
      new Blob([csv], { type: "text/csv;charset=utf-8" }),
      `${config.id}-trend-selected-countries.csv`
    );
  }

  if (loading)
    return <div className="compare-v35-state">추세 데이터 로딩 중</div>;

  if (error) {
    return (
      <div className="compare-v35-state compare-v35-state--error">
        <h2>추세 데이터를 불러올 수 없음</h2>
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
      <div className="compare-v35-controls compare-v35-controls--trend">
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
          <span>제공 시점 · {years.length.toLocaleString()}개</span>
          <span>출처 · {config.definition.sourceOrganization}</span>
          <a
            href={config.definition.sourceUrl}
            target="_blank"
            rel="noreferrer"
          >
            원 데이터 확인 ↗
          </a>
        </div>
      </div>

      <div className="compare-v35-split-layout">
        <aside className="compare-v35-selector-card">
          <header>
            <div>
              <h2>국가 선택</h2>
              <p>선택 수 제한 없음</p>
            </div>
            <strong>{selectedCountries.length}개</strong>
          </header>
          <div className="compare-v35-selector-actions">
            <button type="button" onClick={selectSearchResults}>
              검색 결과 전체 선택
            </button>
            <button type="button" onClick={() => setSelectedIso3(new Set())}>
              모두 해제
            </button>
          </div>
          <div className="compare-v35-country-list">
            {selectableCountries.map((country) => (
              <label key={country.iso3}>
                <input
                  type="checkbox"
                  checked={selectedIso3.has(country.iso3)}
                  onChange={() => toggleCountry(country.iso3)}
                />
                <span>
                  <strong>{country.nameKo}</strong>
                  <small>
                    {country.iso3} · {country.region}
                  </small>
                </span>
              </label>
            ))}
          </div>
        </aside>

        <div className="compare-v35-result-stack">
          <section className="compare-v35-table-card">
            <header>
              <div>
                <h2>선택 국가 추세</h2>
                <p>
                  {selectedCountries.length === 0
                    ? "비교할 국가 선택 필요"
                    : selectedCountries.length <= CHART_COUNTRY_LIMIT
                    ? `${selectedCountries.length}개국 선그래프·표 제공`
                    : `${selectedCountries.length}개국 선택 · 가독성을 위해 표 중심 제공`}
                </p>
              </div>
              <button
                type="button"
                className="secondary-button"
                disabled={
                  config.downloadPolicy !== "allowed" ||
                  selectedCountries.length === 0
                }
                onClick={downloadTrendCsv}
              >
                {config.downloadPolicy === "allowed"
                  ? "선택 추세 CSV 다운로드"
                  : "원 데이터 이용조건 확인"}
              </button>
            </header>

            {selectedCountries.length === 0 ? (
              <div className="compare-v35-empty">
                왼쪽에서 비교할 국가를 선택
              </div>
            ) : (
              <>
                {selectedCountries.length <= CHART_COUNTRY_LIMIT &&
                  years.length > 1 && (
                    <TrendChart
                      countries={selectedCountries}
                      years={years}
                      series={countrySeries}
                      config={config}
                    />
                  )}
                <TrendMatrix
                  countries={selectedCountries}
                  years={years}
                  series={countrySeries}
                  config={config}
                  onOpenCountry={onOpenCountry}
                />
              </>
            )}
          </section>
        </div>
      </div>
    </section>
  );
}

function TrendChart({
  countries,
  years,
  series,
  config,
}: {
  countries: Country[];
  years: number[];
  series: Map<string, Map<number, number | null>>;
  config: ReturnType<typeof getIndicatorConfig>;
}) {
  const width = 900;
  const height = 320;
  const padLeft = 58;
  const padRight = 22;
  const padTop = 22;
  const padBottom = 42;
  const allValues = countries.flatMap((country) =>
    years
      .map((year) => series.get(country.iso3)?.get(year) ?? null)
      .filter((value): value is number => value !== null)
  );
  const minValue = allValues.length ? Math.min(...allValues) : 0;
  const maxValue = allValues.length ? Math.max(...allValues) : 1;
  const range = Math.max(maxValue - minValue, 1e-9);
  const innerWidth = width - padLeft - padRight;
  const innerHeight = height - padTop - padBottom;

  const xFor = (index: number) =>
    padLeft +
    (years.length <= 1 ? 0 : (index / (years.length - 1)) * innerWidth);
  const yFor = (value: number) =>
    padTop + (1 - (value - minValue) / range) * innerHeight;

  return (
    <div className="compare-v35-trend-chart-wrap">
      <svg
        className="compare-v35-trend-chart"
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-label={`${config.definition.titleKo} 선택 국가 추세 그래프`}
      >
        {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
          const y = padTop + ratio * innerHeight;
          const value = maxValue - ratio * range;
          return (
            <g key={ratio}>
              <line x1={padLeft} y1={y} x2={width - padRight} y2={y} />
              <text x={padLeft - 8} y={y + 4} textAnchor="end">
                {value.toFixed(config.decimals)}
              </text>
            </g>
          );
        })}

        {years.map((year, index) => (
          <text key={year} x={xFor(index)} y={height - 14} textAnchor="middle">
            {year}
          </text>
        ))}

        {countries.flatMap((country, countryIndex) => {
          const segments: string[][] = [];
          let current: string[] = [];

          years.forEach((year, yearIndex) => {
            const value = series.get(country.iso3)?.get(year) ?? null;
            if (value === null) {
              if (current.length > 0) segments.push(current);
              current = [];
              return;
            }
            current.push(`${xFor(yearIndex)},${yFor(value)}`);
          });
          if (current.length > 0) segments.push(current);

          return segments.map((points, segmentIndex) => (
            <polyline
              key={`${country.iso3}-${segmentIndex}`}
              className={`trend-line trend-line-${countryIndex % 8}`}
              points={points.join(" ")}
            />
          ));
        })}
      </svg>
      <div className="compare-v35-trend-legend">
        {countries.map((country, index) => (
          <span key={country.iso3}>
            <i className={`trend-line-key trend-line-key-${index % 8}`} />
            {country.nameKo}
          </span>
        ))}
      </div>
    </div>
  );
}

function TrendMatrix({
  countries,
  years,
  series,
  config,
  onOpenCountry,
}: {
  countries: Country[];
  years: number[];
  series: Map<string, Map<number, number | null>>;
  config: ReturnType<typeof getIndicatorConfig>;
  onOpenCountry?: (iso3: string) => void;
}) {
  return (
    <div className="compare-v35-table-wrap compare-v35-table-wrap--wide">
      <table className="compare-v35-table compare-v35-trend-table">
        <thead>
          <tr>
            <th>국가</th>
            {years.map((year) => (
              <th key={year}>{formatIndicatorReferencePeriod(config, year)}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {countries.map((country) => (
            <tr key={country.iso3}>
              <td>
                <button
                  type="button"
                  className="compare-v35-country-link"
                  onClick={() => onOpenCountry?.(country.iso3)}
                >
                  <strong>{country.nameKo}</strong>
                  <small>{country.iso3}</small>
                </button>
              </td>
              {years.map((year) => (
                <td key={year}>
                  {formatRawValue(
                    config,
                    series.get(country.iso3)?.get(year) ?? null
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function escapeCsvCell(value: string | number): string {
  let text = String(value);
  if (/^[=+\-@]/.test(text)) text = `'${text}`;
  return `"${text.replace(/"/g, '""')}"`;
}
