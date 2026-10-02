import { afterEach, beforeEach, expect, test } from "@jest/globals";
import { act } from "react-dom/test-utils";
import { createRoot } from "react-dom/client";
import type { Root } from "react-dom/client";

import type { VietnamElementMetaBundleV124, VietnamEntityV124 } from "../../../data/vietnam/vietnamTypesV124";
import { registerFieldDefinitionsV162 } from "../../../data/visualization/wideRecordsV162";
import EnergyOutlookPlanAnalysisV141 from "./EnergyOutlookPlanAnalysisV141";
import c018Fixture from "../../../data/visualization/__fixtures__/c018V162.json";

(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

/**
 * C-018's screen on the 2026-09-30 wide delivery: the plan used to read the
 * old 속성1…23 attribute rows (cTemplateRowsV141.ts), which the new sheet no
 * longer has, so the old parser produced no capacity/demand items. These
 * fixture entities are a real subset of the staged pack: two capacity years
 * for coal and the national total, one demand pair (a sales projection and a
 * peak-demand row for 2030), one derived CAGR row, one RE-share target, the
 * PDP8 plan-document metadata row, one IEA outlook item and one local-survey
 * finding - trimmed to their non-empty attributes.
 */
registerFieldDefinitionsV162(
  "VNM",
  "C-018",
  c018Fixture.fieldDefinitions as VietnamElementMetaBundleV124["fieldDefinitions"]
);
const wideEntities = c018Fixture.entities as unknown as VietnamEntityV124[];

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

function draw(entities: VietnamEntityV124[], initialYear?: number) {
  act(() => root.render(<EnergyOutlookPlanAnalysisV141 entities={entities} initialYear={initialYear} />));
  return container;
}

test("wide delivery: the 2030 capacity bar reads the stated MW range, and 총 설비 is excluded from the bars", () => {
  const view = draw(wideEntities, 2030);
  const section = view.querySelector('[data-testid="energy-outlook-plan-v141"]')!;
  expect(section).not.toBeNull();
  const bars = [...view.querySelectorAll(".eop141__bars li .eop141__label")].map((el) => el.textContent);
  expect(bars).toEqual(["석탄화력"]);
  expect(view.querySelector(".eop141__bars")!.textContent).toContain("31,055");
  // The full plan document names both years; the total row appears there, not in the bars.
  const table = view.querySelector('[data-testid="energy-outlook-plan-table-v141"]')!;
  expect(table.textContent).toContain("총 설비(국내 수요용, 수출 제외)");
  expect(table.textContent).toContain("183,291~236,363");
  expect(table.textContent).toContain("774,503~838,681");
});

test("wide delivery: switching to 2050 shows the coal row's stated zero, not a missing bar", () => {
  const view = draw(wideEntities, 2050);
  const bars = [...view.querySelectorAll(".eop141__bars li")];
  expect(bars).toHaveLength(1);
  expect(bars[0].textContent).toContain("석탄화력");
  expect(bars[0].textContent).toContain("0");
});

test("wide delivery: the demand table reads the sales, peak and RE-share rows by their own block, not the old template", () => {
  const view = draw(wideEntities, 2030);
  const demand = view.querySelector('[data-testid="energy-outlook-demand-v141"]')!;
  expect(demand.textContent).toContain("상업전력 판매량 전망");
  expect(demand.textContent).toContain("500.4~557.8");
  expect(demand.textContent).toContain("최대전력(피크수요) 전망");
  expect(demand.textContent).toContain("89,655~99,934");
  expect(demand.textContent).toContain("재생에너지 발전 비중 목표(수력 제외)");
  expect(demand.textContent).toContain("28~36");
});

test("wide delivery: the CAGR row shows the delivered range even when 하한 > 상한, and states its own basis", () => {
  const view = draw(wideEntities, 2030);
  const growth = view.querySelector('[data-testid="energy-outlook-derived-growth-v142"]')!;
  expect(growth).not.toBeNull();
  expect(growth.textContent).toContain("상업전력 판매량");
  // Delivered as 하한 4.63 / 상한 4.62: the smaller value still prints first.
  expect(growth.textContent).toContain("4.62~4.63%/년");
  expect(growth.textContent).toContain("500.4→1,237.7(하한)");
});

test("wide delivery: the policy table carries the plan document, an IEA outlook item and a local-survey finding, with no delivered file name", () => {
  const view = draw(wideEntities, 2030);
  const header = view.querySelector(".pps132-heading")!;
  expect(header.textContent).toContain("Quyết định 768/QĐ-TTg, Điều chỉnh Quy hoạch phát triển điện lực quốc gia 2021–2030, tầm nhìn 2050");
  expect(header.textContent).toContain("베트남 총리(승인·공포) · 산업무역부(작성)");

  const policy = view.querySelector('[data-testid="energy-outlook-regulations-v141"]')!;
  expect(policy.textContent).toContain("전망문서 정책 가정");
  expect(policy.textContent).toContain("2030 풍력 24 GW·수력 7 GW");
  expect(policy.textContent).toContain("현장 확인 · Onshore & nearshore wind");
  expect(policy.textContent).toContain("26,066–38,029 MW by 2030");
  // The delivered working-file name behind the local-survey row is never shown.
  expect(view.textContent).not.toContain("FieldSurveyItems");
  expect(view.textContent).not.toContain(".xlsx");
});

test("wide delivery: price regulations are absent from the new sheet, so the section does not render", () => {
  const view = draw(wideEntities, 2030);
  expect(view.querySelector('[data-testid="energy-outlook-prices-v141"]')).toBeNull();
});

test("old template: a legacy provider with no wide field definitions still renders through the attribute-row reader", () => {
  // A different elementId from the wide fixtures above, so this entity's
  // country+element pair has no wide field definitions registered and
  // `wideRecordsOfEntitiesV162` falls through to [] as it would for any
  // provider still on the old template.
  const legacyEntity = (overrides: Record<string, unknown>): VietnamEntityV124 =>
    ({
      recordId: `legacy-${Math.random()}`,
      elementId: "C-018-LEGACY-TEST",
      indicatorId: "C-018_generation_capacity_plan",
      countryIso3: "VNM",
      name: "석탄화력",
      note: "",
      normalizedAttributes: {
        "속성1_레코드명": "석탄화력",
        "속성3_값": 31055,
        "속성4_시점": "2030",
        "속성19_원문URL": "https://example.org/768-ttg.pdf",
        ...overrides,
      },
    } as unknown as VietnamEntityV124);

  const view = draw([legacyEntity({})]);
  const section = view.querySelector('[data-testid="energy-outlook-plan-v141"]')!;
  expect(section).not.toBeNull();
  const bars = [...view.querySelectorAll(".eop141__bars li .eop141__label")].map((el) => el.textContent);
  expect(bars).toEqual(["석탄화력"]);
  expect(view.querySelector(".eop141__bars")!.textContent).toContain("31,055");
});
