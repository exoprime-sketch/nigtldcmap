import { expect, test } from "@jest/globals";
import { applyIndicatorHighlightV159 } from "./highlightIndicatorsV159";

function buildRoot(): HTMLElement {
  const root = document.createElement("div");
  root.innerHTML = `
    <span data-indicator-id="A-001_score">a</span>
    <span data-indicator-id="A-001_missing">b</span>
    <span>no id</span>
  `;
  return root;
}

test("returns 0 and does nothing for a null root", () => {
  expect(applyIndicatorHighlightV159(null, ["A-001_score"])).toBe(0);
});

test("toggles is-highlighted only on descendants whose data-indicator-id matches, and reports the count", () => {
  const root = buildRoot();
  const matched = applyIndicatorHighlightV159(root, ["A-001_score"]);
  expect(matched).toBe(1);
  expect(root.querySelector('[data-indicator-id="A-001_score"]')!.classList.contains("is-highlighted")).toBe(true);
  expect(root.querySelector('[data-indicator-id="A-001_missing"]')!.classList.contains("is-highlighted")).toBe(false);
  expect(root.getAttribute("data-highlight-indicators")).toBe("A-001_score");
});

test("clearing with an empty id list removes every highlight and the root attribute", () => {
  const root = buildRoot();
  applyIndicatorHighlightV159(root, ["A-001_score"]);
  const matched = applyIndicatorHighlightV159(root, []);
  expect(matched).toBe(0);
  expect(root.querySelector('[data-indicator-id="A-001_score"]')!.classList.contains("is-highlighted")).toBe(false);
  expect(root.hasAttribute("data-highlight-indicators")).toBe(false);
});
