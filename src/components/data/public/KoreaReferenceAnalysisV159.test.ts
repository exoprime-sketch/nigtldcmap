import { expect, test } from "@jest/globals";
import type { VietnamEntityV124 } from "../../../data/vietnam/vietnamTypesV124";
import { koreaTechReadinessPointsV159, referenceSubjectLabelV159 } from "./KoreaReferenceAnalysisV159";

// E-016 rows as delivered (1.2_entity): one populated '전체' record, sector rows marked missing.
const entity = (recordId: string, sector: string, level: string | null, gap: string | null, leader: string | null) =>
  ({
    recordId,
    elementId: "E-016",
    name: sector,
    normalizedAttributes: { sector, field_8c8721a1: level, field_a1c8da40: gap, field_edf04a1a: leader, referenceYear: "2020" },
  }) as unknown as VietnamEntityV124;

test("E-016 points read the '전체' record: level, gap, leader", () => {
  const entities = [
    entity("r2", "기후기술: 감축(Mitigation)", null, null, null),
    entity("r1", "기후기술:전체 - 5년 후 전망(2025)", "80.8%", "3.4년", "미국(98.6)"),
  ];
  expect(koreaTechReadinessPointsV159(entities)).toEqual([
    { key: "reference-level", label: "기술수준", value: "80.8%" },
    { key: "reference-gap", label: "기술격차", value: "3.4년" },
    { key: "reference-leader", label: "최고국", value: "미국(98.6)" },
  ]);
});

test("a figure the '전체' record lacks is hidden; no '전체' record, no points", () => {
  expect(koreaTechReadinessPointsV159([entity("r1", "기후기술:전체 - 5년 후 전망(2025)", "80.8%", null, "미국(98.6)")]).map((p) => p.label)).toEqual(["기술수준", "최고국"]);
  expect(koreaTechReadinessPointsV159([entity("r2", "기후기술: 적응(Adaptation)", "70%", null, null)])).toEqual([]);
});

test("EUU prints as 유럽연합(EU); unknown codes print as delivered", () => {
  expect(referenceSubjectLabelV159("EUU")).toBe("유럽연합(EU)");
  expect(referenceSubjectLabelV159("XYZ")).toBe("XYZ");
});
