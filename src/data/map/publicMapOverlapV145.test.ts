import { describe, expect, it } from "@jest/globals";
import { mapOverlapSummariesV145, MapOverlapInputV145 } from "./publicMapOverlapV145";
import { readFileSync } from "fs";
import { resolve } from "path";
import { countryPublicDirV158 } from "../countryContext";

const plan: MapOverlapInputV145 = {
  elementId: "C-016", selectionKey: "VN-23", role: "primary", title: "재생에너지 지역계획", label: "Hà Tĩnh",
  properties: { value: 250, hasValue: true, unit: "MW", variableLabel: "옥상태양광 계획용량", period: "2025-2030" },
};
const line: MapOverlapInputV145 = {
  elementId: "A-024", selectionKey: "line-1", role: "context", title: "베트남 송전망", label: "500 kV · 272.1 km",
  properties: { voltageKv: 500, lengthKm: 272.1 }, period: "2016",
};

describe("primary-first feature summaries", () => {
  it("shows the primary first even when the selected context was the first hit", () => {
    const input = [line, plan];
    const result = mapOverlapSummariesV145(input);
    expect(result[0]).toMatchObject({ title: plan.title, value: "250 MW", place: "Hà Tĩnh", context: "옥상태양광 계획용량 · 2025-2030" });
    expect(result[1]).toMatchObject({ value: "500 kV · 272.1 km", context: "2016" });
    expect(input[0]).toBe(line);
  });
  it("uses the newly selected variable and period, not a previous popup", () => {
    expect(mapOverlapSummariesV145([{ ...plan, properties: { value: 720, unit: "MW", variableLabel: "풍력 계획용량", period: "2031-2035" } }])[0])
      .toMatchObject({ value: "720 MW", context: "풍력 계획용량 · 2031-2035" });
  });
  it("preserves a true zero", () => {
    expect(mapOverlapSummariesV145([{ ...plan, properties: { ...plan.properties, value: 0 } }])[0].value).toBe("0 MW");
  });
  it.each([null, undefined, "", false, "bad"])("does not turn missing value %s into zero", (value) => {
    expect(mapOverlapSummariesV145([{ ...plan, properties: { ...plan.properties, value } }])[0].value).toBe("선택한 항목의 자료 없음");
  });
  it("respects an explicit missing flag even when a numeric property exists", () => {
    expect(mapOverlapSummariesV145([{ ...plan, properties: { ...plan.properties, value: 0, hasValue: false } }])[0].value).toBe("선택한 항목의 자료 없음");
  });
  it("does not invent a primary when only a context feature is hit", () => {
    expect(mapOverlapSummariesV145([line])[0].role).toBe("context");
  });
  it("keeps separate features of one layer distinct, with primary entries before context", () => {
    expect(mapOverlapSummariesV145([line, plan, { ...plan, selectionKey: "VN-24", label: "Quảng Bình" }]).map((s) => s.selectionKey))
      .toEqual(["VN-23", "VN-24", "line-1"]);
  });
  it("retains source-specific plant capacity, fuel and reference year", () => {
    const [result] = mapOverlapSummariesV145([{ ...plan, elementId: "A-023", title: "발전소", label: "Vung Ang", properties: { capacityMw: 1200, referenceYear: 2021 }, facts: ["발전원 석탄 · 용량 1,200 MW", "상태 운영"] }]);
    expect(result).toMatchObject({ value: "1,200 MW", place: "Vung Ang", context: "2021", facts: ["발전원 석탄", "상태 운영"] });
  });
  it("keeps regional rather than province-specific meaning", () => {
    const [result] = mapOverlapSummariesV145([{ ...plan, elementId: "B-021", properties: { value: 53.9, unit: "점", period: "2023" }, regionNote: "북중부 권역값" }]);
    expect(result.context).toBe("2023 · 북중부 권역값");
  });
  it("shows a real institution attribute without making a number", () => {
    const [result] = mapOverlapSummariesV145([{ ...plan, elementId: "E-004", properties: {}, facts: ["협력분야 재생에너지", "소재 도시 하노이"] }]);
    expect(result.value).toBe("협력분야 재생에너지");
    expect(result.facts).toEqual(["소재 도시 하노이"]);
  });
  it("does not invent zero-length lines", () => {
    expect(mapOverlapSummariesV145([{ ...line, properties: { voltageKv: 500, lengthKm: null } }])[0].value).toBe("500 kV");
  });
  it("does not repeat raw choropleth fields or line facts", () => {
    const results = mapOverlapSummariesV145([
      { ...plan, facts: ["adm1Name Hà Tĩnh", "value 250", "unit MW"] },
      { ...line, facts: ["전압 500 kV", "확인된 길이 272.1 km"] },
    ]);
    expect(results.every((result) => result.facts.length === 0)).toBe(true);
  });
  it("matches the delivered Hà Tĩnh rooftop solar values at both selectable periods", () => {
    const asset = JSON.parse(readFileSync(resolve(process.cwd(), `${countryPublicDirV158("VNM")}/spatial/layers/c-016.json`), "utf8"));
    const rows = asset.values.filter((row: any) => row.adm1Code === "VN-23" && row.variable === "dmt-mai-nha");
    expect(rows).toHaveLength(2);
    expect(rows.map((row: any) => mapOverlapSummariesV145([{ ...plan, properties: { ...row, hasValue: true } }])[0].value)).toEqual(["313 MW", "68 MW"]);
  });
});

