#!/usr/bin/env node

import { existsSync, mkdirSync, rmSync } from "node:fs";
import { resolve } from "node:path";

import { PROJECT_ROOT } from "./v125/audit-utils.mjs";
import {
  captureElementPng,
  evaluateValue,
  launchHeadlessBrowser,
  navigate,
  setViewport,
  startStaticBuildServer,
  waitForValue,
} from "./v125/browser-runtime.mjs";
import {
  MINE_TOOLTIP_CONTENT_PATTERN_SOURCE_V135,
  activateMapDatasetV135,
  detailUrlV135,
  finderUrlV135,
  hoverMapFeatureForTooltipV135,
  mapUrlV135,
  visibleExpressionV135,
} from "./v135/audit-helpers.mjs";
import { V136_SCREENSHOT_ROOT } from "./v136/audit-helpers.mjs";

const REQUIRED_SCREENSHOTS_V136 = [
  "map-left-default.png",
  "map-left-expanded.png",
  "map-data-all-groups.png",
  "map-data-active-item.png",
  "map-guide-closed.png",
  "map-guide-open.png",
  "map-right-region.png",
  "map-right-point.png",
  "map-compare-desktop.png",
  "map-compare-mobile.png",
  "finder.png",
  "detail-indicator.png",
  "detail-portfolio.png",
  "download.png",
  "guide.png",
];

mkdirSync(V136_SCREENSHOT_ROOT, { recursive: true });
for (const name of REQUIRED_SCREENSHOTS_V136) {
  rmSync(resolve(V136_SCREENSHOT_ROOT, name), { force: true });
}

const ANALYSIS_READY = `(() => {
  const root = document.querySelector('[data-testid="public-analysis-root"]');
  if (!root || root.getAttribute('data-analysis-state') !== 'ready') return false;
  return root.querySelectorAll('[data-testid="public-analysis-pending"]').length === 0;
})()`;

async function settle(cdp) {
  await evaluateValue(
    cdp,
    `new Promise((done) => {
      const after = () => requestAnimationFrame(() => requestAnimationFrame(() => done(true)));
      if (document.fonts?.ready) document.fonts.ready.then(after, after);
      else after();
    })`
  );
}

async function staticHeader(cdp) {
  await evaluateValue(
    cdp,
    `(() => {
      const header = document.querySelector('.site-header');
      if (header instanceof HTMLElement) header.style.setProperty('position', 'static', 'important');
      return true;
    })()`
  );
  await settle(cdp);
}

async function capture(cdp, name, selector) {
  await waitForValue(cdp, visibleExpressionV135(selector), { timeoutMs: 35_000 });
  await evaluateValue(
    cdp,
    `(() => {
      document.querySelector(${JSON.stringify(selector)})?.scrollIntoView({ block: 'center', behavior: 'instant' });
      return true;
    })()`
  );
  await settle(cdp);
  await captureElementPng(cdp, selector, resolve(V136_SCREENSHOT_ROOT, name));
  console.log(JSON.stringify({ type: "screenshot", name }));
}

async function openMap(cdp) {
  await navigate(cdp, mapUrlV135(cdp.__origin));
  await waitForValue(
    cdp,
    `document.querySelectorAll('[data-testid="map-all-data-layer-v135"]').length === 12`,
    { timeoutMs: 35_000 }
  );
  await staticHeader(cdp);
}

let server = null;
let browser = null;
let failure = null;

