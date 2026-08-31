#!/usr/bin/env node

import { existsSync, readFileSync } from "node:fs";
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
  finishAuditV129,
  mapUrlV129,
  sourceTextV129,
} from "./v129/audit-helpers.mjs";

const audit = new AuditV125("map-layout:v129");
const sourcePaths = [
  resolve(PROJECT_ROOT, "src/components/map/MapPanelSeparatorV129.tsx"),
  resolve(PROJECT_ROOT, "src/hooks/useResizableMapPanelsV129.ts"),
  resolve(PROJECT_ROOT, "src/styles/map-layout-v129.css"),
  resolve(PROJECT_ROOT, "src/pages/RealMapExplorerPage.tsx"),
];
const missingSources = sourcePaths.filter((path) => !existsSync(path));
const source = sourceTextV129(sourcePaths);

audit.check("MAP_LAYOUT_V129_SOURCES", missingSources.length === 0, missingSources, []);
audit.check(
  "MAP_LAYOUT_STATIC_LIMITS",
  /defaultWidth:\s*320/gu.test(source) &&
    /minimum:\s*260/gu.test(source) &&
    /maximum:\s*460/gu.test(source) &&
    /defaultWidth:\s*360/gu.test(source) &&
    /minimum:\s*300/gu.test(source) &&
    /maximum:\s*520/gu.test(source) &&
    /mapMinimumWidth:\s*560/gu.test(source),
  {
    left: /defaultWidth:\s*320/gu.test(source) && /minimum:\s*260/gu.test(source) && /maximum:\s*460/gu.test(source),
    right: /defaultWidth:\s*360/gu.test(source) && /minimum:\s*300/gu.test(source) && /maximum:\s*520/gu.test(source),
    mapMinimum: /mapMinimumWidth:\s*560/gu.test(source),
  },
  { left: "260..460 default 320", right: "300..520 default 360", mapMinimum: 560 }
);
audit.check(
  "MAP_LAYOUT_STATIC_BEHAVIOR",
  /ResizeObserver/gu.test(source) &&
    /localStorage/gu.test(source) &&
    /setPointerCapture/gu.test(source) &&
    /ArrowLeft/gu.test(source) &&
    /ArrowRight/gu.test(source) &&
    /shiftKey/gu.test(source) &&
    /onDoubleClick/gu.test(source) &&
    /map\.resize\(\)/gu.test(source) &&
    /userSelect/gu.test(source),
  {
    resizeObserver: /ResizeObserver/gu.test(source),
    persistence: /localStorage/gu.test(source),
    pointerCapture: /setPointerCapture/gu.test(source),
    keyboard: /ArrowLeft/gu.test(source) && /ArrowRight/gu.test(source),
    accelerated: /shiftKey/gu.test(source),
    reset: /onDoubleClick/gu.test(source),
    mapResize: /map\.resize\(\)/gu.test(source),
    selectionPrevention: /userSelect/gu.test(source),
  },
  "all required resize contracts"
);

