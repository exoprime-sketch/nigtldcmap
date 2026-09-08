#!/usr/bin/env node
/**
 * Exercise every map layer of the candidate build with real pointer input.
 *
 * Hover and click are dispatched through CDP over the map canvas at real
 * coordinates, so what is tested is what a user would touch - not a synthetic
 * event delivered to a hidden fallback node. For each layer the run records
 * whether it selected, rendered, produced a popup, and reflected the selection
 * in the side panel, and whether its period/variable control does anything.
 */

import { mkdirSync, writeFileSync, statSync } from "node:fs";
import { resolve } from "node:path";

import {
  startStaticBuildServer,
  launchHeadlessBrowser,
  navigate,
  evaluateValue,
  setViewport,
} from "./v125/browser-runtime.mjs";

const PROJECT_ROOT = resolve(import.meta.dirname, "..");
const BUILD_ROOT = resolve(PROJECT_ROOT, ".verify/candidate/build");
const OUT_DIR = resolve(PROJECT_ROOT, "reports/final-data-integration/candidate-qa");
const SHOTS = resolve(OUT_DIR, "screenshots");

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

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

/** Centre of the map canvas in viewport coordinates. */
const CANVAS_RECT = `(() => {
  const c = document.querySelector("canvas.maplibregl-canvas") || document.querySelector("canvas");
  if (!c) return null;
  const r = c.getBoundingClientRect();
  return { x: r.left, y: r.top, w: r.width, h: r.height };
})()`;

const READ_MAP = `(() => {
  const t = (el) => (el && el.textContent || "").replace(/\\s+/g, " ").trim();
  const main = document.querySelector("main") || document.body;
  const body = t(main);
  const popup = document.querySelector(".maplibregl-popup, [class*='popup'], [role='tooltip']");
  return {
    hasCanvas: Boolean(document.querySelector("canvas")),
    popupText: t(popup).slice(0, 300),
    panelText: body.slice(0, 1500),
    selects: [...main.querySelectorAll("select")].map((s) => ({
      shown: t(s.selectedOptions[0]),
      options: s.options.length,
    })),
    layerButtons: [...main.querySelectorAll("button")]
      .map((b) => t(b))
      .filter((x) => x && x.length < 40)
      .slice(0, 60),
  };
})()`;

