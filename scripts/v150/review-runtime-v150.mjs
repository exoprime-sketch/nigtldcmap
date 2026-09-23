// V150 runtime review: what the production build actually does in a browser.
//
//   node scripts/v150/review-runtime-v150.mjs [--build tmp/build-v150-review] [--base-url http://127.0.0.1:4330]
//                                            [--only map,finder,home,responsive,axes,descriptions]
//                                            [--out reports/v150/review-runtime-v150.json]
//
// Sections
//   map          recommended-analysis DOM absent, backdrop toggle (layers +
//                attribution), Korean place labels, panel resizing (drag,
//                double-click reset, keyboard, persistence), 42 layers opened
//                one by one with console errors collected.
//   finder       filters, sort, expanded search and scroll survive a detail
//                round-trip (1280px and 390px).
//   home         no topic section, no pre-aggregation copy, an SVG hero map,
//                screenshots at 1440px and 390px.
//   responsive   7 screens × 6 widths, horizontal document overflow.
//   axes         152 detail screens: every chart block carries data-chart-axes
//                or a unit label.
//   descriptions the finder card and the detail hero show the same V150 string.
//
// Results merge into the JSON by section, so a section can be re-run alone.
// Screenshots go to output/public-review-20260921/v150/ (git-ignored).
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
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
const BUILD = resolve(ROOT, arg("--build", "tmp/build-v150-review"));
const OUT = resolve(ROOT, arg("--out", "reports/v150/review-runtime-v150.json"));
const SHOTS = resolve(ROOT, "output/public-review-20260921/v150");
const ONLY = new Set(arg("--only", "map,finder,home,responsive,axes,descriptions").split(",").map((s) => s.trim()).filter(Boolean));
const WIDTHS = [320, 390, 768, 1024, 1440, 1920];

const catalog = JSON.parse(readFileSync(resolve(ROOT, "public/data/vietnam/v2/catalog.json"), "utf8")).elements;
const mapIndex = JSON.parse(readFileSync(resolve(ROOT, "public/data/vietnam/v2/map-index.json"), "utf8"));
const descriptions = JSON.parse(readFileSync(resolve(ROOT, "src/data/visualization/datasetDescriptionsV150.json"), "utf8"));
const activeLayers = mapIndex.layers.filter((layer) => layer.active !== false && layer.enabled !== false);

mkdirSync(SHOTS, { recursive: true });
mkdirSync(dirname(OUT), { recursive: true });
const report = existsSync(OUT) ? JSON.parse(readFileSync(OUT, "utf8")) : {};
report.generatedAt = new Date().toISOString();
report.build = BUILD;

const detailUrl = (base, id) => `${base}/?view=data&country=VNM&element=${id}#element-detail`;
const IGNORED_CONSOLE = [/\/api\/usage/u, /tiles\.openfreemap\.org/u, /openfreemap/iu, /ERR_INTERNET_DISCONNECTED/u, /net::ERR_/u];

function attachErrorCollectors(page) {
  const errors = [];
  const ignored = [];
  page.on("console", (message) => {
    if (message.type() !== "error") return;
    const text = message.text();
    (IGNORED_CONSOLE.some((pattern) => pattern.test(text)) ? ignored : errors).push(text);
  });
  page.on("pageerror", (error) => errors.push(`pageerror: ${error.message}`));
  page.on("response", (response) => {
    if (response.status() >= 400) {
      const url = response.url();
      (IGNORED_CONSOLE.some((pattern) => pattern.test(url)) ? ignored : errors).push(`HTTP ${response.status()} ${url}`);
    }
  });
  return { errors, ignored };
}

async function waitMapReady(page) {
  await page.waitForSelector('[data-testid="map-public-content"]', { timeout: 60_000 });
  await page.waitForFunction(() => Boolean(window.__nigtMapObserverV137?.ready()), undefined, { timeout: 60_000 });
}

const measureOverflow = () => ({
  innerWidth: window.innerWidth,
  documentScrollWidth: document.documentElement.scrollWidth,
  bodyScrollWidth: document.body.scrollWidth,
  overflow: Math.max(document.documentElement.scrollWidth, document.body.scrollWidth) - window.innerWidth,
  wideElements: [...document.querySelectorAll("body *")]
    .filter((node) => {
      const rect = node.getBoundingClientRect();
      return rect.width > 0 && rect.right > window.innerWidth + 1 && getComputedStyle(node).position !== "fixed";
    })
    .slice(0, 5)
    .map((node) => `${node.tagName.toLowerCase()}${node.className ? `.${String(node.className).split(" ")[0]}` : ""}`),
});

