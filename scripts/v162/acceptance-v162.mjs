#!/usr/bin/env node
/**
 * V162 integrated acceptance gate - `npm run qa:acceptance:v162`.
 *
 * One run judges whether the built site is complete, country by country. It
 * does not re-implement what the repository already checks: it runs the
 * existing audits as processes and reads their reports, and adds only the
 * judgements no audit made (catalog-derived counts on the screen, the
 * '데이터 준비 중' single source, the data date, a country that is not public).
 *
 *   1 finder     public set = catalog, the 2026 exclusions are nowhere, and the
 *                '데이터 준비 중' cards, detail notices and spec typology all equal
 *                the catalog's not-yet-delivered statuses (catalog = single source);
 *                the order is 가나다순 by default and 조회순 reorders by views
 *                  reuses audit:exclusions:v156
 *   2 map        target / connected / pending counts from map-index; every active
 *                layer renders and answers a click; '준비 중' 0
 *                  reuses qa:map:v138 (report read here; it sets no exit code)
 *   3 wording    public wording across home, finder, detail, map, download; no
 *                other country's name outside the country-comparison block; no '핵심'
 *                  reuses audit:source-notes:v161 (#42) + public-wording-scan-v157 (#47)
 *                  + scan-core-word-v157
 *   4 numbers    home total / map / download = catalog / map-index / manifest,
 *                and the data date = the country's source delivery date (provenance)
 *   5 widths     320·390·768·1024·1440·1920 horizontal overflow 0
 *                  reuses review-runtime-v150 --only responsive
 *   6 countries  a country that is not live: ?country=<iso3> falls back to the
 *                default country with no wording of its own; once live it must
 *                be selectable (and gets checks 1-5 like every live country)
 *   7 smoke      the production smoke per country (smoke:production:v128 --country),
 *                against PRODUCTION_URL when set, else this build; a country not
 *                live yet is smoked once published
 *
 * Expected failures are stated, never hidden: `--expect-pending N` reports up
 * to N map targets still pending as '예상 실패' (the map-12 PR closes them),
 * `--expect-fail <id,...>` does the same for a named check waiting on a product
 * change. Both are written into the report with the count.
 *
 * Usage:
 *   node scripts/v162/acceptance-v162.mjs [--country VNM|BGD[,...]] [--build build]
 *        [--expect-pending 12] [--expect-fail data-date] [--skip wording,map-runtime]
 *   --skip areas: finder, map, wording, numbers, widths, smoke; single checks:
 *   exclusions, map-runtime, finder-sort, source-notes, wording-scan, other-country, core-word
 * Writes reports/v162/acceptance-v162.{json,md}; exit 1 on any failure.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";
import { startStaticBuildServer, scaledTimeoutMsV150 } from "../v125/browser-runtime.mjs";
import { runAuditCommand } from "../ci/run-audit-command.mjs";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const args = process.argv.slice(2);
const opt = (name, fallback) => {
  const index = args.indexOf(name);
  return index >= 0 && args[index + 1] ? args[index + 1] : fallback;
};
const list = (name) => (opt(name, "") || "").split(",").map((value) => value.trim()).filter(Boolean);
const BUILD_ARG = opt("--build", "build");
const BUILD = resolve(ROOT, BUILD_ARG);
const EXPECT_PENDING = Number(opt("--expect-pending", "0")) || 0;
const EXPECT_FAIL = new Set(list("--expect-fail"));
const SKIP = new Set(list("--skip"));
const PORT = Number(opt("--port", "4451"));
const OUT_JSON = resolve(ROOT, "reports/v162/acceptance-v162.json");
const OUT_MD = resolve(ROOT, "reports/v162/acceptance-v162.md");
const DEFAULT_COUNTRY = "VNM";

const readJson = (path) => JSON.parse(readFileSync(path, "utf8"));
const registry = readJson(resolve(ROOT, "public/data/countries.json"));
const registryCountries = registry.countries || [];
const liveCountries = registryCountries.filter((row) => row.status === "live").map((row) => row.iso3);
const requested = list("--country").map((value) => value.toUpperCase());
const COUNTRIES = requested.length ? requested : liveCountries;
// A country with a data tree that is not live yet gets the fallback check.
const notLiveWithData = registryCountries
  .filter((row) => row.status !== "live" && row.dataRoot && existsSync(resolve(ROOT, "public", `.${row.dataRoot}`, "catalog.json")))
  .map((row) => row.iso3)
  .filter((iso3) => !requested.length || requested.includes(iso3));

const PREPARING_STATUSES = new Set(["not-collected", "data-entry-planned", "schema-only"]);
const NON_PUBLIC_STATUSES = new Set(["excluded", "not-provided"]);

const checks = [];
function check(country, area, id, title, verdict, actual, expected, source = null) {
  // verdict: true | false | "expected" | "skip"
  const status = verdict === true ? "PASS" : verdict === "expected" ? "EXPECTED" : verdict === "skip" ? "SKIP" : "FAIL";
  checks.push({ country, area, id, title, status, actual, expected, source });
  console.log(JSON.stringify({ type: "check", audit: "acceptance:v162", country, id, status }));
}
/** A failing check the run was told to expect is reported as '예상 실패'. */
const orExpected = (id, passed) => (passed ? true : EXPECT_FAIL.has(id) ? "expected" : false);

