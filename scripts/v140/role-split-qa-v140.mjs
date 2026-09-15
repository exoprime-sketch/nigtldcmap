/**
 * Home / finder / map role-split verification (V140).
 *
 * Runs the same checks against the local production build (default) or any
 * deployed origin (`--base-url https://…`), so Preview and production are
 * verified with the checks the build passed, not by eye:
 *
 *   home     eight featured cards, each reading title → question → one figure
 *            → preview → 기간·제공 → 상세보기, with no caveat paragraph, unit
 *            row, row count, map or download button on the card
 *   finder   the whole catalogue (152), sort, the 제공 형태 filter, and the
 *            map and download buttons on the cards; the eight featured titles
 *            equal the home titles, from the same catalogue field
 *   map      one count everywhere: home stat = list lede = guide = finder map
 *            filter = map-index active layers = manifest.mapLayerCount;
 *            targets without a layer are marked 준비 중, disabled, and drawn
 *            nowhere (B-017)
 *   A-002    the detail opens under the home title and mounts its analysis
 *   download the download hub builds a file for A-002 and the static asset
 *            answers
 *
 * Usage: node scripts/v140/role-split-qa-v140.mjs [--base-url URL] [--label name]
 */
import { chromium } from "playwright";
import { mkdirSync, statSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { PROJECT_ROOT } from "../v125/audit-utils.mjs";
import { startStaticBuildServer } from "../v125/browser-runtime.mjs";

const argv = process.argv.slice(2);
const opt = (flag, fallback = null) => {
  const index = argv.indexOf(flag);
  return index < 0 ? fallback : argv[index + 1];
};
const externalBase = opt("--base-url");
const label = opt("--label", externalBase ? "deployed" : "local-build");
const OUT = resolve(PROJECT_ROOT, "reports/v140");
const SHOTS = resolve(OUT, `screenshots/${label}`);
mkdirSync(SHOTS, { recursive: true });

const FEATURED = ["A-002", "A-003", "A-010", "A-023", "A-024", "B-033", "C-016", "D-023"];
const HOME_CARD_FACT_LABELS = ["기간", "제공"];
const MOVED_CAVEATS = [
  ["A-010", "총계 행"],
  ["A-024", "경로 좌표"],
  ["B-033", "전국 계열"],
  ["C-016", "설치 실적"],
  ["D-023", "통화별로 합산"],
];
const clean = (value) => String(value || "").normalize("NFC").replace(/\s+/gu, " ").trim();
const count = (text) => Number(String(text || "").replace(/[^0-9]/gu, ""));

const server = externalBase ? null : await startStaticBuildServer(resolve(PROJECT_ROOT, "build"));
const base = (externalBase || server.url).replace(/\/$/u, "");
const browser = await chromium.launch();
const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, acceptDownloads: true });
const report = {
  label,
  base,
  generatedAt: new Date().toISOString(),
  checks: [],
  consoleErrors: [],
  httpFailures: [],
  assets: null,
  home: null,
  finder: null,
  map: null,
  detail: null,
  movedCaveats: null,
  download: null,
  b017Detail: null,
};
const check = (id, pass, actual, expected) => {
  report.checks.push({ id, pass: Boolean(pass), actual, expected });
  return Boolean(pass);
};
context.on("console", (message) => {
  if (message.type() === "error") report.consoleErrors.push(message.text().slice(0, 300));
});
context.on("response", (response) => {
  if (response.status() >= 400) report.httpFailures.push({ url: response.url(), status: response.status() });
});

async function open(path, ready) {
  const page = await context.newPage();
  const response = await page.goto(`${base}${path}`, { waitUntil: "networkidle", timeout: 90_000 });
  check(`ROUTE ${path}`, response && response.ok(), response?.status() ?? null, 200);
  if (ready) await page.waitForSelector(ready, { timeout: 60_000 });
  return page;
}

