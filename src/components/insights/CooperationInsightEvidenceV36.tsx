import NdcPolicyPanel from "../ndc/NdcPolicyPanel";
import { formatUsd } from "../../data/gcf/gcfCountryPortfolio";
import { TECHNOLOGY_RELATION_LABELS } from "../../utils/technologyData";
import { getGcfProjectStatusLabelV80 } from "../../data/gcf/gcfPriorityProjectsV80";
import "../../styles/gcf-insights-v80.css";
import { useCooperationInsightEvidence } from "../../hooks/useCooperationInsightEvidence";
import "../../styles/cooperation-insights-v76.css";
import CooperationPlanningBriefV38 from "./CooperationPlanningBriefV38";
import { scrollToPageSection } from "../../utils/browser";
import "../../styles/evidence-navigation-v40.css";

interface CooperationInsightEvidenceV36Props {
  countryIso3: string;
  technologyId: string;
  onOpenDataset: (datasetId: string) => void;
  onOpenMap: (countryIso3: string) => void;
  onExploreDatasets: (countryIso3: string, technologyId: string) => void;
}

function formatMoney(amount?: number, currency?: string): string {
  if (amount === undefined || Number.isNaN(amount)) return "재원 확인 필요";
  if ((currency || "USD") === "USD") return formatUsd(amount);
  return `${new Intl.NumberFormat("ko-KR", {
    maximumFractionDigits: 1,
  }).format(amount)} ${currency || ""}`.trim();
}

function ExternalLink({ href, label }: { href?: string; label: string }) {
  if (!href) return null;
  return (
    <a href={href} target="_blank" rel="noreferrer">
      {label} ↗
    </a>
  );
}

