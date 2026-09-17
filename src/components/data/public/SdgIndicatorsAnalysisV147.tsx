import { useMemo, useState } from "react";
import type { SemanticObservationV125 } from "../../../data/visualization/semanticTypesV125";
import type { DataFinderSelectorStateV125 } from "../../../types/dataFinderV125";
import { formatValueV121 } from "../../../utils/vietnamActualV121";
import { AnalysisBarsV147 } from "./AnalysisChartsV147";

export default function SdgIndicatorsAnalysisV147({ rows, selectorState, onSelectorStateChange }: { rows: SemanticObservationV125[]; selectorState: DataFinderSelectorStateV125; onSelectorStateChange: (s: DataFinderSelectorStateV125) => void }) {
  const [order, setOrder] = useState("low");
  const goals = useMemo(() => Array.from(new Map(rows.map((r) => [r.semanticMeasure.key, r.semanticMeasure.labelKo])).entries()).sort((a,b) => a[1].localeCompare(b[1], "ko", {numeric:true})), [rows]);
  const key = goals.some(([k]) => k === selectorState.measure) ? selectorState.measure! : goals[0]?.[0];
  const selected = rows.filter((r) => r.semanticMeasure.key === key);
  const chartRows = selected.filter((r): r is SemanticObservationV125 & {value:number} => r.unit === "점" && r.dimensions.detail === "정규화 달성도 점수(0~100)" && typeof r.value === "number" && r.value >= 0 && r.value <= 100);
  const ordered = [...chartRows].sort((a,b) => order === "low" ? a.value-b.value : order === "high" ? b.value-a.value : a.displayLabel.localeCompare(b.displayLabel,"ko"));
  const label = (r: SemanticObservationV125) => r.dimensionLabels.category || r.dimensions.category || r.displayLabel;
  return <section className="detail146" data-testid="sdg-indicators-v147">
    <h3>목표별 세부지표 달성도</h3>
    <p className="detail146-note">원자료의 0~100점 환산 점수를 비교합니다. 지표별 기준연도가 다르며, 점수는 빈곤율·농도 같은 원래 측정값이 아닙니다.</p>
    <div className="detail146-list-controls"><label>목표<select aria-label="SDG 목표" value={key} onChange={(e) => onSelectorStateChange({...selectorState, measure:e.target.value, dimensions:{},year:null,period:null})}>{goals.map(([k,title]) => <option key={k} value={k}>{title}</option>)}</select></label><label>정렬<select aria-label="달성도 정렬" value={order} onChange={(e) => setOrder(e.target.value)}><option value="low">점수 낮은 순</option><option value="high">점수 높은 순</option><option value="name">지표명 순</option></select></label></div>
    <AnalysisBarsV147 title={goals.find(([k]) => k === key)?.[1] || "세부지표 점수"} unit="점(0~100)" maximum={100} rows={ordered.map((r) => ({id:r.recordId,label:`${label(r)} · ${r.year}년`,value:r.value}))} />
    <div className="detail146-table"><table><caption>지표별 점수와 기준연도 · 환산 점수의 합계·평균을 목표 종합점수로 사용하지 않습니다.</caption><thead><tr><th scope="col">지표</th><th scope="col">점수</th><th scope="col">기준연도</th><th scope="col">카드 선택</th></tr></thead><tbody>{selected.map((r) => <tr key={r.recordId}><th scope="row">{label(r)}</th><td>{formatValueV121(r.value)}</td><td>{r.year}</td><td>{selectorState.dimensions.category === r.dimensions.category && selectorState.year === r.year ? "선택 지표" : ""}</td></tr>)}</tbody></table></div>
  </section>;
}