function countryData(iso3) {
  const row = registryCountries.find((entry) => entry.iso3 === iso3);
  const dir = resolve(ROOT, "public", `.${row?.dataRoot || "/data/vietnam/v2"}`);
  const catalogDoc = readJson(resolve(dir, "catalog.json"));
  const catalog = catalogDoc.elements;
  const mapIndex = existsSync(resolve(dir, "map-index.json")) ? readJson(resolve(dir, "map-index.json")) : null;
  const manifest = existsSync(resolve(dir, "manifest.json")) ? readJson(resolve(dir, "manifest.json")) : null;
  const publicIds = catalog.filter((element) => !NON_PUBLIC_STATUSES.has(element.publicStatus)).map((element) => element.elementId);
  const excludedIds = catalog.filter((element) => element.publicStatus === "excluded").map((element) => element.elementId);
  const preparingIds = catalog.filter((element) => PREPARING_STATUSES.has(element.publicStatus)).map((element) => element.elementId).sort();
  const layers = (mapIndex?.layers || []).filter((layer) => layer.active !== false && layer.enabled !== false);
  const contract = mapIndex?.mapTargetContract || null;
  return { row, dir, catalogDoc, catalog, mapIndex, manifest, publicIds, excludedIds, preparingIds, layers, contract };
}

/** Every other registry country's Korean and English name - words a country's own screens must not carry. */
const otherCountryTerms = (iso3) =>
  registryCountries.filter((row) => row.iso3 !== iso3).flatMap((row) => [row.nameKo, row.nameEn]).filter(Boolean);

/**
 * V162 PR-D (user decision 2026-10-03): every other registry country's own
 * administrative expressions (`adm.publicTerms` - Viet Nam's "성·시", "개편 전",
 * Bangladesh's "주(Division)"). Read from the registry, never written here; a
 * word the country itself also uses is not another country's.
 */
const otherAdminTerms = (iso3) => {
  const own = new Set(registryCountries.find((row) => row.iso3 === iso3)?.adm?.publicTerms || []);
  return [...new Set(registryCountries.filter((row) => row.iso3 !== iso3).flatMap((row) => row.adm?.publicTerms || []))].filter((term) => term && !own.has(term));
};

async function runReused(name, command, reportPath, timeoutMs = 1_800_000) {
  const started = Date.now();
  const result = await runAuditCommand(command, { cwd: ROOT, timeoutMs, onProgress: () => undefined });
  const report = existsSync(reportPath) ? readJson(reportPath) : null;
  console.log(JSON.stringify({ type: "reused", name, command, status: result.status, elapsedMs: Date.now() - started }));
  return { exit: result.status, timedOut: result.timedOut, report };
}

// ------------------------------------------------------------------ browser
const server = await startStaticBuildServer(BUILD, { port: PORT });
const base = server.url.replace(/\/$/u, "");
const browser = await chromium.launch(process.env.V125_BROWSER_EXECUTABLE ? { executablePath: process.env.V125_BROWSER_EXECUTABLE } : {});
async function withPage(fn, width = 1440) {
  const context = await browser.newContext({ locale: "ko-KR", viewport: { width, height: 1000 } });
  const page = await context.newPage();
  try {
    return await fn(page);
  } finally {
    await context.close();
  }
}
const countryQuery = (iso3) => (iso3 === DEFAULT_COUNTRY ? "" : `?country=${iso3}`);

async function finderSnapshot(page, iso3) {
  await page.goto(`${base}/${countryQuery(iso3)}#explorer`, { waitUntil: "networkidle", timeout: scaledTimeoutMsV150(120_000) });
  await page.waitForSelector('[data-testid="public-finder-card-v135"]', { timeout: scaledTimeoutMsV150(60_000) });
  for (let guard = 0; guard < 30; guard += 1) {
    const shown = await page.$$eval('[data-testid="public-finder-card-v135"]', (nodes) => nodes.length);
    const total = await page.$eval('[data-testid="finder-results-v136"]', (node) => Number(node.getAttribute("data-total-count"))).catch(() => shown);
    if (shown >= total) break;
    await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
    await page.waitForTimeout(600);
  }
  return page.evaluate(() => ({
    total: Number(document.querySelector('[data-testid="finder-results-v136"]')?.getAttribute("data-total-count") || NaN),
    ids: [...document.querySelectorAll('[data-testid="public-finder-card-v135"]')].map((node) => node.getAttribute("data-element-id")),
    preparing: [...document.querySelectorAll('[data-testid="public-finder-card-v135"]')]
      .filter((node) => /데이터 준비 중/u.test(node.querySelector('[data-testid="finder-card-status-v159"]')?.textContent || ""))
      .map((node) => node.getAttribute("data-element-id")),
  }));
}

async function homeFigures(page, iso3) {
  await page.goto(`${base}/${countryQuery(iso3)}`, { waitUntil: "networkidle", timeout: scaledTimeoutMsV150(120_000) });
  await page.waitForFunction(() => /\d/u.test(document.querySelector(".home-v128-stats")?.textContent || ""), null, { timeout: scaledTimeoutMsV150(60_000) }).catch(() => null);
  return page.evaluate(() => {
    const figures = {};
    document.querySelectorAll(".home-v128-stats > div").forEach((row) => {
      figures[(row.querySelector("dt")?.textContent || "").trim()] = (row.querySelector("dd")?.textContent || "").trim();
    });
    return figures;
  });
}

/** Loads every finder card (the list grows on scroll) and reads id, shown name and the '데이터 준비 중' mark. */
async function finderCards(page) {
  for (let guard = 0; guard < 30; guard += 1) {
    const shown = await page.$$eval('[data-testid="public-finder-card-v135"]', (nodes) => nodes.length);
    const total = await page.$eval('[data-testid="finder-results-v136"]', (node) => Number(node.getAttribute("data-total-count"))).catch(() => shown);
    if (shown >= total) break;
    await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
    await page.waitForTimeout(600);
  }
  return page.$$eval('[data-testid="public-finder-card-v135"]', (nodes) =>
    nodes.map((node) => ({
      id: node.getAttribute("data-element-id"),
      title: (node.querySelector(".dct159-name")?.innerText || "").replace(/\s+/gu, " ").trim(),
      preparing: /데이터 준비 중/u.test(node.querySelector('[data-testid="finder-card-status-v159"]')?.textContent || ""),
    }))
  );
}