async function sectionMap(browser, base) {
  const result = { checks: {}, layers: [] };
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, locale: "ko-KR" });
  const page = await context.newPage();
  const collected = attachErrorCollectors(page);

  await page.goto(`${base}/?view=map&country=VNM#map`, { waitUntil: "domcontentloaded" });
  await waitMapReady(page);
  await page.waitForTimeout(1500);

  // 1. No recommended analysis in the DOM.
  result.checks.presetButtons = await page.locator('[data-testid="map-analysis-preset"]').count();
  result.checks.recommendedText = await page.evaluate(() => (document.body.innerText.match(/추천 분석/gu) || []).length);

  // 2. Backdrop toggle.
  const layerState = () => page.evaluate(() => {
    const layers = window.__nigtMapObserverV137.styleLayers();
    // V151-2: backdrop layers carry the cdp-bd-v151- prefix and a kind radio replaces the checkbox.
    const backdrop = layers.filter((layer) => /^cdp-bd-v151-/u.test(layer.id) || /^cdp-bd-src-v151-/u.test(layer.source || ""));
    return {
      backdropLayerIds: backdrop.map((layer) => layer.id),
      backdropVisible: backdrop.filter((layer) => layer.visibility !== "none").length,
      backdropHidden: backdrop.filter((layer) => layer.visibility === "none").length,
      koreanLabelLayers: layers.filter((layer) => /^cdp-ko-(country|city-marker|city|province)$/u.test(layer.id)).map((layer) => `${layer.id}:${layer.visibility}`),
      attributionHasOpenFreeMap: /OpenFreeMap/u.test(document.body.innerText),
      stored: localStorage.getItem("cdp-map-backdrop-v151"),
      checkbox: document.querySelector('.cdp-map-backdrop-v151 input[name="cdp-map-backdrop-v151"]:checked')?.value !== "none",
      labelNames: window.__nigtMapObserverV137.sourceNames("cdp-ko-labels-v151"),
    };
  });
  const before = await layerState();
  await page.locator('input[name="cdp-map-backdrop-v151"][value="none"]').check();
  await page.waitForTimeout(800);
  const afterOff = await layerState();
  await page.locator('input[name="cdp-map-backdrop-v151"][value="terrain"]').check();
  await page.waitForTimeout(4000);
  const afterOn = await layerState();
  result.checks.backdrop = {
    initial: { checkbox: before.checkbox, visible: before.backdropVisible, hidden: before.backdropHidden, attribution: before.attributionHasOpenFreeMap, layerIds: before.backdropLayerIds },
    off: { checkbox: afterOff.checkbox, visible: afterOff.backdropVisible, hidden: afterOff.backdropHidden, attribution: afterOff.attributionHasOpenFreeMap, stored: afterOff.stored },
    on: { checkbox: afterOn.checkbox, visible: afterOn.backdropVisible, hidden: afterOn.backdropHidden, attribution: afterOn.attributionHasOpenFreeMap, stored: afterOn.stored },
    pass: before.backdropLayerIds.length > 0 && afterOff.backdropVisible === 0 && afterOff.attributionHasOpenFreeMap === false && afterOn.backdropHidden === 0 && afterOn.attributionHasOpenFreeMap === true,
  };
  const names = new Set(afterOn.labelNames);
  result.checks.koreanLabels = {
    layers: afterOn.koreanLabelLayers,
    sourceFeatureCount: afterOn.labelNames.length,
    cities: ["하노이", "다낭", "호찌민"].map((name) => ({ name, present: names.has(name) })),
    provinceSample: [...names].filter((name) => !["하노이", "다낭", "호찌민", "베트남", "라오스", "캄보디아", "태국", "중국"].includes(name)).slice(0, 5),
    pass: afterOn.koreanLabelLayers.length === 4 && ["하노이", "다낭", "호찌민"].every((name) => names.has(name)),
  };

  // 3. Panel resizing.
  const separator = page.locator('[data-testid="map-left-panel-separator"]');
  await separator.waitFor({ timeout: 30_000 });
  const valueOf = async (locator) => Number(await locator.getAttribute("aria-valuenow"));
  const maxOf = async (locator) => Number(await locator.getAttribute("aria-valuemax"));
  const minOf = async (locator) => Number(await locator.getAttribute("aria-valuemin"));
  const widthBefore = await valueOf(separator);
  const drag = async (locator, dx) => {
    const box = await locator.boundingBox();
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.down();
    const steps = 12;
    for (let i = 1; i <= steps; i += 1) await page.mouse.move(box.x + box.width / 2 + (dx * i) / steps, box.y + box.height / 2);
    await page.mouse.up();
    await page.waitForTimeout(300);
  };
  await drag(separator, -400);
  const widthAtSmall = await valueOf(separator);
  await drag(separator, 900);
  const widthAtLarge = await valueOf(separator);
  await drag(separator, 1200);
  const widthAtMax = await valueOf(separator);
  const declaredMax = await maxOf(separator);
  const declaredMin = await minOf(separator);
  const canvasAtMax = await page.evaluate(() => document.querySelector(".cdp-map-canvas-wrap")?.getBoundingClientRect().width || null);
  await separator.dblclick();
  await page.waitForTimeout(300);
  const widthAfterReset = await valueOf(separator);
  await separator.focus();
  for (let i = 0; i < 3; i += 1) await page.keyboard.press("ArrowRight");
  await page.waitForTimeout(200);
  const widthAfterKeys = await valueOf(separator);
  await page.keyboard.press("Shift+ArrowLeft");
  await page.waitForTimeout(200);
  const widthAfterShiftKey = await valueOf(separator);
  const stored = await page.evaluate(() => localStorage.getItem("cdp-map-left-panel-width-v150"));
  await page.reload({ waitUntil: "domcontentloaded" });
  await waitMapReady(page);
  await page.waitForTimeout(800);
  const widthAfterReload = await valueOf(page.locator('[data-testid="map-left-panel-separator"]'));
  const cssVar = await page.evaluate(() => getComputedStyle(document.querySelector('[data-testid="map-resizable-layout"]') || document.body).getPropertyValue("--cdp-map-left-panel-width").trim());
  const right = page.locator('[data-testid="map-right-panel-separator"]');
  let rightCheck = { present: false };
  if (await right.count()) {
    const rightBefore = await valueOf(right);
    await drag(right, -300);
    const rightAfter = await valueOf(right);
    await right.dblclick();
    await page.waitForTimeout(300);
    rightCheck = { present: true, before: rightBefore, afterDrag: rightAfter, afterReset: await valueOf(right), max: await maxOf(right) };
  }
  result.checks.resize = {
    widthBefore, widthAtSmall, widthAtLarge, widthAtMax, declaredMin, declaredMax, canvasAtMax,
    widthAfterReset, widthAfterKeys, widthAfterShiftKey, stored, widthAfterReload, cssVar,
    right: rightCheck,
    pass: widthAtSmall < widthBefore && widthAtLarge > widthBefore && widthAtMax >= 1000 && widthAtMax === declaredMax && canvasAtMax !== null && canvasAtMax >= 199
      && widthAfterReset === 320 && widthAfterKeys === widthAfterReset + 30 && widthAfterShiftKey === widthAfterKeys - 40
      && Number(stored) === widthAfterShiftKey && widthAfterReload === widthAfterShiftKey,
  };

  // 4. Every active layer, one by one.
  for (const layer of activeLayers) {
    const id = layer.elementId;
    const startErrors = collected.errors.length;
    const url = `${base}/?view=map&country=VNM&layers=${id}&primaryLayer=${id}&focusLayer=${id}#map`;
    let state = null;
    try {
      await page.goto(url, { waitUntil: "domcontentloaded" });
      await waitMapReady(page);
      await page.waitForFunction((elementId) => document.querySelector('[data-testid="map-public-content"]')?.getAttribute("data-primary-element") === elementId, id, { timeout: 45_000 });
      await page.waitForTimeout(1200);
      state = await page.evaluate((elementId) => {
        const root = document.querySelector('[data-testid="map-public-content"]');
        const observer = window.__nigtMapObserverV137;
        return {
          primary: root?.getAttribute("data-primary-element"),
          rendered: root?.getAttribute("data-rendered-map-elements"),
          features: observer?.renderedFeatures(elementId)?.length ?? null,
          legend: Boolean(document.querySelector('[data-testid="map-dynamic-legend"], [data-testid="map-compact-legend-v133"]')),
        };
      }, id);
    } catch (error) {
      state = { error: error instanceof Error ? error.message : String(error) };
    }
    result.layers.push({ elementId: id, kind: layer.renderer || layer.mapMode || null, ...state, newErrors: collected.errors.slice(startErrors) });
  }
  result.consoleErrors = collected.errors;
  result.ignoredMessages = collected.ignored.slice(0, 20);
  result.ignoredMessageCount = collected.ignored.length;
  result.summary = {
    layersOpened: result.layers.filter((row) => row.primary === row.elementId).length,
    layersWithFeatures: result.layers.filter((row) => (row.features || 0) > 0).length,
    layersWithErrors: result.layers.filter((row) => row.newErrors.length || row.error).length,
    consoleErrors: collected.errors.length,
  };
  await context.close();
  return result;
}

