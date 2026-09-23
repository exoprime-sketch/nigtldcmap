#!/usr/bin/env node
/**
 * V152 six-width overflow check (production build, real Chromium): home, the
 * detail screens that carry a mini map, and the big map with an icon layer.
 * Records document horizontal overflow (scrollWidth - clientWidth) at 320,
 * 390, 768, 1024, 1440 and 1920 px, and whether the mini map's controls stay
 * inside the map box.
 *
 *   node scripts/v152/responsive-v152.mjs --build <dir> [--ids A-023,C-025] [--port 4363]
 * Writes reports/v152/responsive-v152.json. Exit code 1 on any overflow.
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
const PORT = Number(opt("--port", "4363"));
const OUT = resolve(ROOT, opt("--out", "reports/v152/responsive-v152.json"));
const IDS = (opt("--ids", "A-023,A-024,B-004,B-023,B-033,C-025,E-018,B-021") || "").split(",").map((v) => v.trim()).filter(Boolean);
const WIDTHS = [320, 390, 768, 1024, 1440, 1920];

const screens = [
  { id: "home", url: "/", ready: '[data-testid="home-hero-map-v139"] [data-testid="minimap-v152"]' },
  ...IDS.map((id) => ({ id, url: `/?country=VNM&element=${id}#element-detail`, ready: '[data-testid="detail-map-slot-v153"] [data-testid="minimap-v152"]' })),
  { id: "map-A-023", url: "/?country=VNM&layers=A-023&primaryLayer=A-023&focusLayer=A-023&contextLayers=none#map", ready: '[data-testid="map-dynamic-legend"]' },
];

const server = await startStaticBuildServer(BUILD, { port: PORT });
const base = server.url.replace(/\/$/u, "");
const browser = await chromium.launch();
const report = { schema: "responsive-v152", generatedAt: new Date().toISOString(), build: BUILD.replace(ROOT, "."), rows: [], consoleErrors: [] };
try {
  for (const width of WIDTHS) {
    const context = await browser.newContext({ viewport: { width, height: 900 }, locale: "ko-KR" });
    const page = await context.newPage();
    page.on("console", (message) => {
      if (message.type() === "error") report.consoleErrors.push({ width, text: message.text().slice(0, 300) });
    });
    for (const screen of screens) {
      await page.goto(`${base}${screen.url}`, { waitUntil: "domcontentloaded" });
      let ready = true;
      try {
        await page.waitForSelector(screen.ready, { state: "attached", timeout: 60000 });
      } catch {
        ready = false;
      }
      await page.waitForTimeout(1200);
      const measured = await page.evaluate(() => {
        const doc = document.documentElement;
        const root = document.querySelector('[data-testid="minimap-v152"]');
        const controls = root?.querySelector(".minimap152__controls")?.getBoundingClientRect();
        const box = root?.getBoundingClientRect();
        return {
          overflow: doc.scrollWidth - doc.clientWidth,
          controlsInside: !root || !controls || !box ? null : controls.left >= box.left - 0.5 && controls.right <= box.right + 0.5,
        };
      });
      const row = { width, screen: screen.id, ready, ...measured, ok: ready && measured.overflow <= 0 && measured.controlsInside !== false };
      report.rows.push(row);
      if (!row.ok) console.log(`FAIL ${width} ${screen.id} overflow=${measured.overflow} controlsInside=${measured.controlsInside} ready=${ready}`);
    }
    await context.close();
    console.log(`width ${width} done`);
  }
} finally {
  await browser.close();
  await server.close();
}
report.summary = {
  checked: report.rows.length,
  failed: report.rows.filter((row) => !row.ok).map((row) => `${row.width}:${row.screen}`),
  consoleErrors: report.consoleErrors.length,
};
mkdirSync(dirname(OUT), { recursive: true });
writeFileSync(OUT, `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify({ type: "summary", ...report.summary, out: OUT.replace(ROOT, ".") }));
process.exit(report.summary.failed.length || report.summary.consoleErrors ? 1 : 0);
