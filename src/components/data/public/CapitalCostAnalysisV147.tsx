import type { SemanticObservationV125 } from "../../../data/visualization/semanticTypesV125";
import { uniqueNumericV147 } from "../../../data/visualization/detailModelsV147";
import { formatValueV121 } from "../../../utils/vietnamActualV121";
import { AnalysisBarsV147 } from "./AnalysisChartsV147";

const TECHNOLOGIES = [["biomass", "바이오에너지"], ["hydro_large", "대수력(50MW 초과)"], ["hydro_small", "소수력(50MW 미만)"], ["solar_pv", "태양광"], ["waste_to_energy", "폐자원 에너지"], ["wind", "풍력"]];
export default function CapitalCostAnalysisV147({ rows }: { rows: SemanticObservationV125[] }) {
  const own = rows.filter((r) => r.year === 2024 && r.unit === "USD/kW");
  const value = (id: string) => uniqueNumericV147(own.filter((r) => r.indicatorId === `D-001_capex_${id}`));
  const values = TECHNOLOGIES.map(([id,label]) => ({id,label,value:value(id),min:value(`${id}_min`),max:value(`${id}_max`)}));
  return <section className="detail146" data-testid="capital-cost-v147">
    <h3>기술별 설비용량당 투자비 · 2024년 자료</h3>
    <p className="detail146-note">사업의 총투자액을 설비용량으로 나눈 표본 중앙값입니다. 실제 사업비 견적이 아니며, 입지·규모·공사 조건에 따라 달라질 수 있습니다.</p>
    <section className="d153-block" data-analysis-block="category-bar"><AnalysisBarsV147 title="기술별 투자비 중앙값" unit="USD/kW" rows={values} /></section>
    <div className="detail146-table" data-analysis-block="table"><table><caption>2024년 · 단위 USD/kW · 하한·상한은 원자료에 제시된 표본 범위</caption><thead><tr><th scope="col">기술</th><th scope="col">표본 하한</th><th scope="col">중앙값</th><th scope="col">표본 상한</th></tr></thead><tbody>{values.map((r) => <tr key={r.id}><th scope="row">{r.label}</th><td>{r.min === null ? "미제공" : formatValueV121(r.min)}</td><td>{formatValueV121(r.value)}</td><td>{r.max === null ? "미제공" : formatValueV121(r.max)}</td></tr>)}</tbody></table></div>
    <p className="detail146-note">범위가 없는 기술은 중앙값만 제공합니다. 표본 하한·상한을 신뢰구간으로 해석하지 않습니다.</p>
  </section>;
}
