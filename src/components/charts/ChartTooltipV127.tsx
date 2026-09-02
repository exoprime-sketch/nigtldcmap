import { useLayoutEffect, useRef, useState } from "react";
import {
  PublicTermExpandedTextV134,
  PublicTermTextV134,
} from "../help/PublicTermV134";
import type {
  ChartTooltipStateV127,
  ChartMarkerShapeV127,
} from "../../types/chartInteractionV127";

type ChartTooltipV127Props = {
  state: ChartTooltipStateV127 | null;
  stageWidth: number;
  stageHeight: number;
};

const TOOLTIP_GAP_V127 = 14;
const TOOLTIP_EDGE_V127 = 8;
const TOOLTIP_WIDTH_V127 = 292;

function tooltipMarkerClassV127(marker: ChartMarkerShapeV127): string {
  return `v127-chart-tooltip__marker v127-chart-tooltip__marker--${marker}`;
}

export function ChartTooltipV127({
  state,
  stageWidth,
  stageHeight,
}: ChartTooltipV127Props) {
  const tooltipRef = useRef<HTMLDivElement | null>(null);
  const [measuredContentHeight, setMeasuredContentHeight] = useState(0);
  const contentKey = state
    ? `${state.xValue}|${state.items
        .map((item) => `${item.seriesId}:${item.formattedValue}:${item.formattedDelta || ""}`)
        .join("|")}`
    : "";

  useLayoutEffect(() => {
    const node = tooltipRef.current;
    if (!node) {
      setMeasuredContentHeight(0);
      return;
    }
    const nextHeight = Math.max(node.scrollHeight, node.getBoundingClientRect().height);
    setMeasuredContentHeight((current) =>
      Math.abs(current - nextHeight) > 0.5 ? nextHeight : current
    );
  }, [contentKey, stageWidth]);

  if (!state || state.items.length === 0) return null;

  const measuredWidth = Math.min(
    TOOLTIP_WIDTH_V127,
    Math.max(220, stageWidth - TOOLTIP_EDGE_V127 * 2)
  );
  const deltaRowCount = state.items.filter((item) => item.formattedDelta).length;
  const estimatedContentHeight =
    46 + state.items.length * 30 + deltaRowCount * 18;
  const maximumHeight = Math.max(
    80,
    stageHeight - TOOLTIP_EDGE_V127 * 2
  );
  const contentHeight = measuredContentHeight || estimatedContentHeight;
  const collisionHeight = Math.min(maximumHeight, contentHeight);
  const preferredLeft = state.anchorX + TOOLTIP_GAP_V127;
  const left =
    preferredLeft + measuredWidth <= stageWidth - TOOLTIP_EDGE_V127
      ? preferredLeft
      : Math.max(
          TOOLTIP_EDGE_V127,
          state.anchorX - measuredWidth - TOOLTIP_GAP_V127
        );
  const top = Math.min(
    Math.max(TOOLTIP_EDGE_V127, state.anchorY - collisionHeight / 2),
    Math.max(TOOLTIP_EDGE_V127, stageHeight - collisionHeight - TOOLTIP_EDGE_V127)
  );

  return (
    <div
      className="v127-chart-tooltip"
      data-chart-tooltip="custom"
      data-tooltip-pinned={state.pinned ? "true" : "false"}
      data-testid="chart-tooltip"
      ref={tooltipRef}
      aria-label={state.pinned ? "선택한 차트 값과 용어 도움말" : undefined}
      role={state.pinned ? "dialog" : "tooltip"}
      tabIndex={state.pinned ? -1 : undefined}
      style={{
        left,
        maxHeight: maximumHeight,
        overflowY: contentHeight > maximumHeight ? "auto" : undefined,
        top,
        width: measuredWidth,
      }}
    >
      <strong className="v127-chart-tooltip__period">{state.xLabel}</strong>
      <ul>
        {state.items.map((item) => (
          <li data-testid="chart-tooltip-series" key={item.seriesId}>
            <i
              aria-hidden="true"
              className={tooltipMarkerClassV127(item.marker)}
              style={{ color: item.color }}
            />
            <span className="v127-chart-tooltip__label">
              {state.pinned ? (
                <PublicTermTextV134 text={item.label} />
              ) : (
                <PublicTermExpandedTextV134 text={item.label} />
              )}
            </span>
            <span className="v127-chart-tooltip__value">
              {item.formattedValue}
              {item.unit ? (
                <> {state.pinned ? (
                  <PublicTermTextV134 text={item.unit} />
                ) : (
                  <PublicTermExpandedTextV134 text={item.unit} />
                )}</>
              ) : ""}
            </span>
            {item.formattedDelta ? (
              <small className="v127-chart-tooltip__delta">
                전년 대비 {item.formattedDelta}
              </small>
            ) : null}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default ChartTooltipV127;
