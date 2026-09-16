/**
 * Card → detail analysis QA for the 152 public datasets (V140).
 *
 * For every dataset, against the local build (default) or a deployed origin:
 *
 *   screenLoaded          the detail route answers, the analysis root reaches
 *                         `ready`, no lazy placeholder is left, no console
 *                         error, no failed JSON/JS/geometry request, and no
 *                         HTML answered for a JSON asset
 *   cardSummaryVerified   the number the finder card leads with is on the
 *                         detail screen, in the same measure and year (the
 *                         card's own selection is handed over), within
 *                         rounding
 *   detailAnalysisFit     the detail kept the card's selection (measure, year
 *                         or period, region) instead of opening on something
 *                         else
 *   controlsVerified      every analysis control that offers a choice changes
 *                         what the primary analysis shows
 *   tableValuesVerified   the headline number is also in the screen's table
 *   mapHandoffVerified    for map datasets, 지도에서 보기 opens the map with the
 *                         dataset drawn
 *
 * `ready` alone is never counted as a semantic pass: each field records what
 * was actually observed, and `remainingIssue` says what did not hold.
 *
 * Usage: node scripts/v140/analysis-qa-v140.mjs [--base-url URL] [--label name] [--only A-002,B-033] [--workers 3]
 */
import { chromium } from "playwright";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
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
const only = opt("--only") ? opt("--only").split(",").map((id) => id.trim()) : null;
const workers = Number(opt("--workers", 3));
const bypassSecret = opt("--bypass-secret", process.env.VERCEL_AUTOMATION_BYPASS_SECRET || null);
const bypassHeaders = bypassSecret ? { "x-vercel-protection-bypass": bypassSecret, "x-vercel-set-bypass-cookie": "true" } : {};
const OUT = resolve(PROJECT_ROOT, "reports/v140");
mkdirSync(OUT, { recursive: true });

const summaries = JSON.parse(readFileSync(resolve(PROJECT_ROOT, "public/data/vietnam/v2/home/card-summaries-v140.json"), "utf8")).cards;
const catalog = JSON.parse(readFileSync(resolve(PROJECT_ROOT, "public/data/vietnam/v2/catalog.json"), "utf8")).elements;
const mapIndex = JSON.parse(readFileSync(resolve(PROJECT_ROOT, "public/data/vietnam/v2/map-index.json"), "utf8")).layers;
const mapConnected = new Set(mapIndex.filter((layer) => layer.active !== false && layer.enabled !== false).map((layer) => layer.elementId));

const server = externalBase ? null : await startStaticBuildServer(resolve(PROJECT_ROOT, "build"));
const base = (externalBase || server.url).replace(/\/$/u, "");
const browser = await chromium.launch();

// ---------------------------------------------------------------- helpers
const clean = (value) => String(value || "").normalize("NFC").replace(/\s+/gu, " ").trim();

/** Every number a Korean/English formatted text holds, expanded from 억/만/천/10억/백만. */
function numbersIn(text) {
  const out = [];
  const re = /(-|−)?(\d[\d,]*(?:\.\d+)?)\s*(조|억|만|천|십억|10억|백만)?/gu;
  let match;
  while ((match = re.exec(text))) {
    const raw = Number(match[2].replace(/,/gu, ""));
    if (!Number.isFinite(raw)) continue;
    const sign = match[1] ? -1 : 1;
    const scale = { 억: 1e8, 만: 1e4, 천: 1e3, 십억: 1e9, "10억": 1e9, 백만: 1e6, 조: 1e12 }[match[3]] || 1;
    out.push(sign * raw * scale);
    if (scale !== 1) out.push(sign * raw);
  }
  return out;
}

/** The card's headline as a base number and the scales it may appear under on the detail. */
function headlineNumber(card) {
  const value = card.headline?.value || "";
  const nums = numbersIn(value);
  if (!nums.length) return null;
  // A range ("−1.10 ~ +0.01") is verified by its first bound.
  const first = nums[0];
  // Both the scaled and the plain reading of "7,364 십억": the detail may
  // print either.
  const candidates = new Set(nums.slice(0, 2));
  // 10억 USD on the card is USD on the detail; MW/ha/km stay as they are.
  if (/10억/u.test(card.headline.label || "") || /10억/u.test(value)) candidates.add(first * 1e9);
  if (/백만/u.test(card.headline.label || "") || /백만/u.test(value)) candidates.add(first * 1e6);
  return { first, candidates: [...candidates] };
}

