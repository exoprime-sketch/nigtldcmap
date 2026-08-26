import { useEffect, useMemo, useState } from "react";
import { PRIORITY_COUNTRIES } from "../../data/priorityCountries";
import {
  OECD_ODA_DATA_EXPLORER_URL_V113,
  fetchOecdOdaCountryV113,
} from "../../services/oecdOdaApiV113";
import type {
  OecdOdaCountryResultV113,
} from "../../services/oecdOdaApiV113";
import { openExternalUrl } from "../../utils/browser";
import { openDownloadHubV118 } from "../../utils/downloadHubNavigationV118";
import "../../styles/cooperation-finance-v113.css";

interface Props {
  initialCountryIso3?: string | null;
}

function formatMillion(value: number | null): string {
  if (value == null) return "자료 없음";
  return `${value.toLocaleString("ko-KR", {
    maximumFractionDigits: 1,
  })} 백만 USD`;
}

function shortMillion(value: number): string {
  return value.toLocaleString("ko-KR", { maximumFractionDigits: 1 });
}

export default function OdaDonorPortfolioV113({
  initialCountryIso3 = null,
}: Props) {
  const [countryIso3, setCountryIso3] = useState(initialCountryIso3 ?? "VNM");
  const [data, setData] = useState<OecdOdaCountryResultV113 | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialCountryIso3) setCountryIso3(initialCountryIso3);
  }, [initialCountryIso3]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    setData(null);
    void fetchOecdOdaCountryV113(countryIso3)
      .then((result) => {
        if (cancelled) return;
        setData(result);
        setLoading(false);
      })
      .catch((reason: unknown) => {
        if (cancelled) return;
        setError(
          reason instanceof Error
            ? reason.message
            : "OECD ODA 데이터를 불러오지 못했습니다"
        );
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [countryIso3]);

  const country = PRIORITY_COUNTRIES.find((item) => item.iso3 === countryIso3);
  const maxTrend = useMemo(() => {
    if (!data?.disbursementTrend.length) return 1;
    return Math.max(
      ...data.disbursementTrend.map((row) => Math.abs(row.value)),
      1
    );
  }, [data]);
  const maxProvider = useMemo(() => {
    if (!data?.topProviders.length) return 1;
    return Math.max(...data.topProviders.map((row) => row.value), 1);
  }, [data]);

  return (
    <section className="v113-finance" aria-label="국가별 ODA 공여구조">
      <header className="v113-finance-heading">
        <div>
          <span>OECD ODA</span>
          <h3>국가별 ODA 규모·공여구조</h3>
          <p>
            OECD 공식 통계의 실제 지출과 약정을 구분해 제공합니다. 최근 지출
            추세와 주요 공여기관을 함께 확인할 수 있습니다.
          </p>
        </div>
        <div className="v113-source-badge">OECD 공식 데이터</div>
      </header>

      <div className="v113-controls">
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
        <div className="v113-action-row">
          <button
            type="button"
            onClick={() =>
              openDownloadHubV118({
                countryIso3,
                elementId: "D-011",
                datasetId: "LDC-DS-D-011-OECD-ODA",
              })
            }
            disabled={!data}
          >
            다운로드 설정
          </button>
          <button
            type="button"
            className="secondary"
            onClick={() => openExternalUrl(OECD_ODA_DATA_EXPLORER_URL_V113)}
          >
            OECD 원자료 확인 ↗
          </button>
        </div>
      </div>

      {loading && (
        <div className="v113-state">OECD 데이터를 불러오는 중입니다</div>
      )}
      {error && (
        <div className="v113-state warning">
          <strong>현재 OECD 데이터를 불러오지 못했습니다</strong>
          <span>{error}</span>
          <button
            type="button"
            onClick={() => openExternalUrl(OECD_ODA_DATA_EXPLORER_URL_V113)}
          >
            OECD 원자료 확인 ↗
          </button>
        </div>
      )}

      {data && (
        <>
          {data.warnings.map((warning) => (
            <div key={warning} className="v113-state warning small">
              {warning}
            </div>
          ))}

          <div className="v113-summary-grid">
            <article>
              <span>최근 ODA 지출</span>
              <strong>{formatMillion(data.latestDisbursement)}</strong>
              <small>
                {data.latestDisbursementYear
                  ? `${data.latestDisbursementYear}년`
                  : "가용연도 없음"}
              </small>
            </article>
            <article>
              <span>최근 ODA 약정</span>
              <strong>{formatMillion(data.latestCommitment)}</strong>
              <small>
                {data.latestCommitmentYear
                  ? `${data.latestCommitmentYear}년`
                  : "가용연도 없음"}
              </small>
            </article>
            <article>
              <span>주요 공여기관</span>
              <strong>
                {data.topProviders.length.toLocaleString("ko-KR")}개
              </strong>
              <small>최근 지출연도 상위 공여기관</small>
            </article>
            <article>
              <span>가격 기준</span>
              <strong>{data.priceBaseLabel || "불변가격"}</strong>
              <small>{data.unitLabel || "US dollar, Millions"}</small>
            </article>
          </div>

          <div className="v113-two-column">
            <article className="v113-panel">
              <div className="v113-panel-title">
                <div>
                  <h4>{country?.nameKo ?? countryIso3} 최근 ODA 지출 추세</h4>
                  <p>OECD 실제 지출 통계</p>
                </div>
              </div>
              {data.disbursementTrend.length ? (
                <div className="v113-trend-list">
                  {data.disbursementTrend.map((row) => (
                    <div key={row.year} className="v113-bar-row">
                      <span>{row.year}</span>
                      <div className="v113-bar-track">
                        <div
                          className="v113-bar-fill"
                          style={{
                            width: `${Math.max(
                              2,
                              (Math.abs(row.value) / maxTrend) * 100
                            )}%`,
                          }}
                        />
                      </div>
                      <strong>{shortMillion(row.value)}</strong>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="v113-muted">최근 지출자료가 없습니다</p>
              )}
            </article>

            <article className="v113-panel">
              <div className="v113-panel-title">
                <div>
                  <h4>주요 공여기관</h4>
                  <p>
                    {data.latestDisbursementYear ?? "최근"}년 실제 지출 기준
                  </p>
                </div>
              </div>
              {data.topProviders.length ? (
                <div className="v113-provider-list">
                  {data.topProviders.map((provider) => (
                    <div
                      key={`${provider.code}-${provider.year}`}
                      className="v113-provider-row"
                    >
                      <div>
                        <strong>{provider.name}</strong>
                        <span>{provider.code}</span>
                      </div>
                      <div className="v113-provider-value">
                        <div className="v113-bar-track compact">
                          <div
                            className="v113-bar-fill"
                            style={{
                              width: `${Math.max(
                                2,
                                (provider.value / maxProvider) * 100
                              )}%`,
                            }}
                          />
                        </div>
                        <b>{shortMillion(provider.value)}</b>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="v113-muted">공여기관별 자료가 없습니다</p>
              )}
            </article>
          </div>

          <article className="v113-panel">
            <div className="v113-panel-title">
              <div>
                <h4>공여구조</h4>
                <p>OECD가 제공하는 공여기관 유형별 규모를 구분해 표시</p>
              </div>
            </div>
            <div className="v113-composition-grid">
              {data.providerComposition.map((item) => (
                <div key={item.code}>
                  <span>{item.label}</span>
                  <strong>{formatMillion(item.value)}</strong>
                  <small>{item.year}년</small>
                </div>
              ))}
              {!data.providerComposition.length && (
                <p className="v113-muted">공여기관군 집계자료가 없습니다</p>
              )}
            </div>
          </article>

          <div className="v113-data-note">
            <strong>자료 해석</strong>
            <span>
              지출은 실제 제공된 금액, 약정은 향후 제공하기로 한 공식 의무를
              의미합니다. 두 값은 서로 더하지 않고 별도로 확인해야 합니다.
            </span>
          </div>
        </>
      )}
    </section>
  );
}
