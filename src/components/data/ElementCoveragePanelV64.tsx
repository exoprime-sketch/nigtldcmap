import type { Dataset } from "../../types/dataset";
import {
  getCoverageStatusLabel,
  getElementCoverageDefinition,
} from "../../utils/dataElementCoverageV64";
import type {
  CoverageItemStatus,
} from "../../utils/dataElementCoverageV64";
import "../../styles/element-coverage-v64.css";

interface Props {
  elementId: string;
  datasets: Dataset[];
}

export default function ElementCoveragePanelV64({
  elementId,
  datasets,
}: Props) {
  const definition = getElementCoverageDefinition(elementId, datasets);
  if (!definition) return null;

  const provided = definition.items.filter(
    (item) => item.status === "provided" || item.status === "derived"
  ).length;

  return (
    <section className="v64-coverage-panel">
      <header>
        <div>
          <span>포함 데이터</span>
          <h2>
            현재 {provided}/{definition.items.length}개 항목 확인 가능
          </h2>
        </div>
        <b className={`status-${definition.status}`}>
          {getCoverageStatusLabel(definition.status)}
        </b>
      </header>

      <div className="v64-coverage-grid">
        {definition.items.map((item) => (
          <article key={item.key}>
            <div>
              <b>{item.label}</b>
              {item.note && <small>{item.note}</small>}
            </div>
            <CoverageBadge status={item.status} />
          </article>
        ))}
      </div>

      {definition.note && <p>{definition.note}</p>}
    </section>
  );
}

function CoverageBadge({ status }: { status: CoverageItemStatus }) {
  const label =
    status === "provided"
      ? "제공 중"
      : status === "derived"
      ? "계산·가공"
      : "준비 중";

  return <span className={`v64-item-status status-${status}`}>{label}</span>;
}
