// V151-2 gate: ticking layers, changing the colour source, toggling the
// boundary vintage or switching the backdrop never moves the camera; the
// camera survives a reload through the `view=` URL parameter.
//
//   node scripts/v151-2/viewport-preserve-v151-2.mjs --build tmp/build-v151-2-review
//   [--out reports/v151-2/viewport-preserve.json]
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
const OUT = resolve(ROOT, arg("--out", "reports/v151-2/viewport-preserve.json"));
const CENTER_TOLERANCE_DEG = 0.001;
const DA_NANG = { center: [108.202, 16.054], zoom: 8 };

const checks = [];
const check = (name, status, actual, expected) => {
  checks.push({ type: "check", audit: "viewport-preserve:v151-2", name, status, actual, expected });
  process.stdout.write(`${JSON.stringify(checks[checks.length - 1])}\n`);
};

const server = await startStaticBuildServer(BUILD, { port: 0 });
const base = server.url.replace(/\/$/u, "");
const browser = await chromium.launch(
  process.env.V125_BROWSER_EXECUTABLE ? { executablePath: process.env.V125_BROWSER_EXECUTABLE } : {}
);
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 }, locale: "ko-KR" });
const consoleErrors = [];
page.on("console", (message) => {
  if (message.type() !== "error") return;
  if (/net::ERR_|Failed to load resource/u.test(message.text())) return;
  consoleErrors.push(message.text());
});
page.on("pageerror", (error) => consoleErrors.push(`pageerror: ${error.message}`));

const camera = () =>
  page.evaluate(() => {
    const map = window.__cdpMapV151;
    const center = map.getCenter();
    return { lng: center.lng, lat: center.lat, zoom: map.getZoom(), bearing: map.getBearing(), moving: map.isMoving() };
  });
const settle = async () => {
  await page.waitForFunction(() => window.__cdpMapV151 && !window.__cdpMapV151.isMoving(), undefined, { timeout: 20000 });
  await page.waitForTimeout(400);
};
const tick = async (elementId) => {
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
const waitRendered = async (elementId, timeout = 40000) => {
  const started = Date.now();
  while (Date.now() - started < timeout) {
    const rendered = (await page.locator('[data-testid="map-public-content"]').getAttribute("data-rendered-map-elements")) || "";
    if (rendered.split(/[,\s]+/u).includes(elementId)) return true;
    await page.waitForTimeout(400);
  }
  return false;
};
const compare = (name, before, after) => {
  const dLng = Math.abs(after.lng - before.lng);
  const dLat = Math.abs(after.lat - before.lat);
  const dZoom = Math.abs(after.zoom - before.zoom);
  const pass = dLng <= CENTER_TOLERANCE_DEG && dLat <= CENTER_TOLERANCE_DEG && dZoom < 1e-6;
  check(name, pass ? "PASS" : "FAIL", { dLng: +dLng.toFixed(6), dLat: +dLat.toFixed(6), dZoom: +dZoom.toFixed(6) }, "center Δ ≤ 0.001°, zoom Δ 0");
};

await page.goto(`${base}/#map`, { waitUntil: "domcontentloaded" });
await page.waitForSelector(".cdp-map-boundary-system-v151", { timeout: 60000 });
await page.waitForFunction(() => Boolean(window.__cdpMapV151), undefined, { timeout: 60000 });
await page.waitForTimeout(2500);
await settle();

// Move near Đà Nẵng at zoom 8; every following action must leave this camera alone.
await page.evaluate((target) => window.__cdpMapV151.jumpTo({ center: target.center, zoom: target.zoom }), DA_NANG);
await settle();
const start = await camera();
check("START_AT_DA_NANG_Z8", Math.abs(start.zoom - 8) < 1e-6 ? "PASS" : "FAIL", start, DA_NANG);

const steps = [];
const record = async (label) => {
  await settle();
  const now = await camera();
  steps.push({ label, camera: now });
  compare(`CAMERA_KEPT_${label}`, start, now);
};

for (const id of ["B-033", "B-041", "A-023"]) {
  await tick(id);
  await waitRendered(id);
  await record(`TICK_${id}`);
}
await tick("A-023");
await page.waitForTimeout(1200);
await record("UNTICK_A-023");

// Colour source (primary analysis) change.
const colourSelect = page.locator('[data-testid="map-colour-source-v138"] select');
if ((await colourSelect.count()) > 0) {
  await colourSelect.selectOption("B-041");
  await page.waitForTimeout(2500);
  await record("PRIMARY_CHANGE_B-041");
} else {
  check("PRIMARY_CHANGE_CONTROL", "SKIP", "colour-source select not present", "select exists");
}

await page.locator('input[name="cdp-map-boundary-system-v151"][value="pre-2025-63"]').check();
await page.waitForTimeout(2500);
await record("BOUNDARY_TOGGLE_63");
await page.locator('input[name="cdp-map-boundary-system-v151"][value="post-2025-34"]').check();
await page.waitForTimeout(2500);
await record("BOUNDARY_TOGGLE_34");

for (const kind of ["satellite", "streets", "none", "terrain"]) {
  await page.locator(`input[name="cdp-map-backdrop-v151"][value="${kind}"]`).check();
  await page.waitForTimeout(3000);
  await record(`BACKDROP_${kind.toUpperCase()}`);
}

// URL carries the camera; a reload restores it.
const urlBefore = page.url();
const viewParam = new URL(urlBefore).searchParams.get("view");
check("URL_HAS_VIEW_PARAM", viewParam ? "PASS" : "FAIL", viewParam, "view=lon,lat,zoom");
await page.reload({ waitUntil: "domcontentloaded" });
await page.waitForFunction(() => Boolean(window.__cdpMapV151), undefined, { timeout: 60000 });
await page.waitForTimeout(3000);
await settle();
const afterReload = await camera();
compare("CAMERA_RESTORED_AFTER_RELOAD", start, afterReload);

// Fresh entry without a view parameter still fits the country once.
await page.goto(`${base}/#map`, { waitUntil: "domcontentloaded" });
await page.waitForFunction(() => Boolean(window.__cdpMapV151), undefined, { timeout: 60000 });
await page.waitForTimeout(3000);
await settle();
const fresh = await camera();
check("FRESH_ENTRY_FITS_COUNTRY", fresh.zoom < 7 && fresh.lat > 12 && fresh.lat < 20 ? "PASS" : "FAIL", fresh, "national extent (zoom < 7)");

check("CONSOLE_ERRORS", consoleErrors.length ? "FAIL" : "PASS", consoleErrors, []);

const failed = checks.filter((row) => row.status === "FAIL");
const summary = {
  type: "summary",
  audit: "viewport-preserve:v151-2",
  status: failed.length ? "FAIL" : "PASS",
  passed: checks.filter((row) => row.status === "PASS").length,
  failed: failed.length,
  skipped: checks.filter((row) => row.status === "SKIP").length,
  total: checks.length,
  failedChecks: failed.map((row) => row.name),
  start,
  viewParam,
  generatedAt: new Date().toISOString(),
};
mkdirSync(dirname(OUT), { recursive: true });
writeFileSync(OUT, `${JSON.stringify({ summary, steps, checks }, null, 2)}\n`);
process.stdout.write(`${JSON.stringify(summary)}\n`);
await browser.close();
await server.close();
process.exit(failed.length ? 1 : 0);
