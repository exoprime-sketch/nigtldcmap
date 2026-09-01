#!/usr/bin/env node

import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { AuditV125, PROJECT_ROOT } from "./v125/audit-utils.mjs";
import {
  evaluateValue,
  launchHeadlessBrowser,
  navigate,
  setViewport,
  startStaticBuildServer,
  waitForValue,
} from "./v125/browser-runtime.mjs";
import {
  detailUrlV129,
  finishAuditV129,
  sourceTextV129,
} from "./v129/audit-helpers.mjs";

const audit = new AuditV125("chart-polish:v129");
const sourcePaths = [
  resolve(PROJECT_ROOT, "src/components/charts/ChartViewportControlsV129.tsx"),
  resolve(PROJECT_ROOT, "src/components/charts/chart-viewport-controls-v129.css"),
  resolve(PROJECT_ROOT, "src/components/charts/InteractiveTimeSeriesChartV127.tsx"),
];
const missingSources = sourcePaths.filter((path) => !existsSync(path));
const source = sourceTextV129(sourcePaths);

audit.check("CHART_POLISH_SOURCES", missingSources.length === 0, missingSources, []);
audit.check(
  "SEGMENTED_TOOLBAR_SOURCE",
  /data-chart-segmented-toolbar="true"/gu.test(source) &&
    /v129-chart-viewport__buttons/gu.test(source) &&
    /border-right/gu.test(source),
  {
    contract: /data-chart-segmented-toolbar="true"/gu.test(source),
    buttonGroup: /v129-chart-viewport__buttons/gu.test(source),
    segmentedBorder: /border-right/gu.test(source),
  },
  { contract: true, buttonGroup: true, segmentedBorder: true }
);
audit.check(
  "CHART_CONTROL_ACCESSIBLE_SOURCE",
  /표시 기간을 넓혀 보기/gu.test(source) &&
    /표시 기간을 좁혀 자세히 보기/gu.test(source) &&
    /전체 기간으로 복원/gu.test(source) &&
    /focus-visible/gu.test(source) &&
    /min-(?:width|height):\s*44px/gu.test(source) &&
    /prefers-reduced-motion/gu.test(source),
  {
    zoomOutName: /표시 기간을 넓혀 보기/gu.test(source),
    zoomInName: /표시 기간을 좁혀 자세히 보기/gu.test(source),
    resetName: /전체 기간으로 복원/gu.test(source),
    focus: /focus-visible/gu.test(source),
    touchTarget: /min-(?:width|height):\s*44px/gu.test(source),
    reducedMotion: /prefers-reduced-motion/gu.test(source),
  },
  "all chart control accessibility contracts"
);

function toolbarSnapshotExpression() {
  return `(() => {
    const root = document.querySelector('[data-testid="public-analysis-root"]');
    const chart = root?.querySelector('[data-chart-interaction-v127="true"]');
    const toolbar = chart?.querySelector('[data-testid="chart-viewport-controls"]');
    const range = toolbar?.querySelector('[data-testid="chart-current-range"]');
    const buttons = [...(toolbar?.querySelectorAll('button') || [])];
    const box = (node) => {
      const rect = node?.getBoundingClientRect();
      return rect ? { left: rect.left, right: rect.right, top: rect.top, bottom: rect.bottom, width: rect.width, height: rect.height } : null;
    };
    return {
      chartCount: root?.querySelectorAll('[data-chart-interaction-v127="true"]').length || 0,
      toolbarCount: root?.querySelectorAll('[data-testid="chart-viewport-controls"]').length || 0,
      toolbar: toolbar ? {
        segmented: toolbar.getAttribute('data-chart-segmented-toolbar'),
        rangeAttribute: toolbar.getAttribute('data-chart-current-range'),
        rangeText: range?.textContent?.replace(/\\s+/gu, ' ').trim() || '',
        ariaLabel: toolbar.getAttribute('aria-label'),
        box: box(toolbar),
      } : null,
      buttons: buttons.map((button) => ({
        testid: button.getAttribute('data-testid'),
        name: button.getAttribute('aria-label'),
        tooltip: button.getAttribute('data-chart-control-tooltip') || button.getAttribute('title'),
        disabled: button.disabled,
        visibleText: button.textContent?.replace(/\\s+/gu, ' ').trim() || '',
        svgCount: button.querySelectorAll('svg').length,
        box: box(button),
        display: getComputedStyle(button).display,
        opacity: getComputedStyle(button).opacity,
      })),
      pageOverflow: Math.max(document.documentElement.scrollWidth, document.body.scrollWidth) - innerWidth,
      toolbarOverflow: toolbar ? toolbar.scrollWidth - toolbar.clientWidth : 0,
    };
  })()`;
}

