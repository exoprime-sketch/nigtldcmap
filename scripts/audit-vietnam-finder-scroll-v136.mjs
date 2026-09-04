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
import { detailUrlV135, finderUrlV135 } from "./v135/audit-helpers.mjs";
import { finishAuditV136 } from "./v136/audit-helpers.mjs";

const audit = new AuditV125("finder-scroll:v136");
const finderSource = readFileSync(
  resolve(PROJECT_ROOT, "src/pages/DataExplorerPage.tsx"),
  "utf8"
);

const CARD_COUNT = `document.querySelectorAll('[data-testid="public-finder-card-v135"]').length`;
const VIEWPORTS = [390, 768, 1024, 1280, 1440, 1920];

/** The finder deliberately remembers where a reader was, so a scenario that
 *  needs a first visit has to clear that memory first. The finder writes its
 *  state as it unmounts, so the clear happens from another route. */
async function clearFinderMemory(cdp, origin) {
  await navigate(cdp, detailUrlV135(origin, "A-016"));
  await waitForValue(
    cdp,
    'Boolean(document.querySelector(\'[data-testid="public-analysis-root"]\'))',
    { timeoutMs: 35_000 }
  );
  await evaluateValue(cdp, "(() => { sessionStorage.clear(); return true; })()");
}

/** `html` carries `scroll-behavior: smooth`, which `behavior: 'auto'` defers
 *  to, so an audit that scrolls the ordinary way reads positions from the
 *  middle of an easing curve and never twice gets the same number. */
async function scrollToBottom(cdp) {
  await evaluateValue(
    cdp,
    `(() => { window.scrollTo({ top: document.body.scrollHeight, behavior: 'instant' }); return true; })()`
  );
}

/** Waits until the offset stops moving, so "where the reader is" is a settled
 *  fact rather than a sample of an animation still in flight. */
async function settledScrollY(cdp) {
  // waitForValue resolves on truthiness, so a settled offset of 0 reports as
  // -1 and is mapped back here.
  const settled = Number(
    await waitForValue(
      cdp,
      `(() => {
        const now = Math.round(window.scrollY);
        const repeats = window.__v136SettleY === now
          ? (window.__v136SettleN || 0) + 1
          : 0;
        window.__v136SettleY = now;
        window.__v136SettleN = repeats;
        return repeats >= 2 ? now || -1 : 0;
      })()`,
      { timeoutMs: 15_000, intervalMs: 60 }
    )
  );
  return settled === -1 ? 0 : settled;
}

/** Reveals batches by scrolling, recording the count after each settle. */
async function revealSequence(cdp, limit = 12) {
  const sequence = [Number(await evaluateValue(cdp, CARD_COUNT))];
  for (let step = 0; step < limit; step += 1) {
    const before = sequence[sequence.length - 1];
    await scrollToBottom(cdp);
    try {
      await waitForValue(cdp, `${CARD_COUNT} > ${before}`, { timeoutMs: 8_000 });
    } catch {
      break;
    }
    sequence.push(Number(await evaluateValue(cdp, CARD_COUNT)));
    if (sequence[sequence.length - 1] >= 152) break;
  }
  return sequence;
}

let server = null;
let browser = null;
let runtimeFailure = null;
let initialCount = null;
let sequence = [];
let duplicateCards = null;
let visibleLoadMore = null;
let filterReset = null;
let backNav = null;
let ariaContract = null;
const responsive = [];

