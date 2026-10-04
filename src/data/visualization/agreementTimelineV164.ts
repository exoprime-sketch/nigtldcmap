import type { VietnamEntityV124 } from "../vietnam/vietnamTypesV124";
import { koreanListV164 } from "./publicCategoryLabelV164";

/**
 * V164-3: the dates, names and detail line of the trade-agreement (A-029) and
 * bilateral-agreement (E-014) timelines.
 *
 * A-029 delivers the signing and the entry-into-force date in columns of their
 * own (Viet Nam: yyyyMmDd, yyyyMmDd2; Bangladesh: "...A_029_서명일", "...A_029_발효일")
 * and the other agreements' events only in the note ("사건일 — 협상 개시:
 * 2021-06-16; ..."). The timeline read none of the Bangladesh columns, so all 18
 * of its agreements read "시점 미기재". Nothing here estimates a date: a value is
 * the delivered cell or the delivered event, written with its own label.
 */

const DATE_VALUE_V164 = /^\d{4}(?:-\d{2}){0,2}$/u;
const DATE_NAME_V164 = /^\d{4}(?:-\d{2}){0,2}$/u;
const STATUS_NAME_V164 = /^(?:검토\s*중|협상\s*(?:개시|중)|발효|서명(?:\(미발효\))?|중단|미정)$/u;
const AGREEMENT_NAME_NOTE_V164 = /\[\s*협정명\s*[:：]\s*([^\]]+)\]/u;

function cellTextV164(value: unknown): string {
  if (value === null || value === undefined || typeof value === "object") return "";
  return String(value).replace(/\s+/gu, " ").trim();
}

function dateCellV164(attributes: Record<string, unknown>, keys: string[], pattern: RegExp): string {
  for (const key of keys) {
    const text = cellTextV164(attributes[key]);
    if (text) return text;
  }
  const matching = Object.keys(attributes).find((key) => pattern.test(key) && cellTextV164(attributes[key]));
  return matching ? cellTextV164(attributes[matching]) : "";
}

/**
 * The last dated event the note lists - "사건일 — 검토 개시: 2018; 협상 개시:
 * 2021-06-16; WTO 통보: 미통보" gives "협상 개시 2021-06-16". The events are in
 * the order the source lists them, which is chronological; the WTO notification
 * is the registry's bookkeeping date, not a step of the agreement.
 */
export function eventDateV164(note: unknown): string {
  const text = cellTextV164(note);
  const events = /사건일\s*[—–-]\s*([^·]+)/u.exec(text)?.[1];
  if (!events) return "";
  const dated = events
    .split(/\s*;\s*/u)
    .map((event) => /^(.+?)\s*:\s*(\S+)\s*$/u.exec(event.trim()))
    .filter((match): match is RegExpExecArray => Boolean(match) && DATE_VALUE_V164.test((match as RegExpExecArray)[2]) && !/WTO/u.test((match as RegExpExecArray)[1]));
  const last = dated[dated.length - 1];
  return last ? `${last[1].trim()} ${last[2]}` : "";
}

/** The date text of an A-029 row, or "" when the delivery states none. */
export function agreementDateTextV164(entity: VietnamEntityV124): string {
  if (entity.elementId !== "A-029") return "";
  const attributes = (entity.normalizedAttributes || {}) as Record<string, unknown>;
  const signed = dateCellV164(attributes, ["yyyyMmDd"], /A_029_서명일$/u);
  const effective = dateCellV164(attributes, ["yyyyMmDd2"], /A_029_발효일$/u);
  if (signed && effective) return `서명 ${signed} · 발효 ${effective}`;
  if (signed) return `서명 ${signed}`;
  if (effective) return `발효 ${effective}`;
  return eventDateV164(entity.note);
}

/**
 * Some A-029 rows are named by their signing date or their status ("2016-02-04",
 * "검토 중"); the agreement's name is in the note, "[협정명: Trans-Pacific
 * Partnership (TPP)]". The row keeps every other field.
 */
