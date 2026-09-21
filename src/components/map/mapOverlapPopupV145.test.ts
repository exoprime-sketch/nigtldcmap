import { describe, expect, it } from "@jest/globals";
import { createMapOverlapPopupV145 } from "./mapOverlapPopupV145";
import { mapOverlapSummariesV145 } from "../../data/map/publicMapOverlapV145";

describe("map overlap popup DOM", () => {
  const summary = mapOverlapSummariesV145([{ elementId: "C-016", selectionKey: "VN-23", role: "primary", title: "재생에너지 지역계획", label: "Hà Tĩnh", properties: { value: 250, unit: "MW", period: "2025-2030" } }])[0];
  it("leads with the data title and value, with place and time below", () => {
    const popup = createMapOverlapPopupV145([summary]);
    expect(popup.querySelector("strong")?.textContent).toBe("재생에너지 지역계획");
    expect(popup.querySelector("b")?.textContent).toBe("250 MW");
    expect(popup.querySelector('[data-public-term-expansion-v134="true"]')).toBeNull();
    expect(popup.textContent).toContain("Hà Tĩnh2025-2030");
    expect(popup.textContent).not.toContain("개 데이터");
  });
  it("renders untrusted source names as text", () => {
    const popup = createMapOverlapPopupV145([{ ...summary, place: '<img src=x onerror="alert(1)">' }]);
    expect(popup.querySelector("img")).toBeNull();
    expect(popup.textContent).toContain("<img");
  });
  it("keeps the primary even when truncating other overlapping features", () => {
    const popup = createMapOverlapPopupV145([summary, ...Array.from({ length: 5 }, (_, i) => ({ ...summary, role: "context" as const, selectionKey: String(i) }))]);
    expect(popup.querySelectorAll("section")).toHaveLength(3);
    expect(popup.querySelector("section")?.dataset.layerRole).toBe("primary");
    expect(popup.textContent).toContain("다른 항목 3개");
  });
});
