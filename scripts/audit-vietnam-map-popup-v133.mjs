#!/usr/bin/env node

import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { AuditV125, PROJECT_ROOT, V2_ROOT, readJson } from "./v125/audit-utils.mjs";
import {
  evaluateValue,
  launchHeadlessBrowser,
  navigate,
  setViewport,
  startStaticBuildServer,
  waitForValue,
} from "./v125/browser-runtime.mjs";
import {
  containsForbiddenPublicMapTokenV133,
  finishAuditV133,
  mapUrlV133,
  normalizeTextV133,
} from "./v133/audit-helpers.mjs";

const audit = new AuditV125("map-popup:v133");
const b021Result = readJson(resolve(V2_ROOT, "spatial/layers/b-021.json"));
const values = Array.isArray(b021Result.value?.values) ? b021Result.value.values : [];
const gviRows = values.filter(
  (row) => row?.variable === "gvi-6" && String(row?.period) === "2023" && Number.isFinite(Number(row?.value))
);
const uniqueRegionValues = new Map();
for (const row of gviRows) {
  if (normalizeTextV133(row?.sourceRegion)) {
    uniqueRegionValues.set(normalizeTextV133(row.sourceRegion), Number(row.value));
  }
}
const orderedRegions = [...uniqueRegionValues.entries()].sort(
  (left, right) => right[1] - left[1] || left[0].localeCompare(right[0], "en")
);
const expectedRankByRegion = Object.fromEntries(
  orderedRegions.map(([region], index) => [region, index + 1])
);
const mapSource = readFileSync(resolve(PROJECT_ROOT, "src/pages/RealMapExplorerPage.tsx"), "utf8");

