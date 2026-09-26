import type { ReactNode } from "react";
import TemplateShellV159 from "./TemplateShellV159";
import type { TemplateContextV159 } from "./TemplateShellV159";

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
  children: ReactNode;
}

export default function U2RegionalV159({ context, nationalOnly, children }: Props) {
  return (
    <TemplateShellV159
      context={context}
      notice={nationalOnly ? "성·시 단위 값이 납품되지 않아 전국 기준값을 보여 줍니다." : null}
    >
      {children}
    </TemplateShellV159>
  );
}
