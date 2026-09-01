#!/usr/bin/env node

import { resolve } from "node:path";
import {
  AuditV125,
  PROJECT_ROOT,
  readJson,
} from "./v125/audit-utils.mjs";
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
  mapUrlV129,
} from "./v129/audit-helpers.mjs";

const audit = new AuditV125("final-screens:v129");
const widths = [390, 768, 1024, 1280, 1440, 1920];
const forbiddenVisibleTokens = [
  "V124",
  "V125",
  "V126",
  "V127",
  "V128",
  "V129",
  "semantic",
  "renderer",
  "recordId",
  "indicatorId",
  "sourceSheet",
  "sourceRow",
  "MultiLineString",
  "MapLibre",
  "publicationDecision",
  "downloadEligible",
];
const routes = [
  { name: "home", url: (base) => `${base}/#home`, selector: "[data-v128-home]" },
  { name: "finder", url: (base) => `${base}/?country=VNM#explorer`, selector: ".cdp-card-grid" },
  { name: "A-002", url: (base) => detailUrlV129(base, "A-002"), selector: "[data-testid='a002-cpia-analysis']" },
  { name: "B-021", url: (base) => detailUrlV129(base, "B-021"), selector: "[data-testid='public-analysis-root']" },
  { name: "D-005", url: (base) => detailUrlV129(base, "D-005"), selector: "[data-testid='d005-specialized-renderer']" },
  { name: "E-012", url: (base) => detailUrlV129(base, "E-012"), selector: "[data-testid='e012-semantic-preview']" },
  { name: "map-empty", url: (base) => mapUrlV129(base, { layers: "none", contextLayers: "none" }), selector: "[data-testid='map-public-content']" },
  { name: "download", url: (base) => `${base}/?country=VNM#download`, selector: ".cdp-download-list" },
  { name: "guide", url: (base) => `${base}/#guide`, selector: "[data-v128-guide]" },
  { name: "not-found", url: (base) => `${base}/#not-a-public-route-v129`, selector: "[data-v128-not-found]" },
];
const presets = [
  { id: "POWER_INFRASTRUCTURE", primary: "A-024", context: ["A-023"] },
  { id: "RENEWABLE_PLANNING", primary: "C-016", context: ["A-024", "A-023"] },
  { id: "FOREST_CHANGE", primary: "B-033", context: ["B-031", "B-034"] },
  { id: "CLIMATE_VULNERABILITY", primary: "B-021", context: ["D-008", "D-018"] },
  { id: "CLIMATE_FINANCE_PROJECTS", primary: "D-023", context: ["C-025", "D-018"] },
];

function normalize(value) {
  return String(value ?? "").normalize("NFC").replace(/\s+/gu, " ").trim();
}

