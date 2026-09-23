import { afterEach, beforeEach, expect, test } from "@jest/globals";
import { act } from "react-dom/test-utils";
import { createRoot } from "react-dom/client";
import type { Root } from "react-dom/client";
import type { DatasetCardSpecV159 } from "../../../data/spec/specTypesV159";
import DatasetCardTitleV159 from "./DatasetCardTitleV159";

(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const CARD: DatasetCardSpecV159 = {
  elementId: "A-001",
  sourceLabel: "ENERGYDATA.INFO",
  baseName: "부패인식지수(CPI)",
  shortDefinitionCard: "전문가·기업인 조사를 바탕으로 각국 공공부문의 부패 수준을 인식 기준으로 정량화한 지수",
  displayType: "U1",
  users: ["금융기관", "기업"],
};

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

test("shows the source line above the base name and the card definition below, at the requested heading level", () => {
  act(() => root.render(<DatasetCardTitleV159 card={CARD} titleAs="h4" />));
  const wrapper = container.querySelector('[data-testid="dataset-card-title-v159"]')!;
  expect(wrapper.querySelector(".dct159-source")!.textContent).toBe("ENERGYDATA.INFO");
  const title = wrapper.querySelector(".dct159-name")!;
  expect(title.tagName).toBe("H4");
  expect(title.textContent).toBe("부패인식지수(CPI)");
  expect(wrapper.querySelector(".dct159-definition")!.textContent).toBe(CARD.shortDefinitionCard);
});

test("defaults to an h3 title when titleAs is not given", () => {
  act(() => root.render(<DatasetCardTitleV159 card={CARD} />));
  expect(container.querySelector(".dct159-name")!.tagName).toBe("H3");
});
