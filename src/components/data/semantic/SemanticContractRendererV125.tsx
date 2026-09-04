import { publicScaledNumberV136_2 } from "../../../utils/publicNumberScaleV136_2";
import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import type {
  ElementVisualizationContractV125,
  SemanticObservationV125,
} from "../../../data/visualization/semanticTypesV125";
import type { VietnamEntityV124 } from "../../../data/vietnam/vietnamTypesV124";
import {
  formatValueV121,
} from "../../../utils/vietnamActualV121";
import {
  approvedEntityAttributesV126,
  publicEntityAttributeLabelV126,
  publicMissingReasonLabelV126,
  publicSourceOrganizationV136_1,
  publicSourceUrlV126,
  publicTextV126,
} from "../../../data/visualization/publicFieldPolicyV126";
import InteractiveTimeSeriesChartV127 from "../../charts/InteractiveTimeSeriesChartV127";
import type {
  ChartLinePatternV127,
  ChartMarkerShapeV127,
  TimeSeriesV127,
} from "../../../types/chartInteractionV127";
import { getPublicFixedDomainV127 } from "../../../data/visualization/publicVisualizationRegistryV126";
import { publicEntityTitleV131 } from "../../../data/visualization/publicEntityTitleV131";
import { getPublicAnalysisHeadingsV134 } from "../../../data/visualization/publicAnalysisHeadingsV134";
import {
  publicDimensionValueV134,
  publicMetricLabelV136_2,
} from "../../../data/visualization/publicCopyRegistryV126";
import PublicEntityCardGridV131 from "../public/PublicEntityCardGridV131";
import PublicPortfolioListV132 from "../public/PublicPortfolioListV132";
import PublicPortfolioSummaryV132 from "../public/PublicPortfolioSummaryV132";
import { PublicTermTextV134 } from "../../help/PublicTermV134";

import "./semantic-contract-renderer-v125.css";

type RendererV125 = ElementVisualizationContractV125["primaryRenderer"];
type NumericRowV125 = SemanticObservationV125 & { value: number };
type PresentRowV125 = SemanticObservationV125 & {
  value: number | string | boolean;
};

interface Props {
  contract: ElementVisualizationContractV125;
  rows: SemanticObservationV125[];
  contextRows: SemanticObservationV125[];
  entities: VietnamEntityV124[];
  countryNameKo: string;
  detailTemplate?: string;
  elementTitle?: string;
  markEntityTableAsPublic?: boolean;
  showRawTable?: boolean;
}

const SERIES_PATTERNS = ["solid", "dashed", "dotted", "double"] as const;

const PUBLIC_PORTFOLIO_ELEMENTS_V132 = new Set([
  "D-012",
  "D-013",
  "D-014",
  "D-015",
  "D-016",
  "D-017",
  "D-018",
  "D-019",
  "D-020",
  "D-021",
  "D-022",
  "D-023",
  "D-024",
  "D-025",
  "D-026",
]);

export default function SemanticContractRendererV125({
  contract,
  rows,
  contextRows,
  entities,
  countryNameKo,
  detailTemplate,
  elementTitle,
  markEntityTableAsPublic = false,
  showRawTable = true,
}: Props) {
  const renderer = contract.primaryRenderer;
  const presentRows = rows.filter(isPresentRowV125);
  const numericRows = presentRows.filter(isNumericRowV125);
  const textRows = presentRows.filter(
    (row) => typeof row.value !== "number"
  );
  const publicHeadings = getPublicAnalysisHeadingsV134(contract.elementId);

  return (
    <section
      className="sv125-contract-renderer"
      data-testid="public-primary-visualization"
      data-unit-axis-policy="one-unit-per-axis"
      data-zero-imputation="false"
      aria-label={`${
        publicHeadings?.primaryChartTitle || rendererLabelV125(renderer)
      } 주 분석`}
    >
      {publicHeadings && (
        <header className="sv125-section-heading" data-testid="public-analysis-heading-v134">
          <span>주 분석</span>
          <h3>{publicHeadings.primaryChartTitle}</h3>
        </header>
      )}
      {renderer === "policy-timeline" ? (
        <PolicyTimelineV125 rows={presentRows} entities={entities} />
      ) : renderer === "evidence-matrix" ? (
        <EvidenceMatrixV125 rows={presentRows} entities={entities} />
      ) : (
        <>
          {renderObservationPanelV125(
            contract.elementId,
            renderer,
            presentRows,
            numericRows,
            textRows,
            contextRows
          )}
          {renderEntityPanelV125(
            renderer,
            entities,
            contract,
            countryNameKo,
            detailTemplate,
            elementTitle
          )}
        </>
      )}
      {showRawTable && entities.length > 0 && (
        <EntityTableFallbackV125
          entities={entities}
          markAsPublic={markEntityTableAsPublic}
        />
      )}
    </section>
  );
}

