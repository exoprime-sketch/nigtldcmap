#!/usr/bin/env node
/**
 * V158-B2: the public screens of one non-default country, checked in a real
 * browser against the 10-country rules.
 *
 * The release gate walks the default country only. A second country needs the
 * checks the gate cannot make for it: that its finder offers exactly the
 * elements its catalog publishes, that every detail page opens without a
 * runtime error, that no screen shows another target country's name or place
 * (unless the country's own delivered data carries it - allowed and listed),
 * that no bracket holds a non-Latin script, that Bengali text renders with a
 * real font, and that no page overflows sideways at the six review widths.
 *
 *   node scripts/v158/country-qa-v158.mjs --country bgd --build tmp/build-x [--registry-live]
 *     [--ids A-001,B-022] [--widths 320,390,768,1024,1440,1920] [--out reports/v158/country-qa-bgd-v158.json]
 *
 * `--registry-live` answers `data/countries.json` in the browser with the same
 * registry but the country marked live, so a country that is still preparing
 * can be walked as a reader would see it once published. Nothing on disk is
 * changed. Exit code 1 when any check fails.
 */
import { createRequire } from "node:module";
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { gunzipSync } from "node:zlib";

import { chromium } from "playwright";

import { startStaticBuildServer } from "../v125/browser-runtime.mjs";
import { countryPublicDirV158, repoRootV158, resolveCountryIso3V158 } from "./country-context-v158.mjs";

const ROOT = repoRootV158(import.meta.dirname);
const require = createRequire(import.meta.url);
require("sucrase/register/ts");
const {
  buildOtherCountryTermsV158,
  confirmedRegionEntriesV158,
  findCountryTermsV158,
  unionRegistryCountriesV158,
} = require(resolve(ROOT, "src/data/countries/countryTermsV158.ts"));
const COUNTRY_SPECIFIC = require(resolve(ROOT, "src/data/spec/countrySpecificElementsV158.json"));

const argv = process.argv.slice(2);
const opt = (name, fallback) => {
  const at = argv.indexOf(`--${name}`);
  return at >= 0 && argv[at + 1] ? argv[at + 1] : fallback;
};
const COUNTRY = resolveCountryIso3V158({ argv });
const BUILD = resolve(ROOT, opt("build", "build"));
const PORT = Number(opt("port", "4391"));
const CONCURRENCY = Number(opt("concurrency", "3"));
const REGISTRY_LIVE = argv.includes("--registry-live");
const WIDTHS = opt("widths", "320,390,768,1024,1440,1920").split(",").map(Number);
const OUT = resolve(ROOT, opt("out", `reports/v158/country-qa-${COUNTRY.toLowerCase()}-v158.json`));
const ONLY_IDS = opt("ids", "")
  .split(",")
  .map((value) => value.trim())
  .filter(Boolean);
if (!existsSync(BUILD)) throw new Error(`BUILD_NOT_FOUND: ${BUILD}`);

// Characters built without escape sequences so no tool in the chain rewrites them.
const BENGALI_BLOCK = new RegExp(`[${String.fromCharCode(0x980)}-${String.fromCharCode(0x9ff)}]`, "gu");
const REPLACEMENT_CHAR = String.fromCharCode(0xfffd);

// ------------------------------------------------------------------ inputs
const registry = JSON.parse(readFileSync(resolve(ROOT, "public/data/countries.json"), "utf8"));
const entry = registry.countries.find((row) => row.iso3 === COUNTRY);
if (!entry) throw new Error(`UNKNOWN_COUNTRY_IN_REGISTRY: ${COUNTRY}`);
if (!REGISTRY_LIVE && entry.status !== "live") {
  throw new Error(`${COUNTRY} is ${entry.status}; pass --registry-live to walk it as published`);
}
const liveRegistry = {
  ...registry,
  countries: registry.countries.map((row) => (row.iso3 === COUNTRY ? { ...row, status: "live" } : row)),
};

const DATA_DIR = resolve(ROOT, countryPublicDirV158(ROOT, COUNTRY));
const catalog = JSON.parse(readFileSync(resolve(DATA_DIR, "catalog.json"), "utf8"));
const NON_PUBLIC = new Set(["excluded", "not-provided"]);
const expectedFinder = catalog.elements
  .filter((row) => !NON_PUBLIC.has(row.publicStatus))
  .map((row) => row.elementId)
  .sort();
