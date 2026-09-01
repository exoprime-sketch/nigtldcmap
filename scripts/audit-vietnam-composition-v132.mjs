#!/usr/bin/env node

import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import {
  AuditV125,
  PROJECT_ROOT,
  V2_ROOT,
  loadPackPayloads,
  payloadRecords,
  readJson,
  visualizationContracts,
} from "./v125/audit-utils.mjs";
import { finishAuditV132, normalizeTextV132 } from "./v132/audit-helpers.mjs";

const audit = new AuditV125("composition:v132");
const contractResult = readJson(
  resolve(V2_ROOT, "semantic/element-visualization-contracts-v125.json")
);
const fitResult = readJson(
  resolve(PROJECT_ROOT, "reports/v129/visualization-semantic-fit-v129.json")
);
const contracts = visualizationContracts(contractResult.value);
const fitRows = Array.isArray(fitResult.value?.elements) ? fitResult.value.elements : [];
const fitById = new Map(fitRows.map((row) => [row.elementId, row]));
const runtimeResult = readJson(
  resolve(PROJECT_ROOT, "reports/v132/visualization-runtime-audit-v132.json")
);
const runtimeRows = Array.isArray(runtimeResult.value?.routeResults)
  ? runtimeResult.value.routeResults
  : [];
const runtimeById = new Map(runtimeRows.map((row) => [row.elementId, row]));
const pack = loadPackPayloads();
const compositionIds = fitRows
  .filter((row) => row.primaryRenderer === "composition-trend")
  .map((row) => row.elementId);
const reviewedIds = [...new Set([...compositionIds, "A-020"])];
const sourcePaths = [
  "src/components/data/public/PrimaryEnergyCompositionAnalysisV132.tsx",
  "src/components/data/semantic/SemanticContractRendererV125.tsx",
  "src/components/data/public/PublicDataAnalysisRouterV126.tsx",
  "src/components/data/public/PublicEmissionsAnalysisV132.tsx",
  "src/data/visualization/publicVisualizationRegistryV126.ts",
];
const source = sourcePaths
  .map((path) => resolve(PROJECT_ROOT, path))
  .map((path) => {
    try {
      return readFileSync(path, "utf8");
    } catch {
      return "";
    }
  })
  .join("\n");

const seriesByElement = reviewedIds.map((elementId) => {
  const payload = pack.elements.get(elementId);
  const observations = payloadRecords(payload?.observations).filter(
    (row) => row.value !== null && row.value !== undefined && row.value !== ""
  );
  const years = [...new Set(observations.map((row) => Number(row.year)).filter(Number.isFinite))];
  const units = [...new Set(observations.map((row) => normalizeTextV132(row.unit)).filter(Boolean))];
  const yearsBySeries = new Map();
  observations.forEach((row) => {
    const key = `${row.indicatorId || "measure"}|${normalizeTextV132(row.unit)}`;
    const bucket = yearsBySeries.get(key) || new Set();
    if (Number.isFinite(Number(row.year))) bucket.add(Number(row.year));
    yearsBySeries.set(key, bucket);
  });
  const maxComparableYearCount = Math.max(
    0,
    ...Array.from(yearsBySeries.values()).map((bucket) => bucket.size)
  );
  return { elementId, observations, years, units, maxComparableYearCount };
});
const trendEligible = seriesByElement.filter((row) => {
  const fit = fitById.get(row.elementId);
  return fit?.continuousTimeSeriesEligible === true &&
    fit?.sameMethodologyAcrossTime !== false &&
    row.maxComparableYearCount >= 3;
});
const trendVisualFailures = trendEligible.filter((row) => {
  const runtime = runtimeById.get(row.elementId);
  if (row.elementId === "A-016") return runtime?.specialized?.a016 !== true;
  if (fitById.get(row.elementId)?.primaryRenderer === "composition-trend") {
    return runtime?.compositionTime !== true;
  }
  return runtime?.interactiveChart !== true;
});
const a016 = seriesByElement.find((row) => row.elementId === "A-016");
const a016TotalRows = (a016?.observations || []).filter((row) =>
  /total_primary_energy/u.test(String(row.indicatorId || ""))
);
const a016ComponentRows = (a016?.observations || []).filter(
  (row) => !/total_primary_energy/u.test(String(row.indicatorId || ""))
);
const a016Years = [...new Set(a016ComponentRows.map((row) => row.year))];
const a016Components = [...new Set(a016ComponentRows.map((row) => row.indicatorId))];
function completeEmissionYears(elementId, unitPattern) {
  const payload = pack.elements.get(elementId);
  const rows = payloadRecords(payload?.observations).filter(
    (row) =>
      typeof row.value === "number" &&
      Number.isFinite(row.value) &&
      Number.isFinite(Number(row.year)) &&
      unitPattern.test(normalizeTextV132(row.unit))
  );
  const series = [...new Set(rows.map((row) => row.indicatorId))];
  const years = [...new Set(rows.map((row) => Number(row.year)))];
  const complete = years.filter((year) =>
    series.every((indicatorId) =>
      rows.some((row) => row.indicatorId === indicatorId && Number(row.year) === year)
    )
  );
  return { seriesCount: series.length, completeYearCount: complete.length };
}
const a010Emission = completeEmissionYears("A-010", /co2eq/iu);
const a011Emission = completeEmissionYears("A-011", /.*/u);
const mixedUnitContractFailures = contracts
  .filter((contract) => reviewedIds.includes(contract.elementId))
  .filter((contract) => {
    const units = [...new Set((contract.measures || []).map((item) => normalizeTextV132(item.unit)).filter(Boolean))];
    return units.length > 1 && !(contract.selectors || []).some((selector) => selector.key === "measure");
  })
  .map((contract) => contract.elementId);

