import { afterEach, beforeEach, expect, test } from "@jest/globals";
import { act } from "react-dom/test-utils";
import { createRoot } from "react-dom/client";
import type { Root } from "react-dom/client";
import DecisionPointsV159 from "./DecisionPointsV159";
import type { DecisionPointV159 } from "../../../data/structure/decisionPointsV159";

(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

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

test("renders nothing when there are no points", () => {
  act(() => root.render(<DecisionPointsV159 displayType="U1" points={[]} />));
  expect(container.querySelector('[data-testid="decision-points-v159"]')).toBeNull();
});

test("renders a heading, one row per point, and never carries data-analysis-block", () => {
  const points: DecisionPointV159[] = [
    { key: "latest-value", label: "최신값·연도", value: "55 점 (2024년)" },
    { key: "five-year-direction", label: "최근 5년 방향", value: "증가", detail: "2018년 40 점 → 2024년 55 점" },
  ];
  act(() => root.render(<DecisionPointsV159 displayType="U1" points={points} />));
  const section = container.querySelector('[data-testid="decision-points-v159"]')!;
  expect(section).not.toBeNull();
  expect(section.getAttribute("data-display-type")).toBe("U1");
  expect(section.hasAttribute("data-analysis-block")).toBe(false);
  expect(section.querySelector("h3")!.textContent).toBe("판단 포인트");
  const rows = section.querySelectorAll('[data-testid="decision-points-v159-row"]');
  expect(rows).toHaveLength(2);
  expect(rows[1].querySelector("small")!.textContent).toBe("2018년 40 점 → 2024년 55 점");
});