const expectedByCategory = expectedFinder.reduce((counts, id) => {
  counts[id[0]] = (counts[id[0]] ?? 0) + 1;
  return counts;
}, {});

const terms = buildOtherCountryTermsV158({
  displayedIso3: COUNTRY,
  countries: unionRegistryCountriesV158(registry.countries),
  regionEntries: confirmedRegionEntriesV158(),
});

/** Every string the country's delivery holds for an element: its packs and catalog row. */
function elementSourceTexts() {
  const texts = new Map();
  const add = (elementId, value) => texts.set(elementId, `${texts.get(elementId) ?? ""}\n${value}`);
  for (const name of readdirSync(resolve(DATA_DIR, "packs"))) {
    const pack = JSON.parse(readFileSync(resolve(DATA_DIR, "packs", name), "utf8"));
    if (!Array.isArray(pack.payloadChunks)) continue;
    const payload = JSON.parse(gunzipSync(Buffer.from(pack.payloadChunks.join(""), "base64")).toString("utf8"));
    for (const [elementId, element] of Object.entries(payload.elements ?? {})) add(elementId, JSON.stringify(element));
  }
  for (const row of catalog.elements) add(row.elementId, JSON.stringify(row));
  return texts;
}
const sourceTexts = elementSourceTexts();

/** A hit the country's own delivered data carries is source-derived, not a leak. */
function classifyTermHits(text, elementId) {
  const source = elementId ? sourceTexts.get(elementId) ?? "" : "";
  const hits = findCountryTermsV158(text, terms);
  return hits.map((term) => {
    const found = text.indexOf(term.term);
    const at = found >= 0 ? found : text.toLowerCase().indexOf(term.term.toLowerCase());
    return {
      term: term.term,
      iso3: term.iso3,
      kind: term.kind,
      sourceDerived: findCountryTermsV158(source, [term]).length > 0,
      context: at >= 0 ? text.slice(Math.max(0, at - 40), at + term.term.length + 40) : null,
    };
  });
}

// A letter of a script other than Latin or Korean writing (Hangul, and the
// Hanja Korean text uses: "舊 BUR", "비(倍)"). Common, Inherited and Greek
// cover digits, units and signs such as "=" or the micro sign. A bracket may
// hold a formula or a URL; it may not hold a local script.
const OTHER_SCRIPT_LETTER =
  /(?=\p{L})[^\p{Script=Latin}\p{Script=Hangul}\p{Script=Han}\p{Script=Common}\p{Script=Inherited}\p{Script=Greek}]/u;

/**
 * Brackets holding a local script. One the delivery itself wrote, bracket and
 * all (a quoted clause "(ক)" in a legal note), is the source's text: allowed and
 * listed, never rewritten. Any other - one the screen composed, as around a
 * region name - is a finding.
 */
function nonLatinBrackets(text, elementId) {
  const source = elementId ? sourceTexts.get(elementId) ?? "" : "";
  return [...text.matchAll(/\(([^()]{1,120})\)/gu)]
    .map((match) => match[1])
    .filter((inside) => OTHER_SCRIPT_LETTER.test(inside))
    .map((inside) => {
      const at = text.indexOf(`(${inside})`);
      return {
        bracket: inside,
        sourceDerived: source.includes(`(${inside})`),
        context: text.slice(Math.max(0, at - 40), at + inside.length + 42),
      };
    });
}

// ------------------------------------------------------------------ browser
const server = await startStaticBuildServer(BUILD, { port: PORT });
const base = server.url.replace(/\/$/u, "");
const browser = await chromium.launch();
const context = await browser.newContext({ locale: "ko-KR" });
if (REGISTRY_LIVE) {
  await context.route(
    (url) => url.pathname.endsWith("/data/countries.json"),
    (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(liveRegistry) })
  );
}

function watchErrors(page) {
  const errors = [];
  page.on("pageerror", (error) => errors.push(`pageerror: ${String(error?.message || error).slice(0, 300)}`));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(`console: ${message.text().slice(0, 300)}`);
  });
  return errors;
}

