#!/usr/bin/env node
/**
 * V162 report captures: the same detail page before (the production site, main
 * as deployed) and after (a local production-format build), 1440px wide.
 *
 * Usage: node scripts/v162/capture-before-after-v162.mjs --build tmp/build-v162-review
 *          [--before https://nigtldcmap.vercel.app] [--ids C-017,C-016,C-009,B-003] [--port 4462]
 * Writes reports/v162/screens/{before,after}-v162-<id>.png and a JSON of the
 * visible facts each capture was checked for (record ids, PDF file names).
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";
import { startStaticBuildServer } from "../v125/browser-runtime.mjs";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const args = process.argv.slice(2);
const opt = (name, fallback) => {
  const index = args.indexOf(name);
  return index >= 0 && args[index + 1] ? args[index + 1] : fallback;
};
const BUILD = resolve(ROOT, opt("--build", "tmp/build-v162-review"));
const BEFORE = opt("--before", "https://nigtldcmap.vercel.app").replace(/\/$/u, "");
const IDS = opt("--ids", "C-017,C-016,C-009,B-003").split(",").map((id) => id.trim());
const OUT = resolve(ROOT, "reports/v162/screens");
mkdirSync(OUT, { recursive: true });

const RECORD_ID = /\b(?:VNM|BGD)-[A-E]\d{3}-/u;
const PDF_NAME = /[^\s/()（）]+\.pdf\b/iu;
const URL_PATTERN = /https?:\/\/[^\s"'<>]+/gu;

const server = await startStaticBuildServer(BUILD, { port: Number(opt("--port", "4462")) });
const after = server.url.replace(/\/$/u, "");
// --before-build: a local build of an earlier commit instead of the live site
// (the new delivery before a fix, which the live site never showed).
const beforeBuild = opt("--before-build", null);
const beforeServer = beforeBuild ? await startStaticBuildServer(resolve(ROOT, beforeBuild), { port: Number(opt("--port", "4462")) + 1 }) : null;
const beforeBase = beforeServer ? beforeServer.url.replace(/\/$/u, "") : BEFORE;
const TAG = opt("--tag", "v162");
const browser = await chromium.launch(process.env.V125_BROWSER_EXECUTABLE ? { executablePath: process.env.V125_BROWSER_EXECUTABLE } : {});
const results = [];
try {
  for (const id of IDS) {
    for (const [side, base] of [["before", beforeBase], ["after", after]]) {
      const page = await browser.newPage({ viewport: { width: 1440, height: 1000 }, locale: "ko-KR" });
      const url = `${base}/?view=data&country=VNM&element=${id}#element-detail`;
      await page.goto(url, { waitUntil: "networkidle", timeout: 90000 }).catch(() => {});
      await page.waitForTimeout(2500);
      const text = await page.evaluate(() => document.body.textContent || "");
      const masked = text.replace(URL_PATTERN, " ");
      const path = resolve(OUT, `${side}-${TAG}-${id}.png`);
      await page.screenshot({ path, fullPage: true, clip: { x: 0, y: 0, width: 1440, height: 2600 } }).catch(async () => {
        await page.screenshot({ path, fullPage: false });
      });
      results.push({
        id,
        side,
        url,
        recordIdHits: (masked.match(new RegExp(RECORD_ID.source, "gu")) || []).length,
        pdfNameHits: (masked.match(new RegExp(PDF_NAME.source, "giu")) || []).slice(0, 5),
        regionCountPhrases: [...new Set(text.match(/\d+개 성·시/gu) || [])].slice(0, 6),
        screenshot: path.replace(ROOT, "").replace(/\\/gu, "/"),
      });
      await page.close();
    }
  }
} finally {
  await browser.close();
  await server.close?.();
  await beforeServer?.close?.();
}
writeFileSync(resolve(OUT, `before-after-${TAG}.json`), `${JSON.stringify(results, null, 2)}\n`, "utf8");
console.log(JSON.stringify(results.map(({ id, side, recordIdHits, pdfNameHits, regionCountPhrases }) => ({ id, side, recordIdHits, pdf: pdfNameHits.length, regionCountPhrases }))));
process.exit(0);
