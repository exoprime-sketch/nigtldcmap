import { useEffect, useMemo, useState } from "react";
import {
  loadCatalogForCountrySelectionV122,
  loadCountryElementBundleV122,
  publicCountryDataErrorMessageV122,
} from "../data/countries/countryDataFacadeV122";
import {
  getCountryDataProviderV122,
  listCountryDataProvidersV122,
} from "../data/countries/countryDataProviderRegistryV122";
import type { CountryCatalogItemV122 } from "../data/countries/countryDataTypesV122";
import type {
  VietnamEntityV121,
  VietnamIndicatorMetaV121,
  VietnamObservationV121,
} from "../data/vietnam/vietnamTypesV121";
import type { CompareTab, CompareViewState } from "../types/compare";
import { DEFAULT_COMPARE_VIEW_STATE } from "../types/compare";
import {
  entityDisplayNameV121,
  formatValueV121,
  latestObservationV121,
} from "../utils/vietnamActualV121";
import "../styles/country-data-platform-v122.css";

interface CountryComparePageProps {
  initialCountryIso3?: string | null;
  initialState?: CompareViewState;
  onStateChange?: (state: CompareViewState) => void;
  onOpenCountry?: (iso3: string) => void;
}

type Bundle = Awaited<ReturnType<typeof loadCountryElementBundleV122>>;

const TABS: Array<{ id: CompareTab; label: string; description: string }> = [
  { id: "trend", label: "연도별 변화", description: "동일 지표의 연도별 변화" },
  {
    id: "indicator",
    label: "지표·구성",
    description: "단위가 같은 값을 선택해 확인",
  },
  { id: "ndc", label: "정책·기술수요", description: "정책·기술수요 자료" },
  { id: "gcf", label: "사업·재원", description: "사업·재원 목록과 상태" },
];

function elementMatchesTab(element: CountryCatalogItemV122, tab: CompareTab) {
  if (tab === "ndc") return element.categoryCode === "C";
  if (tab === "gcf") return element.categoryCode === "D";
  return element.observationCount > 0;
}

function suggestedElement(tab: CompareTab, elements: CountryCatalogItemV122[]) {
  const preferred =
    tab === "ndc"
      ? "C-005"
      : tab === "gcf"
      ? "D-018"
      : tab === "trend"
      ? "A-003"
      : "A-018";
  return (
    elements.find((item) => item.elementId === preferred) || elements[0] || null
  );
}

function numericSeries(
  rows: VietnamObservationV121[],
  indicatorId: string
): Array<{ year: number; value: number; row: VietnamObservationV121 }> {
  return rows
    .filter(
      (row): row is VietnamObservationV121 & { year: number; value: number } =>
        row.indicatorId === indicatorId &&
        typeof row.year === "number" &&
        typeof row.value === "number"
    )
    .map((row) => ({ year: row.year, value: row.value, row }))
    .sort((a, b) => a.year - b.year);
}

