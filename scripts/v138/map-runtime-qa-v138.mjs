#!/usr/bin/env node
/**
 * Browser QA for the V138 map: every active layer drawn and one representative
 * feature selected, multi-select, folding, colour-source switch, hide/show,
 * URL reload restore, panel resize by keyboard and by drag, a preset drawing
 * the combination it names, the climate region trend, and the page at five
 * widths with clipped-text and overflow checks. Console errors, failed
 * responses and retries are recorded rather than hidden.
 *
 * Runs against the production build in ./build (or --build <dir>) on its own
 * static server. Playwright chromium.
 *
 *   node scripts/v138/map-runtime-qa-v138.mjs [--build build] [--port 4331]
 */
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";
import { startStaticBuildServer } from "../v125/browser-runtime.mjs";
import { combinationUrlV150 } from "../v150/map-combinations.mjs";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const argv = process.argv.slice(2);
const opt = (name, fallback) => {
  const index = argv.indexOf(name);
  return index < 0 ? fallback : argv[index + 1];
};
const BUILD = resolve(ROOT, opt("--build", "build"));
const PORT = Number(opt("--port", "4331"));
const OUT = resolve(ROOT, "reports/v138");
const SHOTS = resolve(OUT, "screenshots/map");
mkdirSync(SHOTS, { recursive: true });

const mapIndex = JSON.parse(readFileSync(resolve(ROOT, "public/data/vietnam/v2/map-index.json"), "utf8"));
const activeLayers = mapIndex.layers.filter((layer) => layer.active !== false && layer.enabled !== false);

const server = await startStaticBuildServer(BUILD, { port: PORT });
const base = server.url.replace(/\/$/u, "");
const browser = await chromium.launch();
const report = {
  schema: "map-runtime-qa-v138",
  generatedAt: new Date().toISOString(),
  build: BUILD.replace(ROOT, "."),
  layers: [],
  interactions: {},
  widths: [],
  consoleErrors: [],
  httpFailures: [],
  retries: [],
};

function attach(page, bucket) {
  page.on("console", (message) => {
    if (message.type() === "error") {
      report.consoleErrors.push({ bucket, text: message.text().slice(0, 300) });
    }
  });
  page.on("pageerror", (error) => report.consoleErrors.push({ bucket, text: `pageerror: ${String(error).slice(0, 300)}` }));
  page.on("response", (response) => {
    if (response.status() >= 400) report.httpFailures.push({ bucket, status: response.status(), url: response.url() });
  });
  page.on("requestfailed", (request) => {
    report.httpFailures.push({ bucket, status: "request-failed", url: request.url(), error: request.failure()?.errorText });
  });
}

async function newPage(width = 1440, height = 1000, bucket = "map") {
  const context = await browser.newContext({ viewport: { width, height }, locale: "ko-KR" });
  const page = await context.newPage();
  attach(page, bucket);
  return { context, page };
}

const rootState = (page) =>
  page.evaluate(() => {
    const root = document.querySelector('[data-testid="map-public-content"]');
    const split = (value) => (value && value !== "none" ? value.split(",") : []);
    return {
      primary: root?.getAttribute("data-primary-element") || "none",
      contexts: split(root?.getAttribute("data-context-elements")),
      rendered: split(root?.getAttribute("data-rendered-map-elements")),
      selectedElement: document.querySelector('[data-testid="map-selected-feature-panel"]')?.getAttribute("data-selected-element-id") || null,
      selectedTitle: document.querySelector('[data-testid="map-feature-detail"] h4')?.innerText || null,
      legendItems: [...document.querySelectorAll('[data-testid="map-active-layer-legend-item"]')].map((item) => ({
        element: item.getAttribute("data-element-id"),
        drawn: item.getAttribute("data-drawn"),
        role: item.getAttribute("data-layer-role"),
      })),
      catalog: document.querySelector('[data-testid="map-catalog-status-v138"]')?.innerText || null,
      url: location.href,
    };
  });

