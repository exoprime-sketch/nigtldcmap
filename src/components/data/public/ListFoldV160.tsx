import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { allDetailLayersOpenV160 } from "../layers/detailLayerStoreV160";
import "./rank-fold-v160.css";

/**
 * V160: a long timeline or table-like list in the first layer opens on its
 * first `limit` items, with '전체 N건 보기' for the rest. The items are not
 * touched - the wrapper's state and a stylesheet `nth-child` rule fold them,
 * so each item's markup stays byte-identical (documentTimelineBaselineV153).
 * No height cap and no inner scroll. `detailLayers=all` (the audits' V159
 * layout) opens it.
 */
export const LIST_FOLD_LIMIT_V160 = 10;

interface Props {
  total: number;
  /** Counting word for the button ("건", "개"). */
  noun?: string;
  /** A new selection is a new list: start folded again. */
  resetKey?: unknown;
  children: ReactNode;
}

export default function ListFoldV160({ total, noun = "건", resetKey = null, children }: Props) {
  const [expanded, setExpanded] = useState<boolean>(() => allDetailLayersOpenV160());
  useEffect(() => setExpanded(allDetailLayersOpenV160()), [resetKey]);
  const foldable = total > LIST_FOLD_LIMIT_V160;
  return (
    <div className="list-fold-v160" data-v160-list-fold={foldable ? (expanded ? "open" : "closed") : "none"}>
      {children}
      {foldable ? (
        <button type="button" className="rank-fold-v160" aria-expanded={expanded} onClick={() => setExpanded((value) => !value)}>
          {expanded ? `${LIST_FOLD_LIMIT_V160}${noun}만 보기` : `전체 ${total.toLocaleString("ko-KR")}${noun} 보기`}
        </button>
      ) : null}
    </div>
  );
}
