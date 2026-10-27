import relocationContractV171 from "./recordRelocationV171.json";
import { withDirectoryKeysV164 } from "../visualization/directoryEntitiesV164";

/**
 * V171: rows a delivery filed under one element that the 2026-10-23 design
 * decision shows under another.
 *
 * E-001 (CTCN NDE) and E-002 (Article 6.4 DNA) each name one designated body
 * per country. The deliveries of 2026-09-30 also listed CTCN network members
 * and technical-assistance proponents in E-001, and the CDM activities in
 * transition in E-002. The supplier's restructured files (2026-10-13~16) put
 * the institutions in E-005 and the activities in C-025, row for row the same
 * values. Until those files replace the 09-30 workbooks, the platform shows
 * the delivered rows where the decision puts them: nothing is created,
 * renamed or dropped, and the downloads keep the delivered files.
 *
 * The rule is keyed by element and indicator, never by country, so a country
 * added later follows it without code; once a delivery already files the rows
 * under the target element, the source has none left to move and the target
 * lists each institution once.
 */

export type RelocationKindV171 = "institutions" | "cdm-activities";

export interface RelocationRuleV171 {
  sourceElementId: string;
  targetElementId: string;
  kind: RelocationKindV171;
  indicatorPattern: string;
  sourceNotice: string;
  targetTitle: string;
  sectionEyebrow: string;
  sectionTitle: string;
  sectionNote: string;
}

interface RelocatableRecordV171 {
  recordId: string;
  indicatorId?: string | null;
  name?: string | null;
  normalizedAttributes?: Record<string, unknown> | null;
}

export const RELOCATION_RULES_V171: readonly RelocationRuleV171[] = relocationContractV171.rules as RelocationRuleV171[];

const MAP_WITHDRAWN_V171: ReadonlySet<string> = new Set(relocationContractV171.mapWithdrawn);

export const MAP_WITHDRAWN_REASON_V171: string = relocationContractV171.mapWithdrawnReason;

/** E-001 and E-002 name one body per country: no layer of their own on the data map. */
export function isMapWithdrawnV171(elementId: string | null | undefined): boolean {
  return Boolean(elementId && MAP_WITHDRAWN_V171.has(elementId));
}

export function relocationFromV171(elementId: string | null | undefined): RelocationRuleV171 | null {
  return RELOCATION_RULES_V171.find((rule) => rule.sourceElementId === elementId) || null;
}

export function relocationIntoV171(elementId: string | null | undefined): RelocationRuleV171 | null {
  return RELOCATION_RULES_V171.find((rule) => rule.targetElementId === elementId) || null;
}

function movesV171(rule: RelocationRuleV171, record: RelocatableRecordV171): boolean {
  return new RegExp(rule.indicatorPattern, "iu").test(String(record.indicatorId || ""));
}

/** The rows an element keeps once the rows the decision moved are taken out. */
export function recordsKeptV171<T extends RelocatableRecordV171>(elementId: string, records: T[]): T[] {
  const rule = relocationFromV171(elementId);
  if (!rule) return records;
  return records.filter((record) => !movesV171(rule, record));
}

const ORGANISATION_KEYS_V171 = ["orgName", "organizationName", "field_7b638c0f"];

function organisationNameV171(record: RelocatableRecordV171): string {
  const attributes = (withDirectoryKeysV164(record as never) as RelocatableRecordV171).normalizedAttributes || {};
  for (const key of ORGANISATION_KEYS_V171) {
    const value = attributes[key];
    if (value !== null && value !== undefined && typeof value !== "object" && String(value).trim()) return String(value).trim();
  }
  return String(record.name || "").trim();
}

function compactV171(value: string): string {
  return value.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, "");
}

function acronymsV171(value: string): string[] {
  return Array.from(value.matchAll(/\(([^()]{2,16})\)/gu), (match) => compactV171(match[1])).filter((token) => token.length >= 2);
}

/**
 * The same institution under two spellings: equal names once case and
 * punctuation are dropped, one long name inside the other ("Institute of
 * Energy" within "Institute of Energy (IE/IEVN, MOIT 산하)"), or the same
 * bracketed acronym ("(BCAS)").
 */
export function sameInstitutionV171(left: string, right: string): boolean {
  const a = compactV171(left);
  const b = compactV171(right);
  if (!a || !b) return false;
  if (a === b) return true;
  if (Math.min(a.length, b.length) >= 10 && (a.includes(b) || b.includes(a))) return true;
  const acronymsA = acronymsV171(left);
  const acronymsB = acronymsV171(right);
  return acronymsA.some((token) => acronymsB.includes(token));
}

/**
 * The source's moved rows as the target lists them. Institutions the target
 * already lists are left out, so each institution reads once; CDM activities
 * are projects, listed as delivered.
 */
export function movedRecordsV171<T extends RelocatableRecordV171>(rule: RelocationRuleV171, sourceRecords: T[], targetRecords: RelocatableRecordV171[]): T[] {
  const moved = sourceRecords.filter((record) => movesV171(rule, record));
  if (rule.kind !== "institutions") {
    const present = new Set(targetRecords.filter((record) => movesV171(rule, record)).map((record) => compactV171(organisationNameV171(record))));
    return moved.filter((record) => !present.has(compactV171(organisationNameV171(record))));
  }
  const targetNames = targetRecords.map(organisationNameV171).filter(Boolean);
  const seen: string[] = [];
  return moved.filter((record) => {
    const name = organisationNameV171(record);
    if (!name) return true;
    if (targetNames.some((other) => sameInstitutionV171(name, other))) return false;
    if (seen.some((other) => sameInstitutionV171(name, other))) return false;
    seen.push(name);
    return true;
  });
}
