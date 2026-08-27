import { useEffect, useMemo } from "react";
import type {
  ElementIndicatorSemanticsV125,
  ElementVisualizationContractV125,
  SemanticObservationV125,
} from "../../../data/visualization/semanticTypesV125";
import { buildSemanticObservationsV125 } from "../../../data/visualization/semanticObservationBuilderV125";
import type {
  VietnamEntityV124,
  VietnamObservationV124,
} from "../../../data/vietnam/vietnamTypesV124";
import { dataFinderSelectorStatesEqualV125 } from "../../../types/dataFinderV125";
import type { DataFinderSelectorStateV125 } from "../../../types/dataFinderV125";
import {
  entityDisplayNameV121,
  formatValueV121,
  isHttpUrlV121,
} from "../../../utils/vietnamActualV121";
import SemanticContractRendererV125 from "./SemanticContractRendererV125";
import "../../../styles/semantic-visualization-v125.css";

interface Props {
  contract: ElementVisualizationContractV125;
  semantics: ElementIndicatorSemanticsV125;
  observations: VietnamObservationV124[];
  entities: VietnamEntityV124[];
  countryNameKo: string;
  selectorState: DataFinderSelectorStateV125;
  onSelectorStateChange: (state: DataFinderSelectorStateV125) => void;
}

type NumericSemanticObservation = SemanticObservationV125 & { value: number };

const SERIES_PATTERNS_V125 = ["solid", "dashed", "dotted", "double"] as const;

