/**
 * V164-3: a power plant's facts where the delivery states them outside the
 * named fields, so every plant of both countries reads the same way - in the
 * facility card (map popup, map panel, detail page) and in the record list.
 *
 * Bangladesh's A-023 rows came in the shared numbered columns (the column label
 * names the A-023 slot: "속성1_…_A_023_설비용량_MW_…", "속성2_…_A_023_주연료_…"),
 * their name field holds the capacity ("50"), and the registry's name, year and
 * source sit in the row note ("[발전소명: Amnura] … 준공연도: 2011 · 원천: …").
 * Each is read only where the named field is empty, and only as written - a
 * value neither place states stays unstated (the card prints 미기재).
 *
 * No imports beyond the entity type: the record-title module reads this too.
 */
import type { VietnamEntityV124 } from "../vietnam/vietnamTypesV124";

export const NUMBER_ONLY_NAME_V164 = /^[\d.,\s]+$/u;

const UNSTATED_V164 = /^(?:\(?\s*(?:미기재|미표기|미공개|미확인|미상)\s*\)?|nan|null|undefined|[-—–])$/iu;

function statedText(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  const out = String(value).trim();
  return !out || UNSTATED_V164.test(out) ? null : out;
}

/** "라벨: 값" in a record note, up to the next "·" or "]"; null when not stated. */
function notePairV164(note: string, labels: string[]): string | null {
  for (const label of labels) {
    const match = new RegExp(`(?:^|[·\\[\\]]\\s*)${label}:\\s*([^·\\]]+?)\\s*(?=·|\\]|$)`, "u").exec(note);
    const value = match ? statedText(match[1]) : null;
    if (value) return value;
  }
  return null;
}

/** The plant's name as the delivery states it: the note's 발전소명 when the name field holds a figure. */
export function powerPlantStatedNameV164(entity: Pick<VietnamEntityV124, "name" | "note">): string | null {
  const ownName = statedText(entity.name);
  if (ownName && !NUMBER_ONLY_NAME_V164.test(ownName)) return ownName;
  return notePairV164(String(entity.note || ""), ["발전소명"]) || ownName;
}

export function powerPlantStatedEntityV164(entity: VietnamEntityV124): VietnamEntityV124 {
  const attributes = { ...((entity.normalizedAttributes || {}) as Record<string, unknown>) };
  let changed = false;
  const assign = (key: string, value: unknown) => {
    if (statedText(attributes[key]) !== null || statedText(value) === null) return;
    attributes[key] = value;
    changed = true;
  };
  for (const [key, value] of Object.entries(entity.normalizedAttributes || {})) {
    if (/_A_023_설비용량_MW(?:_|$)/u.test(key)) assign("capacityMw", value);
    if (/_A_023_주연료(?:_|$)/u.test(key)) assign("primaryFuel", value);
  }
  const note = String(entity.note || "");
  const year = /(?:^|·\s*)준공연도:\s*(\d{4})(?:\.0+)?\s*(?=·|\]|$)/u.exec(note)?.[1];
  if (year) assign("commissioningYear", Number(year));
  assign("owner", notePairV164(note, ["소유자"]));
  assign("sourceName", notePairV164(note, ["출처", "원천"]));
  const stated = powerPlantStatedNameV164(entity);
  const name = stated && stated !== statedText(entity.name) ? stated : entity.name;
  if (!changed && name === entity.name) return entity;
  return { ...entity, name, normalizedAttributes: attributes } as VietnamEntityV124;
}
