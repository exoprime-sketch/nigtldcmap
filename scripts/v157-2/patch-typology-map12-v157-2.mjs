#!/usr/bin/env node
/**
 * A targeted patch to `datasetTypologyV159.json` for the 12 P8-2 map targets -
 * NOT a re-run of `scripts/v159/import-dataset-spec-v159.mjs`.
 *
 * That importer regenerates every derived V159 file from the xlsx + the assignment
 * table together. Running it here (2026-09-30) turned out to touch far more than
 * these 12 rows and broke in a way worth recording: `useCasesV159.json`'s catalog
 * indicator mapping came back "0/521" and flipped ~490 entries from `"mapped":
 * "exact"` to `"mapped": "unmapped"` - a pre-existing pipeline problem unrelated to
 * this branch, not something to paper over by hand-fixing its output. That full
 * regeneration was reverted; only `docs/plan/V159_데이터유형화_명세.md` §4 (source of
 * truth for the typology table, per the importer's own header comment) carries the
 * twelve rows' real edit, made by hand there.
 *
 * This script makes `datasetTypologyV159.json` agree with that edited table for
 * exactly those 12 rows and nothing else, reproducing the importer's own field
 * derivation (scripts/v159/import-dataset-spec-v159.mjs's `typology` map) so the two
 * files cannot silently drift apart. It carries `variant`, `flags.region`, the
 * display type and structure (with their labels) and the VNM/BGD coverage cells;
 * status and specCaseCount are untouched. A display-type change is copied into
 * `datasetCardSpecV159.json` too (the importer derives it from the typology); the
 * V153 contract follows with `scripts/v159/align-contract-typology-v159.mjs`.
 * `flags.categorical` is left alone: B-002 is genuinely categorical regardless of
 * whether its chart wording literally contains the substring "범주형".
 *
 * V157-2 (2026-10-03, V162 입고): A-022 ①S1 → ②S2 (power-corporation values),
 * VNM coverage ✕ → ○ for B-024 · B-035 · B-036 (province values delivered).
 *
 * Usage: node scripts/v157-2/patch-typology-map12-v157-2.mjs [--check]
 */
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

import { repoRootV158 } from "../v158/country-context-v158.mjs";

const ROOT = repoRootV158(import.meta.dirname);
const SPEC_MD = resolve(ROOT, "docs/plan/V159_데이터유형화_명세.md");
const TYPOLOGY_JSON = resolve(ROOT, "src/data/spec/datasetTypologyV159.json");
const CARD_SPEC_JSON = resolve(ROOT, "src/data/spec/datasetCardSpecV159.json");
const CHECK_ONLY = process.argv.includes("--check");

const MAP12_IDS = new Set([
  "A-013", "A-022", "B-002", "B-024", "B-035", "B-036",
  "B-044", "B-046", "B-047", "C-003", "C-006", "C-017",
]);

/** Exactly scripts/v159/import-dataset-spec-v159.mjs's own row parser. */
const DISPLAY_TYPES = {
  "①": { code: "U1", label: "국가 수준·추세" },
  "②": { code: "U2", label: "지역·입지" },
  "③": { code: "U3", label: "기술별 비교" },
  "④": { code: "U4", label: "시설·기관·인프라 위치" },
  "⑤": { code: "U5", label: "사업·재원" },
  "⑥": { code: "U6", label: "제도·규제·리스크" },
};
function readTypologyRow(elementId) {
  const lines = readFileSync(SPEC_MD, "utf8").split(/\r?\n/);
  const line = lines.find((row) => row.startsWith(`| ${elementId} |`));
  if (!line) throw new Error(`${elementId}: row not found in ${SPEC_MD}`);
  const cells = line.split("|").slice(1, -1).map((cell) => cell.trim());
  const [, , displayRaw, structureRaw, region, , vnm, bgd, , , variant] = cells;
  const type = DISPLAY_TYPES[displayRaw.slice(0, 1)];
  if (!type) throw new Error(`${elementId}: unknown display type ${displayRaw}`);
  return { region: region === "지역", variant, type, structure: structureRaw.slice(0, 2), vnm, bgd };
}

// Both files are checked in with CRLF line ends; keep them.
const readJson = (path) => JSON.parse(readFileSync(path, "utf8"));
const writeCrlf = (path, value) => writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`.replace(/\n/gu, "\r\n"), "utf8");
const typology = readJson(TYPOLOGY_JSON);
const cardSpec = readJson(CARD_SPEC_JSON);
const changes = [];

for (const row of typology.rows) {
  if (!MAP12_IDS.has(row.elementId)) continue;
  const table = readTypologyRow(row.elementId);
  const snapshot = () => ({
    region: row.flags.region,
    variant: row.variant,
    displayType: row.displayType,
    structure: row.structure,
    coverage: { ...row.coverage },
  });
  const before = snapshot();
  row.flags.region = table.region;
  row.variant = table.variant;
  row.displayType = table.type.code;
  row.displayTypeLabel = table.type.label;
  row.specDisplayType = table.type.code;
  row.structure = table.structure;
  row.structureLabel = typology.structures[table.structure];
  row.coverage = { VNM: table.vnm, BGD: table.bgd };
  const after = snapshot();
  if (JSON.stringify(before) !== JSON.stringify(after)) changes.push({ elementId: row.elementId, before, after });
  const card = cardSpec.rows.find((item) => item.elementId === row.elementId);
  if (card) card.displayType = row.displayType;
}

if (CHECK_ONLY && changes.length) {
  process.stdout.write(`${JSON.stringify({ type: "summary", schema: "patch-typology-map12-v157-2", outOfDate: changes.map((c) => c.elementId) })}\n`);
  process.exit(1);
}
if (!CHECK_ONLY) {
  writeCrlf(TYPOLOGY_JSON, typology);
  writeCrlf(CARD_SPEC_JSON, cardSpec);
}

process.stdout.write(
  `${JSON.stringify({ type: "summary", schema: "patch-typology-map12-v157-2", changed: changes.length, changes, wrote: !CHECK_ONLY })}\n`
);
