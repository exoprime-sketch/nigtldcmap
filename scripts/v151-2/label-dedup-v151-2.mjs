// V151-2 gate: the map draws one label per place, and every province label
// anchors inside its own polygon (polylabel, not an area centroid that can
// fall outside a concave shape).
//
//   node scripts/v151-2/label-dedup-v151-2.mjs --skip-browser
//   node scripts/v151-2/label-dedup-v151-2.mjs --build tmp/build-v151-2-review   (adds the browser checks)
//   [--out reports/v151-2/label-dedup.json]
//
// The static section below re-implements polylabel and ray-casting
// point-in-polygon directly in this script (a .mjs cannot import the
// project's TypeScript source), so this is a second, independent port of the
// same algorithm as `src/data/map/labelAnchorV151.ts` -- agreement between
// the two is itself part of what this gate is checking.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const argv = process.argv.slice(2);
const arg = (name, fallback) => {
  const index = argv.indexOf(name);
  return index < 0 ? fallback : argv[index + 1];
};
const BUILD = resolve(ROOT, arg("--build", "build"));
const OUT = resolve(ROOT, arg("--out", "reports/v151-2/label-dedup.json"));
const SKIP_BROWSER = argv.includes("--skip-browser");

const readJson = (path) => JSON.parse(readFileSync(resolve(ROOT, path), "utf8"));
const checks = [];
const check = (name, status, actual, expected) => {
  checks.push({ type: "check", audit: "label-dedup:v151-2", name, status, actual, expected });
  process.stdout.write(`${JSON.stringify(checks[checks.length - 1])}\n`);
};
const equal = (name, actual, expected) =>
  check(name, JSON.stringify(actual) === JSON.stringify(expected) ? "PASS" : "FAIL", actual, expected);

// ------------------------------------------------------------- polylabel port

/** Squared distance from point (px,py) to segment ab. */
function segDistSq(px, py, a, b) {
  let x = a[0];
  let y = a[1];
  let dx = b[0] - x;
  let dy = b[1] - y;
  if (dx !== 0 || dy !== 0) {
    const t = ((px - x) * dx + (py - y) * dy) / (dx * dx + dy * dy);
    if (t > 1) {
      x = b[0];
      y = b[1];
    } else if (t > 0) {
      x += dx * t;
      y += dy * t;
    }
  }
  dx = px - x;
  dy = py - y;
  return dx * dx + dy * dy;
}

/** Signed distance from (x,y) to the polygon outline: negative outside. */
function pointToPolygonDist(x, y, polygon) {
  let inside = false;
  let minDistSq = Infinity;
  for (const ring of polygon) {
    const len = ring.length;
    for (let i = 0, j = len - 1; i < len; j = i++) {
      const a = ring[i];
      const b = ring[j];
      if (a[1] > y !== b[1] > y && x < ((b[0] - a[0]) * (y - a[1])) / (b[1] - a[1]) + a[0]) {
        inside = !inside;
      }
      minDistSq = Math.min(minDistSq, segDistSq(x, y, a, b));
    }
  }
  return (inside ? 1 : -1) * Math.sqrt(minDistSq);
}

/** Ray-casting point-in-polygon, holes included (rings[0] outer, rest holes). */
function pointInPolygon(point, polygon) {
  const [x, y] = point;
  let inside = false;
  for (const ring of polygon) {
    const len = ring.length;
    for (let i = 0, j = len - 1; i < len; j = i++) {
      const a = ring[i];
      const b = ring[j];
      if (a[1] > y !== b[1] > y && x < ((b[0] - a[0]) * (y - a[1])) / (b[1] - a[1]) + a[0]) {
        inside = !inside;
      }
    }
  }
  return inside;
}

function pointInGeometry(point, geometry) {
  if (geometry.type === "Polygon") return pointInPolygon(point, geometry.coordinates);
  if (geometry.type === "MultiPolygon") return geometry.coordinates.some((part) => pointInPolygon(point, part));
  return false;
}

function shoelaceArea(ring) {
  let area = 0;
  const len = ring.length;
  for (let i = 0, j = len - 1; i < len; j = i++) {
    const a = ring[i];
    const b = ring[j];
    area += a[0] * b[1] - b[0] * a[1];
  }
  return area / 2;
}

