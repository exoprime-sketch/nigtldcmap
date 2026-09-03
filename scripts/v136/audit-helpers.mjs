import { mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

import { PROJECT_ROOT } from "../v125/audit-utils.mjs";

export const V136_REPORT_ROOT = resolve(PROJECT_ROOT, "reports/v136");
export const V136_SCREENSHOT_ROOT = resolve(V136_REPORT_ROOT, "screenshots");

export function normalizeTextV136(value) {
  return String(value ?? "").normalize("NFC").replace(/\s+/gu, " ").trim();
}

export function writeJsonV136(fileName, value) {
  mkdirSync(V136_REPORT_ROOT, { recursive: true });
  writeFileSync(
    resolve(V136_REPORT_ROOT, fileName),
    `${JSON.stringify(value, null, 2)}\n`,
    "utf8"
  );
}

export function writeCsvV136(fileName, header, rows) {
  mkdirSync(V136_REPORT_ROOT, { recursive: true });
  const escape = (value) => {
    const text = String(value ?? "").replace(/\r?\n/gu, " ");
    return /[",]/u.test(text) ? `"${text.replace(/"/gu, '""')}"` : text;
  };
  const body = rows
    .map((row) => header.map((key) => escape(row[key])).join(","))
    .join("\n");
  writeFileSync(
    resolve(V136_REPORT_ROOT, fileName),
    `${header.join(",")}\n${body}\n`,
    "utf8"
  );
}

export function finishAuditV136(audit, fileName, extra = {}) {
  const summary = audit.finish(extra);
  writeJsonV136(fileName, {
    schemaVersion: "v136-public-copy-acceptance-1",
    generatedAt: new Date().toISOString(),
    audit: audit.name,
    status: summary.status,
    summary,
    checks: audit.checks,
    ...extra,
  });
  return summary;
}

export function reportStatusV136(result) {
  if (!result || result.error) return "missing";
  return result.value?.status || result.value?.summary?.status || "missing";
}

/**
 * Wording that describes the internal store rather than the data a reader came
 * for. These must not appear as public copy on a default screen. Terms that a
 * reader genuinely needs (an explained missing-value reason, a unit, a source
 * name) are deliberately absent from this list.
 */
export const INTERNAL_PUBLIC_TOKENS_V136 = Object.freeze([
  "실제 레코드",
  "분류 레코드",
  "주요 분류 차원",
  "공간표현",
  "공간 커버리지",
  "자료 커버리지",
  "결측 여부",
  "값 보유",
  "recordId",
  "indicatorId",
  "sourceRow",
  "sourceSheet",
  "renderer",
  "publication status",
]);

/** Generic copy that names a shelf or a system state instead of the data. */
export const AWKWARD_GENERIC_COPY_V136 = Object.freeze([
  "관련 자료",
  "분류별 근거 매트릭스",
  "범주 비교",
  "측정항목 1종",
]);

export const INTERNAL_TOKEN_PATTERN_SOURCE_V136 =
  "/실제\\\\s*레코드|분류\\\\s*레코드|주요\\\\s*분류\\\\s*차원|공간표현|공간\\\\s*커버리지|자료\\\\s*커버리지|결측\\\\s*여부|값\\\\s*보유|recordId|indicatorId|sourceRow|sourceSheet|\\\\bV1[23][0-9]\\\\b/u";

/**
 * Collects the visible text of a screen, one entry per meaningful block, so the
 * inventory records what a reader actually sees rather than the DOM tree.
 */
export function visibleTextInventoryExpressionV136() {
  return `(() => {
    const clean = (value) => String(value || '').normalize('NFC').replace(/\\s+/gu, ' ').trim();
    const visible = (node) => {
      const rect = node.getBoundingClientRect();
      const style = getComputedStyle(node);
      return rect.width > 0 && rect.height > 0 && style.display !== 'none' &&
        style.visibility !== 'hidden' && Number(style.opacity || 1) > 0;
    };
    const selector = 'h1, h2, h3, h4, h5, p, li, dt, dd, th, td, button, a, summary, span, strong, small, caption, label, option';
    const seen = new Set();
    const rows = [];
    document.querySelectorAll(selector).forEach((node) => {
      if (!visible(node)) return;
      const own = [...node.childNodes]
        .filter((child) => child.nodeType === 3)
        .map((child) => clean(child.textContent))
        .join(' ')
        .trim();
      if (!own) return;
      const key = node.tagName + '|' + own;
      if (seen.has(key)) return;
      seen.add(key);
      const section = node.closest('[data-testid]')?.getAttribute('data-testid') || '';
      rows.push({ tag: node.tagName, section, text: own });
    });
    return rows;
  })()`;
}