function LineChart({
  series,
  unit,
}: {
  series: Array<{ year: number; value: number }>;
  unit?: string | null;
}) {
  if (series.length < 2) {
    return (
      <div className="cdp-empty">
        시계열 차트를 만들 수 있는 숫자값이 두 개 이상 없습니다
      </div>
    );
  }
  const width = 760;
  const height = 280;
  const pad = { left: 58, right: 18, top: 20, bottom: 36 };
  const minValue = Math.min(...series.map((item) => item.value));
  const maxValue = Math.max(...series.map((item) => item.value));
  const valueRange = maxValue === minValue ? 1 : maxValue - minValue;
  const minYear = Math.min(...series.map((item) => item.year));
  const maxYear = Math.max(...series.map((item) => item.year));
  const yearRange = maxYear === minYear ? 1 : maxYear - minYear;
  const x = (year: number) =>
    pad.left + ((year - minYear) / yearRange) * (width - pad.left - pad.right);
  const y = (value: number) =>
    pad.top +
    (1 - (value - minValue) / valueRange) * (height - pad.top - pad.bottom);
  const points = series
    .map((item) => `${x(item.year)},${y(item.value)}`)
    .join(" ");
  return (
    <div className="cdp-chart-wrap" aria-label="선택 지표 시계열 차트">
      <svg viewBox={`0 0 ${width} ${height}`} role="img" className="cdp-chart">
        {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
          const value = maxValue - valueRange * ratio;
          const yy = pad.top + ratio * (height - pad.top - pad.bottom);
          return (
            <g key={ratio}>
              <line
                x1={pad.left}
                x2={width - pad.right}
                y1={yy}
                y2={yy}
                className="cdp-chart__grid"
              />
              <text
                x={pad.left - 8}
                y={yy + 4}
                textAnchor="end"
                className="cdp-chart__label"
              >
                {formatValueV121(value)}
              </text>
            </g>
          );
        })}
        <polyline points={points} className="cdp-chart__line" />
        {series.map((item) => (
          <circle
            key={`${item.year}-${item.value}`}
            cx={x(item.year)}
            cy={y(item.value)}
            r="3.5"
            className="cdp-chart__point"
          >
            <title>
              {item.year}: {formatValueV121(item.value)} {unit || ""}
            </title>
          </circle>
        ))}
        <text x={pad.left} y={height - 10} className="cdp-chart__label">
          {minYear}
        </text>
        <text
          x={width - pad.right}
          y={height - 10}
          textAnchor="end"
          className="cdp-chart__label"
        >
          {maxYear}
        </text>
      </svg>
    </div>
  );
}

