#!/usr/bin/env node

import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  AuditV125,
  PROJECT_ROOT,
} from "./v125/audit-utils.mjs";
import {
  evaluateValue,
  launchHeadlessBrowser,
  navigate,
  setViewport,
  startStaticBuildServer,
  waitForValue,
} from "./v125/browser-runtime.mjs";

const audit = new AuditV125("chart-interaction:v127");
const TIME_SERIES_ELEMENTS = [
  "A-001",
  "A-002",
  "A-003",
  "A-004",
  "A-006",
  "A-007",
  "A-008",
  "A-009",
  "A-012",
  "A-019",
  "E-008",
];
const NON_TIME_SERIES_ELEMENTS = ["A-005", "A-010", "A-017"];
const TOOLTIP_FORBIDDEN = [
  "indicatorId",
  "recordId",
  "sourceFile",
  "sourceSheet",
  "sourceRow",
  "apiParams",
  "raw provenance",
  "internal version",
  ".xlsx",
];

function pageUrl(baseUrl, elementId) {
  const url = new URL(baseUrl);
  url.searchParams.set("view", "data");
  url.searchParams.set("country", "VNM");
  url.searchParams.set("element", elementId);
  url.hash = "element-detail";
  return url.toString();
}

async function waitForAnalysis(cdp) {
  await waitForValue(
    cdp,
    `(() => {
      const root = document.querySelector('[data-testid="public-analysis-root"]');
      return Boolean(root && root.getAttribute('data-analysis-state') === 'ready');
    })()`,
    { timeoutMs: 20_000 }
  );
}

async function inspectTimeSeries(cdp, elementId) {
  return evaluateValue(
    cdp,
    `(() => {
      const root = document.querySelector('[data-testid="public-analysis-root"]');
      const charts = [...(root?.querySelectorAll(
        '[data-testid="interactive-time-series-chart"], [data-chart-interaction-v127="true"]'
      ) || [])];
      return {
        elementId: ${JSON.stringify(elementId)},
        chartCount: charts.length,
        charts: charts.map((chart) => {
          const rect = chart.getBoundingClientRect();
          const points = [...chart.querySelectorAll('[data-chart-point]')];
          const seriesUnits = [...new Set(points
            .map((point) => point.getAttribute('data-series-unit'))
            .filter(Boolean))];
          const legend = [...chart.querySelectorAll('[data-chart-legend-toggle]')];
          const xTitle = chart.querySelector('[data-testid="chart-x-axis-title"], [data-axis="x"]');
          const yTitle = chart.querySelector('[data-testid="chart-y-axis-title"], [data-axis="y"]');
          const yTicks = [...chart.querySelectorAll('[data-chart-y-axis-tick="true"]')];
          const unitLabel = chart.querySelector('[data-testid="chart-unit-label"]') ||
            [...chart.querySelectorAll('.v127-interactive-chart__metadata span')]
              .find((node) => String(node.textContent || '').trim().startsWith('단위:'));
          const titleRect = yTitle?.getBoundingClientRect();
          const tickRects = yTicks.map((tick) => tick.getBoundingClientRect());
          const intersects = (left, right) =>
            left.left < right.right - 0.5 &&
            left.right > right.left + 0.5 &&
            left.top < right.bottom - 0.5 &&
            left.bottom > right.top + 0.5;
          const paddingLeft = Number(chart.getAttribute('data-y-axis-padding-left'));
          const declaredTickMaximumWidth = Number(
            chart.getAttribute('data-y-tick-maximum-width')
          );
          const actualTickMaximumWidth = tickRects.length > 0
            ? Math.max(...tickRects.map((rect) => rect.width))
            : 0;
          return {
            width: rect.width,
            height: rect.height,
            axisUnit: chart.getAttribute('data-axis-unit') || '',
            yMin: Number(chart.getAttribute('data-y-domain-min')),
            yMax: Number(chart.getAttribute('data-y-domain-max')),
            seriesUnits,
            xTitle: xTitle?.textContent?.trim() || '',
            yTitle: yTitle?.textContent?.trim() || '',
            yAxisLayout: chart.getAttribute('data-y-axis-layout') || '',
            paddingLeft,
            declaredTickMaximumWidth,
            actualTickMaximumWidth,
            yTickCount: yTicks.length,
            yTitleTickOverlapCount: titleRect
              ? tickRects.filter((rect) => intersects(titleRect, rect)).length
              : -1,
            yTitleRect: titleRect ? {
              left: titleRect.left,
              right: titleRect.right,
              top: titleRect.top,
              bottom: titleRect.bottom,
              width: titleRect.width,
              height: titleRect.height,
            } : null,
            unitLabel: unitLabel?.textContent?.trim() || '',
            ariaLabel: chart.getAttribute('aria-label') ||
              chart.querySelector('.v127-interactive-chart__svg, svg[data-chart-responsive="true"]')?.getAttribute('aria-label') || '',
            pointCount: points.length,
            focusablePointCount: points.filter((point) =>
              point instanceof SVGElement && point.tabIndex >= 0
            ).length,
            nativeTitleCount: points.filter((point) => point.querySelector('title')).length,
            legendCount: legend.length,
            keyboardLegendCount: legend.filter((item) =>
              item instanceof HTMLButtonElement && item.tabIndex >= 0 &&
              item.hasAttribute('aria-pressed')
            ).length,
            zoomIn: Boolean(chart.querySelector('[data-testid="chart-zoom-in"], [data-chart-zoom-in]')),
            zoomOut: Boolean(chart.querySelector('[data-testid="chart-zoom-out"], [data-chart-zoom-out]')),
            reset: Boolean(chart.querySelector('[data-testid="chart-reset"], [data-chart-reset]')),
            crosshair: Boolean(chart.querySelector('[data-testid="chart-crosshair"], [data-chart-crosshair]')),
            tooltipNode: Boolean(chart.querySelector('[data-testid="chart-tooltip"]')),
            blank: points.length === 0 || rect.width < 300 || rect.height < 180,
          };
        }),
      };
    })()`
  );
}

