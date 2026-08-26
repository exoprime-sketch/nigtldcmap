import { useEffect, useMemo, useState } from "react";
import { PRIORITY_COUNTRIES } from "../../data/priorityCountries";
import {
  ADB_SOVEREIGN_PROJECTS_SOURCE_URL_V113,
  WORLD_BANK_PROJECTS_SOURCE_URL_V113,
  fetchMdbCountryPortfolioV113,
  getAdbIatiSourceUrlV113,
} from "../../services/mdbProjectsApiV113";
import type {
  MdbCountryPortfolioV113,
  MdbOrganizationV113,
  MdbProjectRecordV113,
} from "../../services/mdbProjectsApiV113";
import { openExternalUrl } from "../../utils/browser";
import { openDownloadHubV118 } from "../../utils/downloadHubNavigationV118";
import "../../styles/cooperation-finance-v113.css";

interface Props {
  initialCountryIso3?: string | null;
}

type OrganizationFilter = "all" | MdbOrganizationV113;

function formatUsd(value: number | null): string {
  if (value == null) return "금액 미공개";
  if (Math.abs(value) >= 1_000_000_000)
    return `USD ${(value / 1_000_000_000).toLocaleString("ko-KR", {
      maximumFractionDigits: 2,
    })}B`;
  if (Math.abs(value) >= 1_000_000)
    return `USD ${(value / 1_000_000).toLocaleString("ko-KR", {
      maximumFractionDigits: 1,
    })}M`;
  return `USD ${value.toLocaleString("ko-KR", { maximumFractionDigits: 0 })}`;
}

function formatDate(value: string | null): string {
  if (!value) return "일자 미공개";
  const iso = value.match(/^\d{4}-\d{2}-\d{2}/)?.[0];
  return iso ?? value;
}

function statusLabel(status: string): string {
  const normalized = status.toLowerCase();
  if (normalized.includes("active")) return "진행 중";
  if (normalized.includes("pipeline")) return "준비 중";
  if (normalized.includes("closed")) return "종료";
  return status;
}

function sumKnown(
  records: MdbProjectRecordV113[],
  key: "commitmentUsd" | "disbursementUsd"
) {
  const known = records
    .map((record) => record[key])
    .filter((value): value is number => value != null);
  return known.length ? known.reduce((sum, value) => sum + value, 0) : null;
}