async function sectionFinder(browser, base) {
  const runs = [];
  for (const width of [1280, 390]) {
    const context = await browser.newContext({ viewport: { width, height: width < 600 ? 844 : 900 }, locale: "ko-KR" });
    const page = await context.newPage();
    const collected = attachErrorCollectors(page);
    await page.goto(`${base}/?country=VNM#explorer`, { waitUntil: "domcontentloaded" });
    await page.waitForSelector('[data-testid="public-finder-card-v135"]', { timeout: 60_000 });
    await page.getByLabel("정렬").selectOption("title");
    await page.getByLabel("대분류").selectOption("B");
    const details = page.locator("details.cdp-advanced-filters");
    await details.locator("summary").click();
    await page.waitForTimeout(200);
    const delivery = page.getByTestId("finder-delivery-filter-v140");
    const deliveryOptions = await delivery.locator("option").evaluateAll((nodes) => nodes.map((node) => node.value));
    const wanted = deliveryOptions.find((value) => value !== "all") || "all";
    await delivery.selectOption(wanted);
    await page.waitForTimeout(600);
    // Load more cards by scrolling to the sentinel a few times.
    for (let i = 0; i < 3; i += 1) {
      await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
      await page.waitForTimeout(700);
    }
    await page.evaluate(() => window.scrollTo(0, Math.max(0, document.documentElement.scrollHeight * 0.55)));
    await page.waitForTimeout(500);
    const snapshot = () => page.evaluate(() => ({
      scrollY: Math.round(window.scrollY),
      cards: document.querySelectorAll('[data-testid="public-finder-card-v135"]').length,
      sort: [...document.querySelectorAll("select")].find((node) => node.closest("label")?.textContent?.includes("정렬"))?.value,
      category: [...document.querySelectorAll("select")].find((node) => node.closest("label")?.textContent?.includes("대분류"))?.value,
      delivery: document.querySelector('[data-testid="finder-delivery-filter-v140"]')?.value,
      expanded: document.querySelector("details.cdp-advanced-filters")?.open ?? null,
    }));
    const before = await snapshot();
    const cards = page.locator('[data-testid="public-finder-card-v135"]');
    const target = cards.nth(Math.min(before.cards - 1, 3));
    const targetId = await target.getAttribute("data-element-id");
    await target.scrollIntoViewIfNeeded();
    const beforeClick = await snapshot();
    await target.locator('[data-testid="finder-card-open-v140"]').first().click();
    await page.waitForSelector('[data-testid="public-analysis-root"][data-analysis-state="ready"], [data-testid="public-analysis-root"][data-analysis-state="empty"]', { timeout: 60_000 });
    await page.waitForTimeout(500);
    await page.goBack({ waitUntil: "domcontentloaded" });
    await page.waitForSelector('[data-testid="public-finder-card-v135"]', { timeout: 60_000 });
    await page.waitForTimeout(1500);
    const after = await snapshot();
    runs.push({
      width, openedElement: targetId, before: beforeClick, after,
      pass: after.scrollY === beforeClick.scrollY && after.cards === beforeClick.cards && after.sort === beforeClick.sort && after.category === beforeClick.category && after.delivery === beforeClick.delivery && after.expanded === beforeClick.expanded,
      consoleErrors: collected.errors,
    });
    await context.close();
  }
  return { runs, pass: runs.every((run) => run.pass) };
}

