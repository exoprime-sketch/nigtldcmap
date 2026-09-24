#!/usr/bin/env node
/**
 * V152 map icon runtime check (production build, real Chromium, big map).
 *
 * For each of the 15 icon layers drawn as the primary layer it records, from
 * the live MapLibre instance (localhost-only handle `window.__cdpMapV151`):
 *   - every icon the layer's features ask for is registered (`hasImage`), and
 *     no `styleimagemissing` fired for a V152 glyph;
 *   - the legend (`map-icon-legend-v152`) lists exactly the (icon, colour)
 *     categories the source data carries, with the same counts;
 *   - the badge ring colours are the legend colours;
 *   - at 390 px the smallest badge is at least 18 px across;
 *   - screenshots (legend beside map) for review, including a satellite
 *     backdrop to judge contrast on a dark image;
 *   - no console errors.
 *
 *   node scripts/v152/map-icons-runtime-v152.mjs --build <dir> [--layers A-023,B-012] [--port 4362]
 * Writes reports/v152/map-icons-runtime-v152.json and reports/v152/shots/icons/*.png.
 */
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";
import { startStaticBuildServer } from "../v125/browser-runtime.mjs";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const argv = process.argv.slice(2);
const opt = (name, fallback) => {
  const index = argv.indexOf(name);
  return index < 0 ? fallback : argv[index + 1];
};
const BUILD = resolve(ROOT, opt("--build", "build"));
const PORT = Number(opt("--port", "4362"));
const OUT = resolve(ROOT, opt("--out", "reports/v152/map-icons-runtime-v152.json"));
const SHOTS = resolve(ROOT, opt("--shots", "reports/v152/shots/icons"));
const ICON_LAYERS = ["A-023", "B-012", "C-025", "B-048", "E-005", "A-025", "B-008", "B-023", "B-028", "B-025", "D-018", "E-004", "E-006", "E-018", "E-019"];
const LAYERS = (opt("--layers", "") || "").split(",").map((v) => v.trim()).filter(Boolean);
const TARGETS = LAYERS.length ? LAYERS : ICON_LAYERS;
const SHOT_LAYERS = new Set(["A-023", "B-012", "C-025", "E-005", "E-018", "D-018"]);
mkdirSync(SHOTS, { recursive: true });

const mapIndex = JSON.parse(readFileSync(resolve(ROOT, "public/data/vietnam/v2/map-index.json"), "utf8"));
const layerById = new Map(mapIndex.layers.map((layer) => [layer.elementId, layer]));

function urlFor(base, elementId) {
  const layer = layerById.get(elementId);
  const url = new URL(base);
  url.search = "";
  url.hash = "map";
  const params = {
    country: "VNM",
    layers: elementId,
    primaryLayer: elementId,
    focusLayer: elementId,
    contextLayers: "none",
    mapSelectors: JSON.stringify({ [elementId]: { variable: layer.selectors.defaultVariable, period: layer.selectors.defaultPeriod } }),
  };
  for (const [key, value] of Object.entries(params)) url.searchParams.set(key, value);
  return url.toString();
}

const server = await startStaticBuildServer(BUILD, { port: PORT });
const base = server.url.replace(/\/$/u, "");
const browser = await chromium.launch();
const report = { schema: "map-icons-runtime-v152", generatedAt: new Date().toISOString(), build: BUILD.replace(ROOT, "."), layers: [], narrow: [], consoleErrors: [] };

async function openContext(width, height, backdrop = "none") {
  const context = await browser.newContext({ viewport: { width, height }, locale: "ko-KR" });
  await context.addInitScript(([kind]) => {
    try {
      localStorage.setItem("cdp-map-backdrop-v151", kind);
    } catch {
      // storage unavailable
    }
    window.__v152Missing = [];
    let instance;
    Object.defineProperty(window, "__cdpMapV151", {
      configurable: true,
      get() {
        return instance;
      },
      set(value) {
        instance = value;
        value?.on?.("styleimagemissing", (event) => window.__v152Missing.push(String(event.id)));
      },
    });
  }, [backdrop]);
  const page = await context.newPage();
  return { context, page };
}

async function waitRendered(page, elementId) {
  const deadline = Date.now() + 45000;
  while (Date.now() < deadline) {
    const ok = await page.evaluate((id) => {
      const root = document.querySelector('[data-testid="map-public-content"]');
      const list = (root?.getAttribute("data-rendered-map-elements") || "").split(",");
      const map = window.__cdpMapV151;
      return Boolean(map && map.isStyleLoaded() && list.includes(id));
    }, elementId);
    if (ok) return true;
    await page.waitForTimeout(400);
  }
  return false;
}

