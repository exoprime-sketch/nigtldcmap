#!/usr/bin/env node

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

const audit = new AuditV125("data-summary:v127");
const catalogResult = readJson(resolve(V2_ROOT, "catalog.json"));
const catalog = catalogElements(catalogResult.value);
const packs = loadPackPayloads();

audit.check("CATALOG_JSON", catalogResult.error === null, catalogResult.error, null);
audit.check("CATALOG_ELEMENT_COUNT", catalog.length === 152, catalog.length, 152);
audit.check("PACK_PAYLOADS", packs.errors.length === 0, packs.errors.length, 0, packs.errors);
audit.check("ACCOUNTED_ELEMENT_COUNT", packs.elements.size === 152, packs.elements.size, 152);

function hasObservationValue(row) {
  if (row?.value === null || row?.value === undefined || row?.value === "") return false;
  if (typeof row.value === "number") return Number.isFinite(row.value);
  return String(row.value).trim().length > 0;
}

function hasEntityContent(row) {
  const name = String(row?.name || row?.entityName || "").trim();
  const attributes = row?.normalizedAttributes;
  const populatedAttributeCount =
    attributes && typeof attributes === "object" && !Array.isArray(attributes)
      ? Object.values(attributes).filter(
          (value) => value !== null && value !== undefined && String(value).trim() !== ""
        ).length
      : 0;
  return name.length > 0 || populatedAttributeCount > 0;
}

const summaries = new Map();
const reconciliationFailures = [];
for (const element of catalog) {
  const payload = packs.elements.get(element.elementId);
  if (!payload) {
    reconciliationFailures.push({ elementId: element.elementId, error: "payload missing" });
    continue;
  }
  const observations = payloadRecords(payload.observations);
  const entities = payloadRecords(payload.entities);
  const populatedObservations = observations.filter(hasObservationValue);
  const missingObservations = observations.filter((row) => !hasObservationValue(row));
  const populatedEntities = entities.filter(hasEntityContent);
  const emptyEntities = entities.filter((row) => !hasEntityContent(row));
  const populatedYears = populatedObservations
    .map((row) => Number(row.year))
    .filter(Number.isInteger);
  const indicatorCount = new Set(observations.map((row) => row.indicatorId).filter(Boolean)).size;
  const summary = {
    elementId: element.elementId,
    observationTotal: observations.length,
    populatedObservationCount: populatedObservations.length,
    missingObservationCount: missingObservations.length,
    populatedEntityCount: populatedEntities.length,
    emptyEntityCount: emptyEntities.length,
    indicatorCount,
    firstPopulatedYear: populatedYears.length > 0 ? Math.min(...populatedYears) : null,
    lastPopulatedYear: populatedYears.length > 0 ? Math.max(...populatedYears) : null,
  };
  summaries.set(element.elementId, summary);
  if (
    summary.populatedObservationCount + summary.missingObservationCount !==
      summary.observationTotal ||
    summary.populatedEntityCount + summary.emptyEntityCount !== entities.length
  ) {
    reconciliationFailures.push(summary);
  }
}

audit.check(
  "RECORD_CLASSIFICATION_RECONCILIATION",
  reconciliationFailures.length === 0,
  reconciliationFailures.length,
  0,
  reconciliationFailures
);

const a002 = summaries.get("A-002");
audit.check(
  "A002_POPULATED_OBSERVATION_COUNT",
  a002?.populatedObservationCount === 231,
  a002?.populatedObservationCount ?? null,
  231
);
audit.check(
  "A002_MISSING_OBSERVATION_COUNT",
  a002?.missingObservationCount === 189,
  a002?.missingObservationCount ?? null,
  189
);
audit.check(
  "A002_OBSERVATION_ROW_COUNT",
  a002?.observationTotal === 420,
  a002?.observationTotal ?? null,
  420
);
audit.check(
  "A002_INDICATOR_COUNT",
  a002?.indicatorCount === 21,
  a002?.indicatorCount ?? null,
  21
);
audit.check(
  "A002_POPULATED_YEAR_RANGE",
  a002?.firstPopulatedYear === 2005 && a002?.lastPopulatedYear === 2015,
  [a002?.firstPopulatedYear ?? null, a002?.lastPopulatedYear ?? null],
  [2005, 2015]
);

const missingCountedAsPopulated = [...summaries.values()].filter(
  (summary) =>
    summary.populatedObservationCount > summary.observationTotal ||
    summary.missingObservationCount < 0
);
audit.check(
  "MISSING_OBSERVATION_COUNTED_AS_POPULATED",
  missingCountedAsPopulated.length === 0,
  missingCountedAsPopulated.length,
  0,
  missingCountedAsPopulated
);

const pureEntitySummaries = [...summaries.values()].filter(
  (summary) => summary.observationTotal === 0 && summary.populatedEntityCount > 0
);
const entityDomFailures = [];
let a002Dom = null;
let server = null;
let browser = null;
let runtimeFailure = null;

