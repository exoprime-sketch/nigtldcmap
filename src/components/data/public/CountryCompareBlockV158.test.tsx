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

const withSource = (row: CountryCompareSeriesV158, sourceOrg: string): CountryCompareSeriesV158 => ({
  ...row,
  sourceOrg,
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

  test("no shared year, both matched: each country's own latest value with its year", () => {
    const view = draw([
      vietnam([
        { year: 2022, value: 410 },
        { year: 2023, value: 429 },
      ]),
      bangladesh([{ year: 2024, value: 451 }]),
    ]);
    const block = view.querySelector('[data-testid="country-compare-v158"]');
    expect(block?.getAttribute("data-state")).toBe("latest-each");
    const latest = view.querySelector('[data-testid="country-compare-latest-each-v158"]');
    expect(latest?.textContent).toBe("베트남 429 (2023) · 방글라데시 451 (2024)");
    expect(view.textContent).toContain(
      "비교 국가에 공통 연도가 없어 각 나라의 최신 값을 연도와 함께 표시합니다"
    );
    // Not a bar/line render - no shared axis exists to draw.
    expect(view.querySelector('[data-testid="country-compare-bars-v158"]')).toBeNull();
    expect(view.querySelector('[data-testid="country-compare-lines-v158"]')).toBeNull();
  });

  test("no shared year and only one country actually has a value: still nothing", () => {
    const view = draw([
      vietnam([{ year: 2023, value: 429 }]),
      bangladesh([{ year: 2024, value: null }]),
    ]);
    expect(view.innerHTML).toBe("");
  });

  test("differing sources are named in a footnote", () => {
    const view = draw([
      withSource(vietnam([{ year: 2023, value: 429 }]), "World Bank"),
      withSource(bangladesh([{ year: 2024, value: 451 }]), "World Bank WITS"),
    ]);
    const note = view.querySelector('[data-testid="country-compare-source-note-v158"]');
    expect(note?.textContent).toContain("베트남 World Bank");
    expect(note?.textContent).toContain("방글라데시 World Bank WITS");
  });

  test("same source: no footnote", () => {
    const view = draw([
      withSource(vietnam([{ year: 2024, value: 468 }]), "World Bank"),
      withSource(bangladesh([{ year: 2024, value: 451 }]), "World Bank"),
    ]);
    expect(view.querySelector('[data-testid="country-compare-source-note-v158"]')).toBeNull();
  });

  test("a country with no stated source: no footnote (nothing half-stated)", () => {
    const view = draw([
      withSource(vietnam([{ year: 2024, value: 468 }]), "World Bank"),
      bangladesh([{ year: 2024, value: 451 }]),
    ]);
    expect(view.querySelector('[data-testid="country-compare-source-note-v158"]')).toBeNull();
  });
});
