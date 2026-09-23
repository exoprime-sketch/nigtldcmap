import type { ReactNode } from "react";
import type { DatasetSpecRowV159 } from "../../../data/spec/specTypesV159";
import "./data-description-v159.css";

export type SourceLineV159Spec = Pick<DatasetSpecRowV159, "sourceOrg" | "refApa" | "refLink" | "checkedAt">;

export interface SourceLineV159Props {
  spec: SourceLineV159Spec | null;
}

/** One line for the source panel: sourceOrg · refApa · 원문 link · 확인일. Missing parts are omitted, not blanked. */
export default function SourceLineV159({ spec }: SourceLineV159Props) {
  if (!spec) return null;
  const { sourceOrg, refApa, refLink, checkedAt } = spec;
  const parts: ReactNode[] = [];
  if (sourceOrg) parts.push(<span key="org">{sourceOrg}</span>);
  if (refApa) parts.push(<span key="apa">{refApa}</span>);
  if (refLink) {
    parts.push(
      <a key="link" href={refLink} target="_blank" rel="noopener">
        원문
      </a>
    );
  }
  if (checkedAt) parts.push(<span key="checked">확인 {checkedAt}</span>);
  if (parts.length === 0) return null;

  return (
    <p className="sl159" data-testid="source-line-v159">
      {parts.map((part, index) => (
        <span key={`part-${index}`}>
          {index > 0 && (
            <span aria-hidden="true" className="sl159-sep">
              {" · "}
            </span>
          )}
          {part}
        </span>
      ))}
    </p>
  );
}
