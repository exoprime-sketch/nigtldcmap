#!/usr/bin/env node

import { existsSync } from "node:fs";
import { resolve } from "node:path";
import {
  AuditV125,
  PROJECT_ROOT,
  REPORT_ROOT,
  SEMANTIC_ROOT,
  V2_ROOT,
  catalogElements,
  countBy,
  pngDimensions,
  readJson,
  readText,
  visualizationContracts,
} from "./v125/audit-utils.mjs";
import {
  captureElementPng,
  evaluateValue,
  launchHeadlessBrowser,
  navigate,
  setViewport,
  startStaticBuildServer,
  waitForValue,
} from "./v125/browser-runtime.mjs";

const audit = new AuditV125("visual:v125");
const catalogResult = readJson(resolve(V2_ROOT, "catalog.json"));
const contractsResult = readJson(
  resolve(SEMANTIC_ROOT, "element-visualization-contracts-v125.json")
);
const catalog = catalogElements(catalogResult.value);
const contracts = visualizationContracts(contractsResult.value);
const contractById = new Map(contracts.map((contract) => [contract.elementId, contract]));

audit.check("CATALOG_JSON", catalogResult.error === null, catalogResult.error, null);
audit.check(
  "VISUALIZATION_CONTRACTS_JSON",
  contractsResult.error === null,
  contractsResult.error,
  null
);
audit.check("VISUAL_SMOKE_SCOPE", catalog.length === 152, catalog.length, 152);

const contractCoverageFailures = catalog.filter(
  (element) => !contractById.has(element.elementId)
);
audit.check(
  "VISUAL_CONTRACT_COVERAGE",
  contractCoverageFailures.length === 0,
  152 - contractCoverageFailures.length,
  152,
  contractCoverageFailures.map((element) => element.elementId)
);

const detailSource = readText(resolve(PROJECT_ROOT, "src/pages/CountryDataElementPage.tsx"));
const previewSource = readText(
  resolve(PROJECT_ROOT, "src/components/data/CountryDataFullPreviewV52.tsx")
);
const e012Source = readText(
  resolve(
    PROJECT_ROOT,
    "src/components/data/semantic/OccupationEmploymentWagePreviewV125.tsx"
  )
);
const archetypeSource = readText(
  resolve(
    PROJECT_ROOT,
    "src/components/data/semantic/SemanticArchetypePreviewV125.tsx"
  )
);
const explorerSource = readText(resolve(PROJECT_ROOT, "src/pages/DataExplorerPage.tsx"));

const staticVisualContract = {
  elementRootMarker:
    /data-v125-element-id/u.test(detailSource.value || "") ||
    /data-v125-element-id/u.test(previewSource.value || ""),
  rendererMarker:
    /data-v125-renderer/u.test(detailSource.value || "") ||
    /data-v125-renderer/u.test(previewSource.value || ""),
  tableFallback:
    /data-v125-table-fallback/u.test(detailSource.value || "") ||
    /data-v125-table-fallback/u.test(archetypeSource.value || "") ||
    /전체 원자료 표/u.test(detailSource.value || ""),
  emptyReason:
    /data-v125-empty-reason/u.test(detailSource.value || "") ||
    /emptyReason/u.test(detailSource.value || ""),
  e012KeyboardTooltip:
    /tabIndex=\{?0\}?/u.test(e012Source.value || "") &&
    /aria-label/u.test(e012Source.value || ""),
  e012TableFallback: /e012-raw-table/u.test(e012Source.value || ""),
  noFinderGeometryPreload:
    !/loadVietnamSpatialLayerV124|loadVietnamSpatialGeoJsonV124|vnm-adm1-63/iu.test(
      explorerSource.value || ""
    ),
};
audit.check(
  "STATIC_VISUAL_DOM_CONTRACT",
  Object.values(staticVisualContract).every(Boolean),
  staticVisualContract,
  Object.fromEntries(Object.keys(staticVisualContract).map((key) => [key, true]))
);

const screenshotDirectory = resolve(REPORT_ROOT, "screenshots");
const screenshotSpecifications = [
  {
    name: "e-012-employment-total.png",
    measure: "occupation_employment_count",
    sex: "total",
    selector: '[data-testid="e012-ranked-bars"]',
  },
  {
    name: "e-012-employment-sex.png",
    measure: "occupation_employment_share",
    sex: "female",
    selector: '[data-testid="e012-sex-comparison"]',
  },
  {
    name: "e-012-wage-total.png",
    measure: "occupation_wage",
    sex: "total",
    selector: '[data-testid="e012-ranked-bars"]',
  },
  {
    name: "e-012-employment-wage-scatter.png",
    measure: "occupation_employment_count",
    sex: "total",
    selector: '[data-testid="e012-employment-wage-scatter"]',
  },
];

