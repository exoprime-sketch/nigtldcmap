#!/usr/bin/env node
/**
 * V162: the platform's policy and initiative descriptions
 * (src/data/visualization/policyDescriptionsV153.json) as each platform
 * country's screens show them. A description line is common to every country
 * that shows the entry, so the same rules as the spec text apply
 * (country-neutral-v162.mjs): a country list becomes a neutral count, an aside
 * about another country is dropped, and a line that is another country's own
 * is shown to that country only. The descriptions file itself is not edited
 * (its sha256 is a test baseline); the views go to
 * src/data/visualization/policyDescriptionViewsV162.json, only where a
 * country's lines differ.
 *
 *   node scripts/v162/build-policy-country-views-v162.mjs [--check]
 */
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { loadCountryNamesV162, makeCountryViewsV162 } from "./country-neutral-v162.mjs";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const SOURCE = resolve(ROOT, "src/data/visualization/policyDescriptionsV153.json");
const OUT = resolve(ROOT, "src/data/visualization/policyDescriptionViewsV162.json");
const CHECK = process.argv.includes("--check");

const names = loadCountryNamesV162(ROOT);
const views = makeCountryViewsV162(names);
const viewers = names.platform.map((row) => row.iso3);
const entries = JSON.parse(readFileSync(SOURCE, "utf8")).entries || [];
const out = { schemaVersion: "v162-policy-country-views-1", note: "policyDescriptionsV153.json의 설명 줄을 나라별 화면으로 본 것(다른 줄만). scripts/v162/build-policy-country-views-v162.mjs가 생성.", entries: {} };
const changes = [];
for (const entry of entries) {
  for (const viewer of viewers) {
    const lines = [];
    for (const line of entry.description || []) {
      const result = views.viewText(line, viewer);
      for (const change of result.changes) changes.push({ key: entry.key, viewer, ...change });
      if (result.text) lines.push(result.text);
    }
    if (JSON.stringify(lines) !== JSON.stringify(entry.description || [])) (out.entries[entry.key] ??= {})[viewer] = lines;
  }
}
const next = `${JSON.stringify(out, null, 2)}\n`;
if (CHECK) {
  const current = existsSync(OUT) ? readFileSync(OUT, "utf8").replace(/\r\n/g, "\n") : "";
  if (current !== next) {
    console.error("stale: src/data/visualization/policyDescriptionViewsV162.json");
    process.exit(1);
  }
  console.log("policy country views up to date");
} else {
  writeFileSync(OUT, next);
  console.log(JSON.stringify({ type: "summary", entries: Object.keys(out.entries).length, changes }, null, 1));
}
