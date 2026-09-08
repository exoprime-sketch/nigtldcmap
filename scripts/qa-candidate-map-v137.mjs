#!/usr/bin/env node
/**
 * Map QA against the candidate build.
 *
 * The point of this script is to establish that the object under the pointer is
 * the object the popup names and the object the right-hand panel then describes,
 * and that its value matches what the candidate data says it should be. Nothing
 * here treats the existence of a canvas, or the successful dispatch of a click,
 * as evidence of anything.
 *
 * Replaces the earlier collector, which passed a layer when a <canvas> existed,
 * picked list buttons with includes("") on an empty label, hovered four fixed
 * offsets from the canvas centre, clicked the centre regardless of where the
 * hover had succeeded, reported any text change from the first <select> as a
 * period change, and waited with sleep() instead of a readiness signal.
 *
 * Expected targets come from the candidate's own data files, never from the
 * screen's computation of them. Feature identity and screen position come from
 * MapLibre through a read-only observer the app attaches on localhost only.
 */

import { mkdirSync, writeFileSync, readFileSync, readdirSync, existsSync } from "node:fs";
import { resolve, relative, sep } from "node:path";
import { createHash } from "node:crypto";
import { gunzipSync } from "node:zlib";

import {
  startStaticBuildServer,
  launchHeadlessBrowser,
  navigate,
  evaluateValue,
  setViewport,
} from "./v125/browser-runtime.mjs";

const ROOT = resolve(import.meta.dirname, "..");
const argv = process.argv.slice(2);
const opt = (name, fallback) => {
  const index = argv.indexOf(name);
  return index < 0 ? fallback : argv[index + 1];
};
const BUILD = resolve(ROOT, opt("--build-root", ".verify/candidate/build"));
const DATA = resolve(BUILD, "data/vietnam/v2");
const OUT = resolve(ROOT, opt("--out", "reports/final-data-integration/map-qa"));
const WIDTH = Number(opt("--width", "1440"));
const HEIGHT = Number(opt("--height", "1000"));

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const readJson = (path) => JSON.parse(readFileSync(path, "utf8"));
const digest = (buffer) => createHash("sha256").update(buffer).digest("hex");
const json = (value) => JSON.stringify(value);

class MapQaError extends Error {}

/* ------------------------------------------------------------------ *
 * Expected targets, taken from the candidate data
 * ------------------------------------------------------------------ */

function packRecords() {
  const dir = resolve(DATA, "packs");
  const byElement = new Map();
  for (const file of readdirSync(dir).filter((n) => n.startsWith("vnm-v124-pack-"))) {
    const envelope = readJson(resolve(dir, file));
    const payload = JSON.parse(
      gunzipSync(Buffer.from(envelope.payloadChunks.join(""), "base64")).toString("utf8")
    );
    for (const elementId of payload.elementIds || []) {
      byElement.set(
        elementId,
        ((payload.elements[elementId] || {}).entities || {}).records || []
      );
    }
  }
  return byElement;
}

/**
 * One representative target per geometry kind, plus the value the candidate
 * data says the map should be showing for it.
 */
function buildExpectedTargets() {
  const packs = packRecords();
  const targets = [];

  // Polygon: an ADM1 province carrying a published spatial value.
  const spatialPath = resolve(DATA, "spatial/layers/b-034.json");
  if (existsSync(spatialPath)) {
    const layer = readJson(spatialPath);
    const first = (layer.values || [])[0];
    if (first) {
      targets.push({
        elementId: "B-034",
        geometryKind: "polygon",
        expectedKey: first.adm1Code,
        expectedName: first.adm1Name,
        expectedValue: first.value,
        expectedUnit: first.unit,
        expectedPeriod: first.period,
        expectedVariableLabel: first.variableLabel,
        expectedSource: "spatial/layers/b-034.json",
      });
    }
  }

  // Point: a facility with real coordinates in the entity pack.
  const mines = packs.get("B-048") || [];
  const mine = mines.find((r) => Number.isFinite(r.latitude) && Number.isFinite(r.longitude));
  if (mine) {
    targets.push({
      elementId: "B-048",
      geometryKind: "point",
      expectedKey: mine.recordId,
      expectedName: mine.name,
      expectedValue: (mine.normalizedAttributes || {})["광종"] ?? null,
      expectedUnit: null,
      expectedPeriod: null,
      expectedVariableLabel: "광종",
      expectedLngLat: [mine.longitude, mine.latitude],
      expectedSource: "packs entity B-048",
    });
  }

  // Line: a transmission segment. These come from the World Bank geometry asset
  // the map actually draws, not from the A-024 entity pack: the pack's 722
  // records are keyed v124-a-024-entity-*, while the 606 rendered lines are
  // keyed A-024-WB2016-*. Taking the target from the pack asked the map for a
  // feature it never had.
  const linePath = resolve(DATA, "geometry/vnm-transmission-network.geojson");
  if (existsSync(linePath)) {
    const collection = readJson(linePath);
    const feature = (collection.features || [])[0];
    if (feature) {
      const properties = feature.properties || {};
      targets.push({
        elementId: "A-024",
        geometryKind: "line",
        expectedKey: properties.featureId,
        expectedName: properties.featureId,
        expectedValue: properties.lengthKm ?? null,
        expectedUnit: properties.lengthUnit ?? "km",
        expectedPeriod: null,
        expectedVariableLabel: "선로 길이",
        expectedSource: "geometry/vnm-transmission-network.geojson",
      });
    }
  }

  return targets;
}

