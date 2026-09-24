import { useMemo } from "react";

import "./country-compare-v158.css";

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

/**
 * Compares one element across countries, or renders nothing.
 *
 * Nothing is the common case while only one country is published: a block that
 * says "비교할 국가가 없습니다" would be noise on every detail page. A unit
 * mismatch is different - the reader asked for a comparison and cannot have one,
 * so the note says which country states which unit.
 */
export default function CountryCompareBlockV158({
  elementId,
  title,
  compareKey,
  series,
  mode = "auto",
}: CountryCompareBlockPropsV158) {
  const model = useMemo(() => {
    const matched = series.filter((row) => row.unit.trim() === compareKey.unit.trim());
    const mismatched = series.filter((row) => row.unit.trim() !== compareKey.unit.trim());
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
    if (model.mismatched.length === 0) return null;
    return (
      <section
        className="ccb158"
        data-testid="country-compare-v158"
        data-element-id={elementId}
        data-state="unit-mismatch"
      >
        <h4 className="ccb158__title">{title}</h4>
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

  return (
    <section
      className="ccb158"
      data-testid="country-compare-v158"
      data-element-id={elementId}
      data-state={model.shape}
      data-year-rule={compareKey.yearRule}
    >
      <h4 className="ccb158__title">{title}</h4>
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
        <svg
          className="ccb158__chart"
          viewBox="0 0 320 160"
          role="img"
          aria-label={`${title} · ${model.matched.map((row) => row.countryNameKo).join(", ")}`}
          data-testid="country-compare-lines-v158"
        >
          {model.matched.map((row, index) => (
            <polyline
              key={row.countryIso3}
              fill="none"
              stroke={COLORS_V158[index % COLORS_V158.length]}
              strokeWidth="2"
              data-country={row.countryIso3}
              points={model.years
                .map((year, position) => {
                  const value = valueAtV158(row, year) ?? min;
                  const x = model.years.length === 1 ? 160 : (position / (model.years.length - 1)) * 300 + 10;
                  const y = 150 - ((value - min) / span) * 130;
                  return `${x.toFixed(1)},${y.toFixed(1)}`;
                })
                .join(" ")}
            />
          ))}
        </svg>
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
      <p className="ccb158__note">
        비교 지표 {compareKey.indicatorId} · 연도 규칙{" "}
        {compareKey.yearRule === "latest-common" ? "두 국가가 모두 가진 최신 연도" : compareKey.yearRule}
      </p>
    </section>
  );
}
