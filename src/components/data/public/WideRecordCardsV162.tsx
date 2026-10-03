import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import type { WideRecordV162 } from "../../../data/visualization/wideRecordsV162";
import { mergeRegionNameValuesV163, sourceLinkTextV162 } from "../../../data/visualization/wideRecordsV162";
import { PublicTermExpandedTextV134, PublicTermTextV134 } from "../../help/PublicTermV134";
import { PolicyDocumentDescriptionV153 } from "./PolicyDescriptionV153";
import { useRegionTextV162 } from "../../../data/geo/regionDisplayV162";
import { useRegionWordV158 } from "../../../data/countries/countryLevel1V158";
import "./wide-record-cards-v162.css";

interface Props {
  records: WideRecordV162[];
  /** Named by the caller when the list needs its own heading context (e.g. "지원 요율"). */
  elementTitle?: string;
  /** V162 (P12-B): which element's 지역 dictionary vintage to read a place name against. */
  elementId?: string;
  /** "element": the cards list every record of the element (checked by the entity-card audit). */
  recordScope?: "element";
}

/** A [지역] block's place-name attributes ("지역명 (원문)", "지역명 (현행)" …), not its codes. */
const REGION_NAME_ATTRIBUTE_V162 = /지역명/u;

const INITIAL_VISIBLE_V162 = 20;

/** True when a record's name or any block value contains the query (case-insensitive). */
function matchesQueryV162(record: WideRecordV162, query: string): boolean {
  if (!query) return true;
  if (record.name.toLocaleLowerCase().includes(query)) return true;
  return record.blocks.some((block) => block.values.some((value) => value.value.toLocaleLowerCase().includes(query)));
}

/** One record's type counts, in first-seen order; only counted types (null excluded). */
function typeCountsV162(records: WideRecordV162[]): Array<{ type: string; count: number }> {
  const counts = new Map<string, number>();
  for (const record of records) {
    if (!record.type) continue;
    counts.set(record.type, (counts.get(record.type) || 0) + 1);
  }
  return [...counts].map(([type, count]) => ({ type, count }));
}

/**
 * The source line's parts: the document (its title is the link text when it
 * has an address - V162: the file name stays in href only, never as text),
 * a citation, then the document page link, joined with " · ".
 */
function SourceLineV162({ source }: { source: WideRecordV162["source"] }) {
  const parts: { key: string; node: ReactNode }[] = [];
  if (source.url) {
    parts.push({
      key: "url",
      node: (
        <a href={source.url} target="_blank" rel="noopener noreferrer">
          {/* A link cannot hold a help button: the meaning is written out. */}
          <PublicTermExpandedTextV134 text={sourceLinkTextV162(source.url, source.document)} />
        </a>
      ),
    });
  } else if (source.document) {
    parts.push({ key: "doc", node: <PublicTermTextV134 text={source.document} /> });
  }
  if (source.citation) parts.push({ key: "citation", node: <PublicTermTextV134 text={source.citation} /> });
  if (source.pageUrl) {
    parts.push({
      key: "page",
      node: (
        <a href={source.pageUrl} target="_blank" rel="noopener noreferrer">
          문서 페이지
        </a>
      ),
    });
  }
  if (!parts.length) return null;
  return (
    <p className="wide162-source">
      출처:{" "}
      {parts.map((part, index) => (
        <span key={part.key}>
          {index > 0 ? " · " : ""}
          {part.node}
        </span>
      ))}
    </p>
  );
}

