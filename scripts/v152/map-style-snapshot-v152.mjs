#!/usr/bin/env node
/**
 * V152: style snapshot of the big map, used to prove the renderer extraction
 * (RealMapExplorerPage -> src/map/layers) changed nothing on screen.
 *
 * For every active layer drawn alone as the primary layer, and for the five
 * shared layer combinations (primary + context layers), under both boundary
 * systems, it records what MapLibre actually holds after rendering:
 *   - the ordered list of every style layer id,
 *   - each data layer's type/source/filter/layout/paint/zoom range,
 *   - each data source's options and a hash of its GeoJSON data,
 *   - the ids of the images the data layers registered.
 * The backdrop is set to "none" so no external tile timing enters the record.
 *
 * It reads the map through the localhost-only handle the page already
 * publishes for QA (`window.__cdpMapV151`, see attachMapObserverV137).
 *
 *   node scripts/v152/map-style-snapshot-v152.mjs --build tmp/build-v152-before \
 *     --out tmp/v152-style-before.json [--layers A-023,B-012] [--boundaries 34,63]
 *   node scripts/v152/map-style-snapshot-v152.mjs --compare before.json after.json \
 *     [--out reports/v152/renderer-extraction-diff-v152.json]
 */
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const argv = process.argv.slice(2);
const opt = (name, fallback) => {
  const index = argv.indexOf(name);
  return index < 0 ? fallback : argv[index + 1];
};

if (argv.includes("--compare")) {
  const index = argv.indexOf("--compare");
  const before = JSON.parse(readFileSync(resolve(ROOT, argv[index + 1]), "utf8"));
  const after = JSON.parse(readFileSync(resolve(ROOT, argv[index + 2]), "utf8"));
  const out = opt("--out", null);
  const diffs = [];
  const describe = (value) => JSON.stringify(value)?.slice(0, 400);
  const walk = (key, path, a, b) => {
    if (JSON.stringify(a) === JSON.stringify(b)) return;
    if (a && b && typeof a === "object" && typeof b === "object" && !Array.isArray(a) && !Array.isArray(b)) {
      for (const child of new Set([...Object.keys(a), ...Object.keys(b)])) walk(key, `${path}.${child}`, a[child], b[child]);
      return;
    }
    diffs.push({ run: key, path, before: describe(a), after: describe(b) });
  };
  const beforeRuns = new Map(before.runs.map((run) => [run.key, run]));
  const afterRuns = new Map(after.runs.map((run) => [run.key, run]));
  for (const key of new Set([...beforeRuns.keys(), ...afterRuns.keys()])) {
    const a = beforeRuns.get(key);
    const b = afterRuns.get(key);
    if (!a || !b) {
      diffs.push({ run: key, path: "(run)", before: a ? "present" : "missing", after: b ? "present" : "missing" });
      continue;
    }
    walk(key, "", { ...a, elapsedMs: undefined }, { ...b, elapsedMs: undefined });
  }
  const summary = {
    schema: "map-style-snapshot-diff-v152",
    generatedAt: new Date().toISOString(),
    before: before.build,
    after: after.build,
    runsCompared: Math.min(beforeRuns.size, afterRuns.size),
    notRendered: [...before.runs, ...after.runs].filter((run) => !run.rendered).map((run) => run.key),
    differences: diffs.length,
    diffs: diffs.slice(0, 200),
    status: diffs.length === 0 ? "PASS" : "FAIL",
  };
  if (out) {
    mkdirSync(dirname(resolve(ROOT, out)), { recursive: true });
    writeFileSync(resolve(ROOT, out), `${JSON.stringify(summary, null, 2)}\n`);
  }
  console.log(JSON.stringify({ type: "summary", status: summary.status, runs: summary.runsCompared, differences: diffs.length, notRendered: summary.notRendered.length }));
  for (const diff of diffs.slice(0, 15)) console.log(`${diff.run} ${diff.path}\n  before ${diff.before}\n  after  ${diff.after}`);
  process.exit(diffs.length === 0 ? 0 : 1);
}

const { chromium } = await import("playwright");
const { startStaticBuildServer } = await import("../v125/browser-runtime.mjs");
const { COMBINATIONS_V150 } = await import("../v150/map-combinations.mjs");

const BUILD = resolve(ROOT, opt("--build", "build"));
const PORT = Number(opt("--port", "4352"));
const OUT = resolve(ROOT, opt("--out", "tmp/v152-style-snapshot.json"));
const onlyLayers = (opt("--layers", "") || "").split(",").map((value) => value.trim()).filter(Boolean);
const boundaries = (opt("--boundaries", "34,63") || "34,63").split(",").map((value) => value.trim());
const BOUNDARY_VALUE = { 34: "post-2025-34", 63: "pre-2025-63" };

const mapIndex = JSON.parse(readFileSync(resolve(ROOT, "public/data/vietnam/v2/map-index.json"), "utf8"));
const activeLayers = mapIndex.layers.filter((layer) => layer.active !== false && layer.enabled !== false);
const selectorsFor = (ids) =>
  Object.fromEntries(
    ids.map((elementId) => {
      const layer = activeLayers.find((item) => item.elementId === elementId);
      return [elementId, { variable: layer.selectors.defaultVariable, period: layer.selectors.defaultPeriod }];
    })
  );

const runs = [];
for (const layer of activeLayers) {
  if (onlyLayers.length && !onlyLayers.includes(layer.elementId)) continue;
  runs.push({ name: layer.elementId, ids: [layer.elementId] });
}
if (!onlyLayers.length) {
  for (const [name, ids] of Object.entries(COMBINATIONS_V150)) runs.push({ name, ids });
}