function layoutSnapshotExpression() {
  return `(() => {
    const root = document.querySelector('.cdp-map-page');
    const layout = document.querySelector('[data-testid="map-resizable-layout"], .cdp-map-layout');
    const left = document.querySelector('[data-testid="map-layer-panel"]');
    const right = document.querySelector('[data-testid="map-analysis-panel"]');
    const map = document.querySelector('.cdp-map-canvas-wrap');
    const separators = [...document.querySelectorAll('[role="separator"][aria-orientation="vertical"]')];
    const visible = (node) => {
      if (!node) return false;
      const style = getComputedStyle(node);
      const rect = node.getBoundingClientRect();
      return style.display !== 'none' && style.visibility !== 'hidden' && Number(style.opacity || 1) > 0 && rect.width > 0 && rect.height > 0;
    };
    const box = (node) => {
      const rect = node?.getBoundingClientRect();
      return rect ? { left: rect.left, right: rect.right, top: rect.top, bottom: rect.bottom, width: rect.width, height: rect.height } : null;
    };
    const preset = document.querySelector('.cdp-map-preset-scroll');
    const cards = [...document.querySelectorAll('[data-testid="map-analysis-preset"]')];
    return {
      viewport: innerWidth,
      root: {
        leftWidth: Number(root?.getAttribute('data-left-panel-width')),
        rightWidth: Number(root?.getAttribute('data-right-panel-width')),
        mapMinimum: Number(root?.getAttribute('data-map-minimum-width')),
        rightAutoCollapsed: root?.getAttribute('data-right-panel-auto-collapsed'),
        leftCompact: root?.getAttribute('data-left-panel-compact'),
      },
      layout: box(layout),
      left: box(left),
      right: box(right),
      map: box(map),
      separators: separators.map((node) => ({
        testid: node.getAttribute('data-testid'),
        visible: visible(node),
        enabled: node.getAttribute('data-resizer-enabled'),
        role: node.getAttribute('role'),
        orientation: node.getAttribute('aria-orientation'),
        minimum: Number(node.getAttribute('aria-valuemin')),
        maximum: Number(node.getAttribute('aria-valuemax')),
        value: Number(node.getAttribute('aria-valuenow')),
        tabIndex: node.tabIndex,
        box: box(node),
      })),
      preset: preset ? {
        clientWidth: preset.clientWidth,
        scrollWidth: preset.scrollWidth,
        overflowX: getComputedStyle(preset).overflowX,
        display: getComputedStyle(preset).display,
        gridTemplateColumns: getComputedStyle(preset).gridTemplateColumns,
      } : null,
      cards: cards.map((node) => ({
        tagName: node.tagName,
        tabIndex: node.tabIndex,
        pressed: node.getAttribute('aria-pressed'),
        text: node.textContent?.replace(/\\s+/gu, ' ').trim() || '',
        width: node.getBoundingClientRect().width,
      })),
      pageOverflow: Math.max(document.documentElement.scrollWidth, document.body.scrollWidth) - innerWidth,
      bodyUserSelect: document.body.style.userSelect,
      resizing: layout?.getAttribute('data-resizing') || document.body.classList.contains('cdp-map-panel-resize-active'),
    };
  })()`;
}

async function separatorCenter(cdp, side) {
  return evaluateValue(
    cdp,
    `(() => {
      const node = document.querySelector('[data-testid="map-${side}-panel-separator"]');
      if (!node) return null;
      const rect = node.getBoundingClientRect();
      return { x: rect.left + rect.width / 2, y: rect.top + Math.min(80, rect.height / 2), width: rect.width, height: rect.height };
    })()`
  );
}

async function dragSeparator(cdp, side, deltaX) {
  const center = await separatorCenter(cdp, side);
  if (!center) return { dispatched: false };
  await cdp.send("Input.dispatchMouseEvent", { type: "mousePressed", x: center.x, y: center.y, button: "left", buttons: 1, clickCount: 1 });
  await cdp.send("Input.dispatchMouseEvent", { type: "mouseMoved", x: center.x + deltaX, y: center.y, button: "left", buttons: 1 });
  const during = await evaluateValue(cdp, layoutSnapshotExpression());
  await cdp.send("Input.dispatchMouseEvent", { type: "mouseReleased", x: center.x + deltaX, y: center.y, button: "left", buttons: 0, clickCount: 1 });
  await new Promise((resolveWait) => setTimeout(resolveWait, 120));
  return { dispatched: true, center, during, after: await evaluateValue(cdp, layoutSnapshotExpression()) };
}

async function keyboardResize(cdp, side, key, shiftKey) {
  return evaluateValue(
    cdp,
    `(() => {
      const node = document.querySelector('[data-testid="map-${side}-panel-separator"]');
      if (!(node instanceof HTMLElement)) return null;
      const before = Number(node.getAttribute('aria-valuenow'));
      node.focus();
      node.dispatchEvent(new KeyboardEvent('keydown', { key: ${JSON.stringify(key)}, shiftKey: ${shiftKey}, bubbles: true }));
      return { before, focused: document.activeElement === node };
    })()`
  );
}

