import { useMemo, useState } from "react";
import type { DataFinderSelectorStateV125 } from "../../../types/dataFinderV125";
import { AnalysisBarsV147 } from "./AnalysisChartsV147";

import type { VietnamEntityV124 } from "../../../data/vietnam/vietnamTypesV124";
import { powerPlantCapacityMwV141, powerPlantFuelV141, normalisedPowerPlantAttributesV141, POWER_PLANT_CAPACITY_BANDS_V141 } from "../../../data/map/powerPlantFactsV141";
import { resolvePublicEntityTitleV131 } from "../../../data/visualization/publicEntityTitleV131";
import { publicSourceUrlV126 } from "../../../data/visualization/publicFieldPolicyV126";
import { formatPublicNumberV126 } from "../../../data/visualization/publicNumberFormatV126";
import { PublicTermTextV134 } from "../../help/PublicTermV134";
import { PROVINCE_KO_34_V151 } from "../../../data/map/adminBoundaryV151";
import FacilityCardV153 from "./FacilityCardV153";
import "./public-portfolio-summary-v132.css";
import "./detail-analysis-v153.css";
import "./detail-analysis-v146.css";

/**
 * A-023 counts, each named for what it counts.
 *
 * The screen carried one KPI - "발전소 개체 수 236" - beside a list of 1,963
 * rows and a map of 1,889 points, and nothing said how the three related. They
 * are three different things: WRI's Global Power Plant Database rows, the
 * OpenStreetMap extraction rows, and the rows among both that carry a
 * coordinate. The two registries share no identifier, so no "unique plant"
 * figure is asserted; where the two describe the same site is a review task,
 * and capacity is summed per registry so a plant is never added to itself.
 */
interface Props {
  entities: VietnamEntityV124[];
  selectorState: DataFinderSelectorStateV125;
  onSelectorStateChange: (state: DataFinderSelectorStateV125) => void;
}

const WRI_INDICATOR = "A-023_power_plant_registry";

/**
 * Fuel and capacity are read by the shared A-023 reading
 * (`powerPlantFactsV141`), the same one the map's symbols, filters and
 * counts use, so a WRI plant is 수력 · 1 MW on every screen.
 */
function fuelOf(attributes: Record<string, unknown>): string {
  return powerPlantFuelV141(attributes) || "미기재";
}

function capacityOf(attributes: Record<string, unknown>): number | null {
  return powerPlantCapacityMwV141(attributes);
}