async function fetchJson(path) {
  // A deployment without the file answers the SPA shell with 200, not JSON.
  try {
    const response = await fetch(`${base}${path}`);
    const text = await response.text();
    try {
      return { status: response.status, body: response.ok ? JSON.parse(text) : null };
    } catch {
      return { status: response.status, body: null, notJson: true };
    }
  } catch (error) {
    return { status: 0, body: null, error: error instanceof Error ? error.message : String(error) };
  }
}

/**
 * Each screen is one section; a deployment that lacks a screen (or the
 * change) fails that section's checks and the run goes on to the next, so a
 * report is written for an old production as well as for the candidate.
 */
async function section(name, run) {
  try {
    await run();
  } catch (error) {
    const firstLine = (error instanceof Error ? error.message : String(error)).split(String.fromCharCode(10))[0].trim();
    check(`SECTION_${name}_RUNTIME`, false, firstLine.slice(0, 300), "section completes");
    for (const page of context.pages()) await page.close().catch(() => null);
  }
}

// ------------------------------------------------------------ data files
const manifest = await fetchJson("/data/vietnam/v2/manifest.json");
const mapIndex = await fetchJson("/data/vietnam/v2/map-index.json");
const homePreview = await fetchJson("/data/vietnam/v2/home/home-preview-v139.json");
const indexActive = (mapIndex.body?.layers || []).filter((layer) => layer.active !== false && layer.enabled !== false);
const indexIds = new Set(indexActive.map((layer) => layer.elementId));
const previewCards = homePreview.body?.cards || [];
report.assets = {
  manifestMapLayerCount: manifest.body?.mapLayerCount ?? null,
  manifestGeneratedAt: manifest.body?.generatedAt ?? null,
  indexActiveMapLayerCount: mapIndex.body?.activeMapLayerCount ?? null,
  indexActiveLayers: indexActive.length,
  indexTargetContract: mapIndex.body?.mapTargetContract ?? null,
  homePreviewSchema: homePreview.body?.schemaVersion ?? null,
  homePreviewCards: previewCards.length,
};
check("MANIFEST_OK", manifest.status === 200, manifest.status, 200);
check("MAP_INDEX_OK", mapIndex.status === 200, mapIndex.status, 200);
check("HOME_PREVIEW_SCHEMA", homePreview.body?.schemaVersion === "v139-home-preview-2", report.assets.homePreviewSchema, "v139-home-preview-2");
check(
  "HOME_PREVIEW_FIELDS",
  previewCards.length === 8 && previewCards.every((card) => card.question && card.headline?.value && card.headline?.label),
  previewCards.map((card) => [card.elementId, Boolean(card.question), Boolean(card.headline)]),
  "question and headline on all eight cards"
);
check(
  "MAP_COUNT_MANIFEST_EQUALS_INDEX",
  manifest.body?.mapLayerCount === indexActive.length && mapIndex.body?.activeMapLayerCount === indexActive.length,
  report.assets,
  "manifest.mapLayerCount = map-index.activeMapLayerCount = active layers"
);
check("B017_NOT_IN_MAP_INDEX", !indexIds.has("B-017"), indexIds.has("B-017"), false);

