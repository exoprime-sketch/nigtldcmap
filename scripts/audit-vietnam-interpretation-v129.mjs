#!/usr/bin/env node

import { existsSync, readdirSync } from "node:fs";
import { resolve } from "node:path";
import { spawnSync } from "node:child_process";
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
import {
  V129_INTERPRETATION_ROOT,
  benchmarkItemsV129,
  finishAuditV129,
  interpretationItemsV129,
  interpretationKeyV129,
  mapUrlV129,
  normalizeTextV129,
  readFirstJsonV129,
} from "./v129/audit-helpers.mjs";

const audit = new AuditV125("interpretation:v129");
const interpretationResult = readFirstJsonV129([
  resolve(V129_INTERPRETATION_ROOT, "indicator-interpretation-v129.json"),
  resolve(V129_INTERPRETATION_ROOT, "indicator-interpretations-v129.json"),
]);
const benchmarkResult = readFirstJsonV129([
  resolve(V129_INTERPRETATION_ROOT, "indicator-benchmarks-v129.json"),
]);
const catalogResult = readJson(resolve(V2_ROOT, "catalog.json"));
const mapIndexResult = readJson(resolve(V2_ROOT, "map-index.json"));
const b021SpatialResult = readJson(
  resolve(V2_ROOT, "spatial/layers/b-021.json")
);
const catalog = catalogElements(catalogResult.value);
const mapLayers = Array.isArray(mapIndexResult.value?.layers)
  ? mapIndexResult.value.layers
  : [];
const interpretations = interpretationItemsV129(interpretationResult.value);
const benchmarks = benchmarkItemsV129(benchmarkResult.value);
const allowedDirections = new Set([
  "higher-better",
  "higher-worse",
  "lower-rank-better",
  "neutral",
  "context-dependent",
]);
const allowedBenchmarkTypes = new Set([
  "official-band",
  "global-percentile",
  "national-percentile",
  "group-rank",
  "none",
]);
const forbiddenPublicTokens = [
  "sourceRow",
  "sourceSheet",
  "recordId",
  "indicatorId",
  ".xlsx",
  "검토기록",
  "raw",
];

const parityResult = spawnSync(
  process.execPath,
  [resolve(PROJECT_ROOT, "scripts/build-vietnam-interpretation-v129.mjs"), "--check"],
  { cwd: PROJECT_ROOT, encoding: "utf8" }
);

audit.check("INTERPRETATION_JSON", interpretationResult.error === null, interpretationResult.error, null);
audit.check(
  "RUNTIME_PUBLIC_INTERPRETATION_PARITY",
  parityResult.status === 0,
  parityResult.status,
  0,
  parityResult.status === 0
    ? null
    : { stdout: parityResult.stdout, stderr: parityResult.stderr }
);
audit.check("BENCHMARK_JSON", benchmarkResult.error === null, benchmarkResult.error, null);
audit.check("CATALOG_JSON", catalogResult.error === null, catalogResult.error, null);
audit.check("MAP_INDEX_JSON", mapIndexResult.error === null, mapIndexResult.error, null);
audit.check("B021_SPATIAL_JSON", b021SpatialResult.error === null, b021SpatialResult.error, null);

const duplicateKeys = [];
const seenKeys = new Set();
for (const item of interpretations) {
  const key = interpretationKeyV129(item);
  if (seenKeys.has(key)) duplicateKeys.push(key);
  seenKeys.add(key);
}

