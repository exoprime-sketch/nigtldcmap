#!/usr/bin/env node

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

const audit = new AuditV125("home:v128");
const manifestResult = readJson(resolve(V2_ROOT, "manifest.json"));
const catalogResult = readJson(resolve(V2_ROOT, "catalog.json"));
const mapIndexResult = readJson(resolve(V2_ROOT, "map-index.json"));
const manifest = manifestResult.value || {};
const catalog = catalogElements(catalogResult.value);
const mapIndex = mapIndexResult.value || {};

const DATA_PROVIDED_STATUSES = new Set(["actual", "public-authorized", "partial"]);
const FEATURED_ELEMENT_IDS = [
  "A-002",
  "A-003",
  "A-010",
  "A-023",
  "A-024",
  "B-033",
  "C-016",
  "D-023",
];
const expected = {
  elementCount: Number(manifest.frameworkElements || catalog.length),
  providedCount: catalog.filter((item) => DATA_PROVIDED_STATUSES.has(item.publicStatus)).length,
  downloadableCount: catalog.filter(
    (item) => item.downloadAllowed === true && Number(item.downloadableRecordCount || 0) > 0
  ).length,
  mapLayerCount: Number(mapIndex.activeMapLayerCount || manifest.mapLayerCount || 0),
  releaseDate: String(manifest.generatedAt || "").slice(0, 10),
};

audit.check("MANIFEST_JSON", manifestResult.error === null, manifestResult.error, null);
audit.check("CATALOG_JSON", catalogResult.error === null, catalogResult.error, null);
audit.check("MAP_INDEX_JSON", mapIndexResult.error === null, mapIndexResult.error, null);
audit.check("CATALOG_ELEMENT_COUNT", catalog.length === 152, catalog.length, 152);

function releaseDateCandidates(isoDate) {
  const match = String(isoDate).match(/^(\d{4})-(\d{2})-(\d{2})$/u);
  if (!match) return [];
  const [, year, month, day] = match;
  const numericMonth = Number(month);
  const numericDay = Number(day);
  return [
    isoDate,
    `${year}.${month}.${day}`,
    `${year}. ${numericMonth}. ${numericDay}.`,
    `${year}년 ${numericMonth}월 ${numericDay}일`,
  ];
}

let server = null;
let browser = null;
let runtimeFailure = null;
let browserResult = null;
const networkFailures = [];
const responsiveFailures = [];

