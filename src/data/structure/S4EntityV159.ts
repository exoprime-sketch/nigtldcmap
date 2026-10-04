import { normalizeTechnologyIdV153 } from "../../utils/technologyIdV153";
import type { VietnamEntityV124, VietnamObservationV124 } from "../vietnam/vietnamTypesV124";
import type { S4EntityV159 } from "./structureTypesV159";
import { countryPublicDirV158 } from "../countryContext";
import { publicRecordRoleV142 } from "../visualization/publicRecordRoleV142";

/**
 * S4 adapter (docs/DATA_TYPOLOGY_V159_SCHEMA.md §2.4).
 *
 * Verified against ${countryPublicDirV158("VNM")} downloads for D-020 (GCF
 * projects), C-009/C-022 (law/checklist registries - a shared numbered-slot
 * template `속성1_레코드명 … 속성23_설명` also seen on C-024/C-025). Field
 * lookups use a normalized key (lower-cased, spaces/underscores stripped),
 * so a candidate list matches both Korean and English deliveries.
 *
 * | field | rule | example |
 * |---|---|---|
 * | recordKey | first attribute matching `recordkey`/`recordid`/`refno`/`레코드id`/`레코드키`; else `entity.name`; else `entity.recordId` | D-020 `Ref_No` |
 * | name | `entity.name`, else attribute `레코드명`/`명칭`/`orgname` | D-020, C-009 |
 * | recordType | attribute matching `분류`/`recordtype` (exact) | (035 `속성6_분류`, mostly unset in current samples) |
 * | year | attribute matching `시점`/`기준연도`/`year` | D-008-like S4 registries |
 * | date | attribute matching `발행일`/`이사회_승인일`/`시행일`/`공포일`/`승인일`/`date` (first `YYYY-MM-DD` substring found); or the numbered-slot pair `속성3_값`/`속성23_설명` when the description explicitly names a date (contains "일") and the value matches `YYYY-MM-DD` | D-020 `이사회_승인일`, C-009 `속성3_값`+`속성23_설명`="시행(발효)일" |
 * | status | attribute matching `상태`/`status` | D-020 |
 * | description | attribute matching `비고`/`description` only (never the numbered-slot's own `설명`, which names what `값` means, not the record) | D-020 `비고` |
 * | org | attribute matching `인가기관_ae`/`사업자_기관`/`org`/`기관` | D-020 |
 * | amount | a numeric attribute matching `대표금액`/`amount`/`amountvalue`, paired with a currency token (`USD`/`KRW`/`EUR`/`VND`/`JPY`/`GBP`/`CNY`) found in *any* string attribute on the same record; both must be present, or amount stays null. V164: when that string states the scale right after the token ("USD mn", "USD million") the amount carries `scale: 1000000`; otherwise `scale` is absent | D-020 (`대표금액` + `GCF_승인액` string ending "USD"), E-006 (`amountValue`+`currency`), D-017 (`예산유형` "약정액(USD mn)") |
 * | techIds | attribute matching `38대_기후기술`/`기술코드` whose value starts with a 1-2 digit number (e.g. "17 산업효율 기술") | D-020 |
 * | links | attributes matching `원문url`/`link`/`url`/`recordsourceurl` (all found, http(s) only) | C-009 `속성19_원문URL` |
 *
 * Known gaps (no rule implemented - values stay null/empty rather than
 * guessed):
 * - `regionTags` needs the schema's future `region_tags` "system:key" list
 *   (§2.4). Current deliveries only carry free-text province/region names
 *   (D-020 `대상지역`, C-013's note text) with no region-system prefix, so
 *   this adapter cannot turn them into a `system:key` tag without guessing
 *   which system applies. Stays `[]` for every S4 element today.
 * - `score` has no observed source column in the reviewed samples (C-022's
 *   checklist total is delivered as an S1 series, not on the S4 entities).
 *   Stays null.
 */