export default function PowerPlantRegistrySummaryV138({ entities: sourceEntities, selectorState, onSelectorStateChange }: Props) {
  const registry = selectorState.dimensions.sourceKey === "all" ? "all" : selectorState.dimensions.sourceKey === "osm" ? "osm" : "wri";
  const fuel = selectorState.dimensions.fuelType || "all";
  const band = selectorState.dimensions.capacityBand || "all";
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(0);
  // V153: the plant the reader picked from the list, shown as a label-form card.
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const normalized = useMemo(() => sourceEntities.map((r) => ({ ...r, normalizedAttributes: normalisedPowerPlantAttributesV141(r.normalizedAttributes || {}, r.indicatorId, r.provenance?.referenceYear) })), [sourceEntities]);
  const fuels = useMemo(() => [...new Set(normalized.map((r) => String(r.normalizedAttributes.fuelType || "")).filter(Boolean))].sort(), [normalized]);
  const entities = useMemo(() => normalized.filter((r) => (fuel === "all" || (r.normalizedAttributes.fuelType || "미기재") === fuel) && (band === "all" || r.normalizedAttributes.capacityBand === band)), [normalized, fuel, band]);
  const change = (key: string, value: string) => { setPage(0); onSelectorStateChange({ ...selectorState, dimensions: { ...selectorState.dimensions, [key]: value } }); };
  const plantList = useMemo(() => entities.filter((r) => registry === "all" || r.normalizedAttributes.sourceKey === registry).map((r) => ({ row: r, name: resolvePublicEntityTitleV131(r, { elementTitle: "발전소" }).title })).filter((r) => !query || r.name.toLocaleLowerCase().includes(query.toLocaleLowerCase())).sort((a, b) => a.name.localeCompare(b.name, "vi")), [entities, registry, query]);
  const summary = useMemo(() => {
    const wri = entities.filter((entity) => entity.indicatorId === WRI_INDICATOR);
    const osm = entities.filter((entity) => entity.indicatorId !== WRI_INDICATOR);
    const located = entities.filter(
      (entity) => typeof entity.latitude === "number" && typeof entity.longitude === "number"
    );
    const sumCapacity = (rows: VietnamEntityV124[]) => {
      let total = 0;
      let count = 0;
      rows.forEach((entity) => {
        const value = capacityOf((entity.normalizedAttributes || {}) as Record<string, unknown>);
        if (value === null) return;
        total += value;
        count += 1;
      });
      return { total, count };
    };
    // Per registry and per fuel: how many rows, and the capacity those rows
    // state. Kept apart because the registries overlap by an unknown amount.
    const byFuel = new Map<string, { wri: number; osm: number; wriMw: number; osmMw: number; wriStated: number; osmStated: number }>();
    entities.forEach((entity) => {
      const attributes = (entity.normalizedAttributes || {}) as Record<string, unknown>;
      const label = fuelOf(attributes);
      const entry = byFuel.get(label) || { wri: 0, osm: 0, wriMw: 0, osmMw: 0, wriStated: 0, osmStated: 0 };
      const capacity = capacityOf(attributes);
      if (entity.indicatorId === WRI_INDICATOR) {
        entry.wri += 1;
        if (capacity !== null) { entry.wriMw += capacity; entry.wriStated += 1; }
      } else {
        entry.osm += 1;
        if (capacity !== null) { entry.osmMw += capacity; entry.osmStated += 1; }
      }
      byFuel.set(label, entry);
    });
    return {
      total: entities.length,
      wri: wri.length,
      osm: osm.length,
      located: located.length,
      wriCapacity: sumCapacity(wri),
      osmCapacity: sumCapacity(osm),
      fuel: [...byFuel].sort((a, b) => b[1].wri + b[1].osm - (a[1].wri + a[1].osm)),
    };
  }, [entities]);

  const pageIndex = Math.min(page, Math.max(0, Math.ceil(plantList.length / 20) - 1));
  const selectedPlant = plantList.find((item) => item.row.recordId === selectedId) || null;
  const provinceOf = (a: Record<string, unknown>) => {
    const name = String(a.adm1Name34 || "");
    if (!name) return "미기재";
    const korean = PROVINCE_KO_34_V151[String(a.adm1Code34 || "")];
    return korean ? `${korean}(${name})` : name;
  };

  const registries: Array<"wri" | "osm"> = registry === "all" ? ["wri", "osm"] : [registry];
  const sourceName = (key: string) => key === "wri" ? "WRI GPPD · 2021년" : "OpenStreetMap · 2026년 추출";
  const sourceLabel = registry === "all" ? "두 출처 함께 · 중복 가능" : sourceName(registry);

  return (
    <section
      className="pps132"
      data-testid="power-plant-registry-summary-v138"
      data-source-rows={summary.total}
      data-located-rows={summary.located}
    >
      <header className="pps132-heading">
        <p>
          발전원별로 시설이 얼마나 많고 설비용량이 얼마나 큰지 비교할 수 있습니다. 같은 발전소가 두 출처에 중복될 수 있어, 출처를 나누어 집계합니다.
        </p>
      </header>
      <div className="detail146">
        <div className="detail146-select">
          <label>자료 출처 <select value={registry} onChange={(event) => change("sourceKey", event.target.value)}><option value="wri">WRI GPPD · 2021년</option><option value="osm">OpenStreetMap · 2026년 추출</option><option value="all">두 출처 함께 · 따로 집계</option></select></label>
          <label>발전원 <select value={fuel} onChange={(event) => change("fuelType", event.target.value)}><option value="all">전체 발전원</option>{fuels.map((f) => <option key={f}>{f}</option>)}</select></label>
          <label>설비용량 <select value={band} onChange={(event) => change("capacityBand", event.target.value)}><option value="all">전체 용량</option>{POWER_PLANT_CAPACITY_BANDS_V141.map((b) => <option key={b}>{b}</option>)}</select></label>
        </div>
        {registries.map((key) => {
          const rows = summary.fuel.filter(([, e]) => e[key] > 0);
          const capacityRows = rows.map(([label, e]) => ({ id: label, label, value: e[key === "wri" ? "wriStated" : "osmStated"] ? e[key === "wri" ? "wriMw" : "osmMw"] : null })).sort((a, b) => (b.value || 0) - (a.value || 0));
          const countRows = rows.map(([label, e]) => ({ id: label, label, value: e[key] })).sort((a, b) => b.value - a.value);
          return <section key={key}><section className="d153-block" data-analysis-block="category-bar"><AnalysisBarsV147 rows={capacityRows} title={`발전원별 설비용량 · ${sourceName(key)}`} unit="MW" xAxis="설비용량" yAxis="발전원" /></section><section className="d153-block" data-analysis-block="category-bar"><AnalysisBarsV147 rows={countRows} title={`발전원별 시설 수 · ${sourceName(key)}`} unit={key === "wri" ? "기" : "곳"} xAxis="시설 수" yAxis="발전원" /></section>{!rows.length && <p role="status">선택한 조건의 시설이 없습니다. 출처·발전원·설비용량 조건을 바꿔 주세요.</p>}</section>;
        })}
        {/* The registry totals, stated in a sentence (V153): the table below is folded. */}
        <p data-testid="power-plant-registry-totals-v153">
          {registries.includes("wri") && summary.wriCapacity.count > 0 ? `WRI 수록 발전소 설비용량 합계 ${formatPublicNumberV126(summary.wriCapacity.total, "MW")} MW · 2021년 · ${summary.wri.toLocaleString("ko-KR")}기 중 용량 기재 ${summary.wriCapacity.count.toLocaleString("ko-KR")}기. ` : ""}
          {registries.includes("osm") && summary.osmCapacity.count > 0 ? `OSM 추출 시설 설비용량 합계 ${formatPublicNumberV126(summary.osmCapacity.total, "MW")} MW · 2026년 · ${summary.osm.toLocaleString("ko-KR")}곳 중 용량 기재 ${summary.osmCapacity.count.toLocaleString("ko-KR")}곳.` : ""}
        </p>
        <p className="detail146-note">설비용량은 값이 기재된 시설만 합산했습니다. 두 출처는 수록 범위와 기준시점이 달라, 출처를 바꿨을 때의 차이를 증감으로 해석할 수 없습니다.</p>
      </div>
      <details className="detail146-details"><summary>표로 보기 · 출처별 발전원·시설 수·설비용량</summary>
      <div className="pps132-distributions">
        <section className="pps132-distribution pps132-distribution--table" data-analysis-block="sorted-table" data-portfolio-distribution="true" data-testid="power-plant-fuel-distribution-v138">
          <h5>발전원별 시설 수와 설비용량 · 원천별</h5>
          <div className="pps132-table-wrap">
            <table>
              <caption>WRI GPPD(2021)와 OpenStreetMap(2026 추출)의 발전원별 시설 수와 그 시설이 기재한 설비용량 합계. 두 원천은 합치지 않습니다.</caption>
              <thead>
                <tr>
                  <th scope="col">발전원</th>
                  <th scope="col">WRI 발전소(기)</th>
                  <th scope="col">WRI 설비용량(MW) · 용량 기재</th>
                  <th scope="col">OSM 시설(곳)</th>
                  <th scope="col">OSM 설비용량(MW) · 용량 기재</th>
                </tr>
              </thead>
              <tbody>
                {summary.fuel.map(([label, entry]) => (
                  <tr key={label} data-fuel={label}>
                    <th scope="row"><PublicTermTextV134 text={label} /></th>
                    <td>{entry.wri.toLocaleString("ko-KR")}</td>
                    <td>{entry.wriStated > 0 ? `${formatPublicNumberV126(entry.wriMw, "MW")} · ${entry.wriStated.toLocaleString("ko-KR")}기` : "—"}</td>
                    <td>{entry.osm.toLocaleString("ko-KR")}</td>
                    <td>{entry.osmStated > 0 ? `${formatPublicNumberV126(entry.osmMw, "MW")} · ${entry.osmStated.toLocaleString("ko-KR")}곳` : "—"}</td>
                  </tr>
                ))}
                {/* Each registry's own total, on the same rows as the fuel
                    lines above; the two totals are never added together. */}
                <tr className="pps132-total-row" data-testid="power-plant-fuel-total-v140">
                  <th scope="row">합계(원천별)</th>
                  <td>{summary.wri.toLocaleString("ko-KR")}</td>
                  <td>{summary.wriCapacity.count > 0 ? `${formatPublicNumberV126(summary.wriCapacity.total, "MW")} MW · ${summary.wriCapacity.count.toLocaleString("ko-KR")}기 (미기재 ${(summary.wri - summary.wriCapacity.count).toLocaleString("ko-KR")}기)` : "—"}</td>
                  <td>{summary.osm.toLocaleString("ko-KR")}</td>
                  <td>{summary.osmCapacity.count > 0 ? `${formatPublicNumberV126(summary.osmCapacity.total, "MW")} MW · ${summary.osmCapacity.count.toLocaleString("ko-KR")}곳 (미기재 ${(summary.osm - summary.osmCapacity.count).toLocaleString("ko-KR")}곳)` : "—"}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="pps132-note">
            원천 수록 행은 WRI {summary.wri.toLocaleString("ko-KR")}행 · OSM {summary.osm.toLocaleString("ko-KR")}행(합계 {summary.total.toLocaleString("ko-KR")}행)이며, OSM 시설 대부분은 설비용량이 기재되지 않아 용량 합계는 기재된 시설만 더한 값입니다.
          </p>
        </section>
      </div>
      </details>
      <section className="detail146" data-testid="power-plant-list-v148">
        <h3>발전소 목록 · {sourceLabel}</h3>
        <label>시설명 검색 <input type="search" value={query} onChange={(event) => { setQuery(event.target.value); setPage(0); }} placeholder="발전소 이름" /></label>
        <p>{plantList.length.toLocaleString("ko-KR")}곳 · 이름순 · {pageIndex + 1}/{Math.max(1, Math.ceil(plantList.length / 20))}쪽</p>
        <div className="pps132-table-wrap" data-analysis-block="table"><table><caption>선택한 출처·발전원·설비용량 조건의 시설 목록. 위치는 아래 지도에서 확인할 수 있습니다.</caption>
          <thead><tr><th scope="col">시설명</th><th scope="col">발전원</th><th scope="col">설비용량(MW)</th><th scope="col">소유·운영</th><th scope="col">소재지(34개 기준)</th><th scope="col">원문</th></tr></thead>
          <tbody>{plantList.slice(pageIndex * 20, (pageIndex + 1) * 20).map(({ row: r, name }) => { const a = r.normalizedAttributes; const url = publicSourceUrlV126(String(a.sourceUrl || r.provenance.sourceUrl || "")); return <tr key={r.recordId} data-selected={selectedId === r.recordId ? "true" : "false"}><th scope="row"><button type="button" className="d153-list-button" aria-pressed={selectedId === r.recordId} onClick={() => setSelectedId(selectedId === r.recordId ? null : r.recordId)}>{name}</button></th><td>{String(a.fuelType || "미기재")}</td><td>{capacityOf(a) === null ? "미기재" : formatPublicNumberV126(capacityOf(a)!, "MW")}</td><td>{String(a.owner || a.operator || a.field_4cf75655 || "미기재")}</td><td>{provinceOf(a)}</td><td>{url ? <a href={url} target="_blank" rel="noreferrer">출처 확인</a> : "—"}</td></tr>; })}</tbody>
        </table></div>
        {selectedPlant ? (
          <div className="d153-selected" data-analysis-block="cards-list" data-testid="power-plant-selected-v153">
            <FacilityCardV153 elementId="A-023" entity={selectedPlant.row} title={selectedPlant.name} />
          </div>
        ) : <p className="detail146-note">시설명을 누르면 국가·명칭·발전원·소유·운영·설비용량·가동 연도·소재지·자료 출처 카드가 열립니다.</p>}
        <div className="detail146-select"><button type="button" disabled={pageIndex === 0} onClick={() => setPage(pageIndex - 1)}>이전 시설</button><button type="button" disabled={(pageIndex + 1) * 20 >= plantList.length} onClick={() => setPage(pageIndex + 1)}>다음 시설</button></div>
      </section>
    </section>
  );
}
