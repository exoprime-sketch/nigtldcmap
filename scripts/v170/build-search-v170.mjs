#!/usr/bin/env node
/**
 * V170 search assets, built from each live country's published packs.
 *
 *   public/data/search/v170/records-<ISO3>.json
 *     Per dataset, the public text of every record (entity names and
 *     attribute values, observation indicator labels) as [text, count]
 *     pairs. Numbers, dates, file names, identifiers, links and working-note
 *     fields are left out, so a search can say "N of M records" and quote the
 *     matching record without exposing internal notes.
 *
 *   public/data/search/v170/topics-<ISO3>.json
 *     The topic panel: for each topic in scripts/v170/topic-rules-v170.json,
 *     one row per dataset with a value computed from that dataset's records
 *     (card headline, latest value of one indicator, filtered count/sum, or
 *     count of records that mention the topic). A rule that finds nothing is
 *     dropped; nothing is estimated or filled in.
 *
 * Usage: node scripts/v170/build-search-v170.mjs [--check]
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { gunzipSync } from "node:zlib";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const OUT_DIR = resolve(ROOT, "public/data/search/v170");
const CHECK = process.argv.includes("--check");

const readJson = (path) => JSON.parse(readFileSync(path, "utf8"));
const SYNONYMS = readJson(resolve(ROOT, "src/data/search/searchSynonymsV170.json"));
const RULES = readJson(resolve(ROOT, "scripts/v170/topic-rules-v170.json"));

// ---------------------------------------------------------------- matching (mirrors src/data/search/searchMatchV170.ts)
export function normalizeV170(text) {
  return String(text ?? "").normalize("NFC").toLowerCase();
}
const ASCII = /^[\x20-\x7e]+$/;
function escapeRegExp(text) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
export function termMatcherV170(terms) {
  const compiled = terms.map((term) => {
    const t = normalizeV170(term).trim();
    if (ASCII.test(t)) {
      const re = new RegExp(`(^|[^a-z0-9])${escapeRegExp(t)}($|[^a-z0-9])`, "u");
      return (text) => re.test(text);
    }
    const squeezed = t.replace(/\s+/g, "");
    return (text) => text.includes(t) || text.replace(/\s+/g, "").includes(squeezed);
  });
  return (text) => {
    const n = normalizeV170(text);
    return compiled.some((test) => test(n));
  };
}
function groupTerms(groupIds) {
  return [groupIds].flat().flatMap((groupId) => {
    const group = SYNONYMS.groups.find((item) => item.id === groupId);
    if (!group) throw new Error(`unknown synonym group ${groupId}`);
    return group.terms;
  });
}

// ---------------------------------------------------------------- packs
function decodePack(path) {
  const raw = readJson(path);
  if (Array.isArray(raw.payloadChunks)) {
    return JSON.parse(gunzipSync(Buffer.from(raw.payloadChunks.join(""), "base64")).toString("utf8"));
  }
  return raw;
}

// ---------------------------------------------------------------- public record text
const SKIP_KEY = /(판단|근거|결측|레코드id|url|source|메모|note|검토|framework|확인|비고|출처|참고|수집|gppd|좌표|위도|경도|^lat|^lon|행정코드|코드$|파일)/iu;
const NUMLIKE = /^[-+~<>≈]?\s*[\d.,%/\s:-]+[a-zA-Z%°㎡²]*$/u;
const FILELIKE = /\.(geojson|csv|xlsx?|tif|tiff|json|shp|zip|pdf)\b|\[공통\]/iu;
const IDLIKE = /^[A-Z]{2,4}\d*[.\-_][\w.\-]+$/u;
const MAX_TEXT = 160;

// Record keys and codes that read as text but are not for the public line.
const KEYLIKE = /^\S*_\S*$/u; // vcs_2040, gis_osm_natural_free_1, VNM_lc_…_1992
const PREFIXED_ID = /^[A-Z]{2,5}-[A-Z]{2,4}-\S/u; // PPI-VNM-…, XM-DAC-41122
const PLACEHOLDER = /%[A-Z]{3,}/u; // %YEARREF
const EMAIL = /[\w.+-]+@[\w-]+\./u; // contact addresses stay on the detail page
const NUMBERED_TECH = /^\d{1,2}\s+(\S.*기술)$/u; // "1 태양광 기술" -> "태양광 기술"
// Working notes the public screens never show: the families of
// SOURCE_NOTE_PATTERNS_V161 (scripts/v161/audit-source-notes-v161.mjs, which
// cannot be imported - it runs its audit on load). A record value matching one
// is left out of the search text, so it never reaches the "일치 근거" line.
const SOURCE_NOTE = [
  /확인필요|발주처/u,
  /용역사|STADT/u,
  /현지조사|현지\s*컨설턴트/u,
  /원천\s*미기재/u,
  /제공기관\s*확인/u,
  /자료기간\s*미기재|단위\s*미기재/u,
  /해당\s*없음|공개\s*원천\s*부재|생성\s*예정/u,
  /멤버\s*\d|미특정/u,
  /Items_|_v\d+(?:\.\d+)*\b/iu,
  /\b(?:VNM|BGD)-[A-E]\d{3}-/u,
  /raw_data|raw는|raw\s*파일/iu,
  /\[(?:라이선스|출처 문구|표출범위|변경 고지|기준 원천|대조|처리규칙|DoD|열 구조|원천 갱신일|추가수집|수집 방법|원문 정제)[^\]]*\]|처리규칙|(?<!v)\d{4}-\d{2}-\d{2}\s*확인/u,
];
// A cell that only says nothing is known.
const PLACEHOLDER_VALUE = /^\(?(?:미확인|미기재|확인\s*중|not available|n\/a|na|none|unknown|-)\)?$/iu;

function publicValue(value) {
  if (value === null || value === undefined || typeof value === "number" || typeof value === "boolean") return "";
  let text = String(value).trim();
  if (!text || /^https?:/iu.test(text) || text.length > MAX_TEXT) return "";
  if (PLACEHOLDER.test(text) || PREFIXED_ID.test(text) || EMAIL.test(text)) return "";
  if (text.includes("|")) {
    // A list kept in one cell: each part on its own terms.
    const parts = text
      .split(/\s*\|\s*/u)
      .map((part) => publicValue(part))
      .filter((part) => part && !(/^[\x20-\x7e]+$/u.test(part) && part.length < 3));
    return Array.from(new Set(parts)).join(" · ");
  }
  // A record name led by its collection method ("현지조사, Offshore Wind Power"):
  // the method goes, the name stays.
  text = text.replace(/^(?:현지조사|현지\s*컨설턴트)\s*[,·:]\s*/u, "");
  const numbered = NUMBERED_TECH.exec(text);
  if (numbered) text = numbered[1];
  if (NUMLIKE.test(text) || FILELIKE.test(text) || IDLIKE.test(text) || KEYLIKE.test(text)) return "";
  if (PLACEHOLDER_VALUE.test(text) || SOURCE_NOTE.some((pattern) => pattern.test(text))) return "";
  return text;
}
function entityText(record) {
  const parts = [];
  const name = publicValue(record.name);
  if (name) parts.push(name);
  for (const [key, value] of Object.entries(record.normalizedAttributes || {})) {
    if (SKIP_KEY.test(key)) continue;
    const text = publicValue(value);
    if (text) parts.push(text);
  }
  return Array.from(new Set(parts)).join(" · ").slice(0, MAX_TEXT);
}
function indicatorLabels(meta) {
  const labels = new Map();
  for (const indicator of meta?.indicators || []) {
    const id = indicator.indicatorId || indicator.id;
    const label = indicator.label || indicator.labelKo || indicator.name || indicator.nameKo || "";
    if (id) labels.set(id, label);
  }
  return labels;
}

