import type { ReactNode } from "react";
import type { TypologyRowV159 } from "../../../data/spec/specTypesV159";
import TechFilterV159 from "./TechFilterV159";
import type { TechOptionV159 } from "./TechFilterV159";
import "./templates-v159.css";

/**
 * V159: what every display-type template shares - the type and structure on
 * the root (the typology QA reads them), the climate-technology filter, and
 * an optional notice line. The analysis body (the V153 frame's primary
 * section and what follows) is passed in unchanged, so the first analysis
 * block and the map slot keep their V153 order and grid.
 */
export interface TemplateContextV159 {
  typology: TypologyRowV159;
  variant: string;
  techOptions: TechOptionV159[];
  selectedTech: string;
  onTechChange: (code: string) => void;
}

interface Props {
  context: TemplateContextV159;
  notice?: ReactNode;
  children: ReactNode;
}

export default function TemplateShellV159({ context, notice, children }: Props) {
  const { typology, variant, techOptions, selectedTech, onTechChange } = context;
  return (
    <div
      className="tpl159"
      data-testid="template-v159"
      data-template={typology.displayType}
      data-structure={typology.structure}
      data-template-variant={variant}
      data-dedicated={typology.dedicated || undefined}
    >
      <TechFilterV159 options={techOptions} selected={selectedTech} onChange={onTechChange} />
      {notice ? (
        <p className="tpl159-notice" role="note" data-testid="template-notice-v159">
          {notice}
        </p>
      ) : null}
      {children}
    </div>
  );
}
