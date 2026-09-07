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
import { getPublicVisualizationSummaryV126 } from "../../../data/visualization/publicVisualizationRegistryV126";
import type { DataFinderSelectorStateV125 } from "../../../types/dataFinderV125";
import {
  formatValueV121,
} from "../../../utils/vietnamActualV121";
import { publicEntityTitleV131 } from "../../../data/visualization/publicEntityTitleV131";
import {
  publicMissingReasonLabelV126,
  publicSourceOrganizationV136_1,
  publicSourceUrlV126,
  publicTextV126,
} from "../../../data/visualization/publicFieldPolicyV126";
import {
  publicDimensionContextV136_2,
  publicDimensionLabelV126,
  publicDimensionValueV134,
  publicMeasureLabelV126,
} from "../../../data/visualization/publicCopyRegistryV126";
import { publicScaledNumberV136_2 } from "../../../utils/publicNumberScaleV136_2";
import { getPublicAnalysisHeadingsV134 } from "../../../data/visualization/publicAnalysisHeadingsV134";
import {
  PublicTermHelpV134,
  PublicTermTextV134,
} from "../../help/PublicTermV134";
import SemanticContractRendererV125 from "./SemanticContractRendererV125";
import "../../../styles/semantic-visualization-v125.css";

interface Props {
  contract: ElementVisualizationContractV125;
  semantics: ElementIndicatorSemanticsV125;
  observations: VietnamObservationV124[];
  entities: VietnamEntityV124[];
  countryNameKo: string;
  detailTemplate?: string;
  elementTitle?: string;
  selectorState: DataFinderSelectorStateV125;
  onSelectorStateChange: (state: DataFinderSelectorStateV125) => void;
  showRawTable?: boolean;
}

type NumericSemanticObservation = SemanticObservationV125 & { value: number };

const SERIES_PATTERNS_V125 = ["solid", "dashed", "dotted", "double"] as const;

function publicNoDataReasonV128(reason: string | null): string {
  switch (reason) {
    case "not-collected":
      return "공식 자료를 확보한 뒤 제공합니다.";
    case "schema-only":
      return "입력 항목만 있고 실제 값은 아직 없습니다.";
    case "explicit-placeholder-only":
    case "no-populated-record":
      return "실제 값은 입력 준비 중입니다.";
    default:
      return "현재 표시할 공개 값이 없습니다.";
  }
}

const EMPTY_DIMENSION_KEYS_V129: readonly string[] = Object.freeze([]);

