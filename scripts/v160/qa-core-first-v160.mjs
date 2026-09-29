#!/usr/bin/env node
/**
 * V160 core-first QA against production builds in real Chromium.
 *
 *   home     (withdrawn 2026-09-29 with the home restore - the home is the
 *            featured-data layout again; it stays in the overflow check)
 *   finder   the default list (no tier parameter) holds the core datasets
 *   detail   12 samples at 1280x800 (criteria of 2026-09-29, replacing the
 *            plan's 1.5 screens):
 *            (i)  first screen, all 12: the whole 판단 포인트 strip and the
 *                 top of the rank-1 block lie within the first 800px;
 *            (ii) a chart's layer 1 (the 1순위 차트 | 지도 row) ends within
 *                 2.0 screens; a timeline/table block is exempt and instead
 *                 opens on 10 items with '전체 보기';
 *            every collapsed layer starts with aria-expanded="false"
 *   map      the core group holds the policy file's layers, the rest folded
 *   all      no console/page errors; 320/390/768/1024/1440/1920 no overflow
 * Writes reports/v160/core-first-qa-v160.json.
 *
 * Usage: node scripts/v160/qa-core-first-v160.mjs [--build tmp/build-v160-review]
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
const OUT = resolve(ROOT, "reports/v160/core-first-qa-v160.json");
const catalog = JSON.parse(readFileSync(resolve(ROOT, "public/data/vietnam/v2/catalog.json"), "utf8")).elements;
const registry = JSON.parse(readFileSync(resolve(ROOT, "public/data/countries.json"), "utf8")).countries;
// The finder lists the public set (V156: publicStatus not excluded / not-provided).
const PUBLIC_SET = catalog.filter((element) => !["excluded", "not-provided"].includes(element.publicStatus));
const PREPARING_IDS = PUBLIC_SET.filter((element) => element.publicStatus === "not-collected").map((element) => element.elementId);
const LIVE_NAMES = registry.filter((country) => country.status === "live").map((country) => country.nameKo);
const mapDefaults = JSON.parse(readFileSync(resolve(ROOT, "src/data/map/mapDefaultLayersV160.json"), "utf8")).defaultElementIds;
const SAMPLES = ["A-003", "B-003", "A-018", "A-023", "D-022", "C-009", "A-016", "D-011", "A-002", "E-012", "C-012", "B-002"];
const WIDTHS = [320, 390, 768, 1024, 1440, 1920];

const report = { generatedAt: new Date().toISOString(), checks: [], evidence: {} };
const check = (id, pass, actual, expected) => report.checks.push({ id, pass: Boolean(pass), actual, expected });

const server = await startStaticBuildServer(BUILD, { port: 4371 });
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

// ---- home (restored 2026-09-29: the featured-data layout, figures from the
// current country's own data)
{
  const { context, page } = await freshPage({ width: 1440, height: 900 });
  await page.goto(`${url(server)}/`, { waitUntil: "networkidle", timeout: scaledTimeoutMsV150(90_000) });
  await page.waitForFunction(() => document.querySelectorAll(".home-featured-v139__card").length >= 8, null, { timeout: scaledTimeoutMsV150(60_000) }).catch(() => null);
  const home = await page.evaluate(() => ({
    cards: [...document.querySelectorAll(".home-featured-v139__card")].map((card) => ({
      id: card.getAttribute("data-element-id"),
      summary: Boolean(card.querySelector('[data-testid="finder-card-summary-v140"], .fcs140-headline')),
      preparing: (card.textContent || "").includes("데이터 준비 중"),
    })),
    scope: (document.querySelector(".home-final-scope")?.textContent || "").trim(),
  }));
  report.evidence.home = home;
  check("HOME_FEATURED_EIGHT", home.cards.length === 8 && new Set(home.cards.map((card) => card.id)).size === 8, home.cards.map((card) => card.id), "eight distinct featured datasets");
  check(
    "HOME_FIGURES_FROM_CURRENT_COUNTRY",
    LIVE_NAMES.every((name) => home.scope.includes(name)) && home.cards.every((card) => card.summary || card.preparing),
    { scope: home.scope, cards: home.cards },
    { scopeNames: LIVE_NAMES, card: "a summary from the country's data, or '데이터 준비 중'" }
  );
  await context.close();
}

// ---- finder (R-10): every public dataset, 가나다순 by default or 조회순, sort in the URL
async function loadAllCards(page) {
  for (let guard = 0; guard < 20; guard += 1) {
    const shown = await page.$$eval('[data-testid="public-finder-card-v135"]', (nodes) => nodes.length);
    const total = await page.$eval('[data-testid="finder-results-v136"]', (node) => Number(node.getAttribute("data-total-count")));
    if (shown >= total) break;
    await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
    await page.waitForTimeout(700);
  }
  return page.$$eval('[data-testid="public-finder-card-v135"]', (nodes) => nodes.map((node) => ({
    id: node.getAttribute("data-element-id"),
    title: (node.querySelector("h2")?.textContent || "").replace(/\s+/gu, " ").trim(),
    preparing: (node.textContent || "").includes("데이터 준비 중"),
  })));
}
{
  const { context, page } = await freshPage({ width: 1440, height: 900 });
  await page.goto(`${url(server)}/#explorer`, { waitUntil: "networkidle", timeout: scaledTimeoutMsV150(90_000) });
  await page.waitForFunction(() => Number(document.querySelector('[data-testid="finder-results-v136"]')?.getAttribute("data-total-count") || 0) > 0, null, { timeout: scaledTimeoutMsV150(60_000) });
  const total = await page.$eval('[data-testid="finder-results-v136"]', (node) => Number(node.getAttribute("data-total-count")));
  check("FINDER_LISTS_PUBLIC_SET", total === PUBLIC_SET.length, total, PUBLIC_SET.length);
  const cards = await loadAllCards(page);
  const listed = cards.filter((card) => !PREPARING_IDS.includes(card.id));
  const collator = new Intl.Collator("ko");
  const sorted = [...listed].sort((a, b) => collator.compare(a.title, b.title));
  const sortValue = await page.$eval('[data-testid="finder-sort-v160"]', (node) => node.value).catch(() => null);
  check(
    "FINDER_SORT_NAME_DEFAULT",
    sortValue === "name" && JSON.stringify(listed.map((card) => card.id)) === JSON.stringify(sorted.map((card) => card.id)),
    { sortValue, firstTen: listed.slice(0, 10).map((card) => card.title) },
    "가나다순 selected; cards in Intl.Collator('ko') order of the shown name"
  );
  const tail = cards.slice(cards.length - PREPARING_IDS.length);
  check(
    "FINDER_PREPARING_LAST",
    cards.length === total && tail.every((card) => PREPARING_IDS.includes(card.id) && card.preparing),
    { loaded: cards.length, tail },
    { lastIds: PREPARING_IDS, label: "데이터 준비 중" }
  );
  // 조회순: kept in the URL across a filter change; on a host without the
  // usage service the option is disabled and the list stays in name order.
  await page.goto(`${url(server)}/?sort=views#explorer`, { waitUntil: "networkidle", timeout: scaledTimeoutMsV150(90_000) });
  await page.waitForSelector('[data-testid="finder-sort-v160"]', { timeout: scaledTimeoutMsV150(60_000) });
  await page.evaluate(() => {
    const select = [...document.querySelectorAll("select")].find((node) => [...node.options].some((option) => option.value === "A") && [...node.options].some((option) => option.value === "E"));
    if (!select) return;
    Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, "value").set.call(select, "B");
    select.dispatchEvent(new Event("change", { bubbles: true }));
  });
  await page.waitForTimeout(800);
  const views = await page.evaluate(() => ({
    url: window.location.search,
    viewsDisabled: document.querySelector('[data-testid="finder-sort-v160"] option[value="views"]')?.disabled ?? null,
    selected: document.querySelector('[data-testid="finder-sort-v160"]')?.value ?? null,
  }));
  check(
    "FINDER_SORT_URL_KEPT",
    /[?&]sort=views\b/u.test(views.url) && /[?&]category=B\b/u.test(views.url) && (views.viewsDisabled ? views.selected === "name" : views.selected === "views"),
    views,
    "sort=views kept after a filter change; 조회순 disabled (name order shown) only where the usage service is absent"
  );
  report.evidence.finderSort = { total, views };
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
      const rank1Top = rank1 ? Math.round(rank1.getBoundingClientRect().top + window.scrollY) : null;
      const rank1Type = rank1?.getAttribute("data-analysis-block") || null;
      const strip = document.querySelector('[data-testid="decision-points-v159"]');
      const fold = rank1?.querySelector("[data-v160-list-fold]") || null;
      const foldItems = fold ? [...fold.querySelectorAll(":scope > ol > li, :scope > ul > li")] : [];
      const listFold = fold
        ? {
            state: fold.getAttribute("data-v160-list-fold"),
            items: foldItems.length,
            shown: foldItems.filter((item) => item.getBoundingClientRect().height > 0).length,
            button: Boolean(fold.querySelector(":scope > .rank-fold-v160")),
          }
        : null;
      const layers = [...document.querySelectorAll('[data-testid="detail-layer-v160"]')].map((layer) => ({
        layer: layer.getAttribute("data-layer"),
        expanded: layer.querySelector("summary")?.getAttribute("aria-expanded"),
      }));
      // The later charts folded under the first chart (layer 2) start closed too.
      const more = document.querySelector('[data-testid="detail-layer-v160-more"]');
      if (more) layers.push({ layer: "2-charts", expanded: more.getAttribute("aria-expanded") });
      return { layer1Bottom: rank1Bottom, primaryBottom: bottom(primary), rank1Top, rank1Type, stripBottom: bottom(strip), listFold, layers };
    });
    const ratio = (value) => (value ? Math.round((value / 800) * 100) / 100 : null);
    heights.push({ id, rank1Type: measure.rank1Type, rank1Top: measure.rank1Top, stripBottom: measure.stripBottom, layer1Bottom: measure.layer1Bottom, ratio: ratio(measure.layer1Bottom), primaryBottom: measure.primaryBottom, primaryRatio: ratio(measure.primaryBottom), listFold: measure.listFold });
    collapsed.push({ id, layers: measure.layers });
    await context.close();
  }
  report.evidence.layer1 = heights;
  report.evidence.layers = collapsed;
  const LONG_TYPES = new Set(["timeline", "table", "comparison-table", "sorted-table"]);
  const firstScreen = heights.map((row) => ({ id: row.id, rank1Top: row.rank1Top, stripBottom: row.stripBottom, pass: row.rank1Top !== null && row.rank1Top < 800 && (row.stripBottom === null || row.stripBottom <= 800) }));
  check("DETAIL_FIRST_SCREEN_12", firstScreen.every((row) => row.pass), firstScreen, "판단 포인트 strip bottom <= 800 and rank-1 top < 800, 12/12");
  const charts = heights.filter((row) => !LONG_TYPES.has(row.rank1Type));
  check("DETAIL_CHART_LAYER1_WITHIN_2_SCREENS", charts.every((row) => row.ratio !== null && row.ratio <= 2.0), charts.map((row) => ({ id: row.id, type: row.rank1Type, ratio: row.ratio })), "<= 2.0 x 800px");
  const long = heights.filter((row) => LONG_TYPES.has(row.rank1Type));
  check(
    "DETAIL_LONG_BLOCK_OPENS_ON_10",
    long.every((row) => !row.listFold || row.listFold.items <= 10 || (row.listFold.state === "closed" && row.listFold.shown <= 10 && row.listFold.button)),
    long.map((row) => ({ id: row.id, type: row.rank1Type, listFold: row.listFold, ratio: row.ratio })),
    "timeline/table: 10 items shown + '전체 보기'"
  );
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
  const pages = ["/", "/#explorer", "/?sort=views#explorer", "/?view=data&country=VNM&element=A-003#element-detail", "/?view=data&country=VNM&element=C-009#element-detail", "/?country=VNM#map"];
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
const failed = report.checks.filter((item) => !item.pass).map((item) => item.id);
report.summary = { total: report.checks.length, pass: report.checks.length - failed.length, failed };
mkdirSync(dirname(OUT), { recursive: true });
writeFileSync(OUT, `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify({ ...report.summary, layer1: report.evidence.layer1.map((row) => `${row.id}:${row.rank1Type}:top${row.rank1Top}:strip${row.stripBottom}:${row.ratio}`).join(" ") }));
if (failed.length) process.exitCode = 1;
