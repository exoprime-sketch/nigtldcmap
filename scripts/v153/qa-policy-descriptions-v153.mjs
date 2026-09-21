/**
 * V153-D3: open C-008, C-009 and C-010 from a production build in Chromium,
 * count the platform-edited description cards, check that none is pending
 * unless the JSON says so, that no card shows an attribute label or internal
 * phrase, and that the document does not overflow at six widths. Screenshots
 * of the first card go under reports/v153.
 *
 *   node scripts/v153/qa-policy-descriptions-v153.mjs --build tmp/build-v153-d3-review [--port 4342]
 */
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
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
const PORT = Number(opt("--port", "4342"));
const OUT = resolve(ROOT, "reports/v153");
mkdirSync(OUT, { recursive: true });

const descriptions = JSON.parse(readFileSync(resolve(ROOT, "src/data/visualization/policyDescriptionsV153.json"), "utf8")).entries;
const expected = {
  "C-008": descriptions.filter((entry) => entry.elementIds.includes("C-008") && entry.kind !== "document").length,
  // C-009 names the 2050 strategy twice (by number and by title); C-010 has
  // no entry of its own for the environmental protection law.
  "C-009": 20,
  "C-010": 19,
};
const WIDTHS = [320, 390, 768, 1024, 1440, 1920];
const INTERNAL = /시행\(발효\)일|보완항목|raw:|\.pdf\b|\.xlsx?\b|검토의견|검증등급|v124-c-/u;

const server = await startStaticBuildServer(BUILD, { port: PORT });
const base = server.url.replace(/\/$/u, "");
const browser = await chromium.launch();
const results = [];

for (const elementId of Object.keys(expected)) {
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, locale: "ko-KR" });
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (error) => errors.push(String(error).slice(0, 200)));
  page.on("console", (message) => { if (message.type() === "error") errors.push(message.text().slice(0, 200)); });
  await page.goto(`${base}/?view=data&country=VNM&element=${elementId}#element-detail`, { waitUntil: "domcontentloaded", timeout: 60000 });
  await page.waitForSelector('[data-testid="policy-description-v153"]', { timeout: 60000 });
  const cards = await page.$$eval('[data-testid="policy-description-v153"]', (nodes) => nodes.map((node) => ({
    key: node.getAttribute("data-policy-key"),
    status: node.getAttribute("data-policy-status"),
    label: node.querySelector(".pdc153__label")?.textContent || "",
    title: node.querySelector(".pdc153__title")?.textContent || "",
    points: [...node.querySelectorAll(".pdc153__points li")].map((li) => li.textContent || ""),
    links: [...node.querySelectorAll(".pdc153__sources a")].map((a) => a.getAttribute("href") || ""),
    text: node.textContent || "",
  })));
  // Overflow with the cards shown, and with them hidden: the cards may not
  // add a pixel; an overflow the timeline already had is reported, not owned.
  const measure = () => page.evaluate(() => Math.max(0, document.documentElement.scrollWidth - document.documentElement.clientWidth));
  const overflow = {};
  const overflowWithoutCards = {};
  for (const width of WIDTHS) {
    await page.setViewportSize({ width, height: 1000 });
    await page.waitForTimeout(250);
    overflow[width] = await measure();
  }
  const hide = await page.addStyleTag({ content: '[data-testid="policy-description-v153"]{display:none !important}' });
  for (const width of WIDTHS) {
    await page.setViewportSize({ width, height: 1000 });
    await page.waitForTimeout(250);
    overflowWithoutCards[width] = await measure();
  }
  await hide.evaluate((node) => node.remove());
  await page.setViewportSize({ width: 1440, height: 1000 });
  const first = await page.$('[data-testid="policy-description-v153"]');
  await first.scrollIntoViewIfNeeded();
  await first.screenshot({ path: resolve(OUT, `d3-card-${elementId}.png`) });
  await page.setViewportSize({ width: 390, height: 900 });
  await page.waitForTimeout(250);
  await first.scrollIntoViewIfNeeded();
  await first.screenshot({ path: resolve(OUT, `d3-card-${elementId}-390.png`) });
  const problems = [];
  if (cards.length !== expected[elementId]) problems.push(`cards ${cards.length} != ${expected[elementId]}`);
  cards.forEach((card) => {
    if (card.status !== "verified") problems.push(`${card.key} pending`);
    if (!/^플랫폼 편집 설명 · 출처 \d+건 · \d{4}-\d{2}-\d{2} 확인$/u.test(card.label)) problems.push(`${card.key} label`);
    if (INTERNAL.test(card.text)) problems.push(`${card.key} internal phrase`);
    if (card.links.length === 0 || card.links.some((href) => !href.startsWith("https://"))) problems.push(`${card.key} links`);
    if (card.points.length < 2) problems.push(`${card.key} points ${card.points.length}`);
  });
  const preexisting = [];
  Object.entries(overflow).forEach(([width, value]) => {
    if (value > overflowWithoutCards[width]) problems.push(`overflow@${width}=${value} (without cards ${overflowWithoutCards[width]})`);
    else if (value > 0) preexisting.push(`overflow@${width}=${value} already present without cards`);
  });
  if (errors.length) problems.push(`console errors ${errors.length}`);
  results.push({ elementId, cards: cards.length, expected: expected[elementId], overflow, overflowWithoutCards, preexisting, errors, problems, sample: cards[0] });
  console.log(elementId, "cards", cards.length, "expected", expected[elementId], "overflow", JSON.stringify(overflow), preexisting.length ? `PREEXISTING ${preexisting.join("; ")}` : "", problems.length ? `PROBLEMS ${problems.join("; ")}` : "ok");
  await context.close();
}

await browser.close();
await server.close();
const ok = results.every((row) => row.problems.length === 0);
writeFileSync(resolve(OUT, "d3-policy-descriptions-qa.json"), `${JSON.stringify({ checkedAt: new Date().toISOString(), build: BUILD.replace(ROOT, "."), ok, results }, null, 2)}\n`);
console.log(ok ? "QA OK" : "QA FAILED");
process.exit(ok ? 0 : 1);