try {
  if (!existsSync(resolve(PROJECT_ROOT, "build/index.html"))) {
    throw new Error("production build missing; run npm run build first");
  }
  server = await startStaticBuildServer(resolve(PROJECT_ROOT, "build"));
  browser = await launchHeadlessBrowser();
  await setViewport(browser.cdp, 1440, 1000);

  await navigate(browser.cdp, finderUrlV135(server.url));
  await waitForValue(browser.cdp, `${CARD_COUNT} > 0`, { timeoutMs: 35_000 });
  initialCount = Number(await evaluateValue(browser.cdp, CARD_COUNT));

  visibleLoadMore = await evaluateValue(
    browser.cdp,
    `(() => {
      const visible = (node) => {
        const rect = node.getBoundingClientRect();
        const style = getComputedStyle(node);
        return rect.width > 0 && rect.height > 0 && style.display !== 'none' &&
          style.visibility !== 'hidden' && Number(style.opacity || 1) > 0;
      };
      return [...document.querySelectorAll('button, a')]
        .filter(visible)
        .filter((node) => /더\\s*보기|다음|계속\\s*보기|모두\\s*불러/u.test(String(node.textContent || '')))
        .map((node) => String(node.textContent || '').trim())
        .length;
    })()`
  );

  sequence = await revealSequence(browser.cdp);

  duplicateCards = await evaluateValue(
    browser.cdp,
    `(() => {
      const ids = [...document.querySelectorAll('[data-testid="public-finder-card-v135"]')]
        .map((node) => node.getAttribute('data-element-id') || '');
      return ids.length - new Set(ids).size;
    })()`
  );

  ariaContract = await evaluateValue(
    browser.cdp,
    `(() => {
      const results = document.querySelector('[data-testid="finder-results-v136"]');
      const sentinel = document.querySelector('[data-testid="finder-scroll-sentinel-v136"]');
      return {
        busyAttributePresent: results?.hasAttribute('aria-busy') || false,
        busySettled: results?.getAttribute('aria-busy') === 'false',
        sentinelFocusable: sentinel ? sentinel.tabIndex >= 0 : false,
        sentinelHidden: sentinel ? sentinel.getAttribute('aria-hidden') === 'true' : true,
      };
    })()`
  );

  // changing the query must start a fresh list
  await evaluateValue(
    browser.cdp,
    `(() => {
      const input = [...document.querySelectorAll('.cdp-filter-panel input.cdp-input')]
        .find((node) => node instanceof HTMLInputElement);
      if (!(input instanceof HTMLInputElement)) return false;
      const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
      setter.call(input, '에너지');
      input.dispatchEvent(new Event('input', { bubbles: true }));
      return true;
    })()`
  );
  let observedMinimum = Number.POSITIVE_INFINITY;
  let settled = null;
  for (let sample = 0; sample < 40; sample += 1) {
    settled = await evaluateValue(
      browser.cdp,
      `(() => {
        const results = document.querySelector('[data-testid="finder-results-v136"]');
        return {
          visible: Number(results?.getAttribute('data-visible-count') || 0),
          total: Number(results?.getAttribute('data-total-count') || 0),
        };
      })()`
    );
    if (settled && settled.total > 0 && settled.total !== 152) {
      observedMinimum = Math.min(observedMinimum, settled.visible);
    }
    await new Promise((resolveWait) => setTimeout(resolveWait, 40));
  }
  filterReset = {
    ...settled,
    resetTo: Number.isFinite(observedMinimum) ? observedMinimum : null,
  };

  // back navigation restores the revealed rows and the offset
  await clearFinderMemory(browser.cdp, server.url);
  await navigate(browser.cdp, finderUrlV135(server.url));
  await waitForValue(browser.cdp, `${CARD_COUNT} > 0`, { timeoutMs: 35_000 });
  await revealSequence(browser.cdp, 3);
  await settledScrollY(browser.cdp);
  const beforeLeave = await evaluateValue(
    browser.cdp,
    `(() => ({
      count: ${CARD_COUNT},
      scrollY: Math.round(window.scrollY),
      maxScrollY: Math.round(document.scrollingElement.scrollHeight - window.innerHeight),
    }))()`
  );
  await navigate(browser.cdp, detailUrlV135(server.url, "A-016"));
  await waitForValue(
    browser.cdp,
    `Boolean(document.querySelector('[data-testid="public-analysis-root"]'))`,
    { timeoutMs: 35_000 }
  );
  const restoreStartedAt = Date.now();
  await evaluateValue(browser.cdp, `(() => { history.back(); return true; })()`);
  await waitForValue(browser.cdp, `${CARD_COUNT} > 0`, { timeoutMs: 35_000 });
  // The finder says when it has finished putting the reader back. Waiting on
  // that instead of a fixed delay means the audit and the product agree on
  // what "restored" means, on a fast laptop and a loaded CI runner alike.
  await waitForValue(
    browser.cdp,
    `document.querySelector('[data-testid="finder-results-v136"]')
      ?.getAttribute('data-finder-restore-state') === 'settled'`,
    { timeoutMs: 35_000 }
  );
  const restoreDurationMs = Date.now() - restoreStartedAt;
  const afterBack = await evaluateValue(
    browser.cdp,
    `(() => {
      let saved = null;
      try { saved = JSON.parse(sessionStorage.getItem('cdp-finder-restore-v136') || 'null'); } catch (error) { saved = null; }
      const results = document.querySelector('[data-testid="finder-results-v136"]');
      return {
        count: ${CARD_COUNT},
        scrollY: Math.round(window.scrollY),
        maxScrollY: Math.round(document.scrollingElement.scrollHeight - window.innerHeight),
        savedScrollY: saved && Number.isFinite(saved.scrollY) ? Math.round(saved.scrollY) : null,
        restoreState: results ? results.getAttribute('data-finder-restore-state') : null,
      };
    })()`
  );
  backNav = { beforeLeave, afterBack, restoreDurationMs };

  for (const width of VIEWPORTS) {
    await setViewport(browser.cdp, width, width < 800 ? 900 : 1050);
    await clearFinderMemory(browser.cdp, server.url);
    await navigate(browser.cdp, finderUrlV135(server.url));
    await waitForValue(browser.cdp, `${CARD_COUNT} > 0`, { timeoutMs: 35_000 });
    const revealed = await revealSequence(browser.cdp, 2);
    const overflow = await evaluateValue(
      browser.cdp,
      `Math.max(document.documentElement.scrollWidth, document.body.scrollWidth) - window.innerWidth`
    );
    responsive.push({ width, revealed, overflow: Number(overflow) });
  }
} catch (error) {
  runtimeFailure = error instanceof Error ? error.message : String(error);
} finally {
  if (browser) await browser.close();
  if (server) await server.close();
}

