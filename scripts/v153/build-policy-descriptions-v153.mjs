/**
 * V153-D3: merge the reviewed research files into
 * src/data/visualization/policyDescriptionsV153.json.
 *
 *   node scripts/v153/build-policy-descriptions-v153.mjs --research <dir> [--checked-at 2026-09-22]
 *
 * <dir> holds research-A.json (C-009 laws), research-B.json (C-010 laws and
 * provincial plans) and research-C.json (C-008 initiatives and treaties), each
 * an array of { key, title, formalName, shortName?, issuer?, effectiveDate?,
 * description[], sourceUrl[], sourceType, verified, note }. Targets and the
 * names each key is matched by come from reports/v153/d3-targets.json.
 * Entries without a verified research row are written as "pending" with an
 * empty description, never with an unsourced sentence.
 */
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const argv = process.argv.slice(2);
const opt = (name, fallback) => {
  const index = argv.indexOf(name);
  return index < 0 ? fallback : argv[index + 1];
};
const RESEARCH = resolve(ROOT, opt("--research", "reports/v153/research"));
const CHECKED_AT = opt("--checked-at", new Date().toISOString().slice(0, 10));
const TARGETS = resolve(ROOT, "reports/v153/d3-targets.json");
const OUT = resolve(ROOT, "src/data/visualization/policyDescriptionsV153.json");

const targets = JSON.parse(readFileSync(TARGETS, "utf8"));
const research = new Map();
["research-A.json", "research-B.json", "research-C.json"].forEach((file) => {
  const path = resolve(RESEARCH, file);
  if (!existsSync(path)) return;
  JSON.parse(readFileSync(path, "utf8")).forEach((row) => research.set(row.key, row));
});

const TREATY_KEYS = new Set(["unfccc", "kyoto-protocol", "doha-amendment", "paris-agreement"]);
const HTTPS = /^https:\/\/[^\s"'<>]+$/u;

/**
 * The timeline names a document once per entry; a row that restates the
 * document inside a longer label is an attribute row and gets no card. C-010
 * names three acts only through an attribute row whose 속성6_분류 carries the
 * act, so those entries are matched by that row's name.
 */
const ENTRY_NAME_EXCLUDE = /의 환경보호법 개정 범위$|^LEP 제54/u;
const EXTRA_ENTRY_NAMES = {
  // The circular has no row of its own; the row that names the EPR system's
  // three instruments is where a reader meets it.
  "02-2022-tt-btnmt": ["LEP 제54 55조 + Decree 08/2022/ND-CP + Circular 02/2022/TT-BTNMT"],
  "20-2008-qh": ["법률"],
  "28-2023-qh": ["법률 전면개정(구법 대체)"],
  "149-qd-ttg": ["총리 결정(전략), 비전 2050"],
};

const text = (value) => (typeof value === "string" ? value.replace(/\s+/gu, " ").trim() : "");
// Editorial pass: the signing official's name is not part of what a law does.
const SIGNATORY = /\s*\((?:서명:|부총리)[^)]*\)|\s*\(서명:[^)]*\)/gu;
const lines = (value) => (Array.isArray(value) ? value.map((line) => text(line).replace(SIGNATORY, "").replace(/\s+,/gu, ",").trim()).filter(Boolean) : []);
const urls = (value) => [...new Set((Array.isArray(value) ? value : []).map(text).filter((url) => HTTPS.test(url)))];

function entryOf(target, kind) {
  const row = research.get(target.key);
  const verified = Boolean(row && row.verified && lines(row.description).length >= 2 && urls(row.sourceUrl).length >= 1);
  const names = kind === "document"
    ? [...new Set([...(target.entryNames || []).filter((name) => !ENTRY_NAME_EXCLUDE.test(name)), ...(EXTRA_ENTRY_NAMES[target.key] || [])])]
    : [...new Set(target.names)];
  return {
    key: target.key,
    kind,
    elementIds: target.elementIds,
    names,
    title: text(row?.title) || target.names[0],
    formalName: text(row?.formalName) || target.names[0],
    shortName: text(row?.shortName) || null,
    issuer: text(row?.issuer) || null,
    effectiveDate: text(row?.effectiveDate) || null,
    description: verified ? lines(row.description) : [],
    sourceUrl: verified ? urls(row.sourceUrl) : urls(row?.sourceUrl),
    sourceType: text(row?.sourceType) || "unverified",
    checkedAt: CHECKED_AT,
    status: verified ? "verified" : "pending",
    note: text(row?.note) || (row ? "" : "조사 결과 없음"),
  };
}

const entries = [
  ...targets.documents.map((target) => entryOf(target, "document")),
  ...targets.initiatives.map((target) => entryOf(target, TREATY_KEYS.has(target.key) ? "treaty" : "initiative")),
];

const output = {
  version: "V153-D3",
  generatedAt: new Date().toISOString(),
  note: "플랫폼 편집 설명. 원자료 열을 덮어쓰지 않으며 각 문장은 sourceUrl의 공식 출처에서 확인한 내용만 담는다.",
  entries,
};
writeFileSync(OUT, `${JSON.stringify(output, null, 2)}\n`);

const summary = entries.reduce((acc, entry) => {
  const bucket = acc[entry.kind] || (acc[entry.kind] = { total: 0, verified: 0, pending: [] });
  bucket.total += 1;
  if (entry.status === "verified") bucket.verified += 1;
  else bucket.pending.push(entry.key);
  return acc;
}, {});
console.log(JSON.stringify(summary, null, 2));
