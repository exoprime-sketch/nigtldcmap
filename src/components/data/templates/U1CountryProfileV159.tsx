import type { ReactNode } from "react";
import TemplateShellV159 from "./TemplateShellV159";
import type { TemplateContextV159 } from "./TemplateShellV159";

/**
 * V159 ① 국가 수준·추세: A country's level, composition and direction: the series first, then the latest composition and the table.
 *
 * The body is the variant component the template owns (templateVariantsV159)
 * or the generic body chosen by the data's shape; the template adds the
 * shared technology filter.
 */
interface Props {
  context: TemplateContextV159;
  children: ReactNode;
}

export default function U1CountryProfileV159({ context, children }: Props) {
  return <TemplateShellV159 context={context}>{children}</TemplateShellV159>;
}
