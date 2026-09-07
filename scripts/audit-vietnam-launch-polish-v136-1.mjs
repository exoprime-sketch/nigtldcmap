#!/usr/bin/env node

/**
 * V136.1 final launch polish acceptance.
 *
 * The V136 gates already prove the platform works. This one asks a narrower
 * question: does the language on the screens a first-time visitor meets read
 * like a public data portal, or like the project that built it? It measures the
 * public chrome - home, finder, download, guide, the map frame and the shared
 * parts of a detail page - and deliberately does not measure inside the 152
 * element renderers, whose column headings name the data itself.
 */

import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

import { AuditV125, PROJECT_ROOT, V2_ROOT, catalogElements, readJson } from "./v125/audit-utils.mjs";
import {
  evaluateValue,
  launchHeadlessBrowser,
  navigate,
  setViewport,
  startStaticBuildServer,
  waitForValue,
} from "./v125/browser-runtime.mjs";
import { detailUrlV135, finderUrlV135, mapUrlV135 } from "./v135/audit-helpers.mjs";
import { finishAuditV136 } from "./v136/audit-helpers.mjs";
import {
  ACCEPTANCE_TEST_TERMS_V136_1,
  BASELINE_PUBLIC_NAV_V136_1,
  BASELINE_PUBLIC_VIEWS_V136_1,
  MEASUREMENT_TERMS_V136_1,
  RELEASE_TERMS_V136_1,
  UAT_DETAIL_ELEMENTS_V136_1,
  UAT_VIEWPORTS_V136_1,
} from "./v136-1/acceptance-contract.mjs";

const audit = new AuditV125("launch-polish:v136-1");
const catalog = catalogElements(readJson(resolve(V2_ROOT, "catalog.json")).value);
const manifest = readJson(resolve(V2_ROOT, "manifest.json")).value;
const navigationSource = readFileSync(
  resolve(PROJECT_ROOT, "src/app/navigation.ts"),
  "utf8"
);

const CARD_COUNT = `document.querySelectorAll('[data-testid="public-finder-card-v135"]').length`;
const ANALYSIS_READY = `(() => {
  const root = document.querySelector('[data-testid="public-analysis-root"]');
  if (!root || root.getAttribute('data-analysis-state') !== 'ready') return false;
  return root.querySelectorAll('[data-testid="public-analysis-pending"]').length === 0;
})()`;

/**
 * Reads the copy a visitor actually sees on a screen.
 *
 * The 152 element renderers are excluded: a table of observations legitimately
 * says "측정항목" as a column heading, and rewriting that would rename the data
 * rather than the interface. Everything wrapping them is chrome and is measured.
 */
function chromeTextExpression() {
  return `(() => {
    const main = document.querySelector('main') || document.body;
    const clone = main.cloneNode(true);
    clone.querySelectorAll(
      '[data-testid="public-analysis-root"], [data-testid="public-raw-table"], .sr-only'
    ).forEach((node) => node.remove());
    return String(clone.textContent || '').normalize('NFC').replace(/\\s+/gu, ' ').trim();
  })()`;
}

/**
 * Acronyms the interface itself introduces.
 *
 * Scanning the rendered page cannot answer this: most capitals a reader meets
 * on the finder are source values - an organisation's name, a decree number -
 * and renaming those would rewrite the data rather than the interface. What the
 * platform is answerable for is the wording it authors, so this reads the
 * Korean-facing string literals out of the public chrome source and asks
 * whether each acronym in them is one the glossary explains.
 */
const CHROME_SOURCES_V136_1 = [
  "src/pages/HomePage.tsx",
  "src/pages/DataExplorerPage.tsx",
  "src/pages/DownloadPage.tsx",
  "src/pages/DataGuidePage.tsx",
  "src/pages/CountryDataElementPage.tsx",
  "src/components/search/GlobalQuickSearchV41.tsx",
  "src/components/data/public/PublicSourcePanelV126.tsx",
];

/** Formats and units a reader reads as words, not as jargon needing a gloss. */
const ACRONYM_ALLOWLIST_V136_1 = new Set(["CSV", "JSON", "URL", "ID", "OK"]);