async function inspectSummary(elementId) {
  const url = new URL(server.url);
  url.searchParams.set("view", "data");
  url.searchParams.set("country", "VNM");
  url.searchParams.set("element", elementId);
  url.hash = "element-detail";
  await navigate(browser.cdp, url.toString());
  await waitForValue(
    browser.cdp,
    `(() => {
      const root = document.querySelector('[data-testid="public-analysis-root"]');
      return Boolean(root && root.getAttribute('data-analysis-state') === 'ready');
    })()`,
    { timeoutMs: 20_000 }
  );
  return evaluateValue(
    browser.cdp,
    `(() => {
      const root = document.querySelector('[data-testid="public-analysis-root"]');
      const normalize = (value) => String(value || '').normalize('NFC')
        .replace(/[–—−]/gu, '~').replace(/\\s+/gu, ' ').trim();
      const summary = root?.querySelector('[data-testid="public-data-summary"]') ||
        root?.querySelector('.cev123-heading small');
      const raw = root?.querySelector('[data-testid="public-raw-table"]');
      const rawSummary = root?.querySelector('[data-testid="public-raw-table-summary"]') ||
        raw?.querySelector('summary');
      return {
        mounted: Boolean(root),
        summaryText: normalize(summary?.textContent),
        rawSummaryText: normalize(rawSummary?.textContent),
        bodyText: normalize(root?.textContent),
      };
    })()`
  );
}

try {
  server = await startStaticBuildServer(resolve(PROJECT_ROOT, "build"));
  browser = await launchHeadlessBrowser();
  await setViewport(browser.cdp, 1440, 1050);
  a002Dom = await inspectSummary("A-002");
  for (const summary of pureEntitySummaries) {
    try {
      const result = await inspectSummary(summary.elementId);
      const expected = `목록 ${summary.populatedEntityCount.toLocaleString("ko-KR")}건`;
      if (!result?.mounted || !result.summaryText.includes(expected)) {
        entityDomFailures.push({
          elementId: summary.elementId,
          expected,
          actual: result?.summaryText || null,
        });
      }
    } catch (error) {
      entityDomFailures.push({
        elementId: summary.elementId,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }
} catch (error) {
  runtimeFailure = error instanceof Error ? error.message : String(error);
} finally {
  if (browser) await browser.close();
  if (server) await server.close();
}

const a002SummaryText = String(a002Dom?.summaryText || "");
const a002RawSummaryText = String(a002Dom?.rawSummaryText || "");
audit.check(
  "A002_PUBLIC_SUMMARY_DOM",
  runtimeFailure === null &&
    /베트남\s*·\s*지표\s*21종\s*·\s*관측기간\s*2005~2015년/u.test(a002SummaryText) &&
    !/수치\s*420건/u.test(a002SummaryText),
  { summaryText: a002SummaryText, runtimeFailure },
  "베트남 · 지표 21종 · 관측기간 2005~2015년; no 수치 420건"
);
audit.check(
  "A002_RAW_TABLE_SUMMARY_DOM",
  /전체\s*420행/u.test(a002RawSummaryText) &&
    /값\s*있음\s*231행/u.test(a002RawSummaryText) &&
    /결측\s*189행/u.test(a002RawSummaryText),
  a002RawSummaryText,
  "전체 420행 · 값 있음 231행 · 결측 189행"
);
audit.check(
  "SUMMARY_TERMINOLOGY_USER_FACING",
  a002SummaryText.includes("공개 관측값") ||
    (a002SummaryText.includes("지표 21종") && a002SummaryText.includes("관측기간")),
  a002SummaryText,
  "공개 관측값 or semantic 지표/관측기간 summary"
);
audit.check(
  "ENTITY_SUMMARY_RECONCILIATION",
  runtimeFailure === null &&
    pureEntitySummaries.length > 0 &&
    entityDomFailures.length === 0,
  {
    inspected: pureEntitySummaries.length,
    failed: entityDomFailures.length,
    runtimeFailure,
  },
  { inspected: "> 0", failed: 0, runtimeFailure: null },
  entityDomFailures
);
audit.check(
  "UNCAUGHT_RUNTIME_ERROR",
  browser?.runtimeErrors?.length === 0,
  browser?.runtimeErrors?.length ?? null,
  0,
  browser?.runtimeErrors?.slice(0, 50)
);

audit.finish({
  accountedElements: summaries.size,
  a002PopulatedCount: a002?.populatedObservationCount ?? null,
  a002MissingCount: a002?.missingObservationCount ?? null,
  a002YearRange: [a002?.firstPopulatedYear ?? null, a002?.lastPopulatedYear ?? null],
  a002IndicatorCount: a002?.indicatorCount ?? null,
  entitySummaryRoutesInspected: pureEntitySummaries.length,
  entitySummaryFailures: entityDomFailures.length,
  missingObservationCountedAsPopulated: missingCountedAsPopulated.length,
  dataSummary: reconciliationFailures.length === 0 && entityDomFailures.length === 0 ? "PASS" : "FAIL",
  uncaughtRuntimeError: browser?.runtimeErrors?.length ?? null,
});
