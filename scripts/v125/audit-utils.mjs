import { createHash } from "node:crypto";
import { existsSync, readFileSync, statSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { gunzipSync } from "node:zlib";

export const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
export const PROJECT_ROOT = resolve(SCRIPT_DIR, "../..");
export const V2_ROOT = resolve(PROJECT_ROOT, "public/data/vietnam/v2");
export const SEMANTIC_ROOT = resolve(V2_ROOT, "semantic");
export const REPORT_ROOT = resolve(PROJECT_ROOT, "reports/v125");

export class AuditV125 {
  constructor(name) {
    this.name = name;
    this.checks = [];
  }

  check(name, passed, actual, expected, details = undefined) {
    const entry = {
      type: "check",
      audit: this.name,
      name,
      status: passed ? "PASS" : "FAIL",
      actual,
      expected,
    };
    if (details !== undefined) entry.details = details;
    this.checks.push(entry);
    return passed;
  }

  finish(extra = {}) {
    for (const check of this.checks) console.log(JSON.stringify(check));
    const failed = this.checks.filter((check) => check.status === "FAIL");
    const summary = {
      type: "summary",
      audit: this.name,
      status: failed.length === 0 ? "PASS" : "FAIL",
      passed: this.checks.length - failed.length,
      failed: failed.length,
      total: this.checks.length,
      failedChecks: failed.map((check) => check.name),
      ...extra,
    };
    console.log(JSON.stringify(summary));
    process.exitCode = failed.length === 0 ? 0 : 1;
    return summary;
  }
}

export function readText(path) {
  if (!existsSync(path) || !statSync(path).isFile()) {
    return { value: null, error: "missing", path };
  }
  try {
    return { value: readFileSync(path, "utf8"), error: null, path };
  } catch (error) {
    return {
      value: null,
      error: error instanceof Error ? error.message : String(error),
      path,
    };
  }
}

export function readJson(path) {
  const text = readText(path);
  if (text.error || text.value === null) return text;
  try {
    return { value: JSON.parse(text.value), error: null, path };
  } catch (error) {
    return {
      value: null,
      error: error instanceof Error ? error.message : String(error),
      path,
    };
  }
}

export function publicUrlToPath(url) {
  if (typeof url !== "string" || !url.startsWith("/")) return null;
  if (url.includes("..") || /[?#]/u.test(url)) return null;
  return resolve(PROJECT_ROOT, "public", url.replace(/^\/+/, ""));
}

export function fileSha256(path) {
  return createHash("sha256").update(readFileSync(path)).digest("hex");
}

export function isNonEmptyString(value) {
  return typeof value === "string" && value.trim().length > 0;
}

export function uniqueStrings(values) {
  return [
    ...new Set(
      (Array.isArray(values) ? values : [])
        .map((value) =>
          typeof value === "string"
            ? value.trim()
            : typeof value === "number" && Number.isFinite(value)
            ? String(value)
            : value && typeof value === "object"
            ? String(value.key ?? value.id ?? value.value ?? "").trim()
            : ""
        )
        .filter(Boolean)
    ),
  ].sort((left, right) => left.localeCompare(right, "en"));
}

export function catalogElements(document) {
  return Array.isArray(document?.elements) ? document.elements : [];
}

export function visualizationContracts(document) {
  if (Array.isArray(document?.contracts)) return document.contracts;
  if (document?.contracts && typeof document.contracts === "object") {
    return Object.values(document.contracts);
  }
  return [];
}

export function semanticElements(document) {
  if (document?.elements && typeof document.elements === "object") {
    return document.elements;
  }
  return {};
}

export function parseCsv(text) {
  const rows = [];
  let row = [];
  let cell = "";
  let quoted = false;
  for (let index = 0; index < text.length; index += 1) {
    const character = text[index];
    if (quoted) {
      if (character === '"' && text[index + 1] === '"') {
        cell += '"';
        index += 1;
      } else if (character === '"') {
        quoted = false;
      } else {
        cell += character;
      }
      continue;
    }
    if (character === '"') {
      quoted = true;
    } else if (character === ",") {
      row.push(cell);
      cell = "";
    } else if (character === "\n") {
      row.push(cell.replace(/\r$/u, ""));
      if (row.some((value) => value.length > 0)) rows.push(row);
      row = [];
      cell = "";
    } else {
      cell += character;
    }
  }
  if (cell.length > 0 || row.length > 0) {
    row.push(cell.replace(/\r$/u, ""));
    if (row.some((value) => value.length > 0)) rows.push(row);
  }
  if (quoted) throw new Error("unterminated quoted CSV field");
  if (rows.length === 0) return [];
  const headers = rows[0];
  return rows.slice(1).map((values) =>
    Object.fromEntries(headers.map((header, index) => [header, values[index] ?? ""]))
  );
}

export function loadPackPayloads() {
  const indexPath = resolve(V2_ROOT, "packs/bundle-index-v124.json");
  const indexResult = readJson(indexPath);
  if (indexResult.error) {
    return { index: null, elements: new Map(), errors: [indexResult.error] };
  }
  const index = indexResult.value;
  const elements = new Map();
  const errors = [];
  const urls = [
    ...new Set(
      Object.values(index?.elements || {})
        .map((entry) => entry?.packUrl)
        .filter(isNonEmptyString)
    ),
  ].sort((left, right) => left.localeCompare(right, "en"));

  for (const url of urls) {
    const path = publicUrlToPath(url);
    if (!path || !existsSync(path)) {
      errors.push({ url, error: "pack missing" });
      continue;
    }
    try {
      const envelope = JSON.parse(readFileSync(path, "utf8"));
      if (!Array.isArray(envelope.payloadChunks) || envelope.payloadChunks.length === 0) {
        throw new Error("payloadChunks missing");
      }
      const compressed = Buffer.from(envelope.payloadChunks.join(""), "base64");
      const compressedHash = createHash("sha256").update(compressed).digest("hex");
      if (compressedHash !== envelope.compressedSha256) {
        throw new Error("compressed hash mismatch");
      }
      const content = gunzipSync(compressed);
      const contentHash = createHash("sha256").update(content).digest("hex");
      if (contentHash !== envelope.contentSha256) {
        throw new Error("content hash mismatch");
      }
      const shard = JSON.parse(content.toString("utf8"));
      for (const [elementId, payload] of Object.entries(shard.elements || {})) {
        if (elements.has(elementId)) {
          errors.push({ elementId, url, error: "duplicate element across packs" });
        } else {
          elements.set(elementId, payload);
        }
      }
    } catch (error) {
      errors.push({
        url,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }
  return { index, elements, errors };
}

export function payloadRecords(section) {
  if (Array.isArray(section)) return section;
  if (Array.isArray(section?.records)) return section.records;
  return [];
}

export function arrayDifference(left, right) {
  const rightSet = new Set(right);
  return left.filter((value) => !rightSet.has(value));
}

export function countBy(values, selector) {
  const counts = {};
  for (const value of values) {
    const key = selector(value);
    counts[key] = (counts[key] || 0) + 1;
  }
  return counts;
}

export function pngDimensions(path) {
  if (!existsSync(path) || !statSync(path).isFile()) {
    return { width: 0, height: 0, error: "missing" };
  }
  try {
    const bytes = readFileSync(path);
    const signature = "89504e470d0a1a0a";
    if (bytes.length < 24 || bytes.subarray(0, 8).toString("hex") !== signature) {
      return { width: 0, height: 0, error: "not PNG" };
    }
    return {
      width: bytes.readUInt32BE(16),
      height: bytes.readUInt32BE(20),
      byteSize: bytes.byteLength,
      sha256: createHash("sha256").update(bytes).digest("hex"),
      error: null,
    };
  } catch (error) {
    return {
      width: 0,
      height: 0,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}
