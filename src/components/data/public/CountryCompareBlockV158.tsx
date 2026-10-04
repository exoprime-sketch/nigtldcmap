import { useEffect, useMemo, useRef, useState } from "react";

import "./country-compare-v158.css";
import { PublicTermTextV134 } from "../../help/PublicTermV134";
import { formatAxisTicksV164, formatAxisValueV164, niceXTicksV164, valueAxisV164 } from "../../../utils/axisTicksV164";

/**
 * One country's series for the element being compared.
 *
 * The unit travels with the series because a comparison is only honest when both
 * sides state the same unit. A country whose delivery states a different unit is
 * named in a note rather than drawn on the same axis.
 */
export interface CountryCompareSeriesV158 {
  countryIso3: string;
  countryNameKo: string;
  unit: string;
  points: { year: number; value: number | null }[];
  /** Who published the series. Stated so a footnote can flag differing sources. */
  sourceOrg?: string;
}

export interface CountryCompareKeyV158 {
  indicatorId: string;
  unit: string;
  /** "latest-common": the most recent year every country has a value for. */
  yearRule: string;
}

export interface CountryCompareBlockPropsV158 {
  elementId: string;
  title: string;
  compareKey: CountryCompareKeyV158;
  series: CountryCompareSeriesV158[];
  /** Overrides the shape the data would pick; used by the tests. */
  mode?: "auto" | "grouped-bars" | "multi-line";
}

const COLORS_V158 = ["#16806b", "#2563eb", "#c2410c", "#7c3aed", "#be123c"];
/** Below this many shared years a line reads as noise, so bars are used. */
const MIN_YEARS_FOR_LINES_V158 = 3;

function commonYearsV158(series: CountryCompareSeriesV158[]): number[] {
  const yearSets = series.map(
    (row) =>
      new Set(
        row.points
          .filter((point) => typeof point.value === "number" && Number.isFinite(point.value))
          .map((point) => point.year)
      )
  );
  if (yearSets.length === 0) return [];
  return [...yearSets[0]]
    .filter((year) => yearSets.every((set) => set.has(year)))
    .sort((left, right) => left - right);
}

function valueAtV158(row: CountryCompareSeriesV158, year: number): number | null {
  const point = row.points.find((candidate) => candidate.year === year);
  return typeof point?.value === "number" && Number.isFinite(point.value) ? point.value : null;
}

/** V164: round steps (1, 2, 2.5, 5 x 10^n) for a value axis between lo and hi. */
/**
 * V164: the country lines with what a reader needs to read them - a value axis
 * with its unit, the first, middle and last years, and each country's latest
 * value at its line's end. The axis fits the data (a score between 37 and 50
 * no longer sits in the top fifth of a 0-based box). Only years every country
 * states are drawn, as before.
 */
