/**
 * Where does the word '핵심' still appear on the map screen?
 * Scans the rendered text of the map page (list fully expanded) on whichever
 * base is given, and prints every element whose own text carries it.
 */
import { chromium } from "playwright";

const base = process.argv[2];
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 }, locale: "ko-KR" });
await page.goto(`${base.replace(/\/$/u, "")}/?view=map&country=VNM#map`, { waitUntil: "domcontentloaded" });
await page.waitForSelector('[data-testid="map-all-data-layer-v135"]', { state: "attached", timeout: 90_000 }).catch(() => null);
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
    .filter((node) => [...node.childNodes].some((child) => child.nodeType === 3 && /핵심/u.test(child.textContent || "")))
    .map((node) => ({ tag: node.tagName.toLowerCase(), text: (node.textContent || "").replace(/\s+/gu, " ").trim().slice(0, 80) }))
);
console.log(JSON.stringify({ base, hits }, null, 1));
await browser.close();
