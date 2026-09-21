import ChartAxesV150 from "../../charts/ChartAxesV150";
import { useState } from "react";
import InteractiveTimeSeriesChartV127 from "../../charts/InteractiveTimeSeriesChartV127";
import { PublicTermTextV134 } from "../../help/PublicTermV134";
import "./public-analysis-workspace-v143.css";

type Row = { label: string; value: number };
export default function PublicCountDistributionV143({ title, rows, testId, chronological = false }: { title: string; rows: Row[]; testId?: string; chronological?: boolean }) {
  const [expanded, setExpanded] = useState(false);
  const [table, setTable] = useState(false);
  const maximum = Math.max(1, ...rows.map((row) => row.value));
  const total = rows.reduce((sum, row) => sum + row.value, 0);
  const shown = chronological || expanded ? rows : rows.slice(0, 8);
  const trend = chronological && rows.length >= 3;
  return <section className={`pcd143 ${chronological ? "pcd143--time" : ""}`} data-portfolio-distribution="true" data-testid={testId}>
    <header>{(!trend || table) && <h5><PublicTermTextV134 text={title} /></h5>}<button type="button" aria-label={`${title} ${table ? "차트로 보기" : "표로 보기"}`} aria-pressed={table} onClick={() => setTable((value) => !value)}>{table ? "차트로 보기" : "표로 보기"}</button></header>
    {!table && !trend && <ChartAxesV150 x="건수" y={chronological ? "연도" : "분류"} unit="건" />}
    {table ? <div className="pcd143-table"><table><caption><PublicTermTextV134 text={title} /> · 전체 {rows.length}개 항목</caption><thead><tr><th scope="col">{chronological ? "연도" : "항목"}</th><th scope="col">건수</th>{!chronological && <th scope="col">구성비</th>}</tr></thead><tbody>{rows.map((row) => <tr key={row.label}><th scope="row"><PublicTermTextV134 text={row.label} /></th><td>{row.value.toLocaleString("ko-KR")}건</td>{!chronological && <td>{total ? (row.value / total * 100).toFixed(1) : "0.0"}%</td>}</tr>)}</tbody></table></div>
      : trend ? <InteractiveTimeSeriesChartV127 title={title} ariaLabel={title} series={[{ id: "record-count", label: title, unit: "건", points: rows.map((row) => ({ x: Number(row.label), xLabel: `${row.label}년`, value: row.value })) }]} unit="건" xAxisTitle="연도" yAxisTitle="건수" height={280} showDelta={false} formatValue={(value) => value.toLocaleString("ko-KR", { maximumFractionDigits: 0 })} zoom={{ enabled: rows.length > 8, minimumSpan: 2, showRangeBrush: rows.length > 8 }} />
      : <ul className="pcd143-bars">{shown.map((row) => <li key={row.label} tabIndex={0} aria-label={`${row.label} ${row.value}건${chronological || !total ? "" : `, ${(row.value / total * 100).toFixed(1)}%`}`}><span className="pcd143-label"><PublicTermTextV134 text={row.label} /></span><span className="pcd143-bar" aria-hidden="true"><i style={{ width: `${row.value / maximum * 100}%` }} /></span><strong>{row.value.toLocaleString("ko-KR")}건{!chronological && <small>{total ? (row.value / total * 100).toFixed(1) : "0.0"}%</small>}</strong></li>)}</ul>}
    {!chronological && !table && rows.length > 8 && <button type="button" className="pcd143-more" onClick={() => setExpanded((value) => !value)}>{expanded ? "상위 8개만 보기" : `전체 ${rows.length}개 항목 보기`}</button>}
    <p className="pcd143-note">{chronological ? "연도가 기재된 자료만 집계합니다. 기간으로 기재된 자료는 시작연도로 분류합니다. 수록되지 않은 연도를 0으로 채우지 않습니다." : `분류가 확인된 ${total.toLocaleString("ko-KR")}건을 기준으로 계산했습니다.${!table && !expanded && rows.length > 8 ? " 차트에는 상위 8개 항목을 표시합니다." : ""}`}</p>
  </section>;
}
