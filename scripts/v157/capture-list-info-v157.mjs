#!/usr/bin/env node
/**
 * The map list's info panel for one dataset, photographed.
 *
 * The three datasets a reviewer found carried our registration notes in this panel.
 * The same shot, taken before and after the wording fix, is what shows the change:
 * the list expanded, the row's 'i' panel open, at 1440px.
 *
 * Usage:
 *   node scripts/v157/capture-list-info-v157.mjs --out output/v157/list-info/after
 *   node scripts/v157/capture-list-info-v157.mjs --base https://<preview> --out <dir>
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

import { chromium } from "playwright";

import { startStaticBuildServer } from "../v125/browser-runtime.mjs";
import { repoRootV158 } from "../v158/country-context-v158.mjs";

const ROOT = repoRootV158(import.meta.dirname);
const argv = process.argv.slice(2);
const opt = (name, fallback) => {
  const at = argv.indexOf(`--${name}`);
  return at >= 0 && argv[at + 1] ? argv[at + 1] : fallback;
};
const OUT = resolve(ROOT, opt("out", "output/v157/list-info/after"));
const externalBase = opt("base", "");
const PORT = Number(opt("port", "4359"));
const ELEMENTS = (opt("ids", "A-028,B-017,D-022") || "").split(",").map((id) => id.trim()).filter(Boolean);

mkdirSync(OUT, { recursive: true });
const server = externalBase ? null : await startStaticBuildServer(resolve(ROOT, opt("build", "build")), { port: PORT });
const base = (externalBase || server.url).replace(/\/$/u, "");
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 }, locale: "ko-KR" });
const report = { schema: "list-info-shots-v157", generatedAt: new Date().toISOString(), base, shots: [] };

for (const elementId of ELEMENTS) {
  await page.goto(`${base}/?view=map&country=VNM#map`, { waitUntil: "domcontentloaded" });
  await page.waitForSelector('[data-testid="map-all-data-layer-v135"]', { state: "attached", timeout: 90_000 });
  await page.waitForTimeout(1500);
  await page.evaluate((id) => {
    const item = document.querySelector(`.cdp-map-catalog-v138__item[data-map-element="${id}"]`);
    if (!item) return false;
    const toggle = item.closest("[data-map-group-v135]")?.querySelector('[data-testid="map-catalog-group-toggle-v138"]');
    if (toggle && toggle.getAttribute("aria-expanded") !== "true") toggle.click();
    const info = item.querySelector(".cdp-map-catalog-v138__info");
    if (info && info.getAttribute("aria-expanded") !== "true") info.click();
    item.scrollIntoView({ block: "center" });
    return true;
  }, elementId);
  await page.waitForTimeout(600);
  // What the panel says now, read after the click has rendered.
  const opened = await page.evaluate((id) => {
    const item = document.querySelector(`.cdp-map-catalog-v138__item[data-map-element="${id}"]`);
    if (!item) return null;
    const tidy = (value) => String(value || "").normalize("NFC").replace(/\s+/gu, " ").trim();
    const facts = [...(item.querySelectorAll('[data-testid="map-catalog-info-v138"] > div') || [])].map((entry) => ({
      label: tidy(entry.querySelector("dt")?.textContent),
      value: tidy(entry.querySelector("dd")?.textContent),
    }));
    return { row: tidy(item.innerText), mapLine: facts.find((fact) => fact.label === "지도 표시")?.value ?? "", facts };
  }, elementId);
  const file = resolve(OUT, `${elementId.toLowerCase()}-list-info.png`);
  const row = await page.$(`.cdp-map-catalog-v138__item[data-map-element="${elementId}"]`);
  if (row) await row.screenshot({ path: file });
  else await page.screenshot({ path: file });
  report.shots.push({ elementId, ...(opened || { row: null, mapLine: null }), file: file.replace(ROOT, "").replace(/\\/gu, "/") });
  process.stdout.write(`${JSON.stringify({ elementId, mapLine: opened?.mapLine ?? null })}\n`);
}

writeFileSync(resolve(OUT, "list-info-v157.json"), `${JSON.stringify(report, null, 2)}\n`, "utf8");
await browser.close();
if (server) await server.close();
process.stdout.write(`${JSON.stringify({ base, out: report.out ?? OUT.replace(ROOT, ""), shots: report.shots.length })}\n`);
