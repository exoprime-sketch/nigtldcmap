#!/usr/bin/env node
/**
 * The V153 contract's `mapRole`, taken from the map index instead of kept by hand.
 *
 * Each element's detail screen decides from `mapRole` whether it shows a map
 * beside its primary chart. The value was written by hand when 42 layers were
 * registered, so V157's registration (60 layers, three targets moved off the map)
 * would have left 25 rows stating the opposite of what the map publishes - and
 * B-017 still saying "pending" although its boundary asset arrived.
 *
 * The rule is the one `publicVisualizationContractV153.test.ts` asserts: a layer
 * in `map-index.json` gets "beside-primary", everything else "none". A row the
 * typology already forced to "none" (V159's ⓪ status notes) is left alone.
 *
 * Usage: node scripts/v157/align-contract-map-roles-v157.mjs [--check]
 */
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

import {
  countryPublicDirV158,
  repoRootV158,
  resolveCountryIso3V158,
} from "../v158/country-context-v158.mjs";

const ROOT = repoRootV158(import.meta.dirname);
const argv = process.argv.slice(2);
const CHECK_ONLY = argv.includes("--check");
const COUNTRY = resolveCountryIso3V158({ argv });
const DATA = resolve(ROOT, countryPublicDirV158(ROOT, COUNTRY));

const CONTRACT_PATH = resolve(ROOT, "src/data/visualization/publicVisualizationContractV153.json");
const REPORT_PATH = resolve(ROOT, "reports/v157/contract-map-roles-v157.json");

const contract = JSON.parse(readFileSync(CONTRACT_PATH, "utf8"));
const mapIndex = JSON.parse(readFileSync(resolve(DATA, "map-index.json"), "utf8"));
const registered = new Set(
  mapIndex.layers
    .filter((layer) => layer.active !== false && layer.enabled !== false)
    .map((layer) => layer.elementId)
);

const changes = [];
const rows = contract.rows.map((row) => {
  // A status-note row shows no map at all; the typology owns that decision.
  if (row.archetype === "status-note") return row;
  const next = registered.has(row.elementId) ? "beside-primary" : "none";
  if (row.mapRole === next) return row;
  changes.push({ elementId: row.elementId, from: row.mapRole, to: next });
  return { ...row, mapRole: next };
});

const nextDocument = { ...contract, rows };
const text = `${JSON.stringify(nextDocument, null, 2)}\n`;
const changed = text !== readFileSync(CONTRACT_PATH, "utf8");
if (changed && !CHECK_ONLY) writeFileSync(CONTRACT_PATH, text, "utf8");

const summary = {
  schema: "contract-map-roles-v157",
  generatedAt: new Date().toISOString(),
  registeredLayerCount: registered.size,
  besidePrimaryCount: rows.filter((row) => row.mapRole === "beside-primary").length,
  changeCount: changes.length,
  changes,
  changed,
};
if (!CHECK_ONLY) writeFileSync(REPORT_PATH, `${JSON.stringify(summary, null, 2)}\n`, "utf8");
process.stdout.write(`${JSON.stringify({ type: "summary", ...summary, changes: undefined })}\n`);
if (CHECK_ONLY && changed) {
  process.stderr.write(`${JSON.stringify({ type: "error", reason: "MAP_ROLES_OUT_OF_DATE" })}\n`);
  process.exitCode = 1;
}
