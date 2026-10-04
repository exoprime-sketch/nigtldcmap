import type { ReactNode } from "react";
import TemplateShellV159 from "./TemplateShellV159";
import type { TemplateContextV159 } from "./TemplateShellV159";
import { useRegionWordV158 } from "../../../data/countries/countryLevel1V158";

/**
 * V159 ② 지역·입지: where in the country is favourable or at risk - the
 * choropleth and the region ranking first, the selected region's series next.
 *
 * Some ② elements were delivered with national rows only (the V159
 * alignment report lists them as data-limited); the template then says the
 * screen shows the national value instead of drawing an empty region view.
 */
interface Props {
  context: TemplateContextV159;
  /** True when the contract's first block is a national series or composition. */
  nationalOnly: boolean;
  /** True when the page draws a region map next to the national chart (V164-3). */
  hasRegionMap?: boolean;
  children: ReactNode;
}

/** The public line for a national-only ② screen (V164-3: no delivery wording). */
export function nationalOnlyNoticeV164(word: string, hasRegionMap: boolean): string {
  return hasRegionMap
    ? `이 차트는 전국 기준값입니다. ${word}별 값은 지도에서 볼 수 있습니다.`
    : `${word}별 값이 없어 전국 기준값을 보여 줍니다.`;
}

export default function U2RegionalV159({ context, nationalOnly, hasRegionMap = false, children }: Props) {
  // The page's own country's level-1 word (V158-B2b).
  const { word } = useRegionWordV158();
  return (
    <TemplateShellV159
      context={context}
      notice={nationalOnly ? nationalOnlyNoticeV164(word, hasRegionMap) : null}
    >
      {children}
    </TemplateShellV159>
  );
}
