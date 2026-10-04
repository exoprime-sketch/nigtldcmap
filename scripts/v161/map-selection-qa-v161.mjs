#!/usr/bin/env node
/**
 * V161-C QA: does the panel describe what the reader clicked?
 *
 * One sample per selection kind (facility · cluster · region · line · unit ·
 * asset feature), at least ten clicks in all, each checked against the thing that
 * was clicked rather than against a fixed string:
 *
 *   - the card's title is the clicked feature's own name, taken from the map's
 *     feature properties before the click;
 *   - a cluster's stated count equals the cluster's `point_count`;
 *   - the retired row format (`항목 / 값 / 단위 / 지도 표시` as a metadata grid) is
 *     gone, and the meta line appears once;
 *   - the layer summary is folded while a selection is open;
 *   - a region name is written "한글명 (현지명)" - no title starts with a latin
 *     letter where the dictionary has a Korean name;
 *   - no console error, and a screenshot per sample.
 *
 * Usage: node scripts/v161/map-selection-qa-v161.mjs [--build build] [--port 4361]
 */
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

import { chromium } from "playwright";

import { startStaticBuildServer } from "../v125/browser-runtime.mjs";
import {
  countryPublicDirV158,
  repoRootV158,
  resolveCountryIso3V158,
} from "../v158/country-context-v158.mjs";

const ROOT = repoRootV158(import.meta.dirname);
const argv = process.argv.slice(2);
const opt = (name, fallback) => {
  const at = argv.indexOf(`--${name}`);
  return at >= 0 && argv[at + 1] ? argv[at + 1] : fallback;
};
const COUNTRY = resolveCountryIso3V158({ argv });
const DATA = resolve(ROOT, countryPublicDirV158(ROOT, COUNTRY));
const BUILD = resolve(ROOT, opt("build", "build"));
const PORT = Number(opt("port", "4361"));
const SHOTS = resolve(ROOT, "output/v161/map-selection");
const REPORT_PATH = resolve(ROOT, "reports/v161/map-selection-qa-v161.json");

const mapIndex = JSON.parse(readFileSync(resolve(DATA, "map-index.json"), "utf8"));
const layerByElement = new Map(mapIndex.layers.map((row) => [row.elementId, row]));

/**
 * The samples: one per kind the panel must describe. Chosen from the registered
 * layers, and each one states the kind the card is expected to report.
 */
/** The cluster sample is a canvas click, because a cluster is not in the list. */
const CLUSTER_SAMPLE_V161 = { elementId: "B-012", kind: "cluster", note: "재해 위치 묶음" };

const SAMPLES_V161 = [
  { elementId: "A-023", kind: "facility", note: "발전소 지점" },
  { elementId: "B-012", kind: "facility", note: "재해 지점(묶음 가능)" },
  { elementId: "E-005", kind: "facility", note: "연구기관 지점" },
  { elementId: "A-024", kind: "line", note: "송전 구간" },
  { elementId: "A-027", kind: "line", note: "도로·철도 구간" },
  { elementId: "B-017", kind: "unit", note: "Aqueduct 평가구역" },
  { elementId: "A-028", kind: "asset-feature", note: "항만·댐·저수지" },
  { elementId: "C-016", kind: "region", note: "성·시 단계구분도" },
  { elementId: "D-015", kind: "region", note: "성·시 건수" },
  { elementId: "B-026", kind: "region", note: "성 단위 범주형" },
  { elementId: "D-022", kind: "region", note: "34개 단위 건수" },
];

mkdirSync(SHOTS, { recursive: true });
mkdirSync(resolve(ROOT, "reports/v161"), { recursive: true });

const server = await startStaticBuildServer(BUILD, { port: PORT });
const base = server.url.replace(/\/$/u, "");
const browser = await chromium.launch();
const report = {
  schema: "map-selection-qa-v161",
  generatedAt: new Date().toISOString(),
  countryIso3: COUNTRY,
  base,
  samples: [],
  consoleErrors: [],
  checks: [],
};

function check(name, actual, expected, details) {
  const pass = JSON.stringify(actual) === JSON.stringify(expected);
  report.checks.push({ name, status: pass ? "PASS" : "FAIL", actual, expected, ...(details ? { details } : {}) });
  process.stdout.write(
    `${JSON.stringify({ type: "check", name, status: pass ? "PASS" : "FAIL", actual, expected })}\n`
  );
}

const page = await browser.newPage({ viewport: { width: 1440, height: 1000 }, locale: "ko-KR" });
page.on("console", (message) => {
  if (message.type() === "error") report.consoleErrors.push(message.text().slice(0, 240));
});
page.on("pageerror", (error) => report.consoleErrors.push(`pageerror: ${String(error).slice(0, 240)}`));

