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
import { mapUrlV135 } from "./v135/audit-helpers.mjs";
import { finishAuditV136, normalizeTextV136 } from "./v136/audit-helpers.mjs";

const audit = new AuditV125("map-list-ui:v136");
const VIEWPORTS = [390, 768, 1024, 1280, 1440, 1920];

function listSnapshotExpression() {
  return `(() => {
    const clean = (value) => String(value || '').normalize('NFC').replace(/\\s+/gu, ' ').trim();
    const root = document.querySelector('[data-testid="map-all-data-v135"]');
    const lists = [...(root?.querySelectorAll('ul') || [])];
    const items = [...document.querySelectorAll('[data-testid="map-all-data-layer-v135"]')];
    return {
      present: Boolean(root),
      itemCount: items.length,
      groupCount: (root?.querySelectorAll('[data-map-group-v135]') || []).length,
      nativeBullets: lists.filter((list) => {
        const style = getComputedStyle(list);
        return style.listStyleType !== 'none' || parseFloat(style.paddingLeft) > 4;
      }).length,
      items: items.map((node) => {
        const style = getComputedStyle(node);
        const rect = node.getBoundingClientRect();
        const strong = node.querySelector('strong');
        const span = node.querySelector('span');
        return {
          elementId: node.getAttribute('data-element-id') || '',
          title: clean(strong?.textContent),
          summary: clean(span?.textContent),
          appearance: style.appearance,
          background: style.backgroundColor,
          borderStyle: style.borderTopStyle,
          borderRadius: parseFloat(style.borderTopLeftRadius) || 0,
          textAlign: style.textAlign,
          height: Math.round(rect.height),
          width: Math.round(rect.width),
          strongDisplay: strong ? getComputedStyle(strong).display : '',
          spanDisplay: span ? getComputedStyle(span).display : '',
          active: node.getAttribute('aria-pressed') === 'true',
        };
      }),
      overflow: Math.max(document.documentElement.scrollWidth, document.body.scrollWidth) - window.innerWidth,
    };
  })()`;
}

let server = null;
let browser = null;
let runtimeFailure = null;
let desktop = null;
let activeState = null;
const responsive = [];
const brokenAssets = [];

try {
  if (!existsSync(resolve(PROJECT_ROOT, "build/index.html"))) {
    throw new Error("production build missing; run npm run build first");
  }
  server = await startStaticBuildServer(resolve(PROJECT_ROOT, "build"));
  browser = await launchHeadlessBrowser();
  await browser.cdp.send("Network.enable");
  browser.cdp.on("Network.responseReceived", ({ response }) => {
    if (response?.url?.startsWith(server.origin) && Number(response.status) >= 400) {
      brokenAssets.push({ url: response.url, status: response.status });
    }
  });

  await setViewport(browser.cdp, 1920, 1100);
  await navigate(browser.cdp, mapUrlV135(server.url));
  await waitForValue(
    browser.cdp,
    `document.querySelectorAll('[data-testid="map-all-data-layer-v135"]').length === 12`,
    { timeoutMs: 35_000 }
  );
  desktop = await evaluateValue(browser.cdp, listSnapshotExpression());

  // selecting a dataset has to be visible in the list, not only on the map
  await evaluateValue(
    browser.cdp,
    `(() => {
      const card = [...document.querySelectorAll('[data-testid="map-all-data-layer-v135"]')]
        .find((node) => node.getAttribute('data-element-id') === 'B-048');
      if (!(card instanceof HTMLElement)) return false;
      card.click();
      return true;
    })()`
  );
  await waitForValue(
    browser.cdp,
    `document.querySelector('[data-testid="map-public-content"]')?.getAttribute('data-primary-element') === 'B-048'`,
    { timeoutMs: 35_000 }
  );
  activeState = await evaluateValue(
    browser.cdp,
    `(() => {
      const node = [...document.querySelectorAll('[data-testid="map-all-data-layer-v135"]')]
        .find((item) => item.getAttribute('data-element-id') === 'B-048');
      const style = node ? getComputedStyle(node) : null;
      const marker = node?.querySelector('strong');
      return {
        pressed: node?.getAttribute('aria-pressed') === 'true',
        background: style?.backgroundColor || '',
        borderColor: style?.borderTopColor || '',
        markerContent: marker ? getComputedStyle(marker, '::before').content : '',
      };
    })()`
  );

  for (const width of VIEWPORTS) {
    await setViewport(browser.cdp, width, width < 800 ? 900 : 1050);
    await new Promise((resolveWait) => setTimeout(resolveWait, 200));
    const snapshot = await evaluateValue(browser.cdp, listSnapshotExpression());
    responsive.push({ width, ...snapshot });
  }
} catch (error) {
  runtimeFailure = error instanceof Error ? error.message : String(error);
} finally {
  if (browser) await browser.close();
  if (server) await server.close();
}

