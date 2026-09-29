/**
 * V161-A: Vietnamese place name -> Hangul, after the National Institute of
 * Korean Language's Vietnamese transcription rules (tones ignored).
 *
 * Step ③ of the region-name rules only: a name the dictionaries do not know
 * (district, commune, a pre-2008 province) gets a proposal marked `pending` for
 * review; the 63 and 34 provinces and the major cities never come from here.
 * The dictionary names are the test oracle (see vietnamese-hangul-v161.test.mjs).
 *
 * Input is one name ("Bà Rịa–Vũng Tàu", "QuảngBình", "Hà Tây"). Administrative
 * words (tỉnh, thành phố, province, city…) must be removed by the caller.
 * Returns { ok, ko, reason }; ok is false when a syllable is not Vietnamese
 * (a foreign name such as "Singapore") - the caller then shows the local name.
 */

const TONES = /[̣̀́̃̉]/gu;
const VOWELS = "aăâeêioôơuưy";
const ONSETS = ["ngh", "ng", "nh", "ch", "gh", "gi", "kh", "ph", "qu", "th", "tr", "b", "c", "d", "đ", "g", "h", "k", "l", "m", "n", "p", "r", "s", "t", "v", "x"];
const CODAS = ["ng", "nh", "ch", "c", "k", "m", "n", "p", "t"];

// Hangul jamo indices.
const I = { ㄱ: 0, ㄲ: 1, ㄴ: 2, ㄷ: 3, ㄸ: 4, ㄹ: 5, ㅁ: 6, ㅂ: 7, ㅃ: 8, ㅅ: 9, ㅆ: 10, ㅇ: 11, ㅈ: 12, ㅉ: 13, ㅊ: 14, ㅋ: 15, ㅌ: 16, ㅍ: 17, ㅎ: 18 };
const V = { ㅏ: 0, ㅐ: 1, ㅑ: 2, ㅒ: 3, ㅓ: 4, ㅔ: 5, ㅕ: 6, ㅖ: 7, ㅗ: 8, ㅘ: 9, ㅙ: 10, ㅚ: 11, ㅛ: 12, ㅜ: 13, ㅝ: 14, ㅞ: 15, ㅟ: 16, ㅠ: 17, ㅡ: 18, ㅢ: 19, ㅣ: 20 };
const F = { "": 0, ㄱ: 1, ㄴ: 4, ㄹ: 8, ㅁ: 16, ㅂ: 17, ㅅ: 19, ㅇ: 21 };

const ONSET_JAMO = {
  b: "ㅂ", c: "ㄲ", k: "ㄲ", q: "ㄲ", qu: "ㄲ", ch: "ㅉ", d: "ㅈ", gi: "ㅈ", đ: "ㄷ", g: "ㄱ", gh: "ㄱ", h: "ㅎ",
  kh: "ㅋ", l: "ㄹ", m: "ㅁ", n: "ㄴ", nh: "ㄴ", p: "ㅃ", ph: "ㅍ", r: "ㄹ", s: "ㅅ", t: "ㄸ", th: "ㅌ", tr: "ㅉ",
  v: "ㅂ", x: "ㅆ", "": "ㅇ", ng: "ㅇ", ngh: "ㅇ",
};
const CODA_JAMO = { c: "ㄱ", ch: "ㄱ", k: "ㄱ", m: "ㅁ", n: "ㄴ", nh: "ㄴ", ng: "ㅇ", p: "ㅂ", t: "ㅅ" };

