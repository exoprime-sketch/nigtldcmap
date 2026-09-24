import { test, expect } from "@jest/globals";
import { readFileSync } from "fs";
import { resolve } from "path";
import { mineralModelV153, percentChangeV153, remarkOf } from "./mineralResourcesV153";
import { countryPublicDirV158 } from "../countryContext";

const source = (id: string) =>
  JSON.parse(readFileSync(resolve(__dirname, `../../../${countryPublicDirV158("VNM")}/downloads/${id}.json`), "utf8"));

function inflate(bundle: { observations: Record<string, unknown>[]; recordDefaults?: { observations?: Record<string, unknown> } }) {
  const defaults = bundle.recordDefaults?.observations || {};
  return bundle.observations.map((row) => ({ ...defaults, ...row }));
}

test("B-046 names all eight reported minerals and the five USGS does not list", () => {
  const bundle = source("b-046");
  const model = mineralModelV153(inflate(bundle) as never, bundle.indicators);
  expect(model.measureLabel).toBe("확인 매장량");
  expect(model.reported.map((row) => row.mineral)).toEqual(["희토류", "텅스텐", "보크사이트", "흑연", "안티모니", "주석", "형석", "인광석"]);
  expect(model.missing.map((row) => row.mineral).sort()).toEqual(["구리", "니켈", "리튬", "망간", "코발트"]);
  const antimony = model.reported.find((row) => row.mineral === "안티모니")!;
  expect(antimony.latest?.value).toBe(54000);
  expect(antimony.unit).toBe("t (Sb 함량)");
  const ree = model.reported.find((row) => row.mineral === "희토류")!;
  expect(ree.worldRank).toBe(5);
  expect(ree.worldSharePercent).toBe(4.67);
  expect(model.reported.every((row) => row.indicatorId !== row.mineral)).toBe(true);
  expect(model.reported.find((row) => row.mineral === "안티모니")!.worldShareText).toBe("2.70% 이하");
  expect(remarkOf("[추정치] · 매장 세계 5위 · 세계 비중 4.67%. 종전 판본 22,000,000 → 3,500,000 t 하향 개정")).toBe("종전 판본 22,000,000 → 3,500,000 t 하향 개정");
  expect(remarkOf("[추정치] · 매장 세계 11위 · 세계 비중 2.70% 이하")).toBeNull();
  expect(remarkOf("[추정치] · ≈31억 t — 매장 세계 3위 · 세계 비중 10.69%(기니·호주 다음)")).toBe("≈31억 t (기니·호주 다음)");
});

test("B-047 keeps both years per mineral, the two unreported minerals and the REE note", () => {
  const bundle = source("b-047");
  const model = mineralModelV153(inflate(bundle) as never, bundle.indicators);
  expect(model.measureLabel).toBe("광산 생산량");
  expect(model.reported).toHaveLength(9);
  expect(model.years).toEqual([2024, 2025]);
  const tungsten = model.reported.find((row) => row.mineral === "텅스텐")!;
  expect(tungsten.values.map((entry) => [entry.year, entry.value, entry.estimated])).toEqual([[2024, 3400, false], [2025, 3000, true]]);
  expect(tungsten.worldRank).toBe(2);
  expect(model.missing.map((row) => row.mineral).sort()).toEqual(["구리", "망간"]);
  expect(model.notes).toHaveLength(1);
  expect(model.notes[0].label).toContain("희토류");
  expect(percentChangeV153(300, 150)).toBe(-50);
  expect(percentChangeV153(null, 150)).toBeNull();
});
