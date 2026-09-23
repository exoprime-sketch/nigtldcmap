import { PublicTermTextV134 } from "../help/PublicTermV134";
import { displayUnitV150 } from "../../data/visualization/unitDisplayV150";
import { useAnalysisContractV153 } from "../data/public/analysisContractContextV153";
import "./chart-axes-v150.css";

/**
 * Visible labels for compact / HTML charts; values keep their source scale.
 * The labels state what the data produced; the dataset's contract (V153) is
 * written beside them as `data-contract-*` so a chart whose axes drift from
 * the declared ones is visible to the frame and the QA, never papered over.
 */
export default function ChartAxesV150({ x, y, unit: sourceUnit, composition = false }: { x?: string; y?: string; unit: string; composition?: boolean }) {
  const unit = displayUnitV150(sourceUnit);
  const contract = useAnalysisContractV153();
  return <div className="chart-axes-v150" data-chart-axes="true" data-x-axis={x || "none"} data-y-axis={y || "none"} data-unit={unit || "unreported"}
    data-contract-x-axis={contract?.primary.xAxis ?? undefined} data-contract-y-axis={contract?.primary.yAxis ?? undefined} data-contract-unit={contract?.primary.unit ?? undefined}>
    {x && <span>가로: <PublicTermTextV134 text={x} /></span>}
    {y && <span>세로: <PublicTermTextV134 text={y} /></span>}
    <span>단위: <PublicTermTextV134 text={unit || "원자료 미기재"} />{composition ? " · 구성비 %" : ""}</span>
  </div>;
}