export default function CountryComparePage({
  initialCountryIso3 = null,
  initialState = DEFAULT_COMPARE_VIEW_STATE,
  onStateChange,
  onOpenCountry,
}: CountryComparePageProps) {
  const providers = useMemo(() => listCountryDataProvidersV122(), []);
  const initialProvider =
    getCountryDataProviderV122(initialCountryIso3) || providers[0] || null;
  const [countryIso3, setCountryIso3] = useState(
    initialProvider?.countryIso3 || ""
  );
  const [activeTab, setActiveTab] = useState<CompareTab>(initialState.tab);
  const [catalog, setCatalog] = useState<CountryCatalogItemV122[]>([]);
  const [elementId, setElementId] = useState("");
  const [bundle, setBundle] = useState<Bundle | null>(null);
  const [indicatorId, setIndicatorId] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const provider = getCountryDataProviderV122(countryIso3);

  useEffect(() => {
    const requested = getCountryDataProviderV122(initialCountryIso3);
    if (requested) setCountryIso3(requested.countryIso3);
  }, [initialCountryIso3]);

  useEffect(() => setActiveTab(initialState.tab), [initialState.tab]);

  useEffect(() => {
    if (!provider) {
      setCatalog([]);
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError("");
    void loadCatalogForCountrySelectionV122(provider.countryIso3)
      .then((rows) => {
        if (cancelled) return;
        setCatalog(rows);
        const candidates = rows.filter((row) =>
          elementMatchesTab(row, activeTab)
        );
        const next = suggestedElement(activeTab, candidates);
        setElementId((current) =>
          candidates.some((row) => row.elementId === current)
            ? current
            : next?.elementId || ""
        );
      })
      .catch((reason: unknown) => {
        if (cancelled) return;
        console.error("Comparison catalog load failed", reason);
        setError(publicCountryDataErrorMessageV122(reason));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [activeTab, provider?.countryIso3]);

  useEffect(() => {
    if (!elementId || !provider) {
      setBundle(null);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError("");
    void loadCountryElementBundleV122(provider.countryIso3, elementId)
      .then((next) => {
        if (cancelled) return;
        setBundle(next);
        const firstWithData = next.meta.indicators.find((meta) =>
          next.observations.records.some(
            (row) => row.indicatorId === meta.indicatorId && row.value !== null
          )
        );
        setIndicatorId((current) =>
          next.meta.indicators.some((meta) => meta.indicatorId === current)
            ? current
            : firstWithData?.indicatorId ||
              next.meta.indicators[0]?.indicatorId ||
              ""
        );
      })
      .catch((reason: unknown) => {
        if (cancelled) return;
        console.error("Comparison data load failed", reason);
        setError(publicCountryDataErrorMessageV122(reason));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [elementId, provider?.countryIso3]);

  const candidates = useMemo(
    () => catalog.filter((row) => elementMatchesTab(row, activeTab)),
    [activeTab, catalog]
  );
  const selectedCatalog =
    catalog.find((item) => item.elementId === elementId) || null;
  const selectedMeta =
    bundle?.meta.indicators.find((meta) => meta.indicatorId === indicatorId) ||
    null;
  const selectedSeries = bundle
    ? numericSeries(bundle.observations.records, indicatorId)
    : [];
  const latest = bundle
    ? latestObservationV121(bundle.observations.records, indicatorId)
    : null;
  const latestByIndicator = useMemo(() => {
    if (!bundle) return [];
    return bundle.meta.indicators
      .map((meta) => ({
        meta,
        row: latestObservationV121(
          bundle.observations.records,
          meta.indicatorId
        ),
      }))
      .filter(
        (
          item
        ): item is {
          meta: VietnamIndicatorMetaV121;
          row: VietnamObservationV121;
        } => Boolean(item.row)
      )
      .slice(0, 24);
  }, [bundle]);
  const entities = bundle?.entities.records || [];

  function changeTab(tab: CompareTab) {
    setActiveTab(tab);
    setBundle(null);
    setIndicatorId("");
    onStateChange?.({ ...initialState, tab });
  }

  if (!provider) {
    return (
      <div className="page-shell cdp-page">
        <section className="cdp-hero">
          <h1>데이터 비교</h1>
        </section>
        <div className="cdp-panel cdp-empty">
          현재 비교할 수 있는 데이터가 없습니다
        </div>
      </div>
    );
  }

  return (
    <div className="page-shell cdp-page">
      <header className="cdp-detail-hero">
        <div>
          <h1>데이터 비교</h1>
          <p>
            {provider.countryNameKo}의 연도별 변화와 지표·사업 구성을 살펴볼 수
            있습니다
          </p>
        </div>
        <div className="cdp-detail-hero__actions">
          {providers.length > 1 && (
            <label className="cdp-field cdp-field--narrow">
              <span className="cdp-field__label">국가</span>
              <select
                className="cdp-select"
                value={countryIso3}
                onChange={(event) => setCountryIso3(event.target.value)}
              >
                {providers.map((item) => (
                  <option key={item.countryIso3} value={item.countryIso3}>
                    {item.countryNameKo}
                  </option>
                ))}
              </select>
            </label>
          )}
          {onOpenCountry && (
            <button
              type="button"
              className="cdp-button cdp-button--secondary"
              onClick={() => onOpenCountry(provider.countryIso3)}
            >
              국가정보 보기
            </button>
          )}
        </div>
      </header>

      {error && <div className="cdp-alert cdp-alert--error">{error}</div>}

      <nav className="cdp-compare-tabs" aria-label="데이터 분석 유형">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            className={activeTab === tab.id ? "is-active" : ""}
            onClick={() => changeTab(tab.id)}
          >
            <strong>{tab.label}</strong>
            <small>{tab.description}</small>
          </button>
        ))}
      </nav>

      <section className="cdp-panel cdp-filter-panel">
        <div className="cdp-filter-grid cdp-filter-grid--detail">
          <label className="cdp-field">
            <span className="cdp-field__label">데이터</span>
            <select
              className="cdp-select"
              value={elementId}
              onChange={(event) => setElementId(event.target.value)}
            >
              {candidates.map((element) => (
                <option key={element.elementId} value={element.elementId}>
                  {element.publicTitle}
                </option>
              ))}
            </select>
          </label>
          <label className="cdp-field">
            <span className="cdp-field__label">항목</span>
            <select
              className="cdp-select"
              value={indicatorId}
              onChange={(event) => setIndicatorId(event.target.value)}
              disabled={!bundle?.meta.indicators.length}
            >
              {(bundle?.meta.indicators || []).map((meta) => (
                <option key={meta.indicatorId} value={meta.indicatorId}>
                  {meta.labelKo}
                </option>
              ))}
            </select>
          </label>
        </div>
      </section>

      {loading ? (
        <div className="cdp-panel cdp-empty">자료를 불러오는 중입니다</div>
      ) : !bundle ? (
        <div className="cdp-panel cdp-empty">
          선택한 유형에 제공 가능한 자료가 없습니다
        </div>
      ) : (
        <>
          <section className="cdp-summary-grid">
            <article className="cdp-summary-card">
              <span>데이터</span>
              <strong>{selectedCatalog?.publicTitle || "선택 데이터"}</strong>
            </article>
            <article className="cdp-summary-card">
              <span>최신 값</span>
              <strong>
                {latest
                  ? `${formatValueV121(latest.value)} ${latest.unit || ""}`
                  : "자료 없음"}
              </strong>
            </article>
            <article className="cdp-summary-card">
              <span>자료연도</span>
              <strong>
                {latest?.year ||
                  latest?.period ||
                  bundle.meta.element.latestYear ||
                  "미표기"}
              </strong>
            </article>
            <article className="cdp-summary-card">
              <span>자료 제공기관</span>
              <strong>
                {selectedMeta?.sourceOrg ||
                  bundle.meta.element.sourceOrganizations[0] ||
                  "미표기"}
              </strong>
            </article>
          </section>

          {(activeTab === "trend" || activeTab === "indicator") && (
            <section className="cdp-panel cdp-detail-panel">
              <h2>{selectedMeta?.labelKo || "선택 항목"}</h2>
              <LineChart series={selectedSeries} unit={selectedMeta?.unit} />
              <div className="cdp-table-wrap">
                <table className="cdp-table">
                  <thead>
                    <tr>
                      <th>연도·기간</th>
                      <th>값</th>
                      <th>단위</th>
                      <th>결측사유</th>
                      <th>출처</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...selectedSeries]
                      .reverse()
                      .slice(0, 50)
                      .map(({ row }) => (
                        <tr key={row.recordId}>
                          <td>{row.year || row.period || "미표기"}</td>
                          <td>{formatValueV121(row.value)}</td>
                          <td>{row.unit || selectedMeta?.unit || "-"}</td>
                          <td>{row.missingReasonCode || "-"}</td>
                          <td>{row.provenance.sourceOrg || "-"}</td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {activeTab === "indicator" && (
            <section className="cdp-panel cdp-detail-panel">
              <h2>항목별 최신 값</h2>
              <p className="cdp-muted">
                서로 다른 단위의 값을 합산하거나 하나의 순위로 환산하지 않습니다
              </p>
              <div className="cdp-latest-grid">
                {latestByIndicator.map(({ meta, row }) => (
                  <article key={meta.indicatorId}>
                    <strong>{meta.labelKo}</strong>
                    <span>
                      {formatValueV121(row.value)} {row.unit || meta.unit || ""}
                    </span>
                    <small>
                      {row.year ||
                        row.period ||
                        meta.referenceYear ||
                        "연도 미표기"}{" "}
                      · {meta.sourceOrg}
                    </small>
                  </article>
                ))}
              </div>
            </section>
          )}

          {(activeTab === "ndc" || activeTab === "gcf") && (
            <section className="cdp-panel cdp-detail-panel">
              <h2>
                {bundle.meta.element.detailTemplate === "policy"
                  ? "정책·문서"
                  : "사업·재원·기술수요"}
              </h2>
              {entities.length ? (
                <div className="cdp-entity-preview-grid">
                  {entities.slice(0, 24).map((entity: VietnamEntityV121) => (
                    <article key={entity.recordId}>
                      <strong>{entityDisplayNameV121(entity)}</strong>
                      <small>
                        {entity.provenance.referenceYear || "연도 미표기"} ·{" "}
                        {entity.provenance.sourceOrg || "출처 미표기"}
                      </small>
                    </article>
                  ))}
                </div>
              ) : (
                <div className="cdp-empty">표시할 목록 자료가 없습니다</div>
              )}
            </section>
          )}
        </>
      )}
    </div>
  );
}