function screenSnapshotExpression(routeName) {
  return `(() => {
    const main = document.querySelector('main');
    const visible = (node) => {
      if (!node) return false;
      const style = getComputedStyle(node);
      const box = node.getBoundingClientRect();
      return style.display !== 'none' && style.visibility !== 'hidden' &&
        Number(style.opacity || 1) > 0 && box.width > 0 && box.height > 0;
    };
    const text = String(main?.innerText || '').normalize('NFC');
    const lower = text.toLocaleLowerCase('en-US');
    const forbidden = ${JSON.stringify(forbiddenVisibleTokens)}.filter((token) =>
      lower.includes(token.toLocaleLowerCase('en-US'))
    );
    const controls = [...(main?.querySelectorAll('button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled])') || [])].filter(visible);
    const unnamed = controls.filter((node) => {
      const id = node.getAttribute('id');
      const explicit = id ? document.querySelector('label[for="' + CSS.escape(id) + '"]') : null;
      return !String(node.getAttribute('aria-label') || node.getAttribute('aria-labelledby') ||
        explicit?.textContent || node.closest('label')?.textContent || node.textContent ||
        node.getAttribute('title') || node.getAttribute('placeholder') || '').trim();
    });
    const mapCanvas = document.querySelector('.cdp-map-canvas.is-visible canvas');
    const mapFallback = document.querySelector('.cdp-map-fallback__svg');
    const mapVisible = visible(mapCanvas) || visible(mapFallback);
    return {
      route: ${JSON.stringify(routeName)},
      title: document.querySelector('h1')?.textContent?.replace(/\\s+/gu, ' ').trim() || '',
      h1Count: main?.querySelectorAll('h1').length || 0,
      overflow: Math.max(document.documentElement.scrollWidth, document.body.scrollWidth) - innerWidth,
      forbidden,
      alert: document.querySelector('[role="alert"]')?.textContent?.replace(/\\s+/gu, ' ').trim() || null,
      unnamedControls: unnamed.length,
      controlCount: controls.length,
      homeCanonical: ${JSON.stringify(routeName)} !== 'home' || (
        document.querySelector('[data-v128-home] h1')?.textContent?.trim() === '개도국 기후기술 협력 플랫폼' &&
        /현재\\s*제공\\s*국가\\s*[·ㆍ]?\\s*베트남/u.test(text) &&
        !/베트남\\s*파일럿/u.test(document.querySelector('[data-v128-home] h1')?.textContent || '')
      ),
      mapVisible: ${JSON.stringify(routeName)} !== 'map-empty' || mapVisible,
      mapPrimary: document.querySelector('[data-testid="map-public-content"]')?.getAttribute('data-primary-element') || null,
      a002: ${JSON.stringify(routeName)} !== 'A-002' || Boolean(document.querySelector('[data-testid="a002-cpia-trend"]')),
      b021: ${JSON.stringify(routeName)} !== 'B-021' || Boolean(document.querySelector('[data-testid="public-indicator-meaning-v129"]')),
      d005: ${JSON.stringify(routeName)} !== 'D-005' || Boolean(document.querySelector('[data-testid="d005-specialized-renderer"]')),
      e012: ${JSON.stringify(routeName)} !== 'E-012' || Boolean(document.querySelector('[data-testid="e012-semantic-preview"]')),
    };
  })()`;
}

let server = null;
let browser = null;
let runtimeFailure = null;
const screenFailures = [];
const screenResults = [];
const networkFailures = [];
const presetFailures = [];
const presetResults = [];
let b021Gvi = null;
let b021Component = null;

