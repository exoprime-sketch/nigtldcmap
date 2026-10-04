import { publicProcessWordingV162 } from "./processWordingV162";
import type { VietnamElementMetaBundleV124, VietnamEntityV124 } from "../vietnam/vietnamTypesV124";
import { publicRecordNoteV161, publicSourceUrlV126, publicUnstatedWordingV161 } from "./publicFieldPolicyV126";
import { publicWorkMemoV164 } from "./publicWorkMemoV164";
import { koreanCategoryV164 } from "./publicCategoryLabelV164";

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
// V164-3: "재확보 대상 출처" (the source the compiler still meant to fetch) and
// "관련 데이터요소" (the sheet's cross references) are working columns.
const HIDDEN_ATTRIBUTE_V162 = /레코드\s*ID|행정\s*코드|P-?code|판단\s*(근거|유형)|\braw\b|\bID$|^표$|기술코드|재확보\s*대상|관련\s*데이터\s*요소/iu;
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
// V164-3: also a pointer into an API payload ("actors[] publicId=GCAP26615"):
// the key=value pair names a field, not a place in a document.
const WORKBOOK_CITATION_V162 = /(?:Dataset\s+[A-Z]\s*)?시트\s*(?:[「"“][^」"”]*[」"”]\s*)?\d+\s*행|\b[A-Z]{3,}_[A-Z_]{3,}\b|\bELEMENT\s+[A-E]-\d{3}\b|\bDataset\s+[A-Z]\b|(?:^|[^A-Za-z0-9])[A-E]-\d{3}_|\b[a-z]+_id=|\bactors\[\]|\b[a-z]+Id=/u;

/** Attributes that hold free-text notes, where the supplier's memo sentences can sit. */
const NOTE_ATTRIBUTE_V162 = /비고|설명|근거|메모|참고|주석|note/iu;

/**
 * The public form of one cell, or "" when nothing public is left. The record-
 * note cleanup (memo sentences, field-survey citations) runs only on note-like
 * attributes, so a name, clause or list elsewhere is never rewritten by it.
 */
export function publicWideValueV162(value: unknown, attribute = ""): string {
  const text = cellText(value);
  if (!text || FILE_VALUE_V162.test(text) || PLACEHOLDER_V164.test(text)) return "";
  const cleaned = NOTE_ATTRIBUTE_V162.test(attribute) ? publicRecordNoteV161(text) || "" : text;
  // V164-3: the delivery's working memos, in any column (note-like or not),
  // then an API's own field names and the markup the sheet's text still carries.
  const plain = plainMarkupV164(
    withoutApiKeysV164(publicWorkMemoV164(publicProcessWordingV162(withoutFileNamesV162(publicUnstatedWordingV161(cleaned)))))
  );
  // V164 R2: classification keys, the sheet's own column names and English
  // classification values, in the form a reader reads.
  return translatedClassificationV164(publicColumnNameV164(withoutPipeKeysV164(plain), attribute), attribute);
}

/** What a sheet writes for "no value": a dash or "N/A". "해당 없음" is a statement and stays. */
const PLACEHOLDER_V164 = /^(?:[—–-]+|n\/?a|none|null)$/iu;

/**
 * A classification the source keeps as "name|group" ("기준·의무·규범 (Standards,
 * obligations and norms|Regulation)", C-009/C-010): the bar is the source's key
 * delimiter. The group reads as a Korean word after a slash and the name stays.
 */
export function withoutPipeKeysV164(text: string): string {
  if (!text.includes("|")) return text;
  return text
    .replace(/\(([^()|]+?)\s*\|\s*([^()|]+?)\)/gu, (_match, name: string, group: string) => `(${name.trim()} / ${koreanCategoryV164(group.trim())})`)
    .replace(/([A-Za-z가-힣])\s*\|\s*(?=[A-Za-z가-힣])/gu, "$1 / ");
}

/**
 * The scoring basis C-005 names by the TAP table's own column ("Weighted score
 * 열", "Weighted score (With PV) 열"): the English column name is the source's
 * term, the Korean words say what it is.
 */
function publicColumnNameV164(text: string, attribute: string): string {
  if (!/산정\s*기준|산출\s*기준/u.test(attribute)) return text;
  const named = /^Weighted score(?:\s*\(\s*With PV\s*\))?\s*열?$/iu.exec(text.trim());
  if (!named) return text;
  return /With PV/iu.test(text) ? "가중 점수 (Weighted score, 태양광 포함)" : "가중 점수 (Weighted score)";
}

/** An attribute whose value is a classification (a type, a category, a sector). */
const CLASSIFICATION_ATTRIBUTE_V164 = /분류|유형|구분|부문|분야|종류/u;

/**
 * An English classification value in a classification column reads in Korean
 * ("Support actions" → "지원 조치"); a column that states the source's own wording
 * ("부문 (원문)") keeps it after the Korean name: "에너지 (Energy)". A value the
 * dictionary does not know is left as delivered.
 */
function translatedClassificationV164(text: string, attribute: string): string {
  if (!text || !CLASSIFICATION_ATTRIBUTE_V164.test(attribute) || /[가-힣]/u.test(text)) return text;
  const korean = koreanCategoryV164(text);
  if (korean === text) return text;
  return /원문|영문|원어/u.test(attribute) ? `${korean} (${text})` : korean;
}

/**
 * A column label as a reader reads it: the sheet's own spec hints ("근거 법령
 * (번호 + 국문 명칭)", "적용 조건 (용량·기한 등 사업 요건)") are not part of the
 * name, and a "+" that joins two names reads as the list it is.
 */
export function publicAttributeLabelV164(attribute: string): string {
  return attribute
    .replace(/\s*\((?:번호\s*\+\s*국문\s*명칭|용량·기한\s*등\s*사업\s*요건)\)\s*$/u, "")
    .replace(/\s+\+\s+/gu, " · ")
    .trim();
}

/**
 * V164-3: the names of an API's own fields and records, out of a source or a
 * reason ("플랫폼 ParticipatingParties에 베트남 없음", "…NMA Platform, nma-list
 * API (2026-09-11 조회)", "nma-list API 레코드 Id=ad2f0eae · 플랫폼 상세 페이지").
 * The field is named as the sheet's own column names it; a record pointer goes,
 * the page it points at stays.
 */
const API_KEY_REWRITES_V164: ReadonlyArray<readonly [RegExp, string]> = [
  [/\bParticipatingParties\b/gu, "참여 당사국 목록"],
  [/\s*,?\s*\bnma-list\s+API\s+(?:레코드\s*)?(?:Id=[0-9a-f]+)?\s*·?\s*/giu, " "],
];

export function withoutApiKeysV164(text: string): string {
  if (!text || !/ParticipatingParties|nma-list/iu.test(text)) return text;
  let result = text;
  for (const [pattern, replacement] of API_KEY_REWRITES_V164) result = result.replace(pattern, replacement);
  return result
    .replace(/\s{2,}/gu, " ")
    .replace(/\(\s*\)/gu, "")
    .replace(/^[\s·,]+|[\s·,]+$/gu, "")
    .trim();
}

const LATEX_SPAN_V164 = /\$([^$]*\\[A-Za-z][^$]*)\$/gu;
const LATEX_SYMBOLS_V164: ReadonlyArray<readonly [RegExp, string]> = [
  [/\\(?:ge|geq)\b/gu, "≥"],
  [/\\(?:le|leq)\b/gu, "≤"],
  [/\\times\b/gu, "×"],
  [/\\approx\b/gu, "≈"],
  [/\\%/gu, "%"],
  [/\\text\{([^{}]*)\}/gu, "$1"],
];

/**
 * V164-3: markup that reached the cell from the sheet's text editor. A LaTeX
 * span is written as its symbols; the sheet's line-break mark "⏎" becomes a
 * real line break, which the card shows as one. A dollar amount ("$368
 * billion") has no backslash and is left alone.
 */
export function plainMarkupV164(text: string): string {
  if (!text || !/\$|⏎/u.test(text)) return text;
  const plain = text.replace(LATEX_SPAN_V164, (_span, body: string) =>
    LATEX_SYMBOLS_V164.reduce((current, [pattern, replacement]) => current.replace(pattern, replacement), body)
      .replace(/\s{2,}/gu, " ")
      .trim()
  );
  return plain.replace(/\s*⏎\s*/gu, "\n").trim();
}

const SHORT_VALUE_V162 = 40;

/**
 * V164 R2: a bare number ("20037", "6.8", "35,000") says nothing in a title -
 * "적응 재원 총 소요 2023-2050 · 20037" read as a figure with no unit. A year is
 * a number a reader does read, and a period ("2023-2050") is not a bare number.
 */
export function isBareNumberTitleValueV164(value: string): boolean {
  const text = String(value ?? "").trim();
  if (!/^[+-]?\d[\d,]*(?:\.\d+)?$/u.test(text)) return false;
  return !/^(?:19|20)\d{2}$/u.test(text);
}

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
      if (isBareNumberTitleValueV164(raw)) continue;
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
    let best: { key: string; distinct: number; length: number } | null = null;
    candidates.forEach((values, key) => {
      // The short pass uses only values every record states; the long pass
      // also a value some records leave blank (a blank adds nothing).
      if (chosen.includes(key) || (!allowLong && values.some((value) => !value))) return;
      const distinct = distinctWith([...chosen, key]);
      // Of two columns that tell the records apart equally well, the one with
      // the shorter values names them better ("BDT" over "십억 BDT").
      const length = values.reduce((sum, value) => sum + value.length, 0);
      if (distinct > (chosen.length ? distinctWith(chosen) : 1) && (!best || distinct > best.distinct || (distinct === best.distinct && length < best.length))) {
        best = { key, distinct, length };
      }
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

  const records = entities.map((entity) => {
    const attributes = (entity.normalizedAttributes || {}) as Record<string, unknown>;
    const read = (field: WideFieldV162 | undefined) => (field ? publicWideValueV162(attributes[field.key], field.attribute) : "");
    // V164-3: a card that defines a grade ("외교부 여행경보 등급 — 여행금지") does
    // not state a current grade: its "현재 등급 (단계)" reads "등급 (단계)".
    const definesGrade = DEFINITION_TYPE_V164.test(read(typeField));
    const recordName = read(nameField);
    const byBlock = new Map<string, WideValueV162[]>();
    for (const field of fields) {
      if (BOOKKEEPING_BLOCKS_V162.has(field.block) || field.block === SOURCE_BLOCK_V162) continue;
      if (HIDDEN_ATTRIBUTE_V162.test(field.attribute)) continue;
      const value = read(field);
      if (!value) continue;
      // V164 R2: a composite name column ("제도명 + 적용 대상") that holds the
      // record's own name says it a second time under the title.
      if (recordName && value === recordName && /\s\+\s/u.test(field.attribute)) continue;
      const href = /URL|링크/iu.test(field.attribute) ? publicSourceUrlV126(value) || undefined : undefined;
      const list = byBlock.get(field.block) || [];
      const label = publicAttributeLabelV164(field.attribute);
      list.push({ attribute: definesGrade ? label.replace(/^현재\s+/u, "") : label, value, href });
      byBlock.set(field.block, list);
    }
    const blocks: WideBlockV162[] = [...byBlock].map(([block, values]) => ({
      block,
      title: BLOCK_TITLES_V162[block] || block,
      values,
    }));
    const lookup = new Map(fields.map((field) => [`${field.block}\u0000${field.attribute}`, field]));
    const pageUrl = pageField ? publicSourceUrlV126(read(pageField)) : null;
    const sourceUrl = urlField ? publicSourceUrlV126(read(urlField)) : null;
    return {
      entity,
      name: titleWithProjectV164(repairCutTitleV164(read(nameField) || publicWideValueV162(entity.name), blocks), blocks),
      type: read(typeField) || null,
      blocks,
      source: {
        document: read(documentField) || null,
        // V164-3: an API endpoint is not a page a reader can open; the record's
        // own page (when the sheet gives one) is the link.
        url: sourceUrl && pageUrl && API_ENDPOINT_V164.test(sourceUrl) ? null : sourceUrl,
        pageUrl,
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
  });
  return disambiguateWideNamesV162(sortNumberedSeriesV164(sortYearSeriesV164(records)));
}

const DEFINITION_TYPE_V164 = /등급\s*체계/u;
const API_ENDPOINT_V164 =/\/api\/|\.azure-api\.net\b/iu;

/**
 * V164-3: a title that ends in the sheet's own short code ("CDM→제6.4조 전환
 * 활동 — COOK", "… — TITA") names the project instead, as the record states
 * it in 사업명. A record without a project name keeps its title ("NDC 3.0
 * 감축수단 — AFOLU" names a sector, not a code).
 */
export function titleWithProjectV164(name: string, blocks: WideBlockV162[]): string {
  const match = /^(.+?)\s+—\s+[A-Z]{3,6}$/u.exec(name);
  if (!match) return name;
  const project = blocks.flatMap((block) => block.values).find((value) => /^사업명/u.test(value.attribute) && value.value);
  return project ? `${match[1]} — ${project.value}` : name;
}

/**
 * V164-3: the sheet cut some record names at about 80 characters, mid-word
 * ("… 신형 풍력터빈을 포", "JCM VN016, Installation of High Efficiency Kiln in
 * Sanitary Ware Manufacturing Fa"). When one of the record's own values starts
 * with the cut name (after at most a short prefix such as the project number),
 * that value is the full name: the title is completed from it, or - when it
 * would be long - ended at its first sentence, its last list item or its last
 * whole word. A name no value continues is left as it is.
 */
export function repairCutTitleV164(name: string, blocks: WideBlockV162[]): string {
  if (name.length < 50) return name;
  const values = blocks.flatMap((block) => block.values.filter((value) => !value.href).map((value) => value.value));
  for (const value of values) {
    for (let offset = 0; offset <= 24 && name.length - offset >= 40; offset += 1) {
      const rest = name.slice(offset);
      if (value.length <= rest.length || !value.startsWith(rest)) continue;
      const full = `${name.slice(0, offset)}${value}`;
      const sentenceEnd = full.search(/[.。]\s/u);
      if (sentenceEnd >= 20 && sentenceEnd <= name.length) return full.slice(0, sentenceEnd);
      if (full.length <= 140) return full;
      const items = name.split(" · ");
      if (items.length >= 3) return items.slice(0, -1).join(" · ");
      return `${name.replace(/\s+\S*$/u, "")}…`;
    }
  }
  return name;
}

interface YearSeriesKeyV164 {
  stem: string;
  year: number;
  suffix: string;
  leading: boolean;
}

/**
 * "민간참여 인프라 투자 실적 2019: Energy" is the 2019 entry of the series
 * "민간참여 인프라 투자 실적" (suffix "Energy"); "2025 태양광" is the 2025 entry
 * of "태양광". A name that does not end (or start) in a year is not an entry.
 */
function yearSeriesKeyV164(name: string): YearSeriesKeyV164 | null {
  const leading = /^((?:19|20)\d{2})(?:년)?\s+(.+)$/u.exec(name);
  if (leading) return { stem: leading[2].trim(), year: Number(leading[1]), suffix: "", leading: true };
  const trailing = /^(.+?)\s+((?:19|20)\d{2})(?:년)?(?:\s*[:：]\s*(.+))?$/u.exec(name);
  if (trailing) return { stem: trailing[1].trim(), year: Number(trailing[2]), suffix: (trailing[3] || "").trim(), leading: false };
  return null;
}

/**
 * V164-3: records of one yearly series (3+ entries over 3+ years: C-012's PPI
 * investment by year, C-016's capacity by year and source) were delivered in
 * no order. They are listed together, newest year first, at the place the
 * series first appears; a year's total comes before its breakdown. Records
 * that are not a series keep their delivered order.
 */
export function sortYearSeriesV164<T extends { name: string; type: string | null }>(records: T[]): T[] {
  const keys = records.map((record) => yearSeriesKeyV164(record.name));
  const idOf = (index: number) => {
    const key = keys[index];
    return key ? `${records[index].type ?? ""}\u0000${key.leading ? "L" : "T"}\u0000${key.stem}` : "";
  };
  const groups = new Map<string, number[]>();
  keys.forEach((key, index) => {
    if (key) groups.set(idOf(index), [...(groups.get(idOf(index)) || []), index]);
  });
  const series = new Set<string>();
  groups.forEach((indexes, id) => {
    const years = indexes.map((index) => (keys[index] as YearSeriesKeyV164).year);
    if (indexes.length < 3 || new Set(years).size < 3) return;
    // A series the sheet already lists in year order (either way) is left as it is.
    const steps = years.slice(1).map((year, position) => Math.sign(year - years[position]));
    if (steps.every((step) => step >= 0) || steps.every((step) => step <= 0)) return;
    series.add(id);
  });
  if (series.size === 0) return records;
  const emitted = new Set<number>();
  const sorted: T[] = [];
  records.forEach((record, index) => {
    if (emitted.has(index)) return;
    const id = idOf(index);
    if (!id || !series.has(id)) {
      sorted.push(record);
      emitted.add(index);
      return;
    }
    const members = [...(groups.get(id) || [])].sort((a, b) => {
      const left = keys[a] as YearSeriesKeyV164;
      const right = keys[b] as YearSeriesKeyV164;
      return right.year - left.year || Number(Boolean(left.suffix)) - Number(Boolean(right.suffix)) || a - b;
    });
    for (const member of members) {
      sorted.push(records[member]);
      emitted.add(member);
    }
  });
  return sorted;
}

interface NumberedKeyV164 {
  stem: string;
  /** The first number of the name: "2.10" is [2, 10], "5,000,000" is [5000000]. */
  first: number[];
}

/**
 * "건축허가 절차 10 — …" is the 10th entry of "건축허가 절차"; "환경허가 수수료 —
 * 투자규모 5,000,000 ~ 10,000,000 Tk" the entry at 5,000,000 of "환경허가 수수료 —
 * 투자규모". The stem is what comes before the first number. No key: a name with
 * no number, a leading year (a yearly series, ordered by sortYearSeriesV164) and
 * a document number ("Decree 57/2025/NĐ-CP" says nothing about order).
 */
function numberedKeyV164(name: string): NumberedKeyV164 | null {
  const match = /^(\D{3,}?)\s*(\d[\d,]*(?:\.\d+)*)(?![\d,]*\/\d)/u.exec(name);
  if (!match) return null;
  const token = match[2].replace(/,+$/u, "");
  if (/^(?:19|20)\d{2}$/u.test(token.replace(/,/gu, ""))) return null;
  const first = (token.includes(",") ? [token.replace(/,/gu, "")] : token.split(".")).map(Number);
  const stem = match[1].trim();
  return first.every(Number.isFinite) && stem.length >= 3 ? { stem, first } : null;
}

function compareNumberedV164(left: number[], right: number[]): number {
  for (let position = 0; position < Math.max(left.length, right.length); position += 1) {
    const difference = (left[position] ?? -1) - (right[position] ?? -1);
    if (difference) return difference;
  }
  return 0;
}

/**
 * V164 R2: records of one numbered series (C-014's 16 construction-permit
 * steps, its fee brackets) were delivered in text order ("절차 1", "절차 10",
 * "절차 11" ... "절차 2"; a bracket from 5,000,000 before one from 100,000). They
 * are listed together, in number order, at the place the series first
 * appears. Left as delivered: a series already in number order (either way),
 * fewer than 3 entries, and a stem whose numbers repeat (two outlines that each
 * start again at 1 - "1. Legal" and "1. Domestic Pilot ETS" - are not one
 * series).
 */
export function sortNumberedSeriesV164<T extends { name: string; type: string | null }>(records: T[]): T[] {
  const keys = records.map((record) => numberedKeyV164(record.name));
  const idOf = (index: number) => {
    const key = keys[index];
    return key ? `${records[index].type ?? ""}\u0000${key.stem}` : "";
  };
  const groups = new Map<string, number[]>();
  keys.forEach((key, index) => {
    if (key) groups.set(idOf(index), [...(groups.get(idOf(index)) || []), index]);
  });
  const series = new Set<string>();
  groups.forEach((indexes, id) => {
    const numbers = indexes.map((index) => (keys[index] as NumberedKeyV164).first);
    if (indexes.length < 3 || new Set(numbers.map((number) => number.join("."))).size < indexes.length) return;
    const steps = numbers.slice(1).map((number, position) => Math.sign(compareNumberedV164(number, numbers[position])));
    if (steps.every((step) => step >= 0) || steps.every((step) => step <= 0)) return;
    series.add(id);
  });
  if (series.size === 0) return records;
  const emitted = new Set<number>();
  const sorted: T[] = [];
  records.forEach((record, index) => {
    if (emitted.has(index)) return;
    const id = idOf(index);
    if (!id || !series.has(id)) {
      sorted.push(record);
      emitted.add(index);
      return;
    }
    const members = [...(groups.get(id) || [])].sort((a, b) => compareNumberedV164((keys[a] as NumberedKeyV164).first, (keys[b] as NumberedKeyV164).first) || a - b);
    for (const member of members) {
      sorted.push(records[member]);
      emitted.add(member);
    }
  });
  return sorted;
}

/** A value long enough to be a sentence; shorter values are labels and codes. */
const SHARED_MIN_LENGTH_V164 = 60;
const SHARED_MIN_COUNT_V164 = 4;
const SHARED_MIN_SHARE_V164 = 0.6;

export interface SharedWideValueV164 {
  block: string;
  blockTitle: string;
  attribute: string;
  value: string;
  /** Records that state this value. */
  count: number;
  /** All records of the list. */
  total: number;
}

/**
 * V164 R2: a long value that most records carrying its column state in the
 * same words (BGD C-017's "지역 요건 판정" note on all 39 cards, C-022's
 * "근거" on 34 of 34). It is told once above the list instead of on every
 * card. Needs 4+ records, and 60%+ of the records that have the column; a
 * link is never shared.
 */
export function sharedWideValuesV164(records: WideRecordV162[]): SharedWideValueV164[] {
  const holders = new Map<string, number>();
  const tally = new Map<string, SharedWideValueV164>();
  for (const record of records) {
    for (const block of record.blocks) {
      for (const value of block.values) {
        if (value.href) continue;
        const column = `${block.block}\u0000${value.attribute}`;
        holders.set(column, (holders.get(column) || 0) + 1);
        if (value.value.length < SHARED_MIN_LENGTH_V164) continue;
        const key = `${column}\u0000${value.value}`;
        const current = tally.get(key) || { block: block.block, blockTitle: block.title, attribute: value.attribute, value: value.value, count: 0, total: records.length };
        current.count += 1;
        tally.set(key, current);
      }
    }
  }
  return [...tally.entries()]
    .filter(([key, shared]) => shared.count >= SHARED_MIN_COUNT_V164 && shared.count / (holders.get(key.split("\u0000").slice(0, 2).join("\u0000")) || shared.count) >= SHARED_MIN_SHARE_V164)
    .map(([, shared]) => shared);
}

/**
 * V164 R2: a sentence the source wrote in English (a barrier's content, a field
 * survey's key clause), not a name or a code: 30+ characters, 5+ words and
 * nothing but ASCII letters and punctuation (a Vietnamese or Bengali text is
 * not English; a text with any Korean is already partly read).
 */
export function isEnglishSentenceV164(value: string): boolean {
  const text = String(value ?? "").trim();
  if (text.length < 30 || /^https?:\/\//iu.test(text)) return false;
  if (/[^\u0000-\u007F ‐-‧]/u.test(text)) return false;
  return (text.match(/[A-Za-z][A-Za-z'’-]*/gu) || []).length >= 5;
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

const REFORMED_NAME_ATTRIBUTE_V163 = "지역명 (개편 전)";
const CURRENT_NAME_ATTRIBUTE_V163 = "지역명 (현행)";
const PLAIN_NAME_ATTRIBUTE_V163 = "지역명";

/**
 * V163 (3a): a [지역] block's "지역명 (개편 전)"/"지역명 (현행)" pair is the 2025
 * Vietnamese administrative reform's before/after name - meaningful only for a
 * country that went through that reform. A country with no reform (e.g.
 * Bangladesh) that nonetheless carries both columns (inherited from the same
 * wide-sheet template, both filled with the one name it has) shows a single
 * plain "지역명" row instead - the "개편 전" column dropped, never invented.
 * The default country (Viet Nam) is untouched: its two columns always stay,
 * whatever their values.
 */
export function mergeRegionNameValuesV163(values: WideValueV162[]): WideValueV162[] {
  const current = values.find((value) => value.attribute === CURRENT_NAME_ATTRIBUTE_V163);
  const reformed = values.find((value) => value.attribute === REFORMED_NAME_ATTRIBUTE_V163);
  if (!current && !reformed) return values;
  const kept = current || reformed;
  if (!kept) return values;
  return [
    { ...kept, attribute: PLAIN_NAME_ATTRIBUTE_V163 },
    ...values.filter(
      (value) => value.attribute !== CURRENT_NAME_ATTRIBUTE_V163 && value.attribute !== REFORMED_NAME_ATTRIBUTE_V163
    ),
  ];
}
