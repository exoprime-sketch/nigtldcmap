import regionNamesJson from "./regionNamesV161.json";

/**
 * V161-A: region names as "한글명 (현지명)".
 *
 * The dictionary is built by scripts/v161/build-region-names-v161.mjs:
 * Viet Nam's 34 post-2025 units, six centrally-run cities and 63 pre-2025
 * provinces from the platform's own tables, Bangladesh's 8 divisions and 64
 * districts, and - marked `pending` - rule-based proposals for other Vietnamese
 * place names found in the data. A name outside the dictionary is shown as it
 * came, never guessed. The local name is the caller's source spelling, kept
 * as is (tone marks and all) inside the brackets.
 */

export type RegionLevelV161 = "adm1-34" | "adm1-63" | "city" | "locality" | "division" | "district";

export interface RegionNameEntryV161 {
  readonly level: RegionLevelV161;
  readonly code?: string;
  readonly local: string;
  readonly ko: string;
  readonly source: string;
  readonly reviewStatus: "confirmed" | "pending";
  readonly keys: readonly string[];
  readonly parent?: string;
  readonly mergedInto?: { readonly code: string; readonly ko: string; readonly effective: string };
}

export interface RegionNameQueryV161 {
  /** ISO3 of the data country ("VNM", "BGD"), any case. */
  readonly country: string;
  /** The place name exactly as the source wrote it. */
  readonly raw: string | null | undefined;
  /**
   * Which list the name belongs to. Pre- and post-2025 Vietnamese provinces
   * share many names, so a caller that knows the vintage says so; without a
   * level the country's lists are tried in order (current units first).
   */
  readonly level?: RegionLevelV161;
}

interface RegionNamesDocumentV161 {
  readonly countries: Record<string, { readonly levels: readonly RegionLevelV161[]; readonly entries: readonly RegionNameEntryV161[] }>;
}

const DOCUMENT = regionNamesJson as unknown as RegionNamesDocumentV161;

// Key normalisation - the same rules as regionKey() in the generator.
const WRAPPER = /^[\s"'“”‘’([{,.;:\-–—]+|[\s"'“”‘’)\]},.;:\-–—]+$/gu;
const VI_ADMIN_PREFIX = /^(?:tỉnh|thành phố|thanh pho|tp\.?|t\.p\.?|thị xã|thị trấn|huyện|quận|phường|xã)\s+/u;
const EN_ADMIN_PREFIX = /^(?:province of|city of)\s+/u;
const EN_ADMIN_SUFFIX = /\s+(?:provinces?|city|municipality|division|district|commune|ward|town)$/u;

/** Lookup key: no tone marks, no administrative words, letters and digits only. */
export function regionNameKeyV161(raw: string | null | undefined): string {
  let text = String(raw ?? "").normalize("NFC").replace(WRAPPER, "").toLowerCase();
  let previous: string;
  do {
    previous = text;
    text = text.replace(VI_ADMIN_PREFIX, "").replace(EN_ADMIN_PREFIX, "").replace(EN_ADMIN_SUFFIX, "");
  } while (text !== previous);
  text = text.normalize("NFD").replace(/[̀-ͯ]/gu, "").replace(/đ/gu, "d");
  return text.replace(/[^a-z0-9]+/gu, "");
}

const INDEX = new Map<string, Map<string, RegionNameEntryV161>>();
for (const [country, block] of Object.entries(DOCUMENT.countries)) {
  for (const entry of block.entries) {
    const id = `${country}:${entry.level}`;
    if (!INDEX.has(id)) INDEX.set(id, new Map());
    const byKey = INDEX.get(id)!;
    for (const key of entry.keys) if (!byKey.has(key)) byKey.set(key, entry);
  }
}

/** The source spelling as shown in brackets: Unicode NFC, outer spaces trimmed. */
export function regionNameLocal(raw: string | null | undefined): string {
  return String(raw ?? "").normalize("NFC").trim();
}

export function regionNameEntryV161({ country, raw, level }: RegionNameQueryV161): RegionNameEntryV161 | null {
  const iso3 = String(country || "").toUpperCase();
  const block = DOCUMENT.countries[iso3];
  const key = regionNameKeyV161(raw);
  if (!block || !key) return null;
  for (const candidate of level ? [level] : block.levels) {
    const entry = INDEX.get(`${iso3}:${candidate}`)?.get(key);
    if (entry) return entry;
  }
  return null;
}

/** The Korean name, or null when the dictionary does not know the place. */
export function regionNameKo(query: RegionNameQueryV161): string | null {
  return regionNameEntryV161(query)?.ko ?? null;
}

/** "한글명 (현지명)"; the brackets are dropped when the two are the same. */
export function composeRegionNameV161(ko: string | null | undefined, local: string): string {
  if (!ko) return local;
  if (!local || ko === local) return ko;
  return `${ko} (${local})`;
}

/**
 * The display form. `mode: "label"` gives the Korean name alone, for map labels
 * where space is short; a name the dictionary does not know stays as written.
 * A name still under review (`pending`: rule-based transliterations of
 * districts and localities) is shown in the local spelling only - an
 * unreviewed Korean name never reaches the screen (user decision 2026-09-29).
 */
export function formatRegionName(query: RegionNameQueryV161 & { readonly mode?: "full" | "label" }): string {
  const local = regionNameLocal(query.raw);
  const entry = regionNameEntryV161(query);
  const ko = entry && entry.reviewStatus === "confirmed" ? entry.ko : null;
  if (query.mode === "label") return ko || local;
  return composeRegionNameV161(ko, local);
}

/** Separators of a place list as the data writes one ("ThanhHóa · NghệAn", "Ho Chi Minh City; Hanoi"). */
const REGION_LIST_SEPARATOR_V162 = /(\s+·\s+|\s*;\s*)/u;

/**
 * V162: a region value as shown on a card or a detail screen. A list is split
 * and each place formatted on its own; the separators are kept. Text that is
 * not a known place (a sentence, "Hanoi 외 8개 지역") comes back unchanged.
 */
export function formatRegionTextV162(query: RegionNameQueryV161): string {
  const text = String(query.raw ?? "");
  if (!text.trim()) return text;
  return text
    .split(REGION_LIST_SEPARATOR_V162)
    .map((part, index) => (index % 2 === 1 ? part : part.trim() ? formatRegionName({ ...query, raw: part }) : part))
    .join("");
}

function particleRo(word: string): string {
  const code = word.charCodeAt(word.length - 1);
  if (code < 0xac00 || code > 0xd7a3) return "(으)로";
  const final = (code - 0xac00) % 28;
  return final === 0 || final === 8 ? "로" : "으로";
}

/**
 * For a pre-2025 Vietnamese province: "2025.7.1 ○○(으)로 통합", naming the
 * post-2025 unit it became part of. Null for anything else, and for provinces
 * the reform left as they were.
 */
export function regionMergeNoteV161(query: RegionNameQueryV161): string | null {
  const entry = regionNameEntryV161({ ...query, level: "adm1-63" });
  if (!entry?.mergedInto) return null;
  const [year, month, day] = entry.mergedInto.effective.split("-").map(Number);
  return `${year}.${month}.${day} ${entry.mergedInto.ko}${particleRo(entry.mergedInto.ko)} 통합`;
}
