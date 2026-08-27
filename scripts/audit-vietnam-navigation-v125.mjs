#!/usr/bin/env node

import { existsSync, readFileSync, statSync } from "node:fs";
import { resolve } from "node:path";
import ts from "typescript";
import {
  AuditV125,
  PROJECT_ROOT,
  V2_ROOT,
  catalogElements,
  parseCsv,
  publicUrlToPath,
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

const audit = new AuditV125("navigation:v125");
const catalogResult = readJson(resolve(V2_ROOT, "catalog.json"));
const mapResult = readJson(resolve(V2_ROOT, "map-index.json"));
const catalog = catalogElements(catalogResult.value);
const mapIndex = mapResult.value || {};
const activeLayers = (mapIndex.layers || []).filter(
  (layer) => layer?.active !== false && layer?.enabled !== false
);
const catalogIds = new Set(catalog.map((element) => element.elementId));

audit.check("CATALOG_JSON", catalogResult.error === null, catalogResult.error, null);
audit.check("MAP_INDEX_JSON", mapResult.error === null, mapResult.error, null);

const detailLinkFailures = activeLayers.flatMap((layer) => {
  const failures = [];
  let parsed = null;
  try {
    parsed = new URL(layer.detailUrl, "http://127.0.0.1");
  } catch {
    failures.push("invalid URL");
  }
  const elementToken = parsed?.searchParams.get("element")?.toUpperCase() || null;
  const country = parsed?.searchParams.get("country")?.toUpperCase() || null;
  if (!catalogIds.has(layer.elementId)) failures.push("catalog element missing");
  if (layer.detailElementId !== layer.elementId) failures.push("detailElementId mismatch");
  if (elementToken !== layer.elementId) failures.push("element query mismatch");
  if (country !== "VNM") failures.push("country query mismatch");
  if (parsed?.hash !== "#element-detail") failures.push("detail hash mismatch");
  return failures.length
    ? [{ elementId: layer.elementId, detailUrl: layer.detailUrl, failures }]
    : [];
});
audit.check(
  "BROKEN_DETAIL_LINK",
  detailLinkFailures.length === 0,
  detailLinkFailures.length,
  0,
  detailLinkFailures
);

function jsonRecordCount(document) {
  if (Array.isArray(document?.records)) return document.records.length;
  if (Array.isArray(document?.observations) || Array.isArray(document?.entities)) {
    return (document.observations?.length || 0) + (document.entities?.length || 0);
  }
  return null;
}

const downloadFailures = [];
let downloadLinkCount = 0;
let htmlReturnedForJson = 0;
for (const element of catalog) {
  for (const asset of element.downloadAssets || []) {
    downloadLinkCount += 1;
    const path = publicUrlToPath(asset.url);
    if (!path || !existsSync(path) || !statSync(path).isFile()) {
      downloadFailures.push({ elementId: element.elementId, url: asset.url, error: "missing" });
      continue;
    }
    const text = readFileSync(path, "utf8");
    if (/^\s*(?:<!doctype\s+html|<html)/iu.test(text)) {
      if (String(asset.format).toUpperCase() === "JSON") htmlReturnedForJson += 1;
      downloadFailures.push({
        elementId: element.elementId,
        url: asset.url,
        error: "HTML returned for data asset",
      });
      continue;
    }
    try {
      const format = String(asset.format || "").toUpperCase();
      const recordCount =
        format === "JSON"
          ? jsonRecordCount(JSON.parse(text))
          : format === "CSV"
          ? parseCsv(text).length
          : null;
      if (recordCount === null) throw new Error(`unsupported format ${asset.format}`);
      if (recordCount !== Number(asset.recordCount)) {
        throw new Error(`record count ${recordCount} != ${asset.recordCount}`);
      }
    } catch (error) {
      downloadFailures.push({
        elementId: element.elementId,
        url: asset.url,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }
}
audit.check(
  "BROKEN_DOWNLOAD_LINK",
  downloadLinkCount > 0 && downloadFailures.length === 0,
  { checked: downloadLinkCount, broken: downloadFailures.length },
  { checked: "> 0", broken: 0 },
  downloadFailures.slice(0, 100)
);

const jsonUrls = new Set([
  "/data/vietnam/v2/catalog.json",
  "/data/vietnam/v2/map-index.json",
  "/data/vietnam/v2/semantic/element-visualization-contracts-v125.json",
  "/data/vietnam/v2/geometry/vnm-adm1-63.geojson",
  "/data/vietnam/v2/geometry/vnm-transmission-network.geojson",
  ...activeLayers.flatMap((layer) => [layer.geometryUrl, layer.dataUrl]).filter(Boolean),
  ...catalog.flatMap((element) =>
    (element.downloadAssets || [])
      .filter((asset) => String(asset.format).toUpperCase() === "JSON")
      .map((asset) => asset.url)
  ),
]);
const jsonAssetFailures = [];
for (const url of jsonUrls) {
  const path = publicUrlToPath(url);
  if (!path || !existsSync(path) || !statSync(path).isFile()) {
    jsonAssetFailures.push({ url, error: "missing" });
    continue;
  }
  const text = readFileSync(path, "utf8");
  if (/^\s*(?:<!doctype\s+html|<html)/iu.test(text)) {
    htmlReturnedForJson += 1;
    jsonAssetFailures.push({ url, error: "HTML returned for JSON" });
    continue;
  }
  try {
    JSON.parse(text);
  } catch (error) {
    jsonAssetFailures.push({
      url,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}
audit.check(
  "HTML_RETURNED_FOR_JSON",
  htmlReturnedForJson === 0 && jsonAssetFailures.length === 0,
  { html: htmlReturnedForJson, invalid: jsonAssetFailures.length },
  { html: 0, invalid: 0 },
  jsonAssetFailures.slice(0, 100)
);

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

const finderStateSource = readText(resolve(PROJECT_ROOT, "src/types/dataFinderV125.ts"));
let urlRoundTrip = null;
let urlRoundTripError = null;
try {
  if (finderStateSource.error || !finderStateSource.value) {
    throw new Error(finderStateSource.error || "finder state source missing");
  }
  const stateApi = compileCommonJs(finderStateSource.value, "dataFinderV125.ts");
  const expected = {
    measure: "measure-05aa50767eb1",
    sex: "female",
    year: 2031,
    period: "2031-2035",
    dimensions: {
      category: "바이오매스발전(điện sinh khối)",
      region: "VNM-01",
      scenario: "SSP2-4.5",
    },
  };
  const params = new URLSearchParams("view=data&country=VNM&element=C-016");
  stateApi.appendDataFinderSelectorParamsV125(params, expected);
  const restored = stateApi.parseDataFinderSelectorStateV125(params);
  urlRoundTrip = {
    expected,
    restored,
    equal: stateApi.dataFinderSelectorStatesEqualV125(expected, restored),
    search: params.toString(),
  };
} catch (error) {
  urlRoundTripError = error instanceof Error ? error.message : String(error);
}
audit.check(
  "URL_SELECTOR_STATE_ROUND_TRIP",
  urlRoundTripError === null && urlRoundTrip?.equal === true,
  { error: urlRoundTripError, result: urlRoundTrip },
  { error: null, equal: true }
);

const bindingSource = readText(
  resolve(PROJECT_ROOT, "src/data/visualization/mapSelectorBindingsV125.ts")
);
let selectorBijection = null;
let selectorBijectionError = null;
try {
  if (bindingSource.error || !bindingSource.value) {
    throw new Error(bindingSource.error || "map selector binding source missing");
  }
  const bindingApi = compileCommonJs(bindingSource.value, "mapSelectorBindingsV125.ts");
  const cases = [
    {
      elementId: "A-024",
      map: { variable: "220", period: "2016" },
      filters: { status: "existing" },
    },
    {
      elementId: "B-033",
      map: { variable: "annual-tree-cover-loss", period: "2020" },
      filters: {},
    },
    {
      elementId: "B-034",
      map: { variable: "7f74ea9db7ec", period: "2025" },
      filters: {},
    },
    {
      elementId: "C-016",
      map: { variable: "dien-sinh-khoi", period: "2031-2035" },
      filters: {},
    },
    {
      elementId: "D-008",
      map: { variable: "provincial-climate-budget", period: "2010-2013" },
      filters: {},
    },
  ];
  selectorBijection = cases.map((entry) => {
    const layer = activeLayers.find((candidate) => candidate.elementId === entry.elementId);
    const semanticState = bindingApi.dataFinderSelectorFromMapV125(
      entry.elementId,
      entry.map,
      entry.filters
    );
    const returned = bindingApi.resolveMapSelectorBindingV125(
      entry.elementId,
      semanticState,
      layer?.selectors
    );
    return {
      ...entry,
      semanticState,
      returned,
      pass:
        returned.status === "matched" &&
        returned.variable === entry.map.variable &&
        returned.period === entry.map.period,
    };
  });
} catch (error) {
  selectorBijectionError = error instanceof Error ? error.message : String(error);
}
audit.check(
  "MAP_SEMANTIC_SELECTOR_BIJECTION",
  selectorBijectionError === null &&
    selectorBijection?.length === 5 &&
    selectorBijection.every((entry) => entry.pass),
  { error: selectorBijectionError, cases: selectorBijection },
  { error: null, cases: 5, allRoundTrips: true }
);

const appSource = readText(resolve(PROJECT_ROOT, "src/App.tsx"));
const detailSource = readText(resolve(PROJECT_ROOT, "src/pages/CountryDataElementPage.tsx"));
const mapSource = readText(resolve(PROJECT_ROOT, "src/pages/RealMapExplorerPage.tsx"));
const navigationSource = `${appSource.value || ""}\n${detailSource.value || ""}\n${
  mapSource.value || ""
}`;
const staticNavigationContract = {
  finderPassesSelection:
    /onOpenMapElement[\s\S]{0,300}selectorState/u.test(detailSource.value || ""),
  appSerializesSelection:
    /appendDataFinderSelectorParamsV125/u.test(appSource.value || "") &&
    /dataFinderSelectorState/u.test(appSource.value || ""),
  mapReceivesSelection:
    /selectorState:\s*DataFinderSelectorStateV125/u.test(mapSource.value || "") &&
    /selectorState:\s*sharedSelectorState/u.test(mapSource.value || ""),
  mapEmitsSelection:
    /onOpenElement[\s\S]{0,180}(?:semantic|selector|selection)/iu.test(
      mapSource.value || ""
    ),
  mapSyncsUrlSelection:
    /appendDataFinderSelectorParamsV125|onSelectorStateChange|onSemanticSelection/u.test(
      navigationSource
    ),
  mapCountryExtent: /fitBounds/u.test(mapSource.value || ""),
};
audit.check(
  "BIDIRECTIONAL_NAVIGATION_SOURCE_CONTRACT",
  Object.values(staticNavigationContract).every(Boolean),
  staticNavigationContract,
  Object.fromEntries(Object.keys(staticNavigationContract).map((key) => [key, true]))
);

const C016_STATE = {
  measure: "measure-05aa50767eb1",
  period: "2031-2035",
  year: "2031",
  category: "바이오매스발전(điện sinh khối)",
  mapVariable: "dien-sinh-khoi",
};
let server = null;
let browser = null;
let runtimeFailure = null;
let runtimeResult = null;
try {
  server = await startStaticBuildServer(resolve(PROJECT_ROOT, "build"));
  browser = await launchHeadlessBrowser();
  await setViewport(browser.cdp, 1440, 1100);
  const detailUrl = new URL(server.url);
  detailUrl.searchParams.set("view", "data");
  detailUrl.searchParams.set("country", "VNM");
  detailUrl.searchParams.set("element", "C-016");
  detailUrl.searchParams.set("measure", C016_STATE.measure);
  detailUrl.searchParams.set("year", C016_STATE.year);
  detailUrl.searchParams.set("period", C016_STATE.period);
  detailUrl.searchParams.set("dim.category", C016_STATE.category);
  detailUrl.hash = "element-detail";
  await navigate(browser.cdp, detailUrl.toString());
  await waitForValue(
    browser.cdp,
    `Boolean(document.querySelector('[data-v125-element-id="C-016"]'))`,
    { timeoutMs: 30_000 }
  );
  const finderToMap = await evaluateValue(
    browser.cdp,
    `(() => {
      const root = document.querySelector('[data-v125-element-id="C-016"]');
      const button = [...(root?.querySelectorAll('button') || [])]
        .find((node) => node.textContent?.trim() === '지도에서 보기');
      if (!button || button.disabled) return { clicked: false };
      button.click();
      return { clicked: true };
    })()`
  );
  if (!finderToMap?.clicked) throw new Error("Finder to Map action unavailable");
  await waitForValue(
    browser.cdp,
    `(() => {
      const variable = document.querySelector('[data-testid="map-layer-variable-select"]');
      const period = document.querySelector('[data-testid="map-layer-period-select"]');
      return Boolean(document.querySelector('.cdp-map-page') &&
        variable?.value === ${JSON.stringify(C016_STATE.mapVariable)} &&
        period?.value === ${JSON.stringify(C016_STATE.period)});
    })()`,
    { timeoutMs: 30_000 }
  );
  const mapState = await evaluateValue(
    browser.cdp,
    `(() => {
      const params = new URLSearchParams(location.search);
      const wrap = document.querySelector('.cdp-map-canvas-wrap');
      const fallback = document.querySelector('.cdp-map-fallback');
      const canvas = document.querySelector('.cdp-map-canvas');
      const fallbackStyle = fallback ? getComputedStyle(fallback) : null;
      const canvasStyle = canvas ? getComputedStyle(canvas) : null;
      const wrapRect = wrap?.getBoundingClientRect();
      const fallbackVisible = Boolean(fallback && fallbackStyle &&
        fallbackStyle.display !== 'none' && fallbackStyle.visibility !== 'hidden' &&
        Number(fallbackStyle.opacity || 1) > 0 && fallback.getBoundingClientRect().width > 0);
      const canvasVisible = Boolean(canvas && canvasStyle &&
        canvasStyle.display !== 'none' && canvasStyle.visibility !== 'hidden' &&
        Number(canvasStyle.opacity || 1) > 0 && canvas.getBoundingClientRect().width > 0);
      return {
        url: {
          measure: params.get('measure'),
          year: params.get('year'),
          period: params.get('period'),
          category: params.get('dim.category'),
          element: params.get('element'),
        },
        variable: document.querySelector('[data-testid="map-layer-variable-select"]')?.value ?? null,
        period: document.querySelector('[data-testid="map-layer-period-select"]')?.value ?? null,
        semanticPanel: Boolean(document.querySelector('[data-testid="map-semantic-contract"]')),
        wrap: { width: wrapRect?.width || 0, height: wrapRect?.height || 0 },
        fallbackVisible,
        canvasVisible,
      };
    })()`
  );
  const mapToFinder = await evaluateValue(
    browser.cdp,
    `(() => {
      const button = [...document.querySelectorAll(
        '[data-testid="map-feature-detail"] button, .cdp-map-evidence button'
      )]
        .find((node) => node.textContent?.trim() === '데이터 상세');
      if (!button || button.disabled) return { clicked: false };
      button.click();
      return { clicked: true };
    })()`
  );
  if (!mapToFinder?.clicked) throw new Error("Map to Finder action unavailable");
  await waitForValue(
    browser.cdp,
    `Boolean(document.querySelector('[data-v125-element-id="C-016"]'))`,
    { timeoutMs: 30_000 }
  );
  const returnedState = await evaluateValue(
    browser.cdp,
    `(() => {
      const params = new URLSearchParams(location.search);
      return {
        measure: params.get('measure'),
        year: params.get('year'),
        period: params.get('period'),
        category: params.get('dim.category'),
        element: params.get('element'),
        hash: location.hash,
        detailRoot: Boolean(document.querySelector('[data-v125-element-id="C-016"]')),
      };
    })()`
  );
  await navigate(browser.cdp, await evaluateValue(browser.cdp, "location.href"));
  await waitForValue(
    browser.cdp,
    `Boolean(document.querySelector('[data-v125-element-id="C-016"]'))`,
    { timeoutMs: 30_000 }
  );
  const reloadedState = await evaluateValue(
    browser.cdp,
    `(() => {
      const params = new URLSearchParams(location.search);
      return {
        measure: params.get('measure'),
        year: params.get('year'),
        period: params.get('period'),
        category: params.get('dim.category'),
        element: params.get('element'),
      };
    })()`
  );
  const httpAssets = await evaluateValue(
    browser.cdp,
    `(async () => {
      const urls = [
        '/data/vietnam/v2/map-index.json',
        '/data/vietnam/v2/geometry/vnm-adm1-63.geojson',
        '/data/vietnam/v2/geometry/vnm-transmission-network.geojson',
        '/data/vietnam/v2/semantic/elements/c-016.json',
        '/data/vietnam/v2/downloads/c-016.json'
      ];
      return Promise.all(urls.map(async (url) => {
        const response = await fetch(url, { cache: 'no-store' });
        const text = await response.text();
        let json = false;
        try { JSON.parse(text); json = true; } catch {}
        return {
          url,
          status: response.status,
          contentType: response.headers.get('content-type'),
          html: /^\\s*(?:<!doctype\\s+html|<html)/i.test(text),
          json,
        };
      }));
    })()`
  );
  runtimeResult = {
    mapState,
    returnedState,
    reloadedState,
    httpAssets,
    runtimeErrorCount: browser.runtimeErrors.length,
    runtimeErrors: browser.runtimeErrors.slice(0, 20),
  };
} catch (error) {
  runtimeFailure = error instanceof Error ? error.message : String(error);
} finally {
  if (browser) await browser.close();
  if (server) await server.close();
}

const expectedReturnedState = (state) =>
  state?.measure === C016_STATE.measure &&
  state?.year === C016_STATE.year &&
  state?.period === C016_STATE.period &&
  state?.category?.normalize("NFC") === C016_STATE.category.normalize("NFC") &&
  typeof state?.element === "string" && state.element.length > 0;
const runtimeAssetFailures = (runtimeResult?.httpAssets || []).filter(
  (asset) =>
    asset.status !== 200 ||
    asset.html === true ||
    asset.json !== true ||
    !/(?:application\/json|application\/geo\+json)/iu.test(asset.contentType || "")
);
const runtimeNavigationPass =
  runtimeFailure === null &&
  runtimeResult?.runtimeErrorCount === 0 &&
  runtimeResult?.mapState?.variable === C016_STATE.mapVariable &&
  runtimeResult?.mapState?.period === C016_STATE.period &&
  expectedReturnedState(runtimeResult?.mapState?.url) &&
  expectedReturnedState(runtimeResult?.returnedState) &&
  expectedReturnedState(runtimeResult?.reloadedState) &&
  runtimeResult?.returnedState?.detailRoot === true &&
  runtimeResult?.returnedState?.hash === "#element-detail";
audit.check(
  "FINDER_MAP_BIDIRECTIONAL_RUNTIME",
  runtimeNavigationPass,
  { failure: runtimeFailure, result: runtimeResult },
  {
    selector: C016_STATE,
    finderToMap: true,
    mapToFinder: true,
    reloadRestoration: true,
    runtimeErrorCount: 0,
  }
);
const blankMap = !(
  runtimeResult?.mapState?.wrap?.width > 300 &&
  runtimeResult?.mapState?.wrap?.height > 400 &&
  (runtimeResult?.mapState?.fallbackVisible || runtimeResult?.mapState?.canvasVisible)
);
audit.check(
  "BLANK_MAP",
  runtimeFailure === null && blankMap === false,
  { blankMap, map: runtimeResult?.mapState || null, failure: runtimeFailure },
  { blankMap: false, width: "> 300", height: "> 400", visiblePixels: true }
);
audit.check(
  "NETWORK_JSON_GEOJSON_200",
  runtimeFailure === null &&
    (runtimeResult?.httpAssets?.length || 0) === 5 &&
    runtimeAssetFailures.length === 0,
  { checked: runtimeResult?.httpAssets?.length || 0, failed: runtimeAssetFailures.length },
  { checked: 5, failed: 0 },
  runtimeAssetFailures
);
audit.check(
  "UNCAUGHT_RUNTIME_ERROR",
  runtimeFailure === null && runtimeResult?.runtimeErrorCount === 0,
  { failure: runtimeFailure, count: runtimeResult?.runtimeErrorCount ?? null },
  { failure: null, count: 0 },
  runtimeResult?.runtimeErrors || []
);

audit.finish({
  brokenDownloadLink: downloadFailures.length,
  brokenDetailLink: detailLinkFailures.length,
  htmlReturnedForJson,
  urlStateRestoration: runtimeNavigationPass ? "PASS" : "FAIL",
  crossNavigation: runtimeNavigationPass ? "PASS" : "FAIL",
  blankMap,
  uncaughtRuntimeError: runtimeResult?.runtimeErrorCount ?? null,
  networkJsonGeoJsonFailures: runtimeAssetFailures.length,
});
