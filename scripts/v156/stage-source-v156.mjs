#!/usr/bin/env node
/**
 * Stage one delivery folder as the ETL's read-only source tree.
 *
 * The delivery arrives as `베트남데이터/<YYYYMMDD>/` with one workbook per
 * element code, plus whatever the editing tools left behind: `~$…xlsx` lock
 * files and a `._DAV/` directory. The ETL globs `*.xlsx` in the directory it is
 * pointed at and does not descend, so a lock file would be read as a workbook.
 * This copies only the adopted files into `_source/vietnam/<version>/workbooks/`
 * and writes a manifest that states, per file, what was adopted and why.
 *
 * Duplicate codes: a `_수정안` (revision) file supersedes the plain one. Any
 * other duplicate is reported and nothing is adopted for that code - picking
 * one would be a data decision this script is not allowed to make.
 *
 * `--hold` keeps an element's new workbook out of the staged tree on purpose,
 * because a delivery whose shape the current screens and contracts cannot read
 * would publish less than what is live. A held element is staged from
 * `--carry-from` (the delivery that produced the published tree) so that its
 * published values stay exactly as they are: the ETL's own fallback reaches
 * further back, to the V124 ZIP, which for D-018 no longer holds the two
 * reviewed activity sites and fails the build. Every held code is listed in the
 * manifest with its reason and the file it was staged from, so a hold is never
 * silent.
 */
