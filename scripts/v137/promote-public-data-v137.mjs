#!/usr/bin/env node
/**
 * Promote a verified candidate data tree into the repository.
 *
 * Refuses to copy anything until the tree it is about to publish matches the
 * fingerprint recorded for the candidate that was reviewed, and re-reads the
 * result afterwards. A promotion that silently ships a different tree than the
 * one the QA measured is the failure this guards against.
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
import { join, relative, resolve, sep } from "node:path";

const ROOT = resolve(import.meta.dirname, "../..");
const argv = process.argv.slice(2);
const opt = (name, fallback) => {
  const index = argv.indexOf(name);
  return index < 0 ? fallback : argv[index + 1];
};
const FROM = resolve(ROOT, opt("--from", ".staging/final/public/data/vietnam/v2"));
const TO = resolve(ROOT, opt("--to", "public/data/vietnam/v2"));
const FINGERPRINT = resolve(
  ROOT,
  opt("--fingerprint", "reports/final-data-integration/CANDIDATE_FINGERPRINT_V137.json")
);
const APPLY = argv.includes("--apply");

const sha256 = (buffer) => createHash("sha256").update(buffer).digest("hex");

/** The same walk and the same digest the candidate fingerprint was built with. */
function fileDigests(root) {
  const digests = new Map();
  const walk = (dir) => {
    for (const entry of readdirSync(dir, { withFileTypes: true }).sort((a, b) =>
      a.name < b.name ? -1 : 1
    )) {
      const full = join(dir, entry.name);
      const rel = relative(root, full).split(sep).join("/");
      if (entry.isDirectory()) walk(full);
      else if (entry.isFile()) digests.set(rel, sha256(readFileSync(full)));
    }
  };
  walk(root);
  return digests;
}

function treeFingerprint(digests) {
  const hash = createHash("sha256");
  for (const key of [...digests.keys()].sort()) {
    hash.update(key);
    hash.update(digests.get(key));
  }
  return hash.digest("hex");
}

/** Mirror `from` onto `to`: copy what differs, remove what is no longer there. */
function mirror(from, to) {
  mkdirSync(to, { recursive: true });
  const wanted = new Set();
  const walk = (sourceDir, targetDir) => {
    mkdirSync(targetDir, { recursive: true });
    for (const entry of readdirSync(sourceDir, { withFileTypes: true })) {
      const source = join(sourceDir, entry.name);
      const target = join(targetDir, entry.name);
      wanted.add(relative(to, target).split(sep).join("/"));
      if (entry.isDirectory()) walk(source, target);
      // copyFileSync, not cpSync: cpSync segfaults this Node on this tree, the
      // same crash the candidate assembly already works around.
      else if (entry.isFile()) copyFileSync(source, target);
    }
  };
  walk(from, to);
  const prune = (dir) => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const full = join(dir, entry.name);
      const rel = relative(to, full).split(sep).join("/");
      if (entry.isDirectory()) {
        prune(full);
        if (readdirSync(full).length === 0) rmSync(full, { recursive: true });
      } else if (!wanted.has(rel)) {
        rmSync(full);
      }
    }
  };
  prune(to);
}

const expected = JSON.parse(readFileSync(FINGERPRINT, "utf8"));
const source = fileDigests(FROM);
const sourceFingerprint = treeFingerprint(source);
const matchesReviewed =
  sourceFingerprint === expected.data.treeSha256 && source.size === expected.data.fileCount;

const before = existsSync(TO) ? fileDigests(TO) : new Map();
const result = {
  schema: "nigt-public-data-promotion-1",
  generatedAt: new Date().toISOString(),
  from: relative(ROOT, FROM).split(sep).join("/"),
  to: relative(ROOT, TO).split(sep).join("/"),
  reviewedFingerprint: expected.data.treeSha256,
  reviewedFileCount: expected.data.fileCount,
  sourceFingerprint,
  sourceFileCount: source.size,
  matchesReviewedCandidate: matchesReviewed,
  before: { fingerprint: treeFingerprint(before), fileCount: before.size },
  applied: false,
};

if (!matchesReviewed) {
  result.status = "REFUSED";
  result.reason =
    "the tree to promote is not the tree the candidate fingerprint was taken from";
  console.log(JSON.stringify(result, null, 2));
  process.exit(1);
}

if (APPLY) {
  mirror(FROM, TO);
  const after = fileDigests(TO);
  result.applied = true;
  result.after = { fingerprint: treeFingerprint(after), fileCount: after.size };
  result.status =
    result.after.fingerprint === sourceFingerprint && after.size === source.size
      ? "PASS"
      : "FAIL";
  const largest = [...after.keys()]
    .map((rel) => ({ rel, bytes: statSync(join(TO, rel)).size }))
    .sort((a, b) => b.bytes - a.bytes)[0];
  result.largestFile = largest;
  result.largestFileUnder100MiB = largest.bytes < 100 * 1024 * 1024;
} else {
  result.status = "DRY_RUN";
}

mkdirSync(resolve(ROOT, "reports/final-data-integration"), { recursive: true });
writeFileSync(
  resolve(ROOT, "reports/final-data-integration/public-data-promotion-v137.json"),
  `${JSON.stringify(result, null, 2)}\n`,
  "utf8"
);
console.log(JSON.stringify(result, null, 2));
process.exit(result.status === "PASS" || result.status === "DRY_RUN" ? 0 : 1);
