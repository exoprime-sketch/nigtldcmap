#!/usr/bin/env node

import { resolve } from "node:path";
import ts from "typescript";
import {
  AuditV125,
  PROJECT_ROOT,
  V2_ROOT,
  parseCsv,
  readJson,
  readText,
} from "./v125/audit-utils.mjs";
import {
  evaluateValue,
  launchHeadlessBrowser,
  navigate,
  setViewport,
  startStaticBuildServer,
  waitForValue,
} from "./v125/browser-runtime.mjs";

const audit = new AuditV125("cross-navigation:v126");
const mapResult = readJson(resolve(V2_ROOT, "map-index.json"));
const bundleIndexResult = readJson(resolve(V2_ROOT, "packs/bundle-index-v124.json"));
const bindingSource = readText(
  resolve(PROJECT_ROOT, "src/data/visualization/mapSelectorBindingsV125.ts")
);
const stateSource = readText(resolve(PROJECT_ROOT, "src/types/dataFinderV125.ts"));
const layers = Array.isArray(mapResult.value?.layers) ? mapResult.value.layers : [];
const activeLayers = layers.filter(
  (layer) => layer?.active !== false && layer?.enabled !== false
);

audit.check("MAP_INDEX_JSON", mapResult.error === null, mapResult.error, null);
audit.check("BUNDLE_INDEX_JSON", bundleIndexResult.error === null, bundleIndexResult.error, null);
audit.check("MAP_SELECTOR_BINDING_SOURCE", bindingSource.error === null, bindingSource.error, null);
audit.check("DATA_FINDER_STATE_SOURCE", stateSource.error === null, stateSource.error, null);

function compileCommonJs(source, fileName) {
  const result = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
    },
    fileName,
    reportDiagnostics: true,
  });
  const errors = (result.diagnostics || []).filter(
    (diagnostic) => diagnostic.category === ts.DiagnosticCategory.Error
  );
  if (errors.length) {
    throw new Error(
      errors
        .map((diagnostic) => ts.flattenDiagnosticMessageText(diagnostic.messageText, " "))
        .join("; ")
    );
  }
  const record = { exports: {} };
  new Function("exports", "module", "require", result.outputText)(
    record.exports,
    record,
    () => {
      throw new Error("unexpected runtime import");
    }
  );
  return record.exports;
}

let bindingApi = null;
let stateApi = null;
let compileError = null;
try {
  if (!bindingSource.value || !stateSource.value) throw new Error("source missing");
  bindingApi = compileCommonJs(bindingSource.value, "mapSelectorBindingsV125.ts");
  stateApi = compileCommonJs(stateSource.value, "dataFinderV125.ts");
} catch (error) {
  compileError = error instanceof Error ? error.message : String(error);
}

const roundTripInputs = [
  { elementId: "A-024", variable: "220", period: "2016", filters: { status: "existing" } },
  { elementId: "B-033", variable: "annual-tree-cover-loss", period: "2020", filters: {} },
  { elementId: "B-034", variable: "7f74ea9db7ec", period: "2025", filters: {} },
  { elementId: "C-016", variable: "dien-sinh-khoi", period: "2031-2035", filters: {} },
  { elementId: "D-008", variable: "provincial-climate-budget", period: "2010-2013", filters: {} },
];
const roundTrips = compileError
  ? []
  : roundTripInputs.map((entry) => {
      const layer = activeLayers.find((candidate) => candidate.elementId === entry.elementId);
      const semanticState = bindingApi.dataFinderSelectorFromMapV125(
        entry.elementId,
        { variable: entry.variable, period: entry.period },
        entry.filters
      );
      const params = new URLSearchParams();
      stateApi.appendDataFinderSelectorParamsV125(params, semanticState);
      const parsed = stateApi.parseDataFinderSelectorStateV125(params);
      const returned = bindingApi.resolveMapSelectorBindingV125(
        entry.elementId,
        parsed,
        layer?.selectors
      );
      return {
        ...entry,
        semanticState,
        serialized: params.toString(),
        parsed,
        returned,
        stateEqual: stateApi.dataFinderSelectorStatesEqualV125(semanticState, parsed),
        pass:
          stateApi.dataFinderSelectorStatesEqualV125(semanticState, parsed) &&
          returned.status === "matched" &&
          returned.variable === entry.variable &&
          returned.period === entry.period,
      };
    });

