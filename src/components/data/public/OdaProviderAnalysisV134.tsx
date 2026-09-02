import { useMemo } from "react";
import InteractiveTimeSeriesChartV127 from "../../charts/InteractiveTimeSeriesChartV127";
import type { SemanticObservationV125 } from "../../../data/visualization/semanticTypesV125";
import type { DataFinderSelectorStateV125 } from "../../../types/dataFinderV125";
import type { TimeSeriesV127 } from "../../../types/chartInteractionV127";
import { publicTextV126 } from "../../../data/visualization/publicFieldPolicyV126";
import {
  PublicTermHelpV134,
  PublicTermTextV134,
} from "../../help/PublicTermV134";
import "./context-specialized-analysis-v134.css";

interface Props {
  rows: SemanticObservationV125[];
  selectorState: DataFinderSelectorStateV125;
  onSelectorStateChange: (state: DataFinderSelectorStateV125) => void;
  primaryTitle?: string;
  secondaryTitle?: string;
}

type NumericOdaRowV134 = SemanticObservationV125 & { value: number; year: number };

type ProviderRankingV134 = {
  key: string;
  label: string;
  value: number;
  share: number | null;
  providerCount?: number;
};

const TOTAL_INDICATOR_V134 = "D-011_oda_disbursement_official_donors";
const INDIVIDUAL_DETAIL_V134 = "대베트남 ODA 총지출액(개별)";
const SUB_PROVIDER_DETAIL_V134 = "대베트남 ODA 총지출액(개별(하위기구))";
const PROVIDER_DIMENSION_V134 = "odaProvider";
const PROVIDER_LIMIT_V134 = 10;

const PROVIDER_NAMES_KO_V134: Readonly<Record<string, string>> = Object.freeze({
  Australia: "호주",
  Canada: "캐나다",
  France: "프랑스",
  Germany: "독일",
  Japan: "일본",
  Korea: "대한민국",
  Switzerland: "스위스",
  "United Kingdom": "영국",
  "United States": "미국",
  "EU Institutions": "유럽연합 기관",
  "Regional Development Banks": "지역개발은행",
  "Other multilateral organisations": "기타 다자기구",
  "United Nations": "유엔",
  "World Bank Group": "세계은행그룹",
});

const currencyNumberV134 = new Intl.NumberFormat("ko-KR", {
  maximumFractionDigits: 0,
});
const percentNumberV134 = new Intl.NumberFormat("ko-KR", {
  maximumFractionDigits: 1,
});

function isNumericOdaRowV134(row: SemanticObservationV125): row is NumericOdaRowV134 {
  return (
    typeof row.value === "number" &&
    Number.isFinite(row.value) &&
    typeof row.year === "number"
  );
}

function providerNameV134(row: SemanticObservationV125): string {
  const sourceName =
    row.dimensionLabels.category || row.dimensions.category || "공여자";
  return PROVIDER_NAMES_KO_V134[sourceName] || sourceName;
}

function compactUsdV134(value: number): string {
  if (Math.abs(value) >= 1_000_000_000) {
    return `USD ${new Intl.NumberFormat("ko-KR", { maximumFractionDigits: 2 }).format(
      value / 1_000_000_000
    )}B`;
  }
  if (Math.abs(value) >= 1_000_000) {
    return `USD ${new Intl.NumberFormat("ko-KR", { maximumFractionDigits: 1 }).format(
      value / 1_000_000
    )}M`;
  }
  return `USD ${currencyNumberV134.format(value)}`;
}

function exactUsdV134(value: number): string {
  return `USD ${currencyNumberV134.format(value)}`;
}

