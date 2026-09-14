import { afterEach, beforeEach, expect, test } from "@jest/globals";
import { act } from "react-dom/test-utils";
import { createRoot } from "react-dom/client";
import type { Root } from "react-dom/client";
import type { VietnamEntityV124 } from "../../../data/vietnam/vietnamTypesV124";
import PublicRawDataTablesV126 from "./PublicRawDataTablesV126";

(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
let container: HTMLDivElement;
let root: Root;
beforeEach(() => { container = document.createElement("div"); document.body.appendChild(container); root = createRoot(container); });
afterEach(() => { act(() => root.unmount()); container.remove(); });

function rows(count: number): VietnamEntityV124[] {
  return Array.from({ length: count }, (_, index) => ({
    recordId: `test-${index}`, elementId: "E-019", name: `기관 ${index + 1}`,
    entityType: "기관", normalizedAttributes: {}, rawAttributes: {},
    provenance: { sourceOrg: "시험 기관", sourceUrl: "https://example.org" },
  } as VietnamEntityV124));
}
function render(entities: VietnamEntityV124[]) {
  act(() => root.render(<PublicRawDataTablesV126 elementId="E-019" observations={[]} entities={entities} detailTemplate="partner" />));
}
function toggle(open: boolean) {
  const details = container.querySelector("details")!;
  act(() => { details.open = open; details.dispatchEvent(new Event("toggle")); });
}
test("large closed tables allocate no rows; pagination preserves every source row", () => {
  const entities = rows(501); render(entities);
  expect(container.querySelectorAll("tbody tr")).toHaveLength(0);
  expect(container.querySelector("summary")?.textContent).toContain("501");
  toggle(true);
  const seen: string[] = [];
  for (let page = 0; page < 3; page += 1) {
    const displayed = [...container.querySelectorAll("tbody tr")];
    expect(displayed.length).toBeLessThanOrEqual(200);
    seen.push(...displayed.map(row => row.querySelector("td")!.textContent!));
    const buttons = container.querySelectorAll<HTMLButtonElement>("nav button");
    expect(buttons[0].disabled).toBe(page === 0);
    expect(buttons[1].disabled).toBe(page === 2);
    if (page < 2) act(() => buttons[1].click());
  }
  expect(seen).toEqual(entities.map(row => row.name));
  toggle(false);
  expect(container.querySelectorAll("tbody tr")).toHaveLength(0);
});
test("small tables retain their complete existing table representation", () => {
  render(rows(2));
  expect(container.querySelectorAll("tbody tr")).toHaveLength(2);
  expect(container.querySelector("nav")).toBeNull();
});
