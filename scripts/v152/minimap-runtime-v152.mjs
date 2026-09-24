#!/usr/bin/env node
/**
 * V152 mini map runtime check (production build, real Chromium).
 *
 * For the home hero map and each detail id it measures, on the live MapLibre
 * instance (localhost-only handle `window.__cdpMiniMapV152`):
 *   - before intent: static SVG only, no engine chunk requested, no canvas;
 *   - intent (mouse resting 300 ms) turns the engine on;
 *   - Ctrl+wheel zooms, a plain wheel scrolls the page and leaves the map alone
 *     (cooperative gestures), drag pans, the +/−/전체 보기 buttons and the
 *     keyboard (arrows, +/−, Home) move the camera, 전체 보기/Home return to the
 *     first view;
 *   - clicking a feature opens the shared popup and reports the selection;
 *   - scrolling the map off screen releases the instance (map.remove());
 *   - '큰 지도에서 비교' opens the big map on the same camera and slice;
 *   - at 390 px with touch: a tap turns it on, one finger scrolls the page,
 *     two fingers pan and pinch zooms;
 *   - no console errors anywhere.
 *
 *   node scripts/v152/minimap-runtime-v152.mjs --build tmp/build-v152-mini \
 *     [--ids A-023,A-024] [--no-home] [--port 4361]
 * Writes reports/v152/minimap-runtime-v152.json and screenshots under
 * reports/v152/shots/minimap/. Exit code 1 when any check fails.
 */
import { mkdirSync, writeFileSync } from "node:fs";
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
const PORT = Number(opt("--port", "4361"));
const OUT = resolve(ROOT, opt("--out", "reports/v152/minimap-runtime-v152.json"));
const SHOTS = resolve(ROOT, opt("--shots", "reports/v152/shots/minimap"));
const IDS = (opt("--ids", "A-023,A-024,B-004,B-023,B-033,C-025,E-018,B-021") || "")
  .split(",")
  .map((value) => value.trim())
  .filter(Boolean);
const WITH_HOME = !argv.includes("--no-home");
mkdirSync(SHOTS, { recursive: true });

const server = await startStaticBuildServer(BUILD, { port: PORT });
const base = server.url.replace(/\/$/u, "");
const browser = await chromium.launch();
const report = {
  schema: "minimap-runtime-v152",
  generatedAt: new Date().toISOString(),
  build: BUILD.replace(ROOT, "."),
  screens: [],
  touch: [],
  consoleErrors: [],
};

const near = (a, b, tolerance) => Math.abs(a - b) <= tolerance;
/** Layers whose map draws sites (points, D-018 activity sites): the static map shows their icons. */
const SITE_LAYERS_V152 = new Set(["A-023", "A-025", "B-008", "B-012", "B-023", "B-025", "B-028", "B-048", "C-025", "D-018", "E-004", "E-005", "E-006", "E-018", "E-019"]);
const round = (value, digits = 4) => Math.round(value * 10 ** digits) / 10 ** digits;

function watch(page, bucket) {
  const requests = [];
  page.on("console", (message) => {
    if (message.type() === "error") report.consoleErrors.push({ bucket, text: message.text().slice(0, 300) });
  });
  page.on("pageerror", (error) => report.consoleErrors.push({ bucket, text: `pageerror: ${String(error).slice(0, 300)}` }));
  page.on("request", (request) => requests.push(request.url()));
  return requests;
}

async function camera(page) {
  return page.evaluate(() => {
    const map = window.__cdpMiniMapV152;
    if (!map) return null;
    const center = map.getCenter();
    return { lng: center.lng, lat: center.lat, zoom: map.getZoom(), moving: map.isMoving() };
  });
}

async function settle(page, timeout = 4000) {
  const deadline = Date.now() + timeout;
  while (Date.now() < deadline) {
    const state = await camera(page);
    if (state && !state.moving) {
      await page.waitForTimeout(120);
      const again = await camera(page);
      if (again && !again.moving) return again;
    }
    await page.waitForTimeout(80);
  }
  return camera(page);
}