audit.check(
  "SELECTOR_STATE_BIJECTION",
  compileError === null && roundTrips.length === 5 && roundTrips.every((entry) => entry.pass),
  { compileError, cases: roundTrips.length, failed: roundTrips.filter((entry) => !entry.pass).length },
  { compileError: null, cases: 5, failed: 0 },
  roundTrips
);

const browserCases = [
  roundTrips.find((entry) => entry.elementId === "A-024"),
  roundTrips.find((entry) => entry.elementId === "C-016"),
  roundTrips.find((entry) => entry.elementId === "B-034"),
].filter(Boolean);
const a024NonSpatialEntry = {
  elementId: "A-024",
  semanticState: {
    measure: "measure-3c0cd69b4d6b",
    sex: null,
    year: 2024,
    period: "2024",
    dimensions: {
      category: "미공급률",
      detail: "전력 미공급 인구 비율",
    },
  },
};
const detailLinkFailures = activeLayers.flatMap((layer) => {
  try {
    const url = new URL(layer.detailUrl, "http://127.0.0.1");
    const element = (url.searchParams.get("element") || "").toUpperCase();
    const country = (url.searchParams.get("country") || "").toUpperCase();
    const failures = [];
    if (element !== layer.elementId) failures.push("element");
    if (country !== "VNM") failures.push("country");
    if (url.hash !== "#element-detail") failures.push("hash");
    if (layer.detailElementId !== layer.elementId) failures.push("detailElementId");
    return failures.length ? [{ elementId: layer.elementId, detailUrl: layer.detailUrl, failures }] : [];
  } catch (error) {
    return [{ elementId: layer.elementId, detailUrl: layer.detailUrl, failures: [error instanceof Error ? error.message : String(error)] }];
  }
});

audit.check(
  "MAP_DETAIL_LINK_CONTRACT",
  activeLayers.length === 12 && detailLinkFailures.length === 0,
  { checked: activeLayers.length, failures: detailLinkFailures.length },
  { checked: 12, failures: 0 },
  detailLinkFailures
);

const pointLayerPackFailures = activeLayers
  .filter((layer) => !layer.geometryUrl && !layer.dataUrl)
  .flatMap((layer) => {
    const packUrl = bundleIndexResult.value?.elements?.[layer.elementId]?.packUrl;
    return typeof packUrl === "string" && packUrl.startsWith("/data/vietnam/v2/packs/")
      ? []
      : [{ elementId: layer.elementId, packUrl: packUrl ?? null }];
  });
audit.check(
  "POINT_LAYER_PACK_LINK_CONTRACT",
  pointLayerPackFailures.length === 0,
  pointLayerPackFailures.length,
  0,
  pointLayerPackFailures
);

function buildFinderUrl(baseUrl, entry) {
  const url = new URL(baseUrl);
  url.searchParams.set("view", "data");
  url.searchParams.set("country", "VNM");
  url.searchParams.set("element", entry.elementId);
  stateApi.appendDataFinderSelectorParamsV125(url.searchParams, entry.semanticState);
  url.hash = "element-detail";
  return url.toString();
}

function stateExpression(entry) {
  return `(() => {
    const params = new URLSearchParams(location.search);
    return {
      elementToken: params.get('element'),
      measure: params.get('measure'),
      sex: params.get('sex'),
      year: params.get('year'),
      period: params.get('period'),
      dimensions: Object.fromEntries([...params.entries()]
        .filter(([key]) => key.startsWith('dim.'))
        .map(([key, value]) => [key.slice(4), value.normalize('NFC')])),
      variable: document.querySelector('[data-testid="map-layer-variable-select"]')?.value || null,
      selectedPeriod: document.querySelector('[data-testid="map-layer-period-select"]')?.value || null,
      statusFilter: document.querySelector('[data-testid="map-layer-filter-status"]')?.value || null,
      detailMounted: Boolean(document.querySelector('[data-testid="public-analysis-root"], [data-v126-public-analysis]')),
      mapMounted: Boolean(document.querySelector('[data-testid="public-map-root"], .cdp-map-page')),
      primaryElement: document.querySelector('[data-testid="map-public-content"]')?.getAttribute('data-primary-element') || null,
      contextElements: (document.querySelector('[data-testid="map-public-content"]')?.getAttribute('data-context-elements') || '').split(',').filter((value) => value && value !== 'none'),
      renderedElementId: document.querySelector('[data-testid="public-analysis-root"], [data-v126-public-analysis]')?.getAttribute('data-element-id') || null,
      hash: location.hash,
    };
  })()`;
}

