import ChartAxesV150 from "../../charts/ChartAxesV150";
import { barScaleV164, formatBarValueV164, isRankUnitV164 } from "../../charts/barScaleV164";
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
  // V164: one scale for every bar (a lone % is measured against 100, a rank has no bar).
  const scale = barScaleV164(values, unit, maximum || 0);
  const rankUnit = isRankUnitV164(unit);
  const zero = scale.zeroPercent;
  return <figure className="analysis147-bars">
    <figcaption><PublicTermTextV134 text={title} /></figcaption>
    <ChartAxesV150 x={xAxis || title} y={y} unit={unit} />
    <ol>{rows.map((r, index) => <li key={r.id} {...fold.rowProps(index)} data-highlight={r.id === highlightId ? "true" : undefined}>
      <span><PublicTermTextV134 text={r.label} /></span>
      <i aria-hidden="true" data-track={scale.drawTrack ? undefined : "none"}>{scale.drawTrack && <em style={{ left: `${zero}%` }} />}{scale.drawTrack && r.value !== null && <b style={{ left: `${r.value < 0 ? zero - scale.spanFor(r.value) : zero}%`, width: `${scale.spanFor(r.value)}%` }} />}</i>
      <strong>{r.value === null ? "자료 없음" : rankUnit ? `${formatBarValueV164(r.value)}위` : formatBarValueV164(r.value)}</strong>
    </li>)}</ol>
    {fold.toggle}
    {scale.drawTrack && <p className="detail146-note">{scale.basis === "percent-100" ? "0~100%를 기준으로 표시합니다." : "0을 기준으로 표시합니다."}{scale.signed ? " 왼쪽 막대는 음수입니다." : ""}</p>}
  </figure>;
}
