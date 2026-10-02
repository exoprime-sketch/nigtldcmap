#!/usr/bin/env node

import { spawnSync } from "node:child_process";
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { join, relative, resolve } from "node:path";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";
import { AuditV125, PROJECT_ROOT } from "./v125/audit-utils.mjs";
import {
  evaluateValue,
  launchHeadlessBrowser,
  navigate,
  startStaticBuildServer,
  waitForValue,
} from "./v125/browser-runtime.mjs";

// V162: one smoke per country. `--country VNM,BGD` (default: every live
// country in public/data/countries.json) runs the smoke once per country in
// its own process; a country that is not live yet is reported and skipped
// (it is smoked once it is published).
const argv = process.argv.slice(2);
const countryArgIndex = argv.indexOf("--country");
const registryV162 = JSON.parse(
  readFileSync(resolve(PROJECT_ROOT, "public/data/countries.json"), "utf8")
).countries || [];
const liveCountriesV162 = registryV162.filter((row) => row.status === "live").map((row) => row.iso3);
const requestedCountriesV162 = (countryArgIndex >= 0 ? String(argv[countryArgIndex + 1] || "") : "")
  .split(",")
  .map((value) => value.trim().toUpperCase())
  .filter(Boolean);
const countriesV162 = requestedCountriesV162.length ? requestedCountriesV162 : liveCountriesV162;
if (countriesV162.length > 1) {
  let failed = 0;
  for (const iso3 of countriesV162) {
    const child = spawnSync(process.execPath, [fileURLToPath(import.meta.url), "--country", iso3], {
      stdio: "inherit",
      env: process.env,
    });
    if (child.status !== 0) failed += 1;
  }
  process.exit(failed ? 1 : 0);
}
const COUNTRY_V162 = countriesV162[0] || "VNM";
const countryEntryV162 = registryV162.find((row) => row.iso3 === COUNTRY_V162);
if (!countryEntryV162 || countryEntryV162.status !== "live") {
  console.log(
    JSON.stringify({
      type: "summary",
      audit: "production-smoke:v128",
      country: COUNTRY_V162,
      status: "SKIPPED",
      reason: countryEntryV162
        ? `not live yet (status ${countryEntryV162.status}); smoked once published`
        : "not in the country registry",
    })
  );
  process.exit(countryEntryV162 ? 0 : 1);
}
const IS_DEFAULT_V162 = COUNTRY_V162 === "VNM";
const dataRootV162 = String(countryEntryV162.dataRoot || "/data/vietnam/v2").replace(/^\/+/u, "");
const localTreeV162 = resolve(PROJECT_ROOT, "public", dataRootV162);
const catalogV162 = JSON.parse(readFileSync(resolve(localTreeV162, "catalog.json"), "utf8")).elements || [];
const mapIndexV162 = existsSync(resolve(localTreeV162, "map-index.json"))
  ? JSON.parse(readFileSync(resolve(localTreeV162, "map-index.json"), "utf8"))
  : null;
const withDataV162 = catalogV162
  .filter((element) => !["excluded", "not-provided", "not-collected", "data-entry-planned", "schema-only"].includes(element.publicStatus))
  .map((element) => element.elementId);
// The default country keeps its original pages; another country smokes the
// same pages with ?country= and elements its catalog actually has.
const countryQueryV162 = IS_DEFAULT_V162 ? "" : `?country=${COUNTRY_V162}`;
const detailIdsV162 = [
  ...["A-002", "E-012"].filter((id) => withDataV162.includes(id)),
  ...withDataV162.filter((id) => id !== "A-002" && id !== "E-012"),
].slice(0, 2);
const finderQueryV162 = withDataV162.includes("A-002")
  ? "CPIA"
  : String(catalogV162.find((element) => element.elementId === detailIdsV162[0])?.publicTitle || "").split(/\s+/u)[0];
const powerLayerV162 = (mapIndexV162?.layers || []).some(
  (layer) => layer.elementId === "A-024" && layer.active !== false
);

