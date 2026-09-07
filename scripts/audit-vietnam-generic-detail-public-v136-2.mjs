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
  loadPackPayloads,
  payloadRecords,
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
      // The portfolio composition chart names what the money went to. The year
      // trend beside it is numeric on purpose, so it is not read here.
      portfolioCategoryLabels: [
        ...document.querySelectorAll('[data-portfolio-distribution="true"]'),
      ]
        .filter((section) => section.getAttribute('data-testid') !== 'portfolio-year-trend-v132')
        .flatMap((section) => [...section.querySelectorAll('li > span')])
        .filter(visible)
        .map((node) => clean(node.textContent))
        .filter(Boolean),
      // Each composition bar with its count, so the grouping can be reconciled
      // against the source rather than merely read.
      portfolioCategoryBars: [
        ...document.querySelectorAll('[data-portfolio-distribution="true"]'),
      ]
        .filter((section) => section.getAttribute('data-testid') !== 'portfolio-year-trend-v132')
        .flatMap((section) => [...section.querySelectorAll('li')])
        .filter(visible)
        .map((node) => ({
          label: clean(node.querySelector('span')?.textContent),
          count: Number(String(clean(node.querySelector('strong')?.textContent)).replace(/[^0-9]/gu, '')),
        }))
        .filter((row) => row.label),
      portfolioRecordCount: Number(
        String(
          clean(
            document.querySelector('[data-portfolio-kpi="record-count"] strong')?.textContent
          )
        ).replace(/[^0-9]/gu, '')
      ),
      entityCardTitles: [
        ...document.querySelectorAll('[data-testid="public-entity-card-title"]'),
      ]
        .filter(visible)
        .map((node) => clean(node.textContent))
        .filter(Boolean),
      entityCardFactLabels: [
        ...document.querySelectorAll('[data-testid="public-entity-card-facts"] dt'),
      ]
        .filter(visible)
        .map((node) => clean(node.textContent))
        .filter(Boolean),
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

  // A composition bar is labelled with what it counts. A bare code, or a code
  // still carried in front of the name it maps to, is the store's key.
  for (const label of reading.portfolioCategoryLabels || []) {
    if (isNumericCodeList(label) || /^\d{2,}\s*[—–-]\s*\S/u.test(label)) {
      push("portfolio-raw-code-list", label);
    }
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
/** Every state of the investment portfolio screen, for the D-022 checks. */
const portfolioReadings = [];

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
    if (elementId === "D-022") portfolioReadings.push({ state: "default", reading });

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
        const state = `${select.testId || select.dimensionKey || select.index}=${value}`;
        findings.push(...findingsFor(elementId, state, next));
        if (elementId === "D-022") portfolioReadings.push({ state, reading: next });
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
audit.check("PORTFOLIO_RAW_CODE_LIST_COUNT", countOf("portfolio-raw-code-list") === 0, sample("portfolio-raw-code-list"), []);

// --- D-022: the card titles, and what the composition chart counts ---------
//
// The titles here were assembled by this repository, not collected: the source
// records carry `name: null`. So they are checked against the source rather
// than assumed, and the grouping is reconciled against it too, because the
// label a bar shows is now built by dropping a code out of the source value.

const packs = loadPackPayloads();
const d022Records = payloadRecords(packs.elements.get("D-022")?.entities);
const sourceCategoryCounts = new Map();
for (const record of d022Records) {
  const category = record?.normalizedAttributes?.field_a9a17396;
  if (!category) continue;
  sourceCategoryCounts.set(category, (sourceCategoryCounts.get(category) || 0) + 1);
}
const sourceCategoryTotal = [...sourceCategoryCounts.values()].reduce(
  (sum, value) => sum + value,
  0
);

// A code standing in front of a name, or an activity number, inside a heading.
const TITLE_INTERNAL_IDENTIFIER = /\d{4,}\s*[—–-]\s*\S|\b\d{4,}-P\d{6}\b|\bP\d{6}\b/u;
const titlesWithIdentifiers = [];
const groupingMismatches = [];
for (const { state, reading } of portfolioReadings) {
  for (const title of reading.entityCardTitles || []) {
    if (TITLE_INTERNAL_IDENTIFIER.test(title)) {
      titlesWithIdentifiers.push({ state, title });
    }
  }
  const bars = reading.portfolioCategoryBars || [];
  // The chart shows the leading bars only, so the whole grouping is compared
  // by what it does show: one bar per source category, and its own count.
  const shown = bars.length;
  const expectedShown = Math.min(sourceCategoryCounts.size, 8);
  if (shown !== expectedShown) {
    groupingMismatches.push({
      state,
      reason: "bar count",
      shown,
      expected: expectedShown,
    });
  }
  const expectedCounts = [...sourceCategoryCounts.values()].sort((a, b) => b - a).slice(0, 8);
  const shownCounts = bars.map((bar) => bar.count).sort((a, b) => b - a);
  if (JSON.stringify(shownCounts) !== JSON.stringify(expectedCounts)) {
    groupingMismatches.push({
      state,
      reason: "bar counts",
      shown: shownCounts,
      expected: expectedCounts,
    });
  }
  if (new Set(bars.map((bar) => bar.label)).size !== bars.length) {
    groupingMismatches.push({ state, reason: "duplicate bar label", shown: bars.map((b) => b.label) });
  }
  if ((reading.portfolioRecordCount || 0) !== d022Records.length) {
    groupingMismatches.push({
      state,
      reason: "project count",
      shown: reading.portfolioRecordCount,
      expected: d022Records.length,
    });
  }
}

const verifiedTitleStates = portfolioReadings.filter((entry) =>
  (entry.reading.entityCardFactLabels || []).includes("공식 영문명")
);

audit.check("D022_SOURCE_RECORDS", d022Records.length > 0, d022Records.length, ">0");
audit.check(
  "D022_CARD_TITLE_INTERNAL_IDENTIFIER_COUNT",
  titlesWithIdentifiers.length === 0,
  titlesWithIdentifiers.slice(0, 12),
  []
);
audit.check(
  "D022_OFFICIAL_TITLE_FACT_PRESENT",
  portfolioReadings.length > 0 && verifiedTitleStates.length === portfolioReadings.length,
  { states: portfolioReadings.length, withOfficialTitle: verifiedTitleStates.length },
  { states: portfolioReadings.length, withOfficialTitle: portfolioReadings.length }
);
audit.check(
  "CATEGORY_GROUPING_PRESERVED",
  groupingMismatches.length === 0,
  groupingMismatches.slice(0, 12),
  []
);
audit.check(
  "CATEGORY_SOURCE_TOTAL_RECONCILED",
  sourceCategoryTotal === d022Records.length,
  { sourceCategoryTotal, records: d022Records.length },
  { sourceCategoryTotal: d022Records.length, records: d022Records.length }
);
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
  d022SourceRecordCount: d022Records.length,
  d022SourceCategoryCount: sourceCategoryCounts.size,
  d022PortfolioStates: portfolioReadings.length,
  d022TitlesWithInternalIdentifiers: titlesWithIdentifiers.length,
  categoryGroupingMismatches: groupingMismatches.length,
  findingsByKind: Object.fromEntries(
    [...new Set(findings.map((item) => item.kind))].map((kind) => [kind, countOf(kind)])
  ),
  runtimeFailure,
});
