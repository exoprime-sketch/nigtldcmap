#!/usr/bin/env node
/**
 * V161: no internal working note reaches a public screen.
 *
 * Source lines, card providers and spec copy carried notes meant for the
 * project team - a status placeholder ("확인필요", "…(발주처 협의 예정)"), the
 * contractor that compiled a list ("…(용역사 취합)", the contractor's name),
 * a field-survey working file ("현지 컨설턴트 현지조사(Field Survey
 * Items_…_v2.0)") or a placeholder for a missing source ("원천 미기재").
 *
 * This reads the text of the production build as a reader gets it - every
 * finder card, every public element's detail page with all three layers open
 * (hidden rows and closed <details> included: textContent, not innerText), the
 * download page, the home and the map list - and requires zero matches.
 * The public set is derived from catalog.json (publicStatus not excluded /
 * not-provided), never a fixed count.
 *
 * Usage: node scripts/v161/audit-source-notes-v161.mjs [--build build] [--ids A-001,B-002] [--workers 3]
 * Writes reports/v161/source-notes-audit-v161.json.
 */
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";
import { startStaticBuildServer, scaledTimeoutMsV150 } from "../v125/browser-runtime.mjs";
import { countryPublicDirV158, countryRegistryV158, resolveCountryIso3V158, DEFAULT_COUNTRY_ISO3_V158 } from "../v158/country-context-v158.mjs";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const args = process.argv.slice(2);
const opt = (name, fallback) => {
  const index = args.indexOf(name);
  return index >= 0 && args[index + 1] ? args[index + 1] : fallback;
};
const BUILD = resolve(ROOT, opt("--build", "build"));
const WORKERS = Number(opt("--workers", "3"));
const ONLY = opt("--ids", null)?.split(",").map((id) => id.trim()).filter(Boolean) || null;
// V158: another country's screens with the same patterns. --country picks the
// catalog and the ?country= of every URL; --registry-live answers
// data/countries.json in the browser with that country live (a country still
// preparing is walked as published; nothing on disk changes);
// --include-not-provided also reads the detail pages of elements the country
// did not deliver. Without these options the run is the default country's, as before.
const COUNTRY = resolveCountryIso3V158({ argv: args });
const IS_DEFAULT = COUNTRY === DEFAULT_COUNTRY_ISO3_V158;
const REGISTRY_LIVE = args.includes("--registry-live");
const INCLUDE_NOT_PROVIDED = args.includes("--include-not-provided");
const COUNTRY_QUERY = IS_DEFAULT ? "" : `?country=${COUNTRY}`;
const OUT = resolve(ROOT, `reports/v161/source-notes-audit-v161${IS_DEFAULT ? "" : `-${COUNTRY.toLowerCase()}`}.json`);

const catalog = JSON.parse(readFileSync(resolve(ROOT, countryPublicDirV158(ROOT, COUNTRY), "catalog.json"), "utf8")).elements;
const PUBLIC_IDS = catalog
  .filter((element) => element.publicStatus !== "excluded" && (INCLUDE_NOT_PROVIDED || element.publicStatus !== "not-provided"))
  .map((element) => element.elementId);
const DETAIL_IDS = ONLY ? PUBLIC_IDS.filter((id) => ONLY.includes(id)) : PUBLIC_IDS;

/** The note patterns (same families the screen's judge function removes). */
export const SOURCE_NOTE_PATTERNS_V161 = [
  ["status placeholder", /확인필요|발주처/u],
  ["contractor", /용역사|STADT/u],
  ["field survey", /현지조사|현지\s*컨설턴트/u],
  ["missing-source placeholder", /원천\s*미기재/u],
  // A card or detail row filled with a placeholder instead of being left out.
  // textContent joins a <dt> to its <dd> with no space ("자료기간미기재").
  // A data category the delivery left blank reads a bare "미기재" (D-019
  // "미기재 7") - a data value, deliberately not matched here.
  ["unconfirmed provider placeholder", /제공기관\s*확인/u],
  ["missing period / unit placeholder", /자료기간\s*미기재|단위\s*미기재/u],
  // A source written as a plan instead of a source (E-011: "해당없음 — 공개
  // 원천 부재. 전문가 평가·현장조사로 생성 예정").
  ["no-source / planned placeholder", /해당\s*없음|공개\s*원천\s*부재|생성\s*예정/u],
  // A composite element's internal member numbering and its placeholder
  // (A-028: "OpenStreetMap (멤버1); 미특정 (멤버2)").
  ["internal member notation", /멤버\s*\d|미특정/u],
  ["working file / version", /Items_|_v\d+(?:\.\d+)*\b|\.(?:xlsx?|csv|docx?|hwpx?|pptx?)\b/iu],
  // V162 (user decision 2026-09-30): a PDF's file name is never on screen - a
  // link shows the document title or '원문 PDF' and keeps the file in href.
  // URLs are masked first, so a cited address is not a hit.
  ["PDF file name", /[^\s/()（）]+\.pdf\b/iu],
  // The delivery's internal record ids ("VNM-C017-FIT-001") and working paths.
  ["record id", /\b(?:VNM|BGD)-[A-E]\d{3}-/u],
  ["raw working path", /raw_data|raw는|raw\s*파일/iu],
];