async function sectionHome(browser, base) {
  const result = { shots: [] };
  for (const width of [1440, 390]) {
    const context = await browser.newContext({ viewport: { width, height: width < 600 ? 844 : 1000 }, locale: "ko-KR" });
    const page = await context.newPage();
    const collected = attachErrorCollectors(page);
    await page.goto(`${base}/`, { waitUntil: "domcontentloaded" });
    await page.waitForSelector('[data-testid="home-hero-map-v139"]', { timeout: 60_000 });
    await page.waitForTimeout(1500);
    const facts = await page.evaluate(() => ({
      topicText: (document.body.innerText.match(/주제별 데이터/gu) || []).length,
      topicChips: document.querySelectorAll(".home-category-chips").length,
      preAggregationText: (document.body.innerText.match(/집계 전/gu) || []).length,
      heroSvg: Boolean(document.querySelector('[data-testid="home-hero-map-v139"] svg')),
      heroPaths: document.querySelectorAll('[data-testid="home-hero-map-v139"] svg path, [data-testid="home-hero-map-v139"] svg polyline, [data-testid="home-hero-map-v139"] svg line').length,
      heroTexts: [...document.querySelectorAll('[data-testid="home-hero-map-v139"] svg text')].map((node) => node.textContent?.trim()).filter(Boolean).slice(0, 12),
      featuredCards: document.querySelectorAll('[data-testid="home-card-open-v140"]').length,
    }));
    const shot = resolve(SHOTS, `home-${width}.png`);
    await page.screenshot({ path: shot, fullPage: width >= 1000 ? false : true });
    const heroShot = resolve(SHOTS, `home-hero-map-${width}.png`);
    await page.locator('[data-testid="home-hero-map-v139"]').screenshot({ path: heroShot });
    result.shots.push({ width, ...facts, screenshot: shot, heroScreenshot: heroShot, consoleErrors: collected.errors });
    await context.close();
  }
  result.pass = result.shots.every((row) => row.topicText === 0 && row.topicChips === 0 && row.preAggregationText === 0 && row.heroSvg);
  return result;
}