let server = null;
let browser = null;
let runtimeFailure = null;
let runtimeBaseUrl = process.env.V125_RUNTIME_URL || null;
const routeResults = [];
const viewportResults = [];
let selectorRestoration = null;
let e012RuntimeContract = null;
let c016MapTransition = null;

const C016_MAP_HANDOFF = Object.freeze({
  elementId: "C-016",
  measure: "measure-05aa50767eb1",
  period: "2031-2035",
  year: "2031",
  category: "바이오매스발전(điện sinh khối)",
  mapVariable: "dien-sinh-khoi",
});

function elementUrl(baseUrl, elementId, selection = null) {
  const url = new URL(baseUrl);
  url.pathname = "/";
  url.search = "";
  url.searchParams.set("view", "data");
  url.searchParams.set("country", "VNM");
  url.searchParams.set("element", elementId);
  if (selection?.measure) url.searchParams.set("measure", selection.measure);
  if (selection?.sex) url.searchParams.set("sex", selection.sex);
  if (selection?.year) url.searchParams.set("year", String(selection.year));
  if (selection?.period) url.searchParams.set("period", selection.period);
  for (const [key, value] of Object.entries(selection?.dimensions || {}).sort(
    ([left], [right]) => left.localeCompare(right, "en")
  )) {
    if (key && value) url.searchParams.set(`dim.${key}`, String(value));
  }
  url.hash = "element-detail";
  return url.toString();
}

async function selectValue(cdp, testId, value) {
  return evaluateValue(
    cdp,
    `(() => {
      const select = document.querySelector('[data-testid="${testId}"]');
      if (!select) return { ok: false, error: 'missing' };
      const option = [...select.options].find((item) => item.value === ${JSON.stringify(value)});
      if (!option) return { ok: false, error: 'option', options: [...select.options].map((item) => item.value) };
      select.value = ${JSON.stringify(value)};
      select.dispatchEvent(new Event('input', { bubbles: true }));
      select.dispatchEvent(new Event('change', { bubbles: true }));
      return { ok: true, value: select.value };
    })()`
  );
}

