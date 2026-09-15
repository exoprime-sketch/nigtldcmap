/**
 * Home runtime QA (V139): the home at five widths from a static build, with
 * the measurements the acceptance criteria name - no duplicate function cards,
 * eight featured datasets with valid links, search examples that open results,
 * the hero map link opening the data map with A-024 selected, no horizontal
 * overflow, no clipped text, no console or HTTP errors, and no map engine
 * loaded on first entry.
 */
import { chromium } from "playwright";
import { mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { PROJECT_ROOT } from "../v125/audit-utils.mjs";
import { startStaticBuildServer } from "../v125/browser-runtime.mjs";

const OUT = resolve(PROJECT_ROOT, "reports/v139");
const SHOTS = resolve(OUT, "screenshots/home");
mkdirSync(SHOTS, { recursive: true });
const server = await startStaticBuildServer(resolve(PROJECT_ROOT, "build"));
const browser = await chromium.launch();
const report = { generatedAt: new Date().toISOString(), widths: [], interactions: {}, consoleErrors: [], httpFailures: [] };

async function newPage(width, height) {
  const context = await browser.newContext({ viewport: { width, height } });
  const page = await context.newPage();
  page.on("console", (message) => {
    if (message.type() === "error") report.consoleErrors.push({ width, text: message.text().slice(0, 300) });
  });
  page.on("response", (response) => {
    if (response.status() >= 400) report.httpFailures.push({ width, url: response.url(), status: response.status() });
  });
  return { context, page };
}

const measure = () => {
  const root = document.querySelector("[data-v128-home]");
  const clipped = [...root.querySelectorAll("h1, h2, h3, p, dt, dd, button, small, span, strong, li")]
    .filter((node) => {
      const style = getComputedStyle(node);
      if (style.overflow !== "hidden" && style.textOverflow !== "ellipsis") return false;
      return node.scrollWidth > node.clientWidth + 1 || node.scrollHeight > node.clientHeight + 1;
    })
    .map((node) => node.textContent.trim().slice(0, 60));
  const heroRect = root.querySelector(".home-hero-v139").getBoundingClientRect();
  const featured = root.querySelector(".home-featured-v139");
  const h1 = root.querySelector("h1").getBoundingClientRect();
  const cards = [...root.querySelectorAll(".home-featured-v139__card")].map((card) => ({
    id: card.getAttribute("data-element-id"),
    kind: card.getAttribute("data-preview-kind"),
    title: card.querySelector("h3")?.textContent.trim(),
    hasChart: Boolean(card.querySelector("svg, img")),
    period: card.querySelector("dd")?.textContent.trim(),
    height: Math.round(card.getBoundingClientRect().height),
  }));
  const homeText = root.innerText;
  const nestedControls = [...root.querySelectorAll("button button, a button, button a, a a")].length;
  const duplicateFunctionCards = [...root.querySelectorAll("button, a")].filter((node) =>
    /^(데이터 찾기|데이터 지도|데이터 다운로드)$/u.test(node.textContent.trim())
  ).length;
  return {
    documentOverflow: document.documentElement.scrollWidth > window.innerWidth + 1,
    clipped,
    heroHeight: Math.round(heroRect.height),
    h1Top: Math.round(h1.top + window.scrollY),
    featuredTop: Math.round(featured.getBoundingClientRect().top + window.scrollY),
    statusTop: Math.round(root.querySelector(".home-status-v139").getBoundingClientRect().top + window.scrollY),
    cards,
    duplicateFunctionCards,
    nestedControls,
    mapEngine: Boolean(document.querySelector(".maplibregl-map, .maplibregl-canvas")),
    heroMap: Boolean(root.querySelector('[data-testid="home-hero-map-v139"] img')),
    searchPlaceholder: root.querySelector("#home-search")?.getAttribute("placeholder"),
    examples: [...root.querySelectorAll(".home-final-suggestions button")].map((b) => b.textContent.trim()),
    topics: [...root.querySelectorAll(".home-category-chips button")].map((b) => b.textContent.trim()),
    statusLine: root.querySelector(".home-status-v139").innerText.replace(/\s+/g, " ").trim(),
    internalPhrases: (homeText.match(/검토의견|자체 검산|CF\/M0\d|attr_\d+|1\.2_entity/gu) || []).slice(0, 5),
  };
};

for (const [width, height] of [[390, 844], [768, 1024], [1024, 800], [1440, 1000], [1920, 1080]]) {
  const { context, page } = await newPage(width, height);
  const jsRequests = [];
  page.on("request", (request) => {
    if (request.resourceType() === "script") jsRequests.push(request.url());
  });
  await page.goto(`${server.url}/#home`, { waitUntil: "domcontentloaded" });
  await page.waitForSelector(".home-featured-v139__card", { timeout: 60000 });
  await page.waitForTimeout(1200);
  const result = await page.evaluate(measure);
  result.width = width;
  result.mapChunkRequested = jsRequests.some((url) => /maplibre|RealMapExplorer/iu.test(url));
  result.scriptRequests = jsRequests.length;
  await page.screenshot({ path: resolve(SHOTS, `home-${width}.png`) });
  await page.screenshot({ path: resolve(SHOTS, `home-${width}-full.png`), fullPage: true });
  report.widths.push(result);
  await context.close();
}

// Interactions at 1440: example search, hero map link, card detail, topic chip.
{
  const { context, page } = await newPage(1440, 1000);
  const home = async () => {
    await page.goto(`${server.url}/#home`, { waitUntil: "domcontentloaded" });
    await page.waitForSelector(".home-featured-v139__card", { timeout: 60000 });
  };
  await home();
  await page.click('.home-final-suggestions button:has-text("송전망")');
  await page.waitForTimeout(1500);
  report.interactions.exampleSearch = await page.evaluate(() => ({
    hash: location.hash,
    query: new URLSearchParams(location.search).get("q"),
    cards: document.querySelectorAll(".cdp-dataset-card").length,
    firstCard: document.querySelector(".cdp-dataset-card")?.innerText.replace(/\s+/g, " ").slice(0, 80) || null,
  }));
  await home();
  await page.click('[data-testid="home-hero-map-link-v139"]');
  await page.waitForSelector('[data-testid="map-public-content"]', { timeout: 60000 });
  await page.waitForFunction(
    () => document.querySelector('[data-testid="map-public-content"]')?.getAttribute("data-primary-element") === "A-024",
    null,
    { timeout: 60000 }
  );
  report.interactions.heroMapLink = await page.evaluate(() => ({
    hash: location.hash,
    primary: document.querySelector('[data-testid="map-public-content"]')?.getAttribute("data-primary-element"),
    primaryLayerParam: new URLSearchParams(location.search).get("primaryLayer"),
  }));
  const cardLinks = [];
  for (const id of ["A-002", "A-003", "A-010", "A-023", "A-024", "B-033", "C-016", "D-023"]) {
    await home();
    await page.click(`.home-featured-v139__card[data-element-id="${id}"] .home-featured-v139__open`);
    await page.waitForFunction(
      () => document.querySelector('[data-testid="public-analysis-root"]')?.getAttribute("data-analysis-state") === "ready",
      null,
      { timeout: 60000 }
    );
    cardLinks.push(
      await page.evaluate(
        (elementId) => ({
          id: elementId,
          element: new URLSearchParams(location.search).get("element"),
          h1: document.querySelector("main h1")?.textContent.trim().slice(0, 60),
        }),
        id
      )
    );
  }
  report.interactions.cardLinks = cardLinks;
  await home();
  await page.click('.home-category-chips button:has-text("기후·환경")');
  await page.waitForTimeout(1200);
  report.interactions.topicChip = await page.evaluate(() => ({
    hash: location.hash,
    category: new URLSearchParams(location.search).get("category"),
    cards: document.querySelectorAll(".cdp-dataset-card").length,
  }));
  await context.close();
}

report.summary = {
  widthsWithOverflow: report.widths.filter((w) => w.documentOverflow).map((w) => w.width),
  widthsWithClippedText: report.widths.filter((w) => w.clipped.length).map((w) => w.width),
  duplicateFunctionCards: Math.max(...report.widths.map((w) => w.duplicateFunctionCards)),
  nestedControls: Math.max(...report.widths.map((w) => w.nestedControls)),
  mapEngineOnHome: report.widths.some((w) => w.mapEngine || w.mapChunkRequested),
  featuredCards: report.widths[0].cards.length,
  cardsWithChart: report.widths[0].cards.filter((c) => c.hasChart).length,
  consoleErrors: report.consoleErrors.length,
  httpFailures: report.httpFailures.length,
  internalPhrases: report.widths.flatMap((w) => w.internalPhrases),
};
writeFileSync(resolve(OUT, "home-runtime-qa-v139.json"), JSON.stringify(report, null, 2));
console.log(JSON.stringify(report.summary));
console.log(
  JSON.stringify(
    report.widths.map((w) => ({ width: w.width, hero: w.heroHeight, h1Top: w.h1Top, statusTop: w.statusTop, featuredTop: w.featuredTop }))
  )
);
console.log(JSON.stringify(report.interactions));
await browser.close();
await server.close?.();
process.exit(0);
