/**
 * V175: one rule for labels that say the same thing twice.
 *
 * Delivered series labels are composed "측정명 · 분류 — 세부 설명", and the
 * parts often repeat one another: "1차 에너지 소비 · 석탄 — 석탄 1차에너지
 * 소비량", "통관 · 통관 부문 점수(1=낮음 ~ 5=높음)", "석탄 · 석탄 1차에너지
 * 소비량". A part whose words are all in a later part of the same label - the
 * one that spells it out - is dropped, and the fuller part stays: "석탄
 * 1차에너지 소비량". A part is never dropped for being inside an earlier one:
 * the measure "감축/적응 구분별 예산 배분 비율" names both "감축" and "적응",
 * and the part after it is what tells the two series apart. Nothing is
 * reworded and no value changes - the label only loses the words it already
 * says.
 *
 * Lists whose items all start with the same part ("인구 전 구간 — SSP1",
 * "인구 전 구간 — SSP2", …) name that part once where the chart already names
 * it, and the items read "SSP1", "SSP2" (`commonHeadV175`).
 *
 * A card's headline that starts with the card's own name ("빈곤율 · 국가빈곤선 ·
 * 2022년" under "빈곤율") starts after it (`withoutLeadingNameV175`).
 */

const SEPARATOR_V175 = /^\s[·—–]\s$/u;
// "/" joins alternatives into one word ("감축/적응"), so it is not a word edge.
const PUNCT_V175 = /[\s()[\]{}（）,，:;'"‘’“”·\-–—]/u;
/** A word may run on into one of these and still be the same word ("소비" → "소비량"). */
const WORD_TAIL_V175 = new Set(["량", "률", "율", "액"]);
/** A name with one of these at its end is the same name ("기술지원 요청 현황" ~ "기술지원 요청"). */
const NAME_TAIL_V175 = ["현황", "규모", "목록", "추이", "정보", "량", "액", "률", "율"];

interface KeyedTextV175 {
  key: string;
  /** key index → the key character starts a word of the text */
  starts: boolean[];
  /** key index → the key character ends a word of the text */
  ends: boolean[];
}

/** The text without spaces and punctuation, lower-cased, with its word edges. */
function keyedV175(text: string): KeyedTextV175 {
  const chars = Array.from(text);
  let key = "";
  const starts: boolean[] = [];
  const ends: boolean[] = [];
  let previousWasPunct = true;
  chars.forEach((char, index) => {
    if (PUNCT_V175.test(char)) {
      previousWasPunct = true;
      if (ends.length) ends[ends.length - 1] = true;
      return;
    }
    const lower = char.toLowerCase();
    key += lower;
    starts.push(previousWasPunct);
    ends.push(index === chars.length - 1);
    previousWasPunct = false;
  });
  return { key, starts, ends };
}

/**
 * Where a part's words sit in another part: at its start or end ("석탄" in
 * "석탄 1차에너지 소비량", "1차 에너지 소비" in "석탄 1차에너지 소비량"), in its
 * middle ("농림어업" in "GDP 대비 농림어업 부가가치 비중"), or not at all -
 * whole words only, so "기후" is not in "기후기술 집계값".
 */
function wordsInV175(part: string, whole: string): "edge" | "middle" | null {
  const needle = keyedV175(part).key;
  if (needle.length < 2) return null;
  const hay = keyedV175(whole);
  let found: "edge" | "middle" | null = null;
  let from = 0;
  for (;;) {
    const at = hay.key.indexOf(needle, from);
    if (at < 0) return found;
    const last = at + needle.length - 1;
    const tail = WORD_TAIL_V175.has(hay.key[last + 1] || "") ? 1 : 0;
    const endsWord = hay.ends[last] || tail === 1;
    if (hay.starts[at] && endsWord) {
      if (at === 0 || last + tail === hay.key.length - 1) return "edge";
      found = "middle";
    }
    from = at + 1;
  }
}

/** A part that reads as a label, not a sentence: short, no full stop inside. */
function labelLikeV175(part: string): boolean {
  return part.length <= 60 && !/[.。]\s/u.test(part);
}

interface PartV175 {
  text: string;
  /** the separator written before this part ("" for the first) */
  before: string;
}

/** The parts of a label, split on " · " / " — " outside brackets only. */
function splitV175(label: string): PartV175[] {
  const parts: PartV175[] = [];
  let depth = 0;
  let current = "";
  let before = "";
  const chars = Array.from(label);
  for (let index = 0; index < chars.length; index += 1) {
    const char = chars[index];
    if ("([{（".includes(char)) depth += 1;
    if (")]}）".includes(char)) depth = Math.max(0, depth - 1);
    const separator = chars.slice(index, index + 3).join("");
    if (depth === 0 && SEPARATOR_V175.test(separator) && separator.length === 3) {
      parts.push({ text: current.trim(), before });
      before = separator;
      current = "";
      index += 2;
      continue;
    }
    current += char;
  }
  parts.push({ text: current.trim(), before });
  return parts.filter((part) => part.text);
}

function joinV175(parts: PartV175[]): string {
  return parts.map((part, index) => (index === 0 ? part.text : `${part.before}${part.text}`)).join("");
}

/**
 * A label without the parts another part of it already says.
 * "1차 에너지 소비 · 석탄 — 석탄 1차에너지 소비량" → "석탄 1차에너지 소비량".
 */
export function compactLabelV175(label: string | null | undefined): string {
  const text = String(label ?? "");
  const parts = splitV175(text);
  if (parts.length < 2) return text;
  const drop = new Set<number>();
  parts.forEach((part, index) => {
    const key = keyedV175(part.text).key;
    if (key.length < 2) return;
    const covered = parts.some((other, otherIndex) => {
      if (otherIndex === index || drop.has(otherIndex) || !labelLikeV175(other.text)) return false;
      const otherKey = keyedV175(other.text).key;
      // The same words twice: the first one stays.
      if (otherKey === key) return otherIndex < index;
      // Only a later part spells an earlier one out: at its start or end, or
      // in the middle of a short phrase that is not itself a list ("·").
      if (otherIndex < index) return false;
      const where = wordsInV175(part.text, other.text);
      return where === "edge" || (where === "middle" && other.text.length <= 30 && !other.text.includes("·"));
    });
    if (covered) drop.add(index);
  });
  if (drop.size === 0) return text;
  const kept = parts.filter((_, index) => !drop.has(index));
  // The first kept part needs no separator in front of it.
  return joinV175(kept.map((part, index) => (index === 0 ? { ...part, before: "" } : part)));
}

/** Whether a part is the name itself, or the name with a word like "현황" / "규모" more or less. */
export function sameNameV175(part: string, name: string | null | undefined): boolean {
  if (!name) return false;
  const a = keyedV175(part).key;
  const b = keyedV175(name).key;
  if (a.length < 2 || b.length < 2) return false;
  if (a === b) return true;
  const [longer, shorter] = a.length > b.length ? [a, b] : [b, a];
  return longer.startsWith(shorter) && NAME_TAIL_V175.includes(longer.slice(shorter.length));
}

/**
 * A card headline that starts with the card's own name starts after it:
 * "빈곤율 · 국가빈곤선 · 2022년" under "빈곤율" → "국가빈곤선 · 2022년".
 * A label that is only the name is kept as it is.
 */
export function withoutLeadingNameV175(label: string | null | undefined, names: ReadonlyArray<string | null | undefined>): string {
  const text = String(label ?? "");
  const parts = splitV175(text);
  if (parts.length < 2) return text;
  if (!names.some((name) => sameNameV175(parts[0].text, name))) return text;
  const rest = parts.slice(1);
  return joinV175(rest.map((part, index) => (index === 0 ? { ...part, before: "" } : part)));
}

/**
 * The part every label of a list starts with, when there are at least two
 * labels and each says more than that part ("인구 전 구간" of "인구 전 구간 —
 * SSP1", "인구 전 구간 — SSP2"). Null otherwise.
 */
export function commonHeadV175(labels: ReadonlyArray<string>): string | null {
  if (labels.length < 2) return null;
  const heads = labels.map((label) => splitV175(label));
  if (heads.some((parts) => parts.length < 2)) return null;
  const head = heads[0][0].text;
  return heads.every((parts) => parts[0].text === head) ? head : null;
}

/** A label of such a list without the shared part. */
export function withoutHeadV175(label: string, head: string | null): string {
  if (!head) return label;
  const parts = splitV175(label);
  if (parts.length < 2 || parts[0].text !== head) return label;
  const rest = parts.slice(1);
  return joinV175(rest.map((part, index) => (index === 0 ? { ...part, before: "" } : part)));
}

/** Whether a chart's own title or axis already names the shared part. */
export function namedInV175(head: string | null, ...texts: Array<string | null | undefined>): boolean {
  if (!head) return false;
  return texts.some((text) => Boolean(text) && wordsInV175(head, String(text)) !== null);
}
