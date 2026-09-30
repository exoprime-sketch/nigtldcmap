#!/usr/bin/env node
/**
 * The '연관 데이터' section of a host layer, photographed.
 *
 * The companion cards are what a reader gets instead of a map for the twelve datasets
 * the delivery cannot place. The same shot before and after a wording change shows
 * whether the card explains itself or repeats the plan we wrote for ourselves.
 *
 * Usage: node scripts/v157/capture-companions-v157.mjs --out output/v157/companions/after --ids B-017
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
const OUT = resolve(ROOT, opt("out", "output/v157/companions/after"));
const externalBase = opt("base", "");
const PORT = Number(opt("port", "4360"));
const HOSTS = (opt("ids", "B-017,B-048") || "").split(",").map((id) => id.trim()).filter(Boolean);

mkdirSync(OUT, { recursive: true });
const server = externalBase ? null : await startStaticBuildServer(resolve(ROOT, opt("build", "build")), { port: PORT });
const base = (externalBase || server.url).replace(/\/$/u, "");
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 }, locale: "ko-KR" });
const report = { schema: "companion-shots-v157", generatedAt: new Date().toISOString(), base, shots: [] };

for (const elementId of HOSTS) {
  await page.goto(`${base}/?view=map&country=VNM#map`, { waitUntil: "domcontentloaded" });
  await page.waitForSelector('[data-testid="map-all-data-layer-v135"]', { state: "attached", timeout: 90_000 });
  await page.waitForTimeout(1400);
  const drawn = await page.evaluate((id) => {
    const input = document.querySelector(`[data-testid="map-all-data-layer-v135"][data-element-id="${id}"]`);
    if (!input || input.disabled) return false;
    const toggle = input.closest("[data-map-group-v135]")?.querySelector('[data-testid="map-catalog-group-toggle-v138"]');
    if (toggle && toggle.getAttribute("aria-expanded") !== "true") toggle.click();
    input.click();
    return true;
  }, elementId);
  if (!drawn) {
    report.shots.push({ elementId, status: "layer-unavailable" });
    continue;
  }
  await page.waitForTimeout(3400);
  const text = await page.evaluate(() => {
    const tidy = (value) => String(value || "").normalize("NFC").replace(/\s+/gu, " ").trim();
    const section = document.querySelector('[data-testid="map-companions-v157"]');
    if (!section) return null;
    [...section.querySelectorAll("button")].forEach((button) => {
      if (/더 보기/u.test(button.textContent || "")) button.click();
    });
    section.scrollIntoView({ block: "center" });
    return { section: tidy(section.innerText), cards: [...section.querySelectorAll("li")].map((card) => tidy(card.innerText)) };
  });
  await page.waitForTimeout(400);
  const file = resolve(OUT, `${elementId.toLowerCase()}-companions.png`);
  const node = await page.$('[data-testid="map-companions-v157"]');
  if (node) await node.screenshot({ path: file });
  else await page.screenshot({ path: file });
  report.shots.push({ elementId, status: text ? "captured" : "no-section", ...(text || {}), file: file.replace(ROOT, "").replace(/\\/gu, "/") });
  process.stdout.write(`${JSON.stringify({ elementId, cards: text?.cards?.length ?? 0, first: text?.cards?.[0]?.slice(0, 90) ?? null })}\n`);
}

writeFileSync(resolve(OUT, "companions-v157.json"), `${JSON.stringify(report, null, 2)}\n`, "utf8");
await browser.close();
if (server) await server.close();
process.stdout.write(`${JSON.stringify({ base, shots: report.shots.length })}\n`);
