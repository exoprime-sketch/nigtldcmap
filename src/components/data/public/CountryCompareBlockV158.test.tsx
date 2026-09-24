import { afterEach, beforeEach, describe, expect, test } from "@jest/globals";
import { act } from "react-dom/test-utils";
import { createRoot } from "react-dom/client";
import type { Root } from "react-dom/client";

import CountryCompareBlockV158 from "./CountryCompareBlockV158";
import type { CountryCompareSeriesV158 } from "./CountryCompareBlockV158";

/**
 * The comparison block ships before a second country does, so the case that
 * matters most is the empty one: with Vietnam alone it must add nothing to a
 * detail page. The rest pins the rules a comparison has to follow - the shared
 * year, the shape the data picks, and what happens when the units differ.
 */
const compareKey = {
  indicatorId: "A-003_gdp_current_usd",
  unit: "USD",
  yearRule: "latest-common",
};

type Point = { year: number; value: number | null };

const vietnam = (points: Point[]): CountryCompareSeriesV158 => ({
  countryIso3: "VNM",
  countryNameKo: "베트남",
  unit: "USD",
  points,
});

const bangladesh = (points: Point[], unit = "USD"): CountryCompareSeriesV158 => ({
  countryIso3: "BGD",
  countryNameKo: "방글라데시",
  unit,
  points,
});

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

function draw(series: CountryCompareSeriesV158[], mode?: "grouped-bars" | "multi-line") {
  act(() => {
    root.render(
      <CountryCompareBlockV158
        elementId="A-003"
        title="GDP 비교"
        compareKey={compareKey}
        series={series}
        mode={mode}
      />
    );
  });
  return container;
}

describe("CountryCompareBlockV158", () => {
  test("renders nothing while only one country is published", () => {
    expect(draw([vietnam([{ year: 2023, value: 429 }, { year: 2024, value: 468 }])]).innerHTML).toBe(
      ""
    );
  });

  test("renders nothing when no country has a value", () => {
    expect(
      draw([vietnam([{ year: 2024, value: null }]), bangladesh([{ year: 2024, value: null }])])
        .innerHTML
    ).toBe("");
  });

  test("one shared year reads as bars on that year", () => {
    const view = draw([
      vietnam([{ year: 2023, value: 429 }, { year: 2024, value: 468 }]),
      bangladesh([{ year: 2024, value: 451 }]),
    ]);
    const block = view.querySelector('[data-testid="country-compare-v158"]');
    expect(block?.getAttribute("data-state")).toBe("grouped-bars");
    expect(view.querySelector('[data-testid="country-compare-bars-v158"]')).toBeTruthy();
    // The latest year both countries have, not each country's own latest.
    expect(view.textContent).toContain("2024년 · 단위 USD");
    expect(view.querySelectorAll('[data-testid="country-compare-chip-v158"]').length).toBe(2);
    expect(view.textContent).toContain("451");
    expect(view.textContent).not.toContain("429");
  });

  test("three shared years read as one line per country", () => {
    const view = draw([
      vietnam([
        { year: 2022, value: 410 },
        { year: 2023, value: 429 },
        { year: 2024, value: 468 },
      ]),
      bangladesh([
        { year: 2022, value: 416 },
        { year: 2023, value: 437 },
        { year: 2024, value: 451 },
      ]),
    ]);
    const block = view.querySelector('[data-testid="country-compare-v158"]');
    expect(block?.getAttribute("data-state")).toBe("multi-line");
    const chart = view.querySelector('[data-testid="country-compare-lines-v158"]');
    expect(chart?.querySelectorAll("polyline").length).toBe(2);
    expect(chart?.querySelector('polyline[data-country="BGD"]')).toBeTruthy();
  });

  test("a country stating another unit is named, not drawn", () => {
    const view = draw([
      vietnam([{ year: 2024, value: 468 }]),
      bangladesh([{ year: 2024, value: 451 }], "BDT"),
    ]);
    const block = view.querySelector('[data-testid="country-compare-v158"]');
    expect(block?.getAttribute("data-state")).toBe("unit-mismatch");
    expect(
      view.querySelector('[data-testid="country-compare-unit-note-v158"]')?.textContent
    ).toContain("방글라데시 BDT");
    expect(view.querySelector('[data-testid="country-compare-bars-v158"]')).toBeNull();
  });

  test("the compare indicator and the year rule are stated on screen", () => {
    const view = draw([
      vietnam([{ year: 2024, value: 468 }]),
      bangladesh([{ year: 2024, value: 451 }]),
    ]);
    expect(view.textContent).toContain("A-003_gdp_current_usd");
    expect(view.textContent).toContain("두 국가가 모두 가진 최신 연도");
  });
});
