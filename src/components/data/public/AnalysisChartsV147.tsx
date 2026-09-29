import { formatValueV121 } from "../../../utils/vietnamActualV121";
import ChartAxesV150 from "../../charts/ChartAxesV150";
import "./detail-analysis-v146.css";
import "./detail-analysis-v147.css";
import { PublicTermTextV134 } from "../../help/PublicTermV134";
import { useAnalysisContractV153 } from "./analysisContractContextV153";
import { useRankFoldV160 } from "./RankFoldV160";

export interface AnalysisBarV147 { id: string; label: string; value: number | null }
/** `xAxis`/`yAxis`: what the length measures and what each bar is (V153 contract axes); the title is the caption. */
export function AnalysisBarsV147({ rows, title, unit, maximum, xAxis, yAxis, rankFold = false, rankEdge, highlightId }: { rows: AnalysisBarV147[]; title: string; unit: string; maximum?: number; xAxis?: string; yAxis?: string; /** V160: a ranked regional list - top/bottom 10 + '전체 보기'. */ rankFold?: boolean; /** V160: rows kept at each end (10; 5 for a first-layer ranking). */ rankEdge?: number; /** Spec v8: the reference subject's bar (E-017 Korea). */ highlightId?: string }) {
  // What each bar is: the caller says, else the dataset's contract for a bar
  // screen, else the generic word.
  const contract = useAnalysisContractV153();
  const fold = useRankFoldV160(rankFold ? rows.length : 0, title, rankEdge);
  const y = yAxis || (contract && ["category-bar", "region-bar"].includes(contract.primary.type) ? contract.primary.yAxis : null) || "비교 항목";
  const values = rows.flatMap((r) => r.value === null ? [] : [r.value]);
  const min = Math.min(0, ...values);
  const max = Math.max(maximum || 0, ...values, 0);
  const span = max - min || 1;
  const zero = -min / span * 100;
  return <figure className="analysis147-bars">
    <figcaption><PublicTermTextV134 text={title} /></figcaption>
    <ChartAxesV150 x={xAxis || title} y={y} unit={unit} />
    <ol>{rows.map((r, index) => <li key={r.id} {...fold.rowProps(index)} data-highlight={r.id === highlightId ? "true" : undefined}>
      <span><PublicTermTextV134 text={r.label} /></span>
      <i aria-hidden="true"><em style={{ left: `${zero}%` }} />{r.value !== null && <b style={{ left: `${(Math.min(0, r.value) - min) / span * 100}%`, width: `${Math.abs(r.value) / span * 100}%` }} />}</i>
      <strong>{r.value === null ? "자료 없음" : formatValueV121(r.value)}</strong>
    </li>)}</ol>
    {fold.toggle}
    <p className="detail146-note">0을 기준으로 표시합니다.{min < 0 ? " 왼쪽 막대는 음수입니다." : ""}</p>
  </figure>;
}
