import { useEffect, useMemo } from "react";
import type { SemanticObservationV125 } from "../../../data/visualization/semanticTypesV125";
import {
  publicCpiaLabelV126,
} from "../../../data/visualization/publicCopyRegistryV126";
import {
  publicMissingReasonLabelV126,
  publicSourceUrlV126,
} from "../../../data/visualization/publicFieldPolicyV126";
import {
  formatPublicDeltaV126,
  formatPublicNumberV126,
} from "../../../data/visualization/publicNumberFormatV126";
import type { DataFinderSelectorStateV125 } from "../../../types/dataFinderV125";

interface Props {
  rows: SemanticObservationV125[];
  selectorState: DataFinderSelectorStateV125;
  onSelectorStateChange: (state: DataFinderSelectorStateV125) => void;
  showRawTable?: boolean;
}

type NumericCpiaRowV126 = SemanticObservationV125 & {
  year: number;
  value: number;
};

type CpiaSeriesV126 = {
  indicatorId: string;
  label: string;
  color: string;
  dash: string;
};

const CPIA_CORE_SERIES_V126: CpiaSeriesV126[] = [
  { indicatorId: "A-002_cpia_irai_overall", label: "IRAI 종합", color: "#0f766e", dash: "" },
  { indicatorId: "A-002_cpia_economic_management", label: "경제관리", color: "#2563eb", dash: "10 0" },
  { indicatorId: "A-002_cpia_structural_policies", label: "구조정책", color: "#c2410c", dash: "10 5" },
  { indicatorId: "A-002_cpia_social_inclusion", label: "사회적 포용", color: "#7c3aed", dash: "3 4" },
  { indicatorId: "A-002_cpia_public_sector", label: "공공부문 관리", color: "#be123c", dash: "13 4 3 4" },
];

const CPIA_CLUSTERS_V126 = [
  {
    key: "economic",
    label: "경제관리",
    indicators: ["A-002_cpia_macr", "A-002_cpia_fisp", "A-002_cpia_debt"],
  },
  {
    key: "structural",
    label: "구조정책",
    indicators: ["A-002_cpia_trad", "A-002_cpia_fins", "A-002_cpia_breg"],
  },
  {
    key: "social",
    label: "사회적 포용",
    indicators: [
      "A-002_cpia_gndr",
      "A-002_cpia_pres",
      "A-002_cpia_hres",
      "A-002_cpia_prot",
      "A-002_cpia_envr",
    ],
  },
  {
    key: "public",
    label: "공공부문 관리",
    indicators: [
      "A-002_cpia_prop",
      "A-002_cpia_revn",
      "A-002_cpia_finq",
      "A-002_cpia_padm",
      "A-002_cpia_tran",
    ],
  },
] as const;

const CHART_WIDTH_V126 = 920;
const CHART_HEIGHT_V126 = 340;
const CHART_PADDING_V126 = { left: 58, right: 24, top: 22, bottom: 44 };

