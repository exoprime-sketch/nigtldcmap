import { describe, expect, test } from "@jest/globals";
import { readFileSync } from "fs";
import { resolve } from "path";
import {
  ANALYSIS_BLOCK_TYPES_V153,
  AXIS_BLOCK_TYPES_V153,
  NUMERIC_CHART_TYPES_V153,
  VISUALIZATION_CONTRACT_V153,
  orderBlocksV153,
  standardPrimaryTypesV153,
  visualizationContractV153,
} from "./publicVisualizationContractV153";
import type { AnalysisBlockTypeV153 } from "./publicVisualizationContractV153";
import { judgeAxesV153, judgeFirstBlockV153 } from "../../components/data/public/DetailAnalysisFrameV153";
import { kpiTilesV153, trailingUnitV153 } from "../../components/data/public/DetailKpiStripV153";

const ROOT = resolve(__dirname, "../../..");
const catalogIds = (JSON.parse(readFileSync(resolve(ROOT, "public/data/vietnam/v2/catalog.json"), "utf8")).elements as Array<{ elementId: string }>).map((row) => row.elementId).sort();
const mapIndex = JSON.parse(readFileSync(resolve(ROOT, "public/data/vietnam/v2/map-index.json"), "utf8")).layers as Array<{ elementId: string; active?: boolean; enabled?: boolean }>;
const mapIds = new Set(mapIndex.filter((layer) => layer.active !== false && layer.enabled !== false).map((layer) => layer.elementId));

// V159: the status screens are the typology's ⓪ rows (C-020, C-021, C-023,
// E-011, E-013 and, from the 2026-09-23 exclusion, E-016 and E-017) - see
// reports/v159/EXPECTATION_CHANGES_V159.md.
const STATUS_IDS = (JSON.parse(readFileSync(resolve(ROOT, "src/data/spec/datasetTypologyV159.json"), "utf8")).rows as Array<{ elementId: string; displayType: string }>)
  .filter((row) => row.displayType === "U0")
  .map((row) => row.elementId)
  .sort();
const COMPOSITION_IDS = ["A-010", "A-011", "A-016", "A-018", "B-037"];
const PRESERVED_IDS = ["A-016", "D-011", "A-002", "E-012", "D-005", "A-023", "A-024", "C-018", "B-046", "B-047", "C-012"];
const MATRIX_IDS = ["A-013", "C-005", "B-044"];

