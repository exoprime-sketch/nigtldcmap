import { useMemo } from "react";
import type { VietnamEntityV124 } from "../../../data/vietnam/vietnamTypesV124";
import { publicTextV126 } from "../../../data/visualization/publicFieldPolicyV126";
import { formatPublicNumberV126 } from "../../../data/visualization/publicNumberFormatV126";
import { PublicTermTextV134 } from "../../help/PublicTermV134";
import "./public-portfolio-summary-v132.css";

/**
 * A-024: the 2016 network and the revised-PDP8 plan, apart (V140).
 *
 * The delivery holds two kinds of row: 606 line segments with a route from
 * the World Bank's 2016 network, and 116 rows from the revised PDP8 list
 * (48 existing, 68 planned) that carry a voltage and nothing to draw. The
 * screen used to open on "송전 선로 구간 수 722건 · 2016", which made the plan
 * rows look like 2016 lines on the ground. Here the network is counted and
 * measured by voltage, and the plan is a separate table.
 */
interface Props {
  entities: VietnamEntityV124[];
}

const NETWORK_INDICATOR = "A-024_transmission_line_wb2016";
const PLAN_INDICATOR = "A-024_transmission_line_pdp8";
const text = (value: unknown): string => publicTextV126(value) || "";
const numberOf = (value: unknown): number => (typeof value === "number" ? value : Number(text(value)));
const STATUS_LABELS: Record<string, string> = { Existing: "기존", Planned: "계획" };

export function isTransmissionDeliveryV140(entities: VietnamEntityV124[]): boolean {
  return entities.some((entity) => entity.indicatorId === NETWORK_INDICATOR);
}

export default function TransmissionNetworkSummaryV140({ entities }: Props) {
  const summary = useMemo(() => {
    const network = entities.filter((entity) => entity.indicatorId === NETWORK_INDICATOR);
    const plan = entities.filter((entity) => entity.indicatorId === PLAN_INDICATOR);
    const byVoltage = new Map<number, { segments: number; km: number }>();
    network.forEach((entity) => {
      const attributes = (entity.normalizedAttributes || {}) as Record<string, unknown>;
      const kv = numberOf(attributes.kv);
      const km = numberOf(attributes.km);
      const entry = byVoltage.get(kv) || { segments: 0, km: 0 };
      entry.segments += 1;
      entry.km += Number.isFinite(km) ? km : 0;
      byVoltage.set(kv, entry);
    });
    const planByVoltage = new Map<string, { existing: number; planned: number }>();
    plan.forEach((entity) => {
      const attributes = (entity.normalizedAttributes || {}) as Record<string, unknown>;
      const kv = Number.isFinite(numberOf(attributes.kv)) ? String(numberOf(attributes.kv)) : "미표기";
      const status = text(attributes["속성3_A_024_선로상태_기존_계획"]);
      const entry = planByVoltage.get(kv) || { existing: 0, planned: 0 };
      if (/planned/iu.test(status)) entry.planned += 1;
      else entry.existing += 1;
      planByVoltage.set(kv, entry);
    });
    const totalKm = [...byVoltage.values()].reduce((sum, entry) => sum + entry.km, 0);
    const planned = plan.filter((entity) => /planned/iu.test(text((entity.normalizedAttributes || {})["속성3_A_024_선로상태_기존_계획"]))).length;
    return {
      network: network.length,
      totalKm,
      byVoltage: [...byVoltage].sort((a, b) => b[0] - a[0]),
      plan: plan.length,
      planned,
      planByVoltage: [...planByVoltage].sort((a, b) => Number(b[0]) - Number(a[0])),
    };
  }, [entities]);

  if (!summary.network) return null;

  return (
    <section className="pps132" data-testid="transmission-network-summary-v140" data-network-segments={summary.network} data-plan-rows={summary.plan}>
      <header className="pps132-heading">
        <p>
          2016년 송전선은 경로가 있는 {summary.network.toLocaleString("ko-KR")}개 구간이고, 개정 PDP8 선로 목록 {summary.plan.toLocaleString("ko-KR")}행(계획 {summary.planned}행 포함)은 전압만 있고 경로 좌표가 없어 지도에는 없습니다. 두 목록은 서로 더하지 않습니다.
        </p>
      </header>
      <div className="pps132-kpis">
        <article data-portfolio-kpi="network-segments">
          <span>2016년 송전선 구간</span>
          <strong>{summary.network.toLocaleString("ko-KR")}</strong>
          <small>구간 · 경로 있음 · 지도 표시</small>
        </article>
        <article data-portfolio-kpi="network-length">
          <span>2016년 송전선 총연장</span>
          <strong>{formatPublicNumberV126(Math.round(summary.totalKm), "km")}</strong>
          <small><PublicTermTextV134 text="km · 원천 PDF 좌표화(2–10 km 오차)" /></small>
        </article>
        <article data-portfolio-kpi="plan-rows">
          <span><PublicTermTextV134 text="개정 PDP8 선로 목록" /></span>
          <strong>{summary.plan.toLocaleString("ko-KR")}</strong>
          <small>행 · 기존 {summary.plan - summary.planned} · 계획 {summary.planned} · 경로 없음</small>
        </article>
      </div>
      <div className="pps132-distributions">
        <section className="pps132-distribution pps132-distribution--table" data-portfolio-distribution="true" data-testid="transmission-voltage-table-v140">
          <h5>2016년 송전선 · 전압별 구간 수와 연장</h5>
          <div className="pps132-table-wrap">
            <table>
              <caption>World Bank ENERGYDATA.INFO 2016 송전망 · 구간 수와 구간 길이 합계</caption>
              <thead>
                <tr>
                  <th scope="col">전압</th>
                  <th scope="col">구간 수</th>
                  <th scope="col">연장(km)</th>
                  <th scope="col">비중(연장 기준)</th>
                </tr>
              </thead>
              <tbody>
                {summary.byVoltage.map(([kv, entry]) => (
                  <tr key={kv} data-voltage={kv}>
                    <th scope="row"><PublicTermTextV134 text={`${kv} kV`} /></th>
                    <td>{entry.segments.toLocaleString("ko-KR")}</td>
                    <td>{formatPublicNumberV126(Math.round(entry.km), "km")}</td>
                    <td>{summary.totalKm > 0 ? `${Math.round((entry.km / summary.totalKm) * 100)}%` : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
        <section className="pps132-distribution pps132-distribution--table" data-portfolio-distribution="true" data-testid="transmission-plan-table-v140">
          <h5>개정 PDP8 선로 목록 · 전압별 기존·계획 행 수</h5>
          <div className="pps132-table-wrap">
            <table>
              <caption><PublicTermTextV134 text="Quyết định 768/QĐ-TTg(2025) 부록의 선로 행 · 경로 좌표 없음 · 지도 미표시" /></caption>
              <thead>
                <tr>
                  <th scope="col">전압</th>
                  <th scope="col">기존(행)</th>
                  <th scope="col">계획(행)</th>
                </tr>
              </thead>
              <tbody>
                {summary.planByVoltage.map(([kv, entry]) => (
                  <tr key={kv}>
                    <th scope="row"><PublicTermTextV134 text={`${kv} kV`} /></th>
                    <td>{entry.existing.toLocaleString("ko-KR")}</td>
                    <td>{entry.planned.toLocaleString("ko-KR")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="pps132-note">{Object.values(STATUS_LABELS).join("·")} 구분은 원천의 선로상태 열을 그대로 옮긴 것입니다. 계획 행은 설치 실적이 아닙니다.</p>
        </section>
      </div>
    </section>
  );
}
