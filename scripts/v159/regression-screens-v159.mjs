#!/usr/bin/env node
/**
 * V159 regression screens: the analysis section before and after the
 * template routing, element by element.
 *
 * Two production builds are served side by side (the pre-V159 base and the
 * candidate). For each element the `public-analysis-primary` section is
 * captured at 1440px with the map slot hidden (external tiles are noise) and
 * animations off; scripts/v159/compare_screens_v159.py then counts differing
 * pixels. Tolerance: a pixel differs when any channel moves by more than 16;
 * a screen passes at <= 0.5% differing pixels and the same size.
 *
 * Usage:
 *   node scripts/v159/regression-screens-v159.mjs --base tmp/build-v159-base --new tmp/build-v159-review
 *        [--ids A-016,D-011] [--workers 3] [--out tmp/v159-regression]
 */
import { mkdirSync, writeFileSync, readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
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
const BASE_BUILD = resolve(ROOT, opt("--base", "tmp/build-v159-base"));
const NEW_BUILD = resolve(ROOT, opt("--new", "tmp/build-v159-review"));
const OUT = resolve(ROOT, opt("--out", "tmp/v159-regression"));
const WORKERS = Number(opt("--workers", "3"));
const REPORT = resolve(ROOT, opt("--report", "reports/v159/regression-v159.json"));
const contract = JSON.parse(readFileSync(resolve(ROOT, "src/data/visualization/publicVisualizationContractV153.json"), "utf8")).rows;
const ONLY = opt("--ids", null) ? opt("--ids").split(",").map((item) => item.trim()) : null;
const ids = contract.map((row) => row.elementId).filter((id) => !ONLY || ONLY.includes(id));

const STYLE = `
  *, *::before, *::after { transition: none !important; animation: none !important; caret-color: transparent !important; }
  .dl153-map-slot { visibility: hidden !important; }
`;

async function capture(context, baseUrl, elementId, file) {
  const page = await context.newPage();
  try {
    await page.goto(`${baseUrl}/?view=data&country=VNM&element=${elementId}#element-detail`, { waitUntil: "domcontentloaded", timeout: scaledTimeoutMsV150(60_000) });
    await page.waitForFunction(() => {
      const root = document.querySelector('[data-testid="public-analysis-root"]');
      return root && ["ready", "empty"].includes(root.getAttribute("data-analysis-state") || "") && document.querySelectorAll('[data-testid="public-analysis-pending"]').length === 0;
    }, null, { timeout: scaledTimeoutMsV150(45_000) });
    await page.waitForFunction(() => document.querySelector('[data-testid="detail-analysis-frame-v153"]')?.getAttribute("data-contract-verdict") !== null, null, { timeout: scaledTimeoutMsV150(15_000) }).catch(() => null);
    await page.addStyleTag({ content: STYLE });
    await page.waitForTimeout(500);
    const primary = page.locator('[data-testid="public-analysis-primary"]').first();
    await primary.screenshot({ path: file, animations: "disabled" });
    return true;
  } catch (error) {
    return String(error).slice(0, 200);
  } finally {
    await page.close();
  }
}

mkdirSync(resolve(OUT, "base"), { recursive: true });
mkdirSync(resolve(OUT, "new"), { recursive: true });
const baseServer = await startStaticBuildServer(BASE_BUILD, { port: 4361 });
const newServer = await startStaticBuildServer(NEW_BUILD, { port: 4362 });
const browser = await chromium.launch(process.env.V125_BROWSER_EXECUTABLE ? { executablePath: process.env.V125_BROWSER_EXECUTABLE } : {});
const errors = {};
const queue = [...ids];
async function worker() {
  const context = await browser.newContext({ locale: "ko-KR", viewport: { width: 1440, height: 1000 }, deviceScaleFactor: 1 });
  while (queue.length) {
    const id = queue.shift();
    const a = await capture(context, baseServer.url.replace(/\/$/u, ""), id, resolve(OUT, "base", `${id}.png`));
    const b = await capture(context, newServer.url.replace(/\/$/u, ""), id, resolve(OUT, "new", `${id}.png`));
    if (a !== true || b !== true) errors[id] = { base: a === true ? null : a, new: b === true ? null : b };
    process.stdout.write(`${id} ${a === true && b === true ? "captured" : "error"}\n`);
  }
  await context.close();
}
await Promise.all(Array.from({ length: WORKERS }, worker));
await browser.close();
await baseServer.close?.();
await newServer.close?.();

const compare = spawnSync(process.platform === "win32" ? "python" : "python3", [resolve(ROOT, "scripts/v159/compare_screens_v159.py"), OUT, ...ids], { encoding: "utf8", env: { ...process.env, PYTHONIOENCODING: "utf-8" } });
if (compare.status !== 0) {
  console.error(compare.stderr);
  process.exit(1);
}
const results = JSON.parse(compare.stdout);
for (const [id, error] of Object.entries(errors)) results[id] = { ...(results[id] || {}), captureError: error, pass: false };
const failed = Object.entries(results).filter(([, item]) => !item.pass).map(([id]) => id);
mkdirSync(dirname(REPORT), { recursive: true });
writeFileSync(REPORT, `${JSON.stringify({ generatedAt: new Date().toISOString(), tolerance: { channelDelta: 16, maxDiffRatio: 0.005, sameSize: true }, compared: ids.length, pass: ids.length - failed.length, failedIds: failed, results }, null, 2)}\n`);
console.log(JSON.stringify({ compared: ids.length, pass: ids.length - failed.length, failedIds: failed }));
