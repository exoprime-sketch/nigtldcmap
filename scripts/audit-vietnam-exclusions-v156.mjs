#!/usr/bin/env node
/**
 * V156-D: every element decided not to be offered, checked end to end.
 *
 * The decisions (config/data-publication/vietnam-exclusions-v156.json: user
 * review 2026-09-23 for six, data specification 2026-09-18 for four) withdraw
 * the offer and nothing else: the framework keeps its full size, the files stay.
 * A reader must not meet an excluded element in the finder list, the search,
 * a category count, a home card or figure, or the download list; its own URL
 * shows one notice card with the decision, the reason and the date, and no
 * chart, table or download.
 *
 * Every count here is derived from catalog.json and manifest.json - the full
 * set is the catalog, the public set is publicStatus not in {excluded,
 * not-provided} - so a later decision changes the data, not this audit.
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

import { AuditV125, PROJECT_ROOT, V2_ROOT, catalogElements, readJson } from "./v125/audit-utils.mjs";
import { evaluateValue, launchHeadlessBrowser, navigate, setViewport, startStaticBuildServer, waitForValue } from "./v125/browser-runtime.mjs";
import { detailUrlV135, finderUrlV135 } from "./v135/audit-helpers.mjs";
import { auditExcludedNoticesV156, excludedElementsV156, publicListedElementsV156 } from "./v156/exclusions-audit-v156.mjs";
import { exclusionDecisionsV158 } from "./v158/exclusion-decisions-v158.mjs";

const audit = new AuditV125("exclusions:v156");
const catalog = catalogElements(readJson(resolve(V2_ROOT, "catalog.json")).value);
const manifest = readJson(resolve(V2_ROOT, "manifest.json")).value || {};
// V158: the decision common to every country plus the default country's own.
const decisionDoc = exclusionDecisionsV158(PROJECT_ROOT, "VNM");
const cardDoc = readJson(resolve(V2_ROOT, "home/card-summaries-v140.json")).value || {};
const homePreview = readJson(resolve(V2_ROOT, "home/home-preview-v139.json")).value || {};

const decisions = Array.isArray(decisionDoc.exclusions) ? decisionDoc.exclusions : [];
const publicSet = publicListedElementsV156(catalog);
const excluded = excludedElementsV156(catalog);
const excludedIds = new Set(excluded.map((element) => String(element.elementId)));
// V165-2 (user decision 2026-10-05, reports/v165/REVIEW_V165_2.md): an element
// outside the 2026 collection scope with nothing delivered is "not-provided"
// (config/data-publication/collection-scope-v165.json). It is unlisted like a
// decided exclusion - every absence check below still covers it - but no
// decision names it, and its page is the ordinary detail page marked '현재
// 제공하지 않음', not the decision's notice card. The decision checks read the
// decided set (publicStatus "excluded") only.
const decided = catalog.filter((element) => String(element.publicStatus) === "excluded");
const decidedIds = new Set(decided.map((element) => String(element.elementId)));
const notProvidedIds = [...excludedIds].filter((id) => !decidedIds.has(id)).sort();
const hasDownloadAssets = (element) =>
  Array.isArray(element?.downloadAssets) ? element.downloadAssets.length > 0 : Boolean(element?.downloadAssets && Object.keys(element.downloadAssets).length);
const publicDownloadable = publicSet.filter(hasDownloadAssets).length;
const cards = Array.isArray(cardDoc.cards) ? cardDoc.cards : Object.values(cardDoc.cards || {});

// ---- data: the decisions, the catalog and the counts agree -----------------
const decisionIds = new Set(decisions.map((row) => String(row.elementId)));
audit.check(
  "EXCLUSION_DECISIONS_MATCH_CATALOG",
  decisionIds.size === decidedIds.size &&
    [...decisionIds].every((id) => decidedIds.has(id)) &&
    Number(decisionDoc.exclusionCount) === decisions.length,
  { decisions: [...decisionIds].sort(), catalogExcluded: [...decidedIds].sort(), notProvided: notProvidedIds, declared: decisionDoc.exclusionCount },
  "same elements, declared count = list"
);
const fieldMismatches = decisions
  .map((row) => {
    const element = catalog.find((item) => item.elementId === row.elementId);
    const exclusion = element?.exclusion || {};
    const problems = [];
    for (const key of ["reason", "basis", "decidedAt"]) {
      if (!String(row[key] || "").trim()) problems.push(`${key} empty in the decision`);
      if (String(exclusion[key] || "") !== String(row[key] || "")) problems.push(`${key} differs in the catalog`);
    }
    return { elementId: row.elementId, problems };
  })
  .filter((row) => row.problems.length > 0);
audit.check("EXCLUSION_DECISION_FIELDS", fieldMismatches.length === 0, fieldMismatches, []);
audit.check(
  "FRAMEWORK_SET_UNCHANGED",
  catalog.length === Number(manifest.frameworkElements) && catalog.length === Number(manifest.accountedElements),
  { catalog: catalog.length, frameworkElements: manifest.frameworkElements, accountedElements: manifest.accountedElements },
  "catalog = manifest framework = accounted"
);
const statusCounts = manifest.publicStatusCounts || {};
const manifestPublic = Number(manifest.frameworkElements) - Number(statusCounts.excluded || 0) - Number(statusCounts["not-provided"] || 0);
audit.check(
  "PUBLIC_SET_DERIVED",
  publicSet.length === catalog.length - excluded.length && publicSet.length === manifestPublic,
  { publicSet: publicSet.length, catalogMinusExcluded: catalog.length - excluded.length, manifestPublic },
  "public = full - excluded (catalog and manifest agree)"
);
audit.check(
  "EXCLUDED_DOWNLOAD_NOT_OFFERED_DATA",
  excluded.every((element) => element.downloadAllowed === false) && Number(manifest.downloadableElementCount) === publicDownloadable,
  {
    downloadAllowed: excluded.filter((element) => element.downloadAllowed !== false).map((element) => element.elementId),
    downloadableElementCount: manifest.downloadableElementCount,
    publicWithDownloadAssets: publicDownloadable,
  },
  { downloadAllowed: [], downloadableElementCount: publicDownloadable }
);
const cardIds = cards.map((card) => String(card?.elementId));
const previewIds = JSON.stringify(homePreview).match(/"[A-E]-\d{3}"/gu) || [];
audit.check(
  "EXCLUDED_ABSENT_FROM_HOME_DATA",
  cardIds.length === publicSet.length && !cardIds.some((id) => excludedIds.has(id)) && !previewIds.some((token) => excludedIds.has(token.slice(1, -1))),
  { cards: cardIds.length, excludedCards: cardIds.filter((id) => excludedIds.has(id)), excludedInPreview: previewIds.filter((token) => excludedIds.has(token.slice(1, -1))) },
  { cards: publicSet.length, excludedCards: [], excludedInPreview: [] }
);

// ---- screens ---------------------------------------------------------------
const setSelectValue = (selectExpression, value) => `(() => {
  const select = ${selectExpression};
  if (!select) return false;
  Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, 'value').set.call(select, ${JSON.stringify(value)});
  select.dispatchEvent(new Event('change', { bubbles: true }));
  return true;
})()`;
const CATEGORY_SELECT = `[...document.querySelectorAll('select')].find((node) => [...node.options].some((option) => option.value === 'A') && [...node.options].some((option) => option.value === 'E'))`;
const FINDER_IDS = `[...document.querySelectorAll('[data-testid="public-finder-card-v135"]')].map((node) => node.getAttribute('data-element-id'))`;

let server = null;
let browser = null;
let runtimeFailure = null;
let finder = null;
const categories = [];
const search = [];
let searchControl = null;
const home = { sorts: [], figures: null };
let downloads = null;
let notices = [];
try {
  server = await startStaticBuildServer(resolve(PROJECT_ROOT, "build"));
  browser = await launchHeadlessBrowser();
  const cdp = browser.cdp;
  await setViewport(cdp, 1440, 1100);

  // Finder: load every card the list offers.
  await navigate(cdp, finderUrlV135(server.url));
  await waitForValue(cdp, `document.querySelectorAll('[data-testid="public-finder-card-v135"]').length > 0`, { timeoutMs: 35_000 });
  for (let guard = 0; guard < 20; guard += 1) {
    const count = Number(await evaluateValue(cdp, `document.querySelectorAll('[data-testid="public-finder-card-v135"]').length`));
    if (count >= publicSet.length) break;
    await evaluateValue(cdp, `(() => { window.scrollTo(0, document.documentElement.scrollHeight); return true; })()`);
    try {
      await waitForValue(cdp, `document.querySelectorAll('[data-testid="public-finder-card-v135"]').length > ${count}`, { timeoutMs: 8_000 });
    } catch {
      break;
    }
  }
  const finderIds = await evaluateValue(cdp, FINDER_IDS);
  finder = {
    count: finderIds.length,
    total: Number(await evaluateValue(cdp, `document.querySelector('[data-testid="finder-results-v136"]')?.getAttribute('data-total-count')`)),
    excluded: finderIds.filter((id) => excludedIds.has(id)),
  };

  // Category counts: each category's total against the public set.
  const codes = [...new Set(catalog.map((element) => String(element.categoryCode || "")).filter(Boolean))].sort();
  for (const code of codes) {
    await evaluateValue(cdp, setSelectValue(CATEGORY_SELECT, code));
    const expected = publicSet.filter((element) => element.categoryCode === code).length;
    await waitForValue(cdp, `document.querySelector('[data-testid="finder-results-v136"]')?.getAttribute('data-total-count') === '${expected}'`, { timeoutMs: 10_000 }).catch(() => null);
    const shown = Number(await evaluateValue(cdp, `document.querySelector('[data-testid="finder-results-v136"]')?.getAttribute('data-total-count')`));
    categories.push({ code, shown, expected, full: catalog.filter((element) => element.categoryCode === code).length });
  }
  await evaluateValue(cdp, setSelectValue(CATEGORY_SELECT, "all"));

  // Search: an excluded element's own label finds nothing of it; a public
  // element's label still finds that element (the search itself works).
  const runSearch = async (query) => {
    await evaluateValue(cdp, `(() => { const input = document.querySelector('.global-search-v41-input-wrap input'); if (!input) return false; Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(input, ${JSON.stringify(query)}); input.dispatchEvent(new Event('input', { bubbles: true })); return true; })()`);
    await new Promise((resolveWait) => setTimeout(resolveWait, 900));
    return evaluateValue(cdp, `[...document.querySelectorAll('.global-search-v128-result[data-element-id]')].map((node) => node.getAttribute('data-element-id'))`);
  };
  await evaluateValue(cdp, `(() => { document.querySelector('.header-search-v41-trigger')?.click(); return true; })()`);
  await waitForValue(cdp, `Boolean(document.querySelector('.global-search-v41-input-wrap input'))`, { timeoutMs: 10_000 });
  const control = publicSet.find((element) => String(element.elementLabel || "").length >= 4);
  if (control) {
    let ids = await runSearch(String(control.elementLabel));
    // V162 (CI run 6): the first query also loads the search index; on a slow
    // runner it outlasts the 0.9 s settle. The control waits until its own
    // element appears (or 20 s pass); the excluded queries below then run
    // against a loaded index with the same settle as before.
    if (!ids.includes(control.elementId)) {
      await waitForValue(cdp, `[...document.querySelectorAll('.global-search-v128-result[data-element-id]')].some((node) => node.getAttribute('data-element-id') === ${JSON.stringify(control.elementId)})`, { timeoutMs: 20_000 }).catch(() => null);
      ids = await evaluateValue(cdp, `[...document.querySelectorAll('.global-search-v128-result[data-element-id]')].map((node) => node.getAttribute('data-element-id'))`);
    }
    searchControl = { elementId: control.elementId, query: control.elementLabel, found: ids.includes(control.elementId) };
  }
  for (const element of excluded) {
    const ids = await runSearch(String(element.elementLabel || element.elementId));
    search.push({ elementId: element.elementId, query: element.elementLabel, found: ids.includes(element.elementId) });
  }
  await evaluateValue(cdp, `(() => { document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true })); return true; })()`);

  // Home: both orders of the featured cards, and the two figures.
  await navigate(cdp, `${server.url.replace(/\/$/u, "")}/#home`);
  await waitForValue(cdp, `document.querySelectorAll('.home-featured-v139__card[data-element-id]').length > 0`, { timeoutMs: 35_000 });
  for (const label of ["조회순", "최신순"]) {
    await evaluateValue(cdp, `(() => { const button = [...document.querySelectorAll('.home-sort-v149 button')].find((node) => node.textContent.trim() === ${JSON.stringify(label)}); button?.click(); return Boolean(button); })()`);
    await new Promise((resolveWait) => setTimeout(resolveWait, 600));
    const ids = await evaluateValue(cdp, `[...document.querySelectorAll('.home-featured-v139__card[data-element-id]')].map((node) => node.getAttribute('data-element-id'))`);
    home.sorts.push({ label, ids, excluded: ids.filter((id) => excludedIds.has(id)) });
  }
  home.figures = await evaluateValue(cdp, `(() => {
    const read = (label) => { const row = [...document.querySelectorAll('.home-status-v139 dl > div')].find((node) => node.querySelector('dt')?.textContent.trim() === label); return Number((row?.querySelector('dd')?.textContent || '').replace(/[^0-9]/g, '')) || null; };
    return { items: read('전체 데이터 항목'), downloadable: read('다운로드 가능 항목') };
  })()`);

  // Downloads: the list offers no excluded element.
  await navigate(cdp, `${server.url.replace(/\/$/u, "")}/?country=VNM#download`);
  await waitForValue(cdp, `document.querySelectorAll('.cdp-download-item[data-element-id]').length > 0`, { timeoutMs: 35_000 });
  const downloadIds = await evaluateValue(cdp, `[...document.querySelectorAll('.cdp-download-item[data-element-id]')].map((node) => node.getAttribute('data-element-id'))`);
  downloads = { count: downloadIds.length, excluded: downloadIds.filter((id) => excludedIds.has(id)) };

  // Direct URLs: one notice card each.
  notices = await auditExcludedNoticesV156({ cdp, baseUrl: server.url, elements: decided, detailUrl: detailUrlV135, navigate, waitForValue, evaluateValue });
} catch (error) {
  runtimeFailure = error instanceof Error ? error.message : String(error);
} finally {
  if (browser) await browser.close();
  if (server) await server.close();
}

audit.check("EXCLUSIONS_RUNTIME", runtimeFailure === null, { runtimeFailure }, { runtimeFailure: null });
audit.check(
  "EXCLUDED_ABSENT_FROM_FINDER",
  finder !== null && finder.excluded.length === 0 && finder.count === publicSet.length && finder.total === publicSet.length,
  finder,
  { count: publicSet.length, total: publicSet.length, excluded: [] }
);
audit.check(
  "CATEGORY_COUNTS_PUBLIC_ONLY",
  categories.length > 0 && categories.every((row) => row.shown === row.expected),
  categories,
  "each category shows its public elements only"
);
audit.check(
  "EXCLUDED_ABSENT_FROM_SEARCH",
  searchControl?.found === true && search.length === excluded.length && search.every((row) => row.found === false),
  { control: searchControl, excluded: search },
  { control: "public label found", excluded: "no excluded element found by its own label" }
);
audit.check(
  "EXCLUDED_ABSENT_FROM_HOME",
  home.sorts.length === 2 &&
    home.sorts.every((row) => row.ids.length > 0 && row.excluded.length === 0) &&
    home.figures?.items === publicSet.length &&
    home.figures?.downloadable === publicDownloadable,
  home,
  { excluded: [], items: publicSet.length, downloadable: publicDownloadable }
);
audit.check(
  "EXCLUDED_DOWNLOAD_NOT_OFFERED",
  downloads !== null && downloads.excluded.length === 0 && downloads.count === publicSet.length,
  downloads,
  { count: publicSet.length, excluded: [] }
);
audit.check(
  "EXCLUDED_DETAIL_NOTICE",
  notices.length === decided.length && notices.every((row) => row.pass),
  notices.map((row) => ({ elementId: row.elementId, pass: row.pass, problems: row.problems, publicNotice: row.snapshot?.publicNotice, cardText: row.snapshot?.cardText })),
  "title + the decision's public line (V156-E, 기준서 v1.1 표 13); no decision record (reason, basis, date); no chart, table or download"
);

const summary = audit.finish({
  frameworkElements: catalog.length,
  publicElements: publicSet.length,
  excludedElements: [...decidedIds].sort(),
  notProvidedElements: notProvidedIds,
  publicDownloadable,
});
const out = resolve(PROJECT_ROOT, "reports/v156/exclusions-audit-v156.json");
mkdirSync(resolve(out, ".."), { recursive: true });
writeFileSync(out, `${JSON.stringify({ generatedAt: new Date().toISOString(), summary, checks: audit.checks }, null, 2)}\n`);
