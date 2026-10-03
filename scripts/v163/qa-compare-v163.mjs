#!/usr/bin/env node
/**
 * V163 "비교해서 보기" QA: real Chromium against a production-form build served
 * as an SPA (QA_BASE, default http://127.0.0.1:5061). Seven pane pairs (VNM and
 * BGD, every renderer family), a click on each pane, the camera sync, the entry
 * button, country switch, swap, close and six widths. Writes 1440px captures
 * to reports/v163/screens and the readings to reports/v163/qa-compare-v163.json.
 *
 *   QA_BASE=http://127.0.0.1:5061 QA_CHROMIUM=/path/to/chrome node scripts/v163/qa-compare-v163.mjs
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "@playwright/test";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const BASE = process.env.QA_BASE || "http://127.0.0.1:5061";
const OUT = resolve(ROOT, "reports/v163/screens");
const ONLY = process.env.QA_ONLY ? process.env.QA_ONLY.split(",") : null;
mkdirSync(OUT, { recursive: true });

const HIT = /^(v124-fill|v126-point-hit|v124-line|v126-line-hit|v122-cluster|v122-point|v129-point-symbol)-/;

function compareUrl({ a, b, ca = "VNM", cb = "VNM", sel = null, country }) {
  const params = new URLSearchParams({ view: "map", country: country || ca, mapMode: "compare", compareLayers: `${a},${b}`, compareCountries: `${ca},${cb}` });
  if (sel) params.set("compareSelectors", JSON.stringify(sel));
  return `${BASE}/?${params}#map`;
}

async function waitPanes(page, timeout = 90_000) {
  await page.waitForFunction(
    () => ["a", "b"].every((side) => document.querySelector(`[data-testid="map-compare-pane-${side}"]`)?.getAttribute("data-map-ready") === "true"),
    null,
    { timeout }
  );
  await page.evaluate(async () => {
    const maps = Object.values(window.__cdpCompareMapsV163 || {}).filter(Boolean);
    await Promise.all(maps.map((map) => (map.loaded() ? null : new Promise((resolve) => { map.once("idle", resolve); setTimeout(resolve, 6000); }))));
  });
  await page.waitForTimeout(700);
}

async function rendered(page, side) {
  return page.evaluate((side) => {
    const map = window.__cdpCompareMapsV163?.[side];
    if (!map) return { count: -1, layers: [] };
    const layers = map.getStyle().layers.map((layer) => layer.id).filter((id) => /^(v124-fill|v126-point-hit|v124-line|v126-line-hit|v122-cluster|v122-point|v129-point-symbol)-/.test(id));
    return { count: layers.length ? map.queryRenderedFeatures({ layers }).length : 0, layers };
  }, side);
}

async function findClickable(page, side, { needValue = true } = {}) {
  return page.evaluate(({ side, needValue }) => {
    const map = window.__cdpCompareMapsV163?.[side];
    if (!map) return null;
    const layers = map.getStyle().layers.map((layer) => layer.id).filter((id) => /^(v124-fill|v126-point-hit|v126-line-hit|v124-line)-/.test(id));
    const canvas = map.getCanvas();
    const rect = canvas.getBoundingClientRect();
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    for (let y = 0.12; y < 0.9; y += 0.03) {
      for (let x = 0.08; x < 0.92; x += 0.03) {
        const px = x * w;
        const py = y * h;
        const cx = rect.left + px;
        const cy = rect.top + py;
        const top = document.elementFromPoint(cx, cy);
        if (!top || !(top instanceof HTMLCanvasElement)) continue;
        const feature = map.queryRenderedFeatures([px, py], { layers })[0];
        if (!feature) continue;
        const p = feature.properties || {};
        if (p.cluster) continue;
        if (needValue && p.hasValue === false) continue;
        return { x: cx, y: cy, key: String(p.selectionKey ?? ""), layer: feature.layer.id.replace(/-[a-z]{3}-[a-e]-\d{3}$/u, "") };
      }
    }
    return null;
  }, { side, needValue });
}

async function paneText(page, testId) {
  return page.evaluate((id) => (document.querySelector(`[data-testid="${id}"]`)?.innerText || "").replace(/\s+/gu, " ").trim(), testId);
}

async function viewportFit(page) {
  return page.evaluate(() => {
    const read = (selector) => {
      const node = document.querySelector(selector);
      if (!node) return null;
      const r = node.getBoundingClientRect();
      return { top: Math.round(r.top), bottom: Math.round(r.bottom), left: Math.round(r.left), right: Math.round(r.right) };
    };
    return {
      innerHeight,
      innerWidth,
      mapA: read('[data-testid="map-compare-pane-a"] .cmp163-pane__map'),
      mapB: read('[data-testid="map-compare-pane-b"] .cmp163-pane__map'),
      legendA: read('[data-testid="map-comparison-legend-a"]'),
      legendB: read('[data-testid="map-comparison-legend-b"]'),
      paneA: read('[data-testid="map-compare-pane-a"]'),
      paneB: read('[data-testid="map-compare-pane-b"]'),
      overflow: Math.max(document.documentElement.scrollWidth, document.body.scrollWidth) - innerWidth,
    };
  });
}

const scenarios = [
  { name: "vnm-choropleths", a: "B-039", b: "B-041", expect: ["ramp", "ramp"], linked: true, sync: true },
  { name: "vnm-point-line", a: "A-023", b: "A-024", expect: ["point", "line"], sync: true, zoomA: { center: [105.9, 21.2], zoom: 8.6 } },
  { name: "vnm-unit-group", a: "B-017", b: "A-022", expect: ["unit", "ramp"], sync: true },
  { name: "vnm-bgd-cross", a: "B-039", b: "B-039", cb: "BGD", expect: ["ramp", "ramp"], sync: false },
  { name: "bgd-choropleth-point", a: "B-039", b: "A-023", ca: "BGD", cb: "BGD", expect: ["ramp", "asset"], sync: true },
  {
    name: "vnm-same-colors",
    a: "B-033",
    b: "B-033",
    sel: [{ variable: "annual-tree-cover-loss", period: "2005" }, { variable: "annual-tree-cover-loss", period: "2024" }],
    expect: ["ramp", "ramp"],
    sync: true,
    sharedColors: true,
  },
  { name: "vnm-scope-point", a: "D-018", b: "C-025", expect: ["scope", "point"], sync: true },
];

const port = new URL(BASE).port;
const browser = await chromium.launch({
  ...(process.env.QA_CHROMIUM ? { executablePath: process.env.QA_CHROMIUM } : {}),
  args: port ? [`--explicitly-allowed-ports=${port}`] : [],
});
const report = { startedAt: new Date().toISOString(), scenarios: [], extra: {} };
const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, locale: "ko-KR" });

function attach(page, bucket) {
  page.on("console", (message) => { if (message.type() === "error") bucket.console.push(message.text().slice(0, 300)); });
  page.on("pageerror", (error) => bucket.console.push(`pageerror: ${String(error).slice(0, 300)}`));
  page.on("response", (response) => {
    if (response.url().startsWith(BASE) && response.status() >= 400) bucket.broken.push(`${response.status()} ${response.url()}`);
  });
}

for (const scenario of scenarios) {
  if (ONLY && !ONLY.includes(scenario.name)) continue;
  const page = await context.newPage();
  const row = { name: scenario.name, console: [], broken: [], checks: {} };
  attach(page, row);
  try {
    await page.goto(compareUrl(scenario), { waitUntil: "domcontentloaded" });
    await waitPanes(page);
    for (const side of ["a", "b"]) {
      row.checks[`rendered_${side}`] = await rendered(page, side);
      row.checks[`legend_${side}`] = await paneText(page, `map-comparison-legend-${side}`);
      row.checks[`legendKind_${side}`] = await page.getAttribute(`[data-testid="map-comparison-legend-${side}"]`, "data-legend-kind");
      row.checks[`country_${side}`] = await page.getAttribute(`[data-testid="map-compare-pane-${side}"]`, "data-country");
      row.checks[`renderer_${side}`] = await page.getAttribute(`[data-testid="map-compare-pane-${side}"]`, "data-renderer");
    }
    row.checks.synchronized = await page.getAttribute('[data-testid="map-comparison-workspace-v135"]', "data-synchronized");
    row.checks.sharedColors = await page.getAttribute('[data-testid="map-comparison-workspace-v135"]', "data-shared-colors");
    row.checks.fit1440 = await viewportFit(page);
    await page.screenshot({ path: `${OUT}/compare-${scenario.name}.png` });
    if (scenario.zoomA) {
      await page.evaluate(async (camera) => {
        const map = window.__cdpCompareMapsV163.a;
        map.jumpTo(camera);
        await new Promise((resolve) => { map.once("idle", resolve); setTimeout(resolve, 5000); });
      }, scenario.zoomA);
      await page.waitForTimeout(500);
      for (const side of ["a", "b"]) row.checks[`renderedZoomed_${side}`] = await rendered(page, side);
      await page.screenshot({ path: `${OUT}/compare-${scenario.name}-zoomed.png` });
    }
    // Click each pane's data.
    for (const side of ["a", "b"]) {
      const target = await findClickable(page, side);
      row.checks[`click_${side}`] = target;
      if (!target) continue;
      await page.mouse.click(target.x, target.y);
      await page.waitForTimeout(500);
      row.checks[`card_${side}`] = await paneText(page, `map-compare-card-${side}`);
      if (scenario.linked && side === "a") {
        row.checks.linkedCardB = await paneText(page, "map-compare-card-b");
      }
      if (side === "a") await page.screenshot({ path: `${OUT}/compare-${scenario.name}-selected.png` });
    }
    row.checks.summaryA = await paneText(page, "map-compare-summary-a");
    row.checks.summaryB = await paneText(page, "map-compare-summary-b");
    row.checks.infoA = await paneText(page, "map-compare-info-a");
    row.checks.infoB = await paneText(page, "map-compare-info-b");
    if (scenario.sync) {
      row.checks.syncMove = await page.evaluate(async () => {
        const a = window.__cdpCompareMapsV163.a;
        const b = window.__cdpCompareMapsV163.b;
        a.jumpTo({ zoom: a.getZoom() + 0.8, center: a.getCenter() });
        await new Promise((resolve) => setTimeout(resolve, 400));
        return { za: a.getZoom().toFixed(3), zb: b.getZoom().toFixed(3), ca: a.getCenter().toArray().map((v) => v.toFixed(4)), cb: b.getCenter().toArray().map((v) => v.toFixed(4)) };
      });
    }
  } catch (error) {
    row.error = String(error).slice(0, 500);
    await page.screenshot({ path: `${OUT}/compare-${scenario.name}-error.png` }).catch(() => {});
  }
  report.scenarios.push(row);
  console.log(JSON.stringify({ name: row.name, error: row.error, console: row.console.length, broken: row.broken.length, ra: row.checks.rendered_a?.count, rb: row.checks.rendered_b?.count, ka: row.checks.legendKind_a, kb: row.checks.legendKind_b, sync: row.checks.synchronized, shared: row.checks.sharedColors, cardA: (row.checks.card_a || "").slice(0, 120), cardB: (row.checks.card_b || "").slice(0, 120) }));
  await page.close();
}

// Entry button, swap, close, responsive widths.
if (!ONLY || ONLY.includes("flow")) {
  const page = await context.newPage();
  const row = { name: "flow", console: [], broken: [], checks: {} };
  attach(page, row);
  try {
    await page.goto(`${BASE}/?view=map&country=VNM#map`, { waitUntil: "domcontentloaded" });
    await page.waitForFunction(() => Boolean(window.__nigtMapObserverV137?.ready?.()), null, { timeout: 90_000 }).catch(() => {});
    await page.locator('[data-testid="map-compare-open-v135"]').first().click();
    await waitPanes(page);
    row.checks.entryElements = await page.getAttribute('[data-testid="map-comparison-workspace-v135"]', "data-comparison-elements");
    row.checks.entryUrl = page.url();
    // Pane B -> Bangladesh (C-025 exists there).
    await page.locator('[data-testid="map-compare-country-b"] [data-country="BGD"]').click();
    await page.waitForFunction(() => document.querySelector('[data-testid="map-compare-pane-b"]')?.getAttribute("data-country") === "BGD", null, { timeout: 30_000 });
    await waitPanes(page);
    row.checks.afterCountry = {
      elements: await page.getAttribute('[data-testid="map-comparison-workspace-v135"]', "data-comparison-elements"),
      countries: await page.getAttribute('[data-testid="map-comparison-workspace-v135"]', "data-comparison-countries"),
      sync: await page.getAttribute('[data-testid="map-comparison-workspace-v135"]', "data-synchronized"),
      notice: await page.evaluate(() => document.querySelector('[data-testid="map-compare-pane-b"] .cmp163-pane__notice')?.textContent || ""),
      url: page.url(),
      renderedB: await rendered(page, "b"),
    };
    // Pane A -> Bangladesh too: D-018 is not offered there.
    await page.locator('[data-testid="map-compare-country-a"] [data-country="BGD"]').click();
    await page.waitForFunction(() => document.querySelector('[data-testid="map-compare-pane-a"]')?.getAttribute("data-country") === "BGD", null, { timeout: 30_000 });
    await waitPanes(page);
    row.checks.afterCountryA = {
      elements: await page.getAttribute('[data-testid="map-comparison-workspace-v135"]', "data-comparison-elements"),
      sync: await page.getAttribute('[data-testid="map-comparison-workspace-v135"]', "data-synchronized"),
      notice: await page.evaluate(() => document.querySelector('[data-testid="map-compare-pane-a"] .cmp163-pane__notice')?.textContent || ""),
    };
    await page.screenshot({ path: `${OUT}/compare-bgd-after-switch.png` });
    const before = await page.getAttribute('[data-testid="map-comparison-workspace-v135"]', "data-comparison-elements");
    await page.locator('[data-testid="map-compare-swap"]').click();
    await page.waitForTimeout(400);
    await waitPanes(page);
    row.checks.swap = { before, after: await page.getAttribute('[data-testid="map-comparison-workspace-v135"]', "data-comparison-elements") };
    // Responsive widths
    row.checks.widths = {};
    for (const width of [320, 390, 768, 1024, 1440, 1920]) {
      await page.setViewportSize({ width, height: width <= 768 ? 844 : 900 });
      await page.waitForTimeout(600);
      row.checks.widths[width] = await viewportFit(page);
      if (width === 390) {
        await waitPanes(page).catch(() => {});
        await page.screenshot({ path: `${OUT}/compare-mobile-390.png`, fullPage: true });
      }
    }
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.locator('[data-testid="map-compare-close"]').click();
    await page.waitForTimeout(800);
    row.checks.closed = {
      workspace: await page.locator('[data-testid="map-comparison-workspace-v135"]').count(),
      url: page.url(),
      mapVisible: await page.evaluate(() => {
        const node = document.querySelector('[data-testid="map-resizable-layout"]');
        return node ? getComputedStyle(node).visibility : "missing";
      }),
    };
  } catch (error) {
    row.error = String(error).slice(0, 500);
    await page.screenshot({ path: `${OUT}/compare-flow-error.png` }).catch(() => {});
  }
  report.scenarios.push(row);
  console.log(JSON.stringify({ name: "flow", error: row.error, console: row.console, broken: row.broken, checks: { entry: row.checks.entryElements, afterCountry: row.checks.afterCountry && { ...row.checks.afterCountry, renderedB: row.checks.afterCountry.renderedB?.count }, afterCountryA: row.checks.afterCountryA, swap: row.checks.swap, closed: row.checks.closed } }));
  await page.close();
}

writeFileSync(resolve(ROOT, "reports/v163/qa-compare-v163.json"), `${JSON.stringify(report, null, 2)}\n`);
await browser.close();
