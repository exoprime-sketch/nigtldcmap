// V151 gate: the 2025-07-01 34-unit boundary is the map's default outline, it
// is a lossless dissolve of the published 63-unit asset, and switching the
// outline never restates a value.
//
//   node scripts/v151/audit-boundary-34-v151.mjs
//   node scripts/v151/audit-boundary-34-v151.mjs --build build   (adds the browser checks)
//   [--out reports/v151/boundary-34-v151.json] [--skip-browser]
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const argv = process.argv.slice(2);
const arg = (name, fallback) => {
  const index = argv.indexOf(name);
  return index < 0 ? fallback : argv[index + 1];
};
const BUILD = resolve(ROOT, arg("--build", "build"));
const OUT = resolve(ROOT, arg("--out", "reports/v151/boundary-34-v151.json"));
const SKIP_BROWSER = argv.includes("--skip-browser");

const read = (path) => readFileSync(resolve(ROOT, path), "utf8");
const readJson = (path) => JSON.parse(read(path));
const checks = [];
const check = (name, status, actual, expected) => {
  checks.push({ type: "check", audit: "boundary-34:v151", name, status, actual, expected });
  process.stdout.write(`${JSON.stringify(checks[checks.length - 1])}\n`);
};
const equal = (name, actual, expected) =>
  check(name, JSON.stringify(actual) === JSON.stringify(expected) ? "PASS" : "FAIL", actual, expected);

// ---------------------------------------------------------------- the asset

const ASSET_PATH = "public/data/vietnam/v2/geometry/vnm-adm1-34.geojson";
const asset = readJson(ASSET_PATH);
const source = readJson("public/data/vietnam/v2/geometry/vnm-adm1-63.geojson");
const manifest = readJson("public/data/vietnam/v2/geometry/geometry-manifest.json");
const integrity = readJson("public/data/vietnam/v2/asset-integrity.json");
const crosswalk34 = readJson("reports/v138/map-targets-build-v138.json").crosswalk34;

equal("ASSET_FEATURE_COUNT", asset.features.length, 34);
equal("SOURCE_FEATURE_COUNT", source.features.length, 63);
equal("ASSET_BOUNDARY_SYSTEM", asset.metadata?.boundarySystem, "post-2025-34");
equal("ASSET_EFFECTIVE_DATE", asset.metadata?.effectiveDate, "2025-07-01");

const members = asset.features.flatMap((feature) => feature.properties.memberAdm1Codes);
const sourceCodes = source.features.map((feature) => feature.properties.adm1Code).sort();
equal("MEMBERS_COVER_EVERY_PROVINCE_ONCE", [...members].sort(), sourceCodes);

const crosswalkByRegion = new Map(
  crosswalk34.map((row) => [row.region, [...row.memberAdm1Codes].sort()])
);
const crosswalkMismatch = asset.features
  .map((feature) => feature.properties)
  .filter(
    (properties) =>
      JSON.stringify(crosswalkByRegion.get(properties.name)) !==
      JSON.stringify([...properties.memberAdm1Codes].sort())
  )
  .map((properties) => properties.name);
equal("ASSET_MATCHES_CROSSWALK34", crosswalkMismatch, []);

// A 63-keyed value must not be able to join onto a 34-unit polygon by accident.
const leakedCodes = asset.features
  .filter((feature) => feature.properties.adm1Code !== undefined)
  .map((feature) => feature.properties.name);
equal("NO_ADM1CODE_ON_34_UNITS", leakedCodes, []);
const unitCodes = asset.features.map((feature) => feature.properties.unitCode);
equal("UNIT_CODES_UNIQUE", new Set(unitCodes).size, 34);

// ---------------------------------------------------------------- provenance

