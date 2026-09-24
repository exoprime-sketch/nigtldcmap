import { test, expect } from "@jest/globals";
import { readFileSync } from "fs";
import { resolve } from "path";
import { monthlyClimateV147, nationalSeriesV147, burInventoryV147, uniqueNumericV147, allowsRelativeChangeV147, changeUnitV147 } from "./detailModelsV147";
import type { SemanticObservationV125 } from "./semanticTypesV125";
import type { VietnamEntityV124 } from "../vietnam/vietnamTypesV124";
import { countryPublicDirV158 } from "../countryContext";

const source = (id: string) => JSON.parse(readFileSync(resolve(__dirname, `../../../${countryPublicDirV158("VNM")}/downloads/${id}.json`), "utf8"));

test("month order and values come from explicit monthly indicators, not 1991 observations", () => {
  const m = monthlyClimateV147(source("b-001").observations);
  expect(m).toHaveLength(12);
  expect(m.map((r) => r.month)).toEqual([1,2,3,4,5,6,7,8,9,10,11,12]);
  expect(m[0]).toMatchObject({ precipitation:38.75, temperature:20.26, season:"건기" });
  expect(m[7]).toMatchObject({ precipitation:263.07, temperature:27.2, season:"우기" });
  expect(m.map((r) => r.precipitation)).toEqual([38.75,25.05,44.18,76.09,161.57,214.08,248.08,263.07,239.73,218.04,162.71,82.74]);
  expect(m.reduce((n,r) => n + r.precipitation!,0)).toBeCloseTo(1774.09,2);
});
test("absent/duplicated months are not fabricated", () => {
  expect(monthlyClimateV147([])[0].temperature).toBeNull();
  const r = {indicatorId:"B-001_tas_month_norm_jan", value:20} as SemanticObservationV125;
  expect(monthlyClimateV147([r,r])[0].temperature).toBeNull();
  expect(uniqueNumericV147([{value:0}])).toBe(0);
  expect(uniqueNumericV147([{value:"12"}])).toBeNull();
});
test.each(["b-029","b-037","b-039","b-040"])("%s national rows retain exact label/unit/year/value", (id) => {
  const rows: VietnamEntityV124[] = source(id).entities;
  const series = nationalSeriesV147(rows);
  expect(series.length).toBeGreaterThan(0);
  for (const s of series) for (const p of s.points) {
    const row = rows.find((r) => r.recordId === p.id)!;
    expect(row.normalizedAttributes["전국_지표명"]).toBe(s.label);
    expect(row.normalizedAttributes["전국_단위"]).toBe(s.unit);
    expect(p.value).toBe(row.normalizedAttributes["전국_값"]);
    expect(p.conflict).toBe(false);
  }
});
test("national values do not merge products or accept duplicate years", () => {
  const rows: VietnamEntityV124[] = source("b-037").entities;
  const series = nationalSeriesV147(rows);
  expect(series.some((s)=>s.label.includes("MODIS"))).toBe(true);
  expect(series.some((s)=>s.label.includes("WorldCover"))).toBe(true);
  const row = rows.find((r)=>r.normalizedAttributes["전국_지표명"])!;
  expect(nationalSeriesV147([row,row])[0].points[0]).toMatchObject({value:null, conflict:true});
});
test("BUR sectors neither double count totals nor hide negative sinks/missing cells", () => {
  const b = burInventoryV147(source("c-002").entities);
  expect(b.map((r)=>r.total)).toEqual([205832.2,46094.64,44069.74,20738.38]);
  expect(b.reduce((n,r)=>n+r.total!,0)).toBeCloseTo(316734.96,2);
  expect(b[2].gases.CO2).toBe(-37489.34);
  expect(b[0].gases.HFCs).toBeNull();
  expect(b[1].gases.HFCs).toBe(23.32);
});

test("a count incorrectly labelled MW is flagged without silently changing source units", () => {
  const own = nationalSeriesV147(source("b-039").entities).find((s) => s.label.includes("개소수(개)"));
  expect(own?.unit).toBe("MW");
  expect(own?.unitConflict).toBe(true);
});
test("BUR duplicate source rows fail closed", () => {
  const rows: VietnamEntityV124[] = source("c-002").entities;
  const row=rows.find((r)=>r.name === "BUR3(2016) — 1 Energy(에너지)")!;
  expect(burInventoryV147([...rows,row])[0].total).toBeNull();
});
test("ordinal and percentage-point changes preserve meaning", () => {
  expect(allowsRelativeChangeV147("순위")).toBe(false);
  expect(allowsRelativeChangeV147("지수")).toBe(false);
  expect(allowsRelativeChangeV147("℃")).toBe(false);
  expect(allowsRelativeChangeV147("USD")).toBe(true);
  expect(changeUnitV147("%/yr")).toBe("%p/yr");
});
