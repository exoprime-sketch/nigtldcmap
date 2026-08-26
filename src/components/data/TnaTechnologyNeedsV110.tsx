import { useEffect, useMemo, useState } from "react";
import { PRIORITY_COUNTRIES } from "../../data/priorityCountries";
import { CLIMATE_TECHNOLOGIES } from "../../data/climateTechnologyCatalog";
import { getCooperationPolicyEvidenceV109 } from "../../data/policy/cooperationPolicyEvidenceV109";
import {
  TNA_COUNTRY_PROFILES_V110,
  getMappedClimateTechnologyNameV110,
  getTnaCountryProfileV110,
} from "../../data/policy/tnaTechnologyNeedsV110";
import type { TnaTrackV110 } from "../../data/policy/tnaTechnologyNeedsV110";
import {
  TNA_CURRENTNESS_METHOD_NOTE_KO_V111,
  TNA_CURRENTNESS_REVIEWED_AT_V111,
  TNA_GCF_JOIN_NOTE_KO_V111,
  getTnaCurrentnessEvidenceV111,
  getVerifiedGcfMatchesForTnaV111,
  summarizeTnaCurrentnessV111,
} from "../../data/policy/tnaCurrentnessV111";
import type { TnaCurrentnessStatusV111 } from "../../data/policy/tnaCurrentnessV111";
import { openDownloadHubV118 } from "../../utils/downloadHubNavigationV118";
import {
  INTERNATIONAL_SUPPORT_CAUTION_V112,
  getSupportForCountryTechnologyV112,
} from "../../data/support/internationalSupportV112";
import { openExternalUrl } from "../../utils/browser";
import "../../styles/tna-technology-needs-v110.css";

interface Props {
  initialCountryIso3?: string | null;
}

type TrackFilter = "all" | TnaTrackV110;
type CurrentnessFilter = "all" | TnaCurrentnessStatusV111;
type GcfFilter = "all" | "matched" | "unmatched";

const CURRENTNESS_OPTIONS: Array<{
  value: CurrentnessFilter;
  label: string;
}> = [
  { value: "all", label: "최신 정책 확인 전체" },
  { value: "reconfirmed", label: "최신 정책에서 재확인" },
  { value: "partially_reconfirmed", label: "일부 내용 재확인" },
  { value: "historical_only", label: "과거 TNA 근거만" },
  { value: "possible_conflict", label: "최신 정책과 방향 차이" },
];

function currentnessShortLabel(status: TnaCurrentnessStatusV111): string {
  if (status === "reconfirmed") return "재확인";
  if (status === "partially_reconfirmed") return "일부 재확인";
  if (status === "historical_only") return "과거 근거";
  return "방향 차이";
}

function supportStatusLabel(value: string | null | undefined): string {
  if (!value) return "상태 정보 없음";
  const labels: Record<string, string> = {
    Implementation: "이행 중",
    Published: "공개",
    "Project Under Implementation": "이행 중",
    "Project Approved": "승인",
    Approved: "승인",
    Completed: "완료",
    Cancelled: "취소",
  };
  return labels[value] ?? value;
}