/**
 * The finder order: 가나다순 by default (datasets not yet delivered last), and
 * choosing 조회순 reorders by views. A static build has no usage service, so the
 * check answers /api/usage with test counts that rank the names in reverse;
 * the default must stay 가나다순 even while 조회순 is available.
 */
async function finderSortCheck(page, iso3) {
  const collator = new Intl.Collator("ko");
  let mockDetail = [];
  await page.route("**/api/usage", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ status: "ready", windowDays: 30, from: "2026-09-01", through: "2026-09-30", detail: mockDetail, map: [] }),
    })
  );
  // First pass without counts only to learn the names; the counts follow from them.
  await page.goto(`${base}/${countryQuery(iso3)}#explorer`, { waitUntil: "networkidle", timeout: scaledTimeoutMsV150(120_000) });
  await page.waitForSelector('[data-testid="public-finder-card-v135"]', { timeout: scaledTimeoutMsV150(60_000) });
  const learned = (await finderCards(page)).filter((card) => !card.preparing);
  const byName = [...learned].sort((left, right) => collator.compare(left.title, right.title));
  mockDetail = byName.map((card, index) => ({ elementId: card.id, count: index + 1 }));
  // A reload, not a goto: the same URL with the same hash would not load the page again.
  await page.reload({ waitUntil: "networkidle", timeout: scaledTimeoutMsV150(120_000) });
  await page.waitForSelector('[data-testid="public-finder-card-v135"]', { timeout: scaledTimeoutMsV150(60_000) });
  await page.waitForFunction(() => document.querySelector('[data-testid="finder-sort-v160"] option[value="views"]')?.disabled === false, null, { timeout: scaledTimeoutMsV150(30_000) }).catch(() => null);
  const defaultMode = await page.$eval('[data-testid="finder-sort-v160"]', (node) => node.value).catch(() => null);
  const viewsEnabled = await page.$eval('[data-testid="finder-sort-v160"] option[value="views"]', (node) => !node.disabled).catch(() => false);
  const defaultCards = await finderCards(page);
  await page.selectOption('[data-testid="finder-sort-v160"]', "views").catch(() => null);
  await page.waitForTimeout(800);
  const viewsMode = await page.$eval('[data-testid="finder-sort-v160"]', (node) => node.value).catch(() => null);
  const viewsCards = await finderCards(page);

  const preparingLast = (cards) => {
    const firstPreparing = cards.findIndex((card) => card.preparing);
    return firstPreparing < 0 || cards.slice(firstPreparing).every((card) => card.preparing);
  };
  const delivered = (cards) => cards.filter((card) => !card.preparing);
  const nameSorted = delivered(defaultCards).every((card, index, all) => index === 0 || collator.compare(all[index - 1].title, card.title) <= 0);
  const expectedViews = [...byName].reverse().map((card) => card.id);
  const shownViews = delivered(viewsCards).map((card) => card.id);
  const defaultIds = delivered(defaultCards).map((card) => card.id);
  return {
    defaultOk: defaultMode === "name" && nameSorted && preparingLast(defaultCards) && defaultCards.length === learned.length + defaultCards.filter((card) => card.preparing).length,
    viewsOk: viewsEnabled && viewsMode === "views" && JSON.stringify(shownViews) === JSON.stringify(expectedViews) && JSON.stringify(shownViews) !== JSON.stringify(defaultIds) && preparingLast(viewsCards),
    actual: {
      defaultMode,
      nameSorted,
      preparingLastDefault: preparingLast(defaultCards),
      cards: defaultCards.length,
      viewsEnabled,
      viewsMode,
      viewsOrderMatches: JSON.stringify(shownViews) === JSON.stringify(expectedViews),
      orderChanged: JSON.stringify(shownViews) !== JSON.stringify(defaultIds),
      firstByName: defaultIds.slice(0, 3),
      firstByViews: shownViews.slice(0, 3),
    },
  };
}

/**
 * Every public text of a country's screens - home, finder (all cards), map
 * (list expanded), download, guide and each public detail with every layer and
 * <details> open - searched for other countries' names. The country picker
 * names every country by design and the country-comparison block compares
 * countries on purpose; both are left out. Detail pages go 20 to a browser
 * context, the context closed after each batch (memory).
 */
