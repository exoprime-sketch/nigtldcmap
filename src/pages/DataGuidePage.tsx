import { useEffect, useMemo, useState } from "react";
import type { View } from "../app/navigation";
import { SERVICE_LINKS } from "../config/serviceLinks";
import { PUBLIC_GLOSSARY_V134 } from "../data/glossary/publicGlossaryV134";
import { loadVietnamPublicOverviewV128 } from "../data/publicPlatformV128";
import { PublicTermTextV134 } from "../components/help/PublicTermV134";
import "../styles/data-guide-v128.css";

interface DataGuidePageProps {
  onNavigate: (view: View) => void;
}

export default function DataGuidePage({ onNavigate }: DataGuidePageProps) {
  const [releaseDate, setReleaseDate] = useState("확인 중");
  const [glossaryQuery, setGlossaryQuery] = useState("");

  const visibleGlossary = useMemo(() => {
    const normalized = glossaryQuery.trim().toLocaleLowerCase("ko-KR");
    if (!normalized) return PUBLIC_GLOSSARY_V134;
    return PUBLIC_GLOSSARY_V134.filter((entry) => {
      const patternAliases =
        entry.id === "spei"
          ? "SPEI3 SPEI6 SPEI12 SPEI-3 SPEI-6 SPEI-12"
          : entry.id === "ssp"
          ? "SSP1-1.9 SSP1-2.6 SSP2-4.5 SSP3-7.0 SSP5-8.5"
          : "";
      return [
        entry.term,
        entry.englishName,
        entry.koreanName,
        entry.definition,
        ...entry.aliases,
        patternAliases,
      ]
        .join(" ")
        .toLocaleLowerCase("ko-KR")
        .includes(normalized);
    });
  }, [glossaryQuery]);

  useEffect(() => {
    let cancelled = false;
    void loadVietnamPublicOverviewV128()
      .then((overview) => {
        if (!cancelled) setReleaseDate(overview.releaseDate);
      })
      .catch(() => {
        if (!cancelled) setReleaseDate("데이터 현황에서 확인");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("guide") !== "glossary") {
      return;
    }
    const frame = window.requestAnimationFrame(() => {
      document.getElementById("guide-glossary")?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
      document.getElementById("guide-glossary-search")?.focus();
    });
    return () => window.cancelAnimationFrame(frame);
  }, []);

  function scrollToSection(id: string) {
    document.getElementById(id)?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }

  return (
    <div className="page-shell data-guide-v128" data-v128-guide>
      <header className="data-guide-v128__hero">
        <span>현재 제공 국가 · 베트남</span>
        <h1>데이터 이용안내</h1>
        <p>
          데이터 범위, 자료기간, 출처, 다운로드 및 지도 이용 시 참고사항을
          안내합니다.
        </p>
      </header>

      <section id="guide-usage" className="cdp-panel">
        <h2>조회순·최신순 안내</h2>
        <p>홈의 조회순은 최근 30일간의 상세보기 열람을, 주요 지역 데이터는 데이터 지도에서 주 분석 자료로 선택한 횟수를 기준으로 합니다. 같은 브라우저 세션에서 30분 이내 반복한 열람은 한 번만 집계합니다.</p>
        <p>최신순은 자료 파일이 플랫폼에 갱신된 날짜를 기준으로 합니다. 통계의 기준연도나 기후전망의 대상연도와는 다릅니다. 갱신일이 같은 자료는 데이터명 순으로 표시합니다.</p>
        <details><summary>이용 집계에 사용하는 정보</summary>
          <p>자료 식별번호와 열람 유형별 일일 합계를 최대 31일 보관합니다. 이름·연락처·검색어·정확한 위치는 수집하지 않습니다. 임의의 브라우저 세션 식별값은 반복 조회를 구분하는 데만 사용하며, 서버의 중복 확인값은 30분 후 만료됩니다. 과도한 요청을 막기 위한 접속주소는 원문을 저장하지 않고 하루마다 달라지는 값으로 변환해 최대 1분 동안 사용합니다.</p>
          <p>브라우저의 추적 금지(DNT) 또는 개인정보 보호 신호(GPC)가 활성화되어 있거나 세션 저장을 사용할 수 없으면 조회를 집계하지 않습니다. 서버 운영에 필요한 접속 로그는 이 조회 집계와 별도로 호스팅 서비스 정책을 따릅니다.</p>
        </details>
      </section>
      <nav className="data-guide-v128__toc" aria-label="이용안내 목차">
        <button type="button" onClick={() => scrollToSection("guide-usage")}>조회순·최신순</button>
        <button type="button" onClick={() => scrollToSection("guide-scope")}>
          제공 범위
        </button>
        <button type="button" onClick={() => scrollToSection("guide-status")}>
          데이터 상태
        </button>
        <button type="button" onClick={() => scrollToSection("guide-period")}>
          자료기간
        </button>
        <button type="button" onClick={() => scrollToSection("guide-missing")}>
          결측값
        </button>
        <button type="button" onClick={() => scrollToSection("guide-download")}>
          다운로드
        </button>
        <button type="button" onClick={() => scrollToSection("guide-map")}>
          지도 이용
        </button>
        <button
          type="button"
          onClick={() => scrollToSection("guide-glossary")}
        >
          용어·약어
        </button>
      </nav>

      <div className="data-guide-v128__grid">
        <section id="guide-scope">
          <h2>데이터 제공 범위</h2>
          <p>
            현재 베트남 데이터를 제공합니다. 정책·제도, 에너지,
            온실가스, 산림·토지, 기후사업·재원, 연구·협력기관 자료를 데이터
            항목 단위로 확인할 수 있습니다.
          </p>
        </section>

        <section id="guide-status">
          <h2>데이터 상태의 의미</h2>
          <dl>
            <div>
              <dt>데이터 제공</dt>
              <dd>공개된 관측값 또는 목록을 화면에서 확인할 수 있습니다.</dd>
            </div>
            <div>
              <dt>일부 데이터 제공</dt>
              <dd>일부 기간이나 분류에 값이 있으며, 범위의 한계를 함께 표시합니다.</dd>
            </div>
            <div>
              <dt>값이 없는 데이터</dt>
              <dd>
                입력 양식, 입력 예정, 원자료 미수집으로 표시된 데이터는 현재
                화면에서 확인할 값이 없습니다.
              </dd>
            </div>
          </dl>
        </section>

        <section id="guide-period">
          <h2>자료기간의 의미</h2>
          <p>
            기준연도는 해당 값이나 목록이 설명하는 시점을 뜻합니다. 여러 해의
            값이 있는 데이터는 자료기간을 표시하고, 미래 연도가 있으면 전망임을
            함께 적습니다. 자료 갱신일(출처 확인일)과 값의 기준연도는 서로 다를 수
            있으며, 자료 정리 기준일을 모든 통계의 기준연도로 읽지 않습니다.
          </p>
        </section>

        <section id="guide-missing">
          <h2>결측값 처리원칙</h2>
          <p>
            원천에 없는 값은 0으로 임의 대체하지 않습니다. 값이 제공되지 않은
            기간·지역·분류는 빈 값 또는 결측으로 구분하고, 해석에 중요한 공백은
            각 데이터의 유의사항에 설명합니다.
          </p>
        </section>

        <section id="guide-download">
          <h2>다운로드 가능 여부</h2>
          <p>
            다운로드 가능 표시는 재사용 가능한 공개 파일이 있다는 뜻입니다.
            일부 데이터는 이용조건에 따라 화면에서만 제공하며, 실제 입력값이
            없는 항목에는 다운로드 자료가 없습니다.
          </p>
        </section>

        <section>
          <h2>출처·이용조건</h2>
          <p>
            각 상세화면에서 제공기관, 공식 원문, 출처표시와 이용조건을
            확인할 수 있습니다. 데이터를 재사용할 때에는 해당 항목에 표시된
            출처와 이용조건을 함께 확인해 주세요.
          </p>
        </section>

        <section id="guide-map">
          <h2>지도 이용 시 참고사항</h2>
          <p>
            지도의 경계선은 2025-07-01 시행 34개 성·시가 기본이며, 개편 전
            63개 성·시로 바꿔 볼 수 있습니다. 지역별 자료 값은 원자료가 발표한
            개편 전 63개 성·시 기준 그대로이며 34개로 합산하지 않습니다. 결측
            지역을 0으로 표시하지 않습니다. 송전망 위치는 국가 단위 분포
            확인용이며 정밀 설계나 시설 경계 판정에는 적합하지 않습니다.
          </p>
        </section>

        <section>
          <h2>데이터 기준일</h2>
          <p>
            현재 공개된 데이터의 기준일은 <strong>{releaseDate}</strong>입니다.
          </p>
        </section>

        <section
          className="data-guide-v134__glossary"
          data-v134-glossary-directory
          id="guide-glossary"
        >
          <div className="data-guide-v134__glossary-heading">
            <div>
              <h2>용어·약어</h2>
              <p>
                플랫폼의 개발협력·기후·에너지 용어와 단위를
                한국어·영어 명칭과 함께 확인할 수 있습니다.
              </p>
            </div>
            <span aria-live="polite">
              {visibleGlossary.length.toLocaleString("ko-KR")}개 용어
            </span>
          </div>

          <div className="data-guide-v134__glossary-search">
            <label htmlFor="guide-glossary-search">용어 검색</label>
            <div>
              <input
                autoComplete="off"
                id="guide-glossary-search"
                onChange={(event) => setGlossaryQuery(event.target.value)}
                placeholder="ODA, SPEI12, SSP2-4.5, GVI, NDC 검색"
                type="search"
                value={glossaryQuery}
              />
              {glossaryQuery && (
                <button type="button" onClick={() => setGlossaryQuery("")}>
                  검색어 지우기
                </button>
              )}
            </div>
          </div>

          {visibleGlossary.length > 0 ? (
            <ul className="data-guide-v134__glossary-list">
              {visibleGlossary.map((entry) => (
                <li
                  key={entry.id}
                  data-glossary-id={entry.id}
                  data-glossary-term={entry.term}
                >
                  <div className="data-guide-v134__glossary-term">
                    <strong>{entry.term}</strong>
                    <span>{entry.koreanName}</span>
                  </div>
                  <span className="data-guide-v134__glossary-english">
                    {entry.englishName}
                  </span>
                  <p>{entry.definition}</p>
                  {entry.id === "spei" && (
                    <small>
                      지원 패턴: SPEI3 · SPEI6 · SPEI12 (누적기간
                      3·6·12개월)
                    </small>
                  )}
                  {entry.id === "ssp" && (
                    <small>
                      지원 예시: SSP1-2.6 · SSP2-4.5 · SSP3-7.0 ·
                      SSP5-8.5
                    </small>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <div className="data-guide-v134__glossary-empty" role="status">
              <strong>검색 결과가 없습니다.</strong>
              <p>약어, 한국어 명칭 또는 영어 명칭으로 다시 검색해 보세요.</p>
            </div>
          )}

          <p className="data-guide-v134__glossary-example">
            화면에서는{" "}
            <PublicTermTextV134 text="ODA, SPEI12, SSP2-4.5, GVI, MW" />
            처럼 점선이 표시된 용어에 마우스를 올리거나 키보드로
            초점을 이동하면 설명을 볼 수 있습니다. 모바일에서는 용어를
            눌러 고정합니다.
          </p>
        </section>

        <section className="data-guide-v128__contact">
          <h2>문의 또는 오류 제보</h2>
          <p>
            데이터명, 화면 주소, 확인한 값과 문제 상황을 함께 보내 주시면 확인에
            도움이 됩니다.
          </p>
          {SERVICE_LINKS.contactEmail ? (
            <a href={`mailto:${SERVICE_LINKS.contactEmail}`}>
              이메일로 문의하기
            </a>
          ) : (
            <p>문의 연락처는 운영기관 안내를 확인해 주세요.</p>
          )}
        </section>
      </div>

      <div className="data-guide-v128__actions">
        <button
          type="button"
          className="primary-button"
          onClick={() => onNavigate("explorer")}
        >
          데이터 찾기
        </button>
        <button
          type="button"
          className="secondary-button"
          onClick={() => onNavigate("download")}
        >
          데이터 다운로드
        </button>
      </div>
    </div>
  );
}