function MultiLineChartV164({
  title,
  unit,
  years,
  rows,
}: {
  title: string;
  unit: string;
  years: number[];
  rows: Array<{ row: CountryCompareSeriesV158; color: string }>;
}) {
  // The drawing is laid out at the width it is shown at, so labels stay at their
  // set size instead of growing with a wide card or being cut at its edges.
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const [measured, setMeasured] = useState(640);
  useEffect(() => {
    const node = wrapRef.current;
    if (!node) return undefined;
    const update = () => setMeasured(Math.round(node.getBoundingClientRect().width) || 640);
    update();
    if (typeof ResizeObserver === "undefined") return undefined;
    const observer = new ResizeObserver(update);
    observer.observe(node);
    return () => observer.disconnect();
  }, []);
  const width = Math.max(300, Math.min(1100, measured));
  const height = width < 480 ? 220 : 260;
  const values = years.flatMap((year) => rows.map(({ row }) => valueAtV158(row, year)).filter((value): value is number => value !== null));
  if (values.length === 0) return null;
  // The axis ends on round ticks counted in one step (32.5 · 35 · 37.5, never 33 · 35 · 38), and a % whose values fit in 0-100 stops at 100.
  const axis = valueAxisV164({ values, unit, intervals: 4 });
  const ticks = axis.ticks;
  const tickLabels = formatAxisTicksV164(ticks);
  const lo = axis.domain[0];
  const hi = axis.domain[1];
  const span = hi - lo || 1;
  const lastIndex = years.length - 1;
  const endText = (row: CountryCompareSeriesV158, value: number) => `${row.countryNameKo} ${formatAxisValueV164(value)}`;
  const textWidth = (text: string) => Array.from(text).reduce((sum, ch) => sum + (/[\d.,\s-]/.test(ch) ? 7 : 12), 0);
  const left = Math.max(40, ...tickLabels.map((label) => textWidth(label) + 14), unit ? textWidth(unit) + 8 : 0);
  const endLabels = rows.map(({ row }) => valueAtV158(row, years[lastIndex])).filter((value): value is number => value !== null);
  const right = Math.min(width * 0.38, Math.max(24, ...rows.map(({ row }, index) => (endLabels[index] === undefined ? 0 : textWidth(endText(row, endLabels[index])) + 18))));
  const top = 22;
  const bottom = 28;
  // Placed by year, not by position: the shared years can have gaps, and an evenly spaced axis would stretch them.
  const firstYear = years[0];
  const yearSpan = years[lastIndex] - firstYear;
  const x = (year: number) => (yearSpan <= 0 ? left + (width - left - right) / 2 : left + ((year - firstYear) / yearSpan) * (width - left - right));
  const y = (value: number) => top + (1 - (value - lo) / span) * (height - top - bottom);
  // Round, evenly spaced years (every 2nd, 5th, 10th …) as many as the plot has room for.
  const yearMarks = niceXTicksV164(years, Math.max(3, Math.floor((width - left - right) / 72)), width - left - right);
  // End labels, nudged apart when two lines finish close together.
  const ends = rows
    .map(({ row, color }) => ({ row, color, value: valueAtV158(row, years[lastIndex]) }))
    .filter((end): end is { row: CountryCompareSeriesV158; color: string; value: number } => end.value !== null)
    .map((end) => ({ ...end, labelY: y(end.value) }))
    .sort((a, b) => a.labelY - b.labelY);
  for (let index = 1; index < ends.length; index += 1) {
    if (ends[index].labelY - ends[index - 1].labelY < 15) ends[index].labelY = ends[index - 1].labelY + 15;
  }
  return (
    <div ref={wrapRef} className="ccb158__chart-wrap">
    <svg
      className="ccb158__chart"
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      role="img"
      aria-label={`${title} · ${rows.map(({ row }) => row.countryNameKo).join(", ")} · ${years[0]}–${years[lastIndex]}년${unit ? ` · 단위 ${unit}` : ""}`}
      data-testid="country-compare-lines-v158"
    >
      {ticks.map((tick, index) => (
        <g key={tick} className="ccb158__tick">
          <line x1={left} x2={width - right} y1={y(tick)} y2={y(tick)} stroke="#e1ebe7" strokeWidth="1" />
          <text x={left - 6} y={y(tick) + 4} textAnchor="end" fontSize="11" fill="#5b7169">
            {tickLabels[index]}
          </text>
        </g>
      ))}
      {unit ? (
        <text x={4} y={11} textAnchor="start" fontSize="11" fill="#5b7169" data-testid="country-compare-unit-v164">
          {`단위: ${unit}`}
        </text>
      ) : null}
      {yearMarks.map((year) => (
        <text key={year} x={x(year)} y={height - 10} textAnchor={year === firstYear ? "start" : year === years[lastIndex] ? "end" : "middle"} fontSize="11" fill="#5b7169">
          {year}
        </text>
      ))}
      {rows.map(({ row, color }) => (
        <polyline
          key={row.countryIso3}
          fill="none"
          stroke={color}
          strokeWidth="2.4"
          strokeLinejoin="round"
          data-country={row.countryIso3}
          points={years
            .map((year) => {
              const value = valueAtV158(row, year);
              return value === null ? null : `${x(year).toFixed(1)},${y(value).toFixed(1)}`;
            })
            .filter(Boolean)
            .join(" ")}
        />
      ))}
      {ends.map((end) => (
        <g key={end.row.countryIso3}>
          <circle cx={x(years[lastIndex])} cy={y(end.value)} r="3.2" fill={end.color} />
          <text x={x(years[lastIndex]) + 8} y={end.labelY + 4} fontSize="11.5" fill={end.color} fontWeight="700">
            {endText(end.row, end.value)}
          </text>
        </g>
      ))}
    </svg>
    </div>
  );
}

interface LatestPointV158 {
  year: number;
  value: number;
}