async function otherCountryWalk(iso3, publicIds, words, properNameWords = []) {
  const read = (page, words) =>
    page.evaluate(async ({ terms, properNameAware }) => {
      document.querySelectorAll("details:not([open])").forEach((node) => { node.open = true; });
      await new Promise((done) => setTimeout(done, 300));
      const body = document.body.cloneNode(true);
      body.querySelectorAll("script, style, noscript, select, option, [data-country-picker], [aria-label*='국가 선택'], [data-testid='country-compare-v158']").forEach((node) => node.remove());
      // V162 (user decision 2026-10-02): a value a delivered record states is the
      // country's own data, not platform wording - C-013 lists Viet Nam's treaty
      // "Bangladesh - Viet Nam BIT (2005)". Record cards, wide record cards and
      // the raw-data tables are left out; every platform sentence is still read.
      body.querySelectorAll("[data-testid='wide-record-card-v162'], [data-testid='public-entity-card-v131'], details[data-testid='public-raw-data'], details[data-testid='public-raw-table'], details[data-testid='public-entity-table'], details[data-testid='public-observation-table']").forEach((node) => node.remove());
      const text = (body.textContent || "").replace(/\s+/gu, " ");
      // V162 PR-D: a single Latin administrative word ("Division") inside a
      // proper name ("United Nations Statistics Division") is that name, not
      // the country's administrative wording - a capitalised word right before
      // it marks the name. Every other term is a plain substring.
      const indexOfTerm = (term) => {
        if (!properNameAware.includes(term)) return text.indexOf(term);
        const match = new RegExp(`(?<![A-Z][A-Za-z]* )\\b${term}\\b`, "u").exec(text);
        return match ? match.index : -1;
      };
      return terms.filter((term) => indexOfTerm(term) >= 0).map((term) => {
        const at = indexOfTerm(term);
        return { term, context: text.slice(Math.max(0, at - 40), at + term.length + 40).trim() };
      });
    }, { terms: words, properNameAware: properNameWords });
  const hits = [];
  const query = countryQuery(iso3);
  await withPage(async (page) => {
    for (const [screen, path] of [["home", `/${query}`], ["finder", `/${query}#explorer`], ["map", `/?view=map&country=${iso3}#map`], ["download", `/?country=${iso3}#download`], ["guide", `/${query}#guide`]]) {
      await page.goto(`${base}${path}`, { waitUntil: "networkidle", timeout: scaledTimeoutMsV150(120_000) });
      await page.waitForTimeout(1200);
      if (screen === "finder") await finderCards(page);
      if (screen === "map") {
        await page.evaluate(() => {
          document.querySelectorAll("button").forEach((button) => { if (/더 많은 레이어|모두 펼치기/u.test(button.textContent || "")) button.click(); });
          document.querySelectorAll('[data-testid="map-catalog-group-toggle-v138"]').forEach((toggle) => { if (toggle.getAttribute("aria-expanded") !== "true") toggle.click(); });
        });
        await page.waitForTimeout(1200);
      }
      for (const hit of await read(page, words)) hits.push({ screen, ...hit });
    }
  });
  for (let start = 0; start < publicIds.length; start += 20) {
    await withPage(async (page) => {
      for (const id of publicIds.slice(start, start + 20)) {
        await page.goto(`${base}/?view=data&country=${iso3}&element=${id}&detailLayers=all#element-detail`, { waitUntil: "domcontentloaded", timeout: scaledTimeoutMsV150(90_000) });
        await page.waitForSelector('[data-testid="public-analysis-root"]', { timeout: scaledTimeoutMsV150(60_000) }).catch(() => null);
        await page.waitForTimeout(600);
        for (const hit of await read(page, words)) hits.push({ screen: `detail:${id}`, ...hit });
      }
    });
  }
  return { hits, detailPages: publicIds.length };
}

const digits = (text) => String(text ?? "").replace(/\D/gu, "");
const number = (text) => Number(String(text ?? "").replace(/[^\d.]/gu, "")) || NaN;

