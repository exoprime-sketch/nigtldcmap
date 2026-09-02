#!/usr/bin/env node

import { resolve } from "node:path";

import { PROJECT_ROOT } from "./v125/audit-utils.mjs";
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
  REQUIRED_SCREENSHOTS_V133,
  REQUIRED_VIEWPORTS_V133,
  V133_SCREENSHOT_ROOT,
  mapUrlV133,
  screenshotEvidenceV133,
  validScreenshotV133,
  writeJsonV133,
} from "./v133/audit-helpers.mjs";

const sleep = (milliseconds) => new Promise((resolveWait) => setTimeout(resolveWait, milliseconds));
const screenshotPath = (name) => resolve(V133_SCREENSHOT_ROOT, name);

async function selectPreset(cdp, presetId, expectedPrimary) {
  const clicked = await evaluateValue(
    cdp,
    `(() => {
      const button = document.querySelector('[data-testid="map-analysis-preset"][data-preset-id=${JSON.stringify(presetId)}]');
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
      const loading = document.querySelector('.cdp-map-overlay-card')?.textContent || '';
      return root?.getAttribute('data-primary-element') === ${JSON.stringify(expectedPrimary)} &&
        root?.getAttribute('data-context-layer-count') === '0' && !/불러오는 중/u.test(loading);
    })()`,
    { timeoutMs: 35_000 }
  );
  await sleep(180);
}

async function setContext(cdp, elementId, enabled) {
  const state = await evaluateValue(
    cdp,
    `(() => (document.querySelector('[data-testid="map-public-content"]')?.getAttribute('data-context-elements') || '').split(',').includes(${JSON.stringify(elementId)}))()`
  );
  if (state === enabled) return;
  const clicked = await evaluateValue(
    cdp,
    `(() => {
      const explicit = document.querySelector('[data-testid="map-context-toggle-v133"][data-map-element=${JSON.stringify(elementId)}]');
      const card = document.querySelector('.cdp-layer-card[data-map-element=${JSON.stringify(elementId)}]');
      const fallback = [...(card?.querySelectorAll('button') || [])].find((node) => /함께 보기|보조 표시|끄기/u.test(node.textContent || ''));
      const button = explicit || fallback;
      if (!(button instanceof HTMLButtonElement) || button.disabled) return false;
      button.click();
      return true;
    })()`
  );
  if (!clicked) throw new Error(`context action unavailable: ${elementId}`);
  await waitForValue(
    cdp,
    `(() => (document.querySelector('[data-testid="map-public-content"]')?.getAttribute('data-context-elements') || '').split(',').includes(${JSON.stringify(elementId)}) === ${enabled})()`,
    { timeoutMs: 35_000 }
  );
  await sleep(180);
}

async function selectFinanceType(cdp, type) {
  const label = type === "carbon" ? "탄소크레딧" : "적응기금";
  const clicked = await evaluateValue(
    cdp,
    `(() => {
      const explicit = document.querySelector('[data-testid="map-finance-type-selector-v133"] [data-finance-type=${JSON.stringify(type)}]');
      const fallback = [...document.querySelectorAll('[data-testid="map-finance-type-selector-v133"] button')].find((node) => (node.textContent || '').includes(${JSON.stringify(label)}));
      const button = explicit || fallback;
      if (!(button instanceof HTMLButtonElement)) return false;
      button.click();
      return true;
    })()`
  );
  if (!clicked) throw new Error(`finance type action unavailable: ${type}`);
  await waitForValue(
    cdp,
    `document.querySelector('[data-testid="map-public-content"]')?.getAttribute('data-primary-element') === ${JSON.stringify(type === "carbon" ? "C-025" : "D-018")}`,
    { timeoutMs: 35_000 }
  );
  await sleep(180);
}

async function captureWorkspace(cdp, name) {
  await evaluateValue(cdp, `window.scrollTo({ top: 0, left: 0, behavior: 'instant' }); true`);
  await sleep(100);
  return captureElementPng(cdp, '[data-testid="map-resizable-layout"]', screenshotPath(name));
}

