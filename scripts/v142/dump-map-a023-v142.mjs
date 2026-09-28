/**
 * A-023 map source-selection dump: open the detail, hand off to the map, and
 * read the year selector, legend, selection panel and 자료정보 for each source
 * choice (WRI / OSM / both). Usage: node scripts/v142/dump-map-a023-v142.mjs [--base-url URL] [--out dir]
 */
import { chromium } from "playwright";
import { mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { PROJECT_ROOT } from "../v125/audit-utils.mjs";
const argv = process.argv.slice(2);
const opt = (flag, fallback = null) => { const i = argv.indexOf(flag); return i < 0 ? fallback : argv[i + 1]; };
const base = (opt("--base-url", "http://127.0.0.1:4318")).replace(/\/$/u, "");
const out = resolve(PROJECT_ROOT, opt("--out", "reports/v142/map-a023"));
mkdirSync(out, { recursive: true });
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
const errors = [];
page.on("console", (m) => { if (m.type() === "error") errors.push(m.text().slice(0, 200)); });
await page.goto(`${base}/?view=data&country=VNM&element=A-023#element-detail`, { waitUntil: "networkidle", timeout: 90_000 });
await page.waitForFunction(() => document.querySelector('[data-testid="public-analysis-root"]')?.getAttribute("data-analysis-state") === "ready", null, { timeout: 60_000 });
await page.evaluate(() => { const b = [...document.querySelectorAll("button")].find((n) => /지도에서 보기/u.test(n.textContent || "") && !n.disabled); b?.click(); });
await page.waitForFunction(() => document.querySelector('.cdp-map-catalog-v138__item[data-map-element="A-023"]')?.getAttribute("data-map-drawn") === "true", null, { timeout: 60_000 });
await page.waitForTimeout(1500);
const readAll = () => page.evaluate(() => {
  const tidy = (v) => String(v || "").normalize("NFC").replace(/[ \t]+/gu, " ").replace(/\n{2,}/gu, "\n").trim();
  const selects = [...document.querySelectorAll("select")].map((s) => ({ label: tidy(s.closest("label")?.textContent || s.getAttribute("aria-label") || s.id), value: tidy(s.selectedOptions[0]?.textContent), options: [...s.options].map((o) => tidy(o.textContent)) }));
  const dl = [...document.querySelectorAll("dt")].map((dt) => `${tidy(dt.textContent)}: ${tidy(dt.nextElementSibling?.textContent)}`);
  const rows = [...document.querySelectorAll(".cdp-evidence-row")].map((r) => `${tidy(r.querySelector("span")?.textContent)}: ${tidy(r.querySelector("strong")?.textContent)}`);
  return { url: location.href, selects, dl, rows, body: tidy(document.body.innerText) };
});
const states = [];
const capture = async (name) => {
  const data = await readAll();
  states.push({ name, ...data });
  await page.screenshot({ path: resolve(out, `${name}.png`) });
  writeFileSync(resolve(out, `${name}.md`), [`# ${name}`, data.url, "## selects", ...data.selects.map((s) => `- ${s.label} = ${s.value} | ${s.options.join(" / ")}`), "## dl", ...data.dl.map((d) => `- ${d}`), "## evidence rows", ...data.rows.map((r) => `- ${r}`), "## body", data.body].join("\n"));
};
await capture("01-default");
// select the representative symbol through keyboard navigation
const button = await page.$('[data-testid="map-keyboard-feature-select"]');
if (button) { await button.click(); await page.waitForTimeout(800); await capture("02-default-selected"); }
// switch the source filter
const sourceSelect = await page.$$eval("select", (nodes) => nodes.findIndex((s) => [...s.options].some((o) => /OSM|OpenStreetMap/u.test(o.textContent || ""))));
if (sourceSelect >= 0) {
  const handle = (await page.$$("select"))[sourceSelect];
  const options = await handle.$$eval("option", (o) => o.map((x) => ({ v: x.value, t: x.textContent })));
  process.stdout.write(`source options: ${JSON.stringify(options)}\n`);
  for (const option of options) {
    await handle.selectOption(option.v);
    await page.waitForTimeout(1500);
    await capture(`03-source-${option.v.replace(/[^a-z0-9]/giu, "_")}`);
    const b2 = await page.$('[data-testid="map-keyboard-feature-select"]');
    if (b2) { await b2.click(); await page.waitForTimeout(800); await capture(`04-source-${option.v.replace(/[^a-z0-9]/giu, "_")}-selected`); }
  }
}
writeFileSync(resolve(out, "states.json"), JSON.stringify({ errors, states: states.map((s) => ({ name: s.name, url: s.url, selects: s.selects, dl: s.dl, rows: s.rows })) }, null, 2));
process.stdout.write(`captured ${states.length} states, console errors ${errors.length}\n`);
await browser.close();