async function openDrawerIfCollapsed(page) {
  await page.evaluate(() => {
    const toggle = document.querySelector('[data-testid="map-layer-panel"] .cdp-map-panel-toggle');
    if (toggle && toggle.getAttribute("aria-expanded") === "false") toggle.click();
  });
}

async function tick(page, elementId) {
  await openDrawerIfCollapsed(page);
  await page.evaluate((id) => {
    const input = document.querySelector(`[data-testid="map-all-data-layer-v135"][data-element-id="${id}"]`);
    const group = input?.closest("[data-map-group-v135]");
    const toggle = group?.querySelector('[data-testid="map-catalog-group-toggle-v138"]');
    if (toggle && toggle.getAttribute("aria-expanded") !== "true") toggle.click();
  }, elementId);
  const input = page.locator(`[data-testid="map-all-data-layer-v135"][data-element-id="${elementId}"]`);
  await input.scrollIntoViewIfNeeded();
  await input.click();
}

async function waitRendered(page, elementId, timeout = 30000) {
  const started = Date.now();
  let attempts = 0;
  while (Date.now() - started < timeout) {
    attempts += 1;
    const state = await rootState(page);
    if (state.rendered.includes(elementId)) return { ok: true, attempts, elapsedMs: Date.now() - started };
    await page.waitForTimeout(500);
  }
  return { ok: false, attempts, elapsedMs: Date.now() - started };
}

const INTERNAL_PHRASE_PATTERN =
  /검토의견|CF\/M0\d|M0\d 유지|신규 수집 대신|발주처 확인 필요|재산출 가능|폴리곤 재사용|attr_\d+|1\.2_entity/gu;

// ---------------------------------------------------------------- per-layer sweep
{
  const { context, page } = await newPage(1440, 1000, "layer-sweep");
  await page.goto(`${base}/#map`, { waitUntil: "domcontentloaded" });
  await page.waitForSelector('[data-testid="map-all-data-layer-v135"]', { state: "attached", timeout: 60000 });
  await page.waitForTimeout(2500);
  for (const layer of activeLayers) {
    const row = { elementId: layer.elementId, title: layer.publicShortTitle, renderer: layer.renderer, featureCount: layer.featureCount };
    const errorsBefore = report.consoleErrors.length;
    try {
      // Clear, then tick this one alone.
      await page.evaluate(() => {
        const clear = [...document.querySelectorAll("button")].find((button) => button.textContent?.trim() === "선택 해제");
        clear?.click();
      });
      await page.waitForTimeout(300);
      await tick(page, layer.elementId);
      let rendered = await waitRendered(page, layer.elementId, 25000);
      if (!rendered.ok) {
        // One retry: untick and tick again. Recorded, not hidden.
        report.retries.push({ elementId: layer.elementId, step: "render", reason: "not rendered within 25s" });
        await tick(page, layer.elementId);
        await page.waitForTimeout(500);
        await tick(page, layer.elementId);
        rendered = await waitRendered(page, layer.elementId, 25000);
      }
      row.rendered = rendered.ok;
      row.renderAttempts = rendered.attempts;
      row.renderMs = rendered.elapsedMs;
      const state = await rootState(page);
      row.primary = state.primary;
      row.analysis = await page.evaluate(() =>
        document.querySelector('[data-testid="map-current-analysis"]')?.innerText.replace(/\s+/g, " ").slice(0, 400) || null
      );
      row.summary = await page.evaluate(() =>
        document.querySelector('[data-testid="map-national-summary"]')?.innerText.replace(/\s+/g, " ").slice(0, 500) || null
      );
      // Representative feature via keyboard navigation.
      const select = page.locator('[data-testid="map-keyboard-feature-select"]');
      if (await select.count()) {
        await select.first().click();
        await page.waitForTimeout(1500);
        const after = await rootState(page);
        row.featureSelected = after.selectedElement === layer.elementId;
        row.selectedTitle = after.selectedTitle;
        row.selectedPanel = await page.evaluate(() =>
          document.querySelector('[data-testid="map-selected-feature-panel"]')?.innerText.replace(/\s+/g, " ").slice(0, 600) || null
        );
        row.regionTrend = (await page.locator('[data-testid="b033-map-region-trend-v132"]').count()) > 0;
        row.memberSeries = (await page.locator('[data-testid="map-member-series-v138"]').count()) > 0;
        row.memberRecords = (await page.locator('[data-testid="map-member-records-v138"]').count()) > 0;
      } else {
        row.featureSelected = false;
        row.selectedTitle = null;
      }
      row.selectors = await page.evaluate(() =>
        [...document.querySelectorAll('[data-testid="map-primary-controls"] select')].map((select) => ({
          id: select.getAttribute("data-testid"),
          value: select.value,
          options: select.options.length,
        }))
      );
    } catch (error) {
      row.error = String(error).slice(0, 300);
      row.rendered = false;
    }
    // Compiler notes that reached the public map text (same phrase list as
    // the screen review).
    row.internalPhrases = [row.analysis, row.summary, row.selectedPanel]
      .filter(Boolean)
      .flatMap((text) => text.match(INTERNAL_PHRASE_PATTERN) || [])
      .slice(0, 5);
    row.consoleErrors = report.consoleErrors.length - errorsBefore;
    report.layers.push(row);
    process.stdout.write(`${layer.elementId} rendered=${row.rendered} feature=${row.featureSelected}${row.error ? ` error=${row.error}` : ""}\n`);
  }
  await context.close();
}

