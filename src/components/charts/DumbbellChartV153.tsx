import ChartAxesV150 from "./ChartAxesV150";
import { formatPublicNumberV126 } from "../../data/visualization/publicNumberFormatV126";
import { PublicTermTextV134 } from "../help/PublicTermV134";
import "./dumbbell-chart-v153.css";

/**
 * V153-D1: two values per subject on one shared axis - a station's dry-season
 * minimum and wet-season maximum, a basin's total area and its area inside
 * the country. Every row is drawn against the same scale, so the gap is
 * comparable across rows; rows are drawn as delivered and never averaged.
 */
export interface DumbbellRowV153 {
  id: string;
  label: string;
  /** A second line under the label: the year, the basis. */
  note?: string;
  low: { label: string; value: number };
  high: { label: string; value: number };
}

interface Props {
  rows: DumbbellRowV153[];
  unit: string;
  xAxis: string;
  yAxis: string;
  ariaLabel: string;
  testId?: string;
}

const WIDTH = 760;
const LABEL_WIDTH = 190;
const ROW_HEIGHT = 44;
const PADDING = { top: 14, right: 36, bottom: 34 };

export default function DumbbellChartV153({ rows, unit, xAxis, yAxis, ariaLabel, testId = "dumbbell-chart-v153" }: Props) {
  if (rows.length === 0) return null;
  const maximum = Math.max(...rows.flatMap((row) => [row.low.value, row.high.value]), 1e-9);
  const plotLeft = LABEL_WIDTH;
  const plotWidth = WIDTH - LABEL_WIDTH - PADDING.right;
  const height = PADDING.top + rows.length * ROW_HEIGHT + PADDING.bottom;
  const x = (value: number) => plotLeft + (Math.max(0, value) / maximum) * plotWidth;
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((ratio) => maximum * ratio);
  const format = (value: number) => formatPublicNumberV126(value, unit);
  return (
    <figure className="dumbbell153" data-testid={testId} data-row-count={rows.length}>
      <ChartAxesV150 x={xAxis} y={yAxis} unit={unit} />
      <div className="dumbbell153__legend" aria-hidden="true">
        <span><i className="dumbbell153__dot dumbbell153__dot--low" /> {rows[0].low.label}</span>
        <span><i className="dumbbell153__dot dumbbell153__dot--high" /> {rows[0].high.label}</span>
      </div>
      <svg viewBox={`0 0 ${WIDTH} ${height}`} role="img" aria-label={ariaLabel} className="dumbbell153__svg">
        {ticks.map((tick) => (
          <g key={tick}>
            <line className="dumbbell153__grid" x1={x(tick)} x2={x(tick)} y1={PADDING.top} y2={height - PADDING.bottom} />
            <text className="dumbbell153__tick" x={x(tick)} y={height - PADDING.bottom + 18} textAnchor="middle">{format(tick)}</text>
          </g>
        ))}
        {rows.map((row, index) => {
          const cy = PADDING.top + index * ROW_HEIGHT + ROW_HEIGHT / 2;
          const lowX = x(row.low.value);
          const highX = x(row.high.value);
          return (
            <g key={row.id} className="dumbbell153__row" data-row-id={row.id}>
              <text className="dumbbell153__label" x={plotLeft - 12} y={cy - (row.note ? 4 : -4)} textAnchor="end">{row.label}</text>
              {row.note && <text className="dumbbell153__note" x={plotLeft - 12} y={cy + 12} textAnchor="end">{row.note}</text>}
              <line className="dumbbell153__bar" x1={Math.min(lowX, highX)} x2={Math.max(lowX, highX)} y1={cy} y2={cy} />
              <circle className="dumbbell153__dot dumbbell153__dot--low" cx={lowX} cy={cy} r="7" />
              <circle className="dumbbell153__dot dumbbell153__dot--high" cx={highX} cy={cy} r="7" />
              <title>{`${row.label}: ${row.low.label} ${format(row.low.value)} ${unit} · ${row.high.label} ${format(row.high.value)} ${unit}`}</title>
            </g>
          );
        })}
      </svg>
      <ul className="dumbbell153__values">
        {rows.map((row) => (
          <li key={row.id}>
            <strong><PublicTermTextV134 text={row.label} /></strong>
            {row.note && <small>{row.note}</small>}
            <span>{row.low.label} {format(row.low.value)} {unit}</span>
            <span>{row.high.label} {format(row.high.value)} {unit}</span>
          </li>
        ))}
      </ul>
    </figure>
  );
}
