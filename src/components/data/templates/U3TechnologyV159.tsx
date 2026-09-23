import type { ReactNode } from "react";
import TemplateShellV159 from "./TemplateShellV159";
import type { TemplateContextV159 } from "./TemplateShellV159";

/**
 * V159 ③ 기술별 비교: Which climate technologies stand out: the technology ranking first; the technology filter is most useful here.
 *
 * The body is the variant component the template owns (templateVariantsV159)
 * or the generic body chosen by the data's shape; the template adds the
 * shared technology filter.
 */
interface Props {
  context: TemplateContextV159;
  children: ReactNode;
}

export default function U3TechnologyV159({ context, children }: Props) {
  return <TemplateShellV159 context={context}>{children}</TemplateShellV159>;
}
