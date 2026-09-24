import { lazy, Suspense, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
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
import PowerPlantRegistrySummaryV138 from "./PowerPlantRegistrySummaryV138";
import MineralResourceSummaryV153 from "./MineralResourceSummaryV153";
import InvestorNetworkSummaryV153 from "./InvestorNetworkSummaryV153";
import PppProcurementSummaryV153 from "./PppProcurementSummaryV153";
import ClimateZoneSummaryV153 from "./ClimateZoneSummaryV153";
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
import { PublicTermTextV134 } from "../../help/PublicTermV134";
import PublicRawDataTablesV126 from "./PublicRawDataTablesV126";
import PublicSourcePanelV126 from "./PublicSourcePanelV126";
import { metadataOnlyBuildingsV144 } from "../../../data/visualization/publicIndicatorCopyV144";
import { visualizationContractV153 } from "../../../data/visualization/publicVisualizationContractV153";
import { getTypologyV159 } from "../../../data/spec/datasetSpecV159";
import {
  elementVariantV159,
  GENERIC_BODY_VARIANTS_V159,
} from "../templates/templateVariantsV159";
import type { TemplateVariantKeyV159 } from "../templates/templateVariantsV159";
import { technologyOptionsForIndicatorsV159 } from "../templates/TechFilterV159";
import type { TemplateContextV159 } from "../templates/TemplateShellV159";
import U0StatusV159 from "../templates/U0StatusV159";
import U1CountryProfileV159 from "../templates/U1CountryProfileV159";
import U2RegionalV159 from "../templates/U2RegionalV159";
import U3TechnologyV159 from "../templates/U3TechnologyV159";
import U4LocationsV159 from "../templates/U4LocationsV159";
import U5ProjectsFinanceV159 from "../templates/U5ProjectsFinanceV159";
import U6PolicyV159 from "../templates/U6PolicyV159";
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
  /** The page's own title; the analysis heading is shown only when it says something else (V153). */
  pageTitle?: string;
  /** The small map, placed by the V153 frame beside the first block. */
  mapSlot?: ReactNode;
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
  observations: allObservations,
  entities: allEntities,
  indicators,
  countryNameKo,
  selectorState,
  onSelectorStateChange,
  detailTemplate,
  spatialUnit,
  pageTitle,
  mapSlot,
}: Props) {
  // V159: the display type picks the template, the element's variant the body.
  const typology = getTypologyV159(elementId);
  const variantEntry = elementVariantV159(elementId);
  // The shared climate-technology filter narrows the rows before any body
  // reads them, so every variant sees the same selection.
  const presentIndicatorIds = useMemo(
    () => new Set([...allObservations.map((row) => row.indicatorId), ...allEntities.map((row) => row.indicatorId || "")]),
    [allEntities, allObservations]
  );
  const techOptions = useMemo(
    () => technologyOptionsForIndicatorsV159(indicators, presentIndicatorIds),
    [indicators, presentIndicatorIds]
  );
  const [selectedTech, setSelectedTech] = useState("all");
  useEffect(() => setSelectedTech("all"), [elementId]);
  const techIndicatorIds = useMemo(() => {
    if (selectedTech === "all") return null;
    const option = techOptions.find((item) => item.code === selectedTech);
    return option ? new Set(option.indicatorIds) : null;
  }, [selectedTech, techOptions]);
  const observations = useMemo(
    () => (techIndicatorIds ? allObservations.filter((row) => techIndicatorIds.has(row.indicatorId)) : allObservations),
    [allObservations, techIndicatorIds]
  );
  const entities = useMemo(
    () =>
      techIndicatorIds
        ? allEntities.filter((row) => !row.indicatorId || !presentIndicatorIds.has(row.indicatorId) || techIndicatorIds.has(row.indicatorId))
        : allEntities,
    [allEntities, presentIndicatorIds, techIndicatorIds]
  );
  const summary = getPublicVisualizationSummaryV126(elementId);
  const publicRenderer = summary?.primaryRenderer || "structured-table";
  const copy = publicElementCopyV126(elementId, publicRenderer);
  const headings = getPublicAnalysisHeadingsV134(elementId);
  const analysisTitle = headings?.publicAnalysisTitle || copy.title;
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
  // V159: the old element-id chain as the template variants, in the chain's
  // own order - early variants, then the generic shape checks, then late
  // variants, then the province distribution or the generic renderer. A
  // variant returns null when its rows are not the shape it draws, and the
  // next step takes over, exactly as the chain fell through before.
  // The registry maps each variant only to the elements its component was
  // written for, so the narrowed element ids below hold (templateVariantsV159).
  const renderVariantV159 = (variant: TemplateVariantKeyV159): ReactNode | null => {
    switch (variant) {
      case "building-metadata":
        return metadataOnlyBuildingsV144(semanticRows) ? (
          <section className="pav126-empty" data-testid="building-data-availability-v144" data-analysis-block="note">
            <h3>건물 수·면적 자료 미제공</h3>
            <p>현재 자료에는 건물 수·면적과 개별 건물 경계가 포함되어 있지 않습니다. 자료의 좌표계와 파일 구성 정보만 확인할 수 있습니다.</p>
            <details><summary>파일 구성 정보</summary>
              <ul>{semanticRows.filter((row) => row.value !== null && row.value !== undefined && row.value !== "").map((row) =>
                <li key={row.recordId}>{row.semanticMeasure.labelKo}: {String(row.value)}</li>
              )}</ul>
            </details>
          </section>
        ) : null;
      case "monthly-climate":
        return <MonthlyClimateAnalysisV147 rows={semanticRows} />;
      case "sdg-indicators":
        return <SdgIndicatorsAnalysisV147 rows={semanticRows} selectorState={selectorState} onSelectorStateChange={onSelectorStateChange} />;
      case "capital-cost":
        return <CapitalCostAnalysisV147 rows={semanticRows} />;
      case "ccs-status":
        return <CcsStatusAnalysisV147 entities={entities} />;
      case "basin-area":
        return <BasinAreaAnalysisV147 entities={entities} />;
      case "flow-direction":
        return <FlowDirectionAnalysisV147 entities={entities} />;
      case "science-workforce":
        return <ScienceWorkforceAnalysisV147 rows={semanticRows} />;
      case "infrastructure-coverage":
        return <InfrastructureCoverageV147 rows={semanticRows} />;
      case "reported-inventory":
        /*
          The BTR delivery now ships its 82 rows as entity records, so the
          emissions component received an empty series and the whole analysis
          section rendered nothing at all. Where the specialised view has no
          observations to draw, the archetype shows the records that are there.
        */
        if (entities.length > 0) return <ReportedInventoryAnalysisV147 entities={entities} />;
        if (semanticRows.length > 0) {
          return (
            <Suspense fallback={<div className="pav126-empty" role="status" data-testid="public-analysis-pending">배출량 분석을 불러오는 중입니다</div>}>
              <GhgSectorGasAnalysisV135 elementId={elementId} rows={semanticRows} />
            </Suspense>
          );
        }
        return null;
      case "oda-provider":
        return (
          <Suspense fallback={<div className="pav126-empty" role="status" data-testid="public-analysis-pending">ODA 분석을 불러오는 중입니다</div>}>
            <OdaProviderAnalysisV134
              rows={semanticRows}
              selectorState={selectorState}
              onSelectorStateChange={onSelectorStateChange}
              primaryTitle={headings?.primaryChartTitle}
              secondaryTitle={headings?.secondaryChartTitle}
            />
          </Suspense>
        );
      case "spei-drought":
        return semanticRows.length > 0 ? (
          <Suspense fallback={<div className="pav126-empty" role="status" data-testid="public-analysis-pending">가뭄 전망을 불러오는 중입니다</div>}>
            <SpeiDroughtScenarioAnalysisV134
              rows={semanticRows}
              selectorState={selectorState}
              onSelectorStateChange={onSelectorStateChange}
              primaryTitle={headings?.primaryChartTitle}
              secondaryTitle={headings?.secondaryChartTitle}
            />
          </Suspense>
        ) : null;
      case "primary-energy-composition":
        return (
          <PrimaryEnergyCompositionAnalysisV132
            rows={semanticRows}
            selectorState={selectorState}
            onSelectorStateChange={onSelectorStateChange}
          />
        );
      case "climate-budget-allocation":
        return (
          <ClimateBudgetAllocationAnalysisV129
            rows={semanticRows}
            selectorState={selectorState}
            onSelectorStateChange={onSelectorStateChange}
          />
        );
      case "cpia-policy-capacity":
        return (
          <CpiaPolicyCapacityAnalysisV126
            rows={semanticRows}
            selectorState={selectorState}
            onSelectorStateChange={onSelectorStateChange}
            showRawTable={false}
          />
        );
      case "research-patent":
        return (
          <ResearchPatentAnalysisV132
            rows={semanticRows}
            entities={entities}
            detailTemplate={detailTemplate}
            elementTitle={copy.title}
          />
        );
      case "occupation-wage":
        return (
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
        );
      case "transmission-network":
        return isTransmissionDeliveryV140(entities) ? <TransmissionNetworkSummaryV140 entities={entities} /> : null;
      case "lcoe-range":
        return <LcoeRangeAnalysisV146 rows={semanticRows} selectorState={selectorState} onSelectorStateChange={onSelectorStateChange} />;
      case "ndc-targets":
        return <NdcTargetsAnalysisV146 entities={entities} />;
      case "carbon-market-regions":
        return <CarbonMarketRegionsV146 elementId={elementId} entities={entities} initialRegion={selectorState.dimensions.registryRegion} />;
      case "cooperation-checklist":
        // Attribute rows read as participation statements, initiatives and
        // actors, not as a portfolio of projects (V141).
        return <CooperationChecklistAnalysisV141 elementId={elementId as "C-007" | "C-008"} entities={entities} />;
      case "hydro-stations":
        // Station observations: dry/wet pairs where one station, unit and
        // year hold both; otherwise a table per station (V142).
        return <HydroStationObservationsV142 elementId={elementId as "B-023" | "B-028"} entities={entities} />;
      case "security-safety":
        // Phone numbers, notice dates, alert grades and one rate: tables by
        // use, never one bar axis (V142).
        return <SecuritySafetyInfoV142 entities={entities} semantics={semantics} />;
      case "energy-outlook-plan":
        // The revised PDP8 plan is the outlook; prices state their unit (V141).
        return <EnergyOutlookPlanAnalysisV141 entities={entities} initialYear={selectorState.year} />;
      case "power-plant-registry":
        return <PowerPlantRegistrySummaryV138 entities={entities} selectorState={selectorState} onSelectorStateChange={onSelectorStateChange} />;
      case "mineral-resources":
        // Minerals by name, in their own units; the bar is USGS's world share (V153).
        return <MineralResourceSummaryV153 elementId={elementId as "B-046" | "B-047"} observations={observations} indicators={indicators} />;
      case "investor-network":
        // Investors with a Vietnam office apart from head offices abroad (V153).
        return <InvestorNetworkSummaryV153 entities={entities} />;
      case "ppp-procurement":
        // PPP law, agency, contract and procurement facts, Korean first (V153).
        return <PppProcurementSummaryV153 entities={entities} indicators={indicators} />;
      case "climate-zone":
        // Köppen zones named Korean(code) with the composition table (V153).
        return <ClimateZoneSummaryV153 observations={observations} indicators={indicators} />;
      default:
        return null;
    }
  };

  // The generic bodies, chosen by the rows' shape rather than by element.
  const renderGenericShapeV159 = (): ReactNode | null => {
    if (provinceSeries) {
      return (
        <ProvinceSeriesAnalysisV140
          elementId={elementId}
          rows={semanticRows}
          selectorState={selectorState}
          onSelectorStateChange={onSelectorStateChange}
          elementTitle={copy.title}
          primaryTitle={headings?.primaryChartTitle}
        />
      );
    }
    if (publicRenderer === "stacked-emissions") {
      return (
        <PublicEmissionsAnalysisV132
          elementId={elementId}
          rows={semanticRows}
          selectorState={selectorState}
          onSelectorStateChange={onSelectorStateChange}
        />
      );
    }
    if (publicRenderer === "composition-trend") {
      return (
        <PublicCompositionTrendAnalysisV132
          elementId={elementId}
          rows={semanticRows}
          selectorState={selectorState}
          onSelectorStateChange={onSelectorStateChange}
        />
      );
    }
    if (regionScenarioSummary && hasNationalSeriesRows) {
      // The distribution describes the province rows. B-029, B-037, B-039
      // and B-040 also carry a national series - mangrove area, land use,
      // hydro potential - in rows the distribution cannot describe, and
      // showing only the distribution would have hidden them.
      return (
        <>
          {regionScenarioSummary}
          <NationalResourceSeriesV147 key={elementId} entities={nationalSeriesEntities} />
        </>
      );
    }
    return null;
  };

  const isStatusV159 = typology?.displayType === "U0";
  const earlyBody = variantEntry?.phase === "early" ? renderVariantV159(variantEntry.variant) : null;
  const lateBody =
    variantEntry?.phase === "late" && !GENERIC_BODY_VARIANTS_V159.has(variantEntry.variant)
      ? renderVariantV159(variantEntry.variant)
      : null;
  const body = isStatusV159 && typology ? (
    <U0StatusV159 typology={typology} />
  ) : (
    earlyBody ??
    renderGenericShapeV159() ??
    lateBody ??
    regionScenarioSummary ?? (
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
    )
  );

  const content = (
    <>
      {/* The title is stated once, by the page; the analysis heading is kept
          only where it adds a reading ("배출량 변화와 구성") (V153). */}
      {!sameTitleV153(pageTitle, analysisTitle) && (
        <header className="pav126-heading">
          <h2 data-testid="public-data-title">
            <PublicTermTextV134 text={analysisTitle} />
          </h2>
        </header>
      )}

      <section className="pav126-primary" data-testid="public-analysis-primary">
        {body}
        {mapSlot}
      </section>

      <PublicSourcePanelV126
        elementId={elementId}
        indicators={indicators}
        observations={observations}
        entities={entities}
        spatialUnit={spatialUnit}
        aggregationBasis={aggregationBasis}
      />
      {/* A status screen states the decision only; its rows are not tabled (V159). */}
      {elementId !== "D-011" && !isStatusV159 ? (
        <PublicRawDataTablesV126
          elementId={elementId}
          observations={semanticRows}
          entities={entities}
          detailTemplate={detailTemplate}
        />
      ) : null}
    </>
  );

  if (!typology) return content;
  const templateContext: TemplateContextV159 = {
    typology,
    variant: variantEntry?.variant || "generic",
    techOptions: isStatusV159 ? [] : techOptions,
    selectedTech,
    onTechChange: setSelectedTech,
  };
  switch (typology.displayType) {
    case "U1":
      return <U1CountryProfileV159 context={templateContext}>{content}</U1CountryProfileV159>;
    case "U2": {
      const archetype = visualizationContractV153(elementId)?.archetype;
      const nationalOnly = typology.structure === "S2" && (archetype === "national-series" || archetype === "composition");
      return <U2RegionalV159 context={templateContext} nationalOnly={nationalOnly}>{content}</U2RegionalV159>;
    }
    case "U3":
      return <U3TechnologyV159 context={templateContext}>{content}</U3TechnologyV159>;
    case "U4":
      return <U4LocationsV159 context={templateContext}>{content}</U4LocationsV159>;
    case "U5":
      return <U5ProjectsFinanceV159 context={templateContext}>{content}</U5ProjectsFinanceV159>;
    case "U6":
      return <U6PolicyV159 context={templateContext}>{content}</U6PolicyV159>;
    default:
      // ⓪: the shell without the technology filter around the statement.
      return <U1CountryProfileV159 context={templateContext}>{content}</U1CountryProfileV159>;
  }
}

/** Same words, ignoring spacing and the middle dots the labels use. */
function sameTitleV153(left: string | undefined, right: string): boolean {
  if (!left) return false;
  const norm = (value: string) => value.replace(/[\s·:：()（）]/gu, "").toLowerCase();
  return norm(left) === norm(right);
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