function urlFor(base, ids) {
  const url = new URL(base);
  url.search = "";
  url.hash = "map";
  const params = {
    country: "VNM",
    layers: ids.join(","),
    primaryLayer: ids[0],
    focusLayer: ids[0],
    contextLayers: ids.slice(1).join(",") || "none",
    mapSelectors: JSON.stringify(selectorsFor(ids)),
  };
  for (const [key, value] of Object.entries(params)) url.searchParams.set(key, value);
  return url.toString();
}

const server = await startStaticBuildServer(BUILD, { port: PORT });
const base = server.url.replace(/\/$/u, "");
const browser = await chromium.launch();
const report = {
  schema: "map-style-snapshot-v152",
  generatedAt: new Date().toISOString(),
  build: BUILD.replace(ROOT, "."),
  boundaries,
  consoleErrors: [],
  runs: [],
};

async function snapshotOne(page, boundary, run) {
  const started = Date.now();
  await page.goto(urlFor(base, run.ids), { waitUntil: "domcontentloaded" });
  const deadline = Date.now() + 45000;
  let rendered = false;
  while (Date.now() < deadline) {
    rendered = await page.evaluate((ids) => {
      const root = document.querySelector('[data-testid="map-public-content"]');
      const list = (root?.getAttribute("data-rendered-map-elements") || "").split(",");
      const map = window.__cdpMapV151;
      return Boolean(map && map.isStyleLoaded() && ids.every((id) => list.includes(id)));
    }, run.ids);
    if (rendered) break;
    await page.waitForTimeout(400);
  }
  // Let late setData/moveLayer calls settle: wait for one idle, bounded.
  await page.evaluate(
    () =>
      new Promise((done) => {
        const map = window.__cdpMapV151;
        if (!map) return done(null);
        const timer = setTimeout(() => done(null), 6000);
        map.once("idle", () => {
          clearTimeout(timer);
          done(null);
        });
        map.triggerRepaint();
      })
  );
  await page.waitForTimeout(300);
  const snapshot = await page.evaluate(() => {
    const map = window.__cdpMapV151;
    if (!map) return null;
    const hash = (text) => {
      let h1 = 0x811c9dc5;
      let h2 = 0x01000193;
      for (let i = 0; i < text.length; i += 1) {
        const code = text.charCodeAt(i);
        h1 = Math.imul(h1 ^ code, 16777619) >>> 0;
        h2 = Math.imul(h2 + code, 2246822519) >>> 0;
      }
      return `${h1.toString(16).padStart(8, "0")}${h2.toString(16).padStart(8, "0")}:${text.length}`;
    };
    const style = map.getStyle();
    const isData = (id) => /^v1\d\d-/u.test(id) || id.startsWith("cdp-vietnam-adm1");
    const layers = style.layers
      .filter((layer) => isData(layer.id))
      .map((layer) => ({
        id: layer.id,
        type: layer.type,
        source: layer.source ?? null,
        filter: layer.filter ?? null,
        layout: layer.layout ?? null,
        paint: layer.paint ?? null,
        minzoom: layer.minzoom ?? null,
        maxzoom: layer.maxzoom ?? null,
      }));
    const sources = {};
    for (const id of [...new Set(layers.map((layer) => layer.source).filter(Boolean))].sort()) {
      const source = style.sources[id];
      if (!source) continue;
      const { data, ...options } = source;
      sources[id] = { ...options, dataHash: data === undefined ? null : hash(JSON.stringify(data)) };
    }
    return {
      order: style.layers.map((layer) => layer.id),
      layers,
      sources,
      images: map.listImages().filter((id) => /^cdp-v1\d\d-/u.test(id)).sort(),
    };
  });
  return {
    key: `${boundary}|${run.name}`,
    boundary,
    ids: run.ids,
    rendered,
    elapsedMs: Date.now() - started,
    ...(snapshot || { order: [], layers: [], sources: {}, images: [] }),
  };
}

try {
  await Promise.all(
    boundaries.map(async (boundary) => {
      const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, locale: "ko-KR" });
      await context.addInitScript(
        ([value]) => {
          try {
            localStorage.setItem("cdp-map-backdrop-v151", "none");
            localStorage.setItem("cdp-map-boundary-system-v151", value);
          } catch {
            // storage unavailable: the run records whatever the page chose
          }
        },
        [BOUNDARY_VALUE[boundary]]
      );
      const page = await context.newPage();
      page.on("console", (message) => {
        if (message.type() === "error") report.consoleErrors.push({ boundary, text: message.text().slice(0, 300) });
      });
      page.on("pageerror", (error) => report.consoleErrors.push({ boundary, text: `pageerror: ${String(error).slice(0, 300)}` }));
      for (const run of runs) {
        const result = await snapshotOne(page, boundary, run);
        report.runs.push(result);
        console.log(`${result.key} rendered=${result.rendered} layers=${result.layers.length} ${result.elapsedMs}ms`);
      }
      await context.close();
    })
  );
} finally {
  await browser.close();
  await server.close();
}

report.runs.sort((a, b) => a.key.localeCompare(b.key));
mkdirSync(dirname(OUT), { recursive: true });
writeFileSync(OUT, `${JSON.stringify(report, null, 2)}\n`);
const failed = report.runs.filter((run) => !run.rendered).map((run) => run.key);
console.log(JSON.stringify({ type: "summary", runs: report.runs.length, notRendered: failed, consoleErrors: report.consoleErrors.length, out: OUT.replace(ROOT, ".") }));
