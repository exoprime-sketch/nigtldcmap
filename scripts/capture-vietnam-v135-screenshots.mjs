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
  REQUIRED_SCREENSHOTS_V135,
  V135_SCREENSHOT_ROOT,
  detailUrlV135,
  finderUrlV135,
  hoverMapFeatureForTooltipV135,
  mapUrlV135,
  visibleExpressionV135,
} from "./v135/audit-helpers.mjs";

mkdirSync(V135_SCREENSHOT_ROOT, { recursive: true });
for (const name of REQUIRED_SCREENSHOTS_V135) {
  rmSync(resolve(V135_SCREENSHOT_ROOT, name), { force: true });
}

function screenshotPath(name) {
  return resolve(V135_SCREENSHOT_ROOT, name);
}

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

async function makeHeaderStatic(cdp) {
  await evaluateValue(
    cdp,
    `(() => {
      const header = document.querySelector('.site-header');
      if (header instanceof HTMLElement) {
        header.style.setProperty('position', 'static', 'important');
      }
      return true;
    })()`
  );
  await settle(cdp);
}

async function waitForVisible(cdp, selector, timeoutMs = 35_000) {
  await waitForValue(cdp, visibleExpressionV135(selector), { timeoutMs });
}

async function capture(cdp, name, selector) {
  await waitForVisible(cdp, selector);
  await evaluateValue(
    cdp,
    `(() => {
      const node = document.querySelector(${JSON.stringify(selector)});
      node?.scrollIntoView({ block: 'center', inline: 'nearest', behavior: 'instant' });
      return true;
    })()`
  );
  await settle(cdp);
  await captureElementPng(cdp, selector, screenshotPath(name));
  console.log(JSON.stringify({ type: "screenshot", name, selector }));
}

async function expandFinder(cdp) {
  for (let guard = 0; guard < 40; guard += 1) {
    const expanded = await evaluateValue(
      cdp,
      `(() => {
        const more = document.querySelector('[data-testid="finder-load-more-v135"]');
        if (!(more instanceof HTMLElement)) return false;
        more.click();
        return true;
      })()`
    );
    if (!expanded) break;
    await new Promise((done) => setTimeout(done, 120));
  }
}

async function captureFinderCard(cdp, name, titlePattern) {
  const marked = await evaluateValue(
    cdp,
    `(() => {
      document.querySelectorAll('[data-v135-capture]').forEach((node) => node.removeAttribute('data-v135-capture'));
      const pattern = new RegExp(${JSON.stringify(titlePattern)}, 'u');
      const card = [...document.querySelectorAll('[data-testid="public-finder-card-v135"]')]
        .find((node) => pattern.test(String(node.textContent || '').normalize('NFC')));
      if (!card) return false;
      card.setAttribute('data-v135-capture', 'true');
      return true;
    })()`
  );
  if (!marked) throw new Error(`finder card not found for ${name}`);
  await capture(cdp, name, '[data-v135-capture="true"]');
}

async function openMapGuide(cdp) {
  await evaluateValue(
    cdp,
    `(() => {
      const details = document.querySelector('[data-testid="map-data-guide-v130"] details');
      if (details instanceof HTMLDetailsElement) details.open = true;
      return true;
    })()`
  );
  await settle(cdp);
}

async function showMapDataset(cdp, elementId) {
  const clicked = await evaluateValue(
    cdp,
    `(() => {
      const card = [...document.querySelectorAll('[data-testid="map-all-data-layer-v135"]')]
        .find((node) => node.getAttribute('data-element-id') === ${JSON.stringify(elementId)});
      if (!(card instanceof HTMLElement)) return false;
      card.click();
      return true;
    })()`
  );
  if (!clicked) throw new Error(`map dataset control missing: ${elementId}`);
  await waitForValue(
    cdp,
    `document.querySelector('[data-testid="map-public-content"]')?.getAttribute('data-primary-element') === ${JSON.stringify(elementId)}`,
    { timeoutMs: 35_000 }
  );
  await settle(cdp);
}

async function openComparison(cdp, elementA, elementB) {
  await evaluateValue(
    cdp,
    `(() => {
      const open = document.querySelector('[data-testid="map-compare-open-v135"]');
      if (open instanceof HTMLElement) open.click();
      return true;
    })()`
  );
  await waitForValue(
    cdp,
    `Boolean(document.querySelector('[data-testid="map-comparison-workspace-v135"]'))`,
    { timeoutMs: 35_000 }
  );
  await waitForValue(
    cdp,
    `(document.querySelector('[data-testid="map-compare-pane-a"] select')?.options?.length || 0) >= 12`,
    { timeoutMs: 35_000 }
  );
  await evaluateValue(
    cdp,
    `(() => {
      const setPane = (paneId, value) => {
        const select = document.querySelector('[data-testid="' + paneId + '"] select');
        if (!(select instanceof HTMLSelectElement)) return false;
        select.value = value;
        select.dispatchEvent(new Event('change', { bubbles: true }));
        return true;
      };
      setPane('map-compare-pane-a', ${JSON.stringify(elementA)});
      return true;
    })()`
  );
  await new Promise((done) => setTimeout(done, 700));
  await evaluateValue(
    cdp,
    `(() => {
      const select = document.querySelector('[data-testid="map-compare-pane-b"] select');
      if (!(select instanceof HTMLSelectElement)) return false;
      select.value = ${JSON.stringify(elementB)};
      select.dispatchEvent(new Event('change', { bubbles: true }));
      return true;
    })()`
  );
  // Wait until both panes actually carry their selected dataset, so captures
  // never show a pane that is still loading.
  await waitForValue(
    cdp,
    `(() => {
      const pane = (side, expected) => {
        const node = document.querySelector('[data-testid="map-compare-pane-' + side + '"]');
        if (!node) return false;
        if (node.getAttribute('data-element-id') !== expected) return false;
        if (node.getAttribute('data-map-ready') !== 'true') return false;
        return !/불러오는 중|준비 중/u.test(String(node.textContent || ''));
      };
      return pane('a', ${JSON.stringify(elementA)}) && pane('b', ${JSON.stringify(elementB)});
    })()`,
    { timeoutMs: 45_000 }
  );
  await new Promise((done) => setTimeout(done, 900));
  await settle(cdp);
}

