import { lazy, Suspense, useMemo } from "react";
import type {
  ElementIndicatorSemanticsV125,
  ElementVisualizationContractV125,
  SemanticRendererV125,
} from "../../../data/visualization/semanticTypesV125";
import { buildSemanticObservationsV125 } from "../../../data/visualization/semanticObservationBuilderV125";
import {
  getPublicVisualizationSummaryV126,
} from "../../../data/visualization/publicVisualizationRegistryV126";
import type {
  PublicAnalyticalRendererV126,
} from "../../../data/visualization/publicVisualizationRegistryV126";
import { publicElementCopyV126 } from "../../../data/visualization/publicCopyRegistryV126";
import { getPublicIndicatorInterpretationV129 } from "../../../data/interpretation/publicIndicatorInterpretationV129";
import type {
  VietnamEntityV124,
  VietnamIndicatorMetaV124,
  VietnamObservationV124,
} from "../../../data/vietnam/vietnamTypesV124";
import type { DataFinderSelectorStateV125 } from "../../../types/dataFinderV125";
import SemanticArchetypePreviewV125 from "../semantic/SemanticArchetypePreviewV125";
import type {
  E012OccupationMeasureKeyV125,
  E012VisualizationSelectionV125,
} from "../semantic/OccupationEmploymentWagePreviewV125";
import CpiaPolicyCapacityAnalysisV126 from "./CpiaPolicyCapacityAnalysisV126";
import ClimateBudgetAllocationAnalysisV129 from "./ClimateBudgetAllocationAnalysisV129";
import PublicDataLimitationsV126 from "./PublicDataLimitationsV126";
import PublicIndicatorMeaningV129 from "./PublicIndicatorMeaningV129";
import PublicRawDataTablesV126 from "./PublicRawDataTablesV126";
import PublicSourcePanelV126 from "./PublicSourcePanelV126";
import "./public-data-analysis-v126.css";

const OccupationEmploymentWagePreviewV125 = lazy(
  () => import("../semantic/OccupationEmploymentWagePreviewV125")
);

interface Props {
  elementId: string;
  contract: ElementVisualizationContractV125;
  semantics: ElementIndicatorSemanticsV125;
  observations: VietnamObservationV124[];
  entities: VietnamEntityV124[];
  indicators: VietnamIndicatorMetaV124[];
  countryNameKo: string;
  selectorState: DataFinderSelectorStateV125;
  onSelectorStateChange: (state: DataFinderSelectorStateV125) => void;
  detailTemplate: string;
}

const E012_OCCUPATION_MEASURES_V126 = new Set<E012OccupationMeasureKeyV125>([
  "occupation_employment_count",
  "occupation_employment_share",
  "occupation_female_share",
  "occupation_wage",
]);

const ADAPTER_RENDERER_V126: Record<
  PublicAnalyticalRendererV126,
  SemanticRendererV125
> = {
  "score-trend": "kpi-trend",
  "kpi-trend": "kpi-trend",
  "multi-metric-trend": "multi-metric-trend",
  "composition-trend": "composition",
  "stacked-emissions": "composition",
  "technology-comparison": "category-comparison",
  "scenario-comparison": "scenario-range",
  seasonality: "seasonality",
  "policy-timeline": "policy-timeline",
  "portfolio-dashboard": "portfolio",
  directory: "directory",
  "evidence-matrix": "evidence-matrix",
  "capability-scorecard": "capability-scorecard",
  "spatial-analysis": "multi-metric-trend",
  "structured-table": "structured-table",
  "status-only": "status-only",
};

