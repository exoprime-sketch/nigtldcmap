/**
 * V153-D3 (refreshed for the 2026-09-30 delivery): list the documents
 * (C-009, C-010) and initiatives (C-008) that the platform-edited
 * descriptions attach to. One target per legal document (deduplicated by its
 * number, "06/2022/NĐ-CP") and one per initiative (deduplicated by a keyword
 * of its name).
 *
 * The 2026-09-30 delivery moved C-008/C-009/C-010 to the wide one-row-per-
 * record template ('[블록] 속성' columns): a law is now one row with its own
 * 법령_문서번호/법령_법령명_원문/식별_레코드명, and one C-008 row is one
 * (actor × initiative) participation, with the initiative's own name in
 * 이니셔티브_이니셔티브명_원문/국문 - not the row's 식별_레코드명, which is the
 * actor ("Da Nang (City)"). The old row-per-attribute scan (속성1_레코드명,
 * 속성6_분류 attribute rows, "— FAOLEX 원문 PDF" source rows …) no longer
 * matches anything in this delivery, so this script now reads the wide
 * columns directly; it no longer supports the pre-refresh row shape.
 *
 *   node scripts/v153/extract-policy-targets-v153.mjs [--data public/data/vietnam/v2] [--out reports/v153/d3-targets.json]
 */
import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { readDownloadJsonV158 } from "../v158/download-zip-v158.mjs";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const argv = process.argv.slice(2);
const opt = (name, fallback) => {
  const index = argv.indexOf(name);
  return index < 0 ? fallback : argv[index + 1];
};
const DATA = resolve(ROOT, opt("--data", "public/data/vietnam/v2"));
const OUT = resolve(ROOT, opt("--out", "reports/v153/d3-targets.json"));

const entitiesOf = (elementId) =>
  // V158: the download JSON ships inside downloads/<id>.zip.
  readDownloadJsonV158(DATA, elementId)?.entities || [];

const text = (value) => String(value ?? "").replace(/\s+/gu, " ").trim();
/** The part before the first comma - the delivery's own short form of a "CODE, subtitle" name. */
const shortForm = (value) => text(value).split(",")[0].trim();

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
 * Every [법령] row names its own act once - 법령_문서번호 is the citation, and
 * 식별_레코드명 (the record's own title) plus 법령_법령명_원문 (its original
 * title) are the names a reader meets. Both are folded in, whole and as the
 * text before their first comma, since several are written "CODE, subtitle"
 * ("Decision 01/2022/QĐ-TTg, GHG 인벤토리 대상 부문·시설 목록(최초)").
 */
function documentTargets(elementId) {
  const byCode = new Map();
  const add = (code, fields) => {
    if (!code) return;
    const entry =
      byCode.get(code) ||
      { key: code, elementIds: [elementId], names: new Set(), entryNames: new Set(), recordIds: new Set(), sourceUrls: new Set(), rowCount: 0 };
    Object.entries(fields).forEach(([field, value]) => {
      if (value instanceof Set) value.forEach((item) => entry[field].add(item));
      else if (typeof value === "number") entry[field] += value;
      else if (value) entry[field].add(value);
    });
    byCode.set(code, entry);
  };
  entitiesOf(elementId).forEach((entity) => {
    const attributes = entity.normalizedAttributes || {};
    const docNumber = text(attributes["법령_문서번호"]);
    const code = documentCodeV153(docNumber);
    if (!code) return;
    const recordName = text(attributes["식별_레코드명"] ?? entity.name);
    const originalName = text(attributes["법령_법령명_원문"]);
    const names = new Set(
      [recordName, shortForm(recordName), originalName, shortForm(originalName)].filter(Boolean)
    );
    const url = text(attributes["출처_원문_URL"]) || entity?.provenance?.sourceUrl || "";
    add(code, { names, entryNames: names, recordIds: entity.recordId, sourceUrls: url, rowCount: 1 });
  });
  return [...byCode.values()].map((entry) => ({
    ...entry,
    names: [...entry.names],
    entryNames: [...entry.entryNames],
    recordIds: [...entry.recordIds],
    sourceUrls: [...entry.sourceUrls].filter(Boolean),
  }));
}

/**
 * A C-008 row's own name is the actor ("Can Tho City (City)"), not the
 * initiative; the initiative it participates in is 이니셔티브_이니셔티브명
 * (원문/국문). Several are now written as a full descriptive name with the
 * short form in parentheses ("Just Energy Transition Partnership (JETP)
 * with Viet Nam"), so a key is matched by a keyword rather than a prefix.
 */
