#!/usr/bin/env node

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  PROJECT_ROOT,
  createAudit,
  publicJson,
  reportJson,
} from "./lib/v130-spatial-audit-utils.mjs";

const { check, finish } = createAudit(
  "MAP_DEDUP_V130",
  "map-dedup-audit-result-v130.json"
);
const mapIndex = publicJson("map-index.json");
const catalog = publicJson("catalog.json");
const semanticContracts = publicJson(
  "semantic/element-visualization-contracts-v125.json"
);
const duplicateAudit = reportJson("map-cross-layer-duplicate-audit-v130.json");
const presetSource = readFileSync(
  resolve(PROJECT_ROOT, "src/data/visualization/publicMapWorkspaceV126.ts"),
  "utf8"
);
const selectorBindingSource = readFileSync(
  resolve(PROJECT_ROOT, "src/data/visualization/mapSelectorBindingsV125.ts"),
  "utf8"
);

check(
  "D023_D018_DUPLICATE_COUNT_BEFORE",
  duplicateAudit.duplicateLogicalProjectCountBefore === 4,
  duplicateAudit.duplicateLogicalProjectCountBefore,
  4
);
check(
  "D023_D018_VISIBLE_DUPLICATE_COUNT_BEFORE",
  duplicateAudit.duplicateVisibleProjectCountBefore === 3,
  duplicateAudit.duplicateVisibleProjectCountBefore,
  3
);
check(
  "D023_ACTIVE_MAP_LAYER_REMOVED",
  !mapIndex.layers.some((layer) => layer.elementId === "D-023") &&
    catalog.elements.find((element) => element.elementId === "D-023")?.mapMode ===
      "panel-only" &&
    semanticContracts.contracts.find(
      (contract) => contract.elementId === "D-023"
    )?.mapLinkage?.mapMode === "panel-only" &&
    !/\|\s*["']D-023["']/u.test(presetSource),
  {
    activeLayers: mapIndex.layers.filter((layer) => layer.elementId === "D-023").length,
    catalogMapMode: catalog.elements.find((element) => element.elementId === "D-023")?.mapMode,
    semanticMapMode: semanticContracts.contracts.find(
      (contract) => contract.elementId === "D-023"
    )?.mapLinkage?.mapMode,
  },
  "no active layer or preset type; catalog/semantic panel-only"
);
check(
  "CROSS_LAYER_DUPLICATE_VISIBLE_COUNT",
  duplicateAudit.duplicateVisibleProjectCountAfter === 0,
  duplicateAudit.duplicateVisibleProjectCountAfter,
  0
);
check(
  "CLIMATE_FINANCE_PRESET_PRIMARY_D018",
  /id:\s*["']CLIMATE_FINANCE_PROJECTS["'][\s\S]{0,500}?primary:\s*\{\s*elementId:\s*["']D-018["']/u.test(
    presetSource
  ),
  "preset source",
  "D-018 primary"
);
check(
  "CLIMATE_FINANCE_PRESET_NO_D023_LAYER",
  !/id:\s*["']CLIMATE_FINANCE_PROJECTS["'][\s\S]{0,900}?\{\s*elementId:\s*["']D-023["']/u.test(
    presetSource
  ),
  "preset composition",
  "no D-023"
);
check(
  "D023_MAP_SELECTOR_BINDING_REMOVED",
  !/elementId:\s*["']D-023["']/u.test(selectorBindingSource),
  "selector binding source",
  "no D-023 map selector binding"
);
finish({
  duplicateCountBefore: duplicateAudit.duplicateLogicalProjectCountBefore,
  duplicateVisibleCountAfter: duplicateAudit.duplicateVisibleProjectCountAfter,
});