const expectedSequence = [24, 48, 72, 96, 120, 144, 152];
const sequenceMatches =
  JSON.stringify(sequence) === JSON.stringify(expectedSequence);
const usesObserver =
  /new IntersectionObserver\(/u.test(finderSource) &&
  !/addEventListener\(\s*["']scroll["']/u.test(finderSource);
const responsiveGrew = responsive.filter(
  (row) => (row.revealed || []).length < 2 || row.revealed[1] <= row.revealed[0]
);
const responsiveOverflow = responsive.filter((row) => row.overflow > 1);

audit.check("FINDER_SCROLL_RUNTIME", runtimeFailure === null, { runtimeFailure }, { runtimeFailure: null });
audit.check("FINDER_LOAD_MORE_VISIBLE_COUNT", visibleLoadMore === 0, visibleLoadMore ?? null, 0);
audit.check("FINDER_INTERSECTION_OBSERVER", usesObserver, { usesObserver }, true);
audit.check("INITIAL_VISIBLE_COUNT", initialCount === 24, initialCount ?? null, 24);
audit.check("AUTO_LOAD_SEQUENCE", sequenceMatches, sequence, expectedSequence);
audit.check("DUPLICATE_CARD_COUNT", duplicateCards === 0, duplicateCards ?? null, 0);
audit.check(
  "FILTER_RESET_VISIBLE_COUNT",
  filterReset?.resetTo === 24 || (filterReset?.total ?? 0) < 24,
  filterReset,
  { resetTo: 24 }
);
audit.check("BACK_NAV_VISIBLE_COUNT_RESTORED", Number(backNav?.afterBack?.count || 0) >= Number(backNav?.beforeLeave?.count || 0), backNav, "restored revealed rows");
const scrollDrift = Math.abs(
  Number(backNav?.afterBack?.scrollY || 0) - Number(backNav?.beforeLeave?.scrollY || 0)
);
audit.check(
  "BACK_NAV_SCROLL_RESTORED",
  backNav !== null &&
    backNav.afterBack?.restoreState === "settled" &&
    scrollDrift <= 200,
  { ...backNav, scrollDrift },
  "settled within 200px of the previous offset"
);
audit.check("ARIA_BUSY_CONTRACT", ariaContract?.busyAttributePresent === true && ariaContract?.busySettled === true && ariaContract?.sentinelFocusable === false, ariaContract, { busyAttributePresent: true, busySettled: true, sentinelFocusable: false });
audit.check("FINDER_RESPONSIVE_AUTOLOAD", responsiveGrew.length === 0, responsiveGrew.map((row) => ({ width: row.width, revealed: row.revealed })), []);
audit.check("FINDER_RESPONSIVE_OVERFLOW", responsiveOverflow.length === 0, responsiveOverflow.map((row) => ({ width: row.width, overflow: row.overflow })), []);
audit.check("CONSOLE_ERROR", (browser?.runtimeErrors || []).length === 0, browser?.runtimeErrors || [], []);

finishAuditV136(audit, "finder-scroll-audit-v136.json", {
  finderLoadMoreVisibleCount: visibleLoadMore,
  finderIntersectionObserver: usesObserver,
  initialVisibleCount: initialCount,
  autoLoadSequence: sequence,
  duplicateCardCount: duplicateCards,
  filterReset,
  backNav: backNav && {
    ...backNav,
    savedScrollY: backNav.afterBack?.savedScrollY ?? null,
    finalScrollY: backNav.afterBack?.scrollY ?? null,
    scrollDrift,
    maxScrollY: backNav.afterBack?.maxScrollY ?? null,
    restoreState: backNav.afterBack?.restoreState ?? null,
    restoreDuration: backNav.restoreDurationMs ?? null,
  },
  ariaContract,
  responsive,
  runtimeFailure,
});
