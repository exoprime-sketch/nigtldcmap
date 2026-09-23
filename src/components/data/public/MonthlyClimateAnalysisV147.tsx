import { useMemo } from "react";
import type { SemanticObservationV125 } from "../../../data/visualization/semanticTypesV125";
import { monthlyClimateV147 } from "../../../data/visualization/detailModelsV147";
import InteractiveTimeSeriesChartV127 from "../../charts/InteractiveTimeSeriesChartV127";
import { formatValueV121 } from "../../../utils/vietnamActualV121";
import { AnalysisBarsV147 } from "./AnalysisChartsV147";

export default function MonthlyClimateAnalysisV147({ rows }: { rows: SemanticObservationV125[] }) {
  const months = useMemo(() => monthlyClimateV147(rows), [rows]);
  return <section className="detail146" data-testid="monthly-climate-v147">
    <h3>월별 강수량과 기온 · 1991~2020년 평년값</h3>
    <p className="detail146-note">30년 평균으로 본 베트남의 계절 변화입니다. 특정 연도의 관측값이나 모든 지역의 건기·우기 일정을 뜻하지 않습니다.</p>
    <div className="analysis147-months" aria-label="월별 건기·우기 구분">{months.map((m) => <span key={m.month} data-wet={m.season === "우기"}>{m.month}월<b>{m.season}</b></span>)}</div>
    <section className="d153-block" data-analysis-block="category-bar">
      <AnalysisBarsV147 title="월별 평년 강수량" unit="mm" rows={months.map((m) => ({ id: String(m.month), label: `${m.month}월 · ${m.season}`, value: m.precipitation }))} />
    </section>
    {months.every((m) => m.temperature !== null) && <section className="d153-block" data-analysis-block="line"><InteractiveTimeSeriesChartV127 title="월별 평년 기온" ariaLabel="1월부터 12월까지 평년 기온" unit="℃" xAxisTitle="월" yAxisTitle="평년 기온" formatValue={formatValueV121} minimumVisibleSeries={1} series={[{ id: "temperature", label: "월평균 기온", unit: "℃", points: months.map((m) => ({ id: `month-${m.month}`, x: m.month, xLabel: `${m.month}월`, value: m.temperature as number })) }]} /></section>}
    <p className="detail146-note">건기·우기는 원자료의 전국 분류를 표시했습니다. 원자료는 월강수량과 기준 월평균강수량(147.8 mm)을 비교해 분류합니다.</p>
    <details className="detail146-details" data-analysis-block="table"><summary>표로 보기 · 12개월</summary><div className="detail146-table"><table>
      <caption>1991~2020년 평년값 · World Bank CCKP / CRU TS 4.09</caption>
      <thead><tr><th scope="col">월</th><th scope="col">강수량(mm)</th><th scope="col">기온(℃)</th><th scope="col">구분</th></tr></thead>
      <tbody>{months.map((m) => <tr key={m.month}><th scope="row">{m.month}월</th><td>{formatValueV121(m.precipitation)}</td><td>{formatValueV121(m.temperature)}</td><td>{m.season}</td></tr>)}</tbody>
    </table></div></details>
  </section>;
}