try {
  if (!runtimeBaseUrl) {
    server = await startStaticBuildServer(resolve(PROJECT_ROOT, "build"));
    runtimeBaseUrl = server.url;
  }
  browser = await launchHeadlessBrowser();
  await setViewport(browser.cdp, 1440, 1100);
  const initialSelection = {
    measure: "occupation_wage",
    sex: "total",
    year: "2024",
  };
  await navigate(browser.cdp, elementUrl(runtimeBaseUrl, "E-012", initialSelection));
  await waitForValue(
    browser.cdp,
    `(() => {
      const root = document.querySelector('[data-v125-element-id="E-012"]');
      const error = document.querySelector('.cdp-alert--error');
      const semantic = document.querySelector('[data-testid="e012-semantic-preview"]');
      const loading = [...document.querySelectorAll('.cdp-empty')]
        .some((node) => node.textContent.includes('불러오는 중'));
      return root && !loading && (semantic || error) ? true : false;
    })()`,
    { timeoutMs: 30_000 }
  );
  selectorRestoration = await evaluateValue(
    browser.cdp,
    `(() => {
      const value = (id) => document.querySelector('[data-testid="' + id + '"]')?.value ?? null;
      return {
        elementRoot: Boolean(document.querySelector('[data-v125-element-id="E-012"]')),
        measure: value('e012-measure-select'),
        sex: value('e012-sex-select'),
        year: value('e012-year-select'),
        url: location.search
      };
    })()`
  );
  e012RuntimeContract = await evaluateValue(
    browser.cdp,
    `(() => {
      const raw = document.querySelector('[data-testid="e012-raw-table"]');
      const rows = [...(raw?.querySelectorAll('tbody tr') || [])];
      const recordIds = rows.map((row) => row.getAttribute('data-record-id')).filter(Boolean);
      const ranked = document.querySelector('[data-testid="e012-ranked-bars"]');
      const scatter = document.querySelector('[data-testid="e012-employment-wage-scatter"]');
      const sexComparison = document.querySelector('[data-testid="e012-sex-comparison"]');
      return {
        kpis: Boolean(document.querySelector('[data-testid="e012-kpis"]')),
        rawRowCount: rows.length,
        uniqueRecordIdCount: new Set(recordIds).size,
        missingWageNotice: Boolean(document.querySelector('[data-testid="e012-wage-missing-notice"]')),
        totalInRankedBars: Boolean(ranked?.querySelector('[data-occupation="all"]')),
        scatterPointCount: scatter?.querySelectorAll('[data-occupation]').length || 0,
        sexComparison: Boolean(sexComparison),
        sexComparisonRowCount: sexComparison?.querySelectorAll('[data-occupation]').length || 0
      };
    })()`
  );

  for (const element of catalog) {
    const contract = contractById.get(element.elementId);
    const targetUrl = elementUrl(runtimeBaseUrl, element.elementId);
    const beforeErrors = browser.runtimeErrors.length;
    await evaluateValue(
      browser.cdp,
      `(() => {
        history.pushState(null, '', ${JSON.stringify(targetUrl)});
        window.dispatchEvent(new PopStateEvent('popstate'));
        return location.href;
      })()`
    );
    let timedOut = false;
    let navigationMode = "spa-popstate";
    const readyExpression = `(() => {
      const root = document.querySelector('[data-v125-element-id=${JSON.stringify(element.elementId)}]');
      const renderer = document.querySelector(
        '[data-v125-element-id=${JSON.stringify(element.elementId)}][data-v125-renderer]'
      );
      const rendererState = renderer?.getAttribute('data-v125-renderer') || null;
      const error = document.querySelector('.cdp-alert--error');
      const loading = [...document.querySelectorAll('.cdp-empty')]
        .some((node) => node.textContent.includes('불러오는 중'));
      return Boolean(root && !loading && ((renderer && rendererState !== 'loading') || error));
    })()`;
    try {
      await waitForValue(
        browser.cdp,
        readyExpression,
        // SPA restoration is normally immediate on the local production
        // server. A bounded first attempt avoids multiplying a missed
        // popstate boundary across 152 routes; the identical assertion is
        // then retried by full navigation with the full 30-second budget.
        { timeoutMs: 5_000 }
      );
    } catch {
      // A full navigation is a retry of the same public route, not a relaxed
      // assertion. It eliminates a missed popstate/render boundary while all
      // DOM, renderer, error and reconciliation checks remain identical.
      navigationMode = "full-navigation-retry";
      try {
        await navigate(browser.cdp, targetUrl);
        await waitForValue(browser.cdp, readyExpression, { timeoutMs: 30_000 });
      } catch {
        timedOut = true;
      }
    }
    const result = await evaluateValue(
      browser.cdp,
      `(() => {
        const root = document.querySelector('[data-v125-element-id=${JSON.stringify(element.elementId)}]');
        const renderer = root?.querySelector(
          '[data-v125-element-id=${JSON.stringify(element.elementId)}][data-v125-renderer]'
        ) ||
          (root?.matches?.('[data-v125-renderer]') ? root : null);
        const normalize = (value) => String(value ?? '')
          .normalize('NFC')
          .replace(/\\s+/gu, ' ')
          .trim();
        const fallbackRoots = [...(root?.querySelectorAll('[data-v125-table-fallback]') || [])];
        const fallbackTables = fallbackRoots
          .map((node) => node.matches('table') ? node : node.querySelector('table'))
          .filter(Boolean);
        const fallbackRowCounts = fallbackTables.map(
          (table) => table.querySelectorAll('tbody tr').length
        );
        const semanticTable = root?.querySelector(
          '[data-v125-table-fallback="semantic-observations"] table'
        );
        const e012Table = root?.querySelector('[data-testid="e012-raw-table"]');
        const entityTables = [
          root?.querySelector('[data-testid="v125-entity-table-fallback"] table'),
          root?.querySelector('[data-v125-table-fallback="source-entities"]')
        ].filter(Boolean);
        const displayRoots = [
          root?.querySelector(
            '[data-testid^="v125-renderer-"], [data-testid="e012-semantic-preview"]'
          ),
          root?.querySelector('.sv125-kpis')
        ].filter((node, index, nodes) => node && nodes.indexOf(node) === index);
        const visualNodes = displayRoots
          .flatMap((displayRoot) => [
            ...displayRoot.querySelectorAll(
              '[role="listitem"], article, circle[aria-label], [tabindex="0"], tbody tr'
            )
          ])
          .filter((node) => !node.closest('details, [data-v125-table-fallback]'))
          .slice(0, 300);
        const primaryText = displayRoots.map((displayRoot) => {
          const clone = displayRoot.cloneNode(true);
          clone.querySelectorAll(
            'details, [data-v125-table-fallback], [data-testid="e012-raw-table"]'
          ).forEach((node) => node.remove());
          return normalize(clone.textContent || '');
        }).filter(Boolean).join(' ');
        const visualTexts = visualNodes
          .map((node) => normalize(
            [node.getAttribute?.('aria-label'), node.textContent].filter(Boolean).join(' ')
          ))
          .filter(Boolean);
        if (primaryText && !visualTexts.includes(primaryText)) visualTexts.push(primaryText);

        const missingValue = (value) =>
          !value || /^(?:—|-|미제공|원천 미제공(?:\\([^)]*\\))?)$/u.test(value);
        const dimensionValues = (value) => normalize(value)
          .split(' · ')
          .map((part) => part.includes(':') ? normalize(part.slice(part.indexOf(':') + 1)) : part)
          .filter(Boolean);
        const observationRows = [...((semanticTable || e012Table)?.querySelectorAll('tbody tr') || [])]
          .slice(0, 300)
          .map((row) => [...row.children].map((cell) => normalize(cell.textContent)));
        const observationMatch = observationRows.flatMap((cells) => {
          const e012 = Boolean(e012Table && !semanticTable);
          const value = cells[e012 ? 3 : 3] || '';
          const identities = e012
            ? [cells[0], cells[2], cells[5]].filter(Boolean)
            : [cells[0], ...dimensionValues(cells[2]), cells[5]].filter(Boolean);
          if (missingValue(value)) return [];
          const visualText = visualTexts.find(
            (text) => text.includes(value) && identities.some(
              (identity) => identity.length > 1 && text.includes(identity)
            )
          );
          return visualText
            ? [{ kind: e012 ? 'e012-observation' : 'semantic-observation', value, identity: identities.find((identity) => visualText.includes(identity)) || null }]
            : [];
        })[0] || null;
        const entityNames = entityTables.flatMap((table) =>
          [...table.querySelectorAll('tbody tr')]
            .slice(0, 100)
            .map((row) => normalize(row.querySelector('th, td')?.textContent))
            .filter(Boolean)
        );
        const entityMatchName = entityNames.find((name) =>
          name.length > 1 && visualTexts.some((text) => text.includes(name))
        ) || null;
        const reconciliation = observationMatch ||
          (entityMatchName ? { kind: 'entity', identity: entityMatchName, value: null } : null);
        const empty = root?.querySelector('[data-v125-empty-reason], .cdp-empty, [role="status"]');
        const alert = document.querySelector('.cdp-alert--error');
        return {
          rootFound: Boolean(root),
          renderer: renderer?.getAttribute('data-v125-renderer') || null,
          tableFallbackFound: fallbackTables.length > 0,
          nonEmptyTableFallbackFound: fallbackRowCounts.some((count) => count > 0),
          tableRows: fallbackRowCounts.reduce((sum, count) => sum + count, 0),
          tableFallbackRowCounts: fallbackRowCounts,
          displayedRecordReconciled: Boolean(reconciliation),
          reconciliation,
          visualSampleCount: visualTexts.length,
          emptyReasonFound: Boolean(empty && empty.textContent.trim()),
          errorText: alert?.textContent?.trim() || null,
          horizontalOverflow: Math.max(0, document.documentElement.scrollWidth - document.documentElement.clientWidth),
          bodyTextLength: document.body.innerText.length
        };
      })()`
    );
    routeResults.push({
      elementId: element.elementId,
      publicStatus: element.publicStatus,
      dataPresenceStatus: element.dataPresenceStatus,
      expectedRenderer: contract?.primaryRenderer || null,
      timedOut,
      navigationMode,
      runtimeErrors: browser.runtimeErrors.length - beforeErrors,
      ...result,
    });
  }

  await evaluateValue(
    browser.cdp,
    `(() => {
      history.pushState(null, '', ${JSON.stringify(
        elementUrl(runtimeBaseUrl, "E-012", initialSelection)
      )});
      window.dispatchEvent(new PopStateEvent('popstate'));
      return true;
    })()`
  );
  await waitForValue(
    browser.cdp,
    `Boolean(document.querySelector('[data-testid="e012-semantic-preview"]'))`,
    { timeoutMs: 20_000 }
  );

  for (const width of [390, 768, 1024, 1440]) {
    await setViewport(browser.cdp, width, 1000);
    await new Promise((resolveWait) => setTimeout(resolveWait, 100));
    const result = await evaluateValue(
      browser.cdp,
      `(() => {
        const root = document.querySelector('[data-testid="e012-semantic-preview"]');
        const rect = root?.getBoundingClientRect();
        return {
          width: ${width},
          rootFound: Boolean(root),
          rootWidth: rect?.width || 0,
          documentWidth: document.documentElement.clientWidth,
          scrollWidth: document.documentElement.scrollWidth,
          horizontalOverflow: Math.max(0, document.documentElement.scrollWidth - document.documentElement.clientWidth)
        };
      })()`
    );
    viewportResults.push(result);
  }

  await setViewport(browser.cdp, 1440, 1100);
  for (const specification of screenshotSpecifications) {
    const measureResult = await selectValue(
      browser.cdp,
      "e012-measure-select",
      specification.measure
    );
    const sexResult = await selectValue(browser.cdp, "e012-sex-select", specification.sex);
    const yearResult = await selectValue(browser.cdp, "e012-year-select", "2024");
    if (!measureResult.ok || !sexResult.ok || !yearResult.ok) {
      throw new Error(
        `E-012 selector unavailable for ${specification.name}: ${JSON.stringify({
          measureResult,
          sexResult,
          yearResult,
        })}`
      );
    }
    await new Promise((resolveWait) => setTimeout(resolveWait, 150));
    await captureElementPng(
      browser.cdp,
      specification.selector,
      resolve(screenshotDirectory, specification.name)
    );
  }

  const c016RuntimeErrorsBefore = browser.runtimeErrors.length;
  c016MapTransition = {
    detail: null,
    map: null,
    runtimeErrorCount: null,
    runtimeErrors: [],
    error: null,
  };
  try {
    await navigate(
      browser.cdp,
      elementUrl(runtimeBaseUrl, C016_MAP_HANDOFF.elementId, {
        measure: C016_MAP_HANDOFF.measure,
        period: C016_MAP_HANDOFF.period,
        year: C016_MAP_HANDOFF.year,
        dimensions: { category: C016_MAP_HANDOFF.category },
      })
    );
    await waitForValue(
      browser.cdp,
      `(() => {
        const root = document.querySelector('[data-v125-element-id="C-016"]');
        const renderer = root?.matches?.('[data-v125-renderer]')
          ? root
          : root?.querySelector('[data-v125-renderer]');
        const rendererState = renderer?.getAttribute('data-v125-renderer') || null;
        const semantic = root?.querySelector('[data-testid="v125-semantic-visualization"]');
        const error = document.querySelector('.cdp-alert--error');
        const measure = root?.querySelector('[data-testid="v125-measure-select"]')?.value;
        const period = root?.querySelector('[data-testid="v125-period-select"]')?.value;
        const category = root?.querySelector('[data-v125-dimension-key="category"]')?.value;
        return Boolean(
          root &&
          rendererState !== 'loading' &&
          (error || (semantic &&
            measure === ${JSON.stringify(C016_MAP_HANDOFF.measure)} &&
            period === ${JSON.stringify(C016_MAP_HANDOFF.period)} &&
            category === ${JSON.stringify(C016_MAP_HANDOFF.category)}))
        );
      })()`,
      { timeoutMs: 30_000 }
    );
    c016MapTransition.detail = await evaluateValue(
      browser.cdp,
      `(() => {
        const root = document.querySelector('[data-v125-element-id="C-016"]');
        const value = (selector) => root?.querySelector(selector)?.value ?? null;
        const yearSelect = root?.querySelector('[data-testid="v125-year-select"]');
        const rows = [...(root?.querySelectorAll(
          '[data-v125-table-fallback="semantic-observations"] tbody tr'
        ) || [])];
        const visibleYears = [...new Set(rows.map((row) =>
          row.querySelector('td:nth-child(6)')?.textContent?.trim() || ''
        ).filter(Boolean))];
        const params = new URLSearchParams(location.search);
        return {
          rootFound: Boolean(root),
          renderer: root?.getAttribute('data-v125-renderer') ||
            root?.querySelector('[data-v125-renderer]')?.getAttribute('data-v125-renderer') || null,
          semanticFound: Boolean(root?.querySelector('[data-testid="v125-semantic-visualization"]')),
          measure: value('[data-testid="v125-measure-select"]'),
          period: value('[data-testid="v125-period-select"]'),
          category: value('[data-v125-dimension-key="category"]'),
          yearSelectPresent: Boolean(yearSelect),
          year: yearSelect?.value ?? null,
          tableRowCount: rows.length,
          visibleYears,
          url: {
            measure: params.get('measure'),
            period: params.get('period'),
            year: params.get('year'),
            category: params.get('dim.category')
          },
          errorText: document.querySelector('.cdp-alert--error')?.textContent?.trim() || null
        };
      })()`
    );

    const mapClickResult = await evaluateValue(
      browser.cdp,
      `(() => {
        const root = document.querySelector('[data-v125-element-id="C-016"]');
        const button = [...(root?.querySelectorAll('button') || [])].find(
          (node) => node.textContent?.trim() === '지도에서 보기'
        );
        if (!button) return { clicked: false, reason: 'map-button-missing' };
        button.click();
        return { clicked: true, disabled: button.disabled };
      })()`
    );
    if (!mapClickResult?.clicked || mapClickResult.disabled) {
      throw new Error(`C-016 map action unavailable: ${JSON.stringify(mapClickResult)}`);
    }
    await waitForValue(
      browser.cdp,
      `(() => {
        const page = document.querySelector('.cdp-map-page');
        const variable = document.querySelector('[data-testid="map-layer-variable-select"]');
        const period = document.querySelector('[data-testid="map-layer-period-select"]');
        const error = document.querySelector('.cdp-alert--error');
        return Boolean(
          page &&
          (error || (variable?.value === ${JSON.stringify(C016_MAP_HANDOFF.mapVariable)} &&
            period?.value === ${JSON.stringify(C016_MAP_HANDOFF.period)}))
        );
      })()`,
      { timeoutMs: 30_000 }
    );
    c016MapTransition.map = await evaluateValue(
      browser.cdp,
      `(() => {
        const params = new URLSearchParams(location.search);
        const variable = document.querySelector('[data-testid="map-layer-variable-select"]');
        const period = document.querySelector('[data-testid="map-layer-period-select"]');
        return {
          pageFound: Boolean(document.querySelector('.cdp-map-page')),
          variable: variable?.value ?? null,
          period: period?.value ?? null,
          variableOptions: variable ? [...variable.options].map((option) => option.value) : [],
          periodOptions: period ? [...period.options].map((option) => option.value) : [],
          url: {
            measure: params.get('measure'),
            period: params.get('period'),
            year: params.get('year'),
            category: params.get('dim.category')
          },
          hash: location.hash,
          errorText: document.querySelector('.cdp-alert--error')?.textContent?.trim() || null
        };
      })()`
    );
  } catch (error) {
    c016MapTransition.error = error instanceof Error ? error.message : String(error);
  } finally {
    c016MapTransition.runtimeErrorCount =
      browser.runtimeErrors.length - c016RuntimeErrorsBefore;
    c016MapTransition.runtimeErrors = browser.runtimeErrors.slice(c016RuntimeErrorsBefore);
  }
} catch (error) {
  runtimeFailure = error instanceof Error ? error.message : String(error);
} finally {
  if (browser) await browser.close();
  if (server) await server.close();
}

