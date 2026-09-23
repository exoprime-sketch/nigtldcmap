#!/usr/bin/env node
/**
 * V152 home LCP and first-load JS, before vs after (production builds, no
 * interaction). The mini map must not change the home's first paint: its
 * engine loads only on a reader's intent.
 *
 *   node scripts/v152/home-lcp-v152.mjs --before tmp/build-v152-before --after <dir> [--runs 5]
 * Writes reports/v152/home-lcp-v152.json.
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
const RUNS = Number(opt("--runs", "5"));
const OUT = resolve(ROOT, opt("--out", "reports/v152/home-lcp-v152.json"));
const builds = { before: resolve(ROOT, opt("--before", "tmp/build-v152-before")), after: resolve(ROOT, opt("--after", "build")) };

const browser = await chromium.launch();
const report = { schema: "home-lcp-v152", generatedAt: new Date().toISOString(), runs: RUNS, results: {} };
let port = 4371;
try {
  for (const [label, build] of Object.entries(builds)) {
    const server = await startStaticBuildServer(build, { port: port++ });
    const base = server.url.replace(/\/$/u, "");
    const samples = [];
    for (let run = 0; run < RUNS; run += 1) {
      const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, locale: "ko-KR" });
      const page = await context.newPage();
      const scripts = [];
      page.on("response", async (response) => {
        const url = response.url();
        if (!url.endsWith(".js")) return;
        const length = Number(response.headers()["content-length"] || 0) || (await response.body().catch(() => Buffer.alloc(0))).length;
        scripts.push({ name: url.replace(/^.*\/static\/js\//u, ""), bytes: length });
      });
      await page.addInitScript(() => {
        window.__v152Lcp = [];
        new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            window.__v152Lcp.push({ time: entry.startTime, size: entry.size, element: entry.element ? `${entry.element.tagName}.${String(entry.element.className || "").slice(0, 40)}` : null });
          }
        }).observe({ type: "largest-contentful-paint", buffered: true });
      });
      await page.goto(`${base}/`, { waitUntil: "load" });
      await page.waitForSelector('[data-testid="home-hero-map-v139"] svg', { timeout: 60000 }).catch(() => null);
      await page.waitForTimeout(3000);
      const lcp = await page.evaluate(() => {
        const entries = window.__v152Lcp || [];
        const last = entries[entries.length - 1] || null;
        return {
          last,
          engine: Boolean(document.querySelector(".maplibregl-map, .maplibregl-canvas")),
          miniMapState: document.querySelector('[data-testid="minimap-v152"]')?.getAttribute("data-minimap-state") || null,
        };
      });
      samples.push({
        lcpMs: lcp.last ? Math.round(lcp.last.time) : null,
        lcpElement: lcp.last?.element || null,
        engineLoaded: lcp.engine,
        miniMapState: lcp.miniMapState,
        jsBytes: scripts.reduce((sum, script) => sum + script.bytes, 0),
        scripts: scripts.map((script) => script.name).sort(),
      });
      await context.close();
    }
    const times = samples.map((sample) => sample.lcpMs).filter((value) => typeof value === "number").sort((a, b) => a - b);
    report.results[label] = {
      build: build.replace(ROOT, "."),
      medianLcpMs: times.length ? times[Math.floor(times.length / 2)] : null,
      samples,
    };
    await server.close();
    console.log(`${label}: median LCP ${report.results[label].medianLcpMs} ms`);
  }
} finally {
  await browser.close();
}
const before = report.results.before?.medianLcpMs;
const after = report.results.after?.medianLcpMs;
report.summary = {
  medianBeforeMs: before,
  medianAfterMs: after,
  changePct: before && after ? Number((((after - before) / before) * 100).toFixed(1)) : null,
  withinBudget: before && after ? Math.abs((after - before) / before) <= 0.05 : null,
  engineLoadedWithoutIntent: Object.values(report.results).some((result) => result.samples.some((sample) => sample.engineLoaded)),
};
mkdirSync(dirname(OUT), { recursive: true });
writeFileSync(OUT, `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify({ type: "summary", ...report.summary, out: OUT.replace(ROOT, ".") }));