export default function CpiaPolicyCapacityAnalysisV126({
  rows,
  selectorState,
  onSelectorStateChange,
  showRawTable = true,
}: Props) {
  const numericRows = useMemo(
    () =>
      rows.filter(
        (row): row is NumericCpiaRowV126 =>
          typeof row.year === "number" &&
          typeof row.value === "number" &&
          Number.isFinite(row.value)
      ),
    [rows]
  );
  const coreRows = numericRows.filter((row) =>
    CPIA_CORE_SERIES_V126.some((series) => series.indicatorId === row.indicatorId)
  );
  const availableYears = Array.from(new Set(coreRows.map((row) => row.year))).sort(
    (left, right) => right - left
  );
  const selectedYear =
    selectorState.year !== null && availableYears.includes(selectorState.year)
      ? selectorState.year
      : availableYears[0] || null;
  const requestedCluster = selectorState.dimensions.cpiaCluster;
  const selectedCluster =
    CPIA_CLUSTERS_V126.find((cluster) => cluster.key === requestedCluster) ||
    CPIA_CLUSTERS_V126[0];

  useEffect(() => {
    if (
      selectorState.year === selectedYear &&
      selectorState.dimensions.cpiaCluster === selectedCluster.key
    ) {
      return;
    }
    onSelectorStateChange({
      ...selectorState,
      measure: null,
      year: selectedYear,
      period: null,
      dimensions: {
        ...selectorState.dimensions,
        cpiaCluster: selectedCluster.key,
      },
    });
  }, [onSelectorStateChange, selectedCluster.key, selectedYear, selectorState]);

  if (coreRows.length === 0 || selectedYear === null) {
    return (
      <div className="pav126-empty" role="status">
        공개된 CPIA 관측값을 표시할 수 없습니다.
      </div>
    );
  }

  const clusterRows = selectedCluster.indicators
    .map((indicatorId) =>
      numericRows.find(
        (row) => row.indicatorId === indicatorId && row.year === selectedYear
      )
    )
    .filter((row): row is NumericCpiaRowV126 => Boolean(row));

  return (
    <div className="cpia126" data-testid="a002-cpia-analysis">
      <section
        className="cpia126__kpis"
        aria-label="CPIA 핵심현황"
        data-testid="public-primary-visualization"
      >
        {CPIA_CORE_SERIES_V126.map((series) => {
          const current = coreRows.find(
            (row) => row.indicatorId === series.indicatorId && row.year === selectedYear
          );
          const previous = [...coreRows]
            .filter(
              (row) => row.indicatorId === series.indicatorId && row.year < selectedYear
            )
            .sort((left, right) => right.year - left.year)[0];
          const delta = current && previous ? current.value - previous.value : null;
          return (
            <article key={series.indicatorId}>
              <span>{series.label}</span>
              <strong>{current ? formatPublicNumberV126(current.value, "점") : "—"}</strong>
              <small>{selectedYear}년 · 1~6점 공식 척도</small>
              <small>{formatPublicDeltaV126(delta)}</small>
            </article>
          );
        })}
      </section>

      <section className="cpia126__panel" data-testid="a002-cpia-trend">
        <div className="pav126-section-heading">
          <span>주 분석</span>
          <h3>2005~{availableYears[0]}년 정책·제도 역량 추이</h3>
          <p>World Bank CPIA의 1~6점 공식 척도를 고정해 표시합니다.</p>
        </div>
        <CpiaTrendChartV126 rows={coreRows} />
      </section>

      <section className="cpia126__panel" data-testid="a002-cpia-cluster">
        <div className="pav126-section-heading">
          <span>보조 분석</span>
          <h3>{selectedYear}년 클러스터와 세부항목</h3>
        </div>
        <div className="cpia126__selectors" data-testid="public-selector">
          <label>
            <span>기준연도</span>
            <select
              aria-label="CPIA 기준연도 선택"
              value={selectedYear}
              onChange={(event) =>
                onSelectorStateChange({
                  ...selectorState,
                  year: Number(event.target.value),
                })
              }
            >
              {availableYears.map((year) => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </label>
          <label>
            <span>세부항목 클러스터</span>
            <select
              aria-label="CPIA 세부항목 클러스터 선택"
              value={selectedCluster.key}
              onChange={(event) =>
                onSelectorStateChange({
                  ...selectorState,
                  dimensions: {
                    ...selectorState.dimensions,
                    cpiaCluster: event.target.value,
                  },
                })
              }
            >
              {CPIA_CLUSTERS_V126.map((cluster) => (
                <option key={cluster.key} value={cluster.key}>{cluster.label}</option>
              ))}
            </select>
          </label>
        </div>

        <div className="cpia126__cluster-bars" role="list" aria-label={`${selectedYear}년 클러스터 평균`}>
          {CPIA_CORE_SERIES_V126.slice(1).map((series) => {
            const row = coreRows.find(
              (item) => item.indicatorId === series.indicatorId && item.year === selectedYear
            );
            return (
              <div key={series.indicatorId} role="listitem">
                <span>{series.label}</span>
                <i aria-hidden="true"><b style={{ width: `${cpiaWidthV126(row?.value)}%` }} /></i>
                <strong>{row ? formatPublicNumberV126(row.value, "점") : "—"}점</strong>
              </div>
            );
          })}
        </div>

        <div className="cpia126__detail-bars" role="list" aria-label={`${selectedCluster.label} 세부항목`}>
          {clusterRows.map((row) => (
            <div key={row.indicatorId} role="listitem" tabIndex={0} aria-label={`${publicCpiaLabelV126(row.indicatorId, row.semanticMeasure.labelKo)}, ${formatPublicNumberV126(row.value, "점")}점`}>
              <span>{publicCpiaLabelV126(row.indicatorId, row.semanticMeasure.labelKo)}</span>
              <i aria-hidden="true"><b style={{ width: `${cpiaWidthV126(row.value)}%` }} /></i>
              <strong>{formatPublicNumberV126(row.value, "점")}점</strong>
            </div>
          ))}
        </div>
      </section>

      {showRawTable && <details
        className="cpia126__table"
        data-testid="public-raw-table"
      >
        <summary>원자료 보기 · {rows.length.toLocaleString("ko-KR")}건</summary>
        <div className="cdp-table-wrap">
          <table className="cdp-table">
            <thead>
              <tr>
                <th>측정항목</th><th>값</th><th>단위</th><th>연도</th><th>자료 제공기관</th><th>결측 사유</th><th>공식 원문</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => {
                const sourceUrl = safeCpiaUrlV126(row.provenance.sourceUrl);
                return (
                  <tr key={row.recordId}>
                    <td>{publicCpiaLabelV126(row.indicatorId, row.semanticMeasure.labelKo)}</td>
                    <td>{formatPublicNumberV126(row.value, "점")}</td>
                    <td>{row.unit || "점"}</td>
                    <td>{row.year || row.period || ""}</td>
                    <td>{row.provenance.sourceOrg || ""}</td>
                    <td>{row.value === null ? publicMissingReasonLabelV126(row.missingReasonCode, row.note) || "미제공" : ""}</td>
                    <td>{sourceUrl ? <a href={sourceUrl} target="_blank" rel="noreferrer">원문 확인</a> : ""}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </details>}
    </div>
  );
}

function CpiaTrendChartV126({ rows }: { rows: NumericCpiaRowV126[] }) {
  const years = Array.from(new Set(rows.map((row) => row.year))).sort((a, b) => a - b);
  const minYear = years[0];
  const maxYear = years[years.length - 1];
  const x = (year: number) =>
    CHART_PADDING_V126.left +
    ((year - minYear) / Math.max(1, maxYear - minYear)) *
      (CHART_WIDTH_V126 - CHART_PADDING_V126.left - CHART_PADDING_V126.right);
  const y = (value: number) =>
    CHART_PADDING_V126.top +
    ((6 - value) / 5) *
      (CHART_HEIGHT_V126 - CHART_PADDING_V126.top - CHART_PADDING_V126.bottom);
  const yearTicks = years.filter(
    (_, index) => index === 0 || index === years.length - 1 || index % 2 === 0
  );

  return (
    <>
      <div className="cpia126__legend" aria-label="지표 범례">
        {CPIA_CORE_SERIES_V126.map((series) => (
          <span key={series.indicatorId}><i style={{ backgroundColor: series.color }} aria-hidden="true" />{series.label}</span>
        ))}
      </div>
      <div className="cpia126__chart-scroll">
        <svg viewBox={`0 0 ${CHART_WIDTH_V126} ${CHART_HEIGHT_V126}`} role="img" aria-label="CPIA 종합과 4개 클러스터의 1점에서 6점 사이 연도별 추이">
          {[1, 2, 3, 4, 5, 6].map((tick) => (
            <g key={tick}>
              <line x1={CHART_PADDING_V126.left} x2={CHART_WIDTH_V126 - CHART_PADDING_V126.right} y1={y(tick)} y2={y(tick)} />
              <text x={CHART_PADDING_V126.left - 12} y={y(tick) + 4} textAnchor="end">{tick}</text>
            </g>
          ))}
          {yearTicks.map((year) => (
            <text key={year} x={x(year)} y={CHART_HEIGHT_V126 - 14} textAnchor="middle">{year}</text>
          ))}
          {CPIA_CORE_SERIES_V126.map((series) => {
            const seriesRows = rows
              .filter((row) => row.indicatorId === series.indicatorId)
              .sort((left, right) => left.year - right.year);
            const points = seriesRows.map((row) => `${x(row.year)},${y(row.value)}`).join(" ");
            return (
              <g key={series.indicatorId}>
                <polyline points={points} fill="none" stroke={series.color} strokeWidth="3" strokeDasharray={series.dash || undefined} />
                {seriesRows.map((row) => (
                  <circle key={row.recordId} cx={x(row.year)} cy={y(row.value)} r="4" fill="#fff" stroke={series.color} strokeWidth="2" tabIndex={0} aria-label={`${series.label}, ${row.year}년, ${formatPublicNumberV126(row.value, "점")}점`}>
                    <title>{series.label} · {row.year}년 · {formatPublicNumberV126(row.value, "점")}점</title>
                  </circle>
                ))}
              </g>
            );
          })}
        </svg>
      </div>
    </>
  );
}

function cpiaWidthV126(value: number | undefined): number {
  if (typeof value !== "number") return 0;
  return Math.max(0, Math.min(100, ((value - 1) / 5) * 100));
}

function safeCpiaUrlV126(value: string | null | undefined): string {
  return publicSourceUrlV126(value) || "";
}
