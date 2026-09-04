#!/usr/bin/env node

/**
 * The launch screenshot set: the screens an outside reader actually lands on,
 * at the widths they land on them. Separate from the V136 visual QA capture,
 * which frames individual map controls for review; these are whole pages.
 */

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
import { detailUrlV135, finderUrlV135, mapUrlV135 } from "./v135/audit-helpers.mjs";
import { V136_REPORT_ROOT } from "./v136/audit-helpers.mjs";

const LAUNCH_SHOT_ROOT = resolve(V136_REPORT_ROOT, "final-launch");

const REQUIRED_LAUNCH_SHOTS_V136_1 = [
  "home-1440.png",
  "home-390.png",
  "finder-1440.png",
  "detail-indicator.png",
  "detail-portfolio.png",
  "map-default.png",
  "map-region.png",
  "map-point.png",
  "map-compare.png",
  "download.png",
  "guide.png",
];

const ANALYSIS_READY = `(() => {
  const root = document.querySelector('[data-testid="public-analysis-root"]');
  if (!root || root.getAttribute('data-analysis-state') !== 'ready') return false;
  return root.querySelectorAll('[data-testid="public-analysis-pending"]').length === 0;
})()`;

mkdirSync(LAUNCH_SHOT_ROOT, { recursive: true });
for (const name of REQUIRED_LAUNCH_SHOTS_V136_1) {
  rmSync(resolve(LAUNCH_SHOT_ROOT, name), { force: true });
}

/** Lets layout and any entry transition finish before the shutter. */
async function settle(cdp) {
  await evaluateValue(
    cdp,
    `new Promise((done) => {
      const after = () => requestAnimationFrame(() => requestAnimationFrame(() => done(true)));
      if (document.fonts && document.fonts.ready) document.fonts.ready.then(after, after);
      else after();
    })`
  );
}

async function shoot(cdp, name) {
  await settle(cdp);
  await captureElementPng(cdp, "body", resolve(LAUNCH_SHOT_ROOT, name));
  console.log(JSON.stringify({ type: "screenshot", name }));
}

/**
 * Opens one map dataset from the left panel and waits for it to take effect.
 * The list renders before the map index finishes loading, so a lone click can
 * land on a control that is not wired up yet; clicking until it reports itself
 * pressed keeps the shot depending on app state rather than on timing.
 */
async function selectMapDataset(cdp, elementId) {
  const selector =
    `[data-testid="map-all-data-layer-v135"][data-element-id="${elementId}"]`;
  await waitForValue(
    cdp,
    `(() => {
      const node = document.querySelector('${selector}');
      return Boolean(node) && node.getAttribute('aria-disabled') !== 'true' && !node.disabled;
    })()`,
    { timeoutMs: 40_000 }
  );
  await waitForValue(
    cdp,
    `(() => {
      const node = document.querySelector('${selector}');
      if (!node) return false;
      if (node.getAttribute('aria-pressed') === 'true') return true;
      node.click();
      return false;
    })()`,
    { timeoutMs: 45_000, intervalMs: 400 }
  );
}

const server = await startStaticBuildServer(resolve(PROJECT_ROOT, "build"));
const browser = await launchHeadlessBrowser();
const cdp = browser.cdp;

try {
  // ---- home, at the widest and the narrowest supported width ----------
  await setViewport(cdp, 1440, 1050);
  await navigate(cdp, `${server.url}/#home`);
  await waitForValue(cdp, `Boolean(document.querySelector('[data-v128-home]'))`, {
    timeoutMs: 35_000,
  });
  await waitForValue(
    cdp,
    `document.querySelectorAll('.home-featured-list > button').length > 0`,
    { timeoutMs: 35_000 }
  );
  await shoot(cdp, "home-1440.png");

  await setViewport(cdp, 390, 900);
  await navigate(cdp, `${server.url}/#home`);
  await waitForValue(
    cdp,
    `document.querySelectorAll('.home-featured-list > button').length > 0`,
    { timeoutMs: 35_000 }
  );
  await shoot(cdp, "home-390.png");

  // ---- finder ---------------------------------------------------------
  await setViewport(cdp, 1440, 1050);
  await navigate(cdp, finderUrlV135(server.url));
  await waitForValue(
    cdp,
    `document.querySelectorAll('[data-testid="public-finder-card-v135"]').length > 0`,
    { timeoutMs: 35_000 }
  );
  await shoot(cdp, "finder-1440.png");

  // ---- one indicator detail and one portfolio detail -------------------
  await navigate(cdp, detailUrlV135(server.url, "A-016"));
  await waitForValue(cdp, ANALYSIS_READY, { timeoutMs: 45_000 });
  await shoot(cdp, "detail-indicator.png");

  await navigate(cdp, detailUrlV135(server.url, "D-018"));
  await waitForValue(cdp, ANALYSIS_READY, { timeoutMs: 45_000 });
  await shoot(cdp, "detail-portfolio.png");

  // ---- map: default, a region layer, a point layer, side by side -------
  await navigate(cdp, mapUrlV135(server.url));
  await waitForValue(
    cdp,
    `Boolean(document.querySelector('[data-testid="map-all-data-v135"]'))`,
    { timeoutMs: 40_000 }
  );
  await shoot(cdp, "map-default.png");

  await selectMapDataset(cdp, "B-033");
  await shoot(cdp, "map-region.png");

  await selectMapDataset(cdp, "A-023");
  await shoot(cdp, "map-point.png");

  await evaluateValue(
    cdp,
    `(() => { document.querySelector('[data-testid="map-compare-open-v135"]')?.click(); return true; })()`
  );
  await waitForValue(
    cdp,
    `Boolean(document.querySelector('[data-testid="map-comparison-workspace-v135"]'))`,
    { timeoutMs: 35_000 }
  );
  await shoot(cdp, "map-compare.png");

  // ---- download and guide ---------------------------------------------
  await navigate(cdp, `${server.url}/#download`);
  await waitForValue(cdp, `Boolean(document.querySelector('.cdp-hero h1'))`, {
    timeoutMs: 35_000,
  });
  await shoot(cdp, "download.png");

  await navigate(cdp, `${server.url}/#guide`);
  await waitForValue(cdp, `Boolean(document.querySelector('[data-v128-guide]'))`, {
    timeoutMs: 35_000,
  });
  await shoot(cdp, "guide.png");
} finally {
  await browser.close();
  await server.close();
}

const missing = REQUIRED_LAUNCH_SHOTS_V136_1.filter(
  (name) => !existsSync(resolve(LAUNCH_SHOT_ROOT, name))
);
console.log(
  JSON.stringify({
    type: "summary",
    task: "capture:launch:v136-1",
    captured: REQUIRED_LAUNCH_SHOTS_V136_1.length - missing.length,
    required: REQUIRED_LAUNCH_SHOTS_V136_1.length,
    missing,
    status: missing.length === 0 ? "PASS" : "FAIL",
  })
);
if (missing.length > 0) process.exitCode = 1;