// ------------------------------------------------------------------ live countries
for (const iso3 of COUNTRIES) {
  const data = countryData(iso3);
  const live = liveCountries.includes(iso3);
  if (!live) {
    check(iso3, "country", "country-live", "공개(live) 국가", false, data.row?.status || "missing", "live");
    continue;
  }

  // 1 finder --------------------------------------------------------------
  if (!SKIP.has("finder")) {
    const finder = await withPage((page) => finderSnapshot(page, iso3));
    check(iso3, "finder", "finder-count", "찾기 목록 = 카탈로그 공개 요소", finder.total === data.publicIds.length && finder.ids.length === data.publicIds.length, { total: finder.total, cards: finder.ids.length }, data.publicIds.length);
    const leaked = finder.ids.filter((id) => data.excludedIds.includes(id));
    check(iso3, "finder", "finder-exclusions", "2026년 제외 요소 비노출(찾기)", leaked.length === 0, leaked, []);
    const preparingShown = [...finder.preparing].sort();
    check(iso3, "finder", "preparing-finder", "'데이터 준비 중' 카드 = 카탈로그 미입고 상태", JSON.stringify(preparingShown) === JSON.stringify(data.preparingIds), preparingShown, data.preparingIds);
    // The detail notice and the spec typology read the same catalog.
    const noticed = await withPage(async (page) => {
      const out = [];
      for (const id of data.preparingIds) {
        await page.goto(`${base}/?view=data&country=${iso3}&element=${id}#element-detail`, { waitUntil: "domcontentloaded", timeout: scaledTimeoutMsV150(90_000) });
        const ok = await page.waitForSelector('[data-testid="status-note-v159"][data-status-notice="data-pending"]', { timeout: scaledTimeoutMsV150(30_000) }).then(() => true).catch(() => false);
        if (ok) out.push(id);
      }
      return out;
    });
    check(iso3, "finder", "preparing-detail", "미입고 상세의 '데이터 준비 중' 안내", JSON.stringify(noticed) === JSON.stringify(data.preparingIds), noticed, data.preparingIds);
    const sort = SKIP.has("finder-sort") ? null : await withPage((page) => finderSortCheck(page, iso3));
    if (sort) check(iso3, "finder", "finder-sort-default", "찾기 기본 정렬 = 가나다순(미입고는 끝)", sort.defaultOk, { mode: sort.actual.defaultMode, nameSorted: sort.actual.nameSorted, preparingLast: sort.actual.preparingLastDefault, cards: sort.actual.cards, first: sort.actual.firstByName }, { mode: "name", nameSorted: true, preparingLast: true });
    if (sort) check(iso3, "finder", "finder-sort-views", "조회순 선택 시 조회수 순으로 순서 변경(시험 조회수 주입)", sort.viewsOk, { enabled: sort.actual.viewsEnabled, mode: sort.actual.viewsMode, orderMatches: sort.actual.viewsOrderMatches, orderChanged: sort.actual.orderChanged, first: sort.actual.firstByViews }, { mode: "views", orderMatches: true, orderChanged: true });
    if (iso3 === DEFAULT_COUNTRY) {
      const typology = readJson(resolve(ROOT, "src/data/spec/datasetTypologyV159.json"));
      const pendingRows = (Array.isArray(typology) ? typology : typology.rows || []).filter((row) => row.statusNotice === "data-pending").map((row) => row.elementId).sort();
      check(iso3, "finder", "preparing-single-source", "명세 유형의 data-pending = 카탈로그 미입고(단일 출처)", orExpected("preparing-single-source", JSON.stringify(pendingRows) === JSON.stringify(data.preparingIds)), pendingRows, data.preparingIds, "src/data/spec/datasetTypologyV159.json");
      if (!SKIP.has("exclusions")) {
        if (BUILD_ARG !== "build") {
          check(iso3, "finder", "exclusions-audit", "제외 요소 전 화면 비노출(audit:exclusions:v156)", "skip", "the audit reads build/ only", "--build build", "audit:exclusions:v156");
        } else {
          const reused = await runReused("exclusions", "npm run audit:exclusions:v156", resolve(ROOT, "reports/v156/exclusions-audit-v156.json"));
          const summary = reused.report?.summary || {};
          check(iso3, "finder", "exclusions-audit", "제외 요소 전 화면 비노출(audit:exclusions:v156)", reused.exit === 0 && summary.status === "PASS", { status: summary.status, failedChecks: summary.failedChecks }, "PASS", "audit:exclusions:v156");
        }
      }
    }
  }

  // 2 map -----------------------------------------------------------------
  if (!SKIP.has("map") && data.mapIndex) {
    const targetCount = data.contract?.targetCount ?? data.layers.length;
    const connected = data.layers.length;
    const pendingIds = (data.contract?.notConnected || []).map((row) => row.elementId);
    const screen = await withPage(async (page) => {
      await page.goto(`${base}/?view=map${iso3 === DEFAULT_COUNTRY ? "" : `&country=${iso3}`}#map`, { waitUntil: "domcontentloaded", timeout: scaledTimeoutMsV150(120_000) });
      await page.waitForSelector('[data-testid="map-catalog-status-v138"]', { timeout: scaledTimeoutMsV150(90_000) });
      await page.waitForTimeout(1500);
      return page.evaluate(() => {
        const status = document.querySelector('[data-testid="map-catalog-status-v138"]');
        return {
          target: Number(document.querySelector('[data-testid="map-all-data-v135"]')?.getAttribute("data-target-count") || NaN),
          connected: Number(status?.getAttribute("data-map-connected-count") || NaN),
          pending: Number(status?.getAttribute("data-map-pending-count") || NaN),
          pendingBadges: document.querySelectorAll('[data-testid="map-catalog-pending-v140"]').length,
        };
      });
    });
    check(iso3, "map", "map-counts", "지도 대상·연결 수 = map-index 실측", screen.target === targetCount && screen.connected === connected, screen, { target: targetCount, connected });
    const pendingOk = pendingIds.length === 0 && screen.pending === 0 && screen.pendingBadges === 0;
    const pendingVerdict = pendingOk ? true : pendingIds.length <= EXPECT_PENDING && screen.pending === pendingIds.length ? "expected" : false;
    check(iso3, "map", "map-pending", `지도 '준비 중' 0${EXPECT_PENDING ? ` (예상 실패 허용 ${EXPECT_PENDING}건)` : ""}`, pendingVerdict, { pending: screen.pending, badges: screen.pendingBadges, ids: pendingIds }, { pending: 0, expectPending: EXPECT_PENDING });
    if (iso3 === DEFAULT_COUNTRY && !SKIP.has("map-runtime")) {
      const reused = await runReused("map-runtime", `node scripts/v138/map-runtime-qa-v138.mjs --build ${BUILD_ARG} --port 4452`, resolve(ROOT, "reports/v138/map-runtime-qa-v138.json"));
      const summary = reused.report?.summary || {};
      const httpFailures = (reused.report?.httpFailures || []).filter((failure) => !/openfreemap|tiles?\.|\.pbf|\/tiles\//iu.test(JSON.stringify(failure)));
      const passed = reused.exit === 0 && summary.activeLayers === connected && summary.renderedLayers === connected && summary.featureSelectedLayers === connected &&
        (summary.internalPhraseLayers || []).length === 0 && summary.consoleErrorCount === 0 && httpFailures.length === 0;
      check(iso3, "map", "map-render-click", "활성 레이어 전부 렌더·클릭(qa:map:v138)", passed, { active: summary.activeLayers, rendered: summary.renderedLayers, clicked: summary.featureSelectedLayers, internalPhraseLayers: summary.internalPhraseLayers, consoleErrors: summary.consoleErrorCount, httpFailuresExceptTiles: httpFailures.length }, { layers: connected }, "qa:map:v138");
    }
  }

  // 3 wording -------------------------------------------------------------
  if (!SKIP.has("wording")) {
    const notesReport = resolve(ROOT, `reports/v161/source-notes-audit-v161${iso3 === DEFAULT_COUNTRY ? "" : `-${iso3.toLowerCase()}`}.json`);
    // One detail page at a time (each audit refreshes its browser context every 20 pages).
    const notes = SKIP.has("source-notes") ? null : await runReused("source-notes", `node scripts/v161/audit-source-notes-v161.mjs --build ${BUILD_ARG} --workers 1${iso3 === DEFAULT_COUNTRY ? "" : ` --country ${iso3}`}`, notesReport);
    const notesSummary = notes?.report?.summary || {};
    if (notes) check(iso3, "wording", "wording-source-notes", "내부 작업 메모 0(홈·찾기·상세·다운로드·지도, #42)", notes.exit === 0 && notesSummary.pass === true, { findings: notesSummary.findings, detailPages: notesSummary.detailPagesChecked, runtimeErrors: notesSummary.runtimeErrors }, { findings: 0 }, "audit:source-notes:v161");
    if (iso3 === DEFAULT_COUNTRY && !SKIP.has("wording-scan")) {
      const scan = await runReused("wording-scan", `node scripts/v157/public-wording-scan-v157.mjs --build ${BUILD_ARG} --port 4453`, resolve(ROOT, "reports/v157/public-wording-scan-v157.json"));
      // C-003's own document file names on its detail are fixed in V162 (session 5);
      // they are judged apart so every other finding still fails the check.
      const findings = scan.report?.findings || [];
      const isC003FileName = (finding) => finding.elementId === "C-003" && (finding.tokens || []).every((token) => token.startsWith("file-name:"));
      const c003 = findings.filter(isC003FileName);
      const others = findings.filter((finding) => !isC003FileName(finding));
      check(iso3, "wording", "wording-identifiers", "식별자·파일명·작업 어휘 0(지도 목록·정보·선택 패널·연관 카드·상세, #47)", Boolean(scan.report) && others.length === 0 && scan.report.exceptionCount === 0, { findings: others.length, elements: [...new Set(others.map((finding) => finding.elementId))], exceptions: scan.report?.exceptionCount, scanned: scan.report?.scanned }, { findings: 0, exceptions: 0 }, "public-wording-scan-v157");
      check(iso3, "wording", "c003-filename", "C-003 상세의 파일명 0(V162에서 수정)", orExpected("c003-filename", c003.length === 0), c003.flatMap((finding) => finding.tokens), [], "public-wording-scan-v157");
    }
    const words = otherCountryTerms(iso3);
    const adminWords = otherAdminTerms(iso3);
    if ((words.length || adminWords.length) && !SKIP.has("other-country")) {
      // One walk reads both word lists (the same screens, the same exclusions).
      const walk = await otherCountryWalk(iso3, data.publicIds, [...words, ...adminWords], adminWords.filter((term) => /^[A-Za-z]+$/u.test(term)));
      const nameHits = walk.hits.filter((hit) => words.includes(hit.term));
      const adminHits = walk.hits.filter((hit) => adminWords.includes(hit.term));
      const suffix = iso3 === DEFAULT_COUNTRY ? "" : `-${iso3.toLowerCase()}`;
      const namesOut = `reports/v162/other-country-names-v162${suffix}.json`;
      writeFileSync(resolve(ROOT, namesOut), `${JSON.stringify({ generatedAt: new Date().toISOString(), country: iso3, terms: words, detailPages: walk.detailPages, hitCount: nameHits.length, hits: nameHits }, null, 2)}\n`);
      check(iso3, "wording", "other-country-names", "다른 나라 국명 0(홈·찾기·지도·다운로드·이용안내·상세 전체, 국가 비교 절 제외)", orExpected("other-country-names", nameHits.length === 0), { hits: nameHits.length, detailPages: walk.detailPages, first: nameHits.slice(0, 5).map((hit) => `${hit.screen}:${hit.term} «${hit.context}»`) }, { hits: 0, terms: words }, namesOut);
      const adminOut = `reports/v162/other-country-admin-terms-v162${suffix}.json`;
      writeFileSync(resolve(ROOT, adminOut), `${JSON.stringify({ generatedAt: new Date().toISOString(), country: iso3, terms: adminWords, source: "public/data/countries.json adm.publicTerms", detailPages: walk.detailPages, hitCount: adminHits.length, hits: adminHits }, null, 2)}\n`);
      check(iso3, "wording", "other-country-admin-terms", "다른 나라 고유 행정 표현 0(레지스트리 adm.publicTerms, 국명 검사와 같은 화면·예외)", orExpected("other-country-admin-terms", adminHits.length === 0), { hits: adminHits.length, detailPages: walk.detailPages, first: adminHits.slice(0, 5).map((hit) => `${hit.screen}:${hit.term} «${hit.context}»`) }, { hits: 0, terms: adminWords }, adminOut);
    }
    if (data.mapIndex && !SKIP.has("core-word")) {
      const suffix = iso3 === DEFAULT_COUNTRY ? "" : `-${iso3.toLowerCase()}`;
      const out = `reports/v162/core-word-v162${suffix}.json`;
      const core = await runReused("core-word", `node scripts/v157/scan-core-word-v157.mjs ${base} --country ${iso3} --out ${out}`, resolve(ROOT, out));
      check(iso3, "wording", "core-word", "'핵심' 표현 0(지도 화면, scan-core-word-v157)", core.exit === 0 && core.report?.summary?.pass === true, { hits: core.report?.hits?.map((hit) => hit.text) ?? null, layers: core.report?.layers ?? null }, { hits: [] }, "scan-core-word-v157");
    }
  }

  // 4 numbers -------------------------------------------------------------
  if (!SKIP.has("numbers")) {
    const figures = await withPage((page) => homeFigures(page, iso3));
    const downloadable = data.manifest?.downloadableElementCount ?? data.catalog.filter((element) => !NON_PUBLIC_STATUSES.has(element.publicStatus) && element.downloadAllowed && (element.downloadableRecordCount || 0) > 0).length;
    check(iso3, "numbers", "home-total", "홈 전체 데이터 항목 = 카탈로그 공개 요소", number(figures["전체 데이터 항목"]) === data.publicIds.length, figures["전체 데이터 항목"], data.publicIds.length);
    check(iso3, "numbers", "home-map", "홈 지도 제공 항목 = map-index 활성 레이어", number(figures["지도 제공 항목"]) === data.layers.length, figures["지도 제공 항목"], data.layers.length);
    check(iso3, "numbers", "home-download", "홈 다운로드 가능 항목 = manifest", number(figures["다운로드 가능 항목"]) === downloadable, figures["다운로드 가능 항목"], downloadable);
    const downloadList = await withPage(async (page) => {
      await page.goto(`${base}/${iso3 === DEFAULT_COUNTRY ? "?country=VNM" : `?country=${iso3}`}#download`, { waitUntil: "networkidle", timeout: scaledTimeoutMsV150(120_000) });
      await page.waitForSelector(".cdp-download-item[data-element-id]", { timeout: scaledTimeoutMsV150(60_000) });
      return page.$$eval(".cdp-download-item[data-element-id]", (nodes) => nodes.map((node) => node.getAttribute("data-element-id")));
    });
    const downloadIds = [...new Set(downloadList)];
    check(iso3, "numbers", "download-list", "다운로드 목록 = 카탈로그 공개 요소(제외 0)", downloadIds.length === data.publicIds.length && !downloadIds.some((id) => data.excludedIds.includes(id)), downloadIds.length, data.publicIds.length);
    // The data date on the home is the day the country's source was delivered
    // (입고일), read from the data tree's provenance: the catalog's, or the
    // manifest's where V162 writes it. No provenance is a failure, not a guess.
    const provenanceSource = data.catalogDoc?.provenance?.sourceDeliveredAt ? "catalog.provenance.sourceDeliveredAt" : data.manifest?.provenance?.sourceDeliveredAt ? "manifest.provenance.sourceDeliveredAt" : null;
    const delivered = data.catalogDoc?.provenance?.sourceDeliveredAt || data.manifest?.provenance?.sourceDeliveredAt || null;
    const shownDate = figures["데이터 기준일"] || "";
    check(iso3, "numbers", "data-date", "데이터 기준일 = 원자료 입고일(국가별 provenance)", orExpected("data-date", Boolean(delivered) && digits(shownDate) === digits(delivered)), { shown: shownDate, manifestGeneratedAt: data.manifest?.generatedAt || null }, { deliveredAt: delivered, source: provenanceSource || "(provenance 없음 - V162에서 추가)" });
  }

  // 5 widths --------------------------------------------------------------
  if (!SKIP.has("widths") && iso3 === DEFAULT_COUNTRY) {
    const out = "reports/v162/responsive-v162.json";
    const reused = await runReused("responsive", `node scripts/v150/review-runtime-v150.mjs --only responsive --build ${BUILD_ARG} --out ${out}`, resolve(ROOT, out));
    const responsive = reused.report?.responsive || {};
    check(iso3, "widths", "widths-overflow", "6폭(320·390·768·1024·1440·1920) 가로 넘침 0", reused.exit === 0 && responsive.pass === true, { combinations: responsive.combinations, overflowing: responsive.overflowing, failing: (responsive.rows || []).filter((row) => !row.pass).map((row) => `${row.screen}@${row.width}:${row.overflow}`) }, { overflowing: 0 }, "review-runtime-v150 --only responsive");
  }

  // 7 smoke ---------------------------------------------------------------
  // The production smoke, per country: against PRODUCTION_URL when it is set
  // (p5:final), otherwise against the build this run serves.
  if (!SKIP.has("smoke")) {
    const previousUrl = process.env.PRODUCTION_URL;
    const target = previousUrl || base;
    process.env.PRODUCTION_URL = target;
    const smokeReport = resolve(ROOT, `reports/v128/production-smoke-v128${iso3 === DEFAULT_COUNTRY ? "" : `-${iso3.toLowerCase()}`}.json`);
    const smoke = await runReused("smoke", `node scripts/smoke-vietnam-production-v128.mjs --country ${iso3}`, smokeReport);
    if (previousUrl === undefined) delete process.env.PRODUCTION_URL;
    else process.env.PRODUCTION_URL = previousUrl;
    const report = smoke.report || {};
    check(iso3, "smoke", "production-smoke", `운영 smoke(국가별, ${previousUrl ? "운영 URL" : "이 빌드"})`, smoke.exit === 0, { exit: smoke.exit, runtimeFailure: report.runtimeFailure ?? null, routeFailures: (report.routeFailures || []).length, assetFailures: (report.networkFailures || []).length, consoleErrors: (report.consoleErrors || []).length }, { exit: 0 }, "smoke:production:v128 --country");
  }
}

// ------------------------------------------------------------------ 6 not-live countries
for (const iso3 of notLiveWithData) {
  const entry = registryCountries.find((row) => row.iso3 === iso3);
  const terms = [entry?.nameKo, entry?.nameEn, iso3 === "BGD" ? "Bangladesh" : null].filter(Boolean);
  const fallback = await withPage(async (page) => {
    const screens = {};
    for (const [name, path] of [["home", `/?country=${iso3}`], ["finder", `/?country=${iso3}#explorer`], ["map", `/?view=map&country=${iso3}#map`], ["download", `/?country=${iso3}#download`]]) {
      await page.goto(`${base}${path}`, { waitUntil: "networkidle", timeout: scaledTimeoutMsV150(120_000) });
      await page.waitForTimeout(1500);
      screens[name] = await page.evaluate((words) => {
        const main = document.querySelector("main")?.cloneNode(true);
        if (!main) return { hits: ["(no main)"], url: location.href };
        // The country picker names every country by design; it is not content.
        main.querySelectorAll("select, option, [data-country-picker], [aria-label*='국가 선택']").forEach((node) => node.remove());
        const text = main.textContent || "";
        const hits = words.filter((word) => text.includes(word));
        if (/[ঀ-৿]/u.test(text)) hits.push("(벵골 문자)");
        return { hits, url: location.href, finderTotal: Number(document.querySelector('[data-testid="finder-results-v136"]')?.getAttribute("data-total-count") || NaN) };
      }, terms);
    }
    return screens;
  });
  const defaultPublic = countryData(DEFAULT_COUNTRY).publicIds.length;
  const hits = Object.entries(fallback).flatMap(([name, value]) => value.hits.map((hit) => `${name}:${hit}`));
  check(iso3, "country", "country-fallback-wording", `?country=${iso3}: 공개 전 폴백 · 다른 나라 표현 0`, hits.length === 0, hits, []);
  check(iso3, "country", "country-fallback-content", `?country=${iso3}: 기본 국가 목록으로 폴백`, fallback.finder.finderTotal === defaultPublic, fallback.finder.finderTotal, defaultPublic);
  if (!SKIP.has("smoke")) check(iso3, "smoke", "production-smoke", "운영 smoke(국가별)", "skip", `공개 전(${entry?.status}) - 공개 후 실행`, "live", "smoke:production:v128 --country");
}
// A live country other than the default must be selectable.
for (const iso3 of liveCountries.filter((iso3) => iso3 !== DEFAULT_COUNTRY && COUNTRIES.includes(iso3))) {
  const selectable = await withPage(async (page) => {
    await page.goto(`${base}/#explorer`, { waitUntil: "networkidle", timeout: scaledTimeoutMsV150(120_000) });
    return page.evaluate((code) => [...document.querySelectorAll("select option")].some((option) => option.value.toUpperCase() === code && !option.disabled), iso3);
  });
  check(iso3, "country", "country-selectable", `${iso3} 선택 가능(공개 국가)`, selectable, selectable, true);
}

// V162 PR-D (user decision 2026-10-03): every country selector offers every live
// country, on each live country's own screens. The map's list once read the
// priority-country list and showed Bangladesh as '준비 중' on Viet Nam's map
// while Bangladesh's map offered it. Selectors carry data-country-selector="v162"
// (a <select>, or the picker line that names the countries).
const liveRowsV162 = registryCountries.filter((row) => row.status === "live").map((row) => ({ iso3: row.iso3, nameKo: row.nameKo }));
for (const iso3 of COUNTRIES.filter((code) => liveCountries.includes(code))) {
  if (SKIP.has("country-selectors")) break;
  const sampleId = countryData(iso3).publicIds[0];
  const screens = [
    ["home", `/${countryQuery(iso3)}#home`, true],
    ["finder", `/?country=${iso3}#explorer`, true],
    ["map", `/?view=map&country=${iso3}#map`, true],
    ["download", `/?country=${iso3}#download`, true],
    ["guide", `/${countryQuery(iso3)}#guide`, true],
    ["detail", `/?view=data&country=${iso3}&element=${sampleId}#element-detail`, false],
  ];
  const result = await withPage(async (page) => {
    const out = {};
    for (const [name, path] of screens) {
      await page.goto(`${base}${path}`, { waitUntil: "networkidle", timeout: scaledTimeoutMsV150(120_000) });
      await page.waitForSelector('[data-country-selector="v162"]', { timeout: scaledTimeoutMsV150(30_000) }).catch(() => null);
      await page.waitForTimeout(1500);
      out[name] = await page.evaluate((rows) =>
        [...document.querySelectorAll('[data-country-selector="v162"]')].map((node) => {
          if (node.tagName === "SELECT") {
            const options = [...node.options];
            return rows.filter((row) => !options.some((option) => option.value.toUpperCase() === row.iso3 && !option.disabled)).map((row) => row.iso3);
          }
          const text = node.textContent || "";
          return rows.filter((row) => !text.includes(row.nameKo)).map((row) => row.iso3);
        }), liveRowsV162);
    }
    return out;
  });
  const problems = screens.flatMap(([name, , required]) => {
    const selectors = result[name] || [];
    if (!selectors.length) return required ? [`${name}:선택기 없음`] : [];
    return selectors.flatMap((missing, index) => missing.map((code) => `${name}#${index + 1}:${code} 없음·비활성`));
  });
  check(iso3, "country", "country-selectors-live", "모든 국가 선택기에서 live 국가 선택 가능(홈·찾기·지도·다운로드·이용안내, 상세는 있을 때)", problems.length === 0, { problems, selectors: Object.fromEntries(Object.entries(result).map(([name, value]) => [name, value.length])) }, { problems: [], live: liveRowsV162.map((row) => row.iso3) });
}

await browser.close();
await server.close();

// ------------------------------------------------------------------ report
const failed = checks.filter((row) => row.status === "FAIL");
const expected = checks.filter((row) => row.status === "EXPECTED");
const summary = {
  type: "summary",
  audit: "acceptance:v162",
  status: failed.length === 0 ? "PASS" : "FAIL",
  countries: COUNTRIES,
  notLiveChecked: notLiveWithData,
  passed: checks.filter((row) => row.status === "PASS").length,
  failed: failed.length,
  expected: expected.length,
  skipped: checks.filter((row) => row.status === "SKIP").length,
  total: checks.length,
  failedChecks: failed.map((row) => `${row.country}:${row.id}`),
  expectedChecks: expected.map((row) => `${row.country}:${row.id}`),
  expectPending: EXPECT_PENDING,
  expectFail: [...EXPECT_FAIL],
  build: relative(ROOT, BUILD) || ".",
};
mkdirSync(dirname(OUT_JSON), { recursive: true });
writeFileSync(OUT_JSON, `${JSON.stringify({ generatedAt: new Date().toISOString(), summary, checks }, null, 2)}\n`);
const cell = (value) => String(typeof value === "string" ? value : JSON.stringify(value)).replace(/\|/gu, "\\|").slice(0, 220);
const md = [
  "# 통합 인수 게이트 결과(qa:acceptance:v162)",
  "",
  `- 판정: **${summary.status}** · 통과 ${summary.passed} · 실패 ${summary.failed} · 예상 실패 ${summary.expected} · 건너뜀 ${summary.skipped} (총 ${summary.total})`,
  `- 국가: ${COUNTRIES.join(", ") || "(없음)"} · 공개 전 폴백 검사: ${notLiveWithData.join(", ") || "(없음)"}`,
  `- 예상 실패 허용: 지도 준비 중 ${EXPECT_PENDING}건${EXPECT_FAIL.size ? ` · ${[...EXPECT_FAIL].join(", ")}` : ""}`,
  "",
  "| 국가 | 영역 | 검사 | 판정 | 실측 | 기준 | 재사용 |",
  "|---|---|---|---|---|---|---|",
  ...checks.map((row) => `| ${row.country} | ${row.area} | ${row.title} | ${row.status === "EXPECTED" ? "예상 실패" : row.status} | ${cell(row.actual)} | ${cell(row.expected)} | ${row.source || ""} |`),
  "",
].join("\n");
writeFileSync(OUT_MD, md);
console.log(JSON.stringify(summary));
process.exitCode = failed.length === 0 ? 0 : 1;