const entry = manifest.assets.find((item) => item.kind === "adm1-boundary-34");
check("MANIFEST_ENTRY", entry ? "PASS" : "FAIL", entry ? entry.url : null, `/${ASSET_PATH.replace("public/", "")}`);
equal("NO_SYNTHESIZED_VERTEX", entry?.validation?.syntheticVertexCount, 0);
check(
  "AREA_CONSERVED",
  (entry?.validation?.areaDeltaPpmMax ?? Infinity) <= 1 ? "PASS" : "FAIL",
  entry?.validation?.areaDeltaPpmMax,
  "<= 1 ppm"
);
equal("GEOMETRY_VALID", entry?.validation?.geometryValidity, "pass");
equal("VALUES_NOT_AGGREGATED", entry?.valuesAreAggregated, false);
// Gaps the source leaves between provinces stay open rather than being drawn in.
const gaps = entry?.validation?.sourceGapsLeftOpen ?? [];
check(
  "SOURCE_GAPS_DECLARED_AND_SMALL",
  gaps.every((gap) => gap.areaKm2 <= 5 && gap.region && gap.memberAdm1Codes?.length) ? "PASS" : "FAIL",
  gaps,
  "each gap declared with region, members and area <= 5 km²"
);
equal("BOUNDARY_SYSTEMS_DECLARED", manifest.boundarySystems, {
  default: "post-2025-34",
  legacy: "pre-2025-63",
  valuesKeyedTo: "pre-2025-63",
});

const assetSha = createHash("sha256").update(readFileSync(resolve(ROOT, ASSET_PATH))).digest("hex");
equal("MANIFEST_SHA_MATCHES_BYTES", entry?.sha256, assetSha);
const integrityRow = (integrity.assets || []).find(
  (item) => String(item.url || "").endsWith("vnm-adm1-34.geojson")
);
equal("ASSET_INTEGRITY_SHA_MATCHES_BYTES", integrityRow?.sha256, assetSha);

// ---------------------------------------------------------------- the source

const contract = read("src/data/map/adminBoundaryV151.ts");
check(
  "DEFAULT_IS_34",
  /DEFAULT_BOUNDARY_SYSTEM_V151: BoundarySystemV151 = "post-2025-34"/u.test(contract) ? "PASS" : "FAIL",
  /DEFAULT_BOUNDARY_SYSTEM_V151: BoundarySystemV151 = "(?<value>[^"]+)"/u.exec(contract)?.groups?.value,
  "post-2025-34"
);
check(
  "VALUES_STAY_ON_63",
  /VALUE_BOUNDARY_SYSTEM_V151: BoundarySystemV151 = "pre-2025-63"/u.test(contract) ? "PASS" : "FAIL",
  /VALUE_BOUNDARY_SYSTEM_V151: BoundarySystemV151 = "(?<value>[^"]+)"/u.exec(contract)?.groups?.value,
  "pre-2025-63"
);
const unitRows = contract.match(/unitCode: "VN34-/gu) || [];
equal("CONTRACT_UNIT_ROWS", unitRows.length, 34);

// Copy must not leave a bare "63개 성·시" that reads as the current geography.
const COPY_FILES = [
  "src/pages/RealMapExplorerPage.tsx",
  "src/pages/DataGuidePage.tsx",
  "src/components/map/MapDataGuideV130.tsx",
  "src/components/data/public/DetailLocationMapV148.tsx",
  "src/components/data/public/PublicRegionScenarioSummaryV138.tsx",
  "src/components/data/public/WaterGeographyAnalysisV147.tsx",
  "src/data/visualization/publicRegionScenarioContractV138.ts",
  "src/data/visualization/publicMapWorkspaceV126.ts",
  "src/data/visualization/publicLimitationsRegistryV127.ts",
  "src/data/glossary/publicGlossaryV134.ts",
];
const QUALIFIER = /개편 전|개편 후|기준\)|boundarySystemLabelV151/u;
const unqualified = [];
for (const file of COPY_FILES) {
  // JSX wraps a sentence over several lines, so the qualifier is looked for in
  // the surrounding text rather than on the same physical line.
  const flat = read(file).replace(/\s+/gu, " ");
  for (const match of flat.matchAll(/63개/gu)) {
    const window = flat.slice(Math.max(0, match.index - 60), match.index + 60);
    if (QUALIFIER.test(window)) continue;
    unqualified.push(`${file}: …${window.trim()}…`);
  }
}
equal("NO_UNQUALIFIED_63_COPY", unqualified, []);