async function sectionResponsive(browser, base) {
  const screens = [
    { id: "home", url: `${base}/`, ready: "main" },
    { id: "finder", url: `${base}/?country=VNM#explorer`, ready: '[data-testid="public-finder-card-v135"]' },
    { id: "detail-E-005", url: detailUrl(base, "E-005"), ready: '[data-testid="public-analysis-root"][data-analysis-state]' },
    { id: "detail-B-023", url: detailUrl(base, "B-023"), ready: '[data-testid="public-analysis-root"][data-analysis-state]' },
    { id: "detail-A-023", url: detailUrl(base, "A-023"), ready: '[data-testid="public-analysis-root"][data-analysis-state]' },
    { id: "map", url: `${base}/?view=map&country=VNM#map`, ready: '[data-testid="map-public-content"]' },
    { id: "download", url: `${base}/?country=VNM#download`, ready: "main" },
  ];
  const rows = [];
  for (const width of WIDTHS) {
    const context = await browser.newContext({ viewport: { width, height: width < 600 ? 844 : 1000 }, locale: "ko-KR" });
    const page = await context.newPage();
    for (const screen of screens) {
      await page.goto(screen.url, { waitUntil: "domcontentloaded" });
      await page.waitForSelector(screen.ready, { timeout: 60_000 });
      if (screen.id === "map") await waitMapReady(page);
      await page.waitForTimeout(screen.id === "map" ? 1500 : 900);
      const measured = await page.evaluate(measureOverflow);
      rows.push({ width, screen: screen.id, ...measured, pass: measured.overflow <= 1 });
    }
    await context.close();
  }
  return { rows, combinations: rows.length, overflowing: rows.filter((row) => !row.pass).length, pass: rows.every((row) => row.pass) };
}

