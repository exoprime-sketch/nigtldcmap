import { useEffect, useMemo, useState } from "react";
import { PRIORITY_COUNTRIES } from "../../data/priorityCountries";
import {
  COOPERATION_POLICY_EVIDENCE_V109,
  COOPERATION_POLICY_KIND_META_V109,
  getCooperationPolicyEvidenceV109,
  getCooperationPolicyKindV109,
} from "../../data/policy/cooperationPolicyEvidenceV109";
import { openExternalUrl } from "../../utils/browser";
import "../../styles/policy-evidence-v109.css";

interface CooperationPolicyEvidenceV109Props {
  datasetId: string;
  initialCountryIso3?: string | null;
}

export default function CooperationPolicyEvidenceV109({
  datasetId,
  initialCountryIso3 = null,
}: CooperationPolicyEvidenceV109Props) {
  const kind = getCooperationPolicyKindV109(datasetId);
  const [countryIso3, setCountryIso3] = useState(initialCountryIso3 ?? "VNM");

  useEffect(() => {
    if (initialCountryIso3) setCountryIso3(initialCountryIso3);
  }, [initialCountryIso3, datasetId]);

  const meta = kind ? COOPERATION_POLICY_KIND_META_V109[kind] : null;
  const record = useMemo(
    () => getCooperationPolicyEvidenceV109(datasetId, countryIso3),
    [datasetId, countryIso3]
  );

  if (!kind || !meta) return null;

  const availableCount = COOPERATION_POLICY_EVIDENCE_V109.filter(
    (item) => item.kind === kind && item.status === "available"
  ).length;

  if (!record) {
    return (
      <section className="v109-policy-evidence">
        <div className="v109-policy-empty">
          현재 플랫폼에 해당 국가의 정책자료가 수록되지 않았습니다.
        </div>
      </section>
    );
  }

  const statusClass =
    record.status === "available"
      ? "available"
      : record.status === "related_record_only"
      ? "related"
      : "not-found";

  return (
    <section
      className="v109-policy-evidence"
      aria-label={`${meta.labelKo} 공식 근거`}
    >
      <div className="v109-policy-heading">
        <div>
          <span className="v109-policy-kicker">공식 정책문서</span>
          <h3>{meta.titleKo}</h3>
          <p>
            10개 우선국의 공식 제출 문서와 기본정보를 제공합니다. 기술·재원·배출
            등 세부 내용은 공식 문서에서 확인된 항목부터 순차적으로 제공합니다.
          </p>
        </div>
        <div className="v109-policy-count">
          <strong>{availableCount}/10</strong>
          <span>공식 문서 확인</span>
        </div>
      </div>

      <div className="v109-policy-controls">
        <label>
          <span>국가</span>
          <select
            value={countryIso3}
            onChange={(event) => setCountryIso3(event.target.value)}
            aria-label={`${meta.labelKo} 국가 선택`}
          >
            {PRIORITY_COUNTRIES.map((country) => (
              <option key={country.iso3} value={country.iso3}>
                {country.nameKo} · {country.iso3}
              </option>
            ))}
          </select>
        </label>
        <span className={`v109-policy-status ${statusClass}`}>
          {record.statusLabelKo}
        </span>
      </div>

      <div className="v109-policy-summary">
        <strong>{record.countryNameKo}</strong>
        <p>{record.evidenceSummaryKo}</p>
      </div>

      <dl className="v109-policy-metadata">
        <div>
          <dt>문서</dt>
          <dd>{record.documentTitle ?? "공식 제출목록에서 문서 확인 필요"}</dd>
        </div>
        <div>
          <dt>제출·기준시점</dt>
          <dd>
            {record.submissionDate ??
              (record.documentYear
                ? `${record.documentYear}년`
                : "공식목록 확인 기준")}
          </dd>
        </div>
        <div>
          <dt>출처 확인</dt>
          <dd>{record.sourceAsOf}</dd>
        </div>
      </dl>

      <div className="v109-policy-grid">
        <section>
          <h4>국제협력 검토에 활용</h4>
          <ul>
            {meta.cooperationUseKo.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>
        <section>
          <h4>추가 확인 항목</h4>
          <ul>
            {meta.nextExtractionKo.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>
      </div>

      {record.notes.length > 0 && (
        <div className="v109-policy-notes">
          <strong>해석 유의사항</strong>
          <ul>
            {record.notes.map((note) => (
              <li key={note}>{note}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="v109-policy-actions">
        {record.documentUrl && (
          <button
            type="button"
            className="primary-button"
            onClick={() => openExternalUrl(record.documentUrl!)}
          >
            공식 문서 보기 ↗
          </button>
        )}
        <button
          type="button"
          className="secondary-button"
          onClick={() => openExternalUrl(record.portalUrl)}
        >
          UNFCCC 공식 목록 확인 ↗
        </button>
      </div>

      <p className="v109-policy-scope">
        제공 범위: 제출 여부, 문서명, 제출시점, 공식 문서 링크. 세부 수치와
        기술·재원 정보는 확인된 항목부터 순차적으로 추가됩니다.
      </p>
    </section>
  );
}