export default function SemanticArchetypePreviewV125({
  contract,
  semantics,
  observations,
  entities,
  countryNameKo,
  detailTemplate,
  elementTitle,
  selectorState,
  onSelectorStateChange,
  showRawTable = true,
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
  const explicitDimensions = useMemo(
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
  const explicitMeasureIsKnown = contract.measures.some(
    (measure) => measure.key === selectorState.measure
  );
  const populatedDefaultMeasure = measureOptions.find((measure) =>
    semanticRows.some(
      (row) =>
        row.semanticMeasure.key === measure.key &&
        semanticRowMatchesDimensionsV125(row, explicitDimensions) &&
        isPopulatedSemanticRowV125(row)
    )
  );
  const preferredMeasureKey =
    getPublicVisualizationSummaryV126(contract.elementId)?.defaultMeasureKey;
  const preferredDefaultMeasure = preferredMeasureKey
    ? measureOptions.find(
        (measure) =>
          measure.key === preferredMeasureKey &&
          semanticRows.some(
            (row) =>
              row.semanticMeasure.key === measure.key &&
              semanticRowMatchesDimensionsV125(row, explicitDimensions) &&
              isPopulatedSemanticRowV125(row)
          )
      )
    : null;
  const measureKey = explicitMeasureIsValid || explicitMeasureIsKnown
    ? (selectorState.measure as string)
    : preferredDefaultMeasure?.key ||
      populatedDefaultMeasure?.key ||
      measureOptions[0]?.key ||
      null;
  const measureRows = semanticRows.filter(
    (row) => row.semanticMeasure.key === measureKey
  );
  const singleDenominatorDimensionKeys =
    getPublicVisualizationSummaryV126(contract.elementId)
      ?.singleDenominatorDimensionKeys || EMPTY_DIMENSION_KEYS_V129;
  const dimensions = useMemo(
    () =>
      Object.fromEntries(
        additionalDimensions.flatMap((dimension) => {
          const selected = explicitDimensions[dimension.key];
          if (selected) return [[dimension.key, selected]];
          if (!singleDenominatorDimensionKeys.includes(dimension.key)) return [];
          const populatedDefault = dimension.values.find((value) =>
            measureRows.some(
              (row) =>
                row.dimensions[dimension.key] === value &&
                isPopulatedSemanticRowV125(row)
            )
          );
          return populatedDefault
            ? [[dimension.key, populatedDefault]]
            : [];
        })
      ),
    [
      additionalDimensions,
      explicitDimensions,
      measureRows,
      singleDenominatorDimensionKeys,
    ]
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
    measureRows.length === 0
      ? selectorState.period
      : selectorState.period && periods.includes(selectorState.period)
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
    measureRows.length === 0
      ? selectorState.year
      : selectorState.year !== null && years.includes(selectorState.year)
      ? selectorState.year
      : populatedDefaultYear ?? years[0] ?? null;
  const dimensionFilteredRows = periodContextRows;

  useEffect(() => {
    const next: DataFinderSelectorStateV125 = {
      measure: measureKey,
      sex,
      year,
      period,
      dimensions:
        measureRows.length === 0 ? selectorState.dimensions : dimensions,
    };
    if (!dataFinderSelectorStatesEqualV125(next, selectorState)) {
      onSelectorStateChange(next);
    }
  }, [dimensions, measureKey, measureRows.length, onSelectorStateChange, period, selectorState, sex, year]);

  if (contract.primaryRenderer === "status-only") {
    return (
      <section
        className="sv125-status"
        data-testid="public-status-only"
        data-public-empty-reason="no-populated-records"
      >
        <div data-testid="public-primary-visualization">
          <strong>아직 공개된 값이 없습니다</strong>
          <p>{publicNoDataReasonV128(contract.noDataReason)}</p>
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
  const visualizationTableRows = semanticRows;
  const rendererLabel = rendererLabelV125(contract.primaryRenderer);
  const publicHeadings = getPublicAnalysisHeadingsV134(contract.elementId);

  return (
    <div
      className="sv125-shell"
      data-testid="public-analytical-view"
    >
      {!publicHeadings && (
        <section className="sv125-intro" aria-labelledby="sv125-intro-title">
          <span>분석 안내</span>
          <h3 id="sv125-intro-title">
            <PublicTermTextV134 text={elementTitle || rendererLabel} />
          </h3>
          <p>
            <PublicTermTextV134
              text={publicAnalysisIntroV126(
                contract,
                observations.length,
                entities.length
              )}
            />
          </p>
        </section>
      )}

      <div className="sv125-controls" aria-label="데이터 분류 선택" data-testid="public-selector">
        {measureOptions.length > 1 && (
          <label>
            <span>항목</span>
            <select
              aria-label="항목 선택"
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
                  {publicMeasureLabelV126(measure.labelKo)} · {publicTextV126(measure.unit) || "단위 미기재"}
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
            <span>{publicDimensionLabelV126(dimension.key, dimension.labelKo)}</span>
            <select
              aria-label={`${publicDimensionLabelV126(
                dimension.key,
                dimension.labelKo
              )} 선택`}
              data-public-dimension-key={dimension.key}
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
              {!singleDenominatorDimensionKeys.includes(dimension.key) && (
                <option value="">전체</option>
              )}
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
        <PublicTermHelpV134
          text={[
            publicMeasureLabelV126(
              measureOptions.find((measure) => measure.key === measureKey)?.labelKo || ""
            ),
            measureOptions.find((measure) => measure.key === measureKey)?.unit,
            ...additionalDimensions.map((dimension) => {
              const value = dimensions[dimension.key];
              return value ? dimensionValueLabelV125(dimension.key, value) : "";
            }),
            period || "",
          ].filter(Boolean).join(" · ")}
        />
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
          detailTemplate={detailTemplate}
          elementTitle={elementTitle}
          markEntityTableAsPublic={showRawTable && visualizationTableRows.length === 0}
          showRawTable={showRawTable}
        />
      )}

      {missingRows.length > 0 && (
        <div className="sv125-missing" role="note">
          <strong>결측 {missingRows.length.toLocaleString("ko-KR")}건</strong>
          <span>
            {Array.from(
              new Set(
                missingRows.map(
                  (row) =>
                    publicMissingReasonLabelV126(
                      row.missingReasonCode,
                      row.note
                    ) || "원천에서 값을 제공하지 않음"
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
            data-public-empty-reason="selection-has-no-values"
          >
            <strong>현재 선택 조건에 표시할 값이 없습니다</strong>
            <p>다른 항목이나 기간을 선택해 확인해 주세요.</p>
          </div>
        )}

      {showRawTable && visualizationTableRows.length > 0 && (
        <SemanticTableFallbackV125 rows={visualizationTableRows} />
      )}
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
  if (!rows.some(isPopulatedSemanticRowV125)) return null;

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
    const dimensionValues = row
      ? publicDimensionContextV136_2(row.dimensionLabels)
      : [];
    return { measure, row, dimensionValues };
  });
  return (
    <section
      className="sv125-kpis"
      aria-label="현재 선택 조건의 핵심 KPI"
      data-testid="public-context-kpis"
      data-public-has-values={kpis.some(({ row }) => Boolean(row)) ? "true" : "false"}
    >
      {kpis.map(({ measure, row, dimensionValues }) => {
        const unit = row?.unit || measure.unit;
        // A headline reads in 억/조; the exact figure stays on the value itself
        // so hovering, the details table and the download all still carry it.
        const scaled =
          row && typeof row.value === "number" && Number.isFinite(row.value)
            ? publicScaledNumberV136_2(row.value, unit)
            : null;
        return (
          <article
            key={`${measure.key}-${measure.unit}`}
            data-public-dimension-count={dimensionValues.length}
            data-public-dimension-values={JSON.stringify(dimensionValues)}
          >
            <span><PublicTermTextV134 text={publicMeasureLabelV126(measure.labelKo)} /></span>
            <strong
              title={scaled?.scaled ? `${scaled.exact}${unit ? ` ${unit}` : ""}` : undefined}
              data-public-exact-value={scaled?.scaled ? scaled.exact : undefined}
            >
              {scaled ? scaled.display : row ? formatValueV121(row.value) : "미제공"}
            </strong>
            <small>
              <PublicTermTextV134 text={row
                ? [unit, row.year || row.period, ...dimensionValues]
                    .filter(Boolean)
                    .join(" · ")
                : measure.unit || "단위 미기재"} />
            </small>
          </article>
        );
      })}
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
    <section className="sv125-primary" aria-label="항목별 값 비교">
      <div className="sv125-section-heading">
        <span>주 시각화</span>
        <h4>항목별 값</h4>
      </div>
      {groups.map(({ unit, rows: unitRows }) => {
        const max = Math.max(...unitRows.map((row) => Math.abs(row.value)), 1e-9);
        return (
          <article className="sv125-axis-group" key={unit}>
            <h5>단위: <PublicTermTextV134 text={unit || "미기재"} /></h5>
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
                    <strong><PublicTermTextV134 text={row.displayLabel} /></strong>
                    <small>{row.year || row.period || "기준시점 미기재"}</small>
                  </div>
                  <span className={`sv125-pattern sv125-pattern--${SERIES_PATTERNS_V125[index % SERIES_PATTERNS_V125.length]}`}>
                    <i style={{ width: `${Math.max(2, (Math.abs(row.value) / max) * 100)}%` }} />
                  </span>
                  <b><PublicTermTextV134 text={`${formatValueV121(row.value)} ${unit}`} /></b>
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
      <h5>단위: <PublicTermTextV134 text={unit || "미기재"} /></h5>
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
            <i /> <PublicTermTextV134 text={item.label} />
          </span>
        ))}
      </div>
    </article>
  );
}

function semanticMissingReasonV125(row: SemanticObservationV125): string {
  const reason = publicMissingReasonLabelV126(row.missingReasonCode, row.note);
  if (reason) return reason;
  if (row.value === null || row.value === undefined || row.value === "") {
    return "원천에서 값을 제공하지 않음";
  }
  return "";
}

function semanticEvidenceV125(row: SemanticObservationV125): string {
  return publicTextV126(row.provenance.citationLocator) || "";
}

function SemanticSourceV125({ row }: { row: SemanticObservationV125 }) {
  const organization = publicSourceOrganizationV136_1(row.provenance.sourceOrg) || "기관 미기재";
  const sourceUrl = publicSourceUrlV126(row.provenance.sourceUrl);
  if (!sourceUrl) return <PublicTermTextV134 text={organization} />;
  return (
    <>
      <PublicTermTextV134 text={organization} />{" "}
      <a
        href={sourceUrl}
        target="_blank"
        rel="noreferrer"
        aria-label={`${organization} 공식 원문 열기`}
      >
        공식 원문
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
            <strong><PublicTermTextV134 text={publicMeasureLabelV126(row.displayLabel)} /></strong>
            <p><PublicTermTextV134 text={formatValueV121(row.value)} /></p>
            <small>
              기준시점: {row.year || row.period || row.provenance.referenceYear || "미기재"}
            </small>
            <small>
              출처: <SemanticSourceV125 row={row} />
            </small>
            <small>결측 사유: {semanticMissingReasonV125(row)}</small>
            {semanticEvidenceV125(row) && (
              <small>공식 인용: {semanticEvidenceV125(row)}</small>
            )}
          </article>
        ))}
      </div>
    </section>
  );
}

function SemanticTableFallbackV125({ rows }: { rows: SemanticObservationV125[] }) {
  return (
    <details
      className="sv125-table-fallback"
      data-testid="public-raw-table"
    >
      <summary>상세 데이터 · {rows.length.toLocaleString("ko-KR")}건</summary>
      <div className="cdp-table-wrap">
        <table className="cdp-table">
          <thead>
            <tr>
              <th>항목</th>
              <th>분류</th>
              <th>지역·성별·기술·시나리오</th>
              <th>값</th>
              <th>단위</th>
              <th>연도·기간</th>
              <th>출처</th>
              <th>결측 사유</th>
              <th>공식 원문</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.recordId}>
                <td><PublicTermTextV134 text={publicMeasureLabelV126(row.semanticMeasure.labelKo)} /></td>
                <td>
                  <PublicTermTextV134 text={Object.entries(row.dimensionLabels)
                    .filter(([key]) =>
                      !["year", "period", "region", "regionName", "sex", "technology", "scenario"].includes(key)
                    )
                    .map(([, value]) => publicTextV126(value))
                    .filter(Boolean)
                    .join(" · ") || ""} />
                </td>
                <td>
                  <PublicTermTextV134 text={Object.entries(row.dimensionLabels)
                    .filter(([key]) =>
                      ["region", "regionName", "sex", "technology", "scenario"].includes(key)
                    )
                    .map(([, value]) => publicTextV126(value))
                    .filter(Boolean)
                    .join(" · ") || ""} />
                </td>
                <td><PublicTermTextV134 text={formatValueV121(row.value)} /></td>
                <td><PublicTermTextV134 text={row.unit || row.semanticMeasure.unit || "—"} /></td>
                <td>{row.year || row.period || "—"}</td>
                <td><SemanticSourceV125 row={row} /></td>
                <td><PublicTermTextV134 text={semanticMissingReasonV125(row)} /></td>
                <td><PublicTermTextV134 text={semanticEvidenceV125(row)} /></td>
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
  return publicDimensionValueV134(key, value);
}

function rendererLabelV125(
  renderer: ElementVisualizationContractV125["primaryRenderer"]
): string {
  const labels: Record<ElementVisualizationContractV125["primaryRenderer"], string> = {
    "kpi-trend": "핵심 지표와 추세",
    "multi-metric-trend": "복수 항목 추세",
    composition: "구성비",
    "category-comparison": "항목별 비교",
    "paired-category-comparison": "연관 항목 비교",
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

function publicAnalysisIntroV126(
  contract: ElementVisualizationContractV125,
  observationCount: number,
  entityCount: number,
  publicQuestion?: string
): string {
  if (observationCount === 0 && entityCount > 0) {
    if (contract.elementId === "E-018") {
      return `진출 기업 ${entityCount.toLocaleString("ko-KR")}곳을 진출 형태와 사업 분야별로 탐색할 수 있습니다.`;
    }
    if (contract.elementId === "E-019") {
      return `현지 기관 ${entityCount.toLocaleString("ko-KR")}곳을 도시와 공개 연락정보로 탐색할 수 있습니다.`;
    }
    if (contract.elementId === "E-020") {
      return `지원 프로그램 ${entityCount.toLocaleString("ko-KR")}건을 지원 유형과 기관별로 탐색할 수 있습니다.`;
    }
    if (contract.primaryRenderer === "directory") {
      return `기관·연락망 ${entityCount.toLocaleString("ko-KR")}건을 지역과 공개 연락정보로 탐색할 수 있습니다.`;
    }
    if (contract.primaryRenderer === "portfolio") {
      return `사업·지원 프로그램 ${entityCount.toLocaleString("ko-KR")}건을 유형과 기관별로 탐색할 수 있습니다.`;
    }
    return `공개 목록 ${entityCount.toLocaleString("ko-KR")}건의 항목별 정보를 확인할 수 있습니다.`;
  }
  return (
    publicQuestion ||
    "공개된 지표의 기준시점별 값과 항목 간 차이를 확인할 수 있습니다."
  );
}
