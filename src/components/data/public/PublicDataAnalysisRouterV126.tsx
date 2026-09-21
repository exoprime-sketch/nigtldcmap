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
import {
  publicAggregationBasisV136_2,
  publicElementCopyV126,
} from "../../../data/visualization/publicCopyRegistryV126";
import { getPublicAnalysisHeadingsV134 } from "../../../data/visualization/publicAnalysisHeadingsV134";
import PublicRegionScenarioSummaryV138, {
  regionScenarioShapeV138,
} from "./PublicRegionScenarioSummaryV138";
import SeaLevelStationAnalysisV138, {
  isSeaLevelStationDeliveryV138,
} from "./SeaLevelStationAnalysisV138";
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
import PrimaryEnergyCompositionAnalysisV132 from "./PrimaryEnergyCompositionAnalysisV132";
import PublicEmissionsAnalysisV132 from "./PublicEmissionsAnalysisV132";
import PublicCompositionTrendAnalysisV132 from "./PublicCompositionTrendAnalysisV132";
import ResearchPatentAnalysisV132 from "./ResearchPatentAnalysisV132";
import PublicDataLimitationsV126 from "./PublicDataLimitationsV126";
import PowerPlantRegistrySummaryV138 from "./PowerPlantRegistrySummaryV138";
import CooperationChecklistAnalysisV141 from "./CooperationChecklistAnalysisV141";
import EnergyOutlookPlanAnalysisV141 from "./EnergyOutlookPlanAnalysisV141";
import SecuritySafetyInfoV142 from "./SecuritySafetyInfoV142";
import HydroStationObservationsV142 from "./HydroStationObservationsV142";
import NdcTargetsAnalysisV146 from "./NdcTargetsAnalysisV146";
import CarbonMarketRegionsV146 from "./CarbonMarketRegionsV146";
import LcoeRangeAnalysisV146 from "./LcoeRangeAnalysisV146";
import MonthlyClimateAnalysisV147 from "./MonthlyClimateAnalysisV147";
import NationalResourceSeriesV147 from "./NationalResourceSeriesV147";
import ReportedInventoryAnalysisV147 from "./ReportedInventoryAnalysisV147";
import ScienceWorkforceAnalysisV147 from "./ScienceWorkforceAnalysisV147";
import InfrastructureCoverageV147 from "./InfrastructureCoverageV147";
import CcsStatusAnalysisV147 from "./CcsStatusAnalysisV147";
import SdgIndicatorsAnalysisV147 from "./SdgIndicatorsAnalysisV147";
import CapitalCostAnalysisV147 from "./CapitalCostAnalysisV147";
import { BasinAreaAnalysisV147, FlowDirectionAnalysisV147 } from "./WaterGeographyAnalysisV147";
import ProvinceSeriesAnalysisV140, {
  provinceSeriesShapeV140,
} from "./ProvinceSeriesAnalysisV140";
import TransmissionNetworkSummaryV140, {
  isTransmissionDeliveryV140,
} from "./TransmissionNetworkSummaryV140";
import PublicIndicatorMeaningV129 from "./PublicIndicatorMeaningV129";
import { PublicTermTextV134 } from "../../help/PublicTermV134";
import PublicRawDataTablesV126 from "./PublicRawDataTablesV126";
import PublicSourcePanelV126 from "./PublicSourcePanelV126";
import { metadataOnlyBuildingsV144 } from "../../../data/visualization/publicIndicatorCopyV144";
import "./public-data-analysis-v126.css";

