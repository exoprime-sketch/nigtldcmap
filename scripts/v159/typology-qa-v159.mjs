#!/usr/bin/env node
/**
 * V159 typology QA against a production build in real Chromium.
 *
 * Per element (152):
 *   - template: the analysis is wrapped by the template of the element's
 *     display type and structure (data-template / data-structure);
 *   - first block: the V153 frame's verdict is "match" - the first analysis
 *     block is the contract's primary type, and the contract carries the
 *     typology (align-contract-typology-v159 --check);
 *   - description: the hero states the short definition, and the '데이터 설명'
 *     area has 상세 설명 and 활용 방법, plus 활용 사례 when the element has cases;
 *   - decision points: the block is present, or hidden because no point
 *     could be computed (recorded, allowed);
 *   - status (⓪): the statement only - no chart in the analysis section;
 *   - 320px: no horizontal overflow.
 * Writes reports/v159/typology-qa-v159.json.
 *
 * Usage: node scripts/v159/typology-qa-v159.mjs [--build tmp/build-v159-review] [--ids A-001,B-003] [--workers 3]
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
const BUILD = resolve(ROOT, opt("--build", "tmp/build-v159-review"));
const OUT = resolve(ROOT, opt("--out", "reports/v159/typology-qa-v159.json"));
const WORKERS = Number(opt("--workers", "3"));
const ONLY = opt("--ids", null) ? opt("--ids").split(",").map((item) => item.trim()) : null;

const typology = JSON.parse(readFileSync(resolve(ROOT, "src/data/spec/datasetTypologyV159.json"), "utf8")).rows;
const cases = JSON.parse(readFileSync(resolve(ROOT, "src/data/spec/useCasesV159.json"), "utf8")).cases;
const caseCount = new Map();
for (const item of cases) caseCount.set(item.elementId, (caseCount.get(item.elementId) || 0) + 1);
const rows = typology.filter((row) => !ONLY || ONLY.includes(row.elementId));

const server = await startStaticBuildServer(BUILD, { port: 4363 });
const base = server.url.replace(/\/$/u, "");
const browser = await chromium.launch(process.env.V125_BROWSER_EXECUTABLE ? { executablePath: process.env.V125_BROWSER_EXECUTABLE } : {});

async function check(context, row) {
  const record = { elementId: row.elementId, displayType: row.displayType, structure: row.structure, checks: {}, issues: [] };
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (error) => errors.push(String(error).slice(0, 200)));
  try {
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.goto(`${base}/?view=data&country=VNM&element=${row.elementId}#element-detail`, { waitUntil: "domcontentloaded", timeout: scaledTimeoutMsV150(60_000) });
    await page.waitForFunction(() => {
      const root = document.querySelector('[data-testid="public-analysis-root"]');
      return root && ["ready", "empty"].includes(root.getAttribute("data-analysis-state") || "") && document.querySelectorAll('[data-testid="public-analysis-pending"]').length === 0;
    }, null, { timeout: scaledTimeoutMsV150(45_000) });
    await page.waitForFunction(() => document.querySelector('[data-testid="detail-analysis-frame-v153"]')?.getAttribute("data-contract-verdict") !== null, null, { timeout: scaledTimeoutMsV150(15_000) }).catch(() => null);
    // The description loads its own chunk.
    await page.waitForSelector('[data-testid="data-description-v159"]', { timeout: scaledTimeoutMsV150(15_000) }).catch(() => null);
    // Layer-based decision points (② elements) arrive after the map layer loads.
    if (row.displayType !== "U0") await page.waitForSelector('[data-testid="decision-points-v159"]', { timeout: scaledTimeoutMsV150(6_000) }).catch(() => null);
    await page.waitForTimeout(300);
    const screen = await page.evaluate(() => {
      const template = document.querySelector('[data-testid="template-v159"]');
      const frame = document.querySelector('[data-testid="detail-analysis-frame-v153"]');
      const primary = document.querySelector('[data-testid="public-analysis-primary"]');
      const description = document.querySelector('[data-testid="data-description-v159"]');
      return {
        template: template?.getAttribute("data-template") || null,
        structure: template?.getAttribute("data-structure") || null,
        variant: template?.getAttribute("data-template-variant") || null,
        verdict: frame?.getAttribute("data-contract-verdict") || null,
        firstBlock: frame?.getAttribute("data-contract-first-block") || null,
        shortDefinition: Boolean(document.querySelector('[data-testid="hero-short-definition-v159"]')?.textContent?.trim()),
        description: Boolean(description?.querySelector('[data-dd159-part="description"]')?.textContent?.trim()),
        usage: Boolean(description?.querySelector('[data-dd159-part="usage"]')?.textContent?.trim()),
        casesPart: Boolean(description?.querySelector('[data-dd159-part="cases"]')),
        casesCount: Number(description?.getAttribute("data-dd159-cases") || 0),
        decisionPoints: document.querySelector('[data-testid="decision-points-v159"]')?.querySelectorAll("dt").length ?? null,
        chartsInPrimary: primary ? primary.querySelectorAll("svg").length : 0,
        statusNote: Boolean(primary?.querySelector('[data-analysis-block="status-note"]')),
      };
    });
    record.evidence = screen;
    // '쓰는 데이터' chips: enabled only where the first chart draws the
    // series; one click must light a series up, inert chips must not act.
    record.chips = await page.evaluate(async () => {
      const chips = Array.from(document.querySelectorAll('[data-testid="data-description-v159"] button.dd159-chip'));
      const enabled = chips.filter((chip) => chip.getAttribute("aria-disabled") !== "true");
      const inert = chips.length - enabled.length;
      let highlightWorks = null;
      if (enabled.length) {
        enabled[0].click();
        await new Promise((resolveWait) => setTimeout(resolveWait, 150));
        highlightWorks = document.querySelectorAll('[data-testid="public-analysis-primary"] .is-highlighted').length > 0;
        enabled[0].click();
      }
      return { enabled: enabled.length, inert, highlightWorks };
    });
    if (record.chips.highlightWorks === false) record.issues.push("enabled chip highlighted nothing");
    const expectCases = caseCount.get(row.elementId) || 0;
    record.checks.template = screen.template === row.displayType && screen.structure === row.structure;
    record.checks.firstBlock = screen.verdict === "match";
    record.checks.description = screen.shortDefinition && screen.description && screen.usage && (expectCases === 0 || (screen.casesPart && screen.casesCount === expectCases));
    record.checks.decisionPoints = row.displayType === "U0" ? screen.decisionPoints === null : true;
    record.decisionPointsShown = screen.decisionPoints !== null;
    record.checks.status = row.displayType === "U0" ? screen.statusNote && screen.chartsInPrimary === 0 : true;
    await page.setViewportSize({ width: 320, height: 800 });
    await page.waitForTimeout(250);
    const overflow = await page.evaluate(() => Math.max(document.documentElement.scrollWidth, document.body.scrollWidth) - window.innerWidth);
    record.evidence.overflow320 = overflow;
    record.checks.overflow320 = overflow <= 0;
    record.checks.pageErrors = errors.length === 0;
    if (errors.length) record.issues.push(...errors);
  } catch (error) {
    record.issues.push(`runtime: ${String(error).slice(0, 200)}`);
    record.checks.runtime = false;
  } finally {
    await page.close();
  }
  for (const [name, ok] of Object.entries(record.checks)) if (!ok) record.issues.push(`check failed: ${name}`);
  record.pass = record.issues.length === 0;
  return record;
}

const queue = [...rows];
const results = [];
await Promise.all(
  Array.from({ length: WORKERS }, async () => {
    const context = await browser.newContext({ locale: "ko-KR" });
    while (queue.length) {
      const row = queue.shift();
      const record = await check(context, row);
      results.push(record);
      process.stdout.write(`${record.elementId} ${record.pass ? "ok" : `FAIL ${record.issues.join("; ")}`}\n`);
    }
    await context.close();
  })
);
await browser.close();
await server.close();
results.sort((a, b) => a.elementId.localeCompare(b.elementId));
const failedIds = results.filter((item) => !item.pass).map((item) => item.elementId);
const summary = {
  elements: results.length,
  pass: results.length - failedIds.length,
  fail: failedIds.length,
  failedIds,
  decisionPointsHidden: results.filter((item) => item.pass && !item.decisionPointsShown && item.displayType !== "U0").map((item) => item.elementId),
  decisionPointsShown: results.filter((item) => item.decisionPointsShown).length,
  chipHighlightElements: results.filter((item) => item.chips?.highlightWorks === true).map((item) => item.elementId),
  chipsEnabled: results.reduce((sum, item) => sum + (item.chips?.enabled || 0), 0),
  chipsInert: results.reduce((sum, item) => sum + (item.chips?.inert || 0), 0),
};
mkdirSync(dirname(OUT), { recursive: true });
writeFileSync(OUT, `${JSON.stringify({ generatedAt: new Date().toISOString(), build: BUILD, summary, results }, null, 2)}\n`);
console.log(JSON.stringify(summary));
if (failedIds.length) process.exitCode = 1;