function renderObservationPanelV125(
  elementId: string,
  renderer: RendererV125,
  presentRows: PresentRowV125[],
  numericRows: NumericRowV125[],
  textRows: PresentRowV125[],
  contextRows: SemanticObservationV125[]
) {
  switch (renderer) {
    case "composition":
      return <CompositionPanelV125 rows={numericRows} />;
    case "scenario-range":
      return (
        <>
          <ScenarioRangePanelV125 rows={numericRows} />
          {textRows.length > 0 && <EvidenceCardsV125 rows={textRows} />}
        </>
      );
    case "seasonality":
      return <SeasonalityPanelV125 rows={presentRows} />;
    case "paired-category-comparison":
      return <PairedCategoryPanelV125 rows={presentRows} />;
    case "score-benchmark":
      return (
        <>
          <ScoreBenchmarkPanelV125
            contextRows={contextRows}
            elementId={elementId}
            rows={numericRows}
          />
          {textRows.length > 0 && <EvidenceCardsV125 rows={textRows} />}
        </>
      );
    case "capability-scorecard":
      return (
        <CapabilityScorecardV125
          elementId={elementId}
          rows={presentRows}
          numericRows={numericRows}
          contextRows={contextRows}
        />
      );
    case "policy-timeline":
      return <PolicyTimelineV125 rows={presentRows} entities={[]} />;
    case "evidence-matrix":
      return <EvidenceMatrixV125 rows={presentRows} entities={[]} />;
    case "portfolio":
      return numericRows.length > 0 ? (
        <MetricCardsV125 rows={numericRows} title="포트폴리오 핵심 수치" />
      ) : textRows.length > 0 ? (
        <EvidenceCardsV125 rows={textRows} />
      ) : null;
    case "document-library":
      return numericRows.length > 0 ? (
        <MetricCardsV125 rows={numericRows} title="문헌·성과 집계" />
      ) : null;
    case "spatial-summary":
      return numericRows.length > 0 ? (
        <MetricCardsV125 rows={numericRows} title="공간 데이터 핵심 수치" />
      ) : textRows.length > 0 ? (
        <EvidenceCardsV125 rows={textRows} />
      ) : null;
    case "kpi-trend":
    case "multi-metric-trend":
      return (
        <>
          <TrendPanelV125 elementId={elementId} rows={contextRows} />
          {textRows.length > 0 && <EvidenceCardsV125 rows={textRows} />}
        </>
      );
    case "structured-table":
      return presentRows.length > 0 ? (
        <section className="sv125-contract-note" role="note">
          <strong>구조화 표에 적합한 데이터</strong>
          <span>
            수치 축으로 변환하지 않고 아래 상세 데이터에서 공개된 값을
            유지합니다.
          </span>
        </section>
      ) : null;
    case "directory":
      return textRows.length > 0 ? <EvidenceCardsV125 rows={textRows} /> : null;
    case "category-comparison":
    default:
      return (
        <>
          {numericRows.length > 0 && <CategoryComparisonV125 rows={numericRows} />}
          {textRows.length > 0 && <EvidenceCardsV125 rows={textRows} />}
        </>
      );
  }
}

function renderEntityPanelV125(
  renderer: RendererV125,
  entities: VietnamEntityV124[],
  contract: ElementVisualizationContractV125,
  countryNameKo: string,
  detailTemplate?: string,
  elementTitle?: string
) {
  if (entities.length === 0) return null;
  if (PUBLIC_PORTFOLIO_ELEMENTS_V132.has(contract.elementId)) {
    return (
      <PortfolioEntitiesV125
        elementId={contract.elementId}
        entities={entities}
        detailTemplate={detailTemplate}
        elementTitle={elementTitle}
      />
    );
  }
  switch (renderer) {
    case "portfolio":
      return (
        <PortfolioEntitiesV125
          elementId={contract.elementId}
          entities={entities}
          detailTemplate={detailTemplate}
          elementTitle={elementTitle}
        />
      );
    case "directory":
      return (
        <DirectoryEntitiesV125
          entities={entities}
          detailTemplate={detailTemplate}
          elementTitle={elementTitle}
        />
      );
    case "policy-timeline":
      return <PolicyTimelineV125 rows={[]} entities={entities} />;
    case "evidence-matrix":
    case "capability-scorecard":
      return <EvidenceMatrixV125 rows={[]} entities={entities} />;
    case "document-library":
      return (
        <DocumentLibraryV125
          entities={entities}
          detailTemplate={detailTemplate}
          elementTitle={elementTitle}
        />
      );
    case "spatial-summary":
      return (
        <SpatialSummaryV125
          entities={entities}
          contract={contract}
          countryNameKo={countryNameKo}
        />
      );
    default:
      return (
        <GenericEntitiesV125
          entities={entities}
          countryNameKo={countryNameKo}
          detailTemplate={detailTemplate}
          elementTitle={elementTitle}
        />
      );
  }
}

function CompositionPanelV125({ rows }: { rows: NumericRowV125[] }) {
  if (rows.length === 0) return null;
  return (
    <VisualizationFrameV125 eyebrow="구성비" title="분류별 구성">
      <p className="sv125-contract-help">
        공개된 백분율은 100을 기준으로 표시하며, 포함관계가 다른 항목을 임의로
        재정규화하지 않습니다.
      </p>
      {groupByUnitV125(rows).map(({ unit, rows: unitRows }) => {
        const hasBroadIndustry = unitRows.some((row) =>
          /광공업|industry.*construction/i.test(categoryLabelV125(row))
        );
        const hasManufacturingSubset = unitRows.some((row) =>
          /제조업|manufactur/i.test(categoryLabelV125(row))
        );
        const compositionRows =
          hasBroadIndustry && hasManufacturingSubset
            ? unitRows.filter(
                (row) => !/제조업|manufactur/i.test(categoryLabelV125(row))
              )
            : unitRows;
        const nonNegative = compositionRows.every((row) => row.value >= 0);
        const max = unit.includes("%")
          ? 100
          : Math.max(...compositionRows.map((row) => Math.abs(row.value)), 1e-9);
        return (
          <article className="sv125-contract-axis" key={unit || "no-unit"}>
            <h5>단위: {unit || "미기재"}</h5>
            {hasBroadIndustry && hasManufacturingSubset && (
              <p className="sv125-contract-help">
                제조업은 광공업·건설에 포함되므로 100% 구성 막대에서
                중복하지 않습니다. 상세 데이터에서 별도 항목으로 확인할 수
                있습니다.
              </p>
            )}
            {!nonNegative && (
              <p className="sv125-contract-warning">
                음수 값이 있어 구성 막대를 만들지 않고 값을 그대로 표시합니다.
              </p>
            )}
            <div className="sv125-composition-list" role="list">
              {compositionRows.map((row, index) => (
                <InteractiveValueItemV127
                  className="sv125-composition-row"
                  key={row.recordId}
                  label={categoryLabelV125(row)}
                  value={formatValueV121(row.value)}
                  unit={unit}
                >
                  <div>
                    <i
                      className={`sv125-contract-pattern sv125-contract-pattern--${SERIES_PATTERNS[index % SERIES_PATTERNS.length]}`}
                      aria-hidden="true"
                    />
                    <strong><PublicTermTextV134 text={categoryLabelV125(row)} /></strong>
                  </div>
                  <span className="sv125-composition-track" aria-hidden="true">
                    {nonNegative && (
                      <i
                        style={{
                          width: `${Math.min(100, (row.value / max) * 100)}%`,
                        }}
                      />
                    )}
                  </span>
                  <b>
                    {formatValueV121(row.value)} {unit}
                  </b>
                </InteractiveValueItemV127>
              ))}
            </div>
          </article>
        );
      })}
    </VisualizationFrameV125>
  );
}

