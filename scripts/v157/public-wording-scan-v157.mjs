#!/usr/bin/env node
/**
 * Does any screen text read like the notes we write to each other?
 *
 * A reviewer found three datasets whose map-list info panel carried the note the
 * registration was written with - the renderer, the join key, what was left for a
 * later round. Nothing in the gate looked there, because the older check read the
 * detail screen's body only.
 *
 * This walks the public map the way a reader does and reads back every string it
 * can reach: each dataset's row and its info panel (list fully expanded), the legend
 * and the selection panel of every drawn layer, and each map dataset's detail text.
 * A string is reported when it carries a programmer's identifier (camelCase,
 * snake_case, kebab-case) or one of the words that only appear in our own notes
 * (렌더러, 폴리곤, 조인 키, kind, choropleth, boundaryPolicy, 후속, 제안).
 *
 * Units and the names of the sources we credit are not identifiers; they are listed
 * in ALLOWED_TOKENS_V157 and skipped. Everything else is a finding, with the element,
 * the field and the sentence, so it can be fixed at its source rather than hidden.
 *
 * Usage:
 *   node scripts/v157/public-wording-scan-v157.mjs [--build build] [--port 4358]
 *   node scripts/v157/public-wording-scan-v157.mjs --base https://<preview>
 *   node scripts/v157/public-wording-scan-v157.mjs --skip-detail   (list + map only)
 */
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
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
const flag = (name) => argv.includes(`--${name}`);
const externalBase = opt("base", "");
const PORT = Number(opt("port", "4358"));
const COUNTRY = "VNM";
const REPORT_PATH = resolve(ROOT, "reports/v157/public-wording-scan-v157.json");

/** Units, currencies and the names of credited sources: public vocabulary. */
const ALLOWED_TOKENS_V157 = new Set([
  "kV", "kWh", "kWp", "MWh", "GWh", "TWh", "kW", "mW", "kg", "km", "km2", "kt", "mm", "cm", "ha", "m3",
  "tCO2", "tCO2eq", "tCO2e", "gCO2", "CO2eq", "pH", "kmB2",
  "geoBoundaries", "openStreetMap", "openFreeMap", "hydroBASINS", "eM-DAT", "mapLibre",
  "terrarium", "aqueduct", "nDC", "iNDC", "bTR", "pDP8", "qĐ-TTg", "nĐ-CP", "tT-BCT",
  // company and programme names that are written this way by their owners
  "responsAbility", "tCO", "eChoupal", "iDE", "mDER",
]);

/** A link the record cites, and a dataset version: content, not wording of ours. */
const CITATION_V157 = [
  /https?:\/\/\S+/gu,
  /\bwww\.[^\s)]+/gu,
  // a host the screen prints without its scheme: adb.org/where-we-work/viet-nam
  /\b[a-z0-9][a-z0-9-]*(?:\.[a-z0-9-]+)+\/[^\s)]*/giu,
  /\bv\d{4}-\d{2}-\d{2}\b/gu,
  // a contact address the directory datasets publish
  /[\w.+-]+@[\w.-]*/gu,
];

/**
 * V162: a source value may stand in brackets only right after the Korean label
 * the platform's dictionary gives it - "협궤 철도 (narrow_gauge)" (A-027's 19
 * OpenStreetMap classes, src/data/visualization/osmClassLabelsV162.json). Any
 * other word before the bracket ("피처 수(narrow_gauge)") leaves the value an
 * identifier on the screen, and it counts.
 */
const DICTIONARY_CITATIONS_V162 = Object.entries(
  JSON.parse(readFileSync(resolve(ROOT, "src/data/visualization/osmClassLabelsV162.json"), "utf8")).labels
).map(([value, ko]) => `${ko} (${value})`);

