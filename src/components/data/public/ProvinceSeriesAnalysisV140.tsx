import { useEffect, useMemo, useState } from "react";
import type { SemanticObservationV125 } from "../../../data/visualization/semanticTypesV125";
import type { DataFinderSelectorStateV125 } from "../../../types/dataFinderV125";
import type { TimeSeriesV127 } from "../../../types/chartInteractionV127";
import InteractiveTimeSeriesChartV127 from "../../charts/InteractiveTimeSeriesChartV127";
import { formatPublicNumberV126 } from "../../../data/visualization/publicNumberFormatV126";
import { getPublicVisualizationSummaryV126 } from "../../../data/visualization/publicVisualizationRegistryV126";
import { PublicTermTextV134 } from "../../help/PublicTermV134";
import AnalysisSummaryTableV146 from "./AnalysisSummaryTableV146";
import { medianV146, signedBarV146 } from "../../../data/visualization/analysisMathV146";
import "./province-series-analysis-v140.css";

/**
 * Province-by-time observations (V140): B-033 annual tree-cover loss, C-016
 * planned capacity by technology and period, B-031/B-032 single-year forest
 * area and cover, B-034 forest carbon flux.
 *
 * The archetype drew one bar for the chosen province and a grid of record
 * keys. What a reader wants from a province series is the province's own
 * change over time, the same year's comparison across provinces, and a
 * table of the numbers - with the province, the measure and the year as
 * the controls, and with a card's hand-off (province, year, measure) landing
 * on the same view.
 *
 * Nothing is summed across provinces: a share or a per-province value is
 * compared, ranked and listed, never added into a national figure.
 */
interface Props {
  elementId: string;
  rows: SemanticObservationV125[];
  selectorState: DataFinderSelectorStateV125;
  onSelectorStateChange: (state: DataFinderSelectorStateV125) => void;
  elementTitle: string;
  primaryTitle?: string;
}

const ALL_REGIONS = "";
/**
 * Where the province values may be added into one figure: planned capacity
 * is a sum of plans (C-016). A loss, a share, a flux per hectare or a rate
 * is compared and ranked, never totalled here.
 */
const SUM_ALLOWED = new Set(["C-016"]);
const TOTAL_LIKE = /^(전국|합계|총계|total)$/iu;
const TOP_COUNT = 15;

type Row = SemanticObservationV125 & { value: number };

function isNumericRow(row: SemanticObservationV125): row is Row {
  return typeof row.value === "number" && Number.isFinite(row.value);
}

/** The dimension that holds the province, i.e. the one with the most values. */
export function provinceDimensionKeyV140(rows: SemanticObservationV125[]): string | null {
  const counts = new Map<string, Set<string>>();
  rows.forEach((row) => {
    Object.entries(row.dimensions).forEach(([key, value]) => {
      if (["year", "period", "entityType", "technology", "sex"].includes(key)) return;
      if (!counts.has(key)) counts.set(key, new Set());
      counts.get(key)!.add(value);
    });
  });
  const best = [...counts.entries()].sort((a, b) => b[1].size - a[1].size)[0];
  if (!best || best[1].size < 20) return null;
  // Twenty-plus values alone also describe GGGI's indicators or LCOE's
  // technologies; the dimension has to actually name provinces.
  const known = ["An Giang", "Hà Nội", "Hồ Chí Minh", "Quảng Ninh", "Nghệ An", "Đà Nẵng", "Lai Châu", "Cà Mau"];
  const values = [...best[1]].map((value) => value.normalize("NFC"));
  return known.filter((name) => values.includes(name)).length >= 2 ? best[0] : null;
}

export function provinceSeriesShapeV140(rows: SemanticObservationV125[]): boolean {
  return rows.some(isNumericRow) && provinceDimensionKeyV140(rows) !== null;
}

const timeOf = (row: SemanticObservationV125): string =>
  row.period && !/^\d{4}$/u.test(row.period) ? row.period : row.year !== null && row.year !== undefined ? String(row.year) : row.period || "";
const isYearTime = (time: string) => /^\d{4}$/u.test(time);

