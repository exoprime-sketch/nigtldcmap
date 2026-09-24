import { technologyLabelV121 } from "../../../utils/vietnamActualV121";
import { normalizeTechnologyIdsV153 } from "../../../utils/technologyIdV153";
import type { VietnamIndicatorMetaV124 } from "../../../data/vietnam/vietnamTypesV124";

/**
 * V159: the climate-technology filter every template shares.
 *
 * Technology ids are stated per indicator. A technology is offered only when
 * it picks out part of the element's indicators - an element whose every
 * indicator carries the same list (many policy registers tag all 38) has
 * nothing to filter, and the bar is not shown. Choosing a technology keeps
 * the rows of the indicators that carry it; nothing is inferred for rows
 * whose indicator states no technology.
 */
export interface TechOptionV159 {
  code: string;
  label: string;
  indicatorIds: string[];
}

export function technologyOptionsForIndicatorsV159(
  indicators: readonly Pick<VietnamIndicatorMetaV124, "indicatorId" | "technologyIds">[],
  presentIndicatorIds?: ReadonlySet<string>
): TechOptionV159[] {
  const scoped = indicators.filter((item) => !presentIndicatorIds || presentIndicatorIds.has(item.indicatorId));
  const byCode = new Map<string, Set<string>>();
  for (const indicator of scoped) {
    for (const code of normalizeTechnologyIdsV153(indicator.technologyIds)) {
      const set = byCode.get(code) || new Set<string>();
      set.add(indicator.indicatorId);
      byCode.set(code, set);
    }
  }
  const tagged = new Set(scoped.filter((item) => normalizeTechnologyIdsV153(item.technologyIds).length > 0).map((item) => item.indicatorId));
  return [...byCode.entries()]
    .filter(([, ids]) => ids.size > 0 && ids.size < tagged.size)
    .map(([code, ids]) => ({ code, label: technologyLabelV121(code), indicatorIds: [...ids].sort() }))
    .sort((a, b) => a.code.localeCompare(b.code));
}

interface Props {
  options: TechOptionV159[];
  selected: string;
  onChange: (code: string) => void;
}

export default function TechFilterV159({ options, selected, onChange }: Props) {
  if (options.length < 2) return null;
  return (
    <div className="tpl159-tech" data-testid="tech-filter-v159" role="group" aria-label="기후기술로 좁히기">
      <span className="tpl159-tech__label">기후기술</span>
      <button type="button" className="tpl159-chip" aria-pressed={selected === "all"} onClick={() => onChange("all")}>
        전체
      </button>
      {options.map((option) => (
        <button
          key={option.code}
          type="button"
          className="tpl159-chip"
          aria-pressed={selected === option.code}
          data-tech-code={option.code}
          onClick={() => onChange(selected === option.code ? "all" : option.code)}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
