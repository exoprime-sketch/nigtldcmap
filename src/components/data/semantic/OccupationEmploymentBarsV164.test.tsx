import { afterEach, beforeEach, describe, expect, test } from "@jest/globals";
import { act } from "react-dom/test-utils";
import { createRoot } from "react-dom/client";
import type { Root } from "react-dom/client";
import type { SemanticObservationV125 } from "../../../data/visualization/semanticTypesV125";
import OccupationEmploymentWagePreviewV125 from "./OccupationEmploymentWagePreviewV125";

(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

/**
 * V164-3 (WP-E): E-012's bars read "12,909.26 천명" - two decimals on a headcount in
 * thousands. A bar says three significant digits; the table below it keeps the
 * delivered figure. The rows are test inputs shaped like E-012's (ILOSTAT, VND).
 */
function observation(occupation: string, value: number, unit: string): SemanticObservationV125 {
  return {
    recordId: `e012-${occupation}`,
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
    semanticMeasure: { key: "occupation_employment_count", labelKo: "직군별 종사자 수", unit, unitFamily: "count" },
    dimensions: { occupation, sex: "total", year: "2024" },
    dimensionLabels: {},
    displayLabel: occupation,
    seriesKey: occupation,
  } as unknown as SemanticObservationV125;
}

let host: HTMLDivElement;
let root: Root;
beforeEach(() => {
  host = document.createElement("div");
  document.body.appendChild(host);
  root = createRoot(host);
});
afterEach(() => {
  act(() => root.unmount());
  host.remove();
});

describe("E-012 occupation bars (V164)", () => {
  test("a bar value has three significant digits and the table keeps the exact figure", () => {
    act(() =>
      root.render(
        <OccupationEmploymentWagePreviewV125
          observations={[observation("professional", 12909.26, "천명"), observation("manager", 1234.5, "천명")]}
        />
      )
    );
    const bars = Array.from(host.querySelectorAll("[data-testid='e012-ranked-bars'] .e012v125__bar-value strong"))
      .map((node) => node.textContent)
      .filter((text) => text && text !== "—");
    expect(bars).toEqual(["12,909 천명", "1,235 천명"]);
    const table = host.querySelector("[data-testid='e012-ranked-bars'] table")?.textContent || "";
    expect(table).toContain("12909.26");
  });
});
