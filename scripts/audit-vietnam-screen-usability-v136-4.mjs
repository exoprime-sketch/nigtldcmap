#!/usr/bin/env node

/**
 * V136.4 existing-screen usability acceptance.
 *
 * The home page put a term-help trigger inside the download button, so the
 * markup nested one button in another. The browser does not keep that nesting:
 * it breaks the inner control out, and the card's descendant CSS rule styled it
 * as a third card. Opening the help and navigating away were the same gesture.
 *
 * A rule about markup is only worth having if something checks it, so this
 * walks the public screens and reads what the browser actually built, rather
 * than what the JSX says. It also checks the two things that go wrong when a
 * filter is labelled for one physical quantity and offers another.
 */

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
import { detailUrlV135 } from "./v135/audit-helpers.mjs";
import { finishAuditV136, writeCsvV136 } from "./v136/audit-helpers.mjs";

const audit = new AuditV125("screen-usability:v136-4");
const catalog = catalogElements(readJson(resolve(V2_ROOT, "catalog.json")).value);
const ELEMENT_IDS = catalog.map((item) => item.elementId);

const ANALYSIS_READY = `(() => {
  const root = document.querySelector('[data-testid="public-analysis-root"]');
  if (!root || root.getAttribute('data-analysis-state') !== 'ready') return false;
  return root.querySelectorAll('[data-testid="public-analysis-pending"]').length === 0;
})()`;

const BODY_READY = `Boolean(document.querySelector('main, [data-testid="public-analysis-root"]'))`;

/**
 * Interactive controls that contain another one.
 *
 * Read from the built DOM: a button written inside a button does not survive
 * parsing, so the JSX is not evidence either way and only the tree the browser
 * produced can say whether the nesting is gone.
 */
const NESTED_CONTROLS = `(() => {
  const clean = (value) => String(value || '').replace(/\\s+/gu, ' ').trim().slice(0, 120);
  // A command: something that does one thing when it is activated. Nesting a
  // control inside one of these is what breaks - the parser moves the inner
  // button out of the outer, and a single click runs both. A focusable
  // container (a chart row carrying tabindex, an <svg> whose <g> elements take
  // arrow keys) is not a command and legitimately holds controls, so it is not
  // what this looks for.
  const COMMAND = 'a[href], button, select, textarea, input:not([type="hidden"]), [role="button"], [role="link"]';
  const visible = (node) => {
    const rect = node.getBoundingClientRect();
    const style = getComputedStyle(node);
    return rect.width > 0 && rect.height > 0 && style.display !== 'none' &&
      style.visibility !== 'hidden';
  };
  return [...document.querySelectorAll(COMMAND)]
    .filter((node) => !(node.ownerSVGElement || node.tagName === 'svg'))
    .filter(visible)
    .flatMap((outer) =>
      [...outer.querySelectorAll(COMMAND)]
        .filter(visible)
        .map((inner) => ({
          outer: outer.tagName.toLowerCase(),
          inner: inner.tagName.toLowerCase(),
          outerText: clean(outer.textContent),
          innerText: clean(inner.textContent),
          testId: outer.getAttribute('data-testid') || inner.getAttribute('data-testid') || '',
        }))
    );
})()`;

/**
 * Opens a term help and reports whether the page navigated with it.
 *
 * The help sits inside a card whose other child navigates. Clicking the "?"
 * should explain the acronym and leave the reader where they are.
 */
const TERM_HELP_BEHAVIOUR = `(async () => {
  const before = location.href;
  const trigger = [...document.querySelectorAll('[data-public-term-v134] button, button[data-public-term-v134]')]
    .find((node) => {
      const rect = node.getBoundingClientRect();
      return rect.width > 0 && rect.height > 0;
    });
  if (!trigger) return { found: false };
  trigger.click();
  // The state lands on the next render, so reading the attribute in the same
  // turn as the click reports whatever it held before it.
  await new Promise((done) =>
    requestAnimationFrame(() => requestAnimationFrame(done))
  );
  return {
    found: true,
    navigated: location.href !== before,
    hrefBefore: before,
    hrefAfter: location.href,
    // The trigger announces its own state, so that is what gets read: a help
    // that opens nothing still reports aria-expanded="false".
    explained: trigger.getAttribute('aria-expanded') === 'true',
  };
})()`;

/**
 * Selector options, with the label the reader is offered them under.
 *
 * A control named for a capacity must not offer a length: "399 KM" is the gas
 * pipeline's length and belongs to a different physical quantity than the
 * megawatts beside it.
 */
const SELECTOR_OPTIONS = `(() => {
  const clean = (value) => String(value || '').replace(/\\s+/gu, ' ').trim();
  const root = document.querySelector('[data-testid="public-selector"]');
  if (!root) return [];
  return [...root.querySelectorAll('label')].map((label) => ({
    label: clean(label.querySelector('span')?.textContent),
    options: [...(label.querySelector('select')?.options || [])].map((option) =>
      clean(option.textContent)
    ),
  }));
})()`;