// ---------------------------------------------------------------- interactions
{
  const { context, page } = await newPage(1440, 1000, "interactions");
  await page.goto(`${base}/#map`, { waitUntil: "domcontentloaded" });
  await page.waitForSelector('[data-testid="map-all-data-layer-v135"]', { state: "attached", timeout: 60000 });
  await page.waitForTimeout(2000);

  // Multi-select: three datasets of different kinds.
  for (const id of ["B-004", "A-023", "B-008", "C-019"]) {
    await tick(page, id);
    await waitRendered(page, id, 25000);
  }
  let state = await rootState(page);
  report.interactions.multiSelect = {
    primary: state.primary,
    contexts: state.contexts,
    rendered: state.rendered,
    colourSourceShown: (await page.locator('[data-testid="map-colour-source-v138"]').count()) > 0,
    catalog: state.catalog,
    legendCount: state.legendItems.length,
  };
  await page.screenshot({ path: resolve(SHOTS, "multi-select-1440.png") });

  // Colour source switch: C-019 becomes the colour map, nothing else dropped.
  await page.selectOption('[data-testid="map-colour-source-v138"] select', "C-019");
  await page.waitForTimeout(2500);
  state = await rootState(page);
  report.interactions.colourSwitch = { primary: state.primary, contexts: state.contexts, rendered: state.rendered };

  // Hide one, keep it selected.
  await page.click('[data-testid="map-layer-visibility-v138"][data-map-element="A-023"]');
  await page.waitForTimeout(1500);
  state = await rootState(page);
  report.interactions.hide = {
    contexts: state.contexts,
    rendered: state.rendered,
    legend: state.legendItems,
    hiddenInUrl: /hiddenLayers=/u.test(state.url),
  };
  await page.click('[data-testid="map-layer-visibility-v138"][data-map-element="A-023"]');
  await page.waitForTimeout(1500);

  // Fold and unfold a category; folding must not deselect.
  const groupToggle = page.locator('[data-map-group-v135="기후·위험"] [data-testid="map-catalog-group-toggle-v138"]');
  await groupToggle.click();
  await page.waitForTimeout(300);
  const folded = await groupToggle.getAttribute("aria-expanded");
  state = await rootState(page);
  report.interactions.fold = { ariaExpandedAfterFold: folded, contextsAfterFold: state.contexts, primaryAfterFold: state.primary };
  await groupToggle.click();

  // Untick one dataset; only it leaves.
  await tick(page, "B-008");
  await page.waitForTimeout(1000);
  state = await rootState(page);
  report.interactions.untick = { primary: state.primary, contexts: state.contexts };

  // Reload restores the selection, colour map and selectors.
  const urlBefore = state.url;
  await page.goto(urlBefore, { waitUntil: "domcontentloaded" });
  await page.waitForSelector('[data-testid="map-all-data-layer-v135"]', { state: "attached", timeout: 60000 });
  await page.waitForTimeout(6000);
  const restored = await rootState(page);
  report.interactions.reload = {
    urlBefore,
    primaryBefore: state.primary,
    contextsBefore: state.contexts,
    primaryAfter: restored.primary,
    contextsAfter: restored.contexts,
    renderedAfter: restored.rendered,
    restored:
      restored.primary === state.primary &&
      [...state.contexts].sort().join() === [...restored.contexts].sort().join(),
  };

  // Resizer: keyboard, then pointer drag, then persistence across reload.
  const separator = page.locator('[data-testid="map-left-panel-separator"]');
  const widthBefore = Number(await separator.getAttribute("aria-valuenow"));
  await separator.focus();
  await page.keyboard.press("ArrowRight");
  await page.keyboard.press("ArrowRight");
  await page.waitForTimeout(300);
  const widthAfterKeys = Number(await separator.getAttribute("aria-valuenow"));
  const box = await separator.boundingBox();
  if (box) {
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.down();
    await page.mouse.move(box.x + box.width / 2 + 60, box.y + box.height / 2, { steps: 8 });
    await page.mouse.up();
    await page.waitForTimeout(300);
  }
  const widthAfterDrag = Number(await separator.getAttribute("aria-valuenow"));
  const canvasWidth = await page.evaluate(() => document.querySelector(".cdp-map-canvas-wrap")?.getBoundingClientRect().width || null);
  const stored = await page.evaluate(() => localStorage.getItem("cdp-map-left-panel-width-v150"));
  await page.reload({ waitUntil: "domcontentloaded" });
  await page.waitForSelector('[data-testid="map-left-panel-separator"]', { timeout: 60000 });
  await page.waitForTimeout(1500);
  const widthAfterReload = Number(await page.locator('[data-testid="map-left-panel-separator"]').getAttribute("aria-valuenow"));
  report.interactions.resize = {
    widthBefore,
    widthAfterKeys,
    widthAfterDrag,
    widthAfterReload,
    storedValue: stored,
    canvasWidthAfterDrag: canvasWidth,
    keyboardWorks: widthAfterKeys > widthBefore,
    dragWorks: widthAfterDrag > widthAfterKeys,
    persisted: widthAfterReload === widthAfterDrag,
  };
  await page.locator('[data-testid="map-left-panel-separator"]').dblclick();
  await page.waitForTimeout(300);
  report.interactions.resize.widthAfterReset = Number(await page.locator('[data-testid="map-left-panel-separator"]').getAttribute("aria-valuenow"));

  // Combination: 전력 인프라 draws 송전망 + 발전소. V150 removed the recommended
  // analysis buttons, so the combination is opened through the shared URL.
  await page.goto(combinationUrlV150(`${base}/`, "POWER_INFRASTRUCTURE"), { waitUntil: "domcontentloaded" });
  await page.waitForSelector('[data-testid="map-public-content"]', { timeout: 60000 });
  await page.waitForTimeout(2000);
  await waitRendered(page, "A-024", 25000);
  await waitRendered(page, "A-023", 25000);
  state = await rootState(page);
  report.interactions.preset = {
    id: "POWER_INFRASTRUCTURE",
    card: "송전망 + 발전소",
    primary: state.primary,
    contexts: state.contexts,
    rendered: state.rendered,
    matchesCard: state.rendered.includes("A-024") && state.rendered.includes("A-023"),
    notice: await page.evaluate(() => document.querySelector(".cdp-map-role-notice")?.innerText || null),
  };
  await page.screenshot({ path: resolve(SHOTS, "preset-power-1440.png") });

  // Climate layer: change measure and scenario, select a province, read the trend.
  await page.goto(`${base}/#map`, { waitUntil: "domcontentloaded" });
  await page.waitForSelector('[data-testid="map-all-data-layer-v135"]', { state: "attached", timeout: 60000 });
  await page.waitForTimeout(2000);
  await tick(page, "B-006");
  await waitRendered(page, "B-006", 25000);
  const measureSelect = page.locator('[data-testid="map-layer-variable-select"]');
  const scenarioSelect = page.locator('[data-testid="map-layer-scenario-select"]');
  const periodSelect = page.locator('[data-testid="map-layer-period-select"]');
  const before = {
    measure: await measureSelect.inputValue(),
    scenario: (await scenarioSelect.count()) ? await scenarioSelect.inputValue() : null,
    period: await periodSelect.inputValue(),
  };
  if (await scenarioSelect.count()) {
    await scenarioSelect.selectOption("ssp585");
    await page.waitForTimeout(1500);
  }
  await measureSelect.selectOption("tropical-nights-tr26");
  await page.waitForTimeout(1500);
  const after = {
    measure: await measureSelect.inputValue(),
    scenario: (await scenarioSelect.count()) ? await scenarioSelect.inputValue() : null,
    period: await periodSelect.inputValue(),
    legend: await page.evaluate(() => document.querySelector('[data-testid="map-active-layer-legend-item"]')?.innerText.replace(/\s+/g, " ") || null),
  };
  const featureSelect = page.locator('[data-testid="map-keyboard-feature-select"]');
  await featureSelect.first().click();
  await page.waitForTimeout(2000);
  const trend = await page.evaluate(() => {
    const section = document.querySelector('[data-testid="b033-map-region-trend-v132"]');
    return section
      ? {
          region: section.getAttribute("data-region-name"),
          rows: Number(section.getAttribute("data-region-record-count")),
          unit: section.getAttribute("data-region-unit"),
          series: section.querySelectorAll('[data-testid="map-b033-region-trend-chart"] .chart-legend-v127 button, [data-testid="map-b033-region-trend-chart"] legend, [data-testid="map-b033-region-trend-chart"] [role="listitem"]').length,
          text: section.innerText.replace(/\s+/g, " ").slice(0, 300),
        }
      : null;
  });
  report.interactions.climate = { before, after, trend, periodKeptOnMeasureChange: after.period === before.period };
  await page.screenshot({ path: resolve(SHOTS, "climate-b006-1440.png") });
  await context.close();
}