let server = null;
let browser = null;
let runtimeFailure = null;
const responsiveSnapshots = [];
let desktopInitial = null;
let leftDrag = null;
let rightDrag = null;
let keyboard = null;
let persisted = null;
let narrowWidePreference = null;
let reset = null;
let panelCollapseSnapshots = null;
try {
  server = await startStaticBuildServer(resolve(PROJECT_ROOT, "build"));
  browser = await launchHeadlessBrowser();
  await setViewport(browser.cdp, 1440, 1100);
  await navigate(browser.cdp, mapUrlV129(server.url));
  await waitForValue(browser.cdp, `Boolean(document.querySelector('.cdp-map-page'))`, { timeoutMs: 30_000 });
  await evaluateValue(browser.cdp, `(() => { localStorage.removeItem('cdp-map-left-panel-width-v129'); localStorage.removeItem('cdp-map-right-panel-width-v129'); location.reload(); return true; })()`);
  await waitForValue(browser.cdp, `Boolean(document.querySelector('[data-testid="map-resizable-layout"]'))`, { timeoutMs: 30_000 });
  desktopInitial = await evaluateValue(browser.cdp, layoutSnapshotExpression());

  leftDrag = await dragSeparator(browser.cdp, "left", 72);
  rightDrag = await dragSeparator(browser.cdp, "right", -64);
  const beforeNormal = await evaluateValue(browser.cdp, `Number(document.querySelector('[data-testid="map-left-panel-separator"]')?.getAttribute('aria-valuenow'))`);
  const normalDispatch = await keyboardResize(browser.cdp, "left", "ArrowLeft", false);
  await new Promise((resolveWait) => setTimeout(resolveWait, 80));
  const afterNormal = await evaluateValue(browser.cdp, `Number(document.querySelector('[data-testid="map-left-panel-separator"]')?.getAttribute('aria-valuenow'))`);
  const acceleratedDispatch = await keyboardResize(browser.cdp, "left", "ArrowLeft", true);
  await new Promise((resolveWait) => setTimeout(resolveWait, 80));
  const afterAccelerated = await evaluateValue(browser.cdp, `Number(document.querySelector('[data-testid="map-left-panel-separator"]')?.getAttribute('aria-valuenow'))`);
  keyboard = { normalDispatch, acceleratedDispatch, beforeNormal, afterNormal, afterAccelerated, normalDelta: Math.abs(afterNormal - beforeNormal), acceleratedDelta: Math.abs(afterAccelerated - afterNormal) };

  const storedBeforeReload = await evaluateValue(browser.cdp, `({ left: Number(localStorage.getItem('cdp-map-left-panel-width-v129')), right: Number(localStorage.getItem('cdp-map-right-panel-width-v129')) })`);
  await navigate(browser.cdp, mapUrlV129(server.url));
  await waitForValue(browser.cdp, `Boolean(document.querySelector('[data-testid="map-resizable-layout"]'))`, { timeoutMs: 30_000 });
  const afterReload = await evaluateValue(browser.cdp, layoutSnapshotExpression());
  persisted = { storedBeforeReload, afterReload };

  await setViewport(browser.cdp, 1024, 900);
  await waitForValue(browser.cdp, `window.innerWidth === 1024`, { timeoutMs: 10_000 });
  await new Promise((resolveWait) => setTimeout(resolveWait, 120));
  const narrowSnapshot = await evaluateValue(browser.cdp, layoutSnapshotExpression());
  const storedWhileNarrow = await evaluateValue(
    browser.cdp,
    `({ left: Number(localStorage.getItem('cdp-map-left-panel-width-v129')), right: Number(localStorage.getItem('cdp-map-right-panel-width-v129')) })`
  );
  await setViewport(browser.cdp, 1440, 1100);
  await waitForValue(browser.cdp, `window.innerWidth === 1440`, { timeoutMs: 10_000 });
  await new Promise((resolveWait) => setTimeout(resolveWait, 160));
  const restoredWideSnapshot = await evaluateValue(browser.cdp, layoutSnapshotExpression());
  narrowWidePreference = {
    preferred: storedBeforeReload,
    narrow: narrowSnapshot,
    storedWhileNarrow,
    restoredWide: restoredWideSnapshot,
  };

  await evaluateValue(
    browser.cdp,
    `(() => {
      for (const side of ['left', 'right']) {
        const node = document.querySelector('[data-testid="map-' + side + '-panel-separator"]');
        node?.dispatchEvent(new MouseEvent('dblclick', { bubbles: true, button: 0 }));
      }
      return true;
    })()`
  );
  await new Promise((resolveWait) => setTimeout(resolveWait, 120));
  reset = await evaluateValue(browser.cdp, layoutSnapshotExpression());

  const togglePanel = async (ariaLabel) => {
    const toggled = await evaluateValue(
      browser.cdp,
      `(() => {
        const button = document.querySelector('button[aria-label=${JSON.stringify(ariaLabel)}]');
        if (!(button instanceof HTMLButtonElement)) return false;
        button.click();
        return true;
      })()`
    );
    if (!toggled) throw new Error(`panel toggle unavailable: ${ariaLabel}`);
    await new Promise((resolveWait) => setTimeout(resolveWait, 160));
    return evaluateValue(browser.cdp, layoutSnapshotExpression());
  };
  const leftCollapsed = await togglePanel("데이터 목록 접기");
  const leftRestored = await togglePanel("데이터 목록 열기");
  const rightCollapsed = await togglePanel("지도 분석 접기");
  const rightRestored = await togglePanel("지도 분석 열기");
  panelCollapseSnapshots = {
    leftCollapsed,
    leftRestored,
    rightCollapsed,
    rightRestored,
  };

  for (const width of [390, 768, 1024, 1100, 1280, 1440, 1920]) {
    await setViewport(browser.cdp, width, width < 1100 ? 900 : 1100);
    await waitForValue(browser.cdp, `window.innerWidth === ${width}`, { timeoutMs: 10_000 });
    await new Promise((resolveWait) => setTimeout(resolveWait, 120));
    responsiveSnapshots.push(await evaluateValue(browser.cdp, layoutSnapshotExpression()));
  }
} catch (error) {
  runtimeFailure = error instanceof Error ? error.message : String(error);
} finally {
  if (browser) await browser.close();
  if (server) await server.close();
}

