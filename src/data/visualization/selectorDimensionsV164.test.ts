import { describe, expect, it } from "@jest/globals";

import { publicDimensionLabelV126 } from "./publicCopyRegistryV126";
import { withoutRawTwinSelectorsV164 } from "./selectorDimensionsV164";

/** V164-3: a selector is offered once; its raw-delivery twin is not offered beside it. */
type Dimension = { key: string; labelKo: string; values: string[] };
const label = (dimension: Dimension) => publicDimensionLabelV126(dimension.key, dimension.labelKo);

const a64Status: Dimension = {
  key: "a64Status",
  labelKo: "a64Status",
  values: ["Pending additional documentation from activity participant", "Transition fee payment pending", "Waiting for HP approval", "전환 요청 45건 중 베트남 DNA 승인 23건"],
};
const recordStatus: Dimension = { key: "recordStatus", labelKo: "recordStatus", values: ["다국가 PoA — 해당국 승인·상태 기재 없음", "사업참여자 추가서류 대기", "유치국 승인 대기", "전환 수수료 납부 대기"] };

describe("withoutRawTwinSelectorsV164", () => {
  it("drops the English status column when the Korean one has the same name (VNM E-002)", () => {
    expect(label(a64Status)).toBe("상태");
    expect(label(recordStatus)).toBe("상태");
    expect(withoutRawTwinSelectorsV164([a64Status, recordStatus], label).map((dimension) => dimension.key)).toEqual(["recordStatus"]);
    expect(withoutRawTwinSelectorsV164([recordStatus, a64Status], label).map((dimension) => dimension.key)).toEqual(["recordStatus"]);
  });

  it("keeps selectors that have different names, whatever language their values are in", () => {
    const sector: Dimension = { key: "sector", labelKo: "부문", values: ["Energy", "Waste"] };
    const city: Dimension = { key: "city", labelKo: "도시", values: ["Hanoi", "Hue"] };
    expect(withoutRawTwinSelectorsV164([sector, city, recordStatus], label)).toHaveLength(3);
  });

  it("keeps both selectors of one name when both read the same way", () => {
    const first: Dimension = { key: "status", labelKo: "상태", values: ["발효", "서명"] };
    const second: Dimension = { key: "a64Status", labelKo: "a64Status", values: ["진행", "중단"] };
    expect(withoutRawTwinSelectorsV164([first, second], label)).toHaveLength(2);
    const raw: Dimension = { key: "recordStatus", labelKo: "recordStatus", values: ["Open", "Closed"] };
    expect(withoutRawTwinSelectorsV164([raw, a64Status], label)).toHaveLength(2);
  });

  it("returns the selectors in their order and never changes a value list", () => {
    const others: Dimension[] = [{ key: "city", labelKo: "도시", values: ["하노이"] }, a64Status, { key: "role", labelKo: "role", values: ["역할 A", "역할 B"] }, recordStatus];
    const kept = withoutRawTwinSelectorsV164(others, label);
    expect(kept.map((dimension) => dimension.key)).toEqual(["city", "role", "recordStatus"]);
    expect(kept[2].values).toEqual(recordStatus.values);
  });
});