const ID_KEY_CANDIDATES = ["recordkey", "recordid", "refno", "레코드id", "레코드키"];
const NAME_KEY_CANDIDATES = ["레코드명", "명칭", "orgname"];
const TYPE_KEY_CANDIDATES = ["분류", "recordtype"];
const YEAR_KEY_CANDIDATES = ["시점", "기준연도", "year"];
const DATE_KEY_CANDIDATES = ["발행일", "이사회_승인일", "시행일", "공포일", "승인일", "date"];
const STATUS_KEY_CANDIDATES = ["상태", "status"];
const DESCRIPTION_KEY_CANDIDATES = ["비고", "description"];
const ORG_KEY_CANDIDATES = ["인가기관_ae", "사업자_기관", "org", "기관"];
const AMOUNT_KEY_CANDIDATES = ["대표금액", "amount", "amountvalue"];
const TECH_KEY_CANDIDATES = ["38대_기후기술", "기술코드"];
const LINK_KEY_CANDIDATES = ["원문url", "link", "url", "recordsourceurl"];
const CURRENCY_TOKENS = ["USD", "KRW", "EUR", "VND", "JPY", "GBP", "CNY"];

/**
 * Several S4 elements (C-009/C-022/C-024/C-025) share one numbered-slot
 * template - `속성1_레코드명`, `속성2_레코드ID`, `속성6_분류`, `속성23_설명` and
 * so on - where the leading `속성N_` is just the slot index, not part of the
 * field's meaning. Stripping it lets the same candidate lists below match
 * both this template and plain-named deliveries (D-020's `Ref_No`, `상태`)
 * without a second, element-specific lookup table.
 */
function normalizeKey(key: string): string {
  return key
    .replace(/^속성\d+_?/u, "")
    .toLowerCase()
    .replace(/[_\s]/gu, "");
}

/**
 * V162: the 2026-09-30 wide template prefixes each column with its block
 * ("기간_시행일", "제도_상태", "식별_레코드명"). The block is where the column
 * sits, not what it means; a key matches a candidate with or without it.
 * A full-key match still wins over a block-stripped one.
 */
function blockStrippedKey(key: string): string | null {
  const match = key.match(/^[가-힣]+_(.+)$/u);
  return match ? normalizeKey(match[1]) : null;
}

function findAttribute(
  attrs: Record<string, unknown>,
  candidates: readonly string[]
): { key: string; value: unknown } | null {
  const normalizedCandidates = candidates.map(normalizeKey);
  let stripped: { key: string; value: unknown } | null = null;
  for (const [key, value] of Object.entries(attrs)) {
    if (value === null || value === undefined || value === "") continue;
    if (normalizedCandidates.includes(normalizeKey(key))) return { key, value };
    const blockless = blockStrippedKey(key);
    if (!stripped && blockless && normalizedCandidates.includes(blockless)) stripped = { key, value };
  }
  return stripped;
}

function findAllAttributes(
  attrs: Record<string, unknown>,
  candidates: readonly string[]
): unknown[] {
  const normalizedCandidates = candidates.map(normalizeKey);
  const values: unknown[] = [];
  for (const [key, value] of Object.entries(attrs)) {
    if (value === null || value === undefined || value === "") continue;
    const blockless = blockStrippedKey(key);
    if (normalizedCandidates.includes(normalizeKey(key)) || (blockless && normalizedCandidates.includes(blockless))) values.push(value);
  }
  return values;
}

