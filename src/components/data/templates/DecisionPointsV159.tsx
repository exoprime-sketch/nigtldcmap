import type { DisplayTypeV159 } from "../../../data/spec/specTypesV159";
import type { DecisionPointV159 } from "../../../data/structure/decisionPointsV159";
import { PublicTermTextV134 } from "../../help/PublicTermV134";
import { publicTextV126 } from "../../../data/visualization/publicFieldPolicyV126";
import "./decision-points-v159.css";

interface Props {
  displayType: DisplayTypeV159;
  points: DecisionPointV159[];
}

/**
 * V159: the fixed "판단 포인트" block for a display type (spec v2 §1). The
 * caller computes `points` with `decisionPointsV159`; this component only
 * renders them, and renders nothing when the list is empty (a hidden input
 * means a hidden point, never a zero-filled one).
 *
 * Values pass through the site's public wording (raw delivery units such as
 * "USD_2017/인" read as words) and carry glossary help like any screen text.
 *
 * No `data-analysis-block` attribute here on purpose - the analysis QA gate
 * (docs/PUBLIC_CARD_ANALYSIS_CONTRACT_V140.md) counts blocks carrying that
 * attribute, and a decision-points list is a derived summary, not a chart.
 */
export default function DecisionPointsV159({ displayType, points }: Props) {
  if (points.length === 0) return null;
  return (
    <section className="dp159" data-testid="decision-points-v159" data-display-type={displayType}>
      <h3>판단 포인트</h3>
      <dl className="dp159-list">
        {points.map((point) => (
          <div className="dp159-row" key={point.key} data-testid="decision-points-v159-row" data-point-key={point.key}>
            <dt><PublicTermTextV134 text={point.label} /></dt>
            <dd>
              <PublicTermTextV134 text={publicTextV126(point.value) || point.value} />
              {point.detail ? <small><PublicTermTextV134 text={publicTextV126(point.detail) || point.detail} /></small> : null}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