// ---------------------------------------------------------------- formatting
const fmt = (value, digits = 0) =>
  Number(value).toLocaleString("ko-KR", { maximumFractionDigits: digits, minimumFractionDigits: 0 });
const fill = (template, values) => template.replace(/\{(\w+)\}/g, (_, key) => (key in values ? String(values[key]) : `{${key}}`));

// ---------------------------------------------------------------- rules
function evaluateRow(rule, topic, ctx) {
  if (Array.isArray(rule.oneOf)) {
    for (const option of rule.oneOf) {
      const row = evaluateRow({ role: rule.role, ...option }, topic, ctx);
      if (row) return row;
    }
    return null;
  }
  const { packs, cards, recordIndex, recordTotals } = ctx;
  const element = packs.get(rule.elementId);
  const card = cards.get(rule.elementId);
  // A record count names the topic ("{label} 관련 N건"), so it counts what a
  // search for the topic's own word finds on the result card: the first group
  // only. Other rule types may read the topic's wider groups.
  const terms = groupTerms(rule.groups || (rule.type === "recordMatch" ? topic.groups.slice(0, 1) : topic.groups));
  const matches = termMatcherV170(terms);
  const base = { role: rule.role, elementId: rule.elementId };

  if (rule.type === "card") {
    if (!card?.headline?.value) return null;
    const text = `${card.headline.value} ${card.headline.label || ""}`;
    if (rule.require && !new RegExp(rule.require, "iu").test(text)) return null;
    return { ...base, value: card.headline.value, sub: card.headline.label || "", basis: "card" };
  }

  if (!element) return null;
  const entities = element.entities?.records || [];
  const observations = element.observations?.records || [];

  if (rule.type === "indicatorLatest") {
    const re = new RegExp(rule.indicator, "u");
    const ids = Array.from(new Set(observations.map((o) => o.indicatorId).filter((id) => re.test(id))));
    if (ids.length !== 1) return null; // never add series together
    const series = observations
      .filter((o) => o.indicatorId === ids[0] && o.value !== null && o.value !== undefined && Number.isFinite(Number(o.year)))
      .map((o) => [Number(o.year), Number(o.value)])
      .sort((a, b) => a[0] - b[0]);
    if (series.length === 0) return null;
    const unit = observations.find((o) => o.indicatorId === ids[0])?.unit || rule.unit || "";
    const [year, latest] = series[series.length - 1];
    const [firstYear, first] = series[0];
    const values = { label: rule.label ?? topic.label, value: fmt(latest, rule.digits ?? 0), unit, year, firstYear, first: fmt(first, rule.digits ?? 1) };
    return {
      ...base,
      value: fill(rule.value || "{label} {value} {unit}", values).trim(),
      sub: fill(rule.sub || "{year}년", values),
      series: series.length >= 3 ? series : undefined,
      basis: "indicatorLatest",
    };
  }

  if (rule.type === "entityAgg") {
    const pool = entities.filter((r) => !rule.indicator || r.indicatorId === rule.indicator);
    if (pool.length === 0) return null;
    const first = (r, keys) => [keys].flat().map((key) => r.normalizedAttributes?.[key]).find((v) => v !== null && v !== undefined && v !== "");
    const hit = pool.filter((r) => matches(String(first(r, rule.attr) ?? "")));
    if (hit.length === 0) return null;
    const sum = (rows) => rows.reduce((total, r) => total + (Number(first(r, rule.sumAttr)) || 0), 0);
    const values = {
      label: rule.label ?? topic.label,
      count: fmt(hit.length), total: fmt(pool.length),
      sum: rule.sumAttr ? fmt(sum(hit)) : "", totalSum: rule.sumAttr ? fmt(sum(pool)) : "",
    };
    return { ...base, value: fill(rule.value, values), sub: fill(rule.sub, values), basis: "entityAgg" };
  }

  if (rule.type === "recordMatch") {
    const texts = recordIndex.get(rule.elementId) || [];
    // Same total as the finder's "원자료 N건 중" line: every record, text or not.
    const total = Math.max(texts.reduce((n, [, count]) => n + count, 0), recordTotals.get(rule.elementId) || 0);
    const matched = texts.reduce((n, [text, count]) => n + (matches(text) ? count : 0), 0);
    if (total === 0 || matched === 0) return null;
    const values = { label: rule.label ?? topic.label, count: fmt(matched), total: fmt(total) };
    return {
      ...base,
      value: fill(rule.value || "{label} 포함 {count}건", values),
      sub: fill(rule.sub || "전체 {total}건 중", values),
      basis: "recordMatch",
    };
  }
  throw new Error(`unknown rule type ${rule.type}`);
}

