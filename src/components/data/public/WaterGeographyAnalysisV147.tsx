import { useState } from "react";
import type { VietnamEntityV124 } from "../../../data/vietnam/vietnamTypesV124";
import { finiteV147 } from "../../../data/visualization/detailModelsV147";
import { formatValueV121 } from "../../../utils/vietnamActualV121";
import { AnalysisBarsV147 } from "./AnalysisChartsV147";
import { PublicTermTextV134 } from "../../help/PublicTermV134";

const DIRECTIONS = [["N_북_비율", "북"], ["NE_북동_비율", "북동"], ["E_동_비율", "동"], ["SE_남동_비율", "남동"], ["S_남_비율", "남"], ["SW_남서_비율", "남서"], ["W_서_비율", "서"], ["NW_북서_비율", "북서"]];
export function FlowDirectionAnalysisV147({ entities }: { entities: VietnamEntityV124[] }) {
  const regions = entities.filter((r) => DIRECTIONS.some(([key]) => finiteV147(r.normalizedAttributes?.[key])));
  const [selected, setSelected] = useState("");
  const own = regions.find((r) => r.recordId === selected) || regions[0];
  if (!own) return <p>현재 방향별 비율 자료가 없습니다.</p>;
  const a = own.normalizedAttributes || {};
  const regionLabel = (r: VietnamEntityV124) => String(r.normalizedAttributes?.["지역명_베트남어"] || r.normalizedAttributes?.["지역명_로마자"] || r.name);
  const values = DIRECTIONS.map(([key, label]) => ({ id: key, label, value: finiteV147(a[key]) ? a[key] as number : null }));
  return <section className="detail146" data-testid="flow-direction-v147">
    <h3>선택 성·시의 8방향 비율</h3><p className="detail146-note">지형 격자에서 물이 흘러가는 방향의 비율입니다. 하천의 유량이나 강수량은 아닙니다. 원자료의 개편 전 63개 성·시 경계를 기준으로 합니다.</p>
    <label className="detail146-select">지역<select aria-label="유향 지역" value={own.recordId} onChange={(e) => setSelected(e.target.value)}>{regions.map((r) => <option key={r.recordId} value={r.recordId}>{regionLabel(r)}</option>)}</select></label>
    <AnalysisBarsV147 title={`${regionLabel(own)} · 8방향별 격자 비율`} unit="%" maximum={100} rows={values} />
    <div className="detail146-table"><table><caption><PublicTermTextV134 text={`${regionLabel(own)} · HydroSHEDS DIR 15s · 비율 합계는 반올림으로 100%와 다를 수 있습니다.`} /></caption><thead><tr><th scope="col">방향</th><th scope="col">비율(%)</th></tr></thead><tbody>{values.map((v) => <tr key={v.id}><th scope="row">{v.label}</th><td>{formatValueV121(v.value)}</td></tr>)}</tbody></table></div>
  </section>;
}

const BASIN_MEASURES = [["총_유역면적_km", "전체 유역 면적(문헌)"], ["베트남_내_면적_km_문헌", "베트남 내 면적(문헌)"], ["베트남_내_면적_km_GIS_산출", "베트남 내 면적(GIS 산출)"]];
export function BasinAreaAnalysisV147({ entities }: { entities: VietnamEntityV124[] }) {
  const rows = entities.filter((r) => r.name !== "전국 집계");
  const [measure, setMeasure] = useState(BASIN_MEASURES[0][0]);
  const label = BASIN_MEASURES.find(([k]) => k === measure)![1];
  return <section className="detail146" data-testid="basin-area-v147">
    <h3>유역 전체 면적과 베트남 내 면적</h3><p className="detail146-note"><PublicTermTextV134 text="국경을 넘는 유역 전체와 베트남에 속한 면적을 구분합니다. 문헌 값과 GIS 산출값은 계산 기준이 달라 별도로 제공합니다." /></p>
    <label className="detail146-select">면적 기준<select aria-label="유역 면적 기준" value={measure} onChange={(e) => setMeasure(e.target.value)}>{BASIN_MEASURES.map(([key, title]) => <option key={key} value={key}>{title}</option>)}</select></label>
    <AnalysisBarsV147 title={label} unit="km²" rows={rows.map((r) => ({ id: r.recordId, label: r.name || "유역명 미기재", value: finiteV147(r.normalizedAttributes?.[measure]) ? r.normalizedAttributes[measure] as number : null }))} />
    <div className="detail146-table"><table><caption>8대 유역 면적 비교 · km² · 전국 집계 행 제외</caption><thead><tr><th scope="col">유역</th>{BASIN_MEASURES.map(([k,t]) => <th key={k} scope="col">{t}</th>)}<th scope="col">국경 공유</th></tr></thead><tbody>{rows.map((r) => <tr key={r.recordId}><th scope="row">{r.name}</th>{BASIN_MEASURES.map(([k]) => <td key={k}>{formatValueV121(r.normalizedAttributes?.[k])}</td>)}<td>{String(r.normalizedAttributes?.["국경_공유"] || "미기재")}</td></tr>)}</tbody></table></div>
    <p className="detail146-note">현재 지도에는 유역 경계가 제공되지 않습니다. 대표 위치를 유역 전체 범위로 해석하지 마세요.</p>
  </section>;
}
