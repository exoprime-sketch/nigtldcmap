#!/usr/bin/env node
/**
 * Walks the final Vietnam source archive and records one row per file.
 *
 * The archive is ~6GB, so every file is hashed by streaming it through the
 * digest rather than reading it into memory, and nothing but metadata is kept
 * in the process. The archive itself is only ever opened for reading.
 */

import { createHash } from "node:crypto";
import { createReadStream } from "node:fs";
import fs from "node:fs/promises";
import path from "node:path";

const PROJECT_ROOT = path.resolve(import.meta.dirname, "..");
const SOURCE_ROOT = path.join(PROJECT_ROOT, "베트남데이터");
const OUT_DIR = path.join(PROJECT_ROOT, "reports", "final-data-integration");
const OUT_CSV = path.join(OUT_DIR, "source-inventory-v137.csv");
const OUT_JSON = path.join(OUT_DIR, "source-inventory-summary-v137.json");

/** Extensions we can parse for values later; everything else is evidence only. */
const DATA_EXT = new Set([".xlsx", ".xls", ".xlsm", ".csv", ".json", ".geojson"]);
const DOC_EXT = new Set([".pdf", ".docx", ".doc", ".hwp", ".hwpx", ".txt", ".md"]);
const SPATIAL_EXT = new Set([".geojson", ".shp", ".dbf", ".shx", ".prj", ".kml", ".gpkg"]);
const ARCHIVE_EXT = new Set([".zip", ".7z", ".rar", ".tar", ".gz"]);

/** Excel/LibreOffice lock files and OS noise — recorded, never deleted. */
function classifyTemp(base) {
  if (base.startsWith("~$")) return "임시(Excel 잠금)";
  if (base === ".DS_Store" || base === "Thumbs.db") return "임시(OS)";
  if (base.startsWith("._")) return "임시(리소스 포크)";
  return null;
}

function roleFor(base, ext) {
  const temp = classifyTemp(base);
  if (temp) return temp;
  if (SPATIAL_EXT.has(ext)) return "공간자료";
  if (DATA_EXT.has(ext)) return "주 데이터";
  if (DOC_EXT.has(ext)) return "근거문서";
  if (ARCHIVE_EXT.has(ext)) return "압축";
  return "기타";
}

/**
 * Element ids look like `A-001`, `B-034`, `D-025`. They appear in file names and
 * in the directory names above them, so the nearest one wins: a file named
 * `A-017_...xlsx` inside `A.2.b ...` is A-017, while a raw-data file with no id
 * of its own inherits the id of the folder it sits in.
 */
const ELEMENT_RE = /\b([A-E])[-_ ]?(\d{3})\b/;
function elementFrom(relPath) {
  const parts = relPath.split(path.sep).reverse();
  for (const part of parts) {
    const m = part.match(ELEMENT_RE);
    if (m) return `${m[1]}-${m[2]}`;
  }
  return "";
}

/** Top-level category folder, kept verbatim so the two D/E variants stay distinct. */
function topFolder(relPath) {
  return relPath.split(path.sep)[0] ?? "";
}

async function sha256(file) {
  return new Promise((resolve, reject) => {
    const hash = createHash("sha256");
    const stream = createReadStream(file);
    stream.on("error", reject);
    stream.on("data", (chunk) => hash.update(chunk));
    stream.on("end", () => resolve(hash.digest("hex")));
  });
}

async function* walk(dir) {
  let entries;
  try {
    entries = await fs.readdir(dir, { withFileTypes: true });
  } catch (error) {
    yield { error: `readdir failed: ${error.code}`, full: dir };
    return;
  }
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    // Symlinks could point outside the archive; record and skip rather than follow.
    if (entry.isSymbolicLink()) {
      yield { error: "symlink (not followed)", full };
      continue;
    }
    if (entry.isDirectory()) {
      yield* walk(full);
    } else if (entry.isFile()) {
      yield { full };
    }
  }
}

