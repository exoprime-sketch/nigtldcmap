import { useEffect, useMemo, useState } from "react";
import type { CSSProperties } from "react";
import type { SemanticObservationV125 } from "../../../data/visualization/semanticTypesV125";
import type { DataFinderSelectorStateV125 } from "../../../types/dataFinderV125";
import { PublicTermTextV134 } from "../../help/PublicTermV134";
import "./context-specialized-analysis-v134.css";

interface Props {
  rows: SemanticObservationV125[];
  selectorState: DataFinderSelectorStateV125;
  onSelectorStateChange: (state: DataFinderSelectorStateV125) => void;
  primaryTitle?: string;
  secondaryTitle?: string;
}

type NumericSpeiRowV134 = SemanticObservationV125 & { value: number; year: number };
type ScenarioKeyV134 = "ssp245" | "ssp585";
type ScenarioV134 = {
  key: ScenarioKeyV134;
  label: string;
  indicatorId: string;
  color: string;
  dash: string;
};

const SCENARIOS_V134: readonly ScenarioV134[] = Object.freeze([
  { key: "ssp245", label: "SSP2-4.5", indicatorId: "B-005_spei12_ssp245", color: "#1677a5", dash: "" },
  { key: "ssp585", label: "SSP5-8.5", indicatorId: "B-005_spei12_ssp585", color: "#b64c3d", dash: "9 5" },
]);
const COMPARISON_YEARS_V134 = [2050, 2075, 2100] as const;
const SVG_WIDTH_V134 = 900;
const SVG_HEIGHT_V134 = 390;
const PLOT_V134 = { left: 64, right: 24, top: 25, bottom: 58 } as const;

const speiNumberV134 = new Intl.NumberFormat("ko-KR", {
  maximumFractionDigits: 2,
  minimumFractionDigits: 0,
});

function isNumericSpeiRowV134(row: SemanticObservationV125): row is NumericSpeiRowV134 {
  return typeof row.value === "number" && Number.isFinite(row.value) && typeof row.year === "number";
}

function speiStateV134(value: number): string {
  if (value < 0) return "평년보다 건조";
  if (value > 0) return "평년보다 습윤";
  return "평년 수준";
}

function signedSpeiV134(value: number): string {
  return `${value > 0 ? "+" : ""}${speiNumberV134.format(value)}`;
}

