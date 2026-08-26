import { MAP_ELEMENT_AUDIT_INDEX_V115 } from "../../data/map/mapElementAuditV115";
import {
  DATA_ELEMENT_RELATION_INDEX_V117,
  RELATED_EVIDENCE_AXIS_LABELS_V117,
  getNextRelatedElementIdsV117,
} from "../../data/cooperation/dataElementRelationsV117";
import type {
  RelatedEvidenceAxisV117,
} from "../../data/cooperation/dataElementRelationsV117";
import { PUBLIC_DETAIL_COPY_INDEX_V119 } from "../../data/cooperation/publicDetailCopyV119";
import "../../styles/public-detail-v119.css";

interface GuidanceProps {
  elementId: string;
}

interface RelatedProps {
  elementId: string;
  countryIso3: string;
  onOpenElement: (elementId: string, countryIso3: string) => void;
}

const AXIS_ORDER: RelatedEvidenceAxisV117[] = [
  "demand",
  "policy",
  "risk",
  "enabling",
  "projects",
  "finance",
  "partners",
  "koreaSupply",
];

export function CompactDetailGuidanceV119({ elementId }: GuidanceProps) {
  const copy = PUBLIC_DETAIL_COPY_INDEX_V119.get(elementId);
  if (!copy || (!copy.showUseNote && !copy.showCaution)) return null;

  return (
    <details className="v119-guidance">
      <summary>활용 참고</summary>
      <div className="v119-guidance__body">
        {copy.showUseNote && copy.compactUseNote ? (
          <p>{copy.compactUseNote}</p>
        ) : null}
        {copy.showCaution && copy.compactCaution ? (
          <p className="v119-guidance__caution">{copy.compactCaution}</p>
        ) : null}
      </div>
    </details>
  );
}

export function RelatedDataV119({
  elementId,
  countryIso3,
  onOpenElement,
}: RelatedProps) {
  const relation = DATA_ELEMENT_RELATION_INDEX_V117.get(elementId);
  if (!relation) return null;

  const next = getNextRelatedElementIdsV117(elementId, 5).filter(
    ({ elementId: id }) => MAP_ELEMENT_AUDIT_INDEX_V115.has(id)
  );
  const allRelated = AXIS_ORDER.map((axis) => ({
    axis,
    ids: relation.relatedElements[axis].filter((id) =>
      MAP_ELEMENT_AUDIT_INDEX_V115.has(id)
    ),
  })).filter((row) => row.ids.length > 0);

  if (next.length === 0 && allRelated.length === 0) return null;

  return (
    <section className="v119-related" aria-label="함께 확인할 데이터">
      <header>
        <h2>함께 확인할 데이터</h2>
      </header>

      {next.length > 0 ? (
        <div className="v119-related__cards">
          {next.map(({ elementId: relatedId, axis }) => {
            const audit = MAP_ELEMENT_AUDIT_INDEX_V115.get(relatedId);
            if (!audit) return null;
            return (
              <button
                type="button"
                key={`${axis}-${relatedId}`}
                className="v119-related-card"
                onClick={() => onOpenElement(relatedId, countryIso3)}
              >
                <span>{RELATED_EVIDENCE_AXIS_LABELS_V117[axis]}</span>
                <strong>{audit.label}</strong>
                <small>확인하기 →</small>
              </button>
            );
          })}
        </div>
      ) : null}

      {allRelated.length > 0 ? (
        <details className="v119-related__all">
          <summary>관련 데이터 더 보기</summary>
          <div className="v119-related__groups">
            {allRelated.map(({ axis, ids }) => (
              <div key={axis}>
                <strong>{RELATED_EVIDENCE_AXIS_LABELS_V117[axis]}</strong>
                <div>
                  {ids.map((relatedId) => {
                    const audit = MAP_ELEMENT_AUDIT_INDEX_V115.get(relatedId);
                    if (!audit) return null;
                    return (
                      <button
                        type="button"
                        key={relatedId}
                        onClick={() => onOpenElement(relatedId, countryIso3)}
                      >
                        {audit.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </details>
      ) : null}
    </section>
  );
}
