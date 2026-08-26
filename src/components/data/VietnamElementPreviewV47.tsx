import type { Dataset } from "../../types/dataset";
import type { VietnamDemoElement } from "../../types/vietnamDemo";
import { openExternalUrl } from "../../utils/browser";

interface VietnamElementPreviewV47Props {
  element: VietnamDemoElement;
  dataset?: Dataset;
  compact?: boolean;
}

export default function VietnamElementPreviewV47({
  element,
  dataset,
  compact = false,
}: VietnamElementPreviewV47Props) {
  const isActual = element.status === "actual_connected";

  return (
    <section
      className={`v47-element-preview ${isActual ? "is-actual" : "is-demo"} ${
        compact ? "is-compact" : ""
      }`}
      aria-label={`${element.titleShort} 화면 예시`}
    >
      <div className="v47-preview-notice">
        <span className={`v47-status ${isActual ? "actual" : "demo"}`}>
          {isActual ? "실제 데이터 제공" : "예시 데이터"}
        </span>
        <div>
          <strong>
            {isActual
              ? "현재 플랫폼에 연결된 공식·공공 자료를 기준으로 표시"
              : "아래 값과 개수는 이용방식을 보여주는 예시이며 실제 베트남 현황이 아닙니다"}
          </strong>
          <p>
            {isActual
              ? "값·기준시점·출처·유의사항을 같은 화면에서 확인"
              : "공식자료 또는 현지조사 결과가 제공되면 동일 화면에서 업데이트"}
          </p>
        </div>
      </div>

      <div className="v47-preview-grid">
        <PreviewVisual element={element} />

        <div className="v47-preview-context">
          <h3>이 자료에서 함께 확인</h3>
          <dl>
            <div>
              <dt>대상</dt>
              <dd>베트남</dd>
            </div>
            <div>
              <dt>자료</dt>
              <dd>{element.titleShort}</dd>
            </div>
            <div>
              <dt>기준 공간</dt>
              <dd>{element.spatialLevel || "실제 자료 연결 시 확정"}</dd>
            </div>
            <div>
              <dt>출처</dt>
              <dd>{element.effectiveSource || element.sourceDatabase}</dd>
            </div>
          </dl>

          {element.preview.facts.length > 0 && (
            <ul className="v47-preview-facts">
              {element.preview.facts.map((fact) => (
                <li key={fact}>{fact}</li>
              ))}
            </ul>
          )}

          {(dataset?.sourceUrl || element.sourceUrl) && (
            <button
              type="button"
              className="v47-source-button"
              onClick={() =>
                openExternalUrl(dataset?.sourceUrl || element.sourceUrl || "")
              }
            >
              원 데이터 확인 ↗
            </button>
          )}
        </div>
      </div>
    </section>
  );
}

