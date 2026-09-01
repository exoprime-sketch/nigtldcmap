#!/usr/bin/env node

import { readFileSync, writeFileSync } from "node:fs";
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

if (process.argv.includes("--check")) {
  const current = readFileSync(outputPath, "utf8");
  if (current !== generated) {
    console.error("indicator-interpretation-v129.json is out of sync with the runtime registry");
    process.exit(1);
  }
  console.log("V129_INTERPRETATION_PARITY=PASS");
} else {
  writeFileSync(outputPath, generated, "utf8");
  console.log(`V129_INTERPRETATION_COUNT=${entries.length}`);
  console.log(`V129_INTERPRETATION_OUTPUT=${outputPath}`);
}
