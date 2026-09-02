import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

import { PROJECT_ROOT, pngDimensions } from "../v125/audit-utils.mjs";

export const V133_REPORT_ROOT = resolve(PROJECT_ROOT, "reports/v133");
export const V133_SCREENSHOT_ROOT = resolve(V133_REPORT_ROOT, "screenshots");

export const REQUIRED_SCREENSHOTS_V133 = Object.freeze([
  "map-vulnerability-primary-only.png",
  "map-vulnerability-budget-context.png",
  "map-vulnerability-adaptation-context.png",
  "map-gvi-hover.png",
  "map-gvi-selected-detail.png",
  "map-finance-adaptation.png",
  "map-finance-carbon.png",
  "map-finance-compare.png",
  "map-overlap-feature-picker.png",
]);

export const REQUIRED_VIEWPORTS_V133 = Object.freeze([390, 768, 1024, 1440, 1920]);

export function normalizeTextV133(value) {
  return String(value ?? "")
    .normalize("NFC")
    .replace(/\s+/gu, " ")
    .trim();
}

export function readSourceV133(paths) {
  return paths
    .filter((path) => existsSync(path))
    .map((path) => readFileSync(path, "utf8"))
    .join("\n");
}

export function writeJsonV133(path, value) {
  mkdirSync(resolve(path, ".."), { recursive: true });
  writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

export function finishAuditV133(audit, fileName, extra = {}) {
  const summary = audit.finish(extra);
  writeJsonV133(resolve(V133_REPORT_ROOT, fileName), {
    schemaVersion: "v133-ci-map-analysis-audit-1",
    generatedAt: new Date().toISOString(),
    audit: audit.name,
    status: summary.status,
    summary,
    checks: audit.checks,
    ...extra,
  });
  return summary;
}

export function mapUrlV133(baseUrl, parameters = {}) {
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

export function activeLayersV133(mapDocument) {
  return Array.isArray(mapDocument?.layers)
    ? mapDocument.layers.filter((layer) => layer?.active !== false && layer?.enabled !== false)
    : [];
}

export function mapFeatureOrScopeCountV133(layers) {
  return layers.reduce((sum, layer) => sum + Number(layer?.featureCount || 0), 0);
}

export function screenshotEvidenceV133(name) {
  const path = resolve(V133_SCREENSHOT_ROOT, name);
  const dimensions = pngDimensions(path);
  let sha256 = null;
  if (dimensions.error === null && existsSync(path) && statSync(path).isFile()) {
    sha256 = createHash("sha256").update(readFileSync(path)).digest("hex");
  }
  return { name, ...dimensions, sha256 };
}

export function validScreenshotV133(evidence, minimum = {}) {
  return (
    evidence.error === null &&
    evidence.width >= (minimum.width ?? 240) &&
    evidence.height >= (minimum.height ?? 120) &&
    Number(evidence.byteSize || 0) >= (minimum.byteSize ?? 2_000)
  );
}

export function containsForbiddenPublicMapTokenV133(value) {
  const text = normalizeTextV133(value).toLocaleLowerCase("en-US");
  return [
    "focus layer",
    "context layer",
    "feature",
    "geometry",
    "renderer",
    "aggregation level",
    "map scope",
    "recordid",
    "sourcesheet",
    "sourcerow",
  ].filter((token) => text.includes(token));
}