export default function SpeiDroughtScenarioAnalysisV134({
  rows,
  selectorState,
  onSelectorStateChange,
  primaryTitle = "시나리오별 SPEI-12 전망",
  secondaryTitle = "선택연도 시나리오 비교",
}: Props) {
  const scenarioRows = useMemo(
    () =>
      rows
        .filter(isNumericSpeiRowV134)
        .filter((row) => SCENARIOS_V134.some((scenario) => scenario.indicatorId === row.indicatorId)),
    [rows]
  );
  const years = useMemo(
    () => Array.from(new Set(scenarioRows.map((row) => row.year))).sort((a, b) => a - b),
    [scenarioRows]
  );
  const selectedYear =
    selectorState.year && COMPARISON_YEARS_V134.includes(selectorState.year as (typeof COMPARISON_YEARS_V134)[number])
      ? selectorState.year
      : 2100;
  const [activeYear, setActiveYear] = useState<number>(selectedYear);
  useEffect(() => {
    setActiveYear(selectedYear);
  }, [selectedYear]);
  const grouped = SCENARIOS_V134.map((scenario) => ({
    ...scenario,
    rows: scenarioRows
      .filter((row) => row.indicatorId === scenario.indicatorId)
      .sort((left, right) => left.year - right.year),
  }));
  const minimumYear = years[0] ?? 2015;
  const maximumYear = years[years.length - 1] ?? 2100;
  const maximumAbsolute = Math.max(...scenarioRows.map((row) => Math.abs(row.value)), 0.5);
  const yMaximum = Math.max(0.5, Math.ceil(maximumAbsolute * 10) / 10);
  const plotWidth = SVG_WIDTH_V134 - PLOT_V134.left - PLOT_V134.right;
  const plotHeight = SVG_HEIGHT_V134 - PLOT_V134.top - PLOT_V134.bottom;
  const x = (year: number) => PLOT_V134.left + ((year - minimumYear) / Math.max(1, maximumYear - minimumYear)) * plotWidth;
  const y = (value: number) => PLOT_V134.top + ((yMaximum - value) / (yMaximum * 2)) * plotHeight;
  const yTicks = [-yMaximum, -yMaximum / 2, 0, yMaximum / 2, yMaximum];
  const xTicks = [minimumYear, 2030, 2050, 2075, maximumYear].filter((year, index, all) => year >= minimumYear && year <= maximumYear && all.indexOf(year) === index);
  const activeValues = grouped.map((scenario) => ({
    ...scenario,
    value: scenario.rows.find((row) => row.year === activeYear)?.value ?? null,
  }));
  const comparison = grouped.map((scenario) => ({
    ...scenario,
    value: scenario.rows.find((row) => row.year === selectedYear)?.value ?? null,
  }));
  const comparisonMaximum = Math.max(...comparison.map((item) => Math.abs(item.value ?? 0)), 0.01);

  if (scenarioRows.length === 0) {
    return <div className="pav126-empty" role="status">SPEI-12 전망 관측값이 없습니다.</div>;
  }

  return (
    <div
      className="sda134"
      data-fake-threshold="false"
      data-scenario-count={grouped.filter((scenario) => scenario.rows.length > 0).length}
      data-testid="b005-specialized-analysis"
      data-zero-reference="true"
    >
      <section className="sda134__meaning" aria-labelledby="sda134-meaning-title" data-testid="b005-spei-meaning">
        <div>
          <span>지수 읽는 법</span>
          <h3 id="sda134-meaning-title"><PublicTermTextV134 text="SPEI-12는 무엇을 나타내나요?" /></h3>
        </div>
        <ul>
          <li>최근 12개월의 강수량과 잠재증발산량을 함께 반영한 표준화 강수증발산지수입니다.</li>
          <li>0 주변은 평년 수준, 음수는 평년보다 건조, 양수는 평년보다 습윤함을 뜻합니다.</li>
          <li>임의의 가뭄 심각도 구간을 만들지 않고 원천에 공개된 연도별 지수를 비교합니다.</li>
        </ul>
      </section>

      <section className="sda134__panel" aria-labelledby="sda134-trend-title">
        <header className="sda134__heading">
          <div>
            <span>주 분석</span>
            <h3 id="sda134-trend-title"><PublicTermTextV134 text={primaryTitle} /></h3>
            <p><PublicTermTextV134 text={`${minimumYear}–${maximumYear}년 · 단위 SPEI 지수 · 0을 평년 기준선으로 표시`} /></p>
          </div>
          <div className="sda134__legend" aria-label="기후 시나리오">
            {SCENARIOS_V134.map((scenario) => <span key={scenario.key}><i style={{ backgroundColor: scenario.color }} aria-hidden="true" /><PublicTermTextV134 text={scenario.label} /></span>)}
          </div>
        </header>

        <div className="sda134__chart" data-testid="b005-scenario-trend" onMouseLeave={() => setActiveYear(selectedYear)}>
          <svg role="img" aria-label={`SPEI-12 ${minimumYear}년부터 ${maximumYear}년까지 시나리오별 전망`} viewBox={`0 0 ${SVG_WIDTH_V134} ${SVG_HEIGHT_V134}`}>
            <rect className="sda134__band sda134__band--wet" x={PLOT_V134.left} y={PLOT_V134.top} width={plotWidth} height={y(0) - PLOT_V134.top} />
            <rect className="sda134__band sda134__band--dry" x={PLOT_V134.left} y={y(0)} width={plotWidth} height={PLOT_V134.top + plotHeight - y(0)} />
            {yTicks.map((tick) => <g key={tick}><line className={tick === 0 ? "sda134__zero" : "sda134__grid"} data-testid={tick === 0 ? "b005-spei-zero-reference" : undefined} x1={PLOT_V134.left} x2={PLOT_V134.left + plotWidth} y1={y(tick)} y2={y(tick)} /><text x={PLOT_V134.left - 10} y={y(tick) + 4} textAnchor="end">{signedSpeiV134(tick)}</text></g>)}
            {xTicks.map((tick) => <g key={tick}><line className="sda134__grid" x1={x(tick)} x2={x(tick)} y1={PLOT_V134.top} y2={PLOT_V134.top + plotHeight} /><text x={x(tick)} y={PLOT_V134.top + plotHeight + 25} textAnchor="middle">{tick}</text></g>)}
            <text className="sda134__axis-title" x={PLOT_V134.left + plotWidth / 2} y={SVG_HEIGHT_V134 - 8} textAnchor="middle">연도</text>
            <text className="sda134__axis-title" transform={`translate(17 ${PLOT_V134.top + plotHeight / 2}) rotate(-90)`} textAnchor="middle">가뭄지수</text>
            {grouped.map((scenario) => {
              const path = scenario.rows.map((row, index) => `${index === 0 ? "M" : "L"}${x(row.year).toFixed(2)},${y(row.value).toFixed(2)}`).join(" ");
              return <path key={scenario.key} className="sda134__scenario-line" d={path} fill="none" stroke={scenario.color} strokeDasharray={scenario.dash || undefined} />;
            })}
            <line className="sda134__active-line" x1={x(activeYear)} x2={x(activeYear)} y1={PLOT_V134.top} y2={PLOT_V134.top + plotHeight} />
            {activeValues.map((item) => item.value === null ? null : <circle key={item.key} cx={x(activeYear)} cy={y(item.value)} fill="#fff" r="5" stroke={item.color} strokeWidth="3" />)}
            {years.map((year, index) => {
              const left = index === 0 ? PLOT_V134.left : (x(years[index - 1]) + x(year)) / 2;
              const right = index === years.length - 1 ? PLOT_V134.left + plotWidth : (x(year) + x(years[index + 1])) / 2;
              const values = grouped.map((scenario) => ({ label: scenario.label, value: scenario.rows.find((row) => row.year === year)?.value })).filter((item) => typeof item.value === "number");
              return <rect key={year} aria-hidden="true" className="sda134__hit" height={plotHeight} onClick={() => setActiveYear(year)} onMouseEnter={() => setActiveYear(year)} width={Math.max(2, right - left)} x={left} y={PLOT_V134.top} />;
            })}
          </svg>
          <div className="sda134__tooltip" aria-live="polite" data-testid="b005-spei-tooltip">
            <strong>{activeYear}년</strong>
            {activeValues.map((item) => <span key={item.key}><i style={{ backgroundColor: item.color }} aria-hidden="true" /><PublicTermTextV134 text={item.label} /> <b>{item.value === null ? "미공개" : signedSpeiV134(item.value)}</b>{item.value === null ? "" : ` · ${speiStateV134(item.value)}`}</span>)}
          </div>
        </div>
        <label className="sda134__year-explorer">
          <span>차트 탐색 연도</span>
          <input
            aria-label="SPEI-12 차트 탐색 연도"
            max={maximumYear}
            min={minimumYear}
            onChange={(event) => setActiveYear(Number(event.target.value))}
            step="1"
            type="range"
            value={activeYear}
          />
          <strong>{activeYear}년</strong>
        </label>
        <div className="sda134__sign-key" aria-label="SPEI 부호의 의미"><span><i className="is-wet" />양수 · 평년보다 습윤</span><span><i className="is-dry" />음수 · 평년보다 건조</span></div>
      </section>

      <section className="sda134__panel" aria-labelledby="sda134-comparison-title" data-testid="b005-selected-year-comparison">
        <header className="sda134__heading sda134__heading--selector">
          <div><span>보조 분석</span><h3 id="sda134-comparison-title"><PublicTermTextV134 text={secondaryTitle} /></h3></div>
          <div className="sda134__year-buttons" aria-label="비교 연도">
            {COMPARISON_YEARS_V134.map((year) => <button aria-pressed={selectedYear === year} className={selectedYear === year ? "is-selected" : ""} key={year} onClick={() => { setActiveYear(year); onSelectorStateChange({ ...selectorState, year }); }} type="button">{year}년</button>)}
          </div>
        </header>
        <div className="sda134__diverging" role="list" aria-label={`${selectedYear}년 시나리오별 SPEI-12`}>
          {comparison.map((item) => {
            const width = item.value === null ? 0 : (Math.abs(item.value) / comparisonMaximum) * 100;
            return <div key={item.key} role="listitem"><span><PublicTermTextV134 text={item.label} /></span><div className="sda134__negative"><i style={{ "--sda134-width": `${item.value !== null && item.value < 0 ? width : 0}%`, "--sda134-color": item.color } as CSSProperties} /></div><b aria-hidden="true" /><div className="sda134__positive"><i style={{ "--sda134-width": `${item.value !== null && item.value > 0 ? width : 0}%`, "--sda134-color": item.color } as CSSProperties} /></div><strong>{item.value === null ? "미공개" : `${signedSpeiV134(item.value)} · ${speiStateV134(item.value)}`}</strong></div>;
          })}
        </div>
        <p className="sda134__notice">0을 중심으로 부호와 크기를 비교합니다. 원천에 없는 가뭄 심각도 기준은 적용하지 않습니다.</p>
      </section>
    </div>
  );
}