function ScenarioRangePanelV125({ rows }: { rows: NumericRowV125[] }) {
  if (rows.length === 0) return null;
  return (
    <VisualizationFrameV125
      eyebrow="시나리오"
      title="동일 시점 시나리오 범위"
    >
      {groupByUnitV125(rows).map(({ unit, rows: unitRows }) => {
        const min = Math.min(...unitRows.map((row) => row.value));
        const max = Math.max(...unitRows.map((row) => row.value));
        const span = max - min;
        const ordered = [...unitRows].sort((left, right) =>
          scenarioLabelV125(left).localeCompare(
            scenarioLabelV125(right),
            "ko",
            { numeric: true }
          )
        );
        return (
          <article className="sv125-contract-axis" key={unit || "no-unit"}>
            <div className="sv125-range-summary">
              <span>관측 범위</span>
              <strong>
                {formatValueV121(min)}–{formatValueV121(max)} {unit}
              </strong>
            </div>
            <div className="sv125-scenario-list" role="list">
              {ordered.map((row, index) => {
                const position = span === 0 ? 50 : ((row.value - min) / span) * 100;
                return (
                  <div
                    className="sv125-scenario-row"
                    key={row.recordId}
                    role="listitem"
                    tabIndex={0}
                    aria-label={`${scenarioLabelV125(row)}, ${formatValueV121(
                      row.value
                    )} ${unit}`}
                  >
                    <strong><PublicTermTextV134 text={scenarioLabelV125(row)} /></strong>
                    <span className="sv125-range-track" aria-hidden="true">
                      <i
                        className={`sv125-contract-pattern--${SERIES_PATTERNS[index % SERIES_PATTERNS.length]}`}
                        style={{ left: `${position}%` }}
                      />
                    </span>
                    <b>
                      {formatValueV121(row.value)} {unit}
                    </b>
                  </div>
                );
              })}
            </div>
          </article>
        );
      })}
    </VisualizationFrameV125>
  );
}

function SeasonalityPanelV125({ rows }: { rows: PresentRowV125[] }) {
  if (rows.length === 0) return null;
  const ordered = [...rows].sort(
    (left, right) => seasonOrderV125(left) - seasonOrderV125(right)
  );
  return (
    <VisualizationFrameV125 eyebrow="기간 순서" title="계절·월별 패턴">
      <div className="sv125-season-grid" role="list">
        {ordered.map((row) => (
          <article key={row.recordId} role="listitem" tabIndex={0}>
            <span><PublicTermTextV134 text={seasonLabelV125(row)} /></span>
            <strong>{formatValueV121(row.value)}</strong>
            <small>
              {[row.unit, row.year || row.period].filter(Boolean).join(" · ") ||
                "기준정보 미기재"}
            </small>
          </article>
        ))}
      </div>
    </VisualizationFrameV125>
  );
}

function PairedCategoryPanelV125({ rows }: { rows: PresentRowV125[] }) {
  if (rows.length === 0) return null;
  const pairKey = pairedDimensionKeyV125(rows);
  if (!pairKey) {
    return (
      <VisualizationFrameV125 eyebrow="짝 비교" title="짝지을 분류 확인 필요">
        <p className="sv125-contract-warning">
          자료에 정확히 두 값을 가진 분류 차원이 없어 임의로 두 계열을 묶지
          않았습니다.
        </p>
        <EvidenceCardsV125 rows={rows} embedded />
      </VisualizationFrameV125>
    );
  }
  const pairValues = Array.from(
    new Set(rows.map((row) => row.dimensions[pairKey]).filter(Boolean))
  );
  const groups = new Map<string, PresentRowV125[]>();
  rows.forEach((row) => {
    const unit = row.unit || row.semanticMeasure.unit || "";
    const dimensions = Object.entries(row.dimensions)
      .filter(([key]) => ![pairKey, "year", "period"].includes(key))
      .sort(([left], [right]) => left.localeCompare(right, "ko"))
      .map(([key, value]) => `${key}=${value}`)
      .join("|");
    const key = `${row.semanticMeasure.key}|${unit}|${dimensions}`;
    const bucket = groups.get(key) || [];
    bucket.push(row);
    groups.set(key, bucket);
  });
  return (
    <VisualizationFrameV125 eyebrow="짝 비교" title="동일 범주의 두 계열">
      <div className="sv125-paired-grid">
        {Array.from(groups.entries()).map(([key, group]) => (
          <article key={key}>
            <h5><PublicTermTextV134 text={pairGroupLabelV125(group[0], pairKey)} /></h5>
            <div>
              {pairValues.map((value, index) => {
                const row = group.find((item) => item.dimensions[pairKey] === value);
                return (
                  <section key={value}>
                    <span>
                      <i
                        className={`sv125-contract-pattern sv125-contract-pattern--${SERIES_PATTERNS[index % SERIES_PATTERNS.length]}`}
                        aria-hidden="true"
                      />
                      <PublicTermTextV134 text={row?.dimensionLabels[pairKey] || value} />
                    </span>
                    <strong>{row ? formatValueV121(row.value) : "미제공"}</strong>
                    <small>
                      {row
                        ? row.unit || row.semanticMeasure.unit || "단위 미기재"
                        : "자료 없음"}
                    </small>
                  </section>
                );
              })}
            </div>
          </article>
        ))}
      </div>
    </VisualizationFrameV125>
  );
}

function ScoreBenchmarkPanelV125({
  rows,
  contextRows,
  elementId,
}: {
  rows: NumericRowV125[];
  contextRows: SemanticObservationV125[];
  elementId: string;
}) {
  if (rows.length === 0) return null;
  return (
    <>
      <MetricCardsV125 rows={rows} title="현재 점수" />
      <TrendPanelV125 elementId={elementId} rows={contextRows} />
    </>
  );
}