export default function OdaProviderAnalysisV134({
  rows,
  selectorState,
  onSelectorStateChange,
  primaryTitle = "연도별 총 ODA",
  secondaryTitle = "최신연도 공여자별 ODA",
}: Props) {
  const numericRows = useMemo(() => rows.filter(isNumericOdaRowV134), [rows]);
  const totalRows = useMemo(
    () =>
      numericRows
        .filter((row) => row.indicatorId === TOTAL_INDICATOR_V134)
        .sort((left, right) => left.year - right.year),
    [numericRows]
  );
  const individualRows = useMemo(
    () =>
      numericRows.filter(
        (row) =>
          (row.dimensions.detail || row.dimensionLabels.detail) ===
          INDIVIDUAL_DETAIL_V134
      ),
    [numericRows]
  );
  const subProviderRows = useMemo(
    () =>
      numericRows.filter(
        (row) =>
          (row.dimensions.detail || row.dimensionLabels.detail) ===
          SUB_PROVIDER_DETAIL_V134
      ),
    [numericRows]
  );
  const latestTotal = totalRows[totalRows.length - 1] || null;
  const previousTotal = totalRows[totalRows.length - 2] || null;
  const latestYear = latestTotal?.year ?? null;
  const latestProviderRows = individualRows
    .filter((row) => row.year === latestYear)
    .sort((left, right) => right.value - left.value);
  const topProviders = latestProviderRows.slice(0, PROVIDER_LIMIT_V134);
  const remainingProviders = latestProviderRows.slice(PROVIDER_LIMIT_V134);
  const ranking: ProviderRankingV134[] = topProviders.map((row) => ({
    key: row.indicatorId,
    label: providerNameV134(row),
    value: row.value,
    share:
      latestTotal && latestTotal.value > 0 ? (row.value / latestTotal.value) * 100 : null,
  }));
  if (remainingProviders.length > 0) {
    const remainder = remainingProviders.reduce((sum, row) => sum + row.value, 0);
    ranking.push({
      key: "remaining-providers",
      label: "기타(상위 10개 제외)",
      value: remainder,
      share:
        latestTotal && latestTotal.value > 0 ? (remainder / latestTotal.value) * 100 : null,
      providerCount: remainingProviders.length,
    });
  }
  const rankingMaximum = Math.max(...ranking.map((item) => item.value), 1);
  const providerOptions = useMemo(() => {
    const latestByIndicator = new Map<string, NumericOdaRowV134>();
    individualRows.forEach((row) => {
      const current = latestByIndicator.get(row.indicatorId);
      if (!current || current.year < row.year) latestByIndicator.set(row.indicatorId, row);
    });
    return Array.from(latestByIndicator.values())
      .sort((left, right) => right.value - left.value)
      .map((row) => ({
        key: row.dimensions.category || row.dimensionLabels.category || providerNameV134(row),
        indicatorId: row.indicatorId,
        label: providerNameV134(row),
      }));
  }, [individualRows]);
  const requestedProvider = selectorState.dimensions[PROVIDER_DIMENSION_V134];
  const selectedProvider =
    providerOptions.find((item) => item.key === requestedProvider) ||
    providerOptions[0] ||
    null;
  const selectedProviderRows = selectedProvider
    ? individualRows
        .filter((row) => row.indicatorId === selectedProvider.indicatorId)
        .sort((left, right) => left.year - right.year)
    : [];
  const totalSeries: TimeSeriesV127[] = totalRows.length
    ? [
        {
          id: "oda-total",
          label: "총 ODA",
          unit: "USD (2024년 불변가격)",
          color: "#126b62",
          marker: "circle",
          linePattern: "solid",
          points: totalRows.map((row) => ({
            id: `oda-total-${row.year}`,
            x: row.year,
            xLabel: `${row.year}년`,
            value: row.value,
          })),
        },
      ]
    : [];
  const providerSeries: TimeSeriesV127[] = selectedProviderRows.length
    ? [
        {
          id: "oda-provider",
          label: selectedProvider?.label || "선택 공여자",
          unit: "USD (2024년 불변가격)",
          color: "#3454a5",
          marker: "diamond",
          linePattern: "dash",
          points: selectedProviderRows.map((row) => ({
            id: `oda-provider-${row.year}`,
            x: row.year,
            xLabel: `${row.year}년`,
            value: row.value,
          })),
        },
      ]
    : [];
  const yearTotals = new Map(totalRows.map((row) => [row.year, row.value]));
  const tableRows = [...numericRows].sort(
    (left, right) => right.year - left.year || right.value - left.value
  );
  const yearOverYear =
    latestTotal && previousTotal && previousTotal.value !== 0
      ? ((latestTotal.value - previousTotal.value) / previousTotal.value) * 100
      : null;

  if (!latestTotal) {
    return <div className="pav126-empty" role="status">공개된 ODA 관측값이 없습니다.</div>;
  }

  return (
    <div
      className="osa134"
      data-provider-ranking="true"
      data-provider-trend="true"
      data-populated-row-count={numericRows.length}
      data-sub-provider-row-count={subProviderRows.length}
      data-raw-category-code-visible="false"
      data-testid="d011-specialized-analysis"
    >
      <section className="osa134__kpis" aria-label="베트남 ODA 핵심현황">
        <article>
          <span><PublicTermTextV134 text="최신 총 ODA" /></span>
          <strong title={exactUsdV134(latestTotal.value)}><PublicTermTextV134 text={compactUsdV134(latestTotal.value)} /></strong>
          <small>2024년 불변가격</small>
        </article>
        <article>
          <span>전년 대비</span>
          <strong>{yearOverYear === null ? "계산 불가" : `${yearOverYear > 0 ? "+" : ""}${percentNumberV134.format(yearOverYear)}%`}</strong>
          <small>{previousTotal ? `${previousTotal.year}년` : "이전 연도"}과 {latestTotal.year}년 비교</small>
        </article>
        <article>
          <span>기준연도</span>
          <strong>{latestTotal.year}년</strong>
          <small>{totalRows[0]?.year}–{latestTotal.year}년 공개값</small>
        </article>
        <article>
          <span>자료 제공기관</span>
          <strong><PublicTermTextV134 firstOccurrenceOnly={false} text="OECD CRS" /></strong>
          <small>지출액 기준</small>
        </article>
      </section>

      <section className="osa134__panel" aria-labelledby="osa134-total-title">
        <header className="osa134__heading">
          <div>
            <span>주 분석</span>
            <h3 id="osa134-total-title"><PublicTermTextV134 text={primaryTitle} /></h3>
            <p>공식 공여자 총계를 연도별로 비교합니다.</p>
          </div>
        </header>
        <InteractiveTimeSeriesChartV127
          ariaLabel="베트남 연도별 총 ODA 지출액"
          formatValue={compactUsdV134}
          series={totalSeries}
          showDelta
          testId="d011-total-trend"
          title="베트남 총 공적개발원조 추이"
          unit="USD (2024년 불변가격)"
          xAxisTitle="연도"
          yAxisTitle="공적개발원조 지출액"
          zoom={{ enabled: false }}
        />
      </section>

      <section className="osa134__panel" aria-labelledby="osa134-ranking-title">
        <header className="osa134__heading">
          <div>
            <span>공여자 비교</span>
            <h3 id="osa134-ranking-title"><PublicTermTextV134 text={secondaryTitle} /></h3>
            <p>{latestTotal.year}년 개별 공여자를 같은 기준의 ODA 지출액으로 비교합니다. 총계·소계는 순위에 중복 포함하지 않습니다.</p>
          </div>
        </header>
        <div className="osa134__ranking" data-testid="d011-provider-ranking" role="list" aria-label={`${latestTotal.year}년 상위 공여자`}>
          {ranking.map((item, index) => (
            <div key={item.key} role="listitem">
              <span>{index < PROVIDER_LIMIT_V134 ? `${index + 1}. ` : ""}{item.label}</span>
              <i aria-hidden="true"><b style={{ width: `${(item.value / rankingMaximum) * 100}%` }} /></i>
              <strong>{compactUsdV134(item.value)}</strong>
              <small><PublicTermTextV134 text={`${item.share === null ? "비중 계산 불가" : `총 ODA의 ${percentNumberV134.format(item.share)}%`}${item.providerCount ? ` · ${item.providerCount}개 공여자` : ""}`} /></small>
            </div>
          ))}
        </div>
      </section>

      <section className="osa134__panel" aria-labelledby="osa134-provider-title">
        <header className="osa134__heading osa134__heading--selector">
          <div>
            <span>보조 분석</span>
            <h3 id="osa134-provider-title">공여자별 연도 추이</h3>
          </div>
          <label>
            공여자
            <select
              data-testid="d011-provider-selector"
              value={selectedProvider?.key || ""}
              onChange={(event) =>
                onSelectorStateChange({
                  ...selectorState,
                  dimensions: {
                    ...selectorState.dimensions,
                    [PROVIDER_DIMENSION_V134]: event.target.value,
                  },
                })
              }
            >
              {providerOptions.map((provider) => <option key={provider.key} value={provider.key}>{provider.label}</option>)}
            </select>
          </label>
          <PublicTermHelpV134 text={selectedProvider?.label || ""} />
        </header>
        {providerSeries.length ? (
          <InteractiveTimeSeriesChartV127
            ariaLabel={`${selectedProvider?.label || "선택 공여자"} 연도별 ODA 지출액`}
            formatValue={compactUsdV134}
            series={providerSeries}
            showDelta
            testId="d011-provider-trend"
            title={`${selectedProvider?.label || "공여자"} ODA 추이`}
            unit="USD (2024년 불변가격)"
            xAxisTitle="연도"
            yAxisTitle="공적개발원조 지출액"
            zoom={{ enabled: false }}
          />
        ) : <div className="pav126-empty" role="status">선택한 공여자의 공개값이 없습니다.</div>}
      </section>

      <details className="osa134__table" data-testid="d011-provider-table">
        <summary>공여자별 공개값 보기 · 값 있음 {tableRows.length.toLocaleString("ko-KR")}행 · 개별 공여자와 하위기구를 구분해 표시</summary>
        <PublicTermHelpV134 text="ODA · USD · OECD · CRS" />
        <div className="cdp-table-wrap">
          <table className="cdp-table">
            <thead><tr><th>연도</th><th>공여자</th><th>기관 구분</th><th>ODA 지출액</th><th>연도 총 ODA 대비</th><th>자료 제공기관</th></tr></thead>
            <tbody>
              {tableRows.map((row) => {
                const total = yearTotals.get(row.year);
                const share = total && total > 0 ? (row.value / total) * 100 : null;
                const detail = row.dimensions.detail || row.dimensionLabels.detail || "";
                const kind = detail === SUB_PROVIDER_DETAIL_V134
                  ? "하위기구"
                  : detail === INDIVIDUAL_DETAIL_V134
                  ? "개별 공여자"
                  : detail.includes("소계")
                  ? "소계"
                  : "총계";
                return <tr key={row.recordId}><td>{row.year}</td><td>{publicTextV126(providerNameV134(row)) || "공여자"}</td><td>{kind}</td><td>{exactUsdV134(row.value)}</td><td>{share === null ? "" : `${percentNumberV134.format(share)}%`}</td><td>OECD CRS</td></tr>;
              })}
            </tbody>
          </table>
        </div>
      </details>
    </div>
  );
}
