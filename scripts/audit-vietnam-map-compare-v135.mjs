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
import { finishAuditV135, mapUrlV135 } from "./v135/audit-helpers.mjs";

const audit = new AuditV125("map-compare:v135");
const mapSource = readFileSync(resolve(PROJECT_ROOT, "src/pages/RealMapExplorerPage.tsx"), "utf8");
const pairs = [
  { name: "finance", a: "D-018", b: "C-025" },
  { name: "vulnerability-budget", a: "B-021", b: "D-008" },
  { name: "forest", a: "B-033", b: "B-034" },
];

async function openCompare(cdp) {
  const opened = await evaluateValue(
    cdp,
    `(() => {
      const direct = document.querySelector('[data-testid="map-compare-open-v135"]');
      const button = direct || [...document.querySelectorAll('button, a')]
        .find((node) => /비교해서\\s*보기|비교\\s*지도|두\\s*데이터\\s*비교/u.test(String(node.textContent || '')));
      if (!(button instanceof HTMLElement)) return false;
      button.click(); return true;
    })()`
  );
  if (!opened) throw new Error("map comparison entry action unavailable");
  await waitForValue(cdp, `Boolean(document.querySelector('[data-testid="map-comparison-workspace-v135"]'))`, { timeoutMs: 35_000 });
  await waitForValue(
    cdp,
    `(document.querySelector('[data-testid="map-compare-pane-a"] select')?.options?.length || 0) >= 12`,
    { timeoutMs: 35_000 }
  );
}

async function selectPair(cdp, a, b) {
  return evaluateValue(
    cdp,
    `(() => {
      const workspace = document.querySelector('[data-testid="map-comparison-workspace-v135"]');
      if (!workspace) return { changed: false, reason: 'workspace missing' };
      const setSelect = (paneId, value) => {
        const pane = workspace.querySelector('[data-testid="' + paneId + '"]');
        const selects = [...workspace.querySelectorAll('select')];
        const select = pane?.querySelector('select') || selects.find((node) => [...node.options].some((option) => option.value === value));
        if (!(select instanceof HTMLSelectElement) || ![...select.options].some((option) => option.value === value)) return false;
        select.value = value;
        select.dispatchEvent(new Event('change', { bubbles: true }));
        return true;
      };
      const clickChoice = (paneId, value) => {
        const pane = workspace.querySelector('[data-testid="' + paneId + '"]');
        const choice = [...(pane?.querySelectorAll('[data-element-id], [data-map-element]') || [])]
          .find((node) => (node.getAttribute('data-element-id') || node.getAttribute('data-map-element')) === value);
        if (!(choice instanceof HTMLElement)) return false;
        choice.click(); return true;
      };
      const changedA = setSelect('map-compare-pane-a', ${JSON.stringify(a)}) || clickChoice('map-compare-pane-a', ${JSON.stringify(a)});
      const changedB = setSelect('map-compare-pane-b', ${JSON.stringify(b)}) || clickChoice('map-compare-pane-b', ${JSON.stringify(b)});
      return { changed: changedA && changedB, changedA, changedB };
    })()`
  );
}

function compareSnapshotExpression() {
  return `(() => {
    const workspace = document.querySelector('[data-testid="map-comparison-workspace-v135"]');
    const a = workspace?.querySelector('[data-testid="map-compare-pane-a"]');
    const b = workspace?.querySelector('[data-testid="map-compare-pane-b"]');
    const box = (node) => {
      const rect = node?.getBoundingClientRect();
      return rect ? { left: rect.left, right: rect.right, top: rect.top, bottom: rect.bottom, width: rect.width, height: rect.height } : null;
    };
    const pane = (node) => ({
      box: box(node),
      elementId: node?.getAttribute('data-element-id') || node?.getAttribute('data-map-element') || node?.getAttribute('data-selected-element') || '',
      legendCount: node?.querySelectorAll('[data-testid*="legend"], .cdp-map-legend, [data-map-legend]').length || 0,
      selectorCount: node?.querySelectorAll('select, [role="listbox"], [data-map-selector]').length || 0,
      viewBox: node?.querySelector('svg')?.getAttribute('viewBox') || '',
      text: String(node?.textContent || '').normalize('NFC').replace(/\\s+/gu, ' ').trim(),
    });
    return {
      present: Boolean(workspace),
      mode: workspace?.getAttribute('data-layout-mode') || '',
      synchronized: workspace?.getAttribute('data-synchronized') || '',
      a: pane(a),
      b: pane(b),
      url: location.href,
      pageOverflow: Math.max(document.documentElement.scrollWidth, document.body.scrollWidth) - innerWidth,
      backAction: [...document.querySelectorAll('button, a')].some((node) => /일반\\s*지도|비교\\s*종료/u.test(String(node.textContent || ''))),
    };
  })()`;
}

