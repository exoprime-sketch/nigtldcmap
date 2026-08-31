#!/usr/bin/env node

import { resolve } from "node:path";
import {
  AuditV125,
  PROJECT_ROOT,
  SEMANTIC_ROOT,
  V2_ROOT,
  catalogElements,
  loadPackPayloads,
  payloadRecords,
  readJson,
  visualizationContracts,
} from "./v125/audit-utils.mjs";
import {
  evaluateValue,
  launchHeadlessBrowser,
  navigate,
  setViewport,
  startStaticBuildServer,
  waitForValue,
} from "./v125/browser-runtime.mjs";

const audit = new AuditV125("finder-ux:v126");
const catalogResult = readJson(resolve(V2_ROOT, "catalog.json"));
const contractsResult = readJson(
  resolve(SEMANTIC_ROOT, "element-visualization-contracts-v125.json")
);
const catalog = catalogElements(catalogResult.value);
const contracts = visualizationContracts(contractsResult.value);
const contractById = new Map(contracts.map((contract) => [contract.elementId, contract]));
const packs = loadPackPayloads();

audit.check("CATALOG_JSON", catalogResult.error === null, catalogResult.error, null);
audit.check("SEMANTIC_CONTRACTS_JSON", contractsResult.error === null, contractsResult.error, null);
audit.check("PACK_PAYLOADS", packs.errors.length === 0, packs.errors.length, 0, packs.errors);

const routeFailures = [];
const primaryPanelFailures = [];
const fakeChartFailures = [];
const rawTableFailures = [];
const metadataFailures = [];
const blankPanelFailures = [];
const titleFailures = [];
const selectorLabelFailures = [];
const presentationIds = new Set();
const tierCounts = {
  specialized: 0,
  "analytical-archetype": 0,
  "structured-table": 0,
  "generic-fallback": 0,
  "status-only": 0,
};
let server = null;
let browser = null;
let runtimeFailure = null;

