import { Fragment } from "react";
import { useCountryDataProvidersV158 } from "../../data/countries/useCountryDataProvidersV158";

/**
 * V162 PR-D: the public countries named once, each a way into that country's
 * screens ("현재 제공 국가 · 베트남 · 방글라데시"). The current one is marked, the
 * others link to the same page for that country. It names every public
 * country by design, like the country picker it is.
 */
export default function CountryScopeLinksV162({
  current,
  hash,
  className,
}: {
  current: string | null;
  /** The page the links open ("home", "guide"). */
  hash: string;
  className?: string;
}) {
  // V162 PR-D: the live countries as every country selector reads them.
  const live = useCountryDataProvidersV158().map((provider) => ({ iso3: provider.countryIso3, nameKo: provider.countryNameKo }));
  return (
    <p className={className} data-country-picker="true" data-country-selector="v162" data-testid="country-scope-links-v162">
      현재 제공 국가 ·{" "}
      {live.length === 0
        ? "—"
        : live.map((country, index) => (
            <Fragment key={country.iso3}>
              {index > 0 ? " · " : null}
              {country.iso3 === current ? (
                <strong aria-current="true">{country.nameKo}</strong>
              ) : (
                <a href={`?country=${country.iso3}#${hash}`}>{country.nameKo}</a>
              )}
            </Fragment>
          ))}
    </p>
  );
}
