import { publicRegionTextV162 } from "../../data/geo/regionDisplayV162";
import type { TopicV170 } from "../../data/search/searchAssetsV170";

export interface TopicPanelV170Props {
  topic: TopicV170;
  countryIso3: string;
  countryNameKo: string;
  /** Dataset name and source line as the result cards print them. */
  describe: (elementId: string) => { name: string; source: string } | null;
  hasMap: (elementId: string) => boolean;
  onOpenElement: (elementId: string) => void;
  onOpenMapElement?: (elementId: string) => void;
}

/** A " · " line with each place name shown the public way (한글(현지명)). */
function regionLineV170(text: string, elementId: string, country: string): string {
  return text
    .split(" · ")
    .map((part) => publicRegionTextV162(part, elementId, country) || part)
    .join(" · ");
}

function SparklineV170({ series, label }: { series: Array<[number, number]>; label: string }) {
  const values = series.map(([, value]) => value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const points = series
    .map(([, value], index) => {
      const x = (index / Math.max(1, series.length - 1)) * 116 + 2;
      const y = 26 - ((value - min) / span) * 22;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
  return (
    <svg className="tp170-spark" width="120" height="30" viewBox="0 0 120 30" role="img" aria-label={label}>
      <polyline points={points} fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}

/**
 * V170 ①: when the query is a topic in the dictionary, the datasets that
 * answer it come first with the figure for that topic (computed from each
 * dataset's records at build time), before the result list.
 */
export default function TopicPanelV170({
  topic,
  countryIso3,
  countryNameKo,
  describe,
  hasMap,
  onOpenElement,
  onOpenMapElement,
}: TopicPanelV170Props) {
  const rows = topic.rows
    .map((row) => ({ row, info: describe(row.elementId) }))
    .filter((entry): entry is { row: typeof entry.row; info: { name: string; source: string } } => Boolean(entry.info));
  if (rows.length === 0) return null;
  return (
    <section className="tp170" aria-labelledby="tp170-title" data-testid="search-topic-panel-v170" data-topic={topic.id}>
      <header className="tp170__head">
        <h2 id="tp170-title">
          {countryNameKo} {topic.label} 주요 현황
        </h2>
        <p>관련 데이터 {rows.length}개의 주요 수치</p>
      </header>
      <ul className="tp170__rows">
        {rows.map(({ row, info }) => (
          <li key={row.elementId} className="tp170__row" data-element-id={row.elementId}>
            <span className="tp170__role">{row.role}</span>
            <span className="tp170__name">
              <strong>{info.name}</strong>
              <small>{info.source}</small>
            </span>
            <span className="tp170__value">
              <span className="tp170__figure">
                <strong>{regionLineV170(row.value, row.elementId, countryIso3)}</strong>
                <small>{regionLineV170(row.sub, row.elementId, countryIso3)}</small>
              </span>
              {row.series && row.series.length >= 3 ? (
                <SparklineV170 series={row.series} label={`${row.series[0][0]}–${row.series[row.series.length - 1][0]}년 추이`} />
              ) : null}
            </span>
            <span className="tp170__actions">
              <button type="button" className="cdp-button cdp-button--secondary" onClick={() => onOpenElement(row.elementId)}>
                상세보기
              </button>
              {hasMap(row.elementId) && onOpenMapElement ? (
                <button type="button" className="cdp-button cdp-button--primary" onClick={() => onOpenMapElement(row.elementId)}>
                  지도에서 보기
                </button>
              ) : null}
            </span>
          </li>
        ))}
      </ul>
      <p className="tp170__note">수치는 각 데이터의 원자료를 기준으로 산출한 값입니다</p>
    </section>
  );
}
