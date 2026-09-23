import type { ReactNode } from "react";
import TemplateShellV159 from "./TemplateShellV159";
import type { TemplateContextV159 } from "./TemplateShellV159";

/**
 * V159 ⑥ 제도·규제·리스크: Rules, support, procedures and risk: grouped documents and the timeline; no numeric chart unless the row is an index or checklist score.
 *
 * The body is the variant component the template owns (templateVariantsV159)
 * or the generic body chosen by the data's shape; the template adds the
 * shared technology filter.
 */
interface Props {
  context: TemplateContextV159;
  children: ReactNode;
}

export default function U6PolicyV159({ context, children }: Props) {
  return <TemplateShellV159 context={context}>{children}</TemplateShellV159>;
}
