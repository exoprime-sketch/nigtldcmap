import { useLayoutEffect, useState } from "react";
import type { CSSProperties } from "react";
import { createPortal } from "react-dom";
import { MAP_ICON_PATHS_V152 } from "../../data/map/mapIconPathsV152";
import type { MapIconIdV152 } from "../../data/map/mapIconPathsV152";
import { mapIconImageIdV152 } from "../../data/map/mapIconsV152";
import "./map-icons-v152.css";

// ------------------------------------------------------------------ shared, ref-counted sprite container

let sharedContainer: HTMLDivElement | null = null;
let refCount = 0;

function acquireSpriteContainer(): HTMLDivElement {
  if (!sharedContainer) {
    sharedContainer = document.createElement("div");
    sharedContainer.setAttribute("data-mi152-sprite-container", "true");
    document.body.appendChild(sharedContainer);
  }
  refCount += 1;
  return sharedContainer;
}

function releaseSpriteContainer(): void {
  refCount = Math.max(0, refCount - 1);
  if (refCount === 0 && sharedContainer) {
    sharedContainer.remove();
    sharedContainer = null;
  }
}

const ALL_ICON_IDS_V152 = (Object.keys(MAP_ICON_PATHS_V152) as MapIconIdV152[]).sort();

/**
 * One hidden `<svg><symbol>` per icon (all 35, sorted), mounted once per
 * document body via `createPortal` with reference counting: the first
 * mount creates the container, the last unmount removes it. `useLayoutEffect`
 * (not `useEffect`) so the symbols exist before the browser paints — a badge
 * mounted at the same time as the first sprite never flashes an empty glyph.
 *
 * `MapIconBadgeV152` renders this automatically; most callers never need it
 * directly (it is safe and cheap to mount more than once).
 */
export default function MapIconSpriteV152() {
  const [container, setContainer] = useState<HTMLDivElement | null>(null);

  useLayoutEffect(() => {
    const node = acquireSpriteContainer();
    setContainer(node);
    return () => releaseSpriteContainer();
  }, []);

  if (!container) return null;

  return createPortal(
    <svg aria-hidden="true" focusable="false" style={{ position: "absolute", width: 0, height: 0 }}>
      {ALL_ICON_IDS_V152.map((id) => {
        const glyph = MAP_ICON_PATHS_V152[id];
        return glyph.mode === "stroke" ? (
          <symbol
            fill="none"
            id={mapIconImageIdV152(id)}
            key={id}
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            viewBox={glyph.viewBox}
          >
            {glyph.paths.map((d, index) => (
              <path d={d} key={index} />
            ))}
          </symbol>
        ) : (
          <symbol fill="currentColor" id={mapIconImageIdV152(id)} key={id} viewBox={glyph.viewBox}>
            {glyph.paths.map((d, index) => (
              <path d={d} key={index} />
            ))}
          </symbol>
        );
      })}
    </svg>,
    container
  );
}

// ------------------------------------------------------------------ badge

export interface MapIconBadgeV152Props {
  iconId: MapIconIdV152;
  color: string;
  size?: number;
  tag?: "KR";
  title?: string;
}

/**
 * White circle, coloured 2.5px ring, ink-coloured glyph referencing the
 * shared sprite by `<use>`. When `tag` is `"KR"`, the small "KR" tag the map
 * draws is added by CSS (`::after`), so it is never DOM text: no stray node in
 * the accessible tree and no raw code in the page text.
 */
export function MapIconBadgeV152({ iconId, color, size = 22, tag, title }: MapIconBadgeV152Props) {
  return (
    <span
      className={tag === "KR" ? "mi152-badge mi152-badge--kr" : "mi152-badge"}
      data-icon-color={color}
      data-icon-id={iconId}
      style={{ "--mi152-ring": color, width: size, height: size } as CSSProperties}
      title={title}
    >
      <MapIconSpriteV152 />
      <svg aria-hidden="true" className="mi152-badge-glyph" viewBox="0 0 24 24">
        <use href={`#${mapIconImageIdV152(iconId)}`} />
      </svg>
    </span>
  );
}