function CapabilityScorecardV125({
  rows,
  numericRows,
  contextRows,
  elementId,
}: {
  rows: PresentRowV125[];
  numericRows: NumericRowV125[];
  contextRows: SemanticObservationV125[];
  elementId: string;
}) {
  if (rows.length === 0) return null;
  const statusRows = rows.filter((row) => typeof row.value !== "number");
  return (
    <>
      <VisualizationFrameV125 eyebrow="역량" title="역량 상태 카드">
        <div className="sv125-capability-grid">
          {statusRows.map((row) => (
            <article key={row.recordId} tabIndex={0}>
              <span><PublicTermTextV134 text={row.displayLabel} /></span>
              <strong>{formatValueV121(row.value)}</strong>
              <small>
                {[row.unit, row.year || row.period].filter(Boolean).join(" · ") ||
                  "기준정보 미기재"}
              </small>
            </article>
          ))}
        </div>
      </VisualizationFrameV125>
      <ScoreBenchmarkPanelV125
        contextRows={contextRows}
        elementId={elementId}
        rows={numericRows}
      />
    </>
  );
}

/**
 * V135 temporal depth policy. A trend line is only honest when a single series
 * actually holds three or more populated years. One year becomes a category
 * comparison and two years become an explicit before/after change, so the
 * screen never shows "2026~2026년 추세" or a two-point line called a trend.
 */
function comparableYearCountV135(rows: NumericRowV125[]): number {
  const yearsBySeries = new Map<string, Set<number>>();
  rows.forEach((row) => {
    const bucket = yearsBySeries.get(row.seriesKey) || new Set<number>();
    bucket.add(row.year as number);
    yearsBySeries.set(row.seriesKey, bucket);
  });
  let maximum = 0;
  yearsBySeries.forEach((years) => {
    maximum = Math.max(maximum, years.size);
  });
  return maximum;
}

function TrendPanelV125({
  rows,
  elementId,
}: {
  rows: SemanticObservationV125[];
  elementId: string;
}) {
  const numericRows = rows.filter(
    (row): row is NumericRowV125 =>
      isNumericRowV125(row) && typeof row.year === "number"
  );
  if (numericRows.length === 0) return null;
  const unitGroups = groupByUnitV125(numericRows);
  const depth = comparableYearCountV135(numericRows);

  if (depth <= 1) {
    return <CategoryComparisonV125 rows={numericRows} />;
  }

  if (depth === 2) {
    return (
      <VisualizationFrameV125 eyebrow="기간 비교" title="기준연도 대비 변화">
        {unitGroups.map(({ unit, rows: unitRows }) => (
          <TwoYearChangeUnitV135
            key={unit || "no-unit"}
            rows={unitRows}
            unit={unit}
          />
        ))}
      </VisualizationFrameV125>
    );
  }

  return (
    <VisualizationFrameV125 eyebrow="연도별" title="항목 추세">
      {unitGroups.map(({ unit, rows: unitRows }) =>
        comparableYearCountV135(unitRows) >= 3 ? (
          <TrendUnitV125
            elementId={elementId}
            key={unit || "no-unit"}
            rows={unitRows}
            unit={unit}
          />
        ) : (
          <CategoryComparisonV125 key={unit || "no-unit"} rows={unitRows} />
        )
      )}
    </VisualizationFrameV125>
  );
}

function TwoYearChangeUnitV135({
  rows,
  unit,
}: {
  rows: NumericRowV125[];
  unit: string;
}) {
  const publicUnit = publicTextV126(unit) || "단위 미기재";
  const series = Array.from(
    rows.reduce((map, row) => {
      const bucket = map.get(row.seriesKey) || [];
      bucket.push(row);
      map.set(row.seriesKey, bucket);
      return map;
    }, new Map<string, NumericRowV125[]>())
  )
    .map(([key, values]) => {
      const ordered = [...values].sort(
        (left, right) => (left.year || 0) - (right.year || 0)
      );
      const first = ordered[0];
      const last = ordered[ordered.length - 1];
      if (!first || !last || first.year === last.year) return null;
      const delta = last.value - first.value;
      const percent =
        first.value === 0 ? null : (delta / Math.abs(first.value)) * 100;
      return {
        key,
        label:
          publicTextV126(first.displayLabel) || first.semanticMeasure.labelKo,
        first,
        last,
        delta,
        percent,
      };
    })
    .filter((item): item is NonNullable<typeof item> => item !== null);

  if (series.length === 0) return null;

  return (
    <article className="sv125-contract-axis">
      <h5>단위: {publicUnit}</h5>
      <div className="sv125-two-year-change-v135" role="list">
        {series.map((item) => (
          <div key={item.key} role="listitem">
            <strong><PublicTermTextV134 text={item.label} /></strong>
            <span>
              {item.first.year}년 {formatValueV121(item.first.value)} →{" "}
              {item.last.year}년 {formatValueV121(item.last.value)} {publicUnit}
            </span>
            <b>
              {item.delta > 0 ? "+" : ""}
              {formatValueV121(item.delta)} {publicUnit}
              {item.percent === null
                ? ""
                : " (" + (item.percent > 0 ? "+" : "") + item.percent.toFixed(1) + "%)"}
            </b>
          </div>
        ))}
      </div>
    </article>
  );
}

function TrendUnitV125({
  rows,
  unit,
  elementId,
}: {
  rows: NumericRowV125[];
  unit: string;
  elementId: string;
}) {
  const sourceSeries = Array.from(
    rows.reduce((map, row) => {
      const bucket = map.get(row.seriesKey) || [];
      bucket.push(row);
      map.set(row.seriesKey, bucket);
      return map;
    }, new Map<string, NumericRowV125[]>())
  ).map(([key, values]) => ({
    key,
    label:
      publicTextV126(values[0].displayLabel) ||
      values[0].semanticMeasure.labelKo,
    rows: values.sort((left, right) => (left.year || 0) - (right.year || 0)),
  }));
  const years = sourceSeries.flatMap((item) =>
    item.rows.map((row) => row.year as number)
  );
  const minYear = Math.min(...years);
  const maxYear = Math.max(...years);
  const publicUnit = publicTextV126(unit) || "단위 미기재";
  const patterns: ChartLinePatternV127[] = [
    "solid",
    "dash",
    "dot",
    "long-dash",
  ];
  const markers: ChartMarkerShapeV127[] = [
    "circle",
    "square",
    "diamond",
    "triangle",
    "cross",
  ];
  const series: TimeSeriesV127[] = sourceSeries.map((item, index) => ({
    id: item.key,
    label: item.label,
    unit: publicUnit,
    linePattern: patterns[index % patterns.length],
    marker: markers[index % markers.length],
    points: item.rows.map((row) => ({
      id: row.recordId,
      x: row.year as number,
      xLabel: `${row.year}년`,
      value: row.value,
    })),
  }));
  const fixedDomain = getPublicFixedDomainV127(
    elementId,
    Array.from(new Set(rows.map((row) => row.semanticMeasure.key)))
  );

  return (
    <article className="sv125-contract-axis">
      <InteractiveTimeSeriesChartV127
        ariaLabel={`${minYear}년부터 ${maxYear}년까지 ${publicUnit} 시계열`}
        formatDelta={(value) => `${value > 0 ? "+" : ""}${formatValueV121(value)}`}
        formatValue={formatValueV121}
        fixedYDomain={fixedDomain?.domain}
        minimumVisibleSeries={1}
        scaleDescription={fixedDomain?.scaleDescription}
        series={series}
        sharedYearTooltip
        title={`${minYear}~${maxYear}년 추세`}
        unit={publicUnit}
        xAxisTitle="연도"
        yAxisTitle="측정값"
        zoom={{
          enabled: maxYear > minYear,
          minimumSpan: Math.max(1, Math.floor((maxYear - minYear) / 5)),
        }}
      />
    </article>
  );
}

