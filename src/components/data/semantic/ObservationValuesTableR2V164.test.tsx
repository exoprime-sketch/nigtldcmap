import { afterEach, beforeEach, describe, expect, test } from "@jest/globals";
import { act } from "react-dom/test-utils";
import { createRoot } from "react-dom/client";
import type { Root } from "react-dom/client";
import type { SemanticObservationV125 } from "../../../data/visualization/semanticTypesV125";
import { amountUnitTextV164, namedRawKeysV164, ObservationValuesTableV146 } from "./SemanticContractRendererV125";

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

/** BGD D-026's statistics: the label ends in the delivery's indicator key and the amounts carry the count unit "건". */
const migaRow = (key: string, value: number, unit = "건") =>
  ({
    elementId: "D-026",
    recordId: `miga-${key}`,
    indicatorId: `D-026_${key}`,
    countryIso3: "BGD",
    year: 2022,
    value,
    seriesKey: key,
    unit,
    semanticMeasure: { key, labelKo: `MIGA 정치적 리스크 보증 · ${key}`, unit, unitFamily: "count" },
    dimensionLabels: {},
    dimensions: {},
    displayLabel: `MIGA 정치적 리스크 보증 · ${key}`,
  }) as unknown as SemanticObservationV125;

describe("namedRawKeysV164 and amountUnitTextV164 (R2, BGD D-026)", () => {
  test("a delivery key with a reviewed name reads as that name; an unknown key is left for the cutter", () => {
    expect(namedRawKeysV164("MIGA 정치적 리스크 보증 · guarantee_amount_total_active")).toBe("MIGA 정치적 리스크 보증 · 보증금액 합계(유효)");
    expect(namedRawKeysV164("MIGA 정치적 리스크 보증 · guarantee_count_total")).toBe("MIGA 정치적 리스크 보증 · 보증 건수(합계)");
    expect(namedRawKeysV164("MIGA 정치적 리스크 보증 · some_unknown_column_key")).toBe("MIGA 정치적 리스크 보증 · some_unknown_column_key");
    expect(namedRawKeysV164("전체 실업률 · ILO 추정치")).toBe("전체 실업률 · ILO 추정치");
  });

  test("an amount under a count unit has no stated unit; a count keeps its unit", () => {
    expect(amountUnitTextV164("MIGA 정치적 리스크 보증 · 보증금액 합계(유효)", "건")).toBe("단위 미기재");
    expect(amountUnitTextV164("MIGA 정치적 리스크 보증 · 보증 건수(유효)", "건")).toBe("건");
    expect(amountUnitTextV164("보증금액 합계", "백만 USD")).toBe("백만 USD");
    expect(amountUnitTextV164("보증금액 합계", "")).toBe("");
  });

  test("the values table lists each statistic under its own label and never prints an amount in 건", () => {
    const rows = [
      migaRow("guarantee_amount_total_active", 1211600000),
      migaRow("guarantee_amount_total_not_active", 720000000),
      migaRow("guarantee_count_active", 7),
      migaRow("guarantee_count_total", 15),
    ] as never[];
    act(() => root.render(<ObservationValuesTableV146 rows={rows} title="2022 · 항목별 값" />));
    const labels = Array.from(host.querySelectorAll("tbody th")).map((cell) => cell.textContent);
    expect(new Set(labels).size).toBe(4);
    expect(labels[0]).toContain("보증금액 합계(유효)");
    const units = Array.from(host.querySelectorAll("tbody tr")).map((tr) => tr.children[2].textContent);
    expect(units).toEqual(["단위 미기재", "단위 미기재", "건", "건"]);
  });
});

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
