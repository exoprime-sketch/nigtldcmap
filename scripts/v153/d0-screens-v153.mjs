#!/usr/bin/env node
/**
 * V153-D0 screen check: the six detail screens this PR changed, at six
 * widths, in a real Chromium against a production build.
 *
 * Per element and width: the analysis root reached "ready", no horizontal
 * document overflow, no console error, no HTTP failure, the V153 block is
 * present, and the texts the fix promised are on the page (mineral names,
 * the 8/7 investor split, Korean-first PPP terms, Korean-first climate zones,
 * the facility card once a plant is selected). The finder's technology
 * filter is checked for exactly 38 options and a reload-safe URL.
 *
 *   node scripts/v153/d0-screens-v153.mjs [--build tmp/build-v153-review] [--port 4340]
 *       [--ids B-046,B-047,E-006,C-012,B-002,A-023] [--out reports/v153/screens]
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";
import { startStaticBuildServer } from "../v125/browser-runtime.mjs";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const argv = process.argv.slice(2);
const opt = (name, fallback) => {
  const index = argv.indexOf(name);
  return index < 0 ? fallback : argv[index + 1];
};
const BUILD = resolve(ROOT, opt("--build", "tmp/build-v153-review"));
const PORT = Number(opt("--port", "4340"));
const IDS = (opt("--ids", "B-046,B-047,E-006,C-012,B-002,A-023") || "").split(",").map((s) => s.trim()).filter(Boolean);
const OUT = resolve(ROOT, opt("--out", "reports/v153/screens"));
const WIDTHS = [320, 390, 768, 1024, 1440, 1920];
mkdirSync(OUT, { recursive: true });

/** What each screen must show, as substrings of the main text. */
const EXPECTED = {
  "B-046": { block: '[data-testid="mineral-resources-v153-b-046"]', texts: ["희토류", "텅스텐", "보크사이트", "안티모니", "확인 매장량", "54,000", "USGS 미수록", "코발트", "리튬"] },
  "B-047": { block: '[data-testid="mineral-resources-v153-b-047"]', texts: ["광산 생산량", "텅스텐", "주석", "11,000", "2024", "2025", "구리", "망간"] },
  "E-006": { block: '[data-testid="investor-network-v153"]', texts: ["베트남 소재 기관 · 8곳", "해외 소재(베트남 투자 실적) · 7곳", "Patamar Capital", "International Finance Corporation", "Ho Chi Minh City"] },
  "C-012": { block: '[data-testid="ppp-procurement-v153"]', texts: ["건설·운영·이전(BOT(Build-Operate-Transfer))", "법률 제64/2020/QH14호", "경쟁협상", "성·시별 PPP 사업 건수", "하노이(Ha Noi)"] },
  "B-002": { block: '[data-testid="climate-zone-v153"]', texts: ["온대·동계건조·고온하계(Cwa)", "열대사바나(Aw)", "열대몬순(Am)", "기후대별 점유 면적", "138,159", "2020"] },
  "A-023": { block: '[data-testid="power-plant-registry-summary-v138"]', texts: ["발전소 목록", "소재지(34개 기준)", "소유·운영"] },
};

const server = await startStaticBuildServer(BUILD, { port: PORT });
const base = server.url.replace(/\/$/u, "");
const browser = await chromium.launch();
const results = [];

async function loadDetail(page, elementId) {
  const errors = [];
  const failures = [];
  page.on("console", (message) => { if (message.type() === "error") errors.push(message.text().slice(0, 200)); });
  page.on("pageerror", (error) => errors.push(`pageerror: ${String(error).slice(0, 200)}`));
  page.on("response", (response) => { if (response.status() >= 400) failures.push(`${response.status()} ${response.url()}`); });
  await page.goto(`${base}/?view=data&country=VNM&element=${elementId}#element-detail`, { waitUntil: "domcontentloaded", timeout: 60000 });
  await page.waitForFunction(() => {
    const root = document.querySelector('[data-testid="public-analysis-root"]');
    return root && ["ready", "empty"].includes(root.getAttribute("data-analysis-state") || "");
  }, null, { timeout: 45000 });
  await page.waitForTimeout(1500);
  await page.waitForFunction(() => !document.querySelector('[data-testid="public-analysis-pending"]'), null, { timeout: 20000 }).catch(() => {});
  return { errors, failures };
}