try {
  server = await startStaticBuildServer(resolve(PROJECT_ROOT, "build"));
  browser = await launchHeadlessBrowser();
  await setViewport(browser.cdp, 1440, 1050);

  for (const element of catalog) {
    const contract = contractById.get(element.elementId);
    const payload = packs.elements.get(element.elementId);
    const populatedObservationYears = payloadRecords(payload?.observations)
      .filter(
        (row) =>
          row.value !== null &&
          row.value !== undefined &&
          row.value !== "" &&
          Number.isInteger(row.year)
      )
      .map((row) => Number(row.year));
    const populatedEntityYears = payloadRecords(payload?.entities).flatMap((row) => {
      const attributes = row.normalizedAttributes || {};
      for (const key of [
        "referenceYear",
        "eventYear",
        "year",
        "approvalYear",
        "commissioningYear",
      ]) {
        const value = Number(attributes[key]);
        if (Number.isInteger(value)) return [value];
      }
      for (const key of ["approvalDate", "publicationDate", "signedDate"]) {
        const match = String(attributes[key] || "").match(/\b(?:19|20)\d{2}\b/u);
        if (match) return [Number(match[0])];
      }
      return [];
    });
    const expectedLatestPopulatedYear = populatedObservationYears.length > 0
      ? Math.max(...populatedObservationYears)
      : populatedEntityYears.length > 0
      ? Math.max(...populatedEntityYears)
      : ["actual-records", "partial-records"].includes(element.dataPresenceStatus) &&
        Number.isInteger(Number(element.latestYear))
      ? Number(element.latestYear)
      : null;
    const populated = ["actual-records", "partial-records"].includes(
      element.dataPresenceStatus
    );
    const expectedSources = Array.isArray(element.sourceOrganizations)
      ? element.sourceOrganizations.filter(Boolean)
      : [];
    const expectedUnits = [
      ...new Set(
        (contract?.measures || [])
          .map((measure) => String(measure.unit || "").trim())
          .filter(Boolean)
      ),
    ];
    const url = new URL(server.url);
    url.searchParams.set("view", "data");
    url.searchParams.set("country", "VNM");
    url.searchParams.set("element", element.elementId);
    url.hash = "element-detail";
    try {
      let result = null;
      let lastRouteError = null;
      for (let attempt = 1; attempt <= 2; attempt += 1) {
        try {
          await navigate(browser.cdp, url.toString());
          await waitForValue(
            browser.cdp,
            `(() => {
              const root = document.querySelector('[data-v126-public-analysis], [data-testid="public-analysis-root"]');
              if (document.querySelector('[role="alert"]')) return true;
              if (!root || !root.querySelector('[data-testid="public-data-title"]')) return false;
              if (!root.querySelector('[data-testid="public-analysis-primary"]')) return false;
              if (!root.querySelector('[data-testid="public-source-panel"]')) return false;
              return ${populated ? "Boolean(root.querySelector('details[data-testid=\"public-raw-table\"]'))" : "true"};
            })()`,
            { timeoutMs: 20_000 }
          );
          const inspected = await evaluateValue(
            browser.cdp,
            `(() => {
          const root = document.querySelector('[data-v126-public-analysis], [data-testid="public-analysis-root"]');
          const alert = document.querySelector('[role="alert"]')?.textContent?.trim() || null;
          if (!root) return { mounted: false, alert };
          const text = String(root.innerText || '').normalize('NFC');
          const lower = text.toLocaleLowerCase('ko-KR');
          const primary = root.querySelector('[data-testid="public-analysis-primary"]');
          const rawTable = root.querySelector('details[data-testid="public-raw-table"]');
          const sourcePanel = root.querySelector('[data-testid="public-source-panel"]');
          const title = root.querySelector('[data-testid="public-data-title"], h1, h2')?.textContent?.trim() || '';
          const selectorTexts = [...root.querySelectorAll(
            '[data-testid="public-selector"] label, [data-testid="public-selector"] option, [data-public-selector] label, [data-public-selector] option'
          )].map((node) => node.textContent?.trim() || '').filter(Boolean);
          const internalSelectorLabels = selectorTexts.filter((label) =>
            /(?:measure-[0-9a-f]{6,}|^[A-E]-\d{3}[_-][A-Za-z0-9_]+|INDICATOR=|COMP_BREAKDOWN|REF_AREA=|^[A-Z][A-Z0-9_]{3,}=)/iu.test(label)
          );
          const panels = [...root.querySelectorAll(
            'section[data-testid^="public-"], article[data-testid^="public-"]'
          )];
          const blankPanels = panels
            .filter((panel) => {
              const panelText = panel.textContent?.trim() || '';
              return !panelText && !panel.querySelector('svg, canvas, table, button, a, img');
            })
            .map((panel) => panel.getAttribute('data-testid'));
          const sourceText = String(sourcePanel?.innerText || '').normalize('NFC');
          const rawTableHeaders = [...(rawTable?.querySelectorAll('thead th') || [])]
            .map((node) => node.textContent?.trim() || '')
            .filter(Boolean);
          const forbiddenRawHeaders = rawTableHeaders.filter((header) =>
            /^(?:계열|추적\s*정보|원본\s*위치|원본\s*파일|원본\s*시트|원본\s*행|내부\s*코드)$/u.test(header)
          );
          const repeatedNotApplicable = [...(rawTable?.querySelectorAll('tbody td') || [])]
            .filter((cell) => cell.textContent?.trim() === '해당 없음').length;
          return {
            mounted: true,
            alert,
            elementId: root.getAttribute('data-element-id') || root.getAttribute('data-v126-element-id') || null,
            presentationId: root.getAttribute('data-presentation-id') || root.getAttribute('data-element-id') || root.getAttribute('data-v126-element-id') || null,
            tier: root.getAttribute('data-presentation-tier') || root.getAttribute('data-renderer-tier') || null,
            renderer: root.getAttribute('data-public-renderer') || null,
            title,
            hasPrimary: Boolean(primary),
            primaryMeaningful: Boolean(primary && ((primary.textContent?.trim()?.length || 0) > 0 || primary.querySelector('svg, canvas, table, [role="img"]'))),
            rootMeaningful: Boolean(text.trim() || root.querySelector('svg, canvas, table, [role="img"]')),
            chartCount: root.querySelectorAll('svg[role="img"], canvas, [data-chart], [data-testid$="-chart"]').length,
            rawTableExists: Boolean(rawTable),
            rawTableOpen: rawTable?.open ?? null,
            rawTableSummary: rawTable?.querySelector(':scope > summary')?.textContent?.trim() || null,
            rawTableHeaders,
            forbiddenRawHeaders,
            repeatedNotApplicable,
            sourcePanelExists: Boolean(sourcePanel),
            sourceText,
            yearPresent: ${JSON.stringify(expectedLatestPopulatedYear)} == null || lower.includes(String(${JSON.stringify(expectedLatestPopulatedYear)}).toLocaleLowerCase('ko-KR')),
            sourcePresent: ${JSON.stringify(expectedSources)}.length === 0 || ${JSON.stringify(expectedSources)}.some((source) => sourceText.toLocaleLowerCase('ko-KR').includes(String(source).normalize('NFC').toLocaleLowerCase('ko-KR'))),
            unitPresent: ${JSON.stringify(expectedUnits)}.length === 0 || ${JSON.stringify(expectedUnits)}.some((unit) => text.includes(String(unit).normalize('NFC'))),
            selectorTexts,
            internalSelectorLabels,
            blankPanels,
          };
        })()`
          );
          if (!inspected?.mounted || inspected.alert) {
            throw new Error(inspected?.alert || "public root missing");
          }
          result = inspected;
          lastRouteError = null;
          break;
        } catch (error) {
          lastRouteError = error instanceof Error ? error.message : String(error);
        }
      }

      if (!result) {
        routeFailures.push({
          elementId: element.elementId,
          error: lastRouteError || "public route inspection failed after 2 attempts",
        });
        continue;
      }
      if (result.elementId && result.elementId !== element.elementId) {
        routeFailures.push({ elementId: element.elementId, error: `rendered element mismatch: ${result.elementId}` });
      }
      if (result.presentationId) presentationIds.add(result.presentationId);
      if (Object.hasOwn(tierCounts, result.tier)) tierCounts[result.tier] += 1;
      else routeFailures.push({ elementId: element.elementId, error: `unknown presentation tier: ${result.tier}` });

      if (populated && (!result.hasPrimary || !result.primaryMeaningful)) {
        primaryPanelFailures.push({ elementId: element.elementId, publicStatus: element.publicStatus, result });
      }
      if (!populated) {
        if (result.tier !== "status-only" || result.chartCount > 0) {
          fakeChartFailures.push({
            elementId: element.elementId,
            dataPresenceStatus: element.dataPresenceStatus,
            tier: result.tier,
            chartCount: result.chartCount,
          });
        }
      }
      if (
        populated &&
        (!result.rawTableExists ||
          result.rawTableOpen !== false ||
          !String(result.rawTableSummary || "").startsWith("원자료 보기") ||
          result.forbiddenRawHeaders.length > 0 ||
          result.repeatedNotApplicable > 1)
      ) {
        rawTableFailures.push({
          elementId: element.elementId,
          result: {
            exists: result.rawTableExists,
            open: result.rawTableOpen,
            summary: result.rawTableSummary,
            headers: result.rawTableHeaders,
            forbiddenHeaders: result.forbiddenRawHeaders,
            repeatedNotApplicable: result.repeatedNotApplicable,
          },
        });
      }
      if (
        populated &&
        (!result.sourcePanelExists || !result.sourcePresent || !result.yearPresent ||
          (Number(element.observationCount || 0) > 0 && !result.unitPresent))
      ) {
        metadataFailures.push({
          elementId: element.elementId,
          sourcePanel: result.sourcePanelExists,
          source: result.sourcePresent,
          year: result.yearPresent,
          unit: result.unitPresent,
          expectedLatestPopulatedYear,
        });
      }
      if (!result.rootMeaningful || result.blankPanels.length > 0) {
        blankPanelFailures.push({ elementId: element.elementId, panels: result.blankPanels });
      }
      if (!result.title || /^(?:[A-E]-\d{3}|데이터 상세)$/u.test(result.title)) {
        titleFailures.push({ elementId: element.elementId, title: result.title });
      }
      if (result.internalSelectorLabels.length > 0) {
        selectorLabelFailures.push({ elementId: element.elementId, labels: result.internalSelectorLabels });
      }
    } catch (error) {
      routeFailures.push({
        elementId: element.elementId,
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

audit.check(
  "ELEMENT_PRESENTATION_COVERAGE",
  runtimeFailure === null && presentationIds.size === 152 && routeFailures.length === 0,
  { covered: presentationIds.size, total: catalog.length, failed: routeFailures.length, runtimeFailure },
  { covered: 152, total: 152, failed: 0, runtimeFailure: null },
  routeFailures.slice(0, 152)
);
audit.check(
  "POPULATED_PRIMARY_PANEL",
  primaryPanelFailures.length === 0,
  primaryPanelFailures.length,
  0,
  primaryPanelFailures.slice(0, 152)
);
audit.check("STATUS_ONLY_FAKE_CHART", fakeChartFailures.length === 0, fakeChartFailures.length, 0, fakeChartFailures);
audit.check("RAW_TABLE_DEFAULT_CLOSED", rawTableFailures.length === 0, rawTableFailures.length, 0, rawTableFailures);
audit.check("SOURCE_YEAR_UNIT_VISIBLE", metadataFailures.length === 0, metadataFailures.length, 0, metadataFailures.slice(0, 152));
audit.check("UNEXPLAINED_BLANK_PANEL", blankPanelFailures.length === 0, blankPanelFailures.length, 0, blankPanelFailures.slice(0, 152));
audit.check("USER_FACING_TITLE", titleFailures.length === 0, titleFailures.length, 0, titleFailures);
audit.check("SELECTOR_INTERNAL_CODE", selectorLabelFailures.length === 0, selectorLabelFailures.length, 0, selectorLabelFailures.slice(0, 152));

audit.finish({
  presentationCoverage: `${presentationIds.size}/152`,
  specializedRendererCount: tierCounts.specialized,
  analyticalArchetypeCount:
    tierCounts["analytical-archetype"] + tierCounts["structured-table"],
  genericFallbackCount: tierCounts["generic-fallback"],
  statusOnlyCount: tierCounts["status-only"],
  populatedPrimaryPanelFailures: primaryPanelFailures.length,
  fakeStatusCharts: fakeChartFailures.length,
  rawTableOpenByDefault: rawTableFailures.length,
  internalSelectorLabels: selectorLabelFailures.length,
});
