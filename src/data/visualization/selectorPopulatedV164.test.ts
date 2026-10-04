import fs from "fs";
import path from "path";
import type { VietnamEntityV124 } from "../vietnam/vietnamTypesV124";
import {
  PORTFOLIO_WORKSPACE_ELEMENTS_V164,
  drawsPortfolioWorkspaceV164,
  hasPublicValueV164,
  isRawKeyLabelV164,
  namedMeasuresV164,
  populatedChoicesV164,
} from "./selectorPopulatedV164";

const entity = (extra: Record<string, unknown> = {}) => ({ entityId: "e1", indicatorId: "i1", ...extra }) as unknown as VietnamEntityV124;

describe("hasPublicValueV164", () => {
  it("treats an empty source cell as no value, and keeps a real zero", () => {
    expect(hasPublicValueV164(null)).toBe(false);
    expect(hasPublicValueV164(undefined)).toBe(false);
    expect(hasPublicValueV164("")).toBe(false);
    expect(hasPublicValueV164(Number.NaN)).toBe(false);
    expect(hasPublicValueV164(Number.POSITIVE_INFINITY)).toBe(false);
    expect(hasPublicValueV164(0)).toBe(true);
    expect(hasPublicValueV164(12.5)).toBe(true);
    expect(hasPublicValueV164("해당 없음")).toBe(true);
  });
});

describe("populatedChoicesV164", () => {
  it("offers only the choices that lead to a value", () => {
    expect(populatedChoicesV164(["2019", "2020", "2021"], (year) => year !== "2021")).toEqual(["2019", "2020"]);
  });

  it("keeps the whole list when no choice leads to a value (current behavior)", () => {
    expect(populatedChoicesV164(["2019", "2020"], () => false)).toEqual(["2019", "2020"]);
  });

  it("returns a copy, never the input array", () => {
    const input = ["a"];
    expect(populatedChoicesV164(input, () => false)).not.toBe(input);
  });
});

describe("isRawKeyLabelV164", () => {
  it("detects a column key used as a name", () => {
    expect(isRawKeyLabelV164("D-009_environmental_protection_expenditure_lcu")).toBe(true);
    expect(isRawKeyLabelV164("environmental_protection_expenditure")).toBe(true);
  });

  it("leaves public names alone", () => {
    expect(isRawKeyLabelV164("환경보호 지출")).toBe(false);
    expect(isRawKeyLabelV164("GDP (current US$)")).toBe(false);
    expect(isRawKeyLabelV164("CO2")).toBe(false);
    expect(isRawKeyLabelV164("")).toBe(false);
    expect(isRawKeyLabelV164(null)).toBe(false);
  });
});

describe("namedMeasuresV164", () => {
  it("hides a raw-key measure while a named one exists (VNM D-009)", () => {
    const measures = [{ labelKo: "환경보호 지출" }, { labelKo: "D-009_environmental_protection_expenditure_lcu" }];
    expect(namedMeasuresV164(measures)).toEqual([{ labelKo: "환경보호 지출" }]);
  });

  it("keeps every measure when all of them are raw keys", () => {
    const measures = [{ labelKo: "a_b" }, { labelKo: "c_d" }];
    expect(namedMeasuresV164(measures)).toEqual(measures);
  });
});

describe("drawsPortfolioWorkspaceV164", () => {
  const records = [entity()];

  it("is true for the portfolio elements that hold entity records", () => {
    expect(drawsPortfolioWorkspaceV164("D-023", "line-chart", records)).toBe(true);
    expect(drawsPortfolioWorkspaceV164("D-017", "table", records)).toBe(true);
  });

  it("is true for any element whose renderer is the portfolio", () => {
    expect(drawsPortfolioWorkspaceV164("E-020", "portfolio", records)).toBe(true);
  });

  it("is false without entity records, so the selectors stay (current behavior)", () => {
    expect(drawsPortfolioWorkspaceV164("D-023", "portfolio", [])).toBe(false);
  });

  it("is false for the timeline and matrix renderers", () => {
    expect(drawsPortfolioWorkspaceV164("D-023", "policy-timeline", records)).toBe(false);
    expect(drawsPortfolioWorkspaceV164("D-023", "evidence-matrix", records)).toBe(false);
  });

  it("is false for an element outside the portfolio list with another renderer", () => {
    expect(drawsPortfolioWorkspaceV164("A-001", "line-chart", records)).toBe(false);
  });
});

describe("PORTFOLIO_WORKSPACE_ELEMENTS_V164", () => {
  it("equals the renderer's PUBLIC_PORTFOLIO_ELEMENTS_V132 (the renderer is not edited by this change)", () => {
    const source = fs.readFileSync(path.join(__dirname, "../../components/data/semantic/SemanticContractRendererV125.tsx"), "utf8");
    const block = /PUBLIC_PORTFOLIO_ELEMENTS_V132\s*=\s*new Set\(\[([^\]]*)\]\)/u.exec(source);
    expect(block).not.toBeNull();
    const inRenderer = [...(block?.[1] || "").matchAll(/"([A-Z]-\d{3})"/gu)].map((match) => match[1]).sort();
    expect(inRenderer.length).toBeGreaterThan(0);
    expect([...PORTFOLIO_WORKSPACE_ELEMENTS_V164].sort()).toEqual(inRenderer);
  });
});
