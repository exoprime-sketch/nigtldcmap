import type { VietnamDemoElement } from "../../types/vietnamDemo";
import { openExternalUrl } from "../../utils/browser";
import { getCountryDataScope } from "../../utils/countryDataScopeV60";
import { getFinalDisplayTitle } from "../../utils/dataPreviewV53";
import { PUBLIC_DETAIL_COPY_INDEX_V119 } from "../../data/cooperation/publicDetailCopyV119";
import { CompactDetailGuidanceV119 } from "./PublicDetailContextV119";
import "../../styles/public-trust-v92.css";
import "../../styles/public-detail-v119.css";

interface PendingElementStateV92Props {
  element: VietnamDemoElement;
  countryName: string;
}

export default function PendingElementStateV92({
  element,
  countryName,
}: PendingElementStateV92Props) {
  const scope = getCountryDataScope(element.elementId);
  const contextLabel = scope === "korea_common" ? "한국 공통자료" : countryName;
  const sourceLabel =
    element.sourceDatabase || element.effectiveSource || "출처 확인 중";
  const publicCopy = PUBLIC_DETAIL_COPY_INDEX_V119.get(element.elementId);

  return (
    <section className="v92-pending-state" aria-labelledby="v92-pending-title">
      <header className="v92-pending-header">
        <div>
          <span className="v92-pending-eyebrow">{contextLabel}</span>
          <h1 id="v92-pending-title">{getFinalDisplayTitle(element)}</h1>
          <p>
            {publicCopy?.publicQuestion ?? element.presentation.userQuestion}
          </p>
        </div>
        <span className="v92-pending-status">데이터 준비 중</span>
      </header>

      <div className="v119-pending-summary">
        <div>
          <span>예정 출처</span>
          <strong>{sourceLabel}</strong>
        </div>
        <div>
          <span>제공 예정 정보</span>
          <strong>
            {publicCopy?.expectedInformation ??
              "국가별 값 · 실제 자료연도 · 비교 · 원자료"}
          </strong>
        </div>
      </div>

      {publicCopy?.showUseNote || publicCopy?.showCaution ? (
        <div className="v119-pending-note">
          <CompactDetailGuidanceV119 elementId={element.elementId} />
        </div>
      ) : null}

      {element.sourceUrl ? (
        <div className="v104-source-row">
          <div className="v104-source-copy">
            <span>자료 제공 예정기관</span>
            <b>{sourceLabel}</b>
          </div>
          <button
            type="button"
            className="secondary-button v104-source-button"
            onClick={() => openExternalUrl(element.sourceUrl || "")}
          >
            원자료 확인 ↗
          </button>
        </div>
      ) : null}
    </section>
  );
}
