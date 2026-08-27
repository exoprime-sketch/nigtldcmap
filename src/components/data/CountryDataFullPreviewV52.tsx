import { lazy, Suspense, useEffect, useMemo, useState } from "react";
import {
  getElementVisualizationSummaryV125,
  loadElementIndicatorSemanticsV125,
} from "../../data/visualization/elementVisualizationRegistryV125";
import { buildSemanticObservationsV125 } from "../../data/visualization/semanticObservationBuilderV125";
import type {
  ElementIndicatorSemanticsV125,
  ElementVisualizationContractV125,
} from "../../data/visualization/semanticTypesV125";
import type {
  VietnamEntityV124,
  VietnamIndicatorMetaV124,
  VietnamObservationV124,
} from "../../data/vietnam/vietnamTypesV124";
import type { DataFinderSelectorStateV125 } from "../../types/dataFinderV125";
import SemanticArchetypePreviewV125 from "./semantic/SemanticArchetypePreviewV125";
import type {
  E012OccupationMeasureKeyV125,
  E012VisualizationSelectionV125,
} from "./semantic/OccupationEmploymentWagePreviewV125";
import "../../styles/data-full-preview-v52.css";

const OccupationEmploymentWagePreviewV125 = lazy(
  () => import("./semantic/OccupationEmploymentWagePreviewV125")
);

interface Props {
  elementId: string;
  countryNameKo?: string;
  observations?: VietnamObservationV124[];
  entities?: VietnamEntityV124[];
  indicators?: VietnamIndicatorMetaV124[];
  selectedIndicatorId?: string;
  selectorState?: DataFinderSelectorStateV125;
  onSelectorStateChange?: (state: DataFinderSelectorStateV125) => void;
}

type SemanticRuntimeV125 = {
  contract: ElementVisualizationContractV125;
  semantics: ElementIndicatorSemanticsV125;
};

const DEFAULT_SELECTOR_STATE_V125: DataFinderSelectorStateV125 = {
  measure: null,
  sex: null,
  year: null,
  period: null,
  dimensions: {},
};

const E012_OCCUPATION_MEASURES_V125 = new Set<E012OccupationMeasureKeyV125>([
  "occupation_employment_count",
  "occupation_employment_share",
  "occupation_female_share",
  "occupation_wage",
]);

/**
 * V125 semantic visualization entry point.
 *
 * The historical filename is kept for import compatibility. Unlike the V123
 * preview, this renderer never truncates labels at an em dash and never
 * reduces every indicator to one latest value. The selected element's
 * deterministic semantic shard is loaded only after detail navigation.
 */
export default function CountryDataFullPreviewV52({
  elementId,
  countryNameKo = "대상국",
  observations = [],
  entities = [],
  indicators: _indicators = [],
  selectedIndicatorId = "all",
  selectorState = DEFAULT_SELECTOR_STATE_V125,
  onSelectorStateChange = () => undefined,
}: Props) {
  const [runtime, setRuntime] = useState<SemanticRuntimeV125 | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    setRuntime(null);
    setError("");
    const summary = getElementVisualizationSummaryV125(elementId);
    if (!summary) {
      setError("시각화 계약을 찾을 수 없습니다");
      return () => controller.abort();
    }
    void loadElementIndicatorSemanticsV125(elementId, controller.signal)
      .then((semantics) =>
        setRuntime({
          contract: runtimeContractV125(summary, semantics),
          semantics,
        })
      )
      .catch((reason: unknown) => {
        if (controller.signal.aborted) return;
        console.error("V125 semantic visualization load failed", reason);
        setError("의미 구조화 자산을 불러오지 못했습니다");
      });
    return () => controller.abort();
  }, [elementId]);

  const visibleObservations = useMemo(
    () =>
      selectedIndicatorId === "all"
        ? observations
        : observations.filter((row) => row.indicatorId === selectedIndicatorId),
    [observations, selectedIndicatorId]
  );
  const visibleEntities = useMemo(
    () =>
      selectedIndicatorId === "all"
        ? entities
        : entities.filter((row) => row.indicatorId === selectedIndicatorId),
    [entities, selectedIndicatorId]
  );

  const renderer = runtime?.contract.primaryRenderer || "loading";

  return (
    <section
      className="cev123-shell cev125-shell"
      aria-label="데이터 의미 시각화"
      data-v125-element-id={elementId}
      data-v125-renderer={renderer}
      data-testid="v125-detail-visualization"
    >
      <header className="cev123-heading">
        <div>
          <span>V125 의미 보존 시각화</span>
          <h3>{runtime ? rendererLabelV125(runtime.contract) : "시각화 계약 확인 중"}</h3>
        </div>
        <small>
          {countryNameKo} · 수치 {visibleObservations.length.toLocaleString("ko-KR")}건 ·
          개체 {visibleEntities.length.toLocaleString("ko-KR")}건
        </small>
      </header>

      {error && (
        <div className="cev123-empty" role="alert" data-v125-empty-reason="semantic-asset-error">
          <strong>{error}</strong>
          <p>원자료 표는 아래에서 계속 확인할 수 있습니다.</p>
        </div>
      )}

      {!error && !runtime && (
        <div className="cev123-empty" role="status">
          <strong>측정항목과 분류 차원을 준비하는 중입니다</strong>
        </div>
      )}

      {runtime && elementId === "E-012" && (
        <Suspense
          fallback={
            <div className="cev123-empty" role="status">
              직군별 시각화를 불러오는 중입니다
            </div>
          }
        >
          <OccupationEmploymentWagePreviewV125
            observations={buildSemanticObservationsV125(
              observations,
              runtime.semantics.indicators,
              runtime.semantics.records
            )}
            selection={e012SelectionV125(selectorState)}
            onSelectionChange={(next) =>
              onSelectorStateChange({
                ...selectorState,
                measure: next.measure,
                sex: next.sex,
                year: next.year,
                period: null,
                dimensions: {},
              })
            }
            countryNameKo={countryNameKo}
          />
        </Suspense>
      )}

      {runtime && elementId !== "E-012" && (
        <SemanticArchetypePreviewV125
          contract={runtime.contract}
          semantics={runtime.semantics}
          observations={visibleObservations}
          entities={visibleEntities}
          countryNameKo={countryNameKo}
          selectorState={selectorState}
          onSelectorStateChange={onSelectorStateChange}
        />
      )}
    </section>
  );
}

