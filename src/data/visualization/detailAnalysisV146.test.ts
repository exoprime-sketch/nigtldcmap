import { test, expect } from "@jest/globals";
import type { VietnamEntityV124 } from "../vietnam/vietnamTypesV124";
import { medianV146, signedBarV146 } from "./analysisMathV146";
import { ndcTargetsV146, NDC_SOURCE_V146 } from "./ndcTargetsV146";
import { facilityRegionsV146 } from "./facilityRegionsV146";
import { lcoeRangesV146 } from "./lcoeRangesV146";
import type { SemanticObservationV125 } from "./semanticTypesV125";
import { publicDimensionLabelV126 } from "./publicCopyRegistryV126";

test("public selectors do not expose the source field suffix", () => {
  expect(publicDimensionLabelV126("기술분야_Sectors", "기술분야_Sectors")).toBe("기술 분야");
});

test("LCOE bounds are matched by technology/year/unit and never averaged or fabricated", () => {
  const row = (category: string, value: number, year = 2023, unit = "USD/MWh") => ({ dimensionLabels: { category }, dimensions: {}, value, year, unit } as unknown as SemanticObservationV125);
  const rows = [row("태양광(기준값)", 70), row("태양광(상한)", 105), row("태양광(하한)", 53), row("태양광(기준값)", 37, 2030), row("태양광(하한)", 1, 2023, "%")];
  expect(lcoeRangesV146(rows)[0]).toMatchObject({ min: 53, benchmark: 70, max: 105, valid: true });
  expect(lcoeRangesV146(rows)[1]).toMatchObject({ min: null, max: null, valid: false });
  expect(lcoeRangesV146([...rows, rows[0]])[0].valid).toBe(false);
});

const entity = (name: string, value: number, attrs = {}) => ({ recordId: `${name}-${value}`, name, elementId: "C-001", indicatorId: "C-001_mitigation_target", normalizedAttributes: { "속성1_레코드명": name, "속성3_값": value, "속성4_시점": "2030", "속성19_원문URL": NDC_SOURCE_V146, ...attrs } } as unknown as VietnamEntityV124);

test("median uses both central values and ignores non-finite inputs", () => {
  expect(medianV146([4, 1, 2, 3])).toBe(2.5);
  expect(medianV146([9, 1, 3, NaN])).toBe(3);
  expect(medianV146([])).toBeNull();
});
test("negative and positive bars share zero, while zero has no visible width", () => {
  expect(signedBarV146(-5, [-5, 5])).toEqual({ zero: 50, left: 0, width: 50, signed: true });
  expect(signedBarV146(5, [-5, 5])).toEqual({ zero: 50, left: 50, width: 50, signed: true });
  expect(signedBarV146(0, [-5, 5]).width).toBe(0);
  expect(signedBarV146(0, [0]).width).toBe(0);
});
test("NDC conditions are source-reviewed, not inferred from order", () => {
  const result = ndcTargetsV146([entity("에너지", 227), entity("에너지", 64.8)]);
  expect(result.sectors[0]).toMatchObject({ own: 64.8, supported: 227 });
  expect(result.unmatched).toHaveLength(0);
});
test("NDC unknown values, dates, sources and duplicate rows do not inherit a condition", () => {
  const row = entity("총량 감축률", 15.8);
  expect(ndcTargetsV146([row, row]).totals[0].own).toBeNull();
  expect(ndcTargetsV146([entity("총량 감축률", 16)]).totals[0].own).toBeNull();
  expect(ndcTargetsV146([entity("총량 감축률", 15.8, { "속성4_시점": "2035" })]).totals[0].own).toBeNull();
  expect(ndcTargetsV146([entity("총량 감축률", 15.8, { "속성19_원문URL": "https://example.org" })]).totals[0].own).toBeNull();
});
test("facility regions retain source geography and validate sector sum", () => {
  const row = entity("의무 대상 시설 — An Giang", 27, { "속성22_행정코드P_code": "VN91", "속성20_지역_원문": "An Giang", "속성6_분류": "공상(Công Thương) 7 / 교통운송 6 / 건설 11 / 농업·환경 3" });
  const model = facilityRegionsV146([row, entity("전국 시설 합계", 2441)]);
  expect(model.regions).toHaveLength(1);
  expect(model.regions[0].sectors).toHaveLength(4);
  expect(model.regions[0].sectorTotalMatches).toBe(true);
  expect(model.other).toHaveLength(1);
  const mismatch = entity("대상 시설 — An Giang", 27, { "속성22_행정코드P_code": "VN91", "속성20_지역_원문": "An Giang", "속성6_분류": "건설 11" });
  expect(facilityRegionsV146([mismatch]).regions[0].sectorTotalMatches).toBe(false);
});
