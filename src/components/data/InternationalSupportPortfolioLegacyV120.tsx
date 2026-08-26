import { useEffect, useMemo, useState } from "react";
import {
  loadGcfCountryPortfolio,
  formatUsd,
} from "../../data/gcf/gcfCountryPortfolio";
import { PRIORITY_COUNTRIES } from "../../data/priorityCountries";
import {
  CTCN_SCOPE_NOTE_V112,
  GEF_SCOPE_NOTE_V112,
  INTERNATIONAL_SUPPORT_CAUTION_V112,
  MULTI_COUNTRY_AMOUNT_RULE_V112,
  getCtcnIndexV112,
  getInternationalSupportRecordsV112,
  getTechnologyNameKoV112,
} from "../../data/support/internationalSupportV112";
import type {
  InternationalSupportModeV112,
  InternationalSupportRecordV112,
  InternationalSupportOrganizationV112,
} from "../../data/support/internationalSupportV112";
import type { GcfCountryPortfolioRecord } from "../../types/gcf";
import { openDownloadHubV118 } from "../../utils/downloadHubNavigationV118";
import { openExternalUrl } from "../../utils/browser";
import "../../styles/international-support-v112.css";

interface Props {
  mode: InternationalSupportModeV112;
  initialCountryIso3?: string | null;
}

type OrganizationFilter = "all" | InternationalSupportOrganizationV112;

const MODE_META: Record<
  InternationalSupportModeV112,
  { kicker: string; title: string; description: string }
> = {
  ctcn: {
    kicker: "CTCN 기술지원",
    title: "국가별 CTCN 기술지원 요청",
    description:
      "CTCN이 공개한 국가별 기술지원 요청과 현재 플랫폼에 수록된 상세 사업정보를 제공합니다. 관련 기후기술은 사업 설명에서 확인된 경우 함께 표시합니다.",
  },
  "adaptation-fund": {
    kicker: "Adaptation Fund",
    title: "국가별 Adaptation Fund 사업",
    description:
      "Adaptation Fund가 공개한 국가별 사업, 승인금액과 진행상태를 제공합니다. 관련 기후기술은 사업 상세자료에서 확인된 경우 함께 표시합니다.",
  },
  "climate-funds": {
    kicker: "국제기후기금",
    title: "국가별 기후기금 사업·재원",
    description:
      "GCF, Adaptation Fund, GEF의 국가별 사업과 재원정보를 함께 확인할 수 있습니다. 기관별 집계 기준이 다르므로 금액은 기금별로 구분해 확인하는 것이 적절합니다.",
  },
};

function formatCount(value: number | null | undefined): string {
  return value == null
    ? "국가별 집계 없음"
    : `${value.toLocaleString("ko-KR")}건`;
}

function formatAmount(value: number | null | undefined): string {
  if (value == null) return "금액 미공개";
  return formatUsd(value);
}

