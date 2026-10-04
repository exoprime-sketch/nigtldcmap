import ChartAxesV150 from "../../charts/ChartAxesV150";
import { useState } from "react";
import InteractiveTimeSeriesChartV127 from "../../charts/InteractiveTimeSeriesChartV127";
import { PublicTermTextV134 } from "../../help/PublicTermV134";
import { useAnalysisContractV153 } from "./analysisContractContextV153";
import "./public-analysis-workspace-v143.css";

type Row = { label: string; value: number };
/** `unit`: the count noun the bars state (건·곳·명); `yAxis`: what each bar is, from the dataset's contract unless given (V153). */
export default function PublicCountDistributionV143({ title, rows, testId, chronological = false, unit = "건", xAxis, yAxis, plannedAfterYear }: { title: string; rows: Row[]; testId?: string; chronological?: boolean; unit?: string; xAxis?: string; yAxis?: string; /** V164-R3: years after this one are plans, not counts of what happened - drawn as their own series. */ plannedAfterYear?: number }) {
  const contract = useAnalysisContractV153();
  const contractY = contract && ["category-bar", "region-bar"].includes(contract.primary.type) ? contract.primary.yAxis : null;
  const [expanded, setExpanded] = useState(false);
  const [table, setTable] = useState(false);
  const maximum = Math.max(1, ...rows.map((row) => row.value));
  const total = rows.reduce((sum, row) => sum + row.value, 0);
  const shown = chronological || expanded ? rows : rows.slice(0, 8);
  const trend = chronological && rows.length >= 3;
  // V164-R3: D-012's years run to 2045 because the source files a plant under the year it is planned to start;
  // those years are not counts of cases that happened. They are drawn as a second, dotted series.
  const planned = chronological && plannedAfterYear !== undefined ? rows.filter((row) => Number(row.label) > plannedAfterYear) : [];
  const dated = planned.length > 0 ? rows.filter((row) => !(Number(row.label) > (plannedAfterYear as number))) : rows;
  const plannedTotal = planned.reduce((sum, row) => sum + row.value, 0);
  const plannedLabel = `계획 연도(${(plannedAfterYear ?? 0) + 1}년 이후)`;
  // V164-R3: one bar that is 100% compares nothing; it is said in a sentence instead.
  const single = !chronological && rows.length === 1;
  // V164: the bars write the count noun the axes state (곳·명·건), so "단위: 곳" never sits over "6건".
  const noun = unit || "건";
  return <section className={`pcd143 ${chronological ? "pcd143--time" : ""}`} data-portfolio-distribution="true" data-testid={testId}>
    <header>{(!trend || table) && <h5><PublicTermTextV134 text={title} /></h5>}<button type="button" aria-label={`${title} ${table ? "차트로 보기" : "표로 보기"}`} aria-pressed={table} onClick={() => setTable((value) => !value)}>{table ? "차트로 보기" : "표로 보기"}</button></header>
    {!table && !trend && !single && <ChartAxesV150 x={xAxis || "건수"} y={chronological ? "연도" : yAxis || contractY || "분류"} unit={unit} />}
    {table ? <div className="pcd143-table"><table><caption><PublicTermTextV134 text={title} /> · 전체 {rows.length}개 항목</caption><thead><tr><th scope="col">{chronological ? "연도" : "항목"}</th><th scope="col">{xAxis || "건수"}</th>{!chronological && <th scope="col">구성비</th>}</tr></thead><tbody>{rows.map((row) => <tr key={row.label}><th scope="row"><PublicTermTextV134 text={planned.includes(row) ? `${row.label} (계획)` : row.label} /></th><td>{row.value.toLocaleString("ko-KR")}{noun}</td>{!chronological && <td>{total ? (row.value / total * 100).toFixed(1) : "0.0"}%</td>}</tr>)}</tbody></table></div>
      : trend ? <InteractiveTimeSeriesChartV127 title={title} ariaLabel={title} series={[
        ...(dated.length > 0 ? [{ id: "record-count", label: title, unit: "건", points: dated.map((row) => ({ x: Number(row.label), xLabel: `${row.label}년`, value: row.value })) }] : []),
        ...(planned.length > 0 ? [{ id: "record-count-planned", label: plannedLabel, unit: "건", marker: "diamond" as const, linePattern: "dot" as const, points: planned.map((row) => ({ x: Number(row.label), xLabel: `${row.label}년(계획)`, value: row.value })) }] : []),
      ]} unit="건" xAxisTitle="연도" yAxisTitle="건수" height={280} showDelta={false} formatValue={(value) => value.toLocaleString("ko-KR", { maximumFractionDigits: 0 })} zoom={{ enabled: rows.length > 8, minimumSpan: 2, showRangeBrush: rows.length > 8 }} />
      : single ? <p className="pcd143-single" data-testid="pcd143-single-v164">분류가 확인된 {total.toLocaleString("ko-KR")}{noun}은 모두 「<PublicTermTextV134 text={rows[0].label} />」입니다. 비교할 다른 항목이 없어 막대를 그리지 않습니다.</p>
      : <ul className="pcd143-bars">{shown.map((row) => <li key={row.label} tabIndex={0} aria-label={`${row.label} ${row.value}${noun}${chronological || !total ? "" : `, ${(row.value / total * 100).toFixed(1)}%`}`}><span className="pcd143-label"><PublicTermTextV134 text={row.label} /></span><span className="pcd143-bar" aria-hidden="true"><i style={{ width: `${row.value / maximum * 100}%` }} /></span><strong>{row.value.toLocaleString("ko-KR")}{noun}{!chronological && <small>{total ? (row.value / total * 100).toFixed(1) : "0.0"}%</small>}</strong></li>)}</ul>}
    {!chronological && !table && rows.length > 8 && <button type="button" className="pcd143-more" onClick={() => setExpanded((value) => !value)}>{expanded ? "상위 8개만 보기" : `전체 ${rows.length}개 항목 보기`}</button>}
    {planned.length > 0 && !table && <p className="pcd143-note" data-testid="pcd143-planned-note-v164">{`${(plannedAfterYear ?? 0) + 1}년 이후로 기재된 ${plannedTotal.toLocaleString("ko-KR")}${noun}은 계획·예정 연도 기준이라 점선 계열로 따로 표시합니다.`}</p>}
    {!single && <p className="pcd143-note">{chronological ? "연도가 기재된 자료만 집계합니다. 기간으로 기재된 자료는 시작연도로 분류합니다. 수록되지 않은 연도를 0으로 채우지 않습니다." : `분류가 확인된 ${total.toLocaleString("ko-KR")}${noun}을 기준으로 계산했습니다.${!table && !expanded && rows.length > 8 ? " 차트에는 상위 8개 항목을 표시합니다." : ""}`}</p>}
  </section>;
}