const desktopSeparators = (desktopInitial?.separators || []).filter((item) => item.visible && item.enabled === "true");
audit.check(
  "DESKTOP_DEFAULT_PANEL_WIDTHS",
  desktopInitial?.root?.leftWidth === 320 &&
    desktopInitial?.root?.rightWidth === 360,
  {
    leftWidth: desktopInitial?.root?.leftWidth ?? null,
    rightWidth: desktopInitial?.root?.rightWidth ?? null,
  },
  { leftWidth: 320, rightWidth: 360 }
);
const leftSeparator = desktopSeparators.find((item) => item.testid === "map-left-panel-separator");
const rightSeparator = desktopSeparators.find((item) => item.testid === "map-right-panel-separator");
const rangeContract =
  leftSeparator?.minimum === 260 && leftSeparator.maximum <= 460 && leftSeparator.maximum >= 260 &&
  rightSeparator?.minimum === 300 && rightSeparator.maximum <= 520 && rightSeparator.maximum >= 300;
const pointerPass =
  leftDrag?.dispatched === true && rightDrag?.dispatched === true &&
  leftDrag?.after?.root?.leftWidth > desktopInitial?.root?.leftWidth &&
  rightDrag?.after?.root?.rightWidth > leftDrag?.after?.root?.rightWidth &&
  [true, "true"].includes(leftDrag?.during?.resizing) && leftDrag?.during?.bodyUserSelect === "none" &&
  leftDrag?.after?.bodyUserSelect !== "none";
const keyboardPass =
  keyboard?.normalDispatch?.focused === true &&
  keyboard?.acceleratedDispatch?.focused === true &&
  keyboard?.normalDelta >= 8 && keyboard?.acceleratedDelta >= 24 &&
  keyboard.acceleratedDelta > keyboard.normalDelta;
