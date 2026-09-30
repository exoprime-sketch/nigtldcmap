import { Fragment } from "react";

import type { MapSelectionCardV161 } from "../../data/map/mapSelectionModelV161";
import { PublicTermTextV134 } from "../help/PublicTermV134";
import "./selection-panel-v161.css";

/**
 * V161-C: the card for whatever a reader clicked on the map.
 *
 * Big map and mini map share it. The order is fixed because it is the reading
 * order the benchmarks converge on (Global Energy Monitor's facility card, Global
 * Solar Atlas's point summary, Aqueduct's basin panel): **name → its own values →
 * where it sits in the whole → what to do next**, with the layer's metadata as one
 * line at the end. The old `항목 / 값 / 단위 / 지도 표시` rows are gone.
 *
 * The component renders what the model gives it and adds nothing: a card with no
 * comparison shows no comparison, and a line the source could not fill was already
 * dropped by the model rather than shown as "미상".
 */
export interface SelectionPanelPropsV161 {
  card: MapSelectionCardV161;
  /** Called when the reader asks to zoom to the selection. */
  onZoom?: () => void;
  /** Called when the reader opens a cluster member. */
  onMemberSelect?: (member: { name: string; recordId?: string }) => void;
  compact?: boolean;
}

const KIND_LABEL_V161: Record<MapSelectionCardV161["kind"], string> = {
  facility: "시설",
  cluster: "위치 묶음",
  region: "지역",
  unit: "평가 단위",
  line: "구간",
  "asset-feature": "시설·구역",
  "project-scope": "사업 범위",
};

export default function SelectionPanelV161({
  card,
  onZoom,
  onMemberSelect,
  compact = false,
}: SelectionPanelPropsV161) {
  return (
    <div
      className={`sp161${compact ? " sp161--compact" : ""}`}
      data-testid="map-selection-card-v161"
      data-selection-kind={card.kind}
      data-member-count={card.memberCount ?? ""}
      data-member-listed={card.members?.length ?? 0}
    >
      <header className="sp161__head">
        <h4 className="sp161__title" data-testid="map-selection-title-v161">
          <PublicTermTextV134 text={card.title} />
        </h4>
        <p className="sp161__kind">
          {card.subtitle ? (
            <PublicTermTextV134 text={card.subtitle} />
          ) : (
            KIND_LABEL_V161[card.kind]
          )}
        </p>
      </header>

      {card.lines.length > 0 && (
        <ul className="sp161__lines" data-testid="map-selection-lines-v161">
          {card.lines.map((line) => (
            <li key={`${line.label}:${line.value}`}>
              <span className="sp161__label">
                <PublicTermTextV134 text={line.label} />
              </span>
              <span className="sp161__value">
                <PublicTermTextV134 text={line.value} />
              </span>
              {line.note && <span className="sp161__note">{line.note}</span>}
            </li>
          ))}
        </ul>
      )}

      {card.members && card.members.length > 0 && (
        <div className="sp161__members">
          <p className="sp161__members-title">
            구성 목록 {card.memberCount ? `· ${card.memberCount.toLocaleString()}곳` : ""}
          </p>
          <ul data-testid="map-selection-members-v161">
            {card.members.map((member) => (
              <li key={member.recordId || member.name}>
                {onMemberSelect ? (
                  <button
                    type="button"
                    className="sp161__member-button"
                    onClick={() => onMemberSelect(member)}
                  >
                    <PublicTermTextV134 text={member.name} />
                  </button>
                ) : (
                  <PublicTermTextV134 text={member.name} />
                )}
                {member.kind && <span className="sp161__member-kind">{member.kind}</span>}
                {member.size && <span className="sp161__member-size">{member.size}</span>}
              </li>
            ))}
          </ul>
        </div>
      )}

      {card.comparison.length > 0 && (
        <ul className="sp161__comparison" data-testid="map-selection-comparison-v161">
          {card.comparison.map((line) => (
            <li key={`${line.label}:${line.value}`}>
              <span className="sp161__label">{line.label}</span>
              <span className="sp161__value">{line.value}</span>
            </li>
          ))}
        </ul>
      )}

      {card.actions.length > 0 && (
        <div className="sp161__actions" data-testid="map-selection-actions-v161">
          {card.actions.map((action) => (
            <Fragment key={action.key}>
              {action.href ? (
                <a
                  className="cdp-button cdp-button--secondary cdp-button--compact"
                  href={action.href}
                  {...(/^https?:/u.test(action.href)
                    ? { target: "_blank", rel: "noreferrer" }
                    : {})}
                >
                  {action.label}
                </a>
              ) : (
                <button
                  type="button"
                  className="cdp-button cdp-button--secondary cdp-button--compact"
                  onClick={action.key === "zoom" ? onZoom : undefined}
                  disabled={action.key === "zoom" && !onZoom}
                >
                  {action.label}
                </button>
              )}
            </Fragment>
          ))}
        </div>
      )}

      {card.meta && (
        <p className="sp161__meta" data-testid="map-selection-meta-v161">
          <PublicTermTextV134 text={card.meta} />
        </p>
      )}
    </div>
  );
}
