#!/usr/bin/env node

/**
 * V136.2 generic detail public acceptance.
 *
 * Earlier phases checked a representative dozen detail screens. That was enough
 * to miss this: the shared renderer behind most of the 152 elements was
 * printing its own internals into the copy - a KPI support line ending in
 * "1 · 2 · 3 ... 38", a selector labelled with the column key, a note about the
 * raw table. So this walks every detail route, and for the generic ones it also
 * changes the selectors, because the dump came back when the selection changed.
 */

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
import { detailUrlV135 } from "./v135/audit-helpers.mjs";
import { finishAuditV136, writeCsvV136 } from "./v136/audit-helpers.mjs";
import {
  IDENTIFIER_LABEL_PATTERN_V136_2,
  INTERNAL_AGGREGATION_COPY_V136_2,
  KPI_MAX_DIMENSIONS_V136_2,
  PUBLIC_MEASUREMENT_TERMS_V136_2,
  PUBLIC_RAW_TABLE_TERMS_V136_2,
  PUBLIC_RECORD_TERMS_V136_2,
} from "./v136-2/generic-detail-contract.mjs";

const audit = new AuditV125("generic-detail-public:v136-2");
const catalog = catalogElements(readJson(resolve(V2_ROOT, "catalog.json")).value);
const ELEMENT_IDS = catalog.map((item) => item.elementId);

const ANALYSIS_READY = `(() => {
  const root = document.querySelector('[data-testid="public-analysis-root"]');
  if (!root || root.getAttribute('data-analysis-state') !== 'ready') return false;
  return root.querySelectorAll('[data-testid="public-analysis-pending"]').length === 0;
})()`;

/** Everything a reader can see on a detail screen, grouped by where it sits. */
function screenReadingExpression() {
  return `(() => {
    const clean = (value) => String(value || '').normalize('NFC').replace(/\\s+/gu, ' ').trim();
    const visible = (node) => {
      if (!node) return false;
      const rect = node.getBoundingClientRect();
      const style = getComputedStyle(node);
      return rect.width > 0 && rect.height > 0 && style.display !== 'none' &&
        style.visibility !== 'hidden';
    };
    const main = document.querySelector('main') || document.body;
    const kpiRoot = document.querySelector('[data-testid="public-context-kpis"]');
    // The portfolio metric cards are a second headline surface. Reading only
    // the first one is how "…단순합" and an unscaled 1,876,471,402 survived a
    // pass that reported zero findings.
    const metricRoot = document.querySelector('[data-testid="public-metric-cards"]');
    const selectorRoot = document.querySelector('[data-testid="public-selector"]');
    return {
      generic: Boolean(document.querySelector('[data-testid="public-analytical-view"]')),
      title: clean(document.querySelector('[data-testid="public-data-title"]')?.textContent),
      kpis: [...(kpiRoot?.querySelectorAll('article') || [])].map((card) => {
        let dimensionValues = [];
        try {
          dimensionValues = JSON.parse(card.getAttribute('data-public-dimension-values') || '[]');
        } catch (error) {
          dimensionValues = [];
        }
        return {
          label: clean(card.querySelector('span')?.textContent),
          value: clean(card.querySelector('strong')?.textContent),
          support: clean(card.querySelector('small')?.textContent),
          dimensionCount: Number(card.getAttribute('data-public-dimension-count') || 0),
          dimensionValues,
        };
      }),
      metricCards: [...(metricRoot?.querySelectorAll('article') || [])].map((card) => ({
        label: clean(card.querySelector('span')?.textContent),
        value: clean(card.querySelector('strong')?.textContent),
        support: clean(card.querySelector('small')?.textContent),
      })),
      kpiNote: clean(kpiRoot?.querySelector('.sv125-kpi-note')?.textContent),
      selectorLabels: [...(selectorRoot?.querySelectorAll('label') || [])]
        .filter(visible)
        .map((label) => clean(label.querySelector('span')?.textContent))
        .filter(Boolean),
      headings: [...main.querySelectorAll('h2, h3, h4, summary')]
        .filter(visible)
        .map((node) => clean(node.textContent))
        .filter(Boolean),
      // Labels that announce a missing-value reason where the row is not missing.
      emptyMissingReasonLabels: [...main.querySelectorAll('dt, th, span')]
        .filter(visible)
        .filter((node) => /결측\\s*사유/u.test(clean(node.textContent)))
        .map((node) => {
          const holder = node.tagName === 'DT'
            ? node.nextElementSibling
            : node.parentElement;
          return clean(holder?.textContent);
        })
        .filter((value) => value === '' || value === '—' || value === '-'),
      text: clean(main.textContent),
    };
  })()`;
}

