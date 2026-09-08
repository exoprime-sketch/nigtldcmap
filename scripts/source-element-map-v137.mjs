#!/usr/bin/env node
/**
 * Second pass over the source inventory: fix the classification the first pass
 * got wrong, then map every one of the 152 catalog elements onto its sources.
 *
 * Re-reads only the inventory CSV, never the 6GB archive, so this is cheap to
 * re-run as the mapping rules are refined.
 *
 * Two corrections to the first pass:
 *   - Every empty file shares one SHA-256, so grouping by hash alone reported
 *     1,032 empty files as content duplicates of each other. Duplicate grouping
 *     now ignores zero-byte files entirely.
 *   - `._DAV/.state_for_dir.{dir,pag}` are WebDAV sync-client state, not data.
 *     There are 1,010 pairs of them, which dominated the file count.
 */

import fs from "node:fs/promises";
import path from "node:path";

const PROJECT_ROOT = path.resolve(import.meta.dirname, "..");
const DIR = path.join(PROJECT_ROOT, "reports", "final-data-integration");
const INVENTORY = path.join(DIR, "source-inventory-v137.csv");
const CATALOG = path.join(PROJECT_ROOT, "public", "data", "vietnam", "v2", "catalog.json");

function parseCsv(text) {
  const rows = [];
  let row = [], cell = "", quoted = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (quoted) {
      if (ch === '"') {
        if (text[i + 1] === '"') { cell += '"'; i++; } else quoted = false;
      } else cell += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === ",") { row.push(cell); cell = ""; }
    else if (ch === "\n") { row.push(cell); rows.push(row); row = []; cell = ""; }
    else if (ch !== "\r") cell += ch;
  }
  if (cell || row.length) { row.push(cell); rows.push(row); }
  const header = rows.shift();
  return rows.filter((r) => r.length === header.length)
    .map((r) => Object.fromEntries(header.map((h, i) => [h, r[i]])));
}

const rows = parseCsv(await fs.readFile(INVENTORY, "utf8"));
const catalog = JSON.parse(await fs.readFile(CATALOG, "utf8"));
const elements = catalog.elements;

/** Reclassify: system artefacts and empty files are not data of any kind. */
for (const r of rows) {
  r.bytes = Number(r.bytes);
  if (r.relPath.includes("._DAV")) r.role = "임시(WebDAV 동기화 상태)";
  else if (r.bytes === 0) r.role = "빈 파일(0바이트)";
  else if (r.fileName.startsWith("~$")) r.role = "임시(Excel 잠금)";
  r.dupGroup = "";
}

// Duplicate grouping, empty files excluded so they cannot collapse together.
const byHash = new Map();
for (const r of rows) {
  if (r.bytes === 0) continue;
  if (!byHash.has(r.sha256)) byHash.set(r.sha256, []);
  byHash.get(r.sha256).push(r);
}
let redundant = 0;
for (const group of byHash.values()) {
  if (group.length < 2) continue;
  group.sort((a, b) => a.relPath.localeCompare(b.relPath));
  for (const [i, r] of group.entries()) {
    r.dupGroup = group[0].sourceId;
    if (i > 0) { r.role = "중복(동일 내용)"; redundant++; }
  }
}

/**
 * `file/<ELEMENT>.xlsx` is the canonical per-element export: one workbook named
 * exactly for the element, covering 145 of the 152 ids. Everything under the
 * A–E category trees is the raw evidence behind those workbooks.
 */
const canonical = new Map();
for (const r of rows) {
  if (r.topFolder !== "file" || r.ext !== "xlsx") continue;
  canonical.set(path.basename(r.fileName, ".xlsx"), r);
}

const byElement = new Map();
for (const r of rows) {
  if (!r.elementId) continue;
  if (r.role.startsWith("임시") || r.role.startsWith("빈 파일")) continue;
  if (!byElement.has(r.elementId)) byElement.set(r.elementId, []);
  byElement.get(r.elementId).push(r);
}