export default function ProvinceSeriesAnalysisV140({
  elementId,
  rows,
  selectorState,
  onSelectorStateChange,
  elementTitle,
  primaryTitle,
}: Props) {
  const regionKey = useMemo(() => provinceDimensionKeyV140(rows) || "detail", [rows]);
  const numeric = useMemo(() => rows.filter(isNumericRow), [rows]);

  // Measures that actually carry numbers, in the contract's order of appearance.
  const measures = useMemo(() => {
    const seen = new Map<string, { key: string; label: string; unit: string }>();
    numeric.forEach((row) => {
      if (!seen.has(row.semanticMeasure.key)) {
        seen.set(row.semanticMeasure.key, { key: row.semanticMeasure.key, label: row.semanticMeasure.labelKo, unit: row.semanticMeasure.unit });
      }
    });
    return [...seen.values()];
  }, [numeric]);
  const reviewedDefault = getPublicVisualizationSummaryV126(elementId)?.defaultMeasureKey;
  const measure =
    measures.find((entry) => entry.key === selectorState.measure) ||
    measures.find((entry) => entry.key === reviewedDefault) ||
    measures[0] ||
    null;
  const measureRows = useMemo(
    () => (measure ? numeric.filter((row) => row.semanticMeasure.key === measure.key) : []),
    [measure, numeric]
  );

  // Regions and times available for the chosen measure.
  const regions = useMemo(
    () =>
      [...new Set(measureRows.map((row) => row.dimensions[regionKey]).filter(Boolean))]
        .filter((region) => !TOTAL_LIKE.test(region))
        .sort((a, b) => a.localeCompare(b, "vi")),
    [measureRows, regionKey]
  );
  const times = useMemo(
    () =>
      [...new Set(measureRows.map(timeOf).filter(Boolean))].sort((a, b) => {
        const aYear = isYearTime(a);
        const bYear = isYearTime(b);
        if (aYear && bYear) return Number(b) - Number(a);
        if (aYear !== bYear) return aYear ? -1 : 1;
        return b.localeCompare(a);
      }),
    [measureRows]
  );
  const requestedRegion = selectorState.dimensions[regionKey] || ALL_REGIONS;
  const region = regions.includes(requestedRegion) ? requestedRegion : ALL_REGIONS;
  const requestedTime = selectorState.period && !/^\d{4}$/u.test(selectorState.period) ? selectorState.period : selectorState.year !== null ? String(selectorState.year) : selectorState.period || "";
  const time = times.includes(requestedTime) ? requestedTime : times[0] || "";
  const [tableOpen, setTableOpen] = useState(false);

  // Keep the URL on what is shown, so a shared link lands on the same view.
  useEffect(() => {
    if (!measure) return;
    const next: DataFinderSelectorStateV125 = {
      ...selectorState,
      measure: measure.key,
      year: isYearTime(time) ? Number(time) : null,
      period: isYearTime(time) ? null : time || null,
      dimensions: { ...selectorState.dimensions, ...(region ? { [regionKey]: region } : {}) },
    };
    if (!region) delete next.dimensions[regionKey];
    if (
      next.measure === selectorState.measure &&
      next.year === selectorState.year &&
      next.period === selectorState.period &&
      (selectorState.dimensions[regionKey] || "") === region
    ) {
      return;
    }
    onSelectorStateChange(next);
  }, [measure, onSelectorStateChange, region, regionKey, selectorState, time]);

  const valueAt = useMemo(
    () => (regionName: string, timeLabel: string) =>
      measureRows.find((row) => row.dimensions[regionKey] === regionName && timeOf(row) === timeLabel) || null,
    [measureRows, regionKey]
  );

  // Same time, every province: the comparison.
  const comparison = useMemo(
    () =>
      regions
        .map((name) => ({ region: name, row: valueAt(name, time) }))
        .filter((entry): entry is { region: string; row: Row } => Boolean(entry.row))
        .sort((a, b) => b.row.value - a.row.value),
    [regions, time, valueAt]
  );
  const values = comparison.map((entry) => entry.row.value);
  const median = medianV146(values);
  const total = SUM_ALLOWED.has(elementId) && values.length ? values.reduce((sum, value) => sum + value, 0) : null;

  // One province, every time: the series.
  const regionSeries = useMemo(
    () =>
      region
        ? measureRows
            .filter((row) => row.dimensions[regionKey] === region)
            .map((row) => ({ time: timeOf(row), value: row.value }))
            .filter((entry) => entry.time)
            .sort((a, b) => (isYearTime(a.time) && isYearTime(b.time) ? Number(a.time) - Number(b.time) : a.time.localeCompare(b.time)))
        : [],
    [measureRows, region, regionKey]
  );
  const yearPoints = regionSeries.filter((entry) => isYearTime(entry.time));
  const chartSeries: TimeSeriesV127[] = measure && yearPoints.length >= 3
    ? [{ id: region, label: `${region} · ${measure.label}`, unit: measure.unit, points: yearPoints.map((entry) => ({ id: entry.time, x: Number(entry.time), value: entry.value })) }]
    : [];

  // Other measures at the same region and time (C-016: the technologies).
  const acrossMeasures = useMemo(() => {
    if (!region || !measure || measures.length < 2) return [];
    return measures
      .filter((entry) => entry.unit === measure.unit)
      .map((entry) => {
        const row = numeric.find((candidate) => candidate.semanticMeasure.key === entry.key && candidate.dimensions[regionKey] === region && timeOf(candidate) === time);
        return row ? { label: entry.label, value: row.value, key: entry.key } : null;
      })
      .filter((entry): entry is { label: string; value: number; key: string } => Boolean(entry))
      .sort((a, b) => b.value - a.value);
  }, [measure, measures, numeric, region, regionKey, time]);

  if (!measure) {
    return <div className="pav126-empty" role="status">이 자료에는 수치 값이 없습니다.</div>;
  }

  const unit = measure.unit;
  const format = (value: number) => formatPublicNumberV126(value, unit);
  const selectedRow = region ? valueAt(region, time) : null;
  const rank = region ? comparison.findIndex((entry) => entry.region === region) + 1 : 0;
  const timeLabel = isYearTime(time) ? `${time}년` : time;
  const compareShown = comparison.slice(0, TOP_COUNT);
  const highlightIncluded = !region || compareShown.some((entry) => entry.region === region);
  const compareRows = highlightIncluded ? compareShown : [...compareShown, ...comparison.filter((entry) => entry.region === region)];

  const update = (patch: Partial<{ measure: string; region: string; time: string }>) => {
    const nextTime = patch.time ?? time;
    const nextRegion = patch.region ?? region;
    const dimensions = { ...selectorState.dimensions };
    if (nextRegion) dimensions[regionKey] = nextRegion;
    else delete dimensions[regionKey];
    onSelectorStateChange({
      ...selectorState,
      measure: patch.measure ?? measure.key,
      year: isYearTime(nextTime) ? Number(nextTime) : null,
      period: isYearTime(nextTime) ? null : nextTime || null,
      dimensions,
    });
  };

  return (
    <div className="psa140" data-testid="province-series-analysis-v140" data-region={region || "all"} data-time={time} data-measure={measure.key}>
      <div className="psa140__controls" role="group" aria-label="분석 조건">
        {measures.length > 1 && (
          <label>
            <span>항목 선택</span>
            <select value={measure.key} onChange={(event) => update({ measure: event.target.value })} data-testid="psa140-measure">
              {measures.map((entry) => (
                <option key={entry.key} value={entry.key}>{entry.label} · {entry.unit}</option>
              ))}
            </select>
          </label>
        )}
        <label>
          <span>지역 선택</span>
          <select value={region} onChange={(event) => update({ region: event.target.value })} data-testid="psa140-region">
            <option value={ALL_REGIONS}>전체 성·시 비교</option>
            {regions.map((name) => (
              <option key={name} value={name}>{name}</option>
            ))}
          </select>
        </label>
        {times.length > 1 && (
          <label>
            <span>{isYearTime(times[0]) ? "기준연도" : "기간"}</span>
            <select value={time} onChange={(event) => update({ time: event.target.value })} data-testid="psa140-time">
              {times.map((entry) => (
                <option key={entry} value={entry}>{isYearTime(entry) ? `${entry}년` : entry}</option>
              ))}
            </select>
          </label>
        )}
        <button type="button" className="psa140__table-toggle" aria-pressed={tableOpen} onClick={() => setTableOpen((open) => !open)}>
          {tableOpen ? "차트로 보기" : "표로 보기"}
        </button>
      </div>


      <section className="psa140__panel" aria-labelledby={`psa140-primary-${elementId}`}>
        <header className="psa140__heading">
          <span>주 분석</span>
          <h3 id={`psa140-primary-${elementId}`}>
            <PublicTermTextV134
              text={
                region
                  ? chartSeries.length ? `${region} ${measure.label} 추이` : `${region} ${measure.label} · ${timeLabel}`
                  : primaryTitle || `${elementTitle} 성·시별 비교 · ${timeLabel}`
              }
            />
          </h3>
        </header>
        {tableOpen ? (
          <div className="psa140__table-wrap" data-testid="psa140-table">
            <table>
              <caption>{region ? `${region} · ${measure.label} (${unit})` : `${measure.label} (${unit}) · ${timeLabel} · 성·시별`}</caption>
              <thead>
                <tr>
                  <th scope="col">{region ? (isYearTime(time) ? "연도" : "기간") : "성·시"}</th>
                  <th scope="col">값 ({unit})</th>
                  {!region && <th scope="col">순위</th>}
                </tr>
              </thead>
              <tbody>
                {region
                  ? regionSeries.map((entry) => (
                      <tr key={entry.time}>
                        <th scope="row">{entry.time}</th>
                        <td>{format(entry.value)}</td>
                      </tr>
                    ))
                  : comparison.map((entry, index) => (
                      <tr key={entry.region}>
                        <th scope="row">{entry.region}</th>
                        <td>{format(entry.row.value)}</td>
                        <td>{index + 1}</td>
                      </tr>
                    ))}
              </tbody>
            </table>
          </div>
        ) : region && chartSeries.length ? (
          <InteractiveTimeSeriesChartV127
            ariaLabel={`${region} ${measure.label} 추이`}
            series={chartSeries}
            unit={unit}
            xAxisTitle="연도"
            yAxisTitle={`${measure.label} (${unit})`}
            height={280}
            showDelta={false}
            tooltipMode="nearest-point"
            formatValue={format}
            testId="psa140-region-trend"
            zoom={{ enabled: yearPoints.length > 8, minimumSpan: 4, showRangeBrush: false }}
          />
        ) : region ? (
          <ul className="psa140__bars" data-testid="psa140-region-periods" aria-label={`${region} 기간별 값`}>
            {regionSeries.map((entry) => (
              <li key={entry.time}>
                <span>{entry.time}</span>
                <SignedBarV146 value={entry.value} values={regionSeries.map((row) => row.value)} />
                <strong>{format(entry.value)}</strong>
              </li>
            ))}
          </ul>
        ) : (
          <ul className="psa140__bars" data-testid="psa140-comparison" aria-label={`${timeLabel} 성·시별 ${measure.label}`}>
            {compareRows.map((entry, index) => (
              <li key={entry.region} className={entry.region === region ? "is-selected" : undefined}>
                <span>{index + 1}. {entry.region}</span>
                <SignedBarV146 value={entry.row.value} values={values} />
                <strong>{format(entry.row.value)}</strong>
              </li>
            ))}
          </ul>
        )}
        {!tableOpen && !region && comparison.length > TOP_COUNT && (
          <p className="psa140__notice">상위 {TOP_COUNT}개 성·시입니다. 전체 {comparison.length}개는 '표로 보기'에서 확인할 수 있습니다.</p>
        )}
      </section>

      {region && (
        <section className="psa140__panel" aria-labelledby={`psa140-secondary-${elementId}`}>
          <header className="psa140__heading">
            <span>보조 비교</span>
            <h3 id={`psa140-secondary-${elementId}`}>{timeLabel} 성·시별 비교 · {region} 위치</h3>
          </header>
          <ul className="psa140__bars" data-testid="psa140-comparison" aria-label={`${timeLabel} 성·시별 ${measure.label}`}>
            {compareRows.map((entry) => {
              const index = comparison.findIndex((candidate) => candidate.region === entry.region);
              return (
                <li key={entry.region} className={entry.region === region ? "is-selected" : undefined}>
                  <span>{index + 1}. {entry.region}</span>
                  <SignedBarV146 value={entry.row.value} values={values} />
                  <strong>{format(entry.row.value)}</strong>
                </li>
              );
            })}
          </ul>
          {comparison.length > TOP_COUNT && (
            <p className="psa140__notice">상위 {TOP_COUNT}개 성·시와 선택 지역입니다. 전체 순위는 '전체 성·시 비교'에서 '표로 보기'로 확인할 수 있습니다.</p>
          )}
        </section>
      )}

      {acrossMeasures.length > 1 && (
        <section className="psa140__panel" aria-labelledby={`psa140-measures-${elementId}`}>
          <header className="psa140__heading">
            <span>항목 비교</span>
            <h3 id={`psa140-measures-${elementId}`}>{region} · {timeLabel} · 항목별 값</h3>
          </header>
          <ul className="psa140__bars" data-testid="psa140-across-measures">
            {acrossMeasures.map((entry) => (
              <li key={entry.key} className={entry.key === measure.key ? "is-selected" : undefined}>
                <span><PublicTermTextV134 text={entry.label} /></span>
                <SignedBarV146 value={entry.value} values={acrossMeasures.map((row) => row.value)} />
                <strong>{format(entry.value)}</strong>
              </li>
            ))}
          </ul>
        </section>
      )}
      <AnalysisSummaryTableV146 title={`${timeLabel} · ${measure.label} 비교표`} rows={[
        ...(selectedRow ? [{ label: region, value: selectedRow.value, unit, context: `${timeLabel} · ${comparison.length}개 성·시 중 ${rank}위` }] : []),
        ...(total !== null ? [{ label: `${comparison.length}개 성·시 합계`, value: total, unit, context: `${timeLabel} · 계획 용량(설치 실적 아님)` }] : []),
        ...(median !== null ? [{ label: `${comparison.length}개 성·시 중앙값`, value: median, unit, context: timeLabel }] : []),
      ]} />
    </div>
  );
}

function SignedBarV146({ value, values }: { value: number; values: number[] }) {
  const bar = signedBarV146(value, values);
  return <i className="psa146-signed-bar" aria-hidden="true">
    {bar.signed && <em style={{ left: `${bar.zero}%` }} />}
    <b style={{ left: `${bar.left}%`, width: `${bar.width}%` }} />
  </i>;
}
