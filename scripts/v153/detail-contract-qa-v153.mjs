#!/usr/bin/env node
/**
 * V153-D1 contract QA: does each of the 152 detail screens open on the
 * visualization its contract declares?
 *
 * Against a production build in real Chromium, per dataset:
 *   primaryTypeMatch    the first top-level [data-analysis-block] is the contract's primary.type
 *   rankOrder           data-analysis-rank runs 1..n in DOM order, once each
 *   axesMatch           the first block's ChartAxesV150 states the contract's axes and unit
 *                       (chart types only; tables, timelines and status notes carry none)
 *   blockHonesty        the tag says what the DOM holds (a line has a path, a bar a bar, …)
 *   readingNotesAbsent  "자료 해석 안내" is gone from the DOM
 *   statusNoteNoChart   the five status screens draw no chart
 *   policyNoNumericChart a policy/document screen does not open on a numeric chart
 *   kpiRow              3-4 core figures with a unit each (0 on a status screen)
 *   titleOnce           the page title is stated once among h1-h3
 *   mapPlacement        map datasets: the slot sits beside the first block at 1440px
 *                       and between the first and second block at 390px
 *   overflow320         no horizontal document overflow at 320px
 *   console             no console error and no [v153-contract] warning
 *
 * Rows with status "exception" are judged like the others (their contract
 * states the type they show) and counted separately in the summary.
 *
 *   node scripts/v153/detail-contract-qa-v153.mjs [--build build] [--port 4350]
 *        [--ids A-016,B-033] [--workers 3] [--out reports/v153/detail-contract-qa-v153.json]
 */
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";
import { startStaticBuildServer, scaledTimeoutMsV150 } from "../v125/browser-runtime.mjs";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const argv = process.argv.slice(2);
const opt = (name, fallback) => {
  const index = argv.indexOf(name);
  return index < 0 ? fallback : argv[index + 1];
};
const BUILD = resolve(ROOT, opt("--build", "build"));
const PORT = Number(opt("--port", "4350"));
const WORKERS = Math.max(1, Number(opt("--workers", "3")));
const OUT = resolve(ROOT, opt("--out", "reports/v153/detail-contract-qa-v153.json"));
const ONLY = opt("--ids", null) ? opt("--ids").split(",").map((s) => s.trim()).filter(Boolean) : null;

const contract = JSON.parse(readFileSync(resolve(ROOT, "src/data/visualization/publicVisualizationContractV153.json"), "utf8"));
const rows = contract.rows.filter((row) => !ONLY || ONLY.includes(row.elementId));
const AXIS_TYPES = new Set(["line", "stacked-area", "region-bar", "category-bar", "dumbbell", "heatmap"]);
const NUMERIC_TYPES = AXIS_TYPES;
const STATUS_IDS = new Set(["C-020", "C-021", "C-023", "E-011", "E-013"]);
const unitAliases = JSON.parse(readFileSync(resolve(ROOT, "src/data/visualization/unitDisplayV150.json"), "utf8")).aliases || {};
const displayUnit = (unit) => (unit ? unitAliases[unit] || unit : "");

const normalizeAxis = (value) => String(value || "").replace(/\([^)]*\)/gu, "").replace(/[\s·,]+/gu, "").toLowerCase();
const axisMatches = (expected, actual) => {
  const e = normalizeAxis(expected);
  const a = normalizeAxis(actual);
  if (!e || !a) return e === a;
  return e === a || a.includes(e) || e.includes(a);
};

mkdirSync(dirname(OUT), { recursive: true });
const server = await startStaticBuildServer(BUILD, { port: PORT });
const base = server.url.replace(/\/$/u, "");
const browser = await chromium.launch(process.env.V125_BROWSER_EXECUTABLE ? { executablePath: process.env.V125_BROWSER_EXECUTABLE } : {});

const READY_TIMEOUT = scaledTimeoutMsV150(45_000);