/* ------------------------------------------------------------------ *
 * Browser-side reads
 * ------------------------------------------------------------------ */

const OBSERVER_PRESENT = `Boolean(window.__nigtMapObserverV137)`;
const OBSERVER_READY = `Boolean(window.__nigtMapObserverV137 && window.__nigtMapObserverV137.ready())`;

const READ_SURFACES = `(() => {
  const text = (el) => (el && el.textContent || "").replace(/\\s+/g, " ").trim();
  const popup = document.querySelector('[data-testid="map-hover-popup-v133"]')
    || document.querySelector(".maplibregl-popup-content");
  return {
    maplibrePopup: text(popup),
    // The SVG fallback renders its own tooltip. Kept separate so a fallback
    // reading is never counted as a MapLibre popup.
    fallbackTooltip: text(document.querySelector('[data-testid="map-feature-tooltip"]')),
    // The selected-feature panel is what the app actually renders on click.
    // An earlier draft read [data-testid="map-focus-summary-v133"], which is not
    // present, so every click looked like it had failed.
    focusPanel: [
      '[data-testid="map-selected-feature-panel"]',
      '[data-testid="map-feature-detail"]',
      '[data-testid="map-analysis-panel"]',
    ].map((sel) => text(document.querySelector(sel))).join(" ").slice(0, 1600),
    hasCanvas: Boolean(document.querySelector("canvas.maplibregl-canvas")),
  };
})()`;

async function waitFor(cdp, expression, timeoutMs, label) {
  const deadline = Date.now() + timeoutMs;
  let last = null;
  while (Date.now() < deadline) {
    last = await evaluateValue(cdp, expression);
    if (last) return last;
    await sleep(250);
  }
  throw new MapQaError(`TIMEOUT_WAITING_FOR ${label}`);
}

async function mouse(cdp, type, x, y, extra = {}) {
  await cdp.send("Input.dispatchMouseEvent", {
    type,
    x: Math.round(x),
    y: Math.round(y),
    button: extra.button ?? "none",
    buttons: extra.buttons ?? 0,
    clickCount: extra.clickCount ?? 0,
    pointerType: "mouse",
  });
}

/** Real pointer press on an element located by its own rect. */
async function clickSelector(cdp, selector) {
  const rect = await evaluateValue(
    cdp,
    `(() => {
      const el = document.querySelector(${json(selector)});
      if (!el) return null;
      el.scrollIntoView({ block: "center", inline: "center" });
      const r = el.getBoundingClientRect();
      if (r.width <= 0 || r.height <= 0) return null;
      return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
    })()`
  );
  if (!rect) throw new MapQaError(`CONTROL_NOT_HITTABLE ${selector}`);
  await mouse(cdp, "mouseMoved", rect.x, rect.y);
  await mouse(cdp, "mousePressed", rect.x, rect.y, { button: "left", buttons: 1, clickCount: 1 });
  await mouse(cdp, "mouseReleased", rect.x, rect.y, { button: "left", buttons: 0, clickCount: 1 });
  return rect;
}

/** Does this text actually identify the expected target? */
function identifies(text, target) {
  if (!text) return false;
  const haystack = text.replace(/\s+/gu, " ");
  const name = String(target.expectedName || "").trim();
  if (name && haystack.includes(name)) return true;
  const key = String(target.expectedKey || "").trim();
  return Boolean(key) && haystack.includes(key);
}

/* ------------------------------------------------------------------ *
 * One target
 * ------------------------------------------------------------------ */

