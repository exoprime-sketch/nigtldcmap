import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

import { PROJECT_ROOT, pngDimensions } from "../v125/audit-utils.mjs";

export const V135_REPORT_ROOT = resolve(PROJECT_ROOT, "reports/v135");
export const V135_SCREENSHOT_ROOT = resolve(V135_REPORT_ROOT, "screenshots");

export const REQUIRED_SCREENSHOTS_V135 = Object.freeze([
  "finder-energy.png",
  "finder-drought.png",
  "detail-ghg-sector-gas.png",
  "detail-portfolio.png",
  "detail-single-year-kpi.png",
  "map-guide-closed.png",
  "map-guide-open.png",
  "map-left-expanded.png",
  "map-all-data.png",
  "map-mine-hover.png",
  "map-compare-finance.png",
  "map-compare-vulnerability-budget.png",
  "map-compare-mobile.png",
]);

export function normalizeTextV135(value) {
  return String(value ?? "").normalize("NFC").replace(/\s+/gu, " ").trim();
}

export function writeJsonV135(path, value) {
  mkdirSync(resolve(path, ".."), { recursive: true });
  writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

export function finishAuditV135(audit, fileName, extra = {}) {
  const summary = audit.finish(extra);
  writeJsonV135(resolve(V135_REPORT_ROOT, fileName), {
    schemaVersion: "v135-final-public-screen-audit-1",
    generatedAt: new Date().toISOString(),
    audit: audit.name,
    status: summary.status,
    summary,
    checks: audit.checks,
    ...extra,
  });
  return summary;
}

export function finderUrlV135(baseUrl, query = "") {
  const url = new URL(baseUrl);
  url.searchParams.set("country", "VNM");
  if (query) url.searchParams.set("q", query);
  url.hash = "explorer";
  return url.toString();
}

export function detailUrlV135(baseUrl, elementId) {
  const url = new URL(baseUrl);
  url.searchParams.set("view", "data");
  url.searchParams.set("country", "VNM");
  url.searchParams.set("element", elementId);
  url.hash = "element-detail";
  return url.toString();
}

export function mapUrlV135(baseUrl, parameters = {}) {
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

export function reportStatusV135(result) {
  if (!result || result.error) return "missing";
  return result.value?.status || result.value?.summary?.status || "missing";
}

export function screenshotEvidenceV135(name) {
  const path = resolve(V135_SCREENSHOT_ROOT, name);
  const dimensions = pngDimensions(path);
  let sha256 = null;
  if (dimensions.error === null && existsSync(path) && statSync(path).isFile()) {
    sha256 = createHash("sha256").update(readFileSync(path)).digest("hex");
  }
  return { name, ...dimensions, sha256 };
}

export function visibleExpressionV135(selector) {
  return `(() => {
    const node = document.querySelector(${JSON.stringify(selector)});
    if (!(node instanceof Element)) return false;
    const rect = node.getBoundingClientRect();
    const style = getComputedStyle(node);
    return rect.width > 0 && rect.height > 0 && style.display !== 'none' &&
      style.visibility !== 'hidden' && Number(style.opacity || 1) > 0;
  })()`;
}
