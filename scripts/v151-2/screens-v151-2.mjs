// V151-2 release runner (production build, real Chromium):
//   - every active layer under the 34 and the 63 outline: rendered + screenshot + console errors
//   - four backdrops x six representative layers: screenshot
//   - five representative hover popups: text captured
//   - six viewport widths: no horizontal document overflow (map, detail B-033)
//
//   node scripts/v151-2/screens-v151-2.mjs --build tmp/build-v151-2-review
//   [--out reports/v151-2/screens-v151-2.json] [--layers B-033,B-041] [--skip-all-layers]
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
const OUT = resolve(ROOT, arg("--out", "reports/v151-2/screens-v151-2.json"));
const SHOTS = resolve(ROOT, "reports/v151-2/shots");
const SKIP_ALL = argv.includes("--skip-all-layers");
const ONLY_BACKDROPS = argv.includes("--only-backdrops");
const REPRESENTATIVE = ["B-033", "B-041", "C-019", "A-023", "B-021", "B-004"];
const POPUP_LAYERS = ["B-033", "B-041", "C-019", "A-023", "B-021"];
const WIDTHS = [320, 390, 768, 1024, 1440, 1920];
mkdirSync(SHOTS, { recursive: true });

const checks = [];
const check = (name, status, actual, expected) => {
  checks.push({ type: "check", audit: "screens:v151-2", name, status, actual, expected });
  process.stdout.write(`${JSON.stringify(checks[checks.length - 1]).slice(0, 600)}\n`);
};

const mapIndex = JSON.parse(
  (await import("node:fs")).readFileSync(resolve(ROOT, "public/data/vietnam/v2/map-index.json"), "utf8")
);
const allLayers = mapIndex.layers.filter((layer) => layer.active !== false && layer.enabled !== false).map((l) => l.elementId);
const LAYERS = arg("--layers", "") ? arg("--layers", "").split(",") : allLayers;

const server = await startStaticBuildServer(BUILD, { port: 0 });
const base = server.url.replace(/\/$/u, "");
const browser = await chromium.launch(
  process.env.V125_BROWSER_EXECUTABLE ? { executablePath: process.env.V125_BROWSER_EXECUTABLE } : {}
);
const consoleErrors = [];
const newPage = async (width = 1440, height = 1000) => {
  const context = await browser.newContext({ viewport: { width, height }, locale: "ko-KR" });
  const page = await context.newPage();
  page.on("console", (message) => {
    if (message.type() !== "error") return;
    if (/net::ERR_|Failed to load resource/u.test(message.text())) return;
    consoleErrors.push(message.text().slice(0, 300));
  });
  page.on("pageerror", (error) => consoleErrors.push(`pageerror: ${error.message}`));
  return { context, page };
};
const openMap = async (page) => {
  await page.goto(`${base}/#map`, { waitUntil: "domcontentloaded" });
  await page.waitForSelector(".cdp-map-boundary-system-v151", { timeout: 60000 });
  await page.waitForFunction(() => Boolean(window.__cdpMapV151), undefined, { timeout: 60000 });
  await page.waitForTimeout(2000);
};
const tick = async (page, elementId) => {
  await page.evaluate(() => {
    const toggle = document.querySelector('[data-testid="map-layer-panel"] .cdp-map-panel-toggle');
    if (toggle && toggle.getAttribute("aria-expanded") === "false") toggle.click();
  });
  await page.evaluate((id) => {
    const input = document.querySelector(`[data-testid="map-all-data-layer-v135"][data-element-id="${id}"]`);
    const group = input?.closest("[data-map-group-v135]");
    const groupToggle = group?.querySelector('[data-testid="map-catalog-group-toggle-v138"]');
    if (groupToggle && groupToggle.getAttribute("aria-expanded") !== "true") groupToggle.click();
  }, elementId);
  await page.locator(`[data-testid="map-all-data-layer-v135"][data-element-id="${elementId}"]`).click();
};
const renderedIds = async (page) =>
  ((await page.locator('[data-testid="map-public-content"]').getAttribute("data-rendered-map-elements")) || "").split(/[,\s]+/u).filter(Boolean);