async function reviewTarget(cdp, base, target, shots) {
  const row = {
    elementId: target.elementId,
    geometryKind: target.geometryKind,
    expectedKey: target.expectedKey,
    expectedName: target.expectedName,
    expectedValue: target.expectedValue,
    expectedSource: target.expectedSource,
    renderer: "UNKNOWN",
    layerSelected: "NO",
    layerRendered: "NO",
    targetPresentInRender: "NO",
    hitPointResolved: "NO",
    occludedBy: "",
    hoverPopupIdentifiesTarget: "NO",
    clickPanelIdentifiesTarget: "NO",
    hoverAndPanelAgree: "NO",
    expectedVariableSelected: "NOT_ATTEMPTED",
    expectedPeriodSelected: "NOT_ATTEMPTED",
    controlChangedResult: "NOT_ATTEMPTED",
    expectedValueObserved: "NOT_CHECKED",
    evidence: "NO",
    note: "",
  };

  await navigate(cdp, `${base}/?view=map&country=VNM#map`);
  await waitFor(cdp, OBSERVER_PRESENT, 45000, "map observer");
  await waitFor(cdp, OBSERVER_READY, 45000, "map style + tiles");
  row.renderer = "MAPLIBRE";

  // 1. Select this dataset by its own element id, through the real control.
  const button = `[data-testid="map-all-data-layer-v135"][data-element-id="${target.elementId}"]`;
  await clickSelector(cdp, button);
  const pressed = await waitFor(
    cdp,
    `(() => { const b = document.querySelector(${json(button)});
      return Boolean(b && b.getAttribute("aria-pressed") === "true"); })()`,
    20000,
    `aria-pressed on ${target.elementId}`
  );
  row.layerSelected = pressed ? "YES" : "NO";

  // 2. The layer has to be rendered, not merely requested.
  const rendered = await waitFor(
    cdp,
    `(() => { const o = window.__nigtMapObserverV137;
      return o ? o.renderedFeatures(${json(target.elementId)}).length : 0; })()`,
    45000,
    `rendered features for ${target.elementId}`
  );
  row.layerRendered = rendered > 0 ? "YES" : "NO";
  row.note = `renderedFeatures=${rendered}`;

  // 3. The specific expected target has to be among what is rendered.
  const match = await evaluateValue(
    cdp,
    `(() => {
      const o = window.__nigtMapObserverV137;
      const list = o.renderedFeatures(${json(target.elementId)});
      const key = ${json(String(target.expectedKey || ""))};
      const name = ${json(String(target.expectedName || ""))};
      const hit = list.find((f) => f.selectionKey === key)
        || list.find((f) => name && f.name === name)
        || list.find((f) => name && f.properties && f.properties.adm1Name === name);
      return hit ? { selectionKey: hit.selectionKey, name: hit.name, geometryType: hit.geometryType, isCluster: hit.isCluster } : null;
    })()`
  );
  if (!match) {
    row.note += "; expected target not among rendered features";
    return row;
  }
  row.targetPresentInRender = "YES";
  row.note += `; matched ${match.selectionKey || match.name} (${match.geometryType})`;

  // 3b. Put the map on the variable the expected value belongs to, before
  //     comparing anything. B-034 renders 탄소 저장량 by default while the
  //     expected row is 산림탄소 총배출(연평균): comparing without selecting it
  //     comes down to reading one variable and checking it against another.
  if (target.expectedVariableLabel) {
    const chosen = await evaluateValue(
      cdp,
      `(() => {
        const el = document.querySelector('[data-testid="map-layer-variable-select"]');
        if (!el) return "NO_CONTROL";
        const want = ${json(String(target.expectedVariableLabel))};
        const option = [...el.options].find((o) => (o.textContent || "").trim() === want)
          || [...el.options].find((o) => (o.textContent || "").includes(want));
        if (!option) return "OPTION_ABSENT";
        if (el.value === option.value) return "ALREADY_SELECTED";
        const setter = Object.getOwnPropertyDescriptor(
          window.HTMLSelectElement.prototype, "value").set;
        setter.call(el, option.value);
        el.dispatchEvent(new Event("change", { bubbles: true }));
        return el.value === option.value ? "SELECTED" : "REJECTED";
      })()`
    );
    row.expectedVariableSelected = chosen;
    if (chosen === "SELECTED") await sleep(1500);
  }
  if (target.expectedPeriod) {
    const chosen = await evaluateValue(
      cdp,
      `(() => {
        const el = document.querySelector('[data-testid="map-layer-period-select"]');
        if (!el) return "NO_CONTROL";
        const want = ${json(String(target.expectedPeriod))};
        const option = [...el.options].find((o) => (o.textContent || "").includes(want));
        if (!option) return "OPTION_ABSENT";
        if (el.value === option.value) return "ALREADY_SELECTED";
        const setter = Object.getOwnPropertyDescriptor(
          window.HTMLSelectElement.prototype, "value").set;
        setter.call(el, option.value);
        el.dispatchEvent(new Event("change", { bubbles: true }));
        return el.value === option.value ? "SELECTED" : "REJECTED";
      })()`
    );
    row.expectedPeriodSelected = chosen;
    if (chosen === "SELECTED") await sleep(1500);
  }

  // 4. A screen point the renderer agrees is this feature. Probing rather than
  //    projecting a centroid: a centroid can miss a concave province entirely.
  const point = await evaluateValue(
    cdp,
    `(() => { const o = window.__nigtMapObserverV137;
      return o.hitPointFor(${json(target.elementId)}, ${json(String(match.selectionKey))}); })()`
  );
  if (!point) {
    row.note += "; no screen point resolves to this feature";
    return row;
  }
  row.hitPointResolved = "YES";
  row.occludedBy = point.occludedBy || "";

  // 5. Hover exactly there and read the MapLibre popup.
  await mouse(cdp, "mouseMoved", point.x, point.y);
  await sleep(700);
  const afterHover = await evaluateValue(cdp, READ_SURFACES);
  row.hoverPopupIdentifiesTarget = identifies(afterHover.maplibrePopup, target) ? "YES" : "NO";
  if (afterHover.fallbackTooltip && !afterHover.maplibrePopup) {
    row.renderer = "SVG_FALLBACK";
    row.note += "; fallback tooltip only";
  }
  if (row.hoverPopupIdentifiesTarget === "NO") {
    row.note += `; popup=${json(afterHover.maplibrePopup.slice(0, 90))}`;
  }

  // 6. Click the same point and read the right-hand panel.
  await mouse(cdp, "mousePressed", point.x, point.y, { button: "left", buttons: 1, clickCount: 1 });
  await mouse(cdp, "mouseReleased", point.x, point.y, { button: "left", buttons: 0, clickCount: 1 });
  await sleep(1200);
  const afterClick = await evaluateValue(cdp, READ_SURFACES);
  row.clickPanelIdentifiesTarget = identifies(afterClick.focusPanel, target) ? "YES" : "NO";
  row.hoverAndPanelAgree =
    row.hoverPopupIdentifiesTarget === "YES" && row.clickPanelIdentifiesTarget === "YES"
      ? "YES"
      : "NO";

  // 7. The value the candidate data says this target holds must appear.
  if (target.expectedValue !== null && target.expectedValue !== undefined) {
    const surfaces = `${afterClick.focusPanel} ${afterClick.maplibrePopup}`.replace(/\s+/gu, " ");
    const raw = String(target.expectedValue);
    const numeric = Number(target.expectedValue);
    const forms = [raw];
    if (Number.isFinite(numeric)) {
      forms.push(numeric.toLocaleString("ko-KR"), numeric.toLocaleString("en-US"), String(Math.round(numeric)));
    }
    row.expectedValueObserved = forms.some((form) => form && surfaces.includes(form))
      ? "YES"
      : "NO";
    if (row.expectedValueObserved === "NO") {
      row.note += `; expected value ${raw} not found on surfaces`;
    }
  }

  // 8. The real variable/period control, addressed by its own test id rather
  //    than by taking whichever <select> happens to come first.
  const controlInfo = await evaluateValue(
    cdp,
    `(() => {
      const el = document.querySelector('[data-testid="map-layer-variable-select"]')
        || document.querySelector('[data-testid="map-layer-period-select"]');
      if (!el) return null;
      return {
        testId: el.getAttribute("data-testid"),
        value: el.value,
        options: [...el.options].map((o) => ({ value: o.value, label: (o.textContent || "").trim() })),
      };
    })()`
  );
  if (!controlInfo) {
    row.controlChangedResult = "NO_CONTROL_PRESENT";
  } else {
    const next = controlInfo.options.find((o) => o.value !== controlInfo.value);
    if (!next) {
      row.controlChangedResult = "SINGLE_OPTION";
    } else {
      const before = await evaluateValue(cdp, READ_SURFACES);
      const applied = await evaluateValue(
        cdp,
        `(() => {
          const el = document.querySelector('[data-testid="${controlInfo.testId}"]');
          if (!el) return "GONE";
          const setter = Object.getOwnPropertyDescriptor(
            window.HTMLSelectElement.prototype, "value").set;
          setter.call(el, ${json(next.value)});
          el.dispatchEvent(new Event("change", { bubbles: true }));
          return el.value === ${json(next.value)} ? "SET" : "REJECTED";
        })()`
      );
      await sleep(1500);
      const after = await evaluateValue(cdp, READ_SURFACES);
      row.controlChangedResult =
        applied !== "SET"
          ? `CONTROL_DID_NOT_TAKE_VALUE:${applied}`
          : after.focusPanel !== before.focusPanel
            ? `CHANGED_TO:${next.label}`.slice(0, 60)
            : "NO_VISIBLE_EFFECT";
    }
  }

  const shot = await cdp.send("Page.captureScreenshot", { format: "png" });
  const bytes = Buffer.from(shot.data, "base64");
  const file = resolve(shots, `map-${target.elementId.toLowerCase()}-${target.geometryKind}.png`);
  writeFileSync(file, bytes);
  row.evidence = bytes.subarray(0, 8).toString("hex") === "89504e470d0a1a0a" ? "YES" : "INVALID_PNG";
  row.screenshot = relative(OUT, file).split(sep).join("/");
  row.screenshotSha256 = digest(bytes);
  return row;
}