async function readScreen(page) {
  return page.evaluate(async ([bengaliSource, replacement]) => {
    await document.fonts.ready;
    const root = document.querySelector("main") ?? document.body;
    const normalize = (value) => (value || "").replace(/\s+/gu, " ").trim();
    const fullText = normalize(root.innerText);
    // The compare block names the other compared countries by design; it is
    // read on its own and left out of the other-country scan.
    const compareNode = document.querySelector('[data-testid="country-compare-v158"]');
    const compareText = compareNode ? normalize(compareNode.innerText) : "";
    // A country selector lists the offered countries by design; its options
    // are read on their own and left out of the scan too.
    const selectors = [...root.querySelectorAll("select")]
      .map((node) => [...node.options].map((option) => option.textContent.trim()).join(" · "))
      .filter(Boolean);
    const hide = document.createElement("style");
    hide.textContent = "select { display: none !important; }";
    document.head.appendChild(hide);
    const scanText = normalize(root.innerText);
    hide.remove();
    const text = compareText ? scanText.replace(compareText, " ") : scanText;
    const bengali = fullText.match(new RegExp(bengaliSource, "gu")) ?? [];
    const sample = Array.from(new Set(bengali)).join("");
    const compare = document.querySelector('[data-testid="country-compare-v158"]');
    return {
      text,
      bengaliCount: bengali.length,
      bengaliFontUsable: sample ? document.fonts.check('16px "Noto Sans Bengali"', sample) : null,
      replacementCount: fullText.split(replacement).length - 1,
      selectors,
      compare: compare
        ? {
            text: compareText.slice(0, 240),
            state: compare.getAttribute("data-state"),
            chips: compare.querySelectorAll('[data-testid="country-compare-chip-v158"]').length,
            sourceNote: Boolean(compare.querySelector('[data-testid="country-compare-source-note-v158"]')),
            unitNote: Boolean(compare.querySelector('[data-testid="country-compare-unit-note-v158"]')),
          }
        : null,
    };
  }, [BENGALI_BLOCK.source, REPLACEMENT_CHAR]);
}

async function waitForDetail(page) {
  await page
    .waitForFunction(
      () => {
        const root = document.querySelector('[data-testid="public-analysis-root"]');
        if (root && ["ready", "empty"].includes(root.getAttribute("data-analysis-state") || "")) return true;
        return Boolean(
          document.querySelector('[data-testid="public-status-only"], [data-testid="detail-excluded-v156"]')
        );
      },
      null,
      { timeout: 45000 }
    )
    .catch(() => {});
  await page.waitForTimeout(400);
}

const detailUrl = (elementId) => `/?country=${COUNTRY}&element=${elementId}#element-detail`;

// Finder: the full list, loaded to the end.
async function checkFinder() {
  const page = await context.newPage();
  await page.setViewportSize({ width: 1440, height: 900 });
  const errors = watchErrors(page);
  await page.goto(`${base}/?country=${COUNTRY}#explorer`, { waitUntil: "domcontentloaded", timeout: 60000 });
  await page.waitForSelector('[data-testid="finder-results-v136"]', { timeout: 60000 });
  await page.waitForTimeout(800);
  for (let round = 0; round < 40; round += 1) {
    const remaining = await page
      .locator('[data-testid="finder-scroll-sentinel-v136"]')
      .getAttribute("data-remaining", { timeout: 2000 })
      .catch(() => "0");
    if (Number(remaining) <= 0) break;
    await page.locator('[data-testid="finder-scroll-sentinel-v136"]').scrollIntoViewIfNeeded().catch(() => {});
    await page.waitForTimeout(300);
  }
  const finder = await page.evaluate(() => {
    const results = document.querySelector('[data-testid="finder-results-v136"]');
    return {
      total: Number(results?.getAttribute("data-total-count") ?? -1),
      ids: [...document.querySelectorAll('[data-testid="public-finder-card-v135"]')].map((node) =>
        node.getAttribute("data-element-id")
      ),
      url: window.location.search,
    };
  });
  const screen = await readScreen(page);
  await page.close();
  const shown = Array.from(new Set(finder.ids)).sort();
  const byCategory = shown.reduce((counts, id) => {
    counts[id[0]] = (counts[id[0]] ?? 0) + 1;
    return counts;
  }, {});
  return {
    url: finder.url,
    total: finder.total,
    expected: expectedFinder.length,
    missing: expectedFinder.filter((id) => !shown.includes(id)),
    unexpected: shown.filter((id) => !expectedFinder.includes(id)),
    byCategory,
    expectedByCategory,
    countryNameShown: screen.text.includes(entry.nameKo),
    otherCountry: classifyTermHits(screen.text, null),
    nonLatinBrackets: nonLatinBrackets(screen.text, null),
    selectors: screen.selectors,
    errors,
  };
}