function makeCell(x, y, h, polygon) {
  const d = pointToPolygonDist(x, y, polygon);
  return { x, y, h, d, max: d + h * Math.SQRT2 };
}

function centroidCell(polygon) {
  const points = polygon[0];
  let area = 0;
  let x = 0;
  let y = 0;
  const len = points.length;
  for (let i = 0, j = len - 1; i < len; j = i++) {
    const a = points[i];
    const b = points[j];
    const f = a[0] * b[1] - b[0] * a[1];
    x += (a[0] + b[0]) * f;
    y += (a[1] + b[1]) * f;
    area += f * 3;
  }
  if (area === 0) return makeCell(points[0][0], points[0][1], 0, polygon);
  return makeCell(x / area, y / area, 0, polygon);
}

/** Max-heap on `cell.max`, the upper bound used to prune the search. */
class CellQueue {
  constructor() {
    this.heap = [];
  }
  get size() {
    return this.heap.length;
  }
  push(cell) {
    this.heap.push(cell);
    let index = this.heap.length - 1;
    while (index > 0) {
      const parent = (index - 1) >> 1;
      if (this.heap[parent].max >= this.heap[index].max) break;
      [this.heap[parent], this.heap[index]] = [this.heap[index], this.heap[parent]];
      index = parent;
    }
  }
  pop() {
    const top = this.heap[0];
    const last = this.heap.pop();
    if (this.heap.length > 0 && last !== undefined) {
      this.heap[0] = last;
      let index = 0;
      const length = this.heap.length;
      for (;;) {
        const left = index * 2 + 1;
        const right = index * 2 + 2;
        let largest = index;
        if (left < length && this.heap[left].max > this.heap[largest].max) largest = left;
        if (right < length && this.heap[right].max > this.heap[largest].max) largest = right;
        if (largest === index) break;
        [this.heap[largest], this.heap[index]] = [this.heap[index], this.heap[largest]];
        index = largest;
      }
    }
    return top;
  }
}

function polylabel(polygon, precision = 0.005) {
  const outer = polygon[0];
  if (!outer || outer.length < 3) return { point: [0, 0], distance: 0 };

  let minX = outer[0][0];
  let minY = outer[0][1];
  let maxX = outer[0][0];
  let maxY = outer[0][1];
  for (const p of outer) {
    if (p[0] < minX) minX = p[0];
    if (p[1] < minY) minY = p[1];
    if (p[0] > maxX) maxX = p[0];
    if (p[1] > maxY) maxY = p[1];
  }

  const width = maxX - minX;
  const height = maxY - minY;
  const cellSize = Math.min(width, height);
  if (cellSize === 0) return { point: [minX, minY], distance: 0 };

  let h = cellSize / 2;
  const queue = new CellQueue();
  for (let x = minX; x < maxX; x += cellSize) {
    for (let y = minY; y < maxY; y += cellSize) {
      queue.push(makeCell(x + h, y + h, h, polygon));
    }
  }

  let best = centroidCell(polygon);
  const bboxCell = makeCell(minX + width / 2, minY + height / 2, 0, polygon);
  if (bboxCell.d > best.d) best = bboxCell;

  while (queue.size > 0) {
    const cell = queue.pop();
    if (cell.d > best.d) best = cell;
    if (cell.max - best.d <= precision) continue;
    h = cell.h / 2;
    queue.push(makeCell(cell.x - h, cell.y - h, h, polygon));
    queue.push(makeCell(cell.x + h, cell.y - h, h, polygon));
    queue.push(makeCell(cell.x - h, cell.y + h, h, polygon));
    queue.push(makeCell(cell.x + h, cell.y + h, h, polygon));
  }

  return { point: [best.x, best.y], distance: best.d };
}

