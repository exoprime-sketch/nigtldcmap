#!/usr/bin/env node
/**
 * V153: what a pipeline run in a staging tree would change in the published
 * tree, file by file, before anything is promoted.
 *
 * The V137 promotion replaces the whole tree, but the published tree carries
 * assets later steps added on top of the pipeline (the 34-province geometry,
 * the home card summaries, the dataset directory). Promoting element by element
 * needs an exact list of what differs, and catalog.json - one file for 152
 * elements - needs the diff at the element/key level to tell an intended
 * change (technologyIds) from an accidental one.
 *
 *   node scripts/v153/diff-staging-v153.mjs [--from .staging/final/public/data/vietnam/v2]
 *       [--to public/data/vietnam/v2] [--out reports/v153/staging-diff-v153.json]
 */
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";

const ROOT = resolve(import.meta.dirname, "../..");
const argv = process.argv.slice(2);
const opt = (name, fallback) => {
  const index = argv.indexOf(name);
  return index < 0 ? fallback : argv[index + 1];
};
const FROM = resolve(ROOT, opt("--from", ".staging/final/public/data/vietnam/v2"));
const TO = resolve(ROOT, opt("--to", "public/data/vietnam/v2"));
const OUT = resolve(ROOT, opt("--out", "reports/v153/staging-diff-v153.json"));

const sha = (buffer) => createHash("sha256").update(buffer).digest("hex");

function walk(root, out = new Map(), base = root) {
  if (!existsSync(root)) return out;
  for (const entry of readdirSync(root, { withFileTypes: true })) {
    const full = join(root, entry.name);
    if (entry.isDirectory()) walk(full, out, base);
    else if (entry.isFile()) out.set(relative(base, full).split("\\").join("/"), full);
  }
  return out;
}

const fromFiles = walk(FROM);
const toFiles = walk(TO);
const onlyInStaging = [...fromFiles.keys()].filter((path) => !toFiles.has(path)).sort();
const onlyInPublished = [...toFiles.keys()].filter((path) => !fromFiles.has(path)).sort();
const changed = [];
for (const path of [...fromFiles.keys()].sort()) {
  if (!toFiles.has(path)) continue;
  const a = readFileSync(fromFiles.get(path));
  const b = readFileSync(toFiles.get(path));
  if (sha(a) !== sha(b)) changed.push({ path, stagingBytes: a.length, publishedBytes: b.length });
}

/** catalog.json: per element, which keys differ. */
function catalogDiff() {
  const a = fromFiles.get("catalog.json");
  const b = toFiles.get("catalog.json");
  if (!a || !b) return null;
  const staging = JSON.parse(readFileSync(a, "utf8"));
  const published = JSON.parse(readFileSync(b, "utf8"));
  const byId = (rows) => new Map(rows.map((row) => [row.elementId, row]));
  const left = byId(staging.elements || []);
  const right = byId(published.elements || []);
  const elements = [];
  for (const [id, row] of left) {
    const other = right.get(id);
    if (!other) {
      elements.push({ elementId: id, keys: ["<missing in published>"] });
      continue;
    }
    const keys = [...new Set([...Object.keys(row), ...Object.keys(other)])].filter(
      (key) => JSON.stringify(row[key]) !== JSON.stringify(other[key])
    );
    if (keys.length) elements.push({ elementId: id, keys: keys.sort() });
  }
  const topLevel = [...new Set([...Object.keys(staging), ...Object.keys(published)])].filter(
    (key) => key !== "elements" && JSON.stringify(staging[key]) !== JSON.stringify(published[key])
  );
  const keyCounts = {};
  for (const item of elements) for (const key of item.keys) keyCounts[key] = (keyCounts[key] || 0) + 1;
  return { topLevel, elementCount: elements.length, keyCounts, elements };
}

const report = {
  schema: "v153-staging-diff-1",
  from: relative(ROOT, FROM).split("\\").join("/"),
  to: relative(ROOT, TO).split("\\").join("/"),
  summary: {
    stagingFiles: fromFiles.size,
    publishedFiles: toFiles.size,
    changed: changed.length,
    onlyInStaging: onlyInStaging.length,
    onlyInPublished: onlyInPublished.length,
  },
  changed,
  onlyInStaging,
  onlyInPublished,
  catalog: catalogDiff(),
};
mkdirSync(dirname(OUT), { recursive: true });
writeFileSync(OUT, `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify(report.summary));
if (report.catalog) {
  console.log(`catalog: ${report.catalog.elementCount} elements differ; keys ${JSON.stringify(report.catalog.keyCounts)}; top-level ${JSON.stringify(report.catalog.topLevel)}`);
}
for (const row of changed) console.log(`changed  ${row.path}`);
for (const path of onlyInStaging) console.log(`staging+ ${path}`);
for (const path of onlyInPublished) console.log(`public+  ${path}`);