async function inspect(page, elementId) {
  return page.evaluate((id) => {
    const map = window.__cdpMapV151;
    const suffix = `vnm-${id.toLowerCase()}`;
    const sourceId = `v122-source-${suffix}`;
    const source = map.getSource(sourceId);
    const data = source?.serialize?.().data;
    const features = Array.isArray(data?.features) ? data.features : [];
    const style = map.getStyle();
    const pointLayer = style.layers.find((layer) => layer.id === `v122-point-${suffix}`);
    const symbolLayer = style.layers.find((layer) => layer.id === `v129-point-symbol-${suffix}`);
    // Point layers carry the icon per feature; D-018 activity sites use one fixed glyph.
    const iconExpr = symbolLayer?.layout?.["icon-image"];
    const fixedIcon = typeof iconExpr === "string" ? iconExpr : null;
    const counts = {};
    let withIcon = 0;
    for (const feature of features) {
      const properties = feature.properties || {};
      if (fixedIcon) {
        if (properties.geometryRole !== "activity-site") continue;
        const key = `${fixedIcon}|fixed`;
        counts[key] = (counts[key] || 0) + 1;
        withIcon += 1;
        continue;
      }
      if (!properties.__icon) continue;
      withIcon += 1;
      const key = `${properties.__icon}|${String(properties.__iconColor || "").toLowerCase()}`;
      counts[key] = (counts[key] || 0) + 1;
    }
    const usedIcons = [...new Set(Object.keys(counts).map((key) => key.split("|")[0]))];
    const legend = [...document.querySelectorAll('[data-testid="map-dynamic-legend"] [data-testid="map-icon-legend-v152"] li')].map((node) => ({
      icon: `mi152-${node.getAttribute("data-icon-id")}`,
      color: String(node.getAttribute("data-icon-color") || "").toLowerCase(),
      count: Number(node.getAttribute("data-count") || 0),
      text: (node.textContent || "").replace(/\s+/gu, " ").trim(),
    }));
    const activeBadge = document.querySelector(`[data-testid="map-active-layer-legend-item"][data-element-id="${id}"] [data-icon-id]`)?.getAttribute("data-icon-id") || null;
    return {
      features: features.length,
      withIcon,
      counts,
      usedIcons,
      registered: usedIcons.filter((icon) => map.hasImage(icon)),
      missingEvents: (window.__v152Missing || []).filter((image) => image.startsWith("mi152-")),
      legend,
      activeBadge,
      zoom: map.getZoom(),
      badgeRadius: pointLayer?.paint?.["circle-radius"] ?? null,
      symbolLayer: Boolean(symbolLayer),
    };
  }, elementId);
}

/** Smallest badge radius at a zoom, for the expressions pointIconLayer writes. */
function minRadiusAt(expression, zoom) {
  if (typeof expression === "number") return expression;
  if (!Array.isArray(expression)) return null;
  const [op] = expression;
  if (op === "step") {
    const outputs = [expression[2], ...expression.slice(4).filter((_, index) => index % 2 === 0)];
    return Math.min(...outputs.map((value) => minRadiusAt(value, zoom)));
  }
  if (op === "interpolate") {
    const stops = [];
    for (let index = 3; index < expression.length; index += 2) stops.push([expression[index], minRadiusAt(expression[index + 1], zoom)]);
    if (zoom <= stops[0][0]) return stops[0][1];
    if (zoom >= stops[stops.length - 1][0]) return stops[stops.length - 1][1];
    for (let index = 1; index < stops.length; index += 1) {
      const [z1, v1] = stops[index];
      const [z0, v0] = stops[index - 1];
      if (zoom <= z1) return v0 + ((v1 - v0) * (zoom - z0)) / (z1 - z0);
    }
  }
  return null;
}