// ---------------------------------------------------------------- widths
for (const width of [390, 768, 1024, 1440, 1920]) {
  const { context, page } = await newPage(width, width < 800 ? 844 : 1000, `width-${width}`);
  await page.goto(`${base}/#map`, { waitUntil: "domcontentloaded" });
  await page.waitForSelector('[data-testid="map-all-data-layer-v135"]', { state: "attached", timeout: 60000 });
  await page.waitForTimeout(2000);
  await tick(page, "B-033");
  await waitRendered(page, "B-033", 25000);
  await page.waitForTimeout(1000);
  const metrics = await page.evaluate(() => {
    const viewport = innerWidth;
    const clipped = [];
    // Text nodes whose box runs past its scrolling ancestor or the viewport.
    const candidates = document.querySelectorAll(
      '[data-testid="map-layer-panel"] strong, [data-testid="map-layer-panel"] small, [data-testid="map-layer-panel"] h1, [data-testid="map-layer-panel"] h2, [data-testid="map-layer-panel"] p, .cdp-map-overlay-card strong, .cdp-map-overlay-card div, .cdp-map-legend small, .cdp-map-legend strong, [data-testid="map-analysis-panel"] h2, [data-testid="map-analysis-panel"] p'
    );
    candidates.forEach((node) => {
      const rect = node.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;
      const style = getComputedStyle(node);
      if (style.visibility === "hidden" || style.display === "none") return;
      if (rect.right > viewport + 1 || rect.left < -1) {
        clipped.push({ text: node.textContent?.trim().slice(0, 60), right: Math.round(rect.right), left: Math.round(rect.left) });
      }
      if (node.scrollWidth > node.clientWidth + 2 && style.overflow !== "visible" && style.textOverflow === "ellipsis") {
        clipped.push({ text: node.textContent?.trim().slice(0, 60), ellipsis: true });
      }
    });
    const panel = document.querySelector('[data-testid="map-layer-panel"]');
    const header = panel?.querySelector(".cdp-map-panel-header h1");
    const headerRect = header?.getBoundingClientRect();
    const canvas = document.querySelector(".cdp-map-canvas-wrap")?.getBoundingClientRect();
    const overlay = document.querySelector(".cdp-map-overlay-card")?.getBoundingClientRect();
    const legend = document.querySelector(".cdp-map-legend")?.getBoundingClientRect();
    const covered = canvas && overlay && legend
      ? Math.min(1, ((overlay.width * overlay.height) + (legend.width * legend.height)) / (canvas.width * canvas.height))
      : null;
    return {
      documentOverflow: document.documentElement.scrollWidth > innerWidth + 1,
      clipped: clipped.slice(0, 20),
      headerVisible: headerRect ? headerRect.top >= 0 && headerRect.bottom <= innerHeight && headerRect.height > 0 : null,
      panelOpen: panel?.classList.contains("is-open") || false,
      canvas: canvas ? { width: Math.round(canvas.width), height: Math.round(canvas.height) } : null,
      overlayShareOfCanvas: covered === null ? null : Number(covered.toFixed(2)),
    };
  });
  await page.screenshot({ path: resolve(SHOTS, `map-${width}.png`) });
  await page.screenshot({ path: resolve(SHOTS, `map-${width}-full.png`), fullPage: true });
  // Collapsed drawer state at phone widths: is the title still readable?
  if (width <= 768) {
    await page.evaluate(() => {
      const toggle = document.querySelector('[data-testid="map-layer-panel"] .cdp-map-panel-toggle');
      if (toggle && toggle.getAttribute("aria-expanded") === "true") toggle.click();
    });
    await page.waitForTimeout(500);
    metrics.collapsedHeaderVisible = await page.evaluate(() => {
      const header = document.querySelector('[data-testid="map-layer-panel"] .cdp-map-panel-header h1');
      const rect = header?.getBoundingClientRect();
      const panel = document.querySelector('[data-testid="map-layer-panel"]')?.getBoundingClientRect();
      return rect && panel ? rect.top >= panel.top - 1 && rect.bottom <= panel.bottom + 1 : null;
    });
    await page.screenshot({ path: resolve(SHOTS, `map-${width}-collapsed.png`) });
  }
  report.widths.push({ width, ...metrics });
  await context.close();
}

await browser.close();
await server.close();

report.summary = {
  activeLayers: activeLayers.length,
  renderedLayers: report.layers.filter((row) => row.rendered).length,
  featureSelectedLayers: report.layers.filter((row) => row.featureSelected).length,
  internalPhraseLayers: report.layers.filter((row) => row.internalPhrases?.length).map((row) => row.elementId),
  consoleErrorCount: report.consoleErrors.length,
  httpFailureCount: report.httpFailures.length,
  retryCount: report.retries.length,
  widthsWithClippedText: report.widths.filter((row) => row.clipped.length > 0).map((row) => row.width),
  widthsWithDocumentOverflow: report.widths.filter((row) => row.documentOverflow).map((row) => row.width),
};
writeFileSync(resolve(OUT, "map-runtime-qa-v138.json"), `${JSON.stringify(report, null, 2)}\n`);
process.stdout.write(`${JSON.stringify(report.summary)}\n`);
