import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

import {
  PROJECT_ROOT,
  pngDimensions,
} from "../v125/audit-utils.mjs";

export const V131_REPORT_ROOT = resolve(PROJECT_ROOT, "reports/v131");
export const V131_SCREENSHOT_ROOT = resolve(V131_REPORT_ROOT, "screenshots");

export const PUBLIC_PLACEHOLDER_PRIMARY_TITLES_V131 = [
  "명칭 미기재",
  "자료 없음",
  "unknown",
  "n/a",
  "null",
  "undefined",
];

export const PUBLIC_TECHNICAL_TOKENS_V131 = [
  "sourceRow",
  "sourceSheet",
  "recordId",
  "indicatorId",
  "publicationDecision",
  "semantic",
  "renderer",
  "V124",
  "V125",
  "V126",
  "V127",
  "V128",
  "V129",
  "V130",
  "V131",
];

export function normalizePublicTextV131(value) {
  return String(value ?? "")
    .normalize("NFC")
    .replace(/\s+/gu, " ")
    .trim();
}

export function isPlaceholderPrimaryTitleV131(value) {
  const normalized = normalizePublicTextV131(value).toLocaleLowerCase("en-US");
  return PUBLIC_PLACEHOLDER_PRIMARY_TITLES_V131.some(
    (placeholder) => normalized === placeholder.toLocaleLowerCase("en-US")
  );
}

export function publicTechnicalTokenHitsV131(value) {
  const normalized = normalizePublicTextV131(value).toLocaleLowerCase("en-US");
  return PUBLIC_TECHNICAL_TOKENS_V131.filter((token) =>
    normalized.includes(token.toLocaleLowerCase("en-US"))
  );
}

export function sourceTextV131(paths) {
  return paths
    .filter((path) => existsSync(path))
    .map((path) => readFileSync(path, "utf8"))
    .join("\n");
}

export function writeAuditReportV131(fileName, audit, summary, extra = {}) {
  mkdirSync(V131_REPORT_ROOT, { recursive: true });
  const path = resolve(V131_REPORT_ROOT, fileName);
  const report = {
    schemaVersion: "v131-public-content-audit-1",
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

export function finishAuditV131(audit, fileName, extra = {}) {
  const summary = audit.finish(extra);
  writeAuditReportV131(fileName, audit, summary, extra);
  return summary;
}

export function screenshotEvidenceV131(names) {
  return names.map((name) => ({
    name,
    ...pngDimensions(resolve(V131_SCREENSHOT_ROOT, name)),
  }));
}

export function validScreenshotV131(evidence, minimum = {}) {
  return (
    evidence.error === null &&
    evidence.width >= (minimum.width ?? 240) &&
    evidence.height >= (minimum.height ?? 120) &&
    Number(evidence.byteSize || 0) >= (minimum.byteSize ?? 2_000)
  );
}