describe("V164: a feature with a name leads with the name, not its first attribute", () => {
  const office: MapOverlapInputV145 = {
    elementId: "E-004", selectionKey: "e4-1", role: "primary", title: "국제기구 현지사무소", label: "ADB",
    properties: { name: "ADB", orgType: "다자개발은행", city: "Hanoi", officeProgram: "Viet Nam Resident Mission" },
    facts: ["협력분야·업무 Viet Nam Resident Mission", "도시 하노이 (Hanoi)", "기관 유형 다자개발은행"],
  };
  it("puts the organisation name on the bold line and relabels the programme field", () => {
    const [result] = mapOverlapSummariesV145([office]);
    expect(result.value).toBe("ADB");
    expect(result.place).toBe("사무소·프로그램 Viet Nam Resident Mission");
    expect(result.facts).toEqual(["도시 하노이 (Hanoi)", "기관 유형 다자개발은행"]);
  });
  it("drops a line that says the work is unknown instead of showing it as a fact", () => {
    const [result] = mapOverlapSummariesV145([
      { ...office, elementId: "E-019", label: "KOTRA 호치민 무역관", properties: { name: "KOTRA 호치민 무역관" }, facts: ["담당 업무 미확인 — 원천 미게시", "도시 호찌민 (Ho Chi Minh City)"] },
    ]);
    expect(result.value).toBe("KOTRA 호치민 무역관");
    expect([result.place, ...result.facts].join(" | ")).not.toContain("미확인");
  });
  it("does not print the name twice when an 이름 fact repeats it (OSM water facilities)", () => {
    const [result] = mapOverlapSummariesV145([
      { ...office, elementId: "A-028", label: "Đập Lìa", properties: { name: "Đập Lìa", kind: "dam" }, facts: ["종류 댐", "이름 Đập Lìa", "면적 0.01 km²"] },
    ]);
    expect(result.value).toBe("Đập Lìa");
    expect([result.place, ...result.facts]).toEqual(["종류 댐", "면적 0.01 km²"]);
  });
  it("calls an unnamed dam 이름 없는 댐 and names the place, instead of the bare kind", () => {
    const [result] = mapOverlapSummariesV145([
      {
        ...office, elementId: "A-028", label: "댐",
        properties: { name: null, kind: "dam", kindLabel: "댐", adm1Name34: "Quảng Trị" },
        facts: ["종류 댐", "댐 마루 길이 0.28 km", "성·시(2025) 꽝찌 (Quảng Trị)"],
      },
    ]);
    expect(result.value).toBe("이름 없는 댐 · 꽝찌 (Quảng Trị)");
    expect([result.place, ...result.facts]).toEqual(["댐 마루 길이 0.28 km"]);
  });
  it("keeps the old reading for a property list without a name key", () => {
    const [result] = mapOverlapSummariesV145([{ ...office, label: "Hà Tĩnh", properties: {} }]);
    expect(result.value).toBe("사무소·프로그램 Viet Nam Resident Mission");
  });
});
