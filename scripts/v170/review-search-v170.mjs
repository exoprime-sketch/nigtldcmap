#!/usr/bin/env node
/**
 * V170 review: the finder with a query, before (main build) and after (this
 * branch's build), in a real browser.
 *
 *   node scripts/v170/review-search-v170.mjs --after tmp/build-v170-review \
 *     [--before tmp/build-v170-before] [--out reports/v170/screens] \
 *     [--queries 태양광,풍력,홍수] [--country VNM]
 *
 * Writes 1440px captures (top of the list, first evidence cards, the folded
 * group), a JSON of what each query shows, and checks the six widths for
 * horizontal overflow and the evidence lines for internal codes.
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { chromium } from "playwright";
import { PROJECT_ROOT } from "../v125/audit-utils.mjs";
import { startStaticBuildServer } from "../v125/browser-runtime.mjs";

const argv = process.argv.slice(2);
const arg = (name, fallback = null) => {
  const index = argv.indexOf(name);
  return index === -1 ? fallback : argv[index + 1];
};
const AFTER = arg("--after", "tmp/build-v170-review");
const BEFORE = arg("--before", null);
const OUT = resolve(PROJECT_ROOT, arg("--out", "reports/v170/screens"));
const QUERIES = arg("--queries", "태양광,풍력,홍수").split(",").filter(Boolean);
const COUNTRY = arg("--country", "VNM");
const WIDTHS = [320, 390, 768, 1024, 1440, 1920];
// ASCII file names for the captures (the repository keeps file names ASCII).
const SLUG = { 태양광: "solar", 풍력: "wind", 홍수: "flood" };
const slug = (query) => SLUG[query] || encodeURIComponent(query).replace(/%/g, "");
// Internal shapes that must not reach the evidence line.
const INTERNAL = /\b[A-E]-\d{3}\b|_[a-z]+_|속성\d|normalizedAttributes|indicatorId|\.(csv|json|xlsx|geojson)\b|https?:\/\//u;

mkdirSync(OUT, { recursive: true });
const executablePath = process.env.V125_BROWSER_EXECUTABLE || "/opt/pw-browsers/chromium";
const browser = await chromium.launch({ executablePath, args: ["--no-sandbox"] });

async function openFinder(base, query, country, width) {
  const page = await browser.newPage({ viewport: { width, height: 1000 }, deviceScaleFactor: 1 });
  const url = `${base}/?q=${encodeURIComponent(query)}&country=${country}#explorer`;
  await page.goto(url, { waitUntil: "domcontentloaded" });
  await page.waitForSelector('[data-testid="finder-results-v136"] [data-testid="public-finder-card-v135"]', { timeout: 60000 });
  // The searched list settles once its search text is in (the "확장하는 중" note goes).
  try {
    await page.waitForFunction(() => !document.body.innerText.includes("검색 범위를 확장하는 중"), null, { timeout: 60000 });
  } catch (error) {
    const state = await page.evaluate(() => document.querySelector(".cdp-filter-actions")?.innerText || "");
    throw new Error(`${url} at ${width}px never settled: ${state.replace(/\s+/g, " ")}`);
  }
  await page.waitForTimeout(800);
  return page;
}

/** The result list at the top of the viewport (no smooth scrolling). */
async function scrollToResults(page) {
  await page.evaluate(() => {
    const el = document.querySelector('[data-testid="search-tiers-v170"]') || document.querySelector('[data-testid="finder-results-v136"]');
    document.documentElement.style.scrollBehavior = "auto";
    window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 96, behavior: "instant" });
  });
  await page.waitForTimeout(500);
}

async function describe(page) {
  return page.evaluate(() => {
    const text = (el) => (el ? el.innerText.replace(/\s+/g, " ").trim() : "");
    const cards = Array.from(document.querySelectorAll('[data-testid="public-finder-card-v135"]'));
    const panel = document.querySelector('[data-testid="search-topic-panel-v170"]');
    return {
      count: text(document.querySelector(".cdp-result-count")),
      sort: document.querySelector('[data-testid="finder-sort-v160"]')?.value || null,
      synonyms: text(document.querySelector('[data-testid="search-synonyms-v170"]')),
      tiers: Array.from(document.querySelectorAll('[data-testid="search-tiers-v170"] button')).map((b) => text(b)),
      tiersTitle: text(document.querySelector(".sr170-tiers__title")),
      sections: Array.from(document.querySelectorAll('[data-testid="search-section-v170"] h3')).map((h) => text(h)),
      collapsed: text(document.querySelector('[data-testid="search-collapsed-v170"] strong')),
      panel: panel
        ? Array.from(panel.querySelectorAll(".tp170__row")).map((row) => ({
            elementId: row.getAttribute("data-element-id"),
            role: text(row.querySelector(".tp170__role")),
            name: text(row.querySelector(".tp170__name strong")),
            value: text(row.querySelector(".tp170__figure strong")),
            sub: text(row.querySelector(".tp170__figure small")),
          }))
        : null,
      panelTitle: text(panel?.querySelector("h2")),
      visibleCards: cards.length,
      first12: cards.slice(0, 12).map((card) => ({
        elementId: card.getAttribute("data-element-id"),
        tier: card.getAttribute("data-match-tier"),
        title: text(card.querySelector("h2")),
        evidence: text(card.querySelector('[data-testid="search-evidence-v170"]')),
      })),
      evidenceAll: cards.map((card) => text(card.querySelector('[data-testid="search-evidence-v170"]'))).filter(Boolean),
    };
  });
}

