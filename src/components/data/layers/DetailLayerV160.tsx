import { useState } from "react";
import type { ReactNode } from "react";
import "./detail-layer-v160.css";

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
 * who opens 데이터 설명 once expects it open on the next dataset too).
 */

const STORAGE_KEY_V160 = "detail-layers-v160";

function storageV160(): Storage | null {
  try {
    return typeof window === "undefined" ? null : window.localStorage;
  } catch {
    return null;
  }
}

function readLayerStateV160(): Record<string, boolean> {
  const store = storageV160();
  if (!store) return {};
  try {
    const raw = store.getItem(STORAGE_KEY_V160);
    if (!raw) return {};
    const parsed: unknown = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? (parsed as Record<string, boolean>) : {};
  } catch {
    return {};
  }
}

function writeLayerStateV160(layer: number, open: boolean): void {
  const store = storageV160();
  if (!store) return;
  try {
    const current = readLayerStateV160();
    current[String(layer)] = open;
    store.setItem(STORAGE_KEY_V160, JSON.stringify(current));
  } catch {
    // Best-effort remembering; the layer still works from React state alone.
  }
}

function isLayerOpenV160(layer: number): boolean {
  try {
    return readLayerStateV160()[String(layer)] === true;
  } catch {
    return false;
  }
}

interface Props {
  /** Which of the two collapsed layers this is (layer 1 - hero/판단 포인트/primary chart - is never wrapped here). */
  layer: 2 | 3;
  /** Shown as the closed summary; also the layer's only heading. */
  title: string;
  children: ReactNode;
}

export default function DetailLayerV160({ layer, title, children }: Props) {
  const [open, setOpen] = useState<boolean>(() => isLayerOpenV160(layer));
  return (
    <details
      className="dtl160"
      data-testid="detail-layer-v160"
      data-layer={String(layer)}
      open={open}
      onToggle={(event) => {
        const next = event.currentTarget.open;
        setOpen(next);
        writeLayerStateV160(layer, next);
      }}
    >
      {/* details/summary already exposes expanded state to assistive tech,
          but the QA reads aria-expanded on the summary element directly. */}
      <summary aria-expanded={open}>{title}</summary>
      <div className="dtl160-body">{children}</div>
    </details>
  );
}
