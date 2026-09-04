#!/usr/bin/env node

import { existsSync } from "node:fs";
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
import { finderUrlV135, finishAuditV135 } from "./v135/audit-helpers.mjs";

const audit = new AuditV125("finder-card:v135");
const catalogResult = readJson(resolve(V2_ROOT, "catalog.json"));
const catalog = catalogElements(catalogResult.value);

let server = null;
let browser = null;
let runtimeFailure = null;
let snapshot = null;
const brokenAssets = [];
try {
  if (!existsSync(resolve(PROJECT_ROOT, "build/index.html"))) {
    throw new Error("production build missing; run npm run build before finder card audit");
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
  await navigate(browser.cdp, finderUrlV135(server.url));
  await waitForValue(
    browser.cdp,
    `document.querySelectorAll('[data-testid="public-finder-card-v135"]').length > 0`,
    { timeoutMs: 35_000 }
  );
  // The finder reveals results progressively. V136 replaced the "더 보기"
  // control with scroll-driven loading, so the census reveals the remaining
  // cards by scrolling. The guarantee is unchanged: all 152 public elements
  // must be inspected.
  for (let guard = 0; guard < 40; guard += 1) {
    const count = Number(
      await evaluateValue(
        browser.cdp,
        `document.querySelectorAll('[data-testid="public-finder-card-v135"]').length`
      )
    );
    if (count >= 152) break;
    await evaluateValue(
      browser.cdp,
      `(() => { window.scrollTo(0, document.body.scrollHeight); return true; })()`
    );
    try {
      await waitForValue(
        browser.cdp,
        `document.querySelectorAll('[data-testid="public-finder-card-v135"]').length > ${count}`,
        { timeoutMs: 8_000 }
      );
    } catch {
      break;
    }
  }
  await waitForValue(
    browser.cdp,
    `document.querySelectorAll('[data-testid="public-finder-card-v135"]').length === 152`,
    { timeoutMs: 35_000 }
  );
  snapshot = await evaluateValue(
    browser.cdp,
    `(() => {
      const clean = (value) => String(value || '').normalize('NFC').replace(/\\s+/gu, ' ').trim();
      const cards = [...document.querySelectorAll('[data-testid="public-finder-card-v135"]')].map((card, index) => {
        const titleNode = card.querySelector('h2, h3, [data-testid="finder-card-title-v135"]');
        const descriptionNode = card.querySelector('[data-testid="finder-card-description-v135"], .cdp-dataset-card__description, p');
        const tagNodes = [...card.querySelectorAll('[data-testid="finder-card-tags-v135"] > *, [data-finder-tag-v135]')];
        const actionNodes = [...card.querySelectorAll('a, button')];
        const title = clean(titleNode?.textContent);
        const description = clean(descriptionNode?.textContent);
        const tags = [...new Set(tagNodes.map((node) => clean(node.textContent)).filter(Boolean))];
        const actions = actionNodes.map((node) => ({
          label: clean(node.textContent || node.getAttribute('aria-label')),
          href: node instanceof HTMLAnchorElement ? node.getAttribute('href') || '' : '',
        }));
        const text = clean(card.textContent);
        const internal = text.match(/데이터\\s*제공|화면에서만\\s*제공|실제\\s*레코드|주요\\s*분류\\s*차원|공간표현(?:\\s*미확보)?|다운로드\\s*(?:가능|자료\\s*없음)|public-authorized|data-entry-planned|not-collected|downloadEligible/giu) || [];
        return {
          index,
          elementId: card.getAttribute('data-element-id') || card.getAttribute('data-map-element') || '',
          title,
          description,
          tags,
          actions,
          internal,
          breadcrumb: [...card.querySelectorAll('.cdp-card__breadcrumb span, [data-testid="finder-card-breadcrumb-v135"] span')]
            .map((node) => clean(node.textContent))
            .filter(Boolean),
          blankTitle: !title,
          duplicateTitleTag: tags.some((tag) => tag === title),
          invalidAction: actions.some((action) => /undefined|null|#undefined|#null/iu.test(action.href)),
          dataAction: actions.some((action) => /데이터\\s*보기/u.test(action.label)),
        };
      });
      return {
        cards,
        h1: clean(document.querySelector('main h1')?.textContent),
        pageOverflow: Math.max(document.documentElement.scrollWidth, document.body.scrollWidth) - innerWidth,
      };
    })()`
  );
} catch (error) {
  runtimeFailure = error instanceof Error ? error.message : String(error);
} finally {
  if (browser) await browser.close();
  if (server) await server.close();
}

const cards = Array.isArray(snapshot?.cards) ? snapshot.cards : [];
const internalMetadata = cards.flatMap((card) =>
  card.internal.map((token) => ({ elementId: card.elementId, token }))
);
const duplicateMeasureTitles = cards.filter((card) => card.duplicateTitleTag);
const blankTitles = cards.filter((card) => card.blankTitle);
const missingDataActions = cards.filter((card) => !card.dataAction);
const overTagged = cards.filter((card) => card.tags.length > 3);

// A card has one sentence to tell the reader what they can find out. A
// description that names a shelf ("... 관련 자료"), repeats the dataset name, or
// echoes only its category tells them nothing.
const GENERIC_DESCRIPTION_PATTERNS_V135 = [
  /관련\s*자료/u,
  /^정보\s*관련/u,
  /^자료\s*모음/u,
];
const genericDescriptions = cards.filter((card) => {
  const description = String(card.description || "").trim();
  if (!description) return true;
  if (description.length < 10) return true;
  if (GENERIC_DESCRIPTION_PATTERNS_V135.some((pattern) => pattern.test(description))) {
    return true;
  }
  const title = String(card.title || "").trim();
  if (title && description === title) return true;
  // nothing said beyond the dataset name itself
  if (title && description.replace(title, "").replace(/[의·\s]/gu, "").length < 6) {
    return true;
  }
  const shelves = (card.breadcrumb || []).map((value) => String(value).trim());
  if (shelves.some((shelf) => shelf && description === shelf)) return true;
  return false;
});
const invalidActions = cards.filter((card) => card.invalidAction);

audit.check("FRAMEWORK_ELEMENTS", catalog.length === 152, catalog.length, 152);
audit.check("FINDER_CARD_RUNTIME_COVERAGE", runtimeFailure === null && cards.length === 152, { runtimeFailure, cardCount: cards.length }, { cardCount: 152 });
audit.check("FINDER_INTERNAL_METADATA_COUNT", internalMetadata.length === 0, internalMetadata, []);
audit.check("FINDER_DUPLICATE_MEASURE_TITLE_COUNT", duplicateMeasureTitles.length === 0, duplicateMeasureTitles, []);
audit.check(
  "GENERIC_FINDER_DESCRIPTION_COUNT",
  genericDescriptions.length === 0,
  genericDescriptions
    .slice(0, 20)
    .map((card) => ({ elementId: card.elementId, title: card.title, description: card.description })),
  []
);
audit.check("FINDER_BLANK_PUBLIC_TITLE_COUNT", blankTitles.length === 0, blankTitles, []);
audit.check("FINDER_PRIMARY_ACTION_COVERAGE", missingDataActions.length === 0, missingDataActions, []);
audit.check("FINDER_TAG_MAXIMUM", overTagged.length === 0, overTagged, []);
audit.check("FINDER_BROKEN_ACTION", invalidActions.length === 0, invalidActions, []);
audit.check("FINDER_HORIZONTAL_OVERFLOW", Number(snapshot?.pageOverflow || 0) <= 1, snapshot?.pageOverflow ?? null, "<=1px");
audit.check("BROKEN_ASSET", brokenAssets.length === 0, brokenAssets, []);
audit.check("CONSOLE_ERROR", (browser?.runtimeErrors || []).length === 0, browser?.runtimeErrors || [], []);

finishAuditV135(audit, "finder-card-audit-v135.json", {
  cardCount: cards.length,
  finderInternalMetadataCount: internalMetadata.length,
  finderDuplicateMeasureTitleCount: duplicateMeasureTitles.length,
  genericFinderDescriptionCount: genericDescriptions.length,
  finderDescriptionCoverage: cards.filter((card) => String(card.description || "").trim()).length,
  runtimeFailure,
});
