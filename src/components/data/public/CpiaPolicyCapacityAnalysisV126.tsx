import { useEffect, useMemo } from "react";
import InteractiveTimeSeriesChartV127 from "../../charts/InteractiveTimeSeriesChartV127";
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
import { getPublicChartLimitationSummaryV127 } from "../../../data/visualization/publicLimitationsRegistryV127";
import type {
  ChartLinePatternV127,
  ChartMarkerShapeV127,
  TimeSeriesV127,
} from "../../../types/chartInteractionV127";
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
  linePattern: ChartLinePatternV127;
  marker: ChartMarkerShapeV127;
};

/**
 * The delivery ships this element as the Worldwide Governance Indicators.
 *
 * The CPIA series below are still read first, because an element that carries
 * them should keep the cluster view. This delivery does not: it carries six WGI
 * dimensions, each with a Percentile Rank and an Estimate, 1996-2024. Reading
 * only the CPIA ids left the page with "공개된 CPIA 관측값을 표시할 수 없습니다"
 * beside its own note that all 312 rows carry a value.
 *
 * Percentile Rank is what the cards and the trend use: it is bounded 0-100 and
 * comparable across dimensions. The Estimate is a different scale and is offered
 * as its own choice rather than drawn on the same axis.
 */
const WGI_DIMENSIONS_V137 = [
  { key: "va", label: "시민 자유·참여·책임성", color: "#0f766e", linePattern: "solid", marker: "circle" },
  { key: "pv", label: "정치안정·폭력부재", color: "#2563eb", linePattern: "dash", marker: "square" },
  { key: "ge", label: "정부 효과성", color: "#c2410c", linePattern: "long-dash", marker: "diamond" },
  { key: "rq", label: "규제의 질", color: "#7c3aed", linePattern: "dot", marker: "triangle" },
  { key: "rl", label: "법치", color: "#be123c", linePattern: "dash", marker: "cross" },
  { key: "cc", label: "부패 통제", color: "#0369a1", linePattern: "solid", marker: "square" },
] as const;

const WGI_MEASURES_V137 = [
  {
    key: "pctrank",
    label: "백분위(같은 해 조사대상국 중 위치)",
    unit: "백분위",
    scaleNote: "0~100 · 값이 클수록 상위",
  },
  {
    key: "est",
    label: "표준값(Estimate)",
    unit: "점",
    scaleNote: "약 -2.5~2.5 · 값이 클수록 양호",
  },
] as const;

function wgiSeriesV137(measureKey: string): CpiaSeriesV126[] {
  return WGI_DIMENSIONS_V137.map((dimension) => ({
    indicatorId: `A-002_wgi_${dimension.key}_${measureKey}`,
    label: dimension.label,
    color: dimension.color,
    linePattern: dimension.linePattern as ChartLinePatternV127,
    marker: dimension.marker as ChartMarkerShapeV127,
  }));
}