audit.check("LOCAL_PRODUCTION_RUNTIME_AVAILABLE", runtimeFailure === null, runtimeFailure, null);

const routeFailures = routeResults.filter((result) => {
  const populated = ["actual-records", "partial-records"].includes(result.dataPresenceStatus);
  const rendererMatches =
    result.renderer === result.expectedRenderer ||
    (result.elementId === "E-012" && result.renderer === "occupation-employment-wage");
  if (!result.rootFound || result.timedOut || result.errorText || result.runtimeErrors > 0) return true;
  if (result.horizontalOverflow > 1) return true;
  if (populated) {
    return (
      !rendererMatches ||
      !result.tableFallbackFound ||
      !result.nonEmptyTableFallbackFound ||
      !result.displayedRecordReconciled
    );
  }
  return result.expectedRenderer !== "status-only" || !result.emptyReasonFound;
});
audit.check(
  "ALL_ELEMENT_DOM_SMOKE",
  routeResults.length === 152 && routeFailures.length === 0,
  { tested: routeResults.length, failed: routeFailures.length },
  { tested: 152, failed: 0 },
  routeFailures.slice(0, 100)
);

const expectedPopulatedRouteCount = catalog.filter((element) =>
  ["actual-records", "partial-records"].includes(element.dataPresenceStatus)
).length;
const populatedRouteResults = routeResults.filter((result) =>
  ["actual-records", "partial-records"].includes(result.dataPresenceStatus)
);
const populatedReconciliationFailures = populatedRouteResults.filter(
  (result) =>
    !result.nonEmptyTableFallbackFound ||
    result.tableRows <= 0 ||
    !result.displayedRecordReconciled
);
audit.check(
  "POPULATED_TABLE_VALUE_DOM_RECONCILIATION",
  populatedRouteResults.length === expectedPopulatedRouteCount &&
    populatedReconciliationFailures.length === 0,
  {
    tested: populatedRouteResults.length,
    reconciled: populatedRouteResults.length - populatedReconciliationFailures.length,
    failed: populatedReconciliationFailures.length,
  },
  { tested: expectedPopulatedRouteCount, reconciled: expectedPopulatedRouteCount, failed: 0 },
  populatedReconciliationFailures.slice(0, 100).map((result) => ({
    elementId: result.elementId,
    renderer: result.renderer,
    tableRows: result.tableRows,
    tableFallbackRowCounts: result.tableFallbackRowCounts,
    visualSampleCount: result.visualSampleCount,
    reconciliation: result.reconciliation,
  }))
);