async function focusFirstPoint(cdp) {
  return evaluateValue(
    cdp,
    `(() => {
      const chart = document.querySelector('[data-testid="interactive-time-series-chart"], [data-chart-interaction-v127="true"]');
      const point = chart?.querySelector('[data-chart-point]');
      if (!chart || !point) return { triggered: false };
      point.focus();
      point.dispatchEvent(new FocusEvent('focusin', { bubbles: true }));
      point.dispatchEvent(new PointerEvent('pointerenter', {
        bubbles: true,
        pointerType: 'mouse',
        clientX: point.getBoundingClientRect().left,
        clientY: point.getBoundingClientRect().top,
      }));
      return { triggered: true, focused: document.activeElement === point };
    })()`
  );
}

async function tooltipState(cdp) {
  return evaluateValue(
    cdp,
    `(() => {
      const chart = document.querySelector('[data-testid="interactive-time-series-chart"], [data-chart-interaction-v127="true"]');
      const tooltip = chart?.querySelector('[data-testid="chart-tooltip"]');
      const crosshair = chart?.querySelector('[data-testid="chart-crosshair"]');
      const visible = (node) => {
        if (!node || node.hidden || node.getAttribute('aria-hidden') === 'true') return false;
        const style = getComputedStyle(node);
        return style.display !== 'none' && style.visibility !== 'hidden' &&
          Number(style.opacity || 1) > 0 && node.getClientRects().length > 0;
      };
      const text = String(tooltip?.textContent || '').normalize('NFC').replace(/\\s+/gu, ' ').trim();
      return {
        visible: visible(tooltip),
        pinned: tooltip?.getAttribute('data-tooltip-pinned') || null,
        crosshairVisible: visible(crosshair),
        text,
        seriesRows: tooltip?.querySelectorAll('[data-testid="chart-tooltip-series"], li').length || 0,
        forbidden: ${JSON.stringify(TOOLTIP_FORBIDDEN)}.filter((token) =>
          text.toLocaleLowerCase('en-US').includes(token.toLocaleLowerCase('en-US'))
        ),
      };
    })()`
  );
}

async function clickControl(cdp, testId) {
  return evaluateValue(
    cdp,
    `(() => {
      const chart = document.querySelector('[data-testid="interactive-time-series-chart"], [data-chart-interaction-v127="true"]');
      const fallback = ${JSON.stringify(testId)} === 'chart-zoom-in'
        ? '[data-chart-zoom-in]'
        : ${JSON.stringify(testId)} === 'chart-zoom-out'
        ? '[data-chart-zoom-out]'
        : '[data-chart-reset]';
      const button = chart?.querySelector('[data-testid=${JSON.stringify(testId)}], ' + fallback);
      if (!(button instanceof HTMLButtonElement)) return { clicked: false };
      const before = {
        min: Number(chart.getAttribute('data-visible-x-min')),
        max: Number(chart.getAttribute('data-visible-x-max')),
      };
      button.click();
      return {
        clicked: true,
        disabled: button.disabled,
        text: button.textContent?.trim() || '',
        ariaLabel: button.getAttribute('aria-label') || '',
        before,
      };
    })()`
  );
}

async function xDomain(cdp) {
  return evaluateValue(
    cdp,
    `(() => {
      const chart = document.querySelector('[data-testid="interactive-time-series-chart"], [data-chart-interaction-v127="true"]');
      return chart ? {
        min: Number(chart.getAttribute('data-visible-x-min')),
        max: Number(chart.getAttribute('data-visible-x-max')),
        yMin: Number(chart.getAttribute('data-y-domain-min')),
        yMax: Number(chart.getAttribute('data-y-domain-max')),
        yZoom: chart.getAttribute('data-y-zoom'),
        xTitle: chart.querySelector('[data-testid="chart-x-axis-title"], [data-axis="x"]')?.textContent?.trim() || '',
        yTitle: chart.querySelector('[data-testid="chart-y-axis-title"], [data-axis="y"]')?.textContent?.trim() || '',
        metadata: [...chart.querySelectorAll('.v127-interactive-chart__metadata span')]
          .map((node) => node.textContent?.trim() || '').filter(Boolean),
      } : null;
    })()`
  );
}

const timeSeriesFailures = [];
const axisTitleFailures = [];
const unitFailures = [];
const blankCharts = [];
const unitAxisFailures = [];
const keyboardFailures = [];
const officialDomainFailures = [];
const yAxisLayoutFailures = [];
const nonTimeSeriesFailures = [];
const tooltipForbiddenHits = [];
let server = null;
let browser = null;
let runtimeFailure = null;
let runtimeStage = "initializing";
let a002Interaction = null;
let mobileInteraction = null;

