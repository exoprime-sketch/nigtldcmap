#!/usr/bin/env node

import { existsSync } from "node:fs";
import { resolve } from "node:path";

import { AuditV125, PROJECT_ROOT, V2_ROOT, catalogElements, readJson } from "./v125/audit-utils.mjs";
import {
  evaluateValue,
  launchHeadlessBrowser,
  navigate,
  setViewport,
  startStaticBuildServer,
  waitForValue,
} from "./v125/browser-runtime.mjs";
import { detailUrlV135, finishAuditV135, normalizeTextV135 } from "./v135/audit-helpers.mjs";

const audit = new AuditV125("temporal-depth:v135");
const catalog = catalogElements(readJson(resolve(V2_ROOT, "catalog.json")).value);
const contractResult = readJson(resolve(PROJECT_ROOT, "reports/v132/final-public-visualization-contract-v132.json"));
const contracts = Array.isArray(contractResult.value?.elements) ? contractResult.value.elements : [];
const contractById = new Map(contracts.map((row) => [String(row.elementId), row]));
const allowedDepths = new Set(["single-year", "two-year", "time-series", "scenario", "non-temporal"]);

let server = null;
let browser = null;
let runtimeFailure = null;
const routes = [];
const brokenAssets = [];
try {
  if (!existsSync(resolve(PROJECT_ROOT, "build/index.html"))) {
    throw new Error("production build missing; run npm run build before temporal audit");
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
    try {
      await navigate(browser.cdp, detailUrlV135(server.url, elementId));
      await waitForValue(
        browser.cdp,
        `(() => {
        const root = document.querySelector('[data-testid="public-analysis-root"]');
        if (!root || root.getAttribute('data-analysis-state') !== 'ready') return false;
        return root.querySelectorAll('[data-testid="public-analysis-pending"]').length === 0;
      })()`,
        { timeoutMs: 20_000 }
      );
      const snapshot = await evaluateValue(
        browser.cdp,
        `(() => {
          const root = document.querySelector('[data-testid="public-analysis-root"]');
          const temporal = root?.querySelector('[data-temporal-depth-v135]') || root;
          const depth = temporal?.getAttribute('data-temporal-depth-v135') || '';
          const charts = [...(root?.querySelectorAll('[data-testid="interactive-time-series-chart"]') || [])];
          const onePointCharts = charts.filter((chart) => {
            const explicit = Number(chart.getAttribute('data-point-count') || chart.getAttribute('data-populated-year-count'));
            return Number.isFinite(explicit) && explicit === 1;
          }).length;
          const text = String(root?.innerText || '').normalize('NFC').replace(/\\s+/gu, ' ').trim();
          const claims = [...(root?.querySelectorAll('h1, h2, h3, h4, h5, figcaption, [data-testid="chart-title"]') || [])]
            .map((node) => String(node.textContent || '').normalize('NFC').replace(/\\s+/gu, ' ').trim())
            .filter(Boolean);
          const ghg = root?.querySelector('[data-testid="ghg-sector-gas-analysis-v135"]');
          return {
            depth,
            chartCount: charts.length,
            onePointCharts,
            claims,
            text,
            alert: String(root?.querySelector('[role="alert"]')?.textContent || '').trim(),
            ghg: ghg ? {
              present: true,
              rawMatrixPrimary: ghg.getAttribute('data-raw-matrix-primary'),
            } : { present: false, rawMatrixPrimary: null },
          };
        })()`
      );
      routes.push({ elementId, ...snapshot });
    } catch (error) {
      routes.push({ elementId, error: error instanceof Error ? error.message : String(error) });
    }
  }
} catch (error) {
  runtimeFailure = error instanceof Error ? error.message : String(error);
} finally {
  if (browser) await browser.close();
  if (server) await server.close();
}

const routeById = new Map(routes.map((row) => [row.elementId, row]));
const routeFailures = routes.filter((row) => row.error || row.alert);
const invalidDepth = routes.filter((row) => !allowedDepths.has(row.depth));
const onePointCharts = routes.filter(
  (row) => row.onePointCharts > 0 || (row.depth === "single-year" && row.chartCount > 0)
);
// A violation is the screen claiming a trend it cannot draw: a heading or chart
// title promising 추이/추세/시계열, or a generated "YYYY~YYYY년 추세" label.
// Source measure names shown in selectors and interpretation cautions that
// explicitly refuse to connect values into one trend are not such claims.
const catalogTitleById = new Map(
  catalog.map((element) => [
    String(element.elementId || ""),
    normalizeTextV135(element.elementLabel || element.publicTitle || ""),
  ])
);

