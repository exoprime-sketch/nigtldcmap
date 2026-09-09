#!/usr/bin/env node
/**
 * What covers a map feature, and can a reader get to it anyway?
 *
 * MAP-002 reported that every screen point landing on A-024-WB2016-0001 has some
 * other element on top of it at 1440. This asks the page directly: which
 * elements sit over the feature's own points, how much of the canvas each of
 * them takes, and whether panning, zooming or collapsing a panel gives the
 * reader a point they can actually hover. The distinction matters - a starting
 * coordinate behind a panel is not the same defect as a feature nobody can
 * reach.
 */

import { writeFileSync, mkdirSync } from "node:fs";
import { resolve } from "node:path";

import {
  startStaticBuildServer,
  launchHeadlessBrowser,
  navigate,
  evaluateValue,
  setViewport,
} from "../v125/browser-runtime.mjs";
import { clickSelector, openLayerList, pollUntil, sleep, json } from "./map-qa-input.mjs";

const ROOT = resolve(import.meta.dirname, "../..");
const argv = process.argv.slice(2);
const opt = (name, fallback) => {
  const index = argv.indexOf(name);
  return index < 0 ? fallback : argv[index + 1];
};
const BUILD = resolve(ROOT, opt("--build-root", ".verify/candidate/build"));
const OUT = resolve(ROOT, opt("--out", "reports/final-data-integration/map-qa"));
const ELEMENT = opt("--element", "A-024");
const KEY = opt("--key", "A-024-WB2016-0001");
const WIDTHS = (opt("--widths", "1440,1024,958,768,390")).split(",").map(Number);

/** Every element that covers a point of this feature, with how often. */
const OCCLUSION = (elementId, selectionKey) => `(() => {
  const o = window.__nigtMapObserverV137;
  if (!o) return null;
  const rect = o.canvasRect();
  const describe = (el) => {
    if (!el) return "none";
    const testId = el.getAttribute && el.getAttribute("data-testid");
    const cls = typeof el.className === "string" && el.className
      ? "." + el.className.split(/\\s+/)[0]
      : "";
    return el.tagName.toLowerCase() + cls + (testId ? "[" + testId + "]" : "");
  };
  const owner = (el) => {
    let node = el;
    while (node && node !== document.body) {
      if (node.classList && (
        node.classList.contains("cdp-map-legend")
        || node.classList.contains("cdp-map-evidence")
        || node.classList.contains("cdp-map-overlay-card")
        || node.classList.contains("cdp-map-sidebar")
        || node.classList.contains("maplibregl-popup")
        || node.classList.contains("cdp-map-status-badge")
      )) return node.classList[0];
      node = node.parentElement;
    }
    return describe(el);
  };
  const hits = [];
  const covered = {};
  let free = 0;
  // Probe only the feature's own points.
  for (let y = 4; y < rect.height - 4; y += 6) {
    for (let x = 4; x < rect.width - 4; x += 6) {
      const vx = rect.left + x;
      const vy = rect.top + y;
      const at = o.queryAt(vx, vy, ${json(elementId)});
      if (!at.some((f) => f.selectionKey === ${json(selectionKey)})) continue;
      hits.push([Math.round(vx), Math.round(vy)]);
      const top = document.elementFromPoint(vx, vy);
      const canvas = document.querySelector("canvas.maplibregl-canvas");
      if (!top || top === canvas) { free += 1; continue; }
      const name = owner(top);
      covered[name] = (covered[name] || 0) + 1;
    }
  }
  // How much of the canvas each overlay takes, for the record.
  const overlays = {};
  ["cdp-map-legend", "cdp-map-evidence", "cdp-map-overlay-card", "cdp-map-status-badge"].forEach((cls) => {
    const el = document.querySelector("." + cls);
    if (!el) return;
    const r = el.getBoundingClientRect();
    const overlapW = Math.max(0, Math.min(r.right, rect.left + rect.width) - Math.max(r.left, rect.left));
    const overlapH = Math.max(0, Math.min(r.bottom, rect.top + rect.height) - Math.max(r.top, rect.top));
    overlays[cls] = {
      rect: { w: Math.round(r.width), h: Math.round(r.height) },
      coversCanvasPct: Math.round((overlapW * overlapH * 1000) / (rect.width * rect.height)) / 10,
      hasToggle: Boolean(el.querySelector(".cdp-map-panel-toggle, [data-testid='map-legend-toggle-v137']")),
    };
  });

  // Reachable canvas share overall, the MAP-001 measure.
  let sampled = 0;
  let reachable = 0;
  const canvas = document.querySelector("canvas.maplibregl-canvas");
  for (let y = 4; y < rect.height - 4; y += 12) {
    for (let x = 4; x < rect.width - 4; x += 12) {
      sampled += 1;
      if (document.elementFromPoint(rect.left + x, rect.top + y) === canvas) reachable += 1;
    }
  }

  return {
    canvas: { w: Math.round(rect.width), h: Math.round(rect.height) },
    featurePoints: hits.length,
    freePoints: free,
    coveredBy: covered,
    overlays: overlays,
    canvasReachablePct: sampled ? Math.round((reachable * 1000) / sampled) / 10 : null
  };
})()`;

