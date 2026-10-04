import { afterEach, beforeEach, describe, expect, test } from "@jest/globals";
import { act } from "react-dom/test-utils";
import { createRoot } from "react-dom/client";
import type { Root } from "react-dom/client";
import type { VietnamEntityV124 } from "../../../data/vietnam/vietnamTypesV124";
import PublicEntityCardGridV131, { basinCardV164 } from "./PublicEntityCardGridV131";

(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

/**
 * V164-3 (WP-E): BGD B-023's gauging cards had only a site name and BGD B-025's basin
 * cards only an id with the area cut off. The entities are test inputs shaped like
 * the delivered rows (the columns these cards read, nothing else).
 */
function gauge(id: string, name: string, value: number, unit: string, year: number): VietnamEntityV124 {
  return {
    recordId: id,
    elementId: "B-023",
    entityType: "entity",
    name,
    latitude: 25.025,
    longitude: 89.675,
    geometryType: "point",
    normalizedAttributes: {
      지점_유역명: "Bahadurabad",
      지표명: name,
      값: value,
      단위: unit,
      기준연도: year,
      공간_단위: "point",
      위치_설명: "브라마푸트라(자무나) 본류 · BWDB 상설 수문관측소 (Brahmaputra (Jamuna) River)",
    },
    rawAttributes: {},
    provenance: {},
  } as unknown as VietnamEntityV124;
}

function basin(id: string, hybas: number, kind: string, area: number | null): VietnamEntityV124 {
  return {
    recordId: id,
    elementId: "B-025",
    entityType: "entity",
    name: `BGD_${hybas}`,
    geometryType: "polygon",
    normalizedAttributes: {
      // the delivery's record key equals the row name, which is why the title is composed
      레코드_키: `BGD_${hybas}`,
      개체_구분_Basin_Country: "Basin",
      유역_ID_HydroBASINS_MAIN_BAS: hybas,
      유역_구분_국내_완결_국제_공유: kind,
      자국_내_면적_km_GIS_산출: area,
      총_유역면적_km_GIS_산출: 21390.6,
    },
    rawAttributes: {},
    note: "주 기술 32(물 부문) · 부 기술 5(수력) · [GIS 산출] 자국 내 면적 순위 63",
    provenance: {},
  } as unknown as VietnamEntityV124;
}

let host: HTMLDivElement;
let root: Root;
beforeEach(() => {
  host = document.createElement("div");
  document.body.appendChild(host);
  root = createRoot(host);
});
afterEach(() => {
  act(() => root.unmount());
  host.remove();
});

const titles = () => Array.from(host.querySelectorAll("[data-testid='public-entity-card-title']")).map((node) => node.textContent);
const cards = () => Array.from(host.querySelectorAll("[data-testid='public-entity-card-v131']"));

describe("B-023 gauging cards", () => {
  test("a card says which measure it is, not only the site", () => {
    const entities = [
      gauge("g1", "브라마푸트라(자무나)강(Bahadurabad) 4월 평균 유량", 12883.454, "m3/s", 2024),
      gauge("g2", "브라마푸트라(자무나)강(Bahadurabad) 5월 평균 유량", 20512.2, "m3/s", 2024),
      gauge("g3", "브라마푸트라(자무나)강(Bahadurabad) 건기·우기 유량비 - 2005년", 11.881, "비(倍)", 2005),
    ];
    act(() => root.render(<PublicEntityCardGridV131 entities={entities} template="generic" detailTemplate="spatial" />));
    const shown = titles();
    expect(shown).toHaveLength(3);
    // three cards of one site are told apart by the measure, and each says it
    expect(new Set(shown).size).toBe(3);
    expect(shown[0]).toContain("4월 평균 유량");
    expect(shown[1]).toContain("5월 평균 유량");
    expect(shown[2]).toContain("유량비");
    // the site name is not repeated inside the measure it already leads
    expect(shown[0]).not.toMatch(/\(Bahadurabad\)/u);
    // the main value of each card is in its facts, grouped and with its unit
    const facts = cards().map((card) => card.querySelector("[data-testid='public-entity-card-facts']")?.textContent || "");
    expect(facts[0]).toContain("12,883");
    expect(facts[0]).toContain("m3/s");
  });
});

describe("B-025 basin cards", () => {
  test("the id is the title; the kind is a badge and the area a fact", () => {
    act(() =>
      root.render(
        <PublicEntityCardGridV131
          entities={[basin("b1", 4080024890, "국제 공유", 7.1), basin("b2", 4080025450, "국내 완결", 1234.56)]}
          template="generic"
          detailTemplate="spatial"
        />
      )
    );
    expect(titles()).toEqual(["HydroBASINS 유역 4080024890", "HydroBASINS 유역 4080025450"]);
    const first = cards()[0];
    expect(first.querySelector(".pec131-card__badges")?.textContent).toContain("국제 공유");
    const facts = first.querySelector("[data-testid='public-entity-card-facts']")?.textContent || "";
    expect(facts).toContain("자국 내 면적(GIS 산출)");
    expect(facts).toContain("7.1 km²");
    expect(cards()[1].querySelector("[data-testid='public-entity-card-facts']")?.textContent).toContain("1,234.6 km²");
  });

  test("a basin without an area column has no area fact and no zero in its place", () => {
    const entity = basin("b3", 4080029999, "국내 완결", null);
    expect(basinCardV164(entity, "HydroBASINS 유역 4080029999 · 국내 완결")?.fact).toBeNull();
    act(() => root.render(<PublicEntityCardGridV131 entities={[entity]} template="generic" detailTemplate="spatial" />));
    expect(cards()[0].textContent).not.toContain("0 km²");
  });

  test("the first delivery's column name (Viet Nam) gives one area fact, not two", () => {
    const entity = basin("v1", 4080012345, "국내 완결", 4321.5);
    const attributes = entity.normalizedAttributes as Record<string, unknown>;
    attributes["베트남_내_면적_km_GIS_산출"] = attributes["자국_내_면적_km_GIS_산출"];
    delete attributes["자국_내_면적_km_GIS_산출"];
    act(() => root.render(<PublicEntityCardGridV131 entities={[entity]} template="generic" detailTemplate="spatial" />));
    const facts = Array.from(host.querySelectorAll("[data-testid='public-entity-card-facts'] > div")).map((node) => node.textContent);
    expect(facts.filter((text) => /4,?321/u.test(text || ""))).toHaveLength(1);
  });

  test("only B-025 titles are split", () => {
    const other = { ...basin("x", 1, "국제 공유", 7.1), elementId: "B-026" } as VietnamEntityV124;
    expect(basinCardV164(other, "HydroBASINS 유역 1 · 국제 공유")).toBeNull();
    expect(basinCardV164(basin("y", 1, "국제 공유", 7.1), "한글 이름의 유역")).toBeNull();
  });
});
