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
 * files cannot silently drift apart. It changes only `variant` and `flags.region` -
 * displayType, structure, status, coverage and specCaseCount are untouched because
 * the twelve rows' assignment table cells for those columns did not change.
 * `flags.categorical` is left alone too: B-002 is genuinely categorical regardless of
 * whether its new chart-wording literally contains the substring "범주형".
 *
 * Usage: node scripts/v157-2/patch-typology-map12-v157-2.mjs [--check]
 */
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

import { repoRootV158 } from "../v158/country-context-v158.mjs";

const ROOT = repoRootV158(import.meta.dirname);
const SPEC_MD = resolve(ROOT, "docs/plan/V159_데이터유형화_명세.md");
const TYPOLOGY_JSON = resolve(ROOT, "src/data/spec/datasetTypologyV159.json");
const CHECK_ONLY = process.argv.includes("--check");

const MAP12_IDS = new Set([
  "A-013", "A-022", "B-002", "B-024", "B-035", "B-036",
  "B-044", "B-046", "B-047", "C-003", "C-006", "C-017",
]);

/** Exactly scripts/v159/import-dataset-spec-v159.mjs's own row parser. */
function readTypologyRow(elementId) {
  const lines = readFileSync(SPEC_MD, "utf8").split(/\r?\n/);
  const line = lines.find((row) => row.startsWith(`| ${elementId} |`));
  if (!line) throw new Error(`${elementId}: row not found in ${SPEC_MD}`);
  const cells = line.split("|").slice(1, -1).map((cell) => cell.trim());
  const [, , , , region, , , , , , variant] = cells;
  return { region: region === "지역", variant };
}

const typology = JSON.parse(readFileSync(TYPOLOGY_JSON, "utf8"));
const changes = [];

for (const row of typology.rows) {
  if (!MAP12_IDS.has(row.elementId)) continue;
  const fromTable = readTypologyRow(row.elementId);
  const before = { region: row.flags.region, variant: row.variant };
  if (row.flags.region !== fromTable.region || row.variant !== fromTable.variant) {
    changes.push({ elementId: row.elementId, before, after: fromTable });
  }
  row.flags.region = fromTable.region;
  row.variant = fromTable.variant;
}

if (changes.length !== MAP12_IDS.size) {
  const changed = new Set(changes.map((c) => c.elementId));
  const untouched = [...MAP12_IDS].filter((id) => !changed.has(id));
  if (untouched.length) {
    process.stdout.write(`${JSON.stringify({ type: "note", untouchedAlreadyMatching: untouched })}\n`);
  }
}

if (!CHECK_ONLY) {
  writeFileSync(TYPOLOGY_JSON, `${JSON.stringify(typology, null, 2)}\n`, "utf8");
}

process.stdout.write(
  `${JSON.stringify({ type: "summary", schema: "patch-typology-map12-v157-2", changed: changes.length, changes, wrote: !CHECK_ONLY })}\n`
);
