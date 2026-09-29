#!/usr/bin/env node
/**
 * V160 core-first data: information tiers and the map's default layers.
 *
 *   docs/plan/V160_핵심정보_단순화_기획.md §3  -> src/data/spec/informationTiersV160.json
 *   core tiers ② ④ ⑤ with an active layer     -> src/data/map/mapDefaultLayersV160.json
 *
 * The six home questions (homeQuestionsV160.json) were withdrawn with the
 * home restore of 2026-09-29 (the home is the featured-data layout again).
 *
 * Tiers are read from the plan's table, never typed into code.
 *
 * Usage: node scripts/v160/build-core-first-v160.mjs [--check]
 */
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const CHECK = process.argv.includes("--check");
const PLAN = resolve(ROOT, "docs/plan/V160_핵심정보_단순화_기획.md");
const TYPOLOGY = resolve(ROOT, "src/data/spec/datasetTypologyV159.json");
const OUT_TIERS = resolve(ROOT, "src/data/spec/informationTiersV160.json");
const MAP_INDEX = resolve(ROOT, "public/data/vietnam/v2/map-index.json");
const OUT_MAP_DEFAULTS = resolve(ROOT, "src/data/map/mapDefaultLayersV160.json");
// Plan §1.4: the map opens on the core ② ④ ⑤ datasets that have a layer.
const MAP_DEFAULT_TYPES = new Set(["U2", "U4", "U5"]);

const TIER_BY_LABEL = { 핵심: "core", 보조: "support", 참고: "reference", "—(비공개)": "hidden" };
const TYPE_BY_MARK = { "①": "U1", "②": "U2", "③": "U3", "④": "U4", "⑤": "U5", "⑥": "U6", "⓪": "U0" };

function readTiers() {
  const text = readFileSync(PLAN, "utf8");
  const rows = [];
  let section = null;
  for (const line of text.split(/\r?\n/u)) {
    const heading = line.match(/^### ([①②③④⑤⑥⓪]) (.+)$/u);
    if (heading) section = { mark: heading[1], label: heading[2].trim() };
    const list = line.match(/^- \*\*(핵심|보조|참고|—\(비공개\))\*\*\((\d+)\): (.*)$/u);
    if (!list || !section) continue;
    const ids = [...list[3].matchAll(/\b([A-E]-\d{3})\b/gu)].map((match) => match[1]);
    if (ids.length !== Number(list[2])) throw new Error(`${section.label} ${list[1]}: ${ids.length} ids, heading says ${list[2]}`);
    for (const elementId of ids) {
      rows.push({
        elementId,
        tier: TIER_BY_LABEL[list[1]],
        displayType: TYPE_BY_MARK[section.mark],
        reason: `기획 V160 §3 ${section.mark} ${section.label} — ${list[1].replace(/[—()]/gu, "")}`,
      });
    }
  }
  return rows.sort((a, b) => a.elementId.localeCompare(b.elementId));
}

const tiers = readTiers();
const failures = [];
if (tiers.length !== 152) failures.push(`tiers ${tiers.length} != 152`);
const typology = new Map(JSON.parse(readFileSync(TYPOLOGY, "utf8")).rows.map((row) => [row.elementId, row]));
for (const row of tiers) {
  const type = typology.get(row.elementId);
  if (!type) failures.push(`${row.elementId}: not in typology`);
  // The plan groups by the spec's own type; ⓪ elements stay hidden.
  if (type && row.tier === "hidden" && type.displayType !== "U0") failures.push(`${row.elementId}: hidden but not ⓪`);
  if (type && type.displayType === "U0" && row.tier !== "hidden") failures.push(`${row.elementId}: ⓪ but tier ${row.tier}`);
}
const activeLayers = new Set(JSON.parse(readFileSync(MAP_INDEX, "utf8")).layers.filter((layer) => layer.active !== false && layer.enabled !== false).map((layer) => layer.elementId));
const mapDefaults = tiers.filter((row) => row.tier === "core" && MAP_DEFAULT_TYPES.has(row.displayType) && activeLayers.has(row.elementId)).map((row) => row.elementId);

const outputs = [
  [OUT_TIERS, { schemaVersion: "v160-information-tiers-1", source: "docs/plan/V160_핵심정보_단순화_기획.md §3", rows: tiers }],
  [OUT_MAP_DEFAULTS, { schemaVersion: "v160-map-default-layers-1", rule: "core tier · display type ② ④ ⑤ · active layer in map-index.json (map-index unchanged)", defaultElementIds: mapDefaults }],
];
if (failures.length) {
  console.error(failures.join("\n"));
  process.exit(1);
}
if (CHECK) {
  const stale = outputs.filter(([path, value]) => readFileSync(path, "utf8").replace(/\r\n/gu, "\n") !== `${JSON.stringify(value, null, 2)}\n`);
  if (stale.length) {
    console.error(`stale: ${stale.map(([path]) => path).join(", ")}`);
    process.exit(1);
  }
  console.log("core-first v160 data up to date");
} else {
  for (const [path, value] of outputs) writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`);
  const count = (tier) => tiers.filter((row) => row.tier === tier).length;
  console.log(JSON.stringify({ core: count("core"), support: count("support"), reference: count("reference"), hidden: count("hidden"), mapDefaults: mapDefaults.length }));
}
