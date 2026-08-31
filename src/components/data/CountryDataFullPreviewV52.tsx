import { useEffect, useMemo, useState } from "react";
import {
  getElementVisualizationSummaryV125,
  loadElementIndicatorSemanticsV125,
} from "../../data/visualization/elementVisualizationRegistryV125";
import { getPublicVisualizationSummaryV126 } from "../../data/visualization/publicVisualizationRegistryV126";
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
import PublicDataAnalysisRouterV126 from "./public/PublicDataAnalysisRouterV126";
import "../../styles/data-full-preview-v52.css";

interface Props {
  elementId: string;
  countryNameKo?: string;
  observations?: VietnamObservationV124[];
  entities?: VietnamEntityV124[];
  indicators?: VietnamIndicatorMetaV124[];
  detailTemplate?: string;
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

/**
 * The historical filename is retained for import compatibility. Public
 * presentation is selected through the analysis registry while the verified
 * semantic shard remains the single interpretation layer.
 */
export default function CountryDataFullPreviewV52({
  elementId,
  countryNameKo = "대상국",
  observations = [],
  entities = [],
  indicators = [],
  detailTemplate = "entity",
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
      setError("분석 구성을 확인할 수 없습니다");
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
        console.error("Public data analysis load failed", reason);
        setError("분석에 필요한 데이터를 불러오지 못했습니다");
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
  const publicDataSummary = useMemo(
    () =>
      buildPublicDataSummaryV127(
        countryNameKo,
        visibleObservations,
        visibleEntities
      ),
    [countryNameKo, visibleEntities, visibleObservations]
  );
  const publicSummary = getPublicVisualizationSummaryV126(elementId);
  const presentationTier = publicSummary?.presentationKind || "generic-fallback";

  return (
    <section
      className="cev123-shell cev125-shell"
      aria-label="공개 데이터 분석"
      data-element-id={elementId}
      data-presentation-tier={presentationTier}
      data-analysis-state={runtime ? "ready" : "loading"}
      data-testid="public-analysis-root"
    >
      <header className="cev123-heading">
        <div>
          <span>공개 데이터</span>
          <h3>{runtime ? "분석 화면" : "데이터를 준비하는 중"}</h3>
        </div>
        <small data-testid="public-data-summary">{publicDataSummary}</small>
      </header>

      {error && (
        <div className="cev123-empty" role="alert" data-public-empty-reason="analysis-asset-error">
          <strong>{error}</strong>
          <p>잠시 후 다시 시도해 주세요.</p>
        </div>
      )}

      {!error && !runtime && (
        <div className="cev123-empty" role="status">
          <strong>측정항목과 분류를 준비하는 중입니다</strong>
        </div>
      )}

      {runtime && (
        <PublicDataAnalysisRouterV126
          elementId={elementId}
          contract={runtime.contract}
          semantics={runtime.semantics}
          observations={visibleObservations}
          entities={visibleEntities}
          indicators={indicators}
          countryNameKo={countryNameKo}
          selectorState={selectorState}
          onSelectorStateChange={onSelectorStateChange}
          detailTemplate={detailTemplate}
        />
      )}
    </section>
  );
}

function buildPublicDataSummaryV127(
  countryNameKo: string,
  observations: VietnamObservationV124[],
  entities: VietnamEntityV124[]
): string {
  const populatedObservations = observations.filter(
    isPopulatedObservationV127
  );
  const missingObservationCount =
    observations.length - populatedObservations.length;
  const populatedEntityCount = entities.filter(isPopulatedEntityV127).length;

  if (observations.length > 0) {
    const indicatorCount = new Set(
      populatedObservations.map((row) => row.indicatorId).filter(Boolean)
    ).size;
    const populatedYears = populatedObservations
      .map((row) => row.year)
      .filter((year): year is number =>
        typeof year === "number" && Number.isFinite(year)
      )
      .sort((left, right) => left - right);

    if (indicatorCount > 0 && populatedYears.length > 0) {
      const firstYear = populatedYears[0];
      const lastYear = populatedYears[populatedYears.length - 1];
      const yearRange =
        firstYear === lastYear ? `${firstYear}년` : `${firstYear}~${lastYear}년`;
      return `${countryNameKo} · 지표 ${indicatorCount.toLocaleString(
        "ko-KR"
      )}종 · 관측기간 ${yearRange}`;
    }

    const observationSummary = [
      `공개 관측값 ${populatedObservations.length.toLocaleString("ko-KR")}건`,
      missingObservationCount > 0
        ? `결측 ${missingObservationCount.toLocaleString("ko-KR")}건`
        : "",
    ]
      .filter(Boolean)
      .join(" · ");
    const entitySummary =
      populatedEntityCount > 0
        ? ` · 목록 ${populatedEntityCount.toLocaleString("ko-KR")}건`
        : "";
    return `${countryNameKo} · ${observationSummary}${entitySummary}`;
  }

  if (entities.length > 0) {
    return `${countryNameKo} · 목록 ${populatedEntityCount.toLocaleString(
      "ko-KR"
    )}건`;
  }

  return `${countryNameKo} · 공개된 관측값 또는 목록이 없습니다`;
}

function isPopulatedObservationV127(row: VietnamObservationV124): boolean {
  if (row.value === null || row.value === undefined || row.value === "") {
    return false;
  }
  return typeof row.value !== "number" || Number.isFinite(row.value);
}

function isPopulatedEntityV127(row: VietnamEntityV124): boolean {
  if (typeof row.name === "string" && row.name.trim()) return true;
  return Object.values(row.normalizedAttributes).some((value) => {
    if (value === null || value === undefined || value === "") return false;
    if (Array.isArray(value)) return value.length > 0;
    return typeof value !== "number" || Number.isFinite(value);
  });
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
    missingDataPolicy: "현재 공개된 값을 확인할 수 없습니다",
    currentVisualizationIssue: "",
    contractStatus: summary.contractStatus,
  };
}