async function assertNoStaleGviPopup(cdp) {
  await waitForValue(
    cdp,
    `(() => ![...document.querySelectorAll('[data-testid="map-hover-popup-v133"], [data-testid="map-feature-tooltip"]')].some((node) => /GVI|지역 취약성|Quảng Bình/u.test(node.textContent || '')))()`,
    { timeoutMs: 10_000 }
  );
  return evaluateValue(
    cdp,
    `(() => [...document.querySelectorAll('[data-testid="map-hover-popup-v133"], [data-testid="map-feature-tooltip"]')].filter((node) => /GVI|지역 취약성|Quảng Bình/u.test(node.textContent || '')).length)()`
  );
}

async function focusGviRegion(cdp) {
  const targetPoint = await evaluateValue(
    cdp,
    `(() => {
      const features = [...document.querySelectorAll('[data-testid="map-selectable-adm1-feature"][data-element-id="B-021"]')];
      const target = features.find((node) => /Quảng Bình/u.test(node.getAttribute('aria-label') || '')) || features[0];
      if (!(target instanceof SVGElement)) return null;
      const rect = target.getBoundingClientRect();
      target.focus();
      return {
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2,
      };
    })()`
  );
  if (!targetPoint) throw new Error("GVI fallback region unavailable");
  await cdp.send("Input.dispatchMouseEvent", {
    type: "mouseMoved",
    x: targetPoint.x,
    y: targetPoint.y,
  });
  await evaluateValue(
    cdp,
    `(() => {
      const features = [...document.querySelectorAll('[data-testid="map-selectable-adm1-feature"][data-element-id="B-021"]')];
      const target = features.find((node) => /Quảng Bình/u.test(node.getAttribute('aria-label') || '')) || features[0];
      if (!(target instanceof SVGElement)) return false;
      target.dispatchEvent(new MouseEvent('mouseover', { bubbles: true }));
      return true;
    })()`
  );
  await waitForValue(
    cdp,
    `Boolean(document.querySelector('[data-testid="map-hover-popup-v133"], [data-testid="map-feature-tooltip"]'))`,
    { timeoutMs: 10_000 }
  );
  const pixelVisible = await evaluateValue(
    cdp,
    `(() => [...document.querySelectorAll('[data-testid="map-hover-popup-v133"], [data-testid="map-feature-tooltip"]')].some((node) => {
      const rect = node.getBoundingClientRect();
      const style = getComputedStyle(node);
      if (rect.width <= 0 || rect.height <= 0 || style.display === 'none' || style.visibility === 'hidden' || Number(style.opacity || 1) <= 0) return false;
      const topmost = document.elementFromPoint(rect.left + rect.width / 2, rect.top + rect.height / 2);
      return Boolean(topmost && node.contains(topmost));
    }))()`
  );
  if (!pixelVisible) throw new Error("GVI hover popup exists in DOM but is not pixel-visible");
  return pixelVisible;
}

async function revealSelectedDetail(cdp) {
  const revealed = await evaluateValue(
    cdp,
    `(() => {
      const aside = document.querySelector('[data-testid="map-analysis-panel"]');
      const panel = document.querySelector('[data-testid="map-selected-feature-panel"]');
      if (!(aside instanceof HTMLElement) || !(panel instanceof HTMLElement)) return false;
      aside.scrollTop = Math.max(0, panel.offsetTop - 12);
      return true;
    })()`
  );
  if (!revealed) throw new Error("selected GVI detail could not be revealed");
  await sleep(120);
}

async function selectFocusedGviRegion(cdp) {
  const selected = await evaluateValue(
    cdp,
    `(() => {
      const features = [...document.querySelectorAll('[data-testid="map-selectable-adm1-feature"][data-element-id="B-021"]')];
      const target = features.find((node) => /Quảng Bình/u.test(node.getAttribute('aria-label') || '')) || features[0];
      if (!(target instanceof SVGElement)) return false;
      target.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      return true;
    })()`
  );
  if (!selected) throw new Error("focused GVI region not selectable");
  await waitForValue(
    cdp,
    `Boolean(document.querySelector('[data-testid="map-selected-detail-v133"], [data-testid="map-feature-detail"]'))`,
    { timeoutMs: 10_000 }
  );
}

