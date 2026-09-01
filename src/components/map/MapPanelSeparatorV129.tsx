import type {
  KeyboardEvent as ReactKeyboardEvent,
  PointerEvent as ReactPointerEvent,
} from "react";
import type { ResizableMapPanelSideV129 } from "../../hooks/useResizableMapPanelsV129";

interface MapPanelSeparatorV129Props {
  controls: string;
  disabled: boolean;
  maximum: number;
  minimum: number;
  onDoubleClick: () => void;
  onKeyDown: (event: ReactKeyboardEvent<HTMLDivElement>) => void;
  onPointerDown: (event: ReactPointerEvent<HTMLDivElement>) => void;
  side: ResizableMapPanelSideV129;
  value: number;
}

export default function MapPanelSeparatorV129({
  controls,
  disabled,
  maximum,
  minimum,
  onDoubleClick,
  onKeyDown,
  onPointerDown,
  side,
  value,
}: MapPanelSeparatorV129Props) {
  const panelLabel = side === "left" ? "데이터 목록" : "지도 분석";
  return (
    <div
      className={`cdp-map-panel-separator cdp-map-panel-separator--${side} ${
        disabled ? "is-disabled" : ""
      }`}
      role="separator"
      aria-controls={controls}
      aria-disabled={disabled}
      aria-label={`${panelLabel} 너비 조절`}
      aria-orientation="vertical"
      aria-valuemax={maximum}
      aria-valuemin={minimum}
      aria-valuenow={Math.round(value)}
      data-panel-side={side}
      data-resizer-enabled={disabled ? "false" : "true"}
      data-resizer-id={`map-${side}-resizer`}
      data-testid={`map-${side}-panel-separator`}
      onDoubleClick={onDoubleClick}
      onKeyDown={onKeyDown}
      onPointerDown={onPointerDown}
      tabIndex={disabled ? -1 : 0}
      title={`${panelLabel} 너비 조절 · 두 번 클릭하면 기본 너비로 복원`}
    >
      <span aria-hidden="true" data-testid={`map-${side}-resizer`} />
    </div>
  );
}
