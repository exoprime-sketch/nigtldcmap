import { describe, expect, test } from "@jest/globals";
import { readFileSync } from "fs";
import { resolve } from "path";
import type { CountryMapLayerV122 } from "../../data/countries/countryDataTypesV122";
import { countryAssetPathV158 } from "../../data/countryContext";
import { createMapPointPopupV152 } from "./mapPointPopupV152";

const layers: CountryMapLayerV122[] = JSON.parse(
  readFileSync(resolve(__dirname, "../../../public", countryAssetPathV158("VNM", "map-index.json").replace(/^\//, "")), "utf8")
).layers;
const layerOf = (elementId: string) => layers.find((layer) => layer.elementId === elementId)!;

const rowsOf = (popup: HTMLElement) =>
  [...popup.querySelectorAll("dt")].map((dt) => [dt.textContent, dt.nextElementSibling?.textContent]);

describe("a road/rail popup says its name once and reads its route numbers", () => {
  const popup = createMapPointPopupV152({
    layer: layerOf("A-027"),
    properties: { name: "Quốc lộ 14", ref: "QL.14;HCM", class: "간선도로", lengthKm: 123.4 },
    primary: true,
  });

  test("the name is the title, not also a 이름 row", () => {
    expect(popup.querySelector("strong")?.textContent).toBe("Quốc lộ 14");
    expect(rowsOf(popup).map(([label]) => label)).not.toContain("이름");
    expect(popup.textContent?.match(/Quốc lộ 14/gu)).toHaveLength(1);
  });

  test("OSM's ';' between route numbers is not shown", () => {
    expect(rowsOf(popup)).toContainEqual(["노선 번호", "QL.14 · HCM"]);
    expect(popup.textContent).not.toContain(";");
  });

  test("a row the title does not repeat is kept", () => {
    expect(rowsOf(popup).map(([label]) => label)).toContain("구분");
  });
});

describe("an area's representative point says it is not the site", () => {
  test("a delivery that states its precision ('행정구역(구역) 중심점', Bangladesh organisations) gets the note", () => {
    const popup = createMapPointPopupV152({
      layer: layerOf("E-004"),
      properties: { name: "ADB", locationPrecision: "행정구역(구역) 중심점", city: "Dhaka" },
      primary: true,
    });
    expect(popup.textContent).toContain("소재 지역의 대표 위치");
  });

  test("an exact point has no such note", () => {
    const popup = createMapPointPopupV152({ layer: layerOf("E-004"), properties: { name: "ADB", locationPrecision: "원천 제공 좌표" }, primary: true });
    expect(popup.textContent).not.toContain("대표 위치");
  });
});
