import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import type { SharedWideValueV164, WideRecordV162, WideValueV162 } from "../../../data/visualization/wideRecordsV162";
import { koreanTitleV164 } from "../../../data/visualization/publicCategoryLabelV164";
import { isEnglishSentenceV164, mergeRegionNameValuesV163, sharedWideValuesV164, sourceLinkTextV162 } from "../../../data/visualization/wideRecordsV162";
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

/**
 * V164: a card value as a reader reads it - a number grouped by thousands and
 * cut to a readable length, and the delivery's internal missing-reason codes
 * ("미확인(M06)") left out. The delivered value is unchanged.
 *
 * V164-3: every plain number is written one way (4133.6 and 29,321.6 sat side by
 * side on C-012; 6706.04 and 2.48468340032929 on C-002/C-011). A year, a code, a
 * number and a phone number (the identifier fields) are never grouped; a
 * four-digit integer is grouped only in a field that states a quantity.
 */
export function cardValueTextV164(attribute: string, value: string): string {
  let text = String(value ?? "");
  text = text.replace(/\s*\((?:M|CF\/M)\d{2}\)/gu, "");
  const identifierField = /번호|코드|ID|참조|연도|년도|기준년|Ref|우편|전화|식별|일자|날짜/iu.test(String(attribute || ""));
  const bare = text.trim();
  if (identifierField || !/^-?\d+(?:\.\d+)?$/u.test(bare)) return text;
  const [integer, decimals = ""] = bare.replace(/^-/u, "").split(".");
  const quantityField = /금액|규모|용량|면적|투자|비용|합계|총|수요|소요|배출|발전량/u.test(String(attribute || ""));
  if (integer.length < 4 && decimals.length <= 4) return text;
  if (integer.length === 4 && decimals === "" && !quantityField) return text;
  const number = Number(bare);
  if (!Number.isFinite(number)) return text;
  // More than four decimals is floating-point noise (2.48468340032929): two
  // digits for a value of 1 or more, four for one between 0.01 and 1. A
  // smaller value keeps what it was delivered with, so no digit is lost.
  if (decimals.length > 4 && Math.abs(number) < 0.01) return text;
  const maximumFractionDigits = decimals.length > 4 ? (Math.abs(number) >= 1 ? 2 : 4) : decimals.length;
  return number.toLocaleString("ko-KR", { maximumFractionDigits });
}

/** An English column that holds the source's own wording ("사업명 (원문)", "기술명 (영문)"). */
const ORIGINAL_WORDING_ATTRIBUTE_V164 = /원문|영문|원어/u;

/**
 * V164-3: the rows a block shows. A 금액 row and the 단위 row beside it read as
 * one amount ("157 십억 USD"); a ratio (단위 "%") is a 값, not a 금액 ("49%");
 * an amount with no 단위 and no 통화 says so ("230,000 (단위 미기재)") rather
 * than standing without a unit.
 */
export function cardRowsV164(values: WideValueV162[]): WideValueV162[] {
  const amountIndex = values.findIndex((value) => value.attribute === "금액" && !value.href);
  if (amountIndex < 0) return values;
  const amount = values[amountIndex];
  const number = cardValueTextV164(amount.attribute, amount.value).trim();
  if (!/^-?[\d,]+(?:\.\d+)?$/u.test(number)) return values;
  const unitIndex = values.findIndex((value) => value.attribute === "단위" && value.value.trim() !== "");
  const unit = unitIndex >= 0 ? values[unitIndex].value.trim() : "";
  const hasCurrency = values.some((value) => value.attribute === "통화" && value.value.trim() !== "");
  if (!unit && hasCurrency) return values;
  const merged: WideValueV162 = /^(?:%|퍼센트|%p|% ?포인트)$/u.test(unit)
    ? { attribute: "값", value: `${number}${unit}` }
    : { attribute: "금액", value: unit ? `${number} ${unit}` : `${number} (단위 미기재)` };
  return values.flatMap((value, index) => (index === amountIndex ? [merged] : index === unitIndex ? [] : [value]));
}