async function checkDetail(page, elementId, errors) {
  errors.length = 0;
  await page.goto(`${base}${detailUrl(elementId)}`, { waitUntil: "domcontentloaded", timeout: 60000 });
  await waitForDetail(page);
  const screen = await readScreen(page);
  const url = await page.evaluate(() => window.location.search);
  return {
    elementId,
    url,
    countryKept: new URLSearchParams(url).get("country") === COUNTRY,
    publicStatus: catalog.elements.find((row) => row.elementId === elementId)?.publicStatus ?? null,
    countryNameShown: screen.text.includes(entry.nameKo),
    errors: [...errors],
    otherCountry: classifyTermHits(screen.text, elementId),
    nonLatinBrackets: nonLatinBrackets(screen.text, elementId),
    selectors: screen.selectors,
    bengaliCount: screen.bengaliCount,
    bengaliFontUsable: screen.bengaliFontUsable,
    replacementCount: screen.replacementCount,
    compare: screen.compare,
    textLength: screen.text.length,
  };
}

async function overflowAt(page, url, width, detail) {
  await page.setViewportSize({ width, height: 900 });
  await page.goto(`${base}${url}`, { waitUntil: "domcontentloaded", timeout: 60000 });
  if (detail) await waitForDetail(page);
  else await page.waitForTimeout(1200);
  return page.evaluate(() => {
    const doc = document.documentElement;
    return Math.max(0, doc.scrollWidth - doc.clientWidth);
  });
}

const allIds = catalog.elements.map((row) => row.elementId).sort();
const detailIds = ONLY_IDS.length > 0 ? allIds.filter((id) => ONLY_IDS.includes(id)) : allIds;

const finder = ONLY_IDS.length > 0 ? null : await checkFinder();

const details = [];
const queue = [...detailIds];
await Promise.all(
  Array.from({ length: CONCURRENCY }, async () => {
    const page = await context.newPage();
    await page.setViewportSize({ width: 1440, height: 900 });
    const errors = watchErrors(page);
    for (;;) {
      const elementId = queue.shift();
      if (!elementId) break;
      details.push(await checkDetail(page, elementId, errors));
    }
    await page.close();
  })
);
details.sort((left, right) => left.elementId.localeCompare(right.elementId));

// Overflow: the finder and a sample of detail pages - the country-specific
// elements, every compare shape, and each page carrying Bengali text.
const overflowIds = Array.from(
  new Set([
    ...COUNTRY_SPECIFIC.elementIds,
    ...details.filter((row) => row.compare).map((row) => row.elementId),
    ...details.filter((row) => row.bengaliCount > 0).map((row) => row.elementId),
  ])
)
  .filter((id) => detailIds.includes(id))
  .sort();
const overflowScreens = [
  ...(ONLY_IDS.length > 0 ? [] : [{ key: "finder", url: `/?country=${COUNTRY}#explorer`, detail: false }]),
  ...overflowIds.map((id) => ({ key: `detail:${id}`, url: detailUrl(id), detail: true })),
];
const overflow = [];
const overflowQueue = overflowScreens.flatMap((screen) => WIDTHS.map((width) => ({ ...screen, width })));
await Promise.all(
  Array.from({ length: CONCURRENCY }, async () => {
    const page = await context.newPage();
    for (;;) {
      const job = overflowQueue.shift();
      if (!job) break;
      const pixels = await overflowAt(page, job.url, job.width, job.detail);
      if (pixels > 0) overflow.push({ key: job.key, width: job.width, pixels });
    }
    await page.close();
  })
);
overflow.sort((left, right) => left.key.localeCompare(right.key) || left.width - right.width);

await context.close();
await browser.close();
await server.close();

