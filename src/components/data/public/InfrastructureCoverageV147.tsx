import { useState } from "react";
import type { SemanticObservationV125 } from "../../../data/visualization/semanticTypesV125";
import { finiteV147 } from "../../../data/visualization/detailModelsV147";
import { formatValueV121 } from "../../../utils/vietnamActualV121";
import { AnalysisBarsV147 } from "./AnalysisChartsV147";

const LAYERS: Record<string, string> = { roads: "도로", railways: "철도", transport: "교통시설", traffic: "교통시설", waterways: "수로", natural: "자연지형·지물" };
const CLASSES: Record<string, string> = { residential: "주거지역 도로", service: "시설 진입·내부 도로", track: "농로·임도", footway: "보행로", unclassified: "기타 일반도로", path: "소로", tertiary: "3차 도로", secondary: "2차 도로", trunk: "간선도로", primary: "주요 도로", construction: "공사 중 도로", motorway: "고속도로", tree: "나무", peak: "봉우리", cave_entrance: "동굴 입구", beach: "해변", spring: "샘", volcano: "화산", cliff: "절벽", stream: "작은 하천", canal: "운하·용수로", river: "하천", drain: "배수로" };
export default function InfrastructureCoverageV147({ rows }: { rows: SemanticObservationV125[] }) {
  const counts = rows.filter((r) => r.indicatorId.endsWith("_feature_count") && finiteV147(r.value));
  const groups = counts.map((r) => ({ key: r.indicatorId.replace(/^[A-Z]-\d+_/u, "").replace(/_feature_count$/u, ""), row: r }));
  const [selected, setSelected] = useState("");
  const group = groups.find((g) => g.key === selected) || groups.find((g) => rows.some((r) => r.indicatorId.includes(`_${g.key}_fclass_`))) || groups[0];
  const classes = rows.filter((r) => r.indicatorId.includes(`_${group?.key}_fclass_`) && r.indicatorId.endsWith("_count") && finiteV147(r.value));
  const label = (r: SemanticObservationV125) => { const key = r.indicatorId.split("_fclass_")[1]?.replace(/_count$/u, ""); return CLASSES[key] || r.displayLabel; };
  return <section className="detail146" data-testid="infrastructure-coverage-v147">
    <h3>공간자료에 수록된 지물의 종류와 규모</h3>
    <p className="detail146-note">OpenStreetMap 자료에 기록된 구간·지점 수입니다. 실제 도로·하천·시설의 개수나 총연장으로 해석하지 않습니다.</p>
    <div className="detail146-table"><table><caption>자료 종류별 수록 지물 수</caption><thead><tr><th scope="col">자료 종류</th><th scope="col">수록 지물 수(건)</th><th scope="col">자료연도</th></tr></thead><tbody>{groups.map((g) => <tr key={g.key}><th scope="row">{LAYERS[g.key] || g.row.displayLabel}</th><td>{formatValueV121(g.row.value)}</td><td>{g.row.year}</td></tr>)}</tbody></table></div>
    <label className="detail146-select">분류별 비교<select aria-label="인프라 자료 종류" value={group?.key || ""} onChange={(e) => setSelected(e.target.value)}>{groups.map((g) => <option key={g.key} value={g.key}>{LAYERS[g.key] || g.row.displayLabel}</option>)}</select></label>
    {classes.length ? <><AnalysisBarsV147 title={`${LAYERS[group.key] || group.key} · 분류별 수록 건수`} unit="건" rows={classes.map((r) => ({ id: r.recordId, label: label(r), value: r.value as number }))} /><details className="detail146-details"><summary>표로 보기 · 분류별 수록 건수</summary><div className="detail146-table"><table><thead><tr><th scope="col">분류</th><th scope="col">건수</th><th scope="col">연도</th></tr></thead><tbody>{classes.map((r) => <tr key={r.recordId}><th scope="row">{label(r)}</th><td>{formatValueV121(r.value)}</td><td>{r.year}</td></tr>)}</tbody></table></div></details></> : <p className="detail146-note">이 자료에는 분류별 건수가 수록되어 있지 않습니다.</p>}
    <p className="detail146-note">공개된 분류만 비교합니다. 일부 자료의 분류별 합계는 전체 수록 건수와 다를 수 있습니다. 파일 형식·속성별 결측률은 아래 원자료에서 확인할 수 있습니다.</p>
  </section>;
}