try {
  server = await startStaticBuildServer(resolve(PROJECT_ROOT, "build"));
  browser = await launchHeadlessBrowser();
  await browser.cdp.send("Network.enable");
  browser.cdp.on("Network.responseReceived", (params) => {
    const response = params.response || {};
    const url = String(response.url || "");
    if (!/\.(?:json|geojson)(?:[?#]|$)/iu.test(url)) return;
    const contentType = String(response.mimeType || response.headers?.["content-type"] || "");
    if (Number(response.status) !== 200 || /text\/html/iu.test(contentType)) {
      networkFailures.push({ url, status: response.status, contentType });
    }
  });

  for (const width of widths) {
    await setViewport(browser.cdp, width, width <= 390 ? 1000 : 1100);
    for (const route of routes) {
      try {
        await navigate(browser.cdp, route.url(server.url));
        await waitForValue(
          browser.cdp,
          `Boolean(document.querySelector(${JSON.stringify(route.selector)}))`,
          { timeoutMs: route.name === "map-empty" ? 35_000 : 25_000 }
        );
        if (["A-002", "B-021", "D-005", "E-012"].includes(route.name)) {
          await waitForValue(
            browser.cdp,
            `document.querySelector('[data-testid="public-analysis-root"]')?.getAttribute('data-analysis-state') === 'ready'`,
            { timeoutMs: 25_000 }
          );
        }
        if (route.name === "map-empty") {
          await waitForValue(
            browser.cdp,
            `(() => {
              const canvas = document.querySelector('.cdp-map-canvas.is-visible canvas');
              const fallback = document.querySelector('.cdp-map-fallback__svg');
              return Boolean(canvas || fallback);
            })()`,
            { timeoutMs: 35_000 }
          );
        }
        const snapshot = await evaluateValue(
          browser.cdp,
          screenSnapshotExpression(route.name)
        );
        screenResults.push({ width, ...snapshot });
        const passed =
          Number(snapshot?.overflow || 0) <= 1 &&
          (snapshot?.forbidden || []).length === 0 &&
          snapshot?.alert === null &&
          snapshot?.h1Count === 1 &&
          snapshot?.unnamedControls === 0 &&
          snapshot?.homeCanonical === true &&
          snapshot?.mapVisible === true &&
          (route.name !== "map-empty" || snapshot?.mapPrimary === "none") &&
          snapshot?.a002 === true &&
          snapshot?.b021 === true &&
          snapshot?.d005 === true &&
          snapshot?.e012 === true;
        if (!passed) screenFailures.push({ width, route: route.name, snapshot });
      } catch (error) {
        screenFailures.push({
          width,
          route: route.name,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }
  }

  await setViewport(browser.cdp, 1440, 1100);
  await navigate(browser.cdp, mapUrlV129(server.url, { layers: "none", contextLayers: "none" }));
  await waitForValue(browser.cdp, `Boolean(document.querySelector('[data-testid="map-public-content"]'))`, { timeoutMs: 35_000 });
  for (const preset of presets) {
    const clicked = await evaluateValue(
      browser.cdp,
      `(() => {
        const card = document.querySelector('[data-testid="map-analysis-preset"][data-preset-id=${JSON.stringify(preset.id)}]');
        if (!(card instanceof HTMLElement)) return false;
        card.click();
        return true;
      })()`
    );
    if (!clicked) {
      presetFailures.push({ id: preset.id, error: "preset card unavailable" });
      continue;
    }
    try {
      await waitForValue(
        browser.cdp,
        `(() => {
          const root = document.querySelector('[data-testid="map-public-content"]');
          return root?.getAttribute('data-primary-element') === ${JSON.stringify(preset.primary)} &&
            root?.getAttribute('data-context-elements') === ${JSON.stringify(preset.context.join(","))} &&
            document.querySelectorAll('[data-testid="map-active-layer-legend-item"]').length === ${1 + preset.context.length};
        })()`,
        { timeoutMs: 40_000 }
      );
      const result = await evaluateValue(
        browser.cdp,
        `(() => {
          const root = document.querySelector('[data-testid="map-public-content"]');
          const list = document.querySelector('.cdp-map-presets');
          const current = document.querySelector('[data-testid="map-current-analysis"]');
          const legendItems = [...document.querySelectorAll('[data-testid="map-active-layer-legend-item"]')];
          return {
            id: root?.getAttribute('data-map-preset'),
            primary: root?.getAttribute('data-primary-element'),
            context: root?.getAttribute('data-context-elements'),
            legendCount: legendItems.length,
            legendComplete: legendItems.every((node) =>
              node.getAttribute('data-layer-role') && node.getAttribute('data-symbol-shape') &&
              node.getAttribute('data-variable') && node.getAttribute('data-unit') &&
              String(node.textContent || '').trim()
            ),
            overflow: list ? list.scrollWidth - list.clientWidth : null,
            currentText: current?.textContent?.replace(/\\s+/gu, ' ').trim() || '',
          };
        })()`
      );
      presetResults.push(result);
      if (
        result?.id !== preset.id ||
        result?.primary !== preset.primary ||
        result?.context !== preset.context.join(",") ||
        result?.legendCount !== 1 + preset.context.length ||
        result?.legendComplete !== true ||
        Number(result?.overflow || 0) > 1 ||
        !result?.currentText
      ) {
        presetFailures.push({ id: preset.id, result });
      }
    } catch (error) {
      presetFailures.push({
        id: preset.id,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  await evaluateValue(
    browser.cdp,
    `document.querySelector('[data-testid="map-analysis-preset"][data-preset-id="CLIMATE_VULNERABILITY"]')?.click()`
  );
  await waitForValue(
    browser.cdp,
    `document.querySelector('[data-testid="map-public-content"]')?.getAttribute('data-primary-element') === 'B-021'`,
    { timeoutMs: 40_000 }
  );
  b021Gvi = await evaluateValue(
    browser.cdp,
    `(() => {
      const current = document.querySelector('[data-testid="map-current-analysis"]');
      const meaning = document.querySelector('[data-testid="map-indicator-meaning-v129"]');
      const text = [current?.textContent, meaning?.textContent].join(' ').replace(/\\s+/gu, ' ').trim();
      return { text, label: /GVI\\s*취약성\\s*지수/u.test(text), unit: /0\\s*[–~-]\\s*100/u.test(text), direction: /높을수록[^.]{0,30}취약/u.test(text), region: /6개\\s*권역/u.test(text) };
    })()`
  );
  const componentChanged = await evaluateValue(
    browser.cdp,
    `(() => {
      const select = document.querySelector('[data-testid="map-layer-variable-select"]');
      if (!(select instanceof HTMLSelectElement)) return false;
      select.value = 'b9e9fdabb2df';
      select.dispatchEvent(new Event('change', { bubbles: true }));
      return select.value === 'b9e9fdabb2df';
    })()`
  );
  if (componentChanged) {
    await waitForValue(
      browser.cdp,
      `(() => {
        const text = document.querySelector('[data-testid="map-current-analysis"]')?.textContent || '';
        return /상수도\\s*보급\\s*가구\\s*비율/u.test(text) && text.includes('%');
      })()`,
      { timeoutMs: 25_000 }
    );
  }
  b021Component = await evaluateValue(
    browser.cdp,
    `(() => {
      const current = document.querySelector('[data-testid="map-current-analysis"]');
      const meaning = document.querySelector('[data-testid="map-indicator-meaning-v129"]');
      const text = [current?.textContent, meaning?.textContent].join(' ').replace(/\\s+/gu, ' ').trim();
      return { changed: ${JSON.stringify(Boolean(componentChanged))}, text, label: /상수도\\s*보급\\s*가구\\s*비율/u.test(text), unit: text.includes('%'), direction: /높을수록[^.]{0,30}(좋|높|양호)/u.test(text), region: /6개\\s*권역/u.test(text) };
    })()`
  );
} catch (error) {
  runtimeFailure = error instanceof Error ? error.message : String(error);
} finally {
  if (browser) await browser.close();
  if (server) await server.close();
}

const mapInteractionReport = readJson(
  resolve(PROJECT_ROOT, "reports/v129/map-interaction-audit-v129.json")
);
const mapSummary = mapInteractionReport.value?.summary || {};
const contextSelectionPass =
  mapInteractionReport.error === null &&
  mapSummary.status === "PASS" &&
  String(mapSummary.mapTooltipCoverage || "").startsWith("13/13") &&
  String(mapSummary.mapClickDetailCoverage || "").startsWith("13/13") &&
  mapSummary.contextLayerSelection === "PASS";
const b021Pass =
  b021Gvi?.label === true &&
  b021Gvi?.unit === true &&
  b021Gvi?.direction === true &&
  b021Gvi?.region === true &&
  b021Component?.changed === true &&
  b021Component?.label === true &&
  b021Component?.unit === true &&
  b021Component?.direction === true &&
  b021Component?.region === true;

audit.check("REQUIRED_SCREEN_WIDTH_MATRIX", runtimeFailure === null && screenResults.length === widths.length * routes.length && screenFailures.length === 0, { inspected: screenResults.length, failures: screenFailures.length, runtimeFailure }, { inspected: 60, failures: 0, runtimeFailure: null }, screenFailures);
audit.check("HORIZONTAL_OVERFLOW", screenResults.every((item) => Number(item.overflow || 0) <= 1), screenResults.filter((item) => Number(item.overflow || 0) > 1), []);
audit.check("HOME_CANONICAL_TITLE", screenResults.filter((item) => item.route === "home").every((item) => item.homeCanonical), screenResults.filter((item) => item.route === "home").map((item) => ({ width: item.width, title: item.title, canonical: item.homeCanonical })), "all widths canonical");
audit.check("PUBLIC_TECHNICAL_TOKEN", screenResults.flatMap((item) => item.forbidden || []).length === 0, screenResults.filter((item) => (item.forbidden || []).length > 0), []);
audit.check("REPRESENTATIVE_DETAIL_SCREENS", screenResults.filter((item) => ["A-002", "B-021", "D-005", "E-012"].includes(item.route)).every((item) => item.a002 && item.b021 && item.d005 && item.e012), screenResults.filter((item) => ["A-002", "B-021", "D-005", "E-012"].includes(item.route)).map((item) => ({ width: item.width, route: item.route, a002: item.a002, b021: item.b021, d005: item.d005, e012: item.e012 })), "all representative renderers mounted");
audit.check("BLANK_MAP", screenResults.filter((item) => item.route === "map-empty").every((item) => item.mapVisible && item.mapPrimary === "none"), screenResults.filter((item) => item.route === "map-empty").map((item) => ({ width: item.width, mapVisible: item.mapVisible, primary: item.mapPrimary })), { visible: true, primary: "none" });
audit.check("MAP_PRESET_SCREEN_COVERAGE", presetResults.length === 5 && presetFailures.length === 0, { inspected: presetResults.length, failures: presetFailures }, { inspected: 5, failures: [] });
audit.check("PRESET_HORIZONTAL_OVERFLOW", presetResults.every((item) => Number(item?.overflow || 0) <= 1), presetResults.map((item) => ({ id: item?.id, overflow: item?.overflow })), "all <= 1px");
audit.check("B021_VARIABLE_SEMANTICS", b021Pass, { gvi: b021Gvi, component: b021Component }, { gvi: "label/unit/direction/6-region", component: "label/unit/direction/6-region" });
audit.check("MAP_CONTEXT_POINT_SELECTION", contextSelectionPass, { reportError: mapInteractionReport.error, status: mapSummary.status, tooltipCoverage: mapSummary.mapTooltipCoverage, clickCoverage: mapSummary.mapClickDetailCoverage, contextSelection: mapSummary.contextLayerSelection }, { status: "PASS", tooltipCoverage: "13/13", clickCoverage: "13/13", contextSelection: "PASS" });
audit.check("PUBLIC_ASSET_RESPONSE", networkFailures.length === 0, networkFailures, []);
audit.check("UNCAUGHT_RUNTIME_ERROR", (browser?.runtimeErrors?.length || 0) === 0, browser?.runtimeErrors || [], []);

finishAuditV129(audit, "final-screens-audit-v129.json", {
  inspectedWidths: widths,
  inspectedScreens: routes.map((route) => route.name),
  screenMatrixCount: screenResults.length,
  screenFailureCount: screenFailures.length,
  mapPresetCount: presetResults.length,
  b021VariableSemantics: b021Pass ? "PASS" : "FAIL",
  contextLayerSelection: contextSelectionPass ? "PASS" : "FAIL",
  publicTechnicalTokenCount: screenResults.flatMap((item) => item.forbidden || []).length,
  consoleErrorCount: browser?.runtimeErrors?.length || 0,
  brokenAssetCount: networkFailures.length,
  finalScreenAudit:
    runtimeFailure === null && audit.checks.every((check) => check.status === "PASS")
      ? "PASS"
      : "FAIL",
});