// ------------------------------------------------------------ home
await section("HOME", async () => {
  const page = await open("/", ".home-featured-v139__card");
  await page.waitForFunction(() => document.querySelectorAll(".home-featured-v139__card").length >= 8, null, { timeout: 60_000 });
  await page.waitForTimeout(800);
  const home = await page.evaluate(() => {
    const tidy = (value) => String(value || "").normalize("NFC").replace(/\s+/gu, " ").trim();
    const stats = Object.fromEntries(
      [...document.querySelectorAll(".home-status-v139 dl > div")].map((node) => [
        tidy(node.querySelector("dt")?.textContent),
        tidy(node.querySelector("dd")?.textContent),
      ])
    );
    const cards = [...document.querySelectorAll(".home-featured-v139__card")].map((card) => ({
      id: card.getAttribute("data-element-id"),
      kind: card.getAttribute("data-preview-kind"),
      title: tidy(card.querySelector("h3")?.textContent),
      question: tidy(card.querySelector(".home-featured-v139__question")?.textContent),
      headlineValue: tidy(card.querySelector(".home-featured-v139__headline strong")?.textContent),
      headlineLabel: tidy(card.querySelector(".home-featured-v139__headline span")?.textContent),
      hasPreview: Boolean(card.querySelector(".home-featured-v139__chart svg, .home-featured-v139__chart img")),
      factLabels: [...card.querySelectorAll(".home-featured-v139__meta dt")].map((node) => tidy(node.textContent)),
      // Glossary term buttons sit inside the text; the card's own controls are
      // the ones that are not a bare acronym.
      controls: [...card.querySelectorAll("button, a")]
        .map((node) => tidy(node.textContent))
        .filter((text) => !/^[A-Za-z0-9₂₄()·\s]{1,14}$/u.test(text)),
      text: tidy(card.innerText),
      height: Math.round(card.getBoundingClientRect().height),
    }));
    return {
      stats,
      cards,
      heroMapLink: tidy(document.querySelector('[data-testid="home-hero-map-link-v139"]')?.textContent),
      overflow: document.documentElement.scrollWidth > window.innerWidth + 1,
    };
  });
  report.home = home;
  await page.screenshot({ path: resolve(SHOTS, "home-1440.png"), fullPage: true });
  const ids = home.cards.map((card) => card.id);
  check("HOME_FEATURED_EIGHT", JSON.stringify(ids) === JSON.stringify(FEATURED), ids, FEATURED);
  check("HOME_CARD_QUESTION", home.cards.every((card) => /\?$/u.test(card.question)), home.cards.map((card) => card.question), "every card asks its question");
  check(
    "HOME_CARD_HEADLINE",
    home.cards.every((card) => card.headlineValue && card.headlineLabel),
    home.cards.map((card) => `${card.headlineValue} — ${card.headlineLabel}`),
    "one figure with its rule on every card"
  );
  check("HOME_CARD_PREVIEW", home.cards.every((card) => card.hasPreview), home.cards.map((card) => card.hasPreview), "a chart or map on every card");
  check(
    "HOME_CARD_FACTS_PERIOD_PROVIDER_ONLY",
    home.cards.every((card) => JSON.stringify(card.factLabels) === JSON.stringify(HOME_CARD_FACT_LABELS)),
    home.cards.map((card) => card.factLabels),
    HOME_CARD_FACT_LABELS
  );
  check(
    "HOME_CARD_SINGLE_DETAIL_CONTROL",
    home.cards.every((card) => card.controls.length === 1 && /상세보기/u.test(card.controls[0])),
    home.cards.map((card) => card.controls),
    ["상세보기 →"]
  );
  check(
    "HOME_CARD_NO_MAP_OR_DOWNLOAD_CONTROL",
    home.cards.every((card) => !card.controls.some((text) => /지도|다운로드/u.test(text))),
    home.cards.flatMap((card) => card.controls.filter((text) => /지도|다운로드/u.test(text))),
    []
  );
  check(
    "HOME_CARD_NO_ROW_COUNT",
    home.cards.every((card) => !/\d행\b|원자료 행|수록 행/u.test(card.text)),
    home.cards.filter((card) => /\d행\b|원자료 행|수록 행/u.test(card.text)).map((card) => card.id),
    []
  );
  check(
    "HOME_CARD_NO_CAVEAT_PARAGRAPH",
    home.cards.every((card) => !/않습니다|않으며|있을 수 있습니다/u.test(card.text)),
    home.cards.filter((card) => /않습니다|않으며|있을 수 있습니다/u.test(card.text)).map((card) => card.id),
    []
  );
  check("HOME_NO_OVERFLOW", !home.overflow, home.overflow, false);
  await page.close();
});const homeMapCount = count(report.home?.stats?.["지도 제공 항목"]);
const homeTotalCount = count(report.home?.stats?.["전체 데이터 항목"]);
const homeDownloadCount = count(report.home?.stats?.["다운로드 가능 항목"]);
const homeTitle = (id) => report.home?.cards.find((card) => card.id === id)?.title || null;
check("HOME_MAP_COUNT_EQUALS_INDEX", homeMapCount === indexActive.length, homeMapCount, indexActive.length);

