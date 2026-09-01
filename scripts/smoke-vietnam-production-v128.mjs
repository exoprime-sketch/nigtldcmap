#!/usr/bin/env node

import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { join, relative, resolve } from "node:path";
import { tmpdir } from "node:os";
import { AuditV125, PROJECT_ROOT } from "./v125/audit-utils.mjs";
import {
  evaluateValue,
  launchHeadlessBrowser,
  navigate,
  startStaticBuildServer,
  waitForValue,
} from "./v125/browser-runtime.mjs";

const audit = new AuditV125("production-smoke:v128");
const configuredUrl = String(
  process.env.PRODUCTION_URL || process.env.V128_PRODUCTION_URL || ""
).trim();
const reportRoot = resolve(PROJECT_ROOT, "reports/v128");
const reportPath = resolve(reportRoot, "production-smoke-v128.json");
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

  const requiredAssets = [
    "data/vietnam/v2/manifest.json",
    "data/vietnam/v2/catalog.json",
    "data/vietnam/v2/map-index.json",
    "data/vietnam/v2/geometry/vnm-adm1-63.geojson",
    "data/vietnam/v2/geometry/vnm-transmission-network.geojson",
    "data/vietnam/v2/semantic/indicator-semantics-v125.json",
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

  await navigate(browser.cdp, `${baseUrl}#home`);
  await waitForValue(
    browser.cdp,
    `Boolean(document.querySelector('[data-v128-home]')?.textContent?.includes('152'))`,
    { timeoutMs: 30_000 }
  );
  const home = await evaluateValue(
    browser.cdp,
    `(() => ({
      mounted: Boolean(document.querySelector('[data-v128-home]')),
      liveCount: document.querySelector('[data-v128-home]')?.textContent?.includes('152') || false
    }))()`
  );

  await navigate(browser.cdp, `${baseUrl}?q=CPIA#explorer`);
  await waitForValue(
    browser.cdp,
    `Boolean(document.querySelector('h1')?.textContent?.includes('데이터 찾기') && document.body.textContent?.includes('CPIA'))`,
    { timeoutMs: 30_000 }
  );
  const finder = await evaluateValue(
    browser.cdp,
    `(() => ({
      mounted: document.querySelector('h1')?.textContent?.includes('데이터 찾기') || false,
      searchResult: document.body.textContent?.includes('CPIA') || false
    }))()`
  );

  const detailResults = {};
  let tooltip = false;
  for (const elementId of ["A-002", "E-012"]) {
    await navigate(
      browser.cdp,
      `${baseUrl}?country=VNM&element=${encodeURIComponent(elementId)}#element-detail`
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

  await navigate(browser.cdp, `${baseUrl}?country=VNM#map`);
  await waitForValue(browser.cdp, `Boolean(document.querySelector('.cdp-map-page'))`, {
    timeoutMs: 30_000,
  });
  await waitForValue(
    browser.cdp,
    `Boolean(document.querySelector('[data-map-element="A-024"]') && document.querySelector('[data-preset-id="POWER_INFRASTRUCTURE"]'))`,
    { timeoutMs: 30_000 }
  );
  await evaluateValue(
    browser.cdp,
    `(() => {
      const button = document.querySelector('[data-preset-id="POWER_INFRASTRUCTURE"]');
      button?.click();
      return Boolean(button);
    })()`
  );
  await waitForValue(
    browser.cdp,
    `document.querySelector('.cdp-map-page')?.getAttribute('data-primary-element') === 'A-024'`,
    { timeoutMs: 30_000 }
  );
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

  await navigate(browser.cdp, `${baseUrl}#download`);
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
audit.check(
  "DETAIL_A002_E012",
  uiResult?.details?.["A-002"]?.mounted === true &&
    uiResult?.details?.["E-012"]?.mounted === true &&
    uiResult?.details?.["A-002"]?.alert === false &&
    uiResult?.details?.["E-012"]?.alert === false,
  uiResult?.details || null,
  { "A-002": "mounted", "E-012": "mounted" }
);
audit.check("CHART_TOOLTIP", uiResult?.tooltip === true, uiResult?.tooltip ?? null, true);
audit.check(
  "MAP_POWER_PRESET",
  uiResult?.map?.mounted === true &&
    uiResult?.map?.primary === "A-024" &&
    uiResult?.map?.powerPreset === "POWER_INFRASTRUCTURE" &&
    uiResult?.map?.blank === false &&
    uiResult?.map?.legend === true,
  uiResult?.map || null,
  { mounted: true, primary: "A-024", powerPreset: "POWER_INFRASTRUCTURE", blank: false, legend: true }
);
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
  baseUrl,
  homeResult: uiResult?.home?.liveCount === true ? "PASS" : "FAIL",
  finderResult: uiResult?.finder?.searchResult === true ? "PASS" : "FAIL",
  detailResult:
    uiResult?.details?.["A-002"]?.mounted && uiResult?.details?.["E-012"]?.mounted
      ? "PASS"
      : "FAIL",
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
