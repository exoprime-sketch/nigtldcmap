#!/usr/bin/env node
/**
 * What each recommended analysis and the comparison view actually say.
 *
 * The presets and the comparison have a passing structural audit, but that
 * audit never read the screen. This opens each of the five presets on the
 * candidate build, drives them the way a reader does, and records the legend,
 * the notice, the rendered layers and what the right-hand panel says - so the
 * meaning review has something to read against the source.
 */
import { resolve } from "node:path";
import { mkdirSync, writeFileSync } from "node:fs";
import {
  startStaticBuildServer,
  launchHeadlessBrowser,
  navigate,
  evaluateValue,
  setViewport,
} from "../v125/browser-runtime.mjs";
import { pollUntil, pointerClick, elementPoint } from "./map-qa-input.mjs";

const ROOT = resolve(import.meta.dirname, "../..");
const argv = process.argv.slice(2);
const opt = (name, fallback) => {
  const index = argv.indexOf(name);
  return index < 0 ? fallback : argv[index + 1];
};
const BUILD = resolve(ROOT, opt("--build", ".verify/candidate/build"));
const OUT = resolve(ROOT, opt("--out", "reports/final-data-integration/map-qa"));
const WIDTH = Number(opt("--width", "1440"));

const READ = `(() => {
  const lines = (el) => el
    ? (el.innerText || "").split(String.fromCharCode(10)).map(function (s) { return s.trim(); }).filter(Boolean)
    : [];
  const observer = window.__nigtMapObserverV137;
  const primaryElementId = (document.querySelector('[data-testid="map-public-content"]') || { getAttribute: function () { return null; } })
    .getAttribute('data-primary-element');
  const layers = observer && observer.ready() && primaryElementId
    ? observer.layersFor(primaryElementId)
    : null;
  return {
    notice: lines(document.querySelector('[role="status"].cdp-map-role-notice, [data-testid="map-public-content"] [role="status"]')).join(" | "),
    focus: lines(document.querySelector('[data-testid="map-focus-summary-v133"]')),
    legend: lines(document.querySelector('[data-testid="map-legend"], .cdp-map-legend')),
    panel: lines(document.querySelector('[data-testid="map-analysis-panel"]')).slice(0, 30),
    activePreset: (document.querySelector('[data-map-preset]') || { getAttribute: function () { return null; } }).getAttribute('data-map-preset'),
    selectedLayers: [...document.querySelectorAll('[data-testid="map-all-data-layer-v135"][aria-pressed="true"]')]
      .map(function (el) { return (el.textContent || "").trim().replace(/\s+/gu, " ").slice(0, 60); }),
    primaryElementId: primaryElementId,
    renderedLayerIds: layers ? layers.map(function (l) { return l.id || l; }) : null
  };
})()`;