async function openFinanceCompare(cdp) {
  const clicked = await evaluateValue(
    cdp,
    `(() => {
      const explicit = document.querySelector('[data-testid="map-finance-compare-v133"]');
      const fallback = [...document.querySelectorAll('button')].find((node) => /비교해서 보기/u.test(node.textContent || ''));
      const button = explicit || fallback;
      if (!(button instanceof HTMLButtonElement)) return false;
      button.click();
      return true;
    })()`
  );
  if (!clicked) throw new Error("finance compare action unavailable");
  await waitForValue(
    cdp,
    `document.querySelector('[data-testid="map-public-content"]')?.getAttribute('data-context-layer-count') === '1'`,
    { timeoutMs: 35_000 }
  );
  await sleep(180);
}

async function openOverlapPicker(cdp) {
  const alreadyVisible = await evaluateValue(
    cdp,
    `Boolean(document.querySelector('[data-testid="map-overlap-picker-v133"]'))`
  );
  if (alreadyVisible) return true;

  const statisticalPoint = await evaluateValue(
    cdp,
    `(() => {
      const node = document.querySelector('[data-testid="map-budget-statistical-point-v133"]');
      const rect = node?.getBoundingClientRect();
      if (node instanceof SVGElement) {
        node.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      }
      return rect && rect.width > 0 && rect.height > 0
        ? { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 }
        : null;
    })()`
  );
  await sleep(80);
  if (await evaluateValue(cdp, `Boolean(document.querySelector('[data-testid="map-overlap-picker-v133"]'))`)) return true;
  if (statisticalPoint) {
    await cdp.send("Input.dispatchMouseEvent", { type: "mousePressed", x: statisticalPoint.x, y: statisticalPoint.y, button: "left", clickCount: 1 });
    await cdp.send("Input.dispatchMouseEvent", { type: "mouseReleased", x: statisticalPoint.x, y: statisticalPoint.y, button: "left", clickCount: 1 });
    await sleep(120);
    if (await evaluateValue(cdp, `Boolean(document.querySelector('[data-testid="map-overlap-picker-v133"]'))`)) return true;
  }

  const collision = await evaluateValue(
    cdp,
    `(() => {
      const nodes = [...document.querySelectorAll('.cdp-map-fallback__feature-control[data-layer-role]')];
      const points = nodes.map((node) => {
        const rect = node.getBoundingClientRect();
        return { node, x: rect.left + rect.width / 2, y: rect.top + rect.height / 2, role: node.getAttribute('data-layer-role') };
      }).filter((item) => item.x > 0 && item.y > 0);
      for (let index = 0; index < points.length; index += 1) {
        for (let other = index + 1; other < points.length; other += 1) {
          if (points[index].role === points[other].role) continue;
          if (Math.hypot(points[index].x - points[other].x, points[index].y - points[other].y) <= 16) {
            return { x: (points[index].x + points[other].x) / 2, y: (points[index].y + points[other].y) / 2 };
          }
        }
      }
      return null;
    })()`
  );
  if (collision) {
    await cdp.send("Input.dispatchMouseEvent", { type: "mousePressed", x: collision.x, y: collision.y, button: "left", clickCount: 1 });
    await cdp.send("Input.dispatchMouseEvent", { type: "mouseReleased", x: collision.x, y: collision.y, button: "left", clickCount: 1 });
    await sleep(120);
    if (await evaluateValue(cdp, `Boolean(document.querySelector('[data-testid="map-overlap-picker-v133"]'))`)) return true;
  }

  const canvasRect = await evaluateValue(
    cdp,
    `(() => {
      const node = document.querySelector('.cdp-map-canvas');
      const rect = node?.getBoundingClientRect();
      return rect ? { left: rect.left, top: rect.top, width: rect.width, height: rect.height } : null;
    })()`
  );
  if (!canvasRect) return false;
  const columns = 14;
  const rows = 10;
  for (let row = 1; row < rows; row += 1) {
    for (let column = 1; column < columns; column += 1) {
      const x = canvasRect.left + (canvasRect.width * column) / columns;
      const y = canvasRect.top + (canvasRect.height * row) / rows;
      await cdp.send("Input.dispatchMouseEvent", { type: "mousePressed", x, y, button: "left", clickCount: 1 });
      await cdp.send("Input.dispatchMouseEvent", { type: "mouseReleased", x, y, button: "left", clickCount: 1 });
      if (await evaluateValue(cdp, `Boolean(document.querySelector('[data-testid="map-overlap-picker-v133"]'))`)) return true;
    }
  }
  return false;
}