/** Selector options a generic screen offers, so the sweep can walk them. */
function selectorOptionsExpression() {
  return `(() => {
    const root = document.querySelector('[data-testid="public-selector"]');
    if (!root) return [];
    return [...root.querySelectorAll('select')].map((select, index) => ({
      index,
      testId: select.getAttribute('data-testid') || '',
      dimensionKey: select.getAttribute('data-public-dimension-key') || '',
      values: [...select.options].map((option) => option.value),
    }));
  })()`;
}

const identifierPattern = new RegExp(IDENTIFIER_LABEL_PATTERN_V136_2, "u");

/** A value that is a number, or a separator-joined run of nothing but numbers. */
function isNumericCodeList(value) {
  const parts = String(value)
    .split(/[·,/|;、]+/u)
    .map((part) => part.trim())
    .filter(Boolean);
  if (parts.length === 0) return false;
  return parts.every((part) => /^-?\d+(?:\.\d+)?$/u.test(part));
}

/** Judges one rendered screen against the public contract. */
function findingsFor(elementId, state, reading) {
  const findings = [];
  const push = (kind, detail) =>
    findings.push({ elementId, state, kind, detail: String(detail).slice(0, 220) });

  for (const term of PUBLIC_MEASUREMENT_TERMS_V136_2) {
    if (reading.text.includes(term)) push("measurement-term", term);
  }
  for (const term of PUBLIC_RECORD_TERMS_V136_2) {
    if (reading.text.includes(term)) push("record-term", term);
  }
  for (const term of PUBLIC_RAW_TABLE_TERMS_V136_2) {
    if (reading.text.includes(term)) push("raw-table-term", term);
  }

  for (const kpi of reading.kpis) {
    // Judge the dimensions the card actually declares, not the "·" characters
    // in the rendered line: one meaningful value ("감축 → SDG3·8·12·13·17")
    // carries separators of its own and is not a run of category codes.
    for (const value of kpi.dimensionValues || []) {
      if (isNumericCodeList(value)) push("kpi-raw-numeric-dimension-dump", value);
    }
    if ((kpi.dimensionCount || 0) > KPI_MAX_DIMENSIONS_V136_2) {
      push(
        "kpi-long-dimension-list",
        `${kpi.dimensionCount} dimensions: ${(kpi.dimensionValues || []).join(" | ")}`
      );
    }
    for (const phrase of INTERNAL_AGGREGATION_COPY_V136_2) {
      if (kpi.support.includes(phrase) || kpi.label.includes(phrase)) {
        push("kpi-internal-aggregation-copy", phrase);
      }
    }
  }
  for (const card of reading.metricCards || []) {
    for (const phrase of INTERNAL_AGGREGATION_COPY_V136_2) {
      if (card.label.includes(phrase) || card.support.includes(phrase)) {
        push("kpi-internal-aggregation-copy", `metric card: ${card.label}`);
      }
    }
    // A headline of ten or more digits has not been made readable.
    if (/\d{1,3}(?:,\d{3}){3,}/u.test(card.value)) {
      push("kpi-unscaled-large-number", `${card.label}: ${card.value}`);
    }
  }
  if (reading.kpiNote) push("kpi-generic-note", reading.kpiNote);

  for (const label of reading.selectorLabels) {
    if (identifierPattern.test(label)) {
      push("selector-internal-label", label);
    }
  }

  for (const value of reading.emptyMissingReasonLabels) {
    push("empty-missing-reason-label", `empty value: "${value}"`);
  }

  return findings;
}

let server = null;
let browser = null;
let runtimeFailure = null;
const findings = [];
const census = [];
let inspectedRoutes = 0;
let selectorStatesVisited = 0;