function glossaryTermsV136_1() {
  const source = readFileSync(
    resolve(PROJECT_ROOT, "src/data/glossary/publicGlossaryV134.ts"),
    "utf8"
  );
  const terms = new Set();
  for (const match of source.matchAll(/term:\s*"([^"]+)"/gu)) terms.add(match[1]);
  for (const match of source.matchAll(/aliases:\s*\[([^\]]*)\]/gu)) {
    for (const alias of match[1].matchAll(/"([^"]+)"/gu)) terms.add(alias[1]);
  }
  return terms;
}

/**
 * A numbered variant of an explained term is explained: the glossary defines
 * SPEI and SSP, and the entry itself lists SPEI12 and SSP2-4.5 as the patterns
 * a reader will meet.
 */
function acronymIsExplainedV136_1(token, glossary) {
  if (ACRONYM_ALLOWLIST_V136_1.has(token)) return true;
  if (glossary.has(token)) return true;
  const stem = token.replace(/[0-9]+$/u, "");
  return stem.length >= 2 && glossary.has(stem);
}

/** Acronyms in the authored copy of one chrome file. */
function authoredAcronymsV136_1(relativePath, glossary) {
  const source = readFileSync(resolve(PROJECT_ROOT, relativePath), "utf8");
  const copy = [];
  // Quoted strings and JSX text that carry Korean, each kept to a single line:
  // a match that runs past a line end stops being copy and starts being code.
  for (const match of source.matchAll(/"([^"\r\n]*[가-힣][^"\r\n]*)"/gu)) {
    copy.push(match[1]);
  }
  for (const match of source.matchAll(
    /^[^<>{}"\r\n]*[가-힣][^<>{}"\r\n]*$/gmu
  )) {
    copy.push(match[0]);
  }
  const found = new Set();
  for (const line of copy) {
    for (const token of line.match(/(?<![A-Za-z0-9_])[A-Z]{2,}[0-9]*(?![a-z_])/gu) || []) {
      if (acronymIsExplainedV136_1(token, glossary)) continue;
      found.add(token);
    }
  }
  return [...found];
}


/**
 * Chooses one dataset from the left panel and waits for it to take.
 *
 * The list renders before the map index finishes loading, so a single click can
 * land on a button that is not wired up yet and silently do nothing. Clicking
 * until the control reports itself pressed makes the step depend on the app's
 * own state rather than on how fast the machine is.
 */
async function selectMapDatasetV136_1(cdp, elementId) {
  const selector =
    `[data-testid="map-all-data-layer-v135"][data-element-id="${elementId}"]`;
  await waitForValue(
    cdp,
    `(() => {
      const node = document.querySelector('${selector}');
      return Boolean(node) && node.getAttribute('aria-disabled') !== 'true' && !node.disabled;
    })()`,
    { timeoutMs: 40_000 }
  );
  await waitForValue(
    cdp,
    `(() => {
      const node = document.querySelector('${selector}');
      if (!node) return false;
      if (node.getAttribute('aria-pressed') === 'true') return true;
      node.click();
      return false;
    })()`,
    { timeoutMs: 45_000, intervalMs: 400 }
  );
}

let server = null;
let browser = null;
let runtimeFailure = null;
const brokenAssets = [];

let homeEvidence = null;
let chromeCopy = [];
let looseAcronyms = [];
let finderAutoLoad = null;
let finderBackRestore = null;
let mapEvidence = null;
let mapCompare = null;
let routeCount = 0;
const uatRows = [];

