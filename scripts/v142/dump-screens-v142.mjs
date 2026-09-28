/**
 * Dump the primary-analysis text of chosen detail screens (direct URL entry)
 * so a reviewer can read what the screen says before and after a change.
 * Usage: node scripts/v142/dump-screens-v142.mjs --base-url http://127.0.0.1:4318 --only C-011,D-026 [--out reports/v142/screens-before]
 */
import { chromium } from "playwright";
import { mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { PROJECT_ROOT } from "../v125/audit-utils.mjs";

const argv = process.argv.slice(2);
const opt = (flag, fallback = null) => { const i = argv.indexOf(flag); return i < 0 ? fallback : argv[i + 1]; };
const base = (opt("--base-url", "http://127.0.0.1:4318")).replace(/\/$/u, "");
const only = (opt("--only") || "C-011").split(",").map((s) => s.trim()).filter(Boolean);
const out = resolve(PROJECT_ROOT, opt("--out", "reports/v142/screens"));
const query = opt("--query", "");
mkdirSync(out, { recursive: true });

const browser = await chromium.launch();
for (const elementId of only) {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  const errors = [];
  page.on("console", (m) => { if (m.type() === "error") errors.push(m.text().slice(0, 200)); });
  const url = `${base}/?view=data&country=VNM&element=${elementId}${query ? `&${query}` : ""}#element-detail`;
  await page.goto(url, { waitUntil: "networkidle", timeout: 90_000 });
  await page.waitForFunction(() => {
    const root = document.querySelector('[data-testid="public-analysis-root"]');
    const state = root?.getAttribute("data-analysis-state");
    return (state === "ready" || state === "empty") && document.querySelectorAll('[data-testid="public-analysis-pending"]').length === 0;
  }, null, { timeout: 60_000 }).catch(() => null);
  await page.waitForTimeout(600);
  const data = await page.evaluate(() => {
    const tidy = (v) => String(v || "").normalize("NFC").replace(/[ \t]+/gu, " ").replace(/\n{2,}/gu, "\n").trim();
    const primary = document.querySelector('[data-testid="public-analysis-primary"]');
    return {
      title: tidy(document.querySelector("h1")?.textContent),
      headings: [...(primary?.querySelectorAll("h2, h3, h4, h5") || [])].map((n) => tidy(n.textContent)),
      selects: [...(primary?.querySelectorAll("select") || [])].map((s) => `${tidy(s.closest("label")?.querySelector("span")?.textContent || s.getAttribute("aria-label"))} = ${tidy(s.selectedOptions[0]?.textContent)} (${s.options.length})`),
      primaryText: tidy(primary?.innerText),
      limitations: tidy(document.querySelector('[data-testid="public-data-limitations-v126"]')?.innerText),
    };
  });
  const text = [`# ${elementId} ${data.title}`, `URL ${url}`, `## headings`, ...data.headings.map((h) => `- ${h}`), `## selects`, ...data.selects.map((s) => `- ${s}`), `## primary`, data.primaryText, `## limitations`, data.limitations, `## console errors`, ...errors].join("\n");
  writeFileSync(resolve(out, `${elementId}.md`), `${text}\n`);
  await page.screenshot({ path: resolve(out, `${elementId}.png`), fullPage: true });
  process.stdout.write(`${elementId} ${data.title} headings=${data.headings.length} errors=${errors.length}\n`);
  await page.close();
}
await browser.close();
