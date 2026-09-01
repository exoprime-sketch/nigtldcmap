#!/usr/bin/env node

import { existsSync } from "node:fs";
import { resolve } from "node:path";
import {
  AuditV125,
  PROJECT_ROOT,
  V2_ROOT,
  catalogElements,
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
import { finishAuditV129 } from "./v129/audit-helpers.mjs";

const audit = new AuditV125("public-copy:v129");
const catalogResult = readJson(resolve(V2_ROOT, "catalog.json"));
const catalog = catalogElements(catalogResult.value);
const acceptanceResult = readJson(
  resolve(PROJECT_ROOT, "reports/v128/vietnam-data-release-acceptance-v128.json")
);
const acceptanceRows = Array.isArray(acceptanceResult.value?.elements)
  ? acceptanceResult.value.elements
  : Array.isArray(acceptanceResult.value)
  ? acceptanceResult.value
  : [];
const acceptanceById = new Map(
  acceptanceRows.map((item) => [String(item.elementId || ""), item])
);
const buildPath = resolve(PROJECT_ROOT, "build");

const CANONICAL_TITLE = "개도국 기후기술 협력 플랫폼";
const CANONICAL_SCOPE = "현재 제공 국가 · 베트남";
const FORBIDDEN_PUBLIC_TOKENS = [
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
  "의미 계약",
  "의미 보존 시각화",
  "technical provenance",
];
const FORBIDDEN_PROVENANCE_ATTRIBUTE_PATTERNS = [
  /^(?:data-)?record[-_]?id$/iu,
  /^(?:data-)?indicator[-_]?id$/iu,
  /^(?:data-)?source[-_]?sheet$/iu,
  /^(?:data-)?source[-_]?row$/iu,
  /^(?:data-)?publication[-_]?decision(?:[-_]?id)?$/iu,
  /^(?:data-)?download[-_]?eligible$/iu,
];
const MAIN_ROUTES = [
  { name: "home", suffix: "/#home", selector: "[data-v128-home]", h1: CANONICAL_TITLE },
  { name: "finder", suffix: "/?country=VNM#explorer", selector: ".cdp-card-grid", h1: "데이터 찾기" },
  { name: "download", suffix: "/?country=VNM#download", selector: ".cdp-download-list", h1: "데이터 다운로드" },
  { name: "guide", suffix: "/#guide", selector: "[data-v128-guide]", h1: "데이터 이용안내" },
  { name: "not-found", suffix: "/#missing-public-v129", selector: "[data-v128-not-found]", h1: "페이지 확인 불가" },
];
const MAP_PRESETS = [
  "POWER_INFRASTRUCTURE",
  "RENEWABLE_PLANNING",
  "FOREST_CHANGE",
  "CLIMATE_VULNERABILITY",
  "CLIMATE_FINANCE_PROJECTS",
];

audit.check("CATALOG_JSON", catalogResult.error === null, catalogResult.error, null);
audit.check("ACCEPTANCE_MATRIX_JSON", acceptanceResult.error === null, acceptanceResult.error, null);
audit.check("FRAMEWORK_ELEMENT_COUNT", catalog.length === 152, catalog.length, 152);
audit.check(
  "PRODUCTION_BUILD_PRESENT",
  existsSync(resolve(buildPath, "index.html")),
  existsSync(resolve(buildPath, "index.html")),
  true
);

const routeFailures = [];
const technicalTokenHits = [];
const provenanceAttributeHits = [];
const titleFailures = [];
const copyConsistencyFailures = [];
const vietnamPilotH1Hits = [];
const publicScreenEvidence = [];
let detailRouteCount = 0;
let server = null;
let browser = null;
let runtimeFailure = null;

function scanExpression(routeName) {
  return `(() => {
    const normalize = (value) => String(value || '').normalize('NFC').replace(/\\s+/gu, ' ').trim();
    const lower = (value) => normalize(value).toLocaleLowerCase('en-US');
    const main = document.querySelector('main');
    if (!main) return { mounted: false, route: ${JSON.stringify(routeName)} };
    const visibleText = normalize(main.innerText);
    const publicRoots = [document.querySelector('header'), main, document.querySelector('footer')].filter(Boolean);
    const accessibleValues = [];
    const provenanceAttributes = [];
    const provenanceNamePatterns = ${JSON.stringify(
      FORBIDDEN_PROVENANCE_ATTRIBUTE_PATTERNS.map((pattern) => pattern.source)
    )}.map((source) => new RegExp(source, 'iu'));
    for (const root of publicRoots) {
      for (const node of root.querySelectorAll('*')) {
        for (const name of ['aria-label', 'title', 'alt', 'placeholder']) {
          const value = node.getAttribute(name);
          if (value) accessibleValues.push({ name, value: normalize(value) });
        }
        for (const attribute of node.attributes) {
          if (provenanceNamePatterns.some((pattern) => pattern.test(attribute.name))) {
            provenanceAttributes.push({ tag: node.tagName.toLowerCase(), name: attribute.name, value: normalize(attribute.value) });
          }
        }
      }
    }
    const accessibleText = accessibleValues.map((entry) => entry.value).join(' ');
    const publicCopy = lower(visibleText + ' ' + accessibleText);
    const forbidden = ${JSON.stringify(FORBIDDEN_PUBLIC_TOKENS)}.filter((token) =>
      publicCopy.includes(token.toLocaleLowerCase('en-US'))
    );
    const h1 = [...main.querySelectorAll('h1')].map((node) => normalize(node.textContent));
    const publicStatuses = [...main.querySelectorAll('[data-public-status]')]
      .map((node) => normalize(node.textContent));
    const downloadStatuses = [...main.querySelectorAll('[data-download-status]')]
      .map((node) => normalize(node.textContent));
    return {
      mounted: true,
      route: ${JSON.stringify(routeName)},
      h1,
      forbidden,
      accessibleHits: accessibleValues.filter((entry) => ${JSON.stringify(FORBIDDEN_PUBLIC_TOKENS)}.some((token) => lower(entry.value).includes(token.toLocaleLowerCase('en-US')))),
      provenanceAttributes,
      publicStatuses,
      downloadStatuses,
      visibleTextLength: visibleText.length,
    };
  })()`;
}

function recordScan(route, result) {
  publicScreenEvidence.push({
    route,
    h1: result?.h1 || [],
    visibleTextLength: result?.visibleTextLength || 0,
    forbiddenCount: result?.forbidden?.length || 0,
    provenanceAttributeCount: result?.provenanceAttributes?.length || 0,
  });
  for (const token of result?.forbidden || []) {
    technicalTokenHits.push({ route, token, accessible: (result.accessibleHits || []).filter((entry) => entry.value.toLocaleLowerCase('en-US').includes(token.toLocaleLowerCase('en-US'))) });
  }
  for (const entry of result?.provenanceAttributes || []) {
    provenanceAttributeHits.push({ route, ...entry });
  }
  for (const heading of result?.h1 || []) {
    if (/베트남\s*파일럿/u.test(heading)) vietnamPilotH1Hits.push({ route, heading });
  }
  const allowedStatuses = new Set(["데이터 제공", "일부 데이터 제공", "입력 양식", "입력 예정", "원자료 미수집"]);
  const allowedDownloads = new Set(["다운로드 가능", "화면에서만 제공", "다운로드 자료 없음"]);
  const invalidStatuses = (result?.publicStatuses || []).filter((value) => !allowedStatuses.has(value));
  const invalidDownloads = (result?.downloadStatuses || []).filter(
    (value) => ![...allowedDownloads].some((allowed) => value === allowed || value.startsWith(allowed))
  );
  if (invalidStatuses.length > 0 || invalidDownloads.length > 0) {
    copyConsistencyFailures.push({ route, invalidStatuses, invalidDownloads });
  }
}

try {
  server = await startStaticBuildServer(buildPath);
  browser = await launchHeadlessBrowser();
  await setViewport(browser.cdp, 1440, 1100);

  for (const route of MAIN_ROUTES) {
    try {
      await navigate(browser.cdp, `${server.url}${route.suffix}`);
      await waitForValue(browser.cdp, `Boolean(document.querySelector(${JSON.stringify(route.selector)}))`, { timeoutMs: 25_000 });
      if (route.name === "home") {
        await waitForValue(browser.cdp, `document.querySelectorAll('.home-featured-list [data-element-id]').length > 0`, { timeoutMs: 20_000 });
      }
      if (route.name === "finder") {
        await waitForValue(browser.cdp, `document.querySelector('.cdp-result-count')?.textContent?.includes('152') && document.querySelectorAll('.cdp-dataset-card').length > 0`, { timeoutMs: 25_000 });
        for (let attempt = 0; attempt < 8; attempt += 1) {
          const finderState = await evaluateValue(browser.cdp, `(() => ({
            count: document.querySelectorAll('.cdp-dataset-card').length,
            more: Boolean(document.querySelector('.cdp-load-more button')),
          }))()`);
          if (finderState?.count === 152) break;
          if (!finderState?.more) throw new Error(`finder rendered ${finderState?.count || 0}/152 cards without a continuation control`);
          await evaluateValue(browser.cdp, `(() => {
            const button = document.querySelector('.cdp-load-more button');
            if (!(button instanceof HTMLButtonElement)) return false;
            button.click();
            return true;
          })()`);
          await waitForValue(browser.cdp, `document.querySelectorAll('.cdp-dataset-card').length > ${Number(finderState.count || 0)}`, { timeoutMs: 8_000 });
        }
        const finderTitles = await evaluateValue(browser.cdp, `[...document.querySelectorAll('.cdp-dataset-card h2')].map((node) => node.textContent?.normalize('NFC').trim() || '')`);
        const expectedFinderTitles = catalog.map((element) => String(acceptanceById.get(String(element.elementId || ""))?.publicTitle || element.elementLabel || "").normalize("NFC").trim());
        const finderMissing = expectedFinderTitles.filter((title) => !finderTitles.includes(title));
        const finderUnexpected = finderTitles.filter((title) => !expectedFinderTitles.includes(title));
        if (finderTitles.length !== 152 || finderMissing.length > 0 || finderUnexpected.length > 0) {
          titleFailures.push({ route: "finder", actualCount: finderTitles.length, expectedCount: 152, missing: finderMissing, unexpected: finderUnexpected });
        }
      }
      const result = await evaluateValue(browser.cdp, scanExpression(route.name));
      if (!result?.mounted) throw new Error("public main unavailable");
      recordScan(route.name, result);
      if (result.h1.length !== 1 || result.h1[0] !== route.h1) {
        titleFailures.push({ route: route.name, actual: result.h1, expected: [route.h1] });
      }
      if (route.name === "home") {
        const homeCopy = await evaluateValue(browser.cdp, `document.querySelector('[data-v128-home]')?.innerText?.normalize('NFC') || ''`);
        if (!String(homeCopy).includes(CANONICAL_SCOPE)) {
          copyConsistencyFailures.push({ route: "home", missing: CANONICAL_SCOPE });
        }
      }
    } catch (error) {
      routeFailures.push({ route: route.name, error: error instanceof Error ? error.message : String(error) });
    }
  }

  for (const element of catalog) {
    const elementId = String(element.elementId || "");
    const expectedTitle = String(
      acceptanceById.get(elementId)?.publicTitle || element.elementLabel || ""
    ).normalize("NFC").trim();
    const url = new URL(server.url);
    url.searchParams.set("view", "data");
    url.searchParams.set("country", "VNM");
    url.searchParams.set("element", elementId);
    url.hash = "element-detail";
    try {
      await navigate(browser.cdp, url.toString());
      await waitForValue(
        browser.cdp,
        `document.querySelector('[data-testid="public-analysis-root"]')?.getAttribute('data-analysis-state') === 'ready' && Boolean(document.querySelector('[data-testid="public-data-title"]'))`,
        { timeoutMs: 25_000 }
      );
      const route = `detail:${elementId}`;
      const result = await evaluateValue(browser.cdp, scanExpression(route));
      detailRouteCount += 1;
      recordScan(route, result);
      if (!result?.mounted || result.h1.length !== 1 || result.h1[0] !== expectedTitle) {
        titleFailures.push({ route, actual: result?.h1 || [], expected: [expectedTitle] });
      }
    } catch (error) {
      routeFailures.push({ route: `detail:${elementId}`, error: error instanceof Error ? error.message : String(error) });
    }
  }

  try {
    await navigate(browser.cdp, `${server.url}/?country=VNM#map`);
    await waitForValue(browser.cdp, `document.querySelectorAll('[data-testid="map-analysis-preset"]').length === 5 && document.querySelectorAll('.cdp-layer-card[data-map-element]').length === 13`, { timeoutMs: 35_000 });
    const emptyResult = await evaluateValue(browser.cdp, scanExpression("map:empty"));
    recordScan("map:empty", emptyResult);
    if (emptyResult.h1.length !== 1 || emptyResult.h1[0] !== "데이터 지도") {
      titleFailures.push({ route: "map:empty", actual: emptyResult.h1, expected: ["데이터 지도"] });
    }
    for (const presetId of MAP_PRESETS) {
      const activated = await evaluateValue(browser.cdp, `(() => {
        const button = document.querySelector('[data-testid="map-analysis-preset"][data-preset-id=${JSON.stringify(presetId)}]');
        if (!(button instanceof HTMLButtonElement)) return false;
        button.click();
        return true;
      })()`);
      if (!activated) throw new Error(`${presetId} preset unavailable`);
      await waitForValue(browser.cdp, `document.querySelector('[data-testid="map-public-content"]')?.getAttribute('data-map-preset') === ${JSON.stringify(presetId)} && Boolean(document.querySelector('[data-testid="map-current-analysis"]')) && Boolean(document.querySelector('[data-testid="map-dynamic-legend"]'))`, { timeoutMs: 35_000 });
      const selected = await evaluateValue(browser.cdp, `(() => {
        const button = document.querySelector('[data-testid="map-keyboard-feature-select"]');
        if (!(button instanceof HTMLButtonElement)) return false;
        button.click();
        return true;
      })()`);
      if (selected) {
        await waitForValue(browser.cdp, `Boolean(document.querySelector('[data-testid="map-feature-detail"]'))`, { timeoutMs: 10_000 });
      }
      const route = `map:${presetId}`;
      const result = await evaluateValue(browser.cdp, scanExpression(route));
      recordScan(route, result);
    }
  } catch (error) {
    routeFailures.push({ route: "map", error: error instanceof Error ? error.message : String(error) });
  }
} catch (error) {
  runtimeFailure = error instanceof Error ? error.message : String(error);
} finally {
  if (browser) await browser.close();
  if (server) await server.close();
}

audit.check(
  "PUBLIC_ROUTE_COPY_COVERAGE",
  runtimeFailure === null && routeFailures.length === 0 && detailRouteCount === 152,
  { runtimeFailure, detailRouteCount, routeFailures: routeFailures.length },
  { runtimeFailure: null, detailRouteCount: 152, routeFailures: 0 },
  routeFailures
);
audit.check("HOME_CANONICAL_TITLE", !titleFailures.some((item) => item.route === "home"), titleFailures.filter((item) => item.route === "home"), []);
audit.check("HOME_CANONICAL_SCOPE", !copyConsistencyFailures.some((item) => item.route === "home" && item.missing === CANONICAL_SCOPE), copyConsistencyFailures.filter((item) => item.route === "home" && item.missing), []);
audit.check("PUBLIC_H1_VIETNAM_PILOT", vietnamPilotH1Hits.length === 0, vietnamPilotH1Hits.length, 0, vietnamPilotH1Hits);
audit.check("PUBLIC_TITLE_CONSISTENCY", titleFailures.length === 0, titleFailures.length, 0, titleFailures);
audit.check("PUBLIC_TECHNICAL_TOKEN", technicalTokenHits.length === 0, technicalTokenHits.length, 0, technicalTokenHits.slice(0, 250));
audit.check("PUBLIC_PROVENANCE_ATTRIBUTE", provenanceAttributeHits.length === 0, provenanceAttributeHits.length, 0, provenanceAttributeHits.slice(0, 250));
audit.check("PUBLIC_STATUS_AND_DOWNLOAD_COPY", copyConsistencyFailures.filter((item) => !item.missing).length === 0, copyConsistencyFailures.filter((item) => !item.missing).length, 0, copyConsistencyFailures.filter((item) => !item.missing));
audit.check("UNCAUGHT_RUNTIME_ERROR", (browser?.runtimeErrors?.length || 0) === 0, browser?.runtimeErrors || [], []);

finishAuditV129(audit, "public-copy-audit-v129.json", {
  publicCopyAudit: runtimeFailure === null && audit.checks.every((check) => check.status === "PASS") ? "PASS" : "FAIL",
  inspectedElementDetails: detailRouteCount,
  inspectedPublicSurfaces: publicScreenEvidence.length,
  technicalPublicTokenCount: technicalTokenHits.length,
  publicProvenanceAttributeCount: provenanceAttributeHits.length,
  titleFailureCount: titleFailures.length,
  statusCopyFailureCount: copyConsistencyFailures.filter((item) => !item.missing).length,
  vietnamPilotPublicH1Count: vietnamPilotH1Hits.length,
  canonicalTitle: CANONICAL_TITLE,
  canonicalScope: CANONICAL_SCOPE,
  publicScreenEvidence,
});
