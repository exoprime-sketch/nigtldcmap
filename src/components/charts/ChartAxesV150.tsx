import { PublicTermTextV134 } from "../help/PublicTermV134";
import { displayUnitV150 } from "../../data/visualization/unitDisplayV150";
import "./chart-axes-v150.css";

/** Visible labels for compact / HTML charts; values keep their source scale. */
export default function ChartAxesV150({ x, y, unit: sourceUnit, composition = false }: { x?: string; y?: string; unit: string; composition?: boolean }) {
  const unit = displayUnitV150(sourceUnit);
  return <div className="chart-axes-v150" data-chart-axes="true" data-x-axis={x || "none"} data-y-axis={y || "none"} data-unit={unit || "unreported"}>
    {x && <span>가로: <PublicTermTextV134 text={x} /></span>}
    {y && <span>세로: <PublicTermTextV134 text={y} /></span>}
    <span>단위: <PublicTermTextV134 text={unit || "원자료 미기재"} />{composition ? " · 구성비 %" : ""}</span>
  </div>;
}