function CategoryComparisonV125({ rows }: { rows: NumericRowV125[] }) {
  if (rows.length === 0) return null;
  return (
    <VisualizationFrameV125 eyebrow="항목" title="항목별 값">
      {groupByUnitV125(rows).map(({ unit, rows: unitRows }) => {
        const max = Math.max(...unitRows.map((row) => Math.abs(row.value)), 1e-9);
        return (
          <article className="sv125-contract-axis" key={unit || "no-unit"}>
            <h5>단위: {unit || "미기재"}</h5>
            <div className="sv125-contract-bars" role="list">
              {unitRows.map((row, index) => (
                <InteractiveValueItemV127
                  key={row.recordId}
                  label={categoryLabelV125(row)}
                  value={formatValueV121(row.value)}
                  unit={unit}
                >
                  <strong><PublicTermTextV134 text={categoryLabelV125(row)} /></strong>
                  <span aria-hidden="true">
                    <i
                      className={`sv125-contract-pattern--${SERIES_PATTERNS[index % SERIES_PATTERNS.length]}`}
                      style={{ width: `${(Math.abs(row.value) / max) * 100}%` }}
                    />
                  </span>
                  <b>
                    {formatValueV121(row.value)} {unit}
                  </b>
                </InteractiveValueItemV127>
              ))}
            </div>
          </article>
        );
      })}
    </VisualizationFrameV125>
  );
}

function MetricCardsV125({
  rows,
  title,
}: {
  rows: NumericRowV125[];
  title: string;
}) {
  return (
    <VisualizationFrameV125 eyebrow="핵심 수치" title={title}>
      <div className="sv125-metric-grid" data-testid="public-metric-cards">
        {rows.map((row) => {
          const unit = observationUnitV125(row);
          const scaled = publicScaledNumberV136_2(row.value, unit);
          return (
          <article key={row.recordId}>
            <span><PublicTermTextV134 text={publicMetricLabelV136_2(row.displayLabel)} /></span>
            <strong
              title={scaled.scaled ? `${scaled.exact}${unit ? ` ${unit}` : ""}` : undefined}
              data-public-exact-value={scaled.scaled ? scaled.exact : undefined}
            >
              {scaled.display}
            </strong>
            <small>
              <PublicTermTextV134
                text={
                  [observationUnitV125(row), row.year || row.period]
                    .filter(Boolean)
                    .join(" · ") || "기준정보 미기재"
                }
              />
            </small>
          </article>
          );
        })}
      </div>
    </VisualizationFrameV125>
  );
}

function EvidenceCardsV125({
  rows,
  embedded = false,
}: {
  rows: PresentRowV125[];
  embedded?: boolean;
}) {
  const content = (
    <div className="sv125-contract-evidence-grid">
      {rows.slice(0, 24).map((row) => (
        <article key={row.recordId} tabIndex={0}>
          <strong><PublicTermTextV134 text={row.displayLabel} /></strong>
          <p><PublicTermTextV134 text={formatValueV121(row.value)} /></p>
          <small>
            <PublicTermTextV134
              text={
                [row.year || row.period, publicSourceOrganizationV136_1(row.provenance.sourceOrg)]
                  .filter(Boolean)
                  .join(" · ") || "기준정보 미기재"
              }
            />
          </small>
        </article>
      ))}
      {rows.length > 24 && (
        <p className="sv125-contract-overflow-note">
          나머지 {rows.length - 24}건은 아래 상세 데이터에서 확인할 수 있습니다.
        </p>
      )}
    </div>
  );
  return embedded ? (
    content
  ) : (
    <VisualizationFrameV125 eyebrow="근거" title="구조화된 확인 내용">
      {content}
    </VisualizationFrameV125>
  );
}

function PolicyTimelineV125({
  rows,
  entities,
}: {
  rows: PresentRowV125[];
  entities: VietnamEntityV124[];
}) {
  const items = [
    ...rows.map((row) => ({
      key: row.recordId,
      date: String(row.year || row.period || row.provenance.referenceYear || ""),
      title: row.displayLabel,
      detail: formatValueV121(row.value),
      sourceUrl: row.provenance.sourceUrl || "",
    })),
    ...entities.map((entity) => ({
      key: entity.recordId,
      date: entityFieldV125(entity, [
        "signedDate",
        "effectiveDate",
        "date",
        "year",
        "referenceYear",
      ]),
      title: publicEntityTitleV131(entity),
      detail:
        entityFieldV125(entity, ["status", "scope", "agreementType"]) ||
        publicTextV126(entity.note) ||
        "세부 내용은 상세 데이터에서 확인",
      sourceUrl: entityUrlV125(entity),
    })),
  ].sort((left, right) => timelineSortV125(left.date) - timelineSortV125(right.date));
  if (items.length === 0) return null;
  return (
    <VisualizationFrameV125 eyebrow="연대기" title="정책·협정 타임라인">
      <ol className="sv125-policy-timeline">
        {items.map((item) => (
          <li key={item.key}>
            <time>{item.date || "시점 미기재"}</time>
            <div>
              <strong><PublicTermTextV134 text={item.title} /></strong>
              <p><PublicTermTextV134 text={item.detail} /></p>
              {safeHttpUrlV125(item.sourceUrl) && (
                <a href={item.sourceUrl} target="_blank" rel="noreferrer">
                  원문 보기
                </a>
              )}
            </div>
          </li>
        ))}
      </ol>
    </VisualizationFrameV125>
  );
}