try {
  server = await startStaticBuildServer(resolve(PROJECT_ROOT, "build"));
  browser = await launchHeadlessBrowser();
  await browser.cdp.send("Network.enable");
  browser.cdp.on("Network.responseReceived", (params) => {
    const response = params.response || {};
    const url = String(response.url || "");
    if (!/\/data\/vietnam\/v2\/(?:manifest|catalog|map-index)\.json(?:[?#]|$)/u.test(url)) {
      return;
    }
    const contentType = String(response.mimeType || response.headers?.["content-type"] || "");
    if (Number(response.status) !== 200 || /text\/html/iu.test(contentType)) {
      networkFailures.push({ url, status: response.status, contentType });
    }
  });

  for (const width of [390, 768, 1024, 1440]) {
    await setViewport(browser.cdp, width, width === 390 ? 1100 : 1200);
    await navigate(browser.cdp, `${server.url}/#home`);
    await waitForValue(
      browser.cdp,
      `(() => {
        const root = document.querySelector('[data-v128-home]');
        return Boolean(root && !root.querySelector('[role="alert"]') && root.textContent?.trim());
      })()`,
      { timeoutMs: 20_000 }
    );
    const result = await evaluateValue(
      browser.cdp,
      `(() => {
        const root = document.querySelector('[data-v128-home]');
        const normalize = (value) => String(value || '').normalize('NFC');
        const text = normalize(root?.innerText);
        const numberPresent = (value) => {
          const formatted = new Intl.NumberFormat('ko-KR').format(value);
          return text.includes(formatted) || new RegExp('(?:^|[^0-9])' + String(value) + '(?:[^0-9]|$)', 'u').test(text);
        };
        const interactive = [...(root?.querySelectorAll('a, button, input, select') || [])];
        const unnamed = interactive.filter((node) => {
          const id = node.getAttribute('id');
          const labelled = id ? document.querySelector('label[for="' + CSS.escape(id) + '"]') : null;
          const name = node.getAttribute('aria-label') || node.getAttribute('aria-labelledby') ||
            labelled?.textContent || node.textContent || node.getAttribute('title') || node.getAttribute('placeholder');
          return !String(name || '').trim();
        }).length;
        const featuredIds = [...(root?.querySelectorAll('[data-element-id]') || [])]
          .map((node) => node.getAttribute('data-element-id'))
          .filter(Boolean);
        return {
          mounted: Boolean(root),
          text,
          heading: root?.querySelector('h1')?.textContent?.trim() || null,
          elementCountPresent: numberPresent(${expected.elementCount}),
          providedCountPresent: numberPresent(${expected.providedCount}),
          downloadableCountPresent: numberPresent(${expected.downloadableCount}),
          mapLayerCountPresent: numberPresent(${expected.mapLayerCount}),
          releaseDatePresent: ${JSON.stringify(releaseDateCandidates(expected.releaseDate))}.some((value) => text.includes(value)),
          vietnamScopePresent:
            /현재\\s*베트남\\s*파일럿\\s*데이터를\\s*제공/u.test(text) ||
            /현재\\s*제공\\s*국가\\s*[·ㆍ]?\\s*베트남/u.test(text),
          featureEntryPoints: ['데이터 찾기', '데이터 지도', '데이터 다운로드'].filter((label) =>
            interactive.some((node) => normalize(node.textContent).includes(label))
          ),
          featuredIds,
          featuredTitles: [...(root?.querySelectorAll('[data-element-id]') || [])]
            .map((node) => node.textContent?.trim() || '').filter(Boolean),
          legacyDatasetLinks: [...(root?.querySelectorAll('a[href], form[action]') || [])]
            .map((node) => node.getAttribute('href') || node.getAttribute('action') || '')
            .filter((url) => /dataset-detail/iu.test(url)),
          unsupportedCountryClaims: [...text.matchAll(/(?:[2-9]|[1-9][0-9]+)\s*개국|여러\s*국가\s*데이터|전\s*세계\s*국가\s*데이터/gu)].map((match) => match[0]),
          unnamedInteractive: unnamed,
          h1Count: root?.querySelectorAll('h1').length || 0,
          horizontalOverflow: Math.max(document.documentElement.scrollWidth, document.body.scrollWidth) - window.innerWidth,
        };
      })()`
    );
    if (
      !result?.mounted ||
      result.h1Count !== 1 ||
      result.unnamedInteractive !== 0 ||
      Number(result.horizontalOverflow || 0) > 1
    ) {
      responsiveFailures.push({ width, result });
    }
    if (width === 1440) browserResult = result;
  }

  const assets = await evaluateValue(
    browser.cdp,
    `(async () => {
      const paths = ['/data/vietnam/v2/manifest.json', '/data/vietnam/v2/catalog.json', '/data/vietnam/v2/map-index.json'];
      return Promise.all(paths.map(async (path) => {
        const response = await fetch(path, { cache: 'no-store' });
        const contentType = response.headers.get('content-type') || '';
        let json = null;
        let error = null;
        try { json = await response.json(); } catch (reason) { error = String(reason); }
        return { path, status: response.status, contentType, json, error };
      }));
    })()`
  );
  for (const asset of assets || []) {
    const valid =
      asset.status === 200 &&
      /(?:application\/json|application\/geo\+json)/iu.test(asset.contentType) &&
      asset.error === null &&
      asset.json &&
      typeof asset.json === "object";
    if (!valid) networkFailures.push(asset);
  }
} catch (error) {
  runtimeFailure = error instanceof Error ? error.message : String(error);
} finally {
  if (browser) await browser.close();
  if (server) await server.close();
}

const featuredIdSet = new Set(browserResult?.featuredIds || []);
const invalidFeaturedIds = [...featuredIdSet].filter(
  (elementId) => !catalog.some((item) => item.elementId === elementId)
);
const expectedFeaturedMatches = FEATURED_ELEMENT_IDS.filter((elementId) => featuredIdSet.has(elementId));

audit.check(
  "HOME_MANIFEST_COUNTS",
  runtimeFailure === null &&
    browserResult?.elementCountPresent === true &&
    browserResult?.providedCountPresent === true &&
    browserResult?.downloadableCountPresent === true &&
    browserResult?.mapLayerCountPresent === true,
  {
    runtimeFailure,
    rendered: browserResult
      ? {
          element: browserResult.elementCountPresent,
          provided: browserResult.providedCountPresent,
          downloadable: browserResult.downloadableCountPresent,
          mapLayers: browserResult.mapLayerCountPresent,
        }
      : null,
    expected,
  },
  { element: true, provided: true, downloadable: true, mapLayers: true }
);
audit.check(
  "HOME_FEATURED_ELEMENTS",
  featuredIdSet.size >= 4 && featuredIdSet.size <= 8 && invalidFeaturedIds.length === 0 && expectedFeaturedMatches.length >= 4,
  { ids: [...featuredIdSet], invalidFeaturedIds, recommendedMatches: expectedFeaturedMatches },
  { count: "4..8", invalidFeaturedIds: [], recommendedMatches: ">=4" }
);
audit.check("HOME_LEGACY_DATASET_DETAIL_LINK", (browserResult?.legacyDatasetLinks || []).length === 0, browserResult?.legacyDatasetLinks || [], []);
audit.check("HOME_RELEASE_DATE_VISIBLE", browserResult?.releaseDatePresent === true, browserResult?.releaseDatePresent ?? null, true);
audit.check("HOME_VIETNAM_SCOPE", browserResult?.vietnamScopePresent === true, browserResult?.vietnamScopePresent ?? null, true);
audit.check("HOME_UNSUPPORTED_COUNTRY_CLAIM", (browserResult?.unsupportedCountryClaims || []).length === 0, browserResult?.unsupportedCountryClaims || [], []);
audit.check(
  "HOME_PUBLIC_ENTRY_POINTS",
  (browserResult?.featureEntryPoints || []).length === 3,
  browserResult?.featureEntryPoints || [],
  ["데이터 찾기", "데이터 지도", "데이터 다운로드"]
);
audit.check("HOME_RESPONSIVE_ACCESSIBILITY", responsiveFailures.length === 0, responsiveFailures.length, 0, responsiveFailures);
audit.check("HOME_ASSET_RESPONSES", networkFailures.length === 0, networkFailures.length, 0, networkFailures);
audit.check("HOME_UNCAUGHT_RUNTIME_ERROR", (browser?.runtimeErrors?.length || 0) === 0, browser?.runtimeErrors || [], []);

audit.finish({
  homeManifestIntegration: runtimeFailure === null && audit.checks.every((check) => check.status === "PASS") ? "PASS" : "FAIL",
  frameworkElementCount: expected.elementCount,
  dataProvidedElementCount: expected.providedCount,
  downloadableElementCount: expected.downloadableCount,
  mapLayerCount: expected.mapLayerCount,
  releaseDate: expected.releaseDate,
  featuredElementCount: featuredIdSet.size,
  responsiveWidths: [390, 768, 1024, 1440],
  networkFailureCount: networkFailures.length,
});
