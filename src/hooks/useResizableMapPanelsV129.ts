import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type {
  CSSProperties,
  KeyboardEvent as ReactKeyboardEvent,
  PointerEvent as ReactPointerEvent,
  RefObject,
} from "react";

export type ResizableMapPanelSideV129 = "left" | "right";

export const MAP_PANEL_LIMITS_V129 = {
  desktopBreakpoint: 1100,
  separatorWidth: 8,
  mapMinimumWidth: 560,
  compactLeftWidth: 76,
  collapsedPanelWidth: 64,
  left: { defaultWidth: 320, minimum: 260, maximum: 460 },
  right: { defaultWidth: 360, minimum: 300, maximum: 520 },
} as const;

const LEFT_STORAGE_KEY = "cdp-map-left-panel-width-v129";
const RIGHT_STORAGE_KEY = "cdp-map-right-panel-width-v129";

interface UseResizableMapPanelsOptionsV129 {
  leftPanelOpen: boolean;
  rightPanelOpen: boolean;
  onMapResize?: () => void;
}

interface SeparatorBindingsV129 {
  disabled: boolean;
  maximum: number;
  minimum: number;
  onDoubleClick: () => void;
  onKeyDown: (event: ReactKeyboardEvent<HTMLDivElement>) => void;
  onPointerDown: (event: ReactPointerEvent<HTMLDivElement>) => void;
  value: number;
}

export interface ResizableMapPanelsV129 {
  analysisPanelVisuallyOpen: boolean;
  effectiveLeftPanelWidth: number;
  effectiveRightPanelWidth: number;
  isDesktop: boolean;
  isResizing: boolean;
  layoutRef: RefObject<HTMLDivElement>;
  layoutStyle: CSSProperties;
  leftCompact: boolean;
  leftPanelWidth: number;
  leftSeparator: SeparatorBindingsV129;
  mapMinimumWidth: number;
  rightAutoCollapsed: boolean;
  rightPanelWidth: number;
  rightSeparator: SeparatorBindingsV129;
}

interface ActiveResizeV129 {
  initialClientX: number;
  initialWidth: number;
  side: ResizableMapPanelSideV129;
}

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(maximum, Math.max(minimum, value));
}

function readStoredWidth(key: string, fallback: number, minimum: number, maximum: number): number {
  if (typeof window === "undefined") return fallback;
  const stored = window.localStorage.getItem(key);
  if (stored === null || stored.trim() === "") return fallback;
  const parsed = Number(stored);
  return Number.isFinite(parsed) ? clamp(parsed, minimum, maximum) : fallback;
}

