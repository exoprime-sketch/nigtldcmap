#!/usr/bin/env node
/**
 * Every spelling of a Vietnamese province the published data might use.
 *
 * A delivery states a region in whatever form its source used: the Vietnamese
 * name ("Quảng Bình"), the romanised one ("Quang Binh"), the Korean one
 * ("꽝빈"), or a code ("VN-24"). Deciding "this element carries a region" from a
 * column *name* fails - the deliveries keep the province inside 명칭 or behind a
 * hashed attribute key - so the contract builder matches province **values**,
 * and this is the dictionary it matches against.
 *
 * One spelling resolves to both code systems at once: the 2025-07-01 unit
 * ("VN34-02") and the pre-2025 provinces it is made of (["VN-02","VN-06"]). The
 * caller decides which to join on; nothing here invents a mapping, both come
 * from ADM1_34_UNITS_V151 and the crosswalk, which are asserted to agree.
 *
 * Matching is boundary-aware and longest-first, with each matched span consumed:
 * "Vĩnh Long · An Giang" must not also yield "Long An", which a plain substring
 * search finds across the two names.
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

/**
 * Diacritics off, separators to spaces, lower case, single spaces.
 *
 * The recomposition at the end matters: NFD splits a Hangul syllable into its
 * jamo, so "꽝빈성" would stop looking like "꽝빈" followed by the suffix "성".
 */
function normalizeV157(value) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/gu, "")
    .replace(/[đĐ]/gu, "d")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim()
    .toLowerCase()
    .normalize("NFC");
}

const isWordChar = (char) => char !== undefined && /[\p{L}\p{N}]/u.test(char);
/** Korean writes the administrative suffix onto the name: "꽝빈성", "하노이시". */
const KOREAN_SPELLING = /[가-힣]$/u;
const KOREAN_UNIT_SUFFIX = /^[성시도]$/u;