describe("V153 visualization contract", () => {
  test("covers the 152 catalogue datasets once each", () => {
    const ids = VISUALIZATION_CONTRACT_V153.map((row) => row.elementId).sort();
    expect(ids).toEqual(catalogIds);
    expect(new Set(ids).size).toBe(152);
  });

  test("every row is well-formed: vocabularies, axes by type, benchmarks, notes", () => {
    for (const row of VISUALIZATION_CONTRACT_V153) {
      expect(["national-series", "composition", "province-distribution", "registry", "station", "policy-document", "matrix", "status-note"]).toContain(row.archetype);
      expect(ANALYSIS_BLOCK_TYPES_V153).toContain(row.primary.type);
      expect(row.primary.title.length).toBeGreaterThan(1);
      expect(row.primary.title.length).toBeLessThanOrEqual(40);
      for (const block of row.secondary) expect(ANALYSIS_BLOCK_TYPES_V153).toContain(block.type);
      if (AXIS_BLOCK_TYPES_V153.includes(row.primary.type)) {
        expect(row.primary.xAxis).toBeTruthy();
        expect(row.primary.yAxis).toBeTruthy();
        expect(row.primary.unit).toBeTruthy();
      } else {
        expect(row.primary.xAxis).toBeNull();
        expect(row.primary.yAxis).toBeNull();
        expect(row.primary.unit).toBeNull();
      }
      expect(row.benchmarks.length).toBeGreaterThanOrEqual(2);
      for (const benchmark of row.benchmarks) {
        expect(benchmark.name.length).toBeGreaterThan(1);
        expect(benchmark.url).toMatch(/^https:\/\//u);
      }
      expect(["standard", "preserved", "exception"]).toContain(row.status);
      expect(["beside-primary", "none", "pending"]).toContain(row.mapRole);
      if (row.status === "exception") expect(row.note.length).toBeGreaterThan(8);
      // No internal wording on a public contract.
      expect(`${row.primary.title} ${row.note}`).not.toMatch(/\.json|\.mjs|raw|attr_\d|TODO/u);
    }
  });

  test("the type standard holds for every standard row; exceptions state why", () => {
    for (const row of VISUALIZATION_CONTRACT_V153) {
      const allowed = standardPrimaryTypesV153(row.archetype);
      if (row.status === "standard") {
        expect({ id: row.elementId, type: row.primary.type, allowed }).toEqual({ id: row.elementId, type: row.primary.type, allowed: expect.arrayContaining([row.primary.type]) });
      }
      if (row.status === "exception") expect(allowed).not.toContain(row.primary.type);
    }
  });

  test("named sets: status notes, compositions, matrices, preserved structures", () => {
    for (const id of STATUS_IDS) {
      const row = visualizationContractV153(id)!;
      expect(row.archetype).toBe("status-note");
      expect(row.primary.type).toBe("status-note");
      expect(row.secondary).toEqual([]);
    }
    expect(VISUALIZATION_CONTRACT_V153.filter((row) => row.archetype === "status-note").map((row) => row.elementId).sort()).toEqual(STATUS_IDS);
    for (const id of COMPOSITION_IDS) expect(visualizationContractV153(id)!.archetype).toBe("composition");
    for (const id of MATRIX_IDS) {
      const row = visualizationContractV153(id)!;
      expect(row.archetype).toBe("matrix");
      // The heatmap is a later phase: this round they open on their text
      // matrix or cards and say so; a standard row must be the matrix type.
      if (row.status === "standard") expect(["heatmap", "sorted-table"]).toContain(row.primary.type);
      else expect(row.note).toMatch(/후속/u);
    }
    for (const id of PRESERVED_IDS) expect(visualizationContractV153(id)!.status).toBe("preserved");
  });

  test("policy and status screens never open on a numeric chart", () => {
    for (const row of VISUALIZATION_CONTRACT_V153) {
      if (row.archetype === "policy-document" || row.archetype === "status-note") {
        expect(NUMERIC_CHART_TYPES_V153).not.toContain(row.primary.type);
      }
    }
  });

  test("map roles follow the map index; B-017 stays pending", () => {
    for (const row of VISUALIZATION_CONTRACT_V153) {
      if (row.elementId === "B-017") {
        expect(row.mapRole).toBe("pending");
        continue;
      }
      expect(row.mapRole).toBe(mapIds.has(row.elementId) ? "beside-primary" : "none");
    }
  });
});

describe("block ordering and verdicts", () => {
  const blocks = [
    { type: "category-bar" as AnalysisBlockTypeV153, key: "a" },
    { type: "line" as AnalysisBlockTypeV153, key: "b" },
    { type: "table" as AnalysisBlockTypeV153, key: "c" },
  ];
  test("orderBlocksV153 moves the contract's primary type first and keeps the rest stable", () => {
    expect(orderBlocksV153(blocks, "line").map((block) => block.key)).toEqual(["b", "a", "c"]);
    expect(orderBlocksV153(blocks, "table").map((block) => block.key)).toEqual(["c", "a", "b"]);
    expect(orderBlocksV153(blocks, "category-bar").map((block) => block.key)).toEqual(["a", "b", "c"]);
    expect(orderBlocksV153(blocks, "heatmap").map((block) => block.key)).toEqual(["a", "b", "c"]);
    expect(orderBlocksV153(blocks, null).map((block) => block.key)).toEqual(["a", "b", "c"]);
  });
  test("the frame judges the first block and the axes against the contract", () => {
    const line = visualizationContractV153("A-001")!;
    expect(judgeFirstBlockV153(line, "line")).toBe("match");
    expect(judgeFirstBlockV153(line, "category-bar")).toBe("mismatch");
    expect(judgeFirstBlockV153(line, null)).toBe("untagged");
    expect(judgeFirstBlockV153(null, "line")).toBe("none");
    expect(judgeAxesV153(line, { x: "연도", y: "CPI 점수 (점)", unit: "점" })).toBe("match");
    expect(judgeAxesV153(line, { x: "연도", y: "CPI 점수", unit: "%" })).toBe("mismatch");
    expect(judgeAxesV153(line, null)).toBe("missing");
    expect(judgeAxesV153(visualizationContractV153("C-009")!, null)).toBe("not-applicable");
  });
});

describe("core figures row", () => {
  test("units are read from the headline, never invented", () => {
    expect(trailingUnitV153("41 점")).toBe("점");
    expect(trailingUnitV153("41,350 MW")).toBe("MW");
    expect(trailingUnitV153("54건")).toBe("건");
    expect(trailingUnitV153("3.2%")).toBe("%");
    expect(trailingUnitV153("값 제공 전")).toBe("");
  });
  test("a status card yields no tiles; a series card yields 3-4 tiles each with a unit", () => {
    const status = { elementId: "C-020", title: "", kind: "status" as const, headline: { value: "값 제공 전", label: "원자료 미수집" }, preview: {}, period: "—", provider: "", selection: null, basis: { unit: "", rule: "" }, measure: null, mapConnected: false, downloadable: false };
    expect(kpiTilesV153(status, [], [], 0)).toEqual([]);
    const series = { ...status, elementId: "A-001", kind: "line" as const, headline: { value: "41 점", label: "CPI 점수 · 2025년" }, period: "2012–2025년", measure: { key: "m", label: "CPI 점수", unit: "점" } };
    const observation = { recordId: "r1", elementId: "A-001", indicatorId: "A-001_cpi_score", value: 41, year: 2025 } as unknown as Parameters<typeof kpiTilesV153>[1][number];
    const tiles = kpiTilesV153(series, [observation], [], 1);
    expect(tiles.length).toBeGreaterThanOrEqual(3);
    expect(tiles.length).toBeLessThanOrEqual(4);
    for (const tile of tiles) {
      expect(tile.unit).toBeTruthy();
      expect(tile.value).toContain(tile.unit);
    }
    expect(tiles[0]).toEqual({ key: "headline", value: "41 점", unit: "점", label: "CPI 점수 · 2025년" });
  });
});