let server = null;
let browser = null;
let failure = null;

try {
  if (!existsSync(resolve(PROJECT_ROOT, "build/index.html"))) {
    throw new Error("production build missing; run npm run build before screenshot capture");
  }
  server = await startStaticBuildServer(resolve(PROJECT_ROOT, "build"));
  browser = await launchHeadlessBrowser();
  const cdp = browser.cdp;

  // Finder cards
  await setViewport(cdp, 1440, 1000);
  await navigate(cdp, finderUrlV135(server.url));
  await waitForValue(
    cdp,
    `document.querySelectorAll('[data-testid="public-finder-card-v135"]').length > 0`,
    { timeoutMs: 35_000 }
  );
  await makeHeaderStatic(cdp);
  await expandFinder(cdp);
  await captureFinderCard(cdp, "finder-energy.png", "1차 에너지 소비구조");
  await captureFinderCard(cdp, "finder-drought.png", "가뭄 위험");

  // Detail screens
  const detailTargets = [
    { name: "detail-ghg-sector-gas.png", elementId: "C-002", selector: '[data-testid="ghg-sector-gas-analysis-v135"]' },
    { name: "detail-portfolio.png", elementId: "D-011", selector: '[data-testid="public-analysis-primary"]' },
    { name: "detail-single-year-kpi.png", elementId: "E-009", selector: '[data-testid="public-analysis-primary"]' },
  ];
  for (const target of detailTargets) {
    await navigate(cdp, detailUrlV135(server.url, target.elementId));
    await waitForValue(
      cdp,
      `document.querySelector('[data-testid="public-analysis-root"]')?.getAttribute('data-analysis-state') === 'ready'`,
      { timeoutMs: 35_000 }
    );
    await makeHeaderStatic(cdp);
    await capture(cdp, target.name, target.selector);
  }

  // Map screens
  await setViewport(cdp, 1920, 1100);
  await navigate(cdp, mapUrlV135(server.url));
  await waitForValue(
    cdp,
    `document.querySelectorAll('[data-testid="map-all-data-layer-v135"]').length === 12`,
    { timeoutMs: 35_000 }
  );
  await makeHeaderStatic(cdp);
  await capture(cdp, "map-guide-closed.png", '[data-testid="map-data-guide-v130"]');
  await openMapGuide(cdp);
  await capture(cdp, "map-guide-open.png", '[data-testid="map-data-guide-v130"]');
  await capture(cdp, "map-all-data.png", '[data-testid="map-all-data-v135"]');

  // Left panel widened through the real pointer separator
  await evaluateValue(cdp, `localStorage.clear(); true`);
  await navigate(cdp, mapUrlV135(server.url));
  await waitForVisible(cdp, '[data-testid="map-left-panel-separator"]');
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
  await makeHeaderStatic(cdp);
  await capture(cdp, "map-left-expanded.png", '[data-testid="map-resizable-layout"]');

  // Mine hover detail
  await showMapDataset(cdp, "B-048");
  const mineHover = await hoverMapFeatureForTooltipV135(cdp, {
    elementId: "B-048",
    contentPattern: MINE_TOOLTIP_CONTENT_PATTERN_SOURCE_V135,
    evaluateValue,
    waitForValue,
    timeoutMs: 15_000,
  });
  if (mineHover.failure) {
    throw new Error(`mine tooltip unavailable: ${mineHover.failure}`);
  }
  await capture(cdp, "map-mine-hover.png", '[data-testid="map-feature-tooltip"]');

  // Dedicated comparison workspace
  await navigate(cdp, mapUrlV135(server.url));
  await waitForValue(
    cdp,
    `document.querySelectorAll('[data-testid="map-all-data-layer-v135"]').length === 12`,
    { timeoutMs: 35_000 }
  );
  await makeHeaderStatic(cdp);
  await openComparison(cdp, "D-018", "C-025");
  await capture(cdp, "map-compare-finance.png", '[data-testid="map-comparison-workspace-v135"]');
  await openComparison(cdp, "B-021", "D-008");
  await capture(cdp, "map-compare-vulnerability-budget.png", '[data-testid="map-comparison-workspace-v135"]');

  await setViewport(cdp, 390, 844);
  await new Promise((done) => setTimeout(done, 400));
  await makeHeaderStatic(cdp);
  await capture(cdp, "map-compare-mobile.png", '[data-testid="map-comparison-workspace-v135"]');
} catch (error) {
  failure = error instanceof Error ? error.message : String(error);
} finally {
  if (browser) await browser.close();
  if (server) await server.close();
}

const missing = REQUIRED_SCREENSHOTS_V135.filter(
  (name) => !existsSync(screenshotPath(name))
);
console.log(
  JSON.stringify({
    type: "summary",
    task: "capture:screenshots:v135",
    captured: REQUIRED_SCREENSHOTS_V135.length - missing.length,
    required: REQUIRED_SCREENSHOTS_V135.length,
    missing,
    failure,
  })
);
process.exitCode = failure === null && missing.length === 0 ? 0 : 1;
