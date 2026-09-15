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
    const fuel = new Map<string, number>();
    entities.forEach((entity) => {
      const attributes = (entity.normalizedAttributes || {}) as Record<string, unknown>;
      const label = text(attributes.fuelType) || "미표기";
      fuel.set(label, (fuel.get(label) || 0) + 1);
    });
    return {
      total: entities.length,
      wri: wri.length,
      osm: osm.length,
      located: located.length,
      wriCapacity: sumCapacity(wri),
      osmCapacity: sumCapacity(osm),
      fuel: [...fuel].sort((a, b) => b[1] - a[1]),
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
        <article data-portfolio-kpi="record-count">
          <span><PublicTermTextV134 text="원천 수록 행(WRI + OSM)" /></span>
          <strong>{summary.total.toLocaleString("ko-KR")}</strong>
          <small>행</small>
        </article>
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
            <small><PublicTermTextV134 text={`MW · 용량 있는 ${summary.osmCapacity.count.toLocaleString("ko-KR")}곳`} /></small>
          </article>
        )}
      </div>
      <div className="pps132-distributions">
        <section className="pps132-distribution" data-portfolio-distribution="true" data-testid="power-plant-fuel-distribution-v138">
          <h5>발전원별 수록 행</h5>
          <ul>
            {summary.fuel.map(([label, count]) => {
              const maximum = Math.max(1, ...summary.fuel.map(([, value]) => value));
              return (
                <li key={label} tabIndex={0} aria-label={`${label} ${count}행`}>
                  <span title={label}>{label}</span>
                  <i aria-hidden="true"><b style={{ width: `${Math.max(4, (count / maximum) * 100)}%` }} /></i>
                  <strong>{count.toLocaleString("ko-KR")}행</strong>
                </li>
              );
            })}
          </ul>
        </section>
      </div>
    </section>
  );
}
