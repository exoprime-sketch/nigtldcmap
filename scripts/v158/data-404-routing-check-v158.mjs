#!/usr/bin/env node
/**
 * V158: the app under the vercel.json routing that ends a missing /data file in 404.
 *
 * vercel.json: { handle: filesystem } then ^/data/.* -> 404, after which the
 * Create React App preset still sends every other path to index.html. This
 * serves a production build with the same order and walks the public screens:
 * every /data request the app makes must be a real file (200, not the HTML
 * fallback), no console or page error, and the old download addresses answer
 * 404 while the ZIP answers 200. It checks the app's side; the Vercel side is
 * checked on the Preview itself.
 *
 *   node scripts/v158/data-404-routing-check-v158.mjs --build tmp/build-x [--out reports/v158/data-404-routing-v158.json]
 */
import { createServer } from "node:http";
import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { dirname, extname, resolve } from "node:path";

import { chromium } from "playwright";

const ROOT = resolve(import.meta.dirname, "../..");
const argv = process.argv.slice(2);
const opt = (name, fallback) => {
  const at = argv.indexOf(`--${name}`);
  return at >= 0 && argv[at + 1] ? argv[at + 1] : fallback;
};
const BUILD = resolve(ROOT, opt("build", "build"));
const OUT = resolve(ROOT, opt("out", "reports/v158/data-404-routing-v158.json"));
const TYPES = { ".html": "text/html; charset=utf-8", ".js": "text/javascript", ".css": "text/css", ".json": "application/json", ".geojson": "application/geo+json", ".zip": "application/zip", ".png": "image/png", ".svg": "image/svg+xml", ".woff2": "font/woff2", ".ico": "image/x-icon", ".csv": "text/csv" };

const server = createServer((request, response) => {
  const path = decodeURIComponent(new URL(request.url, "http://x").pathname);
  const file = resolve(BUILD, `.${path}`);
  if (file.startsWith(BUILD) && existsSync(file) && statSync(file).isFile()) {
    response.writeHead(200, { "content-type": TYPES[extname(file)] || "application/octet-stream" });
    response.end(readFileSync(file));
  } else if (/^\/data\//u.test(path)) {
    response.writeHead(404, { "content-type": "text/plain; charset=utf-8" });
    response.end("404");
  } else {
    response.writeHead(200, { "content-type": "text/html; charset=utf-8" });
    response.end(readFileSync(resolve(BUILD, "index.html")));
  }
});
await new Promise((done) => server.listen(4395, "127.0.0.1", done));
const base = "http://127.0.0.1:4395";

const screens = [
  { key: "home", url: "/" },
  { key: "finder", url: "/?country=VNM#explorer" },
  { key: "map", url: "/?country=VNM#map" },
  { key: "detail A-001", url: "/?country=VNM&element=A-001#element-detail" },
  { key: "download", url: "/?country=VNM#download" },
];
const browser = await chromium.launch();
const results = [];
for (const screen of screens) {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const errors = [];
  const dataProblems = [];
  const dataRequests = new Set();
  page.on("pageerror", (error) => errors.push(`pageerror: ${String(error).slice(0, 200)}`));
  page.on("console", (message) => { if (message.type() === "error") errors.push(`console: ${message.text().slice(0, 200)}`); });
  page.on("response", (response) => {
    const url = new URL(response.url());
    if (!url.pathname.startsWith("/data/")) return;
    dataRequests.add(url.pathname);
    const type = response.headers()["content-type"] || "";
    if (response.status() !== 200 || type.includes("text/html")) dataProblems.push({ path: url.pathname, status: response.status(), type });
  });
  await page.goto(`${base}${screen.url}`, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(8000);
  const text = await page.evaluate(() => (document.querySelector("main")?.innerText || "").replace(/\s+/gu, " ").trim().length);
  results.push({ screen: screen.key, url: screen.url, mainTextLength: text, dataRequests: dataRequests.size, dataProblems, errors });
  await page.close();
}
await browser.close();
const direct = [];
for (const path of ["/data/vietnam/v2/downloads/a-002.csv", "/data/vietnam/v2/downloads/a-002.json", "/data/vietnam/v2/downloads/a-002.zip", "/data/vietnam/v2/catalog.json", "/no/such/page"]) {
  const response = await fetch(`${base}${path}`);
  direct.push({ path, status: response.status, type: response.headers.get("content-type") });
}
server.close();
const ok =
  results.every((row) => row.errors.length === 0 && row.dataProblems.length === 0 && row.mainTextLength > 0) &&
  direct.find((row) => row.path.endsWith(".csv")).status === 404 &&
  direct.find((row) => row.path.endsWith("a-002.json")).status === 404 &&
  direct.find((row) => row.path.endsWith(".zip")).status === 200 &&
  direct.find((row) => row.path === "/no/such/page").status === 200;
const report = { schema: "data-404-routing-v158", build: opt("build", "build"), ok, screens: results, direct };
mkdirSync(dirname(OUT), { recursive: true });
writeFileSync(OUT, `${JSON.stringify(report, null, 2)}\n`, "utf8");
process.stdout.write(`${JSON.stringify({ type: "summary", ok, screens: results.map((row) => [row.screen, row.dataRequests, row.dataProblems.length, row.errors.length]), direct })}\n`);
if (!ok) process.exitCode = 1;
