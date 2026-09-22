import { useMemo } from "react";
import type { VietnamIndicatorMetaV124, VietnamObservationV124 } from "../../../data/vietnam/vietnamTypesV124";
import { mineralModelV153, percentChangeV153 } from "../../../data/visualization/mineralResourcesV153";
import type { MineralRowV153 } from "../../../data/visualization/mineralResourcesV153";
import { formatPublicNumberV126 } from "../../../data/visualization/publicNumberFormatV126";
import { AnalysisBarsV147 } from "./AnalysisChartsV147";
import { PublicTermTextV134 } from "../../help/PublicTermV134";
import "./detail-analysis-v146.css";
import "./detail-analysis-v153.css";

interface Props {
  elementId: "B-046" | "B-047";
  observations: VietnamObservationV124[];
  indicators: VietnamIndicatorMetaV124[];
}

function rankText(row: MineralRowV153): string {
  if (row.worldRank === null) return "순위 미기재";
  return `세계 ${row.worldRank}위${row.worldRankNote ? ` ${row.worldRankNote}` : ""}`;
}

function valueText(value: number | null, unit: string): string {
  return value === null ? "미기재" : `${formatPublicNumberV126(value, "")} ${unit}`.trim();
}

/**
 * B-046 reserves / B-047 mine production by mineral (V153).
 *
 * Every row is one mineral in its own unit; the bar is the world share USGS
 * states, the only figure comparable across minerals. Minerals the source
 * does not list for Vietnam are shown apart, with the source's reason.
 */
