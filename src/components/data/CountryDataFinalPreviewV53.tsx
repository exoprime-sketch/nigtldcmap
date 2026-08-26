import { useEffect, useState } from "react";
import type { VietnamDemoElement } from "../../types/vietnamDemo";
import { openExternalUrl } from "../../utils/browser";
import {
  getContextLabel,
  getFinalDisplayTitle,
  getFinalPreviewMode,
  modeLabel,
  sampleFieldValue,
  sampleTrend,
  getFinalUserQuestion,
} from "../../utils/dataPreviewV53";
import type {
  FinalPreviewMode,
} from "../../utils/dataPreviewV53";
import "../../styles/data-final-preview-v53.css";
import "../../styles/public-layout-v61.css";
import "../../styles/summary-detail-v62.css";
import "../../styles/tab-model-v63.css";
import SemanticCollectionPreviewV65 from "./SemanticCollectionPreviewV65";
import { hasSemanticCollectionV65 } from "../../utils/dataSemanticPresentationV65";
import {
  SpatialDataDetailV66,
  SpatialDataOverviewV66,
} from "./SpatialDataPreviewV66";
import { isSpatialElementV66 } from "../../utils/spatialPresentationV66";
import {
  CapabilityControlsV72,
  CapabilityDetailV67,
  CapabilityOverviewV67,
  getDefaultCapabilityFilterStateV72,
} from "./CapabilityReadinessPreviewV67";
import type {
  CapabilityFilterStateV72,
} from "./CapabilityReadinessPreviewV67";
import { isCapabilityElementV67 } from "../../utils/capabilityPresentationV67";
import "../../styles/global-statistic-v57.css";
import {
  GlobalStatisticControlsV57,
  GlobalStatisticDetailV57,
  GlobalStatisticOverviewV57,
} from "./GlobalStatisticPreviewV57";
import {
  getGlobalStatisticYears,
  getPreviewCountryName,
  isGlobalStatisticElement,
} from "../../utils/globalStatisticV57";
import {
  CountryStructuredDetailV60,
  CountryStructuredOverviewV60,
  getStructuredModeLabelV60,
  isStructuredCountryPreviewV60,
} from "./CountryStructuredPreviewV60";
import {
  getPreviewTabModel,
} from "../../utils/dataTabModelV63";
import type {
  PreviewTabKey,
} from "../../utils/dataTabModelV63";
import {
  DimensionAwareOverviewV68,
  DimensionControlsV68,
} from "./DimensionAwareGlobalPreviewV68";
import {
  getDefaultDimensionValuesV68,
  getDimensionDefinitionV68,
} from "../../utils/dataDimensionV68";
import CountryScopeSelectorV60 from "./CountryScopeSelectorV60";
import { needsCountrySelector } from "../../utils/countryDataScopeV60";
import {
  ResearchInnovationControlsV70,
  ResearchInnovationOverviewV70,
} from "./ResearchInnovationPreviewV70";
import {
  isResearchInnovationElementV70,
} from "../../utils/researchInnovationV70";
import type {
  ResearchRecordType,
} from "../../utils/researchInnovationV70";
import {
  TechnologyComparisonControlsV71,
  TechnologyComparisonDetailV71,
  TechnologyComparisonOverviewV71,
} from "./TechnologyComparisonPreviewV71";
import {
  isTechnologyComparisonElementV71,
} from "../../utils/technologyComparisonV71";
import type {
  CompetitorId,
} from "../../utils/technologyComparisonV71";
import ContextualDataPreviewV73 from "./ContextualDataPreviewV73";
import { isContextualElementV73 } from "../../utils/contextualPresentationV73";
import {
  GcfProjectPortfolioListV80,
  GcfProjectPortfolioOverviewV80,
} from "./GcfProjectPortfolioPreviewV80";

interface Props {
  element: VietnamDemoElement;
  countryIso3?: string;
  countryName?: string;
  onCountryChange?: (iso3: string) => void;
  exampleMode?: boolean;
  embeddedExample?: boolean;
}

