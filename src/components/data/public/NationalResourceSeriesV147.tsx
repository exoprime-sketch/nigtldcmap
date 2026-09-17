import { useMemo, useState } from "react";
import type { VietnamEntityV124 } from "../../../data/vietnam/vietnamTypesV124";
import { nationalSeriesV147 } from "../../../data/visualization/detailModelsV147";
import { formatValueV121 } from "../../../utils/vietnamActualV121";
import InteractiveTimeSeriesChartV127 from "../../charts/InteractiveTimeSeriesChartV127";
import { publicTextV126 } from "../../../data/visualization/publicFieldPolicyV126";
import "./detail-analysis-v146.css";
import "./detail-analysis-v147.css";

export default function NationalResourceSeriesV147({ entities }: { entities: VietnamEntityV124[] }) {
  const series = useMemo(() => nationalSeriesV147(entities), [entities]);
  const [selected, setSelected] = useState("");
  const own = series.find((s) => s.key === selected) || series.find((s) => s.points.filter((p) => p.value !== null).length > 2) || series[0];
  if (!own) return null;
  const numeric = own.points.filter((p) => p.value !== null);
  if (own.unitConflict) return <section className="detail146 analysis147-block" data-testid="national-resource-series-v147">
    <h3>전국 자료 · 항목별 연도 변화</h3>
    <label className="detail146-select">전국 자료 항목<select aria-label="전국 자료 항목" value={own.key} onChange={(e) => setSelected(e.target.value)}>{series.map((s) => <option key={s.key} value={s.key}>{s.label} · {s.unit}</option>)}</select></label>
    <p>선택 항목은 ‘개소 수’로 설명되어 있지만 원자료 단위는 ‘{own.unit}’입니다. 단위 확인 전에는 용량이나 시설 수로 비교하지 않습니다. 원문 값은 아래 원자료에서 확인할 수 있습니다.</p>
  </section>;
  return <section className="detail146 analysis147-block" data-testid="national-resource-series-v147">
    <h3>전국 자료 · 항목별 연도 변화</h3>
    <p className="detail146-note">위의 성·시 자료와 별도로 제공되는 전국 값입니다. 조사·위성 자료가 다른 계열은 합치지 않습니다.</p>
    <label className="detail146-select">전국 자료 항목<select aria-label="전국 자료 항목" value={own.key} onChange={(e) => setSelected(e.target.value)}>{series.map((s) => <option key={s.key} value={s.key}>{s.label} · {s.unit}</option>)}</select></label>
    {numeric.length > 1 && numeric.length === own.points.length ? <InteractiveTimeSeriesChartV127 key={own.key} title={own.label} ariaLabel={`${own.label} 전국 연도별 값`} unit={own.unit} xAxisTitle="연도" yAxisTitle={own.label} formatValue={formatValueV121} minimumVisibleSeries={1} series={[{ id: own.key, label: own.label, unit: own.unit, points: numeric.map((p) => ({ id: p.id, x: p.year, xLabel: `${p.year}년`, value: p.value as number })) }]} /> : <p className="detail146-note">{numeric.length ? "한 시점만 있거나 일부 값이 누락되어 연도 추이 대신 표로 제공합니다." : "선택 항목의 수치가 원자료에 없습니다. 0으로 표시하지 않습니다."}</p>}
    <details className="detail146-details" key={`table-${own.key}`} open={numeric.length < 2}><summary>표로 보기 · {own.label} · {own.points.length}개 연도</summary><div className="detail146-table"><table data-testid="national-series-table-v147"><caption>{own.label} · 단위: {own.unit} · 전국</caption><thead><tr><th scope="col">연도</th><th scope="col">값</th><th scope="col">자료 기준</th></tr></thead><tbody>{own.points.map((p) => <tr key={p.year}><th scope="row">{p.year}</th><td>{p.conflict ? "동일 연도 중복 · 비교 제외" : p.value === null ? "자료 없음" : formatValueV121(p.value)}</td><td>{(publicTextV126(p.note) || "").replace(/^전국\s*·\s*/u, "") || "원자료 표기 없음"}</td></tr>)}</tbody></table></div></details>
  </section>;
}