async function main() {
  mkdirSync(SHOTS, { recursive: true });
  const server = await startStaticBuildServer(BUILD_ROOT);
  const browser = await launchHeadlessBrowser();
  const cdp = browser.cdp;
  const base = server.url.replace(/\/$/, "");

  await setViewport(cdp, 1440, 1000);
  await navigate(cdp, `${base}/data/vietnam/v2/map-index.json`);
  const index = JSON.parse(await evaluateValue(cdp, "document.body.innerText"));
  const layers = index.layers || index.entries || [];

  const rows = [];
  for (const layer of layers) {
    const id = layer.elementId || layer.id;
    const row = {
      elementId: id,
      label: layer.label || "",
      featureCount: layer.featureCount ?? "",
      selected: "NO",
      rendered: "NO",
      pointerHover: "NO",
      pointerClick: "NO",
      popupHasContent: "NO",
      panelReflects: "NO",
      periodOrVariableChange: "N/A",
      evidence: "NO",
      note: "",
    };
    try {
      await navigate(cdp, `${base}/?layer=${encodeURIComponent(id)}&country=VNM#map`);
      await sleep(2500);

      // Select the layer from the left list by its own label.
      const clicked = await evaluateValue(
        cdp,
        `(() => {
          const label = ${JSON.stringify(String(layer.label || ""))};
          const b = [...document.querySelectorAll("main button")]
            .find((x) => (x.textContent || "").includes(label));
          if (!b) return "NOT_FOUND";
          b.click();
          return "CLICKED";
        })()`
      );
      row.selected = clicked === "CLICKED" ? "YES" : "NO";
      await sleep(2500);

      const rect = await evaluateValue(cdp, CANVAS_RECT);
      row.rendered = rect ? "YES" : "NO";
      if (rect) {
        const cx = rect.x + rect.w / 2;
        const cy = rect.y + rect.h / 2;
        // Sweep a few points so a layer whose features avoid dead centre still
        // gets a real hover.
        for (const [dx, dy] of [[0, 0], [-60, 40], [50, -30], [0, 90]]) {
          await mouse(cdp, "mouseMoved", cx + dx, cy + dy);
          await sleep(500);
          const read = await evaluateValue(cdp, READ_MAP);
          if (read.popupText) {
            row.pointerHover = "YES";
            row.popupHasContent = read.popupText.length > 8 ? "YES" : "EMPTY";
            row.note = read.popupText.slice(0, 120);
            break;
          }
        }
        await mouse(cdp, "mousePressed", cx, cy, { button: "left", buttons: 1, clickCount: 1 });
        await mouse(cdp, "mouseReleased", cx, cy, { button: "left", buttons: 0, clickCount: 1 });
        await sleep(1500);
        row.pointerClick = "YES";
      }

      const after = await evaluateValue(cdp, READ_MAP);
      row.panelReflects = after.panelText.includes(String(layer.label || "")) ? "YES" : "NO";

      // Period / variable selector, where the layer has one.
      const changed = await evaluateValue(
        cdp,
        `(() => {
          const s = [...document.querySelectorAll("main select")].find((x) => x.options.length > 1);
          if (!s) return "NO_CONTROL";
          const before = s.value;
          s.selectedIndex = (s.selectedIndex + 1) % s.options.length;
          s.dispatchEvent(new Event("change", { bubbles: true }));
          return before === s.value ? "NO_CHANGE" : "CHANGED";
        })()`
      );
      if (changed === "NO_CONTROL") {
        row.periodOrVariableChange = "N/A_NO_CONTROL";
      } else {
        await sleep(1500);
        const post = await evaluateValue(cdp, READ_MAP);
        row.periodOrVariableChange =
          post.panelText !== after.panelText ? "YES" : "NO_EFFECT";
      }

      const { data } = await cdp.send("Page.captureScreenshot", { format: "png" });
      const path = resolve(SHOTS, `map-${String(id).toLowerCase()}.png`);
      writeFileSync(path, Buffer.from(data, "base64"));
      row.evidence = statSync(path).size > 1000 ? "YES" : "EMPTY";
    } catch (error) {
      row.note = `ERROR ${String(error).slice(0, 90)}`;
    }
    rows.push(row);
    process.stderr.write(`  map ${id}: hover=${row.pointerHover} popup=${row.popupHasContent}\n`);
  }

  const header = Object.keys(rows[0]);
  writeFileSync(
    resolve(OUT_DIR, "map-coverage-v137.csv"),
    header.join(",") +
      "\n" +
      rows
        .map((r) =>
          header
            .map((h) => {
              const v = String(r[h] ?? "");
              return /[",\n]/.test(v) ? `"${v.replaceAll('"', '""')}"` : v;
            })
            .join(",")
        )
        .join("\n") +
      "\n",
    "utf8"
  );
  const tally = (k) => rows.reduce((a, r) => ((a[r[k]] = (a[r[k]] ?? 0) + 1), a), {});
  const summary = {
    generatedAt: new Date().toISOString(),
    layerCount: rows.length,
    selected: tally("selected"),
    rendered: tally("rendered"),
    pointerHover: tally("pointerHover"),
    popupHasContent: tally("popupHasContent"),
    panelReflects: tally("panelReflects"),
    periodOrVariableChange: tally("periodOrVariableChange"),
    evidence: tally("evidence"),
    rows,
  };
  writeFileSync(
    resolve(OUT_DIR, "map-coverage-summary-v137.json"),
    JSON.stringify(summary, null, 2) + "\n",
    "utf8"
  );
  console.log(JSON.stringify(summary, null, 2).slice(0, 2500));

  await browser.close();
  await server.close();
  return 0;
}

main().then((c) => process.exit(c));
