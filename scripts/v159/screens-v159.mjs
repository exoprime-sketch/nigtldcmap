#!/usr/bin/env node
/**
 * V159 screens: the six representative detail screens for the contractor
 * handoff (one per display type) and the 320/390/768/1024/1440/1920px
 * overflow check on twelve screens (the six plus six former dedicated
 * structures now drawn as template variants).
 *
 * Usage: node scripts/v159/screens-v159.mjs [--build tmp/build-v159-review] [--out output/v159/screens]
 */
import { mkdirSync, writeFileSync } from "node:fs";
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
const OUT = resolve(ROOT, opt("--out", "output/v159/screens"));
const REPORT = resolve(ROOT, "reports/v159/screens-v159.json");

const REPRESENTATIVE = [
  ["U1", "A-003"],
  ["U2", "B-003"],
  ["U3", "A-018"],
  ["U4", "A-023"],
  ["U5", "D-022"],
  ["U6", "C-009"],
];
const ABSORBED = ["A-016", "D-011", "A-002", "E-012", "C-012", "B-002"];
const WIDTHS = [320, 390, 768, 1024, 1440, 1920];

mkdirSync(OUT, { recursive: true });
const server = await startStaticBuildServer(BUILD, { port: 4364 });
const base = server.url.replace(/\/$/u, "");
const browser = await chromium.launch(process.env.V125_BROWSER_EXECUTABLE ? { executablePath: process.env.V125_BROWSER_EXECUTABLE } : {});
const context = await browser.newContext({ locale: "ko-KR", deviceScaleFactor: 1 });

async function open(page, elementId) {
  await page.goto(`${base}/?view=data&country=VNM&element=${elementId}#element-detail`, { waitUntil: "domcontentloaded", timeout: scaledTimeoutMsV150(60_000) });
  await page.waitForFunction(() => {
    const root = document.querySelector('[data-testid="public-analysis-root"]');
    return root && ["ready", "empty"].includes(root.getAttribute("data-analysis-state") || "") && document.querySelectorAll('[data-testid="public-analysis-pending"]').length === 0;
  }, null, { timeout: scaledTimeoutMsV150(45_000) });
  await page.waitForSelector('[data-testid="data-description-v159"]', { timeout: scaledTimeoutMsV150(15_000) }).catch(() => null);
  await page.waitForFunction(() => !document.querySelector('[data-testid="detail-map-slot-v153"]') || document.querySelector('[data-testid="detail-location-map-v148"]'), null, { timeout: scaledTimeoutMsV150(30_000) }).catch(() => null);
  await page.waitForTimeout(1500);
}

const report = { screenshots: [], overflow: [] };
const page = await context.newPage();
for (const [type, id] of REPRESENTATIVE) {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await open(page, id);
  // Open the use-case disclosure so the handoff shows the case cards.
  await page.locator('[data-dd159-part="cases"] button[aria-expanded="false"]').first().click().catch(() => null);
  await page.waitForTimeout(300);
  const file = resolve(OUT, `${type}-${id}.png`);
  await page.screenshot({ path: file, fullPage: true });
  report.screenshots.push({ type, elementId: id, file: file.replace(`${ROOT}\\`, "").replace(/\\/gu, "/") });
  process.stdout.write(`shot ${type} ${id}\n`);
}
for (const id of [...REPRESENTATIVE.map(([, id]) => id), ...ABSORBED]) {
  for (const width of WIDTHS) {
    await page.setViewportSize({ width, height: 900 });
    await open(page, id);
    const overflow = await page.evaluate(() => Math.max(document.documentElement.scrollWidth, document.body.scrollWidth) - window.innerWidth);
    report.overflow.push({ elementId: id, width, overflow });
  }
  process.stdout.write(`overflow ${id} ${report.overflow.filter((row) => row.elementId === id).map((row) => row.overflow).join(",")}\n`);
}
await browser.close();
await server.close();
const failing = report.overflow.filter((row) => row.overflow > 0);
report.summary = { screenshots: report.screenshots.length, overflowChecks: report.overflow.length, overflowFailures: failing };
mkdirSync(dirname(REPORT), { recursive: true });
writeFileSync(REPORT, `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify(report.summary));
if (failing.length) process.exitCode = 1;