const invalidItems = [];
const missingDirections = [];
const missingScales = [];
const arbitraryBands = [];
const requiredItems = interpretations.filter((item) => item?.explanationRequired === true);
for (const item of interpretations) {
  const key = interpretationKeyV129(item);
  if (!catalog.some((element) => element.elementId === item?.elementId)) {
    invalidItems.push({ key, issue: "element absent from catalog" });
  }
  if (typeof item?.explanationRequired !== "boolean") {
    invalidItems.push({ key, issue: "explanationRequired must be boolean" });
  }
  if (!item?.explanationRequired) continue;
  const bullets = Array.isArray(item.meaningBullets) ? item.meaningBullets : [];
  const publicText = [item.publicName, item.directionLabel, ...bullets].join(" ");
  if (!normalizeTextV129(item.publicName)) invalidItems.push({ key, issue: "publicName missing" });
  if (bullets.length < 2 || bullets.length > 4 || bullets.some((value) => !normalizeTextV129(value))) {
    invalidItems.push({ key, issue: "meaningBullets must contain 2..4 public sentences" });
  }
  if (forbiddenPublicTokens.some((token) => publicText.toLocaleLowerCase("en-US").includes(token.toLocaleLowerCase("en-US")))) {
    invalidItems.push({ key, issue: "technical or review token in public copy" });
  }
  if (!allowedDirections.has(item.direction) || !normalizeTextV129(item.directionLabel)) {
    missingDirections.push(key);
  }
  if (!allowedBenchmarkTypes.has(item.benchmarkType)) {
    invalidItems.push({ key, issue: "benchmarkType invalid" });
  }
  const scaleApplicable =
    item.scaleApplicable !== false &&
    !String(item.variableKey || "").startsWith("semantic-") &&
    (item.scaleApplicable === true ||
      item.benchmarkType === "official-band" ||
      /(?:GVI|CPIA|CPI\b|0\s*[–~-]\s*100|1\s*[–~-]\s*6)/iu.test(
        `${item.publicName || ""} ${item.directionLabel || ""}`
      ));
  if (
    scaleApplicable &&
    (!Number.isFinite(Number(item.scale?.minimum)) ||
      !Number.isFinite(Number(item.scale?.maximum)) ||
      Number(item.scale.minimum) >= Number(item.scale.maximum) ||
      !normalizeTextV129(item.scale?.minimumLabel) ||
      !normalizeTextV129(item.scale?.maximumLabel))
  ) {
    missingScales.push(key);
  }
  const bands = Array.isArray(item.officialBands) ? item.officialBands : [];
  if (bands.length > 0) {
    const officialEvidence = benchmarks.some((benchmark) => {
      const benchmarkElement = benchmark.elementId || benchmark.indicatorElementId;
      const variableMatch = !item.variableKey || !benchmark.variableKey || benchmark.variableKey === item.variableKey;
      return (
        benchmarkElement === item.elementId &&
        variableMatch &&
        benchmark.official === true &&
        /^https?:\/\//u.test(String(benchmark.sourceUrl || ""))
      );
    });
    if (item.benchmarkType !== "official-band" || !officialEvidence) {
      arbitraryBands.push({ key, issue: "official bands lack official benchmark evidence" });
    }
  }
}

const semanticRoot = resolve(V2_ROOT, "semantic/elements");
const highConfidencePattern =
  /(?:지수|점수|등급|순위|준비도|역량|취약성|복합\s*지표|시나리오|전망|\bindex\b|\bscore\b|\brank(?:ing)?\b|readiness|vulnerab)/iu;
const detectedElementIds = new Set();
for (const element of catalog) {
  if (highConfidencePattern.test(String(element.elementLabel || ""))) {
    detectedElementIds.add(element.elementId);
  }
}
if (existsSync(semanticRoot)) {
  for (const file of readdirSync(semanticRoot).filter((name) => name.endsWith(".json"))) {
    const semanticResult = readJson(resolve(semanticRoot, file));
    if (semanticResult.error) continue;
    const document = semanticResult.value || {};
    const labels = [
      ...(Array.isArray(document.measures) ? document.measures.map((item) => item?.labelKo) : []),
      ...(Array.isArray(document.indicators)
        ? document.indicators.flatMap((item) => [item?.displayLabel, item?.measure?.labelKo])
        : []),
    ];
    if (labels.some((label) => highConfidencePattern.test(String(label || "")))) {
      detectedElementIds.add(document.elementId);
    }
  }
}
const detectedWithoutDecision = [...detectedElementIds]
  .filter(Boolean)
  .filter((elementId) => !interpretations.some((item) => item.elementId === elementId));

const b021Layer = mapLayers.find((layer) => layer.elementId === "B-021");
const b021Variables = Array.isArray(b021Layer?.selectors?.variables)
  ? b021Layer.selectors.variables
  : [];
