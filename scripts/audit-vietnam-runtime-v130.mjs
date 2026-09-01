#!/usr/bin/env node

import {
  mkdirSync,
  writeFileSync,
} from "node:fs";
import { resolve } from "node:path";
import { AuditV125, PROJECT_ROOT, pngDimensions } from "./v125/audit-utils.mjs";
import {
  captureElementPng,
  evaluateValue,
  launchHeadlessBrowser,
  navigate,
  setViewport,
  startStaticBuildServer,
  waitForValue,
} from "./v125/browser-runtime.mjs";
import { mapUrlV129 } from "./v129/audit-helpers.mjs";

const REPORT_ROOT = resolve(PROJECT_ROOT, "reports/v130");
const SCREENSHOT_ROOT = resolve(REPORT_ROOT, "screenshots");
const RESULT_PATH = resolve(REPORT_ROOT, "runtime-audit-result-v130.json");
const REQUIRED_SCREENSHOTS = [
  "map-data-guide.png",
  "map-layer-groups.png",
  "map-adaptation-fund.png",
  "map-greater-mekong-regional.png",
  "map-climate-finance-preset.png",
  "map-regional-project-selected.png",
];

mkdirSync(SCREENSHOT_ROOT, { recursive: true });
const audit = new AuditV125("runtime:v130");
let server = null;
let browser = null;
let runtimeFailure = null;
let guideEvidence = null;
let presetEvidence = null;
let regionalEvidence = null;
let keyboardLabels = [];
const brokenAssets = [];
const htmlForJson = [];
const networkFailures = [];

async function capture(cdp, name, selector) {
  return captureElementPng(cdp, selector, resolve(SCREENSHOT_ROOT, name));
}