const persistencePass =
  Number.isFinite(persisted?.storedBeforeReload?.left) &&
  Number.isFinite(persisted?.storedBeforeReload?.right) &&
  Math.abs(persisted.storedBeforeReload.left - persisted.afterReload.root.leftWidth) <= 1 &&
  Math.abs(persisted.storedBeforeReload.right - persisted.afterReload.root.rightWidth) <= 1;
const narrowWidePreferencePass =
  Number.isFinite(narrowWidePreference?.preferred?.left) &&
  Number.isFinite(narrowWidePreference?.preferred?.right) &&
  narrowWidePreference?.narrow?.viewport === 1024 &&
  narrowWidePreference?.narrow?.separators?.every(
    (item) => item.visible === false || item.enabled !== "true"
  ) &&
  Math.abs(
    narrowWidePreference.preferred.left -
      narrowWidePreference.storedWhileNarrow.left
  ) <= 1 &&
  Math.abs(
    narrowWidePreference.preferred.right -
      narrowWidePreference.storedWhileNarrow.right
  ) <= 1 &&
  Math.abs(
    narrowWidePreference.preferred.left -
      narrowWidePreference.restoredWide.root.leftWidth
  ) <= 1 &&
  Math.abs(
    narrowWidePreference.preferred.right -
      narrowWidePreference.restoredWide.root.rightWidth
  ) <= 1;
const resetPass = reset?.root?.leftWidth === 320 && reset?.root?.rightWidth === 360;
const panelCollapsePass = (() => {
  const snapshots = panelCollapseSnapshots;
  if (!snapshots) return false;
  const correctlyOrdered = (snapshot) =>
    snapshot?.left?.right <= snapshot?.map?.left + 1 &&
    snapshot?.map?.right <= snapshot?.right?.left + 1;
  const leftSeparator = snapshots.leftCollapsed?.separators?.find(
    (item) => item.testid === "map-left-panel-separator"
  );
  const rightSeparator = snapshots.rightCollapsed?.separators?.find(
    (item) => item.testid === "map-right-panel-separator"
  );
  return (
    snapshots.leftCollapsed?.map?.width >= 559 &&
    snapshots.rightCollapsed?.map?.width >= 559 &&
    snapshots.leftRestored?.map?.width >= 559 &&
    snapshots.rightRestored?.map?.width >= 559 &&
    leftSeparator?.visible === false &&
    rightSeparator?.visible === false &&
    correctlyOrdered(snapshots.leftCollapsed) &&
    correctlyOrdered(snapshots.rightCollapsed) &&
    correctlyOrdered(snapshots.leftRestored) &&
    correctlyOrdered(snapshots.rightRestored)
  );
})();
const responsiveFailures = responsiveSnapshots.filter((snapshot) => {
  if (snapshot.pageOverflow > 1 || !snapshot.map || snapshot.map.width <= 0) return true;
  if (snapshot.viewport >= 1100 && snapshot.map.width < 559) return true;
  if (snapshot.viewport < 1100 && snapshot.separators.some((item) => item.visible && item.enabled === "true")) return true;
  return false;
});
const narrowDesktop = responsiveSnapshots.find((item) => item.viewport === 1100);
const presetFailures = responsiveSnapshots
  .filter((item) => item.viewport >= 1100)
  .filter(
    (item) =>
      !item.preset ||
      item.preset.scrollWidth > item.preset.clientWidth + 1 ||
      item.cards.length < 5 ||
      item.cards.some((card) => card.tagName !== "BUTTON" || card.tabIndex < 0 || !card.text)
  );