const runtimeErrorCount = browser?.runtimeErrors?.length || 0;
audit.check(
  "UNCAUGHT_RUNTIME_ERROR",
  runtimeFailure === null && runtimeErrorCount === 0,
  runtimeErrorCount,
  0,
  browser?.runtimeErrors?.slice(0, 100) || []
);
const overflowFailures = routeResults.filter((result) => result.horizontalOverflow > 1);
audit.check(
  "ELEMENT_HORIZONTAL_OVERFLOW",
  overflowFailures.length === 0,
  overflowFailures.length,
  0,
  overflowFailures.map((result) => ({
    elementId: result.elementId,
    horizontalOverflow: result.horizontalOverflow,
  }))
);

const emptyWithoutReason = routeResults.filter((result) => {
  const populated = ["actual-records", "partial-records"].includes(result.dataPresenceStatus);
  return populated
    ? !result.renderer || (!result.tableFallbackFound && result.bodyTextLength < 1)
    : !result.emptyReasonFound;
});
audit.check(
  "EMPTY_VISUALIZATION_WITHOUT_REASON",
  emptyWithoutReason.length === 0,
  emptyWithoutReason.length,
  0,
  emptyWithoutReason.map((result) => result.elementId)
);

const viewportFailures = viewportResults.filter(
  (result) => !result.rootFound || result.rootWidth <= 0 || result.horizontalOverflow > 1
);
audit.check(
  "RESPONSIVE_VIEWPORTS",
  viewportResults.length === 4 && viewportFailures.length === 0,
  viewportResults,
  "390, 768, 1024, 1440 with root and no horizontal overflow",
  viewportFailures
);

