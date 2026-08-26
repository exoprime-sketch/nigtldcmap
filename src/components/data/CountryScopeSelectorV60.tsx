import { PRIORITY_COUNTRIES } from "../../data/priorityCountries";
import { getCountrySelectorLabel } from "../../utils/countryDataScopeV60";
import "../../styles/country-scope-v60.css";

interface Props {
  elementId: string;
  countryIso3: string;
  onCountryChange: (iso3: string) => void;
}

export default function CountryScopeSelectorV60({
  elementId,
  countryIso3,
  onCountryChange,
}: Props) {
  return (
    <section className="v60-country-selector v69-embedded-country-selector">
      <label>
        <span>{getCountrySelectorLabel(elementId)}</span>
        <select
          value={countryIso3}
          onChange={(event) => onCountryChange(event.target.value)}
        >
          {PRIORITY_COUNTRIES.map((country) => (
            <option key={country.iso3} value={country.iso3}>
              {country.nameKo} · {country.iso3}
            </option>
          ))}
        </select>
      </label>
    </section>
  );
}
