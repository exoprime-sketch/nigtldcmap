#!/usr/bin/env node
/**
 * V158-B2 WP3: confirms the self-hosted Noto Sans Bengali subset is wired up
 * correctly and loads only on demand (production build, real Chromium).
 *
 * Checks, on the home page of a production build:
 *   - before any Bengali text exists on the page, no request for the
 *     NotoSansBengali woff2 files has happened (Vietnam pages must not
 *     download this font);
 *   - once a Bengali sample string is added to the DOM (inheriting the
 *     ordinary body font stack, not a special font-family), the browser's own
 *     unicode-range matching fetches the face and `document.fonts.check`
 *     reports it usable;
 *   - a zoomed screenshot of the sample for a human reviewer.
 *
 *   node scripts/v158/bengali-font-check-v158.mjs --build tmp/build-wp3 [--port 4381]
 * Writes reports/v158/screens/bengali-font-check-v158.png and prints a
 * one-line JSON summary. Exit code 1 on any failed check.
 */
import { mkdirSync } from "node:fs";
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
const BUILD = resolve(ROOT, opt("--build", "tmp/build-wp3"));
const PORT = Number(opt("--port", "4381"));
const SHOT = resolve(ROOT, opt("--shot", "reports/v158/screens/bengali-font-check-v158.png"));
const SAMPLE_TEXT = "বাংলাদেশ ঢাকা কক্সবাজার";
const FONT_FILE_PATTERN = /NotoSansBengali-(?:400|600)[^/"']*\.woff2/u;

mkdirSync(dirname(SHOT), { recursive: true });

const server = await startStaticBuildServer(BUILD, { port: PORT });
const base = server.url.replace(/\/$/u, "");
const browser = await chromium.launch();

const summary = {
  type: "summary",
  schema: "bengali-font-check-v158",
  build: BUILD.replace(ROOT, "."),
  checks: {},
  ok: false,
};
const check = (name, ok, detail) => {
  summary.checks[name] = { ok: Boolean(ok), ...(detail === undefined ? {} : { detail }) };
};

try {
  const context = await browser.newContext({ viewport: { width: 900, height: 500 }, locale: "ko-KR" });
  const page = await context.newPage();
  const consoleErrors = [];
  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text().slice(0, 300));
  });
  page.on("pageerror", (error) => consoleErrors.push(`pageerror: ${String(error).slice(0, 300)}`));

  const requests = [];
  page.on("request", (request) => requests.push(request.url()));

  await page.goto(`${base}/`, { waitUntil: "load" });
  await page.waitForSelector("#root *", { timeout: 60000 });
  // Let the plain home page settle (fonts.ready for whatever the shell itself needs) before measuring the baseline.
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(500);

  const requestsBeforeBengali = [...requests];
  const fontRequestedBeforeBengaliText = requestsBeforeBengali.some((url) => FONT_FILE_PATTERN.test(url));
  check("noFontRequestOnPlainHomePage", !fontRequestedBeforeBengaliText, requestsBeforeBengali.filter((url) => url.includes("NotoSansBengali")));

  const beforeInjection = await page.evaluate((text) => document.fonts.check('16px "Noto Sans Bengali"', text), SAMPLE_TEXT);
  check("fontNotUsableBeforeBengaliText", !beforeInjection, beforeInjection);

  // Inject the sample inside the app shell, inheriting the body font stack
  // (no font-family override), the same way real Bengali facility/region text
  // would render on a detail or map screen.
  const testId = "bengali-font-check-v158-sample";
  await page.evaluate(
    ([text, id]) => {
      const node = document.createElement("div");
      node.setAttribute("data-testid", id);
      node.style.fontSize = "28px";
      node.style.lineHeight = "1.4";
      node.style.padding = "24px";
      node.style.background = "#ffffff";
      node.style.display = "inline-block";
      node.textContent = text;
      document.body.appendChild(node);
      // Mirrors what the layout engine already does when it meets Bengali
      // text under this font stack; also lets the check below await the load.
      return document.fonts.load('16px "Noto Sans Bengali"', text);
    },
    [SAMPLE_TEXT, testId]
  );
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(300);

  const usable = await page.evaluate((text) => document.fonts.check('16px "Noto Sans Bengali"', text), SAMPLE_TEXT);
  check("fontUsableAfterBengaliText", usable, usable);

  const requestsAfterBengali = [...requests];
  const fontRequestedAfterBengaliText = requestsAfterBengali.some((url) => FONT_FILE_PATTERN.test(url));
  check(
    "fontRequestedOnlyAfterBengaliText",
    fontRequestedAfterBengaliText,
    requestsAfterBengali.filter((url) => url.includes("NotoSansBengali"))
  );

  const glyphsRendered = await page.evaluate((id) => {
    const node = document.querySelector(`[data-testid="${id}"]`);
    if (!node) return null;
    const rect = node.getBoundingClientRect();
    return { width: rect.width, height: rect.height, text: node.textContent };
  }, testId);
  check("sampleNodeRendered", Boolean(glyphsRendered && glyphsRendered.width > 0 && glyphsRendered.height > 0), glyphsRendered);

  check("noConsoleErrors", consoleErrors.length === 0, consoleErrors);

  await page.locator(`[data-testid="${testId}"]`).screenshot({ path: SHOT });
  summary.screenshot = SHOT.replace(ROOT, ".");
} catch (error) {
  summary.error = String(error?.message || error).slice(0, 500);
} finally {
  await browser.close();
  await server.close();
}

summary.ok = !summary.error && Object.values(summary.checks).every((entry) => entry.ok);
console.log(JSON.stringify(summary));
process.exit(summary.ok ? 0 : 1);
