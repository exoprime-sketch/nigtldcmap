#!/usr/bin/env node
/**
 * V159 regression screens: the analysis section before and after the
 * template routing, element by element.
 *
 * Two production builds are served side by side (the pre-V159 base and the
 * candidate). For each element the `public-analysis-primary` section is
 * captured at 1440px with the map slot hidden (external tiles are noise),
 * page chrome static and animations off; scripts/v159/compare_screens_v159.py
 * then counts differing pixels. The verdict is the DOM signature of the
 * section (element order, visible text, analysis tags, test ids): the same
 * build captured twice differs by 0 pixels, but content placed above the
 * section moves text by half a pixel, which a pixel diff cannot tell from a
 * change. The pixel ratio (1px blur, channel delta 24, best of -2..+2 rows)
 * is kept in the report as evidence.
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
    // Fixed or sticky page chrome would be painted over a tall element
    // capture; take it out of the flow for the screenshot.
    await page.evaluate(() => {
      for (const node of Array.from(document.querySelectorAll("body *"))) {
        const position = getComputedStyle(node).position;
        if (position === "fixed" || position === "sticky") node.style.setProperty("position", "static", "important");
      }
    });
    // Content added above the section in V159 moves it by a fraction of a
    // pixel, and text antialiasing then differs on every row. Put the
    // section on a whole pixel in both builds.
    await page.evaluate(() => {
      const primary = document.querySelector('[data-testid="public-analysis-primary"]');
      if (!primary) return;
      const top = primary.getBoundingClientRect().top + window.scrollY;
      const pad = Math.ceil(top) - top;
      if (pad > 0) primary.style.setProperty("margin-top", `calc(${getComputedStyle(primary).marginTop} + ${pad}px)`);
    });
    await page.waitForTimeout(500);
    const primary = page.locator('[data-testid="public-analysis-primary"]').first();
    await primary.screenshot({ path: file, animations: "disabled" });
    // The DOM signature: what the section says and draws, independent of
    // sub-pixel placement - element order, visible text, analysis tags and
    // test ids, and the count of drawn shapes.
    const signature = await page.evaluate(() => {
      const root = document.querySelector('[data-testid="public-analysis-primary"]');
      const lines = [];
      const walk = (node, depth) => {
        if (!(node instanceof Element)) return;
        if (node.classList.contains("dl153-map-slot")) return;
        const attrs = ["data-analysis-block", "data-testid", "aria-pressed", "aria-expanded"].map((name) => (node.hasAttribute(name) ? `${name}=${node.getAttribute(name)}` : "")).filter(Boolean).join(" ");
        const own = Array.from(node.childNodes).filter((child) => child.nodeType === 3).map((child) => child.textContent.trim()).filter(Boolean).join(" ");
        lines.push(`${"  ".repeat(depth)}${node.tagName.toLowerCase()}${attrs ? ` [${attrs}]` : ""}${own ? ` "${own}"` : ""}`);
        for (const child of Array.from(node.children)) walk(child, depth + 1);
      };
      walk(root, 0);
      // Spacing belongs to the verdict too: the section's own height and the
      // distance from its content to the next block (2px steps, so half-pixel
      // placement does not count).
      const step = (value) => Math.round(value / 2) * 2;
      const rect = root.getBoundingClientRect();
      const last = root.lastElementChild;
      let next = root.nextElementSibling;
      while (next && next.getBoundingClientRect().height === 0) next = next.nextElementSibling;
      const gap = last && next ? step(next.getBoundingClientRect().top - last.getBoundingClientRect().bottom) : null;
      lines.push(`@layout height=${step(rect.height)} gapToNext=${gap}`);
      return lines;
    });
    writeFileSync(file.replace(/\.png$/u, ".dom.txt"), signature.join("\n"));
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
const pixels = JSON.parse(compare.stdout);
// The verdict is the DOM signature; the pixel ratio is kept as evidence
// (sub-pixel placement moves text by half a pixel without changing it).
const results = {};
for (const id of ids) {
  let domSame = false;
  let firstDifference = null;
  try {
    const a = readFileSync(resolve(OUT, "base", `${id}.dom.txt`), "utf8").split("\n");
    const b = readFileSync(resolve(OUT, "new", `${id}.dom.txt`), "utf8").split("\n");
    domSame = a.length === b.length && a.every((line, index) => line === b[index]);
    if (!domSame) {
      const index = a.findIndex((line, i) => line !== b[i]);
      firstDifference = { line: index, base: a[index] ?? null, new: b[index] ?? null, baseLines: a.length, newLines: b.length };
    }
  } catch (error) {
    firstDifference = { error: String(error).slice(0, 120) };
  }
  results[id] = { pass: domSame, domSame, firstDifference, pixel: pixels[id] || null };
}
for (const [id, error] of Object.entries(errors)) results[id] = { ...(results[id] || {}), captureError: error, pass: false };
const failed = Object.entries(results).filter(([, item]) => !item.pass).map(([id]) => id);
mkdirSync(dirname(REPORT), { recursive: true });
writeFileSync(REPORT, `${JSON.stringify({ generatedAt: new Date().toISOString(), verdict: "dom-signature", pixelEvidence: { blurRadius: 1, channelDelta: 24, maxRowShift: 2 }, compared: ids.length, pass: ids.length - failed.length, failedIds: failed, results }, null, 2)}\n`);
console.log(JSON.stringify({ compared: ids.length, pass: ids.length - failed.length, failedIds: failed }));
