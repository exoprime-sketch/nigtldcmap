// V151-2 measurement: how long the first backdrop tile takes to arrive for
// each backdrop kind, on the map page and (if the compact minimap carries the
// same status attribute) on the home page. This is a measurement, not a gate:
// it never fails the build on timing, only on a genuine console error.
//
//   node scripts/v151-2/measure-backdrop-v151-2.mjs [--build tmp/build-v151-2-review]
//     [--runs 3] [--kinds terrain,satellite,streets,none]
//     [--out reports/v151-2/backdrop-first-tile.json] [--screens]
//     [--layers B-033,B-041,C-019,A-023,B-021,B-004]
//
// Contract this codes against (RealMapExplorerPage wiring lands separately):
//   .cdp-map-canvas-wrap[data-backdrop-status="ready|fallback|none"]
//   data-backdrop-first-tile-ms, data-backdrop-kind on that same element
//   performance.measure("cdp-backdrop-first-tile") once the first tile paints
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";
import { startStaticBuildServer } from "../v125/browser-runtime.mjs";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const argv = process.argv.slice(2);
const arg = (name, fallback) => {
  const index = argv.indexOf(name);
  return index < 0 ? fallback : argv[index + 1];
};
const BUILD = resolve(ROOT, arg("--build", "tmp/build-v151-2-review"));
const RUNS = Math.max(1, Number(arg("--runs", "3")) || 3);
const KINDS = arg("--kinds", "terrain,satellite,streets,none").split(",").map((s) => s.trim()).filter(Boolean);
const OUT = resolve(ROOT, arg("--out", "reports/v151-2/backdrop-first-tile.json"));
const SCREENS = argv.includes("--screens");
const LAYERS = arg("--layers", "B-033,B-041,C-019,A-023,B-021,B-004").split(",").map((s) => s.trim()).filter(Boolean);
const SHOTS = resolve(ROOT, "reports/v151-2");
const SCALE = Number(process.env.V125_TIMEOUT_SCALE || 1) || 1;

const STORAGE_KEY = "cdp-map-backdrop-v151";
const BACKDROP_HOSTS = ["tiles.openfreemap.org", "s3.amazonaws.com", "server.arcgisonline.com"];
const STATUS_SELECTOR = '.cdp-map-canvas-wrap[data-backdrop-status="ready"], .cdp-map-canvas-wrap[data-backdrop-status="fallback"], .cdp-map-canvas-wrap[data-backdrop-status="none"]';

mkdirSync(dirname(OUT), { recursive: true });
if (SCREENS) mkdirSync(SHOTS, { recursive: true });

const median = (values) => {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
};
const stats = (values) => (values.length ? { median: median(values), min: Math.min(...values), max: Math.max(...values), runs: values } : { median: null, min: null, max: null, runs: [] });

function attachCollectors(page, hostCounts, consoleErrors) {
  page.on("console", (message) => {
    if (message.type() !== "error") return;
    if (/net::ERR_/u.test(message.text())) return;
    consoleErrors.push(message.text().slice(0, 300));
  });
  page.on("pageerror", (error) => consoleErrors.push(`pageerror: ${String(error).slice(0, 300)}`));
  page.on("request", (request) => {
    try {
      const host = new URL(request.url()).host;
      const matched = BACKDROP_HOSTS.find((candidate) => host.includes(candidate));
      if (matched) hostCounts[matched] = (hostCounts[matched] || 0) + 1;
    } catch { /* opaque or data: URLs are not backdrop tile requests */ }
  });
}

async function readBackdropStatus(page, timeoutMs) {
  try {
    await page.waitForSelector(STATUS_SELECTOR, { timeout: timeoutMs });
  } catch {
    return null;
  }
  return page.evaluate(() => {
    const node = document.querySelector(".cdp-map-canvas-wrap[data-backdrop-status]");
    if (!node) return null;
    const measure = performance.getEntriesByName("cdp-backdrop-first-tile", "measure").at(-1);
    return {
      status: node.getAttribute("data-backdrop-status"),
      kind: node.getAttribute("data-backdrop-kind"),
      firstTileMs: Number(node.getAttribute("data-backdrop-first-tile-ms")) || null,
      measureDurationMs: measure ? measure.duration : null,
    };
  });
}

const server = await startStaticBuildServer(BUILD, { port: 0 });
const base = server.url.replace(/\/$/u, "");
const browser = await chromium.launch(
  process.env.V125_BROWSER_EXECUTABLE ? { executablePath: process.env.V125_BROWSER_EXECUTABLE } : {}
);

