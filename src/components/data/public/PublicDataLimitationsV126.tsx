import { getPublicLimitationsV127 } from "../../../data/visualization/publicLimitationsRegistryV127";
import { sentencesForCountryV162 } from "../../../data/countries/countryCopyV158";
import { usePageDataCountryV162 } from "../../../data/countries/DataCountryContextV158";

interface Props {
  elementId: string;
}

export default function PublicDataLimitationsV126({
  elementId,
}: Props) {
  const pageCountry = usePageDataCountryV162();
  // V162 PR-D: the registry was written for the default country's sources.
  const limitations = getPublicLimitationsV127(elementId)
    .map((limitation) => ({ ...limitation, message: sentencesForCountryV162(limitation.message, pageCountry) }))
    .filter((limitation) => limitation.message);

  if (limitations.length === 0) return null;

  return (
    <details
      className="pav126-limitations"
      data-testid="public-limitations-panel"
    >
      <summary>
        <strong>자료 이용 시 유의사항</strong>
      </summary>
      <ul>
        {limitations.map((limitation) => (
          <li
            key={`${limitation.kind}:${limitation.message}`}
            data-testid="public-limitation-item"
            data-limitation-kind={limitation.kind}
          >
            {limitation.message}
          </li>
        ))}
      </ul>
    </details>
  );
}
