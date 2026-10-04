import { afterEach, beforeEach, describe, expect, jest, test } from "@jest/globals";
import { act } from "react-dom/test-utils";
import { createRoot } from "react-dom/client";
import type { Root } from "react-dom/client";
import type { SemanticObservationV125 } from "../../../data/visualization/semanticTypesV125";
import { EMPTY_DATA_FINDER_SELECTOR_STATE_V125 } from "../../../types/dataFinderV125";
import ProvinceSeriesAnalysisV140 from "./ProvinceSeriesAnalysisV140";

(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

/**
 * V164-3 (WP-E): VNM B-033 lists "전체 62개" provinces while the source has 63. The
 * province with no value at the chosen year is named as left out of the ranking
 * instead of being a silent difference between 62 and 63. The rows are test inputs
 * shaped like B-033's (one value per province and year).
 */
const KNOWN = ["An Giang", "Hà Nội", "Hồ Chí Minh", "Quảng Ninh", "Nghệ An", "Đà Nẵng", "Lai Châu", "Cà Mau"];
const PROVINCES = [...KNOWN, ...Array.from({ length: 16 }, (_, index) => `Tỉnh thử ${String(index + 1).padStart(2, "0")}`)];

function row(province: string, year: number, value: number): SemanticObservationV125 {
  return {
    recordId: `${province}-${year}`,
    elementId: "B-033",
    indicatorId: "B-033-IND",
    countryIso3: "VNM",
    year,
    period: null,
    value,
    unit: "%",
    loadStatus: "published",
    warnings: [],
    rightsStatus: "open",
    rightsNote: "",
    downloadEligible: true,
    provenance: {},
    semanticMeasure: { key: "share", labelKo: "비중", unit: "%", unitFamily: "percent" },
    dimensions: { province },
    dimensionLabels: { province },
    displayLabel: province,
    seriesKey: province,
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

function render(rows: SemanticObservationV125[]): void {
  act(() =>
    root.render(
      <ProvinceSeriesAnalysisV140
        elementId="B-033"
        rows={rows}
        selectorState={EMPTY_DATA_FINDER_SELECTOR_STATE_V125}
        onSelectorStateChange={jest.fn()}
        elementTitle="성·시별 비중"
      />
    )
  );
}

describe("province ranking (V164)", () => {
  test("a province with no value at the chosen year is named as left out", () => {
    const rows = PROVINCES.map((province, index) => (province === "Cà Mau" ? row(province, 2019, 5) : row(province, 2020, 10 + index)));
    // Cà Mau reports 2019 only, so 2020 (the latest year in the rows) ranks 23 of 24
    render(rows);
    const note = host.querySelector("[data-testid='psa140-missing-regions-v164']");
    expect(note).not.toBeNull();
    expect(note?.textContent).toContain("값이 없는 성·시 1곳");
    expect(note?.textContent).toContain("순위에서 제외");
    expect(host.querySelector("[data-testid='psa140-rank-notice-v160']")?.textContent).toContain("전체 23개");
  });

  test("no note when every province has a value", () => {
    render(PROVINCES.map((province, index) => row(province, 2020, 10 + index)));
    expect(host.querySelector("[data-testid='psa140-missing-regions-v164']")).toBeNull();
  });

  test("more than three missing provinces are counted, not listed", () => {
    const missing = new Set(["Cà Mau", "Lai Châu", "Nghệ An", "Đà Nẵng"]);
    render(PROVINCES.map((province, index) => (missing.has(province) ? row(province, 2019, 5) : row(province, 2020, 10 + index))));
    const text = host.querySelector("[data-testid='psa140-missing-regions-v164']")?.textContent || "";
    expect(text).toContain("4곳");
    expect(text).not.toContain("(");
  });
});