async function clickPreset(cdp, presetId, primaryElementId) {
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
      return root?.getAttribute('data-primary-element') === ${JSON.stringify(primaryElementId)} &&
        !/불러오는 중/u.test(overlay?.textContent || '');
    })()`,
    { timeoutMs: 35_000 }
  );
}

async function collectKeyboardLabels(cdp) {
  const total = await evaluateValue(
    cdp,
    `(() => {
      const value = document.querySelector('[data-testid="map-keyboard-feature-select"] small')?.textContent || '';
      return Number(value.split('/')[1]?.trim() || 0);
    })()`
  );
  if (!Number.isInteger(total) || total < 4) {
    throw new Error(`keyboard feature list unavailable: ${total}`);
  }
  const labels = [];
  for (let index = 0; index < total; index += 1) {
    labels.push(
      await evaluateValue(
        cdp,
        `document.querySelector('[data-testid="map-keyboard-feature-select"] span')?.textContent?.trim() || ''`
      )
    );
    await evaluateValue(
      cdp,
      `document.querySelector('[aria-label="다음 지도 항목"]')?.click()`
    );
  }
  return labels;
}

async function selectKeyboardIndex(cdp, index) {
  for (let offset = 0; offset < index; offset += 1) {
    await evaluateValue(
      cdp,
      `document.querySelector('[aria-label="다음 지도 항목"]')?.click()`
    );
  }
  await evaluateValue(
    cdp,
    `document.querySelector('[data-testid="map-keyboard-feature-select"]')?.click()`
  );
  await waitForValue(
    cdp,
    `Boolean(document.querySelector('[data-testid="map-selected-feature-panel"] [data-regional-project-detail="true"]'))`,
    { timeoutMs: 8_000 }
  );
}

try {
  server = await startStaticBuildServer(resolve(PROJECT_ROOT, "build"));
  browser = await launchHeadlessBrowser();
  await browser.cdp.send("Network.enable");
  browser.cdp.on("Network.responseReceived", ({ response }) => {
    if (!response?.url?.startsWith(server.origin)) return;
    const pathname = new URL(response.url).pathname;
    if (response.status >= 400) {
      brokenAssets.push({ url: response.url, status: response.status });
    }
    if (
      /\.(?:json|geojson)(?:$|\?)/u.test(pathname) &&
      /text\/html/iu.test(String(response.mimeType || ""))
    ) {
      htmlForJson.push({ url: response.url, mimeType: response.mimeType });
    }
  });
  browser.cdp.on("Network.loadingFailed", (event) => {
    if (event?.blockedReason === "inspector") return;
    networkFailures.push({ errorText: event?.errorText || "unknown", type: event?.type || "" });
  });

  await setViewport(browser.cdp, 1440, 1100);
  await navigate(browser.cdp, mapUrlV129(server.url));
  await waitForValue(
    browser.cdp,
    `(() => {
      const page = document.querySelector('.cdp-map-page');
      const map = document.querySelector('.cdp-map-canvas-wrap');
      return Boolean(page && map && map.getBoundingClientRect().width > 500 && map.getBoundingClientRect().height > 400);
    })()`,
    { timeoutMs: 35_000 }
  );
  await waitForValue(
    browser.cdp,
    `document.querySelectorAll('[data-testid="map-data-guide-v130"] tbody tr').length === 12`,
    { timeoutMs: 20_000 }
  );

  guideEvidence = await evaluateValue(
    browser.cdp,
    `(() => {
      const guide = document.querySelector('[data-testid="map-data-guide-v130"]');
      const wrap = guide?.querySelector('.cdp-map-data-guide-v130__table-wrap');
      const text = guide?.textContent || '';
      return {
        groupCount: guide?.querySelectorAll('[data-map-guide-group]').length || 0,
        rowCount: guide?.querySelectorAll('tbody tr').length || 0,
        elementIdVisible: /\\b[A-E]-\\d{3}\\b/u.test(text),
        horizontalOverflow: wrap ? wrap.scrollWidth > wrap.clientWidth + 1 : true,
        finderLink: text.includes('전체 152개 데이터는 데이터 찾기에서 확인'),
      };
    })()`
  );
  await capture(
    browser.cdp,
    "map-layer-groups.png",
    "[data-testid=\"map-layer-panel\"]"
  );
  await evaluateValue(
    browser.cdp,
    `(() => {
      const panel = document.querySelector('[data-testid="map-layer-panel"]');
      const guide = document.querySelector('[data-testid="map-data-guide-v130"]');
      if (!(panel instanceof HTMLElement) || !(guide instanceof HTMLElement)) return false;
      panel.scrollTop = Math.max(0, guide.offsetTop - 12);
      return true;
    })()`
  );
  await capture(
    browser.cdp,
    "map-data-guide.png",
    "[data-testid=\"map-layer-panel\"]"
  );
  await evaluateValue(
    browser.cdp,
    `(() => {
      const panel = document.querySelector('[data-testid="map-layer-panel"]');
      if (!(panel instanceof HTMLElement)) return false;
      panel.scrollTop = 0;
      return true;
    })()`
  );

  await clickPreset(browser.cdp, "CLIMATE_FINANCE_PROJECTS", "D-018");
  await waitForValue(
    browser.cdp,
    `Boolean(document.querySelector('[data-testid="map-keyboard-feature-navigation"]'))`,
    { timeoutMs: 20_000 }
  );
  presetEvidence = await evaluateValue(
    browser.cdp,
    `(() => {
      const root = document.querySelector('[data-testid="map-public-content"]');
      const pageText = document.querySelector('.cdp-map-page')?.textContent || '';
      return {
        primary: root?.getAttribute('data-primary-element'),
        context: root?.getAttribute('data-context-elements'),
        hasD023: /국제협력·기후재원 사업/u.test(pageText),
        summary: document.querySelector('[data-testid="map-analysis-panel"]')?.textContent || '',
      };
    })()`
  );
  await capture(browser.cdp, "map-adaptation-fund.png", ".cdp-map-canvas-wrap");
  await capture(browser.cdp, "map-climate-finance-preset.png", ".cdp-map-page");

  keyboardLabels = await collectKeyboardLabels(browser.cdp);
  const greaterIndex = keyboardLabels.findIndex((label) =>
    /Groundwater resources in the Greater Mekong Subregion/iu.test(label)
  );
  if (greaterIndex < 0) throw new Error("Greater Mekong regional scope missing from keyboard map features");
  const c025Labels = keyboardLabels.filter((label) => /탄소크레딧 사업/u.test(label));
  if (c025Labels.some((label) => /명칭 미기재/u.test(label))) {
    throw new Error("C-025 visible feature lacks a public display name");
  }
  await selectKeyboardIndex(browser.cdp, greaterIndex);
  regionalEvidence = await evaluateValue(
    browser.cdp,
    `(() => {
      const panel = document.querySelector('[data-testid="map-feature-detail"]');
      const text = panel?.textContent?.replace(/\\s+/gu, ' ').trim() || '';
      return {
        text,
        participatingCountries: ['Cambodia', 'Lao PDR', 'Thailand', 'Viet Nam'].every((country) => text.includes(country)),
        vietnamParticipation: text.includes('베트남 참여') && text.includes('포함'),
        approvedAmount: text.includes('4,898,775'),
        arbitrarySiteClaim: /사업 위치(?!로 표시하지)/u.test(text),
      };
    })()`
  );
  await capture(
    browser.cdp,
    "map-greater-mekong-regional.png",
    ".cdp-map-canvas-wrap"
  );
  await evaluateValue(
    browser.cdp,
    `(() => {
      const panel = document.querySelector('[data-testid="map-analysis-panel"]');
      const detail = document.querySelector('[data-testid="map-feature-detail"]');
      if (!(panel instanceof HTMLElement) || !(detail instanceof HTMLElement)) return false;
      panel.scrollTop = Math.max(0, detail.offsetTop - 12);
      return true;
    })()`
  );
  await capture(
    browser.cdp,
    "map-regional-project-selected.png",
    "[data-testid=\"map-analysis-panel\"]"
  );
} catch (error) {
  runtimeFailure = error instanceof Error ? error.message : String(error);
} finally {
  if (browser) await browser.close();
  if (server) await server.close();
}

const screenshots = REQUIRED_SCREENSHOTS.map((name) => ({
  name,
  ...pngDimensions(resolve(SCREENSHOT_ROOT, name)),
}));
const invalidScreenshots = screenshots.filter(
  (item) =>
    item.error !== null ||
    Number(item.width || 0) < 240 ||
    Number(item.height || 0) < 120 ||
    Number(item.byteSize || 0) < 2_000
);

audit.check("RUNTIME_EXECUTION", runtimeFailure === null, runtimeFailure, null);
audit.check(
  "MAP_GUIDE",
  guideEvidence?.groupCount === 5 &&
    guideEvidence?.rowCount === 12 &&
    guideEvidence?.elementIdVisible === false &&
    guideEvidence?.horizontalOverflow === false &&
    guideEvidence?.finderLink === true,
  guideEvidence,
  { groupCount: 5, rowCount: 12, elementIdVisible: false, horizontalOverflow: false, finderLink: true }
);
audit.check(
  "CLIMATE_FINANCE_PRESET",
  presetEvidence?.primary === "D-018" &&
    presetEvidence?.context === "C-025" &&
    presetEvidence?.hasD023 === false &&
    /지역 협력사업\s*2건/u.test(presetEvidence?.summary || ""),
  presetEvidence,
  "D-018 primary, C-025 context, D-023 absent, two regional projects"
);
audit.check(
  "GREATER_MEKONG_REGIONAL_DETAIL",
  regionalEvidence?.participatingCountries === true &&
    regionalEvidence?.vietnamParticipation === true &&
    regionalEvidence?.approvedAmount === true &&
    regionalEvidence?.arbitrarySiteClaim === false,
  regionalEvidence,
  "four participating countries; Vietnam included; no project-site claim"
);
audit.check(
  "C025_PUBLIC_POINT_NAMES",
  keyboardLabels.filter((label) => /탄소크레딧 사업/u.test(label)).length === 18 &&
    keyboardLabels
      .filter((label) => /탄소크레딧 사업/u.test(label))
      .every((label) => !/명칭 미기재/u.test(label)),
  keyboardLabels.filter((label) => /탄소크레딧 사업/u.test(label)),
  "18 named public points"
);
audit.check(
  "SCREENSHOT_PNG",
  screenshots.length === 6 && invalidScreenshots.length === 0,
  { screenshots, invalidScreenshots },
  "six valid PNG screenshots"
);
audit.check("BROKEN_ASSET", brokenAssets.length === 0, brokenAssets, []);
audit.check("HTML_FOR_JSON", htmlForJson.length === 0, htmlForJson, []);
audit.check(
  "NETWORK_FAILURE",
  networkFailures.filter((failure) => !/ERR_ABORTED/u.test(failure.errorText)).length === 0,
  networkFailures,
  []
);
audit.check(
  "CONSOLE_ERROR",
  (browser?.runtimeErrors?.length || 0) === 0,
  browser?.runtimeErrors || [],
  []
);

const summary = audit.finish({
  screenshotCount: screenshots.length,
  consoleErrorCount: browser?.runtimeErrors?.length || 0,
  brokenAssetCount: brokenAssets.length,
  htmlForJsonCount: htmlForJson.length,
});
writeFileSync(
  RESULT_PATH,
  `${JSON.stringify(
    {
      schemaVersion: "v130-runtime-audit-1",
      generatedAt: new Date().toISOString(),
      status: summary.status,
      summary,
      checks: audit.checks,
      guideEvidence,
      presetEvidence,
      regionalEvidence,
      screenshots,
      brokenAssets,
      htmlForJson,
      networkFailures,
      runtimeErrors: browser?.runtimeErrors || [],
    },
    null,
    2
  )}\n`
);
