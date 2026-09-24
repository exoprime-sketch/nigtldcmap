#!/usr/bin/env node
/**
 * V160 core-first QA against production builds in real Chromium.
 *
 *   home     six question cards; body words of the home against the pre-V160
 *            build (--base), target -50% or more (first-viewport words recorded)
 *   finder   the default list (no tier parameter) holds the core datasets
 *   detail   12 samples at 1280x800: layer 1 as the plan defines it (hero ->
 *            판단 포인트 -> 1순위 차트 | 지도 자리) ends within 1.5 viewports;
 *            the whole primary analysis section's bottom is recorded too;
 *            every collapsed layer starts with aria-expanded="false"
 *   map      the core group holds the policy file's layers, the rest folded
 *   all      no console/page errors; 320/390/768/1024/1440/1920 no overflow
 * Writes reports/v160/core-first-qa-v160.json.
 *
 * Usage: node scripts/v160/qa-core-first-v160.mjs [--build tmp/build-v160-review] [--base tmp/build-v159-review]
 */
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";
import { startStaticBuildServer, scaledTimeoutMsV150 } from "../v125/browser-runtime.mjs";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const args = process.argv.slice(2);
const opt = (name, fallback) => {
  const index = args.indexOf(name);
  return index >= 0 && args[index + 1] ? args[index + 1] : fallback;
};
const BUILD = resolve(ROOT, opt("--build", "tmp/build-v160-review"));
const BASE_BUILD = resolve(ROOT, opt("--base", "tmp/build-v159-review"));
const OUT = resolve(ROOT, "reports/v160/core-first-qa-v160.json");
const tiers = JSON.parse(readFileSync(resolve(ROOT, "src/data/spec/informationTiersV160.json"), "utf8")).rows;
const mapDefaults = JSON.parse(readFileSync(resolve(ROOT, "src/data/map/mapDefaultLayersV160.json"), "utf8")).defaultElementIds;
const CORE_COUNT = tiers.filter((row) => row.tier === "core").length;
const SAMPLES = ["A-003", "B-003", "A-018", "A-023", "D-022", "C-009", "A-016", "D-011", "A-002", "E-012", "C-012", "B-002"];
const WIDTHS = [320, 390, 768, 1024, 1440, 1920];

const report = { generatedAt: new Date().toISOString(), checks: [], evidence: {} };
const check = (id, pass, actual, expected) => report.checks.push({ id, pass: Boolean(pass), actual, expected });

const server = await startStaticBuildServer(BUILD, { port: 4371 });
const baseServer = await startStaticBuildServer(BASE_BUILD, { port: 4372 });
const url = (srv) => srv.url.replace(/\/$/u, "");
const browser = await chromium.launch(process.env.V125_BROWSER_EXECUTABLE ? { executablePath: process.env.V125_BROWSER_EXECUTABLE } : {});
const errors = [];

async function freshPage(viewport) {
  // A new context each time: no remembered layer state, no stored filters.
  const context = await browser.newContext({ locale: "ko-KR", viewport });
  const page = await context.newPage();
  page.on("pageerror", (error) => errors.push(`pageerror ${String(error).slice(0, 160)}`));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text().slice(0, 160));
  });
  return { context, page };
}

// Words a reader meets on the first screen of the home (visible text inside
// the page or, with viewportOnly, the first viewport; header navigation excluded).
async function homeWords(baseUrl, viewportOnly) {
  const { context, page } = await freshPage({ width: 1440, height: 900 });
  await page.goto(`${baseUrl}/`, { waitUntil: "networkidle", timeout: scaledTimeoutMsV150(90_000) });
  await page.waitForTimeout(1500);
  const words = await page.evaluate((viewportOnly) => {
    const walker = document.createTreeWalker(document.querySelector("main") || document.body, NodeFilter.SHOW_TEXT);
    let count = 0;
    for (let node = walker.nextNode(); node; node = walker.nextNode()) {
      const parent = node.parentElement;
      if (!parent || parent.closest("header, nav, script, style, [hidden], [aria-hidden='true']")) continue;
      const text = (node.textContent || "").trim();
      if (!text) continue;
      const rect = parent.getBoundingClientRect();
      if (rect.width === 0) continue;
      if (viewportOnly && (rect.bottom <= 0 || rect.top >= window.innerHeight)) continue;
      count += text.split(/\s+/u).filter(Boolean).length;
    }
    return count;
  }, viewportOnly);
  await context.close();
  return words;
}