/**
 * V162: words the sources themselves print that only look like identifiers -
 * an English compound in a facility's own name (A-025 "VAPCO Vung Ang II
 * coal-fired power plant") and an organisation's own spelling in a dataset
 * credit (B-029 "Aberystwyth Univ. · soloEO · Wetlands International"). Each
 * is matched with the words around it, so the same token elsewhere still counts.
 */
const SOURCE_PROPER_WORDING_V162 = ["Vung Ang II coal-fired power plant", "Aberystwyth Univ. · soloEO"];

/** The text a reader sees, with its citations lifted out. */
function withoutCitationsV157(text) {
  let value = String(text || "").normalize("NFC");
  for (const pattern of CITATION_V157) value = value.replace(pattern, " ");
  for (const citation of DICTIONARY_CITATIONS_V162) value = value.split(citation).join(" ");
  for (const wording of SOURCE_PROPER_WORDING_V162) value = value.split(wording).join(" ");
  return value;
}

/** A programmer's identifier, and the words that only appear in our own notes. */
const CAMEL_CASE_V157 = /\b[a-z][a-z0-9]*[A-Z][A-Za-z0-9]*\b/gu;
const SNAKE_CASE_V157 = /\b[a-z][a-z0-9]*(?:_[a-z0-9]+)+\b/gu;
const KEBAB_CASE_V157 = /\b[a-z][a-z0-9]*(?:-[a-z0-9]+)+\b/gu;
const TAG_SYNTAX_V157 = /\b[a-z][a-z0-9_]*=[a-z][a-z0-9_/]*\b/gu;
// V162 (user decision 2026-09-30): a file name in the text a reader sees - a
// link's href is not text, and a URL is masked as a citation above - is a
// working file on the screen (C-003 "nap_report_eng_small.pdf").
const FILE_NAME_V162 = /[\w.-]+\.(?:pdf|xlsx?|csv|docx?|hwpx?|pptx?|zip|json|geojson|shp|txt)\b/giu;
// 제안서 is a document a project has; 제안 on its own is how we write to each other.
const NOTE_WORDS_V157 = /렌더러|폴리곤|조인\s*키|\bkind\b|choropleth|boundaryPolicy|후속|제안(?![\uAC00-\uD7A3])/gu;
// 2차 검토(2026-09-30): 우리끼리 쓰는 한국어 어휘. 읽는 사람에게는 과업 용어다.
const WORK_WORDS_V157 =
  /재납품|납품|필요한\s*자료|금지|가능하면|등록\s*필요|카드로만|옆\s*카드로|레이어|표출|원천|병합|미정|토글|열\s*\d+개/gu;

/**
 * Every finding in one string, with what matched and the words around it.
 *
 * `hyphens` is false for a screen whose text is mostly the provider's prose: there
 * "long-term" is English, while camelCase, snake_case, a tag and our note words still
 * read as something left behind.
 */
function findingsIn(text, { hyphens = true, notes = true } = {}) {
  let value = withoutCitationsV157(text);
  if (!value.trim()) return [];
  const hits = [];
  // A file name counts once, as a file name - not again as snake_case.
  FILE_NAME_V162.lastIndex = 0;
  for (const match of value.matchAll(FILE_NAME_V162)) {
    const at = match.index ?? value.indexOf(match[0]);
    hits.push({ kind: "file-name", token: match[0], context: value.slice(Math.max(0, at - 70), at + match[0].length + 50).replace(/\s+/gu, " ").trim() });
  }
  value = value.replace(FILE_NAME_V162, " ");
  for (const [kind, pattern] of [
    ["camelCase", CAMEL_CASE_V157],
    ["snake_case", SNAKE_CASE_V157],
    ...(hyphens ? [["kebab-case", KEBAB_CASE_V157]] : []),
    ["tag-syntax", TAG_SYNTAX_V157],
    ...(notes ? [["note-word", NOTE_WORDS_V157], ["work-word", WORK_WORDS_V157]] : []),
  ]) {
    pattern.lastIndex = 0;
    for (const match of value.matchAll(pattern)) {
      const token = match[0];
      if (ALLOWED_TOKENS_V157.has(token)) continue;
      const at = match.index ?? value.indexOf(token);
      hits.push({
        kind,
        token,
        context: value.slice(Math.max(0, at - 70), at + token.length + 50).replace(/\s+/gu, " ").trim(),
      });
    }
  }
  return hits;
}