async function openDetail(page, elementId, errors) {
  await page.goto(`${base}/?view=data&country=VNM&element=${elementId}#element-detail`, { waitUntil: "domcontentloaded", timeout: scaledTimeoutMsV150(60_000) });
  await page.waitForFunction(() => {
    const root = document.querySelector('[data-testid="public-analysis-root"]');
    return root && ["ready", "empty"].includes(root.getAttribute("data-analysis-state") || "") && document.querySelectorAll('[data-testid="public-analysis-pending"]').length === 0;
  }, null, { timeout: READY_TIMEOUT });
  // The frame ranks blocks after commit and the map slot arrives lazily.
  await page.waitForFunction(() => {
    const frame = document.querySelector('[data-testid="detail-analysis-frame-v153"]');
    return frame && frame.getAttribute("data-contract-verdict") !== null;
  }, null, { timeout: scaledTimeoutMsV150(15_000) }).catch(() => errors.push("frame verdict never set"));
  await page.waitForFunction(() => !document.querySelector('[data-testid="detail-map-slot-v153"]') || document.querySelector('[data-testid="detail-location-map-v148"]'), null, { timeout: scaledTimeoutMsV150(30_000) }).catch(() => null);
  await page.waitForTimeout(400);
}

const readScreen = () => {
  const primary = document.querySelector('[data-testid="public-analysis-primary"]');
  const frame = document.querySelector('[data-testid="detail-analysis-frame-v153"]');
  const slot = primary ? Array.from(primary.children).find((child) => child.classList.contains("dl153-map-slot")) : null;
  const blocks = primary
    ? Array.from(primary.querySelectorAll("[data-analysis-block]")).filter((block) => !block.parentElement?.closest("[data-analysis-block]") && !(slot && slot.contains(block)))
    : [];
  const describe = (block) => {
    const rect = block.getBoundingClientRect();
    const axes = block.querySelector(".chart-axes-v150") || (block.previousElementSibling && block.previousElementSibling.classList.contains("chart-axes-v150") ? block.previousElementSibling : null);
    return {
      type: block.getAttribute("data-analysis-block"),
      rank: block.getAttribute("data-analysis-rank"),
      top: Math.round(rect.top + window.scrollY),
      left: Math.round(rect.left),
      width: Math.round(rect.width),
      height: Math.round(rect.height),
      axes: axes ? { x: axes.getAttribute("data-x-axis"), y: axes.getAttribute("data-y-axis"), unit: axes.getAttribute("data-unit") } : null,
      dom: {
        svgPaths: block.querySelectorAll("svg path, svg polyline").length,
        svgRects: block.querySelectorAll("svg rect").length,
        svgCircles: block.querySelectorAll("svg circle").length,
        htmlBars: block.querySelectorAll('[class*="bar"] i, [class*="__fill"], [class*="bar-track"] i, [style*="width:"], [style*="--cab129-share"], [role="img"] > span').length,
        tables: block.querySelectorAll("table").length,
        lists: block.querySelectorAll("ol, ul").length,
        times: block.querySelectorAll("time").length,
        articles: block.querySelectorAll("article, li, dl").length,
        svgs: block.querySelectorAll("svg").length,
      },
    };
  };
  const kpi = document.querySelector('[data-testid="detail-kpi-v153"]');
  const tiles = kpi ? Array.from(kpi.querySelectorAll('[data-testid="detail-kpi-tile-v153"]')).map((tile) => ({ unit: tile.getAttribute("data-kpi-unit") || "", text: (tile.textContent || "").trim() })) : [];
  const h1 = (document.querySelector(".cdp-detail-hero h1")?.textContent || "").trim();
  const norm = (value) => value.replace(/[\s·:：()（）]/gu, "").toLowerCase();
  const headings = Array.from(document.querySelectorAll("h1, h2, h3")).map((node) => norm(node.textContent || ""));
  const slotRect = slot ? slot.getBoundingClientRect() : null;
  const mapInner = slot ? slot.querySelector('[data-testid="detail-location-map-v148"]') : null;
  return {
    verdict: frame?.getAttribute("data-contract-verdict") || null,
    axesVerdict: frame?.getAttribute("data-contract-axes") || null,
    blocks: blocks.map(describe),
    nestedTags: primary ? primary.querySelectorAll("[data-analysis-block] [data-analysis-block]").length : 0,
    chartsInPrimary: primary ? primary.querySelectorAll("svg:not(.chart-axes-v150 svg)").length : 0,
    readingNotes: (document.body.innerText || "").includes("자료 해석 안내") || Boolean(document.querySelector('[data-testid="public-reading-notes-v144"]')),
    kpiStatus: Boolean(document.querySelector('[data-testid="detail-kpi-status-v153"]')),
    tiles,
    titleCount: headings.filter((text) => text && text === norm(h1)).length,
    h1,
    split: primary?.hasAttribute("data-dl153-split") || false,
    slot: slotRect ? { top: Math.round(slotRect.top + window.scrollY), left: Math.round(slotRect.left), width: Math.round(slotRect.width), height: Math.round(slotRect.height), mapReady: Boolean(mapInner) } : null,
    scrollWidth: document.documentElement.scrollWidth,
    innerWidth: window.innerWidth,
    sourceLine: Boolean(document.querySelector('[data-testid="detail-source-line-v153"]')),
  };
};