let server = null;
let browser = null;
let runtimeFailure = null;
const pairResults = [];
let desktop = null;
let mobile = null;
let restored = null;
const brokenAssets = [];
try {
  if (!existsSync(resolve(PROJECT_ROOT, "build/index.html"))) {
    throw new Error("production build missing; run npm run build before comparison audit");
  }
  server = await startStaticBuildServer(resolve(PROJECT_ROOT, "build"));
  browser = await launchHeadlessBrowser();
  await setViewport(browser.cdp, 1440, 1000);
  await browser.cdp.send("Network.enable");
  browser.cdp.on("Network.responseReceived", ({ response }) => {
    if (response?.url?.startsWith(server.origin) && Number(response.status) >= 400) {
      brokenAssets.push({ url: response.url, status: response.status });
    }
  });
  await navigate(browser.cdp, mapUrlV135(server.url));
  await waitForValue(browser.cdp, `Boolean(document.querySelector('[data-testid="map-public-content"]'))`, { timeoutMs: 35_000 });
  await openCompare(browser.cdp);
  for (const pair of pairs) {
    const selection = await selectPair(browser.cdp, pair.a, pair.b);
    await new Promise((resolveWait) => setTimeout(resolveWait, 350));
    const snapshot = await evaluateValue(browser.cdp, compareSnapshotExpression());
    pairResults.push({ ...pair, selection, snapshot });
  }
  desktop = pairResults[0]?.snapshot || await evaluateValue(browser.cdp, compareSnapshotExpression());
  const savedUrl = desktop?.url || mapUrlV135(server.url);
  await navigate(browser.cdp, savedUrl);
  await waitForValue(browser.cdp, `Boolean(document.querySelector('[data-testid="map-comparison-workspace-v135"]'))`, { timeoutMs: 35_000 });
  restored = await evaluateValue(browser.cdp, compareSnapshotExpression());
  await setViewport(browser.cdp, 390, 844);
  await new Promise((resolveWait) => setTimeout(resolveWait, 180));
  mobile = await evaluateValue(browser.cdp, compareSnapshotExpression());
} catch (error) {
  runtimeFailure = error instanceof Error ? error.message : String(error);
} finally {
  if (browser) await browser.close();
  if (server) await server.close();
}

const desktopSideBySide = Boolean(
  desktop?.a?.box && desktop?.b?.box &&
  desktop.a.box.width >= 300 && desktop.b.box.width >= 300 &&
  desktop.a.box.right <= desktop.b.box.left + 2 &&
  Math.abs(desktop.a.box.top - desktop.b.box.top) <= 8
);
const mobileStacked = Boolean(
  mobile?.a?.box && mobile?.b?.box &&
  mobile.a.box.width >= 300 && mobile.b.box.width >= 300 &&
  mobile.a.box.bottom <= mobile.b.box.top + 4 &&
  Number(mobile.pageOverflow || 0) <= 1
);
const independentLegends = pairResults.every(
  (row) => Number(row.snapshot?.a?.legendCount || 0) >= 1 && Number(row.snapshot?.b?.legendCount || 0) >= 1
);
const pairCoverage = pairResults.filter((row) => row.selection?.changed && row.snapshot?.present).length;
const urlRestoration = Boolean(restored?.present && restored?.a?.box && restored?.b?.box && /compare/iu.test(restored?.url || ""));
const runtimeSyncEvidence = Boolean(
  desktop?.synchronized === "true" ||
  (desktop?.a?.viewBox && desktop?.a?.viewBox === desktop?.b?.viewBox)
);
const sourceSyncContract = /sync(?:hronized|hronize|Compare|Viewport)|동기/iu.test(mapSource) && /map-compare-pane-a/u.test(mapSource) && /map-compare-pane-b/u.test(mapSource);

audit.check("COMPARE_RUNTIME", runtimeFailure === null && Boolean(desktop?.present), { runtimeFailure, present: desktop?.present || false }, { present: true });
audit.check("COMPARE_PAIR_COVERAGE", pairCoverage === pairs.length, pairResults.map((row) => ({ name: row.name, selection: row.selection, present: row.snapshot?.present })), pairs.length);
audit.check("COMPARE_SIDE_BY_SIDE_DESKTOP", desktopSideBySide, desktop, "two non-overlapping horizontal panes");
audit.check("COMPARE_STACKED_MOBILE", mobileStacked, mobile, "two stacked panes without overflow");
audit.check("COMPARE_INDEPENDENT_LEGENDS", independentLegends, pairResults.map((row) => ({ name: row.name, a: row.snapshot?.a?.legendCount, b: row.snapshot?.b?.legendCount })), "both panes have legends");
audit.check("COMPARE_SYNCHRONIZED_VIEW", runtimeSyncEvidence && sourceSyncContract, { runtimeSyncEvidence, sourceSyncContract }, true);
audit.check("COMPARE_URL_RESTORATION", urlRestoration, restored, true);
audit.check("COMPARE_NORMAL_MAP_RETURN", desktop?.backAction === true, desktop?.backAction ?? false, true);
audit.check("COMPARE_RUNTIME_ERROR_COUNT", (browser?.runtimeErrors || []).length === 0, browser?.runtimeErrors || [], []);
audit.check("BROKEN_ASSET", brokenAssets.length === 0, brokenAssets, []);

finishAuditV135(audit, "map-compare-audit-v135.json", {
  pairResults,
  compareSideBySideDesktop: desktopSideBySide,
  compareStackedMobile: mobileStacked,
  compareUrlRestoration: urlRestoration,
  compareRuntimeErrorCount: (browser?.runtimeErrors || []).length,
  runtimeFailure,
});
