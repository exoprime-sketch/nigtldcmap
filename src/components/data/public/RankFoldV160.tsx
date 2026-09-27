import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import "./rank-fold-v160.css";

/**
 * V160: a regional ranking bar list opens on its top 10 and bottom 10 rows;
 * the middle rows stay in the list (hidden, not dropped) until the reader
 * asks for '전체 N개 보기'. No height cap and no inner scroll - the list
 * simply shows fewer rows. Lists of 20 rows or fewer are never folded.
 */
export const RANK_EDGE_V160 = 10;

export interface RankFoldV160 {
  /** Whether row `index` (in ranked order) is folded away right now. */
  isHidden: (index: number) => boolean;
  /** Attributes for row `index`: `hidden`, and the gap marker on the first bottom row. */
  rowProps: (index: number, keepVisible?: boolean) => { hidden?: boolean; "data-rank-gap"?: string };
  /** The '전체 보기' toggle, or null when the list is short. */
  toggle: ReactNode;
}

export function useRankFoldV160(total: number, resetKey: unknown = null, edge: number = RANK_EDGE_V160): RankFoldV160 {
  const [expanded, setExpanded] = useState(false);
  // A new measure, year or scenario is a new ranking: start folded again.
  useEffect(() => setExpanded(false), [resetKey]);
  const foldable = total > edge * 2;
  const folded = foldable && !expanded;
  const middle = total - edge * 2;
  const isHidden = (index: number) => folded && index >= edge && index < total - edge;
  return {
    isHidden,
    rowProps: (index, keepVisible = false) => {
      if (isHidden(index) && !keepVisible) return { hidden: true };
      if (folded && index === total - edge) return { "data-rank-gap": `가운데 ${middle}개 생략` };
      return {};
    },
    toggle: foldable ? (
      <button type="button" className="rank-fold-v160" aria-expanded={expanded} onClick={() => setExpanded((value) => !value)}>
        {expanded ? `상위·하위 ${edge}개만 보기` : `전체 ${total}개 보기`}
      </button>
    ) : null,
  };
}