// Nucleus -> vowel jamo, one per written syllable.
const NUCLEI = {
  a: ["ㅏ"], ă: ["ㅏ"], â: ["ㅓ"], e: ["ㅐ"], ê: ["ㅔ"], i: ["ㅣ"], y: ["ㅣ"], o: ["ㅗ"], ô: ["ㅗ"], ơ: ["ㅓ"], u: ["ㅜ"], ư: ["ㅡ"],
  ai: ["ㅏ", "ㅣ"], ay: ["ㅏ", "ㅣ"], ao: ["ㅏ", "ㅗ"], au: ["ㅏ", "ㅜ"], âu: ["ㅓ", "ㅜ"], ây: ["ㅓ", "ㅣ"], eo: ["ㅐ", "ㅗ"], êu: ["ㅔ", "ㅜ"],
  ia: ["ㅣ", "ㅏ"], iê: ["ㅣ", "ㅔ"], yê: ["ㅣ", "ㅔ"], iu: ["ㅣ", "ㅜ"], iêu: ["ㅣ", "ㅔ", "ㅜ"], yêu: ["ㅣ", "ㅔ", "ㅜ"],
  oa: ["ㅗ", "ㅏ"], oă: ["ㅗ", "ㅏ"], oe: ["ㅗ", "ㅐ"], oi: ["ㅗ", "ㅣ"], ôi: ["ㅗ", "ㅣ"], ơi: ["ㅓ", "ㅣ"], oai: ["ㅗ", "ㅏ", "ㅣ"], oay: ["ㅗ", "ㅏ", "ㅣ"], oo: ["ㅗ"],
  ua: ["ㅜ", "ㅓ"], uâ: ["ㅜ", "ㅓ"], uô: ["ㅜ", "ㅗ"], uê: ["ㅜ", "ㅔ"], ui: ["ㅜ", "ㅣ"], uy: ["ㅜ", "ㅣ"], uya: ["ㅜ", "ㅣ", "ㅏ"], uyê: ["ㅜ", "ㅖ"],
  uôi: ["ㅜ", "ㅗ", "ㅣ"], uây: ["ㅜ", "ㅓ", "ㅣ"], uơ: ["ㅜ", "ㅓ"],
  ưa: ["ㅡ", "ㅓ"], ươ: ["ㅡ", "ㅓ"], ưi: ["ㅡ", "ㅣ"], ưu: ["ㅡ", "ㅜ"], ươi: ["ㅡ", "ㅓ", "ㅣ"], ươu: ["ㅡ", "ㅓ", "ㅜ"],
  // Written without vowel marks (Yen, Thien, Tuyen, Huong): read as the marked
  // vowel the letters most often stand for. Such names are flagged for review.
  ie: ["ㅣ", "ㅔ"], ye: ["ㅣ", "ㅔ"], ieu: ["ㅣ", "ㅔ", "ㅜ"], yeu: ["ㅣ", "ㅔ", "ㅜ"], uye: ["ㅜ", "ㅖ"],
  uo: ["ㅜ", "ㅗ"], uoi: ["ㅜ", "ㅗ", "ㅣ"], ue: ["ㅜ", "ㅔ"], uay: ["ㅜ", "ㅓ", "ㅣ"],
};
// nh palatalises the vowel it joins: nha 냐, nhơ 녀, nho 뇨, nhu 뉴, nhe 녜.
const PALATAL = { ㅏ: "ㅑ", ㅓ: "ㅕ", ㅗ: "ㅛ", ㅜ: "ㅠ", ㅐ: "ㅒ", ㅔ: "ㅖ" };

const block = (initial, vowel, final = "") => String.fromCharCode(0xac00 + (I[initial] * 21 + V[vowel]) * 28 + F[final]);

/** Tone marks off, vowel marks (breve, circumflex, horn) and đ kept. */
export function stripTonesV161(text) {
  return String(text).normalize("NFD").replace(TONES, "").normalize("NFC").toLowerCase();
}

function parseSyllable(raw) {
  const s = stripTonesV161(raw);
  if (!s || /[^a-zăâđêôơư]/u.test(s)) return null;
  let onset = ONSETS.find((candidate) => s.startsWith(candidate)) || "";
  let rest = s.slice(onset.length);
  // "gi" before a consonant (or alone) is g + the vowel i: gì, gìn.
  if (onset === "gi" && (!rest || !VOWELS.includes(rest[0]))) {
    onset = "g";
    rest = s.slice(1);
  }
  const coda = CODAS.find((candidate) => rest.endsWith(candidate) && rest.length > candidate.length) || "";
  const nucleus = rest.slice(0, rest.length - coda.length);
  if (!nucleus || [...nucleus].some((ch) => !VOWELS.includes(ch))) return null;
  return { onset, nucleus, coda };
}

