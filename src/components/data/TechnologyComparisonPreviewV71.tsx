import { useMemo } from "react";
import {
  getTechnologyFilterGroups,
  getTechnologyName,
} from "../../utils/technologyData";
import {
  COMPETITOR_OPTIONS,
  getCompetitorLabelV71,
  getPositionReasonV71,
  getRelativePositionV71,
  TECHNOLOGY_COMPARISON_AXES,
} from "../../utils/technologyComparisonV71";
import type {
  CompetitorId,
  RelativePosition,
} from "../../utils/technologyComparisonV71";
import "../../styles/technology-comparison-v71.css";

interface ControlsProps {
  technologyId: string;
  competitorId: CompetitorId;
  year: number;
  onTechnologyChange: (value: string) => void;
  onCompetitorChange: (value: CompetitorId) => void;
  onYearChange: (value: number) => void;
}

export function TechnologyComparisonControlsV71({
  technologyId,
  competitorId,
  year,
  onTechnologyChange,
  onCompetitorChange,
  onYearChange,
}: ControlsProps) {
  const groups = useMemo(() => getTechnologyFilterGroups(), []);

  return (
    <section className="v71-comparison-controls">
      <label>
        <span>기후기술</span>
        <select
          value={technologyId}
          onChange={(event) => onTechnologyChange(event.target.value)}
        >
          <option value="all">전체 기후기술</option>
          {groups.map((group) => (
            <optgroup key={group.category} label={group.category}>
              {group.technologies.map((technology) => (
                <option key={technology.id} value={technology.id}>
                  {technology.nameKo}
                </option>
              ))}
            </optgroup>
          ))}
        </select>
      </label>

      <label>
        <span>비교 대상</span>
        <select
          value={competitorId}
          onChange={(event) =>
            onCompetitorChange(event.target.value as CompetitorId)
          }
        >
          {COMPETITOR_OPTIONS.map((item) => (
            <option key={item.value} value={item.value}>
              {item.label}
            </option>
          ))}
        </select>
      </label>

      <label>
        <span>기준연도</span>
        <select
          value={year}
          onChange={(event) => onYearChange(Number(event.target.value))}
        >
          {[2025, 2024, 2023, 2022].map((item) => (
            <option key={item} value={item}>
              {item}년
            </option>
          ))}
        </select>
      </label>
    </section>
  );
}

interface ViewProps {
  technologyId: string;
  competitorId: CompetitorId;
  year: number;
}

