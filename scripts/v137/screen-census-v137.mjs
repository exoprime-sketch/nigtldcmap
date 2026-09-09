#!/usr/bin/env node
/**
 * One structured record per detail screen, so the meaning review has something
 * to read against the source instead of a screenshot.
 *
 * This is a collection pass, not a review. It records what each screen renders,
 * whether its controls move the result, and which internal tokens leak into the
 * public text. Nothing here decides that a screen is correct - that judgement is
 * made by reading the screen against its source and is recorded separately.
 */
import { resolve } from "node:path";
import { mkdirSync, writeFileSync, readFileSync } from "node:fs";
import {
  startStaticBuildServer,
  launchHeadlessBrowser,
  navigate,
  evaluateValue,
  setViewport,
} from "../v125/browser-runtime.mjs";
import { selectOptionByRealInput, pollUntil } from "./map-qa-input.mjs";

const ROOT = resolve(import.meta.dirname, "../..");
const argv = process.argv.slice(2);
const opt = (name, fallback) => {
  const index = argv.indexOf(name);
  return index < 0 ? fallback : argv[index + 1];
};
const BUILD = resolve(ROOT, opt("--build", ".verify/candidate/build"));
const OUT = resolve(ROOT, opt("--out", "reports/final-data-integration/screen-review"));
const ONLY = argv.filter((item) => /^[A-E]-\d{3}$/.test(item));
const WIDTH = Number(opt("--width", "1440"));

const catalog = JSON.parse(
  readFileSync(resolve(BUILD, "data/vietnam/v2/catalog.json"), "utf8")
);
const ELEMENTS = (ONLY.length ? ONLY : catalog.elements.map((row) => row.elementId)).sort();

/** Internal shapes that must never reach a public screen. */
const INTERNAL_TOKEN_RE =
  /VNM\.\d+_\d+|measure-[0-9a-f]{12}|field_[0-9a-f]{8}|attr_\d+|속성\d+_|indicatorId|recordId|v1(?:24|37)-[a-z]/;

const READ = `(() => {
  // 자료정보 sits in a collapsed <details>; a reader opens it and the review has
  // to read what it says. The record table stays closed - expanding a few
  // hundred rows makes every later re-render slow enough to look like a control
  // that does nothing.
  document
    .querySelectorAll('details[data-testid="detail-metadata-v135"]')
    .forEach(function (item) { item.open = true; });
  const root = document.querySelector('[data-testid="public-analysis-root"]');
  const primary = document.querySelector('[data-testid="public-primary-visualization"]');
  const lines = (el) => el
    ? (el.innerText || '').split(String.fromCharCode(10)).map(function (s) { return s.trim(); }).filter(Boolean)
    : [];
  const selects = [...document.querySelectorAll('[data-testid="public-selector"] select')];
  // Specialised screens render their own component instead of the archetype's
  // primary section. Reading only that testid reported them as empty.
  const analysis = document.querySelector('[data-testid="public-analysis-primary"]');
  // The whole analysis region: several screens render a summary above the
  // archetype's own primary section, and reading only that section missed it.
  const primaryLines = lines(analysis || primary);
  const headingCount = primary ? primary.querySelectorAll('h3, h4, h5').length : 0;
  const cardTitles = [...document.querySelectorAll('[data-testid="public-entity-card-title"]')]
    .map(function (el) { return (el.textContent || '').trim(); });
  return {
    state: root ? root.getAttribute('data-analysis-state') : null,
    title: (document.querySelector('[data-testid="public-data-title"]') || {}).innerText || null,
    emptyReason: (document.querySelector('[data-public-empty-reason]') || { getAttribute: function () { return null; } }).getAttribute('data-public-empty-reason'),
    selectors: selects.map(function (s) {
      return { label: s.getAttribute('aria-label'), options: s.options.length, value: s.value };
    }),
    primaryLineCount: primaryLines.length,
    primaryText: primaryLines.join(String.fromCharCode(10)),
    headingCount: headingCount,
    cardTitles: cardTitles,
    duplicateCardTitles: cardTitles.filter(function (t, i) { return cardTitles.indexOf(t) !== i; }),
    sourcePanel: lines(document.querySelector('[data-testid="public-source-panel"]')).join(' | '),
    rawTableRows: document.querySelectorAll('[data-testid="public-raw-table"] tbody tr').length,
    fullText: lines(document.querySelector('[data-testid="public-analysis-primary"]')).join(String.fromCharCode(10))
  };
})()`;

