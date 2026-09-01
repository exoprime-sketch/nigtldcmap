#!/usr/bin/env node

import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const ts = require("typescript");
const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(scriptDirectory, "..");
const sourcePath = resolve(
  projectRoot,
  "src/data/interpretation/publicIndicatorInterpretationV129.ts"
);
const outputPath = resolve(
  projectRoot,
  "public/data/vietnam/v2/interpretation/indicator-interpretation-v129.json"
);
const benchmarkOutputPath = resolve(
  projectRoot,
  "public/data/vietnam/v2/interpretation/indicator-benchmarks-v129.json"
);

function loadRuntimeRegistryV129() {
  const source = readFileSync(sourcePath, "utf8");
  const transpiled = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
    },
    fileName: sourcePath,
  }).outputText;
  const module = { exports: {} };
  const evaluate = new Function("exports", "module", `"use strict";\n${transpiled}`);
  evaluate(module.exports, module);
  const entries = module.exports.PUBLIC_INDICATOR_INTERPRETATIONS_V129;
  if (!Array.isArray(entries)) {
    throw new Error("PUBLIC_INDICATOR_INTERPRETATIONS_V129 export is unavailable");
  }
  return JSON.parse(JSON.stringify(entries));
}

const entries = loadRuntimeRegistryV129();
const document = {
  schemaVersion: "v129-public-indicator-interpretation-1",
  generatedAt: "2026-09-01T00:00:00.000Z",
  reviewedElementCount: new Set(entries.map((entry) => entry.elementId)).size,
  interpretationCount: entries.length,
  requiredEntryCount: entries.filter((entry) => entry.explanationRequired === true).length,
  entries,
};
const generated = `${JSON.stringify(document, null, 2)}\n`;
const benchmarkDocument = {
  schemaVersion: "v129-public-indicator-benchmarks-1",
  generatedAt: "2026-09-01T00:00:00.000Z",
  officialBandCount: 0,
  arbitraryBandCount: 0,
  benchmarks: [
    {
      elementId: "A-002",
      benchmarkType: "fixed-scale",
      available: true,
      official: true,
      minimum: 1,
      maximum: 6,
      minimumLabel: "낮음",
      maximumLabel: "높음",
      sourceOrganization: "World Bank",
      sourceUrl:
        "https://databank.worldbank.org/source/country-policy-and-institutional-assessment",
    },
    {
      elementId: "B-021",
      variableKey: "gvi-6",
      benchmarkType: "global-percentile",
      available: false,
      official: true,
      status: "unavailable-version-not-verified",
      reason:
        "공개 패키지에 원천 historical table 버전이 보존되지 않아 동일 정의·버전·연도의 세계 분포와 일치함을 검증할 수 없습니다.",
      percentileGenerated: false,
      sourceOrganization: "Global Data Lab",
      sourceUrl: "https://globaldatalab.org/gvi/about/",
      referenceTableUrl: "https://globaldatalab.org/gvi/table/gvi/",
    },
    {
      elementId: "B-021",
      variableKey: "gvi-6",
      benchmarkType: "group-rank",
      available: true,
      official: false,
      status: "local-six-region-comparison",
      groupCount: 6,
      scope: "베트남 GDL 6개 권역",
      calculation: "선택 연도의 중복되지 않은 sourceRegion 값만 내림차순 정렬",
      provinceDuplicateWeighting: false,
    },
    {
      elementId: "D-005",
      benchmarkType: "none",
      available: false,
      official: false,
      status: "not-applicable",
      reason:
        "서로 다른 예산 분모와 보고서 판을 하나의 기준이나 추세로 비교하지 않습니다.",
    },
  ],
};
const generatedBenchmarks = `${JSON.stringify(benchmarkDocument, null, 2)}\n`;

if (process.argv.includes("--check")) {
  const current = readFileSync(outputPath, "utf8");
  const currentBenchmarks = readFileSync(benchmarkOutputPath, "utf8");
  if (current !== generated || currentBenchmarks !== generatedBenchmarks) {
    console.error("V129 interpretation assets are out of sync with their deterministic builder");
    process.exit(1);
  }
  console.log("V129_INTERPRETATION_ASSET_PARITY=PASS");
} else {
  mkdirSync(dirname(outputPath), { recursive: true });
  writeFileSync(outputPath, generated, "utf8");
  writeFileSync(benchmarkOutputPath, generatedBenchmarks, "utf8");
  console.log(`V129_INTERPRETATION_COUNT=${entries.length}`);
  console.log(`V129_INTERPRETATION_OUTPUT=${outputPath}`);
  console.log(`V129_BENCHMARK_OUTPUT=${benchmarkOutputPath}`);
}