/** The provider's prose lives on the detail screen; our own strings elsewhere. */
const HYPHENS_COUNT_V157 = (where) => where !== "detail";

/**
 * A finding that is the provider's own label, not our wording.
 *
 * Each one says why it stands and what will end it, so the list cannot quietly become
 * a place to hide findings. An exception is reported, and counted, separately.
 */
const EXCEPTIONS_V157 = [
  // V162 (PR 2 e): A-027's OSM class values read "협궤 철도 (narrow_gauge)" and
  // B-026's run-together province spellings are spaced - both exceptions ended.
];

/** Is this finding one of the recorded exceptions? */
function exceptionFor(where, elementId, tokens) {
  return (
    EXCEPTIONS_V157.find(
      (row) =>
        row.elementId === elementId &&
        row.where === where &&
        tokens.every((entry) =>
          row.kinds
            ? row.kinds.includes(entry.split(":")[0])
            : row.tokens.some((token) => entry.split(":").slice(1).join(":").includes(token))
        )
    ) || null
  );
}

const record = (report, where, elementId, field, text) => {
  const hits = findingsIn(text, {
    hyphens: HYPHENS_COUNT_V157(where),
    notes: HYPHENS_COUNT_V157(where),
  });
  report.scanned += 1;
  if (!hits.length) return;
  const tokens = [...new Set(hits.map((hit) => `${hit.kind}:${hit.token}`))];
  const exception = exceptionFor(where, elementId, tokens);
  (exception ? report.exceptions : report.findings).push({
    ...(exception ? { reason: exception.reason, until: exception.until } : {}),
    where,
    elementId,
    field,
    tokens: [...new Set(hits.map((hit) => `${hit.kind}:${hit.token}`))],
    snippets: [...new Map(hits.map((hit) => [hit.token, hit.context])).entries()].map(
      ([token, context]) => `${token} — ${context}`
    ),
    text: String(text).normalize("NFC").replace(/\s+/gu, " ").trim().slice(0, 240),
  });
};

mkdirSync(resolve(ROOT, "reports/v157"), { recursive: true });
const mapIndex = JSON.parse(readFileSync(resolve(ROOT, "public/data/vietnam/v2/map-index.json"), "utf8"));
const activeIds = mapIndex.layers.filter((layer) => layer.enabled !== false).map((layer) => layer.elementId);

const server = externalBase ? null : await startStaticBuildServer(resolve(ROOT, opt("build", "build")), { port: PORT });
const base = (externalBase || server.url).replace(/\/$/u, "");
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 }, locale: "ko-KR" });
const report = {
  schema: "public-wording-scan-v157",
  generatedAt: new Date().toISOString(),
  base,
  activeLayers: activeIds.length,
  scanned: 0,
  findings: [],
  exceptions: [],
};

