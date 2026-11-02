import { describe, expect, it, test } from "@jest/globals";
import { boundaryPopupLineV151, createPublicMapPopupContentV129 } from "./mapPublicPopupV129";

/** The compact shape `memberSummaryV151` writes into a feature's properties. */
function summary(kind: string, members: Array<[string, string, number | null]>) {
  const present = members.filter((member) => member[2] !== null);
  return JSON.stringify({
    u: "VN-TTH",
    n: "후에",
    k: kind,
    v: present.length ? present.reduce((sum, member) => sum + (member[2] as number), 0) : null,
    c: present.length,
    m: members.length,
    mn: null,
    mx: null,
    p: false,
    cf: false,
    ms: members,
  });
}

describe("the boundary line of a popup never states a processing remark", () => {
  test("a unit the 2025 reform did not merge says nothing instead of '개편에서 합쳐지지 않은 성·시'", () => {
    for (const kind of ["sum", "area-weighted-mean", "count-sum", "membership-or"]) {
      const line = boundaryPopupLineV151({ memberSummary: summary(kind, [["VN-26", "Thừa Thiên Huế", 3]]) }, "건");
      expect(line).toBe("");
    }
  });

  test("a merged unit still reads its composition", () => {
    const line = boundaryPopupLineV151(
      { memberSummary: summary("sum", [["VN-A", "A", 10], ["VN-B", "B", 20]]) },
      "건"
    );
    expect(line).toContain("구성 2개 성·시");
    expect(line).toContain("합계");
  });
});

describe("public map popup (V173)", () => {
  it("does not spell out a unit after a value", () => {
    const popup = createPublicMapPopupContentV129("수력 이론 잠재량", ["럼동 · 이론 총잠재량 22,204 GWh/년", "성·시 34개 중 1위", "기준 2017"]);
    expect(popup.textContent).toContain("22,204 GWh/년");
    expect(popup.textContent).not.toContain("기가와트시");
  });

  it("glosses SSP by emission level and leaves the unit unexpanded", () => {
    const popup = createPublicMapPopupContentV129("미래기후 전망", ["떠이닌 · 연평균 기온 · SSP2-4.5 28.86 °C", "기준 2025"]);
    expect(popup.textContent).toContain("SSP2-4.5(중간 배출 경로)");
    expect(popup.textContent).not.toContain("공통사회경제경로");
    expect(popup.textContent).not.toContain("섭씨도");
  });
});