// ------------------------------------------------------------ finder
await section("FINDER", async () => {
  const page = await open("/#explorer", '[data-testid="finder-results-v136"]');
  const total = () => page.$eval('[data-testid="finder-results-v136"]', (node) => Number(node.getAttribute("data-total-count")));
  await page.waitForFunction(
    () => Number(document.querySelector('[data-testid="finder-results-v136"]')?.getAttribute("data-total-count") || 0) > 0,
    null,
    { timeout: 60_000 }
  );
  await page.waitForTimeout(500);
  const totalAll = await total();
  const labels = await page.$$eval(".cdp-field__label", (nodes) => nodes.map((node) => String(node.textContent || "").trim()));
  // The eight featured titles, read from the finder's own cards. Searching
  // the title puts the card on the first page regardless of paging.
  const finderTitles = {};
  for (const id of FEATURED) {
    await page.fill(".cdp-input", (homeTitle(id) || "").replace(/\(.*?\)/gu, "").trim());
    await page
      .waitForFunction((elementId) => Boolean(document.querySelector(`[data-testid="public-finder-card-v135"][data-element-id="${elementId}"]`)), id, { timeout: 30_000 })
      .catch(() => null);
    finderTitles[id] = await page
      .$eval(`[data-testid="public-finder-card-v135"][data-element-id="${id}"] h2`, (node) => String(node.textContent || "").normalize("NFC").replace(/\s+/gu, " ").trim())
      .catch(() => null);
  }
  await page.fill(".cdp-input", "");
  await page.click("details.cdp-advanced-filters > summary");
  await page.selectOption('[data-testid="finder-delivery-filter-v140"]', "map");
  await page.waitForTimeout(400);
  const totalMap = await total();
  const visibleCards = await page.$$eval('[data-testid="public-finder-card-v135"]', (cards) => ({
    cards: cards.length,
    withMapButton: cards.filter((card) => [...card.querySelectorAll("button")].some((button) => /지도에서 보기/u.test(button.textContent || ""))).length,
  }));
  await page.screenshot({ path: resolve(SHOTS, "finder-map-filter-1440.png") });
  await page.selectOption('[data-testid="finder-delivery-filter-v140"]', "download");
  await page.waitForTimeout(400);
  const totalDownload = await total();
  await page.selectOption('[data-testid="finder-delivery-filter-v140"]', "all");
  await page.fill(".cdp-input", "물 스트레스");
  await page
    .waitForFunction(() => Boolean(document.querySelector('[data-testid="public-finder-card-v135"][data-element-id="B-017"]')), null, { timeout: 30_000 })
    .catch(() => null);
  const b017Buttons = await page
    .$eval('[data-testid="public-finder-card-v135"][data-element-id="B-017"]', (card) => [...card.querySelectorAll("button")].map((button) => String(button.textContent || "").trim()))
    .catch(() => null);
  report.finder = { totalAll, totalMap, totalDownload, visibleCards, finderTitles, labels, b017Buttons };
  check("FINDER_TOTAL_152", totalAll === 152 && totalAll === homeTotalCount, { totalAll, homeTotalCount }, 152);
  check(
    "FINDER_HAS_SORT_AND_FILTERS",
    ["정렬", "대분류", "제공기관", "제공 형태", "기후기술", "자료연도"].every((name) => labels.includes(name)),
    labels,
    "정렬·대분류·제공기관·제공 형태·기후기술·자료연도"
  );
  check("FINDER_MAP_FILTER_EQUALS_INDEX", totalMap === indexActive.length && totalMap === homeMapCount, { totalMap, index: indexActive.length, homeMapCount }, "one count");
  check("FINDER_MAP_FILTER_CARDS_HAVE_MAP_BUTTON", visibleCards.cards > 0 && visibleCards.withMapButton === visibleCards.cards, visibleCards, "every listed card opens the map");
  check("FINDER_DOWNLOAD_FILTER_EQUALS_HOME", totalDownload === homeDownloadCount, { totalDownload, homeDownloadCount }, "one count");
  check(
    "FINDER_TITLES_EQUAL_HOME",
    FEATURED.every((id) => finderTitles[id] && finderTitles[id] === homeTitle(id)),
    FEATURED.map((id) => ({ id, home: homeTitle(id), finder: finderTitles[id] })),
    "same public title"
  );
  check("FINDER_B017_NO_MAP_BUTTON", Array.isArray(b017Buttons) && !b017Buttons.some((text) => /지도/u.test(text)), b017Buttons, "no 지도에서 보기 on B-017");
  await page.close();
});
// ------------------------------------------------------------ map
await section("MAP", async () => {
  const page = await open("/#map", ".cdp-map-catalog-v138");
  await page.waitForFunction(
    (expected) => document.querySelectorAll('.cdp-map-catalog-v138__item[data-map-available="true"]').length === expected,
    indexActive.length,
    { timeout: 90_000 }
  );
  await page.waitForTimeout(500);
  const map = await page.evaluate(() => {
    const tidy = (value) => String(value || "").normalize("NFC").replace(/\s+/gu, " ").trim();
    const lede = document.querySelector('[data-testid="map-catalog-status-v138"]');
    const rows = [...document.querySelectorAll(".cdp-map-catalog-v138__item")];
    return {
      lede: tidy(lede?.textContent),
      ledeConnected: Number(lede?.getAttribute("data-map-connected-count")),
      ledePending: Number(lede?.getAttribute("data-map-pending-count")),
      rowCount: rows.length,
      availableCount: rows.filter((row) => row.getAttribute("data-map-available") === "true").length,
      groupCounts: [...document.querySelectorAll(".cdp-map-catalog-v138__group-count")].map((node) => tidy(node.textContent)),
      pendingRows: rows
        .filter((row) => row.getAttribute("data-map-available") !== "true")
        .map((row) => ({
          id: row.getAttribute("data-map-element"),
          badge: tidy(row.querySelector('[data-testid="map-catalog-pending-v140"]')?.textContent),
          summary: tidy(row.querySelector("label small")?.textContent),
          disabled: Boolean(row.querySelector("input")?.disabled),
          checked: Boolean(row.querySelector("input")?.checked),
          dashed: getComputedStyle(row).borderStyle.includes("dashed"),
        })),
      drawn: rows.filter((row) => row.getAttribute("data-map-drawn") === "true").map((row) => row.getAttribute("data-map-element")),
    };
  });
  await page.$eval('details[data-testid="map-data-guide-details-v135"] summary', (node) => node.click()).catch(() => null);
  await page.waitForTimeout(300);
  map.guideCount = clean(await page.$eval('[data-testid="map-data-guide-count-v140"]', (node) => node.textContent).catch(() => ""));
  // Clicking a pending row must not draw anything.
  map.b017Click = await page.evaluate(() => {
    const toggle = document.querySelector('[data-map-group-v135="물·자원"] [data-testid="map-catalog-group-toggle-v138"]');
    if (toggle && toggle.getAttribute("aria-expanded") !== "true") toggle.click();
    const input = document.querySelector('.cdp-map-catalog-v138__item[data-map-element="B-017"] input');
    if (!input) return { found: false };
    input.click();
    return { found: true, checked: input.checked, drawn: input.closest(".cdp-map-catalog-v138__item")?.getAttribute("data-map-drawn") };
  });
  await page.waitForTimeout(300);
  const waterGroup = await page.$('[data-map-group-v135="물·자원"]');
  if (waterGroup) await waterGroup.screenshot({ path: resolve(SHOTS, "map-water-group.png") });
  await page.screenshot({ path: resolve(SHOTS, "map-1440.png") });
  report.map = map;
  const guideCount = Number((map.guideCount.match(/지도 자료 (\d+)개/u) || [])[1]);
  check(
    "MAP_LEDE_COUNT_EQUALS_INDEX",
    map.ledeConnected === indexActive.length && new RegExp(`^${indexActive.length}개 자료 · 선택`).test(map.lede),
    map.lede,
    `${indexActive.length}개 자료 · 선택 …`
  );
  check("MAP_GUIDE_COUNT_EQUALS_INDEX", guideCount === indexActive.length, map.guideCount, indexActive.length);
  const everywhere = {
    home: homeMapCount,
    mapLede: map.ledeConnected,
    mapGuide: guideCount,
    finderMapFilter: report.finder?.totalMap,
    mapIndex: indexActive.length,
    manifest: manifest.body?.mapLayerCount,
  };
  check("MAP_COUNT_ONE_NUMBER_EVERYWHERE", new Set(Object.values(everywhere)).size === 1, everywhere, "one number");
  check(
    "MAP_PENDING_STATED",
    map.ledePending === map.rowCount - map.availableCount && (map.ledePending === 0 || /준비 중 \d+개/u.test(map.lede)),
    { lede: map.lede, ledePending: map.ledePending, rows: map.rowCount, available: map.availableCount },
    "the lede states how many targets are pending"
  );
  check(
    "MAP_PENDING_ROWS_MARKED",
    map.pendingRows.every((row) => row.badge === "준비 중" && row.disabled && !row.checked && /위치자료 없음/u.test(row.summary) && row.dashed),
    map.pendingRows,
    "badge, disabled checkbox, dashed border, 위치자료 없음"
  );
  check("MAP_B017_PENDING", map.pendingRows.some((row) => row.id === "B-017"), map.pendingRows.map((row) => row.id), ["B-017"]);
  check(
    "MAP_B017_NEVER_DRAWN",
    map.b017Click.found && !map.b017Click.checked && map.b017Click.drawn !== "true" && !map.drawn.includes("B-017"),
    map.b017Click,
    "clicking B-017 draws nothing"
  );
  check(
    "MAP_GROUP_COUNTS_NAME_PENDING",
    map.ledePending === 0 || map.groupCounts.some((text) => /준비 중 \d/u.test(text)),
    map.groupCounts,
    "the group holding a pending target says so"
  );
  await page.close();
});
// ------------------------------------------------------------ A-002 detail
await section("DETAIL_A002", async () => {
  const page = await open("/?view=data&country=VNM&element=A-002#element-detail", "h1");
  await page.waitForSelector('[data-testid="public-analysis-root"]', { timeout: 60_000 }).catch(() => null);
  await page.waitForTimeout(800);
  const detail = await page.evaluate(() => {
    const tidy = (value) => String(value || "").normalize("NFC").replace(/\s+/gu, " ").trim();
    return {
      title: tidy(document.querySelector("h1")?.textContent),
      analysisMounted: Boolean(document.querySelector('[data-testid="public-analysis-root"]')),
      chartCount: document.querySelectorAll('[data-testid="public-analysis-root"] svg').length,
      limitationItems: [...document.querySelectorAll('[data-testid="public-limitation-item"]')].map((node) => tidy(node.textContent)),
    };
  });
  await page.screenshot({ path: resolve(SHOTS, "detail-a002-1440.png"), fullPage: true });
  report.detail = detail;
  check("DETAIL_A002_TITLE_EQUALS_HOME", detail.title === homeTitle("A-002"), detail.title, homeTitle("A-002"));
  check("DETAIL_A002_ANALYSIS", detail.analysisMounted && detail.chartCount > 0, detail, "analysis root with charts");
  await page.close();
});
// ------------------------------------------------------------ moved caveats
await section("MOVED_CAVEATS", async () => {
  const moved = {};
  for (const [id, needle] of MOVED_CAVEATS) {
    const page = await open(`/?view=data&country=VNM&element=${id}#element-detail`, "h1");
    await page.waitForSelector('[data-testid="public-limitations-panel"]', { timeout: 60_000 }).catch(() => null);
    moved[id] = await page
      .$$eval('[data-testid="public-limitation-item"]', (nodes, text) => nodes.some((node) => (node.textContent || "").includes(text)), needle)
      .catch(() => false);
    await page.close();
  }
  report.movedCaveats = moved;
  check("DETAIL_CARRIES_MOVED_CAVEATS", Object.values(moved).every(Boolean), moved, "every caveat taken off the home is on its detail screen");
});
// ------------------------------------------------------------ download
await section("DOWNLOAD", async () => {
  const page = await open("/?country=VNM&element=A-002#download", ".cdp-download-footer");
  await page
    .waitForFunction(() => /선택한 데이터 \d+개/u.test(document.querySelector(".cdp-download-summary")?.textContent || ""), null, { timeout: 60_000 })
    .catch(() => null);
  const summary = clean(await page.$eval(".cdp-download-summary", (node) => node.textContent).catch(() => ""));
  let file;
  try {
    const [download] = await Promise.all([page.waitForEvent("download", { timeout: 90_000 }), page.click(".cdp-download-footer button")]);
    const path = await download.path();
    file = { name: download.suggestedFilename(), bytes: path ? statSync(path).size : null };
  } catch (error) {
    file = { error: error instanceof Error ? error.message : String(error) };
  }
  const head = await fetch(`${base}/data/vietnam/v2/downloads/a-002.csv`, { method: "HEAD" });
  report.download = { summary, file, staticCsvStatus: head.status, staticCsvBytes: head.headers.get("content-length") };
  check("DOWNLOAD_A002_PRESELECTED", /선택한 데이터 1개/u.test(summary), summary, "선택한 데이터 1개 · …");
  check("DOWNLOAD_A002_FILE", Boolean(file?.name) && (file.bytes ?? 1) > 0, file, "a file is produced");
  check("DOWNLOAD_A002_STATIC_ASSET", head.status === 200, head.status, 200);
  await page.close();
});
// ------------------------------------------------------------ B-017 detail: no location claim
await section("B017_DETAIL", async () => {
  const page = await open("/?view=data&country=VNM&element=B-017#element-detail", "h1");
  await page.waitForSelector('[data-testid="public-analysis-root"]', { timeout: 60_000 }).catch(() => null);
  await page.waitForTimeout(500);
  const b017 = await page.evaluate(() => {
    const tidy = (value) => String(value || "").normalize("NFC").replace(/\s+/gu, " ").trim();
    return {
      mapLinks: [...document.querySelectorAll("button, a")].filter((node) => /지도에서 보기/u.test(node.textContent || "")).length,
      mapEngine: Boolean(document.querySelector(".maplibregl-map")),
      statesNotOnMap: /지도에는 연결하지 않았습니다|지도 미연결|지도에 표시하지 않|지도에는 연결되지 않/u.test(tidy(document.body.innerText)),
    };
  });
  report.b017Detail = b017;
  check("B017_DETAIL_NO_LOCATION_CLAIM", b017.mapLinks === 0 && !b017.mapEngine && b017.statesNotOnMap, b017, "no map link, no map, states it is not on the map");
  await page.close();
});
await browser.close();
if (server) await server.close();

const unexpectedHttp = report.httpFailures.filter((failure) => !/favicon/u.test(failure.url));
check("CONSOLE_ERRORS", report.consoleErrors.length === 0, report.consoleErrors, []);
check("HTTP_FAILURES", unexpectedHttp.length === 0, unexpectedHttp, []);

const failed = report.checks.filter((item) => !item.pass);
report.summary = { passed: report.checks.length - failed.length, failed: failed.length, total: report.checks.length };
writeFileSync(resolve(OUT, `role-split-qa-v140-${label}.json`), `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify({ label, base, ...report.summary, failedIds: failed.map((item) => item.id) }));
process.exitCode = failed.length ? 1 : 0;