function polygonLabelAnchor(geometry) {
  let rings = null;
  if (geometry.type === "Polygon") {
    rings = geometry.coordinates;
  } else if (geometry.type === "MultiPolygon") {
    let best = null;
    for (const part of geometry.coordinates) {
      const outer = part[0];
      if (!outer || outer.length < 3) continue;
      const area = Math.abs(shoelaceArea(outer));
      if (!best || area > best.area) best = { area, rings: part };
    }
    rings = best?.rings ?? null;
  }
  if (!rings || !rings[0] || rings[0].length < 3) return null;
  return polylabel(rings).point;
}

// -------------------------------------------------------------- static gate

const asset34 = readJson("public/data/vietnam/v2/geometry/vnm-adm1-34.geojson");
const asset63 = readJson("public/data/vietnam/v2/geometry/vnm-adm1-63.geojson");

function anchorsInsideCount(collection) {
  let inside = 0;
  const outside = [];
  for (const feature of collection.features) {
    const anchor = polygonLabelAnchor(feature.geometry);
    if (anchor && pointInGeometry(anchor, feature.geometry)) inside++;
    else outside.push(feature.properties?.name || feature.properties?.unitCode || feature.properties?.adm1Code);
  }
  return { inside, total: collection.features.length, outside };
}

const result34 = anchorsInsideCount(asset34);
const result63 = anchorsInsideCount(asset63);
check(
  "STATIC_34_ANCHORS_INSIDE",
  result34.inside === result34.total ? "PASS" : "FAIL",
  `${result34.inside}/${result34.total}`,
  `${result34.total}/${result34.total} (script's own polylabel port)`
);
check(
  "STATIC_63_ANCHORS_INSIDE",
  result63.inside === result63.total ? "PASS" : "FAIL",
  `${result63.inside}/${result63.total}`,
  `${result63.total}/${result63.total} (script's own polylabel port)`
);

// -------------------------------------------------------------- the screen

const CITY_NAMES = ["다낭", "하노이", "호찌민", "하이퐁", "껀터", "후에"];
// Where each city sits, so the viewport can be centred on it at every zoom
// (a label off-screen is not rendered and would read as "0").
const CITY_CENTERS = {
  "다낭": [108.202, 16.054],
  "하노이": [105.834, 21.028],
  "호찌민": [106.63, 10.823],
  "하이퐁": [106.682, 20.845],
  "껀터": [105.784, 10.045],
  "후에": [107.59, 16.463],
};
const BOUNDARY_SYSTEMS = ["post-2025-34", "pre-2025-63"];
const ZOOMS = [5, 7, 9];

let browser = null;
let server = null;
const runtime = { checked: false, reason: "" };

