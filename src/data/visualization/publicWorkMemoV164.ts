/**
 * V164-3: the delivery's working memos, taken out of public text.
 *
 * The 2026-09-29/30 delivery wrote its own working notes into the same cells as
 * the data: "구서식 열 「[참여] 협의 기간」에서 이관", "C-003과 동일 수치",
 * "(raw JSON 4종에서 … 직접 산출)", "HTTP 403(봇 차단) … 재확인", "시행중(확인
 * 필요)", "[상충] … 본 파일 r5 …", "현 납품본 기재". They address whoever
 * compiled the sheet, not a reader. This module removes only the memo part -
 * a parenthesis, a tag, a clause, a sentence - and leaves the statement it was
 * attached to. A cell that was a memo through and through comes back empty, so
 * the caller hides the row.
 *
 * Nothing here is rewritten or invented: text is only ever cut. A date, a
 * value or a proper name outside the cut parts is untouched.
 *
 * This file imports nothing so any text policy can use it.
 */

/**
 * What marks a piece of text as a working memo. A real raw material ("raw
 * ore", "raw materials") is not one: "raw" counts only when it is not followed
 * by a lower-case English word.
 */
const SIGNALS_V164: readonly string[] = [
  // how the sheet was rebuilt
  String.raw`구서식`,
  String.raw`납품본`,
  String.raw`본\s*파일`,
  String.raw`문서포털\s*메타`,
  // review state that is still open
  String.raw`확인\s*필요`,
  String.raw`확인필요`,
  String.raw`검토\s*필요`,
  String.raw`확인\s*후\s*확정`,
  String.raw`재(?:확보|접근|수집|대조|산출)`,
  String.raw`재확인\s*(?:필요|대상|예정|시점)`,
  String.raw`확인\s*대상`,
  // how a page was fetched
  String.raw`HTTP\s*[1-5]\d{2}`,
  String.raw`봇\s*차단`,
  String.raw`robots\.txt`,
  String.raw`Web(?:Fetch|Search)`,
  String.raw`CERTIFICATE_VERIFY`,
  String.raw`(?:접근|접속)\s*(?:실패|불가)`,
  String.raw`전문\s*(?:검색|대조)|전수\s*대조|원문\s*(?:대조|자체\s*검산)`,
  String.raw`불검출`,
  // delivered files and the sheet's own cross references
  String.raw`(?<![A-Za-z])raw(?:_data)?(?![A-Za-z])(?!\s+[a-z])`,
  String.raw`(?<![A-Za-z0-9-])[A-E]-\d{3}(?![A-Za-z0-9-])`,
  String.raw`1\.2\s*(?:자료|entity)`,
];
const MEMO_SIGNAL_V164 = new RegExp(SIGNALS_V164.join("|"), "u");

/**
 * A reference to another element of the sheet: "C-013 참조, …", "… — C-003과
 * 동일 수치", "세부 운영 규정은 C-017 참조". The clause goes, the rest stays.
 */
const ELEMENT_REFERENCE_V164: readonly RegExp[] = [
  /^\s*[A-E]-\d{3}\s*참조\s*[,，]\s*/u,
  /\s*[—–-]?\s*[A-E]-\d{3}\s*(?:과|와)\s*동일\s*수치/gu,
  /\s*[,，—–]\s*[^,，.—–]*?[A-E]-\d{3}\s*참조(?=\s*(?:[,，.]|$))/gu,
];

