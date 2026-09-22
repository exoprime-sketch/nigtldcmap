import { useMemo } from "react";
import type { VietnamIndicatorMetaV124, VietnamObservationV124 } from "../../../data/vietnam/vietnamTypesV124";
import { climateZoneCodeV153, climateZoneLabelV153 } from "../../../data/visualization/koreanTermsV153";
import { formatPublicNumberV126 } from "../../../data/visualization/publicNumberFormatV126";
import { AnalysisBarsV147 } from "./AnalysisChartsV147";
import "./detail-analysis-v146.css";
import "./detail-analysis-v153.css";

interface Props {
  observations: VietnamObservationV124[];
  indicators: VietnamIndicatorMetaV124[];
}

interface ZoneRow {
  code: string;
  label: string;
  /** The zone as the source wrote it ("Cwa (온대·동계건조·고온하계)"). */
  sourceLabel: string;
  area: number | null;
  share: number | null;
}

function zoneOf(label: string): string | null {
  const dash = label.lastIndexOf(" — ");
  return dash < 0 ? null : label.slice(dash + 3).trim();
}

/**
 * B-002 Köppen climate zones, Korean name first and the code in parentheses
 * (V153): the dominant zone, area and share per zone for 1991–2020, and the
 * tropical (A-group) share across the observed and projected periods the
 * source states.
 */
export default function ClimateZoneSummaryV153({ observations, indicators }: Props) {
  const model = useMemo(() => {
    const byId = new Map(indicators.map((row) => [row.indicatorId, row]));
    const zones = new Map<string, ZoneRow>();
    let dominant: { label: string; year: number | null; note: string | null } | null = null;
    const tropical: { id: string; label: string; value: number | null; projected: boolean }[] = [];
    let year: number | null = null;
    for (const record of observations) {
      const label = byId.get(record.indicatorId)?.labelKo || record.indicatorId;
      const value = typeof record.value === "number" ? record.value : null;
      if (record.indicatorId.endsWith("_koppen_class")) {
        dominant = { label: climateZoneLabelV153(record.value), year: record.year ?? null, note: record.note || null };
        continue;
      }
      if (/_koppen_tropical_share_/u.test(record.indicatorId)) {
        const period = zoneOf(label) || String(record.year ?? "");
        tropical.push({ id: record.indicatorId, label: period, value, projected: /전망/u.test(record.note || "") });
        continue;
      }
      const zoneLabel = zoneOf(label);
      const code = climateZoneCodeV153(zoneLabel);
      if (!code) continue;
      const row = zones.get(code) || { code, label: climateZoneLabelV153(zoneLabel), sourceLabel: String(zoneLabel), area: null, share: null };
      if (/_koppen_area_/u.test(record.indicatorId)) row.area = value;
      if (/_koppen_share_/u.test(record.indicatorId)) row.share = value;
      if (record.year) year = record.year;
      zones.set(code, row);
    }
    const rows = [...zones.values()].sort((a, b) => (b.area || 0) - (a.area || 0));
    return { rows, dominant, tropical, year, totalArea: rows.reduce((sum, row) => sum + (row.area || 0), 0) };
  }, [observations, indicators]);

  return (
    <section className="detail146 d153-section" data-testid="climate-zone-v153">
      <p>
        쾨펜 기후대별 국토 점유 면적과 비율입니다(Beck et al. 2023, 1991–2020 관측 기준). 기후대 이름은 한글을 먼저 쓰고 분류 코드를 괄호에 두었습니다.
      </p>
      <ul className="d153-summary" aria-label="요약">
        {model.dominant ? <li><span>국가 우세 기후대 · {model.dominant.year}년(1991–2020)</span><strong>{model.dominant.label}</strong></li> : null}
        {model.rows[0] ? <li><span>기후대별 점유 면적 최대 · {model.rows[0].label} · {model.year}년</span><strong>{formatPublicNumberV126(model.rows[0].area, "km²")} km²</strong></li> : null}
        <li><span>기후대 수</span><strong>{model.rows.length}개</strong></li>
        <li><span>기후대별 점유 면적 합계</span><strong>{formatPublicNumberV126(model.totalArea, "km²")} km²</strong></li>
      </ul>
      <section className="d153-block" data-analysis-block="category-bar"><AnalysisBarsV147 rows={model.rows.map((row) => ({ id: row.code, label: row.label, value: row.area }))} title={`기후대별 점유 면적 · ${model.year ?? ""}년(1991–2020 관측)`} unit="km²" /></section>
      <div className="d153-table-wrap" data-analysis-block="sorted-table">
        <table className="d153-table" data-testid="climate-zone-table-v153">
          <caption>기후대 구성 · 1991–2020 관측 기준 · 면적은 km², 비율은 분류 육지면적 대비 %</caption>
          <thead>
            <tr><th scope="col">기후대</th><th scope="col">원문 표기</th><th scope="col" className="num">점유 면적(km²)</th><th scope="col" className="num">점유 비율(%)</th></tr>
          </thead>
          <tbody>
            {model.rows.map((row) => (
              <tr key={row.code} data-zone={row.code}>
                <th scope="row">{row.label}</th>
                <td>{row.sourceLabel}</td>
                <td className="num">{row.area === null ? "—" : row.area.toLocaleString("ko-KR")}</td>
                <td className="num">{row.share === null ? "—" : `${row.share}%`}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {model.tropical.length ? (
        <section className="d153-block" data-analysis-block="category-bar">
          <AnalysisBarsV147
            rows={model.tropical.map((row) => ({ id: row.id, label: /관측|SSP/u.test(row.label) ? row.label : `${row.label}${row.projected ? " · 전망" : " · 관측"}`, value: row.value }))}
            title="열대기후(A군) 국토 점유 비율 · 시기·시나리오별"
            unit="%"
          />
        </section>
      ) : null}
      <p className="detail146-note">A군(열대)·C군(온대) 분류는 쾨펜-가이거 기준이며, 전망치는 SSP 시나리오별 2071–2099 평균입니다.</p>
    </section>
  );
}
