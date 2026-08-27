import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const bindingPath = path.join(
  root,
  "src/data/visualization/mapSelectorBindingsV125.ts"
);
const mapPagePath = path.join(root, "src/pages/RealMapExplorerPage.tsx");
const mapIndexPath = path.join(
  root,
  "public/data/vietnam/v2/map-index.json"
);

const bindingSource = fs.readFileSync(bindingPath, "utf8");
const compiled = ts.transpileModule(bindingSource, {
  compilerOptions: {
    module: ts.ModuleKind.CommonJS,
    target: ts.ScriptTarget.ES2020,
  },
}).outputText;
const moduleRecord = { exports: {} };
new Function("exports", "module", "require", compiled)(
  moduleRecord.exports,
  moduleRecord,
  () => {
    throw new Error("map selector audit does not allow runtime imports");
  }
);
const { resolveMapSelectorBindingV125 } = moduleRecord.exports;
const mapIndex = JSON.parse(fs.readFileSync(mapIndexPath, "utf8"));
const mapPageSource = fs.readFileSync(mapPagePath, "utf8");
const c016 = mapIndex.layers.find((layer) => layer.elementId === "C-016");

const baseSelection = {
  measure: "measure-05aa50767eb1",
  sex: null,
  year: 2031,
  period: "2031-2035",
  dimensions: { category: "바이오매스발전(điện sinh khối)" },
};

const checks = [];
function check(name, pass, actual, expected) {
  checks.push({ name, status: pass ? "PASS" : "FAIL", actual, expected });
}

const valid = resolveMapSelectorBindingV125(
  "C-016",
  baseSelection,
  c016.selectors
);
check(
  "C016_EXACT_TUPLE",
  valid.status === "matched" &&
    valid.variable === "dien-sinh-khoi" &&
    valid.period === "2031-2035",
  valid,
  { status: "matched", variable: "dien-sinh-khoi", period: "2031-2035" }
);

const invalidPeriod = resolveMapSelectorBindingV125(
  "C-016",
  {
    ...baseSelection,
    dimensions: { category: "수력 30MW초과~50MW미만" },
  },
  c016.selectors
);
check(
  "C016_UNAVAILABLE_VARIABLE_PERIOD_REJECTED",
  invalidPeriod.status === "unsupported-selector" &&
    invalidPeriod.variable === null &&
    Boolean(invalidPeriod.reason),
  invalidPeriod,
  { status: "unsupported-selector", variable: null, reason: "non-empty" }
);

const invalidYear = resolveMapSelectorBindingV125(
  "C-016",
  { ...baseSelection, year: 2026, period: null },
  c016.selectors
);
check(
  "C016_UNMAPPED_YEAR_REJECTED",
  invalidYear.status === "unsupported-selector" && Boolean(invalidYear.reason),
  invalidYear,
  { status: "unsupported-selector", reason: "non-empty" }
);

const extraDimension = resolveMapSelectorBindingV125(
  "C-016",
  {
    ...baseSelection,
    dimensions: { ...baseSelection.dimensions, detail_2: "Hà Nội" },
  },
  c016.selectors
);
check(
  "C016_EXTRA_DIMENSION_REJECTED",
  extraDimension.status === "unsupported-selector" &&
    extraDimension.reason?.includes("detail_2"),
  extraDimension,
  { status: "unsupported-selector", reasonIncludes: "detail_2" }
);

const globalDimensionAliases = resolveMapSelectorBindingV125(
  "C-016",
  {
    ...baseSelection,
    dimensions: {
      ...baseSelection.dimensions,
      year: "2031",
      period: "2031-2035",
    },
  },
  c016.selectors
);
check(
  "GLOBAL_YEAR_PERIOD_DIMENSION_ALIASES_IGNORED",
  globalDimensionAliases.status === "matched",
  globalDimensionAliases,
  { status: "matched" }
);

const activeLayers = mapIndex.layers.filter((layer) => layer.active);
const defaultFailures = activeLayers.filter((layer) => {
  const resolved = resolveMapSelectorBindingV125(
    layer.elementId,
    { measure: null, sex: null, year: null, period: null, dimensions: {} },
    layer.selectors
  );
  return (
    resolved.status === "unsupported-selector" ||
    (resolved.variable &&
      !layer.selectors.variables.some(
        (variable) => variable.key === resolved.variable
      ))
  );
});
check(
  "ACTIVE_LAYER_DEFAULT_REGRESSION",
  activeLayers.length === 13 && defaultFailures.length === 0,
  { activeLayerCount: activeLayers.length, failures: defaultFailures.map((row) => row.elementId) },
  { activeLayerCount: 13, failures: [] }
);