function honesty(block) {
  const d = block.dom;
  switch (block.type) {
    case "line":
    case "stacked-area":
      return d.svgPaths > 0;
    case "region-bar":
    case "category-bar":
      return d.svgRects > 0 || d.htmlBars > 0;
    case "dumbbell":
      return d.svgCircles > 0 || d.htmlBars > 0;
    case "heatmap":
      return d.tables > 0 || d.svgRects > 0;
    case "timeline":
      return d.lists > 0 || d.times > 0 || d.tables > 0;
    case "comparison-table":
    case "sorted-table":
    case "table":
      return d.tables > 0 || d.articles > 0 || d.lists > 0;
    case "cards-list":
      return d.articles > 0 || d.lists > 0 || d.tables > 0;
    case "status-note":
    case "note":
      return d.svgs === 0;
    default:
      return false;
  }
}

async function checkElement(context, row) {
  const record = { elementId: row.elementId, archetype: row.archetype, status: row.status, expected: row.primary, checks: {}, evidence: {}, issues: [] };
  const errors = [];
  const page = await context.newPage();
  page.on("console", (message) => {
    const text = message.text();
    if (message.type() === "error" || text.includes("[v153-contract]")) errors.push(text.slice(0, 240));
  });
  page.on("pageerror", (error) => errors.push(`pageerror: ${String(error).slice(0, 200)}`));
  try {
    await page.setViewportSize({ width: 1440, height: 1000 });
    await openDetail(page, row.elementId, errors);
    const wide = await page.evaluate(readScreen);
    record.evidence.wide = { verdict: wide.verdict, axesVerdict: wide.axesVerdict, blocks: wide.blocks.map((b) => ({ type: b.type, rank: b.rank, top: b.top, left: b.left, width: b.width, axes: b.axes })), slot: wide.slot, split: wide.split, tiles: wide.tiles, titleCount: wide.titleCount, nestedTags: wide.nestedTags };
    const first = wide.blocks[0] || null;
    record.checks.primaryTypeMatch = Boolean(first) && first.type === row.primary.type;
    if (!first) record.issues.push("no tagged block in the primary section");
    else if (first.type !== row.primary.type) record.issues.push(`first block "${first.type}" ≠ contract "${row.primary.type}"`);
    const ranks = wide.blocks.map((b) => b.rank);
    record.checks.rankOrder = ranks.length > 0 && ranks.every((rank, index) => rank === String(index + 1));
    if (!record.checks.rankOrder) record.issues.push(`ranks ${JSON.stringify(ranks)}`);
    if (AXIS_TYPES.has(row.primary.type)) {
      const axes = first?.axes || null;
      const expectedUnit = displayUnit(row.primary.unit);
      const unitOk = axes ? (axes.unit === "unreported" ? !expectedUnit || expectedUnit === "원자료 미기재" : axes.unit === expectedUnit) : false;
      record.checks.axesMatch = Boolean(axes) && axisMatches(row.primary.xAxis, axes.x) && axisMatches(row.primary.yAxis, axes.y) && unitOk;
      if (!record.checks.axesMatch) record.issues.push(`axes ${JSON.stringify(axes)} ≠ ${JSON.stringify({ x: row.primary.xAxis, y: row.primary.yAxis, unit: expectedUnit })}`);
    } else {
      record.checks.axesMatch = null;
    }
    record.checks.blockHonesty = Boolean(first) && honesty(first);
    if (first && !honesty(first)) record.issues.push(`tag "${first.type}" not supported by DOM ${JSON.stringify(first.dom)}`);
    record.checks.readingNotesAbsent = !wide.readingNotes;
    if (wide.readingNotes) record.issues.push("자료 해석 안내 present");
    record.checks.statusNoteNoChart = STATUS_IDS.has(row.elementId) ? wide.chartsInPrimary === 0 : null;
    if (record.checks.statusNoteNoChart === false) record.issues.push(`status screen draws ${wide.chartsInPrimary} chart(s)`);
    record.checks.policyNoNumericChart = row.archetype === "policy-document" ? Boolean(first) && !NUMERIC_TYPES.has(first.type) : null;
    if (record.checks.policyNoNumericChart === false) record.issues.push(`policy screen opens on "${first?.type}"`);
    // The unit is stated on the tile; the visible text may expand it ("USD" → "미국달러").
    const tilesOk = wide.tiles.every((tile) => tile.unit && tile.text.trim().length > tile.unit.length);
    record.checks.kpiRow = STATUS_IDS.has(row.elementId)
      ? wide.tiles.length === 0 && wide.kpiStatus
      : wide.tiles.length >= 3 && wide.tiles.length <= 4 && tilesOk;
    if (!record.checks.kpiRow) record.issues.push(`kpi tiles ${wide.tiles.length}${tilesOk ? "" : " (unit missing)"}${STATUS_IDS.has(row.elementId) && !wide.kpiStatus ? " status line missing" : ""}`);
    record.checks.titleOnce = wide.titleCount === 1;
    if (!record.checks.titleOnce) record.issues.push(`title stated ${wide.titleCount}×`);
    record.checks.sourceLine = wide.sourceLine;
    if (!wide.sourceLine) record.issues.push("source line missing");
    record.checks.nestedTags = wide.nestedTags === 0 ? true : null;
    if (wide.nestedTags > 0) record.evidence.nestedTagCount = wide.nestedTags;
    // Map placement: beside the first block at 1440px, between first and second at 390px.
    if (row.mapRole === "beside-primary") {
      const beside = Boolean(first && wide.slot && wide.split && wide.slot.left > first.left + first.width - 8 && Math.abs(wide.slot.top - first.top) < Math.max(160, first.height));
      if (!wide.slot?.mapReady) record.evidence.mapNote = "small map not rendered within the wait";
      await page.setViewportSize({ width: 390, height: 900 });
      await page.waitForTimeout(500);
      const narrow = await page.evaluate(readScreen);
      const f2 = narrow.blocks[0];
      const s2 = narrow.blocks[1];
      const between = Boolean(f2 && narrow.slot && narrow.slot.top >= f2.top + f2.height - 4 && (!s2 || narrow.slot.top <= s2.top + 4));
      record.checks.mapPlacement = beside && between;
      record.evidence.narrow = { slot: narrow.slot, first: f2 ? { type: f2.type, top: f2.top, height: f2.height } : null, second: s2 ? { type: s2.type, top: s2.top } : null };
      if (!beside) record.issues.push(`map not beside first block at 1440 ${JSON.stringify({ slot: wide.slot, first: first && { left: first.left, width: first.width, top: first.top, height: first.height }, split: wide.split })}`);
      if (!between) record.issues.push(`map not between blocks at 390 ${JSON.stringify(record.evidence.narrow)}`);
    } else {
      record.checks.mapPlacement = null;
    }
    await page.setViewportSize({ width: 320, height: 800 });
    await page.waitForTimeout(400);
    const tiny = await page.evaluate(readScreen);
    record.checks.overflow320 = tiny.scrollWidth <= tiny.innerWidth + 1;
    record.evidence.overflow320 = tiny.scrollWidth - tiny.innerWidth;
    if (!record.checks.overflow320) record.issues.push(`320px overflow ${tiny.scrollWidth - tiny.innerWidth}px`);
  } catch (error) {
    record.issues.push(`runtime: ${(error instanceof Error ? error.message : String(error)).split("\n")[0].slice(0, 200)}`);
  } finally {
    await page.close().catch(() => null);
  }
  record.checks.console = errors.length === 0;
  if (errors.length) record.issues.push(`console: ${errors[0]}`);
  record.evidence.console = errors.slice(0, 5);
  record.pass = Object.values(record.checks).every((value) => value !== false);
  return record;
}

