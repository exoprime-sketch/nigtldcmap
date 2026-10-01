import { publicEntityTitleV131 } from "../../../data/visualization/publicEntityTitleV131";
import DumbbellChartV153 from "../../charts/DumbbellChartV153";
import { useState } from "react";
import type { VietnamEntityV124 } from "../../../data/vietnam/vietnamTypesV124";
import { finiteV147 } from "../../../data/visualization/detailModelsV147";
import { formatValueV121 } from "../../../utils/vietnamActualV121";
import { AnalysisBarsV147 } from "./AnalysisChartsV147";
import { PublicTermTextV134 } from "../../help/PublicTermV134";
import { useRegionTextV162 } from "../../../data/geo/regionDisplayV162";
import { publicRegionNameV138 } from "./PublicRegionScenarioSummaryV138";
import { firstAttributeV162, REGION_NAME_KEYS_V162, rowsForPreReformViewV162 } from "../../../data/geo/regionSystemV162";

const DIRECTIONS = [["N_북_비율", "북"], ["NE_북동_비율", "북동"], ["E_동_비율", "동"], ["SE_남동_비율", "남동"], ["S_남_비율", "남"], ["SW_남서_비율", "남서"], ["W_서_비율", "서"], ["NW_북서_비율", "북서"]];
export function FlowDirectionAnalysisV147({ entities }: { entities: VietnamEntityV124[] }) {
  // V162: the 63-unit rows only; the sheet's 34-unit rows are the other system.
  const regions = rowsForPreReformViewV162(entities).filter((r) => DIRECTIONS.some(([key]) => finiteV147(r.normalizedAttributes?.[key])));
  const [selected, setSelected] = useState("");
  // V162 (P12-B): B-026's provinces are the 63 pre-2025 units; "AnGiang"
  // is spaced as the source means it, then shown "한글명 (현지명)".
  const regionText = useRegionTextV162("B-026");
  const own = regions.find((r) => r.recordId === selected) || regions[0];
  if (!own) return <p>현재 방향별 비율 자료가 없습니다.</p>;
  const a = own.normalizedAttributes || {};
  const regionLabel = (r: VietnamEntityV124) => regionText(publicRegionNameV138(String(firstAttributeV162(r.normalizedAttributes, REGION_NAME_KEYS_V162) || r.name)));
  const values = DIRECTIONS.map(([key, label]) => ({ id: key, label, value: finiteV147(a[key]) ? a[key] as number : null }));
  return <section className="detail146" data-testid="flow-direction-v147">
    <h3>선택 성·시의 8방향 비율</h3><p className="detail146-note">지형 격자에서 물이 흘러가는 방향의 비율입니다. 하천의 유량이나 강수량은 아닙니다. 원자료의 개편 전 63개 성·시 경계를 기준으로 합니다.</p>
    <label className="detail146-select">지역<select aria-label="유향 지역" value={own.recordId} onChange={(e) => setSelected(e.target.value)}>{regions.map((r) => <option key={r.recordId} value={r.recordId}>{regionLabel(r)}</option>)}</select></label>
    <section className="d153-block" data-analysis-block="category-bar"><AnalysisBarsV147 title={`${regionLabel(own)} · 8방향별 격자 비율`} unit="%" maximum={100} rows={values} /></section>
    <div className="detail146-table" data-analysis-block="table"><table><caption><PublicTermTextV134 text={`${regionLabel(own)} · HydroSHEDS DIR 15s · 비율 합계는 반올림으로 100%와 다를 수 있습니다.`} /></caption><thead><tr><th scope="col">방향</th><th scope="col">비율(%)</th></tr></thead><tbody>{values.map((v) => <tr key={v.id}><th scope="row">{v.label}</th><td>{formatValueV121(v.value)}</td></tr>)}</tbody></table></div>
  </section>;
}

// V162: the 2026-09-30 delivery names the columns "자국 내 …" and adds a
// GIS-derived row per HydroBASINS main basin; the pre-V162 keys stay as a fallback.
const BASIN_MEASURES: Array<[string, string, string[]]> = [
  ["total-literature", "전체 유역 면적(문헌)", ["총_유역면적_km_문헌", "총_유역면적_km"]],
  ["inside-literature", "베트남 내 면적(문헌)", ["자국_내_면적_km_문헌", "베트남_내_면적_km_문헌"]],
  ["inside-gis", "베트남 내 면적(GIS 산출)", ["자국_내_면적_km_GIS_산출", "베트남_내_면적_km_GIS_산출"]],
];
const basinValueV162 = (r: VietnamEntityV124, keys: string[]): number | null => {
  for (const key of keys) {
    const value = r.normalizedAttributes?.[key];
    if (finiteV147(value)) return value as number;
  }
  return null;
};
const basinTextV162 = (r: VietnamEntityV124, keys: string[]): string => {
  for (const key of keys) {
    const value = r.normalizedAttributes?.[key];
    if (value !== null && value !== undefined && String(value).trim()) return String(value).trim();
  }
  return "";
};
const isNationalBasinRowV162 = (r: VietnamEntityV124) =>
  r.name === "전국 집계" ||
  /^country$/iu.test(basinTextV162(r, ["개체_구분_Basin_Country"])) ||
  /전국 집계|National aggregate/iu.test(basinTextV162(r, ["유역명_원천_표기"]));