function numberAppears(target, text, tolerance = 0.006) {
  const nums = numbersIn(text);
  return nums.some((n) => {
    if (target === 0) return n === 0;
    return Math.abs(n - target) / Math.abs(target) <= tolerance || Math.abs(n - target) < 0.006;
  });
}

function selectionParams(selection) {
  const params = new URLSearchParams();
  if (!selection) return params;
  if (selection.measure) params.set("measure", selection.measure);
  if (selection.sex) params.set("sex", selection.sex);
  if (selection.year !== null && selection.year !== undefined) params.set("year", String(selection.year));
  if (selection.period) params.set("period", selection.period);
  Object.entries(selection.dimensions || {}).forEach(([key, value]) => params.set(`dim.${key}`, value));
  return params;
}

const DETAIL_ROOT = '[data-testid="public-analysis-root"]';
const PRIMARY = '[data-testid="public-analysis-primary"]';

async function evaluateScreen(page) {
  return page.evaluate(() => {
    const tidy = (value) => String(value || "").normalize("NFC").replace(/\s+/gu, " ").trim();
    const root = document.querySelector('[data-testid="public-analysis-root"]');
    const primary = document.querySelector('[data-testid="public-analysis-primary"]');
    const state = root?.getAttribute("data-analysis-state") || null;
    const pending = document.querySelectorAll('[data-testid="public-analysis-pending"]').length;
    const selects = [...(primary?.querySelectorAll("select") || [])].map((select, index) => ({
      index,
      label: tidy(select.closest("label")?.querySelector("span")?.textContent || select.getAttribute("aria-label") || select.dataset.testid || `select-${index}`),
      options: select.options.length,
      value: select.value,
    }));
    const kpiText = tidy([...(primary?.querySelectorAll("strong, [data-portfolio-kpi]") || [])].map((node) => node.textContent).join(" "));
    // Tables: open every details and every 표로 보기 toggle so their text is
    // present, then read tables.
    document.querySelectorAll("details").forEach((details) => { details.open = true; });
    const tableText = tidy([...document.querySelectorAll("table")].map((table) => table.textContent).join(" "));
    return {
      state,
      pending,
      title: tidy(document.querySelector("h1")?.textContent),
      selects,
      primaryText: tidy(primary?.textContent),
      kpiText,
      tableText,
      bodyText: tidy(document.body.innerText).slice(0, 20000),
      url: location.search,
      mapButton: [...document.querySelectorAll("button, a")].some((node) => /지도에서 보기/u.test(node.textContent || "")),
    };
  });
}

async function waitReady(page) {
  await page.waitForSelector(DETAIL_ROOT, { timeout: 60_000 });
  await page.waitForFunction(() => {
    const root = document.querySelector('[data-testid="public-analysis-root"]');
    const state = root?.getAttribute("data-analysis-state");
    return (state === "ready" || state === "empty") && document.querySelectorAll('[data-testid="public-analysis-pending"]').length === 0;
  }, null, { timeout: 60_000 });
  await page.waitForTimeout(600);
}

