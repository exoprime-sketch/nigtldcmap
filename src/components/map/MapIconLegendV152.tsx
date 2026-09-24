import { PublicTermTextV134 } from "../help/PublicTermV134";
import type { MapIconLegendEntryV152 } from "../../data/map/mapIconsV152";
import { MapIconBadgeV152 } from "./MapIconSpriteV152";
import "./map-icons-v152.css";

export interface MapIconLegendV152Props {
  entries: MapIconLegendEntryV152[];
  title?: string;
  compact?: boolean;
}

/**
 * A legend list built from `mapIconLegendEntriesV152` output: badge + label
 * (through `PublicTermTextV134`, so a term already in the public glossary
 * gets its tooltip) + a `N개` count. No raw codes appear in the rendered
 * text — `entries[].key` is only ever used as the React key.
 */
export default function MapIconLegendV152({ entries, title, compact = false }: MapIconLegendV152Props) {
  const className = compact ? "mi152-legend mi152-legend--compact" : "mi152-legend";
  return (
    <div className="mi152-legend-wrap">
      {title && (
        <p className="mi152-legend-heading">
          <PublicTermTextV134 text={title} />
        </p>
      )}
      <ul className={className} data-testid="map-icon-legend-v152">
        {entries.map((entry) => (
          <li data-count={entry.count} data-icon-color={entry.color} data-icon-id={entry.iconId} key={entry.key}>
            <MapIconBadgeV152 color={entry.color} iconId={entry.iconId} tag={entry.tag} />
            <span className="mi152-legend-label">
              <PublicTermTextV134 text={entry.label} />
            </span>
            <span className="mi152-legend-count">{entry.count.toLocaleString("ko-KR")}개</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