function csvCell(value) {
  const s = String(value ?? "");
  return /[",\n]/.test(s) ? `"${s.replaceAll('"', '""')}"` : s;
}

const rows = [];
const failures = [];
let bytesTotal = 0;
let n = 0;

for await (const item of walk(SOURCE_ROOT)) {
  if (item.error) {
    failures.push({ path: path.relative(SOURCE_ROOT, item.full), reason: item.error });
    continue;
  }
  const rel = path.relative(SOURCE_ROOT, item.full);
  const base = path.basename(rel);
  const ext = path.extname(base).toLowerCase();
  let stat;
  try {
    stat = await fs.stat(item.full);
  } catch (error) {
    failures.push({ path: rel, reason: `stat failed: ${error.code}` });
    continue;
  }
  let digest = "";
  try {
    digest = await sha256(item.full);
  } catch (error) {
    failures.push({ path: rel, reason: `hash failed: ${error.code}` });
  }
  rows.push({
    sourceId: `S${String(++n).padStart(5, "0")}`,
    relPath: rel,
    topFolder: topFolder(rel),
    fileName: base,
    ext: ext.replace(".", ""),
    bytes: stat.size,
    sha256: digest,
    mtime: stat.mtime.toISOString(),
    elementId: elementFrom(rel),
    role: roleFor(base, ext),
    readState: digest ? "OK" : "HASH_FAILED",
  });
  bytesTotal += stat.size;
  if (n % 250 === 0) process.stderr.write(`  ...${n} files\n`);
}

// Duplicate detection is by content hash; every path that carries a hash is kept
// so no source location is lost when we later parse only one of them.
const byHash = new Map();
for (const row of rows) {
  if (!row.sha256) continue;
  if (!byHash.has(row.sha256)) byHash.set(row.sha256, []);
  byHash.get(row.sha256).push(row);
}
for (const [, group] of byHash) {
  if (group.length < 2) continue;
  group.sort((a, b) => a.relPath.localeCompare(b.relPath));
  group.forEach((row, i) => {
    row.dupGroup = group[0].sourceId;
    if (i > 0) row.role = row.role === "임시(Excel 잠금)" ? row.role : "중복";
  });
}

await fs.mkdir(OUT_DIR, { recursive: true });
const header = [
  "sourceId", "relPath", "topFolder", "fileName", "ext", "bytes", "sha256",
  "mtime", "elementId", "role", "readState", "dupGroup",
];
await fs.writeFile(
  OUT_CSV,
  header.join(",") + "\n" +
    rows.map((r) => header.map((h) => csvCell(r[h])).join(",")).join("\n") + "\n",
  "utf8"
);

const tally = (key) => {
  const out = {};
  for (const row of rows) out[row[key] || "(none)"] = (out[row[key] || "(none)"] ?? 0) + 1;
  return Object.fromEntries(Object.entries(out).sort((a, b) => b[1] - a[1]));
};

const summary = {
  generatedAt: new Date().toISOString(),
  sourceRoot: "베트남데이터",
  fileCount: rows.length,
  uniqueContentCount: byHash.size,
  duplicateFileCount: rows.filter((r) => r.role === "중복").length,
  bytesTotal,
  gibTotal: +(bytesTotal / 1024 ** 3).toFixed(2),
  readFailures: failures,
  byTopFolder: tally("topFolder"),
  byExt: tally("ext"),
  byRole: tally("role"),
  filesWithElementId: rows.filter((r) => r.elementId).length,
  distinctElementIds: [...new Set(rows.map((r) => r.elementId).filter(Boolean))].sort(),
};
await fs.writeFile(OUT_JSON, JSON.stringify(summary, null, 2) + "\n", "utf8");

process.stderr.write(
  `done: ${rows.length} files, ${byHash.size} unique, ${summary.gibTotal} GiB, ` +
    `${failures.length} failures\n`
);