function urlReadyExpression(entry, surface) {
  const expected = entry.semanticState;
  const dimensions = Object.entries(expected.dimensions || {});
  const dimensionChecks = dimensions
    .map(
      ([key, value]) =>
        `params.get(${JSON.stringify(`dim.${key}`)})?.normalize('NFC') === ${JSON.stringify(
          value.normalize("NFC")
        )}`
    )
    .join(" && ");
  const tokenCheck = entry.publicElementToken
    ? `params.get('element') === ${JSON.stringify(entry.publicElementToken)}`
    : `Boolean(params.get('element')) &&
      document.querySelector('[data-testid="public-analysis-root"], [data-v126-public-analysis]')?.getAttribute('data-element-id') === ${JSON.stringify(entry.elementId)}`;
  const periodCheck =
    expected.period === String(expected.year)
      ? `(params.get('period') === ${JSON.stringify(expected.period)} ||
          (params.get('period') === null && params.get('year') === ${JSON.stringify(String(expected.year))}))`
      : `params.get('period') === ${JSON.stringify(expected.period)}`;
  return `(() => {
    const params = new URLSearchParams(location.search);
    const dimensionKeys = [...params.keys()].filter((key) => key.startsWith('dim.'));
    return ${tokenCheck} &&
      params.get('measure') === ${JSON.stringify(expected.measure)} &&
      params.get('sex') === ${JSON.stringify(expected.sex)} &&
      params.get('year') === ${JSON.stringify(String(expected.year))} &&
      ${periodCheck} &&
      dimensionKeys.length === ${dimensions.length} &&
      ${dimensionChecks || "true"} &&
      location.hash === ${JSON.stringify(surface === "map" ? "#map" : "#element-detail")};
  })()`;
}

function selectorStateMatches(actual, entry, surface) {
  if (!actual) return false;
  const expected = entry.semanticState;
  const actualDimensions = Object.entries(actual.dimensions || {}).sort(([left], [right]) =>
    left.localeCompare(right)
  );
  const expectedDimensions = Object.entries(expected.dimensions || {}).sort(([left], [right]) =>
    left.localeCompare(right)
  );
  const dimensionsMatch =
    actualDimensions.length === expectedDimensions.length &&
    expectedDimensions.every(
      ([key, value], index) =>
        actualDimensions[index]?.[0] === key &&
        actualDimensions[index]?.[1]?.normalize("NFC") === value.normalize("NFC")
    );
  const paramsMatch =
    actual.elementToken === entry.publicElementToken &&
    actual.measure === expected.measure &&
    actual.sex === expected.sex &&
    actual.year === String(expected.year) &&
    (actual.period === expected.period ||
      (expected.period === String(expected.year) && actual.period === null)) &&
    dimensionsMatch;
  if (!paramsMatch) return false;
  if (surface === "map") {
    return actual.mapMounted === true &&
      actual.primaryElement === entry.elementId &&
      Array.isArray(actual.contextElements) && actual.contextElements.length === 0 &&
      actual.variable === entry.variable &&
      actual.selectedPeriod === entry.period &&
      (!entry.filters.status || actual.statusFilter === entry.filters.status);
  }
  return actual.detailMounted === true &&
    actual.renderedElementId === entry.elementId &&
    actual.hash === "#element-detail";
}

