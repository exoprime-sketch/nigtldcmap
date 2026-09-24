import { useId, useState } from "react";
import type { DatasetSpecRowV159, UseCaseDataRefV159, UseCaseV159 } from "../../../data/spec/specTypesV159";
import { PublicTermExpandedTextV134, PublicTermTextV134 } from "../../help/PublicTermV134";
import "./data-description-v159.css";

export interface DataDescriptionV159Props {
  spec: DatasetSpecRowV159 | null;
  cases: UseCaseV159[];
  availableIndicatorIds: ReadonlySet<string>;
  onHighlightIndicators?: (ids: string[]) => void;
}

/**
 * The ids a '쓰는 데이터' chip stands for.
 *
 * A `prefix` reference (e.g. "B-021_gvi_subnational_") is not itself a chart
 * series id; `catalogIndicatorIds` lists the real ones it groups. Everything
 * else — `exact`, `unmapped` — is checked (and highlighted) by its own id.
 */
function chipIndicatorIdsV159(ref: UseCaseDataRefV159): string[] {
  if (ref.catalogIndicatorIds && ref.catalogIndicatorIds.length > 0) return ref.catalogIndicatorIds;
  return ref.indicatorId ? [ref.indicatorId] : [];
}

interface DataUsedChipV159Props {
  chipKey: string;
  reference: UseCaseDataRefV159;
  availableIndicatorIds: ReadonlySet<string>;
  pressed: boolean;
  onToggle: (chipKey: string, ids: string[]) => void;
}

function DataUsedChipV159({ chipKey, reference, availableIndicatorIds, pressed, onToggle }: DataUsedChipV159Props) {
  // A label-only reference names an attribute the platform does not carry as
  // its own indicator (e.g. a registry flag column); it is not clickable.
  if (reference.mapped === "label-only" || !reference.indicatorId) {
    return (
      <span className="dd159-chip dd159-chip--label">
        <PublicTermTextV134 text={reference.label} />
      </span>
    );
  }
  const ids = chipIndicatorIdsV159(reference);
  const available = ids.some((id) => availableIndicatorIds.has(id));
  return (
    // Without a series of its own in the first chart the chip has nothing to
    // point at: it stays focusable but inert and says so (V159).
    <button
      aria-disabled={available ? undefined : true}
      aria-pressed={available ? pressed : undefined}
      className={available ? "dd159-chip" : "dd159-chip dd159-chip--inert"}
      data-indicator-id={reference.indicatorId}
      onClick={available ? () => onToggle(chipKey, ids) : undefined}
      title={available ? undefined : "이 화면에는 계열 강조가 없습니다"}
      type="button"
    >
      {/* A help trigger cannot sit inside this button, so glossary terms expand in place instead (V153 pattern). */}
      <PublicTermExpandedTextV134 text={reference.label} />
    </button>
  );
}

interface UseCaseCardV159Props {
  caseItem: UseCaseV159;
  availableIndicatorIds: ReadonlySet<string>;
  activeChipKey: string | null;
  onToggleChip: (chipKey: string, ids: string[]) => void;
}

