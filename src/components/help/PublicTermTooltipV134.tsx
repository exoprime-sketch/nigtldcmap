import { forwardRef } from "react";
import type { CSSProperties, PointerEventHandler } from "react";
import type { ResolvedPublicTermV134 } from "../../utils/publicTermTokenizerV134";

export interface PublicTermTooltipV134Props {
  entry: ResolvedPublicTermV134;
  id: string;
  style: CSSProperties;
  onPointerEnter?: PointerEventHandler<HTMLDivElement>;
  onPointerLeave?: PointerEventHandler<HTMLDivElement>;
}

const PublicTermTooltipV134 = forwardRef<
  HTMLDivElement,
  PublicTermTooltipV134Props
>(function PublicTermTooltipV134(
  { entry, id, style, onPointerEnter, onPointerLeave },
  ref
) {
  return (
    <div
      className="public-term-tooltip-v134"
      data-public-term-tooltip-v134={entry.id}
      id={id}
      onPointerEnter={onPointerEnter}
      onPointerLeave={onPointerLeave}
      ref={ref}
      role="tooltip"
      style={style}
    >
      <strong className="public-term-tooltip-v134__term">{entry.term}</strong>
      <span className="public-term-tooltip-v134__english">
        {entry.englishName}
      </span>
      <span className="public-term-tooltip-v134__korean">
        {entry.koreanName}
      </span>
      <p>{entry.definition}</p>
    </div>
  );
});

export default PublicTermTooltipV134;