export function BasinAreaAnalysisV147({ entities }: { entities: VietnamEntityV124[] }) {
  // The named basins (the source's eight) carry the literature values; the
  // HydroBASINS main basins are GIS-derived and listed apart below.
  const named = entities.filter((r) => !isNationalBasinRowV162(r) && basinValueV162(r, BASIN_MEASURES[0][2]) !== null);
  const rows = named.length > 0 ? named : entities.filter((r) => !isNationalBasinRowV162(r));
  const gisBasins = entities
    .filter((r) => !isNationalBasinRowV162(r) && !named.includes(r) && basinTextV162(r, ["유역_ID_HydroBASINS_MAIN_BAS"]))
    .sort((a, b) => (basinValueV162(b, BASIN_MEASURES[2][2]) ?? -1) - (basinValueV162(a, BASIN_MEASURES[2][2]) ?? -1));
  const [measure, setMeasure] = useState(BASIN_MEASURES[0][0]);
  const selected = BASIN_MEASURES.find(([k]) => k === measure)!;
  const label = selected[1];
  const nameOf = (r: VietnamEntityV124) => publicEntityTitleV131(r) || "유역명 미기재";
  return <>
  <section className="detail146" data-testid="basin-area-v147">
    <h3>유역 전체 면적과 베트남 내 면적</h3><p className="detail146-note"><PublicTermTextV134 text="국경을 넘는 유역 전체와 베트남에 속한 면적을 구분합니다. 문헌 값과 GIS 산출값은 계산 기준이 달라 별도로 제공합니다." /></p>
    {/* Each basin holds its whole area and the part inside Viet Nam: a pair
        on one axis (V153 contract: dumbbell). Rows missing either value stay
        in the bars and the table below, never invented. */}
    {(() => {
      const pairs = rows.flatMap((r) => {
        const total = basinValueV162(r, BASIN_MEASURES[0][2]);
        const inside = basinValueV162(r, BASIN_MEASURES[2][2]);
        return total !== null && inside !== null
          ? [{ id: r.recordId, label: nameOf(r), low: { label: "베트남 내 면적(GIS 산출)", value: inside }, high: { label: "전체 유역 면적(문헌)", value: total } }]
          : [];
      });
      return pairs.length > 0 ? (
        <section className="d153-block" data-analysis-block="dumbbell" data-testid="basin-area-dumbbell-v153">
          <DumbbellChartV153 rows={pairs} unit="km²" xAxis="면적" yAxis="유역" ariaLabel="유역별 전체 면적과 베트남 내 면적" testId="basin-area-dumbbell-chart-v153" />
        </section>
      ) : null;
    })()}
    {/* V162: the area basis picks the bars below, not the pair chart above -
        so it sits here, beside the chart it changes. */}
    <label className="detail146-select">면적 기준<select aria-label="유역 면적 기준" value={measure} onChange={(e) => setMeasure(e.target.value)}>{BASIN_MEASURES.map(([key, title]) => <option key={key} value={key}>{title}</option>)}</select></label>
    <section className="d153-block" data-analysis-block="category-bar"><AnalysisBarsV147 title={label} unit="km²" rows={rows.map((r) => ({ id: r.recordId, label: nameOf(r), value: basinValueV162(r, selected[2]) }))} /></section>
    <div className="detail146-table" data-analysis-block="table"><table><caption>8대 유역 면적 비교 · km² · 전국 집계 행 제외</caption><thead><tr><th scope="col">유역</th>{BASIN_MEASURES.map(([k, t]) => <th key={k} scope="col">{t}</th>)}<th scope="col">국경 공유</th></tr></thead><tbody>{rows.map((r) => <tr key={r.recordId}><th scope="row">{nameOf(r)}</th>{BASIN_MEASURES.map(([k, , keys]) => <td key={k}>{formatValueV121(basinValueV162(r, keys))}</td>)}<td>{basinTextV162(r, ["국경_공유_수계_구분", "국경_공유"]) || "미기재"}</td></tr>)}</tbody></table></div>
    <p className="detail146-note">현재 지도에는 유역 경계가 제공되지 않습니다. 대표 위치를 유역 전체 범위로 해석하지 마세요.</p>
  </section>
    {gisBasins.length > 0 ? (
      <details className="detail146 detail146-details" data-testid="basin-gis-table-v162">
        <summary>HydroBASINS 유역별 베트남 내 면적(GIS 산출) · {gisBasins.length}개 유역</summary>
        <p className="detail146-note">원천이 이름 없이 HydroBASINS 유역 ID로 구분한 유역입니다. 8대 유역(문헌)과 기준이 달라 합산하지 않습니다.</p>
        <div className="detail146-table"><table><caption>HydroBASINS 유역 · km² · 베트남 내 면적이 큰 순</caption><thead><tr><th scope="col">유역</th><th scope="col">국내 완결·국제 공유</th><th scope="col">베트남 내 면적(GIS 산출)</th><th scope="col">전체 유역 면적(GIS 산출)</th></tr></thead><tbody>{gisBasins.map((r) => <tr key={r.recordId}><th scope="row">{`HydroBASINS 유역 ${basinTextV162(r, ["유역_ID_HydroBASINS_MAIN_BAS"])}`}</th><td>{basinTextV162(r, ["유역_구분_국내_완결_국제_공유"]) || "미기재"}</td><td>{formatValueV121(basinValueV162(r, ["자국_내_면적_km_GIS_산출"]))}</td><td>{formatValueV121(basinValueV162(r, ["총_유역면적_km_GIS_산출"]))}</td></tr>)}</tbody></table></div>
      </details>
    ) : null}
  </>;
}
