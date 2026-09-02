#!/usr/bin/env node

import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import {
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
} from "node:fs";
import { dirname, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = resolve(SCRIPT_DIR, "..");
const SOURCE_ZIP = resolve(
  PROJECT_ROOT,
  process.env.VIETNAM_V124_SOURCE_ZIP ||
    "_source/vietnam/v124/vietnam-data(4).zip"
);
const V2_ROOT = resolve(PROJECT_ROOT, "public/data/vietnam/v2");
const REPORT_PATH = resolve(
  PROJECT_ROOT,
  "reports/v133/source-local-audit-v133.json"
);

const checks = [];
function check(name, passed, actual, expected, details = undefined) {
  const row = {
    name,
    status: passed ? "PASS" : "FAIL",
    actual,
    expected,
  };
  if (details !== undefined) row.details = details;
  checks.push(row);
}

function readJson(path) {
  return JSON.parse(readFileSync(path, "utf8"));
}

function sha256(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

function gitOutput(args) {
  try {
    return execFileSync("git", args, {
      cwd: PROJECT_ROOT,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim();
  } catch {
    return "";
  }
}

function countZipWorkbooks(bytes) {
  const minimumEocdSize = 22;
  const firstPossibleEocd = Math.max(0, bytes.length - 65_535 - minimumEocdSize);
  let eocdOffset = -1;
  for (
    let offset = bytes.length - minimumEocdSize;
    offset >= firstPossibleEocd;
    offset -= 1
  ) {
    if (bytes.readUInt32LE(offset) === 0x06054b50) {
      eocdOffset = offset;
      break;
    }
  }
  if (eocdOffset < 0) throw new Error("ZIP EOCD missing");

  const entryCount = bytes.readUInt16LE(eocdOffset + 10);
  let offset = bytes.readUInt32LE(eocdOffset + 16);
  let workbookCount = 0;
  for (let index = 0; index < entryCount; index += 1) {
    if (offset + 46 > bytes.length || bytes.readUInt32LE(offset) !== 0x02014b50) {
      throw new Error("invalid ZIP central directory");
    }
    const nameLength = bytes.readUInt16LE(offset + 28);
    const extraLength = bytes.readUInt16LE(offset + 30);
    const commentLength = bytes.readUInt16LE(offset + 32);
    const name = bytes
      .subarray(offset + 46, offset + 46 + nameLength)
      .toString("utf8")
      .normalize("NFC");
    const basename = name.split("/").pop() || "";
    if (/\.xlsx$/iu.test(name) && !basename.startsWith("~$")) workbookCount += 1;
    offset += 46 + nameLength + extraLength + commentLength;
  }
  return { entryCount, workbookCount };
}

const sourceRelative = relative(PROJECT_ROOT, SOURCE_ZIP).split(sep).join("/");
const sourceExists = existsSync(SOURCE_ZIP);
check("SOURCE_ZIP_EXISTS", sourceExists, sourceExists, true, {
  path: sourceRelative,
  environment: "developer-local-only",
});

let sourceBytes;
if (sourceExists) sourceBytes = readFileSync(SOURCE_ZIP);

let zipResult = { entryCount: 0, workbookCount: 0 };
let zipError = null;
if (sourceBytes) {
  try {
    zipResult = countZipWorkbooks(sourceBytes);
  } catch (error) {
    zipError = error instanceof Error ? error.message : String(error);
  }
}
check(
  "SOURCE_WORKBOOK_COUNT",
  zipResult.workbookCount === 149 && !zipError,
  zipResult.workbookCount,
  149,
  zipError ? { error: zipError } : { zipEntries: zipResult.entryCount }
);

const quality = readJson(resolve(V2_ROOT, "quality-report.json"));
const manifest = readJson(resolve(V2_ROOT, "manifest.json"));
const actualHash = sourceBytes ? sha256(sourceBytes) : null;
const recordedHashes = [quality?.sourceZip?.sha256, manifest?.sourcePackageSha256]
  .filter(Boolean)
  .map((value) => String(value).toLowerCase());
check(
  "SOURCE_HASH_MATCH",
  Boolean(actualHash) &&
    recordedHashes.length === 2 &&
    recordedHashes.every((value) => value === actualHash),
  { actual: actualHash, recorded: recordedHashes },
  "quality report and manifest match the local ZIP"
);

const manifestBalance = manifest?.rowBalance;
const qualityBalance = quality?.summary?.rowBalance;
const rowBalanceMatches =
  quality?.summary?.rowBalancePass === true &&
  manifestBalance?.matches === true &&
  qualityBalance?.matches === true &&
  manifestBalance?.sourceOriginalRows === manifestBalance?.processedRows &&
  qualityBalance?.sourceOriginalRows === qualityBalance?.processedRows &&
  JSON.stringify(manifestBalance) === JSON.stringify(qualityBalance);
check(
  "ETL_ROW_RECONCILIATION",
  rowBalanceMatches,
  {
    sourceRows: manifestBalance?.sourceOriginalRows ?? null,
    processedRows: manifestBalance?.processedRows ?? null,
    qualityPass: quality?.summary?.rowBalancePass ?? false,
  },
  { matches: true }
);

const tracked = gitOutput(["ls-files", "--", sourceRelative]);
check("SOURCE_ZIP_NOT_TRACKED", tracked.length === 0, tracked.length > 0, false, {
  path: sourceRelative,
});

const ignored = gitOutput([
  "check-ignore",
  "--no-index",
  "--verbose",
  "--",
  sourceRelative,
]);
check("SOURCE_ZIP_IGNORED", ignored.length > 0, ignored.length > 0, true, {
  path: sourceRelative,
  rule: ignored || null,
});

const failed = checks.filter((row) => row.status === "FAIL");
const report = {
  schemaVersion: "v133",
  audit: "developer-local-source",
  ciEligible: false,
  checks,
  summary: {
    status: failed.length === 0 ? "PASS" : "FAIL",
    passed: checks.length - failed.length,
    failed: failed.length,
    total: checks.length,
    failedChecks: failed.map((row) => row.name),
  },
};
mkdirSync(dirname(REPORT_PATH), { recursive: true });
writeFileSync(REPORT_PATH, `${JSON.stringify(report, null, 2)}\n`, "utf8");
for (const row of checks) console.log(JSON.stringify({ type: "check", ...row }));
console.log(JSON.stringify({ type: "summary", ...report.summary }));
process.exitCode = failed.length === 0 ? 0 : 1;
