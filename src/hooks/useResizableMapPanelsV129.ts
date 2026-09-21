import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties, KeyboardEvent, PointerEvent } from "react";

export type ResizableMapPanelSideV129 = "left" | "right";
/** Width is constrained by available screen space, not an arbitrary maximum. */
export const MAP_PANEL_LIMITS_V129 = {
  desktopBreakpoint: 1100, separatorWidth: 12, mapMinimumWidth: 200,
  collapsedPanelWidth: 64, compactLeftWidth: 76,
  left: { defaultWidth: 320, minimum: 120, maximum: Number.MAX_SAFE_INTEGER },
  right: { defaultWidth: 360, minimum: 120, maximum: Number.MAX_SAFE_INTEGER },
} as const;
const KEYS = { left: "cdp-map-left-panel-width-v150", right: "cdp-map-right-panel-width-v150" };
function stored(side: ResizableMapPanelSideV129) {
  try { const n = Number(localStorage.getItem(KEYS[side])); return n >= 120 && Number.isFinite(n) ? n : MAP_PANEL_LIMITS_V129[side].defaultWidth; }
  catch { return MAP_PANEL_LIMITS_V129[side].defaultWidth; }
}
export function fitMapPanelsV150(width: number, left: number, right: number, leftOpen: boolean, rightOpen: boolean, priority: ResizableMapPanelSideV129 = "left") {
  const lmin = leftOpen ? 120 : 64, rmin = rightOpen ? 120 : 64;
  const available = Math.max(lmin + rmin, width - 200 - (Number(leftOpen) + Number(rightOpen)) * 12);
  let l = leftOpen ? Math.max(lmin, Math.min(left, available - rmin)) : 64;
  let r = rightOpen ? Math.max(rmin, Math.min(right, available - lmin)) : 64;
  if (l + r > available) {
    if (priority === "left") r = Math.max(rmin, available - l);
    else l = Math.max(lmin, available - r);
  }
  return { left: l, right: r };
}
interface Options { leftPanelOpen: boolean; rightPanelOpen: boolean; onMapResize?: () => void }
export function useResizableMapPanelsV129({ leftPanelOpen, rightPanelOpen, onMapResize }: Options) {
  const layoutRef = useRef<HTMLDivElement>(null);
  const [layoutWidth, setLayoutWidth] = useState(0);
  const [isDesktop, setIsDesktop] = useState(() => typeof window !== "undefined" && window.innerWidth >= 1100);
  const [widths, setWidths] = useState(() => ({ left: stored("left"), right: stored("right") }));
  const [priority, setPriority] = useState<ResizableMapPanelSideV129>("left");
  const [isResizing, setIsResizing] = useState(false);
  const drag = useRef<{ side: ResizableMapPanelSideV129; x: number; width: number } | null>(null);
  const oldUserSelect = useRef("");
  const effective = fitMapPanelsV150(layoutWidth || (typeof window !== "undefined" ? window.innerWidth : 1280), widths.left, widths.right, leftPanelOpen, rightPanelOpen, priority);
  useEffect(() => {
    const node = layoutRef.current;
    if (!node) return;
    const measure = () => { setLayoutWidth(node.getBoundingClientRect().width); setIsDesktop(window.innerWidth >= 1100); };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(node); window.addEventListener("resize", measure);
    return () => { observer.disconnect(); window.removeEventListener("resize", measure); };
  }, []);
  const setWidth = useCallback((side: ResizableMapPanelSideV129, value: number) => {
    setPriority(side);
    setWidths(current => {
      const fitted = fitMapPanelsV150(layoutWidth, side === "left" ? value : current.left, side === "right" ? value : current.right, leftPanelOpen, rightPanelOpen, side);
      return { left: leftPanelOpen ? fitted.left : current.left, right: rightPanelOpen ? fitted.right : current.right };
    });
  }, [layoutWidth, leftPanelOpen, rightPanelOpen]);
  useEffect(() => { try { localStorage.setItem(KEYS.left, String(widths.left)); localStorage.setItem(KEYS.right, String(widths.right)); } catch { /* private mode still supports resizing */ } }, [widths]);
  useEffect(() => {
    const frame = requestAnimationFrame(() => onMapResize?.());
    return () => cancelAnimationFrame(frame);
  }, [effective.left, effective.right, isDesktop, onMapResize]);
  const finish = useCallback(() => {
    if (!drag.current) return;
    drag.current = null; setIsResizing(false);
    document.body.style.userSelect = oldUserSelect.current;
    document.body.classList.remove("cdp-map-panel-resize-active");
  }, []);
  useEffect(() => {
    if (!isResizing) return;
    const move = (event: globalThis.PointerEvent) => {
      if (!drag.current) return;
      const { side, width, x } = drag.current;
      setWidth(side, width + (event.clientX - x) * (side === "left" ? 1 : -1));
    };
    window.addEventListener("pointermove", move); window.addEventListener("pointerup", finish); window.addEventListener("pointercancel", finish); window.addEventListener("blur", finish);
    return () => { window.removeEventListener("pointermove", move); window.removeEventListener("pointerup", finish); window.removeEventListener("pointercancel", finish); window.removeEventListener("blur", finish); };
  }, [finish, isResizing, setWidth]);
  useEffect(() => () => { if (drag.current) { document.body.style.userSelect = oldUserSelect.current; document.body.classList.remove("cdp-map-panel-resize-active"); } }, []);
  function bindings(side: ResizableMapPanelSideV129) {
    const open = side === "left" ? leftPanelOpen : rightPanelOpen;
    const otherOpen = side === "left" ? rightPanelOpen : leftPanelOpen;
    const maximum = Math.max(120, layoutWidth - 200 - (otherOpen ? 120 : 64) - 12 * (Number(open) + Number(otherOpen)));
    const disabled = !isDesktop || !open;
    return {
      disabled, maximum, minimum: 120, value: effective[side],
      onDoubleClick: () => { if (!disabled) setWidth(side, MAP_PANEL_LIMITS_V129[side].defaultWidth); },
      onPointerDown: (event: PointerEvent<HTMLDivElement>) => {
        if (disabled || event.button !== 0) return;
        event.preventDefault(); event.currentTarget.setPointerCapture?.(event.pointerId);
        oldUserSelect.current = document.body.style.userSelect; document.body.style.userSelect = "none";
        document.body.classList.add("cdp-map-panel-resize-active");
        drag.current = { side, x: event.clientX, width: effective[side] }; setIsResizing(true);
      },
      onKeyDown: (event: KeyboardEvent<HTMLDivElement>) => {
        if (disabled || !["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
        event.preventDefault();
        const value = event.key === "Home" ? 120 : event.key === "End" ? maximum : effective[side] + (event.shiftKey ? 40 : 10) * (event.key === "ArrowRight" ? 1 : -1) * (side === "left" ? 1 : -1);
        setWidth(side, value);
      },
    };
  }
  const layoutStyle = useMemo(() => ({
    "--cdp-map-left-panel-width": effective.left + "px", "--cdp-map-right-panel-width": effective.right + "px",
    "--cdp-map-left-separator-width": leftPanelOpen ? "12px" : "0px", "--cdp-map-right-separator-width": rightPanelOpen ? "12px" : "0px",
    "--cdp-map-minimum-width": "200px",
  } as CSSProperties), [effective.left, effective.right, leftPanelOpen, rightPanelOpen]);
  return { layoutRef, layoutStyle, isDesktop, isResizing, leftPanelWidth: effective.left, rightPanelWidth: effective.right,
    effectiveLeftPanelWidth: effective.left, effectiveRightPanelWidth: effective.right, mapMinimumWidth: 200,
    analysisPanelVisuallyOpen: rightPanelOpen, leftCompact: false, rightAutoCollapsed: false,
    leftSeparator: bindings("left"), rightSeparator: bindings("right") };
}
export type ResizableMapPanelsV129 = ReturnType<typeof useResizableMapPanelsV129>;