function EvidenceMatrixV125({
  rows,
  entities,
}: {
  rows: PresentRowV125[];
  entities: VietnamEntityV124[];
}) {
  const items = [
    ...rows.map((row) => ({
      key: row.recordId,
      area: categoryLabelV125(row),
      result: formatValueV121(row.value),
      basis: String(row.year || row.period || row.provenance.referenceYear || "—"),
    })),
    ...entities.map((entity) => ({
      key: entity.recordId,
      area:
        entityFieldV125(entity, ["category", "item", "topic", "sector"]) ||
        publicEntityTitleV131(entity),
      result:
        entityFieldV125(entity, ["content", "status", "result", "description"]) ||
        publicTextV126(entity.note) ||
        "세부 내용은 상세 데이터에서 확인",
      basis:
        entityFieldV125(entity, ["legalBasis", "referenceYear", "year"]) ||
        "—",
    })),
  ];
  if (items.length === 0) return null;
  return (
    <VisualizationFrameV125 eyebrow="확인 결과" title="항목별 확인 결과와 기준연도">
      <div className="sv125-matrix-wrap">
        <table className="sv125-evidence-matrix">
          <thead>
            <tr>
              <th scope="col">항목</th>
              <th scope="col">확인 결과</th>
              <th scope="col">기준연도·근거</th>
            </tr>
          </thead>
          <tbody>
            {items.slice(0, 40).map((item) => (
              <tr key={item.key}>
                <th scope="row"><PublicTermTextV134 text={item.area} /></th>
                <td><PublicTermTextV134 text={item.result} /></td>
                <td><PublicTermTextV134 text={item.basis} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {items.length > 40 && (
        <p className="sv125-contract-overflow-note">
          대표 40건을 표시합니다. 전체 {items.length}건은 상세 데이터에서 확인할 수
          있습니다.
        </p>
      )}
    </VisualizationFrameV125>
  );
}

function PortfolioEntitiesV125({
  elementId,
  entities,
  detailTemplate,
  elementTitle,
}: {
  elementId: string;
  entities: VietnamEntityV124[];
  detailTemplate?: string;
  elementTitle?: string;
}) {
  return (
    <VisualizationFrameV125 eyebrow="사업·재원" title="포트폴리오 분석">
      <PublicPortfolioSummaryV132
        elementId={elementId}
        entities={entities}
        detailTemplate={detailTemplate}
      />
      <PublicPortfolioListV132
        elementId={elementId}
        entities={entities}
        detailTemplate={detailTemplate}
        elementTitle={elementTitle}
      />
    </VisualizationFrameV125>
  );
}

function DirectoryEntitiesV125({
  entities,
  detailTemplate,
  elementTitle,
}: {
  entities: VietnamEntityV124[];
  detailTemplate?: string;
  elementTitle?: string;
}) {
  return (
    <VisualizationFrameV125 eyebrow="기관·연락망" title="기관 디렉터리">
      <PublicEntityCardGridV131
        entities={entities}
        template="directory"
        detailTemplate={detailTemplate}
        elementTitle={elementTitle}
      />
    </VisualizationFrameV125>
  );
}

function DocumentLibraryV125({
  entities,
  detailTemplate,
  elementTitle,
}: {
  entities: VietnamEntityV124[];
  detailTemplate?: string;
  elementTitle?: string;
}) {
  return (
    <VisualizationFrameV125 eyebrow="문헌·성과" title="문서 라이브러리">
      <PublicEntityCardGridV131
        entities={entities}
        template="document"
        detailTemplate={detailTemplate}
        elementTitle={elementTitle}
      />
    </VisualizationFrameV125>
  );
}

function SpatialSummaryV125({
  entities,
  contract,
  countryNameKo,
}: {
  entities: VietnamEntityV124[];
  contract: ElementVisualizationContractV125;
  countryNameKo: string;
}) {
  const coordinateCount = entities.filter(hasCoordinateV125).length;
  const geometryCount = entities.filter(
    (entity) => Boolean(entity.geometry || entity.geometryType)
  ).length;
  return (
    <VisualizationFrameV125 eyebrow="공간" title="공간 표현 가능 범위">
      <div className="sv125-spatial-kpis">
        <article><span>전체 개체</span><strong>{entities.length.toLocaleString("ko-KR")}</strong><small>건</small></article>
        <article><span>유효 좌표</span><strong>{coordinateCount.toLocaleString("ko-KR")}</strong><small>건</small></article>
        <article><span>공간정보 표기</span><strong>{geometryCount.toLocaleString("ko-KR")}</strong><small>건</small></article>
        <article><span>지도 연결 피처</span><strong>{contract.mapLinkage.featureCount.toLocaleString("ko-KR")}</strong><small>{contract.mapLinkage.enabled ? "지도 연결" : "공간자료 미확보"}</small></article>
      </div>
      <p className="sv125-contract-help">
        {countryNameKo} 상세 데이터만 요약하며, 이 화면에서 지도 공간자료를 미리
        내려받지 않습니다.
      </p>
      <div className="sv125-spatial-samples">
        {entities.slice(0, 8).map((entity) => (
          <article key={entity.recordId}>
            <strong>{publicEntityTitleV131(entity)}</strong>
            <span>{publicEntityTypeLabelV126(entity, "공간 자료")}</span>
            <small>
              {hasCoordinateV125(entity)
                ? `${entity.latitude}, ${entity.longitude}`
                : publicTextV126(entity.mapEligibilityReason) || "좌표·공간정보 미제공"}
            </small>
          </article>
        ))}
      </div>
      <PreviewCountNoteV125 shown={8} total={entities.length} />
    </VisualizationFrameV125>
  );
}


/**
 * Names the collection a detail screen lists.
 *
 * "주요 레코드" under "개체 목록" describes our storage. A reader on the
 * investment portfolio is looking at projects; on a partner screen, at
 * institutions. The archetype already knows which.
 */
function publicCollectionEyebrowV136_2(detailTemplate?: string): string {
  switch (detailTemplate) {
    case "project":
      return "사업";
    case "partner":
      return "기관";
    case "policy":
      return "정책";
    case "facility":
      return "시설";
    case "research":
      return "연구";
    default:
      return "목록";
  }
}

function publicCollectionTitleV136_2(detailTemplate?: string): string {
  switch (detailTemplate) {
    case "project":
      return "사업 목록";
    case "partner":
      return "기관 목록";
    case "policy":
      return "정책 목록";
    case "facility":
      return "시설 목록";
    case "research":
      return "연구성과";
    default:
      return "상세 데이터";
  }
}

function GenericEntitiesV125({
  entities,
  countryNameKo,
  detailTemplate,
  elementTitle,
}: {
  entities: VietnamEntityV124[];
  countryNameKo: string;
  detailTemplate?: string;
  elementTitle?: string;
}) {
  return (
    <VisualizationFrameV125
      eyebrow={publicCollectionEyebrowV136_2(detailTemplate)}
      title={publicCollectionTitleV136_2(detailTemplate)}
    >
      <PublicEntityCardGridV131
        entities={entities}
        template="generic"
        detailTemplate={detailTemplate}
        elementTitle={elementTitle || countryNameKo}
      />
    </VisualizationFrameV125>
  );
}

function EntityTableFallbackV125({
  entities,
  markAsPublic,
}: {
  entities: VietnamEntityV124[];
  markAsPublic: boolean;
}) {
  const shown = entities.slice(0, 100);
  return (
    <details
      className="sv125-entity-table-fallback"
      data-testid={markAsPublic ? "public-raw-table" : undefined}
    >
      <summary>
        {markAsPublic ? "상세 데이터" : "목록 자료 더 보기"} ·{" "}
        {entities.length.toLocaleString("ko-KR")}건
      </summary>
      <div className="sv125-matrix-wrap">
        <table>
          <thead>
            <tr>
              <th scope="col">명칭</th>
              <th scope="col">유형</th>
              <th scope="col">주요 속성</th>
              <th scope="col">출처</th>
              <th scope="col">결측·한계</th>
            </tr>
          </thead>
          <tbody>
            {shown.map((entity) => (
              <tr key={entity.recordId}>
                <th scope="row"><PublicTermTextV134 text={publicEntityTitleV131(entity)} /></th>
                <td><PublicTermTextV134 text={publicEntityTypeLabelV126(entity, "자료")} /></td>
                <td><PublicTermTextV134 text={entityFactsV125(entity)} /></td>
                <td><PublicTermTextV134 text={publicSourceOrganizationV136_1(entity.provenance.sourceOrg) || ""} /></td>
                <td><PublicTermTextV134 text={publicMissingReasonLabelV126(entity.missingReasonCode, entity.note) || ""} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {entities.length > shown.length && (
        <p className="sv125-contract-overflow-note">
          대표 100건을 표시합니다. 전체 목록은 아래 상세 데이터와 다운로드에서
          확인할 수 있습니다.
        </p>
      )}
    </details>
  );
}

function InteractiveValueItemV127({
  children,
  className = "",
  label,
  value,
  unit,
}: {
  children: ReactNode;
  className?: string;
  label: string;
  value: string;
  unit: string;
}) {
  const [visible, setVisible] = useState(false);
  const [pinned, setPinned] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!pinned) return undefined;
    const closeOutside = (event: PointerEvent) => {
      const target = event.target;
      if (target instanceof Node && !rootRef.current?.contains(target)) {
        setPinned(false);
        setVisible(false);
      }
    };
    document.addEventListener("pointerdown", closeOutside, true);
    return () => document.removeEventListener("pointerdown", closeOutside, true);
  }, [pinned]);

  const hideIfUnpinned = () => {
    if (!pinned) setVisible(false);
  };
  const togglePinned = () => {
    setPinned((current) => {
      const next = !current;
      setVisible(next);
      return next;
    });
  };

  return (
    <div
      className={`sv125-interactive-value ${className}`.trim()}
      ref={rootRef}
      role="listitem"
      tabIndex={0}
      data-chart-interactive-item="true"
      aria-label={`${label}, ${value}${unit ? ` ${unit}` : ""}`}
      onPointerEnter={() => setVisible(true)}
      onPointerLeave={hideIfUnpinned}
      onFocus={() => setVisible(true)}
      onBlur={hideIfUnpinned}
      onClick={togglePinned}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          togglePinned();
        }
        if (event.key === "Escape") {
          setPinned(false);
          setVisible(false);
        }
      }}
    >
      {children}
      {visible && (
        <div
          className="sv125-interactive-value__tooltip"
          data-testid="chart-tooltip"
          data-tooltip-pinned={pinned ? "true" : "false"}
          role="tooltip"
        >
          <strong>{label}</strong>
          <span>{value}{unit ? ` ${unit}` : ""}</span>
        </div>
      )}
    </div>
  );
}