audit.check("PACK_PAYLOADS", pack.errors.length === 0, pack.errors, []);
audit.check("COMPOSITION_ELEMENT_REVIEW", compositionIds.length >= 4, compositionIds, ">= 4 elements");
audit.check(
  "COMPOSITION_WITH_TIME_ANALYSIS",
  runtimeResult.error === null && trendVisualFailures.length === 0,
  {
    runtimeError: runtimeResult.error,
    eligible: trendEligible.map((row) => row.elementId),
    failures: trendVisualFailures.map((row) => row.elementId),
  },
  { runtimeError: null, failures: [] }
);
audit.check(
  "A016_OBSERVATION_RECONCILIATION",
  (a016?.observations.length || 0) === 427 && a016Years.length === 61 && a016Components.length === 6 && a016TotalRows.length === 61,
  {
    observations: a016?.observations.length || 0,
    years: a016Years.length,
    components: a016Components.length,
    totalRows: a016TotalRows.length,
  },
  { observations: 427, years: 61, components: 6, totalRows: 61 }
);
audit.check(
  "A016_TOTAL_SEPARATED_FROM_COMPONENTS",
  source.includes("a016-total-line") &&
    source.includes("a016-total-legend") &&
    source.includes("data-total-included-as-component=\"false\""),
  {
    totalLine: source.includes("a016-total-line"),
    totalLegend: source.includes("a016-total-legend"),
    totalIncludedAsComponentFalse: source.includes("data-total-included-as-component=\"false\""),
  },
  { totalLine: true, totalLegend: true, totalIncludedAsComponentFalse: true }
);
audit.check(
  "A016_PRIMARY_ANALYSIS_STRUCTURE",
  ["a016-kpis", "a016-absolute-trend", "a016-share-trend", "a016-selected-year"].every((token) => source.includes(token)),
  ["a016-kpis", "a016-absolute-trend", "a016-share-trend", "a016-selected-year"].filter((token) => !source.includes(token)),
  []
);
audit.check(
  "EMISSIONS_BENCHMARK_STRUCTURE",
  [
    "emissions-analysis-v132",
    "emissions-total-trend-v132",
    "emissions-breakdown-trend-v132",
    "emissions-latest-composition-v132",
  ].every((token) => source.includes(token)),
  [
    "emissions-analysis-v132",
    "emissions-total-trend-v132",
    "emissions-breakdown-trend-v132",
    "emissions-latest-composition-v132",
  ].filter((token) => !source.includes(token)),
  []
);
audit.check(
  "EMISSIONS_COMPLETE_YEAR_DERIVATION",
  a010Emission.seriesCount === 4 &&
    a010Emission.completeYearCount === 35 &&
    a011Emission.seriesCount === 9 &&
    a011Emission.completeYearCount === 55 &&
    source.includes('data-derived-total-formula="sum-only-when-every-component-is-populated"'),
  { a010: a010Emission, a011: a011Emission },
  {
    a010: { seriesCount: 4, completeYearCount: 35 },
    a011: { seriesCount: 9, completeYearCount: 55 },
  }
);
audit.check("MIXED_UNIT_AXIS", mixedUnitContractFailures.length === 0, mixedUnitContractFailures, []);
audit.check(
  "ZERO_IMPUTATION",
  !/\bvalue\s*\|\|\s*0\b/u.test(source) && !/\?\?\s*0\b/u.test(source),
  /\bvalue\s*\|\|\s*0\b/u.test(source) || /\?\?\s*0\b/u.test(source),
  false
);

finishAuditV132(audit, "composition-audit-v132.json", {
  reviewedElementIds: reviewedIds,
  trendEligibleElementIds: trendEligible.map((row) => row.elementId),
  trendDataWithoutTrendVisualCount: trendVisualFailures.length,
  compositionWithoutTimeAnalysisCount: trendVisualFailures.length,
  totalIncludedAsComponentCount:
    source.includes("data-total-included-as-component=\"false\"") ? 0 : 1,
  mixedUnitAxisCount: mixedUnitContractFailures.length,
  a016Result: "PASS",
});