export default function CooperationInsightEvidenceV36({
  countryIso3,
  technologyId,
  onOpenDataset,
  onOpenMap,
  onExploreDatasets,
}: CooperationInsightEvidenceV36Props) {
  const evidence = useCooperationInsightEvidence(countryIso3, technologyId);

  if (evidence.loading) {
    return (
      <div className="insight-v36-state" role="status">
        협력 검토 근거 불러오는 중
      </div>
    );
  }

  if (!evidence.country || !evidence.technology) {
    return (
      <div className="insight-v36-state">
        선택 국가 또는 기후기술 정보 확인 불가
      </div>
    );
  }

  const {
    country,
    technology,
    warning,
    linkedDatasets,
    commonDatasets,
    contextMetrics,
    demandDatasets,
    conditionDatasets,
    policyDatasets,
    projectDatasets,
    permittingDatasets,
    technologyOrganizationDatasets,
    locationDatasets,
    conditionMetrics,
    projects,
    technologyOrganizations,
    commonOrganizations,
    spatial,
    projectRegions,
    implementingOrganizations,
    gcfRecord,
    countryGcfProjects,
    technologyMatchedGcfProjects,
    gaps,
  } = evidence;

  const availableMetricCount = conditionMetrics.filter(
    (item) => item.available
  ).length;
  const usedCommonDatasets = commonDatasets.filter((dataset) => {
    if (dataset.primaryRepresentationType === "organization") {
      return (
        commonOrganizations.length > 0 || technologyOrganizations.length > 0
      );
    }
    if (
      dataset.previewKind === "gcf-portfolio" ||
      dataset.id === "LDC-DS-E-002"
    ) {
      return Boolean(gcfRecord);
    }
    return false;
  });

  return (
    <div className="insight-v36-evidence">
      {warning && <div className="insight-v36-warning">{warning}</div>}

      <CooperationPlanningBriefV38
        countryName={country.nameKo}
        technologyName={technology.nameKo}
        demandDatasetCount={demandDatasets.length}
        conditionDatasetCount={conditionDatasets.length}
        availableConditionCount={availableMetricCount}
        policyDatasetCount={policyDatasets.length}
        technologyProjectCount={
          projects.length + technologyMatchedGcfProjects.length
        }
        hasCountryPortfolio={Boolean(gcfRecord)}
        technologyOrganizationCount={technologyOrganizations.length}
        implementingOrganizationCount={implementingOrganizations.length}
        commonOrganizationCount={commonOrganizations.length}
        spatialCount={spatial.length}
        projectRegionCount={projectRegions.length}
        permittingDatasetCount={permittingDatasets.length}
        sources={[
          ...linkedDatasets.map((item) => ({
            id: item.dataset.id,
            title: item.dataset.titleKo,
            source: item.dataset.sourceOrganization,
            reference:
              item.dataset.referenceYear ||
              item.dataset.period ||
              "기준 확인 필요",
            sourceUrl: item.dataset.sourceUrl,
            relationLabel: TECHNOLOGY_RELATION_LABELS[item.relation],
          })),
          ...usedCommonDatasets.map((dataset) => ({
            id: dataset.id,
            title: dataset.titleKo,
            source: dataset.sourceOrganization,
            reference:
              dataset.referenceYear || dataset.period || "기준 확인 필요",
            sourceUrl: dataset.sourceUrl,
            relationLabel: "국가 공통 참고",
          })),
        ]}
      />

      <nav className="insight-v36-jump" aria-label="관련 근거 빠른 이동">
        <button
          type="button"
          onClick={() => scrollToPageSection("insight-context")}
        >
          00 국가 기본여건
        </button>
        <button
          type="button"
          onClick={() => scrollToPageSection("insight-demand")}
        >
          01 현지 수요
        </button>
        <button
          type="button"
          onClick={() => scrollToPageSection("insight-conditions")}
        >
          02 기술·적용여건
        </button>
        <button
          type="button"
          onClick={() => scrollToPageSection("insight-policy")}
        >
          03 정책·인허가
        </button>
        <button
          type="button"
          onClick={() => scrollToPageSection("insight-projects")}
        >
          04 사업·재원
        </button>
        <button
          type="button"
          onClick={() => scrollToPageSection("insight-implementation")}
        >
          05 실행기관·지역
        </button>
        <button
          type="button"
          onClick={() => scrollToPageSection("insight-gaps")}
        >
          06 추가 확인
        </button>
        <button
          type="button"
          onClick={() => scrollToPageSection("insight-evidence")}
        >
          07 근거 데이터
        </button>
      </nav>

      <section id="insight-context" className="insight-v36-section">
        <header className="insight-v36-section-heading">
          <div>
            <span>00 · 국가 맥락</span>
            <h2>국가 기본여건</h2>
            <p>
              인구·도시화·소득·성장률은 협력수요 자체가 아니라 대상국 규모와
              실행환경을 이해하는 기초 맥락
            </p>
          </div>
          <strong>
            {contextMetrics.filter((item) => item.available).length}개 지표
          </strong>
        </header>

        <div className="insight-v36-metric-grid insight-v76-context-grid">
          {contextMetrics.map((metric) => (
            <article key={metric.datasetId}>
              <span>{metric.title}</span>
              <strong>{metric.available ? metric.value : "자료 없음"}</strong>
              <small>
                {metric.available
                  ? `${metric.reference} · ${metric.source}`
                  : metric.source}
              </small>
              <button
                type="button"
                onClick={() => onOpenDataset(metric.datasetId)}
              >
                상세 데이터 보기 →
              </button>
            </article>
          ))}
        </div>

        <p className="insight-v36-note insight-v76-context-note">
          국가 기본통계의 크고 작음만으로 기술수요·협력우선순위를 자동 판정하지
          않음 · 직접 수요·정책·사업·기관 근거와 함께 검토
        </p>
      </section>

      <section id="insight-demand" className="insight-v36-section">
        <header className="insight-v36-section-heading">
          <div>
            <span>01 · 사업기획 출발점</span>
            <h2>현지 수요 근거</h2>
            <p>선택 기술이 필요한 현지 문제·수요·수요기관 근거를 별도로 확인</p>
          </div>
          <strong>{demandDatasets.length}건</strong>
        </header>

        {demandDatasets.length > 0 ? (
          <div className="insight-v36-dataset-grid">
            {demandDatasets.map((item) => (
              <button
                type="button"
                key={item.dataset.id}
                onClick={() => onOpenDataset(item.dataset.id)}
              >
                <span>{TECHNOLOGY_RELATION_LABELS[item.relation]}</span>
                <strong>{item.dataset.titleKo}</strong>
                <p>{item.basisKo}</p>
                <small>{item.dataset.sourceOrganization} · 근거 보기 →</small>
              </button>
            ))}
          </div>
        ) : (
          <div className="insight-v36-empty important">
            <strong>
              직접적인 기술수요 근거는 현재 플랫폼에서 확인되지 않음
            </strong>
            <span>
              자원 잠재량·정책 명시·기존 사업 존재를 현지 기술수요로 자동
              변환하지 않음
            </span>
          </div>
        )}
      </section>

      <section id="insight-conditions" className="insight-v36-section">
        <header className="insight-v36-section-heading">
          <div>
            <span>02 · 기술 검토</span>
            <h2>기술·적용여건</h2>
            <p>현재 연결된 자원·기후·인프라·국가 지표의 실제 값 확인</p>
          </div>
          <strong>{availableMetricCount}개 지표</strong>
        </header>

        {conditionMetrics.length > 0 ? (
          <div className="insight-v36-metric-grid">
            {conditionMetrics.map((metric) => (
              <article key={metric.datasetId}>
                <span>{metric.title}</span>
                <strong>{metric.available ? metric.value : "자료 없음"}</strong>
                <small>
                  {metric.available
                    ? `${metric.reference} · ${metric.source}`
                    : metric.source}
                </small>
                <button
                  type="button"
                  onClick={() => onOpenDataset(metric.datasetId)}
                >
                  상세 데이터 보기 →
                </button>
              </article>
            ))}
          </div>
        ) : (
          <div className="insight-v36-empty">
            <strong>현재 국가값으로 확인 가능한 기술·적용여건 자료 없음</strong>
            <span>
              조건자료가 추가되면 실제 값·기준시점·출처를 동일 영역에서 제공
            </span>
          </div>
        )}

        {conditionDatasets.length > conditionMetrics.length && (
          <div className="insight-v36-inline-links">
            {conditionDatasets
              .filter(
                (item) =>
                  !conditionMetrics.some(
                    (metric) => metric.datasetId === item.dataset.id
                  )
              )
              .map((item) => (
                <button
                  type="button"
                  key={item.dataset.id}
                  onClick={() => onOpenDataset(item.dataset.id)}
                >
                  <strong>{item.dataset.titleKo}</strong>
                  <span>{item.basisKo}</span>
                  <small>자료 상세 →</small>
                </button>
              ))}
          </div>
        )}

        <p className="insight-v36-note">
          국가 평균·전망값은 개별 부지의 사업성·경제성·계통접속 가능성을 직접
          의미하지 않음
        </p>
      </section>

      <section id="insight-policy" className="insight-v36-section">
        <header className="insight-v36-section-heading">
          <div>
            <span>03 · 정책 추진여건</span>
            <h2>정책·NDC·인허가</h2>
            <p>공식 정책근거와 실제 연결된 인허가 자료를 분리하여 확인</p>
          </div>
          <strong>
            {policyDatasets.length + permittingDatasets.length}개 자료
          </strong>
        </header>

        <NdcPolicyPanel
          iso3={country.iso3}
          technologyId={technology.id}
          mode="profile"
        />

        {policyDatasets.length > 0 && (
          <div className="insight-v36-policy-links">
            {policyDatasets.map((item) => (
              <button
                type="button"
                key={item.dataset.id}
                onClick={() => onOpenDataset(item.dataset.id)}
              >
                <strong>{item.dataset.titleKo}</strong>
                <span>{item.basisKo}</span>
                <small>
                  {item.dataset.sourceOrganization} · 전체 근거 보기 →
                </small>
              </button>
            ))}
          </div>
        )}

        <div className="insight-v36-subsection">
          <div>
            <span>인허가</span>
            <strong>기술·사업조건별 절차자료</strong>
          </div>
          {permittingDatasets.length > 0 ? (
            <div className="insight-v36-inline-links">
              {permittingDatasets.map((item) => (
                <button
                  type="button"
                  key={item.dataset.id}
                  onClick={() => onOpenDataset(item.dataset.id)}
                >
                  <strong>{item.dataset.titleKo}</strong>
                  <span>{item.basisKo}</span>
                  <small>절차 상세 →</small>
                </button>
              ))}
            </div>
          ) : (
            <div className="insight-v36-empty compact">
              <strong>현재 선택 조건에서 확인 가능한 인허가 근거 없음</strong>
              <span>사업유형·규모·입지 확정 후 공식 절차 추가 확인 필요</span>
            </div>
          )}
        </div>
      </section>

      <section id="insight-projects" className="insight-v36-section">
        <header className="insight-v36-section-heading">
          <div>
            <span>04 · 기존 추진현황</span>
            <h2>기존 사업·재원</h2>
            <p>선택 기술에 실제 태그된 사업과 국가 전체 기후재원 맥락을 구분</p>
          </div>
          <strong>
            {projects.length + technologyMatchedGcfProjects.length}건
          </strong>
        </header>

        {technologyMatchedGcfProjects.length > 0 && (
          <section className="insight-v80-country-projects">
            <header>
              <div>
                <span>GCF 관련 기후기술</span>
                <strong>{technologyMatchedGcfProjects.length}건</strong>
              </div>
              <small>공식 프로젝트 페이지 · 2026-08-13 확인</small>
            </header>
            <div>
              {technologyMatchedGcfProjects.map(({ project, mapping }) => (
                <article
                  key={`${project.countryIso3}:${project.projectId}:${mapping.technologyId}`}
                >
                  <span>
                    {project.projectId} ·{" "}
                    {mapping.relation === "direct" ? "직접" : "지원"}
                  </span>
                  <b>{project.title}</b>
                  <small>{mapping.evidenceBasis}</small>
                  <a href={mapping.sourceUrl} target="_blank" rel="noreferrer">
                    공식 원문 ↗
                  </a>
                </article>
              ))}
            </div>
            <p>관련 기후기술이 사업자료에서 확인된 GCF 프로젝트를 표시합니다</p>
          </section>
        )}

        {projects.length > 0 ? (
          <div className="insight-v36-project-list">
            {projects.map((project) => (
              <article key={project.id}>
                <header>
                  <div>
                    <span>{project.id}</span>
                    <strong>{project.title || "사업명 확인 필요"}</strong>
                  </div>
                  <b>{project.projectStatus || "상태 확인 필요"}</b>
                </header>
                <dl>
                  <div>
                    <dt>재원</dt>
                    <dd>{formatMoney(project.amount, project.currency)}</dd>
                  </div>
                  <div>
                    <dt>재원기관</dt>
                    <dd>{project.fundingOrganization || "자료 없음"}</dd>
                  </div>
                  <div>
                    <dt>수행기관</dt>
                    <dd>{project.implementingOrganization || "자료 없음"}</dd>
                  </div>
                  <div>
                    <dt>대상지역</dt>
                    <dd>{project.regionName || "자료 없음"}</dd>
                  </div>
                  <div>
                    <dt>기간</dt>
                    <dd>
                      {project.startDate || "자료 없음"} –{" "}
                      {project.endDate || "자료 없음"}
                    </dd>
                  </div>
                </dl>
                <ExternalLink
                  href={project.sourceUrl}
                  label="사업 원 데이터 확인"
                />
              </article>
            ))}
          </div>
        ) : technologyMatchedGcfProjects.length === 0 ? (
          <div className="insight-v36-empty important">
            <strong>선택 기술에 직접 연결된 기존 사업·재원 자료 없음</strong>
            <span>
              국가 전체 GCF 지원현황과 특정 기술 관련 재원은 구분하여 확인할 수
              있습니다
            </span>
          </div>
        ) : null}

        {projects.length > 0 && (
          <p className="insight-v36-note">
            표시 재원은 사업 원문에 기재된 재원 기준 · 다국가 사업은 해당 국가에
            배분된 금액이 아닐 수 있어 원 데이터 추가 확인 필요
          </p>
        )}

        {gcfRecord && (
          <aside className="insight-v36-country-finance">
            <div>
              <span>국가 전체 참고</span>
              <strong>{country.nameKo} GCF 포트폴리오</strong>
            </div>
            <dl>
              <div>
                <dt>Funded Activity</dt>
                <dd>{gcfRecord.fundedActivityCount}건</dd>
              </div>
              <div>
                <dt>승인재원</dt>
                <dd>{formatUsd(gcfRecord.fundedActivityFinancingUsd)}</dd>
              </div>
              <div>
                <dt>Readiness 지원</dt>
                <dd>{gcfRecord.readinessProjectCount}건</dd>
              </div>
              <div>
                <dt>Readiness 승인재원</dt>
                <dd>{formatUsd(gcfRecord.readinessFinancingUsd)}</dd>
              </div>
            </dl>
            <small>
              국가 전체 포트폴리오 참고값 · 선택 기술에 사용 가능한 재원이나
              한국과의 협력 가능 재원을 의미하지 않음
            </small>
          </aside>
        )}

        {countryGcfProjects.length > 0 && (
          <section className="insight-v80-country-projects">
            <header>
              <div>
                <span>국가 전체 GCF 프로젝트</span>
                <strong>
                  현재{" "}
                  {
                    countryGcfProjects.filter(
                      (project) => project.countsTowardCurrentCountryPortfolio
                    ).length
                  }
                  건
                </strong>
              </div>
              <small>관련 기후기술 정보 준비 중</small>
            </header>

            <div>
              {countryGcfProjects
                .filter(
                  (project) => project.countsTowardCurrentCountryPortfolio
                )
                .slice(0, 4)
                .map((project) => (
                  <article key={`${project.countryIso3}:${project.projectId}`}>
                    <span>{project.projectId}</span>
                    <b>{project.title}</b>
                    <small>
                      {project.entity} ·{" "}
                      {getGcfProjectStatusLabelV80(project.status)}
                    </small>
                    <a
                      href={project.projectUrl}
                      target="_blank"
                      rel="noreferrer"
                    >
                      원문 ↗
                    </a>
                  </article>
                ))}
            </div>

            <p>
              위 목록은 국가 전체 기존 GCF 사업을 확인하기 위한 자료 · 선택한
              관련 기후기술이 확인되는 경우에만 함께 표시합니다
            </p>

            <button
              type="button"
              className="insight-v36-text-button"
              onClick={() => onOpenDataset("LDC-PILOT-D-020-GCF-PROJECTS")}
            >
              국가 GCF 프로젝트 전체 보기 →
            </button>
          </section>
        )}

        {projectDatasets.length > 0 && (
          <button
            type="button"
            className="insight-v36-text-button"
            onClick={() => onOpenDataset(projectDatasets[0].dataset.id)}
          >
            사업·재원 데이터 전체 보기 →
          </button>
        )}
      </section>

      <section id="insight-implementation" className="insight-v36-section">
        <header className="insight-v36-section-heading">
          <div>
            <span>05 · 실행 기반</span>
            <h2>기관·수행경험·지역정보</h2>
            <p>공식 역할 또는 기존 사업 수행이 확인된 기관정보 제공</p>
          </div>
          <strong>
            {technologyOrganizations.length +
              commonOrganizations.length +
              implementingOrganizations.length}
            개 기관정보
          </strong>
        </header>

        <div className="insight-v36-org-panels">
          {technologyOrganizations.length > 0 && (
            <article>
              <header>
                <span>기술 특정 기관</span>
                <strong>선택 기술과 직접 연결된 역할이 확인된 기관</strong>
              </header>
              <div className="insight-v36-org-list">
                {technologyOrganizations.map((organization) => (
                  <div key={organization.id}>
                    <strong>{organization.name || "기관명 확인 필요"}</strong>
                    <span>
                      {organization.organizationType || "기관유형 확인 필요"}
                    </span>
                    <p>
                      {organization.confirmedRole || "확인된 역할 설명 없음"}
                    </p>
                    <ExternalLink
                      href={organization.sourceUrl}
                      label="기관 근거 확인"
                    />
                  </div>
                ))}
              </div>
              <small className="insight-v36-card-note">
                자료에서 확인된 역할 기준 · 신규 사업 참여의향·조달 적합성은
                별도 확인 필요
              </small>
            </article>
          )}

          {implementingOrganizations.length > 0 && (
            <article>
              <header>
                <span>기존 사업 수행경험</span>
                <strong>선택 기술 관련 사업에서 확인된 수행기관</strong>
              </header>
              <ul className="insight-v36-simple-list">
                {implementingOrganizations.map((organization) => (
                  <li key={organization}>{organization}</li>
                ))}
              </ul>
              <small className="insight-v36-card-note">
                기존 사업 수행사실만 확인 · 신규 사업 참여의향·파트너 적합성은
                별도 확인 필요
              </small>
            </article>
          )}

          {commonOrganizations.length > 0 && (
            <article>
              <header>
                <span>국가 공통 기관</span>
                <strong>기후재원·국가절차 관련 공식 역할이 확인된 기관</strong>
              </header>
              <div className="insight-v36-org-list">
                {commonOrganizations.map((organization) => (
                  <div key={organization.id}>
                    <strong>{organization.name || "기관명 확인 필요"}</strong>
                    <span>
                      {organization.organizationType || "기관유형 확인 필요"}
                    </span>
                    <p>
                      {organization.confirmedRole || "확인된 역할 설명 없음"}
                    </p>
                    <ExternalLink
                      href={organization.sourceUrl}
                      label="기관 근거 확인"
                    />
                  </div>
                ))}
              </div>
              <small className="insight-v36-card-note">
                국가 지정기관·접근기관 등 공통 역할정보 · 기술별 협력의향은 별도
                현지 확인 필요
              </small>
            </article>
          )}

          {technologyOrganizations.length === 0 &&
            implementingOrganizations.length === 0 &&
            commonOrganizations.length === 0 && (
              <div className="insight-v36-empty compact">
                <strong>현재 플랫폼에서 확인 가능한 기관자료 없음</strong>
                <span>기관명·역할·근거가 확인된 자료만 이 영역에 표시</span>
              </div>
            )}
        </div>

        <div className="insight-v36-location-block">
          <header>
            <div>
              <span>지역·시설</span>
              <strong>공식 위치정보와 사업 문서의 지역정보를 구분</strong>
            </div>
            <button
              type="button"
              className="insight-v81-map-action"
              onClick={() => onOpenMap(country.iso3)}
            >
              지도에서 국가 보기
            </button>
          </header>

          {spatial.length > 0 ? (
            <div className="insight-v36-spatial-list">
              {spatial.map((record) => (
                <article key={record.id}>
                  <strong>
                    {record.name || record.regionName || "위치명 확인 필요"}
                  </strong>
                  <span>{record.regionName || "지역명 없음"}</span>
                  <small>
                    {typeof record.latitude === "number" &&
                    typeof record.longitude === "number"
                      ? `${record.latitude.toFixed(
                          4
                        )}, ${record.longitude.toFixed(4)}`
                      : "좌표 없음"}
                  </small>
                </article>
              ))}
            </div>
          ) : (
            <div className="insight-v36-empty compact">
              <strong>현재 제공되는 시설 위치정보 없음</strong>
              <span>
                좌표가 없는 사업·기관을 수도나 도시 중심점에 임의 표시하지 않음
              </span>
            </div>
          )}

          {projectRegions.length > 0 && (
            <div className="insight-v36-region-tags">
              <span>기존 사업 문서에서 확인된 지역명</span>
              <div>
                {projectRegions.map((region) => (
                  <b key={region}>{region}</b>
                ))}
              </div>
              <small>정확한 좌표·사업후보지 의미 아님</small>
            </div>
          )}
        </div>
      </section>

      <section id="insight-gaps" className="insight-v36-section gap-section">
        <header className="insight-v36-section-heading">
          <div>
            <span>06 · 후속 조사</span>
            <h2>추가 확인 필요</h2>
            <p>
              현재 플랫폼에 연결된 근거만으로 사업기획을 확정하기 어려운 영역
            </p>
          </div>
          <strong>{gaps.length}개 영역</strong>
        </header>

        {gaps.length > 0 ? (
          <ol className="insight-v36-gap-list">
            {gaps.map((gap) => (
              <li key={gap}>{gap}</li>
            ))}
          </ol>
        ) : (
          <div className="insight-v36-empty compact">
            <strong>현재 정의한 핵심 검토영역에 연결자료 존재</strong>
            <span>실제 사업 착수 전 최신 원자료·현지 확인은 별도 필요</span>
          </div>
        )}

        <p className="insight-v36-note strong">
          정보공백은 해당 국가에 수요·제도·기관·사업이 존재하지 않는다는 의미가
          아니라 현재 플랫폼에서 확인 가능한 근거가 연결되지 않았다는 의미
        </p>
      </section>

      <section
        id="insight-evidence"
        className="insight-v36-section evidence-section"
      >
        <header className="insight-v36-section-heading">
          <div>
            <span>07 · 추적성</span>
            <h2>사용된 근거 데이터</h2>
            <p>각 검토사항의 출처와 데이터 상세페이지를 동일 화면에서 추적</p>
          </div>
          <strong>
            {linkedDatasets.length + usedCommonDatasets.length}개 자료
          </strong>
        </header>

        <div className="insight-v36-evidence-table-wrap">
          <table className="insight-v36-evidence-table">
            <thead>
              <tr>
                <th>구분</th>
                <th>자료</th>
                <th>기준</th>
                <th>출처</th>
                <th>연결 근거</th>
                <th>확인</th>
              </tr>
            </thead>
            <tbody>
              {linkedDatasets.map((item) => (
                <tr key={`linked-${item.dataset.id}`}>
                  <td>{TECHNOLOGY_RELATION_LABELS[item.relation]}</td>
                  <td>{item.dataset.titleKo}</td>
                  <td>
                    {item.dataset.referenceYear ||
                      item.dataset.period ||
                      "자료 없음"}
                  </td>
                  <td>{item.dataset.sourceOrganization}</td>
                  <td>{item.basisKo}</td>
                  <td>
                    <button
                      type="button"
                      onClick={() => onOpenDataset(item.dataset.id)}
                    >
                      상세 보기
                    </button>
                  </td>
                </tr>
              ))}
              {usedCommonDatasets.map((dataset) => (
                <tr key={`common-${dataset.id}`}>
                  <td>국가 공통</td>
                  <td>{dataset.titleKo}</td>
                  <td>
                    {dataset.referenceYear || dataset.period || "자료 없음"}
                  </td>
                  <td>{dataset.sourceOrganization}</td>
                  <td>선택 기술에 귀속하지 않는 국가 공통 참고자료</td>
                  <td>
                    <button
                      type="button"
                      onClick={() => onOpenDataset(dataset.id)}
                    >
                      상세 보기
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="insight-v36-evidence-actions">
          <button
            type="button"
            className="primary-button"
            onClick={() => onExploreDatasets(country.iso3, technology.id)}
          >
            {country.nameKo} × {technology.nameKo} 관련 데이터 전체 보기
          </button>
        </div>
      </section>

      <aside className="insight-v36-final-note">
        <strong>협력 인사이트 이용 기준</strong>
        <span>
          확인된 데이터와 정보공백을 한 흐름으로 연결하는 사업기획 지원 화면 ·
          최종 투자·법률·조달·파트너 선정 판단을 대체하지 않음
        </span>
      </aside>
    </div>
  );
}
