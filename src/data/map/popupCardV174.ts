/**
 * V174: one popup card for every map popup, and one way to name a feature.
 *
 * - Every popup is a title plus label · value rows, as the A-023 facility card
 *   is: the value, where it sits (rank, shared value, class), how it was
 *   aggregated, the reference year and the source. At most six rows.
 * - A name written in another language (Vietnamese, Bengali, English…) is shown
 *   "한글설명 (원어)". The Korean part is built from the record's own facts - its
 *   place and its kind ("하띤 수력발전소 (Huong Son)", "하천 (ব্রহ্মপুত্র নদী)") -
 *   never transliterated or invented. The bracket follows the platform's place
 *   names ("럼동 (Lâm Đồng)").
 */

export interface PopupFactV174 {
  key?: string;
  label: string;
  value: string;
  missing?: boolean;
}

export const POPUP_CARD_MAX_ROWS_V174 = 6;

const HANGUL_V174 = /[가-힣]/u;

/** Facts whose value says what kind of thing a feature is, in the order tried. */
const KIND_LABELS_V174 = [
  "발전원",
  "종류",
  "유형(OSM)",
  "구분",
  "광종",
  "재해유형",
  "기술 분야",
  "기술분야",
  "기관 유형",
  "유형",
];

/** Facts that say where a feature is. */
const PLACE_LABELS_V174 = ["소재지", "소재 지역", "소재 성·시", "소재 주(Division)", "도시", "성·시(2025)", "소재"];

/** Kind words a delivery writes in English. */
const ENGLISH_KIND_V174: Record<string, string> = {
  NGO: "비정부기구",
  DFI: "개발금융기관",
  MDB: "다자개발은행",
};

/** What follows the kind for a layer whose kind fact is a material or a field. */
const KIND_SUFFIX_V174: Record<string, string> = {
  "A-023": "발전소",
  "B-044": " 광산",
  "B-046": " 광산",
  "B-047": " 광산",
  "B-048": " 광산",
  "C-025": " 사업",
  "D-012": " 사업",
};

/** Layers whose features are all one kind of thing. */
const FIXED_KIND_V174: Record<string, string> = {
  "A-024": "송전선로",
  "A-025": "CCS 시설·후보지",
  "B-008": "해수면 관측소",
  "B-023": "유량 관측지점",
  "B-025": "소유역 대표점",
  "B-028": "하천유량 지점",
  "D-018": "지역 협력사업",
};

const ROW_STATUS_V174 = /^(?:미기재|미표기|미공개|미확인|unknown)$/iu;

function usable(fact: PopupFactV174 | undefined): fact is PopupFactV174 {
  return Boolean(fact && !fact.missing && fact.value && !ROW_STATUS_V174.test(fact.value.trim()));
}

/** The Korean part of "하띤 (Hà Tĩnh) · 개편 후 34개 기준" or "소재 하띤": "하띤". */
function koreanPlaceV174(value: string): string {
  // "남부 — 바리아붕따우": the place is the last part.
  const head = value.split(" · ")[0].replace(/^소재\s+/u, "").split(" — ").pop()?.trim() ?? "";
  const korean = head.split(" (")[0].trim();
  return HANGUL_V174.test(korean) ? korean : "";
}

function kindWordV174(value: string): string {
  const trimmed = value.trim();
  const english = ENGLISH_KIND_V174[trimmed];
  if (english) return english;
  if (!HANGUL_V174.test(trimmed)) return "";
  return trimmed
    .replace(/\s*\/\s*/gu, "·")
    .replace(/\s*\([^()]*\)\s*$/u, "")
    .trim();
}

/**
 * The Korean description of a feature from its own facts: "{place} {kind}".
 * Empty when the facts say neither (the caller then shows the name as written).
 */
export function featureKoreanDescriptionV174(
  elementId: string,
  facts: readonly PopupFactV174[],
  fallbackNoun = ""
): string {
  const placeFact = facts.find((fact) => PLACE_LABELS_V174.includes(fact.label) && usable(fact));
  const place = placeFact ? koreanPlaceV174(placeFact.value) : "";
  let kind = FIXED_KIND_V174[elementId] || "";
  if (!kind) {
    for (const label of KIND_LABELS_V174) {
      const fact = facts.find((item) => item.label === label && usable(item));
      const word = fact ? kindWordV174(fact.value) : "";
      if (word) {
        kind = `${word}${KIND_SUFFIX_V174[elementId] || ""}`;
        break;
      }
    }
  }
  if (!kind) kind = kindWordV174(fallbackNoun);
  if (!kind) return "";
  return [place, kind].filter(Boolean).join(" ");
}

/**
 * "한글설명 (원어)". A name that already has Korean in it is shown as written;
 * a nested bracket in the original ("Ullapara (Summit)") becomes a comma, and a
 * long original is shortened for the popup.
 */
export function koreanNamedV174(original: unknown, korean: string, maxOriginal = 48): string {
  const name = String(original ?? "").trim();
  if (!name) return korean;
  if (HANGUL_V174.test(name) || !korean) return name;
  const flat = name.replace(/\s*\(([^()]*)\)/gu, ", $1").replace(/^,\s*/u, "").trim();
  const shown = flat.length > maxOriginal ? `${flat.slice(0, maxOriginal - 1).trimEnd()}…` : flat;
  return `${korean} (${shown})`;
}

/** Facts written as "라벨 값" lines (the overlap summaries), split on a known label. */
export function factsFromLinesV174(lines: readonly string[]): PopupFactV174[] {
  const labels = [...KIND_LABELS_V174, ...PLACE_LABELS_V174].sort((left, right) => right.length - left.length);
  return lines.flatMap((line) => {
    const label = labels.find((candidate) => line.startsWith(`${candidate} `));
    return label ? [{ label, value: line.slice(label.length + 1) }] : [];
  });
}

/** "2016년 기준" → "2016년", "기준 2017" → "2017". */
export function popupPeriodV174(period: unknown): string {
  return String(period ?? "")
    .trim()
    .replace(/^기준\s+/u, "")
    .replace(/\s*기준$/u, "")
    .trim();
}

/**
 * The second row of an area card: what the value is beside the others.
 * A group value names its group, a class map its class, otherwise the rank.
 */
export function areaContextRowV174({
  contextLine,
  groupConstant,
  categorical,
}: {
  contextLine: string;
  groupConstant: boolean;
  categorical: boolean;
}): PopupFactV174 | null {
  if (!contextLine) return null;
  if (groupConstant) return { key: "scope", label: "적용 범위", value: contextLine };
  if (categorical) return { key: "class", label: "분류", value: contextLine };
  return { key: "rank", label: "순위", value: contextLine };
}

/** Rows in card order, empty ones dropped, at most six. */
export function popupCardRowsV174(rows: ReadonlyArray<PopupFactV174 | null | undefined>): PopupFactV174[] {
  return rows
    .filter((row): row is PopupFactV174 => usable(row ?? undefined))
    .slice(0, POPUP_CARD_MAX_ROWS_V174);
}

/** A source for a popup row: the first that is set, shortened for the card. */
export function popupSourceV174(...candidates: unknown[]): string {
  const source = candidates.map((value) => String(value ?? "").trim()).find(Boolean) || "";
  return source.length > 60 ? `${source.slice(0, 59).trimEnd()}…` : source;
}