// ---------------------------------------------------------------- per country
function buildCountry(country) {
  const dataRoot = resolve(ROOT, "public" + country.dataRoot);
  const catalog = readJson(resolve(dataRoot, "catalog.json")).elements;
  const bundle = readJson(resolve(dataRoot, "packs/bundle-index-v124.json")).elements;
  const cardsFile = resolve(dataRoot, "home/card-summaries-v140.json");
  const cards = new Map(existsSync(cardsFile) ? readJson(cardsFile).cards.map((c) => [c.elementId, c]) : []);
  const published = new Set(catalog.filter((e) => e.publicStatus !== "excluded").map((e) => e.assetRef?.elementId || e.elementId));

  const packCache = new Map();
  const packs = new Map();
  for (const [elementId, info] of Object.entries(bundle)) {
    if (!published.has(elementId) || !info.packUrl) continue;
    const path = resolve(ROOT, "public" + info.packUrl);
    if (!existsSync(path)) continue;
    if (!packCache.has(path)) packCache.set(path, decodePack(path));
    const element = packCache.get(path).elements?.[elementId];
    if (element) packs.set(elementId, element);
  }

  const recordIndex = new Map();
  const elements = {};
  for (const [elementId, element] of [...packs.entries()].sort(([a], [b]) => a.localeCompare(b))) {
    const counts = new Map();
    for (const record of element.entities?.records || []) {
      const text = entityText(record);
      if (text) counts.set(text, (counts.get(text) || 0) + 1);
    }
    const labels = indicatorLabels(element.meta);
    for (const observation of element.observations?.records || []) {
      const text = publicValue(labels.get(observation.indicatorId)) || "";
      if (text) counts.set(text, (counts.get(text) || 0) + 1);
    }
    const texts = [...counts.entries()];
    recordIndex.set(elementId, texts);
    const total = (element.entities?.records?.length || 0) + (element.observations?.records?.length || 0);
    elements[elementId] = { total, texts };
  }

  const recordTotals = new Map(Object.entries(elements).map(([elementId, entry]) => [elementId, entry.total]));
  const ctx = { packs, cards, recordIndex, recordTotals };
  const topics = [];
  for (const topic of RULES.topics) {
    const rows = topic.rows.map((rule) => evaluateRow(rule, topic, ctx)).filter(Boolean);
    if (rows.length >= (RULES.minRows ?? 3)) topics.push({ id: topic.id, label: topic.label, groups: topic.groups, rows });
  }

  const snapshot = readJson(resolve(dataRoot, "catalog.json")).dataSnapshot || null;
  return {
    records: { schemaVersion: "search-records-v170", country: country.iso3, dataSnapshot: snapshot, elements },
    topics: { schemaVersion: "search-topics-v170", country: country.iso3, dataSnapshot: snapshot, topics },
  };
}

// ---------------------------------------------------------------- main
const countries = readJson(resolve(ROOT, "public/data/countries.json")).countries.filter((c) => c.status === "live" && c.dataRoot);
mkdirSync(OUT_DIR, { recursive: true });
let stale = 0;
for (const country of countries) {
  const { records, topics } = buildCountry(country);
  for (const [name, value] of [[`records-${country.iso3}.json`, records], [`topics-${country.iso3}.json`, topics]]) {
    const path = resolve(OUT_DIR, name);
    const text = JSON.stringify(value) + "\n";
    if (CHECK) {
      if (!existsSync(path) || readFileSync(path, "utf8") !== text) {
        console.error(`stale: ${name}`);
        stale += 1;
      }
    } else {
      writeFileSync(path, text);
    }
  }
  console.log(`${country.iso3}: ${Object.keys(records.elements).length} datasets indexed, ${topics.topics.length} topics (${topics.topics.map((t) => `${t.label} ${t.rows.length}`).join(", ")})`);
}
if (CHECK && stale) process.exit(1);