for (const elementId of IDS) {
  const expected = EXPECTED[elementId] || { block: '[data-testid="public-analysis-root"]', texts: [] };
  for (const width of WIDTHS) {
    const context = await browser.newContext({ viewport: { width, height: 1000 }, locale: "ko-KR" });
    const page = await context.newPage();
    const row = { elementId, width, ready: false, overflow: null, blockPresent: false, missingTexts: [], consoleErrors: [], httpFailures: [], selectedCard: null, screenshot: null };
    try {
      const { errors, failures } = await loadDetail(page, elementId);
      row.ready = true;
      if (elementId === "A-023") {
        // Pick the first plant in the list so the card renders.
        const button = page.locator('[data-testid="power-plant-list-v148"] tbody button').first();
        if (await button.count()) {
          await button.click();
          await page.waitForSelector('[data-testid="power-plant-selected-v153"]', { timeout: 10000 }).catch(() => {});
          row.selectedCard = await page.evaluate(() => {
            const card = document.querySelector('[data-testid="power-plant-selected-v153"] [data-testid="facility-card-v153"]');
            if (!card) return null;
            return [...card.querySelectorAll(".facility153-row")].map((node) => `${node.querySelector("dt")?.textContent}: ${node.querySelector("dd")?.textContent}`.replace(/\s+/g, " ").trim());
          });
        }
      }
      const state = await page.evaluate((block) => {
        const main = document.querySelector("main") || document.body;
        const text = (main.innerText || "").replace(/\s+/g, " ");
        return {
          overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
          blockPresent: Boolean(document.querySelector(block)),
          text,
        };
      }, expected.block);
      row.overflow = state.overflow;
      row.blockPresent = state.blockPresent;
      row.missingTexts = expected.texts.filter((needle) => !state.text.includes(needle));
      row.consoleErrors = errors.filter((message) => !/favicon|tile|ResizeObserver/u.test(message));
      row.httpFailures = failures.filter((url) => !/tile|basemap|maptiler|openfreemap/u.test(url));
      if (width === 1440) {
        row.screenshot = `reports/v153/screens/${elementId}-1440.png`;
        await page.screenshot({ path: resolve(ROOT, row.screenshot), fullPage: true });
      }
    } catch (error) {
      row.failure = String(error).slice(0, 300);
    }
    row.pass = row.ready && row.overflow === 0 && row.blockPresent && row.missingTexts.length === 0 && row.consoleErrors.length === 0 && row.httpFailures.length === 0 && !row.failure;
    results.push(row);
    await context.close();
  }
}

// Finder: exactly 38 technology options, and a reload keeps the selection.
const finder = { options: null, selectedAfterReload: null, urlParam: null, pass: false };
{
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, locale: "ko-KR" });
  const page = await context.newPage();
  await page.goto(`${base}/?country=VNM#explorer`, { waitUntil: "domcontentloaded", timeout: 60000 });
  await page.waitForSelector("select.cdp-select", { state: "attached", timeout: 45000 });
  // The filter row may be collapsed at first paint; read and drive the
  // technology select through the DOM (React listens to the native change).
  const TECH_SELECT = "label:has(.cdp-field__label:text-is('기후기술')) select";
  const select = page.locator(TECH_SELECT).first();
  await select.waitFor({ state: "attached", timeout: 30000 });
  finder.options = (await select.locator("option").count()) - 1;
  await select.evaluate((node) => {
    const setter = Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, "value").set;
    setter.call(node, "07");
    node.dispatchEvent(new Event("change", { bubbles: true }));
  });
  await page.waitForTimeout(800);
  finder.urlParam = new URL(page.url()).searchParams.get("technology");
  await page.reload({ waitUntil: "domcontentloaded" });
  await page.locator(TECH_SELECT).first().waitFor({ state: "attached", timeout: 30000 });
  await page.waitForTimeout(800);
  finder.selectedAfterReload = await page.locator(TECH_SELECT).first().inputValue();
  finder.pass = finder.options === 38 && finder.urlParam === "07" && finder.selectedAfterReload === "07";
  await context.close();
}

await browser.close();
await server.close();
const summary = {
  screens: results.length,
  passed: results.filter((row) => row.pass).length,
  failed: results.filter((row) => !row.pass).map((row) => ({ elementId: row.elementId, width: row.width, overflow: row.overflow, missingTexts: row.missingTexts, consoleErrors: row.consoleErrors, httpFailures: row.httpFailures, failure: row.failure, blockPresent: row.blockPresent })),
  finder,
};
writeFileSync(resolve(OUT, "d0-screens-v153.json"), `${JSON.stringify({ schema: "v153-d0-screens-1", build: BUILD, widths: WIDTHS, summary, results }, null, 2)}\n`);
console.log(JSON.stringify(summary));
process.exit(summary.failed.length === 0 && finder.pass ? 0 : 1);
