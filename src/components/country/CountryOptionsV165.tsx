import { useMemo } from "react";
import { countrySelectGroupsV165 } from "../../data/countries/countryPickerModelV165";
import { useCountryRegistryV165 } from "../../data/countries/useCountryRegistryV165";

/**
 * V165: the public countries as the `<option>`s of a page's own country
 * `<select>` (finder, download, detail, map). The native select stays; from
 * five public countries its options are grouped by region (`<optgroup>`),
 * below that they are the flat list they were. "전체", where a page offers it,
 * is the page's own first option.
 */
export default function CountryOptionsV165({
  providers,
}: {
  providers: ReadonlyArray<{ countryIso3: string; countryNameKo: string }>;
}) {
  const registry = useCountryRegistryV165();
  const groups = useMemo(
    () => (registry ? countrySelectGroupsV165(registry, providers.map((provider) => provider.countryIso3)) : null),
    [registry, providers]
  );
  if (!groups) {
    return (
      <>
        {providers.map((provider) => (
          <option key={provider.countryIso3} value={provider.countryIso3}>
            {provider.countryNameKo}
          </option>
        ))}
      </>
    );
  }
  return (
    <>
      {groups.map((group) => (
        <optgroup key={group.key} label={group.nameKo}>
          {group.countries.map((country) => (
            <option key={country.iso3} value={country.iso3}>
              {country.nameKo}
            </option>
          ))}
        </optgroup>
      ))}
    </>
  );
}
