#!/usr/bin/env node
/**
 * V162: a layer-1 control has to change layer 1.
 *
 * The detail frame (DetailAnalysisFrameV153) shows the rank-1 chart row as
 * layer 1 and folds everything after it (`data-v160-rest`) into layer 2. A
 * selector drawn above the first chart but wired to a chart ranked 2 or below
 * changes only the folded part: the reader moves the control and nothing they
 * can see moves (A-002, A-019 in the e2e detail run).
 *
 * For every public element's detail page, with layer 2 closed as a reader
 * lands on it, every visible control in the analysis section outside the fold
 * (select, radio, aria-pressed button) is changed once, and the markup of layer 1
 * (the analysis section without the fold) and of the fold are compared before
 * and after:
 *   layer1        - layer 1 changed (fine)
 *   layer2-only   - only the folded part changed (the defect)
 *   no-effect     - nothing changed anywhere
 * The public set comes from catalog.json, never a fixed count.
 *
 * Usage: node scripts/v162/audit-layer-controls-v162.mjs [--build build] [--ids A-002,A-019] [--workers 3]
 * Writes reports/v162/layer-controls-audit-v162.json (+ .md).
 */
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";
import { startStaticBuildServer, scaledTimeoutMsV150 } from "../v125/browser-runtime.mjs";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const args = process.argv.slice(2);
const opt = (name, fallback) => {
  const index = args.indexOf(name);
  return index >= 0 && args[index + 1] ? args[index + 1] : fallback;
};
const BUILD = resolve(ROOT, opt("--build", "build"));
const WORKERS = Number(opt("--workers", "3"));
const ONLY = opt("--ids", null)?.split(",").map((id) => id.trim()).filter(Boolean) || null;
const PORT = Number(opt("--port", "4403"));
const OUT = resolve(ROOT, "reports/v162/layer-controls-audit-v162.json");

const catalog = JSON.parse(readFileSync(resolve(ROOT, "public/data/vietnam/v2/catalog.json"), "utf8")).elements;
const PUBLIC_IDS = catalog.filter((element) => !["excluded", "not-provided"].includes(element.publicStatus)).map((element) => element.elementId);
const IDS = ONLY ? PUBLIC_IDS.filter((id) => ONLY.includes(id)) : PUBLIC_IDS;

const server = await startStaticBuildServer(BUILD, { port: PORT });
const base = server.url.replace(/\/$/u, "");
const browser = await chromium.launch(process.env.V125_BROWSER_EXECUTABLE ? { executablePath: process.env.V125_BROWSER_EXECUTABLE } : {});
const results = [];
const runtimeErrors = [];

/**
 * Layer 1 and the fold, compared as markup (chart SVG included): a series
 * toggle changes a path, not text. Layer 1 = the analysis section without the
 * folded part; the fold = the folded part. Tooltip and focus attributes are
 * dropped so hovering does not read as a change.
 */
const readLayers = (tab) =>
  tab.evaluate(() => {
    const primary = document.querySelector('[data-testid="public-analysis-primary"]');
    if (!primary) return { layer1: "", fold: "" };
    const clean = (html) => html.replace(/\s(?:data-v162-control|aria-describedby|tabindex|data-tooltip[\w-]*)="[^"]*"/gu, "");
    const clone = primary.cloneNode(true);
    clone.querySelectorAll("[data-v160-rest]").forEach((node) => node.remove());
    const fold = Array.from(primary.querySelectorAll("[data-v160-rest]"))
      .filter((node) => !node.parentElement?.closest("[data-v160-rest]"))
      .map((node) => node.outerHTML)
      .join("\n");
    return { layer1: clean(clone.innerHTML), fold: clean(fold) };
  });

/** Visible controls outside the fold, tagged so they can be found again. */
const tagControls = (tab) =>
  tab.evaluate(() => {
    const primary = document.querySelector('[data-testid="public-analysis-primary"]');
    if (!primary) return [];
    const nodes = Array.from(primary.querySelectorAll('select, input[type="radio"], button[aria-pressed]'));
    const visible = nodes.filter((node) => !node.closest("[data-v160-rest]") && !node.disabled && (node.offsetParent !== null || node.getClientRects().length > 0));
    return visible.map((node, index) => {
      node.setAttribute("data-v162-control", String(index));
      const label =
        node.getAttribute("aria-label") ||
        node.closest("label")?.querySelector("span")?.textContent ||
        node.closest("fieldset")?.querySelector("legend")?.textContent ||
        node.textContent ||
        "";
      const kind = node.tagName === "SELECT" ? "select" : node.tagName === "INPUT" ? "radio" : "toggle";
      const options = node.tagName === "SELECT" ? node.options.length : 0;
      return { index, kind, label: label.replace(/\s+/gu, " ").trim().slice(0, 60), options };
    });
  });