export default function MdbProjectPortfolioV113({
  initialCountryIso3 = null,
}: Props) {
  const [countryIso3, setCountryIso3] = useState(initialCountryIso3 ?? "VNM");
  const [portfolio, setPortfolio] = useState<MdbCountryPortfolioV113 | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [organization, setOrganization] = useState<OrganizationFilter>("all");
  const [status, setStatus] = useState("all");

  useEffect(() => {
    if (initialCountryIso3) setCountryIso3(initialCountryIso3);
  }, [initialCountryIso3]);

  useEffect(() => {
    setOrganization("all");
    setStatus("all");
  }, [countryIso3]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    setPortfolio(null);
    void fetchMdbCountryPortfolioV113(countryIso3)
      .then((result) => {
        if (cancelled) return;
        setPortfolio(result);
        setLoading(false);
      })
      .catch((reason: unknown) => {
        if (cancelled) return;
        setError(
          reason instanceof Error
            ? reason.message
            : "MDB 프로젝트 데이터를 불러오지 못했습니다"
        );
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [countryIso3]);

  const allRecords = useMemo(
    () => (portfolio ? [...portfolio.worldBank, ...portfolio.adb] : []),
    [portfolio]
  );
  const statusOptions = useMemo(
    () => Array.from(new Set(allRecords.map((record) => record.status))).sort(),
    [allRecords]
  );
  const filteredRecords = useMemo(
    () =>
      allRecords.filter((record) => {
        if (organization !== "all" && record.organization !== organization)
          return false;
        if (status !== "all" && record.status !== status) return false;
        return true;
      }),
    [allRecords, organization, status]
  );
  const country = PRIORITY_COUNTRIES.find((item) => item.iso3 === countryIso3);
  const worldBankAmount = portfolio
    ? sumKnown(portfolio.worldBank, "commitmentUsd")
    : null;
  const adbCommitment = portfolio
    ? sumKnown(portfolio.adb, "commitmentUsd")
    : null;
  const adbDisbursement = portfolio
    ? sumKnown(portfolio.adb, "disbursementUsd")
    : null;

  return (
    <section className="v113-finance" aria-label="주요 국제기구·MDB 프로젝트">
      <header className="v113-finance-heading">
        <div>
          <span>World Bank · ADB</span>
          <h3>주요 국제기구·MDB 프로젝트</h3>
          <p>
            World Bank와 ADB의 공식 공개사업을 국가별로 확인합니다. 약정과
            지출은 서로 다른 금융정보이므로 별도로 표시합니다.
          </p>
        </div>
        <div className="v113-source-badge">공식 프로젝트 원천</div>
      </header>

      <div className="v113-controls multi">
        <label>
          <span>국가</span>
          <select
            value={countryIso3}
            onChange={(event: { target: { value: string } }) =>
              setCountryIso3(event.target.value)
            }
          >
            {PRIORITY_COUNTRIES.map((item) => (
              <option key={item.iso3} value={item.iso3}>
                {item.nameKo} · {item.iso3}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span>기관</span>
          <select
            value={organization}
            onChange={(event: { target: { value: string } }) =>
              setOrganization(event.target.value as OrganizationFilter)
            }
          >
            <option value="all">전체 기관</option>
            <option value="World Bank">World Bank</option>
            <option value="ADB">ADB</option>
          </select>
        </label>
        <label>
          <span>사업상태</span>
          <select
            value={status}
            onChange={(event: { target: { value: string } }) =>
              setStatus(event.target.value)
            }
          >
            <option value="all">전체 상태</option>
            {statusOptions.map((item) => (
              <option key={item} value={item}>
                {statusLabel(item)}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="v113-action-row standalone">
        <button
          type="button"
          onClick={() =>
            openDownloadHubV118({
              countryIso3,
              elementId: "D-021",
              datasetId: "LDC-DS-D-002",
            })
          }
          disabled={!filteredRecords.length}
        >
          다운로드 설정
        </button>
        <button
          type="button"
          className="secondary"
          onClick={() => openExternalUrl(WORLD_BANK_PROJECTS_SOURCE_URL_V113)}
        >
          World Bank 원자료 ↗
        </button>
        <button
          type="button"
          className="secondary"
          onClick={() =>
            openExternalUrl(
              getAdbIatiSourceUrlV113(countryIso3) ??
                ADB_SOVEREIGN_PROJECTS_SOURCE_URL_V113
            )
          }
        >
          ADB 원자료 ↗
        </button>
      </div>

      {loading && (
        <div className="v113-state">MDB 프로젝트를 불러오는 중입니다</div>
      )}
      {error && (
        <div className="v113-state warning">
          <strong>현재 MDB 프로젝트를 불러오지 못했습니다</strong>
          <span>{error}</span>
        </div>
      )}

      {portfolio && (
        <>
          <div className="v113-summary-grid">
            <article>
              <span>표시 프로젝트</span>
              <strong>
                {filteredRecords.length.toLocaleString("ko-KR")}건
              </strong>
              <small>
                {country?.nameKo ?? countryIso3} · 진행·준비 사업 중심
              </small>
            </article>
            <article>
              <span>World Bank</span>
              <strong>
                {portfolio.worldBank.length.toLocaleString("ko-KR")}건
              </strong>
              <small>공식 진행·준비 사업</small>
            </article>
            <article>
              <span>ADB</span>
              <strong>
                {portfolio.adbCoverage === "not_applicable"
                  ? "대상지역 아님"
                  : portfolio.adbCoverage === "unavailable"
                  ? "일시 확인 불가"
                  : `${portfolio.adb.length.toLocaleString("ko-KR")}건`}
              </strong>
              <small>공식 공개사업</small>
            </article>
            <article>
              <span>World Bank 사업금액</span>
              <strong>{formatUsd(worldBankAmount)}</strong>
              <small>공개 사업금액 기준</small>
            </article>
            <article>
              <span>ADB 약정금액</span>
              <strong>{formatUsd(adbCommitment)}</strong>
              <small>공개 약정금액 기준</small>
            </article>
          </div>

          {adbDisbursement != null && (
            <div className="v113-data-note compact-note">
              <strong>ADB 공개 지출액</strong>
              <span>{formatUsd(adbDisbursement)} · 약정금액과 별도 집계</span>
            </div>
          )}

          {portfolio.warnings.map((warning) => (
            <div key={warning} className="v113-state warning small">
              {warning}
            </div>
          ))}

          <div className="v113-project-list">
            {filteredRecords.map((record) => (
              <article
                key={`${record.organization}-${record.projectId}`}
                className="v113-project-card"
              >
                <div className="v113-project-topline">
                  <div>
                    <span
                      className={`v113-org ${
                        record.organization === "ADB" ? "adb" : "wb"
                      }`}
                    >
                      {record.organization}
                    </span>
                    <span className="v113-status">
                      {statusLabel(record.status)}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => openExternalUrl(record.sourceUrl)}
                  >
                    사업 원문 ↗
                  </button>
                </div>
                <h4>{record.title}</h4>
                <p className="v113-project-id">{record.projectId}</p>
                <dl className="v113-project-grid">
                  <div>
                    <dt>약정·승인금액</dt>
                    <dd>{formatUsd(record.commitmentUsd)}</dd>
                  </div>
                  <div>
                    <dt>지출액</dt>
                    <dd>{formatUsd(record.disbursementUsd)}</dd>
                  </div>
                  <div>
                    <dt>승인·시작</dt>
                    <dd>{formatDate(record.approvalDate)}</dd>
                  </div>
                  <div>
                    <dt>종료·예정</dt>
                    <dd>{formatDate(record.closingDate)}</dd>
                  </div>
                  <div className="wide">
                    <dt>시행기관</dt>
                    <dd>{record.implementingAgency || "기관 정보 미공개"}</dd>
                  </div>
                </dl>
                {record.sectors.length > 0 && (
                  <div className="v113-sector-row" aria-label="관련 분야">
                    {record.sectors.map((sector) => (
                      <span key={sector}>{sector}</span>
                    ))}
                  </div>
                )}
              </article>
            ))}
            {!filteredRecords.length && !loading && (
              <div className="v113-state">
                선택 조건에 해당하는 프로젝트가 없습니다
              </div>
            )}
          </div>

          <div className="v113-data-note">
            <strong>자료 확인 기준</strong>
            <span>
              World Bank의 사업금액과 ADB의 약정·지출은 원천기관별 정의가 달라
              기관별로 분리해 표시합니다. ADB 공개사업 자료는
              일반재원(OCR)·아시아개발기금(ADF) 사업 중심이며 일부 별도 기술지원
              사업은 포함되지 않을 수 있습니다.
            </span>
          </div>
        </>
      )}
    </section>
  );
}
