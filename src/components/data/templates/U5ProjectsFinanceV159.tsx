import type { ReactNode } from "react";
import TemplateShellV159 from "./TemplateShellV159";
import type { TemplateContextV159 } from "./TemplateShellV159";

/**
 * V159 ⑤ 사업·재원: Who does what, where and for how much: the aggregate bars and the sorted table.
 *
 * The body is the variant component the template owns (templateVariantsV159)
 * or the generic body chosen by the data's shape; the template adds the
 * shared technology filter.
 */
interface Props {
  context: TemplateContextV159;
  children: ReactNode;
}

export default function U5ProjectsFinanceV159({ context, children }: Props) {
  return <TemplateShellV159 context={context}>{children}</TemplateShellV159>;
}