try {
  if (!existsSync(resolve(PROJECT_ROOT, "build/index.html"))) {
    throw new Error("production build missing; run npm run build first");
  }
  server = await startStaticBuildServer(resolve(PROJECT_ROOT, "build"));
  browser = await launchHeadlessBrowser();
  const cdp = browser.cdp;
  cdp.__origin = server.url;

  // Map left panel
  await setViewport(cdp, 1920, 1100);
  await openMap(cdp);
  await capture(cdp, "map-left-default.png", '[data-testid="map-layer-panel"]');
  await capture(cdp, "map-data-all-groups.png", '[data-testid="map-all-data-v135"]');
  await capture(cdp, "map-guide-closed.png", '[data-testid="map-data-guide-v130"]');
  await evaluateValue(
    cdp,
    `(() => {
      const details = document.querySelector('[data-testid="map-data-guide-v130"] details');
      if (details instanceof HTMLDetailsElement) details.open = true;
      return true;
    })()`
  );
  await settle(cdp);
  await capture(cdp, "map-guide-open.png", '[data-testid="map-data-guide-v130"]');

  // Selected dataset state and the right analysis panel for a point layer
  await activateMapDatasetV135(cdp, {
    elementId: "B-048",
    evaluateValue,
    waitForValue,
    timeoutMs: 35_000,
    requireFeatureControls: true,
  });
  await capture(cdp, "map-data-active-item.png", '[data-testid="map-all-data-v135"]');
  await hoverMapFeatureForTooltipV135(cdp, {
    elementId: "B-048",
    contentPattern: MINE_TOOLTIP_CONTENT_PATTERN_SOURCE_V135,
    evaluateValue,
    waitForValue,
    timeoutMs: 15_000,
  });
  await capture(cdp, "map-right-point.png", ".cdp-map-analysis-panel, aside.cdp-map-sidebar--analysis, aside");

  // Region layer in the right panel
  await activateMapDatasetV135(cdp, {
    elementId: "B-021",
    evaluateValue,
    waitForValue,
    timeoutMs: 35_000,
  });
  await capture(cdp, "map-right-region.png", ".cdp-map-analysis-panel, aside.cdp-map-sidebar--analysis, aside");

  // Widened left panel through the real separator
  await evaluateValue(cdp, `localStorage.clear(); true`);
  await openMap(cdp);
  const separator = await evaluateValue(
    cdp,
    `(() => {
      const rect = document.querySelector('[data-testid="map-left-panel-separator"]')?.getBoundingClientRect();
      return rect ? { x: rect.left + rect.width / 2, y: rect.top + Math.min(100, rect.height / 2) } : null;
    })()`
  );
  if (separator) {
    await cdp.send("Input.dispatchMouseEvent", { type: "mousePressed", x: separator.x, y: separator.y, button: "left", buttons: 1, clickCount: 1 });
    await cdp.send("Input.dispatchMouseEvent", { type: "mouseMoved", x: separator.x + 145, y: separator.y, button: "left", buttons: 1 });
    await cdp.send("Input.dispatchMouseEvent", { type: "mouseReleased", x: separator.x + 145, y: separator.y, button: "left", buttons: 0, clickCount: 1 });
    await new Promise((done) => setTimeout(done, 300));
  }
  await staticHeader(cdp);
  await capture(cdp, "map-left-expanded.png", '[data-testid="map-resizable-layout"]');

  // Comparison workspace
  await openMap(cdp);
  await evaluateValue(cdp, `(() => { document.querySelector('[data-testid="map-compare-open-v135"]')?.click(); return true; })()`);
  await waitForValue(
    cdp,
    `(() => {
      const pane = (side) => document.querySelector('[data-testid="map-compare-pane-' + side + '"]');
      return pane('a')?.getAttribute('data-map-ready') === 'true' && pane('b')?.getAttribute('data-map-ready') === 'true';
    })()`,
    { timeoutMs: 45_000 }
  );
  await settle(cdp);
  await capture(cdp, "map-compare-desktop.png", '[data-testid="map-comparison-workspace-v135"]');
  await setViewport(cdp, 390, 844);
  await new Promise((done) => setTimeout(done, 500));
  await staticHeader(cdp);
  await capture(cdp, "map-compare-mobile.png", '[data-testid="map-comparison-workspace-v135"]');

  // Public screens
  await setViewport(cdp, 1440, 1000);
  await navigate(cdp, finderUrlV135(server.url));
  await waitForValue(cdp, `document.querySelectorAll('[data-testid="public-finder-card-v135"]').length > 0`, { timeoutMs: 35_000 });
  await staticHeader(cdp);
  await capture(cdp, "finder.png", "main");

  for (const [name, elementId] of [
    ["detail-indicator.png", "C-002"],
    ["detail-portfolio.png", "D-011"],
  ]) {
    await navigate(cdp, detailUrlV135(server.url, elementId));
    await waitForValue(cdp, ANALYSIS_READY, { timeoutMs: 35_000 });
    await staticHeader(cdp);
    await capture(cdp, name, '[data-testid="public-analysis-root"]');
  }

  for (const [name, hash] of [
    ["download.png", "download"],
    ["guide.png", "guide"],
  ]) {
    const url = new URL(server.url);
    url.searchParams.set("country", "VNM");
    url.hash = hash;
    await navigate(cdp, url.toString());
    await waitForValue(cdp, `Boolean(document.querySelector('main, .cdp-page-shell'))`, { timeoutMs: 35_000 });
    await staticHeader(cdp);
    await capture(cdp, name, "main, .cdp-page-shell");
  }
} catch (error) {
  failure = error instanceof Error ? error.message : String(error);
} finally {
  if (browser) await browser.close();
  if (server) await server.close();
}

const missing = REQUIRED_SCREENSHOTS_V136.filter(
  (name) => !existsSync(resolve(V136_SCREENSHOT_ROOT, name))
);
console.log(
  JSON.stringify({
    type: "summary",
    task: "capture:screenshots:v136",
    captured: REQUIRED_SCREENSHOTS_V136.length - missing.length,
    required: REQUIRED_SCREENSHOTS_V136.length,
    missing,
    failure,
  })
);
process.exitCode = failure === null && missing.length === 0 ? 0 : 1;
