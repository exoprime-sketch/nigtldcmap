import { afterEach, beforeEach, describe, expect, test } from "@jest/globals";
import { act } from "react-dom/test-utils";
import { createRoot } from "react-dom/client";
import type { Root } from "react-dom/client";

import CompositionStackV153, { topicParticleV164, withParticleV164 } from "./CompositionStackV153";
import type { CompositionStackSeriesV153 } from "./CompositionStackV153";
import { LEGEND_FOLD_AFTER_V164, LEGEND_FOLD_SHOWN_V164, StackedAreaLegendV164, legendVisibleCountV164 } from "../../charts/StackedAreaChartV153";
import type { StackedAreaSeriesV153 } from "../../charts/StackedAreaChartV153";

/**
 * Review 164: the stacked area was painted with hatches and no key, so a reader
 * could not tell which area was which gas, sector or technology; and the notes
 * beside it wrote "은(는)" / "와(과)" instead of the particle the word takes.
 */
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

const series = (count: number): StackedAreaSeriesV153[] =>
  Array.from({ length: count }, (_, index) => ({
    key: `s${index}`,
    label: `계열 ${index + 1}`,
    color: "#176b57",
    pattern: "diagonal" as const,
  }));

const stackSource = (labels: string[]): CompositionStackSeriesV153[] =>
  labels.map((label, index) => ({
    key: `k${index}`,
    label,
    points: [2019, 2020, 2021, 2022].map((year, step) => ({ year, value: 10 + index * 5 + step })),
  }));

function drawStack(overlapExcluded: string[] = [], extra: CompositionStackSeriesV153[] = []) {
  act(() => {
    root.render(
      <CompositionStackV153
        elementId="A-010"
        headingId="h-a010"
        title="가스별 배출량"
        series={[...stackSource(["이산화탄소", "메탄", "아산화질소"]), ...extra]}
        unit="Mt"
        subject="가스"
        quantity="배출량"
        selectedYear={null}
        onSelectYear={() => undefined}
        panelClassName="panel"
        headingClassName="head"
        overlapExcluded={overlapExcluded}
      />,
    );
  });
}

describe("legend of a stacked area", () => {
  test("every stacked series is named once, in stack order", () => {
    drawStack();
    const legend = container.querySelector('[data-testid="a-010-stack-legend-v164"]');
    expect(legend).not.toBeNull();
    const names = Array.from(legend!.querySelectorAll("li span")).map((node) => node.textContent);
    expect(names).toEqual(["이산화탄소", "메탄", "아산화질소"]);
    expect(legend!.querySelectorAll("li i[data-pattern]")).toHaveLength(3);
  });

  test("a short legend has no fold button", () => {
    act(() => root.render(<StackedAreaLegendV164 series={series(LEGEND_FOLD_AFTER_V164)} />));
    expect(container.querySelectorAll("li")).toHaveLength(LEGEND_FOLD_AFTER_V164);
    expect(container.querySelector("button")).toBeNull();
  });

  test("a legend past ten entries folds to eight and opens on request", () => {
    act(() => root.render(<StackedAreaLegendV164 series={series(14)} />));
    expect(container.querySelectorAll("li")).toHaveLength(LEGEND_FOLD_SHOWN_V164);
    const button = container.querySelector("button")!;
    expect(button.textContent).toBe("나머지 6개 보기");
    expect(button.getAttribute("aria-expanded")).toBe("false");
    act(() => button.dispatchEvent(new MouseEvent("click", { bubbles: true })));
    expect(container.querySelectorAll("li")).toHaveLength(14);
    expect(container.querySelector("button")!.textContent).toBe("범례 접기");
    expect(container.querySelector("button")!.getAttribute("aria-expanded")).toBe("true");
  });

  test("visible count follows the fold rule", () => {
    expect(legendVisibleCountV164(10, false)).toBe(10);
    expect(legendVisibleCountV164(11, false)).toBe(LEGEND_FOLD_SHOWN_V164);
    expect(legendVisibleCountV164(11, true)).toBe(11);
  });
});

describe("particles in the notes of a stacked area", () => {
  test.each([
    ["가스", "는", "와"],
    ["부문", "은", "과"],
    ["기술", "은", "과"],
    ["연료", "는", "와"],
    ["자원", "은", "과"],
  ])("%s takes %s / %s", (word, topic, joint) => {
    expect(topicParticleV164(word)).toBe(topic);
    expect(withParticleV164(word)).toBe(joint);
  });

  test("the overlap note names the totals with a real particle", () => {
    drawStack(["총배출량"]);
    const note = container.querySelector('[data-testid="composition-stack-overlap-v164"]');
    expect(note?.textContent).toContain("합계·소계 가스는 구성 가스와 겹치므로");
    expect(note?.textContent).not.toMatch(/은\(는\)|와\(과\)|을\(를\)/u);
  });

  test("the negative-value note takes the particle too", () => {
    drawStack([], [{ key: "sink", label: "흡수원", points: [{ year: 2019, value: -3 }, { year: 2020, value: -4 }] }]);
    const note = container.querySelector('[data-testid="composition-stack-excluded-v153"]');
    expect(note?.textContent).toContain("포함하는 가스는 면적으로");
  });
});
