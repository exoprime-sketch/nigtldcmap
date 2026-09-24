#!/usr/bin/env node

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
import { detailUrlV135, finderUrlV135, mapUrlV135,
  mapLayerCountV138,
} from "./v135/audit-helpers.mjs";
import {
  AWKWARD_GENERIC_COPY_V136,
  INTERNAL_PUBLIC_TOKENS_V136,
  finishAuditV136,
  normalizeTextV136,
  visibleTextInventoryExpressionV136,
  writeCsvV136,
} from "./v136/audit-helpers.mjs";

const audit = new AuditV125("public-text:v136");
const catalog = catalogElements(readJson(resolve(V2_ROOT, "catalog.json")).value);

const ANALYSIS_READY = `(() => {
  const root = document.querySelector('[data-testid="public-analysis-root"]');
  if (!root || root.getAttribute('data-analysis-state') !== 'ready') return false;
  return root.querySelectorAll('[data-testid="public-analysis-pending"]').length === 0;
})()`;

let server = null;
let browser = null;
let runtimeFailure = null;
const inventory = [];
const brokenAssets = [];
const runtimeErrors = [];
const routeTimings = [];
let currentRoute = "shell";

async function closeBrowser() {
  if (!browser) return;
  runtimeErrors.push(...browser.runtimeErrors.map((error) => ({ ...error, route: currentRoute })));
  await browser.close();
  browser = null;
}

async function openBrowser() {
  await closeBrowser();
  browser = await launchHeadlessBrowser();
  await setViewport(browser.cdp, 1440, 1000);
  await browser.cdp.send("Network.enable");
  browser.cdp.on("Network.responseReceived", ({ response }) => {
    if (response?.url?.startsWith(server.origin) && Number(response.status) >= 400) {
      brokenAssets.push({ route: currentRoute, url: response.url, status: response.status });
    }
  });
}

function record(route, pageType, rows) {
  rows.forEach((row) => {
    inventory.push({
      route,
      pageType,
      section: row.section || "",
      visibleText: normalizeTextV136(row.text),
      component: row.tag,
    });
  });
}

try {
  if (!existsSync(resolve(PROJECT_ROOT, "build/index.html"))) {
    throw new Error("production build missing; run npm run build first");
  }
  server = await startStaticBuildServer(resolve(PROJECT_ROOT, "build"));
  await openBrowser();

  const shellRoutes = [
    { key: "home", hash: "home", pageType: "home" },
    { key: "finder", hash: "explorer", pageType: "finder" },
    { key: "download", hash: "download", pageType: "download" },
    { key: "guide", hash: "guide", pageType: "guide" },
  ];
  for (const route of shellRoutes) {
    const url = new URL(server.url);
    url.searchParams.set("country", "VNM");
    // V160: the finder opens on the core tier; the audit reads every public card.
    if (route.key === "finder") url.searchParams.set("tier", "all");
    url.hash = route.hash;
    await navigate(browser.cdp, url.toString());
    await waitForValue(
      browser.cdp,
      `Boolean(document.querySelector('main, .cdp-page-shell'))`,
      { timeoutMs: 35_000 }
    );
    await new Promise((resolveWait) => setTimeout(resolveWait, 400));
    record(route.key, route.pageType, await evaluateValue(browser.cdp, visibleTextInventoryExpressionV136()));
  }

  await navigate(browser.cdp, finderUrlV135(server.url));
  await waitForValue(
    browser.cdp,
    `document.querySelectorAll('[data-testid="public-finder-card-v135"]').length > 0`,
    { timeoutMs: 35_000 }
  );
  record("finder-cards", "finder", await evaluateValue(browser.cdp, visibleTextInventoryExpressionV136()));

  await navigate(browser.cdp, mapUrlV135(server.url));
  await waitForValue(
    browser.cdp,
    `document.querySelectorAll('.cdp-map-catalog-v138__item[data-map-available="true"]').length === ${mapLayerCountV138()}`,
    { timeoutMs: 35_000 }
  );
  record("map", "map", await evaluateValue(browser.cdp, visibleTextInventoryExpressionV136()));

  for (const element of catalog) {
    const elementId = String(element.elementId || "");
    // Text coverage tests individual screens, not a 152-navigation session.
    // Release the previous renderer/decoded shards instead of accumulating
    // multi-hundred-MB climate packs in one Chromium process. No retries/skips.
    await closeBrowser();
    currentRoute = elementId;
    const started = Date.now();
    console.log(JSON.stringify({ type: "route-start", audit: audit.name, elementId }));
    await openBrowser();
    await navigate(browser.cdp, detailUrlV135(server.url, elementId));
    await waitForValue(browser.cdp, ANALYSIS_READY, { timeoutMs: 30_000 });
    record(elementId, "detail", await evaluateValue(browser.cdp, visibleTextInventoryExpressionV136()));
    routeTimings.push({ elementId, elapsedMs: Date.now() - started });
    console.log(JSON.stringify({ type: "route-end", ...routeTimings.at(-1) }));
  }
} catch (error) {
  runtimeFailure = `${currentRoute}: ${error instanceof Error ? error.message : String(error)}`;
} finally {
  await closeBrowser();
  if (server) await server.close();
}

