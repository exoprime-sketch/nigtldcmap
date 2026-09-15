import type { HomePreviewCardV139 } from "../../data/homePreviewV139";
import { homePreviewSvgUrlV139 } from "../../data/homePreviewV139";
import { PublicTermTextV134 } from "../help/PublicTermV134";

/**
 * Small analysis previews for the home's eight featured datasets.
 *
 * Each chart is a static SVG drawn from the pre-built preview asset. The
 * number, unit and period a chart summarises are written next to it as text,
 * and the SVG carries the same summary as its accessible name, so the reader
 * never depends on colour alone. Nothing here fetches or computes data.
 */
const W = 320;
const H = 132;
const INK = "#173a4d";
const MUTED = "#6b8394";
const SERIES = ["#0f766e", "#c2410c", "#2563eb", "#7c3aed"];

const fmt = (value: number, digits = 0) =>
  value.toLocaleString("en-US", { maximumFractionDigits: digits, minimumFractionDigits: 0 });

function SignedBars({ card }: { card: Extract<HomePreviewCardV139, { kind: "signed-bars" }> }) {
  const [min, max] = card.domain;
  const rowH = 18;
  const labelW = 108;
  const valueW = 40;
  const plotW = W - labelW - valueW - 8;
  const zeroX = labelW + ((0 - min) / (max - min)) * plotW;
  const height = card.bars.length * rowH + 8;
  const summary = card.bars.map((bar) => `${bar.label} ${bar.value > 0 ? "+" : ""}${bar.value}`).join(", ");
  return (
    <svg viewBox={`0 0 ${W} ${height}`} role="img" aria-label={`${card.period} 추정치: ${summary}`} className="home-chart-v139">
      <line x1={zeroX} x2={zeroX} y1={2} y2={height - 4} stroke="#c9d6df" strokeWidth={1} />
      {card.bars.map((bar, index) => {
        const y = index * rowH + 4;
        const x = labelW + ((Math.min(bar.value, 0) - min) / (max - min)) * plotW;
        const width = (Math.abs(bar.value) / (max - min)) * plotW;
        return (
          <g key={bar.label}>
            <text x={labelW - 8} y={y + 12} textAnchor="end" fontSize={11} fill={INK}>{bar.label}</text>
            <rect x={x} y={y + 3} width={Math.max(width, 1)} height={rowH - 8} rx={2} fill={bar.value < 0 ? "#c2410c" : "#0f766e"} />
            <text x={W - 4} y={y + 12} textAnchor="end" fontSize={10.5} fill={MUTED}>
              {bar.value > 0 ? "+" : ""}{bar.value.toFixed(2)}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

function Line({ card }: { card: Extract<HomePreviewCardV139, { kind: "line" }> }) {
  const points = card.series;
  const years = points.map((point) => point.year);
  const values = points.map((point) => point.value);
  const x0 = 40;
  const x1 = W - 8;
  const y0 = 8;
  const y1 = H - 22;
  const minYear = Math.min(...years);
  const maxYear = Math.max(...years);
  const maxValue = Math.max(...values, 0);
  const minValue = Math.min(...values, 0);
  const sx = (year: number) => x0 + ((year - minYear) / Math.max(1, maxYear - minYear)) * (x1 - x0);
  const sy = (value: number) => y1 - ((value - minValue) / Math.max(1e-9, maxValue - minValue)) * (y1 - y0);
  const d = points.map((point, index) => `${index ? "L" : "M"}${sx(point.year).toFixed(1)} ${sy(point.value).toFixed(1)}`).join("");
  const first = points[0];
  const last = points[points.length - 1];
  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      role="img"
      aria-label={`${card.seriesLabel ? `${card.seriesLabel}. ` : ""}${first.year}년 ${fmt(first.value, 1)}에서 ${last.year}년 ${fmt(last.value, 1)} (${card.unit})`}
      className="home-chart-v139"
    >
      <line x1={x0} x2={x1} y1={y1} y2={y1} stroke="#c9d6df" />
      <text x={x0 - 4} y={y0 + 4} textAnchor="end" fontSize={10} fill={MUTED}>{fmt(maxValue, 0)}</text>
      <text x={x0 - 4} y={y1} textAnchor="end" fontSize={10} fill={MUTED}>{fmt(minValue, 0)}</text>
      <path d={d} fill="none" stroke={SERIES[0]} strokeWidth={2} strokeLinejoin="round" />
      <circle cx={sx(last.year)} cy={sy(last.value)} r={3.2} fill={SERIES[0]} />
      <text x={x0} y={H - 6} fontSize={10} fill={MUTED}>{first.year}</text>
      <text x={x1} y={H - 6} textAnchor="end" fontSize={10} fill={MUTED}>{last.year}</text>
    </svg>
  );
}

function Composition({ card }: { card: Extract<HomePreviewCardV139, { kind: "composition" }> }) {
  const total = card.parts.reduce((sum, part) => sum + part.value, 0) || 1;
  let offset = 0;
  const barY = 10;
  const summary = card.parts.map((part) => `${part.label} ${fmt(part.value, 1)} (${Math.round((part.value / total) * 100)}%)`).join(", ");
  return (
    <div className="home-chart-v139__composition">
      <svg viewBox={`0 0 ${W} 34`} role="img" aria-label={`${card.period}: ${summary}. 합계 ${fmt(card.total, 1)} ${card.unit}`} className="home-chart-v139 home-chart-v139--strip">
        {card.parts.map((part, index) => {
          const width = (part.value / total) * W;
          const x = offset;
          offset += width;
          return <rect key={part.label} x={x} y={barY} width={Math.max(width, 0.5)} height={16} fill={SERIES[index % SERIES.length]} />;
        })}
      </svg>
      <ul className="home-chart-v139__legend">
        {card.parts.map((part, index) => (
          <li key={part.label}>
            <i style={{ background: SERIES[index % SERIES.length] }} aria-hidden="true" />
            <span><PublicTermTextV134 text={part.label} /></span>
            <strong>{fmt(part.value, 1)}</strong>
            <small>{Math.round((part.value / total) * 100)}%</small>
          </li>
        ))}
      </ul>
    </div>
  );
}

function GroupedBars({ card }: { card: Extract<HomePreviewCardV139, { kind: "grouped-bars" }> }) {
  const max = Math.max(...card.groups.flatMap((group) => group.values), 1);
  const rowH = 24;
  const labelW = 64;
  const plotW = W - labelW - 48;
  const height = card.groups.length * rowH + 4;
  const summary = card.groups
    .map((group) => `${group.label} ${card.seriesLabels.map((label, i) => `${label} ${fmt(group.values[i])}`).join("·")}`)
    .join(", ");
  return (
    <div>
      <svg viewBox={`0 0 ${W} ${height}`} role="img" aria-label={`${card.unit}: ${summary}`} className="home-chart-v139">
        {card.groups.map((group, index) => {
          const y = index * rowH + 2;
          return (
            <g key={group.label}>
              <text x={labelW - 8} y={y + 12} textAnchor="end" fontSize={11} fill={INK}>{group.label}</text>
              {group.values.map((value, i) => {
                const width = (value / max) * plotW;
                const barY = y + 2 + i * 9;
                return (
                  <g key={card.seriesLabels[i]}>
                    <rect x={labelW} y={barY} width={Math.max(width, 1)} height={6} rx={1.5} fill={SERIES[i]} />
                    <text x={labelW + width + 4} y={barY + 6} fontSize={9.5} fill={MUTED}>{fmt(value)}</text>
                  </g>
                );
              })}
            </g>
          );
        })}
      </svg>
      <ul className="home-chart-v139__legend home-chart-v139__legend--inline">
        {card.seriesLabels.map((label, i) => (
          <li key={label}>
            <i style={{ background: SERIES[i] }} aria-hidden="true" />
            <span><PublicTermTextV134 text={label} /></span>
            <strong>{fmt(card.rowsBySource[label] ?? 0)}행</strong>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Bars({ card }: { card: Extract<HomePreviewCardV139, { kind: "bars" }> }) {
  const max = Math.max(...card.bars.map((bar) => bar.value), 1);
  const rowH = 18;
  const labelW = 84;
  const plotW = W - labelW - 52;
  const height = card.bars.length * rowH + 4;
  const summary = card.bars.map((bar) => `${bar.label} ${fmt(bar.value)}`).join(", ");
  return (
    <svg viewBox={`0 0 ${W} ${height}`} role="img" aria-label={`${card.period} ${card.unit}: ${summary}`} className="home-chart-v139">
      {card.bars.map((bar, index) => {
        const y = index * rowH + 2;
        const width = (bar.value / max) * plotW;
        return (
          <g key={bar.label}>
            <text x={labelW - 8} y={y + 12} textAnchor="end" fontSize={11} fill={INK}>{bar.label}</text>
            <rect x={labelW} y={y + 3} width={Math.max(width, 1)} height={rowH - 8} rx={2} fill={SERIES[0]} />
            <text x={labelW + width + 4} y={y + 12} fontSize={10.5} fill={MUTED}>{fmt(bar.value)}</text>
          </g>
        );
      })}
    </svg>
  );
}

function MapCard({ card }: { card: Extract<HomePreviewCardV139, { kind: "map" }> }) {
  return (
    <div className="home-chart-v139__map">
      <img
        src={homePreviewSvgUrlV139(card.svgUrl)}
        alt={`2016년 송전선 경로를 전압별 색으로 그린 베트남 지도 (${card.legend.map((item) => `${item.kv} kV ${item.segments}구간`).join(", ")})`}
        width={340}
        height={640}
        loading="lazy"
        decoding="async"
      />
      <ul className="home-chart-v139__legend">
        {card.legend.map((item) => (
          <li key={item.kv}>
            <i style={{ background: item.color }} aria-hidden="true" />
            <span><PublicTermTextV134 text={`${item.kv} kV`} /></span>
            <strong>{fmt(item.segments)}구간</strong>
            <small>{fmt(item.lengthKm)} km</small>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function HomePreviewChartV139({ card }: { card: HomePreviewCardV139 }) {
  switch (card.kind) {
    case "signed-bars":
      return <SignedBars card={card} />;
    case "line":
      return <Line card={card} />;
    case "composition":
      return <Composition card={card} />;
    case "grouped-bars":
      return <GroupedBars card={card} />;
    case "bars":
      return <Bars card={card} />;
    case "map":
      return <MapCard card={card} />;
    default:
      return null;
  }
}
