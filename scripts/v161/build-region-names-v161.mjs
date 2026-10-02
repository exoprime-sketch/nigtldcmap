#!/usr/bin/env node
/**
 * V161-A: the region-name dictionary behind "한글명 (현지명)".
 *
 * Writes src/data/geo/regionNamesV161.json (read by src/data/geo/regionNameV161.ts)
 * and docs/handoff/v161/REGION_NAME_REVIEW.md (the list NIGT reviews).
 *
 * Korean names are decided in this order and never guessed:
 *   ① the platform's own dictionaries - Viet Nam's 63 pre-2025 provinces
 *     (PROVINCE_KO_V150 + the 63-province alias table), the 34 post-2025 units
 *     (ADM1_34_UNITS_V151) and the six centrally-run cities (MAP_CITIES_V151);
 *     Bangladesh's 8 divisions (intake note 2026-09-23, 6 of them spelled by the
 *     Korean embassy in Dhaka) and 64 districts (Korean Wikipedia, pinned
 *     revision - pending review unless it is a division's own name);
 *   ③ for any other Vietnamese place name found in the Viet Nam packs, the
 *     NIKL Vietnamese transcription rules (vietnamese-hangul-v161.mjs), marked
 *     `pending` and listed for review;
 *   ④ otherwise nothing: the screen shows the local name alone.
 * The local name is never rewritten: the caller passes the source spelling and
 * the module puts it in the brackets as it came.
 *
 *   node scripts/v161/build-region-names-v161.mjs [--check]
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { loadPackPayloads, payloadRecords } from "../v125/audit-utils.mjs";
import { vietnameseToHangulV161 } from "./vietnamese-hangul-v161.mjs";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const CHECK = process.argv.includes("--check");
const JSON_OUT = resolve(ROOT, "src/data/geo/regionNamesV161.json");
const REVIEW_OUT = resolve(ROOT, "docs/handoff/v161/REGION_NAME_REVIEW.md");
const read = (path) => readFileSync(resolve(ROOT, path), "utf8");

// --- key normalisation (mirrored by regionNameKeyV161 in src/data/geo/regionNameV161.ts)
const WRAPPER = /^[\s"'“”‘’([{,.;:\-–—]+|[\s"'“”‘’)\]},.;:\-–—]+$/gu;
const VI_ADMIN_PREFIX = /^(?:tỉnh|thành phố|thanh pho|tp\.?|t\.p\.?|thị xã|thị trấn|huyện|quận|phường|xã)\s+/u;
const EN_ADMIN_PREFIX = /^(?:province of|city of)\s+/u;
const EN_ADMIN_SUFFIX = /\s+(?:provinces?|city|municipality|division|district|commune|ward|town)$/u;
/** Strip administrative words until none is left ("Da Nang City provinces"). */
function stripAdministrative(text, flags) {
  const prefix = new RegExp(VI_ADMIN_PREFIX.source, flags);
  const prefixEn = new RegExp(EN_ADMIN_PREFIX.source, flags);
  const suffix = new RegExp(EN_ADMIN_SUFFIX.source, flags);
  let previous;
  do {
    previous = text;
    text = text.replace(prefix, "").replace(prefixEn, "").replace(suffix, "");
  } while (text !== previous);
  return text;
}
export function regionKey(raw) {
  let text = String(raw ?? "").normalize("NFC").replace(WRAPPER, "").toLowerCase();
  text = stripAdministrative(text, "u");
  text = text.normalize("NFD").replace(/[̀-ͯ]/gu, "").replace(/đ/gu, "d");
  return text.replace(/[^a-z0-9]+/gu, "");
}
/** The name without administrative words, spelling otherwise untouched. */
function withoutAdminWords(raw) {
  return stripAdministrative(String(raw).normalize("NFC").replace(WRAPPER, ""), "iu");
}
/** Tone or vowel marks present: the spelling says which vowel is meant. */
const hasVietnameseMarks = (text) => /[̀-ͯ]/u.test(String(text).normalize("NFD")) || /[đĐ]/u.test(String(text));
function editDistance(a, b) {
  const row = Array.from({ length: b.length + 1 }, (_, j) => j);
  for (let i = 1; i <= a.length; i += 1) {
    let diagonal = row[0];
    row[0] = i;
    for (let j = 1; j <= b.length; j += 1) {
      const above = row[j];
      row[j] = Math.min(row[j] + 1, row[j - 1] + 1, diagonal + (a[i - 1] === b[j - 1] ? 0 : 1));
      diagonal = above;
    }
  }
  return row[b.length];
}
const unique = (values) => [...new Set(values.filter(Boolean))].sort();

