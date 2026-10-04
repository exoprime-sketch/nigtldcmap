import { afterEach, beforeEach, describe, expect, test } from "@jest/globals";
import { act } from "react-dom/test-utils";
import { createRoot } from "react-dom/client";
import type { Root } from "react-dom/client";
import type { VietnamEntityV124 } from "../../../data/vietnam/vietnamTypesV124";
import { EvidenceMatrixV125 } from "./SemanticContractRendererV125";

(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

/**
 * V164-3: the evidence table prints only the columns some row fills and lists a
 * row once when every cell repeats a row already listed. The rows below are
 * test inputs shaped like A-013's (one NDC action per source document, the
 * compiler's serial number at the head of the note).
 */
function ndcRow(id: number, serial: number, sector: string, text: string): VietnamEntityV124 {
  return {
    elementId: "A-013",
    recordId: `a-013-${id}`,
    entityType: "entity",
    name: "1.2",
    normalizedAttributes: { field_890a80ed: "1.2", typeOfInformation: "Action" },
    rawAttributes: {},
    note: `해당 없음 — 본 레코드에는 38대 기후기술을 지목할 근거가 없어 코드를 부여하지 않음(억지 매핑 금지 원칙). [연계 일련번호: ${serial}] SDG1 · 세부목표 1.2 · 부문: ${sector} · 기후대응: Adaptation · 상태: Future · NDC 원문: ${text}`,
    provenance: {},
  } as unknown as VietnamEntityV124;
}

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

function render(entities: VietnamEntityV124[]): void {
  act(() => root.render(<EvidenceMatrixV125 rows={[]} entities={entities} />));
}

const headers = () => Array.from(host.querySelectorAll("thead th")).map((cell) => cell.textContent);

describe("EvidenceMatrixV125 (V164)", () => {
  test("shows a row once when only the compiler's serial number tells it from another", () => {
    const text = "Viet Nam has determined that climate change adaptation must be carried out in a focussed manner.";
    render([ndcRow(1, 159, "Energy Efficiency", text), ndcRow(2, 350, "Energy Efficiency", text), ndcRow(3, 158, "Renewable Energy", text)]);
    const rows = host.querySelectorAll("tbody tr");
    expect(rows).toHaveLength(2);
    // the sector, a known classification, reads in Korean; the source sentence is as delivered
    expect(host.textContent).toContain("부문: 에너지 효율");
    expect(host.textContent).toContain("부문: 재생에너지");
    expect(host.textContent).toContain(text);
    expect(host.querySelector("[data-testid='evidence-matrix-repeats-v164']")?.textContent).toContain("1건은 한 번만");
    expect(host.querySelector("[role='status']")?.textContent).toContain("전체 2건");
  });

  test("keeps every row whose text differs, and states no repeat when there is none", () => {
    render([ndcRow(1, 1, "Agriculture", "Rural poverty is lowered by 2%/year."), ndcRow(2, 2, "Agriculture", "Rural poverty is lowered by 4%/year.")]);
    expect(host.querySelectorAll("tbody tr")).toHaveLength(2);
    expect(host.querySelector("[data-testid='evidence-matrix-repeats-v164']")).toBeNull();
  });

  test("prints no column that no row fills: not the basis, not the unit, not a lone group", () => {
    render([ndcRow(1, 1, "Agriculture", "A."), ndcRow(2, 2, "Waste", "B.")]);
    expect(headers()).toEqual(["항목", "내용·값"]);
    expect(host.querySelectorAll("tbody tr:first-child > *")).toHaveLength(2);
  });

  test("V164-R3 (A-013): a two-column table says so, so its text is not held to a 760px minimum width and clipped", () => {
    render([ndcRow(1, 1, "Agriculture", "A."), ndcRow(2, 2, "Waste", "B.")]);
    const table = host.querySelector("table.sv125-evidence-matrix");
    expect(table?.getAttribute("data-columns")).toBe("2");
    expect(host.querySelectorAll("thead th")).toHaveLength(Number(table?.getAttribute("data-columns")));
  });
});
