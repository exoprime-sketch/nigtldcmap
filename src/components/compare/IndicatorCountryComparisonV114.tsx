import { useEffect, useMemo, useState } from "react";
import type { IndicatorConfig } from "../../data/indicators/registry";
import { PRIORITY_COUNTRIES } from "../../data/priorityCountries";
import { getDataDetailPresentationV117 } from "../../data/cooperation/dataDetailPresentationV117";
import type { Country } from "../../types/country";
import type { IndicatorObservation } from "../../types/indicator";
import type {
  ComparisonModeV114,
  ComparisonViewV114,
} from "../../utils/dataElementComparisonV114";
import { openDownloadHubV118 } from "../../utils/downloadHubNavigationV118";
import "../../styles/data-element-compare-v114.css";

interface Props {
  config: IndicatorConfig;
  observations: IndicatorObservation[];
  countries: Country[];
  currentCountryIso3: string;
  elementId?: string;
  elementName?: string;
  datasetId?: string;
  asOf?: string | null;
  compact?: boolean;
}

interface ValueRow {
  iso3: string;
  country: string;
  year: number;
  value: number;
}

function latestRows(
  observations: IndicatorObservation[],
  countryNameByIso3: Map<string, string>
): ValueRow[] {
  const latest = new Map<string, IndicatorObservation>();
  observations.forEach((item) => {
    if (typeof item.value !== "number" || !Number.isFinite(item.value)) return;
    const current = latest.get(item.iso3);
    if (!current || item.year > current.year) latest.set(item.iso3, item);
  });
  return Array.from(latest.values()).map((item) => ({
    iso3: item.iso3,
    country: countryNameByIso3.get(item.iso3) ?? item.iso3,
    year: item.year,
    value: item.value as number,
  }));
}

function exactYearRows(
  observations: IndicatorObservation[],
  year: number,
  countryNameByIso3: Map<string, string>
): ValueRow[] {
  return observations
    .filter(
      (item) =>
        item.year === year &&
        typeof item.value === "number" &&
        Number.isFinite(item.value)
    )
    .map((item) => ({
      iso3: item.iso3,
      country: countryNameByIso3.get(item.iso3) ?? item.iso3,
      year: item.year,
      value: item.value as number,
    }));
}

function formatValue(config: IndicatorConfig, value: number): string {
  return `${new Intl.NumberFormat("ko-KR", {
    maximumFractionDigits: config.decimals,
  }).format(value)}${config.definition.unit}`;
}

const TREND_COLORS_V114 = ["#1f6f8b", "#2f855a", "#a35d24", "#7356a8"];

function trendPointV114(
  item: { year: number; value: number },
  minYear: number,
  maxYear: number,
  minValue: number,
  maxValue: number
) {
  const yearRange = Math.max(1, maxYear - minYear);
  const valueRange = Math.max(1e-9, maxValue - minValue);
  return {
    x: 54 + ((item.year - minYear) / yearRange) * 410,
    y: 130 - ((item.value - minValue) / valueRange) * 96,
  };
}

function multiSeriesPathV114(
  values: Array<{ year: number; value: number }>,
  minYear: number,
  maxYear: number,
  minValue: number,
  maxValue: number
): string {
  if (values.length < 2) return "";
  return values
    .map((item, index) => {
      const point = trendPointV114(item, minYear, maxYear, minValue, maxValue);
      return `${index === 0 ? "M" : "L"}${point.x.toFixed(1)},${point.y.toFixed(
        1
      )}`;
    })
    .join(" ");
}

