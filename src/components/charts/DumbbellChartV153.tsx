import ChartAxesV150 from "./ChartAxesV150";
import { formatPublicNumberV126 } from "../../data/visualization/publicNumberFormatV126";
import { PublicTermTextV134 } from "../help/PublicTermV134";
import "./dumbbell-chart-v153.css";
import { formatAxisTicksV164, niceTicksV164 } from "../../utils/axisTicksV164";

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
const LABEL_WIDTH = 220;
const MIN_ROW_HEIGHT = 44;
const LINE_HEIGHT = 15;
const PADDING = { top: 14, right: 36, bottom: 34 };
/** Room for a row label, in drawing units: the label ends 12 units left of the plot and starts 8 units inside the edge. */
const LABEL_BUDGET = LABEL_WIDTH - 12 - 8;
const LABEL_MAX_LINES = 3;

/** An estimate of a glyph's width at the label size, on the wide side so a label is wrapped rather than cut off. */
function glyphWidthV164(character: string): number {
  if (/[\u1100-\u11ff\u3130-\u318f\uac00-\ud7af\u3040-\u30ff\u4e00-\u9fff]/u.test(character)) return 14.5;
  if (/\s/u.test(character)) return 4;
  if (/[A-Z]/u.test(character)) return 9.5;
  return 7.8;
}

function textWidthV164(text: string): number {
  return Array.from(text).reduce((sum, character) => sum + glyphWidthV164(character), 0);
}

/**
 * A row label as at most `maxLines` lines no wider than `budget`. The label is
 * broken at spaces; what still does not fit ends in an ellipsis (the full text
 * stays in the tooltip and in the list under the chart). Drawn on one line
 * right-aligned, a long basin or station name was cut off at the chart's edge.
 */
export function wrapLabelV164(text: string, budget: number, maxLines = LABEL_MAX_LINES): string[] {
  const words = text.trim().split(/\s+/u).filter(Boolean);
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (textWidthV164(candidate) <= budget) {
      current = candidate;
      continue;
    }
    if (current) lines.push(current);
    current = word;
  }
  if (current) lines.push(current);
  const fitted = lines.slice(0, maxLines);
  const dropped = lines.length > maxLines;
  return fitted.map((line, index) => {
    const last = index === fitted.length - 1;
    if (textWidthV164(line) <= budget && !(last && dropped)) return line;
    let cut = Array.from(line);
    const room = budget - glyphWidthV164("…");
    while (cut.length > 1 && textWidthV164(cut.join("")) > room) cut = cut.slice(0, -1);
    return `${cut.join("").trimEnd()}…`;
  });
}

export default function DumbbellChartV153({ rows, unit, xAxis, yAxis, ariaLabel, testId = "dumbbell-chart-v153" }: Props) {
  if (rows.length === 0) return null;
  const rawMaximum = Math.max(...rows.flatMap((row) => [row.low.value, row.high.value]), 1e-9);
  // V164: the axis ends on a round tick, so its guides are round numbers.
  const ticks = niceTicksV164(0, rawMaximum, 4);
  const maximum = ticks[ticks.length - 1] || rawMaximum;
  const tickLabels = formatAxisTicksV164(ticks);
  const plotLeft = LABEL_WIDTH;
  const plotWidth = WIDTH - LABEL_WIDTH - PADDING.right;
  const labelLines = rows.map((row) => ({
    label: wrapLabelV164(row.label, LABEL_BUDGET),
    note: row.note ? wrapLabelV164(row.note, LABEL_BUDGET, 1) : [],
  }));
  const tallest = Math.max(...labelLines.map((entry) => entry.label.length + entry.note.length));
  const rowHeight = Math.max(MIN_ROW_HEIGHT, tallest * LINE_HEIGHT + 12);
  const height = PADDING.top + rows.length * rowHeight + PADDING.bottom;
  const x = (value: number) => plotLeft + (Math.max(0, value) / maximum) * plotWidth;
  const format = (value: number) => formatPublicNumberV126(value, unit);
  return (
    <figure className="dumbbell153" data-testid={testId} data-row-count={rows.length}>
      <ChartAxesV150 x={xAxis} y={yAxis} unit={unit} />
      <div className="dumbbell153__legend" aria-hidden="true">
        <span><i className="dumbbell153__dot dumbbell153__dot--low" /> {rows[0].low.label}</span>
        <span><i className="dumbbell153__dot dumbbell153__dot--high" /> {rows[0].high.label}</span>
      </div>
      <svg viewBox={`0 0 ${WIDTH} ${height}`} role="img" aria-label={ariaLabel} className="dumbbell153__svg">
        {ticks.map((tick, tickIndex) => (
          <g key={tick}>
            <line className="dumbbell153__grid" x1={x(tick)} x2={x(tick)} y1={PADDING.top} y2={height - PADDING.bottom} />
            <text className="dumbbell153__tick" x={x(tick)} y={height - PADDING.bottom + 18} textAnchor="middle">{tickLabels[tickIndex] ?? format(tick)}</text>
          </g>
        ))}
        {rows.map((row, index) => {
          const cy = PADDING.top + index * rowHeight + rowHeight / 2;
          const entry = labelLines[index];
          const blockTop = cy - ((entry.label.length + entry.note.length) * LINE_HEIGHT) / 2;
          const lowX = x(row.low.value);
          const highX = x(row.high.value);
          return (
            <g key={row.id} className="dumbbell153__row" data-row-id={row.id}>
              {entry.label.map((line, lineIndex) => (
                <text className="dumbbell153__label" key={`l-${lineIndex}`} x={plotLeft - 12} y={blockTop + (lineIndex + 1) * LINE_HEIGHT - 3} textAnchor="end">{line}</text>
              ))}
              {entry.note.map((line, lineIndex) => (
                <text className="dumbbell153__note" key={`n-${lineIndex}`} x={plotLeft - 12} y={blockTop + (entry.label.length + lineIndex + 1) * LINE_HEIGHT - 3} textAnchor="end">{line}</text>
              ))}
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