export function withAgreementNameV164(entity: VietnamEntityV124): VietnamEntityV124 {
  if (entity.elementId !== "A-029") return entity;
  const name = cellTextV164(entity.name);
  if (name && !DATE_NAME_V164.test(name) && !STATUS_NAME_V164.test(name)) return entity;
  const named = AGREEMENT_NAME_NOTE_V164.exec(String(entity.note ?? ""))?.[1]?.trim();
  return named ? ({ ...entity, name: named } as VietnamEntityV124) : entity;
}

/** "일본(JPN)–방글라데시(BGD)" reads "일본–방글라데시": the ISO code is the delivery's key, not a name. */
export function partiesTextV164(value: unknown): string {
  return cellTextV164(value).replace(/\s*\([A-Z]{3}\)/gu, "");
}

/**
 * The registry's own words for what happened to an agreement after it came into
 * force ("Upgrade Signed and in effect: 2016"), read in Korean. Only these
 * fixed phrases are translated; anything else stays as delivered.
 */
const ARIC_KIND_V164: Readonly<Record<string, string>> = { upgrade: "업그레이드", expansion: "확대" };
const ARIC_STATUS_V164: Readonly<Record<string, string>> = {
  "signed and in effect": "발효",
  "signed but not yet in effect": "서명(미발효)",
  "negotiations concluded": "협상 타결",
  "negotiations launched": "협상 개시",
  "review launched": "검토 개시",
};

export function koreanAricEventsV164(value: string): string {
  const items = value.split(/\s*;\s*/u).map((item) => {
    const match = /^(?:(Upgrade|Expansion)\s+)?(.+?)\s*:\s*(\d{4}(?:-\d{2}){0,2})$/u.exec(item.trim());
    if (!match) return item;
    const status = ARIC_STATUS_V164[match[2].trim().toLowerCase()];
    if (!status) return item;
    const kind = match[1] ? ARIC_KIND_V164[match[1].toLowerCase()] : "";
    return `${kind ? `${kind} ` : ""}${status}: ${match[3]}`;
  });
  return items.join("; ");
}

/**
 * The note of an agreement as a detail line: the sheet's own status and the
 * unified status are told apart instead of repeated, a label the note states
 * twice is stated once (the first, which is the sheet's own column), the English
 * source label of the status is not repeated beside its Korean reading, and a
 * member list reads in Korean when every member is a country the dictionary
 * knows. Every dated or counted fact of the note is kept.
 */
export function agreementDetailV164(detail: string): string {
  const parts = detail.split(/\s+·\s+/u).map((part) => part.trim()).filter(Boolean);
  const labelOf = (part: string) => /^(\[[^\]]+\]|[^:：]{1,24}?)\s*[:：]\s*/u.exec(part)?.[1] ?? "";
  const hasOwnStatus = parts.some((part) => labelOf(part) === "상태");
  const seen = new Set<string>();
  const kept: string[] = [];
  for (const part of parts) {
    const label = labelOf(part);
    // The record's link has its own "원문 보기"; the address is not repeated in the line.
    const value = (label ? part.slice(part.indexOf(":") + 1).trim() : part).replace(/\s*\(\s*https?:\/\/[^)\s]+\s*\)/gu, "");
    if (/^원천\s*상태\s*표기$/u.test(label)) continue;
    // The heading already names the agreement.
    if (/^\[\s*협정명/u.test(part)) continue;
    if (label === "상태(통일)") {
      const own = parts.find((candidate) => labelOf(candidate) === "상태");
      if (hasOwnStatus && own && own.slice(own.indexOf(":") + 1).trim() === value) continue;
      kept.push(hasOwnStatus ? `원천 기준 상태: ${value}` : `상태: ${value}`);
      continue;
    }
    const outputLabel = label.replace(/\(원문\s*표기\)$/u, "");
    if (label && seen.has(outputLabel)) continue;
    if (label) seen.add(outputLabel);
    if (label === "갱신·확대") {
      kept.push(`${label}: ${koreanAricEventsV164(value)}`);
      continue;
    }
    if (/^회원국\(\d+\)$/u.test(label)) {
      kept.push(`${label}: ${koreanListV164(value)}`);
      continue;
    }
    kept.push(label ? `${outputLabel}: ${value}` : value);
  }
  return kept.join(" · ");
}