let server = null;
let browser = null;
let runtimeFailure = null;
const browserResults = [];
let httpAssets = [];
let runtimeErrorCount = null;
let runtimeErrors = [];
let runtimeDownloadResult = null;
let downloadRuntimeFailure = null;
let downloadRuntimeDiagnostic = null;
let a024NonSpatialResult = null;
try {
  if (compileError) throw new Error(compileError);
  server = await startStaticBuildServer(resolve(PROJECT_ROOT, "build"));
  browser = await launchHeadlessBrowser();
  await setViewport(browser.cdp, 1440, 1100);

  for (const entry of browserCases) {
    const result = { elementId: entry.elementId, stages: {}, failures: [] };
    try {
      await navigate(browser.cdp, buildFinderUrl(server.url, entry));
      await waitForValue(
        browser.cdp,
        `(() => {
          const root = document.querySelector('[data-testid="public-analysis-root"], [data-v126-public-analysis]');
          return Boolean(root && root.querySelector('[data-testid="public-data-title"]') && root.querySelector('[data-testid="public-analysis-primary"]'));
        })()`,
        { timeoutMs: 30_000 }
      );
      await waitForValue(browser.cdp, urlReadyExpression(entry, "detail"), {
        timeoutMs: 15_000,
      });
      result.stages.finderInitial = await evaluateValue(browser.cdp, stateExpression(entry));
      entry.publicElementToken = result.stages.finderInitial?.elementToken || null;
      if (!selectorStateMatches(result.stages.finderInitial, entry, "detail")) {
        result.failures.push("finder initial state");
      }

      const finderToMap = await evaluateValue(
        browser.cdp,
        `(() => {
          const button = [...document.querySelectorAll('button')]
            .find((node) => node.textContent?.trim() === '지도에서 보기');
          if (!button || button.disabled) return false;
          button.click();
          return true;
        })()`
      );
      if (!finderToMap) throw new Error("Finder to Map action unavailable");
      await waitForValue(
        browser.cdp,
        `(() => {
          const variable = document.querySelector('[data-testid="map-layer-variable-select"]');
          const period = document.querySelector('[data-testid="map-layer-period-select"]');
          const root = document.querySelector('[data-testid="map-public-content"]');
          return Boolean(root?.getAttribute('data-primary-element') === ${JSON.stringify(entry.elementId)} &&
            root.getAttribute('data-context-elements') === 'none' &&
            variable?.value === ${JSON.stringify(entry.variable)} &&
            period?.value === ${JSON.stringify(entry.period)});
        })()`,
        { timeoutMs: 35_000 }
      );
      await waitForValue(browser.cdp, urlReadyExpression(entry, "map"), {
        timeoutMs: 15_000,
      });
      result.stages.mapAfterFinder = await evaluateValue(browser.cdp, stateExpression(entry));
      if (!selectorStateMatches(result.stages.mapAfterFinder, entry, "map")) {
        result.failures.push("Finder to Map state");
      }

      const mapUrl = await evaluateValue(browser.cdp, "location.href");
      await navigate(browser.cdp, mapUrl);
      await waitForValue(
        browser.cdp,
        `(() => document.querySelector('[data-testid="map-public-content"]')?.getAttribute('data-primary-element') === ${JSON.stringify(entry.elementId)} &&
          document.querySelector('[data-testid="map-public-content"]')?.getAttribute('data-context-elements') === 'none' &&
          document.querySelector('[data-testid="map-layer-variable-select"]')?.value === ${JSON.stringify(entry.variable)} &&
          document.querySelector('[data-testid="map-layer-period-select"]')?.value === ${JSON.stringify(entry.period)})()`,
        { timeoutMs: 35_000 }
      );
      await waitForValue(browser.cdp, urlReadyExpression(entry, "map"), {
        timeoutMs: 15_000,
      });
      result.stages.mapReloaded = await evaluateValue(browser.cdp, stateExpression(entry));
      if (!selectorStateMatches(result.stages.mapReloaded, entry, "map")) {
        result.failures.push("map refresh state");
      }

      const mapToFinder = await evaluateValue(
        browser.cdp,
        `(() => {
          const buttons = [...document.querySelectorAll('[data-testid="map-selected-feature-panel"] button, [data-testid="map-feature-detail"] button, .cdp-map-evidence button')];
          const button = buttons.find((node) => node.textContent?.trim() === '데이터 상세');
          if (!button || button.disabled) return false;
          button.click();
          return true;
        })()`
      );
      if (!mapToFinder) throw new Error("Map to Finder action unavailable");
      await waitForValue(
        browser.cdp,
        `(() => {
          const root = document.querySelector('[data-testid="public-analysis-root"], [data-v126-public-analysis]');
          return Boolean(root && root.querySelector('[data-testid="public-data-title"]'));
        })()`,
        { timeoutMs: 30_000 }
      );
      await waitForValue(browser.cdp, urlReadyExpression(entry, "detail"), {
        timeoutMs: 15_000,
      });
      result.stages.finderAfterMap = await evaluateValue(browser.cdp, stateExpression(entry));
      if (!selectorStateMatches(result.stages.finderAfterMap, entry, "detail")) {
        result.failures.push("Map to Finder state");
      }

      const detailUrl = await evaluateValue(browser.cdp, "location.href");
      await navigate(browser.cdp, detailUrl);
      await waitForValue(
        browser.cdp,
        `Boolean(document.querySelector('[data-testid="public-analysis-root"] [data-testid="public-data-title"], [data-v126-public-analysis] [data-testid="public-data-title"]'))`,
        { timeoutMs: 30_000 }
      );
      await waitForValue(browser.cdp, urlReadyExpression(entry, "detail"), {
        timeoutMs: 15_000,
      });
      result.stages.finderReloaded = await evaluateValue(browser.cdp, stateExpression(entry));
      if (!selectorStateMatches(result.stages.finderReloaded, entry, "detail")) {
        result.failures.push("finder refresh state");
      }
    } catch (error) {
      result.failures.push(error instanceof Error ? error.message : String(error));
      try {
        result.diagnostic = await evaluateValue(
          browser.cdp,
          `(() => ({
            href: location.href,
            readyState: document.readyState,
            publicRoot: Boolean(document.querySelector('[data-testid="public-analysis-root"], [data-v126-public-analysis]')),
            publicTitle: Boolean(document.querySelector('[data-testid="public-data-title"]')),
            publicPrimary: Boolean(document.querySelector('[data-testid="public-analysis-primary"]')),
            alert: document.querySelector('[role="alert"]')?.textContent?.trim() || null,
            bodyText: document.body.innerText.slice(0, 500),
          }))()`
        );
      } catch {
        result.diagnostic = null;
      }
    }
    result.pass = result.failures.length === 0;
    browserResults.push(result);
  }

  try {
    await navigate(browser.cdp, buildFinderUrl(server.url, a024NonSpatialEntry));
    await waitForValue(
      browser.cdp,
      `(() => {
        const root = document.querySelector('[data-testid="public-analysis-root"], [data-v126-public-analysis]');
        return Boolean(root && root.getAttribute('data-element-id') === 'A-024' && root.querySelector('[data-testid="public-data-title"]'));
      })()`,
      { timeoutMs: 30_000 }
    );
    await waitForValue(browser.cdp, urlReadyExpression(a024NonSpatialEntry, "detail"), {
      timeoutMs: 15_000,
    });
    a024NonSpatialResult = await evaluateValue(
      browser.cdp,
      `(async () => {
        const action = document.querySelector('.cdp-detail-map-action');
        const button = [...(action?.querySelectorAll('button') || [])]
          .find((node) => node.textContent?.trim() === '지도에서 보기');
        const note = action?.querySelector('[role="note"]')?.textContent?.replace(/\\s+/gu, ' ').trim() || '';
        const hrefBefore = location.href;
        button?.click();
        await new Promise((resolveWait) => setTimeout(resolveWait, 150));
        return {
          buttonPresent: Boolean(button),
          buttonDisabled: Boolean(button?.disabled),
          explicitReason: /공간자료가 없어|지도에 연결하지 않/gu.test(note),
          note,
          hrefUnchanged: location.href === hrefBefore,
          mapMounted: Boolean(document.querySelector('[data-testid="map-public-content"], .cdp-map-page')),
          primaryElement: document.querySelector('[data-testid="map-public-content"]')?.getAttribute('data-primary-element') || null,
        };
      })()`
    );
  } catch (error) {
    a024NonSpatialResult = {
      failure: error instanceof Error ? error.message : String(error),
    };
    try {
      a024NonSpatialResult.diagnostic = await evaluateValue(
        browser.cdp,
        `(() => {
          const action = document.querySelector('.cdp-detail-map-action');
          const button = [...(action?.querySelectorAll('button') || [])]
            .find((node) => node.textContent?.trim() === '지도에서 보기');
          return {
            href: location.href,
            rootElement: document.querySelector('[data-testid="public-analysis-root"], [data-v126-public-analysis]')?.getAttribute('data-element-id') || null,
            buttonPresent: Boolean(button),
            buttonDisabled: Boolean(button?.disabled),
            note: action?.querySelector('[role="note"]')?.textContent?.replace(/\\s+/gu, ' ').trim() || '',
            bodyText: document.body.innerText.slice(0, 900),
          };
        })()`
      );
    } catch {
      a024NonSpatialResult.diagnostic = null;
    }
  }

  try {
  const downloadUrl = new URL(server.url);
  downloadUrl.searchParams.set("view", "download");
  downloadUrl.searchParams.set("country", "VNM");
  const downloadElementToken = browserCases[0]?.publicElementToken;
  if (!downloadElementToken) throw new Error("public download element token unavailable");
  downloadUrl.searchParams.set("element", downloadElementToken);
  downloadUrl.hash = "download";
  await navigate(browser.cdp, downloadUrl.toString());
  await waitForValue(
    browser.cdp,
    `(() => {
      const csv = document.querySelector('[data-testid="public-download-csv"]');
      const json = document.querySelector('[data-testid="public-download-json"]');
      const button = [...document.querySelectorAll('button')]
        .find((node) => node.textContent?.trim() === '다운로드');
      return Boolean(csv && json && button && !button.disabled);
    })()`,
    { timeoutMs: 35_000 }
  );
  await evaluateValue(
    browser.cdp,
    `(() => {
      window.__v126DownloadAudit = [];
      URL.createObjectURL = (blob) => {
        const entry = {
          href: 'blob:v126-audit-' + window.__v126DownloadAudit.length,
          type: blob.type,
          size: blob.size,
          filename: null,
          text: null,
          error: null,
        };
        window.__v126DownloadAudit.push(entry);
        blob.text()
          .then((text) => { entry.text = text; })
          .catch((error) => { entry.error = String(error); });
        return entry.href;
      };
      URL.revokeObjectURL = () => {};
      HTMLAnchorElement.prototype.click = function auditDownloadClick() {
        const entry = window.__v126DownloadAudit.find((item) => item.href === this.href) ||
          window.__v126DownloadAudit[window.__v126DownloadAudit.length - 1];
        if (entry) entry.filename = this.download || null;
      };
      return true;
    })()`
  );
  for (const format of ["csv", "json"]) {
    const clicked = await evaluateValue(
      browser.cdp,
      `(() => {
        const input = document.querySelector('[data-testid="public-download-${format}"]');
        if (!input) return false;
        input.click();
        const button = [...document.querySelectorAll('button')]
          .find((node) => node.textContent?.trim() === '다운로드');
        if (!button || button.disabled) return false;
        button.click();
        return true;
      })()`
    );
    if (!clicked) throw new Error(`${format.toUpperCase()} download action unavailable`);
    const expectedCount = format === "csv" ? 1 : 2;
    await waitForValue(
      browser.cdp,
      `(() => {
        const rows = window.__v126DownloadAudit || [];
        const button = [...document.querySelectorAll('button')]
          .find((node) => node.textContent?.trim() === '다운로드');
        return rows.length === ${expectedCount} &&
          typeof rows[${expectedCount - 1}]?.text === 'string' &&
          rows[${expectedCount - 1}].text.length > 0 &&
          button && !button.disabled;
      })()`,
      { timeoutMs: 40_000 }
    );
  }
  runtimeDownloadResult = await evaluateValue(
    browser.cdp,
    `window.__v126DownloadAudit`
  );
  } catch (error) {
    downloadRuntimeFailure = error instanceof Error ? error.message : String(error);
    try {
      downloadRuntimeDiagnostic = await evaluateValue(
        browser.cdp,
        `(() => ({
          href: location.href,
          csv: Boolean(document.querySelector('[data-testid="public-download-csv"]')),
          json: Boolean(document.querySelector('[data-testid="public-download-json"]')),
          buttons: [...document.querySelectorAll('button')].map((node) => ({
            text: node.textContent?.trim() || '',
            disabled: node.disabled,
          })).filter((item) => /\ub2e4\uc6b4\ub85c\ub4dc|\ud30c\uc77c/u.test(item.text)),
          alert: document.querySelector('[role="alert"]')?.textContent?.trim() || null,
          bodyText: document.body.innerText.slice(0, 700),
        }))()`
      );
    } catch {
      downloadRuntimeDiagnostic = null;
    }
  }

  const assetUrls = [...new Set([
    "/data/vietnam/v2/catalog.json",
    "/data/vietnam/v2/map-index.json",
    "/data/vietnam/v2/packs/bundle-index-v124.json",
    "/data/vietnam/v2/geometry/vnm-adm1-63.geojson",
    ...activeLayers.flatMap((layer) => [layer.geometryUrl, layer.dataUrl]).filter(Boolean),
    ...activeLayers
      .map((layer) => bundleIndexResult.value?.elements?.[layer.elementId]?.packUrl)
      .filter(Boolean),
  ])];
  httpAssets = await evaluateValue(
    browser.cdp,
    `(async () => Promise.all(${JSON.stringify(assetUrls)}.map(async (url) => {
      const response = await fetch(url, { cache: 'no-store' });
      const text = await response.text();
      let json = false;
      try { JSON.parse(text); json = true; } catch {}
      return {
        url,
        status: response.status,
        contentType: response.headers.get('content-type'),
        html: /^\\s*(?:<!doctype\\s+html|<html)/iu.test(text),
        json,
      };
    })))()`
  );
  runtimeErrorCount = browser.runtimeErrors.length;
  runtimeErrors = browser.runtimeErrors.slice(0, 20);
} catch (error) {
  runtimeFailure = error instanceof Error ? error.message : String(error);
} finally {
  if (browser) await browser.close();
  if (server) await server.close();
}

