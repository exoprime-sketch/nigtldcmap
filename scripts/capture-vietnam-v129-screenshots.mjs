#!/usr/bin/env node

import { mkdirSync } from "node:fs";
import { resolve } from "node:path";
import { AuditV125, PROJECT_ROOT } from "./v125/audit-utils.mjs";
import {
  captureElementPng,
  evaluateValue,
  launchHeadlessBrowser,
  navigate,
  setViewport,
  startStaticBuildServer,
  waitForValue,
} from "./v125/browser-runtime.mjs";
import {
  V129_SCREENSHOT_ROOT,
  detailUrlV129,
  finishAuditV129,
  mapUrlV129,
  screenshotEvidenceV129,
  validScreenshotV129,
} from "./v129/audit-helpers.mjs";

const audit = new AuditV125("screenshots:v129");
const requiredNames = [
  "home-canonical-title.png",
  "map-default-layout.png",
  "map-left-panel-expanded.png",
  "map-right-panel-expanded.png",
  "map-preset-list.png",
  "map-gvi-tooltip.png",
  "map-gvi-selected.png",
  "map-context-point-tooltip.png",
  "map-context-point-selected.png",
  "chart-toolbar-desktop.png",
  "chart-toolbar-mobile.png",
  "d-005-representative-allocation.png",
  "d-005-denominator-selection.png",
];
mkdirSync(V129_SCREENSHOT_ROOT, { recursive: true });

async function capture(cdp, name, selector) {
  const path = resolve(V129_SCREENSHOT_ROOT, name);
  await captureElementPng(cdp, selector, path);
  return path;
}

async function waitForMap(cdp) {
  await waitForValue(
    cdp,
    `(() => {
      const root = document.querySelector('[data-testid="map-public-content"]');
      const map = document.querySelector('.cdp-map-canvas-wrap');
      return Boolean(root && map && map.getBoundingClientRect().width > 300 && map.getBoundingClientRect().height > 400);
    })()`,
    { timeoutMs: 35_000 }
  );
}

async function clickPreset(cdp, presetId, primaryElement) {
  const clicked = await evaluateValue(
    cdp,
    `(() => {
      const button = [...document.querySelectorAll('[data-testid="map-analysis-preset"]')]
        .find((node) => node.getAttribute('data-preset-id') === ${JSON.stringify(presetId)});
      if (!(button instanceof HTMLButtonElement)) return false;
      button.click();
      return true;
    })()`
  );
  if (!clicked) throw new Error(`preset unavailable: ${presetId}`);
  await waitForValue(
    cdp,
    `(() => {
      const root = document.querySelector('[data-testid="map-public-content"]');
      const overlay = document.querySelector('.cdp-map-overlay-card');
      return root?.getAttribute('data-primary-element') === ${JSON.stringify(primaryElement)} && !/불러오는 중/u.test(overlay?.textContent || '');
    })()`,
    { timeoutMs: 35_000 }
  );
  await new Promise((resolveWait) => setTimeout(resolveWait, 250));
}

async function dragSeparator(cdp, side, deltaX) {
  const center = await evaluateValue(
    cdp,
    `(() => {
      const node = document.querySelector('[data-testid="map-${side}-panel-separator"]');
      if (!node) return null;
      const rect = node.getBoundingClientRect();
      return { x: rect.left + rect.width / 2, y: rect.top + Math.min(100, rect.height / 2) };
    })()`
  );
  if (!center) throw new Error(`${side} separator unavailable`);
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
    x: center.x + deltaX,
    y: center.y,
    button: "left",
    buttons: 1,
  });
  await cdp.send("Input.dispatchMouseEvent", {
    type: "mouseReleased",
    x: center.x + deltaX,
    y: center.y,
    button: "left",
    buttons: 0,
    clickCount: 1,
  });
  await new Promise((resolveWait) => setTimeout(resolveWait, 120));
}

