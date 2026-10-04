import { afterEach, beforeEach, describe, expect, test } from "@jest/globals";
import { act } from "react-dom/test-utils";
import { createRoot } from "react-dom/client";
import type { Root } from "react-dom/client";
import type { SemanticObservationV125 } from "../../../data/visualization/semanticTypesV125";
import { EMPTY_DATA_FINDER_SELECTOR_STATE_V125 } from "../../../types/dataFinderV125";
import PrimaryEnergyCompositionAnalysisV132, {
  completeEnergyYearsV132,
  energySeriesInRowsV164,
} from "./PrimaryEnergyCompositionAnalysisV132";

(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

/**
 * V164-3 (WP-F): BGD A-016 chips. Every technology chip narrows the page to the
 * indicators tagged with it, and the composition screen drew "no observation"
 * because it asked for all six sources. It draws the sources the page holds.
 */
const PREFIX = "A-016_primary_energy_";
const SIX = ["oil", "natural_gas", "coal", "nuclear", "hydro", "renewables"];
const YEARS = [2019, 2020, 2021];

function row(suffix: string, year: number, value: number): SemanticObservationV125 {
  return {
    countryIso3: "BGD",
    elementId: "A-016",
    indicatorId: `${PREFIX}${suffix}`,
    recordId: `${suffix}-${year}`,
    year,
    period: null,
    value,
    rawValue: value,
    unit: "EJ",
    provenance: {},
    loadStatus: "published",
    semanticMeasure: { key: "primary-energy", labelKo: "1차 에너지 소비량", unit: "EJ", unitFamily: "energy" },
    dimensions: {},
    dimensionLabels: {},
    displayLabel: suffix,
    seriesKey: `primary-energy|${suffix}`,
  } as unknown as SemanticObservationV125;
}

const rowsOf = (suffixes: string[]) => suffixes.flatMap((suffix, index) => YEARS.map((year) => row(suffix, year, (index + 1) * 10 + (year - 2019))));

let container: HTMLDivElement;
let root: Root;
beforeEach(() => {
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
});
afterEach(() => {
  act(() => root.unmount());
  container.remove();
});

function render(rows: SemanticObservationV125[]) {
  act(() =>
    root.render(
      <PrimaryEnergyCompositionAnalysisV132 rows={rows} selectorState={EMPTY_DATA_FINDER_SELECTOR_STATE_V125} onSelectorStateChange={() => undefined} />
    )
  );
  return container.querySelector('[data-testid="a016-energy-analysis-v132"]');
}

describe("A-016 source series", () => {
  test("energySeriesInRowsV164 lists the sources the rows carry, in the chart's order", () => {
    const rows = rowsOf(["hydro", "total_primary_energy", "oil"]) as Array<SemanticObservationV125 & { value: number }>;
    expect(energySeriesInRowsV164(rows).map((series) => series.key)).toEqual(["oil", "hydro"]);
  });

  test("a year counts when every source the page holds has a value", () => {
    const rows = [...rowsOf(["hydro"]), row("hydro", 2022, 5)] as Array<SemanticObservationV125 & { value: number }>;
    const hydro = energySeriesInRowsV164(rows);
    expect(completeEnergyYearsV132(rows, hydro).map((year) => year.year)).toEqual([2019, 2020, 2021, 2022]);
  });

  test("the whole screen still needs all six sources in a year (no zero fill)", () => {
    const rows = rowsOf(SIX) as Array<SemanticObservationV125 & { value: number }>;
    const partial = [...rows, row("hydro", 2022, 5)] as Array<SemanticObservationV125 & { value: number }>;
    expect(completeEnergyYearsV132(partial).map((year) => year.year)).toEqual(YEARS);
  });

  test("with no source series, a year counts when the total is delivered", () => {
    const rows = rowsOf(["total_primary_energy"]) as Array<SemanticObservationV125 & { value: number }>;
    expect(completeEnergyYearsV132(rows, []).map((year) => year.year)).toEqual(YEARS);
    expect(completeEnergyYearsV132([], [])).toEqual([]);
  });
});

describe("A-016 screen", () => {
  test("all six sources: the absolute trend, the share trend and the selected-year bars", () => {
    const section = render(rowsOf([...SIX, "total_primary_energy"]));
    expect(section).not.toBeNull();
    expect(section?.hasAttribute("data-technology-subset-v164")).toBe(false);
    expect(container.querySelector('[data-testid="a016-absolute-trend"]')).not.toBeNull();
    expect(container.querySelector('[data-testid="a016-share-trend"]')).not.toBeNull();
    expect(container.querySelector('[data-testid="a016-selected-year"]')).not.toBeNull();
    expect(container.querySelectorAll(".pec132__legend button")).toHaveLength(6);
  });

  test("a technology chip that leaves one source (05 수력): that source is drawn, not an empty screen", () => {
    const section = render(rowsOf(["hydro", "total_primary_energy"]));
    expect(section).not.toBeNull();
    expect(section?.getAttribute("data-technology-subset-v164")).toBe("true");
    expect(container.querySelector('[data-testid="a016-absolute-trend"]')).not.toBeNull();
    // A share of one source in a total of its own is always 100%.
    expect(container.querySelector('[data-testid="a016-share-trend"]')).toBeNull();
    expect(container.querySelector('[data-testid="a016-selected-year"]')).not.toBeNull();
    const legend = container.querySelectorAll(".pec132__legend button");
    expect(legend).toHaveLength(1);
    expect(legend[0].getAttribute("aria-label")).toContain("수력");
    expect(container.textContent).not.toContain("석유");
  });

  test("a chip that leaves only the supply total (16 발전효율): the total is drawn alone", () => {
    const section = render(rowsOf(["total_primary_energy"]));
    expect(section).not.toBeNull();
    expect(container.querySelector('[data-testid="a016-absolute-trend"]')).not.toBeNull();
    expect(container.querySelector('[data-testid="a016-share-trend"]')).toBeNull();
    expect(container.querySelector('[data-testid="a016-selected-year"]')).toBeNull();
    expect(container.querySelectorAll(".pec132__legend button")).toHaveLength(0);
  });

  test("no rows at all keeps the earlier empty state", () => {
    expect(render([])).toBeNull();
  });
});
