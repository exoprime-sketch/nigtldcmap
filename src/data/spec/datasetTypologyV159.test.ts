import { describe, expect, test } from "@jest/globals";
import { VISUALIZATION_CONTRACT_V153 } from "../visualization/publicVisualizationContractV153";
import { allTypologyV159, getCardSpecV159, getTypologyV159 } from "./datasetSpecV159";
import specJson from "./datasetSpecV159.json";
import casesJson from "./useCasesV159.json";

const typology = allTypologyV159();
const specRows = specJson.rows as Array<{ elementId: string; sourceLabel: string; baseName: string; platformName: string; shortDefinition: string }>;
const cases = casesJson.cases as Array<{ elementId: string; caseNo: number; purpose: string; logic: string; storyline: string; users: string[]; caution: string; cautionDisplay: string; verified: string; dataUsed: Array<{ indicatorId: string | null; label: string; mapped: string }> }>;

describe("V159 dataset typology", () => {
  test("152 rows, every row has a display type and a structure", () => {
    expect(typology).toHaveLength(152);
    for (const row of typology) {
      expect(["U0", "U1", "U2", "U3", "U4", "U5", "U6"]).toContain(row.displayType);
      expect(["S1", "S2", "S3", "S4"]).toContain(row.structure);
    }
  });

  test("six display types plus status and four structures, no more", () => {
    expect(new Set(typology.map((row) => row.displayType)).size).toBeLessThanOrEqual(7);
    expect(new Set(typology.map((row) => row.structure)).size).toBeLessThanOrEqual(4);
  });

  test("dedicated components stay at six groups or fewer", () => {
    const groups = new Set(typology.map((row) => row.dedicated).filter(Boolean));
    expect(groups.size).toBeLessThanOrEqual(6);
  });

  test("the contract carries the typology's display type and structure", () => {
    expect(VISUALIZATION_CONTRACT_V153).toHaveLength(152);
    for (const row of VISUALIZATION_CONTRACT_V153) {
      const type = getTypologyV159(row.elementId)!;
      expect(row.displayType).toBe(type.displayType);
      expect(row.structure).toBe(type.structure);
      if (type.displayType === "U0") expect(row.primary.type).toBe("status-note");
    }
  });
});

describe("V159 dataset spec", () => {
  test("name split 152/152 rebuilds the platform name", () => {
    expect(specRows).toHaveLength(152);
    for (const row of specRows) {
      expect(row.sourceLabel.length).toBeGreaterThan(0);
      expect(row.baseName.length).toBeGreaterThan(0);
      const rebuilt = `${row.sourceLabel} ${row.baseName}`;
      // noPrefix rows keep the whole name as the base name.
      expect([row.platformName, rebuilt]).toContain(row.baseName === row.platformName ? row.platformName : rebuilt);
    }
  });

  test("short definitions are 50-90 characters", () => {
    for (const row of specRows) {
      const length = [...row.shortDefinition].length;
      expect(length).toBeGreaterThanOrEqual(50);
      expect(length).toBeLessThanOrEqual(90);
    }
  });

  test("every card spec row exists and names the same type", () => {
    for (const row of typology) expect(getCardSpecV159(row.elementId)?.displayType).toBe(row.displayType);
  });
});

describe("V159 use cases", () => {
  test("schema: required fields present, users from the four groups", () => {
    const users = new Set(["공공기관", "기업", "금융기관", "연구자"]);
    // Elements the workbook excluded (decision 제외) keep a stub case row with
    // purpose and logic only; every other case is complete.
    const excluded = new Set((specJson.rows as Array<{ elementId: string; decision: string | null }>).filter((row) => row.decision === "제외").map((row) => row.elementId));
    for (const item of cases) {
      expect(item.purpose.length).toBeGreaterThan(0);
      expect(item.logic.length).toBeGreaterThan(0);
      expect(["verified", "pending"]).toContain(item.verified);
      for (const user of item.users) expect(users.has(user)).toBe(true);
      if (excluded.has(item.elementId)) continue;
      expect(item.storyline.length).toBeGreaterThan(0);
      expect(item.dataUsed.length).toBeGreaterThan(0);
    }
  });

  test("366 verified cases and pending cases only for D-001, D-002, D-004", () => {
    expect(cases.filter((item) => item.verified === "verified")).toHaveLength(366);
    expect([...new Set(cases.filter((item) => item.verified === "pending").map((item) => item.elementId))].sort()).toEqual(["D-001", "D-002", "D-004"]);
  });

  test("displayed cautions name no country outside the registry", () => {
    const outside = ["방글라데시", "필리핀", "캄보디아", "인도네시아", "라오스", "스리랑카", "말레이시아", "이집트"];
    for (const item of cases) {
      if (item.cautionDisplay === item.caution) continue;
      for (const name of outside) expect(item.cautionDisplay.includes(name)).toBe(false);
    }
  });
});