function PreviewVisual({ element }: { element: VietnamDemoElement }) {
  const { preview, displayType } = element;

  if (
    displayType === "numeric" ||
    preview.kind === "metric" ||
    preview.kind === "api" ||
    preview.kind === "solar"
  ) {
    return (
      <div className="v47-visual-card">
        <span className="v47-visual-kicker">핵심값</span>
        <strong className="v47-metric">{preview.headline}</strong>
        <p>{preview.subheadline}</p>
        <div className="v47-bar" aria-hidden="true">
          <span />
        </div>
        <small>값·단위·기준시점·출처를 한 시야에 배치</small>
      </div>
    );
  }

  if (displayType === "time_series") {
    return (
      <div className="v47-visual-card">
        <span className="v47-visual-kicker">기간 변화</span>
        <strong>{preview.headline}</strong>
        <p>{preview.subheadline}</p>
        <svg
          className="v47-spark"
          viewBox="0 0 420 120"
          role="img"
          aria-label="시계열 표시 예시"
        >
          <polyline
            fill="none"
            stroke="currentColor"
            strokeWidth="4"
            points="4,95 62,88 120,77 178,83 236,56 294,43 352,26 416,31"
          />
        </svg>
        <small>결측구간은 값이 없는 상태로 표시</small>
      </div>
    );
  }

  if (displayType === "geospatial") {
    return (
      <div className="v47-visual-card">
        <span className="v47-visual-kicker">지도·지역</span>
        <strong>{preview.headline}</strong>
        <p>{preview.subheadline}</p>
        <div className="v47-map-mock" aria-label="지도 표시 예시">
          <i style={{ left: "61%", top: "23%" }} />
          <i style={{ left: "52%", top: "51%" }} />
          <i style={{ left: "67%", top: "72%" }} />
        </div>
        <small>위치가 확인된 자료만 지도에 표시</small>
      </div>
    );
  }

  if (displayType === "document" || displayType === "verification") {
    return (
      <div className="v47-visual-card">
        <span className="v47-visual-kicker">공식 근거</span>
        <strong>{preview.headline}</strong>
        <p>{preview.subheadline}</p>
        <div className="v47-evidence-row">
          <b>원문</b>
          <span>공식 문서의 직접 근거 발췌</span>
        </div>
        <div className="v47-evidence-row">
          <b>한국어 의미</b>
          <span>번역·요약과 원문을 구분해 제공</span>
        </div>
        <div className="v47-evidence-row">
          <b>위치</b>
          <span>페이지·절·공식 URL</span>
        </div>
      </div>
    );
  }

  if (displayType === "organization") {
    return (
      <div className="v47-visual-card">
        <span className="v47-visual-kicker">관련 기관</span>
        <strong>{preview.headline}</strong>
        <p>{preview.subheadline}</p>
        <div className="v47-list-row">
          <b>기관명</b>
          <span>공식적으로 확인된 역할 · 관련 기술 · 지역</span>
        </div>
        <div className="v47-list-row">
          <b>근거</b>
          <span>기관 공식페이지 또는 사업문서</span>
        </div>
        <small>기관 정보는 참고용이며 협력 의향을 의미하지 않습니다</small>
      </div>
    );
  }

  if (displayType === "project_finance") {
    return (
      <div className="v47-visual-card">
        <span className="v47-visual-kicker">사업·재원</span>
        <strong>{preview.headline}</strong>
        <p>{preview.subheadline}</p>
        <div className="v47-list-row">
          <b>사업 01</b>
          <span>상태 · 기관 · 대상지역 · 기간 · 재원</span>
        </div>
        <div className="v47-list-row">
          <b>사업 02</b>
          <span>원 프로젝트와 국가별 배분액을 구분</span>
        </div>
      </div>
    );
  }

  if (displayType === "permitting") {
    return (
      <div className="v47-visual-card">
        <span className="v47-visual-kicker">인허가</span>
        <strong>{preview.headline}</strong>
        <p>{preview.subheadline}</p>
        <div className="v47-permit-flow">
          {["사업조건", "환경·토지", "건축·공사", "전력·운영"].map(
            (step, index) => (
              <span key={step}>
                <b>{step}</b>
                {index < 3 && <i>→</i>}
              </span>
            )
          )}
        </div>
        <small>필수/조건부 · 담당기관 · 기간 · 비용 · 법적근거</small>
      </div>
    );
  }

  if (displayType === "categorical") {
    return (
      <div className="v47-visual-card">
        <span className="v47-visual-kicker">분류·등급</span>
        <strong>{preview.headline}</strong>
        <p>{preview.subheadline}</p>
        <div className="v47-category-scale">
          <span>낮음</span>
          <span className="active">중간</span>
          <span>높음</span>
        </div>
        <small>등급 정의·판정기준·근거를 함께 제공</small>
      </div>
    );
  }

  return (
    <div className="v47-visual-card">
      <span className="v47-visual-kicker">조사 결과</span>
      <strong>{preview.headline}</strong>
      <p>{preview.subheadline}</p>
      <div className="v47-evidence-row">
        <b>현재 확인</b>
        <span>핵심 확인내용을 항목별로 표시</span>
      </div>
      <div className="v47-evidence-row">
        <b>추가 확인</b>
        <span>현재 자료로 확인되지 않는 부분을 별도 구분</span>
      </div>
    </div>
  );
}