// ---- home
{
  // The plan's "첫 화면" is the home itself (the site's first screen): the
  // criterion is the home's whole visible body text; the words inside the
  // first 1440x900 viewport are recorded as well.
  const before = await homeWords(url(baseServer), false);
  const after = await homeWords(url(server), false);
  const viewportBefore = await homeWords(url(baseServer), true);
  const viewportAfter = await homeWords(url(server), true);
  const reduction = before ? Math.round((1 - after / before) * 1000) / 10 : null;
  report.evidence.homeWords = { before, after, reductionPercent: reduction, viewportBefore, viewportAfter };
  check("HOME_BODY_WORDS_MINUS_50", reduction !== null && reduction >= 50, report.evidence.homeWords, ">= 50% fewer words on the home");
  const { context, page } = await freshPage({ width: 1440, height: 900 });
  await page.goto(`${url(server)}/`, { waitUntil: "networkidle", timeout: scaledTimeoutMsV150(90_000) });
  await page.waitForSelector('[data-testid="home-question-v160"]', { timeout: scaledTimeoutMsV150(30_000) });
  const cards = await page.$$eval('[data-testid="home-question-v160"]', (nodes) => nodes.map((node) => node.getAttribute("data-display-type")));
  check("HOME_SIX_QUESTIONS", cards.length === 6, cards, 6);
  await context.close();
}

// ---- finder default
{
  const { context, page } = await freshPage({ width: 1440, height: 900 });
  await page.goto(`${url(server)}/#explorer`, { waitUntil: "networkidle", timeout: scaledTimeoutMsV150(90_000) });
  await page.waitForFunction(() => Number(document.querySelector('[data-testid="finder-results-v136"]')?.getAttribute("data-total-count") || 0) > 0, null, { timeout: scaledTimeoutMsV150(60_000) });
  const total = await page.$eval('[data-testid="finder-results-v136"]', (node) => Number(node.getAttribute("data-total-count")));
  check("FINDER_DEFAULT_CORE", total === CORE_COUNT, total, CORE_COUNT);
  await context.close();
}

// ---- detail layers
{
  const heights = [];
  const collapsed = [];
  for (const id of SAMPLES) {
    const { context, page } = await freshPage({ width: 1280, height: 800 });
    await page.goto(`${url(server)}/?view=data&country=VNM&element=${id}#element-detail`, { waitUntil: "domcontentloaded", timeout: scaledTimeoutMsV150(90_000) });
    await page.waitForFunction(() => document.querySelector('[data-testid="public-analysis-root"]')?.getAttribute("data-analysis-state") === "ready", null, { timeout: scaledTimeoutMsV150(60_000) }).catch(() => null);
    await page.waitForTimeout(1500);
    const measure = await page.evaluate(() => {
      const primary = document.querySelector('[data-testid="public-analysis-primary"]');
      const bottom = (node) => (node ? Math.round(node.getBoundingClientRect().bottom + window.scrollY) : null);
      // 1순위 차트 = the first analysis block; the map slot sits beside it.
      const rank1 = primary?.querySelector("[data-analysis-block]") || null;
      const slot = document.querySelector('[data-testid="detail-map-slot-v153"]');
      const rank1Bottom = rank1 ? Math.max(bottom(rank1), slot ? bottom(slot) : 0) : null;
      const layers = [...document.querySelectorAll('[data-testid="detail-layer-v160"]')].map((layer) => ({
        layer: layer.getAttribute("data-layer"),
        expanded: layer.querySelector("summary")?.getAttribute("aria-expanded"),
      }));
      return { layer1Bottom: rank1Bottom, primaryBottom: bottom(primary), layers };
    });
    const ratio = (value) => (value ? Math.round((value / 800) * 100) / 100 : null);
    heights.push({ id, layer1Bottom: measure.layer1Bottom, ratio: ratio(measure.layer1Bottom), primaryBottom: measure.primaryBottom, primaryRatio: ratio(measure.primaryBottom) });
    collapsed.push({ id, layers: measure.layers });
    await context.close();
  }
  report.evidence.layer1 = heights;
  report.evidence.layers = collapsed;
  check("DETAIL_LAYER1_WITHIN_1_5_SCREENS", heights.every((row) => row.ratio !== null && row.ratio <= 1.5), heights, "<= 1.5 x 800px");
  check("DETAIL_LAYERS_START_COLLAPSED", collapsed.every((row) => row.layers.length >= 2 && row.layers.every((layer) => layer.expanded === "false")), collapsed, 'every layer summary aria-expanded="false"');
}

