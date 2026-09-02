#!/usr/bin/env node

import { createHash } from "node:crypto";
import {
  existsSync,
  mkdirSync,
  readFileSync,
  rmSync,
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

const SCREENSHOT_ROOT = resolve(PROJECT_ROOT, "reports/v134/screenshots");
const REQUIRED_SCREENSHOTS = [
  "d011-oda-overview.png",
  "d011-oda-provider-ranking.png",
  "d011-oda-provider-trend.png",
  "b005-spei-overview.png",
  "b005-spei-scenario-trend.png",
  "b005-spei-year-comparison.png",
  "glossary-oda-hover.png",
  "glossary-spei-hover.png",
  "glossary-ssp-hover.png",
  "glossary-mobile.png",
  "map-gvi-glossary.png",
];

mkdirSync(SCREENSHOT_ROOT, { recursive: true });
for (const name of REQUIRED_SCREENSHOTS) {
  rmSync(resolve(SCREENSHOT_ROOT, name), { force: true });
}

function screenshotPath(name) {
  return resolve(SCREENSHOT_ROOT, name);
}

function guideUrl(baseUrl) {
  const url = new URL(baseUrl);
  url.searchParams.set("guide", "glossary");
  url.hash = "guide";
  return url.toString();
}

async function settleVisualState(cdp) {
  await evaluateValue(
    cdp,
    `new Promise((resolve) => {
      const afterFonts = () => requestAnimationFrame(() => requestAnimationFrame(() => resolve(true)));
      if (document.fonts?.ready) document.fonts.ready.then(afterFonts, afterFonts);
      else afterFonts();
    })`
  );
}

async function makeSiteHeaderStatic(cdp) {
  await evaluateValue(
    cdp,
    `(() => {
      const header = document.querySelector('.site-header');
      if (!(header instanceof HTMLElement)) return false;
      header.style.setProperty('position', 'static', 'important');
      return true;
    })()`
  );
  await settleVisualState(cdp);
}

function visibleElementExpression(selector) {
  return `(() => {
    const node = document.querySelector(${JSON.stringify(selector)});
    if (!(node instanceof Element)) return false;
    const rect = node.getBoundingClientRect();
    const style = getComputedStyle(node);
    return rect.width > 0 && rect.height > 0 && style.display !== 'none' &&
      style.visibility !== 'hidden' && Number(style.opacity || 1) > 0;
  })()`;
}

async function waitForVisible(cdp, selector, timeoutMs = 30_000) {
  await waitForValue(cdp, visibleElementExpression(selector), { timeoutMs });
}

async function preparePage(cdp, url, readySelector) {
  await navigate(cdp, url);
  await waitForVisible(cdp, readySelector);
  await settleVisualState(cdp);
}

async function markCaptureTarget(cdp, selectors, headingPatterns = []) {
  const result = await evaluateValue(
    cdp,
    `(() => {
      document.querySelectorAll('[data-v134-capture-target]').forEach((node) => {
        node.removeAttribute('data-v134-capture-target');
      });
      const visible = (node) => {
        if (!(node instanceof Element)) return false;
        const rect = node.getBoundingClientRect();
        const style = getComputedStyle(node);
        return rect.width > 0 && rect.height > 0 && style.display !== 'none' &&
          style.visibility !== 'hidden' && Number(style.opacity || 1) > 0;
      };
      const selectors = ${JSON.stringify(selectors)};
      let target = selectors.map((selector) => document.querySelector(selector)).find(visible) || null;
      if (!target) {
        const patterns = ${JSON.stringify(headingPatterns)}.map((value) => new RegExp(value, 'u'));
        const heading = [...document.querySelectorAll('h1, h2, h3, h4, strong')]
          .find((node) => patterns.some((pattern) => pattern.test((node.textContent || '').normalize('NFC'))));
        target = heading?.closest('section, article, [data-testid]') || heading?.parentElement || null;
      }
      if (!visible(target)) return null;
      target.setAttribute('data-v134-capture-target', 'true');
      target.scrollIntoView({ block: 'center', inline: 'nearest', behavior: 'instant' });
      return {
        tagName: target.tagName,
        testId: target.getAttribute('data-testid') || '',
        text: (target.textContent || '').normalize('NFC').replace(/\\s+/gu, ' ').trim().slice(0, 240),
      };
    })()`
  );
  if (!result) {
    throw new Error(
      `visual target unavailable: ${selectors.join(", ")} / ${headingPatterns.join(", ")}`
    );
  }
  await settleVisualState(cdp);
  return result;
}

async function captureMarkedTarget(cdp, name, selectors, headingPatterns = []) {
  const target = await markCaptureTarget(cdp, selectors, headingPatterns);
  await makeSiteHeaderStatic(cdp);
  await captureElementPng(
    cdp,
    '[data-v134-capture-target="true"]',
    screenshotPath(name)
  );
  return target;
}

async function captureUnion(cdp, name, selectors, padding = 18) {
  const clip = await evaluateValue(
    cdp,
    `(() => {
      const selectors = ${JSON.stringify(selectors)};
      const boxes = selectors.map((selector) => document.querySelector(selector))
        .flatMap((node) => {
          if (!(node instanceof Element)) return [];
          const rect = node.getBoundingClientRect();
          const style = getComputedStyle(node);
          return rect.width > 0 && rect.height > 0 && style.display !== 'none' &&
            style.visibility !== 'hidden' && Number(style.opacity || 1) > 0
            ? [{
                left: rect.left + window.scrollX,
                top: rect.top + window.scrollY,
                right: rect.right + window.scrollX,
                bottom: rect.bottom + window.scrollY,
              }]
            : [];
        });
      if (boxes.length !== selectors.length) return null;
      const padding = ${padding};
      const left = Math.max(0, Math.min(...boxes.map((box) => box.left)) - padding);
      const top = Math.max(0, Math.min(...boxes.map((box) => box.top)) - padding);
      const right = Math.min(
        document.documentElement.scrollWidth,
        Math.max(...boxes.map((box) => box.right)) + padding
      );
      const bottom = Math.min(
        document.documentElement.scrollHeight,
        Math.max(...boxes.map((box) => box.bottom)) + padding
      );
      return {
        x: left,
        y: top,
        width: Math.max(1, right - left),
        height: Math.max(1, bottom - top),
      };
    })()`
  );
  if (!clip) throw new Error(`screenshot union unavailable: ${selectors.join(", ")}`);
  const result = await cdp.send("Page.captureScreenshot", {
    format: "png",
    fromSurface: true,
    captureBeyondViewport: true,
    clip: { ...clip, scale: 1 },
  });
  writeFileSync(screenshotPath(name), Buffer.from(result.data, "base64"));
  return clip;
}

async function captureViewport(cdp, name) {
  const viewport = await evaluateValue(
    cdp,
    `({ width: window.innerWidth, height: window.innerHeight })`
  );
  const result = await cdp.send("Page.captureScreenshot", {
    format: "png",
    fromSurface: true,
    captureBeyondViewport: false,
  });
  writeFileSync(screenshotPath(name), Buffer.from(result.data, "base64"));
  return viewport;
}

async function chooseProvider(cdp) {
  const changed = await evaluateValue(
    cdp,
    `(() => {
      const select = document.querySelector('[data-testid="d011-provider-selector"]');
      if (!(select instanceof HTMLSelectElement) || select.options.length < 2) return false;
      const option = [...select.options].find((item) => item.value && !item.disabled) || select.options[1];
      select.value = option.value;
      select.dispatchEvent(new Event('change', { bubbles: true }));
      return true;
    })()`
  );
  if (!changed) throw new Error("D-011 provider selection unavailable");
  await settleVisualState(cdp);
}

async function chooseSpeiYear(cdp, year = "2100") {
  const changed = await evaluateValue(
    cdp,
    `(() => {
      const root = document.querySelector('[data-testid="b005-specialized-analysis"]');
      const button = [...(root?.querySelectorAll('button') || [])]
        .find((node) => (node.textContent || '').trim().replace(/년$/u, '') === ${JSON.stringify(year)});
      if (!(button instanceof HTMLButtonElement)) return false;
      button.click();
      return true;
    })()`
  );
  if (!changed) throw new Error(`B-005 selected year unavailable: ${year}`);
  await settleVisualState(cdp);
}

async function ensureTermPage(cdp, primaryUrl, fallbackUrl, termId) {
  const triggerSelector = `[data-public-term-v134=${JSON.stringify(termId)}]`;
  await navigate(cdp, primaryUrl);
  try {
    await waitForVisible(cdp, triggerSelector, 8_000);
  } catch {
    await navigate(cdp, fallbackUrl);
    await waitForVisible(cdp, triggerSelector, 20_000);
  }
  await settleVisualState(cdp);
  return triggerSelector;
}

async function openTermTooltip(cdp, termId, mode = "hover") {
  const triggerSelector = `[data-public-term-v134=${JSON.stringify(termId)}]`;
  const tooltipSelector = `[data-public-term-tooltip-v134=${JSON.stringify(termId)}]`;
  const scrolled = await evaluateValue(
    cdp,
    `(() => {
      const trigger = document.querySelector(${JSON.stringify(triggerSelector)});
      if (!(trigger instanceof HTMLButtonElement)) return false;
      trigger.scrollIntoView({ block: 'center', inline: 'nearest', behavior: 'instant' });
      return true;
    })()`
  );
  if (!scrolled) throw new Error(`glossary trigger unavailable: ${termId}`);
  await settleVisualState(cdp);
  const target = await evaluateValue(
    cdp,
    `(() => {
      const trigger = document.querySelector(${JSON.stringify(triggerSelector)});
      const rect = trigger?.getBoundingClientRect();
      return rect && rect.width > 0 && rect.height > 0
        ? { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 }
        : null;
    })()`
  );
  if (!target) throw new Error(`glossary trigger was not visible after scroll: ${termId}`);
  if (mode === "tap") {
    const clicked = await evaluateValue(
      cdp,
      `(() => {
        const trigger = document.querySelector(${JSON.stringify(triggerSelector)});
        if (!(trigger instanceof HTMLButtonElement)) return false;
        trigger.click();
        return true;
      })()`
    );
    if (!clicked) throw new Error(`glossary tap unavailable: ${termId}`);
  } else {
    await cdp.send("Input.dispatchMouseEvent", {
      type: "mouseMoved",
      x: target.x,
      y: target.y,
      button: "none",
      buttons: 0,
      pointerType: "mouse",
    });
    await evaluateValue(
      cdp,
      `(() => {
        const trigger = document.querySelector(${JSON.stringify(triggerSelector)});
        if (!(trigger instanceof HTMLButtonElement)) return false;
        trigger.dispatchEvent(new PointerEvent('pointerover', {
          bubbles: true,
          pointerType: 'mouse',
        }));
        trigger.dispatchEvent(new MouseEvent('mouseover', { bubbles: true }));
        return true;
      })()`
    );
  }
  await waitForValue(
    cdp,
    `(() => {
      const trigger = document.querySelector(${JSON.stringify(triggerSelector)});
      const tooltip = document.querySelector(${JSON.stringify(tooltipSelector)});
      const rect = tooltip?.getBoundingClientRect();
      return trigger?.getAttribute('aria-expanded') === 'true' && Boolean(
        rect && rect.width > 0 && rect.height > 0 &&
        trigger?.getAttribute('aria-describedby') === tooltip?.id
      );
    })()`,
    { timeoutMs: 10_000 }
  );
  await settleVisualState(cdp);
  return { triggerSelector, tooltipSelector };
}

async function selectClimateVulnerabilityPreset(cdp) {
  await waitForValue(
    cdp,
    `document.querySelectorAll('.cdp-layer-card[data-map-element]').length === 12`,
    { timeoutMs: 35_000 }
  );
  const clicked = await evaluateValue(
    cdp,
    `(() => {
      const button = document.querySelector('[data-testid="map-analysis-preset"][data-preset-id="CLIMATE_VULNERABILITY"]');
      if (!(button instanceof HTMLButtonElement)) return false;
      button.click();
      return true;
    })()`
  );
  if (!clicked) throw new Error("climate vulnerability preset unavailable");
  await waitForValue(
    cdp,
    `(() => {
      const root = document.querySelector('[data-testid="map-public-content"]');
      const loading = document.querySelector('.cdp-map-overlay-card')?.textContent || '';
      const rendered = (root?.getAttribute('data-rendered-map-elements') || '').split(',');
      return root?.getAttribute('data-primary-element') === 'B-021' &&
        rendered.includes('B-021') && !/불러오는 중/u.test(loading) &&
        Boolean(document.querySelector('[data-public-term-v134="gvi"]'));
    })()`,
    { timeoutMs: 35_000 }
  );
  await settleVisualState(cdp);
}

let server = null;
let browser = null;
const captures = [];
const brokenAssets = [];
const htmlForJson = [];

async function runCapture(name, task) {
  console.log(JSON.stringify({ type: "capture:start", audit: "screenshots:v134", name }));
  try {
    const details = await task();
    captures.push({ name, status: "PASS", details: details || null, error: null });
    console.log(JSON.stringify({ type: "capture:result", name, status: "PASS" }));
  } catch (error) {
    captures.push({
      name,
      status: "FAIL",
      details: null,
      error: error instanceof Error ? error.message : String(error),
    });
    console.log(
      JSON.stringify({
        type: "capture:result",
        name,
        status: "FAIL",
        error: error instanceof Error ? error.message : String(error),
      })
    );
  }
}

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

  const d011Url = detailUrlV129(server.url, "D-011");
  const b005Url = detailUrlV129(server.url, "B-005");
  const glossaryUrl = guideUrl(server.url);

  await setViewport(browser.cdp, 1440, 1100);
  await runCapture("d011-oda-overview.png", async () => {
    await preparePage(browser.cdp, d011Url, '[data-testid="d011-specialized-analysis"]');
    return captureMarkedTarget(
      browser.cdp,
      "d011-oda-overview.png",
      ['[data-testid="d011-specialized-analysis"]'],
      ["베트남 ODA 유입 현황"]
    );
  });
  await runCapture("d011-oda-provider-ranking.png", async () => {
    await preparePage(browser.cdp, d011Url, '[data-testid="d011-specialized-analysis"]');
    return captureMarkedTarget(
      browser.cdp,
      "d011-oda-provider-ranking.png",
      ['[data-testid="d011-provider-ranking"]', '[data-provider-ranking="true"]'],
      ["공여국별 ODA", "공여국 순위"]
    );
  });
  await runCapture("d011-oda-provider-trend.png", async () => {
    await preparePage(browser.cdp, d011Url, '[data-testid="d011-specialized-analysis"]');
    await chooseProvider(browser.cdp);
    return captureMarkedTarget(
      browser.cdp,
      "d011-oda-provider-trend.png",
      ['[data-testid="d011-provider-trend"]'],
      ["공여국별 연도 추이", "선택 공여국"]
    );
  });

  await runCapture("b005-spei-overview.png", async () => {
    await preparePage(browser.cdp, b005Url, '[data-testid="b005-specialized-analysis"]');
    return captureMarkedTarget(
      browser.cdp,
      "b005-spei-overview.png",
      ['[data-testid="b005-specialized-analysis"]'],
      ["가뭄 위험 전망"]
    );
  });
  await runCapture("b005-spei-scenario-trend.png", async () => {
    await preparePage(browser.cdp, b005Url, '[data-testid="b005-specialized-analysis"]');
    return captureMarkedTarget(
      browser.cdp,
      "b005-spei-scenario-trend.png",
      ['[data-testid="b005-scenario-trend"]'],
      ["시나리오별 SPEI", "SPEI-12 전망"]
    );
  });
  await runCapture("b005-spei-year-comparison.png", async () => {
    await preparePage(browser.cdp, b005Url, '[data-testid="b005-specialized-analysis"]');
    await chooseSpeiYear(browser.cdp, "2100");
    return captureMarkedTarget(
      browser.cdp,
      "b005-spei-year-comparison.png",
      ['[data-testid="b005-selected-year-comparison"]'],
      ["선택연도 시나리오 비교", "2100년 시나리오"]
    );
  });

  for (const termCapture of [
    { name: "glossary-oda-hover.png", termId: "oda", primaryUrl: d011Url },
    { name: "glossary-spei-hover.png", termId: "spei-12", primaryUrl: b005Url },
    { name: "glossary-ssp-hover.png", termId: "ssp2-4-5", primaryUrl: b005Url },
  ]) {
    await runCapture(termCapture.name, async () => {
      await setViewport(browser.cdp, 1440, 900);
      await ensureTermPage(
        browser.cdp,
        termCapture.primaryUrl,
        glossaryUrl,
        termCapture.termId
      );
      await openTermTooltip(browser.cdp, termCapture.termId, "hover");
      return captureViewport(browser.cdp, termCapture.name);
    });
  }

  await runCapture("glossary-mobile.png", async () => {
    await setViewport(browser.cdp, 390, 844);
    await ensureTermPage(browser.cdp, glossaryUrl, glossaryUrl, "oda");
    await openTermTooltip(browser.cdp, "oda", "tap");
    return captureViewport(browser.cdp, "glossary-mobile.png");
  });

  await runCapture("map-gvi-glossary.png", async () => {
    await setViewport(browser.cdp, 1440, 1000);
    await navigate(browser.cdp, mapUrlV129(server.url));
    await waitForVisible(browser.cdp, '[data-testid="map-public-content"]', 35_000);
    await selectClimateVulnerabilityPreset(browser.cdp);
    await openTermTooltip(browser.cdp, "gvi", "hover");
    await makeSiteHeaderStatic(browser.cdp);
    return captureUnion(
      browser.cdp,
      "map-gvi-glossary.png",
      [
        '[data-testid="map-resizable-layout"]',
        '[data-public-term-tooltip-v134="gvi"]',
      ],
      0
    );
  });
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  for (const name of REQUIRED_SCREENSHOTS) {
    if (!captures.some((item) => item.name === name)) {
      captures.push({ name, status: "FAIL", details: null, error: message });
    }
  }
} finally {
  if (browser) await browser.close();
  if (server) await server.close();
}