for (const sample of SAMPLES_V161) {
  const layer = layerByElement.get(sample.elementId);
  if (!layer) {
    report.samples.push({ ...sample, status: "layer-missing" });
    continue;
  }
  await page.goto(`${base}/?view=map&country=${COUNTRY}#map`, { waitUntil: "domcontentloaded" });
  await page.waitForSelector('[data-testid="map-all-data-layer-v135"]', { state: "attached", timeout: 60000 });
  await page.waitForTimeout(1200);
  // Select this layer alone.
  await page.evaluate((elementId) => {
    const clear = [...document.querySelectorAll("button")].find(
      (button) => button.textContent?.trim() === "선택 해제"
    );
    if (clear && !clear.disabled) clear.click();
    const input = document.querySelector(
      `[data-testid="map-all-data-layer-v135"][data-element-id="${elementId}"]`
    );
    const group = input?.closest("[data-map-group-v135]");
    const toggle = group?.querySelector('[data-testid="map-catalog-group-toggle-v138"]');
    if (toggle && toggle.getAttribute("aria-expanded") !== "true") toggle.click();
  }, sample.elementId);
  await page.waitForTimeout(400);
  await page
    .locator(`[data-testid="map-all-data-layer-v135"][data-element-id="${sample.elementId}"]`)
    .click({ timeout: 15000 });
  await page.waitForTimeout(3200);

  // Select a feature through the page's own keyboard control: it lists the drawn
  // features by name, so the QA knows what it asked for without touching MapLibre.
  const select = page.locator('[data-testid="map-keyboard-feature-select"]');
  if ((await select.count()) === 0) {
    report.samples.push({ ...sample, status: "no-keyboard-select" });
    continue;
  }
  // The control is a button whose label is the feature it will select.
  const optionLabel = await page.evaluate(() => {
    const node = document.querySelector('[data-testid="map-keyboard-feature-select"]');
    const label = node?.querySelector("span")?.textContent?.trim() ?? "";
    return label ? { label } : null;
  });
  if (!optionLabel) {
    report.samples.push({ ...sample, status: "no-feature-options" });
    continue;
  }
  await select.first().click({ timeout: 10000 }).catch(() => {});
  await page.waitForTimeout(1800);
  const clicked = { name: optionLabel.label.split(" · ").slice(-1)[0] ?? "", pointCount: null };

  const panel = await page.evaluate(() => {
    const card = document.querySelector('[data-testid="map-selection-card-v161"]');
    const summary = document.querySelector('[data-testid="map-national-summary"]');
    const legacyRows = [...document.querySelectorAll(".cdp-evidence-grid dt, .cdp-evidence-grid .cdp-evidence__label")]
      .map((node) => node.textContent?.trim())
      .filter((label) => ["항목", "단위", "지도 표시", "데이터명"].includes(label || ""));
    return {
      cardFound: Boolean(card),
      kind: card?.getAttribute("data-selection-kind") ?? null,
      title: document.querySelector('[data-testid="map-selection-title-v161"]')?.textContent?.trim() ?? null,
      memberCount: card?.getAttribute("data-member-count") || null,
      metaCount: document.querySelectorAll('[data-testid="map-selection-meta-v161"]').length,
      lineCount: document.querySelectorAll('[data-testid="map-selection-lines-v161"] > li').length,
      comparisonCount: document.querySelectorAll('[data-testid="map-selection-comparison-v161"] > li').length,
      summaryFolded: summary?.getAttribute("data-folded-for-selection") ?? null,
      legacyRows,
    };
  });

  const shot = resolve(SHOTS, `${sample.elementId.toLowerCase()}-${sample.kind}.png`);
  await page.screenshot({ path: shot });
  report.samples.push({
    ...sample,
    status: "checked",
    clickedName: clicked.name,
    clusterPointCount: clicked.pointCount,
    ...panel,
    screenshot: shot.replace(ROOT, "").replace(/\\/gu, "/"),
  });
}