const selectorRestorationPass =
  selectorRestoration?.elementRoot === true &&
  selectorRestoration?.measure === "occupation_wage" &&
  selectorRestoration?.sex === "total" &&
  String(selectorRestoration?.year) === "2024";
audit.check(
  "E012_URL_SELECTOR_RESTORATION",
  selectorRestorationPass,
  selectorRestoration,
  { elementRoot: true, measure: "occupation_wage", sex: "total", year: "2024" }
);
const e012RuntimePass =
  e012RuntimeContract?.kpis === true &&
  e012RuntimeContract?.rawRowCount === 91 &&
  e012RuntimeContract?.uniqueRecordIdCount === 91 &&
  e012RuntimeContract?.missingWageNotice === true &&
  e012RuntimeContract?.totalInRankedBars === false &&
  e012RuntimeContract?.scatterPointCount === 9 &&
  e012RuntimeContract?.sexComparison === true &&
  e012RuntimeContract?.sexComparisonRowCount === 9;
audit.check(
  "E012_DOM_RECONCILIATION",
  e012RuntimePass,
  e012RuntimeContract,
  {
    kpis: true,
    rawRowCount: 91,
    uniqueRecordIdCount: 91,
    missingWageNotice: true,
    totalInRankedBars: false,
    scatterPointCount: 9,
    sexComparison: true,
    sexComparisonRowCount: 9,
  }
);