try {
  if (!existsSync(resolve(PROJECT_ROOT, "build/index.html"))) {
    throw new Error("production build missing; run npm run build first");
  }
  server = await startStaticBuildServer(resolve(PROJECT_ROOT, "build"));
  browser = await launchHeadlessBrowser();
  const cdp = browser.cdp;

  await cdp.send("Network.enable");
  cdp.on("Network.responseReceived", (params) => {
    const status = Number(params.response?.status || 0);
    if (status >= 400) brokenAssets.push({ url: params.response?.url, status });
  });

  await setViewport(cdp, 1440, 1000);

  // ---- home ------------------------------------------------------------
  await navigate(cdp, `${server.url}/#home`);
  await waitForValue(cdp, `Boolean(document.querySelector('[data-v128-home]'))`, {
    timeoutMs: 35_000,
  });
  await waitForValue(
    cdp,
    `document.querySelectorAll('.home-featured-list > button').length > 0`,
    { timeoutMs: 35_000 }
  );
  homeEvidence = await evaluateValue(
    cdp,
    `(() => {
      const main = document.querySelector('main') || document.body;
      const text = String(main.textContent || '').normalize('NFC').replace(/\\s+/gu, ' ').trim();
      const scopeMatches = text.split('현재 제공 국가').length - 1;
      return {
        statusBadgeCount: main.querySelectorAll('[data-public-status], [data-download-status]').length,
        statCount: main.querySelectorAll('.home-v128-stats > div').length,
        statLabels: [...main.querySelectorAll('.home-v128-stats dt')].map((n) => n.textContent.trim()),
        featuredHeading: main.querySelector('.home-featured-heading strong')?.textContent?.trim() || '',
        searchPlaceholder: main.querySelector('#home-search')?.getAttribute('placeholder') || '',
        quickActions: [...main.querySelectorAll('.home-final-actions button')].map((n) => ({
          title: n.querySelector('strong')?.textContent?.trim() || '',
          detail: n.querySelector('span')?.textContent?.trim() || '',
        })),
        scopeMentionCount: scopeMatches,
        h1: main.querySelector('h1')?.textContent?.trim() || '',
        text,
      };
    })()`
  );

  // ---- copy sweep across the public chrome ----------------------------
  const routes = [
    { name: "home", url: `${server.url}/#home`, ready: `Boolean(document.querySelector('[data-v128-home]'))` },
    { name: "finder", url: finderUrlV135(server.url), ready: `${CARD_COUNT} > 0` },
    { name: "download", url: `${server.url}/#download`, ready: `Boolean(document.querySelector('.cdp-hero h1'))` },
    { name: "guide", url: `${server.url}/#guide`, ready: `Boolean(document.querySelector('[data-v128-guide]'))` },
    { name: "map", url: mapUrlV135(server.url), ready: `Boolean(document.querySelector('[data-testid="map-all-data-v135"]'))` },
    // The map's legend card and analysis panel only exist once a dataset is
    // chosen, and that is where its wording lives. Sweeping only the empty map
    // reads the one state that has almost no copy in it.
    {
      name: "map-active",
      url: mapUrlV135(server.url),
      ready: `Boolean(document.querySelector('[data-testid="map-all-data-v135"]'))`,
      after: async () => {
        await selectMapDatasetV136_1(cdp, "A-023");
        await waitForValue(
          cdp,
          `Boolean(document.querySelector('[data-testid="map-current-analysis"]'))`,
          { timeoutMs: 40_000 }
        );
      },
    },
    // Clicking a feature opens a panel of its own, and that panel turned out
    // to be where several store-side words had survived. A sweep that never
    // clicks is a sweep that cannot see them.
    {
      name: "map-feature",
      url: mapUrlV135(server.url),
      ready: `Boolean(document.querySelector('[data-testid="map-all-data-v135"]'))`,
      after: async () => {
        await selectMapDatasetV136_1(cdp, "B-033");
        await waitForValue(
          cdp,
          `(() => {
            const panel = document.querySelector('[data-testid="map-selected-feature-panel"]');
            if (panel) return true;
            const feature = document.querySelector('[data-testid="map-selectable-adm1-feature"]');
            if (!feature) return false;
            feature.dispatchEvent(new MouseEvent('click', { bubbles: true }));
            return false;
          })()`,
          { timeoutMs: 45_000, intervalMs: 400 }
        );
      },
    },
    { name: "detail", url: detailUrlV135(server.url, "A-016"), ready: ANALYSIS_READY },
  ];
  routeCount = routes.length;

  for (const route of routes) {
    await navigate(cdp, route.url);
    await waitForValue(cdp, route.ready, { timeoutMs: 40_000 });
    if (route.after) await route.after();
    chromeCopy.push({
      route: route.name,
      text: String(await evaluateValue(cdp, chromeTextExpression())),
    });
  }

  // ---- finder behaviour must survive the copy pass ---------------------
  await navigate(cdp, detailUrlV135(server.url, "A-016"));
  await waitForValue(cdp, ANALYSIS_READY, { timeoutMs: 40_000 });
  await evaluateValue(cdp, "(() => { sessionStorage.clear(); return true; })()");
  await navigate(cdp, finderUrlV135(server.url));
  await waitForValue(cdp, `${CARD_COUNT} > 0`, { timeoutMs: 35_000 });
  const autoLoadSequence = [Number(await evaluateValue(cdp, CARD_COUNT))];
  for (let step = 0; step < 12; step += 1) {
    const before = autoLoadSequence[autoLoadSequence.length - 1];
    await evaluateValue(
      cdp,
      `(() => { window.scrollTo({ top: document.body.scrollHeight, behavior: 'instant' }); return true; })()`
    );
    try {
      await waitForValue(cdp, `${CARD_COUNT} > ${before}`, { timeoutMs: 8_000 });
    } catch {
      break;
    }
    autoLoadSequence.push(Number(await evaluateValue(cdp, CARD_COUNT)));
    if (autoLoadSequence[autoLoadSequence.length - 1] >= 152) break;
  }
  finderAutoLoad = { sequence: autoLoadSequence };

  const beforeLeave = await evaluateValue(
    cdp,
    `(() => ({ count: ${CARD_COUNT}, scrollY: Math.round(window.scrollY) }))()`
  );
  await navigate(cdp, detailUrlV135(server.url, "A-016"));
  await waitForValue(cdp, ANALYSIS_READY, { timeoutMs: 40_000 });
  await evaluateValue(cdp, `(() => { history.back(); return true; })()`);
  await waitForValue(cdp, `${CARD_COUNT} > 0`, { timeoutMs: 35_000 });
  await waitForValue(
    cdp,
    `document.querySelector('[data-testid="finder-results-v136"]')
      ?.getAttribute('data-finder-restore-state') === 'settled'`,
    { timeoutMs: 35_000 }
  );
  const afterBack = await evaluateValue(
    cdp,
    `(() => ({ count: ${CARD_COUNT}, scrollY: Math.round(window.scrollY) }))()`
  );
  finderBackRestore = {
    beforeLeave,
    afterBack,
    scrollDrift: Math.abs(afterBack.scrollY - beforeLeave.scrollY),
  };

  // ---- map structure is unchanged --------------------------------------
  await navigate(cdp, mapUrlV135(server.url));
  await waitForValue(
    cdp,
    `document.querySelectorAll('[data-testid="map-all-data-layer-v135"]').length > 0`,
    { timeoutMs: 40_000 }
  );
  mapEvidence = await evaluateValue(
    cdp,
    `(() => ({
      layerCount: document.querySelectorAll('[data-testid="map-all-data-layer-v135"]').length,
      presetCount: document.querySelectorAll('[data-testid="map-analysis-preset"]').length,
      compareControl: Boolean(document.querySelector('[data-testid="map-compare-open-v135"]')),
      guidePresent: Boolean(document.querySelector('[data-testid="map-data-guide-v130"]')) ||
        [...document.querySelectorAll('summary')].some((n) => n.textContent.includes('지도 데이터 안내')),
    }))()`
  );
  await evaluateValue(
    cdp,
    `(() => { document.querySelector('[data-testid="map-compare-open-v135"]')?.click(); return true; })()`
  );
  mapCompare = await waitForValue(
    cdp,
    `(() => {
      const workspace = document.querySelector('[data-testid="map-comparison-workspace-v135"]');
      if (!workspace) return 0;
      const panes = workspace.querySelectorAll(
        '[data-testid="map-compare-pane-a"], [data-testid="map-compare-pane-b"]'
      ).length;
      return panes >= 2 ? panes : 0;
    })()`,
    { timeoutMs: 35_000 }
  ).catch(() => 0);

  // ---- representative visual UAT ---------------------------------------
  for (const width of UAT_VIEWPORTS_V136_1) {
    await setViewport(cdp, width, width < 800 ? 900 : 1050);
    for (const route of routes) {
      await navigate(cdp, route.url);
      await waitForValue(cdp, route.ready, { timeoutMs: 40_000 });
      if (route.after) await route.after();
      const overflow = Number(
        await evaluateValue(
          cdp,
          `Math.max(document.documentElement.scrollWidth, document.body.scrollWidth) - window.innerWidth`
        )
      );
      uatRows.push({ kind: "route", name: route.name, width, overflow });
    }
  }

  await setViewport(cdp, 1440, 1050);
  for (const elementId of UAT_DETAIL_ELEMENTS_V136_1) {
    await navigate(cdp, detailUrlV135(server.url, elementId));
    await waitForValue(cdp, ANALYSIS_READY, { timeoutMs: 45_000 });
    const overflow = Number(
      await evaluateValue(
        cdp,
        `Math.max(document.documentElement.scrollWidth, document.body.scrollWidth) - window.innerWidth`
      )
    );
    uatRows.push({ kind: "detail", name: elementId, width: 1440, overflow });
  }
} catch (error) {
  runtimeFailure = error instanceof Error ? error.message : String(error);
} finally {
  if (browser) await browser.close();
  if (server) await server.close();
}

