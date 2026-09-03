#!/usr/bin/env node

import { existsSync } from "node:fs";
import { resolve } from "node:path";

import {
  AuditV125,
  PROJECT_ROOT,
  V2_ROOT,
  catalogElements,
  readJson,
} from "./v125/audit-utils.mjs";
import {
  evaluateValue,
  launchHeadlessBrowser,
  navigate,
  setViewport,
  startStaticBuildServer,
  waitForValue,
} from "./v125/browser-runtime.mjs";
import { detailUrlV135, finderUrlV135, mapUrlV135 } from "./v135/audit-helpers.mjs";
import { finishAuditV136, normalizeTextV136 } from "./v136/audit-helpers.mjs";

const audit = new AuditV125("duplicate-copy:v136");
const catalog = catalogElements(readJson(resolve(V2_ROOT, "catalog.json")).value);

const ANALYSIS_READY = `(() => {
  const root = document.querySelector('[data-testid="public-analysis-root"]');
  if (!root || root.getAttribute('data-analysis-state') !== 'ready') return false;
  return root.querySelectorAll('[data-testid="public-analysis-pending"]').length === 0;
})()`;

/**
 * Two duplication shapes are user visible: a word glued to itself because two
 * inline elements ran together ("발전소발전소"), and the same heading repeated
 * back to back. Both read as a rendering fault rather than as content.
 */
function duplicateExpression() {
  return `(() => {
    const clean = (value) => String(value || '').normalize('NFC').replace(/\\s+/gu, ' ').trim();
    const visible = (node) => {
      const rect = node.getBoundingClientRect();
      const style = getComputedStyle(node);
      return rect.width > 0 && rect.height > 0 && style.display !== 'none' &&
        style.visibility !== 'hidden' && Number(style.opacity || 1) > 0;
    };
    const glued = [];
    // Only a repeat produced by two adjacent elements running together counts.
    // A word repeated inside one piece of source text - an organisation named
    // 하트하트, for example - is real content, not a rendering fault.
    document.querySelectorAll('h1, h2, h3, h4, strong, button, a, li, dt, dd, span, p').forEach((node) => {
      if (!visible(node)) return;
      const parts = [...node.children]
        .filter((child) => visible(child))
        .map((child) => clean(child.textContent))
        .filter(Boolean);
      for (let index = 1; index < parts.length; index += 1) {
        const left = parts[index - 1];
        const right = parts[index];
        const boundary = (left.match(/[\\uAC00-\\uD7A3]{2,12}$/u) || [])[0];
        if (!boundary) continue;
        if (right.startsWith(boundary)) {
          glued.push({ text: clean(node.textContent).slice(0, 80), token: boundary, tag: node.tagName });
          break;
        }
      }
    });
    const headings = [...document.querySelectorAll('h1, h2, h3, h4')]
      .filter(visible)
      .map((node) => clean(node.textContent))
      .filter(Boolean);
    const repeatedHeadings = [];
    for (let index = 1; index < headings.length; index += 1) {
      if (headings[index] && headings[index] === headings[index - 1]) {
        repeatedHeadings.push(headings[index]);
      }
    }
    return { glued, repeatedHeadings };
  })()`;
}

let server = null;
let browser = null;
let runtimeFailure = null;
const findings = [];

try {
  if (!existsSync(resolve(PROJECT_ROOT, "build/index.html"))) {
    throw new Error("production build missing; run npm run build first");
  }
  server = await startStaticBuildServer(resolve(PROJECT_ROOT, "build"));
  browser = await launchHeadlessBrowser();
  await setViewport(browser.cdp, 1440, 1000);

  await navigate(browser.cdp, mapUrlV135(server.url));
  await waitForValue(
    browser.cdp,
    `document.querySelectorAll('[data-testid="map-all-data-layer-v135"]').length === 12`,
    { timeoutMs: 35_000 }
  );
  findings.push({ route: "map", ...(await evaluateValue(browser.cdp, duplicateExpression())) });

  await navigate(browser.cdp, finderUrlV135(server.url));
  await waitForValue(
    browser.cdp,
    `document.querySelectorAll('[data-testid="public-finder-card-v135"]').length > 0`,
    { timeoutMs: 35_000 }
  );
  findings.push({ route: "finder", ...(await evaluateValue(browser.cdp, duplicateExpression())) });

  for (const element of catalog) {
    const elementId = String(element.elementId || "");
    await navigate(browser.cdp, detailUrlV135(server.url, elementId));
    await waitForValue(browser.cdp, ANALYSIS_READY, { timeoutMs: 30_000 });
    findings.push({ route: elementId, ...(await evaluateValue(browser.cdp, duplicateExpression())) });
  }
} catch (error) {
  runtimeFailure = error instanceof Error ? error.message : String(error);
} finally {
  if (browser) await browser.close();
  if (server) await server.close();
}

const gluedFindings = findings.flatMap((row) =>
  (row.glued || []).map((item) => ({ route: row.route, ...item }))
);
const repeatedHeadingFindings = findings.flatMap((row) =>
  (row.repeatedHeadings || []).map((text) => ({ route: row.route, text: normalizeTextV136(text) }))
);
const duplicateCount = gluedFindings.length + repeatedHeadingFindings.length;

audit.check("DUPLICATE_COPY_RUNTIME", runtimeFailure === null, { runtimeFailure }, { runtimeFailure: null });
audit.check("INSPECTED_ROUTE_COUNT", findings.length >= 154, findings.length, ">=154");
audit.check("DUPLICATE_VISIBLE_COPY_COUNT", duplicateCount === 0, { glued: gluedFindings.slice(0, 20), repeatedHeadings: repeatedHeadingFindings.slice(0, 20) }, []);
audit.check("CONSOLE_ERROR", (browser?.runtimeErrors || []).length === 0, browser?.runtimeErrors || [], []);

finishAuditV136(audit, "duplicate-copy-audit-v136.json", {
  duplicateVisibleCopyCount: duplicateCount,
  gluedFindings: gluedFindings.slice(0, 40),
  repeatedHeadingFindings: repeatedHeadingFindings.slice(0, 40),
  inspectedRoutes: findings.length,
  runtimeFailure,
});
