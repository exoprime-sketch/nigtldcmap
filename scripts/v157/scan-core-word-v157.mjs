/**
 * Where does the word '핵심' still appear on the map screen?
 * Scans the rendered text of the map page (list fully expanded) on whichever
 * base is given, and prints every element whose own text carries it.
 *
 *   node scripts/v157/scan-core-word-v157.mjs <base> [--country VNM] [--out <report.json>]
 *
 * V162: `--out` writes the result as a report and the exit code is 1 when a
 * hit remains (qa:acceptance:v162 reads the report); `--country` picks the
 * country's map (default VNM). The dataset name '핵심광물' is not a hit.
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { chromium } from "playwright";

const args = process.argv.slice(2);
const opt = (name, fallback) => {
  const index = args.indexOf(name);
  return index >= 0 && args[index + 1] ? args[index + 1] : fallback;
};
const base = args[0];
const country = opt("--country", "VNM").toUpperCase();
const out = opt("--out", null);
const browser = await chromium.launch(process.env.V125_BROWSER_EXECUTABLE ? { executablePath: process.env.V125_BROWSER_EXECUTABLE } : {});
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 }, locale: "ko-KR" });
await page.goto(`${base.replace(/\/$/u, "")}/?view=map&country=${country}#map`, { waitUntil: "domcontentloaded" });
const listed = await page.waitForSelector('[data-testid="map-all-data-layer-v135"]', { state: "attached", timeout: 90_000 }).then(() => true).catch(() => false);
await page.waitForTimeout(1800);
await page.evaluate(() => {
  document.querySelectorAll("button").forEach((button) => {
    const label = button.textContent || "";
    if (/더 많은 레이어|모두 펼치기/u.test(label)) button.click();
  });
  document.querySelectorAll('[data-testid="map-catalog-group-toggle-v138"]').forEach((toggle) => {
    if (toggle.getAttribute("aria-expanded") !== "true") toggle.click();
  });
});
await page.waitForTimeout(1200);
const hits = await page.evaluate(() =>
  [...document.querySelectorAll("body *")]
    // '핵심광물' (critical minerals) is a dataset's own name (B-044 핵심광물 부존),
    // not the retired '핵심' label - #47 recorded it as the only expected match.
    // V157-2: B-044 is on the map now and its public short title is spaced
    // ('핵심 광물', publicLabelsV122); the same name, so the same exemption.
    .filter((node) => [...node.childNodes].some((child) => child.nodeType === 3 && /핵심/u.test((child.textContent || "").replace(/핵심\s?광물/gu, ""))))
    .map((node) => ({ tag: node.tagName.toLowerCase(), text: (node.textContent || "").replace(/\s+/gu, " ").trim().slice(0, 80) }))
);
const layers = await page.$$eval('[data-testid="map-all-data-layer-v135"]', (nodes) => nodes.length);
const result = { base, country, listed, layers, hits };
console.log(JSON.stringify(result, null, 1));
await browser.close();
if (out) {
  const path = resolve(out);
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, `${JSON.stringify({ generatedAt: new Date().toISOString(), summary: { pass: listed && hits.length === 0, hits: hits.length, layers }, ...result }, null, 2)}\n`);
  // A map list that never rendered is not a clean scan.
  process.exitCode = listed && hits.length === 0 ? 0 : 1;
}