const b021Entries = interpretations.filter((item) => item.elementId === "B-021");
const b021MissingVariables = b021Variables.filter(
  (variable) =>
    !b021Entries.some(
      (entry) => entry.variableKey === variable.key && entry.explanationRequired === true
    )
);
function b021SelectorPublicLabel(variable) {
  const sourceLabel = normalizeTextV129(variable?.label);
  if (variable?.key === "gvi-6") {
    return normalizeTextV129(sourceLabel.split(/\s*—\s*/u)[0]);
  }
  return normalizeTextV129(sourceLabel.replace(/^구성지표\s*—\s*/u, ""));
}
const b021VariableMismatches = b021Variables.flatMap((variable) => {
  const entry = b021Entries.find((item) => item.variableKey === variable.key);
  if (!entry) return [];
  const expectedUnit = normalizeTextV129(entry.publicUnit || entry.unit || variable.unit);
  const sourceUnit = normalizeTextV129(variable.unit);
  const expectedLabel = normalizeTextV129(entry.publicName);
  const sourcePublicLabel = b021SelectorPublicLabel(variable);
  const unitMatches =
    variable.key === "gvi-6"
      ? sourceUnit === "지수" && expectedUnit === "0–100 지수"
      : expectedUnit === sourceUnit;
  return !expectedLabel || !expectedUnit || expectedLabel !== sourcePublicLabel || !unitMatches
    ? [{
        variable: variable.key,
        expectedLabel,
        sourcePublicLabel,
        expectedUnit,
        sourceUnit,
        unitMatches,
      }]
    : [];
});
const gvi = b021Entries.find((item) => item.variableKey === "gvi-6");
const regionValues = Array.isArray(b021SpatialResult.value?.values)
  ? b021SpatialResult.value.values.filter(
      (row) => row.variable === "gvi-6" && row.period === "2023"
    )
  : [];
const uniqueRegionValues = [
  ...new Map(regionValues.map((row) => [row.sourceRegion, row])).values(),
].sort((left, right) => Number(right.value) - Number(left.value));
const quangTri = regionValues.find((row) => row.adm1Name === "Quảng Trị");
const quangTriRank = uniqueRegionValues.findIndex(
  (row) => row.sourceRegion === quangTri?.sourceRegion
) + 1;
const globalBenchmark = benchmarks.find(
  (item) => item.elementId === "B-021" && item.variableKey === "gvi-6"
);
const unsafeGlobalClaim =
  (!globalBenchmark || globalBenchmark.available === false || /not-available/iu.test(String(globalBenchmark.status || ""))) &&
  b021Entries.some((item) => /세계(?:적으로)?\s*(?:높|낮)|global percentile/iu.test([item.directionLabel, ...(item.meaningBullets || [])].join(" ")));

