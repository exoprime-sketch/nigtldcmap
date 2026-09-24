import type { ReactNode } from "react";
import TemplateShellV159 from "./TemplateShellV159";
import type { TemplateContextV159 } from "./TemplateShellV159";

/**
 * V159 ④ 시설·기관·인프라 위치: What is where and whom to contact: counts and sizes by class beside the map, then the labelled list.
 *
 * The body is the variant component the template owns (templateVariantsV159)
 * or the generic body chosen by the data's shape; the template adds the
 * shared technology filter.
 */
interface Props {
  context: TemplateContextV159;
  children: ReactNode;
}

export default function U4LocationsV159({ context, children }: Props) {
  return <TemplateShellV159 context={context}>{children}</TemplateShellV159>;
}