function WideRecordCardV162({ record, elementId }: { record: WideRecordV162; elementId?: string }) {
  // V162 (P12-B): a [지역] block's place name reads "한글명 (현지명)"; its own
  // administrative code stays as delivered (regionText only rewrites the name
  // attributes, matched by REGION_NAME_ATTRIBUTE_V162).
  const regionText = useRegionTextV162(elementId);
  // V163 (3a): the 2025 성·시 reform's before/after name columns apply only to
  // the default country (Viet Nam, `level1` null here); any other country's
  // [지역] block shows a single plain "지역명" row instead.
  const { level1 } = useRegionWordV158();
  return (
    <article className="wide162-card" data-testid="wide-record-card-v162">
      <header className="wide162-card-head">
        <h4 className="wide162-card-title">
          <PublicTermTextV134 text={record.name} />
        </h4>
        {record.type ? <span className="wide162-type-chip">{record.type}</span> : null}
      </header>
      {record.blocks.map((block) => (
        <section className="wide162-block" key={block.block}>
          {/* A label inside the card, not a page heading: every card repeats it. */}
          <p className="wide162-block-title">{block.title}</p>
          <dl className="wide162-rows">
            {(block.block === "지역" && level1 ? mergeRegionNameValuesV163(block.values) : block.values).map((value) => {
              const displayValue =
                block.block === "지역" && REGION_NAME_ATTRIBUTE_V162.test(value.attribute)
                  ? regionText(value.value)
                  : value.value;
              return (
                <div className="wide162-row" key={`${block.block}-${value.attribute}`}>
                  <dt>
                    <PublicTermTextV134 text={value.attribute} />
                  </dt>
                  <dd>
                    {value.href ? (
                      <a href={value.href} target="_blank" rel="noopener noreferrer">
                        {/* A bare address is not link text: the reader sees "원문". */}
                        <PublicTermExpandedTextV134 text={/\.pdf(?:$|[?#])/iu.test(value.href) || /^https?:\/\//iu.test(value.value) ? sourceLinkTextV162(value.href) : value.value} />
                      </a>
                    ) : (
                      <PublicTermTextV134 text={displayValue} />
                    )}
                  </dd>
                </div>
              );
            })}
          </dl>
        </section>
      ))}
      {/* V162: a policy document keeps the platform's reviewed description
          (V153 C-009/C-010) now that the wide cards show it; nothing when the
          document has no entry. */}
      {elementId ? <PolicyDocumentDescriptionV153 elementId={elementId} name={record.name} /> : null}
      <SourceLineV162 source={record.source} />
    </article>
  );
}

/**
 * The public card view for the wide record template (V162): one card per
 * record, its blocks as label:value sections, the facility card's reading
 * style (FacilityCardV153) applied to a record that carries several blocks
 * instead of one flat row.
 */
export default function WideRecordCardsV162({ records, elementTitle, elementId, recordScope }: Props) {
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [visibleCount, setVisibleCount] = useState(INITIAL_VISIBLE_V162);

  const types = useMemo(() => typeCountsV162(records), [records]);
  const showTypeFilter = types.length >= 2;

  const normalizedQuery = query.trim().toLocaleLowerCase();
  const filtered = useMemo(
    () =>
      records.filter(
        (record) => (typeFilter === "all" || record.type === typeFilter) && matchesQueryV162(record, normalizedQuery)
      ),
    [records, typeFilter, normalizedQuery]
  );

  // A new filter or search starts the list back at the first page.
  useEffect(() => {
    setVisibleCount(INITIAL_VISIBLE_V162);
  }, [typeFilter, normalizedQuery]);

  const visible = filtered.slice(0, visibleCount);
  const remaining = filtered.length - visible.length;
  const headerText = `${elementTitle ? `${elementTitle} ` : ""}${records.length}건`;

  return (
    <section className="wide162" data-testid="wide-record-cards-v162" data-analysis-block="cards-list" data-record-scope={recordScope} data-record-count={records.length}>
      <div className="wide162-toolbar">
        <p className="wide162-count">{headerText}</p>
        {showTypeFilter ? (
          <div className="wide162-chips" role="group" aria-label="자료 유형 필터">
            <button
              type="button"
              className="wide162-chip"
              aria-pressed={typeFilter === "all"}
              onClick={() => setTypeFilter("all")}
            >
              전체 ({records.length})
            </button>
            {types.map(({ type, count }) => (
              <button
                type="button"
                className="wide162-chip"
                key={type}
                aria-pressed={typeFilter === type}
                onClick={() => setTypeFilter(type)}
              >
                {type} ({count})
              </button>
            ))}
          </div>
        ) : null}
        <label className="wide162-search">
          <span className="sr-only">기록 검색</span>
          <input
            type="search"
            aria-label="기록 검색"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="이름·값으로 검색"
          />
        </label>
      </div>
      {filtered.length === 0 ? (
        <p className="wide162-empty">검색 결과가 없습니다.</p>
      ) : (
        <div className="wide162-grid">
          {visible.map((record, index) => (
            <WideRecordCardV162 key={`${index}-${record.name}`} record={record} elementId={elementId} />
          ))}
        </div>
      )}
      {remaining > 0 ? (
        <button type="button" className="wide162-more" onClick={() => setVisibleCount(filtered.length)}>
          더 보기 (남은 {remaining}건)
        </button>
      ) : null}
    </section>
  );
}