// A chart block is the nearest sectioning ancestor of a chart drawing inside
// the analysis root. Icon-sized svgs (toolbar buttons) are not charts.
const analyseChartBlocks = () => {
  const root = document.querySelector('[data-testid="public-analysis-root"]');
  if (!root) return { state: null, blocks: [] };
  const drawings = [...root.querySelectorAll('svg, .pct132__bars, [class*="__bars"], [class*="-bars"], [data-chart], [role="img"]')]
    .filter((node) => {
      if (node.closest(".v127-interactive-chart__toolbar, button, summary, .chart-axes-v150, [data-testid='public-selector']")) return false;
      const rect = node.getBoundingClientRect();
      if (node.tagName.toLowerCase() === "svg" && (rect.width < 40 || rect.height < 24)) return false;
      return true;
    });
  const blocks = new Map();
  for (const drawing of drawings) {
    // The block is the sectioning ancestor around the drawing, never the
    // drawing itself: the axes label sits beside the chart, not inside it.
    const block = (drawing.parentElement || drawing).closest("figure, section, article, [data-testid]") || drawing.parentElement;
    if (!block || block === root) continue;
    if (blocks.has(block)) continue;
    const text = block.innerText || "";
    const isMap = Boolean(drawing.closest('[data-testid*="location-map"], [class*="location-map"], [class*="dlm148"], .cdp-detail-map'));
    blocks.set(block, {
      testid: block.getAttribute("data-testid") || block.className?.toString().split(" ")[0] || block.tagName.toLowerCase(),
      heading: block.querySelector("h2, h3, h4, caption, summary")?.textContent?.trim().slice(0, 60) || "",
      hasAxes: Boolean(block.querySelector("[data-chart-axes]")),
      hasUnitLabel: /단위[:\s]/u.test(text) || Boolean(block.querySelector('[data-testid="chart-unit-label"], [data-testid="map-legend-unit"]')),
      isMap,
      drawing: drawing.tagName.toLowerCase() + (drawing.className ? `.${String(drawing.getAttribute("class") || "").split(" ")[0]}` : ""),
    });
  }
  return { state: root.getAttribute("data-analysis-state"), blocks: [...blocks.values()] };
};

async function sectionAxes(browser, base) {
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, locale: "ko-KR" });
  const rows = [];
  const workers = 3;
  const queue = catalog.map((element) => element.elementId);
  async function worker() {
    const page = await context.newPage();
    const collected = attachErrorCollectors(page);
    while (queue.length) {
      const id = queue.shift();
      const startErrors = collected.errors.length;
      try {
        await page.goto(detailUrl(base, id), { waitUntil: "domcontentloaded" });
        await page.waitForSelector('[data-testid="public-analysis-root"][data-analysis-state="ready"], [data-testid="public-analysis-root"][data-analysis-state="empty"]', { timeout: 90_000 });
        await page.waitForTimeout(700);
        // Open collapsed sections so hidden charts are measured too.
        await page.evaluate(() => document.querySelectorAll('[data-testid="public-analysis-root"] details').forEach((node) => { node.open = true; }));
        await page.waitForTimeout(300);
        const analysed = await page.evaluate(analyseChartBlocks);
        const heroText = await page.evaluate(() => document.querySelector(".cdp-detail-hero p")?.textContent?.trim() || "");
        const failing = analysed.blocks.filter((block) => !(block.hasAxes || block.hasUnitLabel));
        rows.push({ elementId: id, state: analysed.state, blocks: analysed.blocks.length, withAxes: analysed.blocks.filter((b) => b.hasAxes).length, unitOnly: analysed.blocks.filter((b) => !b.hasAxes && b.hasUnitLabel).length, failing, heroHasDescription: heroText.includes(descriptions[id] || "\u0000"), newErrors: collected.errors.slice(startErrors) });
      } catch (error) {
        rows.push({ elementId: id, error: error instanceof Error ? error.message : String(error), blocks: 0, failing: [] });
      }
    }
    await page.close();
  }
  await Promise.all(Array.from({ length: workers }, worker));
  rows.sort((a, b) => a.elementId.localeCompare(b.elementId));
  await context.close();
  const withBlocks = rows.filter((row) => row.blocks > 0);
  return {
    rows,
    summary: {
      screens: rows.length,
      screensWithChartBlocks: withBlocks.length,
      blocks: rows.reduce((sum, row) => sum + (row.blocks || 0), 0),
      blocksWithAxes: rows.reduce((sum, row) => sum + (row.withAxes || 0), 0),
      blocksUnitOnly: rows.reduce((sum, row) => sum + (row.unitOnly || 0), 0),
      failingBlocks: rows.reduce((sum, row) => sum + row.failing.length, 0),
      screensFailing: rows.filter((row) => row.failing.length || row.error).map((row) => row.elementId),
      heroDescriptionMatches: rows.filter((row) => row.heroHasDescription).length,
      errors: rows.filter((row) => row.error).length,
    },
  };
}

