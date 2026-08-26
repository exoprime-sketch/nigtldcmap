import { useEffect, useMemo, useState } from "react";
import type { ChangeEvent } from "react";
import {
  CLIMATE_TECHNOLOGIES,
  CLIMATE_TECHNOLOGY_BY_ID,
} from "../../data/climateTechnologyCatalog";
import type { ProjectType } from "../../data/climateTechnologyCatalog";
import { getTechnologyOpportunityRecord } from "../../data/opportunities/technologyOpportunityData";
import type {
  EvidenceStatus,
  OpportunityEvidenceItem,
} from "../../types/opportunity";

interface TechnologyOpportunityPanelProps {
  iso3: string;
  countryNameKo: string;
  compact?: boolean;
  initialTechnologyId?: string;
}

type OpportunityTab =
  | "summary"
  | "demand"
  | "organizations"
  | "permits"
  | "finance"
  | "evidence";

const STATUS_LABELS: Record<EvidenceStatus, string> = {
  confirmed: "근거 확인",
  related: "관련 근거",
  "needs-check": "추가 확인 필요",
};

const TAB_LABELS: Record<OpportunityTab, string> = {
  summary: "사업기회 요약",
  demand: "수요·문제",
  organizations: "기관·파트너",
  permits: "사업환경·인허가",
  finance: "재원·기존사업",
  evidence: "근거·다음 단계",
};

function EvidenceCard({ item }: { item: OpportunityEvidenceItem }) {
  return (
    <article className={`opportunity-v28-evidence status-${item.status}`}>
      <header>
        <span>{item.area}</span>
        <b>{STATUS_LABELS[item.status]}</b>
      </header>
      <strong>{item.title}</strong>
      <p>{item.summary}</p>
      <small>{item.sourceLabel}</small>
      {item.sourceUrl && (
        <a href={item.sourceUrl} target="_blank" rel="noreferrer">
          원 데이터 확인 ↗
        </a>
      )}
    </article>
  );
}