try {
  server = await startStaticBuildServer(resolve(PROJECT_ROOT, "build"));
  browser = await launchHeadlessBrowser();
  await setViewport(browser.cdp, 1440, 1050);

  for (const elementId of TIME_SERIES_ELEMENTS) {
    try {
      await navigate(browser.cdp, pageUrl(server.url, elementId));
      await waitForAnalysis(browser.cdp);
      await waitForValue(
        browser.cdp,
        `Boolean(document.querySelector('[data-testid="interactive-time-series-chart"], [data-chart-interaction-v127="true"]'))`,
        { timeoutMs: 15_000 }
      );
      const result = await inspectTimeSeries(browser.cdp, elementId);
      if (!result || result.chartCount === 0) {
        timeSeriesFailures.push({ elementId, error: "interactive chart missing" });
        continue;
      }
      for (const [index, chart] of result.charts.entries()) {
        if (!chart.xTitle || !chart.yTitle) {
          axisTitleFailures.push({ elementId, index, xTitle: chart.xTitle, yTitle: chart.yTitle });
        }
        if (
          chart.yAxisLayout !== "dynamic" ||
          !Number.isFinite(chart.paddingLeft) ||
          !Number.isFinite(chart.declaredTickMaximumWidth) ||
          chart.paddingLeft < chart.declaredTickMaximumWidth + 36 ||
          chart.declaredTickMaximumWidth + 2 < chart.actualTickMaximumWidth ||
          chart.yTickCount < 5 ||
          chart.yTitleTickOverlapCount !== 0
        ) {
          yAxisLayoutFailures.push({ elementId, index, chart });
        }
        if (!chart.axisUnit || !chart.unitLabel) {
          unitFailures.push({ elementId, index, axisUnit: chart.axisUnit, unitLabel: chart.unitLabel });
        }
        if (chart.blank) blankCharts.push({ elementId, index, chart });
        if (
          chart.seriesUnits.length !== 1 ||
          chart.seriesUnits[0] !== chart.axisUnit
        ) {
          unitAxisFailures.push({
            elementId,
            index,
            axisUnit: chart.axisUnit,
            seriesUnits: chart.seriesUnits,
          });
        }
        if (
          chart.focusablePointCount !== chart.pointCount ||
          chart.legendCount < 1 ||
          chart.keyboardLegendCount !== chart.legendCount ||
          !chart.ariaLabel
        ) {
          keyboardFailures.push({ elementId, index, chart });
        }
        if (!chart.zoomIn || !chart.zoomOut || !chart.reset) {
          timeSeriesFailures.push({ elementId, index, controls: chart });
        }
        if (
          (elementId === "A-001" || elementId === "A-008") &&
          (chart.yMin !== 0 || chart.yMax !== 100)
        ) {
          officialDomainFailures.push({
            elementId,
            index,
            yMin: chart.yMin,
            yMax: chart.yMax,
          });
        }
      }
    } catch (error) {
      timeSeriesFailures.push({
        elementId,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  await navigate(browser.cdp, pageUrl(server.url, "A-002"));
  await waitForAnalysis(browser.cdp);
  await waitForValue(
    browser.cdp,
    `Boolean(document.querySelector('[data-testid="interactive-time-series-chart"] [data-chart-point], [data-chart-interaction-v127="true"] [data-chart-point]'))`,
    { timeoutMs: 15_000 }
  );
  const initialDomain = await xDomain(browser.cdp);
  const focus = await focusFirstPoint(browser.cdp);
  await waitForValue(
    browser.cdp,
    `(() => {
      const node = document.querySelector('[data-testid="chart-tooltip"]');
      if (!node || node.hidden || node.getAttribute('aria-hidden') === 'true') return false;
      return node.getClientRects().length > 0;
    })()`,
    { timeoutMs: 5_000 }
  );
  const focusedTooltip = await tooltipState(browser.cdp);
  runtimeStage = "A-002 tooltip viewport collision";
  const deltaTooltipFocus = await evaluateValue(
    browser.cdp,
    `(() => {
      const chart = document.querySelector('[data-testid="interactive-time-series-chart"], [data-chart-interaction-v127="true"]');
      const point = [...(chart?.querySelectorAll('[data-chart-point]') || [])]
        .find((node) => String(node.getAttribute('aria-label') || '').includes('2006년'));
      if (!(point instanceof SVGElement)) return false;
      point.focus();
      point.dispatchEvent(new FocusEvent('focusin', { bubbles: true }));
      return document.activeElement === point;
    })()`
  );
  await waitForValue(
    browser.cdp,
    `(() => {
      const tooltip = document.querySelector('[data-testid="chart-tooltip"]');
      return Boolean(
        tooltip &&
        tooltip.textContent?.includes('2006년') &&
        tooltip.querySelectorAll('[data-testid="chart-tooltip-series"]').length === 5 &&
        tooltip.querySelectorAll('.v127-chart-tooltip__delta').length === 5
      );
    })()`,
    { timeoutMs: 5_000 }
  );
  const tooltipCollision = await evaluateValue(
    browser.cdp,
    `(() => {
      const chart = document.querySelector('[data-testid="interactive-time-series-chart"], [data-chart-interaction-v127="true"]');
      const stage = chart?.querySelector('.v127-interactive-chart__stage');
      const tooltip = chart?.querySelector('[data-testid="chart-tooltip"]');
      if (!stage || !tooltip) return null;
      const stageRect = stage.getBoundingClientRect();
      const tooltipRect = tooltip.getBoundingClientRect();
      const tolerance = 1;
      return {
        focused: true,
        seriesRows: tooltip.querySelectorAll('[data-testid="chart-tooltip-series"]').length,
        deltaRows: tooltip.querySelectorAll('.v127-chart-tooltip__delta').length,
        stage: {
          left: stageRect.left,
          right: stageRect.right,
          top: stageRect.top,
          bottom: stageRect.bottom,
          width: stageRect.width,
          height: stageRect.height,
        },
        tooltip: {
          left: tooltipRect.left,
          right: tooltipRect.right,
          top: tooltipRect.top,
          bottom: tooltipRect.bottom,
          width: tooltipRect.width,
          height: tooltipRect.height,
          scrollHeight: tooltip.scrollHeight,
          clientHeight: tooltip.clientHeight,
        },
        inside:
          tooltipRect.left >= stageRect.left - tolerance &&
          tooltipRect.right <= stageRect.right + tolerance &&
          tooltipRect.top >= stageRect.top - tolerance &&
          tooltipRect.bottom <= stageRect.bottom + tolerance,
      };
    })()`
  );
  if (tooltipCollision) tooltipCollision.focused = deltaTooltipFocus;
  runtimeStage = "keyboard blur clears tooltip";
  const blurTransition = await evaluateValue(
    browser.cdp,
    `(() => {
      const chart = document.querySelector('[data-testid="interactive-time-series-chart"], [data-chart-interaction-v127="true"]');
      const control = chart?.querySelector('[data-chart-zoom-in]');
      if (!(control instanceof HTMLElement)) return false;
      const before = document.activeElement?.getAttribute('data-chart-point') || document.activeElement?.tagName;
      control.focus();
      control.dispatchEvent(new FocusEvent('focusin', { bubbles: true }));
      return {
        before,
        focused: document.activeElement === control,
        after: document.activeElement?.getAttribute('data-chart-zoom-in') || document.activeElement?.tagName,
      };
    })()`
  );
  await evaluateValue(
    browser.cdp,
    `new Promise((resolve) => setTimeout(() => resolve(true), 100))`
  );
  const blurredTooltip = await tooltipState(browser.cdp);
  runtimeStage = "keyboard refocus restores tooltip";
  await focusFirstPoint(browser.cdp);
  await waitForValue(
    browser.cdp,
    `Boolean(document.querySelector('[data-testid="chart-tooltip"]')?.getClientRects().length)`,
    { timeoutMs: 5_000 }
  );
  await evaluateValue(
    browser.cdp,
    `(() => {
      const target = document.activeElement || document;
      target.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
      return true;
    })()`
  );
  await waitForValue(
    browser.cdp,
    `(() => {
      const node = document.querySelector('[data-testid="chart-tooltip"]');
      if (!node) return true;
      if (node.hidden || node.getAttribute('aria-hidden') === 'true') return true;
      const style = getComputedStyle(node);
      return style.display === 'none' || style.visibility === 'hidden' ||
        Number(style.opacity || 1) === 0 || node.getClientRects().length === 0;
    })()`,
    { timeoutMs: 5_000 }
  );
  const escapedTooltip = await tooltipState(browser.cdp);
  runtimeStage = "CPIA zoom and legend controls";

  const zoomInControl = await clickControl(browser.cdp, "chart-zoom-in");
  await waitForValue(
    browser.cdp,
    `(() => {
      const chart = document.querySelector('[data-testid="interactive-time-series-chart"], [data-chart-interaction-v127="true"]');
      if (!chart) return false;
      return Number(chart.getAttribute('data-visible-x-min')) > ${initialDomain?.min ?? 2005} ||
        Number(chart.getAttribute('data-visible-x-max')) < ${initialDomain?.max ?? 2015};
    })()`,
    { timeoutMs: 5_000 }
  );
  const zoomedDomain = await xDomain(browser.cdp);
  const zoomOutControl = await clickControl(browser.cdp, "chart-zoom-out");
  await waitForValue(
    browser.cdp,
    `(() => {
      const chart = document.querySelector('[data-testid="interactive-time-series-chart"], [data-chart-interaction-v127="true"]');
      if (!chart) return false;
      const min = Number(chart.getAttribute('data-visible-x-min'));
      const max = Number(chart.getAttribute('data-visible-x-max'));
      return min < ${zoomedDomain?.min ?? 2006} || max > ${zoomedDomain?.max ?? 2014};
    })()`,
    { timeoutMs: 5_000 }
  );
  const zoomedOutDomain = await xDomain(browser.cdp);
  await clickControl(browser.cdp, "chart-zoom-in");
  await waitForValue(
    browser.cdp,
    `(() => {
      const chart = document.querySelector('[data-testid="interactive-time-series-chart"], [data-chart-interaction-v127="true"]');
      if (!chart) return false;
      return Number(chart.getAttribute('data-visible-x-min')) > 2005 ||
        Number(chart.getAttribute('data-visible-x-max')) < 2015;
    })()`,
    { timeoutMs: 5_000 }
  );
  const resetControl = await clickControl(browser.cdp, "chart-reset");
  await waitForValue(
    browser.cdp,
    `(() => {
      const chart = document.querySelector('[data-testid="interactive-time-series-chart"], [data-chart-interaction-v127="true"]');
      return chart && Number(chart.getAttribute('data-visible-x-min')) === 2005 &&
        Number(chart.getAttribute('data-visible-x-max')) === 2015;
    })()`,
    { timeoutMs: 5_000 }
  );
  const resetDomain = await xDomain(browser.cdp);

  const legend = await evaluateValue(
    browser.cdp,
    `(() => {
      const chart = document.querySelector('[data-testid="interactive-time-series-chart"], [data-chart-interaction-v127="true"]');
      const buttons = [...(chart?.querySelectorAll('[data-chart-legend-toggle]') || [])];
      const before = buttons.filter((button) => button.getAttribute('aria-pressed') === 'true').length;
      buttons[0]?.click();
      return {
        count: buttons.length,
        before,
        visibleLabels: buttons.map((button) => button.textContent?.trim() || ''),
        markerCount: buttons.filter((button) =>
          button.querySelector('[data-series-marker], svg, i')
        ).length,
      };
    })()`
  );
  await waitForValue(
    browser.cdp,
    `(() => [...document.querySelectorAll(
      '[data-testid="interactive-time-series-chart"] [data-chart-legend-toggle], ' +
      '[data-chart-interaction-v127="true"] [data-chart-legend-toggle]'
    )].filter((button) => button.getAttribute('aria-pressed') === 'true').length === 4)()`,
    { timeoutMs: 5_000 }
  );
  legend.after = await evaluateValue(
    browser.cdp,
    `(() => {
      const chart = document.querySelector('[data-testid="interactive-time-series-chart"], [data-chart-interaction-v127="true"]');
      const buttons = [...(chart?.querySelectorAll('[data-chart-legend-toggle]') || [])];
      const after = buttons.filter((button) => button.getAttribute('aria-pressed') === 'true').length;
      buttons[0]?.click();
      return after;
    })()`
  );
  await waitForValue(
    browser.cdp,
    `(() => [...document.querySelectorAll(
      '[data-testid="interactive-time-series-chart"] [data-chart-legend-toggle], ' +
      '[data-chart-interaction-v127="true"] [data-chart-legend-toggle]'
    )].filter((button) => button.getAttribute('aria-pressed') === 'true').length === 5)()`,
    { timeoutMs: 5_000 }
  );
  for (let index = 0; index < 4; index += 1) {
    await evaluateValue(
      browser.cdp,
      `(() => {
        const chart = document.querySelector('[data-testid="interactive-time-series-chart"], [data-chart-interaction-v127="true"]');
        const active = [...(chart?.querySelectorAll('[data-chart-legend-toggle][aria-pressed="true"]') || [])];
        active[0]?.click();
        return true;
      })()`
    );
    await waitForValue(
      browser.cdp,
      `document.querySelectorAll('[data-chart-interaction-v127="true"] [data-chart-legend-toggle][aria-pressed="true"]').length === ${4 - index}`,
      { timeoutMs: 5_000 }
    );
  }
  legend.minimumGuard = await evaluateValue(
    browser.cdp,
    `(() => {
      const chart = document.querySelector('[data-testid="interactive-time-series-chart"], [data-chart-interaction-v127="true"]');
      const active = [...(chart?.querySelectorAll('[data-chart-legend-toggle][aria-pressed="true"]') || [])];
      const only = active[0];
      const before = active.length;
      only?.click();
      const afterImmediate = chart?.querySelectorAll('[data-chart-legend-toggle][aria-pressed="true"]').length || 0;
      return { before, disabled: Boolean(only?.disabled), afterImmediate };
    })()`
  );

  a002Interaction = {
    initialDomain,
    zoomedDomain,
    zoomedOutDomain,
    resetDomain,
    zoomInControl,
    zoomOutControl,
    resetControl,
    focus,
    focusedTooltip,
    tooltipCollision,
    blurredTooltip,
    blurTransition,
    escapedTooltip,
    legend,
  };
  for (const token of focusedTooltip?.forbidden || []) {
    tooltipForbiddenHits.push({ elementId: "A-002", token });
  }

  await setViewport(browser.cdp, 390, 844);
  await navigate(browser.cdp, pageUrl(server.url, "A-002"));
  await waitForAnalysis(browser.cdp);
  await waitForValue(
    browser.cdp,
    `Boolean(document.querySelector('[data-testid="interactive-time-series-chart"] [data-chart-point], [data-chart-interaction-v127="true"] [data-chart-point]'))`,
    { timeoutMs: 15_000 }
  );
  await browser.cdp.send("Emulation.setTouchEmulationEnabled", {
    enabled: true,
    maxTouchPoints: 1,
  });
  await evaluateValue(
    browser.cdp,
    `new Promise((resolve) => {
      document.querySelector('[data-testid="interactive-time-series-chart"], [data-chart-interaction-v127="true"]')
        ?.scrollIntoView({ block: 'center', behavior: 'instant' });
      requestAnimationFrame(() => requestAnimationFrame(() => resolve(true)));
    })`
  );
  runtimeStage = "mobile tap tooltip";
  await evaluateValue(
    browser.cdp,
    `(() => {
      const hit = document.querySelector('[data-chart-hit="true"]');
      window.__v127TouchEvents = [];
      for (const type of ['pointerdown', 'pointerup', 'pointercancel', 'touchstart', 'touchmove', 'touchend', 'click']) {
        hit?.addEventListener(type, (event) => {
          window.__v127TouchEvents.push({
            type,
            pointerType: event.pointerType || null,
            clientX: event.clientX ?? event.changedTouches?.[0]?.clientX ?? null,
            clientY: event.clientY ?? event.changedTouches?.[0]?.clientY ?? null,
          });
        }, { capture: true });
      }
      return Boolean(hit);
    })()`
  );
  const tapTarget = await evaluateValue(
    browser.cdp,
    `(() => {
      const chart = document.querySelector('[data-testid="interactive-time-series-chart"], [data-chart-interaction-v127="true"]');
      const hit = chart?.querySelector('[data-chart-hit="true"]');
      if (!(hit instanceof SVGGraphicsElement)) return null;
      const rect = hit.getBoundingClientRect();
      return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
    })()`
  );
  let tap = { triggered: false };
  if (tapTarget) {
    await browser.cdp.send("Input.dispatchTouchEvent", {
      type: "touchStart",
      touchPoints: [{ x: tapTarget.x, y: tapTarget.y }],
    });
    await browser.cdp.send("Input.dispatchTouchEvent", {
      type: "touchEnd",
      touchPoints: [],
    });
    tap = { triggered: true, target: tapTarget };
  }
  await evaluateValue(
    browser.cdp,
    `new Promise((resolve) => setTimeout(() => resolve(true), 150))`
  );
  const tapTooltip = await tooltipState(browser.cdp);
  const touchEvents = await evaluateValue(
    browser.cdp,
    "window.__v127TouchEvents || []"
  );
  runtimeStage = "mobile blank tap clears tooltip";
  const blankTapTarget = await evaluateValue(
    browser.cdp,
    `(() => {
      const chart = document.querySelector('[data-chart-interaction-v127="true"]');
      if (!(chart instanceof HTMLElement)) return null;
      const rect = chart.getBoundingClientRect();
      const useRight = rect.right + 24 < innerWidth;
      return {
        x: useRight ? rect.right + 18 : Math.max(12, rect.left - 18),
        y: Math.max(12, Math.min(innerHeight - 12, rect.top + 48)),
        outsideChart: true,
      };
    })()`
  );
  if (blankTapTarget) {
    await browser.cdp.send("Input.dispatchTouchEvent", {
      type: "touchStart",
      touchPoints: [{ x: blankTapTarget.x, y: blankTapTarget.y }],
    });
    await browser.cdp.send("Input.dispatchTouchEvent", {
      type: "touchEnd",
      touchPoints: [],
    });
  }
  await waitForValue(
    browser.cdp,
    `(() => {
      const node = document.querySelector('[data-testid="chart-tooltip"]');
      return !node || node.getClientRects().length === 0;
    })()`,
    { timeoutMs: 5_000 }
  );
  const blankTapTooltip = await tooltipState(browser.cdp);
  runtimeStage = "mobile vertical touch drag does not pin tooltip";
  const verticalDragTarget = await evaluateValue(
    browser.cdp,
    `(() => {
      const hit = document.querySelector('[data-chart-hit="true"]');
      if (!(hit instanceof SVGGraphicsElement)) return null;
      const rect = hit.getBoundingClientRect();
      const x = rect.left + rect.width / 2;
      const startY = Math.max(24, Math.min(innerHeight - 24, rect.top + rect.height / 2));
      const direction = innerHeight - startY >= 100 ? 1 : -1;
      const endY = startY + direction * 84;
      return {
        x,
        startY,
        middleY: startY + direction * 42,
        endY,
        deltaY: direction * 84,
        scrollYBefore: window.scrollY,
      };
    })()`
  );
  let verticalDrag = { dispatched: false, target: verticalDragTarget };
  if (verticalDragTarget) {
    await browser.cdp.send("Input.dispatchTouchEvent", {
      type: "touchStart",
      touchPoints: [{ x: verticalDragTarget.x, y: verticalDragTarget.startY }],
    });
    await browser.cdp.send("Input.dispatchTouchEvent", {
      type: "touchMove",
      touchPoints: [{ x: verticalDragTarget.x, y: verticalDragTarget.middleY }],
    });
    await browser.cdp.send("Input.dispatchTouchEvent", {
      type: "touchMove",
      touchPoints: [{ x: verticalDragTarget.x, y: verticalDragTarget.endY }],
    });
    await browser.cdp.send("Input.dispatchTouchEvent", {
      type: "touchEnd",
      touchPoints: [],
    });
    await evaluateValue(
      browser.cdp,
      `new Promise((resolve) => setTimeout(() => resolve(true), 150))`
    );
    verticalDrag = {
      dispatched: true,
      target: verticalDragTarget,
      scrollYAfter: await evaluateValue(browser.cdp, "window.scrollY"),
      tooltip: await tooltipState(browser.cdp),
    };
  }
  const touchTargets = await evaluateValue(
    browser.cdp,
    `(() => [...document.querySelectorAll(
      '[data-chart-interaction-v127="true"] [data-testid^="chart-zoom"], ' +
      '[data-chart-interaction-v127="true"] [data-testid="chart-reset"], ' +
      '[data-chart-interaction-v127="true"] [data-chart-zoom-in], ' +
      '[data-chart-interaction-v127="true"] [data-chart-zoom-out], ' +
      '[data-chart-interaction-v127="true"] [data-chart-reset]'
    )].map((node) => {
      const rect = node.getBoundingClientRect();
      return { testid: node.getAttribute('data-testid'), width: rect.width, height: rect.height };
    }))()`
  );
  mobileInteraction = {
    tap,
    tooltip: tapTooltip,
    touchEvents,
    blankTapTarget,
    blankTapTooltip,
    verticalDrag,
    touchTargets,
  };
  for (const token of tapTooltip?.forbidden || []) {
    tooltipForbiddenHits.push({ elementId: "A-002-mobile", token });
  }

  await setViewport(browser.cdp, 1440, 1050);
  for (const elementId of NON_TIME_SERIES_ELEMENTS) {
    try {
      await navigate(browser.cdp, pageUrl(server.url, elementId));
      await waitForAnalysis(browser.cdp);
      const trigger = await evaluateValue(
        browser.cdp,
        `(() => {
          const root = document.querySelector('[data-testid="public-analysis-root"]');
          const item = root?.querySelector('[data-chart-interactive-item]');
          if (!item) return false;
          item.focus();
          item.dispatchEvent(new FocusEvent('focusin', { bubbles: true }));
          item.dispatchEvent(new PointerEvent('pointerenter', { bubbles: true, pointerType: 'mouse' }));
          return true;
        })()`
      );
      if (trigger) {
        await waitForValue(
          browser.cdp,
          `(() => {
            const tooltip = document.querySelector('[data-testid="public-analysis-root"] [data-testid="chart-tooltip"]');
            return Boolean(tooltip && !tooltip.hidden && tooltip.getAttribute('aria-hidden') !== 'true' && tooltip.getClientRects().length > 0);
          })()`,
          { timeoutMs: 5_000 }
        );
      }
      const result = await evaluateValue(
        browser.cdp,
        `(() => {
          const root = document.querySelector('[data-testid="public-analysis-root"]');
          const item = root?.querySelector('[data-chart-interactive-item]');
          const tooltip = root.querySelector('[data-testid="chart-tooltip"]');
          const text = String(tooltip?.textContent || '').normalize('NFC').replace(/\\s+/gu, ' ').trim();
          return {
            item: Boolean(item),
            focusable: Boolean(item && item.tabIndex >= 0),
            nativeTitle: Boolean(item?.querySelector('title')),
            tooltip: Boolean(tooltip && !tooltip.hidden && tooltip.getAttribute('aria-hidden') !== 'true' && tooltip.getClientRects().length > 0),
            tooltipText: text,
            forbidden: ${JSON.stringify(TOOLTIP_FORBIDDEN)}.filter((token) =>
              text.toLocaleLowerCase('en-US').includes(token.toLocaleLowerCase('en-US'))
            ),
          };
        })()`
      );
      if (!result.item || !result.focusable || !result.tooltip || !result.tooltipText) {
        nonTimeSeriesFailures.push({ elementId, result });
      }
      for (const token of result.forbidden || []) {
        tooltipForbiddenHits.push({ elementId, token });
      }
    } catch (error) {
      nonTimeSeriesFailures.push({
        elementId,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }
} catch (error) {
  runtimeFailure = `${runtimeStage}: ${
    error instanceof Error ? error.message : String(error)
  }`;
} finally {
  if (browser) await browser.close();
  if (server) await server.close();
}

const sourceFiles = [
  resolve(PROJECT_ROOT, "src/components/charts/InteractiveTimeSeriesChartV127.tsx"),
  resolve(PROJECT_ROOT, "src/components/charts/ChartTooltipV127.tsx"),
  resolve(PROJECT_ROOT, "src/components/charts/chart-interactions-v127.css"),
];
const missingSourceFiles = sourceFiles.filter((path) => !existsSync(path));
const sourceText = sourceFiles
  .filter(existsSync)
  .map((path) => readFileSync(path, "utf8"))
  .join("\n");
audit.check(
  "COMMON_INTERACTIVE_CHART_COMPONENT",
  missingSourceFiles.length === 0 &&
    /InteractiveTimeSeriesChartV127/u.test(sourceText) &&
    /ChartTooltipV127/u.test(sourceText),
  { missing: missingSourceFiles, namedComponents: /InteractiveTimeSeriesChartV127/u.test(sourceText) && /ChartTooltipV127/u.test(sourceText) },
  { missing: [], namedComponents: true }
);
audit.check(
  "REDUCED_MOTION_AND_FOCUS_VISIBLE",
  /prefers-reduced-motion\s*:\s*reduce/iu.test(sourceText) && /:focus-visible/iu.test(sourceText),
  {
    reducedMotion: /prefers-reduced-motion\s*:\s*reduce/iu.test(sourceText),
    focusVisible: /:focus-visible/iu.test(sourceText),
  },
  { reducedMotion: true, focusVisible: true }
);
audit.check(
  "POINTER_PAN_AND_OPTIONAL_RANGE_BRUSH",
  /setPointerCapture/iu.test(sourceText) &&
    /["']pan["']/u.test(sourceText) &&
    /data-chart-range-brush/iu.test(sourceText),
  {
    pointerCapture: /setPointerCapture/iu.test(sourceText),
    horizontalPan: /["']pan["']/u.test(sourceText),
    optionalRangeBrush: /data-chart-range-brush/iu.test(sourceText),
  },
  { pointerCapture: true, horizontalPan: true, optionalRangeBrush: true }
);
audit.check(
  "TIME_SERIES_PRIMARY_RENDERERS",
  runtimeFailure === null && timeSeriesFailures.length === 0,
  { inspected: TIME_SERIES_ELEMENTS.length, failed: timeSeriesFailures.length, runtimeFailure },
  { inspected: TIME_SERIES_ELEMENTS.length, failed: 0, runtimeFailure: null },
  timeSeriesFailures
);
audit.check("TIME_SERIES_AXIS_TITLE", axisTitleFailures.length === 0, axisTitleFailures.length, 0, axisTitleFailures);
audit.check(
  "Y_AXIS_DYNAMIC_LAYOUT_NO_OVERLAP",
  yAxisLayoutFailures.length === 0,
  { inspectedElements: TIME_SERIES_ELEMENTS.length, failures: yAxisLayoutFailures.length },
  { inspectedElements: 11, failures: 0 },
  yAxisLayoutFailures
);
audit.check("TIME_SERIES_UNIT", unitFailures.length === 0, unitFailures.length, 0, unitFailures);
audit.check("CHART_BLANK_STATE", blankCharts.length === 0, blankCharts.length, 0, blankCharts);
audit.check("ONE_UNIT_PER_AXIS", unitAxisFailures.length === 0, unitAxisFailures.length, 0, unitAxisFailures);
audit.check("KEYBOARD_CHART_ACCESS", keyboardFailures.length === 0, keyboardFailures.length, 0, keyboardFailures);

const tooltipPass =
  a002Interaction?.focus?.triggered === true &&
  a002Interaction?.focus?.focused === true &&
  a002Interaction?.focusedTooltip?.visible === true &&
  a002Interaction?.focusedTooltip?.crosshairVisible === true &&
  a002Interaction?.focusedTooltip?.seriesRows === 5 &&
  /점/u.test(a002Interaction?.focusedTooltip?.text || "") &&
  /20(?:0[5-9]|1[0-5])(?:년)?/u.test(a002Interaction?.focusedTooltip?.text || "") &&
  a002Interaction?.blurredTooltip?.visible === false &&
  a002Interaction?.escapedTooltip?.visible === false;
audit.check(
  "CUSTOM_KEYBOARD_TOOLTIP",
  tooltipPass,
  a002Interaction
    ? {
        focus: a002Interaction.focus,
        blurTransition: a002Interaction.blurTransition,
        tooltip: a002Interaction.focusedTooltip,
        blurVisible: a002Interaction.blurredTooltip?.visible,
        escapedVisible: a002Interaction.escapedTooltip?.visible,
      }
    : null,
  { focused: true, visible: true, crosshair: true, seriesRows: 5, escapeClears: true }
);
audit.check(
  "A002_TOOLTIP_STAGE_VIEWPORT_COLLISION",
  a002Interaction?.tooltipCollision?.focused === true &&
    a002Interaction?.tooltipCollision?.seriesRows === 5 &&
    a002Interaction?.tooltipCollision?.deltaRows === 5 &&
    a002Interaction?.tooltipCollision?.inside === true,
  a002Interaction?.tooltipCollision ?? null,
  { focused: true, seriesRows: 5, deltaRows: 5, inside: true }
);
audit.check(
  "MOBILE_TAP_TOOLTIP",
  mobileInteraction?.tap?.triggered === true &&
    mobileInteraction?.tooltip?.visible === true &&
    mobileInteraction?.tooltip?.seriesRows === 5 &&
    mobileInteraction?.blankTapTooltip?.visible === false &&
    (mobileInteraction?.touchTargets || []).length === 3 &&
    (mobileInteraction?.touchTargets || []).every((target) =>
      target.width >= 44 && target.height >= 44
    ),
  mobileInteraction,
  { triggered: true, visible: true, seriesRows: 5, touchTargets: ">=44x44" }
);
audit.check(
  "MOBILE_VERTICAL_TOUCH_DRAG_NO_TOOLTIP",
  mobileInteraction?.blankTapTooltip?.visible === false &&
    mobileInteraction?.verticalDrag?.dispatched === true &&
    Math.abs(mobileInteraction?.verticalDrag?.target?.deltaY || 0) >= 48 &&
    mobileInteraction?.verticalDrag?.tooltip?.visible === false &&
    mobileInteraction?.verticalDrag?.tooltip?.pinned === null,
  mobileInteraction?.verticalDrag ?? null,
  {
    tooltipClearedBeforeDrag: true,
    dispatched: true,
    minimumVerticalDelta: 48,
    visible: false,
    pinned: null,
  }
);
const initial = a002Interaction?.initialDomain;
const zoomed = a002Interaction?.zoomedDomain;
const zoomedOut = a002Interaction?.zoomedOutDomain;
const reset = a002Interaction?.resetDomain;
audit.check(
  "ZOOM_IN",
  a002Interaction?.zoomInControl?.clicked === true &&
    (zoomed?.min > initial?.min || zoomed?.max < initial?.max) &&
    /확대/u.test(`${a002Interaction?.zoomInControl?.text || ""} ${a002Interaction?.zoomInControl?.ariaLabel || ""}`),
  { control: a002Interaction?.zoomInControl, initial, zoomed },
  "visible X range narrows with labelled control"
);
audit.check(
  "ZOOM_OUT",
  a002Interaction?.zoomOutControl?.clicked === true &&
    (zoomedOut?.min < zoomed?.min || zoomedOut?.max > zoomed?.max) &&
    /축소/u.test(`${a002Interaction?.zoomOutControl?.text || ""} ${a002Interaction?.zoomOutControl?.ariaLabel || ""}`),
  { control: a002Interaction?.zoomOutControl, zoomed, zoomedOut },
  "visible X range expands with labelled control"
);
audit.check(
  "RESET_FULL_RANGE",
  a002Interaction?.resetControl?.clicked === true &&
    reset?.min === 2005 && reset?.max === 2015 &&
    /전체\s*기간|전체/u.test(`${a002Interaction?.resetControl?.text || ""} ${a002Interaction?.resetControl?.ariaLabel || ""}`),
  { control: a002Interaction?.resetControl, reset },
  { min: 2005, max: 2015, label: "전체" }
);
audit.check(
  "CPIA_FIXED_Y_DOMAIN",
  initial?.yMin === 1 &&
    initial?.yMax === 6 &&
    initial?.yZoom === "false" &&
    initial?.xTitle === "연도" &&
    String(initial?.yTitle || "").replace(/\s+/gu, "") === "CPIA점수(점)" &&
    initial?.metadata?.includes("단위: 점") &&
    initial?.metadata?.includes("척도: 1(낮음)–6(높음)"),
  initial,
  {
    yMin: 1,
    yMax: 6,
    yZoom: "false",
    xTitle: "연도",
    yTitle: "CPIA 점수(점)",
    metadata: ["단위: 점", "척도: 1(낮음)–6(높음)"],
  }
);
audit.check(
  "REVIEWED_OFFICIAL_SCORE_DOMAINS",
  officialDomainFailures.length === 0,
  officialDomainFailures,
  [],
  officialDomainFailures
);
audit.check(
  "CPIA_LEGEND_TOGGLE",
  a002Interaction?.legend?.count === 5 &&
  a002Interaction?.legend?.before === 5 &&
    a002Interaction?.legend?.after === 4 &&
    a002Interaction?.legend?.markerCount === 5 &&
    a002Interaction?.legend?.minimumGuard?.before === 1 &&
    a002Interaction?.legend?.minimumGuard?.disabled === true &&
    a002Interaction?.legend?.minimumGuard?.afterImmediate === 1 &&
    (a002Interaction?.legend?.visibleLabels || []).every(Boolean),
  a002Interaction?.legend ?? null,
  { count: 5, before: 5, after: 4, markerCount: 5, minimumVisibleSeries: 1 }
);
audit.check(
  "NON_TIME_SERIES_CUSTOM_TOOLTIP",
  nonTimeSeriesFailures.length === 0,
  { inspected: NON_TIME_SERIES_ELEMENTS.length, failed: nonTimeSeriesFailures.length },
  { inspected: NON_TIME_SERIES_ELEMENTS.length, failed: 0 },
  nonTimeSeriesFailures
);
audit.check(
  "FORBIDDEN_INTERNAL_TOKEN_IN_TOOLTIP",
  tooltipForbiddenHits.length === 0,
  tooltipForbiddenHits.length,
  0,
  tooltipForbiddenHits
);
audit.check(
  "UNCAUGHT_RUNTIME_ERROR",
  browser?.runtimeErrors?.length === 0,
  browser?.runtimeErrors?.length ?? null,
  0,
  browser?.runtimeErrors?.slice(0, 50)
);

audit.finish({
  timeSeriesElementsInspected: TIME_SERIES_ELEMENTS.length,
  timeSeriesFailures: timeSeriesFailures.length,
  axisTitleFailures: axisTitleFailures.length,
  yAxisLayoutFailures: yAxisLayoutFailures.length,
  unitLabelFailures: unitFailures.length,
  oneUnitPerAxisFailures: unitAxisFailures.length,
  keyboardFailures: keyboardFailures.length,
  officialDomainFailures: officialDomainFailures.length,
  customTooltip: tooltipPass,
  tooltipViewportCollision: a002Interaction?.tooltipCollision?.inside === true,
  mobileTapTooltip: mobileInteraction?.tooltip?.visible === true,
  mobileVerticalDragNoTooltip:
    mobileInteraction?.blankTapTooltip?.visible === false &&
    mobileInteraction?.verticalDrag?.dispatched === true &&
    mobileInteraction?.verticalDrag?.tooltip?.visible === false &&
    mobileInteraction?.verticalDrag?.tooltip?.pinned === null,
  zoomIn: zoomed?.min > initial?.min || zoomed?.max < initial?.max,
  zoomOut: zoomedOut?.min < zoomed?.min || zoomedOut?.max > zoomed?.max,
  resetFullRange: reset?.min === 2005 && reset?.max === 2015,
  cpiaFixedDomain: initial?.yMin === 1 && initial?.yMax === 6 && initial?.yZoom === "false",
  nonTimeSeriesInteractionFailures: nonTimeSeriesFailures.length,
  forbiddenTooltipTokenCount: tooltipForbiddenHits.length,
  blankChartCount: blankCharts.length,
  uncaughtRuntimeError: browser?.runtimeErrors?.length ?? null,
});
