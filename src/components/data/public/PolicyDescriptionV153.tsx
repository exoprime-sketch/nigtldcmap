import type { PolicyDescriptionV153 } from "../../../data/visualization/policyDescriptionsV153";
import {
  initiativeDescriptionV153,
  policyDescriptionsForElementV153,
  policyDocumentDescriptionV153,
} from "../../../data/visualization/policyDescriptionsV153";
import { PublicTermTextV134 } from "../../help/PublicTermV134";
import "./policy-description-v153.css";

/**
 * V153-D3: the platform's own description of a law or an initiative, shown
 * beside the delivery's rows and labelled as the platform's text with its
 * sources, so a reader can tell the two apart. An entry still being checked
 * shows "설명 준비 중" rather than an unsourced sentence.
 */
const HTTP_URL = /^https:\/\/[^\s"'<>]+$/u;

function hostOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./u, "");
  } catch {
    return url;
  }
}

/** Link labels: the host, plus the path when one host is linked twice. */
function sourceLabels(urls: string[]): string[] {
  const hosts = urls.map(hostOf);
  return urls.map((url, index) => {
    const host = hosts[index];
    if (hosts.filter((candidate) => candidate === host).length === 1) return host;
    try {
      const path = new URL(url).pathname.replace(/\/$/u, "");
      return `${host}${path.length > 32 ? `${path.slice(0, 32)}…` : path}`;
    } catch {
      return host;
    }
  });
}

export function PolicyDescriptionCardV153({ entry, headingLevel = "p" }: { entry: PolicyDescriptionV153; headingLevel?: "p" | "h6" }) {
  const Heading = headingLevel;
  const formal = [entry.formalName, entry.shortName].filter((value) => value && value !== entry.title).join(" · ");
  const sources = entry.sourceUrl.filter((url) => HTTP_URL.test(url));
  const labels = sourceLabels(sources);
  return (
    <aside
      className={`pdc153 pdc153--${entry.kind}`}
      data-testid="policy-description-v153"
      data-policy-key={entry.key}
      data-policy-status={entry.status}
      aria-label={`${entry.title} 플랫폼 편집 설명`}
    >
      <p className="pdc153__label">
        플랫폼 편집 설명 · 출처 {sources.length.toLocaleString("ko-KR")}건 · {entry.checkedAt} 확인
      </p>
      <Heading className="pdc153__title">
        <strong><PublicTermTextV134 text={entry.title} /></strong>
        {/* The formal line carries the short name, so it needs the same help trigger as the title (V153). */}
        {formal && <span className="pdc153__formal"> (<PublicTermTextV134 text={formal} />)</span>}
      </Heading>
      {entry.status === "verified" && entry.description.length > 0 ? (
        <ul className="pdc153__points">
          {entry.description.map((line) => (
            <li key={line}><PublicTermTextV134 text={line} /></li>
          ))}
        </ul>
      ) : (
        <p className="pdc153__pending">설명 준비 중</p>
      )}
      {sources.length > 0 && (
        <p className="pdc153__sources">
          출처:{" "}
          {sources.map((url, index) => (
            <span key={url}>
              {index > 0 && " · "}
              <a href={url} target="_blank" rel="noreferrer">{labels[index]}</a>
            </span>
          ))}
        </p>
      )}
    </aside>
  );
}

/** One line inside a C-009/C-010 timeline entry; nothing when the name has no entry. */
export function PolicyDocumentDescriptionV153({ elementId, name }: { elementId: string; name: string }) {
  const entry = policyDocumentDescriptionV153(elementId, name);
  return entry ? <PolicyDescriptionCardV153 entry={entry} /> : null;
}

/** The C-008 initiatives and treaties, description first, name in brackets. */
export function InitiativeDescriptionsV153({ elementId }: { elementId: string }) {
  const entries = policyDescriptionsForElementV153(elementId).filter((entry) => entry.kind !== "document");
  if (entries.length === 0) return null;
  const initiatives = entries.filter((entry) => entry.kind === "initiative");
  const treaties = entries.filter((entry) => entry.kind === "treaty");
  const verified = entries.filter((entry) => entry.status === "verified").length;
  return (
    <section className="pps132-distribution pdc153-list" data-testid="initiative-descriptions-v153">
      <h5>이니셔티브·협약 설명 · {entries.length.toLocaleString("ko-KR")}건 (플랫폼 편집)</h5>
      <p className="pps132-note">
        각 이니셔티브가 무엇인지 설명을 먼저 두고 정식 명칭·약칭은 괄호에 적습니다. 원자료와 별개로 플랫폼이 공식 출처를 읽고 작성한 문장이며, 출처 링크를 함께 둡니다.
        {verified < entries.length && ` 출처 확인 전 ${(entries.length - verified).toLocaleString("ko-KR")}건은 "설명 준비 중"으로 둡니다.`}
      </p>
      <div className="pdc153-grid">
        {initiatives.map((entry) => (
          <PolicyDescriptionCardV153 key={entry.key} entry={entry} headingLevel="h6" />
        ))}
      </div>
      {treaties.length > 0 && (
        <>
          <h5>유엔 기후협약·의정서 · {treaties.length.toLocaleString("ko-KR")}건</h5>
          <div className="pdc153-grid">
            {treaties.map((entry) => (
              <PolicyDescriptionCardV153 key={entry.key} entry={entry} headingLevel="h6" />
            ))}
          </div>
        </>
      )}
    </section>
  );
}

export { initiativeDescriptionV153 };