async function waitForDetail(cdp) {
  await waitForValue(
    cdp,
    `document.querySelector('[data-testid="public-analysis-root"]')?.getAttribute('data-analysis-state') === 'ready'`,
    { timeoutMs: 30_000 }
  );
}

async function clickControl(cdp, testId) {
  const result = await evaluateValue(
    cdp,
    `(() => {
      const button = document.querySelector('[data-testid=${JSON.stringify(testId)}]');
      if (!(button instanceof HTMLButtonElement) || button.disabled) return false;
      button.click();
      return true;
    })()`
  );
  if (!result) throw new Error(`${testId} unavailable or disabled`);
  await new Promise((resolveWait) => setTimeout(resolveWait, 100));
  return evaluateValue(cdp, toolbarSnapshotExpression());
}

let server = null;
let browser = null;
let runtimeFailure = null;
let desktopInitial = null;
let zoomed = null;
let zoomedOut = null;
let reset = null;
let mobile = null;
const ineligibleResults = [];
try {
  server = await startStaticBuildServer(resolve(PROJECT_ROOT, "build"));
  browser = await launchHeadlessBrowser();
  await setViewport(browser.cdp, 1440, 1100);
  await navigate(browser.cdp, detailUrlV129(server.url, "A-002"));
  await waitForDetail(browser.cdp);
  await waitForValue(
    browser.cdp,
    `Boolean(document.querySelector('[data-testid="chart-viewport-controls"]'))`,
    { timeoutMs: 20_000 }
  );
  desktopInitial = await evaluateValue(browser.cdp, toolbarSnapshotExpression());
  zoomed = await clickControl(browser.cdp, "chart-zoom-in");
  zoomedOut = await clickControl(browser.cdp, "chart-zoom-out");
  if (zoomedOut?.toolbar?.rangeAttribute !== "전체") {
    reset = await clickControl(browser.cdp, "chart-reset");
  } else {
    zoomed = await clickControl(browser.cdp, "chart-zoom-in");
    reset = await clickControl(browser.cdp, "chart-reset");
  }

  await setViewport(browser.cdp, 390, 900);
  await navigate(browser.cdp, detailUrlV129(server.url, "A-002"));
  await waitForDetail(browser.cdp);
  mobile = await evaluateValue(browser.cdp, toolbarSnapshotExpression());

  for (const elementId of ["A-005", "A-017", "D-005", "E-012", "E-018", "E-019"]) {
    await setViewport(browser.cdp, 1024, 1000);
    await navigate(browser.cdp, detailUrlV129(server.url, elementId));
    await waitForDetail(browser.cdp);
    ineligibleResults.push({
      elementId,
      ...(await evaluateValue(browser.cdp, toolbarSnapshotExpression())),
    });
  }
} catch (error) {
  runtimeFailure = error instanceof Error ? error.message : String(error);
} finally {
  if (browser) await browser.close();
  if (server) await server.close();
}

const expectedButtonContract = new Map([
  ["chart-zoom-out", "표시 기간을 넓혀 보기"],
  ["chart-zoom-in", "표시 기간을 좁혀 자세히 보기"],
  ["chart-reset", "전체 기간으로 복원"],
]);
const desktopButtonsValid =
  desktopInitial?.buttons?.length === 3 &&
  desktopInitial.buttons.every(
    (button) =>
      expectedButtonContract.get(button.testid) === button.name &&
      button.tooltip === button.name &&
      button.svgCount === 1 &&
      button.box?.height >= 39 &&
      button.visibleText
  ) &&
  new Set(desktopInitial.buttons.map((button) => Math.round(button.box.height))).size === 1;
const initialDisabledPass =
  desktopInitial?.buttons?.find((item) => item.testid === "chart-zoom-out")?.disabled === true &&
  desktopInitial?.buttons?.find((item) => item.testid === "chart-zoom-in")?.disabled === false &&
  desktopInitial?.buttons?.find((item) => item.testid === "chart-reset")?.disabled === true;