/**
 * Content, not source notes - each kept deliberately and listed in the report:
 * the word 현지조사 as the data's own methodology, a data value or the public
 * missing-reason label. Every other occurrence (above all in a source line)
 * still fails. Published documents linked by URL are citations, not working
 * files, so URLs are masked before the file/version check.
 */
export const CONTENT_ALLOWLIST_V161 = [
  [/현지조사가 필요함/gu, "공개 결측 사유 라벨 M07(publicFieldPolicyV126 MISSING_REASON_LABELS)"],
  [/현지조사 결과 반영/gu, "B-044 데이터 값(핵심광물 부존 상태)"],
  [/현지조사(?:로 확보한|로 얻은|로 생성| 추정치|의? 범위값|에서도 확인)/gu, "명세서·활용 사례·기록 본문의 조사 방법 서술(A-022·B-038·B-046·B-047·E-007)"],
  [/\[상충\] 현지조사\(\d{4}-\d{2}-\d{2}\)는/gu, "E-007 기록 본문의 상충 설명(현지조사 결과와 법령 일정 차이)"],
  [/수집현황\s*현지조사/gu, "E-004 데이터 값(수집 현황 분류)"],
  // "해당없음" as a data value (not a source): scoped to the element whose
  // detail shows it, so the same word in any other place still fails.
  // Bangladesh's delivery writes the same value with a space (V158-B2b).
  [/해당\s?없음 — 사무소 미설치/gu, "E-019 데이터 값(해외사무소 소재지 — 사무소 없는 기관)", ["E-019"]],
  [/(?<=\d{4})해당 없음/gu, "E-012 표의 결측 사유 열 값('해당 없음' = 결측 아님)", ["E-012"]],
  [/해당 없음\(NMA 자체가/gu, "C-007 데이터 값(host 여부 설명)", ["C-007"]],
  [/한국 관련:\s*해당없음/gu, "A-029 데이터 값(협정의 한국 관련 여부)", ["A-029"]],
  [/발효일:\s*해당 없음\(미발효\)/gu, "A-029 데이터 값(미발효 협정의 발효일 — 발효 전이라 날짜가 없음)", ["A-029"]],
  // V162 (2026-09-30 delivery): data values and the data's own basis, scoped.
  [/현지조사 기준/gu, "B-038 데이터 값(값의 기준 구분 — 같은 지표의 두 값 가운데 현지조사 기준 값)", ["B-038"]],
  [/해당 없음 — 기관 운영 종료/gu, "E-004 데이터 값(연락 유형 — 운영이 끝난 기관)", ["E-004"]],
  [/해당 없음 — 재정지원 과제/gu, "E-007 데이터 값(등록 여부 — 재정지원 과제라 등록 대상 아님)", ["E-007"]],
  [/\[상충\] 현지조사(?:\s*결과)?\(\d{4}-\d{2}-\d{2}[^)]*\)는/gu, "E-007 기록 본문의 상충 설명(현지조사 결과와 법령 일정 차이, V162 표기)", ["E-007"]],
];
const URL_PATTERN_V161 = /https?:\/\/[^\s"'<>]+/gu;

function maskAllowed(text, elementId) {
  // Same-length masks, so a hit's offset still points into the original text.
  let masked = text.replace(URL_PATTERN_V161, (match) => " ".repeat(match.length));
  for (const [pattern, , ids] of CONTENT_ALLOWLIST_V161) {
    if (ids && !ids.includes(elementId)) continue;
    masked = masked.replace(pattern, (match) => " ".repeat(match.length));
  }
  return masked;
}

function findNotes(rawText, elementId = null) {
  const hits = [];
  const text = maskAllowed(rawText, elementId);
  for (const [family, pattern] of SOURCE_NOTE_PATTERNS_V161) {
    const global = new RegExp(pattern.source, `${pattern.flags.replace("g", "")}g`);
    for (const match of text.matchAll(global)) {
      const start = Math.max(0, match.index - 50);
      hits.push({ family, match: match[0], context: rawText.slice(start, match.index + match[0].length + 50).replace(/\s+/gu, " ").trim() });
    }
  }
  return hits;
}

const server = await startStaticBuildServer(BUILD, { port: 4401 });
const base = server.url.replace(/\/$/u, "");
const browser = await chromium.launch(process.env.V125_BROWSER_EXECUTABLE ? { executablePath: process.env.V125_BROWSER_EXECUTABLE } : {});
const findings = [];
const coverage = { finderCards: 0, detailPages: 0, other: [] };
const runtimeErrors = [];

async function page() {
  const context = await browser.newContext({ locale: "ko-KR", viewport: { width: 1440, height: 1000 } });
  if (REGISTRY_LIVE) {
    const registry = countryRegistryV158(ROOT);
    const live = { ...registry, countries: registry.countries.map((row) => (row.iso3 === COUNTRY ? { ...row, status: "live" } : row)) };
    await context.route((url) => url.pathname.endsWith("/data/countries.json"), (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(live) }));
  }
  const tab = await context.newPage();
  return { context, tab };
}
const mainText = (tab) => tab.evaluate(() => (document.querySelector("main") || document.body).textContent || "");