const consoleErrorsAll = [];
const perKind = {};
const checks = [];
const check = (name, status, actual, expected) => {
  checks.push({ type: "check", audit: "backdrop-first-tile:v151-2", name, status, actual, expected });
  process.stdout.write(`${JSON.stringify(checks[checks.length - 1])}\n`);
};

for (const kind of KINDS) {
  const mapTimes = [];
  const homeTimes = [];
  const hostCounts = {};
  for (let run = 1; run <= RUNS; run++) {
    // A fresh context per run is a cold cache: nothing carries over from the
    // previous run's tile requests or localStorage.
    const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, locale: "ko-KR" });
    await context.addInitScript(([key, value]) => { try { window.localStorage.setItem(key, value); } catch { /* private mode */ } }, [STORAGE_KEY, kind]);
    const page = await context.newPage();
    attachCollectors(page, hostCounts, consoleErrorsAll);
    await page.goto(`${base}/#map`, { waitUntil: "domcontentloaded" });
    const mapResult = await readBackdropStatus(page, 30_000 * SCALE);
    check(`MAP_BACKDROP_STATUS_${kind}_run${run}`, mapResult ? "PASS" : "FAIL", mapResult?.status ?? null, "ready|fallback|none within 30s");
    if (mapResult?.firstTileMs != null) mapTimes.push(mapResult.firstTileMs);

    const homePage = await context.newPage();
    attachCollectors(homePage, hostCounts, consoleErrorsAll);
    await homePage.goto(`${base}/`, { waitUntil: "domcontentloaded" });
    const homeResult = await readBackdropStatus(homePage, 10_000 * SCALE);
    if (homeResult?.firstTileMs != null) homeTimes.push(homeResult.firstTileMs);

    await context.close();
  }
  perKind[kind] = { map: stats(mapTimes), home: stats(homeTimes), requestsByHost: hostCounts };
}

if (SCREENS) {
  for (const kind of KINDS) {
    const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, locale: "ko-KR" });
    await context.addInitScript(([key, value]) => { try { window.localStorage.setItem(key, value); } catch { /* private mode */ } }, [STORAGE_KEY, kind]);
    const page = await context.newPage();
    attachCollectors(page, {}, consoleErrorsAll);
    await page.goto(`${base}/#map`, { waitUntil: "domcontentloaded" });
    await readBackdropStatus(page, 30_000 * SCALE);
    await page.waitForSelector('[data-testid="map-all-data-layer-v135"]', { state: "attached", timeout: 60_000 * SCALE }).catch(() => {});
    await page.waitForTimeout(1_000 * SCALE);
    for (const elementId of LAYERS) {
      try {
        await page.evaluate((id) => {
          const input = document.querySelector(`[data-testid="map-all-data-layer-v135"][data-element-id="${id}"]`);
          const group = input?.closest("[data-map-group-v135]");
          const toggle = group?.querySelector('[data-testid="map-catalog-group-toggle-v138"]');
          if (toggle && toggle.getAttribute("aria-expanded") !== "true") toggle.click();
        }, elementId);
        const input = page.locator(`[data-testid="map-all-data-layer-v135"][data-element-id="${elementId}"]`);
        await input.scrollIntoViewIfNeeded({ timeout: 5_000 * SCALE });
        await input.click({ timeout: 5_000 * SCALE });
        await page.waitForTimeout(1_500 * SCALE);
        await page.locator(".cdp-map-canvas-wrap").screenshot({ path: resolve(SHOTS, `backdrop-${kind}-${elementId}.png`) });
        await input.click({ timeout: 5_000 * SCALE }); // untoggle so the next layer starts clean
      } catch (error) {
        check(`SCREEN_${kind}_${elementId}`, "FAIL", String(error instanceof Error ? error.message : error), "screenshot captured");
      }
    }
    await context.close();
  }
}

await browser.close();
await server.close();

const uniqueConsoleErrors = [...new Set(consoleErrorsAll)];
check("NO_CONSOLE_ERRORS", uniqueConsoleErrors.length ? "FAIL" : "PASS", uniqueConsoleErrors, []);

const summary = {
  type: "summary",
  audit: "backdrop-first-tile:v151-2",
  status: uniqueConsoleErrors.length ? "FAIL" : "PASS",
  kinds: KINDS,
  runs: RUNS,
  screens: SCREENS,
  consoleErrors: uniqueConsoleErrors.length,
  generatedAt: new Date().toISOString(),
};
writeFileSync(OUT, `${JSON.stringify({ summary, perKind, checks }, null, 2)}\n`);
process.stdout.write(`${JSON.stringify(summary)}\n`);
process.exit(uniqueConsoleErrors.length ? 1 : 0);