const zoomRangeIsPopulatedYearPair = /^\d{4}–\d{4}$/u.test(
  zoomed?.toolbar?.rangeAttribute || ""
);
const zoomInPass =
  zoomed?.toolbar?.rangeAttribute &&
  zoomed.toolbar.rangeAttribute !== "전체" &&
  zoomRangeIsPopulatedYearPair &&
  zoomed.buttons?.find((item) => item.testid === "chart-reset")?.disabled === false;
const zoomOutPass =
  zoomedOut?.toolbar?.rangeAttribute === "전체" ||
  zoomedOut?.toolbar?.rangeAttribute !== zoomed?.toolbar?.rangeAttribute;
const resetPass =
  reset?.toolbar?.rangeAttribute === "전체" &&
  reset?.buttons?.find((item) => item.testid === "chart-reset")?.disabled === true;
const mobilePass =
  mobile?.pageOverflow <= 1 &&
  mobile?.toolbarOverflow <= 1 &&
  mobile?.buttons?.length === 3 &&
  mobile.buttons.every(
    (button) => button.box?.width >= 43.5 && button.box?.height >= 43.5
  );
const ineligibleFailures = ineligibleResults.filter(
  (result) => result.toolbarCount !== 0
);

audit.check(
  "SEGMENTED_TOOLBAR_RUNTIME",
  runtimeFailure === null && desktopInitial?.toolbar?.segmented === "true" && desktopButtonsValid,
  { runtimeFailure, desktopInitial },
  { segmented: true, buttons: 3, equalHeight: true, inlineSvg: true }
);
audit.check(
  "CURRENT_RANGE_LABEL",
  runtimeFailure === null &&
    desktopInitial?.toolbar?.rangeAttribute === "전체" &&
    /표시기간\s*전체/u.test(desktopInitial?.toolbar?.rangeText || ""),
  desktopInitial?.toolbar || null,
  { rangeAttribute: "전체", rangeText: "표시기간 전체" }
);
audit.check(
  "ICON_ACCESSIBLE_NAMES",
  runtimeFailure === null && desktopButtonsValid,
  desktopInitial?.buttons || [],
  [...expectedButtonContract.entries()]
);
audit.check(
  "DISABLED_STATE",
  runtimeFailure === null && initialDisabledPass && resetPass,
  { initial: desktopInitial?.buttons || [], reset: reset?.buttons || [] },
  { initialZoomOut: "disabled", initialReset: "disabled", resetAfterRestore: "disabled" }
);
audit.check(
  "ZOOM_IN_INTERACTION",
  runtimeFailure === null && zoomInPass,
  zoomed?.toolbar || runtimeFailure,
  "populated integer-year range narrower than full (YYYY–YYYY)"
);
audit.check("ZOOM_OUT_INTERACTION", runtimeFailure === null && zoomOutPass, zoomedOut?.toolbar || runtimeFailure, "range wider than zoomed");
audit.check("RESET_INTERACTION", runtimeFailure === null && resetPass, reset?.toolbar || runtimeFailure, { range: "전체" });
audit.check(
  "MOBILE_TOOLBAR_OVERFLOW",
  runtimeFailure === null && mobilePass,
  { runtimeFailure, mobile },
  { pageOverflow: 0, toolbarOverflow: 0, touchTargets: ">=44px" }
);
audit.check(
  "INELIGIBLE_CHART_TOOLBAR",
  runtimeFailure === null && ineligibleResults.length === 6 && ineligibleFailures.length === 0,
  { checked: ineligibleResults.map((item) => item.elementId), failures: ineligibleFailures },
  { checked: ["A-005", "A-017", "D-005", "E-012", "E-018", "E-019"], toolbarCount: 0 }
);
audit.check(
  "UNCAUGHT_RUNTIME_ERROR",
  (browser?.runtimeErrors?.length || 0) === 0,
  browser?.runtimeErrors || [],
  []
);

finishAuditV129(audit, "chart-polish-audit-v129.json", {
  chartToolbar: runtimeFailure === null && desktopButtonsValid && mobilePass ? "PASS" : "FAIL",
  currentRangeLabel: desktopInitial?.toolbar?.rangeAttribute || null,
  ineligibleChartToolbarCount: ineligibleFailures.length,
  dependencyChanges: 0,
});
