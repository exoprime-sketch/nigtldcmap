import { useEffect, useMemo, useState } from "react";
import { loadCountries } from "../../data/countries";
import {
  formatIndicatorReferencePeriod,
  formatRawValue,
  getIndicatorConfig,
  getIndicatorTimeLabel,
  getIndicatorYears,
  loadIndicatorData,
} from "../../data/indicators/registry";
import type { Country } from "../../types/country";
import type {
  IndicatorDataResult,
  IndicatorObservation,
} from "../../types/indicator";
import { openExternalUrl } from "../../utils/browser";
import IndicatorCountryComparisonV114 from "../compare/IndicatorCountryComparisonV114";
import "../../styles/actual-data-v54.css";

interface Props {
  indicatorId: string;
  initialCountryIso3?: string | null;
  elementId?: string;
  elementName?: string;
}

export default function IndicatorDatasetPreviewV33({
  indicatorId,
  initialCountryIso3 = null,
  elementId = "",
  elementName,
}: Props) {
  const config = getIndicatorConfig(indicatorId);
  const [loading, setLoading] = useState(true);
  const [countries, setCountries] = useState<Country[]>([]);
  const [observations, setObservations] = useState<IndicatorObservation[]>([]);
  const [dataResult, setDataResult] = useState<IndicatorDataResult | null>(
    null
  );
  const [warning, setWarning] = useState<string | null>(null);
  const [selectedIso3, setSelectedIso3] = useState(initialCountryIso3 ?? "VNM");
  const [selectedYear, setSelectedYear] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);

      const [countryResult, indicatorResult] = await Promise.all([
        loadCountries(),
        loadIndicatorData(config.id),
      ]);

      if (cancelled) return;

      setCountries(countryResult.countries);
      setObservations(indicatorResult.observations);
      setDataResult(indicatorResult);

      const years = getIndicatorYears(indicatorResult.observations);
      setSelectedYear((current) =>
        current && years.includes(current) ? current : years[0] ?? null
      );

      const requestedIso3 = initialCountryIso3?.toUpperCase() ?? null;
      setSelectedIso3((current) => requestedIso3 ?? current ?? "VNM");

      setWarning(
        [countryResult.warning, indicatorResult.warning]
          .filter(Boolean)
          .join(" ") || null
      );

      setLoading(false);
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, [config.id]);

  const countryIndex = useMemo(
    () => new Map(countries.map((country) => [country.iso3, country])),
    [countries]
  );

  const years = useMemo(() => getIndicatorYears(observations), [observations]);

  const rows = useMemo(() => {
    if (selectedYear === null) return [];

    return observations
      .filter(
        (item) => item.year === selectedYear && typeof item.value === "number"
      )
      .map((item) => ({
        ...item,
        country: countryIndex.get(item.iso3)?.nameKo ?? item.iso3,
      }))
      .sort((a, b) => (b.value ?? -Infinity) - (a.value ?? -Infinity));
  }, [observations, selectedYear, countryIndex]);

  const selectedSeries = useMemo(
    () =>
      observations
        .filter(
          (item) => item.iso3 === selectedIso3 && typeof item.value === "number"
        )
        .map((item) => ({
          year: item.year,
          value: item.value as number,
        }))
        .sort((a, b) => a.year - b.year),
    [observations, selectedIso3]
  );

  const latestSelected =
    selectedSeries.length > 0
      ? selectedSeries[selectedSeries.length - 1]
      : null;

  const selectedYearObservation = useMemo(
    () =>
      selectedYear === null
        ? null
        : observations.find(
            (item) =>
              item.iso3 === selectedIso3 &&
              item.year === selectedYear &&
              typeof item.value === "number"
          ) ?? null,
    [observations, selectedIso3, selectedYear]
  );

  const selectedCountry =
    countryIndex.get(selectedIso3)?.nameKo ?? (selectedIso3 || "선택 국가");

  const trendRows = selectedSeries.slice(-10);
  const trendPath = makeTrendPath(trendRows.map((item) => item.value));

  if (loading) {
    return (
      <div className="v54-loading" role="status">
        <strong>데이터 불러오는 중</strong>
      </div>
    );
  }

  if (!observations.length) {
    return (
      <section className="v54-source-fallback">
        <strong>현재 표시 가능한 값 없음</strong>
        <p>
          최신 값은 원천기관에서 확인할 수 있으며, 값이 연결되면 이 화면에서
          추세와 국가 비교를 함께 제공합니다
        </p>
        <button
          type="button"
          onClick={() => openExternalUrl(config.definition.sourceUrl)}
        >
          원자료 확인 ↗
        </button>
      </section>
    );
  }

  return (
    <div className="v54-indicator-view">
      {warning && <div className="detail-preview-warning">{warning}</div>}

      <section className="v54-indicator-controls">
        <label>
          <span>국가</span>
          <select
            value={selectedIso3}
            onChange={(event) => setSelectedIso3(event.target.value)}
          >
            {Array.from(
              new Set(
                [
                  selectedIso3,
                  ...observations
                    .filter((item) => typeof item.value === "number")
                    .map((item) => item.iso3),
                ].filter(Boolean)
              )
            )
              .map((iso3) => ({
                iso3,
                name: countryIndex.get(iso3)?.nameKo ?? iso3,
              }))
              .sort((a, b) => a.name.localeCompare(b.name, "ko"))
              .map((row) => (
                <option key={row.iso3} value={row.iso3}>
                  {row.name} · {row.iso3}
                </option>
              ))}
          </select>
        </label>

        <label>
          <span>국가 비교 {getIndicatorTimeLabel(config)}</span>
          <select
            value={selectedYear ?? ""}
            onChange={(event) => setSelectedYear(Number(event.target.value))}
          >
            {years.map((year) => (
              <option key={year} value={year}>
                {formatIndicatorReferencePeriod(config, year)}
              </option>
            ))}
          </select>
        </label>
      </section>

      <section className="v117-temporal-integrity" aria-label="자료연도 확인">
        <div>
          <span>국가 비교 기준</span>
          <b>
            {selectedYear !== null
              ? formatIndicatorReferencePeriod(config, selectedYear)
              : "선택 안 함"}
          </b>
        </div>
        <div>
          <span>{selectedCountry} 최신 실제값</span>
          <b>
            {latestSelected
              ? formatIndicatorReferencePeriod(config, latestSelected.year)
              : "자료 없음"}
          </b>
        </div>
        {selectedYear !== null &&
          latestSelected &&
          !selectedYearObservation && (
            <p>
              선택한 비교 기준연도에는 {selectedCountry} 값이 없습니다. 최신
              실제값은{" "}
              {formatIndicatorReferencePeriod(config, latestSelected.year)}
              입니다.
            </p>
          )}
      </section>

      <section className="v54-indicator-kpis">
        <article className="primary">
          <span>{selectedCountry} 최신 실제값</span>
          <strong>
            {formatRawValue(config, latestSelected?.value ?? null)}
          </strong>
          <small>
            {latestSelected
              ? formatIndicatorReferencePeriod(config, latestSelected.year)
              : "자료 없음"}
          </small>
        </article>

        <article>
          <span>단위</span>
          <strong>{config.definition.unit}</strong>
          <small>원자료 정의</small>
        </article>

        <article>
          <span>동일 기준연도 비교 가능 국가</span>
          <strong>{rows.length.toLocaleString("ko-KR")}개</strong>
          <small>선택한 비교 기준연도에 실제 값 보유</small>
        </article>

        <article>
          <span>출처</span>
          <strong>{config.definition.sourceOrganization}</strong>
          <small>{config.definition.license}</small>
        </article>
      </section>

      {selectedSeries.length === 0 && (
        <div className="v55-country-no-value">
          <strong>{selectedCountry}의 현재 연결값 없음</strong>
          <span>
            다른 국가 값으로 자동 대체하지 않습니다 · 국가 비교와 원자료에서
            자료 제공 여부를 확인할 수 있습니다
          </span>
        </div>
      )}

      <section className="v54-indicator-grid">
        <article className="v54-panel">
          <header>
            <div>
              <h3>{selectedCountry} 최근 추세</h3>
              <p>최근 가용 10개 연도 · 실제 원값</p>
            </div>
          </header>

          {trendRows.length >= 2 ? (
            <>
              <svg
                className="v54-trend-chart"
                viewBox="0 0 520 170"
                role="img"
                aria-label={`${selectedCountry} ${config.definition.titleKo} 최근 추세`}
              >
                <path d={trendPath} />
              </svg>
              <div className="v54-trend-years">
                <span>{trendRows[0]?.year ?? ""}</span>
                <span>
                  {trendRows[Math.floor((trendRows.length - 1) / 2)]?.year ??
                    ""}
                </span>
                <span>{trendRows[trendRows.length - 1]?.year ?? ""}</span>
              </div>
              <div className="v54-trend-values">
                {trendRows.slice(-5).map((item) => (
                  <div key={item.year}>
                    <span>{item.year}</span>
                    <b>{formatRawValue(config, item.value)}</b>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="v54-no-series">
              추세를 표시할 수 있는 연도별 값이 충분하지 않습니다
            </div>
          )}
        </article>

        <IndicatorCountryComparisonV114
          config={config}
          observations={observations}
          countries={countries}
          currentCountryIso3={selectedIso3}
          datasetId={config.datasetId}
          elementId={elementId}
          elementName={elementName ?? config.definition.titleKo}
          asOf={dataResult?.lastUpdated ?? null}
          compact
        />
      </section>

      <section className="v54-indicator-note">
        <div>
          <b>해석 시 유의사항</b>
          <span>{config.definition.limitations}</span>
        </div>
        <button
          type="button"
          onClick={() => openExternalUrl(config.definition.sourceUrl)}
        >
          원자료 확인 ↗
        </button>
      </section>
    </div>
  );
}

function makeTrendPath(values: number[]): string {
  if (values.length < 2) return "";

  const width = 520;
  const height = 170;
  const padding = 12;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = Math.max(max - min, 1e-9);

  return values
    .map((value, index) => {
      const x =
        padding +
        (index / Math.max(1, values.length - 1)) * (width - padding * 2);
      const y =
        height - padding - ((value - min) / range) * (height - padding * 2);

      return `${index === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
}
