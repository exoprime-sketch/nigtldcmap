import { useCallback, useEffect, useId, useReducer, useRef, useState, type ReactNode } from "react";
import type { CountryEntityV122, CountryMapLayerV122 } from "../../data/countries/countryDataTypesV122";
import {
  BOUNDARY_SYSTEM_STORAGE_KEY_V151,
  DEFAULT_BOUNDARY_SYSTEM_V151,
  boundarySystemV151,
} from "../../data/map/adminBoundaryV151";
import { readMapBackdropKindV151, type MapBackdropKindV151 } from "../../data/map/mapBackdropV151";
import type { SpatialRuntimeAsset } from "../../map/layers/types";
import type { MapCameraV151 } from "../../types/map";
import type { MiniMapEngineV152, MiniMapLegendV152 } from "./miniMapEngineV152";
import {
  claimMiniMapSlotV152,
  MINIMAP_HOVER_INTENT_MS_V152,
  MINIMAP_INITIAL_V152,
  MINIMAP_OFFSCREEN_RELEASE_MS_V152,
  miniMapReducerV152,
  type MiniMapIntentV152,
} from "./miniMapStateV152";
import "./minimap-v152.css";

/** One short credit line per backdrop kind (full wording: 이용안내 > 지도 이용 시 참고사항). */
const BACKDROP_CREDIT_V152: Record<MapBackdropKindV151, string> = {
  terrain: "배경: Mapzen·AWS 지형, Natural Earth, © OpenStreetMap 기여자, OpenFreeMap",
  satellite: "배경: Esri, Maxar, Earthstar Geographics, © OpenStreetMap 기여자, OpenFreeMap",
  streets: "배경: © OpenStreetMap 기여자, OpenFreeMap",
  none: "",
};

/** The mini map's own backdrop switch; on by default, remembered separately from the big map. */
export const MINIMAP_BACKDROP_STORAGE_KEY_V152 = "cdp-minimap-backdrop-v152";

function storageV152(): Storage | null {
  try {
    return typeof window === "undefined" ? null : window.localStorage;
  } catch {
    return null;
  }
}

function readMiniMapBackdropOnV152(): boolean {
  return storageV152()?.getItem(MINIMAP_BACKDROP_STORAGE_KEY_V152) !== "off";
}

/** The kind to draw when the backdrop is on: the big map's saved kind, terrain when that is "none". */
function backdropKindWhenOnV152(): MapBackdropKindV151 {
  const saved = readMapBackdropKindV151(storageV152());
  return saved === "none" ? "terrain" : saved;
}

type ControlActionV152 = "zoom-in" | "zoom-out" | "reset";

export interface MiniMapV152Props {
  countryIso3: string;
  layer: CountryMapLayerV122;
  /** The variable/period the static map shows; the engine draws the same slice. */
  selected: { variable: string; period: string };
  /** Detail selection dimensions (field -> value); point filters read them like the static map. */
  dimensions: Record<string, string>;
  /** Data the static map already loaded; the engine reuses it. */
  data: { spatial?: SpatialRuntimeAsset; records?: CountryEntityV122[] };
  /** Accessible name of the interactive map. */
  label: string;
  onSelectFeature?: (id: string | null) => void;
  onCameraChange?: (camera: MapCameraV151 | null) => void;
  /** The live map's legend when it differs from the static map's (null while static). */
  onEngineLegend?: (legend: MiniMapLegendV152 | null) => void;
  /** The static map (SVG) shown until the reader shows intent, and for print. */
  children: ReactNode;
}

/**
 * V152: the home/detail mini map. The static SVG stays the first paint, the
 * print image and the no-WebGL fallback; a reader's intent (mouse resting on
 * it, keyboard focus, a touch, a click or a control) swaps in MapLibre with the
 * big map's renderers. Wheel scrolling of the page is never captured
 * (cooperative gestures), and the engine is released off screen.
 */