const screenshotResults = screenshotSpecifications.map((specification) => ({
  name: specification.name,
  ...pngDimensions(resolve(screenshotDirectory, specification.name)),
}));
const screenshotHashes = new Set(
  screenshotResults.map((result) => result.sha256).filter(Boolean)
);
const screenshotFailures = screenshotResults.filter(
  (result) =>
    result.error || result.width < 200 || result.height < 80 || Number(result.byteSize || 0) < 2_000
);
audit.check(
  "E012_SCREENSHOTS",
  screenshotFailures.length === 0 && screenshotHashes.size === 4,
  screenshotResults,
  "4 valid, non-empty and distinct PNG screenshots",
  screenshotFailures
);

const c016Detail = c016MapTransition?.detail;
const c016Map = c016MapTransition?.map;
const c016YearRestored =
  String(c016Detail?.year) === C016_MAP_HANDOFF.year ||
  (c016Detail?.yearSelectPresent === false &&
    c016Detail?.tableRowCount > 0 &&
    c016Detail?.visibleYears?.length === 1 &&
    String(c016Detail.visibleYears[0]) === C016_MAP_HANDOFF.year);
const c016MapTransitionPass =
  c016MapTransition?.error === null &&
  c016MapTransition?.runtimeErrorCount === 0 &&
  c016Detail?.rootFound === true &&
  c016Detail?.semanticFound === true &&
  c016Detail?.errorText === null &&
  c016Detail?.measure === C016_MAP_HANDOFF.measure &&
  c016Detail?.period === C016_MAP_HANDOFF.period &&
  c016Detail?.category?.normalize("NFC") === C016_MAP_HANDOFF.category.normalize("NFC") &&
  c016YearRestored &&
  c016Detail?.url?.measure === C016_MAP_HANDOFF.measure &&
  c016Detail?.url?.period === C016_MAP_HANDOFF.period &&
  c016Detail?.url?.year === C016_MAP_HANDOFF.year &&
  c016Detail?.url?.category?.normalize("NFC") === C016_MAP_HANDOFF.category.normalize("NFC") &&
  c016Map?.pageFound === true &&
  c016Map?.errorText === null &&
  c016Map?.variable === C016_MAP_HANDOFF.mapVariable &&
  c016Map?.period === C016_MAP_HANDOFF.period &&
  c016Map?.url?.measure === C016_MAP_HANDOFF.measure &&
  c016Map?.url?.period === C016_MAP_HANDOFF.period &&
  c016Map?.url?.year === C016_MAP_HANDOFF.year &&
  c016Map?.url?.category?.normalize("NFC") === C016_MAP_HANDOFF.category.normalize("NFC") &&
  c016Map?.hash === "#map";
