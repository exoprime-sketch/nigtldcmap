import { useMemo } from "react";

import type { VietnamEntityV124 } from "../../../data/vietnam/vietnamTypesV124";
import { publicTextV126 } from "../../../data/visualization/publicFieldPolicyV126";
import { formatPublicNumberV126 } from "../../../data/visualization/publicNumberFormatV126";
import { PublicTermTextV134 } from "../../help/PublicTermV134";
import "./public-portfolio-summary-v132.css";

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
}

const WRI_INDICATOR = "A-023_power_plant_registry";

const text = (value: unknown): string => publicTextV126(value) || "";

/**
 * WRI rows name their fuel in `primaryFuel` (English), OSM rows in
 * `fuelType` (Korean). Reading only `fuelType` put every WRI plant under
 * "미표기" (V140).
 */
const FUEL_LABELS: Record<string, string> = {
  hydro: "수력",
  solar: "태양광",
  wind: "풍력",
  coal: "석탄",
  gas: "가스",
  oil: "석유",
  biomass: "바이오매스",
  waste: "폐기물",
  nuclear: "원자력",
  geothermal: "지열",
};

function fuelOf(attributes: Record<string, unknown>): string {
  const typed = text(attributes.fuelType);
  if (typed && typed !== "(미표기)") return typed;
  const primary = text(attributes.primaryFuel).toLowerCase();
  if (primary && FUEL_LABELS[primary]) return FUEL_LABELS[primary];
  if (primary) return text(attributes.primaryFuel);
  return "미표기";
}

function capacityOf(attributes: Record<string, unknown>): number | null {
  for (const key of ["capacityMw", "mw"]) {
    const raw = attributes[key];
    const value = typeof raw === "number" ? raw : Number(text(raw));
    if (Number.isFinite(value) && text(raw) !== "") return value;
  }
  return null;
}

export default function PowerPlantRegistrySummaryV138({ entities }: Props) {
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

  if (!summary.total) return null;

  return (
    <section
      className="pps132"
      data-testid="power-plant-registry-summary-v138"
      data-source-rows={summary.total}
      data-located-rows={summary.located}
    >
      <header className="pps132-heading">
        <p>
          두 원천(WRI GPPD, OpenStreetMap)의 수록 행을 각각 셉니다. 두 원천은 공통 식별자가 없어 같은 발전소가 양쪽에 있을 수 있으므로 고유 시설 수를 합쳐 세지 않습니다.
        </p>
      </header>
      <div className="pps132-kpis">
        <article data-portfolio-kpi="wri-rows">
          <span>WRI GPPD 수록 발전소</span>
          <strong>{summary.wri.toLocaleString("ko-KR")}</strong>
          <small>기</small>
        </article>
        <article data-portfolio-kpi="osm-rows">
          <span>OpenStreetMap 추출 시설</span>
          <strong>{summary.osm.toLocaleString("ko-KR")}</strong>
          <small>곳</small>
        </article>
        <article data-portfolio-kpi="located-rows">
          <span>위치자료 보유(지도 표시)</span>
          <strong>{summary.located.toLocaleString("ko-KR")}</strong>
          <small>곳</small>
        </article>
        {summary.wriCapacity.count > 0 && (
          <article data-portfolio-kpi="wri-capacity">
            <span><PublicTermTextV134 text="WRI 설비용량 합계" /></span>
            <strong>{formatPublicNumberV126(summary.wriCapacity.total, "MW")}</strong>
            <small><PublicTermTextV134 text={`MW · 용량 있는 ${summary.wriCapacity.count.toLocaleString("ko-KR")}기`} /></small>
          </article>
        )}
        {summary.osmCapacity.count > 0 && (
          <article data-portfolio-kpi="osm-capacity">
            <span><PublicTermTextV134 text="OSM 설비용량 합계" /></span>
            <strong>{formatPublicNumberV126(summary.osmCapacity.total, "MW")}</strong>
            <small><PublicTermTextV134 text={`MW · 용량 있는 ${summary.osmCapacity.count.toLocaleString("ko-KR")}곳 · OSM 시설 ${summary.osm.toLocaleString("ko-KR")}곳 중`} /></small>
          </article>
        )}
      </div>
      <div className="pps132-distributions">
        <section className="pps132-distribution pps132-distribution--table" data-portfolio-distribution="true" data-testid="power-plant-fuel-distribution-v138">
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
                  <td>{summary.wriCapacity.count > 0 ? `${formatPublicNumberV126(summary.wriCapacity.total, "MW")} · ${summary.wriCapacity.count.toLocaleString("ko-KR")}기 (미기재 ${(summary.wri - summary.wriCapacity.count).toLocaleString("ko-KR")}기)` : "—"}</td>
                  <td>{summary.osm.toLocaleString("ko-KR")}</td>
                  <td>{summary.osmCapacity.count > 0 ? `${formatPublicNumberV126(summary.osmCapacity.total, "MW")} · ${summary.osmCapacity.count.toLocaleString("ko-KR")}곳 (미기재 ${(summary.osm - summary.osmCapacity.count).toLocaleString("ko-KR")}곳)` : "—"}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="pps132-note">
            원천 수록 행은 WRI {summary.wri.toLocaleString("ko-KR")}행 · OSM {summary.osm.toLocaleString("ko-KR")}행(합계 {summary.total.toLocaleString("ko-KR")}행)이며, OSM 시설 대부분은 설비용량이 기재되지 않아 용량 합계는 기재된 시설만 더한 값입니다.
          </p>
        </section>
      </div>
    </section>
  );
}