async function main() {
  const server = await startStaticBuildServer(BUILD);
  const browser = await launchHeadlessBrowser();
  const cdp = browser.cdp;
  await setViewport(cdp, WIDTH, 1000);
  const rows = [];

  await navigate(cdp, `${server.url.replace(/\/$/, "")}/?view=map&country=VNM#map`);
  await pollUntil(
    () => evaluateValue(cdp, `Boolean(window.__nigtMapObserverV137 && window.__nigtMapObserverV137.ready())`),
    (value) => value === true,
    { timeoutMs: 30000, label: "map ready" }
  );

  const presetIds = await evaluateValue(
    cdp,
    `[...document.querySelectorAll('[data-testid="map-analysis-preset"]')].map(function (el) { return el.getAttribute('data-preset-id'); })`
  );

  for (const presetId of presetIds || []) {
    const selector = `[data-testid="map-analysis-preset"][data-preset-id="${presetId}"]`;
    const point = await elementPoint(cdp, evaluateValue, selector);
    if (!point) {
      rows.push({ presetId, verdict: "PRESET_NOT_HITTABLE" });
      continue;
    }
    await pointerClick(cdp, point.x, point.y);
    const applied = await pollUntil(
      () =>
        evaluateValue(
          cdp,
          `(document.querySelector('[data-map-preset]') || { getAttribute: function () { return null; } }).getAttribute('data-map-preset')`
        ),
      (value) => value === presetId,
      { timeoutMs: 10000, label: "preset applied" }
    );
    await pollUntil(
      () => evaluateValue(cdp, `Boolean(window.__nigtMapObserverV137 && window.__nigtMapObserverV137.ready())`),
      (value) => value === true,
      { timeoutMs: 20000, label: "map settled" }
    );
    // The observer settles a frame after the layer swap; reading it in the same
    // tick reported a preset as drawing nothing.
    await pollUntil(
      () =>
        evaluateValue(
          cdp,
          `(() => {
            const root = document.querySelector('[data-testid="map-public-content"]');
            const observer = window.__nigtMapObserverV137;
            const elementId = root && root.getAttribute('data-primary-element');
            if (!observer || !observer.ready() || !elementId) return 0;
            return observer.renderedFeatures(elementId).length;
          })()`
        ),
      (value) => typeof value === "number" && value > 0,
      { timeoutMs: 12000, label: "features rendered" }
    );
    const read = await evaluateValue(cdp, READ);
    // What the map is actually drawing for the preset's primary layer.
    const features = await evaluateValue(
      cdp,
      `(() => {
        const observer = window.__nigtMapObserverV137;
        if (!observer || !observer.ready()) return null;
        const elementId = (document.querySelector('[data-testid="map-public-content"]') || { getAttribute: function () { return null; } })
          .getAttribute('data-primary-element');
        if (!elementId) return { count: 0, sample: [], elementId: null };
        const rendered = observer.renderedFeatures(elementId);
        return {
          elementId: elementId,
          count: rendered.length,
          sample: rendered.slice(0, 3).map(function (item) {
            return { layer: item.layerId, key: item.selectionKey, label: item.label };
          })
        };
      })()`
    );
    // A preset names two or three layers and shows one; the rest sit behind
    // 함께 보기. Pressing it is part of the preset, so the review records what
    // it does rather than assuming.
    let context = { toggled: false };
    const togglePoint = await elementPoint(
      cdp,
      evaluateValue,
      '[data-testid="map-context-toggle-v133"][aria-pressed="false"]'
    );
    if (togglePoint) {
      await pointerClick(cdp, togglePoint.x, togglePoint.y);
      const added = await pollUntil(
        () =>
          evaluateValue(
            cdp,
            `(document.querySelector('[data-testid="map-public-content"]') || { getAttribute: function () { return null; } }).getAttribute('data-rendered-map-elements')`
          ),
        (value) => Boolean(value) && value !== read.primaryElementId,
        { timeoutMs: 10000, label: "context rendered" }
      );
      context = { toggled: true, renderedAfterToggle: added.value ?? null, ok: added.ok };
    }
    rows.push({ presetId, applied: applied.ok, ...read, features, context });
    console.log(
      `${presetId} | applied=${applied.ok} | layers=${(read.selectedLayers || []).length}` +
        ` | rendered=${features ? features.count : "-"} | context=${context.renderedAfterToggle || "-"}`
    );
  }

  // The comparison view, opened the way the page offers it.
  const comparePoint = await elementPoint(cdp, evaluateValue, '[data-testid="map-compare-open-v135"]');
  let compare = { verdict: "COMPARE_BUTTON_NOT_HITTABLE" };
  if (comparePoint) {
    await pointerClick(cdp, comparePoint.x, comparePoint.y);
    const opened = await pollUntil(
      () =>
        evaluateValue(
          cdp,
          `Boolean(document.querySelector('[data-testid="map-comparison-workspace-v135"]'))`
        ),
      (value) => value === true,
      { timeoutMs: 12000, label: "comparison open" }
    );
    compare = await evaluateValue(
      cdp,
      `(() => {
        const root = document.querySelector('[data-testid="map-comparison-workspace-v135"]');
        const lines = (el) => el
          ? (el.innerText || "").split(String.fromCharCode(10)).map(function (s) { return s.trim(); }).filter(Boolean)
          : [];
        return {
          open: Boolean(root),
          text: lines(root).slice(0, 40),
          selects: [...(root ? root.querySelectorAll('select') : [])].map(function (s) {
            return { label: s.getAttribute('aria-label'), options: s.options.length, value: s.value };
          })
        };
      })()`
    );
    compare.opened = opened.ok;
    // What the comparison actually renders, read from the page itself.
    compare.page = await evaluateValue(
      cdp,
      `(() => {
        const root = document.querySelector('[data-testid="map-public-content"]');
        const lines = (el) => el
          ? (el.innerText || "").split(String.fromCharCode(10)).map(function (s) { return s.trim(); }).filter(Boolean)
          : [];
        return {
          contextElements: root ? root.getAttribute('data-context-elements') : null,
          primaryElement: root ? root.getAttribute('data-primary-element') : null,
          renderedElements: root ? root.getAttribute('data-rendered-map-elements') : null,
          analysis: lines(document.querySelector('[data-testid="map-analysis-panel"]')).slice(0, 40)
        };
      })()`
    );
    console.log(`COMPARE | open=${compare.open} | selects=${(compare.selects || []).length}`);
  }

  await browser.close();
  await server.close();
  mkdirSync(OUT, { recursive: true });
  writeFileSync(
    resolve(OUT, "preset-compare-review-v137.json"),
    `${JSON.stringify({ schema: "nigt-map-preset-review-1", generatedAt: new Date().toISOString(), width: WIDTH, presets: rows, compare }, null, 2)}\n`,
    "utf8"
  );
  return 0;
}

process.exit(await main());
