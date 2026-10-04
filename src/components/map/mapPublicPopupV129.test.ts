import { describe, expect, test } from "@jest/globals";
import { boundaryPopupLineV151 } from "./mapPublicPopupV129";

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