const screenshots = REQUIRED_SCREENSHOTS.map((name) => {
  const path = screenshotPath(name);
  const dimensions = pngDimensions(path);
  return {
    name,
    ...dimensions,
    sha256:
      existsSync(path) && statSync(path).isFile()
        ? createHash("sha256").update(readFileSync(path)).digest("hex")
        : null,
    capture: captures.find((item) => item.name === name) || null,
  };
});
const invalid = screenshots.filter(
  (item) =>
    item.error !== null ||
    Number(item.width || 0) < 220 ||
    Number(item.height || 0) < 100 ||
    Number(item.byteSize || 0) < 2_000
);
const duplicateHashes = screenshots
  .filter((item) => item.sha256)
  .filter(
    (item, index, items) =>
      items.findIndex((candidate) => candidate.sha256 === item.sha256) !== index
  )
  .map((item) => item.name);
const runtimeErrors = browser?.runtimeErrors || [];
const failedCaptures = captures.filter((item) => item.status === "FAIL");
const status =
  invalid.length === 0 &&
  duplicateHashes.length === 0 &&
  failedCaptures.length === 0 &&
  runtimeErrors.length === 0 &&
  brokenAssets.length === 0 &&
  htmlForJson.length === 0
    ? "PASS"
    : "FAIL";