export default function IndicatorCountryComparisonV114({
  config,
  observations,
  countries,
  currentCountryIso3,
  elementId = "",
  elementName,
  datasetId,
  asOf = null,
  compact = false,
}: Props) {
  const detailPresentation = elementId
    ? getDataDetailPresentationV117(elementId)
    : undefined;
  const comparisonTitle =
    detailPresentation?.comparisonTitle ??
    elementName ??
    config.definition.titleKo;

  const allYears = useMemo(
    () =>
      Array.from(new Set(observations.map((item) => item.year))).sort(
        (a, b) => b - a
      ),
    [observations]
  );
  const [mode, setMode] = useState<ComparisonModeV114>("latest-by-country");
  const [year, setYear] = useState<number | null>(allYears[0] ?? null);
  const [view, setView] = useState<ComparisonViewV114>("chart");
  const [scope, setScope] = useState<"selected" | "all">("selected");
  const [selectedIso3, setSelectedIso3] = useState<string[]>([
    currentCountryIso3,
  ]);

  useEffect(() => {
    setSelectedIso3((current) => {
      if (current.includes(currentCountryIso3)) return current;
      const next = [currentCountryIso3, ...current].slice(0, 4);
      return Array.from(new Set(next));
    });
  }, [currentCountryIso3]);

  useEffect(() => {
    if (year === null || !allYears.includes(year)) setYear(allYears[0] ?? null);
  }, [allYears, year]);

  const countryNameByIso3 = useMemo(() => {
    const index = new Map(
      countries.map((country) => [country.iso3, country.nameKo])
    );
    PRIORITY_COUNTRIES.forEach((country) => {
      if (!index.has(country.iso3)) index.set(country.iso3, country.nameKo);
    });
    return index;
  }, [countries]);

  const sourceRows = useMemo(() => {
    const rows =
      mode === "same-year" && year !== null
        ? exactYearRows(observations, year, countryNameByIso3)
        : latestRows(observations, countryNameByIso3);
    return rows.sort((a, b) => b.value - a.value);
  }, [mode, year, observations, countryNameByIso3]);

  const visibleRows = useMemo(() => {
    if (scope === "all") return sourceRows;
    const selectedSet = new Set(selectedIso3);
    return sourceRows.filter((row) => selectedSet.has(row.iso3));
  }, [scope, sourceRows, selectedIso3]);

  const selectableCountries = useMemo(() => {
    const available = new Set(
      observations
        .filter((item) => typeof item.value === "number")
        .map((item) => item.iso3)
    );
    return Array.from(available)
      .map((iso3) => ({ iso3, name: countryNameByIso3.get(iso3) ?? iso3 }))
      .sort((a, b) => a.name.localeCompare(b.name, "ko"));
  }, [observations, countryNameByIso3]);

  const maxAbsolute = Math.max(
    1e-9,
    ...visibleRows.map((row) => Math.abs(row.value))
  );

  const selectedSeries = useMemo(
    () =>
      selectedIso3.map((iso3) => ({
        iso3,
        country: countryNameByIso3.get(iso3) ?? iso3,
        values: observations
          .filter(
            (item) =>
              item.iso3 === iso3 &&
              typeof item.value === "number" &&
              Number.isFinite(item.value)
          )
          .map((item) => ({ year: item.year, value: item.value as number }))
          .sort((a, b) => a.year - b.year),
      })),
    [selectedIso3, observations, countryNameByIso3]
  );

  const trendDomain = useMemo(() => {
    const values = selectedSeries.flatMap((series) => series.values);
    if (!values.length) return null;
    return {
      minYear: Math.min(...values.map((item) => item.year)),
      maxYear: Math.max(...values.map((item) => item.year)),
      minValue: Math.min(...values.map((item) => item.value)),
      maxValue: Math.max(...values.map((item) => item.value)),
    };
  }, [selectedSeries]);

  function toggleCountry(iso3: string) {
    setSelectedIso3((current) => {
      if (iso3 === currentCountryIso3) return current;
      if (current.includes(iso3)) {
        return current.filter((item) => item !== iso3);
      }
      if (current.length >= 4) return current;
      return [...current, iso3];
    });
  }

  function openDownloadSettings() {
    openDownloadHubV118({
      countryIso3: currentCountryIso3,
      elementId: elementId ?? null,
      datasetId: datasetId ?? config.datasetId,
    });
  }

  return (
    <article className={`v114-compare ${compact ? "is-compact" : ""}`}>
      <header className="v114-compare__header">
        <div>
          <span className="v114-compare__eyebrow">국가 비교</span>
          <h3>{comparisonTitle}</h3>
          <p>
            동일 연도와 국가별 최신 가용값을 구분해 비교합니다. 최신값
            모드에서는 각 국가의 실제 기준연도를 함께 표시합니다.
          </p>
        </div>
        <div className="v114-compare__download">
          <button
            type="button"
            onClick={openDownloadSettings}
            disabled={visibleRows.length === 0}
          >
            다운로드 설정
          </button>
        </div>
      </header>

      <div className="v114-compare__controls">
        <label>
          <span>비교 기준</span>
          <select
            value={mode}
            onChange={(event) =>
              setMode(event.target.value as ComparisonModeV114)
            }
          >
            <option value="latest-by-country">국가별 최신 가용값</option>
            <option value="same-year">동일 기준연도</option>
          </select>
        </label>
        {mode === "same-year" && (
          <label>
            <span>기준연도</span>
            <select
              value={year ?? ""}
              onChange={(event) => setYear(Number(event.target.value))}
            >
              {allYears.map((item) => (
                <option key={item} value={item}>
                  {item}년
                </option>
              ))}
            </select>
          </label>
        )}
        <div className="v114-compare__segmented" aria-label="비교 국가 범위">
          <button
            type="button"
            className={scope === "selected" ? "active" : ""}
            onClick={() => setScope("selected")}
          >
            선택 국가만
          </button>
          <button
            type="button"
            className={scope === "all" ? "active" : ""}
            onClick={() => setScope("all")}
          >
            전체 국가 보기
          </button>
        </div>
        <div className="v114-compare__segmented" aria-label="비교 주요 정보">
          <button
            type="button"
            className={view === "chart" ? "active" : ""}
            onClick={() => setView("chart")}
          >
            차트
          </button>
          <button
            type="button"
            className={view === "trend" ? "active" : ""}
            onClick={() => {
              setScope("selected");
              setView("trend");
            }}
          >
            추세
          </button>
          <button
            type="button"
            className={view === "table" ? "active" : ""}
            onClick={() => setView("table")}
          >
            표
          </button>
        </div>
      </div>

      <div className="v114-compare__country-picker">
        <div>
          <strong>비교 국가 선택</strong>
          <small>현재 국가 포함 최대 4개 · {selectedIso3.length}/4</small>
        </div>
        <div className="v114-compare__chips">
          {selectableCountries.map((item) => {
            const selected = selectedIso3.includes(item.iso3);
            const disabled =
              item.iso3 === currentCountryIso3 ||
              (!selected && selectedIso3.length >= 4);
            return (
              <button
                key={item.iso3}
                type="button"
                className={selected ? "active" : ""}
                disabled={disabled}
                onClick={() => toggleCountry(item.iso3)}
              >
                {item.name}
              </button>
            );
          })}
        </div>
      </div>

      {view === "chart" && (
        <div className="v114-compare__bars">
          {visibleRows.length === 0 ? (
            <div className="v114-compare__empty">
              선택 조건에서 비교할 수 있는 값이 없습니다.
            </div>
          ) : (
            visibleRows.map((row, index) => (
              <div
                className={`v114-compare__bar ${
                  row.iso3 === currentCountryIso3 ? "is-current" : ""
                }`}
                key={`${row.iso3}-${row.year}`}
              >
                <span className="v114-compare__rank">{index + 1}</span>
                <strong>{row.country}</strong>
                <div className="v114-compare__bar-track">
                  <i
                    style={{
                      width: `${Math.max(
                        2,
                        (Math.abs(row.value) / maxAbsolute) * 100
                      )}%`,
                    }}
                  />
                </div>
                <b>{formatValue(config, row.value)}</b>
                <small>{row.year}년</small>
              </div>
            ))
          )}
        </div>
      )}

      {view === "table" && (
        <div className="v114-compare__table-wrap">
          <table>
            <thead>
              <tr>
                <th>순위</th>
                <th>국가</th>
                <th>값</th>
                <th>실제 기준연도</th>
                <th>출처</th>
              </tr>
            </thead>
            <tbody>
              {visibleRows.map((row, index) => (
                <tr key={`${row.iso3}-${row.year}`}>
                  <td>{index + 1}</td>
                  <td>
                    <strong>{row.country}</strong>
                    <small>{row.iso3}</small>
                  </td>
                  <td>{formatValue(config, row.value)}</td>
                  <td>{row.year}년</td>
                  <td>{config.definition.sourceOrganization}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {visibleRows.length === 0 && (
            <div className="v114-compare__empty">
              선택 조건의 값이 없습니다.
            </div>
          )}
        </div>
      )}

      {view === "trend" && (
        <div className="v114-compare__multi-trend">
          {!trendDomain ||
          selectedSeries.every((series) => series.values.length < 2) ? (
            <div className="v114-compare__empty">
              추세를 표시할 연도별 값이 충분하지 않습니다.
            </div>
          ) : (
            <>
              <div
                className="v114-compare__trend-legend"
                aria-label="시계열 국가 범례"
              >
                {selectedSeries.map((series, index) => (
                  <span key={series.iso3}>
                    <i
                      style={{
                        background:
                          TREND_COLORS_V114[index % TREND_COLORS_V114.length],
                      }}
                    />
                    {series.country}
                    <small>
                      {series.values.length
                        ? ` · ${series.values[series.values.length - 1].year}`
                        : " · 자료 없음"}
                    </small>
                  </span>
                ))}
              </div>
              <svg
                viewBox="0 0 500 170"
                role="img"
                aria-label="선택 국가 시계열 비교"
              >
                <line
                  x1="54"
                  y1="130"
                  x2="464"
                  y2="130"
                  className="v114-compare__axis"
                />
                <line
                  x1="54"
                  y1="34"
                  x2="54"
                  y2="130"
                  className="v114-compare__axis"
                />
                {selectedSeries.map((series, index) => {
                  const color =
                    TREND_COLORS_V114[index % TREND_COLORS_V114.length];
                  const path = multiSeriesPathV114(
                    series.values,
                    trendDomain.minYear,
                    trendDomain.maxYear,
                    trendDomain.minValue,
                    trendDomain.maxValue
                  );
                  return (
                    <g key={series.iso3}>
                      {path && (
                        <path
                          d={path}
                          fill="none"
                          stroke={color}
                          strokeWidth="2.4"
                        />
                      )}
                      {series.values.map((item) => {
                        const point = trendPointV114(
                          item,
                          trendDomain.minYear,
                          trendDomain.maxYear,
                          trendDomain.minValue,
                          trendDomain.maxValue
                        );
                        return (
                          <circle
                            key={`${series.iso3}-${item.year}`}
                            cx={point.x}
                            cy={point.y}
                            r="3"
                            fill={color}
                          >
                            <title>{`${series.country} · ${
                              item.year
                            } · ${formatValue(config, item.value)}`}</title>
                          </circle>
                        );
                      })}
                    </g>
                  );
                })}
                <text x="54" y="151" className="v114-compare__axis-label">
                  {trendDomain.minYear}
                </text>
                <text
                  x="464"
                  y="151"
                  textAnchor="end"
                  className="v114-compare__axis-label"
                >
                  {trendDomain.maxYear}
                </text>
                <text
                  x="48"
                  y="39"
                  textAnchor="end"
                  className="v114-compare__axis-label"
                >
                  {formatValue(config, trendDomain.maxValue)}
                </text>
                <text
                  x="48"
                  y="130"
                  textAnchor="end"
                  className="v114-compare__axis-label"
                >
                  {formatValue(config, trendDomain.minValue)}
                </text>
              </svg>
              <small className="v114-compare__trend-note">
                모든 선택국에 동일한 축을 적용하며 각 점에 실제 연도와 값을
                보존합니다.
              </small>
            </>
          )}
        </div>
      )}
    </article>
  );
}