async function changeControl(tab, control) {
  const locator = tab.locator(`[data-v162-control="${control.index}"]`);
  if (control.kind === "select") {
    if (control.options < 2) return false;
    const current = await locator.evaluate((el) => el.selectedIndex);
    await locator.selectOption({ index: current === 1 ? 0 : 1 });
    return true;
  }
  if (control.kind === "radio") {
    if (await locator.isChecked()) return false;
    await locator.check({ force: true });
    return true;
  }
  // The option already chosen (aria-pressed="true", e.g. '절대량') is not a
  // change; a toggle that cannot act (the last visible series) is not
  // clickable.
  if ((await locator.getAttribute("aria-pressed")) === "true") return false;
  try {
    await locator.click({ timeout: 5000 });
  } catch {
    return false;
  }
  return true;
}

const queue = [...IDS];
async function worker() {
  const context = await browser.newContext({ locale: "ko-KR", viewport: { width: 1440, height: 1000 } });
  const tab = await context.newPage();
  while (queue.length) {
    const id = queue.shift();
    const url = `${base}/?view=data&country=VNM&element=${id}#element-detail`;
    try {
      await tab.goto(url, { waitUntil: "domcontentloaded", timeout: scaledTimeoutMsV150(90_000) });
      await tab.waitForFunction(() => /ready|empty/u.test(document.querySelector('[data-testid="public-analysis-root"]')?.getAttribute("data-analysis-state") || ""), null, { timeout: scaledTimeoutMsV150(60_000) }).catch(() => null);
      await tab.waitForTimeout(1200);
      const controls = await tagControls(tab);
      for (const control of controls) {
        // Each control is judged from the page as a reader lands on it.
        if (control.index > 0) {
          await tab.goto(url, { waitUntil: "domcontentloaded", timeout: scaledTimeoutMsV150(90_000) });
          await tab.waitForFunction(() => /ready|empty/u.test(document.querySelector('[data-testid="public-analysis-root"]')?.getAttribute("data-analysis-state") || ""), null, { timeout: scaledTimeoutMsV150(60_000) }).catch(() => null);
          await tab.waitForTimeout(1200);
          await tagControls(tab);
        }
        const before = await readLayers(tab);
        const changed = await changeControl(tab, control);
        if (!changed) {
          results.push({ elementId: id, ...control, verdict: "not-actionable" });
          continue;
        }
        await tab.waitForTimeout(900);
        const after = await readLayers(tab);
        const layer1Changed = after.layer1 !== before.layer1;
        const foldChanged = after.fold !== before.fold;
        const verdict = layer1Changed ? "layer1" : foldChanged ? "layer2-only" : "no-effect";
        results.push({ elementId: id, ...control, verdict, first: control.index === 0 });
      }
      if (controls.length === 0) results.push({ elementId: id, index: null, kind: null, label: null, verdict: "no-controls" });
    } catch (error) {
      runtimeErrors.push(`${id}: ${String(error).slice(0, 160)}`);
    }
  }
  await context.close();
}
await Promise.all(Array.from({ length: WORKERS }, worker));
await browser.close();
await server.close();

results.sort((a, b) => a.elementId.localeCompare(b.elementId) || (a.index ?? -1) - (b.index ?? -1));
const defects = results.filter((row) => row.verdict === "layer2-only");
const noEffect = results.filter((row) => row.verdict === "no-effect");
const summary = {
  publicElements: PUBLIC_IDS.length,
  checked: new Set(results.map((row) => row.elementId)).size,
  controls: results.filter((row) => row.index !== null).length,
  layer2Only: defects.length,
  layer2OnlyElements: [...new Set(defects.map((row) => row.elementId))],
  noEffect: noEffect.length,
  noEffectElements: [...new Set(noEffect.map((row) => row.elementId))],
  runtimeErrors: runtimeErrors.length,
  pass: defects.length === 0 && runtimeErrors.length === 0,
};
mkdirSync(dirname(OUT), { recursive: true });
writeFileSync(OUT, `${JSON.stringify({ generatedAt: new Date().toISOString(), build: BUILD, summary, results, runtimeErrors }, null, 2)}\n`);
const md = [
  "# 1층 컨트롤 ↔ 2층 차트 전수 점검(V162)",
  "",
  `- 공개 요소 ${summary.publicElements}개 중 ${summary.checked}개 점검, 1층 컨트롤 ${summary.controls}개`,
  `- 1층 컨트롤이 접힌 2층만 바꿈: ${summary.layer2Only}건 (${summary.layer2OnlyElements.join(", ") || "없음"})`,
  `- 아무 것도 바꾸지 않음: ${summary.noEffect}건 (${summary.noEffectElements.join(", ") || "없음"})`,
  `- 실행 오류: ${summary.runtimeErrors}`,
  "",
  "| 요소 | 순서 | 종류 | 컨트롤 | 판정 |",
  "|---|---|---|---|---|",
  ...results.filter((row) => row.index !== null && row.verdict !== "layer1").map((row) => `| ${row.elementId} | ${row.index + 1} | ${row.kind} | ${row.label} | ${row.verdict} |`),
  "",
].join("\n");
writeFileSync(OUT.replace(/\.json$/u, ".md"), md);
console.log(JSON.stringify(summary));
if (!summary.pass) process.exitCode = 1;
