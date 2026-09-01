import { gunzipSync } from "node:zlib";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const LIB_DIR = dirname(fileURLToPath(import.meta.url));
export const PROJECT_ROOT = resolve(LIB_DIR, "../..");
export const PUBLIC_ROOT = resolve(PROJECT_ROOT, "public/data/vietnam/v2");
export const REPORT_ROOT = resolve(PROJECT_ROOT, "reports/v130");

export function readJson(path) {
  return JSON.parse(readFileSync(path, "utf8"));
}

export function publicJson(relativePath) {
  return readJson(resolve(PUBLIC_ROOT, relativePath));
}

export function reportJson(fileName) {
  return readJson(resolve(REPORT_ROOT, fileName));
}

export function loadElement(elementId) {
  const index = publicJson("packs/bundle-index-v124.json");
  const entry = index.elements[elementId];
  if (!entry) throw new Error(`bundle index missing ${elementId}`);
  const envelope = readJson(
    resolve(PROJECT_ROOT, "public", entry.packUrl.slice(1))
  );
  const payload = JSON.parse(
    gunzipSync(Buffer.from(envelope.payloadChunks.join(""), "base64")).toString(
      "utf8"
    )
  );
  return payload.elements[elementId];
}

export function createAudit(name, resultFile) {
  const checks = [];
  const check = (checkName, passed, actual, expected, details) => {
    const row = {
      type: "check",
      name: checkName,
      status: passed ? "PASS" : "FAIL",
      actual,
      expected,
    };
    if (details !== undefined) row.details = details;
    checks.push(row);
    console.log(JSON.stringify(row));
  };
  const finish = (extra = {}) => {
    const failedChecks = checks
      .filter((row) => row.status === "FAIL")
      .map((row) => row.name);
    const summary = {
      type: "summary",
      audit: name,
      status: failedChecks.length ? "FAIL" : "PASS",
      passed: checks.length - failedChecks.length,
      failed: failedChecks.length,
      total: checks.length,
      failedChecks,
      ...extra,
    };
    console.log(JSON.stringify(summary));
    mkdirSync(REPORT_ROOT, { recursive: true });
    writeFileSync(
      resolve(REPORT_ROOT, resultFile),
      `${JSON.stringify({ schemaVersion: "v130-audit-result-1", checks, summary }, null, 2)}\n`
    );
    if (failedChecks.length) process.exitCode = 1;
    return summary;
  };
  return { check, finish };
}