async function rootState(page, scope) {
  return page.evaluate((selector) => {
    const root = document.querySelector(`${selector} [data-testid="minimap-v152"]`);
    return root
      ? {
          state: root.getAttribute("data-minimap-state"),
          selected: root.getAttribute("data-selected-id"),
          canvases: root.querySelectorAll("canvas").length,
          staticSvg: Boolean(root.querySelector(".minimap152__static svg")),
          help: root.querySelector('[data-testid="minimap-help-v152"]')?.textContent || "",
          error: root.querySelector('[data-testid="minimap-engine-v152"]')?.getAttribute("data-minimap-error") || null,
        }
      : null;
  }, scope);
}

async function waitState(page, scope, wanted, timeout = 25000) {
  const deadline = Date.now() + timeout;
  let last = null;
  while (Date.now() < deadline) {
    last = await rootState(page, scope);
    if (last?.state === wanted) return last;
    await page.waitForTimeout(150);
  }
  return last;
}

/**
 * A viewport point on a single (non-cluster) feature of the drawn layer: every
 * vertex of every rendered point/line is tried, then a grid for areas, keeping
 * clear of the controls (top right), the credit line (top left) and the help
 * line (bottom left) that sit over the map.
 */
async function featurePoint(page) {
  return page.evaluate(() => {
    const map = window.__cdpMiniMapV152;
    if (!map) return null;
    const rect = map.getCanvas().getBoundingClientRect();
    // Keep clear of the canvas edge and of the controls that take clicks (read from the DOM).
    const root = map.getCanvas().closest('[data-testid="minimap-v152"]');
    const covers = [...(root?.querySelectorAll(".minimap152__controls") || [])].map((node) => node.getBoundingClientRect());
    const blocked = (x, y) =>
      x < 12 ||
      y < 12 ||
      x > rect.width - 12 ||
      y > rect.height - 12 ||
      covers.some((box) => rect.left + x >= box.left - 8 && rect.left + x <= box.right + 8 && rect.top + y >= box.top - 8 && rect.top + y <= box.bottom + 8);
    const layers = map
      .getStyle()
      .layers.map((layer) => layer.id)
      .filter((id) => /^v126-(point-hit|line-hit)-/u.test(id) || /^v124-fill-/u.test(id));
    if (!layers.length) return null;
    const hitAt = (x, y) => map.queryRenderedFeatures([x, y], { layers }).find((feature) => !feature.properties?.cluster);
    const vertices = (geometry) => {
      if (geometry.type === "Point") return [geometry.coordinates];
      if (geometry.type === "LineString") return geometry.coordinates;
      if (geometry.type === "MultiLineString") return geometry.coordinates.flat();
      return [];
    };
    for (const feature of map.queryRenderedFeatures({ layers })) {
      if (feature.properties?.cluster) continue;
      for (const lngLat of vertices(feature.geometry)) {
        const point = map.project(lngLat);
        if (blocked(point.x, point.y)) continue;
        const hit = hitAt(point.x, point.y);
        if (hit) return { x: rect.left + point.x, y: rect.top + point.y, id: String(hit.properties?.selectionKey ?? hit.properties?.recordId ?? hit.id ?? "") };
      }
    }
    for (let gy = 0.15; gy <= 0.85; gy += 0.05) {
      for (let gx = 0.1; gx <= 0.9; gx += 0.05) {
        const x = rect.width * gx;
        const y = rect.height * gy;
        if (blocked(x, y)) continue;
        const hit = hitAt(x, y);
        if (hit) return { x: rect.left + x, y: rect.top + y, id: String(hit.properties?.selectionKey ?? hit.id ?? "") };
      }
    }
    return null;
  });
}

/** Scroll the map to the middle of the viewport and measure it once the page stops moving. */
async function freshBox(page, locator) {
  let last = null;
  for (let attempt = 0; attempt < 12; attempt += 1) {
    await locator.evaluate((node) => node.scrollIntoView({ block: "center", inline: "nearest" }));
    await page.waitForTimeout(200);
    const box = await locator.boundingBox();
    if (box && last && Math.abs(box.y - last.y) < 1 && Math.abs(box.x - last.x) < 1) return box;
    last = box;
  }
  return last;
}