const results = [];
const queue = [...rows];
await Promise.all(
  Array.from({ length: WORKERS }, async () => {
    const context = await browser.newContext({ locale: "ko-KR", viewport: { width: 1440, height: 1000 } });
    while (queue.length) {
      const row = queue.shift();
      const record = await checkElement(context, row);
      results.push(record);
      process.stdout.write(`${record.elementId} ${record.pass ? "ok" : "FAIL"} ${record.expected.type}${record.issues.length ? ` | ${record.issues.join("; ").slice(0, 200)}` : ""}\n`);
    }
    await context.close();
  })
);
await browser.close();
await server.close();

results.sort((a, b) => a.elementId.localeCompare(b.elementId));
const tally = (key) => ({ pass: results.filter((r) => r.checks[key] === true).length, fail: results.filter((r) => r.checks[key] === false).length, notApplicable: results.filter((r) => r.checks[key] === null || r.checks[key] === undefined).length });
const failed = results.filter((r) => !r.pass);
const summary = {
  generatedAt: new Date().toISOString(),
  build: BUILD,
  elements: results.length,
  pass: results.length - failed.length,
  fail: failed.length,
  failedIds: failed.map((r) => r.elementId),
  byStatus: { standard: results.filter((r) => r.status === "standard").length, preserved: results.filter((r) => r.status === "preserved").length, exception: results.filter((r) => r.status === "exception").length },
  exceptionIds: results.filter((r) => r.status === "exception").map((r) => r.elementId),
  checks: Object.fromEntries(["primaryTypeMatch", "rankOrder", "axesMatch", "blockHonesty", "readingNotesAbsent", "statusNoteNoChart", "policyNoNumericChart", "kpiRow", "titleOnce", "sourceLine", "mapPlacement", "overflow320", "console"].map((key) => [key, tally(key)])),
};
writeFileSync(OUT, `${JSON.stringify({ summary, results }, null, 2)}\n`);
const md = [
  `# 상세 계약 QA V153-D1 (${summary.generatedAt})`,
  "",
  `- 대상 ${summary.elements}개 · 통과 ${summary.pass} · 실패 ${summary.fail} · 예외 행 ${summary.byStatus.exception}개(${summary.exceptionIds.join(", ")})`,
  ...Object.entries(summary.checks).map(([key, value]) => `- ${key}: 통과 ${value.pass} · 실패 ${value.fail} · 해당 없음 ${value.notApplicable}`),
  "",
  "| ID | 계약 1순위 | 첫 블록 | 판정 | 문제 |",
  "|---|---|---|---|---|",
  ...results.map((r) => `| ${r.elementId} | ${r.expected.type} | ${r.evidence.wide?.blocks?.[0]?.type || "—"} | ${r.pass ? "통과" : "실패"} | ${r.issues.join("; ").replace(/\|/gu, "／").slice(0, 220)} |`),
  "",
].join("\n");
writeFileSync(OUT.replace(/\.json$/u, ".md"), `${md}\n`);
console.log(JSON.stringify({ elements: summary.elements, pass: summary.pass, fail: summary.fail, failedIds: summary.failedIds }));
process.exitCode = failed.length ? 1 : 0;
