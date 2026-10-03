#!/usr/bin/env node
/**
 * P8-2 (지도 12): 1440px captures for the PR report - the home counts and each of
 * the twelve elements' detail page, against one production build. Run once on the
 * build before the change and once after; the map captures come from
 * `qa:map:v138 --layers … --shots`.
 *
 *   node scripts/v157-2/capture-map12-v157-2.mjs --build <dir> --out <dir> [--port 4352]
 */
import { mkdirSync } from "node:fs";
import { resolve } from "node:path";
import { chromium } from "playwright";
import { startStaticBuildServer } from "../v125/browser-runtime.mjs";

const ROOT = resolve(import.meta.dirname, "../..");
const argv = process.argv.slice(2);
const opt = (name, fallback) => {
  const index = argv.indexOf(name);
  return index < 0 ? fallback : argv[index + 1];
};
const BUILD = resolve(ROOT, opt("--build", "build"));
const OUT = resolve(ROOT, opt("--out", "tmp/map12-captures"));
const PORT = Number(opt("--port", "4352"));
const IDS = ["A-013", "A-022", "B-002", "B-024", "B-035", "B-036", "B-044", "B-046", "B-047", "C-003", "C-006", "C-017"];
mkdirSync(OUT, { recursive: true });

const server = await startStaticBuildServer(BUILD, { port: PORT });
const base = server.url.replace(/\/$/u, "");
const browser = await chromium.launch();
const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, locale: "ko-KR" });
const page = await context.newPage();
const result = { home: null, details: [] };

await page.goto(`${base}/`, { waitUntil: "domcontentloaded" });
await page.waitForFunction(() => /지도 제공 항목\s*\d+개/u.test(document.body.innerText), null, { timeout: 60000 });
result.home = await page.evaluate(() => document.body.innerText.match(/지도 제공 항목\s*(\d+)개/u)?.[1] || null);
await page.screenshot({ path: resolve(OUT, "home-1440.png") });

for (const id of IDS) {
  // The same route and readiness signals as qa:detail-contract:v153.
  await page.goto(`${base}/?view=data&country=VNM&element=${id}#element-detail`, { waitUntil: "domcontentloaded" });
  await page
    .waitForFunction(() => {
      const root = document.querySelector('[data-testid="public-analysis-root"]');
      return root && ["ready", "empty"].includes(root.getAttribute("data-analysis-state") || "");
    }, null, { timeout: 60000 })
    .catch(() => null);
  await page
    .waitForFunction(
      () => !document.querySelector('[data-testid="detail-map-slot-v153"]') || document.querySelector('[data-testid="detail-location-map-v148"]'),
      null,
      { timeout: 30000 }
    )
    .catch(() => null);
  await page.waitForTimeout(1500);
  await page.screenshot({ path: resolve(OUT, `${id.toLowerCase()}-detail-1440.png`) });
  const slot = page.locator('[data-testid="detail-map-slot-v153"]').first();
  const mapSlot = (await slot.count()) > 0;
  if (mapSlot) {
    await slot.scrollIntoViewIfNeeded();
    await page.waitForTimeout(1500);
    await page.screenshot({ path: resolve(OUT, `${id.toLowerCase()}-detail-map-1440.png`) });
  }
  result.details.push({ id, mapSlot });
}

await browser.close();
await server.close();
process.stdout.write(`${JSON.stringify(result)}\n`);
