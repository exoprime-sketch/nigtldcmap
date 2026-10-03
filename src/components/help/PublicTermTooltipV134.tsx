import { forwardRef } from "react";
import type { CSSProperties, PointerEventHandler } from "react";
import type { ResolvedPublicTermV134 } from "../../utils/publicTermTokenizerV134";
import { sentencesForCountryV162 } from "../../data/countries/countryCopyV158";
import { usePageDataCountryV162 } from "../../data/countries/DataCountryContextV158";

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
  const pageCountry = usePageDataCountryV162();
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
      {/* V162 PR-D: a sentence about another country is left out of its definition. */}
      {sentencesForCountryV162(entry.definition, pageCountry) ? <p>{sentencesForCountryV162(entry.definition, pageCountry)}</p> : null}
    </div>
  );
});

export default PublicTermTooltipV134;