/** Counts a vocabulary across every chrome surface, reporting where it landed. */
function termHits(terms) {
  const hits = [];
  for (const row of chromeCopy) {
    for (const term of terms) {
      if (row.text.includes(term)) hits.push({ route: row.route, term });
    }
  }
  return hits;
}

const glossary = glossaryTermsV136_1();
for (const relativePath of CHROME_SOURCES_V136_1) {
  for (const token of authoredAcronymsV136_1(relativePath, glossary)) {
    looseAcronyms.push({ file: relativePath, token });
  }
}

const navMatches = navigationSource.match(/\{\s*view:\s*"[a-z-]+",\s*label:/gu) || [];
const viewMatches =
  navigationSource
    .match(/export type View =([\s\S]*?);/u)?.[1]
    .match(/"[a-z-]+"/gu) || [];

const releaseHits = termHits(RELEASE_TERMS_V136_1);
const acceptanceHits = termHits(ACCEPTANCE_TEST_TERMS_V136_1);
const measurementHits = termHits(MEASUREMENT_TERMS_V136_1);
const homeReleaseHits = releaseHits.filter((hit) => hit.route === "home");
const overflowRows = uatRows.filter((row) => row.overflow > 1);
const expectedAutoLoad = [24, 48, 72, 96, 120, 144, 152];

audit.check("LAUNCH_POLISH_RUNTIME", runtimeFailure === null, { runtimeFailure }, { runtimeFailure: null });

audit.check("NEW_PUBLIC_TAB_COUNT", navMatches.length - BASELINE_PUBLIC_NAV_V136_1 === 0, navMatches.length - BASELINE_PUBLIC_NAV_V136_1, 0);
audit.check("NEW_PUBLIC_ROUTE_COUNT", viewMatches.length - BASELINE_PUBLIC_VIEWS_V136_1 === 0, viewMatches.length - BASELINE_PUBLIC_VIEWS_V136_1, 0);

audit.check("HOME_INTERNAL_STATUS_BADGE_COUNT", homeEvidence?.statusBadgeCount === 0, homeEvidence?.statusBadgeCount ?? null, 0);
audit.check("HOME_RELEASE_TERM_COUNT", homeReleaseHits.length === 0, homeReleaseHits, []);
audit.check("HOME_STAT_TILES", JSON.stringify(homeEvidence?.statLabels || []) === JSON.stringify(["데이터", "지도 데이터", "다운로드 가능", "최근 업데이트"]), homeEvidence?.statLabels ?? null, ["데이터", "지도 데이터", "다운로드 가능", "최근 업데이트"]);
audit.check("HOME_SCOPE_MENTION_COUNT", homeEvidence?.scopeMentionCount === 1, homeEvidence?.scopeMentionCount ?? null, 1);
audit.check("HOME_SEARCH_PLACEHOLDER", homeEvidence?.searchPlaceholder === "어떤 데이터를 찾으시나요?", homeEvidence?.searchPlaceholder ?? null, "어떤 데이터를 찾으시나요?");
audit.check("HOME_FEATURED_HEADING", homeEvidence?.featuredHeading === "주요 데이터", homeEvidence?.featuredHeading ?? null, "주요 데이터");

audit.check("PUBLIC_RELEASE_TERM_COUNT", releaseHits.length === 0, releaseHits, []);
audit.check("PUBLIC_ACCEPTANCE_TEST_TERM_COUNT", acceptanceHits.length === 0, acceptanceHits, []);
audit.check("PUBLIC_MEASUREMENT_TERM_COUNT", measurementHits.length === 0, measurementHits, []);
// The rendered-DOM form of this question belongs to the V134 glossary audit,
// which knows which occurrences carry a help trigger. This one covers the
// complementary case: an acronym the interface author typed into its own copy.
audit.check("AUTHORED_ACRONYM_WITHOUT_GLOSSARY", looseAcronyms.length === 0, looseAcronyms.slice(0, 25), []);

audit.check("FINDER_AUTO_LOAD", JSON.stringify(finderAutoLoad?.sequence || []) === JSON.stringify(expectedAutoLoad), finderAutoLoad?.sequence ?? null, expectedAutoLoad);
audit.check("FINDER_BACK_RESTORE", Number(finderBackRestore?.afterBack?.count || 0) >= Number(finderBackRestore?.beforeLeave?.count || 0) && Number(finderBackRestore?.scrollDrift ?? 9999) <= 200, finderBackRestore, "rows and offset restored");

audit.check("MAP_LAYER_COUNT", mapEvidence?.layerCount === 12, mapEvidence?.layerCount ?? null, 12);
audit.check("MAP_PRESET_COUNT", mapEvidence?.presetCount === 5, mapEvidence?.presetCount ?? null, 5);
audit.check("MAP_COMPARE", Number(mapCompare) >= 2, mapCompare, ">=2 panes");

audit.check("FRAMEWORK_ELEMENTS", catalog.length === 152, catalog.length, 152);
audit.check("ACCOUNTED_ELEMENTS", Number(manifest?.accountedElements) === 152, manifest?.accountedElements ?? null, 152);

audit.check("UAT_COVERAGE", uatRows.length === UAT_VIEWPORTS_V136_1.length * routeCount + UAT_DETAIL_ELEMENTS_V136_1.length, uatRows.length, UAT_VIEWPORTS_V136_1.length * routeCount + UAT_DETAIL_ELEMENTS_V136_1.length);
audit.check("UAT_HORIZONTAL_OVERFLOW", overflowRows.length === 0, overflowRows.slice(0, 20), []);
audit.check("BROKEN_ASSET", brokenAssets.length === 0, brokenAssets.slice(0, 20), []);
audit.check("CONSOLE_ERROR", (browser?.runtimeErrors || []).length === 0, browser?.runtimeErrors || [], []);

finishAuditV136(audit, "launch-polish-audit-v136-1.json", {
  newPublicTabCount: navMatches.length - BASELINE_PUBLIC_NAV_V136_1,
  newPublicRouteCount: viewMatches.length - BASELINE_PUBLIC_VIEWS_V136_1,
  homeEvidence: homeEvidence && { ...homeEvidence, text: undefined },
  releaseHits,
  acceptanceHits,
  measurementHits,
  looseAcronyms,
  finderAutoLoad,
  finderBackRestore,
  mapEvidence,
  mapCompare,
  uatRows,
  brokenAssets,
  runtimeFailure,
});