export function useResizableMapPanelsV129({
  leftPanelOpen,
  rightPanelOpen,
  onMapResize,
}: UseResizableMapPanelsOptionsV129): ResizableMapPanelsV129 {
  const layoutRef = useRef<HTMLDivElement>(null);
  const animationFrameRef = useRef<number | null>(null);
  const activeResizeRef = useRef<ActiveResizeV129 | null>(null);
  const bodyUserSelectRef = useRef("");
  const [layoutWidth, setLayoutWidth] = useState(0);
  const [isDesktop, setIsDesktop] = useState(
    () => typeof window !== "undefined" && window.innerWidth >= MAP_PANEL_LIMITS_V129.desktopBreakpoint
  );
  const [isResizing, setIsResizing] = useState(false);
  const [leftPanelWidth, setLeftPanelWidth] = useState(() =>
    readStoredWidth(
      LEFT_STORAGE_KEY,
      MAP_PANEL_LIMITS_V129.left.defaultWidth,
      MAP_PANEL_LIMITS_V129.left.minimum,
      MAP_PANEL_LIMITS_V129.left.maximum
    )
  );
  const [rightPanelWidth, setRightPanelWidth] = useState(() =>
    readStoredWidth(
      RIGHT_STORAGE_KEY,
      MAP_PANEL_LIMITS_V129.right.defaultWidth,
      MAP_PANEL_LIMITS_V129.right.minimum,
      MAP_PANEL_LIMITS_V129.right.maximum
    )
  );
  const leftPreferenceRef = useRef(leftPanelWidth);
  const rightPreferenceRef = useRef(rightPanelWidth);

  const requestMapResize = useCallback(() => {
    if (!onMapResize || typeof window === "undefined") return;
    if (animationFrameRef.current !== null) {
      window.cancelAnimationFrame(animationFrameRef.current);
    }
    animationFrameRef.current = window.requestAnimationFrame(() => {
      animationFrameRef.current = null;
      onMapResize();
    });
  }, [onMapResize]);

  useEffect(() => {
    const node = layoutRef.current;
    if (!node) return;
    const measure = () => setLayoutWidth(node.getBoundingClientRect().width);
    measure();
    const observer =
      typeof ResizeObserver !== "undefined" ? new ResizeObserver(measure) : null;
    observer?.observe(node);
    window.addEventListener("resize", measure);
    return () => {
      observer?.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const media = window.matchMedia(
      `(min-width: ${MAP_PANEL_LIMITS_V129.desktopBreakpoint}px)`
    );
    const update = () => setIsDesktop(media.matches);
    update();
    media.addEventListener?.("change", update);
    return () => media.removeEventListener?.("change", update);
  }, []);

  const openLeftTrack = leftPanelOpen ? leftPanelWidth : MAP_PANEL_LIMITS_V129.collapsedPanelWidth;
  const mapWidthWithBothPanels =
    layoutWidth -
    openLeftTrack -
    rightPanelWidth -
    (leftPanelOpen ? MAP_PANEL_LIMITS_V129.separatorWidth : 0) -
    (rightPanelOpen ? MAP_PANEL_LIMITS_V129.separatorWidth : 0);
  const rightAutoCollapsed =
    isDesktop &&
    rightPanelOpen &&
    layoutWidth > 0 &&
    mapWidthWithBothPanels < MAP_PANEL_LIMITS_V129.mapMinimumWidth;
  const analysisPanelVisuallyOpen = rightPanelOpen && !rightAutoCollapsed;
  const effectiveRightTrack = analysisPanelVisuallyOpen
    ? rightPanelWidth
    : MAP_PANEL_LIMITS_V129.collapsedPanelWidth;
  const effectiveRightSeparator = analysisPanelVisuallyOpen
    ? MAP_PANEL_LIMITS_V129.separatorWidth
    : 0;
  const mapWidthAfterRightCollapse =
    layoutWidth -
    openLeftTrack -
    effectiveRightTrack -
    effectiveRightSeparator -
    (leftPanelOpen ? MAP_PANEL_LIMITS_V129.separatorWidth : 0);
  const leftCompact =
    isDesktop &&
    leftPanelOpen &&
    layoutWidth > 0 &&
    mapWidthAfterRightCollapse < MAP_PANEL_LIMITS_V129.mapMinimumWidth;
  const effectiveLeftTrack = leftCompact
    ? MAP_PANEL_LIMITS_V129.compactLeftWidth
    : openLeftTrack;
  const effectiveLeftSeparator = leftPanelOpen && !leftCompact
    ? MAP_PANEL_LIMITS_V129.separatorWidth
    : 0;

  const dynamicMaximum = useCallback(
    (side: ResizableMapPanelSideV129): number => {
      if (!isDesktop || layoutWidth <= 0) {
        return MAP_PANEL_LIMITS_V129[side].maximum;
      }
      const otherTrack =
        side === "left"
          ? effectiveRightTrack + effectiveRightSeparator
          : effectiveLeftTrack + effectiveLeftSeparator;
      const available =
        layoutWidth -
        otherTrack -
        MAP_PANEL_LIMITS_V129.mapMinimumWidth -
        MAP_PANEL_LIMITS_V129.separatorWidth;
      return Math.max(
        MAP_PANEL_LIMITS_V129[side].minimum,
        Math.min(MAP_PANEL_LIMITS_V129[side].maximum, available)
      );
    },
    [
      effectiveLeftSeparator,
      effectiveLeftTrack,
      effectiveRightSeparator,
      effectiveRightTrack,
      isDesktop,
      layoutWidth,
    ]
  );

  useEffect(() => {
    if (!isDesktop || layoutWidth <= 0) return;
    const availableForOpenPanels =
      layoutWidth -
      MAP_PANEL_LIMITS_V129.mapMinimumWidth -
      MAP_PANEL_LIMITS_V129.separatorWidth * 2;
    const minimumOpenPanels =
      MAP_PANEL_LIMITS_V129.left.minimum +
      MAP_PANEL_LIMITS_V129.right.minimum;
    if (
      leftPanelOpen &&
      rightPanelOpen &&
      availableForOpenPanels >= minimumOpenPanels
    ) {
      let nextLeft = clamp(
        leftPreferenceRef.current,
        MAP_PANEL_LIMITS_V129.left.minimum,
        MAP_PANEL_LIMITS_V129.left.maximum
      );
      let nextRight = clamp(
        rightPreferenceRef.current,
        MAP_PANEL_LIMITS_V129.right.minimum,
        MAP_PANEL_LIMITS_V129.right.maximum
      );
      let overflow = Math.max(
        0,
        nextLeft + nextRight - availableForOpenPanels
      );
      const rightReduction = Math.min(
        overflow,
        nextRight - MAP_PANEL_LIMITS_V129.right.minimum
      );
      nextRight -= rightReduction;
      overflow -= rightReduction;
      nextLeft = Math.max(
        MAP_PANEL_LIMITS_V129.left.minimum,
        nextLeft - overflow
      );
      if (nextLeft !== leftPanelWidth) setLeftPanelWidth(nextLeft);
      if (nextRight !== rightPanelWidth) setRightPanelWidth(nextRight);
      return;
    }
    if (leftPanelOpen) {
      setLeftPanelWidth((current) =>
        clamp(
          leftPreferenceRef.current,
          MAP_PANEL_LIMITS_V129.left.minimum,
          dynamicMaximum("left")
        )
      );
    }
    if (analysisPanelVisuallyOpen) {
      setRightPanelWidth((current) =>
        clamp(
          rightPreferenceRef.current,
          MAP_PANEL_LIMITS_V129.right.minimum,
          dynamicMaximum("right")
        )
      );
    }
  }, [
    analysisPanelVisuallyOpen,
    dynamicMaximum,
    isDesktop,
    layoutWidth,
    leftCompact,
    leftPanelOpen,
    leftPanelWidth,
    rightPanelOpen,
    rightPanelWidth,
  ]);

  const setPanelWidth = useCallback(
    (side: ResizableMapPanelSideV129, value: number) => {
      const limits = MAP_PANEL_LIMITS_V129[side];
      const next = clamp(value, limits.minimum, dynamicMaximum(side));
      if (side === "left") {
        leftPreferenceRef.current = next;
        setLeftPanelWidth(next);
        window.localStorage.setItem(LEFT_STORAGE_KEY, String(Math.round(next)));
      } else {
        rightPreferenceRef.current = next;
        setRightPanelWidth(next);
        window.localStorage.setItem(RIGHT_STORAGE_KEY, String(Math.round(next)));
      }
      requestMapResize();
    },
    [dynamicMaximum, requestMapResize]
  );

  const finishResize = useCallback(() => {
    if (!activeResizeRef.current) return;
    activeResizeRef.current = null;
    setIsResizing(false);
    document.body.classList.remove("cdp-map-panel-resize-active");
    document.body.style.userSelect = bodyUserSelectRef.current;
    requestMapResize();
  }, [requestMapResize]);

  useEffect(() => {
    if (!isResizing) return;
    const onPointerMove = (event: PointerEvent) => {
      const active = activeResizeRef.current;
      if (!active) return;
      const delta = event.clientX - active.initialClientX;
      setPanelWidth(
        active.side,
        active.initialWidth + (active.side === "left" ? delta : -delta)
      );
    };
    const onPointerEnd = () => finishResize();
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerEnd);
    window.addEventListener("pointercancel", onPointerEnd);
    return () => {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerEnd);
      window.removeEventListener("pointercancel", onPointerEnd);
    };
  }, [finishResize, isResizing, setPanelWidth]);

  useEffect(
    () => () => {
      if (animationFrameRef.current !== null) {
        window.cancelAnimationFrame(animationFrameRef.current);
      }
      document.body.classList.remove("cdp-map-panel-resize-active");
      document.body.style.userSelect = bodyUserSelectRef.current;
    },
    []
  );

  useEffect(() => {
    requestMapResize();
  }, [
    analysisPanelVisuallyOpen,
    effectiveLeftTrack,
    effectiveRightTrack,
    isDesktop,
    requestMapResize,
  ]);

  const separatorBindings = useCallback(
    (side: ResizableMapPanelSideV129): SeparatorBindingsV129 => {
      const width = side === "left" ? leftPanelWidth : rightPanelWidth;
      const disabled =
        !isDesktop ||
        (side === "left"
          ? !leftPanelOpen || leftCompact
          : !analysisPanelVisuallyOpen);
      return {
        disabled,
        maximum: dynamicMaximum(side),
        minimum: MAP_PANEL_LIMITS_V129[side].minimum,
        value: width,
        onPointerDown: (event) => {
          if (disabled || event.button !== 0) return;
          event.preventDefault();
          event.currentTarget.setPointerCapture?.(event.pointerId);
          activeResizeRef.current = {
            side,
            initialClientX: event.clientX,
            initialWidth: width,
          };
          bodyUserSelectRef.current = document.body.style.userSelect;
          document.body.style.userSelect = "none";
          document.body.classList.add("cdp-map-panel-resize-active");
          setIsResizing(true);
        },
        onKeyDown: (event) => {
          if (disabled || (event.key !== "ArrowLeft" && event.key !== "ArrowRight")) {
            return;
          }
          event.preventDefault();
          const step = event.shiftKey ? 32 : 8;
          const horizontalDirection = event.key === "ArrowRight" ? 1 : -1;
          setPanelWidth(
            side,
            width + horizontalDirection * step * (side === "left" ? 1 : -1)
          );
        },
        onDoubleClick: () => {
          if (disabled) return;
          setPanelWidth(side, MAP_PANEL_LIMITS_V129[side].defaultWidth);
        },
      };
    },
    [
      analysisPanelVisuallyOpen,
      dynamicMaximum,
      isDesktop,
      leftCompact,
      leftPanelOpen,
      leftPanelWidth,
      rightPanelWidth,
      setPanelWidth,
    ]
  );

  const layoutStyle = useMemo(
    () =>
      ({
        "--cdp-map-left-panel-width": `${effectiveLeftTrack}px`,
        "--cdp-map-left-separator-width": `${effectiveLeftSeparator}px`,
        "--cdp-map-right-panel-width": `${effectiveRightTrack}px`,
        "--cdp-map-right-separator-width": `${effectiveRightSeparator}px`,
        "--cdp-map-minimum-width": `${MAP_PANEL_LIMITS_V129.mapMinimumWidth}px`,
      } as CSSProperties),
    [
      effectiveLeftSeparator,
      effectiveLeftTrack,
      effectiveRightSeparator,
      effectiveRightTrack,
    ]
  );

  return {
    analysisPanelVisuallyOpen,
    effectiveLeftPanelWidth: effectiveLeftTrack,
    effectiveRightPanelWidth: effectiveRightTrack,
    isDesktop,
    isResizing,
    layoutRef,
    layoutStyle,
    leftCompact,
    leftPanelWidth,
    leftSeparator: separatorBindings("left"),
    mapMinimumWidth: MAP_PANEL_LIMITS_V129.mapMinimumWidth,
    rightAutoCollapsed,
    rightPanelWidth,
    rightSeparator: separatorBindings("right"),
  };
}