/** Units of length, where a capacity control should only carry power. */
const LENGTH_UNIT = /(?:^|\s|\d)(?:km|m|미터|킬로미터)\b/iu;
const POWER_UNIT = /\bmw\b|메가와트/iu;
const CAPACITY_LABEL = /용량|capacity/iu;

let server = null;
let browser = null;
let runtimeFailure = null;
const nestedFindings = [];
const unitFindings = [];
const termHelpFindings = [];
const rows = [];

try {
  server = await startStaticBuildServer(resolve(PROJECT_ROOT, "build"));
  browser = await launchHeadlessBrowser();
  const cdp = browser.cdp;
  await setViewport(cdp, 1440, 1050);

  // The three top-level surfaces, then every detail screen.
  const shellRoutes = [
    { id: "home", url: server.url },
    { id: "explorer", url: `${server.url}?view=data&country=VNM` },
    { id: "map", url: `${server.url}?view=map&country=VNM` },
    { id: "download", url: `${server.url}?view=download&country=VNM` },
  ];

  for (const route of shellRoutes) {
    await navigate(cdp, route.url);
    await waitForValue(cdp, BODY_READY, { timeoutMs: 45_000 });
    const nested = await evaluateValue(cdp, NESTED_CONTROLS);
    for (const item of nested) nestedFindings.push({ route: route.id, ...item });
    rows.push({ route: route.id, surface: "shell", nested: nested.length });

    const help = await evaluateValue(cdp, TERM_HELP_BEHAVIOUR);
    if (help?.found) {
      if (help.navigated) {
        termHelpFindings.push({ route: route.id, reason: "navigated", ...help });
      }
      if (!help.explained) {
        termHelpFindings.push({ route: route.id, reason: "no explanation", ...help });
      }
    }
  }

  for (const elementId of ELEMENT_IDS) {
    await navigate(cdp, detailUrlV135(server.url, elementId));
    await waitForValue(cdp, ANALYSIS_READY, { timeoutMs: 45_000 });

    const nested = await evaluateValue(cdp, NESTED_CONTROLS);
    for (const item of nested) nestedFindings.push({ route: elementId, ...item });

    const selectors = await evaluateValue(cdp, SELECTOR_OPTIONS);
    for (const selector of selectors || []) {
      if (!CAPACITY_LABEL.test(selector.label || "")) continue;
      const lengths = (selector.options || []).filter(
        (option) => LENGTH_UNIT.test(option) && !POWER_UNIT.test(option)
      );
      if (lengths.length > 0) {
        unitFindings.push({
          route: elementId,
          label: selector.label,
          options: lengths.slice(0, 6).join(" | "),
        });
      }
    }
    rows.push({
      route: elementId,
      surface: "detail",
      nested: nested.length,
    });
  }
} catch (error) {
  runtimeFailure = error instanceof Error ? error.message : String(error);
} finally {
  if (browser) await browser.close();
  if (server) await server.close();
}

audit.check("SCREEN_USABILITY_RUNTIME", runtimeFailure === null, { runtimeFailure }, { runtimeFailure: null });
audit.check("INSPECTED_ROUTE_COUNT", rows.length === ELEMENT_IDS.length + 4, rows.length, ELEMENT_IDS.length + 4);
audit.check(
  "NESTED_INTERACTIVE_CONTROL_COUNT",
  nestedFindings.length === 0,
  nestedFindings.slice(0, 12),
  []
);
audit.check(
  "TERM_HELP_NAVIGATION_CONFLICT_COUNT",
  termHelpFindings.length === 0,
  termHelpFindings.slice(0, 12),
  []
);
audit.check(
  "CAPACITY_FILTER_MIXED_UNIT_COUNT",
  unitFindings.length === 0,
  unitFindings.slice(0, 12),
  []
);
audit.check("CONSOLE_ERROR", (browser?.runtimeErrors || []).length === 0, browser?.runtimeErrors || [], []);

writeCsvV136(
  "screen-usability-routes-v136-4.csv",
  ["route", "surface", "nested"],
  rows
);
writeCsvV136(
  "screen-usability-findings-v136-4.csv",
  ["route", "outer", "inner", "outerText", "innerText", "testId"],
  nestedFindings
);

finishAuditV136(audit, "screen-usability-audit-v136-4.json", {
  inspectedRouteCount: rows.length,
  nestedInteractiveControlCount: nestedFindings.length,
  termHelpConflictCount: termHelpFindings.length,
  capacityMixedUnitCount: unitFindings.length,
  capacityMixedUnitSamples: unitFindings.slice(0, 12),
  runtimeFailure,
});