const items = desktop?.items || [];
// A native control is the browser's default push button: auto appearance, an
// outset/inset border, or centred label text inside the panel.
const nativeButtons = items.filter(
  (item) =>
    item.appearance !== "none" ||
    ["outset", "inset"].includes(item.borderStyle) ||
    item.textAlign === "center"
);
const duplicateTitles = items.filter((item) => {
  const title = normalizeTextV136(item.title);
  const summary = normalizeTextV136(item.summary);
  if (!title || !summary) return true;
  return summary.includes(title);
});
const runTogether = items.filter(
  (item) => item.strongDisplay === "inline" || item.spanDisplay === "inline"
);
const smallTargets = items.filter((item) => item.height < 44);
const overflowing = responsive.filter((row) => Number(row.overflow || 0) > 1);
const shortAtWidth = responsive.filter((row) => row.itemCount !== 12);

audit.check("MAP_DATA_ITEM_COUNT", desktop?.itemCount === 12, desktop?.itemCount ?? null, 12);
audit.check("MAP_DATA_GROUP_COUNT", (desktop?.groupCount || 0) >= 5, desktop?.groupCount ?? 0, ">=5");
audit.check("MAP_NATIVE_BULLET_COUNT", desktop?.nativeBullets === 0, desktop?.nativeBullets ?? null, 0);
audit.check("MAP_NATIVE_BUTTON_STYLE_COUNT", nativeButtons.length === 0, nativeButtons.map((item) => ({ elementId: item.elementId, appearance: item.appearance, borderStyle: item.borderStyle, textAlign: item.textAlign })), []);
audit.check("MAP_ITEM_DUPLICATE_TITLE_COUNT", duplicateTitles.length === 0, duplicateTitles.map((item) => ({ elementId: item.elementId, title: item.title, summary: item.summary })), []);
audit.check("MAP_ITEM_TITLE_SUMMARY_SEPARATED", runTogether.length === 0, runTogether.map((item) => item.elementId), []);
audit.check("MAP_ITEM_MINIMUM_TARGET", smallTargets.length === 0, smallTargets.map((item) => ({ elementId: item.elementId, height: item.height })), "all >= 44px");
audit.check("MAP_ITEM_ACTIVE_STATE", Boolean(activeState?.pressed) && Boolean(activeState?.markerContent) && activeState?.markerContent !== "none", activeState, "selected dataset is marked, not colour alone");
audit.check("MAP_LIST_RESPONSIVE_COVERAGE", responsive.length === VIEWPORTS.length && shortAtWidth.length === 0, { widths: responsive.map((row) => row.width), shortAtWidth: shortAtWidth.map((row) => row.width) }, VIEWPORTS);
audit.check("MAP_LIST_HORIZONTAL_OVERFLOW", overflowing.length === 0, overflowing.map((row) => ({ width: row.width, overflow: row.overflow })), []);
audit.check("BROKEN_ASSET", brokenAssets.length === 0, brokenAssets, []);
audit.check("CONSOLE_ERROR", (browser?.runtimeErrors || []).length === 0, browser?.runtimeErrors || [], []);
audit.check("MAP_LIST_RUNTIME", runtimeFailure === null, { runtimeFailure }, { runtimeFailure: null });

finishAuditV136(audit, "map-list-ui-audit-v136.json", {
  mapDataItemCount: desktop?.itemCount ?? 0,
  mapNativeBulletCount: desktop?.nativeBullets ?? null,
  mapNativeButtonStyleCount: nativeButtons.length,
  mapItemDuplicateTitleCount: duplicateTitles.length,
  items,
  activeState,
  responsive: responsive.map((row) => ({ width: row.width, itemCount: row.itemCount, overflow: row.overflow })),
  runtimeFailure,
});