const report = {
  schemaVersion: "v134-visual-screenshot-manifest-1",
  generatedAt: new Date().toISOString(),
  audit: "screenshots:v134",
  status,
  releaseBlocker: false,
  readinessContract: [
    "production build served",
    "specialized analysis root visible",
    "requested chart/section visible",
    "public term trigger visible",
    "aria-describedby linked tooltip visible",
    "map B-021 rendered signal visible before GVI glossary capture",
  ],
  requiredCount: REQUIRED_SCREENSHOTS.length,
  screenshotCount: screenshots.filter((item) => item.error === null).length,
  failedCaptures,
  invalid: invalid.map((item) => item.name),
  duplicateHashes,
  runtimeErrors,
  brokenAssets,
  htmlForJson,
  screenshots,
};
writeFileSync(
  resolve(SCREENSHOT_ROOT, "screenshot-manifest-v134.json"),
  `${JSON.stringify(report, null, 2)}\n`,
  "utf8"
);

console.log(
  JSON.stringify({
    type: "summary",
    audit: "screenshots:v134",
    status,
    releaseBlocker: false,
    screenshotCount: report.screenshotCount,
    requiredCount: report.requiredCount,
    failedCaptures: failedCaptures.map((item) => ({ name: item.name, error: item.error })),
    invalid: report.invalid,
    duplicateHashes,
    runtimeErrorCount: runtimeErrors.length,
    brokenAssetCount: brokenAssets.length,
    htmlForJsonCount: htmlForJson.length,
  })
);

if (status !== "PASS") process.exitCode = 1;