export default function PublicDataAnalysisRouterV126({
  elementId,
  contract,
  semantics,
  observations,
  entities,
  indicators,
  countryNameKo,
  selectorState,
  onSelectorStateChange,
  detailTemplate,
}: Props) {
  const summary = getPublicVisualizationSummaryV126(elementId);
  const publicRenderer = summary?.primaryRenderer || "structured-table";
  const copy = publicElementCopyV126(elementId, publicRenderer);
  const semanticRows = useMemo(
    () =>
      buildSemanticObservationsV125(
        observations,
        semantics.indicators,
        semantics.records
      ),
    [observations, semantics]
  );
  const adapterContract = useMemo<ElementVisualizationContractV125>(
    () => ({
      ...contract,
      primaryRenderer: ADAPTER_RENDERER_V126[publicRenderer],
      secondaryRenderer:
        publicRenderer === "status-only" ? "status-only" : "structured-table",
      currentVisualizationIssue: "",
    }),
    [contract, publicRenderer]
  );
  const meaningIndicatorId = useMemo(() => {
    const dimensionEntries = Object.entries(selectorState.dimensions).filter(
      ([key, value]) =>
        Boolean(value) && !["variable", "mapVariable"].includes(key)
    );
    const candidates = semanticRows.filter(
      (row) =>
        (!selectorState.measure ||
          row.semanticMeasure.key === selectorState.measure) &&
        dimensionEntries.every(
          ([key, value]) => row.dimensions[key] === value
        )
    );
    if (candidates.length === 0) return null;
    if (dimensionEntries.length > 0) return candidates[0].indicatorId;
    const candidateInterpretations = candidates.map((row) =>
      getPublicIndicatorInterpretationV129(elementId, null, row.indicatorId)
    );
    const uniqueInterpretations = new Set(candidateInterpretations);
    if (
      candidateInterpretations.every((interpretation) => interpretation !== null) &&
      uniqueInterpretations.size === 1
    ) {
      return candidates[0].indicatorId;
    }
    const indicatorFamilies = new Set(
      candidates.map((row) =>
        row.indicatorId.replace(/_(?:central_highlands|mekong_river_delta|north_central_coast_and_south_central_coast|north_east_north_west|red_river_delta|south_east|total|ssp[123])$/u, "")
      )
    );
    return indicatorFamilies.size === 1 ? candidates[0].indicatorId : null;
  }, [elementId, selectorState.dimensions, selectorState.measure, semanticRows]);

  return (
    <>
      <header className="pav126-heading">
        <span>이 데이터로 확인할 수 있는 내용</span>
        <h2 data-testid="public-data-title">{copy.title}</h2>
        <p>{copy.description}</p>
      </header>

      <PublicIndicatorMeaningV129
        elementId={elementId}
        indicatorId={meaningIndicatorId}
        variableKey={
          selectorState.dimensions.variable ||
          selectorState.dimensions.mapVariable ||
          (selectorState.measure ? "semantic-selection" : undefined)
        }
      />

      <section className="pav126-primary" data-testid="public-analysis-primary">
        {elementId === "D-005" ? (
          <ClimateBudgetAllocationAnalysisV129
            rows={semanticRows}
            selectorState={selectorState}
            onSelectorStateChange={onSelectorStateChange}
          />
        ) : elementId === "A-002" ? (
          <CpiaPolicyCapacityAnalysisV126
            rows={semanticRows}
            selectorState={selectorState}
            onSelectorStateChange={onSelectorStateChange}
            showRawTable={false}
          />
        ) : elementId === "E-012" ? (
          <Suspense
            fallback={<div className="pav126-empty" role="status">직군별 분석을 불러오는 중입니다</div>}
          >
            <OccupationEmploymentWagePreviewV125
              observations={semanticRows}
              selection={e012SelectionV126(selectorState)}
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
              showRawTable={false}
            />
          </Suspense>
        ) : (
          <SemanticArchetypePreviewV125
            contract={adapterContract}
            semantics={semantics}
            observations={observations}
            entities={entities}
            countryNameKo={countryNameKo}
            selectorState={selectorState}
            onSelectorStateChange={onSelectorStateChange}
            showRawTable={false}
          />
        )}
      </section>

      <PublicDataLimitationsV126 elementId={elementId} />
      <PublicSourcePanelV126
        indicators={indicators}
        observations={observations}
        entities={entities}
      />
      <PublicRawDataTablesV126
        elementId={elementId}
        observations={semanticRows}
        entities={entities}
        detailTemplate={detailTemplate}
      />
    </>
  );
}

function e012SelectionV126(
  selectorState: DataFinderSelectorStateV125
): Partial<E012VisualizationSelectionV125> {
  const measure =
    selectorState.measure &&
    E012_OCCUPATION_MEASURES_V126.has(
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