export function provinceDictionaryV157(root, dataDir) {
  /** normalized spelling -> { unitCode34, canonical, adm1Codes63 } */
  const entries = new Map();
  const warnings = [];

  const add = (spelling, unit) => {
    const key = normalizeV157(spelling);
    if (key.length < 2 || !unit) return;
    const existing = entries.get(key);
    if (existing && existing.unitCode34 !== unit.unitCode34) {
      warnings.push(
        `AMBIGUOUS_SPELLING ${key}: ${existing.unitCode34} vs ${unit.unitCode34}`
      );
      return;
    }
    if (!existing) entries.set(key, unit);
    // English sources write the city as one word ("Hanoi", "Danang"). The
    // haystack keeps its spaces, so a space-less key can only match that token.
    const joined = key.replace(/ /gu, "");
    if (joined !== key && joined.length >= 4 && !entries.has(joined)) {
      entries.set(joined, unit);
    }
  };

  // The 34 units in force since 2025-07-01: the primary key system.
  const adminSource = readFileSync(resolve(root, "src/data/map/adminBoundaryV151.ts"), "utf8");
  const units = new Map();
  const memberToUnit = new Map();
  for (const match of adminSource.matchAll(
    /\{\s*unitCode:\s*"([^"]+)",\s*name:\s*"([^"]+)",\s*nameKo:\s*"([^"]+)",\s*successorAdm1Code:\s*"([^"]+)",\s*memberAdm1Codes:\s*\[([^\]]*)\]/gu
  )) {
    const members = [...match[5].matchAll(/"([^"]+)"/gu)].map((row) => row[1]);
    const unit = {
      unitCode34: match[1],
      canonical: match[2],
      canonicalKo: match[3],
      adm1Codes63: members,
    };
    units.set(unit.unitCode34, unit);
    members.forEach((code) => memberToUnit.set(code, unit));
    add(unit.canonical, unit);
    add(unit.canonicalKo, unit);
    add(unit.unitCode34, unit);
  }
  if (units.size !== 34) warnings.push(`UNIT_COUNT ${units.size} != 34`);

  // Pre-2025 spellings from the 63-unit boundary asset, mapped to their unit.
  const geo = JSON.parse(
    readFileSync(resolve(dataDir, "geometry/vnm-adm1-63.geojson"), "utf8")
  );
  for (const feature of geo.features ?? []) {
    const props = feature.properties ?? {};
    const unit = memberToUnit.get(props.adm1Code);
    if (!unit) {
      warnings.push(`UNMAPPED_63_CODE ${props.adm1Code}`);
      continue;
    }
    add(props.name, unit);
    add(props.normalizedName, unit);
    add(props.adm1Code, unit);
    for (const shapeName of props.sourceShapeNames ?? []) add(shapeName, unit);
  }

  // Korean names for the pre-2025 provinces ("VN-79": "호찌민시").
  const backdropSource = readFileSync(resolve(root, "src/data/map/mapBackdropV150.ts"), "utf8");
  for (const match of backdropSource.matchAll(/"(VN-[0-9A-Z]{2})"\s*:\s*"([^"]+)"/gu)) {
    const unit = memberToUnit.get(match[1]);
    if (unit) add(match[2], unit);
  }

  // The crosswalk is the canon for 63 -> 34 membership; assert it agrees.
  const crosswalk =
    JSON.parse(readFileSync(resolve(root, "reports/v138/map-targets-build-v138.json"), "utf8"))
      .crosswalk34 ?? [];
  for (const row of crosswalk) {
    const unit = memberToUnit.get(row.memberAdm1Codes?.[0]);
    if (!unit) {
      warnings.push(`CROSSWALK_ROW_UNMAPPED ${row.region}`);
      continue;
    }
    const declared = [...(row.memberAdm1Codes ?? [])].sort().join(",");
    const known = [...unit.adm1Codes63].sort().join(",");
    if (declared !== known) {
      warnings.push(`CROSSWALK_MEMBERS_DIFFER ${row.region}: ${declared} vs ${known}`);
    }
    add(row.region, unit);
    add(row.key, unit);
  }

  // Longest first, so "Vĩnh Long" is tried before "Long An".
  const spellings = [...entries.keys()].sort((left, right) => right.length - left.length);

  /**
   * Units named anywhere in the text. A spelling only counts when it stands on
   * its own - not inside a longer word, and not across a span already matched.
   */
  function matches(text) {
    const haystack = normalizeV157(text);
    if (haystack.length < 2) return [];
    const consumed = new Array(haystack.length).fill(false);
    const found = new Map();
    for (const spelling of spellings) {
      let from = 0;
      for (;;) {
        const at = haystack.indexOf(spelling, from);
        if (at < 0) break;
        from = at + 1;
        let end = at + spelling.length;
        if (isWordChar(haystack[at - 1])) continue;
        if (isWordChar(haystack[end])) {
          // "꽝빈성" is the province plus its suffix; "하노이대학교" is not.
          const suffixed =
            KOREAN_SPELLING.test(spelling) &&
            KOREAN_UNIT_SUFFIX.test(haystack[end]) &&
            !isWordChar(haystack[end + 1]);
          if (!suffixed) continue;
          end += 1;
        }
        let overlaps = false;
        for (let index = at; index < end; index += 1) overlaps = overlaps || consumed[index];
        if (overlaps) continue;
        for (let index = at; index < end; index += 1) consumed[index] = true;
        const unit = entries.get(spelling);
        if (!found.has(unit.unitCode34)) found.set(unit.unitCode34, { ...unit, spelling });
      }
    }
    return [...found.values()];
  }

  /**
   * Units named by a value whose characters were lost in transfer: "S?c Tr?ng"
   * for "Sóc Trăng". Each run of '?' or U+FFFD stands for one character, and a
   * pattern is accepted only when exactly one spelling matches it.
   */
  function matchesCorrupted(text) {
    const raw = String(text ?? "");
    if (!/[?\uFFFD]/u.test(raw)) return [];
    const found = new Map();
    // Split on separators the deliveries use, and drop the words that are not
    // part of a name ("Province", "성", "Tỉnh").
    for (const phrase of raw.split(/[,;·|/()\n]+/u)) {
      const candidate = phrase
        .replace(/\b(province|tinh|tỉnh|city)\b/giu, " ")
        .replace(/성$/u, "")
        .trim();
      if (!candidate || !/[?\uFFFD]/u.test(candidate)) continue;
      // The pattern is the value itself, with one wildcard per lost character.
      const pattern = new RegExp(
        `^${candidate
          .split("")
          .map((character) =>
            /[?\uFFFD]/u.test(character)
              ? "."
              : /[\p{L}\p{N}]/u.test(character)
                ? character.replace(/[.*+?^${}()|[\]\\]/gu, "\\$&")
                : " "
          )
          .join("")
          .replace(/\s+/gu, " ")
          .trim()}$`,
        "iu"
      );
      const hits = spellings.filter((spelling) => pattern.test(spelling));
      // Ambiguous or unknown: leave it unmatched and let the report say so.
      if (hits.length !== 1) continue;
      const unit = entries.get(hits[0]);
      if (!found.has(unit.unitCode34)) {
        found.set(unit.unitCode34, { ...unit, spelling: candidate, matchKind: "corrupted" });
      }
    }
    return [...found.values()];
  }

  return {
    size: entries.size,
    unitCount: units.size,
    warnings,
    matches,
    matchesCorrupted,
    /** Just the 2025 unit codes, for callers that only count regions. */
    codes(text) {
      return matches(text).map((unit) => unit.unitCode34);
    },
  };
}

// Smoke test: node scripts/v157/province-dictionary-v157.mjs
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const dictionary = provinceDictionaryV157(
    resolve(import.meta.dirname, "../.."),
    resolve(import.meta.dirname, "../../public/data/vietnam/v2")
  );
  const probes = [
    "꽝빈성 태양광 발전사업",
    "Quang Nam",
    "An Giang · Kien Giang",
    "Vĩnh Long, An Giang",
    "전국 공통",
    "홍강 본류 · 하노이 서부 관측소",
    "Thành phố Hồ Chí Minh",
  ];
  console.log(
    JSON.stringify(
      {
        size: dictionary.size,
        unitCount: dictionary.unitCount,
        warnings: dictionary.warnings,
        probes: probes.map((probe) => ({
          probe,
          units: dictionary.matches(probe).map((unit) => `${unit.unitCode34}(${unit.canonical})`),
        })),
      },
      null,
      2
    )
  );
}