function statusLabel(value: string | null | undefined): string {
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

function sectorLabel(value: string | null | undefined): string | null {
  if (!value) return null;
  const labels: Record<string, string> = {
    Agriculture: "농업",
    "Agriculture and forestry": "농업·산림",
    "Climate information / Early warning": "기후정보·조기경보",
    "Coastal management": "연안관리",
    "Coastal zones": "연안지역",
    "Cross-sectoral": "범부문",
    "Disaster Risk Reduction": "재해위험경감",
    "Early warning and Environmental assessment": "조기경보·환경평가",
    "Food Security": "식량안보",
    Industry: "산업",
    "Industry / Energy efficiency": "산업·에너지효율",
    "Infrastructure / Rural development": "인프라·농촌개발",
    "Infrastructure and Urban planning": "인프라·도시계획",
    "Multi-sector": "다부문",
    "Renewable energy": "재생에너지",
    "Rural development": "농촌개발",
    Transport: "교통",
    "Urban development": "도시개발",
    "Waste management / Agriculture": "폐기물관리·농업",
    Water: "물관리",
    "Water / Agriculture": "물관리·농업",
    "Water management": "물관리",
  };
  return labels[value] ?? value;
}

function statusOptions(records: InternationalSupportRecordV112[]): string[] {
  return Array.from(
    new Set(records.map((item) => item.status).filter(Boolean) as string[])
  ).sort((a, b) => a.localeCompare(b, "ko"));
}

function technologyOptions(
  records: InternationalSupportRecordV112[]
): string[] {
  return Array.from(
    new Set(records.flatMap((item) => item.mappedTechnologyIds))
  ).sort((a, b) =>
    getTechnologyNameKoV112(a).localeCompare(getTechnologyNameKoV112(b), "ko")
  );
}

function amountScopeLabel(record: InternationalSupportRecordV112): string {
  if (record.amountScope === "single_country_approved")
    return "해당 국가 승인액";
  if (record.amountScope === "multi_country_total")
    return "다국가 사업 총액 · 국가별 배분액 아님";
  return "공식 금액 미공개";
}

export default function InternationalSupportPortfolioV112({
  mode,
  initialCountryIso3 = null,
}: Props) {
  const [countryIso3, setCountryIso3] = useState(initialCountryIso3 ?? "VNM");
  const [organization, setOrganization] = useState<OrganizationFilter>("all");
  const [status, setStatus] = useState("all");
  const [technologyId, setTechnologyId] = useState("all");
  const [gcfRecord, setGcfRecord] = useState<GcfCountryPortfolioRecord | null>(
    null
  );
  const [gcfLoading, setGcfLoading] = useState(mode === "climate-funds");
  const [gcfError, setGcfError] = useState<string | null>(null);

  useEffect(() => {
    if (initialCountryIso3) setCountryIso3(initialCountryIso3);
  }, [initialCountryIso3]);

  useEffect(() => {
    setOrganization("all");
    setStatus("all");
    setTechnologyId("all");
  }, [countryIso3, mode]);

  useEffect(() => {
    if (mode !== "climate-funds") {
      setGcfRecord(null);
      setGcfLoading(false);
      setGcfError(null);
      return;
    }
    let cancelled = false;
    setGcfLoading(true);
    setGcfError(null);
    void loadGcfCountryPortfolio()
      .then((portfolio) => {
        if (cancelled) return;
        setGcfRecord(
          portfolio.data.find((item) => item.iso3 === countryIso3) ?? null
        );
        setGcfLoading(false);
      })
      .catch((reason: unknown) => {
        if (cancelled) return;
        setGcfRecord(null);
        setGcfLoading(false);
        setGcfError(
          reason instanceof Error
            ? reason.message
            : "GCF 포트폴리오를 불러오지 못했습니다"
        );
      });
    return () => {
      cancelled = true;
    };
  }, [countryIso3, mode]);

  const baseRecords = useMemo(() => {
    const countryRecords = getInternationalSupportRecordsV112(countryIso3);
    if (mode === "ctcn")
      return countryRecords.filter(
        (item) => item.sourceOrganization === "CTCN"
      );
    if (mode === "adaptation-fund") {
      return countryRecords.filter(
        (item) => item.sourceOrganization === "Adaptation Fund"
      );
    }
    return countryRecords.filter((item) => item.sourceOrganization !== "CTCN");
  }, [countryIso3, mode]);

  const filteredRecords = useMemo(
    () =>
      baseRecords.filter((item) => {
        if (organization !== "all" && item.sourceOrganization !== organization)
          return false;
        if (status !== "all" && item.status !== status) return false;
        if (
          technologyId !== "all" &&
          !item.mappedTechnologyIds.includes(technologyId)
        )
          return false;
        return true;
      }),
    [baseRecords, organization, status, technologyId]
  );

  const ctcnIndex = getCtcnIndexV112(countryIso3);
  const country = PRIORITY_COUNTRIES.find((item) => item.iso3 === countryIso3);
  const afRecords = baseRecords.filter(
    (item) => item.sourceOrganization === "Adaptation Fund"
  );
  const gefRecords = baseRecords.filter(
    (item) => item.sourceOrganization === "GEF"
  );
  const afApproved = afRecords.reduce(
    (sum, item) => sum + (item.approvedAmountUsd ?? 0),
    0
  );
  const gefGrant = gefRecords.reduce(
    (sum, item) => sum + (item.approvedAmountUsd ?? 0),
    0
  );
  const mappedCount = baseRecords.filter(
    (item) => item.mappedTechnologyIds.length > 0
  ).length;
  const meta = MODE_META[mode];

  return (
    <section className="v112-support" aria-label={meta.title}>
      <header className="v112-support-heading">
        <div>
          <span>{meta.kicker}</span>
          <h3>{meta.title}</h3>
          <p>{meta.description}</p>
        </div>
        <div className="v112-verified">
          <strong>2026-08-18</strong>
          <span>자료 확인일</span>
        </div>
      </header>

      <div className="v112-support-caution">
        <strong>데이터 안내</strong>
        <span>{INTERNATIONAL_SUPPORT_CAUTION_V112}</span>
      </div>

      <div className="v112-support-controls">
        <label>
          <span>국가</span>
          <select
            value={countryIso3}
            onChange={(event) => setCountryIso3(event.target.value)}
          >
            {PRIORITY_COUNTRIES.map((item) => (
              <option key={item.iso3} value={item.iso3}>
                {item.nameKo} · {item.iso3}
              </option>
            ))}
          </select>
        </label>

        {mode === "climate-funds" && (
          <label>
            <span>기금</span>
            <select
              value={organization}
              onChange={(event) =>
                setOrganization(event.target.value as OrganizationFilter)
              }
            >
              <option value="all">Adaptation Fund + GEF</option>
              <option value="Adaptation Fund">Adaptation Fund</option>
              <option value="GEF">GEF</option>
            </select>
          </label>
        )}

        <label>
          <span>상태</span>
          <select
            value={status}
            onChange={(event) => setStatus(event.target.value)}
          >
            <option value="all">전체 상태</option>
            {statusOptions(baseRecords).map((value) => (
              <option key={value} value={value}>
                {statusLabel(value)}
              </option>
            ))}
          </select>
        </label>

        <label>
          <span>기후기술 분야</span>
          <select
            value={technologyId}
            onChange={(event) => setTechnologyId(event.target.value)}
          >
            <option value="all">전체 기술</option>
            {technologyOptions(baseRecords).map((value) => (
              <option key={value} value={value}>
                {getTechnologyNameKoV112(value)}
              </option>
            ))}
          </select>
        </label>
      </div>

      {mode === "ctcn" ? (
        <div className="v112-summary-grid">
          <div>
            <span>공개 기술지원 건수</span>
            <strong>{formatCount(ctcnIndex?.officialPublishedTaCount)}</strong>
            <small>
              {ctcnIndex?.facetStatus === "not_shown"
                ? "공식 페이지에서 국가별 건수 별도 집계 없음"
                : "CTCN 공개 기술지원 건수"}
            </small>
          </div>
          <div>
            <span>수록 상세사업</span>
            <strong>{baseRecords.length}건</strong>
            <small>현재 플랫폼 수록 범위</small>
          </div>
          <div>
            <span>관련 기후기술</span>
            <strong>{mappedCount}건</strong>
            <small>사업 설명 기준</small>
          </div>
        </div>
      ) : mode === "adaptation-fund" ? (
        <div className="v112-summary-grid">
          <div>
            <span>현재 공식 사업</span>
            <strong>{afRecords.length}건</strong>
            <small>{country?.nameKo ?? countryIso3}</small>
          </div>
          <div>
            <span>승인금액</span>
            <strong>{formatAmount(afApproved)}</strong>
            <small>단일국가 사업 승인액 합계</small>
          </div>
          <div>
            <span>관련 기후기술</span>
            <strong>{mappedCount}건</strong>
            <small>사업 상세자료 기준</small>
          </div>
        </div>
      ) : (
        <div className="v112-fund-summary">
          <article>
            <span>GCF 국가 포트폴리오</span>
            {gcfLoading ? (
              <strong>불러오는 중</strong>
            ) : gcfError ? (
              <strong>로딩 실패</strong>
            ) : (
              <strong>
                {gcfRecord?.fundedActivityCount ?? 0}건 ·{" "}
                {formatAmount(gcfRecord?.fundedActivityFinancingUsd ?? null)}
              </strong>
            )}
            <small>GCF 국가별 공개 포트폴리오</small>
          </article>
          <article>
            <span>Adaptation Fund</span>
            <strong>
              {afRecords.length}건 · {formatAmount(afApproved)}
            </strong>
            <small>현재 국가 공식 페이지의 단일국가 사업</small>
          </article>
          <article>
            <span>GEF</span>
            <strong>
              {gefRecords.length}건 · {formatAmount(gefGrant)}
            </strong>
            <small>현재 플랫폼에 수록된 관련 사업</small>
          </article>
        </div>
      )}

      <div className="v112-support-toolbar">
        <span>
          표시 {filteredRecords.length}건 · {country?.nameKo ?? countryIso3}
        </span>
        <div>
          <button
            type="button"
            onClick={() => {
              const context =
                mode === "ctcn"
                  ? { elementId: "D-019", datasetId: "LDC-DS-D-019-CTCN" }
                  : mode === "adaptation-fund"
                  ? { elementId: "D-018", datasetId: "LDC-DS-D-018-AF" }
                  : { elementId: "D-023", datasetId: "LDC-DS-E-002" };
              openDownloadHubV118({
                countryIso3,
                elementId: context.elementId,
                datasetId: context.datasetId,
              });
            }}
            disabled={filteredRecords.length === 0}
          >
            다운로드 설정
          </button>
        </div>
      </div>

      {filteredRecords.length === 0 ? (
        <div className="v112-support-empty">
          <strong>현재 조건에 해당하는 사업이 없습니다</strong>
          <p>
            필터를 변경하거나 원천기관의 공식 목록에서 전체 사업을 확인해
            주세요.
          </p>
          {mode === "ctcn" && ctcnIndex && (
            <button
              type="button"
              onClick={() => openExternalUrl(ctcnIndex.sourceUrl)}
            >
              CTCN 공식 목록 확인 ↗
            </button>
          )}
        </div>
      ) : (
        <div className="v112-support-list">
          {filteredRecords.map((record) => (
            <SupportCard
              key={`${record.sourceOrganization}-${record.projectId}`}
              record={record}
            />
          ))}
        </div>
      )}

      <footer className="v112-support-notes">
        {mode === "ctcn" && <p>{CTCN_SCOPE_NOTE_V112}</p>}
        {mode === "climate-funds" && (
          <>
            <p>{MULTI_COUNTRY_AMOUNT_RULE_V112}</p>
            <p>{GEF_SCOPE_NOTE_V112}</p>
          </>
        )}
      </footer>
    </section>
  );
}

function SupportCard({ record }: { record: InternationalSupportRecordV112 }) {
  return (
    <article className="v112-support-card">
      <div className="v112-support-card-top">
        <div>
          <span
            className={`v112-org ${record.sourceOrganization
              .toLowerCase()
              .replace(/[^a-z]+/g, "-")}`}
          >
            {record.sourceOrganization}
          </span>
          {record.status && (
            <span className="v112-status">{statusLabel(record.status)}</span>
          )}
        </div>
        <span className="v112-project-id">
          {record.sourceReference ?? record.projectId}
        </span>
      </div>
      <h4>{record.projectTitle}</h4>
      {sectorLabel(record.sector) && (
        <p className="v112-sector">{sectorLabel(record.sector)}</p>
      )}

      <div className="v112-record-metrics">
        <div>
          <span>승인·지원 금액</span>
          <strong>{formatAmount(record.approvedAmountUsd)}</strong>
          <small>{amountScopeLabel(record)}</small>
        </div>
        {record.cofinancingUsd != null && (
          <div>
            <span>공동재원</span>
            <strong>{formatAmount(record.cofinancingUsd)}</strong>
            <small>공개자료 기준</small>
          </div>
        )}
        {record.implementingEntity && (
          <div>
            <span>실행기관</span>
            <strong>{record.implementingEntity}</strong>
          </div>
        )}
      </div>

      {record.mappedTechnologyIds.length > 0 && (
        <div className="v112-tech-evidence">
          <div className="v112-tech-tags">
            {record.mappedTechnologyIds.map((technologyId) => (
              <span key={technologyId}>
                {getTechnologyNameKoV112(technologyId)}
              </span>
            ))}
          </div>
          {record.technologyMappingEvidenceKo && (
            <p>{record.technologyMappingEvidenceKo}</p>
          )}
        </div>
      )}

      <div className="v112-source-actions">
        <small>자료 확인 {record.verifiedAt}</small>
        <div>
          {record.evidenceUrl && (
            <button
              type="button"
              onClick={() => openExternalUrl(record.evidenceUrl!)}
            >
              사업 문서 ↗
            </button>
          )}
          <button
            type="button"
            onClick={() => openExternalUrl(record.sourceUrl)}
          >
            공식 페이지 ↗
          </button>
        </div>
      </div>
    </article>
  );
}
