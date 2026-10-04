import { afterEach, beforeEach, describe, expect, jest, test } from "@jest/globals";
import { act } from "react-dom/test-utils";
import { createRoot } from "react-dom/client";
import type { Root } from "react-dom/client";

import PublicRegionScenarioSummaryV138 from "./PublicRegionScenarioSummaryV138";
import { DataCountryProviderV158 } from "../../../data/countries/DataCountryContextV158";
import type { VietnamEntityV124 } from "../../../data/vietnam/vietnamTypesV124";
import type { DataFinderSelectorStateV125 } from "../../../types/dataFinderV125";

// The chart's own layout needs a browser; this suite is about the grade table.
jest.mock("../../charts/InteractiveTimeSeriesChartV127", () => ({
  InteractiveTimeSeriesChartV127: ({ testId }: { testId?: string }) => <div data-testid={testId} />,
}));

(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

/**
 * V164-3 (WP-E): B-017's grade table listed the source's English bands in the order
 * they were counted ("High", "Low - Medium"...), and "Low" and "Low - Medium" were
 * placed by a prefix match. Bands now run low to high with "No Data" last, in Korean.
 * The rows are test inputs shaped like B-017's (one grade per basin x province unit).
 */
const GRADE_KEY = "기준_물스트레스_Baseline_Water_Stress_등급";
const VALUE_KEY = "기준_물스트레스_Baseline_Water_Stress_원값";
const PROVINCES = ["Hà Nội", "Đà Nẵng", "Cần Thơ", "An Giang", "Nghệ An", "Cà Mau"];
const GRADES = ["High (40-80%)", "Extremely High (>80%)", "Low - Medium (10-20%)", "No Data", "Low (<10%)", "Medium - High (20-40%)"];

function rows(): VietnamEntityV124[] {
  return PROVINCES.map(
    (province, index) =>
      ({
        recordId: `B-017-${index}`,
        elementId: "B-017",
        indicatorId: "B-017_basin_adm1",
        normalizedAttributes: {
          지역명_로마자: province,
          행정단위: "Province",
          HydroBASINS_lvl6_코드_pfaf_id: String(400000 + index),
          [VALUE_KEY]: index / 10,
          [GRADE_KEY]: GRADES[index],
        },
      }) as unknown as VietnamEntityV124
  );
}

let container: HTMLDivElement;
let root: Root;
beforeEach(() => {
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
});
afterEach(async () => {
  await act(async () => root.unmount());
  container.remove();
});

describe("grade table of a water-risk delivery (V164)", () => {
  test("the bands run low to extremely high, in Korean, with no-data last", async () => {
    await act(async () => {
      root.render(
        <DataCountryProviderV158 country="VNM">
          <PublicRegionScenarioSummaryV138
            elementId="B-017"
            entities={rows()}
            elementTitle="물 스트레스"
            selectorState={{ dimensions: {}, year: null, period: null, measure: null, sex: null } as DataFinderSelectorStateV125}
            onSelectorStateChange={() => undefined}
          />
        </DataCountryProviderV158>
      );
    });
    const table = container.querySelector('[data-testid="region-scenario-grades-v138"]');
    expect(table).not.toBeNull();
    const bands = Array.from(table!.querySelectorAll("tbody th")).map((node) => node.textContent || "");
    // the order is the band's own, the delivered order was High, Extremely High, Low - Medium, ...
    expect(bands).toEqual(["낮음 (<10%)", "낮음~중간 (10-20%)", "중간~높음 (20-40%)", "높음 (40-80%)", "매우 높음 (>80%)", "자료 없음"]);
  });
});
