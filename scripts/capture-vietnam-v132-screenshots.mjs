#!/usr/bin/env node

import { createHash } from "node:crypto";
import {
  existsSync,
  mkdirSync,
  readFileSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { resolve } from "node:path";

import { PROJECT_ROOT, pngDimensions } from "./v125/audit-utils.mjs";
import {
  captureElementPng,
  evaluateValue,
  launchHeadlessBrowser,
  navigate,
  setViewport,
  startStaticBuildServer,
  waitForValue,
} from "./v125/browser-runtime.mjs";
import { detailUrlV129, mapUrlV129 } from "./v129/audit-helpers.mjs";
import { V132_SCREENSHOT_ROOT, writeJsonV132 } from "./v132/audit-helpers.mjs";

const requiredNames = [
  "a016-energy-absolute-trend.png",
  "a016-energy-share-trend.png",
  "a016-energy-selected-year.png",
  "e008-research-trend.png",
  "e008-research-breakdown.png",
  "e008-research-list.png",
  "a023-map-tooltip-named.png",
  "a023-map-tooltip-fallback.png",
  "b033-map-region-trend.png",
  "portfolio-summary-before-list.png",
];

mkdirSync(V132_SCREENSHOT_ROOT, { recursive: true });

function sleep(milliseconds) {
  return new Promise((resolveWait) => setTimeout(resolveWait, milliseconds));
}

async function capture(cdp, name, selector) {
  const path = resolve(V132_SCREENSHOT_ROOT, name);
  await captureElementPng(cdp, selector, path);
  return path;
}

async function captureSummaryBeforeList(cdp, name) {
  const clip = await evaluateValue(
    cdp,
    `(() => {
      const summary = document.querySelector('[data-testid="portfolio-analysis-summary-v132"]');
      const list = document.querySelector('[data-testid="portfolio-entity-list-v132"]');
      if (!summary || !list) return null;
      const summaryRect = summary.getBoundingClientRect();
      const listRect = list.getBoundingClientRect();
      if (summaryRect.top >= listRect.top) return null;
      const left = Math.max(0, Math.min(summaryRect.left, listRect.left) - 8);
      const right = Math.min(
        document.documentElement.scrollWidth,
        Math.max(summaryRect.right, listRect.right) + 8
      );
      const top = summaryRect.top + window.scrollY;
      const bottom = Math.min(
        listRect.top + window.scrollY + Math.min(listRect.height, 420),
        top + 1_250
      );
      return {
        x: Math.max(0, left + window.scrollX),
        y: Math.max(0, top),
        width: Math.max(1, right - left),
        height: Math.max(1, bottom - top),
      };
    })()`
  );
  if (!clip) throw new Error("portfolio summary/list order unavailable");
  const result = await cdp.send("Page.captureScreenshot", {
    format: "png",
    fromSurface: true,
    captureBeyondViewport: true,
    clip: { ...clip, scale: 1 },
  });
  const path = resolve(V132_SCREENSHOT_ROOT, name);
  writeFileSync(path, Buffer.from(result.data, "base64"));
  return path;
}

async function waitForMap(cdp) {
  await waitForValue(
    cdp,
    `(() => {
      const root = document.querySelector('[data-testid="map-public-content"]');
      const wrap = document.querySelector('.cdp-map-canvas-wrap');
      const canvas = document.querySelector('.cdp-map-canvas.is-visible canvas');
      return Boolean(
        root && wrap && canvas &&
        wrap.getBoundingClientRect().width > 300 &&
        wrap.getBoundingClientRect().height > 400
      );
    })()`,
    { timeoutMs: 35_000 }
  );
}

function layerReadyExpression(elementId) {
  return `(() => {
    const root = document.querySelector('[data-testid="map-public-content"]');
    const overlay = document.querySelector('.cdp-map-overlay-card');
    return root?.getAttribute('data-primary-element') === ${JSON.stringify(elementId)} &&
      !/\ubd88\ub7ec\uc624\ub294 \uc911/u.test(overlay?.textContent || '');
  })()`;
}

async function activateLayer(cdp, elementId) {
  const clicked = await evaluateValue(
    cdp,
    `(() => {
      const card = document.querySelector('.cdp-layer-card[data-map-element=${JSON.stringify(elementId)}]');
      const button = [...(card?.querySelectorAll('button') || [])]
        .find((node) => ['\ubd84\uc11d\ud558\uae30', '\ubd84\uc11d \uc911'].includes(node.textContent?.trim()));
      if (!(button instanceof HTMLButtonElement) || button.disabled) return false;
      button.click();
      return true;
    })()`
  );
  if (!clicked) throw new Error(`${elementId} layer action unavailable`);
  await waitForValue(cdp, layerReadyExpression(elementId), { timeoutMs: 35_000 });
  await waitForValue(
    cdp,
    `Boolean(document.querySelector('[data-testid="map-keyboard-feature-select"]'))`,
    { timeoutMs: 25_000 }
  );
  await sleep(350);
}

async function setRightPanelWidth(cdp, mode) {
  if (mode === "default") {
    const applied = await evaluateValue(
      cdp,
      `(() => {
      const separator = document.querySelector('[data-testid="map-right-panel-separator"]');
      if (!(separator instanceof HTMLElement)) return false;
      separator.dispatchEvent(new MouseEvent('dblclick', { bubbles: true }));
      return true;
    })()`
    );
    if (!applied) throw new Error("right panel separator unavailable");
    await sleep(220);
    return;
  }
  const center = await evaluateValue(
    cdp,
    `(() => {
      const separator = document.querySelector('[data-testid="map-right-panel-separator"]');
      if (!(separator instanceof HTMLElement)) return null;
      const rect = separator.getBoundingClientRect();
      return { x: rect.left + rect.width / 2, y: rect.top + Math.min(120, rect.height / 2) };
    })()`
  );
  if (!center) throw new Error("right panel separator unavailable");
  await cdp.send("Input.dispatchMouseEvent", {
    type: "mousePressed",
    x: center.x,
    y: center.y,
    button: "left",
    buttons: 1,
    clickCount: 1,
  });
  await cdp.send("Input.dispatchMouseEvent", {
    type: "mouseMoved",
    x: center.x - 160,
    y: center.y,
    button: "left",
    buttons: 1,
  });
  await cdp.send("Input.dispatchMouseEvent", {
    type: "mouseReleased",
    x: center.x - 160,
    y: center.y,
    button: "left",
    buttons: 0,
    clickCount: 1,
  });
  await sleep(220);
}

async function visibleMapSurface(cdp) {
  return evaluateValue(
    cdp,
    `(() => {
      const canvas = document.querySelector('.cdp-map-canvas.is-visible canvas');
      if (!canvas) return null;
      const rect = canvas.getBoundingClientRect();
      const blockers = [...document.querySelectorAll(
        '.cdp-map-overlay-card, .cdp-map-legend, .maplibregl-control-container > div'
      )].flatMap((node) => {
        const style = getComputedStyle(node);
        const box = node.getBoundingClientRect();
        return style.display !== 'none' && style.visibility !== 'hidden' &&
          box.width > 0 && box.height > 0
          ? [{ left: box.left, right: box.right, top: box.top, bottom: box.bottom }]
          : [];
      });
      return {
        left: rect.left,
        right: rect.right,
        top: rect.top,
        bottom: rect.bottom,
        width: rect.width,
        height: rect.height,
        blockers,
      };
    })()`
  );
}

async function mouseMove(cdp, x, y) {
  await cdp.send("Input.dispatchMouseEvent", {
    type: "mouseMoved",
    x,
    y,
    button: "none",
    buttons: 0,
  });
}

async function mouseClick(cdp, x, y) {
  await cdp.send("Input.dispatchMouseEvent", {
    type: "mousePressed",
    x,
    y,
    button: "left",
    buttons: 1,
    clickCount: 1,
  });
  await cdp.send("Input.dispatchMouseEvent", {
    type: "mouseReleased",
    x,
    y,
    button: "left",
    buttons: 0,
    clickCount: 1,
  });
}

function scanPositions(surface, step) {
  const positions = [];
  const centerX = surface.left + surface.width / 2;
  const centerY = surface.top + surface.height / 2;
  for (let y = surface.top + step / 2; y < surface.bottom - step / 2; y += step) {
    for (let x = surface.left + step / 2; x < surface.right - step / 2; x += step) {
      if (
        surface.blockers.some(
          (box) => x >= box.left && x <= box.right && y >= box.top && y <= box.bottom
        )
      ) {
        continue;
      }
      positions.push({ x, y, distance: Math.hypot(x - centerX, y - centerY) });
    }
  }
  positions.sort((left, right) => left.distance - right.distance);
  return positions;
}

async function popupState(cdp) {
  return evaluateValue(
    cdp,
    `(() => {
      const power = document.querySelector('[data-testid="a023-map-tooltip-v132"]');
      if (power) {
        const title = power.getAttribute('data-feature-title') ||
          power.querySelector('strong')?.textContent?.trim() || '';
        return {
          kind: 'power',
          title,
          text: power.textContent?.normalize('NFC').replace(/\\s+/gu, ' ').trim() || '',
        };
      }
      const popup = document.querySelector('.cdp-map-public-popup');
      const text = popup?.textContent?.normalize('NFC').replace(/\\s+/gu, ' ').trim() || '';
      return text ? { kind: /\uc704\uce58.*\ubb36\uc74c/u.test(text) ? 'cluster' : 'other', title: '', text } : null;
    })()`
  );
}

async function changeLayerFilter(cdp, field, value) {
  const changed = await evaluateValue(
    cdp,
    `(() => {
      const select = document.querySelector(${JSON.stringify(
        `[data-testid="map-layer-filter-${field}"]`
      )});
      if (!(select instanceof HTMLSelectElement)) return false;
      if (![...select.options].some((option) => option.value === ${JSON.stringify(value)})) {
        return false;
      }
      select.value = ${JSON.stringify(value)};
      select.dispatchEvent(new Event('change', { bubbles: true }));
      return true;
    })()`
  );
  if (!changed) throw new Error(`A-023 ${field} filter value unavailable: ${value}`);
  await sleep(250);
}

async function fitCountryExtent(cdp) {
  const clicked = await evaluateValue(
    cdp,
    `(() => {
      const button = [...document.querySelectorAll('.cdp-action-row button')]
        .find((node) => node.textContent?.trim() === '\uc804\uccb4 \ubc94\uc704 \ubcf4\uae30');
      if (!(button instanceof HTMLButtonElement)) return false;
      button.click();
      return true;
    })()`
  );
  if (!clicked) throw new Error("country extent control unavailable");
  await sleep(500);
}

function projectFitBoundsCoordinate(surface, longitude, latitude) {
  const mercator = (lng, lat) => {
    const radians = (Math.max(-85, Math.min(85, lat)) * Math.PI) / 180;
    return {
      x: (lng + 180) / 360,
      y: (1 - Math.log(Math.tan(radians) + 1 / Math.cos(radians)) / Math.PI) / 2,
    };
  };
  const northwest = mercator(102, 23.8);
  const southeast = mercator(110.8, 8);
  const target = mercator(longitude, latitude);
  const padding = 44;
  const scale = Math.min(
    (surface.width - padding * 2) / (southeast.x - northwest.x),
    (surface.height - padding * 2) / (southeast.y - northwest.y)
  );
  const centerX = (northwest.x + southeast.x) / 2;
  const centerY = (northwest.y + southeast.y) / 2;
  return {
    x: surface.left + surface.width / 2 + (target.x - centerX) * scale,
    y: surface.top + surface.height / 2 + (target.y - centerY) * scale,
  };
}

function positionsNear(surface, target, radius = 88, step = 8) {
  const positions = [];
  for (let y = target.y - radius; y <= target.y + radius; y += step) {
    for (let x = target.x - radius; x <= target.x + radius; x += step) {
      if (x <= surface.left || x >= surface.right || y <= surface.top || y >= surface.bottom) continue;
      if (
        surface.blockers.some(
          (box) => x >= box.left && x <= box.right && y >= box.top && y <= box.bottom
        )
      ) {
        continue;
      }
      positions.push({ x, y, distance: Math.hypot(x - target.x, y - target.y) });
    }
  }
  positions.sort((left, right) => left.distance - right.distance);
  return positions;
}

async function captureNamedPowerPlantTooltip(cdp) {
  await changeLayerFilter(cdp, "fuelType", "\uc218\ub825");
  await changeLayerFilter(cdp, "capacityBand", "100~499MW");
  await fitCountryExtent(cdp);
  let surface = await visibleMapSurface(cdp);
  if (!surface) throw new Error("visible map canvas unavailable");
  let target = projectFitBoundsCoordinate(surface, 107.2728, 16.2266);
  const seenTitles = new Set();
  for (let pass = 0; pass < 9; pass += 1) {
    surface = await visibleMapSurface(cdp);
    if (!surface) break;
    const positions = positionsNear(surface, target, pass < 2 ? 72 : 108, pass < 2 ? 8 : 6);
    let cluster = null;
    for (const position of positions) {
      await mouseMove(cdp, position.x, position.y);
      await sleep(7);
      const popup = await popupState(cdp);
      if (!popup) continue;
      if (popup.kind === "power") {
        seenTitles.add(popup.title);
        if (!/\ubc1c\uc804\uc2dc\uc124/u.test(popup.title)) {
          await capture(cdp, "a023-map-tooltip-named.png", ".cdp-map-page");
          return {
            fileName: "a023-map-tooltip-named.png",
            title: popup.title,
            text: popup.text,
          };
        }
      } else if (popup.kind === "cluster" && !cluster) {
        cluster = position;
      }
    }
    if (cluster) {
      await mouseClick(cdp, cluster.x, cluster.y);
      await sleep(500);
      surface = await visibleMapSurface(cdp);
      if (!surface) break;
      target = {
        x: surface.left + surface.width / 2,
        y: surface.top + surface.height / 2,
      };
      continue;
    }
    const zoomed = await evaluateValue(
      cdp,
      `(() => {
        const button = document.querySelector('.maplibregl-ctrl-zoom-in');
        if (!(button instanceof HTMLButtonElement)) return false;
        button.click();
        return true;
      })()`
    );
    if (!zoomed) break;
    const center = {
      x: surface.left + surface.width / 2,
      y: surface.top + surface.height / 2,
    };
    target = {
      x: center.x + (target.x - center.x) * 2,
      y: center.y + (target.y - center.y) * 2,
    };
    await sleep(450);
  }
  throw new Error(`named A-023 tooltip unavailable near verified A Luoi site: ${JSON.stringify([...seenTitles])}`);
}

async function captureFallbackPowerPlantTooltip(cdp) {
  await changeLayerFilter(cdp, "capacityBand", "all");
  await changeLayerFilter(cdp, "fuelType", "\ud0dc\uc591\uad11");
  await fitCountryExtent(cdp);
  const seenTitles = new Set();
  for (let pass = 0; pass < 7; pass += 1) {
    const surface = await visibleMapSurface(cdp);
    if (!surface) break;
    const positions = scanPositions(surface, pass < 3 ? 18 : 12);
    let cluster = null;
    for (const position of positions) {
      await mouseMove(cdp, position.x, position.y);
      await sleep(pass < 3 ? 9 : 6);
      const popup = await popupState(cdp);
      if (!popup) continue;
      if (popup.kind === "power") {
        seenTitles.add(popup.title);
        if (/\ubc1c\uc804\uc2dc\uc124/u.test(popup.title)) {
          await capture(cdp, "a023-map-tooltip-fallback.png", ".cdp-map-page");
          return {
            fileName: "a023-map-tooltip-fallback.png",
            title: popup.title,
            text: popup.text,
          };
        }
      } else if (popup.kind === "cluster" && !cluster) {
        cluster = position;
      }
    }
    if (cluster) {
      await mouseClick(cdp, cluster.x, cluster.y);
      await sleep(500);
      continue;
    }
    const zoomed = await evaluateValue(
      cdp,
      `document.querySelector('.maplibregl-ctrl-zoom-in') instanceof HTMLButtonElement && (document.querySelector('.maplibregl-ctrl-zoom-in').click(), true)`
    );
    if (zoomed) await sleep(450);
  }
  throw new Error(`fallback A-023 tooltip unavailable: ${JSON.stringify([...seenTitles])}`);
}

async function capturePowerPlantTooltipVariants(cdp) {
  const named = await captureNamedPowerPlantTooltip(cdp);
  const fallback = await captureFallbackPowerPlantTooltip(cdp);
  return { named, fallback };
}

function screenshotEvidence(name) {
  const path = resolve(V132_SCREENSHOT_ROOT, name);
  const dimensions = pngDimensions(path);
  return {
    name,
    ...dimensions,
    sha256:
      existsSync(path) && statSync(path).isFile()
        ? createHash("sha256").update(readFileSync(path)).digest("hex")
        : null,
  };
}

let server = null;
let browser = null;
let runtimeFailure = null;
let powerPlantTooltips = null;

try {
  server = await startStaticBuildServer(resolve(PROJECT_ROOT, "build"));
  browser = await launchHeadlessBrowser();
  await setViewport(browser.cdp, 1440, 1100);

  await navigate(browser.cdp, detailUrlV129(server.url, "A-016"));
  await waitForValue(
    browser.cdp,
    `Boolean(document.querySelector('[data-testid="a016-energy-analysis-v132"]'))`,
    { timeoutMs: 25_000 }
  );
  await capture(
    browser.cdp,
    "a016-energy-absolute-trend.png",
    '[data-testid="a016-absolute-trend"]'
  );
  await capture(
    browser.cdp,
    "a016-energy-share-trend.png",
    '[data-testid="a016-share-trend"]'
  );
  await capture(
    browser.cdp,
    "a016-energy-selected-year.png",
    '[data-testid="a016-selected-year"]'
  );

  await navigate(browser.cdp, detailUrlV129(server.url, "E-008"));
  await waitForValue(
    browser.cdp,
    `Boolean(document.querySelector('[data-testid="e008-research-analysis-v132"]'))`,
    { timeoutMs: 25_000 }
  );
  await capture(browser.cdp, "e008-research-trend.png", '[data-testid="e008-trend"]');
  await capture(
    browser.cdp,
    "e008-research-breakdown.png",
    ".rpa132-analysis-grid"
  );
  await capture(browser.cdp, "e008-research-list.png", '[data-testid="e008-list"]');

  await navigate(browser.cdp, detailUrlV129(server.url, "E-018"));
  await waitForValue(
    browser.cdp,
    `Boolean(
      document.querySelector('[data-testid="portfolio-analysis-summary-v132"]') &&
      document.querySelector('[data-testid="portfolio-entity-list-v132"]')
    )`,
    { timeoutMs: 25_000 }
  );
  await captureSummaryBeforeList(browser.cdp, "portfolio-summary-before-list.png");

  await navigate(browser.cdp, mapUrlV129(server.url));
  await waitForMap(browser.cdp);
  await activateLayer(browser.cdp, "B-033");
  await evaluateValue(
    browser.cdp,
    `document.querySelector('[data-testid="map-keyboard-feature-select"]')?.click()`
  );
  await waitForValue(
    browser.cdp,
    `(() => {
      const node = document.querySelector('[data-testid="b033-map-region-trend-v132"]');
      return Boolean(node && Number(node.getAttribute('data-region-record-count')) === 25);
    })()`,
    { timeoutMs: 12_000 }
  );
  await setRightPanelWidth(browser.cdp, "expanded");
  await evaluateValue(
    browser.cdp,
    `document.querySelector('[data-testid="b033-map-region-trend-v132"]')?.scrollIntoView({ block: 'center' })`
  );
  await sleep(150);
  await capture(
    browser.cdp,
    "b033-map-region-trend.png",
    '[data-testid="b033-map-region-trend-v132"]'
  );

  await setRightPanelWidth(browser.cdp, "default");
  await evaluateValue(
    browser.cdp,
    `(() => {
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
      return window.scrollY === 0;
    })()`
  );
  await sleep(150);
  await activateLayer(browser.cdp, "A-023");
  powerPlantTooltips = await capturePowerPlantTooltipVariants(browser.cdp);
} catch (error) {
  runtimeFailure = error instanceof Error ? error.message : String(error);
} finally {
  if (browser) await browser.close();
  if (server) await server.close();
}

const evidence = requiredNames.map(screenshotEvidence);
const invalid = evidence.filter(
  (item) =>
    item.error !== null ||
    Number(item.width || 0) < 240 ||
    Number(item.height || 0) < 120 ||
    Number(item.byteSize || 0) < 2_000
);
const duplicateHashes = evidence
  .filter((item) => item.sha256)
  .filter(
    (item, index, items) =>
      items.findIndex((candidate) => candidate.sha256 === item.sha256) !== index
  )
  .map((item) => item.name);
const runtimeErrors = browser?.runtimeErrors || [];
const status =
  runtimeFailure === null &&
  invalid.length === 0 &&
  duplicateHashes.length === 0 &&
  runtimeErrors.length === 0
    ? "PASS"
    : "FAIL";

writeJsonV132(resolve(V132_SCREENSHOT_ROOT, "screenshot-manifest-v132.json"), {
  schemaVersion: "v132-screenshot-manifest-1",
  generatedAt: new Date().toISOString(),
  status,
  requiredCount: requiredNames.length,
  screenshotCount: evidence.filter((item) => item.error === null).length,
  runtimeFailure,
  runtimeErrors,
  invalid: invalid.map((item) => item.name),
  duplicateHashes,
  powerPlantTooltips,
  screenshots: evidence,
});

console.log(
  JSON.stringify({
    type: "summary",
    audit: "screenshots:v132",
    status,
    screenshotCount: evidence.filter((item) => item.error === null).length,
    requiredCount: requiredNames.length,
    runtimeFailure,
    invalid: invalid.map((item) => item.name),
    duplicateHashes,
    runtimeErrorCount: runtimeErrors.length,
  })
);

if (status !== "PASS") process.exitCode = 1;