let server = null;
let browser = null;
let runtimeFailure = null;
let runtimeStage = "not-started";
const runtimeVariableMismatches = [];
const detailRuntimeMismatches = [];
let runtimeMeaning = null;
try {
  server = await startStaticBuildServer(resolve(PROJECT_ROOT, "build"));
  browser = await launchHeadlessBrowser();
  await setViewport(browser.cdp, 1440, 1100);
  runtimeStage = "map-load";
  await navigate(browser.cdp, mapUrlV129(server.url));
  await waitForValue(browser.cdp, `Boolean(document.querySelector('.cdp-map-page'))`, { timeoutMs: 30_000 });
  await waitForValue(
    browser.cdp,
    `document.querySelectorAll('.cdp-layer-card[data-map-element]').length === 13`,
    { timeoutMs: 35_000 }
  );
  const applied = await evaluateValue(
    browser.cdp,
    `(() => {
      const button = [...document.querySelectorAll('[data-testid="map-analysis-preset"]')]
        .find((node) => node.getAttribute('data-preset-id') === 'CLIMATE_VULNERABILITY');
      if (!(button instanceof HTMLButtonElement)) return false;
      button.click();
      return true;
    })()`
  );
  if (!applied) throw new Error("CLIMATE_VULNERABILITY preset unavailable");
  await waitForValue(
    browser.cdp,
    `document.querySelector('.cdp-map-page')?.getAttribute('data-primary-element') === 'B-021'`,
    { timeoutMs: 30_000 }
  );
  for (const variableKey of b021Variables.map((item) => item.key)) {
    runtimeStage = `map-variable:${variableKey}`;
    const expected = b021Variables.find((item) => item.key === variableKey);
    if (!expected) continue;
    const changed = await evaluateValue(
      browser.cdp,
      `(() => {
        const select = document.querySelector('[data-testid="map-layer-variable-select"]');
        if (!(select instanceof HTMLSelectElement)) return false;
        select.value = ${JSON.stringify(variableKey)};
        select.dispatchEvent(new Event('change', { bubbles: true }));
        return true;
      })()`
    );
    if (!changed) throw new Error(`B-021 variable selector unavailable: ${variableKey}`);
    await waitForValue(
      browser.cdp,
      `document.querySelector('[data-testid="map-layer-variable-select"]')?.value === ${JSON.stringify(variableKey)}`,
      { timeoutMs: 10_000 }
    );
    const result = await evaluateValue(
      browser.cdp,
      `(() => {
        const normalize = (value) => String(value || '').normalize('NFC').replace(/\\s+/gu, ' ').trim();
        const select = document.querySelector('[data-testid="map-layer-variable-select"]');
        const selectedLabel = select instanceof HTMLSelectElement ? select.selectedOptions[0]?.textContent : '';
        const current = document.querySelector('[data-testid="map-current-analysis"]');
        const evidence = Object.fromEntries([...(current?.querySelectorAll('.cdp-evidence-row') || [])].map((row) => [
          normalize(row.querySelector('span')?.textContent), normalize(row.querySelector('strong')?.textContent)
        ]));
        const legend = document.querySelector('[data-testid="map-dynamic-legend"]');
        const meaning = document.querySelector('[data-testid="public-indicator-meaning-v129"], [data-testid="map-indicator-meaning-v129"], .cdp-public-indicator-meaning');
        return {
          selectedLabel: normalize(selectedLabel),
          currentVariable: evidence['선택 변수'] || evidence['측정항목'] || '',
          currentUnit: evidence['단위'] || '',
          legendText: normalize(legend?.textContent),
          legendUnit: normalize(legend?.querySelector('[data-testid="map-legend-unit"]')?.textContent),
          meaningText: normalize(meaning?.textContent),
        };
      })()`
    );
    const entry = b021Entries.find((item) => item.variableKey === variableKey);
    const expectedLabel = normalizeTextV129(entry?.publicName || expected.label);
    const expectedUnit = normalizeTextV129(entry?.publicUnit || entry?.unit || expected.unit);
    if (
      normalizeTextV129(result?.selectedLabel) !== expectedLabel ||
      normalizeTextV129(result?.currentVariable) !== expectedLabel ||
      !normalizeTextV129(result?.legendText).includes(expectedLabel) ||
      normalizeTextV129(result?.currentUnit) !== expectedUnit ||
      (normalizeTextV129(result?.legendUnit) &&
        normalizeTextV129(result?.legendUnit) !== expectedUnit) ||
      !normalizeTextV129(result?.legendText).includes(expectedUnit)
    ) {
      runtimeVariableMismatches.push({ variableKey, expectedLabel, expectedUnit, result });
    }
    if (variableKey === "gvi-6") runtimeMeaning = result;
  }

  for (const variable of b021Variables) {
    runtimeStage = `detail-variable:${variable.key}`;
    const entry = b021Entries.find((item) => item.variableKey === variable.key);
    if (!entry) continue;
    await navigate(browser.cdp, mapUrlV129(server.url));
    await waitForValue(
      browser.cdp,
      `document.querySelectorAll('.cdp-layer-card[data-map-element]').length === 13`,
      { timeoutMs: 35_000 }
    );
    const detailPresetApplied = await evaluateValue(
      browser.cdp,
      `(() => {
        const button = document.querySelector('[data-testid="map-analysis-preset"][data-preset-id="CLIMATE_VULNERABILITY"]');
        if (!(button instanceof HTMLButtonElement)) return false;
        button.click();
        return true;
      })()`
    );
    if (!detailPresetApplied) throw new Error("detail parity preset unavailable");
    await waitForValue(
      browser.cdp,
      `document.querySelector('[data-testid="map-public-content"]')?.getAttribute('data-primary-element') === 'B-021' && Boolean(document.querySelector('[data-testid="map-layer-variable-select"]'))`,
      { timeoutMs: 30_000 }
    );
    const detailVariableChanged = await evaluateValue(
      browser.cdp,
      `(() => {
        const select = document.querySelector('[data-testid="map-layer-variable-select"]');
        if (!(select instanceof HTMLSelectElement)) return false;
        select.value = ${JSON.stringify(variable.key)};
        select.dispatchEvent(new Event('change', { bubbles: true }));
        return true;
      })()`
    );
    if (!detailVariableChanged) {
      throw new Error(`detail parity selector unavailable: ${variable.key}`);
    }
    await waitForValue(
      browser.cdp,
      `document.querySelector('[data-testid="map-layer-variable-select"]')?.value === ${JSON.stringify(variable.key)}`,
      { timeoutMs: 10_000 }
    );
    const detailOpened = await evaluateValue(
      browser.cdp,
      `(() => {
        const button = [...document.querySelectorAll('.cdp-map-analysis-actions button')]
          .find((node) => node.textContent?.trim() === '데이터 상세');
        if (!(button instanceof HTMLButtonElement)) return false;
        button.click();
        return true;
      })()`
    );
    if (!detailOpened) throw new Error("map-to-detail action unavailable");
    const expectedLabel = normalizeTextV129(entry.publicName);
    const expectedUnit = normalizeTextV129(entry.publicUnit || entry.unit || variable.unit);
    const expectedDirection = normalizeTextV129(entry.directionLabel);
    await waitForValue(
      browser.cdp,
      `(() => {
        const root = document.querySelector('[data-testid="public-indicator-meaning-v129"]');
        const name = root?.querySelector('.pim129__header p')?.textContent?.normalize('NFC').replace(/\\s+/gu, ' ').trim() || '';
        return location.hash.includes('element-detail') && name === ${JSON.stringify(expectedLabel)};
      })()`,
      { timeoutMs: 25_000 }
    );
    const detailMeaning = await evaluateValue(
      browser.cdp,
      `(() => {
        const normalize = (value) => String(value || '').normalize('NFC').replace(/\\s+/gu, ' ').trim();
        const root = document.querySelector('[data-testid="public-indicator-meaning-v129"]');
        const facts = Object.fromEntries([...(root?.querySelectorAll('.pim129__facts > div') || [])].map((row) => [
          normalize(row.querySelector('dt')?.textContent),
          normalize(row.querySelector('dd')?.textContent),
        ]));
        return {
          publicName: normalize(root?.querySelector('.pim129__header p')?.textContent),
          unit: facts['단위'] || '',
          direction: facts['높고 낮음의 의미'] || '',
          text: normalize(root?.textContent),
          url: location.href,
        };
      })()`
    );
    if (
      normalizeTextV129(detailMeaning?.publicName) !== expectedLabel ||
      normalizeTextV129(detailMeaning?.unit) !== expectedUnit ||
      normalizeTextV129(detailMeaning?.direction) !== expectedDirection ||
      (variable.key !== "gvi-6" &&
        normalizeTextV129(detailMeaning?.publicName) === "GVI 취약성 지수")
    ) {
      detailRuntimeMismatches.push({
        variableKey: variable.key,
        expectedLabel,
        expectedUnit,
        expectedDirection,
        detailMeaning,
      });
    }
  }
} catch (error) {
  runtimeFailure = `${runtimeStage}: ${error instanceof Error ? error.message : String(error)}`;
} finally {
  if (browser) await browser.close();
  if (server) await server.close();
}

