import { afterEach, beforeEach, expect, test } from "@jest/globals";
import { act } from "react-dom/test-utils";
import { createRoot } from "react-dom/client";
import type { Root } from "react-dom/client";

import type { VietnamElementMetaBundleV124, VietnamEntityV124 } from "../../../data/vietnam/vietnamTypesV124";
import { registerFieldDefinitionsV162 } from "../../../data/visualization/wideRecordsV162";
import CarbonMarketRegionsV146 from "./CarbonMarketRegionsV146";
import c022Fixture from "../../../data/visualization/__fixtures__/c022V162.json";

(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

/**
 * C-022's screen on the 2026-09-30 wide delivery: the province chart used to
 * read old 속성20…22 attribute rows (facilityRegionsV146.ts) that do not
 * exist in the new template, so it rendered nothing. This pins the fixed
 * behaviour on three real provinces (An Giang, Bac Ninh, Cao Bang) plus one
 * non-region record from the staged pack.
 */
registerFieldDefinitionsV162(
  "VNM",
  "C-022",
  c022Fixture.fieldDefinitions as VietnamElementMetaBundleV124["fieldDefinitions"]
);
const entities = c022Fixture.entities as unknown as VietnamEntityV124[];

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

test("wide delivery: renders one province bar per record, sorted by facility count", () => {
  act(() => root.render(<CarbonMarketRegionsV146 elementId="C-022" entities={entities} />));
  const section = container.querySelector('[data-testid="carbon-market-regions-v146"]')!;
  expect(section).not.toBeNull();
  const bars = [...section.querySelectorAll(".detail146-chart li span")].map((el) => el.textContent);
  // Bac Ninh (199) > An Giang (27) > Cao Bang (7); the region name goes
  // through the shared "한글명 (현지명)" region-text helper.
  expect(bars).toEqual(["박닌 (Bac Ninh)", "안장 (An Giang)", "까오방 (Cao Bang)"]);
  expect(section.textContent).toContain("199");
  expect(section.textContent).toContain("27");
  expect(section.textContent).toContain("7");
  // The delivered record id is never shown on screen.
  expect(section.textContent).not.toContain("VNM-C022-INV");
});

test("wide delivery: picking a province shows its four annex-category breakdown, checked against the total", () => {
  act(() => root.render(<CarbonMarketRegionsV146 elementId="C-022" entities={entities} />));
  const selects = [...container.querySelectorAll("select")];
  const region = selects[1];
  act(() => {
    const setter = Object.getOwnPropertyDescriptor(window.HTMLSelectElement.prototype, "value")!.set!;
    setter.call(region, [...region.options].find((option) => (option.textContent || "").includes("An Giang"))!.value);
    region.dispatchEvent(new Event("change", { bubbles: true }));
  });
  const figure = container.querySelector(".detail146-chart")!;
  expect(figure.getAttribute("data-analysis-block")).toBe("category-bar");
  expect(figure.textContent).toContain("An Giang");
  expect(container.textContent).toContain("An Giang");
  expect(container.textContent).toContain("의 대상 시설은 27개소입니다");
});