try {
  if (!existsSync(resolve(PROJECT_ROOT, "build/index.html"))) {
    throw new Error("production build missing; run npm run build first");
  }
  server = await startStaticBuildServer(resolve(PROJECT_ROOT, "build"));
  browser = await launchHeadlessBrowser();
  const cdp = browser.cdp;
  await setViewport(cdp, 1440, 1050);

  for (const elementId of ELEMENT_IDS) {
    await navigate(cdp, detailUrlV135(server.url, elementId));
    await waitForValue(cdp, ANALYSIS_READY, { timeoutMs: 45_000 });
    inspectedRoutes += 1;
    selectorStatesVisited += 1;

    const reading = await evaluateValue(cdp, screenReadingExpression());
    census.push({
      elementId,
      generic: reading.generic ? "true" : "false",
      title: reading.title,
      kpiCount: reading.kpis.length,
      selectorLabels: reading.selectorLabels.join(" | "),
    });
    findings.push(...findingsFor(elementId, "default", reading));

    if (!reading.generic) continue;

    // A generic screen's copy is rebuilt from whatever the new selection keys
    // the row by, so the state that shipped clean can come back dirty.
    const selects = await evaluateValue(cdp, selectorOptionsExpression());
    for (const select of selects || []) {
      const values = (select.values || []).filter(Boolean).slice(0, 3);
      for (const value of values) {
        const applied = await evaluateValue(
          cdp,
          `(() => {
            const root = document.querySelector('[data-testid="public-selector"]');
            const select = [...(root?.querySelectorAll('select') || [])][${select.index}];
            if (!(select instanceof HTMLSelectElement)) return false;
            if (![...select.options].some((option) => option.value === ${JSON.stringify(value)})) return false;
            if (select.value === ${JSON.stringify(value)}) return 'same';
            const setter = Object.getOwnPropertyDescriptor(
              window.HTMLSelectElement.prototype, 'value'
            ).set;
            setter.call(select, ${JSON.stringify(value)});
            select.dispatchEvent(new Event('change', { bubbles: true }));
            return true;
          })()`
        );
        if (applied === false) continue;
        await waitForValue(cdp, ANALYSIS_READY, { timeoutMs: 30_000 });
        selectorStatesVisited += 1;
        const next = await evaluateValue(cdp, screenReadingExpression());
        findings.push(
          ...findingsFor(elementId, `${select.testId || select.dimensionKey || select.index}=${value}`, next)
        );
      }
    }
  }
} catch (error) {
  runtimeFailure = error instanceof Error ? error.message : String(error);
} finally {
  if (browser) await browser.close();
  if (server) await server.close();
}

const genericRoutes = census.filter((row) => row.generic === "true");
const countOf = (kind) => findings.filter((item) => item.kind === kind).length;
const sample = (kind) =>
  findings.filter((item) => item.kind === kind).slice(0, 12);

audit.check("GENERIC_DETAIL_RUNTIME", runtimeFailure === null, { runtimeFailure }, { runtimeFailure: null });
audit.check("DETAIL_ROUTE_COUNT", inspectedRoutes === 152, inspectedRoutes, 152);
audit.check("GENERIC_DETAIL_ROUTE_COUNT", genericRoutes.length > 0, genericRoutes.length, ">0");
audit.check("PUBLIC_MEASUREMENT_TERM_COUNT", countOf("measurement-term") === 0, sample("measurement-term"), []);
audit.check("PUBLIC_RECORD_TERM_COUNT", countOf("record-term") === 0, sample("record-term"), []);
audit.check("PUBLIC_RAW_TABLE_TERM_COUNT", countOf("raw-table-term") === 0, sample("raw-table-term"), []);
audit.check("KPI_RAW_NUMERIC_DIMENSION_DUMP_COUNT", countOf("kpi-raw-numeric-dimension-dump") === 0, sample("kpi-raw-numeric-dimension-dump"), []);
audit.check("KPI_LONG_DIMENSION_LIST_COUNT", countOf("kpi-long-dimension-list") === 0, sample("kpi-long-dimension-list"), []);
audit.check("KPI_INTERNAL_AGGREGATION_COPY_COUNT", countOf("kpi-internal-aggregation-copy") === 0, sample("kpi-internal-aggregation-copy"), []);
audit.check("KPI_UNSCALED_LARGE_NUMBER_COUNT", countOf("kpi-unscaled-large-number") === 0, sample("kpi-unscaled-large-number"), []);
audit.check("KPI_GENERIC_NOTE_COUNT", countOf("kpi-generic-note") === 0, sample("kpi-generic-note"), []);
audit.check("GENERIC_SELECTOR_INTERNAL_LABEL_COUNT", countOf("selector-internal-label") === 0, sample("selector-internal-label"), []);
audit.check("EMPTY_MISSING_REASON_LABEL_COUNT", countOf("empty-missing-reason-label") === 0, sample("empty-missing-reason-label"), []);
audit.check("CONSOLE_ERROR", (browser?.runtimeErrors || []).length === 0, browser?.runtimeErrors || [], []);

writeCsvV136(
  "generic-detail-census-v136-2.csv",
  ["elementId", "generic", "title", "kpiCount", "selectorLabels"],
  census
);
writeCsvV136(
  "generic-detail-findings-v136-2.csv",
  ["elementId", "state", "kind", "detail"],
  findings
);

finishAuditV136(audit, "generic-detail-public-audit-v136-2.json", {
  detailRouteCount: inspectedRoutes,
  genericDetailRouteCount: genericRoutes.length,
  selectorStatesVisited,
  findingCount: findings.length,
  findingsByKind: Object.fromEntries(
    [...new Set(findings.map((item) => item.kind))].map((kind) => [kind, countOf(kind)])
  ),
  runtimeFailure,
});
