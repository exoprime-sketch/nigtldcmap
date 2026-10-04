import { afterEach, beforeEach, expect, test } from "@jest/globals";
import { act } from "react-dom/test-utils";
import { createRoot } from "react-dom/client";
import type { Root } from "react-dom/client";
import type { CardSummaryV140 } from "../../data/cardSummariesV140";
import FinderCardSummaryV140 from "./FinderCardSummaryV140";

(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

function factsCard(overrides: Partial<CardSummaryV140> = {}): CardSummaryV140 {
  return {
    elementId: "C-016",
    title: "재생에너지 발주 및 확대 계획",
    kind: "facts",
    headline: { value: "92건", label: "항목 · 2025–2040년" },
    preview: {
      facts: [
        { label: "자료 공표 상태 — 국가 공식 재생에너지 설치용량", value: "" },
        { label: "자료 공표 상태 — 2026년 추가 입찰 패키지 1건", value: "" },
        { label: "2023 합계", value: "" },
      ],
      more: 89,
    },
    period: "2025–2040년",
    provider: "Power Division, MPEMR",
    selection: null,
    basis: { unit: "항목", rule: "항목 1건 = 원천 1행" },
    measure: null,
    mapConnected: false,
    downloadable: false,
    ...overrides,
  };
}

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

test("V163 (5ii): a fact that only repeats the internal '자료 공표 상태' note is dropped, other facts stay", () => {
  act(() => root.render(<FinderCardSummaryV140 summary={factsCard()} />));
  expect(container.textContent).not.toContain("자료 공표 상태");
  expect(container.textContent).toContain("2023 합계");
  expect(container.querySelectorAll(".fcs140-facts li").length).toBe(2); // "2023 합계" + the "외 N건" line
});

test("V164-4: the rows dropped from the list are counted in the rest (1 listed + 91 = 92건)", () => {
  act(() => root.render(<FinderCardSummaryV140 summary={factsCard()} />));
  expect(container.querySelector(".fcs140-facts__more")?.textContent).toBe("외 91건은 상세에서");
});

test("V164-4: a card whose headline counts rows but whose list counts names says so (B-033: 379건)", () => {
  const summary = factsCard({
    elementId: "B-033",
    headline: { value: "379건", label: "항목 · 2001–2025년" },
    preview: {
      facts: [
        { label: "쿨나 · 2013년", value: "" },
        { label: "쿨나 · 2014년", value: "" },
        { label: "바리살 · 2014년", value: "" },
      ],
      more: 264,
    },
  });
  act(() => root.render(<FinderCardSummaryV140 summary={summary} />));
  const more = container.querySelector(".fcs140-facts__more")?.textContent || "";
  expect(more).toBe("이름 기준 외 264개 (전체 379건, 상세에서 확인)");
  expect(more).not.toContain("외 264건");
});

test("V164-4: a one-series amount card states its scope next to the dataset's total (D-023: 119건)", () => {
  const summary: CardSummaryV140 = {
    ...factsCard({ elementId: "D-023" }),
    kind: "level",
    headline: { value: "4,209만 USD", label: "ODA 및 기후기금 재원 · Adaptation Fund 승인액 합계 · 2026년" },
    preview: { unit: "USD", seriesLabel: "Adaptation Fund 승인액 합계", others: [], note: "단일 시점 값" },
    provenance: { entityCount: 119, indicatorIds: ["a", "b", "c"], headlineIndicatorIds: ["a"] },
  };
  act(() => root.render(<FinderCardSummaryV140 summary={summary} />));
  expect(container.querySelector('[data-testid="finder-card-scope-v164"]')?.textContent).toBe(
    "위 계열 하나의 값입니다 · 같은 자료의 전체 119건은 상세에서"
  );
});