const CPIA_CORE_SERIES_V126: CpiaSeriesV126[] = [
  { indicatorId: "A-002_cpia_irai_overall", label: "IRAI 종합", color: "#0f766e", linePattern: "solid", marker: "circle" },
  { indicatorId: "A-002_cpia_economic_management", label: "경제관리", color: "#2563eb", linePattern: "dash", marker: "square" },
  { indicatorId: "A-002_cpia_structural_policies", label: "구조정책", color: "#c2410c", linePattern: "long-dash", marker: "diamond" },
  { indicatorId: "A-002_cpia_social_inclusion", label: "사회적 포용", color: "#7c3aed", linePattern: "dot", marker: "triangle" },
  { indicatorId: "A-002_cpia_public_sector", label: "공공부문 관리", color: "#be123c", linePattern: "dash", marker: "cross" },
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
  // Which governance series this delivery actually carries decides what the
  // page shows. CPIA first, because an element that has it keeps its cluster
  // view; WGI otherwise, on the measure the reader has chosen.
  const cpiaRows = numericRows.filter((row) =>
    CPIA_CORE_SERIES_V126.some((series) => series.indicatorId === row.indicatorId)
  );
  const requestedMeasure = selectorState.dimensions.wgiMeasure;
  const wgiMeasure =
    WGI_MEASURES_V137.find((measure) => measure.key === requestedMeasure) ||
    WGI_MEASURES_V137[0];
  const wgiMode = cpiaRows.length === 0;
  const activeSeries = wgiMode ? wgiSeriesV137(wgiMeasure.key) : CPIA_CORE_SERIES_V126;
  const activeUnit = wgiMode ? wgiMeasure.unit : "점";
  const activeScaleNote = wgiMode ? wgiMeasure.scaleNote : "1~6점 공식 척도";
  const coreRows = wgiMode
    ? numericRows.filter((row) =>
        activeSeries.some((series) => series.indicatorId === row.indicatorId)
      )
    : cpiaRows;
  const availableYears = Array.from(new Set(coreRows.map((row) => row.year))).sort(
    (left, right) => right - left
  );
  const firstPopulatedYear = availableYears[availableYears.length - 1];
  const lastPopulatedYear = availableYears[0];
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
        공개된 거버넌스 관측값을 표시할 수 없습니다.
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
      {/*
        The year and the displayed value drive the cards and the chart above,
        so they are read before them. Sitting in the third section they were
        2,100px down the page: a reader met six cards and a trend for a year
        nothing on screen let them choose.
      */}
      <div className="cpia126__selectors" data-testid="public-selector">
        <label>
          <span>기준연도</span>
          <select
            aria-label={wgiMode ? "거버넌스 지표 기준연도 선택" : "CPIA 기준연도 선택"}
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
        {wgiMode ? (
          <label>
            <span>표시 값</span>
            <select
              aria-label="거버넌스 지표 표시 값 선택"
              value={wgiMeasure.key}
              onChange={(event) =>
                onSelectorStateChange({
                  ...selectorState,
                  dimensions: {
                    ...selectorState.dimensions,
                    wgiMeasure: event.target.value,
                  },
                })
              }
            >
              {WGI_MEASURES_V137.map((measure) => (
                <option key={measure.key} value={measure.key}>{measure.label}</option>
              ))}
            </select>
          </label>
        ) : (
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
        )}
      </div>

      <section
        className="cpia126__kpis"
        aria-label={wgiMode ? "거버넌스 지표 핵심현황" : "CPIA 핵심현황"}
        data-testid="public-primary-visualization"
      >
        {activeSeries.map((series) => {
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
              <strong>
                {current ? formatPublicNumberV126(current.value, activeUnit) : "—"}
              </strong>
              <small>{selectedYear}년 · {activeUnit} · {activeScaleNote}</small>
              <small>{formatPublicDeltaV126(delta, activeUnit)}</small>
            </article>
          );
        })}
      </section>

      <section className="cpia126__panel" data-testid="a002-cpia-trend">
        <div className="pav126-section-heading">
          <span>주 분석</span>
          <h3>
            {firstPopulatedYear}~{lastPopulatedYear}년{" "}
            {wgiMode ? "거버넌스 지표 추이" : "정책·제도 역량 추이"}
          </h3>
        </div>
        <CpiaTrendChartV126 rows={coreRows} series={activeSeries} unit={activeUnit} />
      </section>

      <section className="cpia126__panel" data-testid="a002-cpia-cluster">
        <div className="pav126-section-heading">
          <span>보조 분석</span>
          <h3>
            {selectedYear}년{" "}
            {wgiMode ? "부문별 비교" : "클러스터와 세부항목"}
          </h3>
        </div>

        <div
          className="cpia126__cluster-bars"
          role="list"
          aria-label={`${selectedYear}년 ${wgiMode ? "부문별 값" : "클러스터 평균"}`}
        >
          {(wgiMode ? activeSeries : CPIA_CORE_SERIES_V126.slice(1)).map((series) => {
            const row = coreRows.find(
              (item) => item.indicatorId === series.indicatorId && item.year === selectedYear
            );
            return (
              <div key={series.indicatorId} role="listitem">
                <span>{series.label}</span>
                <i aria-hidden="true">
                  <b
                    style={{
                      width: `${
                        wgiMode
                          ? barWidthV137(row?.value, activeUnit)
                          : cpiaWidthV126(row?.value)
                      }%`,
                    }}
                  />
                </i>
                <strong>
                  {row
                    ? `${formatPublicNumberV126(row.value, activeUnit)}${
                        wgiMode ? ` ${activeUnit}` : "점"
                      }`
                    : "—"}
                </strong>
              </div>
            );
          })}
        </div>
        {wgiMode && (
          <p className="cpia126__chart-limitation">
            {wgiMeasure.scaleNote} · 같은 해 조사대상국 대비 위치이며 절대 수준이 아닙니다.
          </p>
        )}

        {!wgiMode && (
          <div className="cpia126__detail-bars" role="list" aria-label={`${selectedCluster.label} 세부항목`}>
            {clusterRows.map((row) => (
              <div key={row.indicatorId} role="listitem" tabIndex={0} aria-label={`${publicCpiaLabelV126(row.indicatorId, row.semanticMeasure.labelKo)}, ${formatPublicNumberV126(row.value, "점")}점`}>
                <span>{publicCpiaLabelV126(row.indicatorId, row.semanticMeasure.labelKo)}</span>
                <i aria-hidden="true"><b style={{ width: `${cpiaWidthV126(row.value)}%` }} /></i>
                <strong>{formatPublicNumberV126(row.value, "점")}점</strong>
              </div>
            ))}
          </div>
        )}
      </section>

      {showRawTable && <details
        className="cpia126__table"
        data-testid="public-raw-table"
      >
        <summary>상세 데이터 · {rows.length.toLocaleString("ko-KR")}건</summary>
        <div className="cdp-table-wrap">
          <table className="cdp-table">
            <thead>
              <tr>
                <th>항목</th><th>값</th><th>단위</th><th>연도</th><th>제공기관</th><th>결측 사유</th><th>공식 원문</th>
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

function CpiaTrendChartV126({
  rows,
  series: definitions,
  unit,
}: {
  rows: NumericCpiaRowV126[];
  series: CpiaSeriesV126[];
  unit: string;
}) {
  const years = Array.from(new Set(rows.map((row) => row.year))).sort((a, b) => a - b);
  const minYear = years[0];
  const maxYear = years[years.length - 1];
  const chartLimitation = getPublicChartLimitationSummaryV127("A-002");
  // The axis is fixed to the scale the shown measure is actually on. A
  // percentile has a real 0-100 floor and ceiling; an estimate does not, so it
  // is left to the data rather than squeezed into someone else's scale.
  const percentile = unit === "백분위";
  const fixedDomain: [number, number] | undefined = percentile
    ? [0, 100]
    : unit === "점" && definitions === CPIA_CORE_SERIES_V126
      ? [1, 6]
      : undefined;
  const scaleDescription = percentile
    ? "0(하위)–100(상위)"
    : fixedDomain
      ? "1(낮음)–6(높음)"
      : "표준값(약 -2.5~2.5)";
  const series: TimeSeriesV127[] = definitions.map((definition) => ({
    id: definition.indicatorId,
    label: definition.label,
    unit,
    color: definition.color,
    linePattern: definition.linePattern,
    marker: definition.marker,
    defaultVisible: true,
    points: rows
      .filter((row) => row.indicatorId === definition.indicatorId)
      .sort((left, right) => left.year - right.year)
      .map((row) => ({
        id: row.recordId,
        x: row.year,
        xLabel: `${row.year}년`,
        value: row.value,
      })),
  }));

  return (
    <>
      <InteractiveTimeSeriesChartV127
        ariaLabel={`${definitions.length}개 부문의 ${minYear}년부터 ${maxYear}년까지 추이`}
        controlLabels={{ zoomOut: "축소", zoomIn: "확대", reset: "전체기간" }}
        fixedYDomain={fixedDomain}
        formatDelta={(value) => `${value > 0 ? "+" : ""}${formatPublicNumberV126(value, unit)}`}
        formatValue={(value) => formatPublicNumberV126(value, unit)}
        minimumVisibleSeries={1}
        scaleDescription={scaleDescription}
        series={series}
        sharedYearTooltip
        testId="interactive-time-series-chart"
        title={`${minYear}~${maxYear}년 추이`}
        unit={unit}
        xAxisTitle="연도"
        yAxisTitle={percentile ? "백분위(같은 해 조사대상국 중 위치)" : "지표 값"}
        zoom={{ enabled: true, minimumSpan: 2 }}
      />
      {chartLimitation && (
        <p className="cpia126__chart-limitation" data-testid="a002-coverage-gap-note">
          {chartLimitation}
        </p>
      )}
    </>
  );
}

function cpiaWidthV126(value: number | undefined): number {
  if (typeof value !== "number") return 0;
  return Math.max(0, Math.min(100, ((value - 1) / 5) * 100));
}

/** Bar length on the scale the shown value is actually on. */
function barWidthV137(value: number | undefined, unit: string): number {
  if (typeof value !== "number") return 0;
  if (unit === "백분위") return Math.max(0, Math.min(100, value));
  // The WGI estimate runs about -2.5 to 2.5; anything else keeps the 1-6 scale.
  if (unit === "점") return Math.max(0, Math.min(100, ((value + 2.5) / 5) * 100));
  return 0;
}

function safeCpiaUrlV126(value: string | null | undefined): string {
  return publicSourceUrlV126(value) || "";
}