import { createHash } from "node:crypto";
import {
  copyFileSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { basename, resolve } from "node:path";

const ROOT = resolve(import.meta.dirname, "../..");
const argv = process.argv.slice(2);
const opt = (name, fallback) => {
  const index = argv.indexOf(name);
  return index < 0 ? fallback : argv[index + 1];
};
const SOURCE = opt("--source", "베트남데이터/20260922");
const VERSION = opt("--version", "v156");
const HELD = new Set(
  (opt("--hold", "") || "")
    .split(",")
    .map((code) => code.trim().toUpperCase())
    .filter(Boolean)
);
const HOLD_REASON = opt("--hold-reason", "구조 변경으로 현행 화면·계약이 읽지 못함(이전 입고분 유지)");
/** The delivery the published tree was built from; held codes come from here. */
const CARRY_FROM = opt("--carry-from", "베트남데이터/file");
const DELIVERED_AT = opt("--delivered-at", basename(SOURCE));
const OUT_ROOT = resolve(ROOT, "_source/vietnam", VERSION);
const WORKBOOKS = resolve(OUT_ROOT, "workbooks");

const CODE = /^([A-E]-\d{3})(?:_(.*))?\.(xlsx|geojson)$/u;
const sha256 = (path) => createHash("sha256").update(readFileSync(path)).digest("hex");

const sourceDir = resolve(ROOT, SOURCE);
const entries = readdirSync(sourceDir, { withFileTypes: true });
const skipped = [];
const candidates = [];
for (const entry of entries) {
  const name = entry.name;
  if (!entry.isFile()) {
    skipped.push({ name, reason: entry.isDirectory() ? "directory" : "not-a-file" });
    continue;
  }
  if (name.startsWith("~$")) {
    skipped.push({ name, reason: "office-lock-file" });
    continue;
  }
  const match = CODE.exec(name);
  if (!match) {
    skipped.push({ name, reason: "no-element-code" });
    continue;
  }
  const path = resolve(sourceDir, name);
  const stat = statSync(path);
  candidates.push({
    name,
    elementId: match[1],
    title: match[2] || "",
    kind: match[3] === "geojson" ? "geometry" : "workbook",
    revision: /_수정안(?:\.|$)/u.test(name),
    bytes: stat.size,
    modifiedAt: stat.mtime.toISOString(),
    sha256: sha256(path),
  });
}

/** Group by code and kind, so a workbook and its geometry do not collide. */
const groups = new Map();
for (const row of candidates) {
  const key = `${row.elementId}:${row.kind}`;
  groups.set(key, [...(groups.get(key) || []), row]);
}

const adopted = [];
const superseded = [];
const undecided = [];
const held = [];
for (const [, rows] of [...groups].sort(([left], [right]) => left.localeCompare(right))) {
  if (HELD.has(rows[0].elementId)) {
    for (const row of rows) held.push({ ...row, adoption: "held", reason: HOLD_REASON });
    continue;
  }

  if (rows.length === 1) {
    adopted.push({ ...rows[0], adoption: "sole-file" });
    continue;
  }
  const revisions = rows.filter((row) => row.revision);
  if (revisions.length === 1) {
    adopted.push({ ...revisions[0], adoption: "revision-supersedes" });
    for (const row of rows.filter((row) => !row.revision)) {
      superseded.push({ ...row, adoption: "superseded-by-revision", supersededBy: revisions[0].name });
    }
    continue;
  }
  // Two files for one code with no revision marker: report, adopt neither.
  for (const row of rows) undecided.push({ ...row, adoption: "undecided-duplicate" });
}

rmSync(WORKBOOKS, { recursive: true, force: true });
mkdirSync(WORKBOOKS, { recursive: true });
for (const row of adopted) copyFileSync(resolve(sourceDir, row.name), resolve(WORKBOOKS, row.name));

/** Held codes are staged from the previous delivery, one workbook per code. */
const carried = [];
const heldWithoutPrevious = [];
if (held.length > 0) {
  const carryDir = resolve(ROOT, CARRY_FROM);
  const byCode = new Map();
  for (const name of readdirSync(carryDir)) {
    if (name.startsWith("~$")) continue;
    const match = CODE.exec(name);
    if (!match || match[3] !== "xlsx") continue;
    byCode.set(match[1], [...(byCode.get(match[1]) || []), name]);
  }
  for (const elementId of [...new Set(held.map((row) => row.elementId))].sort()) {
    const names = (byCode.get(elementId) || []).sort();
    if (names.length !== 1) {
      heldWithoutPrevious.push({ elementId, candidates: names });
      continue;
    }
    const name = names[0];
    const path = resolve(carryDir, name);
    const stat = statSync(path);
    copyFileSync(path, resolve(WORKBOOKS, name));
    carried.push({
      name,
      elementId,
      kind: "workbook",
      adoption: "previous-delivery",
      from: CARRY_FROM,
      bytes: stat.size,
      modifiedAt: stat.mtime.toISOString(),
      sha256: sha256(path),
    });
  }
}

const workbookCodes = new Set(adopted.filter((row) => row.kind === "workbook").map((row) => row.elementId));
const manifest = {
  schemaVersion: "v156",
  generator: "scripts/v156/stage-source-v156.mjs",
  generatedAt: new Date().toISOString(),
  source: { directory: SOURCE, deliveredAt: DELIVERED_AT },
  staged: { workbooks: `_source/vietnam/${VERSION}/workbooks` },
  totals: {
    entries: entries.length,
    adopted: adopted.length,
    adoptedWorkbooks: adopted.filter((row) => row.kind === "workbook").length,
    adoptedGeometry: adopted.filter((row) => row.kind === "geometry").length,
    elementCodes: workbookCodes.size,
    superseded: superseded.length,
    undecidedDuplicates: undecided.length,
    held: held.length,
    heldElementIds: [...new Set(held.map((row) => row.elementId))].sort(),
    carriedFromPreviousDelivery: carried.length,
    heldWithoutPrevious: heldWithoutPrevious.length,
    stagedWorkbooks: adopted.filter((row) => row.kind === "workbook").length + carried.length,
    skipped: skipped.length,
  },
  adopted: adopted.sort((left, right) => left.name.localeCompare(right.name)),
  superseded,
  undecidedDuplicates: undecided,
  held,
  carriedFromPreviousDelivery: carried,
  heldWithoutPrevious,
  skipped,
};
mkdirSync(OUT_ROOT, { recursive: true });
writeFileSync(resolve(OUT_ROOT, `manifest-${VERSION}.json`), `${JSON.stringify(manifest, null, 2)}\n`, "utf8");

console.log(
  JSON.stringify({
    type: "summary",
    schemaVersion: "v156",
    status:
      undecided.length > 0
        ? "UNDECIDED_DUPLICATE"
        : heldWithoutPrevious.length > 0
          ? "HELD_WITHOUT_PREVIOUS"
          : "PASS",
    ...manifest.totals,
    manifest: `_source/vietnam/${VERSION}/manifest-${VERSION}.json`,
  })
);
if (heldWithoutPrevious.length > 0) {
  console.error(JSON.stringify({ type: "held-without-previous", elements: heldWithoutPrevious }));
  process.exitCode = 1;
}
if (undecided.length > 0) {
  console.error(
    JSON.stringify({ type: "undecided-duplicates", files: undecided.map((row) => row.name) })
  );
  process.exitCode = 1;
}
