#!/usr/bin/env node
/**
 * V153-D1 screen check: representative detail screens at six widths in real
 * Chromium against a production build - ready, no horizontal overflow, no
 * console error, the frame's contract verdict, the first block's type and
 * where the map slot landed - with a screenshot per width.
 *
 *   node scripts/v153/d1-screens-v153.mjs [--build build] [--port 4360]
 *       [--ids A-016,A-023,...] [--out output/v153-d1]
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
const BUILD = resolve(ROOT, opt("--build", "build"));
const PORT = Number(opt("--port", "4360"));
const IDS = (opt("--ids", "A-016,A-023,B-004,B-023,B-033,B-046,C-009,C-012,E-006,C-020") || "").split(",").map((s) => s.trim()).filter(Boolean);
const OUT = resolve(ROOT, opt("--out", "output/v153-d1"));
const WIDTHS = [320, 390, 768, 1024, 1440, 1920];
mkdirSync(OUT, { recursive: true });

const server = await startStaticBuildServer(BUILD, { port: PORT });
const base = server.url.replace(/\/$/u, "");
const browser = await chromium.launch();
const results = [];

for (const elementId of IDS) {
  for (const width of WIDTHS) {
    const context = await browser.newContext({ viewport: { width, height: 1000 }, locale: "ko-KR" });
    const page = await context.newPage();
    const errors = [];
    page.on("console", (message) => { if (message.type() === "error" || message.text().includes("[v153-contract]")) errors.push(message.text().slice(0, 200)); });
    page.on("pageerror", (error) => errors.push(`pageerror: ${String(error).slice(0, 200)}`));
    const record = { elementId, width, ready: false, overflow: null, errors, verdict: null, firstBlock: null, mapSlot: null, screenshot: null };
    try {
      await page.goto(`${base}/?view=data&country=VNM&element=${elementId}#element-detail`, { waitUntil: "domcontentloaded", timeout: 60000 });
      await page.waitForFunction(() => {
        const root = document.querySelector('[data-testid="public-analysis-root"]');
        return root && ["ready", "empty"].includes(root.getAttribute("data-analysis-state") || "") && document.querySelectorAll('[data-testid="public-analysis-pending"]').length === 0;
      }, null, { timeout: 45000 });
      await page.waitForFunction(() => !document.querySelector('[data-testid="detail-map-slot-v153"]') || document.querySelector('[data-testid="detail-location-map-v148"]'), null, { timeout: 30000 }).catch(() => null);
      await page.waitForTimeout(1500);
      const state = await page.evaluate(() => {
        const frame = document.querySelector('[data-testid="detail-analysis-frame-v153"]');
        const first = document.querySelector('[data-testid="public-analysis-primary"] [data-analysis-rank="1"]');
        const slot = document.querySelector('[data-testid="detail-map-slot-v153"]');
        const rect = (el) => { if (!el) return null; const r = el.getBoundingClientRect(); return { top: Math.round(r.top + window.scrollY), left: Math.round(r.left), width: Math.round(r.width), height: Math.round(r.height) }; };
        return {
          overflow: document.documentElement.scrollWidth - window.innerWidth,
          verdict: frame?.getAttribute("data-contract-verdict") || null,
          axes: frame?.getAttribute("data-contract-axes") || null,
          firstBlock: first ? { type: first.getAttribute("data-analysis-block"), rect: rect(first) } : null,
          mapSlot: slot ? rect(slot) : null,
          kpi: document.querySelectorAll('[data-testid="detail-kpi-tile-v153"]').length,
        };
      });
      Object.assign(record, { ready: true, overflow: state.overflow, verdict: state.verdict, axes: state.axes, firstBlock: state.firstBlock, mapSlot: state.mapSlot, kpi: state.kpi });
      const shot = resolve(OUT, `${elementId}-${width}.png`);
      await page.screenshot({ path: shot, fullPage: true });
      record.screenshot = shot;
    } catch (error) {
      record.errors.push(`runtime: ${String(error).slice(0, 200)}`);
    }
    results.push(record);
    process.stdout.write(`${elementId} ${width}px ready=${record.ready} overflow=${record.overflow} verdict=${record.verdict}/${record.axes} first=${record.firstBlock?.type} map=${record.mapSlot ? `${record.mapSlot.left},${record.mapSlot.top}` : "-"} kpi=${record.kpi} errors=${record.errors.length}\n`);
    await context.close();
  }
}
await browser.close();
await server.close();
const failed = results.filter((r) => !r.ready || r.overflow > 0 || r.errors.length > 0 || (r.verdict && r.verdict !== "match"));
const summary = { generatedAt: new Date().toISOString(), build: BUILD, ids: IDS, widths: WIDTHS, screens: results.length, failed: failed.length, failedKeys: failed.map((r) => `${r.elementId}@${r.width}`) };
writeFileSync(resolve(OUT, "d1-screens-v153.json"), `${JSON.stringify({ summary, results }, null, 2)}\n`);
console.log(JSON.stringify(summary));
process.exit(failed.length ? 1 : 0);
