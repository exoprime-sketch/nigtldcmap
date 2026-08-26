import type { Dataset } from "../../types/dataset";
import type { VietnamDemoElement } from "../../types/vietnamDemo";
import { openExternalUrl } from "../../utils/browser";
import { toCountryNeutralQuestion } from "../../utils/dataPreviewV53";
import WorldBankPopulationUrbanizationV48 from "./WorldBankPopulationUrbanizationV48";
import CountryDataFinalPreviewV53 from "./CountryDataFinalPreviewV53";
import "../../styles/vietnam-data-specific-v48.css";

interface Props {
  element: VietnamDemoElement;
  dataset?: Dataset;
  compact?: boolean;
  countryIso3?: string;
  countryName?: string;
}

export default function VietnamDataSpecificPreviewV48({
  element,
  dataset,
  compact = false,
  countryIso3 = "VNM",
  countryName = "베트남",
}: Props) {
  const actual = element.status === "actual_connected";

  if (!actual) {
    return (
      <CountryDataFinalPreviewV53
        element={element}
        countryIso3={countryIso3}
        countryName={countryName}
      />
    );
  }

  if (element.elementId === "A-007") {
    return (
      <div className={`v48-data-specific ${compact ? "is-compact" : ""}`}>
        <WorldBankPopulationUrbanizationV48
          countryIso3={countryIso3}
          countryName={countryName}
        />
        <SourceFooter element={element} dataset={dataset} />
      </div>
    );
  }

  const profile = element.presentation;
  const hasUsefulActualSnapshot =
    Boolean(element.preview.headline) &&
    !/연결|예시/.test(element.preview.headline);

  return (
    <section
      className={`v48-data-specific is-actual ${compact ? "is-compact" : ""}`}
    >
      <header className="v48-answer-heading">
        <span>대상국 · {countryName} · 제공 중</span>
        <h3>{toCountryNeutralQuestion(profile.userQuestion)}</h3>
        <p>{profile.planningUse}</p>
      </header>

      <div className="v48-actual-status">
        <b>현재 이용 가능한 자료</b>
        <span>기준시점·출처·유의사항을 함께 확인할 수 있습니다</span>
      </div>

      {hasUsefulActualSnapshot && (
        <div className="v48-current-snapshot">
          <span>현재 확인</span>
          <strong>{element.preview.headline}</strong>
          <p>{element.preview.subheadline}</p>
        </div>
      )}

      <div className="v48-specific-layout">
        <div className="v48-primary-view">
          <div className="v48-view-title">
            <span>주요 보기</span>
            <strong>{profile.primaryViewLabel}</strong>
          </div>
          <div className="v48-generic-view">
            {profile.headlineFields.slice(0, 5).map((field) => (
              <div key={field}>
                <b>{field}</b>
                <span>현재 제공자료에서 확인</span>
              </div>
            ))}
          </div>
        </div>

        <aside className="v48-information-panel">
          <h4>주요 확인 항목</h4>
          <div className="v48-field-grid">
            {profile.headlineFields.map((field) => (
              <div key={field}>
                <span>{field}</span>
                <b>확인 가능</b>
              </div>
            ))}
          </div>
        </aside>
      </div>

      <div className="v48-caution">
        <b>해석 시 유의사항</b>
        <span>{profile.caution}</span>
      </div>

      <SourceFooter element={element} dataset={dataset} />
    </section>
  );
}

function SourceFooter({
  element,
  dataset,
}: {
  element: VietnamDemoElement;
  dataset?: Dataset;
}) {
  const sourceUrl = dataset?.sourceUrl || element.sourceUrl;
  return (
    <footer className="v48-source-footer">
      <div>
        <span>출처</span>
        <b>{element.effectiveSource || element.sourceDatabase}</b>
      </div>
      <div>
        <span>공간단위</span>
        <b>{element.spatialLevel || "국가"}</b>
      </div>
      {sourceUrl && (
        <button type="button" onClick={() => openExternalUrl(sourceUrl)}>
          원 데이터 확인 ↗
        </button>
      )}
    </footer>
  );
}