async function checkElement(context, item) {
  const elementId = item.elementId;
  const card = summaries.find((entry) => entry.elementId === elementId) || null;
  const record = {
    elementId,
    title: item.elementLabel,
    kind: card?.kind || null,
    screenLoaded: false,
    cardSummaryVerified: null,
    detailAnalysisFit: null,
    controlsVerified: null,
    tableValuesVerified: null,
    mapHandoffVerified: null,
    remainingIssue: [],
    evidence: {},
  };
  const consoleErrors = [];
  const assetFailures = [];
  const page = await context.newPage();
  page.on("console", (message) => { if (message.type() === "error") consoleErrors.push(message.text().slice(0, 200)); });
  page.on("response", async (response) => {
    const url = response.url();
    if (!/\.(json|js|geojson|css)(\?|$)/u.test(url) && !/\/data\//u.test(url)) return;
    if (response.status() >= 400) assetFailures.push({ url: url.slice(-90), status: response.status() });
    else if (/\.json(\?|$)/u.test(url) && (response.headers()["content-type"] || "").includes("text/html")) assetFailures.push({ url: url.slice(-90), status: "html-for-json" });
  });
  try {
    const params = selectionParams(card?.selection);
    params.set("view", "data");
    params.set("country", "VNM");
    params.set("element", elementId);
    const url = `${base}/?${params.toString()}#element-detail`;
    const response = await page.goto(url, { waitUntil: "networkidle", timeout: 90_000 });
    if (!response || !response.ok()) record.remainingIssue.push(`route ${response?.status()}`);
    await waitReady(page);
    const screen = await evaluateScreen(page);
    // A 표로 보기 toggle renders its table on the next frame; read it after.
    const toggled = await page.evaluate(() => {
      const buttons = [...document.querySelectorAll("button")].filter((button) => /표로 보기/u.test(button.textContent || ""));
      buttons.forEach((button) => button.click());
      return buttons.length;
    });
    if (toggled) {
      await page.waitForTimeout(500);
      screen.tableText = clean(await page.evaluate(() => [...document.querySelectorAll("table")].map((table) => table.textContent).join(" ")));
      await page.evaluate(() => {
        [...document.querySelectorAll("button")].filter((button) => /차트로 보기/u.test(button.textContent || "")).forEach((button) => button.click());
      });
      await page.waitForTimeout(300);
    }
    record.evidence.state = screen.state;
    record.evidence.title = screen.title;
    record.evidence.url = decodeURIComponent(screen.url).slice(0, 220);
    record.evidence.selects = screen.selects.map((select) => `${select.label}(${select.options})`);
    record.screenLoaded = (screen.state === "ready" || screen.state === "empty") && screen.pending === 0 && consoleErrors.length === 0 && assetFailures.length === 0;
    if (consoleErrors.length) record.remainingIssue.push(`console: ${consoleErrors[0]}`);
    if (assetFailures.length) record.remainingIssue.push(`asset: ${JSON.stringify(assetFailures[0])}`);

    // ---- card summary on the detail
    if (card && card.kind !== "status") {
      const target = headlineNumber(card);
      if (!target) {
        record.cardSummaryVerified = null;
        record.evidence.cardSummary = "headline has no number";
      } else {
        const inPrimary = target.candidates.some((candidate) => numberAppears(candidate, screen.primaryText));
        const inBody = target.candidates.some((candidate) => numberAppears(candidate, screen.bodyText));
        record.cardSummaryVerified = inPrimary || inBody;
        record.evidence.cardSummary = `${card.headline.value} → ${inPrimary ? "primary" : inBody ? "screen" : "not found"}`;
        if (!record.cardSummaryVerified) record.remainingIssue.push(`card value ${card.headline.value} not on detail`);
        record.tableValuesVerified = target.candidates.some((candidate) => numberAppears(candidate, screen.tableText));
        record.evidence.table = record.tableValuesVerified ? "headline in a table" : "headline not in any table";
      }
    } else if (card?.kind === "status") {
      record.cardSummaryVerified = /제공하지 않|입력 예정|입력 양식|미수집|아직/u.test(screen.bodyText);
      record.evidence.cardSummary = "status screen";
      record.tableValuesVerified = null;
    }

    // ---- selection fit
    if (card?.selection) {
      const want = card.selection;
      const got = new URLSearchParams(screen.url);
      const mismatches = [];
      if (want.measure && got.get("measure") !== want.measure) mismatches.push(`measure ${got.get("measure")}`);
      if (want.year !== null && want.year !== undefined && got.get("year") !== String(want.year)) mismatches.push(`year ${got.get("year")}`);
      if (want.period && got.get("period") !== want.period) mismatches.push(`period ${got.get("period")}`);
      Object.entries(want.dimensions || {}).forEach(([key, value]) => {
        if (got.get(`dim.${key}`) !== value) mismatches.push(`dim.${key} ${got.get(`dim.${key}`)}`);
      });
      const hasSelection = Boolean(want.measure || want.year !== null || want.period || Object.keys(want.dimensions || {}).length);
      record.detailAnalysisFit = hasSelection ? mismatches.length === 0 : null;
      record.evidence.selection = hasSelection ? (mismatches.length ? `kept? no: ${mismatches.join(", ")}` : "kept") : "card carries no selection";
      if (mismatches.length) record.remainingIssue.push(`selection not kept: ${mismatches.join(", ")}`);
    }

    // ---- controls change the analysis
    const controls = screen.selects.filter((select) => select.options > 1).slice(0, 4);
    if (controls.length) {
      const results = [];
      // Each control is tried from the same starting state: the previous
      // control is put back before the next one is moved, so a filter that
      // emptied a list cannot make the next control look inert.
      const baseline = await page.evaluate(() => [...(document.querySelector('[data-testid="public-analysis-primary"]')?.querySelectorAll("select") || [])].map((select) => select.value));
      const restore = async (index) => {
        await page.evaluate(([i, value]) => {
          const select = document.querySelector('[data-testid="public-analysis-primary"]')?.querySelectorAll("select")[i];
          if (!select || select.value === value) return;
          const setter = Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, "value").set;
          setter.call(select, value);
          select.dispatchEvent(new Event("change", { bubbles: true }));
        }, [index, baseline[index]]);
        await page.waitForTimeout(400);
      };
      for (const control of controls) {
        const before = clean(await page.$eval(PRIMARY, (node) => node.innerText).catch(() => ""));
        const changed = await page.evaluate((index) => {
          const primary = document.querySelector('[data-testid="public-analysis-primary"]');
          const select = primary?.querySelectorAll("select")[index];
          if (!select) return null;
          const current = select.selectedIndex;
          const next = [...select.options].findIndex((option, i) => i !== current && option.value !== "");
          const target = next >= 0 ? next : (current === 0 ? 1 : 0);
          if (target === current || !select.options[target]) return null;
          const setter = Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, "value").set;
          setter.call(select, select.options[target].value);
          select.dispatchEvent(new Event("change", { bubbles: true }));
          return select.options[target].textContent;
        }, control.index);
        if (changed === null) { results.push({ control: control.label, tested: false }); continue; }
        await page.waitForTimeout(700);
        const after = clean(await page.$eval(PRIMARY, (node) => node.innerText).catch(() => ""));
        results.push({ control: control.label, to: clean(changed).slice(0, 40), changed: before !== after });
        await restore(control.index);
      }
      const tested = results.filter((r) => r.tested !== false);
      record.controlsVerified = tested.length > 0 && tested.every((r) => r.changed);
      record.evidence.controls = results;
      const dead = tested.filter((r) => !r.changed);
      if (dead.length) record.remainingIssue.push(`control without effect: ${dead.map((r) => r.control).join(", ")}`);
    } else {
      record.controlsVerified = null;
      record.evidence.controls = "no selectable control in the primary analysis";
    }

    // ---- map hand-off
    if (mapConnected.has(elementId)) {
      const clicked = await page.evaluate(() => {
        const button = [...document.querySelectorAll("button")].find((node) => /지도에서 보기/u.test(node.textContent || ""));
        if (!button) return false;
        button.click();
        return true;
      });
      if (!clicked) {
        record.mapHandoffVerified = false;
        record.remainingIssue.push("no 지도에서 보기 button");
      } else {
        const drawn = await page.waitForFunction((id) => document.querySelector(`.cdp-map-catalog-v138__item[data-map-element="${id}"]`)?.getAttribute("data-map-drawn") === "true", elementId, { timeout: 60_000 }).then(() => true).catch(() => false);
        const legend = drawn ? await page.$eval(".cdp-map-catalog-v138", (node) => Boolean(node)).catch(() => false) : false;
        record.mapHandoffVerified = drawn;
        record.evidence.map = drawn ? "layer drawn on the map" : "layer not drawn within 60s";
        if (!drawn) record.remainingIssue.push("map hand-off did not draw the layer");
        void legend;
      }
    } else {
      record.mapHandoffVerified = null;
      record.evidence.map = screen.mapButton ? "not a map dataset but shows a map button" : "not a map dataset";
      if (screen.mapButton) record.remainingIssue.push("map button on a dataset without a map layer");
    }
  } catch (error) {
    record.remainingIssue.push(`runtime: ${(error instanceof Error ? error.message : String(error)).split("\n")[0].slice(0, 160)}`);
  } finally {
    await page.close().catch(() => null);
  }
  return record;
}

