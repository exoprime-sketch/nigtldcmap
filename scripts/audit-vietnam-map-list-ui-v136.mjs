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
  mapLayerCountV138,
  mapTargetCountV138,
  mapUrlV135,
  revealMapDatasetExpressionV138,
} from "./v135/audit-helpers.mjs";
import { finishAuditV136, normalizeTextV136 } from "./v136/audit-helpers.mjs";

/**
 * The map dataset list, V138 form.
 *
 * One catalogue of every map target, folded into the seven categories, a
 * checkbox per dataset. The counts come from the data: the contract says how
 * many targets there are, the map index says how many of them have a layer.
 * A target without a layer must still be listed - disabled, with its reason -
 * so a reader never wonders where a dataset went.
 */
const audit = new AuditV125("map-list-ui:v136");
const VIEWPORTS = [390, 768, 1024, 1280, 1440, 1920];
const EXPECTED_LAYERS = mapLayerCountV138();
const EXPECTED_TARGETS = mapTargetCountV138();

function listSnapshotExpression() {
  return `(() => {
    const clean = (value) => String(value || '').normalize('NFC').replace(/\\s+/gu, ' ').trim();
    const root = document.querySelector('[data-testid="map-all-data-v135"]');
    const lists = [...(root?.querySelectorAll('ul') || [])];
    const rows = [...document.querySelectorAll('.cdp-map-catalog-v138__item[data-map-element]')];
    return {
      present: Boolean(root),
      itemCount: rows.length,
      availableCount: rows.filter((row) => row.getAttribute('data-map-available') === 'true').length,
      unavailable: rows.filter((row) => row.getAttribute('data-map-available') !== 'true').map((row) => row.getAttribute('data-map-element')),
      groupCount: (root?.querySelectorAll('[data-map-group-v135]') || []).length,
      groups: [...(root?.querySelectorAll('[data-map-group-v135]') || [])].map((group) => ({
        name: group.getAttribute('data-map-group-v135'),
        toggle: group.querySelector('[data-testid="map-catalog-group-toggle-v138"]')?.getAttribute('aria-expanded') || null,
        toggleHeight: Math.round(group.querySelector('[data-testid="map-catalog-group-toggle-v138"]')?.getBoundingClientRect().height || 0),
        count: group.querySelectorAll('.cdp-map-catalog-v138__item').length,
        countText: clean(group.querySelector('.cdp-map-catalog-v138__group-count')?.textContent),
      })),
      nativeBullets: lists.filter((list) => {
        const style = getComputedStyle(list);
        return style.listStyleType !== 'none';
      }).length,
      // The catalogue's own controls (group toggles, ⓘ, promote, visibility)
      // must be styled: a user-agent outset/inset border or the default
      // button face colour is the browser's push button, not the design.
      nativeButtons: [...(root?.querySelectorAll('button') || [])].filter((button) => {
        const rect = button.getBoundingClientRect();
        if (rect.width === 0 || rect.height === 0) return false;
        const style = getComputedStyle(button);
        return ['outset', 'inset'].includes(style.borderTopStyle) || style.backgroundColor === 'rgb(240, 240, 240)';
      }).map((button) => ({
        text: clean(button.textContent).slice(0, 40),
        borderStyle: getComputedStyle(button).borderTopStyle,
        background: getComputedStyle(button).backgroundColor,
      })),
      items: rows.map((row) => {
        const input = row.querySelector('[data-testid="map-all-data-layer-v135"]');
        const label = row.querySelector('.cdp-map-catalog-v138__label');
        const strong = label?.querySelector('strong');
        const small = label?.querySelector('small');
        const rect = label ? label.getBoundingClientRect() : row.getBoundingClientRect();
        const visible = rect.width > 0 && rect.height > 0;
        return {
          elementId: row.getAttribute('data-map-element') || '',
          available: row.getAttribute('data-map-available') === 'true',
          checkbox: input instanceof HTMLInputElement && input.type === 'checkbox',
          checked: input instanceof HTMLInputElement ? input.checked : null,
          disabled: input instanceof HTMLInputElement ? input.disabled : null,
          labelledBy: input?.id && label?.getAttribute('for') === input.id,
          title: clean(strong?.textContent),
          summary: clean(small?.textContent),
          strongDisplay: strong ? getComputedStyle(strong).display : '',
          smallDisplay: small ? getComputedStyle(small).display : '',
          visible,
          height: Math.round(rect.height),
          role: row.getAttribute('data-map-layer-role') || '',
          badge: clean(row.querySelector('.cdp-layer-role-badge')?.textContent),
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
let foldState = null;
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
    `document.querySelectorAll('[data-testid="map-all-data-layer-v135"]').length === ${EXPECTED_TARGETS}`,
    { timeoutMs: 35_000 }
  );
  // The rows come from the static contract; availability arrives with the index.
  await waitForValue(
    browser.cdp,
    `document.querySelectorAll('.cdp-map-catalog-v138__item[data-map-available="true"]').length === ${EXPECTED_LAYERS}`,
    { timeoutMs: 35_000 }
  );
  // Unfold everything so every row can be measured.
  await evaluateValue(
    browser.cdp,
    `(() => { [...document.querySelectorAll('[data-testid="map-catalog-group-toggle-v138"]')].forEach((toggle) => { if (toggle.getAttribute('aria-expanded') !== 'true') toggle.click(); }); return true; })()`
  );
  desktop = await evaluateValue(browser.cdp, listSnapshotExpression());

  // Ticking a dataset has to show in the list, not only on the map: the box
  // checked, the row marked as the colour map, the category counting it.
  await evaluateValue(browser.cdp, revealMapDatasetExpressionV138("B-048"));
  await evaluateValue(
    browser.cdp,
    `(() => {
      const input = document.querySelector('[data-testid="map-all-data-layer-v135"][data-element-id="B-048"]');
      if (!(input instanceof HTMLElement)) return false;
      input.click();
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
      const row = document.querySelector('.cdp-map-catalog-v138__item[data-map-element="B-048"]');
      const input = row?.querySelector('[data-testid="map-all-data-layer-v135"]');
      const group = row?.closest('[data-map-group-v135]');
      return {
        checked: input instanceof HTMLInputElement ? input.checked : null,
        role: row?.getAttribute('data-map-layer-role') || '',
        badge: String(row?.querySelector('.cdp-layer-role-badge')?.textContent || '').trim(),
        groupCountText: String(group?.querySelector('.cdp-map-catalog-v138__group-count')?.textContent || '').trim(),
        catalogStatus: String(document.querySelector('[data-testid="map-catalog-status-v138"]')?.textContent || '').trim(),
      };
    })()`
  );

  // Folding a category hides its rows and keeps the selection. React commits
  // the fold on the next frame, so each read waits for the attribute.
  const groupToggleExpression = `document.querySelector('.cdp-map-catalog-v138__item[data-map-element="B-048"]')?.closest('[data-map-group-v135]')?.querySelector('[data-testid="map-catalog-group-toggle-v138"]')`;
  await evaluateValue(browser.cdp, `(() => { ${groupToggleExpression}?.click(); return true; })()`);
  await waitForValue(browser.cdp, `${groupToggleExpression}?.getAttribute('aria-expanded') === 'false'`, { timeoutMs: 10_000 });
  foldState = await evaluateValue(
    browser.cdp,
    `(() => {
      const toggle = ${groupToggleExpression};
      const group = toggle?.closest('[data-map-group-v135]');
      const list = group?.querySelector('ul');
      const root = document.querySelector('[data-testid="map-public-content"]');
      return {
        expandedAfterFold: toggle?.getAttribute('aria-expanded'),
        listHidden: list ? list.hidden === true : null,
        primaryAfterFold: root?.getAttribute('data-primary-element') || '',
      };
    })()`
  );
  await evaluateValue(browser.cdp, `(() => { ${groupToggleExpression}?.click(); return true; })()`);
  await waitForValue(browser.cdp, `${groupToggleExpression}?.getAttribute('aria-expanded') === 'true'`, { timeoutMs: 10_000 });
  foldState.expandedAfterUnfold = await evaluateValue(browser.cdp, `${groupToggleExpression}?.getAttribute('aria-expanded')`);

  for (const width of VIEWPORTS) {
    await setViewport(browser.cdp, width, width < 800 ? 900 : 1050);
    await new Promise((resolveWait) => setTimeout(resolveWait, 200));
    await evaluateValue(
      browser.cdp,
      `(() => {
        const drawer = document.querySelector('[data-testid="map-layer-panel"] .cdp-map-panel-toggle');
        if (drawer && drawer.getAttribute('aria-expanded') === 'false') drawer.click();
        [...document.querySelectorAll('[data-testid="map-catalog-group-toggle-v138"]')].forEach((toggle) => { if (toggle.getAttribute('aria-expanded') !== 'true') toggle.click(); });
        return true;
      })()`
    );
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
const availableItems = items.filter((item) => item.available);
const duplicateTitles = availableItems.filter((item) => {
  const title = normalizeTextV136(item.title);
  const summary = normalizeTextV136(item.summary);
  if (!title || !summary) return true;
  return summary.includes(title);
});
const runTogether = items.filter(
  (item) => item.strongDisplay === "inline" || item.smallDisplay === "inline"
);
const notCheckboxes = items.filter((item) => !item.checkbox || !item.labelledBy);
const unavailableStillEnabled = items.filter((item) => !item.available && item.disabled !== true);
const smallGroupToggles = (desktop?.groups || []).filter((group) => group.toggleHeight < 44);
const smallTargets = availableItems.filter((item) => item.visible && item.height < 24);
const overflowing = responsive.filter((row) => Number(row.overflow || 0) > 1);
const shortAtWidth = responsive.filter((row) => row.itemCount !== EXPECTED_TARGETS);
const groupCountsMatch = (desktop?.groups || []).every(
  (group) => new RegExp(`^${group.count}개`).test(group.countText)
);

audit.check("MAP_DATA_ITEM_COUNT", desktop?.itemCount === EXPECTED_TARGETS, desktop?.itemCount ?? null, EXPECTED_TARGETS);
audit.check("MAP_DATA_AVAILABLE_COUNT", desktop?.availableCount === EXPECTED_LAYERS, { available: desktop?.availableCount ?? null, unavailable: desktop?.unavailable || [] }, EXPECTED_LAYERS);
audit.check("MAP_DATA_GROUP_COUNT", (desktop?.groupCount || 0) === 7, desktop?.groupCount ?? 0, 7);
audit.check("MAP_GROUP_COUNT_LABELS", groupCountsMatch, desktop?.groups || [], "each category header states its own row count");
audit.check("MAP_NATIVE_BULLET_COUNT", desktop?.nativeBullets === 0, desktop?.nativeBullets ?? null, 0);
audit.check("MAP_NATIVE_BUTTON_STYLE_COUNT", Array.isArray(desktop?.nativeButtons) && desktop.nativeButtons.length === 0, desktop?.nativeButtons ?? null, []);
audit.check("MAP_ITEM_CHECKBOX_CONTROL", notCheckboxes.length === 0, notCheckboxes.map((item) => item.elementId), "every row is a labelled checkbox");
audit.check("MAP_UNAVAILABLE_ROWS_DISABLED", unavailableStillEnabled.length === 0, unavailableStillEnabled.map((item) => item.elementId), []);
audit.check("MAP_ITEM_DUPLICATE_TITLE_COUNT", duplicateTitles.length === 0, duplicateTitles.map((item) => ({ elementId: item.elementId, title: item.title, summary: item.summary })), []);
audit.check("MAP_ITEM_TITLE_SUMMARY_SEPARATED", runTogether.length === 0, runTogether.map((item) => item.elementId), []);
audit.check("MAP_GROUP_TOGGLE_MINIMUM_TARGET", smallGroupToggles.length === 0, smallGroupToggles.map((group) => ({ name: group.name, height: group.toggleHeight })), "all >= 44px");
audit.check("MAP_ITEM_MINIMUM_TARGET", smallTargets.length === 0, smallTargets.map((item) => ({ elementId: item.elementId, height: item.height })), "label >= 24px");
audit.check(
  "MAP_ITEM_ACTIVE_STATE",
  activeState?.checked === true && activeState?.role === "primary" && /분석 기준/u.test(activeState?.badge || "") && /선택 1/u.test(activeState?.groupCountText || ""),
  activeState,
  "selected dataset is checked, marked as the analysis, and counted in its category"
);
audit.check(
  "MAP_GROUP_FOLD_KEEPS_SELECTION",
  foldState?.expandedAfterFold === "false" && foldState?.listHidden === true && foldState?.primaryAfterFold === "B-048" && foldState?.expandedAfterUnfold === "true",
  foldState,
  "folding hides rows and keeps the selection"
);
audit.check("MAP_LIST_RESPONSIVE_COVERAGE", responsive.length === VIEWPORTS.length && shortAtWidth.length === 0, { widths: responsive.map((row) => row.width), shortAtWidth: shortAtWidth.map((row) => row.width) }, VIEWPORTS);
audit.check("MAP_LIST_HORIZONTAL_OVERFLOW", overflowing.length === 0, overflowing.map((row) => ({ width: row.width, overflow: row.overflow })), []);
audit.check("BROKEN_ASSET", brokenAssets.length === 0, brokenAssets, []);
audit.check("CONSOLE_ERROR", (browser?.runtimeErrors || []).length === 0, browser?.runtimeErrors || [], []);
audit.check("MAP_LIST_RUNTIME", runtimeFailure === null, { runtimeFailure }, { runtimeFailure: null });

finishAuditV136(audit, "map-list-ui-audit-v136.json", {
  expectedLayers: EXPECTED_LAYERS,
  expectedTargets: EXPECTED_TARGETS,
  mapDataItemCount: desktop?.itemCount ?? 0,
  mapDataAvailableCount: desktop?.availableCount ?? 0,
  mapNativeBulletCount: desktop?.nativeBullets ?? null,
  mapNativeButtonStyleCount: Array.isArray(desktop?.nativeButtons) ? desktop.nativeButtons.length : null,
  mapItemDuplicateTitleCount: duplicateTitles.length,
  groups: desktop?.groups || [],
  items,
  activeState,
  foldState,
  responsive: responsive.map((row) => ({ width: row.width, itemCount: row.itemCount, overflow: row.overflow })),
  runtimeFailure,
});