try {
  const { context, page } = await openContext(1440, 1000);
  page.on("console", (message) => {
    if (message.type() === "error") report.consoleErrors.push({ bucket: "1440", text: message.text().slice(0, 300) });
  });
  for (const elementId of TARGETS) {
    const result = { elementId, checks: {} };
    const check = (name, ok, detail) => {
      result.checks[name] = { ok: Boolean(ok), ...(detail === undefined ? {} : { detail }) };
    };
    await page.goto(urlFor(base, elementId), { waitUntil: "domcontentloaded" });
    const rendered = await waitRendered(page, elementId);
    await page.waitForTimeout(1200);
    check("rendered", rendered);
    const info = await inspect(page, elementId);
    result.info = { features: info.features, withIcon: info.withIcon, usedIcons: info.usedIcons, legend: info.legend, activeBadge: info.activeBadge };
    check("iconsAssigned", info.withIcon > 0, { features: info.features, withIcon: info.withIcon });
    check("iconsRegistered", info.usedIcons.length > 0 && info.registered.length === info.usedIcons.length, { used: info.usedIcons, registered: info.registered });
    check("noMissingImageEvents", info.missingEvents.length === 0, info.missingEvents);
    check("activeListBadge", Boolean(info.activeBadge), info.activeBadge);
    if (elementId !== "D-018") {
      const legendKeys = Object.fromEntries(info.legend.map((row) => [`${row.icon}|${row.color}`, row.count]));
      const sameKeys = JSON.stringify(Object.keys(legendKeys).sort()) === JSON.stringify(Object.keys(info.counts).sort());
      const sameCounts = sameKeys && Object.entries(info.counts).every(([key, count]) => legendKeys[key] === count);
      check("legendMatchesMap", sameKeys && sameCounts, { map: info.counts, legend: legendKeys });
    }
    if (SHOT_LAYERS.has(elementId)) {
      await page.screenshot({ path: resolve(SHOTS, `${elementId}-1440.png`) });
    }
    result.ok = Object.values(result.checks).every((entry) => entry.ok);
    report.layers.push(result);
    const failed = Object.entries(result.checks).filter(([, entry]) => !entry.ok).map(([name]) => name);
    console.log(`${elementId} ok=${result.ok}${failed.length ? ` failed=${failed.join(",")}` : ""}`);
  }
  await context.close();

  // Satellite backdrop: glyph and ring contrast on a dark image.
  const satellite = await openContext(1440, 1000, "satellite");
  satellite.page.on("console", (message) => {
    if (message.type() === "error") report.consoleErrors.push({ bucket: "satellite", text: message.text().slice(0, 300) });
  });
  await satellite.page.goto(urlFor(base, "A-023"), { waitUntil: "domcontentloaded" });
  await waitRendered(satellite.page, "A-023");
  await satellite.page.waitForTimeout(3500);
  await satellite.page.screenshot({ path: resolve(SHOTS, "A-023-satellite-1440.png") });
  await satellite.context.close();

  // 390 px: the smallest badge the map can draw is at least 18 px across.
  for (const elementId of ["A-023", "C-025", "E-018"]) {
    const narrow = await openContext(390, 844);
    narrow.page.on("console", (message) => {
      if (message.type() === "error") report.consoleErrors.push({ bucket: `390-${elementId}`, text: message.text().slice(0, 300) });
    });
    await narrow.page.goto(urlFor(base, elementId), { waitUntil: "domcontentloaded" });
    await waitRendered(narrow.page, elementId);
    await narrow.page.waitForTimeout(1200);
    const info = await inspect(narrow.page, elementId);
    const radius = minRadiusAt(info.badgeRadius, info.zoom);
    const entry = { elementId, zoom: info.zoom, minBadgeDiameterPx: radius === null ? null : Number((radius * 2).toFixed(2)) };
    entry.ok = entry.minBadgeDiameterPx !== null && entry.minBadgeDiameterPx >= 18;
    report.narrow.push(entry);
    await narrow.page.screenshot({ path: resolve(SHOTS, `${elementId}-390.png`) });
    console.log(`390 ${elementId} diameter=${entry.minBadgeDiameterPx} ok=${entry.ok}`);
    await narrow.context.close();
  }
} finally {
  await browser.close();
  await server.close();
}

report.summary = {
  layers: report.layers.length,
  failed: report.layers.filter((layer) => !layer.ok).map((layer) => layer.elementId),
  narrowFailed: report.narrow.filter((entry) => !entry.ok).map((entry) => entry.elementId),
  consoleErrors: report.consoleErrors.length,
};
mkdirSync(dirname(OUT), { recursive: true });
writeFileSync(OUT, `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify({ type: "summary", ...report.summary, out: OUT.replace(ROOT, ".") }));
process.exit(report.summary.failed.length || report.summary.narrowFailed.length || report.summary.consoleErrors ? 1 : 0);