const servers = [];
async function serve(dir, port) {
  const server = await startStaticBuildServer(resolve(PROJECT_ROOT, dir), { port });
  servers.push(server);
  return server.url.replace(/\/$/, "");
}

const result = { country: COUNTRY, queries: {}, overflow: [], internal: [] };
const afterBase = await serve(AFTER, 4472);
const beforeBase = BEFORE ? await serve(BEFORE, 4471) : null;

try {
  for (const query of QUERIES) {
    const entry = (result.queries[query] = {});
    if (beforeBase) {
      const page = await openFinder(beforeBase, query, COUNTRY, 1440);
      entry.before = await describe(page);
      await page.screenshot({ path: resolve(OUT, `${slug(query)}-before-1440.png`) });
      await scrollToResults(page);
      await page.screenshot({ path: resolve(OUT, `${slug(query)}-before-1440-cards.png`) });
      await page.close();
    }
    const page = await openFinder(afterBase, query, COUNTRY, 1440);
    entry.after = await describe(page);
    await page.screenshot({ path: resolve(OUT, `${slug(query)}-after-1440.png`) });
    const panel = page.locator('[data-testid="search-topic-panel-v170"]');
    if (await panel.count()) await panel.screenshot({ path: resolve(OUT, `${slug(query)}-after-1440-panel.png`) });
    await scrollToResults(page);
    await page.screenshot({ path: resolve(OUT, `${slug(query)}-after-1440-cards.png`) });
    entry.after.evidenceAll.forEach((line) => {
      if (INTERNAL.test(line)) result.internal.push({ query, line });
    });
    await page.close();
  }

  // The folded group and its opening, on the first query.
  {
    const page = await openFinder(afterBase, QUERIES[0], COUNTRY, 1440);
    for (let i = 0; i < 12; i += 1) {
      if (await page.locator('[data-testid="search-collapsed-v170"]').count()) break;
      await page.mouse.wheel(0, 4000);
      await page.waitForTimeout(400);
    }
    const bar = page.locator('[data-testid="search-collapsed-v170"]');
    if (await bar.count()) {
      await page.evaluate(() => {
        document.documentElement.style.scrollBehavior = "auto";
        const el = document.querySelector('[data-testid="search-collapsed-v170"]');
        window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 640, behavior: "instant" });
      });
      await page.waitForTimeout(200);
      await page.screenshot({ path: resolve(OUT, `${slug(QUERIES[0])}-after-1440-folded.png`) });
      await bar.locator("button").click();
      await page.waitForTimeout(400);
      result.openedThird = await page.locator('[data-testid="search-section-v170"][data-tier="3"]').count();
    }
    // 가나다순: no groups, the tier chips stay.
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.selectOption('[data-testid="finder-sort-v160"]', "name");
    await page.waitForTimeout(500);
    result.nameOrder = await describe(page);
    await page.close();
  }

  // Every country together: no panel, groups as usual.
  {
    const page = await openFinder(afterBase, QUERIES[0], "all", 1440);
    result.allCountries = await describe(page);
    delete result.allCountries.evidenceAll;
    await page.close();
  }

  for (const width of WIDTHS) {
    for (const [query, country] of [[QUERIES[0], COUNTRY], [QUERIES[0], "all"]]) {
      const page = await openFinder(afterBase, query, country, width);
      const sizes = await page.evaluate(() => ({ scroll: document.documentElement.scrollWidth, client: document.documentElement.clientWidth }));
      result.overflow.push({ width, query, country, ...sizes, ok: sizes.scroll <= sizes.client });
      if (width === 390 && country !== "all") await page.screenshot({ path: resolve(OUT, `${slug(query)}-after-390.png`), fullPage: false });
      await page.close();
    }
  }
} finally {
  await browser.close();
  servers.forEach((server) => server.close?.());
}

Object.values(result.queries).forEach((entry) => {
  if (entry.after) delete entry.after.evidenceAll;
});
writeFileSync(resolve(OUT, "review-v170.json"), JSON.stringify(result, null, 2));
const failures = [...result.overflow.filter((row) => !row.ok), ...result.internal];
console.log(JSON.stringify({ overflowFail: result.overflow.filter((row) => !row.ok).length, internal: result.internal.length }, null, 0));
process.exit(failures.length ? 1 : 0);