// ---- map default layers
{
  const { context, page } = await freshPage({ width: 1440, height: 900 });
  await page.goto(`${url(server)}/?country=VNM#map`, { waitUntil: "domcontentloaded", timeout: scaledTimeoutMsV150(90_000) });
  await page.waitForSelector('[data-map-core-v160="true"]', { timeout: scaledTimeoutMsV150(60_000) });
  await page.waitForTimeout(1000);
  const map = await page.evaluate(() => {
    const core = document.querySelector('[data-map-core-v160="true"]');
    const more = document.querySelector('[data-testid="map-more-layers-v160"]');
    const hiddenGroups = [...document.querySelectorAll("[data-map-group-v135]")].filter((group) => group.hidden).length;
    return {
      coreIds: core ? [...core.querySelectorAll(".cdp-map-catalog-v138__item[data-map-element]")].map((row) => row.getAttribute("data-map-element")) : [],
      coreOpen: core?.querySelector('[data-testid="map-catalog-group-toggle-v138"]')?.getAttribute("aria-expanded"),
      moreExpanded: more?.getAttribute("aria-expanded") ?? null,
      hiddenGroups,
    };
  });
  report.evidence.map = map;
  check("MAP_DEFAULT_LAYERS_MATCH_POLICY", JSON.stringify(map.coreIds) === JSON.stringify(mapDefaults), map.coreIds, mapDefaults);
  check("MAP_CORE_OPEN_MORE_FOLDED", map.coreOpen === "true" && map.moreExpanded === "false" && map.hiddenGroups > 0, map, "core open, 더 많은 레이어 folded");
  await context.close();
}

// ---- overflow at six widths
{
  const pages = ["/", "/#explorer", "/?tier=all#explorer", "/?view=data&country=VNM&element=A-003#element-detail", "/?view=data&country=VNM&element=C-009#element-detail", "/?country=VNM#map"];
  const rows = [];
  for (const path of pages) {
    for (const width of WIDTHS) {
      const { context, page } = await freshPage({ width, height: 900 });
      await page.goto(`${url(server)}${path}`, { waitUntil: "domcontentloaded", timeout: scaledTimeoutMsV150(90_000) });
      await page.waitForTimeout(2500);
      const overflow = await page.evaluate(() => Math.max(document.documentElement.scrollWidth, document.body.scrollWidth) - window.innerWidth);
      rows.push({ path, width, overflow });
      await context.close();
    }
  }
  report.evidence.overflow = rows.filter((row) => row.overflow > 0);
  check("NO_HORIZONTAL_OVERFLOW_6_WIDTHS", rows.every((row) => row.overflow <= 0), report.evidence.overflow, []);
}

report.evidence.consoleErrors = errors;
check("CONSOLE_ERRORS_ZERO", errors.length === 0, errors.slice(0, 20), []);
await browser.close();
await server.close();
await baseServer.close();
const failed = report.checks.filter((item) => !item.pass).map((item) => item.id);
report.summary = { total: report.checks.length, pass: report.checks.length - failed.length, failed };
mkdirSync(dirname(OUT), { recursive: true });
writeFileSync(OUT, `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify({ ...report.summary, homeWords: report.evidence.homeWords, layer1: report.evidence.layer1.map((row) => `${row.id}:${row.ratio}`).join(" ") }));
if (failed.length) process.exitCode = 1;