const OccupationEmploymentWagePreviewV125 = lazy(
  () => import("../semantic/OccupationEmploymentWagePreviewV125")
);
const OdaProviderAnalysisV134 = lazy(
  () => import("./OdaProviderAnalysisV134")
);
const SpeiDroughtScenarioAnalysisV134 = lazy(
  () => import("./SpeiDroughtScenarioAnalysisV134")
);
const GhgSectorGasAnalysisV135 = lazy(
  () => import("./GhgSectorGasAnalysisV135")
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
  spatialUnit?: string;
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
  "scenario-comparison": "multi-metric-trend",
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
  spatialUnit,
}: Props) {
  const summary = getPublicVisualizationSummaryV126(elementId);
  const publicRenderer = summary?.primaryRenderer || "structured-table";
  const copy = publicElementCopyV126(elementId, publicRenderer);
  const headings = getPublicAnalysisHeadingsV134(elementId);
  const semanticRows = useMemo(
    () =>
      buildSemanticObservationsV125(
        observations,
        semantics.indicators,
        semantics.records
      ),
    [observations, semantics]
  );
  // What the headline counted used to ride along in the KPI subtitle, between
  // the unit and a run of category codes. It is a source note, so it sits with
  // the other source notes.
  const aggregationBasis = useMemo(
    () => publicAggregationBasisV136_2(semanticRows.map((row) => row.dimensionLabels)),
    [semanticRows]
  );
  // Province-by-scenario-by-year deliveries arrive as entity attribute columns,
  // so the observation-driven renderers find nothing and the page falls through
  // to a card grid of record keys. Where that shape is present and the element
  // has no observations of its own to draw, read the rows for what they are.
  const regionScenarioSummary = useMemo(() => {
    if (semanticRows.length > 0) return null;
    if (elementId === "B-008" && isSeaLevelStationDeliveryV138(entities)) {
      return (
        <SeaLevelStationAnalysisV138
          entities={entities}
          selectorState={selectorState}
          onSelectorStateChange={onSelectorStateChange}
        />
      );
    }
    if (!regionScenarioShapeV138(entities)) return null;
    return (
      <PublicRegionScenarioSummaryV138
        elementId={elementId}
        entities={entities}
        elementTitle={copy.title}
        selectorState={selectorState}
        onSelectorStateChange={onSelectorStateChange}
      />
    );
  }, [copy.title, elementId, entities, onSelectorStateChange, selectorState, semanticRows.length]);
  // Rows the province distribution cannot describe: the delivery states what
  // each one measures in a column of its own rather than per province.
  const nationalSeriesEntities = useMemo(
    () =>
      entities.filter((entity) =>
        Boolean((entity.normalizedAttributes || {})["전국_지표명"])
      ),
    [entities]
  );
  const hasNationalSeriesRows = nationalSeriesEntities.length > 0;
  // Observations keyed by province (B-033, C-016, B-031, B-032, B-034): the
  // province's own series, the same-year comparison and the table, instead
  // of one bar for the chosen province and a grid of record keys (V140).
  const provinceSeries = useMemo(() => provinceSeriesShapeV140(semanticRows), [semanticRows]);
  const adapterContract = useMemo<ElementVisualizationContractV125>(
    () => ({
      ...contract,
      primaryRenderer: ["A-030", "A-032"].includes(elementId) ? "kpi-trend" : ADAPTER_RENDERER_V126[publicRenderer],
      secondaryRenderer:
        publicRenderer === "status-only" ? "status-only" : "structured-table",
      currentVisualizationIssue: "",
    }),
    [contract, publicRenderer, elementId]
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
        <h2 data-testid="public-data-title">
          <PublicTermTextV134 text={headings?.publicAnalysisTitle || copy.title} />
        </h2>
      </header>

      <section className="pav126-primary" data-testid="public-analysis-primary">
        {/*
          The BTR delivery now ships its 82 rows as entity records, so the
          emissions component received an empty series and the whole analysis
          section rendered nothing at all. Where the specialised view has no
          observations to draw, the archetype shows the records that are there.
        */}
        {elementId === "A-026" && metadataOnlyBuildingsV144(semanticRows) ? (
          <section className="pav126-empty" data-testid="building-data-availability-v144">
            <h3>건물 수·면적 자료 미제공</h3>
            <p>현재 자료에는 건물 수·면적과 개별 건물 경계가 포함되어 있지 않습니다. 자료의 좌표계와 파일 구성 정보만 확인할 수 있습니다.</p>
            <details><summary>파일 구성 정보</summary>
              <ul>{semanticRows.filter((row) => row.value !== null && row.value !== undefined && row.value !== "").map((row) =>
                <li key={row.recordId}>{row.semanticMeasure.labelKo}: {String(row.value)}</li>
              )}</ul>
            </details>
          </section>
        ) : elementId === "B-001" ? (
          <MonthlyClimateAnalysisV147 rows={semanticRows} />
        ) : elementId === "A-015" ? (
          <SdgIndicatorsAnalysisV147 rows={semanticRows} selectorState={selectorState} onSelectorStateChange={onSelectorStateChange} />
        ) : elementId === "D-001" ? (
          <CapitalCostAnalysisV147 rows={semanticRows} />
        ) : elementId === "A-025" ? (
          <CcsStatusAnalysisV147 entities={entities} />
        ) : elementId === "B-025" ? (
          <BasinAreaAnalysisV147 entities={entities} />
        ) : elementId === "B-026" ? (
          <FlowDirectionAnalysisV147 entities={entities} />
        ) : elementId === "E-009" ? (
          <ScienceWorkforceAnalysisV147 rows={semanticRows} />
        ) : elementId === "A-027" || elementId === "A-028" ? (
          <InfrastructureCoverageV147 rows={semanticRows} />
        ) : elementId === "C-002" && entities.length > 0 ? (
          <ReportedInventoryAnalysisV147 entities={entities} />
        ) : elementId === "C-002" && semanticRows.length > 0 ? (
          <Suspense fallback={<div className="pav126-empty" role="status" data-testid="public-analysis-pending">배출량 분석을 불러오는 중입니다</div>}>
            <GhgSectorGasAnalysisV135 elementId={elementId} rows={semanticRows} />
          </Suspense>
        ) : elementId === "D-011" ? (
          <Suspense fallback={<div className="pav126-empty" role="status" data-testid="public-analysis-pending">ODA 분석을 불러오는 중입니다</div>}>
            <OdaProviderAnalysisV134
              rows={semanticRows}
              selectorState={selectorState}
              onSelectorStateChange={onSelectorStateChange}
              primaryTitle={headings?.primaryChartTitle}
              secondaryTitle={headings?.secondaryChartTitle}
            />
          </Suspense>
        ) : elementId === "B-005" && semanticRows.length > 0 ? (
          <Suspense fallback={<div className="pav126-empty" role="status" data-testid="public-analysis-pending">가뭄 전망을 불러오는 중입니다</div>}>
            <SpeiDroughtScenarioAnalysisV134
              rows={semanticRows}
              selectorState={selectorState}
              onSelectorStateChange={onSelectorStateChange}
              primaryTitle={headings?.primaryChartTitle}
              secondaryTitle={headings?.secondaryChartTitle}
            />
          </Suspense>
        ) : elementId === "A-016" ? (
          <PrimaryEnergyCompositionAnalysisV132
            rows={semanticRows}
            selectorState={selectorState}
            onSelectorStateChange={onSelectorStateChange}
          />
        ) : elementId === "D-005" ? (
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
        ) : elementId === "E-008" ? (
          <ResearchPatentAnalysisV132
            rows={semanticRows}
            entities={entities}
            detailTemplate={detailTemplate}
            elementTitle={copy.title}
          />
        ) : elementId === "E-012" ? (
          <Suspense
            fallback={<div className="pav126-empty" role="status" data-testid="public-analysis-pending">직군별 분석을 불러오는 중입니다</div>}
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
        ) : provinceSeries ? (
          <ProvinceSeriesAnalysisV140
            elementId={elementId}
            rows={semanticRows}
            selectorState={selectorState}
            onSelectorStateChange={onSelectorStateChange}
            elementTitle={copy.title}
            primaryTitle={headings?.primaryChartTitle}
          />
        ) : publicRenderer === "stacked-emissions" ? (
          <PublicEmissionsAnalysisV132
            elementId={elementId}
            rows={semanticRows}
            selectorState={selectorState}
            onSelectorStateChange={onSelectorStateChange}
          />
        ) : publicRenderer === "composition-trend" ? (
          <PublicCompositionTrendAnalysisV132
            elementId={elementId}
            rows={semanticRows}
            selectorState={selectorState}
            onSelectorStateChange={onSelectorStateChange}
          />
        ) : regionScenarioSummary && hasNationalSeriesRows ? (
          // The distribution describes the province rows. B-029, B-037, B-039
          // and B-040 also carry a national series - mangrove area, land use,
          // hydro potential - in rows the distribution cannot describe, and
          // showing only the distribution would have hidden them.
          <>
            {regionScenarioSummary}
            <NationalResourceSeriesV147 key={elementId} entities={nationalSeriesEntities} />
          </>
        ) : elementId === "A-024" && isTransmissionDeliveryV140(entities) ? (
          <TransmissionNetworkSummaryV140 entities={entities} />
        ) : elementId === "A-017" ? (
          <LcoeRangeAnalysisV146 rows={semanticRows} selectorState={selectorState} onSelectorStateChange={onSelectorStateChange} />
        ) : elementId === "C-001" ? (
          <NdcTargetsAnalysisV146 entities={entities} />
        ) : elementId === "C-019" || elementId === "C-022" ? (
          <CarbonMarketRegionsV146 elementId={elementId} entities={entities} initialRegion={selectorState.dimensions.registryRegion} />
        ) : elementId === "C-007" || elementId === "C-008" ? (
          // Attribute rows read as participation statements, initiatives and
          // actors, not as a portfolio of projects (V141).
          <CooperationChecklistAnalysisV141 elementId={elementId} entities={entities} />
        ) : elementId === "B-023" || elementId === "B-028" ? (
          // Station observations: dry/wet pairs where one station, unit and
          // year hold both; otherwise a table per station (V142).
          <HydroStationObservationsV142 elementId={elementId} entities={entities} />
        ) : elementId === "C-011" ? (
          // Phone numbers, notice dates, alert grades and one rate: tables by
          // use, never one bar axis (V142).
          <SecuritySafetyInfoV142 entities={entities} semantics={semantics} />
        ) : elementId === "C-018" ? (
          // The revised PDP8 plan is the outlook; prices state their unit (V141).
          <EnergyOutlookPlanAnalysisV141 entities={entities} initialYear={selectorState.year} />
        ) : elementId === "A-023" ? (
          <PowerPlantRegistrySummaryV138 entities={entities} selectorState={selectorState} onSelectorStateChange={onSelectorStateChange} />
        ) : regionScenarioSummary ?? (
          <SemanticArchetypePreviewV125
            contract={adapterContract}
            semantics={semantics}
            observations={observations}
            entities={entities}
            countryNameKo={countryNameKo}
            detailTemplate={detailTemplate}
            elementTitle={copy.title}
            selectorState={selectorState}
            onSelectorStateChange={onSelectorStateChange}
            showRawTable={false}
          />
        )}
      </section>

      {!['B-005', 'E-008'].includes(elementId) && !(elementId === 'A-026' && metadataOnlyBuildingsV144(semanticRows)) && (
        <details className="pav144-reading-notes" data-testid="public-reading-notes-v144">
          <summary>자료 해석 안내</summary>
          <PublicIndicatorMeaningV129
            elementId={elementId}
            indicatorId={meaningIndicatorId}
            variableKey={selectorState.dimensions.variable || selectorState.dimensions.mapVariable || (selectorState.measure ? "semantic-selection" : undefined)}
          />
        </details>
      )}
      <PublicDataLimitationsV126 elementId={elementId} />
      <PublicSourcePanelV126
        indicators={indicators}
        observations={observations}
        entities={entities}
        spatialUnit={spatialUnit}
        aggregationBasis={aggregationBasis}
      />
      {elementId !== "D-011" ? (
        <PublicRawDataTablesV126
          elementId={elementId}
          observations={semanticRows}
          entities={entities}
          detailTemplate={detailTemplate}
        />
      ) : null}
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
