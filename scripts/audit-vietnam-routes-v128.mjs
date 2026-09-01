#!/usr/bin/env node

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

const audit = new AuditV125("routes:v128");
const catalogResult = readJson(resolve(V2_ROOT, "catalog.json"));
const catalog = catalogElements(catalogResult.value);
const acceptanceResult = readJson(
  resolve(PROJECT_ROOT, "reports/v128/vietnam-data-release-acceptance-v128.json")
);
const acceptanceRows = Array.isArray(acceptanceResult.value)
  ? acceptanceResult.value
  : Array.isArray(acceptanceResult.value?.elements)
  ? acceptanceResult.value.elements
  : [];
const acceptanceById = new Map(acceptanceRows.map((row) => [row.elementId, row]));

audit.check("CATALOG_JSON", catalogResult.error === null, catalogResult.error, null);
audit.check("ELEMENT_ROUTE_CONTRACT", catalog.length === 152, catalog.length, 152);

const PUBLIC_ROUTE_CASES = [
  { name: "home", suffix: "/#home", selector: "[data-v128-home]", text: "베트남" },
  { name: "explorer", suffix: "/?country=VNM#explorer", selector: ".cdp-card-grid", text: "데이터" },
  {
    name: "element-detail",
    suffix: "/?view=data&country=VNM&element=A-002#element-detail",
    selector: "[data-testid='public-analysis-root']",
    text: "정책",
  },
  { name: "map", suffix: "/?country=VNM#map", selector: ".cdp-map-page", text: "지도" },
  { name: "download", suffix: "/?country=VNM#download", selector: ".cdp-download-list", text: "다운로드" },
  { name: "guide", suffix: "/#guide", selector: "[data-v128-guide]", text: "데이터 이용안내" },
  { name: "not-found", suffix: "/#v128-missing-route", selector: "[data-v128-not-found]", text: "404" },
];

const LEGACY_ROUTE_CASES = [
  {
    name: "dataset-detail",
    suffix: "/?dataset=legacy-dataset#dataset-detail",
    allowedHashes: ["#explorer", "#element-detail"],
  },
  { name: "country", suffix: "/?country=VNM#country", allowedHashes: ["#explorer"] },
  { name: "compare", suffix: "/?country=VNM#compare", allowedHashes: ["#download", "#explorer"] },
  { name: "insights", suffix: "/?country=VNM#insights", allowedHashes: ["#explorer"] },
];

let server = null;
let browser = null;
let runtimeFailure = null;
const publicRouteFailures = [];
const detailRouteFailures = [];
const legacyRouteFailures = [];
const brokenJsonResponses = [];
const brokenInternalLinks = [];
let renderedDetailCount = 0;
let backNavigation = null;
let refreshRestoration = null;
let notFoundResult = null;

