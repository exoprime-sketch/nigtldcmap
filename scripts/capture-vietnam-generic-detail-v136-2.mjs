#!/usr/bin/env node

/**
 * The generic detail screenshots: one per shape the shared renderer produces.
 *
 * The screen that started this phase - the investment portfolio - is captured
 * first, because it is the one whose KPI read "1 · 2 · 3 … 38".
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
import { detailUrlV135 } from "./v135/audit-helpers.mjs";
import { V136_REPORT_ROOT } from "./v136/audit-helpers.mjs";
import { GENERIC_DETAIL_SHOTS_V136_2 } from "./v136-2/generic-detail-contract.mjs";

const LAUNCH_SHOT_ROOT = resolve(V136_REPORT_ROOT, "final-launch");

/** Each shot pairs a file with the element whose shape it stands for. */
const SHOTS = [
  // the screen this phase was opened about
  { name: "detail-generic-portfolio.png", elementId: "D-022", width: 1440 },
  // several measures behind one selector
  { name: "detail-generic-multimeasure.png", elementId: "A-003", width: 1440 },
  // a policy screen, where the value is evidence rather than a number
  { name: "detail-generic-evidence.png", elementId: "C-012", width: 1440 },
  // a directory of institutions
  { name: "detail-generic-entity-list.png", elementId: "E-006", width: 1440 },
  // the portfolio again, at the narrowest supported width
  { name: "detail-generic-mobile.png", elementId: "D-022", width: 390 },
];

const ANALYSIS_READY = `(() => {
  const root = document.querySelector('[data-testid="public-analysis-root"]');
  if (!root || root.getAttribute('data-analysis-state') !== 'ready') return false;
  return root.querySelectorAll('[data-testid="public-analysis-pending"]').length === 0;
})()`;

mkdirSync(LAUNCH_SHOT_ROOT, { recursive: true });
for (const name of GENERIC_DETAIL_SHOTS_V136_2) {
  rmSync(resolve(LAUNCH_SHOT_ROOT, name), { force: true });
}

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

const server = await startStaticBuildServer(resolve(PROJECT_ROOT, "build"));
const browser = await launchHeadlessBrowser();

try {
  const cdp = browser.cdp;
  for (const shot of SHOTS) {
    await setViewport(cdp, shot.width, shot.width < 800 ? 900 : 1050);
    await navigate(cdp, detailUrlV135(server.url, shot.elementId));
    await waitForValue(cdp, ANALYSIS_READY, { timeoutMs: 45_000 });
    await settle(cdp);
    await captureElementPng(cdp, "body", resolve(LAUNCH_SHOT_ROOT, shot.name));
    console.log(JSON.stringify({ type: "screenshot", name: shot.name, elementId: shot.elementId }));
  }
} finally {
  await browser.close();
  await server.close();
}

const missing = GENERIC_DETAIL_SHOTS_V136_2.filter(
  (name) => !existsSync(resolve(LAUNCH_SHOT_ROOT, name))
);
console.log(
  JSON.stringify({
    type: "summary",
    task: "capture:generic-detail:v136-2",
    captured: GENERIC_DETAIL_SHOTS_V136_2.length - missing.length,
    required: GENERIC_DETAIL_SHOTS_V136_2.length,
    missing,
    status: missing.length === 0 ? "PASS" : "FAIL",
  })
);
if (missing.length > 0) process.exitCode = 1;