// ---- 1. the map list, every group expanded, every info panel open
await page.goto(`${base}/?view=map&country=${COUNTRY}#map`, { waitUntil: "domcontentloaded" });
await page.waitForSelector('[data-testid="map-all-data-layer-v135"]', { state: "attached", timeout: 90_000 });
await page.waitForTimeout(1600);
await page.evaluate(() => {
  document.querySelectorAll('[data-testid="map-catalog-group-toggle-v138"]').forEach((toggle) => {
    if (toggle.getAttribute("aria-expanded") !== "true") toggle.click();
  });
});
await page.waitForTimeout(900);
const listedIds = await page.$$eval(".cdp-map-catalog-v138__item[data-map-element]", (rows) =>
  rows.map((row) => row.getAttribute("data-map-element"))
);
report.listedRows = listedIds.length;
for (const elementId of listedIds) {
  const row = await page.evaluate((id) => {
    const item = document.querySelector(`.cdp-map-catalog-v138__item[data-map-element="${id}"]`);
    if (!item) return null;
    const tidy = (value) => String(value || "").normalize("NFC").replace(/\s+/gu, " ").trim();
    const info = item.querySelector(".cdp-map-catalog-v138__info");
    if (info && info.getAttribute("aria-expanded") !== "true") info.click();
    return { title: tidy(item.querySelector("strong, h4, label")?.textContent), row: tidy(item.innerText) };
  }, elementId);
  if (!row) continue;
  await page.waitForTimeout(120);
  const facts = await page.evaluate((id) => {
    const item = document.querySelector(`.cdp-map-catalog-v138__item[data-map-element="${id}"]`);
    const panel = item?.querySelector('[data-testid="map-catalog-info-v138"]');
    const tidy = (value) => String(value || "").normalize("NFC").replace(/\s+/gu, " ").trim();
    return [...(panel?.querySelectorAll("div") || [])].map((entry) => ({
      label: tidy(entry.querySelector("dt")?.textContent),
      value: tidy(entry.querySelector("dd")?.textContent),
    }));
  }, elementId);
  record(report, "map-list", elementId, "row", row.row);
  facts.forEach((fact) => record(report, "map-list-info", elementId, fact.label || "(칸 없음)", fact.value));
}

// ---- 2. every drawn layer: legend and selection panel
for (const elementId of activeIds) {
  await page.goto(`${base}/?view=map&country=${COUNTRY}#map`, { waitUntil: "domcontentloaded" });
  await page.waitForSelector('[data-testid="map-all-data-layer-v135"]', { state: "attached", timeout: 90_000 });
  await page.waitForTimeout(1200);
  const present = await page.evaluate((id) => {
    const input = document.querySelector(`[data-testid="map-all-data-layer-v135"][data-element-id="${id}"]`);
    if (!input || input.disabled) return false;
    const toggle = input.closest("[data-map-group-v135]")?.querySelector('[data-testid="map-catalog-group-toggle-v138"]');
    if (toggle && toggle.getAttribute("aria-expanded") !== "true") toggle.click();
    input.click();
    return true;
  }, elementId);
  if (!present) continue;
  await page.waitForTimeout(3200);
  const legend = await page.evaluate(() => {
    const tidy = (value) => String(value || "").normalize("NFC").replace(/\s+/gu, " ").trim();
    return {
      legend: tidy(document.querySelector(".cdp-map-legend, [data-testid='map-legend-v138']")?.innerText),
      summary: tidy(document.querySelector('[data-testid="map-national-summary"]')?.innerText),
    };
  });
  record(report, "map-legend", elementId, "legend", legend.legend);
  record(report, "map-summary", elementId, "summary", legend.summary);
  const select = page.locator('[data-testid="map-keyboard-feature-select"]');
  if ((await select.count()) > 0) {
    await select.first().click({ timeout: 10_000 }).catch(() => {});
    await page.waitForTimeout(1500);
    const panel = await page.evaluate(() => {
      const tidy = (value) => String(value || "").normalize("NFC").replace(/\s+/gu, " ").trim();
      return tidy(document.querySelector('[data-testid="map-selected-feature-panel"]')?.innerText);
    });
    record(report, "selection-panel", elementId, "panel", panel);
  }
}

