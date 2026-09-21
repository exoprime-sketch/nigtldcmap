import { afterEach, beforeEach, expect, test } from "@jest/globals";
import { act } from "react-dom/test-utils";
import { createRoot } from "react-dom/client";
import type { Root } from "react-dom/client";
import { readFileSync } from "fs";
import { resolve } from "path";
import type { VietnamEntityV124 } from "../../../data/vietnam/vietnamTypesV124";
import CooperationChecklistAnalysisV141 from "./CooperationChecklistAnalysisV141";
import { InitiativeDescriptionsV153, PolicyDocumentDescriptionV153 } from "./PolicyDescriptionV153";

(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
const DATA = resolve(__dirname, "../../../../public/data/vietnam/v2/downloads");
const entitiesOf = (elementId: string): VietnamEntityV124[] =>
  JSON.parse(readFileSync(resolve(DATA, `${elementId.toLowerCase()}.json`), "utf8")).entities;

let container: HTMLDivElement;
let root: Root;
beforeEach(() => { container = document.createElement("div"); document.body.appendChild(container); root = createRoot(container); });
afterEach(() => { act(() => root.unmount()); container.remove(); });

test("C-008 lists every initiative and treaty as a labelled card, description first and the formal name in brackets", () => {
  act(() => root.render(<CooperationChecklistAnalysisV141 elementId="C-008" entities={entitiesOf("C-008")} />));
  const section = container.querySelector('[data-testid="initiative-descriptions-v153"]')!;
  expect(section).not.toBeNull();
  const cards = section.querySelectorAll('[data-testid="policy-description-v153"]');
  expect(cards).toHaveLength(23);
  const jetp = section.querySelector('[data-policy-key="jetp"]')!;
  expect(jetp.querySelector(".pdc153__label")!.textContent).toMatch(/^플랫폼 편집 설명 · 출처 \d+건 · \d{4}-\d{2}-\d{2} 확인$/u);
  const title = jetp.querySelector(".pdc153__title")!.textContent!;
  expect(title.indexOf("석탄")).toBeLessThan(title.indexOf("(Just Energy Transition Partnership"));
  expect(title).toContain("JETP)");
  expect(jetp.querySelectorAll(".pdc153__points li").length).toBeGreaterThanOrEqual(2);
  expect(jetp.querySelector(".pdc153__sources a")!.getAttribute("href")).toMatch(/^https:\/\//u);
  expect(jetp.querySelector(".pdc153__sources a")!.getAttribute("rel")).toBe("noreferrer");
  // The delivery's comparison table is untouched above the cards.
  expect(container.querySelector('[data-testid="cooperation-initiatives-v141"]')).not.toBeNull();
  expect(container.querySelector('[data-testid="cooperation-initiatives-v141"]')!.querySelector('[data-testid="policy-description-v153"]')).toBeNull();
});

test("C-007 gets no initiative section", () => {
  act(() => root.render(<InitiativeDescriptionsV153 elementId="C-007" />));
  expect(container.innerHTML).toBe("");
});

test("a document card renders only for a matched name and never leaks a pending sentence", () => {
  act(() => root.render(<PolicyDocumentDescriptionV153 elementId="C-009" name="현행 여부" />));
  expect(container.innerHTML).toBe("");
  act(() => root.render(<PolicyDocumentDescriptionV153 elementId="C-009" name="Decree 06/2022/NĐ-CP" />));
  const card = container.querySelector('[data-testid="policy-description-v153"]')!;
  expect(card.getAttribute("data-policy-status")).toBe("verified");
  expect(card.textContent).not.toContain("설명 준비 중");
  expect(card.textContent).not.toMatch(/시행\(발효\)일|보완항목|raw|\.pdf/u);
});