const mapping = elements.map((el) => {
  const id = el.elementId;
  const canon = canonical.get(id) ?? null;
  const related = (byElement.get(id) ?? []).filter((r) => r.topFolder !== "file");
  const primary = related.filter((r) => r.role === "주 데이터");
  const docs = related.filter((r) => r.role === "근거문서");
  const spatial = related.filter((r) => r.role === "공간자료");

  let status;
  if (canon) status = "CANONICAL_WORKBOOK";
  else if (primary.length) status = "RAW_ONLY";
  else if (docs.length || spatial.length) status = "EVIDENCE_ONLY";
  else status = "NO_SOURCE_FOUND";

  return {
    elementId: id,
    elementLabel: el.elementLabel,
    categoryCode: el.categoryCode,
    detailTemplate: el.detailTemplate,
    currentDataPresence: el.dataPresenceStatus,
    currentObservationCount: el.observationCount ?? 0,
    currentEntityCount: el.entityCount ?? 0,
    currentIndicatorCount: el.indicatorCount ?? 0,
    currentMapFeatureCount: el.mapFeatureCount ?? 0,
    sourceStatus: status,
    canonicalWorkbook: canon ? canon.relPath : "",
    canonicalBytes: canon ? canon.bytes : 0,
    canonicalSha256: canon ? canon.sha256 : "",
    rawDataFileCount: primary.length,
    evidenceDocCount: docs.length,
    spatialFileCount: spatial.length,
    processingStatus: "PENDING",
  };
});

const unmappedSources = rows.filter(
  (r) =>
    !r.role.startsWith("임시") &&
    !r.role.startsWith("빈 파일") &&
    r.role !== "중복(동일 내용)" &&
    (!r.elementId || !elements.some((e) => e.elementId === r.elementId))
);

const header = [
  "sourceId", "relPath", "topFolder", "fileName", "ext", "bytes", "sha256",
  "mtime", "elementId", "role", "readState", "dupGroup",
];
const csvCell = (v) => {
  const s = String(v ?? "");
  return /[",\n]/.test(s) ? `"${s.replaceAll('"', '""')}"` : s;
};
await fs.writeFile(
  INVENTORY,
  header.join(",") + "\n" +
    rows.map((r) => header.map((h) => csvCell(r[h])).join(",")).join("\n") + "\n",
  "utf8"
);

const mapHeader = Object.keys(mapping[0]);
await fs.writeFile(
  path.join(DIR, "element-source-map-v137.csv"),
  mapHeader.join(",") + "\n" +
    mapping.map((m) => mapHeader.map((h) => csvCell(m[h])).join(",")).join("\n") + "\n",
  "utf8"
);

const roleTally = {};
for (const r of rows) roleTally[r.role] = (roleTally[r.role] ?? 0) + 1;
const statusTally = {};
for (const m of mapping) statusTally[m.sourceStatus] = (statusTally[m.sourceStatus] ?? 0) + 1;

const summary = {
  generatedAt: new Date().toISOString(),
  fileCount: rows.length,
  uniqueNonEmptyContentCount: byHash.size,
  redundantCopyCount: redundant,
  zeroByteFileCount: rows.filter((r) => r.bytes === 0).length,
  webdavStateFileCount: rows.filter((r) => r.relPath.includes("._DAV")).length,
  realContentFileCount: rows.filter(
    (r) => !r.role.startsWith("임시") && !r.role.startsWith("빈 파일")
  ).length,
  mojibakeFolders: {
    note:
      "이름에 □가 들어간 D/E 폴더는 정상 이름 폴더의 다른 판본이 아니라 " +
      "0바이트 빈 파일만 담긴 실패한 복사본이다. 내용 비교 대상이 아니며 원본은 삭제하지 않는다.",
    folders: [...new Set(rows.filter((r) => r.topFolder.includes("□")).map((r) => r.topFolder))],
    fileCount: rows.filter((r) => r.topFolder.includes("□")).length,
    allZeroByte: rows.filter((r) => r.topFolder.includes("□")).every((r) => r.bytes === 0),
  },
  roleTally,
  elementAccounting: { total: mapping.length, ...statusTally },
  unmappedSourceCount: unmappedSources.length,
};
await fs.writeFile(
  path.join(DIR, "source-inventory-summary-v137.json"),
  JSON.stringify(summary, null, 2) + "\n",
  "utf8"
);

console.log(JSON.stringify({ roleTally, elementAccounting: summary.elementAccounting,
  realContentFileCount: summary.realContentFileCount,
  uniqueNonEmptyContentCount: summary.uniqueNonEmptyContentCount,
  unmappedSourceCount: summary.unmappedSourceCount }, null, 2));