async function checkScreen({ id, url, scope, openTestId }) {
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, locale: "ko-KR" });
  const page = await context.newPage();
  const bucket = id;
  const requests = watch(page, bucket);
  const result = { id, checks: {}, measurements: {} };
  const check = (name, ok, detail) => {
    result.checks[name] = { ok: Boolean(ok), ...(detail === undefined ? {} : { detail }) };
  };
  try {
    await page.goto(`${base}${url}`, { waitUntil: "domcontentloaded" });
    const root = page.locator(`${scope} [data-testid="minimap-v152"]`);
    await root.waitFor({ state: "attached", timeout: 60000 });
    await root.scrollIntoViewIfNeeded();
    await page.waitForTimeout(1500);
    const before = await rootState(page, scope);
    const engineRequestedEarly = requests.some((url) => url.includes("minimap-engine-v152"));
    check("staticBeforeIntent", before?.state === "static" && before.canvases === 0 && before.staticSvg, before);
    check("noEngineChunkBeforeIntent", !engineRequestedEarly);
    // Site layers draw icons in the static map once the small icon kit arrives;
    // lines and provinces never download it.
    const drawsSites = SITE_LAYERS_V152.has(await root.getAttribute("data-element-id"));
    if (drawsSites) {
      await page.locator(`${scope} [data-testid="detail-map-icon-legend-v152"]`).first().waitFor({ state: "attached", timeout: 15000 }).catch(() => null);
    }
    const staticIcons = await page.evaluate((selector) => {
      const host = document.querySelector(`${selector} [data-testid="minimap-v152"]`);
      return {
        badges: host ? host.querySelectorAll('svg use[href^="#mi152-"]').length : 0,
        legendEntries: document.querySelectorAll(`${selector} [data-testid="detail-map-icon-legend-v152"] li[data-icon-id]`).length,
      };
    }, scope);
    const kitLoaded = requests.some((url) => url.includes("map-icon-kit-v152"));
    result.measurements.staticIcons = { ...staticIcons, kitLoaded, drawsSites };
    check(
      "staticIconsOnlyForSites",
      drawsSites ? kitLoaded && staticIcons.legendEntries > 0 : !kitLoaded && staticIcons.badges === 0,
      result.measurements.staticIcons
    );
    const jsBeforeIntent = requests.filter((url) => url.endsWith(".js")).map((url) => url.replace(/^.*\/static\/js\//u, ""));
    result.measurements.jsBeforeIntent = jsBeforeIntent;

    // Intent: a mouse resting on the map.
    const box = await freshBox(page, root);
    await page.mouse.move(box.x + box.width * 0.45, box.y + box.height * 0.5);
    await page.waitForTimeout(350);
    const activeState = await waitState(page, scope, "active");
    check("activeAfterHoverIntent", activeState?.state === "active", activeState);
    result.measurements.jsAfterIntent = requests
      .filter((url) => url.endsWith(".js"))
      .map((url) => url.replace(/^.*\/static\/js\//u, ""))
      .filter((name) => !jsBeforeIntent.includes(name));
    if (activeState?.state !== "active") throw new Error("engine did not start");
    const initial = await settle(page);
    result.measurements.initial = initial;
    check("helpText", /Ctrl\+스크롤로 확대, 드래그로 이동/u.test(activeState.help), activeState.help);
    await page.screenshot({ path: resolve(SHOTS, `${id}-active-1440.png`) });

    // Ctrl + wheel zooms the map.
    const wheelBox = await freshBox(page, root);
    await page.mouse.move(wheelBox.x + wheelBox.width * 0.45, wheelBox.y + wheelBox.height * 0.5);
    await page.keyboard.down("Control");
    await page.mouse.wheel(0, -400);
    await page.keyboard.up("Control");
    const afterCtrlWheel = await settle(page);
    check("ctrlWheelZoomsIn", afterCtrlWheel.zoom > initial.zoom + 0.2, { before: round(initial.zoom), after: round(afterCtrlWheel.zoom) });

    // A plain wheel scrolls the page, not the map.
    const scrollBefore = await page.evaluate(() => window.scrollY);
    await page.mouse.wheel(0, 240);
    await page.waitForTimeout(500);
    const scrollAfter = await page.evaluate(() => window.scrollY);
    const afterPlainWheel = await settle(page);
    check("plainWheelScrollsPage", scrollAfter !== scrollBefore && near(afterPlainWheel.zoom, afterCtrlWheel.zoom, 0.01), {
      scrollBefore,
      scrollAfter,
      zoomBefore: round(afterCtrlWheel.zoom),
      zoomAfter: round(afterPlainWheel.zoom),
    });
    await root.scrollIntoViewIfNeeded();
    await page.waitForTimeout(300);

    // Drag pans (one step in: the first view shows the whole country and the
    // pan limit rightly keeps it there).
    await page.locator(`${scope} [data-testid="minimap-zoom-in-v152"]`).click();
    await settle(page);
    const box2 = await freshBox(page, root);
    const cx = box2.x + box2.width * 0.45;
    const cy = box2.y + box2.height * 0.55;
    const beforeDrag = await settle(page);
    await page.mouse.move(cx, cy);
    await page.mouse.down();
    await page.mouse.move(cx - 70, cy - 50, { steps: 8 });
    await page.mouse.up();
    const afterDrag = await settle(page);
    check("dragPans", !near(afterDrag.lng, beforeDrag.lng, 1e-4) || !near(afterDrag.lat, beforeDrag.lat, 1e-4), {
      before: [round(beforeDrag.lng), round(beforeDrag.lat)],
      after: [round(afterDrag.lng), round(afterDrag.lat)],
    });

    // Buttons.
    const button = (testId) => page.locator(`${scope} [data-testid="${testId}"]`);
    const zBeforeButtons = (await settle(page)).zoom;
    await button("minimap-zoom-in-v152").click();
    const zIn = (await settle(page)).zoom;
    await button("minimap-zoom-out-v152").click();
    const zOut = (await settle(page)).zoom;
    check("buttonZoomIn", near(zIn, Math.min(12, zBeforeButtons + 1), 0.15), { before: round(zBeforeButtons), after: round(zIn) });
    check("buttonZoomOut", near(zOut, zIn - 1, 0.15), { before: round(zIn), after: round(zOut) });
    await button("minimap-reset-v152").click();
    const afterReset = await settle(page);
    check("resetReturnsToInitialView", near(afterReset.zoom, initial.zoom, 0.05) && near(afterReset.lng, initial.lng, 0.02) && near(afterReset.lat, initial.lat, 0.02), {
      initial: [round(initial.lng), round(initial.lat), round(initial.zoom)],
      reset: [round(afterReset.lng), round(afterReset.lat), round(afterReset.zoom)],
    });

    // Keyboard on the focused canvas (one step in, for the same pan limit).
    await freshBox(page, root);
    await page.locator(`${scope} [data-testid="minimap-engine-v152"] canvas`).focus();
    await page.keyboard.press("Equal");
    const kb0 = await settle(page);
    await page.keyboard.press("ArrowRight");
    await page.keyboard.press("ArrowRight");
    const kbArrow = await settle(page);
    await page.keyboard.press("Equal");
    const kbPlus = await settle(page);
    await page.keyboard.press("Minus");
    const kbMinus = await settle(page);
    await page.keyboard.press("Home");
    const kbHome = await settle(page);
    check("keyboardArrowPans", kbArrow.lng > kb0.lng + 1e-4, { before: round(kb0.lng), after: round(kbArrow.lng) });
    check("keyboardPlusZooms", kbPlus.zoom > kbArrow.zoom + 0.5 || kbArrow.zoom >= 11.99, { before: round(kbArrow.zoom), after: round(kbPlus.zoom) });
    check("keyboardMinusZooms", kbMinus.zoom < kbPlus.zoom - 0.5, { before: round(kbPlus.zoom), after: round(kbMinus.zoom) });
    check("keyboardHomeResets", near(kbHome.zoom, initial.zoom, 0.05) && near(kbHome.lng, initial.lng, 0.02), {
      after: [round(kbHome.lng), round(kbHome.lat), round(kbHome.zoom)],
    });

    // Bounds: zoom range and pan limit.
    const limits = await page.evaluate(() => {
      const map = window.__cdpMiniMapV152;
      const bounds = map.getMaxBounds();
      return {
        minZoom: map.getMinZoom(),
        maxZoom: map.getMaxZoom(),
        maxBounds: bounds ? [bounds.getWest(), bounds.getSouth(), bounds.getEast(), bounds.getNorth()] : null,
        cooperative: Boolean(map.cooperativeGestures?.isEnabled?.()),
      };
    });
    check("zoomRange4to12", limits.minZoom === 4 && limits.maxZoom === 12, limits);
    check("maxBoundsSet", Array.isArray(limits.maxBounds) && limits.maxBounds[0] <= 100.2 && limits.maxBounds[2] >= 111.5, limits.maxBounds);
    check("cooperativeGestures", limits.cooperative, limits.cooperative);

    // Clicking a feature opens the popup and reports the selection. Clusters
    // are clicked like a reader would until single sites show.
    await freshBox(page, root);
    let target = await featurePoint(page);
    for (let attempt = 0; !target && attempt < 4; attempt += 1) {
      const cluster = await page.evaluate(() => {
        const map = window.__cdpMiniMapV152;
        const rect = map.getCanvas().getBoundingClientRect();
        const layers = map.getStyle().layers.map((layer) => layer.id).filter((id) => /^v122-cluster-/u.test(id));
        const controls = [...document.querySelectorAll('[data-testid="minimap-v152"] .minimap152__controls')].map((node) => node.getBoundingClientRect());
        const hit = layers.length ? map.queryRenderedFeatures({ layers }).find((feature) => {
          const point = map.project(feature.geometry.coordinates);
          const vx = rect.left + point.x;
          const vy = rect.top + point.y;
          const underControls = controls.some((box) => vx >= box.left - 8 && vx <= box.right + 8 && vy >= box.top - 8 && vy <= box.bottom + 8);
          return point.x > 16 && point.y > 16 && point.x < rect.width - 16 && point.y < rect.height - 16 && !underControls;
        }) : null;
        if (!hit) return null;
        const point = map.project(hit.geometry.coordinates);
        return { x: rect.left + point.x, y: rect.top + point.y };
      });
      if (!cluster) break;
      await page.mouse.click(cluster.x, cluster.y);
      await settle(page);
      target = await featurePoint(page);
    }
    if (target) {
      await page.mouse.click(target.x, target.y);
      await page.waitForTimeout(400);
      const popup = await page.evaluate((selector) => {
        const node =
          document.querySelector(`${selector} [data-testid="minimap-card-v152"] [data-testid="map-hover-popup-v133"]`) ||
          document.querySelector(`${selector} .maplibregl-popup [data-testid="map-hover-popup-v133"]`);
        const root = document.querySelector(`${selector} [data-testid="minimap-v152"]`);
        return {
          open: Boolean(node),
          text: node?.textContent?.replace(/\s+/gu, " ").trim().slice(0, 200) || null,
          selected: root?.getAttribute("data-selected-id") || null,
          facilityCard: Boolean(document.querySelector(`${selector} [data-testid="facility-card-v153"]`)),
        };
      }, scope);
      check("popupOpensOnClick", popup.open, popup);
      check("selectionReported", Boolean(popup.selected), popup.selected);
      result.measurements.popup = popup;
      await page.screenshot({ path: resolve(SHOTS, `${id}-popup-1440.png`) });
      await page.keyboard.press("Escape");
    } else {
      check("popupOpensOnClick", false, "no clickable feature found in view");
    }

    // Hand-off: after the reader zooms in, the big map opens on that camera and slice.
    await button("minimap-reset-v152").click();
    await settle(page);
    await button("minimap-zoom-in-v152").click();
    const handoffCamera = await settle(page);
    await page.locator(`${scope} [data-testid="${openTestId}"]`).click();
    await page.waitForSelector('[data-testid="map-public-content"]', { timeout: 60000 });
    await page.waitForTimeout(2500);
    const handoff = await page.evaluate(() => {
      const params = new URLSearchParams(location.search);
      const big = window.__cdpMapV151;
      const center = big?.getCenter();
      return {
        view: params.get("view"),
        mapSelectors: params.get("mapSelectors"),
        primary: document.querySelector('[data-testid="map-public-content"]')?.getAttribute("data-primary-element") || null,
        bigCamera: big ? { lng: center.lng, lat: center.lat, zoom: big.getZoom() } : null,
      };
    });
    const viewParts = (handoff.view || "").split(",").map(Number);
    check("handoffPrimaryLayer", handoff.primary === id || id === "home", handoff.primary);
    check(
      "handoffCamera",
      viewParts.length >= 3 &&
        Boolean(handoff.bigCamera) &&
        near(handoff.bigCamera.zoom, handoffCamera.zoom, 0.05) &&
        near(handoff.bigCamera.lng, handoffCamera.lng, 0.01) &&
        near(handoff.bigCamera.lat, handoffCamera.lat, 0.01),
      { mini: [round(handoffCamera.lng), round(handoffCamera.lat), round(handoffCamera.zoom)], url: handoff.view, big: handoff.bigCamera }
    );
    check("handoffSlice", Boolean(handoff.mapSelectors), handoff.mapSelectors);
    await page.goBack({ waitUntil: "domcontentloaded" });

    // Release: off screen -> map.remove().
    await root.waitFor({ state: "attached", timeout: 60000 });
    const releaseBox = await freshBox(page, root);
    await page.mouse.move(releaseBox.x + releaseBox.width * 0.5, releaseBox.y + releaseBox.height * 0.5);
    await page.waitForTimeout(400);
    await waitState(page, scope, "active");
    await page.mouse.move(5, 5);
    // Take the map fully out of view: scroll to the end, else to the top, else shrink the window.
    const offscreen = () =>
      root.evaluate((node) => {
        const box = node.getBoundingClientRect();
        return box.bottom <= 0 || box.top >= window.innerHeight;
      });
    await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
    await page.waitForTimeout(300);
    if (!(await offscreen())) {
      await page.evaluate(() => window.scrollTo(0, 0));
      await page.waitForTimeout(300);
    }
    if (!(await offscreen())) {
      await page.setViewportSize({ width: 1440, height: 240 });
      await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
      await page.waitForTimeout(300);
    }
    result.measurements.releaseOffscreen = await offscreen();
    await page.waitForTimeout(1300);
    const released = await rootState(page, scope);
    const stats = await page.evaluate(() => window.__cdpMiniMapStatsV152 || null);
    check("releasedOffscreen", released?.state === "static" && released.canvases === 0, released);
    check("instancesRemoved", Boolean(stats) && stats.created === stats.removed, stats);
  } catch (error) {
    result.error = String(error?.message || error).slice(0, 300);
  } finally {
    result.consoleErrors = report.consoleErrors.filter((entry) => entry.bucket === bucket).length;
    result.ok = !result.error && result.consoleErrors === 0 && Object.values(result.checks).every((c) => c.ok);
    await context.close();
  }
  return result;
}

async function touchPoint(cdp, type, points) {
  await cdp.send("Input.dispatchTouchEvent", {
    type,
    touchPoints: points.map(([x, y], index) => ({ x, y, id: index + 1, radiusX: 3, radiusY: 3, force: 1 })),
  });
}

async function checkTouch(id) {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
    locale: "ko-KR",
  });
  const page = await context.newPage();
  const bucket = `touch-${id}`;
  watch(page, bucket);
  const result = { id, width: 390, checks: {} };
  const check = (name, ok, detail) => {
    result.checks[name] = { ok: Boolean(ok), ...(detail === undefined ? {} : { detail }) };
  };
  try {
    await page.goto(`${base}/?country=VNM&element=${id}#element-detail`, { waitUntil: "domcontentloaded" });
    const root = page.locator('[data-testid="minimap-v152"]');
    await root.waitFor({ state: "attached", timeout: 60000 });
    await page.waitForTimeout(800);
    const box = await freshBox(page, root);
    await page.touchscreen.tap(box.x + box.width * 0.4, box.y + box.height * 0.5);
    const active = await waitState(page, "", "active");
    check("tapStartsEngine", active?.state === "active", active);
    check("touchHelpText", /두 손가락/u.test(active?.help || ""), active?.help);
    const cdp = await context.newCDPSession(page);
    const b = await freshBox(page, root);
    const cx = b.x + b.width * 0.45;
    const cy = b.y + b.height * 0.5;
    const start = await settle(page);

    // One finger: the page scrolls, the map stays.
    const scrollBefore = await page.evaluate(() => window.scrollY);
    await touchPoint(cdp, "touchStart", [[cx, cy + 60]]);
    for (let step = 1; step <= 6; step += 1) await touchPoint(cdp, "touchMove", [[cx, cy + 60 - step * 20]]);
    await touchPoint(cdp, "touchEnd", []);
    await page.waitForTimeout(600);
    const scrollAfter = await page.evaluate(() => window.scrollY);
    const afterOne = await settle(page);
    check("oneFingerScrollsPage", scrollAfter !== scrollBefore && near(afterOne.lng, start.lng, 1e-3) && near(afterOne.lat, start.lat, 1e-3), {
      scrollBefore,
      scrollAfter,
    });
    await page.locator('[data-testid="minimap-zoom-in-v152"]').tap();
    await settle(page);
    const b2 = await freshBox(page, root);
    const px = b2.x + b2.width * 0.45;
    const py = b2.y + b2.height * 0.5;

    // Two fingers move together: pan.
    const beforePan = await settle(page);
    await touchPoint(cdp, "touchStart", [[px - 30, py], [px + 30, py]]);
    for (let step = 1; step <= 8; step += 1) await touchPoint(cdp, "touchMove", [[px - 30 + step * 8, py + step * 4], [px + 30 + step * 8, py + step * 4]]);
    await touchPoint(cdp, "touchEnd", []);
    const afterPan = await settle(page);
    check("twoFingerPan", !near(afterPan.lng, beforePan.lng, 1e-4) || !near(afterPan.lat, beforePan.lat, 1e-4), {
      before: [round(beforePan.lng), round(beforePan.lat)],
      after: [round(afterPan.lng), round(afterPan.lat)],
    });

    // Two fingers apart: pinch zoom.
    const beforePinch = await settle(page);
    await touchPoint(cdp, "touchStart", [[px - 20, py], [px + 20, py]]);
    for (let step = 1; step <= 8; step += 1) await touchPoint(cdp, "touchMove", [[px - 20 - step * 10, py], [px + 20 + step * 10, py]]);
    await touchPoint(cdp, "touchEnd", []);
    const afterPinch = await settle(page);
    check("pinchZooms", afterPinch.zoom > beforePinch.zoom + 0.3, { before: round(beforePinch.zoom), after: round(afterPinch.zoom) });
    await page.screenshot({ path: resolve(SHOTS, `${id}-touch-390.png`) });
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    check("noHorizontalOverflow390", overflow <= 0, overflow);
  } catch (error) {
    result.error = String(error?.message || error).slice(0, 300);
  } finally {
    result.consoleErrors = report.consoleErrors.filter((entry) => entry.bucket === bucket).length;
    result.ok = !result.error && result.consoleErrors === 0 && Object.values(result.checks).every((c) => c.ok);
    await context.close();
  }
  return result;
}

try {
  if (WITH_HOME) {
    const home = await checkScreen({ id: "home", url: "/", scope: '[data-testid="home-hero-map-v139"]', openTestId: "home-hero-map-link-v139" });
    report.screens.push(home);
    console.log(`home ok=${home.ok}${home.error ? ` error=${home.error}` : ""}`);
  }
  for (const id of IDS) {
    const screen = await checkScreen({
      id,
      url: `/?country=VNM&element=${id}#element-detail`,
      scope: '[data-testid="detail-map-slot-v153"]',
      openTestId: "detail-map-open-v152",
    });
    report.screens.push(screen);
    const failed = Object.entries(screen.checks).filter(([, c]) => !c.ok).map(([name]) => name);
    console.log(`${id} ok=${screen.ok}${failed.length ? ` failed=${failed.join(",")}` : ""}${screen.error ? ` error=${screen.error}` : ""}`);
  }
  for (const id of IDS.slice(0, 2)) {
    const touch = await checkTouch(id);
    report.touch.push(touch);
    const failed = Object.entries(touch.checks).filter(([, c]) => !c.ok).map(([name]) => name);
    console.log(`touch ${id} ok=${touch.ok}${failed.length ? ` failed=${failed.join(",")}` : ""}${touch.error ? ` error=${touch.error}` : ""}`);
  }
} finally {
  await browser.close();
  await server.close();
}

const all = [...report.screens, ...report.touch];
report.summary = {
  screens: report.screens.length,
  touch: report.touch.length,
  failed: all.filter((entry) => !entry.ok).map((entry) => entry.id),
  consoleErrors: report.consoleErrors.length,
};
mkdirSync(dirname(OUT), { recursive: true });
writeFileSync(OUT, `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify({ type: "summary", ...report.summary, out: OUT.replace(ROOT, ".") }));
process.exit(report.summary.failed.length || report.summary.consoleErrors ? 1 : 0);