const httpFailures = httpAssets.filter(
  (asset) =>
    asset.status !== 200 ||
    asset.html === true ||
    asset.json !== true ||
    !/(?:application\/json|application\/geo\+json)/iu.test(asset.contentType || "")
);
const htmlReturnedForJson = httpAssets.filter((asset) => asset.html === true).length;
const browserFailures = browserResults.filter((entry) => !entry.pass);
const csvDownload = (runtimeDownloadResult || []).find((entry) =>
  /text\/csv/iu.test(entry?.type || "")
);
const jsonDownload = (runtimeDownloadResult || []).find((entry) =>
  /application\/json/iu.test(entry?.type || "")
);
let csvDownloadRows = [];
let jsonDownloadRows = [];
let jsonDownloadPayload = null;
let downloadParseError = null;
try {
  csvDownloadRows = csvDownload?.text ? parseCsv(csvDownload.text.replace(/^\uFEFF/u, "")) : [];
  jsonDownloadPayload = jsonDownload?.text ? JSON.parse(jsonDownload.text) : null;
  jsonDownloadRows = Array.isArray(jsonDownloadPayload)
    ? jsonDownloadPayload
    : Array.isArray(jsonDownloadPayload?.records)
      ? jsonDownloadPayload.records
      : [];
} catch (error) {
  downloadParseError = error instanceof Error ? error.message : String(error);
}
const technicalDownloadKey = /^(?:source_?file|source_?sheet|source_?row|attributes_?json|publication_?decision_?id|indicator_?id|record_?id|api_?params|pack_?url|shard_?id|sha256)$/iu;
function countTechnicalKeys(value) {
  if (Array.isArray(value)) return value.reduce((sum, item) => sum + countTechnicalKeys(item), 0);
  if (!value || typeof value !== "object") return 0;
  return Object.entries(value).reduce(
    (sum, [key, nested]) =>
      sum + (technicalDownloadKey.test(key) ? 1 : 0) + countTechnicalKeys(nested),
    0
  );
}
const runtimeDownloadTechnicalFieldCount =
  countTechnicalKeys(csvDownloadRows) + countTechnicalKeys(jsonDownloadPayload);
