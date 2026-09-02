import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

import { PROJECT_ROOT, pngDimensions } from "../v125/audit-utils.mjs";

export const V134_REPORT_ROOT = resolve(PROJECT_ROOT, "reports/v134");
export const V134_SCREENSHOT_ROOT = resolve(V134_REPORT_ROOT, "screenshots");

export const REQUIRED_SCREENSHOTS_V134 = Object.freeze([
  "d011-oda-overview.png",
  "d011-oda-provider-ranking.png",
  "d011-oda-provider-trend.png",
  "b005-spei-overview.png",
  "b005-spei-scenario-trend.png",
  "b005-spei-year-comparison.png",
  "glossary-oda-hover.png",
  "glossary-spei-hover.png",
  "glossary-ssp-hover.png",
  "glossary-mobile.png",
  "map-gvi-glossary.png",
]);

export function normalizeTextV134(value) {
  return String(value ?? "").normalize("NFC").replace(/\s+/gu, " ").trim();
}

export function readSourceV134(paths) {
  return paths
    .filter((path) => existsSync(path))
    .map((path) => readFileSync(path, "utf8"))
    .join("\n");
}

export function writeJsonV134(path, value) {
  mkdirSync(resolve(path, ".."), { recursive: true });
  writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

export function writeCsvV134(path, rows, columns) {
  const quote = (value) => {
    const text = String(value ?? "");
    return /[",\r\n]/u.test(text) ? `"${text.replace(/"/gu, '""')}"` : text;
  };
  mkdirSync(resolve(path, ".."), { recursive: true });
  const body = [columns.join(","), ...rows.map((row) => columns.map((key) => quote(row[key])).join(","))];
  writeFileSync(path, `${body.join("\n")}\n`, "utf8");
}

export function finishAuditV134(audit, fileName, extra = {}) {
  const summary = audit.finish(extra);
  writeJsonV134(resolve(V134_REPORT_ROOT, fileName), {
    schemaVersion: "v134-context-glossary-analysis-audit-1",
    generatedAt: new Date().toISOString(),
    audit: audit.name,
    status: summary.status,
    summary,
    checks: audit.checks,
    ...extra,
  });
  return summary;
}

export function detailUrlV134(baseUrl, elementId) {
  const url = new URL(baseUrl);
  url.searchParams.set("view", "data");
  url.searchParams.set("country", "VNM");
  url.searchParams.set("element", elementId);
  url.hash = "element-detail";
  return url.toString();
}

export function mapUrlV134(baseUrl, parameters = {}) {
  const url = new URL(baseUrl);
  url.searchParams.set("country", "VNM");
  for (const [key, value] of Object.entries(parameters)) {
    if (value !== undefined && value !== null && String(value).length > 0) {
      url.searchParams.set(key, String(value));
    }
  }
  url.hash = "map";
  return url.toString();
}

export function screenshotEvidenceV134(name) {
  const path = resolve(V134_SCREENSHOT_ROOT, name);
  const dimensions = pngDimensions(path);
  let sha256 = null;
  if (dimensions.error === null && existsSync(path) && statSync(path).isFile()) {
    sha256 = createHash("sha256").update(readFileSync(path)).digest("hex");
  }
  return { name, ...dimensions, sha256 };
}

export function validScreenshotV134(evidence, minimum = {}) {
  return (
    evidence.error === null &&
    evidence.width >= (minimum.width ?? 240) &&
    evidence.height >= (minimum.height ?? 120) &&
    Number(evidence.byteSize || 0) >= (minimum.byteSize ?? 2_000)
  );
}
