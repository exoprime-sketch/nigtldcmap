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