function UseCaseCardV159({ caseItem, availableIndicatorIds, activeChipKey, onToggleChip }: UseCaseCardV159Props) {
  const cautionDiffers = caseItem.caution !== caseItem.cautionDisplay;
  return (
    <article
      className="dd159-case"
      data-case-no={caseItem.caseNo}
      data-testid="use-case-card-v159"
      data-verified={caseItem.verified}
    >
      <h4 className="dd159-case-heading">
        <PublicTermTextV134 text={caseItem.purpose} />
        <small className="dd159-case-en">{caseItem.purposeEn}</small>
        {caseItem.verified === "pending" && <span className="dd159-badge-pending">검증 대기</span>}
      </h4>
      <div className="dd159-case-body">
        <p className="dd159-case-field">
          <span className="dd159-case-field-label">논리 구조</span>
          <PublicTermTextV134 text={caseItem.logic} />
        </p>
        <div className="dd159-case-field">
          <span className="dd159-case-field-label">쓰는 데이터</span>
          <ul className="dd159-chip-list">
            {caseItem.dataUsed.map((reference, index) => {
              const chipKey = `${caseItem.elementId}-${caseItem.caseNo}-${index}`;
              return (
                <li key={chipKey}>
                  <DataUsedChipV159
                    availableIndicatorIds={availableIndicatorIds}
                    chipKey={chipKey}
                    onToggle={onToggleChip}
                    pressed={activeChipKey === chipKey}
                    reference={reference}
                  />
                </li>
              );
            })}
          </ul>
        </div>
        <blockquote className="dd159-storyline">
          <PublicTermTextV134 text={caseItem.storyline} />
        </blockquote>
        <div className="dd159-case-field">
          <span className="dd159-case-field-label">주 사용자</span>
          <ul className="dd159-chip-list">
            {caseItem.users.map((user) => (
              <li key={user}>
                <span className="dd159-chip dd159-chip--label">{user}</span>
              </li>
            ))}
          </ul>
        </div>
        <p className="dd159-case-field dd159-caution">
          <span className="dd159-case-field-label">유의점</span>
          {cautionDiffers ? (
            <span data-caution-original={caseItem.caution} title={caseItem.caution}>
              <PublicTermTextV134 text={caseItem.cautionDisplay} />
            </span>
          ) : (
            <PublicTermTextV134 text={caseItem.cautionDisplay} />
          )}
        </p>
      </div>
    </article>
  );
}

/** '데이터 설명': 상세 설명 / 활용 방법 (always open) + 활용 사례 N건 (disclosure, hidden when N=0). */
export default function DataDescriptionV159({
  spec,
  cases,
  availableIndicatorIds,
  onHighlightIndicators,
}: DataDescriptionV159Props) {
  const casesRegionId = `dd159-cases-${useId().replace(/:/g, "")}`;
  const [casesOpen, setCasesOpen] = useState(false);
  const [activeChipKey, setActiveChipKey] = useState<string | null>(null);

  if (!spec) return null;

  const handleToggleChip = (chipKey: string, ids: string[]) => {
    if (activeChipKey === chipKey) {
      setActiveChipKey(null);
      onHighlightIndicators?.([]);
    } else {
      setActiveChipKey(chipKey);
      onHighlightIndicators?.(ids);
    }
  };

  return (
    <section
      // V160: the section's own "데이터 설명" heading is now the enclosing
      // DetailLayerV160's <summary> (layer 2), so it is not repeated here.
      aria-label="데이터 설명"
      className="dd159"
      data-dd159-cases={cases.length}
      data-testid="data-description-v159"
    >
      <div className="dd159-part" data-dd159-part="description">
        <h3>상세 설명</h3>
        <p>
          <PublicTermTextV134 text={spec.description} />
        </p>
      </div>
      <div className="dd159-part" data-dd159-part="usage">
        <h3>활용 방법</h3>
        <p>
          <PublicTermTextV134 text={spec.usage} />
        </p>
      </div>
      {cases.length > 0 && (
        <div className="dd159-part" data-dd159-part="cases">
          <h3>
            <button
              aria-controls={casesRegionId}
              aria-expanded={casesOpen}
              className="dd159-cases-toggle"
              onClick={() => setCasesOpen((open) => !open)}
              type="button"
            >
              활용 사례 {cases.length}건
            </button>
          </h3>
          <div className="dd159-cases-region" hidden={!casesOpen} id={casesRegionId}>
            {cases.map((caseItem) => (
              <UseCaseCardV159
                activeChipKey={activeChipKey}
                availableIndicatorIds={availableIndicatorIds}
                caseItem={caseItem}
                key={`${caseItem.elementId}-${caseItem.caseNo}`}
                onToggleChip={handleToggleChip}
              />
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
