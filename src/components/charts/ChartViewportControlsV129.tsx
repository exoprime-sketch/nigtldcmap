import type { ChartControlLabelsV127, ChartDomainV127 } from "../../types/chartInteractionV127";
import "./chart-viewport-controls-v129.css";

type ChartViewportControlsV129Props = {
  visibleDomain: ChartDomainV127;
  fullDomain: ChartDomainV127;
  rangeLabel?: string;
  canZoomOut: boolean;
  canZoomIn: boolean;
  labels?: ChartControlLabelsV127;
  formatX: (value: number) => string;
  onZoomOut: () => void;
  onZoomIn: () => void;
  onReset: () => void;
  onControlFocus?: () => void;
};

function sameDomainV129(left: ChartDomainV127, right: ChartDomainV127): boolean {
  return Math.abs(left[0] - right[0]) < 1e-8 && Math.abs(left[1] - right[1]) < 1e-8;
}

function ZoomOutIconV129() {
  return (
    <svg aria-hidden="true" viewBox="0 0 20 20">
      <path d="M4 10h12" />
    </svg>
  );
}

function ZoomInIconV129() {
  return (
    <svg aria-hidden="true" viewBox="0 0 20 20">
      <path d="M4 10h12M10 4v12" />
    </svg>
  );
}

function ResetIconV129() {
  return (
    <svg aria-hidden="true" viewBox="0 0 20 20">
      <path d="M5.2 6.1A6 6 0 1 1 4 10" />
      <path d="M3.5 3.7v4.4h4.4" />
    </svg>
  );
}

export function ChartViewportControlsV129({
  visibleDomain,
  fullDomain,
  rangeLabel: suppliedRangeLabel,
  canZoomOut,
  canZoomIn,
  labels,
  formatX,
  onZoomOut,
  onZoomIn,
  onReset,
  onControlFocus,
}: ChartViewportControlsV129Props) {
  const isFullRange = sameDomainV129(visibleDomain, fullDomain);
  const rangeLabel = suppliedRangeLabel || (isFullRange
    ? "전체"
    : `${formatX(visibleDomain[0])}–${formatX(visibleDomain[1])}`);
  const zoomOutName = labels?.zoomOut || "축소";
  const zoomInName = labels?.zoomIn || "확대";
  const resetName = labels?.reset && labels.reset !== "전체기간" ? labels.reset : "전체";

  return (
    <div
      aria-label="표시 기간 조정"
      className="v129-chart-viewport"
      data-chart-current-range={rangeLabel}
      data-chart-segmented-toolbar="true"
      data-chart-viewport-controls-v129="true"
      data-testid="chart-viewport-controls"
      role="group"
    >
      <output
        aria-label={`현재 표시 기간 ${rangeLabel}`}
        className="v129-chart-viewport__range"
        data-chart-current-range-label="true"
        data-testid="chart-current-range"
      >
        <span>표시기간</span>
        <strong>{rangeLabel}</strong>
      </output>

      <div className="v129-chart-viewport__buttons">
        <button
          aria-label="표시 기간을 넓혀 보기"
          data-chart-control-tooltip="표시 기간을 넓혀 보기"
          data-chart-zoom-out="true"
          data-testid="chart-zoom-out"
          disabled={!canZoomOut}
          onClick={onZoomOut}
          onFocus={onControlFocus}
          title="표시 기간을 넓혀 보기"
          type="button"
        >
          <ZoomOutIconV129 />
          <span className="v129-chart-viewport__button-text">{zoomOutName}</span>
        </button>
        <button
          aria-label="표시 기간을 좁혀 자세히 보기"
          data-chart-control-tooltip="표시 기간을 좁혀 자세히 보기"
          data-chart-zoom-in="true"
          data-testid="chart-zoom-in"
          disabled={!canZoomIn}
          onClick={onZoomIn}
          onFocus={onControlFocus}
          title="표시 기간을 좁혀 자세히 보기"
          type="button"
        >
          <ZoomInIconV129 />
          <span className="v129-chart-viewport__button-text">{zoomInName}</span>
        </button>
        <button
          aria-label="전체 기간으로 복원"
          data-chart-control-tooltip="전체 기간으로 복원"
          data-chart-reset="true"
          data-chart-zoom-reset="true"
          data-testid="chart-reset"
          disabled={isFullRange}
          onClick={onReset}
          onFocus={onControlFocus}
          title="전체 기간으로 복원"
          type="button"
        >
          <ResetIconV129 />
          <span className="v129-chart-viewport__button-text">{resetName}</span>
        </button>
      </div>
    </div>
  );
}

export default ChartViewportControlsV129;
