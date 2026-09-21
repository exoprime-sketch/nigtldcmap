// Records the home page's card order in one environment, so the same source
// can be shown to produce the same home everywhere (local, CI, Vercel).
//
//   node scripts/v150-1/home-order-v150-1.mjs --build build --label local-windows
//   node scripts/v150-1/home-order-v150-1.mjs --base-url https://… --label vercel-preview
//   [--out reports/v150-1/determinism-v150-1.json]   (appends/replaces the label)
//
// Reads the featured cards as rendered (default ordering) and after pressing
// 최신순, plus the committed dataset directory's own latest-first order. The
// three hashes are what the environments are compared on.
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";
import { startStaticBuildServer } from "../v125/browser-runtime.mjs";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const argv = process.argv.slice(2);
const arg = (name, fallback) => { const i = argv.indexOf(name); return i < 0 ? fallback : argv[i + 1]; };
const LABEL = arg("--label", `${process.platform}`);
const OUT = resolve(ROOT, arg("--out", "reports/v150-1/determinism-v150-1.json"));
const sha = (value) => createHash("sha256").update(JSON.stringify(value)).digest("hex").slice(0, 16);

const directory = JSON.parse(readFileSync(resolve(ROOT, "public/data/vietnam/v2/dataset-directory.json"), "utf8"));
const directoryLatest = [...directory.items].sort((a, b) => String(b.updatedAt).localeCompare(String(a.updatedAt)) || a.elementId.localeCompare(b.elementId)).slice(0, 8).map((item) => item.elementId);

let server = null;
let base = arg("--base-url", "");
if (!base) { server = await startStaticBuildServer(resolve(ROOT, arg("--build", "build")), { port: 0 }); base = server.url.replace(/\/$/u, ""); }
const browser = await chromium.launch(process.env.V125_BROWSER_EXECUTABLE ? { executablePath: process.env.V125_BROWSER_EXECUTABLE } : {});
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 }, locale: "ko-KR" });
  await page.goto(`${base}/#home`, { waitUntil: "domcontentloaded" });
  await page.waitForFunction(() => document.querySelectorAll(".home-featured-v139__card").length >= 8, undefined, { timeout: 60_000 });
  await page.waitForTimeout(800);
  const readOrder = () => page.evaluate(() => [...document.querySelectorAll(".home-featured-v139__card")].map((card) => card.querySelector("h3")?.id?.replace("home-card-", "") || card.querySelector('[data-testid="home-card-open-v140"]')?.getAttribute("data-element-id") || ""));
  const initial = await readOrder();
  const usageStatus = await page.evaluate(async () => { try { const r = await fetch("/api/usage"); return `${r.status} ${r.headers.get("content-type") || ""}`; } catch (e) { return `error ${e.message}`; } });
  await page.getByRole("button", { name: "최신순", exact: true }).click();
  await page.waitForTimeout(600);
  const latest = await readOrder();
  const record = {
    label: LABEL,
    generatedAt: new Date().toISOString(),
    base: server ? "static build" : base,
    platform: `${process.platform} node ${process.version}`,
    directorySourceCommit: directory.sourceCommit,
    usageApi: usageStatus,
    initialOrder: initial, initialHash: sha(initial),
    latestOrder: latest, latestHash: sha(latest),
    directoryLatestOrder: directoryLatest, directoryLatestHash: sha(directoryLatest),
  };
  mkdirSync(dirname(OUT), { recursive: true });
  const existing = existsSync(OUT) ? JSON.parse(readFileSync(OUT, "utf8")) : { schema: "nigt-home-determinism-v150-1", environments: [] };
  existing.environments = existing.environments.filter((row) => row.label !== LABEL).concat(record);
  const hashes = new Set(existing.environments.map((row) => `${row.initialHash}|${row.latestHash}`));
  existing.consistent = hashes.size === 1;
  writeFileSync(OUT, `${JSON.stringify(existing, null, 2)}\n`);
  console.log(JSON.stringify({ label: LABEL, initial: initial.join(","), latest: latest.join(","), initialHash: record.initialHash, latestHash: record.latestHash, environments: existing.environments.length, consistent: existing.consistent }));
} finally {
  await browser.close();
  if (server) await server.close();
}