export default function TnaTechnologyNeedsV110({
  initialCountryIso3 = null,
}: Props) {
  const [countryIso3, setCountryIso3] = useState(initialCountryIso3 ?? "VNM");
  const [track, setTrack] = useState<TrackFilter>("all");
  const [technologyId, setTechnologyId] = useState("all");
  const [currentness, setCurrentness] = useState<CurrentnessFilter>("all");
  const [gcfFilter, setGcfFilter] = useState<GcfFilter>("all");

  useEffect(() => {
    if (initialCountryIso3) setCountryIso3(initialCountryIso3);
  }, [initialCountryIso3]);

  useEffect(() => {
    setTrack("all");
    setTechnologyId("all");
    setCurrentness("all");
    setGcfFilter("all");
  }, [countryIso3]);

  const profile = getTnaCountryProfileV110(countryIso3);
  const v109Record = getCooperationPolicyEvidenceV109(
    "LDC-DS-C-005-TNA",
    countryIso3
  );

  const availableMappedIds = useMemo(
    () =>
      Array.from(
        new Set(
          profile?.technologies
            .map((item) => item.mappedTechnologyId)
            .filter(Boolean) as string[]
        )
      ),
    [profile]
  );

  const countryCurrentnessSummary = useMemo(
    () =>
      summarizeTnaCurrentnessV111(
        profile?.technologies.map((item) => item.id) ?? []
      ),
    [profile]
  );

  const countrySupportMatchedCount = useMemo(
    () =>
      profile?.technologies.filter(
        (item) =>
          item.mappedTechnologyId &&
          getSupportForCountryTechnologyV112(
            profile.countryIso3,
            item.mappedTechnologyId
          ).length > 0
      ).length ?? 0,
    [profile]
  );

  const countryGcfMatchedCount = useMemo(
    () =>
      profile?.technologies.filter(
        (item) =>
          getVerifiedGcfMatchesForTnaV111(
            profile.countryIso3,
            item.mappedTechnologyId
          ).length > 0
      ).length ?? 0,
    [profile]
  );

  const filtered = useMemo(
    () =>
      profile?.technologies.filter((item) => {
        if (track !== "all" && item.track !== track) return false;
        if (
          technologyId !== "all" &&
          item.mappedTechnologyId !== technologyId
        ) {
          return false;
        }
        const currentnessEvidence = getTnaCurrentnessEvidenceV111(item.id);
        if (
          currentness !== "all" &&
          currentnessEvidence?.status !== currentness
        ) {
          return false;
        }
        const gcfMatches = getVerifiedGcfMatchesForTnaV111(
          profile.countryIso3,
          item.mappedTechnologyId
        );
        if (gcfFilter === "matched" && gcfMatches.length === 0) return false;
        if (gcfFilter === "unmatched" && gcfMatches.length > 0) return false;
        return true;
      }) ?? [],
    [profile, track, technologyId, currentness, gcfFilter]
  );

  return (
    <section className="v110-tna" aria-label="TNA/TAP 기술수요">
      <header className="v110-tna-heading">
        <div>
          <span className="v110-kicker">UNFCCC TT:CLEAR</span>
          <h3>국가가 우선순위로 제시한 기후기술 수요</h3>
          <p>
            TNA/TAP에 제시된 우선기술, 기술이전 장벽과 사업 아이디어를 정리하고,
            최신 NDC·NAP·BTR에서 관련 정책이 유지되는지 확인합니다. 관련 GCF 및
            국제지원 사업도 같은 국가와 기후기술 분야를 기준으로 함께
            제공합니다.
          </p>
        </div>
        <div className="v110-coverage">
          <strong>{TNA_COUNTRY_PROFILES_V110.length}/10</strong>
          <span>수록 국가</span>
        </div>
      </header>

      <div className="v110-current-caution v111-currentness-caution">
        <strong>최신 정책과 함께 확인</strong>
        <span>
          TNA/TAP은 작성 당시의 국가 기술수요를 보여줍니다. 아래에서는 최신
          NDC·NAP·BTR에서도 관련 방향이 확인되는지 함께 보여주며, 사업 추천이나
          우선순위 점수로 해석하지 않습니다.
        </span>
      </div>

      <div className="v110-controls v111-controls">
        <label>
          <span>국가</span>
          <select
            value={countryIso3}
            onChange={(e) => setCountryIso3(e.target.value)}
          >
            {PRIORITY_COUNTRIES.map((country) => (
              <option key={country.iso3} value={country.iso3}>
                {country.nameKo} · {country.iso3}
              </option>
            ))}
          </select>
        </label>

        {profile && (
          <>
            <label>
              <span>구분</span>
              <select
                value={track}
                onChange={(e) => setTrack(e.target.value as TrackFilter)}
              >
                <option value="all">감축·적응 전체</option>
                <option value="adaptation">적응</option>
                <option value="mitigation">감축</option>
              </select>
            </label>

            <label>
              <span>관련 기후기술</span>
              <select
                value={technologyId}
                onChange={(e) => setTechnologyId(e.target.value)}
              >
                <option value="all">전체 기술</option>
                {CLIMATE_TECHNOLOGIES.filter((technology) =>
                  availableMappedIds.includes(technology.id)
                ).map((technology) => (
                  <option key={technology.id} value={technology.id}>
                    {technology.nameKo}
                  </option>
                ))}
              </select>
            </label>

            <label>
              <span>최신 정책 반영 여부</span>
              <select
                value={currentness}
                onChange={(e) =>
                  setCurrentness(e.target.value as CurrentnessFilter)
                }
              >
                {CURRENTNESS_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <label>
              <span>기존 GCF 사업</span>
              <select
                value={gcfFilter}
                onChange={(e) => setGcfFilter(e.target.value as GcfFilter)}
              >
                <option value="all">전체</option>
                <option value="matched">관련 사업 있음</option>
                <option value="unmatched">관련 사업 없음</option>
              </select>
            </label>
          </>
        )}
      </div>

      {!profile ? (
        <div className="v110-not-structured">
          <strong>
            {v109Record?.countryNameKo ?? countryIso3}: TNA/TAP 상세자료 준비 중
          </strong>
          <p>
            {v109Record?.evidenceSummaryKo ??
              "현재 플랫폼에 상세 기술정보가 수록되지 않았습니다."}
          </p>
          <p>
            관련 TNA/TAP 문서와 기술수요는 UNFCCC 공식 목록에서 추가로 확인할 수
            있습니다.
          </p>
          <button
            type="button"
            className="secondary-button"
            onClick={() =>
              openExternalUrl(
                v109Record?.portalUrl ??
                  "https://unfccc.int/ttclear/tna/reports.html"
              )
            }
          >
            UNFCCC 공식 목록 확인 ↗
          </button>
        </div>
      ) : (
        <>
          <div className="v110-summary-grid v112-tna-summary">
            <div>
              <span>TNA/TAP 우선기술</span>
              <strong>{profile.technologies.length}</strong>
              <small>현재 플랫폼 수록 기준</small>
            </div>
            <div>
              <span>최신 정책 재확인</span>
              <strong>{countryCurrentnessSummary.reconfirmed}</strong>
              <small>
                부분 재확인 {countryCurrentnessSummary.partiallyReconfirmed}
              </small>
            </div>
            <div>
              <span>과거 TNA 근거만</span>
              <strong>{countryCurrentnessSummary.historicalOnly}</strong>
              <small>
                최신 정책과 방향 차이{" "}
                {countryCurrentnessSummary.possibleConflict}
              </small>
            </div>
            <div>
              <span>기존 GCF 사업 연결</span>
              <strong>{countryGcfMatchedCount}</strong>
              <small>동일 국가·기후기술 분야 기준</small>
            </div>
            <div>
              <span>CTCN·AF·GEF 연결</span>
              <strong>{countrySupportMatchedCount}</strong>
              <small>관련 기술·사업 기준</small>
            </div>
          </div>

          <div className="v111-method-note">
            <span>{TNA_CURRENTNESS_METHOD_NOTE_KO_V111}</span>
            <small>최신 정책 확인일 {TNA_CURRENTNESS_REVIEWED_AT_V111}</small>
          </div>

          <div className="v110-download-row">
            <span>
              {profile.coverageLabelKo} · TNA/TAP 자료 확인{" "}
              {profile.sourceReviewAsOf} · 최신 정책 확인{" "}
              {TNA_CURRENTNESS_REVIEWED_AT_V111}
            </span>
            <div>
              <button
                type="button"
                className="secondary-button"
                onClick={() =>
                  openDownloadHubV118({
                    countryIso3: profile.countryIso3,
                    elementId: "C-005",
                    datasetId: "LDC-DS-C-005-TNA",
                  })
                }
              >
                다운로드 설정
              </button>
            </div>
          </div>

          <section className="v110-tech-section">
            <div className="v110-section-title">
              <div>
                <span>우선기술</span>
                <h4>TNA 수요 · 최신 정책 · 기존 지원사업</h4>
              </div>
              <strong>{filtered.length}개</strong>
            </div>

            <div className="v110-tech-list">
              {filtered.map((item) => {
                const mappedName = getMappedClimateTechnologyNameV110(
                  item.mappedTechnologyId
                );
                const currentnessEvidence = getTnaCurrentnessEvidenceV111(
                  item.id
                );
                const gcfMatches = getVerifiedGcfMatchesForTnaV111(
                  profile.countryIso3,
                  item.mappedTechnologyId
                );
                const supportMatches = item.mappedTechnologyId
                  ? getSupportForCountryTechnologyV112(
                      profile.countryIso3,
                      item.mappedTechnologyId
                    )
                  : [];

                return (
                  <article
                    className="v110-tech-card v111-tech-card"
                    key={item.id}
                  >
                    <div className="v110-tech-top">
                      <div>
                        <span className={`v110-track ${item.track}`}>
                          {item.track === "adaptation" ? "적응" : "감축"}
                        </span>
                        <span className="v110-sector">{item.sectorKo}</span>
                        {item.priorityRank ? (
                          <span className="v110-rank">
                            원문 {item.priorityRank}순위
                          </span>
                        ) : null}
                      </div>
                      {item.mappedTechnologyId && (
                        <span
                          className={`v110-confidence ${item.mappingConfidence}`}
                        >
                          {item.mappingConfidence === "high"
                            ? "직접 관련"
                            : "유사 분야"}
                        </span>
                      )}
                    </div>

                    <h5>{item.sourceTechnologyNameKo}</h5>
                    <p className="v110-source-name">
                      원문 기술명: {item.sourceTechnologyName}
                    </p>

                    <div className="v110-map-result">
                      <span>관련 기후기술</span>
                      <strong>{mappedName ?? "분류 정보 없음"}</strong>
                    </div>

                    <p className="v110-evidence">{item.evidenceAnchorKo}</p>
                    {item.noteKo && <p className="v110-note">{item.noteKo}</p>}

                    <div className="v110-source-row">
                      <span>{item.sourcePages}</span>
                      <button
                        type="button"
                        onClick={() => openExternalUrl(item.sourceUrl)}
                      >
                        TNA 원문 보기 ↗
                      </button>
                    </div>

                    {currentnessEvidence ? (
                      <section
                        className={`v111-currentness-box ${currentnessEvidence.status}`}
                        aria-label="최신 정책 반영 여부"
                      >
                        <div className="v111-box-heading">
                          <span>최신 정책 반영 여부</span>
                          <strong>
                            {currentnessShortLabel(currentnessEvidence.status)}
                          </strong>
                        </div>
                        <p>{currentnessEvidence.interpretationKo}</p>
                        <div className="v111-current-anchor">
                          {currentnessEvidence.evidenceAnchorKo}
                        </div>
                        <div className="v111-policy-sources">
                          {currentnessEvidence.sources.map((source) => (
                            <button
                              type="button"
                              key={`${item.id}-${source.type}-${source.url}-${source.pages}`}
                              onClick={() => openExternalUrl(source.url)}
                              title={source.title}
                            >
                              {source.type} · {source.pages} · 원문 ↗
                            </button>
                          ))}
                        </div>
                      </section>
                    ) : (
                      <section className="v111-currentness-box missing">
                        <strong>최신 정책 확인자료 없음</strong>
                        <p>관련 정책자료를 추가 확인할 수 있습니다.</p>
                      </section>
                    )}

                    <section
                      className={`v111-gcf-box ${
                        gcfMatches.length > 0 ? "matched" : "unmatched"
                      }`}
                      aria-label="기존 GCF 사업 연결"
                    >
                      <div className="v111-box-heading">
                        <span>기존 GCF 사업</span>
                        <strong>
                          {gcfMatches.length > 0
                            ? `${gcfMatches.length}건 관련 사업`
                            : "관련 사업 없음"}
                        </strong>
                      </div>

                      {gcfMatches.length > 0 ? (
                        <div className="v111-gcf-projects">
                          {gcfMatches.map((project) => (
                            <button
                              type="button"
                              key={`${item.id}-${project.projectId}-${project.technologyId}`}
                              onClick={() => openExternalUrl(project.sourceUrl)}
                            >
                              <b>{project.projectId}</b>
                              <span>{project.projectTitle}</span>
                              <small>
                                {project.relation === "direct"
                                  ? "직접"
                                  : project.relation === "supporting"
                                  ? "지원"
                                  : "교차"}{" "}
                                · {project.evidenceBasis} ↗
                              </small>
                            </button>
                          ))}
                        </div>
                      ) : (
                        <p>
                          현재 플랫폼에서 같은 국가와 관련 기후기술 분야의 GCF
                          사업을 확인하지 못했습니다.
                        </p>
                      )}

                      <small className="v111-gcf-caution">
                        {TNA_GCF_JOIN_NOTE_KO_V111}
                      </small>
                    </section>

                    <section
                      className={`v112-support-join ${
                        supportMatches.length > 0 ? "matched" : "unmatched"
                      }`}
                      aria-label="기존 국제 기술지원·기후기금 사업 연결"
                    >
                      <div className="v111-box-heading">
                        <span>CTCN·Adaptation Fund·GEF</span>
                        <strong>
                          {supportMatches.length > 0
                            ? `${supportMatches.length}건 관련 사업`
                            : "관련 사업 없음"}
                        </strong>
                      </div>
                      {supportMatches.length > 0 ? (
                        <div className="v112-support-join-list">
                          {supportMatches.map((support) => (
                            <button
                              type="button"
                              key={`${item.id}-${support.sourceOrganization}-${support.projectId}`}
                              onClick={() => openExternalUrl(support.sourceUrl)}
                            >
                              <b>{support.sourceOrganization}</b>
                              <span>{support.projectTitle}</span>
                              <small>
                                {supportStatusLabel(support.status)} · 공식
                                페이지 ↗
                              </small>
                            </button>
                          ))}
                        </div>
                      ) : (
                        <p>
                          현재 플랫폼에서 같은 국가와 관련 기후기술 분야의
                          CTCN·Adaptation Fund·GEF 사업을 확인하지 못했습니다.
                        </p>
                      )}
                      <small className="v111-gcf-caution">
                        {INTERNATIONAL_SUPPORT_CAUTION_V112}
                      </small>
                    </section>
                  </article>
                );
              })}

              {filtered.length === 0 && (
                <div className="v110-empty">
                  현재 조건에 해당하는 우선기술이 없습니다.
                </div>
              )}
            </div>
          </section>

          {profile.barriers.length > 0 && (
            <section className="v110-evidence-section">
              <div className="v110-section-title">
                <div>
                  <span>사업설계 조건</span>
                  <h4>기술이전·확산 장벽</h4>
                </div>
              </div>
              <div className="v110-evidence-grid">
                {profile.barriers.map((barrier, index) => (
                  <article
                    key={`${barrier.track}-${barrier.sectorKo}-${index}`}
                  >
                    <div>
                      <span className={`v110-track ${barrier.track}`}>
                        {barrier.track === "adaptation" ? "적응" : "감축"}
                      </span>
                      <strong>{barrier.sectorKo}</strong>
                    </div>
                    <div className="v110-tags">
                      {barrier.categoriesKo.map((category) => (
                        <span key={category}>{category}</span>
                      ))}
                    </div>
                    <ul>
                      {barrier.barriersKo.map((value) => (
                        <li key={value}>{value}</li>
                      ))}
                    </ul>
                    <p>{barrier.evidenceAnchorKo}</p>
                    <button
                      type="button"
                      onClick={() => openExternalUrl(barrier.sourceUrl)}
                    >
                      {barrier.sourcePages} · 원문 ↗
                    </button>
                  </article>
                ))}
              </div>
            </section>
          )}

          {profile.projectIdeas.length > 0 && (
            <section className="v110-evidence-section">
              <div className="v110-section-title">
                <div>
                  <span>사업화 단서</span>
                  <h4>TAP · Project Idea</h4>
                </div>
              </div>
              <div className="v110-project-list">
                {profile.projectIdeas.map((project) => (
                  <article key={project.id}>
                    <span className={`v110-track ${project.track}`}>
                      {project.track === "adaptation" ? "적응" : "감축"}
                    </span>
                    <h5>{project.titleKo}</h5>
                    <p>{project.evidenceAnchorKo}</p>
                    <dl>
                      <div>
                        <dt>기간</dt>
                        <dd>{project.timeframe ?? "정보 없음"}</dd>
                      </div>
                      <div>
                        <dt>예산</dt>
                        <dd>
                          {project.budgetUsd != null
                            ? `US$ ${project.budgetUsd.toLocaleString("en-US")}`
                            : "공개자료에서 확인되지 않음"}
                        </dd>
                      </div>
                      <div>
                        <dt>이행기관</dt>
                        <dd>
                          {project.implementingOrganizationsKo.join(" · ") ||
                            "정보 없음"}
                        </dd>
                      </div>
                    </dl>
                    <button
                      type="button"
                      onClick={() => openExternalUrl(project.sourceUrl)}
                    >
                      {project.sourcePages} · 공식 문서 보기 ↗
                    </button>
                  </article>
                ))}
              </div>
            </section>
          )}

          <section className="v110-documents">
            <strong>관련 공식 TNA/TAP 문서</strong>
            {profile.officialDocuments.map((document) => (
              <button
                type="button"
                key={document.url}
                onClick={() => openExternalUrl(document.url)}
              >
                {document.track === "adaptation" ? "적응" : "감축"} ·{" "}
                {document.year} · {document.title} ↗
              </button>
            ))}
          </section>
        </>
      )}
    </section>
  );
}