async function selectClimatePreset(cdp) {
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
      return root?.getAttribute('data-primary-element') === 'B-021' &&
        root?.getAttribute('data-context-layer-count') === '0' &&
        Boolean(document.querySelector('[data-testid="map-selectable-adm1-feature"][data-element-id="B-021"]'));
    })()`,
    { timeoutMs: 35_000 }
  );
}

let server = null;
let browser = null;
let runtimeFailure = null;
let hoverSnapshot = null;
let detailSnapshot = null;
let overlapSnapshot = null;
try {
  server = await startStaticBuildServer(resolve(PROJECT_ROOT, "build"));
  browser = await launchHeadlessBrowser();
  await setViewport(browser.cdp, 1440, 1100);
  await navigate(browser.cdp, mapUrlV133(server.url));
  await waitForValue(
    browser.cdp,
    `document.querySelectorAll('.cdp-layer-card[data-map-element]').length === 12`,
    { timeoutMs: 35_000 }
  );
  await selectClimatePreset(browser.cdp);

  await evaluateValue(
    browser.cdp,
    `(() => {
      const features = [...document.querySelectorAll('[data-testid="map-selectable-adm1-feature"][data-element-id="B-021"]')];
      const target = features.find((node) => /Quảng Bình/u.test(node.getAttribute('aria-label') || '')) || features[0];
      if (!(target instanceof SVGElement)) return false;
      target.focus();
      target.dispatchEvent(new MouseEvent('mouseover', { bubbles: true }));
      return true;
    })()`
  );
  await waitForValue(
    browser.cdp,
    `Boolean(document.querySelector('[data-testid="map-feature-tooltip"], [data-testid="map-hover-popup-v133"]'))`,
    { timeoutMs: 10_000 }
  );
  hoverSnapshot = await evaluateValue(
    browser.cdp,
    `(() => {
      const node = document.querySelector('[data-testid="map-hover-popup-v133"], [data-testid="map-feature-tooltip"]');
      const text = (node?.textContent || '').normalize('NFC').replace(/\\s+/gu, ' ').trim();
      const rect = node?.getBoundingClientRect();
      const style = node ? getComputedStyle(node) : null;
      const topmost = rect && rect.width > 0 && rect.height > 0
        ? document.elementFromPoint(rect.left + rect.width / 2, rect.top + rect.height / 2)
        : null;
      return {
        text,
        informationBlocks: node ? Math.max(node.children.length, node.querySelectorAll('strong, span, p, li, dt, dd').length) : 0,
        internalTokenCount: (text.match(/focus layer|context layer|feature|geometry|renderer|aggregation level|map scope|recordId|sourceRow|sourceSheet/giu) || []).length,
        visible: Boolean(
          node && rect && rect.width > 0 && rect.height > 0 &&
          style?.display !== 'none' && style?.visibility !== 'hidden' &&
          Number(style?.opacity || 1) > 0 && topmost && node.contains(topmost)
        ),
        rect: rect ? { left: rect.left, top: rect.top, width: rect.width, height: rect.height } : null,
        topmostTag: topmost?.tagName || '',
        topmostClass: typeof topmost?.className === 'string' ? topmost.className : '',
      };
    })()`
  );

  await evaluateValue(
    browser.cdp,
    `(() => {
      const features = [...document.querySelectorAll('[data-testid="map-selectable-adm1-feature"][data-element-id="B-021"]')];
      const target = features.find((node) => /Quảng Bình/u.test(node.getAttribute('aria-label') || '')) || features[0];
      if (!(target instanceof SVGElement)) return false;
      target.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      return true;
    })()`
  );
  await waitForValue(
    browser.cdp,
    `Boolean(document.querySelector('[data-testid="map-selected-detail-v133"], [data-testid="map-feature-detail"]'))`,
    { timeoutMs: 10_000 }
  );
  detailSnapshot = await evaluateValue(
    browser.cdp,
    `(() => {
      const node = document.querySelector('[data-testid="map-selected-detail-v133"], [data-testid="map-feature-detail"]');
      const panel = document.querySelector('[data-testid="map-analysis-panel"]');
      const text = (node?.textContent || '').normalize('NFC').replace(/\\s+/gu, ' ').trim();
      const panelText = (panel?.textContent || '').normalize('NFC').replace(/\\s+/gu, ' ').trim();
      const labels = [...(node?.querySelectorAll('dt') || [])].map((item) => (item.textContent || '').trim());
      return { text, panelText, labels };
    })()`
  );

  const contextEnabled = await evaluateValue(
    browser.cdp,
    `(() => {
      const button = document.querySelector('[data-testid="map-context-toggle-v133"][data-map-element="D-008"]');
      if (!(button instanceof HTMLButtonElement)) return false;
      button.click();
      return true;
    })()`
  );
  if (!contextEnabled) throw new Error("D-008 comparison toggle unavailable");
  await waitForValue(
    browser.cdp,
    `document.querySelector('[data-testid="map-public-content"]')?.getAttribute('data-context-layer-count') === '1' && Boolean(document.querySelector('[data-testid="map-budget-statistical-point-v133"]'))`,
    { timeoutMs: 35_000 }
  );
  const overlapOpened = await evaluateValue(
    browser.cdp,
    `(() => {
      const point = document.querySelector('[data-testid="map-budget-statistical-point-v133"]');
      if (!(point instanceof SVGElement)) return false;
      point.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      return true;
    })()`
  );
  if (!overlapOpened) throw new Error("overlap point unavailable");
  await waitForValue(
    browser.cdp,
    `Boolean(document.querySelector('[data-testid="map-overlap-picker-v133"]'))`,
    { timeoutMs: 10_000 }
  );
  overlapSnapshot = await evaluateValue(
    browser.cdp,
    `(() => {
      const picker = document.querySelector('[data-testid="map-overlap-picker-v133"]');
      const choices = [...(picker?.querySelectorAll('button[data-hit-priority]') || [])].map((button) => ({
        element: button.getAttribute('data-map-element') || '',
        role: button.getAttribute('data-layer-role') || '',
        priority: Number(button.getAttribute('data-hit-priority')),
        label: (button.textContent || '').replace(/\s+/gu, ' ').trim(),
      }));
      return {
        count: Number(picker?.getAttribute('data-overlap-count') || 0),
        choices,
      };
    })()`
  );
} catch (error) {
  runtimeFailure = error instanceof Error ? error.message : String(error);
} finally {
  if (browser) await browser.close();
  if (server) await server.close();
}

const hoverText = normalizeTextV133(hoverSnapshot?.text);
const detailText = normalizeTextV133(detailSnapshot?.text);
const hoverRequired = {
  place: /Quảng Bình|Quảng Trị|Hà Nội|Hồ Chí Minh|Đà Nẵng/u.test(hoverText),
  measure: /지역 취약성|GVI/u.test(hoverText),
  period: /2023/u.test(hoverText),
  value: /\d+(?:\.\d+)?\s*\/\s*100/u.test(hoverText),
  direction: /높을수록\s*취약/u.test(hoverText),
  sourceRegion: /권역값|권역/u.test(hoverText),
  rank: /베트남\s*6개\s*권역\s*중\s*\d+위/u.test(hoverText),
};
const detailRequired = {
  selectedArea: /선택 지역/u.test(detailSnapshot?.panelText || detailText),
  value: /현재 값|값/u.test(detailText),
  unit: /단위/u.test(detailText),
  period: /자료연도|기준연도|기간/u.test(detailText),
  rank: /베트남\s*6개\s*권역\s*중\s*\d+위/u.test(detailText),
  spatialUnit: /권역|공간단위|성 단위 독립 추정값/u.test(detailText),
  explanation: /개별 추정값이 아니라|권역의 값을 표시|자료 설명/u.test(detailText),
  detailLink: /데이터 상세/u.test(detailSnapshot?.panelText || detailText),
};
const sourceUsesUniqueRegions =
  /new Map/u.test(mapSource) &&
  /sourceRegion/u.test(mapSource) &&
  /byRegion\.set\(row\.sourceRegion/u.test(mapSource);
const overlapChoices = Array.isArray(overlapSnapshot?.choices)
  ? overlapSnapshot.choices
  : [];
const overlapPriorities = overlapChoices.map((choice) => Number(choice.priority));
const overlapRuntimePriorityPass =
  overlapSnapshot?.count === 2 &&
  overlapChoices.length === 2 &&
  overlapChoices[0]?.role === "primary" &&
  overlapChoices[0]?.element === "B-021" &&
  overlapChoices[1]?.role === "context" &&
  overlapChoices[1]?.element === "D-008" &&
  new Set(overlapChoices.map((choice) => choice.element)).size === 2 &&
  overlapPriorities.every(
    (priority, index) =>
      Number.isFinite(priority) &&
      (index === 0 || priority >= overlapPriorities[index - 1])
  );

audit.check("B021_SPATIAL_JSON", b021Result.error === null, b021Result.error, null);
audit.check(
  "GVI_UNIQUE_SOURCE_REGION_COUNT",
  uniqueRegionValues.size === 6,
  { uniqueRegionCount: uniqueRegionValues.size, regions: orderedRegions },
  { uniqueRegionCount: 6 }
);
audit.check(
  "GVI_REGION_RANK_USES_UNIQUE_REGIONS",
  sourceUsesUniqueRegions && Object.keys(expectedRankByRegion).length === 6,
  { sourceUsesUniqueRegions, expectedRankByRegion },
  "six unique sourceRegion values"
);
audit.check(
  "GVI_HOVER_POPUP",
  runtimeFailure === null && Object.values(hoverRequired).every(Boolean) && hoverText.length <= 360,
  { runtimeFailure, hoverRequired, hoverTextLength: hoverText.length, hoverText },
  { runtimeFailure: null, required: "place, measure, period, value, direction, region, rank", maximumCharacters: 360 }
);
audit.check(
  "GVI_HOVER_LONG_METHODOLOGY_COUNT",
  !/개별 추정값이 아니라|성 단위 독립 추정값이 아님/u.test(hoverText),
  hoverText,
  "short hover without methodology paragraph"
);
audit.check(
  "GVI_HOVER_PIXEL_VISIBLE",
  runtimeFailure === null && hoverSnapshot?.visible === true,
  { runtimeFailure, visual: hoverSnapshot },
  { runtimeFailure: null, visible: true }
);
audit.check(
  "GVI_POPUP_INTERNAL_TOKEN_COUNT",
  (hoverSnapshot?.internalTokenCount || 0) === 0 && containsForbiddenPublicMapTokenV133(hoverText).length === 0,
  { runtimeCount: hoverSnapshot?.internalTokenCount || 0, tokens: containsForbiddenPublicMapTokenV133(hoverText) },
  0
);
audit.check(
  "HOVER_POPUP_WITHOUT_KEY_VALUE",
  hoverRequired.value && hoverRequired.measure,
  hoverRequired,
  { measure: true, value: true }
);
audit.check(
  "CLICK_FEATURE_WITHOUT_DETAIL",
  runtimeFailure === null && Object.values(detailRequired).every(Boolean),
  { runtimeFailure, detailRequired, detailText },
  { runtimeFailure: null, allDetailFields: true }
);
audit.check(
  "HOVER_CLICK_ROLE_SEPARATION",
  !/개별 추정값이 아니라|성 단위 독립 추정값이 아님/u.test(hoverText) &&
    /개별 추정값이 아니라|권역의 값을 표시|자료 설명/u.test(detailText),
  { hoverText, detailText },
  "methodology only in selected detail"
);
audit.check(
  "MAP_HIT_PRIORITY_CONTRACT",
  overlapRuntimePriorityPass &&
    /selected[\s\S]{0,800}primary[\s\S]{0,800}(last|recent|context)/iu.test(mapSource) &&
    /map-overlap-picker-v133|이 위치에\s*\d+개\s*데이터/u.test(mapSource),
  {
    overlapRuntimePriorityPass,
    overlapSnapshot,
    deterministicPriority: /selected[\s\S]{0,800}primary[\s\S]{0,800}(last|recent|context)/iu.test(mapSource),
    overlapPicker: /map-overlap-picker-v133|이 위치에\s*\d+개\s*데이터/u.test(mapSource),
  },
  { deterministicPriority: true, overlapPicker: true }
);
audit.check("CONSOLE_ERROR", (browser?.runtimeErrors || []).length === 0, browser?.runtimeErrors || [], []);

finishAuditV133(audit, "map-popup-audit-v133.json", {
  uniqueSourceRegionCount: uniqueRegionValues.size,
  expectedRankByRegion,
  hoverPopupWithoutKeyValue: hoverRequired.value && hoverRequired.measure ? 0 : 1,
  clickFeatureWithoutDetail: Object.values(detailRequired).every(Boolean) ? 0 : 1,
  gviPopupInternalTokenCount:
    (hoverSnapshot?.internalTokenCount || 0) + containsForbiddenPublicMapTokenV133(hoverText).length,
  hoverSnapshot,
  detailSnapshot,
  overlapSnapshot,
  runtimeFailure,
});