/** A value longer than this is shown folded to a few lines, with a button that opens it. */
const FOLD_LENGTH_V164 = 240;
const FOLD_LINES_V164 = 6;

const sharedKeyV164 = (block: string, attribute: string, value: string) => `${block}\u0000${attribute}\u0000${value}`;

/**
 * V164 R2: a long value is folded (the whole text stays in the page, cut by the
 * style, so it is still read by a screen reader and found by the browser's
 * search) and opened by "더 보기". A short value is shown as it is.
 */
function FoldedValueV164({ text, children }: { text: string; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  if (text.length <= FOLD_LENGTH_V164 && text.split("\n").length < FOLD_LINES_V164) return <>{children}</>;
  return (
    <>
      <div className="wide162-fold" data-folded={open ? "false" : "true"}>
        {children}
      </div>
      <button type="button" className="wide162-fold-toggle" aria-expanded={open} onClick={() => setOpen((value) => !value)}>
        {open ? "접기" : "더 보기"}
      </button>
    </>
  );
}

/** A value of a sentence or more (a link is not) is shown under its label, across the card. */
const SENTENCE_LENGTH_V164 = 60;
export function isSentenceV164(value: WideValueV162, displayValue: string): boolean {
  return !value.href && displayValue.length > SENTENCE_LENGTH_V164;
}

/** The row label; a sentence the source wrote in English says so ("장벽 내용 (영어 원문)"). */
export function rowLabelV164(attribute: string, text: string): string {
  return !ORIGINAL_WORDING_ATTRIBUTE_V164.test(attribute) && isEnglishSentenceV164(text) ? `${attribute} (영어 원문)` : attribute;
}

/** The value of one row: a link, or the text line by line, folded when long. */
function RowValueV164({ attribute, value, displayValue }: { attribute: string; value: WideValueV162; displayValue: string }) {
  if (value.href) {
    return (
      <a href={value.href} target="_blank" rel="noopener noreferrer">
        {/* A bare address is not link text: the reader sees "원문". */}
        <PublicTermExpandedTextV134 text={/\.pdf(?:$|[?#])/iu.test(value.href) || /^https?:\/\//iu.test(value.value) ? sourceLinkTextV162(value.href) : value.value} />
      </a>
    );
  }
  const keepOriginal = ORIGINAL_WORDING_ATTRIBUTE_V164.test(attribute) || isEnglishSentenceV164(displayValue);
  return (
    <FoldedValueV164 text={displayValue}>
      {/* V164-3: a line break the sheet marked ("⏎") is a line here. */}
      {displayValue.split("\n").map((line, lineIndex) => (
        <span className="wide162-line" key={lineIndex}>
          <PublicTermTextV134 text={line} keepOriginal={keepOriginal} />
        </span>
      ))}
    </FoldedValueV164>
  );
}

/**
 * V164 R2: how much room a card takes, as the rows it states and the text of
 * each (a folded value counts as its folded length).
 */
export function wideCardWeightV164(record: WideRecordV162): number {
  return record.blocks.reduce((sum, block) => sum + block.values.reduce((rows, value) => rows + 36 + Math.min(value.value.length, FOLD_LENGTH_V164), 0), 0);
}

/**
 * V164 R2: a list whose cards differ a lot in height (BGD C-012's PPP law card
 * beside cards of five rows) leaves a blank under the short ones when it is
 * laid out in rows; such a list is laid out in columns instead.
 */
export function unevenCardsV164(weights: number[]): boolean {
  if (weights.length < 4) return false;
  const sorted = [...weights].sort((left, right) => left - right);
  const median = sorted[Math.floor(sorted.length / 2)];
  const max = sorted[sorted.length - 1];
  return max >= 1200 && max >= 2.5 * median;
}

function WideRecordCardV162({ record, elementId, sharedKeys }: { record: WideRecordV162; elementId?: string; sharedKeys: ReadonlySet<string> }) {
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
          <PublicTermTextV134 text={koreanTitleV164(record.name)} />
        </h4>
        {record.type ? <span className="wide162-type-chip">{record.type}</span> : null}
      </header>
      {record.blocks.map((block) => {
        const rows = cardRowsV164(block.block === "지역" && level1 ? mergeRegionNameValuesV163(block.values) : block.values)
          // V164: a field the record leaves empty is not shown as a bare label.
          .filter((value) => value.href || String(value.value ?? "").trim() !== "")
          // V164 R2: a value the list states once above is not repeated on the card.
          .filter((value) => !sharedKeys.has(sharedKeyV164(block.block, value.attribute, value.value)));
        if (!rows.length) return null;
        return (
          <section className="wide162-block" key={block.block}>
            {/* A label inside the card, not a page heading: every card repeats it. */}
            <p className="wide162-block-title">{block.title}</p>
            <dl className="wide162-rows">
              {rows.map((value) => {
                const displayValue =
                  block.block === "지역" && REGION_NAME_ATTRIBUTE_V162.test(value.attribute)
                    ? regionText(value.value)
                    : cardValueTextV164(value.attribute, value.value);
                return (
                  <div className={isSentenceV164(value, displayValue) ? "wide162-row wide162-row--stacked" : "wide162-row"} key={`${block.block}-${value.attribute}`}>
                    <dt>
                      <PublicTermTextV134 text={value.href ? value.attribute : rowLabelV164(value.attribute, displayValue)} />
                    </dt>
                    <dd>
                      <RowValueV164 attribute={value.attribute} value={value} displayValue={displayValue} />
                    </dd>
                  </div>
                );
              })}
            </dl>
          </section>
        );
      })}
      {/* V162: a policy document keeps the platform's reviewed description
          (V153 C-009/C-010) now that the wide cards show it; nothing when the
          document has no entry. */}
      {elementId ? <PolicyDocumentDescriptionV153 elementId={elementId} name={record.name} /> : null}
      <SourceLineV162 source={record.source} />
    </article>
  );
}

/** What many records state in the same words, once, with how many it holds for. */
function SharedNotesV164({ notes }: { notes: SharedWideValueV164[] }) {
  return (
    <aside className="wide162-shared" data-testid="wide-shared-notes-v164" aria-label="여러 기록에 공통인 내용">
      <p className="wide162-shared-title">여러 기록에 같은 내용이라 한 번만 적습니다</p>
      <dl className="wide162-rows">
        {notes.map((note) => {
          const text = cardValueTextV164(note.attribute, note.value);
          return (
            <div className="wide162-row" key={sharedKeyV164(note.block, note.attribute, note.value)}>
              <dt>
                <PublicTermTextV134 text={`${note.blockTitle} · ${rowLabelV164(note.attribute, text)}`} />
                <span className="wide162-shared-count">{note.count === note.total ? `모든 기록(${note.total}건)` : `${note.count}건`}에 공통</span>
              </dt>
              <dd>
                <RowValueV164 attribute={note.attribute} value={{ attribute: note.attribute, value: note.value }} displayValue={text} />
              </dd>
            </div>
          );
        })}
      </dl>
    </aside>
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
  // V164 R2: what most records state in the same words is told once, above the list.
  const shared = useMemo(() => sharedWideValuesV164(records), [records]);
  const sharedKeys = useMemo(() => new Set(shared.map((note) => sharedKeyV164(note.block, note.attribute, note.value))), [shared]);
  const uneven = useMemo(() => unevenCardsV164(visible.map(wideCardWeightV164)), [visible]);

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
      {shared.length ? <SharedNotesV164 notes={shared} /> : null}
      {filtered.length === 0 ? (
        <p className="wide162-empty">검색 결과가 없습니다.</p>
      ) : (
        <div className="wide162-grid" data-layout={uneven ? "columns" : "rows"}>
          {visible.map((record, index) => (
            <WideRecordCardV162 key={`${index}-${record.name}`} record={record} elementId={elementId} sharedKeys={sharedKeys} />
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
