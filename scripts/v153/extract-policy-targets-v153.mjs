/**
 * V153-D3: list the documents (C-009, C-010) and initiatives (C-008) that the
 * platform-edited descriptions attach to. One target per legal document
 * (deduplicated by its number, "06/2022/NĐ-CP") and one per initiative
 * (deduplicated by its short name, with truncated NAZCA labels folded in).
 *
 *   node scripts/v153/extract-policy-targets-v153.mjs [--data public/data/vietnam/v2] [--out reports/v153/d3-targets.json]
 */
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const argv = process.argv.slice(2);
const opt = (name, fallback) => {
  const index = argv.indexOf(name);
  return index < 0 ? fallback : argv[index + 1];
};
const DATA = resolve(ROOT, opt("--data", "public/data/vietnam/v2"));
const OUT = resolve(ROOT, opt("--out", "reports/v153/d3-targets.json"));

const NAME_KEY = "속성1_레코드명";
const VALUE_KEY = "속성3_값";
const CLASS_KEY = "속성6_분류";
const URL_KEY = "속성19_원문URL";

const entitiesOf = (elementId) =>
  JSON.parse(readFileSync(resolve(DATA, `downloads/${elementId.toLowerCase()}.json`), "utf8")).entities || [];

/** "Decision 942/QĐ-TTg", "942/QD-TTg", "QCVN 05:2023/BTNMT" → a stable code. */
export function documentCodeV153(value) {
  const ascii = String(value || "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/gu, "")
    .replace(/Đ/gu, "D")
    .replace(/đ/gu, "d")
    .toLowerCase();
  const qcvn = ascii.match(/qcvn\s*(\d+)\s*:\s*(\d{4})\s*\/\s*([a-z]+)/u);
  if (qcvn) return `qcvn-${qcvn[1].padStart(2, "0")}-${qcvn[2]}-${qcvn[3]}`;
  const code = ascii.match(/(\d+)\/(?:(\d{4})\/)?([a-z]+(?:-[a-z]+)*)/u);
  if (!code) return "";
  return [code[1].padStart(2, "0"), code[2], code[3]].filter(Boolean).join("-");
}

/**
 * Document rows of the C template: the row names the act (its own
 * 속성1_레코드명), or it is a source row ("— FAOLEX 원문 PDF") or an attribute
 * row ("현행 여부", "법률") whose 속성6_분류 or 속성3_값 names the act.
 */
const DOCUMENT_TYPE_LABEL = /^(?:Kế hoạch \(KH-UBND\)|Nghị quyết \(HĐND\)|Quyết định \(UBND\)|Quy hoạch tỉnh)$/u;
const TITLE_ONLY = {
  "환경보호법": "72/2020/QH14",
  "국가기후변화전략 2050": "896/QĐ-TTg",
};

function documentTargets(elementId) {
  const byCode = new Map();
  const add = (code, fields) => {
    if (!code) return;
    const entry = byCode.get(code) || { key: code, elementIds: [elementId], names: new Set(), entryNames: new Set(), recordIds: new Set(), sourceUrls: new Set(), rowCount: 0 };
    Object.entries(fields).forEach(([field, value]) => {
      if (value instanceof Set) value.forEach((item) => entry[field].add(item));
      else if (typeof value === "number") entry[field] += value;
      else if (value) entry[field].add(value);
    });
    byCode.set(code, entry);
  };
  entitiesOf(elementId).forEach((entity) => {
    const attributes = entity.normalizedAttributes || {};
    const rawName = String(attributes[NAME_KEY] ?? entity.name ?? "").trim();
    const value = attributes[VALUE_KEY] == null ? "" : String(attributes[VALUE_KEY]);
    const cls = attributes[CLASS_KEY] == null ? "" : String(attributes[CLASS_KEY]);
    const url = attributes[URL_KEY] || entity.sourceUrl || "";
    if (!rawName || DOCUMENT_TYPE_LABEL.test(rawName)) return;
    const name = rawName.replace(/^\s*[—–-]\s*/u, "");
    const own = documentCodeV153(TITLE_ONLY[name] || name);
    if (own && !/^\s*[—–-]/u.test(rawName) && !/^(?:개정 이력|Decree 06\/2022 규정 범위|Luật 146\/2025\/QH15의|Decree 05\/2025 Appendix|Circular 01\/2023\/TT-BTNMT 부칙)/u.test(name)) {
      add(own, { names: name, entryNames: name, recordIds: entity.recordId, sourceUrls: url, rowCount: 1 });
      return;
    }
    // "개정 이력 Nghị định 243/2026/NĐ-CP" and "Circular 01/2023/TT-BTNMT 부칙"
    // name the act inside a longer label.
    const embedded = name.match(/(?:Nghị định|Circular|Decree|Luật|Decision|Quyết định)\s+[\d./A-ZĐ-]+/u);
    if (embedded && own) {
      add(own, { names: embedded[0], entryNames: name, recordIds: entity.recordId, sourceUrls: url, rowCount: 1 });
      return;
    }
    // Attribute or source rows: the act sits in 속성6_분류 or 속성3_값.
    [cls, value].forEach((candidate) => {
      const code = documentCodeV153(candidate);
      if (code && candidate.length <= 60) add(code, { names: candidate.trim(), recordIds: entity.recordId, rowCount: 1 });
    });
    // A composite label ("LEP 제54·55조 + Decree 08/2022/ND-CP + Circular
    // 02/2022/TT-BTNMT") names a circular after the act its first code names.
    const description = attributes["속성23_설명"] == null ? "" : String(attributes["속성23_설명"]);
    [name, value, description].forEach((candidate) => {
      (candidate.match(/(?:Circular|Thông tư)\s+\d+\/\d{4}\/TT-[A-Z]+/gu) || []).forEach((circular) => {
        add(documentCodeV153(circular), { names: circular, recordIds: entity.recordId, rowCount: 1 });
      });
    });
  });
  return [...byCode.values()].map((entry) => ({
    ...entry,
    names: [...entry.names],
    entryNames: [...entry.entryNames],
    recordIds: [...entry.recordIds],
    sourceUrls: [...entry.sourceUrls].filter(Boolean),
  }));
}

/** Initiatives of C-008: the subject before " — " of attribute rows plus initiative rows. */
const INITIATIVE_KEYS = [
  { key: "jetp", match: /^JETP/u },
  { key: "cool-coalition", match: /^Cool Coalition/u },
  { key: "ccac", match: /^CCAC$/u },
  { key: "global-coal-to-clean-power", match: /^Global Coal to Clean Power/u },
  { key: "fff", match: /^Forest and Farm Facility/u },
  { key: "nydf", match: /^The New York Declaration on Forests/u },
  { key: "glasgow-forests-declaration", match: /^Glasgow Forests Declaration/u },
  { key: "ppca", match: /^PPCA/u },
  { key: "4per1000", match: /^4\/1000 Initiative/u },
  { key: "a6ip", match: /^Paris Agreement Article 6 Implementation/u },
  { key: "isa", match: /^International Solar Alliance/u },
  { key: "gfei", match: /^Global Fuel Economy Initiative/u },
  { key: "global-methane-pledge", match: /^Global Methane Pledge$/u },
  { key: "ccich", match: /^Climate Change Impacts on Cultural and N/u },
  { key: "asap", match: /^Adaptation for Smallholder Agriculture P/u },
  { key: "blue-growth-initiative", match: /^Blue Growth Initiative/u },
  { key: "ico-coffee-task-force", match: /^International Coffee Organization Coffee/u },
  { key: "subaru-nma", match: /^SUBARU/u },
  { key: "globalabc", match: /^Global Alliance for Buildings and Constr/u },
  // Treaties appear as ratification-date rows only.
  { key: "unfccc", match: /^기후변화협약\(UNFCCC\)$/u },
  { key: "kyoto-protocol", match: /^교토의정서$/u },
  { key: "doha-amendment", match: /^도하개정/u },
  { key: "paris-agreement", match: /^파리협정$/u },
];

function initiativeTargets() {
  const byKey = new Map();
  entitiesOf("C-008").forEach((entity) => {
    const attributes = entity.normalizedAttributes || {};
    const name = String(attributes[NAME_KEY] ?? entity.name ?? "").trim();
    const subject = name.split(" — ")[0].trim();
    const rule = INITIATIVE_KEYS.find((candidate) => candidate.match.test(subject));
    if (!rule) return;
    const entry = byKey.get(rule.key) || { key: rule.key, elementIds: ["C-008"], names: new Set(), recordIds: new Set(), sourceUrls: new Set(), rowCount: 0 };
    entry.names.add(subject);
    entry.recordIds.add(entity.recordId);
    if (attributes[URL_KEY]) entry.sourceUrls.add(String(attributes[URL_KEY]));
    entry.rowCount += 1;
    byKey.set(rule.key, entry);
  });
  return INITIATIVE_KEYS.map((rule) => byKey.get(rule.key)).filter(Boolean).map((entry) => ({
    ...entry,
    names: [...entry.names],
    recordIds: [...entry.recordIds],
    sourceUrls: [...entry.sourceUrls],
  }));
}

const c009 = documentTargets("C-009");
const c010 = documentTargets("C-010");
const c008 = initiativeTargets();
const union = new Map();
[...c009, ...c010].forEach((entry) => {
  const existing = union.get(entry.key);
  if (!existing) {
    union.set(entry.key, { ...entry });
    return;
  }
  existing.elementIds = [...new Set([...existing.elementIds, ...entry.elementIds])];
  existing.names = [...new Set([...existing.names, ...entry.names])];
  existing.entryNames = [...new Set([...existing.entryNames, ...entry.entryNames])];
  existing.recordIds = [...new Set([...existing.recordIds, ...entry.recordIds])];
  existing.sourceUrls = [...new Set([...existing.sourceUrls, ...entry.sourceUrls])];
  existing.rowCount += entry.rowCount;
});

const result = {
  generatedAt: new Date().toISOString(),
  counts: {
    "C-009": c009.length,
    "C-010": c010.length,
    documentsUnion: union.size,
    "C-008": c008.length,
    initiatives: c008.filter((entry) => !/^(?:unfccc|kyoto-protocol|doha-amendment|paris-agreement)$/u.test(entry.key)).length,
    treaties: c008.filter((entry) => /^(?:unfccc|kyoto-protocol|doha-amendment|paris-agreement)$/u.test(entry.key)).length,
  },
  documents: [...union.values()].sort((left, right) => left.key.localeCompare(right.key)),
  initiatives: c008,
};

mkdirSync(dirname(OUT), { recursive: true });
writeFileSync(OUT, `${JSON.stringify(result, null, 2)}\n`);
console.log(JSON.stringify(result.counts));
result.documents.forEach((entry) => console.log(`doc  ${entry.key.padEnd(22)} ${entry.elementIds.join(",").padEnd(12)} rows=${entry.rowCount}  ${entry.names.join(" | ")}`));
result.initiatives.forEach((entry) => console.log(`init ${entry.key.padEnd(28)} rows=${entry.rowCount}  ${entry.names.join(" | ")}`));