/* ------------------------------------------------------------------ *
 * Run
 * ------------------------------------------------------------------ */

async function main() {
  const shots = resolve(OUT, "screenshots");
  mkdirSync(shots, { recursive: true });
  const targets = buildExpectedTargets();
  if (!targets.length) throw new MapQaError("NO_EXPECTED_TARGETS_BUILT");

  const server = await startStaticBuildServer(BUILD);
  const browser = await launchHeadlessBrowser();
  const cdp = browser.cdp;
  const base = server.url.replace(/\/$/, "");
  await setViewport(cdp, WIDTH, HEIGHT);

  const rows = [];
  for (const target of targets) {
    const started = browser.runtimeErrors?.length || 0;
    let row;
    try {
      row = await reviewTarget(cdp, base, target, shots);
      row.status = "REVIEWED";
    } catch (error) {
      row = {
        elementId: target.elementId,
        geometryKind: target.geometryKind,
        status: error instanceof MapQaError ? "HARNESS_ERROR" : "APP_ERROR",
        note: String(error.message || error).slice(0, 200),
      };
    }
    row.pageRuntimeEvents = (browser.runtimeErrors || []).slice(started).length;
    rows.push(row);
    process.stderr.write(
      `  ${row.elementId} (${row.geometryKind}): selected=${row.layerSelected} ` +
        `target=${row.targetPresentInRender} hover=${row.hoverPopupIdentifiesTarget} ` +
        `panel=${row.clickPanelIdentifiesTarget} value=${row.expectedValueObserved}\n`
    );
  }

  const columns = [
    "elementId", "geometryKind", "status", "renderer", "expectedKey", "expectedName",
    "expectedValue", "expectedSource", "layerSelected", "layerRendered",
    "targetPresentInRender", "hitPointResolved", "occludedBy",
    "hoverPopupIdentifiesTarget", "clickPanelIdentifiesTarget", "hoverAndPanelAgree",
    "expectedVariableSelected", "expectedPeriodSelected",
    "controlChangedResult", "expectedValueObserved", "evidence", "screenshot",
    "screenshotSha256", "pageRuntimeEvents", "note",
  ];
  const cell = (v) => `"${String(v ?? "").replaceAll('"', '""')}"`;
  writeFileSync(
    resolve(OUT, "map-target-review-v137.csv"),
    `${columns.join(",")}\n${rows.map((r) => columns.map((c) => cell(r[c])).join(",")).join("\n")}\n`,
    "utf8"
  );
  const summary = {
    schema: "nigt-map-target-review-1",
    generatedAt: new Date().toISOString(),
    buildRoot: relative(ROOT, BUILD).split(sep).join("/"),
    viewport: { width: WIDTH, height: HEIGHT },
    targetsReviewed: rows.length,
    fullChainVerified: rows.filter((r) => r.hoverAndPanelAgree === "YES").length,
    expectedValueObserved: rows.filter((r) => r.expectedValueObserved === "YES").length,
    harnessErrors: rows.filter((r) => r.status === "HARNESS_ERROR").length,
    appErrors: rows.filter((r) => r.status === "APP_ERROR").length,
    meaning:
      "Identity is compared between the pointer target, the popup and the panel. " +
      "Canvas presence and click dispatch are never treated as success.",
    rows,
  };
  writeFileSync(resolve(OUT, "map-target-review-v137.json"), `${JSON.stringify(summary, null, 2)}\n`, "utf8");
  console.log(JSON.stringify({ ...summary, rows: undefined }, null, 2));

  await browser.close();
  await server.close();
  return summary.harnessErrors ? 2 : 0;
}

main().then((code) => process.exit(code));