async function sectionDescriptions(browser, base) {
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, locale: "ko-KR" });
  const page = await context.newPage();
  await page.goto(`${base}/?country=VNM#explorer`, { waitUntil: "domcontentloaded" });
  await page.waitForSelector('[data-testid="public-finder-card-v135"]', { timeout: 60_000 });
  let previous = -1;
  for (let i = 0; i < 40; i += 1) {
    const count = await page.locator('[data-testid="public-finder-card-v135"]').count();
    if (count >= catalog.length || count === previous) break;
    previous = count;
    await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
    await page.waitForTimeout(700);
  }
  const cards = await page.evaluate(() => [...document.querySelectorAll('[data-testid="public-finder-card-v135"]')].map((card) => ({
    id: card.getAttribute("data-element-id"),
    description: card.querySelector(".cdp-card__description")?.textContent?.trim() || "",
  })));
  await context.close();
  const byId = new Map(cards.map((card) => [card.id, card.description]));
  const rows = catalog.map((element) => {
    const id = element.elementId;
    const expected = descriptions[id] || "";
    const shown = byId.get(id);
    return { elementId: id, expected, finderCard: shown ?? null, match: shown ? shown.replace(/\s+/gu, " ").includes(expected) : false };
  });
  return { cardsLoaded: cards.length, rows, matches: rows.filter((row) => row.match).length, missing: rows.filter((row) => row.finderCard === null).map((row) => row.elementId), mismatches: rows.filter((row) => row.finderCard !== null && !row.match).map((row) => row.elementId) };
}

let server = null;
let base = arg("--base-url", "");
if (!base) {
  server = await startStaticBuildServer(BUILD, { port: 0 });
  base = server.url.replace(/\/$/u, "");
}
const browser = await chromium.launch(process.env.V125_BROWSER_EXECUTABLE ? { executablePath: process.env.V125_BROWSER_EXECUTABLE } : {});
try {
  const save = () => writeFileSync(OUT, JSON.stringify(report, null, 2), "utf8");
  if (ONLY.has("map")) { report.map = await sectionMap(browser, base); save(); console.log("map", JSON.stringify({ ...report.map.summary, presetButtons: report.map.checks.presetButtons, recommendedText: report.map.checks.recommendedText, backdrop: report.map.checks.backdrop.pass, koreanLabels: report.map.checks.koreanLabels.pass, resize: report.map.checks.resize.pass })); }
  if (ONLY.has("finder")) { report.finder = await sectionFinder(browser, base); save(); console.log("finder", JSON.stringify(report.finder.runs.map((run) => ({ width: run.width, pass: run.pass, before: run.before, after: run.after })))); }
  if (ONLY.has("home")) { report.home = await sectionHome(browser, base); save(); console.log("home", JSON.stringify(report.home.shots.map(({ width, topicText, topicChips, preAggregationText, heroSvg, heroPaths, featuredCards }) => ({ width, topicText, topicChips, preAggregationText, heroSvg, heroPaths, featuredCards })))); }
  if (ONLY.has("responsive")) { report.responsive = await sectionResponsive(browser, base); save(); console.log("responsive", JSON.stringify({ combinations: report.responsive.combinations, overflowing: report.responsive.overflowing, failing: report.responsive.rows.filter((row) => !row.pass) })); }
  if (ONLY.has("axes")) { report.axes = await sectionAxes(browser, base); save(); console.log("axes", JSON.stringify(report.axes.summary)); }
  if (ONLY.has("descriptions")) { report.descriptions = await sectionDescriptions(browser, base); save(); console.log("descriptions", JSON.stringify({ cardsLoaded: report.descriptions.cardsLoaded, matches: report.descriptions.matches, missing: report.descriptions.missing, mismatches: report.descriptions.mismatches })); }
} finally {
  await browser.close();
  if (server) await server.close();
}