export default function CountryDataFinalPreviewV53({
  element,
  countryIso3 = "VNM",
  countryName = "베트남",
  onCountryChange,
  exampleMode = false,
  embeddedExample = false,
}: Props) {
  const [tab, setTab] = useState<PreviewTabKey>("primary");
  const profile = element.presentation;
  const mode = getFinalPreviewMode(element);
  const globalStatistic = isGlobalStatisticElement(element);
  const structuredCountryView = isStructuredCountryPreviewV60(
    element.elementId
  );
  const tabModel = getPreviewTabModel(element);
  const semanticCollection = hasSemanticCollectionV65(element);
  const spatialElement = isSpatialElementV66(element);
  const capabilityElement = isCapabilityElementV67(element);
  const dimensionDefinition = getDimensionDefinitionV68(element.elementId);
  const researchInnovationElement = isResearchInnovationElementV70(element);
  const technologyComparisonElement = isTechnologyComparisonElementV71(element);
  const contextualElement = isContextualElementV73(element);
  const gcfProjectElement = element.elementId === "D-020";
  const showEmbeddedCountrySelector =
    needsCountrySelector(element.elementId) &&
    !globalStatistic &&
    Boolean(onCountryChange);
  const [globalCountryIso3, setGlobalCountryIso3] = useState(countryIso3);
  const [globalYear, setGlobalYear] = useState(
    getGlobalStatisticYears(element)[0] ?? 2025
  );
  const [dimensionValues, setDimensionValues] = useState<
    Record<string, string>
  >(() => getDefaultDimensionValuesV68(element.elementId));
  const [researchRecordType, setResearchRecordType] =
    useState<ResearchRecordType>("all");
  const [researchTechnologyId, setResearchTechnologyId] = useState("all");
  const [comparisonTechnologyId, setComparisonTechnologyId] = useState("all");
  const [comparisonCompetitorId, setComparisonCompetitorId] =
    useState<CompetitorId>("all");
  const [comparisonYear, setComparisonYear] = useState(2025);
  const [capabilityFilters, setCapabilityFilters] =
    useState<CapabilityFilterStateV72>(() =>
      getDefaultCapabilityFilterStateV72(element.elementId)
    );

  useEffect(() => {
    setGlobalCountryIso3(countryIso3);
  }, [countryIso3]);

  useEffect(() => {
    setGlobalYear(getGlobalStatisticYears(element)[0] ?? 2025);
    setDimensionValues(getDefaultDimensionValuesV68(element.elementId));
    setResearchRecordType("all");
    setResearchTechnologyId("all");
    setComparisonTechnologyId("all");
    setComparisonCompetitorId("all");
    setComparisonYear(2025);
    setCapabilityFilters(getDefaultCapabilityFilterStateV72(element.elementId));
  }, [element.elementId]);
  const activeCountryName = globalStatistic
    ? getPreviewCountryName(globalCountryIso3)
    : countryName;

  return (
    <section
      className={`v53-page ${exampleMode ? "v102-example-mode" : ""} ${
        embeddedExample ? "v104-embedded-example" : ""
      }`}
    >
      {exampleMode && (
        <div className="v53-preview-note" role="note">
          <b>시각화 예시 · 실제 국가 통계가 아닙니다</b>
          <span>
            실제 데이터가 연결된 뒤의 화면 구성을 확인하기 위한 예시입니다. 국가
            현황·사업 타당성·국가 비교·다운로드의 실제 근거로 사용되지 않습니다.
          </span>
        </div>
      )}
      {!embeddedExample && (
        <header className="v53-head">
          <div className="v61-preview-context">
            <span>{getContextLabel(element.elementId, activeCountryName)}</span>
            <b>
              {exampleMode
                ? "예시 데이터"
                : gcfProjectElement
                ? "제공 중"
                : "자료 준비 중"}
            </b>
          </div>
          <h3>{getFinalDisplayTitle(element)}</h3>
          <p className="v53-question">{getFinalUserQuestion(element)}</p>
          <small>{profile.planningUse}</small>
        </header>
      )}

      {globalStatistic && (
        <GlobalStatisticControlsV57
          element={element}
          countryIso3={globalCountryIso3}
          year={globalYear}
          onCountryChange={(iso3) => {
            setGlobalCountryIso3(iso3);
            onCountryChange?.(iso3);
          }}
          onYearChange={setGlobalYear}
        />
      )}

      {showEmbeddedCountrySelector && (
        <CountryScopeSelectorV60
          elementId={element.elementId}
          countryIso3={countryIso3}
          onCountryChange={(iso3) => onCountryChange?.(iso3)}
        />
      )}

      {dimensionDefinition && (
        <DimensionControlsV68
          element={element}
          values={dimensionValues}
          onChange={(key, value) =>
            setDimensionValues((current) => ({
              ...current,
              [key]: value,
            }))
          }
        />
      )}

      {researchInnovationElement && (
        <ResearchInnovationControlsV70
          recordType={researchRecordType}
          technologyId={researchTechnologyId}
          onRecordTypeChange={setResearchRecordType}
          onTechnologyChange={setResearchTechnologyId}
        />
      )}

      {technologyComparisonElement && (
        <TechnologyComparisonControlsV71
          technologyId={comparisonTechnologyId}
          competitorId={comparisonCompetitorId}
          year={comparisonYear}
          onTechnologyChange={setComparisonTechnologyId}
          onCompetitorChange={setComparisonCompetitorId}
          onYearChange={setComparisonYear}
        />
      )}

      {capabilityElement && (
        <CapabilityControlsV72
          element={element}
          filters={capabilityFilters}
          onChange={setCapabilityFilters}
        />
      )}

      <div className="v53-toolbar v63-toolbar">
        <div>
          <span>주요 보기</span>
          <b>
            {tabModel.detailMeaningful
              ? structuredCountryView
                ? getStructuredModeLabelV60(element.elementId)
                : modeLabel(mode)
              : tabModel.primaryLabel}
          </b>
        </div>

        <div
          className={`v53-tabs v63-tabs tabs-${tabModel.tabs.length}`}
          role="tablist"
        >
          {tabModel.tabs.map((item) => (
            <button
              key={item.key}
              type="button"
              role="tab"
              aria-selected={tab === item.key}
              className={tab === item.key ? "active" : ""}
              onClick={() => setTab(item.key)}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {tab === "primary" &&
        (capabilityElement ? (
          <CapabilityOverviewV67
            element={element}
            countryName={activeCountryName}
            filters={capabilityFilters}
          />
        ) : technologyComparisonElement ? (
          <TechnologyComparisonOverviewV71
            technologyId={comparisonTechnologyId}
            competitorId={comparisonCompetitorId}
            year={comparisonYear}
          />
        ) : gcfProjectElement ? (
          <GcfProjectPortfolioOverviewV80
            countryIso3={countryIso3}
            countryName={activeCountryName}
          />
        ) : contextualElement ? (
          <ContextualDataPreviewV73
            element={element}
            countryName={activeCountryName}
          />
        ) : researchInnovationElement ? (
          <ResearchInnovationOverviewV70
            element={element}
            countryIso3={globalCountryIso3}
            countryName={activeCountryName}
            year={globalYear}
            recordType={researchRecordType}
            technologyId={researchTechnologyId}
          />
        ) : dimensionDefinition ? (
          <DimensionAwareOverviewV68
            element={element}
            countryIso3={globalStatistic ? globalCountryIso3 : countryIso3}
            countryName={activeCountryName}
            year={globalYear}
            values={dimensionValues}
          />
        ) : globalStatistic ? (
          <GlobalStatisticOverviewV57
            element={element}
            countryIso3={globalCountryIso3}
            year={globalYear}
          />
        ) : structuredCountryView ? (
          <CountryStructuredOverviewV60
            element={element}
            countryName={activeCountryName}
          />
        ) : semanticCollection ? (
          <SemanticCollectionPreviewV65
            element={element}
            countryName={activeCountryName}
          />
        ) : spatialElement ? (
          <SpatialDataOverviewV66
            element={element}
            countryIso3={countryIso3}
            countryName={activeCountryName}
          />
        ) : (
          <ModeOverview element={element} mode={mode} />
        ))}

      {tab === "detail" &&
        tabModel.detailMeaningful &&
        (technologyComparisonElement ? (
          <TechnologyComparisonDetailV71
            technologyId={comparisonTechnologyId}
            competitorId={comparisonCompetitorId}
            year={comparisonYear}
          />
        ) : gcfProjectElement ? (
          <GcfProjectPortfolioListV80
            countryIso3={countryIso3}
            countryName={activeCountryName}
          />
        ) : capabilityElement ? (
          <CapabilityDetailV67
            element={element}
            countryName={activeCountryName}
            filters={capabilityFilters}
          />
        ) : globalStatistic ? (
          <GlobalStatisticDetailV57
            element={element}
            countryIso3={globalCountryIso3}
            year={globalYear}
          />
        ) : structuredCountryView ? (
          <CountryStructuredDetailV60
            element={element}
            countryName={activeCountryName}
          />
        ) : spatialElement ? (
          <SpatialDataDetailV66
            element={element}
            countryName={activeCountryName}
          />
        ) : (
          <SemanticDetail element={element} mode={mode} />
        ))}
      {tab === "source" && <SourcePanel element={element} />}

      {!embeddedExample && (
        <footer className="v53-footer">
          <div>
            <span>
              {exampleMode
                ? "예정 출처"
                : gcfProjectElement
                ? "출처"
                : "예정 출처"}
            </span>
            <b>{element.effectiveSource || element.sourceDatabase}</b>
          </div>
          <div>
            <span>공간단위</span>
            <b>{element.spatialLevel || "국가"}</b>
          </div>
          {element.sourceUrl ? (
            <button
              type="button"
              onClick={() => openExternalUrl(element.sourceUrl || "")}
            >
              원자료 확인 ↗
            </button>
          ) : (
            <span className="v53-source-pending">공식 출처 확인 중</span>
          )}
        </footer>
      )}
    </section>
  );
}

function ModeOverview({
  element,
  mode,
}: {
  element: VietnamDemoElement;
  mode: FinalPreviewMode;
}) {
  switch (mode) {
    case "relationship_crosswalk":
      return <RelationshipCrosswalkSummary />;
    case "sdg_scorecard":
      return <SdgScorecardSummary />;
    case "seasonal_comparison":
      return <SeasonalComparison />;
    case "mineral_inventory":
      return <MineralInventory />;
    case "requirements_matrix":
      return <RequirementsMatrixSummary />;
    case "document_library":
      return <DocumentLibrary />;
    case "opportunity_table":
      return <OpportunityTableSummary />;
    case "participation_status":
      return <ParticipationStatus />;
    case "comparative_matrix":
      return <ComparativeMatrixSummary />;
    case "index_benchmark":
    case "kpi_trend":
    case "risk_dashboard":
    case "market_dashboard":
    case "budget_dashboard":
    case "cost_comparison":
    case "mineral_dashboard":
      return <TrendOverview element={element} mode={mode} />;
    case "composition":
      return <CompositionOverview element={element} />;
    case "map":
      return <MapOverview element={element} />;
    case "seasonal_calendar":
      return <SeasonCalendar />;
    case "scenario":
    case "hazard_dashboard":
      return <ScenarioOverview element={element} />;
    case "event_timeline":
      return <EventTimeline />;
    case "policy_evidence":
      return <PolicyEvidence element={element} />;
    case "policy_timeline":
    case "agreement_timeline":
      return <PolicyTimeline element={element} />;
    case "process":
      return <ProcessFlow element={element} />;
    case "portfolio":
    case "finance_portfolio":
    case "competitor_dashboard":
      return <PortfolioOverview element={element} />;
    case "directory":
      return <DirectoryOverview element={element} />;
    case "capability_matrix":
      return <CapabilityOverview element={element} />;
    case "research_dashboard":
      return <ResearchOverview element={element} />;
    case "trade_dashboard":
      return <TradeOverview element={element} />;
    case "support_programs":
      return <SupportPrograms />;
    default:
      return <GenericOverview element={element} />;
  }
}

function TrendOverview({
  element,
  mode,
}: {
  element: VietnamDemoElement;
  mode: FinalPreviewMode;
}) {
  const fields = element.presentation.headlineFields.slice(0, 4);
  const values = sampleTrend(element.elementId, 8);

  return (
    <div className="v53-two-col">
      <section className="v53-panel">
        <div className="v53-kpis">
          {fields.slice(0, 3).map((field, index) => (
            <article key={field}>
              <span>{field}</span>
              <strong>
                {sampleFieldValue(field, element.elementId, index)}
              </strong>
              <small>예시값 · 2025</small>
            </article>
          ))}
        </div>
        <LineChart values={values} />
      </section>

      <aside className="v53-panel">
        <h4>{mode === "cost_comparison" ? "비교 기준" : "최근 값"}</h4>
        {fields.slice(0, 4).map((field, index) => (
          <div className="v53-side-row" key={field}>
            <span>{field}</span>
            <b>{sampleFieldValue(field, element.elementId, index + 4)}</b>
          </div>
        ))}
      </aside>
    </div>
  );
}

function CompositionOverview({ element }: { element: VietnamDemoElement }) {
  const fields = element.presentation.headlineFields.slice(0, 5);
  const shares = [34, 25, 18, 13, 10];
  return (
    <div className="v53-two-col">
      <section className="v53-panel">
        <div className="v53-stack">
          {fields.map((field, index) => (
            <i key={field} style={{ width: `${shares[index]}%` }} />
          ))}
        </div>
        <div className="v53-legend">
          {fields.map((field, index) => (
            <span key={field}>
              <i /> {field} <b>{shares[index]}%</b>
            </span>
          ))}
        </div>
        <LineChart
          values={sampleTrend(`${element.elementId}:mix`, 7)}
          compact
        />
      </section>
      <aside className="v53-panel">
        <h4>구성 확인</h4>
        <p>절대값과 구성비를 함께 제공하고, 연도별 변화는 별도 추세로 표시</p>
      </aside>
    </div>
  );
}

function RelationshipCrosswalkSummary() {
  const sdgCounts = [
    ["SDG 13", "3개 조치"],
    ["SDG 7", "1개 조치"],
    ["SDG 9", "1개 조치"],
    ["SDG 15", "1개 조치"],
    ["SDG 2", "1개 조치"],
  ];

  return (
    <section className="v62-summary-layout">
      <div className="v62-summary-kpis">
        <article>
          <span>NDC 조치</span>
          <strong>3개</strong>
          <small>감축 2 · 적응 1 · 예시</small>
        </article>
        <article>
          <span>연결 SDG</span>
          <strong>5개</strong>
          <small>중복 제외 · 예시</small>
        </article>
        <article>
          <span>가장 많이 연결</span>
          <strong>SDG 13</strong>
          <small>3개 조치 · 예시</small>
        </article>
      </div>

      <div className="v62-summary-panel">
        <header>
          <h4>연계 개요</h4>
          <p>NDC 조치가 어떤 SDG에 집중되는지 먼저 확인</p>
        </header>
        <div className="v62-sdg-summary">
          {sdgCounts.map(([goal, count]) => (
            <div key={goal}>
              <span>{goal}</span>
              <i>
                <b
                  style={{
                    width: goal === "SDG 13" ? "100%" : "34%",
                  }}
                />
              </i>
              <strong>{count}</strong>
            </div>
          ))}
        </div>
      </div>

      <div className="v62-summary-note">
        상세 탭에서 조치별 연결 SDG·연계 논리·NDC 원문 위치를 확인
      </div>
    </section>
  );
}

function RelationshipCrosswalkDetail() {
  const rows = [
    {
      action: "재생에너지 확대",
      type: "감축",
      goals: ["SDG 7", "SDG 9", "SDG 13"],
      evidence: "에너지 전환 조치와 에너지·인프라·기후목표 연계",
      location: "NDC 에너지 부문 · 페이지/절",
    },
    {
      action: "산림 흡수원 강화",
      type: "감축",
      goals: ["SDG 13", "SDG 15"],
      evidence: "산림·토지이용 조치와 기후행동·육상생태계 연계",
      location: "NDC LULUCF 부문 · 페이지/절",
    },
    {
      action: "기후회복력 농업",
      type: "적응",
      goals: ["SDG 2", "SDG 13"],
      evidence: "적응·농업 조치와 식량·기후회복력 연계",
      location: "NDC 적응 부문 · 페이지/절",
    },
  ];

  return (
    <section className="v62-crosswalk-detail">
      <div className="v62-crosswalk-head">
        <span>NDC 조치</span>
        <span>유형</span>
        <span>연결 SDG</span>
        <span>연계 근거</span>
        <span>근거 위치</span>
      </div>

      {rows.map((row) => (
        <div className="v62-crosswalk-row" key={row.action}>
          <b>{row.action}</b>
          <span className="v62-type-badge">{row.type}</span>
          <div className="v53-sdg-tags">
            {row.goals.map((goal) => (
              <span key={goal}>{goal}</span>
            ))}
          </div>
          <p>{row.evidence}</p>
          <small>{row.location}</small>
        </div>
      ))}

      <div className="v62-detail-footer">
        NDC 공식 문장·근거 위치와 SDG 연계 근거는 데이터 제공 시 함께 확인할 수
        있습니다
      </div>
    </section>
  );
}

function SdgScorecardSummary() {
  return (
    <section className="v62-summary-layout">
      <div className="v62-summary-kpis four">
        <article>
          <span>전체 목표</span>
          <strong>17개</strong>
          <small>SDG 1–17</small>
        </article>
        <article>
          <span>개선</span>
          <strong>8개</strong>
          <small>예시 상태</small>
        </article>
        <article>
          <span>과제</span>
          <strong>5개</strong>
          <small>예시 상태</small>
        </article>
        <article>
          <span>정체</span>
          <strong>4개</strong>
          <small>예시 상태</small>
        </article>
      </div>

      <div className="v62-state-distribution">
        <i className="improve" style={{ width: "47.1%" }} />
        <i className="challenge" style={{ width: "29.4%" }} />
        <i className="stagnant" style={{ width: "23.5%" }} />
      </div>

      <div className="v62-summary-note">
        상세 탭에서 SDG 1–17의 개별 상태와 추세를 확인
      </div>
    </section>
  );
}

function SdgScorecardDetail() {
  const states = [
    "개선",
    "과제",
    "정체",
    "개선",
    "과제",
    "개선",
    "개선",
    "정체",
    "개선",
    "과제",
    "정체",
    "개선",
    "개선",
    "과제",
    "정체",
    "개선",
    "과제",
  ];

  return (
    <section className="v53-sdg-grid">
      {states.map((state, index) => (
        <article key={index} className={`state-${state}`}>
          <span>SDG {index + 1}</span>
          <b>{state}</b>
          <small>목표별 최신 상태 · 추세</small>
        </article>
      ))}
    </section>
  );
}

function SeasonalComparison() {
  return (
    <div className="v53-two-col">
      <section className="v53-panel v53-season-bars">
        <article>
          <span>건기 평균유량</span>
          <i style={{ width: "42%" }} />
          <b>예시값</b>
        </article>
        <article>
          <span>우기 평균유량</span>
          <i style={{ width: "87%" }} />
          <b>예시값</b>
        </article>
        <article>
          <span>계절변동률</span>
          <i style={{ width: "61%" }} />
          <b>예시값</b>
        </article>
      </section>
      <aside className="v53-panel">
        <h4>관측지점</h4>
        <div className="v53-side-row">
          <span>지점</span>
          <b>하천 관측소 예시</b>
        </div>
        <div className="v53-side-row">
          <span>기간</span>
          <b>최근 10년</b>
        </div>
      </aside>
    </div>
  );
}

function MineralInventory() {
  const minerals = ["리튬", "코발트", "니켈", "구리", "희토류", "망간"];
  return (
    <section className="v53-mineral-inventory">
      {minerals.map((mineral, index) => (
        <article key={mineral}>
          <b>{mineral}</b>
          <span
            className={
              index % 3 === 0 ? "yes" : index % 3 === 1 ? "partial" : "unknown"
            }
          >
            {index % 3 === 0
              ? "확인"
              : index % 3 === 1
              ? "일부 자료"
              : "확인 필요"}
          </span>
          <small>매장량·생산량·광산 위치는 관련 세부자료에서 확인</small>
        </article>
      ))}
    </section>
  );
}

function MapOverview({ element }: { element: VietnamDemoElement }) {
  return (
    <div className="v53-two-col">
      <section className="v53-panel">
        <div className="v53-map">
          <i style={{ left: "60%", top: "18%" }} />
          <i style={{ left: "52%", top: "42%" }} />
          <i style={{ left: "64%", top: "63%" }} />
          <i style={{ left: "68%", top: "79%" }} />
        </div>
      </section>
      <aside className="v53-panel">
        <h4>지역·시설 목록</h4>
        {["지역 A", "지역 B", "지역 C"].map((name, index) => (
          <div className="v53-side-row" key={name}>
            <span>{name}</span>
            <b>
              {sampleFieldValue(
                element.presentation.headlineFields[index] || "값",
                element.elementId,
                index
              )}
            </b>
          </div>
        ))}
        <small>예시 지도 · 실제 좌표 아님</small>
      </aside>
    </div>
  );
}

function SeasonCalendar() {
  return (
    <section className="v53-calendar">
      {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => {
        const wet = month >= 5 && month <= 10;
        return (
          <article key={month} className={wet ? "wet" : "dry"}>
            <b>{month}월</b>
            <span>{wet ? "우기" : "건기"}</span>
            <small>{wet ? "강수 많음" : "강수 적음"}</small>
          </article>
        );
      })}
    </section>
  );
}

function ScenarioOverview({ element }: { element: VietnamDemoElement }) {
  return (
    <div className="v53-two-col">
      <section className="v53-panel">
        <div className="v53-scenario-legend">
          <span>기준</span>
          <span>중간</span>
          <span>고배출</span>
        </div>
        <MultiLine seed={element.elementId} />
      </section>
      <aside className="v53-panel">
        <h4>시점별 값</h4>
        {["2030", "2050", "2100"].map((year, index) => (
          <div className="v53-side-row" key={year}>
            <span>{year}</span>
            <b>{(31 + index * 9.8).toFixed(1)}</b>
          </div>
        ))}
        <small>예시값</small>
      </aside>
    </div>
  );
}

function EventTimeline() {
  return (
    <section className="v53-events">
      {[
        ["2021", "홍수", "피해인구 12만 명 · 경제손실 USD 85M"],
        ["2023", "태풍", "피해인구 19만 명 · 경제손실 USD 120M"],
        ["2025", "폭염", "영향지역·피해지표 예시"],
      ].map(([year, type, detail]) => (
        <article key={year}>
          <time>{year}</time>
          <div>
            <b>{type}</b>
            <p>{detail}</p>
            <small>예시값</small>
          </div>
        </article>
      ))}
    </section>
  );
}

function PolicyEvidence({ element }: { element: VietnamDemoElement }) {
  const fields = element.presentation.headlineFields.slice(0, 6);
  return (
    <section className="v53-policy-list">
      {fields.map((field, index) => (
        <article key={field}>
          <div>
            <span>{String(index + 1).padStart(2, "0")}</span>
            <b>{field}</b>
          </div>
          <strong>{index % 3 === 0 ? "명시 확인" : "관련 내용 확인"}</strong>
          <p>{sampleFieldValue(field, element.elementId, index)}</p>
          <small>공식 원문 · 한국어 의미 · 페이지/절</small>
        </article>
      ))}
    </section>
  );
}

function PolicyTimeline({ element }: { element: VietnamDemoElement }) {
  const fields = element.presentation.headlineFields.slice(0, 5);
  return (
    <section className="v53-timeline">
      {fields.map((field, index) => (
        <article key={field}>
          <time>{2018 + index * 2}</time>
          <b>{field}</b>
          <span>{sampleFieldValue(field, element.elementId, index)}</span>
        </article>
      ))}
    </section>
  );
}

function ProcessFlow({ element }: { element: VietnamDemoElement }) {
  const steps = element.presentation.headlineFields.slice(0, 5);
  return (
    <section className="v53-process">
      {steps.map((field, index) => (
        <article key={field}>
          <span>{String(index + 1).padStart(2, "0")}</span>
          <b>{field}</b>
          <small>{20 + index * 12}일 · 예시값</small>
          <em>{index % 2 === 0 ? "필수" : "조건부"}</em>
        </article>
      ))}
    </section>
  );
}

function RequirementsMatrixSummary() {
  return (
    <section className="v62-summary-layout">
      <div className="v62-summary-kpis">
        <article>
          <span>PPP 법률</span>
          <strong>있음</strong>
          <small>법률명·개정일 확인</small>
        </article>
        <article>
          <span>전담기관</span>
          <strong>확인</strong>
          <small>기관명·공식 역할</small>
        </article>
        <article>
          <span>조달방식</span>
          <strong>경쟁입찰</strong>
          <small>주요 방식 예시</small>
        </article>
      </div>

      <div className="v62-chip-section">
        <span>주요 계약유형</span>
        <div>
          <b>BOT</b>
          <b>BOO</b>
          <b>Concession</b>
        </div>
      </div>
    </section>
  );
}

function RequirementsMatrixDetail() {
  const rows = [
    ["PPP 법률", "있음", "법률명 · 개정일 · 공식 원문"],
    ["PPP 전담기관", "확인", "기관명 · 역할 · 소관부처"],
    ["조달방식", "경쟁입찰 중심", "허용방식 · 예외조건"],
    ["계약유형", "BOT · BOO · Concession", "적용조건 · 계약기간"],
    ["VfM 평가", "의무/조건부", "적용기준 · 평가기관"],
    ["사업이력", "프로젝트 목록", "분야 · 상태 · 사업규모"],
  ];

  return (
    <MatrixTable rows={rows} headers={["항목", "현황", "세부 확인내용"]} />
  );
}

function DocumentLibrary() {
  return (
    <section className="v53-docs">
      {["재생에너지 법령", "전력개발계획", "입찰·투자지침"].map(
        (name, index) => (
          <article key={name}>
            <span>공식 문서</span>
            <b>{name}</b>
            <p>발행기관 예시 · {2022 + index}</p>
            <small>적용기간 · 공식 URL · 최신 개정 여부</small>
          </article>
        )
      )}
    </section>
  );
}

function PortfolioOverview({ element }: { element: VietnamDemoElement }) {
  return (
    <>
      <div className="v53-kpis v53-portfolio-kpis">
        <article>
          <span>관련 사업</span>
          <strong>12건</strong>
          <small>예시값</small>
        </article>
        <article>
          <span>재원</span>
          <strong>USD 245M</strong>
          <small>예시값</small>
        </article>
        <article>
          <span>이행 중</span>
          <strong>7건</strong>
          <small>예시값</small>
        </article>
      </div>
      <section className="v53-projects">
        {["프로젝트 A", "프로젝트 B", "프로젝트 C"].map((name, index) => (
          <article key={name}>
            <div>
              <b>{name}</b>
              <span>{["이행 중", "승인", "완료"][index]}</span>
            </div>
            <p>{element.presentation.headlineFields.slice(0, 3).join(" · ")}</p>
            <small>기관 예시 · 지역 예시 · 기간 예시</small>
          </article>
        ))}
      </section>
    </>
  );
}

function OpportunityTableSummary() {
  const opportunities = [
    ["PCP 사업 A", "KOICA", "2026-09-30"],
    ["RFP 사업 B", "EDCF", "2026-11-15"],
    ["기술협력 C", "부처", "2027-01-20"],
  ];

  return (
    <section className="v62-summary-layout">
      <div className="v62-summary-kpis">
        <article>
          <span>확인 공고</span>
          <strong>3건</strong>
          <small>예시</small>
        </article>
        <article>
          <span>총 예산</span>
          <strong>USD 36M</strong>
          <small>예시 합계</small>
        </article>
        <article>
          <span>가장 빠른 마감</span>
          <strong>2026-09-30</strong>
          <small>예시</small>
        </article>
      </div>

      <div className="v62-opportunity-list">
        {opportunities.map(([title, agency, deadline]) => (
          <article key={title}>
            <b>{title}</b>
            <span>{agency}</span>
            <small>마감 {deadline}</small>
          </article>
        ))}
      </div>
    </section>
  );
}

function OpportunityTableDetail() {
  const rows = [
    ["PCP 사업 A", "KOICA", "에너지", "USD 8M", "2026-09-30", "관련 실적"],
    ["RFP 사업 B", "EDCF", "전력망", "USD 25M", "2026-11-15", "컨소시엄 가능"],
    ["기술협력 C", "부처", "효율", "USD 3M", "2027-01-20", "전문인력"],
  ];

  return (
    <MatrixTable
      rows={rows}
      headers={["사업", "발주기관", "분야", "예산", "마감", "자격"]}
    />
  );
}

function DirectoryOverview({ element }: { element: VietnamDemoElement }) {
  return (
    <section className="v53-directory">
      {["기관 A", "기관 B", "기관 C"].map((name, index) => (
        <article key={name}>
          <span>{name}</span>
          <b>
            {sampleFieldValue(
              element.presentation.headlineFields[1] || "역할",
              element.elementId,
              index
            )}
          </b>
          <p>{index === 0 ? "국가 공식 창구" : "관련 분야 수행기관"}</p>
          <small>담당자 · 이메일 · 공식 역할 근거</small>
        </article>
      ))}
    </section>
  );
}

function CapabilityOverview({ element }: { element: VietnamDemoElement }) {
  return (
    <section className="v53-capability">
      {element.presentation.headlineFields.slice(0, 6).map((field, index) => (
        <div key={field}>
          <b>{field}</b>
          <span
            className={
              index % 3 === 0 ? "good" : index % 3 === 1 ? "mid" : "low"
            }
          >
            {index % 3 === 0
              ? "확인"
              : index % 3 === 1
              ? "일부 확인"
              : "추가 확인"}
          </span>
          <small>근거 문서·기관·기준일</small>
        </div>
      ))}
    </section>
  );
}

function ParticipationStatus() {
  return (
    <div className="v53-two-col">
      <section className="v53-panel v53-participation">
        <span>참여 여부</span>
        <strong>참여</strong>
        <p>Country Page와 현재 지원내용을 함께 확인</p>
      </section>
      <aside className="v53-panel">
        <h4>지원 현황</h4>
        <div className="v53-side-row">
          <span>협력 분야</span>
          <b>NDC 이행지원</b>
        </div>
        <div className="v53-side-row">
          <span>지원내용</span>
          <b>정책·역량·재원</b>
        </div>
        <div className="v53-side-row">
          <span>원문</span>
          <b>Country Page</b>
        </div>
      </aside>
    </div>
  );
}

function ComparativeMatrixSummary() {
  return (
    <section className="v62-summary-layout">
      <div className="v62-summary-kpis">
        <article>
          <span>한국 우위</span>
          <strong>2개 기술</strong>
          <small>예시 판정</small>
        </article>
        <article>
          <span>동등</span>
          <strong>1개 기술</strong>
          <small>예시 판정</small>
        </article>
        <article>
          <span>주요 판단근거</span>
          <strong>4개 축</strong>
          <small>TRL · 수출 · 비용 · 공급망</small>
        </article>
      </div>

      <div className="v62-chip-section">
        <span>우위 근거</span>
        <div>
          <b>TRL</b>
          <b>수출</b>
          <b>실증</b>
          <b>EPC 경험</b>
        </div>
      </div>
    </section>
  );
}

function ComparativeMatrixDetail() {
  const rows = [
    ["기술 A", "우위", "동등", "열위", "TRL · 수출 · 비용"],
    ["기술 B", "동등", "우위", "동등", "특허 · 공급망"],
    ["기술 C", "우위", "열위", "동등", "실증 · EPC 경험"],
  ];

  return (
    <MatrixTable
      rows={rows}
      headers={["기술", "한국", "경쟁국 A", "경쟁국 B", "판정근거"]}
    />
  );
}

function ResearchOverview({ element }: { element: VietnamDemoElement }) {
  return (
    <div className="v53-two-col">
      <section className="v53-panel v53-bars">
        {element.presentation.headlineFields.slice(0, 4).map((field, index) => (
          <div key={field}>
            <span>{field}</span>
            <i style={{ width: `${82 - index * 14}%` }} />
            <b>{82 - index * 14}</b>
          </div>
        ))}
      </section>
      <aside className="v53-panel">
        <h4>주요 기관·기술</h4>
        {["연구기관 A", "대학 B", "연구소 C"].map((name) => (
          <div className="v53-side-row" key={name}>
            <span>{name}</span>
            <b>기술분야 예시</b>
          </div>
        ))}
      </aside>
    </div>
  );
}

function TradeOverview({ element }: { element: VietnamDemoElement }) {
  return (
    <div className="v53-two-col">
      <section className="v53-panel">
        <LineChart values={sampleTrend(`${element.elementId}:trade`, 9)} />
      </section>
      <aside className="v53-panel">
        <h4>주요 품목·파트너</h4>
        {["품목 A", "품목 B", "품목 C"].map((name, index) => (
          <div className="v53-side-row" key={name}>
            <span>{name}</span>
            <b>{35 - index * 8}%</b>
          </div>
        ))}
      </aside>
    </div>
  );
}

function SupportPrograms() {
  return (
    <section className="v53-support">
      {["FS 지원", "실증 지원", "금융 지원"].map((name, index) => (
        <article key={name}>
          <b>{name}</b>
          <span>
            {["기업·연구기관", "중소·중견기업", "프로젝트 개발사"][index]}
          </span>
          <small>지원규모 · 신청시기 · 자격요건 · 공식 공고</small>
        </article>
      ))}
    </section>
  );
}

function GenericOverview({ element }: { element: VietnamDemoElement }) {
  return (
    <div className="v53-kpis">
      {element.presentation.headlineFields.slice(0, 4).map((field, index) => (
        <article key={field}>
          <span>{field}</span>
          <strong>{sampleFieldValue(field, element.elementId, index)}</strong>
          <small>예시값</small>
        </article>
      ))}
    </div>
  );
}

function SemanticDetail({
  element,
  mode,
}: {
  element: VietnamDemoElement;
  mode: FinalPreviewMode;
}) {
  if (mode === "relationship_crosswalk") return <RelationshipCrosswalkDetail />;
  if (mode === "sdg_scorecard") return <SdgScorecardDetail />;
  if (mode === "requirements_matrix") return <RequirementsMatrixDetail />;
  if (mode === "opportunity_table") return <OpportunityTableDetail />;
  if (mode === "comparative_matrix") return <ComparativeMatrixDetail />;

  return (
    <section className="v53-detail">
      <div className="v53-detail-head">
        <span>항목</span>
        <span>예시 표시</span>
        <span>기준·근거</span>
      </div>
      {element.presentation.headlineFields.slice(0, 8).map((field, index) => (
        <div className="v53-detail-row" key={field}>
          <b>{field}</b>
          <span>{sampleFieldValue(field, element.elementId, index)}</span>
          <small>
            {index % 2 === 0 ? "2025 · 공식 출처" : "최근 가용연도 · 원문 근거"}
          </small>
        </div>
      ))}
    </section>
  );
}

function SourcePanel({ element }: { element: VietnamDemoElement }) {
  return (
    <section className="v53-source-panel">
      <div>
        <span>출처</span>
        <b>{element.effectiveSource || element.sourceDatabase}</b>
      </div>
      <div>
        <span>수집 방법</span>
        <b>{element.collectionMethod || "공식자료 확인"}</b>
      </div>
      <div>
        <span>공간단위</span>
        <b>{element.spatialLevel || "국가"}</b>
      </div>
      <div>
        <span>해석 시 유의사항</span>
        <b>{element.presentation.caution}</b>
      </div>
    </section>
  );
}

function MatrixTable({
  headers,
  rows,
}: {
  headers: string[];
  rows: string[][];
}) {
  return (
    <section className="v53-matrix-table">
      <div
        className="v53-matrix-head"
        style={{
          gridTemplateColumns: `repeat(${headers.length}, minmax(0,1fr))`,
        }}
      >
        {headers.map((h) => (
          <b key={h}>{h}</b>
        ))}
      </div>
      {rows.map((row, index) => (
        <div
          className="v53-matrix-row"
          key={index}
          style={{
            gridTemplateColumns: `repeat(${headers.length}, minmax(0,1fr))`,
          }}
        >
          {row.map((cell, i) => (
            <span key={i}>{cell}</span>
          ))}
        </div>
      ))}
    </section>
  );
}

function LineChart({
  values,
  compact = false,
}: {
  values: number[];
  compact?: boolean;
}) {
  const width = 520;
  const height = compact ? 100 : 150;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = Math.max(max - min, 1);
  const path = values
    .map((value, index) => {
      const x = 12 + (index / Math.max(1, values.length - 1)) * (width - 24);
      const y = height - 12 - ((value - min) / range) * (height - 24);
      return `${index === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");

  return (
    <div className="v53-line">
      <svg viewBox={`0 0 ${width} ${height}`} aria-hidden="true">
        <path d={path} />
      </svg>
      <div>
        <span>2018</span>
        <span>2021</span>
        <span>2025</span>
      </div>
    </div>
  );
}

function MultiLine({ seed }: { seed: string }) {
  const a = sampleTrend(`${seed}:a`, 8);
  const b = a.map((v, i) => v + i * 1.7);
  const c = a.map((v, i) => v + i * 3.0);
  const all = [...a, ...b, ...c];
  const min = Math.min(...all);
  const max = Math.max(...all);
  const range = Math.max(max - min, 1);
  const make = (values: number[]) =>
    values
      .map((v, i) => {
        const x = 12 + (i / 7) * 496;
        const y = 153 - ((v - min) / range) * 130;
        return `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(" ");

  return (
    <svg className="v53-multiline" viewBox="0 0 520 165" aria-hidden="true">
      <path className="a" d={make(a)} />
      <path className="b" d={make(b)} />
      <path className="c" d={make(c)} />
    </svg>
  );
}
