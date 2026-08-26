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
            <span>{item.label}</span>
            <strong>{item.value}</strong>
            {item.actualYear && <small>{item.actualYear}년</small>}
          </article>
        ))}
      </div>
    </section>
  );
}