const waitRendered = async (page, elementId, timeout = 40000) => {
  const started = Date.now();
  while (Date.now() - started < timeout) {
    if ((await renderedIds(page)).includes(elementId)) return true;
    await page.waitForTimeout(400);
  }
  return false;
};
const setBoundary = async (page, system) => {
  await page.locator(`input[name="cdp-map-boundary-system-v151"][value="${system}"]`).check();
  await page.waitForTimeout(1800);
};
const setBackdrop = async (page, kind) => {
  await page.locator(`input[name="cdp-map-backdrop-v151"][value="${kind}"]`).check();
  await page.waitForFunction(
    () => /ready|none|fallback/u.test(document.querySelector(".cdp-map-canvas-wrap")?.getAttribute("data-backdrop-status") || ""),
    undefined,
    { timeout: 20000 }
  ).catch(() => undefined);
  await page.waitForTimeout(1500);
};
const sourceSummary = async (page, elementId) =>
  page.evaluate((id) => {
    const map = window.__cdpMapV151;
    const sourceId = `v122-source-vnm-${id.toLowerCase()}`;
    if (!map.getSource(sourceId)) return null;
    const seen = new Set();
    const features = map.querySourceFeatures(sourceId).filter((f) => {
      const key = String(f.id ?? f.properties.selectionKey);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
    return {
      features: features.length,
      withValue: features.filter((f) => f.properties.hasValue).length,
      boundarySystem: features[0]?.properties.boundarySystem || null,
      policyKind: features[0]?.properties.policyKind || null,
    };
  }, elementId);

const report = { build: BUILD.replace(ROOT, ""), layers: {}, backdrops: {}, popups: {}, responsive: {} };

// ---------------------------------------------------------------- 1. every layer x {34, 63}
if (!SKIP_ALL && !ONLY_BACKDROPS) {
  const { context, page } = await newPage();
  await openMap(page);
  await setBackdrop(page, "none"); // keeps the layer shots about the data, and cheap
  for (const id of LAYERS) {
    const errorsBefore = consoleErrors.length;
    await tick(page, id);
    const rendered = await waitRendered(page, id);
    await page.waitForTimeout(800);
    const row = { rendered, notice: await page.getByTestId("map-boundary-value-notice-v151").innerText().catch(() => "") };
    await setBoundary(page, "post-2025-34");
    row.mode34 = await sourceSummary(page, id);
    await page.screenshot({ path: resolve(SHOTS, `layer-${id}-34.png`) });
    await setBoundary(page, "pre-2025-63");
    row.mode63 = await sourceSummary(page, id);
    await page.screenshot({ path: resolve(SHOTS, `layer-${id}-63.png`) });
    await setBoundary(page, "post-2025-34");
    row.consoleErrors = consoleErrors.length - errorsBefore;
    report.layers[id] = row;
    check(`LAYER_${id}_RENDERED`, rendered ? "PASS" : "FAIL", { ...row, notice: undefined }, "rendered under both outlines");
    await tick(page, id);
    await page.waitForTimeout(500);
  }
  await context.close();
}

// ---------------------------------------------------------------- 2. backdrops x representative layers
{
  const { context, page } = await newPage();
  await openMap(page);
  for (const kind of ["terrain", "satellite", "streets", "none"]) {
    await setBackdrop(page, kind);
    report.backdrops[kind] = {};
    for (const id of REPRESENTATIVE) {
      await tick(page, id);
      await waitRendered(page, id);
      await page.waitForTimeout(700);
      await page.screenshot({ path: resolve(SHOTS, `backdrop-${kind}-${id}.png`) });
      report.backdrops[kind][id] = await page.locator(".cdp-map-canvas-wrap").getAttribute("data-backdrop-status");
      // Overview at zoom 4.5: the low-zoom raster tiles must read as one surface, not a rectangle around Viet Nam.
      const camera = await page.evaluate(() => {
        const map = window.__cdpMapV151;
        const center = map.getCenter();
        map.jumpTo({ center: [106.4, 16.0], zoom: 4.5 });
        return { lng: center.lng, lat: center.lat, zoom: map.getZoom() };
      });
      await page.waitForFunction(() => window.__cdpMapV151.areTilesLoaded(), undefined, { timeout: 20000 }).catch(() => undefined);
      await page.waitForTimeout(1200);
      await page.screenshot({ path: resolve(SHOTS, `backdrop-${kind}-${id}-z4.5.png`) });
      await page.evaluate((c) => window.__cdpMapV151.jumpTo({ center: [c.lng, c.lat], zoom: 5.17 }), camera);
      await page.waitForTimeout(600);
      await tick(page, id);
      await page.waitForTimeout(300);
    }
    check(`BACKDROP_${kind.toUpperCase()}_STATUS`, Object.values(report.backdrops[kind]).every((s) => s === "ready" || (kind === "none" && s === "none")) ? "PASS" : "FAIL", report.backdrops[kind], "ready (none for '없음')");
  }
  await context.close();
}

// ---------------------------------------------------------------- 3. representative popups (34 outline)
if (!ONLY_BACKDROPS) {
  const { context, page } = await newPage();
  await openMap(page);
  await setBackdrop(page, "none");
  for (const id of POPUP_LAYERS) {
    await tick(page, id);
    await waitRendered(page, id);
    await page.waitForTimeout(800);
    const point = await page.evaluate((elementId) => {
      const observer = window.__nigtMapObserverV137;
      const features = observer?.renderedFeatures(elementId) || [];
      const target = features.find((f) => f.selectionKey) || null;
      if (!target) return null;
      return observer.hitPointFor(elementId, target.selectionKey);
    }, id);
    let text = "";
    if (point) {
      await page.mouse.move(point.x, point.y);
      await page.waitForTimeout(600);
      text = (await page.locator('[data-testid="map-hover-popup-v133"]').first().innerText().catch(() => "")).replace(/\s+/gu, " ").trim();
    }
    report.popups[id] = { point: Boolean(point), text };
    check(`POPUP_${id}`, text ? "PASS" : "FAIL", text.slice(0, 200), "hover popup text captured");
    await page.mouse.move(5, 5);
    await tick(page, id);
    await page.waitForTimeout(400);
  }
  await context.close();
}

// ---------------------------------------------------------------- 4. six widths, map + detail B-033
for (const route of ONLY_BACKDROPS ? [] : [{ key: "map", url: `${base}/#map` }, { key: "detail-B-033", url: `${base}/?element=b-033&country=VNM#element-detail` }]) {
  report.responsive[route.key] = {};
  for (const width of WIDTHS) {
    const { context, page } = await newPage(width, 900);
    await page.goto(route.url, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(route.key === "map" ? 5000 : 6000);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    report.responsive[route.key][width] = overflow;
    if (width === 390 || width === 1440) await page.screenshot({ path: resolve(SHOTS, `responsive-${route.key}-${width}.png`) });
    await context.close();
  }
  check(`RESPONSIVE_${route.key}`, Object.values(report.responsive[route.key]).every((v) => v <= 1) ? "PASS" : "FAIL", report.responsive[route.key], "document overflow ≤ 1px at every width");
}

check("CONSOLE_ERRORS", consoleErrors.length ? "FAIL" : "PASS", consoleErrors.slice(0, 10), []);
const failed = checks.filter((row) => row.status === "FAIL");
const summary = {
  type: "summary",
  audit: "screens:v151-2",
  status: failed.length ? "FAIL" : "PASS",
  passed: checks.filter((row) => row.status === "PASS").length,
  failed: failed.length,
  total: checks.length,
  failedChecks: failed.map((row) => row.name),
  layersChecked: Object.keys(report.layers).length,
  consoleErrors: consoleErrors.length,
  generatedAt: new Date().toISOString(),
};
mkdirSync(dirname(OUT), { recursive: true });
writeFileSync(OUT, `${JSON.stringify({ summary, report, checks }, null, 2)}\n`);
process.stdout.write(`${JSON.stringify(summary)}\n`);
await browser.close();
await server.close();
process.exit(failed.length ? 1 : 0);
