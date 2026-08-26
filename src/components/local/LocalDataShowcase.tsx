import { useMemo, useState } from "react";
import {
  LOCAL_EXAMPLE_DATASET,
  getLocalExampleRecord,
} from "../../data/local/localDataExamples";
import { isPriorityCountry } from "../../data/priorityCountries";
import type { LocalExampleLevel } from "../../types/local";
import "../../styles/data-types-v27.css";

type ShowcaseTab = "summary" | "trend" | "projects" | "documents";

interface LocalDataShowcaseProps {
  iso3: string | null | undefined;
  mode?: "profile" | "compact";
}

function levelClass(level: LocalExampleLevel): string {
  if (level === "높음") return "high";
  if (level === "중간") return "medium";
  return "low";
}

export default function LocalDataShowcase({
  iso3,
  mode = "profile",
}: LocalDataShowcaseProps) {
  const [tab, setTab] = useState<ShowcaseTab>("summary");
  const record = useMemo(() => getLocalExampleRecord(iso3), [iso3]);

  if (!isPriorityCountry(iso3)) {
    if (mode === "compact") return null;
    return (
      <section className="local-v27-panel local-v27-empty">
        <div>
          <span>현지정보</span>
          <h2>추가 제공 예정</h2>
          <p>우선 구축국 10개국부터 현지자료 입력 구조 적용</p>
        </div>
      </section>
    );
  }

  if (!record) return null;

  if (mode === "compact") {
    return (
      <section className="local-v27-compact">
        <header>
          <div>
            <span>현지정보 입력 예시</span>
            <strong>{record.countryNameKo}</strong>
          </div>
          <b>예시 데이터</b>
        </header>
        <dl>
          <div>
            <dt>예상 인허가 기간</dt>
            <dd>{record.permitMonths}개월</dd>
          </div>
          <div>
            <dt>현지 협력의향</dt>
            <dd>{record.cooperationWillingness}</dd>
          </div>
          <div>
            <dt>공급망 준비도</dt>
            <dd>{record.supplyChainReadiness}</dd>
          </div>
        </dl>
        <p>{record.mainDemand}</p>
        <small>{LOCAL_EXAMPLE_DATASET.metadata.notice}</small>
      </section>
    );
  }

  const maxSignal = Math.max(
    1,
    ...record.annualSignals.map((item) => item.candidateDemandOrganizations)
  );

  return (
    <section className="local-v27-panel" aria-labelledby="local-v27-title">
      <header className="local-v27-heading">
        <div>
          <span>현지정보</span>
          <h2 id="local-v27-title">현지 수요·사업여건 입력 구조</h2>
          <p>숫자·시계열·범주·문자·사업·공간·문서 표출 사례</p>
        </div>
        <div className="local-v27-example-badge">
          <b>예시 데이터</b>
          <small>실제 조사결과 아님</small>
        </div>
      </header>

      <div className="local-v27-notice" role="note">
        {LOCAL_EXAMPLE_DATASET.metadata.notice}
      </div>

      <div className="local-v27-tabs" role="tablist" aria-label="현지정보 유형">
        {[
          ["summary", "숫자·범주·문자"],
          ["trend", "시계열"],
          ["projects", "사업·공간"],
          ["documents", "문서·접근수준"],
        ].map(([id, label]) => (
          <button
            key={id}
            type="button"
            className={tab === id ? "active" : ""}
            onClick={() => setTab(id as ShowcaseTab)}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "summary" && (
        <div className="local-v27-summary">
          <div className="local-v27-number-grid">
            <article>
              <span>예상 인허가 소요기간</span>
              <strong>{record.permitMonths}개월</strong>
              <small>숫자형 예시</small>
            </article>
            <article>
              <span>현지 파트너 후보</span>
              <strong>{record.partnerCandidateCount}개</strong>
              <small>숫자형 예시</small>
            </article>
            <article>
              <span>수요기관 후보</span>
              <strong>{record.candidateDemandOrganizationCount}개</strong>
              <small>숫자형 예시</small>
            </article>
          </div>

          <div className="local-v27-category-grid">
            <article>
              <span>현지 협력의향</span>
              <b
                className={`local-level ${levelClass(
                  record.cooperationWillingness
                )}`}
              >
                {record.cooperationWillingness}
              </b>
            </article>
            <article>
              <span>공급망 준비도</span>
              <b
                className={`local-level ${levelClass(
                  record.supplyChainReadiness
                )}`}
              >
                {record.supplyChainReadiness}
              </b>
            </article>
            <article>
              <span>근거 확인상태</span>
              <b className="local-level review">{record.verificationStatus}</b>
            </article>
          </div>

          <div className="local-v27-text-grid">
            <article>
              <span>주요 수요</span>
              <p>{record.mainDemand}</p>
            </article>
            <article>
              <span>주요 장벽</span>
              <p>{record.mainBarrier}</p>
            </article>
            <article>
              <span>추가 확인사항</span>
              <p>{record.followUp}</p>
            </article>
          </div>
        </div>
      )}

      {tab === "trend" && (
        <div className="local-v27-trend">
          <div
            className="local-v27-trend-chart"
            aria-label="연도별 현지 수요 신호 예시"
          >
            {record.annualSignals.map((item) => (
              <div key={item.year} className="local-v27-trend-row">
                <span>{item.year}</span>
                <div className="local-v27-trend-track">
                  <i
                    style={{
                      width: `${Math.max(
                        10,
                        (item.candidateDemandOrganizations / maxSignal) * 100
                      )}%`,
                    }}
                  />
                </div>
                <strong>{item.candidateDemandOrganizations}개 기관</strong>
              </div>
            ))}
          </div>
          <table className="local-v27-table">
            <thead>
              <tr>
                <th>연도</th>
                <th>수요기관 후보</th>
                <th>파트너 후보</th>
                <th>자료 상태</th>
              </tr>
            </thead>
            <tbody>
              {record.annualSignals.map((item) => (
                <tr key={item.year}>
                  <td>{item.year}</td>
                  <td>{item.candidateDemandOrganizations}개</td>
                  <td>{item.partnerCandidates}개</td>
                  <td>예시 데이터</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === "projects" && (
        <div className="local-v27-project-grid">
          <section>
            <h3>사업 파이프라인 예시</h3>
            <div className="local-v27-project-list">
              {record.exampleProjects.map((project) => (
                <article key={project.id}>
                  <span>{project.stage}</span>
                  <strong>{project.title}</strong>
                  <p>{project.sector}</p>
                  <small>{project.budgetBand}</small>
                </article>
              ))}
            </div>
          </section>
          <section>
            <h3>공간자료 입력 예시</h3>
            <div className="local-v27-site-list">
              {record.exampleSites.map((site) => (
                <article key={site.id}>
                  <div>
                    <strong>{site.name}</strong>
                    <span>{site.siteType}</span>
                  </div>
                  <code>
                    {site.latitude.toFixed(4)}, {site.longitude.toFixed(4)}
                  </code>
                  <small>{site.status}</small>
                </article>
              ))}
            </div>
          </section>
        </div>
      )}

      {tab === "documents" && (
        <div className="local-v27-document-list">
          {record.exampleDocuments.map((document) => (
            <article key={document.id}>
              <div>
                <span>{document.documentType}</span>
                <strong>{document.title}</strong>
                <p>{document.summary}</p>
              </div>
              <dl>
                <div>
                  <dt>공개수준</dt>
                  <dd>{document.accessLevel}</dd>
                </div>
                <div>
                  <dt>자료 상태</dt>
                  <dd>{document.reviewStatus}</dd>
                </div>
              </dl>
            </article>
          ))}
          <div className="local-v27-document-rule">
            <strong>운영 적용 원칙</strong>
            <p>
              원문과 추출정보 분리 · 접근권한 적용 · 검토자·검토일 기록 · 공개
              화면에는 승인된 요약만 표시
            </p>
          </div>
        </div>
      )}
    </section>
  );
}
