import termsV153 from "./koreanTermsV153.json";

/**
 * V153: Korean first, the source's own wording in parentheses.
 *
 * C-012 items arrive as "BLT(Build-Lease-Transfer)", "Law No. 64/2020/QH14",
 * "Energy(에너지)"; B-002 zones as "Cwa (온대·동계건조·고온하계)". The data
 * assets keep those strings; only what the screen prints is reordered:
 *
 *   koreanTermV153("BOT(Build-Operate-Transfer)") → "건설·운영·이전(BOT(Build-Operate-Transfer))"
 *   koreanTermV153("Energy(에너지)")                → "에너지(Energy)"
 *   climateZoneLabelV153("Cwa (온대·동계건조·고온하계)") → "온대·동계건조·고온하계(Cwa)"
 */
const TERMS: Record<string, string> = termsV153.terms;
const CLIMATE_ZONES: Record<string, string> = termsV153.climateZones;

const HANGUL = /[가-힣]/u;
const LATIN = /[A-Za-z]/u;
// "English(한글)" - a Latin head with a Korean gloss in the parentheses.
const ENGLISH_WITH_KOREAN_GLOSS = /^([^()]*[A-Za-z][^()]*)\(([^()]*[가-힣][^()]*)\)$/u;
// "N건" count phrases inside a category list: "Energy 10건; Transport 1건".
const COUNT_PHRASE = /^(.+?)\s+(\d[\d,]*건)$/u;

function translateHead(text: string): string | null {
  const term = TERMS[text];
  if (term) return term;
  return null;
}

/** One phrase, Korean-first when the table or the "English(한글)" shape allows it. */
export function koreanTermV153(value: unknown): string {
  const text = String(value ?? "").trim();
  if (!text || !LATIN.test(text)) return text;
  const exact = translateHead(text);
  if (exact) return exact === text ? text : `${exact}(${text})`;
  const glossed = text.match(ENGLISH_WITH_KOREAN_GLOSS);
  // Only a purely foreign head is flipped; "PPP 대상 분야(제4조)" is Korean already.
  if (glossed && !HANGUL.test(glossed[1])) {
    const head = glossed[1].trim();
    const gloss = glossed[2].trim();
    return `${gloss}(${head})`;
  }
  const counted = text.match(COUNT_PHRASE);
  if (counted) {
    const head = koreanTermV153(counted[1]);
    return head === counted[1] ? text : `${head} ${counted[2]}`;
  }
  if (text.includes(";")) {
    const parts = text.split(/\s*;\s*/u);
    const translated = parts.map(koreanTermV153);
    if (translated.some((part, index) => part !== parts[index])) return translated.join("; ");
  }
  if (text.includes(" / ")) {
    const parts = text.split(/\s*\/\s*/u);
    const translated = parts.map(koreanTermV153);
    if (translated.some((part, index) => part !== parts[index])) return translated.join(" / ");
  }
  return text;
}

/** True when the phrase still has Latin letters outside parentheses after translation. */
export function isUntranslatedV153(value: unknown): boolean {
  const out = koreanTermV153(value);
  const head = out.replace(/\([^()]*\)/gu, "");
  return LATIN.test(head) && !HANGUL.test(head);
}

const ZONE_LABEL = /^([A-Z][A-Za-z]{1,3})\s*\(([^()]+)\)$/u;

/** "Cwa (온대·동계건조·고온하계)" → "온대·동계건조·고온하계(Cwa)"; a bare code → its Korean name. */
export function climateZoneLabelV153(value: unknown): string {
  const text = String(value ?? "").trim();
  if (!text) return text;
  const match = text.match(ZONE_LABEL);
  if (match) {
    const code = match[1];
    const korean = CLIMATE_ZONES[code] || match[2].trim();
    return `${korean}(${code})`;
  }
  if (CLIMATE_ZONES[text]) return `${CLIMATE_ZONES[text]}(${text})`;
  return text;
}

export function climateZoneCodeV153(value: unknown): string | null {
  const text = String(value ?? "").trim();
  const match = text.match(ZONE_LABEL);
  if (match) return match[1];
  return CLIMATE_ZONES[text] ? text : null;
}