function toFiniteNumber(value: unknown): number | null {
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (typeof value === "string") {
    const parsed = Number(value.replace(/,/gu, "").trim());
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

/** The date and the (normalized) name of the column it came from, so a caller can tell an approval date from an issue date. */
function extractDateWithKey(attrs: Record<string, unknown>): { date: string; key: string } | null {
  const direct = findAttribute(attrs, DATE_KEY_CANDIDATES);
  if (direct) {
    const match = String(direct.value).match(/\d{4}-\d{2}-\d{2}/u);
    if (match) return { date: match[0], key: blockStrippedKey(direct.key) ?? normalizeKey(direct.key) };
  }
  // Numbered-slot delivery (C-009/C-022 style): a generic "값" column is a
  // date only when its sibling "설명" column says so (contains "일").
  const description = findAttribute(attrs, ["설명"]);
  const value = findAttribute(attrs, ["값"]);
  if (description && value && String(description.value).includes("일")) {
    const match = String(value.value).match(/\d{4}-\d{2}-\d{2}/u);
    if (match) return { date: match[0], key: normalizeKey(String(description.value)) };
  }
  return null;
}

function extractAmount(attrs: Record<string, unknown>): { value: number; currency: string | null; scale?: number } | null {
  const amountAttr = findAttribute(attrs, AMOUNT_KEY_CANDIDATES);
  const numeric = amountAttr ? toFiniteNumber(amountAttr.value) : null;
  if (numeric === null) return null;
  let currency: string | null = null;
  let scale: number | null = null;
  for (const value of Object.values(attrs)) {
    if (typeof value !== "string") continue;
    const match = value.match(new RegExp(`\\b(${CURRENCY_TOKENS.join("|")})\\b`, "u"));
    if (match) {
      currency = match[1];
      // V164: "USD mn" / "USD million" states that the figure is in millions.
      if (new RegExp(`\\b${match[1]}\\s*(mn|million)\\b`, "iu").test(value)) scale = 1_000_000;
      break;
    }
  }
  if (!currency) return null;
  return scale ? { value: numeric, currency, scale } : { value: numeric, currency };
}

function extractTechIds(attrs: Record<string, unknown>): string[] {
  const attr = findAttribute(attrs, TECH_KEY_CANDIDATES);
  if (!attr) return [];
  const match = String(attr.value).match(/^\s*(\d{1,2})\b/u);
  if (!match) return [];
  const code = normalizeTechnologyIdV153(match[1]);
  return code ? [code] : [];
}

function extractLinks(attrs: Record<string, unknown>): string[] {
  const values = findAllAttributes(attrs, LINK_KEY_CANDIDATES);
  const links = values
    .map((value) => String(value))
    .filter((value) => /^https?:\/\//u.test(value));
  return [...new Set(links)];
}

function buildRecord(
  elementId: string,
  indicatorId: string | null,
  name: string | null,
  note: string | null,
  attrs: Record<string, unknown>,
  fallbackRecordKey: string,
  recordRole?: S4EntityV159["recordRole"]
): S4EntityV159 {
  const idAttr = findAttribute(attrs, ID_KEY_CANDIDATES);
  const nameAttr = findAttribute(attrs, NAME_KEY_CANDIDATES);
  const typeAttr = findAttribute(attrs, TYPE_KEY_CANDIDATES);
  const yearAttr = findAttribute(attrs, YEAR_KEY_CANDIDATES);
  const statusAttr = findAttribute(attrs, STATUS_KEY_CANDIDATES);
  const descriptionAttr = findAttribute(attrs, DESCRIPTION_KEY_CANDIDATES);
  const orgAttr = findAttribute(attrs, ORG_KEY_CANDIDATES);
  const dated = extractDateWithKey(attrs);
  return {
    elementId,
    indicatorId,
    recordKey: (idAttr && String(idAttr.value)) || fallbackRecordKey,
    name: name ?? (nameAttr ? String(nameAttr.value) : null),
    recordType: typeAttr ? String(typeAttr.value) : null,
    year: yearAttr ? toFiniteNumber(yearAttr.value) : null,
    date: dated ? dated.date : null,
    status: statusAttr ? String(statusAttr.value) : null,
    description: descriptionAttr ? String(descriptionAttr.value) : null,
    amount: extractAmount(attrs),
    org: orgAttr ? String(orgAttr.value) : null,
    regionTags: [],
    techIds: extractTechIds(attrs),
    links: extractLinks(attrs),
    score: null,
    origin: "entity",
    ...(recordRole ? { recordRole } : {}),
    dateKey: dated ? dated.key : null,
  };
}

/**
 * `observations` is optional: current S4 elements (C-009, C-022, D-020) all
 * deliver as entities. The schema (§2.4) still documents a legacy
 * observation-row path ("법령 번호를 value로" - one record per row, keyed by
 * the value itself) for forward compatibility with older deliveries; no
 * reviewed sample currently exercises it (see the unit test's synthetic
 * fixture).
 */
export function adaptS4V159(
  entities: readonly VietnamEntityV124[],
  observations?: readonly VietnamObservationV124[]
): S4EntityV159[] {
  const entityRecords = entities.map((entity) =>
    buildRecord(
      entity.elementId,
      entity.indicatorId ?? null,
      entity.name ?? null,
      entity.note ?? null,
      entity.normalizedAttributes || {},
      // The documented order: an id attribute, else the record's own name, else the pack id.
      entity.name || entity.recordId,
      publicRecordRoleV142(entity).role
    )
  );
  const observationRecords = (observations || []).map((obs) => ({
    elementId: obs.elementId,
    indicatorId: obs.indicatorId,
    recordKey: String(obs.value ?? obs.recordId),
    name: null,
    recordType: null,
    year: obs.year ?? null,
    date: null,
    status: null,
    description: obs.note ?? null,
    amount: null,
    org: null,
    regionTags: [],
    techIds: [],
    links: [],
    score: null,
    origin: "observation" as const,
  }));
  return [...entityRecords, ...observationRecords];
}
