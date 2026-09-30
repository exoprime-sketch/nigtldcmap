import type { VietnamElementMetaBundleV124, VietnamEntityV124 } from "../vietnam/vietnamTypesV124";
import { publicRecordNoteV161, publicSourceUrlV126, publicUnstatedWordingV161 } from "./publicFieldPolicyV126";

/**
 * V162: one reader for the wide record template.
 *
 * From the 2026-09-30 delivery on, the C-series sheets (and any other country
 * that uses the same template) write one row per record with the columns
 * grouped by a bracketed block in the header: "[식별] 레코드명", "[인센티브]
 * 유형", "[가격] 단가 (VND/kWh)", "[지역] 지역명 (현행)", "[출처] 원문 URL" …
 * The pack keeps that header as `meta.fieldDefinitions[].label`, beside the key
 * the value is stored under. This turns every entity into
 * `{ block: { attribute: value } }` so any screen can read a record without
 * knowing the element.
 *
 * What a reader never sees is decided here, by structure rather than per
 * element: the [식별] block (its 레코드명 and 레코드 유형 become the card's title
 * and type; the record id never leaves this file), the classification
 * bookkeeping blocks, administrative codes, a value that is a delivered file
 * name, and the record's own note (the supplier's processing memo). The
 * [출처] block becomes the record's source line.
 */

export interface WideFieldV162 {
  /** The key the value is stored under in normalizedAttributes. */
  key: string;
  /** The printed header, e.g. "[가격] 단가 (VND/kWh)". */
  label: string;
  block: string;
  attribute: string;
}

export interface WideValueV162 {
  attribute: string;
  value: string;
  href?: string;
}

export interface WideBlockV162 {
  block: string;
  /** The block name as a section title. */
  title: string;
  values: WideValueV162[];
}

export interface WideSourceV162 {
  document: string | null;
  url: string | null;
  pageUrl: string | null;
  citation: string | null;
}

export interface WideRecordV162 {
  entity: VietnamEntityV124;
  name: string;
  /** "[식별] 레코드 유형", e.g. "국가 목표", "지역 배분". */
  type: string | null;
  blocks: WideBlockV162[];
  source: WideSourceV162;
  /** One attribute value by block and attribute name, for screens that chart it. */
  get(block: string, attribute: string): string | null;
}

type FieldDefinitionsV162 = VietnamElementMetaBundleV124["fieldDefinitions"];