// ---- finder: every card
{
  const { context, tab } = await page();
  await tab.goto(`${base}/${COUNTRY_QUERY}#explorer`, { waitUntil: "networkidle", timeout: scaledTimeoutMsV150(90_000) });
  await tab.waitForSelector('[data-testid="public-finder-card-v135"]', { timeout: scaledTimeoutMsV150(60_000) });
  for (let guard = 0; guard < 20; guard += 1) {
    const shown = await tab.$$eval('[data-testid="public-finder-card-v135"]', (nodes) => nodes.length);
    const total = await tab.$eval('[data-testid="finder-results-v136"]', (node) => Number(node.getAttribute("data-total-count")));
    if (shown >= total) break;
    await tab.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
    await tab.waitForTimeout(700);
  }
  const cards = await tab.$$eval('[data-testid="public-finder-card-v135"]', (nodes) => nodes.map((node) => ({ id: node.getAttribute("data-element-id"), text: node.textContent || "" })));
  coverage.finderCards = cards.length;
  for (const card of cards) for (const hit of findNotes(card.text, card.id)) findings.push({ surface: "finder-card", elementId: card.id, ...hit });
  // the filter controls (제공기관 options) live outside the cards
  const controls = await tab.evaluate(() => [...document.querySelectorAll("select option")].map((option) => option.textContent || "").join("\n"));
  for (const hit of findNotes(controls)) findings.push({ surface: "finder-filter", elementId: null, ...hit });
  await context.close();
}

// ---- home, download, map list
for (const [surface, path, ready] of [
  ["home", `/${COUNTRY_QUERY}`, ".home-featured-v139__card"],
  ["download", `/?country=${COUNTRY}#download`, ".cdp-download-item[data-element-id]"],
  ["map", `/?country=${COUNTRY}&mapList=all#map`, ".cdp-map-catalog-v138__item[data-map-element]"],
]) {
  const { context, tab } = await page();
  try {
    await tab.goto(`${base}${path}`, { waitUntil: "networkidle", timeout: scaledTimeoutMsV150(90_000) });
    await tab.waitForSelector(ready, { timeout: scaledTimeoutMsV150(60_000) });
    await tab.waitForTimeout(1500);
    const text = await mainText(tab);
    const options = await tab.evaluate(() => [...document.querySelectorAll("select option")].map((option) => option.textContent || "").join("\n"));
    coverage.other.push(surface);
    for (const hit of findNotes(`${text}\n${options}`)) findings.push({ surface, elementId: null, ...hit });
  } catch (error) {
    runtimeErrors.push(`${surface}: ${String(error).slice(0, 160)}`);
  }
  await context.close();
}

// ---- detail: every public element, all layers open
const queue = [...DETAIL_IDS];
async function worker() {
  const { context, tab } = await page();
  while (queue.length) {
    const id = queue.shift();
    try {
      await tab.goto(`${base}/?view=data&country=${COUNTRY}&element=${id}&detailLayers=all#element-detail`, { waitUntil: "domcontentloaded", timeout: scaledTimeoutMsV150(90_000) });
      await tab.waitForFunction(() => document.querySelector('[data-testid="public-analysis-root"]')?.getAttribute("data-analysis-state") === "ready", null, { timeout: scaledTimeoutMsV150(60_000) }).catch(() => null);
      await tab.waitForTimeout(1200);
      const text = await mainText(tab);
      coverage.detailPages += 1;
      for (const hit of findNotes(text, id)) findings.push({ surface: "detail", elementId: id, ...hit });
    } catch (error) {
      runtimeErrors.push(`${id}: ${String(error).slice(0, 160)}`);
    }
  }
  await context.close();
}
await Promise.all(Array.from({ length: WORKERS }, worker));

await browser.close();
await server.close();

const byElement = {};
for (const hit of findings) {
  const key = hit.elementId || `(${hit.surface})`;
  byElement[key] = byElement[key] || new Set();
  byElement[key].add(`${hit.surface}: ${hit.match}`);
}
const summary = {
  country: COUNTRY,
  publicElements: PUBLIC_IDS.length,
  detailPagesChecked: coverage.detailPages,
  finderCardsChecked: coverage.finderCards,
  otherSurfaces: coverage.other,
  findings: findings.length,
  elementsWithFindings: Object.keys(byElement).length,
  runtimeErrors: runtimeErrors.length,
  pass: findings.length === 0 && runtimeErrors.length === 0 && coverage.detailPages === DETAIL_IDS.length,
};
mkdirSync(dirname(OUT), { recursive: true });
writeFileSync(OUT, `${JSON.stringify({ generatedAt: new Date().toISOString(), build: BUILD, summary, byElement: Object.fromEntries(Object.entries(byElement).map(([key, value]) => [key, [...value]])), findings, runtimeErrors }, null, 2)}\n`);
console.log(JSON.stringify(summary));
if (!summary.pass) process.exitCode = 1;