export default function MiniMapV152(props: MiniMapV152Props) {
  const { layer, label, children } = props;
  const [machine, dispatch] = useReducer(miniMapReducerV152, MINIMAP_INITIAL_V152);
  const [backdropOn, setBackdropOn] = useState(readMiniMapBackdropOnV152);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [coarse] = useState(() => typeof window !== "undefined" && Boolean(window.matchMedia?.("(pointer: coarse)").matches));
  const rootRef = useRef<HTMLDivElement>(null);
  const hostRef = useRef<HTMLDivElement>(null);
  const canvasHostRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<MiniMapEngineV152 | null>(null);
  const cameraRef = useRef<MapCameraV151 | null>(null);
  const pendingRef = useRef<ControlActionV152 | null>(null);
  const hoverTimerRef = useRef<number | null>(null);
  const propsRef = useRef(props);
  propsRef.current = props;
  const helpId = useId();

  const intent = useCallback((source: MiniMapIntentV152) => dispatch({ type: "intent", source }), []);
  const run = useCallback((engine: MiniMapEngineV152, action: ControlActionV152) => {
    if (action === "reset") engine.reset();
    else engine.zoomBy(action === "zoom-in" ? 1 : -1);
  }, []);

  const engineWanted = machine.state === "loading" || machine.state === "active";
  const inputKey = JSON.stringify([props.countryIso3, layer.elementId, props.selected, props.dimensions]);

  useEffect(() => {
    if (!engineWanted) return undefined;
    const host = hostRef.current;
    const container = canvasHostRef.current;
    if (!host || !container) return undefined;
    let cancelled = false;
    let engine: MiniMapEngineV152 | null = null;
    const giveBack = claimMiniMapSlotV152(() => dispatch({ type: "preempted" }));
    const current = propsRef.current;
    const filters = Object.fromEntries(
      current.layer.filters.map((filter) => [
        `${current.layer.elementId}:${filter.field}`,
        current.dimensions[filter.field] || filter.defaultValue || "all",
      ])
    );
    const storage = storageV152();
    import(/* webpackChunkName: "minimap-engine-v152" */ "./miniMapEngineV152")
      .then(({ createMiniMapEngineV152 }) =>
        createMiniMapEngineV152({
          container,
          countryIso3: current.countryIso3,
          layer: current.layer,
          selected: current.selected,
          filters,
          boundarySystem: boundarySystemV151(storage?.getItem(BOUNDARY_SYSTEM_STORAGE_KEY_V151) || DEFAULT_BOUNDARY_SYSTEM_V151),
          backdrop: readMiniMapBackdropOnV152() ? backdropKindWhenOnV152() : "none",
          camera: cameraRef.current,
          data: current.data,
          onCamera: (camera, atFit) => {
            cameraRef.current = camera;
            host.setAttribute("data-center", `${camera.lng.toFixed(5)},${camera.lat.toFixed(5)}`);
            host.setAttribute("data-zoom", camera.zoom.toFixed(3));
            host.setAttribute("data-at-fit", atFit ? "true" : "false");
            // The first view is the mini map's own fit: the big map fits better on its larger canvas.
            propsRef.current.onCameraChange?.(atFit ? null : camera);
          },
          onRuntimeError: (message) => host.setAttribute("data-minimap-error", message),
          onLegend: (legend) => propsRef.current.onEngineLegend?.(legend),
          cardHost: cardRef.current,
          onSelect: (id) => {
            setSelectedId(id);
            propsRef.current.onSelectFeature?.(id);
          },
          onBackdropFallback: () => setBackdropOn(false),
        })
      )
      .then((created) => {
        if (cancelled) {
          created.destroy();
          return;
        }
        engine = created;
        engineRef.current = created;
        dispatch({ type: "ready" });
        const pending = pendingRef.current;
        pendingRef.current = null;
        if (pending) run(created, pending);
      })
      .catch(() => {
        if (!cancelled) dispatch({ type: "fail" });
      });
    return () => {
      cancelled = true;
      giveBack();
      engineRef.current = null;
      // The last view is remembered (restored on the next intent and handed to the big map).
      engine?.destroy();
      cardRef.current?.replaceChildren();
      propsRef.current.onEngineLegend?.(null);
    };
  }, [engineWanted, inputKey, run]);

  // Give the engine back once the map has been off screen for a moment.
  useEffect(() => {
    const root = rootRef.current;
    if (!root || typeof IntersectionObserver === "undefined") return undefined;
    let timer: number | null = null;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry?.isIntersecting) {
        if (timer !== null) window.clearTimeout(timer);
        timer = null;
        return;
      }
      if (timer === null) {
        timer = window.setTimeout(() => {
          timer = null;
          dispatch({ type: "offscreen" });
        }, MINIMAP_OFFSCREEN_RELEASE_MS_V152);
      }
    });
    observer.observe(root);
    return () => {
      observer.disconnect();
      if (timer !== null) window.clearTimeout(timer);
    };
  }, []);

  // Ctrl/⌘ + wheel on the static map would zoom the whole page; take it as intent instead.
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return undefined;
    const onWheel = (event: WheelEvent) => {
      if (!(event.ctrlKey || event.metaKey) || engineRef.current) return;
      event.preventDefault();
      pendingRef.current = event.deltaY < 0 ? "zoom-in" : "zoom-out";
      intent("wheel");
    };
    root.addEventListener("wheel", onWheel, { passive: false });
    return () => root.removeEventListener("wheel", onWheel);
  }, [intent]);

  useEffect(
    () => () => {
      if (hoverTimerRef.current !== null) window.clearTimeout(hoverTimerRef.current);
    },
    []
  );

  const act = (action: ControlActionV152) => {
    const engine = engineRef.current;
    if (engine) {
      run(engine, action);
      return;
    }
    pendingRef.current = action;
    intent("button");
  };

  const toggleBackdrop = () => {
    const next = !backdropOn;
    setBackdropOn(next);
    try {
      storageV152()?.setItem(MINIMAP_BACKDROP_STORAGE_KEY_V152, next ? "on" : "off");
    } catch {
      // optional preference
    }
    engineRef.current?.setBackdrop(next ? backdropKindWhenOnV152() : "none");
    if (!engineRef.current) intent("button");
  };

  const active = machine.state === "active";
  const help = active
    ? coarse
      ? "두 손가락으로 이동, 벌려서 확대"
      : "Ctrl+스크롤로 확대, 드래그로 이동"
    : "마우스를 올리거나 누르면 확대·이동할 수 있습니다";

  return (
    <div
      ref={rootRef}
      className="minimap152"
      data-testid="minimap-v152"
      data-minimap-state={machine.state}
      data-element-id={layer.elementId}
      data-selected-id={selectedId || ""}
      onPointerEnter={(event) => {
        if (event.pointerType !== "mouse" || engineWanted) return;
        if (hoverTimerRef.current !== null) window.clearTimeout(hoverTimerRef.current);
        hoverTimerRef.current = window.setTimeout(() => {
          hoverTimerRef.current = null;
          intent("hover");
        }, MINIMAP_HOVER_INTENT_MS_V152);
      }}
      onPointerLeave={() => {
        if (hoverTimerRef.current !== null) window.clearTimeout(hoverTimerRef.current);
        hoverTimerRef.current = null;
      }}
      onPointerDown={(event) => intent(event.pointerType === "touch" ? "touch" : "pointer")}
      onFocus={() => intent("focus")}
      onKeyDown={(event) => {
        const engine = engineRef.current;
        if (!engine) return;
        if (event.key === "Home") {
          event.preventDefault();
          engine.reset();
        } else if (event.key === "Escape") {
          engine.closePopup();
        }
      }}
    >
      <div className="minimap152__static" aria-hidden={active ? true : undefined}>
        {children}
      </div>
      {engineWanted && (
        <div
          ref={hostRef}
          className="minimap152__engine"
          role="application"
          aria-label={label}
          aria-describedby={helpId}
          data-testid="minimap-engine-v152"
        >
          {/* MapLibre styles its own container (position: relative); the outer box keeps the overlay placement. */}
          <div ref={canvasHostRef} className="minimap152__canvas" />
        </div>
      )}
      <div ref={cardRef} className="minimap152__card" data-testid="minimap-card-v152" aria-live="polite" />
      <div className="minimap152__controls" role="group" aria-label="지도 조작">
        <button type="button" data-testid="minimap-zoom-in-v152" aria-label="확대" onClick={() => act("zoom-in")}>
          +
        </button>
        <button type="button" data-testid="minimap-zoom-out-v152" aria-label="축소" onClick={() => act("zoom-out")}>
          −
        </button>
        <button type="button" data-testid="minimap-reset-v152" onClick={() => act("reset")}>
          전체 보기
        </button>
        <button
          type="button"
          data-testid="minimap-backdrop-v152"
          aria-pressed={backdropOn}
          onClick={toggleBackdrop}
        >
          배경지도
        </button>
      </div>
      <p id={helpId} className="minimap152__help" data-testid="minimap-help-v152">
        {help}
      </p>
      {active && backdropOn && BACKDROP_CREDIT_V152[backdropKindWhenOnV152()] && (
        <p className="minimap152__credit" data-testid="minimap-credit-v152">
          {BACKDROP_CREDIT_V152[backdropKindWhenOnV152()]}
        </p>
      )}
      {machine.state === "error" && (
        <p className="minimap152__note" role="status">
          확대 지도를 사용할 수 없어 정적 지도를 표시합니다.
        </p>
      )}
    </div>
  );
}
