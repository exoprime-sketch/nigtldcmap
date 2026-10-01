import { publicProcessWordingV162 } from "./processWordingV162";
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

export { publicProcessWordingV162 };

const HEADER_V162 = /^\[([^\]]+)\]\s*(.+)$/u;
/** Blocks that only keep the supplier's books: never a section on screen. */
// V162: [기술] is not bookkeeping as a whole - C-005 states each priority
// technology's name, stage and score there. Its technology-code judgement
// columns are, and are hidden by attribute below.
const BOOKKEEPING_BLOCKS_V162 = new Set(["식별", "결측"]);
const SOURCE_BLOCK_V162 = "출처";
/** Block names that carry the supplier's process, shown under a reader's name. */
const BLOCK_TITLES_V162: Record<string, string> = { 현지조사: "현장 확인 자료" };
/** Attributes that are codes or record keys, in any block. */
// V162: the supplier's own file bookkeeping ("[링크] raw 보유 여부", "raw 파일명").
// V162: also the identifier columns ("GCAP NAZCA ID") and the field survey's
// own table reference ("[현지조사] 표" = "ELEMENT C-014 표").
const HIDDEN_ATTRIBUTE_V162 = /레코드\s*ID|행정\s*코드|P-?code|판단\s*(근거|유형)|\braw\b|\bID$|^표$|기술코드/iu;
/** A format hint in the column label ("시행일 (YYYY-MM-DD)", "시행 연도 (년)"). */
const FORMAT_HINT_V162 = /\s*\((?:YYYY(?:[-.]MM(?:[-.]DD)?)?|년|월|일)\)\s*$/u;
/** A value that names a delivered or working file rather than stating anything. */
const FILE_VALUE_V162 =
  /(^raw\s*`)|`[^`]*\.(?:pdf|csv|xlsx?|json|md|txt|docx?|hwpx?|zip)`|(?:^|[\s(])[A-E]-\d{3}_[^\s]*\.(?:pdf|csv|xlsx?|json|md|txt|docx?|hwpx?|zip)\b|내부자료|Items_|\bELEMENT\s+[A-E]-\d{3}\b|\bDataset\s+[A-Z]\s+시트/iu;

export function wideFieldsV162(fieldDefinitions: FieldDefinitionsV162): WideFieldV162[] | null {
  const fields: WideFieldV162[] = [];
  for (const row of fieldDefinitions || []) {
    const match = HEADER_V162.exec(String(row.label || "").trim());
    if (!match) continue;
    fields.push({ key: row.normalizedKey, label: row.label, block: match[1].trim(), attribute: match[2].trim().replace(FORMAT_HINT_V162, "") || match[2].trim() });
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
    // "·" is a mid-sentence list separator ("베트남 총리(승인·공포) · 산업무역부
    // (작성)"), not closing punctuation - collapsing the space before it too
    // (as for ",.;)" ) joined the two sides of a real "A · B" list together.
    .replace(/\s+([,.;)])/gu, "$1")
    .replace(/^[\s,;·]+|[\s,;·]+$/gu, "")
    .trim();
}

/** The link text for a source address: the document's title, else what it is. */
export function sourceLinkTextV162(url: string, title?: string | null): string {
  if (title) return title;
  return /\.pdf(?:$|[?#])/iu.test(url) ? "원문 PDF" : "원문";
}

/** A citation that points into the supplier's workbook ("Dataset C 시트 22행"). */
// …or names a raw column key ("SOURCE_ORGANIZATION") or an internal sheet,
// or (V162, C-008) the supplier's own file ("C-008_… 참여 현황_….csv") and a
// raw key=value pointer into it ("public_id=GCAP14444").
const WORKBOOK_CITATION_V162 = /(?:Dataset\s+[A-Z]\s*)?시트\s*(?:[「"“][^」"”]*[」"”]\s*)?\d+\s*행|\b[A-Z]{3,}_[A-Z_]{3,}\b|\bELEMENT\s+[A-E]-\d{3}\b|\bDataset\s+[A-Z]\b|(?:^|[^A-Za-z0-9])[A-E]-\d{3}_|\b[a-z]+_id=/u;

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
  return publicProcessWordingV162(withoutFileNamesV162(publicUnstatedWordingV161(cleaned)));
}

const SHORT_VALUE_V162 = 40;

/** Up to two values that tell the records at `indexes` apart, per record. */
function distinguishingValuesV162(records: WideRecordV162[], indexes: number[], allowLong: boolean): string[][] {
  const candidates = new Map<string, string[]>();
  indexes.forEach((index, position) => {
    const record = records[index];
    const pairs: Array<[string, string]> = record.blocks.flatMap((block) => block.values.filter((value) => !value.href).map((value) => [`${block.block}\u0000${value.attribute}`, value.value] as [string, string]));
    if (record.source.document) pairs.push(["source\u0000document", record.source.document]);
    if (record.source.citation) pairs.push(["source\u0000citation", record.source.citation]);
    for (const [key, raw] of pairs) {
      if (!raw || raw === record.name) continue;
      if (raw.length > SHORT_VALUE_V162 && !allowLong) continue;
      // A long value is cut at a word boundary and marked as cut; never reworded.
      const value = raw.length > SHORT_VALUE_V162 ? `${raw.slice(0, SHORT_VALUE_V162).replace(/\s+\S*$/u, "")}…` : raw;
      const list = candidates.get(key) || indexes.map(() => "");
      list[position] = value;
      candidates.set(key, list);
    }
  });
  const chosen: string[] = [];
  const signature = (position: number, keys: string[]) => keys.map((key) => candidates.get(key)?.[position] || "").join("\u0001");
  const distinctWith = (keys: string[]) => new Set(indexes.map((_, position) => signature(position, keys))).size;
  for (let round = 0; round < 2; round += 1) {
    if (chosen.length && distinctWith(chosen) === indexes.length) break;
    let best: { key: string; distinct: number } | null = null;
    candidates.forEach((values, key) => {
      // The short pass uses only values every record states; the long pass
      // also a value some records leave blank (a blank adds nothing).
      if (chosen.includes(key) || (!allowLong && values.some((value) => !value))) return;
      const distinct = distinctWith([...chosen, key]);
      if (distinct > (chosen.length ? distinctWith(chosen) : 1) && (!best || distinct > best.distinct)) best = { key, distinct };
    });
    if (!best) break;
    chosen.push((best as { key: string }).key);
  }
  return indexes.map((_, position) => chosen.map((key) => candidates.get(key)?.[position] || "").filter(Boolean));
}

/**
 * V162: records sharing one name ("장벽" ×275 in C-005, where the sheet names a
 * barrier by its type; two "넷제로 목표연도" in C-004 from two documents) are
 * told apart by what they state: up to two short values that differ inside the
 * group (대상 기술, 분류, the source document …), appended to the name. A group
 * those cannot separate (C-005's barriers share technology and class; only the
 * barrier text differs) is then told apart by its longer stated values, cut at
 * 40 characters. Nothing is invented; records stating the same values keep the
 * same name.
 */
function disambiguateWideNamesV162(records: WideRecordV162[]): WideRecordV162[] {
  const names = records.map((record) => record.name);
  for (const allowLong of [false, true, true]) {
    const groups = new Map<string, number[]>();
    names.forEach((name, index) => groups.set(name, [...(groups.get(name) || []), index]));
    groups.forEach((indexes) => {
      if (indexes.length < 2) return;
      const suffixes = distinguishingValuesV162(records, indexes, allowLong);
      indexes.forEach((index, position) => {
        if (suffixes[position].length) names[index] = [names[index], ...suffixes[position]].join(" · ");
      });
    });
  }
  return records.map((record, index) => (names[index] !== record.name ? { ...record, name: names[index] } : record));
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

  return disambiguateWideNamesV162(entities.map((entity) => {
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
        citation: (() => {
          const citation = read(citationField);
          return citation && !WORKBOOK_CITATION_V162.test(citation) ? citation : null;
        })(),
      },
      get(block: string, attribute: string) {
        // A caller may name the column as the sheet prints it ("대상 연도 (년)");
        // the format hint is not part of the attribute.
        const field =
          lookup.get(`${block}\u0000${attribute}`) ||
          lookup.get(`${block}\u0000${attribute.replace(FORMAT_HINT_V162, "")}`);
        return field && !HIDDEN_ATTRIBUTE_V162.test(field.attribute) ? read(field) || null : null;
      },
    };
  }));
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