// ------------------------------------------------------------------ verdict
const leaks = details.flatMap((row) =>
  row.otherCountry.filter((hit) => !hit.sourceDerived).map((hit) => ({ elementId: row.elementId, ...hit }))
);
const sourceDerived = details.flatMap((row) =>
  row.otherCountry.filter((hit) => hit.sourceDerived).map((hit) => ({ elementId: row.elementId, ...hit }))
);
const finderLeaks = finder ? finder.otherCountry : [];
const allBrackets = [
  ...(finder ? finder.nonLatinBrackets.map((hit) => ({ elementId: "finder", ...hit })) : []),
  ...details.flatMap((row) => row.nonLatinBrackets.map((hit) => ({ elementId: row.elementId, ...hit }))),
];
const brackets = allBrackets.filter((hit) => !hit.sourceDerived);
const sourceBrackets = allBrackets.filter((hit) => hit.sourceDerived);
const selectorTexts = Array.from(
  new Set([...(finder ? finder.selectors : []), ...details.flatMap((row) => row.selectors)])
);
const runtimeErrors = [
  ...(finder ? finder.errors.map((error) => ({ elementId: "finder", error })) : []),
  ...details.flatMap((row) => row.errors.map((error) => ({ elementId: row.elementId, error }))),
];
const bengaliPages = details.filter((row) => row.bengaliCount > 0);
const brokenBengali = bengaliPages.filter((row) => row.bengaliFontUsable !== true || row.replacementCount > 0);
const lostCountry = details.filter((row) => !row.countryKept);
const compareStates = details
  .filter((row) => row.compare)
  .reduce((counts, row) => {
    counts[row.compare.state] = (counts[row.compare.state] ?? 0) + 1;
    return counts;
  }, {});

const checks = {
  finderCount: finder
    ? finder.total === expectedFinder.length && finder.missing.length === 0 && finder.unexpected.length === 0
    : null,
  detailRuntimeErrors: runtimeErrors.length === 0,
  detailCountryKept: lostCountry.length === 0,
  otherCountryExpressions: leaks.length === 0 && finderLeaks.length === 0,
  nonLatinBrackets: brackets.length === 0,
  bengaliRendering: brokenBengali.length === 0,
  overflow: overflow.length === 0,
};

const report = {
  schema: "country-qa-v158",
  countryIso3: COUNTRY,
  build: opt("build", "build"),
  registryLive: REGISTRY_LIVE,
  checks,
  counts: {
    detailPages: details.length,
    finderShown: finder ? finder.total : null,
    finderExpected: expectedFinder.length,
    runtimeErrors: runtimeErrors.length,
    otherCountryLeaks: leaks.length + finderLeaks.length,
    otherCountrySourceDerived: sourceDerived.length,
    nonLatinBrackets: brackets.length,
    nonLatinBracketsSourceDerived: sourceBrackets.length,
    bengaliPages: bengaliPages.length,
    brokenBengaliPages: brokenBengali.length,
    overflowScreensChecked: overflowScreens.length,
    overflowWidths: WIDTHS,
    overflowFindings: overflow.length,
    compareStates,
  },
  finder,
  leaks: [...finderLeaks.map((hit) => ({ elementId: "finder", ...hit })), ...leaks],
  sourceDerived,
  brackets,
  sourceBrackets,
  selectorTexts,
  runtimeErrors,
  lostCountry: lostCountry.map((row) => ({ elementId: row.elementId, url: row.url })),
  brokenBengali: brokenBengali.map((row) => ({
    elementId: row.elementId,
    fontUsable: row.bengaliFontUsable,
    replacementCount: row.replacementCount,
  })),
  overflow,
  details: details.map(({ otherCountry, nonLatinBrackets: _brackets, errors, selectors: _selectors, ...row }) => ({
    ...row,
    otherCountryHits: otherCountry.length,
    errorCount: errors.length,
  })),
};
mkdirSync(dirname(OUT), { recursive: true });
writeFileSync(OUT, `${JSON.stringify(report, null, 2)}\n`, "utf8");
process.stdout.write(
  `${JSON.stringify({
    type: "summary",
    country: COUNTRY,
    ok: Object.values(checks).every((value) => value !== false),
    checks,
    counts: report.counts,
    out: OUT.replace(ROOT, "").replace(/\\/gu, "/"),
  })}\n`
);
if (!Object.values(checks).every((value) => value !== false)) process.exitCode = 1;
