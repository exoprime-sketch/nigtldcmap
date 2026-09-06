#!/usr/bin/env node

import { existsSync, readFileSync, statSync } from "node:fs";
import { dirname, resolve } from "node:path";
import ts from "typescript";

import {
  AuditV125,
  PROJECT_ROOT,
  V2_ROOT,
  catalogElements,
  loadPackPayloads,
  payloadRecords,
  readJson,
} from "./v125/audit-utils.mjs";
import {
  finishAuditV131,
  isPlaceholderPrimaryTitleV131,
  normalizePublicTextV131,
} from "./v131/audit-helpers.mjs";

const audit = new AuditV125("public-naming:v131");
const catalogResult = readJson(resolve(V2_ROOT, "catalog.json"));
const catalog = catalogElements(catalogResult.value);
const catalogById = new Map(catalog.map((element) => [element.elementId, element]));
const packs = loadPackPayloads();
const titlePolicyPath = resolve(
  PROJECT_ROOT,
  "src/data/visualization/publicEntityTitleV131.ts"
);

/**
 * Runs the title policy from source, with its real dependencies.
 *
 * The policy used to be a single file and this loader refused every import, so
 * that the titles the gate reconciles are the ones the site renders and not a
 * stub's. That still holds - nothing here is faked - but the policy now reads
 * the verified project names and the category-label rule from two modules
 * beside it, so relative imports are compiled and executed the same way rather
 * than rejected. Anything outside src/ is still refused: a dependency the gate
 * cannot run is a dependency the gate cannot vouch for.
 */
function compileModuleV131(path, cache = new Map()) {
  const resolved = resolve(path);
  if (cache.has(resolved)) return cache.get(resolved);
  const file = [resolved, `${resolved}.ts`, `${resolved}.tsx`].find(
    (candidate) => existsSync(candidate) && statSync(candidate).isFile()
  );
  if (!file) throw new Error(`module not found: ${path}`);

  const result = ts.transpileModule(readFileSync(file, "utf8"), {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
    },
    fileName: file,
    reportDiagnostics: true,
  });
  const errors = (result.diagnostics || []).filter(
    (diagnostic) => diagnostic.category === ts.DiagnosticCategory.Error
  );
  if (errors.length > 0) {
    throw new Error(
      errors
        .map((diagnostic) =>
          ts.flattenDiagnosticMessageText(diagnostic.messageText, " ")
        )
        .join("; ")
    );
  }

  const moduleRecord = { exports: {} };
  cache.set(resolved, moduleRecord.exports);
  new Function("exports", "module", "require", result.outputText)(
    moduleRecord.exports,
    moduleRecord,
    (specifier) => {
      if (!specifier.startsWith(".")) {
        throw new Error(`unexpected runtime import: ${specifier}`);
      }
      const target = resolve(dirname(file), specifier);
      if (!target.startsWith(resolve(PROJECT_ROOT, "src"))) {
        throw new Error(`import outside src: ${specifier}`);
      }
      return compileModuleV131(target, cache);
    }
  );
  cache.set(resolved, moduleRecord.exports);
  return moduleRecord.exports;
}

function compileTitlePolicyV131(path) {
  return compileModuleV131(path);
}

let titleApi = null;
let titlePolicyError = null;
try {
  titleApi = compileTitlePolicyV131(titlePolicyPath);
} catch (error) {
  titlePolicyError = error instanceof Error ? error.message : String(error);
}

audit.check("CATALOG_JSON", catalogResult.error === null, catalogResult.error, null);
audit.check("PACK_PAYLOADS", packs.errors.length === 0, packs.errors.length, 0, packs.errors);
audit.check("FRAMEWORK_ELEMENTS", catalog.length === 152, catalog.length, 152);
audit.check("ACCOUNTED_ELEMENTS", packs.elements.size === 152, packs.elements.size, 152);
audit.check(
  "PUBLIC_ENTITY_TITLE_POLICY_API",
  titlePolicyError === null &&
    typeof titleApi?.resolvePublicEntityTitleV131 === "function" &&
    typeof titleApi?.publicEntityTitleV131 === "function",
  {
    error: titlePolicyError,
    resolve: typeof titleApi?.resolvePublicEntityTitleV131,
    title: typeof titleApi?.publicEntityTitleV131,
  },
  { error: null, resolve: "function", title: "function" }
);