try {
  server = await startStaticBuildServer(resolve(PROJECT_ROOT, "build"));
  browser = await launchHeadlessBrowser();
  await setViewport(browser.cdp, 1440, 1100);
  await browser.cdp.send("Network.enable");
  browser.cdp.on("Network.responseReceived", (params) => {
    const response = params.response || {};
    const url = String(response.url || "");
    if (!/\.(?:json|geojson)(?:[?#]|$)/iu.test(url)) return;
    const contentType = String(response.mimeType || response.headers?.["content-type"] || "");
    if (Number(response.status) !== 200 || /text\/html/iu.test(contentType)) {
      brokenJsonResponses.push({ url, status: response.status, contentType });
    }
  });

  for (const routeCase of PUBLIC_ROUTE_CASES) {
    try {
      await navigate(browser.cdp, `${server.url}${routeCase.suffix}`);
      await waitForValue(
        browser.cdp,
        `(() => {
          const root = document.querySelector(${JSON.stringify(routeCase.selector)});
          return Boolean(root && root.textContent?.trim());
        })()`,
        { timeoutMs: routeCase.name === "map" ? 30_000 : 20_000 }
      );
      const result = await evaluateValue(
        browser.cdp,
        `(() => {
          const root = document.querySelector(${JSON.stringify(routeCase.selector)});
          const text = String(root?.innerText || '').normalize('NFC');
          return {
            mounted: Boolean(root),
            textMatch: text.includes(${JSON.stringify(routeCase.text)}),
            hash: location.hash,
            href: location.href,
            h1: document.querySelector('main h1')?.textContent?.trim() || null,
            alert: document.querySelector('[role="alert"]')?.textContent?.trim() || null,
          };
        })()`
      );
      if (!result?.mounted || !result.textMatch || result.alert) {
        publicRouteFailures.push({ route: routeCase.name, result });
      }
    } catch (error) {
      publicRouteFailures.push({
        route: routeCase.name,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  for (const element of catalog) {
    const expectedTitle = acceptanceById.get(element.elementId)?.publicTitle || element.elementLabel;
    const url = new URL(server.url);
    url.searchParams.set("view", "data");
    url.searchParams.set("country", "VNM");
    url.searchParams.set("element", element.elementId);
    url.hash = "element-detail";
    try {
      await navigate(browser.cdp, url.toString());
      await waitForValue(
        browser.cdp,
        `(() => {
          const root = document.querySelector('[data-testid="public-analysis-root"]');
          if (document.querySelector('[role="alert"]')) return true;
          return Boolean(root && root.getAttribute('data-analysis-state') === 'ready' && root.querySelector('[data-testid="public-data-title"]'));
        })()`,
        { timeoutMs: 20_000 }
      );
      const result = await evaluateValue(
        browser.cdp,
        `(() => {
          const root = document.querySelector('[data-testid="public-analysis-root"]');
          const title = document.querySelector('.cdp-detail-hero h1')?.textContent?.trim() || '';
          return {
            mounted: Boolean(root),
            elementId: root?.getAttribute('data-element-id') || null,
            title,
            expectedTitle: ${JSON.stringify(expectedTitle)},
            alert: document.querySelector('[role="alert"]')?.textContent?.trim() || null,
            hash: location.hash,
            country: new URLSearchParams(location.search).get('country'),
          };
        })()`
      );
      if (
        !result?.mounted ||
        result.elementId !== element.elementId ||
        !result.title ||
        result.alert ||
        result.hash !== "#element-detail" ||
        result.country !== "VNM"
      ) {
        detailRouteFailures.push({ elementId: element.elementId, result });
      } else {
        renderedDetailCount += 1;
      }
    } catch (error) {
      detailRouteFailures.push({
        elementId: element.elementId,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  for (const routeCase of LEGACY_ROUTE_CASES) {
    try {
      await navigate(browser.cdp, `${server.url}${routeCase.suffix}`);
      await waitForValue(
        browser.cdp,
        `(() => ${JSON.stringify(routeCase.allowedHashes)}.includes(location.hash))()`,
        { timeoutMs: 15_000 }
      );
      const result = await evaluateValue(
        browser.cdp,
        `(() => ({
          hash: location.hash,
          staleScreen: Boolean(document.querySelector('.dataset-detail-tabs, .country-profile-page, .compare-page, .insights-page')),
          undefinedToken: /#(?:undefined|null)(?:$|[?&])/u.test(location.href),
          alert: document.querySelector('[role="alert"]')?.textContent?.trim() || null,
        }))()`
      );
      if (
        !routeCase.allowedHashes.includes(result?.hash) ||
        result?.staleScreen ||
        result?.undefinedToken ||
        result?.alert
      ) {
        legacyRouteFailures.push({ route: routeCase.name, result });
      }
    } catch (error) {
      legacyRouteFailures.push({
        route: routeCase.name,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  await navigate(browser.cdp, `${server.url}/?country=VNM#explorer`);
  await waitForValue(browser.cdp, "document.querySelectorAll('.cdp-dataset-card').length > 0", {
    timeoutMs: 20_000,
  });
  const openedFromExplorer = await evaluateValue(
    browser.cdp,
    `(() => {
      const card = document.querySelector('.cdp-dataset-card');
      const button = [...(card?.querySelectorAll('button') || [])]
        .find((node) => node.textContent?.trim() === '데이터 보기');
      if (!button) return false;
      button.click();
      return true;
    })()`
  );
  if (openedFromExplorer) {
    await waitForValue(browser.cdp, "location.hash === '#element-detail' && Boolean(document.querySelector('[data-testid=\"public-analysis-root\"]'))", {
      timeoutMs: 20_000,
    });
    const detailUrl = await evaluateValue(browser.cdp, "location.href");
    await browser.cdp.send("Runtime.evaluate", { expression: "history.back()" });
    await waitForValue(browser.cdp, "location.hash === '#explorer' && Boolean(document.querySelector('.cdp-card-grid'))", {
      timeoutMs: 20_000,
    });
    backNavigation = await evaluateValue(
      browser.cdp,
      `({ opened: true, detailUrl: ${JSON.stringify(detailUrl)}, returnedHash: location.hash, cards: document.querySelectorAll('.cdp-dataset-card').length })`
    );
  } else {
    backNavigation = { opened: false };
  }

  const refreshUrl = new URL(server.url);
  refreshUrl.searchParams.set("view", "data");
  refreshUrl.searchParams.set("country", "VNM");
  refreshUrl.searchParams.set("element", "A-002");
  refreshUrl.searchParams.set("year", "2015");
  refreshUrl.searchParams.set("dim.cpiaCluster", "structural");
  refreshUrl.hash = "element-detail";
  await navigate(browser.cdp, refreshUrl.toString());
  await waitForValue(browser.cdp, "document.querySelector('[data-testid=\"public-analysis-root\"][data-element-id=\"A-002\"]')?.getAttribute('data-analysis-state') === 'ready'", {
    timeoutMs: 20_000,
  });
  const beforeRefresh = await evaluateValue(browser.cdp, "location.href");
  await browser.cdp.send("Page.reload", { ignoreCache: true });
  await waitForValue(browser.cdp, "document.readyState === 'complete' && document.querySelector('[data-testid=\"public-analysis-root\"][data-element-id=\"A-002\"]')?.getAttribute('data-analysis-state') === 'ready'", {
    timeoutMs: 20_000,
  });
  refreshRestoration = await evaluateValue(
    browser.cdp,
    `(() => {
      const params = new URLSearchParams(location.search);
      const beforeParams = new URL(${JSON.stringify(beforeRefresh)}).searchParams;
      return {
        before: ${JSON.stringify(beforeRefresh)},
        after: location.href,
        beforeElement: beforeParams.get('element'),
        element: params.get('element'),
        country: params.get('country'),
        year: params.get('year'),
        cpiaCluster: params.get('dim.cpiaCluster'),
        hash: location.hash,
        mountedElement: document.querySelector('[data-testid="public-analysis-root"]')?.getAttribute('data-element-id') || null,
      };
    })()`
  );

  await navigate(browser.cdp, `${server.url}/#definitely-not-a-public-route`);
  await waitForValue(browser.cdp, "Boolean(document.querySelector('[data-v128-not-found]'))", {
    timeoutMs: 15_000,
  });
  notFoundResult = await evaluateValue(
    browser.cdp,
    `(() => {
      const root = document.querySelector('[data-v128-not-found]');
      return {
        mounted: Boolean(root),
        text: root?.innerText || '',
        recoveryActions: [...(root?.querySelectorAll('button, a') || [])].map((node) => node.textContent?.trim()).filter(Boolean),
      };
    })()`
  );

  const links = await evaluateValue(
    browser.cdp,
    `(() => [...document.querySelectorAll('a[href]')]
      .map((node) => node.getAttribute('href'))
      .filter((href) => href && (href.startsWith('/') || href.startsWith('#')))
      .filter((href) => href.includes('#undefined') || href.includes('#null')))()`
  );
  brokenInternalLinks.push(...(links || []));
} catch (error) {
  runtimeFailure = error instanceof Error ? error.message : String(error);
} finally {
  if (browser) await browser.close();
  if (server) await server.close();
}

audit.check(
  "PUBLIC_ROUTE_COUNT_CONTRACT",
  runtimeFailure === null && publicRouteFailures.length === 0,
  { routeCount: PUBLIC_ROUTE_CASES.length, failures: publicRouteFailures, runtimeFailure },
  { routeCount: 7, failures: [], runtimeFailure: null }
);
audit.check(
  "ELEMENT_DETAIL_ROUTES",
  renderedDetailCount === 152 && detailRouteFailures.length === 0,
  { rendered: renderedDetailCount, failures: detailRouteFailures.length },
  { rendered: 152, failures: 0 },
  detailRouteFailures.slice(0, 152)
);
audit.check("STALE_LEGACY_SCREEN_REACHABLE", legacyRouteFailures.length === 0, legacyRouteFailures.length, 0, legacyRouteFailures);
audit.check(
  "BACK_NAVIGATION",
  backNavigation?.opened === true && backNavigation?.returnedHash === "#explorer" && Number(backNavigation?.cards || 0) > 0,
  backNavigation,
  { opened: true, returnedHash: "#explorer", cards: ">0" }
);
audit.check(
  "URL_REFRESH_RESTORATION",
  Boolean(refreshRestoration?.element) &&
    refreshRestoration?.element === refreshRestoration?.beforeElement &&
    refreshRestoration?.country === "VNM" &&
    refreshRestoration?.year === "2015" &&
    refreshRestoration?.cpiaCluster === "structural" &&
    refreshRestoration?.hash === "#element-detail" &&
    refreshRestoration?.mountedElement === "A-002",
  refreshRestoration,
  { element: "stable public slug", country: "VNM", year: "2015", cpiaCluster: "structural", hash: "#element-detail", mountedElement: "A-002" }
);
audit.check(
  "NOT_FOUND_ROUTE",
  notFoundResult?.mounted === true && /404/u.test(notFoundResult?.text || "") && (notFoundResult?.recoveryActions || []).length >= 2,
  notFoundResult,
  { mounted: true, text: "contains 404", recoveryActions: ">=2" }
);
audit.check("BROKEN_INTERNAL_NAVIGATION", brokenInternalLinks.length === 0, brokenInternalLinks, []);
audit.check("JSON_HTML_OR_HTTP_FAILURE", brokenJsonResponses.length === 0, brokenJsonResponses.length, 0, brokenJsonResponses);
audit.check("UNCAUGHT_RUNTIME_ERROR", (browser?.runtimeErrors?.length || 0) === 0, browser?.runtimeErrors || [], []);

audit.finish({
  publicRouteContract: publicRouteFailures.length === 0 ? "PASS" : "FAIL",
  publicRouteCount: PUBLIC_ROUTE_CASES.length,
  elementDetailRouteCount: renderedDetailCount,
  elementDetailFailureCount: detailRouteFailures.length,
  staleLegacyScreenReachable: legacyRouteFailures.length,
  backNavigation: backNavigation?.returnedHash === "#explorer" ? "PASS" : "FAIL",
  urlRefreshRestoration:
    refreshRestoration?.mountedElement === "A-002" && refreshRestoration?.hash === "#element-detail"
      ? "PASS"
      : "FAIL",
  notFound: notFoundResult?.mounted ? "PASS" : "FAIL",
  brokenJsonResponseCount: brokenJsonResponses.length,
});