export default function MineralResourceSummaryV153({ elementId, observations, indicators }: Props) {
  const model = useMemo(() => mineralModelV153(observations, indicators), [observations, indicators]);
  const isReserves = elementId === "B-046";
  const latestYear = model.years[model.years.length - 1] ?? null;
  const earlierYear = model.years.length > 1 ? model.years[model.years.length - 2] : null;
  const shareRows = model.reported
    .filter((row) => row.worldSharePercent !== null)
    .sort((a, b) => (b.worldSharePercent || 0) - (a.worldSharePercent || 0))
    .map((row) => ({ id: row.indicatorId, label: `${row.mineral} · ${valueText(row.latest?.value ?? null, row.unit)} · ${rankText(row)}`, value: row.worldSharePercent }));
  const headline = model.reported.find((row) => row.mineral === (isReserves ? "안티모니" : "주석")) || model.reported[0];

  return (
    <section className="detail146 d153-section" data-testid={`mineral-resources-v153-${elementId.toLowerCase()}`}>
      <p>
        {isReserves
          ? "USGS가 베트남에 대해 보고한 광종별 확인 매장량입니다. 광종마다 단위가 달라 값의 크기는 서로 비교하지 않고, 원천이 밝힌 세계 비중(%)으로 막대를 그립니다."
          : "USGS가 보고한 광종별 광산 생산량입니다. 2024년은 실적치, 2025년은 USGS 추정치이며 광종마다 단위가 다릅니다."}
      </p>
      <ul className="d153-summary" aria-label="요약">
        <li><span>{model.measureLabel} · 수록 광종</span><strong>{model.reported.length}종</strong></li>
        <li><span>{isReserves ? "USGS 미수록 광종" : "원천 미보고 광종"}</span><strong>{model.missing.length}종</strong></li>
        {headline?.latest ? (
          <li><span>{model.measureLabel} · {headline.mineral} · {headline.latest.year}년</span><strong>{valueText(headline.latest.value, headline.unit)}</strong></li>
        ) : null}
        {latestYear !== null ? <li><span>기준 연도</span><strong>{earlierYear !== null ? `${earlierYear}–${latestYear}년` : `${latestYear}년`}</strong></li> : null}
      </ul>

      {isReserves ? (
        <section className="d153-block" data-analysis-block="category-bar">
          <AnalysisBarsV147 rows={shareRows} title={`광종별 세계 비중 · ${model.measureLabel} · ${latestYear ?? ""}년`} unit="%" xAxis={`세계 ${model.measureLabel} 비중`} yAxis="광물" />
        </section>
      ) : (
        <div className="d153-table-wrap" data-analysis-block="table">
          <table className="d153-table" data-testid="mineral-production-table-v153">
            <caption>광종별 {model.measureLabel} · {earlierYear}년 실적치와 {latestYear}년 추정치 · 행 안의 막대는 그 광종의 두 값을 상대 비교한 것입니다.</caption>
            <thead>
              <tr>
                <th scope="col">광종</th>
                <th scope="col" className="num">{earlierYear}년</th>
                <th scope="col" className="num">{latestYear}년(추정)</th>
                <th scope="col" className="num">증감률</th>
                <th scope="col">단위</th>
                <th scope="col">세계 순위 · 비중({earlierYear}년)</th>
              </tr>
            </thead>
            <tbody>
              {model.reported.map((row) => {
                const first = row.values.find((entry) => entry.year === earlierYear) || null;
                const last = row.values.find((entry) => entry.year === latestYear) || null;
                const max = Math.max(first?.value || 0, last?.value || 0) || 1;
                const change = percentChangeV153(first?.value ?? null, last?.value ?? null);
                return (
                  <tr key={row.indicatorId} data-mineral={row.mineral}>
                    <th scope="row"><PublicTermTextV134 text={row.mineral} /></th>
                    <td className="num">{first?.value === null || first === null ? "미기재" : formatPublicNumberV126(first.value, "")}</td>
                    <td className="num">{last?.value === null || last === null ? "미기재" : formatPublicNumberV126(last.value, "")}</td>
                    <td className="num">
                      <span className="d153-pair">
                        <i><b style={{ width: `${((first?.value || 0) / max) * 100}%` }} /></i>
                        <i data-year="latest"><b style={{ width: `${((last?.value || 0) / max) * 100}%` }} /></i>
                      </span>
                      {change === null ? "—" : `${change > 0 ? "+" : ""}${change.toFixed(1)}%`}
                    </td>
                    <td>{row.unit}</td>
                    <td>{rankText(row)}{row.worldShareText ? ` · ${row.worldShareText}` : ""}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {isReserves ? (
        <div className="d153-table-wrap" data-analysis-block="table">
          <table className="d153-table" data-testid="mineral-reserves-table-v153">
            <caption>광종별 {model.measureLabel} · {latestYear}년 · 값과 단위는 USGS Mineral Commodity Summaries 원문 그대로입니다.</caption>
            <thead>
              <tr><th scope="col">광종</th><th scope="col" className="num">{model.measureLabel}</th><th scope="col">단위</th><th scope="col">세계 순위</th><th scope="col" className="num">세계 비중</th><th scope="col">비고</th></tr>
            </thead>
            <tbody>
              {model.reported.map((row) => (
                <tr key={row.indicatorId} data-mineral={row.mineral}>
                  <th scope="row"><PublicTermTextV134 text={row.mineral} /></th>
                  <td className="num">{row.latest?.value === null || !row.latest ? "미기재" : formatPublicNumberV126(row.latest.value, "")}</td>
                  <td>{row.unit}</td>
                  <td>{rankText(row)}</td>
                  <td className="num">{row.worldShareText || "—"}</td>
                  <td>{row.remark || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}

      {model.missing.length ? (
        <section className="d153-section" data-analysis-block="status-note" data-testid="mineral-missing-v153">
          <h4>{isReserves ? "USGS 미수록 광종" : "원천 미보고 광종"} · {model.missing.length}종</h4>
          <ul className="d153-facts">
            {model.missing.map((row) => (
              <li key={row.indicatorId}><span>{row.mineral}</span><span>{row.missingNote || row.values[0]?.note || "원천에 베트남 값이 없습니다."}</span></li>
            ))}
          </ul>
        </section>
      ) : null}

      {model.notes.length ? (
        <ul className="d153-facts" data-testid="mineral-notes-v153">
          {model.notes.map((note) => (
            <li key={note.label}><span><PublicTermTextV134 text={note.label} /></span><span>{note.text}</span></li>
          ))}
        </ul>
      ) : null}
      <p className="detail146-note">세계 순위·비중은 USGS가 밝힌 값을 그대로 옮긴 것이며, 광종 간 값 비교는 단위가 달라 하지 않습니다.</p>
    </section>
  );
}