const routes = new Set(inventory.map((row) => row.route));
const internalHits = inventory.filter((row) =>
  INTERNAL_PUBLIC_TOKENS_V136.some((token) => row.visibleText.includes(token))
);
const awkwardHits = inventory.filter((row) =>
  AWKWARD_GENERIC_COPY_V136.some((token) => row.visibleText.includes(token))
);
const versionTokens = inventory.filter((row) => /\bV1[23][0-9]\b/u.test(row.visibleText));

const reviewRows = [...internalHits, ...awkwardHits, ...versionTokens].map((row) => ({
  ...row,
  decision: "REWRITE",
  replacement: "",
  reason: "internal or generic wording surfaced on a public screen",
}));

writeCsvV136(
  "public-text-inventory-v136.csv",
  ["route", "pageType", "section", "visibleText", "component"],
  inventory
);
writeCsvV136(
  "public-text-review-v136.csv",
  ["route", "pageType", "section", "visibleText", "component", "decision", "replacement", "reason"],
  reviewRows
);

audit.check("FRAMEWORK_ELEMENTS", catalog.length === 152, catalog.length, 152);
audit.check("PUBLIC_TEXT_RUNTIME", runtimeFailure === null, { runtimeFailure }, { runtimeFailure: null });
audit.check("PUBLIC_ROUTE_COUNT", routes.size >= 157, routes.size, ">=157");
audit.check("PUBLIC_TEXT_INVENTORY_COUNT", inventory.length > 0, inventory.length, ">0");
audit.check("INTERNAL_PUBLIC_TOKEN_COUNT", internalHits.length === 0, internalHits.slice(0, 25), []);
audit.check("AWKWARD_GENERIC_COPY_COUNT", awkwardHits.length === 0, awkwardHits.slice(0, 25), []);
audit.check("PUBLIC_VERSION_TOKEN_COUNT", versionTokens.length === 0, versionTokens.slice(0, 25), []);
audit.check("BROKEN_ASSET", brokenAssets.length === 0, brokenAssets, []);
audit.check("CONSOLE_ERROR", runtimeErrors.length === 0, runtimeErrors, []);

finishAuditV136(audit, "public-text-audit-v136.json", {
  publicTextInventoryCount: inventory.length,
  publicTextRewriteCount: reviewRows.length,
  publicTextRemoveCount: 0,
  publicRouteCount: routes.size,
  internalPublicTokenCount: internalHits.length,
  awkwardGenericCopyCount: awkwardHits.length,
  runtimeFailure,
  routeTimings,
});
