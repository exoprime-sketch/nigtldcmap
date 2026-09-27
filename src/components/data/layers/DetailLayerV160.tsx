import type { ReactNode } from "react";
import "./detail-layer-v160.css";
import { setDetailLayerOpenV160, useDetailLayerOpenV160 } from "./detailLayerStoreV160";

/**
 * V160-D: a collapsed secondary/tertiary section of the detail screen.
 *
 * The detail page reads in three layers - layer 1 (hero, 판단 포인트, the
 * primary chart|map) stays always open; layer 2 (데이터 설명) and layer 3
 * (raw tables, download, source/APA) start collapsed. Native <details> gives
 * this for free (keyboard, print, no JS needed to show the content), and
 * content inside a closed <details> stays in the DOM, so existing testids
 * (public-raw-table, pav126-source-frame-v153, ...) are still found by the
 * audits that look for them.
 *
 * Open state is remembered globally - one localStorage entry per layer
 * number, shared by every dataset - not per element, per the plan (a reader
 * who opens 데이터 설명 once expects it open on the next dataset too). The
 * state lives in detailLayerStoreV160, so the layer-2 charts folded under the
 * first chart open and close with this layer.
 */

interface Props {
  /** Which of the two collapsed layers this is (layer 1 - hero/판단 포인트/primary chart - is never wrapped here). */
  layer: 2 | 3;
  /** Shown as the closed summary; also the layer's only heading. */
  title: string;
  children: ReactNode;
}

export default function DetailLayerV160({ layer, title, children }: Props) {
  // Shared with every other layer-N control on the page (detailLayerStoreV160).
  const open = useDetailLayerOpenV160(String(layer));
  return (
    <details
      className="dtl160"
      data-testid="detail-layer-v160"
      data-layer={String(layer)}
      open={open}
      onToggle={(event) => {
        const next = event.currentTarget.open;
        if (next !== open) setDetailLayerOpenV160(String(layer), next);
      }}
    >
      {/* details/summary already exposes expanded state to assistive tech,
          but the QA reads aria-expanded on the summary element directly. */}
      <summary aria-expanded={open}>{title}</summary>
      <div className="dtl160-body">{children}</div>
    </details>
  );
}
