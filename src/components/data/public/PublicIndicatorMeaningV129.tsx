import { getPublicIndicatorInterpretationV129 } from "../../../data/interpretation/publicIndicatorInterpretationV129";
import { PublicTermTextV134 } from "../../help/PublicTermV134";
import "./public-indicator-meaning-v129.css";

interface Props {
  elementId: string;
  variableKey?: string | null;
  indicatorId?: string | null;
  variant?: "detail" | "panel" | "tooltip";
  className?: string;
}

export default function PublicIndicatorMeaningV129({
  elementId,
  variableKey,
  indicatorId,
  variant = "detail",
  className = "",
}: Props) {
  const interpretation = getPublicIndicatorInterpretationV129(
    elementId,
    variableKey,
    indicatorId
  );
  if (!interpretation?.explanationRequired) return null;

  const bulletLimit = variant === "tooltip" ? 2 : 4;
  const bullets = interpretation.meaningBullets.slice(0, bulletLimit);
  const comparison = [
    interpretation.aggregationLevel,
    interpretation.aggregationNotice,
  ]
    .filter(Boolean)
    .join(" · ");
  const scale = interpretation.scale
    ? `${formatScaleValue(interpretation.scale.minimum)}(${interpretation.scale.minimumLabel})–${formatScaleValue(interpretation.scale.maximum)}(${interpretation.scale.maximumLabel})`
    : null;

  if (variant === "tooltip") {
    return (
      <div
        className={`pim129 pim129--tooltip ${className}`.trim()}
        data-testid="public-indicator-meaning-v129"
      >
        <strong><PublicTermTextV134 text={interpretation.publicName} /></strong>
        {interpretation.publicUnit ? <span><PublicTermTextV134 text={interpretation.publicUnit} /></span> : null}
        {bullets.map((bullet) => (
          <p key={bullet}><PublicTermTextV134 text={bullet} /></p>
        ))}
      </div>
    );
  }

  return (
    <section
      className={`pim129 pim129--${variant} ${className}`.trim()}
      aria-labelledby={`public-indicator-meaning-${elementId}`}
      data-testid="public-indicator-meaning-v129"
    >
      <header className="pim129__header">
        <span aria-hidden="true">i</span>
        <div>
          <h3 id={`public-indicator-meaning-${elementId}`}>지표 읽는 법</h3>
          <p><PublicTermTextV134 text={interpretation.publicName} /></p>
        </div>
      </header>

      <ul className="pim129__bullets">
        {bullets.map((bullet) => (
          <li key={bullet}><PublicTermTextV134 text={bullet} /></li>
        ))}
      </ul>

      <dl className="pim129__facts">
        {interpretation.publicUnit ? (
          <div>
            <dt>단위</dt>
            <dd><PublicTermTextV134 text={interpretation.publicUnit} /></dd>
          </div>
        ) : null}
        {scale ? (
          <div>
            <dt>척도</dt>
            <dd>{scale}</dd>
          </div>
        ) : null}
        <div>
          <dt>높고 낮음의 의미</dt>
          <dd><PublicTermTextV134 text={interpretation.directionLabel} /></dd>
        </div>
        {comparison ? (
          <div>
            <dt>비교·공간단위</dt>
            <dd><PublicTermTextV134 text={comparison} /></dd>
          </div>
        ) : null}
      </dl>
    </section>
  );
}

function formatScaleValue(value: number): string {
  return new Intl.NumberFormat("ko-KR", { maximumFractionDigits: 2 }).format(
    value
  );
}