audit.check("INTERPRETATION_KEY_UNIQUENESS", duplicateKeys.length === 0, duplicateKeys.length, 0, duplicateKeys);
audit.check("NON_OBVIOUS_INDICATOR_DETECTION", detectedElementIds.size > 0, detectedElementIds.size, "> 0", [...detectedElementIds].sort());
audit.check(
  "REQUIRED_INTERPRETATION_COVERAGE",
  detectedWithoutDecision.length === 0 && b021MissingVariables.length === 0 && invalidItems.length === 0,
  { detected: detectedElementIds.size, required: requiredItems.length, missingElements: detectedWithoutDecision.length, missingB021Variables: b021MissingVariables.length, invalidItems: invalidItems.length },
  { missingElements: 0, missingB021Variables: 0, invalidItems: 0 },
  { detectedWithoutDecision, b021MissingVariables: b021MissingVariables.map((item) => item.key), invalidItems }
);
audit.check("MISSING_DIRECTION", missingDirections.length === 0, missingDirections.length, 0, missingDirections);
audit.check("MISSING_SCALE_WHERE_APPLICABLE", missingScales.length === 0, missingScales.length, 0, missingScales);
audit.check("ARBITRARY_OFFICIAL_BAND", arbitraryBands.length === 0, arbitraryBands.length, 0, arbitraryBands);
audit.check(
  "B021_GVI_SCALE_0_100",
  Number(gvi?.scale?.minimum) === 0 && Number(gvi?.scale?.maximum) === 100,
  gvi?.scale || null,
  { minimum: 0, maximum: 100 }
);
audit.check("B021_GVI_HIGHER_WORSE", gvi?.direction === "higher-worse", gvi?.direction ?? null, "higher-worse");
audit.check(
  "B021_REGION_AGGREGATION_DISCLOSURE",
  uniqueRegionValues.length === 6 &&
    /6개\s*권역|권역/u.test(`${gvi?.aggregationLevel || ""} ${gvi?.aggregationNotice || ""}`) &&
    /성\s*단위.*(?:아님|아니|독립)|권역.*(?:연결|값)/u.test(String(gvi?.aggregationNotice || "")) &&
    quangTri?.value === 39.6 &&
    quangTriRank === 3,
  { uniqueSourceRegions: uniqueRegionValues.length, aggregationLevel: gvi?.aggregationLevel, aggregationNotice: gvi?.aggregationNotice, quangTriValue: quangTri?.value, quangTriRank },
  { uniqueSourceRegions: 6, quangTriValue: 39.6, quangTriRank: 3, disclosure: true }
);
audit.check(
  "B021_GVI_GROUP_RANK_CONTRACT",
  gvi?.benchmarkType === "group-rank" &&
    /6개\s*권역/u.test(String(gvi?.benchmarkScope || "")) &&
    uniqueRegionValues.length === 6 &&
    quangTriRank === 3,
  {
    benchmarkType: gvi?.benchmarkType,
    benchmarkScope: gvi?.benchmarkScope,
    uniqueSourceRegions: uniqueRegionValues.length,
    quangTriRank,
  },
  {
    benchmarkType: "group-rank",
    benchmarkScope: "베트남 GDL 6개 권역",
    uniqueSourceRegions: 6,
    quangTriRank: 3,
  }
);
audit.check(
  "B021_GLOBAL_BENCHMARK_SAFETY",
  unsafeGlobalClaim === false,
  { benchmark: globalBenchmark || null, unsafeGlobalClaim },
  { unsafeGlobalClaim: false }
);
audit.check(
  "MAP_SELECTED_VARIABLE_UNIT_AND_LABEL",
  runtimeFailure === null && b021VariableMismatches.length === 0 && runtimeVariableMismatches.length === 0,
  { runtimeFailure, staticMismatches: b021VariableMismatches.length, runtimeMismatches: runtimeVariableMismatches.length },
  { runtimeFailure: null, staticMismatches: 0, runtimeMismatches: 0 },
  { b021VariableMismatches, runtimeVariableMismatches }
);
audit.check(
  "B021_PUBLIC_MEANING_RUNTIME",
  runtimeFailure === null && /0\s*[–~-]\s*100|100/u.test(runtimeMeaning?.meaningText || "") && /높/u.test(runtimeMeaning?.meaningText || "") && /취약/u.test(runtimeMeaning?.meaningText || ""),
  { runtimeFailure, meaningText: runtimeMeaning?.meaningText || "" },
  { scale: "0-100", direction: "higher means more vulnerable" }
);
audit.check(
  "B021_DETAIL_RUNTIME_PUBLIC_PARITY",
  runtimeFailure === null && detailRuntimeMismatches.length === 0,
  {
    runtimeFailure,
    checkedVariables: b021Variables.length,
    mismatchCount: detailRuntimeMismatches.length,
  },
  { runtimeFailure: null, checkedVariables: 12, mismatchCount: 0 },
  detailRuntimeMismatches
);
audit.check("UNCAUGHT_RUNTIME_ERROR", (browser?.runtimeErrors?.length || 0) === 0, browser?.runtimeErrors || [], []);

finishAuditV129(audit, "interpretation-audit-v129.json", {
  interpretationRequiredCount: requiredItems.length,
  interpretationCoverage:
    detectedWithoutDecision.length === 0 && b021MissingVariables.length === 0
      ? "100%"
      : `${Math.max(0, detectedElementIds.size - detectedWithoutDecision.length)}/${detectedElementIds.size}`,
  missingDirectionCount: missingDirections.length,
  missingScaleCount: missingScales.length,
  arbitraryBandCount: arbitraryBands.length,
  b021VariableCount: b021Variables.length,
  variableUnitMismatchCount: b021VariableMismatches.length + runtimeVariableMismatches.length,
  gviGlobalBenchmarkStatus: globalBenchmark?.status || "not-available-no-comparable-distribution",
});
