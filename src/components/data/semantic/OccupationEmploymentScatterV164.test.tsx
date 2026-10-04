import { afterEach, beforeEach, describe, expect, jest, test } from "@jest/globals";
import { act } from "react-dom/test-utils";
import { createRoot } from "react-dom/client";
import type { Root } from "react-dom/client";
import type { SemanticObservationV125 } from "../../../data/visualization/semanticTypesV125";
import OccupationEmploymentWagePreviewV125 from "./OccupationEmploymentWagePreviewV125";

(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

/**
 * V164-R3 (E-012 scatter): the y title was rotated and wrote over the tick labels, the x axis had no ticks,
 * and point names collided and ran out of the drawing. The rows are test inputs shaped like E-012's
 * (ILOSTAT, VND): headcounts in thousands, monthly wages in thousand VND.
 */
function observation(measure: "occupation_employment_count" | "occupation_wage", occupation: string, value: number, unit: string): SemanticObservationV125 {
  return {
    recordId: `e012-${measure}-${occupation}`,
    elementId: "E-012",
    indicatorId: "E-012-IND",
    countryIso3: "VNM",
    year: 2024,
    period: null,
    value,
    unit,
    loadStatus: "published",
    warnings: [],
    rightsStatus: "open",
    rightsNote: "",
    downloadEligible: true,
    provenance: {},
    semanticMeasure: { key: measure, labelKo: measure, unit, unitFamily: "count" },
    dimensions: { occupation, sex: "total", year: "2024" },
    dimensionLabels: {},
    displayLabel: occupation,
    seriesKey: occupation,
  } as unknown as SemanticObservationV125;
}

const ROWS: Array<[string, number, number]> = [
  ["manager", 1200, 9800],
  ["professional", 4100, 11200],
  ["technician", 2600, 9000],
  ["clerk", 1900, 8400],
  ["service_sales", 7400, 6100],
  ["craft", 7800, 6300],
  ["machine_operator", 8100, 6600],
  ["elementary", 12909, 4200],
  ["armed_forces", 1500, 9500],
];

const observations = ROWS.flatMap(([occupation, employment, wage]) => [
  observation("occupation_employment_count", occupation, employment, "천명"),
  observation("occupation_wage", occupation, wage, "천VND"),
]);

let host: HTMLDivElement;
let root: Root;
beforeEach(() => {
  jest.spyOn(Element.prototype, "getBoundingClientRect").mockReturnValue({ width: 560, height: 360, top: 0, left: 0, right: 560, bottom: 360, x: 0, y: 0, toJSON: () => ({}) });
  host = document.createElement("div");
  document.body.appendChild(host);
  root = createRoot(host);
  act(() => root.render(<OccupationEmploymentWagePreviewV125 observations={observations} />));
});
afterEach(() => {
  jest.restoreAllMocks();
  act(() => root.unmount());
  host.remove();
});

const scatter = () => host.querySelector("[data-testid='e012-employment-wage-scatter'] svg.e012v125__scatter") as SVGSVGElement;

describe("E-012 scatter (V164-R3)", () => {
  test("the drawing is as wide as its box, so its text keeps its pixel size", () => {
    expect(scatter().getAttribute("viewBox")).toBe(`0 0 560 ${scatter().getAttribute("height")}`);
    expect(scatter().getAttribute("width")).toBe("560");
  });

  test("the y title is horizontal, above the plot, and says the unit", () => {
    const title = scatter().querySelector("[data-testid='e012-scatter-y-title']")!;
    expect(title.getAttribute("transform")).toBeNull();
    expect(title.textContent).toContain("월평균 임금");
    expect(title.textContent).toContain("천VND");
    expect(Number(title.getAttribute("y"))).toBeLessThan(24);
  });

  test("the x axis has round ticks with labels", () => {
    const ticks = Array.from(scatter().querySelectorAll("[data-testid='e012-scatter-x-tick'] text")).map((node) => node.textContent);
    expect(ticks.length).toBeGreaterThanOrEqual(3);
    expect(ticks[0]).toBe("0");
    expect(ticks.every((text) => /^[0-9,.]+$/u.test(text || ""))).toBe(true);
    const yTicks = Array.from(scatter().querySelectorAll("[data-testid='e012-scatter-y-tick'] text")).map((node) => node.textContent);
    expect(yTicks.length).toBeGreaterThanOrEqual(3);
  });

  test("every occupation is one point with one name, all inside the drawing", () => {
    const width = Number(scatter().getAttribute("width"));
    const height = Number(scatter().getAttribute("height"));
    expect(scatter().querySelectorAll("[data-occupation]").length).toBe(ROWS.length);
    const labels = Array.from(scatter().querySelectorAll<SVGTextElement>("[data-testid='e012-scatter-label']"));
    expect(labels.length).toBe(ROWS.length);
    for (const label of labels) {
      const x = Number(label.getAttribute("x"));
      const y = Number(label.getAttribute("y"));
      expect(x).toBeGreaterThan(0);
      expect(x).toBeLessThan(width);
      expect(y).toBeGreaterThan(0);
      expect(y).toBeLessThan(height);
    }
  });

  test("the point's accessible text keeps the three-digit value wording", () => {
    const point = scatter().querySelector("[data-occupation='elementary']")!;
    expect(point.getAttribute("aria-label")).toContain("12,909 천명");
  });
});
