#!/usr/bin/env node

import { createRequire } from "node:module";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

import ts from "typescript";

import {
  AuditV125,
  PROJECT_ROOT,
  V2_ROOT,
  catalogElements,
  readJson,
} from "./v125/audit-utils.mjs";
import {
  evaluateValue,
  launchHeadlessBrowser,
  navigate,
  setViewport,
  startStaticBuildServer,
  waitForValue,
} from "./v125/browser-runtime.mjs";
import { detailUrlV134, finishAuditV134 } from "./v134/audit-helpers.mjs";

const audit = new AuditV125("public-copy:v134");
const require = createRequire(import.meta.url);
require.extensions[".ts"] = (module, fileName) => {
  module._compile(
    ts.transpileModule(readFileSync(fileName, "utf8"), {
      compilerOptions: {
        esModuleInterop: true,
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2020,
      },
      fileName,
    }).outputText,
    fileName
  );
};

const headingModule = require(
  resolve(PROJECT_ROOT, "src/data/visualization/publicAnalysisHeadingsV134.ts")
);
const headings = headingModule.PUBLIC_ANALYSIS_HEADINGS_V134 || [];
const headingById = new Map(headings.map((row) => [row.elementId, row]));
const catalogResult = readJson(resolve(V2_ROOT, "catalog.json"));
const catalog = catalogElements(catalogResult.value);
const duplicateIds = headings
  .map((row) => row.elementId)
  .filter((id, index, values) => values.indexOf(id) !== index);
const missingFields = headings.filter(
  (row) =>
    !String(row.publicAnalysisTitle || "").trim() ||
    !String(row.primaryChartTitle || "").trim() ||
    !String(row.secondaryChartTitle || "").trim() ||
    !String(row.publicQuestion || "").trim()
);
const missingElements = catalog
  .map((row) => row.elementId)
  .filter((elementId) => !headingById.has(elementId));
const repeatedDatasetTitles = catalog
  .map((row) => ({
    elementId: row.elementId,
    datasetTitle: String(row.publicTitle || row.title || "").trim(),
    analysisTitle: String(headingById.get(row.elementId)?.publicAnalysisTitle || "").trim(),
  }))
  .filter(
    (row) =>
      row.datasetTitle &&
      row.analysisTitle &&
      row.datasetTitle === row.analysisTitle
  );
const statusOnlyIds = new Set(
  catalog
    .filter((row) =>
      ["schema-only", "data-entry-planned", "not-collected"].includes(
        String(row.publicStatus || "")
      )
    )
    .map((row) => row.elementId)
);
const fakeStatusOnlyHeadings = headings
  .filter((row) => statusOnlyIds.has(row.elementId))
  .filter((row) =>
    /(?:규모와\s*(?:분야|분포)|공개\s*값과\s*항목별\s*차이|연도별\s*(?:변화|성과)|시나리오별\s*전망)/u.test(
      [
        row.publicAnalysisTitle,
        row.primaryChartTitle,
        row.secondaryChartTitle,
        row.publicQuestion,
      ].join(" ")
    )
  );

audit.check("FRAMEWORK_ELEMENTS", catalog.length === 152, catalog.length, 152);
audit.check("PUBLIC_ANALYSIS_HEADING_COVERAGE", headings.length === 152 && duplicateIds.length === 0 && missingElements.length === 0, { count: headings.length, duplicateIds, missingElements }, { count: 152, duplicateIds: [], missingElements: [] });
audit.check("PUBLIC_ANALYSIS_HEADING_FIELDS", missingFields.length === 0, missingFields, []);
audit.check("ANALYSIS_TITLE_NOT_DATASET_TITLE", repeatedDatasetTitles.length === 0, repeatedDatasetTitles, []);
audit.check("STATUS_ONLY_COPY_PROMISES_NO_FAKE_ANALYSIS", fakeStatusOnlyHeadings.length === 0, fakeStatusOnlyHeadings, []);