audit.check(
  "C016_DETAIL_TO_MAP_SELECTOR_HANDOFF",
  c016MapTransitionPass,
  c016MapTransition,
  {
    detail: {
      elementId: C016_MAP_HANDOFF.elementId,
      measure: C016_MAP_HANDOFF.measure,
      period: C016_MAP_HANDOFF.period,
      year: C016_MAP_HANDOFF.year,
      category: C016_MAP_HANDOFF.category,
    },
    map: {
      variable: C016_MAP_HANDOFF.mapVariable,
      period: C016_MAP_HANDOFF.period,
      preservedUrlState: ["measure", "period", "year", "dim.category"],
      hash: "#map",
    },
    runtimeErrorCount: 0,
  }
);

const renderedByStatus = countBy(
  routeResults.filter((result) => !routeFailures.includes(result)),
  (result) => result.publicStatus
);
const statusOnlyRendered = routeResults.filter(
  (result) => result.expectedRenderer === "status-only" && !routeFailures.includes(result)
).length;

audit.finish({
  runtimeKind: process.env.V125_RUNTIME_URL ? "provided-local-runtime" : "local-production-build",
  actualElementsRendered: renderedByStatus.actual || 0,
  partialElementsRendered: renderedByStatus.partial || 0,
  authorizedElementsRendered: renderedByStatus["public-authorized"] || 0,
  statusOnlyElements: statusOnlyRendered,
  routeSmokeCount: routeResults.length,
  uncaughtRuntimeErrorCount: runtimeErrorCount,
  horizontalOverflowCount: overflowFailures.length + viewportFailures.length,
  emptyVisualizationWithoutReasonCount: emptyWithoutReason.length,
  screenshotCount: screenshotResults.filter((result) => !result.error).length,
  populatedTableValueReconciliationCount:
    populatedRouteResults.length - populatedReconciliationFailures.length,
  c016DetailToMapSelectorHandoff: c016MapTransitionPass ? "PASS" : "FAIL",
});