function runtimeContractV125(
  summary: NonNullable<ReturnType<typeof getElementVisualizationSummaryV125>>,
  semantics: ElementIndicatorSemanticsV125
): ElementVisualizationContractV125 {
  return {
    elementId: summary.elementId,
    dataPresenceStatus: summary.dataPresenceStatus,
    observationCount: semantics.observationCount,
    entityCount: semantics.entityCount,
    populatedRecordCount: summary.populatedRecordCount,
    missingRecordCount: Math.max(
      0,
      semantics.observationCount + semantics.entityCount - summary.populatedRecordCount
    ),
    yearRange: summary.yearRange,
    noDataReason: summary.noDataReason,
    primaryRenderer: summary.primaryRenderer,
    secondaryRenderer:
      summary.primaryRenderer === "status-only" ? "status-only" : "structured-table",
    measures: semantics.measures,
    dimensions: semantics.dimensions,
    selectors: semantics.dimensions.map((dimension) => ({
      key: dimension.key,
      labelKo: dimension.labelKo,
      values: dimension.values,
      defaultValue: dimension.values[0],
    })),
    unitFamilies: Array.from(
      new Set(semantics.measures.map((measure) => measure.unitFamily))
    ),
    primaryLabelFields: ["displayLabel"],
    tooltipFields: ["measure", "dimensions", "value", "unit", "year", "source"],
    tableColumns: ["measure", "dimensions", "value", "unit", "year", "source"],
    mapLinkage: {
      enabled: summary.spatiallyLinked,
      mapMode: summary.spatiallyLinked ? "linked" : "not-applicable",
      featureCount: 0,
      stateParameters: ["element", "measure", "sex", "year", "period", "dim.*"],
    },
    comparisonPolicy: "동일 정의·단위·기준시점에서만 비교",
    missingDataPolicy: "결측값을 0으로 대체하지 않음",
    currentVisualizationIssue: "V125 의미 계약 적용",
    contractStatus: summary.contractStatus,
  };
}

function e012SelectionV125(
  selectorState: DataFinderSelectorStateV125
): Partial<E012VisualizationSelectionV125> {
  const measure =
    selectorState.measure &&
    E012_OCCUPATION_MEASURES_V125.has(
      selectorState.measure as E012OccupationMeasureKeyV125
    )
      ? (selectorState.measure as E012OccupationMeasureKeyV125)
      : "occupation_employment_count";
  return {
    measure,
    sex: selectorState.sex || "total",
    year: selectorState.year || 2024,
  };
}

function rendererLabelV125(contract: ElementVisualizationContractV125): string {
  if (contract.contractStatus === "specialized") return "데이터 전용 시각화";
  if (contract.contractStatus === "status-only") return "데이터 수집 상태";
  if (contract.contractStatus === "structured-table") return "구조화된 표와 근거";
  return "측정항목·분류 차원별 시각화";
}