const sourceFiles = [
  "src/components/data/semantic/SemanticArchetypePreviewV125.tsx",
  "src/components/data/semantic/SemanticContractRendererV125.tsx",
  "src/components/data/public/PublicDataAnalysisRouterV126.tsx",
  "src/data/visualization/publicCopyRegistryV126.ts",
].map((path) => resolve(PROJECT_ROOT, path));
const source = sourceFiles.filter(existsSync).map((path) => readFileSync(path, "utf8")).join("\n");
const forbiddenSourcePatterns = [
  ["범주 비교", /[">]범주 비교[<"]/u],
  ["분류 레코드", /분류 레코드/u],
  ["측정항목 N종", /측정항목\s*\{?[^<\n]*종/u],
  ["분류 N종", /분류\s*\{?[^<\n]*종/u],
  ["구성과 변화", /[">]구성과 변화[<"]/u],
];
const staticGenericHits = forbiddenSourcePatterns
  .filter(([, pattern]) => pattern.test(source))
  .map(([label]) => label);
audit.check("GENERIC_COPY_STATIC", staticGenericHits.length === 0, staticGenericHits, []);
audit.check("SAFE_DIMENSION_COPY_DOES_NOT_RESURRECT_REJECTED_RAW_TEXT", !/publicTextV126\(remainder\)\s*\|\|\s*remainder/u.test(source), true, true);

let server = null;
let browser = null;
let runtimeFailure = null;
const routeFailures = [];
const genericHits = [];
const titleMismatches = [];
const repeatedRuntimeHeadings = [];
const brokenAssets = [];
let inspectedRoutes = 0;
try {
  if (!existsSync(resolve(PROJECT_ROOT, "build/index.html"))) {
    throw new Error("production build missing; run npm run build before public copy audit");
  }
  server = await startStaticBuildServer(resolve(PROJECT_ROOT, "build"));
  browser = await launchHeadlessBrowser();
  await setViewport(browser.cdp, 1440, 1000);
  await browser.cdp.send("Network.enable");
  browser.cdp.on("Network.responseReceived", ({ response }) => {
    if (response?.url?.startsWith(server.origin) && Number(response.status) >= 400) {
      brokenAssets.push({ url: response.url, status: response.status });
    }
  });
  for (const element of catalog) {
    const elementId = String(element.elementId || "");
    const expected = headingById.get(elementId);
    try {
      await navigate(browser.cdp, detailUrlV134(server.url, elementId));
      await waitForValue(
        browser.cdp,
        "document.querySelector('[data-testid=\"public-analysis-root\"]')?.getAttribute('data-analysis-state') === 'ready'",
        { timeoutMs: 25_000 }
      );
      const snapshot = await evaluateValue(
        browser.cdp,
        [
          "(() => {",
          "const main = document.querySelector('main');",
          "const text = String(main?.innerText || '').normalize('NFC').replace(/\\s+/gu, ' ').trim();",
          "const title = String(document.querySelector('[data-testid=\"public-data-title\"]')?.textContent || '').normalize('NFC').replace(/\\s+/gu, ' ').trim();",
          "const pageTitle = String(document.querySelector('main h1')?.textContent || '').normalize('NFC').replace(/\\s+/gu, ' ').trim();",
          "const patterns = [",
          "['범주 비교', /범주 비교/u],",
          "['분류 레코드', /분류 레코드/u],",
          "['측정항목 N종', /측정항목\\s*\\d+종/u],",
          "['분류 N종', /분류\\s*\\d+종/u],",
          "['구성과 변화', /구성과 변화/u]",
          "];",
          "return { title, pageTitle, generic: patterns.filter((item) => item[1].test(text)).map((item) => item[0]), alert: String(document.querySelector('[role=\"alert\"]')?.textContent || '').trim() };",
          "})()",
        ].join("\n")
      );
      inspectedRoutes += 1;
      if (snapshot?.alert) routeFailures.push({ elementId, alert: snapshot.alert });
      if (snapshot?.generic?.length) genericHits.push({ elementId, tokens: snapshot.generic });
      if (snapshot?.title !== expected?.publicAnalysisTitle) {
        titleMismatches.push({ elementId, actual: snapshot?.title, expected: expected?.publicAnalysisTitle });
      }
      if (snapshot?.title && snapshot.title === snapshot.pageTitle) {
        repeatedRuntimeHeadings.push({ elementId, title: snapshot.title });
      }
    } catch (error) {
      routeFailures.push({ elementId, error: error instanceof Error ? error.message : String(error) });
    }
  }
} catch (error) {
  runtimeFailure = error instanceof Error ? error.message : String(error);
} finally {
  if (browser) await browser.close();
  if (server) await server.close();
}

audit.check("DETAIL_ROUTE_RUNTIME_COVERAGE", runtimeFailure === null && inspectedRoutes === 152 && routeFailures.length === 0, { inspectedRoutes, routeFailures, runtimeFailure }, { inspectedRoutes: 152, routeFailures: [] });
audit.check("GENERIC_ANALYSIS_COPY_COUNT", genericHits.length === 0, genericHits, []);
audit.check("DATA_SPECIFIC_TITLE_MATCH", titleMismatches.length === 0, titleMismatches, []);
audit.check("PAGE_AND_ANALYSIS_HEADING_DISTINCT", repeatedRuntimeHeadings.length === 0, repeatedRuntimeHeadings, []);
audit.check("BROKEN_ASSET", brokenAssets.length === 0, brokenAssets, []);
audit.check("CONSOLE_ERROR", (browser?.runtimeErrors || []).length === 0, browser?.runtimeErrors || [], []);

finishAuditV134(audit, "public-copy-audit-v134.json", {
  headingCount: headings.length,
  genericPublicCopyCount: genericHits.length,
  titleMismatchCount: titleMismatches.length,
  repeatedRuntimeHeadingCount: repeatedRuntimeHeadings.length,
  inspectedRoutes,
  runtimeFailure,
});
