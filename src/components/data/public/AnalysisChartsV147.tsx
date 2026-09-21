import { formatValueV121 } from "../../../utils/vietnamActualV121";
import ChartAxesV150 from "../../charts/ChartAxesV150";
import "./detail-analysis-v146.css";
import "./detail-analysis-v147.css";
import { PublicTermTextV134 } from "../../help/PublicTermV134";

export interface AnalysisBarV147 { id: string; label: string; value: number | null }
export function AnalysisBarsV147({ rows, title, unit, maximum }: { rows: AnalysisBarV147[]; title: string; unit: string; maximum?: number }) {
  const values = rows.flatMap((r) => r.value === null ? [] : [r.value]);
  const min = Math.min(0, ...values);
  const max = Math.max(maximum || 0, ...values, 0);
  const span = max - min || 1;
  const zero = -min / span * 100;
  return <figure className="analysis147-bars">
    <figcaption><PublicTermTextV134 text={title} /></figcaption>
    <ChartAxesV150 x={title} y="비교 항목" unit={unit} />
    <ol>{rows.map((r) => <li key={r.id}>
      <span><PublicTermTextV134 text={r.label} /></span>
      <i aria-hidden="true"><em style={{ left: `${zero}%` }} />{r.value !== null && <b style={{ left: `${(Math.min(0, r.value) - min) / span * 100}%`, width: `${Math.abs(r.value) / span * 100}%` }} />}</i>
      <strong>{r.value === null ? "자료 없음" : formatValueV121(r.value)}</strong>
    </li>)}</ol>
    <p className="detail146-note">0을 기준으로 표시합니다.{min < 0 ? " 왼쪽 막대는 음수입니다." : ""}</p>
  </figure>;
}
