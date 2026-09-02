export type MapEvidenceSummaryItemV120 = {
  label: string;
  value: string | number;
  actualYear?: string | number;
  source?: string;
};

export default function MapEvidenceSummaryV120({
  countryName,
  items,
}: {
  countryName?: string;
  items: MapEvidenceSummaryItemV120[];
}) {
  if (!countryName || items.length === 0) return null;
  return (
    <section
      className="map-evidence-summary-v120"
      aria-label={`${countryName} 주요 정보`}
    >
      <h3>{countryName}</h3>
      <div>
        {items.slice(0, 6).map((item) => (
          <article key={item.label}>
            <span><PublicTermTextV134 text={item.label} /></span>
            <strong>
              {typeof item.value === "string" ? (
                <PublicTermTextV134 text={item.value} />
              ) : (
                item.value
              )}
            </strong>
            {item.actualYear && <small>{item.actualYear}년</small>}
          </article>
        ))}
      </div>
    </section>
  );
}
import { PublicTermTextV134 } from "../help/PublicTermV134";
