export type MapDynamicLegendV120Props = {
  title: string;
  unit?: string;
  items: Array<{ label: string; symbol?: string; value?: string | number }>;
  noDataLabel?: string;
};

export default function MapDynamicLegendV120({
  title,
  unit,
  items,
  noDataLabel = "자료 없음",
}: MapDynamicLegendV120Props) {
  return (
    <aside className="map-dynamic-legend-v120" aria-label={`${title} 범례`}>
      <strong><PublicTermTextV134 text={title} /></strong>
      {unit && (
        <span className="map-dynamic-legend-v120__unit">
          <PublicTermTextV134 text={unit} />
        </span>
      )}
      <ul>
        {items.map((item) => (
          <li key={`${item.label}-${item.value ?? ""}`}>
            {item.symbol && <span aria-hidden="true">{item.symbol}</span>}
            <span><PublicTermTextV134 text={item.label} /></span>
            {item.value !== undefined && <b>{item.value}</b>}
          </li>
        ))}
        <li className="is-no-data">
          <span aria-hidden="true">▧</span>
          <span>{noDataLabel}</span>
        </li>
      </ul>
    </aside>
  );
}
import { PublicTermTextV134 } from "../help/PublicTermV134";