/** A country's most recent year with a stated value, or null if it never has one. */
function latestPointV158(row: CountryCompareSeriesV158): LatestPointV158 | null {
  let best: LatestPointV158 | null = null;
  for (const point of row.points) {
    if (typeof point.value !== "number" || !Number.isFinite(point.value)) continue;
    if (!best || point.year > best.year) best = { year: point.year, value: point.value };
  }
  return best;
}

/**
 * A footnote naming each source, shown only when every drawn country states one
 * and they are not all the same. A silent shared axis would read as one method;
 * when a country left its source unstated there is nothing honest to compare it
 * against, so the note is withheld rather than shown half-filled.
 */
function sourceNoteTextV158(rows: CountryCompareSeriesV158[]): string | null {
  const sources = rows.map((row) => row.sourceOrg?.trim() || "");
  if (sources.some((source) => !source)) return null;
  if (new Set(sources).size < 2) return null;
  return `출처가 나라마다 달라 함께 표시합니다 · ${rows
    .map((row, index) => `${row.countryNameKo} ${sources[index]}`)
    .join(" · ")}`;
}

/**
 * Compares one element across countries, or renders nothing.
 *
 * Nothing is the common case while only one country is published: a block that
 * says "비교할 국가가 없습니다" would be noise on every detail page. A unit
 * mismatch is different - the reader asked for a comparison and cannot have one,
 * so the note says which country states which unit.
 */
/**
 * Two units are the same unit when they differ only in spacing or in writing
 * a power as a superscript ("km2" and "km²"). Nothing else is folded: a
 * different unit is still a different unit.
 */
export function sameUnitV158(left: string | null | undefined, right: string | null | undefined): boolean {
  const fold = (unit: string | null | undefined) =>
    String(unit ?? "").trim().replace(/²/gu, "2").replace(/³/gu, "3").replace(/ +/gu, " ");
  return fold(left) === fold(right);
}

