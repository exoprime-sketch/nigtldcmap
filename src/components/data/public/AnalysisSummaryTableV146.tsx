import { PublicTermTextV134 } from "../../help/PublicTermV134";
import "./detail-analysis-v146.css";
import { displayUnitV150 } from "../../../data/visualization/unitDisplayV150";

export interface AnalysisSummaryRowV146 {
  key?: string;
  label: string;
  value: string | number;
  unit?: string;
  context?: string;
}

/** Secondary calculations stay inspectable below the analysis, not in KPI tiles. */
export default function AnalysisSummaryTableV146({ title = "집계표", rows }: {
  title?: string;
  rows: AnalysisSummaryRowV146[];
}) {
  if (!rows.length) return null;
  return (
    <details className="analysis-summary-v146" data-testid="analysis-summary-table-v146">
      <summary>{title}</summary>
      <div className="analysis-summary-v146__scroll">
        <table>
          <caption>{title}</caption>
          <thead><tr><th scope="col">항목</th><th scope="col">값</th><th scope="col">단위</th><th scope="col">기준</th></tr></thead>
          <tbody>{rows.map((row, index) => (
            <tr key={`${row.label}-${index}`} data-summary-key={row.key}>
              <th scope="row"><PublicTermTextV134 text={row.label} /></th>
              <td data-summary-value="true">{typeof row.value === "number" ? row.value.toLocaleString("ko-KR", { maximumFractionDigits: 6 }) : row.value}</td>
              <td><PublicTermTextV134 text={displayUnitV150(row.unit) || "—"} /></td>
              <td><PublicTermTextV134 text={row.context || "—"} /></td>
            </tr>
          ))}</tbody>
        </table>
      </div>
    </details>
  );
}