check(
  "SAME_COUNTRY_SELECTOR_REHYDRATION_CONTRACT",
  mapPageSource.includes("sharedSelectorKeyV125") &&
    mapPageSource.includes("[layers, mapIndexStatus, sharedSelectorKey]") &&
    mapPageSource.includes("selectorForLayerFromSharedSelectionV125"),
  "source markers",
  "shared selector key effect"
);
check(
  "INITIAL_STATE_HYDRATION_GUARD",
  mapPageSource.includes("externalStateHydrated") &&
    mapPageSource.includes(
      'if (mapIndexStatus !== "ready" || !externalStateHydrated) return;'
    ),
  "source markers",
  "no outward state before hydration"
);

const reloadHydrationResetIndex = mapPageSource.indexOf(
  "setExternalStateHydrated(false);"
);
const reloadEffectStart = mapPageSource.lastIndexOf(
  "useEffect(() => {",
  reloadHydrationResetIndex
);
const reloadEffectEndMarker =
  "  }, [countryIso3, mapIndexReloadNonce]);";
const reloadEffectEnd = mapPageSource.indexOf(
  reloadEffectEndMarker,
  reloadHydrationResetIndex
);
const reloadEffectSource =
  reloadEffectStart >= 0 && reloadEffectEnd >= 0
    ? mapPageSource.slice(
        reloadEffectStart,
        reloadEffectEnd + reloadEffectEndMarker.length
      )
    : "";

const externalHydrationRestoreIndex = mapPageSource.indexOf(
  "setExternalStateHydrated(true);",
  Math.max(reloadEffectEnd, 0)
);
const reconciliationEffectStart = mapPageSource.lastIndexOf(
  "useEffect(() => {",
  externalHydrationRestoreIndex
);
const reconciliationEffectEnd = mapPageSource.indexOf(
  "\n  ]);",
  externalHydrationRestoreIndex
);
const reconciliationEffectSource =
  reconciliationEffectStart >= 0 && reconciliationEffectEnd >= 0
    ? mapPageSource.slice(
        reconciliationEffectStart,
        reconciliationEffectEnd + "\n  ]);".length
      )
    : "";

const reloadHydrationContract = {
  resetsHydration: reloadEffectSource.includes(
    "setExternalStateHydrated(false);"
  ),
  entersLoading: reloadEffectSource.includes('setMapIndexStatus("loading");'),
  replacesLayers: reloadEffectSource.includes("setLayers(nextLayers);"),
  entersReady: reloadEffectSource.includes('setMapIndexStatus("ready");'),
  reloadDependency: reloadEffectSource.includes(
    "[countryIso3, mapIndexReloadNonce]"
  ),
  reconcilesOnlyWhenReady: reconciliationEffectSource.includes(
    'if (mapIndexStatus !== "ready") return;'
  ),
  restoresHydration: reconciliationEffectSource.includes(
    "setExternalStateHydrated(true);"
  ),
  observesLayerReplacement: reconciliationEffectSource.includes("    layers,"),
  observesReadyTransition:
    reconciliationEffectSource.includes("    mapIndexStatus,"),
};
check(
  "MAP_INDEX_RELOAD_HYDRATION_CONTRACT",
  Object.values(reloadHydrationContract).every(Boolean),
  reloadHydrationContract,
  Object.fromEntries(
    Object.keys(reloadHydrationContract).map((key) => [key, true])
  )
);

checks.forEach((result) => console.log(JSON.stringify({ type: "check", ...result })));
const failed = checks.filter((result) => result.status === "FAIL");
console.log(
  JSON.stringify({
    type: "summary",
    audit: "map-selector:v125",
    status: failed.length === 0 ? "PASS" : "FAIL",
    passed: checks.length - failed.length,
    failed: failed.length,
    total: checks.length,
    failedChecks: failed.map((result) => result.name),
  })
);
if (failed.length > 0) process.exitCode = 1;
