import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  PROJECT_ROOT,
  pngDimensions,
  readJson,
} from "../v125/audit-utils.mjs";

export const V129_REPORT_ROOT = resolve(PROJECT_ROOT, "reports/v129");
export const V129_SCREENSHOT_ROOT = resolve(V129_REPORT_ROOT, "screenshots");
export const V129_INTERPRETATION_ROOT = resolve(
  PROJECT_ROOT,
  "public/data/vietnam/v2/interpretation"
);

export function normalizeTextV129(value) {
  return String(value ?? "")
    .normalize("NFC")
    .replace(/\s+/gu, " ")
    .trim();
}

export function readFirstJsonV129(paths) {
  for (const path of paths) {
    const result = readJson(path);
    if (!result.error) return result;
  }
  return readJson(paths[0]);
}

export function interpretationItemsV129(document) {
  if (Array.isArray(document)) return document;
  for (const key of ["interpretations", "items", "indicators", "entries"]) {
    if (Array.isArray(document?.[key])) return document[key];
    if (document?.[key] && typeof document[key] === "object") {
      return Object.values(document[key]);
    }
  }
  if (document && typeof document === "object") {
    const values = Object.values(document).filter(
      (value) => value && typeof value === "object" && !Array.isArray(value)
    );
    if (values.some((value) => value.elementId)) return values;
  }
  return [];
}

export function benchmarkItemsV129(document) {
  if (Array.isArray(document)) return document;
  for (const key of ["benchmarks", "items", "entries"]) {
    if (Array.isArray(document?.[key])) return document[key];
    if (document?.[key] && typeof document[key] === "object") {
      return Object.values(document[key]);
    }
  }
  return [];
}

export function interpretationKeyV129(item) {
  return [
    normalizeTextV129(item?.elementId),
    normalizeTextV129(item?.variableKey || "*"),
    normalizeTextV129(item?.indicatorIdPattern || "*"),
  ].join("::");
}

export function writeAuditReportV129(fileName, audit, summary, extra = {}) {
  mkdirSync(V129_REPORT_ROOT, { recursive: true });
  const path = resolve(V129_REPORT_ROOT, fileName);
  const report = {
    schemaVersion: "v129-audit-report-1",
    generatedAt: new Date().toISOString(),
    audit: audit.name,
    status: summary.status,
    summary,
    checks: audit.checks,
    ...extra,
  };
  writeFileSync(path, `${JSON.stringify(report, null, 2)}\n`, "utf8");
  return path;
}

export function finishAuditV129(audit, fileName, extra = {}) {
  const summary = audit.finish(extra);
  writeAuditReportV129(fileName, audit, summary, extra);
  return summary;
}

export function detailUrlV129(baseUrl, elementId) {
  const url = new URL(baseUrl);
  url.searchParams.set("view", "data");
  url.searchParams.set("country", "VNM");
  url.searchParams.set("element", elementId);
  url.hash = "element-detail";
  return url.toString();
}

export function mapUrlV129(baseUrl, parameters = {}) {
  const url = new URL(baseUrl);
  url.searchParams.set("country", "VNM");
  for (const [key, value] of Object.entries(parameters)) {
    if (value !== null && value !== undefined && String(value).length > 0) {
      url.searchParams.set(key, String(value));
    }
  }
  url.hash = "map";
  return url.toString();
}

export function screenshotEvidenceV129(names) {
  return names.map((name) => ({
    name,
    ...pngDimensions(resolve(V129_SCREENSHOT_ROOT, name)),
  }));
}

export function validScreenshotV129(evidence, minimum = {}) {
  return (
    evidence.error === null &&
    evidence.width >= (minimum.width ?? 240) &&
    evidence.height >= (minimum.height ?? 120) &&
    Number(evidence.byteSize || 0) >= (minimum.byteSize ?? 2_000)
  );
}

export function sourceTextV129(paths) {
  return paths
    .filter((path) => existsSync(path))
    .map((path) => readFileSync(path, "utf8"))
    .join("\n");
}

export function numericValueV129(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}