function sourceNameFragmentsV135(elementId) {
  const label = catalogTitleById.get(elementId) || "";
  return label
    .split(/[\[\],;·]/u)
    .map((part) => part.trim())
    .filter((part) => part.length >= 4 && /추이|추세|시계열/u.test(part));
}

function trendClaimV135(row) {
  const fragments = sourceNameFragmentsV135(row.elementId);
  const claimed = (row.claims || []).some((claim) => {
    const stripped = fragments.reduce(
      (text, fragment) => text.split(fragment).join(" "),
      normalizeTextV135(claim)
    );
    return /추이|추세|시계열/u.test(stripped);
  });
  const generatedTrendLabel = /\d{4}\s*[~–-]\s*\d{4}\s*년?\s*(?:추이|추세)/u.test(
    normalizeTextV135(row.text)
  );
  return claimed || generatedTrendLabel;
}
const twoYearGenericTrend = routes.filter(
  (row) => row.depth === "two-year" && (row.chartCount > 0 || trendClaimV135(row))
);
const singleYearTrend = routes.filter(
  (row) => row.depth === "single-year" && trendClaimV135(row)
);
const statusOnlyIds = new Set(
  catalog
    .filter((row) => ["schema-only", "data-entry-planned", "not-collected"].includes(String(row.publicStatus || "")))
    .map((row) => String(row.elementId))
);
const statusOnlyTemporal = routes.filter(
  (row) => statusOnlyIds.has(row.elementId) && row.depth !== "non-temporal"
);
const contractDepthMismatches = catalog.flatMap((element) => {
  const elementId = String(element.elementId || "");
  const route = routeById.get(elementId);
  const contract = contractById.get(elementId);
  const years = Number(contract?.maxComparableYearCount || 0);
  if (!route || route.error || statusOnlyIds.has(elementId) || !Number.isFinite(years) || years <= 0) return [];
  if (years === 1 && !["single-year", "non-temporal"].includes(route.depth)) return [{ elementId, years, depth: route.depth }];
  if (years === 2 && !["two-year", "non-temporal"].includes(route.depth)) return [{ elementId, years, depth: route.depth }];
  if (years >= 3 && !["time-series", "scenario", "non-temporal"].includes(route.depth)) return [{ elementId, years, depth: route.depth }];
  return [];
});
const ghg = routeById.get("C-002");

audit.check("FRAMEWORK_ELEMENTS", catalog.length === 152, catalog.length, 152);
audit.check("TEMPORAL_RUNTIME_COVERAGE", runtimeFailure === null && routes.length === 152 && routeFailures.length === 0, { runtimeFailure, routeCount: routes.length, routeFailures }, { routeCount: 152, routeFailures: [] });
audit.check("TEMPORAL_DEPTH_MARKER_COVERAGE", invalidDepth.length === 0, invalidDepth, []);
audit.check("TEMPORAL_DEPTH_CONTRACT_MATCH", contractDepthMismatches.length === 0, contractDepthMismatches, []);
audit.check("SINGLE_YEAR_TIME_SERIES_COUNT", singleYearTrend.length === 0, singleYearTrend, []);
audit.check("TWO_YEAR_GENERIC_TREND_COUNT", twoYearGenericTrend.length === 0, twoYearGenericTrend, []);
audit.check("ONE_POINT_CHART_COUNT", onePointCharts.length === 0, onePointCharts, []);
audit.check("STATUS_ONLY_TEMPORAL_VISUAL_COUNT", statusOnlyTemporal.length === 0, statusOnlyTemporal, []);
audit.check("GHG_ANALYTICAL_VIEW", ghg?.ghg?.present === true && ghg?.ghg?.rawMatrixPrimary === "false", ghg?.ghg || null, { present: true, rawMatrixPrimary: "false" });
audit.check("BROKEN_ASSET", brokenAssets.length === 0, brokenAssets, []);
audit.check("CONSOLE_ERROR", (browser?.runtimeErrors || []).length === 0, browser?.runtimeErrors || [], []);

finishAuditV135(audit, "temporal-depth-audit-v135.json", {
  inspectedRoutes: routes.length,
  temporalDepthCounts: Object.fromEntries(
    [...allowedDepths].map((depth) => [depth, routes.filter((row) => row.depth === depth).length])
  ),
  singleYearTimeSeriesCount: singleYearTrend.length,
  twoYearGenericTrendCount: twoYearGenericTrend.length,
  onePointChartCount: onePointCharts.length,
  rawMatrixAsPrimaryCount: ghg?.ghg?.rawMatrixPrimary === "false" ? 0 : 1,
  runtimeFailure,
});
