#!/usr/bin/env node
/**
 * Apply a staged data tree onto the published one, without pruning the assets
 * the ETL chain does not produce.
 *
 * `promote-public-data-v137.mjs` mirrors a tree: files the source lacks are
 * deleted. That is right for a tree the whole pipeline produced, and wrong here -
 * the ETL chain does not write the spatial builders' output
 * (`geometry/**`, `spatial/**`, V151/V155), the dataset directory or the card
 * summaries, so mirroring a chain tree would delete registered map assets.
 *
 * So: copy everything the staging tree holds, delete only the shard files it
 * replaced (packs are content-hash named, so a stale one is dead weight the
 * runtime index no longer references), and keep the rest. The builders that own
 * the preserved files are re-run afterwards by the runbook.
 */
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { createHash } from "node:crypto";
import { dirname, join, relative, resolve, sep } from "node:path";

const ROOT = resolve(import.meta.dirname, "../..");
const argv = process.argv.slice(2);
const opt = (name, fallback) => {
  const index = argv.indexOf(name);
  return index < 0 ? fallback : argv[index + 1];
};
const FROM = resolve(ROOT, opt("--from", ".staging/v156/public/data/vietnam/v2"));
const TO = resolve(ROOT, opt("--to", "public/data/vietnam/v2"));
const OUT = resolve(ROOT, opt("--report", "reports/v156/apply-staged-data-v156.json"));
const APPLY = argv.includes("--apply");

/**
 * Paths under the published tree that the ETL chain never writes. They are owned
 * by the spatial builders (V151/V155), the dataset directory builder (V150) and
 * the card summary builder (V140), and they stay untouched here.
 */
const PRESERVE_PREFIXES = ["geometry/", "spatial/"];
const PRESERVE_FILES = ["dataset-directory.json", "home/card-summaries-v140.json"];
/** Content-hash named shards: a file the new tree does not carry is stale. */
const PRUNABLE_PREFIXES = ["packs/"];

const sha256 = (path) => createHash("sha256").update(readFileSync(path)).digest("hex");

function walk(root) {
  const out = new Map();
  if (!existsSync(root)) return out;
  const visit = (dir) => {
    for (const entry of readdirSync(dir, { withFileTypes: true }).sort((left, right) =>
      left.name < right.name ? -1 : 1
    )) {
      const full = join(dir, entry.name);
      if (entry.isDirectory()) visit(full);
      else if (entry.isFile()) out.set(relative(root, full).split(sep).join("/"), full);
    }
  };
  visit(root);
  return out;
}

const source = walk(FROM);
const target = walk(TO);
const preserved = [];
const prunable = [];
const kept = [];
for (const rel of target.keys()) {
  if (source.has(rel)) continue;
  if (PRESERVE_PREFIXES.some((prefix) => rel.startsWith(prefix)) || PRESERVE_FILES.includes(rel)) {
    preserved.push(rel);
  } else if (PRUNABLE_PREFIXES.some((prefix) => rel.startsWith(prefix))) {
    prunable.push(rel);
  } else {
    // Anything else is unexplained: report it and keep it rather than delete.
    kept.push(rel);
  }
}

const written = [];
const unchanged = [];
for (const [rel, path] of source) {
  const destination = join(TO, rel);
  const same = existsSync(destination) && sha256(destination) === sha256(path);
  if (same) {
    unchanged.push(rel);
    continue;
  }
  written.push(rel);
  if (!APPLY) continue;
  mkdirSync(dirname(destination), { recursive: true });
  copyFileSync(path, destination);
}
if (APPLY) for (const rel of prunable) rmSync(join(TO, rel));

const report = {
  schemaVersion: "v156",
  generator: "scripts/v156/apply-staged-data-v156.mjs",
  generatedAt: new Date().toISOString(),
  from: relative(ROOT, FROM).split(sep).join("/"),
  to: relative(ROOT, TO).split(sep).join("/"),
  applied: APPLY,
  totals: {
    sourceFiles: source.size,
    targetFilesBefore: target.size,
    written: written.length,
    unchanged: unchanged.length,
    prunedStaleShards: prunable.length,
    preserved: preserved.length,
    keptUnexplained: kept.length,
  },
  preserved,
  prunedStaleShards: prunable,
  keptUnexplained: kept,
  written: written.slice(0, 200),
};
if (APPLY) {
  const after = walk(TO);
  report.targetFilesAfter = after.size;
  report.largestFile = [...after.keys()]
    .map((rel) => ({ rel, bytes: statSync(join(TO, rel)).size }))
    .sort((left, right) => right.bytes - left.bytes)[0];
}
mkdirSync(dirname(OUT), { recursive: true });
writeFileSync(OUT, `${JSON.stringify(report, null, 2)}\n`, "utf8");
console.log(
  JSON.stringify({
    type: "summary",
    status: kept.length === 0 ? (APPLY ? "APPLIED" : "DRY_RUN") : "UNEXPLAINED_TARGET_FILES",
    ...report.totals,
    report: relative(ROOT, OUT).split(sep).join("/"),
  })
);
if (kept.length > 0) {
  console.error(JSON.stringify({ type: "kept-unexplained", files: kept.slice(0, 20) }));
  process.exitCode = 1;
}
