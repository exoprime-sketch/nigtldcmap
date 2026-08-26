import { useMemo, useState } from "react";
import { LOCAL_EXAMPLE_DATASET } from "../../data/local/localDataExamples";
import type { DatasetPreviewKind } from "../../types/dataset";
import "../../styles/data-types-v27.css";

function localLevelClass(level: string): string {
  if (level === "높음") return "high";
  if (level === "중간") return "medium";
  if (level === "낮음") return "low";
  return "review";
}

interface LocalDataTypePreviewProps {
  kind: DatasetPreviewKind;
}

export default function LocalDataTypePreview({
  kind,
}: LocalDataTypePreviewProps) {
  const [iso3, setIso3] = useState("VNM");
  const record = useMemo(
    () =>
      LOCAL_EXAMPLE_DATASET.data.find((item) => item.iso3 === iso3) ??
      LOCAL_EXAMPLE_DATASET.data[0],
    [iso3]
  );

  return (
    <div className="local-preview-v27">
      <header className="local-preview-v27-heading">
        <div>
          <span>데이터 유형별 표출 사례</span>
          <h2>{getPreviewTitle(kind)}</h2>
          <p>{LOCAL_EXAMPLE_DATASET.metadata.notice}</p>
        </div>
        <label>
          <span>우선 구축국</span>
          <select
            value={record.iso3}
            onChange={(event) => setIso3(event.target.value)}
          >
            {LOCAL_EXAMPLE_DATASET.data.map((item) => (
              <option key={item.iso3} value={item.iso3}>
                {item.countryNameKo}
              </option>
            ))}
          </select>
        </label>
      </header>

      <div className="local-preview-v27-warning">
        <b>예시 데이터</b>
        <span>실제 국가 현황·현지조사 결과·사업정보로 사용할 수 없음</span>
      </div>

      {kind === "local-data" && <LocalDataPreview record={record} />}
      {kind === "local-geospatial" && (
        <LocalGeospatialPreview record={record} />
      )}
      {kind === "local-projects" && <LocalProjectPreview record={record} />}
      {kind === "local-documents" && <LocalDocumentPreview record={record} />}
    </div>
  );
}

function LocalDataPreview({
  record,
}: {
  record: (typeof LOCAL_EXAMPLE_DATASET.data)[number];
}) {
  const max = Math.max(
    ...record.annualSignals.map((item) => item.candidateDemandOrganizations),
    1
  );
  return (
    <div className="local-preview-v27-stack">
      <section className="local-v27-number-grid">
        <article>
          <span>인허가 기간</span>
          <strong>{record.permitMonths}개월</strong>
          <small>numeric</small>
        </article>
        <article>
          <span>파트너 후보</span>
          <strong>{record.partnerCandidateCount}개</strong>
          <small>numeric</small>
        </article>
        <article>
          <span>수요기관 후보</span>
          <strong>{record.candidateDemandOrganizationCount}개</strong>
          <small>numeric</small>
        </article>
      </section>
      <section className="local-v27-category-grid">
        <article>
          <span>협력의향</span>
          <b
            className={`local-level ${localLevelClass(
              record.cooperationWillingness
            )}`}
          >
            {record.cooperationWillingness}
          </b>
        </article>
        <article>
          <span>공급망 준비도</span>
          <b
            className={`local-level ${localLevelClass(
              record.supplyChainReadiness
            )}`}
          >
            {record.supplyChainReadiness}
          </b>
        </article>
        <article>
          <span>확인상태</span>
          <b className="local-level review">{record.verificationStatus}</b>
        </article>
      </section>
      <section className="local-v27-text-grid">
        <article>
          <span>주요 수요</span>
          <p>{record.mainDemand}</p>
        </article>
        <article>
          <span>주요 장벽</span>
          <p>{record.mainBarrier}</p>
        </article>
      </section>
      <section>
        <h3>시계열 예시</h3>
        <div className="local-v27-trend-chart">
          {record.annualSignals.map((item) => (
            <div key={item.year} className="local-v27-trend-row">
              <span>{item.year}</span>
              <div className="local-v27-trend-track">
                <i
                  style={{
                    width: `${
                      (item.candidateDemandOrganizations / max) * 100
                    }%`,
                  }}
                />
              </div>
              <strong>{item.candidateDemandOrganizations}개</strong>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function LocalGeospatialPreview({
  record,
}: {
  record: (typeof LOCAL_EXAMPLE_DATASET.data)[number];
}) {
  return (
    <div className="local-preview-v27-stack">
      <section className="local-v27-map-placeholder">
        <div className="local-v27-map-grid" aria-hidden="true" />
        {record.exampleSites.map((site, index) => (
          <span key={site.id} className={`local-v27-map-pin pin-${index + 1}`}>
            {index + 1}
          </span>
        ))}
        <div className="local-v27-map-caption">
          점·선·면·래스터 자료 연결 위치
        </div>
      </section>
      <div className="local-v27-site-list">
        {record.exampleSites.map((site, index) => (
          <article key={site.id}>
            <div>
              <strong>
                {index + 1}. {site.name}
              </strong>
              <span>{site.siteType}</span>
            </div>
            <code>
              {site.latitude.toFixed(4)}, {site.longitude.toFixed(4)}
            </code>
            <small>{site.status}</small>
          </article>
        ))}
      </div>
      <div className="local-v27-document-rule">
        <strong>공간자료 처리</strong>
        <p>
          실제 좌표·시설명은 공개 가능성·보안·개인정보 검토 후 승인된 수준으로
          표시
        </p>
      </div>
    </div>
  );
}

function LocalProjectPreview({
  record,
}: {
  record: (typeof LOCAL_EXAMPLE_DATASET.data)[number];
}) {
  return (
    <div className="local-preview-v27-stack">
      <div className="resource-table-wrapper">
        <table className="resource-table">
          <thead>
            <tr>
              <th>사업명</th>
              <th>분야</th>
              <th>추진단계</th>
              <th>예산구간</th>
              <th>상태</th>
            </tr>
          </thead>
          <tbody>
            {record.exampleProjects.map((project) => (
              <tr key={project.id}>
                <td>
                  <strong>{project.title}</strong>
                </td>
                <td>{project.sector}</td>
                <td>{project.stage}</td>
                <td>{project.budgetBand}</td>
                <td>
                  <span className="local-v27-inline-badge">예시</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="local-v27-document-rule">
        <strong>운영 필터</strong>
        <p>
          국가·기관·기술분야·사업상태·금액구간·공개수준 기준 검색과 다운로드
        </p>
      </div>
    </div>
  );
}

function LocalDocumentPreview({
  record,
}: {
  record: (typeof LOCAL_EXAMPLE_DATASET.data)[number];
}) {
  return (
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
              <dt>검토상태</dt>
              <dd>{document.reviewStatus}</dd>
            </div>
          </dl>
        </article>
      ))}
      <div className="local-v27-document-rule">
        <strong>문서 표출 원칙</strong>
        <p>
          문서 원문과 주요 내용을 구분하여 제공 · 공개범위와 자료 확인일 표시 ·
          공개 가능한 요약만 공개
        </p>
      </div>
    </div>
  );
}

function getPreviewTitle(kind: DatasetPreviewKind): string {
  switch (kind) {
    case "local-geospatial":
      return "현지 사업후보지 위치";
    case "local-projects":
      return "현지 파트너·사업 파이프라인";
    case "local-documents":
      return "현지 인터뷰·문서 기본정보";
    default:
      return "현지 수요·사업여건";
  }
}