audit.check("DESKTOP_RESIZERS", runtimeFailure === null && desktopSeparators.length === 2 && rangeContract, { runtimeFailure, separators: desktopSeparators }, { count: 2, left: "260..460", right: "300..520" });
audit.check("POINTER_PANEL_RESIZE", pointerPass, { leftDrag, rightDrag }, { leftIncreased: true, rightIncreased: true, selectionDisabledDuringDrag: true });
audit.check("KEYBOARD_PANEL_RESIZE", keyboardPass, keyboard, { normalStep: 8, acceleratedStep: 32, focused: true });
audit.check("WIDTH_PERSISTENCE", persistencePass, persisted, "stored widths restored after navigation/reload");
audit.check(
  "WIDTH_PREFERENCE_NARROW_WIDE_RESTORE",
  runtimeFailure === null && narrowWidePreferencePass,
  { runtimeFailure, narrowWidePreference },
  {
    narrowViewport: 1024,
    resizersDisabled: true,
    storedPreferenceUnchanged: true,
    widePreferenceRestored: true,
  }
);
audit.check("DOUBLE_CLICK_RESET", resetPass, reset?.root || null, { leftWidth: 320, rightWidth: 360 });
audit.check(
  "DESKTOP_PANEL_COLLAPSE_GRID_STABILITY",
  runtimeFailure === null && panelCollapsePass,
  { runtimeFailure, panelCollapseSnapshots },
  {
    leftCollapsedMapWidth: ">= 560",
    rightCollapsedMapWidth: ">= 560",
    hiddenSeparatorDoesNotShiftGrid: true,
    restoredMapWidth: ">= 560",
  }
);
audit.check(
  "MAP_MINIMUM_WIDTH",
  runtimeFailure === null && responsiveFailures.length === 0 && Number(desktopInitial?.root?.mapMinimum) === 560,
  { runtimeFailure, declaredMinimum: desktopInitial?.root?.mapMinimum, snapshots: responsiveSnapshots.map((item) => ({ viewport: item.viewport, mapWidth: item.map?.width, rightAutoCollapsed: item.root?.rightAutoCollapsed, leftCompact: item.root?.leftCompact, pageOverflow: item.pageOverflow })), failures: responsiveFailures.length },
  { declaredMinimum: 560, desktopMapWidth: ">= 560", mobileMapWidth: "> 0", horizontalOverflow: 0 },
  responsiveFailures
);
audit.check(
  "NARROW_DESKTOP_SAFE_CASCADE",
  Boolean(narrowDesktop) && narrowDesktop.map?.width >= 559 && (narrowDesktop.root?.rightAutoCollapsed === "true" || narrowDesktop.root?.leftCompact === "true"),
  narrowDesktop,
  { viewport: 1100, mapWidth: ">= 560", rightAutoCollapsedOrLeftCompact: true }
);
audit.check("PRESET_HORIZONTAL_OVERFLOW", presetFailures.length === 0, presetFailures.length, 0, presetFailures);
audit.check("PRESET_KEYBOARD_ACCESS", presetFailures.length === 0 && (desktopInitial?.cards?.length || 0) >= 5, desktopInitial?.cards || [], ">= 5 focusable full-card buttons");
audit.check("MAP_RESIZE_CALL", /map\.resize\(\)/gu.test(source) && /onMapResize/gu.test(source), { mapResize: /map\.resize\(\)/gu.test(source), callback: /onMapResize/gu.test(source) }, { mapResize: true, callback: true });
audit.check("MOBILE_DRAWER_REGRESSION", responsiveSnapshots.filter((item) => item.viewport < 1100).every((item) => item.map?.width > 0 && item.pageOverflow <= 1), responsiveFailures, []);
audit.check("UNCAUGHT_RUNTIME_ERROR", (browser?.runtimeErrors?.length || 0) === 0, browser?.runtimeErrors || [], []);

finishAuditV129(audit, "map-layout-audit-v129.json", {
  panelResize: pointerPass && keyboardPass && persistencePass && resetPass ? "PASS" : "FAIL",
  leftPanelRange: "260..460 (default 320)",
  rightPanelRange: "300..520 (default 360)",
  mapMinimumWidth: 560,
  presetHorizontalOverflowCount: presetFailures.length,
  responsiveWidths: responsiveSnapshots.map((item) => item.viewport),
});
