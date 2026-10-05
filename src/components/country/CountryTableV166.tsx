import { Fragment, useMemo } from "react";
import { useCountryRegistryV165 } from "../../data/countries/useCountryRegistryV165";
import { countryRegionTableV166 } from "../../data/countries/countryPickerModelV165";
import { useCountryItemCountsV166 } from "../../data/countries/useCountryItemCountsV166";

/**
 * V166: the guide's "제공 국가" table - every country the platform names, by
 * region, from the country registry alone. A public country shows its item
 * count (the length of its filtered catalog, as its home shows it); the
 * countries still being prepared share one row per region, "공개 예정", with
 * nothing else - no count, no date. Nothing here names a country.
 *
 * It names every country by design, so it carries `data-country-picker`: the
 * other-country wording audits leave it out, as they leave out the pickers.
 */
export default function CountryTableV166() {
  const registry = useCountryRegistryV165();
  const groups = useMemo(
    () => (registry ? countryRegionTableV166(registry) : []),
    [registry],
  );
  const liveIso3s = useMemo(
    () =>
      groups.flatMap((group) =>
        group.countries
          .filter((entry) => entry.live)
          .map((entry) => entry.iso3),
      ),
    [groups],
  );
  const counts = useCountryItemCountsV166(liveIso3s, liveIso3s.length > 0);
  if (!groups.length) return null;
  const hasPreparing = groups.some((group) =>
    group.countries.some((entry) => !entry.live),
  );

  return (
    <div
      className="country-table-v166"
      data-country-picker="true"
      data-testid="country-table-v166"
    >
      <h3>제공 국가</h3>
      <table>
        <thead>
          <tr>
            <th scope="col">권역</th>
            <th scope="col">국가</th>
            <th scope="col">상태</th>
            <th scope="col">제공 내용</th>
          </tr>
        </thead>
        {groups.map((group) => {
          const live = group.countries.filter((entry) => entry.live);
          const soon = group.countries.filter((entry) => !entry.live);
          const span = live.length + (soon.length ? 1 : 0);
          const regionCell = (
            <th
              scope="rowgroup"
              rowSpan={span}
              className="country-table-v166__region"
            >
              {group.nameKo || "국가"}
            </th>
          );
          // One row group per region (the region cell heads its rows).
          return (
            <tbody
              key={group.key || "all"}
              data-region={group.key || undefined}
            >
              {live.map((entry, at) => (
                <tr key={entry.iso3} data-iso3={entry.iso3} data-status="live">
                  {at === 0 ? regionCell : null}
                  <td className="country-table-v166__name">{entry.nameKo}</td>
                  <td>
                    <span className="country-table-v166__status is-live">
                      공개
                    </span>
                  </td>
                  <td>
                    {typeof counts[entry.iso3] === "number"
                      ? `데이터 항목 ${counts[entry.iso3]}개`
                      : "확인 중"}
                  </td>
                </tr>
              ))}
              {soon.length ? (
                <tr key={`${group.key}-soon`} data-status="preparing">
                  {live.length === 0 ? regionCell : null}
                  <td className="country-table-v166__name is-soon">
                    {/* A space after each "·": the line breaks between two names, never inside one or before a "·". */}
                    {soon.map((entry, at) => (
                      <Fragment key={entry.iso3}>
                        {at > 0 ? " " : null}
                        <span className="country-table-v166__soon-name" data-iso3={entry.iso3}>
                          {entry.nameKo}
                          {at < soon.length - 1 ? (
                            <>
                              <span className="country-table-v166__sep" aria-hidden="true">·</span>
                              <span className="sr-only">,</span>
                            </>
                          ) : null}
                        </span>
                      </Fragment>
                    ))}
                  </td>
                  <td>
                    <span className="country-table-v166__status">
                      공개 예정
                    </span>
                  </td>
                  <td aria-label="없음">—</td>
                </tr>
              ) : null}
            </tbody>
          );
        })}
      </table>
      {hasPreparing ? (
        <p className="country-table-v166__note">
          공개 예정 국가는 데이터 검수를 마치면 공개로 바뀌고, 상단 국가
          버튼에서 고를 수 있습니다.
        </p>
      ) : null}
    </div>
  );
}