const HEADER_V162 = /^\[([^\]]+)\]\s*(.+)$/u;
/** Blocks that only keep the supplier's books: never a section on screen. */
const BOOKKEEPING_BLOCKS_V162 = new Set(["식별", "기술", "결측"]);
const SOURCE_BLOCK_V162 = "출처";
/** Block names that carry the supplier's process, shown under a reader's name. */
const BLOCK_TITLES_V162: Record<string, string> = { 현지조사: "현장 확인 자료" };
/** Attributes that are codes or record keys, in any block. */
const HIDDEN_ATTRIBUTE_V162 = /레코드\s*ID|행정\s*코드|P-?code|판단\s*(근거|유형)/iu;
/** A value that names a delivered or working file rather than stating anything. */
const FILE_VALUE_V162 =
  /(^raw\s*`)|`[^`]*\.(?:pdf|csv|xlsx?|json|md|txt|docx?|hwpx?|zip)`|(?:^|[\s(])[A-E]-\d{3}_[^\s]*\.(?:pdf|csv|xlsx?|json|md|txt|docx?|hwpx?|zip)\b|내부자료|Items_/iu;

export function wideFieldsV162(fieldDefinitions: FieldDefinitionsV162): WideFieldV162[] | null {
  const fields: WideFieldV162[] = [];
  for (const row of fieldDefinitions || []) {
    const match = HEADER_V162.exec(String(row.label || "").trim());
    if (!match) continue;
    fields.push({ key: row.normalizedKey, label: row.label, block: match[1].trim(), attribute: match[2].trim() });
  }
  // The template is recognised by its own header: a record name in [식별] and
  // at least one other block. A sheet with an odd bracketed column is not it.
  const hasName = fields.some((field) => field.block === "식별" && /레코드명/u.test(field.attribute));
  const blocks = new Set(fields.map((field) => field.block));
  return hasName && blocks.size >= 2 ? fields : null;
}

export function isWideTemplateV162(fieldDefinitions: FieldDefinitionsV162): boolean {
  return wideFieldsV162(fieldDefinitions) !== null;
}

function cellText(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "number") return Number.isFinite(value) ? String(value) : "";
  if (typeof value === "boolean") return value ? "예" : "아니오";
  return String(value).replace(/\s+/gu, " ").trim();
}

const FILE_EXTENSION_V162 = "pdf|csv|xlsx?|json|docx?|hwpx?|zip";
/** A cell that is only a file name, optionally with a page count: "…_Vietnam.pdf(3쪽)". */
const FILE_NAME_ONLY_V162 = new RegExp(String.raw`^(?!https?:)[^\n]*\.(?:${FILE_EXTENSION_V162})\s*(?:[(（][^)）]*[)）])?$`, "iu");
/** A parenthesis that only names a file: "부록 II(C-016_…_pl1-2.pdf)". */
const FILE_NAME_PAREN_V162 = new RegExp(String.raw`\s*[(（][^()（）]*\.(?:${FILE_EXTENSION_V162})\b[^()（）]*[)）]`, "giu");
/** A bare file-name token outside a URL. */
const FILE_NAME_TOKEN_V162 = new RegExp(String.raw`(^|\s)(?!https?:)[^\s()（）]+\.(?:${FILE_EXTENSION_V162})\b`, "giu");

/**
 * V162: file names never reach the screen (user decision 2026-09-30). A cell
 * that is only a file name is empty; a file name inside a sentence or a
 * citation is removed with its parenthesis. URLs are left whole - a link keeps
 * its address in href, and its text is set by the caller.
 */
export function withoutFileNamesV162(text: string): string {
  if (!text || /^https?:\/\//iu.test(text.trim())) return text;
  if (FILE_NAME_ONLY_V162.test(text.trim())) return "";
  return text
    .replace(FILE_NAME_PAREN_V162, "")
    .replace(FILE_NAME_TOKEN_V162, "$1")
    .replace(/\s{2,}/gu, " ")
    .replace(/\s+([,.;·)])/gu, "$1")
    .replace(/^[\s,;·]+|[\s,;·]+$/gu, "")
    .trim();
}

/** The link text for a source address: the document's title, else what it is. */
export function sourceLinkTextV162(url: string, title?: string | null): string {
  if (title) return title;
  return /\.pdf(?:$|[?#])/iu.test(url) ? "원문 PDF" : "원문";
}

/** Attributes that hold free-text notes, where the supplier's memo sentences can sit. */
const NOTE_ATTRIBUTE_V162 = /비고|설명|근거|메모|참고|주석|note/iu;

/**
 * The public form of one cell, or "" when nothing public is left. The record-
 * note cleanup (memo sentences, field-survey citations) runs only on note-like
 * attributes, so a name, clause or list elsewhere is never rewritten by it.
 */
export function publicWideValueV162(value: unknown, attribute = ""): string {
  const text = cellText(value);
  if (!text || FILE_VALUE_V162.test(text)) return "";
  const cleaned = NOTE_ATTRIBUTE_V162.test(attribute) ? publicRecordNoteV161(text) || "" : text;
  return withoutFileNamesV162(publicUnstatedWordingV161(cleaned));
}

export function readWideRecordsV162(
  entities: VietnamEntityV124[],
  fieldDefinitions: FieldDefinitionsV162
): WideRecordV162[] {
  const fields = wideFieldsV162(fieldDefinitions);
  if (!fields) return [];
  const nameField = fields.find((field) => field.block === "식별" && /레코드명/u.test(field.attribute));
  const typeField = fields.find((field) => field.block === "식별" && /레코드\s*유형/u.test(field.attribute));
  const sourceField = (pattern: RegExp) => fields.find((field) => field.block === SOURCE_BLOCK_V162 && pattern.test(field.attribute));
  const documentField = sourceField(/문서명/u);
  const urlField = sourceField(/^원문\s*URL/iu);
  const pageField = sourceField(/문서\s*페이지\s*URL|페이지\s*URL/iu);
  const citationField = sourceField(/인용\s*위치/u);

  return entities.map((entity) => {
    const attributes = (entity.normalizedAttributes || {}) as Record<string, unknown>;
    const read = (field: WideFieldV162 | undefined) => (field ? publicWideValueV162(attributes[field.key], field.attribute) : "");
    const byBlock = new Map<string, WideValueV162[]>();
    for (const field of fields) {
      if (BOOKKEEPING_BLOCKS_V162.has(field.block) || field.block === SOURCE_BLOCK_V162) continue;
      if (HIDDEN_ATTRIBUTE_V162.test(field.attribute)) continue;
      const value = read(field);
      if (!value) continue;
      const href = /URL|링크/iu.test(field.attribute) ? publicSourceUrlV126(value) || undefined : undefined;
      const list = byBlock.get(field.block) || [];
      list.push({ attribute: field.attribute, value, href });
      byBlock.set(field.block, list);
    }
    const blocks: WideBlockV162[] = [...byBlock].map(([block, values]) => ({
      block,
      title: BLOCK_TITLES_V162[block] || block,
      values,
    }));
    const lookup = new Map(fields.map((field) => [`${field.block}\u0000${field.attribute}`, field]));
    return {
      entity,
      name: read(nameField) || publicWideValueV162(entity.name),
      type: read(typeField) || null,
      blocks,
      source: {
        document: read(documentField) || null,
        url: urlField ? publicSourceUrlV126(read(urlField)) : null,
        pageUrl: pageField ? publicSourceUrlV126(read(pageField)) : null,
        citation: read(citationField) || null,
      },
      get(block: string, attribute: string) {
        const field = lookup.get(`${block}\u0000${attribute}`);
        return field && !HIDDEN_ATTRIBUTE_V162.test(field.attribute) ? read(field) || null : null;
      },
    };
  });
}

// ---------------------------------------------------------------------------
// Field definitions by country and element, recorded by the country loader
// when a pack is read, so a screen that only holds entities can still read the
// record's blocks (entities carry countryIso3 and elementId).
// ---------------------------------------------------------------------------
const FIELD_DEFINITIONS_V162 = new Map<string, NonNullable<FieldDefinitionsV162>>();

export function registerFieldDefinitionsV162(iso3: string, elementId: string, fieldDefinitions: FieldDefinitionsV162): void {
  if (fieldDefinitions && fieldDefinitions.length) FIELD_DEFINITIONS_V162.set(`${iso3}:${elementId}`, fieldDefinitions);
}

export function fieldDefinitionsForV162(iso3: string | null | undefined, elementId: string | null | undefined): FieldDefinitionsV162 {
  return FIELD_DEFINITIONS_V162.get(`${String(iso3 || "").toUpperCase()}:${String(elementId || "")}`);
}

/** The wide records of one element's entities, or [] when its sheet is not the wide template. */
export function wideRecordsOfEntitiesV162(entities: VietnamEntityV124[]): WideRecordV162[] {
  const first = entities[0] as (VietnamEntityV124 & { countryIso3?: string; elementId?: string }) | undefined;
  if (!first) return [];
  return readWideRecordsV162(entities, fieldDefinitionsForV162(first.countryIso3, first.elementId));
}