export default function TechnologyOpportunityPanel({
  iso3,
  countryNameKo,
  compact = false,
  initialTechnologyId = "solar-pv",
}: TechnologyOpportunityPanelProps) {
  const [technologyId, setTechnologyId] = useState(initialTechnologyId);
  const [projectType, setProjectType] = useState<ProjectType>("타당성조사");
  const [tab, setTab] = useState<OpportunityTab>("summary");

  const technology =
    CLIMATE_TECHNOLOGY_BY_ID.get(technologyId) ?? CLIMATE_TECHNOLOGIES[0];
  const record = useMemo(
    () => getTechnologyOpportunityRecord(iso3, technologyId),
    [iso3, technologyId]
  );

  useEffect(() => {
    const nextProjectType =
      record?.recommendedProjectTypes[0] ??
      technology.defaultProjectTypes[0] ??
      "타당성조사";
    setProjectType(nextProjectType);
    setTab("summary");
  }, [record, technology]);

  const statusCounts = useMemo(() => {
    const counts: Record<EvidenceStatus, number> = {
      confirmed: 0,
      related: 0,
      "needs-check": 0,
    };
    record?.evidence.forEach((item) => {
      counts[item.status] += 1;
    });
    return counts;
  }, [record]);

  if (compact) {
    return (
      <section className="opportunity-v28-compact">
        <span>기술별 사업기회</span>
        <strong>{technology.nameKo}</strong>
        {record ? (
          <>
            <b>{record.recommendedStage}</b>
            <p>{record.summary}</p>
            <small>
              핵심 근거 {statusCounts.confirmed + statusCounts.related}개 · 추가
              확인 {statusCounts["needs-check"]}개
            </small>
          </>
        ) : (
          <>
            <b>자료 연결 전</b>
            <p>
              {countryNameKo}의 {technology.nameKo} 관련
              수요기관·정책·재원·인허가 자료 연결 필요
            </p>
          </>
        )}
      </section>
    );
  }

  return (
    <section
      className="opportunity-v28-panel"
      aria-labelledby="opportunity-v28-title"
    >
      <header className="opportunity-v28-heading">
        <div>
          <span>사업기획 지원</span>
          <h2 id="opportunity-v28-title">기술별 협력사업 검토</h2>
          <p>
            국가 전체 평균이 아니라 선택한 기후기술과 사업형태를 기준으로
            수요·기관·인허가·재원·다음 행동 확인
          </p>
        </div>
        <small>
          {countryNameKo} · ISO {iso3}
        </small>
      </header>

      <div className="opportunity-v28-selectors">
        <label>
          <span>기후기술 분야</span>
          <select
            value={technologyId}
            onChange={(event: ChangeEvent<HTMLSelectElement>) =>
              setTechnologyId(event.target.value)
            }
          >
            {CLIMATE_TECHNOLOGIES.map((item) => (
              <option key={item.id} value={item.id}>
                {item.nameKo} · {item.category}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span>검토 사업형태</span>
          <select
            value={projectType}
            onChange={(event: ChangeEvent<HTMLSelectElement>) =>
              setProjectType(event.target.value as ProjectType)
            }
          >
            {technology.defaultProjectTypes.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </label>
        <div className="opportunity-v28-selection-note">
          <span>적용 부문</span>
          <b>{technology.relatedSectors.join(" · ")}</b>
        </div>
      </div>

      {record ? (
        <>
          <div className="opportunity-v28-brief">
            <div>
              <span>추천 추진단계</span>
              <strong>{record.recommendedStage}</strong>
              <p>{record.summary}</p>
            </div>
            <dl>
              <div>
                <dt>근거 확인</dt>
                <dd>{statusCounts.confirmed}개</dd>
              </div>
              <div>
                <dt>관련 근거</dt>
                <dd>{statusCounts.related}개</dd>
              </div>
              <div>
                <dt>추가 확인</dt>
                <dd>{statusCounts["needs-check"]}개</dd>
              </div>
            </dl>
          </div>

          <div
            className="opportunity-v28-tabs"
            role="tablist"
            aria-label="기술별 협력사업 검토 항목"
          >
            {(Object.keys(TAB_LABELS) as OpportunityTab[]).map((item) => (
              <button
                key={item}
                type="button"
                className={tab === item ? "active" : ""}
                onClick={() => setTab(item)}
              >
                {TAB_LABELS[item]}
              </button>
            ))}
          </div>

          {tab === "summary" && (
            <div className="opportunity-v28-content">
              <section className="opportunity-v28-summary-grid">
                <article>
                  <span>해결할 문제</span>
                  <p>{record.problemStatement}</p>
                </article>
                <article>
                  <span>적용 대상</span>
                  <p>{record.targetSectors.join(" · ")}</p>
                </article>
                <article>
                  <span>지역 범위</span>
                  <p>{record.targetRegions.join(" · ")}</p>
                </article>
                <article>
                  <span>현재 검토 사업형태</span>
                  <p>{projectType}</p>
                </article>
              </section>
              <div className="opportunity-v28-evidence-grid">
                {record.evidence.map((item) => (
                  <EvidenceCard key={item.id} item={item} />
                ))}
              </div>
            </div>
          )}

          {tab === "demand" && (
            <div className="opportunity-v28-content">
              <section className="opportunity-v28-focus-card">
                <span>현지 문제 정의</span>
                <h3>{record.title}</h3>
                <p>{record.problemStatement}</p>
              </section>
              <div className="opportunity-v28-evidence-grid">
                {record.evidence
                  .filter(
                    (item) =>
                      item.area === "수요" ||
                      item.area === "정책" ||
                      item.area === "기술조건"
                  )
                  .map((item) => (
                    <EvidenceCard key={item.id} item={item} />
                  ))}
              </div>
            </div>
          )}

          {tab === "organizations" && (
            <div className="opportunity-v28-list">
              {record.organizations.map((item) => (
                <article key={item.id}>
                  <header>
                    <span>{item.organizationType}</span>
                    <b>{STATUS_LABELS[item.status]}</b>
                  </header>
                  <strong>{item.name}</strong>
                  <dl>
                    <div>
                      <dt>예상 역할</dt>
                      <dd>{item.role}</dd>
                    </div>
                    <div>
                      <dt>확인 근거</dt>
                      <dd>{item.basis}</dd>
                    </div>
                  </dl>
                </article>
              ))}
            </div>
          )}

          {tab === "permits" && (
            <div className="opportunity-v28-list permits">
              {record.permits.map((item) => (
                <article key={item.id}>
                  <header>
                    <span>{item.permitName}</span>
                    <b>{STATUS_LABELS[item.status]}</b>
                  </header>
                  <dl>
                    <div>
                      <dt>담당기관</dt>
                      <dd>{item.authority}</dd>
                    </div>
                    <div>
                      <dt>적용 조건</dt>
                      <dd>{item.applicability}</dd>
                    </div>
                    <div>
                      <dt>예상기간</dt>
                      <dd>{item.expectedDuration}</dd>
                    </div>
                  </dl>
                </article>
              ))}
              <p className="opportunity-v28-caution">
                인허가 기간은 국가 전체 단일값으로 제시하지 않으며
                기술·사업형태·지역·규모별 절차를 확인한 뒤 범위로 표시
              </p>
            </div>
          )}

          {tab === "finance" && (
            <div className="opportunity-v28-list finance">
              {record.finance.map((item) => (
                <article key={item.id}>
                  <header>
                    <span>{item.sourceType}</span>
                    <b>{STATUS_LABELS[item.status]}</b>
                  </header>
                  <strong>{item.name}</strong>
                  <p>{item.relevance}</p>
                </article>
              ))}
            </div>
          )}

          {tab === "evidence" && (
            <div className="opportunity-v28-next-grid">
              <section>
                <h3>추가 확인이 필요한 정보</h3>
                <ol>
                  {record.missingInformation.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ol>
              </section>
              <section>
                <h3>사업기획 다음 행동</h3>
                <ol>
                  {record.nextActions.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ol>
              </section>
            </div>
          )}
        </>
      ) : (
        <div className="opportunity-v28-empty">
          <span>자료 연결 전</span>
          <h3>
            {countryNameKo} · {technology.nameKo}
          </h3>
          <p>
            화면 구조는 확정되어 있으며 데이터 수집 결과가 들어오면 아래 항목을
            연결
          </p>
          <div>
            <article>
              <b>수요·문제</b>
              <small>기관·시설·지역·직접 수요 근거</small>
            </article>
            <article>
              <b>정책 근거</b>
              <small>NDC·TNA·국가계획·법제도</small>
            </article>
            <article>
              <b>기관·파트너</b>
              <small>기관명·역할·사업경험·연락경로</small>
            </article>
            <article>
              <b>사업환경</b>
              <small>허가명·담당기관·적용조건·기간 범위</small>
            </article>
            <article>
              <b>재원·기존사업</b>
              <small>사업명·금액·상태·후속연계 가능성</small>
            </article>
            <article>
              <b>다음 행동</b>
              <small>현지확인·타당성조사·실증·본사업 단계</small>
            </article>
          </div>
        </div>
      )}
    </section>
  );
}