export default function SemanticArchetypePreviewV125({
  contract,
  semantics,
  observations,
  entities,
  countryNameKo,
  selectorState,
  onSelectorStateChange,
}: Props) {
  const semanticRows = useMemo(
    () =>
      buildSemanticObservationsV125(
        observations,
        semantics.indicators,
        semantics.records
      ),
    [observations, semantics]
  );
  const additionalDimensions = useMemo(
    () =>
      contract.dimensions.filter(
        (dimension) =>
          !["year", "period", "sex"].includes(dimension.key) &&
          dimension.values.length > 1
      ),
    [contract.dimensions]
  );
  const dimensions = useMemo(
    () =>
      Object.fromEntries(
        additionalDimensions.flatMap((dimension) => {
          const selected = selectorState.dimensions[dimension.key];
          return selected && dimension.values.includes(selected)
            ? [[dimension.key, selected]]
            : [];
        })
      ),
    [additionalDimensions, selectorState.dimensions]
  );
  const measureOptions = useMemo(() => {
    const availableKeys = new Set(
      semanticRows.map((row) => row.semanticMeasure.key)
    );
    return contract.measures.filter(
      (measure) => measure.recordCount > 0 && availableKeys.has(measure.key)
    );
  }, [contract.measures, semanticRows]);
  const explicitMeasureIsValid = measureOptions.some(
    (measure) => measure.key === selectorState.measure
  );
  const populatedDefaultMeasure = measureOptions.find((measure) =>
    semanticRows.some(
      (row) =>
        row.semanticMeasure.key === measure.key &&
        semanticRowMatchesDimensionsV125(row, dimensions) &&
        isPopulatedSemanticRowV125(row)
    )
  );
  const measureKey = explicitMeasureIsValid
    ? (selectorState.measure as string)
    : populatedDefaultMeasure?.key || measureOptions[0]?.key || null;
  const measureRows = semanticRows.filter(
    (row) => row.semanticMeasure.key === measureKey
  );
  const sexDimension = contract.dimensions.find(
    (dimension) => dimension.key === "sex"
  );
  const sexValues = sexDimension?.values || [];
  const populatedSexValues = sexValues.filter((value) =>
    measureRows.some(
      (row) =>
        semanticRowMatchesDimensionsV125(row, dimensions) &&
        semanticRowMatchesSexV125(row, value) &&
        isPopulatedSemanticRowV125(row)
    )
  );
  const sex = (
    selectorState.sex && sexValues.includes(selectorState.sex)
      ? selectorState.sex
      : populatedSexValues.includes("total")
      ? "total"
      : populatedSexValues[0] ||
        (sexValues.includes("total") ? "total" : sexValues[0] || null)
  ) as DataFinderSelectorStateV125["sex"];
  const measureContextRows = measureRows.filter(
    (row) =>
      semanticRowMatchesSexV125(row, sex) &&
      semanticRowMatchesDimensionsV125(row, dimensions)
  );
  const periods = Array.from(
    new Set(
      measureContextRows
        .map((row) => row.period)
        .filter((value): value is string => Boolean(value && value.trim()))
    )
  ).sort((left, right) => left.localeCompare(right, "ko"));
  const populatedDefaultPeriod = periods.find((value) =>
    measureContextRows.some(
      (row) => row.period === value && isPopulatedSemanticRowV125(row)
    )
  );
  const period =
    selectorState.period && periods.includes(selectorState.period)
      ? selectorState.period
      : populatedDefaultPeriod || periods[0] || null;
  const periodContextRows = measureContextRows.filter(
    (row) => !period || row.period === period
  );
  const years = Array.from(
    new Set(
      periodContextRows
        .map((row) => row.year)
        .filter((value): value is number => typeof value === "number")
    )
  ).sort((left, right) => right - left);
  const populatedDefaultYear = years.find((value) =>
    periodContextRows.some(
      (row) => row.year === value && isPopulatedSemanticRowV125(row)
    )
  );
  const year =
    selectorState.year !== null && years.includes(selectorState.year)
      ? selectorState.year
      : populatedDefaultYear ?? years[0] ?? null;
  const dimensionFilteredRows = periodContextRows;

  useEffect(() => {
    const next: DataFinderSelectorStateV125 = {
      measure: measureKey,
      sex,
      year,
      period,
      dimensions,
    };
    if (!dataFinderSelectorStatesEqualV125(next, selectorState)) {
      onSelectorStateChange(next);
    }
  }, [dimensions, measureKey, onSelectorStateChange, period, selectorState, sex, year]);

  if (contract.primaryRenderer === "status-only") {
    return (
      <section
        className="sv125-status"
        data-testid="v125-status-only"
        data-renderer="status-only"
        data-v125-empty-reason="no-populated-records"
      >
        <div data-testid="v125-renderer-status-only">
          <strong>표시할 실제 레코드가 없습니다</strong>
          <p>{contract.noDataReason || contract.missingDataPolicy}</p>
        </div>
      </section>
    );
  }

  const selectedRows = dimensionFilteredRows.filter((row) => {
    if (year !== null && row.year !== year) return false;
    return true;
  });
  const numericRows = selectedRows.filter(
    (row): row is NumericSemanticObservation =>
      typeof row.value === "number" && Number.isFinite(row.value)
  );
  const textRows = selectedRows.filter(
    (row) =>
      row.value !== null &&
      row.value !== undefined &&
      row.value !== "" &&
      typeof row.value !== "number"
  );
  const missingRows = selectedRows.filter(
    (row) => row.value === null || row.value === undefined || row.value === ""
  );
  const visualizationTableRows =
    contract.primaryRenderer === "kpi-trend" ||
    contract.primaryRenderer === "multi-metric-trend" ||
    contract.primaryRenderer === "score-benchmark" ||
    contract.primaryRenderer === "capability-scorecard"
      ? dimensionFilteredRows
      : selectedRows;
  const rendererLabel = rendererLabelV125(contract.primaryRenderer);

  return (
    <div
      className="sv125-shell"
      data-renderer={contract.primaryRenderer}
      data-testid="v125-semantic-visualization"
    >
      <section className="sv125-intro" aria-labelledby="sv125-intro-title">
        <span>이 데이터로 확인할 수 있는 내용</span>
        <h3 id="sv125-intro-title">{rendererLabel}</h3>
        <p>
          측정항목 {contract.measures.length}종과 분류 차원 {contract.dimensions.length}종을
          원자료의 의미와 단위를 유지해 탐색합니다.
        </p>
      </section>

      <div className="sv125-controls" aria-label="데이터 분류 선택">
        {measureOptions.length > 1 && (
          <label>
            <span>측정항목</span>
            <select
              aria-label="측정항목 선택"
              data-testid="v125-measure-select"
              value={measureKey || ""}
              onChange={(event) =>
                onSelectorStateChange({
                  ...selectorState,
                  measure: event.target.value,
                  year: null,
                  period: null,
                  dimensions: {},
                })
              }
            >
              {measureOptions.map((measure) => (
                <option key={measure.key} value={measure.key}>
                  {measure.labelKo} · {measure.unit || "단위 미기재"}
                </option>
              ))}
            </select>
          </label>
        )}
        {sexValues.length > 0 && (
          <label>
            <span>성별</span>
            <select
              aria-label="성별 선택"
              data-testid="v125-sex-select"
              value={sex || ""}
              onChange={(event) =>
                onSelectorStateChange({
                  ...selectorState,
                  sex: event.target.value as DataFinderSelectorStateV125["sex"],
                })
              }
            >
              {sexValues.map((value) => (
                <option key={value} value={value}>
                  {dimensionValueLabelV125("sex", value)}
                </option>
              ))}
            </select>
          </label>
        )}
        {additionalDimensions.map((dimension) => (
          <label key={dimension.key}>
            <span>{dimension.labelKo}</span>
            <select
              aria-label={`${dimension.labelKo} 선택`}
              data-v125-dimension-key={dimension.key}
              value={dimensions[dimension.key] || ""}
              onChange={(event) =>
                onSelectorStateChange({
                  ...selectorState,
                  dimensions: nextDimensionSelectionsV125(
                    dimensions,
                    dimension.key,
                    event.target.value
                  ),
                })
              }
            >
              <option value="">전체</option>
              {dimension.values.map((value) => (
                <option key={value} value={value}>
                  {dimensionValueLabelV125(dimension.key, value)}
                </option>
              ))}
            </select>
          </label>
        ))}
        {periods.length > 1 && (
          <label>
            <span>기간</span>
            <select
              aria-label="기간 선택"
              data-testid="v125-period-select"
              value={period || ""}
              onChange={(event) =>
                onSelectorStateChange({
                  ...selectorState,
                  period: event.target.value,
                })
              }
            >
              {periods.map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
          </label>
        )}
        {years.length > 0 && (
          <label>
            <span>연도</span>
            <select
              aria-label="연도 선택"
              data-testid="v125-year-select"
              value={year ?? ""}
              onChange={(event) =>
                onSelectorStateChange({
                  ...selectorState,
                  year: Number(event.target.value),
                })
              }
            >
              {years.map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
          </label>
        )}
      </div>

      <SemanticKpisV125
        rows={selectedRows}
        contract={contract}
        selectedMeasureKey={measureKey}
      />

      {(numericRows.length > 0 || textRows.length > 0 || entities.length > 0) && (
        <SemanticContractRendererV125
          contract={contract}
          rows={selectedRows}
          contextRows={dimensionFilteredRows}
          entities={entities}
          countryNameKo={countryNameKo}
        />
      )}

      {missingRows.length > 0 && (
        <div className="sv125-missing" role="note">
          <strong>결측 {missingRows.length.toLocaleString("ko-KR")}건</strong>
          <span>
            {Array.from(
              new Set(
                missingRows.map(
                  (row) => row.missingReasonCode || row.note || "원천 미제공"
                )
              )
            )
              .slice(0, 3)
              .join(" · ")}
          </span>
        </div>
      )}

      {numericRows.length === 0 &&
        textRows.length === 0 &&
        entities.length === 0 && (
          <div
            className="sv125-empty"
            role="status"
            data-v125-empty-reason="selection-has-no-values"
          >
            <strong>현재 선택 조건에 표시할 값이 없습니다</strong>
            <p>결측값을 0으로 대체하지 않았습니다.</p>
          </div>
        )}

      <SemanticTableFallbackV125 rows={visualizationTableRows} />
    </div>
  );
}

function SemanticKpisV125({
  rows,
  contract,
  selectedMeasureKey,
}: {
  rows: SemanticObservationV125[];
  contract: ElementVisualizationContractV125;
  selectedMeasureKey: string | null;
}) {
  const selectedMeasures = selectedMeasureKey
    ? contract.measures.filter((measure) => measure.key === selectedMeasureKey)
    : [];
  const kpis = selectedMeasures.slice(0, 4).map((measure) => {
    const candidates = rows
      .filter(
        (row) =>
          row.semanticMeasure.key === measure.key &&
          row.value !== null &&
          row.value !== undefined &&
          row.value !== ""
      )
      .sort((left, right) => (right.year || -Infinity) - (left.year || -Infinity));
    const aggregate = candidates.find((row) =>
      Object.keys(row.dimensions).every((key) =>
        ["year", "period"].includes(key)
      )
    );
    const row = aggregate || candidates[0] || null;
    const dimensionContext = row
      ? Object.entries(row.dimensionLabels)
          .filter(([key]) => !["year", "period"].includes(key))
          .map(([, value]) => value)
          .filter(Boolean)
          .join(" · ")
      : "";
    return { measure, row, dimensionContext, isAggregate: Boolean(aggregate) };
  });
  return (
    <section
      className="sv125-kpis"
      aria-label="현재 선택 조건의 핵심 KPI"
      data-testid="v125-context-kpis"
      data-v125-selection-has-values={kpis.some(({ row }) => Boolean(row)) ? "true" : "false"}
    >
      {kpis.map(({ measure, row, dimensionContext, isAggregate }) => (
        <article key={`${measure.key}-${measure.unit}`}>
          <span>{row?.displayLabel || measure.labelKo}</span>
          <strong>{row ? formatValueV121(row.value) : "미제공"}</strong>
          <small>
            {row
              ? [
                  row.unit || measure.unit,
                  row.year || row.period,
                  dimensionContext,
                  !isAggregate && dimensionContext ? "분류 레코드" : null,
                ]
                  .filter(Boolean)
                  .join(" · ")
              : measure.unit || "단위 미기재"}
          </small>
        </article>
      ))}
      {contract.measures.length > selectedMeasures.length && (
        <p className="sv125-kpi-note">
          현재 선택한 측정항목만 표시합니다. 다른 측정항목은 선택기와 전체 원자료
          표에서 확인할 수 있습니다.
        </p>
      )}
    </section>
  );
}

function isPopulatedSemanticRowV125(row: SemanticObservationV125): boolean {
  if (row.value === null || row.value === undefined || row.value === "") return false;
  return typeof row.value !== "number" || Number.isFinite(row.value);
}

function semanticRowMatchesSexV125(
  row: SemanticObservationV125,
  sex: string | null
): boolean {
  return !sex || !row.dimensions.sex || row.dimensions.sex === sex;
}

function semanticRowMatchesDimensionsV125(
  row: SemanticObservationV125,
  dimensions: Record<string, string>
): boolean {
  return Object.entries(dimensions).every(
    ([key, value]) => !value || row.dimensions[key] === value
  );
}

function CategoryPanelsV125({ rows }: { rows: NumericSemanticObservation[] }) {
  const groups = groupByUnitV125(rows);
  return (
    <section className="sv125-primary" aria-label="범주 비교">
      <div className="sv125-section-heading">
        <span>주 시각화</span>
        <h4>분류별 값 비교</h4>
      </div>
      {groups.map(({ unit, rows: unitRows }) => {
        const max = Math.max(...unitRows.map((row) => Math.abs(row.value)), 1e-9);
        return (
          <article className="sv125-axis-group" key={unit}>
            <h5>단위: {unit || "미기재"}</h5>
            <div className="sv125-bars">
              {unitRows.map((row, index) => (
                <div
                  className="sv125-bar-row"
                  key={`${row.recordId}-${row.seriesKey}`}
                  tabIndex={0}
                  aria-label={`${row.displayLabel}, ${formatValueV121(row.value)} ${unit}, ${
                    row.year || row.period || "기준시점 미기재"
                  }`}
                >
                  <div>
                    <strong>{row.displayLabel}</strong>
                    <small>{row.year || row.period || "기준시점 미기재"}</small>
                  </div>
                  <span className={`sv125-pattern sv125-pattern--${SERIES_PATTERNS_V125[index % SERIES_PATTERNS_V125.length]}`}>
                    <i style={{ width: `${Math.max(2, (Math.abs(row.value) / max) * 100)}%` }} />
                  </span>
                  <b>{formatValueV121(row.value)} {unit}</b>
                </div>
              ))}
            </div>
          </article>
        );
      })}
    </section>
  );
}

function TrendPanelsV125({ rows }: { rows: SemanticObservationV125[] }) {
  const numeric = rows.filter(
    (row): row is NumericSemanticObservation =>
      typeof row.value === "number" && Number.isFinite(row.value) && typeof row.year === "number"
  );
  const groups = groupByUnitV125(numeric);
  return (
    <section className="sv125-primary" aria-label="연도별 추세">
      <div className="sv125-section-heading">
        <span>주 시각화</span>
        <h4>연도별 추세</h4>
      </div>
      {groups.map(({ unit, rows: unitRows }) => (
        <TrendAxisGroupV125 key={unit} unit={unit} rows={unitRows} />
      ))}
    </section>
  );
}

function TrendAxisGroupV125({
  unit,
  rows,
}: {
  unit: string;
  rows: NumericSemanticObservation[];
}) {
  const series = Array.from(
    rows.reduce((map, row) => {
      const bucket = map.get(row.seriesKey) || [];
      bucket.push(row);
      map.set(row.seriesKey, bucket);
      return map;
    }, new Map<string, NumericSemanticObservation[]>())
  ).map(([key, values]) => ({
    key,
    label: values[0].displayLabel,
    rows: values.sort((left, right) => (left.year || 0) - (right.year || 0)),
  }));
  const all = series.flatMap((item) => item.rows);
  if (all.length === 0) return null;
  const years = all.map((row) => row.year as number);
  const values = all.map((row) => row.value);
  const minYear = Math.min(...years);
  const maxYear = Math.max(...years);
  const minValue = Math.min(...values);
  const maxValue = Math.max(...values);
  const width = 900;
  const height = 320;
  const pad = { left: 62, right: 24, top: 24, bottom: 45 };
  const x = (value: number) =>
    pad.left + ((value - minYear) / Math.max(1, maxYear - minYear)) * (width - pad.left - pad.right);
  const y = (value: number) =>
    height - pad.bottom - ((value - minValue) / Math.max(1e-9, maxValue - minValue)) * (height - pad.top - pad.bottom);
  return (
    <article className="sv125-axis-group">
      <h5>단위: {unit || "미기재"}</h5>
      <div className="sv125-trend-scroll">
        <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label={`${unit} 연도별 추세`}>
          <line x1={pad.left} y1={height - pad.bottom} x2={width - pad.right} y2={height - pad.bottom} />
          <line x1={pad.left} y1={pad.top} x2={pad.left} y2={height - pad.bottom} />
          {series.map((item, index) => {
            const points = item.rows.map((row) => `${x(row.year as number)},${y(row.value)}`).join(" ");
            return (
              <g key={item.key} className={`sv125-series sv125-series--${SERIES_PATTERNS_V125[index % SERIES_PATTERNS_V125.length]}`}>
                <polyline points={points} fill="none" />
                {item.rows.map((row) => (
                  <circle key={row.recordId} cx={x(row.year as number)} cy={y(row.value)} r="4" tabIndex={0} aria-label={`${item.label}, ${row.year}, ${formatValueV121(row.value)} ${unit}`}>
                    <title>{item.label} · {row.year} · {formatValueV121(row.value)} {unit}</title>
                  </circle>
                ))}
              </g>
            );
          })}
          <text x={pad.left} y={height - 14}>{minYear}</text>
          <text x={width - pad.right} y={height - 14} textAnchor="end">{maxYear}</text>
        </svg>
      </div>
      <div className="sv125-legend" aria-label="계열 범례">
        {series.map((item, index) => (
          <span key={item.key} className={`sv125-pattern--${SERIES_PATTERNS_V125[index % SERIES_PATTERNS_V125.length]}`}>
            <i /> {item.label}
          </span>
        ))}
      </div>
    </article>
  );
}

function semanticMissingReasonV125(row: SemanticObservationV125): string {
  if (row.missingReasonCode?.trim()) return row.missingReasonCode;
  if (row.value === null || row.value === undefined || row.value === "") {
    return "원천 미제공(사유 미기재)";
  }
  return "해당 없음";
}

function semanticEvidenceV125(row: SemanticObservationV125): string {
  const evidence = [
    row.note?.trim() ? `원문 메모: ${row.note}` : null,
    row.rawValue !== null &&
    row.rawValue !== undefined &&
    String(row.rawValue).trim()
      ? `원문값: ${row.rawValue}`
      : null,
  ].filter((value): value is string => Boolean(value));
  return evidence.join(" · ") || "원문 근거 미기재";
}

function semanticProvenanceV125(row: SemanticObservationV125): string {
  const sourceLocation = [
    row.provenance.sourceFileDecoded,
    row.provenance.sourceSheet,
    Number.isFinite(row.provenance.sourceRow)
      ? `${row.provenance.sourceRow}행`
      : null,
  ]
    .filter((value): value is string => Boolean(value))
    .join(" · ");
  return [row.provenance.citationLocator, sourceLocation]
    .filter((value): value is string => Boolean(value))
    .join(" · ") || "원문 위치 미기재";
}

function SemanticSourceV125({ row }: { row: SemanticObservationV125 }) {
  const organization = row.provenance.sourceOrg || "기관 미기재";
  if (!isHttpUrlV121(row.provenance.sourceUrl)) return <>{organization}</>;
  return (
    <>
      {organization}{" "}
      <a
        href={row.provenance.sourceUrl}
        target="_blank"
        rel="noreferrer"
        aria-label={`${organization} 원자료 열기`}
      >
        원자료
      </a>
    </>
  );
}

function TextEvidenceV125({ rows }: { rows: SemanticObservationV125[] }) {
  return (
    <section className="sv125-primary" aria-label="구조화된 근거">
      <div className="sv125-section-heading">
        <span>주 시각화</span>
        <h4>구조화된 근거</h4>
      </div>
      <div className="sv125-evidence-grid">
        {rows.map((row) => (
          <article key={row.recordId}>
            <strong>{row.displayLabel}</strong>
            <p>{formatValueV121(row.value)}</p>
            <small>
              기준시점: {row.year || row.period || row.provenance.referenceYear || "미기재"}
            </small>
            <small>
              출처: <SemanticSourceV125 row={row} />
            </small>
            <small>결측 사유: {semanticMissingReasonV125(row)}</small>
            <small>원문 근거: {semanticEvidenceV125(row)}</small>
            <small>추적 정보: {semanticProvenanceV125(row)}</small>
          </article>
        ))}
      </div>
    </section>
  );
}

function EntityCollectionV125({
  entities,
  countryNameKo,
  renderer,
}: {
  entities: VietnamEntityV124[];
  countryNameKo: string;
  renderer: ElementVisualizationContractV125["primaryRenderer"];
}) {
  const shown = entities.slice(0, 12);
  return (
    <section className="sv125-primary" aria-label="목록 자료 미리보기">
      <div className="sv125-section-heading">
        <span>주 시각화 · {rendererLabelV125(renderer)}</span>
        <h4>{entities.length.toLocaleString("ko-KR")}개 레코드</h4>
      </div>
      <div className="sv125-evidence-grid">
        {shown.map((entity) => (
          <article key={entity.recordId}>
            <strong>{entityDisplayNameV121(entity)}</strong>
            <p>{entity.entityType || countryNameKo}</p>
            <small>{entity.note || entity.provenance.sourceOrg || "세부 속성은 전체 표에서 확인"}</small>
          </article>
        ))}
      </div>
      {entities.length > shown.length && (
        <p className="sv125-preview-note">
          대표 {shown.length}건을 미리 표시합니다. 나머지 {entities.length - shown.length}건은
          아래 전체 원자료 표에서 누락 없이 검색·페이지 이동할 수 있습니다.
        </p>
      )}
    </section>
  );
}

function SemanticTableFallbackV125({ rows }: { rows: SemanticObservationV125[] }) {
  return (
    <details className="sv125-table-fallback" data-v125-table-fallback="semantic-observations">
      <summary>차트 표 대체 보기 · {rows.length.toLocaleString("ko-KR")}건</summary>
      <div className="cdp-table-wrap">
        <table className="cdp-table">
          <thead>
            <tr>
              <th>계열</th>
              <th>측정항목</th>
              <th>분류</th>
              <th>값</th>
              <th>단위</th>
              <th>연도·기간</th>
              <th>출처</th>
              <th>결측 사유</th>
              <th>원문 근거</th>
              <th>추적 정보</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.recordId}>
                <td>{row.displayLabel}</td>
                <td>{row.semanticMeasure.labelKo}</td>
                <td>
                  {Object.entries(row.dimensionLabels)
                    .filter(([key]) => key !== "year" && key !== "period")
                    .map(([key, value]) => `${key}: ${value}`)
                    .join(" · ") || "—"}
                </td>
                <td>{formatValueV121(row.value)}</td>
                <td>{row.unit || row.semanticMeasure.unit || "—"}</td>
                <td>{row.year || row.period || "—"}</td>
                <td><SemanticSourceV125 row={row} /></td>
                <td>{semanticMissingReasonV125(row)}</td>
                <td>{semanticEvidenceV125(row)}</td>
                <td>{semanticProvenanceV125(row)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </details>
  );
}

function groupByUnitV125(rows: NumericSemanticObservation[]) {
  const map = rows.reduce((groups, row) => {
    const unit = row.unit || row.semanticMeasure.unit || "";
    const bucket = groups.get(unit) || [];
    bucket.push(row);
    groups.set(unit, bucket);
    return groups;
  }, new Map<string, NumericSemanticObservation[]>());
  return Array.from(map.entries())
    .map(([unit, values]) => ({ unit, rows: values }))
    .sort((left, right) => left.unit.localeCompare(right.unit, "ko"));
}

function nextDimensionSelectionsV125(
  current: Record<string, string>,
  key: string,
  value: string
): Record<string, string> {
  const next = { ...current };
  if (value) next[key] = value;
  else delete next[key];
  return next;
}

function dimensionValueLabelV125(key: string, value: string): string {
  if (key === "sex") {
    if (value === "total") return "전체";
    if (value === "male") return "남성";
    if (value === "female") return "여성";
  }
  return value;
}

function rendererLabelV125(
  renderer: ElementVisualizationContractV125["primaryRenderer"]
): string {
  const labels: Record<ElementVisualizationContractV125["primaryRenderer"], string> = {
    "kpi-trend": "핵심 지표와 추세",
    "multi-metric-trend": "복수 측정항목 추세",
    composition: "구성비",
    "category-comparison": "범주 비교",
    "paired-category-comparison": "짝지은 범주 비교",
    "score-benchmark": "점수·기준 비교",
    "scenario-range": "시나리오 범위",
    seasonality: "계절성",
    portfolio: "사업 포트폴리오",
    directory: "기관 디렉터리",
    "policy-timeline": "정책 타임라인",
    "evidence-matrix": "근거 매트릭스",
    "capability-scorecard": "역량 스코어카드",
    "document-library": "문서 라이브러리",
    "spatial-summary": "공간 분포 요약",
    "structured-table": "구조화 표",
    "status-only": "데이터 상태",
  };
  return labels[renderer];
}