function VisualizationFrameV125({
  eyebrow,
  title,
  children,
}: {
  eyebrow: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="sv125-contract-panel">
      <header>
        <span><PublicTermTextV134 text={eyebrow} /></span>
        <h4><PublicTermTextV134 text={title} /></h4>
      </header>
      {children}
    </section>
  );
}

function PreviewCountNoteV125({ shown, total }: { shown: number; total: number }) {
  if (total <= shown) return null;
  return (
    <p className="sv125-contract-overflow-note">
      대표 {shown}건을 표시합니다. 나머지 {total - shown}건은 아래 상세 데이터에서
      확인할 수 있습니다.
    </p>
  );
}

function isNumericRowV125(row: SemanticObservationV125): row is NumericRowV125 {
  return typeof row.value === "number" && Number.isFinite(row.value);
}

function isPresentRowV125(row: SemanticObservationV125): row is PresentRowV125 {
  return (
    row.value !== null &&
    row.value !== undefined &&
    row.value !== "" &&
    (typeof row.value === "number"
      ? Number.isFinite(row.value)
      : typeof row.value === "string" || typeof row.value === "boolean")
  );
}

function groupByUnitV125(rows: NumericRowV125[]) {
  const groups = new Map<string, NumericRowV125[]>();
  rows.forEach((row) => {
    const unit = observationUnitV125(row);
    const bucket = groups.get(unit) || [];
    bucket.push(row);
    groups.set(unit, bucket);
  });
  return Array.from(groups.entries())
    .map(([unit, values]) => ({ unit, rows: values }))
    .sort((left, right) => left.unit.localeCompare(right.unit, "ko"));
}

