import type { ReactNode } from "react";
import type { DatasetSpecRowV159 } from "../../../data/spec/specTypesV159";
import { PublicTermTextV134 } from "../../help/PublicTermV134";
import "./data-description-v159.css";

export type SourceLineV159Spec = Pick<DatasetSpecRowV159, "sourceOrg" | "refApa" | "refLink" | "checkedAt">;

export interface SourceLineV159Props {
  spec: SourceLineV159Spec | null;
}

/**
 * One line for the source panel: sourceOrg · 원문 link · 확인일, with the APA
 * reference in a closed disclosure below (a citation is read on demand, and
 * its English title and URL are not screen copy). Missing parts are omitted.
 */
export default function SourceLineV159({ spec }: SourceLineV159Props) {
  if (!spec) return null;
  const { sourceOrg, refApa, refLink, checkedAt } = spec;
  const parts: ReactNode[] = [];
  if (sourceOrg) parts.push(<span key="org"><PublicTermTextV134 text={sourceOrg} /></span>);
  if (refLink) {
    parts.push(
      <a key="link" href={refLink} target="_blank" rel="noopener">
        원문
      </a>
    );
  }
  if (checkedAt) parts.push(<span key="checked">확인 {checkedAt}</span>);
  if (parts.length === 0 && !refApa) return null;

  return (
    <div className="sl159-wrap">
      {parts.length > 0 ? (
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
      ) : null}
      {refApa ? (
        <details className="sl159-apa" data-testid="source-apa-v159">
          <summary>참고문헌</summary>
          <p lang="en">{refApa}</p>
        </details>
      ) : null}
    </div>
  );
}