const runtimeDownloadFailures = [];
if (downloadRuntimeFailure) runtimeDownloadFailures.push(downloadRuntimeFailure);
if (!csvDownload || !/\.csv$/iu.test(csvDownload.filename || "")) {
  runtimeDownloadFailures.push("CSV Blob/filename");
}
if (!jsonDownload || !/\.json$/iu.test(jsonDownload.filename || "")) {
  runtimeDownloadFailures.push("JSON Blob/filename");
}
if (downloadParseError) runtimeDownloadFailures.push(downloadParseError);
if (csvDownloadRows.length === 0 || jsonDownloadRows.length === 0) {
  runtimeDownloadFailures.push("empty public download");
}
if (csvDownloadRows.length !== jsonDownloadRows.length) {
  runtimeDownloadFailures.push("CSV/JSON row mismatch");
}
if (runtimeDownloadTechnicalFieldCount !== 0) {
  runtimeDownloadFailures.push("technical download field");
}

audit.check(
  "A024_NONSPATIAL_SELECTOR_BLOCKED",
  runtimeFailure === null &&
    a024NonSpatialResult?.buttonPresent === true &&
    a024NonSpatialResult?.buttonDisabled === true &&
    a024NonSpatialResult?.explicitReason === true &&
    a024NonSpatialResult?.hrefUnchanged === true &&
    a024NonSpatialResult?.mapMounted === false &&
    !a024NonSpatialResult?.primaryElement,
  { result: a024NonSpatialResult, runtimeFailure },
  {
    buttonPresent: true,
    buttonDisabled: true,
    explicitReason: true,
    hrefUnchanged: true,
    mapMounted: false,
    primaryElement: null,
    runtimeFailure: null,
  }
);

