import { useMemo } from "react";
import { useCountryRegistryV165 } from "../../data/countries/useCountryRegistryV165";
import { normalizeCountryIso3V158 } from "../../data/countryContext";
import "../../styles/country-picker-v165.css";

/**
 * V166: an address naming a country that is still being prepared
 * (`?country=PHL` while the Philippines is "공개 예정") opens the default
 * public country, as before - and now says so in one line, so the reader does
 * not take the screen for that country's. `requested` is the country the
 * address was opened with (the first render rewrites the address). The names
 * come from the registry; nothing here names a country.
 *
 * It names countries by design, so it carries `data-country-picker`: the
 * other-country wording audits leave it out, as they leave out the pickers.
 */
export default function PreparingCountryNoticeV166({ requested: requestedRaw }: { requested: string | null }) {
  const registry = useCountryRegistryV165();
  const requested = normalizeCountryIso3V158(requestedRaw);
  const notice = useMemo(() => {
    if (!registry || !requested) return null;
    const row = registry.countries.find((country) => country.iso3 === requested);
    if (!row || row.status !== "preparing") return null;
    const live = registry.countries.filter((country) => country.status === "live").map((country) => country.nameKo);
    if (!live.length) return null;
    return `${row.nameKo} 데이터는 공개 예정입니다. 지금은 ${live.join("·")} 데이터를 볼 수 있습니다.`;
  }, [registry, requested]);
  if (!notice) return null;
  return (
    <div className="preparing-country-notice-v166" role="status" data-country-picker="true" data-testid="preparing-country-notice-v166">
      <p>{notice}</p>
    </div>
  );
}