const INITIATIVE_KEYS = [
  { key: "jetp", includes: ["JETP"] },
  { key: "cool-coalition", includes: ["Cool Coalition"] },
  { key: "ccac", includes: ["CCAC"] },
  { key: "global-coal-to-clean-power", includes: ["Global Coal to Clean Power"] },
  { key: "fff", includes: ["Forest and Farm Facility"] },
  { key: "nydf", includes: ["New York Declaration on Forests"] },
  { key: "glasgow-forests-declaration", includes: ["Glasgow"] },
  { key: "ppca", includes: ["PPCA", "Powering Past Coal"] },
  { key: "4per1000", includes: ["4/1000 Initiative"] },
  { key: "a6ip", includes: ["Article 6 Implementation"] },
  { key: "isa", includes: ["International Solar Alliance"] },
  { key: "gfei", includes: ["Global Fuel Economy Initiative"] },
  { key: "global-methane-pledge", includes: ["Global Methane Pledge"] },
  { key: "ccich", includes: ["Cultural and Natural Heritage"] },
  { key: "asap", includes: ["Adaptation for Small"] },
  { key: "blue-growth-initiative", includes: ["Blue Growth Initiative"] },
  { key: "ico-coffee-task-force", includes: ["International Coffee Organization Coffee"] },
  { key: "subaru-nma", includes: ["SUBARU"] },
  { key: "globalabc", includes: ["Global Alliance for Buildings and Constr"] },
  // Treaties appear as ratification-date rows in the pre-refresh delivery
  // only; the 2026-09-30 C-008 sheet carries none. See TREATY_NAMES below.
  { key: "unfccc", includes: [] },
  { key: "kyoto-protocol", includes: [] },
  { key: "doha-amendment", includes: [] },
  { key: "paris-agreement", includes: [] },
];

function initiativeTargets() {
  const byKey = new Map();
  entitiesOf("C-008").forEach((entity) => {
    const attributes = entity.normalizedAttributes || {};
    const original = text(attributes["이니셔티브_이니셔티브명_원문"]);
    if (!original) return; // an actor row with no initiative link
    const ko = text(attributes["이니셔티브_이니셔티브명_국문"]);
    const haystack = `${original} ${ko}`;
    const rule = INITIATIVE_KEYS.find(
      (candidate) => candidate.includes.length > 0 && candidate.includes.some((needle) => haystack.includes(needle))
    );
    if (!rule) return;
    const entry =
      byKey.get(rule.key) ||
      { key: rule.key, elementIds: ["C-008"], names: new Set(), recordIds: new Set(), sourceUrls: new Set(), rowCount: 0 };
    entry.names.add(original);
    if (ko) entry.names.add(ko);
    // The parenthesised abbreviation inside the original name ("... (JETP)
    // with Viet Nam" → "JETP") is the short form a reader (and the timeline
    // lookup) most often uses.
    const abbreviation = original.match(/\(([A-Z][A-Za-z0-9./&-]{1,12})\)/u)?.[1];
    if (abbreviation) entry.names.add(abbreviation);
    entry.recordIds.add(entity.recordId);
    const url = text(attributes["출처_원문_URL"]);
    if (url) entry.sourceUrls.add(url);
    entry.rowCount += 1;
    byKey.set(rule.key, entry);
  });
  // V162: the 2026-09-30 delivery dropped C-008's per-row treaty-
  // ratification records (UNFCCC/Kyoto/the Doha amendment/Paris) - confirmed
  // absent by diffing against the pre-refresh ZIP (git show
  // bbbab1f:public/data/vietnam/v2/downloads/c-008.zip). These four names are
  // carried over from that pre-refresh delivery; the descriptions they label
  // are sourced, verified treaty facts, not something a live row re-checks,
  // so policyDescriptionsV153.test.ts exempts this kind from the "every name
  // is a name the delivery uses" contract instead of inventing a row.
  const TREATY_NAMES = {
    unfccc: ["기후변화협약(UNFCCC)"],
    "kyoto-protocol": ["교토의정서"],
    "doha-amendment": ["도하개정(교토의정서 2차 공약기간)"],
    "paris-agreement": ["파리협정"],
  };
  Object.entries(TREATY_NAMES).forEach(([key, names]) => {
    if (byKey.has(key)) return;
    byKey.set(key, { key, elementIds: ["C-008"], names: new Set(names), recordIds: new Set(), sourceUrls: new Set(), rowCount: 0 });
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

// V162: Circular 02/2022/TT-BTNMT is never its own C-010 row in either the
// pre- or post-refresh delivery - it is named only inside 08/2022/NĐ-CP's
// implementing instruments. The name below is carried over from the
// pre-refresh delivery (the composite label its old attribute row used);
// policyDescriptionsV153.test.ts exempts this key from the "every name is a
// name the delivery uses" contract for the same reason it exempts treaties.
if (!union.has("02-2022-tt-btnmt")) {
  union.set("02-2022-tt-btnmt", {
    key: "02-2022-tt-btnmt",
    elementIds: ["C-010"],
    names: ["LEP 제54 55조 + Decree 08/2022/ND-CP + Circular 02/2022/TT-BTNMT"],
    entryNames: ["LEP 제54 55조 + Decree 08/2022/ND-CP + Circular 02/2022/TT-BTNMT"],
    recordIds: [],
    sourceUrls: [],
    rowCount: 0,
  });
}

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