export default function CountryCompareBlockV158({
  elementId,
  title,
  compareKey,
  series,
  mode = "auto",
}: CountryCompareBlockPropsV158) {
  const model = useMemo(() => {
    const matched = series.filter((row) => sameUnitV158(row.unit, compareKey.unit));
    const mismatched = series.filter((row) => !sameUnitV158(row.unit, compareKey.unit));
    const years = commonYearsV158(matched);
    const shape =
      mode !== "auto"
        ? mode
        : years.length >= MIN_YEARS_FOR_LINES_V158
          ? "multi-line"
          : "grouped-bars";
    return { matched, mismatched, years, shape };
  }, [series, compareKey.unit, mode]);

  // Nothing to compare: fewer than two countries state this unit, or the two
  // never carry a value for the same year. Say so only when a country was
  // dropped for its unit - otherwise the block adds nothing to the page.
  if (model.matched.length < 2 || model.years.length === 0) {
    // Two or more countries state the unit but never share a year: fall back to
    // each country's own latest value rather than showing nothing, as long as at
    // least two of them actually have one to show.
    if (model.years.length === 0 && model.matched.length >= 2) {
      const latestEach = model.matched
        .map((row) => ({ row, latest: latestPointV158(row) }))
        .filter(
          (entry): entry is { row: CountryCompareSeriesV158; latest: LatestPointV158 } =>
            entry.latest !== null
        );
      if (latestEach.length >= 2) {
        const sourceNote = sourceNoteTextV158(latestEach.map((entry) => entry.row));
        return (
          <section
            className="ccb158"
            data-testid="country-compare-v158"
            data-element-id={elementId}
            data-state="latest-each"
            data-year-rule={compareKey.yearRule}
          >
            <h4 className="ccb158__title"><PublicTermTextV134 text={title} /></h4>
            <ul className="ccb158__chips" aria-label="비교 국가">
              {latestEach.map(({ row }, index) => (
                <li key={row.countryIso3} data-testid="country-compare-chip-v158">
                  <span
                    className="ccb158__swatch"
                    style={{ background: COLORS_V158[index % COLORS_V158.length] }}
                    aria-hidden="true"
                  />
                  {row.countryNameKo}
                </li>
              ))}
            </ul>
            <p className="ccb158__latest-each" data-testid="country-compare-latest-each-v158">
              {latestEach
                .map(
                  ({ row, latest }) =>
                    `${row.countryNameKo} ${latest.value.toLocaleString("ko-KR")} (${latest.year})`
                )
                .join(" · ")}
            </p>
            {model.mismatched.length > 0 ? (
              <p className="ccb158__note" data-testid="country-compare-unit-note-v158">
                단위가 달라 제외: {model.mismatched.map((row) => `${row.countryNameKo} ${row.unit}`).join(" · ")}
              </p>
            ) : null}
            <p className="ccb158__note">
              비교 국가에 공통 연도가 없어 각 나라의 최신 값을 연도와 함께 표시합니다
            </p>
            {sourceNote ? (
              <p className="ccb158__note" data-testid="country-compare-source-note-v158">
                <PublicTermTextV134 text={sourceNote} />
              </p>
            ) : null}
          </section>
        );
      }
    }
    if (model.mismatched.length === 0) return null;
    return (
      <section
        className="ccb158"
        data-testid="country-compare-v158"
        data-element-id={elementId}
        data-state="unit-mismatch"
      >
        <h4 className="ccb158__title"><PublicTermTextV134 text={title} /></h4>
        <p className="ccb158__note" data-testid="country-compare-unit-note-v158">
          단위가 달라 함께 비교하지 않았습니다 · 기준 {compareKey.unit} ·{" "}
          {model.mismatched.map((row) => `${row.countryNameKo} ${row.unit}`).join(" · ")}
        </p>
      </section>
    );
  }

  const barYear = model.years[model.years.length - 1] ?? null;
  const drawnYears = model.shape === "multi-line" ? model.years : barYear === null ? [] : [barYear];
  const values = drawnYears.flatMap((year) =>
    model.matched.map((row) => valueAtV158(row, year)).filter((value): value is number => value !== null)
  );
  const max = values.length > 0 ? Math.max(...values) : 0;
  const min = values.length > 0 ? Math.min(0, ...values) : 0;
  const span = max - min || 1;
  const sourceNote = sourceNoteTextV158(model.matched);

  return (
    <section
      className="ccb158"
      data-testid="country-compare-v158"
      data-element-id={elementId}
      data-state={model.shape}
      data-year-rule={compareKey.yearRule}
    >
      <h4 className="ccb158__title"><PublicTermTextV134 text={title} /></h4>
      <ul className="ccb158__chips" aria-label="비교 국가">
        {model.matched.map((row, index) => (
          <li key={row.countryIso3} data-testid="country-compare-chip-v158">
            <span
              className="ccb158__swatch"
              style={{ background: COLORS_V158[index % COLORS_V158.length] }}
              aria-hidden="true"
            />
            {row.countryNameKo}
          </li>
        ))}
      </ul>

      {model.shape === "multi-line" ? (
        <MultiLineChartV164
          title={title}
          unit={compareKey.unit}
          years={model.years}
          rows={model.matched.map((row, index) => ({
            row,
            color: COLORS_V158[index % COLORS_V158.length],
          }))}
        />
      ) : (
        <table className="ccb158__bars" data-testid="country-compare-bars-v158">
          <caption>
            {barYear === null ? "공통 연도 없음" : `${barYear}년 · 단위 ${compareKey.unit}`}
          </caption>
          <tbody>
            {model.matched.map((row, index) => {
              const value = barYear === null ? null : valueAtV158(row, barYear);
              const width = value === null ? 0 : ((value - min) / span) * 100;
              return (
                <tr key={row.countryIso3} data-country={row.countryIso3}>
                  <th scope="row">{row.countryNameKo}</th>
                  <td>
                    <span
                      className="ccb158__bar"
                      style={{
                        width: `${width.toFixed(1)}%`,
                        background: COLORS_V158[index % COLORS_V158.length],
                      }}
                    />
                  </td>
                  <td className="num">{value === null ? "값 없음" : value.toLocaleString("ko-KR")}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}

      {model.mismatched.length > 0 ? (
        <p className="ccb158__note" data-testid="country-compare-unit-note-v158">
          단위가 달라 제외: {model.mismatched.map((row) => `${row.countryNameKo} ${row.unit}`).join(" · ")}
        </p>
      ) : null}
      {sourceNote ? (
        <p className="ccb158__note" data-testid="country-compare-source-note-v158">
          <PublicTermTextV134 text={sourceNote} />
        </p>
      ) : null}
      {/* V162 PR-D: the measure is named in the block's title; the note states
          the year rule in words and never the internal indicator key. */}
      {compareKey.yearRule === "latest-common" && model.shape !== "multi-line" ? (
        <p className="ccb158__note">연도 기준 · 두 국가가 모두 가진 최신 연도</p>
      ) : null}
    </section>
  );
}