// --- ① Viet Nam dictionaries (main-branch sources only)
const ko63 = Object.fromEntries([...read("src/data/map/mapBackdropV150.ts").matchAll(/"(VN-[0-9A-Z]+)":"([^"]+)"/gu)].map((m) => [m[1], m[2]]));
const aliases = JSON.parse(read("public/data/vietnam/v2/geometry/vnm-adm1-aliases.json")).aliases;
const units34 = [...read("src/data/map/adminBoundaryV151.ts").matchAll(/unitCode: "(VN34-[0-9A-Z]+)", name: "([^"]+)", nameKo: "([^"]+)", successorAdm1Code: "(VN-[0-9A-Z]+)", memberAdm1Codes: \[([^\]]*)\]/gu)]
  .map((m) => ({ code: m[1], name: m[2], ko: m[3], successor: m[4], members: [...m[5].matchAll(/"(VN-[0-9A-Z]+)"/gu)].map((x) => x[1]) }));
const cities = [...read("src/data/map/mapLabelsV151.ts").matchAll(/\{ name: "([^"]+)", nameEn: "([^"]+)", lon: [\d.]+, lat: [\d.]+, adm1Codes: \[([^\]]*)\] \}/gu)]
  .map((m) => ({ ko: m[1], en: m[2], codes: [...m[3].matchAll(/"([^"]+)"/gu)].map((x) => x[1]) }));
if (Object.keys(ko63).length !== 63 || aliases.length !== 63 || units34.length !== 34 || cities.length !== 6) {
  throw new Error(`dictionary sizes: ko63 ${Object.keys(ko63).length}, aliases ${aliases.length}, units34 ${units34.length}, cities ${cities.length}`);
}

// Alias rows that point a different place at a province for joining data
// (the city of Huế, Vũng Tàu, the Côn Đảo islands). They are not the
// province's name, so they are not display keys.
const JOIN_ONLY_VARIANTS = { "VN-26": ["Huế", "Hue"], "VN-43": ["Côn Đảo", "Vung Tau"] };
// Other names in use for the same unit. Bắc Cạn is the pre-2003 spelling of
// Bắc Kạn that some sources (WWF) still use.
const OTHER_NAMES = { "VN-SG": ["HCMC", "Sai Gon", "Saigon"], "VN34-SG": ["HCMC", "Sai Gon", "Saigon"], "VN-53": ["Bắc Cạn", "Bac Can"] };
const aliasByCode = new Map(aliases.map((row) => [row.adm1Code, row]));
const unitByMember = new Map(units34.flatMap((unit) => unit.members.map((code) => [code, unit])));
const looseKey = (value) => regionKey(value).replace(/k/gu, "c"); // Đắk / Đắc

const vnmEntries = [];
for (const unit of units34) {
  const successor = aliasByCode.get(unit.successor);
  const spellings = (successor?.variants || []).filter((variant) => looseKey(variant) === looseKey(unit.name));
  vnmEntries.push({
    level: "adm1-34", code: unit.code, local: unit.name, ko: unit.ko,
    source: "ADM1_34_UNITS_V151", reviewStatus: "confirmed",
    keys: unique([unit.name, ...spellings, ...(OTHER_NAMES[unit.code] || [])].map(regionKey)),
  });
}
for (const city of cities) {
  const unit = units34.find((row) => city.codes.includes(row.code));
  if (!unit || unit.ko !== city.ko) throw new Error(`city ${city.ko}: no 34-unit with the same Korean name`);
  vnmEntries.push({
    level: "city", code: unit.code, local: unit.name, ko: city.ko,
    source: "MAP_CITIES_V151", reviewStatus: "confirmed",
    keys: unique([unit.name, city.en, ...(OTHER_NAMES[unit.code] || [])].map(regionKey)),
  });
}
for (const row of aliases) {
  const ko = ko63[row.adm1Code];
  if (!ko) throw new Error(`${row.adm1Code}: no Korean name in PROVINCE_KO_V150`);
  const joinOnly = new Set(JOIN_ONLY_VARIANTS[row.adm1Code] || []);
  const unit = unitByMember.get(row.adm1Code);
  if (!unit) throw new Error(`${row.adm1Code}: not a member of any 34-unit`);
  const merged = unit.members.length > 1 || regionKey(unit.name) !== regionKey(row.canonicalName);
  vnmEntries.push({
    level: "adm1-63", code: row.adm1Code, local: row.canonicalName, ko,
    source: "PROVINCE_KO_V150", reviewStatus: "confirmed",
    keys: unique([row.canonicalName, ...row.variants.filter((v) => !joinOnly.has(v)), ...(OTHER_NAMES[row.adm1Code] || [])].map(regionKey)),
    ...(merged ? { mergedInto: { code: unit.code, ko: unit.ko, effective: "2025-07-01" } } : {}),
  });
}

// --- ③/④ other Vietnamese place names found in the Viet Nam packs
// Fields that hold one place name, or a list of them with the separator given.
const PLACE_FIELDS = [
  ["regionLabel"],
  ["normalizedAttributes.지역명_현지어"],
  ["normalizedAttributes.지역명_베트남어"],
  ["normalizedAttributes.지역명_로마자"],
  ["normalizedAttributes.행정구역_GADM_매칭", /\s*·\s*/u],
  ["normalizedAttributes.발생지역_원문", /\s*,\s*|\s+and\s+/iu],
  ["normalizedAttributes.속성20_지역_원문"],
  ["normalizedAttributes.속성21_지역_현행"],
  ["normalizedAttributes.위치"],
  ["normalizedAttributes.city", /\s*;\s*/u],
  ["normalizedAttributes.소재_행정구역_성"],
];
const HANGUL = /[ㄱ-ㆎ가-힣]/u;
const COUNTRY_KEYS = new Set(["vietnam"]);
const dictionaryKeys = new Map();
for (const entry of vnmEntries) for (const key of entry.keys) if (!dictionaryKeys.has(key)) dictionaryKeys.set(key, entry.level);
const valueAt = (record, path) => path.split(".").reduce((value, part) => (value && typeof value === "object" ? value[part] : undefined), record);

const { elements: packs, errors: packErrors } = loadPackPayloads();
if (packErrors.length) throw new Error(`packs: ${packErrors.slice(0, 3).join("; ")}`);
const hits = { "adm1-34": 0, city: 0, "adm1-63": 0 };
const proposals = new Map();
const unresolved = new Map();
const vnmDictionaryEntries = [...vnmEntries];
const dictionaryByKey = new Map(vnmDictionaryEntries.flatMap((entry) => entry.keys.map((key) => [key, entry])));
// Free text that holds several places or a sentence ("Lai Chau and Dien Bien",
// "…communes, Song Ma district, Son La province") is left as written.
const DESCRIPTIVE = /[,;()[\]]|\s(?:and|và|&|of|on|the)\s|\d/iu;
function nearDictionaryName(key) {
  if (key.length < 5) return null;
  let best = null;
  for (const [candidate, entry] of dictionaryByKey) {
    const distance = editDistance(key, candidate);
    if (distance <= (key.length >= 9 ? 2 : 1) && (!best || distance < best.distance)) best = { distance, entry };
  }
  return best?.entry || null;
}
for (const [elementId, payload] of [...packs.entries()].sort(([a], [b]) => a.localeCompare(b))) {
  for (const bucket of ["observations", "entities"]) {
    for (const record of payloadRecords(payload?.[bucket])) {
      for (const [path, separator] of PLACE_FIELDS) {
        const value = valueAt(record, path);
        if (typeof value !== "string" || !value.trim()) continue;
        for (const token of separator ? value.split(separator) : [value]) {
          const raw = token.normalize("NFC").trim().replace(/^(?:and|và)\s+/iu, "");
          const key = regionKey(raw);
          if (!key || HANGUL.test(raw) || COUNTRY_KEYS.has(key)) continue;
          const level = dictionaryKeys.get(key);
          if (level) { hits[level] += 1; continue; }
          const name = withoutAdminWords(raw);
          const marked = hasVietnameseMarks(name);
          let result;
          if (DESCRIPTIVE.test(name) || name.split(/\s+/u).length > 4) {
            result = { ok: false, ko: "", category: "서술·목록형", reason: "지명 여러 개나 설명 문장" };
          } else if (marked) {
            // A spelled-out name that is not in the dictionaries is a district or
            // commune; only a cut-off dictionary name ("Tiền Gian") is a slip.
            const cut = vnmDictionaryEntries.find((entry) => entry.local.toLowerCase().startsWith(name.toLowerCase()) && entry.local.length > name.length);
            result = cut
              ? { ok: false, ko: "", category: "사전 이름 오기 의심", reason: `${cut.local}(${cut.ko})이 잘린 표기로 보임 — 원자료 확인 필요` }
              : vietnameseToHangulV161(name);
          } else {
            // Unmarked text (d or đ? a, ă or â?) cannot say which vowel it means:
            // a slip of a dictionary name is flagged, anything else is only a
            // suggestion for review and the screen keeps the source spelling.
            const near = nearDictionaryName(key);
            const guess = near ? null : vietnameseToHangulV161(name);
            result = near
              ? { ok: false, ko: "", category: "사전 이름 오기 의심", reason: `${near.local}(${near.ko})의 오기로 보임 — 원자료 확인 필요` }
              : guess.ok
                ? { ok: false, ko: guess.ko, category: "부호 없는 원문", reason: "성조·모음 부호가 없어 제안만 둠(화면은 원문)" }
                : guess;
          }
          if (!result.ok && !result.category) result = { ...result, category: "베트남어 음절 아님", reason: result.reason };
          const target = result.ok ? proposals : unresolved;
          if (!target.has(key)) target.set(key, { local: raw, ko: result.ko, reason: result.reason, category: result.category || "", elements: new Set(), fields: new Set(), frequency: 0, spellings: new Map() });
          const row = target.get(key);
          row.elements.add(elementId);
          row.fields.add(path.replace(/^normalizedAttributes\./u, ""));
          row.frequency += 1;
          row.spellings.set(raw, (row.spellings.get(raw) || 0) + 1);
        }
      }
    }
  }
}
const mostUsed = (spellings) => [...spellings.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))[0][0];
for (const [key, row] of proposals) {
  row.local = mostUsed(row.spellings);
  vnmEntries.push({ level: "locality", local: row.local, ko: row.ko, source: "nikl-vi-rule", reviewStatus: "pending", keys: [key] });
}

// --- ① Bangladesh: 8 divisions and 64 districts (source snapshot)
const sources = JSON.parse(read("scripts/v161/sources/bgd-region-sources-v161.json"));
const embassyNames = new Set(sources.embassyArticle.spelledNames);
const divisionsKo = sources.koreanWikipedia.divisions;
if (divisionsKo.length !== 8) throw new Error(`BGD divisions: ${divisionsKo.length}`);
// Spellings adopted by the government in 2018 alongside the older ones.
const BGD_OFFICIAL_SPELLINGS = { Barisal: ["Barishal"], Chittagong: ["Chattogram"], Comilla: ["Cumilla"], Jessore: ["Jashore"], Bogra: ["Bogura"] };
// English article titles that differ from the geoBoundaries spelling.
const WIKI_TO_GEOBOUNDARIES = { Jhalokathi: "Jhalokati", Brahmanbaria: "Brahamanbaria", Netrokona: "Netrakona", Moulvibazar: "Maulvibazar", "Chapai Nawabganj": "Nawabganj" };
// Korean articles without an English link (red links on the Korean page): the
// division fixes which district is meant.
const NO_LANGLINK = { "피로지푸르구": "Pirojpur", "랑가마티구": "Rangamati", "제나이다구": "Jhenaidah", "사트키라구": "Satkhira" };
const gbNames = new Set(sources.geoBoundariesAdm2.districtNames);
const gbByKey = new Map([...gbNames].map((name) => [regionKey(name), name]));
const bgdEntries = [];
const matchedGb = new Set();
const divisionKoNames = new Set();
for (const division of divisionsKo) {
  const local = String(division.titleEn || "").replace(/ Division$/u, "");
  const ko = division.titleKo.replace(/주$/u, "");
  if (!local) throw new Error(`${division.titleKo}: no English title`);
  divisionKoNames.add(ko);
  bgdEntries.push({
    level: "division", local, ko,
    source: embassyNames.has(ko) ? "embassy-dhaka-2016 · intake-2026-09-23" : "intake-2026-09-23 · kowiki",
    reviewStatus: "confirmed",
    keys: unique([local, ...(BGD_OFFICIAL_SPELLINGS[local] || [])].map(regionKey)),
  });
}
for (const division of divisionsKo) {
  const parent = division.titleEn.replace(/ Division$/u, "");
  for (const district of division.districts) {
    const wikiEnglish = district.titleEn ? district.titleEn.replace(/ District(?:, Bangladesh)?$/u, "") : null;
    const gbName = wikiEnglish ? gbByKey.get(regionKey(WIKI_TO_GEOBOUNDARIES[wikiEnglish] || wikiEnglish)) : NO_LANGLINK[district.titleKo];
    if (!gbName || !gbNames.has(gbName)) throw new Error(`${district.titleKo} (${wikiEnglish}): no geoBoundaries district`);
    if (matchedGb.has(gbName)) throw new Error(`${gbName}: matched twice`);
    matchedGb.add(gbName);
    const ko = district.titleKo.replace(/구$/u, "");
    bgdEntries.push({
      level: "district", local: gbName, ko, parent,
      source: `kowiki:방글라데시의 구@${sources.koreanWikipedia.revid}`,
      reviewStatus: divisionKoNames.has(ko) ? "confirmed" : "pending",
      keys: unique([gbName, wikiEnglish, ...(BGD_OFFICIAL_SPELLINGS[gbName] || [])].map(regionKey)),
    });
  }
}
if (matchedGb.size !== gbNames.size) throw new Error(`geoBoundaries districts unmatched: ${[...gbNames].filter((n) => !matchedGb.has(n)).join(", ")}`);

// --- keys must point at one entry per level
for (const [country, entries] of [["VNM", vnmEntries], ["BGD", bgdEntries]]) {
  const seen = new Map();
  for (const entry of entries) {
    for (const key of entry.keys) {
      const id = `${entry.level}:${key}`;
      if (seen.has(id)) throw new Error(`${country} ${id}: ${seen.get(id)} and ${entry.local}`);
      seen.set(id, entry.local);
    }
  }
}

const LEVEL_ORDER = { VNM: ["adm1-34", "city", "adm1-63", "locality"], BGD: ["division", "district"] };
const sortEntries = (country, entries) => [...entries].sort((a, b) =>
  LEVEL_ORDER[country].indexOf(a.level) - LEVEL_ORDER[country].indexOf(b.level) || (a.code || "").localeCompare(b.code || "") || a.local.localeCompare(b.local));
const dictionary = {
  schemaVersion: "region-names-v161",
  generatedBy: "scripts/v161/build-region-names-v161.mjs",
  format: "한글명 (현지명)",
  rules: [
    "① 플랫폼 사전(베트남 63·34·도시, 방글라데시 주 8·구 64) ③ 그 밖의 베트남 지명은 국립국어원 베트남어 표기 규칙 제안(pending) ④ 없으면 현지명만",
    "현지명은 원문 그대로 괄호에 넣고, 한글명과 같으면 괄호를 생략한다",
    "지도 라벨은 한글만(mode: label), 개편 전 63개 성은 원문 유지 + 통합 안내(mergedInto)",
  ],
  countries: {
    BGD: { levels: LEVEL_ORDER.BGD, entries: sortEntries("BGD", bgdEntries) },
    VNM: { levels: LEVEL_ORDER.VNM, entries: sortEntries("VNM", vnmEntries) },
  },
  sources: {
    vnm: ["PROVINCE_KO_V150", "vnm-adm1-aliases (63)", "ADM1_34_UNITS_V151", "MAP_CITIES_V151", "Viet Nam packs (place-name fields)"],
    bgd: {
      districtsLocal: `geoBoundaries gbOpen ${sources.geoBoundariesAdm2.boundaryId} (${sources.geoBoundariesAdm2.source}, ${sources.geoBoundariesAdm2.license}) sha256 ${sources.geoBoundariesAdm2.sha256}`,
      koreanNames: sources.koreanWikipedia.url,
      embassy: sources.embassyArticle.url,
    },
  },
};
const jsonText = `${JSON.stringify(dictionary, null, 2)}\n`;

// --- review list
const escape = (value) => String(value ?? "").replace(/\|/gu, "\\|");
const pending = [...proposals.values()].sort((a, b) => b.frequency - a.frequency || a.local.localeCompare(b.local));
const bgdDistricts = dictionary.countries.BGD.entries.filter((entry) => entry.level === "district");
const unresolvedRows = [...unresolved.values()].sort((a, b) => b.frequency - a.frequency || a.local.localeCompare(b.local));
const review = [
  "# 지역명 검수표 — V161-A (자동 변환·검수 대기)",
  "",
  "`scripts/v161/build-region-names-v161.mjs`가 생성한다. 손으로 고치지 말고 사전·규칙을 고친 뒤 다시 생성한다.",
  "",
  "## 규칙",
  "- 표기: `한글명 (현지명)` — 현지명은 원자료 표기 그대로(성조·특수문자 보존), 한글명과 같으면 괄호 생략. 지도 라벨은 한글만.",
  "- 한글명 결정 순서: ① 플랫폼 사전 ② 외교부·국립국어원 확인분 ③ 국립국어원 베트남어 표기 규칙 자동 변환(`pending`) ④ 변환 불가 → 현지명만.",
  "- 베트남 개편 전 63개 성·개편 후 34개 단위·주요 도시 6곳은 ①에서 100% 결정한다(자동 변환 0).",
  `- 자동 변환 규칙의 정확도: 사전 이름 97개(63 + 34)를 규칙으로 변환해 사전과 비교 — 97/97 일치(\`vietnamese-hangul-v161.test.mjs\`).`,
  "",
  "## 요약",
  `- 베트남 사전: 34개 단위 ${dictionary.countries.VNM.entries.filter((e) => e.level === "adm1-34").length} · 도시 ${dictionary.countries.VNM.entries.filter((e) => e.level === "city").length} · 63개 성 ${dictionary.countries.VNM.entries.filter((e) => e.level === "adm1-63").length}`,
  `- 베트남 팩 지명 필드 값의 사전 적중: ${hits["adm1-34"] + hits.city + hits["adm1-63"]}건(34개 단위 이름으로 ${hits["adm1-34"]} · 63개 성 이름으로 ${hits["adm1-63"]} — 도시 이름은 같은 이름의 34개 단위로 먼저 판정)`,
  `- 자동 변환(검수 대기) ${pending.length}개 · 원문 그대로 표시 ${unresolvedRows.length}개(${[...new Set(unresolvedRows.map((row) => row.category))].sort().map((category) => `${category} ${unresolvedRows.filter((row) => row.category === category).length}`).join(" · ")})`,
  `- 방글라데시: 주 8(확인) · 구 64(주와 같은 이름 ${bgdDistricts.filter((e) => e.reviewStatus === "confirmed").length}개 확인, 나머지 검수 대기)`,
  "",
  "## 1. 베트남 — 자동 변환 제안(검수 대기)",
  "화면에는 제안 한글명이 `한글명 (현지명)`으로 표시된다. 틀린 제안은 사전(① 또는 ②)에 올바른 표기를 넣어 바로잡는다.",
  "",
  "| 현지명(원문) | 제안 한글명 | 빈도 | 요소 | 필드 | 비고 |",
  "|---|---|---|---|---|---|",
  ...pending.map((row) => `| ${escape(row.local)} | ${escape(row.ko)} | ${row.frequency} | ${[...row.elements].sort().join(", ")} | ${[...row.fields].sort().join(", ")} | ${escape(row.reason || "")} |`),
  "",
  "## 2. 베트남 — 원문 그대로 표시(한글명 없음)",
  "추정하지 않는다. '부호 없는 원문'의 제안은 검수용일 뿐 화면에 쓰지 않는다. '사전 이름 오기 의심'은 원자료 표기를 확인한 뒤 사전 변형으로 올릴 수 있다.",
  "",
  "| 분류 | 원문 | 제안(화면 미사용) | 빈도 | 요소 | 필드 | 사유 |",
  "|---|---|---|---|---|---|---|",
  ...unresolvedRows
    .sort((a, b) => a.category.localeCompare(b.category) || b.frequency - a.frequency || a.local.localeCompare(b.local))
    .map((row) => `| ${row.category} | ${escape(mostUsed(row.spellings))} | ${escape(row.ko || "")} | ${row.frequency} | ${[...row.elements].sort().join(", ")} | ${[...row.fields].sort().join(", ")} | ${escape(row.reason)} |`),
  "",
  "## 3. 방글라데시 — 구 64 (현지명 = geoBoundaries, 한글명 = 한국어 위키백과)",
  `원천: ${sources.koreanWikipedia.url} · ${sources.geoBoundariesAdm2.boundaryId}(${sources.geoBoundariesAdm2.license}). 주방글라데시 대사관 글(${sources.embassyArticle.url})이 직접 표기한 이름: ${[...embassyNames].join("·")}.`,
  "",
  "| 주 | 현지명 | 한글명 | 검수 | 다른 표기 키 |",
  "|---|---|---|---|---|",
  ...bgdDistricts.map((entry) => `| ${entry.parent} | ${escape(entry.local)} | ${entry.ko} | ${entry.reviewStatus === "confirmed" ? "확인(주 이름과 같음)" : "검수 대기"} | ${entry.keys.filter((key) => key !== regionKey(entry.local)).join(", ")} |`),
  "",
].join("\n");

if (CHECK) {
  const stale = [[JSON_OUT, jsonText], [REVIEW_OUT, review]].filter(([path, text]) => !existsSync(path) || readFileSync(path, "utf8") !== text);
  if (stale.length) {
    console.error(`region names out of date: ${stale.map(([path]) => path.slice(ROOT.length + 1)).join(", ")} — run node scripts/v161/build-region-names-v161.mjs`);
    process.exit(1);
  }
  console.log("region names up to date");
} else {
  mkdirSync(dirname(JSON_OUT), { recursive: true });
  mkdirSync(dirname(REVIEW_OUT), { recursive: true });
  writeFileSync(JSON_OUT, jsonText, "utf8");
  writeFileSync(REVIEW_OUT, review, "utf8");
  console.log(JSON.stringify({ vnm: dictionary.countries.VNM.entries.length, bgd: dictionary.countries.BGD.entries.length, pending: pending.length, unresolved: unresolvedRows.length, hits }));
}