function syllableBlocks({ onset, nucleus, coda }) {
  let vowels;
  if (onset === "qu") {
    // qu + a/ă is one syllable (꽝); qu + another vowel keeps the u (꾸이, 꾸에).
    if (nucleus.startsWith("a") || nucleus.startsWith("ă")) {
      const tail = NUCLEI[nucleus.slice(1)] || (nucleus.length === 1 ? [] : null);
      if (tail === null) return null;
      vowels = ["ㅘ", ...tail];
    } else {
      const tail = NUCLEI[nucleus];
      if (!tail) return null;
      vowels = ["ㅜ", ...tail];
    }
  } else if ((nucleus === "a" || nucleus === "ă") && (coda === "nh" || coda === "ch")) {
    vowels = ["ㅏ", "ㅣ"]; // anh 아인, ach 아익
  } else if (!onset && ["yê", "yêu", "ye", "yeu"].includes(nucleus)) {
    vowels = nucleus.length === 2 ? ["ㅖ"] : ["ㅖ", "ㅜ"]; // Yên 옌
  } else {
    vowels = NUCLEI[nucleus];
    if (!vowels) return null;
  }
  const blocks = [];
  if (onset === "ng" || onset === "ngh") blocks.push(block("ㅇ", "ㅡ", "ㅇ")); // Nghệ 응에, Ngãi 응아이
  vowels.forEach((vowel, index) => {
    let initial = "ㅇ";
    let jamo = vowel;
    if (index === 0 && onset !== "ng" && onset !== "ngh") {
      initial = ONSET_JAMO[onset];
      if (onset === "nh") jamo = PALATAL[vowel] || vowel;
    }
    const final = index === vowels.length - 1 ? CODA_JAMO[coda] || "" : "";
    blocks.push(block(initial, jamo, final));
  });
  return blocks;
}

function addFinalRieul(syllable) {
  const code = syllable.charCodeAt(0) - 0xac00;
  if (code < 0 || code % 28 !== 0) return syllable;
  return String.fromCharCode(syllable.charCodeAt(0) + F.ㄹ);
}

/** Split "QuảngBình" and "Bà Rịa–Vũng Tàu" into written syllables. */
export function vietnameseSyllablesV161(text) {
  return String(text)
    .normalize("NFC")
    .replace(/(\p{Ll})(\p{Lu})/gu, "$1 $2")
    .split(/[\s\-–—]+/u)
    .filter(Boolean);
}

export function vietnameseToHangulV161(text) {
  const syllables = vietnameseSyllablesV161(text);
  if (!syllables.length) return { ok: false, ko: "", reason: "empty" };
  const out = [];
  for (const syllable of syllables) {
    const parsed = parseSyllable(syllable);
    if (!parsed) return { ok: false, ko: "", reason: `not a Vietnamese syllable: ${syllable}` };
    const blocks = syllableBlocks(parsed);
    if (!blocks) return { ok: false, ko: "", reason: `no transcription for: ${syllable}` };
    // An l inside the name after an open syllable is written ㄹㄹ (Gia Lai 잘라이).
    if (parsed.onset === "l" && out.length) out[out.length - 1] = addFinalRieul(out[out.length - 1]);
    out.push(...blocks);
  }
  const unmarked = !/[̀-ͯ]/u.test(String(text).normalize("NFD")) && !/[đĐ]/u.test(String(text));
  return { ok: true, ko: out.join(""), reason: unmarked ? "원문에 성조·모음 부호가 없어 모음 구분이 불확실함" : "" };
}
