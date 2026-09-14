#!/usr/bin/env node
/**
 * Does the first selector on a screen actually change what the screen says?
 *
 * An earlier pass answered "no" for nine screens, but it had set select.value
 * directly - React never sees that assignment, so of course nothing moved. This
 * drives the control the way a reader does (pointer, then arrow keys) and
 * compares the analysis region's text before and after.
 */
import { resolve } from "node:path";
import { mkdirSync, writeFileSync } from "node:fs";
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
const ELEMENTS = argv.filter((item) => /^[A-E]-\d{3}$/.test(item));

const ANALYSIS = '[data-testid="public-analysis-primary"]';

async function analysisText(cdp) {
  const value = await evaluateValue(
    cdp,
    `(() => {
      const root = document.querySelector('${ANALYSIS}');
      if (!root) return null;
      return (root.innerText || '').split(String.fromCharCode(10))
        .map(function (line) { return line.trim(); })
        .filter(Boolean).join(String.fromCharCode(10));
    })()`
  );
  return typeof value === "string" ? value : null;
}

async function main() {
  const server = await startStaticBuildServer(BUILD);
  const browser = await launchHeadlessBrowser();
  const cdp = browser.cdp;
  await setViewport(cdp, 1440, 1200);
  const rows = [];
  for (const elementId of ELEMENTS) {
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
            `(document.querySelector('[data-testid="public-analysis-root"]') || {}).dataset ? document.querySelector('[data-testid="public-analysis-root"]').dataset.analysisState : null`
          ),
        (value) => value === "ready",
        { timeoutMs: 25000, label: "analysis ready" }
      );
      row.ready = ready.ok;
      const controls = await evaluateValue(
        cdp,
        `[...document.querySelectorAll('[data-testid="public-selector"] select')].map(function (select, index) {
          return {
            index: index,
            label: select.getAttribute('aria-label'),
            testId: select.getAttribute('data-testid'),
            optionCount: select.options.length,
          };
        })`
      );
      row.controls = controls;
      if (!controls || controls.length === 0) {
        row.verdict = "NO_CONTROL";
        rows.push(row);
        continue;
      }
      const before = await analysisText(cdp);
      const selector = `[data-testid="public-selector"] select`;
      const change = await selectOptionByRealInput(
        cdp,
        evaluateValue,
        selector,
        (option, index) => index === 1
      );
      row.change = change;
      await pollUntil(
        () => analysisText(cdp),
        (value) => value !== before,
        { timeoutMs: 6000, label: "content change" }
      );
      const after = await analysisText(cdp);
      row.control = controls[0].label;
      row.option = change.option || null;
      row.changed = before !== after;
      row.beforeLength = before ? before.length : 0;
      row.afterLength = after ? after.length : 0;
      row.verdict = row.changed ? "SELECTOR_CHANGES_RESULT" : "SELECTOR_CHANGES_NOTHING";
    } catch (error) {
      row.verdict = "ERROR";
      row.error = String(error && error.message ? error.message : error);
    }
    rows.push(row);
    console.log(
      `${row.elementId} | ${row.control || "-"} = ${row.option || "-"} | ${row.verdict}` +
        ` | ${row.beforeLength || 0} -> ${row.afterLength || 0}`
    );
  }
  await browser.close();
  await server.close();
  mkdirSync(OUT, { recursive: true });
  writeFileSync(
    resolve(OUT, "selector-effect-v137.json"),
    `${JSON.stringify({ schema: "nigt-selector-effect-1", generatedAt: new Date().toISOString(), rows }, null, 2)}\n`,
    "utf8"
  );
  return rows.some((row) => row.verdict === "SELECTOR_CHANGES_NOTHING") ? 1 : 0;
}

process.exit(await main());
