import { getPublicLimitationsV127 } from "../../../data/visualization/publicLimitationsRegistryV127";

interface Props {
  elementId: string;
}

export default function PublicDataLimitationsV126({
  elementId,
}: Props) {
  const limitations = getPublicLimitationsV127(elementId);

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