audit.check(
  "FINDER_TO_MAP_SELECTOR_PRESERVATION",
  runtimeFailure === null &&
    browserResults.length === 3 &&
    browserResults.every((entry) => selectorStateMatches(entry.stages.mapAfterFinder, roundTrips.find((item) => item.elementId === entry.elementId), "map")),
  { checked: browserResults.length, failed: browserResults.filter((entry) => entry.failures.includes("Finder to Map state")).length, runtimeFailure },
  { checked: 3, failed: 0, runtimeFailure: null },
  browserFailures
);
audit.check(
  "MAP_TO_FINDER_SELECTOR_PRESERVATION",
  runtimeFailure === null &&
    browserResults.length === 3 &&
    browserResults.every((entry) => selectorStateMatches(entry.stages.finderAfterMap, roundTrips.find((item) => item.elementId === entry.elementId), "detail")),
  { checked: browserResults.length, failed: browserResults.filter((entry) => entry.failures.includes("Map to Finder state")).length, runtimeFailure },
  { checked: 3, failed: 0, runtimeFailure: null },
  browserFailures
);
audit.check(
  "URL_STATE_REFRESH_RESTORATION",
  runtimeFailure === null &&
    browserResults.length === 3 &&
    browserResults.every((entry) => {
      const expected = roundTrips.find((item) => item.elementId === entry.elementId);
      return selectorStateMatches(entry.stages.mapReloaded, expected, "map") &&
        selectorStateMatches(entry.stages.finderReloaded, expected, "detail");
    }),
      { checked: browserResults.length * 2, failedCases: browserFailures.length, runtimeFailure },
  { checked: 6, failedCases: 0, runtimeFailure: null },
  browserFailures
);
audit.check(
  "NETWORK_JSON_GEOJSON_200",
  runtimeFailure === null && httpAssets.length > 0 && httpFailures.length === 0,
  { checked: httpAssets.length, failed: httpFailures.length, runtimeFailure },
  { checked: "> 0", failed: 0, runtimeFailure: null },
  httpFailures
);
audit.check(
  "PUBLIC_DOWNLOAD_RUNTIME_ACTIONS",
  runtimeFailure === null &&
    downloadRuntimeFailure === null &&
    runtimeDownloadFailures.length === 0,
  {
    csvRows: csvDownloadRows.length,
    jsonRows: jsonDownloadRows.length,
    technicalFields: runtimeDownloadTechnicalFieldCount,
    failures: runtimeDownloadFailures.length,
    runtimeFailure,
    downloadRuntimeFailure,
  },
  {
    csvRows: "> 0",
    jsonRows: "= CSV rows",
    technicalFields: 0,
    failures: 0,
    runtimeFailure: null,
    downloadRuntimeFailure: null,
  },
  { failures: runtimeDownloadFailures, diagnostic: downloadRuntimeDiagnostic }
);
audit.check(
  "HTML_RETURNED_FOR_JSON",
  htmlReturnedForJson === 0,
  htmlReturnedForJson,
  0,
  httpAssets.filter((asset) => asset.html)
);
audit.check(
  "UNCAUGHT_RUNTIME_ERROR",
  runtimeFailure === null && runtimeErrorCount === 0,
  { count: runtimeErrorCount, runtimeFailure },
  { count: 0, runtimeFailure: null },
  runtimeErrors
);

audit.finish({
  selectorBijectionCases: roundTrips.length,
  a024NonSpatialSelectorBlocked:
    a024NonSpatialResult?.buttonDisabled === true &&
    a024NonSpatialResult?.explicitReason === true &&
    a024NonSpatialResult?.hrefUnchanged === true,
  finderToMapCases: browserResults.length - browserFailures.length,
  mapToFinderCases: browserResults.length - browserFailures.length,
  refreshRestorationCases: browserResults.length - browserFailures.length,
  crossNavigation: runtimeFailure === null && browserFailures.length === 0 ? "PASS" : "FAIL",
  urlStateRestoration: runtimeFailure === null && browserFailures.length === 0 ? "PASS" : "FAIL",
  brokenDetailLink: detailLinkFailures.length,
  brokenDownloadLink: runtimeDownloadFailures.length,
  publicDownloadTechnicalFieldCount: runtimeDownloadTechnicalFieldCount,
  publicDownloadRowReconciliation:
    runtimeDownloadFailures.length === 0 ? "PASS" : "FAIL",
  networkAssetFailures: httpFailures.length,
  htmlReturnedForJson,
  uncaughtRuntimeError: runtimeErrorCount,
});