const audit = new AuditV125("production-smoke:v128");
const configuredUrl = String(
  process.env.PRODUCTION_URL || process.env.V128_PRODUCTION_URL || ""
).trim();
const reportRoot = resolve(PROJECT_ROOT, "reports/v128");
const reportPath = resolve(
  reportRoot,
  IS_DEFAULT_V162 ? "production-smoke-v128.json" : `production-smoke-v128-${COUNTRY_V162.toLowerCase()}.json`
);
const buildRoot = resolve(PROJECT_ROOT, "build");

function normalizedBaseUrl(value) {
  const parsed = new URL(value);
  if (!/^https?:$/u.test(parsed.protocol)) {
    throw new Error("PRODUCTION_URL은 HTTP 또는 HTTPS 주소여야 합니다");
  }
  if (parsed.username || parsed.password) {
    throw new Error("PRODUCTION_URL에는 사용자명이나 비밀번호를 포함할 수 없습니다");
  }
  parsed.hash = "";
  parsed.search = "";
  if (!parsed.pathname.endsWith("/")) parsed.pathname += "/";
  return parsed.toString();
}

function at(baseUrl, suffix) {
  return new URL(String(suffix || "").replace(/^\/+/, ""), baseUrl).toString();
}

function wait(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

let localServer = null;
let browser = null;
let downloadRoot = null;
let baseUrl = null;
let runtimeFailure = null;
let failureSnapshot = null;
const consoleErrors = [];
const networkFailures = [];
const htmlForJson = [];
const routeResults = {};
const assetResults = [];
let uiResult = null;

try {
  if (configuredUrl) {
    baseUrl = normalizedBaseUrl(configuredUrl);
  } else {
    if (!existsSync(resolve(buildRoot, "index.html"))) {
      throw new Error("production build missing; run npm run build first");
    }
    localServer = await startStaticBuildServer(buildRoot);
    baseUrl = normalizedBaseUrl(`${localServer.url}/`);
  }

  const routeContracts = [
    ["home", "#home"],
    ["finder", "#explorer"],
    ["map", "#map"],
    ["download", "#download"],
    ["guide", "#guide"],
  ];
  for (const [key, hash] of routeContracts) {
    const response = await fetch(`${baseUrl}${hash}`, { cache: "no-store" });
    routeResults[key] = {
      status: response.status,
      contentType: response.headers.get("content-type") || "",
    };
  }

  const requiredAssets = IS_DEFAULT_V162
    ? [
        "data/vietnam/v2/manifest.json",
        "data/vietnam/v2/catalog.json",
        "data/vietnam/v2/map-index.json",
        "data/vietnam/v2/geometry/vnm-adm1-63.geojson",
        "data/vietnam/v2/geometry/vnm-transmission-network.geojson",
        "data/vietnam/v2/semantic/indicator-semantics-v125.json",
      ]
    : [
        // the country's own tree: what the local build ships must answer
        ...["manifest.json", "catalog.json", "map-index.json"]
          .filter((name) => existsSync(resolve(localTreeV162, name)))
          .map((name) => `${dataRootV162}/${name}`),
        ...(countryEntryV162.adm?.level1?.asset
          ? [String(countryEntryV162.adm.level1.asset).replace(/^\/+/u, "")]
          : []),
      ];
  for (const path of requiredAssets) {
    const response = await fetch(at(baseUrl, path), { cache: "no-store" });
    const contentType = response.headers.get("content-type") || "";
    const text = await response.text();
    let json = false;
    try {
      JSON.parse(text);
      json = true;
    } catch {
      json = false;
    }
    const html = /text\/html/iu.test(contentType) || /^\s*<!doctype\s+html/iu.test(text);
    const result = {
      path,
      status: response.status,
      contentType,
      bytes: Buffer.byteLength(text),
      json,
      html,
    };
    assetResults.push(result);
    if (response.status !== 200 || !json || html) networkFailures.push(result);
    if (html) htmlForJson.push(result);
  }

  browser = await launchHeadlessBrowser();
  await Promise.all([
    browser.cdp.send("Network.enable"),
    browser.cdp.send("Page.setDownloadBehavior", {
      behavior: "allow",
      downloadPath: (downloadRoot = mkdtempSync(join(tmpdir(), "nigt-v128-download-"))),
    }),
  ]);
  const base = new URL(baseUrl);
  browser.cdp.on("Runtime.consoleAPICalled", (params) => {
    if (params.type !== "error") return;
    consoleErrors.push(
      (params.args || []).map((item) => item.value ?? item.description ?? "").join(" ")
    );
  });
  browser.cdp.on("Network.responseReceived", (params) => {
    const response = params.response || {};
    const url = new URL(String(response.url || baseUrl));
    if (url.origin !== base.origin || !url.pathname.includes("/data/")) return;
    const contentType = String(response.mimeType || response.headers?.["content-type"] || "");
    if (Number(response.status) !== 200 || /text\/html/iu.test(contentType)) {
      networkFailures.push({
        path: url.pathname,
        status: Number(response.status || 0),
        contentType,
        json: false,
        html: /text\/html/iu.test(contentType),
      });
    }
  });

  await navigate(browser.cdp, `${baseUrl}${countryQueryV162}#home`);
  // V162 PR-D: the home has loaded when its status strip states the item
  // count. '152' only matched Viet Nam's home by chance (a map label "110 kV
  // 선로 152"); a country's home states its own public count.
  await waitForValue(
    browser.cdp,
    `/전체 데이터 항목\\s*\\d+개/u.test(document.querySelector('[data-v128-home]')?.textContent || '')`,
    { timeoutMs: 30_000 }
  );
  const home = await evaluateValue(
    browser.cdp,
    `(() => ({
      mounted: Boolean(document.querySelector('[data-v128-home]')),
      liveCount: /전체 데이터 항목\\s*\\d+개/u.test(document.querySelector('[data-v128-home]')?.textContent || '')
    }))()`
  );

  // V162: the search must list the searched dataset's card. Since V159 the
  // card shows the dataset name without the source acronym ('CPIA' is typed,
  // not shown), so the page text no longer carries the query itself.
  const searchedIdJson = JSON.stringify(detailIdsV162[0] || "");
  await navigate(
    browser.cdp,
    `${baseUrl}?${IS_DEFAULT_V162 ? "" : `country=${COUNTRY_V162}&`}q=${encodeURIComponent(finderQueryV162)}#explorer`
  );
  await waitForValue(
    browser.cdp,
    `Boolean(document.querySelector('h1')?.textContent?.includes('데이터 찾기') && document.querySelector('[data-testid="public-finder-card-v135"][data-element-id=' + JSON.stringify(${searchedIdJson}) + ']'))`,
    { timeoutMs: 30_000 }
  );
  const finder = await evaluateValue(
    browser.cdp,
    `(() => ({
      mounted: document.querySelector('h1')?.textContent?.includes('데이터 찾기') || false,
      query: ${JSON.stringify(finderQueryV162)},
      results: Number(document.querySelector('[data-testid="finder-results-v136"]')?.getAttribute('data-total-count') || 0),
      searchResult: Boolean(document.querySelector('[data-testid="public-finder-card-v135"][data-element-id=' + JSON.stringify(${searchedIdJson}) + ']'))
    }))()`
  );

  const detailResults = {};
  let tooltip = false;
  for (const elementId of detailIdsV162) {
    await navigate(
      browser.cdp,
      `${baseUrl}?country=${COUNTRY_V162}&element=${encodeURIComponent(elementId)}#element-detail`
    );
    await waitForValue(
      browser.cdp,
      `Boolean(document.querySelector('[data-element-id="${elementId}"]'))`,
      { timeoutMs: 30_000 }
    );
    detailResults[elementId] = await evaluateValue(
      browser.cdp,
      `(() => ({
        mounted: Boolean(document.querySelector('[data-element-id="${elementId}"]')),
        heading: document.querySelector('h1')?.textContent?.trim() || '',
        alert: Boolean(document.querySelector('[role="alert"]'))
      }))()`
    );
    if (elementId === "A-002") {
      await waitForValue(
        browser.cdp,
        `Boolean(document.querySelector('[data-chart-interaction-v127="true"] [data-chart-point="true"]'))`,
        { timeoutMs: 20_000 }
      );
      tooltip = await evaluateValue(
        browser.cdp,
        `(async () => {
          const point = document.querySelector('[data-chart-interaction-v127="true"] [data-chart-point="true"]');
          if (!point) return false;
          point.focus();
          point.dispatchEvent(new FocusEvent('focusin', { bubbles: true }));
          point.dispatchEvent(new PointerEvent('pointerenter', {
            bubbles: true,
            pointerType: 'mouse',
            clientX: point.getBoundingClientRect().left,
            clientY: point.getBoundingClientRect().top,
          }));
          await new Promise((resolve) => setTimeout(resolve, 120));
          const tip = document.querySelector('[data-testid="chart-tooltip"]');
          return Boolean(tip && tip.getClientRects().length && tip.textContent?.trim());
        })()`
      );
    }
  }

  await navigate(browser.cdp, `${baseUrl}?country=${COUNTRY_V162}#map`);
  await waitForValue(browser.cdp, `Boolean(document.querySelector('.cdp-map-page'))`, {
    timeoutMs: 30_000,
  });
  // The power layer (A-024) is smoked where the country's map has it. V162: the
  // map no longer has preset buttons (data-preset-id); the layer is chosen from
  // the data list the way a reader does - open its group and tick it.
  if (powerLayerV162) {
    await waitForValue(
      browser.cdp,
      `Boolean(document.querySelector('[data-testid="map-all-data-layer-v135"][data-element-id="A-024"]'))`,
      { timeoutMs: 30_000 }
    );
    await evaluateValue(
      browser.cdp,
      `(async () => {
        const panelToggle = document.querySelector('[data-testid="map-layer-panel"] .cdp-map-panel-toggle');
        if (panelToggle && panelToggle.getAttribute('aria-expanded') === 'false') panelToggle.click();
        const find = () => document.querySelector('[data-testid="map-all-data-layer-v135"][data-element-id="A-024"]');
        const groupToggle = find()?.closest('[data-map-group-v135]')?.querySelector('[data-testid="map-catalog-group-toggle-v138"]');
        if (groupToggle && groupToggle.getAttribute('aria-expanded') !== 'true') groupToggle.click();
        await new Promise((resolve) => setTimeout(resolve, 500));
        find()?.click();
        return Boolean(find());
      })()`
    );
    await waitForValue(
      browser.cdp,
      `document.querySelector('.cdp-map-page')?.getAttribute('data-primary-element') === 'A-024'`,
      { timeoutMs: 30_000 }
    );
  } else {
    await wait(3000);
  }
  const map = await evaluateValue(
    browser.cdp,
    `(() => {
      const page = document.querySelector('.cdp-map-page');
      const wrap = document.querySelector('.cdp-map-canvas-wrap');
      const canvas = document.querySelector('.cdp-map-canvas');
      const fallback = document.querySelector('.cdp-map-fallback__svg');
      const visible = (node) => {
        if (!node) return false;
        const style = getComputedStyle(node);
        const rect = node.getBoundingClientRect();
        return style.display !== 'none' && style.visibility !== 'hidden' && Number(style.opacity || 1) > 0 && rect.width > 300 && rect.height > 400;
      };
      return {
        mounted: Boolean(page),
        primary: page?.getAttribute('data-primary-element') || null,
        powerPreset: page?.getAttribute('data-map-preset') || null,
        width: Math.round(wrap?.getBoundingClientRect().width || 0),
        height: Math.round(wrap?.getBoundingClientRect().height || 0),
        blank: !(visible(canvas) || visible(fallback)),
        legend: Boolean(document.querySelector('[data-testid="map-dynamic-legend"]')),
      };
    })()`
  );

  await navigate(browser.cdp, `${baseUrl}${countryQueryV162}#download`);
  await waitForValue(
    browser.cdp,
    `Boolean(document.querySelector('h1')?.textContent?.includes('데이터 다운로드') && document.querySelector('input[type="checkbox"]:not(:disabled)'))`,
    { timeoutMs: 30_000 }
  );
  const download = await evaluateValue(
    browser.cdp,
    `(async () => {
      const checkbox = document.querySelector('input[type="checkbox"]:not(:disabled)');
      checkbox?.click();
      await new Promise((resolve) => setTimeout(resolve, 100));
      const button = [...document.querySelectorAll('button')].find((node) => node.textContent?.trim() === '다운로드');
      const selected = Boolean(checkbox?.checked && button && !button.disabled);
      button?.click();
      await new Promise((resolve) => setTimeout(resolve, 500));
      return {
        mounted: document.querySelector('h1')?.textContent?.includes('데이터 다운로드') || false,
        selected,
        error: document.querySelector('[role="alert"]')?.textContent?.trim() || null
      };
    })()`
  );
  let completedDownloads = [];
  for (let attempt = 0; attempt < 50; attempt += 1) {
    completedDownloads = readdirSync(downloadRoot)
      .filter(
        (name) =>
          !name.endsWith(".crdownload") && /\.(?:csv|json)$/iu.test(name)
      )
      .map((name) => ({
        name,
        bytes: statSync(join(downloadRoot, name)).size,
      }))
      .filter((entry) => entry.bytes > 0);
    if (completedDownloads.length > 0) break;
    await wait(100);
  }
  download.completedFiles = completedDownloads;

  await navigate(browser.cdp, `${baseUrl}#guide`);
  await waitForValue(browser.cdp, `Boolean(document.querySelector('[data-v128-guide]'))`, {
    timeoutMs: 20_000,
  });
  const guide = await evaluateValue(
    browser.cdp,
    `Boolean(document.querySelector('[data-v128-guide]'))`
  );

  await navigate(browser.cdp, `${baseUrl}#v128-smoke-not-found`);
  await waitForValue(
    browser.cdp,
    `Boolean(document.querySelector('[data-v128-not-found]'))`,
    { timeoutMs: 20_000 }
  );
  const notFound = await evaluateValue(
    browser.cdp,
    `Boolean(document.querySelector('[data-v128-not-found]'))`
  );

  uiResult = { home, finder, details: detailResults, tooltip, map, download, guide, notFound };
} catch (error) {
  runtimeFailure = error instanceof Error ? error.message : String(error);
  if (browser) {
    try {
      failureSnapshot = await evaluateValue(
        browser.cdp,
        `(() => ({
          url: location.origin + location.pathname + location.hash,
          readyState: document.readyState,
          title: document.title,
          rootMounted: Boolean(document.querySelector('#root')?.firstElementChild),
          heading: document.querySelector('h1')?.textContent?.trim().slice(0, 200) || '',
          bodyTextLength: document.body?.innerText?.length || 0
        }))()`
      );
    } catch {
      failureSnapshot = null;
    }
  }
} finally {
  if (browser) await browser.close();
  if (localServer) await localServer.close();
  if (downloadRoot) {
    const safeTemp = resolve(tmpdir());
    const safeDownload = resolve(downloadRoot);
    if (
      safeDownload !== safeTemp &&
      (safeDownload.startsWith(`${safeTemp}\\`) || safeDownload.startsWith(`${safeTemp}/`))
    ) {
      rmSync(safeDownload, { recursive: true, force: true });
    }
  }
}

const routeFailures = Object.entries(routeResults).filter(
  ([, result]) => result.status !== 200 || !/text\/html/iu.test(result.contentType)
);
const allConsoleErrors = [...(browser?.runtimeErrors || []), ...consoleErrors];
const report = {
  schemaVersion: "v128-production-smoke-1",
  generatedAt: new Date().toISOString(),
  country: COUNTRY_V162,
  target: configuredUrl ? "configured-production-url" : "local-production-build",
  baseUrl,
  runtimeFailure,
  failureSnapshot,
  routes: routeResults,
  routeFailures,
  assets: assetResults,
  networkFailures,
  htmlForJson,
  consoleErrors: allConsoleErrors,
  ui: uiResult,
};
mkdirSync(reportRoot, { recursive: true });
writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");

audit.check("ROUTE_HTTP_200", routeFailures.length === 0, routeFailures, []);
audit.check("REQUIRED_ASSET_HTTP_200", networkFailures.length === 0, networkFailures, []);
audit.check("HTML_RETURNED_FOR_JSON", htmlForJson.length === 0, htmlForJson, []);
audit.check("HOME_LIVE_COUNT", uiResult?.home?.liveCount === true, uiResult?.home, { liveCount: true });
audit.check("FINDER_SEARCH", uiResult?.finder?.searchResult === true, uiResult?.finder, { searchResult: true });
// The default country smokes A-002 (with its chart tooltip) and E-012; another
// country smokes two elements its own catalog has.
const detailsMounted =
  detailIdsV162.length > 0 &&
  detailIdsV162.every(
    (id) => uiResult?.details?.[id]?.mounted === true && uiResult?.details?.[id]?.alert === false
  );
audit.check(
  IS_DEFAULT_V162 ? "DETAIL_A002_E012" : "DETAIL_TWO_ELEMENTS",
  detailsMounted,
  uiResult?.details || null,
  Object.fromEntries(detailIdsV162.map((id) => [id, "mounted"]))
);
if (detailIdsV162.includes("A-002")) {
  audit.check("CHART_TOOLTIP", uiResult?.tooltip === true, uiResult?.tooltip ?? null, true);
}
if (powerLayerV162) {
  // V162: was MAP_POWER_PRESET. The preset buttons are gone from the map, so
  // the power layer is ticked in the data list and judged the same way
  // (primary A-024, drawn, legend) minus the preset attribute.
  audit.check(
    "MAP_POWER_LAYER",
    uiResult?.map?.mounted === true &&
      uiResult?.map?.primary === "A-024" &&
      uiResult?.map?.blank === false &&
      uiResult?.map?.legend === true,
    uiResult?.map || null,
    { mounted: true, primary: "A-024", blank: false, legend: true }
  );
} else {
  audit.check(
    "MAP_MOUNTED",
    uiResult?.map?.mounted === true && uiResult?.map?.blank === false,
    uiResult?.map || null,
    { mounted: true, blank: false }
  );
}
audit.check(
  "DOWNLOAD_ONE_ELEMENT",
  uiResult?.download?.mounted === true &&
    uiResult?.download?.selected === true &&
    uiResult?.download?.completedFiles?.length > 0 &&
    uiResult?.download?.error === null,
  uiResult?.download || null,
  { mounted: true, selected: true, completedFiles: ">=1", error: null }
);
audit.check("GUIDE_PAGE", uiResult?.guide === true, uiResult?.guide ?? null, true);
audit.check("NOT_FOUND_PAGE", uiResult?.notFound === true, uiResult?.notFound ?? null, true);
audit.check("UNCAUGHT_APPLICATION_ERROR", allConsoleErrors.length === 0, allConsoleErrors, []);
audit.check("SMOKE_RUNTIME", runtimeFailure === null, runtimeFailure, null);

audit.finish({
  target: configuredUrl ? "production" : "local-production",
  country: COUNTRY_V162,
  baseUrl,
  homeResult: uiResult?.home?.liveCount === true ? "PASS" : "FAIL",
  finderResult: uiResult?.finder?.searchResult === true ? "PASS" : "FAIL",
  detailResult: detailsMounted ? "PASS" : "FAIL",
  mapResult: uiResult?.map?.blank === false ? "PASS" : "FAIL",
  downloadResult:
    uiResult?.download?.selected === true &&
    uiResult?.download?.completedFiles?.length > 0
      ? "PASS"
      : "FAIL",
  guideResult: uiResult?.guide === true ? "PASS" : "FAIL",
  notFoundResult: uiResult?.notFound === true ? "PASS" : "FAIL",
  brokenAssetCount: networkFailures.length,
  htmlForJsonCount: htmlForJson.length,
  consoleErrorCount: allConsoleErrors.length,
  smokeReport: relative(PROJECT_ROOT, reportPath).replace(/\\/gu, "/"),
});
