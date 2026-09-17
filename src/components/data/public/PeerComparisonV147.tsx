import type { SemanticObservationV125 } from "../../../data/visualization/semanticTypesV125";
import { publicDimensionValueV134 } from "../../../data/visualization/publicCopyRegistryV126";
import { publicIndicatorSeriesV144 } from "../../../data/visualization/publicIndicatorCopyV144";
import { formatValueV121 } from "../../../utils/vietnamActualV121";
import { AnalysisBarsV147 } from "./AnalysisChartsV147";

/** Peers are supplied by the caller under the same measure/time/other filters.
 * Do not group/average rows or sum parent and child categories. */
export default function PeerComparisonV147({ rows, selectedIds }: { rows: SemanticObservationV125[]; selectedIds: string[] }) {
  const numeric = rows.filter((r): r is SemanticObservationV125 & {value:number} => typeof r.value === "number" && Number.isFinite(r.value));
  if (numeric.length < 2 || new Set(numeric.map((r) => `${r.unit}|${r.year}|${r.period}`)).size !== 1) return null;
  const unit = numeric[0].unit || numeric[0].semanticMeasure.unit;
  const label = (r: SemanticObservationV125) => publicDimensionValueV134("category", r.dimensionLabels.category || r.dimensions.category || publicIndicatorSeriesV144(r));
  const definitions = Array.from(new Set(numeric.map((r) => r.dimensions.detail).filter(Boolean)));
  return <section className="detail146 analysis147-block" data-testid="peer-comparison-v147">
    <h3>{numeric[0].elementId === "D-004" ? "기술·크레딧 가격 시나리오별 비교" : "같은 기준연도·단위로 항목 비교"}</h3>
    {definitions.length === 1 && <p>{definitions[0]}</p>}
    <p className="detail146-note">{numeric[0].year || numeric[0].period} · {numeric[0].semanticMeasure.labelKo} · 단위: {unit}. 위에서 선택한 항목은 아래 표에 표시했습니다.</p>
    <AnalysisBarsV147 title="항목별 비교" unit={unit} rows={numeric.map((r) => ({id:r.recordId,label:label(r),value:r.value}))} />
    <details className="detail146-details"><summary>표로 보기 · 동일 조건 항목 비교</summary><div className="detail146-table"><table><caption>{numeric[0].semanticMeasure.labelKo} · {unit}</caption><thead><tr><th scope="col">항목</th><th scope="col">값</th><th scope="col">선택 여부</th></tr></thead><tbody>{numeric.map((r) => <tr key={r.recordId} className={selectedIds.includes(r.recordId) ? "analysis147-highlight" : undefined}><th scope="row">{label(r)}</th><td>{formatValueV121(r.value)}</td><td>{selectedIds.includes(r.recordId) ? "선택 항목" : ""}</td></tr>)}</tbody></table></div></details>
  </section>;
}