/** A sentence that only states how a source could not be read. */
const PROCESS_SENTENCE_V164 = /(?:^|[\s(])(?:자동화\s*접근|응답하지\s*않아|취득하지\s*못|확보하지\s*못|원본을\s*확보)/u;

/** "구서식 열 「[참여] 협의 기간」에서 이관": how a column was moved, not what it holds. */
const MIGRATION_LOG_V164 = /\s*구서식\s*열\s*[「"“][^」"”]*[」"”]\s*에서\s*이관\.?/gu;

/**
 * A pointer to the delivered raw file: `raw: 「UNFCCC NDC Registry / … 원문」`,
 * "raw: C-002_….pdf", "raw `「…」`". The pointer goes; a parenthesis that
 * follows it is judged on its own.
 */
const RAW_POINTER_V164: readonly RegExp[] = [
  /\s*\braw\s*[:：]\s*[「"“`][^」"”`]*[」"”`]/gu,
  /\s*\braw\s*`[^`]*`/gu,
  /\s*\braw\s*[:：]\s*\S+\.(?:pdf|csv|json|xlsx?|md|txt|docx?|hwpx?|zip)\b/giu,
];

/**
 * Bracketed tags that label a note's origin rather than its content. A tag
 * with a name outside this list ("[협정약칭: APTA]", "[1]") is data and stays.
 */
const MEMO_TAG_V164 =
  /\s*\[\s*(?:상충|공식|국제|부분\s*미확보[^\]]*|M\d{2}[^\]]*|결측\s*(?:M\d{2}|보완)[^\]]*|값\s*정규화|지역\s*출처|열\s*→\s*행\s*전개|구분자\s*통일|진출\s*상태\s*기준[^\]]*|보조\s*지표[^\]]*)\s*\]\s*/gu;

/** A memo phrase glued to the end of a statement: "개정 PDP8 부록Ⅱ(768/QĐ-TTg) 원문 자체 검산". */
const TRAILING_MEMO_V164 = /\s+(?:원문\s*(?:제?\d+\s*면\s*)?(?:대조|자체\s*검산)|전수\s*대조)\s*$/u;

const PAREN_V164 = /\s*[(（][^()（）]*[)）]/gu;
/** A sentence boundary: a full stop after Korean text, a digit or a closing mark. */
const SENTENCE_SPLIT_V164 = /((?<=[가-힣)\]」"'%\d])[.。]\s+(?=\S)|\n+)/u;
/** The separators of a list inside one sentence. */
const LIST_SPLIT_V164 = /(\s·\s|\s\/\s|;\s)/u;
/** The clauses of one plain sentence: a comma followed by a space ("3,927.4" is not one). */
const CLAUSE_SPLIT_V164 = /([,，]\s+)/u;
const DASH_CLAUSE_V164 = /\s[—–]\s/u;

function hasSignalV164(text: string): boolean {
  return MEMO_SIGNAL_V164.test(text) || PROCESS_SENTENCE_V164.test(text);
}

/**
 * A parenthesis that carries a memo signal, cut down to what is not memo. When
 * the memo opens it ("(raw JSON 4종에서 … 산출)", "(확인 대상 … 전문 대조)") the
 * whole parenthesis goes; when it only trails a fact ("(768/QĐ-TTg, C-016
 * raw)") the fact stays: "(768/QĐ-TTg)". A check that reports its result after
 * a dash ("전수 대조 — 제출 80건 중 Bangladesh 행 없음") keeps the result.
 */
function publicParenthesisV164(group: string): string {
  if (!hasSignalV164(group)) return group;
  const leading = /^\s*/u.exec(group)?.[0] ?? "";
  const open = group.trim()[0];
  const inner = group.trim().slice(1, -1);
  const dash = DASH_CLAUSE_V164.exec(inner);
  const body =
    dash && hasSignalV164(inner.slice(0, dash.index)) && !hasSignalV164(inner.slice(dash.index + dash[0].length))
      ? inner.slice(dash.index + dash[0].length)
      : inner;
  const parts = body.split(/\s*[,，·;]\s*/u);
  if (!parts[0].trim() || hasSignalV164(parts[0])) return "";
  const kept = parts.filter((part) => part.trim() && !hasSignalV164(part));
  if (kept.length === 0) return "";
  return `${leading}${open}${kept.join(", ")}${open === "(" ? ")" : "）"}`;
}

/** Parentheses (innermost first) that carry a memo signal. */
function withoutMemoParenthesesV164(text: string): string {
  let current = text;
  for (let round = 0; round < 3; round += 1) {
    const next = current.replace(PAREN_V164, publicParenthesisV164);
    if (next === current) break;
    current = next;
  }
  return current;
}

/** "head — tail": the tail goes when it is the memo; the head is the statement. */
function withoutMemoDashTailV164(sentence: string): string {
  const match = DASH_CLAUSE_V164.exec(sentence);
  if (!match) return sentence;
  const tail = sentence.slice(match.index + match[0].length);
  return hasSignalV164(tail) ? sentence.slice(0, match.index) : sentence;
}

/**
 * One sentence, or "" when it is a memo. A sentence that lists things keeps the
 * parts without a signal - unless its first part is the memo, which then runs
 * on through the rest of the list ("재확보 대상 1차 출처: BTR1 제2장 · …").
 */
function publicSentenceV164(sentence: string): string {
  const trimmed = withoutMemoDashTailV164(sentence);
  if (!trimmed.trim()) return "";
  if (!hasSignalV164(trimmed)) return trimmed;
  // A list ("A · B · C") or the clauses of a plain sentence ("A, B"): the
  // reading that keeps more of the sentence wins.
  let best = "";
  for (const split of [LIST_SPLIT_V164, CLAUSE_SPLIT_V164]) {
    const pieces = trimmed.split(split);
    if (pieces.length < 3 || hasSignalV164(pieces[0])) continue;
    let text = "";
    for (let index = 0; index < pieces.length; index += 2) {
      if (hasSignalV164(pieces[index]) || !pieces[index].trim()) continue;
      text += text === "" ? pieces[index] : `${pieces[index - 1]}${pieces[index]}`;
    }
    if (text.length > best.length) best = text;
  }
  return best;
}

/**
 * The text without its working memos, or "" when nothing public is left.
 * Idempotent: scrubbing a scrubbed text changes nothing.
 */
export function publicWorkMemoV164(value: string): string {
  const original = String(value ?? "");
  if (!original) return "";
  // Quick exit: most cells carry no signal and no tag and are returned as they are.
  MEMO_TAG_V164.lastIndex = 0;
  if (!hasSignalV164(original) && !MEMO_TAG_V164.test(original)) return original;
  MEMO_TAG_V164.lastIndex = 0;
  let text = original.replace(MIGRATION_LOG_V164, "");
  for (const pointer of RAW_POINTER_V164) text = text.replace(pointer, "");
  for (const reference of ELEMENT_REFERENCE_V164) text = text.replace(reference, "");
  text = text.replace(MEMO_TAG_V164, " ").trim();
  text = text.replace(TRAILING_MEMO_V164, "");
  text = withoutMemoParenthesesV164(text);
  const pieces = text.split(SENTENCE_SPLIT_V164);
  // split() with a capture group interleaves sentences (even) and separators (odd).
  let result = "";
  let dropped = false;
  let closing = "";
  for (let index = 0; index < pieces.length; index += 2) {
    const kept = publicSentenceV164(pieces[index]);
    if (!kept.trim()) {
      dropped = true;
      continue;
    }
    // "대체로 …" depended on the sentence before it, which was a memo.
    const sentence = dropped && result === "" ? kept.replace(/^\s*대체로\s+/u, "") : kept;
    result += result === "" ? sentence : `${pieces[index - 1]}${sentence}`;
    // The full stop that ended this sentence stays when memo sentences follow it.
    closing = /^[.。]/u.test(pieces[index + 1] ?? "") ? (pieces[index + 1] as string).trim() : "";
  }
  if (dropped && closing && result) result += closing;
  return result
    .replace(/\s*[(（]\s*[)）]/gu, "")
    .replace(/(?:\s*[·,]\s*){2,}/gu, " · ")
    .replace(/\s{2,}/gu, " ")
    .replace(/^(?:[\s·,;—–:]|-(?=\s))+|[\s·,;—–:]+$/gu, "")
    .trim();
}

/** True when the cell is a memo through and through (nothing public is left). */
export function isWorkMemoOnlyV164(value: string): boolean {
  return String(value ?? "").trim() !== "" && publicWorkMemoV164(value) === "";
}