// ---------------------------------------------------------------- run
const targets = catalog.filter((item) => !only || only.includes(item.elementId)).sort((a, b) => a.elementId.localeCompare(b.elementId));
const results = [];
const queue = [...targets];
await Promise.all(
  Array.from({ length: Math.max(1, workers) }, async () => {
    const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, extraHTTPHeaders: bypassHeaders });
    while (queue.length) {
      const item = queue.shift();
      const record = await checkElement(context, item);
      results.push(record);
      process.stdout.write(`${record.elementId} ${record.screenLoaded ? "ok" : "FAIL"} card=${record.cardSummaryVerified} fit=${record.detailAnalysisFit} ctrl=${record.controlsVerified} table=${record.tableValuesVerified} map=${record.mapHandoffVerified}${record.remainingIssue.length ? ` | ${record.remainingIssue.join("; ").slice(0, 120)}` : ""}\n`);
    }
    await context.close();
  })
);
await browser.close();
if (server) await server.close();

results.sort((a, b) => a.elementId.localeCompare(b.elementId));
const count = (key, value) => results.filter((r) => r[key] === value).length;
const summary = {
  label,
  base,
  generatedAt: new Date().toISOString(),
  elements: results.length,
  screenLoaded: count("screenLoaded", true),
  cardSummaryVerified: { pass: count("cardSummaryVerified", true), fail: count("cardSummaryVerified", false), notApplicable: count("cardSummaryVerified", null) },
  detailAnalysisFit: { pass: count("detailAnalysisFit", true), fail: count("detailAnalysisFit", false), notApplicable: count("detailAnalysisFit", null) },
  controlsVerified: { pass: count("controlsVerified", true), fail: count("controlsVerified", false), notApplicable: count("controlsVerified", null) },
  tableValuesVerified: { pass: count("tableValuesVerified", true), fail: count("tableValuesVerified", false), notApplicable: count("tableValuesVerified", null) },
  mapHandoffVerified: { pass: count("mapHandoffVerified", true), fail: count("mapHandoffVerified", false), notApplicable: count("mapHandoffVerified", null) },
  withRemainingIssues: results.filter((r) => r.remainingIssue.length).length,
};
writeFileSync(resolve(OUT, `analysis-qa-v140-${label}.json`), `${JSON.stringify({ summary, results }, null, 2)}\n`);
const md = [
  `# 카드 → 상세 분석 QA (V140) · ${label}`,
  "",
  `실행 ${summary.generatedAt} · ${base} · ${summary.elements}개`,
  "",
  `| 항목 | 통과 | 실패 | 해당 없음 |`,
  `| --- | ---: | ---: | ---: |`,
  `| screenLoaded | ${summary.screenLoaded} | ${summary.elements - summary.screenLoaded} | 0 |`,
  ...["cardSummaryVerified", "detailAnalysisFit", "controlsVerified", "tableValuesVerified", "mapHandoffVerified"].map((key) => `| ${key} | ${summary[key].pass} | ${summary[key].fail} | ${summary[key].notApplicable} |`),
  "",
  `잔여 문제가 있는 요소: ${summary.withRemainingIssues}개`,
  "",
  "| 요소 | 종류 | loaded | card | fit | controls | table | map | 잔여 문제 |",
  "| --- | --- | --- | --- | --- | --- | --- | --- | --- |",
  ...results.map((r) => `| ${r.elementId} | ${r.kind || ""} | ${r.screenLoaded ? "✓" : "✗"} | ${mark(r.cardSummaryVerified)} | ${mark(r.detailAnalysisFit)} | ${mark(r.controlsVerified)} | ${mark(r.tableValuesVerified)} | ${mark(r.mapHandoffVerified)} | ${r.remainingIssue.join("; ").replace(/\|/gu, "/")} |`),
  "",
].join("\n");
function mark(value) { return value === true ? "✓" : value === false ? "✗" : "–"; }
writeFileSync(resolve(OUT, `analysis-qa-v140-${label}.md`), md);
console.log(JSON.stringify(summary));
