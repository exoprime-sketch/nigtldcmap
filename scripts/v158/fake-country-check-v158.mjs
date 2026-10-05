#!/usr/bin/env node
/**
 * V158-B2: a third country that exists only in the browser, to prove the
 * screens take their countries from the registry and nothing else.
 *
 * The build is served as is. In the browser, `data/countries.json` answers with
 * the real registry plus a made-up live country "XTS" (and the second country
 * marked live), and `/data/xts/v2/**` answers with the second country's
 * delivery, its asset paths pointed at the XTS root. Nothing is written to the
 * build or the repository. If a screen had a country name, a count or a data
 * path written into it, the made-up country would be missing, mislabelled or
 * broken somewhere below.
 *
 *   node scripts/v158/fake-country-check-v158.mjs --build tmp/build-x [--source bgd]
 *     [--out reports/v158/fake-country-check-v158.json] [--promote PHL]
 *
 * V166 `--promote <ISO3>`: instead of a made-up country, a country the
 * registry names as "공개 예정" (a name-only row) is turned live in the
 * browser - its row given the data fields and the second country's delivery,
 * as its own delivery will be - to prove that changing its row alone puts it
 * on every screen, with no screen code changed.
 *
 * Exit code 1 when any check fails.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

import { chromium } from "playwright";

import { startStaticBuildServer } from "../v125/browser-runtime.mjs";
import { repoRootV158 } from "./country-context-v158.mjs";

const ROOT = repoRootV158(import.meta.dirname);
const argv = process.argv.slice(2);
const opt = (name, fallback) => {
  const at = argv.indexOf(`--${name}`);
  return at >= 0 && argv[at + 1] ? argv[at + 1] : fallback;
};
const BUILD = resolve(ROOT, opt("build", "build"));
const PORT = Number(opt("port", "4393"));
const OUT = resolve(ROOT, opt("out", "reports/v158/fake-country-check-v158.json"));
if (!existsSync(BUILD)) throw new Error(`BUILD_NOT_FOUND: ${BUILD}`);

const registry = JSON.parse(readFileSync(resolve(ROOT, "public/data/countries.json"), "utf8"));
const defaultEntry = registry.countries.find((row) => row.status === "live");
const sourceIso3 = opt("source", registry.countries.find((row) => row.iso3 !== defaultEntry.iso3).iso3).toUpperCase();
const sourceEntry = registry.countries.find((row) => row.iso3 === sourceIso3);
if (!sourceEntry) throw new Error(`UNKNOWN_SOURCE_COUNTRY: ${sourceIso3}`);

const PROMOTE = opt("promote", "").toUpperCase();
const promoted = PROMOTE ? registry.countries.find((row) => row.iso3 === PROMOTE) : null;
if (PROMOTE && (!promoted || promoted.status !== "preparing")) throw new Error(`NOT_A_PREPARING_COUNTRY: ${PROMOTE}`);
const fakeRoot = promoted ? `/data/${promoted.iso3.toLowerCase()}/v2` : "/data/xts/v2";
const FAKE = {
  iso3: promoted?.iso3 || "XTS",
  nameKo: promoted?.nameKo || "시험국",
  nameEn: promoted?.nameEn || "Testland",
  ...(promoted?.region ? { region: promoted.region } : {}),
  dataRoot: fakeRoot,
  adm: { level1: { count: 1, label: "시험 행정구역", asset: `${fakeRoot}/geometry/none.geojson`, keyScheme: "test" } },
  bbox: sourceEntry.bbox,
  defaultZoom: sourceEntry.defaultZoom,
  boundaryEpoch: "test",
  categoriesAvailable: sourceEntry.categoriesAvailable,
  status: "live",
};
const fakeRegistry = {
  ...registry,
  countries: promoted
    ? registry.countries.map((row) => (row.iso3 === sourceIso3 ? { ...row, status: "live" } : row.iso3 === FAKE.iso3 ? FAKE : row))
    : [...registry.countries.map((row) => (row.iso3 === sourceIso3 ? { ...row, status: "live" } : row)), FAKE],
};
const sourceRoot = sourceEntry.dataRoot.replace(/\/$/u, "");
const sourceProviderId = `${sourceIso3.toLowerCase()}-v158`;
const sourceCatalog = JSON.parse(readFileSync(resolve(BUILD, `.${sourceRoot}/catalog.json`), "utf8"));
const expectedFinder = sourceCatalog.elements.filter(
  (row) => !["excluded", "not-provided"].includes(row.publicStatus)
).length;
const notProvided = sourceCatalog.elements.find((row) => row.publicStatus === "not-provided")?.elementId ?? null;

const server = await startStaticBuildServer(BUILD, { port: PORT });
const base = server.url.replace(/\/$/u, "");
const browser = await chromium.launch(
  process.env.V125_BROWSER_EXECUTABLE ? { executablePath: process.env.V125_BROWSER_EXECUTABLE } : {}
);
const context = await browser.newContext({ locale: "ko-KR" });
await context.route(
  (url) => url.pathname.endsWith("/data/countries.json"),
  (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(fakeRegistry) })
);
await context.route(
  (url) => url.pathname.startsWith(`${FAKE.dataRoot}/`),
  (route) => {
    const url = new URL(route.request().url());
    const file = resolve(BUILD, `.${sourceRoot}${url.pathname.slice(FAKE.dataRoot.length)}`);
    if (!existsSync(file)) return route.fulfill({ status: 404, body: "" });
    let body = readFileSync(file);
    // Index files name their siblings by absolute path and the provider id;
    // point those at the made-up root. Packs are served byte for byte.
    if (file.endsWith(".json") && !/[\\/]packs[\\/][^\\/]*pack-/u.test(file)) {
      body = body
        .toString("utf8")
        .split(`${sourceRoot}/`)
        .join(`${FAKE.dataRoot}/`)
        .split(`"${sourceProviderId}"`)
        .join(`"${FAKE.iso3.toLowerCase()}-v158"`);
    }
    return route.fulfill({ status: 200, contentType: "application/json", body });
  }
);

function watchErrors(page) {
  const errors = [];
  page.on("pageerror", (error) => errors.push(`pageerror: ${String(error?.message || error).slice(0, 300)}`));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(`console: ${message.text().slice(0, 300)}`);
  });
  return errors;
}

async function open(path, waitFor) {
  const page = await context.newPage();
  await page.setViewportSize({ width: 1440, height: 900 });
  const errors = watchErrors(page);
  await page.goto(`${base}${path}`, { waitUntil: "domcontentloaded", timeout: 60000 });
  if (waitFor === "detail") {
    await page
      .waitForFunction(
        () => {
          const root = document.querySelector('[data-testid="public-analysis-root"]');
          if (root && ["ready", "empty"].includes(root.getAttribute("data-analysis-state") || "")) return true;
          return Boolean(document.querySelector('[data-testid="public-status-only"]'));
        },
        null,
        { timeout: 45000 }
      )
      .catch(() => {});
    await page.waitForTimeout(600);
  } else if (waitFor === "finder") {
    await page.waitForSelector('[data-testid="finder-results-v136"]', { timeout: 60000 }).catch(() => {});
    await page.waitForTimeout(1500);
  } else {
    await page.waitForTimeout(2500);
  }
  const state = await page.evaluate((fakeIso3) => {
    const main = document.querySelector("main") ?? document.body;
    const compare = document.querySelector('[data-testid="country-compare-v158"]');
    const select = [...document.querySelectorAll("select")].find((node) =>
      [...node.options].some((option) => option.value === "all")
    );
    return {
      search: window.location.search,
      text: (main.innerText || "").replace(/\s+/gu, " ").trim(),
      finderTotal: Number(
        document.querySelector('[data-testid="finder-results-v136"]')?.getAttribute("data-total-count") ?? -1
      ),
      countryOptions: select ? [...select.options].map((option) => option.textContent.trim()) : [],
      // V166: the country can be picked where the screen offers countries
      // (the home's buttons; a "공개 예정" name is not a button).
      pickable: document.querySelectorAll(`[data-country-picker] button[data-iso3="${fakeIso3}"]`).length,
      compare: compare
        ? {
            state: compare.getAttribute("data-state"),
            chips: [...compare.querySelectorAll('[data-testid="country-compare-chip-v158"]')].map((node) =>
              node.textContent.trim()
            ),
          }
        : null,
    };
  }, FAKE.iso3);
  await page.close();
  return { path, errors, ...state, text: undefined, textLength: state.text.length, fakeNameCount: state.text.split(FAKE.nameKo).length - 1 };
}

const fakeCountry = (path) => new URLSearchParams(path).get("country") === FAKE.iso3;
const results = {
  home: await open("/", "home"),
  finder: await open(`/?country=${FAKE.iso3}#explorer`, "finder"),
  details: [],
  defaultCompare: await open(`/?country=${defaultEntry.iso3}&element=A-001#element-detail`, "detail"),
};
for (const elementId of ["A-001", "B-022", "C-015", ...(notProvided ? [notProvided] : [])]) {
  results.details.push(await open(`/?country=${FAKE.iso3}&element=${elementId}#element-detail`, "detail"));
}
await context.close();
await browser.close();
await server.close();

const checks = {
  // The home screen lists the offered countries from the registry.
  homeListsFakeCountry: results.home.fakeNameCount > 0,
  // V166: and offers this one as a choice (a button), not as "공개 예정".
  homeOffersFakeCountry: results.home.pickable > 0,
  homeNoErrors: results.home.errors.length === 0,
  finderKeepsFakeCountry: fakeCountry(results.finder.search),
  finderCountFromFakeCatalog: results.finder.finderTotal === expectedFinder,
  finderOffersFakeCountry: results.finder.countryOptions.includes(FAKE.nameKo),
  finderNoErrors: results.finder.errors.length === 0,
  detailsKeepFakeCountry: results.details.every((row) => fakeCountry(row.search)),
  detailsNoErrors: results.details.every((row) => row.errors.length === 0),
  detailsNoCompareWithoutSeries: results.details.every((row) => row.compare === null),
  defaultCompareUnchangedByThirdCountry:
    results.defaultCompare.compare !== null &&
    results.defaultCompare.compare.chips.length === 2 &&
    !results.defaultCompare.compare.chips.includes(FAKE.nameKo),
  defaultNoErrors: results.defaultCompare.errors.length === 0,
};
const report = {
  schema: "fake-country-check-v158",
  build: opt("build", "build"),
  fakeCountry: { iso3: FAKE.iso3, nameKo: FAKE.nameKo, servedFrom: sourceIso3, promoted: Boolean(promoted) },
  expectedFinder,
  checks,
  results,
};
mkdirSync(dirname(OUT), { recursive: true });
writeFileSync(OUT, `${JSON.stringify(report, null, 2)}\n`, "utf8");
const ok = Object.values(checks).every(Boolean);
process.stdout.write(`${JSON.stringify({ type: "summary", ok, checks, out: OUT.replace(ROOT, "").replace(/\\/gu, "/") })}\n`);
if (!ok) process.exitCode = 1;