export function TechnologyComparisonOverviewV71({
  technologyId,
  competitorId,
  year,
}: ViewProps) {
  const groups = useMemo(() => getTechnologyFilterGroups(), []);
  const technologies = groups.flatMap((group) => group.technologies);

  if (technologyId === "all") {
    const previewTechnologies = technologies.slice(0, 8);

    return (
      <section className="v71-comparison-view">
        <div className="v71-context-strip">
          <div>
            <span>기술 범위</span>
            <b>기후기술 분야</b>
          </div>
          <div>
            <span>비교 대상</span>
            <b>{getCompetitorLabelV71(competitorId)}</b>
          </div>
          <div>
            <span>판정축</span>
            <b>6개 축</b>
          </div>
          <div>
            <span>기준연도</span>
            <b>{year}년</b>
          </div>
        </div>

        <section className="v71-technology-summary">
          <header>
            <h4>기술별 비교 개요</h4>
            <p>기술별 데이터를 동일 기준으로 비교할 수 있도록 제공 예정</p>
          </header>

          <div className="v71-tech-table">
            <div className="v71-tech-head">
              <span>기후기술</span>
              <span>상대평가</span>
              <span>주요 강점/보완축</span>
            </div>

            {previewTechnologies.map((technology, index) => {
              const positions = TECHNOLOGY_COMPARISON_AXES.map((axis) => ({
                axis,
                position: getRelativePositionV71({
                  technologyId: technology.id,
                  competitorId,
                  axisKey: axis.key,
                  year,
                }),
              }));

              const advantage =
                positions.find((item) => item.position === "우위") ??
                positions[0];

              const weakness = positions.find(
                (item) => item.position === "열위"
              );

              const score =
                positions.filter((item) => item.position === "우위").length -
                positions.filter((item) => item.position === "열위").length;

              const overall: RelativePosition =
                score >= 2 ? "우위" : score <= -2 ? "열위" : "동등";

              return (
                <div className="v71-tech-row" key={technology.id}>
                  <b>{technology.nameKo}</b>
                  <PositionBadge position={overall} />
                  <span>
                    {advantage?.axis.label}
                    {weakness
                      ? ` · 보완: ${weakness.axis.label}`
                      : " · 뚜렷한 열위축 없음"}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="v71-summary-note">
            특정 기술을 선택하면 6개 비교축의 판정과 근거를 상세 확인
          </div>
        </section>
      </section>
    );
  }

  const technologyName = getTechnologyName(technologyId);

  const rows = TECHNOLOGY_COMPARISON_AXES.map((axis) => {
    const position = getRelativePositionV71({
      technologyId,
      competitorId,
      axisKey: axis.key,
      year,
    });

    return {
      axis,
      position,
      reason: getPositionReasonV71(axis.key, position),
    };
  });

  const counts = {
    advantage: rows.filter((row) => row.position === "우위").length,
    parity: rows.filter((row) => row.position === "동등").length,
    disadvantage: rows.filter((row) => row.position === "열위").length,
  };

  return (
    <section className="v71-comparison-view">
      <div className="v71-comparison-kpis">
        <article className="selected">
          <span>선택 기술</span>
          <strong>{technologyName}</strong>
          <small>{year}년 · 화면 예시</small>
        </article>
        <article>
          <span>한국 우위</span>
          <strong>{counts.advantage}/6</strong>
          <small>비교축 기준</small>
        </article>
        <article>
          <span>동등</span>
          <strong>{counts.parity}/6</strong>
          <small>비교축 기준</small>
        </article>
        <article>
          <span>한국 열위</span>
          <strong>{counts.disadvantage}/6</strong>
          <small>비교축 기준</small>
        </article>
      </div>

      <section className="v71-axis-matrix">
        <header>
          <div>
            <h4>{technologyName} 경쟁력 비교</h4>
            <p>한국 vs {getCompetitorLabelV71(competitorId)}</p>
          </div>
          <small>종합점수 없이 축별 상대평가와 근거를 분리</small>
        </header>

        <div className="v71-axis-head">
          <span>비교축</span>
          <span>상대평가</span>
          <span>확인할 근거</span>
          <span>판정 요약</span>
        </div>

        {rows.map((row) => (
          <div className="v71-axis-row" key={row.axis.key}>
            <b>{row.axis.label}</b>
            <PositionBadge position={row.position} />
            <span>{row.axis.evidenceType}</span>
            <small>{row.reason}</small>
          </div>
        ))}
      </section>

      <div className="v71-summary-note">
        현재 상대평가는 예시입니다. 실제 데이터 제공 시 동일한 정의와 기준연도의
        정량·사업·기업·특허 자료를 함께 제공합니다
      </div>
    </section>
  );
}

export function TechnologyComparisonDetailV71({
  technologyId,
  competitorId,
  year,
}: ViewProps) {
  const groups = useMemo(() => getTechnologyFilterGroups(), []);
  const technologies = groups.flatMap((group) => group.technologies);

  if (technologyId === "all") {
    return (
      <section className="v71-detail">
        <header>
          <div>
            <span>기후기술 분야</span>
            <h4>기술별 비교 근거</h4>
          </div>
          <small>실제 자료 연결 시 기술별로 근거행 제공</small>
        </header>

        <div className="v71-detail-table">
          <div className="v71-detail-head all-tech">
            <span>기후기술</span>
            <span>주요 우위축</span>
            <span>주요 보완축</span>
            <span>비교 대상</span>
            <span>기준</span>
          </div>

          {technologies.slice(0, 12).map((technology) => {
            const positions = TECHNOLOGY_COMPARISON_AXES.map((axis) => ({
              axis,
              position: getRelativePositionV71({
                technologyId: technology.id,
                competitorId,
                axisKey: axis.key,
                year,
              }),
            }));

            const advantage = positions.find(
              (item) => item.position === "우위"
            );
            const weakness = positions.find((item) => item.position === "열위");

            return (
              <div className="v71-detail-row all-tech" key={technology.id}>
                <b>{technology.nameKo}</b>
                <span>{advantage?.axis.label ?? "추가 확인"}</span>
                <span>{weakness?.axis.label ?? "뚜렷한 열위 없음"}</span>
                <span>{getCompetitorLabelV71(competitorId)}</span>
                <small>{year}년</small>
              </div>
            );
          })}
        </div>
      </section>
    );
  }

  const technologyName = getTechnologyName(technologyId);

  return (
    <section className="v71-detail">
      <header>
        <div>
          <span>{technologyName}</span>
          <h4>비교 근거 상세</h4>
        </div>
        <small>한국과 비교국 자료를 동일 기준으로 비교</small>
      </header>

      <div className="v71-detail-table">
        <div className="v71-detail-head">
          <span>비교축</span>
          <span>한국 근거</span>
          <span>경쟁국 근거</span>
          <span>판정</span>
          <span>추가 확인</span>
        </div>

        {TECHNOLOGY_COMPARISON_AXES.map((axis) => {
          const position = getRelativePositionV71({
            technologyId,
            competitorId,
            axisKey: axis.key,
            year,
          });

          return (
            <div className="v71-detail-row" key={axis.key}>
              <b>{axis.label}</b>
              <span>{axis.evidenceType} · 한국 근거 예정</span>
              <span>
                {axis.evidenceType} · {getCompetitorLabelV71(competitorId)} 근거
                예정
              </span>
              <PositionBadge position={position} />
              <small>출처·기준시점·정의 정합성 확인</small>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function PositionBadge({ position }: { position: RelativePosition }) {
  return (
    <span className={`v71-position position-${position}`}>{position}</span>
  );
}