// ---- 2b. the companion cards each host layer carries
const companions = JSON.parse(readFileSync(resolve(ROOT, "src/data/map/mapCompanionsV157.json"), "utf8"));
for (const host of companions.layers || []) {
  await page.goto(`${base}/?view=map&country=${COUNTRY}#map`, { waitUntil: "domcontentloaded" });
  await page.waitForSelector('[data-testid="map-all-data-layer-v135"]', { state: "attached", timeout: 90_000 });
  await page.waitForTimeout(1200);
  const drawn = await page.evaluate((id) => {
    const input = document.querySelector(`[data-testid="map-all-data-layer-v135"][data-element-id="${id}"]`);
    if (!input || input.disabled) return false;
    const toggle = input.closest("[data-map-group-v135]")?.querySelector('[data-testid="map-catalog-group-toggle-v138"]');
    if (toggle && toggle.getAttribute("aria-expanded") !== "true") toggle.click();
    input.click();
    return true;
  }, host.elementId);
  if (!drawn) continue;
  await page.waitForTimeout(3000);
  const cards = await page.evaluate(() => {
    const tidy = (value) => String(value || "").normalize("NFC").replace(/\s+/gu, " ").trim();
    const section = document.querySelector('[data-testid="map-companions-v157"]');
    if (!section) return { section: "", cards: [] };
    // Everything the reader can reach: the folded ones are opened first.
    [...section.querySelectorAll("button")].forEach((button) => {
      if (/더 보기/u.test(button.textContent || "")) button.click();
    });
    return {
      section: tidy(section.innerText),
      cards: [...section.querySelectorAll("li")].map((card) => tidy(card.innerText)),
    };
  });
  record(report, "companion-section", host.elementId, "section", cards.section);
  cards.cards.forEach((card, index) => record(report, "companion-card", host.elementId, `card ${index + 1}`, card));
}

// ---- 3. each map dataset's detail text
if (!flag("skip-detail")) {
  const targets = JSON.parse(
    readFileSync(resolve(ROOT, "src/data/visualization/publicMapTargetsV138.json"), "utf8")
  );
  // V162: a detail page with every section open is heavy - the pages are read
  // in batches of 20, each batch in its own browser context that is closed
  // before the next one opens, one page at a time.
  const DETAIL_BATCH_V162 = 20;
  const allTargets = targets.targets || targets;
  for (let start = 0; start < allTargets.length; start += DETAIL_BATCH_V162) {
    const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, locale: "ko-KR" });
    const detailPage = await context.newPage();
    for (const target of allTargets.slice(start, start + DETAIL_BATCH_V162)) {
    await detailPage.goto(`${base}/?view=data&country=${COUNTRY}&element=${target.elementId}&detailLayers=all#element-detail`, {
      waitUntil: "domcontentloaded",
    });
    await detailPage.waitForSelector('[data-testid="public-analysis-root"]', { timeout: 60_000 }).catch(() => null);
    await detailPage.waitForTimeout(400);
    const text = await detailPage.evaluate(async () => {
      const tidy = (value) => String(value || "").normalize("NFC").replace(/\s+/gu, " ").trim();
      // V162: a closed table (the raw-data table in 'Detail data') is text a
      // reader opens with one click - open every <details> before reading.
      const root = document.querySelector('[data-testid="public-analysis-root"]');
      (root || document).querySelectorAll("details:not([open])").forEach((node) => { node.open = true; });
      await new Promise((done) => setTimeout(done, 300));
      return tidy(root?.innerText || document.body.innerText);
    });
    record(report, "detail", target.elementId, "analysis", text);
    }
    await detailPage.close();
    await context.close();
  }
}

report.findingCount = report.findings.length;
report.exceptionCount = report.exceptions.length;
report.status = report.findingCount === 0 ? "PASS" : "FAIL";
writeFileSync(REPORT_PATH, `${JSON.stringify(report, null, 2)}\n`, "utf8");
await browser.close();
if (server) await server.close();
process.stdout.write(
  `${JSON.stringify({ type: "summary", schema: report.schema, status: report.status, scanned: report.scanned, listedRows: report.listedRows, activeLayers: report.activeLayers, findings: report.findingCount, exceptions: report.exceptionCount, elements: [...new Set(report.findings.map((f) => f.elementId))] })}\n`
);
process.exitCode = report.status === "PASS" ? 0 : 1;