async function mapCanvas(cdp) {
  return evaluateValue(
    cdp,
    `(() => {
      const host = document.querySelector('.cdp-map-canvas.is-visible');
      const canvas = host?.querySelector('canvas');
      if (!canvas) return null;
      const rect = canvas.getBoundingClientRect();
      const blockers = [...document.querySelectorAll('.cdp-map-overlay-card, .cdp-map-legend, .maplibregl-control-container > div')]
        .flatMap((node) => {
          const style = getComputedStyle(node);
          const box = node.getBoundingClientRect();
          return style.display !== 'none' && style.visibility !== 'hidden' && box.width > 0 && box.height > 0
            ? [{ left: box.left, right: box.right, top: box.top, bottom: box.bottom }]
            : [];
        });
      return { left: rect.left, top: rect.top, width: rect.width, height: rect.height, blockers };
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

async function findMapPopup(cdp, expectedTitle, step) {
  const surface = await mapCanvas(cdp);
  if (!surface) throw new Error("visible map canvas unavailable");
  const centerX = surface.left + surface.width / 2;
  const centerY = surface.top + surface.height / 2;
  const positions = [];
  for (let y = surface.top + step / 2; y < surface.top + surface.height - step / 2; y += step) {
    for (let x = surface.left + step / 2; x < surface.left + surface.width - step / 2; x += step) {
      if (surface.blockers.some((box) => x >= box.left && x <= box.right && y >= box.top && y <= box.bottom)) continue;
      positions.push({ x, y, distance: Math.hypot(x - centerX, y - centerY) });
    }
  }
  positions.sort((left, right) => left.distance - right.distance);
  for (const position of positions) {
    await mouseMove(cdp, position.x, position.y);
    await new Promise((resolveWait) => setTimeout(resolveWait, 18));
    const found = await evaluateValue(
      cdp,
      `(() => {
        const popup = document.querySelector('.cdp-map-public-popup');
        const text = popup?.textContent?.normalize('NFC').replace(/\\s+/gu, ' ').trim() || '';
        return text.includes(${JSON.stringify(expectedTitle)}) ? text : null;
      })()`
    );
    if (found) return { ...position, text: found };
  }
  return null;
}

async function selectRegionAndHover(cdp, expectedDatasetTitle, expectedPopupText) {
  const surface = await mapCanvas(cdp);
  if (!surface) throw new Error("visible region map canvas unavailable");
  const step = 36;
  const centerX = surface.left + surface.width / 2;
  const centerY = surface.top + surface.height / 2;
  const positions = [];
  for (let y = surface.top + step / 2; y < surface.top + surface.height - step / 2; y += step) {
    for (let x = surface.left + step / 2; x < surface.left + surface.width - step / 2; x += step) {
      if (surface.blockers.some((box) => x >= box.left && x <= box.right && y >= box.top && y <= box.bottom)) continue;
      positions.push({ x, y, distance: Math.hypot(x - centerX, y - centerY) });
    }
  }
  positions.sort((left, right) => left.distance - right.distance);
  for (let offset = 0; offset < positions.length; offset += 12) {
    const batch = positions.slice(offset, offset + 12);
    for (const position of batch) await mouseClick(cdp, position.x, position.y);
    const selected = await evaluateValue(
      cdp,
      `document.querySelector('[data-testid="map-selected-feature-panel"]')?.getAttribute('data-selected-layer-role') === 'primary' && document.querySelector('[data-testid="map-feature-detail"]')?.textContent?.includes(${JSON.stringify(expectedDatasetTitle)}) === true`
    );
    if (!selected) continue;
    for (const position of batch) {
      await mouseMove(cdp, position.x, position.y);
      await new Promise((resolveWait) => setTimeout(resolveWait, 18));
      const popup = await evaluateValue(
        cdp,
        `(() => {
          const text = document.querySelector('.cdp-map-public-popup')?.textContent || '';
          return text.includes(${JSON.stringify(expectedPopupText)}) ? text : null;
        })()`
      );
      if (popup) return { ...position, text: popup };
    }
  }
  throw new Error(`${expectedDatasetTitle} region feature could not be selected and hovered`);
}

async function findContextPoint(cdp, expectedTitle) {
  for (let pass = 0; pass < 7; pass += 1) {
    const surface = await mapCanvas(cdp);
    if (!surface) break;
    const step = pass < 3 ? 14 : 10;
    const centerX = surface.left + surface.width / 2;
    const centerY = surface.top + surface.height / 2;
    const positions = [];
    for (let y = surface.top + step / 2; y < surface.top + surface.height - step / 2; y += step) {
      for (let x = surface.left + step / 2; x < surface.left + surface.width - step / 2; x += step) {
        if (surface.blockers.some((box) => x >= box.left && x <= box.right && y >= box.top && y <= box.bottom)) continue;
        positions.push({ x, y, distance: Math.hypot(x - centerX, y - centerY) });
      }
    }
    positions.sort((left, right) => left.distance - right.distance);
    for (let offset = 0; offset < positions.length; offset += 12) {
      const batch = positions.slice(offset, offset + 12);
      for (const position of batch) await mouseClick(cdp, position.x, position.y);
      const selected = await evaluateValue(
        cdp,
        `document.querySelector('[data-testid="map-selected-feature-panel"]')?.getAttribute('data-selected-layer-role') === 'context' && document.querySelector('[data-testid="map-feature-detail"]')?.textContent?.includes(${JSON.stringify(expectedTitle)}) === true`
      );
      if (selected) {
        for (const position of batch) {
          await mouseMove(cdp, position.x, position.y);
          const text = await evaluateValue(
            cdp,
            `(() => {
              const text = document.querySelector('.cdp-map-public-popup')?.textContent || '';
              return text.includes(${JSON.stringify(expectedTitle)}) && !/묶음/u.test(text);
            })()`
          );
          if (text) return position;
        }
      }
      if (offset % 120 === 0) await new Promise((resolveWait) => setTimeout(resolveWait, 50));
    }
    // Cluster clicks change the camera. Start a fresh scan after the movement settles.
    await new Promise((resolveWait) => setTimeout(resolveWait, 350));
  }
  throw new Error(`${expectedTitle} context point could not be selected`);
}

let server = null;
let browser = null;
let runtimeFailure = null;
try {
  server = await startStaticBuildServer(resolve(PROJECT_ROOT, "build"));
  browser = await launchHeadlessBrowser();

  await setViewport(browser.cdp, 1440, 1100);
  await navigate(browser.cdp, `${server.url}/#home`);
  await waitForValue(browser.cdp, `Boolean(document.querySelector('[data-v128-home]'))`, {
    timeoutMs: 20_000,
  });
  await capture(browser.cdp, "home-canonical-title.png", "[data-v128-home]");

  await navigate(browser.cdp, mapUrlV129(server.url));
  await waitForMap(browser.cdp);
  await capture(browser.cdp, "map-default-layout.png", ".cdp-map-page");
  await dragSeparator(browser.cdp, "left", 100);
  await capture(browser.cdp, "map-left-panel-expanded.png", ".cdp-map-page");
  await evaluateValue(
    browser.cdp,
    `document.querySelector('[data-testid="map-left-panel-separator"]')?.dispatchEvent(new MouseEvent('dblclick', { bubbles: true }))`
  );
  await dragSeparator(browser.cdp, "right", -100);
  await capture(browser.cdp, "map-right-panel-expanded.png", ".cdp-map-page");
  await capture(browser.cdp, "map-preset-list.png", ".cdp-map-presets");
  await evaluateValue(
    browser.cdp,
    `document.querySelector('[data-testid="map-right-panel-separator"]')?.dispatchEvent(new MouseEvent('dblclick', { bubbles: true }))`
  );

  await clickPreset(browser.cdp, "CLIMATE_VULNERABILITY", "B-021");
  await selectRegionAndHover(browser.cdp, "지역 취약성", "GVI");
  await capture(browser.cdp, "map-gvi-tooltip.png", ".cdp-map-page");
  await waitForValue(
    browser.cdp,
    `document.querySelector('[data-testid="map-selected-feature-panel"]')?.getAttribute('data-selected-layer-role') === 'primary' && Boolean(document.querySelector('[data-testid="map-feature-detail"]'))`,
    { timeoutMs: 8_000 }
  );
  await mouseMove(browser.cdp, 12, 88);
  await new Promise((resolveWait) => setTimeout(resolveWait, 80));
  await capture(browser.cdp, "map-gvi-selected.png", ".cdp-map-page");

  await clickPreset(browser.cdp, "POWER_INFRASTRUCTURE", "A-024");
  const contextPoint = await findContextPoint(browser.cdp, "발전소");
  await mouseMove(browser.cdp, contextPoint.x, contextPoint.y);
  await waitForValue(
    browser.cdp,
    `document.querySelector('.cdp-map-public-popup')?.textContent?.includes('발전소') === true`,
    { timeoutMs: 3_000 }
  );
  await capture(browser.cdp, "map-context-point-tooltip.png", ".cdp-map-page");
  await mouseClick(browser.cdp, contextPoint.x, contextPoint.y);
  await waitForValue(
    browser.cdp,
    `document.querySelector('[data-testid="map-selected-feature-panel"]')?.getAttribute('data-selected-layer-role') === 'context'`,
    { timeoutMs: 5_000 }
  );
  await mouseMove(browser.cdp, 12, 88);
  await new Promise((resolveWait) => setTimeout(resolveWait, 80));
  await capture(browser.cdp, "map-context-point-selected.png", ".cdp-map-page");

  await setViewport(browser.cdp, 1440, 1100);
  await navigate(browser.cdp, detailUrlV129(server.url, "A-002"));
  await waitForValue(
    browser.cdp,
    `Boolean(document.querySelector('[data-testid="chart-viewport-controls"]'))`,
    { timeoutMs: 25_000 }
  );
  await capture(
    browser.cdp,
    "chart-toolbar-desktop.png",
    "[data-chart-interaction-v127=\"true\"]"
  );
  await setViewport(browser.cdp, 390, 900);
  await navigate(browser.cdp, detailUrlV129(server.url, "A-002"));
  await waitForValue(
    browser.cdp,
    `Boolean(document.querySelector('[data-testid="chart-viewport-controls"]'))`,
    { timeoutMs: 25_000 }
  );
  await capture(
    browser.cdp,
    "chart-toolbar-mobile.png",
    "[data-chart-interaction-v127=\"true\"]"
  );

  await setViewport(browser.cdp, 1440, 1100);
  await navigate(browser.cdp, detailUrlV129(server.url, "D-005"));
  await waitForValue(
    browser.cdp,
    `Boolean(document.querySelector('[data-testid="d005-specialized-renderer"]'))`,
    { timeoutMs: 25_000 }
  );
  await capture(
    browser.cdp,
    "d-005-representative-allocation.png",
    "[data-testid=\"d005-specialized-renderer\"]"
  );
  const selectedAlternate = await evaluateValue(
    browser.cdp,
    `(() => {
      const select = document.querySelector('[data-testid="d005-budget-basis-selector"]');
      if (!(select instanceof HTMLSelectElement) || ![...select.options].some((option) => option.value === 'capital')) return false;
      select.value = 'capital';
      select.dispatchEvent(new Event('change', { bubbles: true }));
      return true;
    })()`
  );
  if (!selectedAlternate) throw new Error("D-005 alternate denominator unavailable");
  await waitForValue(
    browser.cdp,
    `document.querySelector('[data-testid="d005-specialized-renderer"]')?.textContent?.includes('2020 기준') === true && document.querySelector('[data-testid="d005-specialized-renderer"]')?.textContent?.includes('약 25%') === true`,
    { timeoutMs: 5_000 }
  );
  await capture(
    browser.cdp,
    "d-005-denominator-selection.png",
    "[data-testid=\"d005-specialized-renderer\"]"
  );
} catch (error) {
  runtimeFailure = error instanceof Error ? error.message : String(error);
} finally {
  if (browser) await browser.close();
  if (server) await server.close();
}

const evidence = screenshotEvidenceV129(requiredNames);
const invalid = evidence.filter((item) => !validScreenshotV129(item));
const duplicateHashes = evidence
  .filter((item) => item.sha256)
  .filter(
    (item, index, values) =>
      values.findIndex((candidate) => candidate.sha256 === item.sha256) !== index
  )
  .map((item) => item.name);

audit.check(
  "SCREENSHOT_RUNTIME",
  runtimeFailure === null,
  runtimeFailure,
  null
);
audit.check(
  "REQUIRED_SCREENSHOTS",
  evidence.length === 13 && invalid.length === 0,
  { count: evidence.length, invalid },
  { count: 13, invalid: [] }
);
audit.check(
  "SCREENSHOT_DISTINCT_STATES",
  duplicateHashes.length === 0,
  duplicateHashes,
  []
);
audit.check(
  "UNCAUGHT_RUNTIME_ERROR",
  (browser?.runtimeErrors?.length || 0) === 0,
  browser?.runtimeErrors || [],
  []
);

finishAuditV129(audit, "screenshot-manifest-v129.json", {
  screenshotCount: evidence.length,
  screenshots: evidence,
  duplicateHashes,
});