let server = null;
let browser = null;
let runtimeFailure = null;
const viewportChecks = [];
const brokenAssets = [];
const htmlForJson = [];
let overlapPickerOpened = false;
let gviHoverPixelVisible = false;
let staleFinanceGviPopupCount = 0;
try {
  server = await startStaticBuildServer(resolve(PROJECT_ROOT, "build"));
  browser = await launchHeadlessBrowser();
  await browser.cdp.send("Network.enable");
  browser.cdp.on("Network.responseReceived", ({ response }) => {
    const url = String(response?.url || "");
    const status = Number(response?.status || 0);
    const mimeType = String(response?.mimeType || "").toLowerCase();
    if (status >= 400) brokenAssets.push({ url, status });
    if (/\.(?:json|geojson)(?:[?#]|$)/u.test(url) && mimeType.includes("text/html")) {
      htmlForJson.push({ url, status, mimeType });
    }
  });

  await setViewport(browser.cdp, 1440, 1100);
  await navigate(browser.cdp, mapUrlV133(server.url));
  await waitForValue(browser.cdp, `document.querySelectorAll('.cdp-layer-card[data-map-element]').length === 12`, {
    timeoutMs: 35_000,
  });

  await selectPreset(browser.cdp, "CLIMATE_VULNERABILITY", "B-021");
  await captureWorkspace(browser.cdp, "map-vulnerability-primary-only.png");
  await setContext(browser.cdp, "D-008", true);
  await captureWorkspace(browser.cdp, "map-vulnerability-budget-context.png");
  await setContext(browser.cdp, "D-008", false);
  await setContext(browser.cdp, "D-018", true);
  await captureWorkspace(browser.cdp, "map-vulnerability-adaptation-context.png");
  await setContext(browser.cdp, "D-018", false);

  gviHoverPixelVisible = await focusGviRegion(browser.cdp);
  await captureElementPng(
    browser.cdp,
    '[data-testid="map-hover-popup-v133"], [data-testid="map-feature-tooltip"]',
    screenshotPath("map-gvi-hover.png")
  );
  await selectFocusedGviRegion(browser.cdp);
  await revealSelectedDetail(browser.cdp);
  await captureElementPng(
    browser.cdp,
    '[data-testid="map-selected-feature-panel"]',
    screenshotPath("map-gvi-selected-detail.png")
  );

  await selectPreset(browser.cdp, "CLIMATE_FINANCE_PROJECTS", "D-018");
  staleFinanceGviPopupCount += await assertNoStaleGviPopup(browser.cdp);
  await captureWorkspace(browser.cdp, "map-finance-adaptation.png");
  await selectFinanceType(browser.cdp, "carbon");
  staleFinanceGviPopupCount += await assertNoStaleGviPopup(browser.cdp);
  await captureWorkspace(browser.cdp, "map-finance-carbon.png");
  await openFinanceCompare(browser.cdp);
  staleFinanceGviPopupCount += await assertNoStaleGviPopup(browser.cdp);
  await captureWorkspace(browser.cdp, "map-finance-compare.png");

  await selectPreset(browser.cdp, "CLIMATE_VULNERABILITY", "B-021");
  await setContext(browser.cdp, "D-008", true);
  overlapPickerOpened = await openOverlapPicker(browser.cdp);
  if (!overlapPickerOpened) throw new Error("overlap feature picker could not be opened");
  await captureElementPng(
    browser.cdp,
    '[data-testid="map-overlap-picker-v133"]',
    screenshotPath("map-overlap-feature-picker.png")
  );

  for (const width of REQUIRED_VIEWPORTS_V133) {
    await setViewport(browser.cdp, width, width < 800 ? 900 : 1050);
    await navigate(browser.cdp, mapUrlV133(server.url));
    await waitForValue(browser.cdp, `Boolean(document.querySelector('[data-testid="map-public-content"]'))`, {
      timeoutMs: 35_000,
    });
    await selectPreset(browser.cdp, "CLIMATE_VULNERABILITY", "B-021");
    viewportChecks.push(
      await evaluateValue(
        browser.cdp,
        `(() => {
          const canvas = document.querySelector('.cdp-map-canvas-wrap');
          const presetStrip = document.querySelector('.cdp-map-preset-scroll');
          return {
            width: window.innerWidth,
            horizontalOverflow: Math.max(0, document.documentElement.scrollWidth - window.innerWidth),
            canvasWidth: Math.round(canvas?.getBoundingClientRect().width || 0),
            presetOverflow: presetStrip ? Math.max(0, presetStrip.scrollWidth - presetStrip.clientWidth) : null,
            primary: document.querySelector('[data-testid="map-public-content"]')?.getAttribute('data-primary-element') || '',
          };
        })()`
      )
    );
  }
} catch (error) {
  runtimeFailure = error instanceof Error ? error.message : String(error);
} finally {
  if (browser) await browser.close();
  if (server) await server.close();
}

const screenshots = REQUIRED_SCREENSHOTS_V133.map(screenshotEvidenceV133);
const invalid = screenshots.filter((item) => !validScreenshotV133(item, { width: 180, height: 80 }));
const duplicateHashes = screenshots
  .filter((item) => item.sha256)
  .filter((item, index, items) => items.findIndex((candidate) => candidate.sha256 === item.sha256) !== index)
  .map((item) => item.name);
const runtimeErrors = browser?.runtimeErrors || [];
const status =
  runtimeFailure === null &&
  invalid.length === 0 &&
  duplicateHashes.length === 0 &&
  gviHoverPixelVisible &&
  viewportChecks.length === REQUIRED_VIEWPORTS_V133.length &&
  viewportChecks.every((item) => item.canvasWidth > 0 && item.horizontalOverflow <= 2) &&
  runtimeErrors.length === 0 &&
  brokenAssets.length === 0 &&
  htmlForJson.length === 0 &&
  staleFinanceGviPopupCount === 0
    ? "PASS"
    : "FAIL";

writeJsonV133(resolve(V133_SCREENSHOT_ROOT, "screenshot-manifest-v133.json"), {
  schemaVersion: "v133-map-screenshot-manifest-1",
  generatedAt: new Date().toISOString(),
  status,
  requiredCount: REQUIRED_SCREENSHOTS_V133.length,
  screenshotCount: screenshots.filter((item) => item.error === null).length,
  requiredViewports: REQUIRED_VIEWPORTS_V133,
  viewportChecks,
  overlapPickerOpened,
  gviHoverPixelVisible,
  staleFinanceGviPopupCount,
  runtimeFailure,
  runtimeErrors,
  brokenAssets,
  htmlForJson,
  invalid: invalid.map((item) => item.name),
  duplicateHashes,
  screenshots,
});

console.log(
  JSON.stringify({
    type: "summary",
    audit: "screenshots:v133",
    status,
    screenshotCount: screenshots.filter((item) => item.error === null).length,
    requiredCount: REQUIRED_SCREENSHOTS_V133.length,
    viewportCount: viewportChecks.length,
    runtimeFailure,
    runtimeErrorCount: runtimeErrors.length,
    brokenAssetCount: brokenAssets.length,
    htmlForJsonCount: htmlForJson.length,
    staleFinanceGviPopupCount,
    invalid: invalid.map((item) => item.name),
    duplicateHashes,
  })
);

if (status !== "PASS") process.exitCode = 1;