const titleRows = [];
const blankTitles = [];
const placeholderTitles = [];
const rawTechnicalTitles = [];
const unavailableStrategies = [];
// Do not treat legitimate source names such as "V1-2 wind power plant" as
// internal versions. Internal record prefixes are narrower and deterministic.
const rawTechnicalPattern = /^(?:vnm[-_]?v?\d+|v(?:12[4-9]|13[01])[-_]|[a-f0-9]{12,}$|record[-_]|entity[-_])/iu;

if (titleApi?.resolvePublicEntityTitleV131) {
  for (const [elementId, payload] of packs.elements.entries()) {
    const element = catalogById.get(elementId);
    const entities = payloadRecords(payload?.entities);
    for (const entity of entities) {
      const resolution = titleApi.resolvePublicEntityTitleV131(entity, {
        template: element?.detailTemplate,
        elementTitle: element?.elementLabel,
      });
      const title = normalizePublicTextV131(resolution?.title);
      const row = {
        elementId,
        title,
        strategy: normalizePublicTextV131(resolution?.strategy),
        nameAvailability: normalizePublicTextV131(
          resolution?.nameAvailability
        ),
      };
      titleRows.push(row);
      if (!title) blankTitles.push(row);
      if (isPlaceholderPrimaryTitleV131(title)) placeholderTitles.push(row);
      if (rawTechnicalPattern.test(title)) rawTechnicalTitles.push(row);
      if (row.strategy === "unavailable") unavailableStrategies.push(row);
    }
  }
}

const contextualStrategies = new Set([
  "source-identifier",
  "factual-composite",
  "record-type",
]);
const contextualTitleCount = titleRows.filter((row) =>
  contextualStrategies.has(row.strategy)
).length;

audit.check(
  "PUBLIC_PLACEHOLDER_PRIMARY_TITLE_COUNT",
  placeholderTitles.length === 0,
  placeholderTitles.length,
  0,
  placeholderTitles.slice(0, 40)
);
audit.check(
  "PUBLIC_BLANK_PRIMARY_TITLE_COUNT",
  blankTitles.length === 0,
  blankTitles.length,
  0,
  blankTitles.slice(0, 40)
);
audit.check(
  "RAW_TECHNICAL_PRIMARY_LABEL_COUNT",
  rawTechnicalTitles.length === 0,
  rawTechnicalTitles.length,
  0,
  rawTechnicalTitles.slice(0, 40)
);
audit.check(
  "UNAVAILABLE_TITLE_STRATEGY_COUNT",
  unavailableStrategies.length === 0,
  unavailableStrategies.length,
  0,
  unavailableStrategies.slice(0, 40)
);
audit.check(
  "ENTITY_TITLE_RECONCILIATION",
  titleRows.length ===
    [...packs.elements.values()].reduce(
      (sum, payload) => sum + payloadRecords(payload?.entities).length,
      0
    ),
  titleRows.length,
  "all public entities"
);

finishAuditV131(audit, "public-naming-audit-v131.json", {
  entityCount: titleRows.length,
  entityContextTitleCount: contextualTitleCount,
  publicPlaceholderPrimaryTitleCount: placeholderTitles.length,
  publicBlankPrimaryTitleCount: blankTitles.length,
  rawTechnicalPrimaryLabelCount: rawTechnicalTitles.length,
  strategyCounts: Object.fromEntries(
    [...new Set(titleRows.map((row) => row.strategy))]
      .sort()
      .map((strategy) => [
        strategy,
        titleRows.filter((row) => row.strategy === strategy).length,
      ])
  ),
});
