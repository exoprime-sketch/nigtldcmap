// V151-2 measurement: detail-screen preparation time, before/after a change,
// for a fixed set of element ids. Not a gate — it only records numbers so a
// PR can show the before/after delta in reports/v15x/.
//
//   node scripts/v151-2/measure-detail-prepare-v151-2.mjs [--build tmp/build-v151-2-review]
//     [--ids B-003,B-004,B-005,B-006,B-007] [--runs 3] [--label before|after]
//     [--out reports/v151-2/detail-prepare-timing-<label>.json]
//
// Ready selector reused from scripts/v150/review-runtime-v150.mjs (L330-410):
//   [data-testid="public-analysis-root"][data-analysis-state="ready"]
// The URL shape is the repo's own detailUrl() from that same script, not the
// literal one in the original brief, because that is the pattern the app
// actually resolves (view=data is required to land on #element-detail).
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";
import { startStaticBuildServer } from "../v125/browser-runtime.mjs";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const argv = process.argv.slice(2);
const arg = (name, fallback) => {
  const index = argv.indexOf(name);
  return index < 0 ? fallback : argv[index + 1];
};
const BUILD = resolve(ROOT, arg("--build", "tmp/build-v151-2-review"));
const IDS = arg("--ids", "B-003,B-004,B-005,B-006,B-007").split(",").map((s) => s.trim()).filter(Boolean);
const RUNS = Math.max(1, Number(arg("--runs", "3")) || 3);
const LABEL = arg("--label", "before");
const OUT = resolve(ROOT, arg("--out", `reports/v151-2/detail-prepare-timing-${LABEL}.json`));
const SCALE = Number(process.env.V125_TIMEOUT_SCALE || 1) || 1;

const READY_SELECTOR = '[data-testid="public-analysis-root"][data-analysis-state="ready"]';
const detailUrl = (base, id) => `${base}/?view=data&country=VNM&element=${id}#element-detail`;

mkdirSync(dirname(OUT), { recursive: true });

const median = (values) => {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
};

const server = await startStaticBuildServer(BUILD, { port: 0 });
const base = server.url.replace(/\/$/u, "");
const browser = await chromium.launch(
  process.env.V125_BROWSER_EXECUTABLE ? { executablePath: process.env.V125_BROWSER_EXECUTABLE } : {}
);

const perId = {};
const checks = [];
const check = (name, status, actual, expected) => {
  checks.push({ type: "check", audit: "detail-prepare-timing:v151-2", name, status, actual, expected });
  process.stdout.write(`${JSON.stringify(checks[checks.length - 1])}\n`);
};

for (const id of IDS) {
  const wallTimes = [];
  const prepareDurations = [];
  let packBytes = 0;
  for (let run = 1; run <= RUNS; run++) {
    const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, locale: "ko-KR" });
    const page = await context.newPage();
    const bodyReads = [];
    page.on("response", (response) => {
      if (!response.url().includes("/data/vietnam/v2/packs/")) return;
      // The local static server (browser-runtime.mjs) sends chunked bodies
      // with no Content-Length header, so bytes come from the body itself.
      bodyReads.push(response.body().then((buffer) => { packBytes += buffer.length; }).catch(() => {}));
    });
    try {
      await page.goto(detailUrl(base, id), { waitUntil: "domcontentloaded" });
      await page.waitForSelector(READY_SELECTOR, { timeout: 90_000 * SCALE });
      await Promise.all(bodyReads);
      // performance.now() at this instant is elapsed time since the page's
      // navigation start (its time origin) — a wall-clock measure taken
      // in-page rather than by the Node-side clock.
      const elapsedMs = await page.evaluate(() => performance.now());
      const prepareDuration = await page.evaluate(
        () => performance.getEntriesByName("cdp-detail-prepare", "measure").at(-1)?.duration ?? null
      );
      wallTimes.push(elapsedMs);
      if (prepareDuration != null) prepareDurations.push(prepareDuration);
      check(`READY_${id}_run${run}`, "PASS", elapsedMs, "ready before timeout");
    } catch (error) {
      check(`READY_${id}_run${run}`, "FAIL", String(error instanceof Error ? error.message : error), "ready before timeout");
    }
    await context.close();
  }
  perId[id] = {
    runs: wallTimes,
    median: median(wallTimes),
    min: wallTimes.length ? Math.min(...wallTimes) : null,
    max: wallTimes.length ? Math.max(...wallTimes) : null,
    prepareMeasureMedian: prepareDurations.length ? median(prepareDurations) : null,
    packBytes,
  };
}

await browser.close();
await server.close();

const summary = {
  type: "summary",
  audit: "detail-prepare-timing:v151-2",
  status: checks.some((row) => row.status === "FAIL") ? "FAIL" : "PASS",
  label: LABEL,
  ids: IDS,
  runs: RUNS,
  perId: Object.fromEntries(Object.entries(perId).map(([id, row]) => [id, { median: row.median, packBytes: row.packBytes }])),
  generatedAt: new Date().toISOString(),
};
writeFileSync(OUT, `${JSON.stringify({ summary, perId, checks }, null, 2)}\n`);
process.stdout.write(`${JSON.stringify(summary)}\n`);
process.exit(checks.some((row) => row.status === "FAIL") ? 1 : 0);
