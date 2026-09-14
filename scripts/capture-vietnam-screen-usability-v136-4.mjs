#!/usr/bin/env node

/**
 * Evidence for the existing-screen usability pass.
 *
 * Each shot is a screen this phase changed or claims to have left alone, taken
 * from the current production build. The manifest beside them records the
 * commit, the viewport and the date, so a later reader can tell these apart
 * from the previous round's captures rather than having to trust the filename.
 */

import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
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

const SHOT_ROOT = resolve(V136_REPORT_ROOT, "screen-usability-v136-4");

const ANALYSIS_READY = `(() => {
  const root = document.querySelector('[data-testid="public-analysis-root"]');
  if (!root || root.getAttribute('data-analysis-state') !== 'ready') return false;
  return root.querySelectorAll('[data-testid="public-analysis-pending"]').length === 0;
})()`;
const BODY_READY = `Boolean(document.querySelector('main, [data-testid="public-analysis-root"]'))`;

/** Opens the first term help on the page, so the shot shows it expanded. */
const OPEN_TERM_HELP = `(async () => {
  const trigger = [...document.querySelectorAll('button[data-public-term-v134]')]
    .find((node) => node.getBoundingClientRect().width > 0);
  if (!trigger) return false;
  trigger.click();
  await new Promise((done) => requestAnimationFrame(() => requestAnimationFrame(done)));
  return trigger.getAttribute('aria-expanded') === 'true';
})()`;

const SHOTS = [
  // the cards that held a button inside a button, with the help open
  { name: "home-action-cards-help.png", route: "home", width: 1440, act: OPEN_TERM_HELP },
  { name: "home-action-cards-390.png", route: "home", width: 390 },
  { name: "home-action-cards-768.png", route: "home", width: 768 },
  { name: "home-action-cards-1024.png", route: "home", width: 1024 },
  { name: "home-action-cards-1920.png", route: "home", width: 1920 },
  // the investment portfolio: KPI wording and the sector selector
  { name: "d022-kpi-and-sector.png", element: "D-022", width: 1440 },
  { name: "d022-kpi-and-sector-390.png", element: "D-022", width: 390 },
  // the scale filter that mixed megawatts with a pipeline's kilometres
  { name: "d025-scale-filter.png", element: "D-025", width: 1440 },
  // a screen whose rows are one per technology, so no single figure heads it
  { name: "a017-no-kpi.png", element: "A-017", width: 1440 },
  // the three shells, for the copy and density review
  { name: "explorer-1440.png", route: "explorer", width: 1440 },
  { name: "map-1440.png", route: "map", width: 1440 },
  { name: "download-1440.png", route: "download", width: 1440 },
];

function routeUrl(base, route) {
  if (route === "home") return base;
  return `${base}?view=${route === "explorer" ? "data" : route}&country=VNM`;
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

mkdirSync(SHOT_ROOT, { recursive: true });

const commit = execFileSync("git", ["rev-parse", "HEAD"], {
  cwd: PROJECT_ROOT,
  encoding: "utf8",
}).trim();
const capturedAt = new Date().toISOString();

const server = await startStaticBuildServer(resolve(PROJECT_ROOT, "build"));
const browser = await launchHeadlessBrowser();
const manifest = [];

try {
  const cdp = browser.cdp;
  for (const shot of SHOTS) {
    await setViewport(cdp, shot.width, shot.width < 800 ? 900 : 1050);
    if (shot.element) {
      await navigate(cdp, detailUrlV135(server.url, shot.element));
      await waitForValue(cdp, ANALYSIS_READY, { timeoutMs: 45_000 });
    } else {
      await navigate(cdp, routeUrl(server.url, shot.route));
      await waitForValue(cdp, BODY_READY, { timeoutMs: 45_000 });
    }
    let acted = null;
    if (shot.act) acted = await evaluateValue(cdp, shot.act);
    await settle(cdp);
    await captureElementPng(cdp, "body", resolve(SHOT_ROOT, shot.name));
    manifest.push({
      name: shot.name,
      target: shot.element || shot.route,
      viewport: shot.width,
      state: shot.act ? `term help opened: ${acted}` : "default",
      commit,
      capturedAt,
    });
    console.log(JSON.stringify({ type: "screenshot", ...manifest.at(-1) }));
  }
} finally {
  await browser.close();
  await server.close();
}

writeFileSync(
  resolve(SHOT_ROOT, "manifest.json"),
  `${JSON.stringify({ commit, capturedAt, shots: manifest }, null, 2)}\n`
);

const missing = SHOTS.filter((shot) => !existsSync(resolve(SHOT_ROOT, shot.name)));
console.log(
  JSON.stringify({
    type: "summary",
    task: "capture:screen-usability:v136-4",
    captured: SHOTS.length - missing.length,
    required: SHOTS.length,
    missing: missing.map((shot) => shot.name),
    commit,
    status: missing.length === 0 ? "PASS" : "FAIL",
  })
);
if (missing.length > 0) process.exitCode = 1;