async function main() {
  const server = await startStaticBuildServer(BUILD);
  const browser = await launchHeadlessBrowser();
  const cdp = browser.cdp;
  const consoleErrors = [];
  cdp.on("Runtime.exceptionThrown", (event) => {
    consoleErrors.push(
      event?.exceptionDetails?.exception?.description ||
        event?.exceptionDetails?.text ||
        "exception"
    );
  });
  await setViewport(cdp, WIDTH, 1200);
  const rows = [];
  for (const elementId of ELEMENTS) {
    consoleErrors.length = 0;
    const row = { elementId };
    try {
      await navigate(
        cdp,
        `${server.url.replace(/\/$/, "")}/?view=data&country=VNM&element=${elementId}#element-detail`
      );
      const ready = await pollUntil(
        () =>
          evaluateValue(
            cdp,
            `(document.querySelector('[data-testid="public-analysis-root"]') || { getAttribute: function () { return null; } }).getAttribute('data-analysis-state')`
          ),
        (value) => value === "ready" || value === "empty",
        { timeoutMs: 30000, label: "analysis ready" }
      );
      const read = await evaluateValue(cdp, READ);
      Object.assign(row, read, { readyState: ready.value ?? null });
      row.internalTokens = Array.from(
        new Set((row.fullText || "").match(new RegExp(INTERNAL_TOKEN_RE, "g")) || [])
      ).slice(0, 8);

      if ((read.selectors || []).length > 0) {
        const before = read.fullText;
        // Whichever option the screen did not already have selected. Asking for
        // index 1 unconditionally reported "changes nothing" on screens whose
        // default simply was index 1.
        const selectedIndex = await evaluateValue(
          cdp,
          `(document.querySelector('[data-testid="public-selector"] select') || { selectedIndex: -1 }).selectedIndex`
        );
        const wantedIndex = selectedIndex === 1 ? 0 : 1;
        const change = await selectOptionByRealInput(
          cdp,
          evaluateValue,
          '[data-testid="public-selector"] select',
          (option, index) => index === wantedIndex
        );
        row.firstSelector = read.selectors[0].label;
        row.firstSelectorOption = change.option || null;
        row.firstSelectorResult = change.result;
        if (change.result === "SELECTED_BY_KEYBOARD") {
          const moved = await pollUntil(
            () =>
              evaluateValue(
                cdp,
                `(function () {
                  const el = document.querySelector('[data-testid="public-analysis-primary"]');
                  return el ? (el.innerText || '') : '';
                })()`
              ),
            (value) =>
              value.split(String.fromCharCode(10)).map((s) => s.trim()).filter(Boolean).join(String.fromCharCode(10)) !== before,
            { timeoutMs: 6000, label: "content change" }
          );
          row.firstSelectorChangedResult = moved.ok;
        }
      }
      row.runtimeErrors = consoleErrors.slice(0, 3);
      row.runtimeErrorCount = consoleErrors.length;
    } catch (error) {
      row.error = String(error && error.message ? error.message : error);
    }
    delete row.fullText;
    rows.push(row);
    console.log(
      [
        row.elementId,
        row.readyState || row.error || "-",
        `sel=${(row.selectors || []).length}`,
        `primary=${row.primaryLineCount ?? "-"}`,
        row.firstSelector ? `${row.firstSelectorChangedResult ? "MOVES" : "STATIC"}` : "nosel",
        row.duplicateCardTitles && row.duplicateCardTitles.length
          ? `dupTitles=${row.duplicateCardTitles.length}`
          : "",
        row.internalTokens && row.internalTokens.length ? `internal=${row.internalTokens.join(",")}` : "",
        row.runtimeErrorCount ? `errors=${row.runtimeErrorCount}` : "",
      ]
        .filter(Boolean)
        .join(" | ")
    );
  }
  await browser.close();
  await server.close();
  mkdirSync(OUT, { recursive: true });
  writeFileSync(
    resolve(OUT, `screen-census-v137-${WIDTH}.json`),
    `${JSON.stringify({ schema: "nigt-screen-census-1", generatedAt: new Date().toISOString(), width: WIDTH, build: BUILD.split(/[\/]/).slice(-3).join("/"), rows }, null, 2)}\n`,
    "utf8"
  );
  return 0;
}

process.exit(await main());
