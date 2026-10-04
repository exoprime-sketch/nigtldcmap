import { afterEach, beforeEach, describe, expect, test } from "@jest/globals";
import { act } from "react-dom/test-utils";
import { createRoot } from "react-dom/client";
import type { Root } from "react-dom/client";
import type { SemanticObservationV125 } from "../../../data/visualization/semanticTypesV125";
import { ObservationValuesTableV146 } from "./SemanticContractRendererV125";

(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

/**
 * V164 R2: the "전년 대비" column of the values table. A change of exactly zero
 * read "0 1000 ha"; it says "변화 없음". The rows are test inputs shaped like the
 * delivered observations (one series, adjacent years).
 */
const row = (year: number, value: number, unit = "%") =>
  ({
    elementId: "A-006",
    recordId: `r-${year}`,
    indicatorId: "unemployment",
    countryIso3: "VNM",
    year,
    value,
    seriesKey: "ilo",
    unit,
    semanticMeasure: { key: "total", labelKo: "전체 실업률", unit, unitFamily: "percent" },
    dimensionLabels: { category: "ILO 모델추정", year: String(year) },
    dimensions: {},
    displayLabel: "전체 실업률 · ILO 모델추정",
  }) as unknown as SemanticObservationV125;

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

const lastCell = () => host.querySelector("tbody tr:last-child td:last-child")?.textContent;

describe("ObservationValuesTableV146 previous-year column (R2)", () => {
  test("a change of exactly zero reads 변화 없음", () => {
    const now = row(2025, 1.523) as never;
    act(() => root.render(<ObservationValuesTableV146 rows={[now]} context={[row(2024, 1.523), row(2025, 1.523)]} title="2025 · 항목별 값" />));
    expect(lastCell()).toBe("변화 없음");
  });

  test("a change that is not zero is signed and has its unit", () => {
    const now = row(2025, 1.523) as never;
    act(() => root.render(<ObservationValuesTableV146 rows={[now]} context={[row(2024, 1.602), row(2025, 1.523)]} title="2025 · 항목별 값" />));
    expect(lastCell()).toContain("-0.079");
    expect(lastCell()).not.toContain("변화 없음");
  });

  test("a row with no previous year says there is nothing to compare", () => {
    const now = row(2025, 1.523) as never;
    act(() => root.render(<ObservationValuesTableV146 rows={[now]} context={[row(2025, 1.523)]} title="2025 · 항목별 값" />));
    expect(lastCell()).toBe("비교 자료 없음");
  });

  test("a table without context has no change column", () => {
    const now = row(2025, 1.523) as never;
    act(() => root.render(<ObservationValuesTableV146 rows={[now]} title="2025 · 항목별 값" />));
    expect(Array.from(host.querySelectorAll("thead th")).map((cell) => cell.textContent)).toEqual(["항목", "값", "단위", "시점"]);
  });
});
