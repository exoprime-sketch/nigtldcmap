import { useEffect, useState } from "react";

/**
 * V160-D: the open state of the detail screen's collapsed layers, shared by
 * every place that shows or toggles a layer - the layer's own <details>, the
 * "차트 더 보기" toggle under the first chart (the analysis blocks after
 * rank 1 belong to layer 2), and a ranked list's middle rows.
 *
 * - Remembered globally in localStorage (one entry per layer number, shared
 *   by every dataset), per the plan.
 * - `detailLayers=all` in the URL opens everything on arrival: the audits
 *   read the screen with every layer open (the V159 layout), the way they
 *   read the finder with `tier=all`; the default collapsed state is checked
 *   by qa-core-first-v160.
 * - A toggle in this page view wins over both, until the page reloads.
 */

const STORAGE_KEY_V160 = "detail-layers-v160";
export const DETAIL_LAYERS_PARAM_V160 = "detailLayers";

type Listener = () => void;
const listeners = new Set<Listener>();
const overrides = new Map<string, boolean>();

function storageV160(): Storage | null {
  try {
    return typeof window === "undefined" ? null : window.localStorage;
  } catch {
    return null;
  }
}

function readStoredV160(): Record<string, boolean> {
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

/** True when the URL asks for every layer open (`detailLayers=all`). */
export function allDetailLayersOpenV160(): boolean {
  try {
    return typeof window !== "undefined" && new URLSearchParams(window.location.search).get(DETAIL_LAYERS_PARAM_V160) === "all";
  } catch {
    return false;
  }
}

export function isDetailLayerOpenV160(key: string): boolean {
  if (overrides.has(key)) return overrides.get(key) === true;
  return allDetailLayersOpenV160() || readStoredV160()[key] === true;
}

/** Record a reader's toggle; `remember` stores it for the next dataset too. */
export function setDetailLayerOpenV160(key: string, open: boolean, remember = true): void {
  overrides.set(key, open);
  if (remember) {
    const store = storageV160();
    if (store) {
      try {
        const current = readStoredV160();
        current[key] = open;
        store.setItem(STORAGE_KEY_V160, JSON.stringify(current));
      } catch {
        // Best-effort remembering; the in-page state still applies.
      }
    }
  }
  listeners.forEach((listener) => listener());
}

/** Test hook: forget in-page toggles. */
export function resetDetailLayerOverridesV160(): void {
  overrides.clear();
}

export function useDetailLayerOpenV160(key: string): boolean {
  const [open, setOpen] = useState<boolean>(() => isDetailLayerOpenV160(key));
  useEffect(() => {
    const listener = () => setOpen(isDetailLayerOpenV160(key));
    listener();
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }, [key]);
  return open;
}