function observationUnitV125(row: SemanticObservationV125): string {
  return String(row.unit || row.semanticMeasure.unit || "").trim();
}

function categoryLabelV125(row: SemanticObservationV125): string {
  for (const key of [
    "category",
    "scenario",
    "technology",
    "region",
    "province",
    "detail",
    "sex",
  ]) {
    const label = row.dimensionLabels[key] || row.dimensions[key];
    if (label) return publicDimensionValueV134(key, label);
  }
  return publicTextV126(row.displayLabel) || row.semanticMeasure.labelKo;
}

function scenarioLabelV125(row: SemanticObservationV125): string {
  for (const key of ["scenario", "detail", "category", "pathway"]) {
    const label = row.dimensionLabels[key] || row.dimensions[key];
    if (label) return publicDimensionValueV134(key, label);
  }
  return publicTextV126(row.displayLabel) || row.semanticMeasure.labelKo;
}

function seasonLabelV125(row: SemanticObservationV125): string {
  for (const key of ["month", "period", "season", "detail", "category"]) {
    const label = row.dimensionLabels[key] || row.dimensions[key];
    if (label) return publicDimensionValueV134(key, label);
  }
  return (
    row.period ||
    publicTextV126(row.displayLabel) ||
    row.semanticMeasure.labelKo
  );
}

function seasonOrderV125(row: SemanticObservationV125): number {
  const label = seasonLabelV125(row).trim();
  const month = label.match(/^(\d{1,2})월/);
  if (month) return Number(month[1]);
  const quarter = label.match(/^(?:Q|분기\s*)([1-4])/i);
  if (quarter) return Number(quarter[1]) * 3;
  const seasons: Record<string, number> = {
    봄: 3,
    여름: 6,
    가을: 9,
    겨울: 12,
    건기: 1,
    우기: 7,
  };
  return seasons[label] || 99;
}

function pairedDimensionKeyV125(rows: PresentRowV125[]): string | null {
  const keys = Array.from(
    new Set(rows.flatMap((row) => Object.keys(row.dimensions)))
  ).filter((key) => !["year", "period"].includes(key));
  const candidates = keys.filter(
    (key) =>
      new Set(rows.map((row) => row.dimensions[key]).filter(Boolean)).size === 2
  );
  return candidates.find((key) => key === "sex") || candidates[0] || null;
}

function pairGroupLabelV125(row: PresentRowV125, pairKey: string): string {
  const labels = Object.entries(row.dimensionLabels)
    .filter(([key]) => ![pairKey, "year", "period"].includes(key))
    .map(([key, value]) => publicDimensionValueV134(key, value))
    .filter(Boolean);
  return labels.join(" · ") || row.semanticMeasure.labelKo;
}

function entityFieldV125(
  entity: VietnamEntityV124,
  keys: string[]
): string {
  for (const key of keys) {
    const normalized = scalarV125(entity.normalizedAttributes?.[key]);
    if (normalized) return normalized;
  }
  return "";
}

function approvedEntityFieldV126(
  entity: VietnamEntityV124,
  keys: string[]
): string {
  const attributes = approvedEntityAttributesV126(entity, "partner");
  for (const key of keys) {
    const value = scalarV125(attributes[key]);
    if (value) return value;
  }
  return "";
}

function scalarV125(value: unknown): string {
  if (value === null || value === undefined || value === "") return "";
  if (typeof value === "string") return publicTextV126(value) || "";
  if (typeof value === "number" || typeof value === "boolean") {
    return formatValueV121(value);
  }
  return "";
}

function entityUrlV125(entity: VietnamEntityV124): string {
  const candidate = (
    entityFieldV125(entity, [
      "sourceUrl",
      "recordSourceUrl",
      "websiteUrl",
      "website",
      "url",
    ]) ||
    entity.provenance.sourceUrl ||
    ""
  );
  return publicSourceUrlV126(candidate) || "";
}

function safeHttpUrlV125(value: string): boolean {
  return /^https?:\/\//i.test(value);
}

function timelineSortV125(value: string): number {
  const year = value.match(/(?:19|20)\d{2}/)?.[0];
  return year ? Number(year) : Number.MAX_SAFE_INTEGER;
}

function hasCoordinateV125(entity: VietnamEntityV124): boolean {
  return (
    typeof entity.latitude === "number" &&
    Number.isFinite(entity.latitude) &&
    entity.latitude >= -90 &&
    entity.latitude <= 90 &&
    typeof entity.longitude === "number" &&
    Number.isFinite(entity.longitude) &&
    entity.longitude >= -180 &&
    entity.longitude <= 180
  );
}

function entityFactsV125(entity: VietnamEntityV124): string {
  const entries = Object.entries(approvedEntityAttributesV126(entity, "entity"))
    .flatMap(([key, value]) => {
      const text = Array.isArray(value)
        ? value.map((item) => scalarV125(item)).filter(Boolean).join(" · ")
        : scalarV125(value);
      return text ? [`${publicEntityAttributeLabelV126(key)}: ${text}`] : [];
    })
    .slice(0, 4);
  return entries.join(" · ") || "세부 속성 미기재";
}

function publicEntityTypeLabelV126(
  entity: VietnamEntityV124,
  fallback: string
): string {
  const raw = publicTextV126(entity.entityType)?.trim();
  if (!raw) return fallback;

  const labels: Record<string, string> = {
    entity: fallback,
    record: fallback,
    item: fallback,
    row: fallback,
    organization: "기관",
    organisation: "기관",
    company: "기업",
    office: "사무소",
    project: "사업",
    program: "지원 프로그램",
    programme: "지원 프로그램",
    document: "문서",
    facility: "시설",
    plant: "시설",
    mine: "광산",
  };

  return labels[raw.toLocaleLowerCase("en-US")] || raw;
}

function rendererLabelV125(renderer: RendererV125): string {
  const labels: Record<RendererV125, string> = {
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
    "evidence-matrix": "항목별 확인 결과",
    "capability-scorecard": "역량 스코어카드",
    "document-library": "문서 라이브러리",
    "spatial-summary": "공간 요약",
    "structured-table": "구조화 표",
    "status-only": "데이터 상태",
  };
  return labels[renderer];
}