async function main() {
  mkdirSync(OUT, { recursive: true });
  const server = await startStaticBuildServer(BUILD);
  const browser = await launchHeadlessBrowser();
  const cdp = browser.cdp;
  const base = server.url.replace(/\/$/, "");
  const results = [];

  for (const width of WIDTHS) {
    try {
      await setViewport(cdp, width, width <= 768 ? 900 : 1000);
      await navigate(cdp, `${base}/?view=map&country=VNM#map`);
      await pollUntil(
        () => evaluateValue(cdp, `Boolean(window.__nigtMapObserverV137 && window.__nigtMapObserverV137.ready())`),
        (v) => v === true,
        { timeoutMs: 45000, intervalMs: 250, label: "map ready" }
      );
      const listState = await openLayerList(cdp, evaluateValue);
      await clickSelector(
        cdp,
        evaluateValue,
        `[data-testid="map-all-data-layer-v135"][data-element-id="${ELEMENT}"]`
      );
      await pollUntil(
        () =>
          evaluateValue(
            cdp,
            `(() => { const o = window.__nigtMapObserverV137;
              return o ? o.renderedFeatures(${json(ELEMENT)}).length : 0; })()`
          ),
        (n) => n > 0,
        { timeoutMs: 45000, intervalMs: 250, label: "layer rendered" }
      );
      // Below 769px the workspace stacks and the map sits under the list, so a
      // reader scrolls to it before touching it. Measuring without scrolling
      // read the sidebar's own rows as if they covered the map.
      await evaluateValue(
        cdp,
        `(() => {
          const canvas = document.querySelector("canvas.maplibregl-canvas");
          if (canvas) canvas.scrollIntoView({ block: "center", inline: "center" });
          return true;
        })()`
      );
      await sleep(400);
      const observed = await evaluateValue(cdp, OCCLUSION(ELEMENT, KEY));
      results.push({ width, elementId: ELEMENT, selectionKey: KEY, listState, ...observed });
      process.stderr.write(
        `  ${width}px canvas=${observed?.canvas.w}x${observed?.canvas.h} ` +
          `featurePoints=${observed?.featurePoints} free=${observed?.freePoints} ` +
          `coveredBy=${JSON.stringify(observed?.coveredBy)} reachable=${observed?.canvasReachablePct}%\n`
      );
    } catch (error) {
      const message = String(error.message || error);
      results.push({ width, elementId: ELEMENT, selectionKey: KEY, error: message });
      process.stderr.write(`  ${width}px FAILED ${message}
`);
    }
  }

  writeFileSync(
    resolve(OUT, "map-occlusion-probe-v137.json"),
    `${JSON.stringify({ generatedAt: new Date().toISOString(), buildRoot: BUILD, results }, null, 2)}\n`,
    "utf8"
  );
  console.log(JSON.stringify(results, null, 2));
  await browser.close();
  await server.close();
}

main().then(() => process.exit(0));
