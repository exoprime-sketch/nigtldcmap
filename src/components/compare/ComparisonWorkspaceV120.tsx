import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import {
  COMPARISON_QUESTIONS_V120,
  resolveComparisonTemplateV120,
} from "../../data/compare/comparisonRegistryV120";
import {
  comparisonContextToDownloadHashV120,
  comparisonContextToMapHashV120,
} from "../../data/compare/comparisonRelationsV120";
import ComparisonTemplatePanelV120 from "./ComparisonTemplatePanelsV120";

const DEFAULT_COUNTRIES = [
  ["VNM", "베트남"],
  ["IDN", "인도네시아"],
  ["BGD", "방글라데시"],
  ["KHM", "캄보디아"],
  ["LAO", "라오스"],
  ["LKA", "스리랑카"],
  ["PHL", "필리핀"],
  ["MYS", "말레이시아"],
  ["IND", "인도"],
  ["EGY", "이집트"],
] as const;

export type ComparisonWorkspaceV120Props = {
  elementId?: string;
  elementLabel?: string;
  datasetId?: string;
  selectedCountry?: string;
  actualDataAvailable?: boolean;
  legacyContent?: ReactNode;
};

export default function ComparisonWorkspaceV120({
  elementId,
  elementLabel,
  datasetId,
  selectedCountry,
  actualDataAvailable = true,
  legacyContent,
}: ComparisonWorkspaceV120Props) {
  const template = resolveComparisonTemplateV120(elementId, elementLabel);
  const initialQuestion =
    COMPARISON_QUESTIONS_V120.find((q) => q.template === template)?.id ??
    COMPARISON_QUESTIONS_V120[0].id;
  const [questionId, setQuestionId] = useState(initialQuestion);
  const [yearMode, setYearMode] = useState<"same-year" | "latest-available">(
    "latest-available"
  );
  const [countries, setCountries] = useState<string[]>(
    selectedCountry ? [selectedCountry] : []
  );
  const [view, setView] = useState<
    "summary" | "chart" | "trend" | "table" | "evidence"
  >("summary");
  const question =
    COMPARISON_QUESTIONS_V120.find((q) => q.id === questionId) ??
    COMPARISON_QUESTIONS_V120[0];

  const context = useMemo(
    () => ({
      countries,
      elementIds: elementId ? [elementId] : [],
      datasetIds: datasetId ? [datasetId] : [],
      yearMode,
    }),
    [countries, datasetId, elementId, yearMode]
  );

  const toggleCountry = (iso3: string) => {
    setCountries((current) => {
      if (current.includes(iso3))
        return current.filter((code) => code !== iso3);
      if (current.length >= 4) return current;
      return [...current, iso3];
    });
  };

  if (!actualDataAvailable) {
    return (
      <section className="comparison-workspace-v120 is-pending">
        <h3>비교 데이터 준비 중</h3>
        <p>
          실제 자료가 연결되면 동일연도·최신값, 추세와 근거를 조건별로 비교할 수
          있습니다.
        </p>
      </section>
    );
  }

  return (
    <section className="comparison-workspace-v120">
      <header>
        <div>
          <span>국가 비교</span>
          <h3>{elementLabel || question.label}</h3>
          <p>{question.description}</p>
        </div>
        <div className="comparison-workspace-v120__actions">
          <button
            type="button"
            onClick={() => {
              window.location.hash = comparisonContextToMapHashV120(
                context
              ).replace(/^#/, "");
            }}
          >
            지도에서 보기
          </button>
          <button
            type="button"
            onClick={() => {
              window.location.hash = comparisonContextToDownloadHashV120(
                context
              ).replace(/^#/, "");
            }}
          >
            다운로드 설정
          </button>
        </div>
      </header>

      <div className="comparison-workspace-v120__controls">
        <label>
          비교 질문
          <select
            value={questionId}
            onChange={(event) => setQuestionId(event.target.value)}
          >
            {COMPARISON_QUESTIONS_V120.map((item) => (
              <option key={item.id} value={item.id}>
                {item.label}
              </option>
            ))}
          </select>
        </label>
        <fieldset>
          <legend>비교 기준</legend>
          <button
            type="button"
            className={yearMode === "same-year" ? "is-active" : ""}
            onClick={() => setYearMode("same-year")}
          >
            동일 기준연도
          </button>
          <button
            type="button"
            className={yearMode === "latest-available" ? "is-active" : ""}
            onClick={() => setYearMode("latest-available")}
          >
            국가별 최신 가용값
          </button>
        </fieldset>
      </div>

      <div
        className="comparison-workspace-v120__countries"
        aria-label="비교 국가 선택"
      >
        {DEFAULT_COUNTRIES.map(([iso3, name]) => (
          <button
            key={iso3}
            type="button"
            aria-pressed={countries.includes(iso3)}
            className={countries.includes(iso3) ? "is-active" : ""}
            onClick={() => toggleCountry(iso3)}
          >
            {name}
          </button>
        ))}
        <small>최대 4개 국가</small>
      </div>

      <nav
        className="comparison-workspace-v120__views"
        aria-label="비교 분석 보기"
      >
        {(["summary", "chart", "trend", "table", "evidence"] as const).map(
          (item) => (
            <button
              key={item}
              type="button"
              className={view === item ? "is-active" : ""}
              onClick={() => setView(item)}
            >
              {
                {
                  summary: "요약",
                  chart: "차트",
                  trend: "추세",
                  table: "표",
                  evidence: "근거",
                }[item]
              }
            </button>
          )
        )}
      </nav>

      <ComparisonTemplatePanelV120 template={question.template} />
      <div className="comparison-workspace-v120__legacy" data-view={view}>
        {legacyContent}
      </div>
    </section>
  );
}