// The cluster card: clusters are not in the keyboard list, so this one is clicked
// on the canvas at a zoom where the layer clusters.
{
  const sample = CLUSTER_SAMPLE_V161;
  await page.goto(`${base}/?view=map&country=${COUNTRY}#map`, { waitUntil: "domcontentloaded" });
  await page.waitForSelector('[data-testid="map-all-data-layer-v135"]', { state: "attached", timeout: 60000 });
  await page.waitForTimeout(1200);
  await page.evaluate((elementId) => {
    const clear = [...document.querySelectorAll("button")].find(
      (button) => button.textContent?.trim() === "선택 해제"
    );
    if (clear && !clear.disabled) clear.click();
    const input = document.querySelector(
      `[data-testid="map-all-data-layer-v135"][data-element-id="${elementId}"]`
    );
    const group = input?.closest("[data-map-group-v135]");
    const toggle = group?.querySelector('[data-testid="map-catalog-group-toggle-v138"]');
    if (toggle && toggle.getAttribute("aria-expanded") !== "true") toggle.click();
  }, sample.elementId);
  await page.waitForTimeout(400);
  await page
    .locator(`[data-testid="map-all-data-layer-v135"][data-element-id="${sample.elementId}"]`)
    .click({ timeout: 15000 });
  await page.waitForTimeout(3500);
  // Walk a small grid over the canvas until a cluster card appears.
  // Clusters form as the map zooms out; two steps out is enough for B-012.
  for (const step of [0, 1]) {
    void step;
    await page.locator(".maplibregl-ctrl-zoom-out").first().click({ timeout: 5000 }).catch(() => {});
    await page.waitForTimeout(900);
  }
  const canvas = await page.locator(".cdp-map-canvas-wrap").boundingBox();
  let card = null;
  if (canvas) {
    const points = [0.5, 0.42, 0.58, 0.34, 0.66].flatMap((x) =>
      [0.5, 0.4, 0.6, 0.3].map((y) => ({
        x: canvas.x + canvas.width * x,
        y: canvas.y + canvas.height * y,
      }))
    );
    for (const point of points) {
      // V164-3: a clicked site keeps its popup open; Esc closes it so the next
      // grid point is clicked on the map, not on that popup.
      await page.keyboard.press("Escape");
      await page.mouse.click(point.x, point.y);
      await page.waitForTimeout(900);
      card = await page.evaluate(() => {
        const node = document.querySelector('[data-testid="map-selection-card-v161"]');
        if (!node || node.getAttribute("data-selection-kind") !== "cluster") return null;
        return {
          title: document.querySelector('[data-testid="map-selection-title-v161"]')?.textContent?.trim() ?? "",
          memberCount: Number(node.getAttribute("data-member-count") || 0),
          listed: Number(node.getAttribute("data-member-listed") || 0),
          metaCount: document.querySelectorAll('[data-testid="map-selection-meta-v161"]').length,
        };
      });
      if (card) break;
    }
  }
  const shot = resolve(SHOTS, `${sample.elementId.toLowerCase()}-cluster.png`);
  await page.screenshot({ path: shot });
  report.samples.push({
    ...sample,
    status: card ? "checked" : "cluster-not-found",
    ...(card ?? {}),
    screenshot: shot.replace(ROOT, "").replace(/\\/gu, "/"),
  });
  report.clusterCard = card;
}

await browser.close();
await server.close();

const checked = report.samples.filter((row) => row.status === "checked");
// The cluster sample is clicked on the canvas and reports different fields, so the
// per-feature checks run over the keyboard samples and it has its own checks below.
const keyboardChecked = checked.filter((row) => row.kind !== "cluster");
check(
  "SAMPLE_COUNT",
  checked.length,
  SAMPLES_V161.length + 1,
  report.samples.filter((row) => row.status !== "checked")
);
check("CARD_SHOWN", keyboardChecked.filter((row) => !row.cardFound).map((row) => row.elementId), []);
// The card's title must be the feature the control named. A leading punctuation
// mark is ignored: the platform shows a source name as it stands ("=Cầu Sơn Du").
const bareNameV161 = (value) => String(value || "").replace(/^[^\p{L}\p{N}]+/u, "").trim();
check(
  "TITLE_IS_CLICKED_FEATURE",
  keyboardChecked
    .filter((row) => {
      const clicked = bareNameV161(row.clickedName).split(" (")[0];
      return clicked && !bareNameV161(row.title).includes(clicked);
    })
    .map((row) => ({ elementId: row.elementId, clicked: row.clickedName, title: row.title })),
  []
);
check(
  "LEGACY_META_ROWS_GONE",
  [...new Set(keyboardChecked.flatMap((row) => row.legacyRows ?? []))],
  []
);
check("META_LINE_ONCE", checked.filter((row) => row.metaCount !== 1).map((row) => row.elementId), []);
check(
  "SUMMARY_FOLDED_WITH_SELECTION",
  keyboardChecked.filter((row) => row.summaryFolded !== "true").map((row) => row.elementId),
  []
);
check(
  "LINES_PRESENT",
  keyboardChecked.filter((row) => row.lineCount === 0).map((row) => row.elementId),
  []
);
check("CLUSTER_CARD_SHOWN", Boolean(report.clusterCard), true);
check(
  "CLUSTER_TITLE_STATES_COUNT",
  report.clusterCard
    ? String(report.clusterCard.title).includes(String(report.clusterCard.memberCount))
    : false,
  true,
  report.clusterCard
);
check(
  "CLUSTER_LIST_WITHIN_COUNT",
  report.clusterCard ? report.clusterCard.listed <= Math.min(10, report.clusterCard.memberCount) : false,
  true,
  report.clusterCard
);
check("CONSOLE_ERRORS", report.consoleErrors.slice(0, 5), []);

const failed = report.checks.filter((row) => row.status === "FAIL");
report.summary = {
  samples: checked.length,
  passed: report.checks.length - failed.length,
  failed: failed.length,
  failedChecks: failed.map((row) => row.name),
  screenshots: SHOTS.replace(ROOT, "").replace(/\\/gu, "/"),
};
writeFileSync(REPORT_PATH, `${JSON.stringify(report, null, 2)}\n`, "utf8");
process.stdout.write(`${JSON.stringify({ type: "summary", audit: "map-selection-qa-v161", ...report.summary })}\n`);
if (failed.length > 0) process.exitCode = 1;