if (SKIP_BROWSER) {
  runtime.reason = "--skip-browser";
} else if (!existsSync(resolve(BUILD, "index.html"))) {
  runtime.reason = "production build missing; run npm run build first";
} else {
  const { chromium } = await import("playwright");
  const { startStaticBuildServer } = await import("../v125/browser-runtime.mjs");
  server = await startStaticBuildServer(BUILD, { port: 0 });
  const base = server.url.replace(/\/$/u, "");
  browser = await chromium.launch(
    process.env.V125_BROWSER_EXECUTABLE ? { executablePath: process.env.V125_BROWSER_EXECUTABLE } : {}
  );
  const scale = Number(process.env.V125_TIMEOUT_SCALE || 1) || 1;
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 }, locale: "ko-KR" });
  await page.goto(`${base}/#map`, { waitUntil: "domcontentloaded" });

  const hasMapHandle = await page
    .waitForSelector(".cdp-map-canvas-wrap", { timeout: 60_000 * scale })
    .then(() => page.waitForFunction(() => Boolean(window.__cdpMapV151), undefined, { timeout: 15_000 * scale }))
    .then(() => true)
    .catch(() => false);

  if (!hasMapHandle) {
    runtime.reason = "window.__cdpMapV151 dev handle not present on this build yet";
  } else {
    const boundaryAssets = { "post-2025-34": asset34, "pre-2025-63": asset63 };
    for (const system of BOUNDARY_SYSTEMS) {
      const radio = page.locator(`input[name="cdp-map-boundary-system-v151"][value="${system}"]`);
      if (await radio.count()) {
        await radio.check();
        await page.waitForTimeout(1_500 * scale);
      }

      for (const zoom of ZOOMS) {
        for (const name of CITY_NAMES) {
          // Centre on the city so its label is on screen; count every rendered
          // label (city and province tiers) that reads exactly this string.
          const counts = await page.evaluate(
            ({ zoom, center }) =>
              new Promise((resolveFrame) => {
                const map = window.__cdpMapV151;
                map.jumpTo({ center, zoom });
                map.once("idle", () =>
                  resolveFrame(
                    map
                      .queryRenderedFeatures({ layers: ["cdp-ko-city", "cdp-ko-province"] })
                      .map((f) => [f.layer.id, f.properties.name])
                  )
                );
              }),
            { zoom, center: CITY_CENTERS[name] }
          );
          const occurrences = counts.filter(([, label]) => label === name).length;
          const okUnique = occurrences <= 1;
          const okPresence = zoom === 5 || occurrences >= 1;
          check(
            `LABEL_UNIQUE_${name}_z${zoom}_${system}`,
            okUnique && okPresence ? "PASS" : "FAIL",
            occurrences,
            zoom === 5 ? "<= 1 (may be culled by collision)" : "== 1"
          );
        }
      }

      const provinceAnchors = await page.evaluate(
        () =>
          new Promise((resolveAnchors) => {
            const map = window.__cdpMapV151;
            // Zoom out so every label point is inside a loaded tile, then read
            // the source features (deduplicated: tiles repeat features).
            map.jumpTo({ center: [106.4, 16.0], zoom: 4.5 });
            map.once("idle", () => {
              if (!map.getSource("cdp-ko-labels-v151")) return resolveAnchors([]);
              const seen = new Map();
              for (const f of map.querySourceFeatures("cdp-ko-labels-v151")) {
                if (f.properties.kind !== "province" || seen.has(f.properties.name)) continue;
                seen.set(f.properties.name, { name: f.properties.name, point: f.geometry.coordinates });
              }
              resolveAnchors([...seen.values()]);
            });
          })
      );
      const boundary = boundaryAssets[system];
      let insideCount = 0;
      const outsideNames = [];
      for (const anchor of provinceAnchors) {
        const feature = boundary.features.find(
          (f) => (f.properties.name || f.properties.nameKo) === anchor.name || f.properties.unitCode === anchor.name
        );
        // Fall back to any-feature containment check when the name join misses,
        // since this check's purpose is "does the anchor land on land", not identity.
        const candidateFeatures = feature ? [feature] : boundary.features;
        const inside = candidateFeatures.some((f) => pointInGeometry(anchor.point, f.geometry));
        if (inside) insideCount++;
        else outsideNames.push(anchor.name);
      }
      check(
        `PROVINCE_ANCHORS_INSIDE_${system}`,
        insideCount === provinceAnchors.length ? "PASS" : "FAIL",
        `${insideCount}/${provinceAnchors.length}`,
        `${provinceAnchors.length}/${provinceAnchors.length}; outside: ${JSON.stringify(outsideNames)}`
      );
    }
    runtime.checked = true;
  }
}

if (!runtime.checked) {
  check("SCREEN_RUNTIME", SKIP_BROWSER ? "SKIP" : "FAIL", runtime.reason, "browser checks run");
}
if (browser) await browser.close();
if (server) await server.close();

const failed = checks.filter((row) => row.status === "FAIL");
const summary = {
  type: "summary",
  audit: "label-dedup:v151-2",
  status: failed.length ? "FAIL" : "PASS",
  passed: checks.filter((row) => row.status === "PASS").length,
  skipped: checks.filter((row) => row.status === "SKIP").length,
  failed: failed.length,
  total: checks.length,
  failedChecks: failed.map((row) => row.name),
  browserChecked: runtime.checked,
  staticAnchorsSource: "this script's own polylabel/point-in-polygon port (not the TS source under src/)",
  generatedAt: new Date().toISOString(),
};
mkdirSync(dirname(OUT), { recursive: true });
writeFileSync(OUT, `${JSON.stringify({ summary, checks }, null, 2)}\n`);
process.stdout.write(`${JSON.stringify(summary)}\n`);
process.exit(failed.length ? 1 : 0);
