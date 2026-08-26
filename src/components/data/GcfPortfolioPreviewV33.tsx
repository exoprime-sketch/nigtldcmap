import { useEffect, useMemo, useState } from "react";
import {
  formatUsd,
  loadGcfCountryPortfolio,
} from "../../data/gcf/gcfCountryPortfolio";
import type {
  GcfCountryPortfolio,
  GcfCountryPortfolioRecord,
} from "../../types/gcf";

export default function GcfPortfolioPreviewV33({
  initialCountryIso3 = null,
}: {
  initialCountryIso3?: string | null;
}) {
  const [portfolio, setPortfolio] = useState<GcfCountryPortfolio | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedIso3, setSelectedIso3] = useState(initialCountryIso3 ?? "VNM");
  const [query, setQuery] = useState("");

  useEffect(() => {
    let cancelled = false;
    void loadGcfCountryPortfolio()
      .then((result) => {
        if (cancelled) return;
        setPortfolio(result);
        if (
          !initialCountryIso3 &&
          !result.data.some((item) => item.iso3 === selectedIso3)
        ) {
          setSelectedIso3(
            result.data.some((item) => item.iso3 === "VNM")
              ? "VNM"
              : result.data[0]?.iso3 ?? ""
          );
        }
        setLoading(false);
      })
      .catch((reason: unknown) => {
        if (cancelled) return;
        setError(
          reason instanceof Error ? reason.message : "GCF 포트폴리오 로딩 실패"
        );
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [initialCountryIso3]);

  const countryOptions = useMemo(() => {
    if (!portfolio) return [];
    return [...portfolio.data].sort((a, b) =>
      a.countryName.localeCompare(b.countryName, "ko")
    );
  }, [portfolio]);

  const selected =
    portfolio?.data.find((item) => item.iso3 === selectedIso3) ?? null;
  const normalizedQuery = query.trim().toLowerCase();
  const filteredRows = useMemo(() => {
    if (!portfolio) return [];
    return portfolio.data
      .filter(
        (item) =>
          !normalizedQuery ||
          `${item.countryName} ${item.iso3} ${item.region}`
            .toLowerCase()
            .includes(normalizedQuery)
      )
      .sort(
        (a, b) => b.fundedActivityFinancingUsd - a.fundedActivityFinancingUsd
      );
  }, [portfolio, normalizedQuery]);

  if (loading) return <p role="status">GCF 포트폴리오 로딩 중</p>;
  if (!portfolio || error)
    return <div className="detail-preview-warning">{error ?? "자료 없음"}</div>;

  return (
    <div className="v33-gcf-view">
      <section className="v33-dataset-controls single-line">
        <label>
          <span>국가</span>
          <select
            value={selectedIso3}
            onChange={(event) => setSelectedIso3(event.target.value)}
          >
            {countryOptions.map((item) => (
              <option key={item.iso3} value={item.iso3}>
                {item.countryName} · {item.iso3}
              </option>
            ))}
          </select>
        </label>
        <div className="v33-snapshot-label">
          <span>기준일</span>
          <strong>{portfolio.metadata.snapshotDate}</strong>
        </div>
      </section>

      {selected && <SelectedCountryPortfolio record={selected} />}

      <section className="v33-panel">
        <div className="v33-panel-heading with-actions">
          <div>
            <h3>국가별 GCF 포트폴리오</h3>
            <p>GCF 본사업과 사업준비·역량강화 지원을 국가별로 확인</p>
          </div>
          <label className="v33-inline-search">
            <span className="sr-only">국가 검색</span>
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="국가명·ISO 검색"
            />
          </label>
        </div>
        <div className="v33-table-wrap">
          <table className="v33-table">
            <thead>
              <tr>
                <th>국가</th>
                <th>지역</th>
                <th>GCF 본사업</th>
                <th>본사업 승인재원</th>
                <th>사업준비 지원</th>
                <th>사업준비 승인재원</th>
              </tr>
            </thead>
            <tbody>
              {filteredRows.map((item) => (
                <tr
                  key={item.iso3}
                  className={item.iso3 === selectedIso3 ? "selected" : ""}
                >
                  <td>
                    <strong>{item.countryName}</strong>
                    <small>{item.iso3}</small>
                  </td>
                  <td>{item.region}</td>
                  <td>{item.fundedActivityCount.toLocaleString("ko-KR")}건</td>
                  <td>{formatUsd(item.fundedActivityFinancingUsd)}</td>
                  <td>
                    {item.readinessProjectCount.toLocaleString("ko-KR")}건
                  </td>
                  <td>{formatUsd(item.readinessFinancingUsd)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <details className="v33-limitations">
        <summary>해석 시 유의사항</summary>
        <ul>
          {portfolio.metadata.limitations.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </details>

      <a
        className="v33-source-link"
        href={portfolio.metadata.sourceUrl}
        target="_blank"
        rel="noreferrer"
      >
        GCF 공식 데이터 확인 ↗
      </a>
    </div>
  );
}

function SelectedCountryPortfolio({
  record,
}: {
  record: GcfCountryPortfolioRecord;
}) {
  return (
    <section className="v33-summary-grid gcf-selected-summary">
      <article className="primary">
        <span>{record.countryName}</span>
        <strong>{record.fundedActivityCount.toLocaleString("ko-KR")}건</strong>
        <small>GCF 본사업</small>
      </article>
      <article>
        <span>본사업 승인재원</span>
        <strong>{formatUsd(record.fundedActivityFinancingUsd)}</strong>
        <small>국가 포트폴리오 집계</small>
      </article>
      <article>
        <span>사업준비·역량강화 지원</span>
        <strong>
          {record.readinessProjectCount.toLocaleString("ko-KR")}건
        </strong>
        <small>사업준비·역량강화 지원</small>
      </article>
      <article>
        <span>Readiness 승인재원</span>
        <strong>{formatUsd(record.readinessFinancingUsd)}</strong>
        <small>국가 포트폴리오 집계</small>
      </article>
    </section>
  );
}
