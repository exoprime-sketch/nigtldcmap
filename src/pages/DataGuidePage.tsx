import { useEffect, useState } from "react";
import type { View } from "../app/navigation";
import { SERVICE_LINKS } from "../config/serviceLinks";
import { loadVietnamPublicOverviewV128 } from "../data/publicPlatformV128";
import "../styles/data-guide-v128.css";

interface DataGuidePageProps {
  onNavigate: (view: View) => void;
}

export default function DataGuidePage({ onNavigate }: DataGuidePageProps) {
  const [releaseDate, setReleaseDate] = useState("확인 중");

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

  function scrollToSection(id: string) {
    document.getElementById(id)?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }

  return (
    <div className="page-shell data-guide-v128" data-v128-guide>
      <header className="data-guide-v128__hero">
        <span>베트남 파일럿</span>
        <h1>데이터 이용안내</h1>
        <p>
          플랫폼에서 제공하는 데이터의 범위, 상태, 기준기간, 이용조건과
          지도자료의 해석 방법을 안내합니다.
        </p>
      </header>

      <nav className="data-guide-v128__toc" aria-label="이용안내 목차">
        <button type="button" onClick={() => scrollToSection("guide-scope")}>
          제공 범위
        </button>
        <button type="button" onClick={() => scrollToSection("guide-status")}>
          데이터 상태
        </button>
        <button type="button" onClick={() => scrollToSection("guide-period")}>
          기준기간
        </button>
        <button type="button" onClick={() => scrollToSection("guide-missing")}>
          결측값
        </button>
        <button type="button" onClick={() => scrollToSection("guide-download")}>
          다운로드
        </button>
        <button type="button" onClick={() => scrollToSection("guide-map")}>
          지도자료
        </button>
      </nav>

      <div className="data-guide-v128__grid">
        <section id="guide-scope">
          <h2>데이터 제공 범위</h2>
          <p>
            현재 베트남 파일럿 데이터를 제공합니다. 정책·제도, 에너지,
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
              <dt>입력 양식</dt>
              <dd>수집 구조만 마련되어 있고 실제 입력값은 아직 없습니다.</dd>
            </div>
            <div>
              <dt>입력 예정</dt>
              <dd>향후 입력 대상으로 정해진 데이터입니다.</dd>
            </div>
            <div>
              <dt>원자료 미수집</dt>
              <dd>현재 공개 화면에 제공할 원자료가 확보되지 않았습니다.</dd>
            </div>
          </dl>
        </section>

        <section id="guide-period">
          <h2>기준연도·기간의 의미</h2>
          <p>
            기준연도는 해당 값이나 목록이 설명하는 시점을 뜻합니다. 여러 해의
            값이 있는 데이터는 관측기간을 표시하며, 출처 확인일과 값의 기준연도는
            서로 다를 수 있습니다.
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
            각 상세화면에서 자료 제공기관, 공식 원문, 출처표시와 이용조건을
            확인할 수 있습니다. 데이터를 재사용할 때에는 해당 항목에 표시된
            출처와 이용조건을 함께 확인해 주세요.
          </p>
        </section>

        <section id="guide-map">
          <h2>지도자료의 정확도</h2>
          <p>
            지역별 자료는 개편 전 베트남 63개 성·시 경계를 기준으로 연결합니다.
            결측 지역을 0으로 표시하지 않습니다. 송전망 위치는 국가 단위 분포
            확인용이며 정밀 설계나 시설 경계 판정에는 적합하지 않습니다.
          </p>
        </section>

        <section>
          <h2>데이터 릴리스</h2>
          <p>
            현재 공개 데이터 릴리스 기준일은 <strong>{releaseDate}</strong>입니다.
            이후 보완 자료는 검증과 공개 수용검사를 거쳐 반영합니다.
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
