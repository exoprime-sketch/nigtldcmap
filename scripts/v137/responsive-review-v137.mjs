#!/usr/bin/env node
/**
 * Does each screen still work at the widths the platform has to support?
 *
 * 390, 768, 958, 1024 and 1440. Records horizontal overflow, elements wider
 * than the viewport, whether the primary controls can actually be reached, and
 * for the map how much of the window the map itself gets - which is how the
 * 1024 and 958 regressions were found.
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
import { pollUntil, openLayerList } from "./map-qa-input.mjs";

const ROOT = resolve(import.meta.dirname, "../..");
const argv = process.argv.slice(2);
const opt = (name, fallback) => {
  const index = argv.indexOf(name);
  return index < 0 ? fallback : argv[index + 1];
};
const BUILD = resolve(ROOT, opt("--build", ".verify/candidate/build"));
const OUT = resolve(ROOT, opt("--out", "reports/final-data-integration/responsive"));
const WIDTHS = (opt("--widths", "390,768,958,1024,1440")).split(",").map(Number);

/**
 * The screens a reader actually uses, plus one representative of each map
 * geometry. A-024 is checked at every width because its line geometry is the
 * one that lost its usable area at 1024 and 958.
 */
const SCREENS = [
  { id: "home", url: "/", wait: '[data-testid="home-root"], main' },
  { id: "finder", url: "/?country=VNM#explorer", wait: '[data-testid="data-finder-root"], main' },
  { id: "detail:A-016", url: "/?view=data&country=VNM&element=A-016#element-detail", wait: '[data-testid="public-analysis-root"]' },
  { id: "detail:B-005", url: "/?view=data&country=VNM&element=B-005#element-detail", wait: '[data-testid="public-analysis-root"]' },
  { id: "detail:D-011", url: "/?view=data&country=VNM&element=D-011#element-detail", wait: '[data-testid="public-analysis-root"]' },
  { id: "map", url: "/?view=map&country=VNM#map", wait: '[data-testid="map-public-content"]' },
  { id: "map:A-024", url: "/?view=map&country=VNM&element=A-024#map", wait: '[data-testid="map-public-content"]', map: "A-024" },
  { id: "map:A-023", url: "/?view=map&country=VNM&element=A-023#map", wait: '[data-testid="map-public-content"]', map: "A-023" },
  { id: "map:B-031", url: "/?view=map&country=VNM&element=B-031#map", wait: '[data-testid="map-public-content"]', map: "B-031" },
  { id: "download", url: "/?country=VNM#download", wait: '[data-testid="download-root"], main' },
];

/** A-024 at every width; the other map geometries at the two extremes only. */
const ALL_WIDTHS = new Set(["home", "finder", "detail:A-016", "detail:B-005", "detail:D-011", "map", "map:A-024", "download"]);

const MEASURE = `(() => {
  const width = window.innerWidth;
  const overflow = [...document.querySelectorAll('body *')]
    .filter(function (el) {
      const rect = el.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return false;
      const style = window.getComputedStyle(el);
      if (style.overflowX === 'auto' || style.overflowX === 'scroll') return false;
      return rect.right > width + 1 || rect.left < -1;
    })
    .slice(0, 6)
    .map(function (el) {
      const rect = el.getBoundingClientRect();
      return {
        tag: el.tagName.toLowerCase(),
        testId: el.getAttribute('data-testid'),
        cls: String(el.className || '').slice(0, 48),
        left: Math.round(rect.left),
        right: Math.round(rect.right)
      };
    });
  const canvas = document.querySelector('.maplibregl-canvas');
  const canvasRect = canvas ? canvas.getBoundingClientRect() : null;
  const controls = [...document.querySelectorAll('[data-testid="public-selector"] select, [data-testid="map-all-data-layer-v135"], [data-testid="map-analysis-preset"]')];
  const reachable = controls.filter(function (el) {
    const rect = el.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return false;
    return rect.left >= 0 && rect.right <= width + 1;
  }).length;
  return {
    documentScrollWidth: document.documentElement.scrollWidth,
    horizontalOverflow: document.documentElement.scrollWidth > width + 1,
    overflowingElements: overflow,
    mapCanvas: canvasRect
      ? { w: Math.round(canvasRect.width), h: Math.round(canvasRect.height), share: Math.round((canvasRect.width / width) * 100) }
      : null,
    controlCount: controls.length,
    reachableControlCount: reachable
  };
})()`;

async function main() {
  const server = await startStaticBuildServer(BUILD);
  const browser = await launchHeadlessBrowser();
  const cdp = browser.cdp;
  const rows = [];
  for (const width of WIDTHS) {
    await setViewport(cdp, width, 900);
    for (const screen of SCREENS) {
      if (!ALL_WIDTHS.has(screen.id) && width !== 390 && width !== 1440) continue;
      const row = { width, screen: screen.id };
      try {
        await navigate(cdp, `${server.url.replace(/\/$/, "")}${screen.url}`);
        const ready = await pollUntil(
          () => evaluateValue(cdp, `Boolean(document.querySelector(${JSON.stringify(screen.wait)}))`),
          (value) => value === true,
          { timeoutMs: 30000, label: `${screen.id} ready` }
        );
        row.ready = ready.ok;
        if (screen.map) {
          await pollUntil(
            () => evaluateValue(cdp, `Boolean(window.__nigtMapObserverV137 && window.__nigtMapObserverV137.ready())`),
            (value) => value === true,
            { timeoutMs: 30000, label: "map ready" }
          );
        }
        Object.assign(row, await evaluateValue(cdp, MEASURE));
        if (screen.wait.includes("map-public-content")) {
          // Below 769px the dataset list starts closed, so its buttons sit off
          // screen until a reader opens it. Measuring only the closed state
          // would report a working drawer as unreachable controls.
          const opened = await openLayerList(cdp, evaluateValue);
          row.layerListState = opened;
          const afterOpen = await evaluateValue(cdp, MEASURE);
          row.reachableAfterOpen = afterOpen.reachableControlCount;
          row.overflowAfterOpen = afterOpen.horizontalOverflow;
          row.mapCanvasAfterOpen = afterOpen.mapCanvas;
        }
      } catch (error) {
        row.error = String(error && error.message ? error.message : error);
      }
      rows.push(row);
      console.log(
        `${String(width).padStart(4)} | ${row.screen.padEnd(14)} | overflow=${row.horizontalOverflow ? "YES" : "no"}` +
          ` | map=${row.mapCanvas ? `${row.mapCanvas.w}px ${row.mapCanvas.share}%` : "-"}` +
          ` | controls=${row.reachableControlCount ?? "-"}/${row.controlCount ?? "-"}` +
          (row.reachableAfterOpen !== undefined
            ? ` | opened=${row.reachableAfterOpen}/${row.controlCount} (${row.layerListState})`
            : "") +
          (row.error ? ` | ${row.error}` : "")
      );
    }
  }
  await browser.close();
  await server.close();
  mkdirSync(OUT, { recursive: true });
  writeFileSync(
    resolve(OUT, "responsive-review-v137.json"),
    `${JSON.stringify({ schema: "nigt-responsive-review-1", generatedAt: new Date().toISOString(), widths: WIDTHS, rows }, null, 2)}\n`,
    "utf8"
  );
  return rows.some((row) => row.horizontalOverflow || row.error) ? 1 : 0;
}

process.exit(await main());
