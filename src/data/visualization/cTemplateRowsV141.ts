/**
 * One reading of the shared C template's attribute rows (속성1_레코드명 … 속성23_설명).
 *
 * The C deliveries store a wide sheet as one row per stated attribute. A
 * row's name often carries its subject and the attribute it states ("JETP —
 * 공식 참여 여부"), its value sits in 속성3_값, and the bound of a range or
 * the unit lives only in the row's note ("[하한(min)] …", "… VND/kWh"). This
 * module reads those parts once so the C-007/C-008/C-018 analyses and the
 * card builder count the same things (V141).
 */
import type { VietnamEntityV124 } from "../vietnam/vietnamTypesV124";
import { publicTextV126 } from "./publicFieldPolicyV126";

export type CTemplateBoundV141 = "min" | "max" | null;

export interface CTemplateRowV141 {
  recordId: string;
  indicatorId: string;
  /** The full record name as delivered. */
  name: string;
  /** The subject before " — ", or the whole name. */
  subject: string;
  /** The attribute after " — ", or null when the name is the subject itself. */
  attribute: string | null;
  /** 속성3_값 as text. */
  valueText: string;
  /** 속성3_값 when it is a number (a value like "약 400" is read as 400 with `approximate`). */
  value: number | null;
  approximate: boolean;
  /** 속성4_시점 as text: a year, a period ("2026-2030") or a date. */
  timeText: string;
  /** The year in 속성4_시점 when it states one. */
  year: number | null;
  category: string;
  status: string;
  organisation: string;
  registry: string;
  sector: string;
  description: string;
  /** The row's note with the bound tag and the compiler's own remarks removed. */
  note: string;
  bound: CTemplateBoundV141;
  url: string;
  /** The legal document the note or value names (Quyết định 768/QĐ-TTg, Thông tư 07/2024/TT-BCT). */
  document: string | null;
}

const text = (value: unknown): string => publicTextV126(value) || "";

const DOCUMENT_PATTERN_V141 =
  /(?:Quyết định|Thông tư|Nghị định|Nghị quyết|Quyet dinh|Thong tu|Nghi dinh)\s+[\d./A-Za-zĐ-]+/u;

/** Remarks addressed to the compiler, not the reader ("검토의견 '…' 반영", "raw: ….md"). */
const COMPILER_REMARK_V141 = [
  // "(4.SB61_Art.6.8_Japan.pdf)" names the compiler's file; the document is
  // named in words beside it.
  /\s*\([^()]*\.(?:pdf|xlsx?|csv|md)\)/giu,
  /\b[\w.-]+\.(?:pdf|xlsx?|csv|md)\b/giu,
  /\s*검토의견\s*['‘"][^'’"]*['’"]\s*(?:반영|대응)?[^.]*\.?/gu,
  /\s*raw:\s*[^\s]+\.md/gu,
  /\s*검증등급\s*[a-z]\b/gu,
];

export function cleanCTemplateNoteV141(note: unknown): string {
  let value = text(note);
  if (!value) return "";
  value = value.replace(/^\[(?:하한\(min\)|상한\(max\))\]\s*/u, "");
  COMPILER_REMARK_V141.forEach((pattern) => {
    value = value.replace(pattern, "");
  });
  return value.replace(/\s+/gu, " ").trim();
}

function boundOf(note: string, name: string): CTemplateBoundV141 {
  if (/^\[하한\(min\)\]/u.test(note) || /\(min\)|하한$/u.test(name)) return "min";
  if (/^\[상한\(max\)\]/u.test(note) || /\(max\)|상한$/u.test(name)) return "max";
  return null;
}

function numberOf(valueText: string): { value: number | null; approximate: boolean } {
  const approximate = /^약\s*/u.test(valueText);
  const trimmed = valueText.replace(/^약\s*/u, "").replace(/,/gu, "");
  if (!/^[-+]?\d+(?:\.\d+)?$/u.test(trimmed)) return { value: null, approximate: false };
  return { value: Number(trimmed), approximate };
}

export function parseCTemplateRowV141(entity: VietnamEntityV124): CTemplateRowV141 {
  const attributes = (entity.normalizedAttributes || {}) as Record<string, unknown>;
  const name = text(attributes["속성1_레코드명"]) || text(entity.name);
  const separator = name.indexOf(" — ");
  const subject = separator >= 0 ? name.slice(0, separator).trim() : name;
  const attribute = separator >= 0 ? name.slice(separator + 3).trim() || null : null;
  const rawValue = attributes["속성3_값"];
  const valueText = typeof rawValue === "number" ? String(rawValue) : text(rawValue);
  const parsedNumber = typeof rawValue === "number" ? { value: rawValue, approximate: false } : numberOf(valueText);
  const rawTime = attributes["속성4_시점"];
  const timeText = typeof rawTime === "number" ? String(rawTime) : text(rawTime);
  const yearMatch = timeText.match(/(?:19|20|21)\d{2}/u);
  const rawNote = text(entity.note);
  const document = (rawNote.match(DOCUMENT_PATTERN_V141) || valueText.match(DOCUMENT_PATTERN_V141))?.[0] || null;
  return {
    recordId: entity.recordId,
    indicatorId: entity.indicatorId || "",
    name,
    subject,
    attribute,
    valueText,
    value: parsedNumber.value,
    approximate: parsedNumber.approximate,
    timeText,
    year: yearMatch ? Number(yearMatch[0]) : null,
    category: text(attributes["속성6_분류"]),
    status: text(attributes["속성7_상태"]),
    organisation: text(attributes["속성8_사업자_기관"]),
    registry: text(attributes["속성5_등록표준_출처"]),
    sector: text(attributes["속성18_업종"]),
    description: text(attributes["속성23_설명"]),
    note: cleanCTemplateNoteV141(rawNote),
    bound: boundOf(rawNote, name),
    url: text(attributes["속성19_원문URL"]),
    document,
  };
}

export function parseCTemplateRowsV141(entities: VietnamEntityV124[]): CTemplateRowV141[] {
  return entities.map(parseCTemplateRowV141);
}

/** A range from one or two rows of the same item and time: the stated bounds, or both values sorted. */
export function rangeOfV141(rows: CTemplateRowV141[]): { min: number; max: number } | null {
  const values = rows.filter((row) => row.value !== null);
  if (!values.length) return null;
  const min = values.find((row) => row.bound === "min")?.value ?? Math.min(...values.map((row) => row.value as number));
  const max = values.find((row) => row.bound === "max")?.value ?? Math.max(...values.map((row) => row.value as number));
  return { min: Math.min(min, max), max: Math.max(min, max) };
}

export function formatRangeV141(range: { min: number; max: number }, digits = 0): string {
  const format = (value: number) =>
    value.toLocaleString("en-US", { maximumFractionDigits: digits, minimumFractionDigits: 0 });
  return range.min === range.max ? format(range.min) : `${format(range.min)}~${format(range.max)}`;
}
