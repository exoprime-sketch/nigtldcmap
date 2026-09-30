#!/usr/bin/env node
/**
 * The eight screens this round changes, photographed the same way twice.
 *
 * A reader compares before and after only if both were taken by the same steps, so
 * one script drives both: `--base https://nigtldcmap.vercel.app` for what is running
 * now, and no `--base` for this branch's production build. Each shot states the path
 * and the clicks that produced it, and a shot whose layer does not exist on that side
 * is recorded as `layer-missing` with the screen still captured - that absence is the
 * before state, not a failure.
 *
 * Usage:
 *   node scripts/v157/capture-screens-v157.mjs --out output/v157/screens/after
 *   node scripts/v157/capture-screens-v157.mjs --base https://nigtldcmap.vercel.app \
 *     --out output/v157/screens/before
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

import { chromium } from "playwright";

import { startStaticBuildServer } from "../v125/browser-runtime.mjs";
import { repoRootV158 } from "../v158/country-context-v158.mjs";

const ROOT = repoRootV158(import.meta.dirname);
const argv = process.argv.slice(2);
const opt = (name, fallback) => {
  const at = argv.indexOf(`--${name}`);
  return at >= 0 && argv[at + 1] ? argv[at + 1] : fallback;
};
const externalBase = opt("base", "");
const OUT = resolve(ROOT, opt("out", "output/v157/screens/after"));
const PORT = Number(opt("port", "4357"));
const COUNTRY = "VNM";

/**
 * Every shot: the path a reader types, the clicks after it, and why it is here.
 * `layer` selects that dataset alone; `select: "keyboard"` opens the panel for the
 * first feature the page's own keyboard control offers.
 */
const SHOTS_V157 = [
  { name: "01-map-default", note: "지도 첫 화면(레이어 선택 없음)" },
  { name: "02-map-list-groups", note: "지도 자료 목록 7개 분류 펼침", expandGroups: true },
  { name: "03-layer-b017-grades", note: "B-017 물 스트레스 평가구역", layer: "B-017" },
  { name: "04-layer-b026-directions", note: "B-026 우세 유향(범주형)", layer: "B-026" },
  { name: "05-layer-a028-assets", note: "A-028 항만·댐·저수지", layer: "A-028" },
  { name: "06-layer-b048-companions", note: "B-048 광산 + 연관 데이터", layer: "B-048", select: "keyboard" },
  { name: "07-selection-card-region", note: "성·시 선택 설명 카드", layer: "C-016", select: "keyboard" },
  { name: "08-selection-card-facility", note: "시설 선택 설명 카드", layer: "A-023", select: "keyboard" },
];

mkdirSync(OUT, { recursive: true });

const server = externalBase ? null : await startStaticBuildServer(resolve(ROOT, opt("build", "build")), { port: PORT });
const base = (externalBase || server.url).replace(/\/$/u, "");
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 }, locale: "ko-KR" });
const consoleErrors = [];
page.on("console", (message) => {
  if (message.type() === "error") consoleErrors.push(message.text().slice(0, 200));
});

const report = { schema: "screens-v157", generatedAt: new Date().toISOString(), base, out: OUT.replace(ROOT, "").replace(/\\/gu, "/"), shots: [] };

for (const shot of SHOTS_V157) {
  const path = `/?view=map&country=${COUNTRY}#map`;
  await page.goto(`${base}${path}`, { waitUntil: "domcontentloaded" });
  await page.waitForSelector('[data-testid="map-all-data-layer-v135"]', { state: "attached", timeout: 90_000 }).catch(() => null);
  await page.waitForTimeout(1600);
  const steps = [`${path} 열기`];
  let status = "captured";

  if (shot.expandGroups) {
    await page.evaluate(() => {
      document.querySelectorAll('[data-testid="map-catalog-group-toggle-v138"]').forEach((toggle) => {
        if (toggle.getAttribute("aria-expanded") !== "true") toggle.click();
      });
    });
    steps.push("자료 목록의 분류 7개 모두 펼침");
    await page.waitForTimeout(800);
  }

  if (shot.layer) {
    const row = await page.evaluate((elementId) => {
      const input = document.querySelector(`[data-testid="map-all-data-layer-v135"][data-element-id="${elementId}"]`);
      if (!input) return { found: false };
      const group = input.closest("[data-map-group-v135]");
      const toggle = group?.querySelector('[data-testid="map-catalog-group-toggle-v138"]');
      if (toggle && toggle.getAttribute("aria-expanded") !== "true") toggle.click();
      return { found: true, disabled: Boolean(input.disabled) };
    }, shot.layer);
    steps.push(`자료 목록에서 ${shot.layer} 분류 펼침`);
    if (!row.found) {
      // The dataset is not on this side of the comparison: the list itself is the shot.
      status = "layer-missing";
      steps.push(`${shot.layer} 행 없음(이 빌드에는 미등록)`);
    } else if (row.disabled) {
      // A row the build cannot draw (지도 준비 중) states so in the list.
      status = "layer-unavailable";
      steps.push(`${shot.layer} 행은 '지도 준비 중'으로 선택 불가`);
      await page.waitForTimeout(600);
    } else {
      await page.waitForTimeout(600);
      // The catalog's checkbox carries no box of its own (the label draws it), so the
      // row is switched on in the page - the same click the label sends.
      await page.evaluate((elementId) => {
        document.querySelector(`[data-testid="map-all-data-layer-v135"][data-element-id="${elementId}"]`)?.click();
      }, shot.layer);
      steps.push(`${shot.layer} 선택`);
      await page.waitForTimeout(3600);
      const drawn = await page.evaluate(
        (elementId) =>
          document
            .querySelector(`[data-testid="map-all-data-layer-v135"][data-element-id="${elementId}"]`)
            ?.closest(".cdp-map-catalog-v138__item")
            ?.getAttribute("data-map-drawn") === "true",
        shot.layer
      );
      if (!drawn) status = "layer-not-drawn";
    }
  }

  if (shot.select === "keyboard" && status === "captured") {
    const select = page.locator('[data-testid="map-keyboard-feature-select"]');
    if ((await select.count()) > 0) {
      await select.first().click({ timeout: 15_000 }).catch(() => {});
      steps.push("키보드 대상 선택 버튼으로 첫 개체 선택");
      await page.waitForTimeout(2000);
    } else {
      status = "no-keyboard-select";
    }
  }

  const panel = await page.evaluate(() => ({
    selectionCard: Boolean(document.querySelector('[data-testid="map-selection-card-v161"]')),
    selectionTitle: document.querySelector('[data-testid="map-selection-title-v161"]')?.textContent?.trim() ?? null,
    companions: document.querySelectorAll('[data-testid="map-companions-v157"]').length,
    drawnLayers: document.querySelectorAll('.cdp-map-catalog-v138__item[data-map-drawn="true"]').length,
  }));

  const file = resolve(OUT, `${shot.name}.png`);
  await page.screenshot({ path: file });
  report.shots.push({ ...shot, status, path, steps, ...panel, file: file.replace(ROOT, "").replace(/\\/gu, "/") });
  process.stdout.write(`${JSON.stringify({ shot: shot.name, status, ...panel })}\n`);
}

report.consoleErrors = consoleErrors;
writeFileSync(resolve(OUT, "screens-v157.json"), `${JSON.stringify(report, null, 2)}\n`, "utf8");
await browser.close();
if (server) await server.close();
process.stdout.write(`${JSON.stringify({ base, out: report.out, shots: report.shots.length, consoleErrors: consoleErrors.length })}\n`);