// ---------------------------------------------------------------- the screen

let browser = null;
let server = null;
const runtime = { checked: false, reason: "" };
if (SKIP_BROWSER) {
  runtime.reason = "--skip-browser";
} else if (!existsSync(resolve(BUILD, "index.html"))) {
  runtime.reason = "production build missing; run npm run build first";
} else {
  const { chromium } = await import("playwright");
  const { startStaticBuildServer } = await import("../v125/browser-runtime.mjs");
  server = await startStaticBuildServer(BUILD, { port: 0 });
  const base = server.url.replace(/\/$/u, "");
  browser = await chromium.launch(
    process.env.V125_BROWSER_EXECUTABLE
      ? { executablePath: process.env.V125_BROWSER_EXECUTABLE }
      : {}
  );
  const scale = Number(process.env.V125_TIMEOUT_SCALE || 1) || 1;
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 }, locale: "ko-KR" });
  // A blocked backdrop tile host is an environment condition, not an app error:
  // V150 designed the map to keep its data layers when the tiles are offline.
  // Same-origin failures are the app's own and are never excused.
  const NETWORK_ERROR = /net::ERR_|Failed to load resource/u;
  const consoleErrors = [];
  const sameOriginFailures = [];
  const externalFailures = new Set();
  page.on("console", (message) => {
    if (message.type() !== "error") return;
    if (NETWORK_ERROR.test(message.text())) return;
    consoleErrors.push(message.text());
  });
  page.on("requestfailed", (request) => {
    const url = request.url();
    if (url.startsWith(base)) sameOriginFailures.push(url.replace(base, ""));
    else externalFailures.add(new URL(url).host);
  });
  const boundaryRequests = [];
  page.on("request", (request) => {
    if (/vnm-adm1-(34|63)\.geojson/u.test(request.url())) {
      boundaryRequests.push(request.url().replace(base, ""));
    }
  });
  await page.goto(`${base}/#map`, { waitUntil: "domcontentloaded" });
  await page.waitForSelector(".cdp-map-boundary-system-v151", { timeout: 60_000 * scale });

  const panel = page.locator(".cdp-map-boundary-system-v151");
  equal("SCREEN_DEFAULT_SELECTION", await panel.getAttribute("data-boundary-system"), "post-2025-34");
  equal(
    "SCREEN_34_RADIO_CHECKED",
    await page.locator('input[name="cdp-map-boundary-system-v151"][value="post-2025-34"]').isChecked(),
    true
  );
  const notice = (await page.getByTestId("map-boundary-value-notice-v151").innerText()).trim();
  // V151-2 (reports/v151-2/REVIEW_V151-2.md §기대값 변경): with no dataset
  // focused the notice names where the per-layer aggregation rule appears; a
  // focused dataset shows its boundaryPolicy line instead.
  check(
    "SCREEN_VALUE_NOTICE",
    /집계 규칙|34개로 합산하지 않습니다|34개 성·시 값은|구성 범위|원자료가 개편 후 34개/u.test(notice) ? "PASS" : "FAIL",
    notice,
    "34개 경계의 값 규칙(정책 1줄 또는 안내) 고지"
  );
  await page.waitForFunction(
    () => Boolean(document.querySelector(".cdp-map-canvas-wrap")),
    undefined,
    { timeout: 30_000 * scale }
  );
  await page.waitForTimeout(2_500 * scale);
  check(
    "SCREEN_LOADS_34_ASSET_FIRST",
    boundaryRequests.some((url) => url.includes("vnm-adm1-34.geojson")) ? "PASS" : "FAIL",
    boundaryRequests,
    "vnm-adm1-34.geojson requested"
  );

  await page.locator('input[name="cdp-map-boundary-system-v151"][value="pre-2025-63"]').check();
  await page.waitForTimeout(2_500 * scale);
  equal("SCREEN_TOGGLE_TO_63", await panel.getAttribute("data-boundary-system"), "pre-2025-63");
  check(
    "SCREEN_LOADS_63_ASSET_ON_TOGGLE",
    boundaryRequests.some((url) => url.includes("vnm-adm1-63.geojson")) ? "PASS" : "FAIL",
    boundaryRequests,
    "vnm-adm1-63.geojson requested after the toggle"
  );
  const notice63 = (await page.getByTestId("map-boundary-value-notice-v151").innerText()).trim();
  check(
    "SCREEN_63_NOTICE",
    /개편 전 63개 성·시 기준|63개 성·시\(개편 전\) 기준/u.test(notice63) ? "PASS" : "FAIL",
    notice63,
    "63개(개편 전) 기준·원자료 값 그대로라는 고지"
  );

  // The preference has to survive a reload, like the backdrop toggle does.
  await page.reload({ waitUntil: "domcontentloaded" });
  await page.waitForSelector(".cdp-map-boundary-system-v151", { timeout: 60_000 * scale });
  equal("SCREEN_PREFERENCE_PERSISTS", await panel.getAttribute("data-boundary-system"), "pre-2025-63");

  // 6 widths, no horizontal document overflow, per the responsive rule.
  const overflow = [];
  for (const width of [320, 390, 768, 1024, 1440, 1920]) {
    await page.setViewportSize({ width, height: 900 });
    await page.waitForTimeout(500 * scale);
    const scrolled = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1
    );
    if (scrolled) overflow.push(width);
  }
  equal("SCREEN_NO_HORIZONTAL_OVERFLOW", overflow, []);
  equal("SCREEN_CONSOLE_ERROR", consoleErrors, []);
  equal("SCREEN_SAME_ORIGIN_REQUEST_FAILURE", [...new Set(sameOriginFailures)], []);
  check(
    "SCREEN_EXTERNAL_TILE_HOSTS_BLOCKED",
    "INFO",
    [...externalFailures],
    "환경 정보: 외부 타일 호스트가 막혀도 데이터·경계 레이어는 유지(V150 설계)"
  );
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.waitForTimeout(800 * scale);
  mkdirSync(resolve(ROOT, "reports/v151"), { recursive: true });
  await page.screenshot({ path: resolve(ROOT, "reports/v151/map-boundary-63-v151.png") });
  await page.locator('input[name="cdp-map-boundary-system-v151"][value="post-2025-34"]').check();
  await page.waitForTimeout(2_500 * scale);
  await page.screenshot({ path: resolve(ROOT, "reports/v151/map-boundary-34-v151.png") });
  runtime.checked = true;
}
if (!runtime.checked) {
  check("SCREEN_RUNTIME", SKIP_BROWSER ? "SKIP" : "FAIL", runtime.reason, "browser checks run");
}
if (browser) await browser.close();
if (server) await server.close();

const failed = checks.filter((row) => row.status === "FAIL");
const info = checks.filter((row) => row.status === "INFO");
const summary = {
  type: "summary",
  audit: "boundary-34:v151",
  status: failed.length ? "FAIL" : "PASS",
  passed: checks.filter((row) => row.status === "PASS").length,
  skipped: checks.filter((row) => row.status === "SKIP").length,
  info: info.length,
  failed: failed.length,
  total: checks.length,
  failedChecks: failed.map((row) => row.name),
  browserChecked: runtime.checked,
  generatedAt: new Date().toISOString(),
};
mkdirSync(dirname(OUT), { recursive: true });
writeFileSync(OUT, `${JSON.stringify({ summary, checks }, null, 2)}\n`);
process.stdout.write(`${JSON.stringify(summary)}\n`);
process.exit(failed.length ? 1 : 0);
